# Royal Battle v3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (veya subagent-driven-development). Görevleri sırayla uygula; her görevin sonunda test + screenshot doğrulaması ve Türkçe commit.

**Goal:** v2 üzerine 5 iyileştirme: karakter animasyonları, ses düğmesi, tüfek işlevi, maden mini-oyunu, düşman çeşitliliği + boss.

**Bağlam (v1+v2'den):**
- Statik site, bundler yok: `index.html` + ES modülleri + importmap (`vendor/three.module.js` r170).
- SAF çekirdek (`js/state.js`, `js/balance.js`, `js/battle/sim.js`) DOM/Three importlamaz; `node --test tests/*.test.mjs` ile test edilir (şu an 30/30 yeşil). **Dizin formu `node --test tests/` Node 22'de kırık — glob kullan.**
- Screenshot: `./serve.sh` (8080) + `./shot.sh <png> [fragment] [sn]`. `--disable-gpu` YOK (WebGL kırılır). Eski headless RAF'ı seyrek pompalar → savaş simi sabit adımlı (scene.js'te hazır). Canlı etkileşim testi: chrome-devtools MCP + izole context + `PointerEvent` dispatch (örnekleri git geçmişindeki doğrulamalarda).
- `?debug=1` hataları footer'a yazar; `#savas` gibi hash ile ekran direkt açılır; `?autobattle=1` savaşçıyı otomatik sürer.
- Karakter statları test kilitli (Aslan'ın tablosu) — DEĞİŞTİRME. `enemyWave` serbest.
- Commit mesajları Türkçe + `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`; her görev sonunda commit + `git push origin main`.
- Deploy: `vercel deploy --prod --yes` (CLI kurulu, oturum açık) → https://royal-battle.vercel.app. `.env` ve `.vercelignore` dokunma.
- Görsel değişikliklerde Aslan onay kapısı: screenshot'ları SendUserFile ile gönder.

### Task 1: Karakter animasyonları
- `assets/kenney/blocky-characters/character-a.glb` içinde **27 animasyon klibi** var (idle/walk/attack vb. — adlarını `gltf.animations` listesinden çıkar; `js/characters/builder.js` şu an `g => g.scene` alıyor, animasyonlar için `gltf`'in tamamı lazım).
- `builder.js`: `buildCharacter(id)` dönüşüne `{model, mixer, clips}` benzeri yapı ekle ya da model.userData'ya koy. Kutu-inşa karakterler (ejderha, dinozor, çiçek) için animasyon yok — hafif sallanma (sin dalgasıyla rotation.z) yeterli.
- `battle/scene.js`: her mesh için `THREE.AnimationMixer`; birim hareket halindeyken walk, menzilde+cooldown sıfırlanınca attack klibi; ölünce mesh kaldırılıyor (mevcut). `mixer.update(dt)` animasyon döngüsünde.
- Doğrulama: `?autobattle=1` + iki screenshot (poz farkı görülmeli); charviewer.html hâlâ çalışmalı.

### Task 2: Ses aç/kapa düğmesi
- HUD'a 🔊/🔇 butonu (`index.html` + `css/game.css`, min 44px). `js/ui/sound.js`'e `sfx.enabled` bayrağı + `localStorage["royal-battle-ses"]` kalıcılığı. `ton()` başında `if (!sfx.enabled) return`.
- Test gerekmez (DOM); screenshot ile buton görünürlüğü doğrula.

### Task 3: Tüfek işlevi
- SAF (`sim.js`): `equipRifle(battle, unit)` → birime `range: 8, atk +10` (tek kullanımlık eşya). TDD: tüfekli savaşçı uzaktan vurur; envanterden düşer (UI katmanında).
- UI (`battle/scene.js`): envanterde `tufek` varsa aksiyon şeridine "🔫 Tüfek ×N" butonu; basınca "sonraki sürülen birime uygulanır" (bekleyen bayrak) ya da seçili sahadaki son birime uygula — basit olanı seç, akışı `map-hint` satırında açıkla.
- Satış fiyatı zaten var (30). Ganimet tablosuna `tufek` ekle (`LOOT_TABLE`) ki kazanılabilsin — testini güncelle.

### Task 4: Maden mini-oyunu (💎 kaynağı)
- Köyde yeni iş alanı: `village/scene.js` LAYOUT'a maden taşları (`bricks.glb` / `stairs-stone.glb` parçalarından kompozisyon) + `tap: 'maden'` → `s-maden` ekranı.
- `index.html`: `<section class="screen" id="s-maden"><div id="mine-ui"></div></section>`; sekmelere EKLEME (5 sekme kalsın; madene köyden girilir — İş alanı gibi).
  - DİKKAT: `screens.js` sekme senkronu `data-s` üzerinden; sekmesiz ekran açılınca hiçbir sekme aktif olmaz, sorun değil.
- `js/ui/mining.js` (woodcutting kalıbı): 8 kayalık tur; kayaya 3 dokunuş = kırılır (odundan farkı: çok vuruşlu), kırılınca %35 ihtimalle 1–3 💎 (`addGems`), yoksa 1 altın teselli. SAF kısım `mineReward(state, rng)` TDD ile: rng kontrollü taş/altın dağılımı, tur ekonomisi (beklenen ~4-8 taş/tur — Kara Ruh 2600 taş ≈ makul emekle ulaşılabilir olsun).
- `balance.js`: `MINE = {chance: 0.35, min: 1, max: 3, tapsPerRock: 3, rocks: 8}` sabitleri + test.
- Screenshot: köyde maden alanı + maden ekranı.

### Task 5: Düşman çeşitliliği + boss
- `balance.js` `enemyWave(level)` zenginleştir (testleriyle):
  - Kara birlik: mevcut yakın dövüşçü (`range 1.8`).
  - `level >= 3`: dalgaya menzilli "düşman okçusu" karışır (`range 6, atk 60, def 30, spd 90` taban ×k).
  - Her 5. seviye **boss**: tek dev birim (`atk 90, def 220, spd 40, range 2.2` ×k) + normal dalga yarıya iner. `enemyWave` dönüş elemanlarına `tip: 'asker'|'okcu'|'boss'` alanı ekle.
- `battle/scene.js` / `builder.js`: `dusman-okcu` (gri + yeşil kapüşonsuz yay) ve `boss` (2.5 ölçekli koyu kırmızı insansı) builder'ları; `unitEkle`'ye tip geç.
- Boss zaferi ödülü: `battleRewards`'a dokunmadan scene'de boss seviyesinde altını ×2 (goldMult ile çarpışmasın; ayrı katsayı) — testli SAF yardımcı: `isBossLevel(level)`.
- Doğrulama: `?autobattle=1` yerine izole MCP ile seviye 5 kaydı kur, boss görünümü + zafer/yenilgi akışı; screenshot.

### Kapanış
- `node --test tests/*.test.mjs` hepsi yeşil; tam akış smoke (odun→maden→dükkan→savaş→envanter→yenile).
- Aslan onayı: yeni görseller (animasyon kareleri, maden, boss) SendUserFile ile.
- `git push origin main` + `vercel deploy --prod --yes` → canlı URL'de curl 200 kontrolü.
