import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveGuardianPhone } from '../src/lib/guardianPhone.js';

test('missing guardian contacts stay empty, including stored placeholder formats', () => {
  for (const phone of ['', undefined, '0541769621', '+233541769621', '233 54 176 9621']) {
    assert.equal(resolveGuardianPhone({ guardianPhone: phone }), '');
  }
  assert.equal(resolveGuardianPhone({}), '');
});

test('real contacts are preserved and can replace placeholder contacts', () => {
  assert.equal(resolveGuardianPhone({ guardianPhone: '+233541769621', motherPhone: '0201234567' }), '0201234567');
  assert.equal(resolveGuardianPhone({ guardian_phone: '+233201234567' }), '+233201234567');
});
