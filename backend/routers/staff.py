from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List, Optional
from datetime import datetime, date

from backend.database import get_db
from backend.models import StaffMember, User
from pydantic import BaseModel

router = APIRouter(prefix="/staff", tags=["Staff & Teacher Directory"])

class StaffCreateRequest(BaseModel):
    staffId: Optional[str] = None
    name: str
    subject: Optional[str] = "General Education"
    classAssigned: Optional[str] = "Grade 4"
    email: str
    phone: Optional[str] = None
    role: Optional[str] = "Subject Teacher"
    status: Optional[str] = "Active"
    photo: Optional[str] = "👨‍🏫"
    bio: Optional[str] = None

class StaffUpdateRequest(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    classAssigned: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    photo: Optional[str] = None
    bio: Optional[str] = None

@router.get("")
async def get_staff(db: AsyncSession = Depends(get_db)):
    query = select(StaffMember).order_by(StaffMember.created_at.desc())
    res = await db.execute(query)
    staff = res.scalars().all()
    return [
        {
            "id": s.id,
            "staffId": s.staff_id,
            "name": s.name,
            "subject": s.subject,
            "classAssigned": s.class_assigned,
            "email": s.email,
            "phone": s.phone,
            "role": s.role,
            "status": s.status,
            "joinedDate": s.joined_date,
            "photo": s.photo,
            "bio": s.bio
        }
        for s in staff
    ]

@router.post("")
async def create_staff(req: StaffCreateRequest, db: AsyncSession = Depends(get_db)):
    staff_id = req.staffId or f"STF-{datetime.utcnow().year}-{abs(hash(req.email)) % 900 + 100}"
    new_staff = StaffMember(
        staff_id=staff_id,
        name=req.name,
        subject=req.subject or "General Education",
        class_assigned=req.classAssigned or "Grade 4",
        email=req.email.lower().strip(),
        phone=req.phone,
        role=req.role or "Subject Teacher",
        status=req.status or "Active",
        photo=req.photo or "👨‍🏫",
        bio=req.bio or f"{req.role or 'Staff'} at REMALJ Carewell Inspirational School."
    )
    db.add(new_staff)
    await db.commit()
    await db.refresh(new_staff)
    return {
        "id": new_staff.id,
        "staffId": new_staff.staff_id,
        "name": new_staff.name,
        "subject": new_staff.subject,
        "classAssigned": new_staff.class_assigned,
        "email": new_staff.email,
        "phone": new_staff.phone,
        "role": new_staff.role,
        "status": new_staff.status,
        "joinedDate": new_staff.joined_date,
        "photo": new_staff.photo,
        "bio": new_staff.bio
    }

@router.put("/{id}")
async def update_staff(id: str, req: StaffUpdateRequest, db: AsyncSession = Depends(get_db)):
    query = select(StaffMember).where(or_(StaffMember.id == id, StaffMember.staff_id == id))
    res = await db.execute(query)
    staff = res.scalars().first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    if req.name is not None: staff.name = req.name
    if req.subject is not None: staff.subject = req.subject
    if req.classAssigned is not None: staff.class_assigned = req.classAssigned
    if req.email is not None: staff.email = req.email.lower().strip()
    if req.phone is not None: staff.phone = req.phone
    if req.role is not None: staff.role = req.role
    if req.status is not None: staff.status = req.status
    if req.photo is not None: staff.photo = req.photo
    if req.bio is not None: staff.bio = req.bio

    await db.commit()
    await db.refresh(staff)
    return {
        "id": staff.id,
        "staffId": staff.staff_id,
        "name": staff.name,
        "subject": staff.subject,
        "classAssigned": staff.class_assigned,
        "email": staff.email,
        "phone": staff.phone,
        "role": staff.role,
        "status": staff.status,
        "joinedDate": staff.joined_date,
        "photo": staff.photo,
        "bio": staff.bio
    }

@router.delete("/{id}")
async def delete_staff(id: str, db: AsyncSession = Depends(get_db)):
    query = select(StaffMember).where(or_(StaffMember.id == id, StaffMember.staff_id == id))
    res = await db.execute(query)
    staff = res.scalars().first()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")

    await db.delete(staff)
    await db.commit()
    return {"success": True, "message": f"Staff member {id} removed successfully"}
