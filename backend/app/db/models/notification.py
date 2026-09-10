from datetime import datetime, timezone
from sqlalchemy import Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Notification(Base):
    """Notification model for user notifications."""
    
    __tablename__ = "notifications"
    __table_args__ = (
        Index("ix_notifications_user_id", "user_id"),
        Index("ix_notifications_related_match_id", "related_match_id"),
        Index("ix_notifications_is_read", "is_read"),
    )
    
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    related_match_id: Mapped[int | None] = mapped_column(
        ForeignKey("matches.id"),
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    
    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="notifications",
        foreign_keys=[user_id]
    )
    related_match: Mapped["Match | None"] = relationship(
        "Match",
        back_populates="notifications",
        foreign_keys=[related_match_id]
    )
    
    def __repr__(self) -> str:
        return (
            f"<Notification(id={self.id}, user={self.user_id}, "
            f"is_read={self.is_read})>"
        )
