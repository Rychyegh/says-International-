import SchoolContactDetails from '../School/SchoolContactDetails';
import { voucherProviders } from '../../lib/pvProviders.js';
import ViewportModal from '../Modal/ViewportModal';
import RetryRecovery from './RetryRecovery';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText, Plus, Search, RotateCcw, Printer, Trash2, Edit, CheckCircle2,
  AlertCircle, ChevronRight, X, Building2, User, Phone, Mail, MapPin, Sparkles, DollarSign,
  Clock, XCircle, RefreshCw
} from 'lucide-react';
import { usePortalData } from '../../data/PortalStore';
import { api } from '../../services/api';
import { SchoolLogoSVG } from '../Onboarding/OfficialApplicationForm';
import { printPvPage } from '../../data/chartOfAccounts';

export default function SubmitPVRequest({ setM = () => {} }) {
  const portalData = usePortalData();
  const createPaymentVoucher = portalData?.createPaymentVoucher;
  const storePaymentVouchers = portalData?.paymentVouchers || [];
  const storeProviders = portalData?.serviceProviders || [];
  const storeCreateProvider = portalData?.createServiceProvider;
  const storeUpdateProvider = portalData?.updateServiceProvider;
  const storeDeleteProvider = portalData?.deleteServiceProvider;

  // Local fallback cache for service providers
  const serviceProviders = storeProviders || [];

  // Selected Service Provider in Manager Panel
  const [selectedProviderInPanel, setSelectedProviderInPanel] = useState(null);
  const [providerForm, setProviderForm] = useState({
    name: '',
    address: '',
    email: '',
    telephone: ''
  });

  // Modal State for instant Quick-Add Provider right from the dropdown
  const [showAddProviderModal, setShowAddProviderModal] = useState(false);
  const [quickProviderForm, setQuickProviderForm] = useState({
    name: '',
    id: '',
    address: 'Bogoso',
    phone: '',
    email: ''
  });

  // Form Fields State with clean placeholders (no hardcoded defaults)
  const [pvNo, setPvNo] = useState('');
  const [itemRequisitionNo, setItemRequisitionNo] = useState('');
  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [academicTerm, setAcademicTerm] = useState('1st Term');
  const [department, setDepartment] = useState('');
  const [paymentMode, setPaymentMode] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProviderName, setSelectedProviderName] = useState('');
  const [providerId, setProviderId] = useState('');
  const [datePrepared, setDatePrepared] = useState(new Date().toISOString().split('T')[0]);
  const [qty, setQty] = useState('');
  const [costPerItem, setCostPerItem] = useState('');

  // Draft PV Items List (empty by default)
  const [pvItems, setPvItems] = useState([]);

  // UI Modals & Notifications
  const [successNotice, setSuccessNotice] = useState('');
  const [providerNotice, setProviderNotice] = useState('');
  const [providerBusy, setProviderBusy] = useState(false);
  const providerLock = useRef(false);
  const pvLock = useRef(false);
  const [postingPV, setPostingPV] = useState(false);
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

  const formatOfficialPvNo = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/^PV-\d{4}-\d+/i.test(raw)) return raw.toUpperCase();
    const year = new Date().getFullYear();
    const digits = raw.replace(/^PV-/i, '').replace(/\s+/g, '');
    return `PV-${year}-${digits}`;
  };

  useEffect(() => {
    if (!pvNo) {
      setPvNo(generateUniquePvNumber());
    }
  }, [storePaymentVouchers]);

  // Auto-calculated total amount for current input line
  const currentCalculatedTotal = (parseFloat(qty) || 0) * (parseFloat(costPerItem) || 0);

  // Grand Total of PV Draft Items
  const pvGrandTotal = pvItems.reduce((acc, item) => acc + (item.totalAmount || 0), 0);

  // Status Tracker State & Helpers for Sub-Admin
  const [statusFilter, setStatusFilter] = useState('All'); // 'All' | 'Pending' | 'Approved' | 'Declined'
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);

  const handleRefreshStatus = async () => {
    setIsRefreshingStatus(true);
    try {
      await portalData.refreshPaymentVoucherDesk();
      setSuccessNotice('🔄 Synchronized latest PV approval and disbursement statuses.');
      setTimeout(() => setSuccessNotice(''), 3500);
    } catch (e) {
      setSuccessNotice(`Status refresh failed: ${e.message}`);
    } finally {
      setIsRefreshingStatus(false);
    }
  };

  const renderPvStatusBadge = (status, remarks) => {
    const s = (status || '').toLowerCase();
    if (['approved', 'validated'].includes(s)) {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 800,
          background: '#dcfce7', color: '#166534', border: '1px solid #86efac'
        }} title={remarks ? `Headmaster remarks: ${remarks}` : 'Approved by Headmaster'}>
          <CheckCircle2 size={12} color="#16a34a" /> Approved
        </span>
      );
    }
    if (s.includes('declin') || s.includes('reject')) {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 800,
          background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5'
        }} title={remarks ? `Decline reason: ${remarks}` : 'Declined by Headmaster'}>
          <XCircle size={12} color="#dc2626" /> Declined
        </span>
      );
    }
    if (s.includes('disburs') || s.includes('paid')) {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 800,
          background: '#f3e8ff', color: '#6b21a8', border: '1px solid #d8b4fe'
        }}>
          <DollarSign size={12} color="#7c3aed" /> Disbursed
        </span>
      );
    }
    if (s.includes('cancel')) {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 800,
          background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1'
        }}>
          Cancelled
        </span>
      );
    }
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 800,
        background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d'
      }} title="Awaiting Headmaster Pre-Audit Review">
        <Clock size={12} color="#d97706" /> Pending Pre-Audit
      </span>
    );
  };

  // Synchronize Provider ID when Provider dropdown changes
  const handleProviderSelectChange = (id) => {
    if (id === '__NEW_PROVIDER__') {
      const nextId = String(931000 + serviceProviders.length + 1);
      setQuickProviderForm({
        name: '',
        id: '',
        address: 'Bogoso',
        phone: '',
        email: ''
      });
      setShowAddProviderModal(true);
      return;
    }
    const match = serviceProviders.find(p => String(p.id) === id);
    setSelectedProviderName(match?.name || '');
    if (match) {
      setProviderId(match.id);
      setSelectedProviderInPanel(match);
      setProviderForm({
        name: match.name,
        address: match.address || '',
        email: match.email || '',
        telephone: match.phone || ''
      });
    } else {
      setProviderId('');
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

  // Quick Add Service Provider from Modal (Persisted in DB, Cloud Sync Hub & Local Storage)
  const selectSavedProvider = saved => {
    setSelectedProviderInPanel(saved); setSelectedProviderName(saved.name); setProviderId(saved.id);
    setProviderForm({ name: saved.name, address: saved.address || '', email: saved.email || '', telephone: saved.phone || '' });
  };
  const saveProvider = async (form, updateId = null) => {
    if (providerLock.current) return;
    providerLock.current = true; setProviderBusy(true); setProviderNotice('');
    try {
      if (!form.name.trim()) throw new Error('Enter the provider name.');
      const payload = { name: form.name.trim(), address: form.address, email: form.email, phone: form.phone || form.telephone };
      const saved = updateId ? await storeUpdateProvider(updateId, payload) : await storeCreateProvider(payload);
      selectSavedProvider(saved);
      setProviderNotice('Provider saved and selected. It is available in Select or Add Provider.');
      setShowAddProviderModal(false);
    } catch (error) { setProviderNotice(`Provider save failed: ${error.message}`); }
    finally { providerLock.current = false; setProviderBusy(false); }
  };
  const handleSaveQuickProvider = async e => { e.preventDefault(); await saveProvider(quickProviderForm); };
  const handleAddServiceProvider = async e => { e.preventDefault(); await saveProvider(providerForm); };
  const handleModifyServiceProvider = async () => {
    if (!selectedProviderInPanel) { setProviderNotice('Select a saved provider before modifying it.'); return; }
    await saveProvider(providerForm, selectedProviderInPanel.id);
  };
  const handleDeleteServiceProvider = async id => {
    if (!id || providerLock.current || !window.confirm('Delete this service provider?')) return;
    providerLock.current = true; setProviderBusy(true);
    try {
      await storeDeleteProvider(id);
      setSelectedProviderInPanel(null); setSelectedProviderName(''); setProviderId('');
      setProviderForm({ name: '', address: '', email: '', telephone: '' });
      setProviderNotice('Provider deleted from the database.');
    } catch (error) { setProviderNotice(`Provider deletion failed: ${error.message}`); }
    finally { providerLock.current = false; setProviderBusy(false); }
  };

  // Reset Form
  const handleResetForm = () => {
    setPvNo(String(Math.floor(50000000 + Math.random() * 40000000)));
    setItemRequisitionNo(`REQ-2026-${Math.floor(100 + Math.random() * 900)}`);
    setDescription('');
    setDepartment('Administration');
    setPaymentMode('Cash');
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
    if (!providerId || !serviceProviders.some(p => p.id === providerId)) { setSuccessNotice('PV validation failed: select a saved provider first.'); return; }
    if (!Number.isInteger(Number(qty)) || Number(qty) <= 0 || !Number.isFinite(Number(costPerItem)) || Number(costPerItem) <= 0) { setSuccessNotice('PV validation failed: enter a positive whole quantity and unit cost.'); return; }
    const cleanQtyStr = String(qty);
    const cleanCostStr = String(costPerItem).replace(/[^0-9.]/g, '');
    const qtyNum = parseInt(cleanQtyStr, 10) || 1;
    const costNum = parseFloat(cleanCostStr) || 0;
    const totalNum = Number((qtyNum * costNum).toFixed(2));

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

  };

  // Action 2: Post PV for Approval >>
  const handlePostPVForApproval = async () => {
    if (pvLock.current) return;
    if (pvItems.length === 0 && !description.trim()) {
      alert('Please add at least one line item to the Payment Voucher before posting.');
      return;
    }

    if (pvItems.length === 0 && (!providerId || !serviceProviders.some(p => p.id === providerId))) { setSuccessNotice('PV validation failed: select a saved provider first.'); return; }
    if (pvItems.length === 0 && (!Number.isInteger(Number(qty)) || Number(qty) <= 0 || !Number.isFinite(Number(costPerItem)) || Number(costPerItem) <= 0)) { setSuccessNotice('PV validation failed: enter a positive whole quantity and unit cost.'); return; }
    const cleanQtyStr = String(qty);
    const cleanCostStr = String(costPerItem).replace(/[^0-9.]/g, '');
    const fallbackQty = parseInt(cleanQtyStr, 10) || 1;
    const fallbackCost = parseFloat(cleanCostStr) || 0;
    const fallbackTotal = Number((fallbackQty * fallbackCost).toFixed(2));

    // Build items to post
    const itemsToPost = pvItems.length > 0 ? pvItems : [{
      id: Date.now(),
      description: description.trim().toUpperCase() || 'EXPENDITURE REQUISITION',
      provider: selectedProviderName,
      providerId: providerId,
      qty: fallbackQty,
      costPerItem: fallbackCost,
      totalAmount: fallbackTotal
    }];

    if (itemsToPost.some(item => !serviceProviders.some(provider => String(provider.id) === String(item.providerId)))) { setSuccessNotice('PV validation failed: each item must have a saved provider.'); return; }
    const providers = voucherProviders(itemsToPost);
    const voucherProviderId = providers.length === 1 ? providers[0].id : null;
    const voucherProviderName = providers.length === 1 ? providers[0].name : 'Multiple providers';
    const totalPVAmount = Number(itemsToPost.reduce((acc, i) => acc + (parseFloat(i.totalAmount) || 0), 0).toFixed(2));

    // FastAPI schema rule: if both amount and unit_cost are provided, amount must equal quantity * unit_cost.
    // For single item: quantity is item.qty, unit_cost is item.costPerItem, amount = quantity * unit_cost.
    // For multi-item voucher: quantity = 1, unit_cost = totalPVAmount, amount = totalPVAmount.
    const isSingleItem = itemsToPost.length === 1;
    const finalQuantity = isSingleItem ? itemsToPost[0].qty : 1;
    const finalUnitCost = isSingleItem ? itemsToPost[0].costPerItem : totalPVAmount;
    const finalAmount = totalPVAmount;

    const newPVRecord = {
      pvNo: formatOfficialPvNo(pvNo),
      requisitionNo: itemRequisitionNo,
      academicYear,
      academicTerm,
      provider: voucherProviderName,
      payee_name: voucherProviderName,
      providerId: voucherProviderId,
      payee_id: voucherProviderId,
      department: department || 'Administration',
      paymentMode: paymentMode || 'Cash',
      payment_mode: paymentMode || 'Cash',
      description: `[${academicYear} · ${academicTerm}] ` + itemsToPost.map(i => `${i.description} (qty ${i.qty} × GHS ${Number(i.costPerItem).toFixed(2)} = GHS ${Number(i.totalAmount).toFixed(2)})`).join('; ') || description.trim() || 'Expenditure Voucher',
      items: itemsToPost,
      qty: finalQuantity,
      quantity: finalQuantity,
      cost: finalUnitCost,
      unit_cost: finalUnitCost,
      total: finalAmount,
      amount: finalAmount,
      grandTotal: finalAmount,
      datePrepared: datePrepared,
      valuedDate: datePrepared,
      status: 'Pending Audit',
      preparedBy: 'Sub-Admin / Accounts Officer',
      submittedBy: 'Sub-Admin / Accounts Officer',
      auditRemarks: 'Submitted by Sub-Admin. Pending Headmaster Pre-Audit Approval.'
    };

    if (createPaymentVoucher) {
      pvLock.current = true; setPostingPV(true); setSuccessNotice('Submitting PV for approval…');
      try {
        const savedPV = await createPaymentVoucher(newPVRecord);
        setSuccessNotice(`⚡ ✅ Successfully posted Payment Voucher #${savedPV.pvNo} (GHS ${totalPVAmount.toFixed(2)}) to Headmaster for Pre-Audit & Approval!`);
        const currentNum = parseInt(pvNo.replace(/\D/g, ''), 10);
        const nextPV = isNaN(currentNum) ? generateUniquePvNumber() : String(currentNum + 1);
        setPvNo(nextPV);
        setItemRequisitionNo(`REQ-2026-${Math.floor(100 + Math.random() * 900)}`);
        setPvItems([]);
        setDescription('');
        setM(null);
      } catch (err) {
        setSuccessNotice(`PV submission failed: ${err?.message || 'Database did not confirm the voucher.'}`);
      } finally { pvLock.current = false; setPostingPV(false); }
    }


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
      pvNo: formatOfficialPvNo(pvNo),
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
      <RetryRecovery onRecovered={async (endpoint, saved) => {
        await portalData.refreshPaymentVoucherDesk();
        if (endpoint === '/finance/service-providers') selectSavedProvider(saved.provider || saved.data || saved);
      }} />
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
        <div role="status" aria-live="polite" style={{
          padding: '12px 18px',
          background: /failed/i.test(successNotice) ? '#fee2e2' : '#dcfce7',
          border: /failed/i.test(successNotice) ? '1px solid #fca5a5' : '1px solid #86efac',
          color: /failed/i.test(successNotice) ? '#991b1b' : '#166534',
          borderRadius: 8,
          fontWeight: 700,
          fontSize: 13,
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <CheckCircle2 size={17} color={/failed/i.test(successNotice) ? '#dc2626' : '#16a34a'} />
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

            {/* Row 1.5: Department & Payment Mode */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Department <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
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
                  required
                >
                  <option value="">-- Select Department --</option>
                  <option value="Administration">Administration</option>
                  <option value="Finance & Accounts">Finance & Accounts</option>
                  <option value="Academic Affairs">Academic Affairs</option>
                  <option value="Estate & Maintenance">Estate & Maintenance</option>
                  <option value="Transport & Logistics">Transport & Logistics</option>
                  <option value="Kitchen & Canteen">Kitchen & Canteen</option>
                  <option value="ICT & Media">ICT & Media</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Payment Mode <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
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
                  required
                >
                  <option value="">-- Select Payment Mode --</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Mobile Money">Mobile Money (MoMo)</option>
                  <option value="Electronic Card">Electronic Card</option>
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
                  placeholder="e.g. Electricity bill, Canteen supplies, Bus maintenance..."
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    fontWeight: 700,
                    fontSize: 13,
                    color: '#0f172a'
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#475569' }}>
                    Select Client/Service Provider <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const nextId = String(931000 + serviceProviders.length + 1);
                      setQuickProviderForm({
                        name: '',
                        id: '',
                        address: 'Bogoso',
                        phone: '',
                        email: ''
                      });
                      setShowAddProviderModal(true);
                    }}
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#15803d',
                      background: '#dcfce7',
                      border: '1px solid #86efac',
                      borderRadius: 4,
                      padding: '2px 8px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                    title="Add a new vendor or service provider to database and all devices"
                  >
                    <Plus size={12} /> Add New Provider
                  </button>
                </div>
                <select
                  aria-label="Select or Add Provider"
                  value={providerId}
                  onChange={(e) => handleProviderSelectChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    fontWeight: 700,
                    fontSize: 13,
                    color: '#0f172a'
                  }}
                >
                  <option value="">-- Select or Add Provider --</option>
                  <option value="__NEW_PROVIDER__" style={{ fontWeight: 800, color: '#15803d', background: '#f0fdf4' }}>
                    ➕ Add New Service Provider...
                  </option>
                  <optgroup label="Registered Vendors & Service Providers">
                    {serviceProviders.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Service Provider's ID
                </label>
                <input
                  type="text"
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  placeholder="ID / Account #"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    fontWeight: 700,
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
                  placeholder="1"
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
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    textAlign: 'right',
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
              disabled={postingPV || providerBusy}
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
              {postingPV ? 'Submitting PV…' : 'Post PV for Approval >>'}
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

          {/* ── SUBMITTED PVS & HEADMASTER APPROVAL STATUS TRACKER ── */}
          {(() => {
            const filteredPVs = storePaymentVouchers.filter(p => {
              const s = (p.status || '').toLowerCase();
              if (statusFilter === 'Pending') return s.includes('pending') || s.includes('draft') || s.includes('postpon') || !s;
              if (statusFilter === 'Approved') return ['approved', 'validated', 'partially approved'].includes(s);
              if (statusFilter === 'Declined') return s.includes('declin') || s.includes('reject') || s.includes('cancel') || s.includes('non-accrual');
              if (statusFilter === 'Disbursed') return s.includes('disburs') || s === 'paid';
              return true;
            });
            const pendingCount = storePaymentVouchers.filter(p => {
              const s = (p.status || '').toLowerCase();
              return s.includes('pending') || s.includes('draft') || s.includes('postpon') || !s;
            }).length;
            const approvedCount = storePaymentVouchers.filter(p => {
              const s = (p.status || '').toLowerCase();
              return ['approved', 'validated', 'partially approved'].includes(s);
            }).length;
            const declinedCount = storePaymentVouchers.filter(p => {
              const s = (p.status || '').toLowerCase();
              return s.includes('declin') || s.includes('reject') || s.includes('cancel');
            }).length;
            const disbursedCount = storePaymentVouchers.filter(p => {
              const s = (p.status || '').toLowerCase();
              return s.includes('disburs') || s === 'paid';
            }).length;

            return (
              <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 10, padding: 16, marginTop: 16, boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <h3 style={{ fontSize: 13.5, fontWeight: 900, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>📑</span> Submitted Payment Vouchers &amp; Approval Status Tracker ({filteredPVs.length})
                    </h3>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      Track Headmaster pre-audit decisions and Pay PV disbursements. Status updates live when Head Admin acts.
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {[
                      { key: 'All', label: `All (${storePaymentVouchers.length})` },
                      { key: 'Pending', label: `⏳ Pending (${pendingCount})` },
                      { key: 'Approved', label: `✅ Approved (${approvedCount})` },
                      { key: 'Disbursed', label: `💸 Disbursed (${disbursedCount})` },
                      { key: 'Declined', label: `❌ Declined (${declinedCount})` },
                    ].map(tab => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setStatusFilter(tab.key)}
                        style={{
                          padding: '4px 9px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 800,
                          border: 'none',
                          cursor: 'pointer',
                          background: statusFilter === tab.key ? '#0284c7' : '#f1f5f9',
                          color: statusFilter === tab.key ? '#fff' : '#475569'
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={handleRefreshStatus}
                      disabled={isRefreshingStatus}
                      style={{
                        padding: '4px 9px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 800,
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        color: '#0f172a',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                      title="Fetch live approval statuses from backend"
                    >
                      <RefreshCw size={11} className={isRefreshingStatus ? 'animate-spin' : ''} />
                      {isRefreshingStatus ? '...' : 'Refresh'}
                    </button>
                  </div>
                </div>

                <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                        <th style={{ padding: '7px 9px', textAlign: 'left' }}>PV #</th>
                        <th style={{ padding: '7px 9px', textAlign: 'left' }}>Date</th>
                        <th style={{ padding: '7px 9px', textAlign: 'left' }}>Payee / Description</th>
                        <th style={{ padding: '7px 9px', textAlign: 'right' }}>Amount (GHS)</th>
                        <th style={{ padding: '7px 9px', textAlign: 'center' }}>Approval Status</th>
                        <th style={{ padding: '7px 9px', textAlign: 'left' }}>Headmaster Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPVs.length === 0 ? (
                        <tr>
                          <td colSpan="6" style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>
                            No payment vouchers found in this category.
                          </td>
                        </tr>
                      ) : (
                        filteredPVs.map((pv, idx) => (
                          <tr key={pv.id || idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                            <td style={{ padding: '7px 9px', fontWeight: 900, color: '#991b1b' }}>{pv.pvNo}</td>
                            <td style={{ padding: '7px 9px', color: '#64748b' }}>{pv.datePrepared || '—'}</td>
                            <td style={{ padding: '7px 9px' }}>
                              <div style={{ fontWeight: 800, color: '#0f172a' }}>{pv.provider}</div>
                              <div style={{ fontSize: 10.5, color: '#64748b' }}>{pv.description}</div>
                            </td>
                            <td style={{ padding: '7px 9px', textAlign: 'right', fontWeight: 900, color: '#0369a1' }}>
                              {(pv.total || pv.cost || pv.grandTotal || 0).toFixed(2)}
                            </td>
                            <td style={{ padding: '7px 9px', textAlign: 'center' }}>
                              {renderPvStatusBadge(pv.status, pv.auditRemarks)}
                            </td>
                            <td style={{ padding: '7px 9px', fontSize: 11, color: (pv.auditRemarks || pv.disbursementNotes) ? '#0f172a' : '#94a3b8' }}>
                              {pv.auditRemarks || pv.disbursementNotes || 'Pending review...'}
                              {pv.approvedBy && (
                                <div style={{ fontSize: 10, color: '#0284c7', marginTop: 1, fontWeight: 700 }}>
                                  Actioned by: {pv.approvedBy} {pv.approvedAt ? `(${pv.approvedAt})` : ''}
                                </div>
                              )}
                              {(String(pv.status || '').toLowerCase().includes('disburs') || pv.disbursedBy) && (
                                <div style={{ fontSize: 10, color: '#6b21a8', marginTop: 1, fontWeight: 700 }}>
                                  Disbursed by: {pv.disbursedBy || 'Head Admin'} {pv.disbursedAt ? `(${pv.disbursedAt})` : ''}
                                  {pv.disbursementReference ? ` · Ref ${pv.disbursementReference}` : ''}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
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
            {providerNotice && <p role="status" style={{ color: /failed/i.test(providerNotice) ? '#b91c1c' : '#166534' }}>{providerNotice}</p>}
            <form onSubmit={handleAddServiceProvider} aria-label="Service provider form">
              <fieldset disabled={providerBusy} style={{ border: 0, padding: 0, margin: 0 }}>
              <div style={{ marginBottom: 8 }}>
                <label style={{ display: 'block', fontSize: 10.5, fontWeight: 800, color: '#475569', marginBottom: 2 }}>
                  Name (Service provider/Client)
                </label>
                <input
                  type="text"
                  value={providerForm.name}
                  onChange={(e) => setProviderForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Market Depot / Vendor Name"
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
                  placeholder="e.g. Plot 4, Commercial Road, Tarkwa"
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
                  placeholder="e.g. vendor@example.com"
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
                  placeholder="e.g. +233 24 000 0000"
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
              </fieldset>
            </form>

            {/* List / Table of Service Providers (Matching Reference Image) */}
            <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: 6 }}>
              <div style={{ padding: '6px 10px', background: '#f1f5f9', fontWeight: 800, fontSize: 11, color: '#334155', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
                <span>Service Provider/Client's Name</span>
                <span>ID</span>
              </div>
              <div>
                {serviceProviders.map((p) => {
                  const isSelected = providerId === p.id;
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
        <ViewportModal
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
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Date</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Provider / Particulars</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>Amount (GHS)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Approval Status</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>Headmaster Remarks</th>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {storePaymentVouchers.filter(p =>
                    !searchQuery ||
                    p.pvNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.provider?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.status?.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>
                        No matching PV records found.
                      </td>
                    </tr>
                  ) : (
                    storePaymentVouchers.filter(p =>
                      !searchQuery ||
                      p.pvNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.provider?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      p.status?.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 800, color: '#991b1b' }}>{p.pvNo}</td>
                        <td style={{ padding: '8px 10px', color: '#64748b', fontSize: 11 }}>{p.datePrepared || '—'}</td>
                        <td style={{ padding: '8px 10px' }}>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{p.provider}</div>
                          <div style={{ fontSize: 11, color: '#475569' }}>{p.description}</div>
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 800, color: '#0369a1' }}>
                          {(p.total || p.cost || p.grandTotal || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          {renderPvStatusBadge(p.status, p.auditRemarks)}
                        </td>
                        <td style={{ padding: '8px 10px', fontSize: 11, color: p.auditRemarks ? '#0f172a' : '#94a3b8' }}>
                          {p.auditRemarks || 'Pending review...'}
                          {p.approvedBy && (
                            <div style={{ fontSize: 10, color: '#0284c7', marginTop: 1, fontWeight: 700 }}>
                              By: {p.approvedBy}
                            </div>
                          )}
                        </td>
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
        </ViewportModal>
      )}

      {/* Printable PV Memo Modal */}
      {isPrintMemoOpen && printedPV && (
        <ViewportModal
          className="pv-print-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setIsPrintMemoOpen(false); }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(4px)',
            zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto'
          }}
        >
          <div className="pv-print-page" style={{ maxWidth: 720, width: '100%', background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #0f172a', paddingBottom: 10, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <SchoolLogoSVG size={36} />
                <div>
                  <h2 style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                    REMALJ CAREWELL INSPIRATIONAL SCHOOL
                  </h2>
              <SchoolContactDetails />
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#475569' }}>
                    PAYMENT VOUCHER
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: '#991b1b' }}>#{printedPV.pvNo}</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>{printedPV.datePrepared}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11, background: '#f8fafc', padding: 10, borderRadius: 6, marginBottom: 12 }}>
              <div><strong>Requisition:</strong> {printedPV.requisitionNo}</div>
              <div><strong>Term:</strong> {printedPV.academicYear} · {printedPV.academicTerm}</div>
              <div style={{ gridColumn: 'span 2' }}><strong>Payee:</strong> {printedPV.provider}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, marginBottom: 12 }}>
              <thead>
                <tr style={{ background: '#0f172a', color: '#fff' }}>
                  <th style={{ padding: '5px 8px', textAlign: 'left' }}>#</th>
                  <th style={{ padding: '5px 8px', textAlign: 'left' }}>Particulars</th>
                  <th style={{ padding: '5px 8px', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '5px 8px', textAlign: 'right' }}>Rate</th>
                  <th style={{ padding: '5px 8px', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {printedPV.items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '6px 8px' }}>{idx + 1}</td>
                    <td style={{ padding: '6px 8px', fontWeight: 800 }}>{item.description}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'center' }}>{item.qty}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right' }}>{Number(item.costPerItem || 0).toFixed(2)}</td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 900 }}>{Number(item.totalAmount || 0).toFixed(2)}</td>
                  </tr>
                ))}
                <tr style={{ background: '#f1f5f9', fontWeight: 900 }}>
                  <td colSpan="4" style={{ padding: '6px 8px', textAlign: 'right' }}>TOTAL</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right', color: '#0369a1' }}>
                    GHS {Number(printedPV.totalAmount || 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, paddingTop: 8, borderTop: '1px dashed #cbd5e1', fontSize: 10, textAlign: 'center' }}>
              <div>
                <div style={{ height: 22, borderBottom: '1px solid #000', marginBottom: 4 }}></div>
                <strong>Prepared By</strong>
              </div>
              <div>
                <div style={{ height: 22, borderBottom: '1px solid #000', marginBottom: 4 }}></div>
                <strong>Audited By</strong>
              </div>
              <div>
                <div style={{ height: 22, borderBottom: '1px solid #000', marginBottom: 4 }}></div>
                <strong>Approved / Paid</strong>
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
                onClick={() => printPvPage()}
                style={{ padding: '9px 20px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Printer size={15} /> Print Memo Slip
              </button>
            </div>
          </div>
        </ViewportModal>
      )}

      {/* Quick Add Service Provider Modal (Instantly saves to DB & Syncs across all devices) */}
      {showAddProviderModal && (
        <ViewportModal onClose={() => setShowAddProviderModal(false)} style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            width: '100%',
            maxWidth: 520,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              color: '#ffffff',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  background: '#22c55e',
                  color: '#ffffff',
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Create New Service Provider</h3>
                  <p style={{ margin: 0, fontSize: 11.5, color: '#94a3b8' }}>
                    Stored in database & instantly visible across all devices
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddProviderModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveQuickProvider} aria-label="Quick provider form" style={{ padding: 22 }}>
              {providerNotice && <p role="alert">{providerNotice}</p>}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Company / Provider Name <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={quickProviderForm.name}
                  onChange={(e) => setQuickProviderForm({ ...quickProviderForm, name: e.target.value })}
                  placeholder="e.g. ECG Bogoso, Aunti Lizzy, Isaac Addae..."
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    fontSize: 13,
                    fontWeight: 600,
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Provider ID / Account #
                  </label>
                  <input
                    type="text"
                    value="Assigned by the database when saved"
                    readOnly
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      fontSize: 13,
                      fontWeight: 600
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Address / Location
                  </label>
                  <input
                    type="text"
                    value={quickProviderForm.address}
                    onChange={(e) => setQuickProviderForm({ ...quickProviderForm, address: e.target.value })}
                    placeholder="e.g. Bogoso Main Market"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      fontSize: 13
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Telephone Number
                  </label>
                  <input
                    type="tel"
                    value={quickProviderForm.phone}
                    onChange={(e) => setQuickProviderForm({ ...quickProviderForm, phone: e.target.value })}
                    placeholder="e.g. 024 111 2233"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      fontSize: 13
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={quickProviderForm.email}
                    onChange={(e) => setQuickProviderForm({ ...quickProviderForm, email: e.target.value })}
                    placeholder="e.g. vendor@gmail.com"
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      fontSize: 13
                    }}
                  />
                </div>
              </div>

              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 20,
                fontSize: 11.5,
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <Sparkles size={16} color="#0284c7" />
                <span>Once saved, this provider is selected here and is available to other authorized portals after their database refresh.</span>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddProviderModal(false)}
                  style={{
                    padding: '9px 16px',
                    background: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={providerBusy || !quickProviderForm.name.trim()}
                  style={{
                    padding: '9px 20px',
                    background: providerBusy ? '#94a3b8' : '#166534',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 6,
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: providerBusy ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 4px rgba(22, 101, 52, 0.2)'
                  }}
                >
                  {providerBusy ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Saving & Syncing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} /> Save & Select Provider
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </ViewportModal>
      )}
    </div>
  );
}
