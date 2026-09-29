import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck, UserPlus, Users, Key, Lock, Unlock, RefreshCw, Search,
  Filter, CheckCircle2, AlertTriangle, Trash2, Edit3, Eye, EyeOff,
  Copy, Printer, Shield, UserX, UserCheck, Mail, Phone, Clock,
  FileText, Download, X, Plus, Sparkles, Building, Check, Layers
} from 'lucide-react';
import { usePortalData } from '../../data/PortalStore';
import { api, getAuthUser } from '../../services/api';
import { cloudSync } from '../../services/cloudSync';

const ROLES = [
  { value: 'admin', label: 'Head Administrator', badgeColor: '#4a1d6e', bg: '#f3e8ff', desc: 'Full institutional control and administrative governance' },
  { value: 'sub_admin', label: 'Sub-Administrator', badgeColor: '#0369a1', bg: '#e0f2fe', desc: 'Operational student roster and academic task handling' },
  { value: 'accountant', label: 'Finance & Accounts', badgeColor: '#166534', bg: '#dcfce7', desc: 'Billing, fee collection, payment vouchers, and ledger' },
  { value: 'teacher', label: 'Teaching Staff', badgeColor: '#b45309', bg: '#fef3c7', desc: 'Class roster, lesson planning, grades, and attendance' },
  { value: 'student', label: 'Student Learner', badgeColor: '#4338ca', bg: '#e0e7ff', desc: 'Assignments, timetable, report cards, and digital ID' },
  { value: 'parent', label: 'Parent / Guardian', badgeColor: '#be185d', bg: '#fce7f3', desc: 'Child progress, tuition fees, bus tracking, and messaging' },
  { value: 'security_driver', label: 'Transport / Security', badgeColor: '#374151', bg: '#f3f4f6', desc: 'Bus routing, RFID gate scans, and safety logging' },
];

const DEFAULT_USERS_SEED = [
  {
    id: 'usr_admin_01',
    fullName: 'Mr. Richmond Yaw Acquah',
    email: 'headmaster@remaljcarewell.edu.gh',
    phone: '024 499 8811',
    role: 'admin',
    status: 'Active',
    staffId: 'ADMIN-2026-001',
    password: 'AdminMaster2026!',
    department: 'School Directorate',
    createdAt: '2026-01-10',
    lastLogin: '2026-09-29 16:45',
    mustChangePassword: false,
  },
  {
    id: 'usr_subadmin_01',
    fullName: 'Dr. Frank Osei-Tutu',
    email: 'viceheadmaster@remaljcarewell.edu.gh',
    phone: '024 333 4455',
    role: 'sub_admin',
    status: 'Active',
    staffId: 'ADMIN-2026-002',
    password: 'SubAdmin2026!',
    department: 'Academic Supervision',
    createdAt: '2026-01-15',
    lastLogin: '2026-09-28 09:12',
    mustChangePassword: false,
  },
  {
    id: 'usr_acc_01',
    fullName: 'Mrs. Patience Mensah',
    email: 'accountant@remaljcarewell.edu.gh',
    phone: '054 112 3344',
    role: 'accountant',
    status: 'Active',
    staffId: 'ACC-2026-001',
    password: 'Accountant2026!',
    department: 'Finance Office',
    createdAt: '2026-01-12',
    lastLogin: '2026-09-29 14:20',
    mustChangePassword: false,
  },
  {
    id: 'usr_tea_01',
    fullName: 'Mr. Samuel Amponsah',
    email: 'samuel.amponsah@remaljcarewell.edu.gh',
    phone: '024 900 1100',
    role: 'teacher',
    status: 'Active',
    staffId: 'CT-2026-001',
    password: 'Teacher2026!',
    department: 'Mathematics & Science',
    assignedClass: 'Grade 4 Section B',
    createdAt: '2026-02-01',
    lastLogin: '2026-09-29 11:05',
    mustChangePassword: false,
  },
];

