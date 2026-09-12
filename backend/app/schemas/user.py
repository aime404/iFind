from datetime import datetime

from pydantic import BaseModel, EmailStr, ConfigDict


class UserCreate(BaseModel):
    """Schema for user registration."""
    full_name: str
    email: EmailStr
    password: str
    phone_number: str | None = None
    student_id: str | None = None
    department: str | None = None


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """Schema for updating the current user's profile. All fields optional."""
    full_name: str | None = None
    phone_number: str | None = None
    student_id: str | None = None
    department: str | None = None
    password: str | None = None


class UserResponse(BaseModel):
    """Schema for user response - excludes password and hashed_password."""
    id: int
    full_name: str
    email: str
    phone_number: str | None = None
    student_id: str | None = None
    department: str | None = None
    is_admin: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str