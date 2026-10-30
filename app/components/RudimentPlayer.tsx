"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, RUDIMENTS, label, parseSticking } from "../lib/data";
import { click, hit } from "../lib/audio";
import { useLoop } from "../lib/useLoop";
import { loadState, saveState } from "../lib/sync";
import BpmChart, { type Pt } from "./Bpmchart";

type Prog = Record<number, { best: number; done: boolean; hist?: Pt[] }>;

export default function RudimentPlayer() {
  const [sel, setSel] = useState(0);
  const [bpm, setBpm] = useState(80);
  const [sub, setSub] = useState(4);
  const [metro, setMetro] = useState(true);
  const [filter, setFilter] = useState("Todos");
  const [prog, setProg] = useState<Prog>({});
  const bpmRef = useRef(bpm); bpmRef.current = bpm;
  const notes = useMemo(() => parseSticking(RUDIMENTS[sel][2]), [sel]);

  useEffect(() => { loadState<Prog>("progress", {}, "rud40", setProg); }, []);
  const save = (p: Prog) => { setProg(p); saveState("progress", p); };
  const get = (i: number) => prog[i] ?? { best: 0, done: false };

  const { playing, current, start, stop } = useLoop(sub, () => bpmRef.current, (step, t) => {
    const n = notes[step % notes.length];
    for (let j = 0; j < n.g; j++) hit(n.h, t - 0.035 * (n.g - j), 0.3);
    hit(n.h, t, 0.9);
    if (metro && step % sub === 0) click(t, step % (sub * 4) === 0);
  });

  const setB = (v: number) => setBpm(Math.max(40, Math.min(220, v)));
  const select = (i: number) => { stop(); setSel(i); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const active = current >= 0 ? current % notes.length : -1;
  const [name, cat, sticking] = RUDIMENTS[sel];
  const p = get(sel);
  const doneCount = Object.values(prog).filter((x) => x.done).length;
  // cada registro entra no histórico; o recorde só sobe se o BPM for maior
  const log = () => {
    const hist = [...(p.hist ?? []), { t: Date.now(), bpm }].slice(-200);
    save({ ...prog, [sel]: { ...p, best: Math.max(p.best, bpm), hist } });
  };
  let k = 0;

  return (
    <>
      <div className="mu right">{doneCount}/40 dominados</div>
      <div className="card">
        <div className="mu">{cat}</div>
        <div className="name">{sel + 1}. {name}</div>
        <div className="seq">
          {sticking.split(" ").map((tok, ti) => (
            <div className="tok" key={ti}>
              {[...tok].map((c, ci) => {
                const main = c === c.toUpperCase();
                const idx = main ? k++ : -1;
                return (
                  <span key={ci} className={`n ${c.toUpperCase()}${main ? "" : " g"}${idx >= 0 && idx === active ? " on" : ""}`}>
                    {label(c)}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
        <div className="row">
          <button className="p" onClick={() => (playing ? stop() : start())}>{playing ? "■ Parar" : "▶ Tocar"}</button>
          <button className={metro ? "on" : ""} onClick={() => setMetro(!metro)}>Metrônomo</button>
          <select value={sub} onChange={(e) => setSub(+e.target.value)}>
            <option value={2}>Colcheias</option>
            <option value={3}>Tercinas</option>
            <option value={4}>Semicolcheias</option>
          </select>
        </div>
        <div className="row">
          <button onClick={() => setB(bpm - 4)}>−</button>
          <span className="bpm">{bpm}</span>
          <button onClick={() => setB(bpm + 4)}>+</button>
          <input type="range" min={40} max={220} value={bpm} onChange={(e) => setB(+e.target.value)} />
        </div>
        <div className="row">
          <button onClick={log}>🏆 Registrar BPM</button>
          <button onClick={() => save({ ...prog, [sel]: { ...p, done: !p.done } })}>{p.done ? "★ Dominado" : "☆ Dominado"}</button>
          <span className="mu">{p.best ? `Recorde: ${p.best} BPM` : "Sem recorde ainda"}</span>
        </div>
        <div className="libhead">📈 Evolução do BPM</div>
        <BpmChart hist={p.hist ?? []} />
      </div>

      <div className="chips">
        {CATEGORIES.map((c) => (
          <button key={c} className={c === filter ? "on" : ""} onClick={() => setFilter(c)}>{c}</button>
        ))}
      </div>
      <div className="card list">
        {RUDIMENTS.map((r, i) => {
          if (filter !== "Todos" && r[1] !== filter) return null;
          const pr = get(i);
          return (
            <div key={i} className={`it${i === sel ? " s" : ""}`} onClick={() => select(i)}>
              <span className="num">{i + 1}</span>
              <div className="t">
                <div>{r[0]}</div>
                <div className="st">{[...r[2]].map((c) => (c === " " ? " " : c === c.toUpperCase() ? label(c) : label(c).toLowerCase())).join("")}</div>
              </div>
              <span className={`bd${pr.done ? " ok" : ""}`}>{pr.done ? "✓ " : ""}{pr.best ? `${pr.best} BPM` : "—"}</span>
            </div>
          );
        })}
      </div>
      <div className="mu">D = direita, E = esquerda. Letras pequenas = ornamentos (flam/drag). Confira os stickings com seu professor.</div>
    </>
  );
}