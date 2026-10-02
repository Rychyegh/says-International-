let pending;
export function loadAdminPortal() {
  if (!pending) pending = import('../portals/AdminPortal.jsx').catch(error => { pending = null; throw error; });
  return pending;
}
