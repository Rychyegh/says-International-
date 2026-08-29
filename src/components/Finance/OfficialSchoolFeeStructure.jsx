import React, { useState } from 'react';
import { Printer, CheckCircle2, DollarSign, BookOpen, Shirt, ShoppingBag, HeartHandshake, Layers } from 'lucide-react';
import { SchoolLogoSVG } from '../Onboarding/OfficialApplicationForm';
import './OfficialSchoolFeeStructure.css';

const FEE_SCHEDULE = {
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
    totalBase: 2500.00,
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
    totalBase: 2500.00,
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
    totalBase: 2550.00,
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
    totalBase: 2650.00,
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
    totalBase: 2650.00,
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
    totalBase: 2750.00,
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
    totalBase: 3100.00,
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

export default function OfficialSchoolFeeStructure() {
  const [selectedClass, setSelectedClass] = useState('Creche / Nursery 1');
  const activeClassData = FEE_SCHEDULE[selectedClass] || FEE_SCHEDULE['Creche / Nursery 1'];

  const uniformsTotal = UNIFORMS_LIST.reduce((acc, u) => acc + u.amount, 0);

  return (
    <div className="fee-structure-container animate-fade-up">
      {/* Header Banner */}
      <div className="fee-header-card">
        <div className="fee-header-brand">
          <SchoolLogoSVG size={100} />
          <div>
            <h1 className="fee-header-title">REMALJ CAREWELL INSPIRATIONAL SCHOOL</h1>
            <p className="fee-header-sub">P. O. BOX 139, BOGOSO • Email: info@remaljschools.com</p>
            <div className="fee-header-badge">OFFICIAL SCHOOL FEES & BILL SCHEDULE</div>
          </div>
        </div>

        <div className="fee-header-actions no-print">
          <button className="fee-btn fee-btn-primary" onClick={() => window.print()}>
            <Printer size={15} /> Print Fee Schedule
          </button>
        </div>
      </div>

      {/* Class Selector Bar */}
      <div className="fee-selector-bar no-print">
        <label className="fee-selector-label">
          <Layers size={16} /> Select Class / Grade Level to View Bill:
        </label>
        <select
          className="fee-selector-dropdown"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
        >
          {Object.keys(FEE_SCHEDULE).map((cls) => (
            <option key={cls} value={cls}>{cls}</option>
          ))}
        </select>
      </div>

      {/* Grid of Typed Tables */}
      <div className="fee-grid">
        {/* Panel 1: Main Term Bill */}
        <div className="fee-panel">
          <div className="fee-panel-header">
            <h2><DollarSign size={18} /> Main Term Bill — {selectedClass}</h2>
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
                {activeClassData.baseBill.map((item, i) => (
                  <tr key={i}>
                    <td>{item.details}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{item.amount.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="fee-table-total">
                  <td>TOTAL BASE BILL</td>
                  <td style={{ textAlign: 'right' }}>GHS {activeClassData.totalBase.toFixed(2)}</td>
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

        {/* Panel 3: Stationery Schedule by Class */}
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

        {/* Panel 4: Others & Learning Materials */}
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
                <tr>
                  <td>UCMAS (KG2 - PRIMARY)</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>295.00</td>
                </tr>
                <tr>
                  <td>SCIENCE SET (UPPER PRIMARY)</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>190.00</td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ fontSize: 13, fontWeight: 800, color: '#0f3a4b', marginTop: 18, marginBottom: 8 }}>
              Optional Payments
            </h3>
            <table className="fee-table">
              <thead>
                <tr>
                  <th>Details</th>
                  <th style={{ textAlign: 'right' }}>Amount (GHS)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>FEEDING FEE</td>
                  <td style={{ textAlign: 'right', color: '#64748b', fontStyle: 'italic' }}>Term Rate (Configured)</td>
                </tr>
                <tr>
                  <td>BUS FEE</td>
                  <td style={{ textAlign: 'right', color: '#64748b', fontStyle: 'italic' }}>Route Rate (Configured)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Material & Baby Requirements Box */}
      <div className="fee-requirements-card">
        <h3 className="fee-req-title"><HeartHandshake size={18} /> SCHOOL REQUIREMENTS & SUPPLIES</h3>
        <div className="fee-req-grid">
          <div className="fee-req-item">
            <CheckCircle2 size={16} className="fee-req-icon" />
            <span><strong>GENERAL REQUIREMENT:</strong> 1 RIM OF A4 PAPER</span>
          </div>

          {activeClassData.isBaby && (
            <div className="fee-req-baby-box">
              <strong>👶 FOR BABY / CRECHE USE:</strong>
              <p>Sponge, Towel, Comb, Toilet Soap, Pomade, Powder, Sponge bag, Extra Cloths</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
