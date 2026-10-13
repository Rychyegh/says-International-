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

test('bank CSV preserves quoted text and rejects invalid dates and amounts', async () => {
 const {parseBankCsv}=await import('../src/lib/accountingRules.js');
 const rows=parseBankCsv('date,reference,description,amount\r\n2026-10-01,BANK-1,"Fees, class 1",100.50\r\n2026-10-02,BANK-2,"Bank ""charge""",-5');
 assert.equal(rows[0].description,'Fees, class 1');assert.equal(rows[1].amount,-5);assert.equal(rows[1].description,'Bank "charge"');
 for(const text of ['date,amount\n2026-10-01,1','date,reference,description,amount\n2026-02-30,X,Y,1','date,reference,description,amount\n2026-10-01,X,Y,0.001','date,reference,description,amount\n2026-10-01,X,"unclosed,1'])assert.throws(()=>parseBankCsv(text));
});
test('reconciliation matches reject duplicates, previously reconciled entries and opposite signs',async()=>{
 const {validateReconciliationMatches}=await import('../src/lib/accountingRules.js');
 const bank=[{line_id:'1',amount:100},{line_id:'2',amount:100}];
 const ledger=[{id:'a',amount:100},{id:'b',amount:-100},{id:'c',amount:100,reconciled:true}];
 assert.equal(validateReconciliationMatches(bank,ledger,{'1':'a'}).length,1);
 assert.throws(()=>validateReconciliationMatches(bank,ledger,{'1':'a','2':'a'}),/twice/);
 assert.throws(()=>validateReconciliationMatches(bank,ledger,{'1':'b'}),/equal signed/);
 assert.throws(()=>validateReconciliationMatches(bank,ledger,{'1':'c'}),/unreconciled/);
});
test('single-component tax preview distinguishes inclusive amounts and handles zero rates',async()=>{
 const {taxPreview}=await import('../src/lib/accountingRules.js');
 assert.deepEqual(taxPreview('120','20',true),{net:100,tax:20,total:120});
 assert.deepEqual(taxPreview('100','0'),{net:100,tax:0,total:100});
 assert.equal(taxPreview('','20'),null);assert.equal(taxPreview('100','-1'),null);
});
test('audit diffs identify added, removed and changed fields; CSV neutralizes formulas',async()=>{
 const {auditChanges,csvExport}=await import('../src/lib/accountingRules.js');
 assert.deepEqual(auditChanges({status:'draft',old:'removed',same:1},{status:'posted',new:'added',same:1}).map(r=>r.field),['status','old','new']);
 assert.match(csvExport([{key:'name',label:'Name'}],[{name:'=SUM(A1)'},{name:'a,"b"'}]),/"'=SUM\(A1\)"/);
});
test('accounting reports preserve filters and require a report envelope',async()=>{
 const {accountingReport}=await import('../src/services/accounting.js');
 globalThis.fetch=async url=>{assert.match(url,/reports\/trial-balance\?as_of=2026-10-13/);return json({report:{lines:[]}});};
 assert.deepEqual((await accountingReport('reports/trial-balance',{as_of:'2026-10-13'})).lines,[]);
 globalThis.fetch=async()=>json({items:[]});await assert.rejects(accountingReport('reports/trial-balance'),/did not return a report/);
});
