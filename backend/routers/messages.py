from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from backend.database import get_db
from backend.models import Message
from backend.schemas import MessageSendRequest

router = APIRouter(prefix="/messages", tags=["Messages & Announcements"])

@router.get("")
async def get_messages(db: AsyncSession = Depends(get_db)):
    query = select(Message).order_by(Message.sent_at.desc())
    res = await db.execute(query)
    messages = res.scalars().all()
    if not messages:
        return [
            {
                "id": "message-001",
                "from": "Mr. Samuel Amponsah",
                "senderRole": "Staff",
                "to": "Parents",
                "recipient": "Mrs. Angela Edwards",
                "subject": "Academic update",
                "body": "Term results will be published after moderation.",
                "sentAt": "20 Aug 2026, 09:15"
            }
        ]
    return [
        {
            "id": m.id,
            "from": m.from_name,
            "senderRole": m.sender_role,
            "to": m.to_role,
            "recipient": m.recipient_name or m.recipient_email,
            "studentName": m.student_name,
            "subject": m.subject,
            "body": m.body,
            "sentAt": m.sent_at
        }
        for m in messages
    ]

@router.post("")
async def send_message(req: MessageSendRequest, db: AsyncSession = Depends(get_db)):
    msg = Message(
        from_name=req.from_name or "Staff",
        sender_role=req.sender_role or "Staff",
        to_role=req.to_role or "Parents",
        recipient_name=req.recipient_name,
        recipient_email=req.recipient_email,
        student_name=req.student_name,
        subject=req.subject,
        body=req.body
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return {
        "success": True,
        "message": f"Message '{req.subject}' sent successfully",
        "messageId": msg.id
    }
