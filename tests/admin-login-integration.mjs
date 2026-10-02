// All API requests are mocked. Requires local Vite on port 5179.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE ? {executablePath:process.env.CHROME_EXECUTABLE} : {})});
try{
for(const [pin,role] of [['2468','head_admin'],['2468','sub_admin']]){
 const page=await browser.newPage();let pinCalls=0,sessionChecks=0,verified=false,protectedBeforeVerified=0;
 const user={id:'admin-uuid',email:'admin@test.com',role,portalRole:'admin',fullName:'Test Admin'};
 await page.route('**/api/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname;let data=[],status=200;
  if(path.endsWith('/auth/login')) data={token:'eyJ-provisional',requiresSecondFactor:true,user};
  else if(path.endsWith('/auth/me')) {sessionChecks++;if(!req.headers().authorization){status=401;data={detail:'Sign in required'};}else data={user,requiresSecondFactor:verified?false:true,pinSetupRequired:false};}
  else if(path.endsWith('/verify-admin-pin')) {
   pinCalls++;
   assert.equal(req.headers().authorization,'Bearer eyJ-provisional');
   if(req.postDataJSON().pin!==pin) {status=401;data={detail:'Invalid PIN'};}
   else {verified=true;data={token:'eyJ-verified',user,requiresSecondFactor:false};}
  } else {
   if(!verified) protectedBeforeVerified++;
   assert.equal(req.headers().authorization,'Bearer eyJ-verified');
  }
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto('http://127.0.0.1:5179/#/admin');
 await page.locator('#admin-email').fill('admin@test.com');
 await page.locator('#admin-password').fill('test-password');
 await page.getByRole('button',{name:'Sign In',exact:true}).click();
 await page.locator('#admin-pin-input').waitFor();
 await page.locator('#admin-pin-input').fill('0000');
 await page.getByRole('button',{name:'Verify PIN & Complete Sign In'}).click();
 await page.getByText('Invalid PIN',{exact:false}).waitFor();
 await page.locator('#admin-pin-input').fill(pin);
 await page.getByRole('button',{name:'Verify PIN & Complete Sign In'}).click();
 await page.getByRole('button',{name:'Sign Out',exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>localStorage.getItem('auth_token')),'eyJ-verified');
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('auth_user')).role),role);
 await page.reload();await page.getByRole('button',{name:'Sign Out',exact:true}).waitFor();
 assert.ok(sessionChecks>=3);assert.equal(pinCalls,2);assert.equal(protectedBeforeVerified,0);
 await page.close();
}
for (const portal of ['accountant','teacher','parent','student']) {
 const page=await browser.newPage();let sessionChecks=0;
 await page.route('**/api/**',async route=>{
   const path=new URL(route.request().url()).pathname;
   if(path.endsWith('/auth/me')||path.endsWith('/verify-admin-pin'))sessionChecks++;
   let data=[];
   if(path.endsWith('/auth/login'))data={token:'eyJ-test-token',user:{id:'user-'+portal,email:'test@example.com',role:portal,fullName:'Test User'}};
   if(portal==='teacher' && path.endsWith('/auth/me')) data={user:{id:'user-teacher',email:'test@example.com',role:'teacher'},requiresSecondFactor:false};
   if(path.endsWith('/students/me/dashboard'))data={stats:[],schedule:[],assignments:[],deadlines:[]};
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto(`http://127.0.0.1:5179/#/${portal}`);
 await page.locator(`#${portal}-email`).fill('test@example.com');
 await page.locator(`#${portal}-password`).fill('test-password');
 await page.getByRole('button',{name:'Sign In',exact:true}).click();
 await page.getByRole('button',{name:'Sign Out',exact:true}).waitFor();
 assert.equal(await page.evaluate(p=>JSON.parse(localStorage.getItem('says_authed_portals'))?.[p],portal),true);
 await page.reload();
 await page.getByRole('button',{name:'Sign Out',exact:true}).waitFor();
 assert.equal(sessionChecks,portal==='teacher'?1:0);
 await page.getByRole('button',{name:'Sign Out',exact:true}).click();
 await page.locator(`#${portal}-email`).waitFor();
 await page.close();
}
console.log('PASS: server PIN verification, replacement token, server-derived roles, refresh checks, no provisional data reads; unchanged non-admin sign-in.');
}finally{await browser.close();}
