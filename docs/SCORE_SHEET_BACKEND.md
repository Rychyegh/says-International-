# Score Sheet — Backend Implementation Brief

Send this file to the FastAPI backend developer. The teacher score sheet now stores the full class-test breakdown, a teacher comment, and later edits of the same student / subject / term / year.

| | |
|---|---|
| Base URL | `https://rcis-backend.onrender.com/api/v1` |
| Auth | `Authorization: Bearer <jwt>` |
| Frontend client | `src/services/api.js` (`saveScoreSheet`, `updateScoreSheet`, `getScoreSheetEntries`, `getResults`, `updateResultStatus`) |
| Screen | `src/components/ScoreSheet/ScoreSheetEntryForm.jsx` |
| Approval desk | Admin and Sub-Admin → Transcripts & Results |

Class scoring rule (must persist, not recompute on read unless the stored components are missing):

- Arrival test, Class test 1, Class test 2, Class test 3 are each marked **out of 100**.
- **Total class test = sum of those four, out of 400**.
- Convert to 50: `round((class_test_total / 400) * 50)`, capped at 50.
- Exam is out of 100, converted to 50 the same way.
- Terminal total = class converted + exam converted, out of 100.

Snake_case in requests. Accept snake_case or camelCase in responses.

---

## Integrated on the frontend (call these)

| Method and path | Status | What the portal does |
|---|---|---|
| `POST /sims/score-sheets/entry` | Integrated. **Contract expanded.** | Create a pending score sheet. Body now includes the four class tests, converted 50s, grade, remarks, and `teacher_note`. |
| `PUT /sims/score-sheets/entry/{id}` | **Wired. Not in the old spec. Implement this.** | Edit a previously saved sheet. Same body as create. Keep `Pending Approval` after an edit. |
| `GET /sims/score-sheets/entries` | **Wired. Not in the old spec. Implement this.** | Reload saved sheets so a teacher can reopen and edit. Optional query: `class_level`, `term`, `academic_year`, `subject`, `student_id`. |
| `GET /results` | Integrated | Approval desk and dashboard averages. Return the same breakdown fields when present. |
| `PATCH /results/{id}/status` | Integrated | `{ "status": "Approved" \| "Declined", "approved_by"?, "decline_note"? }` |

If `GET /sims/score-sheets/entries` is missing, the portal treats the 404 as an empty list and keeps using the local cache. Teachers will still lose edits after a hard refresh until this route exists.

---

## 1. Create — expand existing `POST /sims/score-sheets/entry`

Access: `TEACHER`, `CLASS_TEACHER`. Status on create: `Pending Approval`.

```json
{
  "entry_key": "remalj-2026-f4::mathematics::term 3::2025/2026",
  "academic_year": "2025/2026",
  "class_level": "Basic 1",
  "term": "Term 3",
  "subject": "Mathematics",
  "category": "Core",
  "instructor": "Mr. Samuel Amponsah",
  "exam_date": "2025-07-16",
  "class_test_max": 100,
  "class_test_total_max": 400,
  "exam_score_max": 100,
  "scores": [
    {
      "student_id": "uuid-or-numeric-id",
      "student_code": "REMALJ-2026-F4",
      "student_name": "Abena Mensah",
      "arrival_test": 80,
      "class_test_1": 75,
      "class_test_2": 70,
      "class_test_3": 65,
      "class_test_total": 290,
      "class_score": 36,
      "exam_score": 84,
      "exam_score_converted": 42,
      "total_score": 78,
      "grade": "2",
      "remarks": "Proficient",
      "teacher_note": "Strong in number work. Needs more practice on word problems."
    }
  ]
}
```

`class_score` is the class-test total converted to 50, not a raw 100 mark. `exam_score` is the raw exam /100. `total_score` is out of 100.

Treat `entry_key` as unique. If a row with that key already exists, upsert it (same as PUT) instead of inserting a duplicate.

Response `201`: `{ "id": "...", "status": "Pending Approval" }`. The portal stores `id` as `backendId` for later PUTs.

---

## 2. Update — `PUT /sims/score-sheets/entry/{id}`

