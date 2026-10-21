"use client";
import { Fragment, useEffect, useRef, useState } from "react";
import { KICK, PIECES, PIECE_COLORS, label, type Hand } from "../lib/data";
import { click, drum, getCtx } from "../lib/audio";
import { useLoop } from "../lib/useLoop";
import { loadState, saveState } from "../lib/sync";

type Mode = "fix" | "up" | "down" | "pp";
const N = 16;
const alt = (): Hand[] => Array.from({ length: N }, (_, i) => (i % 2 ? "L" : "R"));

export default function FillBuilder() {
  const [steps, setSteps] = useState<number[]>(Array(N).fill(-1)); // índice da peça por passo
  const [hands, setHands] = useState<Hand[]>(alt());
  const [bpm, setBpm] = useState(70);
  const [metro, setMetro] = useState(true);
  const [mode, setMode] = useState<Mode>("fix");
  const [cfg, setCfg] = useState({ min: 60, max: 120, inc: 5, every: 2 });
  const [loaded, setLoaded] = useState(false);
  const bpmRef = useRef(bpm); bpmRef.current = bpm;
  const loops = useRef(0);
  const dir = useRef(1);

  useEffect(() => {
    loadState<{ s: number[]; h: Hand[] } | null>("fill", null, "fill40", (x) => {
      if (x) { setSteps(x.s); setHands(x.h); }
      setLoaded(true);
    });
  }, []);
  useEffect(() => {
    if (loaded) saveState("fill", { s: steps, h: hands });
  }, [steps, hands, loaded]);

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
    if (steps[s] >= 0) drum(steps[s], t, steps[s] === KICK ? undefined : hands[s]);
    if (metro && s % 4 === 0) click(t, s === 0);
  });

  const begin = () => { loops.current = 0; dir.current = 1; start(); };
  const toggleHand = (s: number) => setHands(hands.map((h, i) => (i === s ? (h === "R" ? "L" : "R") : h)));
  const toggle = (r: number, s: number) => {
    const turningOn = steps[s] !== r;
    if (turningOn && !playing) drum(r, getCtx().currentTime, r === KICK ? undefined : hands[s]);
    setSteps(steps.map((p, i) => (i === s ? (turningOn ? r : -1) : p)));
  };
  const example = () => {
    const h = "RLRRLRLL";
    setHands(Array.from({ length: N }, (_, i) => h[i % 8] as Hand));
    setSteps([5, 5, 2, 2, 3, 3, 4, 4, 5, 5, 2, 2, 3, 3, 4, 4]);
  };
  const now = (s: number) => (current >= 0 && current % N === s ? " now" : "");
  const num = (k: keyof typeof cfg) => (
    <input type="number" value={cfg[k]} onChange={(e) => setCfg({ ...cfg, [k]: +e.target.value })} />
  );

  return (
    <div className="card">
      <div className="name">🎛 Criador de viradas</div>
      <div className="mu">Toque numa peça para colocar uma nota naquele passo (16 semicolcheias = 4 tempos). Toque em D/E no topo para trocar a mão.</div>
      <div className="fg" style={{ gridTemplateColumns: `44px repeat(${N}, 34px)` }}>
        <div />
        {steps.map((p, s) => {
          const kick = p === KICK;
          return (
            <button key={s} className={`hd ${kick ? "K" : hands[s]}${now(s)}`} onClick={() => !kick && toggleHand(s)}>
              {kick ? "K" : label(hands[s])}
            </button>
          );
        })}
        {PIECES.map((name, r) => (
          <Fragment key={r}>
            <div className="pl">{name}</div>
            {steps.map((p, s) => {
              const on = p === r;
              return (
                <button key={s} className={`c${s % 4 === 0 ? " b" : ""}${now(s)}`}
                  style={on ? { background: PIECE_COLORS[r] } : undefined} onClick={() => toggle(r, s)}>
                  {on ? (r === KICK ? "K" : label(hands[s])) : ""}
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>
      <div className="row">
        <button className="p" onClick={() => (playing ? stop() : begin())}>{playing ? "■ Parar" : "▶ Tocar loop"}</button>
        <button className={metro ? "on" : ""} onClick={() => setMetro(!metro)}>Metrônomo</button>
        <button onClick={example}>Exemplo paradiddle</button>
        <button onClick={() => setSteps(Array(N).fill(-1))}>Limpar</button>
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
