import os
import datetime
import hashlib
import secrets
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.models.models import User

SECRET_KEY = os.getenv("JWT_SECRET", "super_secret_devops_food_surplus_key_2026")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")) # 24 hours

security = HTTPBearer()

def hash_password(password: str) -> str:
    """Hashes a password using PBKDF2-HMAC-SHA256."""
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return f"{salt}${pwd_hash.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against stored salt$hash string."""
    try:
        if "$" not in hashed_password:
            return False
        salt, stored_hash = hashed_password.split("$", 1)
        pwd_hash = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt.encode('utf-8'), 100000)
        return pwd_hash.hex() == stored_hash
    except Exception:
        return False

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
    if user is None or not user.is_active:
        raise HTTPException(status_code=403, detail="User account is inactive or disabled.")
    
    return user

def require_role(allowed_roles: list):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: You are logged in as '{current_user.role}'. Required role: '{'/'.join(allowed_roles)}'."
            )
        return current_user
    return role_checker

def require_donor(current_user: User = Depends(require_role(["donor"]))):
    return current_user

def require_acceptor(current_user: User = Depends(require_role(["acceptor"]))):
    return current_user

def require_admin(current_user: User = Depends(require_role(["admin"]))):
    return current_user
