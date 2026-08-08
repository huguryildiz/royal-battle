import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../js/state.js';
import { mineReward } from '../js/ui/mining.js';
import { MINE } from '../js/balance.js';

// rng dizisini sırayla veren yardımcı
const rngDizi = (...v) => { let i = 0; return () => v[i++ % v.length]; };

test('mineReward: şans tuttuğunda taş verir, altın vermez', () => {
  const s = createState();
  const r = mineReward(s, rngDizi(0.1, 0.0)); // 0.1 < 0.35 → taş; 0.0 → en düşük adet
  assert.equal(r.gems, MINE.min);
  assert.equal(r.gold, 0);
  assert.equal(s.gems, MINE.min);
  assert.equal(s.gold, 100); // başlangıç altını değişmedi
});

test('mineReward: şans tutmazsa 1 altın teselli', () => {
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

test('tur ekonomisi: beklenen taş 4-8 arası', () => {
  const beklenen = MINE.rocks * MINE.chance * (MINE.min + MINE.max) / 2;
  assert.ok(beklenen >= 4 && beklenen <= 8, `beklenen=${beklenen}`);
});

test('tur ekonomisi: Kara Ruh (2600 💎) makul emekle ulaşılabilir — 500 turdan az', () => {
  const beklenen = MINE.rocks * MINE.chance * (MINE.min + MINE.max) / 2;
  assert.ok(2600 / beklenen < 500, `gereken tur=${2600 / beklenen}`);
});

test('kaya 3 dokunuşta kırılır', () => {
  assert.equal(MINE.tapsPerRock, 3);
  assert.equal(MINE.rocks, 8);
});
