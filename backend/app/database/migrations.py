import datetime
from sqlalchemy import text, inspect
from sqlalchemy.orm import Session
from backend.app.database.database import engine, Base, SessionLocal
from backend.app.models.models import (
    User,
    DonorProfile,
    AcceptorProfile,
    Application,
    ApplicationDocument,
    EmailVerificationToken,
    AuditLog
)

def run_migrations():
    """
    Idempotent schema migration for SQLite and PostgreSQL.
    Creates newly introduced tables and safely alters existing tables.
    """
    print("[MIGRATION] Ensuring database tables and schema are up to date...")
    # 1. Create all missing tables
    Base.metadata.create_all(bind=engine)

    # 2. Inspect and add missing columns to existing tables
    inspector = inspect(engine)

    with engine.connect() as conn:
        # Check users table
        user_cols = [c["name"] for c in inspector.get_columns("users")]
        if "email_verified" not in user_cols:
            print("[MIGRATION] Adding column email_verified to users table...")
            conn.execute(text("ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT 0"))
            conn.commit()
        if "approval_status" not in user_cols:
            print("[MIGRATION] Adding column approval_status to users table...")
            conn.execute(text("ALTER TABLE users ADD COLUMN approval_status VARCHAR(50) DEFAULT 'EMAIL_UNVERIFIED'"))
            conn.commit()
        if "updated_at" not in user_cols:
            print("[MIGRATION] Adding column updated_at to users table...")
            conn.execute(text("ALTER TABLE users ADD COLUMN updated_at DATETIME"))
            conn.commit()

        # Check donor_profiles table
        donor_cols = [c["name"] for c in inspector.get_columns("donor_profiles")]
        if "parent_institution" not in donor_cols:
            print("[MIGRATION] Adding column parent_institution to donor_profiles table...")
            conn.execute(text("ALTER TABLE donor_profiles ADD COLUMN parent_institution TEXT"))
            conn.commit()

        # Check acceptor_profiles table
        acceptor_cols = [c["name"] for c in inspector.get_columns("acceptor_profiles")]
        if "food_distribution_activities" not in acceptor_cols:
            print("[MIGRATION] Adding column food_distribution_activities to acceptor_profiles table...")
            conn.execute(text("ALTER TABLE acceptor_profiles ADD COLUMN food_distribution_activities TEXT"))
            conn.commit()

    # 3. Synchronize demo accounts
    db: Session = SessionLocal()
    try:
        demo_emails = ["donor@demo.com", "acceptor@demo.com"]
        for email in demo_emails:
            u = db.query(User).filter(User.email == email).first()
            if u:
                u.email_verified = True
                u.approval_status = "APPROVED"
                u.is_active = True

                # Ensure an approved Application record exists for the demo account
                existing_app = db.query(Application).filter(Application.user_id == u.id).first()
                if not existing_app:
                    org_name = u.name
                    org_type = "Restaurant" if u.role == "donor" else "NGO"
                    if u.role == "donor" and u.donor_profile:
                        org_name = u.donor_profile.organization_name
                        org_type = u.donor_profile.organization_type
                    elif u.role == "acceptor" and u.acceptor_profile:
                        org_name = u.acceptor_profile.organization_name
                        org_type = u.acceptor_profile.organization_type

                    demo_app = Application(
                        user_id=u.id,
                        application_type=u.role,
                        organization_name=org_name,
                        organization_type=org_type,
                        contact_name=u.name,
                        status="APPROVED",
                        submitted_at=u.created_at or datetime.datetime.utcnow(),
                        reviewed_at=datetime.datetime.utcnow(),
                        created_at=u.created_at or datetime.datetime.utcnow()
                    )
                    db.add(demo_app)
        db.commit()
        print("[MIGRATION] Schema migration and demo synchronization complete.")
    finally:
        db.close()

if __name__ == "__main__":
    run_migrations()
