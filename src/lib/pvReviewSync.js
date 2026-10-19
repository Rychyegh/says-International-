export const PV_CHANGED_KEY = 'says_payment_vouchers_changed';
export function isConfirmedReviewStatus(status) {
  const value = String(status || '').trim().toUpperCase().replace(/[ _-]+/g, ' ');
  return ['APPROVED', 'VALIDATED', 'REJECTED', 'DECLINED', 'PRE AUDITED', 'PRE AUDITED & APPROVED', 'PARTIALLY APPROVED', 'PARTIALLY PAID'].includes(value);
}
export function notifyVoucherChange() {
  try { localStorage.setItem(PV_CHANGED_KEY, `${Date.now()}:${crypto.randomUUID()}`); }
  catch { /* The independent voucher poll still updates other tabs. */ }
}
