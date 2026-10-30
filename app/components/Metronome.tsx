"use client";
import { useEffect, useRef, useState } from "react";
import { click } from "../lib/audio";
import { useLoop } from "../lib/useLoop";

const KEY = "metro40";
const clamp = (v: number) => Math.max(30, Math.min(300, v));

export default function Metronome() {
  const [bpm, setBpm] = useState(100);
  const [beats, setBeats] = useState(4);
  const [sub, setSub] = useState(1); // passos por tempo: 1 = só os tempos
  const [loaded, setLoaded] = useState(false);
  const bpmRef = useRef(bpm); bpmRef.current = bpm;
  const taps = useRef<number[]>([]);

  useEffect(() => {
    try {
      const x = JSON.parse(localStorage.getItem(KEY) || "null");
      if (x) { setBpm(clamp(x.bpm)); setBeats(x.beats); setSub(x.sub); }
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) try { localStorage.setItem(KEY, JSON.stringify({ bpm, beats, sub })); } catch {}
  }, [bpm, beats, sub, loaded]);

  const { playing, current, start, stop } = useLoop(sub, () => bpmRef.current, (step, t) => {
    const beat = Math.floor(step / sub) % beats;
    if (step % sub === 0) click(t, beat === 0, 1); // tempo (o 1º é acentuado)
    else click(t, false, 0.35); // subdivisão, mais baixa
  });

  const setB = (v: number) => setBpm(clamp(v));
  const tap = () => {
    const now = performance.now(), a = taps.current;
    if (a.length && now - a[a.length - 1] > 2000) a.length = 0; // pausa longa recomeça a contagem
    a.push(now);
    if (a.length > 5) a.shift();
    if (a.length >= 2) setB(Math.round(60000 / ((a[a.length - 1] - a[0]) / (a.length - 1))));
  };

  const activeBeat = current >= 0 ? Math.floor(current / sub) % beats : -1;
  const onBeat = current >= 0 && current % sub === 0;

  return (
    <div className="card">
      <div className="name">⏱ Metrônomo</div>
      <div className="mu">Clique contínuo, sem rudimento nem virada. O primeiro tempo do compasso é mais agudo.</div>

      <div className="bigbpm">{bpm}<span className="mu"> BPM</span></div>
      <div className="dots">
        {Array.from({ length: beats }, (_, i) => (
          <span key={i} className={`dot${i === 0 ? " first" : ""}${i === activeBeat && onBeat ? " on" : ""}`} />
        ))}
      </div>

      <div className="row">
        <button onClick={() => setB(bpm - 5)}>−5</button>
        <button onClick={() => setB(bpm - 1)}>−1</button>
        <input type="range" min={30} max={300} value={bpm} onChange={(e) => setB(+e.target.value)} />
        <button onClick={() => setB(bpm + 1)}>+1</button>
        <button onClick={() => setB(bpm + 5)}>+5</button>
      </div>

      <div className="row">
        <button className="p" onClick={() => (playing ? stop() : start())}>{playing ? "■ Parar" : "▶ Tocar"}</button>
        <button onClick={tap}>👆 Tap tempo</button>
        <select value={beats} onChange={(e) => setBeats(+e.target.value)} aria-label="Tempos por compasso">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n} {n === 1 ? "tempo" : "tempos"}</option>)}
        </select>
        <select value={sub} onChange={(e) => { stop(); setSub(+e.target.value); }} aria-label="Subdivisão">
          <option value={1}>Só os tempos</option>
          <option value={2}>Colcheias</option>
          <option value={3}>Tercinas</option>
          <option value={4}>Semicolcheias</option>
        </select>
      </div>
      <div className="mu">Tap tempo: toque no botão no ritmo desejado (4 ou 5 toques) e o BPM é calculado sozinho.</div>
    </div>
  );
}