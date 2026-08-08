// js/main.js — boot: state yükle, HUD bağla, köy sahnesini başlat.
import { initTabs, show, register } from './screens.js';
import { load } from './state.js';
import { initHud } from './ui/hud.js';
import { initVillage } from './village/scene.js';
import { initWoodcutting } from './ui/woodcutting.js';
import { renderInventory } from './ui/inventory.js';

export const gameState = load();
initTabs();
initHud(gameState);
register('s-is', initWoodcutting(gameState));
register('s-envanter', { onShow: () => renderInventory(gameState) });

const village = await initVillage({
  canvas: document.getElementById('village-canvas'),
  onBuildingTap: hedef => {
    const ekran = { is: 's-is', asker: 's-dukkan', savas: 's-savas', envanter: 's-envanter' }[hedef];
    if (ekran) show(ekran);
  },
});
register('s-koy', { onShow: village.resize });
// Screenshot/dev kolaylığı: #is gibi bir hash ile doğrudan ekran açılabilir.
show(location.hash ? 's-' + location.hash.slice(1) : 's-koy');
