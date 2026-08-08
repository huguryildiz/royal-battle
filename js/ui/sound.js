// js/ui/sound.js — WebAudio ile küçük ses efektleri (asset yok).
// AudioContext ilk kullanıcı dokunuşunda tembel oluşturulur; node testlerinde sessiz kalır.
let ctx = null;
function getCtx() {
  if (typeof AudioContext === 'undefined') return null;
  ctx ??= new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Tek nota: tip, frekans, süre, gecikme, ses seviyesi
function ton(type, freq, sure, gecikme = 0, seviye = 0.15) {
  const c = getCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  const t0 = c.currentTime + gecikme;
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(seviye, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + sure);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + sure);
}

export const sfx = {
  chop() { ton('square', 90, 0.12); ton('square', 60, 0.1, 0.02); },
  coin() { ton('sine', 880, 0.08); ton('sine', 1320, 0.12, 0.06); },
  deploy() { ton('triangle', 300, 0.1); ton('triangle', 500, 0.12, 0.05); },
  potion() { ton('sine', 600, 0.1); ton('sine', 900, 0.1, 0.07); ton('sine', 1200, 0.14, 0.14); },
  cannon() { ton('sawtooth', 70, 0.4, 0, 0.3); ton('square', 45, 0.5, 0.03, 0.25); },
  victory() { [523, 659, 784, 1047].forEach((f, i) => ton('triangle', f, 0.18, i * 0.12)); },
  defeat() { [400, 320, 250, 180].forEach((f, i) => ton('sawtooth', f, 0.2, i * 0.15, 0.1)); },
};
