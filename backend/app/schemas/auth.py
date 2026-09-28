from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=4, description="User password")


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150)
    email: str = Field(..., description="Unique email address")
    password: str = Field(..., min_length=4, description="Password (at least 4 characters)")
    phone: Optional[str] = None
    role_name: Optional[str] = Field(default="ADMIN", description="ADMIN, CAMPAIGN_MANAGER, COMMUNICATION_TEAM")


class UserProfile(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    role: str
    is_active: bool
    created_at: Optional[datetime] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserProfile
