import test from 'node:test';
import assert from 'node:assert/strict';
import { teacherAssignedClasses, studentInAssignedClass } from '../src/lib/teacherClassAssignments.js';

test('all matching saved class rows are combined by teacher ID instead of the first name match',()=>{
 const classes=teacherAssignedClasses({user:{id:'teacher-1',classAssigned:'Nursery1A'},assignments:[{userId:'teacher-1',classes:['Basic 1A']},{userId:'teacher-1',classes:['Nursery 1A']},{userId:'someone-else',teacherName:'Same Name',classes:['Basic 9']}]});
 assert.deepEqual(classes,['Nursery 1A','Basic 1A']);
 assert.equal(studentInAssignedClass({level:'Basic 1',subClass:'Basic 1A'},classes[1]),true);
 assert.equal(studentInAssignedClass({level:'Basic 1',subClass:'Basic 1B'},classes[1]),false);
});
test('the school catalogue and roster never create assignments',()=>{
 assert.deepEqual(teacherAssignedClasses({user:{id:'teacher-1'}}),[]);
 assert.deepEqual(teacherAssignedClasses({user:{email:'teacher@example.test',assigned_classes:['Basic1A','Nursery1A']}}),['Basic 1A','Nursery 1A']);
});
