import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import StudentReceiptModal from './StudentReceiptModal';

export default function StudentPaymentHistory({ fees, initialStudentId, reprint = false }) {
  const students = [...new Map(fees.filter(fee => fee.studentId).map(fee => [String(fee.studentId), fee])).values()];
  const [studentId, setStudentId] = useState(initialStudentId || '');
  const [rows, setRows] = useState([]), [loading, setLoading] = useState(false), [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0), [receipt, setReceipt] = useState(null);
  const student = students.find(fee => String(fee.studentId) === String(studentId));
  useEffect(() => {
    let active = true;
    setRows([]); setError(''); setLoading(Boolean(studentId));
    if (studentId) api.getStudentLedger(studentId).then(ledger => {
      if (active) setRows(ledger.entries.filter(entry =>
        ['PAYMENT', 'RECEIPT', 'FEE_PAYMENT'].includes(String(entry.type).toUpperCase()) && Number(entry.credit || entry.amount) > 0
      ).sort((a, b) => String(b.date).localeCompare(String(a.date))));
    }).catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [studentId, refresh]);
  return <section aria-label="Payment history">
    <h2>{reprint ? 'Re-print Receipt' : 'Payment History'}</h2>
    {reprint && <p>Choose the student, locate the original payment, then open its receipt to print a replacement copy. This does not record another payment.</p>}
    <p>Select a student to view payments saved in the database, including payments for fully paid invoices.</p>
    <label>Student<select aria-label="History student" value={studentId} onChange={event => setStudentId(event.target.value)}>
      <option value="">Select a student</option>
      {students.map(fee => <option key={fee.studentId} value={fee.studentId}>{fee.studentName} · {fee.studentId}</option>)}
    </select></label>
    <button type="button" className="btn btn-outline-green" disabled={!studentId || loading} onClick={() => setRefresh(value => value + 1)}>Refresh payment history</button>
    {loading && <p role="status">Loading payment history…</p>}
    {error && <p role="alert" className="receive-payment-error">Payment history could not be loaded: {error}</p>}
    {studentId && !loading && !error && !rows.length && <p>No saved payments for this student.</p>}
    {!!rows.length && <div style={{ overflowX: 'auto', marginTop: 20 }}><table className="receive-payment-history"><thead><tr><th>Date</th><th>Receipt / reference</th><th>Description / accounts</th><th>Amount (GHS)</th><th>Receipt</th></tr></thead>
      <tbody>{rows.map(row => <tr key={row.id}><td>{row.date?.slice(0, 10)}</td><td>{row.reference || 'Not supplied'}</td><td style={{ whiteSpace: 'pre-line' }}>{row.description}</td><td>{Number(row.credit || row.amount).toFixed(2)}</td><td><button type="button" className="btn btn-outline-green" disabled={!row.reference} onClick={() => setReceipt(row)}>Print receipt</button></td></tr>)}</tbody></table></div>}
    {receipt && student && <StudentReceiptModal fee={student} confirmedReceipt={receipt} onClose={() => setReceipt(null)} />}
  </section>;
}
