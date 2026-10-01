# Class Teacher Role — Backend Implementation Brief

**Send this file to the FastAPI backend developer.**

| | |
|---|---|
| Product | REMALJ Carewell Inspirational School portal (SIMS) |
| Base URL | `https://rcis-backend.onrender.com/api/v1` |
| Auth | `Authorization: Bearer <jwt>` |
| Frontend client | `src/services/api.js` |
| Sign-in screen | `src/components/Login/LoginPage.jsx` |
| Super Admin issuer | `src/portals/AdminPortal.jsx` (head admin only) |
| Class teacher portal | `src/portals/TeacherPortal.jsx` |
| Status | The portal already calls every endpoint in this brief. Implement them to the contracts below. |

A class teacher is a form tutor. They sign in with the same staff email and password as a subject teacher, then enter a passcode that only the head administrator can issue. After that passcode is accepted they see their assigned class: the student ledger, attendance, admissions, messages, transport, operations, and settings. A subject teacher never gets those screens.

Snake_case is what the portal sends. The portal also accepts camelCase on the way back, so either response style works. Prefer snake_case in new responses.

---

## 1. Sign-in sequence

This is the live screen. Do not replace it with staff-ID-only login.

```
Staff opens /teacher
        │
        ▼
POST /auth/login          { email, password, portal: "teacher" }
        │
        │  JWT saved. User is not yet a class teacher in the portal.
        ▼
Does the user object say this person is a class teacher?
        │
        ├── no ──► GET /auth/class-teacher/me
        │              is_class_teacher: false ──► open portal as subject teacher
        │
        └── yes ─► passcode screen
                        │
                        ▼
              POST /auth/class-teacher/verify   { staff_id, passcode }
                        │
                        ├── 200 + new JWT with teacher_designation = class_teacher
                        │         portal opens as class teacher
                        └── 401  portal shows the detail string and
                                 POST /auth/security-alerts
```

`POST /auth/class-teacher/login` exists on the client for a direct staff-ID login. The sign-in screen does not call it. Implement it with the same passcode check, but the path that must work first is `login` then `verify`.

### How the portal decides “this is a class teacher”

After `POST /auth/login`, any one of these on `user` is enough:

- `teacher_designation` or `designation` contains `class_teacher`
- `is_class_teacher: true`
- `requires_class_teacher_passcode: true`
- `role` is `class_teacher`

If none of those are present, the portal calls `GET /auth/class-teacher/me` with the login JWT. Return:

```json
{
  "is_class_teacher": true,
  "staff_id": "CT-2026-003",
  "class_assigned": "Basic 4"
}
```

Use `is_class_teacher: false` for a subject teacher. Do not return 404 for a normal teacher; the portal treats any error as “not a class teacher” and skips the passcode.

### Login user object the portal reads

```json
{
  "token": "<jwt>",
  "user": {
    "id": "uuid",
    "email": "samuel.amponsah@remaljcarewell.edu.gh",
    "full_name": "Mr. Samuel Amponsah",
    "role": "teacher",
    "teacher_designation": "class_teacher",
    "is_class_teacher": true,
    "requires_class_teacher_passcode": true,
    "staff_id": "CT-2026-003",
    "class_assigned": "Basic 4",
    "phone_number": "0249001100"
  }
}
```

`role` stays `teacher`. The designation is what opens the class teacher portal. Put the same claims on the JWT:

```json
{
  "sub": "user-uuid",
  "role": "TEACHER",
  "teacher_designation": "class_teacher",
  "staff_id": "CT-2026-003",
  "class_assigned": "Basic 4",
  "passcode_verified": false
}
```

`passcode_verified` becomes `true` only on the token returned by `verify` (and by the unused direct login). Routes that are class-teacher-only must reject a teacher token whose `passcode_verified` is false with `403`.

---

## 2. Database

Add the role and a credential table. Link the credential to the existing staff user by `staff_id` / `staff_code`. The issue form does not collect an email, so the join key is the staff ID already stored on that teacher’s user or staff row.

