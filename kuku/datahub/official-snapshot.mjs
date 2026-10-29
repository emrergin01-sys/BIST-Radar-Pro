import {mkdir,writeFile} from 'node:fs/promises';
import {fetchTcmb,publicSourceRegistry} from './official-feed.mjs';
const today=new Date().toISOString().slice(0,10);
const run={schema:'kuku.official-source-status.v1',runAt:new Date().toISOString(),sourceRegistry:publicSourceRegistry,feeds:[]};
try{const fx=await fetchTcmb();run.feeds.push({name:'TCMB',status:'ok',snapshot:fx});}
catch(e){run.feeds.push({name:'TCMB',status:'unavailable',error:String(e.message)});process.exitCode=1;}
for(const s of publicSourceRegistry.filter(x=>!x.automated))run.feeds.push({name:s.name,status:'not-integrated',reason:s.requiresLicenseForApi?'Lisanslı API erişimi gerekir':'Doğrudan, doğrulanmış veri adaptörü henüz yok'});
await mkdir('artifacts',{recursive:true});
await writeFile(`artifacts/official-${today}.json`,JSON.stringify(run,null,2));
process.stdout.write(JSON.stringify({runAt:run.runAt,feeds:run.feeds.map(x=>({name:x.name,status:x.status}))})+'\n');
