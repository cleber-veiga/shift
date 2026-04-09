from app.schemas.workflow.trigger_config import ManualTriggerConfig

from .base import BaseNodeProcessor
from .factory import register_processor


@register_processor("manual")
class ManualTriggerProcessor(BaseNodeProcessor):
    async def process(self, context: dict[str, object]) -> dict[str, object]:
        config = ManualTriggerConfig.model_validate(self.config)
        return {
            "_trigger": {
                "kind": config.kind.value,
                "input_schema": config.input_schema,
            }
        }
