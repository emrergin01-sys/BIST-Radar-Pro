#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { analyzeCase } from './engine.mjs';
import { eventStudy } from './event-study.mjs';
const [command,path] = process.argv.slice(2);
if(!['analyze','event-study'].includes(command)||!path){
 console.error('Kullanım: node kuku/cli.mjs analyze kuku/examples/demo-case.json');
 console.error('       node kuku/cli.mjs event-study kuku/examples/demo-prices.json');
 process.exitCode=2;
}else{
 try{
  const data=JSON.parse(readFileSync(path,'utf8'));
  console.log(JSON.stringify(command==='analyze'?analyzeCase(data):eventStudy(data),null,2));
 }catch(e){console.error(`KUKU HATA: ${e.message}`);process.exitCode=1;}
}
