import test from 'node:test';
import assert from 'node:assert/strict';
import {buildResearchCase} from '../datahub/research-bridge.mjs';
const base={symbol:'ASELS',asOf:'2026-10-29',financials:{period:'2026/9',snapshotDate:'2026-10-28'},evidence:[{id:'KAP_2026_001',kind:'KAP',publishedAt:'2026-10-27',sourceUrl:'https://www.kap.org.tr/tr',title:'Finansal rapor',claim:'Rapor yayımlandı',reviewStatus:'human-reviewed'}]};
test('reviewed evidence and reporting period reach engine',()=>{const r=buildResearchCase(base);assert.equal(r.bridge.eligibleEvidence,1);assert.equal(r.bridge.reportingPeriod,'2026/9');assert.equal(r.provenance.acceptedSources.length,1)});
test('future evidence is excluded without lookahead',()=>{const r=buildResearchCase({...base,evidence:[{...base.evidence[0],publishedAt:'2026-10-30'}]});assert.equal(r.bridge.eligibleEvidence,0);assert.equal(r.bridge.excludedEvidence.length,1);});
test('unchecked evidence cannot support decision',()=>{const r=buildResearchCase({...base,evidence:[{...base.evidence[0],reviewStatus:'unchecked'}]});assert.equal(r.provenance.acceptedSources.length,0)});
test('future snapshot blocked',()=>assert.throws(()=>buildResearchCase({...base,financials:{period:'2026/9',snapshotDate:'2026-10-30'}}),/snapshot/));
test('no claim of live quote',()=>assert.match(buildResearchCase(base).bridge.quality,/canlı veri değildir/));
