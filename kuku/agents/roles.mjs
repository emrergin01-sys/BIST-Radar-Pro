export const ROLES = Object.freeze([
  {id:'macro',name:'Türkiye ve Dünya Makro Analisti',goal:'Faiz, enflasyon, büyüme, döviz, ticaret ve küresel risklerin şirket üzerine etkisi. Tahmin ve gerçekleşmiş veriyi ayır.'},
  {id:'sector',name:'Sektör ve Rekabet Analisti',goal:'Talep, üretim kapasitesi, fiyat gücü, müşteri yoğunluğu, siparişler, rekabet ve nakde dönüşüm. Moda sektöre otomatik öncelik verme.'},
  {id:'financials',name:'Bilanço ve Değerleme Analisti',goal:'Dönemsel mali tablolar, satış, FAVÖK, faaliyet nakdi, yatırım harcamaları, borç, enflasyon muhasebesi, ROIC, F/K, PD/DD ve benzerleri. Finans/holdingler için sektör metrikleri.'},
  {id:'market',name:'Teknik ve Piyasa Analisti',goal:'Kaynaklı ve tarihli fiyat/hacim, likidite, volatilite ve yetkili takas. Takas kurumu ile faydalanıcıyı özdeş sayma.'},
  {id:'skeptic',name:'Karşı Tez ve Risk Denetçisi',goal:'İlk dört analistin tezlerini çürütmeye çalış; kaynak veya tarih açığını, veri çakışmasını, yoğunlaşma riskini açıkla.'},
  {id:'portfolio',name:'Portföy Stratejisi ve Karar Hakemi',goal:'Bağımsız bulguları birleştir; fırsat maliyetini ve mevcut yoğunlaşmayı incele; koru, izle, azaltma adayı, çıkış adayı veya rotasyon fikrini koşullu sun. Emir verme.'}
]);
export const REPORT_SCHEMA={type:'object',additionalProperties:false,properties:{summary:{type:'string'},findings:{type:'array',items:{type:'string'}},risks:{type:'array',items:{type:'string'}},questions:{type:'array',items:{type:'string'}},evidenceIds:{type:'array',items:{type:'string'}},stance:{type:'string',enum:['positive','mixed','negative','insufficient']},recommendation:{type:'string',enum:['not_applicable','hold','watch','consider_reduce','exit_candidate','rotation_candidate','insufficient_evidence']}},required:['summary','findings','risks','questions','evidenceIds','stance','recommendation']};
export const DECISIONS=new Set(REPORT_SCHEMA.properties.recommendation.enum);
export const REPORT_KEYS=new Set(REPORT_SCHEMA.required);
