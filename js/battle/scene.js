// js/battle/scene.js — Clash Royale tarzı 2D savaş arenası (Canvas2D).
// Yatay arena: solda oyuncu, sağda düşman; ortada nehir + iki köprü, her tarafta
// 2 yan kule + 1 kral kulesi. Kart seç → sol yarıya dokun, iksirle sür.
// Brawl Stars dokunuşları: takım halkası, isimli can barı, çalılıklar, vuruş efektleri.
import {
  createBattle, deployUnit, addTowers, tick, battleRewards,
  applyPotion, fireCannon, equipRifle, spendElixir, ARENA, ELIXIR, KURAL,
} from './sim.js';
import {
  CHARACTERS, enemyWave, enemyReinforcement, isBossLevel,
  ITEM_NAMES, ELIXIR_COST, ENEMY_SPAWN, enemyGap, levelScale,
} from '../balance.js';
import { addGold, addGems, addItem } from '../state.js';
import { refreshHud } from '../ui/hud.js';
import { sfx } from '../ui/sound.js';
import { show } from '../screens.js';

const IKSIRLER = [
  ['guc-iksiri', '💪'], ['altin-iksir', '✨'], ['mega-deprem-iksiri', '🌋'],
];

const byId = Object.fromEntries(CHARACTERS.map(c => [c.id, c]));
const DUSMAN = {
  asker: { ad: 'Asker', ikon: '⚔️', renk: '#5A5F66', r: 0.62 },
  okcu: { ad: 'Okçu', ikon: '🏹', renk: '#3E7C4F', r: 0.62 },
  boss: { ad: 'Boss', ikon: '👹', renk: '#7A1F1F', r: 1.05 },
};
const R_OYUNCU = { 'maden-dinozoru': 0.8, 'buz-ejderhasi': 0.72, boss: 1.05 };

// Kart görselleri: birim jetonlarında yuvarlak kırpılarak kullanılır.
const kartImg = new Map();
for (const c of CHARACTERS) {
  const im = new Image();
  im.src = c.card;
  kartImg.set(c.id, im);
}

const RENK = {
  cim1: '#74B35C', cim2: '#6CA954', cali: '#4E8F3D', caliKoyu: '#3E7A30',
  nehir: '#5FB4DC', nehirKoyu: '#4A9CC7', kopru: '#A0693A', kopruKoyu: '#7C4E28',
  tas: '#AEB6BD', tasKoyu: '#5F6873', tasAcik: '#C6CDD4',
  oyuncu: '#3E7CC7', dusman: '#D96C4F',
};

// Çalılık kümeleri (dünya koordinatı, dekoratif — çarpışma yok)
const CALILAR = [
  [-4.2, -3.2], [-3.7, -2.6], [4.1, -4.4], [3.6, -3.9], [0.2, -4.6],
  [-4.1, 3.4], [-3.5, 3.9], [4.2, 2.8], [3.7, 3.4], [0.3, 4.4], [-0.4, 4.8],
];

