# Royal Battle v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aslan Yıldız'ın tasarımından, iPad Safari'de dokunmatik oynanan 3D tarayıcı oyunu Royal Battle'ın ilk oynanabilir sürümünü (v1) üretmek.

**Architecture:** Bundler'sız statik site: `index.html` + ES modülleri + importmap ile vendor'lanmış Three.js. Oyun mantığı (ekonomi, savaş simülasyonu, denge) DOM/3D'den ayrı saf JS modüllerinde yaşar ve `node --test` ile test edilir; 3D sahneler ve DOM ekranları bu saf çekirdeği kullanır ve headless Chrome ekran görüntüsüyle doğrulanır.

**Tech Stack:** Three.js (r170, vendored), vanilla JS (ES modules), `node --test` (sıfır bağımlılık), `python3 -m http.server` (dev server), Kenney CC0 asset'leri (Retro Fantasy Kit, Blocky Characters, UI Pack).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-08-royal-battle-design.md` — çelişkide spec kazanır.
- Karakter statları spec'teki tabloyla birebir; kod içinde değiştirilemez (test korur).
- Tüm UI metinleri Türkçe (doğru diakritiklerle: "Savaşçı", "Büyücü", "Dükkan").
- Gerçek para satın alması yoktur; eklenmez.
- Dokunmatik öncelikli: her etkileşim `pointerdown/move/up` ile (mouse otomatik çalışır); dokunma hedefleri ≥ 44px.
- Kayıt anahtarı: `localStorage["royal-battle-save-v1"]`.
- Açılışta görünür metin: `Grafikler: Kenney.nl — Tasarım: Aslan Yıldız`.
- iPad performansı: `renderer.setPixelRatio(Math.min(devicePixelRatio, 2))`, gölgeler kapalı, tek `directionalLight` + `ambientLight`.
- Ödüller: savaş zaferi = 25 altın + 1 ganimet + %20 ihtimalle 5–15 yeşil taş; odun = 2 altın/odun.
- Commit mesajları Türkçe, sonunda `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.

## File Structure

```
royal-battle/
├── index.html              # importmap, ekran kapları, HUD
├── css/game.css            # tüm stiller (mockup paletinden türetilir)
├── js/
│   ├── main.js             # boot: state yükle, ekran yöneticisi, HUD bağla
│   ├── screens.js          # ekran geçişi (show/hide), ekran kayıt API'si
│   ├── state.js            # SAF: oyun durumu, ekonomi, envanter, save/load
│   ├── balance.js          # SAF: karakter statları, fiyatlar, ödül sabitleri
│   ├── battle/sim.js       # SAF: savaş simülasyonu (tick tabanlı)
│   ├── battle/scene.js     # 3D savaş arenası (sim'i çizer)
│   ├── village/scene.js    # 3D köy sahnesi (bina yerleşimi, tap → ekran)
│   ├── characters/builder.js # blok karakter inşası + giydirme
│   └── ui/
│       ├── hud.js          # altın/taş sayaçları
│       ├── woodcutting.js  # odun kesme mini-oyunu (DOM)
│       ├── inventory.js    # envanter ızgarası (DOM)
│       └── shop.js         # karakter dükkanı (DOM)
├── vendor/                 # three.module.js, GLTFLoader.js
├── assets/
│   ├── kenney/             # indirilen GLB/PNG'ler + LICENSE.txt
│   └── cards/              # karakter kartı görselleri (başlangıçta taramalar)
├── tests/                  # *.test.mjs (node --test)
├── serve.sh                # python3 -m http.server 8080
└── shot.sh                 # headless Chrome ekran görüntüsü yardımcısı
```

---

### Task 1: Proje iskeleti + Three.js vendor + boş sahne

**Files:**
- Create: `index.html`, `css/game.css`, `js/main.js`, `js/screens.js`, `serve.sh`, `shot.sh`, `vendor/three.module.js`, `vendor/GLTFLoader.js`, `.gitignore`

**Interfaces:**
- Produces: `screens.register(id, {onShow})`, `screens.show(id)`; `index.html` içinde `<section class="screen" id="s-koy|s-savas|s-is|s-envanter|s-dukkan">` kapları ve `<div id="hud">`.

- [ ] **Step 1: Vendor dosyalarını indir**

```bash
mkdir -p vendor css js/battle js/village js/characters js/ui assets/kenney assets/cards tests
curl -fsSL -o vendor/three.module.js https://unpkg.com/three@0.170.0/build/three.module.js
curl -fsSL -o vendor/GLTFLoader.js https://unpkg.com/three@0.170.0/examples/jsm/loaders/GLTFLoader.js
ls -la vendor/   # her iki dosya > 100KB / > 30KB olmalı
```

- [ ] **Step 2: index.html yaz**

```html
<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<title>Royal Battle</title>
<link rel="stylesheet" href="css/game.css">
<script type="importmap">
{"imports": {"three": "./vendor/three.module.js",
             "three/addons/loaders/GLTFLoader.js": "./vendor/GLTFLoader.js"}}
</script>
</head>
<body>
<div id="hud">
  <span class="logo">Royal Battle</span>
  <span class="pill" id="hud-gold">🪙 <b id="gold-n">0</b></span>
  <span class="pill" id="hud-gem">💎 <b id="gem-n">0</b></span>
</div>
<main>
  <section class="screen" id="s-koy"><canvas id="village-canvas"></canvas></section>
  <section class="screen" id="s-savas"><canvas id="battle-canvas"></canvas><div id="battle-ui"></div></section>
  <section class="screen" id="s-is"><div id="wood-ui"></div></section>
  <section class="screen" id="s-envanter"><div id="inv-ui"></div></section>
  <section class="screen" id="s-dukkan"><div id="shop-ui"></div></section>
