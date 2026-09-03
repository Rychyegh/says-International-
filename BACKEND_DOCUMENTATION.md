# REMALJ Carewell Inspirational School - Backend Implementation & API Specification

## 1. System Overview

This document provides complete backend implementation specifications for the **REMALJ Carewell Inspirational School Portal** (`ics-school-portal`). The portal is a multi-role educational management platform supporting three primary user portals:
1. **Staff / Teacher Portal**: Class management, grading, parent messaging, incident/safeguarding logging, report approvals, asset task tracking, and bus route monitoring.
2. **Parent Portal**: Fee tracking & payments, child academic progress & reports, direct teacher communication, real-time bus tracking, and smart pickup / welfare status checks.
3. **Student Portal**: Timetable view, results & assignment submissions, academic calendar, learning resources, and public admissions onboarding.

---

## 2. Recommended Tech Stack & Architecture

- **Runtime & Language**: Node.js (TypeScript / Express or NestJS) OR Python (FastAPI / Django REST Framework).
- **Database**: PostgreSQL (Relational DB for structured school, student, fee, grade, and audit data).
- **Caching & Real-Time Broker**: Redis (for session handling, WebSocket message pub/sub, and bus telemetry caching).
- **Object Storage**: AWS S3 / Cloudflare R2 / MinIO (for PDF academic reports, assignment submissions, and profile photos).
- **Real-Time Data**: WebSockets (Socket.IO / native WS) for live bus tracking updates and instant notifications.
- **Authentication**: JWT (JSON Web Tokens) + HTTP-Only Secure Cookies, with support for:
  - Email & Password Login
  - School NFC / Barcode Card Scan Authentication
  - QR-based Mobile Approval

---

## 3. Database Schemas & Models

### 3.1 `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique user identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User login email |
| `password_hash` | VARCHAR(255) | NOT NULL | Argon2 / bcrypt hashed password |
| `role` | VARCHAR(50) | NOT NULL | `'teacher'`, `'parent'`, `'student'`, `'admin'` |
| `full_name` | VARCHAR(255) | NOT NULL | User's full name |
| `card_id` | VARCHAR(100) | UNIQUE, NULLABLE | School card barcode/NFC ID |
| `photo_url` | TEXT | NULLABLE | Profile picture URL |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |

### 3.2 `students`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique student identifier |
| `user_id` | UUID | REFERENCES users(id) | Associated student user account |
| `parent_id` | UUID | REFERENCES users(id) | Associated guardian/parent user account |
| `class_level` | VARCHAR(50) | NOT NULL | e.g. `'JHS 1'`, `'SH2'` |
| `school_name` | VARCHAR(255) | DEFAULT 'REMALJ Carewell Inspirational School' | School branch name |

### 3.3 `timetables`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique schedule entry ID |
| `day` | VARCHAR(20) | NOT NULL | `'Monday'`, `'Tuesday'`, etc. |
| `time` | VARCHAR(50) | NOT NULL | e.g. `'08:00 AM'` |
| `subject` | VARCHAR(100) | NOT NULL | Subject name |
| `room` | VARCHAR(100) | NOT NULL | Classroom / Lab location |
| `lecturer` | VARCHAR(100) | NOT NULL | Teacher/Lecturer name |
| `class_level` | VARCHAR(50) | NULLABLE | Target class level |

### 3.4 `academic_results`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Result ID |
| `student_id` | UUID | REFERENCES students(id) | Target student |
| `subject` | VARCHAR(100) | NOT NULL | Subject title |
| `score` | NUMERIC(5,2) | NOT NULL | Percentage score (0-100) |
| `grade` | VARCHAR(10) | NOT NULL | Grade code (`'A'`, `'A-'`, `'B'`, etc.) |
| `lecturer` | VARCHAR(100) | NOT NULL | Grading teacher |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

### 3.5 `report_requests` & `published_reports`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Request/Report ID |
| `child_name` | VARCHAR(255) | NOT NULL | Child's name |
| `semester` | VARCHAR(100) | NOT NULL | Academic term / semester |
| `note` | TEXT | NULLABLE | Parent notes/instructions |
| `status` | VARCHAR(50) | DEFAULT 'Requested' | `'Requested'`, `'Available'`, `'Archived'` |
| `file_name` | VARCHAR(255) | NULLABLE | PDF file name |
| `file_url` | TEXT | NULLABLE | S3 bucket object URL |
| `requested_at` | TIMESTAMPTZ | DEFAULT NOW() | Request date |
| `uploaded_at` | TIMESTAMPTZ | NULLABLE | Staff upload completion date |

