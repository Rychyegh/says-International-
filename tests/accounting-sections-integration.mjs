import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:5179';
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],writes=[];
 page.on('pageerror',e=>errors.push(e.message));
 let offline=true,period={id:'p1',version:1,name:'Term 1',start_date:'2026-09-01',end_date:'2026-12-31',status:'open'};
 const checks=['student_balances','reconciliations','journals','receipts','taxes','statements'];
 await page.route('**/api/**',async route=>{
  const request=route.request(),url=new URL(request.url()),resource=url.pathname.split('/accounting/')[1];
  if(offline)return route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({detail:'Accounting service unavailable'})});
  let data={items:[],next_cursor:null};
  if(resource==='accounts')data.items=[{id:'cash',version:1,code:'1001',name:'Bank',type:'asset',classification:'current',channel:'bank',status:'active'},{id:'capital',version:1,code:'3001',name:'Capital',type:'equity',status:'active'}];
  if(resource==='accounts/cash/transactions')data={report:{snapshot_id:'snapshot-1',closing_balance:95,lines:[{id:'tx1',date:'2026-10-01',reference:'FEE-1',description:'Fee payment',amount:100,reconciled:false},{id:'tx2',date:'2026-10-02',reference:'CHG-1',description:'Bank charge',amount:-5,reconciled:false}]}};
  if(resource==='accounts/cash/ledger')data={report:{opening_balance:0,closing_balance:95,lines:[{id:'tx1',date:'2026-10-01',reference:'FEE-1',description:'Fees',debit:100,credit:0,running_balance:100},{id:'tx2',date:'2026-10-02',reference:'CHG-1',description:'Bank charge',debit:0,credit:5,running_balance:95}]}};
  if(resource==='reports/trial-balance')data={report:{total_debit:100,total_credit:100,lines:[{account_code:'1001',account_name:'Bank',debit:100,credit:0},{account_code:'3001',account_name:'Capital',debit:0,credit:100}]}};
  if(resource==='periods')data.items=[period];
  if(resource==='periods/p1/checks')data={report:{period_id:'p1',period_version:period.version,check_token:`check-${period.version}`,ready_to_close:true,checks:checks.map(key=>({key,status:'passed',message:'Verified from posted records'}))}};
  if(resource==='audit-events')data.items=[{id:'evt1',occurred_at:'2026-10-13T10:00:00Z',actor_name:'Head Admin',action:'approve',resource:'journals',reference:'J-1',reason:'Verified',before:{status:'submitted',amount:50},after:{status:'posted',amount:50}},{id:'evt2',occurred_at:'2026-10-12T09:00:00Z',actor_name:'Accountant',action:'create',resource:'tax-settings',reference:'T-1',reason:'New proposal',before:{},after:{rate:5}}];
  if(request.method()==='POST'){
   const payload=request.postDataJSON();writes.push({resource,payload});
   data={record:{id:'saved',version:1,status:'draft',reference:'REC-1',...payload}};
   if(resource==='reconciliations')data.record={...data.record,ledger_balance:95,difference:0};
   if(resource==='periods/p1/actions'){period={...period,version:period.version+1,status:payload.action==='request_close'?'pending_close':payload.action==='close'?'closed':'open'};data={record:period};}
  }
  return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto(`${base}/tests/accounting-harness.html`);
 const unique=[['Account Records','Prepare journal / opening balances'],['Bank Reconciliation','Bank statement import'],['Balance Sheet','Statement of financial position'],['Tax & SSNIT Settings','Single-component tax calculator'],['PV Receipts','Receipt preview'],['Audit Trail','Before and after'],['Account Setup','Create account'],['Period Closing','Period-end closing checklist']];
 for(const [nav,heading] of unique){await page.getByRole('button',{name:nav,exact:true}).click();await page.getByRole('heading',{name:heading,exact:true}).waitFor();assert.equal(await page.getByRole('heading',{level:1,name:nav}).count(),1);}
 await page.getByRole('button',{name:'Tax & SSNIT Settings',exact:true}).click();
 await page.getByLabel('Amount (GHS)',{exact:true}).fill('120');await page.getByLabel('Component rate (%)').fill('20');await page.getByLabel('Amount entered').selectOption('inclusive');
 assert.match(await page.locator('.accounting-metrics').last().textContent(),/100\.00/);
 await page.screenshot({path:'/tmp/accounting-v2-offline-tax.png',fullPage:true});
 offline=false;
 await page.reload();
 await page.getByRole('tab',{name:'General ledger',exact:true}).click();await page.getByLabel('Ledger account').selectOption('cash');await page.getByRole('button',{name:'Load ledger',exact:true}).click();await page.getByText('Bank charge',{exact:true}).waitFor();
 await page.getByRole('tab',{name:'Trial balance',exact:true}).click();await page.getByRole('button',{name:'Load trial balance',exact:true}).click();await page.getByRole('cell',{name:'Capital',exact:true}).waitFor();
 await page.getByRole('button',{name:'Bank Reconciliation',exact:true}).click();
 await page.getByLabel('Payment account',{exact:true}).selectOption('cash');await page.getByLabel('Statement start date').fill('2026-10-01');await page.getByLabel('Statement end date').fill('2026-10-13');await page.getByLabel('Statement closing balance').fill('95');
 await page.getByRole('button',{name:'Load bank ledger'}).click();await page.getByRole('cell',{name:'Bank charge',exact:true}).waitFor();
 await page.getByLabel('Import statement CSV').setInputFiles({name:'statement.csv',mimeType:'text/csv',buffer:Buffer.from('date,reference,description,amount\n2026-10-01,FEE-1,Fees,100\n2026-10-02,CHG-1,Bank charge,-5')});
 await page.getByRole('button',{name:'Suggest exact reference matches'}).click();assert.equal(await page.getByLabel('Match statement line 1').inputValue(),'tx1');assert.equal(await page.getByLabel('Match statement line 2').inputValue(),'tx2');
 await page.getByLabel('Bank statement reference').fill('BANK-OCT');await page.getByLabel('Unmatched items / reconciliation notes').fill('All lines matched');await page.getByRole('button',{name:'Save reconciliation draft'}).click();await page.getByRole('status').filter({hasText:'Saved and confirmed'}).waitFor();assert.equal(writes.at(-1).payload.matches.length,2);assert.equal(writes.at(-1).payload.ledger_snapshot_id,'snapshot-1');
 await page.screenshot({path:'/tmp/accounting-v2-bank.png',fullPage:true});
 await page.getByRole('button',{name:'Audit Trail',exact:true}).click();await page.getByLabel('Action',{exact:true}).selectOption('approve');await page.locator('.accounting-audit-event').click();await page.getByRole('cell',{name:'submitted',exact:true}).waitFor();assert.equal(await page.getByRole('cell',{name:'Amount',exact:true}).count(),0);
 await page.getByRole('button',{name:'Account Setup',exact:true}).click();await page.getByLabel('Code',{exact:true}).fill('5001');await page.getByLabel('Name',{exact:true}).fill('Maintenance');await page.getByLabel('Type',{exact:true}).selectOption('expense');await page.getByLabel('Classification').selectOption('operating');await page.getByRole('button',{name:'Create account',exact:true}).click();await page.getByRole('status').filter({hasText:'Saved and confirmed'}).waitFor();assert.equal(writes.at(-1).payload.classification,'operating');
 await page.getByRole('button',{name:'Period Closing',exact:true}).click();await page.getByRole('button',{name:'View record',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Submit closing checks'}).isDisabled(),true);await page.getByRole('button',{name:'Run closing checks'}).click();await page.getByText('All checks passed.',{exact:false}).waitFor();await page.getByRole('button',{name:'Submit closing checks'}).click();await page.getByRole('button',{name:'Approve and lock period'}).waitFor();assert.equal(await page.getByRole('button',{name:'Approve and lock period'}).isDisabled(),true);await page.getByRole('button',{name:'Run closing checks'}).click();await page.getByText('All checks passed.',{exact:false}).waitFor();await page.getByRole('button',{name:'Approve and lock period'}).click();await page.getByRole('heading',{name:'Closure record'}).waitFor();assert.equal(writes.at(-1).payload.check_token,'check-2');
 await page.goto(`${base}/tests/accounting-harness.html?role=accountant`);await page.getByRole('button',{name:'Account Setup',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Create account',exact:true}).isDisabled(),true);
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Period Closing',exact:true}).click();await page.getByRole('heading',{name:'Period-end closing checklist'}).waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
 assert.deepEqual(errors,[]);
 console.log('PASS: eight distinct workspaces during outage; tax preview; ledger/trial balance; CSV matching; audit diff; account setup; checked period approval; accountant restrictions; mobile layout.');
}finally{await browser.close();}
