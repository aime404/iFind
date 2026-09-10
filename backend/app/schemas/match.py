from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.db.models.match import MatchStatus
from app.schemas.report import ReportResponse


class MatchResponse(BaseModel):
    """Schema for match response with nested report details."""
    id: int
    lost_report_id: int
    found_report_id: int
    similarity_score: float
    status: MatchStatus
    created_at: datetime
    lost_report: ReportResponse
    found_report: ReportResponse
    
    model_config = ConfigDict(from_attributes=True)


class MatchUpdate(BaseModel):
    """Schema for updating a match."""
    status: MatchStatus
