import test from 'node:test';
import assert from 'node:assert/strict';
import { savedBillItems } from '../src/lib/savedBillItems.js';
test('preserves posted fee lines and explicit optional classification',()=>{
 const items=savedBillItems({items_breakdown:[{item_name:'Books',amount:'200',is_optional:false},{name:'Transport',amount:50,optional:true}],tuition_fee:999});
 assert.deepEqual(items.map(i=>[i.details,i.amount,i.is_optional]),[['Books',200,false],['Transport',50,true]]);
});
test('shows saved split bill components without double counting stationery',()=>{
 const items=savedBillItems({tuition_fee:1000,stationery_fee:200,stationery_breakdown:[{name:'Books',amount:150},{name:'Pencils',amount:50}],optional_services:[{name:'Bus',amount:300}]});
 assert.deepEqual(items.map(i=>i.details),['Tuition','Books','Pencils','Bus']);
 assert.equal(items.reduce((sum,i)=>sum+i.amount,0),1500);
 assert.equal(items[3].is_optional,true);
});
test('does not invent items from an invoice total',()=>assert.deepEqual(savedBillItems({billedAmount:500}),[]));
