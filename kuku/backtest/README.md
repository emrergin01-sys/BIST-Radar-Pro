# KUKU v0.3-alpha — Portföy Geriye Dönük Testi

**26 Ekim 2026 · ARAŞTIRMA PROTOTİPİ · gerçek yatırım sonucu değildir.**

KUKU v0.1 tekil olay çalışmasından farklı olarak bu modül, birden fazla hisse arasındaki sermaye tahsisini ve nakdi gün gün izler. Portföy başlangıçta tamamen nakittir. Her karar, **bir sonraki işlem gününün kapanışında** uygulanır. `dataAvailableAt > date` olan sinyal dışlanır; eksik fiyat günü varsa test hata verir (ileri taşınmaz).

## Kullanım

Node.js 20+ gerekir. Repo kökünden:

```bash
node --test kuku/tests/*.test.mjs
```

```js
import {backtestPortfolio} from './kuku/backtest/portfolio-backtest.mjs';
const result=backtestPortfolio({
 initialCash: 10000,
 feeBps: 10,
 slippageBps: 5,
 benchmarkSymbol: 'XU100',
 benchmarkKind: 'price_only',
 currency: 'TRY',
 bars: [
  {date:'2026-10-19',symbol:'AAA',close:100},
  {date:'2026-10-19',symbol:'XU100',close:1000},
  {date:'2026-10-20',symbol:'AAA',close:110},
  {date:'2026-10-20',symbol:'XU100',close:1010},
  {date:'2026-10-21',symbol:'AAA',close:115},
  {date:'2026-10-21',symbol:'XU100',close:1020}
 ],
 signals: [{date:'2026-10-19',dataAvailableAt:'2026-10-19',targets:{AAA:0.8}}],
 actions: []
});
console.log(result.finalEquity,result.portfolioReturnPct,result.maxDrawdownPct);
```

Bu örnekteki **AAA fiyatları kurgusaldır**. AAA gerçek BIST sembolü veya gerçek fiyat kaynağı değildir.

## Giriş sözleşmesi

- `bars`: Her bir işlem gününde izlenen **bütün** sembollerin ve benchmarkın `{date,symbol,close}` kayıtları. Ham, **bölünme/temettü düzeltmesi yapılmamış** TRY kapanış fiyatları gerekir. Bölünmeye göre düzeltilmiş fiyatı ayrıca `actions` ile kullanırsan iki kez düzeltme hatası oluşur.
- `signals`: `{date,dataAvailableAt,targets:{AAA:0.4,BBB:0.4}}`. Ağırlık 0–1, toplam en fazla 1; kalan nakit. Girdi sinyalleri geçmiş zamanda gerçekten üretilebilmiş olmalı. Aynı günde iki farklı hedef kabul edilmez.
- `actions`: `{date,symbol,type:'split',ratio:2}` veya `{date,symbol,type:'dividend',amountPerShare:5}`. **Tarih ex-date**; bölünme ve temettü değerinin fiyat bazına uygunluğu kullanıcı tarafından KAP'tan doğrulanmalıdır.
- `benchmarkKind`: `price_only` durumunda benchmark getirisi temettü içermez ve portföyle doğrudan karşılaştırılabilir kabul edilmez. `total_return` yalnız gerçekten toplam getiri endeksi sağlandıysa seçilmelidir.
- `feeBps` ve `slippageBps`: Alım/satım iki yönde uygulanır; varsayılan 10 bp ve 5 bp, **kullanıcıya ait gerçek tarife değildir**.

## Rapor

`finalEquity`, `portfolioReturnPct`, `benchmarkReturnPct`, `maxDrawdownPct`, işlem listesi `trades`, nakit/equity `curve`, `totalCostsTRY`, `dividendsCreditedTRY`, `excludedSignals`, `warnings` döner.

## Veri kalitesi ve üretim öncesi engeller

1. **Veri bağlantısı kurulmadı.** KAP, TEFAS, borsa, lisanslı sağlayıcı veya TradingAgents bu modül tarafından çağrılmaz. Fintables verisi GitHub'a yüklenmez.
2. **Kurumsal eylem riski.** Bedelli sermaye artırımı, birleşme, ayrılma, rüçhan ve karma işlemler desteklenmiyor; geçmiş dönem için eksiksiz kurumsal işlem listesi sağlanmadıkça gerçek performans iddiası kurulmaz.
3. **Temettü ödeme tarihi.** Temettü, gerçek ödeme tarihinde değil ex-date tarihinde nakit olarak hesaplanır. Bu durum erkenden yeniden yatırım yapılabilmesini sağlar ve bazı senaryolarda getiriyi iyimser gösterebilir. Stopaj, vergi, nakit faizi ve fon gideri hesaba katılmaz.
4. **İşlem gerçekçiliği.** Gerçek emir derinliği, kapanış seansında gerçekleşme, likidite sınırı, açığa satış ve alış-satış fiyat farkının tüm etkileri modellenmez. Sadece uzun/spot, tam lot alımları esas alınır. Ters bölünme sonrası küsuratlı pay nakit karşılığı modellenmez.
5. **Geçmişe bakma.** `dataAvailableAt` ile tarih denetimi vardır ama bir araştırma algoritmasının geçmiş günlerde gelecekteki düzeltilmiş mali tabloları/sınıflandırmaları kullanmadığını tek başına kanıtlamaz. Sinyal üretim hattı ayrı denetlenmelidir.
6. **Benchmark ve reel getiri.** Fiyat endeksi ile temettülü hisse performansını doğrudan adil karşılaştırmak doğru değildir; enflasyondan arındırılmış getiri ve risk ayarlı ölçüler sonraki sürüm konusudur.

**Güvenlik:** Repo herkese açıktır. Kişisel alış/satışlar, portföy, ücretli abonelik çıktıları ve API anahtarları yalnız özel arşivde/yerel ortamda tutulur. Bu modül emir veya yatırım tavsiyesi üretmez.

Planlanan devam: KAP'a dayalı açıklama günlerinin doğrulanması; gerçek fiyatların lisansıyla, temettü/bölünme geçmişiyle hazırlanmış özel veri seti; rolling out-of-sample test ve gerçek portföy mutabakatı.
