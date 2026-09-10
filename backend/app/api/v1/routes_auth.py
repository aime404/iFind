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
from app.schemas.user import Token, UserCreate, UserResponse


router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
) -> UserResponse:
    """
    Register a new user account.
    
    Args:
        user_data: User registration data (full_name, email, password)
        db: Database session
        
    Returns:
        UserResponse with the created user information
        
    Raises:
        HTTPException: 400 if email is already registered
    """
    # Check if email already exists
    stmt = select(User).where(User.email == user_data.email)
    result = db.execute(stmt)
    existing_user = result.scalar_one_or_none()
    
    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash the password
    hashed_password = hash_password(user_data.password)
    
    # Create new user
    new_user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        hashed_password=hashed_password,
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
    
    Args:
        form_data: OAuth2 form with username (email) and password
        db: Database session
        
    Returns:
        Token with JWT access_token and token_type
        
    Raises:
        HTTPException: 401 if credentials are invalid
    """
    # Find user by email (username field contains email)
    stmt = select(User).where(User.email == form_data.username)
    result = db.execute(stmt)
    user = result.scalar_one_or_none()
    
    # Verify user exists and password is correct
    if user is None or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token with user id (as string, per JWT spec) in payload
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
    
    Args:
        current_user: The authenticated user (from dependency)
        
    Returns:
        UserResponse with the current user's information
    """
    return UserResponse.model_validate(current_user)