### 3.6 `incidents` (Safeguarding & Welfare)
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Incident record ID |
| `category` | VARCHAR(100) | NOT NULL | e.g. `'Safeguarding'`, `'Health & welfare'` |
| `person` | VARCHAR(255) | NOT NULL | Subject student/staff name |
| `severity` | VARCHAR(50) | NOT NULL | `'Restricted'`, `'Confidential'`, `'Standard'` |
| `status` | VARCHAR(50) | DEFAULT 'Open' | `'Open'`, `'Under review'`, `'Follow-up due'`, `'Resolved'` |
| `logged_by` | UUID | REFERENCES users(id) | Teacher/Staff who logged case |
| `logged_at` | TIMESTAMPTZ | DEFAULT NOW() | Case creation timestamp |

### 3.7 `fee_accounts`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Fee record ID |
| `parent_id` | UUID | REFERENCES users(id) | Target parent |
| `child_name` | VARCHAR(255) | NOT NULL | Child name |
| `term` | VARCHAR(100) | NOT NULL | Term billing period |
| `billed_amount` | NUMERIC(10,2) | NOT NULL | Total billed amount |
| `paid_amount` | NUMERIC(10,2) | NOT NULL | Amount paid |
| `status` | VARCHAR(50) | NOT NULL | `'Paid'`, `'Balance due'`, `'Overdue'` |

### 3.8 `messages`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Message ID |
| `from_name` | VARCHAR(255) | NOT NULL | Sender display name |
| `sender_role` | VARCHAR(50) | NOT NULL | `'Staff'`, `'Parent'`, `'Student'` |
| `recipient` | VARCHAR(255) | NOT NULL | Recipient display name or group |
| `subject` | VARCHAR(255) | NOT NULL | Message subject line |
| `body` | TEXT | NOT NULL | Full text message body |
| `sent_at` | TIMESTAMPTZ | DEFAULT NOW() | Sent timestamp |

### 3.9 `bus_routes` & `telemetry`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | VARCHAR(20) | PRIMARY KEY | Route ID (`'A'`, `'B'`, `'C'`, `'D'`) |
| `name` | VARCHAR(255) | NOT NULL | Route name (e.g. `'Bus 01 – Bogoso Route'`) |
| `color` | VARCHAR(20) | NOT NULL | Hex color code for map tracking |
| `stops` | JSONB | NOT NULL | Array of stop names |
| `driver_name` | VARCHAR(255) | NOT NULL | Driver name |
| `driver_phone` | VARCHAR(50) | NULLABLE | Phone contact |
| `current_lat` | NUMERIC(9,6) | NULLABLE | Live GPS latitude |
| `current_lng` | NUMERIC(9,6) | NULLABLE | Live GPS longitude |
| `speed` | VARCHAR(20) | NULLABLE | e.g. `'38 km/h'` |
| `status` | VARCHAR(50) | NOT NULL | `'On Route'`, `'At School'`, `'Maintenance'` |

---

## 4. API Endpoints Specification

### 4.1 Authentication & User Access
- `POST /api/v1/auth/login`
  - **Body**: `{ "email": "...", "password": "...", "portal": "teacher|parent" }`
  - **Response**: `{ "token": "JWT_TOKEN", "user": { "id": "...", "name": "...", "role": "..." } }`
- `POST /api/v1/auth/card-scan`
  - **Body**: `{ "cardId": "...", "portal": "..." }`
  - **Response**: `{ "token": "JWT_TOKEN", "user": { ... } }`
- `POST /api/v1/auth/request-otp`
  - **Body**: `{ "phone": "0241112222", "purpose": "password_reset" }`
  - **Response**: `{ "success": true, "message": "OTP sent via SMS", "otp": "482910" }`
- `POST /api/v1/auth/verify-otp`
  - **Body**: `{ "phone": "0241112222", "otp": "482910", "newPassword": "..." }`
  - **Response**: `{ "success": true, "message": "Password reset successfully" }`
- `POST /api/v1/auth/logout`
  - Clears authentication cookie/session token.
- `GET /api/v1/users/profile`
  - **Headers**: `Authorization: Bearer <token>`
  - **Response**: Current user profile metadata.

### 4.2 Timetable & Academics
- `GET /api/v1/academics/timetable`
  - **Query**: `?classLevel=SH2` (optional)
  - **Response**: Array of timetable entries.
- `POST /api/v1/academics/timetable` *(Staff only)*
  - **Body**: `{ "day": "Monday", "time": "08:00 AM", "subject": "Mathematics", "room": "Room 402", "lecturer": "Prof. Mensah" }`
