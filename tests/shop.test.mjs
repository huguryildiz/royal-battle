import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../js/state.js';
import { buyCharacter } from '../js/ui/shop.js';

test('altın karakteri: yeterse düşer ve sahiplenir', () => {
  const s = createState(); s.gold = 750;
  assert.equal(buyCharacter(s, 'okcu'), 'ok');
  assert.equal(s.gold, 0); assert.ok(s.ownedCharacters.includes('okcu'));
});
test('taş karakteri yetersiz taşla reddedilir', () => {
  const s = createState(); s.gems = 2599;
  assert.equal(buyCharacter(s, 'kara-ruh'), 'yetersiz');
  assert.equal(s.gems, 2599);
});
test('iki kez alınamaz', () => {
  const s = createState();
  assert.equal(buyCharacter(s, 'savasci'), 'zaten-var');
});
