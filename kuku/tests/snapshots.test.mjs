import test from 'node:test';import assert from 'node:assert/strict';
import {readCsv,asNumber,importSnapshot,compareSnapshots,topMoves} from '../datahub/snapshots.mjs';
const meta={snapshotDate:'2026-10-17',sourceUrl:'https://drive.google.com/file/d/demo',sourceName:'Fintables (özel arşiv)',filename:'test.csv'};
const csv='Sembol,F/K,PD/DD\nCWENE,18,2.0\nASTOR,15,1.5\nTUPRS,10,1.7';
const prev=importSnapshot(csv,meta);
const curr=importSnapshot('Sembol,F/K,PD/DD\nCWENE,9,1.8\nASTOR,15,1.5\nTUPRS,11,1.9',{...meta,snapshotDate:'2026-10-25'});
test('CSV BOM, quoted comma and CRLF',()=>{const z=readCsv('\uFEFFSembol,Ad\r\nCWENE,"A, B"\r\n');assert.equal(z.rows[0].Ad,'A, B');});
test('non-numeric is missing not zero',()=>{assert.equal(asNumber(''),null);assert.equal(asNumber('nan'),null);assert.equal(asNumber('1.234,56'),1234.56);});
test('real Fintables header aliases are recognized',()=>{const z=importSnapshot(',Şirket,Piyasa Değeri,F/K,FD/FAVÖK\n0,CWENE,1200000000,12,8',meta);assert.equal(z.records[0].metrics.marketCap,1200000000);assert.equal(z.records[0].metrics.pe,12);});
test('date-asof guards prevent future snapshot look-ahead',()=>{assert.throws(()=>compareSnapshots(prev,curr,{asOf:'2026-10-20'}));});
test('comparisons correctly calculate numeric changes',()=>{const c=compareSnapshots(prev,curr);assert.equal(c.recordCount,3);assert.equal(c.changes.find(x=>x.symbol==='CWENE').deltas.pe.percent,-50);});
test('missing and zero bases are safe',()=>{const a=importSnapshot('Sembol,F/K\nABCD,0',meta);const b=importSnapshot('Sembol,F/K\nABCD,2',{...meta,snapshotDate:'2026-10-25'});assert.equal(compareSnapshots(a,b).changes[0].deltas.pe.percent,null);});
test('does not combine different metric sets silently',()=>{assert.throws(()=>compareSnapshots(prev,importSnapshot('Sembol,Net Borç\nCWENE,3',{...meta,snapshotDate:'2026-10-25'}),{metrics:['pe']}));});
test('financial period mismatch cannot be silently reconciled',()=>{assert.throws(()=>compareSnapshots({...prev,metadata:{...prev.metadata,reportPeriod:'2026/6'}},{...curr,metadata:{...curr.metadata,reportPeriod:'2026/9'}}));});
test('duplicate symbols rejected',()=>{assert.throws(()=>importSnapshot('Sembol,F/K\nCWENE,2\nCWENE,3',meta));});
test('top moves ordered by absolute percentage',()=>{const t=topMoves(compareSnapshots(prev,curr),'pe');assert.equal(t[0].symbol,'CWENE');});
test('2026 Fintables fractional percent presentation normalized',()=>{
 const list=['A1CAP','A1YEN','CWENE','ASTOR','ASELS','TUPRS','YEOTK','KCHOL','SAHOL','MPARK','ARCLK'];
 const a=importSnapshot('Sembol,ROIC\n'+list.map(x=>`${x},20.0918355644`).join('\n'),meta);
 const b=importSnapshot('Sembol,ROIC\n'+list.map(x=>`${x},0.200918355644`).join('\n'),{...meta,snapshotDate:'2026-10-25'});
 const c=compareSnapshots(a,b,{metrics:['roicPct']});
 assert.equal(a.metadata.scaleByMetric.roicPct,'percent-points');
 assert.equal(b.metadata.scaleByMetric.roicPct,'fraction');
 assert.ok(Math.abs(c.changes[0].deltas.roicPct.percent)<1e-7);
});
test('ambiguous scale flagged for manual review rather than invented certainty',()=>{
 const z=importSnapshot('Sembol,ROIC\nABCD,1.8',meta);
 assert.deepEqual(z.metadata.ambiguousScaleMetrics,['roicPct']);
});
