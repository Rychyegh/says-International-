export function isPendingVoucher(voucher) {
  return ['draft', 'pending', 'pending audit', 'pending approval', 'pre_audited', 'pre-audited', 'pre-audited & approved'].includes(String(voucher.status || '').trim().toLowerCase());
}

export function voucherNotifications(vouchers, previous = [], dismissed = new Set()) {
  const existing = new Map(previous.map(notice => [notice.id, notice]));
  return vouchers.filter(voucher => voucher.id && isPendingVoucher(voucher) && !dismissed.has(voucher.id)).map(voucher => {
    const id = `pv-${voucher.id}`;
    return {
      id, voucherId: voucher.id, pvNo: voucher.pvNo,
      provider: voucher.provider, grandTotal: voucher.grandTotal ?? voucher.total ?? 0,
      description: voucher.description, submittedBy: voucher.submittedBy || voucher.preparedBy || 'School staff',
      submittedAt: voucher.submittedAt || voucher.datePrepared || '', read: existing.get(id)?.read || false,
    };
  });
}