</main>
<nav id="tabs">
  <button data-s="s-koy">Köy</button><button data-s="s-savas">Savaş</button>
  <button data-s="s-is">İş</button><button data-s="s-envanter">Envanter</button>
  <button data-s="s-dukkan">Dükkan</button>
</nav>
<footer id="credits">Grafikler: Kenney.nl — Tasarım: Aslan Yıldız</footer>
<script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 3: screens.js yaz**

```js
// js/screens.js — ekran yöneticisi. Ekranlar kayıt olur, show() geçiş yapar.
const registry = new Map();
export function register(id, handlers = {}) { registry.set(id, handlers); }
export function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.s === id));
  registry.get(id)?.onShow?.();
}
export function initTabs() {
  document.querySelectorAll('#tabs button').forEach(b =>
    b.addEventListener('click', () => show(b.dataset.s)));
}
```

- [ ] **Step 4: main.js'e boot + boş Three.js köy sahnesi koy** (yeşil zemin + gökyüzü — asset'ler Task 5'te gelir)

```js
// js/main.js
import * as THREE from 'three';
import { initTabs, show, register } from './screens.js';

initTabs();
const canvas = document.getElementById('village-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bcfe0);
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
camera.position.set(0, 22, 18); camera.lookAt(0, 0, 0);
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const sun = new THREE.DirectionalLight(0xffffff, 1.2); sun.position.set(10, 20, 8); scene.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshLambertMaterial({ color: 0x74b35c }));
ground.rotation.x = -Math.PI / 2; scene.add(ground);
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
register('s-koy', { onShow: resize });
show('s-koy');
renderer.setAnimationLoop(() => renderer.render(scene, camera));
```

- [ ] **Step 5: game.css yaz** — mockup paleti: `--sky:#9BCFE0 --grass:#74B35C --ink:#2B2117 --parch:#F5EBD3 --gold:#E9B33C --gem:#2FBE6B`. `.screen{display:none}.screen.active{display:block}`, canvas'lar `width:100%;height:100%`, `#tabs` alt sabit 5 buton (min-height 48px), `#hud` üst sabit. (Mockup `scratchpad/mockup-template.html`'deki HUD/nav stilleri temel alınabilir; kopyala, sadeleştir.)

- [ ] **Step 6: serve.sh + shot.sh yaz, elle doğrula**

```bash
cat > serve.sh <<'SH'
#!/bin/sh
python3 -m http.server 8080
SH
cat > shot.sh <<'SH'
#!/bin/sh
# Kullanım: ./shot.sh <çıktı.png> [url-fragment]
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless --disable-gpu --user-data-dir=/tmp/rb-shot-profile \
  --window-size=1180,820 --screenshot="$1" "http://localhost:8080/$2" 2>/dev/null &
P=$!; sleep 12; kill $P 2>/dev/null; ls -la "$1"
SH
chmod +x serve.sh shot.sh
./serve.sh &   # arka planda
sleep 1 && ./shot.sh /tmp/rb-task1.png
```

Ekran görüntüsünü Read ile aç. Beklenen: üstte HUD, ortada mavi gök + yeşil zemin, altta 5 sekme, footer'da Kenney/Aslan Yıldız yazısı. Konsol hatası kontrolü: `curl -s http://localhost:8080/js/main.js | head -1` modül yükleniyor mu.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "İskelet: importmap + Three.js boş köy sahnesi + ekran yöneticisi"
```

---

### Task 2: state.js — ekonomi, envanter, kayıt (TDD)

**Files:**
- Create: `js/state.js`, `tests/state.test.mjs`

**Interfaces:**
- Produces: `createState()`, `addGold(s,n)`, `spendGold(s,n)→bool`, `addGems(s,n)`, `spendGems(s,n)→bool`, `addItem(s,itemId,qty)`, `ownCharacter(s,charId)`, `serialize(s)→string`, `deserialize(str)→state`, `save(s,storage)`, `load(storage)→state`. State şekli: `{gold, gems, ownedCharacters:[], inventory:{itemId:qty}, battleLevel}`.

- [ ] **Step 1: Başarısız testleri yaz** (`tests/state.test.mjs`)

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, addGold, spendGold, addGems, spendGems,
         addItem, ownCharacter, serialize, deserialize, save, load } from '../js/state.js';

test('yeni oyun: 100 altın, 0 taş, sadece savaşçı, boş envanter, seviye 1', () => {
  const s = createState();
  assert.equal(s.gold, 100); assert.equal(s.gems, 0);
  assert.deepEqual(s.ownedCharacters, ['savasci']);
  assert.deepEqual(s.inventory, {}); assert.equal(s.battleLevel, 1);
});
test('altın ekleme ve harcama', () => {
  const s = createState();
  addGold(s, 25); assert.equal(s.gold, 125);
  assert.equal(spendGold(s, 125), true); assert.equal(s.gold, 0);
  assert.equal(spendGold(s, 1), false); assert.equal(s.gold, 0); // yetersizse reddet
});
test('taş harcama yetersizse reddedilir', () => {
  const s = createState(); addGems(s, 10);
  assert.equal(spendGems(s, 11), false); assert.equal(s.gems, 10);
  assert.equal(spendGems(s, 10), true); assert.equal(s.gems, 0);
});
test('envanter adet toplar', () => {
  const s = createState();
  addItem(s, 'odun', 30); addItem(s, 'odun', 5); addItem(s, 'kalkan', 1);
  assert.deepEqual(s.inventory, { odun: 35, kalkan: 1 });
});
test('karakter sahipliği tekrarsız', () => {
  const s = createState();
  ownCharacter(s, 'okcu'); ownCharacter(s, 'okcu');
  assert.deepEqual(s.ownedCharacters, ['savasci', 'okcu']);
});
test('serialize/deserialize kayıpsız', () => {
  const s = createState(); addGold(s, 7); addItem(s, 'odun', 3); s.battleLevel = 4;
  assert.deepEqual(deserialize(serialize(s)), s);
});
test('save/load localStorage benzeri storage ile çalışır, bozuk kayıtta yeni oyun', () => {
  const mem = { data: {}, setItem(k, v) { this.data[k] = v; }, getItem(k) { return this.data[k] ?? null; } };
  const s = createState(); addGold(s, 50); save(s, mem);
  assert.deepEqual(load(mem), s);
  mem.data['royal-battle-save-v1'] = '{bozuk';
  assert.deepEqual(load(mem), createState());
});
```

