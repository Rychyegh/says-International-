export const attendanceDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Accra', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

export function attendanceRows(response, students = []) {
  const rows = Array.isArray(response) ? response : response?.logs ?? response?.records ?? response?.items ?? response?.data?.logs ?? response?.data?.records ?? response?.data;
  if (!Array.isArray(rows)) throw new Error('Attendance history returned an unsupported response.');
  return rows.map(row => {
    const identity = row.student_id ?? row.studentId ?? row.student?.id;
    const student = students.find(s => [s.id, s.studentUuid, s.studentId].includes(identity)) || row.student || {};
    const stamp = row.scanned_at || row.timestamp || row.created_at;
    const date = row.date || stamp?.slice(0, 10);
    const raw = row.scan_type || row.scanType || row.status || '';
    const status = ({check_in:'Check In', 'check-in':'Check In', check_out:'Check Out', 'check-out':'Check Out', present:'Present', absent:'Absent', late:'Late', excused:'Excused'})[raw.toLowerCase()] || raw;
    if (!row.id || !identity || !date) throw new Error('Attendance history is missing a saved record ID, student or date.');
    return { ...row, date, status, studentId: student.studentId || row.student_code || identity,
      studentName: row.student_name || row.studentName || student.fullName || student.full_name || '',
      level: row.class_level || row.level || student.level || student.classLevel || '',
      time: row.time || (stamp ? new Date(stamp).toLocaleTimeString('en-GB', {timeZone:'Africa/Accra',hour:'2-digit',minute:'2-digit'}) : ''),
      method: row.method || (raw.toLowerCase().includes('check') ? 'RFID Card Reader' : 'Manual Roll Call'),
      guardianName: row.guardian_name || student.guardianName || '', phone: row.guardian_phone || student.guardianPhone || '',
      smsStatus: row.sms_status || row.smsStatus || 'Not confirmed'
    };
  }).sort((a,b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
}
