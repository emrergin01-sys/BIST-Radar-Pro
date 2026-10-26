# KUKU Research Lab — v0.1 (prototip)

BIST Radar Pro'nun **kaynak disiplinli araştırma laboratuvarı**. 26.10.2026 itibarıyla rol bazlı denetim şablonu, JSON örnek analiz ve eğitim amaçlı sinyal olay çalışması içerir. Ticaret motoru, canlı veri bağlantısı, gerçek AI-ajan orkestrasyonu veya kullanıcı hesabına erişim içermez.

## Başlangıç

- Proje kökünde `python -m http.server 8000` çalıştır, ardından `http://localhost:8000/kuku/lab.html` adresini aç veya GitHub/Netlify üzerinde statik yayınla. Örnek **DEMO1** değerleri kurgusaldır.
- Komut satırında `node kuku/cli.mjs analyze kuku/examples/demo-case.json`
- Sinyal çalışması: `node kuku/cli.mjs event-study kuku/examples/demo-prices.json`
- Testler: `node --test kuku/tests/*.test.mjs` (Node 20+)

## Araştırma giriş şeması

`kuku/examples/demo-case.json` yapısını baz al. `symbol`, `asOf`, `companyType` ve `sources` zorunludur. `sources` içindeki `publishedAt` tarihi `asOf` sonrasındaysa kaynak otomatik dışlanır. Dış bağlantı URL'si bir içerik doğrulaması değildir; **bağlantıdan KAP sayısı çekip kontrol eden bir backend henüz yoktur**.

`financials.cfo` ve `financials.fcf` **aynı para birimi ve dönem** ile girilmeli. Finansal şirketlerde sanayi FAVÖK borç oranları kullanılmaz; holdingde iştirak/NAD gerekir. Girdiler tek başına alım/satım talimatına dönüşmez.

## Geçmişe dönük olay çalışması

`kuku/examples/demo-prices.json` içindeki `bars` ve `signals` **kurgusaldır**. Her sinyalde `date` ve `dataAvailableAt` aranır; henüz erişilebilir olmayan bilgiyle verilen sinyal dışlanır. İşlem fiyatı karar gününün değil, **sonraki işlem gününün kapanışıdır** ve çıkış `holdBars` sonra yapılır. Gecikme, işlem komisyonu ve alış/satış kayması dikkate alınır. `benchmarkSymbol` benchmarkın iki işlem tarihinde de varsa hesaplanır.

Bu modül **portföy backtest'i değildir**: sermaye tahsisi, pozisyon çakışması, temettü, sermaye eylemleri, düzeltilmiş fiyat, vergiler, likidite/gerçekleşebilir emir fiyatı ve kur etkilerini hesaplamaz. Gerçek getiriyi çıkarmak için önce tarihsel fiyatların doğru ve aynı bazda olması gerekir.

## Veri güvenliği ve mimari

**Bu GitHub deposu herkese açıktır.** Özel portföy, Fintables Pro çıktısı, lisanslı takas verisi, mail, şifre, API anahtarı veya kişisel Drive içerikleri buraya eklenmeyecek. `.gitignore` olsa da git commit edilmiş veriyi gizlemez. Örnek JSON ve fiyatlar yalnız uydurma test değerleridir. Gerçek kullanıcı verisi Drive'daki `FİNANS ANA ARŞİV` altında kalır, gerekirse bilgisayarda yerel dosyayla çalışılır. Tarayıcı laboratuvarı analiz girdilerini sunucuya göndermez, oturum bitince saklamaz. Devamında yetkilendirmeli özel backend/Drive API gerekebilir.

## Yol haritası

1. v0.1: rol bazlı disiplin, kaynak ve tarih denetimi, olay çalışması, testler — **hazır**.
2. v0.2: KAP/TEFAS web verisi ve resmi sektör eşleştirmesi için güvenilir içeriğe dayalı aktarım; Drive'a tarihli araştırma kaydı (izinler doğrulandıktan sonra).
3. v0.3: noktası-zamanda doğru fiyat/finansal dönem veri seti; temettü/bölünme/masraf etkisi; gerçek portföy backtest'i; karşılaştırma.
4. v0.4: onaylı veri bağlantılarıyla ayrı analist ajanları, kaynak dışlama ve karşıt tez hakemi. Otomatik al/sat yok.

Metodoloji: `kuku/prompts/role-playbook.md`.

## v0.2 — Veri Merkezi (26.10.2026)

Yeni kaynak-kontrollü CSV ithal ve karşılaştırma katmanı `kuku/datahub/` içindedir.

- **Çevrimdışı arayüz:** `kuku/datahub/standalone.html` (dosyayı çift tıklayarak aç). Özel CSV tarayıcıda kalır; GitHub'a gönderilmez.
- **Veri işleme:** `snapshots.mjs` Fintables tarzı `Sembol` ve `Şirket` sütunlarını tanır, metrik adlarını ortak standarda çevirir; `%20,09` ile `0,2009` gibi sayısal ölçekleri dosya düzeyinde normalleştirir ve belirsizlikte uyarır. As-of ve veri dönemi kontrolleri yapar.
- **Kanıt kontrolü:** `evidence.mjs` tarih, kayıt ve kaynak bağlantısı biçimini ve bilgilerin analiz tarihinde var olup olmadığını inceler; bağlantıların içeriğini **doğruladığını iddia etmez**.
- **Komut satırı:** `node kuku/datahub/cli.mjs import eski.csv meta.json eski.json`; `node kuku/datahub/cli.mjs compare eski.json yeni.json pe rapor.json`; `node kuku/datahub/cli.mjs evidence evidence.json 2026-10-26 kabul.json`.
- **Kaynak yönetimi:** KAP resmî kurumsal Veri Yayın Servisi, Borsa İstanbul sözleşmesi + MKK yetkilendirmesi + IP/API anahtarı gerektirir. Bu sürüm izinsiz API scraping ya da sürekli sorgulama yapmaz. Kaynak: https://www.kap.org.tr/tr/api/about/content-file/8a019492945fbe080194b26d8bed4873 . Kamu KAP arayüzündeki erişilebilir bilgiyi kullanıcı/araştırmacı web üzerinden kontrol edip bu formata tarihli aktarabilir.
- **Fonlar:** TEFAS/SPK'nin resmî fon arayüzü kullanılarak indirilen izinli dosyalar ileride ayrıca fon şemasıyla işlenecek; bu sürüm fon pay/fiyatını otomatik çekmez. https://spk.gov.tr/kurumlar/fonlar/yatirim-fonlari/menkul-kiymet-yatirim-fonlari/portfoy-degerleri

**Kritik keşif:** 17.10.2026 Fintables kârlılık yüzdelerinin bir kısmı örneğin 20,09, 25.10.2026 dosyasında 0,2009 şeklindedir. Normalize etmeden 99% düşüş çıkarımı HATALIDIR. 26.10.2026 tarihli gerçek dosya incelemesindeki sayı özeti özel Drive araştırma günlüğündedir; kamu GitHub deposunda lisanslı veri tutulmaz.

Testler: `node --test kuku/tests/*.test.mjs`. `datahub` modülü, otomatik KAP/TEFAS bağlantısı, işlem veya fon portföy hesaplaması değildir; kaynaklı veri kaydetme/karşılaştırma temelidir.

### v0.2 hızlı erişim
`kuku/datahub/standalone.html` çevrimdışı iki Fintables CSV görüntüsünü karşılaştırır; ayrıntılı açıklama `kuku/datahub/README.md`. İlk gerçek arşiv karşılaştırması kamuya açık depoda değil, kullanıcının özel Google Drive kütüphanesinde tutulur.
