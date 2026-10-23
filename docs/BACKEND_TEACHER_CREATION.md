# Backend handoff: create teacher with subject and class

Date: 23 October 2026

## Frontend integration already present

Head Admin opens Classes & Staff → Add New Teacher (below Add New Class and Add Non-teaching Staff). The popup collects name, optional staff ID and phone, teacher role, subject and allocated class.

Saving calls `addStaffMember` → `api.createStaff` → `POST /api/v1/staff`, with the bearer token. This is a real HTTP request, not a local-only save. The UI now requires a returned record ID before reporting success. Backend implementation and database persistence have not been verified in this task.

## Existing request contract

Example for a subject teacher; actual class and subject values come from the school catalog:

```json
{
  "full_name": "Ama Mensah",
  "name": "Ama Mensah",
  "staff_code": "TCH-2026-010",
  "staff_id": "TCH-2026-010",
  "designation": "Subject Teacher",
  "role": "Subject Teacher",
  "department": "Mathematics",
  "class_assigned": "Basic 4",
  "phone": "0240000000",
  "status": "Active",
  "is_active": true
}
```

`department` currently carries the selected teaching subject. For Class Teacher, role and designation are `Class Teacher`, with `teacher_designation: "class_teacher"` and `is_class_teacher: true`. Empty optional profile values are omitted. Staff ID fields may be empty/omitted when auto-generation is requested. Keep aliases compatible with the existing frontend, or coordinate an adapter change before rejecting them.

## Required backend behavior

- Implement/verify POST `/api/v1/staff` and GET `/api/v1/staff`. Enforce Head Admin authorization for teacher creation and allocation on the server.
- Validate a nonblank name, supported teaching role, real class and subject from the catalog, and unique staff code. Generate a unique code when none is supplied.
- Save the teacher and selected subject/class assignment in one database transaction. Link assignments using stable database IDs; preserve the staff profile fields used by existing clients.
- Commit before returning success. Return HTTP 201 with the saved record, not a generic success flag. Roll back all changes on validation or database failure.
- Return the teacher in GET `/staff` after a refresh and new authenticated session. Include database UUID, staff code, role, department/subject, class assignment, phone and status.
- Return readable JSON errors: 401 unauthenticated, 403 unauthorized, 409 duplicate staff code, 422 validation failure. Do not return HTML or success for failed persistence.
- Prevent duplicate records on retries; add an agreed idempotency contract before claiming retry-safe creation. The current frontend creation request does not send an idempotency key.

Recommended compatible response:

```json
{
  "staff": {
    "id": "97facbfe-6f72-4685-b6dc-734771b11a39",
    "staff_id": "TCH-2026-010",
    "full_name": "Ama Mensah",
    "role": "Subject Teacher",
    "department": "Mathematics",
    "class_assigned": "Basic 4",
    "phone": "0240000000",
    "status": "Active"
  }
}
```

## Existing assignment editing integration

The separate teaching allocation screen currently calls PUT `/api/v1/users/{userId}` with subject, class_assigned and assigned_class for linked user records, and PATCH `/api/v1/staff/{staffRecordId}` with department and class_assigned for staff records. GET `/api/v1/academic/teaching-assignments` is also referenced by the frontend. Keep directory, assignment read APIs and linked user profiles consistent. If replacing this with a dedicated assignment endpoint, coordinate the frontend change and atomic synchronization rather than leaving partial writes.

Creating a staff profile does not by itself establish a teacher login. Any login provisioning must use the existing authorized account flow and explicitly link the new user to the staff UUID.

## Acceptance checks

1. Head Admin creates a teacher with a subject and class; one committed teacher and its assignment exist in the database.
2. Reload and sign in again: teacher, subject and class remain visible.
3. Invalid class/subject, duplicate code and unauthorized creation are rejected without partial records.
4. Database failure shows an error and does not add a successful teacher in the UI.
5. Both Subject Teacher and Class Teacher work; existing non-teaching staff creation remains compatible.
6. Subsequent assignment edits survive refresh and are reflected by relevant teacher/class directory APIs.
