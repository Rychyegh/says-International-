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
    if (!Object.hasOwn(totals, line.type) || line.amount == null || !Number.isFinite(Number(line.amount))) return null;
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

export const cents = value => Math.round(Number(value) * 100);
export function parseBankCsv(text) {
  const rows = []; let row = [], field = '', quoted = false;
  const source = String(text).replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i++) {
    const c = source[i];
    if (c === '"') {
      if (quoted && source[i + 1] === '"') { field += '"'; i++; }
      else if (!quoted && field.trim()) throw new Error('Invalid quote in bank CSV.');
      else quoted = !quoted;
    } else if (c === ',' && !quoted) { row.push(field.trim()); field = ''; }
    else if ((c === '\n' || c === '\r') && !quoted) {
      if (c === '\r' && source[i + 1] === '\n') i++;
      row.push(field.trim()); if (row.some(Boolean)) rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (quoted) throw new Error('A CSV quoted field was not closed.');
  row.push(field.trim()); if (row.some(Boolean)) rows.push(row);
  const headers = (rows.shift() || []).map(h => h.toLowerCase());
  if (['date', 'reference', 'description', 'amount'].some(h => !headers.includes(h))) throw new Error('CSV columns must include date, reference, description, amount.');
  if (!rows.length || rows.length > 5000) throw new Error('Import between 1 and 5,000 statement lines.');
  return rows.map((values, i) => {
    if (values.length !== headers.length) throw new Error(`CSV row ${i + 2} has the wrong number of columns.`);
    const item = Object.fromEntries(headers.map((h, j) => [h, values[j]]));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.date) || Number.isNaN(Date.parse(item.date)) || new Date(item.date).toISOString().slice(0,10) !== item.date) throw new Error(`CSV row ${i + 2} needs a valid YYYY-MM-DD date.`);
    if (!/^-?\d+(\.\d{1,2})?$/.test(item.amount) || cents(item.amount) === 0) throw new Error(`CSV row ${i + 2} needs a non-zero signed amount with at most 2 decimals.`);
    return { line_id: String(i + 1), date: item.date, reference: item.reference, description: item.description, amount: Number(item.amount) };
  });
}
export function validateReconciliationMatches(statementLines, ledgerLines, matches) {
  const used = new Set();
  return Object.entries(matches).filter(([, id]) => id).map(([lineId, ledgerId]) => {
    const bank = statementLines.find(l => l.line_id === lineId);
    const ledger = ledgerLines.find(l => String(l.id) === String(ledgerId));
    if (!bank || !ledger || ledger.reconciled || cents(bank.amount) !== cents(ledger.amount)) throw new Error('Matches must have equal signed amounts and an unreconciled ledger entry.');
    if (used.has(String(ledgerId))) throw new Error('A ledger transaction cannot be matched twice.');
    used.add(String(ledgerId));
    return { statement_line_id: lineId, ledger_transaction_id: String(ledgerId) };
  });
}
export function taxPreview(base, rate, inclusive = false) {
  if (base === '' || rate === '' || !Number.isFinite(Number(base)) || !Number.isFinite(Number(rate)) || Number(base) < 0 || Number(rate) < 0 || Number(rate) > 100) return null;
  const grossCents = cents(base);
  const net = inclusive ? Math.round(grossCents / (1 + Number(rate) / 100)) : grossCents;
  const tax = inclusive ? grossCents - net : Math.round(net * Number(rate) / 100);
  return { net: net / 100, tax: tax / 100, total: (net + tax) / 100 };
}
export function auditChanges(before, after) {
  const left = before || {}, right = after || {};
  return [...new Set([...Object.keys(left), ...Object.keys(right)])].filter(k => JSON.stringify(left[k]) !== JSON.stringify(right[k])).map(field => ({ field, before: left[field], after: right[field] }));
}
export function csvExport(columns, rows) {
  const quote = value => {
    const text = String(value ?? '');
    // Neutralize spreadsheet formulas when users open an exported audit or ledger file.
    return `"${(typeof value !== 'number' && /^[\s]*[=+@-]/.test(text) ? "'" : '') + text.replaceAll('"', '""')}"`;
  };
  return [columns.map(c => quote(c.label)).join(','), ...rows.map(row => columns.map(c => quote(typeof c.value === 'function' ? c.value(row) : row[c.key])).join(','))].join('\r\n');
}
