import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createBattle, deployUnit, tick, battleRewards, applyPotion, fireCannon, equipRifle,
  addTowers, spendElixir, ARENA, ELIXIR, TOWER_STATS,
} from '../js/battle/sim.js';
import { LOOT_TABLE } from '../js/balance.js';

const OKCU = { atk: 89, def: 30, spd: 100, range: 6 };
const DINO = { atk: 100, def: 100, spd: 21, range: 1.8 };
const ZAYIF = { atk: 10, def: 1, spd: 50, range: 1.8 };
const SAVASCI = { atk: 50, def: 94, spd: 75, range: 1.8 };

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

test('tüfek: menzil 8, atk +10; ikinci kez takılmaz; düşmana takılmaz', () => {
  const b = createBattle(1);
  const oyuncu = deployUnit(b, 'player', SAVASCI, 0, 0);
  assert.equal(equipRifle(b, oyuncu), true);
  assert.equal(oyuncu.range, 8);
  assert.equal(oyuncu.atk, 60);
  assert.equal(equipRifle(b, oyuncu), false); // tek kullanımlık
  assert.equal(oyuncu.atk, 60);
  const dusman = deployUnit(b, 'enemy', SAVASCI, 5, 0);
  assert.equal(equipRifle(b, dusman), false);
  assert.equal(dusman.range, 1.8);
});

test('tüfekli savaşçı 7 birim uzaktan vurur, yaklaşmaz', () => {
  const b = createBattle(1);
  const oyuncu = deployUnit(b, 'player', SAVASCI, 0, 0);
  equipRifle(b, oyuncu);
  const dusman = deployUnit(b, 'enemy', DINO, 7, 0);
  tick(b, 1);
  assert.equal(oyuncu.x, 0, 'menzilde olduğu için yürümemeli');
  assert.ok(dusman.hp < dusman.maxHp, `düşman hasarı ${dusman.maxHp - dusman.hp}`);
});

test('tüfeksiz savaşçı aynı mesafede vuramaz, yürür', () => {
  const b = createBattle(1);
  const oyuncu = deployUnit(b, 'player', SAVASCI, 0, 0);
  const dusman = deployUnit(b, 'enemy', DINO, 7, 0);
  tick(b, 1);
  assert.ok(oyuncu.x > 0, 'yaklaşmalı');
  assert.equal(dusman.hp, dusman.maxHp);
});

test('ganimet tablosunda tüfek var', () => {
  assert.ok(LOOT_TABLE.includes('tufek'));
});

// --- Clash Royale modu: kuleler, köprüler, iksir ---

test('kuleler: her tarafta 2 yan + 1 kral, hp = def*10', () => {
  const b = createBattle(1);
  addTowers(b);
  const kuleler = b.units.filter(u => u.tower);
  assert.equal(kuleler.length, 6);
  const kral = b.units.find(u => u.side === 'enemy' && u.tower === 'king');
  assert.equal(kral.hp, TOWER_STATS.king.def * 10);
  assert.ok(kral.z < 0, 'düşman kral kulesi üst yarıda');
});

test('düşman kuleleri ölçekle güçlenir, oyuncununkiler sabit', () => {
  const b = createBattle(6);
  addTowers(b, 1.4);
  const dusmanKral = b.units.find(u => u.side === 'enemy' && u.tower === 'king');
  const oyuncuKral = b.units.find(u => u.side === 'player' && u.tower === 'king');
  assert.equal(dusmanKral.hp, Math.round(TOWER_STATS.king.def * 1.4) * 10);
  assert.equal(oyuncuKral.hp, TOWER_STATS.king.def * 10);
});

test('kral kulesi düşünce savaş biter, yıkan kazanır', () => {
  const b = createBattle(1);
  addTowers(b);
  const kral = b.units.find(u => u.side === 'enemy' && u.tower === 'king');
  kral.hp = 0;
  tick(b, 0.05);
  assert.equal(b.over, true);
  assert.equal(b.winner, 'player');
});

test('kuleli savaşta birimlerin bitmesi savaşı bitirmez', () => {
  const b = createBattle(1);
  addTowers(b);
  deployUnit(b, 'player', SAVASCI, 0, 5);
  tick(b, 0.05);
  assert.equal(b.over, false);
});

