from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List, Optional
from datetime import datetime, date

from backend.database import get_db
from backend.models import SemesterRegistration, ExamRegistration
from pydantic import BaseModel

router = APIRouter(prefix="/academic", tags=["Academic & Examinations"])

class SemesterRegCreate(BaseModel):
    studentId: str
    studentName: str
    classLevel: str
    academicYear: Optional[str] = "2026/2027"
    term: Optional[str] = "Term 1"
    status: Optional[str] = "Registered"

class ExamRegCreate(BaseModel):
    studentId: str
    studentName: str
    classLevel: str
    academicYear: Optional[str] = "2025/2026"
    term: Optional[str] = "Term 1"
    examType: Optional[str] = "End-of-Term Final Examination"
    indexNumber: Optional[str] = None
    examCenter: Optional[str] = "Main Examination Hall A"
    subjects: Optional[List[str]] = None
    registeredBy: Optional[str] = "Academic Head / Admin"

# --- Semester Registrations ---
@router.get("/semester-registrations")
async def get_semester_registrations(db: AsyncSession = Depends(get_db)):
    query = select(SemesterRegistration).order_by(SemesterRegistration.created_at.desc())
    res = await db.execute(query)
    regs = res.scalars().all()
    return [
        {
            "id": r.id,
            "studentId": r.student_id,
            "studentName": r.student_name,
            "classLevel": r.class_level,
            "academicYear": r.academic_year,
            "term": r.term,
            "status": r.status,
            "registeredAt": r.registered_at
        }
        for r in regs
    ]

@router.post("/semester-registrations")
async def create_semester_registration(req: SemesterRegCreate, db: AsyncSession = Depends(get_db)):
    new_reg = SemesterRegistration(
        student_id=req.studentId,
        student_name=req.studentName,
        class_level=req.classLevel,
        academic_year=req.academicYear or "2026/2027",
        term=req.term or "Term 1",
        status=req.status or "Registered"
    )
    db.add(new_reg)
    await db.commit()
    await db.refresh(new_reg)
    return {
        "id": new_reg.id,
        "studentId": new_reg.student_id,
        "studentName": new_reg.student_name,
        "classLevel": new_reg.class_level,
        "academicYear": new_reg.academic_year,
        "term": new_reg.term,
        "status": new_reg.status,
        "registeredAt": new_reg.registered_at
    }

@router.delete("/semester-registrations/{id}")
async def delete_semester_registration(id: str, db: AsyncSession = Depends(get_db)):
    query = select(SemesterRegistration).where(or_(SemesterRegistration.id == id, SemesterRegistration.student_id == id))
    res = await db.execute(query)
    reg = res.scalars().first()
    if not reg:
        raise HTTPException(status_code=404, detail="Semester registration not found")
    await db.delete(reg)
    await db.commit()
    return {"success": True, "message": "Semester registration deleted"}

# --- Exam Registrations ---
@router.get("/exam-registrations")
async def get_exam_registrations(db: AsyncSession = Depends(get_db)):
    query = select(ExamRegistration).order_by(ExamRegistration.created_at.desc())
    res = await db.execute(query)
    exams = res.scalars().all()
    return [
        {
            "id": e.id,
            "studentId": e.student_id,
            "studentName": e.student_name,
            "classLevel": e.class_level,
            "academicYear": e.academic_year,
            "term": e.term,
            "examType": e.exam_type,
            "indexNumber": e.index_number,
            "examCenter": e.exam_center,
            "subjects": e.subjects or [],
            "registeredAt": e.registered_at,
            "registeredBy": e.registered_by,
            "status": e.status
        }
        for e in exams
    ]

@router.post("/exam-registrations")
async def create_exam_registration(req: ExamRegCreate, db: AsyncSession = Depends(get_db)):
    index_no = req.indexNumber or f"EXAM-{datetime.utcnow().year}-{abs(hash(req.studentId)) % 900 + 100}"
    new_exam = ExamRegistration(
        student_id=req.studentId,
        student_name=req.studentName,
        class_level=req.classLevel,
        academic_year=req.academicYear or "2025/2026",
        term=req.term or "Term 1",
        exam_type=req.examType or "End-of-Term Final Examination",
        index_number=index_no,
        exam_center=req.examCenter or "Main Examination Hall A",
        subjects=req.subjects or [],
        registered_by=req.registeredBy or "Academic Head / Admin",
        status="Registered - Hall Pass Valid"
    )
    db.add(new_exam)
    await db.commit()
    await db.refresh(new_exam)
    return {
        "id": new_exam.id,
        "studentId": new_exam.student_id,
        "studentName": new_exam.student_name,
        "classLevel": new_exam.class_level,
        "academicYear": new_exam.academic_year,
        "term": new_exam.term,
        "examType": new_exam.exam_type,
        "indexNumber": new_exam.index_number,
        "examCenter": new_exam.exam_center,
        "subjects": new_exam.subjects or [],
        "registeredAt": new_exam.registered_at,
        "registeredBy": new_exam.registered_by,
        "status": new_exam.status
    }

@router.delete("/exam-registrations/{id}")
async def delete_exam_registration(id: str, db: AsyncSession = Depends(get_db)):
    query = select(ExamRegistration).where(or_(ExamRegistration.id == id, ExamRegistration.index_number == id))
    res = await db.execute(query)
    exam = res.scalars().first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam registration not found")
    await db.delete(exam)
    await db.commit()
    return {"success": True, "message": "Exam registration deleted"}
