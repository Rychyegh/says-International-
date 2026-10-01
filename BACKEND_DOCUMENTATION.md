# REMALJ Carewell Inspirational School & SIMS Enterprise v2025
## Comprehensive FastAPI Backend Architecture & API Specification Master Blueprint

> **Target Audience**: FastAPI Backend Engineering Team, Database Administrators, Technical Architects  
> **Version**: 3.0.0 Master Production Specification (Updated September 2026)  
> **Status**: Production Blueprint & API Specification Master  
> **Author**: Antigravity Technical Architecture Team  

---

## 1. Executive Summary & Architectural Overview

### 1.1 Overview
The **REMALJ Carewell Inspirational School Portal** (`rcis-school-portal`) is a unified, multi-tenant Enterprise School Information Management System (SIMS v2025). It bridges front-end interactive portals (Student, Parent, Teacher, Accountant, and SIMS Administrator) with an enterprise-grade backend infrastructure.

The backend infrastructure supports complete internal back-office accounting (payment voucher pre-auditing, general ledger, trial balance, cash book, payroll), continuous academic assessment engines (SBA score sheets, BECE grading, Creche evaluations, terminal report generators), student onboarding with NFC RFID card integration, SMS notification gateways, online admissions processing, safeguarding incident tracking, and real-time GPS vehicle telemetry.

### 1.2 System Architecture Diagram
```
[ React 18 + Vite Portals (Student/Parent/Teacher/Accountant/Admin) ]
                             │ (REST HTTP / WebSockets)
                             ▼
              [ NGINX Reverse Proxy / SSL Termination ]
                             │
                             ▼
             [ FastAPI Application Service (Python 3.11+) ]
   ├── Pydantic v2 (Request/Response Validation)
   ├── SQLAlchemy 2.0 (Async ORM with Asyncpg)
   ├── FastAPI Security (OAuth2 Password Bearer / JWT / SIMS Token)
   ├── WebSockets Manager (Real-time Bus Tracking)
   └── Celery / Arq Async Workers ──► [ Redis (Task Queue & Cache) ]
         │
         ├─► [ PostgreSQL 15+ (Relational Database) ]
         ├─► [ Cloud Storage / S3 / MinIO (PDF Reports, Documents) ]
         ├─► [ WeasyPrint / ReportLab (Branded PDF Generator) ]
         └─► [ SMSOnlineGH Gateway v5 REST API ]
```

### 1.3 Technology Standards
- **Python**: `^3.11`
- **Framework**: `FastAPI ^0.110.0`
- **ASGI Server**: `Uvicorn ^0.28.0` / `Gunicorn` with `uvicorn.workers.UvicornWorker`
- **ORM**: `SQLAlchemy ^2.0.28` (Async extension via `asyncpg`)
- **Database Migrations**: `Alembic ^1.13.1`
- **Data Validation**: `Pydantic v2` (`pydantic-settings` for env management)
- **Task Queue & Caching**: `Celery ^5.3.6` / `Arq ^0.25.0` with `Redis ^7.2`
- **PDF Engine**: `WeasyPrint` / `ReportLab` (Using header asset `/remalj-carewell-logo.jpg`)
- **External SMS Gateway**: SMSOnlineGH (v5 REST API)

---

## 2. Environment Configuration (`.env`)

```ini
# Application Configuration
APP_NAME="REMALJ Carewell SIMS Backend"
APP_ENV=production
DEBUG=false
SECRET_KEY=change_this_to_a_secure_random_256_bit_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# Server Binding
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=["http://localhost:5173","https://portal.remaljcarewell.edu.gh","https://rcis-backend.onrender.com"]

# Database Connection (PostgreSQL Async)
DATABASE_URL=postgresql+asyncpg://sims_user:secure_password@localhost:5432/rcis_sims_db

# Redis & Celery
REDIS_URL=redis://localhost:6379/0

# External SMS Gateway (SMSOnlineGH v5)
SMS_API_KEY=67648ed5720ca875d42dc20f5726d94c9c1ea2b149a541784b5ba2194241b022
SMS_SENDER_ID=RCIS
SMS_GATEWAY_URL=https://api.smsonlinegh.com/v5/sms/send

# Storage Configuration (S3 / MinIO / Local)
STORAGE_PROVIDER=local
STORAGE_BASE_PATH=./uploads
```

---

## 3. Comprehensive Database Schemas (PostgreSQL & SQLAlchemy)

### 3.1 Authentication, Users & Security (`users`, `sims_sessions`, `security_alerts`)
```sql
CREATE TYPE user_role AS ENUM (
  'ACCOUNTANT', 'HEADMASTER_PRE_AUDITOR', 'SIMS_ADMIN', 'TEACHER', 'CLASS_TEACHER', 'PARENT', 'STUDENT'
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'STUDENT',
  full_name VARCHAR(255) NOT NULL,
  card_id VARCHAR(100) UNIQUE,
  phone_number VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE sims_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  role_designation VARCHAR(100) NOT NULL,
  ip_address VARCHAR(45),
  authenticated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_locked BOOLEAN DEFAULT FALSE
);

CREATE TABLE security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portal VARCHAR(50) NOT NULL,
  target_account VARCHAR(255) NOT NULL,
  ip_address VARCHAR(100) NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT NOT NULL,
  severity VARCHAR(20) CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
  status VARCHAR(50) DEFAULT 'Unresolved',
  device VARCHAR(255)
);
```

### 3.2 Student Information & Onboarding (`students`, `guardians`, `bulk_upload_logs`)
```sql
CREATE TABLE guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. REMALJ-2026-001
  rfid_card_code VARCHAR(100) UNIQUE,           -- e.g. 0009841234
  full_name VARCHAR(255) NOT NULL,
  dob DATE NOT NULL,
  gender VARCHAR(20) NOT NULL,
  level VARCHAR(50) NOT NULL,                    -- e.g. Grade 4, Primary 5, JHS 3
  class_section VARCHAR(50) NOT NULL,            -- e.g. Section B, 3A
  guardian_id UUID REFERENCES guardians(id),
  home_address TEXT,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(50) DEFAULT 'Active',
  student_email VARCHAR(255) UNIQUE,
  user_id UUID UNIQUE REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.3 Attendance & NFC Telemetry (`attendance_logs`, `roll_calls`)
```sql
CREATE TABLE attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  scan_type VARCHAR(50) NOT NULL, -- 'Arrival', 'Departure', 'Bus Tap'
  bus_route_id VARCHAR(50),
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  sms_sent BOOLEAN DEFAULT FALSE,
  sms_status VARCHAR(100)
);

