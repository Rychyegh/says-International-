const duration = 15 * 60 * 1000;
const key = identifier => `login-lockout:${String(identifier || '').trim().toLowerCase()}`;
export function loginLockout(identifier) {
  try {
    const record = JSON.parse(localStorage.getItem(key(identifier)) || 'null');
    if (!record || Date.now() - record.updatedAt >= duration) return { attempts: 0, blockedUntil: 0 };
    return record;
  } catch { return { attempts: 0, blockedUntil: 0 }; }
}
export function failedLogin(identifier) {
  const record = loginLockout(identifier);
  const attempts = record.attempts + 1;
  const next = { attempts, updatedAt: Date.now(), blockedUntil: attempts >= 3 ? Date.now() + duration : 0 };
  try { localStorage.setItem(key(identifier), JSON.stringify(next)); } catch {}
  return next;
}
export function clearLoginLockout(identifier) {
  try { localStorage.removeItem(key(identifier)); } catch {}
}
