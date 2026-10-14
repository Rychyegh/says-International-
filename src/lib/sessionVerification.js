export function isSessionVerificationError(error) {
  if (error?.status !== 403) return false;
  const payload = error.payload || {};
  const code = payload.code || payload.detail?.code || '';
  return ['SESSION_VERIFICATION_REQUIRED', 'SECOND_FACTOR_REQUIRED'].includes(code)
    || /complete (?:server-side |session )?(?:pin |session )?verification|(?:pin|second.factor|session) verification (?:is )?required/i.test(String(error.message || payload.detail || ''));
}
export function sessionRoleAllowed(portal, role) {
  return portal === 'admin' ? ['head_admin', 'sub_admin'].includes(role) : portal === 'accountant' && ['accountant', 'head_admin'].includes(role);
}
