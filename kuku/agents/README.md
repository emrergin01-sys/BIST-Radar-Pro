# KUKU Agent Orchestrator v0.3 — 26 Ekim 2026

## Gerçek durum

Bu, **bağımsız altı AI analitik rolünü koordine edebilen bir çalıştırma katmanıdır**. Önceki v0.1/v0.2 sistemleri statik veriyi işler; burada dört ilk analist paralel, karşı-tez analisti bu sonuçların ardından, portföy hakemi ise son aşamada çalışır. **KUKU şu anda kullanıcı adına sürekli çalışan ajan sunucusu DEĞİLDİR**. Ajanlar yalnız `live` komutu elle çalıştırılırsa ve bir özel API anahtarı+model+gerçek vaka girilirse model üzerinden üretim yapar. `demo` ücretsiz ve kurgusaldır; gerçek AI çağrısı yapmaz.

## Açık kaynak ilişkisi

TradingAgents (Apache-2.0) ve FinRobot (Apache-2.0) ajanların rollere ayrılması bakımından *mimari referans*; FinGPT haber analizi ve AI Hedge Fund paper-trading için sonraki aşama araştırma referanslarıdır. **Hiçbir proje klonlanmadı, dört proje birleştirilmedi, o projelerin kodu KUKU'ya kopyalanmadı.** KUKU için bağımsız ve küçük bir orkestratör yazıldı. Kaynaklar: https://github.com/TauricResearch/TradingAgents ; https://github.com/AI4Finance-Foundation/FinRobot ; https://github.com/AI4Finance-Foundation/FinGPT ; https://github.com/virattt/ai-hedge-fund .

## Demo (API anahtarı, ek bağımlılık veya ağ gerekmez)

```bash
node kuku/agents/cli.mjs demo kuku/examples/v03-synthetic-case.json
node --test kuku/tests/*.test.mjs
```

## Gerçek AI model çağrısı (yalnız kullanıcı kendi özel bilgisayar/sunucusunda)

Node.js 22 veya üzeri ve ayrıca ücretli **API erişimi** gerekir. ChatGPT Plus aboneliği otomatik API hakkı sağlamaz. Terminal ortam değişkenlerine `OPENAI_API_KEY` ve `OPENAI_MODEL` tanımlanır; hiçbir anahtar mesajda veya GitHub dosyasında paylaşılmaz. Örnek:

```bash
node kuku/agents/cli.mjs live /gizli/vaka.json /gizli/sonuc.json
```

**ÖNEMLİ:** Gerçek mod kaynak metin özetlerini model sağlayıcısına gönderir. Özel portföy, telif/lisanslı Fintables verisi ve kişisel belge göndermeden önce veri kullanma izni ve gizliliği değerlendir. Vaka JSON'unda `reviewStatus:human-reviewed` veya `cross-checked` görünmesi yalnız insan beyanıdır; API kaynağı otomatik gidip doğrulamaz. KAP/TEFAS otomatik bağlanmadı. Bir canlı işlem/portföy emri yok.

## İş akışı

1. Kaynakları **önce** ayrı web/izinli veri toplama adımında doğrula: asOf, URL, rapor dönemi ve iddia.
2. Dört bağımsız ilk rol (`macro`, `sector`, `financials`, `market`) paralel rapor üretir.
3. `skeptic` karşıt görüş ve eksik kanıtları saptar.
4. `portfolio` koşullu karar sınıfı önerir ve kaynak ID'lerini gösterir.
5. Çıktı yerel JSON'a kaydedilir; Drive'a tarihli kütüphane kaydı ayrıca yetkili konnektör ile yapılır.

Önceki kodlarda olduğu gibi bu sürüm tek başına canlı veri çekmez, hatasız AI/finans sonucu garanti etmez, ayrı bağımsız model sağlayıcıları veya 7/24 çalışan ajan süreçleri kurmaz. GitHub Actions sadece **offline unit-test** çalıştırır.

## 26.10.2026 test kanıtı

`node --test kuku/tests/*.test.mjs`: **40 test başarılı** (önceki sürüm testleri dahil). Gerçek servisle canlı API isteği veya bağımsız haber taraması yapılmadı. `node kuku/agents/cli.mjs demo kuku/examples/v03-synthetic-case.json` çıktısında kaynak incelemesi sıfır ve `insufficient_evidence` görülmelidir.
