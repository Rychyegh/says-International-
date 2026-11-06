# UAC required phone and credential SMS

Date: 6 November 2026

## Current client implementation

UAC requires a valid phone number when creating or editing any role. Both forms mark the field required; the API adapter rejects missing/invalid numbers before sending a user write. Existing users without a number must supply one when editing. Updating a user does not send another credential SMS.

The repository contains the frontend, not the backend implementation. Deploy and verify the server behavior below separately.

1. The client creates the account with `POST /api/v1/users`. The payload includes `phone` and `phone_number`, login `email`, `username`, `password`, name and role.
2. Only after the response contains a saved account ID (`id` or `_id`, under `user`, `data.user`, `data`, or the root), the client calls `POST /api/v1/attendance/send-sms` with the issued login email, password and role portal URL.
3. The SMS result appears on the credential slip and in the creation notification. An SMS failure leaves the saved account intact and reports delivery as unconfirmed. Do not create the account again to retry SMS.

The existing class-teacher passcode provisioning endpoint is separate and may send its own passcode SMS. The new account SMS contains login email/password, not that separate passcode.

## Server requirements

Enforce authentication and the existing authorized user-administration role policy on `/users`. Require a nonempty valid phone on account creation and profile updates, including direct API requests. Validate and normalize on the server; client validation alone is insufficient. Do not break separate status/password endpoints by requiring unrelated profile fields.

The client removes spaces, parentheses and hyphens, removes a leading `+`, and replaces a leading Ghana local `0` with `233` before sending SMS. It accepts 10–15 digits after normalization. Apply stronger country-aware validation server-side and return HTTP 422 with a readable `detail` for invalid phone numbers. Store a canonical international number. Plan a backfill for existing accounts missing numbers; do not invent a number.

Commit the account before returning HTTP 201 and the database ID. Store passwords using the existing secure password hash. Do not return passwords in user lists or persist plaintext credentials in audit logs.

### Existing SMS endpoint contract

`POST /api/v1/attendance/send-sms`, authenticated JSON:

```json
{
  "recipientPhone": "233241112222",
  "messageText": "REMALJ Carewell: Hello Test User, your account has been created.\nLogin email: user@example.test\nPassword: <issued password>\nPortal: https://<school-host>/teacher\nKeep these credentials private and change your password after signing in.",
  "senderId": "RCIS"
}
```

Allow this endpoint to send UAC credentials for all supported account roles; do not require an attendance record or guardian relationship. Enforce authorized sender access and school boundaries. The gateway API key stays on the server. Configure SMSOnlineGH credentials, usable credits and the registered `RCIS` sender ID.

Return a trackable request, either at the root or under `data`:

```json
{"id":"sms-request-id","status":"queued"}
```

Supported success statuses are `queued`, `sent`, and `delivered`. Return `queued` only after durable queuing/provider acceptance, `sent` only after provider confirmation, and `delivered` only with delivery evidence. Generic `success: true` is insufficient. Return a non-2xx JSON error on gateway rejection. Never claim delivery from HTTP acceptance alone.

Treat credential message contents as sensitive: redact bodies from request/error logs, restrict message storage/access and retention, and audit actor, account ID, recipient and delivery status without the password. Enforce existing password-change policy server-side.

## Future server-owned delivery

The current client explicitly sends the SMS after account creation. Do not also auto-send it inside `/users` with this client deployed, or recipients will get duplicates. For reliable delivery when the browser closes after account creation, migrate both sides together to server-owned account creation plus a durable outbox and idempotent retries. Return SMS status separately from account persistence; disable the explicit client send during that migration.

## Acceptance checks

- Missing, whitespace-only and invalid numbers fail creation/editing in both the UI and direct API calls.
- For every UAC role, a confirmed create triggers one credential SMS to the supplied normalized number with the exact issued email/password and correct portal. An unsuccessful create triggers no SMS.
- Teacher roles use `/teacher`; student, parent and accountant use their matching paths; remaining roles use `/admin` under the current portal routing.
- Gateway rejection or timeout keeps the account saved and shows unconfirmed SMS status. Check provider status before retrying an uncertain request.
- Existing class-teacher passcode SMS remains independently tracked.
- Verify real delivery using a designated test account and authorized test number, then check provider delivery status. Simulated tests do not verify live delivery.
