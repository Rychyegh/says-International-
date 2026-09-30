/**
 * REMALJ Carewell Inspirational School - Real-Time Universal Cloud Sync Hub
 * Connects all admin users, teachers, accountants, and parents globally across all devices.
 */

const CLOUD_SYNC_OBJECT_ID = 'ff808181a09d98f701a0ee1d85734423';
const CLOUD_SYNC_ENDPOINT = `https://api.restful-api.dev/objects/${CLOUD_SYNC_OBJECT_ID}`;

let isPushing = false;
let lastPushedSignature = '';

function createDataSignature(data) {
  if (!data) return '';
  const appsSig = (data.applications || []).map(a => `${a.id}_${a.learner}_${a.level}_${a.status}_${a.updatedAt || a.submittedAt}`).join('|');
  const stuSig = (data.onboardedStudents || []).map(s => `${s.id}_${s.fullName}_${s.level}_${s.updatedAt}`).join('|');
  const feeSig = (data.studentFees || []).map(f => `${f.id}_${f.amountPaid}_${f.status}_${f.updatedAt}`).join('|');
  const pvSig = (data.paymentVouchers || []).map(p => `${p.id}_${p.status}_${p.updatedAt}`).join('|');
  const notifSig = (data.pvNotifications || []).map(n => `${n.id}_${n.read}`).join('|');
  return `${appsSig}#${stuSig}#${feeSig}#${pvSig}#${notifSig}`;
}

export const cloudSync = {
  // 1. Pull the unified data state from the cloud hub
  pullLatestData: async () => {
    try {
      const response = await fetch(CLOUD_SYNC_ENDPOINT, {
        headers: { 'Accept': 'application/json' },
      });
      if (!response.ok) return null;
      const res = await response.json();
      if (res && res.data && typeof res.data === 'object') {
        return res.data;
      }
      return null;
    } catch (err) {
      console.warn('[Cloud Sync Warning] Failed to pull latest state:', err.message);
      return null;
    }
  },

  // 2. Push merged state to the cloud hub so all other users receive it instantly
  pushLatestData: async (data) => {
    if (isPushing || !data) return;
    const currentSig = createDataSignature(data);
    if (currentSig === lastPushedSignature && lastPushedSignature !== '') return;

    isPushing = true;
    try {
      const payload = {
        data: {
          onboardedStudents: data.onboardedStudents || [],
          applications: data.applications || [],
          studentFees: data.studentFees || [],
          feeAccounts: data.feeAccounts || [],
          teacherDirectory: data.teacherDirectory || [],
          definedBills: data.definedBills || [],
          paymentVouchers: data.paymentVouchers || [],
          pvNotifications: data.pvNotifications || [],
          timetable: data.timetable || [],
          results: data.results || [],
          examRegistrations: data.examRegistrations || [],
          semesterRegistrations: data.semesterRegistrations || [],
          academicSettings: data.academicSettings,
          lastSyncedAt: new Date().toISOString(),
          syncedTimestamp: Date.now()
        }
      };

      await fetch(CLOUD_SYNC_ENDPOINT, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      lastPushedSignature = currentSig;
    } catch (err) {
      console.warn('[Cloud Sync Warning] Failed to push state to cloud hub:', err.message);
    } finally {
      isPushing = false;
    }
  }
};
