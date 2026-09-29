from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from datetime import datetime

from backend.database import get_db
from backend.models import Application
from backend.schemas import (
    ApplicationCreateRequest, ApplicationStatusRequest, ApplicationUpdateRequest
)

router = APIRouter(prefix="/admissions/applications", tags=["Admissions"])

@router.get("")
async def get_applications(db: AsyncSession = Depends(get_db)):
    query = select(Application).order_by(Application.submitted_at.desc())
    res = await db.execute(query)
    apps = res.scalars().all()
    return [
        {
            "id": a.id,
            "learner": a.learner_name,
            "learner_name": a.learner_name,
            "guardian": a.guardian_name,
            "guardian_name": a.guardian_name,
            "email": a.contact_email,
            "contact_email": a.contact_email,
            "phone": a.contact_phone,
            "contact_phone": a.contact_phone,
            "level": a.applying_level,
            "applying_level": a.applying_level,
            "status": a.status,
            "office_use_notes": a.office_use_notes,
            "submittedAt": a.submitted_at.strftime('%d %b %Y, %H:%M') if a.submitted_at else "Today",
            "formData": a.form_data or {}
        }
        for a in apps
    ]

@router.post("")
async def submit_application(req: ApplicationCreateRequest, db: AsyncSession = Depends(get_db)):
    app_entry = Application(
        learner_name=req.learner_name,
        guardian_name=req.guardian_name,
        contact_email=req.contact_email,
        contact_phone=req.contact_phone,
        applying_level=req.applying_level,
        status="Documents review",
        form_data=req.form_data or {}
    )
    db.add(app_entry)
    await db.commit()
    await db.refresh(app_entry)
    return {
        "success": True,
        "message": f"Admission application submitted for {req.learner_name}",
        "applicationId": app_entry.id
    }

@router.patch("/{id}/status")
async def update_application_status(id: str, req: ApplicationStatusRequest, db: AsyncSession = Depends(get_db)):
    query = select(Application).where(Application.id == id)
    res = await db.execute(query)
    app_entry = res.scalars().first()
    if not app_entry:
        raise HTTPException(status_code=404, detail="Application not found")

    app_entry.status = req.status
    if req.office_use_notes:
        app_entry.office_use_notes = req.office_use_notes

    await db.commit()
    await db.refresh(app_entry)
    return {
        "success": True,
        "message": f"Application status updated to {req.status}",
        "applicationId": app_entry.id
    }

@router.put("/{id}")
async def update_application(id: str, req: ApplicationUpdateRequest, db: AsyncSession = Depends(get_db)):
    query = select(Application).where(Application.id == id)
    res = await db.execute(query)
    app_entry = res.scalars().first()
    if not app_entry:
        raise HTTPException(status_code=404, detail="Application not found")

    if req.learner_name:
        app_entry.learner_name = req.learner_name
    if req.guardian_name:
        app_entry.guardian_name = req.guardian_name
    if req.contact_email:
        app_entry.contact_email = req.contact_email
    if req.contact_phone:
        app_entry.contact_phone = req.contact_phone
    if req.applying_level:
        app_entry.applying_level = req.applying_level
    if req.status:
        app_entry.status = req.status
    if req.form_data:
        app_entry.form_data = {**(app_entry.form_data or {}), **req.form_data}

    await db.commit()
    await db.refresh(app_entry)
    return {
        "success": True,
        "message": f"Application updated successfully for {app_entry.learner_name}",
        "applicationId": app_entry.id
    }

@router.delete("/{id}")
async def delete_application(id: str, db: AsyncSession = Depends(get_db)):
    query = select(Application).where(Application.id == id)
    res = await db.execute(query)
    app_entry = res.scalars().first()
    if not app_entry:
        raise HTTPException(status_code=404, detail="Application not found")

    await db.delete(app_entry)
    await db.commit()
    return {"success": True, "message": f"Application {id} deleted"}
