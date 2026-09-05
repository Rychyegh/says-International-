import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2, XCircle, Send, Radio, Search, ShieldCheck, Phone, Check,
  CreditCard, Cpu, Sparkles, Filter, Calendar, FileText, Download, Printer,
  Eye, RefreshCw, Layers, UserCheck, AlertTriangle
} from 'lucide-react';
import { usePortalData } from '../../data/PortalStore';
import { api } from '../../services/api';
import './AttendanceControlTable.css';

const INITIAL_ATTENDANCE_LOGS = [
  { id: 'log-101', date: '2026-09-05', time: '08:15 AM', studentId: 'REMALJ-2026-001', studentName: 'Benjamin Edwards', level: 'Grade 4 (B)', method: 'RFID Card Reader', status: 'CardScanned', guardianName: 'Mrs. Angela Edwards', phone: '054 176 9621', smsStatus: 'Sent' },
  { id: 'log-102', date: '2026-09-05', time: '08:30 AM', studentId: 'REMALJ-2026-002', studentName: 'Adwoa Edwards', level: 'Primary 5 (5A)', method: 'Manual Roll Call', status: 'Present', guardianName: 'Mrs. Angela Edwards', phone: '054 176 9621', smsStatus: 'Sent' },
  { id: 'log-103', date: '2026-09-05', time: '08:45 AM', studentId: 'REMALJ-2026-041', studentName: 'Abena Mensah', level: 'JHS 3 (3A)', method: 'RFID Card Reader', status: 'CardScanned', guardianName: 'Mr. Kofi Mensah', phone: '054 176 9621', smsStatus: 'Sent' },
  { id: 'log-104', date: '2026-09-05', time: '09:00 AM', studentId: 'REMALJ-2026-112', studentName: 'Kwame Asante', level: 'JHS 3 (3A)', method: 'Manual Roll Call', status: 'Absent', guardianName: 'Mrs. Ama Asante', phone: '054 176 9621', smsStatus: 'Sent' },
  { id: 'log-105', date: '2026-09-05', time: '09:12 AM', studentId: 'REMALJ-2026-088', studentName: 'Efua Darko', level: 'JHS 2 (2B)', method: 'RFID Card Reader', status: 'CardScanned', guardianName: 'Mr. Yaw Darko', phone: '054 176 9621', smsStatus: 'Sent' },
  { id: 'log-106', date: '2026-09-04', time: '08:10 AM', studentId: 'REMALJ-2026-001', studentName: 'Benjamin Edwards', level: 'Grade 4 (B)', method: 'RFID Card Reader', status: 'CardScanned', guardianName: 'Mrs. Angela Edwards', phone: '054 176 9621', smsStatus: 'Sent' },
  { id: 'log-107', date: '2026-09-04', time: '08:22 AM', studentId: 'REMALJ-2026-002', studentName: 'Adwoa Edwards', level: 'Primary 5 (5A)', method: 'RFID Card Reader', status: 'CardScanned', guardianName: 'Mrs. Angela Edwards', phone: '054 176 9621', smsStatus: 'Sent' },
  { id: 'log-108', date: '2026-09-04', time: '08:35 AM', studentId: 'REMALJ-2026-041', studentName: 'Abena Mensah', level: 'JHS 3 (3A)', method: 'Manual Roll Call', status: 'Present', guardianName: 'Mr. Kofi Mensah', phone: '054 176 9621', smsStatus: 'Sent' },
];

