// js/battle/sim.js — SAF savaş simülasyonu. DOM/Three.js import ETMEZ.
import { BATTLE_WIN_GOLD, GEM_DROP, LOOT_TABLE, RIFLE } from '../balance.js';

export function createBattle(level) {
  return {
    units: [], level, over: false, winner: null,
    deployed: { player: false, enemy: false },
    goldMult: 1, atkBoost: 1, cannonUsed: false,
  };
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

export function tick(battle, dt) {
  if (battle.over) return;
  for (const u of battle.units) {
    u.cooldown -= dt;
    const dusmanlar = battle.units.filter(o => o.side !== u.side && o.hp > 0);
    if (!dusmanlar.length) continue;
    // Hedef: en yakın canlı düşman
    let hedef = dusmanlar[0], enYakin = Infinity;
    for (const d of dusmanlar) {
      const mesafe = Math.hypot(d.x - u.x, d.z - u.z);
      if (mesafe < enYakin) { enYakin = mesafe; hedef = d; }
    }
    u.target = hedef;
    if (enYakin > u.range) {
      // Menzile yürü: spd/25 birim/sn (menzil sınırını aşma)
      const adim = Math.min((u.spd / 25) * dt, enYakin - u.range);
      u.x += ((hedef.x - u.x) / enYakin) * adim;
      u.z += ((hedef.z - u.z) / enYakin) * adim;
    } else if (u.cooldown <= 0) {
      hedef.hp -= u.atk * 0.5;
      u.cooldown = 60 / u.spd;
    }
  }
  battle.units = battle.units.filter(u => u.hp > 0);
  if (battle.deployed.player && battle.deployed.enemy) {
    const kalanPlayer = battle.units.some(u => u.side === 'player');
    const kalanEnemy = battle.units.some(u => u.side === 'enemy');
    if (!kalanPlayer || !kalanEnemy) {
      battle.over = true;
      battle.winner = kalanPlayer ? 'player' : 'enemy';
    }
  }
}

// İksirler: guc-iksiri → oyuncu birimlerine atk +%50 (mevcut + sonraki),
// altin-iksir → zafer altını ×2, mega-deprem-iksiri → tüm düşmanlara 150 hasar.
export function applyPotion(battle, tip) {
  if (tip === 'guc-iksiri') {
    battle.atkBoost = 1.5;
    for (const u of battle.units) if (u.side === 'player') u.atk = Math.round(u.atk * 1.5);
  } else if (tip === 'altin-iksir') {
    battle.goldMult = 2;
  } else if (tip === 'mega-deprem-iksiri') {
    for (const u of battle.units) if (u.side === 'enemy') u.hp -= 150;
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

// Top: savaş başına 1 atış, en yüksek canlı düşmana 300 hasar.
export function fireCannon(battle) {
  if (battle.cannonUsed) return false;
  const dusmanlar = battle.units.filter(u => u.side === 'enemy' && u.hp > 0);
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
