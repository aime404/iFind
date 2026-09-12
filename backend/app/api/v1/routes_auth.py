from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.db.database import get_db
from app.db.models.user import User
from app.schemas.user import Token, UserCreate, UserResponse, UserUpdate


router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
) -> UserResponse:
    """
    Register a new user account.
    """
    stmt = select(User).where(User.email == user_data.email)
    result = db.execute(stmt)
    existing_user = result.scalar_one_or_none()

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    hashed_password = hash_password(user_data.password)

    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        hashed_password=hashed_password,
        phone_number=user_data.phone_number,
        student_id=user_data.student_id,
        department=user_data.department,
        is_admin=False
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return UserResponse.model_validate(new_user)


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Token:
    """
    Authenticate user and return JWT access token.
    """
    stmt = select(User).where(User.email == form_data.username)
    result = db.execute(stmt)
    user = result.scalar_one_or_none()

    if user is None or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email},
        expires_delta=access_token_expires
    )

    return Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """
    Get the currently authenticated user's information.
    """
    return UserResponse.model_validate(current_user)


def _apply_optional_str(update_data: UserUpdate, field: str, target: User) -> None:
    """Set target.field from update_data.field if provided; empty string clears it."""
    value = getattr(update_data, field)
    if value is not None:
        stripped = value.strip()
        setattr(target, field, stripped if stripped else None)


@router.patch("/me", response_model=UserResponse)
async def update_me(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> UserResponse:
    """
    Update the currently authenticated user's profile.
    full_name, phone_number, student_id, department, and/or password may be
    changed here (not email). Sending an empty string for an optional field
    clears it.

    Args:
        update_data: Fields to update, all optional
        current_user: The authenticated user
        db: Database session

    Returns:
        Updated UserResponse
    """
    if update_data.full_name is not None and update_data.full_name.strip():
        current_user.full_name = update_data.full_name.strip()

    _apply_optional_str(update_data, "phone_number", current_user)
    _apply_optional_str(update_data, "student_id", current_user)
    _apply_optional_str(update_data, "department", current_user)

    if update_data.password is not None and update_data.password.strip():
        current_user.hashed_password = hash_password(update_data.password)

    db.commit()
    db.refresh(current_user)

    return UserResponse.model_validate(current_user)