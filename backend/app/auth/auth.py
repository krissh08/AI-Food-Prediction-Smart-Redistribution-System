import os
import datetime
import hashlib
import json
import secrets
import bcrypt
import jwt
from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.models.models import User, AuditLog

SECRET_KEY = os.getenv("JWT_SECRET", "super_secret_devops_food_surplus_key_2026")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")) # 24 hours

security = HTTPBearer()

def hash_password(password: str) -> str:
    """Hashes a password using bcrypt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain password against stored hash.
    Supports bcrypt hashes ($2b$, $2a$, $2y$) and legacy PBKDF2 hashes (salt$hash).
    """
    try:
        if not hashed_password:
            return False
        # Check if bcrypt hash
        if hashed_password.startswith(("$2a$", "$2b$", "$2y$")):
            return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
        
        # Legacy PBKDF2 check for previously seeded accounts
        if "$" in hashed_password:
            salt, stored_hash = hashed_password.split("$", 1)
            pwd_hash = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt.encode('utf-8'), 100000)
            return pwd_hash.hex() == stored_hash
        
        return False
    except Exception:
        return False

def hash_token(raw_token: str) -> str:
    """Returns SHA-256 hash of a verification or session token."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()

def generate_random_token() -> str:
    """Generates a cryptographically secure random token."""
    return secrets.token_urlsafe(32)

def create_access_token(data: dict, expires_delta: datetime.timedelta = None) -> str:
    to_encode = data.copy()
    if "sub" in to_encode:
        to_encode["sub"] = str(to_encode["sub"])

    if expires_delta:
        expire = datetime.datetime.now(datetime.timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def log_audit_event(
    db: Session,
    action: str,
    actor_id: Optional[int] = None,
    target_type: Optional[str] = None,
    target_id: Optional[int] = None,
    metadata: Optional[dict] = None
):
    """Safely logs an audit record to the audit_logs table."""
    try:
        entry = AuditLog(
            actor_id=actor_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            metadata_json=json.dumps(metadata) if metadata else None,
            created_at=datetime.datetime.utcnow()
        )
        db.add(entry)
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[AUDIT LOG ERROR] Failed to record audit log: {e}")

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials or token expired.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_raw = payload.get("sub")
        role: str = payload.get("role")
        if user_id_raw is None or role is None:
            raise credentials_exception
        user_id = int(user_id_raw)
    except Exception:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=403, detail="User account is inactive or disabled.")
    
    return user

def require_role(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: You are logged in as '{current_user.role}'. Required role: '{'/'.join(allowed_roles)}'."
            )
        return current_user
    return role_checker

def require_admin(current_user: User = Depends(require_role(["admin"]))):
    return current_user

def require_approved_donor(current_user: User = Depends(require_role(["donor"]))):
    """
    Enforces that donor has verified their email AND has been approved by admin.
    Unapproved or pending donors cannot access operational features.
    """
    if not current_user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email before accessing the donor portal."
        )
    if current_user.approval_status != "APPROVED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your organization application is awaiting administrator approval. Operational access is locked."
        )
    return current_user

# Alias for backward compatibility
require_donor = require_approved_donor

def require_approved_acceptor(current_user: User = Depends(require_role(["acceptor"]))):
    """
    Enforces that acceptor has verified their email AND has been approved by admin.
    Unapproved or pending acceptors cannot access operational features.
    """
    if not current_user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email before accessing the acceptor portal."
        )
    if current_user.approval_status != "APPROVED":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your organization application is awaiting administrator approval. Operational access is locked."
        )
    return current_user

# Alias for backward compatibility
require_acceptor = require_approved_acceptor