```sql
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'CLASS_TEACHER';

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS teacher_designation VARCHAR(50),
  ADD COLUMN IF NOT EXISTS staff_code VARCHAR(50);

CREATE TABLE class_teacher_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  teacher_name VARCHAR(255) NOT NULL,
  class_assigned VARCHAR(100) NOT NULL,
  staff_id VARCHAR(50) NOT NULL UNIQUE,
  passcode_encrypted TEXT NOT NULL,
  phone VARCHAR(50),
  sms_status VARCHAR(20) NOT NULL DEFAULT 'not_sent',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  issued_by UUID REFERENCES users(id),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX one_active_class_teacher_per_class
  ON class_teacher_credentials (class_assigned)
  WHERE is_active = TRUE;
```

Accepted class names, matching the admin form:

`Creche`, `Nursery 1`, `Nursery 2`, `KG 1`, `KG 2`, `Basic 1` through `Basic 9`.

### Passcode storage

The head-admin register shows the passcode again after a reload (`GET /auth/class-teachers`). A one-way hash cannot do that. Encrypt the passcode at rest with the application secret and return the plaintext only on the head-admin list and issue responses, over HTTPS. Never return the passcode from `verify`, `login`, or the class teacher dashboard.

Passcode rule: 4 to 6 digits. The form strips every non-digit and allows at most 6 characters. Reject anything else with `422`.

One active class teacher per `class_assigned`. Re-issuing the same `staff_id` updates that row (the portal replaces the matching row in the table). Issuing a new staff ID for a class that already has an active teacher returns `409`.

---

## 3. Endpoints the portal already calls

### 3.1 List issued credentials

`GET /api/v1/auth/class-teachers`

- Access: head administrator only (`SIMS_ADMIN` / head admin).
- The portal accepts a bare array, or an object with `credentials`, `class_teachers`, `data`, or `items`.

```json
[
  {
    "id": "uuid",
    "teacher_name": "Mr. Samuel Amponsah",
    "class_assigned": "Basic 4",
    "staff_id": "CT-2026-003",
    "passcode": "9988",
    "phone": "0249001100",
    "issued_at": "2026-10-01T09:30:00Z",
    "sms_status": "sent"
  }
]
```

`sms_status` must be one of `sent`, `failed`, `not_sent`. The register labels `failed` as “SMS failed”, `not_sent` as “Issued”, and anything else as “SMS Credentials Sent”.

### 3.2 Issue a credential

`POST /api/v1/auth/class-teachers`

- Access: head administrator only.
- Body the portal sends:

```json
{
  "teacher_name": "Mr. Samuel Amponsah",
  "class_assigned": "Basic 4",
  "staff_id": "CT-2026-003",
  "passcode": "9988",
  "phone": "0249001100",
  "send_sms": true
}
```

`send_sms` is `true` only when a phone number was typed. `phone` may be an empty string.

On success, return `201` with the saved record, either at the top level or under `credential` / `class_teacher`. Include `staff_id` and `passcode`. Set the matched user’s `teacher_designation` to `class_teacher` and `staff_code` to this staff ID. If no user has that staff ID yet, still save the credential; it attaches on the next login once that staff ID exists on the user.

When `send_sms` is true, send one SMS through SMSOnlineGH and set `sms_status` from the gateway result. Suggested text:

```
[RCIS] REMALJ Carewell: You are the class teacher for Basic 4.
Staff ID: CT-2026-003. Class teacher passcode: 9988.
Sign in at the staff portal with your email and password, then enter this passcode.
```

Format Ghana numbers to `233…` before the gateway call. If the SMS fails, still save the credential and return `sms_status: "failed"`. Do not roll back the issue.

### 3.3 Current-user class teacher status

`GET /api/v1/auth/class-teacher/me`

- Access: any authenticated teacher token, including one that has not verified the passcode yet.
- Match the token’s user to `class_teacher_credentials` by `user_id` or `staff_id`, and only when `is_active` is true.

```json
{
  "is_class_teacher": true,
  "staff_id": "CT-2026-003",
  "class_assigned": "Basic 4"
}
```

### 3.4 Verify the passcode

`POST /api/v1/auth/class-teacher/verify`

- Access: the teacher JWT from `POST /auth/login`.
- Body:

```json
{
  "staff_id": "CT-2026-003",
  "passcode": "9988"
}
```

`staff_id` may be omitted. When it is present it must match the credential linked to this user. Compare the passcode in constant time. On success return a **new** JWT with `passcode_verified: true` and `teacher_designation: "class_teacher"`:

