import React, { useState, useEffect } from 'react';
import { CheckCircle2, Edit3, Save, Search, AlertCircle, FileCheck } from 'lucide-react';
import { usePortalData } from '../../data/PortalStore';

export default function ApprovePVForm({ setM }) {
  const portalData = usePortalData();
  const storeVouchers = portalData?.paymentVouchers || [];
  const updatePaymentVoucher = portalData?.updatePaymentVoucher;
  const approvePaymentVoucher = portalData?.approvePaymentVoucher;

  const [pvQueue, setPvQueue] = useState([
    {
      id: 'pv-088',
      pvNo: 'PV-2026-088',
      requisitionNo: 'REQ-99412',
      provider: 'ELECTRICITY COMPANY OF GHANA (ECG)',
      providerId: 'ECG-99310',
      description: 'Cost of Electricity Bill & Utility Substation Maintenance',
      qty: 1,
      cost: 3200.00,
      total: 3200.00,
      datePrepared: '2026-09-05',
      valuedDate: '2026-09-05',
      auditRemarks: 'Pre-audited & verified against monthly meter consumption records.',
      status: 'Pending Audit',
      editedByHeadmaster: false
    },
    {
      id: 'pv-082',
      pvNo: 'PV-2026-082',
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
      status: 'Pending Audit',
      editedByHeadmaster: false
    },
    {
      id: 'pv-075',
      pvNo: 'PV-2026-075',
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
      status: 'Pre-Audited & Approved',
      editedByHeadmaster: false
    }
  ]);

  useEffect(() => {
    if (storeVouchers && storeVouchers.length > 0) {
      setPvQueue(storeVouchers);
    }
  }, [storeVouchers]);

  // Form Fields State
  const [pvNo, setPvNo] = useState('PV-2026-088');
  const [itemRequisitionNo, setItemRequisitionNo] = useState('REQ-99412');
  const [description, setDescription] = useState('Cost of Electricity Bill & Utility Substation Maintenance');
  const [datePrepared, setDatePrepared] = useState('2026-09-05');
  const [clientProvider, setClientProvider] = useState('ELECTRICITY COMPANY OF GHANA (ECG)');
  const [providerId, setProviderId] = useState('ECG-99310');
  const [qty, setQty] = useState('1');
  const [costPerItem, setCostPerItem] = useState('3200.00');
  const [auditRemarks, setAuditRemarks] = useState('Pre-audited & verified against monthly meter consumption records. Approved for disbursement.');
  const [valuedDate, setValuedDate] = useState('2026-09-05');
  const [actionChoice, setActionChoice] = useState('Pre-audit Approve PV');
  const [bannerNotice, setBannerNotice] = useState('');
  const [isEditingMode, setIsEditingMode] = useState(false);

  const calculatedTotalAmount = (parseFloat(qty) || 0) * (parseFloat(costPerItem) || 0);

  const formatDatePreview = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[d.getDay()]} , ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const populateFormWithVoucher = (match) => {
    if (!match) return;
    setPvNo(match.pvNo);
    setItemRequisitionNo(match.requisitionNo || match.itemRequisitionNo || '');
    setClientProvider(match.provider || match.clientProvider || '');
    setProviderId(match.providerId || '');
    setDescription(match.description || '');
    setQty(String(match.qty || 1));
    setCostPerItem(Number(match.cost || match.costPerItem || 0).toFixed(2));
    setDatePrepared(match.datePrepared || new Date().toISOString().split('T')[0]);
    setValuedDate(match.valuedDate || match.datePrepared || new Date().toISOString().split('T')[0]);
    setAuditRemarks(match.auditRemarks || 'Pre-audited & verified by Headmaster.');
  };

  const handleSearchPV = () => {
    const match = pvQueue.find(p => p.pvNo?.toLowerCase().includes(pvNo.toLowerCase()));
    if (match) {
      populateFormWithVoucher(match);
      setBannerNotice(`🔍 Loaded PV record #${match.pvNo}. Ready for editing or pre-audit approval.`);
    } else {
      setBannerNotice(`🔍 Searching PV Records for #${pvNo}...`);
    }
    setTimeout(() => setBannerNotice(''), 4000);
  };

  // Save Wrong Voucher Edits Prior to Approval
  const handleSaveVoucherEdits = () => {
    if (!pvNo.trim()) {
      alert('Please enter or select a valid PV Number.');
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

    setPvQueue(prev => prev.map(p => p.pvNo.toLowerCase() === pvNo.toLowerCase() ? { ...p, ...updatedFields } : p));

    if (updatePaymentVoucher) {
      updatePaymentVoucher(pvNo, updatedFields, 'Headmaster / Pre-Auditor');
    }

    setBannerNotice(`✏️ ✅ Successfully saved corrected voucher details for PV #${pvNo}! Corrected by Headmaster prior to approval.`);
    setIsEditingMode(true);
    setTimeout(() => setBannerNotice(''), 5000);
  };

  const handleActionSingleItem = () => {
    const updatedStatus = actionChoice === 'Pre-audit Approve PV' ? 'Pre-Audited & Approved' : actionChoice;
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
      status: updatedStatus,
      editedByHeadmaster: true
    };

    setPvQueue(prev => prev.map(p => p.pvNo.toLowerCase() === pvNo.toLowerCase() ? { ...p, ...updatedFields } : p));

    if (approvePaymentVoucher) {
      approvePaymentVoucher(pvNo, actionChoice, auditRemarks, updatedFields, 'Headmaster / Pre-Auditor');
    }

    setBannerNotice(`✅ Applied action "${actionChoice}" for PV Item #${pvNo}. Ledger updated.`);
    setTimeout(() => setBannerNotice(''), 4000);
  };

  const handleActionAllItems = () => {
    const updatedStatus = actionChoice === 'Pre-audit Approve PV' ? 'Pre-Audited & Approved' : actionChoice;
    setPvQueue(prev => prev.map(p => ({ ...p, status: updatedStatus })));
    setBannerNotice(`✅ Applied action "${actionChoice}" for ALL pending PV items in queue.`);
    setTimeout(() => setBannerNotice(''), 4000);
  };

  return (
    <div style={{ fontFamily: 'var(--font-sans, system-ui, sans-serif)', color: '#0f172a' }}>
      {/* Top Header Card */}
      <div style={{
        background: '#0f3a4b',
        color: '#ffffff',
        padding: '12px 18px',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ background: '#0284c7', width: 6, height: 24, borderRadius: 3 }} />
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#ffffff', letterSpacing: '0.02em' }}>
              Payment Voucher (PV) Pre-Audit & Editing Station
            </h3>
            <div style={{ fontSize: 11, color: '#bae6fd', marginTop: 2 }}>
              Headmaster / Executive Pre-Audit Station · Edit Wrong Voucher Details Prior to Approval
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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

      {/* Top Search & Filter Bar */}
      <div style={{
        background: '#f1f5f9',
        padding: 14,
        border: '1px solid #cbd5e1',
        borderTop: 'none',
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gap: 16,
        alignItems: 'center'
      }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>
            PV N/o Search & Selection
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              value={pvNo}
              onChange={(e) => setPvNo(e.target.value)}
              placeholder="Enter PV N/o (e.g. PV-2026-088)..."
              style={{ width: 160, padding: '6px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 800, background: '#fff' }}
            />
            <button
              type="button"
              onClick={handleSearchPV}
              style={{ padding: '6px 14px', background: '#0f3a4b', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Search size={13} /> Recall PV Details
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#0f3a4b', marginBottom: 4 }}>
            Item Requisition #
          </label>
          <input
            type="text"
            value={itemRequisitionNo}
            onChange={(e) => setItemRequisitionNo(e.target.value)}
            placeholder="Requisition N/o..."
            style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff', fontWeight: 700 }}
          />
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

      {/* Main Editable Voucher Form */}
      <div style={{ background: '#ffffff', padding: 16, border: '1px solid #cbd5e1', borderTop: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid #e2e8f0', paddingBottom: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: '#0f3a4b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Edit3 size={15} style={{ color: '#0284c7' }} />
            Voucher Particulars & Calculations (Editable by Headmaster Prior to Approval)
          </div>
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

        {/* Pre-Audit Approval Controls */}
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
                <option value="Pre-audit Approve PV">Pre-audit Approve PV</option>
                <option value="Reject / Query PV">Reject / Query PV</option>
                <option value="Hold PV for Clarification">Hold PV for Clarification</option>
                <option value="Cancel PV">Cancel PV</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
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
              onClick={handleActionAllItems}
              style={{ padding: '10px 16px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 900, cursor: 'pointer' }}
            >
              Action All PV Items in Queue
            </button>
          </div>
        </div>

        {/* Voucher Queue Table */}
        <div style={{ background: '#ffffff', borderRadius: 6, border: '1px solid #cbd5e1', overflow: 'hidden' }}>
          <div style={{ background: '#f1f5f9', padding: '10px 14px', fontSize: 12, fontWeight: 900, color: '#0f3a4b', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Payment Vouchers Pending & Audited Queue ({pvQueue.length} Vouchers)</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Click "Select & Edit" to correct any wrong entered details</span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', textAlign: 'left', color: '#475569' }}>
                <th style={{ padding: '8px 10px' }}>#</th>
                <th style={{ padding: '8px 10px' }}>PV N/o</th>
                <th style={{ padding: '8px 10px' }}>Requisition #</th>
                <th style={{ padding: '8px 10px' }}>Service Provider</th>
                <th style={{ padding: '8px 10px' }}>Particulars / Description</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Total (GHS)</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Audit Status</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Corrections</th>
                <th style={{ padding: '8px 10px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pvQueue.map((item, idx) => (
                <tr key={item.id || item.pvNo || idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                  <td style={{ padding: '8px 10px', color: '#64748b', fontWeight: 700 }}>{idx + 1}</td>
                  <td style={{ padding: '8px 10px', fontWeight: 900, color: '#0369a1' }}>#{item.pvNo}</td>
                  <td style={{ padding: '8px 10px', fontWeight: 700, color: '#475569' }}>{item.requisitionNo || item.itemRequisitionNo}</td>
                  <td style={{ padding: '8px 10px', fontWeight: 800, color: '#0f3a4b' }}>{item.provider || item.clientProvider}</td>
                  <td style={{ padding: '8px 10px' }}>{item.description}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 900, color: '#0f172a' }}>
                    {Number(item.total || (item.qty * (item.cost || 0))).toFixed(2)}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 10,
                      background: item.status?.includes('Approved') ? '#dcfce7' : '#fef3c7',
                      color: item.status?.includes('Approved') ? '#15803d' : '#b45309'
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    {item.editedByHeadmaster ? (
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 4, background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}>
                        ✏️ Corrected
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, color: '#94a3b8' }}>Original</span>
                    )}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => populateFormWithVoucher(item)}
                      style={{ padding: '4px 10px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                    >
                      Select & Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
