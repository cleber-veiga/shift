"""
Workflow execution engine.

This engine executes validated workflow DAGs with:
- deterministic branch-local contexts
- explicit handle routing
- safe condition evaluation
- skipped node tracking
- cancellation checks between batches
"""

from __future__ import annotations

import asyncio
import ast
import logging
from collections import defaultdict, deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workflow_execution import (
    ExecutionStatusEnum,
    NodeExecution,
    NodeExecutionStatusEnum,
    WorkflowExecution,
)
from app.schemas.workflow.base import EdgeBase, NodeBase, WorkflowDefinition

from .nodes.base import DEFAULT_ROUTE_HANDLE, NodeProcessingError, NodeResult
from .nodes.factory import get_processor

logger = logging.getLogger(__name__)

MAX_CONCURRENCY = 10
_SKIP_REASON_DISABLED = "Node disabled."
_SKIP_REASON_NO_ACTIVE_INPUT = "No active incoming edge reached this node."


class WorkflowEngineError(Exception):
    """Base engine error."""


class WorkflowDefinitionError(WorkflowEngineError):
    """Raised when the workflow graph cannot be executed safely."""


class WorkflowExecutionCancelled(WorkflowEngineError):
    """Raised when execution is cancelled externally."""


class ContextMergeConflict(WorkflowEngineError):
    """Raised when parallel branches write conflicting values."""


@dataclass(slots=True)
class PlannedNodeRun:
    node: NodeBase
    input_context: dict[str, Any]
    should_run: bool
    skip_reason: str | None = None


@dataclass(slots=True)
class NodeRuntimeState:
    node_id: str
    status: NodeExecutionStatusEnum
    input_context: dict[str, Any]
    output: dict[str, Any] = field(default_factory=dict)
    context_after: dict[str, Any] | None = None
    emitted_handles: set[str] = field(default_factory=set)
    propagate: bool = False


class SafeExpressionEvaluator:
    """Small safe evaluator for edge expressions."""

    _ALLOWED_BIN_OPS = {
        ast.Add: lambda a, b: a + b,
        ast.Sub: lambda a, b: a - b,
        ast.Mult: lambda a, b: a * b,
        ast.Div: lambda a, b: a / b,
        ast.Mod: lambda a, b: a % b,
    }
    _ALLOWED_UNARY_OPS = {
        ast.Not: lambda value: not value,
        ast.USub: lambda value: -value,
        ast.UAdd: lambda value: +value,
    }
    _ALLOWED_COMPARE_OPS = {
        ast.Eq: lambda a, b: a == b,
        ast.NotEq: lambda a, b: a != b,
        ast.Gt: lambda a, b: a > b,
        ast.GtE: lambda a, b: a >= b,
        ast.Lt: lambda a, b: a < b,
        ast.LtE: lambda a, b: a <= b,
        ast.In: lambda a, b: a in b,
        ast.NotIn: lambda a, b: a not in b,
        ast.Is: lambda a, b: a is b,
        ast.IsNot: lambda a, b: a is not b,
    }
    _ALLOWED_FUNCTIONS = {
        "len": len,
        "min": min,
        "max": max,
        "sum": sum,
        "any": any,
        "all": all,
        "int": int,
        "float": float,
        "str": str,
        "bool": bool,
    }

    def evaluate(self, expression: str, context: dict[str, Any]) -> bool:
        tree = ast.parse(expression, mode="eval")
        value = self._eval(tree.body, {"data": context, **context})
        if not isinstance(value, bool):
            raise WorkflowDefinitionError(
                f"Edge condition must resolve to bool, got {type(value).__name__}."
            )
        return value

    def _eval(self, node: ast.AST, names: dict[str, Any]) -> Any:
        if isinstance(node, ast.Constant):
            return node.value
        if isinstance(node, ast.Name):
            if node.id in names:
                return names[node.id]
            raise WorkflowDefinitionError(f"Unknown name in condition: '{node.id}'")
        if isinstance(node, ast.BoolOp):
            values = [self._eval(value, names) for value in node.values]
            if isinstance(node.op, ast.And):
                return all(values)
            if isinstance(node.op, ast.Or):
                return any(values)
            raise WorkflowDefinitionError("Unsupported boolean operator in condition.")
        if isinstance(node, ast.UnaryOp):
            operator = self._ALLOWED_UNARY_OPS.get(type(node.op))
            if operator is None:
                raise WorkflowDefinitionError("Unsupported unary operator in condition.")
            return operator(self._eval(node.operand, names))
        if isinstance(node, ast.BinOp):
            operator = self._ALLOWED_BIN_OPS.get(type(node.op))
            if operator is None:
                raise WorkflowDefinitionError("Unsupported binary operator in condition.")
            return operator(self._eval(node.left, names), self._eval(node.right, names))
        if isinstance(node, ast.Compare):
            left = self._eval(node.left, names)
            for op, comparator in zip(node.ops, node.comparators):
                right = self._eval(comparator, names)
                operator = self._ALLOWED_COMPARE_OPS.get(type(op))
                if operator is None or not operator(left, right):
                    return False
                left = right
            return True
        if isinstance(node, ast.Attribute):
            value = self._eval(node.value, names)
            if node.attr.startswith("_"):
                raise WorkflowDefinitionError("Private attributes are not allowed in conditions.")
            if isinstance(value, dict):
                return value.get(node.attr)
            return getattr(value, node.attr)
        if isinstance(node, ast.Subscript):
            value = self._eval(node.value, names)
            index = self._eval(node.slice, names)
            return value[index]
        if isinstance(node, ast.Call):
            function = self._eval(node.func, names)
            if function not in self._ALLOWED_FUNCTIONS.values():
                raise WorkflowDefinitionError("Unsupported function call in condition.")
            args = [self._eval(arg, names) for arg in node.args]
            kwargs = {kw.arg: self._eval(kw.value, names) for kw in node.keywords}
            return function(*args, **kwargs)
        if isinstance(node, ast.List):
            return [self._eval(item, names) for item in node.elts]
        if isinstance(node, ast.Tuple):
            return tuple(self._eval(item, names) for item in node.elts)
        if isinstance(node, ast.Dict):
            return {
                self._eval(key, names): self._eval(value, names)
                for key, value in zip(node.keys, node.values)
            }
        raise WorkflowDefinitionError(
            f"Unsupported syntax in condition: {node.__class__.__name__}"
        )


