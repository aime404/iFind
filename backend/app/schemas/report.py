from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.db.models.report import ReportStatus, ReportType


class ReportCreate(BaseModel):
    """Schema for creating a new report."""
    item_name: str
    category: str
    description: str
    location: str
    date_occurred: date
    report_type: ReportType


class ReportResponse(BaseModel):
    """Schema for report response."""
    id: int
    user_id: int
    report_type: ReportType
    item_name: str
    category: str
    description: str
    location: str
    date_occurred: date
    photo_url: str | None
    status: ReportStatus
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ReportUpdate(BaseModel):
    """Schema for updating a report."""
    status: ReportStatus | None = None
