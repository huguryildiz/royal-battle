import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../js/state.js';
import { chopReward } from '../js/ui/woodcutting.js';
import { WOOD_GOLD } from '../js/balance.js';

test('chopReward: 1 çağrıda WOOD_GOLD altın, +1 odun', () => {
  const s = createState();
  chopReward(s);
  assert.equal(s.gold, 100 + WOOD_GOLD);
  assert.deepEqual(s.inventory, { odun: 1 });
});
test('chopReward: 10 çağrıda 10×WOOD_GOLD altın, +10 odun', () => {
  const s = createState();
  for (let i = 0; i < 10; i++) chopReward(s);
  assert.equal(s.gold, 100 + 10 * WOOD_GOLD);
  assert.deepEqual(s.inventory, { odun: 10 });
});

test('bir odun turu (10 odun) en ucuz karakteri almaya yaklaştırır', () => {
  // Denge hedefi: ilk kart birkaç turda alınabilsin, 38 turda değil.
  assert.ok(10 * WOOD_GOLD >= 50, `tur geliri ${10 * WOOD_GOLD}`);
});
