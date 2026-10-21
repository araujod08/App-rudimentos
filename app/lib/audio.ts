import type { Hand } from "./data";

let ctx: AudioContext | null = null;
let noise: AudioBuffer;

export function getCtx(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    ctx = new AC();
    noise = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
    const a = noise.getChannelData(0);
    for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1;
  }
  return ctx!;
}

function pan(v: number): StereoPannerNode {
  const c = getCtx();
  const p = c.createStereoPanner();
  p.pan.value = v;
  p.connect(c.destination);
  return p;
}

function tone(dest: AudioNode, t: number, f0: number, f1: number, d: number, v: number, type: OscillatorType = "sine") {
  const c = getCtx(), o = c.createOscillator(), g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + d * 0.6);
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + d);
  o.connect(g).connect(dest);
  o.start(t); o.stop(t + d + 0.02);
}

function burst(dest: AudioNode, t: number, type: BiquadFilterType, freq: number, d: number, v: number) {
  const c = getCtx(), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = noise; s.loop = true;
  f.type = type; f.frequency.value = freq;
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + d);
  s.connect(f).connect(g).connect(dest);
  s.start(t); s.stop(t + d + 0.02);
}

/** Rudimentos: D mais agudo/direita, E mais grave/esquerda */
export function hit(h: Hand, t: number, v: number) {
  const R = h === "R", p = pan(R ? 0.5 : -0.5);
  tone(p, t, R ? 330 : 200, R ? 150 : 100, 0.12, v * 0.7, "triangle");
  burst(p, t, "highpass", R ? 2600 : 1400, 0.09, v * 0.5);
}

/** Peças da bateria (índice de PIECES); mão opcional (bumbo não tem) */
export function drum(r: number, t: number, h?: Hand) {
  const fm = h === "L" ? 0.82 : h === "R" ? 1.15 : 1;
  const p = pan(h === "L" ? -0.5 : h === "R" ? 0.5 : 0);
  if (r === 0) burst(p, t, "highpass", 3500 * fm, 0.7, 0.5);
  else if (r === 1) burst(p, t, "highpass", 7000 * fm, 0.06, 0.45);
  else if (r === 2) tone(p, t, 220 * fm, 120 * fm, 0.28, 0.8);
  else if (r === 3) tone(p, t, 170 * fm, 90 * fm, 0.3, 0.8);
  else if (r === 4) tone(p, t, 120 * fm, 60 * fm, 0.35, 0.9);
  else if (r === 5) { burst(p, t, "bandpass", 1900 * fm, 0.14, 0.8); tone(p, t, 220 * fm, 160 * fm, 0.08, 0.4); }
  else tone(p, t, 130, 42, 0.22, 1);
}

export function click(t: number, accent: boolean) {
  const c = getCtx(), o = c.createOscillator(), g = c.createGain();
  o.type = "square";
  o.frequency.value = accent ? 1500 : 1000;
  g.gain.setValueAtTime(0.6, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
  o.connect(g).connect(c.destination);
  o.start(t); o.stop(t + 0.08);
}
