import uuid
from datetime import datetime, date
from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean, Date, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from backend.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="student") # admin, teacher, parent, student, accountant, headmaster
    full_name = Column(String(255), nullable=False)
    card_id = Column(String(100), unique=True, nullable=True)
    phone_number = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Guardian(Base):
    __tablename__ = "guardians"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=False)
    address = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Student(Base):
    __tablename__ = "students"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id_code = Column(String(50), unique=True, index=True, nullable=False) # e.g. REMALJ-2026-001
    rfid_card_code = Column(String(100), unique=True, index=True, nullable=True)
    full_name = Column(String(255), nullable=False)
    dob = Column(String(50), nullable=True)
    gender = Column(String(20), nullable=True)
    level = Column(String(50), nullable=False) # e.g. Primary 1, JHS 1, SHS 1
    class_section = Column(String(50), default="A")
    guardian_name = Column(String(255), nullable=True)
    guardian_email = Column(String(255), nullable=True)
    guardian_phone = Column(String(50), nullable=True)
    home_address = Column(Text, nullable=True)
    enrollment_date = Column(String(50), default=lambda: str(date.today()))
    status = Column(String(50), default="Active")
    student_email = Column(String(255), unique=True, nullable=True)
    default_password = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AttendanceLog(Base):
    __tablename__ = "attendance_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    identifier = Column(String(100), nullable=False)
    scan_type = Column(String(50), nullable=False) # Arrival, Departure, Bus Tap
    bus_route_id = Column(String(50), nullable=True)
    scanned_at = Column(DateTime, default=datetime.utcnow)
    sms_sent = Column(Boolean, default=False)
    sms_status = Column(String(100), nullable=True)

class RollCall(Base):
    __tablename__ = "roll_calls"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    date = Column(String(50), nullable=False)
    class_level = Column(String(50), nullable=False)
    records = Column(JSON, default=list) # [{ student_id, status }]
    recorded_at = Column(DateTime, default=datetime.utcnow)

class FeeRecord(Base):
    __tablename__ = "fee_records"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(50), index=True, nullable=False)
    student_name = Column(String(255), nullable=False)
    guardian_name = Column(String(255), nullable=True)
    guardian_email = Column(String(255), nullable=True)
    term = Column(String(50), default="Term 1 · 2026")
    billed_amount = Column(Float, default=4800.0)
    paid_amount = Column(Float, default=0.0)
    balance = Column(Float, default=4800.0)
    status = Column(String(50), default="Not Paid") # Paid, Balance due, Not Paid
    due_date = Column(String(50), default="2026-09-15")
    payment_date = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PaymentVoucher(Base):
    __tablename__ = "payment_vouchers"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    pv_number = Column(String(50), unique=True, index=True, nullable=False) # PV-2026-001
    requisition_no = Column(String(50), nullable=True)
    payee_name = Column(String(255), nullable=False)
    payee_id = Column(String(100), nullable=True)
    department = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    quantity = Column(Integer, default=1)
    unit_cost = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    date_prepared = Column(String(50), default=lambda: str(date.today()))
    status = Column(String(50), default="DRAFT") # DRAFT, PRE_AUDITED, APPROVED, REJECTED, PAID
    pre_audited_by = Column(String(255), nullable=True)
    approved_by = Column(String(255), nullable=True)
    prepared_by = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Application(Base):
    __tablename__ = "applications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    learner_name = Column(String(255), nullable=False)
    guardian_name = Column(String(255), nullable=False)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=False)
    applying_level = Column(String(50), nullable=False)
    status = Column(String(50), default="Documents review") # Documents review, Interview scheduled, Enrolled, Declined
    office_use_notes = Column(Text, nullable=True)
    form_data = Column(JSON, default=dict)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ReportRequest(Base):
    __tablename__ = "report_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    child = Column(String(255), nullable=False)
    semester = Column(String(100), nullable=False)
    note = Column(Text, nullable=True)
    status = Column(String(50), default="Processing") # Processing, Completed, Available
    file_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AcademicResult(Base):
    __tablename__ = "academic_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(50), nullable=True)
    student_name = Column(String(255), nullable=True)
    subject = Column(String(100), nullable=False)
    score = Column(Float, nullable=False)
    grade = Column(String(10), nullable=False)
    lecturer = Column(String(255), nullable=True)
    status = Column(String(50), default="Approved") # Approved, Pending Approval, Declined
    decline_note = Column(Text, nullable=True)
    updated_at = Column(String(50), default=lambda: datetime.utcnow().strftime('%d %b %Y'))

class TimetableEntry(Base):
    __tablename__ = "timetable_entries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    day = Column(String(20), nullable=False) # Monday, Tuesday...
    time = Column(String(50), nullable=False) # 08:00 AM
    subject = Column(String(100), nullable=False)
    room = Column(String(100), nullable=True)
    lecturer = Column(String(255), nullable=True)
    class_level = Column(String(50), default="All")

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    instructions = Column(Text, nullable=False)
    audience = Column(String(100), default="All Students")
    due_date = Column(String(50), nullable=False)
    author = Column(String(255), default="Mr. Samuel Amponsah")
    status = Column(String(50), default="Published")
    created_at = Column(DateTime, default=datetime.utcnow)

