// js/battle/scene.js — 3D savaş arenası: kart seç → sol yarıya sür, otomatik dövüş.
import * as THREE from 'three';
import { createBattle, deployUnit, tick, battleRewards, applyPotion, fireCannon } from './sim.js';
import { CHARACTERS, enemyWave, ITEM_NAMES } from '../balance.js';
import { addGold, addGems, addItem } from '../state.js';
import { refreshHud } from '../ui/hud.js';
import { sfx } from '../ui/sound.js';
import { show } from '../screens.js';

const IKSIRLER = [
  ['guc-iksiri', '💪'], ['altin-iksir', '✨'], ['mega-deprem-iksiri', '🌋'],
];

const byId = Object.fromEntries(CHARACTERS.map(c => [c.id, c]));

import { buildCharacter } from '../characters/builder.js';

// --- Animasyon: Kenney klipleri (insansılar) / sinüs sallanması (kutu-inşa) ---
const KLIP = { idle: 'idle', walk: 'walk', vurus: 'attack-melee-right' };

function animKur(mesh) {
  const klipler = mesh.userData.klipler;
  if (!klipler?.length) return null;
  const mixer = new THREE.AnimationMixer(mesh);
  const kayit = { mixer, aktif: null, cd: 0, vurusKalan: 0 };
  for (const [ad, klipAdi] of Object.entries(KLIP)) {
    const klip = THREE.AnimationClip.findByName(klipler, klipAdi);
    if (klip) kayit[ad] = mixer.clipAction(klip);
  }
  kayit.vurus?.setLoop(THREE.LoopOnce, 1);
  return kayit;
}

function animGec(kayit, ad, sure = 0.25) {
  const yeni = kayit[ad];
  if (!yeni || kayit.aktif === yeni) return;
  yeni.reset().fadeIn(sure).play();
  kayit.aktif?.fadeOut(sure);
  kayit.aktif = yeni;
}

// Menzil dışında yürüme, menzilde bekleme; cooldown sıfırlandığı an tek seferlik vuruş.
function animIlerlet(mesh, unit, dt, simdi) {
  const kayit = mesh.userData.anim;
  if (!kayit) {
    if (mesh.userData.sallan) mesh.rotation.z = Math.sin(simdi / 260 + mesh.id) * 0.07;
    return;
  }
  kayit.mixer.update(dt);
  const hedef = unit.target;
  const menzilde = hedef && hedef.hp > 0 && Math.hypot(hedef.x - unit.x, hedef.z - unit.z) <= unit.range;
  if (menzilde && kayit.vurus && unit.cooldown > kayit.cd + 1e-6) {
    kayit.vurus.reset().fadeIn(0.08).play();
    if (kayit.aktif && kayit.aktif !== kayit.vurus) kayit.aktif.fadeOut(0.08);
    kayit.aktif = kayit.vurus;
    kayit.vurusKalan = kayit.vurus.getClip().duration;
  }
  kayit.cd = unit.cooldown;
  if (kayit.vurusKalan > 0) { kayit.vurusKalan -= dt; return; }
  animGec(kayit, hedef && !menzilde ? 'walk' : 'idle');
}

