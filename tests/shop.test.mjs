import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../js/state.js';
import { buyCharacter } from '../js/ui/shop.js';
import { CHARACTERS } from '../js/balance.js';

const byId = Object.fromEntries(CHARACTERS.map(c => [c.id, c]));

test('altın karakteri: yeterse düşer ve sahiplenir', () => {
  const s = createState(); s.gold = byId.okcu.cost.gold;
  assert.equal(buyCharacter(s, 'okcu'), 'ok');
  assert.equal(s.gold, 0); assert.ok(s.ownedCharacters.includes('okcu'));
});
test('taş karakteri yetersiz taşla reddedilir', () => {
  const eksik = byId['kara-ruh'].cost.gems - 1;
  const s = createState(); s.gems = eksik;
  assert.equal(buyCharacter(s, 'kara-ruh'), 'yetersiz');
  assert.equal(s.gems, eksik);
});
test('iki kez alınamaz', () => {
  const s = createState();
  assert.equal(buyCharacter(s, 'savasci'), 'zaten-var');
});
