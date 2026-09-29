from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime
import os

from backend.database import get_db
from backend.models import ReportRequest
from backend.schemas import ReportRequestCreate

router = APIRouter(prefix="/reports", tags=["Academic Reports"])

@router.get("/requests")
async def get_report_requests(db: AsyncSession = Depends(get_db)):
    query = select(ReportRequest).order_by(ReportRequest.created_at.desc())
    res = await db.execute(query)
    return res.scalars().all()

@router.post("/requests")
async def create_report_request(req: ReportRequestCreate, db: AsyncSession = Depends(get_db)):
    report = ReportRequest(
        child=req.child,
        semester=req.semester,
        note=req.note,
        status="Processing"
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return {
        "success": True,
        "message": f"Report request created for {req.child} ({req.semester})",
        "requestId": report.id
    }

@router.post("/upload")
async def upload_report(
    requestId: str = Form(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    query = select(ReportRequest).where(ReportRequest.id == requestId)
    res = await db.execute(query)
    report = res.scalars().first()
    if not report:
        raise HTTPException(status_code=404, detail="Report request not found")

    upload_dir = "./uploads/reports"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, f"{requestId}_{file.filename}")

    contents = await file.read()
    with open(file_path, "wb") as f:
        f.write(contents)

    report.status = "Available"
    report.file_url = f"/uploads/reports/{requestId}_{file.filename}"
    await db.commit()

    return {
        "success": True,
        "message": f"Uploaded terminal report for request {requestId}",
        "fileUrl": report.file_url
    }