class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    category = Column(String(100), nullable=False)
    person = Column(String(255), nullable=False)
    severity = Column(String(50), default="Restricted") # Restricted, Confidential, General
    status = Column(String(50), default="Under review")
    logged_at = Column(String(100), default=lambda: datetime.utcnow().strftime('%d %b %Y, %H:%M'))

class AssetTask(Base):
    __tablename__ = "asset_tasks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    asset = Column(String(100), nullable=False)
    task = Column(String(255), nullable=False)
    owner = Column(String(100), default="Facilities")
    status = Column(String(50), default="Scheduled") # Scheduled, In progress, Completed
    due_date = Column(String(50), nullable=False)

class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    from_name = Column(String(255), nullable=False)
    sender_role = Column(String(50), default="Staff")
    to_role = Column(String(50), default="Parents")
    recipient_name = Column(String(255), nullable=True)
    recipient_email = Column(String(255), nullable=True)
    student_name = Column(String(255), nullable=True)
    subject = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    sent_at = Column(String(100), default=lambda: datetime.utcnow().strftime('%d %b %Y, %H:%M'))

class BusRoute(Base):
    __tablename__ = "bus_routes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    route_name = Column(String(100), nullable=False)
    bus_number = Column(String(50), nullable=False)
    driver_name = Column(String(255), nullable=False)
    driver_phone = Column(String(50), nullable=True)
    current_lat = Column(Float, default=5.5824)
    current_lng = Column(Float, default=-2.0123)
    speed = Column(Float, default=0.0)
    status = Column(String(50), default="On Route")
    updated_at = Column(DateTime, default=datetime.utcnow)

class SecurityAlert(Base):
    __tablename__ = "security_alerts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    portal = Column(String(50), nullable=False)
    target_account = Column(String(255), nullable=False)
    ip_address = Column(String(100), default="197.251.14.82")
    attempted_at = Column(String(100), default=lambda: datetime.utcnow().strftime('%d %b %Y, %H:%M'))
    reason = Column(Text, nullable=False)
    severity = Column(String(50), default="Medium")
    status = Column(String(50), default="Unresolved")
    device = Column(String(255), default="Web Browser")

class PasswordResetOTP(Base):
    __tablename__ = "password_reset_otps"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    identifier = Column(String(255), index=True, nullable=False)
    otp_code = Column(String(10), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class StaffMember(Base):
    __tablename__ = "staff_members"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    staff_id = Column(String(50), unique=True, index=True, nullable=False) # e.g. STF-2026-001
    name = Column(String(255), nullable=False)
    subject = Column(String(100), default="General Education")
    class_assigned = Column(String(100), default="Grade 4")
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(50), nullable=True)
    role = Column(String(100), default="Subject Teacher")
    status = Column(String(50), default="Active")
    joined_date = Column(String(50), default=lambda: str(date.today()))
    photo = Column(String(50), default="👨‍🏫")
    bio = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class DefinedBill(Base):
    __tablename__ = "defined_bills"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    class_level = Column(String(100), nullable=False)
    academic_year = Column(String(50), default="2026/2027")
    term = Column(String(50), default="Term 1")
    bill_category = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False, default=0.0)
    specification = Column(String(50), default="Compulsory") # Compulsory, Optional
    description = Column(Text, nullable=True)
    date_defined = Column(String(50), default=lambda: str(date.today()))
    created_at = Column(DateTime, default=datetime.utcnow)

class SemesterRegistration(Base):
    __tablename__ = "semester_registrations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(50), index=True, nullable=False)
    student_name = Column(String(255), nullable=False)
    class_level = Column(String(100), nullable=False)
    academic_year = Column(String(50), default="2026/2027")
    term = Column(String(50), default="Term 1")
    status = Column(String(50), default="Registered")
    registered_at = Column(String(50), default=lambda: str(date.today()))
    created_at = Column(DateTime, default=datetime.utcnow)

class ExamRegistration(Base):
    __tablename__ = "exam_registrations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(50), index=True, nullable=False)
    student_name = Column(String(255), nullable=False)
    class_level = Column(String(100), nullable=False)
    academic_year = Column(String(50), default="2025/2026")
    term = Column(String(50), default="Term 1")
    exam_type = Column(String(100), default="End-of-Term Final Examination")
    index_number = Column(String(100), unique=True, index=True, nullable=False)
    exam_center = Column(String(255), default="Main Examination Hall A")
    subjects = Column(JSON, default=list)
    registered_at = Column(String(50), default=lambda: str(date.today()))
    registered_by = Column(String(255), default="Academic Head / Admin")
    status = Column(String(100), default="Registered - Hall Pass Valid")
    created_at = Column(DateTime, default=datetime.utcnow)

