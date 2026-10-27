"use client";
import { Fragment, useEffect, useRef, useState } from "react";
import { KICK, PIECES, PIECE_COLORS, label, type Hand } from "../lib/data";
import { click, drum, getCtx } from "../lib/audio";
import { useLoop } from "../lib/useLoop";
import { loadState, saveState } from "../lib/sync";

type Mode = "fix" | "up" | "down" | "pp";
const MAX = 16; // passos guardados (4 tempos); o compasso usa os primeiros beats*4
const alt = (): Hand[] => Array.from({ length: MAX }, (_, i) => (i % 2 ? "L" : "R"));
const opp = (h: Hand): Hand => (h === "R" ? "L" : "R");

const TOMS = [5, 2, 3, 4]; // caixa, tom 10, tom 12, surdo 14
/** Distribui grupos de `size` passos pelas peças, um grupo a cada `every` passos (-1 = vazio). */
const spread = (size: number, every: number) =>
  Array.from({ length: MAX }, (_, i) => (i % every < size ? TOMS[Math.floor(i / every) % TOMS.length] : -1));

/** Rudimentos prontos: h = mão de cada passo (16), p = peça de cada passo, distribuída entre caixa e toms. */
const PRESETS: Record<string, { h: string; p: number[] }> = {
  "Paradiddle": { h: "RLRRLRLL".repeat(2), p: spread(2, 2) },
  "Single Stroke Roll": { h: "RL".repeat(8), p: spread(2, 2) },
  "Double Stroke Roll": { h: "RRLL".repeat(4), p: spread(2, 2) },
  // flam e drag aproximados: cada nota de ornamento ocupa o passo anterior à nota principal
  "Flam": { h: "LRRRRLRRLRRRRLRR", p: spread(2, 4) }, // cada flam numa peça
  "Drag": { h: "LLRRRRLL".repeat(2), p: spread(3, 4) }, // cada drag numa peça
};

/** Mão de uma peça num passo: a 1ª peça de mão usa a mão do passo, a 2ª usa a oposta. Bumbo não tem mão. */
function handOf(list: number[], r: number, h: Hand): Hand | undefined {
  if (r === KICK) return undefined;
  return list.filter((x) => x !== KICK).indexOf(r) % 2 === 0 ? h : opp(h);
}

type Saved = { s: (number | number[])[]; h: Hand[]; b?: number };
const normalize = (x: Saved) => ({
  // aceita o formato antigo (um número por passo, -1 = vazio)
  s: Array.from({ length: MAX }, (_, i): number[] => {
    const v = x.s[i];
    return Array.isArray(v) ? v : typeof v === "number" && v >= 0 ? [v] : [];
  }),
  h: Array.from({ length: MAX }, (_, i): Hand => x.h[i] ?? (i % 2 ? "L" : "R")),
  b: [2, 3, 4].includes(x.b ?? 4) ? (x.b ?? 4) : 4,
});

