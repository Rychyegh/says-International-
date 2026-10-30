import SchoolLoading from './components/School/SchoolLoading';
import { sessionRoleAllowed } from './lib/sessionVerification.js';
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Topbar from './components/Topbar/Topbar';
import SchoolHome from './components/School/SchoolHome';
import LoginPage from './components/Login/LoginPage';
import TeacherPortal from './portals/TeacherPortal';
import PreschoolPortal from './portals/PreschoolPortal';
import ParentPortal from './portals/ParentPortal';
import StudentPortal from './portals/StudentPortal';
import AdminPortal from './portals/AdminPortal';
import AccountantPortal from './portals/AccountantPortal';
import { PortalDataProvider } from './data/PortalStore';
import { api, getAuthToken, getAuthUser, setAuthToken, setAuthUser } from './services/api';
import { portalForRole } from './lib/recordRules';
import './App.css';

const REQUIRES_AUTH = ['admin', 'accountant', 'parent', 'teacher', 'student'];

const PORTAL_DEFAULT_NAV = {
  admin: 'Dashboard',
  teacher: 'Dashboard',
  parent: 'Dashboard',
  student: 'My Dashboard',
  accountant: 'Financial Overview',
};

function openPortalOnDashboard(portalKey) {
  const nav = PORTAL_DEFAULT_NAV[portalKey] || 'Dashboard';
  try {
    localStorage.setItem(`says_${portalKey}_active_nav`, nav);
  } catch (e) {}
}

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

  // Portals require authentication sign-in (persisted across page refresh)
  const [authed, setAuthed] = useState(() => {
    let stored = {};
    try { stored = JSON.parse(localStorage.getItem('says_authed_portals') || '{}') || {}; }
    catch { /* The server session can still restore admin access. */ }
    const user = getAuthUser();
    // These flags select the restore flow; /auth/me still gates admin access.
    const restoreAdmin = Boolean(getAuthToken()) && (stored.admin === true || portalForRole(user?.role || user?.portalRole) === 'admin');
    return {
      ...stored,
      admin: restoreAdmin,
      accountant: stored.accountant === true,
      parent: stored.parent === true,
      teacher: stored.teacher === true,
      student: stored.student === true,
    };
  });

  const resumeAdminUser = useRef(authed.admin || authed.accountant ? getAuthUser()?.id : null);

  // Browser preferences never establish administrator privileges.
  const [adminRole, setAdminRole] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('says_authed_portals', JSON.stringify(authed));
    } catch (e) {}
  }, [authed]);

  useEffect(() => {
    try {
      if (adminRole) localStorage.setItem('says_admin_role', adminRole);
      else localStorage.removeItem('says_admin_role');
    } catch (e) {}
  }, [adminRole]);

  const getPortalFromPath = (pathname) => {
    if (pathname.includes('/admin')) return 'admin';
    if (pathname.includes('/accountant')) return 'accountant';
    if (pathname.includes('/parent')) return 'parent';
    if (pathname.includes('/student')) return 'student';
    if (pathname.includes('/teacher')) return 'teacher';
    return 'admin';
  };

  const activePortal = getPortalFromPath(location.pathname);
  const [adminSession, setAdminSession] = useState('checking');
  const [verifiedAdminToken, setVerifiedAdminToken] = useState(null);
  const [verifiedSessionPortal, setVerifiedSessionPortal] = useState(null);
  const [sessionError, setSessionError] = useState('');
  const [sessionRetry, setSessionRetry] = useState(0);
  useEffect(() => {
    if (!['admin', 'accountant'].includes(activePortal) || !authed[activePortal]) return;
    let active = true;
    const token = getAuthToken();
    setAdminRole(null); setAdminSession('checking'); setSessionError('');
    api.getVerifiedSession().then(session => {
      if (!active || token !== getAuthToken()) return;
      const role = session.user.role || session.user.portalRole;
      if (session.requiresSecondFactor || session.user.requiresSecondFactor === true || !sessionRoleAllowed(activePortal, role)) {
        setAuthed(current => ({ ...current, [activePortal]: false })); setAdminSession('login'); return;
      }
      setAuthUser({ ...session.user, role, ...(activePortal === 'admin' ? { adminRole: role } : {}), requiresSecondFactor: false });
      setAdminRole(activePortal === 'admin' ? role : null); setVerifiedSessionPortal(activePortal); setVerifiedAdminToken(token); setAdminSession('ready');
    }).catch(error => {
      if (!active) return;
      if ([401, 403].includes(error.status)) { setAuthed(current => ({ ...current, [activePortal]: false })); setAdminSession('login'); }
      else { setSessionError(error.message); setAdminSession('error'); }
    });
    return () => { active = false; };
  }, [activePortal, authed.admin, authed.accountant, sessionRetry]);
  useEffect(() => {
    const reauthenticate = () => { resumeAdminUser.current = getAuthUser()?.id; setAdminSession('login'); setAuthed(current => ({ ...current, [activePortal]: false })); };
    const verified = () => { setAdminSession('checking'); setSessionRetry(value => value + 1); };
    window.addEventListener('says_reauthenticate', reauthenticate);
    window.addEventListener('says_session_verified', verified);
    return () => { window.removeEventListener('says_reauthenticate', reauthenticate); window.removeEventListener('says_session_verified', verified); };
  }, [activePortal]);
  const isAuthed = authed[activePortal] && (!['admin', 'accountant'].includes(activePortal) || (adminSession === 'ready' && verifiedSessionPortal === activePortal && verifiedAdminToken === getAuthToken()));

  const handleSignOut = () => {
    resumeAdminUser.current = null;
    setAdminRole(null); setVerifiedAdminToken(null); setAdminSession('checking');
    setAuthToken(null);
    setAuthUser(null);
    setAuthed((prev) => {
      const next = { ...prev, [activePortal]: false };
      try {
        localStorage.setItem('says_authed_portals', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
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

  const renderPortalView = (portalKey, Component) => {
    if (['admin', 'accountant'].includes(portalKey) && authed[portalKey] && (adminSession !== 'ready' || verifiedSessionPortal !== portalKey || verifiedAdminToken !== getAuthToken())) return <SchoolLoading error={sessionError} onRetry={() => setSessionRetry(value => value + 1)}/>;
    if (!authed[portalKey]) {
      return (
        <LoginPage
          portal={portalKey}
          onLoginSuccess={(role) => {
            const resumePage = ['admin', 'accountant'].includes(portalKey) && resumeAdminUser.current && resumeAdminUser.current === getAuthUser()?.id;
            if (!resumePage) openPortalOnDashboard(portalKey);
            resumeAdminUser.current = null;
            if (role && portalKey === 'admin') {
              setAdminRole(role);
              localStorage.setItem('says_admin_role', role);
              window.dispatchEvent(new Event('says_admin_role_changed'));
            }
            setAuthed((prev) => {
              const next = { ...prev, [portalKey]: true };
              localStorage.setItem('says_authed_portals', JSON.stringify(next));
              return next;
            });
          }}
        />
      );
    }
    if (portalKey === 'teacher' && ['preschool_teacher','preschool_head'].includes(getAuthUser()?.role)) return <PreschoolPortal />;
    return <Component onSignOut={handleSignOut} initialAdminRole={adminRole} />;
  };

  return (
    <PortalDataProvider key={`${activePortal}-${Boolean(isAuthed)}`} enabled={Boolean(isAuthed)}>
    <div className="app" id="app-root">
      {location.pathname !== '/' && <Topbar
        activePortal={activePortal}
        isAuthed={isAuthed}
        onSignOut={handleSignOut}
        adminRole={isAuthed ? adminRole : null}
      />}

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
          <Route path="/" element={<SchoolHome />} />
          <Route path="/admin" element={renderPortalView('admin', AdminPortal)} />
          <Route path="/accountant" element={renderPortalView('accountant', AccountantPortal)} />
          <Route path="/parent" element={renderPortalView('parent', ParentPortal)} />
          <Route path="/teacher" element={renderPortalView('teacher', TeacherPortal)} />
          <Route path="/student" element={renderPortalView('student', StudentPortal)} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </div>
    </PortalDataProvider>
  );
}

export default function App() {
  return (
      <HashRouter>
        <AppRoutes />
      </HashRouter>
  );
}
