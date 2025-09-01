const test = require('node:test');
const assert = require('node:assert');
const { registerPlugin } = require('./watchMini');

test('openWatch adds button that increments score', () => {
  let clickHandler;
  const stubWindow = {
    document: {
      body: {
        appendChild: (el) => {
          clickHandler = el.listeners['click'];
        },
      },
      createElement: () => ({
        listeners: {},
        addEventListener(event, cb) {
          this.listeners[event] = cb;
        },
        textContent: '',
      }),
    },
  };
  let result;
  const app = {
    features: { watchMini: true },
    players: ['Nico'],
    addScore: (n, p) => {
      result = { name: n, pts: p };
    },
    window: { open: () => stubWindow },
  };
  registerPlugin(app);
  app.openWatch();
  clickHandler();
  assert.deepStrictEqual(result, { name: 'Nico', pts: 1 });
});
