export const ITEM_PAYMENTS_ENABLED = import.meta.env?.VITE_ENABLE_ITEM_PAYMENTS === 'true';
export const isItemUuid = value => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
export function paymentAccountOptions(raw) {
  // No names/codes are converted into account identities.
  const data = raw?.data || raw;
  const rows = Array.isArray(data) ? data : data?.accounts;
  const usable = rows => (Array.isArray(rows) ? rows : []).filter(row => isItemUuid(row.id) && row.is_active === true);
  if (Array.isArray(rows)) return {
    sources: usable(rows).filter(row => String(row.account_type || row.type).toLowerCase() === 'asset'),
    expenses: usable(rows).filter(row => String(row.account_type || row.type).toLowerCase() === 'expense'),
  };
  return {sources:usable(data?.source_accounts),expenses:usable(data?.expense_accounts)};
}