- [ ] **Step 2: Çalıştır, FAIL gör**: `node --test tests/state.test.mjs` → "Cannot find module ../js/state.js"

- [ ] **Step 3: state.js'i yaz**

```js
// js/state.js — SAF oyun durumu. DOM/Three.js import ETMEZ.
export const SAVE_KEY = 'royal-battle-save-v1';
export function createState() {
  return { gold: 100, gems: 0, ownedCharacters: ['savasci'], inventory: {}, battleLevel: 1 };
}
export function addGold(s, n) { s.gold += n; }
export function spendGold(s, n) { if (s.gold < n) return false; s.gold -= n; return true; }
export function addGems(s, n) { s.gems += n; }
export function spendGems(s, n) { if (s.gems < n) return false; s.gems -= n; return true; }
export function addItem(s, id, qty) { s.inventory[id] = (s.inventory[id] ?? 0) + qty; }
export function ownCharacter(s, id) { if (!s.ownedCharacters.includes(id)) s.ownedCharacters.push(id); }
export function serialize(s) { return JSON.stringify(s); }
export function deserialize(str) { return JSON.parse(str); }
export function save(s, storage = localStorage) { storage.setItem(SAVE_KEY, serialize(s)); }
export function load(storage = localStorage) {
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return createState();
    const s = deserialize(raw);
    if (typeof s.gold !== 'number') return createState();
    return s;
  } catch { return createState(); }
}
```

- [ ] **Step 4: Testler PASS**: `node --test tests/state.test.mjs`

- [ ] **Step 5: Commit**: `git add -A && git commit -m "state.js: ekonomi, envanter, kayıt (testli)"`

---

### Task 3: balance.js — karakterler, fiyatlar, ödüller (TDD)

**Files:**
- Create: `js/balance.js`, `tests/balance.test.mjs`

**Interfaces:**
- Produces: `CHARACTERS` (dizi; `{id, name, tier:'normal'|'ultra'|'invisible', atk, def, spd, range, cost:{gold?|gems?}, card}`), `WOOD_GOLD=2`, `BATTLE_WIN_GOLD=25`, `GEM_DROP={chance:0.2,min:5,max:15}`, `LOOT_TABLE=['kalkan','kilic','yay','guc-iksiri','altin-iksir']`, `ITEM_NAMES={odun:'Odun',kalkan:'Kalkan',kilic:'Kılıç',yay:'Yay',tufek:'Tüfek','guc-iksiri':'Güç İksiri','altin-iksir':'Altın İksir','mega-deprem-iksiri':'Mega Deprem İksiri'}`, `enemyWave(level)→[{atk,def,spd,range}]`.

- [ ] **Step 1: Başarısız test — statlar spec'le birebir**

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTERS, WOOD_GOLD, BATTLE_WIN_GOLD, GEM_DROP, enemyWave } from '../js/balance.js';

