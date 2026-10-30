export type Pt = { t: number; bpm: number };

const W = 320, H = 150, PL = 34, PR = 12, PT = 12, PB = 24;
const fmt = (t: number) => new Date(t).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

/** Gráfico de linha em SVG puro (sem bibliotecas) com a evolução do BPM registrado. */
export default function BpmChart({ hist }: { hist: Pt[] }) {
  if (hist.length === 0) {
    return <div className="mu">Toque em “Registrar BPM” depois de treinar para ver a evolução aqui.</div>;
  }
  const pts = hist.slice(-30); // últimos 30 registros
  const bpms = pts.map((p) => p.bpm);
  let lo = Math.min(...bpms), hi = Math.max(...bpms);
  if (hi - lo < 10) { const m = (hi + lo) / 2; lo = m - 5; hi = m + 5; } // evita escala achatada
  lo = Math.floor((lo - 4) / 5) * 5;
  hi = Math.ceil((hi + 4) / 5) * 5;

  const x = (i: number) => (pts.length === 1 ? (PL + W - PR) / 2 : PL + (i * (W - PL - PR)) / (pts.length - 1));
  const y = (v: number) => PT + (H - PT - PB) * (1 - (v - lo) / (hi - lo));
  const path = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.bpm).toFixed(1)}`).join(" ");
  const best = bpms.lastIndexOf(Math.max(...bpms));
  const ticks = [lo, Math.round((lo + hi) / 2), hi];
  const gain = pts[pts.length - 1].bpm - pts[0].bpm;

  return (
    <div>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Evolução do BPM">
        {ticks.map((v) => (
          <g key={v}>
            <line className="gl" x1={PL} x2={W - PR} y1={y(v)} y2={y(v)} />
            <text x={PL - 6} y={y(v) + 3} textAnchor="end">{v}</text>
          </g>
        ))}
        {pts.length > 1 && <path className="ln" d={path} />}
        {pts.map((p, i) => (
          <circle key={i} className={i === best ? "best" : "dt"} cx={x(i)} cy={y(p.bpm)} r={i === best ? 5 : 3} />
        ))}
        <text x={x(0)} y={H - 6} textAnchor={pts.length === 1 ? "middle" : "start"}>{fmt(pts[0].t)}</text>
        {pts.length > 1 && <text x={x(pts.length - 1)} y={H - 6} textAnchor="end">{fmt(pts[pts.length - 1].t)}</text>}
      </svg>
      <div className="mu">
        {pts.length} {pts.length === 1 ? "registro" : "registros"} · melhor {Math.max(...bpms)} BPM
        {pts.length > 1 && ` · ${gain >= 0 ? "+" : ""}${gain} BPM desde o primeiro`}
      </div>
    </div>
  );
}