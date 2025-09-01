const test = require('node:test');
const assert = require('node:assert');
const { registerPlugin } = require('./tvScoreboard');

test('broadcasts scoreboard updates over channel', () => {
  const messages = [];
  class StubChannel {
    constructor(name) {
      this.name = name;
    }
    postMessage(msg) {
      messages.push(msg);
    }
    addEventListener() {}
  }
  const app = {
    features: { tvScoreboard: true },
    BroadcastChannel: StubChannel,
  };
  registerPlugin(app);
  app.broadcastScoreboard({ score: 1 });
  assert.deepStrictEqual(messages[0], { score: 1 });
});
