import SchoolContactDetails from '../School/SchoolContactDetails';
import { disbursementItems, requiresItemDisbursement } from '../../lib/pvDisbursementItems.js';
import ItemDisbursementModal from './ItemDisbursementModal';
import ViewportModal from '../Modal/ViewportModal';
import { payableAmount, voucherIdentityKey as disbursementIdentityKey } from '../../lib/recordRules.js';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  CreditCard, CheckCircle2, DollarSign, Search, FileText, Printer, Clock,
  ArrowRight, ShieldCheck, AlertCircle, Calendar, Building2, Filter,
  ChevronDown, X, RefreshCw, Send, Check, Hash, UserCheck, Lock, Loader2
} from 'lucide-react';
import { usePortalData, pvNosMatch, mapApiPaymentVoucher } from '../../data/PortalStore';
import { api } from '../../services/api';
import { SchoolLogoSVG } from '../Onboarding/OfficialApplicationForm';
import { SCHOOL_PL_ACCOUNTS, getPlAccountCode, printPvPage } from '../../data/chartOfAccounts';

function isPvDisbursed(v) {
  const s = String(v?.status || '').toLowerCase().trim();
  if (s.includes('partial')) return false;
  if (s === 'disbursed' || s === 'paid' || s.includes('disburs') || s.includes('settled')) return true;
  if (v?.disbursedAt || v?.disbursed_at || v?.disbursedBy || v?.disbursed_by) return true;
  return false;
}

