import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  LayoutDashboard, Calendar, ClipboardList,
  Award, Zap, Clock, Bus
} from 'lucide-react';
import '../components/Portal/Portal.css';
import '../components/BusTracker/BusTracker.css';
import BusTracker from '../components/BusTracker/BusTracker';
import { StudentResults, StudentTimetable } from '../components/Academic/AcademicViews';
import { StudentMessagesAssignments } from '../components/SchoolWorkflows/SchoolWorkflows';
import { api, getAuthUser } from '../services/api';
import { usePortalData, teachersForClass } from '../data/PortalStore';

const STUDENT_BG    = '#5e2d0e';
const STUDENT_LIGHT = '#fff1e8';
const STUDENT_ACCENT= '#c8703a';

const NAV = [
  { icon: <LayoutDashboard size={15}/>, label: 'My Dashboard', badge: null },
  { icon: <ClipboardList size={15}/>,   label: 'Assignments',  badge: '5'  },
  { icon: <Award size={15}/>,           label: 'My Grades',    badge: null },
  { icon: <Calendar size={15}/>,        label: 'Timetable',    badge: null },
  { icon: <Zap size={15}/>,             label: 'e-Library',    badge: null },
];

const STATUS_C = { 'Pending': 'status-pill--warn', 'In Progress': 'status-pill--info', 'Overdue': 'status-pill--danger', 'Submitted': 'status-pill--success' };

