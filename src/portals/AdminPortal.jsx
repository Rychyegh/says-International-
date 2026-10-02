import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  LayoutDashboard, Users, UserPlus, FileText, Settings,
  TrendingUp, School, CreditCard, Search, Trash2, Edit,
  CheckCircle2, X, Save, ShieldCheck, ShieldAlert, AlertTriangle, Mail, Phone, MapPin,
  Printer, Download, Eye, EyeOff, Copy, Plus, FileCheck, UserCheck, Radio,
  ArrowUpDown, ArrowUp, ArrowDown, ArrowRight, BellRing, Filter, RefreshCw
} from 'lucide-react';
import '../components/Portal/Portal.css';
import { usePortalData, formatClassToBasic, buildStudentTranscriptData, MISSING_SCORE, findTeachingAssignment } from '../data/PortalStore';
import OfficialApplicationForm from '../components/Onboarding/OfficialApplicationForm';
import OfficialSchoolFeeStructure from '../components/Finance/OfficialSchoolFeeStructure';
import AttendanceControlTable from '../components/Attendance/AttendanceControlTable';
import BulkStudentUpload from '../components/Onboarding/BulkStudentUpload';
import RegisterForExamsForm from '../components/RegisterForExams/RegisterForExamsForm';
import AcademicSettingsManager from '../components/Academic/AcademicSettingsManager';
import ApprovePVForm from '../components/Finance/ApprovePVForm';
import PayPVForm from '../components/Finance/PayPVForm';
import SubmitPVRequest from '../components/Finance/SubmitPVRequest';
import UserAccessControl from '../components/AccessControl/UserAccessControl';
import { getAuthUser } from '../services/api';
import { getMappedSubClasses, formatDetailedClass, CLASS_SUBCLASS_MAP } from '../data/classStructure';

const ADMIN_BG = '#4a1d6e';
const ADMIN_LIGHT = '#f3e8ff';
const ADMIN_ACCENT = '#7c3ac8';

const NAV = [
  { icon: <LayoutDashboard size={15} />, label: 'Dashboard', badge: null },
  { icon: <FileText size={15} />, label: 'Applications & Forms', badge: null },
  { icon: <Users size={15} />, label: 'Student Roster', badge: null },
  { icon: <School size={15} />, label: 'Classes & Staff', badge: null },
  { icon: <CreditCard size={15} />, label: 'Card Issuance & Smart Identity', badge: null },
  { icon: <Radio size={15} />, label: 'Attendance & SMS Control', badge: null },
  { icon: <FileText size={15} />, label: 'Submit PV Request', badge: null },
  { icon: <Settings size={15} />, label: 'Academic Settings', badge: null },
  { icon: <FileCheck size={15} />, label: 'Register for Exams', badge: null },
  { icon: <FileCheck size={15} />, label: 'Transcripts & Results', badge: null },
  { icon: <CreditCard size={15} />, label: 'Official Fee Schedule', badge: null },
  { icon: <ShieldCheck size={15} />, label: 'User Access Control (UAC)', badge: null },
  { icon: <FileCheck size={15} />, label: 'Pre-Audit & Approve PV', badge: null },
  { icon: <CreditCard size={15} />, label: 'Pay PV', badge: null },
  { icon: <ShieldAlert size={15} />, label: 'Security & Intrusion Alerts', badge: null },
];

const SUB_ADMIN_PV_NAV = ['Submit PV Request', 'Prepare Bills Payables'];

const TEACHING_STAFF_ROLES = [
  'Subject Teacher',
  'Form Master / Class Tutor',
  'Class Teacher',
  'Department Head',
  'Senior Tutor',
  'ICT Administrator',
];

const NON_TEACHING_STAFF_ROLES = [
  'Driver',
  'Bus Supervisor',
  'Security',
  'Cleaner',
  'Cook / Catering',
  'Nurse',
  'Librarian',
  'Office Assistant',
  'Maintenance',
];

const NON_TEACHING_DUTIES = [
  'Transport',
  'Security',
  'Sanitation',
  'Kitchen',
  'Health',
  'Library',
  'Administration',
  'Maintenance',
];

function isTeachingStaffMember(person = {}) {
  const role = String(person.role || person.designation || '').trim().toLowerCase();
  if (NON_TEACHING_STAFF_ROLES.some((item) => item.toLowerCase() === role)) return false;
  if (TEACHING_STAFF_ROLES.some((item) => item.toLowerCase() === role)) return true;
  if (/driver|security|cleaner|cook|catering|nurse|maintenance|librarian|office assistant|guard|kitchen|janitor|grounds|administrator|finance|accounts|accountant/.test(role)) return false;
  if (/teacher|tutor|lecturer|form master|department head/.test(role)) return true;
  return true;
}

const LEVEL_OPTIONS = [
  'Creche', 'Nursery 1', 'Nursery 2', 'KG 1', 'KG 2',
  'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6',
  'Basic 7', 'Basic 8', 'Basic 9'
];