```json
{
  "token": "<new-jwt>",
  "user": {
    "full_name": "Mr. Samuel Amponsah",
    "role": "teacher",
    "teacher_designation": "class_teacher",
    "staff_id": "CT-2026-003",
    "class_assigned": "Basic 4",
    "is_class_teacher": true
  }
}
```

On failure return `401`:

```json
{ "detail": "Invalid class teacher passcode." }
```

The portal prints `detail` on the passcode screen. Lock the credential after 5 failed attempts in 15 minutes and return `429` with a clear `detail`. Each failure should be acceptable to log; the portal also posts a security alert itself.

### 3.5 Direct staff-ID login (client method, not used by the screen)

`POST /api/v1/auth/class-teacher/login`

```json
{
  "staff_id": "CT-2026-003",
  "passcode": "9988",
  "portal": "teacher"
}
```

Same success body as verify, with `passcode_verified: true`. Same `401` / `429` failures. This does not replace email-and-password login.

### 3.6 Failed-passcode security alert

`POST /api/v1/auth/security-alerts`

The portal sends this when verify fails. Accept it from a teacher token:

```json
{
  "portal": "teacher",
  "target_account": "samuel.amponsah@remaljcarewell.edu.gh",
  "reason": "Invalid class teacher passcode.",
  "severity": "High",
  "status": "Unresolved",
  "device": "Mozilla/5.0"
}
```

Return `201`. Head admin reads these from the existing security-alert list.

### 3.7 Class teacher dashboard

`GET /api/v1/class-teachers/dashboard`

- Access: class teacher JWT with `passcode_verified: true`.
- Scope every list to `class_assigned` on that credential. A class teacher must not receive another class’s students.
- The staff portal calls this as soon as the class teacher home screen opens.

```json
{
  "teacher": {
    "full_name": "Mr. Samuel Amponsah",
    "staff_id": "CT-2026-003",
    "class_assigned": "Basic 4",
    "designation": "class_teacher"
  },
  "stats": {
    "total_students": 32,
    "classes_today": 6,
    "classes_remaining": 2,
    "assignments_due": 11,
    "assignments_ungraded": 3,
    "average_class_score": 78,
    "average_score_delta": 2.4
  },
  "students": [
    {
      "full_name": "Abena Mensah",
      "student_id": "REMALJ-2026-041",
      "email": "abena.mensah@remaljcarewell.edu.gh",
      "class_level": "Basic 4",
      "attendance_percent": 98,
      "math_grade": "A+",
      "science_grade": "A",
      "status": "Enrolled"
    }
  ],
  "activity": [
    {
      "text": "You graded 14 assignments for Basic 4 Mathematics.",
      "time": "10 mins ago",
      "tone": "success"
    }
  ],
  "subjects": [
    { "subject": "Mathematics", "percent": 78 }
  ],
  "transport": {
    "route_label": "Bus 01 – Route A",
    "students_on_board": 22,
    "capacity": 25,
    "next_stop": "Anikoko",
    "eta": "15:45",
    "progress_percent": 62,
    "stops_left": 3
  }
}
```

`tone` is `success`, `info`, `warning`, or `danger`. `average_score_delta` is the change versus the previous term and may be negative. `students` is the full class roster, not a page of five. If a class has no bus pupils, `transport` may be `null`.

`classes_today` and `classes_remaining` come from today’s timetable rows for `class_assigned`. `assignments_due` / `assignments_ungraded` come from assignments whose audience is that class. `average_class_score` is the mean of published subject totals for the class this term. `attendance_percent` is present-days divided by school days this term. `math_grade` and `science_grade` are the latest published grades for Mathematics and Science; use `"—"` when that subject has no published grade.

---

## 4. What a class teacher can open

| Screen | Class teacher | Subject teacher |
|---|---|---|
| Dashboard, score sheet, exam registration, assignments, grades, schedule, academic calendar, contacts, reports | Yes, scoped to the assigned class and the subjects they teach | Yes, scoped to their subjects |
| Students and attendance | Yes, assigned class only | No |
| Admissions register | Yes | No |
| Messages to parents, students, and drivers | Yes | No |
| Transport | Yes | No |
| Operations and governance | Yes | No |
| Portal settings | Yes | No |
| Issue or list class teacher passcodes | No | No |
| Payment vouchers, payroll, fee setup | No | No |

Head admin is the only role that may call `GET` and `POST /auth/class-teachers`.

