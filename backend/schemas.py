from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime

# --- Auth Schemas ---
class LoginRequest(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    portal: Optional[str] = "admin"

class CardScanRequest(BaseModel):
    cardId: str
    portal: Optional[str] = "student"

class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    fullName: Optional[str] = None
    phone_number: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = "parent"
    portal: Optional[str] = "parent"

class RequestOTPRequest(BaseModel):
    identifier: str

class VerifyOTPRequest(BaseModel):
    identifier: str
    otp: str

class ResetPasswordWithOTPRequest(BaseModel):
    identifier: str
    otp: str
    newPassword: str

class AdminSetPasswordRequest(BaseModel):
    identifier: str
    newPassword: str
    role: Optional[str] = "student"
    fullName: Optional[str] = None
    adminName: Optional[str] = "System Administrator"

class UserResponse(BaseModel):
    id: str
    email: str
    fullName: Optional[str] = None
    role: str
    phoneNumber: Optional[str] = None
    cardId: Optional[str] = None

class AuthResponse(BaseModel):
    token: str
    user: UserResponse

# --- Student Schemas ---
class StudentOnboardRequest(BaseModel):
    fullName: str
    dob: Optional[str] = None
    gender: Optional[str] = "Male"
    level: str
    classSection: Optional[str] = "A"
    guardianName: Optional[str] = "Guardian"
    guardianEmail: Optional[str] = None
    guardianPhone: Optional[str] = None
    homeAddress: Optional[str] = "Bogoso"
    initialBilledAmount: Optional[float] = 4800.0
    term: Optional[str] = "Term 1 · 2026"
    rfidCardCode: Optional[str] = None
    defaultPassword: Optional[str] = None

class StudentResponse(BaseModel):
    id: str
    studentId: str
    rfidCardCode: Optional[str] = None
    fullName: str
    dob: Optional[str] = None
    gender: Optional[str] = None
    level: str
    classSection: Optional[str] = None
    guardianName: Optional[str] = None
    guardianEmail: Optional[str] = None
    guardianPhone: Optional[str] = None
    homeAddress: Optional[str] = None
    status: str
    studentEmail: Optional[str] = None
    defaultPassword: Optional[str] = None

# --- Attendance Schemas ---
class AttendanceScanRequest(BaseModel):
    identifier: str
    scanType: str = "Arrival" # Arrival, Departure, Bus Tap
    busRouteId: Optional[str] = None
    sendSms: Optional[bool] = False

class RollCallRecordItem(BaseModel):
    student_id: str
    status: str = "Present" # Present, Absent, Late, Excused

class RollCallRequest(BaseModel):
    date: str
    class_level: str
    records: List[RollCallRecordItem]
    sendSmsForAbsence: Optional[bool] = False

class NotifyAbsentRequest(BaseModel):
    date: str
    class_level: str
    custom_message: Optional[str] = None

# --- Finance Schemas ---
class FeePaymentRequest(BaseModel):
    paidAmount: float
    paymentMethod: str = "Cash / Bank"
    paymentDate: Optional[str] = None
    notes: Optional[str] = None
    transactionRef: Optional[str] = None

class FeeReminderRequest(BaseModel):
    to: Optional[str] = None
    recipientEmail: Optional[str] = None
    studentName: Optional[str] = None
    subject: Optional[str] = "School Fee Payment Reminder"
    body: Optional[str] = None

class PaymentVoucherRequest(BaseModel):
    pv_number: Optional[str] = None
    payee_name: str
    payee_id: Optional[str] = None
    department: str
    description: str
    quantity: Optional[int] = 1
    unit_cost: float
    total_amount: float
    date_prepared: Optional[str] = None

class PaymentVoucherStatusRequest(BaseModel):
    status: str # DRAFT, PRE_AUDITED, APPROVED, REJECTED, PAID
    auditor_name: Optional[str] = None
    note: Optional[str] = None

# --- Admissions Schemas ---
class ApplicationCreateRequest(BaseModel):
    learner_name: str
    guardian_name: str
    contact_email: Optional[str] = None
    contact_phone: str
    applying_level: str
    form_data: Optional[Dict[str, Any]] = None

class ApplicationStatusRequest(BaseModel):
    status: str
    office_use_notes: Optional[str] = None

class ApplicationUpdateRequest(BaseModel):
    learner_name: Optional[str] = None
    guardian_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    applying_level: Optional[str] = None
    status: Optional[str] = None
    form_data: Optional[Dict[str, Any]] = None

# --- Reports & Results Schemas ---
class ReportRequestCreate(BaseModel):
    child: str
    semester: str
    note: Optional[str] = None

class ResultCreateRequest(BaseModel):
    student_id: Optional[str] = None
    student_name: Optional[str] = None
    subject: str
    score: float
    grade: str
    lecturer: Optional[str] = None

class ResultStatusRequest(BaseModel):
    status: str # Approved, Declined
    decline_note: Optional[str] = None

# --- Timetables & Assignments ---
class TimetableCreateRequest(BaseModel):
    day: str
    time: str
    subject: str
    room: Optional[str] = None
    lecturer: Optional[str] = None
    class_level: Optional[str] = "All"

class AssignmentCreateRequest(BaseModel):
    title: str
    instructions: str
    audience: Optional[str] = "All Students"
    due_date: str
    author: Optional[str] = "Staff"

# --- Incidents & Assets ---
class IncidentCreateRequest(BaseModel):
    category: str
    person: str
    severity: Optional[str] = "Restricted"
    status: Optional[str] = "Under review"

class AssetTaskCreateRequest(BaseModel):
    asset: str
    task: str
    owner: Optional[str] = "Facilities"
    status: Optional[str] = "Scheduled"
    due_date: str

# --- Messages & Bus ---
class MessageSendRequest(BaseModel):
    from_name: Optional[str] = "Staff"
    sender_role: Optional[str] = "Staff"
    to_role: Optional[str] = "Parents"
    recipient_name: Optional[str] = None
    recipient_email: Optional[str] = None
    student_name: Optional[str] = None
    subject: str
    body: str

class BusTelemetryRequest(BaseModel):
    routeId: str
    lat: float
    lng: float
    speed: Optional[float] = 0.0
