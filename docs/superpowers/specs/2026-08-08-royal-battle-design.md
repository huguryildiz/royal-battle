# Royal Battle — Oyun Tasarım Dokümanı

*Tasarım: Aslan Yıldız'ın "Royal battle.pdf" çizimleri (14 sayfa) + sesli anlatımı.
Bu doküman oyunun "prompt"udur: oyun bu dokümana göre yapılır, her madde çizimlere dayanır.*

## 1. Oyun Kimliği

- **Adı:** Royal Battle
- **Tür:** Savaş + strateji + aksiyon
- **Platform:** Tarayıcıda çalışan 3D oyun (Three.js). Öncelik iPad Safari (dokunmatik), bilgisayarda fare ile de oynanır.
- **Kayıt:** Tarayıcıda saklanır (localStorage) — oyun kapansa da altınlar, taşlar ve karakterler kaybolmaz.
- **Logo:** Çizimdeki kılıçlı logo (PDF sayfa 1).
- **Gerçek para YOK.** Çizimdeki "450 TL" fiyat etiketi şakamıza dahil ama oyun içinde her şey oyun parasıyla alınır.

## 2. Ekranlar

### 2.1 Köy (ana ekran)
3D köy, kuş bakışına yakın sabit kamera açısı; parmakla sürükleyince kamera köyün üzerinde gezer.
Köyde bulunanlar (köy çizimine sadık): **kale/şato, evler, market, shop, fırın, asker alma yeri, iş alanları, ağaçlar, top, savaş alanı girişi.**
Üst köşede göstergeler: **altın sayısı** ve **yeşil taş sayısı** (çizimdeki gösterge paneli gibi).
Binaya dokununca ilgili ekran açılır:
- Asker Alma Yeri → Karakter Dükkanı
- İş alanı (ağaçlık) → Odun Kesme işi
- Kale yanındaki **Savaş** tuşu → Savaş ekranı
- **Envanter** tuşu → Envanter ekranı

### 2.2 Savaş
"Savaş tuşuna basıldığında rakibinizle eşleşin ve düelloya başlarsınız" (çizim, Kontrol-2 sayfası).
- Rakip bilgisayardır (bot köyü); her zaferden sonra bir sonraki rakip biraz güçlenir.
- 3D savaş alanı. Oyuncu, sahip olduğu karakterlerin kartlarından birini seçip alana **sürükleyip bırakır**; karakter alanda belirir ve **kendi kendine savaşır**. Rakip de kendi askerlerini sürer.
- Dövüş, karakterin statlarıyla işler: **Atk** vuruş gücü, **Def** dayanıklılık (can), **Hız** hareket ve vuruş temposu.
- **Kazanınca: 25 altın** + envantere ganimet düşer ("savaş kazanıldığında envanterinize düşer" — çizim). Arada **nadir yeşil taş** kazanılır.
- Kaybedince bir şey kaybedilmez; tekrar denenir.

### 2.3 Odun Kesme (iş mini-oyunu)
"İş yerlerine basınca iş yapma seçenekleri çıkar" (çizim, Kontrol sayfası).
- İş alanına dokununca açılır: ekrana odunlar gelir, oyuncu dokunarak baltayla kırar.
- **Her kırılan odun = 2 altın.** Süre dolunca kazanılan altın köy kasasına eklenir.

### 2.4 Envanter
Çizimdeki gibi ızgara düzeni: eşyalar adetleriyle görünür (x30, x100 gibi), **dolu yer / boş yer** sayısı yazar. Savaş ganimetleri buraya düşer.

### 2.5 Karakter Dükkanı (Asker Alma Yeri)
8 karakter kart halinde dizilir; kartlarda Aslan'ın çizimlerinin renklendirilmiş halleri ve statları. Normal karakterler **altınla**, Ultra Özel karakterler **yeşil taşla** alınır. Kara Ruh en pahalı yeşil taş karakteridir.

## 3. Karakterler

Statlar çizimlerden birebir alınmıştır, değiştirilemez (tasarımcının kararı):

