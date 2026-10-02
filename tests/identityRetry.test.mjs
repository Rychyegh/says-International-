import test from 'node:test';
import assert from 'node:assert/strict';
import {identityRetry} from '../src/lib/identityRetry.js';
const storage = () => { const values=new Map();return {getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),values}; };
test('random operation key survives refresh and completed replay without storing private data',async()=>{
 const db=storage(),payload={name:'Private Learner',email:'private@example.test'};
 const first=await identityRetry('/admissions','actor-secret',payload,db);
 assert.match(first.key,/^[0-9a-f-]{36}$/);
 assert.equal((await identityRetry('/admissions','actor-secret',{email:payload.email,name:payload.name},db)).key,first.key);
 first.complete();assert.equal((await identityRetry('/admissions','actor-secret',payload,db)).key,first.key);
 const saved=JSON.stringify([...db.values]);assert.ok(!/Private Learner|private@example|actor-secret/.test(saved));
});
test('unresolved or conflicting submission never silently rotates its key after input edits',async()=>{
 const db=storage();const first=await identityRetry('/students','actor',{name:'One'},db);
 await assert.rejects(identityRetry('/students','actor',{name:'Changed'},db),/unresolved/);
 assert.equal((await identityRetry('/students','actor',{name:'One'},db)).key,first.key);
 first.complete();assert.notEqual((await identityRetry('/students','actor',{name:'Changed'},db)).key,first.key);
});
test('keys are isolated by actor and operation and do not depend deterministically on PII',async()=>{
 const db=storage(),payload={name:'Same'};
 const a=await identityRetry('/students','a',payload,db),b=await identityRetry('/students','b',payload,db),c=await identityRetry('/admissions','a',payload,db),d=await identityRetry('/students','a',payload,storage());
 assert.equal(new Set([a.key,b.key,c.key,d.key]).size,4);
});
test('unavailable persistence stops a write before sending a request',async()=>{
 await assert.rejects(identityRetry('/students','a',{}, {getItem:()=>null,setItem:()=>{throw Error('full');}}),/no submission was sent/);
});

test('409 and 503 keep the original key; explicit validation rejection allows correction',async()=>{
 const db=storage();const a=await identityRetry('/admissions','actor',{name:'Original'},db);
 a.rejected({status:409});await assert.rejects(identityRetry('/admissions','actor',{name:'Changed'},db),/unresolved/);
 a.rejected({status:503});assert.equal((await identityRetry('/admissions','actor',{name:'Original'},db)).key,a.key);
 a.rejected({status:422});assert.notEqual((await identityRetry('/admissions','actor',{name:'Corrected'},db)).key,a.key);
});

test('finance operations retain unresolved keys but allow another identical operation after confirmed success', async () => {
 const db=storage(), options={replayCompleted:false}, payload={amount:100,provider_id:'provider'};
 const first=await identityRetry('/finance/vouchers','actor',payload,db,options);
 first.rejected({status:503});
 assert.equal((await identityRetry('/finance/vouchers','actor',payload,db,options)).key,first.key);
 await assert.rejects(identityRetry('/finance/vouchers','actor',{...payload,amount:200},db,options),/unresolved/);
 first.complete();
 const second=await identityRetry('/finance/vouchers','actor',payload,db,options);
 assert.notEqual(second.key,first.key);
 assert.equal((await identityRetry('/finance/vouchers','actor',payload,db,options)).key,second.key);
});
