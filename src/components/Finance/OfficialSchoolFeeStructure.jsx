import React, { useState, useEffect, useMemo } from 'react';
import { Printer, CheckCircle2, DollarSign, BookOpen, Layers, Plus, Trash2, FileText, Send, X, UserCheck, Upload, Camera, User, Bus, Utensils, Award, CreditCard, Sparkles, ChevronRight, GraduationCap, Edit3, Save, Check, Users, CheckSquare, Square, RefreshCw, Search, ArrowRight } from 'lucide-react';
import { SchoolLogoSVG } from '../Onboarding/OfficialApplicationForm';
import { usePortalData, formatClassToBasic, studentsAreSamePerson } from '../../data/PortalStore';
import { getAuthUser } from '../../services/api';
import './OfficialSchoolFeeStructure.css';

export const OFFICIAL_OPTIONAL_PRESETS = [
  { id: 'opt_motivation', details: 'MOTIVATION LEVY', label: 'Motivation', defaultAmount: 150.00, icon: '🔥', account: 'Sundry / Miscellaneous', description: 'Academic motivation & teacher incentive levy' },
  { id: 'opt_bus', details: 'SCHOOL BUS TRANSPORT', label: 'Bus Service', defaultAmount: 600.00, icon: '🚌', account: 'Transport Account', description: 'Daily roundtrip school bus transit route' },
  { id: 'opt_feeding', details: 'DAILY FEEDING & MID-DAY MEAL', label: 'Feeding / Lunch', defaultAmount: 450.00, icon: '🍲', account: 'Feeding Account', description: 'Daily balanced hot lunch & mid-day refreshment' },
  { id: 'opt_stationery', details: 'STATIONERY & BOOKS SET', label: 'Stationery Set', defaultAmount: 500.00, icon: '📚', account: 'Sundry / Miscellaneous', description: 'Official textbooks, exercise books & stationery pack' },
  { id: 'opt_pickup_card', details: 'PICK UP CARD', label: 'Pick Up Card', defaultAmount: 50.00, icon: '🪪', account: 'Sundry / Miscellaneous', description: 'Security authorized parent/guardian pick-up ID card' },
];

export const GRADE_LEVEL_CATEGORIES = [
  {
    id: 'nursery_creche',
    name: 'Nursery / Creche',
    shortName: 'Nursery & Creche',
    icon: '👶',
    subLevels: [
      { id: 'Creche', label: 'Creche', code: 'CR', stationery: 695.00 },
      { id: 'Nursery 1', label: 'Nursery 1', code: 'N1', stationery: 695.00 },
      { id: 'Nursery 2', label: 'Nursery 2', code: 'N2', stationery: 1180.00 },
    ]
  },
  {
    id: 'kindergarten',
    name: 'Kindergarten',
    shortName: 'Kindergarten',
    icon: '🧒',
    subLevels: [
      { id: 'Kindergarten 1', label: 'Kindergarten 1 (KG 1)', code: 'KG1', stationery: 1205.00, ucmas: 295.00 },
      { id: 'Kindergarten 2', label: 'Kindergarten 2 (KG 2)', code: 'KG2', stationery: 1205.00, ucmas: 295.00 },
    ]
  },
  {
    id: 'basic_school',
    name: 'Basic School (Basic 1 - 9)',
    shortName: 'Basic (Basic 1 - 9)',
    icon: '🎓',
    subLevels: [
      { id: 'Basic 1A', label: 'Basic 1A', code: 'B1A', stationery: 1365.00, ucmas: 295.00 },
      { id: 'Basic 1B', label: 'Basic 1B', code: 'B1B', stationery: 1365.00, ucmas: 295.00 },
      { id: 'Basic 2A', label: 'Basic 2A', code: 'B2A', stationery: 1115.00, ucmas: 295.00 },
      { id: 'Basic 2B', label: 'Basic 2B', code: 'B2B', stationery: 1115.00, ucmas: 295.00 },
      { id: 'Basic 3A', label: 'Basic 3A', code: 'B3A', stationery: 1115.00, ucmas: 295.00 },
      { id: 'Basic 3B', label: 'Basic 3B', code: 'B3B', stationery: 1115.00, ucmas: 295.00 },
      { id: 'Basic 4A', label: 'Basic 4A', code: 'B4A', stationery: 1040.00, scienceSet: 190.00, ucmas: 295.00 },
      { id: 'Basic 4B', label: 'Basic 4B', code: 'B4B', stationery: 1040.00, scienceSet: 190.00, ucmas: 295.00 },
      { id: 'Basic 5A', label: 'Basic 5A', code: 'B5A', stationery: 1040.00, scienceSet: 190.00, ucmas: 295.00 },
      { id: 'Basic 5B', label: 'Basic 5B', code: 'B5B', stationery: 1040.00, scienceSet: 190.00, ucmas: 295.00 },
      { id: 'Basic 6A', label: 'Basic 6A', code: 'B6A', stationery: 1040.00, scienceSet: 190.00, ucmas: 295.00 },
      { id: 'Basic 6B', label: 'Basic 6B', code: 'B6B', stationery: 1040.00, scienceSet: 190.00, ucmas: 295.00 },
      { id: 'Basic 7A', label: 'Basic 7A', code: 'B7A', stationery: 2090.00 },
      { id: 'Basic 7B', label: 'Basic 7B', code: 'B7B', stationery: 2090.00 },
      { id: 'Basic 8A', label: 'Basic 8A', code: 'B8A', stationery: 2090.00 },
      { id: 'Basic 8B', label: 'Basic 8B', code: 'B8B', stationery: 2090.00 },
      { id: 'Basic 9A', label: 'Basic 9A', code: 'B9A', stationery: 2090.00 },
      { id: 'Basic 9B', label: 'Basic 9B', code: 'B9B', stationery: 2090.00 },
    ]
  }
];

export const SINGLE_STUDENT_BASIC_SUBLEVELS = [
  { id: 'Basic 1', label: 'Basic 1', code: 'B1', stationery: 1365.00, ucmas: 295.00 },
  { id: 'Basic 2', label: 'Basic 2', code: 'B2', stationery: 1115.00, ucmas: 295.00 },
  { id: 'Basic 3', label: 'Basic 3', code: 'B3', stationery: 1115.00, ucmas: 295.00 },
  { id: 'Basic 4', label: 'Basic 4', code: 'B4', stationery: 1040.00, scienceSet: 190.00, ucmas: 295.00 },
  { id: 'Basic 5', label: 'Basic 5', code: 'B5', stationery: 1040.00, scienceSet: 190.00, ucmas: 295.00 },
  { id: 'Basic 6', label: 'Basic 6', code: 'B6', stationery: 1040.00, scienceSet: 190.00, ucmas: 295.00 },
  { id: 'Basic 7', label: 'Basic 7', code: 'B7', stationery: 2090.00 },
  { id: 'Basic 8', label: 'Basic 8', code: 'B8', stationery: 2090.00 },
  { id: 'Basic 9', label: 'Basic 9', code: 'B9', stationery: 2090.00 },
];

const CLASS_ALIAS = {
  cr: 'creche', creche: 'creche',
  n1: 'nursery1', nursery1: 'nursery1',
  n2: 'nursery2', nursery2: 'nursery2',
  kg1: 'kindergarten1', kindergarten1: 'kindergarten1',
  kg2: 'kindergarten2', kindergarten2: 'kindergarten2',
  grade1: 'basic1', primary1: 'basic1', b1: 'basic1', basic1: 'basic1',
  grade2: 'basic2', primary2: 'basic2', b2: 'basic2', basic2: 'basic2',
  grade3: 'basic3', primary3: 'basic3', b3: 'basic3', basic3: 'basic3',
  grade4: 'basic4', primary4: 'basic4', b4: 'basic4', basic4: 'basic4',
  grade5: 'basic5', primary5: 'basic5', b5: 'basic5', basic5: 'basic5',
  grade6: 'basic6', primary6: 'basic6', b6: 'basic6', basic6: 'basic6',
  grade7: 'basic7', jhs1: 'basic7', b7: 'basic7', basic7: 'basic7',
  grade8: 'basic8', jhs2: 'basic8', b8: 'basic8', basic8: 'basic8',
  grade9: 'basic9', jhs3: 'basic9', b9: 'basic9', basic9: 'basic9',
};

function compactClassToken(value) {
  return String(value || '').toLowerCase().replace(/[().]/g, '').replace(/\s+/g, '').trim();
}

function extractStreamLetter(value) {
  const raw = String(value || '').toLowerCase().trim();
  if (!raw) return '';
  const labelled = raw.match(/(?:section|stream|class)\s*([a-d])\b/);
  if (labelled) return labelled[1];
  const compact = compactClassToken(raw);
  const digitLetter = compact.match(/[1-9]([a-d])$/);
  if (digitLetter) return digitLetter[1];
  if (/^[a-d]$/.test(compact)) return compact;
  const trailing = compact.match(/([a-d])$/);
  if (trailing && !/kindergarten|creche|nursery/.test(compact)) return trailing[1];
  return '';
}

function canonicalClassBase(value) {
  const formatted = formatClassToBasic(value || '');
  let compact = compactClassToken(formatted).replace(/[ab]$/i, '');
  compact = compact.replace(/^kindergarten/, 'kg');
  return CLASS_ALIAS[compact] || compact;
}

function studentMatchesSelectedClass(student, selectedSubLevel, { ignoreStream = false } = {}) {
  if (!student) return false;
  const target = String(selectedSubLevel || '').trim();
  if (!target) return true;

  const levelRaw = student.level || student.classLevel || student.class_level || student.applyingClass || student.currentClass || student.class || '';
  const sectionRaw = student.classSection || student.class_section || student.section || student.subClass || student.sub_class || student.stream || '';
  const combined = `${levelRaw} ${sectionRaw}`.trim();

  const targetBase = canonicalClassBase(target);
  const studentBase = canonicalClassBase(levelRaw) || canonicalClassBase(combined);
  const targetStream = ignoreStream ? '' : extractStreamLetter(target);
  const studentStream = extractStreamLetter(sectionRaw) || extractStreamLetter(levelRaw);

  if (compactClassToken(combined) === compactClassToken(target)) return true;
  if (targetBase && studentBase && targetBase === studentBase) {
    if (!targetStream || ignoreStream) return true;
    if (!studentStream) return true;
    return studentStream === targetStream;
  }
  return false;
}

function studentRecordKey(student) {
  return String(student?.studentId || student?.id || student?.fullName || student?.studentName || '')
    .toLowerCase()
    .trim();
}


const makeBaseBill = (tuition, admission = 1000.00) => [
  { details: 'ADMISSION FEE', amount: admission },
  { details: 'TUITION FEE', amount: tuition },
  { details: 'PTA DUES', amount: 15.00 },
  { details: 'GNAPS DUES', amount: 20.00 },
  { details: 'MAINTENANCE FEE', amount: 30.00 },
  { details: 'FIRST AID LEVI', amount: 50.00 },
  { details: 'TOILETRIES', amount: 60.00 },
  { details: 'STUDENT\'S CARD SERVICE', amount: 125.00 },
];

const makeOptionalBills = (stationeryAmt = 500.00, subLevelName = '') => [
  { id: 'opt_motivation', details: 'MOTIVATION LEVY', label: 'Motivation', amount: 150.00, enabled: true, icon: '🔥', description: 'Academic motivation & teaching incentive' },
  { id: 'opt_bus', details: 'SCHOOL BUS TRANSPORT', label: 'Bus Service', amount: 600.00, enabled: true, icon: '🚌', description: 'Daily roundtrip school bus transit route' },
  { id: 'opt_feeding', details: 'DAILY FEEDING & MID-DAY MEAL', label: 'Feeding / Lunch', amount: 450.00, enabled: true, icon: '🍲', description: 'Daily hot meal & mid-day refreshment' },
  { id: 'opt_stationery', details: 'STATIONERY & BOOKS SET', label: 'Stationery Set', amount: stationeryAmt, enabled: true, icon: '📚', description: `${subLevelName || 'Official'} exercise & stationery pack` },
  { id: 'opt_pickup_card', details: 'PICK UP CARD', label: 'Pick Up Card', amount: 50.00, enabled: true, icon: '🪪', description: 'Authorized parent pick-up card' },
];

