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
