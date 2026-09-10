import logging

from sqlalchemy.orm import Session

from app.db.models.audit_log import AuditLog


logger = logging.getLogger(__name__)


def log_action(
    db: Session,
    action: str,
    performed_by: int | None,
    target_type: str,
    target_id: int,
    details: str | None = None
) -> None:
    """
    Log an action to the audit log.
    
    Args:
        db: Database session
        action: Action name (e.g., "match_verified", "report_deleted")
        performed_by: User ID who performed the action (None for system actions)
        target_type: Type of entity being acted on (e.g., "report", "match")
        target_id: ID of the entity being acted on
        details: Optional additional details about the action
        
    Raises:
        Never raises exceptions; logs errors and returns gracefully
    """
    try:
        audit_log = AuditLog(
            action=action,
            performed_by=performed_by,
            target_type=target_type,
            target_id=target_id,
            details=details
        )
        
        db.add(audit_log)
        db.commit()
    except Exception as e:
        logger.error(
            f"Failed to log action '{action}' for {target_type}:{target_id}: {str(e)}"
        )
