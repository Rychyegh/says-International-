import React from 'react';
import SchoolPrintHeader from '../School/SchoolPrintHeader';
import { money } from '../../lib/accountingRules';

export default function SavedBillStatement({ bill, student = {} }) {
  return <article style={{ background: 'white', padding: '36px 42px', maxWidth: 820, margin: '20px auto', border: '1px solid #cbd5e1', color: '#0f172a', boxSizing: 'border-box' }}>
    <SchoolPrintHeader />
    <h2 style={{ textAlign: 'center', fontSize: 16, borderBottom: '2px solid #0f172a', paddingBottom: 14 }}>OFFICIAL STUDENT FEE BILL STATEMENT · {bill.term} · {bill.academicYear}</h2>
    <div style={{ display: 'flex', gap: 18, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, margin: '18px 0' }}>
      {student.photo && <img src={student.photo} alt="Student" style={{ width: 70, height: 78, objectFit: 'cover' }} />}
      <div style={{ flex: 1 }}><small>STUDENT FULL NAME</small><h3>{bill.studentName}</h3><p>Student ID: {bill.studentId}</p></div>
      <div><p><strong>Class:</strong> {bill.classLevel}</p><p><strong>Guardian:</strong> {student.guardianName || 'Not supplied'}</p><p><strong>Invoice:</strong> {bill.billId || bill.id}</p><p><strong>Due:</strong> {bill.dueDate || 'Not supplied'}</p></div>
    </div>
    <h3 style={{ fontSize: 13 }}>TERM FEES AND SERVICES</h3>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr><th>Fee line item</th><th>Amount (GHS)</th></tr></thead><tbody>{(bill.itemsBreakdown || []).map((item,index)=><tr key={index}><td>{item.details || item.description || item.name}</td><td>{money(item.amount ?? item.fee)}</td></tr>)}</tbody></table>
    {!bill.itemsBreakdown?.length && <p>Item breakdown was not supplied by the saved invoice API.</p>}
    <div style={{ background: '#f8fafc', padding: 16, marginTop: 20 }}><p>Previous balance: {money(bill.arrearsBroughtForward)}</p><p>Discount: {money(bill.scholarshipDiscount)}</p><p>Total billed: {money(bill.billedAmount)}</p><p>Payments received: {money(bill.paidAmount)}</p><h3>AMOUNT DUE: {money(bill.balance)}</h3></div>
    <p style={{ marginTop: 24 }}>Please quote the student ID and invoice reference when paying through the school’s approved payment channels.</p>
  </article>;
}
