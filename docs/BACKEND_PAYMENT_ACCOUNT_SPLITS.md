# Backend handoff: multiple accounts on one student payment

Date: 23 October 2026

## User workflow

Receive Payments lets the cashier use **Add account** repeatedly to distribute one payment across existing accounts. Each row selects an account and an amount. All rows belong to one payment and one receipt.

Example: GHS 1,000 received, GHS 100 school fees, GHS 200 bus, and GHS 700 allocated to another appropriate account. The first two rows alone leave GHS 700 unallocated and cannot be submitted. Add account adds a payment allocation row; it does not create an account in the chart of accounts.

## Current frontend and compatibility

The frontend already validates positive amounts with at most two decimals and requires allocation totals to equal the received amount. It now has a prominent Add account button and a remaining amount indicator.

Current endpoint: `POST /api/v1/finance/fees/{feeId}/pay`.

The current request sends `paidAmount`, `paymentMethod`, `paymentDate`, `transactionRef`, `notes`, and `idempotencyKey`, plus an `Idempotency-Key` header. Structured allocations are deliberately NOT sent because the existing request schema rejects extra fields. The breakdown is included in notes, for example:

```text
Payment account breakdown:
School Fees [ACCOUNT_CODE]: GHS 100.00
Bus [ACCOUNT_CODE]: GHS 200.00
Other appropriate account [ACCOUNT_CODE]: GHS 700.00
```

Notes preserve receipt information but do not establish separate account ledger postings. Do not treat this as completed backend accounting support.

## Required backend extension

Extend the existing payment request to accept an optional structured `allocations` array. Coordinate frontend activation after backend deployment. Proposed additional field (codes below are placeholders, use actual chart codes):

```json
{
  "allocations": [
    {"accountCode": "FEES_CODE", "accountName": "School Fees", "amount": 100},
    {"accountCode": "BUS_CODE", "accountName": "Bus", "amount": 200},
    {"accountCode": "OTHER_CODE", "accountName": "Other appropriate account", "amount": 700}
  ]
}
```

- Validate authorization, invoice ownership, open accounting period, account existence and posting eligibility on the server. Resolve names from the chart; do not trust submitted names.
- Validate amounts using decimal arithmetic or integer pesewas, with positive values, at most two decimal places, and an exact sum matching paidAmount. Reject incomplete allocations with 422 and a readable JSON detail.
- Preserve existing invoice-balance and overpayment rules. Current UI selects one invoice; splitting accounts must not silently settle other invoices or bill categories. If bus and fees require distinct invoice settlement, agree a separate multi-invoice contract before implementation.
- Persist payment, allocation rows, receipt and balanced journal entries atomically. Debit the selected cash/bank clearing account once; credit eligible destination accounts according to the approved accounting mapping. Roll back everything if any row fails.
- Enforce idempotency across the entire payment and allocation payload: same key and same payload returns the original result; changed payload with the same key returns 409. Concurrent retries must never create duplicate payments or journals.
- Return stored allocations with stable account identifiers/codes, canonical names and amounts in payment confirmation, payment history and receipt APIs, alongside the existing receipt number and updated invoice balance. Keep existing response fields compatible.
- Retain allocations for audit and reverse them atomically with payment reversals. Never rebuild financial postings by parsing free-text notes.
- Keep legacy requests without allocations supported until frontend rollout is complete; document their existing account mapping explicitly.

## Acceptance checks

1. GHS 1,000 split 100 + 200 + 700 saves once, prints one receipt with all rows, and updates the invoice once.
2. 100 + 200 against 1,000 is rejected; no partial database changes occur.
3. Reject invalid accounts, nonpositive amounts, excess precision, unauthorized requests and closed periods.
4. Retrying after a lost response returns the original receipt without duplicate entries; a changed split with the same key fails with 409.
5. History and reopened receipts return the same stored breakdown. Reversal reverses the complete split.
6. Existing single-account payments continue to work.

## Deployment order

Deploy and verify the backend schema, persistence and response extension first. Then update the frontend API adapter to submit structured allocations instead of relying on notes. The UI changes in this handoff do not enable structured backend postings by themselves.
