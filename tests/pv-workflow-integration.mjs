// Every backend request intercepted. Separate browser contexts model separate devices.
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
const pid='11111111-1111-4111-8111-111111111111',vid='22222222-2222-4222-8222-222222222222';
let providers=[],vouchers=[],providerFail=403,pvFail=0,approveFail=0,calls=[],errors=[];
async function setup(view,role){
 const context=await browser.newContext();const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname.replace('/api/v1',''),method=req.method(),body=req.postDataJSON();calls.push({path,method,body,key:req.headers()['idempotency-key']});let value=[],status=200;
  if(path==='/academic/settings')value={academicYear:'2026/2027',academicTerm:'Term 1'};
  if(path==='/finance/service-providers'){
   if(method==='POST'){await new Promise(r=>setTimeout(r,100));if(providerFail){status=providerFail;value={detail:'Provider permission rejected'};}else{value={...body,id:providers.length ? '33333333-3333-4333-8333-333333333333' : pid,is_active:true};providers=[...providers,value];}}
   else value=providers;
  }
  if(path.startsWith('/finance/service-providers/')){const id=path.split('/').pop();if(method==='PUT'){value={...body,id,is_active:true};providers=providers.map(p=>p.id===id?value:p);}if(method==='DELETE'){providers=providers.filter(p=>p.id!==id);value={success:true};}}
  if(path==='/finance/vouchers'){
   if(method==='POST'){await new Promise(r=>setTimeout(r,100));if(pvFail){status=pvFail;value={detail:'PV rejected'};}else{value={...body,id:vid,pv_number:'PV-2026-1001',total_amount:body.amount,status:'DRAFT',items:undefined};vouchers=[value];}}
   else value=vouchers;
  }
  if(path===`/finance/vouchers/${vid}`)value=vouchers[0];
  if(path.endsWith('/pre-audit')){vouchers[0]={...vouchers[0],status:body.decision==='approve'?'PRE_AUDITED':'REJECTED'};value=vouchers[0];}
  if(path.endsWith('/approve')){if(approveFail){status=approveFail;value={detail:'Approval rejected'};}else{vouchers[0]={...vouchers[0],status:'APPROVED'};value=vouchers[0];}}
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(value)});
 });
 await page.goto(`http://127.0.0.1:5179/tests/store-harness.html?enabled=1&view=${view}`);await page.evaluate(role=>window.mountStore(role,true),role);await page.waitForFunction(()=>window.testStore&&!window.testStore.isRefreshingBackend);return page;
}
try{
 const sub=await setup('pv','sub_admin');const form=sub.getByRole('form',{name:'Service provider form'});
 await form.getByPlaceholder('e.g. Market Depot / Vendor Name').fill('Test Supplier');
 await form.getByPlaceholder('e.g. vendor@example.com').fill('supplier@example.test');
 await form.getByRole('button',{name:'Add',exact:true}).click();await form.locator('..').getByRole('status').filter({hasText:'failed'}).waitFor();
 assert.equal(await sub.getByLabel('Select or Add Provider').inputValue(),'');assert.equal(await form.getByPlaceholder('e.g. Market Depot / Vendor Name').inputValue(),'Test Supplier');
 providerFail=0;await form.getByRole('button',{name:'Add',exact:true}).dblclick();await sub.waitForFunction(pid=>window.testStore.serviceProviders.some(p=>p.id===pid),pid);
 assert.equal(await sub.getByLabel('Select or Add Provider').inputValue(),pid);
 assert.equal(providers.length,1);
 await sub.getByPlaceholder('e.g. Electricity bill, Canteen supplies, Bus maintenance...').fill('Repair classroom fans');await sub.getByPlaceholder('1',{exact:true}).fill('2');await sub.getByPlaceholder('0.00',{exact:true}).fill('25');
 pvFail=500;await sub.getByRole('button',{name:'Post PV for Approval >>',exact:true}).click();await sub.getByText('PV submission failed:',{exact:false}).waitFor();assert.equal(vouchers.length,0);assert.equal(calls.filter(c=>c.path==='/finance/pv'&&c.method==='POST').length,0);
 pvFail=0;await sub.getByRole('button',{name:'Post PV for Approval >>',exact:true}).dblclick();await sub.waitForFunction(()=>window.testStore.paymentVouchers.length===1);assert.equal(vouchers[0].payee_id,pid);assert.equal(vouchers[0].amount,50);
 const attempts=calls.filter(c=>c.path==='/finance/vouchers'&&c.method==='POST');assert.equal(attempts.length,2);assert.equal(attempts[0].key,attempts[1].key);
 const head=await setup('approve','head_admin');await head.waitForFunction(()=>window.testStore?.paymentVouchers.some(v=>v.pvNo==='PV-2026-1001'));
 await head.getByText('Test Supplier',{exact:true}).first().waitFor();
 await head.getByText('Test Supplier',{exact:true}).first().click();
 const approve=head.getByRole('button',{name:'Approve',exact:true}).first();approveFail=403;await approve.click();await head.getByText('Approval rejected',{exact:false}).first().waitFor();assert.equal(vouchers[0].status,'PRE_AUDITED');
 approveFail=0;await approve.click();await head.waitForFunction(()=>window.testStore.paymentVouchers[0]?.status==='Validated');assert.equal(vouchers[0].status,'APPROVED');
 assert.equal(calls.filter(c=>c.path.endsWith('/pre-audit')).length,1,'retry resumes approval without repeating pre-audit');
 await sub.reload();await sub.waitForFunction(()=>window.testStore?.paymentVouchers[0]?.status==='Validated');assert.equal(await sub.getByLabel('Select or Add Provider').locator('option', {hasText:'Test Supplier'}).count(),1);
 await sub.getByLabel('Select or Add Provider').selectOption('__NEW_PROVIDER__');
 const quick=sub.getByRole('form',{name:'Quick provider form'});
 await quick.getByPlaceholder('e.g. ECG Bogoso, Aunti Lizzy, Isaac Addae...').fill('Second Supplier');
 await quick.getByRole('button',{name:'Save & Select Provider'}).click();
 await sub.waitForFunction(()=>window.testStore.serviceProviders.length===2);
 const secondId='33333333-3333-4333-8333-333333333333';assert.equal(await sub.getByLabel('Select or Add Provider').inputValue(),secondId);
 await form.getByPlaceholder('e.g. Market Depot / Vendor Name').fill('Renamed Supplier');
 await form.getByRole('button',{name:'Modify',exact:true}).click();await sub.waitForFunction(()=>window.testStore.serviceProviders.some(p=>p.name==='Renamed Supplier'));
 sub.once('dialog',dialog=>dialog.accept());await form.getByRole('button',{name:'Delete',exact:true}).click();
 await sub.waitForFunction(()=>window.testStore.serviceProviders.length===1);assert.equal(await sub.getByLabel('Select or Add Provider').inputValue(),'');
 assert.deepEqual(errors,[]);console.log('PASS: provider error/input retention, quick add/modify/delete, database save and selection, double-click protection, failed PV no replay, cross-device head queue, approval error/retry, sub-admin refresh.');
}finally{await browser.close();}
