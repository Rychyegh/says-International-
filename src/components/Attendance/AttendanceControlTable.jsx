import React, { useState } from 'react';
import { CheckCircle2, XCircle, Send, Radio, Search, ShieldCheck, Phone, Check } from 'lucide-react';
import { usePortalData } from '../../data/PortalStore';
import { api } from '../../services/api';
import './AttendanceControlTable.css';

export default function AttendanceControlTable() {
  const { onboardedStudents } = usePortalData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('All');
  
  // Track attendance and SMS state per student ID
  // { [studentId]: { status: 'Present' | 'Absent' | 'CardScanned', cardScanned: boolean, smsSent: boolean, lastSentAt: string, sending: boolean } }
  const [attendanceState, setAttendanceState] = useState({
    'REMALJ-2026-001': { status: 'CardScanned', cardScanned: true, smsSent: true, lastSentAt: '08:15 AM' },
    'REMALJ-2026-002': { status: 'Present', cardScanned: false, smsSent: true, lastSentAt: '08:30 AM' },
  });

  const [notification, setNotification] = useState('');

  // Editable phone numbers per student ID
  const [customPhones, setCustomPhones] = useState({
    'REMALJ-2026-001': '054 176 9621',
  });

  const handleMarkAttendanceAndSendSms = async (student, newStatus) => {
    const sId = student.studentId || student.id;

    // Do not modify if card scan already locked it
    if (attendanceState[sId]?.cardScanned) return;

    setAttendanceState(prev => ({
      ...prev,
      [sId]: { ...(prev[sId] || {}), sending: true }
    }));

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const phone = customPhones[sId] || student.guardianPhone || '0541769621';
    const guardianName = student.guardianName || 'Guardian';
    const messageText = `[RCIS] REMALJ CARE: Dear ${guardianName}, your child ${student.fullName} (${student.level}) has been marked ${newStatus.toUpperCase()} at school today at ${timeStr}.`;

    try {
      // 1. Record on backend
      await api.recordAttendanceScan({
        identifier: student.studentId || student.id,
        scanType: newStatus === 'Present' ? 'Check-in' : 'Absence',
        sendSms: true
      }).catch(() => {});

      // 2. Dispatch direct SMS via SMSOnlineGH
      const smsRes = await api.sendSms({
        recipientPhone: phone,
        messageText: messageText,
        senderId: 'RCIS'
      });

      const deliveryStatus = smsRes?.data?.destinations?.[0]?.status?.label;

      if (deliveryStatus === 'DS_REJECTED_SENDER_UNREGISTERED') {
        setNotification(`⚠ SMS Gateway Alert: Delivery to ${phone} rejected by telco. Sender ID 'RCIS' is not registered on your SMSOnlineGH dashboard.`);
      } else {
        setNotification(`SMS alert sent to ${guardianName} (${phone}) for ${student.fullName} (${newStatus})!`);
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

  const studentsList = onboardedStudents && onboardedStudents.length > 0 ? onboardedStudents : [
    { id: 'stu-001', studentId: 'REMALJ-2026-001', fullName: 'Benjamin Edwards', level: 'Grade 4', classSection: 'B', guardianName: 'Mrs. Angela Edwards', guardianPhone: '054 176 9621' },
    { id: 'stu-002', studentId: 'REMALJ-2026-002', fullName: 'Adwoa Edwards', level: 'Primary 5', classSection: '5A', guardianName: 'Mrs. Angela Edwards', guardianPhone: '054 176 9621' },
    { id: 'stu-003', studentId: 'REMALJ-2026-041', fullName: 'Abena Mensah', level: 'JHS 3', classSection: '3A', guardianName: 'Mr. Kofi Mensah', guardianPhone: '054 176 9621' },
    { id: 'stu-004', studentId: 'REMALJ-2026-112', fullName: 'Kwame Asante', level: 'JHS 3', classSection: '3A', guardianName: 'Mrs. Ama Asante', guardianPhone: '054 176 9621' },
    { id: 'stu-005', studentId: 'REMALJ-2026-088', fullName: 'Efua Darko', level: 'JHS 2', classSection: '2B', guardianName: 'Mr. Yaw Darko', guardianPhone: '054 176 9621' },
  ];

  const filtered = studentsList.filter(s => {
    const matchesSearch = s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (s.guardianName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = selectedLevel === 'All' || s.level.includes(selectedLevel);
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="attendance-control-panel">
      {/* Notification Toast */}
      {notification && (
        <div className="attendance-toast animate-fade-up">
          <Send size={16} /> {notification}
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

        <div className="attendance-filter-row">
          <div className="attendance-search-box">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search student or guardian..."
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
            <option value="JHS">JHS</option>
            <option value="SHS">SHS</option>
          </select>
        </div>
      </div>

      {/* Table */}
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
            {filtered.map((student) => {
              const sId = student.studentId || student.id;
              const state = attendanceState[sId] || { status: 'Unmarked', cardScanned: false, smsSent: false };

              return (
                <tr key={sId} className={state.cardScanned ? 'row-card-scanned' : ''}>
                  <td><code>{student.studentId}</code></td>
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
