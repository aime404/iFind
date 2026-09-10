from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.db.models.user import User
from app.db.models.report import Report, ReportStatus, ReportType
from app.db.models.match import Match, MatchStatus
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


@router.get("/admin/stats")
async def get_admin_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> dict:
    """
    Get system-wide statistics for the admin dashboard overview (admin only).

    Args:
        current_user: The authenticated user (must be admin)
        db: Database session

    Returns:
        dict with report counts by type/status, match counts by status, and total users

    Raises:
        HTTPException: 403 if user is not admin
    """
    _require_admin(current_user)

    total_reports = db.execute(select(func.count(Report.id))).scalar_one()
    total_lost = db.execute(
        select(func.count(Report.id)).where(Report.report_type == ReportType.LOST)
    ).scalar_one()
    total_found = db.execute(
        select(func.count(Report.id)).where(Report.report_type == ReportType.FOUND)
    ).scalar_one()

    reports_by_status = {}
    for report_status in ReportStatus:
        count = db.execute(
            select(func.count(Report.id)).where(Report.status == report_status)
        ).scalar_one()
        reports_by_status[report_status.value] = count

    total_users = db.execute(select(func.count(User.id))).scalar_one()

    total_matches = db.execute(select(func.count(Match.id))).scalar_one()
    matches_by_status = {}
    for match_status in MatchStatus:
        count = db.execute(
            select(func.count(Match.id)).where(Match.status == match_status)
        ).scalar_one()
        matches_by_status[match_status.value] = count

    return {
        "total_reports": total_reports,
        "total_lost": total_lost,
        "total_found": total_found,
        "reports_by_status": reports_by_status,
        "total_users": total_users,
        "total_matches": total_matches,
        "matches_by_status": matches_by_status,
    }


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