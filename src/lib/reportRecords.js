export function mapReportRequest(response) {
  const row = response?.request || response?.data || response;
  if (!row?.id) throw new Error('The server did not return a saved report request. Refresh requests before retrying.');
  return { ...row, child: row.child || row.child_name, studentId: row.student_id || row.studentId,
    fileName: row.file_name || row.fileName, fileUrl: row.file_url || row.fileUrl,
    requestedAt: row.created_at || row.requestedAt, uploadedAt: row.uploaded_at || row.uploadedAt };
}
export async function saveReportRequest({ child, studentId, semester, note, submit }) {
  if (!studentId || !child || child === 'Student') throw new Error('Select a linked child before requesting a report.');
  // The current backend accepts the child name. It must enforce the authenticated parent's links.
  return mapReportRequest(await submit({child, semester, note}));
}
