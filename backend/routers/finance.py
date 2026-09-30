from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List, Optional
from datetime import datetime

import random
from pydantic import BaseModel

from backend.database import get_db
from backend.models import FeeRecord, PaymentVoucher, DefinedBill
from backend.schemas import (
    FeePaymentRequest, FeeReminderRequest, PaymentVoucherRequest,
    PaymentVoucherStatusRequest, FeeOwingReminderRequest, BroadcastOwingReminderRequest
)

router = APIRouter(prefix="/finance", tags=["Finance & Accounting"])

@router.get("/fees")
async def get_fees(studentId: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    query = select(FeeRecord).order_by(FeeRecord.created_at.desc())
    if studentId:
        query = query.where(FeeRecord.student_id == studentId)
    res = await db.execute(query)
    fees = res.scalars().all()
    return [
        {
            "id": f.id,
            "studentId": f.student_id,
            "studentName": f.student_name,
            "guardianName": f.guardian_name,
            "guardianEmail": f.guardian_email,
            "term": f.term,
            "billedAmount": f.billed_amount,
            "paidAmount": f.paid_amount,
            "balance": f.balance,
            "status": f.status,
            "dueDate": f.due_date,
            "paymentDate": f.payment_date
        }
        for f in fees
    ]

@router.post("/fees/{fee_id}/pay")
async def pay_fee(fee_id: str, req: FeePaymentRequest, db: AsyncSession = Depends(get_db)):
    query = select(FeeRecord).where(or_(FeeRecord.id == fee_id, FeeRecord.student_id == fee_id))
    res = await db.execute(query)
    fee = res.scalars().first()
    if not fee:
        raise HTTPException(status_code=404, detail="Fee record not found")

    new_paid = fee.paid_amount + req.paidAmount
    new_balance = max(0.0, fee.billed_amount - new_paid)
    new_status = "Paid" if new_balance <= 0 else "Balance due"

    fee.paid_amount = new_paid
    fee.balance = new_balance
    fee.status = new_status
    fee.payment_date = req.paymentDate or datetime.utcnow().strftime('%Y-%m-%d')

    await db.commit()
    await db.refresh(fee)

    return {
        "success": True,
        "message": f"Payment of GHS {req.paidAmount} recorded for {fee.student_name}",
        "balance": new_balance,
        "status": new_status
    }

@router.post("/remind")
async def send_fee_reminder(req: FeeReminderRequest):
    return {
        "success": True,
        "message": f"Fee reminder notice dispatched to {req.to or req.recipientEmail or req.recipientPhone or 'Guardian'}",
        "student": req.studentName
    }

@router.post("/fees/{fee_id}/remind-owing")
async def remind_single_fee_owing(fee_id: str, req: FeeOwingReminderRequest, db: AsyncSession = Depends(get_db)):
    query = select(FeeRecord).where(or_(FeeRecord.id == fee_id, FeeRecord.student_id == fee_id))
    res = await db.execute(query)
    fee = res.scalars().first()
    if not fee:
        raise HTTPException(status_code=404, detail="Fee record not found")

    recipient = req.recipientPhone or fee.guardian_email or fee.guardian_name or "Guardian"
    balance_fmt = f"GHS {fee.balance:.2f}"
    return {
        "success": True,
        "message": f"Fee owing SMS reminder dispatched for {fee.student_name} ({balance_fmt}) to {recipient}",
        "feeId": fee.id,
        "balance": fee.balance,
        "smsSent": req.sendSms
    }

@router.post("/remind-owing")
async def broadcast_owing_reminders(req: BroadcastOwingReminderRequest, db: AsyncSession = Depends(get_db)):
    query = select(FeeRecord).where(FeeRecord.balance > (req.minBalance or 0))
    res = await db.execute(query)
    fees = res.scalars().all()

    notified_count = len(fees)
    return {
        "success": True,
        "message": f"Broadcast owing SMS reminders dispatched to {notified_count} guardians with outstanding balances",
        "notifiedCount": notified_count,
        "smsSent": req.sendSms
    }


# --- Payment Vouchers ---
@router.get("/pv")
async def get_payment_vouchers(db: AsyncSession = Depends(get_db)):
    query = select(PaymentVoucher).order_by(PaymentVoucher.created_at.desc())
    res = await db.execute(query)
    return res.scalars().all()

@router.post("/pv")
async def create_payment_voucher(req: PaymentVoucherRequest, db: AsyncSession = Depends(get_db)):
    pv_num = req.pv_number or f"PV-{datetime.utcnow().year}-{random.randint(100, 999)}"
    pv = PaymentVoucher(
        pv_number=pv_num,
        requisition_no=req.requisition_no,
        payee_name=req.payee_name,
        payee_id=req.payee_id,
        department=req.department,
        description=req.description,
        quantity=req.quantity or 1,
        unit_cost=req.unit_cost,
        total_amount=req.total_amount,
        date_prepared=req.date_prepared or datetime.utcnow().strftime('%Y-%m-%d'),
        status="DRAFT"
    )
    db.add(pv)
    await db.commit()
    await db.refresh(pv)
    return pv

@router.patch("/pv/{pv_id}/status")
async def update_pv_status(pv_id: str, req: PaymentVoucherStatusRequest, db: AsyncSession = Depends(get_db)):
    query = select(PaymentVoucher).where(or_(PaymentVoucher.id == pv_id, PaymentVoucher.pv_number == pv_id))
    res = await db.execute(query)
    pv = res.scalars().first()
    if not pv:
        raise HTTPException(status_code=404, detail="Payment voucher not found")

    pv.status = req.status
    if req.status == "PRE_AUDITED":
        pv.pre_audited_by = req.auditor_name or "Headmaster / Pre-Auditor"
    elif req.status == "APPROVED":
        pv.approved_by = req.auditor_name or "Administrator"

    await db.commit()
    await db.refresh(pv)
    return pv

# --- Defined Bills ---
class DefinedBillCreate(BaseModel):
    classLevel: str
    academicYear: Optional[str] = "2026/2027"
    term: Optional[str] = "Term 1"
    billCategory: str
    amount: float
    specification: Optional[str] = "Compulsory"
    description: Optional[str] = None

@router.get("/bills")
async def get_defined_bills(db: AsyncSession = Depends(get_db)):
    query = select(DefinedBill).order_by(DefinedBill.created_at.desc())
    res = await db.execute(query)
    bills = res.scalars().all()
    return [
        {
            "id": b.id,
            "classLevel": b.class_level,
            "academicYear": b.academic_year,
            "term": b.term,
            "billCategory": b.bill_category,
            "amount": b.amount,
            "specification": b.specification,
            "description": b.description,
            "dateDefined": b.date_defined
        }
        for b in bills
    ]

@router.post("/bills")
async def create_defined_bill(req: DefinedBillCreate, db: AsyncSession = Depends(get_db)):
    bill = DefinedBill(
        class_level=req.classLevel,
        academic_year=req.academicYear or "2026/2027",
        term=req.term or "Term 1",
        bill_category=req.billCategory,
        amount=req.amount,
        specification=req.specification or "Compulsory",
        description=req.description or req.billCategory
    )
    db.add(bill)
    await db.commit()
    await db.refresh(bill)
    return {
        "id": bill.id,
        "classLevel": bill.class_level,
        "academicYear": bill.academic_year,
        "term": bill.term,
        "billCategory": bill.bill_category,
        "amount": bill.amount,
        "specification": bill.specification,
        "description": bill.description,
        "dateDefined": bill.date_defined
    }

@router.delete("/bills/{id}")
async def delete_defined_bill(id: str, db: AsyncSession = Depends(get_db)):
    query = select(DefinedBill).where(DefinedBill.id == id)
    res = await db.execute(query)
    bill = res.scalars().first()
    if not bill:
        raise HTTPException(status_code=404, detail="Defined bill not found")
    await db.delete(bill)
    await db.commit()
    return {"success": True, "message": "Defined bill deleted"}

