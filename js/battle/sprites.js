// js/battle/sprites.js — savaş birimlerinin 3D modelden üretilmiş sprite'ları.
// Sprite'lar `./sprite.sh <id>` ile assets/sprites/<id>.png olarak üretilir: şeffaf,
// kırpılmış, alta hizalı. Sprite yoksa scene.js eski daire+kart görünümüne düşer,
// böylece modeller teker teker geldikçe oyun kırılmaz.

// Sprite'lar sağa bakar (oyuncu tarafı). Düşman tarafında yatay aynalanır.
const IDLER = [
  'savasci', 'okcu', 'buyucu', 'buz-ejderhasi',
  'maden-dinozoru', 'altin-ordu', 'altin-bomba-cicegi', 'kara-ruh',
];

// Düşman birimleri oyuncu modellerini yeniden kullanır — ayrı model üretilmedi.
// Takım halkası ve kırmızı yıkama iki tarafı ayırt etmeye yetiyor.
export const DUSMAN_SPRITE = {
  asker: 'savasci',
  okcu: 'okcu',
  boss: 'maden-dinozoru',
};

// Sprite yüksekliği = birimin dünya yarıçapı × bu katsayı. Silüetler farklı oranlarda
// olduğu için karakter başına ayarlanır; dinozor geniş ve alçak, çiçek ince ve uzun.
const BOY = {
  'buz-ejderhasi': 3.0,
  'maden-dinozoru': 2.6,
  'altin-bomba-cicegi': 3.8,
};
const VARSAYILAN_BOY = 3.3;

const yuklendi = new Map();   // id → { img, dusman }  (dusman: kırmızıya çalan kopya)

for (const id of IDLER) {
  const img = new Image();
  img.src = `assets/sprites/${id}.png`;
  img.onload = () => yuklendi.set(id, { img, dusman: kirmiziKopya(img) });
  img.onerror = () => {};     // sprite henüz üretilmemiş — sessizce eski görünüme düş
}

// Düşman kopyası: sprite'ın alfa'sı içinde kalacak şekilde kırmızı yıkama.
// Ana canvas'ta yapılamaz (arka planı da boyar), o yüzden yüklenince bir kez üretilir.
function kirmiziKopya(img) {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0);
  x.globalCompositeOperation = 'source-atop';
  x.fillStyle = 'rgba(190, 48, 32, .28)';
  x.fillRect(0, 0, c.width, c.height);
  return c;
}

// u: sim birimi. Oyuncu birimlerinde u.gorselId, düşmanlarda u.dusmanTip dolu.
export function birimSprite(u) {
  const id = u.side === 'player' ? u.gorselId : DUSMAN_SPRITE[u.dusmanTip];
  const kayit = id && yuklendi.get(id);
  if (!kayit) return null;
  return { gorsel: u.side === 'player' ? kayit.img : kayit.dusman, boy: BOY[id] ?? VARSAYILAN_BOY };
}
