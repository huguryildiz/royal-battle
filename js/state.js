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
