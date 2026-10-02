// All requests mocked; separate contexts share only the simulated backend.
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
const providerId='11111111-1111-4111-8111-111111111111';
const voucherId='22222222-2222-4222-8222-222222222222';
let vouchers=[];
try {
 const head=await browser.newPage();
 const sub=await browser.newPage();
 for(const page of [head,sub]) await page.route('**/api/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname;
  let value=[];
  if(path.endsWith('/auth/me')) value={user:{id:'head',role:'head_admin'},requiresSecondFactor:false};
  if(path.endsWith('/finance/service-providers')) value=[{id:providerId,name:'Notification Supplier'}];
  if(path.endsWith('/finance/vouchers')) {
   if(req.method()==='POST') {
    value={...req.postDataJSON(),id:voucherId,pv_number:'PV-2026-1001',status:'DRAFT'};
    vouchers=[value];
   } else value=vouchers;
  }
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(value)});
 });
 await head.addInitScript(()=>{
  localStorage.setItem('auth_token','opaque-head');
  localStorage.setItem('auth_user',JSON.stringify({id:'head',role:'head_admin'}));
  localStorage.setItem('says_authed_portals',JSON.stringify({admin:true}));
 });
 await head.goto('http://127.0.0.1:5179/#/admin');
 await head.locator('#pv-notif-bell').waitFor();
 assert.equal(await head.locator('#pv-notif-bell').getAttribute('title'),'PV Notifications');
 await sub.goto('http://127.0.0.1:5179/tests/store-harness.html?enabled=1&view=pv');
 await sub.evaluate(()=>window.mountStore('sub_admin',true));
 await sub.waitForFunction(()=>window.testStore?.serviceProviders.length===1);
 await sub.evaluate(async providerId=>window.testStore.createPaymentVoucher({pvNo:'PV-2026-1001',providerId,payee_id:providerId,provider:'Notification Supplier',payee_name:'Notification Supplier',description:'Notification test',quantity:1,unit_cost:25,amount:25,datePrepared:'2026-10-02'}),providerId);
 await head.locator('#pv-notif-bell[title="1 unread PV submission"]').waitFor({timeout:15000});
 await head.locator('#pv-notif-bell').click();
 await head.getByText('PV #PV-2026-1001',{exact:true}).click();
 await head.locator('.sidebar-item.active').filter({hasText:'Pre-Audit & Approve PV'}).waitFor();
 await head.getByText('Notification Supplier',{exact:true}).first().waitFor();
 assert.equal(await head.locator('#pv-notif-bell').getAttribute('title'),'PV Notifications');
 assert.match(await head.locator('.sidebar-item.active').innerText(),/1/,'unread count is separate from outstanding approval count');
 console.log('PASS: cross-account saved voucher reaches head bell automatically; alert opens approval desk and reading it preserves pending count.');
} finally {await browser.close();}
