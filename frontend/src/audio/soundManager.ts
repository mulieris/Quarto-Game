let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
  }
  return ctx;
}

function beep(freq: number, duration: number, volume: number) {
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.value = volume;
  osc.connect(gain);
  gain.connect(c.destination);
  const now = c.currentTime;
  osc.start(now);
  osc.stop(now + duration);
}

export const sounds = {
  tap: () => beep(660, 0.04, 0.04),
  place: () => beep(220, 0.07, 0.06),
  win: () => {
    beep(392, 0.08, 0.05);
    setTimeout(() => beep(523, 0.12, 0.05), 90);
  },
  error: () => beep(140, 0.12, 0.06),
};
