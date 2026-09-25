import React, { useState } from 'react';
import { Printer, CheckCircle2, DollarSign, BookOpen, Shirt, ShoppingBag, HeartHandshake, Layers, Plus, Trash2, FileText, Send, X, UserCheck, Upload, Camera, User } from 'lucide-react';
import { SchoolLogoSVG } from '../Onboarding/OfficialApplicationForm';
import { usePortalData } from '../../data/PortalStore';
import './OfficialSchoolFeeStructure.css';

const INITIAL_FEE_SCHEDULE = {
  'Creche / Nursery 1': {
    baseBill: [
      { details: 'ADMISSION FEE', amount: 1000.00 },
      { details: 'TUITION FEE', amount: 1200.00 },
      { details: 'PTA DUES', amount: 15.00 },
      { details: 'GNAPS DUES', amount: 20.00 },
      { details: 'MAINTENANCE FEE', amount: 30.00 },
      { details: 'FIRST AID LEVI', amount: 50.00 },
      { details: 'TOILETRIES', amount: 60.00 },
      { details: 'STUDENT\'S CARD SERVICE', amount: 125.00 },
    ],
    stationery: 695.00,
    isBaby: true,
  },
  'Nursery 2': {
    baseBill: [
      { details: 'ADMISSION FEE', amount: 1000.00 },
      { details: 'TUITION FEE', amount: 1200.00 },
      { details: 'PTA DUES', amount: 15.00 },
      { details: 'GNAPS DUES', amount: 20.00 },
      { details: 'MAINTENANCE FEE', amount: 30.00 },
      { details: 'FIRST AID LEVI', amount: 50.00 },
      { details: 'TOILETRIES', amount: 60.00 },
      { details: 'STUDENT\'S CARD SERVICE', amount: 125.00 },
    ],
    stationery: 1180.00,
    isBaby: true,
  },
  'Kindergarten 1 & 2': {
    baseBill: [
      { details: 'ADMISSION FEE', amount: 1000.00 },
      { details: 'TUITION FEE', amount: 1250.00 },
      { details: 'PTA DUES', amount: 15.00 },
      { details: 'GNAPS DUES', amount: 20.00 },
      { details: 'MAINTENANCE FEE', amount: 30.00 },
      { details: 'FIRST AID LEVI', amount: 50.00 },
      { details: 'TOILETRIES', amount: 60.00 },
      { details: 'STUDENT\'S CARD SERVICE', amount: 125.00 },
    ],
    stationery: 1205.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Basic One': {
    baseBill: [
      { details: 'ADMISSION FEE', amount: 1000.00 },
      { details: 'TUITION FEE', amount: 1350.00 },
      { details: 'PTA DUES', amount: 15.00 },
      { details: 'GNAPS DUES', amount: 20.00 },
      { details: 'MAINTENANCE FEE', amount: 30.00 },
      { details: 'FIRST AID LEVI', amount: 50.00 },
      { details: 'TOILETRIES', amount: 60.00 },
      { details: 'STUDENT\'S CARD SERVICE', amount: 125.00 },
    ],
    stationery: 1365.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Basic 2 & 3': {
    baseBill: [
      { details: 'ADMISSION FEE', amount: 1000.00 },
      { details: 'TUITION FEE', amount: 1350.00 },
      { details: 'PTA DUES', amount: 15.00 },
      { details: 'GNAPS DUES', amount: 20.00 },
      { details: 'MAINTENANCE FEE', amount: 30.00 },
      { details: 'FIRST AID LEVI', amount: 50.00 },
      { details: 'TOILETRIES', amount: 60.00 },
      { details: 'STUDENT\'S CARD SERVICE', amount: 125.00 },
    ],
    stationery: 1115.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'Upper Primary (Basic 4 - 6)': {
    baseBill: [
      { details: 'ADMISSION FEE', amount: 1000.00 },
      { details: 'TUITION FEE', amount: 1450.00 },
      { details: 'PTA DUES', amount: 15.00 },
      { details: 'GNAPS DUES', amount: 20.00 },
      { details: 'MAINTENANCE FEE', amount: 30.00 },
      { details: 'FIRST AID LEVI', amount: 50.00 },
      { details: 'TOILETRIES', amount: 60.00 },
      { details: 'STUDENT\'S CARD SERVICE', amount: 125.00 },
    ],
    stationery: 1040.00,
    scienceSet: 190.00,
    ucmas: 295.00,
    isBaby: false,
  },
  'JHS (Junior High School)': {
    baseBill: [
      { details: 'ADMISSION FEE', amount: 1000.00 },
      { details: 'TUITION FEE', amount: 1800.00 },
      { details: 'PTA DUES', amount: 15.00 },
      { details: 'GNAPS DUES', amount: 20.00 },
      { details: 'MAINTENANCE FEE', amount: 30.00 },
      { details: 'FIRST AID LEVI', amount: 50.00 },
      { details: 'TOILETRIES', amount: 60.00 },
      { details: 'STUDENT\'S CARD SERVICE', amount: 125.00 },
    ],
    stationery: 2090.00,
    isBaby: false,
  },
};

const UNIFORMS_LIST = [
  { details: 'OFFICIAL UNIFORM', amount: 250.00 },
  { details: 'PRINT WEAR', amount: 250.00 },
  { details: 'LACOSTE POLO', amount: 100.00 },
  { details: 'HOUSE JERSEY', amount: 100.00 },
  { details: 'PICK UP CARD', amount: 50.00 },
];

const STATIONERY_SCHEDULE = [
  { classLevel: 'CRECHE', amount: 695.00 },
  { classLevel: 'NURSERY 1', amount: 695.00 },
  { classLevel: 'NURSERY 2', amount: 1180.00 },
  { classLevel: 'KINDERGARTEN 1 & 2', amount: 1205.00 },
  { classLevel: 'BASIC ONE', amount: 1365.00 },
  { classLevel: 'BASIC 2 & 3', amount: 1115.00 },
  { classLevel: 'UPPER PRIMARY', amount: 1040.00 },
  { classLevel: 'JHS', amount: 2090.00 },
];

export default function OfficialSchoolFeeStructure({ onOpenSimsModal }) {
  const portalData = usePortalData();
  const onboardedStudents = portalData?.onboardedStudents || [];
  const studentFees = portalData?.studentFees || [];

  const [feeSchedule, setFeeSchedule] = useState(INITIAL_FEE_SCHEDULE);
  const [selectedClass, setSelectedClass] = useState('Creche / Nursery 1');
  const [successMsg, setSuccessMsg] = useState('');

  // Add Fee Item Modal State
  const [isAddingFeeModal, setIsAddingFeeModal] = useState(false);
  const [newFeeForm, setNewFeeForm] = useState({ details: '', amount: '' });

  // Prepare & View Student Bill Modal State
  const [preparingStudentBill, setPreparingStudentBill] = useState(null);

  // Post Bill Modal State
  const [isPostingModalOpen, setIsPostingModalOpen] = useState(false);
  const [postTargetScope, setPostTargetScope] = useState('student'); // 'student' | 'class' | 'all'
  const [postingStudentSearch, setPostingStudentSearch] = useState('');
  const [selectedPostingStudent, setSelectedPostingStudent] = useState(null);

  const activeClassData = feeSchedule[selectedClass] || feeSchedule['Creche / Nursery 1'];
  const baseBillItems = activeClassData.baseBill || [];
  const totalBase = baseBillItems.reduce((acc, item) => acc + Number(item.amount || 0), 0);
  const uniformsTotal = UNIFORMS_LIST.reduce((acc, u) => acc + u.amount, 0);

  // Handle Post Academic Bill to Student Ledger & Accounts
  const handlePostBillToLedger = (targetStudent = null) => {
    const studentToUse = targetStudent || (postTargetScope === 'student' ? (selectedPostingStudent || preparingStudentBill) : null);
    const targetName = studentToUse ? studentToUse.fullName : postTargetScope === 'all' ? 'All Active Students (School-wide)' : `All Enrolled Students in ${selectedClass}`;

    if (portalData?.postAcademicBill) {
      portalData.postAcademicBill({
        studentId: studentToUse?.studentId || studentToUse?.id || null,
        studentName: studentToUse?.fullName || null,
        classLevel: selectedClass,
        items: baseBillItems,
        totalAmount: totalBase,
        term: 'Term 1 · 2026'
      });
      setSuccessMsg(`⚡ Successfully posted Academic Bill of GHS ${totalBase.toFixed(2)} to ${targetName}'s ledger account & financial records!`);
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
      const updatedClassData = { ...prev[selectedClass] };
      updatedClassData.baseBill = updatedClassData.baseBill.filter((_, idx) => idx !== itemIndex);
      return {
        ...prev,
        [selectedClass]: updatedClassData,
      };
    });
    setSuccessMsg(`🗑️ Removed fee component "${itemToRemove.details}" from ${selectedClass} bill schedule.`);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  // Handle Add New Fee Component Item
  const handleAddFeeSubmit = (e) => {
    e.preventDefault();
    if (!newFeeForm.details.trim() || !newFeeForm.amount) return;

    const amountNum = parseFloat(newFeeForm.amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const newItem = { details: newFeeForm.details.trim().toUpperCase(), amount: amountNum };

    setFeeSchedule((prev) => {
      const updatedClassData = { ...prev[selectedClass] };
      updatedClassData.baseBill = [...updatedClassData.baseBill, newItem];
      return {
        ...prev,
        [selectedClass]: updatedClassData,
      };
    });

    setSuccessMsg(`✅ Added new fee component "${newItem.details}" (GHS ${newItem.amount.toFixed(2)}) to ${selectedClass}.`);
    setNewFeeForm({ details: '', amount: '' });
    setIsAddingFeeModal(false);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  // Prepare Printable CSV Export for Student Bill
  const handleExportStudentBillCSV = (student) => {
    const feeAccount = studentFees.find(f => f.studentId === student.studentId) || { billedAmount: totalBase, paidAmount: totalBase, balance: 0, status: 'Paid' };
    
    let csv = `REMALJ CAREWELL INSPIRATIONAL SCHOOL - OFFICIAL STUDENT BILL & STATEMENT\n`;
    csv += `Student Name,${student.fullName}\n`;
    csv += `Student ID,${student.studentId}\n`;
    csv += `Class Level,${student.level}\n`;
    csv += `Guardian Name,${student.guardianName}\n`;
    csv += `Billing Term,Term 1 · 2026 Academic Year\n\n`;
    csv += `Fee Component Details,Amount (GHS)\n`;
    baseBillItems.forEach(item => {
      csv += `"${item.details}",${item.amount.toFixed(2)}\n`;
    });
    csv += `"TOTAL BASE BILL",${totalBase.toFixed(2)}\n\n`;
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
            <div className="fee-header-badge">OFFICIAL SCHOOL FEES & BILL SCHEDULE (ADMIN CONTROL)</div>
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

      {/* Class & Student Bill Preparation Bar */}
      <div className="fee-selector-bar no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label className="fee-selector-label">
            <Layers size={16} /> Select Class / Grade Level:
          </label>
          <select
            className="fee-selector-dropdown"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            {Object.keys(feeSchedule).map((cls) => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray-700)' }}>
            🧾 Prepare Individual Bill for Student:
          </span>
          <select
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--gray-300)', fontSize: 12.5, fontWeight: 800, background: '#fff', cursor: 'pointer' }}
            onChange={(e) => {
              const found = onboardedStudents.find(s => s.id === e.target.value);
              if (found) setPreparingStudentBill(found);
            }}
            value={preparingStudentBill?.id || ''}
          >
            <option value="">-- Select Enrolled Student --</option>
            {onboardedStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.studentId} · {s.level})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Typed Tables */}
      <div className="fee-grid">
        {/* Panel 1: Main Term Bill with Remove & Add */}
        <div className="fee-panel">
          <div className="fee-panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2><DollarSign size={18} /> Main Term Bill — {selectedClass}</h2>
            <button
              onClick={() => setIsAddingFeeModal(true)}
              style={{ padding: '4px 10px', background: '#204d2d', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 800, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              className="no-print"
            >
              <Plus size={13} /> Add Fee Item
            </button>
          </div>
          <div className="fee-panel-body">
            <table className="fee-table">
              <thead>
                <tr>
                  <th>Details & Component</th>
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
                        title={`Remove ${item.details} from ${selectedClass} bill`}
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="fee-table-total">
                  <td>TOTAL BASE BILL ({baseBillItems.length} items)</td>
                  <td style={{ textAlign: 'right', fontSize: 16 }}>GHS {totalBase.toFixed(2)}</td>
                  <td className="no-print"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel 2: Uniforms & Pickup Card */}
        <div className="fee-panel">
          <div className="fee-panel-header">
            <h2><Shirt size={18} /> Uniforms & Pickup Card</h2>
          </div>
          <div className="fee-panel-body">
            <table className="fee-table">
              <thead>
                <tr>
                  <th>Details</th>
                  <th style={{ textAlign: 'right' }}>Amount (GHS)</th>
                </tr>
              </thead>
              <tbody>
                {UNIFORMS_LIST.map((u, i) => (
                  <tr key={i}>
                    <td>{u.details}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{u.amount.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="fee-table-subtotal">
                  <td>FULL UNIFORM & CARD SET TOTAL</td>
                  <td style={{ textAlign: 'right' }}>GHS {uniformsTotal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel 3: Master Stationery Schedule */}
        <div className="fee-panel">
          <div className="fee-panel-header">
            <h2><BookOpen size={18} /> Master Stationery Schedule</h2>
          </div>
          <div className="fee-panel-body">
            <table className="fee-table">
              <thead>
                <tr>
                  <th>Class Level</th>
                  <th style={{ textAlign: 'right' }}>Amount (GHS)</th>
                </tr>
              </thead>
              <tbody>
                {STATIONERY_SCHEDULE.map((s, i) => (
                  <tr key={i} className={selectedClass.toUpperCase().includes(s.classLevel) ? 'fee-row-highlight' : ''}>
                    <td><strong>{s.classLevel}</strong></td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#0284c7' }}>{s.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel 4: Others & Learning Aids */}
        <div className="fee-panel">
          <div className="fee-panel-header">
            <h2><ShoppingBag size={18} /> Others & Special Learning Aids</h2>
          </div>
          <div className="fee-panel-body">
            <table className="fee-table">
              <thead>
                <tr>
                  <th>Details (Stationery / Learning)</th>
                  <th style={{ textAlign: 'right' }}>Amount (GHS)</th>
                </tr>
              </thead>
              <tbody>
                {activeClassData.ucmas && (
                  <tr>
                    <td>UCMAS (MIND & ARITHMETIC)</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{activeClassData.ucmas.toFixed(2)}</td>
                  </tr>
                )}
                {activeClassData.scienceSet && (
                  <tr>
                    <td>SCIENCE EXPERIMENT KIT</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{activeClassData.scienceSet.toFixed(2)}</td>
                  </tr>
                )}
                <tr>
                  <td>STATIONERY SET ({selectedClass})</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{activeClassData.stationery.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
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
                ➕ Add Fee Component ({selectedClass})
              </h3>
              <button onClick={() => setIsAddingFeeModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} color="var(--gray-500)" />
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--gray-600)', marginBottom: 20 }}>
              Add a new custom fee line item (e.g. ADMISSION FEE, TUITION FEE, LIBRARY LEVY, BUS LEVY) to the {selectedClass} schedule.
            </p>

            <form onSubmit={handleAddFeeSubmit}>
              <div className="form-group" style={{ marginBottom: 14 }}>
                <label className="form-label">Fee Component Name / Details</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. ADMISSION FEE 1000.00"
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
                  placeholder="e.g. 1000.00"
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
            width: '100%', maxWidth: 760, background: '#fff', borderRadius: 16,
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
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', marginTop: 2 }}>{preparingStudentBill.level}</div>

                  <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginTop: 10 }}>Guardian / Parent</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#334155' }}>{preparingStudentBill.guardianName} ({preparingStudentBill.guardianPhone || '024 111 2222'})</div>
                </div>
              </div>

              {/* Fee Line Items Table */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Itemized Fee Line Breakdown ({preparingStudentBill.level}):
                </h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                      <th style={{ padding: '10px 14px', color: '#1e293b' }}>Fee Component Details</th>
                      <th style={{ padding: '10px 14px', textAlign: 'right', color: '#1e293b' }}>Billed Amount (GHS)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {baseBillItems.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#334155' }}>{item.details}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>{item.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                    <tr style={{ background: '#f8fafc', fontWeight: 900, borderTop: '2px solid #0f172a' }}>
                      <td style={{ padding: '12px 14px', color: '#0f172a' }}>TOTAL BASE TERM BILL</td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: 15, color: '#0f172a' }}>GHS {totalBase.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Financial Status Summary */}
              {(() => {
                const feeAcc = studentFees.find(f => f.studentId === preparingStudentBill.studentId) || { billedAmount: totalBase, paidAmount: totalBase, balance: 0, status: 'Paid' };
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
            maxWidth: 520, width: '100%', background: '#fff', borderRadius: 16,
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
              This action will debit and post the itemized academic bill for <strong>Term 1 · 2026</strong> directly into the student's ledger account and financial records.
            </p>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 6 }}>TARGET RECIPIENT & SCOPE</div>
              <select
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700, color: '#0f172a' }}
                value={postTargetScope}
                onChange={(e) => setPostTargetScope(e.target.value)}
              >
                <option value="student">🔎 Search & Select Specific Student</option>
                <option value="class">All Enrolled Students in {selectedClass}</option>
                <option value="all">All Active Students (School-wide)</option>
              </select>

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

            <div style={{ background: '#f0fdf4', padding: 14, borderRadius: 10, border: '1px solid #bbf7d0', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#166534' }}>TOTAL BASE BILL TO DEBIT:</span>
                <span style={{ fontSize: 18, fontWeight: 900, color: '#14532d' }}>GHS {totalBase.toFixed(2)}</span>
              </div>
              <div style={{ fontSize: 11, color: '#15803d', marginTop: 4 }}>
                {baseBillItems.length} fee components ({baseBillItems.map(i => i.details).slice(0, 3).join(', ')}...)
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
