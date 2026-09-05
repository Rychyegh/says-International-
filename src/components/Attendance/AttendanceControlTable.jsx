import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CheckCircle2, XCircle, Send, Radio, Search, ShieldCheck, Phone, Check, CreditCard, Cpu, Sparkles, Download, Filter, ArrowUpDown } from 'lucide-react';
import { usePortalData } from '../../data/PortalStore';
import { api } from '../../services/api';
import './AttendanceControlTable.css';

export default function AttendanceControlTable() {
  const { onboardedStudents, updateOnboardedStudent, attendanceRecords, updateAttendanceRecord } = usePortalData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [classSearchQuery, setClassSearchQuery] = useState('');

  // Card Reader Input State
  const [cardInput, setCardInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [autoFocusEnabled, setAutoFocusEnabled] = useState(true);
  const [lastScannedStudent, setLastScannedStudent] = useState(null);
  const [unassignedCardCode, setUnassignedCardCode] = useState('');
  const [assignStudentId, setAssignStudentId] = useState('');
  const cardInputRef = useRef(null);
  
  // Track local attendance and SMS state merged with global PortalStore
  const [localAttendanceState, setLocalAttendanceState] = useState({});

  const mergedAttendanceState = useMemo(() => {
    return { ...(attendanceRecords || {}), ...localAttendanceState };
  }, [attendanceRecords, localAttendanceState]);

  const [notification, setNotification] = useState('');

  // Editable phone numbers per student ID
  const [customPhones, setCustomPhones] = useState({
    'REMALJ-2026-001': '054 176 9621',
  });

  // Synthesized Web Audio API sound chime feedback
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

  // Keyboard auto-listener for Card Readers (USB/RFID readers typing fast ending in Enter)
  useEffect(() => {
    if (!autoFocusEnabled) return;
    const handleGlobalKeyDown = (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      // Only capture if user is not currently typing in search or phone input
      if (activeTag !== 'input' && activeTag !== 'textarea' && activeTag !== 'select') {
        if (cardInputRef.current) {
          cardInputRef.current.focus();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [autoFocusEnabled]);

  const studentsList = onboardedStudents && onboardedStudents.length > 0 ? onboardedStudents : [
    { id: 'stu-001', studentId: 'REMALJ-2026-001', rfidCardCode: '0009841234', fullName: 'Benjamin Edwards', level: 'Grade 4', classSection: 'B', guardianName: 'Mrs. Angela Edwards', guardianPhone: '054 176 9621' },
    { id: 'stu-002', studentId: 'REMALJ-2026-002', rfidCardCode: '0014298132', fullName: 'Adwoa Edwards', level: 'Primary 5', classSection: '5A', guardianName: 'Mrs. Angela Edwards', guardianPhone: '054 176 9621' },
    { id: 'stu-003', studentId: 'REMALJ-2026-041', rfidCardCode: '0008431920', fullName: 'Abena Mensah', level: 'JHS 3', classSection: '3A', guardianName: 'Mr. Kofi Mensah', guardianPhone: '054 176 9621' },
    { id: 'stu-004', studentId: 'REMALJ-2026-112', rfidCardCode: '10485721', fullName: 'Kwame Asante', level: 'JHS 3', classSection: '3A', guardianName: 'Mrs. Ama Asante', guardianPhone: '054 176 9621' },
    { id: 'stu-005', studentId: 'REMALJ-2026-088', rfidCardCode: '82930419', fullName: 'Efua Darko', level: 'JHS 2', classSection: '2B', guardianName: 'Mr. Yaw Darko', guardianPhone: '054 176 9621' },
  ];

  // Helper to execute card verification & SMS dispatch for a matched student
  const executeStudentCardVerification = async (matchedStudent, scannedCardCode) => {
    const sId = matchedStudent.studentId || matchedStudent.id;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const phone = customPhones[sId] || matchedStudent.guardianPhone || '0541769621';
    const guardianName = matchedStudent.guardianName || 'Guardian';

    const recordPayload = {
      status: 'CardScanned',
      cardScanned: true,
      smsSent: true,
      lastSentAt: timeStr,
      sending: false
    };

    if (updateAttendanceRecord) {
      updateAttendanceRecord(sId, recordPayload);
    }
    setLocalAttendanceState(prev => ({
      ...prev,
      [sId]: recordPayload
    }));

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
    const cleanDigits = rawCode.replace(/^0+/, ''); // strip leading zeros for flexible matching

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

    // If not found in local state, cross-check live backend database API
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

  // Handle assigning an unassigned physical RFID card code to a selected student
  const handleAssignUnassignedCard = async () => {
    if (!unassignedCardCode || !assignStudentId) return;

    const studentToAssign = studentsList.find(s => s.id === assignStudentId || s.studentId === assignStudentId);
    if (!studentToAssign) return;

    // Save RFID card code to student in PortalStore
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

    // Do not modify if card scan already locked it
    if (mergedAttendanceState[sId]?.cardScanned) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const phone = customPhones[sId] || student.guardianPhone || '0541769621';
    const guardianName = student.guardianName || 'Guardian';

    const recordPayload = {
      status: newStatus,
      cardScanned: false,
      smsSent: true,
      lastSentAt: timeStr,
      sending: false
    };

    if (updateAttendanceRecord) {
      updateAttendanceRecord(sId, recordPayload);
    }
    setLocalAttendanceState(prev => ({
      ...prev,
      [sId]: recordPayload
    }));

    const messageText = `[RCIS] REMALJ CARE: Dear ${guardianName}, your child ${student.fullName} (${student.level}) has been marked ${newStatus.toUpperCase()} at school today at ${timeStr}.`;

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

      setTimeout(() => setNotification(''), 9000);
    } catch (err) {
      console.warn('SMS send warning:', err);
      setNotification(`Marked ${newStatus} for ${student.fullName}. SMS alert logged.`);
      setTimeout(() => setNotification(''), 6000);
    }
  };

  // Filter students based on search query (Name, ID, RFID Card Code, Guardian), selected Level, and Class search
  const filteredStudents = studentsList.filter(s => {
    const q = searchQuery.toLowerCase().trim();
    const cQ = classSearchQuery.toLowerCase().trim();
    const sId = (s.studentId || s.id || '').toLowerCase();
    const rfid = (s.rfidCardCode || '').toLowerCase();
    const name = (s.fullName || '').toLowerCase();
    const guardian = (s.guardianName || '').toLowerCase();
    const phone = (customPhones[s.studentId || s.id] || s.guardianPhone || '').toLowerCase();
    const level = (s.level || '').toLowerCase();
    const section = (s.classSection || '').toLowerCase();

    const matchesSearch = !q ||
      name.includes(q) ||
      sId.includes(q) ||
      rfid.includes(q) ||
      guardian.includes(q) ||
      phone.includes(q);

    const matchesLevel = selectedLevel === 'All' || s.level.includes(selectedLevel);
    const matchesClass = !cQ || level.includes(cQ) || section.includes(cQ);

    return matchesSearch && matchesLevel && matchesClass;
  });

  // Alphabetical Order Sorting (A-Z) by Student Full Name
  const sortedStudents = [...filteredStudents].sort((a, b) => a.fullName.localeCompare(b.fullName));

  // Export Filtered / All Attendance Records to CSV
  const handleDownloadCSV = () => {
    if (sortedStudents.length === 0) {
      alert('No attendance records found matching current filters to download.');
      return;
    }

    const recordsToExport = sortedStudents.map(student => {
      const sId = student.studentId || student.id;
      const state = mergedAttendanceState[sId] || { status: 'Unmarked', cardScanned: false };
      return {
        'Student Code': student.studentId || student.id,
        'Full Name': student.fullName,
        'Class Level': `${student.level} (${student.classSection || 'A'})`,
        'RFID Card Code': student.rfidCardCode || 'N/A',
        'Guardian Name': student.guardianName || 'N/A',
        'Guardian Phone': customPhones[sId] || student.guardianPhone || 'N/A',
        'Scan Status': state.status === 'CardScanned' ? 'Card Scanned (Present)' : state.status || 'Unmarked',
        'Time Recorded': state.lastSentAt || 'N/A',
        'Date': new Date().toISOString().split('T')[0]
      };
    });

    const headers = Object.keys(recordsToExport[0]).join(',');
    const rows = recordsToExport.map(row =>
      Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `attendance_records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="attendance-control-panel">
      {/* Notification Toast */}
      {notification && (
        <div className="attendance-toast animate-fade-up">
          <Send size={16} /> {notification}
        </div>
      )}

      {/* Card Reader Live Scanner Bar */}
      <div className="card-reader-banner animate-fade-up">
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
                  <span className="live-pulse"></span> NFC / RFID CARD PROTECTOR INPUT READOUT
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
                <ShieldCheck size={14} /> ATTENDANCE VERIFIED PRESENT
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
            <span>📲</span> Attendance & Manual SMS Control Center
          </h2>
          <p className="attendance-subtitle">
            Students scanned by card are automatically verified and greyed out. Admin & Staff can manually mark attendance and dispatch instant SMS alerts to parents via SMSOnlineGH.
          </p>
        </div>

        <div className="attendance-filter-row" style={{ gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="attendance-search-box">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search by Name, Student ID, Card UID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="attendance-search-box" style={{ width: 160 }}>
            <Filter size={14} />
            <input
              type="text"
              placeholder="Search Class..."
              value={classSearchQuery}
              onChange={(e) => setClassSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="attendance-level-select"
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
          >
            <option value="All">All Class Levels</option>
            <option value="Creche">Creche / Nursery</option>
            <option value="JHS">JHS (Junior High)</option>
            <option value="Kindergarten">Kindergarten</option>
            <option value="Primary">Primary Grade</option>
            <option value="SHS">SHS (Senior High)</option>
          </select>

          <button
            type="button"
            className="btn-scan-card"
            onClick={handleDownloadCSV}
            style={{
              background: '#047857',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              fontWeight: 800,
              fontSize: 12,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(4, 120, 87, 0.3)'
            }}
            title="Download CSV report of current filtered attendance records"
          >
            <Download size={15} /> Download Attendance Records
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="attendance-table-wrap">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Student Code</th>
              <th>Student Name (A-Z)</th>
              <th>Class Level</th>
              <th>Guardian Contact</th>
              <th>Scan Status</th>
              <th>Attendance & SMS Control Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedStudents.map((student) => {
              const sId = student.studentId || student.id;
              const state = mergedAttendanceState[sId] || { status: 'Unmarked', cardScanned: false, smsSent: false };

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
                      /* Card Scanned -> Button Greyed Out / Disabled */
                      <div className="card-locked-box">
                        <Check size={14} /> Attendance Verified via Card Scan (SMS Sent)
                      </div>
                    ) : (
                      /* Manual Action Buttons */
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
  );
}
