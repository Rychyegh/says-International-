// Synthetic backend; no production records are touched.
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
const context=await browser.newContext();const errors=[];
const studentId='22222222-2222-4222-8222-222222222222';let fees=[],fail=false,omit=false;
await context.route('**/api/**',async route=>{
 const req=route.request(),path=new URL(req.url()).pathname;let body=[],status=200;
 if(path.endsWith('/students'))body=[{id:studentId,student_id_code:'REMALJ-2026-TEST',full_name:'Accounts Test',status:'ACTIVE',class_level:'Basic 7'}];
 if(path.endsWith('/academic/settings'))body={academicYear:'2026/2027',academicTerm:'Term 1'};
 if(path.endsWith('/finance/fees')){body=fees;if(fail){status=403;body={detail:'Accounts permission denied'};}}
 if(path.endsWith('/finance/bills/student')){const id=omit?'missing-invoice':'invoice-1';if(!omit)fees=[{id,student_id:studentId,student_name:'Accounts Test',billed_amount:123.45,paid_amount:0,balance:123.45}];body={bill_id:id,total_billed:123.45};}
 await route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
});
try{
 const author=await context.newPage(),accounts=await context.newPage();
 for(const page of [author,accounts])page.on('pageerror',e=>errors.push(e.message));
 await author.goto('http://127.0.0.1:5179/tests/store-harness.html?enabled=1');
 await accounts.goto('http://127.0.0.1:5179/tests/store-harness.html?enabled=1&view=accounts');
 await author.waitForFunction(()=>window.testStore&&!window.testStore.isRefreshingBackend);
 await accounts.waitForFunction(()=>window.testStore&&!window.testStore.isRefreshingBackend);
 const bill={studentId,items:[{details:'Tuition',amount:123.45}],totalAmount:123.45,term:'Term 1'};
 const saved=await author.evaluate(b=>window.testStore.postAcademicBill(b),bill);assert.equal(saved.failed,0);
 await accounts.waitForFunction(()=>window.testStore.studentFees[0]?.billedAmount===123.45);
 await accounts.reload();await accounts.waitForFunction(()=>window.testStore.studentFees[0]?.billedAmount===123.45);
 fail=true;await accounts.getByRole('button',{name:'Refresh Accounts from database'}).click();
 await accounts.getByRole('alert').filter({hasText:'Accounts permission denied'}).waitFor();
 assert.equal(await accounts.evaluate(()=>window.testStore.studentFees[0].billedAmount),123.45);
 fail=false;await accounts.getByRole('button',{name:'Refresh Accounts from database'}).click();
 await accounts.waitForFunction(()=>!window.testStore.syncErrors.feesRes);
 omit=true;const result=await author.evaluate(b=>window.testStore.postAcademicBill(b),bill);
 assert.equal(result.reconciliationPending,true);assert.match(result.errors.join(' '),/does not include/);
 assert.deepEqual(errors,[]);
 console.log('PASS: posted bill reaches open Accounts tab, amount survives reload, denied reads retain records and show errors, missing invoice feed requires reconciliation.');
}finally{await browser.close();}
