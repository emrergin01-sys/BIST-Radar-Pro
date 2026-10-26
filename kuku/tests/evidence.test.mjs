import test from 'node:test';import assert from 'node:assert/strict';import {validateEvidence,buildLedger} from '../datahub/evidence.mjs';
const item={id:'KAP_1686813',kind:'KAP',publishedAt:'2026-10-23',sourceUrl:'https://www.kap.org.tr/tr/Bildirim/1686813',symbol:'CWENE',title:'Pay satış başvurusu',claim:'Satış başvurusu; gerçekleşmiş satış değil.'};
test('evidence metadata valid but content not automatically verified',()=>{const r=validateEvidence(item);assert.equal(r.valid,true);assert.equal(r.contentVerified,false);});
test('future evidence excluded',()=>{const r=buildLedger([item],{asOf:'2026-10-22'});assert.equal(r.excluded.length,1);assert.equal(r.accepted.length,0);});
test('missing source URL rejected',()=>{assert.throws(()=>validateEvidence({...item,sourceUrl:''}));});
test('duplicate evidence ID not permitted',()=>{assert.throws(()=>buildLedger([item,item]));});
