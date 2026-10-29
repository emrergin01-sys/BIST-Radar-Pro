/** Date-safe bridge: reviewed source metadata + snapshot metrics -> research engine.
 * Does not fetch data or attest linked claims. No order execution.
 */
import {validateEvidence} from './evidence.mjs';
import {analyzeCase} from '../engine.mjs';
const ISO=/^\d{4}-\d{2}-\d{2}$/;
const date=s=>typeof s==='string'&&ISO.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
export function buildResearchCase({symbol,asOf,companyType='nonfinancial',financials={},sector={},macro={},technical={},portfolio={},evidence=[]}){
 if(!date(asOf))throw Error('Geçerli analiz tarihi gerekli');
 if(!Array.isArray(evidence))throw Error('Evidence listesi gerekli');
 const sources=[],excluded=[];
 for(const e of evidence){
   const result=validateEvidence(e,{asOf});
   if(!result.valid){excluded.push({id:e.id,reason:result.reason});continue;}
   if(e.reviewStatus!=='human-reviewed'&&e.reviewStatus!=='cross-checked'){
     excluded.push({id:e.id,reason:'İçerik inceleme teyidi yok'});continue;
   }
   sources.push({title:e.title,url:e.sourceUrl,publishedAt:e.publishedAt});
 }
 const snapshot=financials.snapshotDate;
 const period=financials.period;
 if(snapshot!==undefined&&(!date(snapshot)||snapshot>asOf))throw Error('Finansal snapshot analiz tarihinden sonra olamaz');
 if(period!==undefined&&!/^\d{4}\/(?:3|6|9|12)$/.test(period))throw Error('Finansal dönem geçersiz');
 const {snapshotDate,...metrics}=financials;
 const output=analyzeCase({symbol,asOf,companyType,sources,financials:metrics,sector,macro,technical,portfolio});
 return {...output,bridge:{version:'0.3',snapshotDate:snapshot||null,reportingPeriod:period||null,eligibleEvidence:sources.length,excludedEvidence:excluded,quality:'Kaynak içeriğinin doğruluğu yalnızca ayrıca yapılan insan incelemesine dayanır; doğrulanmış canlı veri değildir.'}};
}
