import test from 'node:test';import assert from 'node:assert/strict';
import {eventStudy} from '../event-study.mjs';
const data={holdBars:2,feeBps:10,slippageBps:5,bars:[{symbol:'XYZ',date:'2026-10-19',close:100},{symbol:'XYZ',date:'2026-10-20',close:110},{symbol:'XYZ',date:'2026-10-21',close:111},{symbol:'XYZ',date:'2026-10-22',close:100},{symbol:'XYZ',date:'2026-10-23',close:103}],signals:[{symbol:'XYZ',date:'2026-10-19',dataAvailableAt:'2026-10-19'}]};
test('karar gününün kapanışını kullanmadan sonraki bar ile başlar',()=>{const z=eventStudy(data);assert.equal(z.records[0].enteredAt,'2026-10-20');assert.equal(z.records[0].exitedAt,'2026-10-22');assert.ok(z.records[0].netReturnPct<0);});
test('masraf ve kayma getiriyi azaltır',()=>{const withCosts=eventStudy(data).records[0].netReturnPct;const noCosts=eventStudy({...data,feeBps:0,slippageBps:0}).records[0].netReturnPct;assert.ok(withCosts<noCosts);});
test('henüz yayınlanmamış bilgi sinyal kabul edilmez',()=>{const z=eventStudy({...data,signals:[{symbol:'XYZ',date:'2026-10-19',dataAvailableAt:'2026-10-20'}]});assert.equal(z.usedSignals,0);assert.equal(z.excluded.length,1);});
test('gelecek bar yoksa sinyal dışlanır',()=>{const z=eventStudy({...data,signals:[{symbol:'XYZ',date:'2026-10-22',dataAvailableAt:'2026-10-20'}]});assert.equal(z.usedSignals,0);});
test('birden fazla aynı günün barı reddedilir',()=>{assert.throws(()=>eventStudy({...data,bars:[...data.bars,data.bars[0]]}));});
