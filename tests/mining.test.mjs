import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../js/state.js';
import { mineReward } from '../js/ui/mining.js';
import { MINE, CHARACTERS } from '../js/balance.js';

// rng dizisini sırayla veren yardımcı
const rngDizi = (...v) => { let i = 0; return () => v[i++ % v.length]; };

test('mineReward: şans tuttuğunda taş verir, altın vermez', () => {
  const s = createState();
  const r = mineReward(s, rngDizi(0.1, 0.0)); // 0.1 < MINE.chance → taş; 0.0 → en düşük adet
  assert.equal(r.gems, MINE.min);
  assert.equal(r.gold, 0);
  assert.equal(s.gems, MINE.min);
  assert.equal(s.gold, 100); // başlangıç altını değişmedi
});

test('mineReward: şans tutmazsa MINE.gold altın teselli', () => {
  const s = createState();
  const r = mineReward(s, rngDizi(0.9));
  assert.equal(r.gems, 0);
  assert.equal(r.gold, MINE.gold);
  assert.equal(s.gems, 0);
  assert.equal(s.gold, 100 + MINE.gold);
});

test('mineReward: en yüksek adet MINE.max', () => {
  const s = createState();
  const r = mineReward(s, rngDizi(0.0, 0.999));
  assert.equal(r.gems, MINE.max);
  assert.equal(s.gems, MINE.max);
});

const turBasiTas = MINE.rocks * MINE.chance * (MINE.min + MINE.max) / 2;

test('tur ekonomisi: bir maden turu 12-20 taş verir', () => {
  assert.ok(turBasiTas >= 12 && turBasiTas <= 20, `beklenen=${turBasiTas}`);
});

test('tur ekonomisi: en pahalı taş karakteri 30 maden turundan az sürer', () => {
  // Eski dengede Kara Ruh 465 tur (~3700 dokunuş) istiyordu — çocuk için ulaşılamazdı.
  const enPahali = Math.max(...CHARACTERS.filter(c => c.cost.gems).map(c => c.cost.gems));
  assert.ok(enPahali / turBasiTas < 30, `gereken tur=${enPahali / turBasiTas}`);
});

test('kaya 3 dokunuşta kırılır', () => {
  assert.equal(MINE.tapsPerRock, 3);
  assert.equal(MINE.rocks, 8);
});