export default function StudentPortal() {
  const [dashboard, setDashboard] = useState(null);
  const [dashboardError, setDashboardError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setDashboardError('');
    api.getStudentDashboard().then(raw => {
      const next = raw.data || raw;
      if (!Array.isArray(next.stats) || !Array.isArray(next.schedule) || !Array.isArray(next.assignments) || !Array.isArray(next.deadlines)) throw new Error('Invalid dashboard response.');
      if (active) setDashboard(next);
    }).catch(error => { if (active) setDashboardError(error.message); });
    return () => { active = false; };
  }, [retry]);
  const STATS = (dashboard?.stats || []).map(item => ({ ...item, bg: STUDENT_LIGHT, ic: STUDENT_BG, icon: '📊' }));
  const FULL_SCHEDULE = dashboard?.schedule || [];
  const ASSIGNMENTS = dashboard?.assignments || [];
  const DEADLINES = (dashboard?.deadlines || []).map(item => ({ ...item, date: String(item.date || ''), color: STUDENT_ACCENT }));
  const { teachingAssignments = [] } = usePortalData();
  const studentAccount = getAuthUser() || {};
  const studentClass = studentAccount.classSection || studentAccount.assignedClass || studentAccount.classLevel || studentAccount.class_assigned || '';
  const myTeachers = teachersForClass(teachingAssignments, studentClass);
  const [schedulePage, setSchedulePage] = useState(0); // 0: Mon - Wed, 1: Thu - Fri
  const [activeNav, setActiveNavState] = useState(() => {
    const saved = localStorage.getItem('says_student_active_nav');
    const validTabs = ['My Dashboard', 'Assignments', 'My Grades', 'Timetable', 'e-Library', 'My Bus'];
    return (saved && validTabs.includes(saved)) ? saved : 'My Dashboard';
  });

  const setActiveNav = (nav) => {
    setActiveNavState(nav);
    try {
      localStorage.setItem('says_student_active_nav', nav);
    } catch (e) {}
  };

  useEffect(() => {
    const handleNavEvent = (e) => {
      if (e.detail?.portal === 'student' && e.detail?.nav) {
        setActiveNav(e.detail.nav);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('says_navigate', handleNavEvent);
    return () => window.removeEventListener('says_navigate', handleNavEvent);
  }, []);

  return (
    <div className="portal">
      <div className="portal__layout">
        {/* Sidebar */}
        <aside className="portal__sidebar">
          <div style={{ margin: '0 0 16px', padding: '14px', background: STUDENT_LIGHT, borderRadius: 'var(--radius-md)', borderLeft: `4px solid ${STUDENT_BG}` }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: STUDENT_BG }}>Student Portal</div>
            <div style={{ fontSize: 11, color: '#8a5e3a', marginTop: 2 }}>{getAuthUser()?.fullName || getAuthUser()?.name || 'Kwame Edwards'} — Senior High II</div>
          </div>
          <span className="sidebar-section-label">My Space</span>
          {NAV.map((item) => (
            <button key={item.label}
              className={`sidebar-item${activeNav === item.label ? ' active' : ''}`}
              style={activeNav === item.label ? { background: STUDENT_BG } : {}}
              onClick={() => setActiveNav(item.label)}>
              <span className="sidebar-item__icon">{item.icon}</span>
              {item.label}
              {item.badge && <span className="sidebar-item__badge" style={{ background: STUDENT_BG, color: '#fff' }}>{item.badge}</span>}
            </button>
          ))}
          <span className="sidebar-section-label">Transport</span>
          <button className={`sidebar-item${activeNav === 'My Bus' ? ' active' : ''}`}
            style={activeNav === 'My Bus' ? { background: STUDENT_BG } : {}}
            onClick={() => setActiveNav('My Bus')}>
            <span className="sidebar-item__icon"><Bus size={15}/></span>
            My Bus
          </button>
        </aside>

        {/* Main */}
        <main className="portal__content">

          {/* ── BUS VIEW (read-only) ── */}
          {activeNav === 'My Bus' && (
            <div className="animate-fade-up">
              <div className="page-header">
                <p className="page-header__eyebrow" style={{ color: STUDENT_ACCENT }}>
                  <span style={{ background: STUDENT_LIGHT, padding: '2px 10px', borderRadius: 99, border: '1px solid #e8c4a8' }}>My Bus — REMALJ Carewell</span>
                </p>
                <h1 className="page-header__title">My School Bus 🚌</h1>
                <p className="page-header__subtitle">
                  You're on <strong style={{ color: STUDENT_ACCENT }}>Bus 01 – Route A</strong>. See live status below (read-only — contact admin to change your route).
                </p>
              </div>
              {/* Student's own transport card */}
              <div style={{ background: STUDENT_BG, borderRadius: 'var(--radius-lg)', padding: '18px 22px', color: '#fff', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(255,255,255,.5)', marginBottom: 4 }}>Your Bus</div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>Bus 01 – Route A</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)', marginTop: 3 }}>Boarded at Anikoko • Seat 12</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'rgba(255,255,255,.5)', marginBottom: 2 }}>Status</div>
                  <div style={{ background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 800, display: 'inline-block' }}>✓ Boarded</div>
                </div>
              </div>
              {/* Show parent-mode tracker (read-only) */}
              <div style={{ pointerEvents: 'none', opacity: 1 }}>
                <BusTracker mode="parent" />
              </div>
              <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 12, textAlign: 'center' }}>
                Live tracking is view-only for students. Please contact admin or your parent for route changes.
              </p>
            </div>
          )}

          {/* ── DASHBOARD VIEW ── */}
          {activeNav === 'My Dashboard' && (
            <>
              {dashboardError && <p role="alert">Dashboard unavailable: {dashboardError} <button onClick={() => setRetry(x => x + 1)}>Retry</button></p>}
              {!dashboard && !dashboardError && <p role="status">Loading database records…</p>}
              {dashboard && STATS.length === 0 && <p>No dashboard statistics have been recorded.</p>}
              {/* Hero banner */}
              <div style={{
                background: `linear-gradient(135deg, ${STUDENT_BG} 0%, #8b4a1e 100%)`,
                borderRadius: 'var(--radius-lg)', padding: '28px',
                color: '#fff', marginBottom: 28, position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '45%', background: 'linear-gradient(135deg, transparent, rgba(25,152,221,.28))', backgroundImage: 'url(/remalj-carewell-logo.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: .25, borderRadius: '0 var(--radius-lg) var(--radius-lg) 0' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', marginBottom: 6 }}>Academic Excellence</p>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Welcome Back, {studentAccount.fullName || studentAccount.full_name || studentAccount.name || 'Student'} 👋</h1>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', lineHeight: 1.6, maxWidth: 420 }}>
                    View your current school records, assignments, and timetable.
                  </p>
                </div>
              </div>
              {myTeachers.length > 0 && (
                <div className="panel" style={{ marginBottom: 20 }}>
                  <div className="panel__header"><h2 className="panel__title">My teachers · {studentClass}</h2></div>
                  <div className="panel__body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {myTeachers.map((teacher) => (
                      <div key={teacher.id || teacher.staffId || teacher.teacherName}>
                        <strong>{teacher.teacherName}</strong>
                        <span style={{ color: 'var(--gray-500)' }}> · {teacher.role || 'Teacher'}</span>
                        <div style={{ fontSize: 12, color: 'var(--gray-600)' }}>{(teacher.subjects || []).join(', ')}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stats */}
              <div className="stats-grid">
                {STATS.map((s, i) => (
                  <div className="stat-card" key={s.label} style={{ animationDelay: `${i * 70}ms` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div className="stat-card__icon" style={{ background: s.bg, color: s.ic, fontSize: 20 }}>{s.icon}</div>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 99, background: s.bg, color: s.ic }}>
                        {s.trend}
                      </span>
                    </div>
                    <div><div className="stat-card__value">{s.value}</div><div className="stat-card__label">{s.label}</div></div>
                  </div>
                ))}
              </div>

              {/* Content grid */}
              <div className="content-grid">
                {/* Left: schedule + assignments */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Weekly Schedule */}
                  <div className="panel" style={{ overflow: 'hidden' }}>
                    <div className="panel__header" style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <h2 className="panel__title">Weekly Schedule</h2>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button 
                          style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', border: '1px solid var(--gray-200)', background: schedulePage === 0 ? STUDENT_LIGHT : 'var(--gray-50)', color: schedulePage === 0 ? STUDENT_BG : 'var(--gray-600)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}
                          onClick={() => setSchedulePage(0)}
                          title="Monday – Wednesday"
                        >
                          ‹
                        </button>
                        <button 
                          style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', border: '1px solid var(--gray-200)', background: schedulePage === 1 ? STUDENT_LIGHT : 'var(--gray-50)', color: schedulePage === 1 ? STUDENT_BG : 'var(--gray-600)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}
                          onClick={() => setSchedulePage(1)}
                          title="Thursday – Friday"
                        >
                          ›
                        </button>
                      </div>
                    </div>
                    <div className="schedule-table-wrap">
                      <table className="schedule-matrix-table">
                        <thead>
                          <tr>
                            <th style={{ width: 120 }}>TIME</th>
                            {schedulePage === 0 ? (
                              <>
                                <th>MONDAY</th>
                                <th>TUESDAY</th>
                                <th>WEDNESDAY</th>
                              </>
                            ) : (
                              <>
                                <th>THURSDAY</th>
                                <th>FRIDAY</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {FULL_SCHEDULE.map((row) => (
                            <tr key={row.time}>
                              <td className="time-col">{row.time}</td>
                              {schedulePage === 0 ? (
                                [row.Monday, row.Tuesday, row.Wednesday].map((c, ci) => (
                                  <td key={ci}>
                                    {c ? (
                                      <div className="schedule-class-card">
                                        <div className="schedule-class-card__title">{c.sub}</div>
                                        <div className="schedule-class-card__subtitle">{c.room} • {c.teacher}</div>
                                      </div>
                                    ) : <span className="schedule-empty-dash">—</span>}
                                  </td>
                                ))
                              ) : (
                                [row.Thursday, row.Friday].map((c, ci) => (
                                  <td key={ci}>
                                    {c ? (
                                      <div className="schedule-class-card">
                                        <div className="schedule-class-card__title">{c.sub}</div>
                                        <div className="schedule-class-card__subtitle">{c.room} • {c.teacher}</div>
                                      </div>
                                    ) : <span className="schedule-empty-dash">—</span>}
                                  </td>
                                ))
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Assignments */}
                  <div className="panel">
                    <div className="panel__header">
                      <h2 className="panel__title">My Assignments</h2>
                      <button style={{ padding: '6px 14px', fontSize: 11, border: `1.5px solid ${STUDENT_BG}`, color: STUDENT_BG, borderRadius: 6, background: 'transparent', cursor: 'pointer', fontWeight: 700 }}>Submit Work</button>
                    </div>
                    <div className="panel__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {ASSIGNMENTS.map((a) => (
                        <div key={a.title}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <div>
                              <p style={{ fontWeight: 600, fontSize: 13, color: 'var(--gray-900)', marginBottom: 2 }}>{a.title}</p>
                              <p style={{ fontSize: 11, color: 'var(--gray-400)' }}><Clock size={10} style={{ display: 'inline', marginRight: 3 }}/>Due: {a.due}</p>
                            </div>
                            <span className={`status-pill ${STATUS_C[a.status]}`} style={{ marginLeft: 12, flexShrink: 0 }}>{a.status}</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-bar__fill" style={{ width: `${a.pct}%`, background: a.color }}/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: deadlines, student news, quick resources */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Deadlines */}
                  <div className="panel">
                    <div className="panel__header">
                      <h2 className="panel__title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14 }}>🚨</span> Upcoming Deadlines
                      </h2>
                    </div>
                    <div className="panel__body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {DEADLINES.map((d) => (
                        <div key={d.title} style={{ display: 'flex', gap: 12, padding: '10px 12px', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-100)' }}>
                          <div style={{ width: 42, height: 42, background: `${d.color}18`, borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: d.color, fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                            {d.date.split(' ')[0]}<br/>{d.date.split(' ')[1]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--gray-900)' }}>{d.title}</div>
                            <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>{d.type} via Student Portal</div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: d.color, marginTop: 2 }}>{d.time}</div>
                          </div>
                        </div>
                      ))}
                      <button style={{ width: '100%', padding: '8px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', fontSize: 12, fontWeight: 700, color: STUDENT_ACCENT, background: 'none', cursor: 'pointer' }}>View All Deadlines</button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeNav === 'Timetable' && <StudentTimetable />}
          {activeNav === 'My Grades' && <StudentResults />}
          {activeNav === 'Assignments' && <StudentMessagesAssignments showMessages={false} />}

          {/* Other nav placeholders */}
          {!['My Dashboard', 'My Bus', 'Timetable', 'My Grades', 'Assignments'].includes(activeNav) && (
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
