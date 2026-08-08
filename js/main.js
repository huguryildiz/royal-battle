// js/main.js — boot: state yükle, HUD bağla, köy sahnesini başlat.
import { initTabs, show, register } from './screens.js';
import { load } from './state.js';
import { initHud } from './ui/hud.js';
import { initVillage } from './village/map.js';
import { initWoodcutting } from './ui/woodcutting.js';
import { initMining } from './ui/mining.js';
import { renderInventory } from './ui/inventory.js';
import { renderShop } from './ui/shop.js';
import { initBattle } from './battle/scene.js';

// Dev/iPad hata teşhisi: ?debug=1 → hatalar footer'a yazılır.
if (new URLSearchParams(location.search).get('debug')) {
  addEventListener('error', e => {
    document.getElementById('credits').textContent = 'HATA: ' + e.message + ' @' + e.filename + ':' + e.lineno;
  });
  addEventListener('unhandledrejection', e => {
    document.getElementById('credits').textContent = 'REJ: ' + (e.reason?.message ?? e.reason);
  });
}

export const gameState = load();
initTabs();
initHud(gameState);
register('s-is', initWoodcutting(gameState));
register('s-maden', initMining(gameState));
register('s-envanter', { onShow: () => renderInventory(gameState) });
register('s-dukkan', { onShow: () => renderShop(gameState) });
const battle = initBattle(gameState);
register('s-savas', battle);

initVillage({
  root: document.getElementById('village-map'),
  onBuildingTap: hedef => show('s-' + hedef),
});
// Screenshot/dev kolaylığı: #is gibi bir hash ile doğrudan ekran açılabilir.
show(location.hash ? 's-' + location.hash.slice(1) : 's-koy');
// Karşılama ekranı: OYNA → oyuna gir. Hash/autobattle ile gelindiyse hiç gösterme.
const intro = document.getElementById('intro');
if (location.hash || new URLSearchParams(location.search).get('autobattle')) {
  intro.remove();
} else {
  document.getElementById('intro-seviye').textContent = gameState.battleLevel;
  document.getElementById('intro-altin').textContent = gameState.gold;
  document.getElementById('oyna-btn').addEventListener('click', () => intro.remove());
}
// Headless smoke testi: ?autobattle=1 → savaş ekranını aç, savaşçıyı otomatik sür.
if (new URLSearchParams(location.search).get('autobattle')) {
  show('s-savas');
  battle.autoDeploy('savasci', -5, 0);
}
