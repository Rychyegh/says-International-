export function catalogNames(raw) {
  const payload = raw?.data && !Array.isArray(raw.data) ? raw.data : raw;
  const rows = Array.isArray(payload) ? payload
    : [payload?.subjects, payload?.classes, payload?.items, payload?.data, payload?.results]
      .find(Array.isArray) || [];
  return rows.map(record => typeof record === 'string' ? record.trim()
    : String(record?.name || record?.subject_name || record?.class_name || record?.title || '').trim()).filter(Boolean);
}
