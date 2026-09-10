from datetime import datetime, date, timezone
from enum import Enum
from sqlalchemy import String, Text, Date, DateTime, ForeignKey, Enum as SQLEnum, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class ReportType(str, Enum):
    """Enum for report types."""
    LOST = "lost"
    FOUND = "found"


class ReportStatus(str, Enum):
    """Enum for report status."""
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    MATCHED = "matched"
    RESOLVED = "resolved"


class Report(Base):
    """Report model for lost or found items."""
    
    __tablename__ = "reports"
    __table_args__ = (
        Index("ix_reports_user_id", "user_id"),
        Index("ix_reports_report_type", "report_type"),
        Index("ix_reports_status", "status"),
    )
    
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    report_type: Mapped[ReportType] = mapped_column(
        SQLEnum(ReportType),
        nullable=False
    )
    item_name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location: Mapped[str] = mapped_column(String(500), nullable=False)
    date_occurred: Mapped[date] = mapped_column(Date, nullable=False)
    photo_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    status: Mapped[ReportStatus] = mapped_column(
        SQLEnum(ReportStatus),
        default=ReportStatus.SUBMITTED,
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    
    # Relationships
    owner: Mapped["User"] = relationship(
        "User",
        back_populates="reports",
        foreign_keys=[user_id]
    )
    lost_matches: Mapped[list["Match"]] = relationship(
        "Match",
        back_populates="lost_report",
        foreign_keys="Match.lost_report_id",
        cascade="all, delete-orphan"
    )
    found_matches: Mapped[list["Match"]] = relationship(
        "Match",
        back_populates="found_report",
        foreign_keys="Match.found_report_id",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return (
            f"<Report(id={self.id}, type={self.report_type}, "
            f"item={self.item_name}, status={self.status})>"
        )