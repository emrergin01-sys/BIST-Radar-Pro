/** KUKU portfolio backtest 0.3-alpha.
 * Offline, long-only, TRY raw daily closes and explicit split/dividend inputs.
 * Demo research only: no data fetch, orders, login or persistence.
 */
const iso=/^\d{4}-\d{2}-\d{2}$/;
const isDay=s=>typeof s==='string'&&iso.test(s)&&!Number.isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const check=(ok,message)=>{if(!ok)throw Error(message);};
const round=(n,d=4)=>Number(n.toFixed(d));
export function backtestPortfolio({bars,signals,actions=[],initialCash=100000,feeBps=10,slippageBps=5,benchmarkSymbol='XU100',benchmarkKind='price_only',currency='TRY'}={}){
 check(Array.isArray(bars)&&bars.length>0,'bars dizisi gerekli.');
 check(Array.isArray(signals),'signals dizisi gerekli.');
 check(Array.isArray(actions),'actions dizisi gerekli.');
 check(finite(initialCash)&&initialCash>0,'initialCash pozitif olmalı.');
 for(const [key,val] of Object.entries({feeBps,slippageBps}))check(finite(val)&&val>=0&&val<=1000,key+': 0–1000 bp arası olmalı.');
 check(['price_only','total_return'].includes(benchmarkKind),'benchmarkKind geçersiz.');
 check(currency==='TRY','Bu sürüm yalnız TRY fiyat serilerini destekler.');
 const dates=new Map(),symbols=new Set();
 for(const b of bars){
  check(b&&isDay(b.date)&&typeof b.symbol==='string'&&/^[A-Z0-9._-]{2,20}$/.test(b.symbol)&&finite(b.close)&&b.close>0,'Geçersiz fiyat gözlemi.');
  if(!dates.has(b.date))dates.set(b.date,new Map());
  check(!dates.get(b.date).has(b.symbol),'Tekrarlanan fiyat: '+b.symbol+' '+b.date);
  dates.get(b.date).set(b.symbol,b.close);symbols.add(b.symbol);
 }
 check(symbols.has(benchmarkSymbol),'Benchmark fiyatı eksik.');
 const calendar=[...dates].filter(([,row])=>row.has(benchmarkSymbol)).map(([d])=>d).sort();
 check(calendar.length>=2,'En az 2 benchmark işlem günü gerekli.');
 const calSet=new Set(calendar);
 for(const d of dates.keys())check(calSet.has(d),'Benchmark olmayan işlem günü: '+d);
 for(const day of calendar)for(const sym of symbols)check(dates.get(day)?.has(sym),'Eksik kapanış (fail closed): '+sym+' '+day);
 const aByDay=new Map(),usedAction=new Set();
 for(const a of actions){
  check(a&&isDay(a.date)&&calSet.has(a.date)&&symbols.has(a.symbol)&&a.symbol!==benchmarkSymbol,'Geçersiz sermaye işlemi: tarih/sembol.');
  check(['split','dividend'].includes(a.type),'Sermaye işlemi split/dividend olmalı.');
  const val=a.type==='split'?a.ratio:a.amountPerShare;
  check(finite(val)&&(a.type==='split'?val>0:val>=0),'Geçersiz split oranı/temettü.');
  const key=[a.date,a.symbol,a.type].join('|');
  check(!usedAction.has(key),'Yinelenen sermaye işlemi: '+key);usedAction.add(key);
  if(!aByDay.has(a.date))aByDay.set(a.date,[]);
  aByDay.get(a.date).push(a);
 }
 const signalByExecution=new Map(),excludedSignals=[],signalDates=new Set();
 for(const s of signals){
  check(s&&isDay(s.date)&&isDay(s.dataAvailableAt)&&s.targets&&typeof s.targets==='object'&&!Array.isArray(s.targets),'Sinyal: tarih, bilgi erişim tarihi ve targets gerekli.');
  check(!signalDates.has(s.date),'Aynı gün yinelenen portföy sinyali: '+s.date);signalDates.add(s.date);
  let sum=0;
  for(const [sym,w] of Object.entries(s.targets)){
   check(sym!==benchmarkSymbol&&symbols.has(sym),'Hedef sembol için fiyat yok: '+sym);
   check(finite(w)&&w>=0&&w<=1,'Hedef ağırlık 0–1 arasında olmalı.');sum+=w;
  }
  check(sum<=1+1e-9,'Toplam hedef ağırlık %100 aşamaz.');
  if(s.dataAvailableAt>s.date){excludedSignals.push({date:s.date,reason:'İleriye bakma: bilgi karar tarihinde mevcut değildi.'});continue;}
  const decisionIndex=calendar.indexOf(s.date);
  if(decisionIndex===-1){excludedSignals.push({date:s.date,reason:'Karar tarihi işlem günü değil.'});continue;}
  if(decisionIndex===calendar.length-1){excludedSignals.push({date:s.date,reason:'Karar tarihinden sonra işlem günü yok.'});continue;}
  signalByExecution.set(calendar[decisionIndex+1],s);
 }
 let cash=initialCash,spentOnCosts=0,dividends=0;const positions=new Map(),trades=[],curve=[];
 const get=sym=>positions.get(sym)||0;
 for(const day of calendar){
  const px=dates.get(day),dayActions=aByDay.get(day)||[];
  // Split before dividend on the same ex-date: dividend/share refers to post-split shares.
  for(const a of dayActions.filter(x=>x.type==='split'))positions.set(a.symbol,get(a.symbol)*a.ratio);
  for(const a of dayActions.filter(x=>x.type==='dividend')){
   const pay=get(a.symbol)*a.amountPerShare;cash+=pay;dividends+=pay;
  }
  const signal=signalByExecution.get(day);
  if(signal){
   const before=cash+[...positions].reduce((s,[sym,qty])=>s+qty*px.get(sym),0);
   const targets=signal.targets;
   for(const sym of [...positions.keys()].sort()){
    const qty=get(sym),goal=before*(targets[sym]||0)/px.get(sym);
    const sellQty=Math.min(qty,Math.max(0,Math.floor(qty-goal+1e-10)));
    if(sellQty>0){
     const gross=sellQty*px.get(sym)*(1-slippageBps/10000),fee=gross*feeBps/10000;
     cash+=gross-fee;spentOnCosts+=sellQty*px.get(sym)-gross+fee;
     positions.set(sym,qty-sellQty);
     trades.push({date:day,decisionDate:signal.date,symbol:sym,side:'SELL',shares:sellQty,executionPrice:round(gross/sellQty,8),fee:round(fee,6)});
    }
   }
   for(const sym of Object.keys(targets).sort()){
    const price=px.get(sym),desired=before*targets[sym],current=get(sym)*price;
    const execPrice=price*(1+slippageBps/10000),perShare=execPrice*(1+feeBps/10000);
    const buyQty=Math.min(Math.max(0,Math.floor((desired-current)/perShare+1e-9)),Math.max(0,Math.floor(cash/perShare+1e-9)));
    if(buyQty>0){
     const gross=buyQty*execPrice,fee=gross*feeBps/10000;
     cash-=gross+fee;spentOnCosts+=gross-buyQty*price+fee;
     positions.set(sym,get(sym)+buyQty);
     trades.push({date:day,decisionDate:signal.date,symbol:sym,side:'BUY',shares:buyQty,executionPrice:round(execPrice,8),fee:round(fee,6)});
    }
   }
  }
  check(cash>=-1e-6,'Nakit eksiye düştü: '+day);
  const equity=cash+[...positions].reduce((s,[sym,qty])=>s+qty*px.get(sym),0);
  curve.push({date:day,equity:round(equity,6),cash:round(cash,6)});
 }
 const first=curve[0],last=curve.at(-1),benchFirst=dates.get(calendar[0]).get(benchmarkSymbol),benchLast=dates.get(calendar.at(-1)).get(benchmarkSymbol);
 let peak=first.equity,maxDrawdown=0;
 for(const p of curve){peak=Math.max(peak,p.equity);maxDrawdown=Math.max(maxDrawdown,100*(1-p.equity/peak));}
 return {
  engine:'KUKU portfolio-backtest 0.3-alpha',currency,firstDate:first.date,lastDate:last.date,initialCash,
  finalEquity:last.equity,portfolioReturnPct:round(100*(last.equity/initialCash-1)),
  benchmarkSymbol,benchmarkKind,benchmarkReturnPct:round(100*(benchLast/benchFirst-1)),
  comparableWithBenchmark:benchmarkKind==='total_return',maxDrawdownPct:round(maxDrawdown),
  totalCostsTRY:round(spentOnCosts,4),dividendsCreditedTRY:round(dividends,4),
  trades,excludedSignals,curve,
  warnings:[
   'Geçmiş veri kullanıcı tarafından sağlanır; KAP, fiyat, sermaye işlemi ve veri erişilebilirlik tarihlerinin gerçekliği otomatik doğrulanmaz.',
   'Tam işlem takvimli TRY ham kapanış serileri gerekir; eksik günler ileri taşınmaz. Sinyal ertesi işlem gününün kapanışında uygulanır.',
   'Temettü ex-date tarihinde nakde yazılır; gerçek ödeme günü gecikmesi ve stopaj modellenmez.',
   'Bölünme/temettü girdisi eksikse sonuç yanıltıcıdır. Bedelli, hak kullanımı, birleşmeler ve özel durumlar desteklenmez.',
   'Kapanışta emir gerçekleşmesi ve likidite varsayımdır; emir defteri, açılış kayması, piyasa etkisi ve küsuratlı hisselerin nakde dönüşümü modellenmez.',
   'Signal dataAvailableAt kontrolü sinyal oluşturma algoritmasının gelecekteki bilgiye erişmediğini tek başına kanıtlamaz.',
   'Enflasyon, vergi, kur, nakit faiz ve gerçek kullanıcı portföyü dahil edilmez. Otomatik alım-satım yapılmaz.'
  ]
 };
}
