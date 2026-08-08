// js/battle/sim.js — SAF savaş simülasyonu. DOM/Canvas import ETMEZ.
// Clash Royale tarzı: dikey arena, nehir + iki köprü, kuleler, iksir.
import { BATTLE_WIN_GOLD, GEM_DROP, LOOT_TABLE, RIFLE } from '../balance.js';

// Arena: x genişlik [-6,6], z uzunluk [-10,10]; oyuncu z>0 (alt), düşman z<0 (üst).
// Genişlik 12: yan kuleler (±3.4) birbirinin menzili (6.5) DIŞINDA kalır → her şeridi tek kule savunur.
export const ARENA = { w: 12, h: 20, bridgeX: 3.4, riverHalf: 0.9 };
export const ELIXIR = { start: 5, max: 10, perSec: 1 / 1.2 };
// Kule statları: hp = def*10 kuralına uyar; menzil okçudan (6) uzun ki kuleler bedava kesilmesin.
export const TOWER_STATS = {
  side: { atk: 50, def: 40, spd: 55, range: 6.5 },
  king: { atk: 60, def: 70, spd: 50, range: 6.5 },
};

export function createBattle(level) {
  return {
    units: [], level, over: false, winner: null,
    deployed: { player: false, enemy: false },
    goldMult: 1, atkBoost: 1, cannonUsed: false,
    elixir: ELIXIR.start, hasTowers: false, events: [],
  };
}

// Her iki tarafa 2 yan + 1 kral kulesi diker. Düşman kuleleri `olcek` ile güçlenir.
// Kuleli savaşta kazanan, karşı kral kulesini yıkan taraftır.
export function addTowers(battle, olcek = 1) {
  battle.hasTowers = true;
  for (const side of ['player', 'enemy']) {
    const yon = side === 'player' ? 1 : -1;
    const k = side === 'enemy' ? olcek : 1;
    for (const [tip, x, z] of [
      ['side', -ARENA.bridgeX, 5.6], ['side', ARENA.bridgeX, 5.6], ['king', 0, 8.6],
    ]) {
      const s = TOWER_STATS[tip];
      const u = deployUnit(battle, side,
        { atk: Math.round(s.atk * k), def: Math.round(s.def * k), spd: s.spd, range: s.range },
        x, z * yon);
      u.tower = tip;
    }
  }
}

export function spendElixir(battle, miktar) {
  if (battle.elixir < miktar) return false;
  battle.elixir -= miktar;
  return true;
}

export function deployUnit(battle, side, stats, x, z) {
  const boost = side === 'player' ? battle.atkBoost : 1;
  const unit = {
    side, atk: Math.round(stats.atk * boost), def: stats.def, spd: stats.spd, range: stats.range,
    hp: stats.def * 10, maxHp: stats.def * 10, x, z, target: null, cooldown: 0,
  };
  battle.units.push(unit);
  battle.deployed[side] = true;
  return unit;
}

// Kral kulesi Clash Royale kuralı: hasar alana ya da bir yan kulesi düşene dek ateş etmez.
function kralAktifMi(battle, side) {
  const kral = battle.units.find(u => u.side === side && u.tower === 'king');
  if (!kral) return false;
  if (kral.hp < kral.maxHp) return true;
  return battle.units.filter(u => u.side === side && u.tower === 'side').length < 2;
}

