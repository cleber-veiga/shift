"""
Compatibility layer for legacy imports.

The workflow definition used by the API now lives in app.schemas.workflow.base.
This module keeps older imports working without duplicating contracts.
"""

from app.schemas.workflow.base import EdgeBase, NodeBase, WorkflowDefinition

__all__ = ["NodeBase", "EdgeBase", "WorkflowDefinition"]
