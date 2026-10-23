# Preschool teacher portal: backend contract

23 October 2026. Frontend implementation is present locally; the API endpoints below are proposed and have not been verified live. Do not claim database availability until deployed integration tests pass.

## Credentials and access

Head Admin selects Pre-school Teacher in User Access Control and issues credentials using the existing POST `/api/v1/users` account flow (verify the deployed account route). Store role `preschool_teacher` and the assigned preschool class. Existing account adapter sends main_class, assigned_class/class-level aliases: accept the established adapter contract and return canonical class IDs. Account provisioning must require a fully verified Head Admin session and audit who created it. Never allow public preschool registration or user-selected privilege escalation.

Teachers sign in at `/teacher`. The frontend verifies GET `/api/v1/auth/me`, requires user.id, role preschool_teacher and completed verification, then opens the dedicated preschool portal. The backend must support this role in authentication and enforce class-scoped access on every endpoint. Login credentials come from Head Admin, not a local browser account. Staff profile creation and login provisioning remain distinct.

## Template

Reference: supplied NaCCA KG2 Learner Report Form, 2025. Template identifier `kg2-2025`. The interface paraphrases its 24 skill descriptions in five areas: language/literacy (7), numeracy (4), creative arts (2), OWOP (5), social-emotional learning (6). Skill keys are area index.skill index, for example `1.1` through `1.7`, `2.1` through `2.4`, `3.1` through `3.2`, `4.1` through `4.5`, `5.1` through `5.6`.

Ratings: G Gold, S Silver, B Bronze, X not assessed/introduced, O absent. No numeric scores, GPA or invented proficiency conversion. Backend should store versioned skill definitions and canonical descriptions. The supplied template is KG2 only; do not apply it automatically to creche, nursery or KG1. Return report_template only for learners eligible for this template.

## Learners

GET `/api/v1/preschool/learners` returns `{ "items": [{ "id": "student-uuid", "full_name": "Learner name", "class_name": "KG2", "report_template": "kg2-2025" }] }` for assigned learners only. Return a valid empty list for an unassigned teacher; 403 for unauthorized roles. Never return a schoolwide roster to an unassigned teacher.

## Save report

POST `/api/v1/preschool/reports` accepts:

```json
{
  "student_id": "student-uuid",
  "template": "kg2-2025",
  "academic_year": "2026/2027",
  "term": "1",
  "school_days": 65,
  "days_present": 60,
  "assessments": {
    "1.1": {"rating": "G", "comment": "Participates confidently"}
  },
  "general_comments": "Progress and areas needing support",
  "vacation_date": "2026-12-18",
  "reopening_date": "2027-01-11",
  "progression": "Continue to next term"
}
```

The example omits other skills for brevity; current frontend requires all 24 ratings before saving. Validate exact known keys and rating enums; nonnegative integer attendance with days_present <= school_days; valid term/year and dates; learner eligibility, assignment ownership and school scope. Derive days absent rather than accepting contradictory totals. Save atomically and return `{ "report": { "id": "report-uuid", "status": "draft" } }` only after commit. Enforce a unique learner/year/term/template identity to prevent duplicate reports; agree versioned edits before enabling overwrite. Return JSON 401/403/409/422 errors. Never return success without a saved report ID.

## Remaining workflow to implement together

The current frontend creates and confirms saved reports; it does not yet load/edit saved reports, submit for approval, approve or print an official report. Agree GET report/detail and versioned update endpoints, submission/Head Admin approval/rejection endpoints, class-scoped history, and an approved report PDF endpoint before adding those controls.

Final PDF must include school and learner biodata (age, class, sex, class size), guardian contacts and address, attendance, all skill ratings/comments, general comments, teacher and head teacher names and authorized signature references, vacation/reopening dates and progression. Resolve canonical personal data server-side. Do not invent signatures or declare a draft official. Approved PDF should follow the supplied multi-page form rather than a numeric transcript. Publication to linked parents must enforce guardian relationships.

## Release checks

Verify Head Admin create credentials → teacher login → assigned KG2 roster → all ratings and comments saved → database refresh persistence. Test unauthorized teacher, another class learner ID, malformed ratings, attendance overflow and duplicate submissions. Verify role revocation invalidates access. Deploy backend role/schema/endpoints before advertising live availability. No live credentials or backend migration have been verified in this frontend task.
