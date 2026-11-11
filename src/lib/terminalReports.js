export function validateTerminalReports(data) {
  if (!data || !Array.isArray(data.reports) || data.reports.some(item =>
    !item || !item.student_id || !Array.isArray(item.rows) || item.rows.some(row=>!row || typeof row !== 'object')
  )) {
    throw new Error('The server did not return saved terminal reports.');
  }
  return data.reports;
}
