// js/main.js — boot: state yükle, HUD bağla, köy sahnesini başlat.
import { initTabs, show, register } from './screens.js';
import { load } from './state.js';
import { initHud } from './ui/hud.js';
import { initVillage } from './village/scene.js';

export const gameState = load();
initTabs();
initHud(gameState);

const village = await initVillage({
  canvas: document.getElementById('village-canvas'),
  onBuildingTap: hedef => {
    const ekran = { is: 's-is', asker: 's-dukkan', savas: 's-savas', envanter: 's-envanter' }[hedef];
    if (ekran) show(ekran);
  },
});
register('s-koy', { onShow: village.resize });
show('s-koy');
