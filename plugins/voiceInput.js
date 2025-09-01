function registerPlugin(app) {
  if (!app?.features?.voiceInput) return;

  const SpeechRecognition =
    (typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)) ||
    null;

  if (!SpeechRecognition) {
    // Fallback manual: usa prompt para pedir entrada de texto.
    app.startVoiceInput = () => {
      const pr =
        app.prompt || (typeof prompt !== 'undefined' ? prompt : null);
      if (!pr) return;
      const spoken = pr('Jugador y puntos (ej. "Nico +10")');
      if (!spoken) return;
      const match = spoken.match(/(\w+)\s*\+?(-?\d+)/);
      if (match && app.addScore) {
        app.addScore(match[1], parseInt(match[2], 10));
      }
    };
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = 'es-ES';
  recognition.continuous = false;

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript.trim();
    const match = transcript.match(/(\w+)\s*\+?(-?\d+)/);
    if (match && app.addScore) {
      const name = match[1];
      const pts = parseInt(match[2], 10);
      app.addScore(name, pts);
      if (typeof speechSynthesis !== 'undefined') {
        const utter = new SpeechSynthesisUtterance(
          `${name} ${pts >= 0 ? '+' : ''}${pts}`
        );
        speechSynthesis.speak(utter);
      }
    }
  };

  app.startVoiceInput = () => recognition.start();
}

if (typeof module !== 'undefined') {
  module.exports = { registerPlugin };
}

if (typeof window !== 'undefined' && window.game) {
  window.game.registerPlugin({ registerPlugin });
}
