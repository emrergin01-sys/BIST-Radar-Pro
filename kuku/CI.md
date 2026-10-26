# Test disiplini

`node --test kuku/tests/*.test.mjs` testi 10 vakayı kapsar: altı rolün üretimi, as-of tarih sınırı, bankaların ayrı değerlendirilmesi, negatif nakit/borç riski, tarih geçerliliği, sinyal sonrası gerçekleşebilirlik ve işlem maliyeti. CI bu testleri GitHub pull request açıldığında çalıştırır. Testler gerçek KAP/TEFAS içeriğini doğrulamaz. Prototip için güvenlik sınırları README ve `.gitignore` içinde açıklanmıştır.
