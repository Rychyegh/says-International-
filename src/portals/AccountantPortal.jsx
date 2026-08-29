import React, { useState } from 'react';
import {
  LayoutDashboard, CreditCard, Send, Search, CheckCircle2,
  AlertTriangle, DollarSign, Users, School, MessageSquare, PlusCircle, FileText, Printer, Shield, UserPlus, Sliders, Calendar, FileCheck, UserCheck, Lock, RefreshCw, Layers
} from 'lucide-react';
import '../components/Portal/Portal.css';
import { usePortalData } from '../data/PortalStore';

const ACCOUNT_BG = '#0f3a4b';
const ACCOUNT_LIGHT = '#e0f2fe';
const ACCOUNT_ACCENT = '#0284c7';

const NAV = [
  { icon: <School size={15} />, label: 'SIMS v2025 Module', badge: 'v2025' },
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
      category: 'Card Services',
      links: [
        'Issue a New Student Services Spending Card',
        'Issue a New Parent\'s Pickup Card',
        'Re-Encrypt Pickup Card',
        'Register Student for Bus Service',
        'Onboard Student on the School Feeding Programme',
        'Student Special Dietary Needs',
        'Fund Student\'s Bus Tag',
        'Morning Drop-Off Verification',
        'Afternoon Pickup Verification',
        'Issue a New Temporary Parent\'s Pickup Card',
        'Modify Temporary Parent\'s Pickup Card',
        'Morning Drop-Off Verification (Temp. Cards Only)',
        'Afternoon Pickup Verification (Temp. Cards Only)',
        'Morning Walker Verification (Temp. Cards Only)'
      ]
    },
    {
      category: 'Registers',
      links: [
        'Preview Registers',
        'Preview Lists of Parents and their Wards'
      ]
    }
  ],
  'Academics': [
    {
      category: 'Student\'s Progressive Evaluation',
      links: [
        'Prepare Exams Score',
        'Prepare Creche Progressive Reports',
        'Pre-audit & approve exams scores'
      ]
    },
    {
      category: 'Remarks & Comments',
      links: [
        'Class master\'s comments',
        'Class master\'s comments (CRECHE ONLY)',
        'Head master\'s comments',
        'Head master\'s comments (CRECHE ONLY)'
      ]
    },
    {
      category: 'Print Assessments Reports',
      links: [
        'Print Individual terminal report',
        'Print Class terminal report',
        'Print Subject Based Assessments',
        'Print Consolidated Subject Based Assessments'
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
        'Prepare Payroll',
        'Delete Payroll'
      ]
    },
    {
      category: 'Accounts & Financial Reports',
      links: [
        'Accounts',
        'Financial statements',
        'HR Payroll Reports'
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
      const fee = studentFees[0];
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
            <div style={{ fontSize: 11, color: '#0369a1', marginTop: 2 }}>Mrs. Grace Accountant · Finance Office</div>
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

          {/* SIMS v2025 TOP NAVIGATION BAR */}
          <div className="sims-header" style={{ marginBottom: 24 }}>
            <div className="sims-header__top">
              <span className="sims-header__brand">SIMs v2025 /</span>
              <span style={{ fontSize: 11, color: '#9d174d', fontWeight: 600 }}>Accounts & Administration Management</span>
            </div>
            <div className="sims-header__tabs">
              {['Student Services Centre', 'Academics', 'Finance & Administration', 'System Administrator'].map((tab) => (
                <button
                  key={tab}
                  className={`sims-tab-btn ${simsTab === tab && activeNav === 'SIMS v2025 Module' ? 'active' : ''}`}
                  onClick={() => {
                    setSimsTab(tab);
                    setActiveNav('SIMS v2025 Module');
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* ── SIMS v2025 MODULE VIEW ── */}
          {activeNav === 'SIMS v2025 Module' && (
            <div className="animate-fade-up">
              <div className="sims-content-panel">
                <div className="sims-grid">
                  {SIMS_DATA[simsTab]?.map((catItem, idx) => (
                    <div className="sims-category" key={idx}>
                      <h3 className="sims-category-title">{catItem.category}</h3>

                      {/* Render direct links */}
                      {catItem.links && catItem.links.map((lnk, lIdx) => (
                        <button
                          key={lIdx}
                          className="sims-link-item"
                          onClick={() => handleLinkClick(catItem.category, lnk)}
                        >
                          {lnk}
                        </button>
                      ))}

                      {/* Render subcategories if present */}
                      {catItem.subCategories && catItem.subCategories.map((sub, sIdx) => (
                        <div key={sIdx} style={{ marginTop: 8 }}>
                          <h4 className="sims-subcategory-title">{sub.title}</h4>
                          {sub.links.map((subLnk, subIdx) => (
                            <button
                              key={subIdx}
                              className="sims-link-item"
                              style={{ paddingLeft: 12 }}
                              onClick={() => handleLinkClick(sub.title, subLnk)}
                            >
                              {subLnk}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
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

  return (
    <div className="sims-modal-overlay">
      <div className="sims-modal-card" style={{ maxWidth: isPrintOrReport ? 760 : 640 }}>
        <div className="sims-modal-header">
          <div>
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

function renderSpecificContent(link, m, setM, students) {
  // Helper to update state field
  const update = (field, val) => setM((prev) => ({ ...prev, [field]: val }));

  // 1. PRINT & REPORT PREVIEWS
  if (link === 'Print Student\'s Progressive Report' || link === 'Print Individual terminal report') {
    return (
      <div>
        <div style={{ padding: 16, background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #881337', paddingBottom: 10, marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, color: '#881337', fontWeight: 800, margin: 0 }}>REMALJ CAREWELL INSPIRATIONAL ACADEMY</h3>
            <p style={{ fontSize: 11, color: '#4b5563', margin: '2px 0' }}>OFFICIAL STUDENT PROGRESSIVE TERMINAL REPORT</p>
            <small style={{ color: '#9ca3af' }}>Term 1 · Academic Year 2026/2027</small>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
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
          <div style={{ marginTop: 12, borderTop: '1px dashed #ccc', paddingTop: 8, fontSize: 11 }}>
            <strong>Class Master Comment:</strong> Exemplary conduct and strong academic commitment throughout the term.<br />
            <strong>Headmaster Endorsement:</strong> Promoted with distinction to the next level. [SIGNED & SEALED]
          </div>
        </div>
        <div className="sims-modal-actions">
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
        <div style={{ padding: 16, background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #881337', paddingBottom: 10, marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, color: '#881337', fontWeight: 800, margin: 0 }}>REMALJ CAREWELL ACADEMY</h3>
            <p style={{ fontSize: 11, color: '#4b5563', margin: '2px 0' }}>CLASS BROADSHEET ASSESSMENT SUMMARY · JHS 2</p>
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
        <div className="sims-modal-actions">
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
        <div style={{ padding: 16, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 12 }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #dc2626', paddingBottom: 10, marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, color: '#dc2626', fontWeight: 800, margin: 0 }}>CRECHE & EARLY YEARS DEVELOPMENTAL REPORT</h3>
            <small style={{ color: '#991b1b' }}>REMALJ Carewell Early Childhood Center</small>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
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
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Close</button>
          <button type="button" className="sims-btn sims-btn-primary" onClick={() => window.print()}>
            <Printer size={14} style={{ display: 'inline', marginRight: 6 }} /> Print Creche Report
          </button>
        </div>
      </div>
    );
  }

  if (link === 'Print Student\'s Academic Bill' || link === 'Print & Post Student\'s Academic Bill') {
    return (
      <div>
        <div style={{ padding: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #0f3a4b', paddingBottom: 10, marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, color: '#0f3a4b', fontWeight: 800, margin: 0 }}>REMALJ CAREWELL INSPIRATIONAL ACADEMY</h3>
            <p style={{ fontSize: 11, color: '#0284c7', margin: '2px 0' }}>OFFICIAL ACADEMIC FEE INVOICE BILL</p>
            <small style={{ color: '#64748b' }}>Invoice #: INV-2026-992 · Due Date: 15th Sept 2026</small>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div><strong>Student Name:</strong> {m.studentName}</div>
            <div><strong>Student ID:</strong> {m.studentId}</div>
            <div><strong>Guardian:</strong> {m.guardianName}</div>
            <div><strong>Level:</strong> {m.level}</div>
          </div>
          <table className="data-table" style={{ fontSize: 11 }}>
            <thead>
              <tr>
                <th>Bill Item Description</th>
                <th>Category</th>
                <th>Amount (GHS)</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Tuition & Instructional Fee</td><td>Academics</td><td>3,500.00</td></tr>
              <tr><td>ICT Lab & Science Facility Levy</td><td>Facility</td><td>300.00</td></tr>
              <tr><td>PTA Development Levy</td><td>Association</td><td>200.00</td></tr>
              <tr><td>School Feeding Programme (Term)</td><td>Services</td><td>800.00</td></tr>
              <tr style={{ fontWeight: 800, background: '#f8fafc' }}>
                <td colSpan="2">TOTAL TERM ACADEMIC BILL</td>
                <td style={{ color: '#0f3a4b' }}>GHS 4,800.00</td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginTop: 12, padding: 8, background: '#e0f2fe', borderRadius: 6, fontSize: 11 }}>
            <strong>Payment Instructions:</strong> Pay via MTN MoMo Merchant Code <strong>#882910</strong> or Barclays Bank Account <strong>#001-8827162</strong>.
          </div>
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Close</button>
          <button type="button" className="sims-btn sims-btn-primary" onClick={() => window.print()}>
            <Printer size={14} style={{ display: 'inline', marginRight: 6 }} /> Print Academic Bill
          </button>
        </div>
      </div>
    );
  }

  if (link === 'Print student ledger' || link === 'Re-print Commercial Receipt') {
    return (
      <div>
        <div style={{ padding: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #0f3a4b', paddingBottom: 10, marginBottom: 12 }}>
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
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Close</button>
          <button type="button" className="sims-btn sims-btn-primary" onClick={() => window.print()}>
            <Printer size={14} style={{ display: 'inline', marginRight: 6 }} /> Print Official Ledger
          </button>
        </div>
      </div>
    );
  }

  if (link === 'Print Out PV' || link === 'Pre Audit Approve Payment Voucher (PV)') {
    return (
      <div>
        <div style={{ padding: 16, background: '#fafafa', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #881337', paddingBottom: 10, marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, color: '#881337', fontWeight: 800, margin: 0 }}>OFFICIAL INTERNAL PAYMENT VOUCHER (PV)</h3>
            <small style={{ color: '#991b1b' }}>Voucher Ref: PV-2026-044 · Audit Status: PRE-AUDITED & APPROVED</small>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div><strong>Payee / Beneficiary:</strong> {m.vendorName || 'Ghana Water Company Ltd.'}</div>
            <div><strong>Voucher Date:</strong> {new Date().toLocaleDateString()}</div>
            <div><strong>Purpose / Expenditure:</strong> Monthly Utility Bill (August 2026)</div>
            <div><strong>Voucher Amount:</strong> GHS 1,450.00</div>
          </div>
          <div style={{ padding: 8, background: '#dcfce7', border: '1px solid #86efac', borderRadius: 6, color: '#166534', fontSize: 11 }}>
            ✔ Pre-Audited by Chief Internal Auditor · Certified Correct & Approved for Disbursement.
          </div>
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Close</button>
          <button type="button" className="sims-btn sims-btn-primary" onClick={() => window.print()}>
            <Printer size={14} style={{ display: 'inline', marginRight: 6 }} /> Print Payment Voucher
          </button>
        </div>
      </div>
    );
  }

  if (link === 'Accounts' || link === 'Financial statements' || link === 'HR Payroll Reports' || link === 'Preview Registers' || link === 'Preview Lists of Parents and their Wards') {
    return (
      <div>
        <div style={{ padding: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12 }}>
          <div style={{ textAlign: 'center', borderBottom: '2px solid #0f3a4b', paddingBottom: 10, marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, color: '#0f3a4b', fontWeight: 800, margin: 0 }}>REMALJ CAREWELL INSPIRATIONAL ACADEMY</h3>
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

  if (link.includes('Charts of Accounts') || link.includes('Define Assets') || link.includes('Liabilities') || link.includes('Profits Loss')) {
    return (
      <div>
        <div className="sims-form-group">
          <label>Account Ledger Code</label>
          <input type="text" value={m.accountCode} onChange={(e) => update('accountCode', e.target.value)} required />
        </div>
        <div className="sims-form-group">
          <label>Account Name / Title</label>
          <input type="text" value={m.accountName} onChange={(e) => update('accountName', e.target.value)} required />
        </div>
        <div className="sims-form-group">
          <label>Account Description & Classification</label>
          <textarea rows="2" placeholder="Primary operating bank account for fee deposits." value={m.notes} onChange={(e) => update('notes', e.target.value)} />
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Save Account Code</button>
        </div>
      </div>
    );
  }

  if (link.includes('Tax') || link.includes('SSNIT') || link.includes('Header') || link.includes('Close Month') || link.includes('Close Year')) {
    return (
      <div>
        <div className="sims-form-group">
          <label>Setting / Rate Value</label>
          <input type="text" value={m.settingVal} onChange={(e) => update('settingVal', e.target.value)} required />
        </div>
        <div className="sims-form-group">
          <label>Authorized Admin Seal / Security Signature</label>
          <input type="text" placeholder="AUTH-991827" value={m.authKey || ''} onChange={(e) => update('authKey', e.target.value)} />
        </div>
        <div className="sims-modal-actions">
          <button type="button" className="sims-btn sims-btn-secondary" onClick={() => setM(null)}>Cancel</button>
          <button type="submit" className="sims-btn sims-btn-primary">Apply & Save Setting</button>
        </div>
      </div>
    );
  }

  // DEFAULT TAILORED FORM FOR ANY OTHER ACTION
  return (
    <div>
      <div className="sims-form-group">
        <label>Target Student / Record</label>
        <select value={m.studentName} onChange={(e) => update('studentName', e.target.value)}>
          {students.map((s) => <option key={s.id} value={s.fullName}>{s.fullName} ({s.studentId} - {s.level})</option>)}
        </select>
      </div>
      <div className="sims-form-group">
        <label>Action Amount / Value (GHS)</label>
        <input type="number" value={m.amount} onChange={(e) => update('amount', e.target.value)} />
      </div>
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
