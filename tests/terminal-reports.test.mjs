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

const { terminalReportScope, terminalReportsFromRecords, loadClassTerminalReports } = await import('../src/lib/terminalReportRecords.js');
const scope={class_level:'Nursery 1A',sub_class:'',academic_year:'2026/2027',term:'Term 1',preview_creche:false};
const students=[{id:'learner-a',fullName:'Learner A',level:'Nursery 1',subClass:'Nursery 1A'},{id:'learner-b',fullName:'Learner B',level:'Nursery 1',subClass:'Nursery 1B'}];
const record={id:'score-1',student_id:'learner-a',class_level:'Nursery 1',sub_class:'Nursery 1A',academic_year:'2026/2027',term:'Term 1',subject:'Numeracy',class_score:40,exam_score:42,exam_score_converted:42,total_score:82,status:'Published'};
test('class-section query matches score entry storage',()=>{
 assert.deepEqual(terminalReportScope(scope),{...scope,class_level:'Nursery 1',sub_class:'Nursery 1A',report_type:'class',preview_creche:'false'});
});
test('approved records preserve scores and exclude pending, other class, year, term and unknown learners',()=>{
 const records=[record,...[{status:'Pending Approval'},{student_id:'learner-b',sub_class:'Nursery 1B'},{academic_year:'2025/2026'},{term:'Term 2'},{student_id:'unknown'}].map(overrides=>({...record,subject:'Excluded',...overrides}))];
 const [report]=terminalReportsFromRecords({records,students,scope});
 assert.equal(report.rows.length,1);assert.equal(report.rows[0].total,82);assert.equal(report.rows[0].exam_score,42);assert.equal(report.summary.average_score,82);
 assert.equal(report.class_position,undefined);
 const zero=terminalReportsFromRecords({records:[{...record,total_score:0,class_score:0,exam_score:0,exam_score_converted:0}],students,scope});
 assert.equal(zero[0].rows[0].total,0);
});
test('empty aggregate report reads persisted score sheets; permission failures never use fallback',async()=>{
 let reads=0;
 const api={getAssessmentReport:async()=>({reports:[]}),getResults:async()=>{reads++;return [];},getScoreSheetEntries:async()=>{reads++;return [record];}};
 assert.equal((await loadClassTerminalReports({api,scope,students})).reports.length,1);assert.equal(reads,2);
 api.getAssessmentReport=async()=>{throw Object.assign(new Error('Forbidden'),{status:403});};
 await assert.rejects(loadClassTerminalReports({api,scope,students}),/Forbidden/);assert.equal(reads,2);
});

const { classLabelMatches } = await import('../src/lib/classLabelMatch.js');
test('class labels tolerate spacing without crossing class levels or sections',()=>{
 assert.equal(classLabelMatches('Nursery1A','Nursery 1A'),true);
 assert.equal(classLabelMatches('Nursery1A','Nursery 1'),true);
 assert.equal(classLabelMatches('Basic 1','Basic 10'),false);
 assert.equal(classLabelMatches('Nursery 1A','Nursery 1B'),false);
 assert.equal(terminalReportScope({...scope,class_level:'Nursery1A'}).class_level,'Nursery 1');
});
