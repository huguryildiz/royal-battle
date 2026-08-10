// js/balance.js — SAF denge verisi. Statlar Aslan Yıldız'ın tasarımı; DEĞİŞTİRME.
// Fiyatlar spec'te yok; ölçülen savaş gücüne göre konuluyor (bkz. tests/balance.test.mjs).
export const CHARACTERS = [
  { id: 'savasci', name: 'Savaşçı', tier: 'normal', atk: 50, def: 94, spd: 75, range: 1.8, cost: { gold: 0 }, card: 'assets/cards/savasci.jpg' },
  { id: 'okcu', name: 'Okçu', tier: 'normal', atk: 89, def: 30, spd: 100, range: 6, cost: { gold: 150 }, card: 'assets/cards/okcu.jpg' },
  { id: 'buyucu', name: 'Büyücü', tier: 'normal', atk: 98, def: 89, spd: 69, range: 6, cost: { gold: 500 }, card: 'assets/cards/buyucu.jpg' },
  { id: 'buz-ejderhasi', name: 'Buz Ejderhası', tier: 'normal', atk: 91, def: 50, spd: 92, range: 6, cost: { gold: 300 }, card: 'assets/cards/buz-ejderhasi.jpg' },
  { id: 'maden-dinozoru', name: 'Maden Dinozoru', tier: 'normal', atk: 100, def: 100, spd: 21, range: 1.8, cost: { gold: 700 }, card: 'assets/cards/maden-dinozoru.jpg' },
  { id: 'altin-ordu', name: 'Altın Ordu', tier: 'ultra', atk: 100, def: 100, spd: 100, range: 1.8, cost: { gems: 240 }, card: 'assets/cards/altin-ordu.jpg' },
  { id: 'altin-bomba-cicegi', name: 'Altın Bomba Çiçeği', tier: 'ultra', atk: 100, def: 100, spd: 100, range: 6, cost: { gems: 160 }, card: 'assets/cards/altin-bomba-cicegi.jpg' },
  { id: 'kara-ruh', name: 'Kara Ruh', tier: 'invisible', atk: 101, def: 101, spd: 101, range: 1.8, cost: { gems: 320 }, card: 'assets/cards/kara-ruh.jpg' },
];
export const WOOD_GOLD = 6;
// Maden: 8 kayalık tur, her kaya 3 dokunuşta kırılır; %55 ihtimalle 2–5 💎, yoksa 4 🪙.
export const MINE = { rocks: 8, tapsPerRock: 3, chance: 0.55, min: 2, max: 5, gold: 4 };
// Zafer altını seviyeyle büyür: erken savaşlar ilk kartı, geç savaşlar dinozoru finanse etsin.
export const BATTLE_WIN_GOLD = 40;
export const BATTLE_GOLD_PER_LEVEL = 12;
export function battleGold(level) { return BATTLE_WIN_GOLD + BATTLE_GOLD_PER_LEVEL * (level - 1); }
export const GEM_DROP = { chance: 0.45, min: 6, max: 18 };
export const LOOT_TABLE = ['kalkan', 'kilic', 'yay', 'tufek', 'guc-iksiri', 'altin-iksir'];
// Tüfek: tek kullanımlık, taktığı birimi uzun menzilli yapar.
export const RIFLE = { range: 8, atk: 10 };
export const ITEM_NAMES = {
  odun: 'Odun', kalkan: 'Kalkan', kilic: 'Kılıç', yay: 'Yay', tufek: 'Tüfek',
  'guc-iksiri': 'Güç İksiri', 'altin-iksir': 'Altın İksir', 'mega-deprem-iksiri': 'Mega Deprem İksiri',
};
export const SELL_PRICES = {
  odun: 1, kalkan: 15, kilic: 20, yay: 20, tufek: 30,
  'guc-iksiri': 25, 'altin-iksir': 30, 'mega-deprem-iksiri': 50,
};
// Savaşta kart sürme maliyeti (iksir). Statlara dokunmaz; Clash Royale tarzı sürüm için ek.
// Maliyetler simülasyonla ölçüldü (kartı desteye ekleyince kazanma oranı ne oluyor):
// Okçu 2 iksirken tek başına her seviyeyi kazanıyordu, Maden Dinozoru 4-5 iksirken
// desteye eklenince kazanma oranını düşürüyordu. Bu değerlerle her kart desteye katkı veriyor.
export const ELIXIR_COST = {
  savasci: 3, okcu: 3, buyucu: 5, 'buz-ejderhasi': 3,
  'maden-dinozoru': 3, 'altin-ordu': 6, 'altin-bomba-cicegi': 6, 'kara-ruh': 7,
};
// Her 5. seviye boss seviyesi: tek dev birim + normal dalga yarıya iner, altın ×2.
export function isBossLevel(level) { return level % 5 === 0; }

