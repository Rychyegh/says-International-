import { billingPeriod, billingPeriodLabel } from './billingPeriod.js';
import { savedBillItems } from './savedBillItems.js';

// Invoice snapshots, never class rates, are authoritative after a bill is posted.
export function studentSavedBills(bills, student, period) {
  if (!student) return [];
  const ids = [student.id, student.studentId, student.studentUuid].filter(Boolean).map(String);
  const label = billingPeriodLabel(period);
  return bills.filter(bill => ids.includes(String(bill.studentId || bill.student_id)) &&
    billingPeriodLabel(billingPeriod(bill)) === label &&
    (savedBillItems(bill).length > 0 || Number(bill.billedAmount ?? bill.billed_amount ?? 0) !== 0 || Number(bill.paidAmount ?? bill.paid_amount ?? 0) !== 0));
}
