const test = require('node:test');
const assert = require('node:assert');
const { registerPlugin } = require('./voiceInput');

test('falls back to manual prompt when speech API unavailable', () => {
  let called;
  const app = {
    features: { voiceInput: true },
    prompt: () => 'Nico +10',
    addScore: (n, p) => {
      called = { name: n, pts: p };
    },
  };
  registerPlugin(app);
  assert.strictEqual(typeof app.startVoiceInput, 'function');
  app.startVoiceInput();
  assert.deepStrictEqual(called, { name: 'Nico', pts: 10 });
});

test('does not register when feature disabled', () => {
  const app = { features: { voiceInput: false } };
  registerPlugin(app);
  assert.strictEqual(app.startVoiceInput, undefined);
});
