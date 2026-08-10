import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHARACTERS, WOOD_GOLD, battleGold, GEM_DROP, enemyWave, enemyReinforcement, isBossLevel,
  SELL_PRICES, ITEM_NAMES, ELIXIR_COST, ENEMY_SPAWN, enemyGap, levelScale, LEVEL_SCALE_MAX,
} from '../js/balance.js';

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
  // Kara Ruh en pahalı taş karakteri (spec kuralı) — rakam denge ayarıyla değişebilir.
  assert.ok(byId['kara-ruh'].cost.gems > byId['altin-ordu'].cost.gems);
  assert.ok(byId['kara-ruh'].cost.gems > byId['altin-bomba-cicegi'].cost.gems);
});
test('zafer altını seviyeyle büyür', () => {
  assert.ok(battleGold(10) > battleGold(1), '10. seviye 1. seviyeden çok kazandırmalı');
  assert.ok(battleGold(20) > battleGold(10));
  assert.equal(battleGold(1), battleGold(1)); // saf: aynı girdi aynı çıktı
});

test('ekonomi çocuğun ulaşabileceği hızda: ilk kart birkaç odun turunda alınır', () => {
  const enUcuz = Math.min(...CHARACTERS.filter(c => c.cost.gold > 0).map(c => c.cost.gold));
  assert.ok(enUcuz / (10 * WOOD_GOLD) <= 4, `gereken odun turu=${enUcuz / (10 * WOOD_GOLD)}`);
  const enPahaliAltin = Math.max(...CHARACTERS.filter(c => c.cost.gold).map(c => c.cost.gold));
  assert.ok(enPahaliAltin / (10 * WOOD_GOLD) <= 20, `gereken odun turu=${enPahaliAltin / (10 * WOOD_GOLD)}`);
});

test('savaş taş bırakma şansı hissedilir (eski %20 çok seyrekti)', () => {
  assert.ok(GEM_DROP.chance >= 0.35);
  assert.ok(GEM_DROP.max > GEM_DROP.min);
});
test('düşman dalgası seviyeyle büyür ve güçlenir; 1. seviye tek savaşçıyla kazanılabilir', () => {
  assert.equal(enemyWave(1).length, 1); // ilk savaş kazanılabilir olmalı
  assert.equal(enemyWave(3).length, 3);
  assert.equal(enemyWave(10).length, 4); // boss seviyesi: 6 → yarısı 3 + boss
  assert.ok(enemyWave(5)[0].atk > enemyWave(1)[0].atk);
});
test('satış fiyatları: envanterdeki her eşyanın fiyatı var ve pozitif', () => {
  for (const id of Object.keys(ITEM_NAMES)) {
    assert.ok(SELL_PRICES[id] > 0, id);
  }
});

test('isBossLevel: her 5. seviye', () => {
  assert.equal(isBossLevel(5), true);
  assert.equal(isBossLevel(10), true);
  assert.equal(isBossLevel(4), false);
  assert.equal(isBossLevel(1), false);
});

test('düşman okçusu 3. seviyeden itibaren dalgaya karışır', () => {
  for (const lvl of [1, 2]) {
    assert.ok(enemyWave(lvl).every(u => u.tip === 'asker'), `seviye ${lvl}`);
  }
  const okcular = enemyWave(3).filter(u => u.tip === 'okcu');
  assert.equal(okcular.length, 1);
  assert.equal(okcular[0].range, 6);
  assert.ok(okcular[0].def < enemyWave(3).find(u => u.tip === 'asker').def, 'okçu daha kırılgan');
});

test('boss seviyesinde tek dev birim + yarıya inen dalga', () => {
  const dalga = enemyWave(5);
  assert.equal(dalga.filter(u => u.tip === 'boss').length, 1);
  assert.equal(dalga[0].tip, 'boss');
  assert.equal(dalga[0].range, 2.2);
  assert.equal(dalga.length, 4); // min(5,6)=5 → yarısı 3 + boss
  const boss = dalga[0], asker = dalga.find(u => u.tip === 'asker');
  assert.ok(boss.def > asker.def * 3, `boss def ${boss.def}, asker def ${asker.def}`);
  assert.ok(boss.spd < asker.spd, 'boss daha yavaş');
});

test('boss olmayan seviyede boss yok', () => {
  assert.equal(enemyWave(4).some(u => u.tip === 'boss'), false);
  assert.equal(enemyWave(6).some(u => u.tip === 'boss'), false);
});

test('takviye dalgası boss içermez — boss savaş başına tek', () => {
  const acilis = enemyWave(15);
  assert.equal(acilis.filter(u => u.tip === 'boss').length, 1);
  assert.equal(enemyReinforcement(15).some(u => u.tip === 'boss'), false);
  assert.equal(enemyReinforcement(15).length, acilis.length - 1);
});

test('seviye ölçeği tavanlı: düşman sonsuza dek güçlenmez', () => {
  // Oyuncunun statları sabit olduğundan tavansız büyüme savaşı kazanılamaz yapıyordu.
  assert.ok(levelScale(2) > levelScale(1));
  assert.equal(levelScale(100), LEVEL_SCALE_MAX);
  assert.ok(levelScale(50) === levelScale(60), 'tavana ulaşınca sabit kalmalı');
});

test('düşman sürümü iksir bütçesine bağlı: seviyeyle sıklaşır, boss pahalıdır', () => {
  assert.ok(enemyGap(10, 'asker') < enemyGap(1, 'asker'), 'seviye arttıkça sıklaşır');
  assert.ok(enemyGap(5, 'boss') > enemyGap(5, 'asker'), 'boss daha çok iksir yer');
  assert.ok(ENEMY_SPAWN.rate(100) <= 0.83, 'düşman iksir hızı oyuncuyu (0.83/sn) geçmemeli');
  assert.ok(ENEMY_SPAWN.waves(10) > ENEMY_SPAWN.waves(1), 'takviye dalgası seviyeyle artar');
});

test('her karakterin iksir maliyeti var ve 2-8 bandında', () => {
  for (const c of CHARACTERS) {
    assert.ok(ELIXIR_COST[c.id] >= 2 && ELIXIR_COST[c.id] <= 8, `${c.id}=${ELIXIR_COST[c.id]}`);
  }
});
