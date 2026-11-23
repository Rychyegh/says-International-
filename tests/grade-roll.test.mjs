import test from 'node:test';
import assert from 'node:assert/strict';
import {gradeMarks,gradeRollStats,findGradeEntry} from '../src/lib/gradeRoll.js';
import {normalizeAssessment} from '../src/lib/assessmentRules.js';
test('saved converted marks and total appear without applying exam weighting twice',()=>{
 const entry=normalizeAssessment({student_id:'learner',class_score:40,exam_score:42,total_score:82,status:'Approved'});
 const marks=gradeMarks(entry,{classTestWeight:50,examWeight:50});
 assert.equal(marks.classScore,40);assert.equal(marks.examScore,42);assert.equal(marks.totalScore,82);
});
test('zero marks count while absent marks remain missing; partial class saves count separately',()=>{
 const zero=gradeMarks(normalizeAssessment({class_score:0,exam_score:0,total_score:0,has_class_score:true,has_exam_score:true}));
 const partial=gradeMarks({classScore:40,hasExamScore:false});const absent=gradeMarks(null);
 const stats=gradeRollStats([zero,partial,absent]);
 assert.equal(stats.scoredCount,2);assert.equal(stats.totalCount,3);assert.equal(stats.avgClass,'20.0');assert.equal(stats.avgExam,'0.0');assert.equal(stats.avgTotal,'0.0');assert.equal(stats.topScore,'0.0');
 assert.equal(absent.totalScore,null);
});
test('grade filters match term and year aliases and reject a different period',()=>{
 const scope={subject:'Mathematics',term:'Term 1',year:'2026/2027',classLevel:'Kindergarten 2'};
 const saved={subject:'Mathematics',term:'1st Term',year:'2026-2027',classLevel:'KG 2',classScore:40};
 assert.equal(findGradeEntry([saved],scope),saved);
 assert.equal(findGradeEntry([{...saved,year:'2025/2026'}],scope),undefined);
});

test('a saved published total remains visible without inventing missing component marks',()=>{
 const entry=normalizeAssessment({id:'legacy',student_id:'learner',score:82,status:'Approved'});
 const marks=gradeMarks(entry);
 assert.equal(marks.totalScore,82);assert.equal(marks.classScore,null);assert.equal(marks.examScore,null);assert.equal(marks.hasScore,true);
 const draft=normalizeAssessment({id:'draft',total_score:40,has_exam_score:false,status:'Class Score Recorded'});
 assert.equal(gradeMarks(draft).totalScore,null);
});
