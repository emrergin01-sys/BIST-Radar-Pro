/** Curated evidence ledger: verifies metadata shape/time ordering, NEVER contents of linked page. */
import {validDate} from './snapshots.mjs';
const kinds=new Set(['KAP','SPK','TEFAS','TCMB','TUIK','IMF','IEA','COMPANY','OTHER']);
export function validateEvidence(item,{asOf}={}){
 if(!item||typeof item!=='object')throw Error('Kaynak nesnesi gerekli');
 const {id,kind,publishedAt,sourceUrl,symbol,title,claim,reviewStatus='unchecked'}=item;
 if(typeof id!=='string'||!/^[-A-Z0-9_]{5,80}$/.test(id))throw Error('Kayıt ID gerekli');
 if(!kinds.has(kind))throw Error('Kaynak türü geçersiz');
 if(!validDate(publishedAt))throw Error('Yayın tarihi geçersiz');
 if(!/^https:\/\/(?:[^\s/]+)(?:\/[^\s]*)?$/.test(sourceUrl||''))throw Error('Geçerli HTTPS kaynak linki gerekli');
 if(typeof title!=='string'||!title.trim()||typeof claim!=='string'||!claim.trim())throw Error('Başlık ve içerik özeti gerekli');
 if(symbol!==undefined && !/^[A-Z0-9.\-]{2,15}$/.test(symbol))throw Error('Sembol geçersiz');
 if(!['unchecked','human-reviewed','cross-checked'].includes(reviewStatus))throw Error('Onay durumu geçersiz');
 if(asOf && (!validDate(asOf)||publishedAt>asOf))return {valid:false,reason:'Bilgi analiz tarihinde yayımlanmamıştı',item};
 return {valid:true,metadataComplete:true,contentVerified:false,reviewStatus,item};
}
export function buildLedger(items,{asOf}={}){
 if(!Array.isArray(items))throw Error('Kayıt listesi zorunlu');const seen=new Set();const accepted=[],excluded=[];
 for(const item of items){const r=validateEvidence(item,{asOf});if(seen.has(item.id))throw Error('Mükerrer kayıt ID: '+item.id);seen.add(item.id);(r.valid?accepted:excluded).push(r);}
 return {schemaVersion:'kuku.evidence.v0.2',asOf:asOf||null,accepted,excluded,disclaimer:'URL ve tarih biçimi denetlenir; kaynak sayfa içeriği ve iddia doğruluğu otomatik teyit edilmez.'};
}
