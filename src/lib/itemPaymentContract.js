export const ITEM_PAYMENTS_ENABLED = import.meta.env?.VITE_ENABLE_ITEM_PAYMENTS === 'true';
export const isItemUuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
export function paymentAccountOptions(raw) {
  // No names/codes are converted into account identities.
  const data = raw?.data || raw;
  const rows = Array.isArray(data) ? data : data?.accounts;
  const usable = rows => (Array.isArray(rows) ? rows : []).filter(row =>
    isItemUuid(row.id) && row.is_active !== false && row.status !== 'archived'
    && (row.is_active === true || row.status === 'active'));
  const configured = usable(Array.isArray(rows) ? rows : [
    ...(data?.source_accounts || []), ...(data?.expense_accounts || []),
  ]);
  const accounts = [...new Map(configured.map(account => [account.id, account])).values()];
  return { sources: accounts, expenses: accounts };
}
