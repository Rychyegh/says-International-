import React, { useState, useEffect } from 'react';
import {
  FileText, Plus, Search, RotateCcw, Printer, Trash2, Edit, CheckCircle2,
  AlertCircle, ChevronRight, X, Building2, User, Phone, Mail, MapPin, Sparkles, DollarSign
} from 'lucide-react';
import { usePortalData } from '../../data/PortalStore';
import { SchoolLogoSVG } from '../Onboarding/OfficialApplicationForm';

export default function SubmitPVRequest({ setM = () => {} }) {
  const portalData = usePortalData();
  const createPaymentVoucher = portalData?.createPaymentVoucher;
  const storePaymentVouchers = portalData?.paymentVouchers || [];

  // Initial Service Providers list matching reference image
  const [serviceProviders, setServiceProviders] = useState([
    { id: '931001', name: 'Market', address: 'Central Market Depot, Bogoso', email: 'market.supplies@remalj.edu.gh', phone: '+233 24 411 9001' },
    { id: '931002', name: 'MAT-BANS', address: 'Plot 4, Commercial Road, Tarkwa', email: 'info@matbans.com', phone: '+233 20 812 3456' },
    { id: '931003', name: 'Kweku Essuman', address: 'House No. B-12, Bogoso Township', email: 'kweku.essuman@gmail.com', phone: '+233 55 987 6543' },
    { id: '931004', name: 'JONAT', address: 'Jonat Electricals & Hardware, Prestea', email: 'sales@jonathardware.com', phone: '+233 24 333 4455' },
    { id: '931005', name: 'First Info Tech', address: 'Suite 3, Digital Plaza, Takoradi', email: 'support@firstinfotech.gh', phone: '+233 31 202 9900' },
    { id: '931006', name: 'Melcom', address: 'Melcom Superstore, Tarkwa Branch', email: 'tarkwa@melcomgroup.com', phone: '+233 30 277 7000' },
    { id: '931007', name: 'Fenyiwa Stationery', address: 'Fenyiwa Press & Books, Bogoso', email: 'fenyiwastationery@yahoo.com', phone: '+233 24 555 1212' },
    { id: '931008', name: 'Isaac Addae', address: 'Addae Plumbing & Maintenance, Bogoso', email: 'isaac.addae.plumbing@gmail.com', phone: '+233 50 112 8899' },
    { id: '931009', name: 'Plumber', address: 'Master Plumbing Services, Bogoso', email: 'plumbing.services@remalj.edu.gh', phone: '+233 24 777 9900' },
  ]);

  // Selected Service Provider in Manager Panel
  const [selectedProviderInPanel, setSelectedProviderInPanel] = useState(serviceProviders[0]);
  const [providerForm, setProviderForm] = useState({
    name: serviceProviders[0].name,
    address: serviceProviders[0].address,
    email: serviceProviders[0].email,
    telephone: serviceProviders[0].phone
  });

  // Form Fields State (Reference Image match)
  const [pvNo, setPvNo] = useState('51250862');
  const [itemRequisitionNo, setItemRequisitionNo] = useState('REQ-2026-901');
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [academicTerm, setAcademicTerm] = useState('1st Term');
  const [description, setDescription] = useState('BOOKS');
  const [selectedProviderName, setSelectedProviderName] = useState('Market');
  const [providerId, setProviderId] = useState('931001');
  const [datePrepared, setDatePrepared] = useState('2026-09-30');
  const [qty, setQty] = useState('1');
  const [costPerItem, setCostPerItem] = useState('20.00');

  // Draft PV Items List
  const [pvItems, setPvItems] = useState([
    {
      id: 1,
      description: 'BOOKS',
      provider: 'Market',
      providerId: '931001',
      qty: 1,
      costPerItem: 20.00,
      totalAmount: 20.00
    }
  ]);

  // UI Modals & Notifications
  const [successNotice, setSuccessNotice] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPrintMemoOpen, setIsPrintMemoOpen] = useState(false);
  const [printedPV, setPrintedPV] = useState(null);

  // Auto Generate Unique PV Number Function
  const generateUniquePvNumber = () => {
    const existingCount = (storePaymentVouchers || []).length;
    const baseSeq = 51250862 + existingCount * 3 + Math.floor(Math.random() * 9);
    return String(baseSeq);
  };

  useEffect(() => {
    if (!pvNo || pvNo === '51250862') {
      setPvNo(generateUniquePvNumber());
    }
  }, [storePaymentVouchers]);

  // Auto-calculated total amount for current input line
  const currentCalculatedTotal = (parseFloat(qty) || 0) * (parseFloat(costPerItem) || 0);

  // Grand Total of PV Draft Items
  const pvGrandTotal = pvItems.reduce((acc, item) => acc + (item.totalAmount || 0), 0);

  // Synchronize Provider ID when Provider dropdown changes
  const handleProviderSelectChange = (name) => {
    setSelectedProviderName(name);
    const match = serviceProviders.find(p => p.name === name);
    if (match) {
      setProviderId(match.id);
      setSelectedProviderInPanel(match);
      setProviderForm({
        name: match.name,
        address: match.address || '',
        email: match.email || '',
        telephone: match.phone || ''
      });
    }
  };

  // Synchronize when provider clicked in Service Providers list panel
  const handleSelectProviderFromList = (p) => {
    setSelectedProviderInPanel(p);
    setSelectedProviderName(p.name);
    setProviderId(p.id);
    setProviderForm({
      name: p.name,
      address: p.address || '',
      email: p.email || '',
      telephone: p.phone || ''
    });
  };

  // Add new Service Provider in Manager Panel
  const handleAddServiceProvider = (e) => {
    e.preventDefault();
    if (!providerForm.name.trim()) return;
    const newId = String(931000 + serviceProviders.length + 1);
    const newP = {
      id: newId,
      name: providerForm.name.trim(),
      address: providerForm.address.trim() || 'Bogoso',
      email: providerForm.email.trim() || '',
      phone: providerForm.telephone.trim() || ''
    };
    setServiceProviders(prev => [...prev, newP]);
    setSelectedProviderInPanel(newP);
    setSelectedProviderName(newP.name);
    setProviderId(newP.id);
    setSuccessNotice(`✅ Added Service Provider "${newP.name}" (ID: ${newP.id}).`);
    setTimeout(() => setSuccessNotice(''), 4000);
  };

  // Modify Service Provider in Manager Panel
  const handleModifyServiceProvider = () => {
    if (!selectedProviderInPanel) return;
    setServiceProviders(prev => prev.map(p =>
      p.id === selectedProviderInPanel.id
        ? { ...p, name: providerForm.name, address: providerForm.address, email: providerForm.email, phone: providerForm.telephone }
        : p
    ));
    setSelectedProviderName(providerForm.name);
    setSuccessNotice(`✏️ Updated Service Provider "${providerForm.name}".`);
    setTimeout(() => setSuccessNotice(''), 4000);
  };

  // Delete Service Provider in Manager Panel
  const handleDeleteServiceProvider = (id) => {
    const p = serviceProviders.find(item => item.id === id);
    if (window.confirm(`Are you sure you want to delete service provider "${p?.name}"?`)) {
      setServiceProviders(prev => prev.filter(item => item.id !== id));
      if (serviceProviders.length > 1) {
        const fallback = serviceProviders.find(item => item.id !== id);
        if (fallback) handleSelectProviderFromList(fallback);
      }
      setSuccessNotice(`🗑️ Removed service provider "${p?.name}".`);
      setTimeout(() => setSuccessNotice(''), 4000);
    }
  };

  // Reset Form
  const handleResetForm = () => {
    setPvNo(String(Math.floor(50000000 + Math.random() * 40000000)));
    setItemRequisitionNo(`REQ-2026-${Math.floor(100 + Math.random() * 900)}`);
    setDescription('');
    setQty('1');
    setCostPerItem('0.00');
    setPvItems([]);
    setSuccessNotice('🔄 Form reset to new draft.');
    setTimeout(() => setSuccessNotice(''), 3000);
  };

  // Action 1: + Add to PV
  const handleAddToPV = (e) => {
    if (e) e.preventDefault();
    if (!description.trim()) {
      alert('Please enter a Description / Particulars for the expenditure item.');
      return;
    }
    const qtyNum = parseFloat(qty) || 1;
    const costNum = parseFloat(costPerItem) || 0;
    const totalNum = qtyNum * costNum;

    const newItem = {
      id: Date.now(),
      description: description.trim().toUpperCase(),
      provider: selectedProviderName,
      providerId: providerId,
      qty: qtyNum,
      costPerItem: costNum,
      totalAmount: totalNum
    };

    setPvItems(prev => [...prev, newItem]);
    setSuccessNotice(`➕ Added "${newItem.description}" (GHS ${totalNum.toFixed(2)}) to Payment Voucher #${pvNo}.`);
    setTimeout(() => setSuccessNotice(''), 4000);
  };

  // Action 2: Post PV for Approval >>
  const handlePostPVForApproval = () => {
    if (pvItems.length === 0 && !description.trim()) {
      alert('Please add at least one line item to the Payment Voucher before posting.');
      return;
    }

    // Build items to post
    const itemsToPost = pvItems.length > 0 ? pvItems : [{
      id: Date.now(),
      description: description.trim().toUpperCase() || 'EXPENDITURE REQUISITION',
      provider: selectedProviderName,
      providerId: providerId,
      qty: parseFloat(qty) || 1,
      costPerItem: parseFloat(costPerItem) || 0,
      totalAmount: currentCalculatedTotal
    }];

    const totalPVAmount = itemsToPost.reduce((acc, i) => acc + i.totalAmount, 0);

    const newPVRecord = {
      pvNo: pvNo.startsWith('PV-') ? pvNo : `PV-${pvNo}`,
      requisitionNo: itemRequisitionNo,
      academicYear,
      academicTerm,
      provider: selectedProviderName,
      providerId: providerId,
      description: itemsToPost.map(i => `${i.description} (x${i.qty})`).join(', '),
      items: itemsToPost,
      qty: itemsToPost.reduce((acc, i) => acc + i.qty, 0),
      cost: totalPVAmount,
      total: totalPVAmount,
      grandTotal: totalPVAmount,
      datePrepared: datePrepared,
      valuedDate: datePrepared,
      status: 'Pending Audit',
      preparedBy: 'Sub-Admin / Accounts Officer',
      submittedBy: 'Sub-Admin / Accounts Officer',
      auditRemarks: 'Submitted by Sub-Admin. Pending Headmaster Pre-Audit Approval.'
    };


    if (createPaymentVoucher) {
      createPaymentVoucher(newPVRecord);
    }

    setSuccessNotice(`⚡ ✅ Successfully posted Payment Voucher #${newPVRecord.pvNo} (GHS ${totalPVAmount.toFixed(2)}) to Headmaster for Pre-Audit & Approval!`);
    
    // Auto-generate next PV number for subsequent submission
    const currentNum = parseInt(pvNo.replace(/\D/g, ''), 10);
    const nextPV = isNaN(currentNum) ? generateUniquePvNumber() : String(currentNum + 1);
    setPvNo(nextPV);
    setItemRequisitionNo(`REQ-2026-${Math.floor(100 + Math.random() * 900)}`);
    setPvItems([]);
    setDescription('');
    setTimeout(() => setSuccessNotice(''), 7000);
  };

  // Action 3: Print Out PV/Memo //
  const handlePrintOutPVMemo = () => {
    const itemsToPrint = pvItems.length > 0 ? pvItems : [{
      id: Date.now(),
      description: description.trim().toUpperCase() || 'EXPENDITURE REQUISITION',
      provider: selectedProviderName,
      providerId: providerId,
      qty: parseFloat(qty) || 1,
      costPerItem: parseFloat(costPerItem) || 0,
      totalAmount: currentCalculatedTotal
    }];

    const totalPVAmount = itemsToPrint.reduce((acc, i) => acc + i.totalAmount, 0);

    setPrintedPV({
      pvNo: pvNo.startsWith('PV-') ? pvNo : `PV-${pvNo}`,
      requisitionNo: itemRequisitionNo,
      academicYear,
      academicTerm,
      provider: selectedProviderName,
      providerId: providerId,
      items: itemsToPrint,
      totalAmount: totalPVAmount,
      datePrepared: datePrepared
    });
    setIsPrintMemoOpen(true);
  };

  // Action 4: - Reverse PV
  const handleReversePV = () => {
    if (pvItems.length > 0) {
      const lastItem = pvItems[pvItems.length - 1];
      setPvItems(prev => prev.slice(0, -1));
      setSuccessNotice(`↩️ Reversed line item "${lastItem.description}" from PV draft.`);
    } else {
      setSuccessNotice(`↩️ Reversed / Voided Payment Voucher #${pvNo}.`);
    }
    setTimeout(() => setSuccessNotice(''), 4000);
  };

  // Format Date for Display (e.g. Wednesday, September 30, 2026)
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)', color: '#0f172a', paddingBottom: 40 }}>
      {/* Top Banner Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: '#fff',
        padding: '16px 24px',
        borderRadius: 12,
        marginBottom: 20,
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={22} color="#38bdf8" />
            <h1 style={{ fontSize: 20, fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: '#fff' }}>
              Prepare Bills Payables
            </h1>
            <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', background: '#0284c7', color: '#fff', borderRadius: 99 }}>
              SUB-ADMIN PV DESK
            </span>
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0', fontWeight: 500 }}>
            Prepare, audit line items, manage service providers, and post expenditure vouchers for Headmaster approval.
          </p>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successNotice && (
        <div style={{
          padding: '12px 18px',
          background: '#dcfce7',
          border: '1px solid #86efac',
          color: '#166534',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 13,
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <CheckCircle2 size={17} color="#16a34a" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Main Form Layout with Side Window */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 20, alignItems: 'start' }}>
        
        {/* Left Column: PV Form & Line Items Table */}
        <div>
          {/* Top Form Header Inputs (PV #, Search, Requisition #, Reset) */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: 10,
            padding: 16,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 800, fontSize: 12.5, color: '#334155' }}>PV #:</span>
              <input
                type="text"
                value={pvNo}
                onChange={(e) => setPvNo(e.target.value)}
                style={{
                  width: 120,
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid #94a3b8',
                  background: '#fff',
                  fontWeight: 900,
                  color: '#991b1b',
                  fontSize: 13
                }}
              />
              <button
                type="button"
                onClick={() => setPvNo(generateUniquePvNumber())}
                style={{
                  padding: '5px 9px',
                  background: '#0284c7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontWeight: 800,
                  fontSize: 11,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3
                }}
                title="Auto-generate a new unique PV Number"
              >
                <Sparkles size={12} /> Auto
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsSearchModalOpen(true)}
              style={{
                padding: '6px 14px',
                background: '#e2e8f0',
                color: '#1e293b',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              Search PV Records &gt;&gt;
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
              <span style={{ fontWeight: 800, fontSize: 12.5, color: '#334155' }}>Item Requisition #:</span>
              <input
                type="text"
                value={itemRequisitionNo}
                onChange={(e) => setItemRequisitionNo(e.target.value)}
                style={{
                  width: 150,
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  fontWeight: 800,
                  fontSize: 12.5,
                  color: '#0f172a'
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleResetForm}
              style={{
                padding: '6px 14px',
                background: '#e2e8f0',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              Reset
            </button>
          </div>

          {/* Transaction Details Box */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: 10,
            padding: 20,
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            marginBottom: 16
          }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: '#475569', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Transaction Details
            </div>

            {/* Row 1: Academic Year & Academic Term */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Select Current Academic year
                </label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    fontWeight: 700,
                    fontSize: 13,
                    color: '#0f172a'
                  }}
                >
                  <option value="2026/2027">2026/2027</option>
                  <option value="2025/2026">2025/2026</option>
                  <option value="2024/2025">2024/2025</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Select Current Academic term
                </label>
                <select
                  value={academicTerm}
                  onChange={(e) => setAcademicTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    fontWeight: 700,
                    fontSize: 13,
                    color: '#0f172a'
                  }}
                >
                  <option value="1st Term">1st Term</option>
                  <option value="2nd Term">2nd Term</option>
                  <option value="3rd Term">3rd Term</option>
                </select>
              </div>
            </div>

            {/* Row 2: Description & Client/Service Provider & Provider ID */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Description or Particulars (Eg. Prepaid, Cost of Electricity Bill)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. BOOKS, ELECTRICITY BILL, CANTEEN SUPPLIES"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: '#fef2f2',
                    fontWeight: 800,
                    fontSize: 13,
                    color: '#0f172a'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Select Client/Service Provider
                </label>
                <select
                  value={selectedProviderName}
                  onChange={(e) => handleProviderSelectChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    fontWeight: 800,
                    fontSize: 13,
                    color: '#0f172a'
                  }}
                >
                  {serviceProviders.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Service Provider's ID
                </label>
                <input
                  type="text"
                  value={providerId}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: '#f1f5f9',
                    fontWeight: 900,
                    fontSize: 13,
                    color: '#0369a1'
                  }}
                />
              </div>
            </div>

            {/* Row 3: Date Prepared, Qty, Cost Per Item, Total Amount */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 1.2fr 1.2fr', gap: 14, alignItems: 'end' }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Date Prepared
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="date"
                    value={datePrepared}
                    onChange={(e) => setDatePrepared(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      background: '#fef2f2',
                      fontWeight: 700,
                      fontSize: 13,
                      color: '#0f172a'
                    }}
                  />
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 3, fontWeight: 600 }}>
                    {formatDateDisplay(datePrepared)}
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Qty.
                </label>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 8px',
                    textAlign: 'center',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    fontWeight: 800,
                    fontSize: 13,
                    color: '#0f172a'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Cost Per Item (GHS)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costPerItem}
                  onChange={(e) => setCostPerItem(e.target.value)}
                  placeholder="20.00"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    textAlign: 'right',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: '#fef2f2',
                    fontWeight: 800,
                    fontSize: 13,
                    color: '#0f172a'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Total Amount (GHS)
                </label>
                <div style={{
                  padding: '8px 10px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: '#fef2f2',
                  fontWeight: 900,
                  fontSize: 14,
                  textAlign: 'right',
                  color: '#991b1b'
                }}>
                  {currentCalculatedTotal.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Toolbar (Reference Image match) */}
          <div style={{
            background: '#e2e8f0',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            padding: 8,
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 8,
            marginBottom: 20
          }}>
            <button
              type="button"
              onClick={handleAddToPV}
              style={{
                padding: '9px 12px',
                background: '#ffffff',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4
              }}
            >
              <Plus size={14} color="#0369a1" /> + Add to PV
            </button>

            <button
              type="button"
              onClick={handlePostPVForApproval}
              style={{
                padding: '9px 12px',
                background: '#ffffff',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4
              }}
            >
              Post PV for Approval &gt;&gt;
            </button>

            <button
              type="button"
              onClick={handlePrintOutPVMemo}
              style={{
                padding: '9px 12px',
                background: '#ffffff',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4
              }}
            >
              <Printer size={14} color="#0284c7" /> Print Out PV/Memo //
            </button>

            <button
              type="button"
              onClick={handleReversePV}
              style={{
                padding: '9px 12px',
                background: '#ffffff',
                color: '#991b1b',
                border: '1px solid #fca5a5',
                borderRadius: 6,
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4
              }}
            >
              - Reverse PV
            </button>

            <button
              type="button"
              onClick={handleResetForm}
              style={{
                padding: '9px 12px',
                background: '#ffffff',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              Cancel / Close
            </button>
          </div>

          {/* Draft PV Line Items Table */}
          <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                📋 Draft PV Line Items ({pvItems.length})
              </h3>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#0369a1' }}>
                Subtotal GHS: GHS {pvGrandTotal.toFixed(2)}
              </span>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>#</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Description / Particulars</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Service Provider</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>ID</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Cost / Item</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total (GHS)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pvItems.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>
                      No line items added yet. Fill description/cost above and click <strong>"+ Add to PV"</strong>.
                    </td>
                  </tr>
                ) : (
                  pvItems.map((item, idx) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 700 }}>{idx + 1}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 800, color: '#0f172a' }}>{item.description}</td>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#334155' }}>{item.provider}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800, color: '#0284c7' }}>{item.providerId}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800 }}>{item.qty}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>{item.costPerItem.toFixed(2)}</td>
                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 900, color: '#991b1b' }}>
                        {item.totalAmount.toFixed(2)}
                      </td>
                      <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                        <button
                          onClick={() => setPvItems(prev => prev.filter(i => i.id !== item.id))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                {pvItems.length > 0 && (
                  <tr style={{ background: '#f0f9ff', fontWeight: 900 }}>
                    <td colSpan="6" style={{ padding: '10px 10px', textAlign: 'right' }}>TOTAL PV AMOUNT:</td>
                    <td style={{ padding: '10px 10px', textAlign: 'right', fontSize: 14, color: '#0369a1' }}>
                      GHS {pvGrandTotal.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Floating Service Providers Side Window / Manager */}
        <div style={{
          background: '#ffffff',
          border: '2px solid #0284c7',
          borderRadius: 12,
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
          overflow: 'hidden'
        }}>
          {/* Service Providers Header Bar */}
          <div style={{
            background: '#0284c7',
            color: '#ffffff',
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 900, fontSize: 13 }}>
              <span style={{ fontSize: 14 }}>🌸</span> Service Providers
            </div>
            <span style={{ fontSize: 10, background: '#0369a1', color: '#fff', padding: '2px 8px', borderRadius: 99, fontWeight: 800 }}>
              {serviceProviders.length} Vendors
            </span>
          </div>

          <div style={{ padding: 14 }}>
            {/* Service Provider Form */}
            <form onSubmit={handleAddServiceProvider}>
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#475569', marginBottom: 2 }}>
                  Name (Service provider/Client)
                </label>
                <input
                  type="text"
                  value={providerForm.name}
                  onChange={(e) => setProviderForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 700 }}
                />
              </div>

              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#475569', marginBottom: 2 }}>
                  Address
                </label>
                <textarea
                  rows="2"
                  value={providerForm.address}
                  onChange={(e) => setProviderForm(prev => ({ ...prev, address: e.target.value }))}
                  style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 11, fontWeight: 600 }}
                />
              </div>

              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#475569', marginBottom: 2 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={providerForm.email}
                  onChange={(e) => setProviderForm(prev => ({ ...prev, email: e.target.value }))}
                  style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 11 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#475569', marginBottom: 2 }}>
                  Telephone
                </label>
                <input
                  type="text"
                  value={providerForm.telephone}
                  onChange={(e) => setProviderForm(prev => ({ ...prev, telephone: e.target.value }))}
                  style={{ width: '100%', padding: '5px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 11 }}
                />
              </div>

              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    background: '#e2e8f0',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    borderRadius: 4,
                    fontWeight: 800,
                    fontSize: 11,
                    cursor: 'pointer'
                  }}
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={handleModifyServiceProvider}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    background: '#e2e8f0',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    borderRadius: 4,
                    fontWeight: 800,
                    fontSize: 11,
                    cursor: 'pointer'
                  }}
                >
                  Modify
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteServiceProvider(selectedProviderInPanel?.id)}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    background: '#fee2e2',
                    color: '#dc2626',
                    border: '1px solid #fca5a5',
                    borderRadius: 4,
                    fontWeight: 800,
                    fontSize: 11,
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            </form>

            {/* List / Table of Service Providers (Matching Reference Image) */}
            <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: 6 }}>
              <div style={{ padding: '6px 10px', background: '#f1f5f9', fontWeight: 800, fontSize: 11, color: '#334155', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
                <span>Service Provider/Client's Name</span>
                <span>ID</span>
              </div>
              <div>
                {serviceProviders.map((p) => {
                  const isSelected = selectedProviderName === p.name;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleSelectProviderFromList(p)}
                      style={{
                        padding: '6px 10px',
                        fontSize: 12,
                        fontWeight: isSelected ? 900 : 600,
                        background: isSelected ? '#0284c7' : '#ffffff',
                        color: isSelected ? '#ffffff' : '#0f172a',
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>{p.name}</span>
                      <span style={{ fontSize: 10, opacity: 0.85 }}>#{p.id}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Search PV Records Modal */}
      {isSearchModalOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsSearchModalOpen(false); }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)',
            zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
          }}
        >
          <div style={{ maxWidth: 680, width: '100%', background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                🔍 Search PV Records Database
              </h3>
              <button onClick={() => setIsSearchModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} color="#64748b" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Search by PV #, Requisition #, Provider name, Description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, marginBottom: 14 }}
              autoFocus
            />

            <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>PV #</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Provider</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Description</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount (GHS)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {storePaymentVouchers.filter(p =>
                    !searchQuery ||
                    p.pvNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.provider?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>
                        No matching PV records found.
                      </td>
                    </tr>
                  ) : (
                    storePaymentVouchers.filter(p =>
                      !searchQuery ||
                      p.pvNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.provider?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 800, color: '#991b1b' }}>{p.pvNo}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 700 }}>{p.provider}</td>
                        <td style={{ padding: '8px 10px', color: '#475569' }}>{p.description}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800 }}>{(p.total || p.cost || 0).toFixed(2)}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <button
                            onClick={() => {
                              setPvNo(p.pvNo.replace(/^PV-/, ''));
                              setItemRequisitionNo(p.requisitionNo || 'REQ-2026-901');
                              setSelectedProviderName(p.provider || 'Market');
                              setProviderId(p.providerId || '931001');
                              setDescription(p.description || '');
                              setCostPerItem(String(p.cost || p.total || 20));
                              setIsSearchModalOpen(false);
                            }}
                            style={{ padding: '4px 10px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 800, fontSize: 11, cursor: 'pointer' }}
                          >
                            Load Form
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Printable PV Memo Modal */}
      {isPrintMemoOpen && printedPV && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsPrintMemoOpen(false); }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(4px)',
            zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto'
          }}
        >
          <div style={{ maxWidth: 720, width: '100%', background: '#fff', borderRadius: 12, padding: 28, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <SchoolLogoSVG size={50} />
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    REMALJ CAREWELL INSPIRATIONAL SCHOOL
                  </h2>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>
                    OFFICIAL PAYMENT VOUCHER MEMORANDUM
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#991b1b' }}>#{printedPV.pvNo}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Date: {printedPV.datePrepared}</div>
              </div>
            </div>

            {/* Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5, background: '#f8fafc', padding: 14, borderRadius: 8, marginBottom: 20 }}>
              <div><strong>Requisition #:</strong> {printedPV.requisitionNo}</div>
              <div><strong>Academic Term:</strong> {printedPV.academicYear} · {printedPV.academicTerm}</div>
              <div><strong>Service Provider:</strong> {printedPV.provider} (#{printedPV.providerId})</div>
              <div><strong>Prepared By:</strong> Sub-Admin / Accounts Officer</div>
            </div>

            {/* Breakdown Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 20 }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#fff' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>#</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Expenditure Particulars</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Cost / Item</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total (GHS)</th>
                </tr>
              </thead>
              <tbody>
                {printedPV.items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 10px' }}>{idx + 1}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 800 }}>{item.description}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>{item.qty}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{item.costPerItem.toFixed(2)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 900 }}>{item.totalAmount.toFixed(2)}</td>
                  </tr>
                ))}
                <tr style={{ background: '#f1f5f9', fontWeight: 900 }}>
                  <td colSpan="4" style={{ padding: '10px 10px', textAlign: 'right' }}>TOTAL AMOUNT:</td>
                  <td style={{ padding: '10px 10px', textAlign: 'right', fontSize: 14, color: '#0369a1' }}>
                    GHS {printedPV.totalAmount.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Signatures Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, paddingTop: 20, borderTop: '1px dashed #cbd5e1', fontSize: 11, textAlign: 'center' }}>
              <div>
                <div style={{ height: 40, borderBottom: '1px solid #000', marginBottom: 6 }}></div>
                <strong>Prepared By (Sub-Admin)</strong>
              </div>
              <div>
                <div style={{ height: 40, borderBottom: '1px solid #000', marginBottom: 6 }}></div>
                <strong>Pre-Audited By (Headmaster)</strong>
              </div>
              <div>
                <div style={{ height: 40, borderBottom: '1px solid #000', marginBottom: 6 }}></div>
                <strong>Approved / Paid By</strong>
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }} className="no-print">
              <button
                onClick={() => setIsPrintMemoOpen(false)}
                style={{ padding: '9px 18px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                style={{ padding: '9px 20px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Printer size={15} /> Print Memo Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
