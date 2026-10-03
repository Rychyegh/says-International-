import { normalizePvItemStatus, voucherIdentityKey } from '../../lib/recordRules.js';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CheckCircle2, Edit3, Save, Search, AlertCircle, FileCheck, RefreshCw, Filter, ArrowRight, ShieldCheck, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { usePortalData, pvNosMatch, mapApiPaymentVoucher } from '../../data/PortalStore';
import { api } from '../../services/api';

const itemDecided = item => ['Validated','Declined','Cancel PV','Non-accrual'].includes(normalizePvItemStatus(item?.status)) || ['paid','disbursed','settled'].includes(String(item?.status).toLowerCase());

function summarizePvStatusFromItems(items, fallback = 'Pending approval') {
  if (!Array.isArray(items) || items.length === 0) return fallback;
  const statuses = items.map((i) => normalizePvItemStatus(i.status));
  const allVal = statuses.every((s) => s === 'Validated');
  const allDec = statuses.every((s) => s === 'Declined' || s === 'Cancel PV' || s === 'Non-accrual');
  const anyVal = statuses.some((s) => s === 'Validated');
  if (allVal) return 'Validated';
  if (allDec) return 'Declined';
  if (anyVal) return 'Partially Approved';
  return fallback;
}

function payableTotalFromItems(items, fallbackTotal = 0) {
  if (!Array.isArray(items) || items.length === 0) return Number(fallbackTotal) || 0;
  return items
    .filter((i) => normalizePvItemStatus(i.status) === 'Validated')
    .reduce((acc, i) => acc + (Number(i.totalAmount || i.total || 0) || 0), 0);
}

export function parsePvItems(v) {
  if (!v) return [];
  const withMeta = (item) => ({
    ...item,
    datePrepared: item.datePrepared || item.date_prepared || v.datePrepared || v.tDate || '',
  });

  let sourceItems = Array.isArray(v.items) && v.items.length > 0 ? v.items : null;
  if (sourceItems) {
    return sourceItems.map((it, idx) => withMeta({
      id: it.id || `it-${v.id || v.pvNo || 'pv'}-${idx + 1}`,
      description: it.description || it.particulars || `Line Item ${idx + 1}`,
      provider: it.provider || it.payee_name || v.provider || v.payee_name || 'Vendor',
      providerId: it.providerId || it.payee_id || v.providerId || '',
      qty: Number(it.qty !== undefined ? it.qty : (it.quantity !== undefined ? it.quantity : 1)),
      costPerItem: Number(it.costPerItem !== undefined ? it.costPerItem : (it.unit_cost !== undefined ? it.unit_cost : (it.cost || 0))),
      totalAmount: Number(it.totalAmount !== undefined ? it.totalAmount : (it.total !== undefined ? it.total : (it.amount || 0))),
      status: it.status || v.status || 'Pending approval',
      auditRemarks: it.auditRemarks || it.remarks || v.auditRemarks || ''
    }));
  }

  const desc = String(v.description || '').trim();
  const qtyFromDesc = desc.match(/\((?:x|X)?\s*(\d+)\)/);
  const parsedQty = qtyFromDesc ? parseInt(qtyFromDesc[1], 10) : 0;
  const headerQty = Number(v.qty || v.quantity || 0);
  const singleQty = headerQty > 1 ? headerQty : (parsedQty || headerQty || 1);
  const singleTotal = Number(v.total || v.totalAmount || v.amount || 0);
  const headerCost = Number(v.cost || v.costPerItem || v.unit_cost || 0);
  const singleCost = (headerQty > 1 && headerCost)
    ? headerCost
    : (singleQty > 0 && singleTotal ? Number((singleTotal / singleQty).toFixed(2)) : headerCost);

  return [withMeta({
    id: `it-${v.id || v.pvNo || 'pv'}-1`,
    description: desc || 'Expenditure Requisition',
    provider: v.provider || v.clientProvider || 'Vendor',
    providerId: v.providerId || '',
    qty: singleQty,
    costPerItem: singleCost || (singleTotal / singleQty),
    totalAmount: singleTotal || (singleQty * singleCost),
    status: v.status || 'Pending approval',
    auditRemarks: v.auditRemarks || ''
  })];
}

function collapseVoucherQueue(list = []) {
  const mergedMap = new Map();
  (Array.isArray(list) ? list : []).forEach((v) => {
    if (!v) return;
    let key = voucherIdentityKey(v);
    const existingKey = [...mergedMap.keys()].find((k) => {
      if (k === key) return true;
      const ex = mergedMap.get(k);
      return pvNosMatch(ex?.pvNo, v.pvNo)
        || (ex?.id && v.id && String(ex.id) === String(v.id) && !/^pv-\d+$/i.test(String(v.id)));
    });
    if (existingKey) key = existingKey;
    const existing = mergedMap.get(key) || {};
    const parsedItems = parsePvItems({ ...existing, ...v, items: v.items?.length ? v.items : existing.items });
    mergedMap.set(key, {
      accountName: v.accountName || existing.accountName || 'Expenditure Account',
      budget: v.budget || existing.budget || '0.00',
      actuals: v.actuals || existing.actuals || '0.00',
      batchNo: v.batchNo || existing.batchNo || v.pvNo || '',
      tDate: v.tDate || v.datePrepared || existing.tDate || new Date().toISOString().split('T')[0],
      vDate: v.valuedDate || v.vDate || existing.vDate || new Date().toISOString().split('T')[0],
      imputer: v.imputer || v.preparedBy || existing.imputer || 'Sub-Admin',
      inputDate: v.inputDate || v.datePrepared || existing.inputDate || new Date().toISOString().split('T')[0],
      company: v.company || existing.company || 'Remalj Carewell Inspirational School',
      ...existing,
      ...v,
      items: parsedItems.length > 0 ? parsedItems : (existing.items || v.items || []),
      status: v.status || existing.status || 'Pending approval',
      id: (existing.id && !/^pv-\d+$/i.test(String(existing.id))) ? existing.id : (v.id || existing.id),
      pvNo: (String(v.pvNo || '').length >= String(existing.pvNo || '').length) ? (v.pvNo || existing.pvNo) : (existing.pvNo || v.pvNo),
      qty: (parsedItems.length === 1 && Number(parsedItems[0].qty) > Number(v.qty || existing.qty || 0))
        ? parsedItems[0].qty
        : (Number(existing.qty) > Number(v.qty || 0) ? existing.qty : (v.qty || existing.qty)),
      cost: (parsedItems.length === 1 && Number(parsedItems[0].costPerItem) > 0 && Number(parsedItems[0].qty) > Number(v.qty || 0))
        ? parsedItems[0].costPerItem
        : (Number(existing.cost) > 0 && Number(v.qty || 0) <= 1 && Number(existing.qty) > 1 ? existing.cost : (v.cost || existing.cost)),
      total: v.total || existing.total || parsedItems.reduce((sum, it) => sum + (Number(it.totalAmount || it.total || 0) || 0), 0)
    });
  });
  return Array.from(mergedMap.values());
}

