import test from 'node:test';
import assert from 'node:assert/strict';
import {parseTcmbXml,publicSourceRegistry} from '../datahub/official-feed.mjs';
const xml='<Tarih_Date Tarih="29.10.2026"><Currency Kod="USD"><ForexBuying>49.20</ForexBuying><ForexSelling>49.30</ForexSelling></Currency><Currency Kod="EUR"><ForexBuying>55.1</ForexBuying><ForexSelling>55.2</ForexSelling></Currency></Tarih_Date>';
test('parse dated official quote and do not claim live price',()=>{const x=parseTcmbXml(xml,{fetchedAt:'2026-10-29T06:30:00Z'});assert.equal(x.asOf,'2026-10-29');assert.equal(x.quotes[0].sell,49.3);assert.equal(x.live,false)});
test('reject missing source date',()=>assert.throws(()=>parseTcmbXml('<Tarih_Date></Tarih_Date>'),/tarihi/));
test('reject missing quotes',()=>assert.throws(()=>parseTcmbXml('<Tarih_Date Tarih="29.10.2026"></Tarih_Date>'),/bulunamadı/));
test('licensing boundary documented',()=>assert.equal(publicSourceRegistry.find(x=>x.name==='KAP').requiresLicenseForApi,true));
