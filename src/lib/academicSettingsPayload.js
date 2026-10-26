export function academicSettingsPayload(settings, { gradingOnly = false } = {}) {
  const payload = { ...settings };
  for (const field of ['resumptionDate', 'vacationDate']) {
    if (gradingOnly || payload[field] == null || String(payload[field]).trim() === '') delete payload[field];
  }
  return payload;
}

export function academicSettingsVersion(settings = {}) {
  const version = settings.version ?? settings.expectedVersion;
  return Number.isInteger(version) && version >= 0 ? version : null;
}
