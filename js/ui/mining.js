// js/ui/mining.js — maden mini-oyunu. mineReward SAF, gerisi DOM.
import { addGold, addGems } from '../state.js';
import { MINE } from '../balance.js';
import { refreshHud } from './hud.js';
import { sfx } from './sound.js';

// Kaya kırılınca: MINE.chance ihtimalle 1–3 💎, tutmazsa 1 🪙 teselli.
export function mineReward(state, rng = Math.random) {
  if (rng() < MINE.chance) {
    const n = MINE.min + Math.floor(rng() * (MINE.max - MINE.min + 1));
    addGems(state, n);
    return { gems: n, gold: 0 };
  }
  addGold(state, MINE.gold);
  return { gems: 0, gold: MINE.gold };
}

export function initMining(state) {
  const root = document.getElementById('mine-ui');

  function resetRound() {
    root.innerHTML = `
      <h2>Maden <small>Kayaya ${MINE.tapsPerRock} kez vur, kır — içinden 💎 çıkabilir</small></h2>
      <div class="panel"><div class="mine"></div></div>
      <p class="map-hint">Kırdığın kaya: <b class="rock-n">0</b> · Bulduğun elmas: <b class="rock-gem">0</b> 💎</p>`;
    const alan = root.querySelector('.mine');
    let kirilan = 0, taslar = 0;
    for (let i = 0; i < MINE.rocks; i++) {
      const b = document.createElement('button');
      b.className = 'rock';
      b.setAttribute('aria-label', 'Kayaya vur');
      b.innerHTML = '<span class="chip"></span>';
      let vurus = 0;
      b.addEventListener('pointerdown', () => {
        if (b.classList.contains('broken')) return;
        vurus++;
        sfx.chop();
        b.classList.add(`hit${Math.min(vurus, MINE.tapsPerRock - 1)}`);
        if (vurus < MINE.tapsPerRock) return;
        b.classList.add('broken');
        kirilan++;
        const odul = mineReward(state);
        taslar += odul.gems;
        if (odul.gems) sfx.coin();
        b.querySelector('.chip').textContent = odul.gems ? `+${odul.gems} 💎` : `+${odul.gold} 🪙`;
        refreshHud(state);
        root.querySelector('.rock-n').textContent = kirilan;
        root.querySelector('.rock-gem').textContent = taslar;
        if (kirilan === MINE.rocks) {
          const done = document.createElement('button');
          done.className = 'bigbtn';
          done.textContent = `Tur bitti! +${taslar} 💎 — Tekrar`;
          done.addEventListener('pointerdown', resetRound);
          root.appendChild(done);
        }
      });
      alan.appendChild(b);
    }
  }

  return { onShow: resetRound };
}
