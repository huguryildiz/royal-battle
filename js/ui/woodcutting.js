// js/ui/woodcutting.js — odun kesme mini-oyunu. chopReward SAF, gerisi DOM.
import { addGold, addItem } from '../state.js';
import { WOOD_GOLD } from '../balance.js';
import { refreshHud } from './hud.js';
import { sfx } from './sound.js';

export function chopReward(state) {
  addGold(state, WOOD_GOLD);
  addItem(state, 'odun', 1);
}

const ROUND = 10;

export function initWoodcutting(state) {
  const root = document.getElementById('wood-ui');

  function resetRound() {
    root.innerHTML = `
      <h2>Odun Kesme <small>Oduna dokun, baltayla kır — her odun ${WOOD_GOLD} altın</small></h2>
      <div class="panel"><div class="forest"></div></div>
      <p class="map-hint">Kestiğin odun: <b class="cut-n">0</b> · Kazandığın altın: <b class="cut-gold">0</b></p>`;
    const forest = root.querySelector('.forest');
    let cut = 0;
    for (let i = 0; i < ROUND; i++) {
      const b = document.createElement('button');
      b.className = 'log';
      b.setAttribute('aria-label', 'Odun kes');
      b.innerHTML = `<span class="chip">+${WOOD_GOLD}</span>`;
      b.addEventListener('pointerdown', () => {
        if (b.classList.contains('cut')) return;
        b.classList.add('cut');
        cut++;
        sfx.chop();
        chopReward(state);
        refreshHud(state);
        root.querySelector('.cut-n').textContent = cut;
        root.querySelector('.cut-gold').textContent = cut * WOOD_GOLD;
        if (cut === ROUND) {
          const done = document.createElement('button');
          done.className = 'bigbtn';
          done.textContent = `Tur bitti! +${ROUND * WOOD_GOLD} 🪙 — Tekrar`;
          done.addEventListener('pointerdown', resetRound);
          root.appendChild(done);
        }
      });
      forest.appendChild(b);
    }
  }

  return { onShow: resetRound };
}