// Düşman da iksirle asker sürer. Sabit sürüm sıklığı iki hatayı birden yapıyordu:
// tek seferlik dalga bitince düşman takviye alamıyor (her seviye %100 kazanılıyor), ya da
// sıklık artırılınca düşman oyuncunun iksir ekonomisini katlıyor (10. seviyeden sonra
// hiç kazanılamıyor). Artık iki taraf da aynı dilde: birim başına iksir / iksir hızı.
// Oyuncunun iksir hızı 1/1.2 ≈ 0.83/sn (bkz. sim.js ELIXIR).
export const ENEMY_SPAWN = {
  first: 1.5,
  cost: { asker: 3, okcu: 3, boss: 8 },
  rate: level => Math.min(0.76, 0.42 + 0.018 * (level - 1)),
  waves: level => 1 + Math.floor((level - 1) / 4),
};
export function enemyGap(level, tip) {
  return (ENEMY_SPAWN.cost[tip] ?? 3) / ENEMY_SPAWN.rate(level);
}

// Arena seviyesi: düşman birimlerini ve HER İKİ tarafın kulelerini aynı katsayıyla büyütür.
// TAVAN önemli: oyuncunun statları sabit (Aslan'ın kararı), düşmanınki büyüyor. Bir birimin
// gücü ~ölçek² olduğundan tavansız büyümede 12. seviyeden sonra düşmanın iksir başına gücü
// oyuncunun en iyi kartını geçiyor ve savaş matematiksel olarak kazanılamaz hâle geliyor.
// 1.45 tavanı, en güçlü kartın iksir başına gücüyle başa baş gelen nokta.
export const LEVEL_SCALE_MAX = 1.45;
export function levelScale(level) { return Math.min(LEVEL_SCALE_MAX, 1 + 0.05 * (level - 1)); }

export function enemyWave(level) {
  const k = levelScale(level);
  const boss = isBossLevel(level);
  const n = Math.min(level, 6); // 1. seviye tek düşman: ilk savaş kazanılabilir
  const adet = boss ? Math.ceil(n / 2) : n;
  const birlikler = Array.from({ length: adet }, (_, i) =>
    // 3. seviyeden itibaren her ikinci birim menzilli düşman okçusu
    (level >= 3 && i % 2 === 1)
      ? { tip: 'okcu', atk: Math.round(60 * k), def: Math.round(30 * k), spd: 90, range: 6 }
      : { tip: 'asker', atk: Math.round(45 * k), def: Math.round(60 * k), spd: 70, range: 1.8 });
  if (boss) {
    birlikler.unshift({ tip: 'boss', atk: Math.round(90 * k), def: Math.round(220 * k), spd: 40, range: 2.2 });
  }
  return birlikler;
}

// Takviye dalgası: açılış dalgasının boss'suz hâli. Boss savaş başına tektir —
// aksi hâlde 20. seviyede arka arkaya 5 boss geliyor ve savaş kazanılamıyordu.
export function enemyReinforcement(level) {
  return enemyWave(level).filter(u => u.tip !== 'boss');
}
