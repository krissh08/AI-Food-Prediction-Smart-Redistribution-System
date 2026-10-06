from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.app.database.database import get_db
from backend.app.models.models import User, Notification
from backend.app.schemas.schemas import NotificationResponse
from backend.app.auth.auth import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["In-App Notifications"])

@router.get("", response_model=List[NotificationResponse])
def get_notifications(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notifs = db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.id.desc()).all()
    return notifs

@router.put("/{notif_id}/read")
def mark_notification_read(notif_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
    notif.read_status = True
    db.commit()
    return {"message": "Notification marked as read."}

@router.put("/read-all")
def mark_all_read(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.user_id == current_user.id).update({"read_status": True})
    db.commit()
    return {"message": "All notifications marked as read."}
