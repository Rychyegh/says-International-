// All network API calls intercepted. Simulates a committed create with lost response.
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE});
const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
let keys=[],bodies=[],verified=false,providers=[];
try {
 await page.route('**/api/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname;let data=[];
  if(path.endsWith('/auth/me'))data={requiresSecondFactor:!verified,user:{id:'test-user',role:'sub_admin',portalRole:'sub_admin'}};
  if(path.endsWith('/auth/verify-admin-pin')){verified=true;data={requiresSecondFactor:false,token:'eyJ-verified-recovery',user:{id:'test-user',role:'sub_admin',portalRole:'sub_admin'}};}
  if(path.endsWith('/finance/service-providers')){
   if(req.method()==='POST'){
    keys.push(req.headers()['idempotency-key']);bodies.push(req.postDataJSON());
    if(keys.length===1){providers=[{...req.postDataJSON(),id:'11111111-1111-4111-8111-111111111111'}];await route.abort('connectionreset');return;}
    assert.equal(req.headers().authorization,'Bearer eyJ-verified-recovery');data=providers[0];
   }else data=providers;
  }
  await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto('http://127.0.0.1:5179/tests/store-harness.html?view=pv');
 await page.waitForFunction(()=>window.testStore);
 await page.evaluate(async()=>{const {api}=await import('/src/services/api.js');await api.createServiceProvider({name:'Recovery Supplier',phone:'0241112222'}).catch(()=>{});});
 await page.getByText('Database outcome uncertain',{exact:false}).waitFor();
 await page.reload();await page.getByText('Database outcome uncertain',{exact:false}).waitFor();
 await page.getByRole('button',{name:'Retry original request with same key'}).click();
 await page.getByText('Complete server-side PIN verification before retrying.',{exact:false}).waitFor();
 assert.equal(keys.length,1);
 await page.evaluate(async()=>{const {api}=await import('/src/services/api.js');await api.verifyAdminPin('2468');});
 await page.getByRole('button',{name:'Retry original request with same key'}).click();
 await page.getByText('The original request is confirmed saved.',{exact:false}).waitFor();
 assert.equal(keys.length,2);assert.equal(keys[0],keys[1]);assert.deepEqual(bodies[0],bodies[1]);assert.equal(providers.length,1);
 assert.deepEqual(errors,[]);
 console.log('PASS: lost response survives refresh, provisional retry blocked, PIN replacement token used, exact payload/key replay without duplicate.');
} finally {await browser.close();}
