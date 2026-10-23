# General ledger payer details

The accountant requests columns: Name of payer, Reference, Description, Amount, Date, Dr/Cr, Running Balance. The frontend now displays these and includes them in CSV exports. Trial balance is unchanged.

Existing API: GET `/api/v1/finance/accounting/accounts/{account_uuid}/ledger?from=YYYY-MM-DD&to=YYYY-MM-DD` returning `{ "report": { "lines": [...] } }`.

Each line should provide `payer_name`, `reference`, `description`, `date`, `debit`, `credit`, and authoritative `running_balance`. Resolve payer_name from the linked payment/receipt's actual payer. A student's name, posting administrator, journal creator or beneficiary is not necessarily the payer. Return null if no payer applies, such as an opening balance, or if historical data cannot identify them. Do not infer a person from free-text descriptions or reclassification references.

The frontend derives the displayed amount and Dr/Cr from debit/credit. Return separate debit and credit ledger lines rather than aggregated mixed-side rows. Running balances must be calculated server-side using the account's normal balance, opening balance and stable transaction ordering. Preserve original source payment linkage through receipt reclassification entries, so the payer can be traced without changing financial totals.

Verify a receipt with known payer, a historical receipt without payer, a reclassification, a debit entry and a credit entry. Ensure totals and balances are unchanged. Enforce existing school/account read permissions; never expose private bank details merely to resolve a payer name. Live payer data availability has not been verified in this frontend task.
