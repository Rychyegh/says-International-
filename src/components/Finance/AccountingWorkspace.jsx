import React, { useState } from 'react';
import { BookOpen, Landmark, Scale, Percent, Receipt, History, Settings2, LockKeyhole } from 'lucide-react';
import { FINANCE_SECTIONS } from '../../services/accounting';
import BillPrinting from './StudentBillPrinting';
import AccountRecords from './accounting/AccountRecords';
import BankReconciliation from './accounting/BankReconciliation';
import BalanceSheet from './accounting/BalanceSheet';
import TaxSettings from './accounting/TaxSettings';
import PVReceipts from './accounting/PVReceipts';
import AuditTrail from './accounting/AuditTrail';
import AccountSetup from './accounting/AccountSetup';
import PeriodClosing from './accounting/PeriodClosing';
import './AccountingWorkspace.css';

const sections={
  'Account Records':{component:AccountRecords,icon:BookOpen,description:'Record balanced journals, inspect each account ledger, and review the trial balance.'},
  'Bank Reconciliation':{component:BankReconciliation,icon:Landmark,description:'Compare bank statements with posted transactions and resolve unmatched entries.'},
  'Balance Sheet':{component:BalanceSheet,icon:Scale,description:'Prepare the school’s statement of financial position and compare reporting dates.'},
  'Tax & SSNIT Settings':{component:TaxSettings,icon:Percent,description:'Manage effective-dated tax and contribution rates, and preview their calculations.'},
  'PV Receipts':{component:PVReceipts,icon:Receipt,description:'Review, filter, and print receipts released after approved voucher payments.'},
  'Audit Trail':{component:AuditTrail,icon:History,description:'Trace who changed a financial record, when it changed, and the values before and after.'},
  'Account Setup':{component:AccountSetup,icon:Settings2,description:'Maintain the chart of accounts, payment accounts, and opening-balance setup.'},
  'Period Closing':{component:PeriodClosing,icon:LockKeyhole,description:'Run closing checks, resolve outstanding work, and approve locking a term or year.'},
};
export default function AccountingWorkspace({section,role='accountant',onPrepareBill,onNavigate}) {
  const [adminSection,setAdminSection]=useState('Account Records');
  const current=section||adminSection;
  const navigate=label=>{
    if(!FINANCE_SECTIONS.includes(label))return;
    if(onNavigate)onNavigate(label);
    else if(!section)setAdminSection(label);
    else window.dispatchEvent(new CustomEvent('says_navigate',{detail:{portal:role==='accountant'?'accountant':'admin',nav:label}}));
  };
  if(!['head_admin','accountant','auditor'].includes(role))return <p role="alert">You do not have access to accounting management.</p>;
  const config=sections[current],Component=config?.component,Icon=config?.icon;
  return <section className="accounting-workspace">
    {!section&&<nav className="accounting-section-nav" aria-label="Accounting sections">{FINANCE_SECTIONS.map(s=><button key={s} aria-current={current===s?'page':undefined} onClick={()=>setAdminSection(s)}>{s}</button>)}</nav>}
    <header className="accounting-hero">{Icon&&<div className="accounting-hero-icon"><Icon size={26}/></div>}<div><span className="accounting-eyebrow">Finance office / {role==='head_admin'?'Head Admin':role==='auditor'?'Audit access':'Accounts'}</span><h1>{current}</h1><p>{config?.description||'Prepare and print student bills by class, year, term, and payment status.'}</p></div></header>
    {current==='Student Billing & Printing'?<BillPrinting onPrepareBill={onPrepareBill}/>:Component?<Component key={current} role={role} onNavigate={navigate}/>:<p>Choose a financial section.</p>}
  </section>;
}
