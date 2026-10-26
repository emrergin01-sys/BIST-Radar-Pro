#!/usr/bin/env node
import {readFileSync,writeFileSync} from 'node:fs';
import {importSnapshot,compareSnapshots,topMoves} from './snapshots.mjs';
import {buildLedger} from './evidence.mjs';
const [action,...args]=process.argv.slice(2);
const help='Kullanım: node kuku/datahub/cli.mjs import file.csv metadata.json output.json | compare old.json new.json metric result.json | evidence ledger.json YYYY-AA-GG result.json';
try{
 if(action==='import'&&args.length===3){const [csv,meta,out]=args;const result=importSnapshot(readFileSync(csv,'utf8'),JSON.parse(readFileSync(meta,'utf8')));writeFileSync(out,JSON.stringify(result,null,2));console.log(`KUKU: ${result.count} şirket, ${result.availableMetrics.length} metrik içe alındı. ${out}`);}
 else if(action==='compare'&&args.length===4){const [oldFile,newFile,metric,out]=args;const result=compareSnapshots(JSON.parse(readFileSync(oldFile,'utf8')),JSON.parse(readFileSync(newFile,'utf8')),{metrics:[metric]});writeFileSync(out,JSON.stringify({...result,topMoves:topMoves(result,metric,20)},null,2));console.log(`KUKU: ${result.recordCount} şirket kıyaslandı. ${out}`);}
 else if(action==='evidence'&&args.length===3){const [file,asOf,out]=args;const result=buildLedger(JSON.parse(readFileSync(file,'utf8')),{asOf});writeFileSync(out,JSON.stringify(result,null,2));console.log(`KUKU: ${result.accepted.length} kayıt kabul, ${result.excluded.length} tarih dışı. ${out}`);}
 else{console.error(help);process.exitCode=2;}
}catch(err){console.error(`KUKU VERİ HATASI: ${err.message}`);process.exitCode=1;}
