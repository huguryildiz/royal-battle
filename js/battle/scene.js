// js/battle/scene.js — 3D savaş arenası: kart seç → sol yarıya sür, otomatik dövüş.
import * as THREE from 'three';
import { createBattle, deployUnit, tick, battleRewards } from './sim.js';
import { CHARACTERS, enemyWave, ITEM_NAMES } from '../balance.js';
import { addGold, addGems, addItem } from '../state.js';
import { refreshHud } from '../ui/hud.js';
import { show } from '../screens.js';

const byId = Object.fromEntries(CHARACTERS.map(c => [c.id, c]));

// Geçici gövdeler — Task 12'de characters/builder.js gerçekleriyle değiştirecek.
const TEMP_COLORS = {
  savasci: 0x8a3b2e, okcu: 0x3e7c4f, buyucu: 0x6b3fa0, 'buz-ejderhasi': 0x9bd7e8,
  'maden-dinozoru': 0x6e7d5a, 'altin-ordu': 0xe9b33c, 'altin-bomba-cicegi': 0x74b35c,
  'kara-ruh': 0x3a2a5e, dusman: 0x5a5f66,
};
function buildTempBody(charId) {
  const renk = TEMP_COLORS[charId] ?? TEMP_COLORS.dusman;
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: renk });
  const govde = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1, 0.45), mat);
  govde.position.y = 0.9;
  const kafa = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.45), mat);
  kafa.position.y = 1.65;
  g.add(govde, kafa);
  if (charId === 'kara-ruh') {
    mat.transparent = true; mat.opacity = 0.55;
  }
  return g;
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
    const mesh = buildTempBody(charId);
    mesh.position.set(unit.x, 0, unit.z);
    scene.add(mesh);
    meshler.set(unit, mesh);
  }

  function elCiz() {
    const kartlar = state.ownedCharacters.map(id => {
      const c = byId[id];
      const kapali = surulenler.has(id) ? ' used' : '';
      const seciliMi = secili === id ? ' selected' : '';
      return `<div class="minicard${kapali}${seciliMi}" data-id="${id}">
        <img src="${c.card}" alt="${c.name}">${c.name}</div>`;
    }).join('');
    ui.innerHTML = `<div class="handrow">${kartlar}</div>
      <p class="map-hint" style="color:#F5EBD3;margin:.2rem 0">Karta dokun, sonra sol yarıya dokunup sür — Seviye ${state.battleLevel}</p>`;
    ui.querySelectorAll('.minicard:not(.used)').forEach(k =>
      k.addEventListener('pointerdown', () => { secili = k.dataset.id; elCiz(); }));
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
      addGold(state, odul.gold);
      addItem(state, odul.loot, 1);
      if (odul.gems) addGems(state, odul.gems);
      state.battleLevel += 1;
      refreshHud(state);
      panel.innerHTML = `<b>Zafer!</b> +${odul.gold} 🪙 · Ganimet: ${ITEM_NAMES[odul.loot]}${odul.gems ? ` · +${odul.gems} 💎` : ''}<br><br>`;
    } else {
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
    let kalan = Math.min((simdi - onceki) / 1000, 0.5);
    onceki = simdi;
    if (battle && !battle.over) {
      while (kalan > 0) { tick(battle, Math.min(kalan, 0.05)); kalan -= 0.05; }
      for (const [unit, mesh] of meshler) {
        if (unit.hp <= 0 || !battle.units.includes(unit)) { scene.remove(mesh); meshler.delete(unit); }
        else mesh.position.set(unit.x, 0, unit.z);
      }
      if (battle.over && !sonucVerildi) sonuc();
    }
    renderer.render(scene, camera);
  });

  return { onShow: baslat, autoDeploy: sur };
}
