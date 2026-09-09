# REMALJ Carewell Inspirational School & SIMS Enterprise v2025
## Comprehensive FastAPI Backend Architecture & API Specification Blueprint

> **Target Audience**: FastAPI Backend Engineering Team  
> **Version**: 2.5.0 (Updated September 2026)  
> **Status**: Production Blueprint  
> **Author**: Antigravity Technical Architecture Team

---

## 1. Executive Summary & Delta Breakdown

### 1.1 Overview
The **REMALJ Carewell Inspirational School Portal** (`ics-school-portal`) has expanded beyond the initial Teacher, Parent, and Student portals to include a full-fledged **Enterprise School Information Management System (SIMS v2025)** incorporating complete internal back-office accounting, payment voucher pre-auditing, staff payroll, automated fee billing, terminal evaluation engines, and real-time student telemetry.

### 1.2 Delta: Client's Initial Specs vs. Comprehensive SIMS v2025 Build

| Feature Area | Initial Client Documentation | Current Comprehensive SIMS v2025 Front-End Implementation | Required FastAPI Backend Scope |
|---|---|---|---|
| **Auth & Security** | Basic JWT Login for Parent, Teacher, Student | Added **SIMS Auth & Login Terminal** with role-gated enterprise authorization (Accountant, Headmaster/Pre-Auditor, Admin, Teacher). | Multi-role JWT authentication, session locking, SIMS security tokens, and permission-level scopes. |
| **Financial Accounting** | Simple Parent Fee Payment Status | Added **Payment Vouchers (PV)** creation, **Pre-Audit Approval**, **Payment Disbursement**, **Cash Book**, **General Ledger**, **Trial Balance**, **Income Statement**, **Balance Sheet**, and **Payroll/Payslips**. | Double-entry accounting engine, PV state machine, immutable ledger audit logs, and PDF voucher/payslip rendering. |
| **SIMS Academic Engine** | Basic Grades & Timetable | Added **Score Sheet [Entry]**, **SBA Assessment Engine**, **Pending Test Publication Audit**, **Creche Terminal Evaluations**, and **Year-Group Terminal Report Generators**. | Continuous assessment calculation engine, grade bounds mapping, multi-student bulk score entry, and creche progress tracking. |
| **School Administration** | Basic Incident Logging | Added **Staff Roster Management**, **Semester Class Registration Filters**, **Un-Authorised Creche Progress Report Clearance**, and **Official Fee Structure Management**. | HR staff endpoints, class enrollment query engine, report authorization pipelines, and grade-band fee configuration tables. |
| **Admissions & Receipts** | Basic Application Form | Added **Multi-step Admission Engine** and **Branded PDF Receipt Generator** with REMALJ Carewell School Logo (`/remalj-carewell-logo.jpg`). | File upload endpoints (S3/R2), PDF receipt generation background tasks, and application workflow status API. |

---

## 2. System Architecture & FastAPI Tech Stack

```
[ Frontend: React 18 + Vite ]
         │ (HTTP / REST JSON & WebSockets)
         ▼
[ NGINX Reverse Proxy / SSL Termination ]
         │
         ▼
[ FastAPI Application Service (Python 3.11+) ]
   ├── Pydantic v2 (Request/Response Validation)
   ├── SQLAlchemy 2.0 (Async ORM with Asyncpg)
   ├── FastAPI Security (OAuth2 Password Bearer / JWT)
   ├── WebSockets (Native FastAPI WS Manager)
   └── Celery / Arq Async Workers ──► [ Redis (Task Queue & Cache) ]
         │
         ├─► [ PostgreSQL 15+ (Relational DB) ]
         ├─► [ AWS S3 / MinIO (PDF Reports & Images) ]
         └─► [ WeasyPrint / ReportLab (PDF Generator) ]
```

### 2.1 Technology Standards
- **Python**: `^3.11`
- **Framework**: `FastAPI ^0.110.0`
- **ASGI Server**: `Uvicorn ^0.28.0` / `Gunicorn` worker class `uvicorn.workers.UvicornWorker`
- **ORM**: `SQLAlchemy ^2.0.28` (Async extension via `asyncpg`)
- **Database Migrations**: `Alembic ^1.13.1`
- **Data Validation**: `Pydantic v2` (`pydantic-settings` for env management)
- **Background Tasks & Scheduling**: `Celery ^5.3.6` / `Arq ^0.25.0` with `Redis ^7.2`
- **PDF Generation Engine**: `WeasyPrint` or `ReportLab` (for official branded receipts, vouchers, payslips, and terminal reports)

