# Edit saved student bills — Sub Admin, Head Admin and Accountant

## Status and frontend entry points

Frontend integration is implemented. This repository contains the React API client and a local database file, but no backend application or migration runner. No production backend/database change has been applied. Implement the contract below in the deployed finance backend.

- Sub Admin / Head Admin: Official Fee Schedule → **Edit saved bills** → select a student's saved bill.
- Accountant: Student Billing & Printing → select a student's saved bill.
- The editor supports changing item descriptions and amounts, adding compulsory/optional items, and removing items. A reason is required. It reloads saved bills after a confirmed save.
- Editing targets one persisted invoice UUID. It must not create a second bill or overwrite a class template or another student's bill.
- This contract supersedes the optional-only editing restriction in BACKEND_PORTAL_REPAIRS_2026-10-30.md. Existing optional-only backend validation must be updated before these expanded edits work.

## Read saved bills

`GET /api/v1/finance/fees`

Return all authorized invoices, including unpaid, partially paid and paid bills. Include:

```json
{
  "id":"invoice-uuid",
  "version":3,
  "student_id":"student-uuid",
  "student_name":"Ama Mensah",
  "class_level":"Basic 4",
  "academic_year":"2026/2027",
  "term":"Term 1",
  "items_breakdown":[
    {"id":"line-uuid","details":"Tuition","amount":1000,"is_optional":false,"account_id":"account-uuid"}
  ],
  "arrears_brought_forward":0,
  "scholarship_discount":0,
  "billed_amount":1000,
  "paid_amount":200,
  "balance":800
}
```

Use stable database IDs and the saved invoice snapshot, never the current shared class schedule. Return numeric `version` (the client also accepts `invoice_version`). Bills without a version are visible but cannot be revised safely. Include inactive/closed students' historical bills when the authenticated role is authorized to see them.

## Replace saved invoice items

`PUT /api/v1/finance/fees/{invoice_id}/items`

Headers: bearer authorization, JSON content type and `Idempotency-Key: <UUID>`.

```json
{
  "expected_version":3,
  "reason":"Correct tuition and remove transport at guardian request",
  "items":[
    {"id":"line-uuid","details":"Tuition","amount":950,"is_optional":false,"account_id":"account-uuid"},
    {"details":"Feeding","amount":300,"is_optional":true}
  ]
}
```

The request is the complete revised charged item set. Omitted existing lines are removed. Retain recognized extra item metadata, including account mappings; validate it server-side. Resolve mappings for new lines from the school fee catalog. If a mapping is ambiguous, return 422 with an actionable error; do not post into an arbitrary account. Descriptions alone must not determine ownership or select an unrelated line. Version, payments, student, class and reporting period cannot be overridden by item data.

Authorize `sub_admin`, `head_admin`, `accountant` (and existing `super_admin`) on the server. Sub Admin may reopen/edit bills they prepared within their school and delegated class scope; Head Admin and Accountant may edit school invoices within their existing finance scope. Use the stored creator's user UUID for ownership, not a supplied posted_by string. Reject all unauthorized roles and cross-school IDs. The UI role check is only presentation.

Validate at least one line, nonblank descriptions and reason, finite nonnegative decimal amounts, unique existing line IDs belonging to this invoice, valid accounts and boolean optional flags. Both compulsory and optional lines may be changed or removed. This endpoint edits item charges, not payments, historical receipts, arrears or scholarship discounts.

### Transaction and accounting rules

1. Lock the invoice and compare `expected_version`. Return 409 for stale versions with no changes.
2. Lock/check the scoped idempotency record. Same key and same payload returns the original committed result; same key/different payload returns 409. Never duplicate financial entries on retry.
3. Save a before/after revision audit record with actor UUID, timestamp, reason, invoice and prior/new version.
4. Replace the invoice item snapshot and compute billed amount from revised charged lines plus preserved arrears minus preserved scholarship discount using decimal currency arithmetic.
5. Preserve all payments and allocations. Recompute outstanding balance. Reject a revision below paid amount unless the backend has an explicit auditable unapplied-credit/refund workflow; return a readable 422 instead of losing payments.
6. For already posted bills, append balanced adjustment/reversal journals for charge differences. Never rewrite historical journals. Account changes may require adjustments even if the total is unchanged. Draft bills update the draft snapshot without creating posted journals.
7. Increment version and commit invoice, item records, audit, journal adjustments and idempotency result atomically. Return only after commit.

Response HTTP 200:

```json
{
  "invoice":{
    "id":"invoice-uuid",
    "version":4,
    "items_breakdown":[
      {"id":"line-uuid","details":"Tuition","amount":950,"is_optional":false,"account_id":"account-uuid"},
      {"id":"new-line-uuid","details":"Feeding","amount":300,"is_optional":true,"account_id":"feeding-account-uuid"}
    ],
    "billed_amount":1250,
    "paid_amount":200,
    "balance":1050
  }
}
```

The client requires matching invoice ID and an increased version before reporting success, then reloads GET /finance/fees. All portals and bulk/individual printouts must read this revised snapshot.