const byId = Object.fromEntries(CHARACTERS.map(c => [c.id, c]));
test('statlar spec tablosuyla birebir (Aslan\'ın kararı, değiştirilemez)', () => {
  const spec = {
    savasci: [50, 94, 75], okcu: [89, 30, 100], buyucu: [98, 89, 69],
    'buz-ejderhasi': [91, 50, 92], 'maden-dinozoru': [100, 100, 21],
    'altin-ordu': [100, 100, 100], 'altin-bomba-cicegi': [100, 100, 100],
    'kara-ruh': [101, 101, 101],
  };
  for (const [id, [atk, def, spd]] of Object.entries(spec)) {
    assert.equal(byId[id].atk, atk, id); assert.equal(byId[id].def, def, id);
    assert.equal(byId[id].spd, spd, id);
  }
});
test('tier ve para birimi: normal→altın, ultra/invisible→taş; savaşçı bedava', () => {
  assert.equal(byId.savasci.cost.gold, 0);
  for (const c of CHARACTERS) {
    if (c.tier === 'normal') assert.ok('gold' in c.cost, c.id);
    else assert.ok('gems' in c.cost, c.id);
  }
  assert.equal(byId['kara-ruh'].cost.gems, 2600); // en pahalı taş karakteri
  assert.ok(byId['kara-ruh'].cost.gems > byId['altin-ordu'].cost.gems);
  assert.ok(byId['kara-ruh'].cost.gems > byId['altin-bomba-cicegi'].cost.gems);
});
test('ödül sabitleri spec ile aynı', () => {
  assert.equal(WOOD_GOLD, 2); assert.equal(BATTLE_WIN_GOLD, 25);
  assert.equal(GEM_DROP.chance, 0.2);
});
test('düşman dalgası seviyeyle büyür ve güçlenir', () => {
  assert.equal(enemyWave(1).length, 3);
  assert.equal(enemyWave(10).length, 6); // tavan 6
  assert.ok(enemyWave(5)[0].atk > enemyWave(1)[0].atk);
});
```

- [ ] **Step 2: FAIL gör**: `node --test tests/balance.test.mjs`

- [ ] **Step 3: balance.js yaz**

```js
// js/balance.js — SAF denge verisi. Statlar Aslan Yıldız'ın tasarımı; DEĞİŞTİRME.
export const CHARACTERS = [
  { id: 'savasci', name: 'Savaşçı', tier: 'normal', atk: 50, def: 94, spd: 75, range: 1.8, cost: { gold: 0 }, card: 'assets/cards/savasci.jpg' },
  { id: 'okcu', name: 'Okçu', tier: 'normal', atk: 89, def: 30, spd: 100, range: 6, cost: { gold: 750 }, card: 'assets/cards/okcu.jpg' },
  { id: 'buyucu', name: 'Büyücü', tier: 'normal', atk: 98, def: 89, spd: 69, range: 6, cost: { gold: 1200 }, card: 'assets/cards/buyucu.jpg' },
  { id: 'buz-ejderhasi', name: 'Buz Ejderhası', tier: 'normal', atk: 91, def: 50, spd: 92, range: 6, cost: { gold: 2000 }, card: 'assets/cards/buz-ejderhasi.jpg' },
  { id: 'maden-dinozoru', name: 'Maden Dinozoru', tier: 'normal', atk: 100, def: 100, spd: 21, range: 1.8, cost: { gold: 3000 }, card: 'assets/cards/maden-dinozoru.jpg' },
  { id: 'altin-ordu', name: 'Altın Ordu', tier: 'ultra', atk: 100, def: 100, spd: 100, range: 1.8, cost: { gems: 800 }, card: 'assets/cards/altin-ordu.jpg' },
  { id: 'altin-bomba-cicegi', name: 'Altın Bomba Çiçeği', tier: 'ultra', atk: 100, def: 100, spd: 100, range: 6, cost: { gems: 1000 }, card: 'assets/cards/altin-bomba-cicegi.jpg' },
  { id: 'kara-ruh', name: 'Kara Ruh', tier: 'invisible', atk: 101, def: 101, spd: 101, range: 1.8, cost: { gems: 2600 }, card: 'assets/cards/kara-ruh.jpg' },
];
export const WOOD_GOLD = 2;
export const BATTLE_WIN_GOLD = 25;
export const GEM_DROP = { chance: 0.2, min: 5, max: 15 };
export const LOOT_TABLE = ['kalkan', 'kilic', 'yay', 'guc-iksiri', 'altin-iksir'];
export const ITEM_NAMES = {
  odun: 'Odun', kalkan: 'Kalkan', kilic: 'Kılıç', yay: 'Yay', tufek: 'Tüfek',
  'guc-iksiri': 'Güç İksiri', 'altin-iksir': 'Altın İksir', 'mega-deprem-iksiri': 'Mega Deprem İksiri',
};
export function enemyWave(level) {
  const n = Math.min(2 + level, 6);
  const k = 1 + 0.08 * (level - 1);
  return Array.from({ length: n }, () => ({
    atk: Math.round(45 * k), def: Math.round(60 * k), spd: 70, range: 1.8,
  }));
}
```

- [ ] **Step 4: PASS gör**, **Step 5: Commit** `"balance.js: statlar, fiyatlar, ödüller (spec'e test kilidi)"`

---

### Task 4: HUD + kayıt entegrasyonu

**Files:**
- Create: `js/ui/hud.js`
- Modify: `js/main.js` (state yükle, HUD bağla, her değişimde save)

**Interfaces:**
- Consumes: `state.js` (load, save), Task 1'deki `#gold-n`, `#gem-n`.
- Produces: `initHud(state)`, `refreshHud(state)` — diğer tüm ekranlar para değişince `refreshHud` çağırır; `main.js` global `gameState` export eder: `export const gameState = load()`.

- [ ] **Step 1: hud.js yaz**

```js
// js/ui/hud.js
import { save } from '../state.js';
const fmt = n => n.toLocaleString('tr-TR');
export function refreshHud(state) {
  document.getElementById('gold-n').textContent = fmt(state.gold);
  document.getElementById('gem-n').textContent = fmt(state.gems);
  save(state);
}
export function initHud(state) { refreshHud(state); }
```

- [ ] **Step 2: main.js'e bağla**: `import { load } from './state.js'; export const gameState = load();` + `initHud(gameState)`.
- [ ] **Step 3: Doğrula**: `./shot.sh /tmp/rb-task4.png` → HUD'da "100" altın görünmeli. Konsolda `localStorage` üzerinden ikinci yüklemede değerin korunduğunu kontrol etmek için: sayfayı iki kez screenshot'la; değer aynı kalmalı.
- [ ] **Step 4: Commit** `"HUD: altın/taş sayaçları + otomatik kayıt"`

---

### Task 5: Kenney asset'lerini indir ve depola

**Files:**
- Create: `assets/kenney/retro-fantasy/` (GLB'ler), `assets/kenney/blocky-characters/` (GLB'ler), `assets/kenney/LICENSE.txt`

- [ ] **Step 1: Paketleri indir** — Kenney zip linkleri sayfa içinden gelir; şu komutla bul ve indir:

```bash
for slug in retro-fantasy-kit blocky-characters; do
  url=$(curl -fsSL "https://kenney.nl/assets/$slug" | grep -oE 'https://[^"]+\.zip' | head -1)
  echo "$slug -> $url"; curl -fsSL -o "/tmp/$slug.zip" "$url"
done
```

