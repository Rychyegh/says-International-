# Shared examination subject catalogue

## Current frontend wiring

Exam registration already uses the backend, not just browser storage:

- Add Subject calls `POST /api/v1/academic/catalog/subjects` with `{"name":"Creative Arts"}`.
- Portal data refresh calls `GET /api/v1/academic/catalog/subjects`.
- The shared RegisterForExamsForm consumes the same store in Head Admin, Sub Admin, teacher academic views and the accountant registration view wherever enabled. Authorization must be enforced by the backend, not by component visibility.
- Browser-local subject-pool storage is not a cross-device database. The shared catalogue must be the persistent source of truth.

The frontend now accepts arrays and subjects/items/results/data response wrappers, including nested data and subject_name fields. Previously, a subjects wrapper or subject_name could be ignored. This is a possible frontend cause, not a confirmed diagnosis of the deployed backend.

## Required backend behavior

Persist subjects in a school-scoped shared catalogue. Do not scope them to the creating user's ID, device, browser session or a single class. Obtain school scope from the authenticated session. Use UUID primary keys, trimmed names, case-insensitive unique names within the school, active status, creator and timestamps.

POST must commit the database transaction before returning 201 with the saved record. GET must return all active subjects visible to the user's school, including records created by other authorized staff. Handle duplicate names without creating duplicates. Return actionable 401/403/422 errors rather than success for failed writes. Never expose one school's subjects to another.

Example GET response:

```json
{"subjects":[{"id":"saved-subject-uuid","name":"Creative Arts","is_active":true}]}
```

Permit authorized Head Admin and Sub Admin roles to create subjects. Define explicitly whether teachers/accountants may also create or only read. Every role allowed to register candidates must be able to read the same school catalogue. Use private/no-store response caching or invalidate authenticated catalogue caches on writes; never serve an old per-user list indefinitely.

Exam registration records must separately persist selected subjects together with student UUID, academic year and term, and return those selections when registrations are loaded on another device. Adding a catalogue subject must not register every student automatically.

## Cross-device acceptance test

1. On device A, add a uniquely named subject and confirm POST returns a committed saved record.
2. On device B, sign in as another authorized user in the same school and refresh. GET must include that subject.
3. Confirm it appears in individual and bulk registration in every enabled portal.
4. Reload device A and repeat after signing out/in. The subject must remain.
5. Register a candidate with that subject; confirm the registration and admit pass on device B preserve it.
6. Confirm another school cannot read or modify the subject, and unauthorized creation returns 403.

If the subject is absent from GET after a successful POST, investigate backend persistence, school/user filtering and caching. If GET includes it but the screen does not, investigate frontend response normalization and refresh. The live API/database has not been verified by this code change.
