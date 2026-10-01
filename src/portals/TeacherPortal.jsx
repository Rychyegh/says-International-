import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LayoutDashboard, Users, BookOpen, Calendar, ClipboardList,
  MessageSquare, Settings, TrendingUp, Award, Bell, Bus, ClipboardCheck, FileCheck
} from 'lucide-react';
import '../components/Portal/Portal.css';
import '../components/BusTracker/BusTracker.css';
import BusTracker from '../components/BusTracker/BusTracker';
import { LecturerGrades, LecturerSchedule, ExamRegistration } from '../components/Academic/AcademicViews';
import TeacherMessages from '../components/TeacherMessages/TeacherMessages';
import ContactDirectory from '../components/ContactDirectory/ContactDirectory';
import { TeacherReports } from '../components/ReportWorkflow/ReportWorkflow';
import OperationsCentre from '../components/OperationsCentre/OperationsCentre';
import { PortalSettings, StaffAssignments, StaffCalendar } from '../components/SchoolWorkflows/SchoolWorkflows';
import { AdmissionsRegister } from '../components/Onboarding/Onboarding';
import AttendanceControlTable from '../components/Attendance/AttendanceControlTable';
import ScoreSheetEntryForm from '../components/ScoreSheet/ScoreSheetEntryForm';
import { api, getAuthUser, getUserFullName, setAuthUser, enrichTeacherSession, isClassTeacherAccount } from '../services/api';
import { usePortalData } from '../data/PortalStore';

const TEACHER_GREEN = '#204d2d';
const TEACHER_LIGHT = '#edf8f0';
const TEACHER_ACCENT = '#2e7a44';

const NAV = [
  { icon: <LayoutDashboard size={15}/>, label: 'Dashboard',    badge: null },
  { icon: <FileCheck size={15}/>,       label: 'Score Sheet [Entry]', badge: 'SIMS' },
  { icon: <Users size={15}/>,           label: 'Students',     badge: null },
  { icon: <FileCheck size={15}/>,       label: 'Exam Registration', badge: null },
  { icon: <ClipboardCheck size={15}/>,  label: 'Admissions',   badge: null },
  { icon: <ClipboardList size={15}/>,   label: 'Assignments',  badge: '3'  },
  { icon: <BookOpen size={15}/>,        label: 'Grades',       badge: null },
  { icon: <Calendar size={15}/>,        label: 'Schedule',     badge: null },
  { icon: <Calendar size={15}/>,        label: 'Academic Calendar', badge: null },
  { icon: <MessageSquare size={15}/>,   label: 'Messages',     badge: '12' },
  { icon: <Bus size={15}/>,             label: 'Transport',    badge: null },
  { icon: <TrendingUp size={15}/>,      label: 'Reports',      badge: null },
  { icon: <Award size={15}/>,           label: 'Performance',  badge: null },
  { icon: <Settings size={15}/>,        label: 'Settings',     badge: null },
];

const FALLBACK_STUDENTS = [
  { name: 'Abena Mensah', class: 'JHS 3A', score: 92, id: 'REMALJ-2026-041', attendance: 98, mathGrade: 'A+', sciGrade: 'A',  color: '#204d2d' },
  { name: 'Kwame Asante', class: 'JHS 3A', score: 76, id: 'REMALJ-2026-112', attendance: 82, mathGrade: 'B+', sciGrade: 'A-', color: '#1e3a8a' },
  { name: 'Efua Darko',   class: 'JHS 2B', score: 64, id: 'REMALJ-2026-088', attendance: 74, mathGrade: 'C+', sciGrade: 'B',  color: '#78350f' },
  { name: 'Kofi Boateng', class: 'JHS 2B', score: 55, id: 'REMALJ-2026-055', attendance: 61, mathGrade: 'D',  sciGrade: 'C',  color: '#991b1b' },
  { name: 'Ama Owusu',    class: 'JHS 1C', score: 88, id: 'REMALJ-2026-033', attendance: 96, mathGrade: 'A',  sciGrade: 'A+', color: '#204d2d' },
];

