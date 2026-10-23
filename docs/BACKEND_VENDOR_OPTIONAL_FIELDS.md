# Vendor item payment: removed form fields

23 October 2026

The school requested removing Destination account and Payment reference from the item payment form. The deployed backend still rejects their empty strings with 422: `destination_account` and `reference` must each contain at least two characters. This blocks recording payment; it is separate from student payment allocations.

Update the item payment recording schema and database constraints to support omitted/null destination_account and reference. Normalize empty legacy strings to null. Preserve supplied historical values. If the school's accounting rules require a reference, generate a unique internal ledger reference on the server and label it as internal; do not present it as a bank/MoMo transaction reference or evidence of settlement. Do not fabricate recipient account details.

Keep beneficiary, source asset UUID, expense account UUID, payment method/date, voucher version, authorization, external settlement confirmation and idempotency validation intact. Reconcile uncertain requests before any retry. Return optional fields as null in confirmed receipts and omit empty labels in printouts.

Verify the existing item disbursement endpoint accepts requests with both fields omitted/null, commits one payment, and returns its confirmed receipt. Verify original-key replay cannot duplicate payment. Until deployed, the current form cannot record these payments without collecting genuine values for the required fields. Coordinate the frontend to omit empty properties after backend compatibility is available.
