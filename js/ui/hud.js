// js/ui/hud.js
import { save } from '../state.js';
import { sfx, sesDegistir } from './sound.js';
const fmt = n => n.toLocaleString('tr-TR');
export function refreshHud(state) {
  document.getElementById('gold-n').textContent = fmt(state.gold);
  document.getElementById('gem-n').textContent = fmt(state.gems);
  save(state);
}
function sesBtnCiz(btn) {
  btn.textContent = sfx.enabled ? '🔊' : '🔇';
  btn.classList.toggle('kapali', !sfx.enabled);
}
export function initHud(state) {
  refreshHud(state);
  const btn = document.getElementById('ses-btn');
  sesBtnCiz(btn);
  btn.addEventListener('pointerdown', () => { sesDegistir(); sesBtnCiz(btn); });
}
