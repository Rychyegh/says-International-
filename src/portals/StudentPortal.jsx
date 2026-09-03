import React, { useState } from 'react';
import {
  LayoutDashboard, BookOpen, Calendar, ClipboardList,
  Award, MessageSquare, Settings, Zap, Star, Clock, Bus
} from 'lucide-react';
import '../components/Portal/Portal.css';
import '../components/BusTracker/BusTracker.css';
import BusTracker from '../components/BusTracker/BusTracker';
import { CourseRegistration, StudentResults, StudentTimetable } from '../components/Academic/AcademicViews';
import { PortalSettings, StudentMessagesAssignments } from '../components/SchoolWorkflows/SchoolWorkflows';
import { getAuthUser } from '../services/api';

const STUDENT_BG    = '#5e2d0e';
const STUDENT_LIGHT = '#fff1e8';
const STUDENT_ACCENT= '#c8703a';

const NAV = [
  { icon: <LayoutDashboard size={15}/>, label: 'My Dashboard', badge: null },
  { icon: <BookOpen size={15}/>,        label: 'Subjects',     badge: null },
  { icon: <ClipboardList size={15}/>,   label: 'Assignments',  badge: '5'  },
  { icon: <Award size={15}/>,           label: 'My Grades',    badge: null },
  { icon: <Calendar size={15}/>,        label: 'Timetable',    badge: null },
  { icon: <Zap size={15}/>,             label: 'e-Library',    badge: null },
  { icon: <Bus size={15}/>,             label: 'My Bus',       badge: null },
  { icon: <MessageSquare size={15}/>,   label: 'Messages',     badge: '3'  },
  { icon: <Star size={15}/>,            label: 'Achievements', badge: null },
  { icon: <Settings size={15}/>,        label: 'Settings',     badge: null },
];

const STATS = [
  { label: 'Cumulative GPA',    value: '3.92', trend: 'Top 5% of class',   up: true,  icon: '🎓', bg: STUDENT_LIGHT,  ic: STUDENT_BG   },
  { label: 'Attendance Rate',   value: '94%',  trend: 'On Track',          up: true,  icon: '✅', bg: '#dcfce7',      ic: '#166534'    },
  { label: 'Active Tasks',      value: '18',   trend: '5 due this week',   up: false, icon: '📋', bg: '#fef9c3',      ic: '#78350f'    },
  { label: 'Credits This Term', value: '18',   trend: 'Active',            up: true,  icon: '⭐', bg: '#dbeafe',      ic: '#1e3a8a'    },
];

const SCHEDULE = [
  { time: '08:00 AM', mon: { sub: 'Pure Mathematics', room: 'Room 402',    teacher: 'Prof. Mensah' }, tue: null,                                          wed: { sub: 'Literature in English', room: 'Auditorium B', teacher: 'Dr. Anane' } },
  { time: '10:30 AM', mon: null,                                            tue: { sub: 'Physics Lab', room: 'Science Block 1', teacher: 'Mr. Boateng' },  wed: null },
  { time: '01:00 PM', mon: { sub: 'ICT Project',     room: 'Lab 2',         teacher: 'Ms. Mensah'   }, tue: { sub: 'English Essay',  room: 'Room 204',    teacher: 'Mrs. Adjei' }, wed: { sub: 'Mathematics', room: 'Room 402', teacher: 'Prof. Mensah' } },
];

const DEADLINES = [
  { title: 'Advanced Calculus Thesis', date: 'Oct 24', time: '10:00 PM',  type: 'Submission', color: '#c84a4a' },
  { title: 'Eco-Sustainability Project', date: 'Oct 27', time: '02:30 PM', type: 'Presentation', color: '#c89a3a' },
];

const QUICK = [
  { icon: '📚', label: 'e-Library'  },
  { icon: '💳', label: 'Fees'       },
  { icon: '📨', label: 'Requests'   },
  { icon: '💬', label: 'Support'    },
];

const ACHIEVEMENTS = [
  { icon: '🥇', title: 'Top of Class',       desc: 'Mathematics – Term 1' },
  { icon: '🔥', title: 'Perfect Attendance', desc: 'March 2024'            },
  { icon: '📖', title: 'Bookworm',           desc: 'Read 10+ books'        },
  { icon: '💡', title: 'Science Star',       desc: 'Best Lab Report'       },
];

const TIMETABLE = [
  { day: 'Mon', classes: ['Math 8AM', 'English 10AM', 'ICT 2PM'] },
  { day: 'Tue', classes: ['Science 8AM', 'Soc. Studies 11AM'] },
  { day: 'Wed', classes: ['Math 8AM', 'English 10AM'] },
  { day: 'Thu', classes: ['Science 9AM', 'ICT 1PM'] },
  { day: 'Fri', classes: ['Math 8AM', 'Soc. Studies 10AM', 'English 2PM'] },
];

const ASSIGNMENTS = [
  { title: 'Advanced Calculus Thesis',     due: 'Oct 24', status: 'Pending',     pct: 60, color: '#c84a4a' },
  { title: 'Eco-Sustainability Project',   due: 'Oct 27', status: 'In Progress', pct: 40, color: '#c89a3a' },
  { title: 'Science Lab Report – Osmosis', due: 'Oct 10', status: 'Overdue',     pct: 0,  color: '#991b1b' },
  { title: 'ICT Project – Database',       due: 'Nov 1',  status: 'Pending',     pct: 10, color: '#7c3ac8' },
];