---

## 3. Comprehensive Database Schemas (PostgreSQL & SQLAlchemy)

### 3.1 Authentication & Role Scopes (`users`, `sims_auth_tokens`)
```sql
CREATE TYPE user_role AS ENUM (
  'ACCOUNTANT', 'HEADMASTER_PRE_AUDITOR', 'SIMS_ADMIN', 'TEACHER', 'PARENT', 'STUDENT'
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
```

### 3.2 Payment Vouchers & Internal Accounting (`payment_vouchers`, `ledger_entries`, `cash_book`)
```sql
CREATE TYPE pv_status AS ENUM ('DRAFT', 'PRE_AUDITED', 'APPROVED', 'DISBURSED', 'REJECTED');

CREATE TABLE payment_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pv_number VARCHAR(50) UNIQUE NOT NULL, -- e.g. PV-2026-0042
  payee_name VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  payment_mode VARCHAR(50) NOT NULL, -- e.g. 'Bank Transfer', 'Cheque', 'Cash'
  status pv_status NOT NULL DEFAULT 'DRAFT',
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
  account_code VARCHAR(50) NOT NULL, -- e.g. '1000-CASH', '4000-FEES'
  account_name VARCHAR(255) NOT NULL,
  entry_type VARCHAR(10) CHECK (entry_type IN ('DEBIT', 'CREDIT')),
  amount NUMERIC(12, 2) NOT NULL,
  narrative TEXT,
  pv_id UUID REFERENCES payment_vouchers(id),
  posted_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.3 Fee Structure & Student Billing (`fee_structures`, `bills_receivables`)
```sql
CREATE TABLE fee_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year VARCHAR(50) NOT NULL, -- e.g. '2025/2026'
  term VARCHAR(50) NOT NULL,          -- e.g. 'Term 1'
  grade_level VARCHAR(50) NOT NULL,   -- e.g. 'Creche', 'Nursery', 'JHS 1'
  tuition_fee NUMERIC(10,2) DEFAULT 0,
  first_timer_fee NUMERIC(10,2) DEFAULT 0,
  pta_levy NUMERIC(10,2) DEFAULT 0,
  canteen_fee NUMERIC(10,2) DEFAULT 0,
  bus_fee NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) GENERATED ALWAYS AS (tuition_fee + first_timer_fee + pta_levy + canteen_fee + bus_fee) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE bills_receivables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  student_name VARCHAR(255) NOT NULL,
  class_level VARCHAR(50) NOT NULL,
  term VARCHAR(50) NOT NULL,
  billed_amount NUMERIC(10,2) NOT NULL,
  paid_amount NUMERIC(10,2) DEFAULT 0,
  balance_due NUMERIC(10,2) GENERATED ALWAYS AS (billed_amount - paid_amount) STORED,
  status VARCHAR(50) DEFAULT 'Balance Due', -- 'Paid', 'Partial', 'Balance Due'
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.4 SIMS Academic & Evaluation Engine (`score_sheets`, `sba_assessments`, `creche_evaluations`)
```sql
CREATE TABLE score_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  class_level VARCHAR(50) NOT NULL,
  term VARCHAR(50) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  class_score NUMERIC(5,2) DEFAULT 0, -- Max 30 or 40
  exam_score NUMERIC(5,2) DEFAULT 0,  -- Max 70 or 60
  total_score NUMERIC(5,2) GENERATED ALWAYS AS (class_score + exam_score) STORED,
  grade VARCHAR(5) NOT NULL,          -- 'A', 'B', 'C', 'D', 'F'
  is_published BOOLEAN DEFAULT FALSE,
  teacher_id UUID REFERENCES users(id),
  entered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE creche_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  eval_term VARCHAR(50) NOT NULL,
  social_skills VARCHAR(50) NOT NULL,    -- 'Developing', 'Proficient', 'Exceeding'
  motor_skills VARCHAR(50) NOT NULL,
  cognitive_growth VARCHAR(50) NOT NULL,
  teacher_remarks TEXT,
  is_authorised BOOLEAN DEFAULT FALSE,
  authorised_by_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
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

---

## 4. FastAPI Router & Endpoint Specifications

### 4.1 SIMS Security & Enterprise Authentication Router (`/api/v1/sims-auth`)

#### `POST /api/v1/sims-auth/login`
- **Summary**: Authenticates a user into the SIMS Enterprise Terminal.
- **Request Body**:
```json
{
  "username": "ACCOUNTANT",
  "password": "SecretPassword123",
  "role_designation": "Accountant / Finance Officer"
}
```
- **Response `200 OK`**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1Ni...",
  "token_type": "bearer",
  "sims_token": "SIMS-AUTH-2025-9984-SECURE",
  "user": {
    "id": "c7a840e1-456b-4e89-8d76-123456789abc",
    "username": "ACCOUNTANT",
    "full_name": "Mrs. Grace Accountant",
    "role": "ACCOUNTANT"
  }
}
```

#### `POST /api/v1/sims-auth/lock-session`
- **Summary**: Explicitly locks the SIMS security terminal session.
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**: `{ "status": "locked", "message": "SIMS session locked successfully" }`

---

### 4.2 Financial Accounting & PV Approval Router (`/api/v1/finance`)

#### `POST /api/v1/finance/vouchers`
- **Summary**: Create a new Payment Voucher (Draft).
- **Request Body**:
```json
{
  "payee_name": "State Insurance Company",
  "department": "Administration",
  "description": "Annual Bus Fleet Comprehensive Insurance Renewal",
  "amount": 4500.00,
  "payment_mode": "Bank Transfer"
}
```
- **Response `201 Created`**: Returns created `PaymentVoucher` object with `status: "DRAFT"`.

#### `POST /api/v1/finance/vouchers/{pv_id}/pre-audit`
- **Summary**: Pre-Audit and approve Payment Voucher (Headmaster / Pre-Auditor / Accountant role required).
- **Request Body**:
```json
{
  "decision": "APPROVED",
  "audit_notes": "All supporting receipts verified against vote book."
}
```
- **Response `200 OK`**:
```json
{
  "pv_id": "9a7b6c5d-4e3f-2a1b-0c9d-8e7f6a5b4c3d",
  "pv_number": "PV-2026-0089",
  "status": "PRE_AUDITED",
  "pre_audited_by": "Mr. Kwame Headmaster",
  "pre_audited_at": "2026-09-09T17:35:00Z"
}
```

#### `POST /api/v1/finance/vouchers/{pv_id}/disburse`
- **Summary**: Disburse payment for an approved Payment Voucher and generate general ledger entries.
- **Response `200 OK`**: Updates status to `DISBURSED`, creates Debit entry in Expense Account and Credit entry in Cash/Bank Account, and returns PDF download URL for official receipt voucher.

#### `GET /api/v1/finance/reports/cash-book`
- **Query Params**: `start_date=2026-09-01&end_date=2026-09-30`
- **Response `200 OK`**: Cash book receipts, payments, running balances, and summary tallies.

#### `GET /api/v1/finance/reports/trial-balance`
- **Query Params**: `as_of_date=2026-09-30`
- **Response `200 OK`**: List of accounts with debit and credit balances, ensuring total debits equal total credits.

#### `POST /api/v1/finance/payroll/generate-payslip`
- **Request Body**: `{ "staff_id": "...", "pay_period": "September 2026", "allowances": 350.00 }`
- **Response `200 OK`**: Calculates SSNIT (5.5%), PAYE tax brackets, net pay, and renders downloadable branded PDF payslip.

---

### 4.3 SIMS Enterprise v2025 Academic & Operations Router (`/api/v1/sims`)

#### `POST /api/v1/sims/score-sheets/entry`
- **Summary**: Bulk score sheet entry for class tests and exams.
- **Request Body**:
```json
{
  "class_level": "JHS 2",
  "term": "Term 3 · 2026",
  "subject": "Integrated Science",
  "scores": [
    { "student_id": "u1-uuid", "class_score": 28.5, "exam_score": 62.0 },
    { "student_id": "u2-uuid", "class_score": 24.0, "exam_score": 58.5 }
  ]
}
```

#### `GET /api/v1/sims/staff/list`
- **Summary**: Retrieves complete HR staff roster with designations, departments, and contacts.

#### `POST /api/v1/sims/creche/evaluations`
- **Summary**: Submit early childhood developmental milestone checklist for Creche students.

#### `GET /api/v1/sims/test-results/pending`
- **Summary**: Fetch all un-published score sheets awaiting headmaster/academic director approval before release to student & parent portals.

#### `POST /api/v1/sims/test-results/{score_sheet_id}/publish`
- **Summary**: Publish approved test results to parent/student dashboards.

#### `GET /api/v1/sims/students/registered-by-class`
- **Query Params**: `class_level=Primary 4&term=Term 1`
- **Response `200 OK`**: Active semester registration roster per sub-class.

#### `GET /api/v1/sims/creche/unauthorised-reports`
- **Summary**: Returns list of pending creche progress reports awaiting authorization.

#### `GET /api/v1/sims/reports/terminal/individual/{student_id}`
- **Query Params**: `term=Term 3 · 2026`
- **Response `200 OK`**: Generates full individual terminal report PDF (grades, positions, class averages, conduct, teacher/headmaster signatures, and school logo).

---

### 4.4 Admissions & Public Applications Router (`/api/v1/admissions`)

#### `POST /api/v1/admissions/applications`
- **Summary**: Submit public multi-step online student admission application.
- **Request Form Data**: JSON metadata + multipart file attachments (Birth Certificate, Past Reports).

---

## 5. Implementation Guide & Code Blueprint for FastAPI Developer

### 5.1 Project Directory Structure
```
backend/
├── app/
│   ├── main.py                   # FastAPI initialization & middleware
│   ├── core/
│   │   ├── config.py             # BaseSettings with environment variables
│   │   ├── security.py           # JWT creation, password hashing (passlib/bcrypt)
│   │   └── database.py           # Async SQLAlchemy engine & session maker
│   ├── models/                   # SQLAlchemy ORM Models
│   │   ├── user.py
│   │   ├── finance.py
│   │   ├── sims.py
│   │   └── staff.py
│   ├── schemas/                  # Pydantic v2 Schemas
│   │   ├── auth.py
│   │   ├── finance.py
│   │   └── sims.py
│   ├── api/
│   │   ├── deps.py               # Dependency injection (get_db, get_current_user)
│   │   └── v1/
│   │       ├── router.py
│   │       ├── auth_router.py
│   │       ├── finance_router.py
│   │       ├── sims_router.py
│   │       └── admissions_router.py
│   └── services/
│       ├── pdf_service.py        # PDF rendering with WeasyPrint & HTML templates
│       └── accounting_engine.py  # Double-entry ledger logic
├── alembic/                      # Database migrations
├── templates/                    # HTML/CSS templates for PDF receipts & terminal reports
├── Dockerfile
└── requirements.txt
```

### 5.2 Example Pydantic Schemas (`app/schemas/finance.py`)
```python
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from decimal import Decimal
from datetime import datetime
from enum import Enum

class PVStatusEnum(str, Enum):
    DRAFT = "DRAFT"
    PRE_AUDITED = "PRE_AUDITED"
    APPROVED = "APPROVED"
    DISBURSED = "DISBURSED"
    REJECTED = "REJECTED"

class PaymentVoucherCreate(BaseModel):
    payee_name: str = Field(..., min_length=2, example="State Insurance Company")
    department: str = Field(..., example="Administration")
    description: str = Field(..., example="Fleet Insurance Renewal")
    amount: Decimal = Field(..., gt=0, example=4500.00)
    payment_mode: str = Field(..., example="Bank Transfer")

class PaymentVoucherResponse(PaymentVoucherCreate):
    model_config = ConfigDict(from_attributes=True)

    id: str
    pv_number: str
    status: PVStatusEnum
    created_at: datetime
    pre_audited_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    disbursed_at: Optional[datetime] = None
```

### 5.3 Example FastAPI Route Dependency (`app/api/deps.py`)
```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_async_session
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/sims-auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_async_session)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await db.get(User, user_id)
    if user is None or not user.is_active:
        raise credentials_exception
    return user

def require_roles(allowed_roles: list[str]):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted for current user role"
            )
        return current_user
    return role_checker
```

---

## 6. Key Fixes & Best Practice Recommendations

1. **PV State Machine Enforcement**: Ensure that state transitions for Payment Vouchers follow strict ordering (`DRAFT` -> `PRE_AUDITED` -> `APPROVED` -> `DISBURSED`). Disallow disbursements without pre-audit timestamps.
2. **Immutable Financial Ledgers**: Implement ledger posting logic such that ledger entries cannot be updated or deleted (`UPDATE` / `DELETE` restricted via DB triggers). Corrective entries must be posted as reversal journal vouchers.
3. **CORS & CORS Credentials**:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:5173", "https://portal.remaljcarewell.edu.gh"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```
4. **Official Logo Integration for PDF Engine**: Store `/remalj-carewell-logo.jpg` in `templates/assets/` so server-side PDF generators (`WeasyPrint` / `ReportLab`) can embed high-resolution headers on generated vouchers, pay slips, and academic progress reports.

---
*Blueprint verified and ready for FastAPI backend engineering rollout.*
