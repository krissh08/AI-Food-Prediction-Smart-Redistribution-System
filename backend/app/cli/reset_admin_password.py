import os
import sys
import re
import argparse
import getpass

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

from backend.app.database.database import SessionLocal
from backend.app.models.models import User
from backend.app.auth.auth import hash_password, log_audit_event

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

def reset_admin_password(new_password: str = None, admin_email: str = None):
    db = SessionLocal()
    try:
        # Find admin account
        query = db.query(User).filter(User.role == "admin")
        if admin_email:
            admin_user = query.filter(User.email == admin_email).first()
        else:
            admin_user = query.first()

        if not admin_user:
            print("[ERROR] No administrator account found in database.")
            return False

        # Prompt for password if not provided
        if not new_password:
            new_password = getpass.getpass(f"Enter new password for Admin ({admin_user.email}): ")
            confirm = getpass.getpass("Confirm new password: ")
            if new_password != confirm:
                print("[ERROR] Passwords do not match.")
                return False

        if not validate_password_strength(new_password):
            print("[ERROR] Password must be at least 10 characters and contain uppercase, lowercase, number, and special character.")
            return False

        # Update password
        admin_user.password_hash = hash_password(new_password)
        db.commit()

        # Log audit event
        try:
            log_audit_event(
                db=db,
                action="ADMIN_PASSWORD_RESET",
                actor_id=admin_user.id,
                target_type="user",
                target_id=admin_user.id,
                metadata={"email": admin_user.email, "method": "CLI"}
            )
        except Exception:
            pass

        print("\n" + "=" * 65)
        print("          NOURISHSYNC - ADMIN PASSWORD RESET SUCCESSFUL           ")
        print("=" * 65)
        print(f"Admin Email  : {admin_user.email}")
        print("Status       : Password successfully updated in database.")
        print("Login URL    : http://localhost:5173/admin/login")
        print("=" * 65 + "\n")
        return True

    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Reset NourishSync Administrator Password")
    parser.add_argument("--password", "-p", help="New administrator password")
    parser.add_argument("--email", "-e", help="Admin email address (optional if only 1 admin exists)")

    args = parser.parse_args()
    success = reset_admin_password(new_password=args.password, admin_email=args.email)
    sys.exit(0 if success else 1)
