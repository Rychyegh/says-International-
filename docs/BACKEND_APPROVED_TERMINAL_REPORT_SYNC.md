# Backend handoff: approved scores missing from terminal reports

Date: 23 October 2026

## Reported problem

Teachers submit results and Head Admin receives them for approval. The class teacher's terminal report remains empty, including for Aaron Amoah (displayed student code `REMALJ-2026-093CD33C`, Basic 8). Live root cause is not yet confirmed. Do not infer successful synchronization from a frontend build or approval button alone.

## Frontend behavior implemented locally

- Opening Terminal Report Cards refreshes backend records. Successful Head Admin approval also triggers a refresh in that session.
- The existing provider refreshes on window focus and every 30 seconds; this is polling, not guaranteed immediate cross-session delivery.
- Terminal report rows and averages select status `Approved` or `Published`, case-insensitively. Pending, declined and class-only drafts must not be treated as approved final results.
- Records match by student identifiers; saved exam marks are required, with zero a valid recorded mark. Missing flags must not hide an actual recorded exam; an explicit false flag still means incomplete.
- Empty reports show API errors and loaded/matched record counts in the latest frontend version. Deploy that version to use the diagnostics.

## Existing API paths to verify

All paths below are relative to `/api/v1` and require the authenticated bearer session.

1. GET `/results` supplies legacy learner results. Its current frontend adapter expects an array.
2. GET `/sims/score-sheets` supplies assessment sheets. Current accepted list shapes are an array or a top-level scores, sheets, entries, items or data array. If returning summary sheets without learner rows, each must have a sheet ID usable by the detail endpoint.
3. GET `/sims/score-sheets/{sheet_id}` must return the sheet with its learner `scores` array, directly or under sheet/score_sheet/data.
4. Verify the existing publish/status-update endpoints used by `api.publishScoreSheet` and `api.updateResultStatus`; do not introduce a new approval route without coordinating the frontend adapter.

## Required persistence and identity contract

- Approval must commit the status of the same saved assessment record and retain its student linkage and marks. Return success only after the transaction commits.
- Keep sheet UUID, learner-score UUID, and student UUID distinct. A sheet identifier must never substitute for a student or score identifier.
- Return `student_id` as the actual student database UUID, and preferably `student_code` as the school display code. Ensure the class roster exposes the matching canonical UUID and code. Do not join children by names or infer IDs from class membership.
- Return the subject, class/subclass, academic_year, term and authoritative approval status for every learner row. Detail and list projections must agree; a stale child-row status must not conceal a published sheet.
- Preserve zero values. Use null for marks not yet recorded; do not serialize missing marks as zero.
- Return score-format metadata and unambiguous raw versus converted marks. Current score-sheet adapter supports raw_class_score, raw_exam_score, class_score, exam_score_converted, total_score, grade, remarks, has_class_score and has_exam_score. When exam marks are complete, has_exam_score must be true. Never return false alongside a completed published exam.
- Do not reweight converted marks in another layer. Total, grade and grading policy must come from the approved school settings.
- Ensure legacy and score-sheet APIs do not produce conflicting duplicate records for one learner/subject/year/term. Agree stable identity/version fields for updates.

## Permissions and synchronization

Head Admin may approve authorized school records. Class teachers must be able to read all approved subject results for learners in their assigned class, including scores entered by another subject teacher. Do not limit class report reads to records created by the requesting teacher. Enforce school/class assignment boundaries server-side; do not expose all school results as a workaround.

Invalidate result caches after approval. A subsequent authenticated class-teacher read must return the committed approved state; no new login should be required. Unapproved drafts remain excluded from official output. Teacher and Head Admin sessions must agree on the same canonical assessment IDs and status.

## Evidence needed to resolve the current failure

Using authorized test sessions, collect sanitized responses for the affected learner from the roster, result list, sheet list, relevant sheet detail and approval response. Record HTTP status and request ID. Compare student UUID/code, sheet/score IDs, marks, has_exam_score, subject, year/term and approval status before and after approval. Never include passwords or bearer tokens in the handoff.

If GET returns 403, inspect class-teacher read permissions. If it returns an empty array, inspect assignment and publication filters. If it returns summary sheets, verify detail includes scores. If rows exist but matching count is zero, compare student identifiers. If matching rows exist but exam count is zero, inspect marks and completeness flags.

## Acceptance test

1. Choose one assigned learner and one subject, year and term. Save complete class/exam marks using the teacher session.
2. Confirm Head Admin sees the same stored score UUID, then approve it. Verify the database commit and published/approved state.
3. In a separate class-teacher session, open Terminal Report Cards. Within the next successful refresh, the learner's subject, total, grade and remarks must appear and agree with the approved record.
4. Reload and sign in again: results must persist. Repeat for a learner whose display code differs from their UUID and for a zero exam mark.
5. Confirm pending/declined drafts are excluded and another class's teacher cannot read the record.
6. Simulate an API failure: show an actionable load error rather than claiming that the student has no results.
7. Verify all approved subjects for the selected learner and reporting period. The current terminal report UI does not yet enforce an explicit year/term selection; coordinate period scoping before claiming correct multi-term reporting.

## Release status

Local frontend build and focused approved-status filtering test pass. No authorized live score/approval/read verification has been completed here. Backend deployment and database state remain to be checked by the backend owner. Deploy the latest frontend and perform the cross-session acceptance test before declaring the issue resolved.
