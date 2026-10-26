export function confirmedStudentUpdate(raw, expectedId) {
  const saved = raw?.student || raw?.data?.student || raw?.data || raw;
  if (!saved || String(saved.id || '') !== String(expectedId || '') || !expectedId) {
    throw new Error('The backend did not confirm the updated student identity. Reload the roster before retrying.');
  }
  return saved;
}
