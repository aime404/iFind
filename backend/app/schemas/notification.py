from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    """Schema for notification response."""
    id: int
    user_id: int
    message: str
    is_read: bool
    related_match_id: int | None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
