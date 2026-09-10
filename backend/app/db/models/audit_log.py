from datetime import datetime, timezone
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class AuditLog(Base):
    """AuditLog model for tracking system actions and changes."""
    
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_performed_by", "performed_by"),
        Index("ix_audit_logs_action", "action"),
        Index("ix_audit_logs_target_type", "target_type"),
        Index("ix_audit_logs_created_at", "created_at"),
    )
    
    id: Mapped[int] = mapped_column(primary_key=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    performed_by: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"),
        nullable=True
    )
    target_type: Mapped[str] = mapped_column(String(50), nullable=False)
    target_id: Mapped[int] = mapped_column(Integer, nullable=False)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc)
    )
    
    # Relationships
    performed_by_user: Mapped["User | None"] = relationship(
        "User",
        back_populates="audit_logs",
        foreign_keys=[performed_by]
    )
    
    def __repr__(self) -> str:
        return (
            f"<AuditLog(id={self.id}, action={self.action}, "
            f"target={self.target_type}:{self.target_id})>"
        )
