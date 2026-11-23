# Class teacher terminal reports: backend and database contract

Date: 11 November 2026

## Frontend delivered

Class Teacher → Reports and Terminal Report Cards now open the same report viewer based on the supplied video: department/sub-unit, assigned class, subclass, academic year, term and Preview Creche Reports filters; Preview; previous/next student; Print this report and Print all reports (or save as PDF). The report includes student identity, academic period, score summary, subject code, class/exam scores, total, grade, comments, teacher/head remarks and a subject performance chart.

The screen reads `GET /api/v1/academic/assessment-reports`, already referenced by the administrator assessment screens. No backend server or migrations for this workflow are present in this repository. The presence of the local SQLite file does not establish that the deployed report API has the required schema or data. Live backend/database support remains unverified. Implement or extend the contract below.

## Request

Authenticated bearer token; query fields:

```json
{
  "report_type": "individual_year_group",
  "department": "Lower Primary",
  "class_level": "Basic 2",
  "sub_class": "Basic 2B",
  "academic_year": "2025/2026",
  "term": "Term 3",
  "preview_creche": "false"
}
```

`class_level`, `academic_year`, `term`, and `report_type` are required. Empty department/sub_class means all authorized matching units/sections. Resolve catalog values and reject unknown values with HTTP 422. Do not infer the requested period from today's date. The frontend exposes assigned classes only, but the server MUST independently enforce class-teacher permission, school membership and authoritative class/subclass assignment on every request. A subject-teaching assignment alone must not grant form-class report access. Return 403 for out-of-scope classes, even if the caller edits the query manually.

Extend the existing individual_year_group contract to allow an omitted `student_id`: return one report per authorized learner in the selected class/year group. If student_id is supplied by the existing admin screen, preserve individual selection behavior. Do not mix records from other terms or sections. Return learners in stable order for previous/next navigation.

`preview_creche=true` requests the approved Creche report schema for authorized Creche learners. Reject incompatible class/template selections clearly. For the current viewer, return developmental assessments as subject-labelled rows using the same nullable score/grade/remark fields; do not manufacture numeric scores for qualitative ratings. Richer developmental scales require a separately coordinated renderer/schema change.

## Response

Return HTTP 200 with `reports` at root or under `data`. Every report must have a real database student_id and a rows array. Missing values must be null, not fabricated zeroes. Empty reports means no approved reports exist for this exact scope.

```json
{
  "reports": [{
    "student_id": "database-student-uuid",
    "student_code": "RCIS-0001",
    "student_name": "Test Learner",
    "class_level": "Basic 2",
    "sub_class": "Basic 2B",
    "date_of_birth": "2018-01-01",
    "class_position": 4,
    "resumption_date": "2027-01-12",
    "summary": {
      "subject_count": 1,
      "total_score": 82,
      "highest_score": 95,
      "lowest_score": 42,
      "average_score": 82,
      "grade": "1"
    },
    "rows": [{
      "subject_code": "MATH",
      "subject": "Mathematics",
      "class_score": 40,
      "exam_score": 42,
      "total": 82,
      "grade": "1",
      "remark": "High proficiency"
    }],
    "teacher_comment": "Good progress.",
    "head_comment": "Keep it up."
  }]
}
```

Example values illustrate the schema only. Generate actual scores and grades from approved persisted assessments and the school's configured weights/grading bands. Return weighted class/exam contributions; never reapply the weights to already weighted marks. Preserve zero versus missing. `highest_score` and `lowest_score` are the highest and lowest student average within the authorized class/subclass and period, on the same scale as `average_score`; class_position uses that cohort with a documented tie policy. Return null when a figure cannot be calculated. Do not compute class ranks from a partial paginated roster.

## Database work

Reuse existing tables where possible; inspect deployed schema before writing migrations:

- School, department, class and subclass catalogs with canonical IDs and display names.
- User/class-teacher assignments scoped by school, class/subclass and effective academic period.
- Student identity and historical enrollments by academic year, class/subclass. Old reports must retain the historical class rather than today's placement.
- Academic years/terms and calendar resumption dates.
- Subject catalog codes, versioned grading bands and assessment weights.
- Approved assessment rows keyed by school, learner, academic year, term and subject. Enforce a unique assessment identity and persist approval state, approver and version.
- Terminal report remarks keyed by learner and period, including teacher/head comments, authorized author, timestamps and approval state. The new viewer reads saved remarks; it does not pretend to save comments locally.

Use foreign keys, school-scoped authorization and indexes matching the school/year/term/class/subclass query and learner/period/subject lookup. Build reports from a consistent approved snapshot so totals and rows cannot reflect different revisions. Published reports should retain the grade/weight versions used when approved. Audit report access without exposing learner data in general request logs.

## Deployment and checks