export default function PayPVForm({ onCompleted } = {}) {
  const { paymentVouchers = [], disbursePaymentVoucher } = usePortalData();

  const voucherPayableAmount = payableAmount;

  // Search & Filter State
  const [activeTab, setActiveTab] = useState('ready'); // 'ready' | 'history'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethodFilter, setSelectedMethodFilter] = useState('ALL');

  // Selected Voucher for Disbursement Modal
  const [payingVoucher, setPayingVoucher] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState('');

  // Payment Form Fields
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer (Instant EFT)');
  const [sourceAccount, setSourceAccount] = useState('Stanbic Bank - Operations Account (Acc: 90400031892)');
  const [plAccountName, setPlAccountName] = useState('Diesel');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [disbursementNotes, setDisbursementNotes] = useState('');

  // Receipt / Advice Print Modal State
  const [receiptVoucher, setReceiptVoucher] = useState(null);
  const [dbDisbursed, setDbDisbursed] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [historySourceCount, setHistorySourceCount] = useState(0);

  const loadDisbursementHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const raw = await api.getDisbursedPaymentVouchers();
      const mapped = (Array.isArray(raw) ? raw : []).map(mapApiPaymentVoucher).filter((v) => v && (v.id || v.pvNo));
      setDbDisbursed(mapped);
      setHistorySourceCount(mapped.length);
    } catch (err) {
      setHistoryError(err.message || 'Could not load disbursement history from the database.');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDisbursementHistory();
  }, [loadDisbursementHistory]);

  useEffect(() => {
    if (activeTab === 'history') loadDisbursementHistory();
  }, [activeTab, loadDisbursementHistory]);

  // Filter vouchers that are approved / validated (Ready for Payment)
  const readyVouchers = useMemo(() => {
    return (paymentVouchers || []).filter((v) => {
      const s = String(v.status || '').toLowerCase().trim();
      return (
        s === 'validated' ||
        s === 'approved' ||
        s === 'partially approved' ||
        s === 'partially paid' ||
        s === 'pre-audited & approved' ||
        s === 'pre-audited' ||
        s === 'pre_audited'
      );
    });
  }, [paymentVouchers]);

  // All DISBURSED vouchers from the live database, merged with local store copies
  const disbursedVouchers = useMemo(() => {
    const merged = new Map();
    [...(paymentVouchers || []), ...dbDisbursed].forEach((v) => {
      if (!v || !isPvDisbursed(v)) return;
      let key = disbursementIdentityKey(v);
      const existingKey = [...merged.keys()].find((k) => {
        if (k === key) return true;
        const prev = merged.get(k);
        return pvNosMatch(prev?.pvNo, v.pvNo)
          || (prev?.id && v.id && String(prev.id) === String(v.id));
      });
      if (existingKey) key = existingKey;
      const prev = merged.get(key) || {};
      merged.set(key, {
        ...prev,
        ...v,
        status: 'DISBURSED',
        id: (prev.id && !/^pv-\d+$/i.test(String(prev.id))) ? prev.id : (v.id || prev.id),
        pvNo: (String(v.pvNo || '').length >= String(prev.pvNo || '').length) ? (v.pvNo || prev.pvNo) : (prev.pvNo || v.pvNo),
        disbursedAt: v.disbursedAt || prev.disbursedAt,
        disbursedBy: v.disbursedBy || prev.disbursedBy,
        disbursementReference: v.disbursementReference || prev.disbursementReference,
        disbursementNotes: v.disbursementNotes || prev.disbursementNotes,
        paymentMethod: v.paymentMethod || prev.paymentMethod,
        total: v.total || prev.total,
      });
    });
    return Array.from(merged.values()).sort((a, b) => {
      const left = new Date(b.disbursedAt || b.updatedAt || b.paymentDate || 0).getTime();
      const right = new Date(a.disbursedAt || a.updatedAt || a.paymentDate || 0).getTime();
      return left - right;
    });
  }, [paymentVouchers, dbDisbursed]);

  // Financial Summary Totals
  const readyTotalGHS = useMemo(() => {
    return readyVouchers.reduce((acc, v) => acc + voucherPayableAmount(v), 0);
  }, [readyVouchers]);

  const disbursedTotalGHS = useMemo(() => {
    return disbursedVouchers.reduce((acc, v) => acc + (parseFloat(v.paidTotal ?? v.total ?? v.cost ?? v.amount) || 0), 0);
  }, [disbursedVouchers]);

  // Filtered lists based on search
  const filteredReady = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return readyVouchers.filter((v) => {
      const pvNo = String(v.pvNo || v.id || '').toLowerCase();
      const req = String(v.requisitionNo || '').toLowerCase();
      const prov = String(v.provider || v.payee_name || '').toLowerCase();
      const desc = String(v.description || '').toLowerCase();
      return !q || pvNo.includes(q) || req.includes(q) || prov.includes(q) || desc.includes(q);
    });
  }, [readyVouchers, searchQuery]);

  const filteredDisbursed = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return disbursedVouchers.filter((v) => {
      const pvNo = String(v.pvNo || v.id || '').toLowerCase();
      const req = String(v.requisitionNo || '').toLowerCase();
      const prov = String(v.provider || v.payee_name || '').toLowerCase();
      const ref = String(v.disbursementReference || '').toLowerCase();
      return !q || pvNo.includes(q) || req.includes(q) || prov.includes(q) || ref.includes(q);
    });
  }, [disbursedVouchers, searchQuery]);

  // Resolve detailed individual PV items for disbursement receipt printing
  const getReceiptPvItems = useCallback((v) => {
    if (!v) return [];

    const storeMatch = (paymentVouchers || []).find((pv) => pvNosMatch(pv.pvNo || pv.id, v.pvNo || v.id));
    const candidateItems = (Array.isArray(v.items) && v.items.length > 0)
      ? v.items
      : (Array.isArray(storeMatch?.items) && storeMatch.items.length > 0)
        ? storeMatch.items
        : null;

    if (candidateItems && candidateItems.length > 0) {
        return candidateItems.map((it, idx) => {
          const qty = Number(it.qty !== undefined ? it.qty : (it.quantity !== undefined ? it.quantity : 1)) || 1;
          const lineTotal = Number(it.totalAmount !== undefined ? it.totalAmount : (it.total !== undefined ? it.total : (it.amount || 0))) || 0;
          const unitRate = Number(it.costPerItem !== undefined ? it.costPerItem : (it.unit_cost !== undefined ? it.unit_cost : (it.cost || (qty > 0 ? lineTotal / qty : lineTotal)))) || 0;

          return {
            itemNo: idx + 1,
            description: it.description || it.particulars || it.itemDescription || `Item Line #${idx + 1}`,
            category: it.category || it.plAccountName || v.plAccountName || 'Operational Expense',
            provider: it.provider || it.payee_name || v.provider || v.payee_name || 'Vendor',
            qty,
            costPerItem: unitRate,
            totalAmount: lineTotal > 0 ? lineTotal : Number((qty * unitRate).toFixed(2)),
            status: it.status || v.status || 'Disbursed',
            remarks: it.auditRemarks || it.remarks || ''
          };
        });
    }

    const desc = String(v.description || storeMatch?.description || '').trim();
    const totalAmount = Number(v.total || v.cost || v.amount || 0);
    const qty = Number(v.qty || v.quantity || 1) || 1;
    const unitRate = Number(v.costPerItem || v.cost || (qty > 0 ? totalAmount / qty : totalAmount)) || totalAmount;

    return [{
      itemNo: 1,
      description: desc || 'School operational expenditure settlement line item',
      category: v.plAccountName || 'Operational Expense',
      provider: v.provider || v.payee_name || 'Vendor',
      qty,
      costPerItem: unitRate,
      totalAmount,
      status: v.status || 'Disbursed',
      remarks: v.disbursementNotes || ''
    }];
  }, [paymentVouchers]);

  // Open Payment Modal
  const handleOpenPayModal = (voucher) => {
    setPayingVoucher({ ...voucher, items: disbursementItems(voucher) });
    const generatedRef = `TXN-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    setReferenceNumber(generatedRef);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setDisbursementNotes(`Disbursement authorized for ${voucher.provider || 'Vendor'} as approved by Head Admin.`);
  };

  // Submit Payment / Disbursement
  const handleConfirmDisbursement = async (e) => {
    e.preventDefault();
    if (!payingVoucher || requiresItemDisbursement(payingVoucher) || isProcessing) return;

    setIsProcessing(true);
    const targetPvNo = payingVoucher.pvNo || payingVoucher.id;

    try {
      let confirmedVoucher;
      if (disbursePaymentVoucher) {
        confirmedVoucher = await disbursePaymentVoucher(targetPvNo, {
          paymentMethod,
          sourceAccount,
          plAccountName,
          plAccountCode: getPlAccountCode(plAccountName),
          referenceNumber: referenceNumber.trim() || `TXN-${Date.now()}`,
          paymentDate,
          notes: disbursementNotes
        }, 'Head Admin / Headmaster');
      }

      void loadDisbursementHistory();

      setPaymentNotice(`💸 ✅ Successfully disbursed GHS ${voucherPayableAmount(payingVoucher).toLocaleString(undefined, { minimumFractionDigits: 2 })} for PV #${targetPvNo}. Payment reference: ${referenceNumber}`);
      
      const paidSnapshot = mapApiPaymentVoucher(confirmedVoucher);
      setPayingVoucher(null);
      if (onCompleted) onCompleted(paidSnapshot);
      else setReceiptVoucher(paidSnapshot);
    } catch (err) {
      setPaymentNotice(err?.message || 'Disbursing this payment voucher failed.');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setPaymentNotice(''), 8000);
    }
  };

  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)', color: '#0f172a', paddingBottom: 40 }}>
      <div className="no-print pv-desk-screen">
      {/* Top Header Card */}
      <div style={{
        background: 'linear-gradient(135deg, #092c3e 0%, #0f3a4b 100%)',
        color: '#ffffff',
        padding: '20px 24px',
        borderRadius: '12px 12px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        boxShadow: '0 4px 12px rgba(15, 58, 75, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            padding: 12,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)'
          }}>
            <CreditCard size={26} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, letterSpacing: '0.02em', color: '#fff' }}>
                Payment Voucher (PV) Disbursement Desk
              </h2>
              <span style={{
                background: 'rgba(56, 189, 248, 0.2)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                fontSize: 10.5,
                fontWeight: 900,
                padding: '2px 8px',
                borderRadius: 99,
                letterSpacing: '0.04em'
              }}>
                HEAD ADMIN ONLY
              </span>
            </div>
            <div style={{ fontSize: 12, color: '#bae6fd', marginTop: 4 }}>
              Disburse & settle financial payments exclusively for validated and approved vouchers
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.18)',
            padding: '6px 14px',
            borderRadius: 8,
            fontSize: 11.5,
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <Lock size={13} color="#38bdf8" /> Executive Authorization Level
          </div>
        </div>
      </div>

      {/* Financial Metrics Summary Strip */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderTop: 'none',
        padding: '16px 20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: 14
      }}>
        {/* Metric 1: Pending Disbursement Total */}
        <div style={{
          background: '#ffffff',
          borderRadius: 8,
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #0284c7',
          padding: '12px 16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', justifyContent: 'space-between' }}>
            <span>Awaiting Payment</span>
            <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: 10, fontSize: 10 }}>
              {readyVouchers.length} Vouchers
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#0f3a4b', marginTop: 6 }}>
            GHS {readyTotalGHS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 11, color: '#0284c7', marginTop: 4, fontWeight: 700 }}>
            Validated &amp; Approved by Pre-Audit
          </div>
        </div>

        {/* Metric 2: Total Disbursed / Settled */}
        <div style={{
          background: '#ffffff',
          borderRadius: 8,
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #16a34a',
          padding: '12px 16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', justifyContent: 'space-between' }}>
            <span>Total Disbursed</span>
            <span style={{ background: '#dcfce7', color: '#166534', padding: '1px 6px', borderRadius: 10, fontSize: 10 }}>
              {disbursedVouchers.length} Paid
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#15803d', marginTop: 6 }}>
            GHS {disbursedTotalGHS.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 11, color: '#16a34a', marginTop: 4, fontWeight: 700 }}>
            Settled via Bank Transfer / MoMo / Cheque
          </div>
        </div>

        {/* Metric 3: Disbursement Policy Guard */}
        <div style={{
          background: '#ffffff',
          borderRadius: 8,
          border: '1px solid #e2e8f0',
          borderLeft: '4px solid #8b5cf6',
          padding: '12px 16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
        }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Payment Gatekeeper
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={16} color="#7c3aed" /> 100% Pre-Audit Enforced
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
            Unapproved or pending vouchers cannot be disbursed
          </div>
        </div>
      </div>

      {/* Banner Notice Alert */}
      {paymentNotice && (
        <div style={{
          background: paymentNotice.includes('✅') ? '#dcfce7' : '#fef3c7',
          color: paymentNotice.includes('✅') ? '#166534' : '#92400e',
          padding: '10px 20px',
          fontSize: 12.5,
          fontWeight: 800,
          borderLeft: '1px solid #cbd5e1',
          borderRight: '1px solid #cbd5e1',
          borderBottom: '1px solid #cbd5e1',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span>ℹ️</span> {paymentNotice}
        </div>
      )}

      {/* Main Body Station */}
      <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderTop: 'none', padding: 20 }}>
        
        {/* Navigation Tabs & Search Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 18,
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: 14
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setActiveTab('ready')}
              style={{
                padding: '8px 18px',
                borderRadius: 6,
                fontWeight: 900,
                fontSize: 12,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                border: 'none',
                background: activeTab === 'ready' ? '#0f3a4b' : '#f1f5f9',
                color: activeTab === 'ready' ? '#ffffff' : '#475569',
                transition: 'all 0.15s ease'
              }}
            >
              <CreditCard size={14} /> Ready for Payment
              <span style={{
                background: activeTab === 'ready' ? '#0284c7' : '#cbd5e1',
                color: '#fff',
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: 10,
                fontWeight: 800
              }}>
                {readyVouchers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              style={{
                padding: '8px 18px',
                borderRadius: 6,
                fontWeight: 900,
                fontSize: 12,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                border: 'none',
                background: activeTab === 'history' ? '#0f3a4b' : '#f1f5f9',
                color: activeTab === 'history' ? '#ffffff' : '#475569',
                transition: 'all 0.15s ease'
              }}
            >
              <CheckCircle2 size={14} /> Payment &amp; Disbursement History
              <span style={{
                background: activeTab === 'history' ? '#16a34a' : '#cbd5e1',
                color: '#fff',
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: 10,
                fontWeight: 800
              }}>
                {historyLoading ? '…' : disbursedVouchers.length}
              </span>
            </button>
            <button
              type="button"
              onClick={loadDisbursementHistory}
              disabled={historyLoading}
              title="Reload disbursed vouchers from the database"
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                fontWeight: 800,
                fontSize: 11,
                cursor: historyLoading ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                border: '1px solid #cbd5e1',
                background: '#fff',
                color: '#0f3a4b'
              }}
            >
              {historyLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              {historyLoading ? 'Loading DB…' : 'Refresh from Database'}
            </button>
          </div>

          {/* Search Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#64748b" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search by PV #, Payee, Requisition..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '7px 12px 7px 32px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 11.5,
                  width: 250,
                  background: '#f8fafc',
                  outline: 'none'
                }}
              />
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ padding: '6px 10px', background: '#e2e8f0', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer', color: '#475569' }}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: Ready for Payment (Validated/Approved PVs) */}
        {activeTab === 'ready' && (
          <div>
            {filteredReady.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '48px 20px',
                background: '#f8fafc',
                borderRadius: 8,
                border: '1px dashed #cbd5e1'
              }}>
                <CheckCircle2 size={44} color="#16a34a" style={{ margin: '0 auto 12px', opacity: 0.8 }} />
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#1e293b' }}>
                  No Approved Payment Vouchers Awaiting Payment
                </h4>
                <p style={{ fontSize: 12, color: '#64748b', maxWidth: 460, margin: '8px auto 0' }}>
                  All validated vouchers have been disbursed, or pending vouchers are currently undergoing pre-audit review in the <strong>Pre-Audit &amp; Approve PV</strong> station.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#0f3a4b', color: '#ffffff' }}>
                      <th style={{ padding: '10px 12px' }}>PV N/o &amp; Requisition</th>
                      <th style={{ padding: '10px 12px' }}>Client / Payee</th>
                      <th style={{ padding: '10px 12px' }}>Particulars / Description</th>
                      <th style={{ padding: '10px 12px' }}>Pre-Audit Validation</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Amount (GHS)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReady.map((v, idx) => {
                      const amount = Number(v.unpaidTotal ?? voucherPayableAmount(v)) || 0;
                      const hasMultiItems = Array.isArray(v.items) && v.items.length > 1;
                      return (
                        <tr
                          key={v.id || v.pvNo || idx}
                          style={{
                            background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                            borderBottom: '1px solid #e2e8f0',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 900, color: '#0f3a4b', fontSize: 12 }}>
                              {v.pvNo || v.id}
                            </div>
                            <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>
                              Req: {v.requisitionNo || 'N/A'}
                            </div>
                            <div style={{ fontSize: 10, color: '#0284c7', marginTop: 2, fontWeight: 700 }}>
                              Prepared: {v.datePrepared || v.tDate || 'N/A'}
                            </div>
                          </td>

                          <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 800, color: '#1e293b' }}>
                              {v.provider || v.payee_name || 'Vendor'}
                            </div>
                            {v.providerId && (
                              <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                                ID: {v.providerId}
                              </div>
                            )}
                            <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
                              Mode: {v.paymentMode || 'Bank Transfer'}
                            </div>
                          </td>

                          <td style={{ padding: '10px 12px', verticalAlign: 'top', maxWidth: 280 }}>
                            <div style={{ fontWeight: 700, color: '#334155' }}>
                              {v.description || 'Expenditure Voucher'}
                            </div>
                            {hasMultiItems && (
                              <span style={{
                                display: 'inline-block',
                                marginTop: 4,
                                background: '#f1f5f9',
                                border: '1px solid #cbd5e1',
                                borderRadius: 4,
                                padding: '1px 6px',
                                fontSize: 9.5,
                                fontWeight: 800,
                                color: '#0369a1'
                              }}>
                                📦 {v.items.length} itemized lines included
                              </span>
                            )}
                          </td>

                          <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: '#dcfce7',
                              color: '#166534',
                              border: '1px solid #86efac',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontWeight: 900,
                              fontSize: 10.5
                            }}>
                              <CheckCircle2 size={11} /> {v.status || 'Validated'}
                            </span>
                            <div style={{ fontSize: 10, color: '#475569', marginTop: 4, maxWidth: 200 }}>
                              {v.auditRemarks || 'Approved for disbursement.'}
                            </div>
                          </td>

                          <td style={{ padding: '10px 12px', textAlign: 'right', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 900, fontSize: 13.5, color: '#0f3a4b' }}>
                              GHS {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 2 }}>
                              {v.qty ? `Qty: ${v.qty}` : 'Ready'}
                            </div>
                          </td>

                          <td style={{ padding: '10px 12px', textAlign: 'center', verticalAlign: 'top' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenPayModal(v)}
                              style={{
                                padding: '7px 14px',
                                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: 6,
                                fontWeight: 900,
                                fontSize: 11.5,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                boxShadow: '0 2px 4px rgba(22, 163, 74, 0.3)',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <DollarSign size={13} /> Disburse &amp; Pay
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Payment & Disbursement History */}
        {activeTab === 'history' && (
          <div>
            {historyError && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#991b1b',
                padding: '8px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 12
              }}>
                {historyError}
              </div>
            )}
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginBottom: 10 }}>
              Showing every payment voucher with status <strong style={{ color: '#166534' }}>DISBURSED</strong> from the live database
              {historySourceCount ? ` · ${historySourceCount} settled record${historySourceCount === 1 ? '' : 's'} loaded` : ''}.
            </div>
            {historyLoading && filteredDisbursed.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontWeight: 800 }}>Loading disbursed vouchers from the database…</div>
              </div>
            ) : filteredDisbursed.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '48px 20px',
                background: '#f8fafc',
                borderRadius: 8,
                border: '1px dashed #cbd5e1'
              }}>
                <Clock size={44} color="#64748b" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#1e293b' }}>
                  No DISBURSED Payment Vouchers in the Database
                </h4>
                <p style={{ fontSize: 12, color: '#64748b', maxWidth: 440, margin: '8px auto 0' }}>
                  History now reads live from the finance vouchers API. Once a voucher is disbursed, it appears here with status DISBURSED.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: '#0f3a4b', color: '#ffffff' }}>
                      <th style={{ padding: '10px 12px' }}>PV N/o &amp; Ref #</th>
                      <th style={{ padding: '10px 12px' }}>Payee &amp; Account</th>
                      <th style={{ padding: '10px 12px' }}>Disbursement Details</th>
                      <th style={{ padding: '10px 12px' }}>Disbursed By &amp; Date</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Amount Paid (GHS)</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDisbursed.map((v, idx) => {
                      const amount = Number(v.paidTotal ?? v.total ?? v.cost ?? v.amount) || 0;
                      return (
                        <tr
                          key={v.id || v.pvNo || idx}
                          style={{
                            background: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                            borderBottom: '1px solid #e2e8f0'
                          }}
                        >
                          <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 900, color: '#0f3a4b', fontSize: 12 }}>
                              {v.pvNo || v.id}
                            </div>
                            <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 800, marginTop: 2 }}>
                              Ref: {v.disbursementReference || 'TXN-SETTLED'}
                            </div>
                            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                              Req: {v.requisitionNo || 'N/A'}
                            </div>
                          </td>

                          <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 800, color: '#1e293b' }}>
                              {v.provider || v.payee_name || 'Vendor'}
                            </div>
                            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
                              Source: {v.paymentSourceAccount || 'Operations Account'}
                            </div>
                          </td>

                          <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 700, color: '#334155' }}>
                              Method: {v.paymentMethod || 'Bank Transfer'}
                            </div>
                            <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>
                              {v.disbursementNotes || v.description}
                            </div>
                          </td>

                          <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: '#f3e8ff',
                              color: '#6b21a8',
                              border: '1px solid #d8b4fe',
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontWeight: 900,
                              fontSize: 10
                            }}>
                              <UserCheck size={11} /> {v.disbursedBy || 'Head Admin'}
                            </span>
                            <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                              {v.disbursedAt || v.paymentDate || 'Settled'}
                            </div>
                          </td>

                          <td style={{ padding: '10px 12px', textAlign: 'right', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 900, fontSize: 13, color: '#15803d' }}>
                              GHS {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <span style={{
                              display: 'inline-block',
                              marginTop: 3,
                              fontSize: 9.5,
                              color: '#166534',
                              background: '#dcfce7',
                              border: '1px solid #86efac',
                              fontWeight: 900,
                              padding: '1px 6px',
                              borderRadius: 4
                            }}>
                              DISBURSED
                            </span>
                          </td>

                          <td style={{ padding: '10px 12px', textAlign: 'center', verticalAlign: 'top' }}>
                            <button
                              type="button"
                              onClick={() => requiresItemDisbursement(v) ? handleOpenPayModal(v) : setReceiptVoucher(v)}
                              style={{
                                padding: '6px 12px',
                                background: '#f1f5f9',
                                color: '#0f3a4b',
                                border: '1px solid #cbd5e1',
                                borderRadius: 6,
                                fontWeight: 800,
                                fontSize: 11,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4
                              }}
                            >
                              <Printer size={12} /> Receipt
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* DISBURSEMENT PAYMENT MODAL */}
      {payingVoucher?.items?.length > 1 && <ItemDisbursementModal voucher={payingVoucher} onClose={() => setPayingVoucher(null)} />}
      {payingVoucher && !(payingVoucher.items?.length > 1) && (
        <ViewportModal onClose={() => setPayingVoucher(null)} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            width: '100%',
            maxWidth: 620,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            overflow: 'hidden',
            border: '1px solid #cbd5e1',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Modal Header */}
            <div style={{
              background: '#0f3a4b',
              color: '#ffffff',
              padding: '16px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <DollarSign size={20} color="#38bdf8" />
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: '#ffffff' }}>
                    Executive Payment Authorization &amp; Disbursement
                  </h3>
                  <div style={{ fontSize: 11, color: '#bae6fd' }}>
                    Payment Voucher #{payingVoucher.pvNo || payingVoucher.id}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPayingVoucher(null)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Voucher Summary Card */}
            <form onSubmit={handleConfirmDisbursement}>
              <div style={{ padding: 20 }}>
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: 14,
                  marginBottom: 16,
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1fr',
                  gap: 12
                }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Beneficiary / Payee</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#0f3a4b', marginTop: 2 }}>
                      {payingVoucher.provider || payingVoucher.payee_name || 'Vendor'}
                    </div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
                      {payingVoucher.description || 'Approved Expenditure'}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', borderLeft: '1px solid #e2e8f0', paddingLeft: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Amount to Pay</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#15803d', marginTop: 2 }}>
                      GHS {voucherPayableAmount(payingVoucher).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 800, marginTop: 4 }}>
                      ✓ Pre-Audit Approved
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>
                      Payment Channel / Method *
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11.5, background: '#fff', fontWeight: 700 }}
                    >
                      <option value="Bank Transfer (Instant EFT)">Bank Transfer (Instant EFT)</option>
                      <option value="Mobile Money (MTN / Telecel MoMo)">Mobile Money (MTN / Telecel MoMo)</option>
                      <option value="Company Cheque">Company Cheque</option>
                      <option value="School Petty Cash">School Petty Cash</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>
                      Source Account / Vault *
                    </label>
                    <select
                      value={sourceAccount}
                      onChange={(e) => setSourceAccount(e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11.5, background: '#fff', fontWeight: 700 }}
                    >
                      <option value="Stanbic Bank - Operations Account (Acc: 90400031892)">Stanbic Bank - Operations (Acc: 90400031892)</option>
                      <option value="Ecobank Ghana - Tuition & Payables (Acc: 14410029310)">Ecobank Ghana - Payables (Acc: 14410029310)</option>
                      <option value="School Central Cash Vault">School Central Cash Vault</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>
                    Name of PL/Account *
                  </label>
                  <select
                    value={plAccountName}
                    onChange={(e) => setPlAccountName(e.target.value)}
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11.5, background: '#fff', fontWeight: 700 }}
                  >
                    {SCHOOL_PL_ACCOUNTS.map((account) => (
                      <option key={account.code + account.name} value={account.name}>{account.name}</option>
                    ))}
                  </select>
                  <div style={{ fontSize: 10, color: '#0284c7', fontWeight: 700, marginTop: 3 }}>
                    Account N/o: {getPlAccountCode(plAccountName) || '—'}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>
                      Payment Ref / Cheque # *
                    </label>
                    <input
                      type="text"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="e.g. TXN-2026-90412 or Cheque #891"
                      required
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11.5, background: '#fff', fontWeight: 800 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>
                      Disbursement Date *
                    </label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      required
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11.5, background: '#fff' }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>
                    Disbursement Notes &amp; Payment Advice
                  </label>
                  <textarea
                    rows={2}
                    value={disbursementNotes}
                    onChange={(e) => setDisbursementNotes(e.target.value)}
                    placeholder="Enter disbursement notes, bank advice, or payee instructions..."
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 11.5, background: '#fff', resize: 'vertical' }}
                  />
                </div>

                {/* Authorization notice */}
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 6,
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 11,
                  color: '#166534',
                  marginBottom: 16
                }}>
                  <ShieldCheck size={14} color="#16a34a" />
                  <span>Authorized by Head Admin. This action moves the voucher to Settled &amp; updates financial records.</span>
                </div>

                {/* Modal Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setPayingVoucher(null)}
                    disabled={isProcessing}
                    style={{
                      padding: '8px 16px',
                      background: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    style={{
                      padding: '8px 20px',
                      background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 900,
                      cursor: isProcessing ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 2px 4px rgba(22, 163, 74, 0.4)'
                    }}
                  >
                    {isProcessing ? 'Processing Payment...' : `Confirm & Disburse GHS ${voucherPayableAmount(payingVoucher).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </ViewportModal>
      )}

      </div>

      {/* DISBURSEMENT RECEIPT / ADVICE PRINT MODAL */}
      {receiptVoucher && (
        <ViewportModal onClose={() => setReceiptVoucher(null)} className="pv-print-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 12,
            width: '100%',
            maxWidth: 680,
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #cbd5e1'
          }}>
            {/* Action Bar */}
            <div className="no-print pv-print-chrome" style={{
              background: '#0f3a4b',
              color: '#ffffff',
              padding: '12px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: 13, fontWeight: 900 }}>Official Payment Disbursement Receipt</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => printPvPage()}
                  style={{
                    padding: '6px 14px',
                    background: '#0284c7',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Printer size={12} /> Print Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptVoucher(null)}
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Receipt Body */}
            <div className="pv-print-page" style={{ padding: 16, background: '#fff' }}>
              {/* School Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0f3a4b', paddingBottom: 16, marginBottom: 20 }}>
                <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: 8 }}>
                  <SchoolLogoSVG size={50} />
                </div>
                <h2 style={{ margin: '4px 0 2px', fontSize: 18, fontWeight: 900, color: '#0f3a4b' }}>
                  REMALJ CAREWELL INSPIRATIONAL SCHOOL
                </h2>
              <SchoolContactDetails />
                <div style={{ fontSize: 11, color: '#475569', fontWeight: 700 }}>
                  OFFICIAL PAYMENT VOUCHER DISBURSEMENT ADVICE
                </div>
                <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 2 }}>
                  Finance &amp; Accounts Directorate · Settled by Headmaster Authorization
                </div>
              </div>

              {/* Receipt Particulars Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20, fontSize: 11.5 }}>
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b', fontSize: 10, fontWeight: 800 }}>PAYMENT VOUCHER NO:</div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0f3a4b', marginTop: 2 }}>
                    #{receiptVoucher.pvNo || receiptVoucher.id}
                  </div>
                  <div style={{ marginTop: 8, color: '#64748b', fontSize: 10, fontWeight: 800 }}>REQUISITION NO:</div>
                  <div style={{ fontWeight: 800, color: '#1e293b' }}>
                    {receiptVoucher.requisitionNo || 'REQ-OFFICIAL'}
                  </div>
                  <div style={{ marginTop: 8, color: '#64748b', fontSize: 10, fontWeight: 800 }}>PAYMENT REFERENCE:</div>
                  <div style={{ fontWeight: 900, color: '#16a34a' }}>
                    {receiptVoucher.disbursementReference || 'TXN-SETTLED'}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 6, border: '1px solid #e2e8f0' }}>
                  <div style={{ color: '#64748b', fontSize: 10, fontWeight: 800 }}>BENEFICIARY / PAYEE:</div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: '#1e293b', marginTop: 2 }}>
                    {receiptVoucher.provider || receiptVoucher.payee_name || 'Vendor'}
                  </div>
                  <div style={{ marginTop: 8, color: '#64748b', fontSize: 10, fontWeight: 800 }}>PAYMENT CHANNEL:</div>
                  <div style={{ fontWeight: 800, color: '#1e293b' }}>
                    {receiptVoucher.paymentMethod || 'Bank Transfer'}
                  </div>
                  <div style={{ marginTop: 8, color: '#64748b', fontSize: 10, fontWeight: 800 }}>DATE OF SETTLEMENT:</div>
                  <div style={{ fontWeight: 800, color: '#1e293b' }}>
                    {receiptVoucher.paymentDate || receiptVoucher.disbursedAt || new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Amount Box */}
              <div style={{
                background: '#f0fdf4',
                border: '2px solid #86efac',
                borderRadius: 8,
                padding: '14px 20px',
                textAlign: 'center',
                marginBottom: 20
              }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#166534', textTransform: 'uppercase' }}>
                  Total Amount Paid &amp; Settled
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#15803d', marginTop: 4 }}>
                  GHS {(parseFloat(receiptVoucher.total || receiptVoucher.cost || receiptVoucher.amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 11, color: '#166534', marginTop: 4, fontWeight: 700 }}>
                  PL/Account: {receiptVoucher.plAccountName || 'Diesel'} · Source: {receiptVoucher.paymentSourceAccount || 'School Operations Account'}
                </div>
              </div>

              {/* Detailed Purpose & Particulars Section (Itemized Individual PV Items View) */}
              {(() => {
                const receiptItems = getReceiptPvItems(receiptVoucher);
                const itemsSubtotal = receiptItems.reduce((acc, i) => acc + (Number(i.totalAmount) || (Number(i.qty) * Number(i.costPerItem)) || 0), 0);
                const voucherTotal = parseFloat(receiptVoucher.total || receiptVoucher.cost || receiptVoucher.amount) || itemsSubtotal || 0;

                return (
                  <div style={{ marginBottom: 20, fontSize: 11 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ fontWeight: 800, color: '#0f3a4b', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>📋</span> Purpose &amp; Particulars — Itemized PV Breakdown ({receiptItems.length} {receiptItems.length === 1 ? 'Line Item' : 'Line Items'}):
                      </div>
                      <span style={{ fontSize: 10, color: '#0284c7', fontWeight: 800, background: '#e0f2fe', padding: '2px 8px', borderRadius: 4 }}>
                        Official Disbursement Schedule
                      </span>
                    </div>

                    {/* Overall Requisition Purpose / Narrative */}
                    {receiptVoucher.description && (
                      <div style={{
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderBottom: 'none',
                        borderRadius: '6px 6px 0 0',
                        padding: '8px 12px',
                        color: '#334155',
                        lineHeight: 1.4
                      }}>
                        <strong style={{ color: '#0f3a4b' }}>Primary Requisition Purpose: </strong>
                        <span>{receiptVoucher.description}</span>
                      </div>
                    )}

                    {/* Individual PV Items Detailed Table */}
                    <div style={{
                      border: '1px solid #cbd5e1',
                      borderRadius: receiptVoucher.description ? '0 0 6px 6px' : '6px',
                      overflow: 'hidden'
                    }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5, textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#0f3a4b', color: '#ffffff' }}>
                            <th style={{ padding: '6px 8px', width: 28, textAlign: 'center' }}>#</th>
                            <th style={{ padding: '6px 8px' }}>Item Particulars &amp; Description</th>
                            <th style={{ padding: '6px 8px', width: 50, textAlign: 'center' }}>Qty</th>
                            <th style={{ padding: '6px 8px', width: 95, textAlign: 'right' }}>Unit Cost (GHS)</th>
                            <th style={{ padding: '6px 8px', width: 105, textAlign: 'right' }}>Total (GHS)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {receiptItems.map((it, idx) => {
                            const lineTotal = Number(it.totalAmount !== undefined ? it.totalAmount : (Number(it.qty) * Number(it.costPerItem))) || 0;
                            const unitCost = Number(it.costPerItem !== undefined ? it.costPerItem : (it.qty > 0 ? lineTotal / it.qty : lineTotal)) || 0;
                            return (
                              <tr
                                key={it.itemNo || idx}
                                style={{
                                  borderBottom: idx === receiptItems.length - 1 ? 'none' : '1px solid #e2e8f0',
                                  background: idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                                }}
                              >
                                <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 800, color: '#64748b' }}>
                                  {it.itemNo || idx + 1}
                                </td>
                                <td style={{ padding: '6px 8px' }}>
                                  <div style={{ fontWeight: 800, color: '#0f3a4b' }}>
                                    {it.description}
                                  </div>
                                  {(it.category || it.provider || it.remarks) && (
                                    <div style={{ fontSize: 9.5, color: '#64748b', marginTop: 1 }}>
                                      {it.category && <span>Account: {it.category}</span>}
                                      {it.provider && it.provider !== (receiptVoucher.provider || receiptVoucher.payee_name) && <span> · Payee: {it.provider}</span>}
                                      {it.remarks && <span> · Remarks: {it.remarks}</span>}
                                    </div>
                                  )}
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 800, color: '#334155' }}>
                                  {it.qty}
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'right', color: '#475569' }}>
                                  {unitCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                                <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 900, color: '#15803d' }}>
                                  {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr style={{ background: '#f1f5f9', borderTop: '2px solid #cbd5e1', fontWeight: 900 }}>
                            <td colSpan={4} style={{ padding: '6px 8px', textAlign: 'right', color: '#0f3a4b', textTransform: 'uppercase', fontSize: 10 }}>
                              Total of Itemized Particulars:
                            </td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: 11.5, color: '#15803d' }}>
                              GHS {(itemsSubtotal || voucherTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Disbursement / Audit Notes if present */}
                    {receiptVoucher.disbursementNotes && (
                      <div style={{ marginTop: 6, fontSize: 10, color: '#475569', background: '#f8fafc', padding: '4px 8px', borderRadius: 4, border: '1px solid #e2e8f0' }}>
                        <strong style={{ color: '#0f3a4b' }}>Settlement Notes: </strong>
                        <span>{receiptVoucher.disbursementNotes}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Signatures */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 32, paddingTop: 16, borderTop: '1px dashed #cbd5e1' }}>
                <div>
                  <div style={{ height: 40, borderBottom: '1px solid #94a3b8' }}></div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: '#0f3a4b', marginTop: 4 }}>
                    Authorized Head Admin / Headmaster
                  </div>
                  <div style={{ fontSize: 9.5, color: '#64748b' }}>Executive Financial Authority</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ height: 40, borderBottom: '1px solid #94a3b8' }}></div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: '#0f3a4b', marginTop: 4 }}>
                    Beneficiary Payee Acknowledgment
                  </div>
                  <div style={{ fontSize: 9.5, color: '#64748b' }}>Date &amp; Signature</div>
                </div>
              </div>

            </div>
          </div>
        </ViewportModal>
      )}

    </div>
  );
}
