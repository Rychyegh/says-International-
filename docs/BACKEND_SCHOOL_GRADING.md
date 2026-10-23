# REMALJ grading policy - 23 October 2026

## Sub-Admin ownership and save contract

The grading editor is now available in Sub-Admin → Academic Settings (grading-only view); Head Admin retains Academic Settings access. Teacher Grades and Terminal Report Cards no longer expose grading configuration. Enforce permissions server-side: permit fully verified head_admin and sub_admin to update grading policy, deny teacher/class_teacher/preschool_teacher/student/parent/accountant writes. Read the authenticated role, never a role supplied in the body.

Existing frontend uses GET and PUT `/api/v1/academic/settings`. PUT sends `gradingSystem`, `gradingBands` (nine `{min,max,grade,remarks}` objects), and existing academicYear, academicTerm, classTestWeight, examWeight, resumptionDate and vacationDate. Grading-only mode hides those unrelated fields and must preserve their saved values. Prefer a dedicated versioned grading-policy update/patch contract in a coordinated revision to avoid stale full-settings writes. Until then enforce optimistic concurrency or reject conflicts; Sub-Admin grading changes must not alter unrelated settings.

Persist the policy transactionally and return `{ "settings": { ...canonical saved settings including gradingBands, gradingSystem, academicYear, academicTerm } }` only after commit. Validate exactly nine bands, unique numeric grade strings 1–9, nonempty remarks, integer boundaries covering 0–100 without gaps/overlaps, and range order. Return readable JSON 403/409/422 errors. Do not acknowledge a save while discarding the bands.

All authenticated clients must read the same persisted school policy after refresh and in new sessions/devices. Apply it server-side when saving/publishing results and generating report data. Frontend display uses the loaded policy, with the supplied school scale as a fallback; a build alone is not proof of database persistence. Add policy revision and audit actor/time/before/after. Historical approved results require an explicit audited regrade, not silent overwrites.

Acceptance: log in as Sub-Admin, edit a remark/range, save, inspect the database and GET response, refresh and sign in on another device; verify score entry, approval, terminal cards, transcripts and exports use that same policy. Confirm teacher writes fail with 403 and unrelated academic settings stay unchanged. Backend save/deployment and cross-device behavior remain unverified in this frontend task.

Apply this school-requested nine-point scale to final weighted totals out of 100:

| Marks | Grade | Remarks |
| --- | --- | --- |
| 80–100 | 1 | Highly Proficient |
| 75–79 | 2 | Proficient |
| 65–74 | 3 | Approaching Proficient |
| 60–64 | 4 | Developing |
| 55–59 | 5 | Emerging |
| 50–54 | 6 | Average |
| 40–49 | 7 | Pass |
| 36–39 | 8 | Weak |
| 0–35 | 9 | Fail |

Use lower thresholds for decimal scores: 79.99 is grade 2; 80 is grade 1. Validate finite totals in 0–100. Do not round across a threshold unless a separate approved rounding policy is agreed. Missing exams must remain incomplete, not grade 9; an explicitly recorded zero is grade 9.

Frontend schoolGrading.js defines min/max/grade/remarks bands; PUT /api/v1/academic/settings now submits them as gradingBands with gradingSystem `REMALJ 9-Point Proficiency Scale`. Verify the deployed schema accepts this shape and persists it. The score sheet shows an explicitly unsaved preview; saved official grades/remarks still come from the server. Recompute on save/publication using the persisted policy, and return consistent grade/remarks in results, sheet detail and terminal report APIs. Version and audit the policy. Agree an audited regrade of existing approved results rather than silently rewriting historical grades. Preschool G/S/B/X/O and Creche remarks are separate templates and must not use this scale.
