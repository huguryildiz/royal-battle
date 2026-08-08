// js/ui/hud.js
import { save } from '../state.js';
const fmt = n => n.toLocaleString('tr-TR');
export function refreshHud(state) {
  document.getElementById('gold-n').textContent = fmt(state.gold);
  document.getElementById('gem-n').textContent = fmt(state.gems);
  save(state);
}
export function initHud(state) { refreshHud(state); }