CREATE TABLE roll_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  class_level VARCHAR(50) NOT NULL,
  teacher_id UUID REFERENCES users(id),
  student_id UUID REFERENCES students(id),
  status VARCHAR(20) CHECK (status IN ('Present', 'Absent', 'Late', 'Excused')),
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.4 Payment Vouchers, Accounting & Fee Engine (`payment_vouchers`, `ledger_entries`, `fee_structures`, `bills_receivables`, `fee_payments`)
```sql
CREATE TYPE pv_status AS ENUM ('DRAFT', 'PRE_AUDITED', 'APPROVED', 'DISBURSED', 'REJECTED');

CREATE TABLE payment_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pv_number VARCHAR(50) UNIQUE NOT NULL, -- e.g. PV-2026-0089
  requisition_no VARCHAR(50),
  payee_name VARCHAR(255) NOT NULL,
  payee_id VARCHAR(100),
  department VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  quantity INT DEFAULT 1,
  unit_cost NUMERIC(12, 2) NOT NULL,
  total_amount NUMERIC(12, 2) NOT NULL,
  date_prepared DATE DEFAULT CURRENT_DATE,
  valued_date DATE DEFAULT CURRENT_DATE,
  status pv_status NOT NULL DEFAULT 'DRAFT',
  audit_remarks TEXT,
  prepared_by_id UUID REFERENCES users(id),
  pre_audited_by_id UUID REFERENCES users(id),
  pre_audited_at TIMESTAMPTZ,
  approved_by_id UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  disbursed_by_id UUID REFERENCES users(id),
  disbursed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_ref VARCHAR(100) NOT NULL,
  account_code VARCHAR(50) NOT NULL, -- e.g. '1000-CASH', '4000-FEES', '5100-UTILITIES'
  account_name VARCHAR(255) NOT NULL,
  entry_type VARCHAR(10) CHECK (entry_type IN ('DEBIT', 'CREDIT')),
  amount NUMERIC(12, 2) NOT NULL,
  narrative TEXT,
  pv_id UUID REFERENCES payment_vouchers(id),
  posted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year VARCHAR(50) NOT NULL, -- e.g. '2026/2027'
  term VARCHAR(50) NOT NULL,          -- e.g. 'Term 1'
  grade_level VARCHAR(50) NOT NULL,   -- e.g. 'Creche', 'Primary 1', 'JHS 1'
  bill_category VARCHAR(100) NOT NULL, -- e.g. 'Tuition Fee', 'Bus Fee', 'PTA Levy'
  amount NUMERIC(10,2) NOT NULL,
  specification VARCHAR(50) DEFAULT 'Compulsory', -- 'Compulsory', 'Optional'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bills_receivables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  term VARCHAR(50) NOT NULL,
  billed_amount NUMERIC(10,2) NOT NULL,
  paid_amount NUMERIC(10,2) DEFAULT 0,
  balance_due NUMERIC(10,2) GENERATED ALWAYS AS (billed_amount - paid_amount) STORED,
  status VARCHAR(50) DEFAULT 'Balance Due', -- 'Paid', 'Partial', 'Balance Due'
  due_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fee_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills_receivables(id),
  student_id UUID NOT NULL REFERENCES students(id),
  amount_paid NUMERIC(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL, -- 'Bank Transfer', 'Mobile Money', 'Cash', 'Cheque'
  transaction_ref VARCHAR(100) UNIQUE NOT NULL,
  notes TEXT,
  receipt_number VARCHAR(100) UNIQUE NOT NULL,
  payment_date TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.5 Payroll & Staff Engine (`staff`, `payslips`)
```sql
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id),
  staff_code VARCHAR(50) UNIQUE NOT NULL, -- e.g. STF-088
  department VARCHAR(100) NOT NULL,
  designation VARCHAR(100) NOT NULL,
  basic_salary NUMERIC(10,2) NOT NULL,
  ssnit_number VARCHAR(50),
  bank_name VARCHAR(100),
  account_number VARCHAR(100),
  joined_date DATE NOT NULL
);

CREATE TABLE payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id),
  pay_period VARCHAR(50) NOT NULL, -- e.g. 'September 2026'
  basic_salary NUMERIC(10,2) NOT NULL,
  allowances NUMERIC(10,2) DEFAULT 0,
  ssnit_deduction NUMERIC(10,2) NOT NULL, -- 5.5% employee SSNIT
  paye_tax NUMERIC(10,2) NOT NULL,
  other_deductions NUMERIC(10,2) DEFAULT 0,
  net_salary NUMERIC(10,2) NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.6 SIMS Academic Engine (`score_sheets`, `creche_evaluations`, `semester_registrations`, `academic_settings`, `timetables`, `assignments`)
