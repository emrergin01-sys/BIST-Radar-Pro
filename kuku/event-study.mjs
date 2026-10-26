/** Educational, deterministic signal event study — NOT a portfolio backtest.
 * One bar execution delay; point-in-time information cutoff; explicit fees/slippage.
 * Bars/signal arrays must be real, dated, licensed/appropriately used data.
 */
const iso = /^\d{4}-\d{2}-\d{2}$/;
function date(d){return typeof d==='string'&&iso.test(d)&&!Number.isNaN(Date.parse(d+'T00:00:00Z'))&&new Date(d+'T00:00:00Z').toISOString().slice(0,10)===d;}
function numeric(v){return typeof v==='number'&&Number.isFinite(v);}
export function eventStudy({bars,signals,holdBars=5,feeBps=10,slippageBps=5,benchmarkSymbol='XU100'}){
 if(!Array.isArray(bars)||!Array.isArray(signals))throw Error('bars ve signals dizileri gerekli.');
 if(!Number.isInteger(holdBars)||holdBars<1||holdBars>250)throw Error('holdBars 1–250 arasında tam sayı.');
 for(const [k,v] of Object.entries({feeBps,slippageBps}))if(!numeric(v)||v<0||v>1000)throw Error(`${k}: geçersiz.`);
 const group=new Map();
 for(const b of bars){if(!b||!date(b.date)||!numeric(b.close)||b.close<=0||typeof b.symbol!=='string')throw Error('Hatalı bar: tarih, sembol, pozitif kapanış gerekli.');
  if(!group.has(b.symbol))group.set(b.symbol,[]);group.get(b.symbol).push(b);
 }
 for(const [k,list] of group){list.sort((a,b)=>a.date.localeCompare(b.date));for(let i=1;i<list.length;i++)if(list[i].date===list[i-1].date)throw Error(`${k}: yinelenen tarih ${list[i].date}`);}
 const records=[],excluded=[];
 for(const s of signals){
  if(!s||!date(s.date)||typeof s.symbol!=='string'||!date(s.dataAvailableAt))throw Error('Sinyal: date, symbol, dataAvailableAt zorunludur.');
  if(s.dataAvailableAt>s.date){excluded.push({signal:s,reason:'İleriye bakma: bilgi karar gününde mevcut değildi.'});continue;}
  const rows=group.get(s.symbol)||[];const entryIndex=rows.findIndex(b=>b.date>s.date);
  if(entryIndex<0 || entryIndex+holdBars>=rows.length){excluded.push({signal:s,reason:'İşlem sonrası yeterli gözlem yok.'});continue;}
  const entry=rows[entryIndex], exit=rows[entryIndex+holdBars];
  const buy=entry.close*(1+slippageBps/10000),sell=exit.close*(1-slippageBps/10000);
  const returnPct=(((sell*(1-feeBps/10000))/(buy*(1+feeBps/10000)))-1)*100;
  let benchmarkPct=null;
  const benchmark=group.get(benchmarkSymbol)||[];
  const bi=benchmark.find(b=>b.date===entry.date),bo=benchmark.find(b=>b.date===exit.date);
  if(bi&&bo)benchmarkPct=((bo.close/bi.close)-1)*100;
  records.push({symbol:s.symbol,signalDate:s.date,enteredAt:entry.date,exitedAt:exit.date,entryClose:entry.close,exitClose:exit.close,netReturnPct:Number(returnPct.toFixed(4)),benchmarkReturnPct:benchmarkPct===null?null:Number(benchmarkPct.toFixed(4))});
 }
 const avg=k=>records.length?Number((records.reduce((a,r)=>a+r[k],0)/records.length).toFixed(3)):null;
 return {method:'Sinyal olay çalışması. Sermaye/pozisyon büyüklüğü, çakışan işlemler ve portföy riskleri hesaplanmaz.',holdBars,feeBps,slippageBps,usedSignals:records.length,excluded,meanNetReturnPct:avg('netReturnPct'),winRatePct:records.length?Number((100*records.filter(r=>r.netReturnPct>0).length/records.length).toFixed(2)):null,records};
}