1. Migrate/backfill real class-teacher assignments, enrollments, catalog IDs and period links without guessing missing scores or comments.
2. Implement class-teacher authorization on the existing API while retaining the admin report modes.
3. Verify Basic 2A and Basic 2B remain isolated, historical years resolve correctly, and direct requests for another teacher's class return 403.
4. Verify score 0 displays as 0; absent scores remain blank/dashes; unapproved results do not appear. Confirm cohort rank and weighting against known approved records.
5. Verify previous/next, empty reports, server errors, and changing filters clears the previous report. Print this report must include only the displayed student. Print all reports must include every returned student in order, with each report starting on a new page. Return the complete selected group, not just the first page of students; do not silently paginate this response.
6. Verify Creche qualitative rows without invented numeric scores. Test server refusal of incompatible template selections.
7. Refresh and sign in again to prove report scores/comments come from persisted data. Check the final printed page against the reference using a designated test learner.

No live report data, backend migrations, or database persistence were verified by this frontend change.

## 18 November 2026 integration repair

The class viewer now uses `report_type=class` for group previews. A section label such as `Nursery 1A` is sent as class_level `Nursery 1` plus sub_class `Nursery 1A`, matching score-sheet storage. Section-specific assignments cannot be overridden with another subclass in this viewer. Loaded school period settings update the default filters until the user selects their own values.

If the aggregate report endpoint returns an empty report list or HTTP 404/405/422, the client reads fresh persisted `/results` and `/sims/score-sheets` records for the selected period/class. It builds a preview only from explicit Approved/Published records matched by stable learner identity to the supplied roster, exact year/term and class/subclass. Pending, declined, unknown learners and other periods/sections are excluded. HTTP 401/403, network and server failures remain errors; the alternate sources never bypass a denied report request. Qualitative/Creche templates still require backend support.

Ensure teacher read permissions and scope filtering are consistent on all three endpoints. The API must return full requested class records, or implement a coordinated pagination contract; the client must not advertise incomplete cohort ranks. Converted scores and totals come from server records and are not weighted again. Missing head comments, class positions and highest/lowest cohort figures remain blank when the aggregate report is unavailable; these require persisted server report data.

Administration assessment popups now use dropdowns populated from configured/current academic settings, catalog classes/subjects, roster and saved result periods. Changing the class clears the selected student. No invented historical years are inserted. The popup and teacher report cards include the shared school logo/name/address/contact header.

Local browser regression: two test learners submit scores through the real store action and mocked HTTP contract; an admin publishes the sheets; a fresh teacher store reads the published records; previews, school branding, navigation and printing are checked. All HTTP traffic in this regression is intercepted. This proves client behavior, not deployment or live database correctness. No real learner scores or live approvals are created by the regression.

## Multiple assigned classes

Grades previously displayed the static school-wide class catalogue under “classes taught”; that display was not evidence of a saved assignment. Teacher Portal now resolves all assignment rows by user/staff ID or email, combines their classes with saved account/directory classes, and supplies the same list to Grades and Terminal Report Cards. Report rosters cover all resolved assigned classes, rather than only the primary form class. Section assignments exclude sibling sections. A teacher with saved Basic 1A and Nursery 1A assignments can select and preview each; unrelated catalogue classes are not added automatically.

Backend `/academic/teaching-assignments` records must include the canonical teacher `user_id` (or matching staff ID/email), plus their full classes array. Multiple rows per teacher are supported. Matching by display name alone is not used to grant class visibility. Persist all intended class assignments and enforce them server-side on results and roster endpoints.

The roster adapter now preserves `sub_class`, `sub_class_level`, `class_section` and camelCase section aliases instead of dropping the section and inserting an assumed A. This is needed for section-specific report filtering when the backend sends a base class plus a separate subclass. A section must be explicitly recorded; unknown sections are not assigned automatically.

## 23 November 2026 Kindergarten alias regression

Frontend class identities now canonicalize KG 1/KG 2 and their section aliases to Kindergarten 1/Kindergarten 2 across score entry, assigned rosters and terminal report filtering. A/B sections remain distinct. New score submissions use the canonical full label; persisted legacy KG records are recognized when returned by the server. The score-entry year/term defaults follow loaded school settings until manually selected, avoiding stale initial defaults.

Backend queries should resolve both aliases to the same catalog class ID, including historical records, rather than filtering exact display text. The isolated browser regression submits marks through the actual score-entry UI for Kindergarten 2A, checks that pending results remain hidden, approves through the store's admin operation, then opens a fresh teacher session and previews the approved 82/100 report with school branding. Every API call in that test is intercepted; no live marks, backend migrations or deployment were performed. The captured demonstration is output/kindergarten-2-test-report.png and is labelled as an isolated test run.

## Grades table and summary cards

The results list and score-sheet list now share assessment normalization so persisted `total_score`, zero marks, converted exam/class contributions and raw-score aliases are preserved. The Grades screen follows loaded academic settings until the user selects a period, and recognizes equivalent term/year spellings. Numeric cards are calculated from the displayed learner rows: entered count includes partial saved marks; class/exam averages each use their available component marks; total average and highest score use recorded complete totals. Missing values never become zero. Existing converted exam scores are not weighted a second time. Approved legacy totals remain displayable when individual component marks are absent; those components remain missing.

Local browser regression tests/grades-scores-integration.mjs verifies eight synthetic learners, 3/8 entered records, a complete 40 + 42 = 82 record, a saved zero, a partial class score, and correct summary calculations. Screenshot: output/kindergarten-grades-test.png. No live school scores were changed.
