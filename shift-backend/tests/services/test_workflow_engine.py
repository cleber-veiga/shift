import asyncio
import sqlite3
import uuid
from contextlib import contextmanager
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Any

from pydantic import ValidationError

import app.db.base  # noqa: F401  # Ensure SQLAlchemy relationships are fully registered.
from app.models.workflow_execution import ExecutionStatusEnum, NodeExecutionStatusEnum, WorkflowExecution
from app.schemas.workflow.base import WorkflowDefinition
from app.services.workflow.engine import ContextMergeConflict, WorkflowDefinitionError, WorkflowEngine
from app.services.workflow.nodes.base import BaseNodeProcessor, NodeResult
from app.services.workflow.nodes.factory import get_processor, list_registered_processors, register_processor


NODE_BEHAVIOR: dict[str, NodeResult] = {}


@register_processor("wait")
class WaitTestProcessor(BaseNodeProcessor):
    async def process(self, context: dict[str, Any]) -> NodeResult:
        return NODE_BEHAVIOR.get(self.node_id, NodeResult(output={}))


class DummySession:
    def __init__(self) -> None:
        self.records: list[Any] = []

    def add(self, value: Any) -> None:
        self.records.append(value)

    async def flush(self) -> None:
        return None

    async def refresh(self, instance: Any, attribute_names: list[str] | None = None) -> None:
        return None


def _build_execution() -> WorkflowExecution:
    return WorkflowExecution(
        id=uuid.uuid4(),
        workflow_id=uuid.uuid4(),
        status=ExecutionStatusEnum.PENDING,
        triggered_by="manual",
        input_data={},
    )


@contextmanager
def assert_raises(expected_exception: type[BaseException]):
    try:
        yield
    except expected_exception:
        return
    raise AssertionError(f"Expected exception {expected_exception.__name__} was not raised.")


def test_workflow_definition_rejects_invalid_node_config() -> None:
    payload = {
        "nodes": [
            {
                "node_id": "http_1",
                "name": "HTTP",
                "group": "action",
                "type": "http_request",
                "config": {},
            }
        ],
        "edges": [],
    }

    with assert_raises(ValidationError):
        WorkflowDefinition.model_validate(payload)


def test_workflow_definition_rejects_cycles() -> None:
    payload = {
        "nodes": [
            {
                "node_id": "start",
                "name": "Start",
                "group": "logic",
                "type": "wait",
                "config": {},
            },
            {
                "node_id": "b",
                "name": "B",
                "group": "logic",
                "type": "wait",
                "config": {},
            },
        ],
        "edges": [
            {"id": "a-b", "from_node_id": "a", "to_node_id": "b"},
            {"id": "b-a", "from_node_id": "b", "to_node_id": "a"},
        ],
    }

    with assert_raises(ValidationError):
        WorkflowDefinition.model_validate(payload)


def test_engine_detects_parallel_merge_conflicts() -> None:
    NODE_BEHAVIOR.clear()
    NODE_BEHAVIOR.update(
        {
            "left": NodeResult(output={"shared": 1}),
            "right": NodeResult(output={"shared": 2}),
        }
    )

    definition = WorkflowDefinition.model_validate(
        {
            "nodes": [
                {
                    "node_id": "left",
                    "name": "Left",
                    "group": "logic",
                    "type": "wait",
                    "config": {},
                },
                {
                    "node_id": "right",
                    "name": "Right",
                    "group": "logic",
                    "type": "wait",
                    "config": {},
                },
                {
                    "node_id": "sink",
                    "name": "Sink",
                    "group": "logic",
                    "type": "wait",
                    "config": {},
                },
            ],
            "edges": [
                {"id": "left-sink", "from_node_id": "left", "to_node_id": "sink"},
                {"id": "right-sink", "from_node_id": "right", "to_node_id": "sink"},
            ],
        }
    )

    engine = WorkflowEngine(db=DummySession())
    execution = _build_execution()

    with assert_raises(ContextMergeConflict):
        asyncio.run(engine.execute(execution=execution, definition=definition))

    assert execution.status == ExecutionStatusEnum.FAILED


