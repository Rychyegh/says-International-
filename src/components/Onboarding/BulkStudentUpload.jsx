import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle, Trash2, Users, FileText, ArrowRight } from 'lucide-react';
import { usePortalData } from '../../data/PortalStore';
import './BulkStudentUpload.css';

export default function BulkStudentUpload({ onComplete }) {
  const { onboardStudentsBulk } = usePortalData();

  const [activeTab, setActiveTab] = useState('file'); // 'file' | 'paste'
  const [pasteText, setPasteText] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedStudents, setParsedStudents] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Helper to parse CSV string into student objects
  const parseCsvContent = (content) => {
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      throw new Error('The file or text provided is empty.');
    }

    // Determine delimiter (comma or tab or semicolon)
    const firstLine = lines[0];
    let delimiter = ',';
    if (firstLine.includes('\t')) delimiter = '\t';
    else if (firstLine.includes(';')) delimiter = ';';

    const rawRows = lines.map(line => line.split(delimiter).map(cell => cell.trim().replace(/^["']|["']$/g, '')));

    let startIndex = 0;
    // Check if first row is header
    const firstCellLower = (rawRows[0][0] || '').toLowerCase();
    if (firstCellLower.includes('name') || firstCellLower.includes('student') || firstCellLower.includes('full')) {
      startIndex = 1;
    }

    const students = [];
    for (let i = startIndex; i < rawRows.length; i++) {
      const row = rawRows[i];
      if (row.length === 0 || !row[0]) continue;

      const fullName = row[0] || '';
      const dob = row[1] || '2014-01-01';
      const gender = row[2] || 'Male';
      const level = row[3] || 'Primary 4';
      const classSection = row[4] || 'A';
      const guardianName = row[5] || 'Guardian';
      const guardianPhone = row[6] || '054 176 9621';
      const guardianEmail = row[7] || 'parent@remaljcarewell.edu.gh';
      const homeAddress = row[8] || 'Bogoso';
      const rfidCardCode = row[9] || `CARD-${Math.floor(100 + Math.random() * 900)}`;

      students.push({
        id: `preview-${i}`,
        fullName,
        dob,
        gender,
        level,
        classSection,
        guardianName,
        guardianPhone,
        guardianEmail,
        homeAddress,
        rfidCardCode,
        isValid: Boolean(fullName && level && guardianName)
      });
    }

    if (students.length === 0) {
      throw new Error('No valid student rows found in the CSV file.');
    }

    return students;
  };

  // Handle File Input Upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setSuccessMsg('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result;
        if (typeof text === 'string') {
          const parsed = parseCsvContent(text);
          setParsedStudents(parsed);
        }
      } catch (err) {
        setErrorMsg(err.message || 'Failed to parse CSV file.');
        setParsedStudents([]);
      }
    };
    reader.readAsText(file);
  };

  // Handle Raw Text Paste Parse
  const handlePasteParse = () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const parsed = parseCsvContent(pasteText);
      setParsedStudents(parsed);
      setFileName('Pasted CSV Data');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to parse pasted data.');
      setParsedStudents([]);
    }
  };

  // Download Sample CSV Template
  const handleDownloadTemplate = () => {
    const sampleCsv = `Full Name, DOB (YYYY-MM-DD), Gender, Class Level, Section, Guardian Name, Guardian Phone, Guardian Email, Home Address, RFID Card Code
Kofi Mensah,2015-04-12,Male,Grade 4,Section A,Mr. Kwame Mensah,0541769621,kwame.mensah@example.com,Bogoso Anikoko,CARD-009
Ama Serwaa,2014-08-20,Female,Primary 5,Section B,Mrs. Akosua Serwaa,0541769621,akosua.serwaa@example.com,Prestea Junction,CARD-010
Yaw Boateng,2013-11-05,Male,JHS 2,Section A,Mr. Kojo Boateng,0541769621,kojo.boateng@example.com,Tarkwa Market,CARD-011`;

    const blob = new Blob([sampleCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'remalj_student_onboarding_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Execute Bulk Onboarding
  const handleConfirmOnboard = async () => {
    if (parsedStudents.length === 0) return;

    setIsProcessing(true);
    setErrorMsg('');
    try {
      const results = await onboardStudentsBulk(parsedStudents);
      setIsProcessing(false);
      setSuccessMsg(`Successfully onboarded ${results.length} students into REMALJ Carewell portal!`);
      setParsedStudents([]);
      setFileName('');
      setPasteText('');
      if (onComplete) onComplete(results);
    } catch (err) {
      setIsProcessing(false);
      setErrorMsg(err.message || 'Bulk onboarding failed. Please try again.');
    }
  };

  // Remove individual row from preview
  const handleRemoveRow = (index) => {
    setParsedStudents(prev => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div className="bulk-upload-card animate-fade-up">
      <div className="bulk-upload-header">
        <div>
          <div className="bulk-badge">
            <FileSpreadsheet size={14} /> BULK STUDENT ONBOARDING
          </div>
          <h2 className="bulk-title">Import Students via CSV / Excel</h2>
          <p className="bulk-subtitle">
            Upload a spreadsheet or CSV list to onboard multiple students at once. Student IDs and Fee Ledgers will be generated automatically.
          </p>
        </div>
        <button type="button" className="btn-template-download" onClick={handleDownloadTemplate}>
          <Download size={15} /> Download Sample CSV Template
        </button>
      </div>

      {/* Tabs */}
      <div className="bulk-tabs">
        <button
          type="button"
          className={`bulk-tab ${activeTab === 'file' ? 'active' : ''}`}
          onClick={() => setActiveTab('file')}
        >
          <Upload size={14} /> Upload File (.CSV / .TXT)
        </button>
        <button
          type="button"
          className={`bulk-tab ${activeTab === 'paste' ? 'active' : ''}`}
          onClick={() => setActiveTab('paste')}
        >
          <FileText size={14} /> Copy & Paste CSV Data
        </button>
      </div>

      {/* File Upload Tab */}
      {activeTab === 'file' && (
        <div className="upload-dropzone">
          <input
            type="file"
            id="csv-file-input"
            accept=".csv, .txt, .tsv"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <label htmlFor="csv-file-input" className="dropzone-label">
            <FileSpreadsheet size={40} className="dropzone-icon" />
            <div className="dropzone-title">
              {fileName ? <strong>Selected File: {fileName}</strong> : 'Click or drag CSV file here to upload'}
            </div>
            <p className="dropzone-hint">Supports CSV files exported from Excel, Google Sheets, or SIMS databases.</p>
            <span className="btn-browse">Browse Files</span>
          </label>
        </div>
      )}

      {/* Paste Data Tab */}
      {activeTab === 'paste' && (
        <div className="paste-zone">
          <textarea
            className="paste-textarea"
            rows={5}
            placeholder={`Paste CSV or Excel text rows here...
Example:
Kofi Mensah, 2015-04-12, Male, Grade 4, A, Mr. Kwame Mensah, 0541769621, kwame@example.com, Bogoso
Ama Serwaa, 2014-08-20, Female, Primary 5, B, Mrs. Akosua Serwaa, 0541769621, akosua@example.com, Prestea`}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
          />
          <button type="button" className="btn-parse-paste" onClick={handlePasteParse} disabled={!pasteText.trim()}>
            Parse Pasted Rows
          </button>
        </div>
      )}

      {/* Error & Success Messages */}
      {errorMsg && (
        <div className="bulk-alert alert-danger">
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="bulk-alert alert-success">
          <CheckCircle2 size={16} /> {successMsg}
        </div>
      )}

      {/* Parsed Preview Table */}
      {parsedStudents.length > 0 && (
        <div className="preview-container">
          <div className="preview-header">
            <div>
              <h3 className="preview-title">
                <Users size={16} /> Preview Parsed Students ({parsedStudents.length} rows ready)
              </h3>
              <p className="preview-desc">Review the student details below before finalizing the onboarding.</p>
            </div>
            <button
              type="button"
              className="btn-confirm-onboard"
              onClick={handleConfirmOnboard}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing Onboarding...' : `Confirm & Onboard All ${parsedStudents.length} Students`} <ArrowRight size={15} />
            </button>
          </div>

          <div className="preview-table-wrap">
            <table className="preview-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Full Name</th>
                  <th>DOB</th>
                  <th>Gender</th>
                  <th>Class Level</th>
                  <th>Section</th>
                  <th>Guardian Name</th>
                  <th>Guardian Phone</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {parsedStudents.map((s, idx) => (
                  <tr key={s.id}>
                    <td>{idx + 1}</td>
                    <td><strong>{s.fullName}</strong></td>
                    <td>{s.dob}</td>
                    <td>{s.gender}</td>
                    <td><span className="level-pill">{s.level}</span></td>
                    <td>{s.classSection}</td>
                    <td>{s.guardianName}</td>
                    <td><code>{s.guardianPhone}</code></td>
                    <td>
                      {s.isValid ? (
                        <span className="status-badge-ready"><CheckCircle2 size={12} /> Ready</span>
                      ) : (
                        <span className="status-badge-warn"><AlertCircle size={12} /> Incomplete</span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-row-remove"
                        onClick={() => handleRemoveRow(idx)}
                        title="Remove student from import list"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
