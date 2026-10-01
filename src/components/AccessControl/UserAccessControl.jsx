import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck, UserPlus, Users, Key, Lock, Unlock, RefreshCw, Search,
  Filter, CheckCircle2, AlertTriangle, Trash2, Edit3, Eye, EyeOff,
  Copy, Printer, Shield, UserX, UserCheck, Mail, Phone, Clock,
  FileText, Download, X, Plus, Sparkles, Building, Check, Layers
} from 'lucide-react';
import { usePortalData, directoryProfileFromUser } from '../../data/PortalStore';
import { api, getAuthUser, getAuthToken, ensureDemoClassTeacherAccounts } from '../../services/api';
import { CLASS_LEVELS, getMappedSubClasses } from '../../data/classStructure';

const ROLES = [
  { value: 'admin', label: 'Head Administrator', badgeColor: '#4a1d6e', bg: '#f3e8ff', desc: 'Full institutional control and administrative governance' },
  { value: 'sub_admin', label: 'Sub-Administrator', badgeColor: '#0369a1', bg: '#e0f2fe', desc: 'Operational student roster and academic task handling' },
  { value: 'accountant', label: 'Accountant', badgeColor: '#166534', bg: '#dcfce7', desc: 'Billing, fee collection, payment vouchers, and ledger' },
  { value: 'teacher', label: 'Subject Teacher', badgeColor: '#b45309', bg: '#fef3c7', desc: 'Class roster, lesson planning, grades, and attendance' },
  { value: 'class_teacher', label: 'Class Teacher', badgeColor: '#166534', bg: '#dcfce7', desc: 'Form tutor with class leadership, passcode verification, and class portal access' },
  { value: 'student', label: 'Student', badgeColor: '#4338ca', bg: '#e0e7ff', desc: 'Assignments, timetable, report cards, and digital ID' },
  { value: 'parent', label: 'Parent / Guardian', badgeColor: '#be185d', bg: '#fce7f3', desc: 'Child progress, tuition fees, bus tracking, and messaging' },
  { value: 'security_driver', label: 'Transport / Security', badgeColor: '#374151', bg: '#f3f4f6', desc: 'Bus routing, RFID gate scans, and safety logging' },
];

const CLASS_OPTIONS = CLASS_LEVELS;

function RoleSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);
  const selected = ROLES.find((role) => role.value === value) || ROLES[0];

  const openMenu = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const itemHeight = 36;
    const menuHeight = ROLES.length * itemHeight + 8;
    const top = Math.max(8, rect.top - menuHeight - 6);
    setMenuStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      top,
      zIndex: 10050,
      background: '#fff',
      border: '1px solid #d1d5db',
      borderRadius: 8,
      boxShadow: '0 12px 28px rgba(15, 23, 42, 0.18)',
      padding: 4,
    });
    setOpen(true);
  };

  return (
    <div>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        style={{
          width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)', fontSize: 13, background: '#fff',
          fontWeight: 700, textAlign: 'left', cursor: 'pointer'
        }}
      >
        {selected.label}
      </button>
      {open && menuStyle && (
        <>
          <button
            type="button"
            aria-label="Close role list"
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'transparent', border: 'none', zIndex: 10040, cursor: 'default' }}
          />
          <div style={menuStyle}>
            {ROLES.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => { onChange(role.value); setOpen(false); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px',
                  border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  background: role.value === value ? '#f3e8ff' : '#fff',
                  color: role.value === value ? '#4a1d6e' : '#111827'
                }}
              >
                {role.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function extractBackendUsers(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.users)) return res.users;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.users)) return res.data.users;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
}

function isSeededDemoAccount(user) {
  const email = String(user?.email || '').trim().toLowerCase();
  const staffId = String(user?.staffId || '').trim().toLowerCase();
  if (email.endsWith('@class-teacher.local')) return true;
  if (email === 'classteacher@remaljcarewell.edu.gh' || email === 'a.sarfo@remaljcarewell.edu.gh') return true;
  if (staffId === 'ct-2026-demo' || staffId === 'stf-2026-004') return true;
  return false;
}

