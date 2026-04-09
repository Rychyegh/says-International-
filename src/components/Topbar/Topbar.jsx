import React from 'react';
import { GraduationCap, Users, BookOpen, LogOut, Phone } from 'lucide-react';
import './Topbar.css';

const PORTAL_TABS = [
  { id: 'teacher', label: 'Staff Portal',   icon: <GraduationCap size={14} /> },
  { id: 'parent',  label: 'Parent Portal',  icon: <Users size={14} />          },
  { id: 'student', label: 'Student Portal', icon: <BookOpen size={14} />       },
];

const NAV_LINKS = ['About Us', 'Academics', 'Admissions', 'Our Campuses', 'Community', 'News & Events'];

const PRE_LINKS = [
  { label: 'Email Login', icon: '✉' },
  { label: 'Careers',     icon: '💼' },
];

const PORTAL_USER = {
  teacher: { name: 'Mr. S. Amponsah', role: 'Staff' },
  parent:  { name: 'Mrs. A. Edwards', role: 'Parent' },
  student: { name: 'Kwame Edwards',   role: 'Student' },
};

export default function Topbar({ activePortal, onPortalChange, isAuthed, onSignOut }) {
  const user = PORTAL_USER[activePortal];
  const showSignOut = isAuthed && (activePortal === 'teacher' || activePortal === 'parent');

  return (
    <>
      {/* Pre-header */}
      <div className="pre-header">
        {PRE_LINKS.map((l) => (
          <button key={l.label} className="pre-header__link">
            <span>{l.icon}</span> {l.label}
          </button>
        ))}
        <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,.2)' }} />
        <button className="pre-header__link highlight">
          <Phone size={11} /> Contact Us
        </button>

        {/* Authed user chip in pre-header */}
        {showSignOut && (
          <>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: 'rgba(255,255,255,.8)' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11 }}>
                  {user.name.charAt(0)}
                </div>
                <span>{user.name}</span>
                <span style={{ color: 'rgba(255,255,255,.45)' }}>·</span>
                <span style={{ color: 'rgba(255,255,255,.5)' }}>{user.role}</span>
              </div>
              <button
                onClick={onSignOut}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px', borderRadius: 99,
                  background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)',
                  color: 'rgba(255,255,255,.85)', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 150ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,80,80,.35)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.12)'; }}
              >
                <LogOut size={11} /> Sign Out
              </button>
            </div>
          </>
        )}
      </div>

      {/* Main topbar */}
      <header className="topbar" role="banner">
        <div className="topbar__inner">
          {/* SAYS Logo */}
          <div className="topbar__logo" title="Says International School">
            <img
              src="/says-logo.png"
              alt="Says International School"
              style={{ height: 52, width: 'auto', objectFit: 'contain', display: 'block' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            {/* Fallback */}
            <div style={{ display: 'none', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, background: 'var(--ics-green-800)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#fff' }}>S</div>
              <div style={{ lineHeight: 1.15 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: 'var(--ics-green-800)' }}>Says International School</div>
                <div style={{ fontSize: 10, color: 'var(--ics-green-500)', fontWeight: 600, letterSpacing: '.05em' }}>Academic Excellence · Ghana</div>
              </div>
            </div>
          </div>

          {/* Portal switcher */}
          <nav className="topbar__portal-bar" role="tablist" aria-label="Portal switcher">
            {PORTAL_TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activePortal === tab.id}
                data-portal={tab.id}
                className={`topbar__portal-tab${activePortal === tab.id ? ' active' : ''}`}
                onClick={() => onPortalChange(tab.id)}
                id={`tab-${tab.id}`}
              >
                <span className="topbar__portal-tab-icon" aria-hidden="true">{tab.icon}</span>
                <span className="topbar__portal-tab-label">{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Main nav links */}
          <nav className="topbar__nav" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <button key={link} className="topbar__nav-link">{link}</button>
            ))}
            {/* Sign-out button in nav bar (prominent) */}
            {showSignOut && (
              <button
                className="topbar__contact-btn"
                onClick={onSignOut}
                style={{ background: 'transparent', border: '1.5px solid var(--ics-green-600)', color: 'var(--ics-green-700)', gap: 6 }}
              >
                <LogOut size={13} style={{ display: 'inline' }} />
                Sign Out
              </button>
            )}
          </nav>
        </div>
      </header>
    </>
  );
}
