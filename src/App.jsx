import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Topbar from './components/Topbar/Topbar';
import LoginPage from './components/Login/LoginPage';
import TeacherPortal from './portals/TeacherPortal';
import ParentPortal from './portals/ParentPortal';
import StudentPortal from './portals/StudentPortal';
import AdminPortal from './portals/AdminPortal';
import AccountantPortal from './portals/AccountantPortal';
import { PortalDataProvider } from './data/PortalStore';
import { setAuthToken, setAuthUser } from './services/api';
import './App.css';

const REQUIRES_AUTH = ['admin', 'accountant', 'parent', 'teacher', 'student'];

function DirectAccessNotice() {
  return (
    <div style={{
      maxWidth: 600, margin: '60px auto', padding: 32, background: '#fff',
      borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', textAlign: 'center'
    }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--gray-900)', marginBottom: 12 }}>
        REMALJ Carewell Portals
      </h2>
      <p style={{ color: 'var(--gray-600)', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
        To access your designated school portal, please enter the direct forward slash URL in your browser address bar:
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
        <div style={{ padding: 12, background: 'var(--gray-50)', borderRadius: 8, border: '1px solid var(--gray-200)' }}>
          <code>/admin</code> — Administrator Portal (Student Onboarding & Roster)
        </div>
        <div style={{ padding: 12, background: 'var(--gray-50)', borderRadius: 8, border: '1px solid var(--gray-200)' }}>
          <code>/accountant</code> — Accountant Portal (Payments & Fee Notices)
        </div>
        <div style={{ padding: 12, background: 'var(--gray-50)', borderRadius: 8, border: '1px solid var(--gray-200)' }}>
          <code>/parent</code> — Parent Portal (Child Progress & Fees)
        </div>
        <div style={{ padding: 12, background: 'var(--gray-50)', borderRadius: 8, border: '1px solid var(--gray-200)' }}>
          <code>/teacher</code> — Staff / Teacher Portal (Grading & Attendance)
        </div>
        <div style={{ padding: 12, background: 'var(--gray-50)', borderRadius: 8, border: '1px solid var(--gray-200)' }}>
          <code>/student</code> — Student Portal (Grades & Timetable)
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();

  // Parent portal allows direct access without sign in once child is accepted
  const [authed, setAuthed] = useState({
    admin: false,
    accountant: false,
    parent: true,
    teacher: false,
    student: false,
  });

  const getPortalFromPath = (pathname) => {
    if (pathname.includes('/admin')) return 'admin';
    if (pathname.includes('/accountant')) return 'accountant';
    if (pathname.includes('/parent')) return 'parent';
    if (pathname.includes('/student')) return 'student';
    if (pathname.includes('/teacher')) return 'teacher';
    return 'admin';
  };

  const activePortal = getPortalFromPath(location.pathname);
  const isAuthed = authed[activePortal];

  const handleSignOut = () => {
    setAuthToken(null);
    setAuthUser(null);
    setAuthed((prev) => ({ ...prev, [activePortal]: false }));
  };

  // Automatic Inactivity Logout (5 minutes timeout)
  const [inactivityWarning, setInactivityWarning] = useState(false);
  const [logoutNotice, setLogoutNotice] = useState('');

  useEffect(() => {
    if (!isAuthed) return;

    let warningTimer = null;
    let logoutTimer = null;

    const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
    const WARNING_TIMEOUT = 4.5 * 60 * 1000; // 4 minutes 30 seconds

    const resetInactivityTimer = () => {
      if (warningTimer) clearTimeout(warningTimer);
      if (logoutTimer) clearTimeout(logoutTimer);
      setInactivityWarning(false);

      warningTimer = setTimeout(() => {
        setInactivityWarning(true);
      }, WARNING_TIMEOUT);

      logoutTimer = setTimeout(() => {
        handleSignOut();
        setInactivityWarning(false);
        setLogoutNotice(`⏱️ Automatic Security Logout: You were automatically signed out from the ${activePortal.toUpperCase()} portal after 5 minutes of inactivity for institutional data security.`);
        setTimeout(() => setLogoutNotice(''), 10000);
      }, INACTIVITY_TIMEOUT);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(evt => window.addEventListener(evt, resetInactivityTimer));

    resetInactivityTimer();

    return () => {
      if (warningTimer) clearTimeout(warningTimer);
      if (logoutTimer) clearTimeout(logoutTimer);
      events.forEach(evt => window.removeEventListener(evt, resetInactivityTimer));
    };
  }, [isAuthed, activePortal]);

  const [adminRole, setAdminRole] = useState('head_admin');

  const renderPortalView = (portalKey, Component) => {
    if (!authed[portalKey]) {
      return (
        <LoginPage
          portal={portalKey}
          onLoginSuccess={(role) => {
            if (role) setAdminRole(role);
            setAuthed((prev) => ({ ...prev, [portalKey]: true }));
          }}
        />
      );
    }
    return <Component onSignOut={handleSignOut} initialAdminRole={adminRole} />;
  };

  return (
    <div className="app" id="app-root">
      <Topbar
        activePortal={activePortal}
        isAuthed={isAuthed}
        onSignOut={handleSignOut}
      />

      {logoutNotice && (
        <div style={{
          background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b',
          padding: '12px 20px', borderRadius: 8, margin: '16px 24px 0',
          fontWeight: 800, fontSize: 13, textAlign: 'center', boxShadow: '0 4px 12px rgba(153,27,27,0.15)'
        }}>
          {logoutNotice}
        </div>
      )}

      {inactivityWarning && (
        <div style={{
          position: 'fixed', top: 76, right: 24, zIndex: 999999,
          background: '#991b1b', color: '#fff', padding: '12px 20px',
          borderRadius: 10, boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
          fontWeight: 800, fontSize: 13, display: 'flex', alignItems: 'center', gap: 12
        }}>
          <span>⏱️ <strong>Inactivity Notice:</strong> Automatic logout in 30 seconds due to 5 minutes of idle time.</span>
          <button
            onClick={() => setInactivityWarning(false)}
            style={{ padding: '5px 12px', background: '#fff', color: '#991b1b', border: 'none', borderRadius: 6, fontWeight: 900, cursor: 'pointer' }}
          >
            Stay Logged In
          </button>
        </div>
      )}

      <div
        key={`${activePortal}-${isAuthed}-${location.pathname}`}
        className="portal-wrapper animate-portal"
        role="tabpanel"
        aria-labelledby={`tab-${activePortal}`}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/admin" element={renderPortalView('admin', AdminPortal)} />
          <Route path="/accountant" element={renderPortalView('accountant', AccountantPortal)} />
          <Route path="/parent" element={renderPortalView('parent', ParentPortal)} />
          <Route path="/teacher" element={renderPortalView('teacher', TeacherPortal)} />
          <Route path="/student" element={renderPortalView('student', StudentPortal)} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <PortalDataProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </PortalDataProvider>
  );
}
