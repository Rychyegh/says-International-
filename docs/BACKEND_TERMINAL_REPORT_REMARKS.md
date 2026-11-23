# Terminal report remark entry and approval

Date: 23 November 2026

## User locations

- Class Teacher Portal → Terminal Report Cards → choose period/class → Preview → Class teacher's report-card remark → Save remark.
- Head Admin → Academics → Assessment Reports → preview an individual/class report → Review report-card remarks. Select the learner when multiple reports are loaded. Review/approve the teacher remark, enter/save the headteacher remark, then approve it.

The preview and print boxes display approved remarks only. Drafts are shown in the editor with their status, separately from the official report. Subject-specific Score Sheet teacher_note remains independent.

## Existing deployed API schema

The public schema at `/api/v1/openapi.json` advertises these authenticated routes:

- `GET /api/v1/academic/report-setup`
- `PUT /api/v1/academic/terminal-report-remarks/{student_id}`
- `POST /api/v1/academic/terminal-report-remarks/{remark_id}/approve`

The client now uses those routes. The PUT schema is RemarkInput, with additional properties forbidden, student_id as a path UUID, and this body:

```json
{
  "academic_year": "2026/2027",
  "term": "Term 1",
  "class_level": "Kindergarten 2",
  "sub_class": "Kindergarten 2A",
  "kind": "teacher",
  "comment": "Good effort. Keep practising reading.",
  "reason": "Class teacher's end-of-term report remark",
  "expected_version": 0
}
```

Kind is teacher or head; comment requires 1–4000 characters; reason requires 1–2000; expected_version is a nonnegative integer. Version 0 is used for a first save, otherwise the latest saved version is sent. Approval uses `{"reason":"Approve end-of-term report remark","expected_version":1}`; its schema requires version >= 1.

## Read-back and persistence contract

The OpenAPI responses are untyped. The client expects the setup read to include `remarks` (or `terminal_report_remarks`) as an array, at root or under data. Each saved row must include id, student_id, academic_year, term, kind, comment, version and status. An example row:

```json
{
  "id":"22222222-2222-4222-8222-222222222222",
  "student_id":"11111111-1111-4111-8111-111111111111",
  "academic_year":"2026/2027",
  "term":"Term 1",
  "kind":"teacher",
  "comment":"Good effort. Keep practising reading.",
  "version":1,
  "status":"draft"
}
```

After PUT, the client reads setup again and confirms exact learner/period/kind/comment and an advanced integer version before reporting success. After approval, it confirms the same remark ID, approved status and an advanced version before updating the official boxes. Generic success alone is insufficient. Approved setup rows supplement the report preview even when the assessment-report endpoint uses the saved-score fallback. Drafts never replace the printed comments. No browser-local storage is used as remark persistence.

Backend must provide school-scoped reads and enforce class-teacher assignment on teacher writes, with headteacher-only head remarks and approvals. The frontend hides head controls from teachers and sub-admins, but server authorization is required. Keep a unique school/student/year/term/kind identity, retain approved versions/audit history, increment versions on writes/approval, and reject stale expected_version with HTTP 409 without changing the saved record. An edit to an approved remark requires another review; retain the last approved published comment until the replacement is approved.

If class teachers cannot read the remarks collection through report-setup, expose the same authorized metadata through a coordinated narrower endpoint and update the adapter. The UI reports a read error and does not pretend the remark was saved. Approval/save failures retain typed text for retry. JSON errors, missing metadata and stale versions remain visible failures.

## Verification

Local browser test `tests/terminal-report-remarks-integration.mjs` uses synthetic HTTP fixtures for teacher save, failed conflicting edit, headteacher save, both approvals, fresh teacher reload, and print visibility. The pure contract tests are in tests/terminal-report-remarks.test.mjs. All traffic in these tests is intercepted. No real school remarks were written and no backend migration/deployment was performed. Public route/schema availability was checked; live authenticated persistence and response shape still need verification after deployment.
