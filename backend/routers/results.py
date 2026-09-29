from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime

from backend.database import get_db
from backend.models import AcademicResult
from backend.schemas import ResultCreateRequest, ResultStatusRequest

router = APIRouter(prefix="/results", tags=["Academic Results & Transcripts"])

@router.get("")
async def get_results(studentId: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    query = select(AcademicResult).order_by(AcademicResult.updated_at.desc())
    if studentId:
        query = query.where(AcademicResult.student_id == studentId)
    res = await db.execute(query)
    results = res.scalars().all()
    return results

@router.post("")
async def record_result(req: ResultCreateRequest, db: AsyncSession = Depends(get_db)):
    res_entry = AcademicResult(
        student_id=req.student_id,
        student_name=req.student_name,
        subject=req.subject,
        score=req.score,
        grade=req.grade,
        lecturer=req.lecturer,
        status="Pending Approval"
    )
    db.add(res_entry)
    await db.commit()
    await db.refresh(res_entry)
    return res_entry

@router.patch("/{id}/status")
async def update_result_status(id: str, req: ResultStatusRequest, db: AsyncSession = Depends(get_db)):
    query = select(AcademicResult).where(AcademicResult.id == id)
    res = await db.execute(query)
    result = res.scalars().first()
    if not result:
        raise HTTPException(status_code=404, detail="Result entry not found")

    result.status = req.status
    if req.decline_note:
        result.decline_note = req.decline_note

    await db.commit()
    await db.refresh(result)
    return result
