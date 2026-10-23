# PL / expense account creation

The item disbursement dialog now provides **Add account** next to the PL / Account selector. Backend support for the following contract must be deployed before saving can work. This endpoint has not been verified against production.

## Request

`POST /api/v1/finance/payment-accounts` using the authenticated session:

```json
{"name":"Stationery","code":"5208","account_type":"expense","is_active":true}
```

Authorize only permitted finance administrators/accountants, enforce the user's school scope on the server, validate a non-empty name (maximum 255 characters) and code (maximum 50 characters), and enforce unique account codes within that school. Return 403 for insufficient permission, 409 for duplicate codes, and 422 for invalid input. Do not silently overwrite an existing account.

## Persistence and response

Persist an active expense ledger account in the same directory used by `GET /api/v1/finance/payment-accounts`. Return 201 with the persisted record including its UUID, name, code, account_type and is_active. Record the actor and timestamp in the audit trail. Account creation must not create a payment or ledger transaction.

The frontend reloads the account directory after a successful save. The GET response must include the new account immediately, across devices, in either the accounts array or expense_accounts array. Its UUID must be accepted as expense_account_id by item disbursement.

## Verification

- Create an account; reload and confirm it remains available on another device.
- Reject duplicate codes and unauthorized creation without writing data.
- A failed save must leave the form open and show the server error.
- Creating an account must not disburse money or change voucher balances.
