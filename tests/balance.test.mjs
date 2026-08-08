import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHARACTERS, WOOD_GOLD, BATTLE_WIN_GOLD, GEM_DROP, enemyWave, SELL_PRICES, ITEM_NAMES } from '../js/balance.js';

const byId = Object.fromEntries(CHARACTERS.map(c => [c.id, c]));
test('statlar spec tablosuyla birebir (Aslan\'ın kararı, değiştirilemez)', () => {
  const spec = {
    savasci: [50, 94, 75], okcu: [89, 30, 100], buyucu: [98, 89, 69],
    'buz-ejderhasi': [91, 50, 92], 'maden-dinozoru': [100, 100, 21],
    'altin-ordu': [100, 100, 100], 'altin-bomba-cicegi': [100, 100, 100],
    'kara-ruh': [101, 101, 101],
  };
  for (const [id, [atk, def, spd]] of Object.entries(spec)) {
    assert.equal(byId[id].atk, atk, id); assert.equal(byId[id].def, def, id);
    assert.equal(byId[id].spd, spd, id);
  }
});
test('tier ve para birimi: normal→altın, ultra/invisible→taş; savaşçı bedava', () => {
  assert.equal(byId.savasci.cost.gold, 0);
  for (const c of CHARACTERS) {
    if (c.tier === 'normal') assert.ok('gold' in c.cost, c.id);
    else assert.ok('gems' in c.cost, c.id);
  }
  assert.equal(byId['kara-ruh'].cost.gems, 2600); // en pahalı taş karakteri
  assert.ok(byId['kara-ruh'].cost.gems > byId['altin-ordu'].cost.gems);
  assert.ok(byId['kara-ruh'].cost.gems > byId['altin-bomba-cicegi'].cost.gems);
});
test('ödül sabitleri spec ile aynı', () => {
  assert.equal(WOOD_GOLD, 2); assert.equal(BATTLE_WIN_GOLD, 25);
  assert.equal(GEM_DROP.chance, 0.2);
});
test('düşman dalgası seviyeyle büyür ve güçlenir; 1. seviye tek savaşçıyla kazanılabilir', () => {
  assert.equal(enemyWave(1).length, 1); // ilk savaş kazanılabilir olmalı
  assert.equal(enemyWave(3).length, 3);
  assert.equal(enemyWave(10).length, 6); // tavan 6
  assert.ok(enemyWave(5)[0].atk > enemyWave(1)[0].atk);
});
test('satış fiyatları: envanterdeki her eşyanın fiyatı var ve pozitif', () => {
  for (const id of Object.keys(ITEM_NAMES)) {
    assert.ok(SELL_PRICES[id] > 0, id);
  }
});
