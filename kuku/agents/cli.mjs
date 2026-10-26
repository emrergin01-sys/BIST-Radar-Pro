#!/usr/bin/env node
import {readFileSync,writeFileSync} from 'node:fs';
import {orchestrateCase} from './orchestrator.mjs';
import {createOpenAIAdapter} from './openai-adapter.mjs';
const [command,input,output]=process.argv.slice(2);
if(!['demo','live'].includes(command)||!input){console.error('Kullanım: node kuku/agents/cli.mjs demo|live vaka.json [sonuc.json]');process.exitCode=2;}
else{
 try{
  const c=JSON.parse(readFileSync(input,'utf8'));
  if(command==='live'&&!output)throw Error('Canlı modda yalnız ÖZEL ve YEREL dosya çıkışı verilmeli');
  const run=command==='live'?createOpenAIAdapter():undefined;
  const r=await orchestrateCase(c,{mode:command,runAgent:run,modelName:command==='live'?process.env.OPENAI_MODEL:'mock'});
  const result=JSON.stringify(r,null,2);
  if(output){writeFileSync(output,result,{mode:0o600});console.log('KUKU raporu yerel dosyaya yazıldı: '+output)}
  else console.log(result);
 }catch(e){console.error('KUKU AJAN HATASI: '+e.message);process.exitCode=1;}
}