export default function UserAccessControl({ adminRole = 'head_admin' }) {
  const { onboardedStudents, teacherDirectory } = usePortalData();

  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'matrix' | 'audit'
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [users, setUsers] = useState(() => {
    try {
      const raw = localStorage.getItem('registered_accounts');
      const list = raw ? JSON.parse(raw) : {};
      
      const combinedMap = new Map();

      // 1. Seed defaults
      DEFAULT_USERS_SEED.forEach(u => combinedMap.set(u.email.toLowerCase(), u));

      // 2. Local storage accounts
      Object.keys(list).forEach(key => {
        const item = list[key];
        if (item && item.email) {
          const emailKey = item.email.toLowerCase();
          const prev = combinedMap.get(emailKey) || {};
          combinedMap.set(emailKey, {
            id: item.id || prev.id || `usr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            fullName: item.fullName || item.name || prev.fullName || 'User',
            email: item.email,
            phone: item.phone || item.phoneNumber || prev.phone || '024 000 0000',
            role: item.role || prev.role || 'student',
            status: item.status || prev.status || 'Active',
            staffId: item.staffId || prev.staffId || (item.role === 'teacher' ? 'STAFF-2026' : undefined),
            studentId: item.studentId || prev.studentId,
            password: item.password || prev.password || 'Carewell2026!',
            department: item.department || prev.department || 'General',
            assignedClass: item.assignedClass || prev.assignedClass,
            createdAt: item.createdAt || prev.createdAt || '2026-01-01',
            lastLogin: item.lastLogin || prev.lastLogin || 'Recent',
            mustChangePassword: !!item.mustChangePassword,
          });
        }
      });

      return Array.from(combinedMap.values());
    } catch {
      return DEFAULT_USERS_SEED;
    }
  });

  const [auditLogs, setAuditLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('uac_audit_logs');
      return saved ? JSON.parse(saved) : [
        { id: 'log-1', action: 'System Init', targetUser: 'System Administrator', performedBy: 'Root', timestamp: '2026-09-01 08:00', details: 'Initialized Institutional Role-Based Access Control matrix.' },
        { id: 'log-2', action: 'Account Created', targetUser: 'headmaster@remaljcarewell.edu.gh', performedBy: 'System', timestamp: '2026-09-01 08:05', details: 'Created Head Administrator account.' },
      ];
    } catch {
      return [];
    }
  });

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [resetPassUser, setResetPassUser] = useState(null);
  const [slipUser, setSlipUser] = useState(null);
  const [showPasswordMap, setShowPasswordMap] = useState({});
  const [successToast, setSuccessToast] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // New User Form State
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'teacher',
    staffId: '',
    studentId: '',
    department: 'General Staff',
    assignedClass: 'Primary 1',
    password: '',
    status: 'Active',
    mustChangePassword: false,
  });

  // Reset Password Form State
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [requireResetNextLogin, setRequireResetNextLogin] = useState(false);

  const triggerToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4500);
  };

  const addAuditLog = (action, targetUser, details) => {
    const newLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      action,
      targetUser,
      performedBy: getAuthUser()?.fullName || getAuthUser()?.name || 'Administrator',
      timestamp: new Date().toLocaleString(),
      details,
    };
    const updated = [newLog, ...auditLogs].slice(0, 100);
    setAuditLogs(updated);
    try {
      localStorage.setItem('uac_audit_logs', JSON.stringify(updated));
    } catch (e) {}
  };

  const persistUsers = (updatedUsers) => {
    setUsers(updatedUsers);
    try {
      const raw = localStorage.getItem('registered_accounts');
      const list = raw ? JSON.parse(raw) : {};
      
      updatedUsers.forEach(u => {
        list[u.email.toLowerCase()] = u;
        if (u.studentId) list[u.studentId.toLowerCase()] = u;
        if (u.staffId) list[u.staffId.toLowerCase()] = u;
      });

      localStorage.setItem('registered_accounts', JSON.stringify(list));
      cloudSync.pushLatestData({ registered_accounts: list, usersCount: updatedUsers.length });
    } catch (e) {}
  };

  const generateSecurePassword = (role = 'general') => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let res = 'Rcis!';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!createForm.fullName.trim() || !createForm.email.trim()) {
      alert('Please fill out all required fields.');
      return;
    }

    const emailKey = createForm.email.toLowerCase().trim();
    if (users.some(u => u.email.toLowerCase().trim() === emailKey)) {
      alert('An account with this email address already exists.');
      return;
    }

    const finalPass = createForm.password.trim() || generateSecurePassword(createForm.role);
    const generatedId = `usr_${createForm.role}_${Date.now()}`;
    const autoStaffId = createForm.staffId.trim() || (
      createForm.role === 'teacher' ? `CT-2026-${String(users.length + 1).padStart(3, '0')}` :
      createForm.role === 'accountant' ? `ACC-2026-${String(users.length + 1).padStart(3, '0')}` :
      createForm.role === 'admin' ? `ADM-2026-${String(users.length + 1).padStart(3, '0')}` : undefined
    );

    const newUser = {
      id: generatedId,
      fullName: createForm.fullName.trim(),
      email: emailKey,
      phone: createForm.phone.trim() || '024 000 0000',
      role: createForm.role,
      status: createForm.status || 'Active',
      staffId: autoStaffId,
      studentId: createForm.studentId.trim() || undefined,
      department: createForm.department.trim() || 'General',
      assignedClass: createForm.assignedClass.trim() || undefined,
      password: finalPass,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: 'Never',
      mustChangePassword: createForm.mustChangePassword,
    };

    const updated = [newUser, ...users];
    persistUsers(updated);
    addAuditLog('Account Created', newUser.email, `Created account for ${newUser.fullName} with role [${newUser.role.toUpperCase()}].`);

    setIsCreateModalOpen(false);
    setSlipUser(newUser);
    triggerToast(`✅ User account for ${newUser.fullName} successfully created!`);

    // Reset form
    setCreateForm({
      fullName: '',
      email: '',
      phone: '',
      role: 'teacher',
      staffId: '',
      studentId: '',
      department: 'General Staff',
      assignedClass: 'Primary 1',
      password: '',
      status: 'Active',
      mustChangePassword: false,
    });
  };

  const handleUpdateUser = (e) => {
    e.preventDefault();
    if (!editingUser) return;

    const updated = users.map(u => {
      if (u.id === editingUser.id || u.email === editingUser.email) {
        return {
          ...u,
          ...editingUser,
        };
      }
      return u;
    });

    persistUsers(updated);
    addAuditLog('Account Modified', editingUser.email, `Updated profile / role details for ${editingUser.fullName}.`);
    setEditingUser(null);
    triggerToast(`✅ User record for ${editingUser.fullName} updated.`);
  };

  const handleDirectPasswordReset = async (e) => {
    e.preventDefault();
    if (!resetPassUser || !newPasswordInput.trim()) {
      alert('Please enter or generate a new password.');
      return;
    }

    try {
      await api.adminSetUserPassword({
        identifier: resetPassUser.email,
        email: resetPassUser.email,
        newPassword: newPasswordInput.trim(),
        role: resetPassUser.role,
        fullName: resetPassUser.fullName,
        adminName: getAuthUser()?.fullName || 'Head Administrator',
      });
    } catch (err) {
      console.warn('Backend admin password set fallback:', err);
    }

    const updated = users.map(u => {
      if (u.id === resetPassUser.id || u.email === resetPassUser.email) {
        return {
          ...u,
          password: newPasswordInput.trim(),
          mustChangePassword: requireResetNextLogin,
          lastPasswordResetAt: new Date().toLocaleString(),
          lastPasswordResetBy: getAuthUser()?.fullName || 'Head Administrator',
        };
      }
      return u;
    });

    persistUsers(updated);
    addAuditLog('Password Reset', resetPassUser.email, `Password changed by administrator.`);
    
    const targetWithNewPass = { ...resetPassUser, password: newPasswordInput.trim() };
    setResetPassUser(null);
    setNewPasswordInput('');
    setSlipUser(targetWithNewPass);
    triggerToast(`🔐 Password reset successfully for ${resetPassUser.fullName}!`);
  };

  const handleToggleAccountStatus = (user) => {
    const newStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    const updated = users.map(u => {
      if (u.id === user.id || u.email === user.email) {
        return { ...u, status: newStatus };
      }
      return u;
    });

    persistUsers(updated);
    addAuditLog(newStatus === 'Suspended' ? 'Account Suspended' : 'Account Re-activated', user.email, `Status changed to ${newStatus}.`);
    triggerToast(`Account for ${user.fullName} is now ${newStatus}.`);
  };

  const handleDeleteUser = (user) => {
    if (user.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1) {
      alert('⚠️ Cannot delete the primary Head Administrator account.');
      return;
    }

    if (!window.confirm(`⚠️ Permanently revoke access and remove account for ${user.fullName} (${user.email})?`)) {
      return;
    }

    const updated = users.filter(u => u.id !== user.id && u.email !== user.email);
    persistUsers(updated);
    addAuditLog('Account Deleted', user.email, `Account permanently revoked.`);
    triggerToast(`🗑️ User account ${user.email} was removed.`);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch =
        (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.staffId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.studentId || '').toLowerCase().includes(searchQuery.toLowerCase());

      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.status === 'Active').length;
    const staff = users.filter(u => u.role === 'admin' || u.role === 'sub_admin' || u.role === 'accountant' || u.role === 'teacher').length;
    const learners = users.filter(u => u.role === 'student' || u.role === 'parent').length;
    return { total, active, staff, learners };
  }, [users]);

  return (
    <div className="uac-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Notification */}
      {successToast && (
        <div style={{
          padding: '12px 18px', background: '#dcfce7', border: '1px solid #86efac',
          color: '#166534', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 4px 12px rgba(22, 101, 52, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#166534' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #2e1065 0%, #4a1d6e 50%, #7c3ac8 100%)',
        padding: '24px 28px', borderRadius: 'var(--radius-lg)', color: '#fff',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
        boxShadow: '0 10px 25px -5px rgba(74, 29, 110, 0.25)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <span style={{ padding: '6px', background: 'rgba(255,255,255,0.15)', borderRadius: 8 }}>
              <ShieldCheck size={24} color="#fff" />
            </span>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>
              User Access Control & RBAC Vault
            </h2>
            <span style={{ fontSize: 11, fontWeight: 900, background: '#10b981', color: '#fff', padding: '3px 10px', borderRadius: 99 }}>
              SECURE
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, opacity: 0.9, maxWidth: 640 }}>
            Centralized Identity Management: Provision new administrator, accountant, teacher, student, and parent accounts. Manage role-based access permissions, set/reset passwords, and monitor system security audits.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => {
              setCreateForm({
                fullName: '',
                email: '',
                phone: '',
                role: 'teacher',
                staffId: `CT-2026-${String(users.length + 1).padStart(3, '0')}`,
                studentId: '',
                department: 'General Academic Staff',
                assignedClass: 'Primary 1',
                password: generateSecurePassword('teacher'),
                status: 'Active',
                mustChangePassword: true,
              });
              setIsCreateModalOpen(true);
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
              background: '#fff', color: '#4a1d6e', border: 'none', borderRadius: 'var(--radius-md)',
              fontWeight: 800, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            <UserPlus size={16} />
            <span>Create New User</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <div style={{ background: '#fff', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ padding: 12, borderRadius: 10, background: '#f3e8ff', color: '#4a1d6e' }}>
            <Shield size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Registered Users</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-color)' }}>{stats.total}</div>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ padding: 12, borderRadius: 10, background: '#e0f2fe', color: '#0369a1' }}>
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active System Users</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a' }}>{stats.active}</div>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ padding: 12, borderRadius: 10, background: '#fef3c7', color: '#b45309' }}>
            <Building size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Staff & Administrators</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-color)' }}>{stats.staff}</div>
          </div>
        </div>

        <div style={{ background: '#fff', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ padding: 12, borderRadius: 10, background: '#e0e7ff', color: '#4338ca' }}>
            <Key size={22} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Students & Parents</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-color)' }}>{stats.learners}</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: 8 }}>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px',
            border: 'none', background: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 13,
            color: activeTab === 'users' ? '#4a1d6e' : 'var(--text-muted)',
            borderBottom: activeTab === 'users' ? '3px solid #4a1d6e' : '3px solid transparent'
          }}
        >
          <Users size={16} />
          <span>User Directory & Credentials ({filteredUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px',
            border: 'none', background: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 13,
            color: activeTab === 'matrix' ? '#4a1d6e' : 'var(--text-muted)',
            borderBottom: activeTab === 'matrix' ? '3px solid #4a1d6e' : '3px solid transparent'
          }}
        >
          <Layers size={16} />
          <span>Role Permissions Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px',
            border: 'none', background: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 13,
            color: activeTab === 'audit' ? '#4a1d6e' : 'var(--text-muted)',
            borderBottom: activeTab === 'audit' ? '3px solid #4a1d6e' : '3px solid transparent'
          }}
        >
          <Clock size={16} />
          <span>Security Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {/* TAB 1: USERS DIRECTORY */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Filter Bar */}
          <div style={{
            background: '#fff', padding: '16px 20px', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', gap: 10, flex: 1, minWidth: 260, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search by full name, login email, phone, or staff/student ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px 9px 36px', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)', fontSize: 13, outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: 13, background: '#fff', fontWeight: 600 }}
              >
                <option value="all">All Roles</option>
                {ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: 13, background: '#fff', fontWeight: 600 }}
              >
                <option value="all">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Suspended">Suspended Only</option>
              </select>

              <button
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                  background: 'var(--bg-muted, #f8fafc)', border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                }}
              >
                <RefreshCw size={13} />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div style={{
            background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
            overflow: 'hidden', boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '14px 18px', fontWeight: 800 }}>User Identity</th>
                    <th style={{ padding: '14px 18px', fontWeight: 800 }}>Assigned Role & Level</th>
                    <th style={{ padding: '14px 18px', fontWeight: 800 }}>Contact Details</th>
                    <th style={{ padding: '14px 18px', fontWeight: 800 }}>Security Status</th>
                    <th style={{ padding: '14px 18px', fontWeight: 800 }}>Password / Passcode</th>
                    <th style={{ padding: '14px 18px', fontWeight: 800, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                          <UserX size={32} />
                          <div style={{ fontWeight: 700, fontSize: 14 }}>No user accounts found matching your filter criteria.</div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => {
                      const roleConfig = ROLES.find(r => r.value === user.role) || ROLES[0];
                      const isPasswordShown = !!showPasswordMap[user.id];

                      return (
                        <tr key={user.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}>
                          {/* User Identity */}
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{
                                width: 36, height: 36, borderRadius: '50%', background: roleConfig.bg,
                                color: roleConfig.badgeColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 800, fontSize: 14, flexShrink: 0, border: `1px solid ${roleConfig.badgeColor}33`
                              }}>
                                {(user.fullName || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 800, color: 'var(--text-color)' }}>{user.fullName}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                                  <span>{user.staffId || user.studentId || user.id}</span>
                                  {user.department && <span>• {user.department}</span>}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 800,
                              background: roleConfig.bg, color: roleConfig.badgeColor,
                              border: `1px solid ${roleConfig.badgeColor}44`
                            }}>
                              <Shield size={12} />
                              {roleConfig.label}
                            </span>
                            {user.assignedClass && (
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>
                                🏫 Class: {user.assignedClass}
                              </div>
                            )}
                          </td>

                          {/* Contact */}
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
                                <Mail size={12} style={{ color: 'var(--text-muted)' }} />
                                <span>{user.email}</span>
                              </div>
                              {user.phone && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)' }}>
                                  <Phone size={12} />
                                  <span>{user.phone}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800,
                                background: user.status === 'Active' ? '#dcfce7' : '#fee2e2',
                                color: user.status === 'Active' ? '#166534' : '#991b1b',
                                width: 'fit-content'
                              }}>
                                {user.status === 'Active' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                                {user.status}
                              </span>
                              {user.mustChangePassword && (
                                <span style={{ fontSize: 10, color: '#b45309', fontWeight: 700 }}>
                                  ⚠️ Reset upon login
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Password */}
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <code style={{
                                background: '#f1f5f9', padding: '4px 8px', borderRadius: 4,
                                fontSize: 12, fontWeight: 700, letterSpacing: isPasswordShown ? 'normal' : '0.15em',
                                color: '#334155'
                              }}>
                                {isPasswordShown ? (user.password || 'Carewell2026!') : '••••••••'}
                              </code>
                              <button
                                onClick={() => setShowPasswordMap(prev => ({ ...prev, [user.id]: !prev[user.id] }))}
                                title={isPasswordShown ? 'Hide password' : 'View password'}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
                              >
                                {isPasswordShown ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                              <button
                                onClick={() => copyToClipboard(user.password || 'Carewell2026!', `pass-${user.id}`)}
                                title="Copy password"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedId === `pass-${user.id}` ? '#16a34a' : 'var(--text-muted)', padding: 2 }}
                              >
                                {copiedId === `pass-${user.id}` ? <Check size={14} /> : <Copy size={14} />}
                              </button>
                            </div>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                              {/* Reset Password */}
                              <button
                                onClick={() => {
                                  setResetPassUser(user);
                                  setNewPasswordInput(generateSecurePassword(user.role));
                                  setRequireResetNextLogin(false);
                                }}
                                title="Set / Reset User Password"
                                style={{
                                  padding: '6px 10px', background: '#f3e8ff', border: '1px solid #d8b4fe',
                                  borderRadius: 6, color: '#6b21a8', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                  display: 'inline-flex', alignItems: 'center', gap: 4
                                }}
                              >
                                <Key size={12} />
                                <span>Reset Pass</span>
                              </button>

                              {/* Print Slip */}
                              <button
                                onClick={() => setSlipUser(user)}
                                title="View & Print Access Slip"
                                style={{
                                  padding: '6px 8px', background: '#f8fafc', border: '1px solid var(--border-color)',
                                  borderRadius: 6, color: 'var(--text-color)', cursor: 'pointer'
                                }}
                              >
                                <Printer size={13} />
                              </button>

                              {/* Edit Profile */}
                              <button
                                onClick={() => setEditingUser({ ...user })}
                                title="Edit Role & Details"
                                style={{
                                  padding: '6px 8px', background: '#f8fafc', border: '1px solid var(--border-color)',
                                  borderRadius: 6, color: 'var(--text-color)', cursor: 'pointer'
                                }}
                              >
                                <Edit3 size={13} />
                              </button>

                              {/* Suspend / Reactivate */}
                              <button
                                onClick={() => handleToggleAccountStatus(user)}
                                title={user.status === 'Active' ? 'Suspend Account' : 'Reactivate Account'}
                                style={{
                                  padding: '6px 8px', background: user.status === 'Active' ? '#fef2f2' : '#f0fdf4',
                                  border: `1px solid ${user.status === 'Active' ? '#fecaca' : '#bbf7d0'}`,
                                  borderRadius: 6, color: user.status === 'Active' ? '#b91c1c' : '#15803d', cursor: 'pointer'
                                }}
                              >
                                {user.status === 'Active' ? <Lock size={13} /> : <Unlock size={13} />}
                              </button>

                              {/* Delete Account */}
                              {user.role !== 'admin' && (
                                <button
                                  onClick={() => handleDeleteUser(user)}
                                  title="Permanently Delete Account"
                                  style={{
                                    padding: '6px 8px', background: '#fef2f2', border: '1px solid #fecaca',
                                    borderRadius: 6, color: '#dc2626', cursor: 'pointer'
                                  }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROLE PERMISSION MATRIX */}
      {activeTab === 'matrix' && (
        <div style={{ background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800 }}>Institutional Access & Governance Matrix</h3>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
              Comprehensive visual breakdown of system access privileges, approvals, financial workflows, and data visibility by role.
            </p>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 800 }}>Permission Scope / Capability</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, color: '#4a1d6e' }}>Head Admin</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, color: '#0369a1' }}>Sub-Admin</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, color: '#166534' }}>Accountant</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, color: '#b45309' }}>Teacher</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, color: '#4338ca' }}>Student</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, color: '#be185d' }}>Parent</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'UAC Account Provisioning & Password Override', roles: ['admin'] },
                  { name: 'Financial Pre-Audit & Payment Voucher (PV) Approval', roles: ['admin'] },
                  { name: 'Global Academic Settings & Term Resumption Dates', roles: ['admin'] },
                  { name: 'Security Intrusion Alerts & IP Ban Execution', roles: ['admin'] },
                  { name: 'Student Onboarding & Official Admission Approval', roles: ['admin', 'sub_admin'] },
                  { name: 'Digital NFC Card Issuance & Smart Badging', roles: ['admin', 'sub_admin'] },
                  { name: 'Exam Registration & BECE Index Assignment', roles: ['admin', 'sub_admin', 'teacher'] },
                  { name: 'Fee Schedule Invoicing & Ledger Entry Creation', roles: ['admin', 'accountant'] },
                  { name: 'Class Assessment, Test Weights & Report Cards', roles: ['admin', 'sub_admin', 'teacher'] },
                  { name: 'Daily Attendance Roll Call & Gate Scans', roles: ['admin', 'sub_admin', 'teacher', 'security_driver'] },
                  { name: 'Assignments & Homework Distribution', roles: ['admin', 'teacher'] },
                  { name: 'Parent-Teacher Communication & SMS Dispatch', roles: ['admin', 'sub_admin', 'accountant', 'teacher'] },
                  { name: 'Student Academic Transcript & Results Inspection', roles: ['admin', 'sub_admin', 'teacher', 'student', 'parent'] },
                  { name: 'Tuition Fee Payment & Receipt Download', roles: ['admin', 'accountant', 'parent'] },
                  { name: 'Live School Bus GPS Tracking', roles: ['admin', 'parent', 'security_driver'] },
                ].map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)', background: idx % 2 === 0 ? '#fff' : '#fcfcfd' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-color)' }}>{item.name}</td>
                    {['admin', 'sub_admin', 'accountant', 'teacher', 'student', 'parent'].map(r => {
                      const hasAccess = item.roles.includes(r);
                      return (
                        <td key={r} style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {hasAccess ? (
                            <span style={{ color: '#16a34a', fontWeight: 900, fontSize: 16 }}>✓</span>
                          ) : (
                            <span style={{ color: '#cbd5e1', fontSize: 14 }}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div style={{ background: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800 }}>UAC Security & Action Audit Trail</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                Immutable historical event logs tracking all credential modifications, role re-assignments, and user creations.
              </p>
            </div>
            <button
              onClick={() => {
                const csv = 'Timestamp,Action,Target,PerformedBy,Details\n' +
                  auditLogs.map(l => `"${l.timestamp}","${l.action}","${l.targetUser}","${l.performedBy}","${l.details}"`).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `uac_audit_log_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                fontSize: 12, fontWeight: 700, cursor: 'pointer'
              }}
            >
              <Download size={14} />
              <span>Export CSV</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {auditLogs.map(log => (
              <div
                key={log.id}
                style={{
                  padding: '14px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                  background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      padding: '3px 8px', borderRadius: 4, fontSize: 10, fontWeight: 900,
                      background: log.action.includes('Created') ? '#dcfce7' : log.action.includes('Reset') ? '#f3e8ff' : '#e0f2fe',
                      color: log.action.includes('Created') ? '#166534' : log.action.includes('Reset') ? '#6b21a8' : '#0369a1',
                    }}>
                      {log.action.toUpperCase()}
                    </span>
                    <strong style={{ fontSize: 13, color: 'var(--text-color)' }}>{log.targetUser}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{log.details}</div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-color)' }}>By: {log.performedBy}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{log.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE USER MODAL */}
      {isCreateModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20
        }}>
          <div style={{
            background: '#fff', width: '100%', maxWidth: 580, borderRadius: 'var(--radius-lg)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{
              padding: '20px 24px', background: 'linear-gradient(135deg, #4a1d6e, #7c3ac8)', color: '#fff',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <UserPlus size={20} />
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Create New User Account</h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ padding: 24, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Dr. Kwabena Mensah"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, fullName: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>System Login Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="name@remaljcarewell.edu.gh"
                    value={createForm.email}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Phone Number</label>
                  <input
                    type="text"
                    placeholder="024 123 4567"
                    value={createForm.phone}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, phone: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Assigned User Role *</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, role: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: 13, background: '#fff', fontWeight: 700 }}
                  >
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Staff / Student ID</label>
                  <input
                    type="text"
                    placeholder="e.g. CT-2026-005"
                    value={createForm.staffId}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, staffId: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Department / Wing</label>
                  <input
                    type="text"
                    placeholder="e.g. Science Dept / JHS"
                    value={createForm.department}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, department: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Assigned Class (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Grade 4 Section A"
                    value={createForm.assignedClass}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, assignedClass: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700 }}>Initial Account Password</label>
                  <button
                    type="button"
                    onClick={() => setCreateForm(prev => ({ ...prev, password: generateSecurePassword(createForm.role) }))}
                    style={{ background: 'none', border: 'none', color: '#7c3ac8', fontWeight: 800, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Sparkles size={12} />
                    <span>Generate Secure Password</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Enter custom or generated password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: 13, fontFamily: 'monospace', fontWeight: 700 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <input
                  type="checkbox"
                  id="mustChangePass"
                  checked={createForm.mustChangePassword}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, mustChangePassword: e.target.checked }))}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="mustChangePass" style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-color)', cursor: 'pointer' }}>
                  Force user to change password on first login
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{ padding: '10px 18px', background: '#f1f5f9', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 22px', background: '#4a1d6e', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
                >
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESET PASSWORD MODAL */}
      {resetPassUser && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20
        }}>
          <div style={{
            background: '#fff', width: '100%', maxWidth: 480, borderRadius: 'var(--radius-lg)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px', background: 'linear-gradient(135deg, #4a1d6e, #7c3ac8)', color: '#fff',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Key size={20} />
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Reset User Password</h3>
              </div>
              <button onClick={() => setResetPassUser(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleDirectPasswordReset} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ padding: 12, background: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-color)' }}>{resetPassUser.fullName}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{resetPassUser.email}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#4a1d6e', marginTop: 4 }}>Role: {resetPassUser.role.toUpperCase()}</div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700 }}>New Password *</label>
                  <button
                    type="button"
                    onClick={() => setNewPasswordInput(generateSecurePassword(resetPassUser.role))}
                    style={{ background: 'none', border: 'none', color: '#7c3ac8', fontWeight: 800, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Sparkles size={12} />
                    <span>Auto-Generate</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: 14, fontFamily: 'monospace', fontWeight: 700 }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  id="reqReset"
                  checked={requireResetNextLogin}
                  onChange={(e) => setRequireResetNextLogin(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="reqReset" style={{ fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Require user to update password upon their next login
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setResetPassUser(null)}
                  style={{ padding: '10px 18px', background: '#f1f5f9', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 22px', background: '#4a1d6e', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
                >
                  Update Password Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EDIT USER DETAILS */}
      {editingUser && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20
        }}>
          <div style={{
            background: '#fff', width: '100%', maxWidth: 520, borderRadius: 'var(--radius-lg)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px', background: 'linear-gradient(135deg, #4a1d6e, #7c3ac8)', color: '#fff',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Edit3 size={20} />
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Edit User Details & Role</h3>
              </div>
              <button onClick={() => setEditingUser(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={editingUser.fullName}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, fullName: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: 13 }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Role Assignment</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, role: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: 13, background: '#fff', fontWeight: 700 }}
                  >
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Status</label>
                  <select
                    value={editingUser.status}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, status: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: 13, background: '#fff', fontWeight: 700 }}
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Phone Number</label>
                  <input
                    type="text"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, phone: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Department</label>
                  <input
                    type="text"
                    value={editingUser.department || ''}
                    onChange={(e) => setEditingUser(prev => ({ ...prev, department: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  style={{ padding: '10px 18px', background: '#f1f5f9', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 22px', background: '#4a1d6e', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: CREDENTIAL ACCESS SLIP (PRINTABLE) */}
      {slipUser && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20
        }}>
          <div style={{
            background: '#fff', width: '100%', maxWidth: 500, borderRadius: 'var(--radius-lg)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px', background: 'linear-gradient(135deg, #4a1d6e, #7c3ac8)', color: '#fff',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Key size={20} />
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>Account Credential Slip</h3>
              </div>
              <button onClick={() => setSlipUser(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 16 }}>
                <div style={{ fontWeight: 900, fontSize: 15, color: '#4a1d6e' }}>REMALJ CAREWELL INSPIRATIONAL SCHOOL</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Bogoso Main Campus • Official User Access Credentials</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Account Holder:</span>
                  <strong style={{ color: 'var(--text-color)' }}>{slipUser.fullName}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Assigned Role:</span>
                  <span style={{ fontWeight: 800, color: '#4a1d6e', textTransform: 'uppercase' }}>{slipUser.role}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Staff / Student ID:</span>
                  <strong>{slipUser.staffId || slipUser.studentId || slipUser.id}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, background: '#f8fafc', padding: '10px 12px', borderRadius: 6 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Login Email:</span>
                  <strong style={{ fontFamily: 'monospace' }}>{slipUser.email}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, background: '#f3e8ff', padding: '10px 12px', borderRadius: 6 }}>
                  <span style={{ color: '#6b21a8', fontWeight: 700 }}>Default Password:</span>
                  <strong style={{ fontFamily: 'monospace', color: '#4a1d6e', fontSize: 14 }}>{slipUser.password || 'Carewell2026!'}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Portal URL:</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0369a1' }}>http://localhost:5173</span>
                </div>
              </div>

              <div style={{
                fontSize: 11, color: '#78350f', background: '#fef3c7', padding: '10px 12px',
                borderRadius: 6, border: '1px solid #fde68a'
              }}>
                🔒 Keep these credentials confidential. You may change your password anytime in portal settings.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    const text = `REMALJ CAREWELL ACCESS CREDENTIALS\nName: ${slipUser.fullName}\nRole: ${slipUser.role.toUpperCase()}\nLogin: ${slipUser.email}\nPassword: ${slipUser.password || 'Carewell2026!'}\nPortal: http://localhost:5173`;
                    copyToClipboard(text, 'slip-full');
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
                    background: '#f1f5f9', border: 'none', borderRadius: 'var(--radius-md)',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer'
                  }}
                >
                  {copiedId === 'slip-full' ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                  <span>{copiedId === 'slip-full' ? 'Copied' : 'Copy Text'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
                    background: '#4a1d6e', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
                    fontWeight: 800, fontSize: 13, cursor: 'pointer'
                  }}
                >
                  <Printer size={14} />
                  <span>Print Slip</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
