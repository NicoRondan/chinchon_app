function registerPlugin(app) {
  if (!app?.features?.watchMini) return;

  const opener =
    (app.window && app.window.open) ||
    (typeof window !== 'undefined' ? window.open : null);
  if (!opener) return;

  app.openWatch = () => {
    const win = opener('', 'watch', 'width=200,height=200');
    if (!win || !win.document) return;
    const btn = win.document.createElement('button');
    btn.textContent = '+1';
    btn.addEventListener('click', () => {
      if (app.players?.[0] && app.addScore) {
        app.addScore(app.players[0], 1);
      }
    });
    win.document.body.appendChild(btn);
  };
}
if (typeof module !== 'undefined') {
  module.exports = { registerPlugin };
}

if (typeof window !== 'undefined' && window.game) {
  window.game.registerPlugin({ registerPlugin });
}
