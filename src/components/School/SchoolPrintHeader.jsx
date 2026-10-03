import React from 'react';
import SchoolContactDetails from './SchoolContactDetails';
import { SCHOOL_CONTACT } from '../../data/schoolContact';
import './SchoolPrintHeader.css';
export default function SchoolPrintHeader() {
  return <div className="school-print-header">
    <img className="school-print-header__logo" src="/remalj-carewell-logo.jpg" alt="REMALJ Carewell Inspirational School Logo" width="76" height="88" />
    <div className="school-print-header__details">
      <h2>{SCHOOL_CONTACT.name}</h2>
      <SchoolContactDetails />
    </div>
  </div>;
}