| Karakter | Tür | Atk | Def | Hız | Alım |
|---|---|---|---|---|---|
| Savaşçı | Normal | 50 | 94 | 75 | Altın (başlangıçta açık) |
| Okçu | Normal | 89 | 30 | 100 | Altın |
| Büyücü | Normal | 98 | 89 | 69 | Altın |
| Buz Ejderhası | Normal | 91 | 50 | 92 | Altın |
| Maden Dinozoru | Normal | 100 | 100 | 21 | Altın |
| Altın Ordu | Ultra Özel | 100 | 100 | 100 | Yeşil taş |
| Altın Bomba Çiçeği | Ultra Özel | 100 | 100 | 100 | Yeşil taş |
| Kara Ruh | INVISIBLE | 101 | 101 | 101 | Yeşil taş (en pahalı) |

Karakter dengesi Aslan'ın kurduğu gibi korunur: Okçu hızlı-kırılgan, Maden Dinozoru güçlü-yavaş, Savaşçı savunmacı. Kara Ruh "101" ile tavanın bir tık üstünde — oyunun en özel karakteri; savaşta yarı saydam (görünmezlik hissi) görünür.

## 4. Ekonomi

- **Altın:** odun kesmekten (2/odun) ve savaş kazanmaktan (25/savaş) gelir. Normal karakterler ve ilerideki eşyalar altınla alınır.
- **Yeşil taş:** yalnızca savaş ödüllerinden nadir kazanılır. Ultra Özel ve Invisible karakterler yeşil taşla alınır.
- Gerçek parayla satın alma yoktur ve eklenmeyecektir.

## 5. Grafik Planı

| Ne | Kaynak | Not |
|---|---|---|
| Köy binaları, kasaba | **Kenney Retro Fantasy Kit** (3D, CC0) | Minecraft havasında retro stil — Aslan'ın çizim estetiğiyle uyumlu |
| Savaşan karakterler | **Aslan'ın karakterleri** — Kenney Blocky Characters yalnızca iskelet/animasyon tabanı (CC0) | Her karakter Aslan'ın çizimine göre giydirilir (Savaşçı: bıyık + balta + kılıç; Okçu: kapüşon + yay; Kara Ruh: yarı saydam...). Ejderha, dinozor, bomba çiçeği gibi karşılığı olmayanlar çizime bakılarak bloklardan sıfırdan kurulur. Her karakterin son halini Aslan onaylar. |
| Karakter kartları | **Aslan'ın çizimlerinden renklendirilmiş versiyonlar** | Dükkan, envanter ve savaş seçiminde dev boy; çizgisine sadık üretilir, onayı kendisi verir |
| Butonlar, panel, ikonlar | **Kenney UI Pack + Game Icons** (CC0) | Altın/taş ikonları, Savaş/Envanter tuşları |
| Eşya görselleri | Aslan'ın eşya çizimlerinden (kalkan, kılıç, tüfek, mini gun, iksirler) | 2. sürümde savaşta kullanım eklenince öne çıkar |

Açılış ekranına küçük teşekkür: "Grafikler: Kenney.nl — Tasarım: Aslan Yıldız".

## 6. Kontroller

Tamamen dokunmatik (çizimdeki kontrol sayfalarına sadık):
- Dokun: bina aç, odun kır, buton bas
- Sürükle-bırak: savaşta karakter sürme
- Parmak kaydır: köyde kamera gezdirme

## 7. İlk Sürüm Kapsamı (v1)

1. 3D köy ekranı + göstergeler
2. Odun kesme mini-oyunu
3. Savaş (bot rakip, sürükle-bırak, otomatik dövüş, ödüller)
4. Envanter
5. Karakter Dükkanı (8 karakter, iki para birimi)
6. Kayıt (localStorage)

**v2'ye kalanlar:** market satıcılığı mini-oyunu, eşya ve iksirlerin savaşta kullanımı, ses efektleri ve müzik, top ateşleme, köy geliştirme/inşaat.

## 8. Başarı Ölçütü

Oyun iPad Safari'de tam ekran açılır; Aslan yardım almadan odun keser, altın biriktirir, karakter satın alır ve bir savaşı kazanıp 25 altınla ganimetini envanterde görür. Son söz her zaman tasarımcınındır: o "şurası farklı olsun" derse doküman güncellenir.