Errors: JSON detail/message with 401 unauthenticated, 403 unauthorized, 404 missing/foreign invoice, 409 stale revision/idempotency mismatch, 422 validation/accounting conflict. Database failures must roll back all mutations.

## Database migration requirements

Adapt names to the actual finance schema; do not create a parallel invoice system.

- Add nonnull integer invoice version (backfill existing invoices to 1).
- Persist creator user UUID and school UUID; backfill creator from trusted audit data. Do not grant Sub Admin ownership to unknown legacy creators by default.
- Persist immutable per-revision line snapshots or versioned item rows, with decimal monetary columns and account foreign keys.
- Add invoice revision history with invoice FK, school FK, actor FK, old/new version, before/after JSON, reason and UTC timestamp. Unique `(invoice_id, new_version)`.
- Add/extend idempotency storage keyed by school, actor, operation/invoice and key; store payload hash and committed response. Serialize duplicate concurrent requests.
- Link accounting adjustment journals to invoice and revision. Apply unique revision/journal guards as appropriate.
- Enforce tenant/role/creator predicates on server queries and database policies if used. Keep existing receipt/payment foreign keys intact.

## Acceptance checks

1. Sub Admin prepares a bill, reloads, opens Edit saved bills, changes a compulsory amount and optional item, saves, reloads again: edits persist on that same invoice.
2. Head Admin and Accountant can reopen authorized bills through their respective screens and save revisions.
3. Unrelated classmates' bills and class fee templates remain unchanged.
4. Existing payment/receipt values remain intact; revised balance and general ledger agree. Below-paid revisions are handled by the defined credit policy or rejected atomically.
5. Two editors use the same version: only one commits. A lost-response retry with the same key cannot double post.
6. Invalid roles, out-of-scope Sub Admin, forged line IDs and cross-school invoices cannot be read or changed.
7. Individual bill, bulk print, student/parent bill and ledger all use the updated saved snapshot after refresh.

## Compulsory-first billing procedure (latest requirement)

This section takes precedence over any earlier behavior that charges optional services on initial posting.

1. Preparing/posting a new student bill charges **compulsory fees only**. This applies to individual, class and bulk posting through both `/finance/bills/post` and `/finance/bills/student`. Optional catalog offerings, enabled flags and advertised amounts are not charges or consent.
2. The server must validate fee classification from the school catalog, not just frontend flags or description keywords. Reject initial requests containing optional charges with 422 and a readable instruction to add services later. Preserve the compulsory item snapshot and original balance.
3. When a guardian requests bus, feeding or another optional service later, an authorized Sub Admin, Head Admin or Accountant opens **Edit saved bills**, selects that student's existing invoice, adds the requested optional line and a reason, and saves. Use the versioned `PUT /finance/fees/{invoice_id}/items` contract above, not another initial bill posting.
4. That revision appends the appropriate balanced ledger debit/revenue entry for the added service, recalculates invoice total and balance and preserves compulsory charges, arrears, discounts and existing payments. It affects only that invoice/student. No class-wide selection, template enabled flag or another child's choice may charge classmates.
5. Persist optional request evidence in the revision audit (actor, timestamp, reason and selected service). Catalog offerings may be displayed separately with `selected:false` but must never be included in billed_amount, balance, payment allocation or ledger debits until this explicit saved revision commits.
6. Example: tuition GHS 1,000 posts a GHS 1,000 bill. With GHS 200 paid, balance is GHS 800. Adding requested bus GHS 300 later makes billed GHS 1,300 and balance GHS 1,100; the extra ledger charge is exactly GHS 300. Repeating the same revision key must not add another GHS 300.
7. Historical optional charges are not automatically removed. Reconcile incorrect historical charges through auditable revisions/reversals after confirming the student's actual selection.

Additional acceptance: test initial single and bulk posting with an enabled bus template; neither may charge bus. Add bus to student A later; A's invoice and ledger increase once, while student B's invoice and the shared template remain unchanged.

Frontend enforcement: initial posting screens now send compulsory lines only. The initial API adapters reject explicitly optional lines as a further guard. Optional-service buttons open the saved invoice workflow. Backend catalog validation and ledger transactions remain required; the frontend cannot implement or verify those database operations by itself.

## Accounts with no invoice breakdown

A fees response containing student account summaries with zero totals is not evidence of a prepared invoice. Distinguish account records from saved invoices. Return original line snapshots and numeric invoice versions for editable invoices, including zero-value invoices if legitimately saved. For billed records missing snapshots, backfill from actual invoice source data; never reconstruct history from today's class schedule. Return `stationery_package_breakdown` consistently with the student bill posting contract (the frontend now reads this alias). Accounts with no posted compulsory invoice must enter the initial preparation flow rather than the revision endpoint.

### Deployed revision schema compatibility

The deployed revision endpoint rejects `items[*].service_id` as an extra input. The frontend now omits `service_id` and its camelCase alias from revision requests while preserving line IDs, account mappings, descriptions, optional classification and amounts. These service identifiers may still appear in read responses. Do not replay arbitrary response metadata into the write schema. Resolve service/account mappings on the server using accepted invoice line data.