```sql
CREATE TABLE score_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  class_level VARCHAR(50) NOT NULL,
  term VARCHAR(50) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  class_score NUMERIC(5,2) DEFAULT 0, -- Max 50
  exam_score NUMERIC(5,2) DEFAULT 0,  -- Max 50
  total_score NUMERIC(5,2) GENERATED ALWAYS AS (class_score + exam_score) STORED,
  grade VARCHAR(5) NOT NULL,          -- 'A', 'B', 'C', 'D', 'F'
  status VARCHAR(50) DEFAULT 'Pending Approval', -- 'Pending Approval', 'Approved', 'Declined'
  is_published BOOLEAN DEFAULT FALSE,
  decline_note TEXT,
  teacher_id UUID REFERENCES users(id),
  entered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE creche_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  eval_term VARCHAR(50) NOT NULL,
  social_skills VARCHAR(50) NOT NULL,    -- 'Developing', 'Proficient', 'Exceeding'
  motor_skills VARCHAR(50) NOT NULL,
  cognitive_growth VARCHAR(50) NOT NULL,
  teacher_remarks TEXT,
  is_authorised BOOLEAN DEFAULT FALSE,
  authorised_by_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE semester_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  class_level VARCHAR(50) NOT NULL,
  academic_year VARCHAR(50) NOT NULL,
  term VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'Registered',
  registered_at DATE DEFAULT CURRENT_DATE
);

CREATE TABLE academic_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  academic_year VARCHAR(50) NOT NULL DEFAULT '2025/2026',
  academic_term VARCHAR(50) NOT NULL DEFAULT 'Term 3',
  class_test_weight INT NOT NULL DEFAULT 50,
  exam_weight INT NOT NULL DEFAULT 50,
  grading_system VARCHAR(100) DEFAULT 'BECE 9-Point Scale (GES Standard)',
  resumption_date DATE,
  vacation_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE timetables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_level VARCHAR(50) NOT NULL,
  day VARCHAR(20) NOT NULL,
  start_time VARCHAR(20) NOT NULL,
  end_time VARCHAR(20),
  subject VARCHAR(100) NOT NULL,
  room VARCHAR(50) NOT NULL,
  lecturer_name VARCHAR(255) NOT NULL
);

CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  instructions TEXT NOT NULL,
  audience VARCHAR(100) NOT NULL,
  due_date DATE NOT NULL,
  author_name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'Published',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.7 Examination & Hall Pass Engine (`exam_registrations`)
```sql
CREATE TABLE exam_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  class_level VARCHAR(50) NOT NULL,
  academic_year VARCHAR(50) NOT NULL,
  term VARCHAR(50) NOT NULL,
  exam_type VARCHAR(100) NOT NULL, -- e.g. 'End-of-Term Final Examination'
  index_number VARCHAR(100) UNIQUE NOT NULL, -- e.g. EXAM-2026-JHS3-041
  exam_center VARCHAR(150) NOT NULL,
  subjects JSONB NOT NULL,
  registered_by VARCHAR(255) NOT NULL,
  status VARCHAR(100) DEFAULT 'Registered - Hall Pass Valid',
  registered_at DATE DEFAULT CURRENT_DATE
);
```

### 3.8 Online Admissions (`admission_applications`)
```sql
CREATE TABLE admission_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_no VARCHAR(50) UNIQUE NOT NULL,
  learner_name VARCHAR(255) NOT NULL,
  guardian_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  applying_level VARCHAR(50) NOT NULL,
  form_data JSONB NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(50) DEFAULT 'Documents review', -- 'Documents review', 'Under review', 'Offered Admission', 'Rejected'
  office_use_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.9 Messages & Report Requests (`messages`, `report_requests`)
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_name VARCHAR(255) NOT NULL,
  sender_role VARCHAR(50) NOT NULL,
  recipient_role VARCHAR(50) NOT NULL,
  recipient_name VARCHAR(255) NOT NULL,
  recipient_email VARCHAR(255),
  student_name VARCHAR(255),
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'Sent',
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE report_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_name VARCHAR(255) NOT NULL,
  semester VARCHAR(100) NOT NULL,
  note TEXT,
  status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Uploaded', 'Completed'
  file_name VARCHAR(255),
  file_url TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_at TIMESTAMPTZ
);
```

### 3.10 Operations, Incidents & Asset Tasks (`incidents`, `asset_tasks`)
```sql
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(100) NOT NULL, -- 'Safeguarding', 'Health & welfare'
  person VARCHAR(255) NOT NULL,
  severity VARCHAR(50) NOT NULL,  -- 'Restricted', 'Confidential'
  status VARCHAR(50) NOT NULL,    -- 'Under review', 'Follow-up due'
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE asset_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset VARCHAR(255) NOT NULL,
  task TEXT NOT NULL,
  owner VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL, -- 'Scheduled', 'In progress', 'Completed'
  due_date DATE NOT NULL
);
```

### 3.11 Bus Telemetry (`bus_routes`, `bus_telemetry`)
```sql
CREATE TABLE bus_routes (
  id VARCHAR(50) PRIMARY KEY, -- e.g. 'A', 'B'
  name VARCHAR(255) NOT NULL,
  color VARCHAR(20) NOT NULL,
  stops JSONB NOT NULL,
  driver_name VARCHAR(255) NOT NULL,
  driver_phone VARCHAR(50) NOT NULL,
  current_lat NUMERIC(10, 6) NOT NULL,
  current_lng NUMERIC(10, 6) NOT NULL,
  speed VARCHAR(20) NOT NULL,
  status VARCHAR(50) DEFAULT 'On Route',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Complete Master API Endpoint Specifications (11 Router Modules)

---

### Module 1: Authentication & Security Router (`/api/v1/auth` & `/api/v1/sims-auth`)

#### 1. Standard JWT Login
- **Endpoint**: `POST /api/v1/auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "parent@remaljcarewell.edu.gh",
  "password": "Password123!",
  "portal": "parent"
}
```
- **Response `200 OK`**:
```json
{
  "token": "eyJhbGciOiJIUzI1Ni...",
  "token_type": "bearer",
  "user": {
    "id": "usr_994812",
    "email": "parent@remaljcarewell.edu.gh",
    "fullName": "Mrs. Angela Edwards",
    "role": "parent",
    "phoneNumber": "0241112222"
  }
}
```

#### 2. RFID Card Barcode Scan Authentication
- **Endpoint**: `POST /api/v1/auth/card-scan`
- **Access**: Public / Kiosk Terminal
- **Request Body**:
```json
{
  "cardId": "0009841234",
  "portal": "student"
}
```
- **Response `200 OK`**: Returns JWT `token` and authenticated `user` object.

#### 3. User Self-Registration
- **Endpoint**: `POST /api/v1/auth/register`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "new.parent@example.com",
  "password": "SecurePassword123!",
  "full_name": "Mr. Kwesi Agyeman",
  "phone_number": "0240000000",
  "role": "parent"
}
```
- **Response `201 Created`**: Returns JWT `token` and created `user`.

#### 4. Request Password Reset OTP (SMS/Email)
- **Endpoint**: `POST /api/v1/auth/forgot-password/request-otp`
- **Access**: Public
- **Request Body**: `{ "identifier": "0241112222" }`
- **Response `200 OK`**: `{ "success": true, "message": "Verification code dispatched to 0241112222", "maskedPhone": "024****222" }`

#### 5. Verify Password Reset OTP
- **Endpoint**: `POST /api/v1/auth/forgot-password/verify-otp`
- **Access**: Public
- **Request Body**: `{ "identifier": "0241112222", "otp": "481920" }`
- **Response `200 OK`**: `{ "valid": true, "message": "OTP verified successfully" }`

#### 6. Reset Password with OTP
- **Endpoint**: `POST /api/v1/auth/forgot-password/reset`
- **Access**: Public
- **Request Body**: `{ "identifier": "0241112222", "otp": "481920", "newPassword": "NewSecurePassword123!" }`
- **Response `200 OK`**: `{ "success": true, "message": "Password reset successfully" }`

#### 7. Administrator Force Set Password
- **Endpoint**: `POST /api/v1/auth/admin/set-password`
- **Access**: `SIMS_ADMIN` / `HEADMASTER_PRE_AUDITOR`
- **Request Body**: `{ "identifier": "benjamin.edwards@remaljcarewell.edu.gh", "newPassword": "NewStuPass2026", "role": "student" }`
- **Response `200 OK`**: `{ "success": true, "message": "System Administrator successfully updated password for user account." }`

#### 8. SIMS Enterprise Security Terminal Login
- **Endpoint**: `POST /api/v1/sims-auth/login`
- **Access**: Public / Security Terminal
- **Request Body**:
```json
{
  "username": "ACCOUNTANT",
  "password": "AccountantPassword123",
  "role_designation": "Accountant / Finance Officer"
}
```
- **Response `200 OK`**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1...",
  "token_type": "bearer",
  "sims_token": "SIMS-AUTH-2026-9984-SECURE",
  "user": {
    "id": "c7a840e1-456b-4e89-8d76-123456789abc",
    "username": "ACCOUNTANT",
    "full_name": "Mrs. Grace Accountant",
    "role": "ACCOUNTANT"
  }
}
```

