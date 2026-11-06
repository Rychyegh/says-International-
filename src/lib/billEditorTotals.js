import { savedBillItems } from './savedBillItems.js';

const cents = value => Math.round(Number(value || 0) * 100);
export function billEditorTotals(bill, items = savedBillItems(bill)) {
  const arrears = cents(bill.arrearsBroughtForward ?? bill.arrears_brought_forward);
  const discount = cents(bill.scholarshipDiscount ?? bill.scholarship_discount);
  const paid = cents(bill.paidAmount ?? bill.paid_amount);
  const subtotal = items.reduce((sum, item) => sum + cents(item.amount), 0);
  const total = subtotal + arrears - discount;
  const originalTotal = savedBillItems(bill).reduce((sum, item) => sum + cents(item.amount), 0) + arrears - discount;
  const savedTotal = cents(bill.billedAmount ?? bill.billed_amount);
  return { subtotal: subtotal / 100, arrears: arrears / 100, discount: discount / 100,
    total: total / 100, paid: paid / 100, balance: (total - paid) / 100,
    savedTotal: savedTotal / 100, discrepancy: (savedTotal - originalTotal) / 100 };
}
