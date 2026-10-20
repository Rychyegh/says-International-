const paidStatus = value => ['PAID', 'DISBURSED', 'SETTLED'].includes(String(value || '').trim().toUpperCase());
export function isFullyPaidVoucher(voucher) {
  if (/partial/i.test(String(voucher?.status))) return false;
  return paidStatus(voucher?.status);
}
export function confirmedPaidAmount(voucher) {
  const explicit = voucher?.paidTotal ?? voucher?.paid_total;
  if (explicit != null && Number.isFinite(Number(explicit))) return Number(explicit);
  const items = voucher?.items || [];
  const paid = items.filter(item => paidStatus(item.status));
  if (paid.length) return Math.round(paid.reduce((sum, item) => sum + Number(item.totalAmount ?? item.total_amount ?? item.total ?? item.amount ?? 0), 0) * 100) / 100;
  return isFullyPaidVoucher(voucher) ? Number(voucher.total ?? voucher.total_amount ?? voucher.amount ?? 0) : 0;
}
export function hasConfirmedPayment(voucher) {
  return isFullyPaidVoucher(voucher) || confirmedPaidAmount(voucher) > 0;
}
