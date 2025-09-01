function registerPlugin(app) {
  if (!app?.features?.tvScoreboard) return;

  const Channel =
    app.BroadcastChannel ||
    (typeof BroadcastChannel !== 'undefined' ? BroadcastChannel : null);
  if (!Channel) return;

  const channel = new Channel('chinchon_tv');

  // Permite emitir el estado actual del juego a pantallas conectadas.
  app.broadcastScoreboard = (state) => channel.postMessage(state);
  app.listenScoreboard = (handler) =>
    channel.addEventListener('message', (e) => handler(e.data));

  app.openTv = () => {
    const win =
      (app.window && app.window.open && app.window.open('', 'tv')) ||
      (typeof window !== 'undefined' && window.open('', 'tv'));
    if (!win || !win.document) return;
    win.document.write('<pre id="tv-scores"></pre>');
    channel.addEventListener('message', (e) => {
      const pre = win.document.getElementById('tv-scores');
      if (pre) pre.textContent = JSON.stringify(e.data);
    });
  };
}

module.exports = { registerPlugin };