const STATUS_C = { 'Pending': 'status-pill--warn', 'In Progress': 'status-pill--info', 'Overdue': 'status-pill--danger', 'Submitted': 'status-pill--success' };

export default function StudentPortal() {
  const [activeNav, setActiveNav] = useState('My Dashboard');

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
          {NAV.slice(0, 6).map((item) => (
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
          <span className="sidebar-section-label">More</span>
          {NAV.slice(7, 10).map((item) => (
            <button key={item.label}
              className={`sidebar-item${activeNav === item.label ? ' active' : ''}`}
              style={activeNav === item.label ? { background: STUDENT_BG } : {}}
              onClick={() => setActiveNav(item.label)}>
              <span className="sidebar-item__icon">{item.icon}</span>
              {item.label}
              {item.badge && <span className="sidebar-item__badge" style={{ background: STUDENT_BG, color: '#fff' }}>{item.badge}</span>}
            </button>
          ))}

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
              {/* Hero banner */}
              <div style={{
                background: `linear-gradient(135deg, ${STUDENT_BG} 0%, #8b4a1e 100%)`,
                borderRadius: 'var(--radius-lg)', padding: '28px',
                color: '#fff', marginBottom: 28, position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '45%', background: 'linear-gradient(135deg, transparent, rgba(25,152,221,.28))', backgroundImage: 'url(/remalj-carewell-logo.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', opacity: .25, borderRadius: '0 var(--radius-lg) var(--radius-lg) 0' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)', marginBottom: 6 }}>Academic Excellence</p>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Welcome Back, Kwame 👋</h1>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', lineHeight: 1.6, maxWidth: 420 }}>
                    Your term performance is exceptional. You are in the top 5% of the Senior High II cohort.
                  </p>
                </div>
              </div>

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
                  <div className="panel">
                    <div className="panel__header">
                      <h2 className="panel__title">Weekly Schedule</h2>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', border: '1px solid var(--gray-200)', background: 'var(--gray-50)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>‹</button>
                        <button style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', border: '1px solid var(--gray-200)', background: 'var(--gray-50)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>›</button>
                      </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table className="data-table">
                        <thead><tr><th>TIME</th><th>MONDAY</th><th>TUESDAY</th><th>WEDNESDAY</th></tr></thead>
                        <tbody>
                          {SCHEDULE.map((row) => (
                            <tr key={row.time}>
                              <td style={{ fontWeight: 700, color: 'var(--gray-500)', whiteSpace: 'nowrap', fontSize: 12 }}>{row.time}</td>
                              {[row.mon, row.tue, row.wed].map((c, ci) => (
                                <td key={ci}>
                                  {c ? (
                                    <div style={{ padding: '8px 10px', background: `${STUDENT_BG}15`, borderLeft: `3px solid ${STUDENT_BG}`, borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}>
                                      <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--gray-900)' }}>{c.sub}</div>
                                      <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>{c.room} • {c.teacher}</div>
                                    </div>
                                  ) : <span style={{ color: 'var(--gray-300)', fontSize: 18 }}>—</span>}
                                </td>
                              ))}
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

                  {/* REMALJ Carewell school news card */}
                  <div style={{ background: '#1e4028', borderRadius: 'var(--radius-lg)', padding: '18px', color: '#fff' }}>
                    <div style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#6ee89a', marginBottom: 8 }}>Institutional</div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, lineHeight: 1.3, marginBottom: 8 }}>Founder's Day Celebration 2024</h3>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,.65)', lineHeight: 1.6, marginBottom: 14 }}>
                      Join us this Friday as we celebrate the spirit of excellence at REMALJ Carewell Inspirational School. Families and staff are welcome.
                    </p>
                    <button style={{ fontSize: 12, color: '#6ee89a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Read Article →</button>
                  </div>

                  {/* Quick resources */}
                  <div className="panel">
                    <div className="panel__header"><h2 className="panel__title">Quick Resources</h2></div>
                    <div className="panel__body">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        {QUICK.map((q) => (
                          <button key={q.label} style={{ padding: '16px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)', background: 'var(--gray-50)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, transition: 'all 150ms' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = STUDENT_BG; e.currentTarget.style.background = STUDENT_LIGHT; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.background = 'var(--gray-50)'; }}>
                            <span style={{ fontSize: 22 }}>{q.icon}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-700)' }}>{q.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Achievements */}
                  <div className="panel">
                    <div className="panel__header"><h2 className="panel__title">🏅 Recent Achievements</h2></div>
                    <div className="panel__body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {ACHIEVEMENTS.map((a) => (
                        <div key={a.title} style={{ padding: '12px 10px', borderRadius: 'var(--radius-md)', background: 'var(--gray-50)', border: '1px solid var(--gray-100)', textAlign: 'center' }}>
                          <div style={{ fontSize: 26, marginBottom: 5 }}>{a.icon}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-900)', marginBottom: 2 }}>{a.title}</div>
                          <div style={{ fontSize: 10, color: 'var(--gray-400)' }}>{a.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeNav === 'Timetable' && <StudentTimetable />}
          {activeNav === 'My Grades' && <StudentResults />}
          {activeNav === 'Subjects' && <CourseRegistration />}
          {(activeNav === 'Assignments' || activeNav === 'Messages') && <StudentMessagesAssignments />}
          {activeNav === 'Settings' && <PortalSettings portal="student" />}

          {/* Other nav placeholders */}
          {!['My Dashboard', 'My Bus', 'Timetable', 'My Grades', 'Subjects', 'Assignments', 'Messages', 'Settings'].includes(activeNav) && (
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
