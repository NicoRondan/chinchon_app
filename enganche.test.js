const test = require('node:test');
const assert = require('node:assert');
const { findEngancheRef } = require('./app.js');

test('selects highest active total even if a player already hooked', () => {
  const totals = [68, 77, 37, 105]; // player 3 exceeds 100 and should copy player 2
  const { ref, total } = findEngancheRef(totals, 3);
  assert.strictEqual(ref, 1);
  assert.strictEqual(total, 77);
});

test('returns -1 when no players available to hook', () => {
  const totals = [150, 120];
  const { ref, total } = findEngancheRef(totals, 0);
  assert.strictEqual(ref, -1);
  assert.strictEqual(total, 0);
});
