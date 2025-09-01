const test = require('node:test');
const assert = require('node:assert');
const { findEngancheRef } = require('./app.js');

test('considers players already enganchados when selecting reference', () => {
  const totals = [68, 120, 57, 82];
  const { ref, total } = findEngancheRef(totals, 1);
  assert.strictEqual(ref, 3);
  assert.strictEqual(total, 82);
});

test('returns -1 when no players available to hook', () => {
  const totals = [150, 120];
  const { ref, total } = findEngancheRef(totals, 0);
  assert.strictEqual(ref, -1);
  assert.strictEqual(total, 0);
});
