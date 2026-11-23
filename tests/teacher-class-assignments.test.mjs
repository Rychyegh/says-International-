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

test('KG aliases match Kindergarten in both class and section assignments',()=>{
 assert.deepEqual(teacherAssignedClasses({user:{id:'teacher-1',classAssigned:'KG 2'},assignments:[{userId:'teacher-1',classes:['Kindergarten 2']}]}),['Kindergarten 2']);
 assert.equal(studentInAssignedClass({level:'Kindergarten 2',subClass:'Kindergarten 2A'},'KG 2A'),true);
 assert.equal(studentInAssignedClass({level:'KG 2',subClass:'KG 2B'},'Kindergarten 2A'),false);
});

const { normalizeSubClass } = await import('../src/data/classStructure.js');
const { classLabelMatches, canonicalSchoolClass } = await import('../src/lib/classLabelMatch.js');
test('kindergarten aliases preserve A/B when selecting score sheets',()=>{
 assert.equal(classLabelMatches('KG 2A','Kindergarten 2 A'),true);
 assert.equal(classLabelMatches('KG 1','Kindergarten 2'),false);
 assert.equal(canonicalSchoolClass('kg2 b'),'Kindergarten 2B');
 assert.equal(normalizeSubClass('KG 2','KG 2B'),'Kindergarten 2B');
 assert.equal(normalizeSubClass('Kindergarten 2','KG 2A'),'Kindergarten 2A');
});
