export function feeTemplateSnapshot(raw) {
  const record = raw?.data || raw;
  if (!record || !Number.isInteger(record.version) || record.version < 0
    || !record.feeSchedule || typeof record.feeSchedule !== 'object' || Array.isArray(record.feeSchedule)
    || !Array.isArray(record.stationerySchedule)
    || !record.academicYear || !record.academicTerm) {
    throw new Error('The backend did not return a versioned fee-template snapshot. No drafts were replaced.');
  }
  for (const schedule of Object.values(record.feeSchedule)) {
    if (!schedule || !Array.isArray(schedule.baseBill) || !Array.isArray(schedule.optionalBills)) {
      throw new Error('The backend returned an invalid class fee template. No drafts were replaced.');
    }
  }
  return record;
}