#### 9. SIMS Terminal Lock Session
- **Endpoint**: `POST /api/v1/sims-auth/lock-session`
- **Access**: Authenticated SIMS user
- **Response `200 OK`**: `{ "status": "locked", "message": "SIMS session locked successfully" }`

#### 10. Audit Security Alerts Log
- **Endpoint**: `GET /api/v1/auth/security-alerts`
- **Access**: `SIMS_ADMIN`
- **Response `200 OK`**: Returns array of `security_alerts` records.

#### 11. Class Teacher role
The staff portal already calls the class teacher credential, passcode, and dashboard routes. The implementation contract, database table, sign-in sequence, and acceptance checks are in [`docs/CLASS_TEACHER_BACKEND.md`](docs/CLASS_TEACHER_BACKEND.md). Summary of the routes:

| Method | Path | Who |
|---|---|---|
| `GET` | `/api/v1/auth/class-teachers` | Head admin lists issued passcodes |
| `POST` | `/api/v1/auth/class-teachers` | Head admin issues a passcode |
| `GET` | `/api/v1/auth/class-teacher/me` | Signed-in teacher; tells the portal whether the passcode step is required |
| `POST` | `/api/v1/auth/class-teacher/verify` | Class teacher passcode after email and password |
| `POST` | `/api/v1/auth/class-teacher/login` | Direct staff-ID login supported by the client |
| `GET` | `/api/v1/class-teachers/dashboard` | Verified class teacher home screen, scoped to the assigned class |

A class teacher uses `role: teacher` plus `teacher_designation: class_teacher`. Class-teacher-only routes require `passcode_verified: true` on the JWT.

---

### Module 2: Student Management & Onboarding Router (`/api/v1/students`)

#### 1. Fetch Onboarded Students Roster
- **Endpoint**: `GET /api/v1/students`
- **Query Params**: `level=Grade 4&status=Active&classSection=Section B`
- **Access**: `TEACHER`, `ACCOUNTANT`, `SIMS_ADMIN`, `HEADMASTER_PRE_AUDITOR`
- **Response `200 OK`**: Array of student objects with guardian contact info.

#### 2. Single Student Onboarding
- **Endpoint**: `POST /api/v1/students/onboard`
- **Access**: `SIMS_ADMIN`, `ACCOUNTANT`
- **Request Body**:
```json
{
  "fullName": "Kofi Mensah Jr.",
  "dob": "2016-05-14",
  "gender": "Male",
  "level": "Primary 3",
  "classSection": "Primary 3A",
  "guardianName": "Mr. Kofi Mensah",
  "guardianEmail": "kofi.mensah@example.com",
  "guardianPhone": "0243334444",
  "homeAddress": "Tarkwa Main Station",
  "initialBilledAmount": 4500.00,
  "term": "Term 1 · 2026"
}
```
- **Response `201 Created`**: Returns generated student object with `studentId` (e.g. `REMALJ-2026-092`), default generated password, and initial fee bill.

#### 3. Bulk Student Upload (Excel / CSV Import)
- **Endpoint**: `POST /api/v1/students/bulk-upload`
- **Access**: `SIMS_ADMIN`
- **Form Data**: `file` (CSV / XLSX format)
- **Response `200 OK`**: `{ "importedCount": 45, "skippedCount": 0, "errors": [] }`

#### 4. Get Student Profile Details
- **Endpoint**: `GET /api/v1/students/{student_id}`
- **Access**: Authenticated staff or matching Parent/Student user
- **Response `200 OK`**: Complete student profile JSON.

#### 5. Update Student Info
- **Endpoint**: `PUT /api/v1/students/{student_id}`
- **Access**: `SIMS_ADMIN`
- **Response `200 OK`**: Updated student object.

---

### Module 3: Attendance, NFC Taps & SMS Gateway Router (`/api/v1/attendance`)

#### 1. RFID Card Scan Event (Arrival / Departure / Bus Tap)
- **Endpoint**: `POST /api/v1/attendance/scan`
- **Access**: Kiosk / RFID Reader Terminal
- **Request Body**:
```json
{
  "identifier": "0009841234",
  "scanType": "Arrival",
  "busRouteId": "A",
  "sendSms": true
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "student": {
    "id": "stu-001",
    "studentId": "REMALJ-2026-001",
    "fullName": "Benjamin Edwards"
  },
  "scanType": "Arrival",
  "timestamp": "2026-09-25T07:45:12Z",
  "smsSent": true,
  "smsStatus": "DISPATCHED_TO_GATEWAY"
}
```

#### 2. Query Attendance History
- **Endpoint**: `GET /api/v1/attendance`
- **Query Params**: `date=2026-09-25&class_level=Grade 4&scanType=Arrival`
- **Access**: `TEACHER`, `SIMS_ADMIN`, `PARENT`
- **Response `200 OK`**: Array of attendance scan logs.

#### 3. Roll Call Submission
- **Endpoint**: `POST /api/v1/attendance/roll-call`
- **Access**: `TEACHER`
- **Request Body**:
```json
{
  "date": "2026-09-25",
  "class_level": "Grade 4",
  "records": [
    { "student_id": "stu-001", "status": "Present" },
    { "student_id": "stu-002", "status": "Absent" }
  ],
  "sendSmsForAbsence": true
}
```
- **Response `200 OK`**: `{ "savedRecords": 2, "absentNotifiedCount": 1 }`

#### 4. Notify Parents of Absent Students
- **Endpoint**: `POST /api/v1/attendance/notify-absent`
- **Access**: `TEACHER`, `SIMS_ADMIN`
- **Request Body**:
```json
{
  "date": "2026-09-25",
  "class_level": "Grade 4",
  "custom_message": "Notice: Benjamin was marked absent during morning roll call."
}
```
- **Response `200 OK`**: `{ "dispatchedSmsCount": 3 }`

