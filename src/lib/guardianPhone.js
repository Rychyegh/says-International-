const PLACEHOLDER_GUARDIAN_PHONES = new Set([
  '0541769621',
  '0241112222',
  '0240000000',
  '233241112222',
  '2332411122222',
]);

export function isPlaceholderGuardianPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  const localDigits = digits.startsWith('233') ? `0${digits.slice(3)}` : digits;
  return !digits || PLACEHOLDER_GUARDIAN_PHONES.has(digits) || PLACEHOLDER_GUARDIAN_PHONES.has(localDigits);
}

export function resolveGuardianPhone(...sources) {
  for (const source of sources) {
    if (source == null || source === false) continue;
    if (typeof source !== 'object') {
      const text = String(source || '').trim();
      if (text && !isPlaceholderGuardianPhone(text)) return text;
      continue;
    }
    const candidates = [
      source.custom,
      source.guardianPhone,
      source.guardian_phone,
      source.fatherPhone,
      source.father_phone,
      source.motherPhone,
      source.mother_phone,
      source.phone,
      source.contactPhone,
      source.payerPhone,
    ];
    for (const value of candidates) {
      const text = String(value || '').trim();
      if (text && !isPlaceholderGuardianPhone(text)) return text;
    }
  }
  return '';
}

