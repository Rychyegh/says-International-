export const CLASS_SUBCLASS_MAP = {
  Creche: ['Creche'],
  'Nursery 1': ['Nursery 1A', 'Nursery 1B'],
  'Nursery 2': ['Nursery 2A', 'Nursery 2B'],
  'Kindergarten 1': ['Kindergarten 1A', 'Kindergarten 1B'],
  'Kindergarten 2': ['Kindergarten 2A', 'Kindergarten 2B'],
  'KG 1': ['Kindergarten 1A', 'Kindergarten 1B'],
  'KG 2': ['Kindergarten 2A', 'Kindergarten 2B'],
  'Basic 1': ['Basic 1A', 'Basic 1B'],
  'Basic 2': ['Basic 2A', 'Basic 2B'],
  'Basic 3': ['Basic 3A', 'Basic 3B'],
  'Basic 4': ['Basic 4A', 'Basic 4B'],
  'Basic 5': ['Basic 5A', 'Basic 5B'],
  'Basic 6': ['Basic 6A', 'Basic 6B'],
  'Basic 7': ['Basic 7A', 'Basic 7B'],
  'Basic 8': ['Basic 8A', 'Basic 8B'],
  'Basic 9': ['Basic 9A', 'Basic 9B'],
};

export const CLASS_LEVELS = [
  'Creche',
  'Nursery 1',
  'Nursery 2',
  'KG 1',
  'KG 2',
  'Basic 1',
  'Basic 2',
  'Basic 3',
  'Basic 4',
  'Basic 5',
  'Basic 6',
  'Basic 7',
  'Basic 8',
  'Basic 9',
];

export const ALL_SUB_CLASSES = [...new Set(Object.values(CLASS_SUBCLASS_MAP).flat())];

export function isLegacySectionLabel(value) {
  return /^(section|stream)\s+[a-d]$/i.test(String(value || '').trim())
    || /^(gold|diamond)\s+class$/i.test(String(value || '').trim())
    || /^(sunflower|rose)$/i.test(String(value || '').trim())
    || /^(a|b|c|d)$/i.test(String(value || '').trim())
    || /^(a|b)\s*-\s*(sunflower|rose)$/i.test(String(value || '').trim());
}

export function getMappedSubClasses(selectedClass) {
  if (!selectedClass) return [];
  if (CLASS_SUBCLASS_MAP[selectedClass]) {
    return CLASS_SUBCLASS_MAP[selectedClass];
  }
  const norm = String(selectedClass).toLowerCase().trim();
  if (norm.includes('creche')) return ['Creche'];
  if (norm.includes('nursery 1')) return ['Nursery 1A', 'Nursery 1B'];
  if (norm.includes('nursery 2')) return ['Nursery 2A', 'Nursery 2B'];
  if (norm.includes('kg 1') || norm.includes('kindergarten 1')) return ['Kindergarten 1A', 'Kindergarten 1B'];
  if (norm.includes('kg 2') || norm.includes('kindergarten 2')) return ['Kindergarten 2A', 'Kindergarten 2B'];
  for (let i = 1; i <= 9; i += 1) {
    if (norm.includes(`basic ${i}`) || norm.includes(`class ${i}`) || norm.includes(`jhs ${i}`) || norm.includes(`grade ${i}`)) {
      return [`Basic ${i}A`, `Basic ${i}B`];
    }
  }
  return [`${selectedClass}A`, `${selectedClass}B`];
}

export function formatDetailedClass(level, section) {
  const rawLevel = String(level || '').trim();
  const rawSection = String(section || '').trim();
  if (!rawLevel && !rawSection) return '—';
  if (!rawLevel) return rawSection;
  return normalizeSubClass(rawLevel, rawSection);
}

export function normalizeSubClass(classLevel, subClass) {
  const mapped = getMappedSubClasses(classLevel);
  const raw = String(subClass || '').trim();
  if (mapped.includes(raw)) return raw;
  if (!raw || isLegacySectionLabel(raw)) {
    const letter = String(raw).match(/([ab])\b/i)?.[1];
    if (letter && mapped.length) {
      const candidate = mapped.find((item) => item.toUpperCase().endsWith(letter.toUpperCase()));
      if (candidate) return candidate;
    }
    return mapped[0] || raw;
  }
  const glued = `${classLevel || ''}${raw}`.replace(/\s+/g, ' ').trim();
  const match = mapped.find((item) => item.toLowerCase() === glued.toLowerCase() || item.toLowerCase().endsWith(raw.toLowerCase()));
  return match || mapped[0] || raw;
}
