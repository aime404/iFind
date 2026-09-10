from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.db.models.match import Match, MatchStatus
from app.db.models.report import Report, ReportStatus
from app.db.models.user import User
from app.schemas.match import MatchResponse, MatchUpdate
from app.services.audit_service import log_action


router = APIRouter()


@router.get("/matches/mine", response_model=list[MatchResponse])
async def get_user_matches(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> list[MatchResponse]:
    """
    Get all matches where the current user owns either the lost or found report.
    
    Args:
        current_user: The authenticated user
        db: Database session
        
    Returns:
        List of MatchResponse objects
    """
    # Find all reports owned by current user
    stmt = select(Report.id).where(Report.user_id == current_user.id)
    result = db.execute(stmt)
    user_report_ids = result.scalars().all()
    
    # Find all matches where user owns either lost or found report
    match_stmt = select(Match).where(
        or_(
            Match.lost_report_id.in_(user_report_ids),
            Match.found_report_id.in_(user_report_ids)
        )
    )
    match_result = db.execute(match_stmt)
    matches = match_result.scalars().all()
    
    return [MatchResponse.model_validate(match) for match in matches]


@router.get("/matches/{match_id}", response_model=MatchResponse)
async def get_match(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> MatchResponse:
    """
    Get a specific match by ID.
    Requires authentication; user must own one of the linked reports or be admin.
    
    Args:
        match_id: The ID of the match to retrieve
        current_user: The authenticated user
        db: Database session
        
    Returns:
        MatchResponse
        
    Raises:
        HTTPException: 404 if match not found
        HTTPException: 403 if user doesn't own either report and isn't admin
    """
    stmt = select(Match).where(Match.id == match_id)
    result = db.execute(stmt)
    match = result.scalar_one_or_none()
    
    if match is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    
    # Check permission: user must own one of the reports or be admin
    if (match.lost_report.user_id != current_user.id and 
        match.found_report.user_id != current_user.id and 
        not current_user.is_admin):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this match"
        )
    
    return MatchResponse.model_validate(match)


@router.patch("/matches/{match_id}/verify", response_model=MatchResponse)
async def verify_match(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> MatchResponse:
    """
    Verify a match. Only a user who owns one of the linked reports can verify.
    Updates the match status to "verified" and both linked reports' status to "matched".
    
    Args:
        match_id: The ID of the match to verify
        current_user: The authenticated user
        db: Database session
        
    Returns:
        Updated MatchResponse
        
    Raises:
        HTTPException: 404 if match not found
        HTTPException: 403 if user doesn't own either report
    """
    stmt = select(Match).where(Match.id == match_id)
    result = db.execute(stmt)
    match = result.scalar_one_or_none()
    
    if match is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    
    # Check permission: user must own one of the reports
    if (match.lost_report.user_id != current_user.id and 
        match.found_report.user_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to verify this match"
        )
    
    # Update match status
    match.status = MatchStatus.VERIFIED
    
    # Update both linked reports' status to "matched"
    match.lost_report.status = ReportStatus.MATCHED
    match.found_report.status = ReportStatus.MATCHED
    
    db.commit()
    db.refresh(match)
    
    # Log the action
    log_action(
        db=db,
        action="match_verified",
        performed_by=current_user.id,
        target_type="match",
        target_id=match.id
    )
    
    return MatchResponse.model_validate(match)


@router.patch("/matches/{match_id}/reject", response_model=MatchResponse)
async def reject_match(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> MatchResponse:
    """
    Reject a match. Only a user who owns one of the linked reports can reject.
    
    Args:
        match_id: The ID of the match to reject
        current_user: The authenticated user
        db: Database session
        
    Returns:
        Updated MatchResponse
        
    Raises:
        HTTPException: 404 if match not found
        HTTPException: 403 if user doesn't own either report
    """
    stmt = select(Match).where(Match.id == match_id)
    result = db.execute(stmt)
    match = result.scalar_one_or_none()
    
    if match is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )
    
    # Check permission: user must own one of the reports
    if (match.lost_report.user_id != current_user.id and 
        match.found_report.user_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to reject this match"
        )
    
    # Update match status
    match.status = MatchStatus.REJECTED
    
    db.commit()
    db.refresh(match)
    
    # Log the action
    log_action(
        db=db,
        action="match_rejected",
        performed_by=current_user.id,
        target_type="match",
        target_id=match.id
    )
    
    return MatchResponse.model_validate(match)
