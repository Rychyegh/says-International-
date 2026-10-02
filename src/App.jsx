import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Topbar from './components/Topbar/Topbar';
import LoginPage from './components/Login/LoginPage';
import { PortalDataProvider, usePortalData } from './data/PortalStore';
import { api, getAuthToken, setAuthUser, getAuthUser, clearAuthSession, clearLegacySchoolCache, consumeFreshAdminLogin, normalizeSessionUser } from './services/api';
import { portalForRole } from './lib/recordRules.js';
import './App.css';
import { loadAdminPortal } from './lib/adminPortalLoader.js';

const portals = {
  admin: lazy(loadAdminPortal),
  accountant: lazy(() => import('./portals/AccountantPortal')),
  teacher: lazy(() => import('./portals/TeacherPortal')),
  parent: lazy(() => import('./portals/ParentPortal')),
  student: lazy(() => import('./portals/StudentPortal')),
};

function PortalRoutes({ session, verifySession }) {
  const location = useLocation();
  const activePortal = location.pathname.split('/')[1] || 'admin';
  const authorizedPortal = portalForRole(session?.role);
  const isAuthed = Boolean(session && authorizedPortal === activePortal);
  const { backendConnected, isRefreshingBackend, showingCachedData, syncErrors = {} } = usePortalData();
  const [warning, setWarning] = useState(false);
  const [authError, setAuthError] = useState('');
  useEffect(() => {
    if (!session) return;
    let warningTimer, logoutTimer;
    const reset = () => {
      clearTimeout(warningTimer); clearTimeout(logoutTimer); setWarning(false);
      warningTimer = setTimeout(() => setWarning(true), 270000);
      logoutTimer = setTimeout(clearAuthSession, 300000);
    };
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(event => window.addEventListener(event, reset)); reset();
    return () => { clearTimeout(warningTimer); clearTimeout(logoutTimer); events.forEach(event => window.removeEventListener(event, reset)); };
  }, [session]);
  const onLoginSuccess = async (adminRole) => {
    try {
      setAuthError('');
      await verifySession(adminRole, true);
      localStorage.setItem(`says_${activePortal}_active_nav`, activePortal === 'accountant' ? 'Financial Overview' : activePortal === 'student' ? 'My Dashboard' : 'Dashboard');
    } catch (error) { setAuthError(error.message); throw error; }
  };
  return <div className="app" id="app-root">
    <Topbar activePortal={activePortal} isAuthed={isAuthed} onSignOut={clearAuthSession} adminRole={session?.role} />
    {session && isRefreshingBackend && <p role="status" style={{ padding: 8 }}>{showingCachedData ? "Showing saved records while checking the database…" : "Refreshing database records…"}</p>}
    {authError && <p role="alert" style={{ padding: 16, color: '#b91c1c' }}>{authError} Please sign in again.</p>}
    {session && Object.keys(syncErrors).length > 0 && <p role="status" style={{ padding: 16, background: '#fff7ed' }}>{backendConnected ? 'Some database records could not be refreshed.' : 'Database connection unavailable.'} Displayed records may be out of date. Failed saves will be reported.</p>}
    {warning && <p role="alert" style={{ padding: 16, background: '#fff7ed' }}>Your session will close in 30 seconds due to inactivity. <button onClick={() => setWarning(false)}>Stay logged in</button></p>}
    <main className="portal-wrapper" key={`${session?.id || 'login'}-${activePortal}`}>
      <Suspense fallback={<p role="status">Loading portal…</p>}>
        <Routes>
          <Route path="/" element={<Navigate to={`/${authorizedPortal || 'admin'}`} replace />} />
          {Object.entries(portals).map(([key, Component]) => <Route key={key} path={`/${key}`} element={
            !session ? <LoginPage portal={key} onLoginSuccess={onLoginSuccess} /> :
            authorizedPortal !== key ? <Navigate to={`/${authorizedPortal}`} replace /> :
            <Component onSignOut={clearAuthSession} initialAdminRole={session.role} />
          } />)}
          <Route path="*" element={<Navigate to={`/${authorizedPortal || 'admin'}`} replace />} />
        </Routes>
      </Suspense>
    </main>
  </div>;
}
export default function App() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const generation = useRef(0);
  const verifySession = useCallback(async (selectedAdminRole, allowFreshLogin = false) => {
    const attempt = ++generation.current;
    const token = getAuthToken();
    if (!token) throw new Error('A database login is required.');
    try {
      const freshUser = allowFreshLogin ? consumeFreshAdminLogin() : null;
      let raw;
      if (freshUser) raw = { user: freshUser };
      else {
        try { raw = await api.getCurrentSession(); }
        catch (error) {
          // Older deployed backends have no /auth/me. Keep their authenticated
          // login session; protected API requests still enforce the token.
          if (error.status !== 404 && error.status !== 405) throw error;
          raw = { user: getAuthUser() };
        }
      }
      const user = normalizeSessionUser(raw.user || raw.data?.user || raw.data || raw);
      if (!user?.id || !portalForRole(user.role) || user.requiresSecondFactor === true || user.requires_second_factor === true) throw new Error('The server has not confirmed a complete authorized session.');
      if (attempt !== generation.current || token !== getAuthToken()) return;
      // Restore the original PIN-selected admin view while retaining server authentication.
      const previousUser = getAuthUser();
      const adminRole = selectedAdminRole || (String(previousUser?.id) === String(user.id) ? previousUser?.adminRole : null);
      const restoredUser = portalForRole(user.role) === 'admin' && ['head_admin', 'sub_admin'].includes(adminRole)
        ? { ...user, role: adminRole, adminRole }
        : user;
      setAuthUser(restoredUser); setSession(restoredUser);
    } catch (error) {
      if (attempt === generation.current && [401, 403].includes(error.status)) clearAuthSession();
      throw error;
    }
  }, []);
  useEffect(() => {
    clearLegacySchoolCache();
    const clear = () => { generation.current += 1; setSession(null); setChecking(false); };
    window.addEventListener('says_session_cleared', clear);
    if (getAuthToken()) verifySession().catch(() => {}).finally(() => setChecking(false));
    else setChecking(false);
    return () => { generation.current += 1; window.removeEventListener('says_session_cleared', clear); };
  }, [verifySession]);
  if (checking) return <p role="status">Verifying database session…</p>;
  return <HashRouter><PortalDataProvider key={session ? `${session.id}:${session.role}` : 'signed-out'} enabled={Boolean(session)}>
    <PortalRoutes session={session} verifySession={verifySession} />
  </PortalDataProvider></HashRouter>;
}
