import test from 'node:test';
import assert from 'node:assert/strict';
import { validateJournal, statementTotals, filterBills } from '../src/lib/accountingRules.js';
import { accountingList, accountingWrite } from '../src/services/accounting.js';
const json=value=>new Response(JSON.stringify(value),{status:200});
globalThis.localStorage={getItem:()=>null};
test('journals require balanced, positive, single-sided cent amounts',()=>{
 assert.equal(validateJournal([{account_id:'a',debit:0.1,credit:0},{account_id:'b',debit:0.2,credit:0},{account_id:'c',debit:0,credit:0.3}]),0.3);
 for(const lines of [[],[{account_id:'a',debit:5,credit:0},{account_id:'b',debit:0,credit:4}],[{account_id:'a',debit:1,credit:1},{account_id:'b',debit:0,credit:1}],[{account_id:'a',debit:1.001,credit:0},{account_id:'b',debit:0,credit:1.001}]]) assert.throws(()=>validateJournal(lines));
});
test('statement completeness and equation are checked, including negative equity',()=>{
 assert.equal(statementTotals([]),null);
 assert.equal(statementTotals([{type:'asset',amount:null}]),null);
 assert.equal(statementTotals([{type:'asset',amount:100},{type:'liability',amount:110},{type:'equity',amount:-10}]).balanced,true);
 assert.equal(statementTotals([{type:'asset',amount:100},{type:'equity',amount:90}]).balanced,false);
});
test('bill filters intersect class, term, year, status, range and sort',()=>{
 const rows=[{id:1,studentName:'Zoe',classLevel:'Basic 1',term:'Term 1',academicYear:'2026/2027',balance:100,paidAmount:0},{id:2,studentName:'Amy',classLevel:'Basic 1',term:'Term 1',academicYear:'2026/2027',balance:50,paidAmount:50},{id:3,studentName:'Ben',classLevel:'Basic 2',term:'Term 2',academicYear:'2025/2026',balance:0,paidAmount:100}];
 assert.deepEqual(filterBills(rows,{classLevel:'Basic 1',term:'Term 1',year:'2026/2027',status:'Partially paid',min:10,max:60}).map(x=>x.id),[2]);
 assert.deepEqual(filterBills(rows,{sort:'balance'}).map(x=>x.id),[1,2,3]);
 assert.deepEqual(filterBills(rows,{status:'Paid'}).map(x=>x.id),[3]);
});
test('accounting reads all pages and rejects malformed responses',async()=>{
 let calls=0;globalThis.fetch=async()=>json(++calls===1?{items:[{id:1}],next_cursor:'next'}:{items:[{id:2}],next_cursor:null});
 assert.equal((await accountingList('journals')).length,2);
 globalThis.fetch=async()=>json([]);await assert.rejects(accountingList('receipts'),/invalid list/);
 globalThis.fetch=async()=>json({items:[],next_cursor:'same'});await assert.rejects(accountingList('receipts'),/repeated/);
});
test('writes keep idempotency identity across retries and require saved records',async()=>{
 const keys=[];globalThis.fetch=async(_,options)=>{keys.push(options.headers['Idempotency-Key']);return json({record:{id:'j1'}});};
 await accountingWrite('journals',{description:'Opening'});await accountingWrite('journals',{description:'Opening'});assert.equal(keys[0],keys[1]);
 globalThis.fetch=async()=>json({success:true});await assert.rejects(accountingWrite('journals',{}),/saved record/);
});