#### 5. Check Remaining SMS Balance
- **Endpoint**: `GET /api/v1/attendance/sms-balance`
- **Access**: `ACCOUNTANT`, `SIMS_ADMIN`
- **Response `200 OK`**:
```json
{
  "amount": 304.50,
  "currencyName": "Ghana Cedi",
  "currencyCode": "GHS"
}
```

#### 6. Direct SMS Gateway Proxy (SMSOnlineGH v5 API Integration)
- **Endpoint**: `POST /api/v1/attendance/sms/send`
- **Access**: Authenticated Staff
- **Request Body**:
```json
{
  "recipientPhone": "0241112222",
  "messageText": "[REMALJ Carewell] Dear Parent, term results have been published.",
  "senderId": "RCIS"
}
```
- **Response `200 OK`**: Dispatches HTTP POST to `https://api.smsonlinegh.com/v5/sms/send` with header `Authorization: key <SMS_API_KEY>` and returns SMS gateway status.

---

### Module 4: Finance, Payment Vouchers, Accounting & Payroll Router (`/api/v1/finance`)

#### 1. Fetch Student Fee Receivables & Balances
- **Endpoint**: `GET /api/v1/finance/fees`
- **Query Params**: `term=Term 1 · 2026&status=Balance Due`
- **Access**: `ACCOUNTANT`, `SIMS_ADMIN`, `PARENT`
- **Response `200 OK`**: Array of fee accounts showing `billedAmount`, `paidAmount`, `balance`, `dueDate`.

#### 2. Record Fee Payment & Issue Branded Receipt
- **Endpoint**: `POST /api/v1/finance/fees/{fee_id}/pay`
- **Access**: `ACCOUNTANT`
- **Request Body**:
```json
{
  "paidAmount": 1600.00,
  "paymentMethod": "Mobile Money",
  "paymentDate": "2026-09-25",
  "notes": "Paid via MTN MoMo Ref #994812",
  "transactionRef": "MOMO-994812-2026"
}
```
- **Response `200 OK`**: Updated bill status (`Paid` / `Partial`), receipt reference, and PDF download URL.

#### 3. Define Class Level Fee Structure
- **Endpoint**: `POST /api/v1/finance/bills/define`
- **Access**: `ACCOUNTANT`, `SIMS_ADMIN`
- **Request Body**:
```json
{
  "classLevel": "Primary 1",
  "academicYear": "2026/2027",
  "term": "Term 1",
  "billCategory": "Tuition Fee",
  "amount": 1350.00,
  "specification": "Compulsory"
}
```
- **Response `201 Created`**: Returns created `fee_structure` record.

#### 4. Fetch Defined Fee Structures
- **Endpoint**: `GET /api/v1/finance/bills/defined`
- **Query Params**: `academicYear=2026/2027&term=Term 1`
- **Access**: `ACCOUNTANT`, `SIMS_ADMIN`
- **Response `200 OK`**: List of defined bills per grade level.

#### 5. Send Fee Outstanding Reminder Notice
- **Endpoint**: `POST /api/v1/finance/remind`
- **Access**: `ACCOUNTANT`
- **Request Body**:
```json
{
  "to": "Mr. Yaw Darko",
  "recipientEmail": "yaw.darko@example.com",
  "studentName": "Efua Darko",
  "subject": "Urgent: Fee Payment Required",
  "body": "Dear Mr. Darko, Efua's school fees for Term 1 (GHS 4,900) are currently outstanding."
}
```
- **Response `200 OK`**: `{ "success": true, "message": "Fee reminder notice sent." }`

#### 6. Create Payment Voucher (Draft PV)
- **Endpoint**: `POST /api/v1/finance/vouchers`
- **Access**: `ACCOUNTANT`
- **Request Body**:
```json
{
  "requisitionNo": "REQ-99412",
  "payee_name": "ELECTRICITY COMPANY OF GHANA (ECG)",
  "department": "Administration",
  "description": "Cost of Electricity Bill & Utility Substation Maintenance",
  "quantity": 1,
  "unit_cost": 3200.00,
  "payment_mode": "Bank Transfer"
}
```
- **Response `201 Created`**: Returns created `PaymentVoucher` object with `status: "DRAFT"` and generated `pv_number` (e.g. `PV-2026-0089`).

#### 7. Fetch List of Payment Vouchers
- **Endpoint**: `GET /api/v1/finance/vouchers`
- **Query Params**: `status=Pending Audit&department=Administration`
- **Access**: `ACCOUNTANT`, `HEADMASTER_PRE_AUDITOR`, `SIMS_ADMIN`
- **Response `200 OK`**: Array of Payment Voucher records.

#### 8. Pre-Audit Payment Voucher (Pre-Auditor / Headmaster Approval)
- **Endpoint**: `POST /api/v1/finance/vouchers/{pv_id}/pre-audit`
- **Access**: `HEADMASTER_PRE_AUDITOR`, `SIMS_ADMIN`
- **Request Body**:
```json
{
  "decision": "APPROVED",
  "audit_notes": "Pre-audited & verified against monthly meter consumption records."
}
```
- **Response `200 OK`**: Updates status to `PRE_AUDITED` and attaches `pre_audited_at` timestamp.

Line-item pre-audit (required): a single PV can contain several items. Head Admin must be able to approve one line and reject another without acting on the whole voucher.

- **Endpoint**: `PATCH /api/v1/finance/vouchers/{pv_id}/items/{item_id}`
- **Access**: `HEADMASTER_PRE_AUDITOR`, `SIMS_ADMIN`
- **Request Body**: `{ "status": "Validated" | "Declined", "audit_notes": "..." }`
- **Response `200 OK`**: Updated item. Parent voucher `status` becomes `APPROVED` only when every line is approved, `REJECTED` when every line is declined, otherwise `PARTIALLY_APPROVED`. `total_amount` should be the sum of **approved** lines only.
- The portal already calls this route (404 is ignored and the item decision is kept locally).

#### 9. Disburse Payment Voucher & General Ledger Posting
- **Endpoint**: `POST /api/v1/finance/vouchers/{pv_id}/disburse`
- **Access**: `ACCOUNTANT`
- **Response `200 OK`**:
  - Updates PV status to `DISBURSED`.
  - Posts DEBIT entry to Expense Account (`5100-UTILITIES`) and CREDIT entry to Cash/Bank Account (`1000-CASH`).
  - Renders and returns downloadable branded PDF Payment Voucher.

