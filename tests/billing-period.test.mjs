import test from 'node:test';
import assert from 'node:assert/strict';
import {billingPeriod,billingPeriodLabel} from '../src/lib/billingPeriod.js';
test('registered year and term override old school settings for bills',()=>{
 const student={id:'uuid',studentId:'CODE',academicYear:'2025/2026'};
 const registrations=[{student_id:'uuid',academic_year:'2026/2027',term:'Term 1'},{studentId:'CODE',academicYear:'2025/2026',term:'Term 3'}];
 const period=billingPeriod(student,registrations,[],{academicYear:'2025/2026',academicTerm:'Term 3'});
 assert.deepEqual(period,{academicYear:'2026/2027',term:'Term 1'});
 assert.equal(billingPeriodLabel(period),'Term 1 · 2026/2027');
});
test('periods stay specific to each student and ignore cancelled registrations',()=>{
 const registrations=[{studentId:'one',academicYear:'2026/2027',term:'1st term'},{studentId:'two',academicYear:'2025/2026',term:'Term 2'},{studentId:'one',academicYear:'2027/2028',term:'Term 1',status:'Cancelled'}];
 assert.equal(billingPeriod({id:'one'},registrations).academicYear,'2026/2027');
 assert.deepEqual(billingPeriod({id:'two'},registrations),{academicYear:'2025/2026',term:'Term 2'});
 assert.deepEqual(billingPeriod({academic_year:'2026/2027',academic_term:'Term 1'}),{academicYear:'2026/2027',term:'Term 1'});
});
