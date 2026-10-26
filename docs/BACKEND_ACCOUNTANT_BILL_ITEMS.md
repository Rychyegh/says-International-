# Accountant bill item preview

Accounts → Student Billing & Printing uses GET `/api/v1/finance/fees`. Clicking a student now opens their saved bill. Individual previews and printed statements use the same item breakdown.

The response must include the posted bill items, not only aggregate billed/paid/balance amounts. Return one identifiable invoice per row with `id`, `bill_id`, `student_id`, `student_name`, `class_level`, `academic_year`, `term`, `billed_amount`, `paid_amount`, `balance`, `arrears_brought_forward`, `scholarship_discount` and the original item snapshot:

```json
{
  "items_breakdown": [
    {"details": "Tuition", "amount": 1000, "is_optional": false},
    {"details": "Exercise books", "amount": 200, "is_optional": false},
    {"details": "Bus service", "amount": 300, "is_optional": true}
  ]
}
```

The frontend also accepts `items`, `lines`, `line_items`, or `bill_items`. Where bills were stored using split fields, it reads `tuition_fee`, `stationery_breakdown` (or `stationery_fee` if no breakdown exists), and `optional_services`. Prefer the full original line-item snapshot so individual compulsory items are not collapsed into a tuition total. Include all item names, amounts, and explicit optional classification as posted by Head Admin or Super Admin.

Persist the snapshot when an admin posts the bill. Reuse it for Accounts, student/parent bills and printing. Do not reconstruct historical bills using the current fee template: it may have changed. Reconcile item totals plus arrears minus discounts against billed_amount. Paid amounts and balances must remain authoritative. Do not invent item values from an aggregate total. Existing bills should be backfilled from their saved source records where available.

The frontend changes do not verify live backend support. This repository has the API client but no implementation of the finance server. If the deployed fees endpoint omits item details, its implementation must be updated with this contract.

Verify: post a bill containing several compulsory and optional items as admin; sign in as accountant; click the student; compare every item and amount with the original bill; refresh and repeat; print and compare; confirm a fully paid bill retains its original items. Enforce school/account permissions on all returned invoices.


## Optional items: display versus ledger charges

All optional offerings must remain visible on the saved bill with their prices. Only items explicitly selected for that student/posting contribute to ledger debits, total_payable and balance. A template's enabled/available flag is not student consent to a charge. The frontend posting screen now starts optional selections empty and uses explicit selections for the posting amount; its bill preview lists unselected options as “Optional — not charged”.

The backend must persist a separate optional-offering snapshot for display, with an explicit `selected` boolean per offering, alongside the charged invoice items. Extend the posting and read contracts together to save and return that snapshot; the current posting API transmits charged items only. Do not add the entire optional catalogue to `optional_services` if that field automatically posts ledger charges. Enforce the selection rule in both individual and batch posting. Return display-only optional entries separately from charged lines; preserve the original rates and selection state after refresh. This backend extension remains required for unselected options to appear on saved accountant bills after reload.

Historical optional charges must be reconciled from actual selections using auditable reversals where necessary; changing the frontend must not silently rewrite posted ledger balances.
