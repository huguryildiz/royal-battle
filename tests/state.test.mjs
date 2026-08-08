import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, addGold, spendGold, addGems, spendGems,
         addItem, ownCharacter, serialize, deserialize, save, load } from '../js/state.js';

test('yeni oyun: 100 altın, 0 taş, sadece savaşçı, boş envanter, seviye 1', () => {
  const s = createState();
  assert.equal(s.gold, 100); assert.equal(s.gems, 0);
  assert.deepEqual(s.ownedCharacters, ['savasci']);
  assert.deepEqual(s.inventory, {}); assert.equal(s.battleLevel, 1);
});
test('altın ekleme ve harcama', () => {
  const s = createState();
  addGold(s, 25); assert.equal(s.gold, 125);
  assert.equal(spendGold(s, 125), true); assert.equal(s.gold, 0);
  assert.equal(spendGold(s, 1), false); assert.equal(s.gold, 0); // yetersizse reddet
});
test('taş harcama yetersizse reddedilir', () => {
  const s = createState(); addGems(s, 10);
  assert.equal(spendGems(s, 11), false); assert.equal(s.gems, 10);
  assert.equal(spendGems(s, 10), true); assert.equal(s.gems, 0);
});
test('envanter adet toplar', () => {
  const s = createState();
  addItem(s, 'odun', 30); addItem(s, 'odun', 5); addItem(s, 'kalkan', 1);
  assert.deepEqual(s.inventory, { odun: 35, kalkan: 1 });
});
test('karakter sahipliği tekrarsız', () => {
  const s = createState();
  ownCharacter(s, 'okcu'); ownCharacter(s, 'okcu');
  assert.deepEqual(s.ownedCharacters, ['savasci', 'okcu']);
});
test('serialize/deserialize kayıpsız', () => {
  const s = createState(); addGold(s, 7); addItem(s, 'odun', 3); s.battleLevel = 4;
  assert.deepEqual(deserialize(serialize(s)), s);
});
test('save/load localStorage benzeri storage ile çalışır, bozuk kayıtta yeni oyun', () => {
  const mem = { data: {}, setItem(k, v) { this.data[k] = v; }, getItem(k) { return this.data[k] ?? null; } };
  const s = createState(); addGold(s, 50); save(s, mem);
  assert.deepEqual(load(mem), s);
  mem.data['royal-battle-save-v1'] = '{bozuk';
  assert.deepEqual(load(mem), createState());
});
