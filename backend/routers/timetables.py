from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from backend.database import get_db
from backend.models import TimetableEntry
from backend.schemas import TimetableCreateRequest

router = APIRouter(prefix="/timetables", tags=["Timetables"])

@router.get("")
async def get_timetables(classLevel: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    query = select(TimetableEntry)
    if classLevel and classLevel != "All":
        query = query.where(TimetableEntry.class_level == classLevel)
    res = await db.execute(query)
    entries = res.scalars().all()
    
    if not entries:
        # Return default schedule if none seeded
        return [
            { "id": "math-mon", "day": "Monday", "time": "08:00 AM", "subject": "Pure Mathematics", "room": "Room 402", "lecturer": "Prof. Mensah" },
            { "id": "physics-tue", "day": "Tuesday", "time": "10:30 AM", "subject": "Physics Lab", "room": "Science Block 1", "lecturer": "Mr. Boateng" },
            { "id": "english-wed", "day": "Wednesday", "time": "08:00 AM", "subject": "Literature in English", "room": "Auditorium B", "lecturer": "Dr. Anane" },
            { "id": "ict-mon", "day": "Monday", "time": "01:00 PM", "subject": "ICT Project", "room": "Lab 2", "lecturer": "Ms. Mensah" },
            { "id": "english-tue", "day": "Tuesday", "time": "01:00 PM", "subject": "English Essay", "room": "Room 204", "lecturer": "Mrs. Adjei" },
            { "id": "math-wed", "day": "Wednesday", "time": "01:00 PM", "subject": "Mathematics", "room": "Room 402", "lecturer": "Prof. Mensah" },
        ]

    return entries

@router.post("")
async def create_timetable_entry(req: TimetableCreateRequest, db: AsyncSession = Depends(get_db)):
    entry = TimetableEntry(
        day=req.day,
        time=req.time,
        subject=req.subject,
        room=req.room,
        lecturer=req.lecturer,
        class_level=req.class_level or "All"
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry
