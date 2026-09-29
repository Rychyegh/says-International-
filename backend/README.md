# REMALJ Carewell SIMS - FastAPI Production Backend

Complete, asynchronous REST API backend powering the **REMALJ Carewell Inspirational School Information Management System (SIMS)**.

---

## 1. Quick Start Guide

### Step 1: Create and Activate Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Step 2: Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### Step 3: Run FastAPI Server
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```

- **API Base URL**: `http://localhost:8000/api/v1`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`

---

## 2. All Generated Endpoints

| Category | Method | Endpoint | Description |
|---|---|---|---|
| **Health** | `GET` | `/api/v1/health` | Service & DB health check |
| **Auth** | `POST` | `/api/v1/auth/login` | Email/identifier & password sign in |
| **Auth** | `POST` | `/api/v1/auth/card-scan` | Smart card / RFID NFC login |
| **Auth** | `POST` | `/api/v1/auth/register` | Account registration |
| **Auth** | `POST` | `/api/v1/auth/forgot-password/request-otp` | Dispatch 6-digit SMS OTP |
| **Auth** | `POST` | `/api/v1/auth/forgot-password/verify-otp` | Verify SMS verification code |
| **Auth** | `POST` | `/api/v1/auth/forgot-password/reset` | Set new password with OTP |
| **Auth** | `POST` | `/api/v1/auth/admin/set-password` | Super Admin cross-portal password override |
| **Students** | `GET` | `/api/v1/students` | Get all onboarded students |
| **Students** | `POST` | `/api/v1/students/onboard` | Onboard student & initialize billing |
| **Students** | `DELETE` | `/api/v1/students/{id}` | Delete/offboard student |
| **Attendance**| `POST` | `/api/v1/attendance/scan` | RFID NFC attendance scan + SMS trigger |
| **Attendance**| `GET` | `/api/v1/attendance` | Query live attendance logs |
| **Attendance**| `POST` | `/api/v1/attendance/roll-call` | Class roll call submission |
| **Attendance**| `POST` | `/api/v1/attendance/notify-absent` | Send SMS alerts for absent students |
| **Attendance**| `GET` | `/api/v1/attendance/sms-balance` | Query SMSOnlineGH credits balance |
| **Finance** | `GET` | `/api/v1/finance/fees` | Get fee accounts and balances |
| **Finance** | `POST` | `/api/v1/finance/fees/{feeId}/pay` | Record fee payment (MoMo, Cash, Bank) |
| **Finance** | `POST` | `/api/v1/finance/remind` | Send payment reminder notification |
| **Finance** | `GET` | `/api/v1/finance/pv` | Get Payment Vouchers list |
| **Finance** | `POST` | `/api/v1/finance/pv` | Create Payment Voucher |
| **Finance** | `PATCH` | `/api/v1/finance/pv/{pvId}/status` | Pre-Audit / Approve / Reject PV |
| **Admissions**| `POST` | `/api/v1/admissions/applications` | Submit online admission application |
| **Admissions**| `GET` | `/api/v1/admissions/applications` | List admissions applications |
| **Admissions**| `PATCH` | `/api/v1/admissions/applications/{id}/status` | Update admission application status |
| **Admissions**| `PUT` | `/api/v1/admissions/applications/{id}` | Update application form details |
| **Admissions**| `DELETE` | `/api/v1/admissions/applications/{id}` | Delete admission application |
| **Reports** | `GET` | `/api/v1/reports/requests` | List terminal report requests |
| **Reports** | `POST` | `/api/v1/reports/requests` | Create report request |
| **Reports** | `POST` | `/api/v1/reports/upload` | Upload PDF report document |
| **Results** | `GET` | `/api/v1/results` | List academic results & grades |
| **Results** | `POST` | `/api/v1/results` | Record grades & marks |
| **Results** | `PATCH` | `/api/v1/results/{id}/status` | Approve / Decline results with note |
| **Timetable** | `GET` | `/api/v1/timetables` | Get class timetable schedule |
| **Timetable** | `POST` | `/api/v1/timetables` | Create timetable entry |
| **Assignments**| `GET` | `/api/v1/assignments` | List student assignments |
| **Assignments**| `POST` | `/api/v1/assignments` | Create assignment |
| **Incidents** | `GET` | `/api/v1/incidents` | Safeguarding incident tracking |
| **Incidents** | `POST` | `/api/v1/incidents` | Log incident |
| **Assets** | `GET` | `/api/v1/asset-tasks` | Facility & maintenance tasks |
| **Assets** | `POST` | `/api/v1/asset-tasks` | Create asset task |
| **Messages** | `GET` | `/api/v1/messages` | List parent/teacher messages |
| **Messages** | `POST` | `/api/v1/messages` | Send message/announcement |
| **Bus** | `GET` | `/api/v1/bus/routes` | Get live bus routes & GPS telemetry |
| **Bus** | `POST` | `/api/v1/bus/telemetry` | Push vehicle GPS coordinates |
