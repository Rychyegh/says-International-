# UAC teachers → staff directory → subject allocation

Date: 30 October 2026

## Expected workflow and implementation status

Create a Subject Teacher or Class Teacher account in UAC, including its allocated class. Its name, role and class appear automatically in Classes & Staff. The administrator selects that teacher and assigns subjects; they do not create a second staff record or re-enter the name/class.

The React client now supports class selection for both teacher roles, merges confirmed UAC accounts into the directory immediately and on refresh, and replaces Add New Teacher with Assign teacher subjects. Name and class are read-only in this subject assignment dialog. A new API integration below saves subjects by UAC user UUID. There is no backend server implementation in this repository: implement and deploy the contract below before considering the end-to-end workflow complete.

This supersedes the standalone teacher creation workflow in BACKEND_TEACHER_CREATION.md for UAC-created teachers. The old POST /staff API can remain for other staff operations. The frontend no longer makes a second POST /staff for teacher accounts after creating them through UAC.

## 1. Create a teacher account (existing POST /api/v1/users)

Use the existing account creation/authentication contract. Relevant fields:

```json
{
  "full_name": "Ama Mensah",
  "email": "ama@example.com",
  "role": "teacher",
  "teacher_designation": "class_teacher",
  "staff_code": "CT-2026-010",
  "main_class": "Basic 4",
  "class_assigned": "Basic 4"
}
```

Password and other required account fields still follow the existing endpoint schema. A subject teacher uses `role: "teacher"` without `teacher_designation: "class_teacher"` and sends its selected class in `class_assigned`. The UI requires a class for both teacher roles. Validate an actual school catalog class, tenant membership and create-user permission. Preserve the class for subject teachers; do not discard it because they are not class teachers.

Within one database transaction create the account and either link/create a staff profile by `user_id`, or make the staff directory query include teacher user accounts directly. Enforce a unique `(school_id, user_id)` staff link; do not match by name. Existing staff IDs/email may be used only in a controlled migration to establish the canonical user_id link. No second frontend staff creation request should be necessary.

Return HTTP 201 with the real database user UUID, canonical name, role, teacher_designation, staff ID and class fields in the top-level user object, `user`, `data`, or `data.user`. Do not return a generated client ID or generic success without the saved ID. Commit before returning. Account creation and linkage must roll back together on error.

## 2. Directory loading (existing endpoints)

`GET /api/v1/users` must include authorized teacher accounts immediately after creation, including those with no subjects. Supported containers: array, `users`, `data` array, `data.users`. Include `id`, full_name, role, teacher_designation, staff_id, class_assigned/assigned_class/main_class, subject or department, status/is_active and email.

`GET /api/v1/staff` should expose the same linked teachers with distinct staff `id`, `user_id`, staff_id, full_name, role/designation, class_assigned, department/subject and status. Use stable IDs to prevent duplicate rows. The client also merges users when the staff endpoint fails or is empty. This fallback does not replace backend consistency.

`GET /api/v1/academic/teaching-assignments` must include teachers with classes but no subjects, and subsequently reflect saved subjects. Return identity keys, teacher name, role, classes array and subjects array. Empty subject arrays mean subjects have not yet been allocated.

## 3. Save subjects for an existing UAC teacher (new integration)

`PUT /api/v1/academic/teachers/{user_id}/subjects`

Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`.

```json
{"subjects":["Mathematics","English"]}
```

This replaces the teacher's subject list. The dialog requires at least one subject. Deduplicate and validate all subjects against the school catalog. This is an idempotent replacement: submitting the same list twice must not create duplicate assignments.

The server resolves the teacher's name and classes from its UAC account by UUID. Do not accept a client name/class override on this endpoint. Validate that the user belongs to the current school, has a supported teacher role/designation, is active and has an allocated class. Restrict writes to the authorized academic administrator/head admin role. Reject another school's teacher as not found.

Save all subject links and synchronize linked staff.department/user.subject aliases in a single transaction. Preserve the teacher's class and name. Use authoritative UAC classes; the frontend sends only subjects. If subjects apply to multiple existing classes, preserve that class set and expose it in the response. Use normalized assignment rows with unique teacher/class/subject keys rather than silently truncating comma-separated text.

Return HTTP 200 only after commit:

```json
{
  "assignment": {
    "user_id": "1da99952-580b-4f99-8861-56050e1dc352",
    "staff_record_id": "920d2467-b402-4788-b409-e260797030dd",
    "staff_id": "CT-2026-010",
    "teacher_name": "Ama Mensah",
    "role": "Class Teacher",
    "classes": ["Basic 4"],
    "subjects": ["Mathematics","English"]
  }
}
```

The client requires the same `user_id` and both arrays before showing success. It uses the returned classes and subjects to update the assignment table and directory. GET users/staff/assignments must return the same persisted allocation after refresh and a new login.

Errors: 401 unauthenticated; 403 forbidden; 404 missing/foreign-school user; 409 inactive teacher or missing allocated class; 422 invalid subject/role/request. Return a readable JSON `detail` or `message`. Never leave partially updated aliases on failure.

## Existing data migration

Backfill linked staff rows for previously created teacher accounts, preserve names/classes from UAC, merge duplicate linked profiles using stable IDs, and retain existing subject assignments. Populate missing subject-teacher class fields from verified account data; do not assign a default class. Teachers with missing classes remain visible and must be corrected in UAC before allocating subjects.

## Acceptance checks

1. Create a subject teacher with class Basic 4 in UAC. Open Classes & Staff: exactly one row shows its name and Basic 4 without manual staff creation.
2. Repeat with a class teacher. Both appear in Assign teacher subjects even with no subjects assigned.
3. Select teacher A and choose subjects, then select teacher B: B's own saved subjects/class replace A's selections.
4. Save two subjects; refresh and sign in again. Directory, assignment table and teacher portal agree; name/class remain unchanged.
5. Repeated saves do not duplicate allocations. Invalid subject/forbidden/foreign-school writes do not mutate records.
6. A failed staff list request still allows authorized teacher users to populate the client directory; report actual source errors appropriately.
7. An account creation response without a database UUID cannot produce a successful credential slip. No duplicate POST /staff follows a teacher account creation.
