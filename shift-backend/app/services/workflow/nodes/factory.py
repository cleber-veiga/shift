"""
Factory for workflow node processors.
"""

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from .base import BaseNodeProcessor

_REGISTRY: dict[str, type[BaseNodeProcessor]] = {}


def register_processor(node_type: str):
    def decorator(cls: type[BaseNodeProcessor]) -> type[BaseNodeProcessor]:
        _REGISTRY[node_type] = cls
        return cls

    return decorator


def get_processor(
    node_type: str,
    node_id: str,
    config: dict[str, Any],
    *,
    db: AsyncSession | None = None,
) -> BaseNodeProcessor:
    processor_class = _REGISTRY.get(node_type)
    if processor_class is None:
        raise NotImplementedError(
            f"Nenhum processador registrado para o tipo de no '{node_type}'. "
            f"Tipos disponiveis: {sorted(_REGISTRY.keys())}"
        )
    return processor_class(node_id=node_id, node_type=node_type, config=config, db=db)


def list_registered_processors() -> list[str]:
    return sorted(_REGISTRY.keys())


from . import manual_trigger as _manual_trigger  # noqa: E402,F401
from . import sql_database as _sql_database  # noqa: E402,F401
