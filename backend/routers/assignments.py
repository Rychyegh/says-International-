from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional

from backend.database import get_db
from backend.models import Assignment
from backend.schemas import AssignmentCreateRequest

router = APIRouter(prefix="/assignments", tags=["Assignments"])

@router.get("")
async def get_assignments(db: AsyncSession = Depends(get_db)):
    query = select(Assignment).order_by(Assignment.created_at.desc())
    res = await db.execute(query)
    assignments = res.scalars().all()
    return [
        {
            "id": a.id,
            "title": a.title,
            "instructions": a.instructions,
            "audience": a.audience,
            "due": a.due_date,
            "author": a.author,
            "status": a.status
        }
        for a in assignments
    ]

@router.post("")
async def create_assignment(req: AssignmentCreateRequest, db: AsyncSession = Depends(get_db)):
    assignment = Assignment(
        title=req.title,
        instructions=req.instructions,
        audience=req.audience or "All Students",
        due_date=req.due_date,
        author=req.author or "Staff"
    )
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)
    return assignment
