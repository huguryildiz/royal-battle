import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBattle, deployUnit, tick, battleRewards, applyPotion, fireCannon } from '../js/battle/sim.js';
import { LOOT_TABLE } from '../js/balance.js';

const OKCU = { atk: 89, def: 30, spd: 100, range: 6 };
const DINO = { atk: 100, def: 100, spd: 21, range: 1.8 };
const ZAYIF = { atk: 10, def: 1, spd: 50, range: 1.8 };

test('hp = def*10', () => {
  const b = createBattle(1);
  const u = deployUnit(b, 'player', DINO, 0, 0);
  assert.equal(u.hp, 1000); assert.equal(u.maxHp, 1000);
});

test('hızlı birim yavaş birimden önce vurur', () => {
  const b = createBattle(1);
  const okcu = deployUnit(b, 'player', OKCU, 0, 0);
  const dino = deployUnit(b, 'enemy', DINO, 1, 0); // ikisi de menzilde
  for (let t = 0; t < 1; t += 0.1) tick(b, 0.1);
  const okcuHasar = okcu.maxHp - okcu.hp;
  const dinoHasar = dino.maxHp - dino.hp;
  assert.ok(dinoHasar > okcuHasar, `dino ${dinoHasar}, okçu ${okcuHasar}`);
});

test('birim menzile yürür: spd75, dt=1 → 3 birim yol', () => {
  const b = createBattle(1);
  const u = deployUnit(b, 'player', { atk: 50, def: 94, spd: 75, range: 1.8 }, -10, 0);
  deployUnit(b, 'enemy', DINO, 10, 0);
  tick(b, 1);
  assert.ok(Math.abs(u.x - (-7)) < 0.01, `x=${u.x}`);
});

test('tek taraf kalınca over ve winner doğru', () => {
  const b = createBattle(1);
  deployUnit(b, 'player', DINO, 0, 0);
  deployUnit(b, 'enemy', ZAYIF, 0.5, 0);
  for (let t = 0; t < 10 && !b.over; t += 0.1) tick(b, 0.1);
  assert.equal(b.over, true);
  assert.equal(b.winner, 'player');
});

test('iki taraf da sürmeden winner atanmaz', () => {
  const b = createBattle(1);
  deployUnit(b, 'enemy', DINO, 5, 0);
  for (let t = 0; t < 3; t += 0.1) tick(b, 0.1);
  assert.equal(b.over, false);
  assert.equal(b.winner, null);
});

test('güç iksiri: mevcut ve sonraki oyuncu birimlerinin atk +%50, düşmanlar etkilenmez', () => {
  const b = createBattle(1);
  const once = deployUnit(b, 'player', OKCU, 0, 0);
  applyPotion(b, 'guc-iksiri');
  const sonra = deployUnit(b, 'player', OKCU, 1, 0);
  const dusman = deployUnit(b, 'enemy', DINO, 5, 0);
  assert.equal(once.atk, Math.round(89 * 1.5));
  assert.equal(sonra.atk, Math.round(89 * 1.5));
  assert.equal(dusman.atk, 100);
});
test('altın iksiri: goldMult 2 olur', () => {
  const b = createBattle(1);
  applyPotion(b, 'altin-iksir');
  assert.equal(b.goldMult, 2);
});
test('mega deprem iksiri: tüm düşmanlara 150 hasar, oyuncuya dokunmaz', () => {
  const b = createBattle(1);
  const oyuncu = deployUnit(b, 'player', DINO, 0, 0);
  const d1 = deployUnit(b, 'enemy', DINO, 5, 0);
  const d2 = deployUnit(b, 'enemy', OKCU, 6, 0); // hp 300
  applyPotion(b, 'mega-deprem-iksiri');
  assert.equal(oyuncu.hp, 1000);
  assert.equal(d1.hp, 850);
  assert.equal(d2.hp, 150);
});
test('top: savaş başına 1 kez, en yüksek canlı düşmana 300 hasar', () => {
  const b = createBattle(1);
  deployUnit(b, 'player', OKCU, 0, 0);
  const guclu = deployUnit(b, 'enemy', DINO, 5, 0);  // hp 1000
  const zayif = deployUnit(b, 'enemy', OKCU, 6, 0);  // hp 300
  assert.equal(fireCannon(b), true);
  assert.equal(guclu.hp, 700);
  assert.equal(zayif.hp, 300);
  assert.equal(fireCannon(b), false); // ikinci atış yok
  assert.equal(guclu.hp, 700);
});
test('battleRewards: rng=0.05 → taş düşer (5-15), rng=0.9 → taş 0; gold hep 25', () => {
  const r = battleRewards(() => 0.05);
  assert.equal(r.gold, 25);
  assert.ok(r.gems >= 5 && r.gems <= 15, `gems=${r.gems}`);
  assert.ok(LOOT_TABLE.includes(r.loot));
  const r2 = battleRewards(() => 0.9);
  assert.equal(r2.gems, 0); assert.equal(r2.gold, 25);
});
