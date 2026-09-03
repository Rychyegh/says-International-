import React, { useState } from 'react';
import {
  LayoutDashboard, User, Calendar, CreditCard,
  MessageSquare, FileText, Settings, TrendingUp, Bus, Bell
} from 'lucide-react';
import '../components/Portal/Portal.css';
import '../components/BusTracker/BusTracker.css';
import BusTracker from '../components/BusTracker/BusTracker';
import ParentCommunication from '../components/ParentCommunication/ParentCommunication';
import ContactDirectory from '../components/ContactDirectory/ContactDirectory';
import { ParentReports } from '../components/ReportWorkflow/ReportWorkflow';
import { ParentFees, ParentProgress, PortalSettings } from '../components/SchoolWorkflows/SchoolWorkflows';
import { usePortalData } from '../data/PortalStore';
import { getAuthUser } from '../services/api';

const PARENT_BG    = '#1a3668';
const PARENT_LIGHT = '#ddeeff';
const PARENT_ACCENT= '#3a72c8';

const NAV = [
  { icon: <LayoutDashboard size={15}/>, label: 'Dashboard',   badge: null },
  { icon: <User size={15}/>,            label: 'My Children', badge: '2'  },
  { icon: <TrendingUp size={15}/>,      label: 'Progress',    badge: null },
  { icon: <Calendar size={15}/>,        label: 'Calendar',    badge: null },
  { icon: <CreditCard size={15}/>,      label: 'Fees',        badge: null },
  { icon: <Bus size={15}/>,             label: 'Transport',   badge: null },
  { icon: <User size={15}/>,            label: 'Teachers',    badge: null },
  { icon: <MessageSquare size={15}/>,   label: 'Messages',    badge: '4'  },
  { icon: <User size={15}/>,            label: 'Contacts',    badge: null },
  { icon: <FileText size={15}/>,        label: 'Reports',     badge: null },
  { icon: <Settings size={15}/>,        label: 'Settings',    badge: null },
];

const STATS = [
  { label: 'Children Enrolled', value: '2',     trend: 'Both active',      up: true,  icon: '👨‍👩‍👦', bg: '#dbeafe', ic: '#1e3a8a' },
  { label: 'Attendance Rate',   value: '96%',   trend: '+1% this term',    up: true,  icon: '✅',      bg: '#dcfce7', ic: '#166534' },
  { label: 'Fees Outstanding',  value: 'GHS 0', trend: 'All paid',         up: true,  icon: '💳',      bg: '#dcfce7', ic: '#166534' },
  { label: 'Upcoming Events',   value: '3',     trend: 'Next: Sports Day', up: null,  icon: '📅',      bg: '#fef9c3', ic: '#78350f' },
];

const CHILDREN = [
  { name: 'Benjamin Edwards', grade: 'Grade 4 • Section B', gpa: '3.82', attendance: 96, photo: '👦', bio: 'Benjamin is showing exceptional growth in logical reasoning this semester. His participation in the recent Science Fair was commendable.' },
  { name: 'Adwoa Edwards',    grade: 'Primary 5',            gpa: '3.94', attendance: 95, photo: '👧', bio: 'Adwoa continues to excel in Sciences and English. She was recognized at the recent Academic Awards ceremony.' },
];

const RESULTS = [
  { subject: 'Mathematics',    kweku: [82, 'A'],  adwoa: [91, 'A+'] },
  { subject: 'English',        kweku: [75, 'A-'], adwoa: [88, 'A']  },
  { subject: 'Science',        kweku: [88, 'A'],  adwoa: [95, 'A+'] },
  { subject: 'Social Studies', kweku: [70, 'B+'], adwoa: [84, 'A']  },
  { subject: 'ICT',            kweku: [93, 'A+'], adwoa: [89, 'A']  },
];

