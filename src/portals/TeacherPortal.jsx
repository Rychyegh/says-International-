import React, { useState } from 'react';
import {
  LayoutDashboard, Users, BookOpen, Calendar, ClipboardList,
  MessageSquare, Settings, TrendingUp, Award, Bell, Bus, ClipboardCheck
} from 'lucide-react';
import '../components/Portal/Portal.css';
import '../components/BusTracker/BusTracker.css';
import BusTracker from '../components/BusTracker/BusTracker';
import { LecturerGrades, LecturerSchedule } from '../components/Academic/AcademicViews';
import TeacherMessages from '../components/TeacherMessages/TeacherMessages';
import ContactDirectory from '../components/ContactDirectory/ContactDirectory';
import { TeacherReports } from '../components/ReportWorkflow/ReportWorkflow';
import OperationsCentre from '../components/OperationsCentre/OperationsCentre';
import { PortalSettings, StaffAssignments, StaffCalendar } from '../components/SchoolWorkflows/SchoolWorkflows';
import { AdmissionsRegister } from '../components/Onboarding/Onboarding';
import AttendanceControlTable from '../components/Attendance/AttendanceControlTable';
import { getAuthUser } from '../services/api';

const TEACHER_GREEN = '#204d2d';
const TEACHER_LIGHT = '#edf8f0';
const TEACHER_ACCENT = '#2e7a44';

