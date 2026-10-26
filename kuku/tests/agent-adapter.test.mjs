import test from 'node:test';
import assert from 'node:assert/strict';
import {createOpenAIAdapter} from '../agents/openai-adapter.mjs';
import {ROLES} from '../agents/roles.mjs';
const r={summary:'İnceleme gerekiyor',findings:[],risks:[],questions:[],evidenceIds:[],stance:'insufficient',recommendation:'not_applicable'};
test('API anahtarı olmadan canlı model bağlantısı kurulmaz',()=>{assert.throws(()=>createOpenAIAdapter({apiKey:'',model:'test-model'}),/gerekli/)});
test('model anahtarı tarayıcıya değil sunucu POST isteğine verilir; istemci içeriği json',async()=>{
 let call;const adapter=createOpenAIAdapter({apiKey:'test-only',model:'test-model',request:async(url,opts)=>{call={url,opts};return {ok:true,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(r)}]}]})}}});
 const answer=await adapter(ROLES[0],{caseData:{symbol:'DEMO1',sources:[]},prior:{}});
 assert.equal(answer.stance,'insufficient');assert.equal(call.url,'https://api.openai.com/v1/responses');
 assert.equal(call.opts.headers.Authorization,'Bearer test-only');const body=JSON.parse(call.opts.body);assert.equal(body.store,false);assert.equal(body.text.format.type,'json_schema');
});
test('API hatası veya yanıtsız çıktı açıkça durdurulur',async()=>{const a=createOpenAIAdapter({apiKey:'demo',model:'demo',request:async()=>({ok:false,status:401})});await assert.rejects(()=>a(ROLES[0],{caseData:{},prior:{}}),/HTTP 401/)});