Eğer grep link bulamazsa: `curl -fsSL https://kenney.nl/assets/<slug> | grep -i download` çıktısındaki gerçek href'i kullan (bazı sürümlerde `/media/.../kenney_<slug>.zip` biçimindedir). İkisi de başarısızsa DUR ve kullanıcıya indirme linkini elle sor — placeholder asset üretme.

- [ ] **Step 2: Aç, GLB'leri kopyala**

```bash
unzip -o /tmp/retro-fantasy-kit.zip -d /tmp/rfk && find /tmp/rfk -name "*.glb" | head -20
mkdir -p assets/kenney/retro-fantasy assets/kenney/blocky-characters
find /tmp/rfk -name "*.glb" -exec cp {} assets/kenney/retro-fantasy/ \;
unzip -o /tmp/blocky-characters.zip -d /tmp/bc && find /tmp/bc -name "*.glb" -exec cp {} assets/kenney/blocky-characters/ \;
printf "Assets: Kenney (kenney.nl), CC0 1.0 Universal.\nRetro Fantasy Kit + Blocky Characters.\n" > assets/kenney/LICENSE.txt
du -sh assets/kenney/
```

GLB isimlerini listele ve bir sonraki görevlerde kullanılacakları not et (ör. `castle.glb`, `house.glb`, `tree.glb` benzeri adlar — gerçek adlar pakete göre değişir; Task 6'da bu listeden seçilir).

- [ ] **Step 3: Commit** `"Kenney CC0 asset'leri: Retro Fantasy Kit + Blocky Characters"` (GLB'ler repoya girer; toplam < 50MB beklenir, kontrol et)

---

### Task 6: 3D Köy sahnesi

**Files:**
- Create: `js/village/scene.js`
- Modify: `js/main.js` (köy sahnesini scene.js'e taşı)

**Interfaces:**
- Consumes: Task 5 GLB'leri, `screens.show`.
- Produces: `initVillage({canvas, onBuildingTap})` — `onBuildingTap('is'|'asker'|'savas'|'envanter')` çağırır. Bina yerleşimi spec §2.1 / Aslan'ın haritası: kale merkez, evler sol, iş alanı sağ üst, market+shop+fırın sağ alt, asker alma orta alt, top solda, savaş kapısı sağ kenar.

- [ ] **Step 1: scene.js yaz** — GLTFLoader ile GLB yükleme yardımcı fonksiyonu + yerleşim tablosu:

```js
// js/village/scene.js (çekirdek parçalar — tam dosya bu yapıda)
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
const loader = new GLTFLoader();
const loadGLB = url => new Promise((res, rej) => loader.load(url, g => res(g.scene), undefined, rej));
// YERLEŞİM: [glbAdı, x, z, ölçek, döndürY, tapHedefi|null]
// GLB adlarını Task 5'te çıkan gerçek listeden seç; bulunamayanı en yakın adla değiştir.
const LAYOUT = [
  ['castle', 0, -4, 1, 0, null],
  ['house', -10, -4, 1, 0.4, null], ['house', -12, 0, 1, 0, null], ['house', -8, 2, 1, -0.3, null],
  ['tree', -12, -9, 1, 0, null], ['tree', -10, -10, 1.2, 0, null], ['tree', -14, -7, 0.9, 0, null],
  ['tree', 10, -8, 1, 0, 'is'], ['tree', 12, -7, 1.1, 0, 'is'],
  ['market', 8, 4, 1, Math.PI, 'envanter'], ['house', 12, 5, 1, Math.PI, 'envanter'], ['house', 9, 8, 1, Math.PI, 'envanter'],
  ['barracks', 0, 7, 1, 0, 'asker'],
  ['gate', 16, 0, 1, -Math.PI / 2, 'savas'],
];
export async function initVillage({ canvas, onBuildingTap }) {
  // renderer/camera/lights Task 1'deki gibi; global constraint'lere uy.
  // Her LAYOUT satırı: glb yükle (aynı adı cache'le), konumla, tapHedefi varsa
  // mesh.userData.tap = hedef yap.
  // Raycast: pointerdown+pointerup arası < 8px kayma ise "tap" say:
  //   raycaster.setFromCamera(ndc, camera); intersectObjects(scene.children, true)
  //   → ilk atanın ancestor'larında userData.tap ara → onBuildingTap(tap).
  // Kamera kaydırma: pointermove sırasında camera.position.x/z'yi delta ile taşı,
  //   x∈[-12,12], z∈[8,26] aralığına kelepçele.
}
```

Yerleşim/etkileşim kodunun tamamı bu görevde yazılır — raycast tap ve kamera pan yukarıdaki tarife göre ~80 satır. `onBuildingTap` main.js'te `screens.show('s-' + hedefEkran)` çağırır (`is→s-is`, `asker→s-dukkan`, `savas→s-savas`, `envanter→s-envanter`).

- [ ] **Step 2: Doğrula** — `./shot.sh /tmp/rb-task6.png` → köy binaları Aslan'ın haritası düzeninde görünmeli. GLB adları tutmadıysa konsol 404'lerini `curl -s localhost:8080/... ` ile kontrol et, LAYOUT'u gerçek dosya adlarıyla düzelt, tekrar screenshot.
- [ ] **Step 3: Commit** `"3D köy: Retro Fantasy binaları, Aslan'ın harita yerleşimi, tap + kamera pan"`

---

### Task 7: Odun kesme mini-oyunu

**Files:**
- Create: `js/ui/woodcutting.js`, `tests/woodcutting.test.mjs`
- Modify: `js/main.js` (register)

**Interfaces:**
- Consumes: `gameState`, `addGold`, `addItem`, `refreshHud`, `WOOD_GOLD`.
- Produces: `initWoodcutting(state)` → `#wood-ui` içine 10 odunlu tur kurar; `resetRound()` her `onShow`'da yeni tur. SAF kısım: `export function chopReward(state) { addGold(state, WOOD_GOLD); addItem(state, 'odun', 1); }`

- [ ] **Step 1: Test yaz** (saf kısım): `chopReward` 1 çağrıda +2 altın +1 odun; 10 çağrıda +20/+10.
- [ ] **Step 2: FAIL** → **Step 3: woodcutting.js yaz** — DOM: mockup'taki `.log` düzeni (10 buton, tıklayınca `cut` sınıfı + `chopReward` + `refreshHud`; hepsi kesilince "Tur bitti! +20 🪙 — Tekrar" butonu).
- [ ] **Step 4: PASS + screenshot** (`show('s-is')` için `shot.sh`'a fragment desteği: `location.hash`'e göre `screens.show` çağıran 3 satırı `main.js`'e ekle: `if (location.hash) show('s-' + location.hash.slice(1))` → `./shot.sh /tmp/rb-task7.png '#is'`).
- [ ] **Step 5: Commit** `"Odun kesme: 2 altın/odun, envantere odun (testli)"`

---

### Task 8: Envanter ekranı

**Files:**
- Create: `js/ui/inventory.js`
- Modify: `js/main.js`

**Interfaces:**
- Consumes: `gameState.inventory`, `ITEM_NAMES`.
- Produces: `renderInventory(state)` — 24 slotluk ızgara; dolu slotlar `ITEM_NAMES[id] ×qty`, kalanlar "boş"; üstte "Dolu yer: N · Boş yer: 24-N". `onShow`'da yeniden çizilir.

- [ ] **Step 1: inventory.js yaz** (mockup `.slots/.slot` stilleri; item ikonları: emoji eşlemesi `{odun:'🪵',kalkan:'🛡️',kilic:'⚔️',yay:'🏹',tufek:'🔫','guc-iksiri':'💪','altin-iksir':'✨','mega-deprem-iksiri':'🌋'}`).
- [ ] **Step 2: Screenshot doğrula** `./shot.sh /tmp/rb-task8.png '#envanter'` (önce localStorage boş → tüm slotlar boş; ardından İş ekranında odun kesip döndüğünde odun görünmeli — bu akışı headless yerine tarayıcıda elle test etmek kabul; en azından boş hâl screenshot'u zorunlu).
- [ ] **Step 3: Commit** `"Envanter: 24 slot, dolu/boş sayacı"`

---

### Task 9: Karakter Dükkanı

**Files:**
- Create: `js/ui/shop.js`, `tests/shop.test.mjs`
- Modify: `js/main.js`

**Interfaces:**
- Consumes: `CHARACTERS`, `gameState`, `spendGold`, `spendGems`, `ownCharacter`, `refreshHud`.
- Produces: SAF `buyCharacter(state, charId) → 'ok'|'yetersiz'|'zaten-var'`; `renderShop(state)` kart ızgarası (kart görseli `c.card`, statlar, fiyat rozeti; sahip olunanda "Senin!" ve buton pasif).

- [ ] **Step 1: Test yaz**

```js
test('altın karakteri: yeterse düşer ve sahiplenir', () => {
  const s = createState(); s.gold = 750;
  assert.equal(buyCharacter(s, 'okcu'), 'ok');
  assert.equal(s.gold, 0); assert.ok(s.ownedCharacters.includes('okcu'));
});
test('taş karakteri yetersiz taşla reddedilir', () => {
  const s = createState(); s.gems = 2599;
  assert.equal(buyCharacter(s, 'kara-ruh'), 'yetersiz');
  assert.equal(s.gems, 2599);
});
test('iki kez alınamaz', () => {
  const s = createState();
  assert.equal(buyCharacter(s, 'savasci'), 'zaten-var');
});
```

- [ ] **Step 2: FAIL** → **Step 3: shop.js yaz** (buyCharacter saf; renderShop mockup'taki `.card` yapısını üretir; kart görselleri yoksa `onerror` ile isim baş harfli renkli kutu göster). Kart görselleri: `Royal battle.pdf`'ten çıkan taramaları `assets/cards/<id>.jpg` adlarıyla koy (mockup için üretilen `char-06..13.jpg` dosyaları scratchpad'te; eşleme: 06=savasci, 07=okcu, 08=buyucu, 09=buz-ejderhasi, 10=maden-dinozoru, 11=altin-ordu, 12=altin-bomba-cicegi, 13=kara-ruh). Renkli versiyonlar ayrı görevde (Task 12) aynı dosya adlarının üstüne yazılır.
- [ ] **Step 4: PASS + screenshot** `./shot.sh /tmp/rb-task9.png '#dukkan'` → 8 kart, Savaşçı "Senin!".
- [ ] **Step 5: Commit** `"Dükkan: satın alma mantığı (testli) + kartlar"`

---

### Task 10: battle/sim.js — savaş simülasyonu (TDD, saf)

**Files:**
- Create: `js/battle/sim.js`, `tests/sim.test.mjs`

**Interfaces:**
- Produces:
  - `createBattle(level)` → `{units:[], level, over:false, winner:null}`
  - `deployUnit(battle, side:'player'|'enemy', stats, x, z)` → unit `{side, atk, def, spd, range, hp, maxHp, x, z, target:null, cooldown:0}`; `hp = def*10`
  - `tick(battle, dt)` — hedef seç (en yakın düşman), menzil dışıysa `spd/25` birim/sn yürü, menzildeyse `cooldown` sıfırlanınca `atk*0.5` hasar; `cooldown = 60/spd` sn. Ölüler (`hp<=0`) diziden çıkar. Bir tarafın birimi kalmazsa `over=true, winner=diğer taraf`. (Oyuncu henüz birim sürmediyse savaş bitmez: `winner` yalnızca iki taraf da en az bir birim sürdükten sonra atanır — `battle.deployed = {player:false, enemy:false}` bayrakları ile.)
  - `battleRewards(rng=Math.random)` → `{gold:25, loot:'kalkan'|..., gems:0|5..15}` (`LOOT_TABLE`'dan rng ile; `GEM_DROP.chance` ile taş)

- [ ] **Step 1: Testleri yaz**

```js
test('hp = def*10', () => { /* deployUnit sonrası unit.hp === def*10 */ });
test('hızlı birim yavaş birimden önce vurur', () => {
  // okçu(spd100) vs dinozor(spd21) aynı noktada: 1sn tick sonrası
  // dinozorun aldığı hasar > okçunun aldığı hasar
});
test('birim menzile yürür: spd75, dt=1 → 3 birim yol', () => { /* x farkı ≈ 3 */ });
test('tek taraf kalınca over ve winner doğru', () => { /* zayıf düşmanı öldür */ });
test('iki taraf da sürmeden winner atanmaz', () => { /* sadece düşman sürülüyken over=false */ });
test('battleRewards: rng=0.05 → taş düşer (5-15 arası), rng=0.9 → taş 0; gold hep 25', () => {
  const r = battleRewards(() => 0.05); assert.equal(r.gold, 25); assert.ok(r.gems >= 5 && r.gems <= 15);
  const r2 = battleRewards(() => 0.9); assert.equal(r2.gems, 0);
});
```

(Her testin gövdesini yorumdaki tarife göre tam yaz — deployUnit ile 2 birim kur, `tick(b, 0.1)` döngüsüyle ilerlet, assert et.)

- [ ] **Step 2: FAIL** → **Step 3: sim.js yaz** — tarifteki formüllerle ~70 satır saf JS. Hedef seçimi: `Math.hypot(dx,dz)` en küçük olan canlı düşman. Hareket: hedefe birim vektörle `spd/25*dt`. Saldırı: `dist <= range && cooldown<=0` → hasar, `cooldown=60/spd`; her tick `cooldown-=dt`.
- [ ] **Step 4: PASS** → **Step 5: Commit** `"Savaş simülasyonu: stat tabanlı otomatik dövüş (testli)"`

---

### Task 11: battle/scene.js — 3D savaş arenası

**Files:**
- Create: `js/battle/scene.js`
- Modify: `js/main.js`, `index.html` (`#battle-ui` içine kart eli + "Savaş" butonu)

**Interfaces:**
- Consumes: `sim.js` tümü, `characters/builder.js` (Task 12'nin `buildCharacter(id)` — bu görevde geçici olarak renkli `THREE.BoxGeometry` gövde kullan, Task 12 gerçeğiyle değiştirir), `gameState`, `enemyWave`, `battleRewards`, `addGold/addGems/addItem`, `refreshHud`.
- Produces: `initBattle(state)`:
  1. `onShow` → `createBattle(state.battleLevel)`, düşman dalgası `enemyWave(level)` alanın sağ yarısına dizilir (`deployUnit`), alt şeritte sahip olunan karakter kartları.
  2. Karta dokun → seçilir; arenaya (sol yarı) dokun → `deployUnit(player)` + sahneye mesh; her karakter savaş başına 1 kez sürülebilir.
  3. `renderer.setAnimationLoop` içinde `tick(battle, dt)`; mesh pozisyonları unit'lerden kopyalanır; ölen unit'in mesh'i kaldırılır. Kara Ruh mesh'ine `material.transparent=true; opacity=0.55`.
  4. `battle.over` → zafer ise `battleRewards()` uygula, `state.battleLevel++`, `refreshHud`, "Zafer! +25 🪙 · Ganimet: X · (+N 💎)" paneli; yenilgi ise "Kaybettin — tekrar dene!" paneli. Panelde "Köye Dön" butonu.

- [ ] **Step 1: scene.js + battle-ui'yi yaz** (yukarıdaki 4 madde; arena: 24×14 plane, orta çizgi; kamera `(0,16,14)`).
- [ ] **Step 2: Doğrula** — headless'ta otomatik oynatma zor; şu smoke testi kullan: `main.js`'e `?autobattle=1` parametresi ekle → savaş ekranını açar, savaşçıyı `(−5,0)`'a otomatik sürer. `./shot.sh /tmp/rb-task11a.png '?autobattle=1#savas'` → birimler görünür; 15 sn sonra ikinci screenshot → pozisyonlar değişmiş/sonuç paneli çıkmış olmalı. İkisini de Read ile incele.
- [ ] **Step 3: Commit** `"3D savaş: sürükle-yerleştir, otomatik dövüş, ödüller, seviye ilerlemesi"`

---

### Task 12: characters/builder.js — Aslan'ın karakterlerini giydir

**Files:**
- Create: `js/characters/builder.js`
- Modify: `js/battle/scene.js` (geçici kutuları `buildCharacter(id)` ile değiştir)

**Interfaces:**
- Produces: `async buildCharacter(id) → THREE.Object3D` (≤ 2 birim yükseklik, +Z yönüne bakar). İnsansılar (`savasci, okcu, buyucu, altin-ordu askeri, kara-ruh`): Blocky Characters GLB'si üzerine malzeme renkleri + aksesuar mesh'leri. Kutu-inşa olanlar (`buz-ejderhasi, maden-dinozoru, altin-bomba-cicegi`): `BoxGeometry` parçalarıyla çizime sadık kompozisyon.
- Giydirme tablosu (çizimlerden):
  - savasci: kahve saç, kırmızı-bordo gövde, sol el balta (kutu+silindir sap), sağ el kılıç
  - okcu: yeşil kapüşon (başa yarım küre/kutu), elinde yay (torus yarısı + çizgi)
  - buyucu: mor cübbe (gövde ölçeği 1.2), ellerde sarı kıvılcım küreleri
  - altin-ordu: altın (#E9B33C) malzeme, başta minik bayrak
  - kara-ruh: koyu mor, `opacity 0.55`, ayak altında halka (`RingGeometry`)
  - buz-ejderhasi: açık mavi; gövde kutusu + uzun boyun (3 kutu) + kanat (2 yamuk kutu) + diş sırası
  - maden-dinozoru: gri-yeşil; iri gövde + kısa bacaklar + sırtında minik madenci figürü (küçük kutu adam) + kazma
  - altin-bomba-cicegi: yeşil sap (silindir) + altın çanak (yarım küre) + içinde diş sırası
- [ ] **Step 1: builder.js yaz** — her id için ayrı fonksiyon, ortak `mat(color)` yardımcıları; Blocky GLB yüklenemezse insansılar da kutu-inşa yoluna düşer (fallback aynı görünüm dilinde).
- [ ] **Step 2: Görsel doğrulama sayfası** — `charviewer.html`: `?id=<charId>` ile tek karakteri döndürerek gösterir. Her 8 karakter için `./shot.sh /tmp/rb-char-<id>.png 'charviewer.html?id=<id>'` → Read ile incele: çizime benziyor mu? Benzemeyeni düzelt.
- [ ] **Step 3: ASLAN ONAY KAPISI** — 8 screenshot'ı SendUserFile ile kullanıcıya gönder: "Aslan onaylıyor mu?" Onaylanmayan karakter yeniden yapılır. (Bu görev onay gelmeden "bitti" sayılmaz.)
- [ ] **Step 4: Commit** `"Karakterler: Aslan'ın çizimlerine göre 3D giydirme"`

---

### Task 13: Renkli karakter kartları

**Files:**
- Modify: `assets/cards/*.jpg` (üstüne yaz)

- [ ] **Step 1:** Her karakter için görsel üretim (generate-image skill): girdi = PDF'ten kırpılmış çizim, talimat = "bu çocuk çizimindeki çizgileri ve kompozisyonu aynen koru, yalnızca renklendir; karakter tanımı: <giydirme tablosundaki renkler>". Çıktıyı `assets/cards/<id>.jpg` üstüne yaz.
- [ ] **Step 2: ASLAN ONAY KAPISI** — 8 kartı SendUserFile ile gönder; reddedileni yeniden üret ya da taranmış orijinaline geri dön (dosyayı eski haline çevir).
- [ ] **Step 3: Commit** `"Renkli karakter kartları (Aslan onaylı)"`

---

### Task 14: iPad testi + cila + v1 kapanışı

**Files:**
- Modify: gerekli görülen dosyalar (yalnızca bu görevin bulgularına bağlı düzeltmeler)

- [ ] **Step 1: Tam akış smoke testi** (masaüstü tarayıcıda, chrome-devtools MCP ile): temiz localStorage → köyde gez → iş alanına dokun → 5 odun kes (altın 100→110) → dükkanda param yetmeyen karaktere bas ("yetersiz" geri bildirimi) → savaşa gir, savaşçıyı sür, sonucu bekle → envanterde ganimeti gör → sayfayı yenile → her şey korunmuş. Her adımda screenshot al, Read ile doğrula.
- [ ] **Step 2: iPad'de gerçek test** — kullanıcıdan iPad ile `http://<mac-ip>:8080` açmasını iste (`ipconfig getifaddr en0` ile IP ver). Akıcılık sorunu bildirilirse: pixelRatio'yu 1.5'e indir, ağaç sayısını azalt.
- [ ] **Step 3: Tüm testler yeşil** — `node --test tests/` → hepsi PASS.
- [ ] **Step 4: Commit** `"v1 tamam: tam akış doğrulandı"` — ve spec §8 başarı ölçütünü kullanıcıyla teyit et: Aslan yardımsız oynayabiliyor mu?

---

## Self-Review Notları

- Spec kapsaması: §1 kimlik→T1; §2.1 köy→T6; §2.2 savaş→T10+T11; §2.3 odun→T7; §2.4 envanter→T8; §2.5 dükkan→T9; §3 statlar→T3 (test kilidi); §4 ekonomi→T2+T3; §5 grafik→T5+T12+T13; §6 kontroller→T6+T11 (pointer); §7 v1 listesi→tamamı; §8 ölçüt→T14. v2 kalemleri (market satıcılığı, iksir kullanımı, ses, top) bilinçli olarak yok.
- Tip tutarlılığı: `state` alan adları (`gold, gems, ownedCharacters, inventory, battleLevel`) T2'de tanımlanır, T4/7/9/11 aynı adları kullanır; karakter `id`'leri T3'te tanımlanır, T9/11/12/13 aynı kebab-case id'leri kullanır.
- Bilinen riskler: Kenney zip URL'si değişebilir (T5'te fallback + dur-ve-sor kuralı); GLB dosya adları pakete göre değişir (T6'da gerçek listeden seçme adımı var); headless'ta savaş animasyonu doğrulaması sınırlı (T11 iki-screenshot yaklaşımı + T14 canlı test telafi eder).
