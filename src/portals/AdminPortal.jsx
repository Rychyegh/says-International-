import React, { useState } from 'react';
import {
  LayoutDashboard, Users, UserPlus, FileText, Settings,
  TrendingUp, School, CreditCard, Search, Trash2, Edit,
  CheckCircle2, X, Save, ShieldCheck, Mail, Phone, MapPin
} from 'lucide-react';
import '../components/Portal/Portal.css';
import { usePortalData } from '../data/PortalStore';

const ADMIN_BG = '#4a1d6e';
const ADMIN_LIGHT = '#f3e8ff';
const ADMIN_ACCENT = '#7c3ac8';

const NAV = [
  { icon: <LayoutDashboard size={15} />, label: 'Dashboard', badge: null },
  { icon: <Users size={15} />, label: 'Student Roster', badge: null },
  { icon: <UserPlus size={15} />, label: 'Onboard Student', badge: null },
  { icon: <FileText size={15} />, label: 'Applications', badge: null },
  { icon: <School size={15} />, label: 'Classes & Staff', badge: null },
];

const LEVEL_OPTIONS = [
  'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
  'JHS 1', 'JHS 2', 'JHS 3', 'SHS 1', 'SHS 2', 'SHS 3'
];

export default function AdminPortal({ onSignOut }) {
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingStudent, setEditingStudent] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  const {
    onboardedStudents,
    applications,
    studentFees,
    teacherDirectory,
    onboardStudent,
    updateOnboardedStudent,
    deleteOnboardedStudent,
    updateApplicationStatus,
  } = usePortalData();

  const [onboardingForm, setOnboardingForm] = useState({
    fullName: '',
    dob: '',
    gender: 'Male',
    level: 'JHS 1',
    classSection: 'A',
    guardianName: '',
    guardianEmail: '',
    guardianPhone: '',
    homeAddress: '',
  });

  const handleOnboardSubmit = (e) => {
    e.preventDefault();
    if (!onboardingForm.fullName || !onboardingForm.guardianName || !onboardingForm.guardianEmail) return;

    onboardStudent(onboardingForm);

    setOnboardingForm({
      fullName: '',
      dob: '',
      gender: 'Male',
      level: 'JHS 1',
      classSection: 'A',
      guardianName: '',
      guardianEmail: '',
      guardianPhone: '',
      homeAddress: '',
    });

    setSuccessMsg('Student onboarded successfully! Student ID, school email, and fee account initialized for Account Portal.');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const filteredStudents = (onboardedStudents || []).filter((s) =>
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.level.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.guardianName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStudents = (onboardedStudents || []).length;
  const activeStudents = (onboardedStudents || []).filter((s) => s.status === 'Active').length;
  const totalApplications = (applications || []).length;
  const totalFeesBilled = (studentFees || []).reduce((sum, f) => sum + (f.billedAmount || 0), 0);

  const STATS = [
    { label: 'Total Enrolled Students', value: String(totalStudents), trend: `${activeStudents} Active`, icon: '👥', bg: '#f3e8ff', ic: ADMIN_BG },
    { label: 'Admissions Applications', value: String(totalApplications), trend: 'Review pending', icon: '📋', bg: '#fef9c3', ic: '#78350f' },
    { label: 'Total Revenue Billed', value: `GHS ${totalFeesBilled.toLocaleString()}`, trend: 'Term 1 · 2026', icon: '💰', bg: '#dcfce7', ic: '#166534' },
    { label: 'Teaching Staff', value: String((teacherDirectory || []).length), trend: 'All departments', icon: '👨‍🏫', bg: '#e0f2fe', ic: '#0369a1' },
  ];

  const handleEdit = (student) => {
    setEditingId(student.id);
    setEditingStudent({ ...student });
  };

  const handleSaveEdit = () => {
    updateOnboardedStudent(editingId, editingStudent);
    setEditingId(null);
    setEditingStudent({});
    setSuccessMsg('Student record updated successfully.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this student record?')) {
      deleteOnboardedStudent(id);
      setSuccessMsg('Student record deleted.');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  return (
    <div className="portal">
      <div className="portal__layout">
        {/* Sidebar */}
        <aside className="portal__sidebar">
          <div style={{ margin: '0 0 16px', padding: '14px', background: ADMIN_LIGHT, borderRadius: 'var(--radius-md)', borderLeft: `4px solid ${ADMIN_BG}` }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: ADMIN_BG }}>Admin Portal</div>
            <div style={{ fontSize: 11, color: '#6b21a8', marginTop: 2 }}>School Administration Office</div>
          </div>
          <span className="sidebar-section-label">Management</span>
          {NAV.map((item) => (
            <button
              key={item.label}
              className={`sidebar-item${activeNav === item.label ? ' active' : ''}`}
              style={activeNav === item.label ? { background: ADMIN_BG } : {}}
              onClick={() => setActiveNav(item.label)}
            >
              <span className="sidebar-item__icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="portal__content">
          {successMsg && (
            <div style={{
              padding: '12px 18px', background: '#dcfce7', border: '1px solid #86efac', color: '#166534',
              borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 13, marginBottom: 16,
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <CheckCircle2 size={16} />
              {successMsg}
            </div>
          )}

          {/* ── DASHBOARD ── */}
          {activeNav === 'Dashboard' && (
            <div className="animate-fade-up">
              <div className="page-header">
                <p className="page-header__eyebrow" style={{ color: ADMIN_ACCENT }}>
                  <span style={{ background: ADMIN_LIGHT, padding: '2px 10px', borderRadius: 99, border: '1px solid #e9d5ff' }}>
                    REMALJ Carewell Administration
                  </span>
                </p>
                <h1 className="page-header__title">Administrator Dashboard ⚡</h1>
                <p className="page-header__subtitle">Manage student onboarding, admissions applications, and institutional overview.</p>
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

              <div className="content-grid" style={{ marginTop: 24 }}>
                <div className="panel" style={{ flex: 2 }}>
                  <div className="panel__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 className="panel__title">Recent Onboarded Students</h2>
                    <button
                      onClick={() => setActiveNav('Onboard Student')}
                      style={{ padding: '6px 14px', background: ADMIN_BG, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      + Onboard New Student
                    </button>
                  </div>
                  <div className="panel__body">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Student ID</th>
                          <th>Full Name</th>
                          <th>Level</th>
                          <th>Guardian</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {onboardedStudents.slice(0, 5).map((stu) => (
                          <tr key={stu.id}>
                            <td><code>{stu.studentId}</code></td>
                            <td><strong>{stu.fullName}</strong></td>
                            <td>{stu.level}</td>
                            <td>{stu.guardianName}</td>
                            <td><span className="status-pill status-pill--success">{stu.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="panel" style={{ flex: 1 }}>
                  <div className="panel__header">
                    <h2 className="panel__title">Quick Portal Links</h2>
                  </div>
                  <div className="panel__body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button
                      onClick={() => setActiveNav('Onboard Student')}
                      style={{ padding: 12, background: ADMIN_LIGHT, color: ADMIN_BG, border: '1px solid #d8b4fe', borderRadius: 'var(--radius-md)', fontWeight: 700, textAlign: 'left', cursor: 'pointer' }}
                    >
                      ➕ Onboard New Student
                    </button>
                    <button
                      onClick={() => setActiveNav('Student Roster')}
                      style={{ padding: 12, background: 'var(--gray-100)', color: 'var(--gray-800)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', fontWeight: 700, textAlign: 'left', cursor: 'pointer' }}
                    >
                      📋 View Complete Roster
                    </button>
                    <button
                      onClick={() => setActiveNav('Applications')}
                      style={{ padding: 12, background: 'var(--gray-100)', color: 'var(--gray-800)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', fontWeight: 700, textAlign: 'left', cursor: 'pointer' }}
                    >
                      📁 Admissions Register
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ONBOARD STUDENT ── */}
          {activeNav === 'Onboard Student' && (
            <div className="animate-fade-up">
              <div className="page-header">
                <h1 className="page-header__title">Onboard New Student 🎓</h1>
                <p className="page-header__subtitle">Register a new learner, assign grade placement, link guardian details, and generate system credentials.</p>
              </div>

              <div className="panel" style={{ maxWidth: 800 }}>
                <form className="panel__body workflow-form" onSubmit={handleOnboardSubmit}>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: ADMIN_BG, marginBottom: 16 }}>1. Learner Information</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <label>
                      <span>Learner Full Name *</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Kwame Mensah"
                        value={onboardingForm.fullName}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, fullName: e.target.value })}
                      />
                    </label>

                    <label>
                      <span>Date of Birth</span>
                      <input
                        type="date"
                        value={onboardingForm.dob}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, dob: e.target.value })}
                      />
                    </label>

                    <label>
                      <span>Gender</span>
                      <select
                        value={onboardingForm.gender}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, gender: e.target.value })}
                      >
                        <option>Male</option>
                        <option>Female</option>
                      </select>
                    </label>

                    <label>
                      <span>Entry Level / Grade *</span>
                      <select
                        value={onboardingForm.level}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, level: e.target.value })}
                      >
                        {LEVEL_OPTIONS.map((lvl) => (
                          <option key={lvl}>{lvl}</option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span>Class Section</span>
                      <input
                        type="text"
                        placeholder="e.g. Section A"
                        value={onboardingForm.classSection}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, classSection: e.target.value })}
                      />
                    </label>
                  </div>

                  <h2 style={{ fontSize: 16, fontWeight: 800, color: ADMIN_BG, marginTop: 24, marginBottom: 16 }}>2. Guardian Contact Details</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <label>
                      <span>Guardian Full Name *</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mrs. Angela Edwards"
                        value={onboardingForm.guardianName}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, guardianName: e.target.value })}
                      />
                    </label>

                    <label>
                      <span>Guardian Email Address *</span>
                      <input
                        type="email"
                        required
                        placeholder="e.g. parent@example.com"
                        value={onboardingForm.guardianEmail}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, guardianEmail: e.target.value })}
                      />
                    </label>

                    <label>
                      <span>Guardian Phone Number</span>
                      <input
                        type="tel"
                        placeholder="e.g. 024 111 2222"
                        value={onboardingForm.guardianPhone}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, guardianPhone: e.target.value })}
                      />
                    </label>

                    <label>
                      <span>Home Address</span>
                      <input
                        type="text"
                        placeholder="e.g. Bogoso, Anikoko"
                        value={onboardingForm.homeAddress}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, homeAddress: e.target.value })}
                      />
                    </label>
                  </div>

                  <div style={{ marginTop: 24 }}>
                    <button className="workflow-button" type="submit" style={{ background: ADMIN_BG }}>
                      <UserPlus size={16} /> Onboard Student & Create Fee Ledger
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── STUDENT ROSTER ── */}
          {activeNav === 'Student Roster' && (
            <div className="animate-fade-up">
              <div className="page-header">
                <h1 className="page-header__title">Student Roster</h1>
                <p className="page-header__subtitle">Manage registered learners, edit student profiles, or delete records.</p>
              </div>

              <div style={{ position: 'relative', marginBottom: 16 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--gray-400)' }} />
                <input
                  type="text"
                  placeholder="Search student roster by name, ID, grade, or guardian..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-300)', fontSize: 13 }}
                />
              </div>

              <div className="panel">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Full Name</th>
                      <th>Level / Section</th>
                      <th>Guardian Details</th>
                      <th>School Email</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s) => (
                      <tr key={s.id}>
                        <td><code>{s.studentId}</code></td>
                        <td><strong>{s.fullName}</strong></td>
                        <td>{s.level} ({s.classSection || 'A'})</td>
                        <td>
                          <div>{s.guardianName}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{s.guardianEmail}</div>
                        </td>
                        <td style={{ fontSize: 11, color: ADMIN_ACCENT }}>{s.studentEmail}</td>
                        <td><span className="status-pill status-pill--success">{s.status}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => handleEdit(s)}
                              style={{ padding: '4px 8px', background: 'var(--gray-100)', border: '1px solid var(--gray-300)', borderRadius: 4, cursor: 'pointer' }}
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => handleDelete(s.id)}
                              style={{ padding: '4px 8px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 4, cursor: 'pointer' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── APPLICATIONS ── */}
          {activeNav === 'Applications' && (
            <div className="animate-fade-up">
              <div className="page-header">
                <h1 className="page-header__title">Admissions & Applications</h1>
                <p className="page-header__subtitle">Review submitted online admission applications.</p>
              </div>

              <div className="panel">
                <div className="panel__body">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Learner Name</th>
                        <th>Level</th>
                        <th>Guardian</th>
                        <th>Contact Email</th>
                        <th>Submitted At</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(applications || []).map((app) => (
                        <tr key={app.id}>
                          <td><strong>{app.learner}</strong></td>
                          <td>{app.level}</td>
                          <td>{app.guardian}</td>
                          <td>{app.email}</td>
                          <td>{app.submittedAt}</td>
                          <td>
                            <select
                              value={app.status}
                              onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                              style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--gray-300)', fontSize: 12 }}
                            >
                              <option>Submitted</option>
                              <option>Documents review</option>
                              <option>Assessment scheduled</option>
                              <option>Accepted</option>
                              <option>Enrolled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── CLASSES & STAFF ── */}
          {activeNav === 'Classes & Staff' && (
            <div className="animate-fade-up">
              <div className="page-header">
                <h1 className="page-header__title">Classes & Teaching Staff</h1>
                <p className="page-header__subtitle">List of teachers and their assigned classes across the school.</p>
              </div>

              <div className="panel">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Staff Member</th>
                      <th>Subject</th>
                      <th>Assigned Class</th>
                      <th>Email</th>
                      <th>Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(teacherDirectory || []).map((t) => (
                      <tr key={t.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 20 }}>{t.photo}</span>
                            <strong>{t.name}</strong>
                          </div>
                        </td>
                        <td>{t.subject}</td>
                        <td><span style={{ padding: '2px 8px', background: ADMIN_LIGHT, color: ADMIN_BG, borderRadius: 6, fontWeight: 700, fontSize: 12 }}>{t.classAssigned}</span></td>
                        <td>{t.email}</td>
                        <td>{t.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── EDIT STUDENT MODAL ── */}
          {editingId && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20
            }}>
              <div style={{ background: '#fff', width: '100%', maxWidth: 500, borderRadius: 'var(--radius-lg)', padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--gray-900)' }}>Edit Student Record</h2>
                  <button onClick={() => setEditingId(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>✕</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <label>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>Full Name</span>
                    <input
                      type="text"
                      value={editingStudent.fullName || ''}
                      onChange={(e) => setEditingStudent({ ...editingStudent, fullName: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid var(--gray-300)' }}
                    />
                  </label>

                  <label>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>Grade Level</span>
                    <select
                      value={editingStudent.level || ''}
                      onChange={(e) => setEditingStudent({ ...editingStudent, level: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid var(--gray-300)' }}
                    >
                      {LEVEL_OPTIONS.map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>Guardian Name</span>
                    <input
                      type="text"
                      value={editingStudent.guardianName || ''}
                      onChange={(e) => setEditingStudent({ ...editingStudent, guardianName: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid var(--gray-300)' }}
                    />
                  </label>

                  <label>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>Guardian Email</span>
                    <input
                      type="email"
                      value={editingStudent.guardianEmail || ''}
                      onChange={(e) => setEditingStudent({ ...editingStudent, guardianEmail: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid var(--gray-300)' }}
                    />
                  </label>

                  <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                    <button
                      onClick={() => setEditingId(null)}
                      style={{ flex: 1, padding: 10, border: '1px solid var(--gray-300)', borderRadius: 6, background: '#fff', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      style={{ flex: 1, padding: 10, border: 'none', borderRadius: 6, background: ADMIN_BG, color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
