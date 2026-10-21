import { useCallback, useEffect, useRef, useState } from "react";
import { getCtx } from "./audio";

/** Scheduler com lookahead: chama onStep(step, tempoDoAudio) a cada subdivisão. */
export function useLoop(stepsPerBeat: number, getBpm: () => number, onStep: (step: number, t: number) => void) {
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(-1);
  const st = useRef({ timer: 0 as unknown as ReturnType<typeof setInterval>, raf: 0, next: 0, step: 0, q: [] as { t: number; s: number }[] });
  const cb = useRef(onStep); cb.current = onStep;
  const spb = useRef(stepsPerBeat); spb.current = stepsPerBeat;

  const stop = useCallback(() => {
    clearInterval(st.current.timer);
    cancelAnimationFrame(st.current.raf);
    setPlaying(false); setCurrent(-1);
  }, []);

  const start = useCallback(() => {
    stop();
    const ctx = getCtx(); ctx.resume();
    const s = st.current;
    s.step = 0; s.next = ctx.currentTime + 0.08; s.q = [];
    s.timer = setInterval(() => {
      while (s.next < ctx.currentTime + 0.12) {
        cb.current(s.step, s.next);
        s.q.push({ t: s.next, s: s.step });
        s.step++;
        s.next += 60 / getBpm() / spb.current;
      }
    }, 25);
    const loop = () => {
      let c = -1;
      while (s.q.length && s.q[0].t <= ctx.currentTime) c = s.q.shift()!.s;
      if (c >= 0) setCurrent(c);
      s.raf = requestAnimationFrame(loop);
    };
    loop();
    setPlaying(true);
  }, [getBpm, stop]);

  useEffect(() => stop, [stop]);
  return { playing, current, start, stop };
}
