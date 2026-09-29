from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from typing import List, Optional
from datetime import datetime

from backend.database import get_db
from backend.models import Student, FeeRecord, Guardian, User
from backend.schemas import StudentOnboardRequest, StudentResponse

router = APIRouter(prefix="/students", tags=["Students"])

@router.get("", response_model=List[StudentResponse])
async def get_students(
    search: Optional[str] = None,
    level: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(Student).order_by(Student.created_at.desc())
    if search:
        s = f"%{search}%"
        query = query.where(
            or_(
                Student.full_name.ilike(s),
                Student.student_id_code.ilike(s),
                Student.guardian_name.ilike(s),
                Student.guardian_phone.ilike(s)
            )
        )
    if level and level != "All":
        query = query.where(Student.level == level)

    res = await db.execute(query)
    students = res.scalars().all()

    return [
        StudentResponse(
            id=s.id,
            studentId=s.student_id_code,
            rfidCardCode=s.rfid_card_code,
            fullName=s.full_name,
            dob=s.dob,
            gender=s.gender,
            level=s.level,
            classSection=s.class_section,
            guardianName=s.guardian_name,
            guardianEmail=s.guardian_email,
            guardianPhone=s.guardian_phone,
            homeAddress=s.home_address,
            status=s.status,
            studentEmail=s.student_email,
            defaultPassword=s.default_password
        )
        for s in students
    ]

@router.post("/onboard", response_model=StudentResponse)
async def onboard_student(req: StudentOnboardRequest, db: AsyncSession = Depends(get_db)):
    # Generate unique Student ID
    count_query = select(func.count(Student.id))
    count_res = await db.execute(count_query)
    total = count_res.scalar() or 0

    current_year = datetime.utcnow().year
    student_id = f"REMALJ-{current_year}-{str(total + 1).padStart(3, '0') if hasattr(str(total + 1), 'padStart') else f'{total + 1:03d}'}"
    card_code = req.rfidCardCode or f"CARD-{total + 1:03d}"
    student_email = f"{req.fullName.lower().replace(' ', '.')}@remaljcarewell.edu.gh"
    default_pass = req.defaultPassword or f"StuPass#{total + 1:03d}"

    new_student = Student(
        student_id_code=student_id,
        rfid_card_code=card_code,
        full_name=req.fullName,
        dob=req.dob,
        gender=req.gender,
        level=req.level,
        class_section=req.classSection or "A",
        guardian_name=req.guardianName,
        guardian_email=req.guardianEmail,
        guardian_phone=req.guardianPhone,
        home_address=req.homeAddress,
        student_email=student_email,
        default_password=default_pass,
        status="Active"
    )
    db.add(new_student)

    # Automatically initialize Fee Record
    billed = req.initialBilledAmount or (5200.0 if "JHS" in req.level else 5800.0 if "SHS" in req.level else 4800.0)
    new_fee = FeeRecord(
        student_id=student_id,
        student_name=req.fullName,
        guardian_name=req.guardianName,
        guardian_email=req.guardianEmail,
        term=req.term or "Term 1 · 2026",
        billed_amount=billed,
        paid_amount=0.0,
        balance=billed,
        status="Not Paid"
    )
    db.add(new_fee)

    await db.commit()
    await db.refresh(new_student)

    return StudentResponse(
        id=new_student.id,
        studentId=new_student.student_id_code,
        rfidCardCode=new_student.rfid_card_code,
        fullName=new_student.full_name,
        dob=new_student.dob,
        gender=new_student.gender,
        level=new_student.level,
        classSection=new_student.class_section,
        guardianName=new_student.guardian_name,
        guardianEmail=new_student.guardian_email,
        guardianPhone=new_student.guardian_phone,
        homeAddress=new_student.home_address,
        status=new_student.status,
        studentEmail=new_student.student_email,
        defaultPassword=new_student.default_password
    )

@router.delete("/{id}")
async def delete_student(id: str, db: AsyncSession = Depends(get_db)):
    query = select(Student).where(or_(Student.id == id, Student.student_id_code == id))
    res = await db.execute(query)
    student = res.scalars().first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Also clean up associated fee records
    fee_query = select(FeeRecord).where(FeeRecord.student_id == student.student_id_code)
    fee_res = await db.execute(fee_query)
    for fee in fee_res.scalars().all():
        await db.delete(fee)

    await db.delete(student)
    await db.commit()
    return {"success": True, "message": f"Student {id} deleted successfully"}
