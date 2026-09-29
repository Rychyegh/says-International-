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
    return [
        {
            "id": t.id,
            "day": t.day,
            "time": t.time,
            "subject": t.subject,
            "room": t.room,
            "lecturer": t.lecturer,
            "class_level": t.class_level
        }
        for t in entries
    ]

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