export default function ApprovePVForm({ setM = () => {} }) {
  const portalData = usePortalData();
  const storeVouchers = portalData?.paymentVouchers || [];
  const updatePaymentVoucher = portalData?.updatePaymentVoucher;
  const approvePaymentVoucher = portalData?.approvePaymentVoucher;

  const [pvQueue, setPvQueue] = useState([]);

  useEffect(() => {
    try { localStorage.removeItem('official_pv_queue'); } catch (e) {}
    setPvQueue(collapseVoucherQueue(storeVouchers || []));
  }, [storeVouchers]);

  // Selected Active Voucher for Editing/Audit
  const [selectedPvId, setSelectedPvId] = useState('');

  // Toggle for Voucher Particulars & Calculations (Editable by Headmaster Prior to Approval)
  // Requires clicking the Pre-Audit & Editing Station header or selecting a PV from the queue to open
  const [isParticularsOpen, setIsParticularsOpen] = useState(false);

  // Form Fields State
  const [pvNo, setPvNo] = useState('');
  const [itemRequisitionNo, setItemRequisitionNo] = useState('');
  const [description, setDescription] = useState('');
  const [datePrepared, setDatePrepared] = useState('');
  const [clientProvider, setClientProvider] = useState('');
  const [providerId, setProviderId] = useState('');
  const [qty, setQty] = useState('');
  const [costPerItem, setCostPerItem] = useState('');
  const [auditRemarks, setAuditRemarks] = useState('');
  const [valuedDate, setValuedDate] = useState('');

  const [currentItems, setCurrentItems] = useState([]);
  const [selectedItemIds, setSelectedItemIds] = useState(() => currentItems.map(i => i.id));
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const reviewLock = useRef(false);
  const [rejection,setRejection] = useState(null);
  const [rejectionReason,setRejectionReason] = useState('');
  const reviewComplete = currentItems.length > 0 && currentItems.every(itemDecided);

  // Recently Actioned PVs Filters at bottom of page
  const [actionedStatusFilter, setActionedStatusFilter] = useState('ALL');
  const [actionedSearchQuery, setActionedSearchQuery] = useState('');
  
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

  // Populate Form from Voucher object (with optional specific line item index)
  const populateFormWithVoucher = (v, targetItemIndex = 0) => {
    if (!v) return;
    setSelectedPvId(v.id || v.pvNo);
    setPvNo(v.pvNo || '');
    setItemRequisitionNo(v.requisitionNo || v.itemRequisitionNo || '');
    setClientProvider(v.provider || v.clientProvider || '');
    setProviderId(v.providerId || '');
    setDatePrepared(v.datePrepared || v.tDate || new Date().toISOString().split('T')[0]);
    setValuedDate(v.valuedDate || v.vDate || new Date().toISOString().split('T')[0]);
    setAuditRemarks(v.auditRemarks || 'Pre-audited & verified by Headmaster.');

    // Process line items for multi-item support
    const parsedItems = parsePvItems(v);
    setCurrentItems(parsedItems);
    setSelectedItemIds(parsedItems.filter(it=>!itemDecided(it)).map(it => it.id));

    const itemIdx = (targetItemIndex != null && targetItemIndex >= 0 && targetItemIndex < parsedItems.length)
      ? targetItemIndex
      : 0;
    setActiveItemIndex(itemIdx);

    // If specific item selected or first item exists, populate active item details
    if (parsedItems.length > 0 && parsedItems[itemIdx]) {
      const active = parsedItems[itemIdx];
      setDescription(active.description || v.description || '');
      setQty(String(active.qty || 1));
      const activeUnitCost = Number(active.costPerItem || active.cost || (active.totalAmount ? (active.totalAmount / (active.qty || 1)) : 0) || 0);
      setCostPerItem(activeUnitCost.toFixed(2));
      if (active.provider) setClientProvider(active.provider);
      if (active.providerId) setProviderId(active.providerId);
    } else {
      setDescription(v.description || '');
      setQty(String(v.qty || 1));
      setCostPerItem(Number(v.cost || v.costPerItem || 0).toFixed(2));
    }
    
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

  const openParticularsStation = () => {
    const current = pvQueue.find((p) => p.id === selectedPvId || pvNosMatch(p.pvNo, pvNo)) || pvQueue[0];
    if (current) populateFormWithVoucher(current);
    else setIsParticularsOpen(true);
  };

  // Select a specific item from the itemized list to populate into the edit fields
  const handleSelectItemForEdit = (item, idx) => {
    setActiveItemIndex(idx);
    setDescription(item.description || '');
    setClientProvider(item.provider || clientProvider);
    setProviderId(item.providerId || providerId);
    setQty(String(item.qty || 1));
    setCostPerItem(Number(item.costPerItem || item.cost || 0).toFixed(2));
  };

  // Toggle selection for bulk action checkbox
  const handleToggleItemSelect = (itemId) => {
    setSelectedItemIds(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  // Select all or deselect all items
  const handleToggleSelectAllItems = () => {
    if (selectedItemIds.length === currentItems.filter(item=>!itemDecided(item)).length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(currentItems.filter(i=>!itemDecided(i)).map(i => i.id));
    }
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

      // 3. Query backend directly by PV identifier / number
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
              items: backendMatch.items || [],
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
              id: p.id || p.pv_number || `pv-${p.pv_number || Date.now()}`,
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
              status: p.status === 'PRE_AUDITED' ? 'Pre-Audited & Approved' : (p.status || 'Pending approval'),
              items: p.items || [],
            }));
            match = mappedFresh.find(matchesVoucher);
          }
        } catch (_) {}
      }

      if (match) {
        // Ensure match is in pvQueue
        setPvQueue(prev => collapseVoucherQueue(
          prev.some(x => pvNosMatch(x.pvNo, match.pvNo) || (x.id && match.id && String(x.id) === String(match.id)))
            ? prev
            : [match, ...prev]
        ));
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

  const [isActioning, setIsActioning] = useState(false);

  // Save / Correct Voucher Details Prior to Approval
  const handleSaveVoucherEdits = async () => {
    if (!pvNo.trim()) {
      alert('Please select or enter a valid PV Number.');
      return;
    }

    setIsActioning(true);
    setBannerNotice(`⏳ Saving corrected voucher details for #${pvNo}...`);

    let updatedItems = [...currentItems];
    if (updatedItems.length > 0 && activeItemIndex < updatedItems.length) {
      updatedItems[activeItemIndex] = {
        ...updatedItems[activeItemIndex],
        description,
        provider: clientProvider,
        providerId,
        qty: Number(qty) || 1,
        cost: Number(costPerItem) || 0,
        costPerItem: Number(costPerItem) || 0,
        total: (Number(qty) || 1) * (Number(costPerItem) || 0),
        totalAmount: (Number(qty) || 1) * (Number(costPerItem) || 0),
      };
      setCurrentItems(updatedItems);
    }

    const newCalculatedTotal = updatedItems.length > 0
      ? updatedItems.reduce((acc, it) => acc + (Number(it.totalAmount || it.total || 0) || 0), 0)
      : calculatedTotalAmount;

    const updatedFields = {
      pvNo,
      requisitionNo: itemRequisitionNo,
      provider: clientProvider,
      providerId,
      description,
      items: updatedItems,
      qty: Number(qty) || 1,
      cost: Number(costPerItem) || 0,
      total: newCalculatedTotal,
      datePrepared,
      valuedDate,
      auditRemarks,
      editedByHeadmaster: true
    };

    try {
      if (updatePaymentVoucher) {
        await updatePaymentVoucher(pvNo, updatedFields, 'Headmaster / Pre-Auditor');
      }
      const updatedQueue = pvQueue.map(p =>
        (pvNosMatch(p.pvNo, pvNo) || p.id === selectedPvId) ? { ...p, ...updatedFields } : p
      );
      setPvQueue(updatedQueue);
      setBannerNotice(`✏️ ✅ Successfully saved corrected voucher details for PV #${pvNo}! Corrected by Headmaster prior to approval.`);
    } catch (err) {
      setBannerNotice(err?.message || 'Saving voucher corrections failed.');
    } finally {
      setIsActioning(false);
      setTimeout(() => setBannerNotice(''), 5000);
    }
  };

  const applyItemDecisions = async (voucher, ids, decision, notes = '') => {
    if (reviewLock.current || !voucher) return;
    const targets = parsePvItems(voucher).filter(item => ids.includes(item.id) && !itemDecided(item));
    if (!targets.length) return;
    if (!['Validated','Declined'].includes(decision)) {setBannerNotice('Choose Approve or Reject for item authorization.');return;}
    if (decision === 'Declined' && !notes.trim()) {
      setRejection({voucher,ids,decision});setRejectionReason('');return;
    }
    reviewLock.current=true;setIsActioning(true);
    const acceptSaved = raw => {
      const saved=mapApiPaymentVoucher(raw);
      setPvQueue(rows=>rows.map(row=>row.id===saved.id || pvNosMatch(row.pvNo,saved.pvNo)?saved:row));
      if(voucher.id===selectedPvId || pvNosMatch(voucher.pvNo,pvNo)) {
        const items=parsePvItems(saved);setCurrentItems(items);
        setSelectedItemIds(items.filter(item=>!itemDecided(item)).map(item=>item.id));
      }
    };
    try {
      const items=parsePvItems(voucher).map(item=>targets.some(target=>target.id===item.id)?{...item,status:decision,auditRemarks:notes}:item);
      const saved=await approvePaymentVoucher(voucher.id || voucher.pvNo,summarizePvStatusFromItems(items),notes,{items});
      acceptSaved(saved);setRejection(null);
      setBannerNotice(`✅ ${decision==='Validated'?'Approved':'Rejected'} ${targets.length} item(s). Decisions confirmed by the server.`);
      return true;
    } catch(error) {
      // A bulk operation may have committed earlier decisions. Refresh rather than
      // restoring an old snapshot that could invite duplicate authorization.
      try {const raw=await api.getPaymentVoucherById(voucher.id);acceptSaved(raw.voucher || raw.data?.voucher || raw.data || raw);} catch {}
      setBannerNotice(error.message || 'The server did not confirm the decision. Retry the original action.');
    } finally {reviewLock.current=false;setIsActioning(false);}
  };
  const activeVoucher = () => pvQueue.find(v=>v.id===selectedPvId || pvNosMatch(v.pvNo,pvNo));
  const handleActionItemDirect = (id,decision,voucher=null) => applyItemDecisions(voucher || activeVoucher(),[id],decision,decision==='Declined'?'':auditRemarks);
  const handleActionSingleItem = () => handleActionItemDirect(currentItems[activeItemIndex]?.id,actionChoice==='Pre-audit Approve PV'?'Validated':actionChoice);
  const handleBulkActionSelectedItems = () => applyItemDecisions(activeVoucher(),selectedItemIds,actionChoice==='Pre-audit Approve PV'?'Validated':actionChoice,actionChoice==='Declined'?'':auditRemarks);

  // Action Next PV / Action All PV Items in Queue
  const handleActionNextOrAll = async () => {
    const confirmed = currentItems.length > 1 && selectedItemIds.length > 0
      ? await handleBulkActionSelectedItems() : await handleActionSingleItem();
    if (!confirmed) return;
    const currentIndex = pvQueue.findIndex(p => pvNosMatch(p.pvNo,pvNo) || p.id===selectedPvId);
    if(currentIndex>=0 && currentIndex<pvQueue.length-1) populateFormWithVoucher(pvQueue[currentIndex+1]);
  };

  // Recently Actioned PVs & Executive Audit Trail calculations
  const actionedCounts = useMemo(() => {
    const allActioned = pvQueue.filter(p => {
      const s = String(p.status || '').toLowerCase().trim();
      return !s.includes('pending') && s !== 'draft' && !!s;
    });
    return {
      all: allActioned.length,
      validated: allActioned.filter(p => {
        const s = String(p.status || '').toLowerCase();
        return s === 'validated' || s === 'approved' || s.includes('approved') || s.includes('pre-audited');
      }).length,
      declined: allActioned.filter(p => {
        const s = String(p.status || '').toLowerCase();
        return s === 'declined' || s === 'rejected';
      }).length,
      postponed: allActioned.filter(p => String(p.status || '').toLowerCase() === 'postponed').length,
      cancelled: allActioned.filter(p => String(p.status || '').toLowerCase().includes('cancel')).length,
      nonAccrual: allActioned.filter(p => String(p.status || '').toLowerCase() === 'non-accrual').length,
    };
  }, [pvQueue]);

  const recentlyActionedPVs = useMemo(() => {
    return pvQueue.filter(p => {
      const s = String(p.status || '').toLowerCase().trim();
      const isPending = s.includes('pending') || s === 'draft' || !s;
      if (isPending) return false;

      if (actionedStatusFilter === 'VALIDATED') {
        return s === 'validated' || s === 'approved' || s.includes('approved') || s.includes('pre-audited');
      }
      if (actionedStatusFilter === 'DECLINED') {
        return s === 'declined' || s === 'rejected';
      }
      if (actionedStatusFilter === 'POSTPONED') {
        return s === 'postponed';
      }
      if (actionedStatusFilter === 'CANCEL') {
        return s === 'cancel pv' || s === 'cancelled' || s.includes('cancel');
      }
      if (actionedStatusFilter === 'NON-ACCRUAL') {
        return s === 'non-accrual';
      }
      return true; // 'ALL'
    }).filter(p => {
      if (!actionedSearchQuery) return true;
      const q = actionedSearchQuery.toLowerCase().trim();
      return (
        (p.pvNo && p.pvNo.toLowerCase().includes(q)) ||
        (p.requisitionNo && p.requisitionNo.toLowerCase().includes(q)) ||
        (p.provider && p.provider.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.auditRemarks && p.auditRemarks.toLowerCase().includes(q))
      );
    });
  }, [pvQueue, actionedStatusFilter, actionedSearchQuery]);

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
      
      {rejection && <div role="dialog" aria-label="Reject voucher items" style={{padding:20,background:'#fff1f2',border:'1px solid #fda4af'}}>
        <h3>Reason for rejecting {rejection.ids.length} item(s)</h3>
        <label>Rejection reason<textarea aria-label="Rejection reason" value={rejectionReason} onChange={event=>setRejectionReason(event.target.value)} /></label>
        <button type="button" disabled={isActioning || !rejectionReason.trim()} onClick={()=>applyItemDecisions(rejection.voucher,rejection.ids,'Declined',rejectionReason)}>Confirm rejection</button>
        <button type="button" disabled={isActioning} onClick={()=>setRejection(null)}>Cancel</button>
      </div>}
      {/* Top Banner Header - Click to Toggle Voucher Particulars & Calculations */}
      <div 
        onClick={() => (isParticularsOpen ? setIsParticularsOpen(false) : openParticularsStation())}
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
              if (isParticularsOpen) setIsParticularsOpen(false);
              else openParticularsStation();
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
                const parsedItems = parsePvItems(item);
                const hasMultiple = parsedItems && parsedItems.length > 1;

                return (
                  <React.Fragment key={item.id || item.pvNo || idx}>
                    {/* Main Voucher Row */}
                    <tr
                      onClick={() => populateFormWithVoucher(item, 0)}
                      style={{
                        background: isSelected ? '#0284c7' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc'),
                        color: isSelected ? '#ffffff' : '#0f172a',
                        cursor: 'pointer',
                        borderBottom: hasMultiple ? '1px dashed #cbd5e1' : '1px solid #cbd5e1'
                      }}
                      title={hasMultiple ? `PV contains ${parsedItems.length} individual items. Click to open and audit.` : 'Click to audit voucher'}
                    >
                      <td style={{ padding: '5px 8px', fontWeight: 800 }}>
                        {item.accountName || item.description?.substring(0, 20)}
                        {hasMultiple && (
                          <span style={{
                            marginLeft: 6,
                            fontSize: 9.5,
                            background: isSelected ? 'rgba(255,255,255,0.25)' : '#e0f2fe',
                            color: isSelected ? '#fff' : '#0369a1',
                            padding: '1px 6px',
                            borderRadius: 10,
                            fontWeight: 900
                          }}>
                            {parsedItems.length} items
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '5px 8px', textAlign: 'right' }}>{Number(item.budget || 0).toFixed(2)}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right' }}>{Number(item.actuals || 0).toFixed(2)}</td>
                      <td style={{ padding: '5px 8px' }}>{item.batchNo || 'BATCH-2026-01'}</td>
                      <td style={{ padding: '5px 8px' }}>{item.tDate || item.datePrepared}</td>
                      <td style={{ padding: '5px 8px' }}>{item.vDate || item.valuedDate}</td>
                      <td style={{ padding: '5px 8px', fontWeight: 700 }}>{item.provider || item.clientProvider}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 900 }}>{Number(item.total || item.cost || 0).toFixed(2)}</td>
                      <td style={{ padding: '5px 8px' }}>
                        {item.description}
                      </td>
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

                    {/* Split Individual PV Items (Shown separately but within the same PV) */}
                    {hasMultiple && parsedItems.map((subItem, sIdx) => {
                      const isSubActive = isSelected && activeItemIndex === sIdx;
                      const subTotal = Number(subItem.totalAmount || (subItem.costPerItem * subItem.qty) || subItem.cost || 0);

                      return (
                        <tr
                          key={`${item.id || item.pvNo || idx}_sub_${subItem.id || sIdx}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            populateFormWithVoucher(item, sIdx);
                          }}
                          style={{
                            background: isSubActive ? '#dbeafe' : (isSelected ? '#f0f9ff' : (sIdx % 2 === 0 ? '#fbfcfe' : '#f8fafc')),
                            color: '#0f172a',
                            cursor: 'pointer',
                            borderBottom: sIdx === parsedItems.length - 1 ? '1px solid #94a3b8' : '1px dashed #e2e8f0',
                            fontSize: 10.5
                          }}
                          title={`Click to inspect / edit Item ${sIdx + 1} (${subItem.description}) in PV #${item.pvNo || item.id}`}
                        >
                          <td style={{ padding: '4px 8px 4px 20px', fontWeight: 800, color: '#0369a1' }}>
                            ↳ Item {sIdx + 1}:
                          </td>
                          <td style={{ padding: '4px 8px', textAlign: 'right', color: '#94a3b8' }}>-</td>
                          <td style={{ padding: '4px 8px', textAlign: 'right', color: '#94a3b8' }}>-</td>
                          <td style={{ padding: '4px 8px', color: '#64748b' }}>{item.batchNo || 'BATCH-2026-01'}</td>
                          <td style={{ padding: '4px 8px', color: '#64748b' }}>{item.tDate || item.datePrepared}</td>
                          <td style={{ padding: '4px 8px', color: '#64748b' }}>{item.vDate || item.valuedDate}</td>
                          <td style={{ padding: '4px 8px', fontWeight: 600, color: '#334155' }}>
                            {subItem.provider || item.provider || item.clientProvider}
                          </td>
                          <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 900, color: '#0369a1' }}>
                            {subTotal.toFixed(2)}
                          </td>
                          <td style={{ padding: '4px 8px', fontWeight: 700, color: '#0f172a' }}>
                            <span style={{
                              background: '#e0f2fe',
                              color: '#0284c7',
                              padding: '1px 5px',
                              borderRadius: 3,
                              fontSize: 9.5,
                              marginRight: 6,
                              fontWeight: 900
                            }}>
                              x{subItem.qty}
                            </span>
                            <span>{subItem.description}</span>
                            {isSubActive && (
                              <span style={{ marginLeft: 6, fontSize: 9.5, color: '#16a34a', fontWeight: 900 }}>
                                ● Active in station
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '4px 8px', color: '#64748b', fontSize: 10 }}>
                            {subItem.auditRemarks || item.auditRemarks || 'Line item in voucher'}
                          </td>
                          <td style={{ padding: '4px 8px', color: '#64748b' }}>{item.imputer || 'Sub-Admin'}</td>
                          <td style={{ padding: '4px 8px', color: '#64748b' }}>{item.inputDate || item.datePrepared}</td>
                          <td style={{ padding: '4px 8px', textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: 9.5,
                              fontWeight: 900,
                              background: subItem.status === 'Validated' || subItem.status?.includes('Approved') ? '#dcfce7' : (subItem.status === 'Declined' || subItem.status === 'Cancel PV' ? '#fee2e2' : '#fef3c7'),
                              color: subItem.status === 'Validated' || subItem.status?.includes('Approved') ? '#166534' : (subItem.status === 'Declined' || subItem.status === 'Cancel PV' ? '#dc2626' : '#b45309')
                            }}>
                              {subItem.status || 'Pending'}
                            </span>
                            <span style={{ marginLeft: 6, display: 'inline-flex', gap: 3 }}>
                              {!itemDecided(subItem) && (<button
                                type="button"
                                title={`Approve ${subItem.description}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleActionItemDirect(subItem.id, 'Validated', item);
                                }}
                                style={{
                                  padding: '2px 5px',
                                  background: '#166534',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: 3,
                                  fontSize: 9.5,
                                  fontWeight: 900,
                                  cursor: 'pointer'
                                }}
                              >
                                ✓
                              </button>)}
                              {!itemDecided(subItem) && (<button
                                type="button"
                                title={`Decline / Reject ${subItem.description}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleActionItemDirect(subItem.id, 'Declined', item);
                                }}
                                style={{
                                  padding: '2px 5px',
                                  background: '#dc2626',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: 3,
                                  fontSize: 9.5,
                                  fontWeight: 900,
                                  cursor: 'pointer'
                                }}
                              >
                                ✗
                              </button>)}
                            </span>
                          </td>
                          <td style={{ padding: '4px 8px', color: '#64748b' }}>{item.company || 'Remalj Carewell'}</td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONDITIONAL STATION: Opens only when Payment Voucher (PV) Pre-Audit & Editing Station is clicked or a PV is selected */}
      {!isParticularsOpen ? (
        <div
          onClick={() => openParticularsStation()}
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
                openParticularsStation();
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

        {/* ITEMIZATION SECTION FOR VOUCHER LINE ITEMS */}
        {currentItems.length > 0 && (
          <div style={{
            background: '#f0f9ff',
            border: '1.5px solid #0284c7',
            borderRadius: 8,
            padding: 14,
            marginBottom: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: '#0369a1' }}>
                  📦 Voucher #{pvNo} Contains {currentItems.length} Itemized Lines
                </span>
                <span style={{ fontSize: 11, background: '#bae6fd', color: '#0369a1', padding: '2px 8px', borderRadius: 12, fontWeight: 800 }}>
                  {selectedItemIds.length} of {currentItems.length} Selected for Action
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={handleToggleSelectAllItems}
                  style={{ fontSize: 11, padding: '4px 10px', background: '#fff', border: '1px solid #0284c7', color: '#0284c7', borderRadius: 4, fontWeight: 800, cursor: 'pointer' }}
                >
                  {selectedItemIds.length === currentItems.filter(item=>!itemDecided(item)).length ? 'Deselect All' : 'Select All Items'}
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 6, border: '1px solid #cbd5e1' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#e0f2fe', color: '#0369a1', textAlign: 'left' }}>
                    <th style={{ padding: '6px 8px', width: 30, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedItemIds.length === currentItems.filter(item=>!itemDecided(item)).length && currentItems.length > 0}
                        onChange={handleToggleSelectAllItems}
                        title="Select / Deselect all items"
                      />
                    </th>
                    <th style={{ padding: '6px 8px' }}>Line Item Particulars</th>
                    <th style={{ padding: '6px 8px' }}>Date Prepared</th>
                    <th style={{ padding: '6px 8px' }}>Payee / Merchant</th>
                    <th style={{ padding: '6px 8px' }}>Service Provider ID</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>Rate (GHS)</th>
                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>Subtotal (GHS)</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>Item Status</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((item, idx) => {
                    const isSelected = selectedItemIds.includes(item.id);
                    const isActive = activeItemIndex === idx;
                    return (
                      <tr
                        key={item.id || idx}
                        style={{
                          background: isActive ? '#f0fdf4' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc'),
                          borderBottom: '1px solid #e2e8f0'
                        }}
                      >
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            disabled={itemDecided(item) || isActioning}
                            checked={isSelected && !itemDecided(item)}
                            onChange={() => handleToggleItemSelect(item.id)}
                          />
                        </td>
                        <td style={{ padding: '6px 8px', fontWeight: 800, color: '#0f172a' }}>
                          {item.description}
                          {isActive && <span style={{ marginLeft: 6, fontSize: 9.5, color: '#16a34a', fontWeight: 900 }}>● Editing in station</span>}
                        </td>
                        <td style={{ padding: '6px 8px', color: '#0f3a4b', fontWeight: 800, whiteSpace: 'nowrap' }}>
                          {formatDatePreview(item.datePrepared || item.tDate || datePrepared) || (item.datePrepared || item.tDate || datePrepared || 'N/A')}
                        </td>
                        <td style={{ padding: '6px 8px', color: '#475569' }}>
                          {item.provider || clientProvider}
                        </td>
                        <td style={{ padding: '6px 8px', color: '#0f3a4b', fontWeight: 800 }}>
                          {item.providerId || providerId || 'N/A'}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 800 }}>
                          {item.qty}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'right' }}>
                          {Number(item.costPerItem || item.cost || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 900, color: '#0369a1' }}>
                          {Number(item.totalAmount || item.total || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: 4,
                            fontSize: 9.5,
                            fontWeight: 900,
                            background: item.status === 'Validated' || item.status?.includes('Approved') ? '#dcfce7' : (item.status === 'Declined' ? '#fee2e2' : '#fef3c7'),
                            color: item.status === 'Validated' || item.status?.includes('Approved') ? '#166534' : (item.status === 'Declined' ? '#dc2626' : '#b45309')
                          }}>
                            {item.status || 'Pending'}
                          </span>
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
                            {!itemDecided(item) && (<button
                              type="button"
                              disabled={isActioning}
                              onClick={() => handleActionItemDirect(item.id, 'Validated')}
                              style={{
                                padding: '3px 8px', background: '#166534', color: '#fff', border: 'none',
                                borderRadius: 4, fontSize: 10, fontWeight: 800, cursor: 'pointer'
                              }}
                            >
                              Approve
                            </button>)}
                            {!itemDecided(item) && (<button
                              type="button"
                              disabled={isActioning}
                              onClick={() => handleActionItemDirect(item.id, 'Declined')}
                              style={{
                                padding: '3px 8px', background: '#dc2626', color: '#fff', border: 'none',
                                borderRadius: 4, fontSize: 10, fontWeight: 800, cursor: 'pointer'
                              }}
                            >
                              Reject
                            </button>)}
                            <button
                              type="button"
                              onClick={() => handleSelectItemForEdit(item, idx)}
                              style={{
                                padding: '3px 8px',
                                background: isActive ? '#0f3a4b' : '#0284c7',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 4,
                                fontSize: 10,
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              {isActive ? 'Editing' : 'Edit'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Quick multi-item action toolbar */}
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#0369a1', fontWeight: 700 }}>
                💡 Approve or reject each line on its own. One item can be approved while another in the same PV is rejected.
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                {!reviewComplete && !itemDecided(currentItems[activeItemIndex]) && (<button
                  type="button"
                  onClick={handleActionSingleItem}
                  disabled={isActioning}
                  style={{
                    padding: '6px 12px',
                    background: '#0f3a4b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Action Single Item (#{currentItems[activeItemIndex]?.description?.substring(0, 16) || 'Item'}...)
                </button>)}
                {!reviewComplete && (<button
                  type="button"
                  onClick={handleBulkActionSelectedItems}
                  disabled={isActioning || selectedItemIds.length === 0}
                  style={{
                    padding: '6px 14px',
                    background: selectedItemIds.length > 0 ? '#16a34a' : '#94a3b8',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 900,
                    cursor: selectedItemIds.length > 0 ? 'pointer' : 'not-allowed'
                  }}
                >
                  Bulk Action Selected Items ({selectedItemIds.length}) &gt;&gt;
                </button>)}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
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

          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 3 }}>Service Provider ID</label>
            <input
              type="text"
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              placeholder="ID / Account #"
              style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 700 }}
            />
          </div>

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

          <div style={{ display: 'grid', gridTemplateColumns: currentItems.length > 1 ? '1fr 1fr 1fr' : '1fr 1fr', gap: 10 }}>
            {!reviewComplete && !itemDecided(currentItems[activeItemIndex]) && (<button
              type="button"
              onClick={handleActionSingleItem}
              disabled={isActioning}
              style={{
                padding: '10px 14px', background: '#0f3a4b', color: '#fff', border: 'none',
                borderRadius: 6, fontSize: 11.5, fontWeight: 800, cursor: isActioning ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                opacity: isActioning ? 0.75 : 1
              }}
            >
              {isActioning ? <Loader2 size={14} className="animate-spin" /> : null}
              {currentItems.length > 1
                ? `Action Active Item (${currentItems[activeItemIndex]?.description?.substring(0, 14) || 'Item'}...)`
                : `Action Single PV Item (#${pvNo})`}
            </button>)}

            {currentItems.length > 1 && !reviewComplete && (
              <button
                type="button"
                onClick={handleBulkActionSelectedItems}
                disabled={isActioning || selectedItemIds.length === 0}
                style={{
                  padding: '10px 14px',
                  background: selectedItemIds.length > 0 ? '#16a34a' : '#94a3b8',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 11.5,
                  fontWeight: 900,
                  cursor: (isActioning || selectedItemIds.length === 0) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  opacity: isActioning ? 0.75 : 1
                }}
              >
                {isActioning ? <Loader2 size={14} className="animate-spin" /> : null}
                Bulk Action Selected ({selectedItemIds.length})
              </button>
            )}

            {!reviewComplete && (<button
              type="button"
              onClick={handleActionNextOrAll}
              disabled={isActioning}
              style={{
                padding: '10px 14px', background: '#0284c7', color: '#fff', border: 'none',
                borderRadius: 6, fontSize: 11.5, fontWeight: 900, cursor: isActioning ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                opacity: isActioning ? 0.75 : 1
              }}
            >
              {isActioning ? <Loader2 size={14} className="animate-spin" /> : null}
              Action Next PV / All Items
            </button>)}
          </div>
        </div>


      </div>
    </>
  )}

  {/* EXECUTIVE AUDIT TRAIL: RECENTLY ACTIONED PAYMENT VOUCHERS (AT VERY BOTTOM OF PAGE) */}
  <div style={{
    marginTop: 24,
    background: '#ffffff',
    border: '1.5px solid #cbd5e1',
    borderRadius: 10,
    overflow: 'hidden',
    boxShadow: '0 4px 14px rgba(0,0,0,0.05)'
  }}>
    {/* Header Banner */}
    <div style={{
      background: '#0f3a4b',
      color: '#ffffff',
      padding: '14px 20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 12
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ background: '#38bdf8', width: 5, height: 24, borderRadius: 2 }} />
        <div>
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900, letterSpacing: '0.02em', color: '#fff' }}>
            Executive Pre-Audit Ledger · Recently Actioned Payment Vouchers
          </h4>
          <div style={{ fontSize: 11, color: '#bae6fd', marginTop: 2 }}>
            Register of payment vouchers reviewed and decisioned by Head Admin · Filterable by status
          </div>
        </div>
      </div>

      {/* Search Input for Actioned Table */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="text"
          placeholder="Filter actioned records..."
          value={actionedSearchQuery}
          onChange={(e) => setActionedSearchQuery(e.target.value)}
          style={{
            padding: '5px 12px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.3)',
            background: 'rgba(255,255,255,0.15)',
            color: '#fff',
            fontSize: 11,
            outline: 'none',
            width: 200
          }}
        />
        {actionedSearchQuery && (
          <button
            type="button"
            onClick={() => setActionedSearchQuery('')}
            style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 4, color: '#fff', fontSize: 10, cursor: 'pointer' }}
          >
            Clear
          </button>
        )}
      </div>
    </div>

    {/* Filterable Status Chips Bar */}
    <div style={{
      background: '#f8fafc',
      padding: '12px 18px',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      gap: 8,
      flexWrap: 'wrap',
      alignItems: 'center'
    }}>
      <span style={{ fontSize: 11, fontWeight: 900, color: '#475569', marginRight: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Filter Status:
      </span>

      {[
        { key: 'ALL', label: 'All Actioned', count: actionedCounts.all, color: '#0f3a4b' },
        { key: 'VALIDATED', label: 'Validated / Approved', count: actionedCounts.validated, color: '#16a34a' },
        { key: 'DECLINED', label: 'Declined', count: actionedCounts.declined, color: '#dc2626' },
        { key: 'POSTPONED', label: 'Postponed', count: actionedCounts.postponed, color: '#0284c7' },
        { key: 'CANCEL', label: 'Cancelled', count: actionedCounts.cancelled, color: '#475569' },
        { key: 'NON-ACCRUAL', label: 'Non-accrual', count: actionedCounts.nonAccrual, color: '#6b21a8' },
      ].map((f) => (
        <button
          key={f.key}
          type="button"
          onClick={() => setActionedStatusFilter(f.key)}
          style={{
            padding: '5px 12px',
            borderRadius: 20,
            border: actionedStatusFilter === f.key ? `2px solid ${f.color}` : '1px solid #cbd5e1',
            background: actionedStatusFilter === f.key ? f.color : '#ffffff',
            color: actionedStatusFilter === f.key ? '#ffffff' : '#334155',
            fontSize: 11,
            fontWeight: 800,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.15s ease'
          }}
        >
          <span>{f.label}</span>
          <span style={{
            background: actionedStatusFilter === f.key ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
            color: actionedStatusFilter === f.key ? '#ffffff' : '#475569',
            padding: '1px 6px',
            borderRadius: 10,
            fontSize: 10,
            fontWeight: 900
          }}>
            {f.count}
          </span>
        </button>
      ))}
    </div>

    {/* Table of Recently Actioned PVs */}
    <div style={{ overflowX: 'auto' }}>
      {recentlyActionedPVs.length === 0 ? (
        <div style={{ padding: '36px 20px', textAlign: 'center', color: '#64748b' }}>
          <div style={{ fontSize: 13, fontWeight: 800 }}>No Actioned Payment Vouchers Found</div>
          <div style={{ fontSize: 11.5, marginTop: 4 }}>
            {actionedStatusFilter === 'ALL'
              ? 'Vouchers actioned in the pre-audit desk above will automatically be logged here.'
              : `No payment vouchers currently match the "${actionedStatusFilter}" status filter.`}
          </div>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
          <thead>
            <tr style={{ background: '#f1f5f9', color: '#334155', textAlign: 'left', borderBottom: '1px solid #cbd5e1' }}>
              <th style={{ padding: '8px 12px' }}>PV N/o</th>
              <th style={{ padding: '8px 12px' }}>Requisition N/o</th>
              <th style={{ padding: '8px 12px' }}>Valued Date</th>
              <th style={{ padding: '8px 12px' }}>Client / Payee</th>
              <th style={{ padding: '8px 12px' }}>Particulars / Items</th>
              <th style={{ padding: '8px 12px', textAlign: 'right' }}>Debit (GHS)</th>
              <th style={{ padding: '8px 12px', textAlign: 'center' }}>Executive Status</th>
              <th style={{ padding: '8px 12px' }}>Pre-Audit Remarks</th>
              <th style={{ padding: '8px 12px' }}>Imputer</th>
              <th style={{ padding: '8px 12px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {recentlyActionedPVs.map((item, idx) => {
              const hasMulti = Array.isArray(item.items) && item.items.length > 1;
              const amount = Number(item.total || item.cost || 0);
              return (
                <tr
                  key={item.id || item.pvNo || idx}
                  style={{
                    background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                    borderBottom: '1px solid #e2e8f0'
                  }}
                >
                  <td style={{ padding: '8px 12px', fontWeight: 900, color: '#0f3a4b' }}>
                    {item.pvNo || item.id}
                  </td>
                  <td style={{ padding: '8px 12px', color: '#64748b', fontWeight: 700 }}>
                    {item.requisitionNo || 'N/A'}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    {item.valuedDate || item.vDate || item.datePrepared || 'N/A'}
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: 800, color: '#1e293b' }}>
                    {item.provider || item.clientProvider || 'Vendor'}
                  </td>
                  <td style={{ padding: '8px 12px', maxWidth: 240 }}>
                    <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {item.description}
                    </div>
                    {hasMulti && (
                      <span style={{ fontSize: 9.5, color: '#0284c7', fontWeight: 800, display: 'inline-block', marginTop: 2 }}>
                        📦 {item.items.length} itemized lines breakdown
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 900, color: '#0f3a4b' }}>
                    {amount.toFixed(2)}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 900,
                      background:
                        item.status === 'Validated' || item.status?.includes('Approved') ? '#dcfce7' :
                        item.status === 'Declined' ? '#fee2e2' :
                        item.status === 'Postponed' ? '#e0f2fe' :
                        item.status === 'Cancel PV' || item.status === 'Cancelled' ? '#f1f5f9' :
                        item.status === 'Non-accrual' ? '#f3e8ff' : '#fef3c7',
                      color:
                        item.status === 'Validated' || item.status?.includes('Approved') ? '#166534' :
                        item.status === 'Declined' ? '#dc2626' :
                        item.status === 'Postponed' ? '#0369a1' :
                        item.status === 'Cancel PV' || item.status === 'Cancelled' ? '#475569' :
                        item.status === 'Non-accrual' ? '#6b21a8' : '#b45309',
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', color: '#475569', fontSize: 11, maxWidth: 200 }}>
                    {item.auditRemarks || '—'}
                  </td>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#64748b' }}>
                    {item.imputer || item.preparedBy || 'Sub-Admin'}
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        populateFormWithVoucher(item);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      style={{
                        padding: '4px 10px',
                        background: '#0284c7',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        fontSize: 10.5,
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      Recall / Edit
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  </div>

</div>
);
}

