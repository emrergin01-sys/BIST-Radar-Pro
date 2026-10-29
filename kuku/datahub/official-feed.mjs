/** KUKU official public macro ingestion. TCMB indicative FX XML; never invent missing quotes. */
const TCMB='https://www.tcmb.gov.tr/kurlar/today.xml';
export function parseTcmbXml(xml,{fetchedAt=new Date().toISOString()}={}){
 if(typeof xml!=='string'||!xml.includes('<Tarih_Date'))throw Error('TCMB XML biçimi tanınmadı');
 const day=xml.match(/\bTarih="(\d{2}\.\d{2}\.\d{4})"/)?.[1];
 if(!day)throw Error('TCMB veri tarihi yok');
 const [dd,mm,yyyy]=day.split('.');
 const asOf=`${yyyy}-${mm}-${dd}`;
 const quotes=[];
 for(const match of xml.matchAll(/<Currency\b([^>]*)>([\s\S]*?)<\/Currency>/g)){
  const code=match[1].match(/Kod="([A-Z]{3})"/)?.[1];if(!['USD','EUR','GBP'].includes(code))continue;
  const body=match[2];
  const val=(tag)=>{let m=body.match(new RegExp('<'+tag+'>([0-9.]+)<\\/'+tag+'>'));return m?Number(m[1]):null};
  const buy=val('ForexBuying'),sell=val('ForexSelling');
  if(buy===null||sell===null||!Number.isFinite(buy)||!Number.isFinite(sell)||sell<buy)continue;
  quotes.push({code,buy,sell,unit:'TRY',date:asOf});
 }
 if(!quotes.length)throw Error('TCMB döviz kurları bulunamadı');
 return {schema:'kuku.official-fx.v1',source:TCMB,sourceType:'TCMB',asOf,fetchedAt,quotes,live:false,warning:'Gösterge kurlarıdır; alış/satış işlem kotasyonu değildir.'};
}
export async function fetchTcmb({fetchImpl=fetch,now=new Date()}={}){
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),15000);
 try{const r=await fetchImpl(TCMB,{headers:{'Accept':'application/xml,text/xml'},signal:controller.signal});if(!r.ok)throw Error('TCMB HTTP '+r.status);
 return parseTcmbXml(await r.text(),{fetchedAt:now.toISOString()});}finally{clearTimeout(timeout)}
}
export const publicSourceRegistry=Object.freeze([
 {name:'KAP',url:'https://www.kap.org.tr/tr/',purpose:'Finansallar ve özel durum açıklamaları',automated:false,requiresLicenseForApi:true},
 {name:'SPK',url:'https://spk.gov.tr/kurumlar/fonlar/yatirim-fonlari/menkul-kiymet-yatirim-fonlari/portfoy-degerleri',purpose:'Fon portföy verisi erişim rehberi',automated:false},
 {name:'TEFAS',url:'https://www.tefas.gov.tr/',purpose:'Fon birim fiyatları',automated:false},
 {name:'TCMB',url:TCMB,purpose:'Tarihli gösterge döviz kurları',automated:true}
]);
