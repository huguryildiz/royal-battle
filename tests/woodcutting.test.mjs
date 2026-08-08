import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState } from '../js/state.js';
import { chopReward } from '../js/ui/woodcutting.js';

test('chopReward: 1 çağrıda +2 altın, +1 odun', () => {
  const s = createState();
  chopReward(s);
  assert.equal(s.gold, 102);
  assert.deepEqual(s.inventory, { odun: 1 });
});
test('chopReward: 10 çağrıda +20 altın, +10 odun', () => {
  const s = createState();
  for (let i = 0; i < 10; i++) chopReward(s);
  assert.equal(s.gold, 120);
  assert.deepEqual(s.inventory, { odun: 10 });
});
