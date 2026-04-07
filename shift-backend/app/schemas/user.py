from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    email: EmailStr
    full_name: str | None
    auth_provider: str
    is_verified: bool
    is_active: bool
    last_login_at: datetime | None
    created_at: datetime
