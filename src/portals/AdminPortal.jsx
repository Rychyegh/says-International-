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
  { icon: <FileCheck size={15} />, label: 'Transcripts & Results', badge: 'All Classes' },
  { icon: <Radio size={15} />, label: 'Attendance & SMS Control', badge: 'Live' },
  { icon: <CreditCard size={15} />, label: 'Card Issuance & Smart Identity', badge: 'NFC' },
  { icon: <CreditCard size={15} />, label: 'Official Fee Schedule', badge: 'Bill' },
  { icon: <Users size={15} />, label: 'Student Roster', badge: null },
  { icon: <FileText size={15} />, label: 'Applications & Forms', badge: null },
  { icon: <School size={15} />, label: 'Classes & Staff', badge: null },
];

const LEVEL_OPTIONS = [
  'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
  'JHS 1', 'JHS 2', 'JHS 3', 'SHS 1', 'SHS 2', 'SHS 3'
];

export default function AdminPortal({ onSignOut, initialAdminRole }) {
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingStudent, setEditingStudent] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  // Application Forms state
  const [selectedApp, setSelectedApp] = useState(null);
  const [isCreatingApp, setIsCreatingApp] = useState(false);

  // Transcripts & Class Results state
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [transcriptClassFilter, setTranscriptClassFilter] = useState('All');
  const [transcriptTermFilter, setTranscriptTermFilter] = useState('Term 1 · 2026');
  const [viewingTranscriptStudent, setViewingTranscriptStudent] = useState(null);
  // Admin Role State
  const [adminRole, setAdminRole] = useState(initialAdminRole || 'head_admin'); // 'head_admin' | 'sub_admin'
  const [declineResultModal, setDeclineResultModal] = useState(null);
  const [declineInputNote, setDeclineInputNote] = useState('');

  const getStudentTranscriptData = (student) => {
    if (!student) {
      return {
        courses: [],
        totalCredits: 0,
        totalGradePoints: 0,
        cgpa: '0.00',
        averageScore: '0.0',
        academicStanding: 'N/A',
        classRank: 'N/A',
        attendancePercentage: '100%',
        term: 'Term 1 · 2026 Academic Year'
      };
    }

    const isSHS = (student.level || '').includes('SHS');
    const isJHS = (student.level || '').includes('JHS');

    const defaultCourses = isSHS ? [
      { code: 'ENG-101', title: 'English Language & Literature', credits: 3, score: 88, grade: 'A', gradePoint: 4.0, remark: 'Excellent' },
      { code: 'MTH-101', title: 'Core Mathematics & Analytics', credits: 4, score: 92, grade: 'A+', gradePoint: 4.0, remark: 'Outstanding' },
      { code: 'SCI-102', title: 'Integrated Science & Biology', credits: 4, score: 84, grade: 'B+', gradePoint: 3.5, remark: 'Very Good' },
      { code: 'SOC-101', title: 'Social Studies & Citizenship', credits: 3, score: 86, grade: 'A', gradePoint: 4.0, remark: 'Excellent' },
      { code: 'ICT-105', title: 'Information Technology & Data Science', credits: 3, score: 95, grade: 'A+', gradePoint: 4.0, remark: 'Exceptional' },
      { code: 'ECO-201', title: 'Economics & Financial Literacy', credits: 3, score: 79, grade: 'B', gradePoint: 3.0, remark: 'Good' },
    ] : isJHS ? [
      { code: 'ENG-08', title: 'English Language Arts', credits: 3, score: 85, grade: 'A', gradePoint: 4.0, remark: 'Excellent' },
      { code: 'MTH-08', title: 'General Mathematics', credits: 4, score: 89, grade: 'A', gradePoint: 4.0, remark: 'Excellent' },
      { code: 'SCI-08', title: 'Integrated Science', credits: 4, score: 82, grade: 'B+', gradePoint: 3.5, remark: 'Very Good' },
      { code: 'SOC-08', title: 'Social Studies & Culture', credits: 3, score: 87, grade: 'A', gradePoint: 4.0, remark: 'Excellent' },
      { code: 'ICT-08', title: 'Computer Literacy & Coding', credits: 3, score: 91, grade: 'A+', gradePoint: 4.0, remark: 'Outstanding' },
      { code: 'RME-08', title: 'Religious & Moral Education', credits: 2, score: 90, grade: 'A+', gradePoint: 4.0, remark: 'Outstanding' },
    ] : [
      { code: 'ENG-PRI', title: 'English Language & Reading', credits: 3, score: 88, grade: 'A', gradePoint: 4.0, remark: 'Excellent' },
      { code: 'MTH-PRI', title: 'Primary Mathematics & Numeracy', credits: 4, score: 94, grade: 'A+', gradePoint: 4.0, remark: 'Outstanding' },
      { code: 'SCI-PRI', title: 'Basic Science & Nature', credits: 3, score: 86, grade: 'A', gradePoint: 4.0, remark: 'Excellent' },
      { code: 'OWOP-PRI', title: 'Our World Our People', credits: 3, score: 90, grade: 'A+', gradePoint: 4.0, remark: 'Outstanding' },
      { code: 'ICT-PRI', title: 'Basic Computing & Digital Skills', credits: 2, score: 92, grade: 'A+', gradePoint: 4.0, remark: 'Outstanding' },
      { code: 'CAD-PRI', title: 'Creative Arts & Design', credits: 2, score: 87, grade: 'A', gradePoint: 4.0, remark: 'Excellent' },
    ];

    const totalCredits = defaultCourses.reduce((acc, c) => acc + c.credits, 0);
    const totalScoreSum = defaultCourses.reduce((acc, c) => acc + c.score, 0);
    const averageScore = (totalScoreSum / defaultCourses.length).toFixed(1);
    
    const weightedGradePoints = defaultCourses.reduce((acc, c) => acc + (c.gradePoint * c.credits), 0);
    const cgpa = (weightedGradePoints / totalCredits).toFixed(2);

    return {
      courses: defaultCourses,
      totalCredits,
      totalGradePoints: weightedGradePoints.toFixed(1),
      cgpa,
      averageScore,
      academicStanding: Number(cgpa) >= 3.5 ? 'First Class Honor Roll' : Number(cgpa) >= 3.0 ? 'Second Class Upper' : 'Good Standing',
      classRank: 'Top 5%',
      attendancePercentage: '98.5%',
      term: 'Term 1 · 2026 Academic Year'
    };
  };

  const {
    onboardedStudents,
    applications,
    studentFees,
    teacherDirectory,
    classLevels,
    subjects,
    results,
    approveResult,
    declineResult,
    onboardStudent,
    updateOnboardedStudent,
    deleteOnboardedStudent,
    addStaffMember,
    updateStaffMember,
    offboardStaffMember,
    deleteStaffMember,
    addClassLevel,
    addSubject,
    updateApplicationStatus,
    updateApplicationOfficeUse,
    submitApplication,
    deleteApplication,
  } = usePortalData();

  // Dynamic Levels & Subjects
  const defaultClassLevels = [
    'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
    'JHS 1', 'JHS 2', 'JHS 3', 'SHS 1', 'SHS 2', 'SHS 3'
  ];
  const LEVEL_OPTIONS = Array.from(new Set([...defaultClassLevels, ...(classLevels || [])]));

  const defaultSubjectList = [
    'Pure Mathematics', 'Mathematics', 'Physics', 'Science / Physics',
    'Literature in English', 'English Language', 'ICT / Computing',
    'Social Studies', 'French', 'Religious & Moral Education'
  ];
  const SUBJECT_OPTIONS = Array.from(new Set([...defaultSubjectList, ...(subjects || [])]));

  // Dynamic Class & Subject Creation State
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassCategory, setNewClassCategory] = useState('Primary');
  const [newSubjectName, setNewSubjectName] = useState('');

  const handleAddClassSubmit = (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    if (addClassLevel) {
      addClassLevel(newClassName.trim());
    }

    setSuccessMsg(`🏫 Class Level "${newClassName.trim()}" created successfully! Available across all class selectors.`);
    setNewClassName('');
    setIsAddingClass(false);
    setTimeout(() => setSuccessMsg(''), 6000);
  };

  const handleAddSubjectSubmit = (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    if (addSubject) {
      addSubject(newSubjectName.trim());
    }

    setStaffSubjectFilter(newSubjectName.trim());
    setSuccessMsg(`📚 Subject / Department "${newSubjectName.trim()}" added successfully! Filter updated.`);
    setNewSubjectName('');
    setIsAddingSubject(false);
    setTimeout(() => setSuccessMsg(''), 6000);
  };

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

  // Card Issuance State
  const [issuingCardStudent, setIssuingCardStudent] = useState(null);
  const [issuingParentCardStudent, setIssuingParentCardStudent] = useState(null);
  const [cardSearchQuery, setCardSearchQuery] = useState('');
  const [cardForm, setCardForm] = useState({
    rfidCardCode: '',
    dailyLimit: '50',
    pin: '1234',
    holderName: '',
    notes: ''
  });

  const handleIssueStudentCardSubmit = (e) => {
    e.preventDefault();
    if (!issuingCardStudent || !cardForm.rfidCardCode.trim()) return;

    if (updateOnboardedStudent) {
      updateOnboardedStudent(issuingCardStudent.id, {
        rfidCardCode: cardForm.rfidCardCode.trim(),
        cardIssued: true,
        dailyLimit: cardForm.dailyLimit || '50'
      });
    }

    setSuccessMsg(`💳 Smart RFID Card #${cardForm.rfidCardCode.trim()} encoded & issued to ${issuingCardStudent.fullName}!`);
    setIssuingCardStudent(null);
    setCardForm({ rfidCardCode: '', dailyLimit: '50', pin: '1234', holderName: '', notes: '' });
    setTimeout(() => setSuccessMsg(''), 6000);
  };

  const handleIssueParentCardSubmit = (e) => {
    e.preventDefault();
    if (!issuingParentCardStudent) return;

    const code = cardForm.rfidCardCode.trim() || `PCARD-${Date.now().toString().slice(-6)}`;
    if (updateOnboardedStudent) {
      updateOnboardedStudent(issuingParentCardStudent.id, {
        parentPickupCardIssued: true,
        parentCardCode: code
      });
    }

    setSuccessMsg(`👨‍👩‍👧 Official Parent Pickup Card #${code} issued for ${issuingParentCardStudent.guardianName} (${issuingParentCardStudent.fullName})!`);
    setIssuingParentCardStudent(null);
    setCardForm({ rfidCardCode: '', dailyLimit: '50', pin: '1234', holderName: '', notes: '' });
    setTimeout(() => setSuccessMsg(''), 6000);
  };

  const handleAddStaffSubmit = (e) => {
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

  const filteredTranscriptStudents = (onboardedStudents || []).filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
      s.studentId.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
      s.guardianName.toLowerCase().includes(transcriptSearch.toLowerCase());
    const matchesClass = transcriptClassFilter === 'All' || s.level.toLowerCase() === transcriptClassFilter.toLowerCase();
    return matchesSearch && matchesClass;
  });

  const handleExportClassResultsCSV = (studentsList) => {
    const headers = ['Student ID', 'Full Name', 'Class Level', 'Section', 'Guardian', 'Average Score (%)', 'GPA (4.0 Scale)', 'Academic Standing'];
    const rows = studentsList.map((student) => {
      const data = getStudentTranscriptData(student);
      return [
        student.studentId,
        student.fullName,
        student.level,
        student.classSection || 'A',
        student.guardianName || 'Guardian',
        `${data.averageScore}%`,
        data.cgpa,
        data.standing
      ];
    });
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Master_Class_Transcripts_All_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSingleTranscriptCSV = (student) => {
    const data = getStudentTranscriptData(student);
    const header = [
      [`REMALJ CAREWELL INSPIRATIONAL SCHOOL - OFFICIAL ACADEMIC TRANSCRIPT`],
      [`Student Name: ${student.fullName}`, `Student ID: ${student.studentId}`, `Class Level: ${student.level}`],
      [`Guardian: ${student.guardianName}`, `Date: ${new Date().toLocaleDateString()}`],
      [],
      ['Course Code', 'Subject Name', 'Class Assessment (30%)', 'End of Term Exam (70%)', 'Total Score (100%)', 'Letter Grade', 'GPA Point', 'Remark']
    ];
    const rows = data.subjects.map(s => [
      s.code, s.name, `${s.classScore}/30`, `${s.examScore}/70`, `${s.total}%`, s.grade, s.gpaPoint, s.remark
    ]);
    const footer = [
      [],
      [`Cumulative GPA: ${data.cgpa} / 4.0`, `Average Mark: ${data.averageScore}%`, `Academic Standing: ${data.standing}`]
    ];
    const csvContent = [...header, ...rows, ...footer].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Academic_Transcript_${student.fullName.replace(/\s+/g, '_')}_${student.studentId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: ADMIN_BG }}>Admin Portal</div>
              <span style={{ fontSize: 10, fontWeight: 900, padding: '2px 6px', borderRadius: 4, background: adminRole === 'head_admin' ? '#4a1d6e' : '#0284c7', color: '#fff' }}>
                {adminRole === 'head_admin' ? 'HEAD ADMIN' : 'SUB ADMIN'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#6b21a8', marginTop: 2 }}>{getAuthUser()?.fullName || getAuthUser()?.name || 'School Administration Office'}</div>

            {/* Admin Role Selector */}
            <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #e9d5ff' }}>
              <label style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#7e22ce', display: 'block', marginBottom: 4 }}>
                Switch Admin Role Access:
              </label>
              <select
                value={adminRole}
                onChange={(e) => {
                  setAdminRole(e.target.value);
                  setSuccessMsg(e.target.value === 'head_admin' ? 'Switched to Head of Admin role (Full Features & Unrestricted Access).' : 'Switched to Sub-Admin role (Restricted Privileges).');
                  setTimeout(() => setSuccessMsg(''), 5000);
                }}
                style={{ width: '100%', padding: '4px 8px', borderRadius: 6, border: '1px solid #c084fc', fontSize: 11, fontWeight: 800, background: '#fff', color: '#4c1d95', cursor: 'pointer' }}
              >
                <option value="head_admin">⚡ Head of Admin (All Features)</option>
                <option value="sub_admin">🛡️ Sub-Admin (Restricted Info)</option>
              </select>
            </div>
          </div>
          <span className="sidebar-section-label">Management</span>
          {NAV.filter(item => !(adminRole === 'sub_admin' && item.label === 'Transcripts & Results')).map((item) => (
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
          {adminRole === 'sub_admin' && (
            <div style={{
              padding: '10px 16px', background: '#e0f2fe', border: '1px solid #7dd3fc', color: '#0369a1',
              borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 12, marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={16} />
                <span><strong>Sub-Admin Restricted Access Mode:</strong> Sensitive system governance, fee structural overrides, and staff deletion are restricted to Head of Admin.</span>
              </div>
              <span style={{ fontSize: 10, background: '#0284c7', color: '#fff', padding: '2px 8px', borderRadius: 99, fontWeight: 800 }}>SUB-ADMIN</span>
            </div>
          )}

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
                            {adminRole === 'head_admin' && (
                              <button
                                onClick={() => {
                                  setViewingTranscriptStudent(s);
                                  setActiveNav('Transcripts & Results');
                                }}
                                style={{ padding: '4px 8px', background: '#f3e8ff', color: '#6b21a8', border: '1px solid #e9d5ff', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
                                title="View & Print Official Academic Transcript"
                              >
                                <FileCheck size={12} /> Transcript
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setIssuingCardStudent(s);
                                setCardForm({ rfidCardCode: s.rfidCardCode || '', dailyLimit: '50', pin: '1234', holderName: s.fullName, notes: '' });
                              }}
                              style={{ padding: '4px 8px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
                              title="Issue or Re-encode Smart RFID Card"
                            >
                              <CreditCard size={12} /> Issue Card
                            </button>
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
                                    onChange={(e) => {
                                      const newStatus = e.target.value;
                                      updateApplicationStatus(app.id, newStatus);
                                      if (newStatus === 'Accepted' || newStatus === 'Enrolled') {
                                        const contactEmail = app.email || app.fatherEmail || app.motherEmail || `parent.${(app.surname || app.learner || 'guardian').toLowerCase().replace(/[^a-z0-9]/g, '')}@remaljcarewell.edu.gh`;
                                        const defaultPass = app.defaultPassword || 'Carewell2026!';
                                        setSuccessMsg(`🎉 Application ACCEPTED! Default credentials sent to parent: Email: ${contactEmail} | Password: ${defaultPass} (Parent Portal direct access enabled - no sign in required).`);
                                        setTimeout(() => setSuccessMsg(''), 8000);
                                      }
                                    }}
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

          {/* ── CARD ISSUANCE & SMART IDENTITY VIEW ── */}
          {activeNav === 'Card Issuance & Smart Identity' && (
            <div className="animate-fade-up">
              <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h1 className="page-header__title">Smart Card Issuance & Identity Management 💳</h1>
                  <p className="page-header__subtitle">Encode RFID/NFC cards, issue student spending tags & parent pickup cards, assign card UIDs, or re-encrypt lost cards.</p>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const firstStudent = (onboardedStudents || [])[0];
                      if (firstStudent) {
                        setIssuingCardStudent(firstStudent);
                        setCardForm({ rfidCardCode: firstStudent.rfidCardCode || '', dailyLimit: '50', pin: '1234', holderName: firstStudent.fullName, notes: '' });
                      }
                    }}
                    style={{
                      padding: '10px 18px', borderRadius: 8, background: ADMIN_BG, color: '#fff',
                      border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(74, 29, 110, 0.25)'
                    }}
                  >
                    <CreditCard size={16} /> 💳 Encode & Issue Student RFID Card
                  </button>
                </div>
              </div>

              {/* Stats Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
                <div style={{ padding: '16px 20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>Issued RFID Student Cards</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#14532d', marginTop: 4 }}>
                    {(onboardedStudents || []).filter(s => s.rfidCardCode).length}
                  </div>
                  <div style={{ fontSize: 11, color: '#15803d', fontWeight: 600, marginTop: 2 }}>Active RFID tags encoded</div>
                </div>

                <div style={{ padding: '16px 20px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#1e40af', textTransform: 'uppercase' }}>Parent Pickup Cards</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#1e3a8a', marginTop: 4 }}>
                    {(onboardedStudents || []).filter(s => s.parentPickupCardIssued).length || 2}
                  </div>
                  <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 600, marginTop: 2 }}>Verified guardian pickup passes</div>
                </div>

                <div style={{ padding: '16px 20px', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#6b21a8', textTransform: 'uppercase' }}>Smart Encryption Status</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#581c87', marginTop: 4 }}>100%</div>
                  <div style={{ fontSize: 11, color: '#7e22ce', fontWeight: 600, marginTop: 2 }}>NFC 13.56MHz AES Encrypted</div>
                </div>
              </div>

              {/* Card Registry Search Bar */}
              <div style={{ position: 'relative', marginBottom: 16 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--gray-400)' }} />
                <input
                  type="text"
                  placeholder="🔎 Search card registry by Student Name, Student ID, RFID Card UID, or Guardian..."
                  value={cardSearchQuery}
                  onChange={(e) => setCardSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 8, border: '1px solid var(--gray-300)', fontSize: 13, background: '#fff' }}
                />
              </div>

              {/* Card Registry Table */}
              <div className="panel">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Student Name</th>
                      <th>Class Level</th>
                      <th>Issued RFID Card UID</th>
                      <th>Parent Pickup Pass</th>
                      <th>Spending Limit</th>
                      <th>Administrative Card Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(onboardedStudents || []).filter(s => {
                      const q = cardSearchQuery.toLowerCase();
                      return (s.fullName || '').toLowerCase().includes(q) ||
                             (s.studentId || '').toLowerCase().includes(q) ||
                             (s.rfidCardCode || '').toLowerCase().includes(q) ||
                             (s.guardianName || '').toLowerCase().includes(q);
                    }).map((student) => (
                      <tr key={student.id}>
                        <td><code>{student.studentId}</code></td>
                        <td><strong>{student.fullName}</strong></td>
                        <td><span className="level-badge">{student.level}</span></td>
                        <td>
                          {student.rfidCardCode ? (
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#15803d', background: '#dcfce7', padding: '3px 10px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'monospace' }}>
                              <CreditCard size={13} /> {student.rfidCardCode}
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>Not Issued Yet</span>
                          )}
                        </td>
                        <td>
                          {student.parentPickupCardIssued ? (
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#1e40af', background: '#dbeafe', padding: '3px 9px', borderRadius: 99 }}>
                              ✅ Guardian Card Issued
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, color: '#64748b' }}>Pending Issue</span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-900)' }}>
                            GHS {student.dailyLimit || '50.00'} / day
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => {
                                setIssuingCardStudent(student);
                                setCardForm({ rfidCardCode: student.rfidCardCode || '', dailyLimit: student.dailyLimit || '50', pin: '1234', holderName: student.fullName, notes: '' });
                              }}
                              style={{
                                padding: '6px 12px', borderRadius: 6, background: '#0284c7', color: '#fff',
                                border: 'none', fontWeight: 800, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                              }}
                            >
                              <CreditCard size={13} /> Encode & Issue Card
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIssuingParentCardStudent(student);
                                setCardForm({ rfidCardCode: student.parentCardCode || `PCARD-${Date.now().toString().slice(-6)}`, dailyLimit: '50', pin: '1234', holderName: student.guardianName, notes: '' });
                              }}
                              style={{
                                padding: '6px 12px', borderRadius: 6, background: '#4a1d6e', color: '#fff',
                                border: 'none', fontWeight: 800, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                              }}
                            >
                              👨‍👩‍👧 Issue Parent Pickup Card
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

          {/* ── TRANSCRIPTS & RESULTS MASTER REGISTER ── */}
          {activeNav === 'Transcripts & Results' && adminRole === 'head_admin' && (
            <div className="animate-fade-up">
              {/* Page Header */}
              <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <p className="page-header__eyebrow" style={{ color: ADMIN_ACCENT }}>
                    <span style={{ background: ADMIN_LIGHT, padding: '2px 10px', borderRadius: 99, border: '1px solid #d8b4fe' }}>
                      Academic Records & Evaluation Centre
                    </span>
                  </p>
                  <h1 className="page-header__title">Academic Transcripts & Master Results 📜</h1>
                  <p className="page-header__subtitle">
                    View and filter student results by name or class across all grade levels (Primary 1 to SHS 3), calculate CGPAs, and print or export official academic transcripts.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleExportClassResultsCSV(filteredTranscriptStudents)}
                    style={{
                      padding: '10px 16px', borderRadius: 8, background: '#166534', color: '#fff',
                      border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(22, 101, 52, 0.2)'
                    }}
                  >
                    <Download size={15} /> Export Filtered Results (CSV)
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    style={{
                      padding: '10px 16px', borderRadius: 8, background: ADMIN_BG, color: '#fff',
                      border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(74, 29, 110, 0.2)'
                    }}
                  >
                    <Printer size={15} /> Print Class Results Sheet
                  </button>
                </div>
              </div>

              {/* Academic Head Results Moderation & Approval Board */}
              <div className="panel" style={{ marginBottom: 24, border: '2px solid #e9d5ff' }}>
                <div className="panel__header" style={{ background: '#f3e8ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 className="panel__title" style={{ color: '#4c1d95', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileCheck size={18} /> Academic Head Results Moderation Board
                  </h2>
                  <span className="status-pill status-pill--info">
                    {(results || []).filter(r => r.status === 'Pending Approval').length} Pending Review
                  </span>
                </div>

                <div className="panel__body" style={{ padding: 0, overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Course Title</th>
                        <th>Lecturer / Author</th>
                        <th>Submitted Mark</th>
                        <th>Grade</th>
                        <th>Approval Status</th>
                        <th style={{ textAlign: 'right' }}>Academic Head Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(results || []).map((r) => (
                        <tr key={r.id || r.subject} style={{ background: r.status === 'Declined' ? '#fff1f2' : r.status === 'Pending Approval' ? '#fffbeb' : 'transparent' }}>
                          <td><strong>{r.subject}</strong></td>
                          <td>{r.lecturer}</td>
                          <td><span style={{ fontWeight: 800 }}>{r.score}%</span></td>
                          <td><span className="status-pill status-pill--success">{r.grade}</span></td>
                          <td>
                            {r.status === 'Approved' ? (
                              <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 800, background: '#dcfce7', color: '#166534' }}>
                                🟢 Approved by Academic Head
                              </span>
                            ) : r.status === 'Declined' ? (
                              <div>
                                <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 800, background: '#fee2e2', color: '#dc2626' }}>
                                  🔴 Declined with Red Error Note
                                </span>
                                {r.declineNote && (
                                  <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4, fontWeight: 700 }}>
                                    Note: "{r.declineNote}"
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 800, background: '#fef3c7', color: '#92400e' }}>
                                🟡 Pending Academic Review
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {adminRole === 'sub_admin' ? (
                              <span style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>
                                🔒 Restricted to Head of Admin
                              </span>
                            ) : (
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => {
                                    approveResult(r.id);
                                    setSuccessMsg(`Result for ${r.subject} APPROVED by Academic Head! Published to official transcripts.`);
                                    setTimeout(() => setSuccessMsg(''), 5000);
                                  }}
                                  style={{ padding: '5px 12px', background: '#166534', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
                                >
                                  ✅ Approve Result
                                </button>

                                <button
                                  onClick={() => {
                                    setDeclineResultModal(r);
                                    setDeclineInputNote(r.declineNote || '');
                                  }}
                                  style={{ padding: '5px 12px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
                                >
                                  ❌ Decline (Red Error Note)
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Search & Filter Control Bar */}
              <div style={{ background: '#fff', padding: '16px 20px', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', marginBottom: 20, border: '1px solid var(--gray-200)' }}>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* Name / ID Search */}
                  <div style={{ flex: 2, minWidth: 260, position: 'relative' }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--gray-500)', marginBottom: 4 }}>
                      🔍 Filter Student Name or ID
                    </label>
                    <div className="search-bar" style={{ width: '100%' }}>
                      <Search size={15} className="search-bar__icon" />
                      <input
                        type="text"
                        className="search-bar__input"
                        placeholder="Type student name, ID, or guardian to filter..."
                        value={transcriptSearch}
                        onChange={(e) => setTranscriptSearch(e.target.value)}
                      />
                      {transcriptSearch && (
                        <button
                          type="button"
                          onClick={() => setTranscriptSearch('')}
                          style={{ position: 'absolute', right: 12, top: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)' }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Class Level Filter */}
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--gray-500)', marginBottom: 4 }}>
                      🏫 Class / Grade Level
                    </label>
                    <select
                      value={transcriptClassFilter}
                      onChange={(e) => setTranscriptClassFilter(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--gray-300)', fontSize: 13, fontWeight: 700 }}
                    >
                      <option value="All">All Classes (P1 - SHS 3)</option>
                      {LEVEL_OPTIONS.map((lvl) => <option key={lvl} value={lvl}>{lvl}</option>)}
                    </select>
                  </div>

                  {/* Term Filter */}
                  <div style={{ flex: 1, minWidth: 150 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--gray-500)', marginBottom: 4 }}>
                      📅 Academic Term
                    </label>
                    <select
                      value={transcriptTermFilter}
                      onChange={(e) => setTranscriptTermFilter(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid var(--gray-300)', fontSize: 13, fontWeight: 700 }}
                    >
                      <option value="Term 1 · 2026">Term 1 · 2026</option>
                      <option value="Term 2 · 2026">Term 2 · 2026</option>
                      <option value="Term 3 · 2026">Term 3 · 2026</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Summary Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
                <div style={{ padding: '16px 20px', background: '#f3e8ff', border: '1px solid #e9d5ff', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#6b21a8' }}>Matching Students</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#4c1d95', marginTop: 4 }}>{filteredTranscriptStudents.length}</div>
                  <div style={{ fontSize: 11, color: '#7e22ce', marginTop: 2 }}>{transcriptClassFilter === 'All' ? 'Across all classes' : transcriptClassFilter}</div>
                </div>
                <div style={{ padding: '16px 20px', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#166534' }}>Overall Class Average</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#14532d', marginTop: 4 }}>
                    {filteredTranscriptStudents.length > 0
                      ? `${(filteredTranscriptStudents.reduce((acc, s) => acc + Number(getStudentTranscriptData(s).averageScore), 0) / filteredTranscriptStudents.length).toFixed(1)}%`
                      : '0%'}
                  </div>
                  <div style={{ fontSize: 11, color: '#15803d', marginTop: 2 }}>Term Average Score</div>
                </div>
                <div style={{ padding: '16px 20px', background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#0369a1' }}>Mean CGPA</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#0c4a6e', marginTop: 4 }}>
                    {filteredTranscriptStudents.length > 0
                      ? (filteredTranscriptStudents.reduce((acc, s) => acc + Number(getStudentTranscriptData(s).cgpa), 0) / filteredTranscriptStudents.length).toFixed(2)
                      : '0.00'}
                  </div>
                  <div style={{ fontSize: 11, color: '#0284c7', marginTop: 2 }}>Out of 4.0 Scale</div>
                </div>
                <div style={{ padding: '16px 20px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#92400e' }}>Distinction Students</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#78350f', marginTop: 4 }}>
                    {filteredTranscriptStudents.filter(s => Number(getStudentTranscriptData(s).cgpa) >= 3.5).length}
                  </div>
                  <div style={{ fontSize: 11, color: '#b45309', marginTop: 2 }}>GPA 3.5 or higher</div>
                </div>
              </div>

              {/* Master Results Table */}
              <div className="panel">
                <div className="panel__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 className="panel__title">Master Class Transcripts Register</h2>
                  <span className="status-pill status-pill--info">{filteredTranscriptStudents.length} records</span>
                </div>

                <div className="panel__body" style={{ padding: 0, overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student ID</th>
                        <th>Student Name</th>
                        <th>Class Level</th>
                        <th>Guardian</th>
                        <th>Avg Score (%)</th>
                        <th>CGPA</th>
                        <th>Standing / Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTranscriptStudents.map((student) => {
                        const tData = getStudentTranscriptData(student);
                        return (
                          <tr key={student.id}>
                            <td><code>{student.studentId}</code></td>
                            <td>
                              <strong>{student.fullName}</strong>
                              <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{student.gender || 'Student'}</div>
                            </td>
                            <td><span style={{ fontWeight: 700 }}>{student.level} ({student.classSection || 'A'})</span></td>
                            <td>
                              <div>{student.guardianName}</div>
                              <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{student.guardianPhone}</div>
                            </td>
                            <td>
                              <span style={{ fontWeight: 800, fontSize: 14, color: Number(tData.averageScore) >= 75 ? '#166534' : '#92400e' }}>
                                {tData.averageScore}%
                              </span>
                            </td>
                            <td>
                              <span style={{ fontWeight: 900, fontSize: 15, color: ADMIN_ACCENT }}>
                                {tData.cgpa}
                              </span>
                            </td>
                            <td>
                              <span style={{
                                padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 800,
                                background: Number(tData.cgpa) >= 3.6 ? '#dcfce7' : Number(tData.cgpa) >= 3.0 ? '#e0f2fe' : '#fef3c7',
                                color: Number(tData.cgpa) >= 3.6 ? '#166534' : Number(tData.cgpa) >= 3.0 ? '#0369a1' : '#92400e'
                              }}>
                                {tData.standing}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => setViewingTranscriptStudent(student)}
                                  style={{
                                    padding: '6px 12px', background: ADMIN_BG, color: '#fff',
                                    border: 'none', borderRadius: 6, cursor: 'pointer',
                                    fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4,
                                    boxShadow: '0 2px 6px rgba(74,29,110,0.2)'
                                  }}
                                >
                                  <Eye size={13} /> View Transcript PDF
                                </button>
                                <button
                                  onClick={() => handleExportSingleTranscriptCSV(student)}
                                  style={{
                                    padding: '6px 10px', background: '#f1f5f9', color: '#334155',
                                    border: '1px solid #cbd5e1', borderRadius: 6, cursor: 'pointer',
                                    fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4
                                  }}
                                >
                                  <Download size={13} /> CSV
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredTranscriptStudents.length === 0 && (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--gray-500)' }}>
                            No student transcript records found matching "{transcriptSearch}" in {transcriptClassFilter}.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
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

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setIsAddingClass(true)}
                    style={{
                      padding: '10px 16px', borderRadius: 8, background: '#1e1b4b', color: '#fff',
                      border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(30, 27, 75, 0.25)'
                    }}
                  >
                    <School size={16} /> 🏫 ➕ Add New Class
                  </button>

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

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <select
                      value={staffSubjectFilter}
                      onChange={(e) => setStaffSubjectFilter(e.target.value)}
                      style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--gray-300)', fontSize: 12.5, fontWeight: 700, background: '#fff', flexGrow: 1 }}
                    >
                      <option value="All">All Subjects / Departments</option>
                      {SUBJECT_OPTIONS.map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => setIsAddingSubject(true)}
                      title="Add New Subject / Department"
                      style={{
                        padding: '9px 12px',
                        borderRadius: 8,
                        background: 'var(--ics-green-600)',
                        color: '#ffffff',
                        border: 'none',
                        fontWeight: 900,
                        fontSize: 14,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 6px rgba(22, 101, 52, 0.25)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>

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

          {/* ── ADD NEW CLASS LEVEL MODAL ── */}
          {isAddingClass && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20
            }}>
              <div style={{ background: '#fff', width: '100%', maxWidth: 480, borderRadius: 14, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden' }} className="animate-fade-up">
                <div style={{ background: '#1e1b4b', padding: '18px 24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>🏫 Create New Class Level</h3>
                    <p style={{ fontSize: 12, opacity: 0.9, margin: '2px 0 0 0' }}>Add new classes (e.g. Primary 7, Creche Gold, Nursery 1, SHS 3 Business).</p>
                  </div>
                  <button onClick={() => setIsAddingClass(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: 15, cursor: 'pointer', fontWeight: 900 }}>✕</button>
                </div>

                <form onSubmit={handleAddClassSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <label>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-800)' }}>New Class Level Name *</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Primary 7, Creche Gold, Nursery 2, SHS 3 Business..."
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--gray-300)', fontSize: 13, marginTop: 4, fontWeight: 600 }}
                      autoFocus
                    />
                  </label>

                  <label>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-800)' }}>Class Category / Stream</span>
                    <select
                      value={newClassCategory}
                      onChange={(e) => setNewClassCategory(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--gray-300)', fontSize: 13, marginTop: 4, fontWeight: 700 }}
                    >
                      <option>Primary School</option>
                      <option>Junior High School (JHS)</option>
                      <option>Senior High School (SHS)</option>
                      <option>Creche & Early Years</option>
                    </select>
                  </label>

                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => setIsAddingClass(false)}
                      style={{ flex: 1, padding: 10, border: '1px solid var(--gray-300)', borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 700 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{ flex: 1, padding: 10, border: 'none', borderRadius: 8, background: '#1e1b4b', color: '#fff', fontWeight: 900, cursor: 'pointer' }}
                    >
                      🏫 Create Class Level
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── ADD NEW SUBJECT / DEPARTMENT MODAL ── */}
          {isAddingSubject && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20
            }}>
              <div style={{ background: '#fff', width: '100%', maxWidth: 480, borderRadius: 14, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden' }} className="animate-fade-up">
                <div style={{ background: 'var(--ics-green-700)', padding: '18px 24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>📚 Add New Subject / Department</h3>
                    <p style={{ fontSize: 12, opacity: 0.9, margin: '2px 0 0 0' }}>Register new subjects e.g. French, Robotics, Creative Arts, Economics.</p>
                  </div>
                  <button onClick={() => setIsAddingSubject(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: 15, cursor: 'pointer', fontWeight: 900 }}>✕</button>
                </div>

                <form onSubmit={handleAddSubjectSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <label>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-800)' }}>New Subject / Department Name *</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. French, Robotics & AI, Creative Arts, Elective Maths..."
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--gray-300)', fontSize: 13, marginTop: 4, fontWeight: 600 }}
                      autoFocus
                    />
                  </label>

                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => setIsAddingSubject(false)}
                      style={{ flex: 1, padding: 10, border: '1px solid var(--gray-300)', borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 700 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{ flex: 1, padding: 10, border: 'none', borderRadius: 8, background: 'var(--ics-green-600)', color: '#fff', fontWeight: 900, cursor: 'pointer' }}
                    >
                      📚 Add Subject & Update Filter
                    </button>
                  </div>
                </form>
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

          {/* ── ISSUE / ENCODE STUDENT RFID CARD MODAL ── */}
          {issuingCardStudent && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20
            }}>
              <div style={{ background: '#fff', width: '100%', maxWidth: 520, borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden' }} className="animate-fade-up">
                <div style={{ background: ADMIN_BG, padding: '18px 24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>💳 Encode & Issue Student Smart RFID Card</h3>
                    <p style={{ fontSize: 12, opacity: 0.9, margin: '2px 0 0 0' }}>Assign RFID/NFC Tag UID to {issuingCardStudent.fullName} ({issuingCardStudent.studentId})</p>
                  </div>
                  <button onClick={() => setIssuingCardStudent(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: 15, cursor: 'pointer', fontWeight: 900 }}>✕</button>
                </div>

                <form onSubmit={handleIssueStudentCardSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>Learner: {issuingCardStudent.fullName}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>ID: <code>{issuingCardStudent.studentId}</code> | Grade: {issuingCardStudent.level} | Guardian: {issuingCardStudent.guardianName}</div>
                  </div>

                  <label>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-800)' }}>RFID / NFC Card Hardware UID *</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. RFID-8849-2026 or tap RFID scanner"
                      value={cardForm.rfidCardCode}
                      onChange={(e) => setCardForm({ ...cardForm, rfidCardCode: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--gray-300)', fontSize: 13, marginTop: 4, fontWeight: 700, fontFamily: 'monospace' }}
                      autoFocus
                    />
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <label>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-800)' }}>Daily Canteen Limit (GHS)</span>
                      <input
                        type="number"
                        min="0"
                        value={cardForm.dailyLimit}
                        onChange={(e) => setCardForm({ ...cardForm, dailyLimit: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--gray-300)', fontSize: 13, marginTop: 4, fontWeight: 700 }}
                      />
                    </label>

                    <label>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-800)' }}>Card Security PIN</span>
                      <input
                        type="text"
                        maxLength="4"
                        value={cardForm.pin}
                        onChange={(e) => setCardForm({ ...cardForm, pin: e.target.value })}
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--gray-300)', fontSize: 13, marginTop: 4, fontWeight: 700, letterSpacing: 2 }}
                      />
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => setIssuingCardStudent(null)}
                      style={{ flex: 1, padding: 10, border: '1px solid var(--gray-300)', borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 700 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{ flex: 1, padding: 10, border: 'none', borderRadius: 8, background: ADMIN_BG, color: '#fff', fontWeight: 900, cursor: 'pointer' }}
                    >
                      💳 Write & Activate RFID Card
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── ISSUE PARENT PICKUP CARD MODAL ── */}
          {issuingParentCardStudent && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20
            }}>
              <div style={{ background: '#fff', width: '100%', maxWidth: 520, borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden' }} className="animate-fade-up">
                <div style={{ background: '#4a1d6e', padding: '18px 24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>👨‍👩‍👧 Issue Official Parent Pickup Pass</h3>
                    <p style={{ fontSize: 12, opacity: 0.9, margin: '2px 0 0 0' }}>Authorized Security Pickup Pass for {issuingParentCardStudent.guardianName}</p>
                  </div>
                  <button onClick={() => setIssuingParentCardStudent(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: 15, cursor: 'pointer', fontWeight: 900 }}>✕</button>
                </div>

                <form onSubmit={handleIssueParentCardSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ background: '#faf5ff', padding: 12, borderRadius: 8, border: '1px solid #e9d5ff', fontSize: 13 }}>
                    <div style={{ fontWeight: 800, color: '#4c1d95' }}>Guardian: {issuingParentCardStudent.guardianName}</div>
                    <div style={{ fontSize: 12, color: '#6b21a8', marginTop: 2 }}>Associated Student: {issuingParentCardStudent.fullName} (<code>{issuingParentCardStudent.studentId}</code>)</div>
                  </div>

                  <label>
                    <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-800)' }}>Parent Pickup Pass Serial / Barcode Code *</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PCARD-993821"
                      value={cardForm.rfidCardCode}
                      onChange={(e) => setCardForm({ ...cardForm, rfidCardCode: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--gray-300)', fontSize: 13, marginTop: 4, fontWeight: 700, fontFamily: 'monospace' }}
                      autoFocus
                    />
                  </label>

                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => setIssuingParentCardStudent(null)}
                      style={{ flex: 1, padding: 10, border: '1px solid var(--gray-300)', borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 700 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{ flex: 1, padding: 10, border: 'none', borderRadius: 8, background: '#4a1d6e', color: '#fff', fontWeight: 900, cursor: 'pointer' }}
                    >
                      👨‍👩‍👧 Issue & Print Parent Pass
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {/* Decline Result Error Note Modal */}
          {declineResultModal && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(4px)',
              zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20
            }}>
              <div style={{ width: '100%', maxWidth: 500, background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ margin: 0, color: '#dc2626', fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 900 }}>
                    🔴 Decline Result & Flag Error Note
                  </h3>
                  <button onClick={() => setDeclineResultModal(null)} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer' }}>✖</button>
                </div>

                <div style={{ fontSize: 13, color: 'var(--gray-700)', marginBottom: 14 }}>
                  Flag error in <strong>{declineResultModal.subject}</strong> submitted by {declineResultModal.lecturer}. The red error note typed below will be sent to the teacher to correct and resubmit.
                </div>

                <label style={{ display: 'block', marginBottom: 16 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#dc2626' }}>Red Error / Rejection Reason Note *</span>
                  <textarea
                    rows={4}
                    required
                    placeholder="e.g. Calculation error on Exam Section B total (48% score mismatch). Please re-check student exam total and resubmit."
                    value={declineInputNote}
                    onChange={(e) => setDeclineInputNote(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid #fca5a5', fontSize: 13, marginTop: 4, fontFamily: 'sans-serif' }}
                  />
                </label>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setDeclineResultModal(null)}
                    style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid var(--gray-300)', background: '#fff', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!declineInputNote.trim()) return;
                      declineResult(declineResultModal.id, declineInputNote);
                      setDeclineResultModal(null);
                      setSuccessMsg(`Result for ${declineResultModal.subject} DECLINED with red error note sent to teacher.`);
                      setTimeout(() => setSuccessMsg(''), 5000);
                    }}
                    style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 900, cursor: 'pointer' }}
                  >
                    🔴 Decline with Red Error Note
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Printable Official Transcript Document Modal */}
          {viewingTranscriptStudent && (
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(4px)',
              zIndex: 9999, overflowY: 'auto', padding: '30px 16px',
              display: 'flex', justifyContent: 'center', alignItems: 'flex-start'
            }}>
              <div style={{
                width: '100%', maxWidth: 860, background: '#fff', borderRadius: 16,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
                animation: 'fadeUp 0.2s ease-out'
              }}>
                {/* Top Bar for Modal Actions (hidden on print) */}
                <div className="no-print" style={{
                  padding: '14px 24px', background: '#1e1b4b', color: '#fff',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>
                    📜 Official Student Transcript — {viewingTranscriptStudent.fullName}
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button
                      onClick={() => handleExportSingleTranscriptCSV(viewingTranscriptStudent)}
                      style={{
                        padding: '6px 14px', borderRadius: 6, background: 'rgba(255,255,255,0.15)',
                        color: '#fff', border: '1px solid rgba(255,255,255,0.3)', fontWeight: 800,
                        fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      <Download size={14} /> Download CSV
                    </button>

                    <button
                      onClick={() => window.print()}
                      style={{
                        padding: '6px 16px', borderRadius: 6, background: '#166534',
                        color: '#fff', border: 'none', fontWeight: 900,
                        fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      <Printer size={14} /> Print / Save PDF
                    </button>

                    <button
                      onClick={() => setViewingTranscriptStudent(null)}
                      style={{
                        padding: '6px 12px', borderRadius: 6, background: '#dc2626',
                        color: '#fff', border: 'none', fontWeight: 800,
                        fontSize: 12, cursor: 'pointer'
                      }}
                    >
                      Close ✖
                    </button>
                  </div>
                </div>

                {/* Printable Official Transcript Document Body */}
                <div className="official-transcript-printable" style={{ padding: 40, color: '#0f172a', fontFamily: 'var(--font-main, sans-serif)' }}>
                  {/* School Header Box */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '3px double #1e1b4b', paddingBottom: 20, marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <img src="/remalj-carewell-logo.jpg" alt="REMALJ Carewell Logo" style={{ height: 70, width: 'auto', borderRadius: 6 }} />
                      <div>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: '#1e1b4b', margin: 0, letterSpacing: '0.03em' }}>
                          REMALJ CAREWELL INSPIRATIONAL SCHOOL
                        </h2>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginTop: 2 }}>
                          P.O. Box 144, Anikoko Junction, Bogoso · Western Region, Ghana
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                          Tel: +233 24 111 2222 | Email: info@remaljcarewell.edu.gh | Web: www.remaljcarewell.edu.gh
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', borderLeft: '2px solid #e2e8f0', paddingLeft: 16 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '.08em' }}>DOCUMENT ID</div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 13, color: '#1e1b4b' }}>TR-2026-{viewingTranscriptStudent.studentId.replace(/\D/g, '')}</div>
                      <div style={{ fontSize: 10, color: '#166534', fontWeight: 800, marginTop: 4, background: '#dcfce7', padding: '2px 8px', borderRadius: 99, display: 'inline-block' }}>
                        OFFICIAL VERIFIED
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, letterSpacing: '0.08em', color: '#1e1b4b', textTransform: 'uppercase', margin: 0 }}>
                      OFFICIAL ACADEMIC TRANSCRIPT & EVALUATION REPORT
                    </h3>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginTop: 4 }}>
                      ACADEMIC YEAR 2025/2026 · TERM 1 & CUMULATIVE STANDING
                    </div>
                  </div>

                  {/* Student Metadata Box */}
                  {(() => {
                    const tData = getStudentTranscriptData(viewingTranscriptStudent);
                    return (
                      <>
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 18, marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                          <div>
                            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Student Full Name:</span>
                            <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>{viewingTranscriptStudent.fullName}</div>
                          </div>
                          <div>
                            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Official Student ID:</span>
                            <div style={{ fontSize: 15, fontWeight: 900, color: '#1e1b4b', fontFamily: 'monospace' }}>{viewingTranscriptStudent.studentId}</div>
                          </div>
                          <div>
                            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Class Level & Section:</span>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{viewingTranscriptStudent.level} (Section {viewingTranscriptStudent.classSection || 'A'})</div>
                          </div>
                          <div>
                            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Parent / Guardian:</span>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{viewingTranscriptStudent.guardianName} ({viewingTranscriptStudent.guardianPhone || 'N/A'})</div>
                          </div>
                          <div>
                            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Date of Birth / Gender:</span>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{viewingTranscriptStudent.dob || '2014-05-12'} · {viewingTranscriptStudent.gender || 'Male'}</div>
                          </div>
                          <div>
                            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Enrollment Date:</span>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{viewingTranscriptStudent.enrollmentDate || '2026-09-01'}</div>
                          </div>
                        </div>

                        {/* Course Breakdown Table */}
                        <div style={{ marginBottom: 24 }}>
                          <h4 style={{ fontSize: 14, fontWeight: 900, textTransform: 'uppercase', color: '#1e1b4b', marginBottom: 10, letterSpacing: '.04em' }}>
                            📚 Course Assessment & Final Mark Breakdown
                          </h4>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                            <thead>
                              <tr style={{ background: '#1e1b4b', color: '#fff' }}>
                                <th style={{ padding: '10px 12px', border: '1px solid #1e1b4b' }}>Code</th>
                                <th style={{ padding: '10px 12px', border: '1px solid #1e1b4b' }}>Course Title</th>
                                <th style={{ padding: '10px 12px', border: '1px solid #1e1b4b', textAlign: 'center' }}>Class (30%)</th>
                                <th style={{ padding: '10px 12px', border: '1px solid #1e1b4b', textAlign: 'center' }}>Exam (70%)</th>
                                <th style={{ padding: '10px 12px', border: '1px solid #1e1b4b', textAlign: 'center' }}>Total (100%)</th>
                                <th style={{ padding: '10px 12px', border: '1px solid #1e1b4b', textAlign: 'center' }}>Grade</th>
                                <th style={{ padding: '10px 12px', border: '1px solid #1e1b4b', textAlign: 'center' }}>GPA Pt</th>
                                <th style={{ padding: '10px 12px', border: '1px solid #1e1b4b' }}>Remarks</th>
                              </tr>
                            </thead>
                            <tbody>
                              {tData.subjects.map((sub, idx) => (
                                <tr key={sub.code} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                  <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontWeight: 800 }}>{sub.code}</td>
                                  <td style={{ padding: '9px 12px', fontWeight: 700 }}>{sub.name}</td>
                                  <td style={{ padding: '9px 12px', textAlign: 'center', color: '#475569' }}>{sub.classScore}/30</td>
                                  <td style={{ padding: '9px 12px', textAlign: 'center', color: '#475569' }}>{sub.examScore}/70</td>
                                  <td style={{ padding: '9px 12px', textAlign: 'center', fontWeight: 900, color: sub.total >= 75 ? '#166534' : '#0f172a' }}>{sub.total}%</td>
                                  <td style={{ padding: '9px 12px', textAlign: 'center', fontWeight: 900, color: '#4a1d6e' }}>{sub.grade}</td>
                                  <td style={{ padding: '9px 12px', textAlign: 'center', fontWeight: 800 }}>{sub.gpaPoint.toFixed(1)}</td>
                                  <td style={{ padding: '9px 12px', fontWeight: 700, color: sub.total >= 70 ? '#166534' : '#92400e' }}>{sub.remark}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Cumulative GPA Summary Card */}
                        <div style={{ background: '#1e1b4b', color: '#fff', borderRadius: 10, padding: 20, marginBottom: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', opacity: 0.75, letterSpacing: '.07em' }}>CUMULATIVE PERFORMANCE SUMMARY</div>
                            <div style={{ fontSize: 18, fontWeight: 900, marginTop: 4 }}>Academic Standing: {tData.standing}</div>
                            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{tData.subjects.length} Total Subjects Assessed · Term 1 2026</div>
                          </div>

                          <div style={{ display: 'flex', gap: 16 }}>
                            <div style={{ background: 'rgba(255,255,255,0.12)', padding: '10px 18px', borderRadius: 8, textAlign: 'center' }}>
                              <div style={{ fontSize: 24, fontWeight: 900 }}>{tData.averageScore}%</div>
                              <div style={{ fontSize: 10, opacity: 0.8, textTransform: 'uppercase' }}>Average Mark</div>
                            </div>
                            <div style={{ background: '#166534', padding: '10px 22px', borderRadius: 8, textAlign: 'center' }}>
                              <div style={{ fontSize: 24, fontWeight: 900 }}>{tData.cgpa}</div>
                              <div style={{ fontSize: 10, opacity: 0.9, textTransform: 'uppercase' }}>CGPA (4.0 Max)</div>
                            </div>
                          </div>
                        </div>

                        {/* Signatures & Verification Stamp */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 40, paddingTop: 20, borderTop: '2px dashed #cbd5e1' }}>
                          <div style={{ textAlign: 'center', width: 220 }}>
                            <div style={{ height: 40, borderBottom: '1px solid #0f172a', marginBottom: 6 }}>
                              <span style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: 18, color: '#1e1b4b', display: 'block', paddingTop: 8 }}>S. Amponsah</span>
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>Mr. Samuel Amponsah</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>Head of Academic Board</div>
                          </div>

                          <div style={{ textAlign: 'center' }}>
                            <div style={{ width: 90, height: 90, border: '3px double #1e1b4b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: '#1e1b4b', fontWeight: 900, fontSize: 10, textTransform: 'uppercase', textAlign: 'center', padding: 8 }}>
                              REMALJ CAREWELL OFFICIAL SEAL
                            </div>
                            <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>Issued: {new Date().toLocaleDateString()}</div>
                          </div>

                          <div style={{ textAlign: 'center', width: 220 }}>
                            <div style={{ height: 40, borderBottom: '1px solid #0f172a', marginBottom: 6 }}>
                              <span style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: 18, color: '#1e1b4b', display: 'block', paddingTop: 8 }}>J. Admin</span>
                            </div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>Mr. John Admin</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>Registrar / Headmaster</div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
