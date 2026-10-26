/** KUKU v0.2 — local, date-aware snapshot importer. No network or remote storage. */
const iso = /^\d{4}-\d{2}-\d{2}$/;
export function validDate(s) { return typeof s === 'string' && iso.test(s) && !Number.isNaN(Date.parse(s+'T00:00:00Z')) && new Date(s+'T00:00:00Z').toISOString().slice(0,10) === s; }
export function readCsv(text, delimiter=',') {
  if(typeof text!=='string'||!text.trim()) throw Error('Boş CSV metni');
  if(![',',';','\t'].includes(delimiter)) throw Error('Geçersiz ayraç');
  const out=[]; let row=[],field='',quoted=false;
  const input=text.replace(/^\uFEFF/,'');
  for(let i=0;i<input.length;i++){
    const c=input[i];
    if(c==='"') {
      if(quoted && input[i+1]==='"'){field+='"';i++;} else quoted=!quoted;
    } else if(c===delimiter&&!quoted){row.push(field);field='';}
    else if((c==='\n'||c==='\r')&&!quoted){
      if(c==='\r'&&input[i+1]==='\n') i++;
      row.push(field);field='';if(row.some(x=>x.trim()!==''))out.push(row);row=[];
    } else field+=c;
  }
  if(quoted)throw Error('Kapanmamış CSV tırnağı');
  row.push(field);if(row.some(x=>x.trim()!==''))out.push(row);
  if(!out.length)throw Error('CSV satırı yok');
  const header=out.shift().map(s=>s.trim());
  if(new Set(header).size!==header.length)throw Error('Yinelenen CSV sütun adı');
  return {header,rows:out.map((cells,i)=>{
    if(cells.length!==header.length)throw Error(`CSV satır ${i+2}: beklenen ${header.length}, gelen ${cells.length}`);
    return Object.fromEntries(header.map((h,j)=>[h,cells[j].trim()]));
  })};
}
export function asNumber(v){
  if(v===null||v===undefined||String(v).trim()==='')return null;
  const raw=String(v).trim().replace(/[\s\u00A0]/g,'').replace(/%$/,'');
  if(/^(?:NA|N\/A|nan|null|-)$/i.test(raw))return null;
  let str=raw;
  if(str.includes(',')&&str.includes('.')) {str=str.lastIndexOf(',')>str.lastIndexOf('.')?str.replaceAll('.','').replace(',','.'):str.replaceAll(',','');}
  else if(str.includes(','))str=str.replace(',','.');
  const n=Number(str);return Number.isFinite(n)?n:null;
}
const aliases={
  marketCap:['Piyasa Değeri','marketCap'],enterpriseValue:['Firma Değeri','enterpriseValue'],pe:['F/K','pe'],pb:['PD/DD','pb'],evSales:['FD/Satış','evSales'],evEbitda:['FD/FAVÖK','evEbitda'],peg:['PEG','peg'],
  grossMarginPct:['Brüt Kar Marjı','grossMarginPct'],ebitdaMarginPct:['FAVÖK Marjı','ebitdaMarginPct'],roePct:['Özkaynak Karlılığı','roePct'],roicPct:['ROIC','roicPct'],netDebt:['Net Borç','netDebt'],netDebtEbitda:['Net Borç/FAVÖK','netDebtEbitda'],
  salesGrowthPct:['Satışlar Dğş %','salesGrowthPct'],ebitdaGrowthPct:['FAVÖK Dğş %','ebitdaGrowthPct'],cfo:['İşletme Faaliyetlerinden Nakit Akışları','cfo'],legacyFcf:['Serbest Nakit Akışı','legacyFcf'],
  lastPrice:['Fiyat','lastPrice'],return3mPct:['Getiri % (Son 3 ay)','return3mPct']
};
const SYMBOL_HEADERS=['Sembol','Şirket','symbol','Ticker'];
const percentageMetrics=new Set(['grossMarginPct','ebitdaMarginPct','roePct','roicPct','salesGrowthPct','ebitdaGrowthPct','return3mPct']);
function inferredScale(column,rows){
 const vals=rows.map(row=>asNumber(row[column])).filter(v=>v!==null).map(Math.abs).sort((a,b)=>a-b);
 if(vals.length<10)return 'uncertain';
 const q=vals[Math.floor(vals.length*0.75)];
 if(q>=3)return 'percent-points';
 if(q<=1)return 'fraction';
 return 'uncertain';
}
export function importSnapshot(csvText, metadata={}){
  const {snapshotDate,sourceUrl,sourceName,filename,reportPeriod='mixed',classification='fintables-screening',delimiter=',',scaleByMetric={}}=metadata;
  if(!validDate(snapshotDate))throw Error('snapshotDate YYYY-AA-GG zorunlu');
  if(!/^https:\/\//.test(sourceUrl||''))throw Error('Kaynak HTTPS bağlantısı zorunlu');
  if(typeof sourceName!=='string'||!sourceName.trim())throw Error('Kaynak adı zorunlu');
  if(!['fintables-screening','kap-financial','tefas-export','official-public','other'].includes(classification))throw Error('Geçersiz kaynak sınıfı');
  const {header,rows}=readCsv(csvText,delimiter);
  const symbolColumn=SYMBOL_HEADERS.find(x=>header.includes(x));
  if(!symbolColumn)throw Error('Sembol / Şirket sütunu bulunamadı');
  const columns=Object.fromEntries(Object.entries(aliases).map(([key,variants])=>[key,variants.find(x=>header.includes(x))||null]));
  const scales={};for(const [m,col] of Object.entries(columns))if(col&&percentageMetrics.has(m)){
    const override=scaleByMetric[m];
    if(override && !['percent-points','fraction'].includes(override))throw Error('Yüzde ölçeği hatalı: '+m);
    scales[m]=override||inferredScale(col,rows);
  }
  const duplicate=[];const seen=new Set();const records=[];const rejected=[];
  for(const [i,row] of rows.entries()){
    const symbol=(row[symbolColumn]||'').toUpperCase().trim();
    if(!/^[A-Z0-9.\-]{2,15}$/.test(symbol)){rejected.push({line:i+2,reason:'Sembol geçersiz'});continue;}
    if(seen.has(symbol)){duplicate.push(symbol);continue;}
    seen.add(symbol);
    const metrics={};for(const [metric,column] of Object.entries(columns))if(column){
      let v=asNumber(row[column]);
      if(v!==null && scales[metric]==='fraction')v*=100;
      metrics[metric]=v;
    }
    records.push({symbol,metrics});
  }
  if(duplicate.length)throw Error(`Mükerrer semboller: ${duplicate.slice(0,8).join(', ')}`);
  return {schemaVersion:'kuku.snapshot.v0.2',metadata:{snapshotDate,sourceUrl,sourceName,filename:String(filename||''),reportPeriod,classification,scaleByMetric:scales,ambiguousScaleMetrics:Object.keys(scales).filter(x=>scales[x]==='uncertain'),contentVerified:false,sourceAvailableAt:snapshotDate,units:'Kaynak dosyanın orijinal birimleri; karşılaştırmadan önce eşleştir',provenanceNote:'Kaynak bağlantısı biçim kontrol edildi, içerik otomatik doğrulanmadı. Snapshot tarihi rapor dönemi değildir.'},availableMetrics:Object.entries(columns).filter(x=>x[1]).map(x=>x[0]),count:records.length,records,rejected};
}
export function compareSnapshots(a,b,{metrics,asOf}={}){
  if(a?.schemaVersion!=='kuku.snapshot.v0.2'||b?.schemaVersion!=='kuku.snapshot.v0.2')throw Error('KUKU v0.2 snapshot gereklidir');
  const ma=a.metadata,mb=b.metadata;
  if(!validDate(ma.snapshotDate)||!validDate(mb.snapshotDate)||ma.snapshotDate>mb.snapshotDate)throw Error('Tarih sırası geçersiz');
  if(asOf && (!validDate(asOf)||ma.snapshotDate>asOf||mb.snapshotDate>asOf))throw Error('Karar tarihinde bulunmayan görüntü kullanılamaz');
  if(ma.classification!==mb.classification)throw Error('Farklı veri sınıfları aynı bazda kıyaslanamaz');
  if(ma.reportPeriod!==mb.reportPeriod)throw Error('Farklı finansal raporlama dönemleri kıyaslanamaz');
  const shared=a.availableMetrics.filter(x=>b.availableMetrics.includes(x));
  const requested=metrics?.length?metrics:shared;
  if(requested.some(m=>!shared.includes(m)))throw Error('İstenen metrik her iki görüntüde de yok');
  const prev=new Map(a.records.map(x=>[x.symbol,x.metrics]));const current=new Map(b.records.map(x=>[x.symbol,x.metrics]));
  const symbols=[...new Set([...prev.keys(),...current.keys()])].sort();
  const changes=[];
  for(const symbol of symbols){const x=prev.get(symbol),y=current.get(symbol);if(!x||!y)continue;
    const deltas={};for(const m of requested){const oldVal=x[m],newVal=y[m];deltas[m]=oldVal===null||newVal===null||!Number.isFinite(oldVal)||!Number.isFinite(newVal)?null:{old:oldVal,current:newVal,absolute:newVal-oldVal,percent:oldVal===0?null:(newVal/oldVal-1)*100};}
    changes.push({symbol,deltas});
  }
  return {schemaVersion:'kuku.comparison.v0.2',oldDate:ma.snapshotDate,newDate:mb.snapshotDate,metrics:requested,recordCount:changes.length,oldOnly:[...prev.keys()].filter(x=>!current.has(x)).sort(),newOnly:[...current.keys()].filter(x=>!prev.has(x)).sort(),warnings:['Yüzde alanları dosya düzeyindeki ölçeğe göre yüzde puanına normalleştirilir; belirsiz ölçek varsa kontrol et.','Veri tarihi bilanço dönemi değildir.','Fintables oranları fiyat hareketi nedeniyle değişebilir; bilanço performansı çıkarımı değildir.','Yüzde değişim negatif veya sıfır bazlı oranlarda ekonomik anlam taşımayabilir.','Serbest nakit akışı sütunu CAPEX ayrıştırılmadan kalite ölçüsü sayılmamalı.'],changes};
}
export function topMoves(comparison,metric,limit=10){
  return comparison.changes.filter(x=>x.deltas[metric]?.percent!==null && Number.isFinite(x.deltas[metric]?.percent)).sort((a,b)=>Math.abs(b.deltas[metric].percent)-Math.abs(a.deltas[metric].percent)).slice(0,limit);
}
