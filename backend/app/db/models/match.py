from datetime import datetime, timezone
from enum import Enum
from sqlalchemy import Float, DateTime, ForeignKey, Enum as SQLEnum, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class MatchStatus(str, Enum):
    """Enum for match status."""
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class Match(Base):
    """Match model for pairing lost and found reports."""
    
    __tablename__ = "matches"
    __table_args__ = (
        Index("ix_matches_lost_report_id", "lost_report_id"),
        Index("ix_matches_found_report_id", "found_report_id"),
        Index("ix_matches_status", "status"),
    )
    
    id: Mapped[int] = mapped_column(primary_key=True)
    lost_report_id: Mapped[int] = mapped_column(
        ForeignKey("reports.id"),
        nullable=False
    )
    found_report_id: Mapped[int] = mapped_column(
        ForeignKey("reports.id"),
        nullable=False
    )
    similarity_score: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[MatchStatus] = mapped_column(
        SQLEnum(MatchStatus),
        default=MatchStatus.PENDING,
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    
    # Relationships
    lost_report: Mapped["Report"] = relationship(
        "Report",
        back_populates="lost_matches",
        foreign_keys=[lost_report_id]
    )
    found_report: Mapped["Report"] = relationship(
        "Report",
        back_populates="found_matches",
        foreign_keys=[found_report_id]
    )
    notifications: Mapped[list["Notification"]] = relationship(
        "Notification",
        back_populates="related_match",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return (
            f"<Match(id={self.id}, lost={self.lost_report_id}, "
            f"found={self.found_report_id}, score={self.similarity_score})>"
        )