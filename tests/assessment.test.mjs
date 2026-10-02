import test from 'node:test';
import assert from 'node:assert/strict';
import { rawAssessment, normalizeAssessment, validateAcademicSettings } from '../src/lib/assessmentRules.js';

test('four tests at 80 remain raw 80 rather than weighted 40',()=>{
 const raw=rawAssessment({arrivalTest:80,test1:80,test2:80,test3:80,classScore:40,examScore:60});
 assert.equal(raw.classScore,80);assert.equal(raw.examScore,60);
 assert.equal(raw.classScore*.5+raw.examScore*.5,70);
});
test('zero and maximum scores are valid; missing exam remains null',()=>{
 assert.deepEqual(rawAssessment({classScore:0,examScore:0}).examScore,0);
 assert.equal(rawAssessment({classScore:100,examScore:100}).classScore,100);
 assert.equal(rawAssessment({classScore:80,examScore:null}).examScore,null);
 for(const entry of [{classScore:101},{classScore:-1},{classScore:80,examScore:101},{arrivalTest:80,test1:80,test2:80}])assert.throws(()=>rawAssessment(entry));
});
test('normalize uses the nested saved UUID and rehydrates raw marks and breakdown',()=>{
 const saved=normalizeAssessment({id:'batch',subject:'Math',academic_year:'2026/2027',scores:[{id:'sheet',student_id:'uuid',class_score:40,exam_score:30,total_score:70,raw_class_score:80,raw_exam_score:60,has_exam_score:true,grade:'School grade',class_breakdown:{arrival_test:80,class_test_1:80,class_test_2:80,class_test_3:80}}]});
 assert.equal(saved.id,'sheet');assert.equal(saved.rawClassScore,80);assert.equal(saved.examScore,60);assert.equal(saved.examScoreConverted,30);assert.equal(saved.score,70);assert.equal(saved.test3,80);
});
test('drafts never acquire a final grade, zero exams remain complete',()=>{
 const draft=normalizeAssessment({id:'a',has_exam_score:false,raw_exam_score:null,total_score:40,grade:'Should not display'});
 assert.equal(draft.score,null);assert.equal(draft.grade,'');assert.equal(draft.hasExamScore,false);
 const zero=normalizeAssessment({id:'b',has_exam_score:true,raw_exam_score:0,total_score:0,grade:'School zero grade'});
 assert.equal(zero.examScore,0);assert.equal(zero.score,0);assert.equal(zero.grade,'School zero grade');
});
test('low weighted numbers never imply raw marks',()=>{
 const saved=normalizeAssessment({id:'a',class_score:20,exam_score:15,has_exam_score:true});
 assert.equal(saved.rawClassScore,null);assert.equal(saved.rawExamScore,null);
});
test('academic settings preserve approved bands and reject bad weights and dates',()=>{
 const settings={academicYear:'2026/2027',academicTerm:'Term 1',classTestWeight:50,examWeight:50,gradingBands:[{grade:'Approved'}],resumptionDate:'2026-09-01',vacationDate:'2026-12-01'};
 assert.equal(validateAcademicSettings(settings).gradingBands,settings.gradingBands);
 for(const patch of [{classTestWeight:60},{examWeight:-1},{gradingBands:[]},{vacationDate:'2026-08-01'}])assert.throws(()=>validateAcademicSettings({...settings,...patch}));
});

test("a sheet envelope ID cannot replace a missing saved score UUID", () => {
  const record = normalizeAssessment({ id: "envelope-id", scores: [{ student_id: "student-id" }] });
  assert.equal(record.id, undefined);
  assert.equal(record.backendId, undefined);
});
