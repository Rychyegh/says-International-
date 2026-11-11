import test from 'node:test';
import assert from 'node:assert/strict';
import { validateTerminalReports } from '../src/lib/terminalReports.js';
import { api } from '../src/services/api.js';

test('terminal report contract rejects generic success, missing identity and malformed rows',()=>{
  for(const data of [{success:true},{reports:[{rows:[]}]},{reports:[{student_id:'student-1'}]},{reports:[{student_id:'student-1',rows:[null]}]}]) {
    assert.throws(()=>validateTerminalReports(data),/saved terminal reports/);
  }
  assert.deepEqual(validateTerminalReports({reports:[]}),[]);
  const report={student_id:'student-1',rows:[{subject:'Math',total:0},{subject:'English',total:null}]};
  assert.deepEqual(validateTerminalReports({reports:[report]}),[report]);
});

test('terminal report request retains period, subclass and creche scope',async()=>{
  globalThis.localStorage={getItem:()=>null};
  let requested;
  globalThis.fetch=async url=>{requested=new URL(url);return new Response(JSON.stringify({reports:[]}),{headers:{'Content-Type':'application/json'}});};
  const scope={report_type:'individual_year_group',academic_year:'2025/2026',term:'Term 3',class_level:'Basic 2',sub_class:'Basic 2B',department:'Lower Primary',preview_creche:'false'};
  await api.getAssessmentReport(scope);
  assert.ok(requested.pathname.endsWith('/academic/assessment-reports'));
  assert.deepEqual(Object.fromEntries(requested.searchParams),scope);
});