Access: `TEACHER` who created the row, `CLASS_TEACHER` for their class, `ADMIN`, `SUB_ADMIN`.

Same body as create. After an edit, reset status to `Pending Approval` and clear `approved_by` / `decline_note`.

Response `200`: the updated record including `id`.

If `{id}` is unknown, `404 { "detail": "Score sheet not found" }`.

---

## 3. List — `GET /sims/score-sheets/entries`

Access: `TEACHER` (own class / own subject), `CLASS_TEACHER` (assigned class), `ADMIN`, `SUB_ADMIN`.

Query (all optional): `class_level`, `term`, `academic_year`, `subject`, `student_id`.

Response `200`: array. Each item may be a header plus nested `scores[]`, or a flattened row. The portal reads both.

Flattened example:

```json
[
  {
    "id": "ss-001",
    "entry_key": "remalj-2026-f4::mathematics::term 3::2025/2026",
    "academic_year": "2025/2026",
    "class_level": "Basic 1",
    "term": "Term 3",
    "subject": "Mathematics",
    "instructor": "Mr. Samuel Amponsah",
    "exam_date": "2025-07-16",
    "student_id": "uuid",
    "student_code": "REMALJ-2026-F4",
    "student_name": "Abena Mensah",
    "arrival_test": 80,
    "class_test_1": 75,
    "class_test_2": 70,
    "class_test_3": 65,
    "class_test_total": 290,
    "class_score": 36,
    "exam_score": 84,
    "exam_score_converted": 42,
    "total_score": 78,
    "grade": "2",
    "remarks": "Proficient",
    "teacher_note": "Strong in number work.",
    "status": "Pending Approval",
    "updated_at": "2026-10-01T11:40:00Z"
  }
]
```

---

## 4. Results used by the approval desk

`GET /results` should include the same component fields when the row came from a score sheet (`arrival_test`, `class_test_1`, `class_test_2`, `class_test_3`, `class_test_total`, `class_score`, `exam_score`, `teacher_note`). Missing fields are treated as 0 / empty on the client.

`PATCH /results/{id}/status`:

```json
{ "status": "Approved", "approved_by": "Sub-Admin" }
```

or

```json
{ "status": "Declined", "decline_note": "Recheck class test 2." }
```

Allow both Head Admin and Sub-Admin.

---

## 5. Suggested columns

```sql
ALTER TABLE score_sheets
  ADD COLUMN IF NOT EXISTS entry_key TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS instructor TEXT,
  ADD COLUMN IF NOT EXISTS exam_date DATE,
  ADD COLUMN IF NOT EXISTS class_test_max INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS class_test_total_max INTEGER DEFAULT 400,
  ADD COLUMN IF NOT EXISTS exam_score_max INTEGER DEFAULT 100;

ALTER TABLE score_sheet_items
  ADD COLUMN IF NOT EXISTS student_name TEXT,
  ADD COLUMN IF NOT EXISTS arrival_test NUMERIC(5,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS class_test_1 NUMERIC(5,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS class_test_2 NUMERIC(5,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS class_test_3 NUMERIC(5,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS class_test_total NUMERIC(6,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exam_score_converted NUMERIC(5,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_score NUMERIC(5,1) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS grade TEXT,
  ADD COLUMN IF NOT EXISTS remarks TEXT,
  ADD COLUMN IF NOT EXISTS teacher_note TEXT;
```

Validate each of the four class tests is 0–100 inclusive. Reject with `422` if any component is over its max.

---

## 6. Acceptance checks

1. Teacher saves Arrival 80, Tests 75 / 70 / 65, Exam 84. Stored `class_test_total` is 290, `class_score` 36, `exam_score_converted` 42, `total_score` 78.
2. Teacher reopens the same student / subject / term / year, changes Class test 2, saves again. One row exists. Status is `Pending Approval`. Admin and Sub-Admin both see it.
3. `GET /sims/score-sheets/entries` returns the teacher note and all four class tests.
4. `PUT` with a fake id returns 404, not 500.
5. Old clients that only send `class_score` and `exam_score` still work; missing components default to 0.
