import test from 'node:test';
import assert from 'node:assert/strict';
import {backtestPortfolio} from '../backtest/portfolio-backtest.mjs';
const days=['2026-10-19','2026-10-20','2026-10-21','2026-10-22'];
const series=(a=[100,110,120,120],b=[100,100,100,100],bench=[1000,1000,1000,1000])=>days.flatMap((date,i)=>[
 {date,symbol:'AAA',close:a[i]},{date,symbol:'BBB',close:b[i]},{date,symbol:'XU100',close:bench[i]}
]);
const signal=(date,targets,dataAvailableAt=date)=>({date,dataAvailableAt,targets});
const run=(opts={})=>backtestPortfolio({bars:series(),signals:[signal(days[0],{AAA:1})],initialCash:1000,feeBps:0,slippageBps:0,...opts});
test('Sinyal ertesi işlem günü kapanışında uygulanır',()=>{
 const r=run();assert.equal(r.trades[0].date,days[1]);assert.equal(r.trades[0].shares,9);assert.equal(r.finalEquity,1090);
});
test('Gelecekte elde edilen bilgiyle sinyal işleme alınmaz',()=>{
 const r=run({signals:[signal(days[0],{AAA:1},days[1])]});assert.equal(r.trades.length,0);
 assert.equal(r.excludedSignals.length,1);assert.equal(r.finalEquity,1000);
});
test('Son gün sinyaline hayali gelecek kapanış atanmaz',()=>{
 const r=run({signals:[signal(days[3],{AAA:1})]});assert.equal(r.trades.length,0);assert.equal(r.excludedSignals.length,1);
});
test('Komisyon ve fiyat kayması sonucu düşürür, nakit negatife inmez',()=>{
 const base=run(),cost=run({feeBps:20,slippageBps:20});assert.ok(cost.finalEquity<base.finalEquity);
 assert.ok(cost.totalCostsTRY>0);assert.ok(cost.curve.every(x=>x.cash>=0));
});
test('Satış sonrası başka hisseye geçiş nakitle sınırlıdır',()=>{
 const r=run({signals:[signal(days[0],{AAA:1}),signal(days[1],{BBB:1})]});
 assert.equal(r.trades.filter(x=>x.side==='SELL').length,1);
 assert.ok(r.trades.find(x=>x.symbol==='BBB'&&x.side==='BUY'));
 assert.ok(r.curve.every(x=>x.cash>=0));
});
test('Temettü sadece ex-date gününde mevcut hisselere yazılır',()=>{
 const r=run({actions:[{date:days[2],symbol:'AAA',type:'dividend',amountPerShare:5}]});
 assert.equal(r.dividendsCreditedTRY,45);assert.equal(r.finalEquity,1135);
});
test('Bölünme sonrası pozisyon adetleri değişir',()=>{
 const r=run({bars:series([100,110,60,60]),actions:[{date:days[2],symbol:'AAA',type:'split',ratio:2}]});
 assert.equal(r.finalEquity,1090);assert.equal(r.dividendsCreditedTRY,0);
});
test('Eksik işlem günü fiyatı ileri taşınmaz',()=>{
 const bars=series().filter(x=>!(x.symbol==='BBB'&&x.date===days[2]));
 assert.throws(()=>run({bars}),/Eksik kapanış/);
});
test('Mükerrer fiyat, aşırı ağırlık ve geçersiz tarih reddedilir',()=>{
 assert.throws(()=>run({bars:[...series(),series()[0]]}),/Tekrarlanan fiyat/);
 assert.throws(()=>run({signals:[signal(days[0],{AAA:0.9,BBB:0.9})]}),/aşamaz/);
 assert.throws(()=>run({signals:[signal('2026-02-30',{AAA:1})]}),/Sinyal/);
 assert.throws(()=>run({benchmarkKind:'made_up'}),/benchmarkKind/);
});
test('Fiyat endeksi toplam getiri endeksiymiş gibi sunulmaz',()=>{
 assert.equal(run().comparableWithBenchmark,false);
 assert.equal(run({benchmarkKind:'total_return'}).comparableWithBenchmark,true);
});
test('Bölünme ve temettü girişleri denetlenir',()=>{
 assert.throws(()=>run({actions:[{date:days[2],symbol:'AAA',type:'split',ratio:0}]}),/Geçersiz split/);
 assert.throws(()=>run({actions:[{date:days[2],symbol:'ZZZ',type:'dividend',amountPerShare:3}]}),/Geçersiz sermaye/);
});