class WorkflowEngine:
    """Main workflow execution orchestrator."""

    def __init__(self, db: AsyncSession, *, max_concurrency: int = MAX_CONCURRENCY):
        self.db = db
        self.max_concurrency = max_concurrency
        self._condition_evaluator = SafeExpressionEvaluator()

    async def execute(
        self,
        execution: WorkflowExecution,
        definition: WorkflowDefinition,
    ) -> dict[str, Any]:
        initial_context: dict[str, Any] = {
            "_execution_id": str(execution.id),
            "_workflow_id": str(execution.workflow_id),
            "_triggered_by": execution.triggered_by,
            **definition.variables,
            **(execution.input_data or {}),
        }

        execution.status = ExecutionStatusEnum.RUNNING
        execution.started_at = datetime.now(timezone.utc)
        await self.db.flush()

        if not definition.nodes:
            execution.status = ExecutionStatusEnum.SUCCESS
            execution.output_data = self._public_context(initial_context)
            execution.ended_at = datetime.now(timezone.utc)
            await self.db.flush()
            return initial_context

        graph = self._build_graph(definition)
        incoming_edges = self._build_incoming_edges(definition.edges)
        predecessors = {
            node.node_id: [edge.from_node_id for edge in incoming_edges[node.node_id]]
            for node in definition.nodes
        }

        node_states: dict[str, NodeRuntimeState] = {}
        pending: deque[str] = deque(
            node.node_id for node in definition.nodes if not predecessors[node.node_id]
        )
        queued = set(pending)
        completed: set[str] = set()
        semaphore = asyncio.Semaphore(self.max_concurrency)

        try:
            while pending:
                await self._ensure_not_cancelled(execution)

                batch = list(pending)
                pending.clear()
                queued.clear()

                plans = [
                    self._plan_node_run(
                        node_id=node_id,
                        nodes_map={node.node_id: node for node in definition.nodes},
                        initial_context=initial_context,
                        incoming_edges=incoming_edges,
                        node_states=node_states,
                    )
                    for node_id in batch
                ]

                results = await asyncio.gather(
                    *[
                        self._run_planned_node(
                            execution=execution,
                            plan=plan,
                            semaphore=semaphore,
                        )
                        for plan in plans
                    ],
                    return_exceptions=True,
                )

                for node_id, result in zip(batch, results):
                    if isinstance(result, Exception):
                        raise result
                    node_states[node_id] = result
                    completed.add(node_id)

                for node_id in batch:
                    for successor_id in graph[node_id]:
                        if successor_id in completed or successor_id in queued:
                            continue
                        if all(predecessor in completed for predecessor in predecessors[successor_id]):
                            pending.append(successor_id)
                            queued.add(successor_id)

            if len(completed) != len(definition.nodes):
                blocked = sorted({node.node_id for node in definition.nodes} - completed)
                raise WorkflowDefinitionError(
                    "Workflow finished with unresolved nodes: " + ", ".join(blocked)
                )

            final_context = self._build_final_context(
                initial_context=initial_context,
                graph=graph,
                node_states=node_states,
            )
            execution.status = ExecutionStatusEnum.SUCCESS
            execution.output_data = self._public_context(final_context)
            return final_context

        except WorkflowExecutionCancelled as exc:
            logger.info("Workflow %s cancelled: %s", execution.id, exc)
            execution.status = ExecutionStatusEnum.CANCELLED
            execution.error_message = str(exc)
            return initial_context
        except Exception as exc:
            logger.exception("Workflow execution failed: %s", execution.id)
            execution.status = ExecutionStatusEnum.FAILED
            execution.error_message = str(exc)
            raise
        finally:
            execution.ended_at = datetime.now(timezone.utc)
            await self.db.flush()

    def _build_graph(self, definition: WorkflowDefinition) -> dict[str, list[str]]:
        adjacency: dict[str, list[str]] = defaultdict(list)
        for node in definition.nodes:
            adjacency.setdefault(node.node_id, [])
        for edge in definition.edges:
            adjacency[edge.from_node_id].append(edge.to_node_id)
        return dict(adjacency)

    def _build_incoming_edges(self, edges: list[EdgeBase]) -> dict[str, list[EdgeBase]]:
        incoming: dict[str, list[EdgeBase]] = defaultdict(list)
        for edge in edges:
            incoming[edge.to_node_id].append(edge)
        return incoming

    def _plan_node_run(
        self,
        *,
        node_id: str,
        nodes_map: dict[str, NodeBase],
        initial_context: dict[str, Any],
        incoming_edges: dict[str, list[EdgeBase]],
        node_states: dict[str, NodeRuntimeState],
    ) -> PlannedNodeRun:
        node = nodes_map[node_id]
        node_incoming = incoming_edges.get(node_id, [])

        if not node_incoming:
            if node.disabled:
                return PlannedNodeRun(
                    node=node,
                    input_context=dict(initial_context),
                    should_run=False,
                    skip_reason=_SKIP_REASON_DISABLED,
                )
            return PlannedNodeRun(node=node, input_context=dict(initial_context), should_run=True)

        active_contexts: list[dict[str, Any]] = []
        for edge in node_incoming:
            predecessor = node_states[edge.from_node_id]
            if self._is_edge_active(edge=edge, predecessor=predecessor):
                if predecessor.context_after is None:
                    raise WorkflowDefinitionError(
                        f"Predecessor '{edge.from_node_id}' did not produce a context for '{node_id}'."
                    )
                active_contexts.append(predecessor.context_after)

        if not active_contexts:
            return PlannedNodeRun(
                node=node,
                input_context=dict(initial_context),
                should_run=False,
                skip_reason=_SKIP_REASON_NO_ACTIVE_INPUT,
            )

        merged_input = self._merge_contexts(
            [initial_context, *active_contexts],
            owner=f"node '{node_id}'",
        )

        if node.disabled:
            return PlannedNodeRun(
                node=node,
                input_context=merged_input,
                should_run=False,
                skip_reason=_SKIP_REASON_DISABLED,
            )

        return PlannedNodeRun(node=node, input_context=merged_input, should_run=True)

    async def _run_planned_node(
        self,
        *,
        execution: WorkflowExecution,
        plan: PlannedNodeRun,
        semaphore: asyncio.Semaphore,
    ) -> NodeRuntimeState:
        if not plan.should_run:
            propagate = plan.skip_reason == _SKIP_REASON_DISABLED
            return await self._record_skipped_node(
                execution=execution,
                plan=plan,
                propagate=propagate,
            )

        async with semaphore:
            await self._ensure_not_cancelled(execution)
            return await self._run_single_node(
                execution=execution,
                node=plan.node,
                input_context=plan.input_context,
            )

    async def _run_single_node(
        self,
        *,
        execution: WorkflowExecution,
        node: NodeBase,
        input_context: dict[str, Any],
    ) -> NodeRuntimeState:
        node_exec = NodeExecution(
            execution_id=execution.id,
            node_id=node.node_id,
            node_type=node.type,
            node_name=node.name,
            status=NodeExecutionStatusEnum.RUNNING,
            input_data=input_context,
            started_at=datetime.now(timezone.utc),
        )
        self.db.add(node_exec)
        await self.db.flush()

        try:
            processor = get_processor(
                node_type=node.type,
                node_id=node.node_id,
                config=node.config,
                db=self.db,
            )
            raw_result = await processor.process(dict(input_context))
            result = NodeResult.from_value(raw_result)
            context_after = self._merge_contexts(
                [input_context, result.output],
                owner=f"node '{node.node_id}' output",
            )
            node_exec.status = NodeExecutionStatusEnum.SUCCESS
            node_exec.output_data = result.output
            return NodeRuntimeState(
                node_id=node.node_id,
                status=NodeExecutionStatusEnum.SUCCESS,
                input_context=input_context,
                output=result.output,
                context_after=context_after,
                emitted_handles=result.emitted_handles or {DEFAULT_ROUTE_HANDLE},
                propagate=True,
            )
        except NodeProcessingError as exc:
            node_exec.status = NodeExecutionStatusEnum.FAILED
            node_exec.error_message = str(exc)
            raise
        except Exception as exc:
            node_exec.status = NodeExecutionStatusEnum.FAILED
            node_exec.error_message = f"Unexpected error: {exc}"
            raise NodeProcessingError(
                node_id=node.node_id,
                node_type=node.type,
                message=str(exc),
                original_error=exc,
            ) from exc
        finally:
            node_exec.ended_at = datetime.now(timezone.utc)
            await self.db.flush()

    async def _record_skipped_node(
        self,
        *,
        execution: WorkflowExecution,
        plan: PlannedNodeRun,
        propagate: bool,
    ) -> NodeRuntimeState:
        node_exec = NodeExecution(
            execution_id=execution.id,
            node_id=plan.node.node_id,
            node_type=plan.node.type,
            node_name=plan.node.name,
            status=NodeExecutionStatusEnum.SKIPPED,
            input_data=plan.input_context,
            output_data=plan.input_context if propagate else None,
            error_message=plan.skip_reason,
            started_at=datetime.now(timezone.utc),
            ended_at=datetime.now(timezone.utc),
        )
        self.db.add(node_exec)
        await self.db.flush()
        return NodeRuntimeState(
            node_id=plan.node.node_id,
            status=NodeExecutionStatusEnum.SKIPPED,
            input_context=plan.input_context,
            output={},
            context_after=plan.input_context if propagate else None,
            emitted_handles={DEFAULT_ROUTE_HANDLE} if propagate else set(),
            propagate=propagate,
        )

    async def _ensure_not_cancelled(self, execution: WorkflowExecution) -> None:
        await self.db.refresh(execution, attribute_names=["status"])
        if execution.status == ExecutionStatusEnum.CANCELLED:
            raise WorkflowExecutionCancelled(f"Execution '{execution.id}' was cancelled.")

    def _is_edge_active(self, *, edge: EdgeBase, predecessor: NodeRuntimeState) -> bool:
        if not predecessor.propagate or predecessor.context_after is None:
            return False
        if edge.from_handle and edge.from_handle not in predecessor.emitted_handles:
            return False
        if edge.condition is None:
            return True
        return self._condition_evaluator.evaluate(edge.condition.expression, predecessor.context_after)

    def _build_final_context(
        self,
        *,
        initial_context: dict[str, Any],
        graph: dict[str, list[str]],
        node_states: dict[str, NodeRuntimeState],
    ) -> dict[str, Any]:
        terminal_contexts: list[dict[str, Any]] = []
        for node_id, successors in graph.items():
            if successors:
                continue
            state = node_states[node_id]
            if state.propagate and state.context_after is not None:
                terminal_contexts.append(state.context_after)

        if not terminal_contexts:
            propagated_contexts = [
                state.context_after
                for state in node_states.values()
                if state.propagate and state.context_after is not None
            ]
            if not propagated_contexts:
                return initial_context
            terminal_contexts = propagated_contexts

        return self._merge_contexts(
            [initial_context, *terminal_contexts],
            owner="final workflow context",
        )

    def _merge_contexts(self, contexts: list[dict[str, Any]], *, owner: str) -> dict[str, Any]:
        merged: dict[str, Any] = {}
        for context in contexts:
            merged = self._merge_dicts(merged, context, owner=owner, path=())
        return merged

    def _merge_dicts(
        self,
        left: dict[str, Any],
        right: dict[str, Any],
        *,
        owner: str,
        path: tuple[str, ...],
    ) -> dict[str, Any]:
        merged = dict(left)
        for key, value in right.items():
            key_path = (*path, str(key))
            if key not in merged:
                merged[key] = value
                continue
            merged[key] = self._merge_values(
                merged[key],
                value,
                owner=owner,
                path=key_path,
            )
        return merged

    def _merge_values(
        self,
        left: Any,
        right: Any,
        *,
        owner: str,
        path: tuple[str, ...],
    ) -> Any:
        if left == right:
            return left
        if isinstance(left, dict) and isinstance(right, dict):
            return self._merge_dicts(left, right, owner=owner, path=path)
        raise ContextMergeConflict(
            f"Conflicting values while merging {owner} at '{'.'.join(path)}'. "
            "Use explicit merge nodes or distinct output fields for parallel branches."
        )

    def _public_context(self, context: dict[str, Any]) -> dict[str, Any]:
        return {key: value for key, value in context.items() if not key.startswith("_")}
