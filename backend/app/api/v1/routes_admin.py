from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.db.models.user import User
from app.db.models.report import Report
from app.db.models.audit_log import AuditLog
from app.schemas.user import UserResponse
from app.schemas.report import ReportResponse
from app.services.audit_service import log_action


router = APIRouter()


def _require_admin(current_user: User) -> None:
    """Helper to check if user is admin, raise 403 if not."""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )


@router.get("/admin/reports", response_model=list[ReportResponse])
async def list_all_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> list[ReportResponse]:
    """
    List all reports (admin only). Ordered by creation date descending.
    
    Args:
        current_user: The authenticated user (must be admin)
        db: Database session
        
    Returns:
        List of all ReportResponse objects
        
    Raises:
        HTTPException: 403 if user is not admin
    """
    _require_admin(current_user)
    
    stmt = select(Report).order_by(desc(Report.created_at))
    result = db.execute(stmt)
    reports = result.scalars().all()
    
    return [ReportResponse.model_validate(report) for report in reports]


@router.get("/admin/users", response_model=list[UserResponse])
async def list_all_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> list[UserResponse]:
    """
    List all users (admin only).
    
    Args:
        current_user: The authenticated user (must be admin)
        db: Database session
        
    Returns:
        List of all UserResponse objects
        
    Raises:
        HTTPException: 403 if user is not admin
    """
    _require_admin(current_user)
    
    stmt = select(User)
    result = db.execute(stmt)
    users = result.scalars().all()
    
    return [UserResponse.model_validate(user) for user in users]


@router.delete("/admin/reports/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> None:
    """
    Delete a report (admin only). Logs the action before deletion.
    
    Args:
        report_id: The ID of the report to delete
        current_user: The authenticated user (must be admin)
        db: Database session
        
    Raises:
        HTTPException: 403 if user is not admin
        HTTPException: 404 if report not found
    """
    _require_admin(current_user)
    
    stmt = select(Report).where(Report.id == report_id)
    result = db.execute(stmt)
    report = result.scalar_one_or_none()
    
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Log the deletion BEFORE deleting the report
    log_action(
        db=db,
        action="report_deleted",
        performed_by=current_user.id,
        target_type="report",
        target_id=report.id,
        details=f"Deleted by admin: {report.item_name}"
    )
    
    # Delete the report
    db.delete(report)
    db.commit()


@router.get("/admin/audit-logs", response_model=list)
async def list_audit_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> list[dict]:
    """
    List audit logs (admin only). Returns the 100 most recent logs ordered by creation date descending.
    
    Args:
        current_user: The authenticated user (must be admin)
        db: Database session
        
    Returns:
        List of audit log records (up to 100)
        
    Raises:
        HTTPException: 403 if user is not admin
    """
    _require_admin(current_user)
    
    stmt = select(AuditLog).order_by(desc(AuditLog.created_at)).limit(100)
    result = db.execute(stmt)
    audit_logs = result.scalars().all()
    
    # Convert to dict format for response
    return [
        {
            "id": log.id,
            "action": log.action,
            "performed_by": log.performed_by,
            "target_type": log.target_type,
            "target_id": log.target_id,
            "details": log.details,
            "created_at": log.created_at
        }
        for log in audit_logs
    ]