function mapBackendUser(item) {
  if (!item || typeof item !== 'object') return null;
  const email = String(item.email || '').trim();
  const id = item.id || item._id || '';
  if (!id && !email) return null;
  const designation = item.teacherDesignation || item.teacher_designation || item.designation || '';
  const isClassTeacher = designation === 'class_teacher'
    || item.role === 'class_teacher'
    || String(item.role || '').toLowerCase() === 'class teacher'
    || item.is_class_teacher === true
    || item.isClassTeacher === true;
  const activeFlag = item.is_active !== false && item.isActive !== false;
  return {
    id: id || email,
    fullName: item.fullName || item.full_name || item.name || 'User',
    email,
    phone: item.phone || item.phone_number || item.phoneNumber || '',
    role: isClassTeacher ? 'class_teacher' : (item.role || 'student'),
    teacherDesignation: isClassTeacher ? 'class_teacher' : (designation || ''),
    passcode: item.passcode || '',
    status: item.status || (activeFlag ? 'Active' : 'Suspended'),
    staffId: item.staffId || item.staff_id || item.staff_code || '',
    studentId: item.studentId || item.student_id || item.student_code || '',
    password: item.password || '',
    department: item.department || '',
    assignedClass: item.assignedClass || item.assigned_class || item.class_assigned || '',
    classLevel: item.classLevel || item.class_level || '',
    subClass: item.subClass || item.sub_class || '',
    createdAt: item.createdAt || item.created_at || '',
    lastLogin: item.lastLogin || item.last_login || 'Never',
    mustChangePassword: !!(item.mustChangePassword || item.must_change_password),
  };
}

