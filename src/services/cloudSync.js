/**
 * REMALJ Carewell Inspirational School - Real-Time Universal Cloud Sync Hub
 * Connects all admin users, teachers, accountants, and parents globally across all devices.
 */

const NTFY_SYNC_TOPIC = 'https://ntfy.sh/rcis_carewell_sync_providers_v2';
const NTFY_DATA_HUB_TOPIC = 'https://ntfy.sh/rcis_carewell_sync_hub_v2';

let isPushing = false;
let lastPushedSignature = '';
let activeEventSource = null;

function createDataSignature(data) {
  if (!data) return '';
  const appsSig = (data.applications || []).map(a => `${a.id}_${a.learner}_${a.level}_${a.status}_${a.updatedAt || a.submittedAt}`).join('|');
  const stuSig = (data.onboardedStudents || []).map(s => `${s.id}_${s.fullName}_${s.level}_${s.updatedAt}`).join('|');
  const feeSig = (data.studentFees || []).map(f => `${f.id}_${f.amountPaid || f.paidAmount}_${f.status}_${f.updatedAt}`).join('|');
  const pvSig = (data.paymentVouchers || []).map(p => `${p.id}_${p.status}_${p.updatedAt}`).join('|');
  const notifSig = (data.pvNotifications || []).map(n => `${n.id}_${n.read}`).join('|');
  const staffSig = (data.teacherDirectory || []).map(t => `${t.id || t.staffId}_${t.name}_${t.subject}_${t.classAssigned}_${t.status}`).join('|');
  const classSig = (data.classLevels || []).join(',');
  const subSig = (data.subjects || []).join(',');
  const provSig = (data.serviceProviders || []).map(p => `${p.id}_${p.name}_${p.phone || ''}`).join('|');
  return `${appsSig}#${stuSig}#${feeSig}#${pvSig}#${notifSig}#${staffSig}#${classSig}#${subSig}#${provSig}`;
}

export const cloudSync = {
  // 1. Pull the unified data state from the cloud hub
  pullLatestData: async () => {
    try {
      let combinedData = null;

      // Check Hub Topic for overall state snapshot
      const hubRes = await fetch(`${NTFY_DATA_HUB_TOPIC}/json?poll=1`, {
        headers: { 'Accept': 'application/json' },
      });
      if (hubRes.ok) {
        const text = await hubRes.text();
        const lines = text.trim().split('\n').filter(Boolean);
        for (let i = lines.length - 1; i >= 0; i--) {
          try {
            const entry = JSON.parse(lines[i]);
            if (entry.message) {
              const parsed = JSON.parse(entry.message);
              if (parsed && typeof parsed === 'object') {
                combinedData = parsed.data || parsed;
                break;
              }
            }
          } catch (_) {}
        }
      }

      // Check Service Providers dedicated channel for real-time provider announcements
      const provRes = await fetch(`${NTFY_SYNC_TOPIC}/json?poll=1`, {
        headers: { 'Accept': 'application/json' },
      });
      if (provRes.ok) {
        const text = await provRes.text();
        const lines = text.trim().split('\n').filter(Boolean);
        const pulledProviders = [];

        lines.forEach(line => {
          try {
            const entry = JSON.parse(line);
            if (entry.message) {
              const parsed = JSON.parse(entry.message);
              if (parsed.type === 'NEW_PROVIDER' && parsed.provider) {
                pulledProviders.push(parsed.provider);
              } else if (Array.isArray(parsed.serviceProviders)) {
                pulledProviders.push(...parsed.serviceProviders);
              }
            }
          } catch (_) {}
        });

        if (pulledProviders.length > 0) {
          if (!combinedData) combinedData = {};
          const currentProv = combinedData.serviceProviders || [];
          const map = new Map();
          currentProv.forEach(p => map.set(String(p.id || p.name).toLowerCase(), p));
          pulledProviders.forEach(p => map.set(String(p.id || p.name).toLowerCase(), p));
          combinedData.serviceProviders = Array.from(map.values());
        }
      }

      return combinedData;
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
          serviceProviders: data.serviceProviders || [],
          timetable: data.timetable || [],
          results: data.results || [],
          examRegistrations: data.examRegistrations || [],
          semesterRegistrations: data.semesterRegistrations || [],
          academicSettings: data.academicSettings,
          classLevels: data.classLevels || [],
          subjects: data.subjects || [],
          lastSyncedAt: new Date().toISOString(),
          syncedTimestamp: Date.now()
        }
      };

      await fetch(NTFY_DATA_HUB_TOPIC, {
        method: 'POST',
        headers: {
          'Title': 'RCIS Universal Cloud Sync',
          'Priority': 'default'
        },
        body: JSON.stringify(payload)
      });
      lastPushedSignature = currentSig;
    } catch (err) {
      console.warn('[Cloud Sync Warning] Failed to push state to cloud hub:', err.message);
    } finally {
      isPushing = false;
    }
  },

  // 3. Instant push of a newly added or updated service provider across all active devices
  pushServiceProvider: async (provider) => {
    if (!provider || !provider.name) return;
    try {
      const payload = {
        type: 'NEW_PROVIDER',
        provider: {
          id: String(provider.id || Date.now()),
          name: provider.name.trim(),
          address: provider.address || 'Bogoso',
          email: provider.email || '',
          phone: provider.phone || provider.telephone || ''
        },
        timestamp: Date.now()
      };

      await fetch(NTFY_SYNC_TOPIC, {
        method: 'POST',
        headers: {
          'Title': `New Service Provider: ${provider.name}`,
          'Priority': 'high',
          'Tags': 'building_construction,white_check_mark'
        },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn('[Cloud Sync Warning] Instant provider push fallback:', e.message);
    }
  },

  // 4. Live Server-Sent Events (SSE) listener for instantaneous multi-device updates
  initRealtimeSubscription: (onProviderReceived) => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return () => {};
    if (activeEventSource) {
      try { activeEventSource.close(); } catch (_) {}
    }

    try {
      const es = new EventSource(`${NTFY_SYNC_TOPIC}/sse`);
      activeEventSource = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.message) {
            const parsed = JSON.parse(data.message);
            if (parsed.type === 'NEW_PROVIDER' && parsed.provider && typeof onProviderReceived === 'function') {
              onProviderReceived(parsed.provider);
            }
          }
        } catch (_) {}
      };

      es.onerror = () => {
        // EventSource will auto-retry reconnecting in background
      };

      return () => {
        try { es.close(); } catch (_) {}
        activeEventSource = null;
      };
    } catch (_) {
      return () => {};
    }
  }
};

