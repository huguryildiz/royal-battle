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
const DEKOR = [
  ['assets/tripo/kale.png', 50, 26, 16],           // kale (merkez, Tripo 3D'den render)
  ['medievalStructure_16', 33, 52, 8],             // evler
  ['medievalStructure_17', 65, 54, 8],
  ['medievalStructure_18', 70, 16, 8],
  ['medievalEnvironment_03', 6, 22, 5],            // İş çevresi: ağaçlar
  ['medievalEnvironment_01', 24, 20, 4],
  ['medievalEnvironment_02', 9, 40, 4],
  ['medievalEnvironment_21', 40, 10, 4],
  ['medievalEnvironment_03', 58, 8, 5],
  ['medievalEnvironment_01', 92, 62, 4],
  ['medievalEnvironment_05', 22, 38, 5],           // kütük
  ['medievalEnvironment_17', 5, 84, 5],            // Maden çevresi: cevher kayaları
  ['medievalEnvironment_11', 24, 80, 5],
  ['medievalEnvironment_07', 30, 90, 4],
  ['medievalEnvironment_16', 10, 62, 4],
  ['medievalEnvironment_07', 70, 88, 4],           // serpiştirme taş/çalı
  ['medievalEnvironment_12', 44, 44, 3],
  ['medievalEnvironment_19', 90, 16, 3],
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
