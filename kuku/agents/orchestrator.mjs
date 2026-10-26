import {ROLES,REPORT_KEYS,DECISIONS} from './roles.mjs';
const dateOk=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const validURL=s=>typeof s==='string'&&/^https:\/\/[^\s/]+\.[^\s/]+(?:\/[^\s]*)?$/.test(s);
const clean=s=>typeof s==='string'&&s.length>0&&s.length<=5000;
export function validateCase(c,{live=false}={}){
 if(!c||typeof c!=='object'||Array.isArray(c))throw Error('Vaka JSON nesnesi olmalı');
 if(!/^[A-Z0-9.\-]{2,15}$/.test(c.symbol||''))throw Error('Sembol geçersiz');
 if(!dateOk(c.asOf))throw Error('asOf tarihi geçersiz');
 if(!['nonfinancial','financial','holding'].includes(c.companyType))throw Error('Şirket türü geçersiz');
 if(!Array.isArray(c.sources)||!c.sources.length)throw Error('Kaynak listesi boş');
 if(c.sources.length>50)throw Error('Tek vakada en çok 50 kaynak');
 const ids=new Set();let reviewed=0;
 for(const s of c.sources){
  if(!s||!/^[-A-Z0-9_]{4,80}$/.test(s.id||'')||ids.has(s.id))throw Error('Kaynak ID geçersiz/tekrarlı');
  ids.add(s.id);
  if(!validURL(s.url)||!dateOk(s.publishedAt)||!clean(s.claim))throw Error('Kaynak URL/tarih/olgu eksik');
  if(s.publishedAt>c.asOf)throw Error('Gelecek tarihli kaynak analize alınamaz');
  if(!['unchecked','human-reviewed','cross-checked'].includes(s.reviewStatus))throw Error('reviewStatus geçersiz');
  if(s.reviewStatus!=='unchecked')reviewed++;
 }
 if(live&&reviewed===0)throw Error('Gerçek AI çağrısında en az bir kaynak önce insan tarafından incelenmiş olmalı');
 // Inputs are only data; verification labels are user attestations, not an independent web check.
 return {ids,reviewed};
}
export function validateReport(raw,role,allowedIds){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error(role+' raporu JSON nesnesi değil');
 if(Object.keys(raw).some(k=>!REPORT_KEYS.has(k)))throw Error(role+' beklenmedik rapor alanı');
 if([...REPORT_KEYS].some(k=>!Object.hasOwn(raw,k)))throw Error(role+' eksik rapor alanı');
 if(!clean(raw.summary)||!['positive','mixed','negative','insufficient'].includes(raw.stance)||!DECISIONS.has(raw.recommendation))throw Error(role+' hatalı görüş');
 for(const key of ['findings','risks','questions','evidenceIds']){
  if(!Array.isArray(raw[key])||raw[key].length>20)throw Error(role+' '+key+' hatalı');
  if(raw[key].some(x=>typeof x!=='string'||x.length>1000))throw Error(role+' '+key+' içerik hatası');
 }
 if(raw.evidenceIds.some(id=>!allowedIds.has(id)))throw Error(role+' olmayan/kaynak dışı ID uydurdu');
 if(role!=='portfolio'&&raw.recommendation!=='not_applicable')throw Error('Araştırma ajanı işlem yönü belirleyemez');
 if(role==='portfolio'&&raw.recommendation!=='insufficient_evidence'&&raw.evidenceIds.length===0)throw Error('Kaynak gösterilmeden yatırım görüşü olmaz');
 return structuredClone(raw);
}
export function mockAgent(role,payload){
 const ids=payload.caseData.sources.filter(x=>x.reviewStatus!=='unchecked').map(s=>s.id).slice(0,2);
 return {summary:`${role.name}: Test modu; burada gerçek model yorumu üretilmedi.`,findings:[],risks:['Yalnızca örnek iş akışı. Şirket hakkında fiilî yatırım kararı verilemez.'],questions:['Güncel KAP ve karşılaştırılabilir finansallar doğrulandı mı?'],evidenceIds:ids,stance:'insufficient',recommendation:role.id==='portfolio'?'insufficient_evidence':'not_applicable'};
}
const safeCase=c=>({symbol:c.symbol,asOf:c.asOf,companyType:c.companyType,sources:c.sources.map(s=>({id:s.id,url:s.url,publishedAt:s.publishedAt,claim:s.claim,reviewStatus:s.reviewStatus})),financials:c.financials||{},macro:c.macro||{},sector:c.sector||{},market:c.market||{},portfolio:c.portfolio||{}});
export async function orchestrateCase(c,{runAgent=mockAgent,mode='demo',modelName='none'}={}){
 const live=mode==='live';if(!['demo','live'].includes(mode))throw Error('Geçersiz yürütme modu');
 const {ids,reviewed}=validateCase(c,{live});
 if(typeof runAgent!=='function')throw Error('runAgent fonksiyonu zorunlu');
 const data=safeCase(c);const timeline=[];const outputs={};
 const first=ROLES.slice(0,4);
 const initial=await Promise.all(first.map(async r=>({role:r.id,result:validateReport(await runAgent(r,{caseData:structuredClone(data),prior:{} }),r.id,ids)})));
 for(const o of initial){outputs[o.role]=o.result;timeline.push({step:timeline.length+1,role:o.role})}
 for(const r of ROLES.slice(4)){
  const prior=structuredClone(outputs);
  const raw=await runAgent(r,{caseData:structuredClone(data),prior});
  outputs[r.id]=validateReport(raw,r.id,ids);
  timeline.push({step:timeline.length+1,role:r.id});
 }
 // Traceability: a non-trivial portfolio proposal must cite a source from this case.
 const decision=outputs.portfolio.recommendation;
 return {schemaVersion:'kuku.agents.v0.3',symbol:c.symbol,asOf:c.asOf,mode,modelName,sourceCount:c.sources.length,reviewedSourceCount:reviewed,timeline,agents:outputs,decision,limitations:['Kaynak inceleme işareti içerik doğrulamasının otomatik yapıldığı anlamına gelmez.','AI görüşleri analizdir, gerçekleşmiş işlem veya garanti getiri değildir.','Portföy verileri yalnız açıkça sağlanan vakadan okunmuştur; hesaplara otomatik erişim yok.']};
}
