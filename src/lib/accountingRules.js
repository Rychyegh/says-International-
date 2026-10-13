export const money = value => new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(Number(value || 0));
export function validateJournal(lines) {
  if (lines.length < 2) throw new Error('A journal needs at least two lines.');
  let debit = 0, credit = 0;
  for (const line of lines) {
    const d = Number(line.debit), c = Number(line.credit);
    if (!line.account_id || !Number.isFinite(d) || !Number.isFinite(c) || d < 0 || c < 0 || (d > 0) === (c > 0)) throw new Error('Each line needs an account and either a positive debit or credit.');
    if (Math.abs(d * 100 - Math.round(d * 100)) > 0.000001 || Math.abs(c * 100 - Math.round(c * 100)) > 0.000001) throw new Error('Use at most two decimal places.');
    debit += Math.round(d * 100); credit += Math.round(c * 100);
  }
  if (debit !== credit) throw new Error('Total debits must equal total credits.');
  return debit / 100;
}
export function statementTotals(lines) {
  if (!Array.isArray(lines) || !lines.length) return null;
  const totals = { asset: 0, liability: 0, equity: 0 };
  for (const line of lines) {
    if (!(line.type in totals) || line.amount == null || !Number.isFinite(Number(line.amount))) return null;
    totals[line.type] += Math.round(Number(line.amount) * 100);
  }
  return { ...Object.fromEntries(Object.entries(totals).map(([k,v]) => [k,v / 100])), balanced: totals.asset === totals.liability + totals.equity };
}
export function filterBills(rows, filters) {
  return rows.filter(row => {
    const balance = Number(row.balance);
    const text = `${row.studentName} ${row.studentId} ${row.billId}`.toLowerCase();
    return text.includes((filters.search || '').toLowerCase())
      && (!filters.classLevel || row.classLevel === filters.classLevel)
      && (!filters.term || row.term === filters.term)
      && (!filters.year || row.academicYear === filters.year)
      && (!filters.status || (filters.status === 'Paid' ? balance <= 0 : filters.status === 'Unpaid' ? balance > 0 && Number(row.paidAmount) === 0 : balance > 0 && Number(row.paidAmount) > 0))
      && (filters.min === '' || filters.min == null || balance >= Number(filters.min))
      && (filters.max === '' || filters.max == null || balance <= Number(filters.max));
  }).sort((a,b) => filters.sort === 'balance' ? Number(b.balance) - Number(a.balance) : String(a.studentName).localeCompare(String(b.studentName)));
}