def test_engine_skips_unreached_nodes_and_keeps_root_context() -> None:
    NODE_BEHAVIOR.clear()
    NODE_BEHAVIOR.update(
        {
            "start": NodeResult(output={"flag": False}, emitted_handles={"false"}),
        }
    )

    definition = WorkflowDefinition.model_validate(
        {
            "nodes": [
                {
                    "node_id": "start",
                    "name": "Start",
                    "group": "logic",
                    "type": "wait",
                    "config": {},
                },
                {
                    "node_id": "child",
                    "name": "Child",
                    "group": "logic",
                    "type": "wait",
                    "config": {},
                },
            ],
            "edges": [
                {
                    "id": "start-child",
                    "from_node_id": "start",
                    "to_node_id": "child",
                    "from_handle": "true",
                }
            ],
        }
    )

    session = DummySession()
    engine = WorkflowEngine(db=session)
    execution = _build_execution()

    result = asyncio.run(engine.execute(execution=execution, definition=definition))

    assert result["flag"] is False
    assert execution.status == ExecutionStatusEnum.SUCCESS

    node_records = [record for record in session.records if hasattr(record, "node_id")]
    statuses = {record.node_id: record.status for record in node_records}
    assert statuses["start"] == NodeExecutionStatusEnum.SUCCESS
    assert statuses["child"] == NodeExecutionStatusEnum.SKIPPED


def test_engine_rejects_unsafe_condition_syntax() -> None:
    NODE_BEHAVIOR.clear()
    NODE_BEHAVIOR.update(
        {
            "start": NodeResult(output={"flag": True}),
        }
    )

    definition = WorkflowDefinition.model_validate(
        {
            "nodes": [
                {
                    "node_id": "start",
                    "name": "Start",
                    "group": "logic",
                    "type": "wait",
                    "config": {},
                },
                {
                    "node_id": "child",
                    "name": "Child",
                    "group": "logic",
                    "type": "wait",
                    "config": {},
                },
            ],
            "edges": [
                {
                    "id": "start-child",
                    "from_node_id": "start",
                    "to_node_id": "child",
                    "condition": {"expression": "__import__('os').system('echo hack')"},
                }
            ],
        }
    )

    engine = WorkflowEngine(db=DummySession())
    execution = _build_execution()

    with assert_raises(WorkflowDefinitionError):
        asyncio.run(engine.execute(execution=execution, definition=definition))

    assert execution.status == ExecutionStatusEnum.FAILED


def test_default_registry_contains_manual_and_sql_nodes() -> None:
    registered = set(list_registered_processors())
    assert "manual" in registered
    assert "sql_database" in registered


def test_manual_trigger_processor_returns_trigger_metadata() -> None:
    processor = get_processor(
        node_type="manual",
        node_id="manual_start",
        config={"kind": "manual"},
    )
    result = asyncio.run(processor.process({"foo": "bar"}))
    normalized = NodeResult.from_value(result)

    assert normalized.output["_trigger"]["kind"] == "manual"
    assert "default" in normalized.emitted_handles


def test_sql_database_processor_executes_inline_sqlite_query() -> None:
    with NamedTemporaryFile(suffix=".sqlite", delete=False) as temp_file:
        sqlite_path = Path(temp_file.name)

    try:
        conn = sqlite3.connect(sqlite_path)
        try:
            conn.execute("create table sample (id integer primary key, name text)")
            conn.execute("insert into sample (name) values (?)", ("alpha",))
            conn.commit()
        finally:
            conn.close()

        processor = get_processor(
            node_type="sql_database",
            node_id="sql_1",
            config={
                "kind": "sql_database",
                "operation": "select",
                "query": "select id, name from sample",
                "source_type": "SQLITE",
                "database": {
                    "sqlite_path": str(sqlite_path),
                },
                "output_field": "db_result",
            },
        )

        result = asyncio.run(processor.process({}))
        normalized = NodeResult.from_value(result)
        payload = normalized.output["db_result"]

        assert payload["success"] is True
        assert payload["rows"] == [{"id": 1, "name": "alpha"}]
        assert payload["columns"] == ["id", "name"]
        assert "success" in normalized.emitted_handles
        assert "default" in normalized.emitted_handles
    finally:
        sqlite_path.unlink(missing_ok=True)
