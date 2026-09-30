import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Users, BookOpen, LogOut, ShieldCheck, CreditCard, Bell, BellRing, X, CheckCheck, FileText, FileCheck } from 'lucide-react';
import { getAuthUser } from '../../services/api';
import { usePortalData } from '../../data/PortalStore';
import DashboardSearch from '../DashboardSearch/DashboardSearch';
import './Topbar.css';

const PORTAL_INFO = {
  teacher: { label: 'Staff Portal', icon: <GraduationCap size={15} />, color: '#1b4d3e' },
  parent: { label: 'Parent Portal', icon: <Users size={15} />, color: '#1a3668' },
  student: { label: 'Student Portal', icon: <BookOpen size={15} />, color: '#5e2d0e' },
  admin: { label: 'Admin Portal', icon: <ShieldCheck size={15} />, color: '#4a1d6e' },
  accountant: { label: 'Account Portal', icon: <CreditCard size={15} />, color: '#0f3a4b' },
};

const PORTAL_USER = {
  teacher: { name: 'Mr. S. Amponsah', role: 'Staff' },
  parent: { name: 'Mrs. A. Edwards', role: 'Parent' },
  student: { name: 'Kwame Edwards', role: 'Student' },
  admin: { name: 'Mr. John Admin', role: 'Administrator' },
  accountant: { name: 'Mrs. Grace Accountant', role: 'Finance Head' },
};

