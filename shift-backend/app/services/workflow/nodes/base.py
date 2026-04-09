"""
Base abstractions for workflow node processors.
"""

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

DEFAULT_ROUTE_HANDLE = "default"


@dataclass(slots=True)
class NodeResult:
    """
    Normalized result for node execution.

    output:
        Fields produced by the node and merged into the branch-local context.
    emitted_handles:
        Output handles selected by the node. When omitted, the engine assumes
        the standard "default" route.
    """

    output: dict[str, Any] = field(default_factory=dict)
    emitted_handles: set[str] = field(default_factory=lambda: {DEFAULT_ROUTE_HANDLE})

    @classmethod
    def from_value(cls, value: "NodeResult | dict[str, Any]") -> "NodeResult":
        if isinstance(value, cls):
            return value
        if isinstance(value, dict):
            return cls(output=value)
        raise TypeError(
            "Node processors must return dict[str, Any] or NodeResult, "
            f"got {type(value).__name__}."
        )


class BaseNodeProcessor(ABC):
    """
    Base class for workflow node processors.
    """

    def __init__(
        self,
        node_id: str,
        node_type: str,
        config: dict[str, Any],
        *,
        db: AsyncSession | None = None,
    ):
        self.node_id = node_id
        self.node_type = node_type
        self.config = config
        self.db = db

    @abstractmethod
    async def process(self, context: dict[str, Any]) -> NodeResult | dict[str, Any]:
        """
        Execute the node logic against an immutable branch context.
        """
        raise NotImplementedError

    def resolve_template(self, template: Any, context: dict[str, Any]) -> Any:
        if not isinstance(template, str):
            return template

        import re

        pattern = re.compile(r"\{\{([\w.]+)\}\}")

        def replace_match(match: re.Match[str]) -> str:
            path = match.group(1)
            value = self._get_nested(context, path)
            return str(value) if value is not None else match.group(0)

        return pattern.sub(replace_match, template)

    def get_from_context(self, context: dict[str, Any], path: str, default: Any = None) -> Any:
        return self._get_nested(context, path, default)

    def build_result(
        self,
        output: dict[str, Any] | None = None,
        *,
        emitted_handles: set[str] | None = None,
    ) -> NodeResult:
        return NodeResult(
            output=output or {},
            emitted_handles=emitted_handles or {DEFAULT_ROUTE_HANDLE},
        )

    def resolve_data(self, value: Any, context: dict[str, Any]) -> Any:
        if isinstance(value, str):
            return self.resolve_template(value, context)
        if isinstance(value, list):
            return [self.resolve_data(item, context) for item in value]
        if isinstance(value, tuple):
            return tuple(self.resolve_data(item, context) for item in value)
        if isinstance(value, dict):
            return {key: self.resolve_data(item, context) for key, item in value.items()}
        return value

    def _get_nested(self, data: Any, path: str, default: Any = None) -> Any:
        keys = path.split(".")
        current = data
        for key in keys:
            if isinstance(current, dict):
                current = current.get(key)
            elif isinstance(current, list) and key.isdigit():
                idx = int(key)
                current = current[idx] if idx < len(current) else None
            else:
                return default
            if current is None:
                return default
        return current


class NodeProcessingError(Exception):
    """
    Structured error raised when a node fails during execution.
    """

    def __init__(self, node_id: str, node_type: str, message: str, original_error: Exception | None = None):
        self.node_id = node_id
        self.node_type = node_type
        self.original_error = original_error
        super().__init__(f"[{node_type}:{node_id}] {message}")