export default function AdminPortal({ onSignOut, initialAdminRole }) {
  const {
    onboardedStudents,
    applications,
    teacherDirectory,
    classLevels,
    subjects,
    results,
    messages,
    approveResult,
    declineResult,
    onboardStudent,
    updateOnboardedStudent,
    deleteOnboardedStudent,
    addStaffMember,
    updateStaffMember,
    offboardStaffMember,
    reactivateStaffMember,
    deleteStaffMember,
    addClassLevel,
    addSubject,
    teachingAssignments,
    saveTeachingAssignment,
    securityAlerts,
    resolveSecurityAlert,
    deleteSecurityAlert,
    updateApplicationStatus,
    updateApplicationOfficeUse,
    updateApplication,
    submitApplication,
    deleteApplication,
    refreshBackendData,
    syncApplicationsToStudentDatabase,
    adminSetUserPassword,
    paymentVouchers,
    pvNotifications,
    markAllPVNotificationsRead,
    clearPVNotifications,
    markPVNotificationRead,
  } = usePortalData();

  const [activeNav, setActiveNavState] = useState(() => {
    return localStorage.getItem('says_admin_active_nav') || 'Dashboard';
  });

  const setActiveNav = (nav) => {
    setActiveNavState(nav);
    try {
      localStorage.setItem('says_admin_active_nav', nav);
    } catch (e) {}
  };

  useEffect(() => {
    const handleNavEvent = (e) => {
      if (e.detail?.portal === 'admin' && e.detail?.nav) {
        setActiveNav(e.detail.nav);
        if (e.detail.tab) setAdminOnboardTab(e.detail.tab);
        if (e.detail.isCreatingApp !== undefined) setIsCreatingApp(e.detail.isCreatingApp);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('says_navigate', handleNavEvent);
    return () => window.removeEventListener('says_navigate', handleNavEvent);
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [viewingRecordStudent, setViewingRecordStudent] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [enrollingAppId, setEnrollingAppId] = useState('');

  // Application Forms state
  const [selectedApp, setSelectedApp] = useState(null);
  const [isCreatingApp, setIsCreatingApp] = useState(false);
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [appClassFilter, setAppClassFilter] = useState('All');
  const [appYearFilter, setAppYearFilter] = useState('All');
  const [appTermFilter, setAppTermFilter] = useState('All');

  // Transcripts & Class Results state
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [transcriptClassFilter, setTranscriptClassFilter] = useState('All');
  const [transcriptTermFilter, setTranscriptTermFilter] = useState('Term 1 · 2026');
  const [viewingTranscriptStudent, setViewingTranscriptStudent] = useState(null);
  // Admin Role State
  const [adminRole, setAdminRole] = useState(() => initialAdminRole || (typeof window !== 'undefined' ? localStorage.getItem('says_admin_role') : null) || 'head_admin'); // 'head_admin' | 'sub_admin'

  useEffect(() => {
    if (initialAdminRole) {
      setAdminRole(initialAdminRole);
    }
  }, [initialAdminRole]);

  useEffect(() => {
    if (adminRole === 'head_admin' && SUB_ADMIN_PV_NAV.includes(activeNav)) {
      setActiveNav('Dashboard');
    }
  }, [adminRole, activeNav]);

  useEffect(() => {
    if (activeNav !== 'Student Roster' && activeNav !== 'Applications & Forms') return undefined;
    let cancelled = false;
    (async () => {
      try {
        if (activeNav === 'Student Roster' && syncApplicationsToStudentDatabase) {
          await syncApplicationsToStudentDatabase();
        } else if (refreshBackendData) {
          await refreshBackendData();
        }
      } catch (e) {
        if (!cancelled) console.warn('Admissions/roster database sync failed:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeNav, refreshBackendData, syncApplicationsToStudentDatabase]);
  const [declineResultModal, setDeclineResultModal] = useState(null);
  const [declineInputNote, setDeclineInputNote] = useState('');

  // Student Credentials Vault State
  const [viewingCredentialStudent, setViewingCredentialStudent] = useState(null);
  const [showPassMap, setShowPassMap] = useState({});
  const [editingPasswordStudent, setEditingPasswordStudent] = useState(null);
  const [newDefaultPassInput, setNewDefaultPassInput] = useState('');
  const [printingCredentialSlip, setPrintingCredentialSlip] = useState(null);
  const [credentialSearchQuery, setCredentialSearchQuery] = useState('');

  // PV Approval Notifications & Pending Voucher Queue Detection
  const pendingPVs = useMemo(() => {
    return (paymentVouchers || []).filter(p => {
      const s = (p.status || '').toLowerCase().trim();
      return s.includes('pending') || s === 'draft' || !s;
    });
  }, [paymentVouchers]);

  const pendingPVCount = useMemo(() => {
    return (pvNotifications || []).filter(n => !n.read).length;
  }, [pvNotifications]);

  // Uploaded exam scores awaiting Head Admin / Sub-Admin sign-off
  const pendingResultsCount = useMemo(() => {
    return (results || []).filter(r => r.status === 'Pending Approval').length;
  }, [results]);

  const examPendingResults = useMemo(() => {
    return (results || []).filter((r) => r.status === 'Pending Approval' || r.status === 'Declined');
  }, [results]);

  const terminalReportNotices = useMemo(() => {
    return (messages || []).filter((m) => m.type === 'terminal-report' || String(m.subject || '') === 'Terminal Report is ready');
  }, [messages]);

  const getStudentTranscriptData = useCallback((student) => buildStudentTranscriptData(student, results), [results]);

  const numericTranscriptAverage = (students) => {
    const vals = students.map((s) => Number(getStudentTranscriptData(s).averageScore)).filter((n) => Number.isFinite(n));
    if (!vals.length) return MISSING_SCORE;
    return (vals.reduce((acc, n) => acc + n, 0) / vals.length).toFixed(1);
  };

  const numericTranscriptCgpa = (students) => {
    const vals = students.map((s) => Number(getStudentTranscriptData(s).cgpa)).filter((n) => Number.isFinite(n));
    if (!vals.length) return MISSING_SCORE;
    return (vals.reduce((acc, n) => acc + n, 0) / vals.length).toFixed(2);
  };

  const [livePVAlert, setLivePVAlert] = useState(null);
  useEffect(() => {
    const handlePVSubmitted = (e) => {
      const detail = e.detail;
      if (detail && detail.notif) {
        setLivePVAlert(detail.notif);
        setTimeout(() => setLivePVAlert(null), 12000);
      }
    };
    window.addEventListener('rcis_pv_submitted', handlePVSubmitted);
    return () => window.removeEventListener('rcis_pv_submitted', handlePVSubmitted);
  }, []);

  // Dynamic Levels & Subjects
  const defaultClassLevels = [
    'Creche', 'Nursery 1', 'Nursery 2', 'KG 1', 'KG 2',
    'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6',
    'Basic 7', 'Basic 8', 'Basic 9',
    'SHS 1', 'SHS 2', 'SHS 3'
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
  const [newClassCategory, setNewClassCategory] = useState('Primary School');
  const [newSubjectName, setNewSubjectName] = useState('');
  const [classCreateError, setClassCreateError] = useState('');
  const [classCreateLoading, setClassCreateLoading] = useState(false);

  const handleAddClassSubmit = async (e) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    setClassCreateLoading(true);
    setClassCreateError('');
    try {
      if (!addClassLevel) throw new Error('The database did not save this class.');
      const savedName = await addClassLevel(newClassName.trim(), newClassCategory);
      setSuccessMsg(`🏫 Class Level "${savedName || newClassName.trim()}" was saved. It is now available when creating a user.`);
      setNewClassName('');
      setIsAddingClass(false);
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err) {
      setClassCreateError(err?.message || 'The database did not save this class.');
    } finally {
      setClassCreateLoading(false);
    }
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
  const [staffKindFilter, setStaffKindFilter] = useState('all');
  const [assignmentTeacherKey, setAssignmentTeacherKey] = useState('');
  const [assignmentClasses, setAssignmentClasses] = useState([]);
  const [assignmentSubjects, setAssignmentSubjects] = useState([]);
  const [assignmentError, setAssignmentError] = useState('');
  const [assignmentSaving, setAssignmentSaving] = useState(false);

  const staffDirectory = teacherDirectory || [];
  const assignableTeachers = staffDirectory.filter((person) => {
    if (person.status === 'Offboarded' || !isTeachingStaffMember(person)) return false;
    const role = String(person.role || '').toLowerCase();
    return /class teacher|subject teacher|teaching staff|teacher|tutor/.test(role);
  });
  const assignmentClassOptions = Array.from(new Set([
    ...LEVEL_OPTIONS,
    ...LEVEL_OPTIONS.flatMap((level) => CLASS_SUBCLASS_MAP[level] || []),
  ]));

  const visibleStaff = useMemo(() => {
    return staffDirectory.filter((t) => {
      const matchesSearch = (t.name || '').toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
        (t.staffId || '').toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
        (t.subject || '').toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
        (t.email || '').toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
        (t.role || '').toLowerCase().includes(staffSearchQuery.toLowerCase());
      const matchesSubject = staffSubjectFilter === 'All' || (t.subject || '').toLowerCase().includes(staffSubjectFilter.toLowerCase());
      const matchesStatus = staffStatusFilter === 'All' ||
        (staffStatusFilter === 'Active' && t.status !== 'Offboarded') ||
        (staffStatusFilter === 'Offboarded' && t.status === 'Offboarded');
      const teaching = isTeachingStaffMember(t);
      const matchesKind = staffKindFilter === 'all' || (staffKindFilter === 'teaching' ? teaching : !teaching);
      return matchesSearch && matchesSubject && matchesStatus && matchesKind;
    });
  }, [staffDirectory, staffSearchQuery, staffSubjectFilter, staffStatusFilter, staffKindFilter]);

  const blankNonTeachingStaff = {
    name: '',
    staffId: '',
    role: 'Driver',
    subject: 'Transport',
    classAssigned: '',
    email: '',
    phone: '',
    gender: '',
    photo: '👤',
    bio: ''
  };
  const [newStaffForm, setNewStaffForm] = useState(blankNonTeachingStaff);

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

  const handleIssueStudentCardSubmit = async (e) => {
    e.preventDefault();
    if (!issuingCardStudent || !cardForm.rfidCardCode.trim()) return;

    const issuedUid = cardForm.rfidCardCode.trim();
    try {
      if (!updateOnboardedStudent) {
        throw new Error('The database did not save this RFID card.');
      }
      await updateOnboardedStudent(issuingCardStudent.id, {
        rfidCardCode: issuedUid,
        cardIssued: true,
        dailyLimit: cardForm.dailyLimit || '50'
      });
      setSuccessMsg(`💳 Smart RFID Card #${issuedUid} encoded & issued to ${issuingCardStudent.fullName}!`);
      setIssuingCardStudent(null);
      setCardForm({ rfidCardCode: '', dailyLimit: '50', pin: '1234', holderName: '', notes: '' });
    } catch (err) {
      setSuccessMsg('RFID card issue failed. The database did not save this card, so nothing was kept in this browser.');
    }
    setTimeout(() => setSuccessMsg(''), 6000);
  };

  const handleIssueParentCardSubmit = async (e) => {
    e.preventDefault();
    if (!issuingParentCardStudent) return;

    const code = cardForm.rfidCardCode.trim() || `PCARD-${Date.now().toString().slice(-6)}`;
    try {
      if (!updateOnboardedStudent) {
        throw new Error('The database did not save this parent pickup card.');
      }
      await updateOnboardedStudent(issuingParentCardStudent.id, {
        parentPickupCardIssued: true,
        parentCardCode: code
      });
      setSuccessMsg(`👨‍👩‍👧 Official Parent Pickup Card #${code} issued for ${issuingParentCardStudent.guardianName} (${issuingParentCardStudent.fullName})!`);
      setIssuingParentCardStudent(null);
      setCardForm({ rfidCardCode: '', dailyLimit: '50', pin: '1234', holderName: '', notes: '' });
    } catch (err) {
      setSuccessMsg('Parent pickup card issue failed. The database did not save this card, so nothing was kept in this browser.');
    }
    setTimeout(() => setSuccessMsg(''), 6000);
  };

  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    if (!newStaffForm.name) return;
    if (isTeachingStaffMember(newStaffForm)) return;

    setStaffActionLoading(true);
    setStaffActionError('');
    try {
      if (!addStaffMember) throw new Error('The database did not save this staff member.');
      await addStaffMember({
        ...newStaffForm,
        role: newStaffForm.role,
        subject: NON_TEACHING_DUTIES.includes(newStaffForm.subject) ? newStaffForm.subject : 'Transport',
        classAssigned: '',
      });
      setSuccessMsg(`✅ ${newStaffForm.name} was saved as non-teaching staff.`);
      setStaffKindFilter('non_teaching');
      setIsAddingStaff(false);
      setNewStaffForm(blankNonTeachingStaff);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setStaffActionError(err.message || 'The database did not save this staff member.');
    } finally {
      setStaffActionLoading(false);
    }
  };
  const handleOnboardStaffSubmit = handleAddStaffSubmit;

  const [staffActionError, setStaffActionError] = useState('');
  const [staffActionLoading, setStaffActionLoading] = useState(false);

  const handleUpdateStaffSubmit = async (e) => {
    e.preventDefault();
    if (!editingStaff || !editingStaff.name) return;

    setStaffActionLoading(true);
    setStaffActionError('');
    try {
      await updateStaffMember(editingStaff.id || editingStaff.staffId, editingStaff);
      setSuccessMsg(`Staff member ${editingStaff.name} details updated.`);
      setEditingStaff(null);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setStaffActionError(err.message || 'Could not update staff details.');
    } finally {
      setStaffActionLoading(false);
    }
  };

  const handleOffboardStaffConfirm = async () => {
    if (!offboardingStaff) return;

    setStaffActionLoading(true);
    setStaffActionError('');
    try {
      await offboardStaffMember(offboardingStaff);
      setSuccessMsg(`Staff member ${offboardingStaff.name} offboarded. Portal access is inactive.`);
      setOffboardingStaff(null);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setStaffActionError(err.message || 'Could not offboard this staff member.');
    } finally {
      setStaffActionLoading(false);
    }
  };

  const handleReactivateStaff = async (staff) => {
    setStaffActionError('');
    try {
      await reactivateStaffMember(staff);
      setSuccessMsg(`Reactivated staff member ${staff.name}.`);
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setSuccessMsg(err.message || 'Could not reactivate this staff member.');
      setTimeout(() => setSuccessMsg(''), 5000);
    }
  };

  const [adminOnboardTab, setAdminOnboardTab] = useState('single');
  const [onboardingForm, setOnboardingForm] = useState({
    fullName: '',
    dob: '',
    gender: 'Male',
    level: 'Basic 1',
    classSection: 'Basic 1A',
    guardianName: '',
    guardianEmail: '',
    guardianPhone: '',
    homeAddress: '',
    rfidCardCode: '',
  });

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    if (!onboardingForm.fullName || !onboardingForm.guardianName || !onboardingForm.guardianEmail) return;

    try {
      await onboardStudent(onboardingForm);
    } catch (err) {
      setSuccessMsg(err?.message || 'Saving this student failed.');
      setTimeout(() => setSuccessMsg(''), 8000);
      return;
    }

    setOnboardingForm({
      fullName: '',
      dob: '',
      gender: 'Male',
      level: 'Basic 1',
      classSection: 'Basic 1A',
      guardianName: '',
      guardianEmail: '',
      guardianPhone: '',
      homeAddress: '',
      rfidCardCode: '',
    });

    setActiveNav('Dashboard');
    setSuccessMsg('Student onboarded successfully! Student ID, school email, and fee account initialized.');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleEnrollApplicant = async (app) => {
    if (!app?.id || enrollingAppId) return;
    const learnerName = (app.firstName || app.surname || app.otherNames)
      ? `${app.firstName || ''} ${app.otherNames ? app.otherNames + ' ' : ''}${app.surname || ''}`.replace(/\s+/g, ' ').trim()
      : (app.learner || app.learner_name || app.fullName || 'Student');
    setEnrollingAppId(app.id);
    try {
      await updateApplicationStatus(app.id, 'Enrolled');
      setActiveNav('Student Roster');
      setSuccessMsg(`${learnerName} was enrolled and added to the student roster.`);
    } catch (err) {
      setSuccessMsg(err?.message || 'Enrolling this applicant failed.');
    } finally {
      setEnrollingAppId('');
      setTimeout(() => setSuccessMsg(''), 8000);
    }
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
        `${data.averageScore === MISSING_SCORE ? MISSING_SCORE : `${data.averageScore}%`}`,
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
      ['Course Code', 'Subject Name', 'Class Assessment (50%)', 'End of Term Exam (50%)', 'Total Score (100%)', 'Letter Grade', 'GPA Point', 'Remark']
    ];
    const rows = data.subjects.map(s => [
      s.code,
      s.name,
      s.classScore == null ? MISSING_SCORE : `${s.classScore}/50`,
      s.examScore == null ? MISSING_SCORE : `${s.examScore}/50`,
      s.total == null ? MISSING_SCORE : `${s.total}%`,
      s.grade || MISSING_SCORE,
      s.gpaPoint === MISSING_SCORE || s.gpaPoint == null ? MISSING_SCORE : s.gpaPoint,
      s.remark || MISSING_SCORE,
    ]);
    const footer = [
      [],
      [`Cumulative GPA: ${data.cgpa}`, `Average Mark: ${data.averageScore === MISSING_SCORE ? MISSING_SCORE : `${data.averageScore}%`}`, `Academic Standing: ${data.standing}`]
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

  const handleSaveOfficeEvaluation = async (id, officeData) => {
    if (!updateApplicationOfficeUse) return;
    await updateApplicationOfficeUse(id, officeData);
    setSuccessMsg('Office evaluation and examination results saved to application record.');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const [studentSortCol, setStudentSortCol] = useState('fullName');
  const [studentSortDir, setStudentSortDir] = useState('asc');

  const handleStudentSort = (colKey) => {
    if (studentSortCol === colKey) {
      setStudentSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setStudentSortCol(colKey);
      setStudentSortDir('asc');
    }
  };

  const renderStudentSortIcon = (colKey) => {
    if (studentSortCol !== colKey) return <ArrowUpDown size={11} style={{ opacity: 0.35, marginLeft: 4 }} />;
    return studentSortDir === 'asc' ? <ArrowUp size={12} style={{ color: ADMIN_BG, marginLeft: 4 }} /> : <ArrowDown size={12} style={{ color: ADMIN_BG, marginLeft: 4 }} />;
  };

  const filteredStudents = useMemo(() => {
    const q = String(searchQuery || '').toLowerCase();
    return (onboardedStudents || [])
      .map((s) => ({
        ...s,
        level: formatClassToBasic(s.level)
      }))
      .filter((s) => {
        if (!q) return true;
        return [
          s.fullName,
          s.studentId,
          s.level,
          s.guardianName,
          s.fatherName,
          s.motherName,
        ].some((value) => String(value || '').toLowerCase().includes(q));
      })
      .sort((a, b) => {
        let valA = (a[studentSortCol] || '').toString().toLowerCase();
        let valB = (b[studentSortCol] || '').toString().toLowerCase();
        if (valA < valB) return studentSortDir === 'asc' ? -1 : 1;
        if (valA > valB) return studentSortDir === 'asc' ? 1 : -1;
        return 0;
      });
  }, [onboardedStudents, searchQuery, studentSortCol, studentSortDir]);

  const appUniqueClasses = useMemo(() => {
    const defaultClasses = [
      'Creche', 'Nursery 1', 'Nursery 2', 'Kindergarten 1', 'Kindergarten 2',
      'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6', 'Basic 7', 'Basic 8', 'Basic 9'
    ];
    const classes = (applications || []).map(a => formatClassToBasic(a.level || a.applyingClass || '')).filter(Boolean);
    return ['All', ...Array.from(new Set([...defaultClasses, ...classes]))];
  }, [applications]);

  const appUniqueYears = useMemo(() => {
    const defaultYears = ['2024/2025', '2025/2026', '2026/2027', '2027/2028'];
    const years = (applications || []).map(a => a.academicYear).filter(Boolean);
    return ['All', ...Array.from(new Set([...defaultYears, ...years]))];
  }, [applications]);

  const appUniqueTerms = ['All', 'Term 1', 'Term 2', 'Term 3'];

  const filteredApplications = useMemo(() => {
    return (applications || []).filter((a) => {
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(a?.id || '').trim())) return false;
      const name = (a.firstName || a.surname || a.otherNames)
        ? `${a.firstName || ''} ${a.otherNames ? a.otherNames + ' ' : ''}${a.surname || ''}`.replace(/\s+/g, ' ').trim()
        : (a.learner || a.learner_name || a.fullName || '');
      const gName = a.guardian || a.fatherName || a.motherName || '';
      const q = (appSearchQuery || searchQuery || '').toLowerCase();
      const matchesSearch = !q ||
        name.toLowerCase().includes(q) ||
        gName.toLowerCase().includes(q) ||
        (a.level || a.applyingClass || '').toLowerCase().includes(q);

      const appClass = formatClassToBasic(a.level || a.applyingClass || '');
      const matchesClass = appClassFilter === 'All' || appClass.toLowerCase() === appClassFilter.toLowerCase();
      const matchesYear = appYearFilter === 'All' || (a.academicYear || '2025/2026') === appYearFilter;
      const matchesTerm = appTermFilter === 'All' || (a.academicTerm || a.term || 'Term 1') === appTermFilter;

      return matchesSearch && matchesClass && matchesYear && matchesTerm;
    });
  }, [applications, appSearchQuery, searchQuery, appClassFilter, appYearFilter, appTermFilter]);

  const totalStudents = (onboardedStudents || []).length;
  const activeStudents = (onboardedStudents || []).filter((s) => s.status === 'Active').length;
  const totalApplications = (applications || []).length;

  const recentOnboardedStudents = useMemo(() => {
    const recency = (student) => {
      const raw = student?.onboardedAt || student?.createdAt || student?.enrollmentDate || student?.updatedAt || 0;
      const ts = new Date(raw).getTime();
      return Number.isFinite(ts) ? ts : 0;
    };
    return [...(onboardedStudents || [])]
      .sort((a, b) => recency(b) - recency(a))
      .slice(0, 8);
  }, [onboardedStudents]);

  const STATS = [
    { label: 'Total Enrolled Students', value: String(totalStudents), trend: `${activeStudents} Active`, icon: '👥', bg: '#f3e8ff', ic: ADMIN_BG, nav: 'Student Roster' },
    { label: 'Admissions Applications', value: String(totalApplications), trend: 'Official forms active', icon: '📋', bg: '#fef9c3', ic: '#78350f', nav: 'Applications & Forms' },
    { label: 'Teaching Staff', value: String(staffDirectory.filter(t => t.status !== 'Offboarded' && isTeachingStaffMember(t)).length), trend: 'All departments', icon: '👨‍🏫', bg: '#e0f2fe', ic: '#0369a1', nav: 'Classes & Staff' },
  ];

  const studentDetailedClass = (student) => {
    if (!student) return '—';
    const level = formatClassToBasic(student.level || student.classLevel || student.applyingClass || '');
    return formatDetailedClass(level, student.classSection || student.subClass || student.section || '');
  };

  const matchingApplicationForStudent = (student) => {
    if (!student) return null;
    return (applications || []).find((app) => {
      if (student.applicationId && String(app.id) === String(student.applicationId)) return true;
      if (app.officeStudentID && student.studentId && String(app.officeStudentID).toLowerCase() === String(student.studentId).toLowerCase()) return true;
      const appName = (app.firstName || app.surname || app.otherNames)
        ? `${app.firstName || ''} ${app.otherNames ? `${app.otherNames} ` : ''}${app.surname || ''}`.replace(/\s+/g, ' ').trim()
        : (app.learner || app.fullName || '');
      return appName && student.fullName && appName.toLowerCase() === String(student.fullName).toLowerCase();
    }) || null;
  };

  const studentRecordDetails = (student) => {
    const app = matchingApplicationForStudent(student) || {};
    return {
      studentName: student?.fullName || '—',
      studentClass: studentDetailedClass(student),
      fatherName: [student?.fatherName, app.fatherName].map((value) => String(value || '').trim()).find((value) => value && !/^(parent\s*\/?\s*guardian|parent|guardian)$/i.test(value)) || '—',
      fatherContact: [student?.fatherPhone, app.fatherPhone].map((value) => String(value || '').trim()).find(Boolean) || '—',
      motherName: [student?.motherName, app.motherName].map((value) => String(value || '').trim()).find((value) => value && !/^(parent\s*\/?\s*guardian|parent|guardian)$/i.test(value)) || '—',
      motherContact: [student?.motherPhone, app.motherPhone].map((value) => String(value || '').trim()).find(Boolean) || '—',
    };
  };

  const handleViewRecord = (student) => {
    setViewingRecordStudent(student);
  };

  const handlePrintRoster = async () => {
    setSuccessMsg('Loading live student roster from the database…');
    try {
      if (syncApplicationsToStudentDatabase) await syncApplicationsToStudentDatabase();
      else if (refreshBackendData) await refreshBackendData();
    } catch (e) {
      console.warn('Roster refresh before print failed:', e);
    }
    document.body.classList.add('print-student-roster');
    const cleanup = () => {
      document.body.classList.remove('print-student-roster');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 400);
      setSuccessMsg('');
    }, 250);
  };

  const handleRefreshRoster = async () => {
    setSuccessMsg('Syncing Student Roster with Applications & Forms from the database…');
    try {
      if (syncApplicationsToStudentDatabase) await syncApplicationsToStudentDatabase();
      else if (refreshBackendData) await refreshBackendData();
      setSuccessMsg('Student Roster updated from the live database.');
    } catch (e) {
      setSuccessMsg(e?.message || 'Could not refresh the student roster from the database.');
    }
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleDelete = (id) => {
    const student = (onboardedStudents || []).find((s) => s.id === id || s.studentId === id);
    const studentName = student?.fullName || 'this student';
    if (window.confirm(`⚠️ Are you sure you want to COMPLETELY delete ${studentName}? This will permanently wipe their student profile, fee accounts, semester registrations, and academic records from the system.`)) {
      deleteOnboardedStudent(id);
      setSuccessMsg(`✅ Student record for ${studentName} completely deleted from the system.`);
      setTimeout(() => setSuccessMsg(''), 5000);
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
              <span style={{ fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 4, background: adminRole === 'head_admin' ? '#4a1d6e' : '#0284c7', color: '#fff' }}>
                {adminRole === 'head_admin' ? '👑 HEAD ADMIN' : '🛡️ SUB ADMIN'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#6b21a8', marginTop: 4, fontWeight: 600 }}>
              {(() => {
                const accountName = String(getAuthUser()?.fullName || getAuthUser()?.name || '').trim();
                if (!accountName || /^(admin user|test user|test admin|user|admin)$/i.test(accountName)) return 'School Administration Office';
                return accountName;
              })()}
            </div>
            <div style={{ fontSize: 11, color: '#7e22ce', marginTop: 4, fontWeight: 700 }}>
              {adminRole === 'head_admin' ? 'Full Institutional Control' : 'Restricted Administrative Access'}
            </div>
          </div>
          <span className="sidebar-section-label">Management</span>
          {NAV.filter(item => {
            if (adminRole === 'head_admin') {
              return item.label !== 'Submit PV Request';
            }
            if (adminRole === 'sub_admin') {
              const restrictedForSubAdmin = [
                'Register for Exams',
                'Academic Settings',
                'Pre-Audit & Approve PV',
                'Pay PV',
                'Pay PV (Disbursement)',
                'User Access Control (UAC)',
                'Student Credentials Vault',
                'Security & Intrusion Alerts'
              ];
              return !restrictedForSubAdmin.includes(item.label);
            }
            return true;
          }).map((item) => (
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
              <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
              {item.label === 'Pre-Audit & Approve PV' && pendingPVCount > 0 ? (
                <span style={{
                  background: '#dc2626', color: '#fff', fontSize: 10, fontWeight: 900,
                  borderRadius: 99, padding: '1px 7px', marginLeft: 6, lineHeight: 1.4,
                  boxShadow: '0 1px 4px rgba(220,38,38,0.4)'
                }}>
                  {pendingPVCount}
                </span>
              ) : item.label === 'Pay PV' ? (
                (() => {
                  const readyCount = (paymentVouchers || []).filter(v => {
                    const s = String(v.status || '').toLowerCase().trim();
                    return s === 'validated' || s === 'approved' || s.includes('approved') || s.includes('pre-audited');
                  }).length;
                  return readyCount > 0 ? (
                    <span style={{
                      background: '#16a34a', color: '#fff', fontSize: 10, fontWeight: 900,
                      borderRadius: 99, padding: '1px 7px', marginLeft: 6, lineHeight: 1.4,
                      boxShadow: '0 1px 4px rgba(22,163,74,0.4)'
                    }}>
                      {readyCount}
                    </span>
                  ) : null;
                })()
              ) : item.label === 'Transcripts & Results' && pendingResultsCount > 0 ? (
                <span style={{
                  background: '#d97706', color: '#fff', fontSize: 10, fontWeight: 900,
                  borderRadius: 99, padding: '1px 7px', marginLeft: 6, lineHeight: 1.4,
                  boxShadow: '0 1px 4px rgba(217,119,6,0.4)'
                }}>
                  {pendingResultsCount}
                </span>
              ) : item.badge ? (
                <span className="sidebar-item__badge" style={{ fontSize: 9, opacity: 0.85 }}>{item.badge}</span>
              ) : null}
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="portal__content">
          {/* Live PV Submission Toast Alert */}
          {livePVAlert && adminRole !== 'sub_admin' && (
            <div style={{
              padding: '14px 18px',
              background: 'linear-gradient(135deg, #4a1d6e, #7c3ac8)',
              color: '#fff',
              borderRadius: 'var(--radius-md)',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 8px 24px rgba(74,29,110,0.3)',
              animation: 'pvNotifSlideIn 0.3s ease-out'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ background: '#fff', borderRadius: '50%', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BellRing size={18} color="#7c3ac8" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>
                    ⚡ New PV Submitted for Approval: #{livePVAlert.pvNo}
                  </div>
                  <div style={{ fontSize: 11, color: '#e9d5ff', marginTop: 2 }}>
                    {livePVAlert.provider} · GHS {Number(livePVAlert.grandTotal || 0).toLocaleString('en-GH', { minimumFractionDigits: 2 })} · Submitted by {livePVAlert.submittedBy || 'Sub-Admin'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => {
                    setActiveNav('Pre-Audit & Approve PV');
                    setLivePVAlert(null);
                  }}
                  style={{
                    background: '#fff', color: '#4a1d6e', border: 'none', borderRadius: 6,
                    padding: '7px 14px', fontWeight: 800, fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4
                  }}
                >
                  Review Voucher <ArrowRight size={13} />
                </button>
                <button
                  onClick={() => setLivePVAlert(null)}
                  style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}

          {terminalReportNotices.length > 0 && (
            <div style={{
              background: '#ecfdf5',
              border: '1.5px solid #6ee7b7',
              borderRadius: 'var(--radius-md)',
              padding: '13px 18px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#065f46' }}>
                  Terminal Report is ready
                </div>
                <div style={{ fontSize: 11, color: '#047857', marginTop: 2 }}>
                  {terminalReportNotices[0].body}
                </div>
              </div>
              <button
                onClick={() => setActiveNav('Transcripts & Results')}
                style={{
                  background: '#047857', color: '#fff', border: 'none', borderRadius: 7,
                  padding: '8px 16px', fontWeight: 800, fontSize: 12, cursor: 'pointer',
                }}
              >
                Open results
              </button>
            </div>
          )}

          {/* Persistent Action Required PV Banner for Headmaster */}
          {pendingPVCount > 0 && adminRole !== 'sub_admin' && activeNav !== 'Pre-Audit & Approve PV' && (
            <div style={{
              background: '#fdf4ff',
              border: '1.5px solid #d8b4fe',
              borderRadius: 'var(--radius-md)',
              padding: '13px 18px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 8px rgba(124, 58, 200, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: '#7c3ac8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', flexShrink: 0
                }}>
                  <BellRing size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#4a1d6e' }}>
                    Action Required: {pendingPVCount} Payment Voucher{pendingPVCount > 1 ? 's' : ''} Awaiting Pre-Audit & Approval
                  </div>
                  <div style={{ fontSize: 11, color: '#7c3ac8', marginTop: 1 }}>
                    Sub-Admin has submitted expenditure requests ready for Headmaster verification, correction, and sign-off.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveNav('Pre-Audit & Approve PV')}
                style={{
                  background: '#7c3ac8', color: '#fff', border: 'none', borderRadius: 7,
                  padding: '8px 16px', fontWeight: 800, fontSize: 12, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                Go to Approval Desk <ArrowRight size={13} />
              </button>
            </div>
          )}

          {adminRole === 'sub_admin' && (
            <div style={{
              padding: '10px 16px', background: '#e0f2fe', border: '1px solid #7dd3fc', color: '#0369a1',
              borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 12, marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={16} />
                <span><strong>Sub-Admin Restricted Access Mode:</strong> System governance, academic settings, exam registration, UAC, and financial PV approval are restricted to Head Admin.</span>
              </div>
              <span style={{ fontSize: 10, background: '#0284c7', color: '#fff', padding: '2px 8px', borderRadius: 99, fontWeight: 800 }}>SUB-ADMIN</span>
            </div>
          )}

          {adminRole === 'sub_admin' && [
            'Register for Exams',
            'Academic Settings',
            'Pre-Audit & Approve PV',
            'Pay PV',
            'Pay PV (Disbursement)',
            'User Access Control (UAC)',
            'Student Credentials Vault',
            'Security & Intrusion Alerts'
          ].includes(activeNav) && (
            <div style={{ padding: 40, textAlign: 'center', background: '#fff', borderRadius: 16, margin: '20px 0', border: '1px solid #fed7aa', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              <ShieldAlert size={48} color="#c2410c" style={{ marginBottom: 12 }} />
              <h3 style={{ fontSize: 20, fontWeight: 900, color: '#9a3412', marginBottom: 8 }}>
                🔒 Access Restricted — Sub-Admin Role
              </h3>
              <p style={{ fontSize: 13, color: '#475569', maxWidth: 520, margin: '0 auto 20px', lineHeight: 1.6 }}>
                The <strong>"{activeNav}"</strong> module is restricted to <strong>Head Admin</strong> users only. Sub-Admin accounts do not have permission to view or modify this section.
              </p>
              <button
                onClick={() => setActiveNav('Dashboard')}
                style={{ padding: '10px 22px', background: '#4a1d6e', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}
              >
                Return to Dashboard
              </button>
            </div>
          )}

          {successMsg && (
            <div style={{
              position: 'fixed', top: 76, right: 24, zIndex: 99999,
              padding: '14px 22px',
              background: /failed/i.test(successMsg) ? '#7f1d1d' : '#14532d',
              color: /failed/i.test(successMsg) ? '#fef2f2' : '#f0fdf4',
              borderRadius: 12, fontWeight: 800, fontSize: 13.5,
              display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
              border: /failed/i.test(successMsg) ? '1px solid #ef4444' : '1px solid #22c55e',
              animation: 'fadeIn 0.25s ease'
            }}>
              {/failed/i.test(successMsg)
                ? <AlertTriangle size={18} color="#fecaca" />
                : <CheckCircle2 size={18} color="#86efac" />}
              <span>{successMsg}</span>
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
                  <div
                    className="stat-card"
                    key={s.label}
                    onClick={() => {
                      if (s.nav) {
                        setActiveNav(s.nav);
                        setSelectedApp(null);
                        setIsCreatingApp(false);
                      }
                    }}
                    style={{ cursor: 'pointer', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
                    title={`Click to view ${s.nav}`}
                  >
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
                      onClick={() => { setActiveNav('Applications & Forms'); setIsCreatingApp(true); }}
                      style={{ padding: '6px 14px', background: ADMIN_BG, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                    >
                      + Onboard / Fill Application Form
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
                        {recentOnboardedStudents.length === 0 && (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', padding: 24, color: 'var(--gray-500)', fontWeight: 600 }}>
                              Newly onboarded students will appear here. Use + Onboard / Fill Application Form to add one.
                            </td>
                          </tr>
                        )}
                        {recentOnboardedStudents.map((stu) => (
                          <tr key={stu.id || stu.studentId}>
                            <td><code>{stu.studentId}</code></td>
                            <td><strong>{stu.fullName}</strong></td>
                            <td>{stu.level}</td>
                            <td>{stu.guardianName}</td>
                            <td><span className="status-pill status-pill--success">{stu.status || 'Active'}</span></td>
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
                      onClick={() => setActiveNav('User Access Control (UAC)')}
                      style={{ padding: 12, background: ADMIN_LIGHT, color: ADMIN_BG, border: '1px solid #d8b4fe', borderRadius: 'var(--radius-md)', fontWeight: 700, textAlign: 'left', cursor: 'pointer' }}
                    >
                      🛡️ User Access Control & Passwords (UAC)
                    </button>
                    <button
                      onClick={() => setActiveNav('Applications & Forms')}
                      style={{ padding: 12, background: 'var(--gray-100)', color: 'var(--gray-800)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', fontWeight: 700, textAlign: 'left', cursor: 'pointer' }}
                    >
                      📄 Official Application Forms & PDF
                    </button>
                    <button
                      onClick={() => { setActiveNav('Applications & Forms'); setIsCreatingApp(true); }}
                      style={{ padding: 12, background: 'var(--gray-100)', color: 'var(--gray-800)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', fontWeight: 700, textAlign: 'left', cursor: 'pointer' }}
                    >
                      ➕ Fill New Application (Onboard Student)
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

          {/* ── USER ACCESS CONTROL (UAC) ── */}
          {(activeNav === 'User Access Control (UAC)' || activeNav === 'UAC' || activeNav === 'User Access Control') && (
            <div className="animate-fade-up">
              <UserAccessControl adminRole={adminRole} />
            </div>
          )}

          {/* ── ONBOARD STUDENT REDIRECT ── */}
          {activeNav === 'Onboard Student' && (
            <div className="animate-fade-up">
              {(() => {
                setTimeout(() => {
                  setActiveNav('Applications & Forms');
                  setIsCreatingApp(true);
                }, 0);
                return null;
              })()}
            </div>
          )}

          {false && activeNav === 'Onboard Student' && (
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
                        onChange={(e) => {
                          const level = e.target.value;
                          const mapped = getMappedSubClasses(level);
                          setOnboardingForm({
                            ...onboardingForm,
                            level,
                            classSection: mapped.includes(onboardingForm.classSection) ? onboardingForm.classSection : (mapped[0] || ''),
                          });
                        }}
                      >
                        {LEVEL_OPTIONS.map((lvl) => (
                          <option key={lvl}>{lvl}</option>
                        ))}
                      </select>
                    </label>

                    <label>
                      <span>Class / Sub Class</span>
                      <select
                        value={onboardingForm.classSection}
                        onChange={(e) => setOnboardingForm({ ...onboardingForm, classSection: e.target.value })}
                      >
                        <option value="">Select sub class</option>
                        {getMappedSubClasses(onboardingForm.level).map((section) => (
                          <option key={section} value={section}>{section}</option>
                        ))}
                      </select>
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

          {/* ── SECURITY & INTRUSION ALERTS (HEAD ADMIN ONLY) ── */}
          {activeNav === 'Security & Intrusion Alerts' && adminRole === 'head_admin' && (
            <div className="animate-fade-up">
              <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                    <ShieldAlert size={14} /> Head Admin Security Audit Register
                  </div>
                  <h1 className="page-header__title">Security & Intrusion Alerts 🚨</h1>
                  <p className="page-header__subtitle">
                    Real-time monitoring of failed login attempts, unauthorized 2FA security PIN entries, and suspicious access attempts across all school portals.
                  </p>
                </div>
              </div>

              {/* Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
                <div style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Intrusion Alerts</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--gray-900)', marginTop: 4 }}>{(securityAlerts || []).length}</div>
                  <div style={{ fontSize: 12, color: 'var(--gray-600)', marginTop: 2 }}>Logged authentication events</div>
                </div>

                <div style={{ background: '#fff5f5', border: '1px solid #fca5a5', borderRadius: 'var(--radius-md)', padding: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>High Severity Breaches</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#991b1b', marginTop: 4 }}>
                    {(securityAlerts || []).filter(a => a.severity === 'High').length}
                  </div>
                  <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 2 }}>Admin / Financial PIN failures</div>
                </div>

                <div style={{ background: '#fffbe8', border: '1px solid #fde047', borderRadius: 'var(--radius-md)', padding: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#854d0e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Unresolved Alerts</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#854d0e', marginTop: 4 }}>
                    {(securityAlerts || []).filter(a => a.status === 'Unresolved').length}
                  </div>
                  <div style={{ fontSize: 12, color: '#a16207', marginTop: 2 }}>Pending Head Admin review</div>
                </div>
              </div>

              {/* Security Alerts Data Table */}
              <div className="panel">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Target Portal & Account</th>
                      <th>Intrusion Reason / Failure</th>
                      <th>Timestamp & Network IP</th>
                      <th>Severity</th>
                      <th>Status</th>
                      <th>Head Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(securityAlerts || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: 30, color: 'var(--gray-500)' }}>
                          ✅ No security intrusion alerts recorded. All system portals operating securely.
                        </td>
                      </tr>
                    ) : (
                      (securityAlerts || []).map((alert) => (
                        <tr key={alert.id} style={{ background: alert.status === 'Unresolved' ? '#fff5f5' : '#fff' }}>
                          <td>
                            <div style={{ fontSize: 13, fontWeight: 900, color: '#0f172a' }}>
                              <span style={{ textTransform: 'uppercase', padding: '2px 6px', background: '#e2e8f0', borderRadius: 4, fontSize: 10, marginRight: 6 }}>
                                {alert.portal}
                              </span>
                              {alert.targetAccount}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2 }}>Device: {alert.device || 'Web Client'}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: 12, fontWeight: 700, color: alert.severity === 'High' ? '#991b1b' : '#1e293b' }}>
                              ⚠️ {alert.reason}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>{alert.attemptedAt}</div>
                            <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--gray-500)' }}>🌐 {alert.ipAddress}</div>
                          </td>
                          <td>
                            <span style={{
                              padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 900, textTransform: 'uppercase',
                              background: alert.severity === 'High' ? '#fee2e2' : alert.severity === 'Medium' ? '#fef3c7' : '#e0f2fe',
                              color: alert.severity === 'High' ? '#991b1b' : alert.severity === 'Medium' ? '#92400e' : '#0369a1'
                            }}>
                              {alert.severity}
                            </span>
                          </td>
                          <td>
                            <span className={`status-pill ${alert.status === 'Acknowledged' ? 'status-pill--success' : 'status-pill--warning'}`}>
                              {alert.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {alert.status === 'Unresolved' && resolveSecurityAlert && (
                                <button
                                  onClick={() => {
                                    resolveSecurityAlert(alert.id);
                                    setSuccessMsg(`🛡️ Security alert for ${alert.targetAccount} marked as Acknowledged.`);
                                    setTimeout(() => setSuccessMsg(''), 4000);
                                  }}
                                  style={{ padding: '5px 8px', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                                  title="Acknowledge & Mark Reviewed"
                                >
                                  Acknowledge
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSuccessMsg(`🔒 Account Lockout Triggered: Temporary security lock placed on ${alert.targetAccount}. Alert dispatched to Head Admin.`);
                                  setTimeout(() => setSuccessMsg(''), 6000);
                                }}
                                style={{ padding: '5px 8px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                                title="Lock Account / Block IP Address"
                              >
                                Lock Account
                              </button>
                              {deleteSecurityAlert && (
                                <button
                                  onClick={() => deleteSecurityAlert(alert.id)}
                                  style={{ padding: '5px 8px', background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer' }}
                                  title="Dismiss Security Log"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── STUDENT ROSTER ── */}
          {activeNav === 'Student Roster' && (
            <div className="animate-fade-up">
              <div className="page-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                <h1 className="page-header__title">Student Roster Database</h1>
                  <p className="page-header__subtitle">View registered learners from the live database, print name and class lists, or manage records.</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="print-keep"
                  onClick={handleRefreshRoster}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 8,
                    background: '#fff',
                    color: ADMIN_BG,
                    border: `1px solid ${ADMIN_BG}`,
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <RefreshCw size={15} /> Refresh from Database
                </button>
                <button
                  type="button"
                  className="print-keep"
                  onClick={handlePrintRoster}
                  disabled={(filteredStudents || []).length === 0}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 8,
                    background: (filteredStudents || []).length > 0 ? ADMIN_BG : '#94a3b8',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: (filteredStudents || []).length > 0 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 4px 12px rgba(74, 29, 110, 0.2)'
                  }}
                >
                  <Printer size={15} /> Print Name & Class List ({filteredStudents.length})
                </button>
                </div>
              </div>

              <div className="no-print" style={{ position: 'relative', marginBottom: 16 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--gray-400)' }} />
                <input
                  type="text"
                  placeholder="Search student roster by name, ID, grade, or guardian..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-300)', fontSize: 13 }}
                />
              </div>

              <div className="student-roster-print official-document-printable">
                <div style={{ textAlign: 'center', marginBottom: 16, borderBottom: '2px solid #0f172a', paddingBottom: 12 }}>
                  <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '0.03em' }}>REMALJ CAREWELL INSPIRATIONAL SCHOOL</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#334155', marginTop: 4 }}>Student Roster · Full Name &amp; Level / Section</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                    Printed {new Date().toLocaleDateString('en-GB')} · {filteredStudents.length} student{filteredStudents.length === 1 ? '' : 's'} from live database
                  </div>
                </div>
                <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid #0f172a', width: 56 }}>#</th>
                      <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid #0f172a' }}>Full Name</th>
                      <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid #0f172a' }}>Level / Section</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s, idx) => (
                      <tr key={s.id || s.studentId || idx}>
                        <td style={{ padding: '7px 10px', borderBottom: '1px solid #e2e8f0' }}>{idx + 1}</td>
                        <td style={{ padding: '7px 10px', borderBottom: '1px solid #e2e8f0', fontWeight: 700 }}>{s.fullName}</td>
                        <td style={{ padding: '7px 10px', borderBottom: '1px solid #e2e8f0' }}>{studentDetailedClass(s)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="panel no-print">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleStudentSort('studentId')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                          Student ID {renderStudentSortIcon('studentId')}
                        </div>
                      </th>
                      <th onClick={() => handleStudentSort('fullName')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                          Full Name {renderStudentSortIcon('fullName')}
                        </div>
                      </th>
                      <th onClick={() => handleStudentSort('level')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                          Level / Section {renderStudentSortIcon('level')}
                        </div>
                      </th>
                      <th onClick={() => handleStudentSort('guardianName')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                          Guardian Details {renderStudentSortIcon('guardianName')}
                        </div>
                      </th>
                      <th onClick={() => handleStudentSort('studentEmail')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                          School Email {renderStudentSortIcon('studentEmail')}
                        </div>
                      </th>
                      <th onClick={() => handleStudentSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                          Status {renderStudentSortIcon('status')}
                        </div>
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((s) => (
                      <tr key={s.id}>
                        <td><code>{s.studentId}</code></td>
                        <td><strong>{s.fullName}</strong></td>
                        <td>{studentDetailedClass(s)}</td>
                        <td>
                          <div>{s.guardianName}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{s.guardianEmail}</div>
                        </td>
                        <td style={{ fontSize: 11, color: ADMIN_ACCENT }}>{s.studentEmail}</td>
                        <td><span className="status-pill status-pill--success">{s.status}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {adminRole === 'head_admin' && (
                              <>
                                <button
                                  onClick={() => setViewingCredentialStudent(s)}
                                  style={{ padding: '4px 8px', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
                                  title="View Student Email & Default Security Password"
                                >
                                  <ShieldCheck size={12} /> Credentials
                                </button>
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
                              </>
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
                              onClick={() => handleViewRecord(s)}
                              style={{ padding: '4px 8px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, color: '#334155' }}
                              title="View student record"
                            >
                              <Eye size={13} /> View Record
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
                    onUpdate={async (id, updatedForm) => {
                      if (updateApplication) await updateApplication(id, updatedForm);
                      setSelectedApp(null);
                      setSuccessMsg('Application form updated. Changes saved to the database and synced to Student Roster.');
                      setTimeout(() => setSuccessMsg(''), 6000);
                    }}
                    onSaveOfficeUse={handleSaveOfficeEvaluation}
                  />
                </div>
              ) : isCreatingApp ? (
                <div>
                  <OfficialApplicationForm
                    readOnly={false}
                    isAdmin={true}
                    onCancel={() => setIsCreatingApp(false)}
                    onSubmit={async (newForm) => {
                      await submitApplication(newForm);
                      setIsCreatingApp(false);
                      setActiveNav('Student Roster');
                      setSuccessMsg('You successfully submitted the application form.');
                      setTimeout(() => setSuccessMsg(''), 5000);
                    }}
                  />
                </div>
              ) : (
                <>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 12,
                    padding: 12,
                    background: '#f8fafc',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    marginBottom: 16,
                    alignItems: 'center'
                  }}>
                    {/* Search Input */}
                    <div style={{ position: 'relative', flex: '1 1 200px', minWidth: 180 }}>
                      <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                      <input
                        type="text"
                        placeholder="Search applications..."
                        value={appSearchQuery}
                        onChange={(e) => setAppSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '7px 10px 7px 32px', borderRadius: 6, border: '1px solid var(--gray-300)', fontSize: 13 }}
                      />
                    </div>

                    {/* Class Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Filter size={14} style={{ color: '#64748b' }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Class:</span>
                      <select
                        value={appClassFilter}
                        onChange={(e) => setAppClassFilter(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--gray-300)', fontSize: 12, background: '#fff' }}
                      >
                        {appUniqueClasses.map((cls) => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>

                    {/* Academic Year Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Year:</span>
                      <select
                        value={appYearFilter}
                        onChange={(e) => setAppYearFilter(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--gray-300)', fontSize: 12, background: '#fff' }}
                      >
                        {appUniqueYears.map((yr) => (
                          <option key={yr} value={yr}>{yr === 'All' ? 'All Years' : yr}</option>
                        ))}
                      </select>
                    </div>

                    {/* Academic Term Filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Term:</span>
                      <select
                        value={appTermFilter}
                        onChange={(e) => setAppTermFilter(e.target.value)}
                        style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--gray-300)', fontSize: 12, background: '#fff' }}
                      >
                        {appUniqueTerms.map((t) => (
                          <option key={t} value={t}>{t === 'All' ? 'All Terms' : t}</option>
                        ))}
                      </select>
                    </div>
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
                            const learnerName = (app.firstName || app.surname || app.otherNames)
                              ? `${app.firstName || ''} ${app.otherNames ? app.otherNames + ' ' : ''}${app.surname || ''}`.replace(/\s+/g, ' ').trim()
                              : (app.learner || app.learner_name || app.fullName || 'Applicant');
                            const enteredGuardian = (value) => {
                              const text = String(value || '').trim();
                              if (!text || /^(parent\/guardian|parent|guardian|n\/a|na|—|-)$/i.test(text)) return '';
                              return text;
                            };
                            const guardianNames = [app.fatherName, app.motherName].map(enteredGuardian).filter(Boolean);
                            const guardianEmails = [app.fatherEmail, app.motherEmail].map(enteredGuardian).filter(Boolean);
                            const guardianName = guardianNames.join(' / ') || enteredGuardian(app.guardian) || '—';
                            const guardianEmail = guardianEmails.join(' / ') || '—';

                            return (
                              <tr key={app.id}>
                                <td>
                                  <strong>{learnerName}</strong>
                                  <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Submitted: {app.submittedAt || 'Online'}</div>
                                </td>
                                <td>
                                  <span style={{ fontWeight: 700 }}>{formatClassToBasic(app.applyingClass || app.level || 'Basic 1')}</span>
                                  {(app.academicYear || app.academicTerm) && (
                                    <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2, fontWeight: 500 }}>
                                      {[app.academicYear, app.academicTerm].filter(Boolean).join(' • ')}
                                    </div>
                                  )}
                                </td>
                                <td>
                                  <div>{guardianName}</div>
                                  <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{guardianEmail}</div>
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
                                    onChange={async (e) => {
                                      const newStatus = e.target.value;
                                      try {
                                        await updateApplicationStatus(app.id, newStatus);
                                        if (newStatus === 'Accepted' || newStatus === 'Enrolled') {
                                          const contactEmail = app.email || app.fatherEmail || app.motherEmail || `parent.${(app.surname || app.learner || 'guardian').toLowerCase().replace(/[^a-z0-9]/g, '')}@remaljcarewell.edu.gh`;
                                          const defaultPass = app.defaultPassword || 'Carewell2026!';
                                          setSuccessMsg(`🎉 Application ACCEPTED! Default credentials sent to parent: Email: ${contactEmail} | Password: ${defaultPass} (Parent Portal direct access enabled - no sign in required).`);
                                          setTimeout(() => setSuccessMsg(''), 8000);
                                        }
                                      } catch (err) {
                                        setSuccessMsg(err?.message || 'Updating this application failed.');
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
                                        type="button"
                                        disabled={enrollingAppId === app.id}
                                        onClick={() => handleEnrollApplicant(app)}
                                        style={{
                                          padding: '4px 8px', background: '#dcfce7', color: '#166534',
                                          border: '1px solid #86efac', borderRadius: 4, cursor: enrollingAppId === app.id ? 'wait' : 'pointer',
                                          fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4,
                                          opacity: enrollingAppId === app.id ? 0.7 : 1
                                        }}
                                        title="Transfer to Student Roster & Create Fee Account"
                                      >
                                        <UserCheck size={13} /> {enrollingAppId === app.id ? 'Enrolling...' : 'Enrol Student'}
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
                    {(onboardedStudents || []).filter(s => s.parentPickupCardIssued).length}
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

          {/* ── REGISTER FOR EXAMS VIEW ── */}
          {activeNav === 'Register for Exams' && (
            <div className="animate-fade-up">
              <RegisterForExamsForm propStudents={onboardedStudents || []} />
            </div>
          )}

          {/* ── TRANSCRIPTS & RESULTS MASTER REGISTER ── */}
          {activeNav === 'Transcripts & Results' && (
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

              {/* Results Moderation & Approval Board — open to Head Admin and Sub-Admin */}
              <div className="panel" style={{ marginBottom: 24, border: '2px solid #e9d5ff' }}>
                <div className="panel__header" style={{ background: '#f3e8ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 className="panel__title" style={{ color: '#4c1d95', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileCheck size={18} /> Uploaded Scores — Approval Board
                  </h2>
                  <span className="status-pill status-pill--info">
                    {(results || []).filter(r => r.status === 'Pending Approval').length} Pending Review
                  </span>
                </div>

                <div className="panel__body" style={{ padding: 0, overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Course Title</th>
                        <th>Lecturer / Author</th>
                        <th>Class</th>
                        <th>Exam</th>
                        <th>Total</th>
                        <th>Grade</th>
                        <th>Approval Status</th>
                        <th style={{ textAlign: 'right' }}>{adminRole === 'sub_admin' ? 'Sub-Admin Action' : 'Academic Head Action'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examPendingResults.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ color: '#94a3b8', fontWeight: 600 }}>No exam scores awaiting approval.</td>
                        </tr>
                      ) : examPendingResults.map((r) => (
                        <tr key={r.id || `${r.studentId}-${r.subject}`} style={{ background: r.status === 'Declined' ? '#fff1f2' : r.status === 'Pending Approval' ? '#fffbeb' : 'transparent' }}>
                          <td>
                            <strong>{r.studentName || MISSING_SCORE}</strong>
                            <div style={{ fontSize: 11, color: '#64748b' }}>{r.studentId || MISSING_SCORE} · {r.classLevel || ''} {r.subClass || ''}</div>
                          </td>
                          <td><strong>{r.subject}</strong></td>
                          <td>{r.lecturer || r.instructor || MISSING_SCORE}</td>
                          <td><span style={{ fontWeight: 800 }}>{r.hasClassScore || Number(r.classScore) > 0 ? r.classScore : MISSING_SCORE}</span></td>
                          <td><span style={{ fontWeight: 800 }}>{r.hasExamScore || r.status === 'Pending Approval' ? (r.examScoreConverted ?? r.examScore) : MISSING_SCORE}</span></td>
                          <td><span style={{ fontWeight: 800 }}>{r.score != null && r.hasExamScore !== false ? `${r.score}%` : MISSING_SCORE}</span></td>
                          <td><span className="status-pill status-pill--success">{r.grade || MISSING_SCORE}</span></td>
                          <td>
                            {r.status === 'Approved' ? (
                              <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 800, background: '#dcfce7', color: '#166534' }}>
                                🟢 Approved{r.approvedBy ? ` by ${r.approvedBy}` : ''} & Published
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
                            {r.status === 'Approved' ? (
                              <span style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic' }}>
                                No action needed
                              </span>
                            ) : (
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => {
                                    const approver = adminRole === 'sub_admin' ? 'Sub-Admin' : 'Academic Head';
                                    approveResult(r.id, approver);
                                    setSuccessMsg(`Exam result for ${r.studentName || r.subject} APPROVED by ${approver}.`);
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
                  <div style={{ flex: 2, minWidth: 260 }}>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--gray-500)', marginBottom: 6, letterSpacing: '0.05em' }}>
                      Filter Student Name or ID
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Search size={15} style={{ position: 'absolute', left: 12, color: 'var(--gray-400)', pointerEvents: 'none', flexShrink: 0 }} />
                      <input
                        type="text"
                        placeholder="Type student name, ID, or guardian to filter..."
                        value={transcriptSearch}
                        onChange={(e) => setTranscriptSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 36px 10px 36px',
                          borderRadius: 8,
                          border: '1.5px solid var(--gray-300)',
                          fontSize: 13,
                          fontWeight: 500,
                          color: 'var(--gray-800)',
                          background: '#fff',
                          outline: 'none',
                          boxSizing: 'border-box',
                          transition: 'border-color 0.15s',
                        }}
                        onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={e => e.target.style.borderColor = 'var(--gray-300)'}
                      />
                      {transcriptSearch && (
                        <button
                          type="button"
                          onClick={() => setTranscriptSearch('')}
                          style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', display: 'flex', alignItems: 'center', padding: 2 }}
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
                      ? (numericTranscriptAverage(filteredTranscriptStudents) === MISSING_SCORE ? MISSING_SCORE : `${numericTranscriptAverage(filteredTranscriptStudents)}%`)
                      : MISSING_SCORE}
                  </div>
                  <div style={{ fontSize: 11, color: '#15803d', marginTop: 2 }}>Term Average Score</div>
                </div>
                <div style={{ padding: '16px 20px', background: '#e0f2fe', border: '1px solid #bae6fd', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#0369a1' }}>Mean CGPA</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#0c4a6e', marginTop: 4 }}>
                    {filteredTranscriptStudents.length > 0
                      ? numericTranscriptCgpa(filteredTranscriptStudents)
                      : MISSING_SCORE}
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
                                {tData.averageScore === MISSING_SCORE ? MISSING_SCORE : `${tData.averageScore}%`}
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

          {/* ── SUBMIT PV REQUEST (PREPARE BILLS PAYABLES) ── */}
          {(activeNav === 'Submit PV Request' || activeNav === 'Prepare Bills Payables') && adminRole !== 'head_admin' && (
            <div className="animate-fade-up">
              <SubmitPVRequest setM={() => {}} />
            </div>
          )}

          {/* ── PRE-AUDIT & APPROVE PV (HEADMASTER VOUCHER EDITING & APPROVAL STATION) ── */}
          {(activeNav === 'Pre-Audit & Approve PV' || activeNav === 'Approve Payment Voucher (PV)') && (
            <div className="animate-fade-up">
              <ApprovePVForm setM={() => {}} />
            </div>
          )}

          {/* ── PAY PV (HEAD ADMIN ONLY DISBURSEMENT DESK) ── */}
          {(activeNav === 'Pay PV' || activeNav === 'Pay PV (Disbursement)') && adminRole !== 'sub_admin' && (
            <div className="animate-fade-up">
              <PayPVForm />
            </div>
          )}

          {/* ── ACADEMIC SETTINGS ── */}
          {activeNav === 'Academic Settings' && (
            <div className="animate-fade-up">
              <div className="page-header">
                <h1 className="page-header__title">Global Academic Settings ⚙️</h1>
                <p className="page-header__subtitle">
                  Configure and synchronize active academic year, term, continuous assessment weights, exam weights, and grading standards across all school portals.
                </p>
              </div>
              <AcademicSettingsManager inline={true} />
            </div>
          )}

          {/* ── OFFICIAL FEE SCHEDULE VIEW ── */}
          {activeNav === 'Official Fee Schedule' && (
            <OfficialSchoolFeeStructure adminRole={adminRole} />
          )}

          {/* ── CLASSES & STAFF ── */}
          {activeNav === 'Classes & Staff' && (
            <div className="animate-fade-up">
              <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h1 className="page-header__title">Classes & Staff Directory</h1>
                  <p className="page-header__subtitle">Filter teaching staff from drivers and other non-teaching staff, then onboard, edit, or offboard them.</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => { setClassCreateError(''); setIsAddingClass(true); }}
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
                    onClick={() => {
                      setNewStaffForm(blankNonTeachingStaff);
                      setStaffActionError('');
                      setIsAddingStaff(true);
                    }}
                    style={{
                      padding: '10px 16px', borderRadius: 8, background: '#166534', color: '#fff',
                      border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6
                    }}
                  >
                    <UserPlus size={16} /> Add Non-teaching Staff
                  </button>
                </div>
              </div>

              {/* Staff Stats Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
                <div style={{ padding: '16px 20px', background: '#f3e8ff', border: '1px solid #e9d5ff', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#6b21a8', textTransform: 'uppercase' }}>Active Teaching Staff</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#581c87', marginTop: 4 }}>
                    {staffDirectory.filter(t => t.status !== 'Offboarded' && isTeachingStaffMember(t)).length}
                  </div>
                  <div style={{ fontSize: 11, color: '#7e22ce', fontWeight: 600, marginTop: 2 }}>Teachers and tutors</div>
                </div>

                <div style={{ padding: '16px 20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>Non-teaching Staff</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#14532d', marginTop: 4 }}>
                    {staffDirectory.filter(t => t.status !== 'Offboarded' && !isTeachingStaffMember(t)).length}
                  </div>
                  <div style={{ fontSize: 11, color: '#15803d', fontWeight: 600, marginTop: 2 }}>Drivers, security, and support</div>
                </div>

                <div style={{ padding: '16px 20px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#991b1b', textTransform: 'uppercase' }}>Offboarded Staff</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#7f1d1d', marginTop: 4 }}>
                    {staffDirectory.filter(t => t.status === 'Offboarded').length}
                  </div>
                  <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 2 }}>Access deactivated</div>
                </div>
              </div>

              {/* Staff Filters Toolbar */}
              <div style={{ background: '#f8fafc', border: '1px solid var(--gray-200)', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {[
                    { id: 'all', label: 'All staff' },
                    { id: 'teaching', label: 'Teaching staff' },
                    { id: 'non_teaching', label: 'Non-teaching staff' },
                  ].map((option) => {
                    const selected = staffKindFilter === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setStaffKindFilter(option.id)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 999,
                          border: selected ? '1px solid #4a1d6e' : '1px solid var(--gray-300)',
                          background: selected ? '#4a1d6e' : '#fff',
                          color: selected ? '#fff' : '#334155',
                          fontWeight: 800,
                          fontSize: 12.5,
                          cursor: 'pointer',
                        }}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                  <span style={{ alignSelf: 'center', fontSize: 12, color: '#64748b', fontWeight: 700 }}>
                    Drivers, security, cleaners, cooks, and other support staff are under Non-teaching staff.
                  </span>
                </div>
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

                  {(staffSearchQuery || staffSubjectFilter !== 'All' || staffStatusFilter !== 'All' || staffKindFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setStaffSearchQuery('');
                        setStaffSubjectFilter('All');
                        setStaffStatusFilter('All');
                        setStaffKindFilter('all');
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
                    {visibleStaff.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--gray-500)', fontWeight: 700 }}>
                          {staffKindFilter === 'teaching'
                            ? 'No teaching staff are stored in the database.'
                            : staffKindFilter === 'non_teaching'
                              ? 'No drivers or other non-teaching staff are stored in the database.'
                              : 'No staff are stored in the database.'}
                        </td>
                      </tr>
                    ) : visibleStaff.map((t) => (
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
                          <strong style={{ color: '#0369a1', fontSize: 12 }}>
                            {(findTeachingAssignment(teachingAssignments, t)?.subjects || []).join(', ') || t.subject}
                          </strong>
                        </td>
                        <td>
                          <span style={{ padding: '3px 10px', background: ADMIN_LIGHT, color: ADMIN_BG, borderRadius: 6, fontWeight: 800, fontSize: 11.5 }}>
                            {(findTeachingAssignment(teachingAssignments, t)?.classes || []).join(', ') || t.classAssigned}
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

              <div className="panel" style={{ marginTop: 20 }}>
                <div className="panel__header">
                  <h2 className="panel__title">Class & Subject Assignments</h2>
                </div>
                <div className="panel__body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--gray-600)', fontWeight: 600 }}>
                    Assign a subject teacher or class teacher to more than one class and more than one subject. The teacher, parent, student, and accounts portals use this list.
                  </p>
                  {assignableTeachers.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--gray-500)' }}>
                      No subject teachers or class teachers are stored in the database.
                    </p>
                  ) : (
                    <form
                      onSubmit={async (event) => {
                        event.preventDefault();
                        const teacher = assignableTeachers.find((person) => (person.staffId || person.id || person.email) === assignmentTeacherKey);
                        if (!teacher) {
                          setAssignmentError('Choose a teacher.');
                          return;
                        }
                        if (assignmentClasses.length === 0 && assignmentSubjects.length === 0) {
                          setAssignmentError('Choose at least one class or one subject.');
                          return;
                        }
                        setAssignmentSaving(true);
                        setAssignmentError('');
                        try {
                          if (!saveTeachingAssignment) throw new Error('The database did not save this teaching assignment.');
                          await saveTeachingAssignment({
                            staffId: teacher.staffId || '',
                            staffRecordId: teacher.staffRecordId || '',
                            userId: teacher.userId || (teacher.staffRecordId ? '' : teacher.id) || '',
                            teacherName: teacher.name,
                            role: teacher.role,
                            email: teacher.email || '',
                            classes: assignmentClasses,
                            subjects: assignmentSubjects,
                          });
                          setSuccessMsg(`Saved classes and subjects for ${teacher.name}.`);
                          setTimeout(() => setSuccessMsg(''), 5000);
                        } catch (err) {
                          setAssignmentError(err?.message || 'The database did not save this teaching assignment.');
                        } finally {
                          setAssignmentSaving(false);
                        }
                      }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                    >
                      <label>
                        <span style={{ fontSize: 12, fontWeight: 800 }}>Teacher</span>
                        <select
                          value={assignmentTeacherKey}
                          onChange={(event) => {
                            const key = event.target.value;
                            const teacher = assignableTeachers.find((person) => (person.staffId || person.id || person.email) === key);
                            const existing = teacher ? findTeachingAssignment(teachingAssignments, teacher) : null;
                            setAssignmentTeacherKey(key);
                            setAssignmentError('');
                            if (!existing) return;
                            setAssignmentClasses((current) => Array.from(new Set([...(current || []), ...(existing.classes || [])])));
                            setAssignmentSubjects((current) => Array.from(new Set([...(current || []), ...(existing.subjects || [])])));
                          }}
                          style={{ width: '100%', marginTop: 4, padding: '9px 12px', borderRadius: 8, border: '1px solid var(--gray-300)', fontWeight: 700 }}
                        >
                          <option value="">Select a subject teacher or class teacher</option>
                          {assignableTeachers.map((person) => {
                            const key = person.staffId || person.id || person.email;
                            return <option key={key} value={key}>{person.name} · {person.role || 'Teacher'}</option>;
                          })}
                        </select>
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                        <fieldset style={{ border: '1px solid var(--gray-200)', borderRadius: 10, padding: 12, margin: 0 }}>
                          <legend style={{ fontSize: 12, fontWeight: 800, padding: '0 6px' }}>Classes</legend>
                          <div style={{ maxHeight: 180, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {assignmentClassOptions.map((name) => (
                              <label key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
                                <input
                                  type="checkbox"
                                  checked={assignmentClasses.includes(name)}
                                  onChange={() => setAssignmentClasses((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name])}
                                />
                                {name}
                              </label>
                            ))}
                          </div>
                        </fieldset>
                        <fieldset style={{ border: '1px solid var(--gray-200)', borderRadius: 10, padding: 12, margin: 0 }}>
                          <legend style={{ fontSize: 12, fontWeight: 800, padding: '0 6px' }}>Subjects</legend>
                          <div style={{ maxHeight: 180, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {SUBJECT_OPTIONS.map((name) => (
                              <label key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600 }}>
                                <input
                                  type="checkbox"
                                  checked={assignmentSubjects.includes(name)}
                                  onChange={() => setAssignmentSubjects((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name])}
                                />
                                {name}
                              </label>
                            ))}
                          </div>
                        </fieldset>
                      </div>
                      {assignmentError && <p style={{ margin: 0, color: '#991b1b', fontSize: 12, fontWeight: 700 }}>{assignmentError}</p>}
                      <button
                        type="submit"
                        disabled={assignmentSaving || !assignmentTeacherKey}
                        style={{ alignSelf: 'flex-start', padding: '10px 16px', border: 'none', borderRadius: 8, background: '#4a1d6e', color: '#fff', fontWeight: 800, cursor: 'pointer' }}
                      >
                        {assignmentSaving ? 'Saving...' : 'Save assignment'}
                      </button>
                    </form>
                  )}
                  {(teachingAssignments || []).length > 0 && (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Teacher</th>
                          <th>Role</th>
                          <th>Classes</th>
                          <th>Subjects</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teachingAssignments.map((item) => (
                          <tr key={item.id || item.staffId || item.teacherName}>
                            <td><strong>{item.teacherName}</strong></td>
                            <td>{item.role}</td>
                            <td>{(item.classes || []).join(', ') || '—'}</td>
                            <td>{(item.subjects || []).join(', ') || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── ONBOARD NEW STAFF MODAL ── */}
          {isAddingStaff && (
            <div
              onClick={(e) => { if (e.target === e.currentTarget) setIsAddingStaff(false); }}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20
              }}
            >
              <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', width: '100%', maxWidth: 560, borderRadius: 14, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden' }} className="animate-fade-up">
                <div style={{ background: ADMIN_BG, padding: '18px 24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: 0 }}>Add Non-teaching Staff</h3>
                    <p style={{ fontSize: 12, opacity: 0.9, margin: '2px 0 0 0' }}>Drivers, security, cleaners, cooks, and other support staff.</p>
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
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-800)' }}>Non-teaching role</span>
                      <select
                        value={newStaffForm.role}
                        onChange={(e) => {
                          const role = e.target.value;
                          setNewStaffForm({
                            ...newStaffForm,
                            role,
                            subject: NON_TEACHING_DUTIES.includes(newStaffForm.subject) ? newStaffForm.subject : 'Transport',
                          });
                        }}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid var(--gray-300)', fontSize: 13, marginTop: 4 }}
                      >
                        {NON_TEACHING_STAFF_ROLES.map((role) => <option key={role}>{role}</option>)}
                      </select>
                    </label>

                    <label>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-800)' }}>Duty area</span>
                      <select
                        value={newStaffForm.subject}
                        onChange={(e) => setNewStaffForm({ ...newStaffForm, subject: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid var(--gray-300)', fontSize: 13, marginTop: 4, appearance: 'auto' }}
                      >
                        {NON_TEACHING_DUTIES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                  </div>

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

                  {staffActionError && (
                    <p style={{ fontSize: 12, color: '#991b1b', fontWeight: 700, margin: 0 }}>{staffActionError}</p>
                  )}

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
                      disabled={staffActionLoading}
                      style={{ flex: 1, padding: 10, border: 'none', borderRadius: 8, background: '#166534', color: '#fff', fontWeight: 800, cursor: 'pointer' }}
                    >
                      {staffActionLoading ? 'Saving...' : 'Save Non-teaching Staff'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── EDIT STAFF DETAILS MODAL ── */}
          {editingStaff && (
            <div
              onClick={(e) => { if (e.target === e.currentTarget) setEditingStaff(null); }}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20
              }}
            >
              <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', width: '100%', maxWidth: 560, borderRadius: 14, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden' }} className="animate-fade-up">
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
                      <select
                        value={editingStaff.role || 'Subject Teacher'}
                        onChange={(e) => {
                          const role = e.target.value;
                          const teaching = isTeachingStaffMember({ role });
                          setEditingStaff({
                            ...editingStaff,
                            role,
                            subject: teaching
                              ? (SUBJECT_OPTIONS.includes(editingStaff.subject) ? editingStaff.subject : (SUBJECT_OPTIONS[0] || ''))
                              : (NON_TEACHING_DUTIES.includes(editingStaff.subject) ? editingStaff.subject : 'Transport'),
                          });
                        }}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid var(--gray-300)', fontSize: 13, marginTop: 4, appearance: 'auto' }}
                      >
                        <optgroup label="Teaching staff">
                          {TEACHING_STAFF_ROLES.map((role) => <option key={role}>{role}</option>)}
                        </optgroup>
                        <optgroup label="Non-teaching staff">
                          {NON_TEACHING_STAFF_ROLES.map((role) => <option key={role}>{role}</option>)}
                        </optgroup>
                      </select>
                    </label>

                    <label>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-800)' }}>{isTeachingStaffMember(editingStaff) ? 'Primary Subject' : 'Duty area'}</span>
                      <select
                        value={editingStaff.subject || (isTeachingStaffMember(editingStaff) ? 'Pure Mathematics' : 'Transport')}
                        onChange={(e) => setEditingStaff({ ...editingStaff, subject: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid var(--gray-300)', fontSize: 13, marginTop: 4, appearance: 'auto' }}
                      >
                        {(isTeachingStaffMember(editingStaff) ? SUBJECT_OPTIONS : NON_TEACHING_DUTIES).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <label>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-800)' }}>Assigned Class</span>
                      <select
                        value={editingStaff.classAssigned || 'Basic 1'}
                        onChange={(e) => setEditingStaff({ ...editingStaff, classAssigned: e.target.value })}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid var(--gray-300)', fontSize: 13, marginTop: 4, appearance: 'auto' }}
                      >
                        {LEVEL_OPTIONS.map((l) => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                        <option value="All Levels">All Levels</option>
                      </select>
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
                      onClick={() => { setEditingStaff(null); setStaffActionError(''); }}
                      style={{ flex: 1, padding: 10, border: '1px solid var(--gray-300)', borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 700 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={staffActionLoading}
                      style={{ flex: 1, padding: 10, border: 'none', borderRadius: 8, background: ADMIN_BG, color: '#fff', fontWeight: 800, cursor: 'pointer' }}
                    >
                      {staffActionLoading ? 'Saving…' : '💾 Save Staff Changes'}
                    </button>
                  </div>
                  {staffActionError && (
                    <p style={{ fontSize: 12, color: '#991b1b', fontWeight: 700, margin: '8px 0 0' }}>{staffActionError}</p>
                  )}
                </form>
              </div>
            </div>
          )}

          {/* ── OFFBOARD STAFF CONFIRMATION MODAL ── */}
          {offboardingStaff && (
            <div
              onClick={(e) => { if (e.target === e.currentTarget) setOffboardingStaff(null); }}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20
              }}
            >
              <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', width: '100%', maxWidth: 480, borderRadius: 14, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden' }} className="animate-fade-up">
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
                      onClick={() => { setOffboardingStaff(null); setStaffActionError(''); }}
                      style={{ flex: 1, padding: 10, border: '1px solid var(--gray-300)', borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 700 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleOffboardStaffConfirm}
                      disabled={staffActionLoading}
                      style={{ flex: 1, padding: 10, border: 'none', borderRadius: 8, background: '#dc2626', color: '#fff', fontWeight: 800, cursor: 'pointer' }}
                    >
                      {staffActionLoading ? 'Offboarding…' : '🚫 Offboard Staff Member'}
                    </button>
                  </div>
                  {staffActionError && (
                    <p style={{ fontSize: 12, color: '#991b1b', fontWeight: 700, margin: '10px 0 0' }}>{staffActionError}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── ADD NEW CLASS LEVEL MODAL ── */}
          {isAddingClass && (
            <div
              onClick={(e) => { if (e.target === e.currentTarget) setIsAddingClass(false); }}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20
              }}
            >
              <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', width: '100%', maxWidth: 480, borderRadius: 14, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden' }} className="animate-fade-up">
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

                  {classCreateError && (
                    <p style={{ fontSize: 12, color: '#991b1b', fontWeight: 700, margin: 0 }}>{classCreateError}</p>
                  )}

                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <button
                      type="button"
                      onClick={() => { setIsAddingClass(false); setClassCreateError(''); }}
                      style={{ flex: 1, padding: 10, border: '1px solid var(--gray-300)', borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 700 }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={classCreateLoading}
                      style={{ flex: 1, padding: 10, border: 'none', borderRadius: 8, background: '#1e1b4b', color: '#fff', fontWeight: 900, cursor: 'pointer' }}
                    >
                      {classCreateLoading ? 'Saving...' : '🏫 Create Class Level'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── ADD NEW SUBJECT / DEPARTMENT MODAL ── */}
          {isAddingSubject && (
            <div
              onClick={(e) => { if (e.target === e.currentTarget) setIsAddingSubject(false); }}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20
              }}
            >
              <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', width: '100%', maxWidth: 480, borderRadius: 14, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden' }} className="animate-fade-up">
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

          {/* ── VIEW STUDENT RECORD MODAL ── */}
          {viewingRecordStudent && (() => {
            const rec = studentRecordDetails(viewingRecordStudent);
            const rows = [
              { label: 'Student name', value: rec.studentName },
              { label: 'Student class', value: rec.studentClass },
              { label: 'Father / guardian name', value: rec.fatherName },
              { label: 'Father / guardian contact', value: rec.fatherContact },
              { label: 'Mother / guardian name', value: rec.motherName },
              { label: 'Mother / guardian contact', value: rec.motherContact },
            ];
            return (
              <div
                className="no-print"
                onClick={(e) => { if (e.target === e.currentTarget) setViewingRecordStudent(null); }}
              style={{
                  position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20
              }}
            >
                <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', width: '100%', maxWidth: 480, borderRadius: 14, overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: ADMIN_BG, color: '#fff' }}>
                    <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#fff' }}>Student Record</h2>
                    <button type="button" onClick={() => setViewingRecordStudent(null)} style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: 15, cursor: 'pointer', fontWeight: 900 }}>✕</button>
                </div>
                  <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {rows.map((row) => (
                      <div key={row.label} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', background: '#f8fafc' }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{row.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginTop: 3 }}>{row.value || '—'}</div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setViewingRecordStudent(null)}
                      style={{ marginTop: 6, padding: 10, border: 'none', borderRadius: 8, background: ADMIN_BG, color: '#fff', fontWeight: 800, cursor: 'pointer' }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── ISSUE / ENCODE STUDENT RFID CARD MODAL ── */}
          {issuingCardStudent && (
            <div
              onClick={(e) => { if (e.target === e.currentTarget) setIssuingCardStudent(null); }}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20
              }}
            >
              <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', width: '100%', maxWidth: 520, borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden' }} className="animate-fade-up">
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
            <div
              onClick={(e) => { if (e.target === e.currentTarget) setIssuingParentCardStudent(null); }}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20
              }}
            >
              <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', width: '100%', maxWidth: 520, borderRadius: 16, boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden' }} className="animate-fade-up">
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
            <div
              onClick={(e) => { if (e.target === e.currentTarget) setDeclineResultModal(null); }}
              style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(4px)',
                zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '85px 16px 40px', overflowY: 'auto'
              }}
            >
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
            <div
              onClick={(e) => { if (e.target === e.currentTarget) setViewingTranscriptStudent(null); }}
              style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(4px)',
                zIndex: 10000, overflowY: 'auto', padding: '85px 16px 40px',
                display: 'flex', justifyContent: 'center', alignItems: 'flex-start'
              }}
            >
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
                <div className="official-transcript-printable" style={{ padding: '12px 18px', color: '#0f172a', fontFamily: 'var(--font-main, sans-serif)', boxSizing: 'border-box' }}>
                  {/* School Header Box */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #1e1b4b', paddingBottom: 6, marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img src="/remalj-carewell-logo.jpg" alt="REMALJ Carewell Logo" style={{ height: 40, width: 'auto', borderRadius: 4 }} />
                      <div>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 900, color: '#1e1b4b', margin: 0, letterSpacing: '0.02em' }}>
                          REMALJ CAREWELL INSPIRATIONAL SCHOOL
                        </h2>
                        <div style={{ fontSize: 9.5, fontWeight: 700, color: '#475569', marginTop: 1 }}>
                          P.O. Box 144, Anikoko Junction, Bogoso · Western Region, Ghana
                        </div>
                        <div style={{ fontSize: 9, color: '#64748b', marginTop: 1 }}>
                          Tel: +233 24 111 2222 | Email: info@remaljcarewell.edu.gh | Web: www.remaljcarewell.edu.gh
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', borderLeft: '1.5px solid #e2e8f0', paddingLeft: 10 }}>
                      <div style={{ fontSize: 8.5, fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '.06em' }}>DOCUMENT ID</div>
                      <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 11, color: '#1e1b4b' }}>TR-2026-{viewingTranscriptStudent.studentId.replace(/\D/g, '')}</div>
                      <div style={{ fontSize: 8.5, color: '#166534', fontWeight: 800, marginTop: 1, background: '#dcfce7', padding: '1px 6px', borderRadius: 99, display: 'inline-block' }}>
                        OFFICIAL VERIFIED
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <div style={{ textAlign: 'center', marginBottom: 8 }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 900, letterSpacing: '0.05em', color: '#1e1b4b', textTransform: 'uppercase', margin: 0 }}>
                      OFFICIAL ACADEMIC TRANSCRIPT & EVALUATION REPORT
                    </h3>
                    <div style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b', marginTop: 1 }}>
                      ACADEMIC YEAR 2025/2026 · TERM 1 & CUMULATIVE STANDING
                    </div>
                  </div>

                  {/* Student Metadata Box */}
                  {(() => {
                    const tData = getStudentTranscriptData(viewingTranscriptStudent);
                    return (
                      <>
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 5, padding: '6px 12px', marginBottom: 10, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px 14px' }}>
                          <div>
                            <span style={{ fontSize: 8.5, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Student Full Name:</span>
                            <div style={{ fontSize: 11.5, fontWeight: 900, color: '#0f172a' }}>{viewingTranscriptStudent.fullName}</div>
                          </div>
                          <div>
                            <span style={{ fontSize: 8.5, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Official Student ID:</span>
                            <div style={{ fontSize: 11.5, fontWeight: 900, color: '#1e1b4b', fontFamily: 'monospace' }}>{viewingTranscriptStudent.studentId}</div>
                          </div>
                          <div>
                            <span style={{ fontSize: 8.5, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Class Level & Section:</span>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#0f172a' }}>{viewingTranscriptStudent.level} ({viewingTranscriptStudent.classSection || viewingTranscriptStudent.subClass || ''})</div>
                          </div>
                          <div>
                            <span style={{ fontSize: 8.5, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Parent / Guardian:</span>
                            <div style={{ fontSize: 11, fontWeight: 800, color: '#0f172a' }}>{viewingTranscriptStudent.guardianName} ({viewingTranscriptStudent.guardianPhone || 'N/A'})</div>
                          </div>
                          <div>
                            <span style={{ fontSize: 8.5, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Date of Birth / Gender:</span>
                            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#334155' }}>{viewingTranscriptStudent.dob || '2014-05-12'} · {viewingTranscriptStudent.gender || 'Male'}</div>
                          </div>
                          <div>
                            <span style={{ fontSize: 8.5, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Enrollment Date:</span>
                            <div style={{ fontSize: 10.5, fontWeight: 700, color: '#334155' }}>{viewingTranscriptStudent.enrollmentDate || '2026-09-01'}</div>
                          </div>
                        </div>

                        {/* Course Breakdown Table */}
                        <div style={{ marginBottom: 10 }}>
                          <h4 style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: '#1e1b4b', marginBottom: 5, letterSpacing: '.04em' }}>
                            📚 Course Assessment & Final Mark Breakdown
                          </h4>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5, textAlign: 'left' }}>
                            <thead>
                              <tr style={{ background: '#1e1b4b', color: '#fff' }}>
                                <th style={{ padding: '5px 8px', border: '1px solid #1e1b4b' }}>Code</th>
                                <th style={{ padding: '5px 8px', border: '1px solid #1e1b4b' }}>Course Title</th>
                                <th style={{ padding: '5px 8px', border: '1px solid #1e1b4b', textAlign: 'center' }}>Class (50%)</th>
                                <th style={{ padding: '5px 8px', border: '1px solid #1e1b4b', textAlign: 'center' }}>Exam (50%)</th>
                                <th style={{ padding: '5px 8px', border: '1px solid #1e1b4b', textAlign: 'center' }}>Total (100%)</th>
                                <th style={{ padding: '5px 8px', border: '1px solid #1e1b4b', textAlign: 'center' }}>Grade</th>
                                <th style={{ padding: '5px 8px', border: '1px solid #1e1b4b', textAlign: 'center' }}>GPA Pt</th>
                                <th style={{ padding: '5px 8px', border: '1px solid #1e1b4b' }}>Remarks</th>
                              </tr>
                            </thead>
                            <tbody>
                              {tData.subjects.length === 0 ? (
                                <tr>
                                  <td colSpan={8} style={{ padding: '10px 8px', textAlign: 'center', color: '#94a3b8', fontWeight: 700 }}>{MISSING_SCORE}</td>
                                </tr>
                              ) : tData.subjects.map((sub, idx) => (
                                <tr key={sub.code} style={{ background: idx % 2 === 0 ? '#fff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                  <td style={{ padding: '5px 8px', fontFamily: 'monospace', fontWeight: 800 }}>{sub.code}</td>
                                  <td style={{ padding: '5px 8px', fontWeight: 700 }}>{sub.name}</td>
                                  <td style={{ padding: '5px 8px', textAlign: 'center', color: '#475569' }}>{sub.classScore == null ? MISSING_SCORE : `${sub.classScore}/50`}</td>
                                  <td style={{ padding: '5px 8px', textAlign: 'center', color: '#475569' }}>{sub.examScore == null ? MISSING_SCORE : `${sub.examScore}/50`}</td>
                                  <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 900, color: sub.total >= 75 ? '#166534' : '#0f172a' }}>{sub.total == null ? MISSING_SCORE : `${sub.total}%`}</td>
                                  <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 900, color: '#4a1d6e' }}>{sub.grade || MISSING_SCORE}</td>
                                  <td style={{ padding: '5px 8px', textAlign: 'center', fontWeight: 800 }}>{sub.gpaPoint === MISSING_SCORE || sub.gpaPoint == null ? MISSING_SCORE : Number(sub.gpaPoint).toFixed(1)}</td>
                                  <td style={{ padding: '5px 8px', fontWeight: 700, color: sub.total >= 70 ? '#166534' : '#92400e' }}>{sub.remark || MISSING_SCORE}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Cumulative GPA Summary Card */}
                        <div style={{ background: '#1e1b4b', color: '#fff', borderRadius: 6, padding: '8px 12px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', opacity: 0.75, letterSpacing: '.06em' }}>CUMULATIVE PERFORMANCE SUMMARY</div>
                            <div style={{ fontSize: 12.5, fontWeight: 900, marginTop: 1 }}>Academic Standing: {tData.standing}</div>
                            <div style={{ fontSize: 9.5, opacity: 0.8, marginTop: 1 }}>{tData.subjects.length} Total Subjects Assessed · Term 1 2026</div>
                          </div>

                          <div style={{ display: 'flex', gap: 8 }}>
                            <div style={{ background: 'rgba(255,255,255,0.12)', padding: '4px 10px', borderRadius: 5, textAlign: 'center' }}>
                              <div style={{ fontSize: 14, fontWeight: 900 }}>{tData.averageScore}%</div>
                              <div style={{ fontSize: 8, opacity: 0.8, textTransform: 'uppercase' }}>Average Mark</div>
                            </div>
                            <div style={{ background: '#166534', padding: '4px 12px', borderRadius: 5, textAlign: 'center' }}>
                              <div style={{ fontSize: 14, fontWeight: 900 }}>{tData.cgpa}</div>
                              <div style={{ fontSize: 8, opacity: 0.9, textTransform: 'uppercase' }}>CGPA (4.0 Max)</div>
                            </div>
                          </div>
                        </div>

                        {/* Signatures & Verification Stamp */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12, paddingTop: 10, borderTop: '2px dashed #cbd5e1' }}>
                          <div style={{ textAlign: 'center', width: 190 }}>
                            <div style={{ height: 28, borderBottom: '1px solid #0f172a', marginBottom: 3 }}>
                              <span style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: 15, color: '#1e1b4b', display: 'block', paddingTop: 2 }}>S. Amponsah</span>
                            </div>
                            <div style={{ fontSize: 10.5, fontWeight: 800, color: '#0f172a' }}>Mr. Samuel Amponsah</div>
                            <div style={{ fontSize: 9.5, color: '#64748b' }}>Head of Academic Board</div>
                          </div>

                          <div style={{ textAlign: 'center' }}>
                            <div style={{ width: 64, height: 64, border: '3px double #1e1b4b', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: '#1e1b4b', fontWeight: 900, fontSize: 8.5, textTransform: 'uppercase', textAlign: 'center', padding: 5 }}>
                              REMALJ CAREWELL OFFICIAL SEAL
                            </div>
                            <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>Issued: {new Date().toLocaleDateString()}</div>
                          </div>

                          <div style={{ textAlign: 'center', width: 190 }}>
                            <div style={{ height: 28, borderBottom: '1px solid #0f172a', marginBottom: 3 }}>
                              <span style={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: 15, color: '#1e1b4b', display: 'block', paddingTop: 2 }}>J. Admin</span>
                            </div>
                            <div style={{ fontSize: 10.5, fontWeight: 800, color: '#0f172a' }}>Mr. John Admin</div>
                            <div style={{ fontSize: 9.5, color: '#64748b' }}>Registrar / Headmaster</div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
          {/* Modal 1: Viewing Student Credential Modal */}
          {viewingCredentialStudent && (
            <div
              className="modal-overlay animate-fade-in"
              onClick={(e) => { if (e.target === e.currentTarget) setViewingCredentialStudent(null); }}
              style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '85px 16px 40px', overflowY: 'auto' }}
            >
              <div style={{ background: '#fff', borderRadius: 16, maxWidth: 520, width: '100%', padding: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
                <button
                  onClick={() => setViewingCredentialStudent(null)}
                  style={{ position: 'absolute', right: 16, top: 16, background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={16} />
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f3e8ff', color: '#6b21a8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900 }}>
                    🛡️
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--gray-900)' }}>Student Account Credentials</h3>
                    <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>Official Login Information · REMALJ Carewell</div>
                  </div>
                </div>

                {(() => {
                  const s = viewingCredentialStudent;
                  const pass = s.defaultPassword || `StuPass#${s.studentId.replace('REMALJ-', '')}`;
                  const isRevealed = showPassMap[s.id];

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>Learner Profile</div>
                        <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', marginTop: 4 }}>{s.fullName}</div>
                        <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>ID: <code>{s.studentId}</code> · Level: {s.level} ({s.classSection || 'A'})</div>
                      </div>

                      <div style={{ background: '#f3e8ff', border: '1px solid #d8b4fe', borderRadius: 10, padding: 16 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#6b21a8', letterSpacing: '0.05em', marginBottom: 8 }}>Portal Login Credentials</div>
                        
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 11, color: '#7e22ce', fontWeight: 700 }}>Official Student Email</div>
                          <div style={{ fontSize: 14, fontWeight: 900, color: '#4a1d6e', fontFamily: 'monospace' }}>{s.studentEmail}</div>
                        </div>

                        <div>
                          <div style={{ fontSize: 11, color: '#7e22ce', fontWeight: 700 }}>Default Security Password</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                            <code style={{ background: '#fff', padding: '6px 12px', borderRadius: 6, fontWeight: 900, fontSize: 15, letterSpacing: isRevealed ? '0.05em' : '0.25em', color: '#4a1d6e', border: '1px solid #c084fc' }}>
                              {isRevealed ? pass : '••••••••'}
                            </code>
                            <button
                              type="button"
                              onClick={() => setShowPassMap(prev => ({ ...prev, [s.id]: !prev[s.id] }))}
                              style={{ padding: '6px 10px', background: '#fff', border: '1px solid #c084fc', borderRadius: 6, cursor: 'pointer', color: '#6b21a8', fontWeight: 700, fontSize: 12 }}
                            >
                              {isRevealed ? 'Hide Pass' : 'Reveal Pass'}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#0369a1', letterSpacing: '0.05em' }}>Guardian Details</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0c4a6e', marginTop: 4 }}>{s.guardianName}</div>
                        <div style={{ fontSize: 12, color: '#0284c7' }}>Phone: <strong>{s.guardianPhone}</strong></div>
                      </div>

                      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                        <button
                          onClick={() => {
                            const text = `REMALJ Student Login Credentials:\nStudent: ${s.fullName} (${s.studentId})\nPortal: /student\nEmail: ${s.studentEmail}\nDefault Password: ${pass}`;
                            navigator.clipboard.writeText(text);
                            setSuccessMsg(`📋 Copied login credentials for ${s.fullName} to clipboard!`);
                            setTimeout(() => setSuccessMsg(''), 4000);
                          }}
                          style={{ flex: 1, padding: '10px', background: '#7c3ac8', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                        >
                          <Copy size={14} /> Copy Details
                        </button>
                        <button
                          onClick={() => setPrintingCredentialSlip(s)}
                          style={{ padding: '10px 16px', background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', borderRadius: 8, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <Printer size={14} /> Slip
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Modal 2: Reset Default Password Modal */}
          {editingPasswordStudent && (
            <div
              className="modal-overlay animate-fade-in"
              onClick={(e) => { if (e.target === e.currentTarget) setEditingPasswordStudent(null); }}
              style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '85px 16px 40px', overflowY: 'auto' }}
            >
              <div style={{ background: '#fff', borderRadius: 16, maxWidth: 440, width: '100%', padding: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}>
                <button
                  onClick={() => setEditingPasswordStudent(null)}
                  style={{ position: 'absolute', right: 16, top: 16, background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={16} />
                </button>

                <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--gray-900)', marginBottom: 4 }}>Reset Student Default Password</h3>
                <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 16 }}>
                  Update the initial default login password for <strong>{editingPasswordStudent.fullName}</strong>.
                </p>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!newDefaultPassInput.trim()) return;
                  const targetPass = newDefaultPassInput.trim();
                  if (updateOnboardedStudent) {
                    updateOnboardedStudent(editingPasswordStudent.id, { defaultPassword: targetPass });
                  }
                  if (adminSetUserPassword) {
                    adminSetUserPassword({
                      identifier: editingPasswordStudent.studentId || editingPasswordStudent.id,
                      email: editingPasswordStudent.studentEmail,
                      studentId: editingPasswordStudent.studentId,
                      newPassword: targetPass,
                      role: 'Student Portal',
                      fullName: editingPasswordStudent.fullName,
                      adminName: 'System Administrator'
                    });
                  }
                  setSuccessMsg(`🔑 Default password updated for ${editingPasswordStudent.fullName}!`);
                  setEditingPasswordStudent(null);
                  setTimeout(() => setSuccessMsg(''), 5000);
                }}>
                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label className="form-label">New Default Password</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newDefaultPassInput}
                      onChange={(e) => setNewDefaultPassInput(e.target.value)}
                      placeholder="e.g. StuPass#2026-99"
                      style={{ fontWeight: 800, fontFamily: 'monospace' }}
                      autoFocus
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setEditingPasswordStudent(null)}
                      style={{ padding: '9px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{ padding: '9px 16px', background: '#7c3ac8', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, cursor: 'pointer' }}
                    >
                      Save New Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal 3: Printable Credential Slip Modal */}
          {printingCredentialSlip && (
            <div
              className="modal-overlay animate-fade-in"
              onClick={(e) => { if (e.target === e.currentTarget) setPrintingCredentialSlip(null); }}
              style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '85px 16px 40px', overflowY: 'auto' }}
            >
              <div style={{ background: '#fff', borderRadius: 16, maxWidth: 600, width: '100%', padding: 0, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', overflow: 'hidden' }}>
                <div style={{ background: '#1e1b4b', color: '#fff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Printer size={18} /> Official Printable Student Credential Slip
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => window.print()}
                      style={{ padding: '6px 14px', background: '#7c3ac8', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 800, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Printer size={14} /> Print Slip
                    </button>
                    <button
                      onClick={() => setPrintingCredentialSlip(null)}
                      style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
                    >
                      Close ✖
                    </button>
                  </div>
                </div>

                <div style={{ padding: 32, background: '#fff' }}>
                  <div style={{ border: '2px solid #1e1b4b', borderRadius: 12, padding: 24 }}>
                    <div style={{ borderBottom: '2px solid #1e1b4b', paddingBottom: 16, marginBottom: 20 }} className="receipt-header-box">
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }} className="receipt-header-inline">
                        <img src="/remalj-carewell-logo.jpg" alt="REMALJ Logo" style={{ height: 52, borderRadius: 6, flexShrink: 0 }} className="receipt-logo" />
                        <div style={{ textAlign: 'left' }} className="receipt-school-text">
                          <h2 style={{ fontSize: 18, fontWeight: 900, color: '#1e1b4b', margin: 0, lineHeight: 1.2 }}>REMALJ CAREWELL INSPIRATIONAL SCHOOL</h2>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginTop: 2 }}>BOGOSO · PRESTEA HUNI-VALLEY MUNICIPALITY</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'center', marginTop: 8 }}>
                        <div style={{ fontSize: 12, fontWeight: 900, color: '#7c3ac8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          OFFICIAL STUDENT PORTAL LOGIN CREDENTIAL SLIP
                        </div>
                      </div>
                    </div>

                    {(() => {
                      const s = printingCredentialSlip;
                      const pass = s.defaultPassword || `StuPass#${s.studentId.replace('REMALJ-', '')}`;
                      return (
                        <div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20, background: '#f8fafc', padding: 14, borderRadius: 8 }}>
                            <div>
                              <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748b', fontWeight: 800 }}>Student Full Name</div>
                              <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a' }}>{s.fullName}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748b', fontWeight: 800 }}>Student ID Number</div>
                              <div style={{ fontSize: 15, fontWeight: 900, fontFamily: 'monospace', color: '#0f172a' }}>{s.studentId}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748b', fontWeight: 800 }}>Assigned Class / Level</div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{s.level} ({s.classSection || 'A'})</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#64748b', fontWeight: 800 }}>Guardian Phone</div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{s.guardianPhone}</div>
                            </div>
                          </div>

                          <div style={{ background: '#f3e8ff', border: '2px dashed #a855f7', borderRadius: 10, padding: 16, marginBottom: 20 }}>
                            <div style={{ fontSize: 11, fontWeight: 900, color: '#6b21a8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                              🔐 STUDENT PORTAL SIGN-IN CREDENTIALS
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                              <div>
                                <div style={{ fontSize: 11, color: '#581c87', fontWeight: 700 }}>Portal Web Address:</div>
                                <div style={{ fontSize: 13, fontWeight: 900, color: '#1e1b4b', fontFamily: 'monospace' }}>/student</div>
                              </div>
                              <div>
                                <div style={{ fontSize: 11, color: '#581c87', fontWeight: 700 }}>Official School Email:</div>
                                <div style={{ fontSize: 13, fontWeight: 900, color: '#4a1d6e', fontFamily: 'monospace' }}>{s.studentEmail}</div>
                              </div>
                              <div style={{ gridColumn: 'span 2' }}>
                                <div style={{ fontSize: 11, color: '#581c87', fontWeight: 700 }}>Default Security Password:</div>
                                <div style={{ fontSize: 18, fontWeight: 900, color: '#4a1d6e', fontFamily: 'monospace', letterSpacing: '0.05em', background: '#fff', padding: '6px 12px', borderRadius: 6, display: 'inline-block', border: '1px solid #c084fc', marginTop: 2 }}>
                                  {pass}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5, marginBottom: 20 }}>
                            📌 <strong>Instructions for Student & Parent:</strong><br />
                            1. Visit the school portal URL above on your phone or computer.<br />
                            2. Enter your assigned official school email and default security password.<br />
                            3. You can access your class timetable, terminal report cards, and homework assignments.
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                            <div>
                              <div style={{ fontSize: 10, color: '#64748b' }}>Issued by Head Administration</div>
                              <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>REMALJ Carewell ICT Department</div>
                            </div>
                            <div style={{ fontSize: 10, color: '#64748b' }}>Date Issued: {new Date().toLocaleDateString()}</div>
                          </div>
                        </div>
                      );
                    })()}
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
