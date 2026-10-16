import os
import sys
import re
import argparse
import getpass
from sqlalchemy.orm import Session

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

from backend.app.database.database import SessionLocal, Base, engine
from backend.app.models.models import User
from backend.app.auth.auth import hash_password, log_audit_event
from backend.app.database.migrations import run_migrations

def validate_password_strength(password: str) -> bool:
    """Enforces minimum 10 characters, with uppercase, lowercase, digit, and special char."""
    if len(password) < 10:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"[a-z]", password):
        return False
    if not re.search(r"[0-9]", password):
        return False
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        return False
    return True

def init_first_admin(email: str = None, password: str = None, full_name: str = "System Administrator", db: Session = None):
    # Ensure migrations are applied if not in-memory test session
    if db is None:
        run_migrations()

    owns_db = False
    if db is None:
        db = SessionLocal()
        owns_db = True

    try:
        # 1. Idempotency & Security check: Refuse if any admin already exists
        existing_admin = db.query(User).filter(User.role == "admin").first()
        if existing_admin:
            print("\n[SECURITY NOTICE] An administrator account already exists.")
            print("For security reasons, the initial admin setup procedure is permanently disabled.")
            print("Existing Admin Email:", existing_admin.email)
            raise RuntimeError(f"An administrator account already exists ({existing_admin.email}). Setup is locked.")

        # 2. Collect email if not provided
        if not email:
            email = os.getenv("ADMIN_EMAIL")
            if not email and sys.stdin.isatty():
                email = input("Enter Administrator Email: ").strip()

        if not email or "@" not in email:
            raise ValueError("A valid administrator email address is required.")

        # Check if email is already taken by a different role
        if db.query(User).filter(User.email == email).first():
            raise ValueError(f"An account with email '{email}' already exists.")

        # 3. Collect password securely if not provided
        if not password:
            password = os.getenv("ADMIN_PASSWORD")
            if not password and sys.stdin.isatty():
                password = getpass.getpass("Enter Administrator Password (min 10 chars, uppercase, lowercase, digit, symbol): ")
                confirm = getpass.getpass("Confirm Administrator Password: ")
                if password != confirm:
                    raise ValueError("Passwords do not match.")

        if not password or not validate_password_strength(password):
            raise ValueError("Password must be at least 10 characters long and include uppercase, lowercase, number, and special character.")

        # 4. Create first administrator account securely
        admin_user = User(
            name=full_name,
            email=email,
            password_hash=hash_password(password),
            role="admin",
            phone="+1-800-555-ADMIN",
            is_active=True,
            email_verified=True,
            approval_status="APPROVED"
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        # 5. Log audit event
        log_audit_event(
            db=db,
            action="ADMIN_INITIALIZED",
            actor_id=admin_user.id,
            target_type="user",
            target_id=admin_user.id,
            metadata={"email": email, "setup_method": "CLI"}
        )

        print("\n======================================================================")
        print("          NOURISHSYNC - INITIAL ADMINISTRATOR SETUP SUCCESSFUL        ")
        print("======================================================================")
        print(f"Administrator Email : {email}")
        print("Role                : admin")
        print("Status              : Active & Verified")
        print("Notice              : Setup mechanism is now locked and disabled.")
        print("======================================================================\n")
        return admin_user

    finally:
        if owns_db:
            db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="One-time secure initialization of NourishSync First Administrator.")
    parser.add_argument("--email", help="Administrator email address")
    parser.add_argument("--password", help="Administrator secure password")
    parser.add_argument("--name", default="System Administrator", help="Administrator full name")

    args = parser.parse_args()
    try:
        admin = init_first_admin(email=args.email, password=args.password, full_name=args.name)
        sys.exit(0 if admin else 1)
    except Exception as e:
        print(f"[ERROR] {e}")
        sys.exit(1)
