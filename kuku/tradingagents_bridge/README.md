# KUKU × TradingAgents — doğrudan resmî ajan motoru

26 Ekim 2026. Bu kod, dört projeyi taklit eden bir mock değildir: **TauricResearch/TradingAgents v0.7.0** kütüphanesinin `TradingAgentsGraph` sınıfını çağırır ve gerçek veri arar. Kullanıcının izni olmadan gerçek hesaplara bağlanamaz; resmî paket kurulumu ve model hesabına tek seferlik giriş gerekir. Özel veriler kamuya açık GitHub'a konulmaz.

## Windows'ta ilk kurulum (PowerShell)

1. Python 3.11+ kur. Ayrı terminalde `python -m venv .venv` ve `.venv\Scripts\Activate.ps1`.
2. Resmî upstream etiketini kur: `pip install "git+https://github.com/TauricResearch/TradingAgents.git@v0.7.0"`.
3. **Plus / Pro hesabını kullanmak için** `tradingagents login chatgpt` komutunu çalıştırıp açılan resmî yetkilendirme sayfasında oturum aç. Şifreyi KUKU sohbetine yazma. Bağlantı resmi upstream'in desteklediği plan aboneliği seçeneğidir; kullanım plan limitlerine tabidir.
4. İlk gerçek veri kontrolü: `python kuku/tradingagents_bridge/run.py ASTOR --check-data`.
5. **Gerçek çoklu ajan çalıştırması:** `python kuku/tradingagents_bridge/run.py ASTOR --date 2026-10-26 --provider chatgpt`.
6. Rapor, HTML ve ajan dökümleri varsayılan olarak kişisel bilgisayarında `~/KUKU_PRIVATE/tradingagents/` altında saklanır. Dosyaları daha sonra **FİNANS ANA ARŞİV / 08** klasörüne özel şekilde aktarabilirsin. Henüz otomatik Drive senkronu yoktur.

API alternatifin varsa: `OPENAI_API_KEY` özel ortam değişkeniyle `--provider openai`. API anahtarını, lisanslı Fintables dosyanı, takas verini, portföy bilgilerini veya oturum belirtecini herkese açık repoya koyma.

## Kullanılan gerçek servisler

- Yahoo Finance/yfinance: BIST `ASTOR.IS`, `CWENE.IS`, `ASELS.IS` vb. fiyat, göstergeler, **varsa** haber ve finansallar. İsim `.IS` uzantısına dönüştürülür.
- TradingAgents v0.7.0 LangGraph motoru: piyasa, haber, temel, sosyal analistleri + boğa/ayı araştırmacılar + işlem ve risk değerlendirmesi + portföy hakemi.
- ChatGPT Plus/Pro oturumu veya OpenAI API: gerçek model yanıtları. Önce giriş/izin gerekir.
- **KAP ve TEFAS kurulu DEĞİL**: Yahoo bilançosu Türkiye'de raporun açıklanma tarihini garanti etmez. KAP ile teyit olmadan tek başına satış/alım kararı vermeyiz.
- Bloomberg **kurulu DEĞİL**: TradingAgents resmî v0.7 sağlayıcı listesinde Bloomberg yok. Bloomberg veri lisansı/Terminal varsa ileride ayrıca entegrasyon yapılabilir.

## Durum ve teknik güvenlik

- Bu repo köprünün kaynak kodunu ve çevrimdışı mantık testlerini barındırır; **gerçek agent+Yahoo+ChatGPT bağlantısı sunucuda başlatılmadı**.
- `--check-data` gerçek Yahoo erişimini sınar; kurgusal fiyat döndürmez, başarısızsa hata verir.
- Raporlara `kuku_manifest.json` içinde sürüm, analiz günü, veri sağlayıcıları ve uyarılar eklenir.
- Varsayılan çalışma zamanı özel/yerel bilgisayardır. GitHub Actions'da gizli kullanıcının ChatGPT giriş bilgisi bulunmaz; hesap oturumunu Actions'a kopyalama.
- Verilerin sağlayıcı kullanım koşullarına uy; Fintables gibi lisanslı verilerin yeniden dağıtımına dikkat et.
- Sistem otomatik emir vermez. Son işlem kararı kullanıcıya aittir.

Resmî ana proje: https://github.com/TauricResearch/TradingAgents — v0.7.0 (16 Ekim 2026).
