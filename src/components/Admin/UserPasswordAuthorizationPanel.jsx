import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Search, Eye, EyeOff, Key, CheckCircle2, User, RefreshCw, X, Send, Copy } from 'lucide-react';
import { usePortalData } from '../../data/PortalStore';
import { api } from '../../services/api';

export default function UserPasswordAuthorizationPanel() {
  const { onboardedStudents = [], teacherDirectory = [], adminSetUserPassword } = usePortalData();

  const [activePortalFilter, setActivePortalFilter] = useState('All Portals');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPassMap, setShowPassMap] = useState({});
  const [successNotice, setSuccessNotice] = useState('');
  
  // Password Editing Modal State
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [sendSmsNotice, setSendSmsNotice] = useState(true);

  // Accounts List Aggregation from all portals
  const [allAccounts, setAllAccounts] = useState([]);

  useEffect(() => {
    // Collect local registered accounts
    let localAccMap = {};
    try {
      const raw = localStorage.getItem('registered_accounts');
      if (raw) localAccMap = JSON.parse(raw);
    } catch (e) {}

    const list = [];

    // 1. System Admin & Headmaster Accounts
    list.push({
      id: 'usr-admin-01',
      fullName: 'System Administrator',
      identifier: 'admin@remaljcarewell.edu.gh',
      role: 'System Administrator',
      portal: 'Admin Portal',
      phone: '024 111 2222',
      password: localAccMap['admin@remaljcarewell.edu.gh']?.password || 'AdminPass2026!',
      lastResetAt: localAccMap['admin@remaljcarewell.edu.gh']?.lastPasswordResetAt || 'System Default'
    });

    list.push({
      id: 'usr-headmaster-01',
      fullName: 'Dr. Kwesi Mensah (Headmaster)',
      identifier: 'headmaster@remaljcarewell.edu.gh',
      role: 'Headmaster / Pre-Auditor',
      portal: 'Headmaster Portal',
      phone: '024 999 0001',
      password: localAccMap['headmaster@remaljcarewell.edu.gh']?.password || 'Headmaster2026#',
      lastResetAt: localAccMap['headmaster@remaljcarewell.edu.gh']?.lastPasswordResetAt || 'System Default'
    });

    // 2. Finance / Accountant Accounts
    list.push({
      id: 'usr-accountant-01',
      fullName: 'Mrs. Grace Accountant',
      identifier: 'g.accountant@remaljcarewell.edu.gh',
      role: 'Accountant / Finance Officer',
      portal: 'Accountant Portal',
      phone: '024 888 7777',
      password: localAccMap['g.accountant@remaljcarewell.edu.gh']?.password || 'AccPass#2026',
      lastResetAt: localAccMap['g.accountant@remaljcarewell.edu.gh']?.lastPasswordResetAt || 'System Default'
    });

    // 3. Teachers & Staff Accounts
    (teacherDirectory || []).forEach((t) => {
      const email = t.email || `${(t.name || 'staff').toLowerCase().replace(/[^\w]/g, '.')}@remaljcarewell.edu.gh`;
      const pass = localAccMap[email.toLowerCase()]?.password || t.password || t.passcode || `StaffPass#${t.staffId || '2026'}`;
      list.push({
        id: t.id || t.staffId,
        fullName: t.name,
        identifier: email,
        staffId: t.staffId,
        role: t.role || 'Teacher',
        portal: 'Teacher Portal',
        phone: t.phone || '024 900 1100',
        password: pass,
        lastResetAt: localAccMap[email.toLowerCase()]?.lastPasswordResetAt || 'Initial Onboarding'
      });
    });

    // 4. Student Accounts
    (onboardedStudents || []).forEach((s) => {
      const email = s.studentEmail || `${(s.fullName || 'student').toLowerCase().replace(/[^\w]/g, '.')}@remaljcarewell.edu.gh`;
      const sid = s.studentId || s.id;
      const pass = localAccMap[sid.toLowerCase()]?.password || localAccMap[email.toLowerCase()]?.password || s.defaultPassword || s.portalPassword || `StuPass#${sid.replace('REMALJ-', '')}`;
      list.push({
        id: s.id,
        fullName: s.fullName,
        identifier: sid,
        email,
        studentId: sid,
        role: `Student (${s.level})`,
        portal: 'Student Portal',
        phone: s.guardianPhone || '024 111 2222',
        password: pass,
        lastResetAt: localAccMap[sid.toLowerCase()]?.lastPasswordResetAt || 'Onboarding Default'
      });
    });

    // 5. Parent Accounts
    (onboardedStudents || []).forEach((s) => {
      if (s.guardianEmail) {
        const pEmail = s.guardianEmail.toLowerCase();
        if (!list.some(a => a.identifier.toLowerCase() === pEmail)) {
          const pass = localAccMap[pEmail]?.password || s.parentPassword || 'ParentPass2026!';
          list.push({
            id: `parent-${s.id}`,
            fullName: s.guardianName || `Parent of ${s.fullName}`,
            identifier: s.guardianEmail,
            role: `Parent / Guardian`,
            portal: 'Parent Portal',
            phone: s.guardianPhone || '024 111 2222',
            password: pass,
            lastResetAt: localAccMap[pEmail]?.lastPasswordResetAt || 'Direct Link Access'
          });
        }
      }
    });

    setAllAccounts(list);
  }, [onboardedStudents, teacherDirectory, successNotice]);

  const toggleShowPass = (id) => {
    setShowPassMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenResetModal = (acc) => {
    setSelectedAccount(acc);
    setNewPasswordInput(acc.password || 'Carewell2026!');
  };

  const handleAutoGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPasswordInput(pass);
  };

  const handleSavePassword = async (e) => {
    if (e) e.preventDefault();
    if (!selectedAccount || !newPasswordInput.trim()) return;

    const targetPass = newPasswordInput.trim();
    const id = selectedAccount.identifier || selectedAccount.email || selectedAccount.studentId;

    // Call store method
    if (adminSetUserPassword) {
      adminSetUserPassword({
        identifier: id,
        email: selectedAccount.email,
        studentId: selectedAccount.studentId,
        staffId: selectedAccount.staffId,
        newPassword: targetPass,
        role: selectedAccount.portal,
        fullName: selectedAccount.fullName,
        adminName: 'System Administrator'
      });
    }

    // Call API helper
    try {
      await api.adminSetUserPassword({
        identifier: id,
        newPassword: targetPass,
        role: selectedAccount.portal,
        fullName: selectedAccount.fullName
      });
    } catch (err) {}

    // Dispatch SMS notification if toggled
    if (sendSmsNotice && selectedAccount.phone) {
      try {
        const text = `[REMALJ Carewell] Your ${selectedAccount.portal} password has been updated by System Administrator:\n• Account: ${id}\n• New Password: ${targetPass}\n• Login: http://localhost:5173`;
        await api.sendSms({ recipientPhone: selectedAccount.phone, messageText: text });
      } catch (err) {}
    }

    setSuccessNotice(`🔑 System Administrator successfully authorized & set new password for "${selectedAccount.fullName}" (${selectedAccount.portal})!`);
    setSelectedAccount(null);
    setTimeout(() => setSuccessNotice(''), 6000);
  };

  // Filtering
  const PORTAL_TABS = ['All Portals', 'Student Portal', 'Parent Portal', 'Teacher Portal', 'Accountant Portal', 'Headmaster Portal', 'Admin Portal'];

  const filteredAccounts = allAccounts.filter((acc) => {
    const matchesTab = activePortalFilter === 'All Portals' || acc.portal.toLowerCase().includes(activePortalFilter.toLowerCase().replace(' portal', ''));
    const matchesSearch =
      acc.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (acc.phone && acc.phone.includes(searchQuery));
    return matchesTab && matchesSearch;
  });

  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)', color: '#0f172a' }}>
      {/* Top Banner Header */}
      <div style={{
        background: '#4a1d6e',
        color: '#ffffff',
        padding: '16px 20px',
        borderRadius: '12px 12px 0 0',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        boxShadow: '0 4px 12px rgba(74,29,110,0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#7c3ac8', padding: 10, borderRadius: 8, color: '#fff', display: 'flex' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#e9d5ff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              SUPER ADMIN SECURITY CONTROL & CREDENTIALS VAULT
            </div>
            <h2 style={{ margin: '2px 0 0 0', fontSize: 18, fontWeight: 900, color: '#ffffff', letterSpacing: '0.01em' }}>
              System Administrator User Password Authorization Station
            </h2>
            <div style={{ fontSize: 12, color: '#f3e8ff', marginTop: 2 }}>
              Full System Administrator authorization to set, override, and initialize login passwords for user accounts across ALL portals.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800, color: '#fff', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Lock size={14} /> Full Cross-Portal Authorization Active
          </span>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successNotice && (
        <div style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '12px 18px', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} /> {successNotice}
          </span>
          <button onClick={() => setSuccessNotice('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#15803d', fontWeight: 900 }}>✕</button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div style={{ background: '#ffffff', padding: 16, border: '1px solid #e2e8f0', borderTop: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          {/* Portal Filter Tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PORTAL_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActivePortalFilter(tab)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 800,
                  border: activePortalFilter === tab ? 'none' : '1px solid #cbd5e1',
                  background: activePortalFilter === tab ? '#4a1d6e' : '#f8fafc',
                  color: activePortalFilter === tab ? '#ffffff' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: 320 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: 10, color: '#94a3b8' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, email, SID, or phone..."
              style={{ width: '100%', padding: '7px 12px 7px 36px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 700 }}
            />
          </div>
        </div>

        {/* User Accounts Master Table */}
        <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ background: '#f8fafc', padding: '10px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#4a1d6e' }}>
              User Accounts Register ({filteredAccounts.length} User Accounts)
            </span>
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>
              System Administrator Authorized Override Controls
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0', textAlign: 'left', color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                <th style={{ padding: '10px 12px' }}>#</th>
                <th style={{ padding: '10px 12px' }}>Account Name / User</th>
                <th style={{ padding: '10px 12px' }}>Username / Identifier</th>
                <th style={{ padding: '10px 12px' }}>Target Portal / Role</th>
                <th style={{ padding: '10px 12px' }}>Current Authorized Password</th>
                <th style={{ padding: '10px 12px' }}>Last Authorization Record</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>System Admin Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((acc, idx) => {
                const isRevealed = !!showPassMap[acc.id];
                const getBadgeColor = (portal) => {
                  if (portal.includes('Student')) return { bg: '#e0f2fe', color: '#0369a1', border: '#bae6fd' };
                  if (portal.includes('Parent')) return { bg: '#fef3c7', color: '#b45309', border: '#fde68a' };
                  if (portal.includes('Teacher')) return { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' };
                  if (portal.includes('Accountant')) return { bg: '#e0e7ff', color: '#3730a3', border: '#c7d2fe' };
                  return { bg: '#f3e8ff', color: '#6b21a8', border: '#e9d5ff' };
                };
                const badgeStyle = getBadgeColor(acc.portal);

                return (
                  <tr key={acc.id || idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                    <td style={{ padding: '10px 12px', color: '#94a3b8', fontWeight: 700 }}>{idx + 1}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0f172a' }}>
                      {acc.fullName}
                      {acc.phone && <div style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>📞 {acc.phone}</div>}
                    </td>
                    <td style={{ padding: '10px 12px', fontWeight: 800, color: '#0369a1', fontFamily: 'monospace' }}>
                      {acc.identifier}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: 12,
                        background: badgeStyle.bg,
                        color: badgeStyle.color,
                        border: `1px solid ${badgeStyle.border}`,
                        display: 'inline-block'
                      }}>
                        {acc.portal}
                      </span>
                      <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>{acc.role}</div>
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 13, background: '#f8fafc', padding: '3px 8px', borderRadius: 4, border: '1px solid #cbd5e1', color: '#0f172a' }}>
                          {isRevealed ? acc.password : '••••••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleShowPass(acc.id)}
                          style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', padding: 2 }}
                          title={isRevealed ? 'Hide Password' : 'Reveal Password'}
                        >
                          {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 11, color: '#64748b' }}>
                      <span style={{ fontWeight: 700, color: '#334155' }}>{acc.lastResetAt || 'Initial Creation'}</span>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenResetModal(acc)}
                        style={{
                          padding: '6px 14px',
                          background: '#4a1d6e',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: '0 2px 4px rgba(74,29,110,0.2)'
                        }}
                      >
                        <Key size={13} /> Set Password
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Reset & Authorization Modal */}
      {selectedAccount && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedAccount(null); }}
          style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#ffffff', borderRadius: 16, maxWidth: 480, width: '100%', padding: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', border: '1px solid #cbd5e1', position: 'relative' }}>
            <button
              onClick={() => setSelectedAccount(null)}
              style={{ position: 'absolute', right: 16, top: 16, background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ background: '#f3e8ff', color: '#7c3ac8', padding: 10, borderRadius: 10 }}>
                <Key size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 900, color: '#0f172a' }}>
                  Set Authorized Password
                </h3>
                <span style={{ fontSize: 11, color: '#7c3ac8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  System Administrator Override Control
                </span>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16, fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>User Account:</span>
                <strong style={{ color: '#0f172a' }}>{selectedAccount.fullName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>Identifier / Username:</span>
                <strong style={{ color: '#0369a1', fontFamily: 'monospace' }}>{selectedAccount.identifier}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontWeight: 700 }}>Target Portal:</span>
                <strong style={{ color: '#7c3ac8' }}>{selectedAccount.portal}</strong>
              </div>
            </div>

            <form onSubmit={handleSavePassword}>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#0f172a' }}>New Authorized Password</label>
                  <button
                    type="button"
                    onClick={handleAutoGeneratePassword}
                    style={{ fontSize: 11, fontWeight: 800, color: '#0284c7', background: '#e0f2fe', border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}
                  >
                    ⚡ Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="Enter new authorized password..."
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '2px solid #7c3ac8', fontSize: 14, fontWeight: 800, fontFamily: 'monospace', background: '#fff' }}
                  autoFocus
                />
                <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 4 }}>
                  Password will be set immediately. User can sign into {selectedAccount.portal} with this password.
                </div>
              </div>

              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: 10, borderRadius: 8, marginBottom: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: '#166534', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={sendSmsNotice}
                    onChange={(e) => setSendSmsNotice(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#166534' }}
                  />
                  <span>Dispatch SMS credential notification to phone ({selectedAccount.phone || 'Guardian Phone'})</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setSelectedAccount(null)}
                  style={{ padding: '10px 18px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', background: '#4a1d6e', color: '#ffffff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 10px rgba(74,29,110,0.3)' }}
                >
                  🔑 Save Authorized Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
