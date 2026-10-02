// All API requests are mocked. Requires local Vite on port 5179.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE ? {executablePath:process.env.CHROME_EXECUTABLE} : {})});
try{
for(const [pin,role] of [['8888','head_admin'],['1234','sub_admin']]){
 const page=await browser.newPage();let pinCalls=0; let sessionChecks=0;
 await page.route('**/api/**',async route=>{
 const path=new URL(route.request().url()).pathname;let data=[];
 if(path.includes('/verify-admin-pin'))pinCalls++;
 if(path.endsWith('/auth/login')||path.endsWith('/sims-auth/login'))data={token:'test-token',user:{email:'admin@test.com',role:'ADMIN',fullName:'Test Admin'}};
 if(path.endsWith('/auth/me')){ sessionChecks++; }
 if(path.endsWith('/auth/me'))data={user:{email:'admin@test.com',role:'ADMIN',fullName:'Test Admin'}};
 await route.fulfill({status:path.endsWith('/auth/me')?404:200,contentType:'application/json',body:JSON.stringify(path.endsWith('/auth/me')?{detail:'Not Found'}:data)});
 });
 await page.goto('http://127.0.0.1:5179/#/admin');
 await page.locator('#admin-email').fill('admin@test.com');
 await page.locator('#admin-password').fill('test-password');
 await page.getByRole('button',{name:'Sign In',exact:true}).click();
 await page.locator('#admin-pin-input').fill('0000');
 await page.getByRole('button',{name:'Verify PIN & Complete Sign In'}).click();
 await page.getByText('Invalid Security PIN.',{exact:false}).waitFor();
 await page.locator('#admin-pin-input').fill(pin);
 await page.getByRole('button',{name:'Verify PIN & Complete Sign In'}).click();
 await page.waitForFunction(role=>JSON.parse(sessionStorage.getItem('auth_user'))?.adminRole===role,role);
 assert.equal(sessionChecks,0,'fresh login should not wait for auth/me');
 await page.locator('#admin-pin-input').waitFor({state:'detached'});
 await page.reload();
 await page.getByRole('button',{name:'Sign Out',exact:true}).waitFor();
 assert.ok(sessionChecks>0,'reload still verifies the backend session');
 await page.waitForFunction(role=>JSON.parse(sessionStorage.getItem('auth_user'))?.role===role,role);
 assert.equal(pinCalls,0);
 await page.close();
}
console.log('PASS: admin@test.com opens with both PINs without a redundant session request; invalid PINs rejected; reload works when the deployed /auth/me endpoint returns 404.');
}finally{await browser.close();}