export default function Topbar({ activePortal, isAuthed, onSignOut }) {
  const currentInfo = PORTAL_INFO[activePortal] || PORTAL_INFO.admin;
  const defaultUser = PORTAL_USER[activePortal] || PORTAL_USER.admin;

  const authUser = getAuthUser();
  const userName = authUser?.fullName || authUser?.name || authUser?.email || defaultUser.name;
  const userRole = authUser?.role
    ? (authUser.role.charAt(0).toUpperCase() + authUser.role.slice(1))
    : defaultUser.role;
  const userInitial = (userName.charAt(0) || 'U').toUpperCase();

  // PV Notification Bell — admin portal head_admin only
  const portalData = usePortalData();
  const pvNotifications = portalData?.pvNotifications || [];
  const markAllPVNotificationsRead = portalData?.markAllPVNotificationsRead;
  const clearPVNotifications = portalData?.clearPVNotifications;
  const markPVNotificationRead = portalData?.markPVNotificationRead;

  // Reactive adminRole — listens to localStorage changes across tabs/logins
  const [adminRole, setAdminRoleState] = useState(
    () => localStorage.getItem('says_admin_role') || 'head_admin'
  );
  useEffect(() => {
    const onStorage = () => {
      setAdminRoleState(localStorage.getItem('says_admin_role') || 'head_admin');
    };
    window.addEventListener('storage', onStorage);
    // Also re-read immediately every time isAuthed changes (login)
    onStorage();
    return () => window.removeEventListener('storage', onStorage);
  }, [isAuthed]);

  // Show bell only for head_admin on admin portal when authenticated
  const showBell = activePortal === 'admin' && isAuthed && adminRole === 'head_admin';
  const unreadCount = pvNotifications.filter(n => !n.read).length;
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifPanelRef = useRef(null);

  useEffect(() => {
    if (!showNotifPanel) return;
    const handleOutside = (e) => {
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target)) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showNotifPanel]);

  const handleNotifClick = (notifId) => {
    markPVNotificationRead && markPVNotificationRead(notifId);
    setShowNotifPanel(false);
    window.dispatchEvent(new CustomEvent('says_navigate', {
      detail: { portal: 'admin', nav: 'Pre-Audit & Approve PV' }
    }));
  };

  const handleOpenDesk = () => {
    markAllPVNotificationsRead && markAllPVNotificationsRead();
    setShowNotifPanel(false);
    window.dispatchEvent(new CustomEvent('says_navigate', {
      detail: { portal: 'admin', nav: 'Pre-Audit & Approve PV' }
    }));
  };

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className={`topbar ${scrolled ? 'topbar--scrolled' : ''}`} role="banner">
      <div className="topbar__inner">
        {/* School logo & School Name */}
        <Link to={`/${activePortal}`} className="topbar__logo" title="REMALJ Carewell Inspirational School · Bogoso" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src="/remalj-carewell-logo.jpg"
            alt="REMALJ Carewell Inspirational School logo"
            style={{ height: 46, width: 'auto', objectFit: 'contain', display: 'block' }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = 'none';
            }}
          />
          <div className="topbar__school-name">
            <strong style={{ fontSize: 17, fontFamily: 'var(--font-display)', color: 'var(--gray-900)', letterSpacing: '0.02em', lineHeight: 1.1 }}>REMALJ</strong>
            <span style={{ fontSize: 11, color: 'var(--gray-500)', display: 'block', marginTop: 1, fontWeight: 700 }}>Carewell Inspirational School · Bogoso</span>
          </div>
        </Link>

        {/* Middle section - Universal Search Bar & Portal Badge */}
        <div className="topbar__middle">
          {isAuthed && <DashboardSearch activePortal={activePortal} />}

          {/* Current Portal Badge */}
          <div className="topbar__portal-badge" style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px',
            borderRadius: 99, background: currentInfo.color, color: '#fff',
            fontWeight: 800, fontSize: 12, flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
          }}>
            <span>{currentInfo.icon}</span>
            <span>{currentInfo.label}</span>
          </div>
        </div>

        {/* User profile & Sign out */}
        {isAuthed ? (
          <div className="topbar__user" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--gray-700)' }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', background: currentInfo.color,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 12
              }}>
                {userInitial}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{userName}</div>
                <div style={{ fontSize: 10, color: 'var(--gray-500)' }}>{userRole}</div>
              </div>
            </div>

            {/* ── PV Notification Bell (Head Admin · Admin Portal only) ── */}
            {showBell && (
              <div ref={notifPanelRef} style={{ position: 'relative' }}>
                <button
                  id="pv-notif-bell"
                  onClick={() => setShowNotifPanel(v => !v)}
                  title={unreadCount > 0 ? `${unreadCount} unread PV submission${unreadCount > 1 ? 's' : ''}` : 'PV Notifications'}
                  style={{
                    position: 'relative',
                    background: unreadCount > 0 ? '#7c3ac8' : '#f3e8ff',
                    border: `1.5px solid ${unreadCount > 0 ? '#7c3ac8' : '#e9d5ff'}`,
                    borderRadius: 10, width: 36, height: 36,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all 0.2s',
                    animation: unreadCount > 0 ? 'pvBellPulse 1.8s ease-in-out infinite' : 'none',
                  }}
                >
                  {unreadCount > 0 ? <BellRing size={16} color="#fff" /> : <Bell size={16} color="#7c3ac8" />}
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute', top: -6, right: -6,
                      background: '#dc2626', color: '#fff', fontSize: 9, fontWeight: 900,
                      borderRadius: '50%', minWidth: 18, height: 18,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '0 3px', border: '2px solid #fff', lineHeight: 1,
                      boxShadow: '0 1px 4px rgba(220,38,38,0.4)'
                    }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifPanel && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                    width: 340, maxHeight: 440, overflowY: 'auto',
                    background: '#fff', borderRadius: 16,
                    boxShadow: '0 16px 48px rgba(74,29,110,0.18), 0 2px 8px rgba(0,0,0,0.08)',
                    border: '1px solid #e9d5ff', zIndex: 99999,
                    animation: 'pvNotifSlideIn 0.22s cubic-bezier(.4,0,.2,1)'
                  }}>
                    {/* Panel header */}
                    <div style={{
                      padding: '13px 16px 11px',
                      background: 'linear-gradient(135deg,#4a1d6e,#7c3ac8)',
                      borderRadius: '16px 16px 0 0',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      position: 'sticky', top: 0, zIndex: 1
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BellRing size={14} color="#fff" />
                        <span style={{ color: '#fff', fontWeight: 800, fontSize: 13 }}>PV Submission Alerts</span>
                        {unreadCount > 0 && (
                          <span style={{ background: '#dc2626', color: '#fff', fontSize: 9, fontWeight: 900, borderRadius: 99, padding: '2px 7px' }}>
                            {unreadCount} NEW
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {pvNotifications.some(n => !n.read) && (
                          <button onClick={() => markAllPVNotificationsRead && markAllPVNotificationsRead()}
                            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                            <CheckCheck size={11} /> All Read
                          </button>
                        )}
                        {pvNotifications.length > 0 && (
                          <button onClick={() => clearPVNotifications && clearPVNotifications()}
                            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, padding: '3px 8px', cursor: 'pointer', color: '#fca5a5', fontSize: 10, fontWeight: 700 }}>
                            Clear
                          </button>
                        )}
                        <button onClick={() => setShowNotifPanel(false)}
                          style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, padding: '3px 7px', cursor: 'pointer', color: '#fff' }}>
                          <X size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Items */}
                    {pvNotifications.length === 0 ? (
                      <div style={{ padding: '32px 18px', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
                        <Bell size={32} color="#c4b5fd" style={{ marginBottom: 10 }} />
                        <div style={{ fontWeight: 700, color: '#6b21a8', marginBottom: 4, fontSize: 13 }}>No notifications yet</div>
                        <div>PV alerts appear here when Sub-Admin submits for approval.</div>
                      </div>
                    ) : (
                      <div>
                        {pvNotifications.map((notif, idx) => (
                          <div key={notif.id} onClick={() => handleNotifClick(notif.id)}
                            style={{
                              padding: '11px 16px',
                              borderBottom: idx < pvNotifications.length - 1 ? '1px solid #f3e8ff' : 'none',
                              background: notif.read ? '#fff' : '#faf5ff',
                              cursor: 'pointer', transition: 'background 0.15s',
                              display: 'flex', gap: 11, alignItems: 'flex-start'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f3e8ff'}
                            onMouseLeave={e => e.currentTarget.style.background = notif.read ? '#fff' : '#faf5ff'}
                          >
                            <div style={{
                              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                              background: notif.read ? '#e9d5ff' : 'linear-gradient(135deg,#7c3ac8,#4a1d6e)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              <FileText size={15} color={notif.read ? '#7c3ac8' : '#fff'} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                                <span style={{ fontWeight: 800, fontSize: 12, color: '#4a1d6e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  PV #{notif.pvNo}
                                </span>
                                {!notif.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', flexShrink: 0 }} />}
                              </div>
                              <div style={{ fontSize: 11, color: '#374151', marginTop: 2, fontWeight: 600 }}>
                                {notif.provider} — {notif.description}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                <span style={{ fontSize: 10, color: '#7c3ac8', fontWeight: 700 }}>
                                  GHS {(Number(notif.grandTotal) || 0).toLocaleString('en-GH', { minimumFractionDigits: 2 })}
                                </span>
                                <span style={{ fontSize: 10, color: '#94a3b8' }}>{notif.submittedAt}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {pvNotifications.length > 0 && (
                      <div style={{ padding: '11px 16px', borderTop: '1px solid #f3e8ff', background: '#faf5ff', borderRadius: '0 0 16px 16px', position: 'sticky', bottom: 0 }}>
                        <button onClick={handleOpenDesk}
                          style={{
                            width: '100%', padding: '9px', fontWeight: 800, fontSize: 11,
                            background: 'linear-gradient(135deg,#4a1d6e,#7c3ac8)',
                            color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7
                          }}>
                          <FileCheck size={13} /> Open Pre-Audit &amp; Approve PV Desk
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={onSignOut}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 8,
                background: '#fee2e2', border: '1px solid #fca5a5',
                color: '#dc2626', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', transition: 'all 150ms',
              }}
            >
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--gray-400)', fontWeight: 600 }}>
            Secure Authentication Required
          </div>
        )}
      </div>
    </header>
  );
}