export function initBattle(state) {
  const canvas = document.getElementById('battle-canvas');
  const ui = document.getElementById('battle-ui');
  const ekran = document.getElementById('s-savas');
  const ctx = canvas.getContext('2d');

  let battle = null;
  let secili = null;
  let tufekBekliyor = false;
  let sonucVerildi = false;
  let kuyruk = [];        // sürülmeyi bekleyen düşman dalgası
  let kalanDalga = 0;     // kuyruk bitince kaç takviye dalgası daha gelecek
  let spawnT = 0;
  let laneI = 0;
  let prevUnits = new Set();
  let oklar = [], carpmalar = [], sayilar = [], pofler = [];
  let elixFill = null, elixNum = null, sonElixTam = -1;
  let dpr = 1;

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  addEventListener('resize', resize);

  // Dünya → ekran: arena YATAY durur. Sim'in "ileri" ekseni (z) ekranın yatay eksenine,
  // "yanal" ekseni (x) dikey eksene düşer. Oyuncu solda (z>0), düşman sağda (z<0).
  function metrics() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const s = Math.min(w / (ARENA.h + 1), h / (ARENA.w + 0.8));
    return { s, cx: w / 2, cy: h / 2, w, h };
  }

  function elCiz() {
    const kartlar = state.ownedCharacters.map(id => {
      const c = byId[id];
      const maliyet = ELIXIR_COST[id] ?? 4;
      const pahali = battle && battle.elixir < maliyet ? ' pahali' : '';
      const seciliMi = secili === id ? ' selected' : '';
      return `<div class="minicard${pahali}${seciliMi}" data-id="${id}">
        <span class="cost">${maliyet}</span>
        <img src="${c.card}" alt="${c.name}">${c.name}</div>`;
    }).join('');
    const iksirBtnleri = IKSIRLER
      .filter(([id]) => state.inventory[id] > 0)
      .map(([id, ikon]) => `<button class="actbtn" data-iksir="${id}">${ikon} ${ITEM_NAMES[id]} ×${state.inventory[id]}</button>`)
      .join('');
    const topBtn = `<button class="actbtn" data-top="1" ${battle?.cannonUsed ? 'disabled' : ''}>💣 Top${battle?.cannonUsed ? ' (kullanıldı)' : ''}</button>`;
    const tufekBtn = state.inventory.tufek > 0
      ? `<button class="actbtn${tufekBekliyor ? ' selected' : ''}" data-tufek="1">🔫 ${ITEM_NAMES.tufek} ×${state.inventory.tufek}</button>`
      : '';
    const ipucu = tufekBekliyor
      ? '🔫 Tüfek hazır — süreceğin sonraki birim uzaktan vuracak'
      : `Karta dokun, sonra sol yarıya dokunup sür — Seviye ${state.battleLevel}`;
    ui.innerHTML = `<div class="elixrow">🧪<div class="elixbar"><div class="fill"></div></div><span class="elixn">0</span></div>
      <div class="handrow">${kartlar}</div>
      <div class="actrow">${topBtn}${tufekBtn}${iksirBtnleri}</div>
      <p class="map-hint" style="color:#F5EBD3;margin:.2rem 0">${ipucu}</p>`;
    elixFill = ui.querySelector('.elixbar .fill');
    elixNum = ui.querySelector('.elixn');
    sonElixTam = -1; // re-render sonrası sayaç ve "yetmiyor" görünümü tazelensin
    ui.querySelectorAll('.minicard').forEach(k =>
      k.addEventListener('pointerdown', () => { secili = k.dataset.id; elCiz(); }));
    ui.querySelectorAll('[data-iksir]').forEach(b =>
      b.addEventListener('pointerdown', () => {
        const tip = b.dataset.iksir;
        if (!battle || battle.over || !(state.inventory[tip] > 0)) return;
        state.inventory[tip] -= 1;
        if (state.inventory[tip] === 0) delete state.inventory[tip];
        applyPotion(battle, tip);
        sfx.potion();
        refreshHud(state);
        elCiz();
      }));
    ui.querySelector('[data-tufek]')?.addEventListener('pointerdown', () => {
      if (!battle || battle.over || !(state.inventory.tufek > 0)) return;
      tufekBekliyor = !tufekBekliyor;
      elCiz();
    });
    ui.querySelector('[data-top]')?.addEventListener('pointerdown', () => {
      if (!battle || battle.over) return;
      if (fireCannon(battle)) { sfx.cannon(); elCiz(); }
    });
  }

  // Her tam iksir değişiminde kartların "yetmiyor" görünümünü tazele (tam re-render'sız).
  function pahaliGuncelle() {
    ui.querySelectorAll('.minicard').forEach(k => {
      const maliyet = ELIXIR_COST[k.dataset.id] ?? 4;
      k.classList.toggle('pahali', !battle || battle.over || battle.elixir < maliyet);
    });
  }

  function baslat() {
    ekran.querySelector('.victory')?.remove();
    battle = createBattle(state.battleLevel);
    addTowers(battle, levelScale(state.battleLevel));
    secili = null; sonucVerildi = false; tufekBekliyor = false;
    kuyruk = enemyWave(state.battleLevel).slice();
    kalanDalga = ENEMY_SPAWN.waves(state.battleLevel) - 1;
    spawnT = ENEMY_SPAWN.first; laneI = 0;
    oklar = []; carpmalar = []; sayilar = []; pofler = [];
    prevUnits = new Set(battle.units);
    elCiz();
    resize();
  }

  function sur(charId, x, z) {
    if (!battle || battle.over) return;
    const maliyet = ELIXIR_COST[charId] ?? 4;
    if (!spendElixir(battle, maliyet)) return;
    const c = byId[charId];
    const u = deployUnit(battle, 'player', { atk: c.atk, def: c.def, spd: c.spd, range: c.range }, x, z);
    u.gorselId = charId;
    u.r = R_OYUNCU[charId] ?? 0.62;
    u.ad = c.name;
    if (tufekBekliyor && state.inventory.tufek > 0 && equipRifle(battle, u)) {
      state.inventory.tufek -= 1;
      if (state.inventory.tufek === 0) delete state.inventory.tufek;
      tufekBekliyor = false;
      refreshHud(state);
    }
    prevUnits.add(u);
    secili = null;
    sfx.deploy();
    elCiz();
  }

  function dusmanSur(stats) {
    const boss = stats.tip === 'boss';
    const x = boss ? 0 : (laneI++ % 2 ? ARENA.bridgeX : -ARENA.bridgeX);
    const u = deployUnit(battle, 'enemy', stats, x, -7.4);
    u.dusmanTip = stats.tip;
    u.r = DUSMAN[stats.tip]?.r ?? 0.62;
    u.ad = DUSMAN[stats.tip]?.ad ?? 'Düşman';
    prevUnits.add(u);
  }

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  canvas.addEventListener('pointerdown', e => {
    if (!secili || !battle || battle.over) return;
    const { s, cx, cy } = metrics();
    const r = canvas.getBoundingClientRect();
    const z = (cx - (e.clientX - r.left)) / s; // ekran yatayı → dünya ileri ekseni
    const x = ((e.clientY - r.top) - cy) / s;  // ekran dikeyi → dünya yanal ekseni
    if (z < 0.6) return; // sadece kendi (sol) yarın
    sur(secili, clamp(x, -5.4, 5.4), clamp(z, 0.9, 9.4));
  });

  function sonuc() {
    sonucVerildi = true;
    const panel = document.createElement('div');
    panel.className = 'victory';
    if (battle.winner === 'player') {
      const odul = battleRewards(battle.level);
      // altın iksiri ×2, boss seviyesi ×2 — ayrı katsayılar, çarpışmazlar
      const bossMult = isBossLevel(battle.level) ? 2 : 1;
      const kazanilanAltin = odul.gold * battle.goldMult * bossMult;
      addGold(state, kazanilanAltin);
      addItem(state, odul.loot, 1);
      if (odul.gems) addGems(state, odul.gems);
      state.battleLevel += 1;
      refreshHud(state);
      sfx.victory();
      panel.innerHTML = `<b>${bossMult > 1 ? 'Boss yenildi!' : 'Zafer!'}</b> Kral kulesi yıkıldı! +${kazanilanAltin} 🪙 · Ganimet: ${ITEM_NAMES[odul.loot]}${odul.gems ? ` · +${odul.gems} 💎` : ''}<br><br>`;
    } else {
      sfx.defeat();
      panel.innerHTML = `<b>Kaybettin</b> Kral kulen yıkıldı — tekrar dene!<br><br>`;
    }
    const don = document.createElement('button');
    don.className = 'bigbtn'; don.textContent = 'Köye Dön';
    don.addEventListener('pointerdown', () => { panel.remove(); show('s-koy'); });
    panel.appendChild(don);
    ekran.appendChild(panel);
  }

  // --- Sim olayları → görsel efektler ---
  function olayIsle() {
    for (const ev of battle.events) {
      const menzilli = ev.from.range > 3;
      const gec = menzilli ? 0.16 : 0;
      if (menzilli) {
        oklar.push({
          x0: ev.from.x, z0: ev.from.z, x1: ev.to.x, z1: ev.to.z, t: 0, sure: 0.16,
          buyu: ev.from.side === 'player' && !ev.from.tower
            && ['buyucu', 'altin-bomba-cicegi', 'buz-ejderhasi'].includes(ev.from.gorselId),
        });
      }
      carpmalar.push({ x: ev.to.x, z: ev.to.z, t: -gec });
      if (sayilar.length < 30) {
        // Hedefin üstünde belirsin (ekran yukarısı = dünya -x), üst üste binmesin diye z'de yayılır.
        sayilar.push({ x: ev.to.x - 0.9, z: ev.to.z + (Math.min(sayilar.length, 3) - 1) * 0.35, t: -gec, deger: Math.round(ev.from.atk * KURAL.hasar) });
      }
    }
    battle.events.length = 0;
  }

  function olumleriBul() {
    const simdiki = new Set(battle.units);
    for (const u of prevUnits) {
      if (!simdiki.has(u)) pofler.push({ x: u.x, z: u.z, t: 0, r: u.tower ? 1.5 : (u.r ?? 0.62) });
    }
    prevUnits = simdiki;
  }

  // --- Çizim ---
  function ciz(dt) {
    const { s, cx, cy, w, h } = metrics();
    if (!w || !h) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // EX: dünya ileri ekseni (z) → ekran yatayı, oyuncu solda. EY: dünya yanal ekseni (x) → ekran dikeyi.
    const EX = z => cx - z * s, EY = x => cy + x * s;
    ctx.fillStyle = '#9BCFE0';
    ctx.fillRect(0, 0, w, h);

    const ax = EX(ARENA.h / 2), ay = EY(-ARENA.w / 2), aw = ARENA.h * s, ah = ARENA.w * s;
    // Arena zemini (yuvarlatılmış, kırpılır)
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(ax, ay, aw, ah, 10);
    ctx.clip();
    ctx.fillStyle = RENK.cim1;
    ctx.fillRect(ax, ay, aw, ah);
    ctx.fillStyle = RENK.cim2;
    // Yatay bantlar: saldırı şeritlerini (sol→sağ akış) gözle takip ettirir
    for (let i = 0; i < 8; i++) if (i % 2) ctx.fillRect(ax, ay + (i * ah) / 8, aw, ah / 8);
    // Çalılıklar (Brawl Stars havası — dekoratif)
    for (const [bx, bz] of CALILAR) {
      for (const [ox, oz, or_] of [[0, 0, 0.5], [-0.38, 0.16, 0.34], [0.36, 0.2, 0.36], [0.05, -0.3, 0.34]]) {
        ctx.fillStyle = (ox + oz) > 0 ? RENK.cali : RENK.caliKoyu;
        ctx.beginPath();
        ctx.arc(EX(bz + oz), EY(bx + ox), or_ * s, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Nehir (dikey şerit) + dalgalar
    ctx.fillStyle = RENK.nehir;
    ctx.fillRect(EX(ARENA.riverHalf), ay, ARENA.riverHalf * 2 * s, ah);
    ctx.strokeStyle = RENK.nehirKoyu;
    ctx.lineWidth = 2;
    for (const [dx, dz] of [[-3.9, -0.3], [-1.2, 0.35], [0.8, -0.35], [4, 0.3]]) {
      ctx.beginPath();
      ctx.arc(EX(dz), EY(dx), 0.22 * s, -Math.PI * 0.35, Math.PI * 0.35);
      ctx.stroke();
    }
    // Köprüler: nehri yatay olarak geçer, tahtalar geçiş yönüne dik (dikey çizgiler)
    for (const bx of [-ARENA.bridgeX, ARENA.bridgeX]) {
      const kx = EX(1.15), ky = EY(bx - 0.95), kw = 2.3 * s, kh = 1.9 * s;
      ctx.fillStyle = RENK.kopru;
      ctx.fillRect(kx, ky, kw, kh);
      ctx.strokeStyle = RENK.kopruKoyu;
      ctx.lineWidth = 2;
      for (let i = 1; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(kx + (i * kw) / 5, ky);
        ctx.lineTo(kx + (i * kw) / 5, ky + kh);
        ctx.stroke();
      }
      ctx.strokeStyle = RENK.kopruKoyu;
      ctx.lineWidth = 4;
      ctx.strokeRect(kx, ky, kw, kh);
    }
    // Kart seçiliyken sürme bölgesi vurgusu (sol yarı)
    if (secili && battle && !battle.over) {
      const bw = EX(0.9) - ax;
      ctx.fillStyle = 'rgba(233,179,60,.16)';
      ctx.fillRect(ax, ay, bw, ah);
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = '#E9B33C';
      ctx.lineWidth = 3;
      ctx.strokeRect(ax + 3, ay + 3, bw - 3, ah - 6);
      ctx.setLineDash([]);
    }
    ctx.restore();
    // Arena çerçevesi
    ctx.strokeStyle = RENK.kopruKoyu;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(ax, ay, aw, ah, 10);
    ctx.stroke();

    // Birimler + kuleler: ekranda üstte olan (dünya -x) önce çizilir
    if (battle) {
      const liste = [...battle.units].sort((a, b) => a.x - b.x);
      for (const u of liste) (u.tower ? kuleCiz : birimCiz)(u, s, EX, EY);
    }

    // Oklar / mermiler
    for (const ok of oklar) {
      ok.t += dt;
      const t = Math.min(ok.t / ok.sure, 1);
      const px = EX(ok.z0 + (ok.z1 - ok.z0) * t), py = EY(ok.x0 + (ok.x1 - ok.x0) * t);
      ctx.fillStyle = ok.buyu ? '#FFD94A' : '#2B2117';
      ctx.beginPath();
      ctx.arc(px, py, ok.buyu ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fill();
      if (ok.buyu) {
        ctx.fillStyle = 'rgba(255,217,74,.35)';
        ctx.beginPath();
        ctx.arc(px, py, 9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    oklar = oklar.filter(o => o.t < o.sure);

    // Vuruş kıvılcımları (yıldız patlaması)
    for (const c of carpmalar) {
      c.t += dt;
      if (c.t < 0) continue;
      const p = c.t / 0.25;
      ctx.strokeStyle = `rgba(255,235,160,${1 - p})`;
      ctx.lineWidth = 3;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.5;
        const r0 = 0.12 * s + p * 0.3 * s, r1 = r0 + 0.22 * s * (1 - p);
        ctx.beginPath();
        ctx.moveTo(EX(c.z) + Math.cos(a) * r0, EY(c.x) + Math.sin(a) * r0);
        ctx.lineTo(EX(c.z) + Math.cos(a) * r1, EY(c.x) + Math.sin(a) * r1);
        ctx.stroke();
      }
    }
    carpmalar = carpmalar.filter(c => c.t < 0.25);

    // Hasar sayıları
    ctx.textAlign = 'center';
    for (const n of sayilar) {
      n.t += dt;
      if (n.t < 0) continue;
      const p = n.t / 0.7;
      ctx.font = `900 ${Math.max(11, Math.round(0.34 * s))}px "Avenir Next","Trebuchet MS",sans-serif`;
      ctx.lineWidth = 3;
      ctx.strokeStyle = `rgba(43,33,23,${0.9 * (1 - p)})`;
      ctx.fillStyle = `rgba(255,243,220,${1 - p})`;
      const py = EY(n.x) - p * 18;
      ctx.strokeText(`-${n.deger}`, EX(n.z), py);
      ctx.fillText(`-${n.deger}`, EX(n.z), py);
    }
    sayilar = sayilar.filter(n => n.t < 0.7);

    // Ölüm pofları
    for (const p of pofler) {
      p.t += dt;
      const q = p.t / 0.35;
      ctx.strokeStyle = `rgba(255,255,255,${0.9 * (1 - q)})`;
      ctx.lineWidth = 5 * (1 - q) + 1;
      ctx.beginPath();
      ctx.arc(EX(p.z), EY(p.x), (p.r + q * 0.9) * s, 0, Math.PI * 2);
      ctx.stroke();
    }
    pofler = pofler.filter(p => p.t < 0.35);
  }

  function kuleCiz(u, s, EX, EY) {
    const b = u.tower === 'king' ? 2.2 : 1.7;
    const mx = EX(u.z), my = EY(u.x), ps = b * s;
    const px = mx - ps / 2, py = my - ps / 2;
    ctx.fillStyle = 'rgba(43,33,23,.18)';
    ctx.beginPath();
    ctx.ellipse(mx, my + ps * 0.42, ps * 0.5, ps * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = RENK.tas;
    ctx.strokeStyle = RENK.tasKoyu;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(px, py, ps, ps, 6);
    ctx.fill();
    ctx.stroke();
    // Mazgal dişleri
    ctx.fillStyle = RENK.tasAcik;
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(px + ps * (0.1 + i * 0.32), py - ps * 0.1, ps * 0.16, ps * 0.14);
    }
    // Takım şeridi
    ctx.fillStyle = u.side === 'player' ? RENK.oyuncu : RENK.dusman;
    ctx.fillRect(px + 2, py + ps * 0.4, ps - 4, ps * 0.2);
    // Kale kapısı: oyuncuya (ekranın altına) dönük kemerli ahşap kapı
    const kg = ps * 0.3, kh = ps * 0.32, kx = mx, ky = py + ps - 1;
    ctx.fillStyle = RENK.kopru;
    ctx.strokeStyle = RENK.kopruKoyu;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(kx - kg / 2, ky);
    ctx.lineTo(kx - kg / 2, ky - kh + kg / 2);
    ctx.arc(kx, ky - kh + kg / 2, kg / 2, Math.PI, 0);
    ctx.lineTo(kx + kg / 2, ky);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (u.tower === 'king') {
      ctx.font = `${Math.round(ps * 0.42)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('👑', mx, py + ps * 0.22);
      ctx.textBaseline = 'alphabetic';
    }
    canBar(u, s, EX, EY, b * 0.95, py - ps * 0.22);
  }

  function birimCiz(u, s, EX, EY) {
    const r = (u.r ?? 0.62) * s;
    const px = EX(u.z), py = EY(u.x);
    // Takım halkası (yerde, ışıklı)
    const halka = u.side === 'player' ? RENK.oyuncu : RENK.dusman;
    ctx.fillStyle = u.side === 'player' ? 'rgba(62,124,199,.30)' : 'rgba(217,108,79,.30)';
    ctx.beginPath();
    ctx.ellipse(px, py + r * 0.62, r * 1.1, r * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = halka;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(px, py + r * 0.62, r * 1.1, r * 0.45, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Jeton: kart görseli (oyuncu) ya da renkli disk + ikon (düşman)
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.clip();
    const im = u.gorselId ? kartImg.get(u.gorselId) : null;
    if (im?.complete && im.naturalWidth) {
      // Kapak: kısa kenara göre ölçekle, üstten hizala (yüzler kartın üstünde)
      const olcek = (r * 2) / Math.min(im.naturalWidth, im.naturalHeight);
      ctx.drawImage(im, px - (im.naturalWidth * olcek) / 2, py - r, im.naturalWidth * olcek, im.naturalHeight * olcek);
    } else {
      ctx.fillStyle = DUSMAN[u.dusmanTip]?.renk ?? halka;
      ctx.fillRect(px - r, py - r, r * 2, r * 2);
      ctx.font = `${Math.round(r * 1.15)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(DUSMAN[u.dusmanTip]?.ikon ?? '❓', px, py + r * 0.05);
      ctx.textBaseline = 'alphabetic';
    }
    ctx.restore();
    ctx.strokeStyle = halka;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.stroke();
    if (u.rifle) {
      ctx.font = `${Math.round(r * 0.8)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('🔫', px + r * 0.8, py - r * 0.7);
    }
    // Birim etiketi ayakların altında: kuleye alttan yaklaşan birimler kule barıyla çakışmaz.
    canBar(u, s, EX, EY, 1.5, py + r * 1.15, true);
  }

  // Brawl Stars tarzı: isim + sayılı can barı. `adAltta` ise isim barın altına yazılır.
  function canBar(u, s, EX, EY, wWorld, py, adAltta = false) {
    const bw = wWorld * s, bh = Math.max(5, 0.16 * s);
    const mx = EX(u.z), px = mx - bw / 2;
    const oran = Math.max(u.hp / u.maxHp, 0);
    ctx.font = `800 ${Math.max(9, Math.round(0.24 * s))}px "Avenir Next","Trebuchet MS",sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFF3DC';
    ctx.strokeStyle = 'rgba(43,33,23,.75)';
    ctx.lineWidth = 2.5;
    if (u.ad) {
      const ay = adAltta ? py + bh + Math.max(11, 0.26 * s) : py - bh * 0.7;
      ctx.strokeText(u.ad, mx, ay);
      ctx.fillText(u.ad, mx, ay);
    }
    ctx.fillStyle = 'rgba(43,33,23,.6)';
    ctx.beginPath();
    ctx.roundRect(px, py, bw, bh, bh / 2);
    ctx.fill();
    ctx.fillStyle = oran > 0.5 ? '#48B34E' : oran > 0.25 ? '#E9B33C' : '#D96C4F';
    if (oran > 0) {
      ctx.beginPath();
      ctx.roundRect(px + 1, py + 1, Math.max((bw - 2) * oran, bh - 2), bh - 2, (bh - 2) / 2);
      ctx.fill();
    }
    ctx.font = `900 ${Math.max(8, Math.round(0.2 * s))}px "Avenir Next",sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.fillText(Math.max(Math.ceil(u.hp), 0), mx, py + bh - 1.5);
  }

  // --- Ana döngü ---
  let onceki = performance.now();
  function kare() {
    const simdi = performance.now();
    // Sabit adımlı ilerletme: nadir frame'lerde bile sim tutarlı kalır (≤0.5 sn/frame).
    const dt = Math.min((simdi - onceki) / 1000, 0.5);
    onceki = simdi;
    if (canvas.width !== Math.round(canvas.clientWidth * dpr)) resize();
    if (battle && !battle.over) {
      let kalan = dt;
      while (kalan > 0) { tick(battle, Math.min(kalan, 0.05)); kalan -= 0.05; }
      spawnT -= dt;
      if (!kuyruk.length && kalanDalga > 0) { kuyruk = enemyReinforcement(battle.level); kalanDalga--; }
      if (kuyruk.length && spawnT <= 0) {
        const s = kuyruk.shift();
        dusmanSur(s);
        spawnT = enemyGap(battle.level, s.tip);
      }
    }
    if (battle) {
      olayIsle();
      olumleriBul();
      if (battle.over && !sonucVerildi) sonuc();
      if (elixFill) {
        elixFill.style.width = `${(battle.elixir / ELIXIR.max) * 100}%`;
        const tam = Math.floor(battle.elixir);
        if (tam !== sonElixTam) { sonElixTam = tam; elixNum.textContent = tam; pahaliGuncelle(); }
      }
    }
    ciz(dt);
    requestAnimationFrame(kare);
  }
  requestAnimationFrame(kare);

  return {
    onShow: baslat,
    // Headless smoke testi eski (x,z) düzenini kullanır; oyuncu yarısına kıstırılır.
    autoDeploy: (charId, x, z) => sur(charId, clamp(x, -5.4, 5.4), z > 0.6 ? clamp(z, 0.9, 9.4) : 4),
  };
}
