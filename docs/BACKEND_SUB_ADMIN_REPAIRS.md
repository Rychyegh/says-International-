# Sub Admin backend integration handoff

Date: 26 October 2026. Paths below are relative to `/api/v1`.

## Delivery status

Frontend repairs are implemented locally. Production deployment, server implementation and live two-device verification are not confirmed. The fee-template endpoints below are a **new proposed contract**, not a claim that those endpoints already exist. Do not mark the integration complete based on the frontend build or a success toast.

### Frontend repairs

- Sub Admin cannot mount User Access Control through its normal name or stored navigation aliases. The restriction banner covers the aliases too.
- Student updates propagate API errors instead of silently changing local state. Updates require a returned student record matching the saved UUID and use returned student data for the local projection.
- Subclasses are added to local class mappings only after the catalogue POST succeeds. Failures are shown by the existing calling form.
- Academic summaries no longer substitute 82.5% or 3.75 GPA, label everyone Verified, or truncate to the first 50 students. Missing data remains missing; real zero values are retained.
- Pending-result/pre-audit shortcuts direct users to the real Transcripts & Results approval board. Creche shortcuts explicitly explain that the dedicated preschool workflow is required; they no longer masquerade as functioning evaluation forms.
- Unsupported card PIN entry is removed. Card saving is labelled as UID association, not physical RFID writing.
- The fee schedule now has explicit Load saved templates / Save templates to database controls. Drafts remain clearly labelled browser-local until saved. Loading replaces drafts only after confirmation and a validated response. Version conflicts require reloading, not automatic overwrites.

## 1. Authorization — mandatory on the server

Read identity, school and role from the authenticated session. Never trust client adminRole, localStorage, route names, school IDs or hidden buttons as authorization.

Sub Admin may use the school's authorized roster, admissions, catalogues, academic settings, examinations, attendance and delegated billing/template operations. User administration, credential management, financial approval/disbursement and security administration must return 403 unless explicitly permitted by the existing server role policy. UI restrictions are not a substitute for endpoint checks.

Verify same-school scoping for every object UUID and list endpoint. Return 401 for missing/invalid authentication and 403 for insufficient role. Do not return success envelopes for rejected writes.

## 2. Student updates and cards — existing endpoint

`PUT /students/{student_uuid}` must commit changes and return the complete persisted student:

```json
{"student":{"id":"student-uuid","full_name":"Saved student name","class_level":"Basic 2","class_section":"Basic 2A","status":"Active","is_active":true,"rfid_card_code":"saved-uid","daily_limit":"50.00"}}
```

Accepted wrappers are a direct record, student, data, or data.student. A bare success flag is not sufficient confirmation. The response must carry the canonical UUID matching the requested student. Define accepted camelCase/snake_case aliases or reject unsupported inputs clearly; do not silently discard them. The general edit handler currently supplies paired aliases for compatibility. Status/promotion supplies status, is_active, class_level, class_section and change_reason.

Preserve student identity, historical scores and payments on promotion/inactivation. Persist status, section, UID, parent pickup association and daily limit as appropriate. Enforce school-scoped UID uniqueness. Validate amounts on the server. Return field errors without modifying any data on validation failure.

The frontend now fails closed on errors or mismatched identities. A network timeout or malformed success response may still follow a committed update: instruct users to reload before retrying. Never claim a failed confirmation proves that no write happened.

Card PIN management is not implemented by this form. Do not store plaintext PINs or imply UID association securely encodes a card. Physical NFC/RFID programming needs an independently specified device integration. Student and admissions card-field consistency should be maintained server-side in one transaction rather than relying on best-effort frontend cascades.

## 3. Class/subclass/subject catalogue — existing endpoints

`GET/POST /academic/catalog/classes`, `/academic/catalog/subclasses`, `/academic/catalog/subjects`.

Subclass POST currently sends:

```json
{"name":"Basic 2C","className":"Basic 2","classLevel":"Basic 2"}
```

Subject POST sends `{"name":"Creative Arts"}`. Persist shared school catalogue records, not per-device or creator-only preferences. Validate the parent class; normalize names; enforce case-insensitive uniqueness within school/parent. Return committed records with UUID and parent relationship. GET must include new records on every authorized device and return their class mapping.

The frontend accepts array/subjects/classes/items/results/data list wrappers. GET subclass records must expose parent mapping compatible with className/classLevel/class_name/class_level and name/subclass fields used by the current store. Test against the actual deployed frontend mapping. Do not return an unbounded first page while hiding saved items on later pages; define list pagination consistently.

Detailed subject requirements: `BACKEND_EXAM_SUBJECT_SYNC.md`.

## 4. Shared fee templates — NEW endpoints to implement

### GET /finance/fee-templates?academicYear=2026%2F2027&academicTerm=Term+1

Return exactly one school/academic-period snapshot. The school scope is derived from the session. For a new period, return an initialized snapshot with version 0, not a success with an empty body. The initial feeSchedule may be an empty object and stationerySchedule an empty array; initialization policy must not silently fabricate invoices.

