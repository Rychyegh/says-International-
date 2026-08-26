import React, { useState } from 'react';
import {
  LayoutDashboard, CreditCard, Send, Search, CheckCircle2,
  AlertTriangle, DollarSign, Users, School, MessageSquare, PlusCircle, FileText
} from 'lucide-react';
import '../components/Portal/Portal.css';
import { usePortalData } from '../data/PortalStore';

const ACCOUNT_BG = '#0f3a4b';
const ACCOUNT_LIGHT = '#e0f2fe';
const ACCOUNT_ACCENT = '#0284c7';

const NAV = [
  { icon: <LayoutDashboard size={15} />, label: 'Financial Overview', badge: null },
  { icon: <CreditCard size={15} />, label: 'Fee Ledgers & Payments', badge: null },
  { icon: <Send size={15} />, label: 'Send Owing Reminders', badge: null },
  { icon: <Users size={15} />, label: 'Students & Teachers', badge: null },
  { icon: <MessageSquare size={15} />, label: 'Sent Messages Log', badge: null },
];

export default function AccountantPortal({ onSignOut }) {
  const [activeNav, setActiveNav] = useState('Financial Overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [feeFilter, setFeeFilter] = useState('All');
  
  // Modals state
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
