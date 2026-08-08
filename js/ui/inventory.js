// js/ui/inventory.js — köy envanteri: 24 slot, dolu/boş sayacı.
import { ITEM_NAMES } from '../balance.js';

const SLOTS = 24;
const ICONS = {
  odun: '🪵', kalkan: '🛡️', kilic: '⚔️', yay: '🏹', tufek: '🔫',
  'guc-iksiri': '💪', 'altin-iksir': '✨', 'mega-deprem-iksiri': '🌋',
};

export function renderInventory(state) {
  const root = document.getElementById('inv-ui');
  const entries = Object.entries(state.inventory).filter(([, qty]) => qty > 0);
  const dolu = entries.length;
  const slots = entries.map(([id, qty]) => `
    <div class="slot"><span class="ico">${ICONS[id] ?? '📦'}</span>${ITEM_NAMES[id] ?? id}<span class="qty">×${qty}</span></div>`);
  while (slots.length < SLOTS) slots.push('<div class="slot empty">boş</div>');
  root.innerHTML = `
    <h2>Köy Envanteri <small>Savaş ganimetleri ve eşyaların</small></h2>
    <div class="invmeta"><span>Dolu yer: <b>${dolu}</b></span><span>Boş yer: <b>${SLOTS - dolu}</b></span></div>
    <div class="panel"><div class="slots">${slots.join('')}</div></div>`;
}