#### 10. Financial Cash Book Report
- **Endpoint**: `GET /api/v1/finance/reports/cash-book`
- **Query Params**: `start_date=2026-09-01&end_date=2026-09-30`
- **Access**: `ACCOUNTANT`, `HEADMASTER_PRE_AUDITOR`, `SIMS_ADMIN`
- **Response `200 OK`**: Cash book receipts, payments, running daily balances, and summary tallies.

#### 11. General Ledger Report
- **Endpoint**: `GET /api/v1/finance/reports/general-ledger`
- **Query Params**: `account_code=1000-CASH`
- **Access**: `ACCOUNTANT`, `SIMS_ADMIN`
- **Response `200 OK`**: Immutable list of posted ledger entries.

#### 12. Financial Trial Balance Report
- **Endpoint**: `GET /api/v1/finance/reports/trial-balance`
- **Query Params**: `as_of_date=2026-09-30`
- **Access**: `ACCOUNTANT`, `HEADMASTER_PRE_AUDITOR`, `SIMS_ADMIN`
- **Response `200 OK`**: Account codes, account names, total debits, total credits, verifying zero imbalance (`Total Debits == Total Credits`).

#### 13. Income Statement (Profit & Loss / Surplus)
- **Endpoint**: `GET /api/v1/finance/reports/income-statement`
- **Query Params**: `start_date=2026-01-01&end_date=2026-12-31`
- **Access**: `ACCOUNTANT`, `HEADMASTER_PRE_AUDITOR`, `SIMS_ADMIN`
- **Response `200 OK`**: Total Revenues (Fees, Canteen, Bus), Total Operating Expenses, Net Surplus/Deficit.

#### 14. Balance Sheet
- **Endpoint**: `GET /api/v1/finance/reports/balance-sheet`
- **Query Params**: `as_of_date=2026-09-30`
- **Access**: `ACCOUNTANT`, `HEADMASTER_PRE_AUDITOR`, `SIMS_ADMIN`
- **Response `200 OK`**: Assets, Liabilities, and Equity summary.

#### 15. HR Staff Roster & Payroll Setup
- **Endpoint**: `GET /api/v1/finance/payroll/staff`
- **Access**: `ACCOUNTANT`, `SIMS_ADMIN`
- **Response `200 OK`**: Roster of staff with basic salaries, SSNIT numbers, and bank account details.

#### 16. Generate Staff Payslip PDF
- **Endpoint**: `POST /api/v1/finance/payroll/generate-payslip`
- **Access**: `ACCOUNTANT`
- **Request Body**:
```json
{
  "staff_id": "stf-001",
  "pay_period": "September 2026",
  "allowances": 350.00,
  "other_deductions": 0.00
}
```
- **Response `200 OK`**: Calculates SSNIT (5.5% employee contribution), PAYE progressive tax brackets, Net Pay, and returns branded downloadable PDF payslip URL.

---

### Module 5: Academic Engine, Scores & Terminal Reports Router (`/api/v1/sims` & `/api/v1/academic`)

#### 1. Bulk Score Sheet Continuous Assessment Entry
- **Endpoint**: `POST /api/v1/sims/score-sheets/entry`
- **Access**: `TEACHER`
- **Request Body**:
```json
{
  "class_level": "JHS 2",
  "term": "Term 3 · 2026",
  "subject": "Integrated Science",
  "scores": [
    { "student_id": "stu-001", "class_score": 28.5, "exam_score": 62.0 },
    { "student_id": "stu-002", "class_score": 24.0, "exam_score": 58.5 }
  ]
}
```
- **Response `201 Created`**: Returns array of created score sheet records with status `Pending Approval`.

The teacher portal now also sends the four class-test components (each /100, total /400), converted 50s, `grade`, `remarks`, and `teacher_note`. See `docs/SCORE_SHEET_BACKEND.md` for the expanded body, plus two new routes the portal already calls:

- `PUT /api/v1/sims/score-sheets/entry/{id}` — edit a saved sheet (reset to Pending Approval)
- `GET /api/v1/sims/score-sheets/entries` — list saved sheets so a teacher can reopen and edit

#### 2. Fetch Pending Test Results Awaiting Headmaster Approval
- **Endpoint**: `GET /api/v1/sims/test-results/pending`
- **Access**: `HEADMASTER_PRE_AUDITOR`, `SIMS_ADMIN`
- **Response `200 OK`**: Un-published score sheets awaiting moderation.

#### 3. Publish Test Results to Student/Parent Portals
- **Endpoint**: `POST /api/v1/sims/test-results/{score_sheet_id}/publish`
- **Access**: `HEADMASTER_PRE_AUDITOR`, `SIMS_ADMIN`
- **Response `200 OK`**: `{ "status": "Published", "published_at": "2026-09-25T13:00:00Z" }`

#### 4. Fetch Registered Class Enrollment Roster
- **Endpoint**: `GET /api/v1/sims/students/registered-by-class`
- **Query Params**: `class_level=Grade 4&term=Term 1`
- **Access**: `TEACHER`, `SIMS_ADMIN`
- **Response `200 OK`**: Roster of active registered students.

#### 5. Semester Class Registration
- **Endpoint**: `POST /api/v1/sims/semester-registration`
- **Access**: `SIMS_ADMIN`, `TEACHER`
- **Request Body**: `{ "student_id": "stu-001", "class_level": "Grade 4", "academic_year": "2026/2027", "term": "Term 1" }`
- **Response `201 Created`**: Registration record.

#### 6. Creche Milestone Checklist Evaluation
- **Endpoint**: `POST /api/v1/sims/creche/evaluations`
- **Access**: `TEACHER`
- **Request Body**:
```json
{
  "student_id": "stu-creche-01",
  "eval_term": "Term 3 · 2026",
  "social_skills": "Proficient",
  "motor_skills": "Exceeding",
  "cognitive_growth": "Developing",
  "teacher_remarks": "Shows excellent enthusiasm during group play."
}
```
- **Response `201 Created`**: Creche evaluation record.

#### 7. Fetch Unauthorised Creche Reports
- **Endpoint**: `GET /api/v1/sims/creche/unauthorised-reports`
- **Access**: `HEADMASTER_PRE_AUDITOR`, `SIMS_ADMIN`
- **Response `200 OK`**: List of pending creche reports.

#### 8. Headmaster Authorization for Creche Progress Report
- **Endpoint**: `POST /api/v1/sims/creche/clear-report`
- **Access**: `HEADMASTER_PRE_AUDITOR`, `SIMS_ADMIN`
- **Request Body**: `{ "report_id": "creche-eval-091", "clearance_notes": "Cleared for distribution" }`
- **Response `200 OK`**: `{ "is_authorised": true }`