- `GET /api/v1/academics/results`
  - **Response**: Array of subject scores and grades for the authenticated student or parent's child.
- `POST /api/v1/academics/results` *(Staff only)*
  - **Body**: `{ "subject": "Pure Mathematics", "score": 91, "grade": "A", "lecturer": "Prof. Mensah" }`

### 4.3 Academic Reports & Requests
- `GET /api/v1/reports/requests`
  - **Response**: Array of report requests.
- `POST /api/v1/reports/requests` *(Parent only)*
  - **Body**: `{ "child": "Benjamin Edwards", "semester": "Term 1 · 2026", "note": "Need copy for scholarship" }`
- `POST /api/v1/reports/upload` *(Staff only)*
  - **Form Data**: `requestId`, `file` (Multipart PDF upload)
  - **Response**: `{ "status": "Available", "fileUrl": "https://s3..." }`

### 4.4 Operations, Safeguarding & Documentation
- `GET /api/v1/operations/incidents` *(Staff only)*
  - **Response**: List of safeguarding and health cases.
- `POST /api/v1/operations/incidents` *(Staff only)*
  - **Body**: `{ "category": "Safeguarding", "person": "Student A", "severity": "Restricted" }`
- `GET /api/v1/operations/asset-tasks` *(Staff only)*
  - **Response**: List of maintenance and asset inspection tasks.
- `POST /api/v1/operations/asset-tasks` *(Staff only)*
  - **Body**: `{ "asset": "Bus 01", "task": "Brake pad replacement", "owner": "Transport Lead", "due": "2026-08-30" }`

### 4.5 Messages & Announcements
- `GET /api/v1/messages`
  - **Response**: Inbox messages relevant to authenticated role.
- `POST /api/v1/messages`
  - **Body**: `{ "recipient": "Mrs. Angela Edwards", "subject": "Academic Update", "body": "Term results ready." }`

### 4.6 Bus Tracking & Telemetry
- `GET /api/v1/bus/routes`
  - **Response**: List of all routes, current driver info, onboard manifest count, and GPS coordinates.
- `GET /api/v1/bus/routes/:routeId/manifest`
  - **Response**: Array of student manifest records (boarded status and pickup stops).
- `POST /api/v1/bus/telemetry` *(Bus GPS Device / Supervisor app)*
  - **Body**: `{ "routeId": "A", "lat": 6.4090, "lng": -1.9520, "speed": "38 km/h", "nextStop": "Anikoko", "eta": "15:45" }`

### 4.7 Admissions & Public Applications
- `POST /api/v1/admissions/applications`
  - **Body**: `{ "learner": "...", "guardian": "...", "email": "...", "phone": "...", "level": "JHS 1" }`
- `GET /api/v1/admissions/applications` *(Staff/Admin only)*
- `PATCH /api/v1/admissions/applications/:id/status`
  - **Body**: `{ "status": "Under review | Approved | Rejected" }`

---

## 5. WebSockets Specification (Real-Time Updates)

- **Connection URL**: `wss://api.remaljcarewell.edu.gh/ws`
- **Authentication**: Connect query parameter `?token=JWT_TOKEN`
- **Events**:
  - `bus:location_update` (Emitted every 5 seconds per route)
    - Payload: `{ "routeId": "A", "lat": 6.4092, "lng": -1.9523, "speed": "40 km/h", "progress": 65 }`
  - `message:received` (Instant push for parent-teacher chat)
  - `report:ready` (Pushed to parent when staff uploads requested PDF report)

---

## 6. Implementation Instructions for Frontend Integration

Currently, the React frontend stores mock data in `src/data/PortalStore.jsx` using `localStorage`.

### Steps to connect the Frontend to this Backend:
1. Replace `PortalStore.jsx` `readData` and state mutators with an HTTP service client (e.g., using `axios` or standard `fetch`).
2. Add an environment variable file (`.env`):
   ```env
   VITE_API_BASE_URL=https://api.remaljcarewell.edu.gh/api/v1
   VITE_WS_URL=wss://api.remaljcarewell.edu.gh/ws
   ```
3. Implement standard token storage (`localStorage.setItem('auth_token', token)` or HTTP-Only cookie handling) inside `src/components/Login/LoginPage.jsx`.
4. Subscribe `BusTracker.jsx` to `ws.on('bus:location_update')` instead of local `setInterval` mock calculations.

---

*Documentation compiled for REMALJ Carewell Inspirational School Portal Development Team.*