const EVENTS = [
  { title: 'Sports & Culture Day',      date: 'Oct 24', tag: 'School Event', color: PARENT_ACCENT },
  { title: 'Parent-Teacher Conference', date: 'Nov 2',  tag: 'Meeting',      color: '#c89a3a'     },
  { title: 'End of Term Exams',         date: 'Nov 20', tag: 'Exams',        color: '#c84a4a'     },
  { title: 'Prize Giving Ceremony',     date: 'Dec 6',  tag: 'Ceremony',     color: '#16a34a'     },
];

const TEACHER_UPDATES = [
  { teacher: 'Ms. Sarah Mensah', time: '2h ago',   subject: 'Social Studies', note: 'Benjamin participated brilliantly in today\'s debate on renewable energy.' },
  { teacher: 'Mr. Kofi Appiah',  time: 'Yesterday', subject: 'Mathematics',   note: 'Math homework on equations was perfect. Great attention to detail shown.'  },
];

export default function ParentPortal() {
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [activeChild, setActiveChild] = useState(0);
  const { results: staffResults, studentFees = [] } = usePortalData();

  const child = CHILDREN[activeChild];
  const currentFee = (studentFees || []).find((f) => f.studentName?.toLowerCase() === child.name.toLowerCase()) || { balance: 0 };
  const dynamicFeeValue = `GHS ${currentFee.balance.toLocaleString()}`;
  const dynamicFeeTrend = currentFee.balance > 0 ? 'Balance due' : 'All paid';

  const DYNAMIC_STATS = [
    { label: 'Children Enrolled', value: '2', trend: 'Both active', up: true, icon: '👨‍👩‍👦', bg: '#dbeafe', ic: '#1e3a8a' },
    { label: 'Attendance Rate', value: '96%', trend: '+1% this term', up: true, icon: '✅', bg: '#dcfce7', ic: '#166534' },
    { label: 'Fees Outstanding', value: dynamicFeeValue, trend: dynamicFeeTrend, up: currentFee.balance === 0, icon: '💳', bg: currentFee.balance > 0 ? '#fee2e2' : '#dcfce7', ic: currentFee.balance > 0 ? '#b91c1c' : '#166534' },
    { label: 'Upcoming Events', value: '3', trend: 'Next: Sports Day', up: null, icon: '📅', bg: '#fef9c3', ic: '#78350f' },
  ];

  return (
    <div className="portal">
      <div className="portal__layout">
        {/* Sidebar */}
        <aside className="portal__sidebar">
          <div style={{ margin: '0 0 16px', padding: '14px', background: PARENT_LIGHT, borderRadius: 'var(--radius-md)', borderLeft: `4px solid ${PARENT_BG}` }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: PARENT_BG }}>Parent Portal</div>
            <div style={{ fontSize: 11, color: '#3a5a8a', marginTop: 2 }}>{getAuthUser()?.fullName || getAuthUser()?.name || 'Mrs. Angela Edwards'}</div>
          </div>
          <span className="sidebar-section-label">Navigation</span>
          {NAV.slice(0, 5).map((item) => (
            <button key={item.label}
              className={`sidebar-item${activeNav === item.label ? ' active' : ''}`}
              style={activeNav === item.label ? { background: PARENT_BG } : {}}
              onClick={() => setActiveNav(item.label)}>
              <span className="sidebar-item__icon">{item.icon}</span>
              {item.label}
              {item.badge && <span className="sidebar-item__badge" style={{ background: PARENT_BG, color: '#fff' }}>{item.badge}</span>}
            </button>
          ))}
          <span className="sidebar-section-label">Transport</span>
          <button className={`sidebar-item${activeNav === 'Transport' ? ' active' : ''}`}
            style={activeNav === 'Transport' ? { background: PARENT_BG } : {}}
            onClick={() => setActiveNav('Transport')}>
            <span className="sidebar-item__icon"><Bus size={15}/></span>
            Track Bus
          </button>
          <span className="sidebar-section-label">Communication</span>
          {NAV.slice(6, 10).map((item) => (
            <button key={item.label}
              className={`sidebar-item${activeNav === item.label ? ' active' : ''}`}
              style={activeNav === item.label ? { background: PARENT_BG } : {}}
              onClick={() => setActiveNav(item.label)}>
              <span className="sidebar-item__icon">{item.icon}</span>
              {item.label}
              {item.badge && <span className="sidebar-item__badge" style={{ background: PARENT_BG, color: '#fff' }}>{item.badge}</span>}
            </button>
          ))}
          <span className="sidebar-section-label">System</span>
          <button className={`sidebar-item${activeNav === 'Settings' ? ' active' : ''}`} style={activeNav === 'Settings' ? { background: PARENT_BG } : {}} onClick={() => setActiveNav('Settings')}><span className="sidebar-item__icon"><Settings size={15}/></span>Settings</button>
        </aside>

        {/* Main */}
        <main className="portal__content">

          {/* ── TRANSPORT VIEW ── */}
          {activeNav === 'Transport' && (
            <div className="animate-fade-up">
              <div className="page-header">
                <p className="page-header__eyebrow" style={{ color: PARENT_ACCENT }}>
                  <span style={{ background: PARENT_LIGHT, padding: '2px 10px', borderRadius: 99, border: '1px solid #b0ccee' }}>
                    Transport — REMALJ Carewell
                  </span>
                </p>
                <h1 className="page-header__title">Track Your Child's Bus 🚌</h1>
                <p className="page-header__subtitle">
                  See exactly where the school bus is right now, who's onboard, and when to expect arrival.
                </p>
              </div>
              {/* Child's transport summary */}
              <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
                {CHILDREN.map((c, i) => (
                  <div key={c.name} onClick={() => setActiveChild(i)} style={{
                    flex: 1, padding: '14px 18px',
                    background: PARENT_BG, color: '#fff',
                    borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                    border: `2px solid ${activeChild === i ? '#7aaee8' : 'transparent'}`,
                    opacity: activeChild === i ? 1 : 0.7,
                    transition: 'all 200ms',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'rgba(255,255,255,.55)', marginBottom: 2 }}>Child</div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{c.name} {i === 0 ? '👦' : '👧'}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>{c.grade} • Bus 01 – Route A</div>
                    <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                      <div><div style={{ color: 'rgba(255,255,255,.5)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>Next Stop</div><div style={{ fontWeight: 700 }}>Anikoko</div></div>
                      <div style={{ textAlign: 'right' }}><div style={{ color: 'rgba(255,255,255,.5)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>ETA</div><div style={{ fontWeight: 800, fontSize: 18 }}>15:45</div></div>
                    </div>
                  </div>
                ))}
              </div>
              <BusTracker mode="parent" />
            </div>
          )}

          {/* ── DASHBOARD VIEW ── */}
          {activeNav === 'Dashboard' && (
            <>
              <div className="page-header">
                <p className="page-header__eyebrow" style={{ color: PARENT_ACCENT }}>
                  <span style={{ background: PARENT_LIGHT, padding: '2px 10px', borderRadius: 99, border: '1px solid #b0ccee' }}>Parent Portal — REMALJ Carewell</span>
                </p>
                <h1 className="page-header__title">Welcome back, Mrs. Edwards 👩</h1>
                <p className="page-header__subtitle">Stay on top of your children's education, fees, and school activities.</p>
              </div>

              {/* Stats */}
              <div className="stats-grid">
                {DYNAMIC_STATS.map((s, i) => (
                  <div className="stat-card" key={s.label} style={{ animationDelay: `${i * 70}ms` }}>
                    <div className="stat-card__icon" style={{ background: s.bg, color: s.ic, fontSize: 20 }}>{s.icon}</div>
                    <div><div className="stat-card__value">{s.value}</div><div className="stat-card__label">{s.label}</div></div>
                    {s.up !== null
                      ? <div className={`stat-card__trend stat-card__trend--${s.up ? 'up' : 'down'}`}>{s.up ? '↑' : '↓'} {s.trend}</div>
                      : <div className="stat-card__trend" style={{ color: '#c89a3a' }}>📌 {s.trend}</div>}
                  </div>
                ))}
              </div>

              {/* Child selector */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                {CHILDREN.map((c, i) => (
                  <button key={c.name} onClick={() => setActiveChild(i)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
                    borderRadius: 'var(--radius-lg)',
                    border: `2px solid ${activeChild === i ? PARENT_ACCENT : 'var(--gray-200)'}`,
                    background: activeChild === i ? `${PARENT_ACCENT}12` : 'var(--white)',
                    cursor: 'pointer', transition: 'all 200ms', boxShadow: activeChild === i ? 'var(--shadow-sm)' : 'none',
                  }}>
                    <span style={{ fontSize: 26 }}>{c.photo}</span>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 800, color: 'var(--gray-900)', fontSize: 14 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{c.grade} • GPA {c.gpa}</div>
                    </div>
                    <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 800, background: activeChild === i ? `${PARENT_ACCENT}20` : 'var(--gray-100)', color: activeChild === i ? PARENT_ACCENT : 'var(--gray-400)' }}>
                      {activeChild === i ? 'VIEWING' : 'SELECT'}
                    </span>
                  </button>
                ))}
              </div>

              {/* Main grid */}
              <div className="content-grid">
                {/* Left */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Child summary banner */}
                  <div style={{ background: PARENT_BG, borderRadius: 'var(--radius-lg)', padding: '20px 22px', color: '#fff', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'rgba(255,255,255,.5)', marginBottom: 4 }}>
                        {activeChild === 0 ? 'PRESENT TODAY' : 'PRESENT TODAY'} &nbsp;•&nbsp; {child.grade}
                      </div>
                      <h2 style={{ fontSize: 22, fontFamily: 'var(--font-display)', fontWeight: 800 }}>{child.name}</h2>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginTop: 6, lineHeight: 1.6, maxWidth: 400 }}>{child.bio}</p>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, flexShrink: 0 }}>
                      <div style={{ background: 'rgba(255,255,255,.1)', borderRadius: 'var(--radius-md)', padding: '14px 20px', textAlign: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 800 }}>{child.gpa}</div>
                        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.07em', color: 'rgba(255,255,255,.5)', marginTop: 2 }}>Current GPA</div>
                      </div>
                      <div style={{ background: '#16a34a', borderRadius: 'var(--radius-md)', padding: '14px 20px', textAlign: 'center' }}>
                        <div style={{ fontSize: 24, fontWeight: 800 }}>{child.attendance}%</div>
                        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.07em', color: 'rgba(255,255,255,.8)', marginTop: 2 }}>Attendance</div>
                      </div>
                    </div>
                  </div>

                  {/* Progress is read-only here and is published by staff. */}
                  <div className="panel">
                    <div className="panel__header">
                      <h2 className="panel__title">Staff-published progress</h2>
                      <button onClick={() => setActiveNav('Progress')} style={{ fontSize: 12, color: PARENT_ACCENT, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>View full progress →</button>
                    </div>
                    <div className="panel__body">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                        {staffResults.slice(0, 2).map((r) => {
                          const { score, grade } = r;
                          return (
                            <div key={r.subject} style={{ padding: '14px', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-200)' }}>
                              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--gray-400)', marginBottom: 4 }}>{r.subject}</div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--gray-900)' }}>Published by {r.lecturer}</div>
                                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: score >= 80 ? '#166534' : '#78350f' }}>{grade}</div>
                              </div>
                              <div className="progress-bar" style={{ marginTop: 8 }}>
                                <div className="progress-bar__fill" style={{ width: `${score}%`, background: score >= 80 ? '#16a34a' : '#d97706' }}/>
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 4 }}>{score}%</div>
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: 'flex', gap: 20 }}>
                        {staffResults.slice(2).map((r) => {
                          const { score, grade } = r;
                          return (
                            <div key={r.subject} style={{ textAlign: 'center' }}>
                              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--gray-400)', marginBottom: 4 }}>{r.subject}</div>
                              <div style={{ fontSize: 18, fontWeight: 800, color: score >= 80 ? '#166534' : '#78350f' }}>{grade}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Transport widget on dashboard */}
                  <div
                    className="transport-widget"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setActiveNav('Transport')}
                    title="Track bus live"
                  >
                    <div className="transport-widget__label">Transport Status — Live</div>
                    <div className="transport-widget__route">Route 14 • Bus B-202 &nbsp;•&nbsp; {child.name}</div>
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
                    <div className="transport-stops"><span>School</span><span>On Route</span><span>Anikoko</span></div>
                    <div style={{ marginTop: 10, fontSize: 11, color: 'rgba(255,255,255,.5)', textAlign: 'center' }}>Click to open full tracker →</div>
                  </div>
                </div>

                {/* Right */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Teacher updates */}
                  <div className="panel">
                    <div className="panel__header">
                      <h2 className="panel__title">Teacher Updates</h2>
                      <Bell size={15} color="var(--gray-400)"/>
                    </div>
                    <div className="panel__body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {TEACHER_UPDATES.map((u) => (
                        <div key={u.teacher} style={{ display: 'flex', gap: 10 }}>
                          <div className="avatar" style={{ background: PARENT_BG, flexShrink: 0, width: 36, height: 36 }}>{u.teacher.charAt(0)}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--gray-900)' }}>{u.teacher}</span>
                              <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{u.time}</span>
                            </div>
                            <p style={{ fontSize: 12.5, color: 'var(--gray-600)', lineHeight: 1.55 }}>{u.note}</p>
                            <span style={{ display: 'inline-block', marginTop: 6, padding: '2px 8px', background: '#dcfce7', color: '#166534', fontSize: 10, fontWeight: 700, borderRadius: 99 }}>{u.subject}</span>
                          </div>
                        </div>
                      ))}
                      <button style={{ width: '100%', padding: '9px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', fontSize: 12, fontWeight: 700, color: PARENT_ACCENT, background: 'none', cursor: 'pointer' }}>VIEW ALL MESSAGES</button>
                    </div>
                  </div>

                  {/* Upcoming events */}
                  <div className="panel">
                    <div className="panel__header"><h2 className="panel__title">Upcoming Events</h2></div>
                    <div className="panel__body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {EVENTS.map((e) => (
                        <div key={e.title} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--gray-50)', border: '1px solid var(--gray-100)' }}>
                          <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-md)', background: `${e.color}18`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: e.color, fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                            {e.date.split(' ')[0]}<br/>{e.date.split(' ')[1]}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-900)' }}>{e.title}</div>
                            <div style={{ fontSize: 11, color: e.color, fontWeight: 600, marginTop: 2 }}>{e.tag}</div>
                          </div>
                          <button style={{ fontSize: 11, color: PARENT_ACCENT, background: 'none', border: `1px solid ${PARENT_ACCENT}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontWeight: 700 }}>+ Calendar</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {(activeNav === 'Teachers' || activeNav === 'Messages') && <ParentCommunication child={child} />}
          {activeNav === 'Progress' && <ParentProgress childName={child.name} />}
          {activeNav === 'Calendar' && <ParentProgress childName={child.name} />}
          {activeNav === 'Fees' && <ParentFees childName={child.name} />}
          {activeNav === 'Contacts' && <ContactDirectory parentMode />}
          {activeNav === 'Reports' && <ParentReports child={child} />}
          {activeNav === 'Settings' && <PortalSettings portal="parent" />}

          {/* Other nav placeholders */}
          {!['Dashboard', 'Transport', 'Teachers', 'Messages', 'Progress', 'Calendar', 'Fees', 'Contacts', 'Reports', 'Settings'].includes(activeNav) && (
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