#### 9. Generate Individual Student Terminal Report Card PDF
- **Endpoint**: `GET /api/v1/sims/reports/terminal/individual/{student_id}`
- **Query Params**: `term=Term 3 · 2026`
- **Access**: `PARENT`, `STUDENT`, `TEACHER`, `HEADMASTER_PRE_AUDITOR`, `SIMS_ADMIN`
- **Response `200 OK`**: Generates and streams PDF report card featuring:
  - REMALJ Carewell School Header & Logo (`/remalj-carewell-logo.jpg`)
  - Student Details, Attendance Metrics, Position in Class, Class Average
  - Subject Grade Breakdowns (Class Mark, Exam Mark, Grade, Remarks)
  - Headmaster & Form Master Digital Signature Block

#### 10. Student Results Dashboard Query
- **Endpoint**: `GET /api/v1/academic/results`
- **Query Params**: `student_id=stu-001`
- **Access**: `STUDENT`, `PARENT`, `TEACHER`
- **Response `200 OK`**: Array of student academic results.

#### 11. Timetables Endpoint
- **Endpoint**: `GET /api/v1/academic/timetables`
- **Query Params**: `class_level=Grade 4`
- **Access**: All authenticated roles
- **Response `200 OK`**: Array of timetable slots.

#### 12. Create / Update Timetable Schedule
- **Endpoint**: `POST /api/v1/academic/timetables`
- **Access**: `SIMS_ADMIN`
- **Response `201 Created`**: Created timetable object.

#### 13. Fetch Assignments
- **Endpoint**: `GET /api/v1/academic/assignments`
- **Access**: `STUDENT`, `PARENT`, `TEACHER`
- **Response `200 OK`**: List of published assignments.

#### 14. Create / Post Assignment
- **Endpoint**: `POST /api/v1/academic/assignments`
- **Access**: `TEACHER`
- **Request Body**:
```json
{
  "title": "Advanced Mathematics Problem Set",
  "instructions": "Complete exercises 1 through 15 on Page 84.",
  "audience": "Grade 4 Section B",
  "due_date": "2026-10-15"
}
```
- **Response `201 Created`**: Created assignment record.

#### 15. Fetch Academic Calendar
- **Endpoint**: `GET /api/v1/academic/calendar`
- **Access**: All users
- **Response `200 OK`**: Calendar events array.

#### 16. Get & Update Global Academic Settings
- **Endpoint**: `GET /api/v1/settings/academic` | `PUT /api/v1/settings/academic`
- **Access**: `SIMS_ADMIN`
- **Request Body (PUT)**:
```json
{
  "academicYear": "2026/2027",
  "academicTerm": "Term 1",
  "classTestWeight": 50,
  "examWeight": 50,
  "gradingSystem": "BECE 9-Point Scale (GES Standard)",
  "resumptionDate": "2026-09-08",
  "vacationDate": "2026-12-18"
}
```
- **Response `200 OK`**: Updated academic settings.

---

### Module 6: Final Examination & Hall Pass Router (`/api/v1/exams`)

#### 1. Fetch Exam Registrations List
- **Endpoint**: `GET /api/v1/exams/registrations`
- **Query Params**: `class_level=JHS 3&term=Term 1`
- **Access**: `SIMS_ADMIN`, `TEACHER`
- **Response `200 OK`**: Array of exam registrations.

#### 2. Register Student for Final Examination & Generate Index Number
- **Endpoint**: `POST /api/v1/exams/register`
- **Access**: `SIMS_ADMIN`
- **Request Body**:
```json
{
  "student_id": "stu-003",
  "class_level": "JHS 3",
  "academic_year": "2025/2026",
  "term": "Term 1",
  "exam_type": "End-of-Term Final Examination",
  "exam_center": "Main Examination Hall A",
  "subjects": ["Mathematics", "English Language", "Integrated Science", "Social Studies", "ICT / Computing"]
}
```
- **Response `201 Created`**: Returns exam registration with auto-generated Index Number (e.g. `EXAM-2026-JHS3-041`) and status `Registered - Hall Pass Valid`.

#### 3. Generate Exam Hall Pass ID Card PDF
- **Endpoint**: `GET /api/v1/exams/hall-pass/{student_id}`
- **Access**: `STUDENT`, `PARENT`, `SIMS_ADMIN`
- **Response `200 OK`**: Renders PDF Exam Hall Pass card with student photo, barcode/RFID code, index number, subjects, and hall allocation.

---

### Module 7: Online Admissions & Application Engine Router (`/api/v1/admissions`)

#### 1. Submit Online Admission Application
- **Endpoint**: `POST /api/v1/admissions/applications`
- **Access**: Public
- **Request Body**:
```json
{
  "learner_name": "Akosua Agyeman",
  "guardian_name": "Mr. Kwesi Agyeman",
  "contact_email": "kwesi.agyeman@example.com",
  "contact_phone": "0240000000",
  "applying_level": "JHS 1",
  "form_data": {
    "dob": "2014-04-10",
    "previous_school": "Tarkwa Preparatory School",
    "medical_notes": "None"
  }
}
```
- **Response `201 Created`**: `{ "application_no": "APP-2026-001", "status": "Documents review" }`

#### 2. List Admission Applications
- **Endpoint**: `GET /api/v1/admissions/applications`
- **Query Params**: `status=Documents review`
- **Access**: `SIMS_ADMIN`, `HEADMASTER_PRE_AUDITOR`
- **Response `200 OK`**: Array of submitted admission applications.

#### 3. Fetch Single Application Details
- **Endpoint**: `GET /api/v1/admissions/applications/{id}`
- **Access**: `SIMS_ADMIN`
- **Response `200 OK`**: Full application record.

#### 4. Update Admission Application Status
- **Endpoint**: `PATCH /api/v1/admissions/applications/{id}/status`
- **Access**: `SIMS_ADMIN`
- **Request Body**: `{ "status": "Offered Admission", "office_use_notes": "Interview passed. Offer letter dispatched." }`
- **Response `200 OK`**: Updated application record.

---

### Module 8: Internal Messaging & Report Card Requests Router (`/api/v1/messages` & `/api/v1/reports`)

#### 1. List Internal Messages
- **Endpoint**: `GET /api/v1/messages`
- **Access**: Authenticated user
- **Response `200 OK`**: User inbox & sent messages.