export default function FillBuilder() {
  const [steps, setSteps] = useState<number[][]>(Array.from({ length: MAX }, () => []));
  const [hands, setHands] = useState<Hand[]>(alt());
  const [beats, setBeats] = useState(4); // 2, 3 ou 4 tempos (2/4, 3/4, 4/4)
  const [preset, setPreset] = useState("");
  const [bpm, setBpm] = useState(70);
  const [metro, setMetro] = useState(true);
  const [mode, setMode] = useState<Mode>("fix");
  const [cfg, setCfg] = useState({ min: 60, max: 120, inc: 5, every: 2 });
  const [loaded, setLoaded] = useState(false);
  const bpmRef = useRef(bpm); bpmRef.current = bpm;
  const loops = useRef(0);
  const dir = useRef(1);
  const N = beats * 4;

  useEffect(() => {
    loadState<Saved | null>("fill", null, "fill40", (x) => {
      if (x) { const n = normalize(x); setSteps(n.s); setHands(n.h); setBeats(n.b); }
      setLoaded(true);
    });
  }, []);
  useEffect(() => {
    if (loaded) saveState("fill", { s: steps, h: hands, b: beats });
  }, [steps, hands, beats, loaded]);

  const changeBpm = (v: number) => {
    const n = Math.max(40, Math.min(220, v));
    bpmRef.current = n; setBpm(n);
  };

  const { playing, current, start, stop } = useLoop(4, () => bpmRef.current, (step, t) => {
    const s = step % N;
    if (step > 0 && s === 0) {
      loops.current++;
      if (mode !== "fix" && loops.current % Math.max(1, cfg.every) === 0) {
        let v = bpmRef.current;
        if (mode === "up") v = Math.min(cfg.max, v + cfg.inc);
        else if (mode === "down") v = Math.max(cfg.min, v - cfg.inc);
        else {
          v += dir.current * cfg.inc;
          if (v >= cfg.max) { v = cfg.max; dir.current = -1; }
          if (v <= cfg.min) { v = cfg.min; dir.current = 1; }
        }
        changeBpm(v);
      }
    }
    for (const r of steps[s]) drum(r, t, handOf(steps[s], r, hands[s])); // notas simultâneas
    if (metro && s % 4 === 0) click(t, s === 0);
  });

  const begin = () => { loops.current = 0; dir.current = 1; start(); };
  const changeBeats = (b: number) => { stop(); setBeats(b); };
  const toggleHand = (s: number) => setHands(hands.map((h, i) => (i === s ? opp(h) : h)));
  const toggle = (r: number, s: number) => {
    const cur = steps[s];
    if (cur.includes(r)) {
      setSteps(steps.map((l, i) => (i === s ? l.filter((x) => x !== r) : l)));
      return;
    }
    if (r !== KICK && cur.filter((x) => x !== KICK).length >= 2) return; // no máximo uma peça por mão
    const next = [...cur, r].sort((a, b) => a - b);
    if (!playing) drum(r, getCtx().currentTime, handOf(next, r, hands[s]));
    setSteps(steps.map((l, i) => (i === s ? next : l)));
  };
  const applyPreset = (name: string) => {
    const pr = PRESETS[name];
    stop();
    setPreset(name);
    if (!pr) return;
    setBeats(4);
    setHands(Array.from({ length: MAX }, (_, i) => pr.h[i] as Hand));
    setSteps(pr.p.map((r) => (r >= 0 ? [r] : [])));
  };
  const now = (s: number) => (current >= 0 && current % N === s ? " now" : "");
  const num = (k: keyof typeof cfg) => (
    <input type="number" value={cfg[k]} onChange={(e) => setCfg({ ...cfg, [k]: +e.target.value })} />
  );
  const view = steps.slice(0, N);

  return (
    <div className="card">
      <div className="name">🎛 Criador de viradas</div>
      <div className="mu">
        Toque numa peça para colocar a nota naquele passo. Um passo pode ter várias peças (por exemplo, bumbo + prato,
        ou uma peça em cada mão). Toque em D/E no topo para trocar a mão.
      </div>
      <div className="fg" style={{ gridTemplateColumns: `44px repeat(${N}, 34px)` }}>
        <div />
        {view.map((list, s) => {
          const hp = list.filter((x) => x !== KICK);
          const kickOnly = list.length > 0 && hp.length === 0;
          const txt = kickOnly ? "K" : hp.length > 1 ? `${label(hands[s])}+${label(opp(hands[s]))}` : label(hands[s]);
          return (
            <button key={s} className={`hd ${kickOnly ? "K" : hands[s]}${now(s)}`} onClick={() => !kickOnly && toggleHand(s)}>
              {txt}
            </button>
          );
        })}
        {PIECES.map((name, r) => (
          <Fragment key={r}>
            <div className="pl">{name}</div>
            {view.map((list, s) => {
              const on = list.includes(r);
              const h = handOf(list, r, hands[s]);
              return (
                <button key={s} className={`c${s % 4 === 0 ? " b" : ""}${now(s)}`}
                  style={on ? { background: PIECE_COLORS[r] } : undefined} onClick={() => toggle(r, s)}>
                  {on ? (h ? label(h) : "K") : ""}
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>
      <div className="row">
        <button className="p" onClick={() => (playing ? stop() : begin())}>{playing ? "■ Parar" : "▶ Tocar loop"}</button>
        <button className={metro ? "on" : ""} onClick={() => setMetro(!metro)}>Metrônomo</button>
        <select value={beats} onChange={(e) => changeBeats(+e.target.value)} aria-label="Compasso">
          <option value={2}>Compasso 2/4</option>
          <option value={3}>Compasso 3/4</option>
          <option value={4}>Compasso 4/4</option>
        </select>
        <select value={preset} onChange={(e) => applyPreset(e.target.value)} aria-label="Rudimento">
          <option value="">Rudimento…</option>
          {Object.keys(PRESETS).map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <button onClick={() => setSteps(Array.from({ length: MAX }, () => []))}>Limpar</button>
      </div>
      <div className="row">
        <button onClick={() => changeBpm(bpm - 4)}>−</button>
        <span className="bpm">{bpm}</span>
        <button onClick={() => changeBpm(bpm + 4)}>+</button>
        <input type="range" min={40} max={220} value={bpm} onChange={(e) => changeBpm(+e.target.value)} />
      </div>
      <div className="row">
        <span className="mu">Velocidade:</span>
        <select value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
          <option value="fix">Fixa</option>
          <option value="up">Acelerar</option>
          <option value="down">Desacelerar</option>
          <option value="pp">Sobe e desce</option>
        </select>
      </div>
      <div className="row mu">de {num("min")} até {num("max")} BPM, passo {num("inc")} a cada {num("every")} loops</div>
    </div>
  );
}