const ACTIVITY = [
  { text: 'You graded 14 assignments for JHS 3A Mathematics.',      time: '10 mins ago', color: TEACHER_ACCENT },
  { text: 'Parent meeting: Mensah family – Friday 3 PM.',            time: '1 hr ago',    color: '#3a72c8'     },
  { text: 'New curriculum update available for Primary Science.',    time: '3 hrs ago',   color: '#c89a3a'     },
  { text: 'Kofi Boateng marked absent – 3rd time this week.',       time: 'Yesterday',   color: '#c84a4a'     },
  { text: 'Term results uploaded to admin successfully.',            time: '2 days ago',  color: TEACHER_ACCENT },
];

const SUBJECTS = [
  { subject: 'Mathematics',     pct: 78, color: TEACHER_ACCENT },
  { subject: 'English Language',pct: 85, color: '#3a72c8'      },
  { subject: 'Science',         pct: 71, color: '#c89a3a'      },
  { subject: 'Social Studies',  pct: 90, color: '#c8703a'      },
  { subject: 'ICT',             pct: 82, color: '#7c3ac8'      },
];

const SUBJECT_COLORS = [TEACHER_ACCENT, '#3a72c8', '#c89a3a', '#c8703a', '#7c3ac8'];
const ACTIVITY_COLORS = {
  success: TEACHER_ACCENT,
  info: '#3a72c8',
  warning: '#c89a3a',
  danger: '#c84a4a',
};

const FALLBACK_TRANSPORT = {
  routeLabel: 'Bus 01 – Route A',
  studentsOnBoard: 22,
  capacity: 25,
  nextStop: 'Anikoko',
  eta: '15:45',
  progressPercent: 62,
  stopsLeft: 3,
};

function asList(res, keys) {
  if (Array.isArray(res)) return res;
  if (!res || typeof res !== 'object') return [];
  for (const key of keys) {
    if (Array.isArray(res[key])) return res[key];
  }
  return [];
}

function rowText(row, keys) {
  for (const key of keys) {
    if (row?.[key] != null && String(row[key]).trim()) return String(row[key]).trim();
  }
  return '';
}

function scopeToTeacher(rows, { classLabel, teacherName }) {
  const classKey = classLabel.trim().toLowerCase();
  const teacherKey = teacherName.trim().toLowerCase();
  return rows.filter((row) => {
    const rowClass = rowText(row, ['classLevel', 'class_level', 'level', 'audience', 'class']).toLowerCase();
    const rowTeacher = rowText(row, ['lecturer', 'lecturer_name', 'author', 'author_name', 'teacher', 'teacher_name']).toLowerCase();
    const classOk = !classKey || !rowClass || rowClass === classKey || rowClass.includes(classKey) || classKey.includes(rowClass);
    const teacherOk = !teacherKey || !rowTeacher || rowTeacher === teacherKey || rowTeacher.includes(teacherKey) || teacherKey.includes(rowTeacher);
    return classOk && teacherOk;
  });
}

function isTodayClass(row) {
  const today = new Date();
  const todayLong = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const todayShort = today.toLocaleDateString('en-US', { weekday: 'short' }).toLowerCase().slice(0, 3);
  const day = rowText(row, ['day', 'weekday']).toLowerCase();
  if (day === todayLong || day.slice(0, 3) === todayShort) return true;
  const dateValue = rowText(row, ['date', 'class_date', 'scheduled_date']);
  return Boolean(dateValue) && dateValue.slice(0, 10) === today.toISOString().slice(0, 10);
}

