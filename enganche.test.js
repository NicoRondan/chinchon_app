const test = require('node:test');
const assert = require('node:assert');
const { findEngancheRef } = require('./app.js');

test('considers players already enganchados when selecting reference', () => {
  const totals = [68, 120, 57, 82];
  const { ref, total } = findEngancheRef(totals, 1);
  assert.strictEqual(ref, 3);
  assert.strictEqual(total, 82);
});

test('prioritizes the highest score even if earlier enganchado exists', () => {
  const totals = [67, 58, 120, 79];
  const { ref, total } = findEngancheRef(totals, 2);
  assert.strictEqual(ref, 3);
  assert.strictEqual(total, 79);
});

test('returns -1 when no players available to hook', () => {
  const totals = [150, 120];
  const { ref, total } = findEngancheRef(totals, 0);
  assert.strictEqual(ref, -1);
  assert.strictEqual(total, 0);
});
