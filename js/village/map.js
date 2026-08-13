// js/village/map.js — 2D köy haritası: Kenney Medieval RTS spriteları,
// tıklanabilir binalar etiketli düğme, dekor sessiz. Tap → ekran.
const S = 'assets/kenney/medieval-2d/';

// Tıklanabilir binalar: [hedef, sprite, simge, etiket, x%, y%, genişlik%]
// Etiketler alt sekme adlarıyla birebir aynı (Maden'in sekmesi yok, tek kapısı burası).
// Sprite'lar Tripo modellerinden render: ./sprite.sh bina-<ad> 0 18
// (yaw 0 şart — Tripo binanın ön yüzünü +Z'ye koyuyor, 90'da yandan bakılıyor.)
const BINALAR = [
  ['savas',    'assets/sprites/bina-savas.png',    '⚔️', 'Savaş',    85, 38, 15],
  ['is',       'assets/sprites/bina-is.png',       '🪓', 'İş',       15, 30, 15],
  ['maden',    'assets/sprites/bina-maden.png',    '⛏️', 'Maden',    14, 74, 13],
  ['envanter', 'assets/sprites/bina-envanter.png', '🎒', 'Envanter', 48, 78, 14],
  ['dukkan',   'assets/sprites/bina-dukkan.png',   '🛒', 'Dükkan',   82, 76, 13],
];

// Dekor: [sprite, x%, y%, genişlik%]
// Tripo render'ları tam yolla, Kenney sprite'ları çıplak adla yazılır.
const D = 'assets/sprites/';
const DEKOR = [
  ['assets/tripo/kale.png', 50, 26, 16],           // kale (merkez, Tripo 3D'den render)
  [D + 'dekor-ev-a.png', 33, 52, 9],               // evler
  [D + 'dekor-ev-b.png', 65, 54, 9],
  [D + 'dekor-ev-a.png', 70, 16, 8],
  ['medievalEnvironment_03', 6, 22, 5],            // İş çevresi: çamlar (Tripo çamı beklemede)
  ['medievalEnvironment_01', 24, 20, 4],
  [D + 'dekor-agac.png', 9, 40, 6],                // yapraklı ağaçlar
  [D + 'dekor-agac.png', 40, 10, 5],
  ['medievalEnvironment_03', 58, 8, 5],
  [D + 'dekor-agac.png', 92, 62, 6],
  [D + 'dekor-kutuk.png', 22, 38, 5],              // kütük
  [D + 'dekor-cevher.png', 5, 84, 6],              // Maden çevresi: cevher kayaları
  [D + 'dekor-cevher.png', 24, 80, 5],
  [D + 'dekor-tas.png', 30, 90, 5],
  [D + 'dekor-tas.png', 10, 62, 4],
  [D + 'dekor-tas.png', 70, 88, 5],                // serpiştirme taş
  [D + 'dekor-tas.png', 44, 44, 3],
  [D + 'dekor-tas.png', 90, 16, 3],
];

// Köy yolu: kale önünden binalara kıvrılan patika (viewBox 0-100).
const YOL = [
  'M 50 42 C 50 60, 49 66, 48 74',      // kale → ambar
  'M 49 62 C 35 66, 24 68, 16 72',      // → maden
  'M 49 62 C 62 68, 72 72, 81 74',      // → dükkan
  'M 50 42 C 66 42, 74 40, 83 38',      // kale → savaş kapısı
  'M 50 42 C 38 38, 26 34, 17 31',      // kale → iş
];

export function initVillage({ root, onBuildingTap }) {
  const yol = YOL.map(d => `<path d="${d}"/>`).join('');
  const dekor = DEKOR.map(([sprite, x, y, w]) =>
    `<img class="decor" src="${sprite.includes('/') ? sprite : S + sprite + '.png'}" alt="" aria-hidden="true" draggable="false"
          style="left:${x}%;top:${y}%;width:${w}%;z-index:${Math.round(y)}">`).join('');
  const binalar = BINALAR.map(([hedef, sprite, simge, etiket, x, y, w]) =>
    `<button class="bldg" type="button" data-hedef="${hedef}" aria-label="${etiket}"
             style="left:${x}%;top:${y}%;width:${w}%;z-index:${Math.round(y)}">
       <img src="${sprite.includes('/') ? sprite : S + sprite + '.png'}" alt="" draggable="false">
       <span class="plaque">${simge} ${etiket}</span>
     </button>`).join('');
  root.innerHTML = `<div id="vboard">
    <svg class="vpath" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${yol}</svg>
    ${dekor}${binalar}</div>`;
  root.querySelectorAll('.bldg').forEach(b =>
    b.addEventListener('click', () => onBuildingTap(b.dataset.hedef)));
}
