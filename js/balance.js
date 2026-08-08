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
// Maden: 8 kayalık tur, her kaya 3 dokunuşta kırılır; %35 ihtimalle 1–3 💎, yoksa 1 🪙.
export const MINE = { rocks: 8, tapsPerRock: 3, chance: 0.35, min: 1, max: 3, gold: 1 };
export const BATTLE_WIN_GOLD = 25;
export const GEM_DROP = { chance: 0.2, min: 5, max: 15 };
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
export const ELIXIR_COST = {
  savasci: 3, okcu: 3, buyucu: 4, 'buz-ejderhasi': 4,
  'maden-dinozoru': 5, 'altin-ordu': 6, 'altin-bomba-cicegi': 6, 'kara-ruh': 7,
};
// Her 5. seviye boss seviyesi: tek dev birim + normal dalga yarıya iner, altın ×2.
export function isBossLevel(level) { return level % 5 === 0; }

export function enemyWave(level) {
  const k = 1 + 0.08 * (level - 1);
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