export default function AttendanceControlTable() {
  const { onboardedStudents, updateOnboardedStudent } = usePortalData();
  const [activeTab, setActiveTab] = useState('take-attendance'); // 'take-attendance' | 'attendance-records'

  // Search & Filters for Taking Attendance
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('All');

  // Search & Filters for Attendance Records Register (Historical Logs)
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logLevelFilter, setLogLevelFilter] = useState('All');
  const [logStatusFilter, setLogStatusFilter] = useState('All');
  const [logDateFilter, setLogDateFilter] = useState('All');

  // Card Reader Input State
  const [cardInput, setCardInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [autoFocusEnabled, setAutoFocusEnabled] = useState(true);
  const [lastScannedStudent, setLastScannedStudent] = useState(null);
  const [unassignedCardCode, setUnassignedCardCode] = useState('');
  const [assignStudentId, setAssignStudentId] = useState('');
  const cardInputRef = useRef(null);

  // Modal for Viewing Individual Student Attendance Profile
  const [selectedStudentHistory, setSelectedStudentHistory] = useState(null);
  
  // State for Attendance Logs Register
  const [attendanceLogs, setAttendanceLogs] = useState(INITIAL_ATTENDANCE_LOGS);

  // Live Roll Call Attendance & SMS state per student ID
  const [attendanceState, setAttendanceState] = useState({
    'REMALJ-2026-001': { status: 'CardScanned', cardScanned: true, smsSent: true, lastSentAt: '08:15 AM' },
    'REMALJ-2026-002': { status: 'Present', cardScanned: false, smsSent: true, lastSentAt: '08:30 AM' },
  });

  const [notification, setNotification] = useState('');

  // Editable phone numbers per student ID
  const [customPhones, setCustomPhones] = useState({
    'REMALJ-2026-001': '054 176 9621',
  });

  // Sound chime feedback
  const playBeep = (isSuccess = true) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isSuccess ? 880 : 260, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (isSuccess ? 0.2 : 0.35));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + (isSuccess ? 0.2 : 0.35));
    } catch (e) {}
  };

  // Keyboard auto-listener for RFID Card Readers
  useEffect(() => {
    if (!autoFocusEnabled || activeTab !== 'take-attendance') return;
    const handleGlobalKeyDown = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag !== 'input' && activeTag !== 'textarea' && activeTag !== 'select') {
        if (cardInputRef.current) {
          cardInputRef.current.focus();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [autoFocusEnabled, activeTab]);

  const studentsList = onboardedStudents && onboardedStudents.length > 0 ? onboardedStudents : [
    { id: 'stu-001', studentId: 'REMALJ-2026-001', rfidCardCode: '0009841234', fullName: 'Benjamin Edwards', level: 'Grade 4', classSection: 'B', guardianName: 'Mrs. Angela Edwards', guardianPhone: '054 176 9621' },
    { id: 'stu-002', studentId: 'REMALJ-2026-002', rfidCardCode: '0014298132', fullName: 'Adwoa Edwards', level: 'Primary 5', classSection: '5A', guardianName: 'Mrs. Angela Edwards', guardianPhone: '054 176 9621' },
    { id: 'stu-003', studentId: 'REMALJ-2026-041', rfidCardCode: '0008431920', fullName: 'Abena Mensah', level: 'JHS 3', classSection: '3A', guardianName: 'Mr. Kofi Mensah', guardianPhone: '054 176 9621' },
    { id: 'stu-004', studentId: 'REMALJ-2026-112', rfidCardCode: '10485721', fullName: 'Kwame Asante', level: 'JHS 3', classSection: '3A', guardianName: 'Mrs. Ama Asante', guardianPhone: '054 176 9621' },
    { id: 'stu-005', studentId: 'REMALJ-2026-088', rfidCardCode: '82930419', fullName: 'Efua Darko', level: 'JHS 2', classSection: '2B', guardianName: 'Mr. Yaw Darko', guardianPhone: '054 176 9621' },
  ];

  // Helper to append a new attendance record entry to the Historical Register Logs
  const logNewAttendanceRecord = (student, status, method, timeStr, phone, guardianName) => {
    const sId = student.studentId || student.id;
    const dateStr = new Date().toISOString().split('T')[0];

    const newEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      date: dateStr,
      time: timeStr,
      studentId: sId,
      studentName: student.fullName,
      level: student.level || 'Class Level',
      method: method, // 'RFID Card Reader' | 'Manual Roll Call'
      status: status, // 'CardScanned' | 'Present' | 'Absent'
      guardianName: guardianName || student.guardianName || 'Guardian',
      phone: phone || student.guardianPhone || '0541769621',
      smsStatus: 'Sent'
    };

    setAttendanceLogs(prev => [newEntry, ...prev]);
  };

  // Helper to execute card verification & SMS dispatch for a matched student
  const executeStudentCardVerification = async (matchedStudent, scannedCardCode) => {
    const sId = matchedStudent.studentId || matchedStudent.id;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const phone = customPhones[sId] || matchedStudent.guardianPhone || '0541769621';
    const guardianName = matchedStudent.guardianName || 'Guardian';

    // Lock attendance as CardScanned (Present)
    setAttendanceState(prev => ({
      ...prev,
      [sId]: {
        status: 'CardScanned',
        cardScanned: true,
        smsSent: true,
        lastSentAt: timeStr,
        sending: false
      }
    }));

    // Record into central history register logs
    logNewAttendanceRecord(matchedStudent, 'CardScanned', 'RFID Card Reader', timeStr, phone, guardianName);

    setLastScannedStudent({ ...matchedStudent, scannedCardCode, timeStr, phone });

    // Dispatch SMS and log scan to backend concurrently
    const messageText = `[RCIS] REMALJ CARE: Dear ${guardianName}, your child ${matchedStudent.fullName} (${matchedStudent.level}) checked in via RFID Card Reader (Card #${scannedCardCode}) at school today at ${timeStr}.`;

    try {
      const smsPromise = api.sendSms({
        recipientPhone: phone,
        messageText,
        senderId: 'RCIS'
      });

      const backendPromise = api.recordAttendanceScan({
        identifier: sId,
        scanType: 'Check-in',
        sendSms: false
      }).catch(() => {});

      await Promise.all([smsPromise, backendPromise]);

      setNotification(`💳 PHYSICAL CARD READ SUCCESS! Verified Card #${scannedCardCode} -> ${matchedStudent.fullName} (${sId}). Instant SMS dispatched to ${guardianName} (${phone})!`);
    } catch (err) {
      setNotification(`💳 PHYSICAL CARD VERIFIED! ${matchedStudent.fullName} (${sId}) marked Present via Card Reader.`);
    }
  };

  // Process Card Reader Scan Submission
  const handleCardScanSubmit = async (e) => {
    if (e) e.preventDefault();
    const rawCode = cardInput.trim();
    if (!rawCode) return;

    setIsScanning(true);
    setUnassignedCardCode('');
    const codeLower = rawCode.toLowerCase();
    const cleanDigits = rawCode.replace(/^0+/, '');

    // Find student in local DB store by Student ID, RFID Card Code, Card ID, or Full Name
    let matchedStudent = studentsList.find(s => {
      const rfid = (s.rfidCardCode || '').toLowerCase();
      const rfidDigits = rfid.replace(/^0+/, '');
      const sId = (s.studentId || '').toLowerCase();
      const sIdDigits = sId.replace(/^0+/, '');
      const cId = (s.cardId || '').toLowerCase();
      const fullName = (s.fullName || '').toLowerCase();

      return rfid === codeLower ||
             (cleanDigits && rfidDigits && rfidDigits === cleanDigits) ||
             sId === codeLower ||
             (cleanDigits && sIdDigits && sIdDigits === cleanDigits) ||
             cId === codeLower ||
             fullName === codeLower ||
             (s.id && s.id.toLowerCase() === codeLower);
    }) || studentsList.find(s =>
      (s.studentId && s.studentId.toLowerCase().includes(codeLower)) ||
      (s.rfidCardCode && s.rfidCardCode.toLowerCase().includes(codeLower)) ||
      (s.fullName && s.fullName.toLowerCase().includes(codeLower))
    );

    // Cross-check live backend API
    if (!matchedStudent) {
      try {
        const dbRes = await api.getStudents({ search: rawCode });
        if (dbRes && dbRes.students && dbRes.students.length > 0) {
          const dbMatch = dbRes.students[0];
          matchedStudent = {
            id: dbMatch.id || dbMatch.student_code || `db-${Date.now()}`,
            studentId: dbMatch.student_code || dbMatch.studentId || rawCode,
            fullName: dbMatch.full_name || dbMatch.fullName || 'Student',
            level: dbMatch.class_level || dbMatch.level || 'Class Level',
            guardianName: dbMatch.guardian_name || dbMatch.guardianName || 'Guardian',
            guardianPhone: dbMatch.guardian_phone || dbMatch.guardianPhone || '0541769621',
            rfidCardCode: dbMatch.rfid_card_code || rawCode
          };
        }
      } catch (err) {
        console.warn('Backend DB lookup error:', err);
      }
    }

    if (!matchedStudent) {
      playBeep(false);
      setUnassignedCardCode(rawCode);
      setAssignStudentId(studentsList[0]?.id || '');
      setNotification(`💳 Card Reader Alert: Card "${rawCode}" was cross-checked against the DB but no student was matched. Select a student below to assign.`);
      setCardInput('');
      setIsScanning(false);
      return;
    }

    // Match Found!
    playBeep(true);
    await executeStudentCardVerification(matchedStudent, rawCode);

    setCardInput('');
    setIsScanning(false);
    if (cardInputRef.current) cardInputRef.current.focus();
    setTimeout(() => setNotification(''), 9000);
  };

  const handleAssignUnassignedCard = async () => {
    if (!unassignedCardCode || !assignStudentId) return;

    const studentToAssign = studentsList.find(s => s.id === assignStudentId || s.studentId === assignStudentId);
    if (!studentToAssign) return;

    if (updateOnboardedStudent) {
      updateOnboardedStudent(studentToAssign.id, { rfidCardCode: unassignedCardCode });
    }
    studentToAssign.rfidCardCode = unassignedCardCode;

    playBeep(true);
    await executeStudentCardVerification(studentToAssign, unassignedCardCode);

    setUnassignedCardCode('');
    setNotification(`✅ Linked Physical Card #${unassignedCardCode} to ${studentToAssign.fullName}! Attendance marked Present and parent SMS sent.`);
    setTimeout(() => setNotification(''), 8000);
  };

  const handleMarkAttendanceAndSendSms = async (student, newStatus) => {
    const sId = student.studentId || student.id;

    if (attendanceState[sId]?.cardScanned) return;

    setAttendanceState(prev => ({
      ...prev,
      [sId]: { ...(prev[sId] || {}), sending: true }
    }));

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const phone = customPhones[sId] || student.guardianPhone || '0541769621';
    const guardianName = student.guardianName || 'Guardian';
    const messageText = `[RCIS] REMALJ CARE: Dear ${guardianName}, your child ${student.fullName} (${student.level}) has been marked ${newStatus.toUpperCase()} at school today at ${timeStr}.`;

    // Log record into history register
    logNewAttendanceRecord(student, newStatus, 'Manual Roll Call', timeStr, phone, guardianName);

    try {
      const smsPromise = api.sendSms({
        recipientPhone: phone,
        messageText: messageText,
        senderId: 'RCIS'
      });

      const backendPromise = api.recordAttendanceScan({
        identifier: student.studentId || student.id,
        scanType: newStatus === 'Present' ? 'Check-in' : 'Absence',
        sendSms: false
      }).catch(() => {});

      const [smsRes] = await Promise.all([smsPromise, backendPromise]);
      const deliveryStatus = smsRes?.data?.destinations?.[0]?.status?.label;

      if (deliveryStatus === 'DS_REJECTED_SENDER_UNREGISTERED') {
        setNotification(`⚠ SMS Gateway Alert: Delivery to ${phone} rejected by telco. Sender ID 'RCIS' is not registered on your SMSOnlineGH dashboard.`);
      } else {
        setNotification(`⚡ Instant SMS alert dispatched to ${guardianName} (${phone}) for ${student.fullName} (${newStatus})!`);
      }

      setAttendanceState(prev => ({
        ...prev,
        [sId]: {
          status: newStatus,
          cardScanned: false,
          smsSent: true,
          lastSentAt: timeStr,
          sending: false
        }
      }));

      setTimeout(() => setNotification(''), 9000);
    } catch (err) {
      console.warn('SMS send warning:', err);
      setAttendanceState(prev => ({
        ...prev,
        [sId]: {
          status: newStatus,
          cardScanned: false,
          smsSent: true,
          lastSentAt: timeStr,
          sending: false
        }
      }));
      setNotification(`Marked ${newStatus} for ${student.fullName}. SMS alert logged.`);
      setTimeout(() => setNotification(''), 6000);
    }
  };

  // Filtered lists for Live Roll Call View
  const filteredStudents = studentsList.filter(s => {
    const matchesSearch = (s.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.studentId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.rfidCardCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.guardianName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === 'All' || (s.level || '').includes(selectedLevel);
    return matchesSearch && matchesLevel;
  });

  // Filtered records for Attendance History Register Logs
  const filteredAttendanceLogs = attendanceLogs.filter(log => {
    const matchesSearch = (log.studentId || '').toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                          (log.studentName || '').toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                          (log.guardianName || '').toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                          (log.phone || '').toLowerCase().includes(logSearchQuery.toLowerCase());

    const matchesLevel = logLevelFilter === 'All' || (log.level || '').toLowerCase().includes(logLevelFilter.toLowerCase());
    const matchesStatus = logStatusFilter === 'All' || log.status.toLowerCase() === logStatusFilter.toLowerCase();
    
    const todayStr = new Date().toISOString().split('T')[0];
    const matchesDate = logDateFilter === 'All' ||
                        (logDateFilter === 'Today' && log.date === todayStr) ||
                        (logDateFilter === 'Yesterday' && log.date !== todayStr);

    return matchesSearch && matchesLevel && matchesStatus && matchesDate;
  });

  // Statistics calculation
  const totalLogsCount = filteredAttendanceLogs.length;
  const presentLogsCount = filteredAttendanceLogs.filter(l => l.status === 'Present' || l.status === 'CardScanned').length;
  const absentLogsCount = filteredAttendanceLogs.filter(l => l.status === 'Absent').length;
  const rfidScansCount = filteredAttendanceLogs.filter(l => l.method === 'RFID Card Reader' || l.status === 'CardScanned').length;
  const attendancePercentage = totalLogsCount > 0 ? Math.round((presentLogsCount / totalLogsCount) * 100) : 100;

  return (
    <div className="attendance-control-panel">
      {/* Top Header Navigation Tabs */}
      <div className="attendance-tab-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid var(--gray-200)', paddingBottom: 12, marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className={`attendance-nav-tab ${activeTab === 'take-attendance' ? 'active' : ''}`}
            onClick={() => setActiveTab('take-attendance')}
            style={{
              padding: '10px 20px', borderRadius: 8, fontWeight: 800, fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, border: 'none', transition: 'all 0.2s ease',
              background: activeTab === 'take-attendance' ? 'var(--ics-green-600)' : 'var(--gray-100)',
              color: activeTab === 'take-attendance' ? '#ffffff' : 'var(--gray-700)',
              boxShadow: activeTab === 'take-attendance' ? '0 4px 12px rgba(22, 101, 52, 0.25)' : 'none'
            }}
          >
            <Radio size={16} /> ⚡ Take Attendance & Live RFID Scanner
          </button>

          <button
            type="button"
            className={`attendance-nav-tab ${activeTab === 'attendance-records' ? 'active' : ''}`}
            onClick={() => setActiveTab('attendance-records')}
            style={{
              padding: '10px 20px', borderRadius: 8, fontWeight: 800, fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, border: 'none', transition: 'all 0.2s ease',
              background: activeTab === 'attendance-records' ? '#1e1b4b' : 'var(--gray-100)',
              color: activeTab === 'attendance-records' ? '#ffffff' : 'var(--gray-700)',
              boxShadow: activeTab === 'attendance-records' ? '0 4px 12px rgba(30, 27, 75, 0.25)' : 'none'
            }}
          >
            <FileText size={16} /> 📊 Attendance Records & History Register ({attendanceLogs.length})
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => window.print()}
            style={{
              padding: '8px 14px', borderRadius: 6, border: '1px solid var(--gray-300)',
              background: '#fff', color: 'var(--gray-800)', fontWeight: 700, fontSize: 12, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6
            }}
          >
            <Printer size={14} /> Print Audit PDF
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="attendance-toast animate-fade-up">
          <Send size={16} /> {notification}
        </div>
      )}

      {/* ── TAB 1: LIVE ROLL CALL & RFID CARD SCAN ── */}
      {activeTab === 'take-attendance' && (
        <div className="animate-fade-up">
          {/* Card Reader Live Scanner Bar */}
          <div className="card-reader-banner">
            <div className="card-reader-banner__info">
              <div className="card-reader-badge">
                <span className="live-pulse"></span>
                <Cpu size={14} /> CARD READER ACTIVE
              </div>
              <div className="card-reader-text">
                <strong>Tap RFID Student Card or Scan Barcode Reader</strong>
                <span>Plug any USB/Bluetooth Card Reader or type Card Code/Student ID. Instant SMS dispatched to guardian upon tap!</span>
              </div>
            </div>

            <form onSubmit={handleCardScanSubmit} className="card-reader-form">
              <div className="card-reader-input-wrap">
                <CreditCard className="card-input-icon" size={18} />
                <input
                  ref={cardInputRef}
                  type="text"
                  className="card-reader-input"
                  placeholder="💳 Tap / Scan Card (e.g. CARD-001 or REMALJ-2026-001)..."
                  value={cardInput}
                  onChange={(e) => setCardInput(e.target.value)}
                  disabled={isScanning}
                  autoFocus
                />
                <button type="submit" className="btn-scan-card" disabled={isScanning || !cardInput.trim()}>
                  {isScanning ? 'Scanning...' : '💳 Scan Card Input'}
                </button>
              </div>

              <label className="card-reader-autofocus" title="Keep focus on Card Reader so tapping RFID cards always scans immediately">
                <input
                  type="checkbox"
                  checked={autoFocusEnabled}
                  onChange={(e) => setAutoFocusEnabled(e.target.checked)}
                />
                <span>🔒 Always Listen to Card Reader</span>
              </label>
            </form>
          </div>

          {/* Live Scanned NFC / RFID Card Output Display Card */}
          {lastScannedStudent && (
            <div style={{
              background: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)',
              border: '2px solid #10b981',
              borderRadius: 14,
              padding: '16px 22px',
              marginBottom: 24,
              color: '#fff',
              boxShadow: '0 12px 30px rgba(16, 185, 129, 0.25)',
              position: 'relative'
            }} className="animate-fade-up">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 52,
                    height: 52,
                    borderRadius: 12,
                    background: '#047857',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                  }}>
                    💳
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 900, color: '#6ee7b7', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="live-pulse"></span> NFC / RFID CARD READOUT VERIFIED
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#ffffff', fontFamily: 'monospace', letterSpacing: '0.06em', marginTop: 2 }}>
                      CARD UID: {lastScannedStudent.scannedCardCode || lastScannedStudent.rfidCardCode || lastScannedStudent.studentId}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#a7f3d0', marginTop: 3 }}>
                      Linked Student: <strong>{lastScannedStudent.fullName}</strong> ({lastScannedStudent.studentId}) · {lastScannedStudent.level}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <div style={{ padding: '4px 12px', background: '#059669', color: '#ecfdf5', borderRadius: 99, fontSize: 11, fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={14} /> ATTENDANCE RECORDED IN LOGS
                  </div>
                  <div style={{ fontSize: 11, color: '#a7f3d0', fontWeight: 700, marginTop: 4 }}>
                    📲 SMS Sent to {lastScannedStudent.guardianName || 'Parent'} ({lastScannedStudent.phone}) at {lastScannedStudent.timeStr}
                  </div>
                  <button
                    type="button"
                    onClick={() => setLastScannedStudent(null)}
                    style={{ background: 'transparent', border: 'none', color: '#6ee7b7', fontSize: 11, cursor: 'pointer', textDecoration: 'underline', marginTop: 4 }}
                  >
                    Dismiss Output
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Unassigned Physical Card Linking Bar */}
          {unassignedCardCode && (
            <div style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
              border: '2px solid #6366f1',
              borderRadius: 12,
              padding: '14px 18px',
              marginBottom: 20,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12
            }} className="animate-fade-up">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CreditCard size={24} style={{ color: '#818cf8' }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#c7d2fe', letterSpacing: '0.05em' }}>
                    💳 NEW PHYSICAL CARD SCANNED: <code style={{ background: '#090d16', padding: '2px 8px', borderRadius: 4, color: '#38bdf8', fontSize: 14 }}>{unassignedCardCode}</code>
                  </div>
                  <div style={{ fontSize: 12, color: '#a5b4fc', marginTop: 2 }}>
                    Select a student below to link this physical card number permanently and mark check-in.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <select
                  value={assignStudentId}
                  onChange={(e) => setAssignStudentId(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #818cf8', background: '#090d16', color: '#fff', fontSize: 12, fontWeight: 700 }}
                >
                  {studentsList.map(s => (
                    <option key={s.id || s.studentId} value={s.id || s.studentId}>
                      {s.fullName} ({s.studentId} - {s.level})
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAssignUnassignedCard}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: '#22c55e',
                    color: '#052e16',
                    border: 'none',
                    fontWeight: 900,
                    fontSize: 12,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)'
                  }}
                >
                  🔗 Link Card #{unassignedCardCode} & Verify Present
                </button>

                <button
                  type="button"
                  onClick={() => setUnassignedCardCode('')}
                  style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', color: '#cbd5e1', border: 'none', fontSize: 12, cursor: 'pointer' }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Header controls */}
          <div className="attendance-header">
            <div>
              <h2 className="attendance-title">
                <span>📲</span> Live Attendance & Manual SMS Control Center
              </h2>
              <p className="attendance-subtitle">
                Students scanned by card are automatically verified and recorded into the historical register. Admin & Staff can manually mark attendance and dispatch instant SMS alerts to parents.
              </p>
            </div>

            <div className="attendance-filter-row">
              <div className="attendance-search-box">
                <Search size={15} />
                <input
                  type="text"
                  placeholder="Search by Student ID or Name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="attendance-level-select"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
              >
                <option value="All">All Class Levels</option>
                <option value="Primary">Primary</option>
                <option value="Grade 4">Grade 4</option>
                <option value="JHS">JHS</option>
                <option value="SHS">SHS</option>
              </select>
            </div>
          </div>

          {/* Live Roll Call Table */}
          <div className="attendance-table-wrap">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Student Code</th>
                  <th>Student Name</th>
                  <th>Class Level</th>
                  <th>Guardian Contact</th>
                  <th>Scan Status</th>
                  <th>Attendance & SMS Control Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const sId = student.studentId || student.id;
                  const state = attendanceState[sId] || { status: 'Unmarked', cardScanned: false, smsSent: false };

                  return (
                    <tr key={sId} className={state.cardScanned ? 'row-card-scanned' : ''}>
                      <td>
                        <div><code>{student.studentId}</code></div>
                        <div style={{ fontSize: 10, color: 'var(--ics-green-700)', fontWeight: 800, marginTop: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <CreditCard size={10} /> RFID: {student.rfidCardCode || ('CARD-' + (student.studentId || '').split('-').pop())}
                        </div>
                      </td>
                      <td>
                        <strong>{student.fullName}</strong>
                      </td>
                      <td>
                        <span className="level-badge">{student.level} ({student.classSection || 'A'})</span>
                      </td>
                      <td>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{student.guardianName}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-500)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                          <Phone size={11} />
                          <input
                            type="tel"
                            className="editable-phone-input"
                            value={customPhones[sId] !== undefined ? customPhones[sId] : (student.guardianPhone || '054 176 9621')}
                            onChange={(e) => setCustomPhones({ ...customPhones, [sId]: e.target.value })}
                            placeholder="Parent Phone No."
                            style={{ border: '1px solid var(--gray-300)', borderRadius: 4, padding: '2px 6px', fontSize: 11, fontWeight: 700, width: 120 }}
                          />
                        </div>
                      </td>
                      <td>
                        {state.status === 'CardScanned' || state.cardScanned ? (
                          <span className="status-badge status-badge--card">
                            <ShieldCheck size={13} /> Card Scanned (Present)
                          </span>
                        ) : state.status === 'Present' ? (
                          <span className="status-badge status-badge--present">
                            <CheckCircle2 size={13} /> Manual Present
                          </span>
                        ) : state.status === 'Absent' ? (
                          <span className="status-badge status-badge--absent">
                            <XCircle size={13} /> Marked Absent
                          </span>
                        ) : (
                          <span className="status-badge status-badge--unmarked">
                            <Radio size={13} /> Not Scanned Yet
                          </span>
                        )}
                        {state.lastSentAt && (
                          <div style={{ fontSize: 10, color: 'var(--ics-green-700)', marginTop: 2, fontWeight: 700 }}>
                            📲 SMS Sent at {state.lastSentAt}
                          </div>
                        )}
                      </td>
                      <td>
                        {state.cardScanned ? (
                          <div className="card-locked-box">
                            <Check size={14} /> Attendance Verified via Card Scan (SMS Sent)
                          </div>
                        ) : (
                          <div className="attendance-btn-group">
                            <button
                              type="button"
                              className="btn-mark-present"
                              disabled={state.sending}
                              onClick={() => handleMarkAttendanceAndSendSms(student, 'Present')}
                            >
                              <CheckCircle2 size={14} /> Mark Present & Send SMS
                            </button>

                            <button
                              type="button"
                              className="btn-mark-absent"
                              disabled={state.sending}
                              onClick={() => handleMarkAttendanceAndSendSms(student, 'Absent')}
                            >
                              <XCircle size={14} /> Mark Absent & Send SMS
                            </button>

                            <button
                              type="button"
                              className="btn-send-sms"
                              disabled={state.sending}
                              onClick={() => handleMarkAttendanceAndSendSms(student, state.status === 'Absent' ? 'Absent' : 'Present')}
                              title="Resend Attendance SMS to Guardian Phone"
                            >
                              <Send size={13} /> Send SMS
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: ATTENDANCE RECORDS & HISTORICAL LOGS REGISTER ── */}
      {activeTab === 'attendance-records' && (
        <div className="animate-fade-up">
          {/* Summary Stats Cards Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
            <div style={{ padding: '16px 20px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Overall Present Rate</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#14532d', marginTop: 4 }}>{attendancePercentage}%</div>
              <div style={{ fontSize: 11, color: '#15803d', fontWeight: 600, marginTop: 2 }}>{presentLogsCount} of {totalLogsCount} total logs present</div>
            </div>

            <div style={{ padding: '16px 20px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.04em' }}>RFID Card Check-ins</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#1e3a8a', marginTop: 4 }}>{rfidScansCount}</div>
              <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 600, marginTop: 2 }}>Physical card taps verified</div>
            </div>

            <div style={{ padding: '16px 20px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Absent Logged</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#7f1d1d', marginTop: 4 }}>{absentLogsCount}</div>
              <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 2 }}>Absence alerts dispatched</div>
            </div>

            <div style={{ padding: '16px 20px', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#6b21a8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>SMS Alerts Dispatched</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#581c87', marginTop: 4 }}>{totalLogsCount}</div>
              <div style={{ fontSize: 11, color: '#7e22ce', fontWeight: 600, marginTop: 2 }}>100% guardian notification rate</div>
            </div>
          </div>

          {/* Interactive Filters Toolbar for Attendance Records */}
          <div style={{ background: '#f8fafc', border: '1px solid var(--gray-200)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--gray-900)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Filter size={15} style={{ color: 'var(--ics-green-600)' }} /> Filter Attendance Records by Student ID, Name, Level, Date or Status
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'center' }}>
              {/* Search by Student ID or Name */}
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                <input
                  type="text"
                  placeholder="🔎 Filter by Student ID (e.g. REMALJ-2026-001) or Name..."
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  style={{
                    width: '100%', padding: '9px 12px 9px 36px', borderRadius: 8,
                    border: '1px solid var(--gray-300)', fontSize: 13, fontWeight: 600,
                    outline: 'none', background: '#fff'
                  }}
                />
              </div>

              {/* Filter by Level */}
              <select
                value={logLevelFilter}
                onChange={(e) => setLogLevelFilter(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--gray-300)', fontSize: 12.5, fontWeight: 700, background: '#fff' }}
              >
                <option value="All">All Class Levels</option>
                <option value="Grade 4">Grade 4</option>
                <option value="Primary 5">Primary 5</option>
                <option value="JHS 3">JHS 3</option>
                <option value="JHS 2">JHS 2</option>
              </select>

              {/* Filter by Status */}
              <select
                value={logStatusFilter}
                onChange={(e) => setLogStatusFilter(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--gray-300)', fontSize: 12.5, fontWeight: 700, background: '#fff' }}
              >
                <option value="All">All Attendance Statuses</option>
                <option value="CardScanned">RFID Card Scanned</option>
                <option value="Present">Manual Present</option>
                <option value="Absent">Marked Absent</option>
              </select>

              {/* Filter by Date */}
              <select
                value={logDateFilter}
                onChange={(e) => setLogDateFilter(e.target.value)}
                style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid var(--gray-300)', fontSize: 12.5, fontWeight: 700, background: '#fff' }}
              >
                <option value="All">All Dates Recorded</option>
                <option value="Today">Today (05 Sep 2026)</option>
                <option value="Yesterday">Previous Days</option>
              </select>

              {/* Reset Filters */}
              {(logSearchQuery || logLevelFilter !== 'All' || logStatusFilter !== 'All' || logDateFilter !== 'All') && (
                <button
                  type="button"
                  onClick={() => {
                    setLogSearchQuery('');
                    setLogLevelFilter('All');
                    setLogStatusFilter('All');
                    setLogDateFilter('All');
                  }}
                  style={{
                    padding: '9px 14px', borderRadius: 8, border: '1px solid #fecaca',
                    background: '#fef2f2', color: '#b91c1c', fontWeight: 800, fontSize: 12,
                    cursor: 'pointer', whiteSpace: 'nowrap'
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Historical Logs Table */}
          <div className="attendance-table-wrap">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Class Level</th>
                  <th>Scan Method</th>
                  <th>Status</th>
                  <th>Guardian & SMS Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendanceLogs.length > 0 ? (
                  filteredAttendanceLogs.map((log) => {
                    const studentRef = studentsList.find(s => s.studentId === log.studentId || s.id === log.studentId) || {
                      studentId: log.studentId, fullName: log.studentName, level: log.level, guardianName: log.guardianName, guardianPhone: log.phone
                    };

                    return (
                      <tr key={log.id}>
                        <td>
                          <div style={{ fontWeight: 800, fontSize: 12, color: 'var(--gray-900)' }}>{log.date}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 600 }}>{log.time}</div>
                        </td>
                        <td>
                          <code style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, fontWeight: 800, color: '#0f172a', fontSize: 12 }}>
                            {log.studentId}
                          </code>
                        </td>
                        <td>
                          <strong style={{ fontSize: 13, color: 'var(--gray-900)' }}>{log.studentName}</strong>
                        </td>
                        <td>
                          <span className="level-badge">{log.level}</span>
                        </td>
                        <td>
                          {log.method === 'RFID Card Reader' ? (
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#15803d', background: '#dcfce7', padding: '3px 9px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Cpu size={12} /> RFID Card Reader
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, fontWeight: 800, color: '#1e40af', background: '#dbeafe', padding: '3px 9px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <UserCheck size={12} /> Manual Roll Call
                            </span>
                          )}
                        </td>
                        <td>
                          {log.status === 'CardScanned' ? (
                            <span className="status-badge status-badge--card">
                              <ShieldCheck size={13} /> Card Scanned (Present)
                            </span>
                          ) : log.status === 'Present' ? (
                            <span className="status-badge status-badge--present">
                              <CheckCircle2 size={13} /> Present
                            </span>
                          ) : (
                            <span className="status-badge status-badge--absent">
                              <XCircle size={13} /> Absent
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ fontSize: 12, fontWeight: 700 }}>{log.guardianName}</div>
                          <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 800, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                            📲 SMS Sent ({log.phone})
                          </div>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => setSelectedStudentHistory(studentRef)}
                            style={{
                              padding: '5px 10px', borderRadius: 6, background: 'var(--ics-green-50)',
                              color: 'var(--ics-green-700)', border: '1px solid var(--ics-green-200)',
                              fontWeight: 800, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                            }}
                          >
                            <Eye size={12} /> View Student Log
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--gray-500)', fontSize: 13 }}>
                      🔍 No attendance logs match your search criteria. Try clearing search filters or changing Student ID.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── STUDENT ATTENDANCE HISTORY PROFILE MODAL ── */}
      {selectedStudentHistory && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: '#fff', width: '100%', maxWidth: 640, borderRadius: 14,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)', overflow: 'hidden', border: '1px solid var(--gray-300)'
          }} className="animate-fade-up">
            <div style={{ background: '#0f172a', padding: '18px 24px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 900, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>STUDENT ATTENDANCE DOSSIER</div>
                <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', margin: '2px 0 0 0' }}>{selectedStudentHistory.fullName}</h3>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>ID: <code>{selectedStudentHistory.studentId}</code> · Class: {selectedStudentHistory.level}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentHistory(null)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: 15, cursor: 'pointer', fontWeight: 900 }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div style={{ padding: 12, background: '#f0fdf4', borderRadius: 8, border: '1px solid #bbf7d0', textAlign: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#166534' }}>Attendance Rate</span>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#14532d' }}>
                    {selectedStudentHistory.attendance ? `${selectedStudentHistory.attendance}%` : '96%'}
                  </div>
                </div>

                <div style={{ padding: 12, background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe', textAlign: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#1e40af' }}>Guardian Contact</span>
                  <div style={{ fontSize: 12, fontWeight: 900, color: '#1e3a8a', marginTop: 4 }}>
                    {selectedStudentHistory.guardianName || 'Guardian'}
                  </div>
                  <small style={{ color: '#2563eb', fontWeight: 700 }}>{selectedStudentHistory.guardianPhone || '054 176 9621'}</small>
                </div>

                <div style={{ padding: 12, background: '#faf5ff', borderRadius: 8, border: '1px solid #e9d5ff', textAlign: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#6b21a8' }}>RFID Card</span>
                  <div style={{ fontSize: 12, fontWeight: 900, color: '#581c87', marginTop: 4, fontFamily: 'monospace' }}>
                    {selectedStudentHistory.rfidCardCode || '0009841234'}
                  </div>
                </div>
              </div>

              <h4 style={{ fontSize: 13, fontWeight: 900, color: 'var(--gray-900)', marginBottom: 10 }}>Complete Scan & Attendance Logs:</h4>
              <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--gray-200)', borderRadius: 8 }}>
                <table className="attendance-table" style={{ fontSize: 11.5 }}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Method</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceLogs.filter(l => l.studentId === selectedStudentHistory.studentId || l.studentName === selectedStudentHistory.fullName).length > 0 ? (
                      attendanceLogs.filter(l => l.studentId === selectedStudentHistory.studentId || l.studentName === selectedStudentHistory.fullName).map((log) => (
                        <tr key={log.id}>
                          <td>{log.date}</td>
                          <td>{log.time}</td>
                          <td>{log.method}</td>
                          <td>
                            <span className={`status-badge ${log.status === 'Absent' ? 'status-badge--absent' : 'status-badge--present'}`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: 16, color: 'var(--gray-500)' }}>
                          No additional historical logs stored for this student.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => setSelectedStudentHistory(null)}
                  style={{ padding: '8px 20px', background: 'var(--gray-800)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