#### 2. Dispatch Internal Message
- **Endpoint**: `POST /api/v1/messages`
- **Access**: Authenticated user
- **Request Body**:
```json
{
  "recipient_role": "Parent",
  "recipient_name": "Mrs. Angela Edwards",
  "recipient_email": "parent@remaljcarewell.edu.gh",
  "student_name": "Benjamin Edwards",
  "subject": "Academic Progress Update",
  "body": "Dear Mrs. Edwards, Benjamin has demonstrated commendable performance in mathematics this term."
}
```
- **Response `201 Created`**: Sent message record.

#### 3. Fetch Official Report Card Requests
- **Endpoint**: `GET /api/v1/reports/requests`
- **Access**: `SIMS_ADMIN`, `PARENT`
- **Response `200 OK`**: Array of report requests.

#### 4. Submit Report Card / Transcript Request
- **Endpoint**: `POST /api/v1/reports/requests`
- **Access**: `PARENT`
- **Request Body**: `{ "child": "Benjamin Edwards", "semester": "Term 3 · 2026", "note": "Required for visa processing." }`
- **Response `201 Created`**: Created request.

#### 5. Upload Official Signed PDF Report Card
- **Endpoint**: `POST /api/v1/reports/upload`
- **Access**: `SIMS_ADMIN`, `TEACHER`
- **Form Data**: `requestId` (UUID), `file` (PDF document)
- **Response `200 OK`**: `{ "status": "Uploaded", "file_url": "/uploads/reports/rep_9948.pdf" }`

---

### Module 9: Operations, Incidents & Facility Management Router (`/api/v1/operations`)

#### 1. Fetch Safeguarding Incident Logs
- **Endpoint**: `GET /api/v1/operations/incidents`
- **Access**: `SIMS_ADMIN`, `HEADMASTER_PRE_AUDITOR`
- **Response `200 OK`**: List of confidential incident logs.

#### 2. Log Safeguarding / Health Incident
- **Endpoint**: `POST /api/v1/operations/incidents`
- **Access**: `TEACHER`, `SIMS_ADMIN`
- **Request Body**:
```json
{
  "category": "Safeguarding",
  "person": "Student A",
  "severity": "Restricted",
  "status": "Under review"
}
```
- **Response `201 Created`**: Logged incident record.

#### 3. Fetch Asset Maintenance Tasks
- **Endpoint**: `GET /api/v1/operations/asset-tasks`
- **Access**: `SIMS_ADMIN`, `ACCOUNTANT`
- **Response `200 OK`**: Asset maintenance schedules list.

#### 4. Create / Update Asset Maintenance Task
- **Endpoint**: `POST /api/v1/operations/asset-tasks`
- **Access**: `SIMS_ADMIN`
- **Request Body**: `{ "asset": "Bus 01", "task": "Quarterly safety & brake inspection", "owner": "Transport lead", "status": "Scheduled", "due_date": "2026-10-01" }`
- **Response `201 Created`**: Saved task record.

---

### Module 10: GPS Bus Fleet Telemetry Router (`/api/v1/bus`)

#### 1. Fetch Active Bus Routes & Live Locations
- **Endpoint**: `GET /api/v1/bus/routes`
- **Access**: All authenticated users
- **Response `200 OK`**:
```json
{
  "routes": [
    {
      "id": "A",
      "name": "Bus 01 – Bogoso Route",
      "color": "#16a34a",
      "stops": ["School Grounds", "Anikoko Junction", "Bogoso Market"],
      "driverName": "Mr. Kweku Mensah",
      "driverPhone": "0244445555",
      "currentLat": 6.409,
      "currentLng": -1.952,
      "speed": "38 km/h",
      "status": "On Route"
    }
  ]
}
```

#### 2. Update Bus GPS Telemetry Coordinates
- **Endpoint**: `POST /api/v1/bus/telemetry`
- **Access**: Driver / On-board IoT Tracker
- **Request Body**: `{ "routeId": "A", "lat": 6.4112, "lng": -1.9545, "speed": "42 km/h" }`
- **Response `200 OK`**: `{ "updated": true }`

#### 3. Live WebSocket Bus Telemetry Feed
- **Endpoint**: `WS /api/v1/bus/ws/telemetry`
- **Access**: Connected Parent / Admin clients
- **Protocol**: WebSockets JSON stream broadcasting real-time lat/lng coordinates every 3 seconds.

---

### Module 11: Health & System Diagnostics Router (`/api/v1/health`)

#### 1. System Health Check
- **Endpoint**: `GET /api/v1/health`
- **Access**: Public
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "app": "REMALJ Carewell SIMS Enterprise Backend",
  "version": "3.0.0",
  "timestamp": "2026-09-25T13:15:00Z",
  "services": {
    "database": "connected (PostgreSQL 15)",
    "redis": "connected",
    "sms_gateway": "online (SMSOnlineGH v5)"
  }
}
```

---

## 5. Third-Party Gateway Integrations

### 5.1 SMSOnlineGH Gateway v5 Integration Specification
All automated SMS alerts (Attendance card taps, roll call absence notifications, OTP passcodes, fee overdue notices) dispatch HTTP POST requests to SMSOnlineGH.

- **Gateway URL**: `https://api.smsonlinegh.com/v5/sms/send`
- **Authorization Header**: `Authorization: key <SMS_API_KEY>`
- **Content-Type**: `application/json`
- **Phone Formatting Rule**: All Ghanaian phone numbers (e.g. `0241112222`) must be formatted to international format (`233241112222`).

```json
{
  "text": "[REMALJ Carewell] Dear Parent, Benjamin arrived at school at 07:45 AM.",
  "type": 0,
  "sender": "RCIS",
  "destinations": ["233241112222"]
}
```

### 5.2 PDF Generation Engine Rules
Server-side PDF generation (WeasyPrint / ReportLab) must embed high-resolution headers using the official school asset located at `/remalj-carewell-logo.jpg` (`templates/assets/remalj-carewell-logo.jpg`).

---

## 6. Financial Compliance, PV State Machine & Double-Entry Principles

### 6.1 Payment Voucher (PV) Enforcement Rules
1. **State Machine Flow**: Every Payment Voucher must progress strictly:
   `DRAFT` ──► `PRE_AUDITED` ──► `APPROVED` ──► `DISBURSED`
2. **Pre-Audit Requirement**: Disbursements without `pre_audited_by_id` and `pre_audited_at` timestamps MUST be rejected by the backend validation layer with HTTP `422 Unprocessable Entity`.

### 6.2 Immutable General Ledger Rules
- Direct `UPDATE` or `DELETE` SQL operations on `ledger_entries` are prohibited.
- Accounting corrections must be executed by posting reversing journal vouchers.

---

*Blueprint & Master API Specification verified for REMALJ Carewell SIMS Enterprise v2025.*
