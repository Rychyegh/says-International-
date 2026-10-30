# Portal repairs: backend API handoff

Base path: `/api/v1`. All requests use `Authorization: Bearer <token>`. This repository contains a React client, not the deployed backend. New contracts below are integrated in the frontend but require backend implementation and deployment. Do not report successful persistence until the transaction commits. Return JSON errors (401, 403, 404, 409 conflict, 422 validation); do not return HTML or generic success for failed writes. Apply school/tenant scoping to every lookup.

## 1. Accounts: revise optional items on an existing invoice (new)

Accounts → Student Billing & Printing → select a student bill → Edit saved bill items.

`GET /finance/fees` must return immutable invoice UUID `id`, numeric `version`, student identity, class, academic year, term, saved item snapshot, billed/paid/balance amounts, arrears and scholarship discount. The client accepts `invoice_version` as a version alias. Missing version disables saving revisions.

`PUT /finance/fees/{invoice_id}/items`

Headers: bearer token, JSON content type, `Idempotency-Key: <UUID>`. Retrying the same unchanged draft reuses its key.

```json
{
  "expected_version": 4,
  "reason": "Parent cancelled transport",
  "items": [
    {"id":"tuition-line", "details":"Tuition", "amount":1000, "is_optional":false},
    {"details":"Feeding", "amount":450, "is_optional":true}
  ]
}
```

The full charged item list replaces the previous snapshot. Omission of an optional item removes that charge. Only accountant, head admin and super admin with invoice privileges may revise. Validate compulsory items against the original snapshot (cannot alter/remove through this operation), allowed optional items, nonnegative finite monetary values and a nonblank reason. Use decimal currency arithmetic. Resolve item IDs against this invoice, never another student or class template.

Lock invoice and compare version; stale requests return 409 without changes. In one transaction save revised items, an audit record and balanced debit/credit adjustment entries, increment version, and recalculate billed amount and balance including existing arrears/discounts/payments. Do not discard payments. Reject revisions below the paid amount unless the backend supports explicit unapplied credit handling. Never mutate sibling invoices, the fee template, or historical journals. Idempotency keys must be scoped to tenant and endpoint; same key/different payload returns 409.

Return 200 with `{"invoice":{"id":"invoice-uuid","version":5,"items_breakdown":[],"billed_amount":1450,"paid_amount":0,"balance":1450}}` using the actual complete updated item snapshot. The frontend then reloads `GET /finance/fees`; it does not fabricate updated balances locally.

## 2. General ledger: payment source and printing

Existing `GET /finance/accounting/accounts/{account_id}/ledger?from=YYYY-MM-DD&to=YYYY-MM-DD` (see accounting client for configured base path) returns opening_balance, closing_balance and lines. Each line should include reference, student_id, student_name, payer_name, date, debit, credit, amount, running_balance and `payment_method` (`cash`, `momo`, `bank`, `scholarship`). For scholarship entries also return `source_type: "scholarship"`; do not infer method from reference text. Nonpayment journal entries may omit method. Preserve receipt/journal reference alongside source.

The frontend combines reference and payment_method (or source_type) for display and CSV. Print / Save as PDF uses the loaded account/date scope and browser print dialog; no PDF endpoint is required. Account/date changes invalidate the old report. Return readable account names in the accounts list.

## 3. Teacher creation and allocation (existing endpoint, extended payload)

`POST /staff` retains the existing profile fields described in [BACKEND_TEACHER_CREATION.md](BACKEND_TEACHER_CREATION.md). The frontend additionally sends normalized allocations:

```json
{
  "full_name":"Ama Mensah",
  "name":"Ama Mensah",
  "role":"Subject Teacher",
  "designation":"Subject Teacher",
  "department":"Mathematics, English",
  "class_assigned":"Basic 4",
  "teaching_assignments":[
    {"subject":"Mathematics","class_level":"Basic 4"},
    {"subject":"English","class_level":"Basic 4"}
  ],
  "status":"Active",
  "is_active":true
}
```

Validate catalog entries and role permissions. Persist staff and all allocations atomically; generate a staff code if omitted. Return 201 with `staff` containing the saved UUID and profile; expose the allocations through `GET /staff` and `GET /academic/teaching-assignments`. Keep existing department/class aliases compatible. Creating a staff record does not automatically create a login. Allocation updates must keep linked directories consistent.

## 4. Bulk bills: invoice isolation

Bulk printing now uses each student's saved invoices for the resolved academic period. Students without a posted invoice use the shared class schedule with optional services unselected. An individual draft must never become another student's print data. Backend GET /finance/fees must return distinct invoice IDs, student IDs, periods and original item snapshots. Do not reconstruct all class invoices from the most recently created bill. Ensure posting a bill cannot update another student's snapshot. Return numeric version for revisions.

## 5. Assessment report previews (new)

`GET /academic/assessment-reports`

Query parameters:

| Field | Requirement |
| --- | --- |
| report_type | `individual`, `individual_year_group`, `class`, `subject`, `consolidated` |
| academic_year | Required, e.g. `2026/2027` |
| term | Required, e.g. `Term 1` |
| class_level | Required catalog class |
| student_id | Required for individual modes, database UUID from roster |
| subject | Required for subject mode; optional otherwise |

The seven assessment report buttons in Administration → Academics now use this endpoint. Print and preview variants share the same data; the user previews before printing. `individual_year_group` scopes the selected student's terminal report to the selected academic year/class; class mode returns one terminal report per student; subject mode returns student rows grouped in reports with the actual subject and student identity; consolidated mode returns all subjects for each student in scope.

Example 200 response:

```json
{
  "reports":[{
    "student_id":"student-uuid",
    "student_name":"Ama Mensah",
    "class_level":"Basic 4",
    "rows":[{
      "subject":"Mathematics",
      "class_score":35,
      "exam_score":50,
      "total":85,
      "grade":"A",
      "remark":"Excellent"
    }],
    "teacher_comment":"Good progress",
    "head_comment":"Keep it up"
  }]
}
```

Return only approved/published records for the requested period. Calculate totals and grades using the school's saved grading scheme; never synthesize marks or approve pending records during a read. For subject mode include each student's name/ID in its report object. Return `{"reports":[]}` for a valid empty selection. Restrict by academic/admin permissions, tenant and roster membership. Frontend displays backend errors and enables printing only after a valid nonempty response.

## Deployment acceptance

1. Accountant adds/removes an optional item, refreshes and signs in again: saved items, ledger adjustment and balance agree; another student's bill is unchanged. Stale revisions and duplicate retries cannot double post.
2. Select cash, MoMo, bank and scholarship entries in a ledger; verify reference labels, CSV and Print / Save as PDF match the account/date scope.
3. Head admin creates a teacher with two subjects and a class; refresh directories and assignments. Invalid catalog values leave no partial teacher.
4. Create different bills for two classmates, then bulk print: each page matches its individual saved invoice, including optional charges and discounts.
5. Test all seven assessment actions across two years/terms with distinct marks; only requested approved records appear. Empty/failed responses cannot print stale results.
