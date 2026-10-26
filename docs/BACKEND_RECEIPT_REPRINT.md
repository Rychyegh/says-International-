# Student receipt archive and reprinting

The Accounts “Re-print Commercial Receipt” action now opens saved student payment history instead of sample commercial receipts. Select a student, locate a payment and click Print receipt. This uses the same receipt renderer as the first payment receipt. Opening or printing a receipt must never create another payment.

This repository contains the frontend API client, not the deployed finance backend implementation. Live endpoint support has not been verified. Backend work is needed if saved payments are missing from the ledger or their original receipt details are absent.

## Required persistence

POST `/api/v1/finance/fees/{invoice_id}/pay` must save the payment, original unique receipt number, payer, student/invoice relationships, payment date/method, description and allocation lines atomically. Return the confirmed payment and updated invoice. Preserve the original Idempotency-Key when reconciling uncertain submissions. See BACKEND_PAYMENT_ACCOUNT_SPLITS.md and BACKEND_LEDGER_PAYER_DETAILS.md for the existing submission contracts.

Printing is a browser action. Persist the receipt when the payment is confirmed, before opening the print dialog; cancelling printing must not remove it. A bill/invoice is not evidence of payment: only confirmed payments belong in receipt history.

## Read contract used by reprint

GET `/api/v1/finance/students/{student_id}/ledger` must include all historical confirmed payments, including fully paid invoices and previous terms, after reload and a fresh sign-in. The current client expects the complete list in `ledger_entries` (no silently truncated pages).

```json
{
  "student_id": "student-uuid",
  "student_name": "Student Name",
  "current_balance": 0,
  "ledger_entries": [{
    "id": "payment-uuid",
    "type": "PAYMENT",
    "receipt_number": "RCPT-000123",
    "date": "2026-10-26",
    "credit": 100,
    "amount": 100,
    "payer_name": "Actual Payer",
    "payment_method": "Cash",
    "description": "School fees",
    "allocations": [{"account_code": "INC-001", "account_name": "Tuition", "amount": 100}]
  }]
}
```

Accepted payment types are PAYMENT, RECEIPT and FEE_PAYMENT. Return the original receipt number as `receipt_number` or `reference`; do not substitute a transfer reference. Bills and waivers must retain their distinct types. Preserve actual historical details; do not invent receipt numbers or payer names for legacy entries. Restrict reads to authorized users in the student's school. Return meaningful 401/403/404/5xx errors instead of successful empty histories for failures.

## Acceptance checks

1. Receive one payment and print its first receipt. Reprint shows the same original number, amount, payer and allocations.
2. Refresh, sign out/in, and open Accounts → Re-print Commercial Receipt. The payment remains available.
3. Fully settle the invoice and verify it still appears; include a student without a current invoice.
4. Cancel printing and reprint again. Payment count, balances and allocations remain unchanged.
5. Verify multiple payments, historical terms, an empty history, and a backend failure. No fabricated receipt should appear.