export function tick(battle, dt) {
  if (battle.over) return;
  battle.elixir = Math.min(ELIXIR.max, battle.elixir + ELIXIR.perSec * dt);
  const kralAktif = {
    player: kralAktifMi(battle, 'player'),
    enemy: kralAktifMi(battle, 'enemy'),
  };
  for (const u of battle.units) {
    u.cooldown -= dt;
    const dusmanlar = battle.units.filter(o => o.side !== u.side && o.hp > 0);
    if (!dusmanlar.length) continue;
    // Hedef: en yakın canlı düşman (kuleler dahil)
    let hedef = dusmanlar[0], enYakin = Infinity;
    for (const d of dusmanlar) {
      const mesafe = Math.hypot(d.x - u.x, d.z - u.z);
      if (mesafe < enYakin) { enYakin = mesafe; hedef = d; }
    }
    u.target = hedef;
    if (enYakin <= u.range) {
      if (u.tower === 'king' && !kralAktif[u.side]) continue; // uyuyan kral ateş etmez
      if (u.cooldown <= 0) {
        hedef.hp -= u.atk * 0.5;
        u.cooldown = 60 / u.spd;
        battle.events.push({ type: 'vurus', from: u, to: hedef });
        if (battle.events.length > 200) battle.events.shift();
      }
    } else if (!u.tower) {
      // Nehrin karşısındaki hedefe en yakın köprüden gidilir; aynı taraftaysa düz yürü.
      const karsida = u.z * hedef.z < 0;
      const bx = u.x < 0 ? -ARENA.bridgeX : ARENA.bridgeX;
      let hx = hedef.x, hz = hedef.z, dur = u.range;
      if (karsida && Math.abs(u.x - bx) > 0.25) { hx = bx; hz = 0; dur = 0; }
      const m = Math.hypot(hx - u.x, hz - u.z) || 1e-9;
      // Menzile yürü: spd/25 birim/sn (menzil sınırını aşma)
      const adim = Math.min((u.spd / 25) * dt, Math.max(m - dur, 0));
      u.x += ((hx - u.x) / m) * adim;
      u.z += ((hz - u.z) / m) * adim;
    }
  }
  battle.units = battle.units.filter(u => u.hp > 0);
  if (battle.hasTowers) {
    const pKral = battle.units.some(u => u.side === 'player' && u.tower === 'king');
    const eKral = battle.units.some(u => u.side === 'enemy' && u.tower === 'king');
    if (!pKral || !eKral) { battle.over = true; battle.winner = pKral ? 'player' : 'enemy'; }
  } else if (battle.deployed.player && battle.deployed.enemy) {
    const kalanPlayer = battle.units.some(u => u.side === 'player');
    const kalanEnemy = battle.units.some(u => u.side === 'enemy');
    if (!kalanPlayer || !kalanEnemy) {
      battle.over = true;
      battle.winner = kalanPlayer ? 'player' : 'enemy';
    }
  }
}

// İksirler: guc-iksiri → oyuncu birimlerine atk +%50 (mevcut + sonraki),
// altin-iksir → zafer altını ×2, mega-deprem-iksiri → tüm düşman birimlerine 150 hasar (kuleler hariç).
export function applyPotion(battle, tip) {
  if (tip === 'guc-iksiri') {
    battle.atkBoost = 1.5;
    for (const u of battle.units) if (u.side === 'player') u.atk = Math.round(u.atk * 1.5);
  } else if (tip === 'altin-iksir') {
    battle.goldMult = 2;
  } else if (tip === 'mega-deprem-iksiri') {
    for (const u of battle.units) if (u.side === 'enemy' && !u.tower) u.hp -= 150;
  }
}

// Tüfek: tek kullanımlık eşya, bir oyuncu birimine takılır — menzil 8, atk +10.
export function equipRifle(battle, unit) {
  if (!unit || unit.side !== 'player' || unit.rifle) return false;
  unit.rifle = true;
  unit.range = RIFLE.range;
  unit.atk += RIFLE.atk;
  return true;
}

// Top: savaş başına 1 atış, en yüksek canlı düşman birimine 300 hasar (kuleler hariç).
export function fireCannon(battle) {
  if (battle.cannonUsed) return false;
  const dusmanlar = battle.units.filter(u => u.side === 'enemy' && u.hp > 0 && !u.tower);
  if (!dusmanlar.length) return false;
  const hedef = dusmanlar.reduce((a, b) => (b.hp > a.hp ? b : a));
  hedef.hp -= 300;
  battle.cannonUsed = true;
  return true;
}

export function battleRewards(rng = Math.random) {
  const loot = LOOT_TABLE[Math.floor(rng() * LOOT_TABLE.length)];
  const gems = rng() < GEM_DROP.chance
    ? GEM_DROP.min + Math.floor(rng() * (GEM_DROP.max - GEM_DROP.min + 1))
    : 0;
  return { gold: BATTLE_WIN_GOLD, loot, gems };
}