const NAV = [
  { icon: <LayoutDashboard size={15}/>, label: 'Dashboard',    badge: null },
  { icon: <Users size={15}/>,           label: 'Students',     badge: null },
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

const STATS = [
  { label: 'Total Students',  value: '148', trend: '+4 this term',  up: true,  icon: '👥', bg: '#dcfce7', ic: '#166534' },
  { label: 'Classes Today',   value: '6',   trend: '2 remaining',   up: true,  icon: '📚', bg: '#dbeafe', ic: '#1e3a8a' },
  { label: 'Assignments Due', value: '11',  trend: '3 not graded',  up: false, icon: '📋', bg: '#fef9c3', ic: '#78350f' },
  { label: 'Avg Class Score', value: '78%', trend: '+2.4% vs last', up: true,  icon: '📈', bg: '#dcfce7', ic: '#166534' },
];

const STUDENTS = [
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

export default function TeacherPortal() {
  const [activeNav, setActiveNav] = useState('Dashboard');

  return (
    <div className="portal">
      <div className="portal__layout">
        {/* Sidebar */}
        <aside className="portal__sidebar">
          <div style={{ margin: '0 0 16px', padding: '14px', background: TEACHER_LIGHT, borderRadius: 'var(--radius-md)', borderLeft: `4px solid ${TEACHER_GREEN}` }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: TEACHER_GREEN }}>Staff Portal</div>
            <div style={{ fontSize: 11, color: '#4a7a5a', marginTop: 2 }}>{getAuthUser()?.fullName || getAuthUser()?.name || 'Mr. Samuel Amponsah'}</div>
          </div>
          <span className="sidebar-section-label">Navigation</span>
          {NAV.slice(0, 8).map((item) => (
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
          <span className="sidebar-section-label">Transport</span>
          <button className={`sidebar-item${activeNav === 'Transport' ? ' active' : ''}`}
            style={activeNav === 'Transport' ? { background: TEACHER_GREEN } : {}}
            onClick={() => setActiveNav('Transport')}>
            <span className="sidebar-item__icon"><Bus size={15}/></span>
            Transport
          </button>
          <span className="sidebar-section-label">Analytics</span>
          {NAV.slice(9, 11).map((item) => (
            <button key={item.label} className={`sidebar-item${activeNav === item.label ? ' active' : ''}`}
              style={activeNav === item.label ? { background: TEACHER_GREEN } : {}}
              onClick={() => setActiveNav(item.label)}>
              <span className="sidebar-item__icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
          <span className="sidebar-section-label">Campus control</span>
          <button className={`sidebar-item${activeNav === 'Operations' ? ' active' : ''}`}
            style={activeNav === 'Operations' ? { background: TEACHER_GREEN } : {}}
            onClick={() => setActiveNav('Operations')}>
            <span className="sidebar-item__icon"><ClipboardCheck size={15}/></span>
            Operations & Governance
          </button>
          <span className="sidebar-section-label">System</span>
          <button className={`sidebar-item${activeNav === 'Settings' ? ' active' : ''}`} style={activeNav === 'Settings' ? { background: TEACHER_GREEN } : {}} onClick={() => setActiveNav('Settings')}><span className="sidebar-item__icon"><Settings size={15}/></span>Settings</button>
        </aside>

        {/* Main content */}
        <main className="portal__content">
          {/* ── TRANSPORT VIEW ── */}
          {activeNav === 'Transport' && (
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
                <h1 className="page-header__title">Good morning, Mr. Amponsah 👋</h1>
                <p className="page-header__subtitle">
                  You have <strong style={{ color: TEACHER_ACCENT }}>6 classes</strong> today and{' '}
                  <strong style={{ color: '#c89a3a' }}>3 assignments</strong> pending review.
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
                    <h2 className="panel__title">Grade 10-A Student Ledger</h2>
                    <button style={{ padding: '6px 14px', fontSize: 11, border: `1.5px solid ${TEACHER_GREEN}`, color: TEACHER_GREEN, borderRadius: 6, background: 'transparent', cursor: 'pointer', fontWeight: 700 }}>+ Add Student</button>
                  </div>
                  <table className="data-table">
                    <thead><tr><th>Student Name</th><th>ID Number</th><th>Attendance</th><th>Maths Grade</th><th>Science Grade</th><th>Status</th></tr></thead>
                    <tbody>
                      {STUDENTS.map((s) => (
                        <tr key={s.name}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                              <div className="avatar" style={{ background: s.color }}>{s.name.charAt(0)}</div>
                              <div>
                                <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>{s.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{s.name.toLowerCase().replace(' ', '.')}@remaljcarewell.edu.gh</div>
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
                  <div style={{ padding: '14px', textAlign: 'center', borderTop: '1px solid var(--gray-100)' }}>
                    <button style={{ fontSize: 13, color: TEACHER_ACCENT, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Load {148 - 5} more students...</button>
                  </div>
                </div>
                {/* Activity */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="panel">
                    <div className="panel__header"><h2 className="panel__title">Recent Activity</h2><Bell size={15} color="var(--gray-400)"/></div>
                    <div className="panel__body">
                      <div className="activity-feed">
                        {ACTIVITY.map((a, i) => (
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
                    <div className="transport-widget__route">Bus 01 – Route A &nbsp;•&nbsp; 22/25 students</div>
                    <div className="transport-widget__row">
                      <div>
                        <div className="transport-widget__stop-label">Next Stop</div>
                        <div className="transport-widget__stop">🚌 Anikoko</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="transport-widget__eta">15:45</div>
                        <div className="transport-widget__eta-label">ETA</div>
                      </div>
                    </div>
                    <div className="transport-track">
                      <div className="transport-track__fill" style={{ width: '62%' }}/>
                      <div className="transport-track__bus" style={{ left: 'calc(62% - 7px)' }}/>
                    </div>
                    <div className="transport-stops"><span>School</span><span>3 stops left</span><span>Anikoko</span></div>
                    <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,.5)', textAlign: 'center' }}>Click to open full tracker →</div>
                  </div>
                </div>
              </div>
              {/* Subject bars */}
              <div className="panel" style={{ marginTop: 18 }}>
                <div className="panel__header"><h2 className="panel__title">Class Subject Performance</h2></div>
                <div className="panel__body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {SUBJECTS.map((row) => (
                    <div className="progress-bar-wrap" key={row.subject}>
                      <div className="progress-bar-label"><span>{row.subject}</span><span style={{ color: row.color, fontWeight: 700 }}>{row.pct}%</span></div>
                      <div className="progress-bar"><div className="progress-bar__fill" style={{ width: `${row.pct}%`, background: row.color }}/></div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeNav === 'Schedule' && <LecturerSchedule />}
          {activeNav === 'Grades' && <LecturerGrades />}
          {activeNav === 'Messages' && <TeacherMessages />}
          {activeNav === 'Students' && (
            <div className="animate-fade-up">
              <AttendanceControlTable />
            </div>
          )}
          {activeNav === 'Admissions' && <AdmissionsRegister />}
          {activeNav === 'Assignments' && <StaffAssignments />}
          {activeNav === 'Academic Calendar' && <StaffCalendar />}
          {activeNav === 'Contacts' && <ContactDirectory />}
          {activeNav === 'Reports' && <TeacherReports />}
          {activeNav === 'Operations' && <OperationsCentre />}
          {activeNav === 'Settings' && <PortalSettings portal="teacher" />}

          {/* ── OTHER VIEWS placeholder ── */}
          {!['Dashboard', 'Transport', 'Students', 'Admissions', 'Assignments', 'Schedule', 'Academic Calendar', 'Grades', 'Messages', 'Contacts', 'Reports', 'Operations', 'Settings'].includes(activeNav) && (
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
