// js/ui/inventory.js — köy envanteri: 24 slot, dolu/boş sayacı, eşya satma.
import { ITEM_NAMES, SELL_PRICES } from '../balance.js';
import { addGold } from '../state.js';
import { refreshHud } from './hud.js';
import { sfx } from './sound.js';

// SAF: eşya sat → adet düşer, altın artar.
export function sellItem(state, id) {
  if (!(state.inventory[id] > 0)) return 'yok';
  state.inventory[id] -= 1;
  if (state.inventory[id] === 0) delete state.inventory[id];
  addGold(state, SELL_PRICES[id] ?? 1);
  return 'ok';
}

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
    <div class="slot"><span class="ico">${ICONS[id] ?? '📦'}</span>${ITEM_NAMES[id] ?? id}<span class="qty">×${qty}</span>
      <button class="sell" data-id="${id}">Sat +${SELL_PRICES[id] ?? 1}🪙</button></div>`);
  while (slots.length < SLOTS) slots.push('<div class="slot empty">boş</div>');
  root.innerHTML = `
    <h2>Köy Envanteri <small>Savaş ganimetleri ve eşyaların — satmak için "Sat"a dokun</small></h2>
    <div class="invmeta"><span>Dolu yer: <b>${dolu}</b></span><span>Boş yer: <b>${SLOTS - dolu}</b></span></div>
    <div class="panel"><div class="slots">${slots.join('')}</div></div>`;
  root.querySelectorAll('.sell').forEach(b =>
    b.addEventListener('pointerdown', () => {
      if (sellItem(state, b.dataset.id) === 'ok') {
        sfx.coin();
        refreshHud(state);
        renderInventory(state);
      }
    }));
}
