# Tripo prompt'ları — savaş sprite'ları

Savaş arenasındaki birimler için 3D model üretme reçetesi. Üretilen GLB
`assets/tripo/<id>.glb` olarak kaydedilir (gitignore'lu, yerelde kalır);
oradan `./sprite.sh` ile `assets/sprites/<id>.png` çıkar ve repoya girer.

## Nasıl üretilir

**Birincil yol — Image to 3D.** Elimizdeki kart görselleri zaten hedef üslupta.
`assets/cards/<id>.jpg` dosyasını Tripo'ya yükle, üslup birebir korunur. Aşağıdaki
metin prompt'u açıklama alanına ek olarak ver.

**Yedek yol — Text to 3D.** Kart sonucu bozuk çıkarsa aşağıdaki prompt'u tek başına kullan.

**Ayarlar:** GLB export, Y-up, doku (texture) açık. Dosya adı listede yazan `id`.

## Ortak stil eki

Her prompt'un sonuna aynen eklenecek:

```
stylized toy figure, glossy injection-molded plastic, chunky simplified shapes,
bold saturated colors, clean readable silhouette, full body, standing upright,
arms clear of the torso, no base, no pedestal, no background, single figure only
```

Neden bu ek: sprite tek kareden ibaret, o yüzden **silüet her şey**. Kollar gövdeye
yapışırsa 64 pikselde karakter tanınmaz hâle geliyor. Kaide de olmamalı — birim
zeminde durmalı, tabure üstünde değil.

## Karakterler

Öncelik sırası bu — **önce sadece Savaşçı'yı üret**, hattı onunla uçtan uca kurup
açı/ölçek onaylandıktan sonra kalanlar hızlı geçer.

### 1. savasci — Savaşçı

```
A LEGO-style minifigure warrior with tousled brown hair, dark crimson armor and a
long crimson cape, grey chest plate with brown leather straps, crimson boots,
holding a double-headed steel axe raised in the right hand and a steel sword in
the left hand, fierce shouting expression. stylized toy figure, glossy injection-molded plastic, chunky simplified shapes,
bold saturated colors, clean readable silhouette, full body, standing upright,
arms clear of the torso, no base, no pedestal, no background, single figure only
```

### 2. okcu — Okçu

```
A LEGO-style minifigure archer in a green hood and green tunic, dark grey trousers,
brown boots, brown leather belts and a quiver of arrows on the back, drawing a
wooden longbow, confident grin. stylized toy figure, glossy injection-molded plastic, chunky simplified shapes,
bold saturated colors, clean readable silhouette, full body, standing upright,
arms clear of the torso, no base, no pedestal, no background, single figure only
```

### 3. buyucu — Büyücü

```
A LEGO-style minifigure wizard in a long purple hooded robe with gold trim and a
purple face scarf, wide brown leather belt, black boots, both hands raised outward
casting glowing fireballs, angry determined face. stylized toy figure, glossy injection-molded plastic, chunky simplified shapes,
bold saturated colors, clean readable silhouette, full body, standing upright,
arms clear of the torso, no base, no pedestal, no background, single figure only
```

### 4. buz-ejderhasi — Buz Ejderhası

```
A cute chubby cartoon ice dragon, pale ice-blue scales with a white ribbed belly,
dark navy bat wings, a blue ice crystal on the forehead, small horns, standing on
two hind legs, mouth open showing white teeth and a red tongue. stylized toy figure, glossy injection-molded plastic, chunky simplified shapes,
bold saturated colors, clean readable silhouette, full body, standing upright,
arms clear of the torso, no base, no pedestal, no background, single figure only
```

### 5. maden-dinozoru — Maden Dinozoru

```
A large green and grey cartoon T-rex with a beige belly, wearing a grey armored
saddle with leather straps, a small LEGO-style miner in a red shirt and orange hard
hat riding on its back holding a pickaxe, heavy stomping pose. stylized toy figure, glossy injection-molded plastic, chunky simplified shapes,
bold saturated colors, clean readable silhouette, full body, standing upright,
arms clear of the torso, no base, no pedestal, no background, single figure only
```

### 6. altin-ordu — Altın Ordu

```
A LEGO-style minifigure knight in ornate polished gold armor with a deep red cape,
gold helmet with a red pennant flag on top, gold shoulder pauldrons and gold claw
hands, standing at attention. stylized toy figure, glossy injection-molded plastic, chunky simplified shapes,
bold saturated colors, clean readable silhouette, full body, standing upright,
arms clear of the torso, no base, no pedestal, no background, single figure only
```

> Kartta beş asker var ama sprite **tek figür** olmalı — sahada birim başına bir
> görsel çiziliyor, kalabalık kart görselinde kalır.

### 7. altin-bomba-cicegi — Altın Bomba Çiçeği

```
A cartoon plant monster with a thick green stalk, two green leaf arms, green root
feet with yellow claws, and a big round glossy yellow bomb for a head with a huge
open mouth showing white triangular teeth, a small red flower fuse on top. stylized toy figure, glossy injection-molded plastic, chunky simplified shapes,
bold saturated colors, clean readable silhouette, full body, standing upright,
arms clear of the torso, no base, no pedestal, no background, single figure only
```

### 8. kara-ruh — Kara Ruh

```
A LEGO-style minifigure made of translucent dark purple glossy plastic, glowing
magenta eyes and a faint grin, cracked vein pattern on the torso, glitter suspended
inside the legs, hollow ghostly look. stylized toy figure, glossy injection-molded plastic, chunky simplified shapes,
bold saturated colors, clean readable silhouette, full body, standing upright,
arms clear of the torso, no base, no pedestal, no background, single figure only
```

## Köy binaları

Köy haritasındaki beş tıklanabilir bina (`js/village/map.js` → `BINALAR`). Şu an
Kenney'nin 2D sprite'ları duruyor, ortadaki kale ise Tripo render'ı — üslup çatlağı
oradan geliyor. Hepsi `kale.png` ile aynı aileden görünmeli.

**Ortak stil eki** — karakterlerinkinden farklı, bina promptlarının sonuna bu eklenecek:

```
LEGO-style toy building made of chunky moulded bricks, warm beige sandstone walls,
glossy plastic finish, bold saturated colors, clean readable silhouette, front
elevation slightly from above, no ground plane, no base plate, no background,
single building only
```

Neden bu ek: kale bej taş + parlak turuncu çatı + kahverengi ahşap paletinde ve
neredeyse cepheden render edildi (`./sprite.sh <id> 90 18`). Binalar da aynı
kadrajda çıkmalı, yoksa haritada biri izometrik biri cepheden durur. Zemin/kaide
istemiyoruz — bina doğrudan köy zeminine oturuyor.

Her binanın kaleden ayrılan bir **renk aksanı** var; haritada 11–14% genişlikte
göründüğü için ayırt edici olan şey çatı rengi ve tepedeki tek nesne.

### bina-savas — Savaş kapısı

```
A LEGO-style toy fortress gatehouse with two square towers flanking a raised
wooden portcullis, deep crimson pointed roofs, crossed steel swords mounted above
the gate, crimson banners hanging from the battlements, torch sconces beside the
doorway. LEGO-style toy building made of chunky moulded bricks, warm beige sandstone walls,
glossy plastic finish, bold saturated colors, clean readable silhouette, front
elevation slightly from above, no ground plane, no base plate, no background,
single building only
```

### bina-is — Odunculuk kulübesi

```
A LEGO-style toy lumberjack cabin with stacked log walls, a green pitched roof,
a big axe embedded in a tree stump beside the door, neat stacks of cut firewood
along the front wall, a sawn log pile on the side, small chimney with a puff of
smoke. LEGO-style toy building made of chunky moulded bricks, warm beige sandstone walls,
glossy plastic finish, bold saturated colors, clean readable silhouette, front
elevation slightly from above, no ground plane, no base plate, no background,
single building only
```

### bina-maden — Maden girişi

```
A LEGO-style toy mine entrance built into a grey rock face, a dark arched tunnel
mouth framed by heavy wooden beams, a crossed pickaxe and shovel sign above the
opening, a wooden minecart on rails coming out of the tunnel loaded with glowing
blue-grey ore chunks, a lantern hanging on a post. LEGO-style toy building made of chunky moulded bricks, warm beige sandstone walls,
glossy plastic finish, bold saturated colors, clean readable silhouette, front
elevation slightly from above, no ground plane, no base plate, no background,
single building only
```

### bina-envanter — Ambar

```
A LEGO-style toy storage barn with wide double wooden doors standing open, a warm
brown pitched roof, wooden crates and barrels stacked just inside the doorway, a
brown leather backpack hanging beside the door, a small loft window with a hoist
beam above. LEGO-style toy building made of chunky moulded bricks, warm beige sandstone walls,
glossy plastic finish, bold saturated colors, clean readable silhouette, front
elevation slightly from above, no ground plane, no base plate, no background,
single building only
```

### bina-dukkan — Dükkan

```
A LEGO-style toy market shop with an open front counter under a striped teal and
white awning, a hanging wooden shop sign with a gold coin painted on it, potions
and small treasure chests displayed on the counter, a teal pitched roof, a stack
of gold coins on the corner of the counter. LEGO-style toy building made of chunky moulded bricks, warm beige sandstone walls,
glossy plastic finish, bold saturated colors, clean readable silhouette, front
elevation slightly from above, no ground plane, no base plate, no background,
single building only
```

> Sprite'a çevirirken **`yaw 0`** kullan: `./sprite.sh bina-savas 0 18`. Tripo binanın
> ön yüzünü +Z'ye koyuyor; `sprite.sh`'in varsayılan `90`'ı tam yandan bakıyor ve
> kapı arkada kalıyor. Doğru açıdan emin değilsen önce sekiz açıyı birden gör:
> `render-kontakt.html?glb=assets/tripo/<id>.glb` (aynı indirme yöntemi, `&dl=<ad>`).

## Köy dekoru

Haritadaki tıklanamayan süs nesneleri (`js/village/map.js` → `DEKOR`). Binalar Tripo'ya
geçince bunlar yassı kaldı — Kenney'nin düz yeşil ağaçları yeni binaların yanında
kâğıt gibi duruyor. Yedi model bütün listeyi karşılıyor; aynı model haritada birkaç
kez farklı boyutta kullanılıyor.

**Ortak stil eki** — dekor promptlarının sonuna:

```
LEGO-style toy scenery piece built from chunky moulded bricks, glossy plastic
finish, bold saturated colors, clean readable silhouette, no ground plane,
no base plate, no background, single object only
```

Binalarınkinden farkı: "bej kumtaşı duvar" ve "cephe görünümü" maddeleri yok. Ağacın
duvarı olmuyor, ve dekor her yönden bakılabilir olduğu için kadraj serbest.

### dekor-cam — Çam ağacı

```
A LEGO-style toy pine tree shaped as one tall narrow cone tapering to a single
point at the top, built from four stacked dark green tiers that get smaller
towards the top, mounted on a short brown cylindrical trunk, the trunk ending
bare at the bottom with nothing underneath it. LEGO-style toy scenery piece built from chunky moulded bricks, glossy plastic
finish, bold saturated colors, clean readable silhouette, no ground plane,
no base plate, no background, single object only
```

> İlk deneme başarısızdı: model dağınık bir yeşil yığın çıktı, koni oluşmadı ve
> altına kırmızı bir taban plakası geldi. Prompt yukarıda sıkılaştırıldı — koninin
> tek tepe noktası ve gövdenin altının boş olduğu açıkça söyleniyor.

### dekor-agac — Yapraklı ağaç

```
A LEGO-style toy broadleaf tree with a round bushy bright green canopy made of
chunky leaf bricks and a thick brown trunk with two short branches. LEGO-style toy scenery piece built from chunky moulded bricks, glossy plastic
finish, bold saturated colors, clean readable silhouette, no ground plane,
no base plate, no background, single object only
```

### dekor-kutuk — Kütük ve odun yığını

```
A LEGO-style toy tree stump with visible growth rings on top and an axe stuck in
it, a small stack of cut brown firewood logs leaning against the side. LEGO-style toy scenery piece built from chunky moulded bricks, glossy plastic
finish, bold saturated colors, clean readable silhouette, no ground plane,
no base plate, no background, single object only
```

### dekor-cevher — Cevher kayası

```
A LEGO-style toy grey boulder cluster with glowing ice-blue crystal shards growing
out of the top and one crystal broken off at the base. LEGO-style toy scenery piece built from chunky moulded bricks, glossy plastic
finish, bold saturated colors, clean readable silhouette, no ground plane,
no base plate, no background, single object only
```

### dekor-tas — Taş kümesi

```
A LEGO-style toy cluster of three smooth grey rounded rocks of different sizes
with a few small green grass tufts between them. LEGO-style toy scenery piece built from chunky moulded bricks, glossy plastic
finish, bold saturated colors, clean readable silhouette, no ground plane,
no base plate, no background, single object only
```

### dekor-ev-a — Köylü evi (kırmızı çatı)

```
A small LEGO-style toy cottage with warm beige sandstone brick walls, a steep
brick-red pitched roof, one brown wooden door and two square windows with white
frames, a short chimney on the roof. LEGO-style toy scenery piece built from chunky moulded bricks, glossy plastic
finish, bold saturated colors, clean readable silhouette, no ground plane,
no base plate, no background, single object only
```

### dekor-ev-b — Köylü evi (mavi çatı)

```
A small LEGO-style toy cottage with warm beige sandstone brick walls, a steep
slate-blue pitched roof, a brown wooden door with a small porch awning, one round
window in the gable, a wooden barrel beside the door. LEGO-style toy scenery piece built from chunky moulded bricks, glossy plastic
finish, bold saturated colors, clean readable silhouette, no ground plane,
no base plate, no background, single object only
```

> Evler `yaw 0` ile render edilmeli (binalarla aynı sebep, kapı öne baksın).
> Ağaç/kaya/kütükte ön yüz kavramı yok; yine de `render-kontakt.html` ile bakıp
> silüeti en dolgun görünen açıyı seç.

## İkinci parti — düşmanlar

Sahada en çok görünenler bunlar; oyuncu karakterleri bittikten sonra sıra bunlarda.
Renk kodları `js/battle/scene.js` içindeki `DUSMAN` tablosundan alındı.

### asker — düşman askeri

```
A LEGO-style minifigure soldier in dull grey steel armor and a grey helmet,
dark grey cape, holding a short sword and a round shield, grim expression. stylized toy figure, glossy injection-molded plastic, chunky simplified shapes,
bold saturated colors, clean readable silhouette, full body, standing upright,
arms clear of the torso, no base, no pedestal, no background, single figure only
```

### okcu — düşman okçusu

```
A LEGO-style minifigure archer in dark forest green armor and a green helmet,
holding a short bow with an arrow nocked, stern expression. stylized toy figure, glossy injection-molded plastic, chunky simplified shapes,
bold saturated colors, clean readable silhouette, full body, standing upright,
arms clear of the torso, no base, no pedestal, no background, single figure only
```

### boss — Boss

```
A large hulking LEGO-style ogre boss in dark blood-red armor with black iron spikes
on the shoulders, horned helmet, glowing red eyes, holding a massive spiked club,
menacing pose, twice the bulk of a normal minifigure. stylized toy figure, glossy injection-molded plastic, chunky simplified shapes,
bold saturated colors, clean readable silhouette, full body, standing upright,
arms clear of the torso, no base, no pedestal, no background, single figure only
```
