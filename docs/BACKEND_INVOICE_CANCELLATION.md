# Invoice cancellation: Head Admin and Super Admin

23 October 2026. User reports cancellation does not complete after entering a reason. Exact live API failure remains unverified.

Existing frontend calls POST `/api/v1/finance/fees/{invoice_uuid}/cancel` with bearer authentication, `Idempotency-Key` header and `{ "reason": "Entered cancellation reason" }`. The frontend now restricts this control to head_admin and super_admin and requires at least three trimmed characters. Browser permission checks are not authorization: enforce both roles server-side. Do not map sub_admin to super_admin.

Verify deployed role support, complete session/PIN verification, invoice UUID, reason validation and database transaction. Return readable JSON errors for 401, 403, 409 and 422. A reason alone does not bypass session verification. Super Admin login/navigation is a separate application role integration; this patch does not establish that broader role throughout the app.

On successful cancellation return the updated invoice under fee (including id, cancellation status, balances and audit details), and make GET `/finance/fees` reflect the same record. Retain receipts and payments. Cancellation is not a refund or an allocation-aware payment reversal. Apply the school's approved ledger correction rules atomically and audit actor, reason and timestamp.

Preserve original idempotency keys for uncertain requests; identical retries must not duplicate adjustments. A changed payload with the same key must return 409. Verify both allowed roles, denied accountant/sub-admin access, reason validation, persisted cancelled status after refresh, and existing receipts retained. Supply sanitized failing response/status/request ID if cancellation is still blocked; no live cancellation was performed in this task.
