import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { feeTemplateSnapshot } from '../src/lib/feeTemplateContract.js';
import { confirmedStudentUpdate } from '../src/lib/studentSaveContract.js';

test('fee templates require a complete, versioned period snapshot', () => {
  const snapshot = {version:0,academicYear:'2026/2027',academicTerm:'Term 1',feeSchedule:{'Basic 1':{baseBill:[],optionalBills:[]}},stationerySchedule:[]};
  assert.deepEqual(feeTemplateSnapshot({data:snapshot}), snapshot);
  for (const raw of [{}, {...snapshot,version:null}, {...snapshot,feeSchedule:[]}, {...snapshot,feeSchedule:{'Basic 1':{}}}]) {
    assert.throws(()=>feeTemplateSnapshot(raw));
  }
});

test('student updates require the same persisted identity', () => {
  assert.deepEqual(confirmedStudentUpdate({data:{student:{id:'one',full_name:'Saved'}}}, 'one'), {id:'one',full_name:'Saved'});
  for (const raw of [{success:true},{id:'two'},null]) assert.throws(()=>confirmedStudentUpdate(raw,'one'));
});

test('Sub Admin restrictions and reports cannot use the audited unsafe fallbacks', () => {
  const source = readFileSync(new URL('../src/portals/AdminPortal.jsx',import.meta.url),'utf8');
  assert.match(source,/adminRole === 'head_admin' && \(activeNav === 'User Access Control/);
  assert.doesNotMatch(source,/tData\?\.averageScore \|\| '82\.5'|tData\?\.cgpa \|\| '3\.75'/);
  assert.doesNotMatch(source,/Card Security PIN|Write & Activate RFID Card/);
  assert.match(source,/Open result approval board/);
});

test('subclass registration happens after a successful API request', () => {
  const source = readFileSync(new URL('../src/data/PortalStore.jsx',import.meta.url),'utf8');
  const method = source.slice(source.indexOf('addSubClassLevel: async'),source.indexOf('saveTeachingAssignment: async'));
  assert.ok(method.indexOf('await api.createCatalogEntry') < method.indexOf('registerCustomSubClass(c, sc)'));
  assert.doesNotMatch(method,/catch\s*\(/);
  assert.doesNotMatch(source,/Backend update student fallback/);
});