const INITIAL_FEE_SCHEDULE = {
  // --- NURSERY / CRECHE SUB-LEVELS ---
  'Creche': {
    levelCategory: 'nursery_creche',
    subLevelName: 'Creche',
    baseBill: makeBaseBill(1200.00),
    optionalBills: makeOptionalBills(695.00, 'Creche'),
    stationery: 695.00,
    isBaby: true,
  },
  'Nursery 1': {
    levelCategory: 'nursery_creche',
    subLevelName: 'Nursery 1',
    baseBill: makeBaseBill(1200.00),
    optionalBills: makeOptionalBills(695.00, 'Nursery 1'),
    stationery: 695.00,
    isBaby: true,
  },
  'Nursery 2': {
    levelCategory: 'nursery_creche',
    subLevelName: 'Nursery 2',
    baseBill: makeBaseBill(1200.00),
    optionalBills: makeOptionalBills(1180.00, 'Nursery 2'),
    stationery: 1180.00,
    isBaby: true,
  },

  // --- KINDERGARTEN SUB-LEVELS ---
  'Kindergarten 1': {
    levelCategory: 'kindergarten',
    subLevelName: 'Kindergarten 1 (KG 1)',
    baseBill: makeBaseBill(1250.00),
    optionalBills: makeOptionalBills(1205.00, 'Kindergarten 1'),
    stationery: 1205.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Kindergarten 2': {
    levelCategory: 'kindergarten',
    subLevelName: 'Kindergarten 2 (KG 2)',
    baseBill: makeBaseBill(1250.00),
    optionalBills: makeOptionalBills(1205.00, 'Kindergarten 2'),
    stationery: 1205.00,
    ucmas: 295.00,
    isBaby: false,
  },

  // --- BASIC SCHOOL SUB-LEVELS (BASIC 1 TO 9 & A/B) ---
  'Basic 1': {
    levelCategory: 'basic_school',
    subLevelName: 'Basic 1',
    baseBill: makeBaseBill(1350.00),
    optionalBills: makeOptionalBills(1365.00, 'Basic 1'),
    stationery: 1365.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Basic 2': {
    levelCategory: 'basic_school',
    subLevelName: 'Basic 2',
    baseBill: makeBaseBill(1350.00),
    optionalBills: makeOptionalBills(1115.00, 'Basic 2'),
    stationery: 1115.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Basic 3': {
    levelCategory: 'basic_school',
    subLevelName: 'Basic 3',
    baseBill: makeBaseBill(1350.00),
    optionalBills: makeOptionalBills(1115.00, 'Basic 3'),
    stationery: 1115.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Basic 4': {
    levelCategory: 'basic_school',
    subLevelName: 'Basic 4',
    baseBill: makeBaseBill(1450.00),
    optionalBills: makeOptionalBills(1040.00, 'Basic 4'),
    stationery: 1040.00,
    scienceSet: 190.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Basic 5': {
    levelCategory: 'basic_school',
    subLevelName: 'Basic 5',
    baseBill: makeBaseBill(1450.00),
    optionalBills: makeOptionalBills(1040.00, 'Basic 5'),
    stationery: 1040.00,
    scienceSet: 190.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Basic 6': {
    levelCategory: 'basic_school',
    subLevelName: 'Basic 6',
    baseBill: makeBaseBill(1450.00),
    optionalBills: makeOptionalBills(1040.00, 'Basic 6'),
    stationery: 1040.00,
    scienceSet: 190.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Basic 7': {
    levelCategory: 'basic_school',
    subLevelName: 'Basic 7',
    baseBill: makeBaseBill(1800.00),
    optionalBills: makeOptionalBills(2090.00, 'Basic 7'),
    stationery: 2090.00,
    isBaby: false,
  },
  'Basic 8': {
    levelCategory: 'basic_school',
    subLevelName: 'Basic 8',
    baseBill: makeBaseBill(1800.00),
    optionalBills: makeOptionalBills(2090.00, 'Basic 8'),
    stationery: 2090.00,
    isBaby: false,
  },
  'Basic 9': {
    levelCategory: 'basic_school',
    subLevelName: 'Basic 9',
    baseBill: makeBaseBill(1800.00),
    optionalBills: makeOptionalBills(2090.00, 'Basic 9'),
    stationery: 2090.00,
    isBaby: false,
  },

  'Basic 1A': {
    levelCategory: 'basic_school',
    subLevelName: 'Basic 1A',
    baseBill: makeBaseBill(1350.00),
    optionalBills: makeOptionalBills(1365.00, 'Basic 1A'),
    stationery: 1365.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Basic 1B': {
    levelCategory: 'basic_school',
    subLevelName: 'Basic 1B',
    baseBill: makeBaseBill(1350.00),
    optionalBills: makeOptionalBills(1365.00, 'Basic 1B'),
    stationery: 1365.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Basic 2A': {
    levelCategory: 'basic_school',
    subLevelName: 'Basic 2A',
    baseBill: makeBaseBill(1350.00),
    optionalBills: makeOptionalBills(1115.00, 'Basic 2A'),
    stationery: 1115.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Basic 2B': {
    levelCategory: 'basic_school',
    subLevelName: 'Basic 2B',
    baseBill: makeBaseBill(1350.00),
    optionalBills: makeOptionalBills(1115.00, 'Basic 2B'),
    stationery: 1115.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Basic 3A': {
    levelCategory: 'basic_school',
    subLevelName: 'Basic 3A',
    baseBill: makeBaseBill(1350.00),
    optionalBills: makeOptionalBills(1115.00, 'Basic 3A'),
    stationery: 1115.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Basic 3B': {
    levelCategory: 'basic_school',
    subLevelName: 'Basic 3B',
    baseBill: makeBaseBill(1350.00),
    optionalBills: makeOptionalBills(1115.00, 'Basic 3B'),
    stationery: 1115.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Basic 4A': {
    levelCategory: 'basic_school',
    subLevelName: 'Basic 4A',
    baseBill: makeBaseBill(1450.00),
    optionalBills: makeOptionalBills(1040.00, 'Basic 4A'),
    stationery: 1040.00,
    scienceSet: 190.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Basic 4B': {
    levelCategory: 'basic_school',
    subLevelName: 'Basic 4B',
    baseBill: makeBaseBill(1450.00),
    optionalBills: makeOptionalBills(1040.00, 'Basic 4B'),
    stationery: 1040.00,
    scienceSet: 190.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Basic 5A': {
    levelCategory: 'basic_school',
    subLevelName: 'Basic 5A',
    baseBill: makeBaseBill(1450.00),
    optionalBills: makeOptionalBills(1040.00, 'Basic 5A'),
    stationery: 1040.00,
    scienceSet: 190.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Basic 5B': {
    levelCategory: 'basic_school',
    subLevelName: 'Basic 5B',
    baseBill: makeBaseBill(1450.00),
    optionalBills: makeOptionalBills(1040.00, 'Basic 5B'),
    stationery: 1040.00,
    scienceSet: 190.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Basic 6A': {
    levelCategory: 'basic_school',
    subLevelName: 'Basic 6A',
    baseBill: makeBaseBill(1450.00),
    optionalBills: makeOptionalBills(1040.00, 'Basic 6A'),
    stationery: 1040.00,
    scienceSet: 190.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Basic 6B': {
    levelCategory: 'basic_school',
    subLevelName: 'Basic 6B',
    baseBill: makeBaseBill(1450.00),
    optionalBills: makeOptionalBills(1040.00, 'Basic 6B'),
    stationery: 1040.00,
    scienceSet: 190.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Basic 7A': {
    levelCategory: 'basic_school',
    subLevelName: 'Basic 7A',
    baseBill: makeBaseBill(1800.00),
    optionalBills: makeOptionalBills(2090.00, 'Basic 7A'),
    stationery: 2090.00,
    isBaby: false,
  },
  'Basic 7B': {
    levelCategory: 'basic_school',
    subLevelName: 'Basic 7B',
    baseBill: makeBaseBill(1800.00),
    optionalBills: makeOptionalBills(2090.00, 'Basic 7B'),
    stationery: 2090.00,
    isBaby: false,
  },
  'Basic 8A': {
    levelCategory: 'basic_school',
    subLevelName: 'Basic 8A',
    baseBill: makeBaseBill(1800.00),
    optionalBills: makeOptionalBills(2090.00, 'Basic 8A'),
    stationery: 2090.00,
    isBaby: false,
  },
  'Basic 8B': {
    levelCategory: 'basic_school',
    subLevelName: 'Basic 8B',
    baseBill: makeBaseBill(1800.00),
    optionalBills: makeOptionalBills(2090.00, 'Basic 8B'),
    stationery: 2090.00,
    isBaby: false,
  },
  'Basic 9A': {
    levelCategory: 'basic_school',
    subLevelName: 'Basic 9A',
    baseBill: makeBaseBill(1800.00),
    optionalBills: makeOptionalBills(2090.00, 'Basic 9A'),
    stationery: 2090.00,
    isBaby: false,
  },
  'Basic 9B': {
    levelCategory: 'basic_school',
    subLevelName: 'Basic 9B',
    baseBill: makeBaseBill(1800.00),
    optionalBills: makeOptionalBills(2090.00, 'Basic 9B'),
    stationery: 2090.00,
    isBaby: false,
  },
  'Grade 1': {
    levelCategory: 'basic_school',
    subLevelName: 'Grade 1 (Basic 1)',
    baseBill: makeBaseBill(1350.00),
    optionalBills: makeOptionalBills(1365.00, 'Grade 1'),
    stationery: 1365.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Grade 2': {
    levelCategory: 'basic_school',
    subLevelName: 'Grade 2 (Basic 2)',
    baseBill: makeBaseBill(1350.00),
    optionalBills: makeOptionalBills(1115.00, 'Grade 2'),
    stationery: 1115.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Grade 3': {
    levelCategory: 'basic_school',
    subLevelName: 'Grade 3 (Basic 3)',
    baseBill: makeBaseBill(1350.00),
    optionalBills: makeOptionalBills(1115.00, 'Grade 3'),
    stationery: 1115.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Grade 4': {
    levelCategory: 'basic_school',
    subLevelName: 'Grade 4 (Basic 4)',
    baseBill: makeBaseBill(1450.00),
    optionalBills: makeOptionalBills(1040.00, 'Grade 4'),
    stationery: 1040.00,
    scienceSet: 190.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Grade 5': {
    levelCategory: 'basic_school',
    subLevelName: 'Grade 5 (Basic 5)',
    baseBill: makeBaseBill(1450.00),
    optionalBills: makeOptionalBills(1040.00, 'Grade 5'),
    stationery: 1040.00,
    scienceSet: 190.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Grade 6': {
    levelCategory: 'basic_school',
    subLevelName: 'Grade 6 (Basic 6)',
    baseBill: makeBaseBill(1450.00),
    optionalBills: makeOptionalBills(1040.00, 'Grade 6'),
    stationery: 1040.00,
    scienceSet: 190.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Grade 7': {
    levelCategory: 'basic_school',
    subLevelName: 'Grade 7 (JHS 1)',
    baseBill: makeBaseBill(1800.00),
    optionalBills: makeOptionalBills(2090.00, 'Grade 7 / JHS 1'),
    stationery: 2090.00,
    isBaby: false,
  },
  'Grade 8': {
    levelCategory: 'basic_school',
    subLevelName: 'Grade 8 (JHS 2)',
    baseBill: makeBaseBill(1800.00),
    optionalBills: makeOptionalBills(2090.00, 'Grade 8 / JHS 2'),
    stationery: 2090.00,
    isBaby: false,
  },
  'Grade 9': {
    levelCategory: 'basic_school',
    subLevelName: 'Grade 9 (JHS 3)',
    baseBill: makeBaseBill(1800.00),
    optionalBills: makeOptionalBills(2090.00, 'Grade 9 / JHS 3'),
    stationery: 2090.00,
    isBaby: false,
  },

  // Compatibility aliases
  'Creche / Nursery 1': {
    levelCategory: 'nursery_creche',
    subLevelName: 'Creche / Nursery 1',
    baseBill: makeBaseBill(1200.00),
    optionalBills: makeOptionalBills(695.00, 'Creche / Nursery 1'),
    stationery: 695.00,
    isBaby: true,
  },
  'Kindergarten 1 & 2': {
    levelCategory: 'kindergarten',
    subLevelName: 'Kindergarten 1 & 2',
    baseBill: makeBaseBill(1250.00),
    optionalBills: makeOptionalBills(1205.00, 'Kindergarten'),
    stationery: 1205.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Basic One': {
    levelCategory: 'basic_school',
    subLevelName: 'Grade 1 (Basic 1)',
    baseBill: makeBaseBill(1350.00),
    optionalBills: makeOptionalBills(1365.00, 'Grade 1'),
    stationery: 1365.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Basic 2 & 3': {
    levelCategory: 'basic_school',
    subLevelName: 'Grade 2 & 3',
    baseBill: makeBaseBill(1350.00),
    optionalBills: makeOptionalBills(1115.00, 'Grade 2 & 3'),
    stationery: 1115.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Upper Primary (Basic 4 - 6)': {
    levelCategory: 'basic_school',
    subLevelName: 'Grade 4 - 6',
    baseBill: makeBaseBill(1450.00),
    optionalBills: makeOptionalBills(1040.00, 'Upper Primary'),
    stationery: 1040.00,
    scienceSet: 190.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'JHS (Junior High School)': {
    levelCategory: 'basic_school',
    subLevelName: 'Grade 7 - 9 (JHS)',
    baseBill: makeBaseBill(1800.00),
    optionalBills: makeOptionalBills(2090.00, 'JHS'),
    stationery: 2090.00,
    isBaby: false,
  },
};

const INITIAL_STATIONERY_SCHEDULE = [
  { classLevel: 'Creche', category: 'nursery_creche', label: 'Creche', amount: 695.00, itemsCount: 8, notes: 'Drawing pads, jumbo crayons, playdough & stationery kit' },
  { classLevel: 'Nursery 1', category: 'nursery_creche', label: 'Nursery 1', amount: 695.00, itemsCount: 10, notes: 'Activity books, pencil packs & beginner learning pack' },
  { classLevel: 'Nursery 2', category: 'nursery_creche', label: 'Nursery 2', amount: 1180.00, itemsCount: 12, notes: 'Early reader workbooks, phonics kit & writing workbooks' },
  { classLevel: 'Kindergarten 1', category: 'kindergarten', label: 'Kindergarten 1 (KG 1)', amount: 1205.00, itemsCount: 14, notes: 'KG 1 workbooks, numeracy, literacy & creative arts set' },
  { classLevel: 'Kindergarten 2', category: 'kindergarten', label: 'Kindergarten 2 (KG 2)', amount: 1205.00, itemsCount: 14, notes: 'KG 2 workbooks, science discovery & phonics set' },
  { classLevel: 'Grade 1', category: 'basic_school', label: 'Grade 1 (Basic 1)', amount: 1365.00, itemsCount: 16, notes: 'Primary 1 core textbooks, exercise books & drawing books' },
  { classLevel: 'Grade 2', category: 'basic_school', label: 'Grade 2 (Basic 2)', amount: 1115.00, itemsCount: 15, notes: 'Primary 2 core curriculum textbooks & 10-pack exercise books' },
  { classLevel: 'Grade 3', category: 'basic_school', label: 'Grade 3 (Basic 3)', amount: 1115.00, itemsCount: 15, notes: 'Primary 3 core curriculum textbooks & 10-pack exercise books' },
  { classLevel: 'Grade 4', category: 'basic_school', label: 'Grade 4 (Basic 4)', amount: 1040.00, itemsCount: 18, notes: 'Upper primary core textbooks & exercise notebooks' },
  { classLevel: 'Grade 5', category: 'basic_school', label: 'Grade 5 (Basic 5)', amount: 1040.00, itemsCount: 18, notes: 'Upper primary core textbooks & exercise notebooks' },
  { classLevel: 'Grade 6', category: 'basic_school', label: 'Grade 6 (Basic 6)', amount: 1040.00, itemsCount: 18, notes: 'Primary 6 preparation textbooks & mock assessment packs' },
  { classLevel: 'Grade 7', category: 'basic_school', label: 'Grade 7 (JHS 1)', amount: 2090.00, itemsCount: 22, notes: 'JHS 1 NaCCA standard textbooks, science lab & maths set' },
  { classLevel: 'Grade 8', category: 'basic_school', label: 'Grade 8 (JHS 2)', amount: 2090.00, itemsCount: 22, notes: 'JHS 2 NaCCA standard textbooks, science lab & past questions' },
  { classLevel: 'Grade 9', category: 'basic_school', label: 'Grade 9 (JHS 3)', amount: 2090.00, itemsCount: 24, notes: 'JHS 3 BECE complete textbook suite, revision packs & past questions' },
];

function money(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function cloneClassSchedule(schedule, key) {
  const baseKey = String(key || '').replace(/\s*[AB]$/i, '');
  const source = (schedule && (schedule[key] || schedule[baseKey] || schedule[`${baseKey}A`]))
    || INITIAL_FEE_SCHEDULE[key]
    || INITIAL_FEE_SCHEDULE[baseKey]
    || { baseBill: [], optionalBills: [] };
  return JSON.parse(JSON.stringify(source));
}

function patchClassSchedule(prev, key, updater) {
  const next = updater(cloneClassSchedule(prev, key));
  return { ...prev, [key]: next };
}

function loadFeeSchedule() {
  let saved = {};
  try {
    const raw = localStorage.getItem('official_fee_schedule');
    saved = raw ? JSON.parse(raw) : {};
  } catch {
    saved = {};
  }
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) saved = {};
  const merged = { ...INITIAL_FEE_SCHEDULE };
  Object.keys(saved).forEach((k) => {
    const src = saved[k] || {};
    const fallback = INITIAL_FEE_SCHEDULE[k] || {};
    merged[k] = {
      ...fallback,
      ...src,
      baseBill: Array.isArray(src.baseBill) ? src.baseBill : (fallback.baseBill || []),
      optionalBills: Array.isArray(src.optionalBills) ? src.optionalBills : (fallback.optionalBills || []),
    };
  });
  Object.keys(INITIAL_FEE_SCHEDULE).forEach((k) => {
    if (saved[k]) return;
    const baseKey = k.replace(/\s*[AB]$/i, '');
    if (baseKey !== k && saved[baseKey]) {
      merged[k] = JSON.parse(JSON.stringify(saved[baseKey]));
    }
  });
  return merged;
}

export default function OfficialSchoolFeeStructure({ onOpenSimsModal, adminRole } = {}) {
  const portalData = usePortalData();
  const onboardedStudents = portalData?.onboardedStudents || [];
  const studentFees = portalData?.studentFees || [];
  const resolvedAdminRole = adminRole || (typeof window !== 'undefined' ? localStorage.getItem('says_admin_role') : '') || '';
  const canCancelPostedBill = resolvedAdminRole === 'head_admin' || resolvedAdminRole === 'sub_admin' || Boolean(onOpenSimsModal);

  const [feeSchedule, setFeeSchedule] = useState(() => loadFeeSchedule());

  useEffect(() => {
    try {
      localStorage.setItem('official_fee_schedule', JSON.stringify(feeSchedule));
    } catch (e) {
      console.error('Failed to save fee schedule to localStorage:', e);
    }
  }, [feeSchedule]);
  const [stationerySchedule, setStationerySchedule] = useState(() => {
    try {
      const saved = localStorage.getItem('master_stationery_schedule');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load stationery schedule from localStorage:', e);
    }
    return INITIAL_STATIONERY_SCHEDULE;
  });

  useEffect(() => {
    try {
      localStorage.setItem('master_stationery_schedule', JSON.stringify(stationerySchedule));
    } catch (e) {
      console.error('Failed to save stationery schedule to localStorage:', e);
    }
  }, [stationerySchedule]);

  const [stationeryFilter, setStationeryFilter] = useState('all'); // 'all' | 'nursery_creche' | 'kindergarten' | 'basic_school'
  const [editingStationeryClass, setEditingStationeryClass] = useState(null);
  const [savedStationeryNotice, setSavedStationeryNotice] = useState('');

  // Two-tiered Class Level Selection State
  const [selectedGradeCategory, setSelectedGradeCategory] = useState('nursery_creche'); // 'nursery_creche' | 'kindergarten' | 'basic_school'
  const [selectedSubLevel, setSelectedSubLevel] = useState('Creche');
  
  const [successMsg, setSuccessMsg] = useState('');

  // Add & Edit Fee Item Modal State
  const [isAddingFeeModal, setIsAddingFeeModal] = useState(false);
  const [newFeeForm, setNewFeeForm] = useState({ details: '', amount: '', isOptional: false });
  const [isEditingFeeModal, setIsEditingFeeModal] = useState(false);
  const [editingFeeTarget, setEditingFeeTarget] = useState(null); // { type: 'compulsory' | 'optional', index: number | null, id: string | null }
  const [editingFeeForm, setEditingFeeForm] = useState({ details: '', amount: '' });

  // Prepare & View Student Bill Modal State
  const [preparingStudentBill, setPreparingStudentBill] = useState(null);
  const [selectedStudentOptionalIds, setSelectedStudentOptionalIds] = useState(['opt_motivation', 'opt_bus', 'opt_feeding', 'opt_stationery', 'opt_pickup_card']);

  // Post Bill Modal & Foremost Success Dialog State
  const [isPostingModalOpen, setIsPostingModalOpen] = useState(false);
  const [postBillSuccessData, setPostBillSuccessData] = useState(null); // Foremost Layer Success Banner/Dialog Box
  const [postTargetScope, setPostTargetScope] = useState('class'); // 'class_level' | 'class' | 'subclass' | 'all' | 'student'
  const [selectedPostingCategory, setSelectedPostingCategory] = useState('basic_school');
  const [selectedPostingClass, setSelectedPostingClass] = useState('Basic 1');
  const [selectedPostingSubClass, setSelectedPostingSubClass] = useState('1A');
  const [postingStudentSearch, setPostingStudentSearch] = useState('');
  const [selectedPostingStudent, setSelectedPostingStudent] = useState(null);
  const [postIncludeOptional, setPostIncludeOptional] = useState(true);

  // Billing Mode State: 'entire_class' | 'single_student' | 'master_schedule'
  const [activeBillingView, setActiveBillingView] = useState('entire_class');

  // Multi-Page Class Bill Printing Modal State
  const [isPrintingClassBillsModal, setIsPrintingClassBillsModal] = useState(false);
  const [printClassStudents, setPrintClassStudents] = useState([]);

  // Excluded student IDs from the class bill (removed from class list)
  const [excludedStudentIds, setExcludedStudentIds] = useState([]);

  // Search filter within class students
  const [classStudentSearch, setClassStudentSearch] = useState('');
  const [showAllClassStudents, setShowAllClassStudents] = useState(true);

  // Helper to ensure Full Name always includes other names across all fee scheduling displays
  const getStudentFullName = (student) => {
    if (!student) return '';
    const first = (student.firstName || '').trim();
    const other = (student.otherNames || student.middleName || student.otherName || '').trim();
    const surname = (student.surname || student.lastName || '').trim();
    if (first || surname || other) {
      return [first, other, surname].filter(Boolean).join(' ');
    }
    if (student.fullName && other && !student.fullName.toLowerCase().includes(other.toLowerCase())) {
      const parts = student.fullName.trim().split(' ');
      if (parts.length > 1) {
        return `${parts[0]} ${other} ${parts.slice(1).join(' ')}`.replace(/\s+/g, ' ').trim();
      }
      return `${student.fullName} ${other}`.trim();
    }
    return student.fullName || student.name || student.studentName || '';
  };

  // Active Category & SubLevels
  const activeCategoryObj = GRADE_LEVEL_CATEGORIES.find(c => c.id === selectedGradeCategory) || GRADE_LEVEL_CATEGORIES[0];
  const activeSubLevels = useMemo(() => {
    if (activeBillingView === 'single_student' && selectedGradeCategory === 'basic_school') {
      return SINGLE_STUDENT_BASIC_SUBLEVELS;
    }
    return activeCategoryObj.subLevels;
  }, [activeBillingView, selectedGradeCategory, activeCategoryObj]);

  // Active Class Data Lookup
  const selectedClassKey = selectedSubLevel || activeSubLevels[0]?.id || 'Creche';
  const baseClassKey = (selectedClassKey || '').replace(/\s*[AB]$/i, '');
  const activeSubLevelDisplay = (activeBillingView === 'single_student' && selectedGradeCategory === 'basic_school')
    ? baseClassKey || 'Basic 1'
    : selectedClassKey;

  const activeClassData = feeSchedule[selectedClassKey] 
    || feeSchedule[baseClassKey] 
    || feeSchedule[`${baseClassKey}A`] 
    || feeSchedule[baseClassKey.replace(/Basic\s*/i, 'Grade ')]
    || INITIAL_FEE_SCHEDULE[selectedClassKey]
    || INITIAL_FEE_SCHEDULE[baseClassKey]
    || feeSchedule['Creche'] 
    || { baseBill: [], optionalBills: [] };

  
  const liveClassStudents = useMemo(() => {
    const fromRoster = (onboardedStudents || []).map((s) => ({ ...s, _source: 'roster' }));
    const fromFees = (studentFees || []).map((f) => ({
      id: f.studentId || f.id,
      studentId: f.studentId || f.id,
      fullName: f.studentName || f.fullName || f.name,
      studentName: f.studentName || f.fullName,
      firstName: f.firstName,
      otherNames: f.otherNames,
      surname: f.surname || f.lastName,
      level: f.classLevel || f.level || f.class_level || f.class,
      classLevel: f.classLevel || f.level,
      classSection: f.classSection || f.section || f.subClass,
      guardianName: f.guardianName || f.guardian,
      photo: f.photo || f.passportPhoto,
      _source: 'fees',
    }));
    const map = new Map();
    [...fromFees, ...fromRoster].forEach((s) => {
      const key = studentRecordKey(s);
      if (!key) return;
      let matchKey = key;
      for (const [existingKey, existing] of map.entries()) {
        if (studentsAreSamePerson(existing, s)) {
          matchKey = existingKey;
          break;
        }
      }
      const prev = map.get(matchKey);
      map.set(matchKey, prev ? { ...prev, ...s } : s);
    });
    return Array.from(map.values());
  }, [onboardedStudents, studentFees]);

  // Live roster for the selected class — same set used for print, bulk post, and the billing table.
  // Basic 4A includes Basic 4 / 4A / 4B so print pages and bulk post never drift by one student.
  const studentsForSelectedClass = useMemo(() => {
    return liveClassStudents
      .filter((student) => studentMatchesSelectedClass(student, selectedSubLevel || selectedClassKey, { ignoreStream: true }))
      .sort((a, b) => getStudentFullName(a).localeCompare(getStudentFullName(b)));
  }, [liveClassStudents, selectedSubLevel, selectedClassKey]);

  const studentsForWholeClassPrint = studentsForSelectedClass;

  // Included & Excluded Students for the selected class
  const includedStudentsForClass = useMemo(() => {
    return (studentsForSelectedClass || []).filter(
      s => !excludedStudentIds.includes(s.id) && !excludedStudentIds.includes(s.studentId)
    );
  }, [studentsForSelectedClass, excludedStudentIds]);

  const includedWholeClassForPrint = useMemo(() => {
    return (studentsForWholeClassPrint || []).filter(
      s => !excludedStudentIds.includes(s.id) && !excludedStudentIds.includes(s.studentId)
    );
  }, [studentsForWholeClassPrint, excludedStudentIds]);

  const openWholeClassPrint = () => {
    setActiveBillingView('entire_class');
    const pages = includedWholeClassForPrint.length > 0 ? includedWholeClassForPrint : includedStudentsForClass;
    setPrintClassStudents(pages);
    setIsPrintingClassBillsModal(true);
  };

  const excludedStudentsForClass = useMemo(() => {
    return (studentsForSelectedClass || []).filter(
      s => excludedStudentIds.includes(s.id) || excludedStudentIds.includes(s.studentId)
    );
  }, [studentsForSelectedClass, excludedStudentIds]);

  const filteredClassStudents = useMemo(() => {
    return (studentsForSelectedClass || []).filter(s => {
      if (!classStudentSearch.trim()) return true;
      const q = classStudentSearch.toLowerCase().trim();
      const name = getStudentFullName(s).toLowerCase();
      const id = (s.studentId || s.id || '').toLowerCase();
      const sec = (s.classSection || s.section || '').toLowerCase();
      return name.includes(q) || id.includes(q) || sec.includes(q);
    });
  }, [studentsForSelectedClass, classStudentSearch]);

  // Single Bill Student options: strictly filtered to selected class
  const singleBillStudents = useMemo(() => {
    const list = [...(studentsForSelectedClass || [])];
    if (preparingStudentBill && !list.some(s => (s.id && s.id === preparingStudentBill.id) || (s.studentId && s.studentId === preparingStudentBill.studentId))) {
      list.unshift(preparingStudentBill);
    }
    return list;
  }, [studentsForSelectedClass, preparingStudentBill]);

  // Sync sub-level format when switching between billing views
  useEffect(() => {
    if (selectedGradeCategory === 'basic_school') {
      if (activeBillingView === 'single_student') {
        if (/Basic\s*[1-9][AB]$/i.test(selectedSubLevel)) {
          setSelectedSubLevel(prev => prev.replace(/\s*[AB]$/i, ''));
        }
      }
    }
  }, [activeBillingView, selectedGradeCategory, selectedSubLevel]);

  const handleRemoveStudentFromClassBill = (studentId) => {
    setExcludedStudentIds(prev => prev.includes(studentId) ? prev : [...prev, studentId]);
    setSuccessMsg('Student removed from class bill list.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleAddStudentBackToClassBill = (studentId) => {
    setExcludedStudentIds(prev => prev.filter(id => id !== studentId));
    setSuccessMsg('Student added back to class bill list.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleIncludeAllClassStudents = () => {
    setExcludedStudentIds([]);
    setSuccessMsg('All enrolled students included in class bill list.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleExcludeAllClassStudents = () => {
    setExcludedStudentIds((studentsForSelectedClass || []).map(s => s.id || s.studentId));
    setSuccessMsg('All students excluded from class bill list.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleBulkPostToClass = async () => {
    const studentsToBill = includedWholeClassForPrint.length > 0 ? includedWholeClassForPrint : includedStudentsForClass;
    if (studentsToBill.length === 0) {
      alert(`There are no students included in the billing list for ${selectedSubLevel}. Please include at least one student.`);
      return;
    }

    const optionalItemsToPost = postIncludeOptional
      ? optionalBillItems.filter(o => o.enabled).map(o => ({ details: `OPTIONAL: ${o.details}`, amount: o.amount, isOptional: true }))
      : [];
    const allItemsToPost = [...baseBillItems, ...optionalItemsToPost];
    const totalToPost = allItemsToPost.reduce((acc, i) => acc + Number(i.amount || 0), 0);

    let persist = { posted: 0, failed: 0, errors: [] };
    if (portalData?.postAcademicBill) {
      persist = await portalData.postAcademicBill({
        targetStudents: studentsToBill,
        classLevel: selectedSubLevel,
        items: allItemsToPost,
        totalAmount: totalToPost,
        term: 'Term 1 · 2026'
      }) || persist;
    }

    setPostBillSuccessData({
      totalAmount: totalToPost,
      compulsoryCount: baseBillItems.length,
      optionalCount: optionalItemsToPost.length,
      scopeLabel: `Class ${selectedSubLevel} (${studentsToBill.length} Students)`,
      affectedCount: studentsToBill.length,
      targetStudentName: '',
      targetClass: selectedSubLevel,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      term: 'Term 1 · 2026',
      databasePosted: Number(persist.posted) || 0,
      databaseFailed: Number(persist.failed) || 0,
      databaseError: persist.errors?.[0] || '',
    });

    if (persist.failed && persist.posted === 0) {
      setSuccessMsg(`Could not save the ${selectedSubLevel} bills to the database: ${persist.errors[0] || 'request failed'}`);
      alert(`Could not save bills to the database.\n\n${persist.errors[0] || 'Sign in with a live Head Admin or Accounts session and try again.'}`);
      setTimeout(() => setSuccessMsg(''), 7000);
      return;
    }
    setSuccessMsg(`⚡ Bulk Posted Academic Bill of GHS ${totalToPost.toFixed(2)} to ${studentsToBill.length} students in ${selectedSubLevel}${persist.posted ? ' and saved to the database' : ''}.`);
    setTimeout(() => setSuccessMsg(''), 7000);
  };

  const handleSinglePostToLedger = async (student) => {
    const studentToUse = student || preparingStudentBill;
    if (!studentToUse) {
      alert('Please select a student to post their individual bill.');
      return;
    }

    const optionalItemsToPost = selectedStudentOptionalIds
      .map(id => optionalBillItems.find(o => o.id === id))
      .filter(Boolean)
      .map(o => ({ details: `OPTIONAL: ${o.details}`, amount: o.amount, isOptional: true }));
    const allItemsToPost = [...baseBillItems, ...optionalItemsToPost];
    const totalToPost = allItemsToPost.reduce((acc, i) => acc + Number(i.amount || 0), 0);

    const sFullName = getStudentFullName(studentToUse);

    let persist = { posted: 0, failed: 0, errors: [] };
    if (portalData?.postAcademicBill) {
      persist = await portalData.postAcademicBill({
        studentId: studentToUse.studentId || studentToUse.id,
        studentName: sFullName,
        targetStudents: [studentToUse],
        classLevel: studentToUse.level || selectedSubLevel,
        items: allItemsToPost,
        totalAmount: totalToPost,
        term: 'Term 1 · 2026'
      }) || persist;
    }

    setPostBillSuccessData({
      totalAmount: totalToPost,
      compulsoryCount: baseBillItems.length,
      optionalCount: optionalItemsToPost.length,
      scopeLabel: sFullName,
      affectedCount: 1,
      targetStudentName: sFullName,
      targetStudentId: studentToUse.studentId || studentToUse.id,
      targetClass: studentToUse.level || selectedSubLevel,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      term: 'Term 1 · 2026',
      databasePosted: Number(persist.posted) || 0,
      databaseFailed: Number(persist.failed) || 0,
      databaseError: persist.errors?.[0] || '',
    });

    if (persist.failed && persist.posted === 0) {
      setSuccessMsg(`Could not save ${sFullName}'s bill to the database: ${persist.errors[0] || 'request failed'}`);
      alert(`Could not save this bill to the database.\n\n${persist.errors[0] || 'Sign in with a live Head Admin or Accounts session and try again.'}`);
      setTimeout(() => setSuccessMsg(''), 7000);
      return;
    }
    setSuccessMsg(`⚡ Single Posted Academic Bill of GHS ${totalToPost.toFixed(2)} to ${sFullName}${persist.posted ? ' and saved to the database' : ''}.`);
    setTimeout(() => setSuccessMsg(''), 7000);
  };

  const baseBillItems = activeClassData.baseBill || [];
  const optionalBillItems = useMemo(() => {
    const raw = activeClassData.optionalBills || [];
    // Match current class in stationerySchedule
    const matchedStationery = stationerySchedule.find(s => {
      if (s.classLevel === selectedSubLevel || s.label === selectedSubLevel) return true;
      const numMatch = (selectedSubLevel || '').match(/(?:Basic|Grade)\s*([1-9])/i);
      const sMatch = (s.classLevel || '').match(/(?:Basic|Grade)\s*([1-9])/i);
      if (numMatch && sMatch && numMatch[1] === sMatch[1]) return true;
      if ((selectedSubLevel || '').toLowerCase().includes('kindergarten 1') && s.classLevel.toLowerCase().includes('kindergarten 1')) return true;
      if ((selectedSubLevel || '').toLowerCase().includes('kindergarten 2') && s.classLevel.toLowerCase().includes('kindergarten 2')) return true;
      if ((selectedSubLevel || '').toLowerCase().includes('creche') && s.classLevel.toLowerCase().includes('creche')) return true;
      if ((selectedSubLevel || '').toLowerCase().includes('nursery 1') && s.classLevel.toLowerCase().includes('nursery 1')) return true;
      if ((selectedSubLevel || '').toLowerCase().includes('nursery 2') && s.classLevel.toLowerCase().includes('nursery 2')) return true;
      return false;
    });

    return raw.map(opt => {
      if (opt.id === 'opt_stationery' && matchedStationery) {
        const countStr = matchedStationery.itemsCount ? ` (${matchedStationery.itemsCount} items)` : '';
        return {
          ...opt,
          amount: typeof matchedStationery.amount === 'number' ? matchedStationery.amount : opt.amount,
          description: matchedStationery.notes ? `${matchedStationery.notes}${countStr}` : opt.description,
          notes: matchedStationery.notes,
          itemsCount: matchedStationery.itemsCount
        };
      }
      return opt;
    });
  }, [activeClassData, selectedSubLevel, stationerySchedule]);

  useEffect(() => {
    if (!preparingStudentBill) return;
    setSelectedStudentOptionalIds((optionalBillItems || []).filter((o) => o.enabled).map((o) => o.id));
  }, [preparingStudentBill?.studentId, preparingStudentBill?.id, selectedClassKey]);

  const totalBase = money(baseBillItems.reduce((acc, item) => acc + money(item.amount), 0));
  const totalOptionalActive = money(optionalBillItems.filter(o => o.enabled).reduce((acc, item) => acc + money(item.amount), 0));
  const classBillPerStudent = money(totalBase + (postIncludeOptional ? totalOptionalActive : 0));

  // Handle Category Change (Auto-selects first sub-level in category)
  const handleCategoryChange = (categoryId) => {
    setSelectedGradeCategory(categoryId);
    if (activeBillingView === 'single_student' && categoryId === 'basic_school') {
      setSelectedSubLevel('Basic 1');
    } else {
      const cat = GRADE_LEVEL_CATEGORIES.find(c => c.id === categoryId);
      if (cat && cat.subLevels.length > 0) {
        setSelectedSubLevel(cat.subLevels[0].id);
      }
    }
    if (preparingStudentBill) {
      setPreparingStudentBill(null);
    }
  };

  // Sync with selected student class level
  const handleSelectStudentForBill = (student) => {
    if (!student) {
      setPreparingStudentBill(null);
      return;
    }
    setPreparingStudentBill(student);
    setActiveBillingView('single_student');

    const formatted = formatClassToBasic(student.level || student.classLevel || selectedSubLevel || 'Basic 1');
    const baseLevel = formatted.replace(/\s*[AB]$/i, '');
    const compact = baseLevel.toLowerCase();

    if (compact.includes('creche')) {
      setSelectedGradeCategory('nursery_creche');
      setSelectedSubLevel('Creche');
    } else if (compact.includes('nursery 2')) {
      setSelectedGradeCategory('nursery_creche');
      setSelectedSubLevel('Nursery 2');
    } else if (compact.includes('nursery')) {
      setSelectedGradeCategory('nursery_creche');
      setSelectedSubLevel('Nursery 1');
    } else if (compact.includes('kindergarten 2') || compact.includes('kg 2')) {
      setSelectedGradeCategory('kindergarten');
      setSelectedSubLevel('Kindergarten 2');
    } else if (compact.includes('kindergarten') || compact.includes('kg')) {
      setSelectedGradeCategory('kindergarten');
      setSelectedSubLevel('Kindergarten 1');
    } else {
      setSelectedGradeCategory('basic_school');
      setSelectedSubLevel(baseLevel || 'Basic 1');
    }
  };

  // Handle Edit Master Stationery Schedule fields (Fee, Items Count, Breakdown Notes)
  const handleUpdateStationeryField = (targetClassLevel, field, value) => {
    // 1. Update stationerySchedule state
    setStationerySchedule((prev) =>
      prev.map((item) => {
        if (item.classLevel === targetClassLevel) {
          if (field === 'amount') {
            const val = parseFloat(value);
            return { ...item, amount: isNaN(val) ? 0 : val };
          }
          if (field === 'itemsCount') {
            const val = parseInt(value, 10);
            return { ...item, itemsCount: isNaN(val) ? 0 : val };
          }
          if (field === 'notes') {
            return { ...item, notes: value };
          }
        }
        return item;
      })
    );

    // 2. Identify all corresponding class keys in feeSchedule
    const matchingKeys = [targetClassLevel];
    const gradeMatch = targetClassLevel.match(/(?:Grade|Basic)\s*([1-9])/i);
    if (gradeMatch) {
      const num = gradeMatch[1];
      matchingKeys.push(`Basic ${num}`, `Basic ${num}A`, `Basic ${num}B`, `Grade ${num}`);
      if (num === '7') matchingKeys.push('Grade 7 (JHS 1)', 'JHS 1');
      if (num === '8') matchingKeys.push('Grade 8 (JHS 2)', 'JHS 2');
      if (num === '9') matchingKeys.push('Grade 9 (JHS 3)', 'JHS 3');
    }
    if (targetClassLevel.toLowerCase().includes('kindergarten 1')) {
      matchingKeys.push('Kindergarten 1', 'Kindergarten 1 (KG 1)', 'KG 1');
    }
    if (targetClassLevel.toLowerCase().includes('kindergarten 2')) {
      matchingKeys.push('Kindergarten 2', 'Kindergarten 2 (KG 2)', 'KG 2');
    }
    if (targetClassLevel.toLowerCase().includes('creche')) {
      matchingKeys.push('Creche', 'Creche / Nursery 1');
    }
    if (targetClassLevel.toLowerCase().includes('nursery 1')) {
      matchingKeys.push('Nursery 1', 'Creche / Nursery 1');
    }
    if (targetClassLevel.toLowerCase().includes('nursery 2')) {
      matchingKeys.push('Nursery 2');
    }

    // 3. Synchronize with feeSchedule for those class keys
    setFeeSchedule((prev) => {
      let updatedPrev = { ...prev };
      matchingKeys.forEach((key) => {
        const classData = updatedPrev[key];
        if (classData) {
          const updatedClassData = { ...classData };
          if (field === 'amount') {
            const val = parseFloat(value);
            updatedClassData.stationery = isNaN(val) ? 0 : val;
          } else if (field === 'itemsCount') {
            updatedClassData.stationeryItemsCount = parseInt(value, 10) || 0;
          } else if (field === 'notes') {
            updatedClassData.stationeryNotes = value;
          }

          // Also update opt_stationery in optionalBills
          if (updatedClassData.optionalBills) {
            updatedClassData.optionalBills = updatedClassData.optionalBills.map((opt) => {
              if (opt.id === 'opt_stationery') {
                const newOpt = { ...opt };
                if (field === 'amount') {
                  const val = parseFloat(value);
                  newOpt.amount = isNaN(val) ? 0 : val;
                } else if (field === 'notes') {
                  newOpt.description = value;
                  newOpt.notes = value;
                } else if (field === 'itemsCount') {
                  newOpt.itemsCount = parseInt(value, 10) || 0;
                }
                return newOpt;
              }
              return opt;
            });
          }

          updatedPrev[key] = updatedClassData;
        }
      });
      return updatedPrev;
    });

    const fieldLabel = field === 'amount' ? 'Fee' : field === 'itemsCount' ? 'Items Count' : 'Package Breakdown';
    setSavedStationeryNotice(`✅ Updated ${fieldLabel} for ${targetClassLevel}`);
    setTimeout(() => setSavedStationeryNotice(''), 3000);
  };

  const handleUpdateStationeryFee = (targetClassLevel, newAmount) => {
    handleUpdateStationeryField(targetClassLevel, 'amount', newAmount);
  };

  // Toggle Optional Bill in Schedule
  const handleToggleOptionalBill = (optId) => {
    setFeeSchedule((prev) => {
      const updatedClassData = { ...prev[selectedClassKey] };
      updatedClassData.optionalBills = (updatedClassData.optionalBills || []).map(opt =>
        opt.id === optId ? { ...opt, enabled: !opt.enabled } : opt
      );
      return {
        ...prev,
        [selectedClassKey]: updatedClassData
      };
    });
  };

  // Update Optional Bill Amount
  const handleUpdateOptionalBillAmount = (optId, newAmount) => {
    const amt = parseFloat(newAmount);
    if (isNaN(amt) || amt < 0) return;
    setFeeSchedule((prev) => {
      const updatedClassData = { ...prev[selectedClassKey] };
      updatedClassData.optionalBills = (updatedClassData.optionalBills || []).map(opt =>
        opt.id === optId ? { ...opt, amount: amt } : opt
      );
      return {
        ...prev,
        [selectedClassKey]: updatedClassData
      };
    });
  };

  // Quick Add Preset Optional Bill
  const handleAddPresetOptionalBill = (preset) => {
    setFeeSchedule((prev) => {
      const updatedClassData = { ...prev[selectedClassKey] };
      const currentOpts = updatedClassData.optionalBills || [];
      const exists = currentOpts.find(o => o.id === preset.id || o.details.toLowerCase() === preset.details.toLowerCase());
      
      if (exists) {
        updatedClassData.optionalBills = currentOpts.map(o => o.id === exists.id ? { ...o, enabled: true } : o);
      } else {
        updatedClassData.optionalBills = [
          ...currentOpts,
          {
            id: preset.id,
            details: preset.details,
            label: preset.label,
            amount: preset.defaultAmount,
            enabled: true,
            icon: preset.icon,
            description: preset.description
          }
        ];
      }
      return {
        ...prev,
        [selectedClassKey]: updatedClassData
      };
    });
    setSuccessMsg(`✅ Added optional bill "${preset.label}" (${preset.details} - GHS ${preset.defaultAmount.toFixed(2)}) to ${selectedSubLevel}.`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Handle Post Academic Bill to Student Ledger & Accounts
  const handlePostBillToLedger = async (targetStudent = null) => {
    let studentToUse = targetStudent;
    let scopeLabel = '';
    let targetStudentsList = [];

    if (postTargetScope === 'student') {
      studentToUse = selectedPostingStudent || preparingStudentBill;
      scopeLabel = studentToUse ? getStudentFullName(studentToUse) : 'Individual Student';
      if (studentToUse) targetStudentsList = [studentToUse];
    } else if (postTargetScope === 'class_level') {
      const catObj = GRADE_LEVEL_CATEGORIES.find(c => c.id === selectedPostingCategory) || activeCategoryObj;
      scopeLabel = `All Students in ${catObj.name}`;
      targetStudentsList = (onboardedStudents || []).filter(s => {
        const sLvl = (s.level || '').toLowerCase().trim();
        const cId = catObj.id;
        if (cId === 'nursery_creche') return sLvl.includes('creche') || sLvl.includes('nursery');
        if (cId === 'kindergarten') return sLvl.includes('kg') || sLvl.includes('kindergarten');
        if (cId === 'basic_school') return sLvl.includes('basic') || sLvl.includes('primary') || sLvl.includes('jhs') || sLvl.includes('grade');
        return true;
      });
    } else if (postTargetScope === 'class') {
      scopeLabel = `All Students in Class ${selectedPostingClass}`;
      targetStudentsList = (onboardedStudents || []).filter(s =>
        (s.level || '').toLowerCase().trim() === selectedPostingClass.toLowerCase().trim()
      );
    } else if (postTargetScope === 'subclass') {
      scopeLabel = `All Students in Sub-Class / Section ${selectedPostingSubClass}`;
      const subQ = selectedPostingSubClass.toLowerCase().trim();
      targetStudentsList = (onboardedStudents || []).filter(s => {
        const sec = (s.classSection || s.section || s.subClass || s.sub_class || s.stream || '').toLowerCase().trim();
        return sec === subQ || sec.includes(subQ) || subQ.includes(sec);
      });
    } else if (postTargetScope === 'all') {
      scopeLabel = 'All Active Students (School-wide)';
      targetStudentsList = onboardedStudents || [];
    }

    // Compute active items
    const optionalItemsToPost = postIncludeOptional
      ? (preparingStudentBill
          ? optionalBillItems.filter(o => selectedStudentOptionalIds.includes(o.id))
          : optionalBillItems.filter(o => o.enabled)
        ).map(o => ({ details: `OPTIONAL: ${o.details}`, amount: o.amount, isOptional: true }))
      : [];

    const allItemsToPost = [...baseBillItems, ...optionalItemsToPost];
    const totalToPost = allItemsToPost.reduce((acc, i) => acc + Number(i.amount || 0), 0);

    let persist = { posted: 0, failed: 0, errors: [] };
    if (portalData?.postAcademicBill) {
      persist = await portalData.postAcademicBill({
        studentId: studentToUse?.studentId || studentToUse?.id || null,
        studentName: studentToUse ? getStudentFullName(studentToUse) : null,
        targetStudents: targetStudentsList,
        classLevel: selectedPostingClass || selectedSubLevel || `${activeCategoryObj.name} · ${selectedSubLevel}`,
        items: allItemsToPost,
        totalAmount: totalToPost,
        term: 'Term 1 · 2026'
      }) || persist;
    }

    const affectedCount = targetStudentsList.length > 0 ? targetStudentsList.length : 1;
    const finalScopeText = scopeLabel || (studentToUse ? getStudentFullName(studentToUse) : 'All Students');

    // Trigger Foremost Layer Success Banner/Dialog Box (Requirement 2)
    setPostBillSuccessData({
      totalAmount: totalToPost,
      compulsoryCount: baseBillItems.length,
      optionalCount: optionalItemsToPost.length,
      scopeLabel: finalScopeText,
      affectedCount,
      targetStudentName: studentToUse ? getStudentFullName(studentToUse) : '',
      targetStudentId: studentToUse?.studentId || studentToUse?.id,
      targetClass: selectedPostingClass || `${activeCategoryObj.name} · ${selectedSubLevel}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      term: 'Term 1 · 2026',
      databasePosted: Number(persist.posted) || 0,
      databaseFailed: Number(persist.failed) || 0,
      databaseError: persist.errors?.[0] || '',
    });

    if (persist.failed && persist.posted === 0) {
      setSuccessMsg(`Could not save bills to the database: ${persist.errors[0] || 'request failed'}`);
      alert(`Could not save bills to the database.\n\n${persist.errors[0] || 'Sign in with a live Head Admin or Accounts session and try again.'}`);
      setIsPostingModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 7000);
      return;
    }
    setSuccessMsg(`⚡ Successfully posted Academic Bill of GHS ${totalToPost.toFixed(2)} (${baseBillItems.length} compulsory + ${optionalItemsToPost.length} optional) to ${finalScopeText} (${affectedCount} student accounts)${persist.posted ? ' and saved to the database' : ''}.`);
    setIsPostingModalOpen(false);
    setPreparingStudentBill(null); // Close child modal so the foremost success dialog box is unobstructed
    setSelectedPostingStudent(null);
    setPostingStudentSearch('');
    setTimeout(() => setSuccessMsg(''), 7000);
  };

  // Handle Inline Update Compulsory Bill Amount
  const handleUpdateCompulsoryBillAmount = (itemIndex, newAmount) => {
    const val = parseFloat(newAmount);
    if (isNaN(val) || val < 0) return;

    setFeeSchedule((prev) => patchClassSchedule(prev, selectedClassKey, (classData) => {
      const newBaseBill = [...(classData.baseBill || [])];
      if (newBaseBill[itemIndex]) {
        newBaseBill[itemIndex] = { ...newBaseBill[itemIndex], amount: val };
      }
      return { ...classData, baseBill: newBaseBill };
    }));
  };

  // Handle Remove Compulsory Fee Component Item
  const handleRemoveFeeItem = (itemIndex) => {
    const itemToRemove = baseBillItems[itemIndex];
    setFeeSchedule((prev) => patchClassSchedule(prev, selectedClassKey, (classData) => ({
      ...classData,
      baseBill: (classData.baseBill || []).filter((_, idx) => idx !== itemIndex),
    })));
    setSuccessMsg(`🗑️ Removed fee component "${itemToRemove?.details || 'item'}" from ${selectedSubLevel} bill schedule.`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleRemoveOptionalFeeItem = (optId) => {
    const itemToRemove = optionalBillItems.find(o => o.id === optId);
    setFeeSchedule((prev) => patchClassSchedule(prev, selectedClassKey, (classData) => ({
      ...classData,
      optionalBills: (classData.optionalBills || []).filter(o => o.id !== optId),
    })));
    if (itemToRemove) {
      setSuccessMsg(`🗑️ Removed optional fee "${itemToRemove.details}" from ${selectedSubLevel} bill schedule.`);
      setTimeout(() => setSuccessMsg(''), 5000);
    }
  };

  // Open Edit Modal for Compulsory Fee Item
  const handleOpenEditCompulsoryModal = (index, item) => {
    setEditingFeeTarget({ type: 'compulsory', index, id: null });
    setEditingFeeForm({ details: item.details, amount: item.amount.toString() });
    setIsEditingFeeModal(true);
  };

  // Open Edit Modal for Optional Fee Item
  const handleOpenEditOptionalModal = (opt) => {
    setEditingFeeTarget({ type: 'optional', index: null, id: opt.id });
    setEditingFeeForm({ details: opt.details, amount: opt.amount.toString() });
    setIsEditingFeeModal(true);
  };

  // Handle Save Edit Fee Component Submit
  const handleSaveEditFeeSubmit = (e) => {
    e.preventDefault();
    if (!editingFeeTarget || !editingFeeForm.details.trim() || !editingFeeForm.amount) return;

    const amountNum = parseFloat(editingFeeForm.amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const updatedDetails = editingFeeForm.details.trim().toUpperCase();

    if (editingFeeTarget.type === 'compulsory') {
      setFeeSchedule((prev) => patchClassSchedule(prev, selectedClassKey, (classData) => {
        const newBaseBill = [...(classData.baseBill || [])];
        if (editingFeeTarget.index !== null && newBaseBill[editingFeeTarget.index]) {
          newBaseBill[editingFeeTarget.index] = {
            ...newBaseBill[editingFeeTarget.index],
            details: updatedDetails,
            amount: amountNum
          };
        }
        return { ...classData, baseBill: newBaseBill };
      }));
      setSuccessMsg(`✏️ Updated compulsory fee "${updatedDetails}" (GHS ${amountNum.toFixed(2)}) for ${selectedSubLevel}.`);
    } else if (editingFeeTarget.type === 'optional') {
      setFeeSchedule((prev) => patchClassSchedule(prev, selectedClassKey, (classData) => ({
        ...classData,
        optionalBills: (classData.optionalBills || []).map((opt) =>
          opt.id === editingFeeTarget.id
            ? { ...opt, details: updatedDetails, label: editingFeeForm.details.trim(), amount: amountNum }
            : opt
        ),
      })));
      setSuccessMsg(`✏️ Updated optional fee "${updatedDetails}" (GHS ${amountNum.toFixed(2)}) for ${selectedSubLevel}.`);
    }

    setIsEditingFeeModal(false);
    setEditingFeeTarget(null);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  // Handle Add New Fee Component Item
  const handleAddFeeSubmit = (e) => {
    e.preventDefault();
    if (!newFeeForm.details.trim() || !newFeeForm.amount) return;

    const amountNum = parseFloat(newFeeForm.amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    if (newFeeForm.isOptional) {
      const newOpt = {
        id: `opt_${Date.now()}`,
        details: newFeeForm.details.trim().toUpperCase(),
        label: newFeeForm.details.trim(),
        amount: amountNum,
        enabled: true,
        icon: '✨',
        description: 'Custom Optional Fee'
      };
      setFeeSchedule((prev) => patchClassSchedule(prev, selectedClassKey, (classData) => ({
        ...classData,
        optionalBills: [...(classData.optionalBills || []), newOpt],
      })));
      setSuccessMsg(`✅ Added new optional fee "${newOpt.details}" (GHS ${newOpt.amount.toFixed(2)}) to ${selectedSubLevel}.`);
    } else {
      const newItem = { details: newFeeForm.details.trim().toUpperCase(), amount: amountNum };
      setFeeSchedule((prev) => patchClassSchedule(prev, selectedClassKey, (classData) => ({
        ...classData,
        baseBill: [...(classData.baseBill || []), newItem],
      })));
      setSuccessMsg(`✅ Added new compulsory fee "${newItem.details}" (GHS ${newItem.amount.toFixed(2)}) to ${selectedSubLevel}.`);
    }

    setNewFeeForm({ details: '', amount: '', isOptional: false });
    setIsAddingFeeModal(false);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  // Prepare Printable CSV Export for Student Bill
  const handleExportStudentBillCSV = (student) => {
    const studentOptionalItems = optionalBillItems.filter(o => selectedStudentOptionalIds.includes(o.id));
    const optionalTotal = studentOptionalItems.reduce((acc, o) => acc + money(o.amount), 0);
    const grandTotal = money(totalBase + optionalTotal);

    const feeAccount = studentFees.find(f => f.studentId === student.studentId) || { billedAmount: grandTotal, paidAmount: grandTotal, balance: 0, status: 'Paid' };
    
    let csv = `REMALJ CAREWELL INSPIRATIONAL SCHOOL - OFFICIAL STUDENT BILL & STATEMENT\n`;
    csv += `Student Name,${getStudentFullName(student)}\n`;
    csv += `Student ID,${student.studentId}\n`;
    csv += `Class Level,${activeCategoryObj.name} - ${selectedSubLevel}\n`;
    csv += `Guardian Name,${student.guardianName}\n`;
    csv += `Billing Term,Term 1 · 2026 Academic Year\n\n`;
    csv += `Section 1: Compulsory Fee Components,Amount (GHS)\n`;
    baseBillItems.forEach(item => {
      csv += `"${item.details}",${item.amount.toFixed(2)}\n`;
    });
    csv += `"COMPULSORY BASE BILL SUBTOTAL",${totalBase.toFixed(2)}\n\n`;

    csv += `Section 2: Optional Fee Components (Motivation, Bus, Feeding, Stationery, Pick Up Card),Amount (GHS)\n`;
    studentOptionalItems.forEach(item => {
      csv += `"[OPTIONAL] ${item.details} (${item.label})",${item.amount.toFixed(2)}\n`;
    });
    csv += `"OPTIONAL BILLS SUBTOTAL",${optionalTotal.toFixed(2)}\n\n`;

    csv += `"GRAND TOTAL BILL PAYABLE",${grandTotal.toFixed(2)}\n\n`;
    csv += `Financial Summary:\n`;
    csv += `Total Billed,GHS ${feeAccount.billedAmount.toFixed(2)}\n`;
    csv += `Amount Paid,GHS ${feeAccount.paidAmount.toFixed(2)}\n`;
    csv += `Balance Outstanding,GHS ${feeAccount.balance.toFixed(2)}\n`;
    csv += `Status,${feeAccount.status}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Official_Bill_${getStudentFullName(student).replace(/\s+/g, '_')}_${student.studentId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStudentPhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !preparingStudentBill) return;

    const reader = new FileReader();
    reader.onload = () => {
      const photoDataUrl = reader.result;
      setPreparingStudentBill((prev) => prev ? { ...prev, photo: photoDataUrl, passportPhoto: photoDataUrl } : null);
      if (portalData?.updateOnboardedStudent) {
        portalData.updateOnboardedStudent(preparingStudentBill.id, { photo: photoDataUrl, passportPhoto: photoDataUrl });
      }
      setSuccessMsg(`📷 Passport photo uploaded and saved for ${getStudentFullName(preparingStudentBill)}!`);
      setTimeout(() => setSuccessMsg(''), 5000);
    };
    reader.readAsDataURL(file);
  };

  // Filtered Stationery Schedule items
  const filteredStationeryList = stationeryFilter === 'all'
    ? stationerySchedule
    : stationerySchedule.filter(s => s.category === stationeryFilter);

  // Calculate active student bill totals
  const studentSelectedOpts = preparingStudentBill
    ? optionalBillItems.filter(o => selectedStudentOptionalIds.includes(o.id))
    : [];
  const studentOptTotal = money(studentSelectedOpts.reduce((acc, o) => acc + money(o.amount), 0));
  const studentGrandTotal = money(totalBase + studentOptTotal);
  const printPages = printClassStudents.length > 0 ? printClassStudents : includedWholeClassForPrint;

  const handlePrintIndividualBill = () => {
    document.body.classList.add('print-individual-bill');
    const cleanup = () => {
      document.body.classList.remove('print-individual-bill');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    window.print();
    setTimeout(cleanup, 1500);
  };

  const handleCancelPostedBill = (student) => {
    const target = student || preparingStudentBill;
    if (!target) {
      alert('Select a student whose posted bill you want to cancel.');
      return;
    }
    const name = getStudentFullName(target);
    if (!window.confirm(`Cancel the posted academic bill for ${name}? This zeros the billed amount against payments already received.`)) {
      return;
    }
    if (portalData?.adjustStudentBill) {
      portalData.adjustStudentBill({
        studentId: target.studentId || target.id,
        studentName: name,
        classLevel: target.level || selectedSubLevel,
        adjustmentType: 'CANCEL',
        amount: 0,
        reason: `Posted bill cancelled by ${resolvedAdminRole || 'administrator'}`,
        postedBy: getAuthUser()?.fullName || getAuthUser()?.name || 'Administrator',
      });
    }
    setSuccessMsg(`Posted bill cancelled for ${name}.`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  return (
    <div className="fee-structure-container">
      {/* Toast Notification Banner */}
      {successMsg && (
        <div style={{
          background: '#edf8f0', border: '1px solid #86efac', color: '#166534',
          padding: '12px 18px', borderRadius: 8, marginBottom: 16, fontWeight: 800,
          fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 4px 12px rgba(22,101,52,0.12)'
        }} className="no-print">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} style={{ background: 'none', border: 'none', color: '#166534', fontWeight: 900, cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="fee-header-card no-print">
        <div className="fee-header-brand">
          <img src="/remalj-carewell-logo.jpg" alt="REMALJ Carewell Logo" style={{ height: 68, width: 'auto', borderRadius: 8, border: '2px solid #0284c7', boxShadow: '0 4px 10px rgba(2,132,199,0.2)' }} />
          <div>
            <h1 className="fee-header-title">REMALJ CAREWELL INSPIRATIONAL SCHOOL</h1>
            <p className="fee-header-sub">P. O. BOX 139, BOGOSO • Email: info@remaljschools.com • Phone: 024 111 2222</p>
            <div className="fee-header-badge">OFFICIAL SCHOOL FEES & BILL SCHEDULE (ADMIN & ACCOUNTS CONTROL)</div>
          </div>
        </div>

        <div className="fee-header-actions no-print" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            className="fee-btn"
            style={{ background: '#0284c7', color: '#fff', fontWeight: 800 }}
            onClick={openWholeClassPrint}
          >
            <Printer size={15} /> 🖨️ Print Whole Class Bills
          </button>

          <button
            className="fee-btn"
            style={{ background: '#16a34a', color: '#fff', fontWeight: 800 }}
            onClick={handleBulkPostToClass}
          >
            <FileText size={15} /> ⚡ Bulk Post to Class
          </button>

          <button
            className="fee-btn"
            style={{ background: '#581c87', color: '#fff' }}
            onClick={() => setIsAddingFeeModal(true)}
          >
            <Plus size={15} /> Add Fee Item
          </button>

          <button
            className="fee-btn"
            style={{ background: '#0f3a4b', color: '#fff', fontWeight: 700 }}
            onClick={() => setIsPostingModalOpen(true)}
          >
            <Send size={14} /> Advanced Post Dialog
          </button>
        </div>
      </div>

      {/* ── TWO-TIERED CLASS & GRADE LEVEL HIERARCHY SELECTOR BAR ── */}
      <div className="fee-selector-bar no-print" style={{
        background: '#ffffff',
        border: '1.5px solid #0284c7',
        borderRadius: 12,
        padding: '16px 20px',
        boxShadow: '0 4px 15px rgba(2,132,199,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14
      }}>
        {/* Tier 1: Primary Grade / Department Level Selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 900, color: '#0f3a4b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6, letterSpacing: '0.03em' }}>
              <Layers size={18} color="#0284c7" /> 1. Select Grade / Class Level:
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {GRADE_LEVEL_CATEGORIES.map((cat) => {
                const isActive = selectedGradeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryChange(cat.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: isActive ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      background: isActive ? '#0284c7' : '#f8fafc',
                      color: isActive ? '#ffffff' : '#1e293b',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: isActive ? '0 4px 12px rgba(2,132,199,0.25)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: 15 }}>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tier 2: Sub-Level Breakdown Selector */}
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: 8,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0369a1', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            <ChevronRight size={16} /> 2. Sub-Level ({activeCategoryObj.shortName}):
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
            {activeSubLevels.map((sub) => {
              const isSubActive = selectedSubLevel === sub.id || (activeBillingView === 'single_student' && selectedSubLevel.replace(/\s*[AB]$/i, '') === sub.id);
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => {
                    setSelectedSubLevel(sub.id);
                    if (activeBillingView === 'single_student' && preparingStudentBill) {
                      const sLevel = (preparingStudentBill.level || preparingStudentBill.classLevel || '').toLowerCase().replace(/\s+/g, '');
                      const targetClean = sub.id.toLowerCase().replace(/\s+/g, '');
                      if (!sLevel.includes(targetClean)) {
                        setPreparingStudentBill(null);
                      }
                    }
                  }}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: isSubActive ? '1.5px solid #0369a1' : '1px solid #cbd5e1',
                    background: isSubActive ? '#0369a1' : '#ffffff',
                    color: isSubActive ? '#ffffff' : '#334155',
                    fontSize: 12,
                    fontWeight: isSubActive ? 900 : 700,
                    cursor: 'pointer',
                    boxShadow: isSubActive ? '0 2px 6px rgba(3,105,161,0.2)' : 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: 12, fontWeight: 800, color: '#0369a1', background: '#ffffff', padding: '4px 10px', borderRadius: 6, border: '1px solid #bae6fd' }}>
            Active: <strong>{activeSubLevelDisplay}</strong>
          </div>
        </div>
      </div>

      {/* ── BILLING MODE SWITCHER (ENTIRE CLASS VS SINGLE STUDENT VS MASTER RATES) ── */}
      <div className="no-print" style={{
        display: 'flex',
        gap: 12,
        marginTop: 6,
        marginBottom: 10,
        flexWrap: 'wrap'
      }}>
        <button
          type="button"
          onClick={() => {
            setActiveBillingView('entire_class');
            if (selectedGradeCategory === 'basic_school' && /^Basic\s*[1-9]$/i.test(selectedSubLevel)) {
              setSelectedSubLevel(prev => `${prev}A`);
            }
          }}
          style={{
            flex: '1 1 240px',
            padding: '12px 18px',
            borderRadius: 10,
            border: activeBillingView === 'entire_class' ? '2.5px solid #0284c7' : '1px solid #cbd5e1',
            background: activeBillingView === 'entire_class' ? '#e0f2fe' : '#ffffff',
            color: activeBillingView === 'entire_class' ? '#0369a1' : '#334155',
            fontWeight: 900,
            fontSize: 13.5,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: activeBillingView === 'entire_class' ? '0 4px 12px rgba(2,132,199,0.2)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Users size={18} />
          <span>📚 Entire Class Bill ({studentsForSelectedClass.length} in {selectedSubLevel})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveBillingView('single_student');
            if (selectedGradeCategory === 'basic_school' && /Basic\s*[1-9][AB]$/i.test(selectedSubLevel)) {
              setSelectedSubLevel(prev => prev.replace(/\s*[AB]$/i, ''));
            }
          }}
          style={{
            flex: '1 1 240px',
            padding: '12px 18px',
            borderRadius: 10,
            border: activeBillingView === 'single_student' ? '2.5px solid #16a34a' : '1px solid #cbd5e1',
            background: activeBillingView === 'single_student' ? '#dcfce7' : '#ffffff',
            color: activeBillingView === 'single_student' ? '#15803d' : '#334155',
            fontWeight: 900,
            fontSize: 13.5,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            boxShadow: activeBillingView === 'single_student' ? '0 4px 12px rgba(22,163,74,0.2)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <User size={18} />
          <span>👤 Single Student Bill ({preparingStudentBill ? getStudentFullName(preparingStudentBill) : 'Select Candidate'})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveBillingView('master_schedule')}
          style={{
            padding: '12px 18px',
            borderRadius: 10,
            border: activeBillingView === 'master_schedule' ? '2.5px solid #581c87' : '1px solid #cbd5e1',
            background: activeBillingView === 'master_schedule' ? '#f3e8ff' : '#ffffff',
            color: activeBillingView === 'master_schedule' ? '#581c87' : '#334155',
            fontWeight: 800,
            fontSize: 13.5,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: activeBillingView === 'master_schedule' ? '0 4px 12px rgba(88,28,135,0.2)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <BookOpen size={18} />
          <span>Rates & Schedule</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── SECTION A: ENTIRE CLASS BILL (BULK POST & CLASS PRINT) ─────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeBillingView === 'entire_class' && (
        <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Class Billing Overview & Bulk Actions Banner */}
          <div style={{
            background: '#ffffff',
            border: '2px solid #0284c7',
            borderRadius: 12,
            padding: '18px 22px',
            boxShadow: '0 4px 14px rgba(2,132,199,0.08)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f3a4b' }}>
                    Entire Class Bill: {selectedSubLevel}
                  </h2>
                  <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 10px', borderRadius: 12, fontWeight: 800, fontSize: 12 }}>
                    Term 1 · 2025/2026
                  </span>
                </div>
                <p style={{ margin: '4px 0 0 0', fontSize: 12.5, color: '#64748b' }}>
                  Manage the billing roster for this class, exclude or include students, bulk post directly to student accounts, or print multi-page bills addressed to each student.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="no-print" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={openWholeClassPrint}
                  disabled={includedWholeClassForPrint.length === 0 && includedStudentsForClass.length === 0}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 8,
                    border: 'none',
                    background: (includedWholeClassForPrint.length > 0 || includedStudentsForClass.length > 0) ? '#0284c7' : '#94a3b8',
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: 13,
                    cursor: (includedWholeClassForPrint.length > 0 || includedStudentsForClass.length > 0) ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 12px rgba(2,132,199,0.25)'
                  }}
                >
                  <Printer size={16} /> 🖨️ Print Whole Class Bills ({includedWholeClassForPrint.length} Pages)
                </button>

                <button
                  type="button"
                  onClick={handleBulkPostToClass}
                  disabled={includedWholeClassForPrint.length === 0}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 8,
                    border: 'none',
                    background: includedWholeClassForPrint.length > 0 ? '#16a34a' : '#94a3b8',
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: 13,
                    cursor: includedWholeClassForPrint.length > 0 ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 12px rgba(22,163,74,0.25)'
                  }}
                >
                  <FileText size={16} /> ⚡ Bulk Post Bill to Class ({includedWholeClassForPrint.length} Students)
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 12,
              padding: '14px 16px',
              background: '#f8fafc',
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              marginBottom: 14
            }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total in Class</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginTop: 2 }}>
                  {studentsForSelectedClass.length} <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>enrolled</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>Selected for Billing</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#166534', marginTop: 2 }}>
                  {includedStudentsForClass.length} <span style={{ fontSize: 12, fontWeight: 600, color: '#15803d' }}>students</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>Excluded / Exempt</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#b45309', marginTop: 2 }}>
                  {excludedStudentsForClass.length} <span style={{ fontSize: 12, fontWeight: 600, color: '#b45309' }}>students</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#0369a1', textTransform: 'uppercase' }}>Bill Per Student</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#0369a1', marginTop: 2 }}>
                  GHS {classBillPerStudent.toFixed(2)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#581c87', textTransform: 'uppercase' }}>Projected Class Total</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#581c87', marginTop: 2 }}>
                  GHS {(classBillPerStudent * includedStudentsForClass.length).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            {/* Optional Bills Inclusion Checkbox */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 10,
              padding: '8px 12px',
              background: '#f0f9ff',
              borderRadius: 8,
              border: '1px solid #bae6fd'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 12.5, color: '#0369a1', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={postIncludeOptional}
                  onChange={(e) => setPostIncludeOptional(e.target.checked)}
                />
                <span>Include Active Optional Bills (Motivation, Bus, Feeding, Stationery, Pick Up Card) in Class Bill</span>
              </label>

              <span style={{ fontSize: 12, fontWeight: 800, color: '#0284c7' }}>
                Optional Subtotal: GHS {totalOptionalActive.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Class Student Roster & Billing List */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: 12,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <div style={{
              padding: '14px 18px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Users size={18} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#0f3a4b' }}>
                  Students in {selectedSubLevel} ({studentsForSelectedClass.length})
                </h3>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#166534', background: '#dcfce7', padding: '2px 8px', borderRadius: 10 }}>
                  {includedStudentsForClass.length} Included
                </span>
                {excludedStudentsForClass.length > 0 && (
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#b45309', background: '#fef3c7', padding: '2px 8px', borderRadius: 10 }}>
                    {excludedStudentsForClass.length} Excluded
                  </span>
                )}
              </div>

              {/* Roster Quick Actions & Search */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder={`Search ${selectedSubLevel} students...`}
                    value={classStudentSearch}
                    onChange={(e) => setClassStudentSearch(e.target.value)}
                    style={{ padding: '5px 8px 5px 28px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12, outline: 'none', width: 180 }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleIncludeAllClassStudents}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #86efac', background: '#f0fdf4', color: '#166534', fontWeight: 800, fontSize: 11.5, cursor: 'pointer' }}
                >
                  ✓ Include All ({studentsForSelectedClass.length})
                </button>

                <button
                  type="button"
                  onClick={handleExcludeAllClassStudents}
                  style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#ffffff', color: '#64748b', fontWeight: 800, fontSize: 11.5, cursor: 'pointer' }}
                >
                  ✕ Exclude All
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '10px 14px', width: 44, textAlign: 'center' }}>Select</th>
                    <th style={{ padding: '10px 14px' }}>Student Details (Full Name & ID)</th>
                    <th style={{ padding: '10px 14px', width: 100 }}>Class / Section</th>
                    <th style={{ padding: '10px 14px', width: 140 }}>Billing Status</th>
                    <th style={{ padding: '10px 14px', width: 130, textAlign: 'right' }}>Individual Bill</th>
                    <th style={{ padding: '10px 14px', width: 230, textAlign: 'center' }}>Billing Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClassStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                        {studentsForSelectedClass.length === 0
                          ? `No enrolled students found in ${selectedSubLevel}.`
                          : `No students matching "${classStudentSearch}".`}
                      </td>
                    </tr>
                  ) : (
                    filteredClassStudents.map((s, idx) => {
                      const sId = s.id || s.studentId;
                      const isIncluded = !excludedStudentIds.includes(sId) && !excludedStudentIds.includes(s.studentId) && !excludedStudentIds.includes(s.id);
                      const sFullName = getStudentFullName(s);
                      const indivAmount = classBillPerStudent;

                      return (
                        <tr
                          key={s.studentId || s.id || `class-bill-${idx}`}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            background: isIncluded ? '#ffffff' : '#fcfcfc',
                            opacity: isIncluded ? 1 : 0.65
                          }}
                        >
                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={isIncluded}
                              onChange={() => {
                                if (isIncluded) {
                                  handleRemoveStudentFromClassBill(sId);
                                } else {
                                  handleAddStudentBackToClassBill(sId);
                                }
                              }}
                              style={{ width: 16, height: 16, cursor: 'pointer' }}
                            />
                          </td>

                          <td style={{ padding: '10px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{
                                width: 34, height: 34, borderRadius: 6, background: '#e0f2fe',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                overflow: 'hidden', flexShrink: 0
                              }}>
                                {s.photo || s.passportPhoto ? (
                                  <img src={s.photo || s.passportPhoto} alt={sFullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <User size={18} color="#0284c7" />
                                )}
                              </div>
                              <div>
                                <strong style={{ color: '#0f172a', fontSize: 13.5 }}>{sFullName}</strong>
                                <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
                                  ID: <code style={{ color: '#0284c7', fontWeight: 800 }}>{s.studentId || s.id}</code> · Guardian: {s.guardianName || s.guardian || 'Parent'}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '10px 14px', fontWeight: 700, color: '#334155' }}>
                            {s.level || selectedSubLevel} ({s.classSection || 'A'})
                          </td>

                          <td style={{ padding: '10px 14px' }}>
                            {isIncluded ? (
                              <span style={{ padding: '3px 8px', borderRadius: 12, background: '#dcfce7', color: '#166534', fontWeight: 800, fontSize: 11 }}>
                                ✓ Included in Bill
                              </span>
                            ) : (
                              <span style={{ padding: '3px 8px', borderRadius: 12, background: '#fef3c7', color: '#b45309', fontWeight: 800, fontSize: 11 }}>
                                ✕ Excluded
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: isIncluded ? '#0f172a' : '#94a3b8' }}>
                            GHS {indivAmount.toFixed(2)}
                          </td>

                          <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                              {isIncluded ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStudentFromClassBill(sId)}
                                  style={{
                                    padding: '4px 8px', borderRadius: 6, border: '1px solid #fecaca',
                                    background: '#fff1f2', color: '#be123c', fontSize: 11, fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                  title="Exclude student from whole class bill"
                                >
                                  Remove from List
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleAddStudentBackToClassBill(sId)}
                                  style={{
                                    padding: '4px 8px', borderRadius: 6, border: '1px solid #86efac',
                                    background: '#f0fdf4', color: '#15803d', fontSize: 11, fontWeight: 800,
                                    cursor: 'pointer'
                                  }}
                                  title="Add student back to class billing list"
                                >
                                  ＋ Add Back
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  handleSelectStudentForBill(s);
                                }}
                                style={{
                                  padding: '4px 8px', borderRadius: 6, border: '1px solid #bae6fd',
                                  background: '#f0f9ff', color: '#0369a1', fontSize: 11, fontWeight: 800,
                                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                                }}
                                title="View single bill or post individually"
                              >
                                👤 Single Post
                              </button>
                              {canCancelPostedBill && (
                                <button
                                  type="button"
                                  onClick={() => handleCancelPostedBill(s)}
                                  style={{
                                    padding: '4px 8px', borderRadius: 6, border: '1px solid #fecaca',
                                    background: '#fff1f2', color: '#be123c', fontSize: 11, fontWeight: 800,
                                    cursor: 'pointer'
                                  }}
                                  title="Cancel this student's posted bill"
                                >
                                  Cancel Bill
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── SECTION B: SINGLE STUDENT BILL (INDIVIDUAL BILL & POST) ────── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeBillingView === 'single_student' && (
        <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Student Picker Bar */}
          <div
            className="no-print"
            style={{
            background: '#ffffff',
            border: '2px solid #16a34a',
            borderRadius: 12,
            padding: '16px 20px',
            boxShadow: '0 4px 14px rgba(22,163,74,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 14
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <User size={20} color="#16a34a" />
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#14532d' }}>
                  Individual Student Bill Statement
                </h3>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Select an enrolled student to prepare an individual bill, adjust their specific optional levies, post to ledger, or print.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <select
                id="single-bill-student-dropdown"
                style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #16a34a', fontSize: 13, fontWeight: 800, color: '#14532d', background: '#fff', cursor: 'pointer', minWidth: 260 }}
                value={preparingStudentBill?.id || preparingStudentBill?.studentId || ''}
                onChange={(e) => {
                  const s = singleBillStudents.find(stu => (stu.id === e.target.value || stu.studentId === e.target.value));
                  handleSelectStudentForBill(s);
                }}
              >
                <option value="">
                  {studentsForSelectedClass.length > 0
                    ? `-- Choose Student to Bill in ${activeSubLevelDisplay} (${studentsForSelectedClass.length} Available) --`
                    : `-- No Students Enrolled in ${activeSubLevelDisplay} (0) --`}
                </option>
                {singleBillStudents.map((s) => (
                  <option key={s.id || s.studentId} value={s.id || s.studentId}>
                    {getStudentFullName(s)} ({s.studentId} · {s.level})
                  </option>
                ))}
              </select>

              {preparingStudentBill && (
                <button
                  type="button"
                  onClick={() => setPreparingStudentBill(null)}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', color: '#64748b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>

          {/* If Student Selected: Render Full Bill Document */}
          {preparingStudentBill ? (
            <div style={{
              background: '#ffffff',
              borderRadius: 14,
              border: '1px solid #cbd5e1',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              overflow: 'hidden'
            }}>
              {/* Action Bar for Single Bill */}
              <div className="no-print" style={{
                background: '#0f172a',
                padding: '14px 22px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10,
                color: '#fff'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileText size={18} color="#38bdf8" />
                  <span style={{ fontWeight: 800, fontSize: 14 }}>
                    Single Student Billing: {getStudentFullName(preparingStudentBill)}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => handleExportStudentBillCSV(preparingStudentBill)}
                    style={{ padding: '6px 12px', background: '#1e293b', color: '#38bdf8', border: '1px solid #334155', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                  >
                    📥 Export CSV
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintIndividualBill}
                    style={{ padding: '6px 14px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: 6, fontWeight: 900, fontSize: 12, cursor: 'pointer' }}
                  >
                    🖨️ Print Student Bill
                  </button>

                  {canCancelPostedBill && (
                    <button
                      type="button"
                      onClick={() => handleCancelPostedBill(preparingStudentBill)}
                      style={{ padding: '6px 14px', background: '#fff1f2', color: '#be123c', border: '1px solid #fecaca', borderRadius: 6, fontWeight: 900, fontSize: 12, cursor: 'pointer' }}
                    >
                      Cancel Posted Bill
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleSinglePostToLedger(preparingStudentBill)}
                    style={{ padding: '6px 14px', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: 6, fontWeight: 900, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    ⚡ Post Single Bill to Ledger
                  </button>
                </div>
              </div>

              {/* Optional Bills Toggles for this specific student */}
              <div className="no-print" style={{
                background: '#f0fdf4',
                padding: '12px 22px',
                borderBottom: '1px solid #bbf7d0'
              }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#166534', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={15} /> Select Optional Bills for {getStudentFullName(preparingStudentBill)}:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {optionalBillItems.map((opt) => {
                    const isChecked = selectedStudentOptionalIds.includes(opt.id);
                    return (
                      <label
                        key={opt.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          background: isChecked ? '#16a34a' : '#ffffff',
                          color: isChecked ? '#ffffff' : '#334155',
                          padding: '5px 12px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudentOptionalIds(prev => [...prev, opt.id]);
                            } else {
                              setSelectedStudentOptionalIds(prev => prev.filter(id => id !== opt.id));
                            }
                          }}
                        />
                        <span>{opt.icon} {opt.label} (GHS {money(opt.amount).toFixed(2)})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Printable Official Single Student Bill — same one-page layout as bulk class print */}
              <div
                className="printable-document official-bill-document single-student-bill-page"
                style={{
                  background: '#ffffff',
                  padding: '36px 42px',
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: 16, marginBottom: 20 }} className="receipt-header-box">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }} className="receipt-header-inline">
                    <img src="/remalj-carewell-logo.jpg" alt="REMALJ Carewell Logo" style={{ height: 56, width: 'auto', borderRadius: 6, flexShrink: 0 }} className="receipt-logo" />
                    <div style={{ textAlign: 'left' }} className="receipt-school-text">
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', letterSpacing: '0.02em', lineHeight: 1.2 }}>
                        REMALJ CAREWELL INSPIRATIONAL SCHOOL
                      </div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', marginTop: 2 }}>
                        P.O. BOX 139, BOGOSO · PRESTEA HUNI-VALLEY MUNICIPALITY · GHANA · PHONE: 024 111 2222
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', marginTop: 10 }}>
                    <div style={{ display: 'inline-block', background: '#0f172a', color: '#fff', padding: '3px 18px', borderRadius: 20, fontSize: 11, fontWeight: 900, letterSpacing: '0.05em' }}>
                      OFFICIAL STUDENT FEE BILL STATEMENT · TERM 1 (2025/2026)
                    </div>
                  </div>
                </div>

                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 10,
                  padding: 14,
                  marginBottom: 18,
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 1fr',
                  gap: 14,
                  alignItems: 'center'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: 70, height: 78, borderRadius: 6, border: '1.5px solid #cbd5e1',
                      background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', margin: '0 auto'
                    }}>
                      {preparingStudentBill.photo || preparingStudentBill.passportPhoto ? (
                        <img src={preparingStudentBill.photo || preparingStudentBill.passportPhoto} alt={getStudentFullName(preparingStudentBill)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <User size={36} color="#94a3b8" />
                      )}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>STUDENT FULL NAME:</div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{getStudentFullName(preparingStudentBill)}</div>
                    <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>
                      Student ID: <code style={{ fontWeight: 800, color: '#0284c7' }}>{preparingStudentBill.studentId || preparingStudentBill.id}</code>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.55, color: '#334155' }}>
                    <div><strong>Class:</strong> {preparingStudentBill.level || selectedSubLevel} ({preparingStudentBill.classSection || 'A'})</div>
                    <div><strong>Guardian:</strong> {preparingStudentBill.guardianName || preparingStudentBill.guardian || 'Parent/Guardian'}</div>
                    <div><strong>Date Issued:</strong> {new Date().toLocaleDateString('en-GB')}</div>
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: '#0f3a4b', textTransform: 'uppercase', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                    <span>1. Compulsory Term Fees Component</span>
                    <span>Subtotal: GHS {totalBase.toFixed(2)}</span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, border: '1px solid #cbd5e1' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                        <th style={{ padding: '6px 10px' }}>Fee Line Item</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right' }}>Amount (GHS)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {baseBillItems.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '5px 10px', fontWeight: 600 }}>{item.details}</td>
                          <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 700 }}>{Number(item.amount || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {studentSelectedOpts.length > 0 && (
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#0284c7', textTransform: 'uppercase', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                      <span>2. Optional Services (Motivation, Bus, Feeding, Stationery, Pick Up Card)</span>
                      <span>Subtotal: GHS {studentOptTotal.toFixed(2)}</span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, border: '1px solid #bae6fd' }}>
                      <thead>
                        <tr style={{ background: '#f0f9ff', borderBottom: '1px solid #bae6fd', textAlign: 'left' }}>
                          <th style={{ padding: '6px 10px' }}>Optional Item</th>
                          <th style={{ padding: '6px 10px', textAlign: 'right' }}>Amount (GHS)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentSelectedOpts.map((opt) => (
                          <tr key={opt.id} style={{ borderBottom: '1px solid #f0f9ff' }}>
                            <td style={{ padding: '5px 10px', fontWeight: 600, color: '#0369a1' }}>{opt.icon} {opt.details}</td>
                            <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 700 }}>{Number(opt.amount || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{
                  background: '#f0fdf4',
                  border: '2px solid #16a34a',
                  borderRadius: 8,
                  padding: '10px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16
                }}>
                  <span style={{ fontSize: 12.5, fontWeight: 900, color: '#166534', textTransform: 'uppercase' }}>
                    TOTAL ACADEMIC BILL DUE FOR {getStudentFullName(preparingStudentBill).toUpperCase()}:
                  </span>
                  <span style={{ fontSize: 19, fontWeight: 900, color: '#15803d' }}>
                    GHS {studentGrandTotal.toFixed(2)}
                  </span>
                </div>

                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontSize: 11,
                  color: '#334155',
                  marginBottom: 18,
                  lineHeight: 1.5
                }}>
                  <div><strong>OFFICIAL BANKING PAYMENT DETAILS:</strong></div>
                  <div>• GCB Bank PLC (Bogoso Branch) · Account No: 7011130001245</div>
                  <div>• Ecobank Ghana PLC · Account No: 1441002390119</div>
                  <div>• MTN Mobile Money: 298410 (REMALJ Carewell School) · Ref: <code>{preparingStudentBill.studentId || preparingStudentBill.id}</code></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 8 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px solid #0f172a', width: 170, marginBottom: 4 }}></div>
                    <div style={{ fontWeight: 800, fontSize: 10.5, color: '#0f172a' }}>Headmaster / Principal</div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 10, color: '#64748b' }}>
                    Addressed to {getStudentFullName(preparingStudentBill)} · 1 of 1
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ borderBottom: '1px solid #0f172a', width: 170, marginBottom: 4 }}></div>
                    <div style={{ fontWeight: 800, fontSize: 10.5, color: '#0f172a' }}>Bursar / Accountant Signature</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              background: '#f8fafc',
              border: '2px dashed #cbd5e1',
              borderRadius: 14,
              padding: 40,
              textAlign: 'center'
            }}>
              <User size={48} color="#94a3b8" style={{ margin: '0 auto 12px auto', display: 'block' }} />
              <h3 style={{ fontSize: 17, fontWeight: 900, color: '#334155', margin: '0 0 6px 0' }}>
                No Student Selected for Individual Bill
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', maxWidth: 460, margin: '0 auto 20px auto' }}>
                Please select a candidate from the dropdown above, or click on any of the enrolled students in <strong>{activeSubLevelDisplay}</strong> below to prepare their individual bill.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, maxWidth: 900, margin: '0 auto', textAlign: 'left' }}>
                {studentsForSelectedClass.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleSelectStudentForBill(s)}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: 10,
                      padding: 12,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 6, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <User size={20} color="#0284c7" />
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <strong style={{ display: 'block', fontSize: 13, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {getStudentFullName(s)}
                        </strong>
                        <code style={{ fontSize: 11, color: '#0284c7' }}>{s.studentId}</code>
                      </div>
                    </div>
                  </div>
                ))}
                {studentsForSelectedClass.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, fontWeight: 700, gridColumn: '1 / -1', padding: '24px 0' }}>
                    No students currently enrolled in {activeSubLevelDisplay}.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ── SECTION C: MASTER SCHEDULE RATES (COMPULSORY & OPTIONALS) ── */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeBillingView === 'master_schedule' && (
        <div className="animate-fade-up">
          {/* Optional Bills Quick-Add Bar */}
          <div className="no-print" style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: 12,
            padding: '14px 18px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            marginBottom: 20
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: '#0f3a4b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Optional Fee Bills Schedule ({selectedSubLevel})
                </h3>
                <span style={{ fontSize: 11, background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 12, fontWeight: 800 }}>
                  Motivation · Bus · Feeding · Stationery · Pick Up Card
                </span>
              </div>

              <div style={{ fontSize: 12, fontWeight: 800, color: '#0369a1' }}>
                Active Optional Subtotal: <strong>GHS {totalOptionalActive.toFixed(2)}</strong>
              </div>
            </div>

            {/* 1-Click Preset Addition Chips */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Quick Presets:</span>
              {OFFICIAL_OPTIONAL_PRESETS.map((preset) => {
                const currentItem = optionalBillItems.find(o => o.id === preset.id);
                const isEnabled = currentItem?.enabled;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleAddPresetOptionalBill(preset)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 20,
                      border: isEnabled ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                      background: isEnabled ? '#e0f2fe' : '#ffffff',
                      color: isEnabled ? '#0369a1' : '#334155',
                      fontSize: 11.5,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.15s ease'
                    }}
                    title={preset.description}
                  >
                    <span>{preset.icon}</span>
                    <span>{preset.label}</span>
                    <span style={{ opacity: 0.8, fontSize: 11 }}>
                      (GHS {currentItem ? currentItem.amount.toFixed(2) : preset.defaultAmount.toFixed(2)})
                    </span>
                    {isEnabled ? ' ✓' : ' ＋'}
                  </button>
                );
              })}
            </div>
          </div>

      {/* Grid of Typed Tables */}
      <div className="fee-grid">
        {/* Panel 1: Main Compulsory Term Bill */}
        <div className="fee-panel">
          <div className="fee-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2><DollarSign size={18} /> 1. Compulsory Term Bill — {selectedSubLevel}</h2>
            <button
              onClick={() => { setNewFeeForm(prev => ({ ...prev, isOptional: false })); setIsAddingFeeModal(true); }}
              style={{ padding: '4px 10px', background: '#204d2d', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 800, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              className="no-print"
            >
              <Plus size={13} /> Add Compulsory Fee
            </button>
          </div>
          <div className="fee-panel-body">
            <table className="fee-table">
              <thead>
                <tr>
                  <th>Compulsory Details & Component</th>
                  <th style={{ textAlign: 'right' }}>Amount (GHS)</th>
                  <th className="no-print" style={{ width: 145, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {baseBillItems.map((item, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700, color: 'var(--gray-800)' }}>{item.details}</td>
                    <td style={{ textAlign: 'right' }}>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.amount}
                        onChange={(e) => handleUpdateCompulsoryBillAmount(i, e.target.value)}
                        style={{ width: 90, padding: '3px 6px', textAlign: 'right', border: '1px solid #cbd5e1', borderRadius: 4, fontWeight: 800, fontSize: 12, color: '#0f172a' }}
                        className="no-print"
                      />
                      <span className="print-only" style={{ fontWeight: 800 }}>{item.amount.toFixed(2)}</span>
                    </td>
                    <td className="no-print" style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEditCompulsoryModal(i, item)}
                          style={{ padding: '3px 8px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 3 }}
                          title={`Edit ${item.details}`}
                        >
                          <Edit3 size={12} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFeeItem(i)}
                          style={{ padding: '3px 8px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 3 }}
                          title={`Remove ${item.details} from ${selectedSubLevel} bill`}
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="fee-table-total">
                  <td>COMPULSORY BASE BILL SUBTOTAL</td>
                  <td style={{ textAlign: 'right', fontSize: 15 }}>GHS {totalBase.toFixed(2)}</td>
                  <td className="no-print"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel 2: Optional Fee Bills Schedule */}
        <div className="fee-panel">
          <div className="fee-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0284c7' }}>
            <h2 style={{ color: '#fff' }}>
              <Sparkles size={18} /> 2. Optional Fee Bills Schedule — {selectedSubLevel}
            </h2>
            <button
              onClick={() => { setNewFeeForm(prev => ({ ...prev, isOptional: true })); setIsAddingFeeModal(true); }}
              style={{ padding: '4px 10px', background: '#0369a1', color: '#fff', border: '1px solid #bae6fd', borderRadius: 6, fontWeight: 800, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              className="no-print"
            >
              <Plus size={13} /> Add Custom Optional
            </button>
          </div>
          <div className="fee-panel-body">
            <table className="fee-table">
              <thead>
                <tr>
                  <th>Optional Bill Component</th>
                  <th style={{ textAlign: 'right' }}>Amount (GHS)</th>
                  <th className="no-print" style={{ width: 220, textAlign: 'center' }}>Action / Status</th>
                </tr>
              </thead>
              <tbody>
                {optionalBillItems.map((opt) => (
                  <tr key={opt.id} style={{ background: opt.enabled ? '#f0f9ff' : '#ffffff' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 15 }}>{opt.icon || '✨'}</span>
                        <div>
                          <strong style={{ color: '#0f3a4b', fontSize: 12.5 }}>{opt.details}</strong>
                          <div style={{ fontSize: 10.5, color: '#64748b' }}>{opt.description}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={opt.amount}
                        onChange={(e) => handleUpdateOptionalBillAmount(opt.id, e.target.value)}
                        style={{ width: 85, padding: '3px 6px', textAlign: 'right', border: '1px solid #cbd5e1', borderRadius: 4, fontWeight: 800, fontSize: 12, color: '#0f172a' }}
                        className="no-print"
                      />
                      <span className="print-only" style={{ fontWeight: 800 }}>{opt.amount.toFixed(2)}</span>
                    </td>
                    <td className="no-print" style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleOptionalBill(opt.id)}
                          style={{
                            padding: '3px 7px',
                            borderRadius: 4,
                            border: 'none',
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: 'pointer',
                            background: opt.enabled ? '#15803d' : '#94a3b8',
                            color: '#ffffff'
                          }}
                          title={opt.enabled ? 'Click to disable' : 'Click to enable'}
                        >
                          {opt.enabled ? 'Active ✓' : 'Inactive'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditOptionalModal(opt)}
                          style={{ padding: '3px 7px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 3 }}
                          title={`Edit ${opt.details}`}
                        >
                          <Edit3 size={12} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionalFeeItem(opt.id)}
                          style={{ padding: '3px 7px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 3 }}
                          title={`Remove ${opt.details} from ${selectedSubLevel} bill`}
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr className="fee-table-subtotal">
                  <td>ACTIVE OPTIONAL BILLS SUBTOTAL</td>
                  <td style={{ textAlign: 'right', color: '#0284c7' }}>GHS {totalOptionalActive.toFixed(2)}</td>
                  <td className="no-print"></td>
                </tr>
                <tr className="fee-table-total" style={{ background: '#e0f2fe' }}>
                  <td>TOTAL BILL WITH ALL OPTIONALS</td>
                  <td style={{ textAlign: 'right', fontSize: 15, color: '#0369a1' }}>
                    GHS {(totalBase + totalOptionalActive).toFixed(2)}
                  </td>
                  <td className="no-print"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── PANEL 3: MASTER STATIONERY SCHEDULE (EDITABLE PER CLASS) ── */}
      <div className="fee-panel" style={{ marginTop: 20 }}>
        <div className="fee-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, background: '#0f3a4b', color: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={18} color="#38bdf8" />
            <h2 style={{ color: '#ffffff', margin: 0, fontSize: 15, fontWeight: 900 }}>
              Master Stationery Schedule (Editable Per Class & Sub-Level)
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>Filter Category:</span>
            {[
              { id: 'all', label: 'All Classes (14)' },
              { id: 'nursery_creche', label: '👶 Nursery & Creche' },
              { id: 'kindergarten', label: '🧒 Kindergarten' },
              { id: 'basic_school', label: '🎓 Basic (Grades 1-9)' }
            ].map((f) => {
              const isAct = stationeryFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStationeryFilter(f.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 4,
                    border: 'none',
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                    background: isAct ? '#0284c7' : '#1e293b',
                    color: isAct ? '#ffffff' : '#cbd5e1',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {savedStationeryNotice && (
          <div style={{ background: '#f0fdf4', borderBottom: '1px solid #86efac', padding: '8px 16px', color: '#166534', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Check size={16} /> {savedStationeryNotice}
          </div>
        )}

        <div className="fee-panel-body" style={{ overflowX: 'auto' }}>
          <table className="fee-table">
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                <th style={{ width: 180 }}>Class / Sub-Level</th>
                <th>Stationery & Learning Aids Package Breakdown</th>
                <th style={{ width: 100, textAlign: 'center' }}>Package Items</th>
                <th style={{ width: 180, textAlign: 'right' }}>Official Fee (GHS)</th>
                <th className="no-print" style={{ width: 110, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStationeryList.map((s) => {
                const isSelectedClass = selectedSubLevel === s.classLevel;
                return (
                  <tr
                    key={s.classLevel}
                    className={isSelectedClass ? 'fee-row-highlight' : ''}
                    style={{
                      background: isSelectedClass ? '#f0f9ff' : undefined,
                      borderBottom: '1px solid #e2e8f0'
                    }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13 }}>{s.category === 'nursery_creche' ? '👶' : s.category === 'kindergarten' ? '🧒' : '🎓'}</span>
                        <strong style={{ color: '#0f3a4b', fontSize: 13 }}>{s.label}</strong>
                        {isSelectedClass && (
                          <span style={{ fontSize: 9.5, background: '#0284c7', color: '#fff', padding: '1px 5px', borderRadius: 4, fontWeight: 900 }}>
                            ACTIVE
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: '#475569', minWidth: 280 }}>
                      <textarea
                        rows={2}
                        value={s.notes || ''}
                        onChange={(e) => handleUpdateStationeryField(s.classLevel, 'notes', e.target.value)}
                        placeholder="Package breakdown details..."
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: isSelectedClass ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                          fontSize: 12,
                          lineHeight: '1.4',
                          fontWeight: 500,
                          color: '#1e293b',
                          background: '#ffffff',
                          resize: 'vertical',
                          fontFamily: 'inherit',
                          boxSizing: 'border-box'
                        }}
                      />
                    </td>
                    <td style={{ textAlign: 'center', minWidth: 110 }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <input
                          type="number"
                          min="0"
                          value={s.itemsCount ?? ''}
                          onChange={(e) => handleUpdateStationeryField(s.classLevel, 'itemsCount', e.target.value)}
                          style={{
                            width: 56,
                            padding: '5px 6px',
                            textAlign: 'center',
                            borderRadius: 6,
                            border: isSelectedClass ? '1.5px solid #0284c7' : '1px solid #cbd5e1',
                            fontWeight: 800,
                            fontSize: 12.5,
                            color: '#0f3a4b',
                            background: '#ffffff'
                          }}
                        />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>items</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', minWidth: 130 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>GHS</span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={s.amount ?? ''}
                          onChange={(e) => handleUpdateStationeryField(s.classLevel, 'amount', e.target.value)}
                          style={{
                            width: 90,
                            padding: '5px 8px',
                            textAlign: 'right',
                            borderRadius: 6,
                            border: isSelectedClass ? '2px solid #0284c7' : '1px solid #cbd5e1',
                            fontWeight: 900,
                            fontSize: 13,
                            color: '#0f3a4b',
                            background: '#ffffff'
                          }}
                        />
                      </div>
                    </td>
                    <td className="no-print" style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const targetSub = (activeBillingView === 'single_student' && s.category === 'basic_school')
                            ? (s.classLevel.match(/\d+/) ? `Basic ${s.classLevel.match(/\d+/)[0]}` : s.classLevel)
                            : s.classLevel;
                          setSelectedSubLevel(targetSub);
                          setSelectedGradeCategory(s.category);
                          setSavedStationeryNotice(`✅ Synchronized and loaded active bill view for ${s.label}!`);
                          setTimeout(() => setSavedStationeryNotice(''), 3000);
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: isSelectedClass ? '1px solid #0284c7' : '1px solid #cbd5e1',
                          background: isSelectedClass ? '#0284c7' : '#f8fafc',
                          color: isSelectedClass ? '#ffffff' : '#0f3a4b',
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        {isSelectedClass ? 'Active View' : 'Select View'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

      {/* Add New Fee Component Modal */}
      {isAddingFeeModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsAddingFeeModal(false); }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)',
            zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '85px 16px 40px', overflowY: 'auto'
          }}
          className="no-print"
        >
          <div style={{
            maxWidth: 480, width: '100%', background: '#fff', borderRadius: 16,
            padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--gray-900)' }}>
                ➕ Add Fee Component ({selectedSubLevel})
              </h3>
              <button onClick={() => setIsAddingFeeModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} color="var(--gray-500)" />
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--gray-600)', marginBottom: 20 }}>
              Add a new fee item to the <strong>{selectedSubLevel}</strong> schedule as Compulsory or Optional (e.g. Motivation, Bus, Feeding, Stationery, Pick Up Card).
            </p>

            <form onSubmit={handleAddFeeSubmit}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Fee Classification</label>
                <div style={{ display: 'flex', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="feeType"
                      checked={!newFeeForm.isOptional}
                      onChange={() => setNewFeeForm(p => ({ ...p, isOptional: false }))}
                    />
                    Compulsory Bill
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#0284c7', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="feeType"
                      checked={newFeeForm.isOptional}
                      onChange={() => setNewFeeForm(p => ({ ...p, isOptional: true }))}
                    />
                    Optional Bill (Motivation, Bus, Feeding, etc.)
                  </label>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Fee Component Name / Details</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. MOTIVATION FEE, BUS SERVICE, FEEDING"
                  value={newFeeForm.details}
                  onChange={(e) => setNewFeeForm(prev => ({ ...prev, details: e.target.value }))}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Amount (GHS)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  className="form-input"
                  placeholder="e.g. 150.00"
                  value={newFeeForm.amount}
                  onChange={(e) => setNewFeeForm(prev => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsAddingFeeModal(false)}
                  style={{ flex: 1, padding: 11, borderRadius: 8, border: '1px solid var(--gray-300)', background: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: 11, borderRadius: 8, border: 'none', background: '#204d2d', color: '#fff', fontWeight: 900, cursor: 'pointer' }}
                >
                  ➕ Add Fee Line Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Fee Component Modal */}
      {isEditingFeeModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsEditingFeeModal(false); }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)',
            zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '85px 16px 40px', overflowY: 'auto'
          }}
          className="no-print"
        >
          <div style={{
            maxWidth: 480, width: '100%', background: '#fff', borderRadius: 16,
            padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--gray-900)' }}>
                ✏️ Edit {editingFeeTarget?.type === 'optional' ? 'Optional' : 'Compulsory'} Fee Component ({selectedSubLevel})
              </h3>
              <button onClick={() => setIsEditingFeeModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} color="var(--gray-500)" />
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--gray-600)', marginBottom: 20 }}>
              Modify the fee component details and amount for <strong>{selectedSubLevel}</strong> bill schedule.
            </p>

            <form onSubmit={handleSaveEditFeeSubmit}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Fee Component Name / Details</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. ADMISSION FEE, TUITION FEE, MOTIVATION LEVY"
                  value={editingFeeForm.details}
                  onChange={(e) => setEditingFeeForm(prev => ({ ...prev, details: e.target.value }))}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Amount (GHS)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-input"
                  placeholder="e.g. 1000.00"
                  value={editingFeeForm.amount}
                  onChange={(e) => setEditingFeeForm(prev => ({ ...prev, amount: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setIsEditingFeeModal(false)}
                  style={{ flex: 1, padding: 11, borderRadius: 8, border: '1px solid var(--gray-300)', background: '#fff', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ flex: 1, padding: 11, borderRadius: 8, border: 'none', background: '#0284c7', color: '#fff', fontWeight: 900, cursor: 'pointer' }}
                >
                  💾 Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post Student Academic Bill Confirmation Modal */}
      {isPostingModalOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsPostingModalOpen(false); }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(4px)',
            zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '85px 16px 40px', overflowY: 'auto'
          }}
          className="no-print"
        >
          <div style={{
            maxWidth: 540, width: '100%', background: '#fff', borderRadius: 16,
            padding: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={20} color="#16a34a" />
                <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--gray-900)', margin: 0 }}>
                  Post Academic Bill to Student Ledger
                </h3>
              </div>
              <button onClick={() => setIsPostingModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} color="var(--gray-500)" />
              </button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--gray-600)', marginBottom: 16, lineHeight: 1.5 }}>
              This action will debit and post the academic bill for <strong>{activeCategoryObj.name} · {selectedSubLevel} (Term 1 · 2026)</strong> directly into student financial records.
            </p>

            <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 6 }}>SELECT BULK OR INDIVIDUAL POSTING SCOPE</div>
              <select
                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 800, color: '#0f172a', background: '#fff' }}
                value={postTargetScope}
                onChange={(e) => setPostTargetScope(e.target.value)}
              >
                <option value="class">📚 Bulk Post to One Specific Class (e.g. {selectedSubLevel})</option>
                <option value="class_level">🏢 Bulk Post to Entire Class Level / Department (e.g. {activeCategoryObj.name})</option>
                <option value="subclass">🏷️ Bulk Post to One Specific Sub-Class / Section (e.g. 1A, 1B, Section A)</option>
                <option value="all">🌍 Bulk Post to All Active Students (School-wide)</option>
                <option value="student">👤 Post to Individual Student (Single Candidate)</option>
              </select>

              {/* Scope Option 1: Entire Class Level / Department Category */}
              {postTargetScope === 'class_level' && (
                <div style={{ marginTop: 12 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', marginBottom: 4 }}>
                    Select Class Level / Department Category:
                  </label>
                  <select
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #0284c7', fontSize: 13, fontWeight: 700, color: '#0369a1', background: '#fff' }}
                    value={selectedPostingCategory}
                    onChange={(e) => setSelectedPostingCategory(e.target.value)}
                  >
                    {GRADE_LEVEL_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Scope Option 2: One Specific Class */}
              {postTargetScope === 'class' && (
                <div style={{ marginTop: 12 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', marginBottom: 4 }}>
                    Select Target Class:
                  </label>
                  <select
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #0284c7', fontSize: 13, fontWeight: 700, color: '#0369a1', background: '#fff' }}
                    value={selectedPostingClass}
                    onChange={(e) => setSelectedPostingClass(e.target.value)}
                  >
                    {['Creche', 'Nursery 1', 'Nursery 2', 'KG 1', 'KG 2', 'Basic 1', 'Basic 2', 'Basic 3', 'Basic 4', 'Basic 5', 'Basic 6', 'Basic 7', 'Basic 8', 'Basic 9'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Scope Option 3: One Specific Sub-Class / Section */}
              {postTargetScope === 'subclass' && (
                <div style={{ marginTop: 12 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#475569', marginBottom: 4 }}>
                    Select Target Sub-Class / Section:
                  </label>
                  <select
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #0284c7', fontSize: 13, fontWeight: 700, color: '#0369a1', background: '#fff' }}
                    value={selectedPostingSubClass}
                    onChange={(e) => setSelectedPostingSubClass(e.target.value)}
                  >
                    {['1A', '1B', '1C', '2A', '2B', '3A', '3B', '4A', '4B', '5A', '5B', '6A', '6B', '7A', '7B', '8A', '8B', '9A', '9B', 'Section A', 'Section B', 'Section C', 'Section D', 'Stream A', 'Stream B', 'Gold Class', 'Diamond Class', 'Sunflower', 'Rose'].map(sc => (
                      <option key={sc} value={sc}>{sc}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Student Search Box */}
              {postTargetScope === 'student' && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    🔎 Search student by name, ID (e.g. REMALJ-2026-001), or class:
                  </div>
                  <div style={{ position: 'relative' }}>
                    <UserCheck size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type="text"
                      placeholder="Type to search student roster..."
                      value={postingStudentSearch}
                      onChange={(e) => setPostingStudentSearch(e.target.value)}
                      style={{
                        width: '100%', padding: '8px 12px 8px 34px', borderRadius: 6,
                        border: '1px solid #0284c7', fontSize: 13, outline: 'none', background: '#fff', fontWeight: 600
                      }}
                    />
                  </div>

                  {/* Filtered Dropdown Results */}
                  {postingStudentSearch.trim() && (
                    <div style={{
                      maxHeight: 180, overflowY: 'auto', background: '#fff', border: '1px solid #cbd5e1',
                      borderRadius: 8, marginTop: 6, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 10
                    }}>
                      {onboardedStudents.filter(s =>
                        (s.fullName || '').toLowerCase().includes(postingStudentSearch.toLowerCase()) ||
                        (s.studentId || '').toLowerCase().includes(postingStudentSearch.toLowerCase()) ||
                        (s.level || '').toLowerCase().includes(postingStudentSearch.toLowerCase())
                      ).length === 0 ? (
                        <div style={{ padding: '10px 12px', fontSize: 12, color: '#94a3b8', textAlign: 'center' }}>
                          No matching students found for "{postingStudentSearch}".
                        </div>
                      ) : (
                        onboardedStudents.filter(s =>
                          (s.fullName || '').toLowerCase().includes(postingStudentSearch.toLowerCase()) ||
                          (s.studentId || '').toLowerCase().includes(postingStudentSearch.toLowerCase()) ||
                          (s.level || '').toLowerCase().includes(postingStudentSearch.toLowerCase())
                        ).map((stu) => (
                          <div
                            key={stu.id || stu.studentId}
                            onClick={() => {
                              setSelectedPostingStudent(stu);
                              setPostingStudentSearch('');
                            }}
                            style={{
                              padding: '8px 12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              background: (selectedPostingStudent?.id === stu.id || selectedPostingStudent?.studentId === stu.studentId) ? '#f0fdf4' : '#fff'
                            }}
                          >
                            <div>
                              <strong style={{ fontSize: 13, color: '#0f172a' }}>{getStudentFullName(stu)}</strong>
                              <span style={{ fontSize: 11, color: '#0284c7', marginLeft: 8, fontWeight: 700 }}>{stu.level}</span>
                            </div>
                            <code style={{ fontSize: 11, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{stu.studentId}</code>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Selected Student Card */}
                  {(selectedPostingStudent || preparingStudentBill) && (
                    <div style={{
                      marginTop: 10, padding: '10px 14px', background: '#f0fdf4',
                      border: '1px solid #86efac', borderRadius: 8, display: 'flex',
                      alignItems: 'center', justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CheckCircle2 size={18} color="#166534" />
                        <div>
                          <div style={{ fontWeight: 800, fontSize: 13, color: '#166534' }}>
                            {getStudentFullName(selectedPostingStudent || preparingStudentBill)}
                          </div>
                          <div style={{ fontSize: 11, color: '#15803d' }}>
                            ID: {(selectedPostingStudent || preparingStudentBill).studentId} · Level: {(selectedPostingStudent || preparingStudentBill).level}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedPostingStudent(null)}
                        style={{ background: 'none', border: 'none', color: '#b91c1c', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                      >
                        Change
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Optional Bills Inclusion Toggle in Posting Modal */}
            <div style={{ background: '#f0f9ff', padding: 12, borderRadius: 8, border: '1px solid #bae6fd', marginBottom: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 12.5, color: '#0369a1', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={postIncludeOptional}
                  onChange={(e) => setPostIncludeOptional(e.target.checked)}
                />
                <span>Include Active Optional Bills (Motivation, Bus, Feeding, Stationery, Pick Up Card)</span>
              </label>
            </div>

            <div style={{ background: '#f0fdf4', padding: 14, borderRadius: 10, border: '1px solid #bbf7d0', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#166534' }}>TOTAL AMOUNT TO POST & DEBIT:</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#14532d' }}>
                  GHS {classBillPerStudent.toFixed(2)}
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#15803d', marginTop: 4 }}>
                {baseBillItems.length} compulsory components + {postIncludeOptional ? optionalBillItems.filter(o => o.enabled).length : 0} optional components
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                type="button"
                onClick={() => setIsPostingModalOpen(false)}
                style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid var(--gray-300)', background: '#fff', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetStu = postTargetScope === 'student' ? (selectedPostingStudent || preparingStudentBill) : null;
                  handlePostBillToLedger(targetStu);
                }}
                style={{ flex: 1.5, padding: 12, borderRadius: 8, border: 'none', background: '#16a34a', color: '#fff', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                ⚡ Post Bill to Student Ledger Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FOREMOST LAYER: POST BILL TO STUDENT LEDGER SUCCESS DIALOG BOX (Requirement 2) ── */}
      {postBillSuccessData && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 999999, // Absolute foremost layer over all pages, modals, and elements
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16
          }}
          onClick={() => setPostBillSuccessData(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              maxWidth: 540,
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45), 0 0 0 2px rgba(34, 197, 94, 0.3)',
              overflow: 'hidden',
              border: '2px solid #16a34a'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)',
              color: '#ffffff',
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  padding: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CheckCircle2 size={32} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, letterSpacing: '0.01em', color: '#ffffff' }}>
                    {postBillSuccessData.databasePosted > 0
                      ? 'Bill Posted to Database Ledger'
                      : 'Bill Posted to Student Ledger'}
                  </h3>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: '#bbf7d0', fontWeight: 600 }}>
                    {postBillSuccessData.databasePosted > 0
                      ? `Saved in the finance database · ${postBillSuccessData.timestamp}`
                      : `Ledger updated locally · ${postBillSuccessData.timestamp}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPostBillSuccessData(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Dialog Body Content */}
            <div style={{ padding: '24px' }}>
              <div style={{
                background: '#f0fdf4',
                border: '1.5px solid #86efac',
                borderRadius: 12,
                padding: '16px 20px',
                marginBottom: 20
              }}>
                <div style={{ fontSize: 11.5, color: '#166534', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  Total Bill Posted (GHS)
                </div>
                <div style={{ fontSize: 32, fontWeight: 900, color: '#15803d' }}>
                  GHS {postBillSuccessData.totalAmount.toFixed(2)}
                </div>
                <div style={{ fontSize: 12, color: '#166534', fontWeight: 700, marginTop: 4 }}>
                  ✓ {postBillSuccessData.compulsoryCount} Compulsory Fee Items + {postBillSuccessData.optionalCount} Selected Optional Items Included
                </div>
              </div>

              {/* Ledger Summary Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 12,
                marginBottom: 20,
                fontSize: 12
              }}>
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b', fontWeight: 700, display: 'block', fontSize: 11 }}>Target Account / Scope:</span>
                  <strong style={{ color: '#0f172a', fontSize: 13 }}>{postBillSuccessData.scopeLabel}</strong>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b', fontWeight: 700, display: 'block', fontSize: 11 }}>Student Accounts Debited:</span>
                  <strong style={{ color: '#15803d', fontSize: 13 }}>{postBillSuccessData.affectedCount} Student(s)</strong>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b', fontWeight: 700, display: 'block', fontSize: 11 }}>Class Level:</span>
                  <strong style={{ color: '#0f172a', fontSize: 13 }}>{postBillSuccessData.targetClass}</strong>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b', fontWeight: 700, display: 'block', fontSize: 11 }}>Academic Term:</span>
                  <strong style={{ color: '#0f172a', fontSize: 13 }}>{postBillSuccessData.term}</strong>
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 12,
                color: postBillSuccessData.databasePosted > 0 ? '#15803d' : '#92400e',
                background: postBillSuccessData.databasePosted > 0 ? '#dcfce7' : '#fef3c7',
                padding: '12px 16px',
                borderRadius: 8,
                fontWeight: 700,
                marginBottom: 20
              }}>
                <Check size={18} style={{ flexShrink: 0 }} />
                <span>
                  {postBillSuccessData.databasePosted > 0
                    ? 'Saved to the finance database. The accountant portal, parent fees, and student ledgers will show this bill.'
                    : `Student ledger is updated on this device. Database save failed${postBillSuccessData.databaseError ? `: ${postBillSuccessData.databaseError}` : ''}. Sign in with a live Head Admin or Accounts session and post again so the accountant can see it.`}
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setPostBillSuccessData(null)}
                  style={{
                    padding: '10px 24px',
                    background: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
                  }}
                >
                  <Check size={16} /> Done / Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── WHOLE CLASS MULTI-PAGE PRINTING MODAL ── */}
      {/* Each page is an official bill addressed to each individual student in the selected class */}
      {isPrintingClassBillsModal && (
        <div
          className="print-class-bills-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setIsPrintingClassBillsModal(false); }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(6px)',
            zIndex: 99999, overflowY: 'auto', padding: '20px 16px 60px',
            display: 'flex', justifyContent: 'center', alignItems: 'flex-start'
          }}
        >
          <div style={{
            width: '100%', maxWidth: 840, background: '#fff', borderRadius: 16,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)', overflow: 'hidden'
          }}>
            {/* Modal Control Header (no-print) */}
            <div style={{
              background: '#0f172a', padding: '16px 24px', color: '#fff',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
            }} className="no-print">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Printer size={20} color="#38bdf8" />
                  <span style={{ fontWeight: 900, fontSize: 16 }}>
                    Multi-Page Print: Whole Class Bills ({selectedSubLevel})
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                  Each page below is addressed to each individual student in {selectedSubLevel} ({printPages.length} individual pages).
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  style={{
                    padding: '8px 18px', background: '#38bdf8', color: '#0f172a',
                    border: 'none', borderRadius: 8, fontWeight: 900, fontSize: 13,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 4px 12px rgba(56,189,248,0.3)'
                  }}
                >
                  <Printer size={16} /> Print All ({printPages.length} Pages)
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrintingClassBillsModal(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={22} />
                </button>
              </div>
            </div>

            {/* Printable Container: maps each student to an addressed .class-bill-page */}
            <div style={{ background: '#f8fafc', padding: '24px 0' }} className="printable-document">
              {printPages.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                  No students currently included for billing in {selectedSubLevel}. Please include students in the roster first.
                </div>
              ) : (
                printPages.map((s, idx) => {
                  const sFullName = getStudentFullName(s);
                  const activeOptionals = postIncludeOptional ? optionalBillItems.filter(o => o.enabled) : [];
                  const sTotal = classBillPerStudent;

                  return (
                    <div
                      key={s.id || s.studentId || idx}
                      className="class-bill-page official-bill-document"
                      style={{
                        background: '#ffffff',
                        padding: '36px 42px',
                        boxSizing: 'border-box',
                        borderBottom: '2px dashed #cbd5e1',
                        marginBottom: 30,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                      }}
                    >
                      {/* Document Header */}
                      <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: 16, marginBottom: 20 }} className="receipt-header-box">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }} className="receipt-header-inline">
                          <img src="/remalj-carewell-logo.jpg" alt="REMALJ Carewell Logo" style={{ height: 56, width: 'auto', borderRadius: 6, flexShrink: 0 }} className="receipt-logo" />
                          <div style={{ textAlign: 'left' }} className="receipt-school-text">
                            <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', letterSpacing: '0.02em', lineHeight: 1.2 }}>
                              REMALJ CAREWELL INSPIRATIONAL SCHOOL
                            </div>
                            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#475569', marginTop: 2 }}>
                              P.O. BOX 139, BOGOSO · PRESTEA HUNI-VALLEY MUNICIPALITY · GHANA · PHONE: 024 111 2222
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'center', marginTop: 10 }}>
                          <div style={{ display: 'inline-block', background: '#0f172a', color: '#fff', padding: '3px 18px', borderRadius: 20, fontSize: 11, fontWeight: 900, letterSpacing: '0.05em' }}>
                            OFFICIAL STUDENT FEE BILL STATEMENT · TERM 1 (2025/2026)
                          </div>
                        </div>
                      </div>

                      {/* Student Info Card (Addressed to each individual student) */}
                      <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 10,
                        padding: 14,
                        marginBottom: 18,
                        display: 'grid',
                        gridTemplateColumns: '80px 1fr 1fr',
                        gap: 14,
                        alignItems: 'center'
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            width: 70, height: 78, borderRadius: 6, border: '1.5px solid #cbd5e1',
                            background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            overflow: 'hidden', margin: '0 auto'
                          }}>
                            {s.photo || s.passportPhoto ? (
                              <img src={s.photo || s.passportPhoto} alt={sFullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <User size={36} color="#94a3b8" />
                            )}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: 10.5, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>STUDENT FULL NAME:</div>
                          <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{sFullName}</div>
                          <div style={{ fontSize: 11.5, color: '#475569', marginTop: 2 }}>
                            Student ID: <code style={{ fontWeight: 800, color: '#0284c7' }}>{s.studentId || s.id}</code>
                          </div>
                        </div>

                        <div style={{ fontSize: 12, lineHeight: 1.55, color: '#334155' }}>
                          <div><strong>Class:</strong> {s.level || selectedSubLevel} ({s.classSection || 'A'})</div>
                          <div><strong>Guardian:</strong> {s.guardianName || s.guardian || 'Parent/Guardian'}</div>
                          <div><strong>Date Issued:</strong> {new Date().toLocaleDateString('en-GB')}</div>
                        </div>
                      </div>

                      {/* 1. Compulsory Fees Table */}
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 900, color: '#0f3a4b', textTransform: 'uppercase', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                          <span>1. Compulsory Term Fees Component</span>
                          <span>Subtotal: GHS {totalBase.toFixed(2)}</span>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, border: '1px solid #cbd5e1' }}>
                          <thead>
                            <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                              <th style={{ padding: '6px 10px' }}>Fee Line Item</th>
                              <th style={{ padding: '6px 10px', textAlign: 'right' }}>Amount (GHS)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {baseBillItems.map((item, bIdx) => (
                              <tr key={bIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '5px 10px', fontWeight: 600 }}>{item.details}</td>
                                <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 700 }}>{Number(item.amount || 0).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* 2. Optional Fees Table (if enabled) */}
                      {postIncludeOptional && activeOptionals.length > 0 && (
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 12, fontWeight: 900, color: '#0284c7', textTransform: 'uppercase', marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
                            <span>2. Optional Services (Motivation, Bus, Feeding, Stationery, Pick Up Card)</span>
                            <span>Subtotal: GHS {totalOptionalActive.toFixed(2)}</span>
                          </div>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, border: '1px solid #bae6fd' }}>
                            <thead>
                              <tr style={{ background: '#f0f9ff', borderBottom: '1px solid #bae6fd', textAlign: 'left' }}>
                                <th style={{ padding: '6px 10px' }}>Optional Item</th>
                                <th style={{ padding: '6px 10px', textAlign: 'right' }}>Amount (GHS)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeOptionals.map((opt) => (
                                <tr key={opt.id} style={{ borderBottom: '1px solid #f0f9ff' }}>
                                  <td style={{ padding: '5px 10px', fontWeight: 600, color: '#0369a1' }}>{opt.icon} {opt.details}</td>
                                  <td style={{ padding: '5px 10px', textAlign: 'right', fontWeight: 700 }}>{Number(opt.amount || 0).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Grand Total Due Box */}
                      <div style={{
                        background: '#f0fdf4',
                        border: '2px solid #16a34a',
                        borderRadius: 8,
                        padding: '10px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 16
                      }}>
                        <span style={{ fontSize: 12.5, fontWeight: 900, color: '#166534', textTransform: 'uppercase' }}>
                          TOTAL ACADEMIC BILL DUE FOR {sFullName.toUpperCase()}:
                        </span>
                        <span style={{ fontSize: 19, fontWeight: 900, color: '#15803d' }}>
                          GHS {sTotal.toFixed(2)}
                        </span>
                      </div>

                      {/* Bank Details */}
                      <div style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        padding: '10px 14px',
                        fontSize: 11,
                        color: '#334155',
                        marginBottom: 18,
                        lineHeight: 1.5
                      }}>
                        <div><strong>OFFICIAL BANKING PAYMENT DETAILS:</strong></div>
                        <div>• GCB Bank PLC (Bogoso Branch) · Account No: 7011130001245</div>
                        <div>• Ecobank Ghana PLC · Account No: 1441002390119</div>
                        <div>• MTN Mobile Money: 298410 (REMALJ Carewell School) · Ref: <code>{s.studentId || s.id}</code></div>
                      </div>

                      {/* Signatures */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 8 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ borderBottom: '1px solid #0f172a', width: 170, marginBottom: 4 }}></div>
                          <div style={{ fontWeight: 800, fontSize: 10.5, color: '#0f172a' }}>Headmaster / Principal</div>
                        </div>
                        <div style={{ textAlign: 'center', fontSize: 10, color: '#64748b' }}>
                          Addressed to {sFullName} · Page {idx + 1} of {printPages.length}
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ borderBottom: '1px solid #0f172a', width: 170, marginBottom: 4 }}></div>
                          <div style={{ fontWeight: 800, fontSize: 10.5, color: '#0f172a' }}>Bursar / Accountant Signature</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
