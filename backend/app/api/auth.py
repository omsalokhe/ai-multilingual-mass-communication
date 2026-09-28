from datetime import datetime, timedelta
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.db.database import get_db
from app.models.admin import Admin, Role
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserProfile,
)
from app.services.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_admin,
)

logger = logging.getLogger("uvicorn")

router = APIRouter(prefix="/auth", tags=["Authentication & User Management"])


def ensure_default_roles(db: Session):
    """Ensure standard roles exist in database."""
    default_roles = [
        ("SUPER_ADMIN", "Full system administrator access"),
        ("ADMIN", "Standard administrator"),
        ("CAMPAIGN_MANAGER", "Can create and manage communication campaigns"),
        ("COMMUNICATION_TEAM", "Can draft and review multilingual content"),
    ]
    for role_name, description in default_roles:
        existing = db.query(Role).filter(Role.role_name == role_name).first()
        if not existing:
            role = Role(role_name=role_name, description=description)
            db.add(role)
    db.commit()


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user with email and password and return a JWT access token."""
    email_clean = request.email.strip().lower()
    admin = db.query(Admin).filter(Admin.email.ilike(email_clean)).first()

    if not admin or not verify_password(request.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Please contact an administrator.",
        )

    # Update last login timestamp
    admin.last_login_at = datetime.utcnow()
    db.commit()
    db.refresh(admin)

    role_name = admin.role.role_name if admin.role else "ADMIN"
    expires_in_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    access_token = create_access_token(
        data={
            "sub": admin.email,
            "id": admin.id,
            "name": admin.full_name,
            "role": role_name,
        },
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=expires_in_seconds,
        user=UserProfile(
            id=admin.id,
            full_name=admin.full_name,
            email=admin.email,
            phone=admin.phone,
            role=role_name,
            is_active=admin.is_active,
            created_at=admin.created_at,
        ),
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new admin/manager account and return JWT credentials."""
    ensure_default_roles(db)

    email_clean = request.email.strip().lower()
    existing = db.query(Admin).filter(Admin.email.ilike(email_clean)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    requested_role_name = (request.role_name or "ADMIN").upper()
    role = db.query(Role).filter(Role.role_name == requested_role_name).first()
    if not role:
        role = db.query(Role).filter(Role.role_name == "ADMIN").first()
        if not role:
            role = Role(role_name="ADMIN", description="Standard administrator")
            db.add(role)
            db.commit()
            db.refresh(role)

    hashed_pw = hash_password(request.password)

    new_admin = Admin(
        full_name=request.full_name.strip(),
        email=email_clean,
        password_hash=hashed_pw,
        phone=request.phone.strip() if request.phone else None,
        role_id=role.id,
        is_active=True,
        last_login_at=datetime.utcnow(),
    )
    db.add(new_admin)
    db.commit()
    db.refresh(new_admin)

    role_name = role.role_name
    expires_in_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    access_token = create_access_token(
        data={
            "sub": new_admin.email,
            "id": new_admin.id,
            "name": new_admin.full_name,
            "role": role_name,
        },
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=expires_in_seconds,
        user=UserProfile(
            id=new_admin.id,
            full_name=new_admin.full_name,
            email=new_admin.email,
            phone=new_admin.phone,
            role=role_name,
            is_active=new_admin.is_active,
            created_at=new_admin.created_at,
        ),
    )


@router.get("/me", response_model=UserProfile)
def get_current_user_profile(current_admin: Admin = Depends(get_current_admin)):
    """Return the profile of the currently logged-in user."""
    role_name = current_admin.role.role_name if current_admin.role else "ADMIN"
    return UserProfile(
        id=current_admin.id,
        full_name=current_admin.full_name,
        email=current_admin.email,
        phone=current_admin.phone,
        role=role_name,
        is_active=current_admin.is_active,
        created_at=current_admin.created_at,
    )


@router.post("/logout")
def logout():
    """Client-side logout acknowledgement."""
    return {"success": True, "message": "Successfully logged out"}
