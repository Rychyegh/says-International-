import { savedBillItems } from '../../lib/savedBillItems';
import React from 'react';
import SchoolPrintHeader from '../School/SchoolPrintHeader';
import { money } from '../../lib/accountingRules';
import './SavedBillStatement.css';

export default function SavedBillStatement({ bill, student = {} }) {
  const items = savedBillItems(bill);
  const optional = item => item.is_optional === true || item.optional === true;
  return <article className="saved-bill-statement" style={{ background: 'white', padding: '36px 42px', maxWidth: 820, margin: '20px auto', border: '1px solid #cbd5e1', color: '#0f172a', boxSizing: 'border-box' }}>
    <SchoolPrintHeader />
    <h2 style={{ textAlign: 'center', fontSize: 16, borderBottom: '2px solid #0f172a', paddingBottom: 14 }}>OFFICIAL STUDENT FEE BILL STATEMENT · {bill.term} · {bill.academicYear}</h2>
    <div style={{ display: 'flex', gap: 18, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, margin: '18px 0' }}>
      {student.photo && <img src={student.photo} alt="Student" style={{ width: 70, height: 78, objectFit: 'cover' }} />}
      <div style={{ flex: 1 }}><small>STUDENT FULL NAME</small><h3>{bill.studentName}</h3><p>Student ID: {bill.studentId}</p></div>
      <div><p><strong>Class:</strong> {bill.classLevel}</p><p><strong>Guardian:</strong> {student.guardianName || 'Not supplied'}</p><p><strong>Invoice:</strong> {bill.billId || bill.id}</p><p><strong>Due:</strong> {bill.dueDate || 'Not supplied'}</p></div>
    </div>
    {[['1. COMPULSORY TERM FEES COMPONENT',items.filter(item=>!optional(item))],['2. OPTIONAL SERVICES (MOTIVATION, BUS, FEEDING, STATIONERY, PICK UP CARD)',items.filter(optional)]].map(([title,rows])=><section key={title}><h3 className="saved-bill-section-title"><span>{title}</span><span>SUBTOTAL: {money(rows.reduce((total,item)=>total+Number(item.amount ?? item.fee ?? 0),0))}</span></h3><table><thead><tr><th>Fee line item</th><th>Amount (GHS)</th></tr></thead><tbody>{rows.map((item,index)=><tr key={index}><td>{item.details || item.description || item.name}</td><td>{Number(item.amount ?? item.fee ?? 0).toFixed(2)}</td></tr>)}</tbody></table></section>)}
    {!items.length && <p>Item breakdown was not supplied by the saved invoice API.</p>}
    <div style={{ background: '#f8fafc', padding: 16, marginTop: 20 }}><p>Previous balance: {money(bill.arrearsBroughtForward)}</p><p>Discount: {money(bill.scholarshipDiscount)}</p><p>Total billed: {money(bill.billedAmount)}</p><p>Payments received: {money(bill.paidAmount)}</p><h3>AMOUNT DUE: {money(bill.balance)}</h3></div>
    <div className="saved-bill-total"><strong>TOTAL ACADEMIC BILL FOR {bill.studentName}:</strong><strong>{money(bill.billedAmount)}</strong></div>
    <div className="saved-bill-banking"><strong>OFFICIAL BANKING PAYMENT DETAILS</strong>{bill.paymentInstructions ? <p>{bill.paymentInstructions}</p> : <p>Use the school’s confirmed payment instructions. Quote student ID {bill.studentId} and invoice {bill.billId || bill.id}.</p>}</div>
    <p style={{ textAlign: 'center', fontSize: 11, marginTop: 24 }}>Addressed to {bill.studentName}</p>
  </article>;
}
