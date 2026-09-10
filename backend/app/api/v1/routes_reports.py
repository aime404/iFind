from datetime import date

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.database import get_db
from app.db.models.report import Report, ReportStatus, ReportType
from app.db.models.user import User
from app.schemas.report import ReportCreate, ReportResponse, ReportUpdate
from app.services.image_service import save_upload_image


router = APIRouter()


@router.post("/reports", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    item_name: str = Form(...),
    category: str = Form(...),
    description: str = Form(...),
    location: str = Form(...),
    date_occurred: date = Form(...),
    report_type: ReportType = Form(...),
    photo: UploadFile | None = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ReportResponse:
    """
    Create a new lost or found item report.
    
    Args:
        item_name: Name of the item
        category: Category of the item
        description: Description of the item
        location: Location where item was lost/found
        date_occurred: Date when item was lost/found
        report_type: Type of report ("lost" or "found")
        photo: Optional image file to upload
        current_user: The authenticated user creating the report
        db: Database session
        
    Returns:
        ReportResponse with the created report details
    """
    # Handle photo upload if provided
    photo_url = None
    if photo:
        photo_url = save_upload_image(photo)
    
    # Create new report linked to current user
    new_report = Report(
        user_id=current_user.id,
        item_name=item_name,
        category=category,
        description=description,
        location=location,
        date_occurred=date_occurred,
        report_type=report_type,
        photo_url=photo_url,
        status=ReportStatus.SUBMITTED
    )
    
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    
    return ReportResponse.model_validate(new_report)


@router.get("/reports", response_model=list[ReportResponse])
async def list_reports(
    report_type: ReportType | None = Query(None),
    category: str | None = Query(None),
    location: str | None = Query(None),
    report_status: ReportStatus | None = Query(None),
    db: Session = Depends(get_db)
) -> list[ReportResponse]:
    """
    List all reports with optional filtering.
    
    Args:
        report_type: Filter by report type ("lost" or "found")
        category: Filter by category
        location: Filter by location
        report_status: Filter by status
        db: Database session
        
    Returns:
        List of ReportResponse objects
    """
    # Build query with filters
    conditions = []
    
    if report_type:
        conditions.append(Report.report_type == report_type)
    if category:
        conditions.append(Report.category == category)
    if location:
        conditions.append(Report.location == location)
    if report_status:
        conditions.append(Report.status == report_status)
    
    # Execute query
    if conditions:
        stmt = select(Report).where(and_(*conditions))
    else:
        stmt = select(Report)
    
    result = db.execute(stmt)
    reports = result.scalars().all()
    
    return [ReportResponse.model_validate(report) for report in reports]


@router.get("/reports/search", response_model=list[ReportResponse])
async def search_reports(
    q: str = Query(..., min_length=1, description="Search query"),
    report_type: ReportType | None = Query(None),
    category: str | None = Query(None),
    location: str | None = Query(None),
    report_status: ReportStatus | None = Query(None),
    db: Session = Depends(get_db)
) -> list[ReportResponse]:
    """
    Search reports by item name or description.
    
    Args:
        q: Search query string (searches item_name and description)
        report_type: Filter by report type
        category: Filter by category
        location: Filter by location
        report_status: Filter by status
        db: Database session
        
    Returns:
        List of matching ReportResponse objects
    """
    # Build conditions for filters
    conditions = [
        or_(
            Report.item_name.ilike(f"%{q}%"),
            Report.description.ilike(f"%{q}%")
        )
    ]
    
    if report_type:
        conditions.append(Report.report_type == report_type)
    if category:
        conditions.append(Report.category == category)
    if location:
        conditions.append(Report.location == location)
    if report_status:
        conditions.append(Report.status == report_status)
    
    # Execute query
    stmt = select(Report).where(and_(*conditions))
    result = db.execute(stmt)
    reports = result.scalars().all()
    
    return [ReportResponse.model_validate(report) for report in reports]


@router.get("/reports/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: int,
    db: Session = Depends(get_db)
) -> ReportResponse:
    """
    Get a specific report by ID.
    
    Args:
        report_id: The ID of the report to retrieve
        db: Database session
        
    Returns:
        ReportResponse with the report details
        
    Raises:
        HTTPException: 404 if report not found
    """
    stmt = select(Report).where(Report.id == report_id)
    result = db.execute(stmt)
    report = result.scalar_one_or_none()
    
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    return ReportResponse.model_validate(report)


@router.patch("/reports/{report_id}/status", response_model=ReportResponse)
async def update_report_status(
    report_id: int,
    update_data: ReportUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ReportResponse:
    """
    Update the status of a report.
    Only the report's owner or an admin can update the status.
    
    Args:
        report_id: The ID of the report to update
        update_data: Update data with new status
        current_user: The authenticated user
        db: Database session
        
    Returns:
        Updated ReportResponse
        
    Raises:
        HTTPException: 404 if report not found
        HTTPException: 403 if user is not the owner or admin
    """
    # Fetch the report
    stmt = select(Report).where(Report.id == report_id)
    result = db.execute(stmt)
    report = result.scalar_one_or_none()
    
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    # Check if user is owner or admin
    if report.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update this report"
        )
    
    # Update status if provided
    if update_data.status is not None:
        report.status = update_data.status
    
    db.commit()
    db.refresh(report)
    
    return ReportResponse.model_validate(report)