test('nehrin karşısındaki hedefe köprüye doğru yürünür', () => {
  const b = createBattle(1);
  const u = deployUnit(b, 'player', SAVASCI, -4.5, 4);
  deployUnit(b, 'enemy', DINO, -4.5, -4);
  tick(b, 0.5);
  assert.ok(u.x > -4.5, `köprüye (x=-2.6) yaklaşmalı, x=${u.x}`);
  assert.ok(u.z < 4, `nehre yaklaşmalı, z=${u.z}`);
});

test('aynı taraftaki hedefe düz yürünür (eski davranış)', () => {
  const b = createBattle(1);
  const u = deployUnit(b, 'player', SAVASCI, -10, 0);
  deployUnit(b, 'enemy', DINO, 10, 0);
  tick(b, 1);
  assert.ok(Math.abs(u.x - (-7)) < 0.01, `x=${u.x}`);
});

test('iksir: zamanla dolar (1/1.2sn), max 10, harcanınca düşer', () => {
  const b = createBattle(1);
  assert.equal(b.elixir, ELIXIR.start);
  tick(b, 1.2);
  assert.ok(Math.abs(b.elixir - (ELIXIR.start + 1)) < 0.01, `elixir=${b.elixir}`);
  assert.equal(spendElixir(b, 100), false);
  assert.equal(spendElixir(b, 3), true);
  assert.ok(Math.abs(b.elixir - (ELIXIR.start + 1 - 3)) < 0.01);
  for (let t = 0; t < 60; t += 0.5) tick(b, 0.5);
  assert.equal(b.elixir, ELIXIR.max);
});

test('top ve mega deprem kuleleri vurmaz', () => {
  const b = createBattle(1);
  addTowers(b);
  const kral = b.units.find(u => u.side === 'enemy' && u.tower === 'king');
  const asker = deployUnit(b, 'enemy', ZAYIF, 0, -3);
  assert.equal(fireCannon(b), true);
  assert.equal(kral.hp, kral.maxHp);
  assert.ok(asker.hp < asker.maxHp);
  const kalanKralHp = kral.hp;
  applyPotion(b, 'mega-deprem-iksiri');
  assert.equal(kral.hp, kalanKralHp);
});

test('kule menzili okçudan uzun: okçu kuleyi bedava kesemez', () => {
  assert.ok(TOWER_STATS.side.range > 6);
  assert.ok(TOWER_STATS.king.range > 6);
});

test('kral kulesi uyur: hasar almadan ve yan kule düşmeden ateş etmez', () => {
  const b = createBattle(1);
  addTowers(b);
  const kral = b.units.find(u => u.side === 'enemy' && u.tower === 'king');
  // Hareketsiz kukla (spd 0): krala dokunmadan menzilinde bekler
  deployUnit(b, 'player', { atk: 10, def: 100, spd: 0, range: 1.8 }, 0, -6);
  for (let t = 0; t < 2; t += 0.05) tick(b, 0.05);
  assert.ok(!b.events.some(ev => ev.from === kral), 'uyuyan kral vurmamalı');
  kral.hp -= 1; // kral hasar aldı → uyanır
  b.events.length = 0;
  for (let t = 0; t < 2; t += 0.05) tick(b, 0.05);
  assert.ok(b.events.some(ev => ev.from === kral), 'uyanan kral vurmalı');
});

test('yan kuleler birbirinin şeridine yetişemez (menzil < şerit arası)', () => {
  assert.ok(ARENA.bridgeX * 2 > TOWER_STATS.side.range,
    `şeritler arası ${ARENA.bridgeX * 2}, menzil ${TOWER_STATS.side.range}`);
});

test('vuruş olayları events listesine düşer', () => {
  const b = createBattle(1);
  const okcu = deployUnit(b, 'player', OKCU, 0, 0);
  deployUnit(b, 'enemy', DINO, 1, 0);
  tick(b, 0.1);
  assert.ok(b.events.some(ev => ev.from === okcu), 'okçunun vuruşu kayıtlı olmalı');
});