export default function UserAccessControl({ adminRole = 'head_admin' }) {
  const { addStaffMember, refreshBackendData } = usePortalData();

  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'matrix' | 'audit'
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [backendError, setBackendError] = useState(null);

  const [users, setUsers] = useState([]);

  const fetchBackendUsers = () => {
    const token = getAuthToken();
    if (!token || !String(token).startsWith('eyJ')) {
      setUsers([]);
      setBackendError('Sign in with a live database session to load accounts. Nothing is kept in this browser.');
      setIsLoadingUsers(false);
      return;
    }

    setIsLoadingUsers(true);
    ensureDemoClassTeacherAccounts();
    api.getUsers()
      .then(async (res) => {
        const backendList = extractBackendUsers(res).map(mapBackendUser).filter(Boolean);
        const seeded = backendList.filter(isSeededDemoAccount);
        const kept = backendList.filter((user) => !isSeededDemoAccount(user));
        const failed = [];
        for (const user of seeded) {
          try {
            await api.deleteUserAccount(user.id);
          } catch (err) {
            failed.push(user);
          }
        }
        setUsers([...kept, ...failed]);
        setBackendError(failed.length
          ? 'Some old demo accounts are still in the database because this session could not delete them.'
          : null);
      })
      .catch((err) => {
        console.warn('[UAC] Could not fetch users from the database:', err?.message || err);
        setUsers([]);
        const msg = String(err?.message || '').toLowerCase();
        if (msg.includes('credentials') || msg.includes('401') || msg.includes('unauthorized')) {
          setBackendError('The database session has expired. Sign in again. Saved browser accounts are not shown.');
        } else {
          setBackendError('The database could not be reached, so no accounts are shown.');
        }
      })
      .finally(() => {
        setIsLoadingUsers(false);
      });
  };

  useEffect(() => {
    fetchBackendUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [auditLogs, setAuditLogs] = useState([]);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [resetPassUser, setResetPassUser] = useState(null);
  const [slipUser, setSlipUser] = useState(null);
  const [showPasswordMap, setShowPasswordMap] = useState({});
  const [successToast, setSuccessToast] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const hasOpenOverlay = isCreateModalOpen || !!slipUser;

  useEffect(() => {
    if (!hasOpenOverlay) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [hasOpenOverlay]);

  // Escape always clears the dimmed overlay, so it can never be left stuck on screen
  useEffect(() => {
    if (!hasOpenOverlay) return undefined;
    const onKeyDown = (e) => {
      if (e.key !== 'Escape') return;
      setIsCreateModalOpen(false);
      setSlipUser(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hasOpenOverlay]);

  // New User Form State
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'teacher',
    staffId: '',
    studentId: '',
    assignedClass: '',
    subClass: '',
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
    setAuditLogs((current) => [newLog, ...current].slice(0, 100));
  };

  const generateSecurePassword = (role = 'general') => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let res = 'Rcis!';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  const handleCreateUser = async (e) => {
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

    const isClassTeacher = createForm.role === 'class_teacher';
    if (isClassTeacher && !createForm.assignedClass) {
      alert('Assign a class before creating a class teacher.');
      return;
    }

    const finalPass = createForm.password.trim() || generateSecurePassword(createForm.role);
    const autoStaffId = createForm.staffId.trim() || (
      (createForm.role === 'teacher' || createForm.role === 'class_teacher') ? `CT-2026-${String(users.length + 1).padStart(3, '0')}` :
      createForm.role === 'accountant' ? `ACC-2026-${String(users.length + 1).padStart(3, '0')}` :
      createForm.role === 'admin' ? `ADM-2026-${String(users.length + 1).padStart(3, '0')}` : undefined
    );
    const classPasscode = isClassTeacher ? String(Math.floor(1000 + Math.random() * 9000)) : undefined;
    const assignedClass = createForm.subClass || createForm.assignedClass || undefined;

    const newUser = {
      id: `usr_${createForm.role}_${Date.now()}`,
      fullName: createForm.fullName.trim(),
      email: emailKey,
      phone: createForm.phone.trim() || '024 000 0000',
      role: createForm.role,
      teacherDesignation: isClassTeacher ? 'class_teacher' : undefined,
      status: createForm.status || 'Active',
      staffId: autoStaffId,
      studentId: createForm.studentId.trim() || undefined,
      assignedClass,
      classLevel: createForm.assignedClass || undefined,
      subClass: createForm.subClass || undefined,
      password: finalPass,
      passcode: classPasscode,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: 'Never',
      mustChangePassword: createForm.mustChangePassword,
    };

    try {
      const res = await api.createUserAccount({ ...newUser });
      const remoteId = res?.id || res?._id || res?.user?.id || res?.data?.id;
      const savedUser = { ...newUser, id: remoteId || newUser.id };

      const directoryProfile = directoryProfileFromUser(savedUser);
      if (directoryProfile && addStaffMember) {
        try {
          await addStaffMember({
            ...directoryProfile,
            teacherDesignation: isClassTeacher ? 'class_teacher' : undefined,
            classAssigned: newUser.classLevel || newUser.assignedClass || '',
            status: 'Active',
          });
        } catch (staffErr) {
          console.warn('[UAC] Staff directory sync failed:', staffErr?.message || staffErr);
        }
      }

      if (newUser.role === 'class_teacher' && newUser.passcode) {
        try {
          await api.issueClassTeacherCredential({
            teacherName: newUser.fullName,
            classAssigned: newUser.assignedClass || newUser.classLevel,
            staffId: newUser.staffId,
            passcode: newUser.passcode,
            phone: newUser.phone,
          });
        } catch (ctErr) {
          console.warn('[UAC] Class teacher passcode issue failed:', ctErr?.message || ctErr);
        }
      }

      if (refreshBackendData) await refreshBackendData();
      addAuditLog('Account Created', newUser.email, `Created account for ${newUser.fullName} with role [${newUser.role.toUpperCase()}].`);
      setIsCreateModalOpen(false);
      setSlipUser(savedUser);
      triggerToast(`User account for ${newUser.fullName} was saved in the database.`);
      fetchBackendUsers();
    } catch (err) {
      alert(`The database did not save this account: ${err?.message || 'request failed'}`);
      return;
    }

    // Reset form
    setCreateForm({
      fullName: '',
      email: '',
      phone: '',
      role: 'teacher',
      staffId: '',
      studentId: '',
      assignedClass: '',
      subClass: '',
      password: '',
      status: 'Active',
      mustChangePassword: false,
    });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await api.updateUserAccount(editingUser.id, editingUser);
    } catch (err) {
      alert(`The database did not update this account: ${err?.message || 'request failed'}`);
      return;
    }

    if (refreshBackendData) await refreshBackendData();
    addAuditLog('Account Modified', editingUser.email, `Updated profile / role details for ${editingUser.fullName}.`);
    setEditingUser(null);
    triggerToast(`User record for ${editingUser.fullName} was updated in the database.`);
    fetchBackendUsers();
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
      alert(`The database did not reset this password: ${err?.message || 'request failed'}`);
      return;
    }

    addAuditLog('Password Reset', resetPassUser.email, `Password changed by administrator.`);
    fetchBackendUsers();
    
    const targetWithNewPass = { ...resetPassUser, password: newPasswordInput.trim() };
    setResetPassUser(null);
    setNewPasswordInput('');
    setSlipUser(targetWithNewPass);
    triggerToast(`🔐 Password reset successfully for ${resetPassUser.fullName}!`);
  };

  const handleToggleAccountStatus = async (user) => {
    const newStatus = user.status === 'Active' ? 'Suspended' : 'Active';

    try {
      await api.toggleUserAccountStatus(user.id, newStatus);
    } catch (err) {
      alert(`The database did not change this account status: ${err?.message || 'request failed'}`);
      return;
    }

    addAuditLog(newStatus === 'Suspended' ? 'Account Suspended' : 'Account Re-activated', user.email, `Status changed to ${newStatus}.`);
    triggerToast(`Account for ${user.fullName} is now ${newStatus}.`);
    fetchBackendUsers();
  };

  const handleDeleteUser = async (user) => {
    if (user.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1) {
      alert('⚠️ Cannot delete the primary Head Administrator account.');
      return;
    }

    if (!window.confirm(`⚠️ Permanently revoke access and remove account for ${user.fullName} (${user.email})?`)) {
      return;
    }

    try {
      await api.deleteUserAccount(user.id);
    } catch (err) {
      alert(`The database did not remove this account: ${err?.message || 'request failed'}`);
      return;
    }

    addAuditLog('Account Deleted', user.email, `Account permanently revoked.`);
    triggerToast(`User account ${user.email} was removed from the database.`);
    fetchBackendUsers();
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
      {/* Loading overlay */}
      {isLoadingUsers && (
        <div style={{
          padding: '10px 16px', background: '#eff6ff', border: '1px solid #bfdbfe',
          color: '#1e40af', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 13,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} />
          Syncing users from server…
        </div>
      )}
      {/* Backend connectivity warning */}
      {backendError && !isLoadingUsers && (
        <div style={{
          padding: '10px 16px', background: '#fffbeb', border: '1px solid #fcd34d',
          color: '#92400e', borderRadius: 'var(--radius-md)', fontWeight: 600, fontSize: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={15} style={{ flexShrink: 0 }} />
            <span>{backendError}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={fetchBackendUsers}
              style={{
                padding: '4px 12px',
                background: '#b45309',
                color: '#ffffff',
                border: 'none',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <RefreshCw size={11} /> Retry Connection
            </button>
            <button
              type="button"
              onClick={() => setBackendError(null)}
              style={{
                padding: '4px 8px',
                background: 'transparent',
                color: '#92400e',
                border: 'none',
                fontSize: 14,
                fontWeight: 800,
                cursor: 'pointer'
              }}
              title="Dismiss notice"
            >
              ✕
            </button>
          </div>
        </div>
      )}
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
                staffId: '',
                studentId: '',
                assignedClass: '',
                subClass: '',
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
                          <div style={{ fontWeight: 700, fontSize: 14 }}>
                            {isLoadingUsers
                              ? 'Loading accounts from the database...'
                              : (searchQuery || roleFilter !== 'all' || statusFilter !== 'all')
                                ? 'No database accounts match this filter.'
                                : 'No accounts are stored in the database.'}
                          </div>
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
                                fontSize: 12, fontWeight: 700, letterSpacing: user.password && !isPasswordShown ? '0.15em' : 'normal',
                                color: '#334155'
                              }}>
                                {user.password ? (isPasswordShown ? user.password : '••••••••') : 'Stored in database'}
                              </code>
                              <button
                                onClick={() => setShowPasswordMap(prev => ({ ...prev, [user.id]: !prev[user.id] }))}
                                title={isPasswordShown ? 'Hide password' : 'View password'}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}
                              >
                                {isPasswordShown ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                              <button
                                onClick={() => user.password && copyToClipboard(user.password, `pass-${user.id}`)}
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
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, color: '#b45309' }}>Subject Teacher</th>
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
                  { name: 'Exam Registration & BECE Index Assignment', roles: ['admin', 'teacher'] },
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
            {auditLogs.length === 0 && (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
                No access-control actions have been recorded in this session. This list is not loaded from a saved copy on this device.
              </p>
            )}
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
      {isCreateModalOpen && createPortal(
        <div
          onClick={() => setIsCreateModalOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 10000,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            boxSizing: 'border-box',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              width: 'min(580px, 100%)',
              maxHeight: 'min(90vh, 860px)',
              margin: 'auto',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 24px 48px rgba(15, 23, 42, 0.28)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
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

            <form onSubmit={handleCreateUser} style={{ padding: 24, overflowY: 'auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Assigned User Role *</label>
                <RoleSelect
                  value={createForm.role}
                  onChange={(role) => setCreateForm(prev => ({ ...prev, role }))}
                />
              </div>

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
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    Assigned Class {createForm.role === 'class_teacher' ? '*' : '(Optional)'}
                  </label>
                  <select
                    value={createForm.assignedClass}
                    onChange={(e) => {
                      const assignedClass = e.target.value;
                      const mapped = getMappedSubClasses(assignedClass);
                      setCreateForm((prev) => ({
                        ...prev,
                        assignedClass,
                        subClass: mapped.includes(prev.subClass) ? prev.subClass : (mapped[0] || ''),
                      }));
                    }}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: 13, background: '#fff' }}
                  >
                    <option value="">Not assigned</option>
                    {CLASS_OPTIONS.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Sub Class (Optional)</label>
                  <select
                    value={createForm.subClass}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, subClass: e.target.value }))}
                    disabled={!createForm.assignedClass}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: 13, background: createForm.assignedClass ? '#fff' : 'var(--bg-muted, #f1f5f9)' }}
                  >
                    <option value="">{createForm.assignedClass ? 'No sub class' : 'Select a class first'}</option>
                    {getMappedSubClasses(createForm.assignedClass).map((section) => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
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
        </div>,
        document.body
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
                  <RoleSelect
                    value={editingUser.role}
                    onChange={(role) => setEditingUser(prev => ({ ...prev, role }))}
                  />
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
      {slipUser && createPortal(
        <div
          onClick={() => setSlipUser(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 20
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', width: '100%', maxWidth: 500, borderRadius: 'var(--radius-lg)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden'
            }}
          >
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
                  <strong style={{ fontFamily: 'monospace', color: '#4a1d6e', fontSize: 14 }}>{slipUser.password || 'Stored in the database'}</strong>
                </div>

                {slipUser.passcode && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, background: '#dcfce7', padding: '10px 12px', borderRadius: 6 }}>
                    <span style={{ color: '#166534', fontWeight: 700 }}>Class Teacher Passcode:</span>
                    <strong style={{ fontFamily: 'monospace', color: '#14532d', fontSize: 14 }}>{slipUser.passcode}</strong>
                  </div>
                )}

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
                    const text = `REMALJ CAREWELL ACCESS CREDENTIALS\nName: ${slipUser.fullName}\nRole: ${slipUser.role.toUpperCase()}\nLogin: ${slipUser.email}\nPassword: ${slipUser.password || 'Stored in the database'}${slipUser.passcode ? `\nClass Teacher Passcode: ${slipUser.passcode}` : ''}\nStaff ID: ${slipUser.staffId || ''}\nPortal: http://localhost:5173`;
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

                <button
                  type="button"
                  onClick={() => setSlipUser(null)}
                  style={{
                    padding: '10px 20px', background: '#166534', color: '#fff', border: 'none',
                    borderRadius: 'var(--radius-md)', fontWeight: 800, fontSize: 13, cursor: 'pointer'
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