---

## 5. Existing routes this role also hits

On every portal load the shared store calls these with the teacher JWT. A `403` is treated as an empty list, so allow `TEACHER` and return an empty array when the teacher should not see that record type. Filter class-specific rows to `class_assigned`.

| Method and path | Class teacher rule |
|---|---|
| `GET /students` | Only students whose level / class section is the assigned class |
| `GET /attendance` and `POST /attendance/roll-call` | Assigned class only. Reject a roll call for another class with `403` |
| `POST /attendance/scan`, `POST /attendance/notify-absent`, `POST /attendance/send-sms` | Assigned class only |
| `GET /academic/results` | Assigned class |
| `POST /sims/score-sheets/entry` | Allow. Keep status `Pending Approval`. Expanded body: four class tests each /100, `class_test_total` /400, `class_score` (converted /50), `exam_score` /100, `teacher_note`, `grade`, `remarks`. See `docs/SCORE_SHEET_BACKEND.md`. |
| `PUT /sims/score-sheets/entry/{id}` | Allow for the teacher's own saved sheet. Same body as create. Reset to Pending Approval. |
| `GET /sims/score-sheets/entries` | Assigned class / own subject. |
| `GET /academic/timetables` | Rows for the assigned class |
| `GET /academic/assignments` and `POST /academic/assignments` | Audience must be the assigned class on create |
| `GET /messages` and `POST /messages` | Inbox and sent items for this teacher. Create body uses `recipient_role`, `recipient_name`, `recipient_email`, `student_name`, `subject`, `body` |
| `GET /admissions/applications` | Read access for the class teacher. Do not allow them to change offer status |
| `GET /bus/routes` | Routes that carry pupils from the assigned class. `transport` on the dashboard can be derived from the same data |
| `GET /operations/incidents` and `POST /operations/incidents` | Class teacher may read and create. They may not delete |
| `GET /reports/requests` | Requests for pupils in the assigned class |
| `GET /sims/semester-registrations` and exam registration routes | Assigned class |
| `GET /finance/fees`, `GET /finance/payment-vouchers`, `GET /staff`, `GET /finance/bills` | Return `[]`. Do not 403 |

Subject teachers use the same teacher JWT before passcode verification. They must not receive class-teacher-only writes (roll call for a form class they do not own, admissions, operations create) unless they are the assigned class teacher with `passcode_verified: true`.

---

## 6. Errors

Use the FastAPI shape. The portal displays `detail` when it is a string.

| Situation | Status | `detail` |
|---|---|---|
| Missing or bad passcode | 401 | `Invalid class teacher passcode.` |
| Too many attempts | 429 | `Class teacher passcode locked. Ask the administrator to issue a new passcode.` |
| Teacher token without a verified passcode on a class-teacher route | 403 | `Class teacher passcode verification is required.` |
| Subject teacher or another class | 403 | `This class is assigned to another teacher.` |
| Staff ID already issued | 409 | `A class teacher credential already exists for this staff ID.` |
| Class already has an active form tutor | 409 | `Basic 4 already has an active class teacher.` |
| Passcode is not 4–6 digits | 422 | Standard validation error list |
| Head-admin route called by a teacher | 403 | `Only the head administrator can issue class teacher passcodes.` |

---

## 7. Acceptance checks

1. Head admin `POST /auth/class-teachers` saves the credential, returns `passcode` and `staff_id`, and sends SMS when `send_sms` is true.
2. Head admin `GET /auth/class-teachers` returns that row, including the passcode, after a fresh load.
3. A subject teacher `GET /auth/class-teacher/me` returns `is_class_teacher: false` with status 200.
4. The class teacher’s `POST /auth/login` user includes `requires_class_teacher_passcode: true` and `staff_id`.
5. Wrong passcode on `POST /auth/class-teacher/verify` returns 401 with the detail string above. The fifth failure in 15 minutes returns 429.
6. Correct passcode returns a new JWT with `passcode_verified: true` and `teacher_designation: class_teacher`. The response user has `class_assigned`.
7. `GET /class-teachers/dashboard` with that token returns only the assigned class. Another class’s student ID is absent.
8. The same dashboard call with the pre-passcode teacher token returns 403.
9. `GET /students` as that class teacher returns only the assigned class.
10. A teacher token cannot `GET` or `POST /auth/class-teachers`.
