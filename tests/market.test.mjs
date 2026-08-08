import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, addItem } from '../js/state.js';
import { sellItem } from '../js/ui/inventory.js';
import { SELL_PRICES } from '../js/balance.js';

test('eşya satma: adet düşer, altın artar', () => {
  const s = createState();
  addItem(s, 'kalkan', 2);
  assert.equal(sellItem(s, 'kalkan'), 'ok');
  assert.equal(s.inventory.kalkan, 1);
  assert.equal(s.gold, 100 + SELL_PRICES.kalkan);
});
test('son eşya satılınca slot boşalır', () => {
  const s = createState();
  addItem(s, 'yay', 1);
  sellItem(s, 'yay');
  assert.equal('yay' in s.inventory, false);
});
test('olmayan eşya satılamaz', () => {
  const s = createState();
  assert.equal(sellItem(s, 'kalkan'), 'yok');
  assert.equal(s.gold, 100);
});
