/** KUKU research roles — deterministic screening, not financial advice.
 *  Input values are never fetched, authenticated or price-verified by this module.
 *  Pure functions so they can be tested independently of the interface.
 */
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const own = (o,k)=>Object.prototype.hasOwnProperty.call(o||{},k);
const finite = (v)=>typeof v==='number' && Number.isFinite(v);
const fmt = (n, suffix='') => finite(n) ? `${n.toLocaleString('tr-TR',{maximumFractionDigits:2})}${suffix}` : 'veri yok';
const isDate = s=>typeof s==='string' && ISO.test(s) && !Number.isNaN(Date.parse(s+'T00:00:00Z')) && new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const daysBetween=(a,b)=>Math.round((Date.parse(b+'T00:00:00Z')-Date.parse(a+'T00:00:00Z'))/86400000);
function role(name, observations=[], concerns=[], questions=[]){return {name,observations,concerns,questions};}
export function analyzeCase(c){
  if (!c || typeof c !== 'object') throw new Error('Araştırma girdisi JSON nesnesi olmalı.');
  if (!/^[A-Z0-9.\-]{2,15}$/.test(c.symbol||'')) throw new Error('Sembol: 2–15 büyük harf/rakam.');
  if (!isDate(c.asOf)) throw new Error('asOf: YYYY-MM-DD tarihi zorunlu.');
  if (!['nonfinancial','financial','holding'].includes(c.companyType)) throw new Error('companyType nonfinancial / financial / holding olmalı.');
  if(!Array.isArray(c.sources)) throw new Error('sources dizisi zorunlu.');
  const rejectedSources=[],acceptedSources=[];
  for(const s of c.sources){
    if (!s || !isDate(s.publishedAt) || !/^https:\/\/[^\s]+$/i.test(s.url||'')) {
      rejectedSources.push({source:s,reason:'Geçerli HTTPS URL ve yayın tarihi zorunlu'});continue;
    }
    if(s.publishedAt>c.asOf){rejectedSources.push({source:s,reason:'Gelecek tarihli kaynak: ileriye bakma hatası'});continue;}
    acceptedSources.push({title:String(s.title||s.url),url:s.url,publishedAt:s.publishedAt,daysOld:daysBetween(s.publishedAt,c.asOf),verified:false});
  }
  const f=c.financials||{},m=c.macro||{},sc=c.sector||{},t=c.technical||{},pf=c.portfolio||{};
  const units=' (kullanıcı girişi; doğrulanmadı)';
  const macro=role('Makroekonomi',[],[],[]);
  if (finite(m.inflationPct)) macro.observations.push(`Türkiye enflasyon varsayımı: ${fmt(m.inflationPct,'%')}${units}`);
  else macro.questions.push('Türkiye enflasyonu veya senaryo varsayımı nedir?');
  if (finite(m.policyRatePct))macro.observations.push(`TCMB politika faizi varsayımı: ${fmt(m.policyRatePct,'%')}${units}`);
  else macro.questions.push('Finansman maliyetini ve faizi tarihli resmî kaynaktan doğrula.');
  if(typeof m.thesis==='string' && m.thesis.trim())macro.observations.push(`Makro tez: ${m.thesis.trim()}`);
  else macro.questions.push('Makro tezi ve dünya büyümesi riskleri nasıl değişiyor?');
  if(finite(m.inflationPct)&&finite(m.policyRatePct))macro.observations.push(`Basit politika faizi - enflasyon farkı: ${fmt(m.policyRatePct-m.inflationPct,' puan')} (gerçek ex-ante reel faiz değildir)`);
  const sector=role('Sektör ve rekabet',[],[],[]);
  if(sc.name)sector.observations.push(`Sektör: ${sc.name}`); else sector.questions.push('Şirketin doğru sektör/alt sektörü?');
  if(sc.thesis)sector.observations.push(`Yapısal büyüme tezi: ${sc.thesis}`);else sector.questions.push('Talep artışı sipariş ve nakit kazanca dönüşüyor mu?');
  if(sc.risk)sector.concerns.push(`Sektörel karşı tez: ${sc.risk}`);
  const fundamental=role('Bilanço ve nakit',[],[],[]);
  const valuation=role('Değerleme ve fırsat maliyeti',[],[],[]);
  if(f.period)fundamental.observations.push(`Finansal dönem: ${f.period}`);else fundamental.questions.push('İlgili raporlama dönemini (örn. 2026/6) belirt.');
  if(c.companyType==='financial'){
    fundamental.observations.push('Finans kuruluşu: sanayi şirketi FAVÖK/net borç filtresi uygulanmaz.');
    fundamental.questions.push('Sermaye yeterliliği, aktif kalitesi, likidite ve sektöre özgü kârlılığı ayrıca kontrol et.');
  }else if(c.companyType==='holding'){
    fundamental.observations.push('Holding: iştiraklerin net aktif değeri ve holding iskontosu ayrıca hesaplanmalı.');
    fundamental.questions.push('İştirak değerlemeleri ve holding borçluluğu ayrıştırıldı mı?');
  }else{
    if(finite(f.netDebtEbitda)){
      fundamental.observations.push(`Net borç/FAVÖK: ${fmt(f.netDebtEbitda,'x')}`);
      if(f.netDebtEbitda>3)fundamental.concerns.push('Net borç/FAVÖK 3x üzerinde; finansman riski ayrı stres testini gerektirir.');
    }else fundamental.questions.push('Net borç/FAVÖK ve vade yapısı eksik.');
  }
  if(finite(f.cfo)&&finite(f.fcf)){
    fundamental.observations.push(`Faaliyet nakdi: ${fmt(f.cfo)}; serbest nakit: ${fmt(f.fcf)} (aynı raporlama birimi varsayıldı)`);
    if(f.cfo<=0)fundamental.concerns.push('Faaliyet nakit akışı pozitif değil.');
    if(f.fcf<0)fundamental.concerns.push('Serbest nakit akışı negatif; tanımı ve yatırım harcamaları kontrol edilmeli.');
    if(f.cfo>0&&f.fcf>0)fundamental.observations.push('İki nakit akışı göstergesi pozitif; sürdürülebilirlik ve tanım yine teyit edilmeli.');
  } else fundamental.questions.push('Faaliyet nakdi ve sermaye harcaması ayrımı eksik.');
  if(finite(f.salesGrowthPct)){
    fundamental.observations.push(`Satış büyümesi: ${fmt(f.salesGrowthPct,'%')}`);
    if(f.salesGrowthPct<0)fundamental.concerns.push('Satış büyümesi negatif; fiyat/enflasyon ve hacim ayrıştırılmalı.');
  }else fundamental.questions.push('Nominal ve reel satış büyümesi eksik.');
  if(finite(f.roicPct))fundamental.observations.push(`ROIC: ${fmt(f.roicPct,'%')}`);
  else fundamental.questions.push('ROIC / sektör için uygun sermaye getirisi eksik.');
  if(finite(f.pe)&&f.pe>0)valuation.observations.push(`F/K: ${fmt(f.pe,'x')}; tek başına ucuzluk sinyali değildir.`);
  else valuation.questions.push('Karın sürdürülebilirliği ve geçerli F/K yok.');
  if(finite(f.pb)&&f.pb>0)valuation.observations.push(`PD/DD: ${fmt(f.pb,'x')}`);
  if(finite(f.evEbitda)&&f.evEbitda>0&&c.companyType==='nonfinancial')valuation.observations.push(`FD/FAVÖK: ${fmt(f.evEbitda,'x')}`);
  valuation.questions.push('Tarihsel çarpan, benzer şirketler, ileri dönem tahmini ve güvenlik marjı karşılaştırılmalı.');
  const technical=role('Fiyat, hacim ve takas',[],[],[]);
  if(finite(t.return3mPct)){
    technical.observations.push(`Son 3 ay getiri: ${fmt(t.return3mPct,'%')} (kaynak veri dönemi kontrol edilmeli)`);
    if(t.return3mPct<=-25)technical.concerns.push('Üç aylık büyük düşüş; hacim, likidite ve olası şirket olayı incelenmeli.');
  } else technical.questions.push('Tarihli fiyat ve hacim serisi eksik.');
  if(t.takasNote)technical.observations.push(`Takas gözlemi: ${String(t.takasNote)} — kurum saklaması gerçek yatırımcıyı kesin göstermez.`);
  else technical.questions.push('Takas lisansı yoksa yalnız mevcut doğrulanabilen fiyat/hacim analiz edilir.');
  const risk=role('Karşıt tez ve portföy',[],[],[]);
  if(pf.existingSectorExposure)risk.observations.push(`Mevcut portföyde benzer maruziyet: ${String(pf.existingSectorExposure)}`);
  else risk.questions.push('Portföyün sektör/fon ortak pozisyonları ve güncel ağırlıkları eksik.');
  risk.concerns.push(...fundamental.concerns,...technical.concerns);
  if(sc.risk)risk.concerns.push(`Sektör karşı senaryosu: ${sc.risk}`);
  if(c.counterThesis)risk.concerns.push(`Analistin yazdığı karşı tez: ${c.counterThesis}`);
  else risk.questions.push('Olumsuz senaryonun birincil kaynağı ve tez bozucu tetikleyicisi nedir?');
  if(rejectedSources.length)risk.concerns.push(`${rejectedSources.length} kaynak tarihi veya bağlantısı nedeniyle değerlendirme dışında bırakıldı.`);
  if(!acceptedSources.length)risk.concerns.push('Karar tarihine uygun ve formatça geçerli tarihli birincil kaynak sağlanmadı.');
  if(acceptedSources.some(s=>s.daysOld>365))risk.concerns.push('En az bir kaynak bir yıldan eski; yeni raporla kontrol et.');
  const evidencePoints=[!!f.period,finite(f.cfo),finite(f.fcf),finite(f.salesGrowthPct),finite(f.pe)||finite(f.pb),!!sc.name,!!sc.thesis,!!m.thesis,acceptedSources.length>0];
  const coverage=Number((evidencePoints.filter(Boolean).length/evidencePoints.length*100).toFixed(0));
  let decision='Araştırma bekliyor';
  if(!acceptedSources.length||coverage<55)decision='Veri tamamla — işlem kararı üretme';
  else if(risk.concerns.some(x=>/net borç|pozitif değil|negatif|büyük düşüş/i.test(x))) decision='Risk incele — azalt/çık senaryosunu karşılaştır';
  else decision='İzle — alternatifleri ve değerlemeyi karşılaştır';
  return {
    symbol:c.symbol,asOf:c.asOf,companyType:c.companyType,
    provenance:{acceptedSources,rejectedSources,sourceVerification:'Bağlantılar biçimsel ve tarihsel kontrolden geçti; içerik dış kaynakla otomatik karşılaştırılmadı.'},
    coveragePct:coverage,decision,roles:[macro,sector,fundamental,valuation,technical,risk],
    nextSteps:[...new Set([...macro.questions,...sector.questions,...fundamental.questions,...valuation.questions,...technical.questions,...risk.questions])],
    warnings:['Bu rapor bağımsız rol bazlı kontrol listesi; gerçek çoklu LLM-ajan sistemi değildir.','Hisse fiyatı ve tüm girdi değerleri dış kaynaklardan otomatik doğrulanmaz.','Yatırım emri/satış işlemi yapılmaz; yatırım kararı kullanıcıya aittir.']
  };
}
