// js/ui/shop.js — karakter dükkanı. buyCharacter SAF, renderShop DOM.
import { CHARACTERS } from '../balance.js';
import { spendGold, spendGems, ownCharacter } from '../state.js';
import { refreshHud } from './hud.js';
import { sfx } from './sound.js';

const byId = Object.fromEntries(CHARACTERS.map(c => [c.id, c]));
const fmt = n => n.toLocaleString('tr-TR');

export function buyCharacter(state, charId) {
  const c = byId[charId];
  if (state.ownedCharacters.includes(charId)) return 'zaten-var';
  const odendi = 'gold' in c.cost ? spendGold(state, c.cost.gold) : spendGems(state, c.cost.gems);
  if (!odendi) return 'yetersiz';
  ownCharacter(state, charId);
  return 'ok';
}

const BADGE = { normal: ['n', 'Normal'], ultra: ['u', 'Ultra Özel'], invisible: ['i', 'Invisible'] };

// Vitrin ucuzdan pahalıya dizilir (önce altınlılar, sonra taşlılar): çocuk "sıradaki neyi
// alabilirim"i soldan sağa okuyabilsin. Kart tasarımı ve statlar Aslan'ın; yalnızca sıra.
const TIER_SIRA = { normal: 0, ultra: 1, invisible: 2 };
const fiyatOf = c => c.cost.gold ?? c.cost.gems;
const VITRIN = [...CHARACTERS].sort((a, b) =>
  TIER_SIRA[a.tier] - TIER_SIRA[b.tier] || fiyatOf(a) - fiyatOf(b));

export function renderShop(state) {
  const root = document.getElementById('shop-ui');
  const cards = VITRIN.map(c => {
    const sahip = state.ownedCharacters.includes(c.id);
    const [bk, bn] = BADGE[c.tier];
    const fiyat = 'gold' in c.cost ? `🪙 ${fmt(c.cost.gold)}` : `💎 ${fmt(c.cost.gems)}`;
    const btn = sahip
      ? '<button class="buy owned" disabled>Senin!</button>'
      : `<button class="buy ${'gold' in c.cost ? 'gold' : 'gem-b'}" data-id="${c.id}">${fiyat}</button>`;
    return `
      <div class="card ${c.tier === 'ultra' ? 'ultra' : ''} ${c.tier === 'invisible' ? 'invis' : ''}">
        <img src="${c.card}" alt="${c.name} — Aslan'ın çizimi"
             onerror="this.outerHTML='<div style=&quot;aspect-ratio:4/5;display:flex;align-items:center;justify-content:center;font-size:3rem;font-weight:900;background:#D9C79E&quot;>${c.name[0]}</div>'">
        <div class="body">
          <div class="name">${c.name} <span class="badge ${bk}">${bn}</span></div>
          <div class="stats">
            <span class="stat"><b>${c.atk}</b><i>ATK</i></span>
            <span class="stat"><b>${c.def}</b><i>DEF</i></span>
            <span class="stat"><b>${c.spd}</b><i>HIZ</i></span>
          </div>
          ${btn}
          <div class="map-hint buy-msg" data-msg="${c.id}"></div>
        </div>
      </div>`;
  });
  root.innerHTML = `
    <h2>Asker Alma Yeri <small>Kartlar: Aslan Yıldız'ın tasarımları</small></h2>
    <div class="cards">${cards.join('')}</div>`;
  root.querySelectorAll('.buy[data-id]').forEach(b =>
    b.addEventListener('pointerdown', () => {
      const sonuc = buyCharacter(state, b.dataset.id);
      if (sonuc === 'ok') { sfx.coin(); refreshHud(state); renderShop(state); }
      else if (sonuc === 'yetersiz') {
        const msg = root.querySelector(`[data-msg="${b.dataset.id}"]`);
        msg.textContent = 'Yetersiz! Daha çok kazanmalısın.';
        setTimeout(() => { msg.textContent = ''; }, 1500);
      }
    }));
}