```json
{
  "academicYear":"2026/2027",
  "academicTerm":"Term 1",
  "version":0,
  "feeSchedule":{
    "Basic 2A":{
      "baseBill":[{"id":"tuition","details":"Tuition","amount":100}],
      "optionalBills":[]
    }
  },
  "stationerySchedule":[]
}
```

A data wrapper is also accepted. All feeSchedule values must contain baseBill and optionalBills arrays. Preserve the additional template fields emitted by the existing frontend; do not discard item IDs, selection/account metadata or class configuration. The illustrative line item above is not an exhaustive line-item schema: inspect the submitted template and agree on nested field validation before release.

### PUT /finance/fee-templates

Accept academicYear, academicTerm, feeSchedule, stationerySchedule and expectedVersion. Commit the full template snapshot atomically, increment version and return the complete saved snapshot in the GET shape. The response period must match the request. Do not use this endpoint to post invoices, alter issued invoices, receive payments or update student balances.

Validate finite nonnegative amounts, permitted account references, item identifiers and class references before committing. Use fixed-precision monetary storage. Enforce a unique school/year/term snapshot and atomic compare-and-swap: stale expectedVersion returns 409 or 412 without updating anything. Concurrent saves must not silently overwrite each other. Audit actor, timestamp, previous version and changes.

The frontend does not automatically upload old browser templates or claim a local draft is shared. Load replaces drafts with confirmation; Save is enabled only after a valid version has loaded. An unavailable endpoint displays a visible limitation and leaves drafts local. Existing browser-local template cache remains a draft convenience, not the authoritative shared database.

Per-student draft adjustments are not part of this class template snapshot. Persist individual issued invoices through existing student-billing endpoints, scoped to student UUID/year/term, without mutating the class template or siblings' invoices.

## 5. Grading settings — existing endpoint

GET `/academic/settings` must return full settings including numeric version and gradingBands. PUT receives expectedVersion from the settings loaded before editing. Compare atomically, increment version and return saved settings. Preserve omitted resumptionDate/vacationDate. Reject invalid provided dates, missing/overlapping bands and stale versions with actionable errors.

All nine grades, boundaries and remarks must become the shared school scale. Use this authoritative scale for backend result calculations; return the grading version used. Decide explicitly how previously approved historical reports are handled: do not silently rewrite signed historical records. If the business rule requires current-scale display of existing scores, ensure all projections use the same scale and invalidate caches consistently.

Details: `BACKEND_GRADING_OPTIONAL_DATES.md`, `BACKEND_SCHOOL_GRADING.md`.

## 6. Results, reporting and teacher decline notifications

Maintain a canonical student UUID + subject UUID + year + term association. Score sheets, result moderation, transcripts and terminal report projections must refer to the same persisted assessment. Only approved complete records appear in official transcripts/reports. An approved zero remains a score, not missing data.

Publish/decline must enforce authorized roles and version checks. On decline, persist the note, author identity and teacher-targeted notification atomically, or use a transactional outbox. Return notification identity so the frontend does not create a second message. Message delivery failure must not discard the persisted note or misreport a pending/declined result as approved.

The legacy Creche shortcuts are now explicitly blocked from pretending to work. Implement and authorize the dedicated preschool report APIs and preschool-head approval workflow separately. Do not substitute numeric academic reports for Gold/Silver/Bronze/Not assessed/Absent evaluations.

Related handoffs: `BACKEND_RESULT_DECLINE_NOTIFICATIONS.md`, `BACKEND_APPROVED_TERMINAL_REPORT_SYNC.md`, `BACKEND_PRESCHOOL_PORTAL.md`.

## 7. Live acceptance checklist

Use designated test records, preferably staging. Obtain approval before sending real SMS, changing real academic approval decisions, or posting bills/payments.

- Sub Admin cannot list/manage users or approve/disburse PVs through direct endpoint calls; server returns 403.
- Force a student or subclass save to return 422/500. The UI shows failure; a fresh GET and second device show no falsely successful local record.
- Save a valid student update; response UUID matches; GET and device B retain the saved values. Card PIN controls are absent and physical encoding is not claimed.
- Add a class/subclass/subject on device A; reload device B in the same school and verify the shared catalogue. Another school cannot access it.
- GET fee templates, edit and PUT; verify version increments and device B sees them. Stale PUT returns 409 without changes. Existing invoices and balances remain unchanged. Individual billing must not affect other students.
- Save grading with no hidden dates and a valid expectedVersion; GET/device B reflect the bands. Stale updates fail safely and edits remain available for review.
- Verify real zero/missing scores and more than 50 students in approved-result summaries. No fabricated GPA, percentage or Verified label appears.
- Pending-result shortcuts open actual approval workflow; preschool shortcuts explain the dedicated workflow instead of showing a generic fake evaluation.
- Approve and decline controlled test assessments, verify report/transcript alignment and persisted teacher notification.

## Local validation

Focused regression tests cover fee-template response validation, matching saved student identities, Sub Admin UAC rendering, removed report/PIN fallbacks and subclass save ordering. A frontend production build is also required. These are not substitutes for the live acceptance checklist. The audit's two existing payment-allocation feature-gate test failures must be handled independently; do not enable production financial features solely to make tests pass.
