import React, { useState } from 'react';
import {
  LayoutDashboard, Users, UserPlus, FileText, Settings,
  TrendingUp, School, CreditCard, Search, Trash2, Edit,
  CheckCircle2, X, Save, ShieldCheck, Mail, Phone, MapPin,
  Printer, Download, Eye, Plus, FileCheck, UserCheck, Radio
} from 'lucide-react';
import '../components/Portal/Portal.css';
import { usePortalData } from '../data/PortalStore';
import OfficialApplicationForm from '../components/Onboarding/OfficialApplicationForm';
import OfficialSchoolFeeStructure from '../components/Finance/OfficialSchoolFeeStructure';
import AttendanceControlTable from '../components/Attendance/AttendanceControlTable';
import BulkStudentUpload from '../components/Onboarding/BulkStudentUpload';
import { getAuthUser } from '../services/api';

const ADMIN_BG = '#4a1d6e';
const ADMIN_LIGHT = '#f3e8ff';
const ADMIN_ACCENT = '#7c3ac8';

const NAV = [
  { icon: <LayoutDashboard size={15} />, label: 'Dashboard', badge: null },
  { icon: <Radio size={15} />, label: 'Attendance & SMS Control', badge: 'Live' },
  { icon: <CreditCard size={15} />, label: 'Official Fee Schedule', badge: 'Bill' },
  { icon: <Users size={15} />, label: 'Student Roster', badge: null },
  { icon: <FileText size={15} />, label: 'Applications & Forms', badge: null },
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

  // Application Forms state
  const [selectedApp, setSelectedApp] = useState(null);
  const [isCreatingApp, setIsCreatingApp] = useState(false);

  const {
    onboardedStudents,
    applications,
    studentFees,
    teacherDirectory,
    onboardStudent,
    updateOnboardedStudent,
    deleteOnboardedStudent,
    addStaffMember,
    updateStaffMember,
    offboardStaffMember,
    deleteStaffMember,
    updateApplicationStatus,
    updateApplicationOfficeUse,
    submitApplication,
    deleteApplication,
  } = usePortalData();

  // Staff Management State
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [offboardingStaff, setOffboardingStaff] = useState(null);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffSubjectFilter, setStaffSubjectFilter] = useState('All');
  const [staffStatusFilter, setStaffStatusFilter] = useState('All');

  const [newStaffForm, setNewStaffForm] = useState({
    name: '',
    staffId: '',
    role: 'Subject Teacher',
    subject: 'Pure Mathematics',
    classAssigned: 'Grade 4',
    email: '',
    phone: '',
    gender: 'Male',
    photo: '👨‍🏫',
    bio: ''
  });

  const handleOnboardStaffSubmit = (e) => {
    e.preventDefault();
    if (!newStaffForm.name) return;

    if (addStaffMember) {
      addStaffMember(newStaffForm);
    }

    setSuccessMsg(`✅ Successfully onboarded staff member ${newStaffForm.name}! Portal credentials initialized.`);
    setIsAddingStaff(false);
    setNewStaffForm({
      name: '',
      staffId: '',
      role: 'Subject Teacher',
      subject: 'Pure Mathematics',
      classAssigned: 'Grade 4',
      email: '',
      phone: '',
      gender: 'Male',
      photo: '👨‍🏫',
      bio: ''
    });
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleUpdateStaffSubmit = (e) => {
    e.preventDefault();
    if (!editingStaff || !editingStaff.name) return;

    if (updateStaffMember) {
      updateStaffMember(editingStaff.id || editingStaff.staffId, editingStaff);
    }

    setSuccessMsg(`✅ Staff member ${editingStaff.name} details updated successfully!`);
    setEditingStaff(null);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleOffboardStaffConfirm = () => {
    if (!offboardingStaff) return;

    if (offboardStaffMember) {
      offboardStaffMember(offboardingStaff.id || offboardingStaff.staffId);
    }

    setSuccessMsg(`🚫 Staff member ${offboardingStaff.name} offboarded successfully. Access set to inactive.`);
    setOffboardingStaff(null);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleReactivateStaff = (staff) => {
    if (updateStaffMember) {
      updateStaffMember(staff.id || staff.staffId, { status: 'Active' });
    }
    setSuccessMsg(`⚡ Reactivated staff member ${staff.name}! Active status restored.`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const [adminOnboardTab, setAdminOnboardTab] = useState('single');
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
    rfidCardCode: '',
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
      rfidCardCode: '',
    });

    setSuccessMsg('Student onboarded successfully! Student ID, school email, and fee account initialized.');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleEnrollApplicant = (app) => {
    const learnerName = app.learner || `${app.firstName || ''} ${app.surname || ''}`.trim() || 'Student';
    const guardianName = app.guardian || app.fatherName || app.motherName || 'Parent';
    const guardianEmail = app.email || app.fatherEmail || 'parent@remaljcarewell.edu.gh';
    const guardianPhone = app.phone || app.fatherPhone || app.motherPhone || '';
    const level = app.level || app.applyingClass || 'JHS 1';
    const homeAddress = app.residentialAddress || app.address || 'Bogoso';

    onboardStudent({
      fullName: learnerName,
      dob: app.dob || '',
      gender: app.sex || 'Male',
      level: level,
      classSection: app.officeFormAssigned || 'A',
      guardianName: guardianName,
      guardianEmail: guardianEmail,
      guardianPhone: guardianPhone,
      homeAddress: homeAddress,
    });

    updateApplicationStatus(app.id, 'Enrolled');
    setSuccessMsg(`Applicant ${learnerName} officially admitted and enrolled into Student Roster!`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleSaveOfficeEvaluation = (id, officeData) => {
    if (updateApplicationOfficeUse) {
      updateApplicationOfficeUse(id, officeData);
      setSuccessMsg('Office evaluation and examination results saved to application record.');
      setTimeout(() => setSuccessMsg(''), 5000);
    }
  };

  const filteredStudents = (onboardedStudents || []).filter((s) =>
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.level.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.guardianName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredApplications = (applications || []).filter((a) => {
    const name = a.learner || `${a.firstName || ''} ${a.surname || ''}`;
    const gName = a.guardian || a.fatherName || a.motherName || '';
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.level || a.applyingClass || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalStudents = (onboardedStudents || []).length;
  const activeStudents = (onboardedStudents || []).filter((s) => s.status === 'Active').length;
  const totalApplications = (applications || []).length;
  const totalFeesBilled = (studentFees || []).reduce((sum, f) => sum + (f.billedAmount || 0), 0);

  const STATS = [
    { label: 'Total Enrolled Students', value: String(totalStudents), trend: `${activeStudents} Active`, icon: '👥', bg: '#f3e8ff', ic: ADMIN_BG },
    { label: 'Admissions Applications', value: String(totalApplications), trend: 'Official forms active', icon: '📋', bg: '#fef9c3', ic: '#78350f' },
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
            <div style={{ fontSize: 11, color: '#6b21a8', marginTop: 2 }}>{getAuthUser()?.fullName || getAuthUser()?.name || 'School Administration Office'}</div>
          </div>
          <span className="sidebar-section-label">Management</span>
          {NAV.map((item) => (
            <button
              key={item.label}
              className={`sidebar-item${activeNav === item.label || (activeNav === 'Applications' && item.label.includes('Applications')) ? ' active' : ''}`}
              style={activeNav === item.label || (activeNav === 'Applications' && item.label.includes('Applications')) ? { background: ADMIN_BG } : {}}
              onClick={() => {
                setActiveNav(item.label);
                setSelectedApp(null);
                setIsCreatingApp(false);
              }}
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
                    REMALJ · Carewell Inspirational School · Bogoso Administration
                  </span>
                </p>
                <h1 className="page-header__title">Administrator Dashboard ⚡</h1>
                <p className="page-header__subtitle">Manage student onboarding, official 4-page application forms, and institutional roster.</p>
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
                      onClick={() => setActiveNav('Applications & Forms')}
                      style={{ padding: 12, background: ADMIN_LIGHT, color: ADMIN_BG, border: '1px solid #d8b4fe', borderRadius: 'var(--radius-md)', fontWeight: 700, textAlign: 'left', cursor: 'pointer' }}
                    >
                      📄 Official Application Forms & PDF
                    </button>
                    <button
                      onClick={() => setActiveNav('Onboard Student')}
                      style={{ padding: 12, background: 'var(--gray-100)', color: 'var(--gray-800)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', fontWeight: 700, textAlign: 'left', cursor: 'pointer' }}
                    >
                      ➕ Onboard New Student
                    </button>
                    <button
                      onClick={() => setActiveNav('Student Roster')}
                      style={{ padding: 12, background: 'var(--gray-100)', color: 'var(--gray-800)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', fontWeight: 700, textAlign: 'left', cursor: 'pointer' }}
                    >
                      📋 View Complete Roster
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ONBOARD STUDENT ── */}
          {activeNav === 'Onboard Student' && (
            <div className="animate-fade-up">
              <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h1 className="page-header__title">Onboard New Student 🎓</h1>
                  <p className="page-header__subtitle">Register individual learners or bulk import multiple student records via CSV / Excel spreadsheet.</p>
                </div>

                <div style={{ display: 'flex', gap: 8, background: '#f1f5f9', padding: 4, borderRadius: 10 }}>
                  <button
                    type="button"
                    onClick={() => setAdminOnboardTab('single')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: 'none',
                      fontWeight: 800,
                      fontSize: 12,
                      cursor: 'pointer',
                      background: adminOnboardTab === 'single' ? '#ffffff' : 'transparent',
                      color: adminOnboardTab === 'single' ? '#0f172a' : '#64748b',
                      boxShadow: adminOnboardTab === 'single' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    📝 Single Learner Form
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdminOnboardTab('bulk')}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: 'none',
                      fontWeight: 800,
                      fontSize: 12,
                      cursor: 'pointer',
                      background: adminOnboardTab === 'bulk' ? ADMIN_BG : 'transparent',
                      color: adminOnboardTab === 'bulk' ? '#ffffff' : '#64748b',
                      boxShadow: adminOnboardTab === 'bulk' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    📊 Bulk CSV / Excel Upload
                  </button>
                </div>
              </div>

              {adminOnboardTab === 'bulk' ? (
                <BulkStudentUpload onComplete={() => {
                  setSuccessMsg('Bulk student onboarding completed successfully!');
                  setTimeout(() => setSuccessMsg(''), 5000);
                }} />
              ) : (
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

                  <h2 style={{ fontSize: 16, fontWeight: 800, color: ADMIN_BG, marginTop: 24, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>💳</span> 3. NFC / RFID Smart Card Reader Assignment
                  </h2>
                  <div style={{ background: '#f8fafc', padding: '18px', borderRadius: 10, border: '1px solid #cbd5e1' }}>
                    <label style={{ display: 'block' }}>
                      <span style={{ fontWeight: 800, color: '#0f172a', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                        💳 Unique Card Reader Number / RFID Card UID
                      </span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="text"
                          placeholder="e.g. 0009841234 or tap USB/Bluetooth Card Reader to auto-assign..."
                          value={onboardingForm.rfidCardCode}
                          onChange={(e) => setOnboardingForm({ ...onboardingForm, rfidCardCode: e.target.value })}
                          style={{
                            flexGrow: 1,
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            color: '#166534',
                            fontSize: 13,
                            padding: '10px 14px',
                            border: '2px solid #22c55e',
                            borderRadius: 8,
                            background: '#ffffff',
                            outline: 'none'
                          }}
                        />
                        <button
                          type="button"
                          style={{
                            padding: '10px 16px',
                            borderRadius: 8,
                            background: '#166534',
                            color: '#ffffff',
                            border: 'none',
                            fontWeight: 800,
                            fontSize: 12,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling;
                            if (input) input.focus();
                          }}
                          title="Click to focus input & tap physical card on Card Reader"
                        >
                          💳 Tap Card Reader
                        </button>
                      </div>
                      <small style={{ color: '#64748b', fontSize: 11, marginTop: 6, display: 'block' }}>
                        Plug your USB RFID / NFC card reader and tap the student's physical card to automatically record the unique card number for instant attendance scanning & parent SMS alerts.
                      </small>
                    </label>
                  </div>

                  <div style={{ marginTop: 24 }}>
                    <button className="workflow-button" type="submit" style={{ background: ADMIN_BG }}>
                      <UserPlus size={16} /> Onboard Student & Initialize Smart Card
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

          {/* ── ATTENDANCE & SMS CONTROL ── */}
          {activeNav === 'Attendance & SMS Control' && (
            <div className="animate-fade-up">
              <AttendanceControlTable />
            </div>
          )}

          {/* ── STUDENT ROSTER ── */}
          {activeNav === 'Student Roster' && (
            <div className="animate-fade-up">
              <AttendanceControlTable />
              <div className="page-header">
                <h1 className="page-header__title">Student Roster Database</h1>
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

          {/* ── APPLICATIONS & FORMS ── */}
          {(activeNav === 'Applications' || activeNav === 'Applications & Forms') && (
            <div className="animate-fade-up">
              <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h1 className="page-header__title">Official Application Forms & Admissions 📄</h1>
                  <p className="page-header__subtitle">
                    Review filled online 4-page REMALJ application forms, record office examination marks, and download local PDF copies.
                  </p>
                </div>

                {!selectedApp && !isCreatingApp && (
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={() => setIsCreatingApp(true)}
                      style={{
                        padding: '9px 16px', background: ADMIN_BG, color: '#fff',
                        border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700,
                        fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      <Plus size={15} /> Fill New Application Form
                    </button>
                  </div>
                )}
              </div>

              {selectedApp ? (
                <div>
                  <OfficialApplicationForm
                    initialData={selectedApp}
                    readOnly={true}
                    isAdmin={true}
                    onCancel={() => setSelectedApp(null)}
                    onSaveOfficeUse={handleSaveOfficeEvaluation}
                  />
                </div>
              ) : isCreatingApp ? (
                <div>
                  <OfficialApplicationForm
                    readOnly={false}
                    isAdmin={true}
                    onCancel={() => setIsCreatingApp(false)}
                    onSubmit={(newForm) => {
                      submitApplication(newForm);
                      setIsCreatingApp(false);
                      setSuccessMsg('New Application Form created and submitted successfully!');
                      setTimeout(() => setSuccessMsg(''), 5000);
                    }}
                  />
                </div>
              ) : (
                <>
                  <div style={{ position: 'relative', marginBottom: 16 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--gray-400)' }} />
                    <input
                      type="text"
                      placeholder="Search applications by learner name, level, or guardian..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-300)', fontSize: 13 }}
                    />
                  </div>

                  <div className="panel">
                    <div className="panel__body">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Learner Name</th>
                            <th>Class/Form</th>
                            <th>Guardian Details</th>
                            <th>Enrolment Type</th>
                            <th>Status</th>
                            <th>Office Evaluation</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredApplications.map((app) => {
                            const learnerName = app.learner || `${app.firstName || ''} ${app.surname || ''}`.trim() || 'Applicant';
                            const guardianName = app.guardian || app.fatherName || app.motherName || 'Parent';

                            return (
                              <tr key={app.id}>
                                <td>
                                  <strong>{learnerName}</strong>
                                  <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Submitted: {app.submittedAt || 'Online'}</div>
                                </td>
                                <td><span style={{ fontWeight: 700 }}>{app.applyingClass || app.level || 'JHS 1'}</span></td>
                                <td>
                                  <div>{guardianName}</div>
                                  <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{app.email || app.fatherEmail || app.phone}</div>
                                </td>
                                <td>
                                  <span style={{
                                    padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                                    background: app.enrolmentType === 'Boarding' ? '#fef3c7' : '#e0f2fe',
                                    color: app.enrolmentType === 'Boarding' ? '#92400e' : '#0369a1'
                                  }}>
                                    {app.enrolmentType || 'Day'}
                                  </span>
                                </td>
                                <td>
                                  <select
                                    value={app.status}
                                    onChange={(e) => updateApplicationStatus(app.id, e.target.value)}
                                    style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid var(--gray-300)', fontSize: 12, fontWeight: 700 }}
                                  >
                                    <option>Submitted</option>
                                    <option>Documents review</option>
                                    <option>Assessment scheduled</option>
                                    <option>Accepted</option>
                                    <option>Enrolled</option>
                                  </select>
                                </td>
                                <td>
                                  {app.officeExamEnglishMark || app.officeAdmit ? (
                                    <span style={{ fontSize: 11, color: '#166534', fontWeight: 700 }}>
                                      ✅ Office Reviewed (Admit: {app.officeAdmit || 'Yes'})
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: 11, color: '#92400e', fontStyle: 'italic' }}>
                                      Pending Office Exam Results
                                    </span>
                                  )}
                                </td>
                                <td>
                                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    <button
                                      onClick={() => setSelectedApp(app)}
                                      style={{
                                        padding: '4px 8px', background: ADMIN_LIGHT, color: ADMIN_BG,
                                        border: '1px solid #d8b4fe', borderRadius: 4, cursor: 'pointer',
                                        fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4
                                      }}
                                      title="Inspect 4-page form, record office marks & print/download PDF"
                                    >
                                      <Eye size={13} /> View Form PDF
                                    </button>

                                    {app.status !== 'Enrolled' && (
                                      <button
                                        onClick={() => handleEnrollApplicant(app)}
                                        style={{
                                          padding: '4px 8px', background: '#dcfce7', color: '#166534',
                                          border: '1px solid #86efac', borderRadius: 4, cursor: 'pointer',
                                          fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4
                                        }}
                                        title="Transfer to Student Roster & Create Fee Account"
                                      >
                                        <UserCheck size={13} /> Enrol Student
                                      </button>
                                    )}

                                    <button
                                      onClick={() => {
                                        if (window.confirm('Delete this application form record?')) {
                                          deleteApplication(app.id);
                                        }
                                      }}
                                      style={{
                                        padding: '4px 8px', background: '#fee2e2', color: '#dc2626',
                                        border: '1px solid #fca5a5', borderRadius: 4, cursor: 'pointer'
                                      }}
                                      title="Delete application"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── OFFICIAL FEE SCHEDULE VIEW ── */}
          {activeNav === 'Official Fee Schedule' && (
            <OfficialSchoolFeeStructure />
          )}

          {/* ── CLASSES & STAFF ── */}
          {activeNav === 'Classes & Staff' && (
            <div className="animate-fade-up">
              <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h1 className="page-header__title">Classes & Teaching Staff Directory 👨‍🏫</h1>
                  <p className="page-header__subtitle">Onboard new teaching staff, edit staff credentials & class assignments, or offboard former staff members.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddingStaff(true)}
                  style={{
                    padding: '10px 18px', borderRadius: 8, background: ADMIN_BG, color: '#fff',
                    border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(74, 29, 110, 0.25)'
                  }}
                >
                  <UserPlus size={16} /> ➕ Onboard New Staff Member
                </button>
              </div>

              {/* Staff Stats Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
                <div style={{ padding: '16px 20px', background: '#f3e8ff', border: '1px solid #e9d5ff', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#6b21a8', textTransform: 'uppercase' }}>Active Teaching Staff</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#581c87', marginTop: 4 }}>
                    {(teacherDirectory || []).filter(t => t.status !== 'Offboarded').length}
                  </div>
                  <div style={{ fontSize: 11, color: '#7e22ce', fontWeight: 600, marginTop: 2 }}>Faculty members active</div>
                </div>

                <div style={{ padding: '16px 20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>Departments & Subjects</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#14532d', marginTop: 4 }}>
                    {new Set((teacherDirectory || []).map(t => t.subject)).size}
                  </div>
                  <div style={{ fontSize: 11, color: '#15803d', fontWeight: 600, marginTop: 2 }}>Core subject areas</div>
                </div>

                <div style={{ padding: '16px 20px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#991b1b', textTransform: 'uppercase' }}>Offboarded Staff</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#7f1d1d', marginTop: 4 }}>
                    {(teacherDirectory || []).filter(t => t.status === 'Offboarded').length}
                  </div>
                  <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 2 }}>Access deactivated</div>
                </div>
              </div>

              {/* Staff Filters Toolbar */}
              <div style={{ background: '#f8fafc', border: '1px solid var(--gray-200)', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 12, alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                    <input
                      type="text"
                      placeholder="🔎 Search by Staff Name, Staff ID (STF-2026-001), Subject, Email..."
                      value={staffSearchQuery}
                      onChange={(e) => setStaffSearchQuery(e.target.value)}
                      style={{
                        width: '100%', padding: '9px 12px 9px 36px', borderRadius: 8,
                        border: '1px solid var(--gray-300)', fontSize: 13, fontWeight: 600, outline: 'none', background: '#fff'
                      }}
                    />
                  </div>

                  <select
                    value={staffSubjectFilter}
                    onChange={(e) => setStaffSubjectFilter(e.target.value)}
                    style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--gray-300)', fontSize: 12.5, fontWeight: 700, background: '#fff' }}
                  >
                    <option value="All">All Subjects / Departments</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science / Physics</option>
                    <option value="English">English / Literature</option>
                    <option value="ICT">ICT / Computing</option>
                    <option value="Social Studies">Social Studies</option>
                  </select>

                  <select
                    value={staffStatusFilter}
                    onChange={(e) => setStaffStatusFilter(e.target.value)}
                    style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--gray-300)', fontSize: 12.5, fontWeight: 700, background: '#fff' }}
                  >
                    <option value="All">All Staff Statuses</option>
                    <option value="Active">Active Staff</option>
                    <option value="Offboarded">Offboarded Staff</option>
                  </select>

                  {(staffSearchQuery || staffSubjectFilter !== 'All' || staffStatusFilter !== 'All') && (
                    <button
                      type="button"
                      onClick={() => {
                        setStaffSearchQuery('');
                        setStaffSubjectFilter('All');
                        setStaffStatusFilter('All');
                      }}
                      style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Staff Directory Table */}
              <div className="panel">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Staff ID & Avatar</th>
                      <th>Staff Name & Designation</th>
                      <th>Primary Subject</th>
                      <th>Assigned Class</th>
                      <th>Contact Details</th>
                      <th>Status</th>
                      <th>Administrative Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(teacherDirectory || []).filter(t => {
                      const matchesSearch = (t.name || '').toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                                            (t.staffId || '').toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                                            (t.subject || '').toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                                            (t.email || '').toLowerCase().includes(staffSearchQuery.toLowerCase());
                      const matchesSubject = staffSubjectFilter === 'All' || (t.subject || '').toLowerCase().includes(staffSubjectFilter.toLowerCase());
                      const matchesStatus = staffStatusFilter === 'All' ||
                                            (staffStatusFilter === 'Active' && t.status !== 'Offboarded') ||
                                            (staffStatusFilter === 'Offboarded' && t.status === 'Offboarded');
                      return matchesSearch && matchesSubject && matchesStatus;
                    }).map((t) => (
                      <tr key={t.id || t.staffId} style={{ opacity: t.status === 'Offboarded' ? 0.6 : 1 }}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 24, background: '#f1f5f9', width: 38, height: 38, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {t.photo || '👨‍🏫'}
                            </span>
                            <code>{t.staffId || ('STF-' + String(t.id).split('-').pop())}</code>
                          </div>
                        </td>
                        <td>
                          <strong style={{ fontSize: 13.5, color: 'var(--gray-900)' }}>{t.name}</strong>
                          <div style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 600 }}>{t.role || 'Subject Teacher'}</div>
                        </td>
                        <td>
                          <strong style={{ color: '#0369a1', fontSize: 12 }}>{t.subject}</strong>
                        </td>
                        <td>
                          <span style={{ padding: '3px 10px', background: ADMIN_LIGHT, color: ADMIN_BG, borderRadius: 6, fontWeight: 800, fontSize: 11.5 }}>
                            {t.classAssigned}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{t.email}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 700 }}>{t.phone}</div>
                        </td>
                        <td>
                          {t.status === 'Offboarded' ? (
                            <span style={{ padding: '3px 10px', background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: 99, fontWeight: 800, fontSize: 11 }}>
                              🚫 Offboarded
                            </span>
                          ) : (
                            <span style={{ padding: '3px 10px', background: '#dcfce7', color: '#166534', border: '1px solid #86efac', borderRadius: 99, fontWeight: 800, fontSize: 11 }}>
                              🟢 Active Staff
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => setEditingStaff({ ...t })}
                              style={{
                                padding: '6px 10px', borderRadius: 6, background: '#f0fdf4',
                                color: '#15803d', border: '1px solid #bbf7d0', fontWeight: 800,
                                fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                              }}
                            >
                              <Edit size={12} /> Edit Details
                            </button>

                            {t.status === 'Offboarded' ? (
                              <button
                                type="button"
                                onClick={() => handleReactivateStaff(t)}
                                style={{
                                  padding: '6px 10px', borderRadius: 6, background: '#eff6ff',
                                  color: '#1d4ed8', border: '1px solid #bfdbfe', fontWeight: 800,
                                  fontSize: 11, cursor: 'pointer'
                                }}
                              >
                                ⚡ Reactivate
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setOffboardingStaff(t)}
                                style={{
                                  padding: '6px 10px', borderRadius: 6, background: '#fef2f2',
                                  color: '#b91c1c', border: '1px solid #fecaca', fontWeight: 800,
                                  fontSize: 11, cursor: 'pointer'
                                }}
                              >
                                🚫 Offboard Staff
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

          {/* ── ONBOARD NEW STAFF MODAL ── */}
          {isAddingStaff && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20
            }}>
              <div style={{ background: '#fff', width: '100%', maxWidth: 560, borderRadius: 14, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden' }} className="animate-fade-up">
                <div style={{ background: ADMIN_BG, padding: '18px 24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>➕ Onboard New Staff Member</h3>
                    <p style={{ fontSize: 12, opacity: 0.9, margin: '2px 0 0 0' }}>Register staff credentials, primary subject, and assigned class.</p>
                  </div>
                  <button onClick={() => setIsAddingStaff(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: 15, cursor: 'pointer', fontWeight: 900 }}>✕</button>
                </div>

                <form onSubmit={handleOnboardStaffSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <label>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-800)' }}>Full Name *</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mr. S. Amponsah"
                        value={newStaffForm.name}
                        onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid var(--gray-300)', fontSize: 13, marginTop: 4 }}
                      />
                    </label>

                    <label>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-800)' }}>Staff ID (Auto or Custom)</span>
                      <input
                        type="text"
                        placeholder="e.g. STF-2026-009"
                        value={newStaffForm.staffId}
                        onChange={(e) => setNewStaffForm({ ...newStaffForm, staffId: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid var(--gray-300)', fontSize: 13, marginTop: 4, fontFamily: 'monospace' }}
                      />
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <label>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-800)' }}>Designation / Role</span>
                      <select
                        value={newStaffForm.role}
                        onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid var(--gray-300)', fontSize: 13, marginTop: 4 }}
                      >
                        <option>Subject Teacher</option>
                        <option>Form Master / Class Tutor</option>
                        <option>Department Head</option>
                        <option>Senior Tutor</option>
                        <option>ICT Administrator</option>
                      </select>
                    </label>

                    <label>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-800)' }}>Primary Subject</span>
                      <input
                        type="text"
                        placeholder="e.g. Pure Mathematics"
                        value={newStaffForm.subject}
                        onChange={(e) => setNewStaffForm({ ...newStaffForm, subject: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid var(--gray-300)', fontSize: 13, marginTop: 4 }}
                      />
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <label>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-800)' }}>Assigned Class</span>
                      <select
                        value={newStaffForm.classAssigned}
                        onChange={(e) => setNewStaffForm({ ...newStaffForm, classAssigned: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid var(--gray-300)', fontSize: 13, marginTop: 4 }}
                      >
                        {LEVEL_OPTIONS.map((l) => (
                          <option key={l}>{l}</option>
                        ))}
                        <option>All Levels</option>
                      </select>
                    </label>

                    <label>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-800)' }}>Phone Number</span>
                      <input
                        type="tel"
                        placeholder="e.g. 024 900 1100"
                        value={newStaffForm.phone}
                        onChange={(e) => setNewStaffForm({ ...newStaffForm, phone: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid var(--gray-300)', fontSize: 13, marginTop: 4 }}
                      />
                    </label>
                  </div>

                  <label>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-800)' }}>Official School Email</span>
                    <input
                      type="email"
                      placeholder="e.g. user@remaljcarewell.edu.gh"
                      value={newStaffForm.email}
                      onChange={(e) => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid var(--gray-300)', fontSize: 13, marginTop: 4 }}
                    />
                  </label>

                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <button
                      type="button"
                      onClick={() => setIsAddingStaff(false)}
                      style={{ flex: 1, padding: 10, border: '1px solid var(--gray-300)', borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 700 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{ flex: 1, padding: 10, border: 'none', borderRadius: 8, background: ADMIN_BG, color: '#fff', fontWeight: 800, cursor: 'pointer' }}
                    >
                      ✅ Onboard Staff Member
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── EDIT STAFF DETAILS MODAL ── */}
          {editingStaff && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20
            }}>
              <div style={{ background: '#fff', width: '100%', maxWidth: 560, borderRadius: 14, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden' }} className="animate-fade-up">
                <div style={{ background: ADMIN_BG, padding: '18px 24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>✏️ Edit Staff Details — {editingStaff.name}</h3>
                    <p style={{ fontSize: 12, opacity: 0.9, margin: '2px 0 0 0' }}>Update staff subject, class assignment, or contact credentials.</p>
                  </div>
                  <button onClick={() => setEditingStaff(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: 15, cursor: 'pointer', fontWeight: 900 }}>✕</button>
                </div>

                <form onSubmit={handleUpdateStaffSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <label>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-800)' }}>Full Name</span>
                      <input
                        type="text"
                        value={editingStaff.name || ''}
                        onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid var(--gray-300)', fontSize: 13, marginTop: 4 }}
                      />
                    </label>

                    <label>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-800)' }}>Staff ID</span>
                      <input
                        type="text"
                        value={editingStaff.staffId || ''}
                        onChange={(e) => setEditingStaff({ ...editingStaff, staffId: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid var(--gray-300)', fontSize: 13, marginTop: 4, fontFamily: 'monospace' }}
                      />
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <label>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-800)' }}>Designation / Role</span>
                      <input
                        type="text"
                        value={editingStaff.role || ''}
                        onChange={(e) => setEditingStaff({ ...editingStaff, role: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid var(--gray-300)', fontSize: 13, marginTop: 4 }}
                      />
                    </label>

                    <label>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-800)' }}>Primary Subject</span>
                      <input
                        type="text"
                        value={editingStaff.subject || ''}
                        onChange={(e) => setEditingStaff({ ...editingStaff, subject: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid var(--gray-300)', fontSize: 13, marginTop: 4 }}
                      />
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <label>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-800)' }}>Assigned Class</span>
                      <input
                        type="text"
                        value={editingStaff.classAssigned || ''}
                        onChange={(e) => setEditingStaff({ ...editingStaff, classAssigned: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid var(--gray-300)', fontSize: 13, marginTop: 4 }}
                      />
                    </label>

                    <label>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-800)' }}>Phone Number</span>
                      <input
                        type="tel"
                        value={editingStaff.phone || ''}
                        onChange={(e) => setEditingStaff({ ...editingStaff, phone: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid var(--gray-300)', fontSize: 13, marginTop: 4 }}
                      />
                    </label>
                  </div>

                  <label>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-800)' }}>Official Email</span>
                    <input
                      type="email"
                      value={editingStaff.email || ''}
                      onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid var(--gray-300)', fontSize: 13, marginTop: 4 }}
                    />
                  </label>

                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <button
                      type="button"
                      onClick={() => setEditingStaff(null)}
                      style={{ flex: 1, padding: 10, border: '1px solid var(--gray-300)', borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 700 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{ flex: 1, padding: 10, border: 'none', borderRadius: 8, background: ADMIN_BG, color: '#fff', fontWeight: 800, cursor: 'pointer' }}
                    >
                      💾 Save Staff Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── OFFBOARD STAFF CONFIRMATION MODAL ── */}
          {offboardingStaff && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20
            }}>
              <div style={{ background: '#fff', width: '100%', maxWidth: 480, borderRadius: 14, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden' }} className="animate-fade-up">
                <div style={{ background: '#991b1b', padding: '18px 24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>🚫 Confirm Staff Offboarding</h3>
                    <p style={{ fontSize: 12, opacity: 0.9, margin: '2px 0 0 0' }}>Deactivate staff member portal access.</p>
                  </div>
                  <button onClick={() => setOffboardingStaff(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: 15, cursor: 'pointer', fontWeight: 900 }}>✕</button>
                </div>

                <div style={{ padding: 24 }}>
                  <p style={{ fontSize: 13.5, color: 'var(--gray-800)', lineHeight: 1.5, marginBottom: 16 }}>
                    Are you sure you want to offboard <strong>{offboardingStaff.name}</strong> ({offboardingStaff.staffId || offboardingStaff.email})?
                  </p>
                  <div style={{ padding: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#991b1b', fontSize: 12, fontWeight: 700, marginBottom: 20 }}>
                    ⚠ This action will mark their account status as Offboarded and disable their active staff portal sign-in credentials.
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setOffboardingStaff(null)}
                      style={{ flex: 1, padding: 10, border: '1px solid var(--gray-300)', borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 700 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleOffboardStaffConfirm}
                      style={{ flex: 1, padding: 10, border: 'none', borderRadius: 8, background: '#dc2626', color: '#fff', fontWeight: 800, cursor: 'pointer' }}
                    >
                      🚫 Offboard Staff Member
                    </button>
                  </div>
                </div>
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
