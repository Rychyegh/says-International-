import React, { useState, useEffect } from 'react';
import { CheckCircle2, Edit3, Save, Search, AlertCircle, FileCheck, RefreshCw, Filter, ArrowRight, ShieldCheck, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { usePortalData } from '../../data/PortalStore';
import { api } from '../../services/api';

export default function ApprovePVForm({ setM = () => {} }) {
  const portalData = usePortalData();
  const storeVouchers = portalData?.paymentVouchers || [];
  const updatePaymentVoucher = portalData?.updatePaymentVoucher;
  const approvePaymentVoucher = portalData?.approvePaymentVoucher;

  // Default seed queue if store is empty
  const DEFAULT_PVS = [
    {
      id: 'pv-088',
      pvNo: 'PV-2026-088',
      accountName: 'Utility & Substation Account',
      budget: '5000.00',
      actuals: '3200.00',
      batchNo: 'BATCH-2026-09',
      tDate: '2026-09-05',
      vDate: '2026-09-05',
      requisitionNo: 'REQ-99412',
      provider: 'ELECTRICITY COMPANY OF GHANA (ECG)',
      providerId: 'ECG-99310',
      description: 'Cost of Electricity Bill & Utility Substation Maintenance',
      qty: 1,
      cost: 3200.00,
      total: 3200.00,
      datePrepared: '2026-09-05',
      valuedDate: '2026-09-05',
      auditRemarks: 'Pre-audited & verified against monthly meter consumption records. Approved for disbursement.',
      imputer: 'LISAB (Sub-Admin)',
      inputDate: '2026-09-05 10:15',
      status: 'Validated',
      company: 'Remalj Carewell Inspirational School'
    },
    {
      id: 'pv-082',
      pvNo: 'PV-2026-082',
      accountName: 'Canteen & Feeding Account',
      budget: '3000.00',
      actuals: '1850.00',
      batchNo: 'BATCH-2026-09',
      tDate: '2026-09-02',
      vDate: '2026-09-02',
      requisitionNo: 'REQ-99380',
      provider: 'DAILY CANTEEN SUPPLIES LTD',
      providerId: '931043',
      description: 'Weekly Canteen Feeding & Grocery Stock Supply',
      qty: 1,
      cost: 1850.00,
      total: 1850.00,
      datePrepared: '2026-09-02',
      valuedDate: '2026-09-02',
      auditRemarks: 'Pending pre-audit verification by Headmaster.',
      imputer: 'Sub-Admin / Accounts',
      inputDate: '2026-09-02 11:30',
      status: 'Pending approval',
      company: 'Remalj Carewell Inspirational School'
    },
    {
      id: 'pv-075',
      pvNo: 'PV-2026-075',
      accountName: 'Stationery & Printing',
      budget: '2000.00',
      actuals: '1200.00',
      batchNo: 'BATCH-2026-08',
      tDate: '2026-08-28',
      vDate: '2026-08-28',
      requisitionNo: 'REQ-99300',
      provider: 'STATIONERY & PRINTING DEPOT',
      providerId: '931088',
      description: 'Terminal Assessment Paper & Printing Ink Cartridges',
      qty: 5,
      cost: 240.00,
      total: 1200.00,
      datePrepared: '2026-08-28',
      valuedDate: '2026-08-28',
      auditRemarks: 'Pre-audited & Approved',
      imputer: 'Sub-Admin / Accounts',
      inputDate: '2026-08-28 09:45',
      status: 'Validated',
      company: 'Remalj Carewell Inspirational School'
    }
  ];

  const [pvQueue, setPvQueue] = useState(() => {
    try {
      const saved = localStorage.getItem('official_pv_queue');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_PVS;
  });

  // Synchronize with portalStore paymentVouchers & localStorage
  useEffect(() => {
    if (storeVouchers && storeVouchers.length > 0) {
      setPvQueue((prev) => {
        // Merge store vouchers with existing queue items
        const mergedMap = new Map();
        [...prev, ...storeVouchers].forEach(v => {
          const key = (v.pvNo || v.id || '').toLowerCase();
          const existing = mergedMap.get(key) || {};
          mergedMap.set(key, {
            accountName: v.accountName || existing.accountName || 'Expenditure Account',
            budget: v.budget || existing.budget || '0.00',
            actuals: v.actuals || existing.actuals || '0.00',
            batchNo: v.batchNo || existing.batchNo || 'BATCH-2026-01',
            tDate: v.tDate || v.datePrepared || existing.tDate || new Date().toISOString().split('T')[0],
            vDate: v.valuedDate || v.vDate || existing.vDate || new Date().toISOString().split('T')[0],
            imputer: v.imputer || v.preparedBy || existing.imputer || 'Sub-Admin',
            inputDate: v.inputDate || v.datePrepared || existing.inputDate || new Date().toISOString().split('T')[0],
            company: v.company || existing.company || 'Remalj Carewell Inspirational School',
            ...existing,
            ...v,
            status: v.status || existing.status || 'Pending approval'
          });
        });
        const mergedList = Array.from(mergedMap.values());
        try {
          localStorage.setItem('official_pv_queue', JSON.stringify(mergedList));
        } catch (e) {}
        return mergedList;
      });
    }
  }, [storeVouchers]);

  // Selected Active Voucher for Editing/Audit
  const [selectedPvId, setSelectedPvId] = useState(pvQueue[0]?.id || pvQueue[0]?.pvNo || 'pv-088');

  // Toggle for Voucher Particulars & Calculations (Editable by Headmaster Prior to Approval)
  // Requires clicking the Pre-Audit & Editing Station header or selecting a PV from the queue to open
  const [isParticularsOpen, setIsParticularsOpen] = useState(false);

  // Form Fields State
  const [pvNo, setPvNo] = useState(pvQueue[0]?.pvNo || 'PV-2026-088');
  const [itemRequisitionNo, setItemRequisitionNo] = useState(pvQueue[0]?.requisitionNo || 'REQ-99412');
  const [description, setDescription] = useState(pvQueue[0]?.description || 'Cost of Electricity Bill & Utility Substation Maintenance');
  const [datePrepared, setDatePrepared] = useState(pvQueue[0]?.datePrepared || '2026-09-05');
  const [clientProvider, setClientProvider] = useState(pvQueue[0]?.provider || 'ELECTRICITY COMPANY OF GHANA (ECG)');
  const [providerId, setProviderId] = useState(pvQueue[0]?.providerId || 'ECG-99310');
  const [qty, setQty] = useState(String(pvQueue[0]?.qty || 1));
  const [costPerItem, setCostPerItem] = useState(String(pvQueue[0]?.cost || 3200.00));
  const [auditRemarks, setAuditRemarks] = useState(pvQueue[0]?.auditRemarks || 'Pre-audited & verified against monthly meter consumption records.');
  const [valuedDate, setValuedDate] = useState(pvQueue[0]?.valuedDate || '2026-09-05');
  
  // Action Choice Options matching Reference Image: Validated, Pending approval, Postponed, Declined, Cancel PV, Non-accrual
  const [actionChoice, setActionChoice] = useState('Validated');
  const [bannerNotice, setBannerNotice] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const calculatedTotalAmount = (parseFloat(qty) || 0) * (parseFloat(costPerItem) || 0);

  // Format Date Preview
  const formatDatePreview = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  // Populate Form from Voucher object
  const populateFormWithVoucher = (v) => {
    if (!v) return;
    setSelectedPvId(v.id || v.pvNo);
    setPvNo(v.pvNo || '');
    setItemRequisitionNo(v.requisitionNo || v.itemRequisitionNo || '');
    setClientProvider(v.provider || v.clientProvider || '');
    setProviderId(v.providerId || '');
    setDescription(v.description || '');
    setQty(String(v.qty || 1));
    setCostPerItem(Number(v.cost || v.costPerItem || 0).toFixed(2));
    setDatePrepared(v.datePrepared || v.tDate || new Date().toISOString().split('T')[0]);
    setValuedDate(v.valuedDate || v.vDate || new Date().toISOString().split('T')[0]);
    setAuditRemarks(v.auditRemarks || 'Pre-audited & verified by Headmaster.');
    
    // Normalize status for Action Choice
    const statusMap = {
      'Pre-Audited & Approved': 'Validated',
      'Approved': 'Validated',
      'Validated': 'Validated',
      'Pending Audit': 'Pending approval',
      'Pending approval': 'Pending approval',
      'Postponed': 'Postponed',
      'Declined': 'Declined',
      'Cancel PV': 'Cancel PV',
      'Non-accrual': 'Non-accrual'
    };
    setActionChoice(statusMap[v.status] || 'Validated');
    setIsParticularsOpen(true);
  };

  const [isSearching, setIsSearching] = useState(false);

  // Search PV Action by PV Number or Requisition Number across local queue, store & backend
  const handleSearchPV = async (customQuery) => {
    setIsParticularsOpen(true);
    const rawQuery = typeof customQuery === 'string' ? customQuery : (pvNo || itemRequisitionNo || '');
    const query = String(rawQuery).trim().toLowerCase();

    if (!query) {
      setBannerNotice('⚠️ Please enter a PV Number or Requisition Number to search.');
      setTimeout(() => setBannerNotice(''), 4000);
      return;
    }

    setIsSearching(true);
    setBannerNotice(`🔍 Searching PV Records & Database for "${rawQuery.trim()}"...`);

    // Helper matcher function
    const matchesVoucher = (v) => {
      if (!v) return false;
      const vPvNo = String(v.pvNo || v.pv_number || v.id || '').toLowerCase().trim();
      const vReq = String(v.requisitionNo || v.itemRequisitionNo || v.requisition_no || v.reqNo || '').toLowerCase().trim();
      const vDesc = String(v.description || '').toLowerCase();
      const vProv = String(v.provider || v.payee_name || '').toLowerCase();

      // Direct exact or substring matches
      if (vPvNo && (vPvNo.includes(query) || query.includes(vPvNo))) return true;
      if (vReq && (vReq.includes(query) || query.includes(vReq))) return true;

      // Alphanumeric clean match (stripping "PV-", "REQ-", spaces, hyphens)
      const cleanQ = query.replace(/[^a-z0-9]/g, '');
      const cleanPv = vPvNo.replace(/[^a-z0-9]/g, '');
      const cleanReq = vReq.replace(/[^a-z0-9]/g, '');
      if (cleanQ.length >= 3) {
        if (cleanPv && (cleanPv.includes(cleanQ) || cleanQ.includes(cleanPv))) return true;
        if (cleanReq && (cleanReq.includes(cleanQ) || cleanQ.includes(cleanReq))) return true;
      }

      return false;
    };

    try {
      // 1. Check local pvQueue
      let match = pvQueue.find(matchesVoucher);

      // 2. Check portal store payment vouchers
      if (!match && storeVouchers && storeVouchers.length > 0) {
        match = storeVouchers.find(matchesVoucher);
      }

      // 3. Check localStorage official_pv_queue
      if (!match) {
        try {
          const saved = JSON.parse(localStorage.getItem('official_pv_queue') || '[]');
          if (Array.isArray(saved)) {
            match = saved.find(matchesVoucher);
          }
        } catch (_) {}
      }

      // 4. Query backend directly by PV identifier / number
      if (!match) {
        try {
          const backendMatch = await api.getPaymentVoucherById(rawQuery.trim());
          if (backendMatch && (backendMatch.id || backendMatch.pv_number || backendMatch.pvNo)) {
            match = {
              id: backendMatch.id || `pv-${Date.now()}`,
              pvNo: backendMatch.pv_number || backendMatch.pvNo || rawQuery.trim(),
              requisitionNo: backendMatch.requisition_no || backendMatch.requisitionNo || '',
              provider: backendMatch.payee_name || backendMatch.provider || 'Vendor',
              providerId: backendMatch.payee_id || backendMatch.providerId || '',
              description: backendMatch.description || '',
              qty: Number(backendMatch.quantity || backendMatch.qty) || 1,
              cost: Number(backendMatch.unit_cost || backendMatch.cost) || 0,
              total: Number(backendMatch.total_amount || backendMatch.total) || 0,
              datePrepared: backendMatch.date_prepared || backendMatch.datePrepared || new Date().toISOString().split('T')[0],
              valuedDate: backendMatch.date_prepared || backendMatch.valuedDate || new Date().toISOString().split('T')[0],
              auditRemarks: backendMatch.auditRemarks || backendMatch.pre_audited_by || 'Verified in backend records',
              status: backendMatch.status === 'PRE_AUDITED' ? 'Pre-Audited & Approved' : (backendMatch.status || 'Pending approval'),
            };
          }
        } catch (_) {}
      }

      // 5. Query all vouchers from backend to search within live database
      if (!match) {
        try {
          const freshPVs = await api.getPaymentVouchers();
          if (Array.isArray(freshPVs)) {
            const mappedFresh = freshPVs.map(p => ({
              id: p.id || p.pv_number || `pv-${Date.now()}`,
              pvNo: p.pv_number || p.pvNo || p.id,
              requisitionNo: p.requisition_no || p.requisitionNo || '',
              provider: p.payee_name || p.provider || 'Vendor',
              providerId: p.payee_id || p.providerId || '',
              description: p.description || '',
              qty: Number(p.quantity || p.qty) || 1,
              cost: Number(p.unit_cost || p.cost) || 0,
              total: Number(p.total_amount || p.total) || 0,
              datePrepared: p.date_prepared || p.datePrepared || new Date().toISOString().split('T')[0],
              valuedDate: p.date_prepared || p.valuedDate || new Date().toISOString().split('T')[0],
              auditRemarks: p.auditRemarks || p.pre_audited_by || 'Fetched from backend database',
              status: p.status === 'PRE_AUDITED' ? 'Pre-Audited & Approved' : (p.status || 'Pending approval')
            }));
            match = mappedFresh.find(matchesVoucher);
          }
        } catch (_) {}
      }

      if (match) {
        // Ensure match is in pvQueue
        setPvQueue(prev => {
          const exists = prev.some(x => (x.pvNo && x.pvNo === match.pvNo) || (x.id && x.id === match.id));
          return exists ? prev : [match, ...prev];
        });
        populateFormWithVoucher(match);
        setBannerNotice(`🔍 ✅ Found & loaded PV #${match.pvNo || match.id} (Requisition: ${match.requisitionNo || 'N/A'}). Ready for pre-audit verification and approval.`);
      } else {
        setBannerNotice(`⚠️ No payment voucher record found matching "${rawQuery.trim()}". Please verify the PV number or Requisition number.`);
      }
    } catch (err) {
      setBannerNotice(`⚠️ Search error: ${err.message || 'Failed to search voucher database'}`);
    } finally {
      setIsSearching(false);
      setTimeout(() => setBannerNotice(''), 6000);
    }
  };

  // Save / Correct Voucher Details Prior to Approval
  const handleSaveVoucherEdits = () => {
    if (!pvNo.trim()) {
      alert('Please select or enter a valid PV Number.');
      return;
    }
    const updatedFields = {
      pvNo,
      requisitionNo: itemRequisitionNo,
      provider: clientProvider,
      providerId,
      description,
      qty: Number(qty) || 1,
      cost: Number(costPerItem) || 0,
      total: calculatedTotalAmount,
      datePrepared,
      valuedDate,
      auditRemarks,
      editedByHeadmaster: true
    };

    const updatedQueue = pvQueue.map(p =>
      (p.pvNo?.toLowerCase() === pvNo.toLowerCase() || p.id === selectedPvId) ? { ...p, ...updatedFields } : p
    );

    setPvQueue(updatedQueue);
    try {
      localStorage.setItem('official_pv_queue', JSON.stringify(updatedQueue));
    } catch (e) {}

    if (updatePaymentVoucher) {
      updatePaymentVoucher(pvNo, updatedFields, 'Headmaster / Pre-Auditor');
    }

    setBannerNotice(`✏️ ✅ Successfully saved corrected voucher details for PV #${pvNo}! Corrected by Headmaster prior to approval.`);
    setTimeout(() => setSuccessNotice(''), 5000);
  };

  // Action Single PV Item Only
  const handleActionSingleItem = () => {
    const updatedFields = {
      pvNo,
      requisitionNo: itemRequisitionNo,
      provider: clientProvider,
      providerId,
      description,
      qty: Number(qty) || 1,
      cost: Number(costPerItem) || 0,
      total: calculatedTotalAmount,
      datePrepared,
      valuedDate,
      auditRemarks,
      status: actionChoice,
      editedByHeadmaster: true
    };

    const updatedQueue = pvQueue.map(p =>
      (p.pvNo?.toLowerCase() === pvNo.toLowerCase() || p.id === selectedPvId) ? { ...p, ...updatedFields } : p
    );

    setPvQueue(updatedQueue);
    try {
      localStorage.setItem('official_pv_queue', JSON.stringify(updatedQueue));
    } catch (e) {}

    if (approvePaymentVoucher) {
      approvePaymentVoucher(pvNo, actionChoice, auditRemarks, updatedFields, 'Headmaster / Pre-Auditor');
    }

    setBannerNotice(`✅ Applied action "${actionChoice}" for PV Item #${pvNo}. Pre-audit ledger updated.`);
    setTimeout(() => setBannerNotice(''), 4000);
  };

  // Action Next PV / Action All PV Items in Queue
  const handleActionNextOrAll = () => {
    // Action current item and move to next pending item in queue
    handleActionSingleItem();
    const currentIndex = pvQueue.findIndex(p => p.pvNo?.toLowerCase() === pvNo.toLowerCase() || p.id === selectedPvId);
    if (currentIndex >= 0 && currentIndex < pvQueue.length - 1) {
      const nextV = pvQueue[currentIndex + 1];
      populateFormWithVoucher(nextV);
      setBannerNotice(`➡️ Applied action "${actionChoice}" for #${pvNo}. Advanced to next PV #${nextV.pvNo}.`);
    } else {
      setBannerNotice(`✅ Applied action "${actionChoice}" for all selected items in queue.`);
    }
    setTimeout(() => setBannerNotice(''), 5000);
  };

  // Summary Totals Calculation (Matching Image 2 Bottom Summary Bar)
  const totalPendingAmount = pvQueue.filter(p => p.status === 'Pending approval' || p.status === 'Pending Audit').reduce((acc, p) => acc + (p.total || p.cost || 0), 0);
  const totalPostponedAmount = pvQueue.filter(p => p.status === 'Postponed').reduce((acc, p) => acc + (p.total || p.cost || 0), 0);
  const totalValidatedAmount = pvQueue.filter(p => p.status === 'Validated' || p.status?.includes('Approved')).reduce((acc, p) => acc + (p.total || p.cost || 0), 0);
  const totalDeclinedAmount = pvQueue.filter(p => p.status === 'Declined' || p.status === 'Rejected').reduce((acc, p) => acc + (p.total || p.cost || 0), 0);
  const totalCancelledAmount = pvQueue.filter(p => p.status === 'Cancel PV' || p.status === 'Cancelled').reduce((acc, p) => acc + (p.total || p.cost || 0), 0);
  const totalNonAccrualAmount = pvQueue.filter(p => p.status === 'Non-accrual').reduce((acc, p) => acc + (p.total || p.cost || 0), 0);

  // Filtered Queue for Table
  const filteredQueue = pvQueue.filter(p =>
    !searchFilter ||
    p.pvNo?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.provider?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.requisitionNo?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)', color: '#0f172a', paddingBottom: 40 }}>
      
      {/* Top Banner Header - Click to Toggle Voucher Particulars & Calculations */}
      <div 
        onClick={() => setIsParticularsOpen(prev => !prev)}
        style={{
          background: '#0f3a4b',
          color: '#ffffff',
          padding: '12px 18px',
          borderRadius: '8px 8px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          cursor: 'pointer',
          userSelect: 'none'
        }}
        title="Click Payment Voucher (PV) Pre-Audit & Editing Station to toggle Voucher Particulars & Calculations"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: '#0284c7', width: 6, height: 24, borderRadius: 3 }} />
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#ffffff', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>Payment Voucher (PV) Pre-Audit & Editing Station</span>
              <span style={{
                fontSize: 10.5,
                background: isParticularsOpen ? '#0284c7' : 'rgba(255,255,255,0.2)',
                color: '#ffffff',
                padding: '2px 10px',
                borderRadius: 12,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}>
                {isParticularsOpen ? (
                  <>Station Open <ChevronUp size={12} /></>
                ) : (
                  <>Click to Open <ChevronDown size={12} /></>
                )}
              </span>
            </h3>
            <div style={{ fontSize: 11, color: '#bae6fd', marginTop: 2 }}>
              Headmaster / Executive Pre-Audit Station · Edit Wrong Voucher Details Prior to Approval
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsParticularsOpen(prev => !prev);
            }}
            style={{
              background: isParticularsOpen ? '#0284c7' : 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#fff',
              padding: '5px 12px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Edit3 size={13} />
            {isParticularsOpen ? 'Hide Voucher Particulars ▲' : 'Open Voucher Particulars ▼'}
          </button>
          <span style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}>
            <FileCheck size={14} /> Headmaster Audit Level
          </span>
        </div>
      </div>

      {/* TOP SECTION: Interactive Ledger Table Grid (Matching Reference Image 2) */}
      <div style={{ background: '#e2e8f0', border: '1px solid #cbd5e1', borderTop: 'none', padding: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 8px', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => handleSearchPV(searchFilter || pvNo || itemRequisitionNo)}
              disabled={isSearching}
              style={{ padding: '4px 12px', background: '#0f3a4b', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 800, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {isSearching ? <Loader2 size={12} className="animate-spin" /> : null}
              Search PV Records &gt;&gt;
            </button>
            <input
              type="text"
              placeholder="Filter / Search PV records..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchPV(searchFilter);
                }
              }}
              style={{ width: 190, padding: '3px 8px', borderRadius: 4, border: '1px solid #94a3b8', fontSize: 11, background: '#fff' }}
            />
          </div>
          <span style={{ fontSize: 11, fontWeight: 800, color: '#0f3a4b' }}>
            ⚡ Live Database Queue: {pvQueue.length} Vouchers Synchronized
          </span>
        </div>

        {/* Ledger Grid Table (Exact Match to Image 2 Grid) */}
        <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #94a3b8', background: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, whiteSpace: 'nowrap' }}>
            <thead>
              <tr style={{ background: '#0f3a4b', color: '#fff', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px' }}>PL / Account Name</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Budget</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Actuals</th>
                <th style={{ padding: '6px 8px' }}>Batch N/o</th>
                <th style={{ padding: '6px 8px' }}>T. Date</th>
                <th style={{ padding: '6px 8px' }}>V. Date</th>
                <th style={{ padding: '6px 8px' }}>Merchant / Provider</th>
                <th style={{ padding: '6px 8px', textAlign: 'right' }}>Debit (GHS)</th>
                <th style={{ padding: '6px 8px' }}>T. Description</th>
                <th style={{ padding: '6px 8px' }}>Pre Audit Remarks</th>
                <th style={{ padding: '6px 8px' }}>Imputer</th>
                <th style={{ padding: '6px 8px' }}>Input Date</th>
                <th style={{ padding: '6px 8px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '6px 8px' }}>Company</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueue.map((item, idx) => {
                const isSelected = selectedPvId === item.id || selectedPvId === item.pvNo;
                return (
                  <tr
                    key={item.id || idx}
                    onClick={() => populateFormWithVoucher(item)}
                    style={{
                      background: isSelected ? '#0284c7' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc'),
                      color: isSelected ? '#ffffff' : '#0f172a',
                      cursor: 'pointer',
                      borderBottom: '1px solid #cbd5e1'
                    }}
                  >
                    <td style={{ padding: '5px 8px', fontWeight: 800 }}>{item.accountName || item.description?.substring(0, 20)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right' }}>{Number(item.budget || 0).toFixed(2)}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right' }}>{Number(item.actuals || 0).toFixed(2)}</td>
                    <td style={{ padding: '5px 8px' }}>{item.batchNo || 'BATCH-2026-01'}</td>
                    <td style={{ padding: '5px 8px' }}>{item.tDate || item.datePrepared}</td>
                    <td style={{ padding: '5px 8px' }}>{item.vDate || item.valuedDate}</td>
                    <td style={{ padding: '5px 8px', fontWeight: 700 }}>{item.provider || item.clientProvider}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 900 }}>{Number(item.total || item.cost || 0).toFixed(2)}</td>
                    <td style={{ padding: '5px 8px' }}>{item.description}</td>
                    <td style={{ padding: '5px 8px' }}>{item.auditRemarks}</td>
                    <td style={{ padding: '5px 8px', fontWeight: 700 }}>{item.imputer || item.preparedBy || 'Sub-Admin'}</td>
                    <td style={{ padding: '5px 8px' }}>{item.inputDate || item.datePrepared}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 900,
                        background: isSelected ? '#ffffff' : (item.status === 'Validated' ? '#dcfce7' : (item.status === 'Declined' || item.status === 'Cancel PV' ? '#fee2e2' : '#fef3c7')),
                        color: isSelected ? '#0369a1' : (item.status === 'Validated' ? '#166534' : (item.status === 'Declined' || item.status === 'Cancel PV' ? '#dc2626' : '#b45309'))
                      }}>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '5px 8px' }}>{item.company || 'Remalj Carewell'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONDITIONAL STATION: Opens only when Payment Voucher (PV) Pre-Audit & Editing Station is clicked or a PV is selected */}
      {!isParticularsOpen ? (
        <div
          onClick={() => setIsParticularsOpen(true)}
          style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderTop: 'none',
            padding: '24px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          title="Click to open Voucher Particulars & Calculations"
        >
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: '#0f3a4b',
              fontSize: 13,
              fontWeight: 800
            }}>
              <span>👆 Click on <strong>"Payment Voucher (PV) Pre-Audit & Editing Station"</strong> above or select any voucher in the queue to open:</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsParticularsOpen(true);
              }}
              style={{
                padding: '10px 22px',
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: 900,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.35)',
                letterSpacing: '0.02em'
              }}
            >
              <Edit3 size={15} />
              Open VOUCHER PARTICULARS &amp; CALCULATIONS (EDITABLE BY HEADMASTER PRIOR TO APPROVAL) ▼
            </button>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              Allows Headmaster to pre-audit calculations, edit description, item rates, quantities, and apply executive approval actions.
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Top Search & Requisition Bar */}
          <div style={{
            background: '#f1f5f9',
            padding: 12,
            border: '1px solid #cbd5e1',
            borderTop: 'none',
            display: 'grid',
            gridTemplateColumns: '1.3fr 1.3fr',
            gap: 16,
            alignItems: 'center'
          }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>
                PV N/o Search &amp; Selection
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  value={pvNo}
                  onChange={(e) => setPvNo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchPV(pvNo);
                    }
                  }}
                  placeholder="Enter PV N/o (e.g. PV-2026-088, 51250897)..."
                  style={{ flex: 1, minWidth: 140, padding: '6px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 800, background: '#fff' }}
                />
                <button
                  type="button"
                  onClick={() => handleSearchPV(pvNo)}
                  disabled={isSearching}
                  style={{ padding: '6px 14px', background: '#0f3a4b', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
                >
                  {isSearching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />} Recall PV Details
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>
                Item Requisition #
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  value={itemRequisitionNo}
                  onChange={(e) => setItemRequisitionNo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearchPV(itemRequisitionNo);
                    }
                  }}
                  placeholder="Requisition N/o (e.g. REQ-2026-901)..."
                  style={{ flex: 1, padding: '6px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 700 }}
                />
                <button
                  type="button"
                  onClick={() => handleSearchPV(itemRequisitionNo)}
                  disabled={isSearching}
                  title="Search PV matching this Requisition Number"
                  style={{ padding: '6px 12px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}
                >
                  {isSearching ? <Loader2 size={13} className="animate-spin" /> : <Search size={13} />} Search Req #
                </button>
              </div>
            </div>
          </div>

      {/* Banner Notification Bar */}
      {bannerNotice && (
        <div style={{
          background: bannerNotice.includes('✅') ? '#dcfce7' : '#e0f2fe',
          color: bannerNotice.includes('✅') ? '#166534' : '#0369a1',
          padding: '8px 16px',
          fontSize: 12.5,
          fontWeight: 800,
          borderBottom: '1px solid #bae6fd',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span>ℹ️</span> {bannerNotice}
        </div>
      )}

      {/* MIDDLE SECTION: Editable Voucher Particulars & Calculations */}
      <div style={{ background: '#ffffff', padding: 16, border: '1px solid #cbd5e1', borderTop: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: '#0f3a4b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Edit3 size={15} style={{ color: '#0284c7' }} />
            VOUCHER PARTICULARS & CALCULATIONS (EDITABLE BY HEADMASTER PRIOR TO APPROVAL)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => setIsParticularsOpen(false)}
              style={{
                padding: '6px 12px',
                background: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
              title="Close editing station"
            >
              <ChevronUp size={13} /> Minimize Station ▲
            </button>
            <button
              type="button"
              onClick={handleSaveVoucherEdits}
              style={{
                padding: '6px 14px',
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 4px rgba(2,132,199,0.2)'
              }}
            >
              <Save size={14} /> 💾 Save / Correct Voucher Details
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          {/* Description or Particulars */}
          <div style={{ gridColumn: 'span 3' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>
              Description or Particulars <span style={{ color: '#dc2626' }}>* (Editable if wrong)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Cost of Electricity Bill & Substation Maintenance"
              style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #0284c7', fontSize: 12, background: '#fff', fontWeight: 700 }}
            />
          </div>

          {/* Date Prepared */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Date Prepared</label>
            <input
              type="date"
              value={datePrepared}
              onChange={(e) => setDatePrepared(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
            />
            <div style={{ fontSize: 10, color: '#0284c7', fontWeight: 700, marginTop: 2 }}>
              {formatDatePreview(datePrepared)}
            </div>
          </div>

          {/* Client/Service Provider */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>
              Select Client / Service Provider <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              value={clientProvider}
              onChange={(e) => setClientProvider(e.target.value)}
              placeholder="Vendor / Provider Name..."
              style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 700 }}
            />
          </div>

          {/* Service Provider's ID */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Service Provider ID</label>
            <input
              type="text"
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              placeholder="ID / Account #"
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#f8fafc', fontWeight: 700 }}
            />
          </div>

          {/* Qty */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>
              Qty. <span style={{ color: '#dc2626' }}>* (Edit if wrong)</span>
            </label>
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #0284c7', fontSize: 12, background: '#fff', fontWeight: 800 }}
            />
          </div>

          {/* Cost Per Item (GHS) */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>
              Cost Per Item / Rate (GHS) <span style={{ color: '#dc2626' }}>* (Edit if wrong)</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={costPerItem}
              onChange={(e) => setCostPerItem(e.target.value)}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #0284c7', fontSize: 12, background: '#fff', fontWeight: 800 }}
            />
          </div>

          {/* Total Amount (GHS) */}
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Total Amount (GHS)</label>
            <input
              type="text"
              readOnly
              value={`GHS ${calculatedTotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #0284c7', fontSize: 13, fontWeight: 900, color: '#0369a1', background: '#f0f9ff' }}
            />
          </div>
        </div>

        {/* Executive Pre-Audit Verification & Decision Section */}
        <div style={{
          background: '#f8fafc',
          padding: 14,
          borderRadius: 8,
          border: '1px solid #cbd5e1',
          marginBottom: 16
        }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: '#0f3a4b', borderBottom: '2px solid #0f3a4b', paddingBottom: 4, marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Executive Pre-Audit Verification & Decision</span>
            <button
              type="button"
              onClick={handleSaveVoucherEdits}
              style={{ padding: '4px 10px', background: '#e0f2fe', color: '#0369a1', border: '1px solid #38bdf8', borderRadius: 4, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
            >
              💾 Save Corrections Only
            </button>
          </div>

          {/* Remarks Input */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Pre Audit Remarks & Comments</label>
            <input
              type="text"
              placeholder="Enter audit verification comments or correction rationale..."
              value={auditRemarks}
              onChange={(e) => setAuditRemarks(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
            />
          </div>

          {/* Valued Date & Action Choice Dropdown (Exact Match to Image 2 Dropdown) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Valued Date</label>
              <input
                type="date"
                value={valuedDate}
                onChange={(e) => setValuedDate(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Approval Action Choice</label>
              <select
                value={actionChoice}
                onChange={(e) => setActionChoice(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 800, color: '#0f3a4b' }}
              >
                <option value="Validated">Validated (Pre-audit Approved)</option>
                <option value="Pending approval">Pending approval</option>
                <option value="Postponed">Postponed</option>
                <option value="Declined">Declined</option>
                <option value="Cancel PV">Cancel PV</option>
                <option value="Non-accrual">Non-accrual</option>
              </select>
            </div>
          </div>

          {/* Action Buttons (Image 2 Match) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button
              type="button"
              onClick={handleActionSingleItem}
              style={{ padding: '10px 16px', background: '#0f3a4b', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
            >
              Action Single PV Item (#{pvNo})
            </button>

            <button
              type="button"
              onClick={handleActionNextOrAll}
              style={{ padding: '10px 16px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 900, cursor: 'pointer' }}
            >
              Action Next PV / Action All PV Items
            </button>
          </div>
        </div>

        {/* BOTTOM SECTION: Summary Totals Bar (Exact Match to Image 2 Bottom Summary Grid) */}
        <div style={{
          background: '#f1f5f9',
          border: '1px solid #cbd5e1',
          borderRadius: 8,
          padding: 12,
          marginTop: 16
        }}>
          <div style={{ fontSize: 11.5, fontWeight: 900, color: '#334155', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            📊 Executive Pre-Audit Summary Totals (GHS)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            
            <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: '#64748b', marginBottom: 2 }}>Total Pending Amount</div>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#d97706' }}>
                {totalPendingAmount.toFixed(2)}
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: '#64748b', marginBottom: 2 }}>Total Postponed Amount</div>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#0284c7' }}>
                {totalPostponedAmount.toFixed(2)}
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: '#64748b', marginBottom: 2 }}>Total Validated Amount</div>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#16a34a' }}>
                {totalValidatedAmount.toFixed(2)}
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: '#64748b', marginBottom: 2 }}>Total Amount Declined</div>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#dc2626' }}>
                {totalDeclinedAmount.toFixed(2)}
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: '#64748b', marginBottom: 2 }}>Total Amount Cancelled</div>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#475569' }}>
                {totalCancelledAmount.toFixed(2)}
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: '#64748b', marginBottom: 2 }}>Total Non-Accruals Amount</div>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#6b21a8' }}>
                {totalNonAccrualAmount.toFixed(2)}
              </div>
            </div>

          </div>
        </div>

      </div>
    </>
  )}
</div>
);
}
