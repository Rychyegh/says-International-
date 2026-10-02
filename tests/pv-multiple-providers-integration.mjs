import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
let supported=false, posts=[];
const providers=[{id:'11111111-1111-4111-8111-111111111111',name:'Books supplier'},{id:'22222222-2222-4222-8222-222222222222',name:'Meals supplier'}];
try {
 const page=await browser.newPage();
 await page.route('**/api/**',async route=>{
  const request=route.request(),path=new URL(request.url()).pathname;
  let value=[];
  if(path.endsWith('/finance/service-providers')) value=providers;
  if(path.endsWith('/openapi.json')) value=supported ? {paths:{'/finance/vouchers':{post:{requestBody:{content:{'application/json':{schema:{properties:{items:{type:'array',items:{properties:{payee_id:{},payee_name:{}}}}}}}}}}}}} : {paths:{}};
  if(path.endsWith('/finance/vouchers') && request.method()==='POST') {
   const body=request.postDataJSON();posts.push(body);
   value={...body,id:'33333333-3333-4333-8333-333333333333',status:'DRAFT',items:body.items.map((item,index)=>({...item,id:`item-${index}`}))};
  }
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(value)});
 });
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?enabled=1&view=pv');
 for(const [index,provider] of providers.entries()) {
  await page.getByLabel('Select or Add Provider').selectOption(provider.id);
  await page.getByPlaceholder('e.g. Electricity bill, Canteen supplies, Bus maintenance...').fill(index ? 'Meals':'Books');
  await page.getByPlaceholder('1',{exact:true}).fill('1');
  await page.getByPlaceholder('0.00',{exact:true}).fill(index ? '50':'25');
  await page.getByRole('button',{name:'+ Add to PV',exact:true}).click();
 }
 await page.getByRole('button',{name:'Post PV for Approval >>',exact:true}).click();
 await page.getByText(/nothing was submitted/).waitFor({timeout:5000}).catch(async error=>{console.log(await page.locator('body').innerText());throw error;});
 assert.equal(posts.length,0);
 supported=true;
 await page.getByRole('button',{name:'Post PV for Approval >>',exact:true}).click();
 await page.getByText(/Successfully posted Payment Voucher/).waitFor();
 assert.equal(posts.length,1);
 assert.equal(posts[0].payee_id,null);
 assert.deepEqual(posts[0].items.map(item=>item.payee_id),providers.map(p=>p.id));
 const saved=await page.evaluate(()=>window.testStore.paymentVouchers[0]);
 assert.deepEqual(saved.items.map(item=>item.providerId),providers.map(p=>p.id));
 assert.deepEqual(saved.items.map(item=>item.totalAmount),[25,50]);
 console.log('PASS: two providers on one PV, unsupported backend preserves draft without writes, supported backend receives and returns distinct item payees.');
} finally {await browser.close();}
