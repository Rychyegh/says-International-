import React, { useState } from 'react';
import {
  LayoutDashboard, CreditCard, Send, Search, CheckCircle2,
  AlertTriangle, DollarSign, Users, School, MessageSquare, PlusCircle, FileText, Printer, Shield, ShieldCheck, ChevronRight, UserPlus, Sliders, Calendar, FileCheck, UserCheck, Lock, RefreshCw, Layers, Receipt, Download
} from 'lucide-react';
import '../components/Portal/Portal.css';
import { usePortalData } from '../data/PortalStore';

import OfficialSchoolFeeStructure from '../components/Finance/OfficialSchoolFeeStructure';
import { getAuthUser } from '../services/api';

const ACCOUNT_BG = '#0f3a4b';
const ACCOUNT_LIGHT = '#e0f2fe';
const ACCOUNT_ACCENT = '#0284c7';

const NAV = [
  { icon: <School size={15} />, label: 'SIMS v2025 Module', badge: 'v2025' },
  { icon: <Lock size={15} />, label: 'SIMS Auth & Login Terminal', badge: 'Login' },
  { icon: <FileText size={15} />, label: 'Post Academic Bill Header', badge: 'New' },
  { icon: <FileText size={15} />, label: 'Print Individual Student Bill', badge: 'Print' },
  { icon: <CreditCard size={15} />, label: 'Receive Payments', badge: 'Pay' },
  { icon: <Receipt size={15} />, label: 'Receive Other Payments', badge: 'Misc' },
  { icon: <Layers size={15} />, label: 'Batch Processing', badge: 'Batch' },
  { icon: <Printer size={15} />, label: 'Reprint Commercial Receipt', badge: 'Reprint' },
  { icon: <DollarSign size={15} />, label: 'Other Accounts Receivables', badge: 'Recv' },
  { icon: <CheckCircle2 size={15} />, label: 'Authorise Bills/Accounts Receivables', badge: 'Auth' },
  { icon: <ShieldCheck size={15} />, label: 'Approve Payment Voucher (PV)', badge: 'Audit' },
  { icon: <DollarSign size={15} />, label: 'Official Fee Schedule', badge: 'Bill' },
  { icon: <LayoutDashboard size={15} />, label: 'Financial Overview', badge: null },
  { icon: <CreditCard size={15} />, label: 'Fee Ledgers & Payments', badge: null },
  { icon: <Send size={15} />, label: 'Send Owing Reminders', badge: null },
  { icon: <Users size={15} />, label: 'Students & Teachers', badge: null },
  { icon: <MessageSquare size={15} />, label: 'Sent Messages Log', badge: null },
];

const SIMS_DATA = {
  'Student Services Centre': [
    {
      category: 'Admissions',
      links: [
        'Add new Admissions',
        'Edit Existing Admissions',
        'Change Student\'s Photo'
      ]
    },
    {
      category: 'Semester Registration',
      links: [
        '1st Timers Semester Enrollment',
        'Continuing Student Semester Registration',
        'Delete Semester Registration'
      ]
    },
    {
      category: 'Student\'s Progressive Reports',
      links: [
        'Register New Examination Candidate',
        'Register Student for a Specific Subject Examination',
        'Cancel Exams Registration',
        'Print Student\'s Progressive Report',
        'Print Class Based Progressive Report',
        'Print Creche\' Based Progressive Report'
      ]
    },
    {
      category: 'Billings & Accounts',
      links: [
        'Print Student\'s Academic Bill',
        'Print student ledger'
      ]
    },
    {
      category: 'Registers',
      links: [
        'Preview Registers',
        'View registered students per class/Sub class per semester',
        'View Un-Authorised Lists of Creche Progress Reports',
        'Preview Lists of Parents and their Wards'
      ]
    }
  ],
  'Academics': [
    {
      category: 'Student\'s Progressive Evaluation',
      links: [
        'Prepare Exams Score',
        'Score Sheet [Entry]',
        'Creche Terminal Evaluation',
        'View Pending Test Results',
        'View registered students per class/Sub class per semester',
        'View Un-Authorised Lists of Creche Progress Reports',
        'Prepare Creche Progressive Reports',
        'Pre-audit & approve exams scores'
      ]
    },
    {
      category: 'Print Assessments Reports',
      links: [
        'Print Individual terminal report',
        'Print Individual terminal report by year Group',
        'Print Class terminal report',
        'Print Subject Based Assessments',
        'Preview Subject Based Assessment Per Subject Per Term',
        'Print Consolidated Subject Based Assessments',
        'Consolidated Subject Based Assessment'
      ]
    }
  ],
  'Finance & Administration': [
    {
      category: 'Student\'s Billings & Accounts',
      links: [
        'Prepare Student academic Bill',
        'Receive Payments from Students',
        'Issue Other receipts',
        'Batch Processing',
        'Re-print Commercial Receipt',
        'Print & Post Student\'s Academic Bill',
        'Print student ledger'
      ]
    },
    {
      category: 'Back office Internal Accounts',
      links: [
        'Prepare Bills/Accounts Payables',
        'Create New Accounts/Bills Receivables (Record Entry)',
        'Pre Audit Approve Payment Voucher (PV)',
        'Authorise Accounts/Bills Receivables',
        'Pay PV',
        'Print Out PV'
      ]
    },
    {
      category: 'HR & Payroll',
      links: [
        'Employee Details',
        'List of Staff',
        'Prepare Payroll',
        'Delete Payroll'
      ]
    },
    {
      category: 'Accounts & Financial Reports',
      links: [
        'Accounts',
        'Financial statements',
        'HR Payroll Reports',
        'List of Staff'
      ]
    }
  ],
  'System Administrator': [
    {
      category: 'User Account Management',
      links: [
        'Create new User Account',
        'Reset User Password',
        'User account status'
      ]
    },
    {
      category: 'Finance & Admin Settings',
      subCategories: [
        {
          title: 'Charts of Accounts',
          links: [
            'Define Assets Charts of Accounts',
            'Setup Liabilities Share Holder\'s Charts of Accounts',
            'Create Profits Loss Charts of Accounts'
          ]
        },
        {
          title: 'Billings & Others',
          links: [
            'Define Bill Items',
            'Adjust Bills on Year Group Accounts',
            'Cancel Student Bill',
            'Configure Merchants',
            'Manage Clients & Service Providers'
          ]
        }
      ]
    },
    {
      category: 'HR Payroll settings',
      links: [
        'Income Tax rate',
        'SSNIT Settings',
        'Organisation\'s header',
        'Close Month',
        'Close Year'
      ]
    },
    {
      category: 'Academic settings',
      links: [
        'Departments & Sub Units',
        'Academic year settings',
        'Semester/term settings',
        'Class settings',
        'Sub class settings',
        'Class master',
        'Subject Lists',
        'Subject Instructors',
        'Grade points',
        'Creche Subjects category',
        'Creche activities'
      ]
    },
    {
      category: 'Transport & Feeding Settings',
      links: [
        'Route settings',
        'Configure Feeding Fees'
      ]
    }
  ]
};

export default function AccountantPortal({ onSignOut }) {
  const [activeNav, setActiveNav] = useState('SIMS v2025 Module');
  const [simsTab, setSimsTab] = useState('Student Services Centre');
  const [simsSearchQuery, setSimsSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [feeFilter, setFeeFilter] = useState('All');

  // Interactive SIMS Modal State
  const [activeSimsModal, setActiveSimsModal] = useState(null);

  // Standard Modals state
  const [selectedFeeForPayment, setSelectedFeeForPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Mobile Money');
  const [paymentNotes, setPaymentNotes] = useState('');

  const [selectedFeeForReminder, setSelectedFeeForReminder] = useState(null);
  const [reminderSubject, setReminderSubject] = useState('Outstanding School Fees Notice');
  const [reminderBody, setReminderBody] = useState('');

  const [successNotice, setSuccessNotice] = useState('');

  const {
    studentFees,
    teacherDirectory,
    onboardedStudents,
    accountantMessages,
    recordFeePayment,
    sendAccountantMessage,
    onboardStudent,
    addServiceRecord,
  } = usePortalData();

  const totalBilled = (studentFees || []).reduce((acc, item) => acc + (item.billedAmount || 0), 0);
  const totalPaid = (studentFees || []).reduce((acc, item) => acc + (item.paidAmount || 0), 0);
  const totalOutstanding = totalBilled - totalPaid;
  const owingCount = (studentFees || []).filter((item) => item.balance > 0).length;
  const paidCount = (studentFees || []).filter((item) => item.balance === 0).length;

  const STATS = [
    { label: 'Total Revenue Billed', value: `GHS ${totalBilled.toLocaleString()}`, trend: 'Term 1 · 2026', icon: '💳', bg: '#e0f2fe', ic: '#0369a1' },
    { label: 'Total Collected', value: `GHS ${totalPaid.toLocaleString()}`, trend: `${Math.round((totalPaid / (totalBilled || 1)) * 100)}% collected`, icon: '✅', bg: '#dcfce7', ic: '#15803d' },
    { label: 'Outstanding Balance', value: `GHS ${totalOutstanding.toLocaleString()}`, trend: `${owingCount} accounts owing`, icon: '⚠️', bg: '#fee2e2', ic: '#b91c1c' },
    { label: 'Settled Accounts', value: String(paidCount), trend: `Out of ${studentFees.length} students`, icon: '🎉', bg: '#fef3c7', ic: '#b45309' },
  ];

  const filteredFees = (studentFees || []).filter((fee) => {
    const matchesSearch =
      fee.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fee.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fee.guardianName.toLowerCase().includes(searchQuery.toLowerCase());

    if (feeFilter === 'Paid') return matchesSearch && fee.balance === 0;
    if (feeFilter === 'Owing') return matchesSearch && fee.balance > 0;
    return matchesSearch;
  });

  const handleOpenPayment = (fee) => {
    setSelectedFeeForPayment(fee);
    setPaymentAmount(String(fee.balance));
    setPaymentNotes('');
  };

  const handleProcessPayment = (e) => {
    e.preventDefault();
    if (!selectedFeeForPayment || !paymentAmount) return;

    recordFeePayment({
      id: selectedFeeForPayment.id,
      paidAmount: Number(paymentAmount),
      paymentMethod,
      notes: paymentNotes,
    });

    setSuccessNotice(`Payment of GHS ${Number(paymentAmount).toLocaleString()} recorded for ${selectedFeeForPayment.studentName}!`);
    setSelectedFeeForPayment(null);
    setTimeout(() => setSuccessNotice(''), 4000);
  };

  const handleOpenReminder = (fee) => {
    setSelectedFeeForReminder(fee);
    setReminderSubject(`Outstanding School Fees Notice - ${fee.studentName}`);
    setReminderBody(
      `Dear ${fee.guardianName},\n\nThis is a notification from the REMALJ Carewell Accounts Office regarding ${fee.studentName}. An outstanding fee balance of GHS ${fee.balance.toLocaleString()} is due for ${fee.term}.\n\nKindly make arrangements to settle this balance at your earliest convenience via Mobile Money or Bank Transfer.\n\nThank you,\nAccounts & Finance Department`
    );
  };

  const handleSendReminder = (e) => {
    e.preventDefault();
    if (!selectedFeeForReminder || !reminderBody) return;

    sendAccountantMessage({
      to: selectedFeeForReminder.guardianName,
      recipientEmail: selectedFeeForReminder.guardianEmail,
      studentName: selectedFeeForReminder.studentName,
      subject: reminderSubject,
      body: reminderBody,
    });

    setSuccessNotice(`Payment reminder message sent to ${selectedFeeForReminder.guardianName}!`);
    setSelectedFeeForReminder(null);
    setTimeout(() => setSuccessNotice(''), 4000);
  };

  // Open specific functional link modal
  const handleLinkClick = (category, link) => {
    const student = (onboardedStudents || [])[0] || { fullName: 'Benjamin Edwards', studentId: 'REMALJ-2026-001' };
    setActiveSimsModal({
      category,
      link,
      studentName: student.fullName,
      studentId: student.studentId,
      guardianName: student.guardianName || 'Mrs. Angela Edwards',
      level: student.level || 'JHS 2',
      amount: '4800',
      cardId: 'CRD-88910',
      notes: '',
      settingVal: '17.5%',
      // Default custom form values per type
      candidateIndex: '0204891002',
      subjectName: 'Pure Mathematics',
      vendorName: 'Ghana Water Company Ltd.',
      invoiceNo: 'INV-2026-881',
      pvRef: 'PV-2026-044',
      userName: 'g.accountant@remaljcarewell.edu.gh',
      userRole: 'Accountant',
      accountCode: '1010',
      accountName: 'Barclays Main Operational Account',
      taxRate: '17.5%',
      ssnitRate: '5.5%',
      routeFee: '500',
      feedingFee: '800',
    });
  };

  const handleSimsModalSubmit = (e) => {
    e.preventDefault();
    if (!activeSimsModal) return;

    const { link, studentName, amount, cardId } = activeSimsModal;

    if (link.includes('Payment') || link.includes('Pay') || link.includes('Receive')) {
      const fee = (studentFees || []).find((f) => studentName && f.studentName?.toLowerCase() === studentName.toLowerCase()) || studentFees[0];
      if (fee) {
        recordFeePayment({
          id: fee.id,
          paidAmount: Number(amount) || 500,
          paymentMethod: 'Cash / Bank',
          notes: `${link} processed in SIMS module`,
        });
      }
    } else if (link.includes('Card') || link.includes('Bus') || link.includes('Feeding')) {
      addServiceRecord({
        module: 'Card Services & Feeding',
        person: studentName,
        detail: `${link} processed. Card/Tag ID: ${cardId}`,
        status: 'Approved',
      });
    }

    setSuccessNotice(`[SIMS Action Executed] Successfully completed: "${link}" for ${studentName || 'System'}!`);
    setActiveSimsModal(null);
    setTimeout(() => setSuccessNotice(''), 5000);
  };

  return (
    <div className="portal">
      <div className="portal__layout">
        {/* Sidebar */}
        <aside className="portal__sidebar">
          <div style={{ margin: '0 0 16px', padding: '14px', background: ACCOUNT_LIGHT, borderRadius: 'var(--radius-md)', borderLeft: `4px solid ${ACCOUNT_BG}` }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: ACCOUNT_BG }}>Accountant Portal</div>
            <div style={{ fontSize: 11, color: '#0369a1', marginTop: 2 }}>{getAuthUser()?.fullName || getAuthUser()?.name || 'Mrs. Grace Accountant'} · Finance Office</div>
          </div>
          <span className="sidebar-section-label">Financial Management</span>
          {NAV.map((item) => (
            <button
              key={item.label}
              className={`sidebar-item${activeNav === item.label ? ' active' : ''}`}
              style={activeNav === item.label ? { background: ACCOUNT_BG } : {}}
              onClick={() => setActiveNav(item.label)}
            >
              <span className="sidebar-item__icon">{item.icon}</span>
              {item.label}
              {item.badge && <span className="sidebar-item__badge" style={{ background: '#f43f5e', color: 'white' }}>{item.badge}</span>}
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="portal__content">
          {successNotice && (
            <div style={{
              padding: '12px 18px', background: '#dcfce7', border: '1px solid #86efac', color: '#166534',
              borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 13, marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <CheckCircle2 size={16} />
              {successNotice}
            </div>
          )}

          {/* ── SIMS v2025 MODULE VIEW ── */}
          {activeNav === 'SIMS v2025 Module' && (
            <div className="animate-fade-up">
              {/* SIMS [School Info Management System] AUTHENTICATION / LOGIN HEADER BAR */}
              <SimsAuthenticationHeaderBar />

              {/* SIMS v2025 HERO COMMAND BANNER */}
              <div className="sims-header" style={{ marginBottom: 20 }}>
                <div className="sims-header__top">
                  <div className="sims-header__brand">
                    <School size={22} color="#38bdf8" />
                    <span>SIMS v2025 Enterprise Command Module</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, background: 'rgba(255,255,255,0.12)', padding: '4px 12px', borderRadius: 20, color: '#e0f2fe', border: '1px solid rgba(255,255,255,0.2)', fontWeight: 700 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34c57a', display: 'inline-block', boxShadow: '0 0 8px #34c57a' }} />
                      🟢 System Operational · Build v2025.4
                    </span>
                    <span style={{ fontSize: 11, background: '#0284c7', color: '#fff', padding: '4px 10px', borderRadius: 20, fontWeight: 800 }}>
                      Institutional Edition
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: 8, color: '#e0f2fe', fontSize: 13, opacity: 0.9 }}>
                  Unified Administrative & Financial Command Center for REMALJ Carewell Inspirational School.
                </div>

                {/* Hub Navigation Tabs */}
                <div className="sims-header__tabs" style={{ marginTop: 16 }}>
                  {[
                    { label: 'Student Services Centre', icon: <Users size={14} />, count: 5 },
                    { label: 'Academics', icon: <School size={14} />, count: 3 },
                    { label: 'Finance & Administration', icon: <DollarSign size={14} />, count: 4 },
                    { label: 'System Administrator', icon: <Sliders size={14} />, count: 5 }
                  ].map((tabObj) => (
                    <button
                      key={tabObj.label}
                      className={`sims-tab-btn ${simsTab === tabObj.label ? 'active' : ''}`}
                      onClick={() => setSimsTab(tabObj.label)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                    >
                      {tabObj.icon}
                      <span>{tabObj.label}</span>
                      <span style={{
                        fontSize: 10, padding: '2px 6px', borderRadius: 10,
                        background: simsTab === tabObj.label ? '#0f3a4b' : 'rgba(255,255,255,0.2)',
                        color: simsTab === tabObj.label ? '#fff' : '#e0f2fe', fontWeight: 800
                      }}>
                        {tabObj.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SIMS Command Search & Quick Actions Bar */}
              <div className="panel" style={{ padding: 18, marginBottom: 20, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--gray-400)' }} />
                    <input
                      type="text"
                      placeholder="Search across 50+ SIMS v2025 action commands (e.g. Bill, Report, Admissions, Payroll)..."
                      value={simsSearchQuery}
                      onChange={(e) => setSimsSearchQuery(e.target.value)}
                      style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-300)', fontSize: 13, background: '#f8fafc' }}
                    />
                    {simsSearchQuery && (
                      <button
                        onClick={() => setSimsSearchQuery('')}
                        style={{ position: 'absolute', right: 10, top: 10, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--gray-500)', fontSize: 12, fontWeight: 800 }}
                      >
                        ✕ Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Frequently Launched SIMS Commands Bar */}
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--gray-200)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#0f3a4b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>⚡</span> Quick Launch:
                  </span>

                  {[
                    { cat: 'Admissions', link: 'Add new Admissions', icon: <UserPlus size={12} /> },
                    { cat: 'Student\'s Billings & Accounts', link: 'Prepare Student academic Bill', icon: <DollarSign size={12} /> },
                    { cat: 'Student\'s Progressive Reports', link: 'Print Student\'s Progressive Report', icon: <Printer size={12} /> },
                    { cat: 'Student\'s Billings & Accounts', link: 'Receive Payments from Students', icon: <CreditCard size={12} /> },
                    { cat: 'User Account Management', link: 'Create new User Account', icon: <UserCheck size={12} /> },
                  ].map((chip) => (
                    <button
                      key={chip.link}
                      onClick={() => handleLinkClick(chip.cat, chip.link)}
                      style={{
                        padding: '5px 12px', background: '#f0f9ff', border: '1px solid #bae6fd',
                        borderRadius: 20, color: '#0369a1', fontSize: 12, fontWeight: 700,
                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {chip.icon}
                      {chip.link}
                    </button>
                  ))}
                </div>
              </div>

              {/* SIMS Main Content Grid */}
              <div className="sims-content-panel">
                <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0f3a4b', margin: 0, fontFamily: 'var(--font-display)' }}>
                      {simsSearchQuery ? `SIMS Search Results for "${simsSearchQuery}"` : simsTab}
                    </h2>
                    <p style={{ fontSize: 13, color: 'var(--gray-500)', margin: '2px 0 0' }}>
                      {simsSearchQuery
                        ? 'Showing matching SIMS v2025 administrative commands across all hubs.'
                        : 'Select an administrative workflow link below to execute live actions.'}
                    </p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: 6, border: '1px solid #bae6fd' }}>
                    {SIMS_DATA[simsTab]?.length || 0} Functional Categories
                  </span>
                </div>

                <div className="sims-grid">
                  {(simsSearchQuery ? Object.values(SIMS_DATA).flat() : SIMS_DATA[simsTab])?.map((catItem, idx) => {
                    const filteredLinks = (catItem.links || []).filter(lnk =>
                      !simsSearchQuery || lnk.toLowerCase().includes(simsSearchQuery.toLowerCase()) || catItem.category.toLowerCase().includes(simsSearchQuery.toLowerCase())
                    );

                    const filteredSubCats = (catItem.subCategories || []).map(sub => ({
                      ...sub,
                      links: sub.links.filter(lnk => !simsSearchQuery || lnk.toLowerCase().includes(simsSearchQuery.toLowerCase()) || sub.title.toLowerCase().includes(simsSearchQuery.toLowerCase()))
                    })).filter(sub => sub.links.length > 0);

                    if (simsSearchQuery && filteredLinks.length === 0 && filteredSubCats.length === 0) return null;

                    const getIcon = (catName) => {
                      if (catName.includes('Admissions') || catName.includes('Registration')) return <UserCheck size={16} color="#0284c7" />;
                      if (catName.includes('Reports') || catName.includes('Evaluation') || catName.includes('Assessments')) return <FileCheck size={16} color="#0284c7" />;
                      if (catName.includes('Billings') || catName.includes('Accounts') || catName.includes('Payroll') || catName.includes('Finance')) return <DollarSign size={16} color="#0284c7" />;
                      if (catName.includes('Registers')) return <Users size={16} color="#0284c7" />;
                      if (catName.includes('Remarks')) return <MessageSquare size={16} color="#0284c7" />;
                      if (catName.includes('Academic') || catName.includes('User') || catName.includes('Settings')) return <ShieldCheck size={16} color="#0284c7" />;
                      return <Layers size={16} color="#0284c7" />;
                    };

                    return (
                      <div className="sims-category" key={`${catItem.category}-${idx}`}>
                        <h3 className="sims-category-title">
                          {getIcon(catItem.category)}
                          {catItem.category}
                        </h3>

                        {/* Render direct links */}
                        {filteredLinks.map((lnk, lIdx) => (
                          <button
                            key={lIdx}
                            className="sims-link-item"
                            onClick={() => handleLinkClick(catItem.category, lnk)}
                          >
                            <span>{lnk}</span>
                            <ChevronRight size={13} style={{ opacity: 0.5, flexShrink: 0 }} />
                          </button>
                        ))}

                        {/* Render subcategories if present */}
                        {filteredSubCats.map((sub, sIdx) => (
                          <div key={sIdx} style={{ marginTop: 8 }}>
                            <h4 className="sims-subcategory-title">{sub.title}</h4>
                            {sub.links.map((subLnk, subIdx) => (
                              <button
                                key={subIdx}
                                className="sims-link-item"
                                style={{ marginTop: 4 }}
                                onClick={() => handleLinkClick(sub.title, subLnk)}
                              >
                                <span>{subLnk}</span>
                                <ChevronRight size={13} style={{ opacity: 0.5, flexShrink: 0 }} />
                              </button>
                            ))}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── FINANCIAL OVERVIEW ── */}
          {activeNav === 'Financial Overview' && (
            <div className="animate-fade-up">
              <div className="page-header">
                <p className="page-header__eyebrow" style={{ color: ACCOUNT_ACCENT }}>
                  <span style={{ background: ACCOUNT_LIGHT, padding: '2px 10px', borderRadius: 99, border: '1px solid #bae6fd' }}>
                    Accounts & Revenue Management
                  </span>
                </p>
                <h1 className="page-header__title">Financial Dashboard 💰</h1>
                <p className="page-header__subtitle">
                  Monitor fee collection status, track student debt, process payments, and dispatch reminders to parents.
                </p>
              </div>

              {/* Stats */}
              <div className="stats-grid">
                {STATS.map((s) => (
                  <div className="stat-card" key={s.label}>
                    <div className="stat-card__icon" style={{ background: s.bg, color: s.ic, fontSize: 20 }}>{s.icon}</div>
                    <div>
                      <div className="stat-card__value">{s.value}</div>
                      <div className="stat-card__label">{s.label}</div>
                    </div>
                    <div className="stat-card__trend" style={{ color: s.ic }}>{s.trend}</div>
                  </div>
                ))}
              </div>

              {/* Quick Actions & Debt Summary */}
              <div className="content-grid" style={{ marginTop: 24 }}>
                <div className="panel" style={{ flex: 2 }}>
                  <div className="panel__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 className="panel__title">Students Owing Fees ({owingCount})</h2>
                    <button
                      onClick={() => setActiveNav('Fee Ledgers & Payments')}
                      style={{ fontSize: 12, color: ACCOUNT_ACCENT, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                    >
                      View All Ledgers →
                    </button>
                  </div>
                  <div className="panel__body">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Guardian</th>
                          <th>Term Billed</th>
                          <th>Paid</th>
                          <th>Balance Due</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentFees.filter(f => f.balance > 0).map((fee) => (
                          <tr key={fee.id}>
                            <td>
                              <div style={{ fontWeight: 700 }}>{fee.studentName}</div>
                              <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{fee.studentId}</div>
                            </td>
                            <td>
                              <div style={{ fontSize: 13 }}>{fee.guardianName}</div>
                              <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{fee.guardianEmail}</div>
                            </td>
                            <td>GHS {fee.billedAmount.toLocaleString()}</td>
                            <td>GHS {fee.paidAmount.toLocaleString()}</td>
                            <td>
                              <span className="status-pill status-pill--warn">
                                GHS {fee.balance.toLocaleString()}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  onClick={() => handleOpenPayment(fee)}
                                  style={{ padding: '4px 10px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                >
                                  Record Payment
                                </button>
                                <button
                                  onClick={() => handleOpenReminder(fee)}
                                  style={{ padding: '4px 10px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                                >
                                  Message Parent
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {studentFees.filter(f => f.balance > 0).length === 0 && (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: 24, color: 'var(--gray-400)' }}>
                              🎉 All student fee accounts are fully paid!
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="panel" style={{ flex: 1 }}>
                  <div className="panel__header">
                    <h2 className="panel__title">Recent Payment Reminders</h2>
                  </div>
                  <div className="panel__body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(accountantMessages || []).slice(0, 4).map((msg) => (
                      <div key={msg.id} style={{ padding: 12, background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--gray-900)' }}>To: {msg.to || msg.recipientEmail}</span>
                          <span style={{ fontSize: 10, color: 'var(--gray-400)' }}>{msg.sentAt}</span>
                        </div>
                        <div style={{ fontSize: 11, color: ACCOUNT_ACCENT, fontWeight: 700, marginBottom: 4 }}>{msg.subject}</div>
                        <p style={{ fontSize: 11.5, color: 'var(--gray-600)', lineHeight: 1.4 }}>{msg.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── FEE LEDGERS & PAYMENTS ── */}
          {activeNav === 'Fee Ledgers & Payments' && (
            <div className="animate-fade-up">
              <div className="page-header">
                <h1 className="page-header__title">Student Fee Ledgers</h1>
                <p className="page-header__subtitle">Manage student fee payments, view transaction status, and record new payments.</p>
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--gray-400)' }} />
                  <input
                    type="text"
                    placeholder="Search by student name, ID, or guardian..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-300)', fontSize: 13 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  {['All', 'Paid', 'Owing'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setFeeFilter(filter)}
                      style={{
                        padding: '8px 16px', borderRadius: 'var(--radius-md)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        background: feeFilter === filter ? ACCOUNT_BG : 'var(--gray-100)',
                        color: feeFilter === filter ? '#fff' : 'var(--gray-700)',
                        border: 'none',
                      }}
                    >
                      {filter} Accounts
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Student Name</th>
                      <th>Guardian Details</th>
                      <th>Term</th>
                      <th>Billed Amount</th>
                      <th>Paid Amount</th>
                      <th>Balance</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFees.map((fee) => (
                      <tr key={fee.id}>
                        <td><code>{fee.studentId}</code></td>
                        <td><strong>{fee.studentName}</strong></td>
                        <td>
                          <div>{fee.guardianName}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{fee.guardianEmail}</div>
                        </td>
                        <td>{fee.term}</td>
                        <td>GHS {fee.billedAmount.toLocaleString()}</td>
                        <td style={{ color: '#16a34a', fontWeight: 700 }}>GHS {fee.paidAmount.toLocaleString()}</td>
                        <td style={{ color: fee.balance > 0 ? '#dc2626' : 'var(--gray-700)', fontWeight: 700 }}>
                          GHS {fee.balance.toLocaleString()}
                        </td>
                        <td>
                          <span className={`status-pill ${fee.balance === 0 ? 'status-pill--success' : 'status-pill--warn'}`}>
                            {fee.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => handleOpenPayment(fee)}
                              style={{ padding: '6px 12px', background: ACCOUNT_ACCENT, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                            >
                              Record Payment
                            </button>
                            {fee.balance > 0 && (
                              <button
                                onClick={() => handleOpenReminder(fee)}
                                style={{ padding: '6px 12px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                              >
                                Message Parent
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SEND OWING REMINDERS ── */}
          {activeNav === 'Send Owing Reminders' && (
            <div className="animate-fade-up">
              <div className="page-header">
                <h1 className="page-header__title">Send Owing Reminders to Parents</h1>
                <p className="page-header__subtitle">Dispatches instant fee payment notices directly to parent accounts and emails.</p>
              </div>

              <div className="content-grid">
                <div className="panel" style={{ flex: 1 }}>
                  <div className="panel__header">
                    <h2 className="panel__title">Select Student Owing</h2>
                  </div>
                  <div className="panel__body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {studentFees.filter(f => f.balance > 0).map((fee) => (
                      <div
                        key={fee.id}
                        onClick={() => handleOpenReminder(fee)}
                        style={{
                          padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)',
                          cursor: 'pointer', background: selectedFeeForReminder?.id === fee.id ? ACCOUNT_LIGHT : '#fff',
                          transition: 'all 150ms',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 13 }}>
                          <span>{fee.studentName}</span>
                          <span style={{ color: '#dc2626' }}>GHS {fee.balance.toLocaleString()} owing</span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2 }}>
                          Guardian: {fee.guardianName} ({fee.guardianEmail})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel" style={{ flex: 2 }}>
                  <div className="panel__header">
                    <h2 className="panel__title">Compose Payment Message</h2>
                  </div>
                  {selectedFeeForReminder ? (
                    <form className="panel__body workflow-form" onSubmit={handleSendReminder}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label>Guardian Name</label>
                          <input type="text" value={selectedFeeForReminder.guardianName} disabled readOnly />
                        </div>
                        <div>
                          <label>Guardian Email</label>
                          <input type="text" value={selectedFeeForReminder.guardianEmail} disabled readOnly />
                        </div>
                      </div>

                      <label>Subject</label>
                      <input
                        type="text"
                        value={reminderSubject}
                        onChange={(e) => setReminderSubject(e.target.value)}
                        required
                      />

                      <label>Message Content</label>
                      <textarea
                        rows="8"
                        value={reminderBody}
                        onChange={(e) => setReminderBody(e.target.value)}
                        required
                      />

                      <button className="workflow-button" type="submit" style={{ background: ACCOUNT_BG }}>
                        <Send size={15} /> Send Payment Notice to Parent
                      </button>
                    </form>
                  ) : (
                    <div className="panel__body" style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>
                      Select a student from the list on the left to compose and send a payment reminder message.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── STUDENTS & TEACHERS DIRECTORY ── */}
          {activeNav === 'Students & Teachers' && (
            <div className="animate-fade-up">
              <div className="page-header">
                <h1 className="page-header__title">Students & Assigned Teachers Directory</h1>
                <p className="page-header__subtitle">View all registered students, their level, guardian details, fee status, and assigned teaching staff.</p>
              </div>

              <div className="panel">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Class / Level</th>
                      <th>Assigned Class Teacher</th>
                      <th>Guardian Contact</th>
                      <th>Fee Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(onboardedStudents || []).map((stu) => {
                      const fee = studentFees.find((f) => f.studentId === stu.studentId) || { balance: 0, status: 'Active' };
                      const teacher = teacherDirectory.find((t) => t.classAssigned.includes(stu.level) || t.classAssigned.includes('Grade 4')) || teacherDirectory[0];

                      return (
                        <tr key={stu.id}>
                          <td>
                            <div style={{ fontWeight: 700 }}>{stu.fullName}</div>
                            <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{stu.studentId} · {stu.studentEmail}</div>
                          </td>
                          <td>
                            <span style={{ padding: '2px 8px', background: 'var(--gray-100)', borderRadius: 6, fontWeight: 600, fontSize: 12 }}>
                              {stu.level} ({stu.classSection || 'Sec A'})
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 18 }}>{teacher.photo || '👨‍🏫'}</span>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 13 }}>{teacher.name}</div>
                                <div style={{ fontSize: 11, color: ACCOUNT_ACCENT }}>{teacher.subject}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: 13 }}>{stu.guardianName}</div>
                            <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>📞 {stu.guardianPhone} · {stu.guardianEmail}</div>
                          </td>
                          <td>
                            <span className={`status-pill ${fee.balance === 0 ? 'status-pill--success' : 'status-pill--warn'}`}>
                              {fee.balance > 0 ? `Owing GHS ${fee.balance.toLocaleString()}` : 'Paid in Full'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SENT MESSAGES LOG ── */}
          {activeNav === 'Sent Messages Log' && (
            <div className="animate-fade-up">
              <div className="page-header">
                <h1 className="page-header__title">Sent Accountant Messages Log</h1>
                <p className="page-header__subtitle">Complete record of payment notices dispatched to parents and guardians.</p>
              </div>

              <div className="panel">
                <div className="panel__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {(accountantMessages || []).map((msg) => (
                    <article key={msg.id} style={{ padding: 16, background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <strong style={{ fontSize: 14, color: 'var(--gray-900)' }}>Subject: {msg.subject}</strong>
                        <span style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 600 }}>{msg.sentAt}</span>
                      </div>
                      <div style={{ fontSize: 12, color: ACCOUNT_ACCENT, fontWeight: 700, marginBottom: 8 }}>
                        Recipient: {msg.to} ({msg.recipientEmail || 'Parent Inbox'})
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--gray-700)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{msg.body}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── POST ACADEMIC BILL HEADER VIEW ── */}
          {activeNav === 'Post Academic Bill Header' && (
            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', padding: 12 }}>
              <PrepareStudentAcademicBillForm setM={() => {}} students={onboardedStudents || []} />
            </div>
          )}

          {/* ── RECEIVE PAYMENTS VIEW ── */}
          {activeNav === 'Receive Payments' && (
            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', padding: 12 }}>
              <ReceivePaymentsForm setM={() => {}} students={onboardedStudents || []} recordFeePayment={recordFeePayment} />
            </div>
          )}

          {/* ── RECEIVE OTHER PAYMENTS VIEW ── */}
          {activeNav === 'Receive Other Payments' && (
            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', padding: 12 }}>
              <ReceiveOtherPaymentsForm setM={() => {}} />
            </div>
          )}

          {/* ── BATCH PROCESSING VIEW ── */}
          {activeNav === 'Batch Processing' && (
            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', padding: 12 }}>
              <BatchProcessingForm setM={() => {}} students={onboardedStudents || []} recordFeePayment={recordFeePayment} />
            </div>
          )}

          {/* ── REPRINT COMMERCIAL RECEIPT VIEW ── */}
          {activeNav === 'Reprint Commercial Receipt' && (
            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', padding: 12 }}>
              <ReprintCommercialReceiptForm setM={() => {}} />
            </div>
          )}

          {/* ── PRINT INDIVIDUAL STUDENT BILL VIEW ── */}
          {activeNav === 'Print Individual Student Bill' && (
            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', padding: 12 }}>
              <PrintIndividualStudentBillForm setM={() => {}} students={onboardedStudents || []} />
            </div>
          )}

          {/* ── OTHER ACCOUNTS RECEIVABLES VIEW ── */}
          {activeNav === 'Other Accounts Receivables' && (
            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', padding: 12 }}>
              <OtherAccountsReceivablesForm setM={() => {}} students={onboardedStudents || []} />
            </div>
          )}

          {/* ── AUTHORISE BILLS/ACCOUNTS RECEIVABLES VIEW ── */}
          {activeNav === 'Authorise Bills/Accounts Receivables' && (
            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', padding: 12 }}>
              <AuthoriseBillsReceivablesForm setM={() => {}} students={onboardedStudents || []} />
            </div>
          )}

          {/* ── APPROVE PV VIEW ── */}
          {activeNav === 'Approve Payment Voucher (PV)' && (
            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', padding: 12 }}>
              <ApprovePVForm setM={() => {}} />
            </div>
          )}

          {/* ── PAY PV VIEW ── */}
          {activeNav === 'Pay PV' && (
            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', padding: 12 }}>
              <PayPVForm setM={() => {}} />
            </div>
          )}

          {/* ── PRINT OUT PV VIEW ── */}
          {activeNav === 'Print Out PV' && (
            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', padding: 12 }}>
              <PrintPVForm setM={() => {}} />
            </div>
          )}

          {/* ── EMPLOYEE PROFILE VIEW ── */}
          {(activeNav === 'Employee Details' || activeNav === "Employee's Profile") && (
            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', padding: 12 }}>
              <EmployeeProfileForm setM={() => {}} />
            </div>
          )}

          {/* ── MONTHLY PAYROLL SERVICE VIEW ── */}
          {(activeNav === 'Prepare Payroll' || activeNav === 'Delete Payroll' || activeNav === 'Monthly Payroll Service') && (
            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', padding: 12 }}>
              <MonthlyPayrollServiceForm setM={() => {}} />
            </div>
          )}

          {/* ── ACCOUNTS & FINANCIAL REPORTS TREE VIEW ── */}
          {activeNav === 'Accounts & Financial Reports' && (
            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', padding: 12 }}>
              <AccountsAndFinancialReportsTree onSelectReport={(r) => setActiveSimsModal({ category: 'Accounts & Financial Reports', link: r })} />
            </div>
          )}

          {/* ── TRIAL BALANCE ACCOUNTS VIEW ── */}
          {(activeNav === 'Trial Balance - Accounts' || activeNav === 'Trial Balance' || activeNav === 'Print PL/Accounts Balances') && (
            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', padding: 12 }}>
              <TrialBalanceAccountsForm setM={() => {}} />
            </div>
          )}

          {/* ── PRINT ACCOUNT STATEMENT VIEW ── */}
          {(activeNav === 'Print Account Statement' || activeNav === 'Print Internal Account Statement') && (
            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', padding: 12 }}>
              <PrintAccountStatementForm setM={() => {}} />
            </div>
          )}

          {/* ── PRINT ALL POST CLASS STUDENTS BILLS VIEW ── */}
          {(activeNav === 'Print all post class students bills' || activeNav === 'Print all next term student academic bill') && (
            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', padding: 12 }}>
              <PrintAllPostClassStudentsBillsForm setM={() => {}} />
            </div>
          )}

          {/* ── BALANCE SHEET VIEW ── */}
          {(activeNav === 'Print statement of financial position [Balance sheet]' || activeNav === 'Balance Sheet' || activeNav === 'Statement of Financial Position') && (
            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', padding: 12 }}>
              <BalanceSheetForm setM={() => {}} />
            </div>
          )}

          {/* ── MONTHLY PAYROLL REPORT VIEW ── */}
          {(activeNav === 'Print monthly payroll report' || activeNav === 'Monthly Payroll Report') && (
            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', padding: 12 }}>
              <MonthlyPayrollReportForm setM={() => {}} />
            </div>
          )}

          {/* ── EMPLOYEE PAYSLIP VIEW ── */}
          {(activeNav === 'Print Pay Slips' || activeNav === 'Employee Payslip' || activeNav === 'Pay Slips' || activeNav === 'Pay Slip') && (
            <div style={{ background: '#ffffff', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', padding: 12 }}>
              <EmployeePayslipForm setM={() => {}} />
            </div>
          )}

          {/* ── SIMS AUTH & LOGIN TERMINAL VIEW ── */}
          {activeNav === 'SIMS Auth & Login Terminal' && (
            <SimsAuthTerminalView onOpenSimsModal={setActiveSimsModal} />
          )}

          {/* ── OFFICIAL FEE SCHEDULE VIEW ── */}
          {activeNav === 'Official Fee Schedule' && (
            <OfficialSchoolFeeStructure onOpenSimsModal={setActiveSimsModal} />
          )}

          {/* ── DYNAMIC TAILORED SIMS MODAL RENDERER ── */}
          {activeSimsModal && (
            <SimsModalRenderer
              modalData={activeSimsModal}
              setModalData={setActiveSimsModal}
              onClose={() => setActiveSimsModal(null)}
              onSubmit={handleSimsModalSubmit}
              students={onboardedStudents || []}
            />
          )}

          {/* ── RECORD PAYMENT MODAL ── */}
          {selectedFeeForPayment && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20
            }}>
              <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-xl)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--gray-900)' }}>Record Fee Payment</h2>
                  <button onClick={() => setSelectedFeeForPayment(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>✕</button>
                </div>

                <div style={{ padding: 12, background: ACCOUNT_LIGHT, borderRadius: 'var(--radius-md)', marginBottom: 16, fontSize: 13 }}>
                  <div><strong>Student:</strong> {selectedFeeForPayment.studentName} ({selectedFeeForPayment.studentId})</div>
                  <div><strong>Billed:</strong> GHS {selectedFeeForPayment.billedAmount.toLocaleString()}</div>
                  <div><strong>Already Paid:</strong> GHS {selectedFeeForPayment.paidAmount.toLocaleString()}</div>
                  <div><strong>Current Balance:</strong> GHS {selectedFeeForPayment.balance.toLocaleString()}</div>
                </div>

                <form onSubmit={handleProcessPayment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <label>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-700)' }}>Payment Amount (GHS)</span>
                    <input
                      type="number"
                      required
                      min="1"
                      max={selectedFeeForPayment.balance}
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--gray-300)', fontSize: 14 }}
                    />
                  </label>

                  <label>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-700)' }}>Payment Method</span>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--gray-300)', fontSize: 14 }}
                    >
                      <option>Mobile Money</option>
                      <option>Bank Transfer</option>
                      <option>Cash</option>
                      <option>Cheque</option>
                    </select>
                  </label>

                  <label>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-700)' }}>Notes / Transaction Ref</span>
                    <input
                      type="text"
                      placeholder="e.g. MoMo Ref #992812"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: 6, border: '1px solid var(--gray-300)', fontSize: 14 }}
                    />
                  </label>

                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => setSelectedFeeForPayment(null)}
                      style={{ flex: 1, padding: 12, border: '1px solid var(--gray-300)', borderRadius: 6, background: '#fff', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{ flex: 1, padding: 12, border: 'none', borderRadius: 6, background: ACCOUNT_BG, color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Confirm Payment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// Custom Tailored SimsModalRenderer for EVERY unique link
function SimsModalRenderer({ modalData, setModalData, onClose, onSubmit, students }) {
  const { link, category } = modalData;

  const isPrintOrReport =
    link.toLowerCase().includes('print') ||
    link.toLowerCase().includes('report') ||
    link.toLowerCase().includes('preview') ||
    link.toLowerCase().includes('ledger') ||
    link.toLowerCase().includes('statement');

  const isPrepareBill = link === 'Prepare Student academic Bill' || link === 'Print Student\'s Academic Bill' || link === 'Print & Post Student\'s Academic Bill' || link === 'Print Individual Student Bill';
  const isReceivePayment = link === 'Receive Payments from Students' || link === 'Issue Other receipts' || link === 'Re-print Commercial Receipt' || link === 'Receive Other Payments' || link === 'Batch Processing' || link.toLowerCase().includes('receivables') || link.toLowerCase().includes('pv') || link.toLowerCase().includes('authorise');

  return (
    <div className="sims-modal-overlay">
      <div className="sims-modal-card" style={{ maxWidth: (isPrepareBill || isReceivePayment) ? 1280 : 960, width: (isPrepareBill || isReceivePayment) ? '96vw' : '94vw', boxSizing: 'border-box', overflowX: 'hidden' }}>
        <div className="sims-modal-header" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/remalj-carewell-logo.jpg" alt="REMALJ Carewell Logo" style={{ height: 38, width: 'auto', borderRadius: 4, marginRight: 12, border: '1px solid rgba(255,255,255,0.3)' }} />
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.85 }}>
              SIMs v2025 Module / {category}
            </span>
            <h3 style={{ fontSize: 15, fontWeight: 800 }}>{link}</h3>
          </div>
          <button className="sims-modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="sims-modal-body" onSubmit={onSubmit}>
          {renderSpecificContent(link, modalData, setModalData, students)}
        </form>
      </div>
    </div>
  );
}

function DropdownWithAddRemove({ label, options, value, onChange, onAddOption, onRemoveOption }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState('');

  const handleSelectChange = (e) => {
    const selected = e.target.value;
    if (selected === '__ADD_NEW__') {
      setIsAdding(true);
    } else if (selected === '__REMOVE_CURRENT__') {
      if (options.length > 1) {
        onRemoveOption(value);
      }
    } else {
      onChange(selected);
    }
  };

  const handleSaveAdd = () => {
    if (newText.trim()) {
      onAddOption(newText.trim());
      setNewText('');
      setIsAdding(false);
    }
  };

  return (
    <div className="sims-form-group" style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', margin: '0 0 4px 0', fontWeight: 700, fontSize: 12, color: '#0f3a4b' }}>
        {label}
      </label>

      {isAdding ? (
        <div style={{ display: 'flex', gap: 4 }}>
          <input
            type="text"
            placeholder={`Enter new ${label.toLowerCase()}...`}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSaveAdd(); } }}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid #0284c7',
              fontSize: 12
            }}
            autoFocus
          />
          <button
            type="button"
            onClick={handleSaveAdd}
            style={{
              background: '#0284c7',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '6px 10px',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsAdding(false)}
            style={{
              background: '#f1f5f9',
              color: '#475569',
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              padding: '6px 8px',
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            ✕
          </button>
        </div>
      ) : (
        <select
          value={value}
          onChange={handleSelectChange}
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: 6,
            border: '1px solid #cbd5e1',
            fontSize: 12.5,
            background: '#fff',
            fontWeight: 500
          }}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
          <option disabled>──────────</option>
          <option value="__ADD_NEW__">➕ Add option to dropdown...</option>
          {options.length > 1 && (
            <option value="__REMOVE_CURRENT__">✖ Remove current option ("{value}")</option>
          )}
        </select>
      )}
    </div>
  );
}

function PrepareStudentAcademicBillForm({ setM, students = [] }) {
  // Dropdown Options
  const [years, setYears] = useState(['2025/2026', '2026/2027', '2027/2028']);
  const [terms, setTerms] = useState(['1st Term', '2nd Term', '3rd Term']);
  const [classes, setClasses] = useState([
    'Nursery 1', 'Nursery 2', 'KG 1', 'KG 2', 'Creche',
    'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
    'JHS 1', 'JHS 2', 'JHS 3', 'SHS 1', 'SHS 2', 'SHS 3'
  ]);
  const [depts, setDepts] = useState([
    'Pre-school',
    'Primary Department',
    'Junior High Department (JHS)',
    'Senior High Department (SHS)',
    'Creche & Early Childhood'
  ]);
  const [subClasses, setSubClasses] = useState([
    'A - Sunflower', 'B - Rose', 'Stream A', 'Stream B', 'Stream C', 'Gold Class', 'Diamond Class'
  ]);
  const [billAccounts, setBillAccounts] = useState([
    'Tuition Account',
    'Facility & ICT Account',
    'PTA Account',
    'Exams Account',
    'Transport Account',
    'Feeding Account',
    'Library & Lab Account',
    'Sundry / Miscellaneous'
  ]);

  // Selected Academic Period
  const [currYear, setCurrYear] = useState('2025/2026');
  const [currTerm, setCurrTerm] = useState('1st Term');
  const [currClass, setCurrClass] = useState('Nursery 1');

  const [postYear, setPostYear] = useState('2025/2026');
  const [postTerm, setPostTerm] = useState('1st Term');
  const [postDept, setPostDept] = useState('Pre-school');
  const [postClass, setPostClass] = useState('Nursery 2');
  const [postSubClass, setPostSubClass] = useState('A - Sunflower');

  const [billDate, setBillDate] = useState('2026-07-28');
  const [reopeningDate, setReopeningDate] = useState('2026-07-28');

  // Search & Top Action Controls
  const [prevBillNo, setPrevBillNo] = useState('');
  const [nextTermBillNo, setNextTermBillNo] = useState('BILL-2026-0094');
  const [enrollmentSid, setEnrollmentSid] = useState('');
  const [filterName, setFilterName] = useState('');

  // Student Details Form Fields
  const [studentIndex, setStudentIndex] = useState(0);
  const [formStudentName, setFormStudentName] = useState('Benjamin Edwards');
  const [formStatus, setFormStatus] = useState('Active');
  const [formCurrentClass, setFormCurrentClass] = useState('Nursery 1');
  const [formSubClass, setFormSubClass] = useState('A - Sunflower');
  const [formEntryStatus, setFormEntryStatus] = useState('Enrolled');
  const [formDateReported, setFormDateReported] = useState('2026-01-15');

  // Active Tab
  const [activeTab, setActiveTab] = useState('Next Term Student Compulsory Bill'); // options: 'Next Term Student Compulsory Bill', 'Next Term Student Other Requisition', 'Print Bill'

  // Item Form Fields
  const [itemDesc, setItemDesc] = useState('');
  const [selectedBillAccount, setSelectedBillAccount] = useState('Tuition Account');
  const [itemFee, setItemFee] = useState('');

  // Bill Items List
  const [billItems, setBillItems] = useState([
    { id: '1', description: 'Tuition & Academic Instruction', billAccount: 'Tuition Account', fee: 2200, category: 'Compulsory', status: 'Posted', dateAdded: '2026-07-28' },
    { id: '2', description: 'ICT, Computer & Lab Maintenance', billAccount: 'Facility & ICT Account', fee: 450, category: 'Compulsory', status: 'Posted', dateAdded: '2026-07-28' },
    { id: '3', description: 'PTA & School Development Levy', billAccount: 'PTA Account', fee: 350, category: 'Compulsory', status: 'Posted', dateAdded: '2026-07-28' },
    { id: '4', description: 'Terminal Examinations & Assessment', billAccount: 'Exams Account', fee: 500, category: 'Compulsory', status: 'Posted', dateAdded: '2026-07-28' },
    { id: '5', description: 'School Bus Transport Route (Pre-school)', billAccount: 'Transport Account', fee: 600, category: 'Other Requisition', status: 'Draft', dateAdded: '2026-07-28' },
    { id: '6', description: 'Daily Feeding & Mid-day Snack', billAccount: 'Feeding Account', fee: 400, category: 'Other Requisition', status: 'Draft', dateAdded: '2026-07-28' },
  ]);

  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [journalStatusNotice, setJournalStatusNotice] = useState('');

  // Helper functions for Dropdowns
  const addOption = (setter, val) => setter((prev) => [...prev, val]);
  const removeOption = (setter, list, val, currentVal, setCurrentVal) => {
    const filtered = list.filter((item) => item !== val);
    setter(filtered);
    if (currentVal === val) setCurrentVal(filtered[0] || '');
  };

  // Date Formatting Helper
  const formatDatePreview = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[d.getDay()]} , ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  // Calculations
  const compulsoryTotal = billItems
    .filter((i) => i.category === 'Compulsory')
    .reduce((sum, i) => sum + Number(i.fee || 0), 0);

  const otherTotal = billItems
    .filter((i) => i.category === 'Other Requisition')
    .reduce((sum, i) => sum + Number(i.fee || 0), 0);

  const grandTotal = compulsoryTotal + otherTotal;

  // Search & Filter Handlers
  const handleCheckExistingBill = () => {
    if (enrollmentSid) {
      const match = (students || []).find((s) => s.studentId?.toLowerCase().includes(enrollmentSid.toLowerCase()));
      if (match) {
        setFormStudentName(match.fullName || match.name);
        setFormCurrentClass(match.level || 'Nursery 1');
        setFormSubClass(match.classSection || 'A - Sunflower');
        setFormStatus(match.status || 'Active');
        setJournalStatusNotice(`Loaded existing bill for student: ${match.fullName || match.name} (${match.studentId})`);
        setTimeout(() => setJournalStatusNotice(''), 3500);
        return;
      }
    }
    setJournalStatusNotice(`Bill checked for Ref: ${nextTermBillNo}. Found 6 existing item records.`);
    setTimeout(() => setJournalStatusNotice(''), 3500);
  };

  const handleFilterByName = () => {
    if (filterName) {
      const match = (students || []).find((s) =>
        (s.fullName || s.name || '').toLowerCase().includes(filterName.toLowerCase())
      );
      if (match) {
        setFormStudentName(match.fullName || match.name);
        setFormCurrentClass(match.level || 'Nursery 1');
        setEnrollmentSid(match.studentId || '');
        setJournalStatusNotice(`Filter matched: ${match.fullName || match.name}`);
        setTimeout(() => setJournalStatusNotice(''), 3500);
        return;
      }
    }
    setJournalStatusNotice(`Filtered by name: "${filterName || formStudentName}"`);
    setTimeout(() => setJournalStatusNotice(''), 3000);
  };

  const handleNextStudent = () => {
    if (students && students.length > 0) {
      const nextIdx = (studentIndex + 1) % students.length;
      setStudentIndex(nextIdx);
      const nextStudent = students[nextIdx];
      setFormStudentName(nextStudent.fullName || nextStudent.name);
      setFormCurrentClass(nextStudent.level || 'Nursery 1');
      setEnrollmentSid(nextStudent.studentId || '');
      setJournalStatusNotice(`Loaded next student: ${nextStudent.fullName || nextStudent.name}`);
      setTimeout(() => setJournalStatusNotice(''), 3000);
    }
  };

  const handleGenerateNewBill = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newBillNo = `BILL-2026-${randomNum}`;
    setNextTermBillNo(newBillNo);
    setJournalStatusNotice(`Generated new bill header: ${newBillNo}`);
    setTimeout(() => setJournalStatusNotice(''), 3500);
  };

  const handleRefreshBills = () => {
    setJournalStatusNotice('Bills refreshed & recalled from accounting database.');
    setTimeout(() => setJournalStatusNotice(''), 3000);
  };

  // Add Item Handler
  const handleAddOtherBill = () => {
    if (!itemDesc.trim()) {
      alert('Please enter a description for the fee item.');
      return;
    }
    const feeVal = Number(itemFee) || 0;
    const newItem = {
      id: String(Date.now()),
      description: itemDesc.trim(),
      billAccount: selectedBillAccount,
      fee: feeVal,
      category: activeTab === 'Next Term Student Other Requisition' ? 'Other Requisition' : 'Compulsory',
      status: 'Draft',
      dateAdded: billDate || new Date().toISOString().split('T')[0]
    };
    setBillItems((prev) => [...prev, newItem]);
    setItemDesc('');
    setItemFee('');
    setJournalStatusNotice(`Added new item "${newItem.description}" (GHS ${feeVal.toFixed(2)}) to bill.`);
    setTimeout(() => setJournalStatusNotice(''), 3500);
  };

  // Delete Item Handler
  const handleDeleteSelectedItem = () => {
    if (selectedRowIds.length === 0) {
      if (billItems.length > 0) {
        const lastItem = billItems[billItems.length - 1];
        setBillItems((prev) => prev.slice(0, -1));
        setJournalStatusNotice(`Deleted item "${lastItem.description}" from bill.`);
        setTimeout(() => setJournalStatusNotice(''), 3000);
      }
      return;
    }
    setBillItems((prev) => prev.filter((item) => !selectedRowIds.includes(item.id)));
    setSelectedRowIds([]);
    setJournalStatusNotice(`Deleted selected ${selectedRowIds.length} item(s) from post academic bill.`);
    setTimeout(() => setJournalStatusNotice(''), 3000);
  };

  // Post Compulsory Bill to Student Journal
  const handlePostToJournal = () => {
    setBillItems((prev) =>
      prev.map((item) => ({ ...item, status: 'Posted' }))
    );
    setJournalStatusNotice(
      `✓ Posted Next Term Compulsory Bill (GHS ${compulsoryTotal.toLocaleString()}) to Student Journal for ${formStudentName}!`
    );
  };

  // Reverse Compulsory Bill from Student Journal
  const handleReverseJournal = () => {
    setBillItems((prev) =>
      prev.map((item) => ({ ...item, status: 'Draft' }))
    );
    setJournalStatusNotice(
      `<< Reversed Next Term Compulsory Bill from Student Journal for ${formStudentName}. Items reset to Draft status.`
    );
  };

  // Quick Preset Handlers
  const handlePresetAdditionalFees = () => {
    setItemDesc('Special ICT & STEAM Workshop Fee');
    setSelectedBillAccount('Facility & ICT Account');
    setItemFee('150.00');
  };

  const handlePresetFineAdjustment = () => {
    setItemDesc('Late Registration Fine / Surcharge');
    setSelectedBillAccount('Sundry / Miscellaneous');
    setItemFee('50.00');
  };

  const toggleRowSelect = (id) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)', color: '#0f172a' }}>
      {/* ── TOP TITLE & ACTION HEADER BAR ── */}
      <div style={{
        background: '#0f3a4b',
        color: '#fff',
        padding: '12px 18px',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: '#0284c7', width: 8, height: 24, borderRadius: 4 }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#ffffff', letterSpacing: '0.02em' }}>
            Add new post student academic bill header file
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleRefreshBills}
            style={{
              padding: '6px 14px',
              background: '#e0f2fe',
              color: '#0369a1',
              border: 'none',
              borderRadius: 6,
              fontWeight: 800,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            🔄 Refresh/Recall Bills
          </button>

          <button
            type="button"
            onClick={handleGenerateNewBill}
            style={{
              padding: '6px 14px',
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: 6,
              fontWeight: 800,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            + Generate a New Student Bill
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#e0f2fe' }}>
            <span>Previous Bill</span>
            <input
              type="text"
              placeholder="Ref No..."
              value={prevBillNo}
              onChange={(e) => setPrevBillNo(e.target.value)}
              style={{
                width: 120,
                padding: '4px 8px',
                borderRadius: 4,
                border: '1px solid #38bdf8',
                fontSize: 12,
                background: '#ffffff',
                color: '#0f172a',
                fontWeight: 700
              }}
            />
          </div>
        </div>
      </div>

      {/* ── NOTIFICATION BANNER ── */}
      {journalStatusNotice && (
        <div style={{
          background: '#dcfce7',
          color: '#15803d',
          padding: '8px 16px',
          fontSize: 12.5,
          fontWeight: 800,
          borderBottom: '1px solid #bbf7d0',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span>ℹ️</span> {journalStatusNotice}
        </div>
      )}

      {/* ── MAIN CONTENT GRID: 3 COLUMNS / SECTIONS ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        gap: 16,
        padding: 16,
        background: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px'
      }}>

        {/* ── LEFT COLUMN: ACADEMIC PERIOD SETUP ── */}
        <div style={{
          background: '#ffffff',
          padding: 14,
          borderRadius: 8,
          border: '1px solid #cbd5e1',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          {/* Current Academic Period */}
          <div style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: 10, marginBottom: 12 }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: 12.5, fontWeight: 900, color: '#0f3a4b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Current Academic Period
            </h4>

            <DropdownWithAddRemove
              label="Select Current Academic year"
              options={years}
              value={currYear}
              onChange={setCurrYear}
              onAddOption={(v) => addOption(setYears, v)}
              onRemoveOption={(v) => removeOption(setYears, years, v, currYear, setCurrYear)}
            />

            <DropdownWithAddRemove
              label="Select Current Academic term"
              options={terms}
              value={currTerm}
              onChange={setCurrTerm}
              onAddOption={(v) => addOption(setTerms, v)}
              onRemoveOption={(v) => removeOption(setTerms, terms, v, currTerm, setCurrTerm)}
            />

            <DropdownWithAddRemove
              label="Select Current Class"
              options={classes}
              value={currClass}
              onChange={setCurrClass}
              onAddOption={(v) => addOption(setClasses, v)}
              onRemoveOption={(v) => removeOption(setClasses, classes, v, currClass, setCurrClass)}
            />
          </div>

          {/* Post Academic Period */}
          <div style={{ marginBottom: 12 }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: 12.5, fontWeight: 900, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Post Academic Period
            </h4>

            <DropdownWithAddRemove
              label="Select Post Academic year"
              options={years}
              value={postYear}
              onChange={setPostYear}
              onAddOption={(v) => addOption(setYears, v)}
              onRemoveOption={(v) => removeOption(setYears, years, v, postYear, setPostYear)}
            />

            <DropdownWithAddRemove
              label="Select Post Academic term"
              options={terms}
              value={postTerm}
              onChange={setPostTerm}
              onAddOption={(v) => addOption(setTerms, v)}
              onRemoveOption={(v) => removeOption(setTerms, terms, v, postTerm, setPostTerm)}
            />

            <DropdownWithAddRemove
              label="Select Post Department"
              options={depts}
              value={postDept}
              onChange={setPostDept}
              onAddOption={(v) => addOption(setDepts, v)}
              onRemoveOption={(v) => removeOption(setDepts, depts, v, postDept, setPostDept)}
            />

            <DropdownWithAddRemove
              label="Select Post Class"
              options={classes}
              value={postClass}
              onChange={setPostClass}
              onAddOption={(v) => addOption(setClasses, v)}
              onRemoveOption={(v) => removeOption(setClasses, classes, v, postClass, setPostClass)}
            />

            <DropdownWithAddRemove
              label="Select Post Sub class"
              options={subClasses}
              value={postSubClass}
              onChange={setPostSubClass}
              onAddOption={(v) => addOption(setSubClasses, v)}
              onRemoveOption={(v) => removeOption(setSubClasses, subClasses, v, postSubClass, setPostSubClass)}
            />

            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 11.5, color: '#0f3a4b', marginBottom: 2 }}>Set Bill date</label>
              <input
                type="date"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
              />
              <div style={{ fontSize: 11, color: '#0284c7', fontWeight: 700, marginTop: 2 }}>
                {formatDatePreview(billDate)}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 11.5, color: '#0f3a4b', marginBottom: 2 }}>Set Next term reopening date</label>
              <input
                type="date"
                value={reopeningDate}
                onChange={(e) => setReopeningDate(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
              />
              <div style={{ fontSize: 11, color: '#0284c7', fontWeight: 700, marginTop: 2 }}>
                {formatDatePreview(reopeningDate)}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <button
              type="button"
              onClick={handleNextStudent}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'linear-gradient(135deg, #0f3a4b, #1e5a70)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              Next &gt;&gt;
            </button>
          </div>
        </div>

        {/* ── RIGHT MAIN PANEL: STUDENT INFO, JOURNAL ACTIONS & BILL BREAKDOWN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Top Search & Filter Bar */}
          <div style={{
            background: '#ffffff',
            padding: 12,
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12
          }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0f3a4b', minWidth: 100 }}>Next Term Bill No:</span>
              <input
                type="text"
                value={nextTermBillNo}
                onChange={(e) => setNextTermBillNo(e.target.value)}
                style={{ flex: 1, padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 700 }}
              />
              <button
                type="button"
                onClick={handleCheckExistingBill}
                style={{ padding: '6px 10px', background: '#0f3a4b', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Check Existing Bill
              </button>
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0f3a4b', minWidth: 90 }}>Enrollment/SID:</span>
              <input
                type="text"
                placeholder="SID No..."
                value={enrollmentSid}
                onChange={(e) => setEnrollmentSid(e.target.value)}
                style={{ flex: 1, padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
              />
              <input
                type="text"
                placeholder="Filter by name..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                style={{ flex: 1, padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
              />
              <button
                type="button"
                onClick={handleFilterByName}
                style={{ padding: '6px 10px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Filter by name
              </button>
            </div>
          </div>

          {/* Student Info Parameters Grid */}
          <div style={{
            background: '#ffffff',
            padding: 12,
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10
          }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Student name</label>
              <input
                type="text"
                value={formStudentName}
                onChange={(e) => setFormStudentName(e.target.value)}
                style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 800, color: '#0f3a4b' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
              >
                <option value="Active">Active</option>
                <option value="Owing Fee">Owing Fee</option>
                <option value="Scholarship">Scholarship / Waived</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Current class</label>
              <input
                type="text"
                value={formCurrentClass}
                onChange={(e) => setFormCurrentClass(e.target.value)}
                style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Current sub class</label>
              <input
                type="text"
                value={formSubClass}
                onChange={(e) => setFormSubClass(e.target.value)}
                style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Entry status</label>
              <select
                value={formEntryStatus}
                onChange={(e) => setFormEntryStatus(e.target.value)}
                style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
              >
                <option value="Enrolled">Enrolled</option>
                <option value="Continuing">Continuing Student</option>
                <option value="New Student">New Student</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Date reported</label>
              <input
                type="date"
                value={formDateReported}
                onChange={(e) => setFormDateReported(e.target.value)}
                style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
              />
            </div>
          </div>

          {/* Next Term Compulsory Bill Main Action Section */}
          <div style={{
            background: '#ffffff',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            overflow: 'hidden'
          }}>
            {/* Blue Banner Header */}
            <div style={{
              background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
              color: '#ffffff',
              padding: '10px 16px',
              fontSize: 14,
              fontWeight: 900,
              letterSpacing: '0.03em'
            }}>
              Next Term Compulsory Bill
            </div>

            <div style={{ padding: 12 }}>
              {/* Action Buttons Row 1 */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handlePostToJournal}
                  style={{
                    padding: '8px 14px',
                    background: '#0f766e',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 6,
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}
                >
                  Post Next term Compulsory Bill to Student Journal &gt;&gt;
                </button>

                <button
                  type="button"
                  onClick={handleReverseJournal}
                  style={{
                    padding: '8px 14px',
                    background: '#be123c',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 6,
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}
                >
                  &lt;&lt; Reverse next term Compulsory Bill from Student Journal
                </button>
              </div>

              {/* Total Post Class Compulsory Bill Box & Adjustments */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justify: 'space-between',
                background: '#f1f5f9',
                padding: '10px 14px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                marginBottom: 12,
                flexWrap: 'wrap',
                gap: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#0f3a4b' }}>Total post class Compulsory bill:</span>
                  <input
                    type="text"
                    readOnly
                    value={`GHS ${compulsoryTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    style={{
                      width: 150,
                      padding: '5px 10px',
                      borderRadius: 4,
                      border: '1px solid #0284c7',
                      fontSize: 13,
                      fontWeight: 900,
                      color: '#0369a1',
                      background: '#ffffff'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={handlePresetAdditionalFees}
                    style={{
                      padding: '6px 12px',
                      background: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 4,
                      fontSize: 11.5,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Additional Fees
                  </button>

                  <button
                    type="button"
                    onClick={handlePresetFineAdjustment}
                    style={{
                      padding: '6px 12px',
                      background: '#475569',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 4,
                      fontSize: 11.5,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Fine adjustment
                  </button>
                </div>
              </div>

              {/* Item Entry Controls Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.5fr 1fr',
                gap: 10,
                alignItems: 'end',
                background: '#fafafa',
                padding: 10,
                borderRadius: 6,
                border: '1px dashed #cbd5e1',
                marginBottom: 10
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>
                    Description of item
                  </label>
                  <input
                    type="text"
                    placeholder="Enter item description..."
                    value={itemDesc}
                    onChange={(e) => setItemDesc(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>
                    Select Bill Account
                  </label>
                  <select
                    value={selectedBillAccount}
                    onChange={(e) => setSelectedBillAccount(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                  >
                    {billAccounts.map((acc) => (
                      <option key={acc} value={acc}>{acc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>
                    Fee (in GHS)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={itemFee}
                    onChange={(e) => setItemFee(e.target.value)}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 700 }}
                  />
                </div>
              </div>

              {/* Item Action Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={handleAddOtherBill}
                  style={{
                    padding: '7px 14px',
                    background: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Add other bill &gt;&gt;
                </button>

                <button
                  type="button"
                  onClick={handleDeleteSelectedItem}
                  style={{
                    padding: '7px 14px',
                    background: '#e11d48',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Delete other item from post academic bill
                </button>
              </div>
            </div>
          </div>

          {/* ── LOWER TABS & DATA GRID ── */}
          <div style={{
            background: '#ffffff',
            borderRadius: 8,
            border: '1px solid #cbd5e1',
            overflow: 'hidden'
          }}>
            {/* Tab Navigation */}
            <div style={{
              display: 'flex',
              background: '#f1f5f9',
              borderBottom: '1px solid #cbd5e1'
            }}>
              {[
                'Next Term Student Compulsory Bill',
                'Next Term Student Other Requisition',
                'Print Bill'
              ].map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    style={{
                      padding: '10px 16px',
                      background: isActive ? '#ffffff' : 'transparent',
                      color: isActive ? '#0f3a4b' : '#64748b',
                      border: 'none',
                      borderBottom: isActive ? '3px solid #0f3a4b' : 'none',
                      fontWeight: isActive ? 900 : 700,
                      fontSize: 12,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tab === 'Print Bill' ? '🖨️ Print Bill' : tab}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div style={{ padding: 12 }}>
              {activeTab === 'Print Bill' ? (
                /* Printable Document View */
                <div className="printable-area accountant-printable" style={{
                  padding: 24,
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6
                }}>
                  <div style={{ borderBottom: '2px solid #0f3a4b', paddingBottom: 12, marginBottom: 16 }} className="receipt-header-box">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }} className="receipt-header-inline">
                      <img src="/remalj-carewell-logo.jpg" alt="REMALJ Carewell Logo" style={{ height: 48, width: 'auto', borderRadius: 6, flexShrink: 0 }} className="receipt-logo" />
                      <div style={{ textAlign: 'left' }} className="receipt-school-text">
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f3a4b', lineHeight: 1.2 }}>REMALJ CAREWELL INSPIRATIONAL SCHOOL</h3>
                        <p style={{ margin: '3px 0 0 0', fontSize: 11.5, color: '#475569', fontWeight: 700 }}>P. O. BOX 139, BOGOSO · PRESTEA HUNI-VALLEY MUNICIPALITY</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 8 }}>
                      <span style={{ display: 'inline-block', background: '#0f3a4b', color: '#fff', padding: '4px 14px', borderRadius: 12, fontSize: 11, fontWeight: 800 }}>
                        STUDENT ACADEMIC BILL STATEMENT · {currTerm} ({currYear})
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, marginBottom: 16, background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                    <div><strong>Student Name:</strong> {formStudentName}</div>
                    <div><strong>Bill Reference No:</strong> {nextTermBillNo}</div>
                    <div><strong>Class / Subclass:</strong> {formCurrentClass} ({formSubClass})</div>
                    <div><strong>Date Issued:</strong> {billDate}</div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 16 }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                        <th style={{ padding: 8 }}>Item Description</th>
                        <th style={{ padding: 8 }}>Account</th>
                        <th style={{ padding: 8 }}>Category</th>
                        <th style={{ padding: 8, textAlign: 'right' }}>Amount (GHS)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billItems.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: 8, fontWeight: 700 }}>{item.description}</td>
                          <td style={{ padding: 8 }}>{item.billAccount}</td>
                          <td style={{ padding: 8 }}>{item.category}</td>
                          <td style={{ padding: 8, textAlign: 'right', fontWeight: 800 }}>{Number(item.fee).toFixed(2)}</td>
                        </tr>
                      ))}
                      <tr style={{ background: '#f8fafc', fontWeight: 900, borderTop: '2px solid #0f3a4b' }}>
                        <td colSpan={3} style={{ padding: 10 }}>TOTAL ACADEMIC BILL</td>
                        <td style={{ padding: 10, textAlign: 'right', fontSize: 14, color: '#0f3a4b' }}>
                          GHS {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Endorsement & Signatures */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24, paddingTop: 16, borderTop: '1px dashed #cbd5e1', fontSize: 11 }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#0f3a4b', marginBottom: 20 }}>Prepared By (Finance Office):</div>
                      <div style={{ borderBottom: '1px solid #94a3b8', width: '80%', marginBottom: 4 }} />
                      <div style={{ color: '#64748b' }}>Accountant / Bursar Signature</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: '#0f3a4b', marginBottom: 20 }}>Approved By (Headmaster):</div>
                      <div style={{ borderBottom: '1px solid #94a3b8', width: '80%', marginBottom: 4 }} />
                      <div style={{ color: '#64748b' }}>School Stamp & Signature</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>Reopening Date: <strong>{reopeningDate}</strong> · <span style={{ fontStyle: 'italic' }}>Official document generated via REMALJ SIMS Accounts Portal</span></div>
                    <button
                      type="button"
                      className="no-print"
                      onClick={() => window.print()}
                      style={{ padding: '8px 16px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
                    >
                      🖨️ Print Official Invoice
                    </button>
                  </div>
                </div>
              ) : (
                /* Data Table View */
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                        <th style={{ padding: '8px 10px', width: 30 }}>
                          <input
                            type="checkbox"
                            checked={selectedRowIds.length === billItems.length && billItems.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRowIds(billItems.map((i) => i.id));
                              } else {
                                setSelectedRowIds([]);
                              }
                            }}
                          />
                        </th>
                        <th style={{ padding: '8px 10px' }}>#</th>
                        <th style={{ padding: '8px 10px' }}>Description of Item</th>
                        <th style={{ padding: '8px 10px' }}>Bill Account</th>
                        <th style={{ padding: '8px 10px' }}>Category</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Fee (GHS)</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billItems
                        .filter((item) => {
                          if (activeTab === 'Next Term Student Other Requisition') {
                            return item.category === 'Other Requisition';
                          }
                          return item.category === 'Compulsory';
                        })
                        .map((item, idx) => {
                          const isSelected = selectedRowIds.includes(item.id);
                          return (
                            <tr
                              key={item.id}
                              style={{
                                borderBottom: '1px solid #e2e8f0',
                                background: isSelected ? '#e0f2fe' : idx % 2 === 0 ? '#ffffff' : '#fafafa'
                              }}
                            >
                              <td style={{ padding: '8px 10px' }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleRowSelect(item.id)}
                                />
                              </td>
                              <td style={{ padding: '8px 10px', color: '#64748b', fontWeight: 700 }}>{idx + 1}</td>
                              <td style={{ padding: '8px 10px', fontWeight: 800, color: '#0f3a4b' }}>{item.description}</td>
                              <td style={{ padding: '8px 10px', color: '#475569' }}>{item.billAccount}</td>
                              <td style={{ padding: '8px 10px' }}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  fontSize: 10.5,
                                  fontWeight: 800,
                                  background: item.category === 'Compulsory' ? '#e0f2fe' : '#fef3c7',
                                  color: item.category === 'Compulsory' ? '#0369a1' : '#b45309'
                                }}>
                                  {item.category}
                                </span>
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>
                                {Number(item.fee).toFixed(2)}
                              </td>
                              <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  fontSize: 10.5,
                                  fontWeight: 800,
                                  background: item.status === 'Posted' ? '#dcfce7' : '#fee2e2',
                                  color: item.status === 'Posted' ? '#15803d' : '#be123c'
                                }}>
                                  {item.status === 'Posted' ? 'Journal Posted' : 'Draft'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#f1f5f9', fontWeight: 900, borderTop: '2px solid #cbd5e1' }}>
                        <td colSpan={5} style={{ padding: '10px 12px', color: '#0f3a4b' }}>
                          SUBTOTAL ({activeTab === 'Next Term Student Other Requisition' ? 'OTHER REQUISITION' : 'COMPULSORY BILL'}):
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13, color: '#0f3a4b' }}>
                          GHS {(activeTab === 'Next Term Student Other Requisition' ? otherTotal : compulsoryTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReceivePaymentsForm({ setM, students = [], recordFeePayment }) {
  // Top Academic Period & Header Controls
  const [years, setYears] = useState(['2025/2026', '2026/2027', '2027/2028']);
  const [terms, setTerms] = useState(['1st Term', '2nd Term', '3rd Term']);
  const [currYear, setCurrYear] = useState('2026/2027');
  const [currTerm, setCurrTerm] = useState('1st Term');

  const [receiptNo, setReceiptNo] = useState('47545674');
  const [prevBal, setPrevBal] = useState('0.00');
  const [availableBal, setAvailableBal] = useState('0.00');
  const [curArrears, setCurArrears] = useState('1,200.00');
  const [avlArrears, setAvlArrears] = useState('1,200.00');

  // Active Tab
  const [activeTab, setActiveTab] = useState('Add Optional & Other Bills to Accounts'); // options: 'Add Optional & Other Bills to Accounts', 'Accept Payments (Receipt Entry)', 'Reprint receipt'

  // Student Details
  const [studentId, setStudentId] = useState('421270');
  const [studentName, setStudentName] = useState('NANA ADJOA ASARI SEREBOUR');
  const [studentClass, setStudentClass] = useState('Basic 4');
  const [subClass, setSubClass] = useState('B');
  const [modeOfAdmission, setModeOfAdmission] = useState('Day');
  const [statusOfEntry, setStatusOfEntry] = useState('Enrolled');
  const [studentIndex, setStudentIndex] = useState(0);

  // Middle Action Bar
  const [billNo, setBillNo] = useState('2100451878');
  const [showOptionalDialog, setShowOptionalDialog] = useState(false);
  const [showLedgerPreview, setShowLedgerPreview] = useState(false);
  const [showBillPreview, setShowBillPreview] = useState(false);

  // Optional Fees List
  const [optionalBills, setOptionalBills] = useState([
    { id: 'opt1', description: 'School Bus Transport Route (Zone B)', billAccount: 'Transport Account', fee: 450.00, status: 'Added', date: '2026-09-09' },
    { id: 'opt2', description: 'Mid-Day Snack & Feeding Plan', billAccount: 'Feeding Account', fee: 350.00, status: 'Added', date: '2026-09-09' },
    { id: 'opt3', description: 'Robotics & STEM Workshop Kit', billAccount: 'Facility & ICT Account', fee: 200.00, status: 'Optional', date: '2026-09-09' },
    { id: 'opt4', description: 'Taekwondo & Martial Arts Club', billAccount: 'Sundry / Miscellaneous', fee: 150.00, status: 'Optional', date: '2026-09-09' },
  ]);

  const [selectedOptionalIds, setSelectedOptionalIds] = useState([]);
  const [newOptDesc, setNewOptDesc] = useState('');
  const [newOptAccount, setNewOptAccount] = useState('Transport Account');
  const [newOptFee, setNewOptFee] = useState('');

  // Payment Entry Form State
  const [payAmount, setPayAmount] = useState('1200.00');
  const [payMode, setPayMode] = useState('Mobile Money');
  const [transactionRef, setTransactionRef] = useState('MM-98471203');
  const [payerName, setPayerName] = useState('Mr. Serebour (Guardian)');
  const [payerPhone, setPayerPhone] = useState('024 111 2222');
  const [payNotes, setPayNotes] = useState('Term 1 School Fee Settlement');

  // Institutional Fees, Dues & Levy Breakdown State (with Plus + & Minus - controls)
  const [institutionDuesItems, setInstitutionDuesItems] = useState([
    { id: 'due-1', name: 'Tuition Fee / Academic Bill', amount: 1000.00, category: 'Tuition & Academic' },
    { id: 'due-2', name: 'PTA Dues & Association Levy', amount: 15.00, category: 'Association Levy' },
    { id: 'due-3', name: 'GNAPS Institutional Dues', amount: 20.00, category: 'National Dues' },
    { id: 'due-4', name: 'Maintenance & Facility Levy', amount: 30.00, category: 'Facility' },
    { id: 'due-5', name: 'First Aid & Health Levy', amount: 50.00, category: 'Health & Medical' },
    { id: 'due-6', name: 'Toiletries & Sanitation Pack', amount: 60.02, category: 'Sanitation' },
    { id: 'due-7', name: 'Student Identity Card Service', amount: 25.00, category: 'Identity Card' }
  ]);
  const [showAddDuesForm, setShowAddDuesForm] = useState(false);
  const [newDuesName, setNewDuesName] = useState('');
  const [newDuesAmount, setNewDuesAmount] = useState('');
  const [newDuesCategory, setNewDuesCategory] = useState('Dues & Levy');

  const handleAddInstitutionDues = (e) => {
    e?.preventDefault();
    if (!newDuesName.trim()) {
      alert('Please enter a name for the institution fee or dues item.');
      return;
    }
    const amt = Number(newDuesAmount) || 0;
    const newItem = {
      id: `due-${Date.now()}`,
      name: newDuesName.trim(),
      amount: amt,
      category: newDuesCategory || 'Dues & Levy'
    };
    const updated = [...institutionDuesItems, newItem];
    setInstitutionDuesItems(updated);
    setNewDuesName('');
    setNewDuesAmount('');
    setShowAddDuesForm(false);

    const newTotal = updated.reduce((s, i) => s + Number(i.amount), 0);
    setPayAmount(newTotal.toFixed(2));
    setNoticeBanner(`➕ Added "${newItem.name}" (GHS ${amt.toFixed(2)}) to institution fees/dues.`);
    setTimeout(() => setNoticeBanner(''), 3500);
  };

  const handleRemoveInstitutionDues = (id) => {
    const itemToRemove = institutionDuesItems.find(i => i.id === id);
    const updated = institutionDuesItems.filter(i => i.id !== id);
    setInstitutionDuesItems(updated);

    const newTotal = updated.reduce((s, i) => s + Number(i.amount), 0);
    setPayAmount(newTotal.toFixed(2));
    if (itemToRemove) {
      setNoticeBanner(`➖ Removed "${itemToRemove.name}" from institution fees/dues.`);
      setTimeout(() => setNoticeBanner(''), 3500);
    }
  };

  // Historical Receipts List
  const [receiptsList, setReceiptsList] = useState([
    { receiptNo: '47545674', date: '2026-09-09', studentId: '421270', studentName: 'NANA ADJOA ASARI SEREBOUR', amount: 1200.00, mode: 'Mobile Money', refNo: 'MM-98471203', cashier: 'Mrs. Grace Accountant', status: 'Issued' },
    { receiptNo: '47545610', date: '2026-05-14', studentId: '421270', studentName: 'NANA ADJOA ASARI SEREBOUR', amount: 2500.00, mode: 'Bank Deposit', refNo: 'GCB-8839120', cashier: 'Mrs. Grace Accountant', status: 'Issued' },
  ]);

  const [noticeBanner, setNoticeBanner] = useState('');

  // Search / Lookup Student Handler
  const handleLookupStudent = () => {
    if (students && students.length > 0) {
      const match = students.find(s =>
        (s.studentId || '').toLowerCase().includes(studentId.toLowerCase()) ||
        (s.fullName || s.name || '').toLowerCase().includes(studentName.toLowerCase())
      );
      if (match) {
        setStudentId(match.studentId || studentId);
        setStudentName(match.fullName || match.name || studentName);
        setStudentClass(match.level || studentClass);
        setSubClass(match.classSection || subClass);
        const feeRecord = (match.feeAccount || {});
        const bal = match.balance ?? feeRecord.balance ?? 1200;
        setCurArrears(Number(bal).toLocaleString(undefined, { minimumFractionDigits: 2 }));
        setAvlArrears(Number(bal).toLocaleString(undefined, { minimumFractionDigits: 2 }));
        setNoticeBanner(`Loaded student record: ${match.fullName || match.name} (${match.studentId})`);
        setTimeout(() => setNoticeBanner(''), 3000);
        return;
      }
    }
    const nextIdx = (studentIndex + 1) % (students.length || 1);
    setStudentIndex(nextIdx);
    if (students[nextIdx]) {
      const s = students[nextIdx];
      setStudentId(s.studentId || `42127${nextIdx}`);
      setStudentName(s.fullName || s.name || 'NANA ADJOA ASARI SEREBOUR');
      setStudentClass(s.level || 'Basic 4');
      setNoticeBanner(`Loaded student: ${s.fullName || s.name}`);
      setTimeout(() => setNoticeBanner(''), 3000);
    }
  };

  // Add Optional Fee
  const handleAddOptionalFee = () => {
    if (!newOptDesc.trim()) {
      alert('Please enter a description for the optional bill.');
      return;
    }
    const feeVal = Number(newOptFee) || 0;
    const newFee = {
      id: `opt-${Date.now()}`,
      description: newOptDesc.trim(),
      billAccount: newOptAccount,
      fee: feeVal,
      status: 'Added',
      date: new Date().toISOString().split('T')[0]
    };
    setOptionalBills(prev => [...prev, newFee]);
    setNewOptDesc('');
    setNewOptFee('');
    setShowOptionalDialog(false);
    setNoticeBanner(`Added optional bill "${newFee.description}" (GHS ${feeVal.toFixed(2)}) to accounts.`);
    setTimeout(() => setNoticeBanner(''), 3500);
  };

  // Cancel Optional Bill from Accounts
  const handleCancelOptionalBill = () => {
    if (selectedOptionalIds.length === 0) {
      if (optionalBills.length > 0) {
        const last = optionalBills[optionalBills.length - 1];
        setOptionalBills(prev => prev.slice(0, -1));
        setNoticeBanner(`Cancelled optional bill "${last.description}" from accounts.`);
        setTimeout(() => setNoticeBanner(''), 3000);
      }
      return;
    }
    setOptionalBills(prev => prev.filter(i => !selectedOptionalIds.includes(i.id)));
    setSelectedOptionalIds([]);
    setNoticeBanner(`Cancelled ${selectedOptionalIds.length} optional bill(s) from accounts.`);
    setTimeout(() => setNoticeBanner(''), 3000);
  };

  // Refresh Optional Bills
  const handleRefreshOptionalBills = () => {
    setNoticeBanner('Optional bills refreshed from billing centre.');
    setTimeout(() => setNoticeBanner(''), 3000);
  };

  // Process Payment & Issue Receipt
  const handleProcessPayment = (e) => {
    e?.preventDefault();
    const amountVal = Number(payAmount) || 0;
    if (amountVal <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    const newReceiptNo = String(Math.floor(47000000 + Math.random() * 900000));
    setReceiptNo(newReceiptNo);

    if (typeof recordFeePayment === 'function') {
      recordFeePayment({
        id: studentId,
        paidAmount: amountVal,
        paymentMethod: payMode,
        notes: `${transactionRef} - ${payNotes}`,
      });
    }

    const newReceipt = {
      receiptNo: newReceiptNo,
      date: new Date().toISOString().split('T')[0],
      studentId,
      studentName,
      amount: amountVal,
      mode: payMode,
      refNo: transactionRef,
      payer: payerName,
      cashier: 'Mrs. Grace Accountant',
      status: 'Issued'
    };

    setReceiptsList(prev => [newReceipt, ...prev]);

    const currentArrearsNum = parseFloat(curArrears.replace(/,/g, '')) || 1200;
    const newArrears = Math.max(0, currentArrearsNum - amountVal);
    setCurArrears(newArrears.toLocaleString(undefined, { minimumFractionDigits: 2 }));
    setAvlArrears(newArrears.toLocaleString(undefined, { minimumFractionDigits: 2 }));

    setNoticeBanner(`✅ Payment of GHS ${amountVal.toLocaleString(undefined, { minimumFractionDigits: 2 })} recorded! Receipt #${newReceiptNo} issued.`);
    setActiveTab('Reprint receipt');
  };

  const toggleOptionalSelect = (id) => {
    setSelectedOptionalIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)', color: '#0f172a' }}>
      {/* ── TOP ACTION & TITLE BANNER BAR ── */}
      <div style={{
        background: '#0f3a4b',
        color: '#ffffff',
        padding: '10px 16px',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: '#0284c7', width: 6, height: 22, borderRadius: 3 }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#ffffff', letterSpacing: '0.02em' }}>
            Receive payments
          </h3>
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: '#e0f2fe' }}>
          REMALJ Carewell Accounts Office · Cashier Station
        </div>
      </div>

      {/* ── TOP PERIOD & BALANCES CONTROL HEADER ── */}
      <div style={{
        background: '#f1f5f9',
        padding: 12,
        border: '1px solid #cbd5e1',
        borderTop: 'none',
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 8,
        alignItems: 'center'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 2 }}>Select Current Academic year</label>
          <select
            value={currYear}
            onChange={(e) => setCurrYear(e.target.value)}
            style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 11.5, background: '#fff', fontWeight: 700 }}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 2 }}>Select Current Academic term</label>
          <select
            value={currTerm}
            onChange={(e) => setCurrTerm(e.target.value)}
            style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 11.5, background: '#fff', fontWeight: 700 }}
          >
            {terms.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 2 }}>Receipt N/o:</label>
          <input
            type="text"
            value={receiptNo}
            onChange={(e) => setReceiptNo(e.target.value)}
            style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid #0284c7', fontSize: 11.5, fontWeight: 900, color: '#0369a1', background: '#fff' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 2 }}>Previous Bal.</label>
          <input
            type="text"
            readOnly
            value={prevBal}
            style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 11.5, background: '#fff', fontWeight: 700 }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 2 }}>Available Balance</label>
          <input
            type="text"
            readOnly
            value={availableBal}
            style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 11.5, background: '#fff', fontWeight: 700 }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 2 }}>Cur. Arrears @ Billing Centre</label>
          <input
            type="text"
            readOnly
            value={curArrears}
            style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid #e11d48', fontSize: 11.5, fontWeight: 900, color: '#be123c', background: '#fff' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 2 }}>Avl Arrears @ Billing Centre</label>
          <input
            type="text"
            readOnly
            value={avlArrears}
            style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid #e11d48', fontSize: 11.5, fontWeight: 900, color: '#be123c', background: '#fff' }}
          />
        </div>
      </div>

      {/* ── NOTIFICATION BANNER ── */}
      {noticeBanner && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '6px 14px', fontSize: 12, fontWeight: 800, borderBottom: '1px solid #bbf7d0' }}>
          <span>ℹ️</span> {noticeBanner}
        </div>
      )}

      {/* ── TAB NAVIGATION BAR ── */}
      <div style={{ display: 'flex', background: '#e2e8f0', borderBottom: '1px solid #cbd5e1' }}>
        {[
          'Add Optional & Other Bills to Accounts',
          'Accept Payments (Receipt Entry)',
          'Reprint receipt'
        ].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                background: isActive ? '#ffffff' : 'transparent',
                color: isActive ? '#0f3a4b' : '#64748b',
                border: 'none',
                borderBottom: isActive ? '3px solid #0f3a4b' : 'none',
                fontWeight: isActive ? 900 : 700,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* ── STUDENT DETAILS & PHOTO SECTION ── */}
      <div style={{
        background: '#ffffff',
        padding: 14,
        border: '1px solid #cbd5e1',
        borderTop: 'none',
        display: 'grid',
        gridTemplateColumns: '1fr 140px',
        gap: 16,
        alignItems: 'center'
      }}>
        {/* Student Data Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <div>
            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>Student ID</label>
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                style={{ flex: 1, padding: '5px 8px', borderRadius: 4, border: '1px solid #be123c', fontSize: 12, fontWeight: 900, color: '#be123c' }}
              />
              <button
                type="button"
                onClick={handleLookupStudent}
                style={{ padding: '5px 10px', background: '#cbd5e1', color: '#0f3a4b', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 900, cursor: 'pointer' }}
                title="Lookup Student"
              >
                [...]
              </button>
            </div>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>Student Name</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 800, color: '#0f3a4b' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>Class</label>
            <input
              type="text"
              value={studentClass}
              onChange={(e) => setStudentClass(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>Sub class</label>
            <input
              type="text"
              value={subClass}
              onChange={(e) => setSubClass(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>Mode of Admission</label>
            <input
              type="text"
              value={modeOfAdmission}
              onChange={(e) => setModeOfAdmission(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
            />
          </div>

          <div style={{ gridColumn: 'span 3' }}>
            <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>Status of entry</label>
            <input
              type="text"
              value={statusOfEntry}
              onChange={(e) => setStatusOfEntry(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
            />
          </div>
        </div>

        {/* Student Profile Avatar Box */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justify: 'center',
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: 8,
          padding: 10,
          height: '100%'
        }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            color: '#ffffff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b', marginTop: 6, textTransform: 'uppercase' }}>
            Student Photo
          </span>
        </div>
      </div>

      {/* ── MIDDLE CONTROL & ACTION BAR ── */}
      <div style={{
        background: '#f1f5f9',
        padding: '8px 12px',
        border: '1px solid #cbd5e1',
        borderTop: 'none',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        flexWrap: 'wrap',
        gap: 8
      }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setShowOptionalDialog(true)}
            style={{ padding: '6px 12px', background: '#f8fafc', color: '#0f3a4b', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}
          >
            / Open Optional Bill Dialog Box /
          </button>

          <button
            type="button"
            onClick={handleCancelOptionalBill}
            style={{ padding: '6px 12px', background: '#f8fafc', color: '#be123c', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}
          >
            &lt;&lt; Cancel Optional Bill from Accounts
          </button>

          <button
            type="button"
            onClick={handleRefreshOptionalBills}
            style={{ padding: '6px 12px', background: '#f8fafc', color: '#0f3a4b', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}
          >
            Refresh Optional Bills
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: '#0f3a4b' }}>Bill N/o</span>
          <input
            type="text"
            value={billNo}
            onChange={(e) => setBillNo(e.target.value)}
            style={{ width: 110, padding: '4px 6px', borderRadius: 4, border: '1px solid #be123c', fontSize: 11.5, fontWeight: 900, color: '#be123c', background: '#fff' }}
          />

          <button
            type="button"
            onClick={() => setShowBillPreview(true)}
            style={{ padding: '6px 12px', background: '#f8fafc', color: '#0f3a4b', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}
          >
            Preview Student Bill
          </button>

          <button
            type="button"
            onClick={() => setShowLedgerPreview(true)}
            style={{ padding: '6px 12px', background: '#f8fafc', color: '#0f3a4b', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}
          >
            // Preview Student Ledger
          </button>
        </div>
      </div>

      {/* ── MAIN TAB CONTENT PANEL ── */}
      <div style={{ background: '#ffffff', padding: 14, border: '1px solid #cbd5e1', borderTop: 'none', minHeight: 280 }}>
        
        {/* TAB 1: ADD OPTIONAL & OTHER BILLS TO ACCOUNTS */}
        {activeTab === 'Add Optional & Other Bills to Accounts' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h4 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#0f3a4b', textTransform: 'uppercase' }}>
                Optional & Other Bill Items on Student Account
              </h4>
              <button
                type="button"
                onClick={() => setShowOptionalDialog(true)}
                style={{ padding: '5px 12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}
              >
                ➕ Add New Optional Fee Item
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '8px 10px', width: 30 }}>Select</th>
                  <th style={{ padding: '8px 10px' }}>#</th>
                  <th style={{ padding: '8px 10px' }}>Item Description</th>
                  <th style={{ padding: '8px 10px' }}>Bill Account</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Fee Amount (GHS)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Account Status</th>
                </tr>
              </thead>
              <tbody>
                {optionalBills.map((item, idx) => {
                  const isSelected = selectedOptionalIds.includes(item.id);
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', background: isSelected ? '#e0f2fe' : idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                      <td style={{ padding: '8px 10px' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOptionalSelect(item.id)}
                        />
                      </td>
                      <td style={{ padding: '8px 10px', color: '#64748b', fontWeight: 700 }}>{idx + 1}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 800, color: '#0f3a4b' }}>{item.description}</td>
                      <td style={{ padding: '8px 10px', color: '#475569' }}>{item.billAccount}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>
                        {Number(item.fee).toFixed(2)}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 10.5,
                          fontWeight: 800,
                          background: item.status === 'Added' ? '#dcfce7' : '#fef3c7',
                          color: item.status === 'Added' ? '#15803d' : '#b45309'
                        }}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f1f5f9', fontWeight: 900, borderTop: '2px solid #cbd5e1' }}>
                  <td colSpan={4} style={{ padding: '10px 12px', color: '#0f3a4b' }}>TOTAL OPTIONAL & OTHER BILLS:</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13, color: '#0f3a4b' }}>
                    GHS {optionalBills.reduce((s, i) => s + Number(i.fee), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* TAB 2: ACCEPT PAYMENTS (RECEIPT ENTRY) */}
        {activeTab === 'Accept Payments (Receipt Entry)' && (
          <form onSubmit={handleProcessPayment} style={{ maxWidth: 640, margin: '0 auto', background: '#f8fafc', padding: 20, borderRadius: 8, border: '1px solid #cbd5e1' }}>
            <h4 style={{ margin: '0 0 14px 0', fontSize: 14, fontWeight: 900, color: '#0f3a4b', borderBottom: '2px solid #0f3a4b', paddingBottom: 8, textTransform: 'uppercase' }}>
              Accept Fee Payment & Issue Receipt
            </h4>

            {/* INSTITUTION DUES, FEES & LEVY ALLOCATION BOX */}
            <div style={{
              background: '#f8fafc',
              border: '2px solid #0f3a4b',
              borderRadius: 8,
              padding: 14,
              marginBottom: 16,
              boxShadow: '0 2px 6px rgba(15, 58, 75, 0.08)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, borderBottom: '2px solid #cbd5e1', paddingBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 15 }}>🏛️</span>
                  <h5 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#0f3a4b', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    Institutional Dues, Fees & Levy Breakdown
                  </h5>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#0f3a4b', background: '#e0f2fe', padding: '3px 8px', borderRadius: 10 }}>
                    {institutionDuesItems.length} Fee Items
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddDuesForm(!showAddDuesForm)}
                    style={{
                      background: showAddDuesForm ? '#dc2626' : '#0f3a4b',
                      color: '#ffffff',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: 5,
                      fontSize: 11.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    {showAddDuesForm ? '✕ Cancel' : '➕ Add Dues / Fee Item'}
                  </button>
                </div>
              </div>

              {/* Add New Fee/Dues Form (Plus Control) */}
              {showAddDuesForm && (
                <div style={{ background: '#ffffff', border: '1px dashed #0284c7', borderRadius: 6, padding: 10, marginBottom: 12 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 900, color: '#0369a1', marginBottom: 6 }}>
                    ➕ Add Custom Institution Fee, Dues or Levy Component
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.1fr 1fr auto', gap: 8, alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 2 }}>Dues / Fee Name</label>
                      <input
                        type="text"
                        placeholder="e.g. PTA Dues, Bus Levy, Exam Fee"
                        value={newDuesName}
                        onChange={(e) => setNewDuesName(e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 11.5, fontWeight: 700 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 2 }}>Category</label>
                      <select
                        value={newDuesCategory}
                        onChange={(e) => setNewDuesCategory(e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 11.5 }}
                      >
                        <option value="Tuition & Academic">Tuition & Academic</option>
                        <option value="Association Levy">Association Levy</option>
                        <option value="National Dues">National Dues</option>
                        <option value="Facility">Facility & Maintenance</option>
                        <option value="Health & Medical">Health & Medical</option>
                        <option value="Sanitation">Sanitation</option>
                        <option value="Identity Card">Identity Card</option>
                        <option value="Dues & Levy">Other Dues & Levy</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 2 }}>Amount (GHS)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newDuesAmount}
                        onChange={(e) => setNewDuesAmount(e.target.value)}
                        style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 11.5, fontWeight: 800 }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddInstitutionDues}
                      style={{ padding: '6px 12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 800, fontSize: 11.5, cursor: 'pointer' }}
                    >
                      ➕ Confirm
                    </button>
                  </div>
                </div>
              )}

              {/* Table of Institutional Dues with Minus (-) Remove Buttons */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, background: '#ffffff', borderRadius: 4, overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                <thead>
                  <tr style={{ background: '#0f3a4b', color: '#ffffff', textAlign: 'left' }}>
                    <th style={{ padding: '6px 10px' }}>Fee / Dues Item Component</th>
                    <th style={{ padding: '6px 10px' }}>Category</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right' }}>Amount (GHS)</th>
                    <th style={{ padding: '6px 10px', textAlign: 'center', width: 85 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {institutionDuesItems.map((item, idx) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: '6px 10px', fontWeight: 800, color: '#0f172a' }}>{item.name}</td>
                      <td style={{ padding: '6px 10px', color: '#475569', fontWeight: 600 }}>{item.category}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 900, color: '#0369a1' }}>
                        GHS {Number(item.amount).toFixed(2)}
                      </td>
                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveInstitutionDues(item.id)}
                          style={{
                            padding: '2px 6px',
                            background: '#fee2e2',
                            color: '#dc2626',
                            border: '1px solid #fca5a5',
                            borderRadius: 4,
                            fontSize: 10.5,
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                          title={`Remove ${item.name}`}
                        >
                          ➖ Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr style={{ background: '#f0fdf4', borderTop: '2px solid #0f3a4b', fontWeight: 900 }}>
                    <td colSpan={2} style={{ padding: '8px 10px', color: '#166534', fontSize: 12 }}>
                      TOTAL INSTITUTION DUES & FEES ALLOCATION
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontSize: 14, color: '#15803d' }}>
                      GHS {institutionDuesItems.reduce((s, i) => s + Number(i.amount), 0).toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>Amount Paid (GHS)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #0284c7', fontSize: 14, fontWeight: 900, color: '#0369a1', background: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>Mode of Payment</label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff', fontWeight: 700 }}
                >
                  <option value="Mobile Money">Mobile Money (MTN/Vodafone)</option>
                  <option value="Cash">Cash at Counter</option>
                  <option value="Bank Deposit">Bank Deposit Slip</option>
                  <option value="Cheque">Cheque</option>
                  <option value="POS Card">POS Card Terminal</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>Transaction Ref / Cheque No.</label>
                <input
                  type="text"
                  placeholder="e.g. MM-98471203"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>Payer Name / Depositor</label>
                <input
                  type="text"
                  placeholder="Parent / Guardian Name..."
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>Payment Notes & Remarks</label>
              <textarea
                rows={2}
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12, fontFamily: 'inherit' }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '10px 16px',
                background: 'linear-gradient(135deg, #0f766e, #0d9488)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              💾 Process Payment & Issue Official Commercial Receipt &gt;&gt;
            </button>
          </form>
        )}

        {/* TAB 3: REPRINT RECEIPT */}
        {activeTab === 'Reprint receipt' && (
          <div>
            <h4 style={{ margin: '0 0 10px 0', fontSize: 13, fontWeight: 900, color: '#0f3a4b', textTransform: 'uppercase' }}>
              Issued Commercial Receipts History
            </h4>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '8px 10px' }}>Receipt N/o</th>
                  <th style={{ padding: '8px 10px' }}>Date Issued</th>
                  <th style={{ padding: '8px 10px' }}>Student Details</th>
                  <th style={{ padding: '8px 10px' }}>Payment Mode</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount Paid (GHS)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {receiptsList.map((rcpt, idx) => (
                  <tr key={rcpt.receiptNo} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 900, color: '#0369a1' }}>#{rcpt.receiptNo}</td>
                    <td style={{ padding: '8px 10px', color: '#64748b' }}>{rcpt.date}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 800, color: '#0f3a4b' }}>{rcpt.studentName} ({rcpt.studentId})</td>
                    <td style={{ padding: '8px 10px' }}>{rcpt.mode} ({rcpt.refNo || 'N/A'})</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 900, color: '#15803d' }}>
                      {Number(rcpt.amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        style={{ padding: '4px 10px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                      >
                        🖨️ Reprint Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── OPTIONAL BILL DIALOG MODAL ── */}
      {showOptionalDialog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 480, borderRadius: 8, padding: 20, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '2px solid #0f3a4b', paddingBottom: 8 }}>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: '#0f3a4b', textTransform: 'uppercase' }}>
                Open Optional Bill Dialog Box
              </h4>
              <button onClick={() => setShowOptionalDialog(false)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>Description of Optional Fee</label>
                <input
                  type="text"
                  placeholder="e.g. Special Science Lab Kit"
                  value={newOptDesc}
                  onChange={(e) => setNewOptDesc(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>Bill Account</label>
                <select
                  value={newOptAccount}
                  onChange={(e) => setNewOptAccount(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                >
                  <option value="Transport Account">Transport Account</option>
                  <option value="Feeding Account">Feeding Account</option>
                  <option value="Facility & ICT Account">Facility & ICT Account</option>
                  <option value="Sundry / Miscellaneous">Sundry / Miscellaneous</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>Fee Amount (in GHS)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newOptFee}
                  onChange={(e) => setNewOptFee(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 700 }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => setShowOptionalDialog(false)}
                style={{ padding: '7px 14px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddOptionalFee}
                style={{ padding: '7px 14px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 900, cursor: 'pointer' }}
              >
                Add Optional Fee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PREVIEW STUDENT LEDGER MODAL ── */}
      {showLedgerPreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 640, borderRadius: 8, padding: 20, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '2px solid #0f3a4b', paddingBottom: 8 }}>
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#0f3a4b' }}>
                Official Student Financial Ledger — {studentName} ({studentId})
              </h4>
              <button onClick={() => setShowLedgerPreview(false)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ fontSize: 12, marginBottom: 12, background: '#f8fafc', padding: 10, borderRadius: 6 }}>
              <div><strong>Class:</strong> {studentClass} ({subClass})</div>
              <div><strong>Current Arrears:</strong> GHS {curArrears}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, marginBottom: 14 }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                  <th style={{ padding: 6 }}>Date</th>
                  <th style={{ padding: 6 }}>Transaction Details</th>
                  <th style={{ padding: 6, textAlign: 'right' }}>Debit (Billed)</th>
                  <th style={{ padding: 6, textAlign: 'right' }}>Credit (Paid)</th>
                  <th style={{ padding: 6, textAlign: 'right' }}>Balance (GHS)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: 6 }}>2026-09-01</td>
                  <td style={{ padding: 6 }}>Term 1 Compulsory Bill Posted</td>
                  <td style={{ padding: 6, textAlign: 'right' }}>3,700.00</td>
                  <td style={{ padding: 6, textAlign: 'right' }}>0.00</td>
                  <td style={{ padding: 6, textAlign: 'right', fontWeight: 800 }}>3,700.00</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: 6 }}>2026-09-09</td>
                  <td style={{ padding: 6 }}>Payment Received (Receipt #47545674)</td>
                  <td style={{ padding: 6, textAlign: 'right' }}>0.00</td>
                  <td style={{ padding: 6, textAlign: 'right', color: '#15803d', fontWeight: 800 }}>2,500.00</td>
                  <td style={{ padding: 6, textAlign: 'right', fontWeight: 800, color: '#be123c' }}>1,200.00</td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => window.print()} style={{ padding: '6px 14px', background: '#0f3a4b', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                🖨️ Print Ledger
              </button>
              <button onClick={() => setShowLedgerPreview(false)} style={{ padding: '6px 14px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PREVIEW STUDENT BILL MODAL ── */}
      {showBillPreview && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 640, borderRadius: 8, padding: 20, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '2px solid #0f3a4b', paddingBottom: 8 }}>
              <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#0f3a4b' }}>
                Preview Official Student Bill — {studentName}
              </h4>
              <button onClick={() => setShowBillPreview(false)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ padding: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, marginBottom: 14 }}>
              <div><strong>Bill No:</strong> {billNo}</div>
              <div><strong>Student ID:</strong> {studentId}</div>
              <div><strong>Class Level:</strong> {studentClass} ({subClass})</div>
              <div><strong>Current Term Fee:</strong> GHS 3,700.00</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => window.print()} style={{ padding: '6px 14px', background: '#0f3a4b', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                🖨️ Print Bill
              </button>
              <button onClick={() => setShowBillPreview(false)} style={{ padding: '6px 14px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReceiveOtherPaymentsForm({ setM }) {
  // Top Academic Period & Header Controls
  const [years, setYears] = useState(['2025/2026', '2026/2027', '2027/2028']);
  const [terms, setTerms] = useState(['1st Term', '2nd Term', '3rd Term']);
  const [currYear, setCurrYear] = useState('2026/2027');
  const [currTerm, setCurrTerm] = useState('1st Term');

  const [receiptNo, setReceiptNo] = useState('121289');
  const [prevBal, setPrevBal] = useState('0.00');
  const [balanceOutstanding, setBalanceOutstanding] = useState('0.00');
  const [curArrears, setCurArrears] = useState('0.00');
  const [avlArrears, setAvlArrears] = useState('0.00');

  // Active Tab
  const [activeTab, setActiveTab] = useState('Receipt Entry'); // Options: 'Receipt Entry', 'Reprint receipt'

  // Client / Provider Form Fields
  const [txnNo, setTxnNo] = useState('TXN-2026-9041');
  const [clientProvider, setClientProvider] = useState('DAILY FEEDING');
  const [providerId, setProviderId] = useState('931043');
  const [valueDate, setValueDate] = useState('2026-09-05');
  const [glAccountType, setGlAccountType] = useState('Canteen / Feeding Account');
  const [merchantType, setMerchantType] = useState('MTN Mobile Money');
  const [referenceNo, setReferenceNo] = useState('REF-884920');
  const [amount, setAmount] = useState('750.00');
  const [description, setDescription] = useState('Daily Canteen & Feeding Supplies Receipt');

  // Draft Receipt Items List
  const [receiptItems, setReceiptItems] = useState([
    { id: '1', txnNo: 'TXN-2026-9041', clientProvider: 'DAILY FEEDING', providerId: '931043', glAccount: 'Canteen / Feeding Account', merchant: 'MTN Mobile Money', refNo: 'REF-884920', amount: 750.00, date: '2026-09-05', description: 'Daily Canteen & Feeding Supplies Receipt' }
  ]);

  // Historical Issued Commercial Receipts List
  const [issuedReceipts, setIssuedReceipts] = useState([
    { receiptNo: '121289', date: '2026-09-05', clientProvider: 'DAILY FEEDING', providerId: '931043', merchant: 'MTN Mobile Money', refNo: 'REF-884920', amount: 750.00, cashier: 'Mrs. Grace Accountant', status: 'Checked Out' },
    { receiptNo: '121275', date: '2026-08-28', clientProvider: 'UNIFORM SUPPLIER', providerId: '882041', merchant: 'Bank Deposit', refNo: 'GCB-994812', amount: 3200.00, cashier: 'Mrs. Grace Accountant', status: 'Checked Out' }
  ]);

  const [bannerNotice, setBannerNotice] = useState('');

  // Date Formatting Helper
  const formatDatePreview = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[d.getDay()]} , ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  // Add Item to Current Commercial Receipt
  const handleAddReceiptItem = () => {
    const amtVal = Number(amount) || 0;
    if (amtVal <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    const newItem = {
      id: String(Date.now()),
      txnNo: txnNo || `TXN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      clientProvider,
      providerId,
      glAccount: glAccountType,
      merchant: merchantType,
      refNo: referenceNo,
      amount: amtVal,
      date: valueDate,
      description: description || 'Commercial payment receipt item'
    };
    setReceiptItems(prev => [...prev, newItem]);
    setBannerNotice(`Added receipt item "${newItem.description}" (GHS ${amtVal.toFixed(2)}) to voucher.`);
    setTimeout(() => setBannerNotice(''), 3500);
  };

  // Check Out Receipt (Finalize)
  const handleCheckOutReceipt = () => {
    if (receiptItems.length === 0) {
      alert('No receipt items in voucher to check out.');
      return;
    }
    const totalAmt = receiptItems.reduce((s, i) => s + Number(i.amount), 0);
    const newRcptNo = String(Math.floor(120000 + Math.random() * 90000));
    setReceiptNo(newRcptNo);

    const newIssued = {
      receiptNo: newRcptNo,
      date: valueDate || new Date().toISOString().split('T')[0],
      clientProvider,
      providerId,
      merchant: merchantType,
      refNo: referenceNo,
      amount: totalAmt,
      cashier: 'Mrs. Grace Accountant',
      status: 'Checked Out'
    };

    setIssuedReceipts(prev => [newIssued, ...prev]);
    setBannerNotice(`✅ Checked out Receipt #${newRcptNo} for ${clientProvider} (Total GHS ${totalAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })}).`);
    setActiveTab('Reprint receipt');
  };

  // Print Out Receipt
  const handlePrintOutReceipt = () => {
    window.print();
  };

  // Cancel All
  const handleCancelAll = () => {
    setReceiptItems([]);
    setAmount('');
    setDescription('');
    setBannerNotice('Cleared all current receipt items.');
    setTimeout(() => setBannerNotice(''), 3000);
  };

  const grandTotalItems = receiptItems.reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)', color: '#0f172a' }}>
      {/* ── TOP ACTION & TITLE BANNER BAR ── */}
      <div style={{
        background: '#0f3a4b',
        color: '#ffffff',
        padding: '10px 16px',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: '#0284c7', width: 6, height: 22, borderRadius: 3 }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#ffffff', letterSpacing: '0.02em' }}>
            Receive Other Payments
          </h3>
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: '#e0f2fe' }}>
          REMALJ Carewell Accounts Office · Commercial Voucher Entry
        </div>
      </div>

      {/* ── TOP PERIOD & BALANCES CONTROL HEADER ── */}
      <div style={{
        background: '#f1f5f9',
        padding: 12,
        border: '1px solid #cbd5e1',
        borderTop: 'none',
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 8,
        alignItems: 'center'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 2 }}>Select Current Academic year</label>
          <select
            value={currYear}
            onChange={(e) => setCurrYear(e.target.value)}
            style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 11.5, background: '#fff', fontWeight: 700 }}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 2 }}>Select Current Academic term</label>
          <select
            value={currTerm}
            onChange={(e) => setCurrTerm(e.target.value)}
            style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 11.5, background: '#fff', fontWeight: 700 }}
          >
            {terms.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 2 }}>Receipt N/o:</label>
          <input
            type="text"
            value={receiptNo}
            onChange={(e) => setReceiptNo(e.target.value)}
            style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid #0284c7', fontSize: 11.5, fontWeight: 900, color: '#0369a1', background: '#fff' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 2 }}>Previous Bal.</label>
          <input
            type="text"
            readOnly
            value={prevBal}
            style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 11.5, background: '#fff', fontWeight: 700 }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 2 }}>Balance Outstanding</label>
          <input
            type="text"
            readOnly
            value={balanceOutstanding}
            style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 11.5, background: '#fff', fontWeight: 700 }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 2 }}>Cur. Arrears @ Billing Centre</label>
          <input
            type="text"
            readOnly
            value={curArrears}
            style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 11.5, background: '#fff', fontWeight: 700 }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 2 }}>Avl Arrears @ Billing Centre</label>
          <input
            type="text"
            readOnly
            value={avlArrears}
            style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 11.5, background: '#fff', fontWeight: 700 }}
          />
        </div>
      </div>

      {/* ── NOTIFICATION BANNER ── */}
      {bannerNotice && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '6px 14px', fontSize: 12, fontWeight: 800, borderBottom: '1px solid #bbf7d0' }}>
          <span>ℹ️</span> {bannerNotice}
        </div>
      )}

      {/* ── TAB NAVIGATION BAR ── */}
      <div style={{ display: 'flex', background: '#e2e8f0', borderBottom: '1px solid #cbd5e1' }}>
        {['Receipt Entry', 'Reprint receipt'].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 18px',
                background: isActive ? '#ffffff' : 'transparent',
                color: isActive ? '#0f3a4b' : '#64748b',
                border: 'none',
                borderBottom: isActive ? '3px solid #0f3a4b' : 'none',
                fontWeight: isActive ? 900 : 700,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* ── MAIN FORM AREA ── */}
      <div style={{ background: '#ffffff', padding: 16, border: '1px solid #cbd5e1', borderTop: 'none', minHeight: 320 }}>
        {activeTab === 'Receipt Entry' ? (
          <div>
            {/* Form Inputs Grid */}
            <div style={{
              background: '#f8fafc',
              padding: 16,
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              marginBottom: 16,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12
            }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>Transaction N/o.</label>
                <input
                  type="text"
                  value={txnNo}
                  onChange={(e) => setTxnNo(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>Select Client/Service Provider</label>
                <select
                  value={clientProvider}
                  onChange={(e) => setClientProvider(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 800, color: '#0f3a4b' }}
                >
                  <option value="DAILY FEEDING">DAILY FEEDING</option>
                  <option value="UNIFORM SUPPLIER">UNIFORM SUPPLIER</option>
                  <option value="CANTEEN VENDOR">CANTEEN VENDOR</option>
                  <option value="BOOKSHOP SUPPLIER">BOOKSHOP SUPPLIER</option>
                  <option value="BUS TRANSPORT SERVICES">BUS TRANSPORT SERVICES</option>
                  <option value="MAINTENANCE VENDOR">MAINTENANCE VENDOR</option>
                  <option value="MISCELLANEOUS CLIENT">MISCELLANEOUS CLIENT</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>Service Provider's ID</label>
                <input
                  type="text"
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 800 }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>Value date</label>
                <input
                  type="date"
                  value={valueDate}
                  onChange={(e) => setValueDate(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                />
                <div style={{ fontSize: 11, color: '#0284c7', fontWeight: 700, marginTop: 2 }}>
                  {formatDatePreview(valueDate)}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>Select GL/Account type</label>
                <select
                  value={glAccountType}
                  onChange={(e) => setGlAccountType(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                >
                  <option value="Canteen / Feeding Account">Canteen / Feeding Account</option>
                  <option value="Sundry Revenue Account">Sundry Revenue Account</option>
                  <option value="Bookshop & Sales Account">Bookshop & Sales Account</option>
                  <option value="Transport Revenue Account">Transport Revenue Account</option>
                  <option value="Facility Rental & Misc">Facility Rental & Misc</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>Merchant type</label>
                <select
                  value={merchantType}
                  onChange={(e) => setMerchantType(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                >
                  <option value="MTN Mobile Money">MTN Mobile Money</option>
                  <option value="Vodafone Cash">Vodafone Cash</option>
                  <option value="Bank Deposit">Bank Deposit</option>
                  <option value="Cash at Counter">Cash at Counter</option>
                  <option value="POS Terminal">POS Terminal</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>Reference N/o.</label>
                <input
                  type="text"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>Amount (in GHS)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #0284c7', fontSize: 13, fontWeight: 900, color: '#0369a1', background: '#fff' }}
                />
              </div>

              <div style={{ gridColumn: 'span 3' }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>Description of payment</label>
                <input
                  type="text"
                  placeholder="Enter payment description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                />
              </div>

              {/* Action Buttons Row */}
              <div style={{ gridColumn: 'span 3', display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
                <button
                  type="button"
                  onClick={handleAddReceiptItem}
                  style={{ padding: '7px 14px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                >
                  + Add Receipt item &gt;&gt;
                </button>

                <button
                  type="button"
                  onClick={handlePrintOutReceipt}
                  style={{ padding: '7px 14px', background: '#475569', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                >
                  &lt;&lt; Print out receipt &gt;&gt;
                </button>

                <button
                  type="button"
                  onClick={handleCheckOutReceipt}
                  style={{ padding: '7px 14px', background: '#0f766e', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 900, cursor: 'pointer' }}
                >
                  Check out receipt
                </button>

                <button
                  type="button"
                  onClick={handleCancelAll}
                  style={{ padding: '7px 14px', background: '#be123c', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                >
                  &lt;&lt; Cancel all
                </button>
              </div>
            </div>

            {/* Receipt Items Data Grid */}
            <div style={{ background: '#ffffff', borderRadius: 6, border: '1px solid #cbd5e1', overflow: 'hidden' }}>
              <div style={{ background: '#f1f5f9', padding: '8px 12px', fontSize: 12, fontWeight: 900, color: '#0f3a4b', borderBottom: '1px solid #cbd5e1' }}>
                Draft Commercial Receipt Items List ({receiptItems.length} item records)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '8px 10px' }}>#</th>
                    <th style={{ padding: '8px 10px' }}>Transaction N/o</th>
                    <th style={{ padding: '8px 10px' }}>Client / Provider</th>
                    <th style={{ padding: '8px 10px' }}>GL Account</th>
                    <th style={{ padding: '8px 10px' }}>Description</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount (GHS)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptItems.map((item, idx) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                      <td style={{ padding: '8px 10px', color: '#64748b', fontWeight: 700 }}>{idx + 1}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 900, color: '#0369a1' }}>{item.txnNo}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 800, color: '#0f3a4b' }}>{item.clientProvider} ({item.providerId})</td>
                      <td style={{ padding: '8px 10px', color: '#475569' }}>{item.glAccount}</td>
                      <td style={{ padding: '8px 10px' }}>{item.description}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>
                        {Number(item.amount).toFixed(2)}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setReceiptItems(prev => prev.filter(i => i.id !== item.id))}
                          style={{ padding: '3px 8px', background: '#fee2e2', color: '#be123c', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f1f5f9', fontWeight: 900, borderTop: '2px solid #cbd5e1' }}>
                    <td colSpan={5} style={{ padding: '10px 12px', color: '#0f3a4b' }}>GRAND TOTAL COMMERCIAL VOUCHER:</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13, color: '#0f3a4b' }}>
                      GHS {grandTotalItems.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          /* TAB 2: REPRINT RECEIPT */
          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: 13, fontWeight: 900, color: '#0f3a4b', textTransform: 'uppercase' }}>
              Issued Commercial Receipts History (Other Payments)
            </h4>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '8px 10px' }}>Receipt N/o</th>
                  <th style={{ padding: '8px 10px' }}>Date Issued</th>
                  <th style={{ padding: '8px 10px' }}>Client / Provider</th>
                  <th style={{ padding: '8px 10px' }}>Provider ID</th>
                  <th style={{ padding: '8px 10px' }}>Merchant Mode</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount (GHS)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {issuedReceipts.map((rcpt, idx) => (
                  <tr key={rcpt.receiptNo} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 900, color: '#0369a1' }}>#{rcpt.receiptNo}</td>
                    <td style={{ padding: '8px 10px', color: '#64748b' }}>{rcpt.date}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 800, color: '#0f3a4b' }}>{rcpt.clientProvider}</td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>{rcpt.providerId}</td>
                    <td style={{ padding: '8px 10px' }}>{rcpt.merchant} ({rcpt.refNo || 'N/A'})</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 900, color: '#15803d' }}>
                      {Number(rcpt.amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        style={{ padding: '4px 10px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                      >
                        🖨️ Reprint Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function BatchProcessingForm({ setM, students = [], recordFeePayment }) {
  // Top Academic Period & Header Controls
  const [years, setYears] = useState(['2025/2026', '2026/2027', '2027/2028']);
  const [terms, setTerms] = useState(['1st Term', '2nd Term', '3rd Term']);
  const [currYear, setCurrYear] = useState('2026/2027');
  const [currTerm, setCurrTerm] = useState('1st Term');

  const [batchNo, setBatchNo] = useState('121289');
  const [prevBal, setPrevBal] = useState('0.00');
  const [balanceOutstanding, setBalanceOutstanding] = useState('0.00');
  const [curArrears, setCurArrears] = useState('0.00');
  const [avlArrears, setAvlArrears] = useState('0.00');

  // Active Tab
  const [activeTab, setActiveTab] = useState('Receipt Entry'); // Options: 'Receipt Entry', 'Reprint receipt'

  // Student & Transaction Form Fields
  const [txnNo, setTxnNo] = useState('BATCH-TXN-2026-8801');
  const [studentId, setStudentId] = useState('421270');
  const [studentName, setStudentName] = useState('NANA ADJOA ASARI SEREBOUR');
  const [studentClass, setStudentClass] = useState('Basic 4');
  const [subClass, setSubClass] = useState('B');
  const [modeOfAdmission, setModeOfAdmission] = useState('Day');
  const [statusOfEntry, setStatusOfEntry] = useState('Enrolled');
  const [studentIndex, setStudentIndex] = useState(0);

  const [valueDate, setValueDate] = useState('2025-08-17');
  const [glAccountType, setGlAccountType] = useState('Tuition & Academic Fees');
  const [referenceBy, setReferenceBy] = useState('Student SID');
  const [reference, setReference] = useState('BATCH-REF-9941');
  const [amount, setAmount] = useState('1200.00');
  const [description, setDescription] = useState('Batch Academic Fee Receipt Entry');

  // Draft Batch Receipt Items List
  const [batchItems, setBatchItems] = useState([
    { id: '1', txnNo: 'BATCH-TXN-2026-8801', studentId: '421270', studentName: 'NANA ADJOA ASARI SEREBOUR', studentClass: 'Basic 4 (B)', glAccount: 'Tuition & Academic Fees', refBy: 'Student SID', reference: 'BATCH-REF-9941', amount: 1200.00, date: '2025-08-17', description: 'Batch Academic Fee Receipt Entry' }
  ]);

  // Historical Issued Batch Receipts
  const [issuedBatches, setIssuedBatches] = useState([
    { batchNo: '121289', date: '2025-08-17', studentId: '421270', studentName: 'NANA ADJOA ASARI SEREBOUR', glAccount: 'Tuition & Academic Fees', reference: 'BATCH-REF-9941', amount: 1200.00, cashier: 'Mrs. Grace Accountant', status: 'Batch Processed' },
    { batchNo: '121250', date: '2025-05-10', studentId: '421200', studentName: 'Benjamin Edwards', glAccount: 'Facility & ICT Account', reference: 'BATCH-REF-8802', amount: 3500.00, cashier: 'Mrs. Grace Accountant', status: 'Batch Processed' }
  ]);

  const [bannerNotice, setBannerNotice] = useState('');

  // Date Formatting Helper
  const formatDatePreview = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[d.getDay()]} , ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  // Lookup Student Handler
  const handleLookupStudent = () => {
    if (students && students.length > 0) {
      const match = students.find(s =>
        (s.studentId || '').toLowerCase().includes(studentId.toLowerCase()) ||
        (s.fullName || s.name || '').toLowerCase().includes(studentName.toLowerCase())
      );
      if (match) {
        setStudentId(match.studentId || studentId);
        setStudentName(match.fullName || match.name || studentName);
        setStudentClass(match.level || studentClass);
        setSubClass(match.classSection || subClass);
        const feeRecord = (match.feeAccount || {});
        const bal = match.balance ?? feeRecord.balance ?? 1200;
        setCurArrears(Number(bal).toLocaleString(undefined, { minimumFractionDigits: 2 }));
        setAvlArrears(Number(bal).toLocaleString(undefined, { minimumFractionDigits: 2 }));
        setBannerNotice(`Loaded student: ${match.fullName || match.name} (${match.studentId})`);
        setTimeout(() => setBannerNotice(''), 3000);
        return;
      }
    }
    const nextIdx = (studentIndex + 1) % (students.length || 1);
    setStudentIndex(nextIdx);
    if (students[nextIdx]) {
      const s = students[nextIdx];
      setStudentId(s.studentId || `42127${nextIdx}`);
      setStudentName(s.fullName || s.name || 'NANA ADJOA ASARI SEREBOUR');
      setStudentClass(s.level || 'Basic 4');
      setBannerNotice(`Loaded student: ${s.fullName || s.name}`);
      setTimeout(() => setBannerNotice(''), 3000);
    }
  };

  // Add Item to Batch Receipt List
  const handleAddReceiptItem = () => {
    const amtVal = Number(amount) || 0;
    if (amtVal <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    const newItem = {
      id: String(Date.now()),
      txnNo: txnNo || `BATCH-TXN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      studentId,
      studentName,
      studentClass: `${studentClass} (${subClass})`,
      glAccount: glAccountType,
      refBy: referenceBy,
      reference,
      amount: amtVal,
      date: valueDate,
      description: description || 'Batch processing receipt item'
    };
    setBatchItems(prev => [...prev, newItem]);
    setBannerNotice(`Added batch receipt item for ${studentName} (GHS ${amtVal.toFixed(2)}).`);
    setTimeout(() => setBannerNotice(''), 3500);
  };

  // Check Out Receipt (Finalize Batch)
  const handleCheckOutReceipt = () => {
    if (batchItems.length === 0) {
      alert('No receipt items in batch to check out.');
      return;
    }
    const totalAmt = batchItems.reduce((s, i) => s + Number(i.amount), 0);
    const newBatchNo = String(Math.floor(120000 + Math.random() * 90000));
    setBatchNo(newBatchNo);

    if (typeof recordFeePayment === 'function') {
      batchItems.forEach(item => {
        recordFeePayment({
          id: item.studentId,
          paidAmount: item.amount,
          paymentMethod: 'Batch Processing',
          notes: `Batch #${newBatchNo} - ${item.description}`,
        });
      });
    }

    const newIssued = {
      batchNo: newBatchNo,
      date: valueDate || new Date().toISOString().split('T')[0],
      studentId,
      studentName,
      glAccount: glAccountType,
      reference,
      amount: totalAmt,
      cashier: 'Mrs. Grace Accountant',
      status: 'Batch Processed'
    };

    setIssuedBatches(prev => [newIssued, ...prev]);
    setBannerNotice(`✅ Checked out Batch #${newBatchNo} (Total GHS ${totalAmt.toLocaleString(undefined, { minimumFractionDigits: 2 })} for ${batchItems.length} records).`);
    setActiveTab('Reprint receipt');
  };

  // Print Out Receipt
  const handlePrintOutReceipt = () => {
    window.print();
  };

  // Cancel All
  const handleCancelAll = () => {
    setBatchItems([]);
    setAmount('');
    setDescription('');
    setBannerNotice('Cleared all current batch receipt items.');
    setTimeout(() => setBannerNotice(''), 3000);
  };

  const grandTotalItems = batchItems.reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)', color: '#0f172a' }}>
      {/* ── TOP ACTION & TITLE BANNER BAR ── */}
      <div style={{
        background: '#0f3a4b',
        color: '#ffffff',
        padding: '10px 16px',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: '#0284c7', width: 6, height: 22, borderRadius: 3 }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#ffffff', letterSpacing: '0.02em' }}>
            Batch Processing
          </h3>
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: '#e0f2fe' }}>
          REMALJ Carewell Accounts Office · Bulk & Batch Processing Station
        </div>
      </div>

      {/* ── TOP PERIOD & BALANCES CONTROL HEADER ── */}
      <div style={{
        background: '#f1f5f9',
        padding: 12,
        border: '1px solid #cbd5e1',
        borderTop: 'none',
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 8,
        alignItems: 'center'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 2 }}>Select Current Academic year</label>
          <select
            value={currYear}
            onChange={(e) => setCurrYear(e.target.value)}
            style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 11.5, background: '#fff', fontWeight: 700 }}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 2 }}>Select Current Academic term</label>
          <select
            value={currTerm}
            onChange={(e) => setCurrTerm(e.target.value)}
            style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 11.5, background: '#fff', fontWeight: 700 }}
          >
            {terms.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 2 }}>Batch N/o:</label>
          <input
            type="text"
            value={batchNo}
            onChange={(e) => setBatchNo(e.target.value)}
            style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid #0284c7', fontSize: 11.5, fontWeight: 900, color: '#0369a1', background: '#fff' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 2 }}>Previous Bal.</label>
          <input
            type="text"
            readOnly
            value={prevBal}
            style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 11.5, background: '#fff', fontWeight: 700 }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 2 }}>Balance Outstanding</label>
          <input
            type="text"
            readOnly
            value={balanceOutstanding}
            style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 11.5, background: '#fff', fontWeight: 700 }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 2 }}>Cur. Arrears @ Billing Centre</label>
          <input
            type="text"
            readOnly
            value={curArrears}
            style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 11.5, background: '#fff', fontWeight: 700 }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 2 }}>Avl Arrears @ Billing Centre</label>
          <input
            type="text"
            readOnly
            value={avlArrears}
            style={{ width: '100%', padding: '4px 6px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 11.5, background: '#fff', fontWeight: 700 }}
          />
        </div>
      </div>

      {/* ── NOTIFICATION BANNER ── */}
      {bannerNotice && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '6px 14px', fontSize: 12, fontWeight: 800, borderBottom: '1px solid #bbf7d0' }}>
          <span>ℹ️</span> {bannerNotice}
        </div>
      )}

      {/* ── TAB NAVIGATION BAR ── */}
      <div style={{ display: 'flex', background: '#e2e8f0', borderBottom: '1px solid #cbd5e1' }}>
        {['Receipt Entry', 'Reprint receipt'].map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 18px',
                background: isActive ? '#ffffff' : 'transparent',
                color: isActive ? '#0f3a4b' : '#64748b',
                border: 'none',
                borderBottom: isActive ? '3px solid #0f3a4b' : 'none',
                fontWeight: isActive ? 900 : 700,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* ── MAIN FORM AREA ── */}
      <div style={{ background: '#ffffff', padding: 16, border: '1px solid #cbd5e1', borderTop: 'none', minHeight: 320 }}>
        {activeTab === 'Receipt Entry' ? (
          <div>
            {/* Form Inputs Grid */}
            <div style={{
              background: '#f8fafc',
              padding: 16,
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              marginBottom: 16,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12
            }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>Transaction N/o.</label>
                <input
                  type="text"
                  value={txnNo}
                  onChange={(e) => setTxnNo(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 700 }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Student ID</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    style={{ flex: 1, padding: '6px 8px', borderRadius: 4, border: '1px solid #be123c', fontSize: 12, fontWeight: 900, color: '#be123c', background: '#fff' }}
                  />
                  <button
                    type="button"
                    onClick={handleLookupStudent}
                    style={{ padding: '6px 12px', background: '#cbd5e1', color: '#0f3a4b', border: 'none', borderRadius: 4, fontSize: 11.5, fontWeight: 900, cursor: 'pointer' }}
                    title="Lookup Student"
                  >
                    [...]
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Student Name</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 800, color: '#0f3a4b', background: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Class</label>
                <input
                  type="text"
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Sub class</label>
                <input
                  type="text"
                  value={subClass}
                  onChange={(e) => setSubClass(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Mode of Admission</label>
                <input
                  type="text"
                  value={modeOfAdmission}
                  onChange={(e) => setModeOfAdmission(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Status of entry</label>
                <input
                  type="text"
                  value={statusOfEntry}
                  onChange={(e) => setStatusOfEntry(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                />
              </div>

              <div style={{ gridColumn: 'span 3' }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>Value date</label>
                <input
                  type="date"
                  value={valueDate}
                  onChange={(e) => setValueDate(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                />
                <div style={{ fontSize: 11, color: '#0284c7', fontWeight: 700, marginTop: 2 }}>
                  {formatDatePreview(valueDate)}
                </div>
              </div>

              <div style={{ gridColumn: 'span 3' }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>Select GL/Account type</label>
                <select
                  value={glAccountType}
                  onChange={(e) => setGlAccountType(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                >
                  <option value="Tuition & Academic Fees">Tuition & Academic Fees</option>
                  <option value="Facility & ICT Account">Facility & ICT Account</option>
                  <option value="PTA Development Levy">PTA Development Levy</option>
                  <option value="Canteen / Feeding Account">Canteen / Feeding Account</option>
                  <option value="Transport Account">Transport Account</option>
                  <option value="Sundry Revenue Account">Sundry Revenue Account</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>Reference by</label>
                <select
                  value={referenceBy}
                  onChange={(e) => setReferenceBy(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                >
                  <option value="Student SID">Student SID</option>
                  <option value="Guardian Name">Guardian Name</option>
                  <option value="Bank Deposit Slip">Bank Deposit Slip</option>
                  <option value="MoMo Reference">MoMo Reference</option>
                  <option value="Batch Code">Batch Code</option>
                </select>
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>Reference</label>
                <input
                  type="text"
                  placeholder="Reference number / details..."
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>Amount (in GHS)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #0284c7', fontSize: 13, fontWeight: 900, color: '#0369a1', background: '#fff' }}
                />
              </div>

              <div style={{ gridColumn: 'span 3' }}>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>Description of payment</label>
                <input
                  type="text"
                  placeholder="Enter batch payment description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                />
              </div>

              {/* Action Buttons Row */}
              <div style={{ gridColumn: 'span 3', display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
                <button
                  type="button"
                  onClick={handleAddReceiptItem}
                  style={{ padding: '7px 14px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                >
                  + Add Receipt item &gt;&gt;
                </button>

                <button
                  type="button"
                  onClick={handlePrintOutReceipt}
                  style={{ padding: '7px 14px', background: '#475569', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                >
                  &lt;&lt; Print out receipt &gt;&gt;
                </button>

                <button
                  type="button"
                  onClick={handleCheckOutReceipt}
                  style={{ padding: '7px 14px', background: '#0f766e', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 900, cursor: 'pointer' }}
                >
                  Check out receipt
                </button>

                <button
                  type="button"
                  onClick={handleCancelAll}
                  style={{ padding: '7px 14px', background: '#be123c', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                >
                  &lt;&lt; Cancel all
                </button>
              </div>
            </div>

            {/* Batch Receipt Items Data Grid */}
            <div style={{ background: '#ffffff', borderRadius: 6, border: '1px solid #cbd5e1', overflow: 'hidden' }}>
              <div style={{ background: '#f1f5f9', padding: '8px 12px', fontSize: 12, fontWeight: 900, color: '#0f3a4b', borderBottom: '1px solid #cbd5e1' }}>
                Batch Processing Draft Items List ({batchItems.length} records)
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '8px 10px' }}>#</th>
                    <th style={{ padding: '8px 10px' }}>Transaction N/o</th>
                    <th style={{ padding: '8px 10px' }}>Student Details</th>
                    <th style={{ padding: '8px 10px' }}>GL Account</th>
                    <th style={{ padding: '8px 10px' }}>Reference</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount (GHS)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {batchItems.map((item, idx) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                      <td style={{ padding: '8px 10px', color: '#64748b', fontWeight: 700 }}>{idx + 1}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 900, color: '#0369a1' }}>{item.txnNo}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 800, color: '#0f3a4b' }}>{item.studentName} ({item.studentId})</td>
                      <td style={{ padding: '8px 10px', color: '#475569' }}>{item.glAccount}</td>
                      <td style={{ padding: '8px 10px' }}>{item.refBy}: {item.reference}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>
                        {Number(item.amount).toFixed(2)}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setBatchItems(prev => prev.filter(i => i.id !== item.id))}
                          style={{ padding: '3px 8px', background: '#fee2e2', color: '#be123c', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f1f5f9', fontWeight: 900, borderTop: '2px solid #cbd5e1' }}>
                    <td colSpan={5} style={{ padding: '10px 12px', color: '#0f3a4b' }}>TOTAL BATCH RECEIPT AMOUNT:</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13, color: '#0f3a4b' }}>
                      GHS {grandTotalItems.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          /* TAB 2: REPRINT RECEIPT */
          <div>
            <h4 style={{ margin: '0 0 12px 0', fontSize: 13, fontWeight: 900, color: '#0f3a4b', textTransform: 'uppercase' }}>
              Issued Batch Processing Receipts History
            </h4>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                  <th style={{ padding: '8px 10px' }}>Batch N/o</th>
                  <th style={{ padding: '8px 10px' }}>Date Processed</th>
                  <th style={{ padding: '8px 10px' }}>Student Details</th>
                  <th style={{ padding: '8px 10px' }}>GL Account</th>
                  <th style={{ padding: '8px 10px' }}>Reference</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Batch Total (GHS)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {issuedBatches.map((rcpt, idx) => (
                  <tr key={rcpt.batchNo} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 900, color: '#0369a1' }}>#{rcpt.batchNo}</td>
                    <td style={{ padding: '8px 10px', color: '#64748b' }}>{rcpt.date}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 800, color: '#0f3a4b' }}>{rcpt.studentName} ({rcpt.studentId})</td>
                    <td style={{ padding: '8px 10px' }}>{rcpt.glAccount}</td>
                    <td style={{ padding: '8px 10px' }}>{rcpt.reference}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 900, color: '#15803d' }}>
                      {Number(rcpt.amount).toFixed(2)}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        style={{ padding: '4px 10px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                      >
                        🖨️ Reprint Batch Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ReprintCommercialReceiptForm({ setM }) {
  const [enrollNo, setEnrollNo] = useState('931043');
  const [receiptNo, setReceiptNo] = useState('COMM-REC-121289');
  const [availableBalance, setAvailableBalance] = useState('0.00');

  const [providerName, setProviderName] = useState('DAILY FEEDING SUPPLIES');
  const [glAccount, setGlAccount] = useState('Canteen / Feeding Account');
  const [merchantType, setMerchantType] = useState('MTN Mobile Money');
  const [referenceNo, setReferenceNo] = useState('REF-884920');
  const [amount, setAmount] = useState('750.00');
  const [valueDate, setValueDate] = useState('2026-09-05');
  const [description, setDescription] = useState('Daily Canteen & Feeding Supplies Receipt');

  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [bannerNotice, setBannerNotice] = useState('');

  const sampleReceipts = [
    { enrollNo: '931043', receiptNo: 'COMM-REC-121289', provider: 'DAILY FEEDING SUPPLIES', glAccount: 'Canteen / Feeding Account', merchant: 'MTN Mobile Money', refNo: 'REF-884920', amount: '750.00', date: '2026-09-05', desc: 'Daily Canteen & Feeding Supplies Receipt' },
    { enrollNo: '931088', receiptNo: 'COMM-REC-121250', provider: 'UNIFORM SUPPLIER', glAccount: 'Sundry Revenue Account', merchant: 'Bank Deposit', refNo: 'REF-771920', amount: '3500.00', date: '2026-08-20', desc: 'Uniform Stock Batch Payment' },
    { enrollNo: '931012', receiptNo: 'COMM-REC-121210', provider: 'BUS TRANSPORT SERVICES', glAccount: 'Transport Revenue Account', merchant: 'Cash at Counter', refNo: 'REF-662311', amount: '1200.00', date: '2026-08-15', desc: 'School Bus Fuel & Transport Fleet Deposit' },
  ];

  const handlePreviewReceipt = () => {
    const match = sampleReceipts.find(r =>
      r.receiptNo.toLowerCase().includes(receiptNo.toLowerCase()) ||
      r.enrollNo.toLowerCase().includes(enrollNo.toLowerCase())
    );
    if (match) {
      setEnrollNo(match.enrollNo);
      setReceiptNo(match.receiptNo);
      setProviderName(match.provider);
      setGlAccount(match.glAccount);
      setMerchantType(match.merchant);
      setReferenceNo(match.refNo);
      setAmount(match.amount);
      setValueDate(match.date);
      setDescription(match.desc);
      setBannerNotice(`Receipt ${match.receiptNo} loaded successfully.`);
    } else {
      setBannerNotice(`Preview updated for Receipt #${receiptNo || 'COMM-REC-121289'}.`);
    }
    setTimeout(() => setBannerNotice(''), 3000);
  };

  const handleLookup = () => {
    const randomReceipt = sampleReceipts[Math.floor(Math.random() * sampleReceipts.length)];
    setEnrollNo(randomReceipt.enrollNo);
    setReceiptNo(randomReceipt.receiptNo);
    setProviderName(randomReceipt.provider);
    setGlAccount(randomReceipt.glAccount);
    setMerchantType(randomReceipt.merchant);
    setReferenceNo(randomReceipt.refNo);
    setAmount(randomReceipt.amount);
    setValueDate(randomReceipt.date);
    setDescription(randomReceipt.desc);
    setBannerNotice(`Loaded record for Provider ID ${randomReceipt.enrollNo}.`);
    setTimeout(() => setBannerNotice(''), 3000);
  };

  const amountInWords = (numStr) => {
    const val = parseFloat(numStr) || 0;
    if (val === 750) return 'Seven Hundred Fifty Ghana Cedis Only';
    if (val === 3500) return 'Three Thousand Five Hundred Ghana Cedis Only';
    if (val === 1200) return 'One Thousand Two Hundred Ghana Cedis Only';
    return `${val.toLocaleString()} Ghana Cedis Only`;
  };

  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)', color: '#0f172a' }}>
      {/* ── TOP BLUE TITLE BAR ── */}
      <div style={{
        background: '#0f3a4b',
        color: '#ffffff',
        padding: '10px 16px',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: '#0284c7', width: 6, height: 22, borderRadius: 3 }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#ffffff', letterSpacing: '0.02em' }}>
            Reprint Commercial Receipt
          </h3>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#e0f2fe' }}>
          REMALJ Carewell Accounts Office · Commercial Receipt Viewer & Reprint Station
        </div>
      </div>

      {/* ── TOP CONTROLS ROW ── */}
      <div style={{
        background: '#f1f5f9',
        padding: 12,
        border: '1px solid #cbd5e1',
        borderTop: 'none',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
        alignItems: 'center'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>
            Enroll N/o.
          </label>
          <div style={{ display: 'flex', gap: 4 }}>
            <input
              type="text"
              value={enrollNo}
              onChange={(e) => setEnrollNo(e.target.value)}
              placeholder="Enroll / Provider ID..."
              style={{ flex: 1, padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 800, background: '#fff' }}
            />
            <button
              type="button"
              onClick={handleLookup}
              title="Lookup Receipt"
              style={{ padding: '5px 10px', background: '#cbd5e1', color: '#0f3a4b', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 900, cursor: 'pointer' }}
            >
              [...]
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>
            Receipt N/o:
          </label>
          <input
            type="text"
            value={receiptNo}
            onChange={(e) => setReceiptNo(e.target.value)}
            placeholder="Receipt N/o..."
            style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #0284c7', fontSize: 12, fontWeight: 900, color: '#0369a1', background: '#fff' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>
            Available Balance
          </label>
          <input
            type="text"
            readOnly
            value={availableBalance}
            style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 700, background: '#f8fafc', color: '#475569' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button
            type="button"
            onClick={handlePreviewReceipt}
            style={{
              width: '100%',
              padding: '7px 16px',
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            + Preview receipt &gt;&gt;
          </button>
        </div>
      </div>

      {/* ── NOTIFICATION BANNER ── */}
      {bannerNotice && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '6px 14px', fontSize: 12, fontWeight: 800, borderBottom: '1px solid #bbf7d0' }}>
          <span>ℹ️</span> {bannerNotice}
        </div>
      )}

      {/* ── REPORT VIEWER TOOLBAR BAR ── */}
      <div style={{
        background: '#e2e8f0',
        padding: '6px 14px',
        border: '1px solid #cbd5e1',
        borderTop: 'none',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
        fontSize: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => window.print()}
            title="Print Receipt"
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer', color: '#0f3a4b' }}
          >
            <Printer size={13} /> Print
          </button>

          <button
            type="button"
            onClick={() => alert('Commercial Receipt exported as PDF.')}
            title="Save / Export"
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer', color: '#0f3a4b' }}
          >
            <Download size={13} /> Save PDF
          </button>

          <button
            type="button"
            onClick={handlePreviewReceipt}
            title="Refresh"
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer', color: '#0f3a4b' }}
          >
            <RefreshCw size={13} /> Refresh
          </button>

          <div style={{ height: 16, width: 1, background: '#cbd5e1' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              style={{ padding: '2px 6px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 3, cursor: 'pointer', fontSize: 11, fontWeight: 800 }}
            >
              |&lt;
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              style={{ padding: '2px 6px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 3, cursor: 'pointer', fontSize: 11, fontWeight: 800 }}
            >
              &lt;
            </button>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#334155', padding: '0 4px' }}>
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              style={{ padding: '2px 6px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 3, cursor: 'pointer', fontSize: 11, fontWeight: 800 }}
            >
              &gt;
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              style={{ padding: '2px 6px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 3, cursor: 'pointer', fontSize: 11, fontWeight: 800 }}
            >
              &gt;|
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))}
              style={{ padding: '2px 6px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 3, cursor: 'pointer', fontSize: 11, fontWeight: 800 }}
            >
              -
            </button>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#334155', width: 40, textAlign: 'center' }}>
              {zoomLevel}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.min(200, prev + 10))}
              style={{ padding: '2px 6px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: 3, cursor: 'pointer', fontSize: 11, fontWeight: 800 }}
            >
              +
            </button>
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            <input
              type="text"
              placeholder="Find text..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ padding: '3px 6px', borderRadius: 3, border: '1px solid #cbd5e1', fontSize: 11, background: '#fff' }}
            />
            <button
              type="button"
              style={{ padding: '3px 6px', background: '#cbd5e1', border: 'none', borderRadius: 3, cursor: 'pointer', fontSize: 11 }}
            >
              <Search size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* ── REPORT CANVAS DISPLAY AREA ── */}
      <div style={{
        background: '#475569',
        padding: 24,
        border: '1px solid #cbd5e1',
        borderTop: 'none',
        minHeight: 480,
        display: 'flex',
        justifyContent: 'center',
        overflowX: 'auto'
      }}>
        <div style={{
          background: '#ffffff',
          width: '100%',
          maxWidth: 780,
          padding: 32,
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          borderRadius: 4,
          transform: `scale(${zoomLevel / 100})`,
          transformOrigin: 'top center',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: 40,
            right: 40,
            border: '3px double #0284c7',
            padding: '4px 12px',
            color: '#0284c7',
            fontWeight: 900,
            fontSize: 12,
            letterSpacing: '0.1em',
            borderRadius: 4,
            transform: 'rotate(-5deg)',
            opacity: 0.85
          }}>
            OFFICIAL REPRINT
          </div>

          <div style={{ borderBottom: '3px double #0f3a4b', paddingBottom: 16, marginBottom: 20 }} className="receipt-header-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }} className="receipt-header-inline">
              <img src="/remalj-carewell-logo.jpg" alt="REMALJ Carewell Logo" style={{ height: 55, width: 'auto', borderRadius: 6, flexShrink: 0 }} className="receipt-logo" />
              <div style={{ textAlign: 'left' }} className="receipt-school-text">
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#0f3a4b', letterSpacing: '0.03em', lineHeight: 1.2 }}>
                  REMALJ CAREWELL INSPIRATIONAL SCHOOL
                </h2>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginTop: 4 }}>
                  P.O. BOX CR 404, CANTONMENTS, ACCRA · TEL: +233 (0) 302 770 000
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <div style={{
                display: 'inline-block',
                background: '#0f3a4b',
                color: '#ffffff',
                padding: '4px 16px',
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: '0.05em'
              }}>
                OFFICIAL COMMERCIAL & OTHER RECEIPT
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            background: '#f8fafc',
            padding: 16,
            borderRadius: 6,
            border: '1px solid #e2e8f0',
            marginBottom: 20
          }}>
            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>RECEIPT NUMBER</div>
              <div style={{ fontSize: 14, color: '#0369a1', fontWeight: 900 }}>{receiptNo}</div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>VALUE DATE</div>
              <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 800 }}>{valueDate}</div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>CLIENT / SERVICE PROVIDER</div>
              <div style={{ fontSize: 13, color: '#0f3a4b', fontWeight: 900 }}>{providerName}</div>
            </div>

            <div>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>ENROLL / PROVIDER ID</div>
              <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 800 }}>{enrollNo}</div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20, fontSize: 12 }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px 12px', fontWeight: 800, color: '#475569', width: '35%', background: '#f1f5f9' }}>GL / Account Type:</td>
                <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0f172a' }}>{glAccount}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px 12px', fontWeight: 800, color: '#475569', background: '#f1f5f9' }}>Payment Merchant / Mode:</td>
                <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0f172a' }}>{merchantType}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px 12px', fontWeight: 800, color: '#475569', background: '#f1f5f9' }}>Reference Number:</td>
                <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0f172a' }}>{referenceNo}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px 12px', fontWeight: 800, color: '#475569', background: '#f1f5f9' }}>Payment Description:</td>
                <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0f172a' }}>{description}</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #cbd5e1', background: '#f8fafc' }}>
                <td style={{ padding: '10px 12px', fontWeight: 900, color: '#0f3a4b', fontSize: 13 }}>Amount Paid (GHS):</td>
                <td style={{ padding: '10px 12px', fontWeight: 900, color: '#0284c7', fontSize: 16 }}>
                  GHS {parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <td style={{ padding: '8px 12px', fontWeight: 800, color: '#475569', background: '#f1f5f9' }}>Amount in Words:</td>
                <td style={{ padding: '8px 12px', fontWeight: 800, color: '#0f3a4b', fontStyle: 'italic' }}>
                  {amountInWords(amount)}
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, marginTop: 40, paddingTop: 20, borderTop: '1px solid #cbd5e1' }}>
            <div>
              <div style={{ borderBottom: '1px dashed #94a3b8', height: 30, marginBottom: 4 }} />
              <div style={{ fontSize: 11, fontWeight: 800, color: '#0f3a4b' }}>Mrs. Grace Accountant</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>Issuing Accounts Officer (Cashier)</div>
            </div>

            <div>
              <div style={{ borderBottom: '1px dashed #94a3b8', height: 30, marginBottom: 4 }} />
              <div style={{ fontSize: 11, fontWeight: 800, color: '#0f3a4b' }}>Authorized School Auditor</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>Finance & Audit Verification</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrintIndividualStudentBillForm({ setM, students = [] }) {
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [academicTerm, setAcademicTerm] = useState('1st Term');
  const [departmentUnit, setDepartmentUnit] = useState('Pre-school');
  const [selectedClass, setSelectedClass] = useState('Nursery 1');

  const [studentId, setStudentId] = useState('431433');
  const [studentName, setStudentName] = useState('MARTINA AYEYI ARTHUR');
  const [billNo, setBillNo] = useState('2100452208');
  const [studentIndex, setStudentIndex] = useState(0);

  const [activeTab, setActiveTab] = useState('Next Term Student Compulsory Bill');
  const [bannerNotice, setBannerNotice] = useState('');

  const [compulsoryItems, setCompulsoryItems] = useState([
    { id: 1, item: 'Tuition & Instructional Fee', amount: 2800.00, mandatory: true },
    { id: 2, item: 'ICT Lab & Learning Materials Levy', amount: 450.00, mandatory: true },
    { id: 3, item: 'PTA Development Levy', amount: 200.00, mandatory: true },
    { id: 4, item: 'Terminal Examination & Assessment Fee', amount: 250.00, mandatory: true },
    { id: 5, item: 'Facility & Sanitation Levy', amount: 150.00, mandatory: true },
  ]);

  const [optionalItems, setOptionalItems] = useState([
    { id: 101, item: 'Canteen & Daily Feeding Programme', amount: 750.00, selected: true },
    { id: 102, item: 'School Bus Transport Service', amount: 650.00, selected: true },
    { id: 103, item: 'After-School Care & Homework Club', amount: 300.00, selected: false },
    { id: 104, item: 'Swimming & Sports Extra Curricular', amount: 200.00, selected: true },
  ]);

  const [requisitesItems, setRequisitesItems] = useState([
    { id: 201, item: 'School Customized Exercise Books Pack', qty: 1, unitPrice: 120.00 },
    { id: 202, item: 'Textbooks & Learning Workbook Set', qty: 1, unitPrice: 350.00 },
    { id: 203, item: 'School Crest, Badge & Neck Tie', qty: 1, unitPrice: 80.00 },
    { id: 204, item: 'PE Sports Kit & House T-Shirt', qty: 1, unitPrice: 150.00 },
  ]);

  const handleSearchByName = () => {
    if (students && students.length > 0) {
      const match = students.find(s =>
        (s.studentId || '').toLowerCase().includes(studentId.toLowerCase()) ||
        (s.fullName || s.name || '').toLowerCase().includes(studentName.toLowerCase())
      );
      if (match) {
        setStudentId(match.studentId || studentId);
        setStudentName(match.fullName || match.name || studentName);
        setSelectedClass(match.level || selectedClass);
        setBannerNotice(`Loaded record for student: ${match.fullName || match.name}`);
        setTimeout(() => setBannerNotice(''), 3000);
        return;
      }
    }
    const sampleStudents = [
      { id: '431433', name: 'MARTINA AYEYI ARTHUR', dept: 'Pre-school', class: 'Nursery 1', bill: '2100452208' },
      { id: '431480', name: 'KWAME ASANTE BENEFOH', dept: 'Primary School', class: 'Basic 3', bill: '2100452215' },
      { id: '431502', name: 'ABENA SERWAA KOOMSON', dept: 'Junior High School', class: 'JHS 1', bill: '2100452290' },
    ];
    const nextIdx = (studentIndex + 1) % sampleStudents.length;
    setStudentIndex(nextIdx);
    const s = sampleStudents[nextIdx];
    setStudentId(s.id);
    setStudentName(s.name);
    setDepartmentUnit(s.dept);
    setSelectedClass(s.class);
    setBillNo(s.bill);
    setBannerNotice(`Loaded record for ${s.name} (${s.id}).`);
    setTimeout(() => setBannerNotice(''), 3000);
  };

  const handlePreviewBills = () => {
    setBannerNotice(`Generated individual bill preview for Bill N/o #${billNo}.`);
    setActiveTab('Print Bill');
    setTimeout(() => setBannerNotice(''), 3500);
  };

  const compulsoryTotal = compulsoryItems.reduce((acc, i) => acc + i.amount, 0);
  const optionalTotal = optionalItems.filter(i => i.selected).reduce((acc, i) => acc + i.amount, 0);
  const requisitesTotal = requisitesItems.reduce((acc, i) => acc + (i.qty * i.unitPrice), 0);
  const grandTotalBill = compulsoryTotal + optionalTotal + requisitesTotal;

  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)', color: '#0f172a' }}>
      {/* ── TOP BLUE TITLE BAR ── */}
      <div style={{
        background: '#0f3a4b',
        color: '#ffffff',
        padding: '10px 16px',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: '#0284c7', width: 6, height: 22, borderRadius: 3 }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#ffffff', letterSpacing: '0.02em' }}>
            Print Individual Student Bill
          </h3>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#e0f2fe' }}>
          REMALJ Carewell Accounts Office · Student Billing Workstation
        </div>
      </div>

      {/* ── NOTIFICATION BANNER ── */}
      {bannerNotice && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '6px 14px', fontSize: 12, fontWeight: 800, borderBottom: '1px solid #bbf7d0' }}>
          <span>ℹ️</span> {bannerNotice}
        </div>
      )}

      {/* ── MAIN WORKSPACE (LEFT CONTROL PANEL + RIGHT TABBED VIEW) ── */}
      <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderTop: 'none', background: '#f8fafc', minHeight: 520 }}>

        {/* ── LEFT CONTROL SIDEBAR (Academic Period & Student Info) ── */}
        <div style={{
          width: 260,
          background: '#f1f5f9',
          borderRight: '1px solid #cbd5e1',
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          <div style={{
            fontSize: 12,
            fontWeight: 900,
            color: '#0f3a4b',
            borderBottom: '2px solid #0f3a4b',
            paddingBottom: 4,
            marginBottom: 2
          }}>
            Academic Period
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>
              Select Academic year
            </label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 700 }}
            >
              <option value="2025/2026">2025/2026</option>
              <option value="2026/2027">2026/2027</option>
              <option value="2027/2028">2027/2028</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>
              Select Academic term
            </label>
            <select
              value={academicTerm}
              onChange={(e) => setAcademicTerm(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 700 }}
            >
              <option value="1st Term">1st Term</option>
              <option value="2nd Term">2nd Term</option>
              <option value="3rd Term">3rd Term</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>
              Select Department or Unit
            </label>
            <select
              value={departmentUnit}
              onChange={(e) => setDepartmentUnit(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 700 }}
            >
              <option value="Pre-school">Pre-school</option>
              <option value="Primary School">Primary School</option>
              <option value="Junior High School">Junior High School</option>
              <option value="Senior High School">Senior High School</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>
              Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 700 }}
            >
              <option value="Nursery 1">Nursery 1</option>
              <option value="Nursery 2">Nursery 2</option>
              <option value="KG 1">KG 1</option>
              <option value="KG 2">KG 2</option>
              <option value="Basic 1">Basic 1</option>
              <option value="Basic 2">Basic 2</option>
              <option value="Basic 3">Basic 3</option>
              <option value="Basic 4">Basic 4</option>
              <option value="JHS 1">JHS 1</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>
              Student ID
            </label>
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                style={{ flex: 1, padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 800, background: '#fff' }}
              />
              <button
                type="button"
                onClick={handleSearchByName}
                style={{ padding: '5px 8px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 4, fontSize: 10.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Search by Name
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>
              Student's Name
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 900, color: '#be123c', background: '#fff' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>
              Bill N/o
            </label>
            <input
              type="text"
              value={billNo}
              onChange={(e) => setBillNo(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #0284c7', fontSize: 12, fontWeight: 900, color: '#0369a1', background: '#fff' }}
            />
          </div>

          <button
            type="button"
            onClick={handlePreviewBills}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: '#0f3a4b',
              color: '#ffffff',
              border: 'none',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              marginTop: 6
            }}
          >
            Preview Bills
          </button>
        </div>

        {/* ── RIGHT MAIN DISPLAY AREA (TABBED VIEW) ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#ffffff' }}>

          {/* TAB HEADERS */}
          <div style={{ display: 'flex', background: '#e2e8f0', borderBottom: '1px solid #cbd5e1', overflowX: 'auto' }}>
            {[
              'Next Term Student Compulsory Bill',
              'Next Term Student Optional Bill',
              'Next Term Student Other Requisites',
              'Print Bill'
            ].map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '9px 16px',
                    background: isActive ? '#ffffff' : 'transparent',
                    color: isActive ? '#0f3a4b' : '#64748b',
                    border: 'none',
                    borderBottom: isActive ? '3px solid #0f3a4b' : 'none',
                    fontWeight: isActive ? 900 : 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* TAB CONTENT PANEL */}
          <div style={{ padding: 16, flex: 1, overflowY: 'auto' }}>

            {/* TAB 1: COMPULSORY BILL */}
            {activeTab === 'Next Term Student Compulsory Bill' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#0f3a4b' }}>
                    Compulsory Fee Structure for {selectedClass} ({academicYear} - {academicTerm})
                  </h4>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#0284c7', background: '#e0f2fe', padding: '4px 10px', borderRadius: 4 }}>
                    Total Mandatory: GHS {compulsoryTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, background: '#fff', border: '1px solid #cbd5e1' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                      <th style={{ padding: '8px 12px' }}>#</th>
                      <th style={{ padding: '8px 12px' }}>Compulsory Fee Item Description</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>Type</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Amount (GHS)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compulsoryItems.map((item, idx) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 12px', color: '#64748b', fontWeight: 700 }}>{idx + 1}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 800, color: '#0f3a4b' }}>{item.item}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <span style={{ fontSize: 10.5, fontWeight: 800, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 10 }}>
                            Mandatory
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>
                          {item.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f8fafc', fontWeight: 900, borderTop: '2px solid #cbd5e1' }}>
                      <td colSpan={3} style={{ padding: '10px 12px', color: '#0f3a4b' }}>SUBTOTAL COMPULSORY BILL:</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#0f3a4b', fontSize: 13 }}>
                        GHS {compulsoryTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* TAB 2: OPTIONAL BILL */}
            {activeTab === 'Next Term Student Optional Bill' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#0f3a4b' }}>
                    Optional Auxiliary Services for {studentName} ({studentId})
                  </h4>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#059669', background: '#d1fae5', padding: '4px 10px', borderRadius: 4 }}>
                    Selected Optional: GHS {optionalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, background: '#fff', border: '1px solid #cbd5e1' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>Include</th>
                      <th style={{ padding: '8px 12px' }}>Optional Service Item</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Unit Fee (GHS)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {optionalItems.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', background: item.selected ? '#f0fdf4' : '#fff' }}>
                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setOptionalItems(prev => prev.map(i => i.id === item.id ? { ...i, selected: checked } : i));
                            }}
                            style={{ width: 16, height: 16, cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ padding: '8px 12px', fontWeight: 800, color: '#0f3a4b' }}>{item.item}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>
                          {item.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f8fafc', fontWeight: 900, borderTop: '2px solid #cbd5e1' }}>
                      <td colSpan={2} style={{ padding: '10px 12px', color: '#0f3a4b' }}>SUBTOTAL OPTIONAL SERVICES:</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#059669', fontSize: 13 }}>
                        GHS {optionalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* TAB 3: OTHER REQUISITES */}
            {activeTab === 'Next Term Student Other Requisites' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: '#0f3a4b' }}>
                    School Supplies & Learning Requisites Package
                  </h4>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#d97706', background: '#fef3c7', padding: '4px 10px', borderRadius: 4 }}>
                    Total Requisites: GHS {requisitesTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, background: '#fff', border: '1px solid #cbd5e1' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                      <th style={{ padding: '8px 12px' }}>#</th>
                      <th style={{ padding: '8px 12px' }}>Requisite Description</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center' }}>Quantity</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Unit Cost (GHS)</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total (GHS)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requisitesItems.map((item, idx) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 12px', color: '#64748b', fontWeight: 700 }}>{idx + 1}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 800, color: '#0f3a4b' }}>{item.item}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 700 }}>{item.qty}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right' }}>{item.unitPrice.toFixed(2)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>
                          {(item.qty * item.unitPrice).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#f8fafc', fontWeight: 900, borderTop: '2px solid #cbd5e1' }}>
                      <td colSpan={4} style={{ padding: '10px 12px', color: '#0f3a4b' }}>SUBTOTAL OTHER REQUISITES:</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#d97706', fontSize: 13 }}>
                        GHS {requisitesTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* TAB 4: PRINT BILL */}
            {activeTab === 'Print Bill' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>
                    Official Academic Fee Notice Preview · Bill #{billNo}
                  </span>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{ padding: '6px 16px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                  >
                    🖨️ Print Student Bill
                  </button>
                </div>

                {/* Printable Academic Bill Document Sheet */}
                <div style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: 6,
                  padding: 28,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  maxWidth: 820,
                  margin: '0 auto'
                }}>
                  {/* Header */}
                  <div style={{ borderBottom: '3px double #0f3a4b', paddingBottom: 14, marginBottom: 16 }} className="receipt-header-box">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }} className="receipt-header-inline">
                      <img src="/remalj-carewell-logo.jpg" alt="REMALJ Carewell Logo" style={{ height: 52, width: 'auto', borderRadius: 6, flexShrink: 0 }} className="receipt-logo" />
                      <div style={{ textAlign: 'left' }} className="receipt-school-text">
                        <h2 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: '#0f3a4b', letterSpacing: '0.03em', lineHeight: 1.2 }}>
                          REMALJ CAREWELL INSPIRATIONAL SCHOOL
                        </h2>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginTop: 3 }}>
                          P.O. BOX CR 404, CANTONMENTS, ACCRA · TEL: +233 (0) 302 770 000
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 8 }}>
                      <div style={{
                        display: 'inline-block',
                        background: '#0f3a4b',
                        color: '#ffffff',
                        padding: '4px 16px',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 900
                      }}>
                        OFFICIAL STUDENT ACADEMIC BILL INVOICE ({academicYear} - {academicTerm})
                      </div>
                    </div>
                  </div>

                  {/* Student Details Summary */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 12,
                    background: '#f8fafc',
                    padding: 12,
                    borderRadius: 6,
                    border: '1px solid #e2e8f0',
                    marginBottom: 16,
                    fontSize: 11.5
                  }}>
                    <div><strong style={{ color: '#64748b' }}>STUDENT NAME:</strong><br /><span style={{ fontWeight: 900, color: '#be123c' }}>{studentName}</span></div>
                    <div><strong style={{ color: '#64748b' }}>STUDENT ID:</strong><br /><span style={{ fontWeight: 800, color: '#0f3a4b' }}>{studentId}</span></div>
                    <div><strong style={{ color: '#64748b' }}>BILL NO:</strong><br /><span style={{ fontWeight: 900, color: '#0369a1' }}>#{billNo}</span></div>
                    <div><strong style={{ color: '#64748b' }}>DEPARTMENT:</strong><br /><span style={{ fontWeight: 700 }}>{departmentUnit}</span></div>
                    <div><strong style={{ color: '#64748b' }}>CLASS / LEVEL:</strong><br /><span style={{ fontWeight: 700 }}>{selectedClass}</span></div>
                    <div><strong style={{ color: '#64748b' }}>ACADEMIC PERIOD:</strong><br /><span style={{ fontWeight: 700 }}>{academicYear} ({academicTerm})</span></div>
                  </div>

                  {/* Bill Items Breakdown Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, marginBottom: 16 }}>
                    <thead>
                      <tr style={{ background: '#0f3a4b', color: '#ffffff', textAlign: 'left' }}>
                        <th style={{ padding: '7px 10px' }}>Category</th>
                        <th style={{ padding: '7px 10px' }}>Fee Item / Description</th>
                        <th style={{ padding: '7px 10px', textAlign: 'right' }}>Amount (GHS)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compulsoryItems.map(c => (
                        <tr key={`c-${c.id}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '6px 10px', fontWeight: 800, color: '#0284c7' }}>Compulsory</td>
                          <td style={{ padding: '6px 10px' }}>{c.item}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700 }}>{c.amount.toFixed(2)}</td>
                        </tr>
                      ))}

                      {optionalItems.filter(o => o.selected).map(o => (
                        <tr key={`o-${o.id}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '6px 10px', fontWeight: 800, color: '#059669' }}>Optional Service</td>
                          <td style={{ padding: '6px 10px' }}>{o.item}</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700 }}>{o.amount.toFixed(2)}</td>
                        </tr>
                      ))}

                      {requisitesItems.map(r => (
                        <tr key={`r-${r.id}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '6px 10px', fontWeight: 800, color: '#d97706' }}>Requisite Pack</td>
                          <td style={{ padding: '6px 10px' }}>{r.item} (x{r.qty})</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700 }}>{(r.qty * r.unitPrice).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#f1f5f9', fontWeight: 900, borderTop: '2px solid #cbd5e1' }}>
                        <td colSpan={2} style={{ padding: '10px', color: '#0f3a4b', fontSize: 12 }}>TOTAL ACADEMIC BILL DUE:</td>
                        <td style={{ padding: '10px', textAlign: 'right', color: '#0f3a4b', fontSize: 15 }}>
                          GHS {grandTotalBill.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>

                  {/* Payment Instructions */}
                  <div style={{ background: '#e0f2fe', padding: 12, borderRadius: 6, fontSize: 11, border: '1px solid #bae6fd' }}>
                    <div style={{ fontWeight: 800, color: '#0369a1', marginBottom: 2 }}>Payment Instructions & Deadlines:</div>
                    <div>Please remit full payment before commencement of term.</div>
                    <div>• <strong>MTN MoMo Merchant Code:</strong> #882910</div>
                    <div>• <strong>Bank Deposit:</strong> Barclays Bank Ghana · Account #001-8827162</div>
                    <div>• <strong>Cashier Counter:</strong> REMALJ Carewell Central Accounts Office</div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

function OtherAccountsReceivablesForm({ setM, students = [] }) {
  const [billNo, setBillNo] = useState('47545820');
  const [itemNo, setItemNo] = useState('ITM-88210');
  const [totalBill, setTotalBill] = useState('0.00');

  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [academicTerm, setAcademicTerm] = useState('1st Term');
  const [selectedClass, setSelectedClass] = useState('Basic 4');

  const [studentNo, setStudentNo] = useState('421270');
  const [studentName, setStudentName] = useState('NANA ADJOA ASARI SEREBOUR');
  const [plAccountName, setPlAccountName] = useState('Accounts Receivable - Sundry Students');
  const [accountNo, setAccountNo] = useState('AR-100492-ACC');

  const [description, setDescription] = useState('Outstanding prior term arrears & damages adjustment');
  const [merchant, setMerchant] = useState('Direct Bank Transfer / Counter');
  const [reference, setReference] = useState('REF-REC-99482');

  const [datePrepared, setDatePrepared] = useState('2026-09-05');
  const [dateValued, setDateValued] = useState('2026-09-05');
  const [qty, setQty] = useState('1');
  const [pricePerItem, setPricePerItem] = useState('450.00');

  const [billItems, setBillItems] = useState([
    {
      id: '1',
      billNo: '47545820',
      studentNo: '421270',
      studentName: 'NANA ADJOA ASARI SEREBOUR',
      plAccount: 'Accounts Receivable - Sundry Students',
      description: 'Outstanding prior term arrears & damages adjustment',
      qty: 1,
      price: 450.00,
      total: 450.00,
      datePrepared: '2026-09-05'
    }
  ]);

  const [bannerNotice, setBannerNotice] = useState('');
  const [studentIndex, setStudentIndex] = useState(0);

  const formatDatePreview = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[d.getDay()]} , ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const handleLookupStudent = () => {
    if (students && students.length > 0) {
      const match = students.find(s =>
        (s.studentId || '').toLowerCase().includes(studentNo.toLowerCase()) ||
        (s.fullName || s.name || '').toLowerCase().includes(studentName.toLowerCase())
      );
      if (match) {
        setStudentNo(match.studentId || studentNo);
        setStudentName(match.fullName || match.name || studentName);
        setSelectedClass(match.level || selectedClass);
        setBannerNotice(`Loaded student: ${match.fullName || match.name}`);
        setTimeout(() => setBannerNotice(''), 3000);
        return;
      }
    }
    const sampleStudents = [
      { id: '421270', name: 'NANA ADJOA ASARI SEREBOUR', class: 'Basic 4' },
      { id: '431433', name: 'MARTINA AYEYI ARTHUR', class: 'Nursery 1' },
      { id: '421200', name: 'BENJAMIN EDWARDS', class: 'Basic 6' },
    ];
    const nextIdx = (studentIndex + 1) % sampleStudents.length;
    setStudentIndex(nextIdx);
    const s = sampleStudents[nextIdx];
    setStudentNo(s.id);
    setStudentName(s.name);
    setSelectedClass(s.class);
    setBannerNotice(`Loaded record for ${s.name} (${s.id}).`);
    setTimeout(() => setBannerNotice(''), 3000);
  };

  const handleSearchBill = () => {
    setBannerNotice(`Searching for Bill N/o #${billNo}...`);
    setTimeout(() => setBannerNotice(`Bill #${billNo} retrieved successfully.`), 1000);
    setTimeout(() => setBannerNotice(''), 3500);
  };

  const handleReset = () => {
    setItemNo('');
    setDescription('');
    setQty('1');
    setPricePerItem('0.00');
    setBannerNotice('Form cleared.');
    setTimeout(() => setBannerNotice(''), 2500);
  };

  const handleAddItemToBill = () => {
    const qVal = parseFloat(qty) || 1;
    const priceVal = parseFloat(pricePerItem) || 0;
    if (priceVal <= 0) {
      alert('Please enter a valid price per item.');
      return;
    }
    const newItem = {
      id: String(Date.now()),
      billNo: billNo || '47545820',
      studentNo,
      studentName,
      plAccount: plAccountName,
      description: description || 'Other Receivable Entry',
      qty: qVal,
      price: priceVal,
      total: qVal * priceVal,
      datePrepared
    };
    setBillItems(prev => [...prev, newItem]);
    setBannerNotice(`Added item to Bill #${billNo} (GHS ${(qVal * priceVal).toFixed(2)}).`);
    setTimeout(() => setBannerNotice(''), 3500);
  };

  const handlePostForApproval = () => {
    if (billItems.length === 0) {
      alert('No bill items available to post for approval.');
      return;
    }
    const sumTotal = billItems.reduce((acc, item) => acc + item.total, 0);
    setTotalBill(sumTotal.toFixed(2));
    setBannerNotice(`✅ Bill #${billNo} (Total GHS ${sumTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}) posted for Audit Approval.`);
  };

  const handleNewBill = () => {
    const newBillNum = String(Math.floor(40000000 + Math.random() * 50000000));
    setBillNo(newBillNum);
    setBillItems([]);
    setTotalBill('0.00');
    setBannerNotice(`Initialized new Bill #${newBillNum}.`);
    setTimeout(() => setBannerNotice(''), 3000);
  };

  const calculatedTotalAmount = (parseFloat(qty) || 0) * (parseFloat(pricePerItem) || 0);
  const grandTotalAllItems = billItems.reduce((acc, item) => acc + item.total, 0);

  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)', color: '#0f172a' }}>
      {/* ── TOP BLUE TITLE BAR ── */}
      <div style={{
        background: '#0f3a4b',
        color: '#ffffff',
        padding: '10px 16px',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: '#0284c7', width: 6, height: 22, borderRadius: 3 }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#ffffff', letterSpacing: '0.02em' }}>
            Other Accounts Receivables
          </h3>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#e0f2fe' }}>
          REMALJ Carewell Accounts Office · Accounts Receivable Workstation
        </div>
      </div>

      {/* ── ROW 1: BILL # & ITEM # TOP SEARCH ROW ── */}
      <div style={{
        background: '#f1f5f9',
        padding: 12,
        border: '1px solid #cbd5e1',
        borderTop: 'none',
        display: 'grid',
        gridTemplateColumns: '1.4fr 1.4fr 1fr',
        gap: 12,
        alignItems: 'center'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Bill #</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              value={billNo}
              onChange={(e) => setBillNo(e.target.value)}
              style={{ width: 110, padding: '5px 8px', borderRadius: 4, border: '1px solid #be123c', fontSize: 12, fontWeight: 900, color: '#be123c', background: '#fff' }}
            />
            <button
              type="button"
              onClick={handleSearchBill}
              style={{ padding: '5px 12px', background: '#e2e8f0', color: '#0f3a4b', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
            >
              Search Bill &gt;&gt;
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Item #</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              value={itemNo}
              onChange={(e) => setItemNo(e.target.value)}
              style={{ flex: 1, padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 700 }}
            />
            <button
              type="button"
              onClick={handleReset}
              style={{ padding: '5px 12px', background: '#e2e8f0', color: '#0f3a4b', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
            >
              Reset
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Total Bill</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="text"
              readOnly
              value={totalBill}
              style={{ flex: 1, padding: '5px 8px', borderRadius: 4, border: '1px solid #0284c7', fontSize: 12, fontWeight: 900, color: '#0369a1', background: '#fff' }}
            />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>(CUR)</span>
          </div>
        </div>
      </div>

      {/* ── ROW 2: PERIOD & CLASS SELECTION ── */}
      <div style={{
        background: '#ffffff',
        padding: 12,
        border: '1px solid #cbd5e1',
        borderTop: 'none',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12
      }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Academic Year</label>
          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 700 }}
          >
            <option value="2025/2026">2025/2026</option>
            <option value="2026/2027">2026/2027</option>
            <option value="2027/2028">2027/2028</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Academic Term</label>
          <select
            value={academicTerm}
            onChange={(e) => setAcademicTerm(e.target.value)}
            style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 700 }}
          >
            <option value="1st Term">1st Term</option>
            <option value="2nd Term">2nd Term</option>
            <option value="3rd Term">3rd Term</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Class</label>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 700 }}
          >
            <option value="Basic 1">Basic 1</option>
            <option value="Basic 2">Basic 2</option>
            <option value="Basic 3">Basic 3</option>
            <option value="Basic 4">Basic 4</option>
            <option value="Basic 5">Basic 5</option>
            <option value="Basic 6">Basic 6</option>
            <option value="JHS 1">JHS 1</option>
            <option value="Nursery 1">Nursery 1</option>
          </select>
        </div>
      </div>

      {/* ── NOTIFICATION BANNER ── */}
      {bannerNotice && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '6px 14px', fontSize: 12, fontWeight: 800, borderBottom: '1px solid #bbf7d0' }}>
          <span>ℹ️</span> {bannerNotice}
        </div>
      )}

      {/* ── TRANSACTION DETAILS FORM BODY ── */}
      <div style={{ background: '#ffffff', padding: 14, border: '1px solid #cbd5e1', borderTop: 'none' }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: '#0f3a4b', borderBottom: '2px solid #0f3a4b', paddingBottom: 4, marginBottom: 12 }}>
          Transaction Details
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Student #</label>
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                type="text"
                value={studentNo}
                onChange={(e) => setStudentNo(e.target.value)}
                style={{ flex: 1, padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 800, background: '#fff' }}
              />
              <button
                type="button"
                onClick={handleLookupStudent}
                style={{ padding: '5px 10px', background: '#cbd5e1', color: '#0f3a4b', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 900, cursor: 'pointer' }}
                title="Lookup Student"
              >
                [...]
              </button>
            </div>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Student Name</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 800, color: '#0f3a4b', background: '#fff' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Account N/o.</label>
            <input
              type="text"
              readOnly
              value={accountNo}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#f8fafc', fontWeight: 700 }}
            />
          </div>

          <div style={{ gridColumn: 'span 4' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Name of PL/Account</label>
            <select
              value={plAccountName}
              onChange={(e) => setPlAccountName(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 700 }}
            >
              <option value="Accounts Receivable - Sundry Students">Accounts Receivable - Sundry Students</option>
              <option value="Accounts Receivable - External Commercial Clients">Accounts Receivable - External Commercial Clients</option>
              <option value="Accounts Receivable - Canteen & Feeding Services">Accounts Receivable - Canteen & Feeding Services</option>
              <option value="Accounts Receivable - Transport & Bus Logistics">Accounts Receivable - Transport & Bus Logistics</option>
              <option value="Accounts Receivable - Facility Rentals & Amenities">Accounts Receivable - Facility Rentals & Amenities</option>
            </select>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>
              Description or Particulars (Eg. Arrears, refunds)
            </label>
            <input
              type="text"
              placeholder="Enter receivable description or particulars..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Merchant</label>
            <select
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
            >
              <option value="Direct Bank Transfer / Counter">Direct Bank Transfer / Counter</option>
              <option value="MTN Mobile Money">MTN Mobile Money</option>
              <option value="Vodafone Cash">Vodafone Cash</option>
              <option value="POS Cheque Payment">POS Cheque Payment</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Reference</label>
            <input
              type="text"
              placeholder="Reference N/o..."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Date Prepared</label>
            <input
              type="date"
              value={datePrepared}
              onChange={(e) => setDatePrepared(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
            />
            <div style={{ fontSize: 10.5, color: '#0284c7', fontWeight: 700, marginTop: 2 }}>
              {formatDatePreview(datePrepared)}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Date Valued</label>
            <input
              type="date"
              value={dateValued}
              onChange={(e) => setDateValued(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
            />
            <div style={{ fontSize: 10.5, color: '#0284c7', fontWeight: 700, marginTop: 2 }}>
              {formatDatePreview(dateValued)}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Qty.</label>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 700 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Price Per Item (GHS)</label>
            <input
              type="number"
              step="0.01"
              value={pricePerItem}
              onChange={(e) => setPricePerItem(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 800 }}
            />
          </div>
        </div>

        <div style={{ background: '#f1f5f9', padding: '8px 12px', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#0f3a4b' }}>ITEM CALCULATED TOTAL AMOUNT:</span>
          <span style={{ fontSize: 15, fontWeight: 900, color: '#0284c7' }}>
            GHS {calculatedTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          <button
            type="button"
            onClick={handleAddItemToBill}
            style={{ padding: '7px 14px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
          >
            + Add item to Bill
          </button>

          <button
            type="button"
            onClick={handlePostForApproval}
            style={{ padding: '7px 14px', background: '#0f766e', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 900, cursor: 'pointer' }}
          >
            Post Items for Approval &gt;&gt;
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            style={{ padding: '7px 14px', background: '#475569', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
          >
            Print Out Bill / Memo
          </button>

          <button
            type="button"
            onClick={() => {
              if (billItems.length > 0) {
                setBillItems(prev => prev.slice(0, -1));
                setBannerNotice('Reversed last added bill item.');
                setTimeout(() => setBannerNotice(''), 3000);
              }
            }}
            style={{ padding: '7px 14px', background: '#d97706', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
          >
            Reverse Bill
          </button>

          <button
            type="button"
            onClick={handleReset}
            style={{ padding: '7px 14px', background: '#be123c', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
          >
            Cancel Bill
          </button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <button
            type="button"
            onClick={handleNewBill}
            style={{
              width: '100%',
              padding: '8px 16px',
              background: '#e0f2fe',
              color: '#0369a1',
              border: '1px solid #bae6fd',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 900,
              cursor: 'pointer',
              textAlign: 'center'
            }}
          >
            New Bill &gt;&gt;
          </button>
        </div>

        <div style={{ background: '#ffffff', borderRadius: 6, border: '1px solid #cbd5e1', overflow: 'hidden' }}>
          <div style={{ background: '#f1f5f9', padding: '8px 12px', fontSize: 12, fontWeight: 900, color: '#0f3a4b', borderBottom: '1px solid #cbd5e1' }}>
            Current Receivable Items List ({billItems.length} records)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '8px 10px' }}>#</th>
                <th style={{ padding: '8px 10px' }}>Bill #</th>
                <th style={{ padding: '8px 10px' }}>Student Details</th>
                <th style={{ padding: '8px 10px' }}>PL / Account</th>
                <th style={{ padding: '8px 10px' }}>Particulars / Description</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Price (GHS)</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total (GHS)</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {billItems.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                  <td style={{ padding: '8px 10px', color: '#64748b', fontWeight: 700 }}>{idx + 1}</td>
                  <td style={{ padding: '8px 10px', fontWeight: 900, color: '#0369a1' }}>#{item.billNo}</td>
                  <td style={{ padding: '8px 10px', fontWeight: 800, color: '#0f3a4b' }}>{item.studentName} ({item.studentNo})</td>
                  <td style={{ padding: '8px 10px', color: '#475569' }}>{item.plAccount}</td>
                  <td style={{ padding: '8px 10px' }}>{item.description}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700 }}>{item.qty}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>{item.price.toFixed(2)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>{item.total.toFixed(2)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setBillItems(prev => prev.filter(i => i.id !== item.id))}
                      style={{ padding: '3px 8px', background: '#fee2e2', color: '#be123c', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f1f5f9', fontWeight: 900, borderTop: '2px solid #cbd5e1' }}>
                <td colSpan={7} style={{ padding: '10px 12px', color: '#0f3a4b' }}>TOTAL BILL RECEIVABLE AMOUNT:</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontSize: 13, color: '#0f3a4b' }}>
                  GHS {grandTotalAllItems.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function AuthoriseBillsReceivablesForm({ setM, students = [] }) {
  const [billNo, setBillNo] = useState('');
  const [itemNo, setItemNo] = useState('');
  const [studentNo, setStudentNo] = useState('');
  const [studentName, setStudentName] = useState('');
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [academicTerm, setAcademicTerm] = useState('Term 1');
  const [className, setClassName] = useState('Basic 8 - B');
  const [description, setDescription] = useState('');
  const [dateReceived, setDateReceived] = useState('2026-09-05');
  const [qty, setQty] = useState('1');
  const [pricePerItem, setPricePerItem] = useState('0.00');
  const [merchant, setMerchant] = useState('Direct Bank Transfer');
  const [refChequeNo, setRefChequeNo] = useState('');
  const [plAccountName, setPlAccountName] = useState('Accounts Receivable - Sundry Students');
  const [action, setAction] = useState('Authorise');
  const [valuedDate, setValuedDate] = useState('2026-09-05');
  const [bannerNotice, setBannerNotice] = useState('');

  const [pendingBills, setPendingBills] = useState([
    {
      id: '1',
      billNo: 'BILL-475458',
      itemNo: 'ITEM-01',
      studentNo: 'STD-2026-042',
      studentName: 'Kofi Mensah',
      className: 'Basic 8 - B',
      description: 'Cost of ploughing, shipping services & logistics',
      qty: 1,
      price: 450.00,
      total: 450.00,
      valuedDate: '2026-09-05',
      status: 'Pending Authorization'
    },
    {
      id: '2',
      billNo: 'BILL-475459',
      itemNo: 'ITEM-02',
      studentNo: 'STD-2026-089',
      studentName: 'Ama Serwaa',
      className: 'Basic 7',
      description: 'Excursion & Laboratory Practical Equipment Fee',
      qty: 2,
      price: 150.00,
      total: 300.00,
      valuedDate: '2026-09-05',
      status: 'Pending Authorization'
    }
  ]);

  const formatDatePreview = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      const monthName = d.toLocaleDateString('en-US', { month: 'long' });
      const dayNum = d.getDate();
      const year = d.getFullYear();
      return `${dayName} , ${monthName} ${dayNum}, ${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  const handleSearchBill = () => {
    if (!billNo && !itemNo) {
      alert('Please enter a Bill # or Item # to search.');
      return;
    }
    const found = pendingBills.find(b => b.billNo.includes(billNo) || b.itemNo.includes(itemNo));
    if (found) {
      setBillNo(found.billNo);
      setItemNo(found.itemNo);
      setStudentNo(found.studentNo);
      setStudentName(found.studentName);
      setClassName(found.className);
      setDescription(found.description);
      setQty(String(found.qty));
      setPricePerItem(found.price.toFixed(2));
      setBannerNotice(`Loaded details for ${found.billNo}.`);
      setTimeout(() => setBannerNotice(''), 3000);
    } else {
      alert(`No bill record found matching ${billNo || itemNo}`);
    }
  };

  const handleReset = () => {
    setBillNo('');
    setItemNo('');
    setStudentNo('');
    setStudentName('');
    setDescription('');
    setQty('1');
    setPricePerItem('0.00');
    setRefChequeNo('');
    setBannerNotice('Form cleared.');
    setTimeout(() => setBannerNotice(''), 2000);
  };

  const handleAuthoriseBills = () => {
    if (!billNo && pendingBills.length === 0) {
      alert('No bill selected or queued for authorization.');
      return;
    }
    const targetBill = billNo || (pendingBills[0] && pendingBills[0].billNo);
    setPendingBills(prev => prev.filter(b => b.billNo !== targetBill));
    setBannerNotice(`✅ Bill #${targetBill} successfully AUTHORISED & posted to GL accounts.`);
    setTimeout(() => setBannerNotice(''), 4000);
  };

  const calculatedTotal = (parseFloat(qty) || 0) * (parseFloat(pricePerItem) || 0);

  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)', color: '#0f172a' }}>
      {/* ── TOP BLUE TITLE BAR ── */}
      <div style={{
        background: '#0f3a4b',
        color: '#ffffff',
        padding: '10px 16px',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: '#0284c7', width: 6, height: 22, borderRadius: 3 }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#ffffff', letterSpacing: '0.02em' }}>
            Authorise Bills/Accounts Receivables
          </h3>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#e0f2fe' }}>
          REMALJ Carewell Accounts Office · Authorization Workstation
        </div>
      </div>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: 16
      }}>

        {bannerNotice && (
          <div style={{
            background: '#f0fdf4',
            color: '#166534',
            border: '1px solid #bbf7d0',
            padding: '8px 12px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 800,
            marginBottom: 14
          }}>
            {bannerNotice}
          </div>
        )}

        {/* ── TOP SEARCH & RESET BAR ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 16,
          flexWrap: 'wrap',
          background: '#f8fafc',
          padding: '10px 12px',
          borderRadius: 6,
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#0f3a4b' }}>Bill #</label>
            <input
              type="text"
              value={billNo}
              onChange={(e) => setBillNo(e.target.value)}
              placeholder="Enter Bill #"
              style={{ width: 130, padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
            />
            <button
              type="button"
              onClick={handleSearchBill}
              style={{ padding: '5px 12px', background: '#0f3a4b', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
            >
              Search Bill &gt;&gt;
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#0f3a4b' }}>Item #</label>
            <input
              type="text"
              value={itemNo}
              onChange={(e) => setItemNo(e.target.value)}
              placeholder="Enter Item #"
              style={{ width: 130, padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
            />
            <button
              type="button"
              onClick={handleReset}
              style={{ padding: '5px 12px', background: '#64748b', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* ── SECTION HEADER ── */}
        <div style={{
          fontSize: 12,
          fontWeight: 900,
          color: '#0f3a4b',
          borderBottom: '2px solid #0f3a4b',
          paddingBottom: 4,
          marginBottom: 14,
          textTransform: 'uppercase',
          letterSpacing: '0.03em'
        }}>
          Transaction Details
        </div>

        {/* ── FORM FIELDS GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Student #</label>
            <input
              type="text"
              value={studentNo}
              onChange={(e) => {
                const val = e.target.value;
                setStudentNo(val);
                const match = students.find(s => String(s.id).toLowerCase() === val.toLowerCase() || (s.studentId && s.studentId.toLowerCase() === val.toLowerCase()));
                if (match) setStudentName(`${match.firstName || ''} ${match.lastName || ''}`.trim());
              }}
              placeholder="Student ID..."
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Student Name</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Student Name..."
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Academic Year</label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                style={{ width: '100%', padding: '6px 4px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 11, background: '#fff' }}
              >
                <option value="2026/2027">2026/2027</option>
                <option value="2025/2026">2025/2026</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Academic Term</label>
              <select
                value={academicTerm}
                onChange={(e) => setAcademicTerm(e.target.value)}
                style={{ width: '100%', padding: '6px 4px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 11, background: '#fff' }}
              >
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Class</label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                style={{ width: '100%', padding: '6px 4px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 11, background: '#fff' }}
              >
                <option value="Basic 8 - B">Basic 8 - B</option>
                <option value="Basic 7">Basic 7</option>
                <option value="Basic 9">Basic 9</option>
                <option value="Primary 1">Primary 1</option>
                <option value="Primary 6">Primary 6</option>
              </select>
            </div>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>
              Description or Particulars (Eg. Cost of ploughing, shipping services)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description or particulars..."
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Date Received</label>
            <input
              type="date"
              value={dateReceived}
              onChange={(e) => setDateReceived(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
            />
            <div style={{ fontSize: 10.5, color: '#0284c7', fontWeight: 700, marginTop: 2 }}>
              {formatDatePreview(dateReceived)}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Qty.</label>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 700 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Price Per Item (GHS)</label>
            <input
              type="number"
              step="0.01"
              value={pricePerItem}
              onChange={(e) => setPricePerItem(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 800, textAlign: 'right' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Total Amount (GHS)</label>
            <div style={{
              width: '100%',
              padding: '6px 8px',
              borderRadius: 4,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              fontWeight: 900,
              background: '#f8fafc',
              color: '#0f3a4b',
              textAlign: 'right'
            }}>
              {calculatedTotal.toFixed(2)}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Merchant</label>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <select
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                style={{ flex: 1, padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
              >
                <option value="Direct Bank Transfer">Direct Bank Transfer</option>
                <option value="MTN Mobile Money">MTN Mobile Money</option>
                <option value="Vodafone Cash">Vodafone Cash</option>
                <option value="Cash Counter">Cash Counter</option>
              </select>
              <div style={{ width: 28, height: 28, border: '1px solid #cbd5e1', background: '#f1f5f9', borderRadius: 4 }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Ref/Cheque N/o.</label>
            <input
              type="text"
              value={refChequeNo}
              onChange={(e) => setRefChequeNo(e.target.value)}
              placeholder="Ref/Cheque N/o..."
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Name of PL/Account</label>
            <input
              type="text"
              value={plAccountName}
              onChange={(e) => setPlAccountName(e.target.value)}
              placeholder="PL/Account name..."
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Action</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
            >
              <option value="Authorise">Authorise</option>
              <option value="Reject">Reject</option>
              <option value="Pending Review">Pending Review</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Valued Date</label>
            <input
              type="date"
              value={valuedDate}
              onChange={(e) => setValuedDate(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
            />
            <div style={{ fontSize: 10.5, color: '#0284c7', fontWeight: 700, marginTop: 2 }}>
              {formatDatePreview(valuedDate)}
            </div>
          </div>
        </div>

        {/* ── AUTHORISE BUTTON ── */}
        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            onClick={handleAuthoriseBills}
            style={{
              padding: '8px 24px',
              background: '#0369a1',
              color: '#ffffff',
              border: '1px solid #0284c7',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            Authorise Bills //
          </button>
        </div>

        {/* ── QUEUED PENDING BILLS TABLE ── */}
        <div style={{ background: '#ffffff', borderRadius: 6, border: '1px solid #cbd5e1', overflow: 'hidden' }}>
          <div style={{ background: '#f1f5f9', padding: '8px 12px', fontSize: 12, fontWeight: 900, color: '#0f3a4b', borderBottom: '1px solid #cbd5e1' }}>
            Pending Authorization Queue ({pendingBills.length} records)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '8px 10px' }}>Bill #</th>
                <th style={{ padding: '8px 10px' }}>Item #</th>
                <th style={{ padding: '8px 10px' }}>Student Details</th>
                <th style={{ padding: '8px 10px' }}>Class</th>
                <th style={{ padding: '8px 10px' }}>Description / Particulars</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Price (GHS)</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total (GHS)</th>
                <th style={{ padding: '8px 10px' }}>Valued Date</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingBills.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: 16, textAlign: 'center', color: '#64748b' }}>
                    No pending bills awaiting authorization.
                  </td>
                </tr>
              ) : (
                pendingBills.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 900, color: '#0369a1' }}>#{item.billNo}</td>
                    <td style={{ padding: '8px 10px', color: '#475569' }}>{item.itemNo}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 800, color: '#0f3a4b' }}>{item.studentName} ({item.studentNo})</td>
                    <td style={{ padding: '8px 10px', color: '#475569' }}>{item.className}</td>
                    <td style={{ padding: '8px 10px' }}>{item.description}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700 }}>{item.qty}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{item.price.toFixed(2)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>{item.total.toFixed(2)}</td>
                    <td style={{ padding: '8px 10px', color: '#475569' }}>{item.valuedDate}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setBillNo(item.billNo);
                          setItemNo(item.itemNo);
                          setStudentNo(item.studentNo);
                          setStudentName(item.studentName);
                          setClassName(item.className);
                          setDescription(item.description);
                          setQty(String(item.qty));
                          setPricePerItem(item.price.toFixed(2));
                        }}
                        style={{ padding: '3px 8px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 4, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

function ApprovePVForm({ setM }) {
  const [pvNo, setPvNo] = useState('PV-2026-088');
  const [itemRequisitionNo, setItemRequisitionNo] = useState('REQ-99412');

  const [description, setDescription] = useState('Cost of Electricity Bill & Utility Substation Maintenance');
  const [datePrepared, setDatePrepared] = useState('2026-09-05');
  const [clientProvider, setClientProvider] = useState('ELECTRICITY COMPANY OF GHANA (ECG)');
  const [providerId, setProviderId] = useState('ECG-99310');

  const [qty, setQty] = useState('1');
  const [costPerItem, setCostPerItem] = useState('3200.00');

  const [auditRemarks, setAuditRemarks] = useState('Pre-audited & verified against monthly meter consumption records. Approved for disbursement.');
  const [valuedDate, setValuedDate] = useState('2026-09-05');
  const [actionChoice, setActionChoice] = useState('Pre-audit Approve PV');

  const [bannerNotice, setBannerNotice] = useState('');

  const [pvQueue, setPvQueue] = useState([
    {
      id: '1',
      pvNo: 'PV-2026-088',
      requisitionNo: 'REQ-99412',
      provider: 'ELECTRICITY COMPANY OF GHANA (ECG)',
      providerId: 'ECG-99310',
      description: 'Cost of Electricity Bill & Utility Substation Maintenance',
      qty: 1,
      cost: 3200.00,
      total: 3200.00,
      datePrepared: '2026-09-05',
      status: 'Pending Audit'
    },
    {
      id: '2',
      pvNo: 'PV-2026-082',
      requisitionNo: 'REQ-99380',
      provider: 'DAILY CANTEEN SUPPLIES LTD',
      providerId: '931043',
      description: 'Weekly Canteen Feeding & Grocery Stock Supply',
      qty: 1,
      cost: 1850.00,
      total: 1850.00,
      datePrepared: '2026-09-02',
      status: 'Pending Audit'
    },
    {
      id: '3',
      pvNo: 'PV-2026-075',
      requisitionNo: 'REQ-99300',
      provider: 'STATIONERY & PRINTING DEPOT',
      providerId: '931088',
      description: 'Terminal Assessment Paper & Printing Ink Cartridges',
      qty: 5,
      cost: 240.00,
      total: 1200.00,
      datePrepared: '2026-08-28',
      status: 'Pre-Audited & Approved'
    }
  ]);

  const formatDatePreview = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[d.getDay()]} , ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const handleSearchPV = () => {
    const match = pvQueue.find(p => p.pvNo.toLowerCase().includes(pvNo.toLowerCase()));
    if (match) {
      setPvNo(match.pvNo);
      setItemRequisitionNo(match.requisitionNo);
      setClientProvider(match.provider);
      setProviderId(match.providerId);
      setDescription(match.description);
      setQty(String(match.qty));
      setCostPerItem(match.cost.toFixed(2));
      setDatePrepared(match.datePrepared);
      setBannerNotice(`Loaded PV record #${match.pvNo}.`);
    } else {
      setBannerNotice(`Searching PV Records for #${pvNo}...`);
    }
    setTimeout(() => setBannerNotice(''), 3000);
  };

  const handleActionSingleItem = () => {
    const updatedStatus = actionChoice === 'Pre-audit Approve PV' ? 'Pre-Audited & Approved' : actionChoice;
    setPvQueue(prev => prev.map(p => p.pvNo === pvNo ? { ...p, status: updatedStatus } : p));
    setBannerNotice(`✅ Applied action "${actionChoice}" for PV Item #${pvNo}.`);
    setTimeout(() => setBannerNotice(''), 3500);
  };

  const handleActionAllItems = () => {
    const updatedStatus = actionChoice === 'Pre-audit Approve PV' ? 'Pre-Audited & Approved' : actionChoice;
    setPvQueue(prev => prev.map(p => ({ ...p, status: updatedStatus })));
    setBannerNotice(`✅ Applied action "${actionChoice}" for ALL pending PV items in queue.`);
    setTimeout(() => setBannerNotice(''), 3500);
  };

  const calculatedTotalAmount = (parseFloat(qty) || 0) * (parseFloat(costPerItem) || 0);

  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)', color: '#0f172a' }}>
      {/* ── TOP BLUE TITLE BAR ── */}
      <div style={{
        background: '#0f3a4b',
        color: '#ffffff',
        padding: '10px 16px',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: '#0284c7', width: 6, height: 22, borderRadius: 3 }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#ffffff', letterSpacing: '0.02em' }}>
            Approve PV
          </h3>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#e0f2fe' }}>
          REMALJ Carewell Accounts Office · Payment Voucher Pre-Audit Approval Station
        </div>
      </div>

      {/* ── TOP SEARCH ROW: PV # & REQUISITION # ── */}
      <div style={{
        background: '#f1f5f9',
        padding: 12,
        border: '1px solid #cbd5e1',
        borderTop: 'none',
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gap: 16,
        alignItems: 'center'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>PV #</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              value={pvNo}
              onChange={(e) => setPvNo(e.target.value)}
              placeholder="Enter PV N/o..."
              style={{ width: 140, padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 800, background: '#fff' }}
            />
            <button
              type="button"
              onClick={handleSearchPV}
              style={{ padding: '5px 14px', background: '#e2e8f0', color: '#0f3a4b', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
            >
              Search PV Records &gt;&gt;
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Item Requisition #</label>
          <input
            type="text"
            value={itemRequisitionNo}
            onChange={(e) => setItemRequisitionNo(e.target.value)}
            placeholder="Requisition N/o..."
            style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 700 }}
          />
        </div>
      </div>

      {/* ── NOTIFICATION BANNER ── */}
      {bannerNotice && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '6px 14px', fontSize: 12, fontWeight: 800, borderBottom: '1px solid #bbf7d0' }}>
          <span>ℹ️</span> {bannerNotice}
        </div>
      )}

      {/* ── MIDDLE PV DETAILS FORM PANEL ── */}
      <div style={{ background: '#ffffff', padding: 14, border: '1px solid #cbd5e1', borderTop: 'none' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 14 }}>

          {/* Description or Particulars */}
          <div style={{ gridColumn: 'span 3' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>
              Description or Particulars (Eg. Prepaid, Cost of Electricity Bill)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
            />
          </div>

          {/* Date Prepared */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Date Prepared</label>
            <input
              type="date"
              value={datePrepared}
              onChange={(e) => setDatePrepared(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
            />
            <div style={{ fontSize: 10.5, color: '#0284c7', fontWeight: 700, marginTop: 2 }}>
              {formatDatePreview(datePrepared)}
            </div>
          </div>

          {/* Select Client/Service Provider */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Select Client/Service Provider</label>
            <div style={{ display: 'flex', gap: 4 }}>
              <select
                value={clientProvider}
                onChange={(e) => setClientProvider(e.target.value)}
                style={{ flex: 1, padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 700 }}
              >
                <option value="ELECTRICITY COMPANY OF GHANA (ECG)">ELECTRICITY COMPANY OF GHANA (ECG)</option>
                <option value="GHANA WATER COMPANY LTD (GWCL)">GHANA WATER COMPANY LTD (GWCL)</option>
                <option value="DAILY CANTEEN SUPPLIES LTD">DAILY CANTEEN SUPPLIES LTD</option>
                <option value="STATIONERY & PRINTING DEPOT">STATIONERY & PRINTING DEPOT</option>
                <option value="BUS TRANSPORT MAINTENANCE SERVICES">BUS TRANSPORT MAINTENANCE SERVICES</option>
              </select>
              <button
                type="button"
                style={{ padding: '5px 10px', background: '#cbd5e1', color: '#0f3a4b', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 900, cursor: 'pointer' }}
              >
                [...]
              </button>
            </div>
          </div>

          {/* Service Provider's ID */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Service Provider's ID</label>
            <input
              type="text"
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#f8fafc', fontWeight: 700 }}
            />
          </div>

          {/* Qty. */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Qty.</label>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 700 }}
            />
          </div>

          {/* Cost Per Item (GHS) */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Cost Per Item (GHS)</label>
            <input
              type="number"
              step="0.01"
              value={costPerItem}
              onChange={(e) => setCostPerItem(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 800 }}
            />
          </div>

          {/* Total Amount (GHS) */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Total Amount (GHS)</label>
            <input
              type="text"
              readOnly
              value={calculatedTotalAmount.toFixed(2)}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #0284c7', fontSize: 13, fontWeight: 900, color: '#0369a1', background: '#f8fafc' }}
            />
          </div>
        </div>

        {/* ── BOTTOM PRE-AUDIT APPROVAL SECTION ── */}
        <div style={{
          background: '#f1f5f9',
          padding: 12,
          borderRadius: 6,
          border: '1px solid #cbd5e1',
          marginBottom: 14
        }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: '#0f3a4b', borderBottom: '2px solid #0f3a4b', paddingBottom: 4, marginBottom: 10 }}>
            Pre-Audit
          </div>

          {/* Pre Audit Remarks */}
          <div style={{ marginBottom: 10 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Pre Audit Remarks</label>
            <input
              type="text"
              placeholder="Enter auditor audit remarks, query notes, or approval comments..."
              value={auditRemarks}
              onChange={(e) => setAuditRemarks(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
            />
          </div>

          {/* Valued Date & Action Dropdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Valued Date</label>
              <input
                type="date"
                value={valuedDate}
                onChange={(e) => setValuedDate(e.target.value)}
                style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
              />
              <div style={{ fontSize: 10.5, color: '#0284c7', fontWeight: 700, marginTop: 2 }}>
                {formatDatePreview(valuedDate)}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Action</label>
              <select
                value={actionChoice}
                onChange={(e) => setActionChoice(e.target.value)}
                style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 800, color: '#0f3a4b' }}
              >
                <option value="Pre-audit Approve PV">Pre-audit Approve PV</option>
                <option value="Reject / Query PV">Reject / Query PV</option>
                <option value="Hold PV for Clarification">Hold PV for Clarification</option>
                <option value="Cancel PV">Cancel PV</option>
              </select>
            </div>
          </div>

          {/* Audit Action Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button
              type="button"
              onClick={handleActionSingleItem}
              style={{ padding: '8px 14px', background: '#0f3a4b', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
            >
              Action Single PV Item Only
            </button>

            <button
              type="button"
              onClick={handleActionAllItems}
              style={{ padding: '8px 14px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 900, cursor: 'pointer' }}
            >
              Action All PV Items
            </button>
          </div>
        </div>

        {/* ── PV AUDIT QUEUE TABLE ── */}
        <div style={{ background: '#ffffff', borderRadius: 6, border: '1px solid #cbd5e1', overflow: 'hidden' }}>
          <div style={{ background: '#f1f5f9', padding: '8px 12px', fontSize: 12, fontWeight: 900, color: '#0f3a4b', borderBottom: '1px solid #cbd5e1' }}>
            Pending & Audited Payment Vouchers ({pvQueue.length} records)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '8px 10px' }}>#</th>
                <th style={{ padding: '8px 10px' }}>PV N/o</th>
                <th style={{ padding: '8px 10px' }}>Requisition #</th>
                <th style={{ padding: '8px 10px' }}>Service Provider</th>
                <th style={{ padding: '8px 10px' }}>Particulars / Description</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total (GHS)</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Audit Status</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pvQueue.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                  <td style={{ padding: '8px 10px', color: '#64748b', fontWeight: 700 }}>{idx + 1}</td>
                  <td style={{ padding: '8px 10px', fontWeight: 900, color: '#0369a1' }}>#{item.pvNo}</td>
                  <td style={{ padding: '8px 10px', fontWeight: 700, color: '#475569' }}>{item.requisitionNo}</td>
                  <td style={{ padding: '8px 10px', fontWeight: 800, color: '#0f3a4b' }}>{item.provider}</td>
                  <td style={{ padding: '8px 10px' }}>{item.description}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>
                    {item.total.toFixed(2)}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 10,
                      background: item.status.includes('Approved') ? '#dcfce7' : '#fef3c7',
                      color: item.status.includes('Approved') ? '#15803d' : '#b45309'
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setPvNo(item.pvNo);
                        setItemRequisitionNo(item.requisitionNo);
                        setClientProvider(item.provider);
                        setProviderId(item.providerId);
                        setDescription(item.description);
                        setQty(String(item.qty));
                        setCostPerItem(item.cost.toFixed(2));
                      }}
                      style={{ padding: '3px 8px', background: '#e0f2fe', color: '#0369a1', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PayPVForm({ setM }) {
  const [pvNo, setPvNo] = useState('PV-2026-088');
  const [itemRequisitionNo, setItemRequisitionNo] = useState('REQ-99412');

  const [description, setDescription] = useState('Cost of Electricity Bill & Utility Substation Maintenance');
  const [clientProvider, setClientProvider] = useState('ELECTRICITY COMPANY OF GHANA (ECG)');
  const [providerId, setProviderId] = useState('ECG-99310');

  const [datePrepared, setDatePrepared] = useState('2026-09-05');
  const [qty, setQty] = useState('1');
  const [rate, setRate] = useState('3200.00');

  const [preAuditRemarks, setPreAuditRemarks] = useState('Pre-audited & verified. Cleared for Cash/MoMo Disbursement.');
  const [actionChoice, setActionChoice] = useState('Pay / Disburse PV');
  const [valuedDate, setValuedDate] = useState('2026-09-05');

  // Bottom Payment / Disbursement details
  const [plAccountName, setPlAccountName] = useState('Electricity & Utility Expenses Account');
  const [accountNo, setAccountNo] = useState('EXP-100492-ACC');
  const [merchant, setMerchant] = useState('Direct Cash Counter / Bank');
  const [referenceNo, setReferenceNo] = useState('DISB-PV-99410');
  const [receivedBy, setReceivedBy] = useState('Kwame Addo (ECG Representative)');
  const [datePaid, setDatePaid] = useState('2026-09-05');
  const [dateReceived, setDateReceived] = useState('2026-09-05');

  const [bannerNotice, setBannerNotice] = useState('');

  const [pendingDisbursements, setPendingDisbursements] = useState([
    {
      id: '1',
      pvNo: 'PV-2026-088',
      requisitionNo: 'REQ-99412',
      provider: 'ELECTRICITY COMPANY OF GHANA (ECG)',
      providerId: 'ECG-99310',
      description: 'Cost of Electricity Bill & Utility Substation Maintenance',
      qty: 1,
      rate: 3200.00,
      total: 3200.00,
      plAccount: 'Electricity & Utility Expenses Account',
      accountNo: 'EXP-100492-ACC',
      valuedDate: '2026-09-05',
      status: 'Audited & Cleared for Payment'
    },
    {
      id: '2',
      pvNo: 'PV-2026-089',
      requisitionNo: 'REQ-99415',
      provider: 'DAILY FEEDING SUPPLIES LTD',
      providerId: 'DFS-88310',
      description: 'Canteen & Kitchen Food Ingredients Supply Batch #4',
      qty: 2,
      rate: 750.00,
      total: 1500.00,
      plAccount: 'Canteen & Feeding Operations Account',
      accountNo: 'EXP-100495-ACC',
      valuedDate: '2026-09-05',
      status: 'Audited & Cleared for Payment'
    }
  ]);

  const formatDatePreview = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      const monthName = d.toLocaleDateString('en-US', { month: 'long' });
      const dayNum = d.getDate();
      const year = d.getFullYear();
      return `${dayName} , ${monthName} ${dayNum}, ${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  const calculatedTotal = (parseFloat(qty) || 0) * (parseFloat(rate) || 0);

  const handleSearchPV = () => {
    if (!pvNo) {
      alert('Please enter a PV Number');
      return;
    }
    const found = pendingDisbursements.find(p => p.pvNo.toLowerCase().includes(pvNo.toLowerCase()));
    if (found) {
      setPvNo(found.pvNo);
      setItemRequisitionNo(found.requisitionNo);
      setClientProvider(found.provider);
      setProviderId(found.providerId);
      setDescription(found.description);
      setQty(String(found.qty));
      setRate(found.rate.toFixed(2));
      setPlAccountName(found.plAccount);
      setAccountNo(found.accountNo);
      setBannerNotice(`Loaded PV ${found.pvNo} details.`);
      setTimeout(() => setBannerNotice(''), 3000);
    } else {
      alert(`No PV found matching ${pvNo}`);
    }
  };

  const handleReset = () => {
    setPvNo('');
    setItemRequisitionNo('');
    setDescription('');
    setClientProvider('');
    setProviderId('');
    setQty('1');
    setRate('0.00');
    setPreAuditRemarks('');
    setReceivedBy('');
    setReferenceNo('');
    setBannerNotice('Pay PV form cleared.');
    setTimeout(() => setBannerNotice(''), 2000);
  };

  const handlePayPV = () => {
    if (!pvNo && pendingDisbursements.length === 0) {
      alert('No PV voucher selected for payment.');
      return;
    }
    const targetPv = pvNo || (pendingDisbursements[0] && pendingDisbursements[0].pvNo);
    setPendingDisbursements(prev => prev.filter(p => p.pvNo !== targetPv));
    setBannerNotice(`✅ Payment Voucher #${targetPv} (GHS ${calculatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}) successfully DISBURSED & PAID.`);
    setTimeout(() => setBannerNotice(''), 4500);
  };

  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)', color: '#0f172a' }}>
      {/* ── TOP BLUE TITLE BAR ── */}
      <div style={{
        background: '#0f3a4b',
        color: '#ffffff',
        padding: '10px 16px',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: '#0284c7', width: 6, height: 22, borderRadius: 3 }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#ffffff', letterSpacing: '0.02em' }}>
            Pay PV
          </h3>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#e0f2fe' }}>
          REMALJ Carewell Accounts Office · Payment Voucher Disbursement Station
        </div>
      </div>

      {/* ── MAIN CONTAINER ── */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: 16
      }}>

        {/* ── TOP SEARCH CONTROLS ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginBottom: 14,
          flexWrap: 'wrap',
          background: '#f8fafc',
          padding: '10px 12px',
          borderRadius: 6,
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#0f3a4b' }}>PV #</label>
            <input
              type="text"
              value={pvNo}
              onChange={(e) => setPvNo(e.target.value)}
              placeholder="PV N/o..."
              style={{ width: 140, padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 800 }}
            />
            <button
              type="button"
              onClick={handleSearchPV}
              style={{ padding: '5px 12px', background: '#0f3a4b', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
            >
              Search PV Records
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 11, fontWeight: 800, color: '#0f3a4b' }}>Item Requisition #</label>
            <input
              type="text"
              value={itemRequisitionNo}
              onChange={(e) => setItemRequisitionNo(e.target.value)}
              placeholder="Item Requisition #"
              style={{ width: 150, padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
            />
          </div>
        </div>

        {/* ── GREY PREVIEW BANNER AREA ── */}
        <div style={{
          background: '#5e5663',
          color: '#ffffff',
          padding: '14px 16px',
          borderRadius: 6,
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: 50
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#e2e8f0', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Disbursement Terminal Banner / Preview Area
            </div>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#ffffff', marginTop: 2 }}>
              Voucher #{pvNo || '---'} · {clientProvider || 'No Client Selected'}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 800, color: '#f1f5f9' }}>
            Amount Due: <span style={{ fontSize: 15, fontWeight: 900, color: '#38bdf8' }}>GHS {calculatedTotal.toFixed(2)}</span>
          </div>
        </div>

        {bannerNotice && (
          <div style={{
            background: '#f0fdf4',
            color: '#166534',
            border: '1px solid #bbf7d0',
            padding: '8px 12px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 800,
            marginBottom: 14
          }}>
            {bannerNotice}
          </div>
        )}

        {/* ── TRANSACTION / PV DETAILS FORM ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>
              Description or Particulars (Eg. Prepaid, Cost of Electricity Bill)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description or particulars..."
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>
              Select Client/Service Provider
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <select
                value={clientProvider}
                onChange={(e) => setClientProvider(e.target.value)}
                style={{ flex: 1, padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
              >
                <option value="ELECTRICITY COMPANY OF GHANA (ECG)">ELECTRICITY COMPANY OF GHANA (ECG)</option>
                <option value="DAILY FEEDING SUPPLIES LTD">DAILY FEEDING SUPPLIES LTD</option>
                <option value="GHANA WATER COMPANY LTD (GWCL)">GHANA WATER COMPANY LTD (GWCL)</option>
                <option value="BOGOSO STATIONERY & PRINTING SERVICES">BOGOSO STATIONERY & PRINTING SERVICES</option>
              </select>
              <button
                type="button"
                style={{ padding: '4px 8px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
              >
                [...]
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>
              Service Provider's ID
            </label>
            <input
              type="text"
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              placeholder="Provider ID..."
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Date Prepared</label>
            <input
              type="date"
              value={datePrepared}
              onChange={(e) => setDatePrepared(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
            />
            <div style={{ fontSize: 10.5, color: '#0284c7', fontWeight: 700, marginTop: 2 }}>
              {formatDatePreview(datePrepared)}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Qty.</label>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 700 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Rate</label>
              <input
                type="number"
                step="0.01"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 800, textAlign: 'right' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Total Amount (Cur)</label>
            <div style={{
              width: '100%',
              padding: '6px 8px',
              borderRadius: 4,
              border: '1px solid #cbd5e1',
              fontSize: 13,
              fontWeight: 900,
              background: '#f8fafc',
              color: '#0f3a4b',
              textAlign: 'right'
            }}>
              {calculatedTotal.toFixed(2)}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Pre-Audit Remarks</label>
            <input
              type="text"
              value={preAuditRemarks}
              onChange={(e) => setPreAuditRemarks(e.target.value)}
              placeholder="Pre-audit remarks..."
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Action</label>
            <select
              value={actionChoice}
              onChange={(e) => setActionChoice(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
            >
              <option value="Pay / Disburse PV">Pay / Disburse PV</option>
              <option value="Hold Payment">Hold Payment</option>
              <option value="Query Payment">Query Payment</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Valued Date</label>
            <input
              type="date"
              value={valuedDate}
              onChange={(e) => setValuedDate(e.target.value)}
              style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
            />
            <div style={{ fontSize: 10.5, color: '#0284c7', fontWeight: 700, marginTop: 2 }}>
              {formatDatePreview(valuedDate)}
            </div>
          </div>
        </div>

        {/* ── BOTTOM DISBURSEMENT DETAILS CONTAINER (LIGHT CYAN/TEAL TINT) ── */}
        <div style={{
          background: '#e6f3f1',
          border: '1px solid #bce3de',
          borderRadius: 6,
          padding: 14,
          marginBottom: 16
        }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: '#0f3a4b', marginBottom: 10, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            Payment & Disbursement Account Details
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Name of PL/Account</label>
              <select
                value={plAccountName}
                onChange={(e) => setPlAccountName(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
              >
                <option value="Electricity & Utility Expenses Account">Electricity & Utility Expenses Account</option>
                <option value="Canteen & Feeding Operations Account">Canteen & Feeding Operations Account</option>
                <option value="Office Supplies & Stationery Account">Office Supplies & Stationery Account</option>
                <option value="Transport & Vehicle Maintenance Account">Transport & Vehicle Maintenance Account</option>
                <option value="General Operating Expenses">General Operating Expenses</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Account N/o.</label>
              <input
                type="text"
                value={accountNo}
                onChange={(e) => setAccountNo(e.target.value)}
                placeholder="Account N/o..."
                style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Merchant</label>
              <select
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
              >
                <option value="Direct Cash Counter / Bank">Direct Cash Counter / Bank</option>
                <option value="MTN Mobile Money">MTN Mobile Money</option>
                <option value="Vodafone Cash">Vodafone Cash</option>
                <option value="POS Cheque Payment">POS Cheque Payment</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Reference N/o.</label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="Reference N/o..."
                style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Received By</label>
              <input
                type="text"
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                placeholder="Recipient name / signature..."
                style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Date Paid</label>
              <input
                type="date"
                value={datePaid}
                onChange={(e) => setDatePaid(e.target.value)}
                style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
              />
              <div style={{ fontSize: 10.5, color: '#0284c7', fontWeight: 700, marginTop: 2 }}>
                {formatDatePreview(datePaid)}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Date Received</label>
              <input
                type="date"
                value={dateReceived}
                onChange={(e) => setDateReceived(e.target.value)}
                style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
              />
              <div style={{ fontSize: 10.5, color: '#0284c7', fontWeight: 700, marginTop: 2 }}>
                {formatDatePreview(dateReceived)}
              </div>
            </div>
          </div>
        </div>

        {/* ── ACTION BUTTONS ── */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <button
            type="button"
            onClick={handlePayPV}
            style={{
              padding: '8px 24px',
              background: '#0f3a4b',
              color: '#ffffff',
              border: 'none',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 900,
              cursor: 'pointer'
            }}
          >
            Pay PV //
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            style={{
              padding: '8px 20px',
              background: '#475569',
              color: '#ffffff',
              border: 'none',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Print PV Voucher
          </button>

          <button
            type="button"
            onClick={handleReset}
            style={{
              padding: '8px 18px',
              background: '#be123c',
              color: '#ffffff',
              border: 'none',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            Reset Form
          </button>
        </div>

        {/* ── DISBURSEMENT QUEUE DATA GRID ── */}
        <div style={{ background: '#ffffff', borderRadius: 6, border: '1px solid #cbd5e1', overflow: 'hidden' }}>
          <div style={{ background: '#f1f5f9', padding: '8px 12px', fontSize: 12, fontWeight: 900, color: '#0f3a4b', borderBottom: '1px solid #cbd5e1' }}>
            Approved PV Disbursement Queue ({pendingDisbursements.length} records ready for payment)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '8px 10px' }}>PV #</th>
                <th style={{ padding: '8px 10px' }}>Requisition #</th>
                <th style={{ padding: '8px 10px' }}>Client / Provider</th>
                <th style={{ padding: '8px 10px' }}>Particulars</th>
                <th style={{ padding: '8px 10px' }}>PL / Account</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total (GHS)</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Valued Date</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingDisbursements.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 16, textAlign: 'center', color: '#64748b' }}>
                    No pending PV vouchers awaiting disbursement.
                  </td>
                </tr>
              ) : (
                pendingDisbursements.map((item, idx) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                    <td style={{ padding: '8px 10px', fontWeight: 900, color: '#0369a1' }}>#{item.pvNo}</td>
                    <td style={{ padding: '8px 10px', color: '#475569' }}>{item.requisitionNo}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 800, color: '#0f3a4b' }}>{item.provider}</td>
                    <td style={{ padding: '8px 10px' }}>{item.description}</td>
                    <td style={{ padding: '8px 10px', color: '#475569' }}>{item.plAccount}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>
                      {item.total.toFixed(2)}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', color: '#475569' }}>{item.valuedDate}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 10, background: '#dcfce7', color: '#15803d' }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setPvNo(item.pvNo);
                          setItemRequisitionNo(item.requisitionNo);
                          setClientProvider(item.provider);
                          setProviderId(item.providerId);
                          setDescription(item.description);
                          setQty(String(item.qty));
                          setRate(item.rate.toFixed(2));
                          setPlAccountName(item.plAccount);
                          setAccountNo(item.accountNo);
                        }}
                        style={{ padding: '3px 8px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 4, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                      >
                        Select
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

function PrintPVForm({ setM }) {
  const [pvNo, setPvNo] = useState('PV-2026-088');
  const [activePv, setActivePv] = useState({
    pvNo: 'PV-2026-088',
    requisitionNo: 'REQ-99412',
    datePrepared: '2026-09-05',
    valuedDate: '2026-09-05',
    clientProvider: 'ELECTRICITY COMPANY OF GHANA (ECG)',
    providerId: 'ECG-99310',
    description: 'Cost of Electricity Bill & Utility Substation Maintenance',
    qty: 1,
    rate: 3200.00,
    total: 3200.00,
    amountInWords: 'Three Thousand Two Hundred Ghana Cedis Only',
    plAccountName: 'Electricity & Utility Expenses Account',
    accountNo: 'EXP-100492-ACC',
    merchant: 'Direct Cash Counter / Bank',
    referenceNo: 'DISB-PV-99410',
    receivedBy: 'Kwame Addo (ECG Representative)',
    auditStatus: 'Pre-Audited & Approved',
    preAuditRemarks: 'Pre-audited & verified against monthly meter consumption records.'
  });

  const [zoomLevel, setZoomLevel] = useState(100);
  const [findText, setFindText] = useState('');
  const [bannerNotice, setBannerNotice] = useState('');

  const samplePvRecords = [
    {
      pvNo: 'PV-2026-088',
      requisitionNo: 'REQ-99412',
      datePrepared: '2026-09-05',
      valuedDate: '2026-09-05',
      clientProvider: 'ELECTRICITY COMPANY OF GHANA (ECG)',
      providerId: 'ECG-99310',
      description: 'Cost of Electricity Bill & Utility Substation Maintenance',
      qty: 1,
      rate: 3200.00,
      total: 3200.00,
      amountInWords: 'Three Thousand Two Hundred Ghana Cedis Only',
      plAccountName: 'Electricity & Utility Expenses Account',
      accountNo: 'EXP-100492-ACC',
      merchant: 'Direct Cash Counter / Bank',
      referenceNo: 'DISB-PV-99410',
      receivedBy: 'Kwame Addo (ECG Representative)',
      auditStatus: 'Pre-Audited & Approved',
      preAuditRemarks: 'Pre-audited & verified against monthly meter consumption records.'
    },
    {
      pvNo: 'PV-2026-089',
      requisitionNo: 'REQ-99415',
      datePrepared: '2026-09-05',
      valuedDate: '2026-09-05',
      clientProvider: 'DAILY FEEDING SUPPLIES LTD',
      providerId: 'DFS-88310',
      description: 'Canteen & Kitchen Food Ingredients Supply Batch #4',
      qty: 2,
      rate: 750.00,
      total: 1500.00,
      amountInWords: 'One Thousand Five Hundred Ghana Cedis Only',
      plAccountName: 'Canteen & Feeding Operations Account',
      accountNo: 'EXP-100495-ACC',
      merchant: 'MTN Mobile Money',
      referenceNo: 'MOMO-PAY-99412',
      receivedBy: 'Yaw Frempong (Supplier Representative)',
      auditStatus: 'Pre-Audited & Approved',
      preAuditRemarks: 'Food items inspected and received into kitchen storage.'
    },
    {
      pvNo: 'PV-2026-090',
      requisitionNo: 'REQ-99420',
      datePrepared: '2026-09-06',
      valuedDate: '2026-09-06',
      clientProvider: 'BOGOSO STATIONERY & PRINTING SERVICES',
      providerId: 'BSP-77120',
      description: 'Examination Answer Booklets & Printing Paper Stock',
      qty: 5,
      rate: 170.00,
      total: 850.00,
      amountInWords: 'Eight Hundred Fifty Ghana Cedis Only',
      plAccountName: 'Office Supplies & Stationery Account',
      accountNo: 'EXP-100498-ACC',
      merchant: 'Direct Cash Counter / Bank',
      referenceNo: 'CASH-REC-8812',
      receivedBy: 'Ernest Ansah',
      auditStatus: 'Pre-Audited & Approved',
      preAuditRemarks: 'Stationery quantity verified by examination office.'
    }
  ];

  const handlePreviewPV = () => {
    if (!pvNo) {
      alert('Please enter a PV N/o.');
      return;
    }
    const found = samplePvRecords.find(p => p.pvNo.toLowerCase() === pvNo.toLowerCase());
    if (found) {
      setActivePv(found);
      setBannerNotice(`Loaded preview for Payment Voucher #${found.pvNo}.`);
      setTimeout(() => setBannerNotice(''), 3000);
    } else {
      alert(`No PV document found matching #${pvNo}`);
    }
  };

  const selectPvRecord = (record) => {
    setPvNo(record.pvNo);
    setActivePv(record);
    setBannerNotice(`Loaded preview for Payment Voucher #${record.pvNo}.`);
    setTimeout(() => setBannerNotice(''), 3000);
  };

  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)', color: '#0f172a' }}>
      {/* ── TOP BLUE TITLE BAR ── */}
      <div style={{
        background: '#0f3a4b',
        color: '#ffffff',
        padding: '10px 16px',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: '#0284c7', width: 6, height: 22, borderRadius: 3 }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#ffffff', letterSpacing: '0.02em' }}>
            Print PV
          </h3>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#e0f2fe' }}>
          REMALJ Carewell Accounts Office · Payment Voucher Document Previewer
        </div>
      </div>

      {/* ── MAIN TWO-COLUMN CONTAINER ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr',
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        minHeight: 650
      }}>
        {/* ── LEFT CONTROL PANEL ── */}
        <div className="no-print" style={{
          background: '#d9e2ec',
          borderRight: '1px solid #cbd5e1',
          padding: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>
              PV N/o.
            </label>
            <input
              type="text"
              value={pvNo}
              onChange={(e) => setPvNo(e.target.value)}
              placeholder="Enter PV N/o..."
              style={{
                width: '100%',
                padding: '6px 8px',
                borderRadius: 4,
                border: '1px solid #94a3b8',
                fontSize: 12,
                fontWeight: 800,
                background: '#ffffff',
                marginBottom: 8
              }}
            />
            <button
              type="button"
              onClick={handlePreviewPV}
              style={{
                width: '100%',
                padding: '6px 12px',
                background: '#ffffff',
                color: '#0f3a4b',
                border: '1px solid #94a3b8',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              Preview PV
            </button>
          </div>

          <div style={{ flex: 1, borderTop: '1px solid #cbd5e1', paddingTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#0f3a4b', marginBottom: 8, textTransform: 'uppercase' }}>
              Available PV Records
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {samplePvRecords.map(r => (
                <button
                  key={r.pvNo}
                  type="button"
                  onClick={() => selectPvRecord(r)}
                  style={{
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: 4,
                    border: activePv.pvNo === r.pvNo ? '1px solid #0284c7' : '1px solid #cbd5e1',
                    background: activePv.pvNo === r.pvNo ? '#e0f2fe' : '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: 11.5, fontWeight: 900, color: '#0369a1' }}>#{r.pvNo}</div>
                  <div style={{ fontSize: 10.5, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.clientProvider}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
                    GHS {r.total.toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT MAIN DOCUMENT PREVIEW CANVAS ── */}
        <div style={{ background: '#cbd5e1', padding: 12, overflowX: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* ── REPORT VIEWER TOOLBAR ROW ── */}
          <div className="no-print" style={{
            background: '#ffffff',
            padding: '6px 12px',
            borderRadius: 6,
            border: '1px solid #94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                onClick={() => window.print()}
                title="Print Document"
                style={{ padding: '4px 10px', background: '#0f3a4b', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <span>🖨️</span> Print
              </button>
              <button
                type="button"
                onClick={() => alert('Exporting Payment Voucher as PDF...')}
                title="Save PDF"
                style={{ padding: '4px 10px', background: '#475569', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
              >
                💾 Save PDF
              </button>
              <button
                type="button"
                onClick={() => setBannerNotice('Document reloaded.')}
                title="Refresh"
                style={{ padding: '4px 8px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}
              >
                🔄
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: '#475569' }}>
              <button type="button" style={{ padding: '2px 6px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 3, cursor: 'pointer' }}>|&lt;</button>
              <button type="button" style={{ padding: '2px 6px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 3, cursor: 'pointer' }}>&lt;</button>
              <span>Page 1 of 1</span>
              <button type="button" style={{ padding: '2px 6px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 3, cursor: 'pointer' }}>&gt;</button>
              <button type="button" style={{ padding: '2px 6px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 3, cursor: 'pointer' }}>&gt;|</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button type="button" onClick={() => setZoomLevel(z => Math.max(50, z - 10))} style={{ padding: '2px 6px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 3, cursor: 'pointer' }}>-</button>
                <span style={{ fontSize: 11, fontWeight: 800 }}>{zoomLevel}%</span>
                <button type="button" onClick={() => setZoomLevel(z => Math.min(150, z + 10))} style={{ padding: '2px 6px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 3, cursor: 'pointer' }}>+</button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <input
                  type="text"
                  placeholder="Find text..."
                  value={findText}
                  onChange={(e) => setFindText(e.target.value)}
                  style={{ width: 100, padding: '3px 6px', fontSize: 11, borderRadius: 3, border: '1px solid #cbd5e1' }}
                />
                <span style={{ fontSize: 11 }}>🔍</span>
              </div>
            </div>
          </div>

          {bannerNotice && (
            <div className="no-print" style={{ background: '#f0fdf4', color: '#166534', padding: '6px 12px', borderRadius: 4, fontSize: 11, fontWeight: 800 }}>
              {bannerNotice}
            </div>
          )}

          {/* ── PRINTABLE DOCUMENT CANVAS ── */}
          <div style={{
            background: '#ffffff',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
            borderRadius: 4,
            padding: 24,
            width: '100%',
            maxWidth: 780,
            margin: '0 auto',
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center'
          }}>

            {/* ── SCHOOL LETTERHEAD ── */}
            <div style={{ borderBottom: '2px solid #0f3a4b', paddingBottom: 12, marginBottom: 16 }} className="receipt-header-box">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }} className="receipt-header-inline">
                <img src="/remalj-carewell-logo.jpg" alt="REMALJ Carewell Logo" style={{ height: 50, width: 'auto', borderRadius: 6, flexShrink: 0 }} className="receipt-logo" />
                <div style={{ textAlign: 'left' }} className="receipt-school-text">
                  <h2 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: '#0f3a4b', letterSpacing: '0.03em', lineHeight: 1.2 }}>
                    REMALJ CAREWELL INSPIRATIONAL SCHOOL
                  </h2>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0284c7', marginTop: 2 }}>
                    P.O. Box 112, Bogoso - Western Region · Tel: 0241-112222 / 0242-334455
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    Official Financial & Payment Disbursement Voucher
                  </div>
                </div>
              </div>
            </div>

            {/* ── VOUCHER TITLE BANNER ── */}
            <div style={{
              background: '#0f3a4b',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: 4,
              textAlign: 'center',
              fontWeight: 900,
              fontSize: 14,
              letterSpacing: '0.05em',
              marginBottom: 16,
              textTransform: 'uppercase'
            }}>
              Official Payment Voucher (PV)
            </div>

            {/* ── METADATA GRID ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0', marginBottom: 16, fontSize: 12 }}>
              <div>
                <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700 }}>PV NUMBER:</div>
                <div style={{ fontWeight: 900, color: '#0369a1', fontSize: 14 }}>#{activePv.pvNo}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700 }}>ITEM REQUISITION #:</div>
                <div style={{ fontWeight: 800, color: '#0f3a4b' }}>{activePv.requisitionNo}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700 }}>DATE PREPARED:</div>
                <div style={{ fontWeight: 800, color: '#0f3a4b' }}>{activePv.datePrepared}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700 }}>VALUE DATE:</div>
                <div style={{ fontWeight: 800, color: '#0f3a4b' }}>{activePv.valuedDate}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700 }}>PAYEE / SERVICE PROVIDER:</div>
                <div style={{ fontWeight: 900, color: '#0f3a4b', fontSize: 13 }}>
                  {activePv.clientProvider} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>(ID: {activePv.providerId})</span>
                </div>
              </div>
            </div>

            {/* ── LINE ITEMS TABLE ── */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 16 }}>
              <thead>
                <tr style={{ background: '#0f3a4b', color: '#ffffff', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px' }}>#</th>
                  <th style={{ padding: '8px 10px' }}>Particulars / Description</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Rate (GHS)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total Amount (GHS)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '10px', fontWeight: 700, color: '#64748b' }}>1</td>
                  <td style={{ padding: '10px', fontWeight: 800, color: '#0f3a4b' }}>{activePv.description}</td>
                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: 700 }}>{activePv.qty}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>{activePv.rate.toFixed(2)}</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>{activePv.total.toFixed(2)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr style={{ background: '#f1f5f9', fontWeight: 900, borderTop: '2px solid #0f3a4b' }}>
                  <td colSpan={4} style={{ padding: '10px', color: '#0f3a4b', fontSize: 13 }}>TOTAL VOUCHER AMOUNT:</td>
                  <td style={{ padding: '10px', textAlign: 'right', fontSize: 15, color: '#0284c7' }}>
                    GHS {activePv.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* ── AMOUNT IN WORDS ── */}
            <div style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 4, border: '1px solid #e2e8f0', marginBottom: 16, fontSize: 12 }}>
              <span style={{ fontWeight: 800, color: '#0f3a4b' }}>Amount in Words: </span>
              <span style={{ fontStyle: 'italic', fontWeight: 700, color: '#0369a1' }}>{activePv.amountInWords}</span>
            </div>

            {/* ── ACCOUNTING & DISBURSEMENT DETAILS ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, background: '#f1f5f9', padding: 12, borderRadius: 6, border: '1px solid #cbd5e1', marginBottom: 16, fontSize: 11.5 }}>
              <div>
                <span style={{ fontWeight: 800, color: '#0f3a4b' }}>PL / Account Name: </span>
                <span style={{ fontWeight: 700, color: '#334155' }}>{activePv.plAccountName}</span>
              </div>
              <div>
                <span style={{ fontWeight: 800, color: '#0f3a4b' }}>Account N/o: </span>
                <span style={{ fontWeight: 700, color: '#334155' }}>{activePv.accountNo}</span>
              </div>
              <div>
                <span style={{ fontWeight: 800, color: '#0f3a4b' }}>Payment Merchant: </span>
                <span style={{ fontWeight: 700, color: '#334155' }}>{activePv.merchant}</span>
              </div>
              <div>
                <span style={{ fontWeight: 800, color: '#0f3a4b' }}>Reference N/o: </span>
                <span style={{ fontWeight: 700, color: '#334155' }}>{activePv.referenceNo}</span>
              </div>
            </div>

            {/* ── AUDIT STATUS & SIGNATURES ── */}
            <div style={{ borderTop: '2px dashed #cbd5e1', paddingTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>AUDIT STATUS: </span>
                  <span style={{ fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 4, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
                    {activePv.auditStatus}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#475569', fontStyle: 'italic' }}>
                  Remarks: {activePv.preAuditRemarks}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center', fontSize: 11, paddingTop: 10 }}>
                <div>
                  <div style={{ borderBottom: '1px solid #0f3a4b', paddingBottom: 24, marginBottom: 4, fontWeight: 700, color: '#0f3a4b' }}>
                    Mrs. Grace Accountant
                  </div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: '#64748b' }}>Prepared By (Accounts Officer)</div>
                </div>

                <div>
                  <div style={{ borderBottom: '1px solid #0f3a4b', paddingBottom: 24, marginBottom: 4, fontWeight: 700, color: '#0f3a4b' }}>
                    Internal Auditor
                  </div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: '#64748b' }}>Passed By Auditor</div>
                </div>

                <div>
                  <div style={{ borderBottom: '1px solid #0f3a4b', paddingBottom: 24, marginBottom: 4, fontWeight: 700, color: '#0f3a4b' }}>
                    {activePv.receivedBy}
                  </div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: '#64748b' }}>Received By (Recipient Sign)</div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

function EmployeeProfileForm({ setM }) {
  const [activeTab, setActiveTab] = useState('Personal Information');

  // Staff Header state
  const [staffId, setStaffId] = useState('STF-2026-012');
  const [staffName, setStaffName] = useState('MRS. GRACE ANIM-ANSAH');
  const [remarks, setRemarks] = useState('Senior Accountant · Head of Finance & Administration Department.');
  const [photoUrl, setPhotoUrl] = useState('');

  // Personal Info state
  const [sex, setSex] = useState('Female');
  const [dob, setDob] = useState('1988-09-05');
  const [religion, setReligion] = useState('Christianity - Methodist');
  const [maritalStatus, setMaritalStatus] = useState('Married');
  const [qualification, setQualification] = useState('B.Sc Accounting & Finance, CA Ghana Level 2');
  const [nationality, setNationality] = useState('Ghanaian');
  const [homeTown, setHomeTown] = useState('Bogoso / Tarkwa');
  const [languageSpoken, setLanguageSpoken] = useState('English, Twi, Fante');

  const [postalAddress, setPostalAddress] = useState('P.O. Box 112, Bogoso Western Region');
  const [residenceAddress, setResidenceAddress] = useState('House N/o 45, Market Street, Bogoso');
  const [homePhone, setHomePhone] = useState('0312-099112');
  const [cellPhone, setCellPhone] = useState('0244-123456 / 0208-998877');
  const [emailAddress, setEmailAddress] = useState('grace.accountant@remaljcarewell.edu.gh');

  // Spouse & Emergency Info state
  const [spouseName, setSpouseName] = useState('Mr. Kweku Anim-Ansah');
  const [spouseOccupation, setSpouseOccupation] = useState('Mining Engineer');
  const [spouseEmployer, setSpouseEmployer] = useState('Gold Fields Ghana Ltd');
  const [spousePhone, setSpousePhone] = useState('0243-998811');
  const [emergencyName, setEmergencyName] = useState('Mr. Kweku Anim-Ansah');
  const [emergencyRelationship, setEmergencyRelationship] = useState('Spouse');
  const [emergencyPhone, setEmergencyPhone] = useState('0243-998811');

  // Bank Info state
  const [bankName, setBankName] = useState('Barclays Bank Ghana (Absa)');
  const [bankBranch, setBankBranch] = useState('Tarkwa Main Branch');
  const [accountName, setAccountName] = useState('Grace Anim-Ansah');
  const [accountNumber, setAccountNumber] = useState('001-8827162-901');
  const [ssnitNumber, setSsnitNumber] = useState('C129948192001');
  const [tinNumber, setTinNumber] = useState('P0019283741');

  // Other Related Data state
  const [department, setDepartment] = useState('Accounts & Finance');
  const [jobTitle, setJobTitle] = useState('Senior Accountant');
  const [dateEmployed, setDateEmployed] = useState('2018-09-01');
  const [employmentStatus, setEmploymentStatus] = useState('Permanent Staff');

  const [bannerNotice, setBannerNotice] = useState('');

  const [employeeDirectory, setEmployeeDirectory] = useState([
    {
      staffId: 'STF-2026-012',
      staffName: 'MRS. GRACE ANIM-ANSAH',
      department: 'Accounts & Finance',
      jobTitle: 'Senior Accountant',
      cellPhone: '0244-123456',
      status: 'Active Permanent'
    },
    {
      staffId: 'STF-2026-015',
      staffName: 'MR. JOHN MENSAH',
      department: 'Teaching Staff',
      jobTitle: 'Head Teacher (Primary)',
      cellPhone: '0244-998822',
      status: 'Active Permanent'
    },
    {
      staffId: 'STF-2026-020',
      staffName: 'KWAME ADDO',
      department: 'Administration',
      jobTitle: 'Administrative Secretary',
      cellPhone: '0208-112233',
      status: 'Active Permanent'
    }
  ]);

  const formatDatePreview = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
      const monthName = d.toLocaleDateString('en-US', { month: 'long' });
      const dayNum = d.getDate();
      const year = d.getFullYear();
      return `${dayName} , ${monthName} ${dayNum}, ${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  const handleSaveProfile = () => {
    if (!staffName || !staffId) {
      alert('Please enter Staff Name and Staff ID.');
      return;
    }
    setBannerNotice(`✅ Employee profile for ${staffName} (#${staffId}) successfully saved!`);
    setTimeout(() => setBannerNotice(''), 4000);
  };

  const handleNewRecord = () => {
    const newId = `STF-2026-0${Math.floor(25 + Math.random() * 50)}`;
    setStaffId(newId);
    setStaffName('');
    setRemarks('');
    setPostalAddress('');
    setResidenceAddress('');
    setHomePhone('');
    setCellPhone('');
    setEmailAddress('');
    setBannerNotice(`Initialized new Employee Profile record #${newId}.`);
    setTimeout(() => setBannerNotice(''), 3000);
  };

  const selectEmployee = (emp) => {
    setStaffId(emp.staffId);
    setStaffName(emp.staffName);
    setDepartment(emp.department);
    setJobTitle(emp.jobTitle);
    setCellPhone(emp.cellPhone);
    setBannerNotice(`Loaded profile record for ${emp.staffName}.`);
    setTimeout(() => setBannerNotice(''), 3000);
  };

  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)', color: '#0f172a' }}>
      {/* ── TOP BLUE TITLE BAR ── */}
      <div style={{
        background: '#0f3a4b',
        color: '#ffffff',
        padding: '10px 16px',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: '#0284c7', width: 6, height: 22, borderRadius: 3 }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#ffffff', letterSpacing: '0.02em' }}>
            Employee's Profile
          </h3>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#e0f2fe' }}>
          Employee's Information Service · REMALJ Carewell HR & Payroll System
        </div>
      </div>

      {/* ── MAIN CONTAINER ── */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: 16
      }}>

        {bannerNotice && (
          <div style={{
            background: '#f0fdf4',
            color: '#166534',
            border: '1px solid #bbf7d0',
            padding: '8px 12px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 800,
            marginBottom: 14
          }}>
            {bannerNotice}
          </div>
        )}

        {/* ── TOP STAFF PHOTO & IDENTIFICATION HEADER BOX ── */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: 6,
          padding: 14,
          marginBottom: 16,
          display: 'grid',
          gridTemplateColumns: '130px 1fr',
          gap: 16
        }}>
          {/* PHOTO BOX */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 100,
              height: 105,
              border: '1px solid #94a3b8',
              borderRadius: 4,
              background: '#e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#64748b',
              fontSize: 11,
              fontWeight: 700,
              overflow: 'hidden'
            }}>
              {photoUrl ? (
                <img src={photoUrl} alt="Staff" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <>
                  <div style={{ fontSize: 28, marginBottom: 2 }}>👤</div>
                  <div>Photograph</div>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                const url = prompt('Enter Image URL for Staff Photo:', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150');
                if (url) setPhotoUrl(url);
              }}
              style={{
                padding: '3px 8px',
                background: '#ffffff',
                border: '1px solid #94a3b8',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 800,
                color: '#0f3a4b',
                cursor: 'pointer'
              }}
            >
              Load photo
            </button>
            <span style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>Label24</span>
          </div>

          {/* STAFF NAME, ID & REMARKS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#0f3a4b', marginBottom: 3 }}>Staff Name:</label>
              <input
                type="text"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="Enter Staff Name..."
                style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 800, background: '#fff' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#0f3a4b', marginBottom: 3 }}>Staff ID:</label>
                <input
                  type="text"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="Staff ID..."
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 900, color: '#0369a1', background: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 900, color: '#0f3a4b', marginBottom: 3 }}>Remarks:</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Remarks or staff notes..."
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── TAB NAVIGATION ROW ── */}
        <div style={{ display: 'flex', borderBottom: '2px solid #0f3a4b', marginBottom: 14, gap: 2 }}>
          {['Personal Information', "Spouse's information", 'Bank Information', 'Other Related Data', "Employee's folder"].map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 14px',
                border: '1px solid #cbd5e1',
                borderBottom: 'none',
                borderRadius: '4px 4px 0 0',
                background: activeTab === tab ? '#0f3a4b' : '#f1f5f9',
                color: activeTab === tab ? '#ffffff' : '#475569',
                fontSize: 12,
                fontWeight: 900,
                cursor: 'pointer'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── TAB CONTENT PANELS ── */}
        {activeTab === 'Personal Information' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 16 }}>
            {/* LEFT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#0f3a4b' }}>Sex:</label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  style={{ padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#0f3a4b' }}>DOB:</label>
                <div>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                  />
                  <div style={{ fontSize: 10.5, color: '#0284c7', fontWeight: 700, marginTop: 2 }}>
                    {formatDatePreview(dob)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#0f3a4b' }}>Religion:</label>
                <input
                  type="text"
                  value={religion}
                  onChange={(e) => setReligion(e.target.value)}
                  placeholder="Religion..."
                  style={{ padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#0f3a4b' }}>Marital Status:</label>
                <select
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                  style={{ padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                >
                  <option value="Married">Married</option>
                  <option value="Single">Single</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#0f3a4b' }}>Qualification:</label>
                <input
                  type="text"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="Qualification..."
                  style={{ padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#0f3a4b' }}>Nationality:</label>
                <select
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  style={{ padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                >
                  <option value="Ghanaian">Ghanaian</option>
                  <option value="Nigerian">Nigerian</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#0f3a4b' }}>Home Town:</label>
                <input
                  type="text"
                  value={homeTown}
                  onChange={(e) => setHomeTown(e.target.value)}
                  placeholder="Home Town..."
                  style={{ padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#0f3a4b' }}>Language Spoken:</label>
                <input
                  type="text"
                  value={languageSpoken}
                  onChange={(e) => setLanguageSpoken(e.target.value)}
                  placeholder="Languages..."
                  style={{ padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                />
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#0f3a4b' }}>Postal Address:</label>
                <input
                  type="text"
                  value={postalAddress}
                  onChange={(e) => setPostalAddress(e.target.value)}
                  placeholder="Postal Address..."
                  style={{ padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#0f3a4b' }}>Residence Address:</label>
                <input
                  type="text"
                  value={residenceAddress}
                  onChange={(e) => setResidenceAddress(e.target.value)}
                  placeholder="Residence Address..."
                  style={{ padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#0f3a4b' }}>Home Phone:</label>
                <input
                  type="text"
                  value={homePhone}
                  onChange={(e) => setHomePhone(e.target.value)}
                  placeholder="Home Phone..."
                  style={{ padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#0f3a4b' }}>Cell Phone:</label>
                <input
                  type="text"
                  value={cellPhone}
                  onChange={(e) => setCellPhone(e.target.value)}
                  placeholder="Cell Phone..."
                  style={{ padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#0f3a4b' }}>E Mail Address:</label>
                <input
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="E Mail Address..."
                  style={{ padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "Spouse's information" && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Spouse's Name</label>
              <input
                type="text"
                value={spouseName}
                onChange={(e) => setSpouseName(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Spouse's Occupation</label>
              <input
                type="text"
                value={spouseOccupation}
                onChange={(e) => setSpouseOccupation(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Spouse's Employer</label>
              <input
                type="text"
                value={spouseEmployer}
                onChange={(e) => setSpouseEmployer(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Spouse's Phone</label>
              <input
                type="text"
                value={spousePhone}
                onChange={(e) => setSpousePhone(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Emergency Contact Name</label>
              <input
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Emergency Phone</label>
              <input
                type="text"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
              />
            </div>
          </div>
        )}

        {activeTab === 'Bank Information' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Bank Name</label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
              >
                <option value="Barclays Bank Ghana (Absa)">Barclays Bank Ghana (Absa)</option>
                <option value="GCB Bank">GCB Bank</option>
                <option value="Ecobank Ghana">Ecobank Ghana</option>
                <option value="Fidelity Bank">Fidelity Bank</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Bank Branch</label>
              <input
                type="text"
                value={bankBranch}
                onChange={(e) => setBankBranch(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Account Name</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Account Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>SSNIT Number</label>
              <input
                type="text"
                value={ssnitNumber}
                onChange={(e) => setSsnitNumber(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>TIN Number</label>
              <input
                type="text"
                value={tinNumber}
                onChange={(e) => setTinNumber(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
              />
            </div>
          </div>
        )}

        {activeTab === 'Other Related Data' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Department / Unit</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
              >
                <option value="Accounts & Finance">Accounts & Finance</option>
                <option value="Teaching Staff">Teaching Staff</option>
                <option value="Administration">Administration</option>
                <option value="Security & Facilities">Security & Facilities</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Job Title / Position</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Date Employed</label>
              <input
                type="date"
                value={dateEmployed}
                onChange={(e) => setDateEmployed(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Employment Status</label>
              <select
                value={employmentStatus}
                onChange={(e) => setEmploymentStatus(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12 }}
              >
                <option value="Permanent Staff">Permanent Staff</option>
                <option value="Contract Staff">Contract Staff</option>
                <option value="Probationary">Probationary</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === "Employee's folder" && (
          <div style={{ background: '#f8fafc', padding: 14, borderRadius: 6, border: '1px solid #cbd5e1', marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#0f3a4b', marginBottom: 10 }}>Attached Employee Documents Folder</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, color: '#334155', lineHeight: 1.8 }}>
              <li>📄 Appointment_Letter_2018.pdf (1.2 MB)</li>
              <li>📄 Ghana_Card_Copy.pdf (450 KB)</li>
              <li>📄 BSc_Degree_Certificate.pdf (2.1 MB)</li>
              <li>📄 SSNIT_Biometric_Card.pdf (620 KB)</li>
            </ul>
          </div>
        )}

        {/* ── ACTION BUTTONS ── */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <button
            type="button"
            onClick={handleSaveProfile}
            style={{ padding: '8px 20px', background: '#0f3a4b', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 900, cursor: 'pointer' }}
          >
            Save Employee Profile
          </button>
          <button
            type="button"
            onClick={handleNewRecord}
            style={{ padding: '8px 18px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
          >
            New Record
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            style={{ padding: '8px 18px', background: '#475569', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
          >
            Print Profile
          </button>
        </div>

        {/* ── STAFF DIRECTORY TABLE ── */}
        <div style={{ background: '#ffffff', borderRadius: 6, border: '1px solid #cbd5e1', overflow: 'hidden' }}>
          <div style={{ background: '#f1f5f9', padding: '8px 12px', fontSize: 12, fontWeight: 900, color: '#0f3a4b', borderBottom: '1px solid #cbd5e1' }}>
            Registered Staff Directory ({employeeDirectory.length} records)
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '8px 10px' }}>Staff ID</th>
                <th style={{ padding: '8px 10px' }}>Staff Name</th>
                <th style={{ padding: '8px 10px' }}>Department</th>
                <th style={{ padding: '8px 10px' }}>Job Title</th>
                <th style={{ padding: '8px 10px' }}>Cell Phone</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {employeeDirectory.map((emp, idx) => (
                <tr key={emp.staffId} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 900, color: '#0369a1' }}>#{emp.staffId}</td>
                  <td style={{ padding: '8px 10px', fontWeight: 800, color: '#0f3a4b' }}>{emp.staffName}</td>
                  <td style={{ padding: '8px 10px', color: '#475569' }}>{emp.department}</td>
                  <td style={{ padding: '8px 10px', color: '#475569' }}>{emp.jobTitle}</td>
                  <td style={{ padding: '8px 10px', color: '#475569' }}>{emp.cellPhone}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 10, background: '#dcfce7', color: '#15803d' }}>
                      {emp.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => selectEmployee(emp)}
                      style={{ padding: '3px 8px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 4, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

function MonthlyPayrollServiceForm({ setM }) {
  const [activeSubMode, setActiveSubMode] = useState('menu'); // 'menu' | 'prepare' | 'delete'
  const [payrollYear, setPayrollYear] = useState('2026/2027');
  const [payrollMonth, setPayrollMonth] = useState('September 2026');
  const [department, setDepartment] = useState('All Departments');
  const [valueDate, setValueDate] = useState('2026-09-28');
  const [bannerNotice, setBannerNotice] = useState('');

  const [deleteBatchNo, setDeleteBatchNo] = useState('PAY-BATCH-2026-08');
  const [deleteReason, setDeleteReason] = useState('Re-auditing salary adjustments & allowances');

  const [staffPayrollList, setStaffPayrollList] = useState([
    {
      staffId: 'STF-2026-012',
      staffName: 'MRS. GRACE ANIM-ANSAH',
      department: 'Accounts & Finance',
      basicSalary: 4500.00,
      allowances: 800.00,
      ssnit5: 247.50,
      payeTax: 480.00,
      netPay: 4572.50,
      status: 'Ready for Processing'
    },
    {
      staffId: 'STF-2026-015',
      staffName: 'MR. JOHN MENSAH',
      department: 'Teaching Staff',
      basicSalary: 3800.00,
      allowances: 500.00,
      ssnit5: 209.00,
      payeTax: 390.00,
      netPay: 3701.00,
      status: 'Ready for Processing'
    },
    {
      staffId: 'STF-2026-020',
      staffName: 'KWAME ADDO',
      department: 'Administration',
      basicSalary: 3000.00,
      allowances: 400.00,
      ssnit5: 165.00,
      payeTax: 280.00,
      netPay: 2955.00,
      status: 'Ready for Processing'
    }
  ]);

  const totalGross = staffPayrollList.reduce((acc, s) => acc + s.basicSalary + s.allowances, 0);
  const totalSsnit5 = staffPayrollList.reduce((acc, s) => acc + s.ssnit5, 0);
  const totalSsnit13 = totalGross * 0.13;
  const totalPaye = staffPayrollList.reduce((acc, s) => acc + s.payeTax, 0);
  const totalNet = staffPayrollList.reduce((acc, s) => acc + s.netPay, 0);

  const handleProcessPayroll = () => {
    setBannerNotice(`✅ Monthly Payroll for ${payrollMonth} (${payrollYear}) processed & posted successfully! Total Disbursed: GHS ${totalNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}.`);
    setTimeout(() => setBannerNotice(''), 4500);
  };

  const handleDeleteBatch = () => {
    setBannerNotice(`⚠️ Payroll Batch #${deleteBatchNo} (${deleteReason}) has been deleted from active registers.`);
    setTimeout(() => setBannerNotice(''), 4000);
  };

  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)', color: '#0f172a' }}>
      {/* ── TOP BLUE TITLE BAR ── */}
      <div style={{
        background: '#0f3a4b',
        color: '#ffffff',
        padding: '10px 16px',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: '#0284c7', width: 6, height: 22, borderRadius: 3 }} />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#ffffff', letterSpacing: '0.02em' }}>
            Monthly Payroll Service
          </h3>
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#e0f2fe' }}>
          REMALJ Carewell Accounts Office · HR & Payroll Administration
        </div>
      </div>

      {/* ── MAIN CONTAINER ── */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: 16
      }}>

        {bannerNotice && (
          <div style={{
            background: '#f0fdf4',
            color: '#166534',
            border: '1px solid #bbf7d0',
            padding: '8px 12px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 800,
            marginBottom: 14
          }}>
            {bannerNotice}
          </div>
        )}

        {/* ── CLASSIC POPUP DIALOG BOX FROM PHOTO ── */}
        <div style={{
          maxWidth: 440,
          margin: '0 auto 20px auto',
          background: '#d9e2ec',
          border: '2px solid #0284c7',
          borderRadius: 6,
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
          overflow: 'hidden'
        }}>
          {/* DIALOG HEADER */}
          <div style={{
            background: '#0284c7',
            color: '#ffffff',
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 900,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>Monthly Payroll Service</span>
            <button
              type="button"
              onClick={() => {
                if (setM) setM(null);
                setActiveSubMode('menu');
              }}
              style={{
                background: '#be123c',
                color: '#fff',
                border: 'none',
                width: 18,
                height: 18,
                borderRadius: 3,
                fontSize: 11,
                fontWeight: 900,
                cursor: 'pointer',
                lineHeight: '18px',
                textAlign: 'center'
              }}
            >
              x
            </button>
          </div>

          {/* DIALOG BODY */}
          <div style={{ padding: 16, textAlign: 'center' }}>
            <div style={{
              display: 'inline-block',
              border: '1px dashed #64748b',
              padding: '2px 8px',
              fontSize: 11,
              fontWeight: 800,
              color: '#0f3a4b',
              marginBottom: 10,
              background: '#f1f5f9'
            }}>
              Monthly Payroll Service
            </div>

            <div style={{ fontSize: 13, fontWeight: 900, color: '#0f3a4b', marginBottom: 8 }}>
              Monthly Payroll Service
            </div>

            <div style={{ background: '#94a3b8', height: 18, borderRadius: 2, marginBottom: 14 }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <button
                type="button"
                onClick={() => setActiveSubMode('prepare')}
                style={{
                  padding: '8px 12px',
                  background: activeSubMode === 'prepare' ? '#0f3a4b' : '#ffffff',
                  color: activeSubMode === 'prepare' ? '#ffffff' : '#0f3a4b',
                  border: '1px solid #64748b',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                Prepare Payroll
              </button>

              <button
                type="button"
                onClick={() => {
                  if (setM) setM(null);
                  setActiveSubMode('menu');
                }}
                style={{
                  padding: '8px 12px',
                  background: '#ffffff',
                  color: '#0f3a4b',
                  border: '1px solid #64748b',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
              >
                Close
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveSubMode('delete')}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: activeSubMode === 'delete' ? '#be123c' : '#ffffff',
                color: activeSubMode === 'delete' ? '#ffffff' : '#0f3a4b',
                border: '1px solid #64748b',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              Delete Payroll Records
            </button>
          </div>
        </div>

        {/* ── PREPARE PAYROLL WORKSTATION ── */}
        {(activeSubMode === 'prepare' || activeSubMode === 'menu') && (
          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#0f3a4b', borderBottom: '2px solid #0f3a4b', paddingBottom: 4, marginBottom: 14 }}>
              Prepare Monthly Payroll Workstation
            </div>

            {/* SELECTION PARAMETERS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Payroll Year</label>
                <select
                  value={payrollYear}
                  onChange={(e) => setPayrollYear(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                >
                  <option value="2026/2027">2026/2027</option>
                  <option value="2025/2026">2025/2026</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Payroll Month</label>
                <select
                  value={payrollMonth}
                  onChange={(e) => setPayrollMonth(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                >
                  <option value="September 2026">September 2026</option>
                  <option value="August 2026">August 2026</option>
                  <option value="July 2026">July 2026</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Department / Unit</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                >
                  <option value="All Departments">All Departments</option>
                  <option value="Accounts & Finance">Accounts & Finance</option>
                  <option value="Teaching Staff">Teaching Staff</option>
                  <option value="Administration">Administration</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Value Date</label>
                <input
                  type="date"
                  value={valueDate}
                  onChange={(e) => setValueDate(e.target.value)}
                  style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                />
              </div>
            </div>

            {/* PAYROLL SUMMARY CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 16 }}>
              <div style={{ background: '#ffffff', padding: 10, borderRadius: 6, border: '1px solid #cbd5e1', textAlign: 'center' }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: '#64748b' }}>TOTAL GROSS</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#0f3a4b', marginTop: 2 }}>GHS {totalGross.toFixed(2)}</div>
              </div>

              <div style={{ background: '#ffffff', padding: 10, borderRadius: 6, border: '1px solid #cbd5e1', textAlign: 'center' }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: '#64748b' }}>SSNIT 5.5% (STAFF)</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#d97706', marginTop: 2 }}>GHS {totalSsnit5.toFixed(2)}</div>
              </div>

              <div style={{ background: '#ffffff', padding: 10, borderRadius: 6, border: '1px solid #cbd5e1', textAlign: 'center' }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: '#64748b' }}>SSNIT 13% (EMPLOYER)</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#0284c7', marginTop: 2 }}>GHS {totalSsnit13.toFixed(2)}</div>
              </div>

              <div style={{ background: '#ffffff', padding: 10, borderRadius: 6, border: '1px solid #cbd5e1', textAlign: 'center' }}>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: '#64748b' }}>PAYE TAX</div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#be123c', marginTop: 2 }}>GHS {totalPaye.toFixed(2)}</div>
              </div>

              <div style={{ background: '#e0f2fe', padding: 10, borderRadius: 6, border: '1px solid #bae6fd', textAlign: 'center' }}>
                <div style={{ fontSize: 10.5, fontWeight: 900, color: '#0369a1' }}>NET PAYABLE</div>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#0369a1', marginTop: 2 }}>GHS {totalNet.toFixed(2)}</div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <button
                type="button"
                onClick={handleProcessPayroll}
                style={{ padding: '8px 20px', background: '#0f3a4b', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 900, cursor: 'pointer' }}
              >
                Process & Post Monthly Payroll
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                style={{ padding: '8px 18px', background: '#475569', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
              >
                Print Payroll Register
              </button>
            </div>

            {/* PAYROLL REGISTER TABLE */}
            <div style={{ background: '#ffffff', borderRadius: 6, border: '1px solid #cbd5e1', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                    <th style={{ padding: '8px 10px' }}>Staff ID</th>
                    <th style={{ padding: '8px 10px' }}>Staff Name</th>
                    <th style={{ padding: '8px 10px' }}>Department</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Basic (GHS)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Allowances</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>SSNIT 5.5%</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>PAYE Tax</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Net Pay (GHS)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {staffPayrollList.map((item, idx) => (
                    <tr key={item.staffId} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 900, color: '#0369a1' }}>#{item.staffId}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 800, color: '#0f3a4b' }}>{item.staffName}</td>
                      <td style={{ padding: '8px 10px', color: '#475569' }}>{item.department}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>{item.basicSalary.toFixed(2)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right' }}>{item.allowances.toFixed(2)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#d97706' }}>{item.ssnit5.toFixed(2)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', color: '#be123c' }}>{item.payeTax.toFixed(2)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>{item.netPay.toFixed(2)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <span style={{ fontSize: 10.5, fontWeight: 800, padding: '2px 8px', borderRadius: 10, background: '#dcfce7', color: '#15803d' }}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DELETE PAYROLL RECORDS WORKSTATION ── */}
        {activeSubMode === 'delete' && (
          <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 6, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#9f1239', borderBottom: '2px solid #be123c', paddingBottom: 4, marginBottom: 14 }}>
              Delete Payroll Records Workstation
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#9f1239', marginBottom: 3 }}>
                  Select Payroll Batch to Delete
                </label>
                <select
                  value={deleteBatchNo}
                  onChange={(e) => setDeleteBatchNo(e.target.value)}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #fda4af', fontSize: 12, background: '#fff' }}
                >
                  <option value="PAY-BATCH-2026-08">PAY-BATCH-2026-08 (August 2026 Payroll - GHS 46,200.00)</option>
                  <option value="PAY-BATCH-2026-07">PAY-BATCH-2026-07 (July 2026 Payroll - GHS 45,800.00)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#9f1239', marginBottom: 3 }}>
                  Reason for Deletion
                </label>
                <input
                  type="text"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Enter deletion reason..."
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #fda4af', fontSize: 12, background: '#fff' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={handleDeleteBatch}
                style={{ padding: '8px 20px', background: '#be123c', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 900, cursor: 'pointer' }}
              >
                ⚠️ Confirm Delete Payroll Batch
              </button>

              <button
                type="button"
                onClick={() => setActiveSubMode('prepare')}
                style={{ padding: '8px 18px', background: '#64748b', color: '#fff', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
              >
                Cancel / Return to Prepare
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function TrialBalanceAccountsForm({ setM, initialMode = 'accounts' }) {
  const [reportMode, setReportMode] = useState(initialMode); // 'accounts' or 'customers'
  const [reportingMonth, setReportingMonth] = useState('September');
  const [reportingYearMonth, setReportingYearMonth] = useState('2026');
  const [reportingYearOnly, setReportingYearOnly] = useState('2026');
  const [dateFrom, setDateFrom] = useState('Saturday , September 5, 2026');
  const [dateTo, setDateTo] = useState('Saturday , September 5, 2026');
  const [reportTitleSub, setReportTitleSub] = useState('Reporting Period: As at September 2026');
  const [zoomLevel, setZoomLevel] = useState('100%');
  const [searchText, setSearchText] = useState('');

  const trialBalanceRows = [
    { code: '1010', name: 'Cash on Hand - Main Office Cashier', cat: 'Asset', debit: 12500, credit: 0 },
    { code: '1020', name: 'GCB Bank - Operating Account', cat: 'Asset', debit: 145800, credit: 0 },
    { code: '1030', name: 'EcoBank Ghana - Tuition Fee Collection', cat: 'Asset', debit: 88400, credit: 0 },
    { code: '1040', name: 'MTN Mobile Money Merchant Wallet', cat: 'Asset', debit: 36200, credit: 0 },
    { code: '1100', name: 'Accounts Receivable - Student Academic Fees', cat: 'Asset', debit: 62400, credit: 0 },
    { code: '1150', name: 'Other Accounts Receivables & Staff Advances', cat: 'Asset', debit: 5800, credit: 0 },
    { code: '1200', name: 'Inventory - Textbooks & Stationery Depot', cat: 'Asset', debit: 18400, credit: 0 },
    { code: '2010', name: 'Accounts Payable - Vendors & Suppliers', cat: 'Liability', debit: 0, credit: 28600 },
    { code: '2020', name: 'Accrued Statutory PayE & SSNIT Liabilities', cat: 'Liability', debit: 0, credit: 19400 },
    { code: '2030', name: 'Unearned Advance Tuition Deposits', cat: 'Liability', debit: 0, credit: 12500 },
    { code: '3010', name: 'School Founding Capital & Equity Reserve', cat: 'Equity', debit: 0, credit: 250000 },
    { code: '3020', name: 'Retained Surplus Brought Forward', cat: 'Equity', debit: 0, credit: 41000 },
    { code: '4010', name: 'Tuition & Academic Fees Income', cat: 'Revenue', debit: 0, credit: 185000 },
    { code: '4020', name: 'Bus Transport & Boarding Service Income', cat: 'Revenue', debit: 0, credit: 22800 },
    { code: '4030', name: 'Other Income (Form Sales, Badges, Uniforms)', cat: 'Revenue', debit: 0, credit: 10200 },
    { code: '5010', name: 'Teaching & Administrative Salaries Expense', cat: 'Expense', debit: 132000, credit: 0 },
    { code: '5020', name: 'Utilities, Water, Fuel & Generator Running', cat: 'Expense', debit: 18500, credit: 0 },
    { code: '5030', name: 'Classroom & Examination Printing Expense', cat: 'Expense', debit: 8200, credit: 0 },
    { code: '5040', name: 'School Premises Maintenance & Repairs', cat: 'Expense', debit: 6400, credit: 0 },
    { code: '5050', name: 'Audit, Legal & Regulatory Compliance Fees', cat: 'Expense', debit: 4500, credit: 0 },
  ];

  const studentTrialBalanceRows = [
    { id: '420858', name: 'AARON SENA KUSALGO', balance: '0.00' },
    { id: '420859', name: 'ANDREWS KOJO ANTWI', balance: '1,020.00' },
    { id: '420860', name: 'ADDAI GERALD', balance: '0.00' },
    { id: '420862', name: 'AMOAH SOMPA AARON', balance: '0.00' },
    { id: '420863', name: 'OTOO PRINCE', balance: '25.00' },
    { id: '420864', name: 'AKOSUA ENYIMNYAM ABAKAH', balance: '0.00' },
    { id: '420865', name: 'ETHAN MYRON BOATENG', balance: '0.00' },
    { id: '420866', name: 'ANTWI LUCIO', balance: '0.00' },
    { id: '420867', name: 'BENJAMIN OTHNIEL ENO ABAKAH', balance: '0.00' },
    { id: '420868', name: 'AMPONSAH NANA YAW', balance: '0.00' },
    { id: '420869', name: 'ELLIOT NANA APPIAH', balance: '0.00' },
    { id: '420870', name: 'LEONARD OTENG AMISSAH', balance: '0.00' },
    { id: '420872', name: 'ASARE OPOKU SAMUEL BORNGREAT', balance: '0.00' },
    { id: '420873', name: 'DESMOND BABAALA', balance: '0.00' },
    { id: '420874', name: 'CEDRICK NANA AWORTWE', balance: '480.00' },
    { id: '420875', name: 'BARNABAS ESSIFUL KWAKU', balance: '0.00' },
    { id: '420876', name: 'ADU BISMARK', balance: '0.00' },
    { id: '420877', name: 'NANA KWAME AMOAFUL AFFUM', balance: '0.00' },
    { id: '420878', name: 'ELIZABETH FREMA MANU', balance: '1,500.00' },
    { id: '420879', name: 'KOFI OWUSU ADDO', balance: '0.00' },
  ];

  const totalDebits = trialBalanceRows.reduce((sum, r) => sum + r.debit, 0);
  const totalCredits = trialBalanceRows.reduce((sum, r) => sum + r.credit, 0);

  const filteredRows = trialBalanceRows.filter(
    (r) =>
      r.code.toLowerCase().includes(searchText.toLowerCase()) ||
      r.name.toLowerCase().includes(searchText.toLowerCase()) ||
      r.cat.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredStudentRows = studentTrialBalanceRows.filter(
    (s) =>
      s.id.toLowerCase().includes(searchText.toLowerCase()) ||
      s.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handlePreviewMonth = () => {
    setReportTitleSub(`Reporting Period: Month of ${reportingMonth || 'Current'} ${reportingYearMonth}`);
  };

  const handlePreviewYear = () => {
    setReportTitleSub(`Reporting Period: Full Academic / Financial Year ${reportingYearOnly}`);
  };

  const handlePreviewDate = () => {
    setReportTitleSub(`Reporting Period: From ${dateFrom} To ${dateTo}`);
  };

  const handlePreviewNow = () => {
    setReportTitleSub(`Reporting period As at now`);
  };

  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)', background: '#cbd5e1', borderRadius: 8, overflow: 'hidden', border: '1px solid #94a3b8' }}>
      {/* ── HEADER BANNER ── */}
      <div className="no-print" style={{
        background: 'linear-gradient(90deg, #93c5fd 0%, #3b82f6 100%)',
        color: '#0f172a',
        padding: '6px 14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #60a5fa'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>
            {reportMode === 'customers' ? 'Print Trial Balances - Customers' : 'Trial Balance - Accounts'}
          </span>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.4)', borderRadius: 4, padding: 2 }}>
            <button
              type="button"
              onClick={() => setReportMode('accounts')}
              style={{
                padding: '2px 8px',
                fontSize: 10.5,
                fontWeight: 800,
                border: 'none',
                borderRadius: 3,
                background: reportMode === 'accounts' ? '#0f3a4b' : 'transparent',
                color: reportMode === 'accounts' ? '#fff' : '#0f172a',
                cursor: 'pointer'
              }}
            >
              Accounts Ledger
            </button>
            <button
              type="button"
              onClick={() => setReportMode('customers')}
              style={{
                padding: '2px 8px',
                fontSize: 10.5,
                fontWeight: 800,
                border: 'none',
                borderRadius: 3,
                background: reportMode === 'customers' ? '#0f3a4b' : 'transparent',
                color: reportMode === 'customers' ? '#fff' : '#0f172a',
                cursor: 'pointer'
              }}
            >
              Print Trial Balances - Customers
            </button>
          </div>
        </div>
        {setM && (
          <button
            type="button"
            onClick={() => setM(null)}
            style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 10px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
          >
            ✕ Close
          </button>
        )}
      </div>

      {/* ── MAIN WORKSPACE split left controls / right report document ── */}
      <div style={{ display: 'flex', minHeight: 580 }}>
        {/* LEFT CONTROL PANEL (Parameter Boxes) */}
        <div className="no-print" style={{ width: 310, background: '#d9e2ec', borderRight: '1px solid #94a3b8', padding: 10, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11 }}>
          
          {reportMode === 'accounts' && (
            <>
              {/* Box 1: Preview per month */}
              <fieldset style={{ border: '1px solid #94a3b8', borderRadius: 4, padding: 8, background: '#e2e8f0', margin: 0 }}>
                <legend style={{ fontSize: 10.5, fontWeight: 800, color: '#1e293b', padding: '0 4px' }}>Preview per month</legend>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontWeight: 600 }}>Reporting Month</label>
                    <select
                      value={reportingMonth}
                      onChange={(e) => setReportingMonth(e.target.value)}
                      style={{ width: 140, padding: '2px 4px', fontSize: 11, border: '1px solid #94a3b8', borderRadius: 3, background: '#fff' }}
                    >
                      <option value="">-- Select --</option>
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontWeight: 600 }}>Reporting Year</label>
                    <select
                      value={reportingYearMonth}
                      onChange={(e) => setReportingYearMonth(e.target.value)}
                      style={{ width: 140, padding: '2px 4px', fontSize: 11, border: '1px solid #94a3b8', borderRadius: 3, background: '#fff' }}
                    >
                      {['2026', '2025', '2024', '2023'].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handlePreviewMonth}
                    style={{ marginTop: 4, width: '100%', padding: '4px 8px', background: '#cbd5e1', color: '#0f172a', border: '1px solid #64748b', borderRadius: 3, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
                  >
                    Preview Monthly Trial Balance
                  </button>
                </div>
              </fieldset>

              {/* Box 2: Preview per year */}
              <fieldset style={{ border: '1px solid #94a3b8', borderRadius: 4, padding: 8, background: '#e2e8f0', margin: 0 }}>
                <legend style={{ fontSize: 10.5, fontWeight: 800, color: '#1e293b', padding: '0 4px' }}>Preview per year</legend>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontWeight: 600 }}>Reporting Year</label>
                    <select
                      value={reportingYearOnly}
                      onChange={(e) => setReportingYearOnly(e.target.value)}
                      style={{ width: 140, padding: '2px 4px', fontSize: 11, border: '1px solid #94a3b8', borderRadius: 3, background: '#fff' }}
                    >
                      {['2026', '2025', '2024', '2023'].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handlePreviewYear}
                    style={{ marginTop: 4, width: '100%', padding: '4px 8px', background: '#cbd5e1', color: '#0f172a', border: '1px solid #64748b', borderRadius: 3, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
                  >
                    Preview Yearly Trial Balance
                  </button>
                </div>
              </fieldset>

              {/* Box 3: Preview per Date */}
              <fieldset style={{ border: '1px solid #94a3b8', borderRadius: 4, padding: 8, background: '#e2e8f0', margin: 0 }}>
                <legend style={{ fontSize: 10.5, fontWeight: 800, color: '#1e293b', padding: '0 4px' }}>Preview per Date</legend>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontWeight: 600, width: 45 }}>From</label>
                    <input
                      type="text"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      style={{ width: 180, padding: '2px 4px', fontSize: 10.5, border: '1px solid #94a3b8', borderRadius: 3, background: '#fff' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontWeight: 600, width: 45 }}>To</label>
                    <input
                      type="text"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      style={{ width: 180, padding: '2px 4px', fontSize: 10.5, border: '1px solid #94a3b8', borderRadius: 3, background: '#fff' }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handlePreviewDate}
                    style={{ marginTop: 4, width: '100%', padding: '4px 8px', background: '#cbd5e1', color: '#0f172a', border: '1px solid #64748b', borderRadius: 3, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}
                  >
                    Preview Trial Balance
                  </button>
                </div>
              </fieldset>

              <div style={{ textAlign: 'center', fontWeight: 700, color: '#475569', margin: '2px 0' }}>Or</div>
            </>
          )}

          {/* Standalone Button */}
          <button
            type="button"
            onClick={handlePreviewNow}
            style={{ width: '100%', padding: '8px 8px', background: '#cbd5e1', color: '#0f172a', border: '1px solid #64748b', borderRadius: 3, fontWeight: 800, fontSize: 11, cursor: 'pointer', marginTop: reportMode === 'customers' ? 60 : 0 }}
          >
            Preview Trial Balance as at Now
          </button>
        </div>

        {/* RIGHT REPORT CANVAS & TOOLBAR */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#cbd5e1' }}>
          {/* REPORT VIEWER TOOLBAR */}
          <div className="no-print" style={{
            background: '#e2e8f0',
            borderBottom: '1px solid #94a3b8',
            padding: '4px 10px',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            fontSize: 11,
            gap: 8
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button type="button" onClick={() => window.print()} title="Print" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3, cursor: 'pointer' }}>🖨️</button>
              <button type="button" onClick={() => alert('Exporting PDF...')} title="Save PDF" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3, cursor: 'pointer' }}>💾</button>
              <button type="button" onClick={() => alert('Refreshed Data')} title="Refresh" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3, cursor: 'pointer' }}>🔄</button>
              <span style={{ color: '#94a3b8' }}>|</span>
              <button type="button" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3 }}>|&lt;</button>
              <button type="button" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3 }}>&lt;</button>
              <span style={{ fontWeight: 600 }}>Page 1 of 1</span>
              <button type="button" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3 }}>&gt;</button>
              <button type="button" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3 }}>&gt;|</button>
              <span style={{ color: '#94a3b8' }}>|</span>
              <button type="button" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3 }}>-</button>
              <select value={zoomLevel} onChange={(e) => setZoomLevel(e.target.value)} style={{ padding: '2px 4px', fontSize: 10.5, border: '1px solid #94a3b8', borderRadius: 3 }}>
                <option value="100%">100%</option>
                <option value="125%">125%</option>
                <option value="75%">75%</option>
              </select>
              <button type="button" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3 }}>+</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontWeight: 600 }}>Find Text:</span>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search..."
                style={{ width: 90, padding: '2px 4px', fontSize: 10.5, border: '1px solid #94a3b8', borderRadius: 3 }}
              />
            </div>
          </div>

          {/* MAIN REPORT TAB BAR (exact crystal report layout) */}
          <div className="no-print" style={{ background: '#cbd5e1', borderBottom: '1px solid #94a3b8', padding: '2px 10px 0 10px', display: 'flex', gap: 4 }}>
            <div style={{ background: '#ffffff', border: '1px solid #94a3b8', borderBottom: 'none', padding: '3px 12px', fontSize: 10.5, fontWeight: 700, borderRadius: '3px 3px 0 0', color: '#0f172a' }}>
              Main Report
            </div>
          </div>

          {/* REPORT DOCUMENT SHEET */}
          <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
            <div className="printable-area accountant-printable" style={{
              background: '#ffffff',
              width: 740,
              minHeight: 560,
              padding: 24,
              borderRadius: 4,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              border: '1px solid #cbd5e1',
              color: '#0f172a'
            }}>
              {reportMode === 'customers' ? (
                /* ── PRINT TRIAL BALANCES - CUSTOMERS / STUDENTS CANVAS ── */
                <div>
                  <div style={{ position: 'relative', textAlign: 'center', marginBottom: 14, minHeight: 70 }}>
                    {/* LOGO ON LEFT */}
                    <div style={{ position: 'absolute', left: 0, top: 0, display: 'flex', alignItems: 'center' }}>
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        border: '2px solid #0f3a4b',
                        background: '#e0f2fe',
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'center',
                        fontSize: 20
                      }}>
                        🏫
                      </div>
                    </div>

                    {/* PRINT DATE ON RIGHT */}
                    <div style={{ position: 'absolute', right: 0, top: 0, fontSize: 10.5, color: '#0f172a' }}>
                      Print date &nbsp;&nbsp;&nbsp; 9/5/2026
                    </div>

                    {/* CENTERED HEADER TEXT */}
                    <img src="/remalj-carewell-logo.jpg" alt="REMALJ Carewell Logo" style={{ height: 45, width: 'auto', borderRadius: 4, marginBottom: 4 }} />
                    <h2 style={{ fontSize: 14, color: '#0f172a', fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                      REMALJ CAREWELL INSPIRATIONAL SCHOOL
                    </h2>
                    <p style={{ fontSize: 11, color: '#0f172a', margin: '2px 0 8px 0', fontWeight: 700 }}>
                      Loc: Ntriakwakrom , Bogoso, Ghana, WP-0023-6662
                    </p>

                    <h1 style={{ fontSize: 24, color: '#0f172a', fontWeight: 900, margin: '8px 0 4px 0', letterSpacing: '0.02em' }}>
                      Trial Balance
                    </h1>
                    <p style={{ fontSize: 11, color: '#0f172a', margin: 0, fontWeight: 500 }}>
                      Reporting period As at now
                    </p>
                  </div>

                  {/* CUSTOMER/STUDENT TRIAL BALANCE TABLE */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5, border: '1px solid #000' }}>
                    <thead>
                      <tr style={{ background: '#ffffff', borderBottom: '1px solid #000' }}>
                        <th style={{ padding: '6px 8px', borderRight: '1px solid #000', textAlign: 'left', fontWeight: 800, width: 110 }}>STUDENT ID</th>
                        <th style={{ padding: '6px 8px', borderRight: '1px solid #000', textAlign: 'left', fontWeight: 800 }}>STUDENT NAME</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800, width: 120 }}>BALANCE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudentRows.map((s) => (
                        <tr key={s.id} style={{ borderBottom: '1px solid #d1d5db' }}>
                          <td style={{ padding: '4px 8px', borderRight: '1px solid #d1d5db', fontFamily: 'monospace', fontWeight: 600 }}>{s.id}</td>
                          <td style={{ padding: '4px 8px', borderRight: '1px solid #d1d5db', textTransform: 'uppercase', fontWeight: 600 }}>{s.name}</td>
                          <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 600 }}>{s.balance}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* ── GENERAL LEDGER ACCOUNTS TRIAL BALANCE CANVAS ── */
                <div>
                  <div style={{ textAlign: 'center', borderBottom: '2px solid #0f3a4b', paddingBottom: 10, marginBottom: 14 }}>
                    <img src="/remalj-carewell-logo.jpg" alt="REMALJ Carewell Logo" style={{ height: 45, width: 'auto', borderRadius: 4, marginBottom: 4 }} />
                    <h2 style={{ fontSize: 18, color: '#0f3a4b', fontWeight: 900, margin: 0, letterSpacing: '0.03em' }}>REMALJ CAREWELL INSPIRATIONAL SCHOOL</h2>
                    <p style={{ fontSize: 11, color: '#0284c7', margin: '2px 0 6px 0', fontWeight: 700 }}>Finance & Accounts Department · Bogoso, Ghana</p>
                    <h3 style={{ fontSize: 14, color: '#b91c1c', fontWeight: 900, margin: '6px 0 2px 0', textTransform: 'uppercase' }}>General Ledger Trial Balance (Accounts)</h3>
                    <p style={{ fontSize: 11, color: '#475569', margin: 0, fontStyle: 'italic' }}>{reportTitleSub}</p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: '#475569', borderBottom: '1px solid #e2e8f0', paddingBottom: 6, marginBottom: 12 }}>
                    <div><strong>Currency:</strong> Ghana Cedi (GHS)</div>
                    <div><strong>Basis:</strong> Accrual Accounting</div>
                    <div><strong>Generated:</strong> {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 16 }}>
                    <thead>
                      <tr style={{ background: '#0f3a4b', color: '#fff', textAlign: 'left' }}>
                        <th style={{ padding: '6px 8px', border: '1px solid #0f3a4b' }}>Code</th>
                        <th style={{ padding: '6px 8px', border: '1px solid #0f3a4b' }}>Account Description</th>
                        <th style={{ padding: '6px 8px', border: '1px solid #0f3a4b' }}>Category</th>
                        <th style={{ padding: '6px 8px', border: '1px solid #0f3a4b', textAlign: 'right' }}>Debit (GHS)</th>
                        <th style={{ padding: '6px 8px', border: '1px solid #0f3a4b', textAlign: 'right' }}>Credit (GHS)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((r, idx) => (
                        <tr key={r.code} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '5px 8px', fontFamily: 'monospace', fontWeight: 700, color: '#0369a1' }}>{r.code}</td>
                          <td style={{ padding: '5px 8px', fontWeight: 600 }}>{r.name}</td>
                          <td style={{ padding: '5px 8px', color: '#64748b', fontSize: 10.5 }}>{r.cat}</td>
                          <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: r.debit > 0 ? 700 : 400 }}>
                            {r.debit > 0 ? r.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                          </td>
                          <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: r.credit > 0 ? 700 : 400 }}>
                            {r.credit > 0 ? r.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#f1f5f9', borderTop: '2px solid #0f3a4b', borderBottom: '2px double #0f3a4b', fontWeight: 900, fontSize: 11.5 }}>
                        <td colSpan={3} style={{ padding: '8px', textTransform: 'uppercase', textAlign: 'right', color: '#0f3a4b' }}>GRAND TOTALS:</td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#0369a1' }}>{totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#0369a1' }}>{totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </tfoot>
                  </table>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 12px', borderRadius: 4, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#15803d', fontWeight: 800, fontSize: 11.5 }}>
                      <span>✓ STATUS: TRIAL BALANCE IS BALANCED</span>
                    </div>
                    <div style={{ fontSize: 10.5, color: '#166534', fontWeight: 600 }}>
                      Debits (GHS {totalDebits.toLocaleString()}) = Credits (GHS {totalCredits.toLocaleString()})
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 24, paddingTop: 12, borderTop: '1px dashed #cbd5e1', fontSize: 10.5, color: '#475569', textAlign: 'center' }}>
                    <div>
                      <div style={{ borderBottom: '1px solid #94a3b8', height: 24, marginBottom: 4 }}></div>
                      <strong>Chief Accountant</strong>
                    </div>
                    <div>
                      <div style={{ borderBottom: '1px solid #94a3b8', height: 24, marginBottom: 4 }}></div>
                      <strong>Internal Auditor</strong>
                    </div>
                    <div>
                      <div style={{ borderBottom: '1px solid #94a3b8', height: 24, marginBottom: 4 }}></div>
                      <strong>Headmaster / Director</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrintAccountStatementForm({ setM, initialMode = 'student' }) {
  const [statementMode, setStatementMode] = useState(initialMode); // 'student' or 'general'
  
  // Student Statement State
  const [enrollmentNo, setEnrollmentNo] = useState('421215');
  const [studentName, setStudentName] = useState('ADAN ALHAJ HAFSAT');
  
  // General Ledger Statement State
  const [accountName, setAccountName] = useState('Admin fees');
  const [accountNo, setAccountNo] = useState('10081');

  // Shared Date & Viewer State
  const [dateFrom, setDateFrom] = useState('Saturday , September 5, 2026');
  const [dateTo, setDateTo] = useState('Saturday , September 5, 2026');
  const [reportPeriodSub, setReportPeriodSub] = useState('From: 09/05/2026 To: 09/05/2026');
  const [zoomLevel, setZoomLevel] = useState('100%');
  const [searchText, setSearchText] = useState('');

  const accountMap = {
    'Admin fees': '10081',
    'Tuition & Academic Fees': '10012',
    'Bus & Transport Services': '10025',
    'Stationery & Depot Revenue': '10040',
    'Utility & Generator Expenses': '50010',
    'Staff Salaries Account': '50022',
  };

  const studentDatabase = [
    { code: '421215', name: 'ADAN ALHAJ HAFSAT' },
    { code: '420859', name: 'ANDREWS KOJO ANTWI' },
    { code: '420863', name: 'OTOO PRINCE' },
    { code: '420874', name: 'CEDRICK NANA AWORTWE' },
  ];

  const handleAccountChange = (name) => {
    setAccountName(name);
    if (accountMap[name]) {
      setAccountNo(accountMap[name]);
    }
  };

  const handleEnrollmentSearch = () => {
    const found = studentDatabase.find(s => s.code === enrollmentNo || s.name.toLowerCase().includes(studentName.toLowerCase()));
    if (found) {
      setEnrollmentNo(found.code);
      setStudentName(found.name);
    } else {
      alert('Student record located in database!');
    }
  };

  const generalStatementRows = [
    { date: '01 Sep 2026', ref: 'BAL-001', desc: 'Opening Account Balance Brought Forward', debit: 0, credit: 0, balance: 4500 },
    { date: '02 Sep 2026', ref: 'REC-99210', desc: 'Admission Application Form Admin Fee', debit: 0, credit: 250, balance: 4750 },
    { date: '03 Sep 2026', ref: 'PV-2026-081', desc: 'Office Stationery & Printing Administration Paper', debit: 120, credit: 0, balance: 4630 },
    { date: '05 Sep 2026', ref: 'REC-99304', desc: 'Transcript & Certification Processing Fee', debit: 0, credit: 180, balance: 4810 },
    { date: '05 Sep 2026', ref: 'REC-99318', desc: 'Late Registration Admin Processing Fee', debit: 0, credit: 150, balance: 4960 },
  ];

  const studentStatementRows = [
    { date: '01/09/2026', inv: 'INV-2026-041', trx: 'TRX-8812', desc: 'Term 1 Academic Fee Bill', type: 'DB', merchant: 'Billing', ref: 'REF-991', debit: '1,850.00', credit: '-', bal: '1,850.00' },
    { date: '05/09/2026', inv: '-', trx: 'REC-99281', desc: 'MoMo Fee Payment Received', type: 'CR', merchant: 'MTN MoMo', ref: 'REC-99281', debit: '-', credit: '1,200.00', bal: '650.00' },
    { date: '05/09/2026', inv: '-', trx: 'REC-99340', desc: 'Cash Payment at Cashier Counter', type: 'CR', merchant: 'Cash Counter', ref: 'REC-99340', debit: '-', credit: '650.00', bal: '0.00' },
  ];

  const totalDebits = generalStatementRows.reduce((sum, r) => sum + r.debit, 0);
  const totalCredits = generalStatementRows.reduce((sum, r) => sum + r.credit, 0);
  const endingBalance = generalStatementRows[generalStatementRows.length - 1].balance;

  const filteredGeneralRows = generalStatementRows.filter(
    (r) =>
      r.ref.toLowerCase().includes(searchText.toLowerCase()) ||
      r.desc.toLowerCase().includes(searchText.toLowerCase()) ||
      r.date.toLowerCase().includes(searchText.toLowerCase())
  );

  const filteredStudentRows = studentStatementRows.filter(
    (r) =>
      r.trx.toLowerCase().includes(searchText.toLowerCase()) ||
      r.desc.toLowerCase().includes(searchText.toLowerCase()) ||
      r.date.toLowerCase().includes(searchText.toLowerCase())
  );

  const handlePreviewStatement = () => {
    setReportPeriodSub(`From: 09/05/2026 To: 09/05/2026`);
  };

  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)', background: '#cbd5e1', borderRadius: 8, overflow: 'hidden', border: '1px solid #94a3b8' }}>
      {/* ── HEADER BANNER ── */}
      <div className="no-print" style={{
        background: 'linear-gradient(90deg, #93c5fd 0%, #3b82f6 100%)',
        color: '#0f172a',
        padding: '6px 14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #60a5fa'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>
            {statementMode === 'student' ? 'Account Statement' : 'Print Account Statement'}
          </span>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.4)', borderRadius: 4, padding: 2 }}>
            <button
              type="button"
              onClick={() => setStatementMode('student')}
              style={{
                padding: '2px 8px',
                fontSize: 10.5,
                fontWeight: 800,
                border: 'none',
                borderRadius: 3,
                background: statementMode === 'student' ? '#0f3a4b' : 'transparent',
                color: statementMode === 'student' ? '#fff' : '#0f172a',
                cursor: 'pointer'
              }}
            >
              Student Statement
            </button>
            <button
              type="button"
              onClick={() => setStatementMode('general')}
              style={{
                padding: '2px 8px',
                fontSize: 10.5,
                fontWeight: 800,
                border: 'none',
                borderRadius: 3,
                background: statementMode === 'general' ? '#0f3a4b' : 'transparent',
                color: statementMode === 'general' ? '#fff' : '#0f172a',
                cursor: 'pointer'
              }}
            >
              GL Account Statement
            </button>
          </div>
        </div>
        {setM && (
          <button
            type="button"
            onClick={() => setM(null)}
            style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 10px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
          >
            ✕ Close
          </button>
        )}
      </div>

      {/* ── MAIN WORKSPACE split left controls / right report document ── */}
      <div style={{ display: 'flex', minHeight: 560 }}>
        {/* LEFT CONTROL PANEL (Customer Details Parameter Box) */}
        <div className="no-print" style={{ width: 320, background: '#d9e2ec', borderRight: '1px solid #94a3b8', padding: 12, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11 }}>
          <fieldset style={{ border: '1px solid #94a3b8', borderRadius: 4, padding: 10, background: '#e2e8f0', margin: 0 }}>
            <legend style={{ fontSize: 10.5, fontWeight: 800, color: '#1e293b', padding: '0 4px' }}>Customer Details</legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              
              {statementMode === 'student' ? (
                /* STUDENT STATEMENT PARAMETERS */
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <label style={{ fontWeight: 600, width: 85 }}>Enrollment #</label>
                    <input
                      type="text"
                      value={enrollmentNo}
                      onChange={(e) => setEnrollmentNo(e.target.value)}
                      style={{ width: 80, padding: '3px 6px', fontSize: 11, border: '1px solid #94a3b8', borderRadius: 3, background: '#fff', fontWeight: 800 }}
                    />
                    <button
                      type="button"
                      onClick={handleEnrollmentSearch}
                      style={{ padding: '3px 8px', background: '#cbd5e1', color: '#0f172a', border: '1px solid #64748b', borderRadius: 3, fontWeight: 700, fontSize: 10.5, cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      Search by Name
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontWeight: 600, width: 85 }}>Student Name</label>
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      style={{ width: 190, padding: '3px 6px', fontSize: 11, border: '1px solid #94a3b8', borderRadius: 3, background: '#fff', textTransform: 'uppercase', fontWeight: 700 }}
                    />
                  </div>
                </>
              ) : (
                /* GENERAL LEDGER STATEMENT PARAMETERS */
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontWeight: 600, width: 100 }}>Name of PL/Account</label>
                    <select
                      value={accountName}
                      onChange={(e) => handleAccountChange(e.target.value)}
                      style={{ width: 180, padding: '3px 6px', fontSize: 11, border: '1px solid #94a3b8', borderRadius: 3, background: '#fff' }}
                    >
                      <option value="Admin fees">Admin fees</option>
                      <option value="Tuition & Academic Fees">Tuition & Academic Fees</option>
                      <option value="Bus & Transport Services">Bus & Transport Services</option>
                      <option value="Stationery & Depot Revenue">Stationery & Depot Revenue</option>
                      <option value="Utility & Generator Expenses">Utility & Generator Expenses</option>
                      <option value="Staff Salaries Account">Staff Salaries Account</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontWeight: 600, width: 100 }}>Account N/o.</label>
                    <input
                      type="text"
                      value={accountNo}
                      onChange={(e) => setAccountNo(e.target.value)}
                      style={{ width: 180, padding: '3px 6px', fontSize: 11, border: '1px solid #94a3b8', borderRadius: 3, background: '#fff', fontWeight: 800, color: '#b91c1c' }}
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontWeight: 600, width: 85 }}>From</label>
                <div style={{ display: 'flex', alignItems: 'center', width: 190, position: 'relative' }}>
                  <input
                    type="text"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    style={{ width: '100%', padding: '3px 24px 3px 6px', fontSize: 10.5, border: '1px solid #94a3b8', borderRadius: 3, background: '#fff' }}
                  />
                  <span style={{ position: 'absolute', right: 6, fontSize: 11, cursor: 'pointer', pointerEvents: 'none' }}>📅</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontWeight: 600, width: 85 }}>To</label>
                <div style={{ display: 'flex', alignItems: 'center', width: 190, position: 'relative' }}>
                  <input
                    type="text"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    style={{ width: '100%', padding: '3px 24px 3px 6px', fontSize: 10.5, border: '1px solid #94a3b8', borderRadius: 3, background: '#fff' }}
                  />
                  <span style={{ position: 'absolute', right: 6, fontSize: 11, cursor: 'pointer', pointerEvents: 'none' }}>📅</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePreviewStatement}
                style={{ marginTop: 6, width: '100%', padding: '6px 8px', background: '#cbd5e1', color: '#0f172a', border: '1px solid #64748b', borderRadius: 3, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
              >
                Preview Statement
              </button>
            </div>
          </fieldset>
        </div>

        {/* RIGHT REPORT CANVAS & TOOLBAR */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#cbd5e1' }}>
          {/* REPORT VIEWER TOOLBAR */}
          <div style={{
            background: '#e2e8f0',
            borderBottom: '1px solid #94a3b8',
            padding: '4px 10px',
            display: 'flex',
            alignItems: 'center',
            justify: 'space-between',
            fontSize: 11,
            gap: 8
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button type="button" onClick={() => window.print()} title="Print" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3, cursor: 'pointer' }}>🖨️</button>
              <button type="button" onClick={() => alert('Exporting PDF...')} title="Save PDF" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3, cursor: 'pointer' }}>💾</button>
              <button type="button" onClick={() => alert('Refreshed Data')} title="Refresh" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3, cursor: 'pointer' }}>🔄</button>
              <span style={{ color: '#94a3b8' }}>|</span>
              <button type="button" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3 }}>|&lt;</button>
              <button type="button" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3 }}>&lt;</button>
              <span style={{ fontWeight: 600 }}>Page 1 of 1</span>
              <button type="button" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3 }}>&gt;</button>
              <button type="button" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3 }}>&gt;|</button>
              <span style={{ color: '#94a3b8' }}>|</span>
              <button type="button" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3 }}>-</button>
              <select value={zoomLevel} onChange={(e) => setZoomLevel(e.target.value)} style={{ padding: '2px 4px', fontSize: 10.5, border: '1px solid #94a3b8', borderRadius: 3 }}>
                <option value="100%">100%</option>
                <option value="125%">125%</option>
                <option value="75%">75%</option>
              </select>
              <button type="button" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3 }}>+</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontWeight: 600 }}>Find Text:</span>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search..."
                style={{ width: 90, padding: '2px 4px', fontSize: 10.5, border: '1px solid #94a3b8', borderRadius: 3 }}
              />
            </div>
          </div>

          {/* MAIN REPORT TAB BAR */}
          <div style={{ background: '#cbd5e1', borderBottom: '1px solid #94a3b8', padding: '2px 10px 0 10px', display: 'flex', gap: 4 }}>
            <div style={{ background: '#ffffff', border: '1px solid #94a3b8', borderBottom: 'none', padding: '3px 12px', fontSize: 10.5, fontWeight: 700, borderRadius: '3px 3px 0 0', color: '#0f172a' }}>
              Main Report
            </div>
          </div>

          {/* REPORT DOCUMENT SHEET */}
          <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              background: '#ffffff',
              width: 740,
              minHeight: 560,
              padding: 24,
              borderRadius: 4,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              border: '1px solid #cbd5e1',
              color: '#0f172a'
            }}>
              {statementMode === 'student' ? (
                /* ── STUDENT STATEMENT OF ACCOUNTS CANVAS (Matching media_1788935163502.jpg) ── */
                <div>
                  {/* BOXED HEADER FRAME */}
                  <div style={{
                    border: '1px solid #000',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    position: 'relative',
                    marginBottom: 16
                  }}>
                    {/* EMBLEM ON LEFT */}
                    <div style={{ position: 'absolute', left: 12, display: 'flex', alignItems: 'center' }}>
                      <img src="/remalj-carewell-logo.jpg" alt="REMALJ Carewell Logo" style={{ height: 48, width: 48, borderRadius: '50%', objectFit: 'cover' }} />
                    </div>

                    <div style={{ textAlign: 'center' }}>
                      <h2 style={{ fontSize: 13, color: '#0f172a', fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                        REMALJ CAREWELL INSPIRATIONAL SCHOOL
                      </h2>
                      <p style={{ fontSize: 10.5, color: '#0f172a', margin: '2px 0 0 0', fontWeight: 700 }}>
                        Loc: Ntriakwakrom , Bogoso, Ghana, WP-0023-6662
                      </p>
                    </div>
                  </div>

                  {/* STATEMENT OF ACCOUNTS HEADING */}
                  <div style={{ position: 'relative', marginBottom: 14 }}>
                    <div style={{ position: 'absolute', right: 0, top: 0, fontSize: 10, color: '#0f172a' }}>
                      9/5/2026
                    </div>
                    <h1 style={{ fontSize: 22, color: '#0f172a', fontWeight: 900, margin: '0 0 10px 0', letterSpacing: '0.01em' }}>
                      Statement of Accounts
                    </h1>

                    <div style={{ fontSize: 10.5, color: '#0f172a', lineHeight: 1.5 }}>
                      <div>Account code: <strong>{enrollmentNo}</strong></div>
                      <div>Student name: <strong>{studentName}</strong></div>
                      <div>Period: From: <strong>09/05/2026</strong> To: <strong>09/05/2026</strong></div>
                    </div>
                  </div>

                  {/* STATEMENT OF ACCOUNTS TABLE */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10, border: '1px solid #000', marginBottom: 16 }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #000' }}>
                        <th style={{ padding: '5px 4px', borderRight: '1px solid #000', textAlign: 'left', fontWeight: 800 }}>Date</th>
                        <th style={{ padding: '5px 4px', borderRight: '1px solid #000', textAlign: 'left', fontWeight: 800 }}>Invoice N/o.</th>
                        <th style={{ padding: '5px 4px', borderRight: '1px solid #000', textAlign: 'left', fontWeight: 800 }}>Transc. N/o.</th>
                        <th style={{ padding: '5px 4px', borderRight: '1px solid #000', textAlign: 'left', fontWeight: 800 }}>Description</th>
                        <th style={{ padding: '5px 4px', borderRight: '1px solid #000', textAlign: 'center', fontWeight: 800 }}>T. Type</th>
                        <th style={{ padding: '5px 4px', borderRight: '1px solid #000', textAlign: 'left', fontWeight: 800 }}>Merchant</th>
                        <th style={{ padding: '5px 4px', borderRight: '1px solid #000', textAlign: 'left', fontWeight: 800 }}>Reference</th>
                        <th style={{ padding: '5px 4px', borderRight: '1px solid #000', textAlign: 'right', fontWeight: 800 }}>Debit</th>
                        <th style={{ padding: '5px 4px', borderRight: '1px solid #000', textAlign: 'right', fontWeight: 800 }}>Credit</th>
                        <th style={{ padding: '5px 4px', textAlign: 'right', fontWeight: 800 }}>Bal.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudentRows.map((r, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '4px 4px', borderRight: '1px solid #e2e8f0' }}>{r.date}</td>
                          <td style={{ padding: '4px 4px', borderRight: '1px solid #e2e8f0', fontFamily: 'monospace' }}>{r.inv}</td>
                          <td style={{ padding: '4px 4px', borderRight: '1px solid #e2e8f0', fontFamily: 'monospace' }}>{r.trx}</td>
                          <td style={{ padding: '4px 4px', borderRight: '1px solid #e2e8f0' }}>{r.desc}</td>
                          <td style={{ padding: '4px 4px', borderRight: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 700 }}>{r.type}</td>
                          <td style={{ padding: '4px 4px', borderRight: '1px solid #e2e8f0' }}>{r.merchant}</td>
                          <td style={{ padding: '4px 4px', borderRight: '1px solid #e2e8f0', fontFamily: 'monospace' }}>{r.ref}</td>
                          <td style={{ padding: '4px 4px', borderRight: '1px solid #e2e8f0', textAlign: 'right' }}>{r.debit}</td>
                          <td style={{ padding: '4px 4px', borderRight: '1px solid #e2e8f0', textAlign: 'right' }}>{r.credit}</td>
                          <td style={{ padding: '4px 4px', textAlign: 'right', fontWeight: 700 }}>{r.bal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* STATEMENT FOOTER METADATA */}
                  <div style={{ fontSize: 10, color: '#0f172a', marginTop: 20 }}>
                    <div style={{ marginBottom: 12 }}>
                      Desc: ; &nbsp;&nbsp;&nbsp;&nbsp; In acc/of: ; &nbsp;&nbsp;&nbsp;&nbsp; Control: ;
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 10 }}>
                      <div style={{ borderBottom: '2px double #000', width: 120, fontWeight: 800 }}>
                        Grand Total:
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div>Balance at period end &nbsp;&nbsp;&nbsp;&nbsp; <strong>0.00</strong></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── GENERAL LEDGER ACCOUNT STATEMENT CANVAS ── */
                <div>
                  <div style={{ textAlign: 'center', borderBottom: '2px solid #0f3a4b', paddingBottom: 10, marginBottom: 14 }}>
                    <img src="/remalj-carewell-logo.jpg" alt="REMALJ Carewell Logo" style={{ height: 45, width: 'auto', borderRadius: 4, marginBottom: 4 }} />
                    <h2 style={{ fontSize: 18, color: '#0f3a4b', fontWeight: 900, margin: 0, letterSpacing: '0.03em' }}>REMALJ CAREWELL INSPIRATIONAL SCHOOL</h2>
                    <p style={{ fontSize: 11, color: '#0284c7', margin: '2px 0 6px 0', fontWeight: 700 }}>Finance & Accounts Department · Bogoso, Ghana</p>
                    <h3 style={{ fontSize: 14, color: '#b91c1c', fontWeight: 900, margin: '6px 0 2px 0', textTransform: 'uppercase' }}>Official Account Statement</h3>
                    <p style={{ fontSize: 11, color: '#475569', margin: 0, fontStyle: 'italic' }}>{reportPeriodSub}</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: '#f8fafc', border: '1px solid #e2e8f0', padding: 10, borderRadius: 4, fontSize: 11, marginBottom: 14 }}>
                    <div><strong>Account Name:</strong> {accountName}</div>
                    <div><strong>Account Number:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#b91c1c' }}>{accountNo}</span></div>
                    <div><strong>Currency:</strong> Ghana Cedi (GHS)</div>
                    <div><strong>Generated Date:</strong> {new Date().toLocaleDateString()}</div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 16 }}>
                    <thead>
                      <tr style={{ background: '#0f3a4b', color: '#fff', textAlign: 'left' }}>
                        <th style={{ padding: '6px 8px', border: '1px solid #0f3a4b' }}>Date</th>
                        <th style={{ padding: '6px 8px', border: '1px solid #0f3a4b' }}>Ref / Receipt #</th>
                        <th style={{ padding: '6px 8px', border: '1px solid #0f3a4b' }}>Particulars / Description</th>
                        <th style={{ padding: '6px 8px', border: '1px solid #0f3a4b', textAlign: 'right' }}>Debit (GHS)</th>
                        <th style={{ padding: '6px 8px', border: '1px solid #0f3a4b', textAlign: 'right' }}>Credit (GHS)</th>
                        <th style={{ padding: '6px 8px', border: '1px solid #0f3a4b', textAlign: 'right' }}>Balance (GHS)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGeneralRows.map((r, idx) => (
                        <tr key={r.ref} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '5px 8px', fontWeight: 600 }}>{r.date}</td>
                          <td style={{ padding: '5px 8px', fontFamily: 'monospace', fontWeight: 700, color: '#0369a1' }}>{r.ref}</td>
                          <td style={{ padding: '5px 8px' }}>{r.desc}</td>
                          <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: r.debit > 0 ? 700 : 400 }}>
                            {r.debit > 0 ? r.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                          </td>
                          <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: r.credit > 0 ? 700 : 400 }}>
                            {r.credit > 0 ? r.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                          </td>
                          <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 800, color: '#0f3a4b' }}>
                            {r.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#f1f5f9', borderTop: '2px solid #0f3a4b', borderBottom: '2px double #0f3a4b', fontWeight: 900, fontSize: 11.5 }}>
                        <td colSpan={3} style={{ padding: '8px', textTransform: 'uppercase', textAlign: 'right', color: '#0f3a4b' }}>TOTALS / CLOSING BALANCE:</td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#dc2626' }}>{totalDebits.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#16a34a' }}>{totalCredits.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: '8px', textAlign: 'right', color: '#0369a1' }}>{endingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </tfoot>
                  </table>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 24, paddingTop: 16, borderTop: '1px dashed #cbd5e1', fontSize: 10.5, color: '#475569', textAlign: 'center' }}>
                    <div>
                      <div style={{ borderBottom: '1px solid #94a3b8', height: 28, marginBottom: 4 }}></div>
                      <strong>Finance & Accounts Officer</strong>
                    </div>
                    <div>
                      <div style={{ borderBottom: '1px solid #94a3b8', height: 28, marginBottom: 4 }}></div>
                      <strong>Internal Auditor / Headmaster</strong>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrintAllPostClassStudentsBillsForm({ setM }) {
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [academicTerm, setAcademicTerm] = useState('Term 1');
  const [postYear, setPostYear] = useState('2026/2027');
  const [postTerm, setPostTerm] = useState('Term 1');
  const [postDept, setPostDept] = useState('JHS Department');
  const [postClass, setPostClass] = useState('Basic 8');
  const [postSubClass, setPostSubClass] = useState('B');
  const [subTitleText, setSubTitleText] = useState('Academic Year 2026/2027 · Term 1 · Class: Basic 8 - B');
  const [zoomLevel, setZoomLevel] = useState('100%');
  const [searchText, setSearchText] = useState('');

  const classStudents = [
    { id: 'REMALJ-2026-001', name: 'BENJAMIN EDWARDS', dept: 'JHS Department', tuition: 1850, lab: 150, pta: 50, total: 2050 },
    { id: 'REMALJ-2026-002', name: 'ADWOA EDWARDS', dept: 'JHS Department', tuition: 1850, lab: 150, pta: 50, total: 2050 },
    { id: 'REMALJ-2026-041', name: 'ABENA MENSAH', dept: 'JHS Department', tuition: 1850, lab: 150, pta: 50, total: 2050 },
    { id: 'REMALJ-2026-042', name: 'KOFI MENSAH', dept: 'JHS Department', tuition: 1850, lab: 150, pta: 50, total: 2050 },
    { id: '421215', name: 'ADAN ALHAJ HAFSAT', dept: 'JHS Department', tuition: 1850, lab: 150, pta: 50, total: 2050 },
  ];

  const totalBilling = classStudents.reduce((sum, s) => sum + s.total, 0);

  const filteredStudents = classStudents.filter(
    (s) =>
      s.id.toLowerCase().includes(searchText.toLowerCase()) ||
      s.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handlePreviewBills = () => {
    setSubTitleText(`Academic Year ${postYear} · ${postTerm} · Class: ${postClass} - ${postSubClass}`);
  };

  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)', background: '#cbd5e1', borderRadius: 8, overflow: 'hidden', border: '1px solid #94a3b8' }}>
      {/* ── HEADER BANNER ── */}
      <div className="no-print" style={{
        background: 'linear-gradient(90deg, #93c5fd 0%, #3b82f6 100%)',
        color: '#0f172a',
        padding: '6px 14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #60a5fa'
      }}>
        <span style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>Print all post class students Bills</span>
        {setM && (
          <button
            type="button"
            onClick={() => setM(null)}
            style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 10px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
          >
            ✕ Close
          </button>
        )}
      </div>

      {/* ── MAIN WORKSPACE ── */}
      <div style={{ display: 'flex', minHeight: 560 }}>
        {/* LEFT CONTROL PANEL */}
        <div className="no-print" style={{ width: 310, background: '#d9e2ec', borderRight: '1px solid #94a3b8', padding: 10, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11 }}>
          
          {/* Current Academic Period */}
          <fieldset style={{ border: '1px solid #94a3b8', borderRadius: 4, padding: 8, background: '#e2e8f0', margin: 0 }}>
            <legend style={{ fontSize: 10.5, fontWeight: 800, color: '#1e293b', padding: '0 4px' }}>Current Academic Period</legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 2 }}>Select Current Academic year</label>
                <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} style={{ width: '100%', padding: '3px 6px', fontSize: 11, border: '1px solid #94a3b8', borderRadius: 3, background: '#fff' }}>
                  <option value="2026/2027">2026/2027</option>
                  <option value="2025/2026">2025/2026</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 2 }}>Select Current Academic term</label>
                <select value={academicTerm} onChange={(e) => setAcademicTerm(e.target.value)} style={{ width: '100%', padding: '3px 6px', fontSize: 11, border: '1px solid #94a3b8', borderRadius: 3, background: '#fff' }}>
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
              </div>
            </div>
          </fieldset>

          {/* Post Academic Period */}
          <fieldset style={{ border: '1px solid #94a3b8', borderRadius: 4, padding: 8, background: '#e2e8f0', margin: 0 }}>
            <legend style={{ fontSize: 10.5, fontWeight: 800, color: '#1e293b', padding: '0 4px' }}>Post Academic Period</legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 2 }}>Select Post Academic year</label>
                <select value={postYear} onChange={(e) => setPostYear(e.target.value)} style={{ width: '100%', padding: '3px 6px', fontSize: 11, border: '1px solid #94a3b8', borderRadius: 3, background: '#fff' }}>
                  <option value="2026/2027">2026/2027</option>
                  <option value="2025/2026">2025/2026</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 2 }}>Select Post Academic term</label>
                <select value={postTerm} onChange={(e) => setPostTerm(e.target.value)} style={{ width: '100%', padding: '3px 6px', fontSize: 11, border: '1px solid #94a3b8', borderRadius: 3, background: '#fff' }}>
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 2 }}>Select Post Department</label>
                <select value={postDept} onChange={(e) => setPostDept(e.target.value)} style={{ width: '100%', padding: '3px 6px', fontSize: 11, border: '1px solid #94a3b8', borderRadius: 3, background: '#fff' }}>
                  <option value="JHS Department">JHS Department</option>
                  <option value="Primary Department">Primary Department</option>
                  <option value="Preschool Department">Preschool Department</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 2 }}>Select Post Class</label>
                <select value={postClass} onChange={(e) => setPostClass(e.target.value)} style={{ width: '100%', padding: '3px 6px', fontSize: 11, border: '1px solid #94a3b8', borderRadius: 3, background: '#fff' }}>
                  <option value="Basic 8">Basic 8</option>
                  <option value="Basic 7">Basic 7</option>
                  <option value="Basic 9">Basic 9</option>
                  <option value="Basic 6">Basic 6</option>
                  <option value="Basic 5">Basic 5</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: 2 }}>Select Post Sub-class</label>
                <select value={postSubClass} onChange={(e) => setPostSubClass(e.target.value)} style={{ width: '100%', padding: '3px 6px', fontSize: 11, border: '1px solid #94a3b8', borderRadius: 3, background: '#fff' }}>
                  <option value="B">B</option>
                  <option value="A">A</option>
                  <option value="C">C</option>
                  <option value="All">All Sub-Classes</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handlePreviewBills}
                style={{ marginTop: 6, width: '100%', padding: '6px 8px', background: '#cbd5e1', color: '#0f172a', border: '1px solid #64748b', borderRadius: 3, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
              >
                Preview Bills
              </button>
            </div>
          </fieldset>
        </div>

        {/* RIGHT REPORT CANVAS */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#cbd5e1' }}>
          {/* TOOLBAR */}
          <div className="no-print" style={{ background: '#e2e8f0', borderBottom: '1px solid #94a3b8', padding: '4px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button type="button" onClick={() => window.print()} title="Print" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3, cursor: 'pointer' }}>🖨️</button>
              <button type="button" onClick={() => alert('Exporting PDF...')} title="Save PDF" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3, cursor: 'pointer' }}>💾</button>
              <button type="button" onClick={() => alert('Refreshed')} title="Refresh" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3, cursor: 'pointer' }}>🔄</button>
              <span style={{ color: '#94a3b8' }}>|</span>
              <button type="button" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3 }}>|&lt;</button>
              <button type="button" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3 }}>&lt;</button>
              <span style={{ fontWeight: 600 }}>Page 1 of 1</span>
              <button type="button" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3 }}>&gt;</button>
              <button type="button" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3 }}>&gt;|</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontWeight: 600 }}>Find Text:</span>
              <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search..." style={{ width: 90, padding: '2px 4px', fontSize: 10.5, border: '1px solid #94a3b8', borderRadius: 3 }} />
            </div>
          </div>

          <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
            <div className="printable-area accountant-printable" style={{ background: '#ffffff', width: 740, minHeight: 520, padding: 24, borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid #cbd5e1' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0f3a4b', paddingBottom: 10, marginBottom: 14 }}>
                <img src="/remalj-carewell-logo.jpg" alt="REMALJ Carewell Logo" style={{ height: 45, width: 'auto', borderRadius: 4, marginBottom: 4, display: 'inline-block' }} />
                <h2 style={{ fontSize: 17, color: '#0f3a4b', fontWeight: 900, margin: 0 }}>REMALJ CAREWELL INSPIRATIONAL SCHOOL</h2>
                <p style={{ fontSize: 11, color: '#0284c7', margin: '2px 0 6px 0', fontWeight: 700 }}>Bogoso, Western Region, Ghana</p>
                <h3 style={{ fontSize: 14, color: '#b91c1c', fontWeight: 900, margin: '4px 0 0 0' }}>POST CLASS CONSOLIDATED STUDENT BILLS REGISTER</h3>
                <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0 0', fontStyle: 'italic' }}>{subTitleText}</p>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 16 }}>
                <thead>
                  <tr style={{ background: '#0f3a4b', color: '#fff', textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px', border: '1px solid #0f3a4b' }}>Student ID</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #0f3a4b' }}>Student Name</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #0f3a4b' }}>Tuition (GHS)</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #0f3a4b' }}>ICT & Lab (GHS)</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #0f3a4b' }}>PTA (GHS)</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #0f3a4b', textAlign: 'right' }}>Total Bill (GHS)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((s, idx) => (
                    <tr key={s.id} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '5px 8px', fontFamily: 'monospace', fontWeight: 700, color: '#0369a1' }}>{s.id}</td>
                      <td style={{ padding: '5px 8px', fontWeight: 600 }}>{s.name}</td>
                      <td style={{ padding: '5px 8px' }}>{s.tuition.toFixed(2)}</td>
                      <td style={{ padding: '5px 8px' }}>{s.lab.toFixed(2)}</td>
                      <td style={{ padding: '5px 8px' }}>{s.pta.toFixed(2)}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 800, color: '#0f3a4b' }}>{s.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f1f5f9', borderTop: '2px solid #0f3a4b', fontWeight: 900 }}>
                    <td colSpan={5} style={{ padding: '8px', textAlign: 'right', color: '#0f3a4b' }}>CLASS TOTAL BILLING:</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: '#0369a1' }}>GHS {totalBilling.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tfoot>
              </table>

              {/* Signature Footer */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20, paddingTop: 14, borderTop: '1px dashed #cbd5e1', fontSize: 10.5 }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#0f3a4b', marginBottom: 18 }}>Processed By (Bursar):</div>
                  <div style={{ borderBottom: '1px solid #94a3b8', width: '75%', marginBottom: 3 }} />
                  <div style={{ color: '#64748b' }}>Accounts Officer Signature</div>
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#0f3a4b', marginBottom: 18 }}>Approved By (Headmaster):</div>
                  <div style={{ borderBottom: '1px solid #94a3b8', width: '75%', marginBottom: 3 }} />
                  <div style={{ color: '#64748b' }}>Institutional Stamp & Seal</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BalanceSheetForm({ setM }) {
  const [asAtDate, setAsAtDate] = useState('Saturday , September 5, 2026');
  const [zoomLevel, setZoomLevel] = useState('100%');
  const [searchText, setSearchText] = useState('');

  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)', background: '#cbd5e1', borderRadius: 8, overflow: 'hidden', border: '1px solid #94a3b8' }}>
      {/* ── HEADER BANNER ── */}
      <div className="no-print" style={{
        background: 'linear-gradient(90deg, #93c5fd 0%, #3b82f6 100%)',
        color: '#0f172a',
        padding: '6px 14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #60a5fa'
      }}>
        <span style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>Balance Sheet</span>
        {setM && (
          <button
            type="button"
            onClick={() => setM(null)}
            style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 10px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
          >
            ✕ Close
          </button>
        )}
      </div>

      {/* ── MAIN WORKSPACE ── */}
      <div style={{ display: 'flex', minHeight: 560 }}>
        {/* LEFT CONTROL PANEL (Matching photo media_1788935249609.jpg) */}
        <div className="no-print" style={{ width: 260, background: '#d9e2ec', borderRight: '1px solid #94a3b8', padding: 12, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Select Date as at ?</label>
            <input
              type="text"
              value={asAtDate}
              onChange={(e) => setAsAtDate(e.target.value)}
              style={{ width: '100%', padding: '4px 6px', fontSize: 10.5, border: '1px solid #94a3b8', borderRadius: 3, background: '#fff' }}
            />
          </div>

          <button
            type="button"
            onClick={() => alert(`Balance Sheet previewed as at ${asAtDate}`)}
            style={{ width: '100%', padding: '6px 8px', background: '#cbd5e1', color: '#0f172a', border: '1px solid #64748b', borderRadius: 3, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
          >
            Preview Balance sheet
          </button>
        </div>

        {/* RIGHT REPORT CANVAS */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#cbd5e1' }}>
          {/* TOOLBAR */}
          <div className="no-print" style={{ background: '#e2e8f0', borderBottom: '1px solid #94a3b8', padding: '4px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button type="button" onClick={() => window.print()} title="Print" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3, cursor: 'pointer' }}>🖨️</button>
              <button type="button" onClick={() => alert('Exporting PDF...')} title="Save PDF" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3, cursor: 'pointer' }}>💾</button>
              <button type="button" onClick={() => alert('Refreshed')} title="Refresh" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3, cursor: 'pointer' }}>🔄</button>
              <span style={{ color: '#94a3b8' }}>|</span>
              <button type="button" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3 }}>|&lt;</button>
              <button type="button" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3 }}>&lt;</button>
              <span style={{ fontWeight: 600 }}>Page 1 of 1</span>
              <button type="button" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3 }}>&gt;</button>
              <button type="button" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3 }}>&gt;|</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontWeight: 600 }}>Find Text:</span>
              <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search..." style={{ width: 90, padding: '2px 4px', fontSize: 10.5, border: '1px solid #94a3b8', borderRadius: 3 }} />
            </div>
          </div>

          {/* MAIN REPORT TAB */}
          <div style={{ background: '#cbd5e1', borderBottom: '1px solid #94a3b8', padding: '2px 10px 0 10px', display: 'flex', gap: 4 }}>
            <div style={{ background: '#ffffff', border: '1px solid #94a3b8', borderBottom: 'none', padding: '3px 12px', fontSize: 10.5, fontWeight: 700, borderRadius: '3px 3px 0 0', color: '#0f172a' }}>
              Main Report
            </div>
          </div>

          <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
            <div style={{ background: '#ffffff', width: 740, minHeight: 540, padding: 24, borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid #cbd5e1' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0f3a4b', paddingBottom: 10, marginBottom: 16 }}>
                <img src="/remalj-carewell-logo.jpg" alt="REMALJ Carewell Logo" style={{ height: 45, width: 'auto', borderRadius: 4, marginBottom: 4 }} />
                <h2 style={{ fontSize: 18, color: '#0f3a4b', fontWeight: 900, margin: 0 }}>REMALJ CAREWELL INSPIRATIONAL SCHOOL</h2>
                <p style={{ fontSize: 11, color: '#0284c7', margin: '2px 0 6px 0', fontWeight: 700 }}>Bogoso, Western Region, Ghana</p>
                <h3 style={{ fontSize: 15, color: '#b91c1c', fontWeight: 900, margin: '4px 0 0 0' }}>STATEMENT OF FINANCIAL POSITION (BALANCE SHEET)</h3>
                <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0 0', fontStyle: 'italic' }}>As at {asAtDate}</p>
              </div>

              {/* ASSETS SECTION */}
              <div style={{ marginBottom: 16 }}>
                <h4 style={{ fontSize: 13, color: '#0f3a4b', borderBottom: '1px solid #0f3a4b', paddingBottom: 4, margin: '0 0 8px 0', textTransform: 'uppercase', fontWeight: 900 }}>ASSETS</h4>
                <div style={{ fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontWeight: 800, color: '#475569' }}>Non-Current Assets:</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 12 }}><span>School Premises & Infrastructure</span><span>450,000.00</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 12 }}><span>Furniture & Office Equipment</span><span>75,000.00</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 12 }}><span>School Transportation Buses</span><span>120,000.00</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 12, fontWeight: 800, borderTop: '1px dashed #cbd5e1', paddingTop: 2 }}><span>Total Non-Current Assets</span><span>645,000.00</span></div>

                  <div style={{ fontWeight: 800, color: '#475569', marginTop: 8 }}>Current Assets:</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 12 }}><span>Cash & Bank Balances (GCB, EcoBank, MoMo)</span><span>299,000.00</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 12 }}><span>Accounts Receivable - Student Academic Fees</span><span>62,400.00</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 12 }}><span>Stationery & Depot Inventory</span><span>18,400.00</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 12, fontWeight: 800, borderTop: '1px dashed #cbd5e1', paddingTop: 2 }}><span>Total Current Assets</span><span>379,800.00</span></div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', background: '#e0f2fe', padding: '6px 8px', borderRadius: 4, fontWeight: 900, color: '#0369a1', marginTop: 8 }}>
                    <span>TOTAL ASSETS (GHS)</span>
                    <span>1,024,800.00</span>
                  </div>
                </div>
              </div>

              {/* EQUITY & LIABILITIES SECTION */}
              <div>
                <h4 style={{ fontSize: 13, color: '#0f3a4b', borderBottom: '1px solid #0f3a4b', paddingBottom: 4, margin: '0 0 8px 0', textTransform: 'uppercase', fontWeight: 900 }}>EQUITY & LIABILITIES</h4>
                <div style={{ fontSize: 11, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontWeight: 800, color: '#475569' }}>Capital & Reserves:</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 12 }}><span>School Founding Capital Reserve</span><span>550,000.00</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 12 }}><span>Retained Surplus Fund</span><span>377,900.00</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 12, fontWeight: 800, borderTop: '1px dashed #cbd5e1', paddingTop: 2 }}><span>Total Equity & Capital</span><span>927,900.00</span></div>

                  <div style={{ fontWeight: 800, color: '#475569', marginTop: 8 }}>Current Liabilities:</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 12 }}><span>Accounts Payable - Vendors & Suppliers</span><span>65,000.00</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 12 }}><span>Accrued Payroll & Statutory Liabilities</span><span>31,900.00</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 12, fontWeight: 800, borderTop: '1px dashed #cbd5e1', paddingTop: 2 }}><span>Total Current Liabilities</span><span>96,900.00</span></div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', background: '#fef3c7', padding: '6px 8px', borderRadius: 4, fontWeight: 900, color: '#b45309', marginTop: 8 }}>
                    <span>TOTAL EQUITY & LIABILITIES (GHS)</span>
                    <span>1,024,800.00</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 20, padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 4, display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 800, color: '#15803d' }}>
                <span>✓ BALANCE SHEET IS BALANCED</span>
                <span>ASSETS (1,024,800.00) = EQUITY & LIABILITIES (1,024,800.00)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MonthlyPayrollReportForm({ setM }) {
  const [reportMonth, setReportMonth] = useState('September');
  const [reportYear, setReportYear] = useState('2026');
  const [banksCopy, setBanksCopy] = useState(false);
  const [zoomLevel, setZoomLevel] = useState('100%');

  const payrollRows = [
    { id: 'STF-2026-001', name: 'JOSEPH ASAMOAH ARTHUR', dept: 'Teaching & Academic', basic: 1100, allow: 150, ssnit: 60.50, paye: 85.00, net: 1104.50, bank: 'FAISEMAN RURAL BANK (5591920008558411)' },
    { id: 'STF-2026-012', name: 'MRS. GRACE ANIM-ANSAH', dept: 'Accounts & Finance', basic: 2800, allow: 350, ssnit: 154.00, paye: 320.00, net: 2676.00, bank: 'Barclays Bank / Absa (00192837410)' },
    { id: 'STF-2026-008', name: 'KWAME OTENG', dept: 'Transport Dept', basic: 1400, allow: 180, ssnit: 77.00, paye: 110.00, net: 1393.00, bank: 'GCB Bank (11029384710)' },
    { id: 'STF-2026-015', name: 'ABENA SARFO', dept: 'Preschool Unit', basic: 1250, allow: 120, ssnit: 68.75, paye: 95.00, net: 1206.25, bank: 'EcoBank Ghana (22019283741)' },
  ];

  const totalBasic = payrollRows.reduce((sum, r) => sum + r.basic, 0);
  const totalNet = payrollRows.reduce((sum, r) => sum + r.net, 0);

  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)', background: '#cbd5e1', borderRadius: 8, overflow: 'hidden', border: '1px solid #94a3b8' }}>
      {/* ── HEADER BANNER ── */}
      <div className="no-print" style={{ background: '#0f3a4b', color: '#fff', padding: '6px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em' }}>MONTHLY PAYROLL REPORT</span>
        {setM && (
          <button type="button" onClick={() => setM(null)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 10px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>✕ Close</button>
        )}
      </div>

      {/* TOP CONTROL BAR (Matching photo media_1788935276151.jpg) */}
      <div className="no-print" style={{ background: '#d9e2ec', borderBottom: '1px solid #94a3b8', padding: '10px 16px', display: 'flex', gap: 20, alignItems: 'center', fontSize: 11 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontWeight: 700 }}>Report Month:</label>
          <select value={reportMonth} onChange={(e) => setReportMonth(e.target.value)} style={{ padding: '3px 8px', fontSize: 11, border: '1px solid #94a3b8', borderRadius: 3, background: '#fff' }}>
            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontWeight: 700 }}>Report Year:</label>
          <select value={reportYear} onChange={(e) => setReportYear(e.target.value)} style={{ padding: '3px 8px', fontSize: 11, border: '1px solid #94a3b8', borderRadius: 3, background: '#fff' }}>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" id="banksCopyCheck" checked={banksCopy} onChange={(e) => setBanksCopy(e.target.checked)} />
          <label htmlFor="banksCopyCheck" style={{ fontWeight: 700, cursor: 'pointer' }}>Bank's Copy</label>
        </div>

        <button type="button" onClick={() => alert(`Monthly Payroll report previewed for ${reportMonth} ${reportYear}`)} style={{ padding: '5px 16px', background: '#cbd5e1', color: '#0f172a', border: '1px solid #64748b', borderRadius: 3, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
          Preview Report
        </button>

        {setM && (
          <button type="button" onClick={() => setM(null)} style={{ padding: '5px 16px', background: '#cbd5e1', color: '#0f172a', border: '1px solid #64748b', borderRadius: 3, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
            Close
          </button>
        )}
      </div>

      {/* REPORT VIEWER TOOLBAR */}
      <div className="no-print" style={{ background: '#e2e8f0', borderBottom: '1px solid #94a3b8', padding: '4px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button type="button" onClick={() => window.print()} title="Print" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3, cursor: 'pointer' }}>🖨️</button>
          <button type="button" onClick={() => alert('Exporting PDF...')} title="Save PDF" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3, cursor: 'pointer' }}>💾</button>
          <button type="button" onClick={() => alert('Refreshed')} title="Refresh" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3, cursor: 'pointer' }}>🔄</button>
        </div>
      </div>

      {/* CANVAS */}
      <div style={{ padding: 16, overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
        <div style={{ background: '#ffffff', width: 740, minHeight: 520, padding: 24, borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid #cbd5e1' }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #0f3a4b', paddingBottom: 10, marginBottom: 14 }}>
            <h2 style={{ fontSize: 17, color: '#0f3a4b', fontWeight: 900, margin: 0 }}>REMALJ CAREWELL INSPIRATIONAL SCHOOL</h2>
            <p style={{ fontSize: 11, color: '#0284c7', margin: '2px 0 6px 0', fontWeight: 700 }}>Bogoso, Ghana</p>
            <h3 style={{ fontSize: 14, color: '#b91c1c', fontWeight: 900, margin: '4px 0 0 0' }}>MONTHLY PAYROLL REGISTER {banksCopy ? "(BANK'S SCHEDULE COPY)" : ''}</h3>
            <p style={{ fontSize: 11, color: '#475569', margin: '2px 0 0 0', fontStyle: 'italic' }}>Period: {reportMonth} {reportYear}</p>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5, marginBottom: 16 }}>
            <thead>
              <tr style={{ background: '#0f3a4b', color: '#fff', textAlign: 'left' }}>
                <th style={{ padding: '5px 6px' }}>Staff ID</th>
                <th style={{ padding: '5px 6px' }}>Employee Name</th>
                <th style={{ padding: '5px 6px' }}>Department</th>
                <th style={{ padding: '5px 6px', textAlign: 'right' }}>Basic (GHS)</th>
                <th style={{ padding: '5px 6px', textAlign: 'right' }}>Net Pay (GHS)</th>
                <th style={{ padding: '5px 6px' }}>Bank & Account #</th>
              </tr>
            </thead>
            <tbody>
              {payrollRows.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '4px 6px', fontFamily: 'monospace', fontWeight: 700 }}>{r.id}</td>
                  <td style={{ padding: '4px 6px', fontWeight: 700 }}>{r.name}</td>
                  <td style={{ padding: '4px 6px', fontSize: 10 }}>{r.dept}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'right' }}>{r.basic.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: '4px 6px', textAlign: 'right', fontWeight: 800, color: '#0369a1' }}>{r.net.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: '4px 6px', fontSize: 9.5 }}>{r.bank}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f1f5f9', borderTop: '2px solid #0f3a4b', fontWeight: 900 }}>
                <td colSpan={3} style={{ padding: '6px', textAlign: 'right' }}>TOTAL PAYROLL DISBURSEMENT:</td>
                <td style={{ padding: '6px', textAlign: 'right' }}>{totalBasic.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td style={{ padding: '6px', textAlign: 'right', color: '#0369a1' }}>{totalNet.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function EmployeePayslipForm({ setM }) {
  const [selectedStaff, setSelectedStaff] = useState('JOSEPH ASAMOAH ARTHUR');

  const staffPayslipData = {
    'JOSEPH ASAMOAH ARTHUR': {
      name: 'JOSEPH ASAMOAH ARTHUR',
      address: 'BOX 139, BOGOSO',
      position: 'Senior Academic Instructor',
      bankers: 'FAISEMAN RURAL BANK',
      phone: '0246031331',
      accNo: '5591920008558411',
      ssn: 'B018911010075',
      branch: 'Head Office',
      dateAppointed: '01-09-2021',
      email: 'joe.arthur2012@gmail.com',
      dept: 'Teaching & Academic Unit',
      month: 'AUGUST',
      year: '2025',
      basic: '1,100.00',
      relief: '0.00',
      allowances: '150.00',
      ssnit: '60.50',
      paye: '85.00',
      netPay: '1,104.50'
    },
    'MRS. GRACE ANIM-ANSAH': {
      name: 'MRS. GRACE ANIM-ANSAH',
      address: 'BOX 44, BOGOSO / TARKWA',
      position: 'Senior Accountant',
      bankers: 'BARCLAYS BANK / ABSA',
      phone: '0244123456',
      accNo: '00192837410',
      ssn: 'C019283741029',
      branch: 'Tarkwa Main',
      dateAppointed: '15-01-2019',
      email: 'grace.anim@remalj.edu.gh',
      dept: 'Accounts & Finance',
      month: 'AUGUST',
      year: '2025',
      basic: '2,800.00',
      relief: '0.00',
      allowances: '350.00',
      ssnit: '154.00',
      paye: '320.00',
      netPay: '2,676.00'
    }
  };

  const p = staffPayslipData[selectedStaff] || staffPayslipData['JOSEPH ASAMOAH ARTHUR'];

  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)', background: '#cbd5e1', borderRadius: 8, overflow: 'hidden', border: '1px solid #94a3b8' }}>
      {/* ── HEADER BANNER ── */}
      <div className="no-print" style={{ background: '#3b82f6', color: '#fff', padding: '6px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 14, fontWeight: 900 }}>Employee Payslip</span>
        {setM && (
          <button type="button" onClick={() => setM(null)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, padding: '3px 10px', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>✕ Close</button>
        )}
      </div>

      {/* WORKSPACE WITH SIDEBAR SELECTOR & DOCUMENT CANVAS */}
      <div style={{ display: 'flex', minHeight: 560 }}>
        {/* SIDEBAR STAFF LIST (Matching media_1788935336602.jpg) */}
        <div className="no-print" style={{ width: 220, background: '#d9e2ec', borderRight: '1px solid #94a3b8', padding: 8, fontSize: 11 }}>
          <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Select Staff Payslip</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Object.keys(staffPayslipData).map((name) => (
              <div
                key={name}
                onClick={() => setSelectedStaff(name)}
                style={{
                  padding: '6px 8px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  background: selectedStaff === name ? '#0f3a4b' : '#fff',
                  color: selectedStaff === name ? '#fff' : '#0f172a',
                  fontWeight: selectedStaff === name ? 800 : 500,
                  fontSize: 11,
                  border: '1px solid #cbd5e1'
                }}
              >
                {name}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PAYSLIP DOCUMENT CANVAS */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#cbd5e1' }}>
          {/* TOOLBAR */}
          <div className="no-print" style={{ background: '#e2e8f0', borderBottom: '1px solid #94a3b8', padding: '4px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button type="button" onClick={() => window.print()} title="Print" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3, cursor: 'pointer' }}>🖨️</button>
              <button type="button" onClick={() => alert('Exporting PDF...')} title="Save PDF" style={{ padding: '2px 6px', background: '#fff', border: '1px solid #94a3b8', borderRadius: 3, cursor: 'pointer' }}>💾</button>
            </div>
            <div style={{ fontWeight: 700 }}>Current Page No.: 1 | Total Page No.: 1 | Zoom Factor: 100%</div>
          </div>

          <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
            {/* PAYSLIP SHEET (Matching photo media_1788935336602.jpg exactly) */}
            <div style={{ background: '#ffffff', width: 720, minHeight: 520, padding: 24, borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '1px solid #94a3b8', color: '#000' }}>
              
              {/* HEADER WITH LOGO */}
              <div style={{ position: 'relative', textAlign: 'center', marginBottom: 16 }}>
                {/* EMBLEM LOGO ON LEFT */}
                <div style={{ position: 'absolute', left: 10, top: 0, display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    border: '2px solid #0f3a4b',
                    background: '#e0f2fe',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    fontSize: 22
                  }}>
                    🏫
                  </div>
                </div>

                <h2 style={{ fontSize: 14, color: '#000', fontWeight: 900, margin: 0, letterSpacing: '0.02em' }}>
                  REMALJ CAREWELL INSPIRATIONAL SCHOOL
                </h2>
                <h3 style={{ fontSize: 12, color: '#000', fontWeight: 800, margin: '2px 0 6px 0' }}>
                  STAFF PAY SLIP
                </h3>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 60, fontSize: 12, fontWeight: 900 }}>
                  <span>{p.month}</span>
                  <span>{p.year}</span>
                </div>
              </div>

              {/* TOP HORIZONTAL RULE */}
              <div style={{ borderTop: '2px solid #000', marginBottom: 16 }}></div>

              {/* EMPLOYEE DETAILS GRID (2 COLUMNS matching photo) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px 20px', fontSize: 11, marginBottom: 16 }}>
                <div>
                  <span style={{ fontWeight: 600, display: 'inline-block', width: 140 }}>Name of Employee:</span>
                  <strong style={{ textTransform: 'uppercase' }}>{p.name}</strong>
                </div>
                <div>
                  <span style={{ fontWeight: 600, display: 'inline-block', width: 130 }}>Address:</span>
                  <strong>{p.address}</strong>
                </div>

                <div>
                  <span style={{ fontWeight: 600, display: 'inline-block', width: 140 }}>Position:</span>
                  <span>{p.position}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 600, display: 'inline-block', width: 130 }}>Name of Bankers:</span>
                  <strong>{p.bankers}</strong>
                </div>

                <div>
                  <span style={{ fontWeight: 600, display: 'inline-block', width: 140 }}>Telephone Number:</span>
                  <span style={{ fontFamily: 'monospace' }}>{p.phone}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 600, display: 'inline-block', width: 130 }}>Account Number:</span>
                  <strong style={{ fontFamily: 'monospace' }}>{p.accNo}</strong>
                </div>

                <div>
                  <span style={{ fontWeight: 600, display: 'inline-block', width: 140 }}>Social Security Number:</span>
                  <span style={{ fontFamily: 'monospace' }}>{p.ssn}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 600, display: 'inline-block', width: 130 }}>Bank Branch:</span>
                  <span>{p.branch}</span>
                </div>

                <div>
                  <span style={{ fontWeight: 600, display: 'inline-block', width: 140 }}>Date of Appointment:</span>
                  <span>{p.dateAppointed}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 600, display: 'inline-block', width: 130 }}>E-mail Address:</span>
                  <span>{p.email}</span>
                </div>

                <div>
                  <span style={{ fontWeight: 600, display: 'inline-block', width: 140 }}>Department:</span>
                  <span>{p.dept}</span>
                </div>
              </div>

              {/* BOTTOM HORIZONTAL RULE */}
              <div style={{ borderTop: '2px solid #000', marginBottom: 16 }}></div>

              {/* FINANCIAL SALARY DETAILS ROW */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: 11 }}>
                <div>
                  <span style={{ fontWeight: 600, display: 'inline-block', width: 140 }}>Basic Salary:</span>
                  <strong style={{ fontSize: 12 }}>{p.basic}</strong>
                </div>
                <div>
                  <span style={{ fontWeight: 600, display: 'inline-block', width: 130 }}>Tax Relief:</span>
                  <span>{p.relief}</span>
                </div>

                <div>
                  <span style={{ fontWeight: 600, display: 'inline-block', width: 140 }}>Allowances:</span>
                  <span>{p.allowances}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 600, display: 'inline-block', width: 130 }}>SSNIT (5.5%):</span>
                  <span>{p.ssnit}</span>
                </div>

                <div>
                  <span style={{ fontWeight: 600, display: 'inline-block', width: 140 }}>PAYE Tax:</span>
                  <span>{p.paye}</span>
                </div>
                <div>
                  <span style={{ fontWeight: 800, display: 'inline-block', width: 130, color: '#0f3a4b' }}>Net Salary Payable:</span>
                  <strong style={{ fontSize: 13, color: '#0369a1' }}>GHS {p.netPay}</strong>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountsAndFinancialReportsTree({ onSelectReport }) {
  const [expandedNodes, setExpandedNodes] = useState({
    Accounts: true,
    TrialBalances: true,
    AccountsStatements: true,
    FinancialStatements: true,
    HrPayrollReports: true
  });

  const [selectedReport, setSelectedReport] = useState('Print PL/Accounts Balances');

  const toggleNode = (node) => {
    setExpandedNodes(prev => ({ ...prev, [node]: !prev[node] }));
  };

  const handleReportClick = (reportName) => {
    setSelectedReport(reportName);
    if (onSelectReport) onSelectReport(reportName);
  };

  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)', color: '#0f172a' }}>
      {/* ── SIMS V2025 / TOP BAR ── */}
      <div style={{
        background: '#e0f2fe',
        border: '1px solid #bae6fd',
        padding: '4px 12px',
        fontSize: 11,
        fontWeight: 800,
        color: '#0369a1',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: '6px 6px 0 0'
      }}>
        <span>SIMs v2025 / Accounts & Financial Reports</span>
        <div style={{ background: '#fce7f3', color: '#be185d', padding: '2px 8px', borderRadius: 4, fontSize: 10.5, fontWeight: 900 }}>
          System Administrator
        </div>
      </div>

      {/* ── MAIN CONTAINER ── */}
      <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: 'none', borderRadius: '0 0 6px 6px', padding: 16 }}>

        {/* RED CATEGORY HEADER */}
        <h3 style={{ margin: '0 0 14px 0', fontSize: 15, fontWeight: 900, color: '#be123c', letterSpacing: '0.02em' }}>
          Accounts & Financial Reports
        </h3>

        {/* TREE CONTAINER BOX */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid #cbd5e1',
          borderRadius: 6,
          padding: 16,
          maxWidth: 480,
          fontFamily: 'monospace, sans-serif',
          fontSize: 12.5
        }}>
          {/* ROOT 1: ACCOUNTS */}
          <div style={{ marginBottom: 6 }}>
            <div
              onClick={() => toggleNode('Accounts')}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 6px',
                borderRadius: 4,
                background: '#0284c7',
                color: '#ffffff',
                fontWeight: 900,
                width: 'fit-content'
              }}
            >
              <span>{expandedNodes.Accounts ? '⊟' : '⊞'}</span>
              <span>Accounts</span>
            </div>

            {expandedNodes.Accounts && (
              <div style={{ paddingLeft: 18, borderLeft: '1px dotted #94a3b8', marginLeft: 8, marginTop: 4 }}>

                {/* SUB-NODE: Trial Balances */}
                <div style={{ marginBottom: 4 }}>
                  <div
                    onClick={() => toggleNode('TrialBalances')}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#0f3a4b', fontWeight: 800 }}
                  >
                    <span>{expandedNodes.TrialBalances ? '⊟' : '⊞'}</span>
                    <span>Trial Balances</span>
                  </div>
                  {expandedNodes.TrialBalances && (
                    <div style={{ paddingLeft: 18, borderLeft: '1px dotted #94a3b8', marginLeft: 8, marginTop: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div
                        onClick={() => handleReportClick('Trial Balance - Accounts')}
                        style={{ cursor: 'pointer', color: selectedReport === 'Trial Balance - Accounts' ? '#0284c7' : '#334155', fontWeight: selectedReport === 'Trial Balance - Accounts' ? 900 : 600, textDecoration: 'underline' }}
                      >
                        Trial Balance - Accounts
                      </div>
                      <div
                        onClick={() => handleReportClick('Print PL/Accounts Balances')}
                        style={{ cursor: 'pointer', color: selectedReport === 'Print PL/Accounts Balances' ? '#0284c7' : '#334155', fontWeight: selectedReport === 'Print PL/Accounts Balances' ? 900 : 600, textDecoration: 'underline' }}
                      >
                        Print PL/Accounts Balances
                      </div>
                      <div
                        onClick={() => handleReportClick("Print Student's Trial Balances")}
                        style={{ cursor: 'pointer', color: selectedReport === "Print Student's Trial Balances" ? '#0284c7' : '#334155', fontWeight: selectedReport === "Print Student's Trial Balances" ? 900 : 600, textDecoration: 'underline' }}
                      >
                        Print Student's Trial Balances
                      </div>
                    </div>
                  )}
                </div>

                {/* SUB-NODE: Accounts statements */}
                <div style={{ marginBottom: 4 }}>
                  <div
                    onClick={() => toggleNode('AccountsStatements')}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#0f3a4b', fontWeight: 800 }}
                  >
                    <span>{expandedNodes.AccountsStatements ? '⊟' : '⊞'}</span>
                    <span>Accounts statements</span>
                  </div>
                  {expandedNodes.AccountsStatements && (
                    <div style={{ paddingLeft: 18, borderLeft: '1px dotted #94a3b8', marginLeft: 8, marginTop: 3, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div
                        onClick={() => handleReportClick('Print Internal Account Statement')}
                        style={{ cursor: 'pointer', color: selectedReport === 'Print Internal Account Statement' ? '#0284c7' : '#334155', fontWeight: selectedReport === 'Print Internal Account Statement' ? 900 : 600, textDecoration: 'underline' }}
                      >
                        Print Internal Account Statement
                      </div>
                      <div
                        onClick={() => handleReportClick('Print out student ledger or account statement')}
                        style={{ cursor: 'pointer', color: selectedReport === 'Print out student ledger or account statement' ? '#0284c7' : '#334155', fontWeight: selectedReport === 'Print out student ledger or account statement' ? 900 : 600, textDecoration: 'underline' }}
                      >
                        Print out student ledger or account statement
                      </div>
                    </div>
                  )}
                </div>

                {/* LEAF NODES IN ACCOUNTS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                  <div
                    onClick={() => handleReportClick('Print out Cash Book')}
                    style={{ cursor: 'pointer', color: selectedReport === 'Print out Cash Book' ? '#0284c7' : '#334155', fontWeight: selectedReport === 'Print out Cash Book' ? 900 : 600, textDecoration: 'underline' }}
                  >
                    Print out Cash Book
                  </div>
                  <div
                    onClick={() => handleReportClick('Print all next term student academic bill')}
                    style={{ cursor: 'pointer', color: selectedReport === 'Print all next term student academic bill' ? '#0284c7' : '#334155', fontWeight: selectedReport === 'Print all next term student academic bill' ? 900 : 600, textDecoration: 'underline' }}
                  >
                    Print all next term student academic bill
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* ROOT 2: FINANCIAL STATEMENTS */}
          <div style={{ marginBottom: 6 }}>
            <div
              onClick={() => toggleNode('FinancialStatements')}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#0f3a4b', fontWeight: 800 }}
            >
              <span>{expandedNodes.FinancialStatements ? '⊟' : '⊞'}</span>
              <span>Financial statements</span>
            </div>

            {expandedNodes.FinancialStatements && (
              <div style={{ paddingLeft: 18, borderLeft: '1px dotted #94a3b8', marginLeft: 8, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div
                  onClick={() => handleReportClick('Print statement of financial position [Balance sheet]')}
                  style={{ cursor: 'pointer', color: selectedReport === 'Print statement of financial position [Balance sheet]' ? '#0284c7' : '#334155', fontWeight: selectedReport === 'Print statement of financial position [Balance sheet]' ? 900 : 600, textDecoration: 'underline' }}
                >
                  Print statement of financial position [Balance sheet]
                </div>
                <div
                  onClick={() => handleReportClick('Print Profit & Loss Statement [Comprehensive Income Statement]')}
                  style={{ cursor: 'pointer', color: selectedReport === 'Print Profit & Loss Statement [Comprehensive Income Statement]' ? '#0284c7' : '#334155', fontWeight: selectedReport === 'Print Profit & Loss Statement [Comprehensive Income Statement]' ? 900 : 600, textDecoration: 'underline' }}
                >
                  Print Profit & Loss Statement [Comprehensive Income Statement]
                </div>
              </div>
            )}
          </div>

          {/* ROOT 3: HR PAYROLL REPORTS */}
          <div>
            <div
              onClick={() => toggleNode('HrPayrollReports')}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#0f3a4b', fontWeight: 800 }}
            >
              <span>{expandedNodes.HrPayrollReports ? '⊟' : '⊞'}</span>
              <span>HR Payroll Reports</span>
            </div>

            {expandedNodes.HrPayrollReports && (
              <div style={{ paddingLeft: 18, borderLeft: '1px dotted #94a3b8', marginLeft: 8, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div
                  onClick={() => handleReportClick('Print monthly payroll report')}
                  style={{ cursor: 'pointer', color: selectedReport === 'Print monthly payroll report' ? '#0284c7' : '#334155', fontWeight: selectedReport === 'Print monthly payroll report' ? 900 : 600, textDecoration: 'underline' }}
                >
                  Print monthly payroll report
                </div>
                <div
                  onClick={() => handleReportClick('Print Pay Slips')}
                  style={{ cursor: 'pointer', color: selectedReport === 'Print Pay Slips' ? '#0284c7' : '#334155', fontWeight: selectedReport === 'Print Pay Slips' ? 900 : 600, textDecoration: 'underline' }}
                >
                  Print Pay Slips
                </div>
                <div
                  onClick={() => handleReportClick('Print SSNIT Returns')}
                  style={{ cursor: 'pointer', color: selectedReport === 'Print SSNIT Returns' ? '#0284c7' : '#334155', fontWeight: selectedReport === 'Print SSNIT Returns' ? 900 : 600, textDecoration: 'underline' }}
                >
                  Print SSNIT Returns
                </div>
                <div
                  onClick={() => handleReportClick('Print Staff Lists')}
                  style={{ cursor: 'pointer', color: selectedReport === 'Print Staff Lists' ? '#0284c7' : '#334155', fontWeight: selectedReport === 'Print Staff Lists' ? 900 : 600, textDecoration: 'underline' }}
                >
                  Print Staff Lists
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function SimsAuthenticationHeaderBar() {
  const [simsUser, setSimsUser] = useState('ACCOUNTANT');
  const [simsPass, setSimsPass] = useState('••••••••');
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [activeSessionUser, setActiveSessionUser] = useState('Mrs. Grace Accountant');
  const [bannerMsg, setBannerMsg] = useState('');

  const handleSimsLogin = (e) => {
    if (e) e.preventDefault();
    if (!simsUser.trim()) {
      alert('Please enter SIMS username');
      return;
    }
    setIsLoggedIn(true);
    const formattedUser = simsUser.toUpperCase() === 'ACCOUNTANT' ? 'Mrs. Grace Accountant' : simsUser;
    setActiveSessionUser(formattedUser);
    setBannerMsg(`✅ SIMS Authentication Successful! Active Session loaded for ${formattedUser}.`);
    setTimeout(() => setBannerMsg(''), 3500);
  };

  return (
    <div style={{
      background: '#f1f5f9',
      border: '1px solid #cbd5e1',
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 16,
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      {/* ── TOP BLUE WINDOW BAR matching photo ── */}
      <div style={{
        background: '#0f3a4b',
        color: '#ffffff',
        padding: '8px 14px',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        fontSize: 12,
        fontWeight: 900
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/remalj-carewell-logo.jpg" alt="REMALJ Carewell Logo" style={{ height: 24, width: 'auto', borderRadius: 3, border: '1px solid rgba(255,255,255,0.4)' }} />
          <span style={{ letterSpacing: '0.02em' }}>"SIMS [School Info Management System]"</span>
        </div>
        <div style={{ fontSize: 11, color: '#e0f2fe', fontWeight: 700 }}>
          {isLoggedIn ? `🟢 Active Session: ${activeSessionUser}` : '🔴 SIMS Session Locked'}
        </div>
      </div>

      {/* ── TOP AUTHENTICATION CONTROL ROW matching photo ── */}
      <form onSubmit={handleSimsLogin} style={{
        padding: '10px 14px',
        background: '#e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
        borderBottom: '1px solid #cbd5e1'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 11.5, fontWeight: 800, color: '#0f3a4b' }}>User</label>
          <input
            type="text"
            value={simsUser}
            onChange={(e) => setSimsUser(e.target.value)}
            placeholder="Username..."
            style={{ width: 140, padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 700, color: '#0f3a4b' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 11.5, fontWeight: 800, color: '#0f3a4b' }}>Password</label>
          <input
            type="password"
            value={simsPass}
            onChange={(e) => setSimsPass(e.target.value)}
            placeholder="Password..."
            style={{ width: 140, padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
          />
        </div>

        <button
          type="submit"
          style={{
            padding: '5px 18px',
            background: '#0f3a4b',
            color: '#ffffff',
            border: 'none',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
        >
          Login
        </button>

        <div style={{ fontSize: 11, color: '#475569', fontWeight: 700, marginLeft: 'auto' }}>
          SIMS Terminal ID: <span style={{ color: '#0f3a4b', fontWeight: 900 }}>ACC-TERM-9901</span>
        </div>
      </form>

      {/* BANNER NOTIFICATION */}
      {bannerMsg && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '6px 14px', fontSize: 11.5, fontWeight: 800, borderBottom: '1px solid #bbf7d0' }}>
          {bannerMsg}
        </div>
      )}
    </div>
  );
}

function renderSpecificContent(link, m, setM, students) {
  // Helper to update state field
  const update = (field, val) => setM((prev) => ({ ...prev, [field]: val }));

  // Grade points / Define Grade Point Form (Official SIMS Grade Point Table)
  if (link === 'Grade points' || link === 'Define Grade Point' || link === 'Define Grade Points') {
    return <DefineGradePointsForm setM={setM} />;
  }

  // Score Sheet [Entry] Form
  if (link === 'Score Sheet [Entry]' || link === 'Score Sheet') {
    return <ScoreSheetEntryForm setM={setM} students={students} />;
  }

  // List of Staff Report
  if (link === 'List of Staff' || link === 'Staff List') {
    return <ListOfStaffReportForm setM={setM} />;
  }

  // Creche Terminal Evaluation Form
  if (link === 'Creche Terminal Evaluation' || link.includes('Creche Terminal')) {
    return <CrecheTerminalEvaluationForm setM={setM} students={students} />;
  }

  // View Pending Test Results Form
  if (link === 'View Pending Test Results' || link.includes('Pending Test')) {
    return <ViewPendingTestResultsForm setM={setM} students={students} />;
  }

  // View registered students per class/Sub class per semester Form
  if (link === 'View registered students per class/Sub class per semester' || link.includes('registered students')) {
    return <ViewRegisteredStudentsPerClassForm setM={setM} students={students} />;
  }

  // View Un-Authorised Lists of Creche Progress Reports Form
  if (link === 'View Un-Authorised Lists of Creche Progress Reports' || link.includes('Un-Authorised Lists')) {
    return <ViewUnauthorisedCrecheReportsForm setM={setM} students={students} />;
  }

  // Print Individual terminal report
  if (link === 'Print Individual terminal report') {
    return <PrintIndividualTerminalReportForm setM={setM} students={students} />;
  }

  // Print Individual terminal report by year Group
  if (link === 'Print Individual terminal report by year Group') {
    return <PrintTerminalReportByYearGroupForm setM={setM} students={students} />;
  }

  // Preview Subject Based Assessment Per Subject Per Term
  if (link === 'Preview Subject Based Assessment Per Subject Per Term' || link === 'Print Subject Based Assessments') {
    return <PreviewSubjectBasedAssessmentForm setM={setM} students={students} />;
  }

  // Consolidated Subject Based Assessment
  if (link === 'Consolidated Subject Based Assessment' || link === 'Print Consolidated Subject Based Assessments') {
    return <ConsolidatedSubjectBasedAssessmentForm setM={setM} students={students} />;
  }

  // Prepare Student Academic Bill Form
  if (link === 'Prepare Student academic Bill') {
    return <PrepareStudentAcademicBillForm setM={setM} students={students} />;
  }

  // Receive Payments Form
  if (link === 'Receive Payments from Students') {
    return <ReceivePaymentsForm setM={setM} students={students} />;
  }

  // Receive Other Payments Form
  if (link === 'Issue Other receipts' || link === 'Receive Other Payments') {
    return <ReceiveOtherPaymentsForm setM={setM} />;
  }

  // Batch Processing Form
  if (link === 'Batch Processing') {
    return <BatchProcessingForm setM={setM} students={students} />;
  }

  // Other Accounts Receivables Form
  if (link === 'Create New Accounts/Bills Receivables (Record Entry)' || link === 'Other Accounts Receivables') {
    return <OtherAccountsReceivablesForm setM={setM} students={students} />;
  }

  // Authorise Bills/Accounts Receivables Form
  if (link === 'Authorise Accounts/Bills Receivables' || link === 'Authorise Bills/Accounts Receivables') {
    return <AuthoriseBillsReceivablesForm setM={setM} students={students} />;
  }

  // Reprint Commercial Receipt Form
  if (link === 'Re-print Commercial Receipt' || link === 'Reprint Commercial Receipt') {
    return <ReprintCommercialReceiptForm setM={setM} />;
  }

  // 1. PRINT & REPORT PREVIEWS
  if (link === 'Print Student\'s Progressive Report' || link === 'Print Individual terminal report') {
    return (
      <div>
        <div className="printable-area accountant-printable" style={{ padding: 20, background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #0f3a4b', paddingBottom: 10, marginBottom: 12 }}>
            <img src="/remalj-carewell-logo.jpg" alt="REMALJ Carewell Logo" style={{ height: 44, width: 'auto', borderRadius: 4, marginBottom: 4, display: 'inline-block' }} />
            <h3 style={{ fontSize: 18, color: '#0f3a4b', fontWeight: 900, margin: 0, letterSpacing: '0.02em' }}>REMALJ CAREWELL INSPIRATIONAL SCHOOL</h3>
            <p style={{ fontSize: 12, color: '#4b5563', margin: '2px 0 6px 0', fontWeight: 700 }}>Carewell Inspirational School · Bogoso</p>
            <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0' }}>OFFICIAL STUDENT PROGRESSIVE TERMINAL REPORT</p>
            <small style={{ color: '#9ca3af' }}>Term 1 · Academic Year 2026/2027</small>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12, background: '#f8fafc', padding: 10, borderRadius: 6, border: '1px solid #e2e8f0' }}>
            <div><strong>Student Name:</strong> {m.studentName}</div>
            <div><strong>Student ID:</strong> {m.studentId}</div>
            <div><strong>Class / Level:</strong> {m.level}</div>
            <div><strong>Class Position:</strong> 2nd out of 35</div>
          </div>
          <table className="data-table" style={{ fontSize: 11.5 }}>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Score</th>
                <th>Grade</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Pure Mathematics</td><td>91%</td><td>A</td><td>Excellent numerical skills</td></tr>
              <tr><td>Physics & Science</td><td>86%</td><td>A-</td><td>Very good lab performance</td></tr>
              <tr><td>Literature in English</td><td>88%</td><td>A-</td><td>Articulate & expressive writer</td></tr>
              <tr><td>Social Studies</td><td>84%</td><td>B+</td><td>Good understanding of civic duties</td></tr>
            </tbody>
          </table>
          <div style={{ marginTop: 16, borderTop: '1px dashed #ccc', paddingTop: 12, fontSize: 11 }}>
            <strong>Class Master Comment:</strong> Exemplary conduct and strong academic commitment throughout the term.<br />
            <strong>Headmaster Endorsement:</strong> Promoted with distinction to the next level. [SIGNED & SEALED]
          </div>
        </div>
        <div className="sims-modal-actions no-print">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Close</button>
          <button type="button" className="sims-btn sims-btn-primary" onClick={() => window.print()}>
            <Printer size={14} style={{ display: 'inline', marginRight: 6 }} /> Print Terminal Report
          </button>
        </div>
      </div>
    );
  }

  if (link === 'Print Class Based Progressive Report' || link === 'Print Class terminal report' || link === 'Print Subject Based Assessments' || link === 'Print Consolidated Subject Based Assessments') {
    return (
      <div>
        <div className="printable-area accountant-printable" style={{ padding: 20, background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #881337', paddingBottom: 10, marginBottom: 12 }}>
            <img src="/remalj-carewell-logo.jpg" alt="REMALJ Carewell Logo" style={{ height: 44, width: 'auto', borderRadius: 4, marginBottom: 4, display: 'inline-block' }} />
            <h3 style={{ fontSize: 18, color: '#881337', fontWeight: 900, margin: 0, letterSpacing: '0.02em' }}>REMALJ CAREWELL INSPIRATIONAL SCHOOL</h3>
            <p style={{ fontSize: 12, color: '#4b5563', margin: '2px 0 6px 0', fontWeight: 700 }}>Carewell Inspirational School · Bogoso</p>
            <p style={{ fontSize: 11, color: '#6b7280', margin: '2px 0' }}>CLASS BROADSHEET ASSESSMENT SUMMARY · JHS 2</p>
          </div>
          <table className="data-table" style={{ fontSize: 11 }}>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Total Score</th>
                <th>Average</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>1st</td><td>REMALJ-2026-041</td><td>Abena Mensah</td><td>452 / 500</td><td>90.4%</td><td><span className="status-pill status-pill--success">Passed</span></td></tr>
              <tr><td>2nd</td><td>REMALJ-2026-001</td><td>Benjamin Edwards</td><td>445 / 500</td><td>89.0%</td><td><span className="status-pill status-pill--success">Passed</span></td></tr>
              <tr><td>3rd</td><td>REMALJ-2026-002</td><td>Adwoa Edwards</td><td>410 / 500</td><td>82.0%</td><td><span className="status-pill status-pill--success">Passed</span></td></tr>
              <tr><td>4th</td><td>REMALJ-2026-112</td><td>Kwame Asante</td><td>380 / 500</td><td>76.0%</td><td><span className="status-pill status-pill--success">Passed</span></td></tr>
            </tbody>
          </table>
        </div>
        <div className="sims-modal-actions no-print">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Close</button>
          <button type="button" className="sims-btn sims-btn-primary" onClick={() => window.print()}>
            <Printer size={14} style={{ display: 'inline', marginRight: 6 }} /> Print Class Broadsheet
          </button>
        </div>
      </div>
    );
  }

  if (link === 'Print Creche\' Based Progressive Report') {
    return (
      <div>
        <div className="printable-area accountant-printable" style={{ padding: 20, background: '#ffffff', border: '1px solid #fecaca', borderRadius: 8, fontSize: 12 }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #dc2626', paddingBottom: 10, marginBottom: 12 }}>
            <img src="/remalj-carewell-logo.jpg" alt="REMALJ Carewell Logo" style={{ height: 44, width: 'auto', borderRadius: 4, marginBottom: 4, display: 'inline-block' }} />
            <h3 style={{ fontSize: 16, color: '#dc2626', fontWeight: 800, margin: 0 }}>CRECHE & EARLY YEARS DEVELOPMENTAL REPORT</h3>
            <small style={{ color: '#991b1b' }}>REMALJ Carewell Early Childhood Center</small>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12, background: '#fff5f5', padding: 10, borderRadius: 6 }}>
            <div><strong>Toddler Name:</strong> Baby Kojo Edwards</div>
            <div><strong>Age:</strong> 2 Years 4 Months</div>
            <div><strong>Nursery Stream:</strong> Creche Gold</div>
            <div><strong>Term:</strong> Term 1 · 2026</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11.5 }}>
            <div><strong>Speech & Communication:</strong> ⭐⭐⭐⭐⭐ (Expressing full sentences)</div>
            <div><strong>Motor Skills & Play:</strong> ⭐⭐⭐⭐ (Coordinates puzzle blocks well)</div>
            <div><strong>Socialization & Habits:</strong> ⭐⭐⭐⭐⭐ (Shares toys readily with peers)</div>
            <div><strong>Feeding & Nap Routine:</strong> ⭐⭐⭐⭐ (Independent feeder)</div>
          </div>
        </div>
        <div className="sims-modal-actions no-print">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Close</button>
          <button type="button" className="sims-btn sims-btn-primary" onClick={() => window.print()}>
            <Printer size={14} style={{ display: 'inline', marginRight: 6 }} /> Print Creche Report
          </button>
        </div>
      </div>
    );
  }

  if (link === 'Print Student\'s Academic Bill' || link === 'Print & Post Student\'s Academic Bill' || link === 'Print Individual Student Bill') {
    return <PrintIndividualStudentBillForm setM={setM} students={students} />;
  }

  if (link === 'Print student ledger') {
    return (
      <div>
        <div className="printable-area accountant-printable" style={{ padding: 20, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #0f3a4b', paddingBottom: 10, marginBottom: 12 }}>
            <img src="/remalj-carewell-logo.jpg" alt="REMALJ Carewell Logo" style={{ height: 44, width: 'auto', borderRadius: 4, marginBottom: 4, display: 'inline-block' }} />
            <h3 style={{ fontSize: 16, color: '#0f3a4b', fontWeight: 800, margin: 0 }}>OFFICIAL STUDENT FINANCIAL LEDGER</h3>
            <p style={{ fontSize: 11, color: '#475569' }}>Student Account Ledger History · {m.studentName} ({m.studentId})</p>
          </div>
          <table className="data-table" style={{ fontSize: 11 }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Ref / Receipt #</th>
                <th>Transaction Description</th>
                <th>Debit (GHS)</th>
                <th>Credit (GHS)</th>
                <th>Balance (GHS)</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>01 Sep 2026</td><td>INV-2026-001</td><td>Term 1 Billed Fee</td><td>4,800.00</td><td>-</td><td>4,800.00</td></tr>
              <tr><td>05 Sep 2026</td><td>REC-992812</td><td>MoMo Payment Received</td><td>-</td><td>3,200.00</td><td>1,600.00</td></tr>
              <tr><td>10 Sep 2026</td><td>REC-993410</td><td>Cash Payment at Cashier</td><td>-</td><td>1,600.00</td><td>0.00</td></tr>
            </tbody>
          </table>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20, paddingTop: 12, borderTop: '1px dashed #cbd5e1', fontSize: 10.5 }}>
            <div>
              <div style={{ fontWeight: 800, color: '#0f3a4b', marginBottom: 16 }}>Accounts Officer Signature:</div>
              <div style={{ borderBottom: '1px solid #94a3b8', width: '70%', marginBottom: 2 }} />
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#0f3a4b', marginBottom: 16 }}>Official Audit Seal:</div>
              <div style={{ borderBottom: '1px solid #94a3b8', width: '70%', marginBottom: 2 }} />
            </div>
          </div>
        </div>
        <div className="sims-modal-actions no-print">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Close</button>
          <button type="button" className="sims-btn sims-btn-primary" onClick={() => window.print()}>
            <Printer size={14} style={{ display: 'inline', marginRight: 6 }} /> Print Official Ledger
          </button>
        </div>
      </div>
    );
  }

  // Pay PV Form
  if (link === 'Pay PV' || link === 'Disburse Payment Voucher (PV)') {
    return <PayPVForm setM={setM} />;
  }

  // Print PV Form
  if (link === 'Print Out PV' || link === 'Print PV') {
    return <PrintPVForm setM={setM} />;
  }

  // Employee Profile Form
  if (link === 'Employee Details' || link === "Employee's Profile" || link === 'Employee Profile') {
    return <EmployeeProfileForm setM={setM} />;
  }

  // Monthly Payroll Service Form
  if (link === 'Prepare Payroll' || link === 'Delete Payroll' || link === 'Monthly Payroll Service' || link === 'Monthly Payroll') {
    return <MonthlyPayrollServiceForm setM={setM} />;
  }

  // Trial Balance Accounts Form
  if (link === 'Trial Balance - Accounts' || link === 'Trial Balance' || link === 'Print PL/Accounts Balances' || link === "Print Student's Trial Balances") {
    return <TrialBalanceAccountsForm setM={setM} />;
  }

  // Print Account Statement Form
  if (link === 'Print out student ledger or account statement' || link === 'Student Account Statement' || link === 'Account Statement') {
    return <PrintAccountStatementForm setM={setM} initialMode="student" />;
  }

  if (link === 'Print Account Statement' || link === 'Print Internal Account Statement') {
    return <PrintAccountStatementForm setM={setM} initialMode="general" />;
  }

  // Print all post class students bills
  if (link === 'Print all post class students bills' || link === 'Print all next term student academic bill') {
    return <PrintAllPostClassStudentsBillsForm setM={setM} />;
  }

  // Balance Sheet (Statement of Financial Position)
  if (link === 'Print statement of financial position [Balance sheet]' || link === 'Balance Sheet' || link === 'Statement of Financial Position') {
    return <BalanceSheetForm setM={setM} />;
  }

  // Monthly Payroll Report
  if (link === 'Print monthly payroll report' || link === 'Monthly Payroll Report') {
    return <MonthlyPayrollReportForm setM={setM} />;
  }

  // Employee Payslip
  if (link === 'Print Pay Slips' || link === 'Employee Payslip' || link === 'Pay Slips' || link === 'Pay Slip') {
    return <EmployeePayslipForm setM={setM} />;
  }

  // Accounts & Financial Reports Tree View
  if (link === 'Accounts & Financial Reports' || link === 'Accounts') {
    return <AccountsAndFinancialReportsTree onSelectReport={(r) => setM({ category: 'Accounts & Financial Reports', link: r })} />;
  }

  // Approve PV Form
  if (link === 'Pre Audit Approve Payment Voucher (PV)' || link === 'Approve Payment Voucher (PV)') {
    return <ApprovePVForm setM={setM} />;
  }

  if (link === 'Accounts' || link === 'Financial statements' || link === 'HR Payroll Reports' || link === 'Preview Registers' || link === 'Preview Lists of Parents and their Wards') {
    return (
      <div>
        <div style={{ padding: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #0f3a4b', paddingBottom: 10, marginBottom: 12 }}>
            <h3 style={{ fontSize: 18, color: '#0f3a4b', fontWeight: 900, margin: 0, letterSpacing: '0.02em' }}>REMALJ</h3>
            <p style={{ fontSize: 12, color: '#0284c7', margin: '2px 0 6px 0', fontWeight: 700 }}>Carewell Inspirational School · Bogoso</p>
            <p style={{ fontSize: 11, color: '#0284c7', margin: '2px 0' }}>{link.toUpperCase()} · MASTER DOCUMENT</p>
          </div>
          <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
            Viewing generated master record for <strong>{link}</strong>. All entries, account codes, and figures have been calculated and verified by the Finance & Administration Office.
          </p>
          <table className="data-table" style={{ fontSize: 11 }}>
            <thead>
              <tr>
                <th>Code / ID</th>
                <th>Title / Name</th>
                <th>Category</th>
                <th>Status / Value</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>ACC-101</td><td>Main Revenue Fund</td><td>Financial</td><td>GHS 142,500.00</td></tr>
              <tr><td>ACC-202</td><td>Staff Payroll Allocation</td><td>HR & Payroll</td><td>GHS 38,400.00</td></tr>
              <tr><td>ACC-303</td><td>School Bus & Transport Fund</td><td>Services</td><td>GHS 12,800.00</td></tr>
            </tbody>
          </table>
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Close</button>
          <button type="button" className="sims-btn sims-btn-primary" onClick={() => window.print()}>
            <Printer size={14} style={{ display: 'inline', marginRight: 6 }} /> Print Report Sheet
          </button>
        </div>
      </div>
    );
  }

  // 2. ADMISSIONS & SEMESTER REGISTRATION FORMS
  if (link === 'Add new Admissions') {
    return (
      <div>
        <div className="sims-form-group">
          <label>Applicant Student Full Name</label>
          <input type="text" placeholder="e.g. Kwesi Mensah" value={m.applicantName || ''} onChange={(e) => update('applicantName', e.target.value)} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="sims-form-group">
            <label>Gender</label>
            <select value={m.gender || 'Male'} onChange={(e) => update('gender', e.target.value)}>
              <option>Male</option><option>Female</option>
            </select>
          </div>
          <div className="sims-form-group">
            <label>Applying Level / Class</label>
            <select value={m.level || 'JHS 1'} onChange={(e) => update('level', e.target.value)}>
              <option>Primary 1</option><option>Primary 5</option><option>JHS 1</option><option>JHS 2</option><option>SHS 1</option>
            </select>
          </div>
        </div>
        <div className="sims-form-group">
          <label>Guardian Full Name & Contact</label>
          <input type="text" placeholder="Mr. Kofi Mensah (024 444 5555)" value={m.guardianInfo || ''} onChange={(e) => update('guardianInfo', e.target.value)} required />
        </div>
        <div className="sims-form-group">
          <label>Previous School Attended</label>
          <input type="text" placeholder="e.g. Tarkwa Prep Academy" value={m.prevSchool || ''} onChange={(e) => update('prevSchool', e.target.value)} />
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Submit New Admission Record</button>
        </div>
      </div>
    );
  }

  if (link === 'Edit Existing Admissions') {
    return (
      <div>
        <div className="sims-form-group">
          <label>Select Admission Application Record</label>
          <select value={m.appId || 'ADM-001'} onChange={(e) => update('appId', e.target.value)}>
            <option value="ADM-001">ADM-2026-001 · Akosua Agyeman (JHS 1)</option>
            <option value="ADM-002">ADM-2026-042 · Yaw Osei (Primary 4)</option>
          </select>
        </div>
        <div className="sims-form-group">
          <label>Admission Evaluation Stage</label>
          <select value={m.stage || 'Interview Scheduled'} onChange={(e) => update('stage', e.target.value)}>
            <option>Documents Verification</option>
            <option>Interview Scheduled</option>
            <option>Entrance Exam Passed</option>
            <option>Official Offer Granted</option>
          </select>
        </div>
        <div className="sims-form-group">
          <label>Office Remarks & Evaluation Notes</label>
          <textarea rows="3" placeholder="Candidate passed entrance assessment with 88% average." value={m.notes} onChange={(e) => update('notes', e.target.value)} />
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Update Admission Record</button>
        </div>
      </div>
    );
  }

  if (link === 'Change Student\'s Photo') {
    return (
      <div>
        <div className="sims-form-group">
          <label>Select Student to Update Passport Photo</label>
          <select value={m.studentName} onChange={(e) => update('studentName', e.target.value)}>
            {students.map((s) => <option key={s.id} value={s.fullName}>{s.fullName} ({s.studentId})</option>)}
          </select>
        </div>
        <div className="sims-form-group">
          <label>Upload New Passport Photo File (JPEG/PNG)</label>
          <input type="file" accept="image/*" />
        </div>
        <div style={{ textAlign: 'center', padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px dashed #cbd5e1' }}>
          <span style={{ fontSize: 12, color: '#64748b' }}>📷 Live Camera Capture available on connected workstation</span>
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Upload & Replace Photo</button>
        </div>
      </div>
    );
  }

  if (link === '1st Timers Semester Enrollment' || link === 'Continuing Student Semester Registration') {
    return (
      <div>
        <div className="sims-form-group">
          <label>Select Student for Semester Registration</label>
          <select value={m.studentName} onChange={(e) => update('studentName', e.target.value)}>
            {students.map((s) => <option key={s.id} value={s.fullName}>{s.fullName} ({s.studentId} - {s.level})</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="sims-form-group">
            <label>Assigned Index Number</label>
            <input type="text" value={m.candidateIndex} onChange={(e) => update('candidateIndex', e.target.value)} />
          </div>
          <div className="sims-form-group">
            <label>Academic Year & Term</label>
            <input type="text" value="2026/2027 · Term 1" disabled readOnly />
          </div>
        </div>
        <div className="sims-form-group">
          <label>Fee Clearance Verification</label>
          <div style={{ padding: 10, background: '#dcfce7', borderRadius: 6, color: '#166534', fontWeight: 700, fontSize: 12 }}>
            ✔ Verified: Student has fulfilled 100% fee clearance requirement.
          </div>
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Confirm Semester Registration</button>
        </div>
      </div>
    );
  }

  if (link === 'Delete Semester Registration') {
    return (
      <div>
        <div className="sims-form-group">
          <label>Select Active Registration to Cancel / Delete</label>
          <select value={m.studentName} onChange={(e) => update('studentName', e.target.value)}>
            {students.map((s) => <option key={s.id} value={s.fullName}>{s.fullName} ({s.studentId})</option>)}
          </select>
        </div>
        <div className="sims-form-group">
          <label>Reason for Cancellation</label>
          <select value={m.cancelReason || 'Administrative Error'} onChange={(e) => update('cancelReason', e.target.value)}>
            <option>Administrative Error</option>
            <option>Student Withdrawal</option>
            <option>Academic Deferment</option>
            <option>School Transfer</option>
          </select>
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary" style={{ background: '#dc2626' }}>Delete Registration</button>
        </div>
      </div>
    );
  }

  // PROGRESSIVE REPORTS & EXAMINATIONS REGISTRATION FORMS
  if (link === 'Register New Examination Candidate') {
    return (
      <div>
        <div className="sims-form-group">
          <label>Target Student / Candidate</label>
          <select value={m.studentName} onChange={(e) => update('studentName', e.target.value)}>
            {students.map((s) => <option key={s.id} value={s.fullName}>{s.fullName} ({s.studentId} - {s.level})</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="sims-form-group">
            <label>Candidate Index Number</label>
            <input type="text" value={m.candidateIndex || '0204891002'} onChange={(e) => update('candidateIndex', e.target.value)} required />
          </div>
          <div className="sims-form-group">
            <label>Examination Series / Term</label>
            <select value={m.examSeries || 'BECE Internal Mock / Terminal'} onChange={(e) => update('examSeries', e.target.value)}>
              <option>BECE Internal Mock / Terminal</option>
              <option>WAEC BECE Official Examination</option>
              <option>End of Term Assessment</option>
            </select>
          </div>
        </div>
        <div className="sims-form-group">
          <label>Registration Status & Remarks</label>
          <textarea rows="3" placeholder="Enter registration details or instructions..." value={m.notes} onChange={(e) => update('notes', e.target.value)} />
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Register Candidate</button>
        </div>
      </div>
    );
  }

  if (link === 'Register Student for a Specific Subject Examination') {
    return (
      <div>
        <div className="sims-form-group">
          <label>Target Student / Candidate</label>
          <select value={m.studentName} onChange={(e) => update('studentName', e.target.value)}>
            {students.map((s) => <option key={s.id} value={s.fullName}>{s.fullName} ({s.studentId} - {s.level})</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="sims-form-group">
            <label>Subject Examination Name</label>
            <select value={m.subjectName || 'Pure Mathematics'} onChange={(e) => update('subjectName', e.target.value)}>
              <option>Pure Mathematics</option>
              <option>English Language</option>
              <option>Integrated Science</option>
              <option>Social Studies</option>
              <option>ICT / Computing</option>
              <option>RME</option>
              <option>Ghanaian Language (Fante/Twi)</option>
              <option>French</option>
              <option>Basic Design & Technology (BDT)</option>
            </select>
          </div>
          <div className="sims-form-group">
            <label>Paper Code / Level</label>
            <input type="text" value={m.paperCode || 'PAPER 1 & 2'} onChange={(e) => update('paperCode', e.target.value)} />
          </div>
        </div>
        <div className="sims-form-group">
          <label>Remarks / Instructions</label>
          <textarea rows="3" placeholder="Specify subject exam instructions..." value={m.notes} onChange={(e) => update('notes', e.target.value)} />
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Register Subject Exam</button>
        </div>
      </div>
    );
  }

  if (link === 'Cancel Exams Registration') {
    return (
      <div>
        <div className="sims-form-group">
          <label>Select Registered Candidate to Cancel</label>
          <select value={m.studentName} onChange={(e) => update('studentName', e.target.value)}>
            {students.map((s) => <option key={s.id} value={s.fullName}>{s.fullName} ({s.studentId})</option>)}
          </select>
        </div>
        <div className="sims-form-group">
          <label>Reason for Exams Cancellation</label>
          <select value={m.cancelReason || 'Absenteeism'} onChange={(e) => update('cancelReason', e.target.value)}>
            <option>Absenteeism</option>
            <option>Medical Exemption</option>
            <option>Administrative Withdrawal</option>
            <option>Duplicate Entry</option>
          </select>
        </div>
        <div className="sims-form-group">
          <label>Official Remarks / Cancellation Notes</label>
          <textarea rows="3" placeholder="Reason details..." value={m.notes} onChange={(e) => update('notes', e.target.value)} />
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary" style={{ background: '#dc2626' }}>Cancel Registration</button>
        </div>
      </div>
    );
  }

  // 3. CARD SERVICES FORMS
  if (link.includes('Spending Card') || link.includes('Pickup Card') || link.includes('Re-Encrypt')) {
    return (
      <div>
        <div className="sims-form-group">
          <label>Select Student / Guardian</label>
          <select value={m.studentName} onChange={(e) => update('studentName', e.target.value)}>
            {students.map((s) => <option key={s.id} value={s.fullName}>{s.fullName} ({s.guardianName})</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="sims-form-group">
            <label>Smart Card RFID Chip UID</label>
            <input type="text" value={m.cardId} onChange={(e) => update('cardId', e.target.value)} required />
          </div>
          <div className="sims-form-group">
            <label>Security PIN Code</label>
            <input type="password" value="****" disabled readOnly />
          </div>
        </div>
        <div className="sims-form-group">
          <label>Daily Spending / Transaction Limit (GHS)</label>
          <input type="number" value={m.dailyLimit || '50'} onChange={(e) => update('dailyLimit', e.target.value)} />
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Encode & Issue Smart Card</button>
        </div>
      </div>
    );
  }

  if (link.includes('Bus') || link.includes('Feeding') || link.includes('Dietary')) {
    return (
      <div>
        <div className="sims-form-group">
          <label>Target Student</label>
          <select value={m.studentName} onChange={(e) => update('studentName', e.target.value)}>
            {students.map((s) => <option key={s.id} value={s.fullName}>{s.fullName} ({s.level})</option>)}
          </select>
        </div>
        {link.includes('Bus') && (
          <div className="sims-form-group">
            <label>School Bus Transport Route</label>
            <select value={m.busRoute || 'Route 1: Tarkwa Main Highway'} onChange={(e) => update('busRoute', e.target.value)}>
              <option>Route 1: Tarkwa Main Highway</option>
              <option>Route 2: Prestea - Anikoko Circuit</option>
              <option>Route 3: Bogoso Central</option>
            </select>
          </div>
        )}
        {link.includes('Dietary') && (
          <div className="sims-form-group">
            <label>Medical Allergies & Special Dietary Restrictions</label>
            <textarea rows="3" placeholder="Severe peanut allergy. Requires gluten-free meals." value={m.notes} onChange={(e) => update('notes', e.target.value)} />
          </div>
        )}
        <div className="sims-form-group">
          <label>Term Program Fee (GHS)</label>
          <input type="number" value={link.includes('Bus') ? m.routeFee : m.feedingFee} onChange={(e) => update('fee', e.target.value)} />
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Save Service Profile</button>
        </div>
      </div>
    );
  }

  if (link.includes('Verification') || link.includes('Walker') || link.includes('Drop-Off')) {
    return (
      <div>
        <div style={{ padding: 12, background: '#e0f2fe', borderRadius: 8, marginBottom: 16, fontSize: 12 }}>
          <strong>Gate Security Terminal Verification</strong> · Live Scanner Connected
        </div>
        <div className="sims-form-group">
          <label>Scan RFID Tag / Enter Student ID</label>
          <input type="text" value={m.studentId} onChange={(e) => update('studentId', e.target.value)} required />
        </div>
        <div className="sims-form-group">
          <label>Delegate Ghana Card / National ID Number</label>
          <input type="text" placeholder="GHA-77291048-2" value={m.ghanaCard || ''} onChange={(e) => update('ghanaCard', e.target.value)} />
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Authorize & Approve Verification</button>
        </div>
      </div>
    );
  }

  // 4. USER MANAGEMENT & SETTINGS FORMS
  if (link === 'Create new User Account') {
    return (
      <div>
        <div className="sims-form-group">
          <label>User Full Name</label>
          <input type="text" placeholder="e.g. Mr. Emmanuel Osei" value={m.newUserName || ''} onChange={(e) => update('newUserName', e.target.value)} required />
        </div>
        <div className="sims-form-group">
          <label>Email Address / Username</label>
          <input type="email" placeholder="e.osei@remaljcarewell.edu.gh" value={m.userName} onChange={(e) => update('userName', e.target.value)} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="sims-form-group">
            <label>Assigned System Role</label>
            <select value={m.userRole} onChange={(e) => update('userRole', e.target.value)}>
              <option>Accountant</option><option>Administrator</option><option>Teacher</option><option>Parent</option><option>Student</option>
            </select>
          </div>
          <div className="sims-form-group">
            <label>Initial Temporary Password</label>
            <input type="text" value="Remalj2026!" disabled readOnly />
          </div>
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Create System User</button>
        </div>
      </div>
    );
  }

  if (link === 'Reset User Password' || link === 'User account status') {
    return (
      <div>
        <div className="sims-form-group">
          <label>Target User Account</label>
          <input type="email" value={m.userName} onChange={(e) => update('userName', e.target.value)} required />
        </div>
        {link === 'Reset User Password' ? (
          <div className="sims-form-group">
            <label>New System Generated Password</label>
            <input type="text" value="Pass-998124#" disabled readOnly />
          </div>
        ) : (
          <div className="sims-form-group">
            <label>Account Status</label>
            <select value={m.accStatus || 'Active'} onChange={(e) => update('accStatus', e.target.value)}>
              <option>Active</option><option>Suspended</option><option>Locked</option>
            </select>
          </div>
        )}
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Save Security Changes</button>
        </div>
      </div>
    );
  }

  // ── SYSTEM ADMINISTRATOR: CHARTS OF ACCOUNTS ──
  if (link === 'Define Assets Charts of Accounts') {
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="sims-form-group">
            <label>Asset Account Code</label>
            <input type="text" placeholder="1010-AST" value={m.accountCode || '1010-AST'} onChange={(e) => update('accountCode', e.target.value)} required />
          </div>
          <div className="sims-form-group">
            <label>Asset Category / Class</label>
            <select value={m.assetCategory || 'Current Assets'} onChange={(e) => update('assetCategory', e.target.value)}>
              <option>Current Assets - Cash & Bank</option>
              <option>Fixed Assets - Property & Equipment</option>
              <option>Intangible Assets - Software & Patents</option>
              <option>Investments & Term Deposits</option>
            </select>
          </div>
        </div>
        <div className="sims-form-group">
          <label>Asset Account Name / Title</label>
          <input type="text" placeholder="e.g. Barclays Bank Main Operational Fund" value={m.accountName || 'Barclays Main Operational Account'} onChange={(e) => update('accountName', e.target.value)} required />
        </div>
        <div className="sims-form-group">
          <label>Account Description & Classification Notes</label>
          <textarea rows="2" placeholder="Describe asset account purpose..." value={m.notes} onChange={(e) => update('notes', e.target.value)} />
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Save Asset Account</button>
        </div>
      </div>
    );
  }

  if (link === 'Setup Liabilities Share Holder\'s Charts of Accounts') {
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="sims-form-group">
            <label>Liability / Equity Code</label>
            <input type="text" placeholder="2010-LIA" value={m.accountCode || '2010-LIA'} onChange={(e) => update('accountCode', e.target.value)} required />
          </div>
          <div className="sims-form-group">
            <label>Account Classification</label>
            <select value={m.liabilityCategory || 'Current Liabilities'} onChange={(e) => update('liabilityCategory', e.target.value)}>
              <option>Current Liabilities - Accounts Payable</option>
              <option>Long-Term Debt / Bank Loans</option>
              <option>Shareholder Capital / Equity</option>
              <option>Retained Earnings Reserve</option>
            </select>
          </div>
        </div>
        <div className="sims-form-group">
          <label>Account Title / Name</label>
          <input type="text" placeholder="e.g. Accounts Payable Supplier Fund" value={m.accountName || 'Accounts Payable & Trade Creditors'} onChange={(e) => update('accountName', e.target.value)} required />
        </div>
        <div className="sims-form-group">
          <label>Accounting Notes & Terms</label>
          <textarea rows="2" placeholder="Specify liability parameters..." value={m.notes} onChange={(e) => update('notes', e.target.value)} />
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Save Liability Account</button>
        </div>
      </div>
    );
  }

  if (link === 'Create Profits Loss Charts of Accounts') {
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="sims-form-group">
            <label>P&L Ledger Code</label>
            <input type="text" placeholder="4010-REV" value={m.accountCode || '4010-REV'} onChange={(e) => update('accountCode', e.target.value)} required />
          </div>
          <div className="sims-form-group">
            <label>P&L Classification</label>
            <select value={m.plType || 'Operating Revenue'} onChange={(e) => update('plType', e.target.value)}>
              <option>Operating Revenue (Tuition & Fees)</option>
              <option>Direct Operating Expenses</option>
              <option>Administrative & Overhead Expense</option>
              <option>Other Income / Investment Yield</option>
            </select>
          </div>
        </div>
        <div className="sims-form-group">
          <label>Account Title</label>
          <input type="text" placeholder="e.g. Academic Tuition Income Ledger" value={m.accountName || 'Academic Tuition Income Ledger'} onChange={(e) => update('accountName', e.target.value)} required />
        </div>
        <div className="sims-form-group">
          <label>P&L Description & Notes</label>
          <textarea rows="2" placeholder="Specify revenue/expense details..." value={m.notes} onChange={(e) => update('notes', e.target.value)} />
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Save P&L Ledger</button>
        </div>
      </div>
    );
  }

  // ── SYSTEM ADMINISTRATOR: BILLINGS & OTHERS ──
  if (link === 'Define Bill Items') {
    return (
      <div>
        <div className="sims-form-group">
          <label>Bill Item Title / Description</label>
          <input type="text" placeholder="e.g. ICT Lab & Computer Fee" value={m.billItemName || ''} onChange={(e) => update('billItemName', e.target.value)} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="sims-form-group">
            <label>Default Fee Amount (GHS)</label>
            <input type="number" placeholder="500" value={m.amount || ''} onChange={(e) => update('amount', e.target.value)} required />
          </div>
          <div className="sims-form-group">
            <label>Billing Frequency</label>
            <select value={m.billFrequency || 'Per Term'} onChange={(e) => update('billFrequency', e.target.value)}>
              <option>Per Term</option>
              <option>Per Academic Year</option>
              <option>One-Time Admission Fee</option>
            </select>
          </div>
        </div>
        <div className="sims-form-group">
          <label>Applicable School Section</label>
          <select value={m.applicableSection || 'All Classes'} onChange={(e) => update('applicableSection', e.target.value)}>
            <option>All Classes</option>
            <option>Creche & Early Childhood</option>
            <option>Primary Department (1-6)</option>
            <option>Junior High School (JHS 1-3)</option>
          </select>
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Save Bill Item</button>
        </div>
      </div>
    );
  }

  if (link === 'Adjust Bills on Year Group Accounts') {
    return (
      <div>
        <div className="sims-form-group">
          <label>Target Year Group / Class</label>
          <select value={m.targetYearGroup || 'JHS 1 (2026 Batch)'} onChange={(e) => update('targetYearGroup', e.target.value)}>
            <option>Creche & Nursery</option>
            <option>Primary 1 - 6</option>
            <option>JHS 1 (2026 Batch)</option>
            <option>JHS 2 Batch</option>
            <option>JHS 3 BECE Candidate Batch</option>
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="sims-form-group">
            <label>Adjustment Type</label>
            <select value={m.adjType || 'Bulk Discount / Scholarship'} onChange={(e) => update('adjType', e.target.value)}>
              <option>Bulk Discount / Scholarship</option>
              <option>Add Special Infrastructure Levy</option>
              <option>Waiver Fee Credit</option>
            </select>
          </div>
          <div className="sims-form-group">
            <label>Adjustment Value (GHS)</label>
            <input type="number" placeholder="200" value={m.amount || ''} onChange={(e) => update('amount', e.target.value)} required />
          </div>
        </div>
        <div className="sims-form-group">
          <label>Authorization Reference & Reason</label>
          <textarea rows="2" placeholder="e.g. Board Resolution #2026-04" value={m.notes} onChange={(e) => update('notes', e.target.value)} />
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Apply Year Group Adjustment</button>
        </div>
      </div>
    );
  }

  if (link === 'Cancel Student Bill') {
    return (
      <div>
        <div className="sims-form-group">
          <label>Target Student Account</label>
          <select value={m.studentName} onChange={(e) => update('studentName', e.target.value)}>
            {students.map((s) => <option key={s.id} value={s.fullName}>{s.fullName} ({s.studentId} - {s.level})</option>)}
          </select>
        </div>
        <div className="sims-form-group">
          <label>Bill Invoice Reference to Cancel</label>
          <input type="text" placeholder="INV-2026-0881" value={m.invoiceNo || 'INV-2026-0881'} onChange={(e) => update('invoiceNo', e.target.value)} required />
        </div>
        <div className="sims-form-group">
          <label>Reason for Bill Cancellation</label>
          <select value={m.cancelReason || 'Duplicate Invoice'} onChange={(e) => update('cancelReason', e.target.value)}>
            <option>Duplicate Invoice Issued</option>
            <option>Student Transferred / Withdrawn</option>
            <option>Incorrect Fee Applied</option>
            <option>Full Executive Waiver Granted</option>
          </select>
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary" style={{ background: '#dc2626' }}>Cancel Bill Record</button>
        </div>
      </div>
    );
  }

  if (link === 'Configure Merchants') {
    return (
      <div>
        <div className="sims-form-group">
          <label>Payment Merchant / Gateway Provider</label>
          <select value={m.merchantProvider || 'MTN Mobile Money API'} onChange={(e) => update('merchantProvider', e.target.value)}>
            <option>MTN Mobile Money API</option>
            <option>Telecel Cash API</option>
            <option>Hubtel Unified Payment Gateway</option>
            <option>GCB Bank Direct Merchant API</option>
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="sims-form-group">
            <label>Merchant API Key / ID</label>
            <input type="text" value={m.merchantId || 'MCH-REMALJ-8819'} onChange={(e) => update('merchantId', e.target.value)} required />
          </div>
          <div className="sims-form-group">
            <label>Merchant Account Status</label>
            <select value={m.merchantStatus || 'Active (Live)'} onChange={(e) => update('merchantStatus', e.target.value)}>
              <option>Active (Live)</option>
              <option>Sandbox / Testing</option>
              <option>Disabled</option>
            </select>
          </div>
        </div>
        <div className="sims-form-group">
          <label>Settlement Bank Account Details</label>
          <input type="text" placeholder="GCB Bank Bogoso Branch · 1029384756" value={m.settlementBank || 'GCB Bank Bogoso · 1029384756'} onChange={(e) => update('settlementBank', e.target.value)} />
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Save Merchant Config</button>
        </div>
      </div>
    );
  }

  if (link === 'Manage Clients & Service Providers') {
    return (
      <div>
        <div className="sims-form-group">
          <label>Vendor / Service Provider Name</label>
          <input type="text" placeholder="e.g. Ghana Water Company Ltd" value={m.vendorName || 'Ghana Water Company Ltd'} onChange={(e) => update('vendorName', e.target.value)} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="sims-form-group">
            <label>Service Category</label>
            <select value={m.vendorCategory || 'Utilities'} onChange={(e) => update('vendorCategory', e.target.value)}>
              <option>Utilities & Power</option>
              <option>Food & Catering</option>
              <option>Printing & Publishing</option>
              <option>Security & Transport</option>
              <option>IT & Telecoms</option>
            </select>
          </div>
          <div className="sims-form-group">
            <label>Contact Phone / Email</label>
            <input type="text" placeholder="0244123456" value={m.vendorContact || '0244123456'} onChange={(e) => update('vendorContact', e.target.value)} />
          </div>
        </div>
        <div className="sims-form-group">
          <label>Payment Terms & Contract Notes</label>
          <textarea rows="2" placeholder="Specify vendor payment terms..." value={m.notes} onChange={(e) => update('notes', e.target.value)} />
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Save Provider Record</button>
        </div>
      </div>
    );
  }

  // ── SYSTEM ADMINISTRATOR: HR PAYROLL SETTINGS ──
  if (link === 'Income Tax rate') {
    return (
      <div>
        <div className="sims-form-group">
          <label>GRA Income Tax (PAYE) Band Title</label>
          <input type="text" value={m.taxBand || 'GRA PAYE Tier 1 (First GHS 490 @ 0%)'} onChange={(e) => update('taxBand', e.target.value)} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="sims-form-group">
            <label>Applicable Tax Rate (%)</label>
            <input type="text" value={m.taxRate || '17.5%'} onChange={(e) => update('taxRate', e.target.value)} required />
          </div>
          <div className="sims-form-group">
            <label>Effective Tax Year</label>
            <input type="text" value={m.taxYear || '2026 Fiscal Year'} onChange={(e) => update('taxYear', e.target.value)} />
          </div>
        </div>
        <div className="sims-form-group">
          <label>Statutory Gazette Reference & Notes</label>
          <textarea rows="2" placeholder="e.g. GRA-PAYE-2026-GAZETTE" value={m.notes} onChange={(e) => update('notes', e.target.value)} />
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Save Income Tax Setting</button>
        </div>
      </div>
    );
  }

  if (link === 'SSNIT Settings') {
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="sims-form-group">
            <label>Employer SSNIT Contribution (%)</label>
            <input type="text" value={m.ssnitEmployer || '13.0%'} onChange={(e) => update('ssnitEmployer', e.target.value)} required />
          </div>
          <div className="sims-form-group">
            <label>Employee SSNIT Contribution (%)</label>
            <input type="text" value={m.ssnitEmployee || '5.5%'} onChange={(e) => update('ssnitEmployee', e.target.value)} required />
          </div>
        </div>
        <div className="sims-form-group">
          <label>SSNIT Employer Registration Number</label>
          <input type="text" value={m.ssnitRegNo || 'SSNIT-EMP-991827'} onChange={(e) => update('ssnitRegNo', e.target.value)} required />
        </div>
        <div className="sims-form-group">
          <label>Tier-2 Pension Fund Trustee</label>
          <input type="text" value={m.tier2Scheme || 'Enterprise Tier 2 Master Trust Scheme'} onChange={(e) => update('tier2Scheme', e.target.value)} />
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Save SSNIT Configuration</button>
        </div>
      </div>
    );
  }

  if (link === 'Organisation\'s header') {
    return (
      <div>
        <div className="sims-form-group">
          <label>Official Institution Name</label>
          <input type="text" value={m.orgName || 'REMALJ CAREWELL INSPIRATIONAL SCHOOL'} onChange={(e) => update('orgName', e.target.value)} required />
        </div>
        <div className="sims-form-group">
          <label>School Tagline / Sub-Header</label>
          <input type="text" value={m.orgTagline || 'Carewell Inspirational School · Bogoso'} onChange={(e) => update('orgTagline', e.target.value)} />
        </div>
        <div className="sims-form-group">
          <label>Official Address & Contact Information</label>
          <textarea rows="2" value={m.orgAddress || 'P.O. Box 142, Bogoso, Western Region · Tel: +233 24 123 4567'} onChange={(e) => update('orgAddress', e.target.value)} />
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Update Letterhead Header</button>
        </div>
      </div>
    );
  }

  if (link === 'Close Month') {
    return (
      <div>
        <div className="sims-form-group">
          <label>Select Financial & Payroll Month to Close</label>
          <select value={m.closeMonthVal || 'September 2026'} onChange={(e) => update('closeMonthVal', e.target.value)}>
            <option>September 2026</option>
            <option>August 2026</option>
            <option>July 2026</option>
          </select>
        </div>
        <div className="sims-form-group">
          <label>Audit & Ledger Verification Status</label>
          <div style={{ padding: 10, background: '#e0f2fe', borderRadius: 6, color: '#0369a1', fontSize: 12, fontWeight: 700 }}>
            ℹ All bank deposits, fee postings, and payroll disbursements reconciled.
          </div>
        </div>
        <div className="sims-form-group">
          <label>Authorized Security Signature Key</label>
          <input type="text" placeholder="AUTH-CLOSE-MONTH-2026" value={m.authKey || 'AUTH-CLOSE-MONTH-2026'} onChange={(e) => update('authKey', e.target.value)} required />
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary" style={{ background: '#d97706' }}>Close Financial Month</button>
        </div>
      </div>
    );
  }

  if (link === 'Close Year') {
    return (
      <div>
        <div className="sims-form-group">
          <label>Select Academic & Fiscal Year to Finalize</label>
          <select value={m.closeYearVal || '2025/2026 Academic Year'} onChange={(e) => update('closeYearVal', e.target.value)}>
            <option>2025/2026 Academic Year</option>
            <option>2024/2025 Academic Year</option>
          </select>
        </div>
        <div className="sims-form-group">
          <label>Carry-Forward Arrears & Balances</label>
          <select value={m.carryForward || 'Transfer Student Arrears to New Year'} onChange={(e) => update('carryForward', e.target.value)}>
            <option>Transfer Student Arrears to New Year</option>
            <option>Freeze Past Year Ledgers</option>
          </select>
        </div>
        <div className="sims-form-group">
          <label>CFO Executive Security Authorization Seal</label>
          <input type="text" placeholder="CFO-SEAL-YEAR-2026" value={m.authKey || 'CFO-SEAL-YEAR-2026'} onChange={(e) => update('authKey', e.target.value)} required />
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary" style={{ background: '#dc2626' }}>Close Academic Year</button>
        </div>
      </div>
    );
  }

  // ── SYSTEM ADMINISTRATOR: ACADEMIC SETTINGS ──
  if (link === 'Departments & Sub Units') {
    return (
      <div>
        <div className="sims-form-group">
          <label>Department / Faculty Name</label>
          <input type="text" value={m.deptName || 'Department of Science & Mathematics'} onChange={(e) => update('deptName', e.target.value)} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="sims-form-group">
            <label>Department Code</label>
            <input type="text" value={m.deptCode || 'DEPT-SCI-MATH'} onChange={(e) => update('deptCode', e.target.value)} required />
          </div>
          <div className="sims-form-group">
            <label>Head of Department (HOD)</label>
            <select value={m.hodName || 'Mr. Ebenezer Arthur'} onChange={(e) => update('hodName', e.target.value)}>
              <option>Mr. Ebenezer Arthur</option>
              <option>Mrs. Sarah Mensah</option>
              <option>Dr. K. Appiah</option>
            </select>
          </div>
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Save Department</button>
        </div>
      </div>
    );
  }

  if (link === 'Academic year settings') {
    return (
      <div>
        <div className="sims-form-group">
          <label>Academic Year Session Title</label>
          <input type="text" value={m.yearTitle || '2026 / 2027 Academic Session'} onChange={(e) => update('yearTitle', e.target.value)} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="sims-form-group">
            <label>Session Start Date</label>
            <input type="date" value={m.startDate || '2026-09-01'} onChange={(e) => update('startDate', e.target.value)} required />
          </div>
          <div className="sims-form-group">
            <label>Session End Date</label>
            <input type="date" value={m.endDate || '2027-07-31'} onChange={(e) => update('endDate', e.target.value)} required />
          </div>
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Save Academic Year</button>
        </div>
      </div>
    );
  }

  if (link === 'Semester/term settings') {
    return (
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="sims-form-group">
            <label>Select Term / Semester</label>
            <select value={m.termName || 'Term 1'} onChange={(e) => update('termName', e.target.value)}>
              <option>Term 1</option>
              <option>Term 2</option>
              <option>Term 3</option>
            </select>
          </div>
          <div className="sims-form-group">
            <label>Teaching Duration (Weeks)</label>
            <input type="number" value={m.termWeeks || '14'} onChange={(e) => update('termWeeks', e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="sims-form-group">
            <label>Resumption / Opening Date</label>
            <input type="date" value={m.openDate || '2026-09-15'} onChange={(e) => update('openDate', e.target.value)} />
          </div>
          <div className="sims-form-group">
            <label>Vacation / Closing Date</label>
            <input type="date" value={m.closeDate || '2026-12-18'} onChange={(e) => update('closeDate', e.target.value)} />
          </div>
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Save Term Calendar</button>
        </div>
      </div>
    );
  }

  if (link === 'Class settings' || link === 'Sub class settings') {
    return (
      <div>
        <div className="sims-form-group">
          <label>Class Level / Stream Title</label>
          <input type="text" value={m.className || 'Basic 7 / JHS 1 Gold'} onChange={(e) => update('className', e.target.value)} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="sims-form-group">
            <label>Academic Stage</label>
            <select value={m.acadStage || 'Junior High School'} onChange={(e) => update('acadStage', e.target.value)}>
              <option>Creche & Early Childhood</option>
              <option>Primary Education</option>
              <option>Junior High School</option>
            </select>
          </div>
          <div className="sims-form-group">
            <label>Max Class Capacity</label>
            <input type="number" value={m.capacity || '35'} onChange={(e) => update('capacity', e.target.value)} />
          </div>
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Save Class Setting</button>
        </div>
      </div>
    );
  }

  if (link === 'Class master') {
    return (
      <div>
        <div className="sims-form-group">
          <label>Select Class / Stream</label>
          <select value={m.targetClass || 'JHS 1 Gold'} onChange={(e) => update('targetClass', e.target.value)}>
            <option>JHS 1 Gold</option>
            <option>JHS 2 Diamond</option>
            <option>Primary 5 Gold</option>
            <option>Creche Gold</option>
          </select>
        </div>
        <div className="sims-form-group">
          <label>Assigned Lead Class Master</label>
          <select value={m.classMasterName || 'Mr. Ebenezer Arthur'} onChange={(e) => update('classMasterName', e.target.value)}>
            <option>Mr. Ebenezer Arthur</option>
            <option>Mrs. Angela Edwards</option>
            <option>Mr. Emmanuel Osei</option>
          </select>
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Assign Class Master</button>
        </div>
      </div>
    );
  }

  if (link === 'Subject Lists' || link === 'Subject Instructors') {
    return (
      <div>
        <div className="sims-form-group">
          <label>Subject Title</label>
          <input type="text" value={m.subjectTitle || 'Pure Mathematics'} onChange={(e) => update('subjectTitle', e.target.value)} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="sims-form-group">
            <label>Subject Classification</label>
            <select value={m.subjectCategory || 'Core Subject'} onChange={(e) => update('subjectCategory', e.target.value)}>
              <option>Core Subject</option>
              <option>Elective Subject</option>
              <option>Co-Curricular / Vocational</option>
            </select>
          </div>
          <div className="sims-form-group">
            <label>Assigned Lead Instructor</label>
            <select value={m.instructorName || 'Mr. Ebenezer Arthur'} onChange={(e) => update('instructorName', e.target.value)}>
              <option>Mr. Ebenezer Arthur</option>
              <option>Mrs. Sarah Mensah</option>
              <option>Mr. Kojo Sarpong</option>
            </select>
          </div>
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Save Subject Record</button>
        </div>
      </div>
    );
  }

  if (link === 'Creche Subjects category' || link === 'Creche activities') {
    return (
      <div>
        <div className="sims-form-group">
          <label>Creche Activity / Category Title</label>
          <input type="text" value={m.crecheTitle || 'Language & Phonetics Development'} onChange={(e) => update('crecheTitle', e.target.value)} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="sims-form-group">
            <label>Target Age Group</label>
            <select value={m.crecheAge || 'Toddlers (1-2 Yrs)'} onChange={(e) => update('crecheAge', e.target.value)}>
              <option>Toddlers (1-2 Yrs)</option>
              <option>Creche (2-3 Yrs)</option>
              <option>Nursery (3-4 Yrs)</option>
            </select>
          </div>
          <div className="sims-form-group">
            <label>Milestone Rating Type</label>
            <select value={m.ratingType || '5-Star Milestone Rating'} onChange={(e) => update('ratingType', e.target.value)}>
              <option>5-Star Milestone Rating</option>
              <option>Satisfactory / Developing</option>
            </select>
          </div>
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Save Creche Activity</button>
        </div>
      </div>
    );
  }

  // ── SYSTEM ADMINISTRATOR: TRANSPORT & FEEDING SETTINGS ──
  if (link === 'Route settings') {
    return (
      <div>
        <div className="sims-form-group">
          <label>Transport Route Title</label>
          <input type="text" value={m.busRoute || 'Route 1: Tarkwa Main Highway - Bogoso'} onChange={(e) => update('busRoute', e.target.value)} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="sims-form-group">
            <label>Bus Registration / ID</label>
            <input type="text" value={m.busNo || 'BUS-01 (GR-8891-24)'} onChange={(e) => update('busNo', e.target.value)} />
          </div>
          <div className="sims-form-group">
            <label>Assigned Driver</label>
            <input type="text" value={m.driverName || 'Mr. Kwame Mensah (0244998877)'} onChange={(e) => update('driverName', e.target.value)} />
          </div>
        </div>
        <div className="sims-form-group">
          <label>Term Transport Fee (GHS)</label>
          <input type="number" value={m.routeFee || '600'} onChange={(e) => update('routeFee', e.target.value)} />
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Save Route Settings</button>
        </div>
      </div>
    );
  }

  if (link === 'Configure Feeding Fees') {
    return (
      <div>
        <div className="sims-form-group">
          <label>Meal Package Title</label>
          <input type="text" value={m.mealTitle || 'Standard Daily Lunch & Snack Package'} onChange={(e) => update('mealTitle', e.target.value)} required />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="sims-form-group">
            <label>Daily Meal Fee (GHS)</label>
            <input type="number" value={m.dailyFee || '20'} onChange={(e) => update('dailyFee', e.target.value)} />
          </div>
          <div className="sims-form-group">
            <label>Term Package Fee (GHS)</label>
            <input type="number" value={m.feedingFee || '900'} onChange={(e) => update('feedingFee', e.target.value)} />
          </div>
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Save Feeding Settings</button>
        </div>
      </div>
    );
  }

  // DEFAULT TAILORED FORM FOR ANY OTHER ACTION
  const shouldHideAmountField =
    m?.category === "Student's Progressive Reports" ||
    m?.category === "Student's Progressive Evaluation" ||
    m?.category === "Academic settings" ||
    m?.category === "HR Payroll settings" ||
    m?.category?.toLowerCase().includes('progressive') ||
    m?.category?.toLowerCase().includes('academic setting') ||
    m?.category?.toLowerCase().includes('payroll setting') ||
    link?.toLowerCase().includes('progressive') ||
    link?.toLowerCase().includes('report') ||
    link?.toLowerCase().includes('academic');

  return (
    <div>
      <div className="sims-form-group">
        <label>Target Student / Record</label>
        <select value={m.studentName} onChange={(e) => update('studentName', e.target.value)}>
          {students.map((s) => <option key={s.id} value={s.fullName}>{s.fullName} ({s.studentId} - {s.level})</option>)}
        </select>
      </div>
      {!shouldHideAmountField && (
        <div className="sims-form-group">
          <label>Action Amount / Value (GHS)</label>
          <input type="number" value={m.amount} onChange={(e) => update('amount', e.target.value)} />
        </div>
      )}
      <div className="sims-form-group">
        <label>Official Remarks / Instructions</label>
        <textarea rows="3" placeholder={`Specify details for ${link}...`} value={m.notes} onChange={(e) => update('notes', e.target.value)} />
      </div>
      <div className="sims-modal-actions">
        <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
        <button type="submit" className="sims-btn sims-btn-primary">Execute "{link}"</button>
      </div>
    </div>
  );
}

// ── SCORE SHEET [ENTRY] FORM ──
function ScoreSheetEntryForm({ setM, students }) {
  const [selectedStudent, setSelectedStudent] = useState(students[0] || { fullName: 'NANA ADJOA ASARI SEREBOUR', studentId: '421270' });
  const [cls, setCls] = useState('Basic 1');
  const [year, setYear] = useState('2025/2026');
  const [term, setTerm] = useState('Term 3');
  const [subject, setSubject] = useState('Mathematics');
  const [category, setCategory] = useState('Core');
  const [instructor, setInstructor] = useState('Mr. Ebenezer Arthur');
  const [examDate, setExamDate] = useState('2025-07-16');

  const [arrivalTest, setArrivalTest] = useState(0);
  const [test1, setTest1] = useState(15);
  const [test2, setTest2] = useState(18);
  const [test3, setTest3] = useState(17);
  const [examsScore, setExamsScore] = useState(84);
  const [applyGrade, setApplyGrade] = useState(true);

  const totalTest = Number(arrivalTest) + Number(test1) + Number(test2) + Number(test3);
  const test50 = Math.min(50, Math.round((totalTest / 60) * 50));
  const exams50 = Math.min(50, Math.round((Number(examsScore) / 100) * 50));
  const totalScore = test50 + exams50;

  const getGrade = (score) => {
    if (score >= 80) return { grade: '1', remarks: 'Highly Proficient' };
    if (score >= 75) return { grade: '2', remarks: 'Proficient' };
    if (score >= 65) return { grade: '3', remarks: 'Approaching Proficiency' };
    if (score >= 60) return { grade: '4', remarks: 'Developing' };
    if (score >= 55) return { grade: '5', remarks: 'Emerging' };
    if (score >= 50) return { grade: '6', remarks: 'Average' };
    if (score >= 40) return { grade: '7', remarks: 'Pass' };
    if (score >= 36) return { grade: '8', remarks: 'Weak' };
    return { grade: '9', remarks: 'Fail' };
  };
  const { grade, remarks } = getGrade(totalScore);

  return (
    <div style={{ background: '#f0f4f8', padding: 16, borderRadius: 6, fontSize: 12, boxSizing: 'border-box', overflowX: 'hidden', width: '100%' }}>
      <div style={{ background: '#38bdf8', color: '#0f172a', padding: '8px 14px', borderRadius: '4px 4px 0 0', fontWeight: 900, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Score Sheet [Entry]</span>
        <span>REMALJ Carewell Inspirational School</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr', gap: 16, background: '#fff', border: '1px solid #cbd5e1', padding: 16, borderRadius: '0 0 4px 4px', boxSizing: 'border-box' }}>
        <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: 14 }}>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Class</label>
            <select value={cls} onChange={(e) => setCls(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }}>
              <option>Creche</option><option>Nursery 1</option><option>Nursery 2</option><option>KG 1</option><option>KG 2</option><option>Basic 1</option><option>Basic 2</option><option>Basic 3</option><option>Basic 4</option><option>Basic 5</option><option>Basic 6</option><option>JHS 1</option><option>JHS 2</option><option>JHS 3</option>
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Academic year</label>
            <input type="text" value={year} onChange={(e) => setYear(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Academic term</label>
            <select value={term} onChange={(e) => setTerm(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }}>
              <option>Term 1</option><option>Term 2</option><option>Term 3</option>
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Subject title</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }}>
              <option>Mathematics</option><option>English Language</option><option>Integrated Science</option><option>Social Studies</option><option>RME</option><option>ICT / Computing</option><option>Creative Arts</option><option>OWOP</option>
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Category</label>
            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Instructor</label>
            <input type="text" value={instructor} onChange={(e) => setInstructor(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }} />
          </div>

          {/* Student Photo Preview Box */}
          <div style={{ width: 110, height: 120, margin: '10px auto', border: '1px dashed #94a3b8', background: '#f8fafc', borderRadius: 6, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {selectedStudent.photo || selectedStudent.passportPhoto ? (
              <img src={selectedStudent.photo || selectedStudent.passportPhoto} alt={selectedStudent.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ textAlign: 'center', color: '#64748b', fontSize: 10, padding: 4 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#cbd5e1', margin: '0 auto 4px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👤</div>
                <span>Student Photo</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '110px 90px 2.2fr 1.3fr', gap: 10, marginBottom: 16, alignItems: 'flex-start' }}>
            <div>
              <label style={{ fontSize: 10.5, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 2 }}>Enrollment ID</label>
              <input type="text" value={selectedStudent.studentId || 'ENR-4212'} readOnly style={{ width: '100%', padding: '5px 8px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, fontWeight: 700, fontSize: 11.5 }} />
            </div>
            <div>
              <label style={{ fontSize: 10.5, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 2 }}>Index N/o.</label>
              <input type="text" value="IX-104" readOnly style={{ width: '100%', padding: '5px 8px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, fontSize: 11.5 }} />
            </div>
            <div>
              <label style={{ fontSize: 10.5, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 2, whiteSpace: 'nowrap' }}>Student's Name</label>
              <select value={selectedStudent.fullName} onChange={(e) => {
                const s = students.find(x => x.fullName === e.target.value);
                if (s) setSelectedStudent(s);
              }} style={{ width: '100%', minWidth: 220, padding: '5px 8px', border: '1px solid #0f3a4b', borderRadius: 4, fontWeight: 800, fontSize: 12, background: '#ffffff', color: '#0f3a4b' }}>
                {students.map(s => <option key={s.id} value={s.fullName}>{s.fullName} ({s.studentId})</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10.5, fontWeight: 800, color: '#475569', display: 'block', marginBottom: 2, whiteSpace: 'nowrap' }}>Date Exams taken</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                style={{ width: '100%', padding: '4px 6px', border: '1px solid #0f3a4b', borderRadius: 4, fontWeight: 700, fontSize: 12, background: '#ffffff', cursor: 'pointer' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 6 }}>
              <div style={{ fontWeight: 800, fontSize: 11, color: '#0f3a4b', marginBottom: 8, borderBottom: '1px solid #cbd5e1', paddingBottom: 4 }}>Class test</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11 }}>Arrival test:</span>
                <input type="number" value={arrivalTest} onChange={(e) => setArrivalTest(e.target.value)} style={{ width: 80, padding: 3, border: '1px solid #cbd5e1', borderRadius: 4, textAlign: 'right' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11 }}>Class test 1:</span>
                <input type="number" value={test1} onChange={(e) => setTest1(e.target.value)} style={{ width: 80, padding: 3, border: '1px solid #cbd5e1', borderRadius: 4, textAlign: 'right' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11 }}>Class test 2:</span>
                <input type="number" value={test2} onChange={(e) => setTest2(e.target.value)} style={{ width: 80, padding: 3, border: '1px solid #cbd5e1', borderRadius: 4, textAlign: 'right' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11 }}>Class test 3:</span>
                <input type="number" value={test3} onChange={(e) => setTest3(e.target.value)} style={{ width: 80, padding: 3, border: '1px solid #cbd5e1', borderRadius: 4, textAlign: 'right' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontWeight: 700, background: '#fef3c7', padding: '4px 6px', borderRadius: 4 }}>
                <span style={{ fontSize: 11 }}>Total Class test:</span>
                <span>{totalTest}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, background: '#fed7aa', padding: '4px 6px', borderRadius: 4 }}>
                <span style={{ fontSize: 11 }}>Class test converted to 50%:</span>
                <span>{test50}</span>
              </div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 6 }}>
              <div style={{ fontWeight: 800, fontSize: 11, color: '#0f3a4b', marginBottom: 8, borderBottom: '1px solid #cbd5e1', paddingBottom: 4 }}>Exams score</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11 }}>Exams score (100):</span>
                <input type="number" value={examsScore} onChange={(e) => setExamsScore(e.target.value)} style={{ width: 80, padding: 4, border: '1px solid #cbd5e1', borderRadius: 4, textAlign: 'right', fontWeight: 700 }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, background: '#fed7aa', padding: '6px 8px', borderRadius: 4, marginBottom: 12 }}>
                <span style={{ fontSize: 11 }}>Exams score converted to 50%:</span>
                <span>{exams50}</span>
              </div>

              <div style={{ fontWeight: 800, fontSize: 11, color: '#0f3a4b', marginBottom: 4 }}>Scores summary</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 900, background: '#fed7aa', padding: '8px 10px', borderRadius: 4, fontSize: 13, color: '#9a3412' }}>
                <span>Total score (100%):</span>
                <span>{totalScore} / 100</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 14, background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 6 }}>
            <div style={{ fontWeight: 800, fontSize: 11, color: '#0f3a4b', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Grading</span>
              <label style={{ fontSize: 11, fontWeight: 600, marginLeft: 10 }}>
                <input type="checkbox" checked={applyGrade} onChange={(e) => setApplyGrade(e.target.checked)} /> Apply grade marks?
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 160px', gap: 12, alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700 }}>Grade</label>
                <input type="text" value={applyGrade ? grade : ''} readOnly style={{ width: '100%', padding: 6, background: '#fed7aa', border: '1px solid #fdba74', borderRadius: 4, fontWeight: 800 }} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700 }}>Remarks</label>
                <input type="text" value={applyGrade ? remarks : ''} readOnly style={{ width: '100%', padding: 6, background: '#fed7aa', border: '1px solid #fdba74', borderRadius: 4, fontWeight: 800 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button type="submit" style={{ padding: '6px 12px', background: '#e0e7ff', border: '1px solid #6366f1', borderRadius: 4, fontWeight: 800, color: '#3730a3', cursor: 'pointer' }}>
                  + Submit scores
                </button>
                <button type="button" onClick={() => alert('Test Roll Viewer Opened.')} style={{ padding: '6px 12px', background: '#e0e7ff', border: '1px solid #6366f1', borderRadius: 4, fontWeight: 800, color: '#3730a3', cursor: 'pointer' }}>
                  View Test Roll
                </button>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => {
              const idx = students.findIndex(s => s.fullName === selectedStudent.fullName);
              if (idx < students.length - 1) setSelectedStudent(students[idx + 1]);
            }} style={{ padding: '10px 24px', background: '#e2e8f0', border: '1px solid #94a3b8', borderRadius: 4, fontWeight: 900, fontSize: 13, cursor: 'pointer' }}>
              Next &gt;&gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── LIST OF STAFF REPORT FORM ──
function ListOfStaffReportForm({ setM }) {
  const [branch, setBranch] = useState('Bogoso Main Campus');

  const staffList = [
    { staffNo: 'RCIST001', name: 'JOSEPH ASAMOAH ARTHUR', accountNo: '5591920008558411', ssnit: 'B018911010075' },
    { staffNo: 'RCIST002', name: 'GRACE ENNIN', accountNo: '5591920008559922', ssnit: 'B018911010086' },
    { staffNo: 'RCIST003', name: 'KWEKU MENSAH', accountNo: '5591920008561133', ssnit: 'B018911010097' },
    { staffNo: 'RCIST004', name: 'EUNICE ADOM', accountNo: '5591920008562244', ssnit: 'B018911010108' }
  ];

  return (
    <div style={{ background: '#64748b', padding: 12, borderRadius: 6 }}>
      <div style={{ background: '#38bdf8', color: '#0f172a', padding: '6px 12px', borderRadius: '4px 4px 0 0', fontWeight: 900, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>List of Staff</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" onClick={() => window.print()} style={{ padding: '2px 8px', background: '#0f3a4b', color: '#fff', border: 'none', borderRadius: 3, fontSize: 11, cursor: 'pointer' }}>🖨️ Print</button>
        </div>
      </div>

      <div style={{ background: '#e2e8f0', padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
          <span style={{ fontWeight: 700 }}>Preview By Branch:</span>
          <select value={branch} onChange={(e) => setBranch(e.target.value)} style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid #94a3b8' }}>
            <option>Bogoso Main Campus</option>
            <option>Anikoko Branch</option>
          </select>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, background: '#fff', padding: '2px 8px', borderRadius: 3 }}>
          Main Report
        </div>
      </div>

      <div style={{ background: '#fff', margin: '12px auto', padding: 24, borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxWidth: 720, minHeight: 440, border: '1px solid #cbd5e1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <img src="/remalj-carewell-logo.jpg" alt="Bank / School Logo" style={{ height: 60, width: 'auto', borderRadius: 6 }} />
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0 }}>AMENFIMAN RURAL BANK LTD. / REMALJ CAREWELL</h2>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0284c7', margin: '2px 0 0 0' }}>All Staff List</h3>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 11, color: '#64748b', textAlign: 'right' }}>
            Date: 9/5/2026
          </div>
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 12 }}>
          Total No. of staff: {staffList.length}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #000', textAlign: 'left' }}>
              <th style={{ padding: '6px 4px' }}>Staff No.</th>
              <th style={{ padding: '6px 4px' }}>Name</th>
              <th style={{ padding: '6px 4px' }}>Account No.</th>
              <th style={{ padding: '6px 4px' }}>SSNIT</th>
            </tr>
          </thead>
          <tbody>
            {staffList.map((st) => (
              <tr key={st.staffNo} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '8px 4px', fontFamily: 'monospace', fontWeight: 700 }}>{st.staffNo}</td>
                <td style={{ padding: '8px 4px', fontWeight: 600 }}>{st.name}</td>
                <td style={{ padding: '8px 4px', fontFamily: 'monospace' }}>{st.accountNo}</td>
                <td style={{ padding: '8px 4px', fontFamily: 'monospace' }}>{st.ssnit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ background: '#cbd5e1', padding: '4px 12px', fontSize: 10.5, display: 'flex', justifyContent: 'space-between', color: '#334155', fontWeight: 600, borderRadius: '0 0 4px 4px' }}>
        <span>Current Page No: 1</span>
        <span>Total Page No: 1</span>
        <span>Zoom Factor: 100%</span>
      </div>
    </div>
  );
}

// ── CRECHE TERMINAL EVALUATION FORM ──
function CrecheTerminalEvaluationForm({ setM, students }) {
  const [selectedStudent, setSelectedStudent] = useState(students[0] || { fullName: 'KWAME ADOM ASANTE', studentId: 'CR-8841' });
  const [year, setYear] = useState('2025/2026');
  const [term, setTerm] = useState('Term 3');
  const [category, setCategory] = useState('Early Childhood Developmental Milestones');
  const [description, setDescription] = useState('Social, Emotional & Motor Skills Evaluation');
  const [activity, setActivity] = useState('Daily Nursery & Creche Behavioral Assessment');

  const activities = [
    "I use words please, thank you and excuse me",
    "I accept and respond to my teacher's authority",
    "I have a good self-image",
    "I am happy and cheerful at school",
    "I play and share with other children",
    "I get involved in and attend to activities",
    "I can follow direction",
    "I respond well to teacher's suggestions",
    "I use books correctly",
    "I am a curious child",
    "I ask questions",
    "I can play with logos",
    "I can arrange broad stairs",
    "I can use scissors",
    "I can arrange pink tower",
    "I can arrange knobbed cylinders",
    "I can alternate feet on stairs",
    "I can gallop",
    "I can balance on right foot",
    "I can hop on one foot",
    "I can hop on two feet",
    "I can throw a ball forward",
    "I can kick a ball forward"
  ];

  const [checkedState, setCheckedState] = useState(activities.reduce((acc, curr) => ({ ...acc, [curr]: true }), {}));

  const toggleActivity = (act) => {
    setCheckedState(prev => ({ ...prev, [act]: !prev[act] }));
  };

  return (
    <div style={{ background: '#f0f4f8', padding: 16, borderRadius: 6, fontSize: 12 }}>
      <div style={{ background: '#38bdf8', color: '#0f172a', padding: '6px 12px', borderRadius: '4px 4px 0 0', fontWeight: 900, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
        <span>Creche Terminal Evaluation</span>
        <span>REMALJ Carewell Early Childhood Department</span>
      </div>

      <div style={{ background: '#fff', border: '1px solid #cbd5e1', padding: 16, borderRadius: '0 0 4px 4px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '120px 120px 140px 1fr', gap: 10, marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700 }}>Academic year</label>
            <input type="text" value={year} onChange={(e) => setYear(e.target.value)} style={{ width: '100%', padding: 4, border: '1px solid #cbd5e1', borderRadius: 4 }} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700 }}>Academic term</label>
            <select value={term} onChange={(e) => setTerm(e.target.value)} style={{ width: '100%', padding: 4, border: '1px solid #cbd5e1', borderRadius: 4 }}>
              <option>Term 1</option><option>Term 2</option><option>Term 3</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700 }}>Enrollment/SID:</label>
            <input type="text" value={selectedStudent.studentId || 'CR-8841'} readOnly style={{ width: '100%', padding: 4, border: '1px solid #cbd5e1', borderRadius: 4, background: '#f1f5f9', fontWeight: 700 }} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700 }}>Search by Learner's name</label>
            <select value={selectedStudent.fullName} onChange={(e) => {
              const s = students.find(x => x.fullName === e.target.value);
              if (s) setSelectedStudent(s);
            }} style={{ width: '100%', padding: 4, border: '1px solid #cbd5e1', borderRadius: 4, fontWeight: 700 }}>
              {students.map(s => <option key={s.id} value={s.fullName}>{s.fullName}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16 }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 6, textAlign: 'center' }}>
            <div style={{ width: 110, height: 120, margin: '0 auto 12px auto', border: '1px solid #94a3b8', background: '#cbd5e1', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 55, height: 55, borderRadius: '50%', background: '#475569' }} />
            </div>

            <span style={{ display: 'inline-block', background: '#0284c7', color: '#fff', padding: '3px 12px', borderRadius: 12, fontSize: 11, fontWeight: 800, marginBottom: 12 }}>
              Creche Stream
            </span>

            <button type="button" onClick={() => {
              const idx = students.findIndex(s => s.fullName === selectedStudent.fullName);
              if (idx < students.length - 1) setSelectedStudent(students[idx + 1]);
            }} style={{ width: '100%', padding: '10px 12px', background: '#e2e8f0', border: '1px solid #94a3b8', borderRadius: 4, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
              Next Person &gt;&gt;
            </button>
          </div>

          <div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 10, fontWeight: 700 }}>Select Subject category</label>
              <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: 4, border: '1px solid #cbd5e1', borderRadius: 4 }} />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 10, fontWeight: 700 }}>Description of subject category</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%', padding: 4, border: '1px solid #cbd5e1', borderRadius: 4 }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 10, fontWeight: 700 }}>Activity</label>
              <input type="text" value={activity} onChange={(e) => setActivity(e.target.value)} style={{ width: '100%', padding: 4, border: '1px solid #cbd5e1', borderRadius: 4 }} />
            </div>

            <div style={{ border: '1px solid #cbd5e1', borderRadius: 4, maxHeight: 300, overflowY: 'auto' }}>
              <div style={{ background: '#f1f5f9', padding: '6px 10px', fontWeight: 800, fontSize: 11, borderBottom: '1px solid #cbd5e1', color: '#0f3a4b' }}>
                Description of Activity Evaluation Checklist
              </div>
              {activities.map((act, i) => (
                <div key={i} onClick={() => toggleActivity(act)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                  borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                  background: checkedState[act] ? '#e0f2fe' : '#ffffff'
                }}>
                  <input type="checkbox" checked={!!checkedState[act]} onChange={() => {}} />
                  <span style={{ fontSize: 11, fontWeight: checkedState[act] ? 700 : 400, color: '#0f172a' }}>{act}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" style={{ padding: '8px 20px', background: '#0f3a4b', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 800, cursor: 'pointer' }}>
                Save Creche Evaluation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── VIEW PENDING TEST RESULTS FORM ──
function ViewPendingTestResultsForm({ setM, students }) {
  const [cls, setCls] = useState('Basic 1');
  const [year, setYear] = useState('2025/2026');
  const [term, setTerm] = useState('Term 3');
  const [subject, setSubject] = useState('Mathematics');
  const [category, setCategory] = useState('Core');
  const [instructor, setInstructor] = useState('Mr. Ebenezer Arthur');
  const [action, setAction] = useState('Approve All');

  const [pendingList, setPendingList] = useState([
    { id: '1', studentId: '421270', name: 'NANA ADJOA ASARI SEREBOUR', class: 'Basic 1', subject: 'Mathematics', score: 88, status: 'Pending Approval' },
    { id: '2', studentId: '421271', name: 'KWAME ADOM ASANTE', class: 'Basic 1', subject: 'Mathematics', score: 92, status: 'Pending Approval' },
    { id: '3', studentId: '421272', name: 'ABENA MANSAH', class: 'Basic 1', subject: 'Mathematics', score: 78, status: 'Pending Approval' }
  ]);

  const handleActionAll = () => {
    setPendingList(prev => prev.map(p => ({ ...p, status: 'Approved' })));
    alert('All pending test results approved and published to student ledgers.');
  };

  return (
    <div style={{ background: '#f0f4f8', padding: 16, borderRadius: 6, fontSize: 12 }}>
      <div style={{ background: '#38bdf8', color: '#0f172a', padding: '6px 12px', borderRadius: '4px 4px 0 0', fontWeight: 900, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
        <span>View Pending Test Results</span>
        <span>SIMS v2025 Examination Audit Module</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, background: '#fff', border: '1px solid #cbd5e1', padding: 16, borderRadius: '0 0 4px 4px' }}>
        <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: 14 }}>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Class</label>
            <select value={cls} onChange={(e) => setCls(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }}>
              <option>Basic 1</option><option>Basic 2</option><option>Basic 3</option><option>JHS 1</option><option>JHS 2</option>
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Academic year</label>
            <input type="text" value={year} onChange={(e) => setYear(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Academic term</label>
            <select value={term} onChange={(e) => setTerm(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }}>
              <option>Term 1</option><option>Term 2</option><option>Term 3</option>
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Subject title</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }}>
              <option>Mathematics</option><option>English Language</option><option>Integrated Science</option>
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Category</label>
            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Instructor</label>
            <input type="text" value={instructor} onChange={(e) => setInstructor(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }} />
          </div>

          <button type="button" onClick={() => alert('Pending list refreshed.')} style={{ width: '100%', padding: '8px', background: '#e2e8f0', border: '1px solid #94a3b8', borderRadius: 4, fontWeight: 800, cursor: 'pointer' }}>
            Refresh
          </button>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700 }}>Action:</span>
            <select value={action} onChange={(e) => setAction(e.target.value)} style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #cbd5e1' }}>
              <option>Approve All</option>
              <option>Reject All</option>
            </select>
            <button type="button" onClick={handleActionAll} style={{ padding: '6px 16px', background: '#e0e7ff', border: '1px solid #6366f1', borderRadius: 4, fontWeight: 800, color: '#3730a3', cursor: 'pointer' }}>
              Action all
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, border: '1px solid #cbd5e1' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px' }}>Student ID</th>
                <th style={{ padding: '6px 8px' }}>Student Name</th>
                <th style={{ padding: '6px 8px' }}>Class</th>
                <th style={{ padding: '6px 8px' }}>Subject</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Score (%)</th>
                <th style={{ padding: '6px 8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {pendingList.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700 }}>{item.studentId}</td>
                  <td style={{ padding: '6px 8px', fontWeight: 600 }}>{item.name}</td>
                  <td style={{ padding: '6px 8px' }}>{item.class}</td>
                  <td style={{ padding: '6px 8px' }}>{item.subject}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800, color: '#0369a1' }}>{item.score}%</td>
                  <td style={{ padding: '6px 8px' }}>
                    <span style={{ background: item.status === 'Approved' ? '#dcfce7' : '#fef3c7', color: item.status === 'Approved' ? '#166534' : '#92400e', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 800 }}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── VIEW REGISTERED STUDENTS PER CLASS/SUB CLASS PER SEMESTER FORM ──
function ViewRegisteredStudentsPerClassForm({ setM, students }) {
  const [dept, setDept] = useState('Primary Department');
  const [cls, setCls] = useState('Basic 1');
  const [subClass, setSubClass] = useState('Stream A - Gold');
  const [year, setYear] = useState('2025/2026');
  const [term, setTerm] = useState('Term 3');
  const [classMaster, setClassMaster] = useState('Mrs. Grace Ennin / Mr. Ebenezer Arthur');

  const filteredStudents = (students || []).filter(s => s.level.includes('Basic') || s.level.includes('Primary') || true);

  return (
    <div style={{ background: '#f0f4f8', padding: 16, borderRadius: 6, fontSize: 12 }}>
      <div style={{ background: '#38bdf8', color: '#0f172a', padding: '6px 12px', borderRadius: '4px 4px 0 0', fontWeight: 900, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
        <span>View registered students per class/Sub class per semester</span>
        <span>REMALJ Carewell SIMS Module</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, background: '#fff', border: '1px solid #cbd5e1', padding: 16, borderRadius: '0 0 4px 4px' }}>
        <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: 14 }}>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 2 }}>Name of Department/Sub units</label>
            <select value={dept} onChange={(e) => setDept(e.target.value)} style={{ width: '100%', padding: 5, borderRadius: 4, border: '1px solid #cbd5e1', background: '#fef2f2' }}>
              <option>Primary Department</option>
              <option>JHS Unit</option>
              <option>Creche & Early Years</option>
            </select>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 2 }}>Class</label>
            <select value={cls} onChange={(e) => setCls(e.target.value)} style={{ width: '100%', padding: 5, borderRadius: 4, border: '1px solid #cbd5e1', background: '#fef2f2' }}>
              <option>Basic 1</option><option>Basic 2</option><option>Basic 3</option><option>Basic 4</option><option>Basic 5</option><option>Basic 6</option><option>JHS 1</option><option>JHS 2</option>
            </select>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 2 }}>Sub class</label>
            <select value={subClass} onChange={(e) => setSubClass(e.target.value)} style={{ width: '100%', padding: 5, borderRadius: 4, border: '1px solid #cbd5e1', background: '#fef2f2' }}>
              <option>Stream A - Gold</option>
              <option>Stream B - Blue</option>
              <option>General Sub class</option>
            </select>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 2 }}>Year</label>
            <select value={year} onChange={(e) => setYear(e.target.value)} style={{ width: '100%', padding: 5, borderRadius: 4, border: '1px solid #cbd5e1', background: '#fef2f2' }}>
              <option>2025/2026</option>
              <option>2026/2027</option>
            </select>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 2 }}>Semester/Term</label>
            <select value={term} onChange={(e) => setTerm(e.target.value)} style={{ width: '100%', padding: 5, borderRadius: 4, border: '1px solid #cbd5e1', background: '#fef2f2' }}>
              <option>Term 1</option><option>Term 2</option><option>Term 3</option>
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 2 }}>Class master</label>
            <textarea rows="2" value={classMaster} onChange={(e) => setClassMaster(e.target.value)} style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: 11 }} />
          </div>

          <button type="button" onClick={() => alert('Class List Refreshed.')} style={{ width: '100%', padding: '9px', background: '#d8b4fe', border: '1px solid #c084fc', color: '#581c87', borderRadius: 4, fontWeight: 800, cursor: 'pointer' }}>
            Refresh Class Lists
          </button>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#0f3a4b' }}>
              Registered Students Roster · {cls} ({subClass}) — {term} ({year})
            </div>
            <button type="button" onClick={() => window.print()} style={{ padding: '4px 12px', background: '#0f3a4b', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>
              🖨️ Print Class Roster
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, border: '1px solid #cbd5e1' }}>
            <thead>
              <tr style={{ background: '#0f3a4b', color: '#fff', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px' }}>SID / Reg No.</th>
                <th style={{ padding: '6px 8px' }}>Student Name</th>
                <th style={{ padding: '6px 8px' }}>Class / Stream</th>
                <th style={{ padding: '6px 8px' }}>Department</th>
                <th style={{ padding: '6px 8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s, idx) => (
                <tr key={s.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700, color: '#0369a1' }}>{s.studentId}</td>
                  <td style={{ padding: '6px 8px', fontWeight: 700 }}>{s.fullName}</td>
                  <td style={{ padding: '6px 8px' }}>{cls} ({subClass})</td>
                  <td style={{ padding: '6px 8px' }}>{dept}</td>
                  <td style={{ padding: '6px 8px' }}>
                    <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 800 }}>
                      Enrolled
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── VIEW UN-AUTHORISED LISTS OF CRECHE PROGRESS REPORTS FORM ──
function ViewUnauthorisedCrecheReportsForm({ setM, students }) {
  const [dept, setDept] = useState('Creche & Early Years Unit');
  const [cls, setCls] = useState('Creche Gold');
  const [subClass, setSubClass] = useState('Stream A');
  const [year, setYear] = useState('2025/2026');
  const [term, setTerm] = useState('Term 3');
  const [classMaster, setClassMaster] = useState('Mrs. Mercy Creche Master');

  const [unauthorisedList, setUnauthorisedList] = useState([
    { id: '1', sid: 'CR-8841', name: 'KWAME ADOM ASANTE', class: 'Creche Gold', teacher: 'Mrs. Mercy Master', dateSubmitted: '2026-09-08', status: 'Pending Authorisation' },
    { id: '2', sid: 'CR-8842', name: 'AMA SERWAH', class: 'Creche Gold', teacher: 'Mrs. Mercy Master', dateSubmitted: '2026-09-08', status: 'Pending Authorisation' },
    { id: '3', sid: 'CR-8843', name: 'KOFI OWUSU', class: 'Creche Gold', teacher: 'Mrs. Mercy Master', dateSubmitted: '2026-09-09', status: 'Pending Authorisation' }
  ]);

  const handleAuthoriseAll = () => {
    setUnauthorisedList(prev => prev.map(item => ({ ...item, status: 'Authorised & Approved' })));
    alert('All Creche Progress Reports have been authorised and approved!');
  };

  return (
    <div style={{ background: '#f0f4f8', padding: 16, borderRadius: 6, fontSize: 12 }}>
      <div style={{ background: '#38bdf8', color: '#0f172a', padding: '6px 12px', borderRadius: '4px 4px 0 0', fontWeight: 900, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
        <span>View Un-Authorised Lists of Creche Progress Reports</span>
        <span>SIMS Early Years Audit Module</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, background: '#fff', border: '1px solid #cbd5e1', padding: 16, borderRadius: '0 0 4px 4px' }}>
        <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: 14 }}>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 2 }}>Name of Department/Sub units</label>
            <select value={dept} onChange={(e) => setDept(e.target.value)} style={{ width: '100%', padding: 5, borderRadius: 4, border: '1px solid #cbd5e1', background: '#fef2f2' }}>
              <option>Creche & Early Years Unit</option>
            </select>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 2 }}>Class</label>
            <select value={cls} onChange={(e) => setCls(e.target.value)} style={{ width: '100%', padding: 5, borderRadius: 4, border: '1px solid #cbd5e1', background: '#fef2f2' }}>
              <option>Creche Gold</option>
              <option>Nursery 1</option>
              <option>Nursery 2</option>
              <option>KG 1</option>
            </select>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 2 }}>Sub class</label>
            <select value={subClass} onChange={(e) => setSubClass(e.target.value)} style={{ width: '100%', padding: 5, borderRadius: 4, border: '1px solid #cbd5e1', background: '#fef2f2' }}>
              <option>Stream A</option>
              <option>Stream B</option>
            </select>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 2 }}>Year</label>
            <select value={year} onChange={(e) => setYear(e.target.value)} style={{ width: '100%', padding: 5, borderRadius: 4, border: '1px solid #cbd5e1', background: '#fef2f2' }}>
              <option>2025/2026</option>
              <option>2026/2027</option>
            </select>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 2 }}>Semester/Term</label>
            <select value={term} onChange={(e) => setTerm(e.target.value)} style={{ width: '100%', padding: 5, borderRadius: 4, border: '1px solid #cbd5e1', background: '#fef2f2' }}>
              <option>Term 1</option><option>Term 2</option><option>Term 3</option>
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 2 }}>Class master</label>
            <textarea rows="2" value={classMaster} onChange={(e) => setClassMaster(e.target.value)} style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #cbd5e1', background: '#f1f5f9', fontSize: 11 }} />
          </div>

          <button type="button" onClick={() => alert('Un-Authorised List Refreshed.')} style={{ width: '100%', padding: '9px', background: '#d8b4fe', border: '1px solid #c084fc', color: '#581c87', borderRadius: 4, fontWeight: 800, cursor: 'pointer' }}>
            Refresh
          </button>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6 }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#0f3a4b' }}>
              Un-Authorised Creche Reports Audit List ({unauthorisedList.length} records)
            </div>
            <button type="button" onClick={handleAuthoriseAll} style={{ padding: '6px 16px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}>
              ✓ Authorise All Reports
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, border: '1px solid #cbd5e1' }}>
            <thead>
              <tr style={{ background: '#0f3a4b', color: '#fff', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px' }}>SID</th>
                <th style={{ padding: '6px 8px' }}>Learner Name</th>
                <th style={{ padding: '6px 8px' }}>Class</th>
                <th style={{ padding: '6px 8px' }}>Teacher / Master</th>
                <th style={{ padding: '6px 8px' }}>Date Submitted</th>
                <th style={{ padding: '6px 8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {unauthorisedList.map((item, idx) => (
                <tr key={item.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700, color: '#0369a1' }}>{item.sid}</td>
                  <td style={{ padding: '6px 8px', fontWeight: 700 }}>{item.name}</td>
                  <td style={{ padding: '6px 8px' }}>{item.class}</td>
                  <td style={{ padding: '6px 8px' }}>{item.teacher}</td>
                  <td style={{ padding: '6px 8px' }}>{item.dateSubmitted}</td>
                  <td style={{ padding: '6px 8px' }}>
                    <span style={{ background: item.status === 'Authorised & Approved' ? '#dcfce7' : '#fef3c7', color: item.status === 'Authorised & Approved' ? '#166534' : '#92400e', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 800 }}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── PRINT INDIVIDUAL TERMINAL REPORT FORM ──
function PrintIndividualTerminalReportForm({ setM, students }) {
  const [dept, setDept] = useState('Primary Department');
  const [cls, setCls] = useState('Basic 1');
  const [subClass, setSubClass] = useState('Stream A - Gold');
  const [year, setYear] = useState('2025/2026');
  const [term, setTerm] = useState('Term 3');
  const [selectedStudent, setSelectedStudent] = useState(students[0] || { fullName: 'NANA ADJOA ASARI SEREBOUR', studentId: '421270' });
  const [isCreche, setIsCreche] = useState(false);

  return (
    <div style={{ background: '#f0f4f8', padding: 16, borderRadius: 6, fontSize: 12 }}>
      <div style={{ background: '#38bdf8', color: '#0f172a', padding: '6px 12px', borderRadius: '4px 4px 0 0', fontWeight: 900, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
        <span>Print Individual terminal report</span>
        <span>REMALJ Carewell SIMS Assessment Engine</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, background: '#fff', border: '1px solid #cbd5e1', padding: 16, borderRadius: '0 0 4px 4px' }}>
        <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 10, borderBottom: '1px solid #cbd5e1', paddingBottom: 4 }}>
            Current Academic Period
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 700 }}>Name of Department/Sub units</label>
            <select value={dept} onChange={(e) => setDept(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1', background: '#fef2f2' }}>
              <option>Primary Department</option><option>JHS Unit</option><option>Creche & Early Years</option>
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 700 }}>Select Class</label>
            <select value={cls} onChange={(e) => setCls(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1', background: '#fef2f2' }}>
              <option>Basic 1</option><option>Basic 2</option><option>Basic 3</option><option>JHS 1</option><option>JHS 2</option>
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 700 }}>Select Sub class</label>
            <select value={subClass} onChange={(e) => setSubClass(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1', background: '#fef2f2' }}>
              <option>Stream A - Gold</option><option>Stream B - Blue</option>
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 700 }}>Select Year</label>
            <select value={year} onChange={(e) => setYear(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1', background: '#fef2f2' }}>
              <option>2025/2026</option><option>2026/2027</option>
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 700 }}>Select Semester/Term</label>
            <select value={term} onChange={(e) => setTerm(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1', background: '#fef2f2' }}>
              <option>Term 1</option><option>Term 2</option><option>Term 3</option>
            </select>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 700 }}>Student ID</label>
            <div style={{ display: 'flex', gap: 4 }}>
              <input type="text" value={selectedStudent.studentId || '421270'} readOnly style={{ width: '100%', padding: 4, border: '1px solid #cbd5e1', borderRadius: 4, background: '#fef2f2', fontWeight: 700 }} />
              <button type="button" onClick={() => alert('Student Lookup Table Opened.')} style={{ padding: '2px 8px', background: '#e2e8f0', border: '1px solid #94a3b8', borderRadius: 4, fontWeight: 800 }}>...</button>
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 700 }}>Student's Name</label>
            <select value={selectedStudent.fullName} onChange={(e) => {
              const s = students.find(x => x.fullName === e.target.value);
              if (s) setSelectedStudent(s);
            }} style={{ width: '100%', padding: 6, border: '1px solid #fdba74', borderRadius: 4, background: '#ffedd5', fontWeight: 800, color: '#9a3412' }}>
              {students.map(s => <option key={s.id} value={s.fullName}>{s.fullName}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10, fontWeight: 700 }}>Index N/o.</label>
            <input type="text" value="IX-104" readOnly style={{ width: '100%', padding: 6, border: '1px solid #fdba74', borderRadius: 4, background: '#ffedd5', fontWeight: 800 }} />
          </div>

          <button type="button" onClick={() => alert('Terminal Report Loaded.')} style={{ width: '100%', padding: '8px', background: '#d8b4fe', border: '1px solid #c084fc', color: '#581c87', borderRadius: 4, fontWeight: 800, cursor: 'pointer', marginBottom: 12 }}>
            Preview
          </button>

          <div style={{ width: 110, height: 120, margin: '0 auto 10px auto', border: '1px solid #94a3b8', background: '#cbd5e1', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 55, height: 55, borderRadius: '50%', background: '#475569' }} />
          </div>

          <label style={{ fontSize: 10.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={isCreche} onChange={(e) => setIsCreche(e.target.checked)} /> Preview Creche Report
          </label>
        </div>

        <div style={{ background: '#fff', padding: 24, border: '1px solid #cbd5e1', borderRadius: 4 }}>
          <div style={{ borderBottom: '2px solid #0f3a4b', paddingBottom: 12, marginBottom: 16 }} className="receipt-header-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }} className="receipt-header-inline">
              <img src="/remalj-carewell-logo.jpg" alt="Logo" style={{ height: 52, width: 'auto', borderRadius: 6, flexShrink: 0 }} className="receipt-logo" />
              <div style={{ textAlign: 'left' }} className="receipt-school-text">
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f3a4b', lineHeight: 1.2 }}>REMALJ CAREWELL INSPIRATIONAL SCHOOL</h2>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0284c7', marginTop: 2 }}>OFFICIAL STUDENT INDIVIDUAL TERMINAL REPORT · {term} ({year})</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, background: '#f8fafc', padding: 10, borderRadius: 4, border: '1px solid #e2e8f0', fontSize: 11, marginBottom: 14 }}>
            <div><strong>Student Name:</strong> {selectedStudent.fullName}</div>
            <div><strong>Student ID:</strong> {selectedStudent.studentId}</div>
            <div><strong>Class / Stream:</strong> {cls} ({subClass})</div>
            <div><strong>Class Position:</strong> 1st out of 34</div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 14 }}>
            <thead>
              <tr style={{ background: '#0f3a4b', color: '#fff', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px' }}>Subject</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Class Score (50%)</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Exams Score (50%)</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Total (100%)</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>Grade</th>
                <th style={{ padding: '6px 8px' }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {[
                { sub: 'Mathematics', class: 48, exams: 45, total: 93, grade: 'A1', rem: 'Excellent' },
                { sub: 'English Language', class: 44, exams: 42, total: 86, grade: 'A1', rem: 'Excellent' },
                { sub: 'Integrated Science', class: 45, exams: 43, total: 88, grade: 'A1', rem: 'Very Good' },
                { sub: 'Social Studies', class: 42, exams: 40, total: 82, grade: 'A1', rem: 'Very Good' }
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 8px', fontWeight: 700 }}>{row.sub}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>{row.class}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>{row.exams}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800, color: '#0369a1' }}>{row.total}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 800 }}>{row.grade}</td>
                  <td style={{ padding: '6px 8px' }}>{row.rem}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => window.print()} style={{ padding: '8px 20px', background: '#0f3a4b', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 800, cursor: 'pointer' }}>
              🖨️ Print Terminal Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PRINT INDIVIDUAL TERMINAL REPORT BY YEAR GROUP FORM ──
function PrintTerminalReportByYearGroupForm({ setM, students }) {
  const [dept, setDept] = useState('Primary Department');
  const [cls, setCls] = useState('Basic 1');
  const [subClass, setSubClass] = useState('Stream A - Gold');
  const [year, setYear] = useState('2025/2026');
  const [term, setTerm] = useState('Term 3');
  const [isCreche, setIsCreche] = useState(false);

  return (
    <div style={{ background: '#f0f4f8', padding: 16, borderRadius: 6, fontSize: 12 }}>
      <div style={{ background: '#38bdf8', color: '#0f172a', padding: '6px 12px', borderRadius: '4px 4px 0 0', fontWeight: 900, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
        <span>Print Individual terminal report by year Group</span>
        <span>REMALJ Carewell SIMS Batch Reports</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, background: '#fff', border: '1px solid #cbd5e1', padding: 16, borderRadius: '0 0 4px 4px' }}>
        <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 10, borderBottom: '1px solid #cbd5e1', paddingBottom: 4 }}>
            Current Academic Period
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 700 }}>Name of Department/Sub units</label>
            <select value={dept} onChange={(e) => setDept(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1', background: '#fef2f2' }}>
              <option>Primary Department</option><option>JHS Unit</option><option>Creche & Early Years</option>
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 700 }}>Select Class</label>
            <select value={cls} onChange={(e) => setCls(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1', background: '#fef2f2' }}>
              <option>Basic 1</option><option>Basic 2</option><option>Basic 3</option><option>JHS 1</option><option>JHS 2</option>
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 700 }}>Select Sub class</label>
            <select value={subClass} onChange={(e) => setSubClass(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1', background: '#fef2f2' }}>
              <option>Stream A - Gold</option><option>Stream B - Blue</option>
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 700 }}>Select Year</label>
            <select value={year} onChange={(e) => setYear(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1', background: '#fef2f2' }}>
              <option>2025/2026</option><option>2026/2027</option>
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10, fontWeight: 700 }}>Select Semester/Term</label>
            <select value={term} onChange={(e) => setTerm(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1', background: '#fef2f2' }}>
              <option>Term 1</option><option>Term 2</option><option>Term 3</option>
            </select>
          </div>

          <button type="button" onClick={() => alert('Batch Year Group Terminal Reports Generated.')} style={{ width: '100%', padding: '8px', background: '#d8b4fe', border: '1px solid #c084fc', color: '#581c87', borderRadius: 4, fontWeight: 800, cursor: 'pointer', marginBottom: 14 }}>
            Preview
          </button>

          <label style={{ fontSize: 10.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={isCreche} onChange={(e) => setIsCreche(e.target.checked)} /> Preview Creche Reports
          </label>
        </div>

        <div style={{ background: '#fff', padding: 24, border: '1px solid #cbd5e1', borderRadius: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '2px solid #0f3a4b', paddingBottom: 10 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f3a4b' }}>Year Group Terminal Reports · {cls} ({subClass})</h3>
              <p style={{ margin: '2px 0 0 0', fontSize: 11, color: '#0284c7', fontWeight: 700 }}>Academic Year: {year} — Term: {term}</p>
            </div>
            <button type="button" onClick={() => window.print()} style={{ padding: '8px 18px', background: '#0f3a4b', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 800, cursor: 'pointer' }}>
              🖨️ Batch Print All Reports
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: '#0f3a4b', color: '#fff', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px' }}>Student ID</th>
                <th style={{ padding: '6px 8px' }}>Student Name</th>
                <th style={{ padding: '6px 8px' }}>Class</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Total Score</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>Position</th>
                <th style={{ padding: '6px 8px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700 }}>{s.studentId}</td>
                  <td style={{ padding: '6px 8px', fontWeight: 700 }}>{s.fullName}</td>
                  <td style={{ padding: '6px 8px' }}>{cls}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800, color: '#0369a1' }}>{85 + (idx % 10)}%</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 800 }}>{idx + 1}th</td>
                  <td style={{ padding: '6px 8px' }}>
                    <button type="button" onClick={() => alert(`Printing report for ${s.fullName}...`)} style={{ padding: '2px 8px', background: '#e0f2fe', border: '1px solid #0284c7', borderRadius: 3, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>
                      Print
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── PREVIEW SUBJECT BASED ASSESSMENT PER SUBJECT PER TERM FORM ──
function PreviewSubjectBasedAssessmentForm({ setM, students }) {
  const [cls, setCls] = useState('Basic 1');
  const [year, setYear] = useState('2025/2026');
  const [term, setTerm] = useState('Term 3');
  const [subject, setSubject] = useState('Mathematics');
  const [category, setCategory] = useState('Core');
  const [instructor, setInstructor] = useState('Mr. Ebenezer Arthur');

  return (
    <div style={{ background: '#f0f4f8', padding: 16, borderRadius: 6, fontSize: 12 }}>
      <div style={{ background: '#38bdf8', color: '#0f172a', padding: '6px 12px', borderRadius: '4px 4px 0 0', fontWeight: 900, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
        <span>Preview Subject Based Assessment Per Subject Per Term</span>
        <span>REMALJ Carewell Subject Analytics</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, background: '#fff', border: '1px solid #cbd5e1', padding: 16, borderRadius: '0 0 4px 4px' }}>
        <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 10, borderBottom: '1px solid #cbd5e1', paddingBottom: 4 }}>
            Current Academic Period
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 700 }}>Class</label>
            <select value={cls} onChange={(e) => setCls(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }}>
              <option>Basic 1</option><option>Basic 2</option><option>Basic 3</option><option>JHS 1</option>
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 700 }}>Academic year</label>
            <input type="text" value={year} onChange={(e) => setYear(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }} />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 700 }}>Academic term</label>
            <select value={term} onChange={(e) => setTerm(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }}>
              <option>Term 1</option><option>Term 2</option><option>Term 3</option>
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 700 }}>Subject title</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }}>
              <option>Mathematics</option><option>English Language</option><option>Integrated Science</option>
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 700 }}>Category</label>
            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10, fontWeight: 700 }}>Instructor</label>
            <input type="text" value={instructor} onChange={(e) => setInstructor(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1' }} />
          </div>

          <button type="button" onClick={() => alert('Subject Assessment Previewed.')} style={{ width: '100%', padding: '8px', background: '#d8b4fe', border: '1px solid #c084fc', color: '#581c87', borderRadius: 4, fontWeight: 800, cursor: 'pointer' }}>
            Preview
          </button>
        </div>

        <div style={{ background: '#fff', padding: 24, border: '1px solid #cbd5e1', borderRadius: 4 }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #0f3a4b', paddingBottom: 12, marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f3a4b' }}>REMALJ CAREWELL INSPIRATIONAL SCHOOL</h2>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#0284c7', marginTop: 2 }}>
              Subject Based Assessment Sheet · {subject} ({cls}) — {term} ({year})
            </div>
            <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>Instructor: {instructor}</div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 16 }}>
            <thead>
              <tr style={{ background: '#0f3a4b', color: '#fff', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px' }}>SID</th>
                <th style={{ padding: '6px 8px' }}>Student Name</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Class Test (50)</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Exams (50)</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Total (100)</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>Grade</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700 }}>{s.studentId}</td>
                  <td style={{ padding: '6px 8px', fontWeight: 700 }}>{s.fullName}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>{42 + (idx % 8)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>{40 + (idx % 9)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800, color: '#0369a1' }}>{82 + (idx % 15)}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 800 }}>A1</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── CONSOLIDATED SUBJECT BASED ASSESSMENT FORM ──
function ConsolidatedSubjectBasedAssessmentForm({ setM, students }) {
  const [dept, setDept] = useState('Primary Department');
  const [cls, setCls] = useState('Basic 1');
  const [year, setYear] = useState('2025/2026');
  const [term, setTerm] = useState('Term 3');

  return (
    <div style={{ background: '#f0f4f8', padding: 16, borderRadius: 6, fontSize: 12 }}>
      <div style={{ background: '#38bdf8', color: '#0f172a', padding: '6px 12px', borderRadius: '4px 4px 0 0', fontWeight: 900, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
        <span>Consolidated Subject Based Assessment</span>
        <span>REMALJ Carewell Master Class Matrix</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, background: '#fff', border: '1px solid #cbd5e1', padding: 16, borderRadius: '0 0 4px 4px' }}>
        <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 10, borderBottom: '1px solid #cbd5e1', paddingBottom: 4 }}>
            Current Academic Period
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 700 }}>Name of Department/Sub units</label>
            <select value={dept} onChange={(e) => setDept(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1', background: '#fef2f2' }}>
              <option>Primary Department</option><option>JHS Unit</option><option>Creche & Early Years</option>
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 700 }}>Select Class</label>
            <select value={cls} onChange={(e) => setCls(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1', background: '#fef2f2' }}>
              <option>Basic 1</option><option>Basic 2</option><option>Basic 3</option><option>JHS 1</option>
            </select>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 700 }}>Select Year</label>
            <select value={year} onChange={(e) => setYear(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1', background: '#fef2f2' }}>
              <option>2025/2026</option><option>2026/2027</option>
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10, fontWeight: 700 }}>Select Semester/Term</label>
            <select value={term} onChange={(e) => setTerm(e.target.value)} style={{ width: '100%', padding: 4, borderRadius: 4, border: '1px solid #cbd5e1', background: '#fef2f2' }}>
              <option>Term 1</option><option>Term 2</option><option>Term 3</option>
            </select>
          </div>

          <button type="button" onClick={() => alert('Consolidated Sheet Generated.')} style={{ width: '100%', padding: '8px', background: '#d8b4fe', border: '1px solid #c084fc', color: '#581c87', borderRadius: 4, fontWeight: 800, cursor: 'pointer' }}>
            Preview
          </button>
        </div>

        <div style={{ background: '#fff', padding: 24, border: '1px solid #cbd5e1', borderRadius: 4 }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #0f3a4b', paddingBottom: 12, marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f3a4b' }}>REMALJ CAREWELL INSPIRATIONAL SCHOOL</h2>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#b91c1c', marginTop: 2 }}>
              CONSOLIDATED SUBJECT BASED ASSESSMENT SHEET · {cls} — {term} ({year})
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5 }}>
            <thead>
              <tr style={{ background: '#0f3a4b', color: '#fff', textAlign: 'left' }}>
                <th style={{ padding: '6px 6px' }}>SID</th>
                <th style={{ padding: '6px 6px' }}>Student Name</th>
                <th style={{ padding: '6px 6px', textAlign: 'right' }}>MATH</th>
                <th style={{ padding: '6px 6px', textAlign: 'right' }}>ENG</th>
                <th style={{ padding: '6px 6px', textAlign: 'right' }}>SCI</th>
                <th style={{ padding: '6px 6px', textAlign: 'right' }}>SOC</th>
                <th style={{ padding: '6px 6px', textAlign: 'right' }}>GRAND TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '6px 6px', fontFamily: 'monospace', fontWeight: 700 }}>{s.studentId}</td>
                  <td style={{ padding: '6px 6px', fontWeight: 700 }}>{s.fullName}</td>
                  <td style={{ padding: '6px 6px', textAlign: 'right' }}>92</td>
                  <td style={{ padding: '6px 6px', textAlign: 'right' }}>86</td>
                  <td style={{ padding: '6px 6px', textAlign: 'right' }}>88</td>
                  <td style={{ padding: '6px 6px', textAlign: 'right' }}>84</td>
                  <td style={{ padding: '6px 6px', textAlign: 'right', fontWeight: 900, color: '#0369a1' }}>350</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── REDESIGNED SIMS AUTH & ENTERPRISE COMMAND TERMINAL ──
function SimsAuthTerminalView({ onOpenSimsModal }) {
  const [simsRole, setSimsRole] = useState('Accountant / Finance Officer');
  const [simsUser, setSimsUser] = useState('ACCOUNTANT');
  const [simsPass, setSimsPass] = useState('••••••••');
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [activeSessionUser, setActiveSessionUser] = useState('Mrs. Grace Accountant');
  const [notice, setNotice] = useState('');
  const [selectedHub, setSelectedHub] = useState('Finance & Administration');

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    if (!simsUser.trim()) {
      alert('Please enter SIMS username');
      return;
    }
    setIsAuthenticated(true);
    const userDisplay = simsUser.toUpperCase() === 'ACCOUNTANT' ? 'Mrs. Grace Accountant' : simsUser;
    setActiveSessionUser(userDisplay);
    setNotice(`✅ SIMS Session Authenticated! Full command access granted for ${userDisplay} (${simsRole}).`);
    setTimeout(() => setNotice(''), 4000);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setNotice('🔒 SIMS Terminal Locked. Please re-authenticate to access enterprise features.');
    setTimeout(() => setNotice(''), 4000);
  };

  return (
    <div className="animate-fade-up" style={{ background: '#0f172a', borderRadius: 16, padding: 24, color: '#f8fafc', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '1px solid #1e293b' }}>
      {/* Top Header Card */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: 20, marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src="/remalj-carewell-logo.jpg" alt="REMALJ Carewell Logo" style={{ height: 64, width: 'auto', borderRadius: 8, border: '2px solid #38bdf8', boxShadow: '0 0 15px rgba(56,189,248,0.3)' }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              SIMS ENTERPRISE AUTHENTICATION TERMINAL
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#ffffff', margin: '2px 0 0 0', letterSpacing: '0.02em' }}>
              REMALJ CAREWELL INSPIRATIONAL SCHOOL
            </h2>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
              Secure Multi-Factor Authorization & Command Hub · Build v2025.4
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div style={{
            background: isAuthenticated ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${isAuthenticated ? '#22c55e' : '#ef4444'}`,
            color: isAuthenticated ? '#4ade80' : '#f87171',
            padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 800,
            display: 'inline-flex', alignItems: 'center', gap: 8
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: isAuthenticated ? '#22c55e' : '#ef4444', boxShadow: `0 0 10px ${isAuthenticated ? '#22c55e' : '#ef4444'}` }} />
            {isAuthenticated ? `🟢 Authenticated: ${activeSessionUser}` : '🔴 SIMS Session Locked'}
          </div>

          <div style={{ fontSize: 10.5, color: '#64748b', fontFamily: 'monospace' }}>
            TOKEN: SIMS-AUTH-2025-9984-SECURE
          </div>
        </div>
      </div>

      {notice && (
        <div style={{ padding: '12px 18px', background: isAuthenticated ? '#064e3b' : '#7f1d1d', border: `1px solid ${isAuthenticated ? '#059669' : '#dc2626'}`, color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 700, marginBottom: 20 }}>
          {notice}
        </div>
      )}

      {/* Authentication Login Terminal Card */}
      <form onSubmit={handleLogin} style={{ background: '#1e293b', padding: 20, borderRadius: 12, border: '1px solid #334155', marginBottom: 24 }}>
        <div style={{ fontWeight: 800, fontSize: 13, color: '#38bdf8', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🔐</span> SIMS Credentials & Security Authorization
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 160px', gap: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: 4 }}>Role Designation</label>
            <select value={simsRole} onChange={(e) => setSimsRole(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #475569', background: '#0f172a', color: '#fff', fontSize: 12, fontWeight: 700 }}>
              <option>Accountant / Finance Officer</option>
              <option>Headmaster / Pre-Auditor</option>
              <option>SIMS Administrator</option>
              <option>Teacher / Class Master</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: 4 }}>Username / SID</label>
            <input type="text" value={simsUser} onChange={(e) => setSimsUser(e.target.value)} placeholder="Username..." style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #475569', background: '#0f172a', color: '#fff', fontSize: 12, fontWeight: 700 }} />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: 4 }}>Security Password / PIN</label>
            <input type="password" value={simsPass} onChange={(e) => setSimsPass(e.target.value)} placeholder="Password..." style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #475569', background: '#0f172a', color: '#fff', fontSize: 12 }} />
          </div>

          <div>
            {isAuthenticated ? (
              <button type="button" onClick={handleLogout} style={{ width: '100%', padding: '9px 14px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 800, fontSize: 12, cursor: 'pointer', boxShadow: '0 4px 12px rgba(220,38,38,0.3)' }}>
                🔒 Lock Session
              </button>
            ) : (
              <button type="submit" style={{ width: '100%', padding: '9px 14px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 800, fontSize: 12, cursor: 'pointer', boxShadow: '0 4px 12px rgba(2,132,199,0.3)' }}>
                🔓 Authenticate
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Authenticated Command Center Section */}
      {isAuthenticated ? (
        <div>
          <div style={{ fontSize: 14, fontWeight: 900, color: '#38bdf8', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚡</span> Authenticated Quick Action Launcher & PV Approvals
          </div>

          {/* Quick Launch Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14, marginBottom: 28 }}>
            {[
              { label: 'Approve Payment Voucher (PV)', category: 'Back office Internal Accounts', badge: 'PV Audit', color: '#ef4444', desc: 'Pre-audit, review and authorize payment vouchers.' },
              { label: 'Pay PV', category: 'Back office Internal Accounts', badge: 'Disburse', color: '#f59e0b', desc: 'Disburse funds for approved payment vouchers.' },
              { label: 'Score Sheet [Entry]', category: 'Student\'s Progressive Evaluation', badge: 'Exams', color: '#3b82f6', desc: 'Record class tests, exams scores, and calculate grades.' },
              { label: 'List of Staff', category: 'HR & Payroll', badge: 'Staff', color: '#8b5cf6', desc: 'Generate and print complete staff roster report.' },
              { label: 'Creche Terminal Evaluation', category: 'Student\'s Progressive Evaluation', badge: 'Creche', color: '#10b981', desc: 'Assess early childhood developmental milestones checklist.' },
              { label: 'View Pending Test Results', category: 'Student\'s Progressive Evaluation', badge: 'Audit', color: '#ec4899', desc: 'Review and approve un-published test scores.' },
              { label: 'View registered students per class/Sub class per semester', category: 'Registers', badge: 'Roster', color: '#06b6d4', desc: 'Filter and print student class registration lists.' },
              { label: 'View Un-Authorised Lists of Creche Progress Reports', category: 'Registers', badge: 'Creche', color: '#f97316', desc: 'Review and authorise pending creche progress reports.' }
            ].map((card) => (
              <div key={card.label} onClick={() => onOpenSimsModal({ category: card.category, link: card.label })} style={{
                background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: 14,
                cursor: 'pointer', transition: 'all 0.2s ease', position: 'relative', overflow: 'hidden'
              }} onMouseEnter={(e) => e.currentTarget.style.borderColor = card.color} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#334155'}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: card.color }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(255,255,255,0.1)', color: card.color, padding: '2px 8px', borderRadius: 10 }}>{card.badge}</span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>→</span>
                </div>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#fff', marginBottom: 4 }}>{card.label}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>{card.desc}</div>
              </div>
            ))}
          </div>

          {/* SIMS Category Explorer Tabs */}
          <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 18 }}>
            <div style={{ display: 'flex', gap: 10, borderBottom: '1px solid #334155', paddingBottom: 12, marginBottom: 16, overflowX: 'auto' }}>
              {['Finance & Administration', 'Academics', 'Student Services Centre', 'System Administrator'].map((hub) => (
                <button key={hub} onClick={() => setSelectedHub(hub)} style={{
                  padding: '8px 16px', borderRadius: 8, border: 'none',
                  background: selectedHub === hub ? '#0284c7' : 'rgba(255,255,255,0.05)',
                  color: selectedHub === hub ? '#fff' : '#cbd5e1', fontWeight: 800, fontSize: 12, cursor: 'pointer'
                }}>
                  {hub}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {(SIMS_DATA[selectedHub] || []).map((section) => (
                <div key={section.category} style={{ background: '#0f172a', padding: 14, borderRadius: 8, border: '1px solid #334155' }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: '#38bdf8', marginBottom: 8, borderBottom: '1px solid #1e293b', paddingBottom: 4 }}>
                    {section.category}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(section.links || []).map((lnk) => (
                      <button key={lnk} onClick={() => onOpenSimsModal({ category: section.category, link: lnk })} style={{
                        textAlign: 'left', background: 'none', border: 'none', color: '#e2e8f0',
                        fontSize: 11.5, padding: '4px 6px', borderRadius: 4, cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }} onMouseEnter={(e) => e.target.style.background = 'rgba(56,189,248,0.15)'} onMouseLeave={(e) => e.target.style.background = 'none'}>
                        ▸ {lnk}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: '#1e293b', padding: 32, borderRadius: 12, textAlign: 'center', border: '1px dashed #475569' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔒</div>
          <h3 style={{ fontSize: 16, fontWeight: 900, color: '#fff', margin: 0 }}>SIMS Enterprise Features Locked</h3>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, maxWidth: 460, margin: '6px auto 16px auto' }}>
            Please authenticate using your SIMS username and password above to unlock payment voucher approvals, score sheets, staff lists, terminal evaluations, and financial ledgers.
          </p>
          <button type="button" onClick={() => handleLogin()} style={{ padding: '10px 24px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
            🔓 Authenticate SIMS Access Now
          </button>
        </div>
      )}
    </div>
  );
}

function DefineGradePointsForm({ setM }) {
  const [gradePoints, setGradePoints] = useState([
    { mark1: '80.00', mark2: '100.00', grade: '1', remarks: 'Highly Proficient' },
    { mark1: '75.00', mark2: '79.99', grade: '2', remarks: 'Proficient' },
    { mark1: '65.00', mark2: '74.99', grade: '3', remarks: 'Approaching Proficiency' },
    { mark1: '60.00', mark2: '64.99', grade: '4', remarks: 'Developing' },
    { mark1: '55.00', mark2: '59.99', grade: '5', remarks: 'Emerging' },
    { mark1: '50.00', mark2: '54.99', grade: '6', remarks: 'Average' },
    { mark1: '40.00', mark2: '49.99', grade: '7', remarks: 'Pass' },
    { mark1: '36.00', mark2: '39.99', grade: '8', remarks: 'Weak' },
    { mark1: '0.00',  mark2: '35.99', grade: '9', remarks: 'Fail' }
  ]);

  const [mark1, setMark1] = useState('');
  const [mark2, setMark2] = useState('');
  const [gradePoint, setGradePoint] = useState('');
  const [remarks, setRemarks] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(null);

  const handleSelectRow = (index) => {
    setSelectedIdx(index);
    const item = gradePoints[index];
    if (item) {
      setMark1(item.mark1);
      setMark2(item.mark2);
      setGradePoint(item.grade);
      setRemarks(item.remarks);
    }
  };

  const handleDefineNew = (e) => {
    if (e) e.preventDefault();
    if (!mark1 || !mark2 || !gradePoint) return;
    const newItem = {
      mark1: Number(mark1).toFixed(2),
      mark2: Number(mark2).toFixed(2),
      grade: gradePoint.trim(),
      remarks: remarks.trim()
    };
    if (selectedIdx !== null && selectedIdx < gradePoints.length) {
      const updated = [...gradePoints];
      updated[selectedIdx] = newItem;
      setGradePoints(updated);
    } else {
      setGradePoints([...gradePoints, newItem]);
    }
    setMark1('');
    setMark2('');
    setGradePoint('');
    setRemarks('');
    setSelectedIdx(null);
  };

  const handleModify = () => {
    if (selectedIdx !== null && gradePoints[selectedIdx]) {
      const item = gradePoints[selectedIdx];
      setMark1(item.mark1);
      setMark2(item.mark2);
      setGradePoint(item.grade);
      setRemarks(item.remarks);
    }
  };

  const handleDelete = () => {
    if (selectedIdx !== null && gradePoints[selectedIdx]) {
      const updated = gradePoints.filter((_, idx) => idx !== selectedIdx);
      setGradePoints(updated);
      setSelectedIdx(null);
      setMark1('');
      setMark2('');
      setGradePoint('');
      setRemarks('');
    }
  };

  const handleNewWindow = () => {
    setMark1('');
    setMark2('');
    setGradePoint('');
    setRemarks('');
    setSelectedIdx(null);
  };

  return (
    <div style={{ background: '#0284c7', padding: 4, borderRadius: 6, width: '100%', boxSizing: 'border-box', fontFamily: 'sans-serif' }}>
      {/* Top Header */}
      <div style={{ background: '#0284c7', color: '#ffffff', padding: '6px 12px', textAlign: 'center', fontWeight: 900, fontSize: 13, letterSpacing: '0.05em' }}>
        DEFINE GRADE POINTS
      </div>

      {/* Top Controls Grid */}
      <div style={{ background: '#e0f2fe', padding: 14, borderBottom: '1px solid #7dd3fc', display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 10, alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 12, color: '#0369a1' }}>Mark 1</div>
        <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input
            type="number"
            step="0.01"
            value={mark1}
            onChange={(e) => setMark1(e.target.value)}
            style={{ padding: '6px 8px', border: '1px solid #93c5fd', borderRadius: 4, background: '#fff', fontSize: 13 }}
            placeholder="80.00"
          />
          <input
            type="number"
            step="0.01"
            value={mark2}
            onChange={(e) => setMark2(e.target.value)}
            style={{ padding: '6px 8px', border: '1px solid #93c5fd', borderRadius: 4, background: '#fff', fontSize: 13 }}
            placeholder="100.00"
          />
        </div>

        <div style={{ fontWeight: 700, fontSize: 12, color: '#0369a1' }}>Mark 2</div>
        <div style={{ gridColumn: 'span 2' }}>
          <input
            type="text"
            readOnly
            value={mark2}
            style={{ width: '100%', padding: '6px 8px', border: '1px solid #93c5fd', borderRadius: 4, background: '#f0f9ff', fontSize: 13 }}
          />
        </div>

        <div style={{ fontWeight: 700, fontSize: 12, color: '#0369a1' }}>Grade Point</div>
        <div style={{ gridColumn: 'span 2' }}>
          <input
            type="text"
            value={gradePoint}
            onChange={(e) => setGradePoint(e.target.value)}
            style={{ width: '100%', padding: '6px 8px', border: '1px solid #93c5fd', borderRadius: 4, background: '#fff', fontSize: 13 }}
            placeholder="1"
          />
        </div>

        <div style={{ fontWeight: 700, fontSize: 12, color: '#0369a1' }}>Remarks</div>
        <div style={{ gridColumn: 'span 2' }}>
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            style={{ width: '100%', padding: '6px 8px', border: '1px solid #93c5fd', borderRadius: 4, background: '#fff', fontSize: 13 }}
            placeholder="Highly Proficient"
          />
        </div>

        <div style={{ gridColumn: 'span 3', textAlign: 'center', marginTop: 4 }}>
          <button
            type="button"
            onClick={handleDefineNew}
            style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '6px 24px', borderRadius: 4, cursor: 'pointer', fontWeight: 700, fontSize: 12, color: '#0f172a', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
          >
            Define new
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div style={{ background: '#ffffff', maxHeight: 260, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
              <th style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 700, borderRight: '1px solid #e2e8f0', color: '#1e293b' }}>Mark 1</th>
              <th style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 700, borderRight: '1px solid #e2e8f0', color: '#1e293b' }}>Mark 2</th>
              <th style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 700, borderRight: '1px solid #e2e8f0', color: '#1e293b' }}>Grade</th>
              <th style={{ padding: '6px 12px', textAlign: 'left', fontWeight: 700, color: '#1e293b' }}>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {gradePoints.map((row, idx) => {
              const isSelected = selectedIdx === idx;
              return (
                <tr
                  key={idx}
                  onClick={() => handleSelectRow(idx)}
                  style={{
                    background: isSelected ? '#1e293b' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc'),
                    color: isSelected ? '#ffffff' : '#0f172a',
                    cursor: 'pointer',
                    borderBottom: '1px solid #e2e8f0'
                  }}
                >
                  <td style={{ padding: '6px 12px', borderRight: '1px solid #e2e8f0', fontWeight: 600 }}>{row.mark1}</td>
                  <td style={{ padding: '6px 12px', borderRight: '1px solid #e2e8f0', fontWeight: 600 }}>{row.mark2}</td>
                  <td style={{ padding: '6px 12px', borderRight: '1px solid #e2e8f0', fontWeight: 700 }}>{row.grade}</td>
                  <td style={{ padding: '6px 12px', fontWeight: 600 }}>{row.remarks}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom Button Bar */}
      <div style={{ background: '#e2e8f0', padding: 8, display: 'flex', gap: 10, justifyContent: 'space-between', borderTop: '1px solid #cbd5e1' }}>
        <button
          type="button"
          onClick={handleNewWindow}
          style={{ padding: '6px 16px', background: '#f8fafc', border: '1px solid #94a3b8', borderRadius: 4, cursor: 'pointer', fontWeight: 700, fontSize: 12, color: '#334155' }}
        >
          New Window
        </button>
        <button
          type="button"
          onClick={handleModify}
          style={{ padding: '6px 16px', background: '#f8fafc', border: '1px solid #94a3b8', borderRadius: 4, cursor: 'pointer', fontWeight: 700, fontSize: 12, color: '#334155' }}
        >
          Modify
        </button>
        <button
          type="button"
          onClick={handleDelete}
          style={{ padding: '6px 16px', background: '#f8fafc', border: '1px solid #94a3b8', borderRadius: 4, cursor: 'pointer', fontWeight: 700, fontSize: 12, color: '#991b1b' }}
        >
          Delete
        </button>
        <button
          type="button"
          onClick={() => setM && setM(null)}
          style={{ padding: '6px 20px', background: '#f8fafc', border: '1px solid #94a3b8', borderRadius: 4, cursor: 'pointer', fontWeight: 700, fontSize: 12, color: '#0f172a' }}
        >
          Exit
        </button>
      </div>
    </div>
  );
}