export function initBattle(state) {
  const canvas = document.getElementById('battle-canvas');
  const ui = document.getElementById('battle-ui');
  const ekran = document.getElementById('s-savas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9bcfe0);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
  camera.position.set(0, 16, 14); camera.lookAt(0, 0, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2); sun.position.set(10, 20, 8); scene.add(sun);
  const arena = new THREE.Mesh(new THREE.PlaneGeometry(24, 14), new THREE.MeshLambertMaterial({ color: 0x74b35c }));
  arena.rotation.x = -Math.PI / 2; scene.add(arena);
  const cizgi = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 14), new THREE.MeshLambertMaterial({ color: 0x2b2117 }));
  cizgi.rotation.x = -Math.PI / 2; cizgi.position.y = 0.01; scene.add(cizgi);

  let battle = null;
  let secili = null;          // seçili karakter id
  let surulenler = new Set(); // bu savaşta sürülen karakterler
  const meshler = new Map();  // unit → mesh
  let sonucVerildi = false;

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);

  function unitEkle(unit, charId) {
    const savas = battle;
    buildCharacter(charId).then(mesh => {
      // Model yüklenene dek birim ölmüş ya da savaş sıfırlanmış olabilir
      if (battle !== savas || !battle.units.includes(unit)) return;
      mesh.position.set(unit.x, 0, unit.z);
      // Yürüyüş animasyonu yönlü: rakibe 45° dönük dur ki hem yüz hem adım görünsün.
      mesh.rotation.y = unit.side === 'enemy' ? -Math.PI / 4 : Math.PI / 4;
      mesh.userData.anim = animKur(mesh);
      scene.add(mesh);
      meshler.set(unit, mesh);
    });
  }

  function elCiz() {
    const kartlar = state.ownedCharacters.map(id => {
      const c = byId[id];
      const kapali = surulenler.has(id) ? ' used' : '';
      const seciliMi = secili === id ? ' selected' : '';
      return `<div class="minicard${kapali}${seciliMi}" data-id="${id}">
        <img src="${c.card}" alt="${c.name}">${c.name}</div>`;
    }).join('');
    const iksirBtnleri = IKSIRLER
      .filter(([id]) => state.inventory[id] > 0)
      .map(([id, ikon]) => `<button class="actbtn" data-iksir="${id}">${ikon} ${ITEM_NAMES[id]} ×${state.inventory[id]}</button>`)
      .join('');
    const topBtn = `<button class="actbtn" data-top="1" ${battle?.cannonUsed ? 'disabled' : ''}>💣 Top${battle?.cannonUsed ? ' (kullanıldı)' : ''}</button>`;
    ui.innerHTML = `<div class="handrow">${kartlar}</div>
      <div class="actrow">${topBtn}${iksirBtnleri}</div>
      <p class="map-hint" style="color:#F5EBD3;margin:.2rem 0">Karta dokun, sonra sol yarıya dokunup sür — Seviye ${state.battleLevel}</p>`;
    ui.querySelectorAll('.minicard:not(.used)').forEach(k =>
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
    ui.querySelector('[data-top]')?.addEventListener('pointerdown', () => {
      if (!battle || battle.over) return;
      if (fireCannon(battle)) { sfx.cannon(); elCiz(); }
    });
  }

  function baslat() {
    // Eski meshleri temizle
    for (const m of meshler.values()) scene.remove(m);
    meshler.clear();
    ekran.querySelector('.victory')?.remove();
    battle = createBattle(state.battleLevel);
    secili = null; surulenler = new Set(); sonucVerildi = false;
    for (const [i, stats] of enemyWave(state.battleLevel).entries()) {
      const u = deployUnit(battle, 'enemy', stats, 5 + (i % 2) * 2.5, -4 + Math.floor(i / 2) * 2.5);
      unitEkle(u, 'dusman');
    }
    elCiz();
    resize();
  }

  function sur(charId, x, z) {
    if (!battle || battle.over || surulenler.has(charId)) return;
    const c = byId[charId];
    const u = deployUnit(battle, 'player', { atk: c.atk, def: c.def, spd: c.spd, range: c.range }, x, z);
    unitEkle(u, charId);
    surulenler.add(charId);
    secili = null;
    sfx.deploy();
    elCiz();
  }

  canvas.addEventListener('pointerdown', e => {
    if (!secili || !battle || battle.over) return;
    const r = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObject(arena)[0];
    if (!hit || hit.point.x > 0) return; // sadece sol yarı
    sur(secili, hit.point.x, hit.point.z);
  });

  function sonuc() {
    sonucVerildi = true;
    const panel = document.createElement('div');
    panel.className = 'victory';
    if (battle.winner === 'player') {
      const odul = battleRewards();
      const kazanilanAltin = odul.gold * battle.goldMult; // altın iksiri ×2
      addGold(state, kazanilanAltin);
      addItem(state, odul.loot, 1);
      if (odul.gems) addGems(state, odul.gems);
      state.battleLevel += 1;
      refreshHud(state);
      sfx.victory();
      panel.innerHTML = `<b>Zafer!</b> +${kazanilanAltin} 🪙 · Ganimet: ${ITEM_NAMES[odul.loot]}${odul.gems ? ` · +${odul.gems} 💎` : ''}<br><br>`;
    } else {
      sfx.defeat();
      panel.innerHTML = `<b>Kaybettin</b> Tekrar dene!<br><br>`;
    }
    const don = document.createElement('button');
    don.className = 'bigbtn'; don.textContent = 'Köye Dön';
    don.addEventListener('pointerdown', () => { panel.remove(); show('s-koy'); });
    panel.appendChild(don);
    ekran.appendChild(panel);
  }

  let onceki = performance.now();
  renderer.setAnimationLoop(() => {
    const simdi = performance.now();
    // Sabit adımlı ilerletme: nadir frame'lerde (arka plan sekmesi, headless) bile
    // sim tutarlı kalır; frame başına en fazla 0.5 sn simüle edilir.
    const dt = Math.min((simdi - onceki) / 1000, 0.5);
    onceki = simdi;
    if (battle && !battle.over) {
      let kalan = dt;
      while (kalan > 0) { tick(battle, Math.min(kalan, 0.05)); kalan -= 0.05; }
    }
    if (battle) {
      for (const [unit, mesh] of meshler) {
        if (unit.hp <= 0 || !battle.units.includes(unit)) { scene.remove(mesh); meshler.delete(unit); continue; }
        mesh.position.set(unit.x, 0, unit.z);
        animIlerlet(mesh, unit, dt, simdi);
      }
      if (battle.over && !sonucVerildi) sonuc();
    }
    renderer.render(scene, camera);
  });

  return { onShow: baslat, autoDeploy: sur };
}
