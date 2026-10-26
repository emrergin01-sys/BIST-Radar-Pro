# KUKU v0.2 — Kaynak ve Görüntü Karşılaştırma Merkezi

Tarih: **26.10.2026**. Bu sistemde veri kaynağı ana araştırma amacıyla **WEB/KAP/TEFAS/SPK**; Google Drive, geçmiş veri ve kararların özel arşividir. KUKU v0.2'de **otomatik KAP veri akışı kurulmamıştır**: yetkisiz tarama, lisans gerektiren kurumsal REST entegrasyonu veya abonelik verilerini kamuya yayımlama yoktur.

## Çalışan işlevler

- `standalone.html`: Tarayıcıda çift tıklayarak açılan **çevrimdışı** karşılaştırma ekranı. İki CSV dosyasını alır; tarih, kaynak adresi ve göstergeyi eşleştirir. Değişimleri arar, filtreler, JSON raporu verir. Dosyalar hiçbir sunucuya yüklenmez.
- `snapshots.mjs`: `Sembol`/`Şirket` kolonlarını tanır, F/K, PD/DD, ROIC, borç, nakit akışı gibi Fintables taramalarını normalize eder. 17 Ekim `20,09` vs. 25 Ekim `0,2009` yüzde gösterimi farkını **yüzde puanına** dönüştürür. Tahmin belirsizse `ambiguousScaleMetrics` olarak işaretler. Finansal dönem uyuşmazlığı, yinelenen sembol, veri-sonrası tarih hatalarını engeller.
- `evidence.mjs`: Tarihli KAP, TCMB, SPK vb. kaynak kayıtlarını doğrulama **biçimi ve as-of tarihi bakımından** kontrol eder. İçerik doğrulama ayrı araştırmadır; otomatik yapılmaz.
- `cli.mjs`: Node 20+ komut satırı içe aktarma/karşılaştırma/kanıt günlüğü.
- `tests/snapshots.test.mjs` ve `tests/evidence.test.mjs`: V0.1 testleriyle birlikte **26** otomatik test.

## Deneme komutları

Proje kökünde:

```bash
node --test kuku/tests/*.test.mjs
node kuku/datahub/cli.mjs import kuku/examples/v02-old.csv kuku/examples/v02-old.meta.json old.json
node kuku/datahub/cli.mjs import kuku/examples/v02-new.csv kuku/examples/v02-new.meta.json new.json
node kuku/datahub/cli.mjs compare old.json new.json pe comparison.json
node kuku/datahub/cli.mjs evidence kuku/examples/v02-cwene-evidence.json 2026-10-26 evidence-result.json
```

Bu komutlarla çıkan örnek veri *kurgusaldır*. Gerçek Fintables çıktısı özel Drive'da olmalı ve yalnız yerel bilgisayar veya izinli özel işlem ortamında işlenmelidir.

## Resmî kaynak ilkeleri

- KAP kurumsal Veri Yayın Servisi sözleşme, API anahtarı ve IP yetkilendirmesi ister: https://www.kap.org.tr/tr/api/about/content-file/8a019492945fbe080194b26d8bed4873
- SPK'nın fon portföy değerleri ve TEFAS bağlantısı: https://spk.gov.tr/kurumlar/fonlar/yatirim-fonlari/menkul-kiymet-yatirim-fonlari/portfoy-degerleri
- Geçmiş tarama görüntülerindeki oran değişimleri **yeni bilanço veya şirket kalitesindeki değişim anlamına gelmez**. Tarama tarihi ve bilanço dönemi ayrı meta alanlarıdır.
- GitHub kamuya açıktır; kişisel portföy/ücretli lisanslı Excel/kapsamlı takas verilerini burada tutma.

## Gerçek arşiv uygulaması

26.10.2026 tarihinde özel Drive'da 17 ve 25 Ekim tarihli Fintables hisse taramalarının 655 sembollü değerleme, kârlılık ve net borç dosyaları karşılaştırıldı; en kritik bulgu **yüzdelik ölçek farklılığı** oldu. Şirket bazlı tablo ve kaynak bağlantıları `08_KUKU_ARASTIRMA_VE_KARAR_GUNLUGU` içindeki 26.10.2026 tarihli `KUKU v0.2 Fintables 17-25 Ekim Ölçek ve Değerleme Karşılaştırması` dokümanında saklıdır. Rapor kesin alım-satım sinyali değildir.

## Bir sonraki teknik adım

Resmî şirket bildirimlerinin doğru erişim/izin yöntemi, fon dosyalarının normalize edilmesi, bütün KAP haberleri için yazılı kaynak kontrolü, sürümlü Drive API bağlayıcısı ve gerçek tarihli fiyatlarla geçmiş performans testi.
