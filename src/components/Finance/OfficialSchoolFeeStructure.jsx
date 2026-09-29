import React, { useState, useEffect } from 'react';
import { Printer, CheckCircle2, DollarSign, BookOpen, Layers, Plus, Trash2, FileText, Send, X, UserCheck, Upload, Camera, User, Bus, Utensils, Award, CreditCard, Sparkles, ChevronRight, GraduationCap, Edit3, Save, Check } from 'lucide-react';
import { SchoolLogoSVG } from '../Onboarding/OfficialApplicationForm';
import { usePortalData } from '../../data/PortalStore';
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

  // --- BASIC SCHOOL SUB-LEVELS (BASIC 1A TO 9B) ---
  'Basic 1': {
    levelCategory: 'basic_school',
    subLevelName: 'Basic 1',
    baseBill: makeBaseBill(1350.00),
    optionalBills: makeOptionalBills(1365.00, 'Basic 1'),
    stationery: 1365.00,
    ucmas: 295.00,
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

export default function OfficialSchoolFeeStructure({ onOpenSimsModal }) {
  const portalData = usePortalData();
  const onboardedStudents = portalData?.onboardedStudents || [];
  const studentFees = portalData?.studentFees || [];

  const [feeSchedule, setFeeSchedule] = useState(INITIAL_FEE_SCHEDULE);
  const [stationerySchedule, setStationerySchedule] = useState(INITIAL_STATIONERY_SCHEDULE);
  const [stationeryFilter, setStationeryFilter] = useState('all'); // 'all' | 'nursery_creche' | 'kindergarten' | 'basic_school'
  const [editingStationeryClass, setEditingStationeryClass] = useState(null);
  const [savedStationeryNotice, setSavedStationeryNotice] = useState('');

  // Two-tiered Class Level Selection State
  const [selectedGradeCategory, setSelectedGradeCategory] = useState('nursery_creche'); // 'nursery_creche' | 'kindergarten' | 'basic_school'
  const [selectedSubLevel, setSelectedSubLevel] = useState('Creche');
  
  const [successMsg, setSuccessMsg] = useState('');

  // Add Fee Item Modal State
  const [isAddingFeeModal, setIsAddingFeeModal] = useState(false);
  const [newFeeForm, setNewFeeForm] = useState({ details: '', amount: '', isOptional: false });

  // Prepare & View Student Bill Modal State
  const [preparingStudentBill, setPreparingStudentBill] = useState(null);
  const [selectedStudentOptionalIds, setSelectedStudentOptionalIds] = useState(['opt_motivation', 'opt_bus', 'opt_feeding', 'opt_stationery', 'opt_pickup_card']);

  // Post Bill Modal State
  const [isPostingModalOpen, setIsPostingModalOpen] = useState(false);
  const [postTargetScope, setPostTargetScope] = useState('class'); // 'class_level' | 'class' | 'subclass' | 'all' | 'student'
  const [selectedPostingCategory, setSelectedPostingCategory] = useState('basic_school');
  const [selectedPostingClass, setSelectedPostingClass] = useState('Basic 1');
  const [selectedPostingSubClass, setSelectedPostingSubClass] = useState('1A');
  const [postingStudentSearch, setPostingStudentSearch] = useState('');
  const [selectedPostingStudent, setSelectedPostingStudent] = useState(null);
  const [postIncludeOptional, setPostIncludeOptional] = useState(true);

  // Active Category & SubLevels
  const activeCategoryObj = GRADE_LEVEL_CATEGORIES.find(c => c.id === selectedGradeCategory) || GRADE_LEVEL_CATEGORIES[0];
  const activeSubLevels = activeCategoryObj.subLevels;

  // Active Class Data Lookup
  const selectedClassKey = selectedSubLevel || activeSubLevels[0]?.id || 'Creche';
  const activeClassData = feeSchedule[selectedClassKey] || feeSchedule[selectedClassKey.replace(/[AB]$/, '')] || feeSchedule['Creche'] || { baseBill: [], optionalBills: [] };
  
  const baseBillItems = activeClassData.baseBill || [];
  const optionalBillItems = activeClassData.optionalBills || [];

  const totalBase = baseBillItems.reduce((acc, item) => acc + Number(item.amount || 0), 0);
  const totalOptionalActive = optionalBillItems.filter(o => o.enabled).reduce((acc, item) => acc + Number(item.amount || 0), 0);

  // Handle Category Change (Auto-selects first sub-level in category)
  const handleCategoryChange = (categoryId) => {
    setSelectedGradeCategory(categoryId);
    const cat = GRADE_LEVEL_CATEGORIES.find(c => c.id === categoryId);
    if (cat && cat.subLevels.length > 0) {
      setSelectedSubLevel(cat.subLevels[0].id);
    }
  };

  // Sync with selected student class level
  const handleSelectStudentForBill = (student) => {
    if (!student) {
      setPreparingStudentBill(null);
      return;
    }
    setPreparingStudentBill(student);

    const sLevel = (student.level || '').toLowerCase();
    
    // Auto match category and sub-level
    if (sLevel.includes('creche')) {
      setSelectedGradeCategory('nursery_creche');
      setSelectedSubLevel('Creche');
    } else if (sLevel.includes('nursery 2')) {
      setSelectedGradeCategory('nursery_creche');
      setSelectedSubLevel('Nursery 2');
    } else if (sLevel.includes('nursery')) {
      setSelectedGradeCategory('nursery_creche');
      setSelectedSubLevel('Nursery 1');
    } else if (sLevel.includes('kg 2') || sLevel.includes('kindergarten 2')) {
      setSelectedGradeCategory('kindergarten');
      setSelectedSubLevel('Kindergarten 2');
    } else if (sLevel.includes('kg') || sLevel.includes('kindergarten')) {
      setSelectedGradeCategory('kindergarten');
      setSelectedSubLevel('Kindergarten 1');
    } else if (sLevel.includes('grade 1') || sLevel.includes('basic 1') || sLevel.includes('primary 1')) {
      setSelectedGradeCategory('basic_school');
      setSelectedSubLevel('Grade 1');
    } else if (sLevel.includes('grade 2') || sLevel.includes('basic 2') || sLevel.includes('primary 2')) {
      setSelectedGradeCategory('basic_school');
      setSelectedSubLevel('Grade 2');
    } else if (sLevel.includes('grade 3') || sLevel.includes('basic 3') || sLevel.includes('primary 3')) {
      setSelectedGradeCategory('basic_school');
      setSelectedSubLevel('Grade 3');
    } else if (sLevel.includes('grade 4') || sLevel.includes('basic 4') || sLevel.includes('primary 4')) {
      setSelectedGradeCategory('basic_school');
      setSelectedSubLevel('Grade 4');
    } else if (sLevel.includes('grade 5') || sLevel.includes('basic 5') || sLevel.includes('primary 5')) {
      setSelectedGradeCategory('basic_school');
      setSelectedSubLevel('Grade 5');
    } else if (sLevel.includes('grade 6') || sLevel.includes('basic 6') || sLevel.includes('primary 6')) {
      setSelectedGradeCategory('basic_school');
      setSelectedSubLevel('Grade 6');
    } else if (sLevel.includes('grade 7') || sLevel.includes('jhs 1')) {
      setSelectedGradeCategory('basic_school');
      setSelectedSubLevel('Grade 7');
    } else if (sLevel.includes('grade 8') || sLevel.includes('jhs 2')) {
      setSelectedGradeCategory('basic_school');
      setSelectedSubLevel('Grade 8');
    } else if (sLevel.includes('grade 9') || sLevel.includes('jhs 3')) {
      setSelectedGradeCategory('basic_school');
      setSelectedSubLevel('Grade 9');
    }

    setSelectedStudentOptionalIds(optionalBillItems.filter(o => o.enabled).map(o => o.id));
  };

  // Handle Edit Master Stationery Fee per Class
  const handleUpdateStationeryFee = (targetClassLevel, newAmount) => {
    const val = parseFloat(newAmount);
    if (isNaN(val) || val < 0) return;

    // 1. Update stationerySchedule state
    setStationerySchedule((prev) =>
      prev.map((item) =>
        item.classLevel === targetClassLevel ? { ...item, amount: val } : item
      )
    );

    // 2. Synchronize with feeSchedule for that sub-level
    setFeeSchedule((prev) => {
      const classData = prev[targetClassLevel];
      if (!classData) return prev;

      const updatedClassData = { ...classData, stationery: val };
      
      // Also update opt_stationery in optionalBills
      if (updatedClassData.optionalBills) {
        updatedClassData.optionalBills = updatedClassData.optionalBills.map((opt) =>
          opt.id === 'opt_stationery' ? { ...opt, amount: val } : opt
        );
      }

      return {
        ...prev,
        [targetClassLevel]: updatedClassData
      };
    });

    setSavedStationeryNotice(`✅ Updated Stationery Fee for ${targetClassLevel} to GHS ${val.toFixed(2)}`);
    setTimeout(() => setSavedStationeryNotice(''), 3500);
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
  const handlePostBillToLedger = (targetStudent = null) => {
    let studentToUse = targetStudent;
    let scopeLabel = '';
    let targetStudentsList = [];

    if (postTargetScope === 'student') {
      studentToUse = selectedPostingStudent || preparingStudentBill;
      scopeLabel = studentToUse ? studentToUse.fullName : 'Individual Student';
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

    if (portalData?.postAcademicBill) {
      portalData.postAcademicBill({
        studentId: studentToUse?.studentId || studentToUse?.id || null,
        studentName: studentToUse?.fullName || null,
        targetStudents: targetStudentsList,
        classLevel: selectedPostingClass || `${activeCategoryObj.name} · ${selectedSubLevel}`,
        items: allItemsToPost,
        totalAmount: totalToPost,
        term: 'Term 1 · 2026'
      });
      const affectedCount = targetStudentsList.length > 0 ? targetStudentsList.length : 1;
      setSuccessMsg(`⚡ Successfully posted Academic Bill of GHS ${totalToPost.toFixed(2)} (${baseBillItems.length} compulsory + ${optionalItemsToPost.length} optional) to ${scopeLabel} (${affectedCount} student accounts)!`);
      setIsPostingModalOpen(false);
      setSelectedPostingStudent(null);
      setPostingStudentSearch('');
      setTimeout(() => setSuccessMsg(''), 7000);
    }
  };

  // Handle Remove Fee Component Item
  const handleRemoveFeeItem = (itemIndex) => {
    const itemToRemove = baseBillItems[itemIndex];
    setFeeSchedule((prev) => {
      const updatedClassData = { ...prev[selectedClassKey] };
      updatedClassData.baseBill = updatedClassData.baseBill.filter((_, idx) => idx !== itemIndex);
      return {
        ...prev,
        [selectedClassKey]: updatedClassData,
      };
    });
    setSuccessMsg(`🗑️ Removed fee component "${itemToRemove.details}" from ${selectedSubLevel} bill schedule.`);
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
      setFeeSchedule((prev) => {
        const updatedClassData = { ...prev[selectedClassKey] };
        updatedClassData.optionalBills = [...(updatedClassData.optionalBills || []), newOpt];
        return { ...prev, [selectedClassKey]: updatedClassData };
      });
      setSuccessMsg(`✅ Added new optional fee "${newOpt.details}" (GHS ${newOpt.amount.toFixed(2)}) to ${selectedSubLevel}.`);
    } else {
      const newItem = { details: newFeeForm.details.trim().toUpperCase(), amount: amountNum };
      setFeeSchedule((prev) => {
        const updatedClassData = { ...prev[selectedClassKey] };
        updatedClassData.baseBill = [...updatedClassData.baseBill, newItem];
        return { ...prev, [selectedClassKey]: updatedClassData };
      });
      setSuccessMsg(`✅ Added new compulsory fee "${newItem.details}" (GHS ${newItem.amount.toFixed(2)}) to ${selectedSubLevel}.`);
    }

    setNewFeeForm({ details: '', amount: '', isOptional: false });
    setIsAddingFeeModal(false);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  // Prepare Printable CSV Export for Student Bill
  const handleExportStudentBillCSV = (student) => {
    const studentOptionalItems = optionalBillItems.filter(o => selectedStudentOptionalIds.includes(o.id));
    const optionalTotal = studentOptionalItems.reduce((acc, o) => acc + o.amount, 0);
    const grandTotal = totalBase + optionalTotal;

    const feeAccount = studentFees.find(f => f.studentId === student.studentId) || { billedAmount: grandTotal, paidAmount: grandTotal, balance: 0, status: 'Paid' };
    
    let csv = `REMALJ CAREWELL INSPIRATIONAL SCHOOL - OFFICIAL STUDENT BILL & STATEMENT\n`;
    csv += `Student Name,${student.fullName}\n`;
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
    link.setAttribute('download', `Official_Bill_${student.fullName.replace(/\s+/g, '_')}_${student.studentId}.csv`);
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
      setSuccessMsg(`📷 Passport photo uploaded and saved for ${preparingStudentBill.fullName}!`);
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
  const studentOptTotal = studentSelectedOpts.reduce((acc, o) => acc + o.amount, 0);
  const studentGrandTotal = totalBase + studentOptTotal;

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
      <div className="fee-header-card">
        <div className="fee-header-brand">
          <img src="/remalj-carewell-logo.jpg" alt="REMALJ Carewell Logo" style={{ height: 68, width: 'auto', borderRadius: 8, border: '2px solid #0284c7', boxShadow: '0 4px 10px rgba(2,132,199,0.2)' }} />
          <div>
            <h1 className="fee-header-title">REMALJ CAREWELL INSPIRATIONAL SCHOOL</h1>
            <p className="fee-header-sub">P. O. BOX 139, BOGOSO • Email: info@remaljschools.com • Phone: 024 111 2222</p>
            <div className="fee-header-badge">OFFICIAL SCHOOL FEES & BILL SCHEDULE (ADMIN & ACCOUNTS CONTROL)</div>
          </div>
        </div>

        <div className="fee-header-actions no-print" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="fee-btn" style={{ background: '#581c87', color: '#fff' }} onClick={() => setIsAddingFeeModal(true)}>
            <Plus size={15} /> Add Fee Item
          </button>

          <button className="fee-btn" style={{ background: '#166534', color: '#fff', fontWeight: 800 }} onClick={() => setIsPostingModalOpen(true)}>
            <FileText size={15} /> ⚡ Post Student Academic Bill
          </button>

          <button className="fee-btn fee-btn-primary" onClick={() => window.print()}>
            <Printer size={15} /> Print Schedule
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

          {/* Quick Enrolled Student Picker */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>
              🧾 Prepare for Student:
            </span>
            <select
              style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #0284c7', fontSize: 12.5, fontWeight: 800, color: '#0f3a4b', background: '#fff', cursor: 'pointer' }}
              onChange={(e) => {
                const found = onboardedStudents.find(s => s.id === e.target.value);
                handleSelectStudentForBill(found);
              }}
              value={preparingStudentBill?.id || ''}
            >
              <option value="">-- Choose Enrolled Student ({onboardedStudents.length}) --</option>
              {onboardedStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.studentId} · {s.level})
                </option>
              ))}
            </select>
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
              const isSubActive = selectedSubLevel === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubLevel(sub.id)}
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
            Active: <strong>{selectedSubLevel}</strong>
          </div>
        </div>
      </div>

      {/* ── OPTIONAL BILLS QUICK-ADD & TOGGLE BAR ── */}
      <div className="no-print" style={{
        background: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: 12,
        padding: '14px 18px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
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
                  <th className="no-print" style={{ width: 80, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {baseBillItems.map((item, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700, color: 'var(--gray-800)' }}>{item.details}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                      {item.amount.toFixed(2)}
                    </td>
                    <td className="no-print" style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeeItem(i)}
                        style={{ padding: '3px 8px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 800 }}
                        title={`Remove ${item.details} from ${selectedSubLevel} bill`}
                      >
                        <Trash2 size={12} /> Remove
                      </button>
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
                  <th className="no-print" style={{ width: 90, textAlign: 'center' }}>Status</th>
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
                      <button
                        type="button"
                        onClick={() => handleToggleOptionalBill(opt.id)}
                        style={{
                          padding: '3px 10px',
                          borderRadius: 6,
                          border: 'none',
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: 'pointer',
                          background: opt.enabled ? '#15803d' : '#e2e8f0',
                          color: opt.enabled ? '#ffffff' : '#64748b'
                        }}
                      >
                        {opt.enabled ? 'Active ✓' : 'Inactive'}
                      </button>
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
                    <td style={{ fontSize: 12, color: '#475569' }}>
                      {s.notes}
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 800, color: '#64748b', fontSize: 12 }}>
                      {s.itemsCount} items
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>GHS</span>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={s.amount}
                          onChange={(e) => handleUpdateStationeryFee(s.classLevel, e.target.value)}
                          style={{
                            width: 95,
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
                          setSelectedSubLevel(s.classLevel);
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

      {/* Prepare & View Individual Student Bill Modal */}
      {preparingStudentBill && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setPreparingStudentBill(null); }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(4px)',
            zIndex: 10000, overflowY: 'auto', padding: '85px 16px 40px',
            display: 'flex', justifyContent: 'center', alignItems: 'flex-start'
          }}
        >
          <div style={{
            width: '100%', maxWidth: 780, background: '#fff', borderRadius: 16,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden',
            animation: 'fadeUp 0.2s ease-out'
          }}>
            {/* Modal Control Header */}
            <div style={{
              background: '#0f172a', padding: '16px 24px', color: '#fff',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }} className="no-print">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={18} color="#38bdf8" />
                <span style={{ fontWeight: 800, fontSize: 15 }}>Official Student Bill & Billing Statement</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  onClick={() => handleExportStudentBillCSV(preparingStudentBill)}
                  style={{ padding: '6px 12px', background: '#1e293b', color: '#38bdf8', border: '1px solid #334155', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                >
                  📥 Export CSV
                </button>
                <button
                  onClick={() => window.print()}
                  style={{ padding: '6px 14px', background: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: 6, fontWeight: 900, fontSize: 12, cursor: 'pointer' }}
                >
                  🖨️ Print Student Bill
                </button>
                <button
                  onClick={() => handlePostBillToLedger(preparingStudentBill)}
                  style={{ padding: '6px 14px', background: '#16a34a', color: '#ffffff', border: 'none', borderRadius: 6, fontWeight: 900, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  ⚡ Post Bill to Student Ledger
                </button>
                <button
                  onClick={() => setPreparingStudentBill(null)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* ── OPTIONAL BILL SELECTION TOGGLES FOR THIS STUDENT ── */}
            <div className="no-print" style={{
              background: '#e0f2fe',
              padding: '12px 24px',
              borderBottom: '1px solid #bae6fd'
            }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#0369a1', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={15} /> Select Optional Bills to Include for {preparingStudentBill.fullName}:
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
                        background: isChecked ? '#0284c7' : '#ffffff',
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
                      <span>{opt.icon} {opt.label} (GHS {opt.amount.toFixed(2)})</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Printable Official Student Bill Document */}
            <div style={{ padding: 32, background: '#fff' }} className="printable-document official-bill-document">
              {/* Document Header */}
              <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: 18, marginBottom: 24 }} className="receipt-header-box">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }} className="receipt-header-inline">
                  <img src="/remalj-carewell-logo.jpg" alt="REMALJ Carewell Logo" style={{ height: 60, width: 'auto', borderRadius: 6, flexShrink: 0 }} className="receipt-logo" />
                  <div style={{ textAlign: 'left' }} className="receipt-school-text">
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', letterSpacing: '0.03em', lineHeight: 1.2 }}>
                      REMALJ CAREWELL INSPIRATIONAL SCHOOL
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginTop: 3 }}>
                      P.O. BOX 139, BOGOSO · PRESTEA HUNI-VALLEY MUNICIPALITY · GHANA
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', marginTop: 12 }}>
                  <div style={{ display: 'inline-block', background: '#0f172a', color: '#fff', padding: '4px 18px', borderRadius: 20, fontSize: 12, fontWeight: 900, letterSpacing: '0.05em' }}>
                    OFFICIAL STUDENT FEE BILL STATEMENT · TERM 1 (2026)
                  </div>
                </div>
              </div>

              {/* Student Metadata Card with Passport Photo */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
                display: 'grid',
                gridTemplateColumns: '95px 1fr 1fr',
                gap: 16,
                alignItems: 'center'
              }}>
                {/* Photo Upload & Preview Frame */}
                <div style={{ textAlign: 'center', position: 'relative' }}>
                  <div style={{
                    width: 82,
                    height: 92,
                    borderRadius: 8,
                    border: '2px dashed #cbd5e1',
                    background: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative',
                    margin: '0 auto',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                  }}>
                    {preparingStudentBill.photo || preparingStudentBill.passportPhoto ? (
                      <img
                        src={preparingStudentBill.photo || preparingStudentBill.passportPhoto}
                        alt={preparingStudentBill.fullName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ color: '#94a3b8', textAlign: 'center', padding: 4 }}>
                        <Upload size={20} style={{ margin: '0 auto 2px auto', display: 'block', color: '#64748b' }} />
                        <span style={{ fontSize: 9, fontWeight: 800, color: '#64748b', display: 'block', lineHeight: 1.1 }}>
                          PASSPORT<br />PHOTO
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Interactive Photo Upload Control */}
                  <label
                    htmlFor="student-bill-photo-input"
                    className="no-print"
                    style={{
                      display: 'inline-block',
                      marginTop: 6,
                      fontSize: 10,
                      fontWeight: 800,
                      color: '#0284c7',
                      background: '#e0f2fe',
                      padding: '3px 8px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      border: '1px solid #bae6fd',
                      transition: 'all 0.2s'
                    }}
                    title="Click to upload student photo"
                  >
                    📷 {preparingStudentBill.photo || preparingStudentBill.passportPhoto ? 'Change' : 'Upload'}
                  </label>
                  <input
                    type="file"
                    id="student-bill-photo-input"
                    accept="image/*"
                    onChange={handleStudentPhotoUpload}
                    style={{ display: 'none' }}
                    className="no-print"
                  />
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Student Name</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', marginTop: 2 }}>{preparingStudentBill.fullName}</div>
                  
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginTop: 10 }}>Student ID Number</div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#1e1b4b', fontFamily: 'monospace' }}>{preparingStudentBill.studentId}</div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Class Level</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginTop: 2 }}>{activeCategoryObj.name} · {selectedSubLevel}</div>

                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginTop: 10 }}>Guardian / Parent</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#334155' }}>{preparingStudentBill.guardianName} ({preparingStudentBill.guardianPhone || '024 111 2222'})</div>
                </div>
              </div>

              {/* Fee Line Items Table */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Section 1: Compulsory Academic Bill ({selectedSubLevel}):
                </h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, marginBottom: 16 }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px', color: '#1e293b' }}>Fee Component Details</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', color: '#1e293b' }}>Billed Amount (GHS)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {baseBillItems.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: '#334155' }}>{item.details}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>{item.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr style={{ background: '#f8fafc', fontWeight: 900, borderTop: '2px solid #cbd5e1' }}>
                      <td style={{ padding: '8px 12px', color: '#0f172a' }}>Compulsory Bill Subtotal:</td>
                      <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: 13.5, color: '#0f172a' }}>GHS {totalBase.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Section 2: Optional Selected Add-ons */}
                {studentSelectedOpts.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: 13, fontWeight: 800, color: '#0369a1', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Section 2: Optional Bills (Motivation, Bus, Feeding, Stationery, Pick Up Card):
                    </h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, marginBottom: 16 }}>
                      <thead>
                        <tr style={{ background: '#e0f2fe', borderBottom: '2px solid #bae6fd', textAlign: 'left' }}>
                          <th style={{ padding: '8px 12px', color: '#0369a1' }}>Optional Component</th>
                          <th style={{ padding: '8px 12px', textAlign: 'right', color: '#0369a1' }}>Amount (GHS)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentSelectedOpts.map((opt) => (
                          <tr key={opt.id} style={{ borderBottom: '1px solid #e0f2fe' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0369a1' }}>
                              {opt.icon} {opt.details} ({opt.label})
                            </td>
                            <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                              {opt.amount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                        <tr style={{ background: '#f0f9ff', fontWeight: 900, borderTop: '2px solid #bae6fd' }}>
                          <td style={{ padding: '8px 12px', color: '#0369a1' }}>Optional Bills Subtotal:</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: 13.5, color: '#0369a1' }}>
                            GHS {studentOptTotal.toFixed(2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Grand Total Summary */}
                <div style={{ background: '#0f172a', color: '#fff', borderRadius: 8, padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 900, fontSize: 14, letterSpacing: '0.03em' }}>
                    GRAND TOTAL TERM BILL PAYABLE:
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#38bdf8' }}>
                    GHS {studentGrandTotal.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Financial Status Summary */}
              {(() => {
                const feeAcc = studentFees.find(f => f.studentId === preparingStudentBill.studentId) || { billedAmount: studentGrandTotal, paidAmount: studentGrandTotal, balance: 0, status: 'Paid' };
                return (
                  <div style={{ background: feeAcc.balance === 0 ? '#f0fdf4' : '#fff1f2', border: `1px solid ${feeAcc.balance === 0 ? '#bbf7d0' : '#fecaca'}`, borderRadius: 12, padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: feeAcc.balance === 0 ? '#166534' : '#991b1b', textTransform: 'uppercase' }}>Payment Status</div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: feeAcc.balance === 0 ? '#14532d' : '#991b1b', marginTop: 2 }}>{feeAcc.status}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--gray-600)' }}>Amount Paid: GHS {feeAcc.paidAmount.toFixed(2)}</div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: feeAcc.balance === 0 ? '#166534' : '#dc2626', marginTop: 2 }}>
                        Outstanding Balance: GHS {feeAcc.balance.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Signatures & Footer */}
              <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 12 }}>
                <div>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>REMALJ Accounts & Finance Office</div>
                  <div style={{ color: '#64748b', fontSize: 11 }}>Official Institutional Bill Invoice</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ borderBottom: '1px solid #0f172a', width: 160, marginBottom: 4 }}></div>
                  <div style={{ fontWeight: 800, fontSize: 11, color: '#0f172a' }}>Bursar / Accountant Signature</div>
                </div>
              </div>
            </div>
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
                              <strong style={{ fontSize: 13, color: '#0f172a' }}>{stu.fullName}</strong>
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
                            {(selectedPostingStudent || preparingStudentBill).fullName}
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
                  GHS {(totalBase + (postIncludeOptional ? totalOptionalActive : 0)).toFixed(2)}
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
    </div>
  );
}