function startMinutes(time) {
  const match = String(time || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = (match[3] || '').toUpperCase();
  if (meridiem === 'PM' && hours < 12) hours += 12;
  if (meridiem === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function isUngradedAssignment(row) {
  const status = rowText(row, ['status', 'grading_status']).toLowerCase();
  if (!status) return true;
  return !['graded', 'approved', 'closed'].includes(status);
}

function computeTeacherStats(timetables, assignments, results) {
  const todayClasses = timetables.filter(isTodayClass);
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const classesRemaining = todayClasses.filter((row) => {
    const start = startMinutes(rowText(row, ['time', 'start_time']));
    return start == null || start >= nowMinutes;
  }).length;
  const openAssignments = assignments.filter(isUngradedAssignment);
  const scores = results
    .map((row) => Number(row.score ?? row.total_score ?? row.totalScore ?? row.average))
    .filter((score) => Number.isFinite(score));
  const averageClassScore = scores.length
    ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10
    : null;
  return {
    classesToday: todayClasses.length,
    classesRemaining,
    assignmentsDue: openAssignments.length,
    assignmentsUngraded: openAssignments.length,
    averageClassScore,
  };
}

export default function TeacherPortal() {
  const store = usePortalData();
  const onboardedStudents = store?.onboardedStudents || [];
  const teacherDirectory = store?.teacherDirectory || [];

  const authUser = enrichTeacherSession(getAuthUser() || {});
  const isClassTeacher = isClassTeacherAccount(authUser);

  useEffect(() => {
    if (!isClassTeacher) return undefined;
    const stored = getAuthUser() || {};
    if (stored.teacherDesignation !== 'class_teacher' && stored.teacher_designation !== 'class_teacher') {
      setAuthUser({
        ...stored,
        ...authUser,
        teacherDesignation: 'class_teacher',
        teacher_designation: 'class_teacher',
        isClassTeacher: true,
        is_class_teacher: true,
        role: 'teacher',
      });
    }
    return undefined;
  }, [isClassTeacher, authUser.email, authUser.staffId]);
  const [classDashboard, setClassDashboard] = useState(null);
  const [recordStats, setRecordStats] = useState(null);
  const staffId = authUser?.staffId || authUser?.staff_id || classDashboard?.teacher?.staffId || '';
  const teacherLabel = getUserFullName(authUser) || classDashboard?.teacher?.fullName || '';
  const classLabel = classDashboard?.teacher?.classAssigned || authUser?.classAssigned || authUser?.class_assigned || '';

  useEffect(() => {
    if (!isClassTeacher) return undefined;
    let cancelled = false;
    api.getClassTeacherDashboard()
      .then((data) => {
        if (!cancelled && data) setClassDashboard(data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isClassTeacher]);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      api.getTimetables(),
      api.getAssignments(),
      api.getResults(),
    ]).then(([timetableResult, assignmentResult, resultResult]) => {
      if (cancelled) return;
      const scope = { classLabel, teacherName: teacherLabel };
      const timetables = timetableResult.status === 'fulfilled'
        ? scopeToTeacher(asList(timetableResult.value, ['timetables', 'schedules', 'items', 'data', 'records']), scope)
        : null;
      const assignments = assignmentResult.status === 'fulfilled'
        ? scopeToTeacher(asList(assignmentResult.value, ['assignments', 'items', 'data', 'records']), scope)
        : null;
      const results = resultResult.status === 'fulfilled'
        ? scopeToTeacher(asList(resultResult.value, ['results', 'scores', 'items', 'data', 'records']), scope)
        : null;
      const computed = computeTeacherStats(timetables || [], assignments || [], results || []);
      setRecordStats({
        classesToday: timetables ? computed.classesToday : undefined,
        classesRemaining: timetables ? computed.classesRemaining : undefined,
        assignmentsDue: assignments ? computed.assignmentsDue : undefined,
        assignmentsUngraded: assignments ? computed.assignmentsUngraded : undefined,
        averageClassScore: results ? computed.averageClassScore : undefined,
      });
    });
    return () => { cancelled = true; };
  }, [classLabel, teacherLabel]);

  const SUBJECT_RESTRICTED = ['Students', 'Admissions', 'Academic Calendar', 'Transport', 'Messages', 'Operations', 'Settings'];

  const [activeNav, setActiveNavState] = useState(() => {
    const saved = localStorage.getItem('says_teacher_active_nav') || 'Dashboard';
    if (!isClassTeacher && SUBJECT_RESTRICTED.includes(saved)) return 'Dashboard';
    return saved;
  });

  const [gradesTarget, setGradesTarget] = useState(null);
  const [scoreSheetTarget, setScoreSheetTarget] = useState(null);

  const setActiveNav = (nav) => {
    setActiveNavState(nav);
    try {
      localStorage.setItem('says_teacher_active_nav', nav);
    } catch (e) {}
  };

  useEffect(() => {
    if (!isClassTeacher && SUBJECT_RESTRICTED.includes(activeNav)) {
      setActiveNav('Dashboard');
    }
  }, [isClassTeacher, activeNav]);

  useEffect(() => {
    const handleNavEvent = (e) => {
      if (e.detail?.portal === 'teacher' && e.detail?.nav) {
        if (!isClassTeacher && SUBJECT_RESTRICTED.includes(e.detail.nav)) {
          setActiveNav('Dashboard');
        } else {
          setActiveNav(e.detail.nav);
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('says_navigate', handleNavEvent);
    return () => window.removeEventListener('says_navigate', handleNavEvent);
  }, [isClassTeacher]);

  const teacherName = teacherLabel || 'Staff';
  const classAssignedLabel = classLabel;
  const dashboardStats = classDashboard?.stats || {};
  const classesToday = recordStats?.classesToday ?? dashboardStats.classesToday;
  const classesRemaining = recordStats?.classesRemaining ?? dashboardStats.classesRemaining;
  const assignmentsDue = recordStats?.assignmentsDue ?? dashboardStats.assignmentsDue;
  const assignmentsUngraded = recordStats?.assignmentsUngraded ?? dashboardStats.assignmentsUngraded;
  const averageClassScore = recordStats?.averageClassScore ?? dashboardStats.averageClassScore;
  const averageScoreDelta = dashboardStats.averageScoreDelta;
  const classesTodayLabel = classesToday == null ? '—' : String(classesToday);
  const assignmentsDueLabel = assignmentsDue == null ? '—' : String(assignmentsDue);
  const averageScoreLabel = averageClassScore == null ? '—' : `${averageClassScore}%`;
  const classesTrend = classesRemaining == null ? 'From the timetable' : `${classesRemaining} remaining`;
  const assignmentsTrend = assignmentsUngraded == null ? 'From assignment records' : `${assignmentsUngraded} not graded`;
  const scoreTrend = averageClassScore == null
    ? 'No recorded scores'
    : (averageScoreDelta == null ? 'From recorded results' : `${Number(averageScoreDelta) >= 0 ? '+' : ''}${averageScoreDelta}% vs last`);
  const liveTransport = (isClassTeacher && classDashboard?.transport) ? classDashboard.transport : FALLBACK_TRANSPORT;
  const activityFeed = classDashboard?.activity?.length
    ? classDashboard.activity.map((item) => ({
      text: item.text,
      time: item.time,
      color: ACTIVITY_COLORS[item.tone] || TEACHER_ACCENT,
    }))
    : ACTIVITY;
  const subjectRows = classDashboard?.subjects?.length
    ? classDashboard.subjects.map((row, index) => ({
      subject: row.subject,
      pct: row.pct,
      color: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
    }))
    : SUBJECTS;

  const rosterFromStore = onboardedStudents.length > 0 ? onboardedStudents.map(s => ({
    name: s.fullName,
    class: s.level,
    score: 85,
    id: s.studentId,
    attendance: 95,
    mathGrade: 'A',
    sciGrade: 'A-',
    color: TEACHER_GREEN,
    email: s.studentEmail || `${(s.fullName || '').toLowerCase().replace(/\s+/g, '.')}@remaljcarewell.edu.gh`,
    status: 'Enrolled',
  })) : FALLBACK_STUDENTS;

  const assignedKey = classAssignedLabel.trim().toLowerCase();
  const classRoster = assignedKey
    ? rosterFromStore.filter((student) => String(student.class || '').trim().toLowerCase() === assignedKey)
    : [];
  const displayStudents = classDashboard?.students?.length
    ? classDashboard.students.map((student) => ({ ...student, color: TEACHER_GREEN }))
    : (classRoster.length ? classRoster : rosterFromStore);
  const usingLiveRoster = Boolean(classDashboard?.students?.length) || onboardedStudents.length > 0;

  const STATS = [
    { label: 'Total Students',  value: String(dashboardStats.totalStudents ?? displayStudents.length), trend: 'Active enrolled roster',  up: true,  icon: '👥', bg: '#dcfce7', ic: '#166534' },
    { label: 'Classes Today',   value: classesTodayLabel,   trend: classesTrend,   up: true,  icon: '📚', bg: '#dbeafe', ic: '#1e3a8a' },
    { label: 'Assignments Due', value: assignmentsDueLabel,  trend: assignmentsTrend,  up: assignmentsUngraded != null && Number(assignmentsUngraded) === 0, icon: '📋', bg: '#fef9c3', ic: '#78350f' },
    { label: 'Avg Class Score', value: averageScoreLabel, trend: scoreTrend, up: averageScoreDelta == null || Number(averageScoreDelta) >= 0,  icon: '📈', bg: '#dcfce7', ic: '#166534' },
  ];

  return (
    <div className="portal">
      <div className="portal__layout">
        {/* Sidebar */}
        <aside className="portal__sidebar">
          <div style={{ margin: '0 0 16px', padding: '14px', background: TEACHER_LIGHT, borderRadius: 'var(--radius-md)', borderLeft: `4px solid ${TEACHER_GREEN}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: 13, color: TEACHER_GREEN }}>Staff Portal</div>
              <span style={{ fontSize: 10, fontWeight: 900, padding: '3px 8px', borderRadius: 4, background: isClassTeacher ? '#204d2d' : '#2563eb', color: '#fff' }}>
                {isClassTeacher ? '👑 CLASS TEACHER' : '👨‍🔬 SUBJECT TEACHER'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#4a7a5a', marginTop: 4, fontWeight: 600 }}>
              {teacherName}{staffId ? <> (ID: <code>{staffId}</code>)</> : null}
            </div>
            <div style={{ fontSize: 11, color: '#166534', marginTop: 4, fontWeight: 700 }}>
              {isClassTeacher ? `Form Tutor${classAssignedLabel ? ` • ${classAssignedLabel}` : ''}` : 'Subject Instructor'}
            </div>
          </div>
          <span className="sidebar-section-label">Navigation</span>
          {NAV.slice(0, 9)
            .filter((item) => isClassTeacher || !SUBJECT_RESTRICTED.includes(item.label))
            .map((item) => (
            <button key={item.label} className={`sidebar-item${activeNav === item.label ? ' active' : ''}`}
              style={activeNav === item.label ? { background: TEACHER_GREEN } : {}}
              onClick={() => setActiveNav(item.label)}>
              <span className="sidebar-item__icon">{item.icon}</span>
              {item.label}
              {item.badge && <span className="sidebar-item__badge" style={{ background: TEACHER_GREEN, color: '#fff' }}>{item.badge}</span>}
            </button>
          ))}
          <button className={`sidebar-item${activeNav === 'Contacts' ? ' active' : ''}`}
            style={activeNav === 'Contacts' ? { background: TEACHER_GREEN } : {}}
            onClick={() => setActiveNav('Contacts')}>
            <span className="sidebar-item__icon"><Users size={15}/></span>
            Contacts
          </button>

          {/* Transport, Messages, Operations & Settings only for Class Teachers */}
          {isClassTeacher && (
            <>
              <span className="sidebar-section-label">Transport</span>
              <button className={`sidebar-item${activeNav === 'Transport' ? ' active' : ''}`}
                style={activeNav === 'Transport' ? { background: TEACHER_GREEN } : {}}
                onClick={() => setActiveNav('Transport')}>
                <span className="sidebar-item__icon"><Bus size={15}/></span>
                Transport
              </button>
              <span className="sidebar-section-label">Analytics</span>
              <button className={`sidebar-item${activeNav === 'Messages' ? ' active' : ''}`}
                style={activeNav === 'Messages' ? { background: TEACHER_GREEN } : {}}
                onClick={() => setActiveNav('Messages')}>
                <span className="sidebar-item__icon"><MessageSquare size={15}/></span>
                Messages
                <span className="sidebar-item__badge" style={{ background: TEACHER_GREEN, color: '#fff' }}>12</span>
              </button>
              <span className="sidebar-section-label">Campus control</span>
              <button className={`sidebar-item${activeNav === 'Operations' ? ' active' : ''}`}
                style={activeNav === 'Operations' ? { background: TEACHER_GREEN } : {}}
                onClick={() => setActiveNav('Operations')}>
                <span className="sidebar-item__icon"><ClipboardCheck size={15}/></span>
                Operations & Governance
              </button>
              <span className="sidebar-section-label">System</span>
              <button className={`sidebar-item${activeNav === 'Settings' ? ' active' : ''}`} 
                style={activeNav === 'Settings' ? { background: TEACHER_GREEN } : {}} 
                onClick={() => setActiveNav('Settings')}>
                <span className="sidebar-item__icon"><Settings size={15}/></span>
                Settings
              </button>
            </>
          )}
        </aside>

        {/* Main content */}
        <main className="portal__content">
          {/* ── TRANSPORT VIEW ── */}
          {activeNav === 'Transport' && isClassTeacher && (
            <div className="animate-fade-up">
              <div className="page-header">
                <p className="page-header__eyebrow" style={{ color: TEACHER_ACCENT }}>
                  <span style={{ background: TEACHER_LIGHT, padding: '2px 10px', borderRadius: 99, border: '1px solid #c4dfc9' }}>
                    Transport — REMALJ Carewell
                  </span>
                </p>
                <h1 className="page-header__title">Bus Tracking & Fleet Management 🚌</h1>
                <p className="page-header__subtitle">
                  Monitor all <strong style={{ color: TEACHER_ACCENT }}>4 active routes</strong> in real-time, manage student manifests, and contact drivers.
                </p>
              </div>
              {/* Quick stats */}
              <div className="stats-grid" style={{ marginBottom: 20 }}>
                {[
                  { label: 'Buses On Route',   value: '3', icon: '🚌', bg: '#dcfce7', ic: '#166534' },
                  { label: 'Students In Transit', value: '60', icon: '👥', bg: '#dbeafe', ic: '#1e3a8a' },
                  { label: 'At School',         value: '1', icon: '🏫', bg: '#fef9c3', ic: '#78350f' },
                  { label: 'Avg ETA Accuracy',  value: '97%', icon: '⏱', bg: '#dcfce7', ic: '#166534' },
                ].map((s, i) => (
                  <div className="stat-card" key={s.label} style={{ animationDelay: `${i * 60}ms` }}>
                    <div className="stat-card__icon" style={{ background: s.bg, color: s.ic, fontSize: 20 }}>{s.icon}</div>
                    <div><div className="stat-card__value">{s.value}</div><div className="stat-card__label">{s.label}</div></div>
                  </div>
                ))}
              </div>
              <BusTracker mode="teacher" />
            </div>
          )}

          {/* ── DASHBOARD VIEW ── */}
          {activeNav === 'Dashboard' && (
            <>
              <div className="page-header">
                <p className="page-header__eyebrow" style={{ color: TEACHER_ACCENT }}>
                  <span style={{ background: TEACHER_LIGHT, padding: '2px 10px', borderRadius: 99, border: '1px solid #c4dfc9' }}>Staff Portal — REMALJ Carewell</span>
                </p>
                <h1 className="page-header__title">Good morning, {teacherName} 👋</h1>
                <p className="page-header__subtitle">
                  You have <strong style={{ color: TEACHER_ACCENT }}>{classesTodayLabel} classes</strong> today and{' '}
                  <strong style={{ color: '#c89a3a' }}>{assignmentsUngraded == null ? '—' : assignmentsUngraded} assignments</strong> pending review.
                  {isClassTeacher && classAssignedLabel ? <> Form class: <strong style={{ color: TEACHER_ACCENT }}>{classAssignedLabel}</strong>.</> : null}
                </p>
              </div>
              <div className="stats-grid">
                {STATS.map((s, i) => (
                  <div className="stat-card" key={s.label} style={{ animationDelay: `${i * 70}ms` }}>
                    <div className="stat-card__icon" style={{ background: s.bg, color: s.ic, fontSize: 20 }}>{s.icon}</div>
                    <div><div className="stat-card__value">{s.value}</div><div className="stat-card__label">{s.label}</div></div>
                    <div className={`stat-card__trend stat-card__trend--${s.up ? 'up' : 'down'}`}>{s.up ? '↑' : '↓'} {s.trend}</div>
                  </div>
                ))}
              </div>
              <div className="content-grid">
                {/* Students table */}
                <div className="panel">
                  <div className="panel__header">
                    <h2 className="panel__title">{classAssignedLabel ? `${classAssignedLabel} Student Ledger` : 'Class Student Ledger'}</h2>
                  </div>
                  <table className="data-table">
                    <thead><tr><th>Student Name</th><th>ID Number</th><th>Attendance</th><th>Maths Grade</th><th>Science Grade</th><th>Status</th></tr></thead>
                    <tbody>
                      {displayStudents.map((s) => (
                        <tr key={s.name}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                              <div className="avatar" style={{ background: s.color }}>{s.name.charAt(0)}</div>
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{s.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{s.email || `${s.name.toLowerCase().replace(/\s+/g, '.')}@remaljcarewell.edu.gh`}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--gray-500)' }}>{s.id}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 40, height: 4, background: 'var(--gray-200)', borderRadius: 9999, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${s.attendance}%`, background: s.attendance >= 90 ? '#16a34a' : s.attendance >= 75 ? '#d97706' : '#dc2626', borderRadius: 9999 }} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: s.attendance >= 90 ? '#166534' : '#78350f' }}>{s.attendance}%</span>
                            </div>
                          </td>
                          <td><span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 800 }}>{s.mathGrade}</span></td>
                          <td><span style={{ background: '#dbeafe', color: '#1e3a8a', padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 800 }}>{s.sciGrade}</span></td>
                          <td><span className="status-pill status-pill--success">Enrolled</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {!usingLiveRoster && (
                    <div style={{ padding: '14px', textAlign: 'center', borderTop: '1px solid var(--gray-100)' }}>
                      <span style={{ fontSize: 13, color: 'var(--gray-400)', fontWeight: 600 }}>Sample class list until the class teacher dashboard is available.</span>
                    </div>
                  )}
                </div>
                {/* Activity */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="panel">
                    <div className="panel__header"><h2 className="panel__title">Recent Activity</h2><Bell size={15} color="var(--gray-400)"/></div>
                    <div className="panel__body">
                      <div className="activity-feed">
                        {activityFeed.map((a, i) => (
                          <div className="activity-item" key={i}>
                            <div className="activity-item__dot" style={{ background: a.color }}/>
                            <div className="activity-item__content">
                              <p className="activity-item__text">{a.text}</p>
                              <p className="activity-item__time">{a.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Transport mini */}
                  <div
                    className="transport-widget"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setActiveNav('Transport')}
                    title="View full transport tracker"
                  >
                    <div className="transport-widget__label">Transport — Live</div>
                    <div className="transport-widget__route">{liveTransport.routeLabel} &nbsp;•&nbsp; {liveTransport.studentsOnBoard}/{liveTransport.capacity} students</div>
                    <div className="transport-widget__row">
                      <div>
                        <div className="transport-widget__stop-label">Next Stop</div>
                        <div className="transport-widget__stop">🚌 {liveTransport.nextStop}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="transport-widget__eta">{liveTransport.eta}</div>
                        <div className="transport-widget__eta-label">ETA</div>
                      </div>
                    </div>
                    <div className="transport-track">
                      <div className="transport-track__fill" style={{ width: `${liveTransport.progressPercent}%` }}/>
                      <div className="transport-track__bus" style={{ left: `calc(${liveTransport.progressPercent}% - 7px)` }}/>
                    </div>
                    <div className="transport-stops"><span>School</span><span>{liveTransport.stopsLeft} stops left</span><span>{liveTransport.nextStop}</span></div>
                    <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,.5)', textAlign: 'center' }}>Click to open full tracker →</div>
                  </div>
                </div>
              </div>
              {/* Subject bars */}
              <div className="panel" style={{ marginTop: 18 }}>
                <div className="panel__header"><h2 className="panel__title">Class Subject Performance</h2></div>
                <div className="panel__body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {subjectRows.map((row) => (
                    <div className="progress-bar-wrap" key={row.subject}>
                      <div className="progress-bar-label"><span>{row.subject}</span><span style={{ color: row.color, fontWeight: 700 }}>{row.pct}%</span></div>
                      <div className="progress-bar"><div className="progress-bar__fill" style={{ width: `${row.pct}%`, background: row.color }}/></div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeNav === 'Score Sheet [Entry]' && (
            <div className="animate-fade-up">
              <div className="page-header">
                <h1 className="page-header__title">SIMS Score Sheet [Entry] 📝</h1>
                <p className="page-header__subtitle">
                  Enter student progressive evaluation scores for arrival test, class tests (1, 2, 3), and end-of-term examinations. Converts continuous assessment and exams to 50% weighting each.
                </p>
              </div>
              <ScoreSheetEntryForm
                students={onboardedStudents}
                initialTarget={scoreSheetTarget}
                onViewTestRoll={(target) => {
                  setGradesTarget(target);
                  setActiveNav('Grades');
                }}
              />
            </div>
          )}

          {activeNav === 'Schedule' && <LecturerSchedule />}
          {activeNav === 'Grades' && (
            <div className="animate-fade-up">
              <div style={{ marginBottom: 16, display: 'flex', gap: 10 }}>
                <button
                  onClick={() => {
                    setScoreSheetTarget(null);
                    setActiveNav('Score Sheet [Entry]');
                  }}
                  style={{ padding: '8px 16px', background: TEACHER_GREEN, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  📝 Open Score Sheet [Entry] Form
                </button>
              </div>
              <LecturerGrades
                initialTarget={gradesTarget}
                onOpenScoreSheet={(target) => {
                  setScoreSheetTarget(target);
                  setActiveNav('Score Sheet [Entry]');
                }}
              />
            </div>
          )}
          {activeNav === 'Messages' && isClassTeacher && <TeacherMessages />}
          {activeNav === 'Students' && isClassTeacher && (
            <div className="animate-fade-up">
              <AttendanceControlTable />
            </div>
          )}
          {activeNav === 'Exam Registration' && <ExamRegistration />}
          {activeNav === 'Admissions' && isClassTeacher && <AdmissionsRegister />}
          {activeNav === 'Assignments' && <StaffAssignments />}
          {activeNav === 'Academic Calendar' && isClassTeacher && <StaffCalendar />}
          {activeNav === 'Contacts' && <ContactDirectory />}
          {activeNav === 'Reports' && <TeacherReports />}
          {activeNav === 'Operations' && isClassTeacher && <OperationsCentre />}
          {activeNav === 'Settings' && isClassTeacher && <PortalSettings portal="teacher" />}

          {/* ── OTHER VIEWS placeholder ── */}
          {!['Dashboard', 'Transport', 'Score Sheet [Entry]', 'Students', 'Exam Registration', 'Admissions', 'Assignments', 'Schedule', 'Academic Calendar', 'Grades', 'Messages', 'Contacts', 'Reports', 'Operations', 'Settings'].includes(activeNav) && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12 }}>
              <div style={{ fontSize: 48 }}>🚧</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--gray-700)' }}>{activeNav} — Coming Soon</h2>
              <p style={{ color: 'var(--gray-400)', fontSize: 14 }}>This section is being built. Check back soon.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
