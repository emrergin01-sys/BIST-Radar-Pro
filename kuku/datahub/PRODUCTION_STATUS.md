# KUKU üretim durumu (29 Ekim 2026)
- GitHub Actions 09.30 TRT **zamanlı** günlük kaynak yakalama iş akışı eklendi. GitHub scheduled workflows birkaç dakika gecikebilir; 7/24 gerçek zamanlı izleme değildir.
- TCMB'nin kamuya açık XML gösterge döviz kuru akışı tarihli ve kaynağı belirtilerek içe alınır. TCMB tatillerinde en son yayımlanmış tarih farklı olabilir; akış canlı fiyat olarak gösterilmez.
- KAP finansal veri yayını yetki/lisans gerektiren ayrı bağlantıdır. Resmi KAP sitesine link olmak otomatik KAP API erişimi değildir.
- TEFAS fiyatları, BIST lisanslı hisse fiyatları ve dağıtım hakları kurulmamıştır; API erişimi varmış gibi gösterilmez.
- Bu iş akışı yalnız kamuya açık makro gösterge verilerini GitHub Actions artifact olarak 30 gün saklar. Kişisel portföy ve ücretli Fintables verisi kamuya açık repoya yüklenmez.
- Kalıcı, özel üretim sunucusu, şifreli saklama, kullanıcı giriş sistemi, işlemsel portföy mutabakatı, ajanların kalıcı bellekten izlemeye erişimi ve otomatik kod yayımlama henüz mevcut değildir.
- KUKU güncellemelerinin güvenli üretim hattı: test -> inceleme -> dağıtım; doğrulamasız otomatik yatırım emri yok.
