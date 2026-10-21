// Offline-first: localStorage é a fonte imediata; o Neon sincroniza em segundo plano.
// Conflito: vence a alteração mais recente (campo t).
type Stored<T> = { v: T; t: number };
const L = (k: string) => `sync:${k}`;
const KEYS = ["progress", "fill"];

function readLocal<T>(key: string): Stored<T> | null {
  try { return JSON.parse(localStorage.getItem(L(key)) || "null"); } catch { return null; }
}
function writeLocal<T>(key: string, s: Stored<T>) {
  try { localStorage.setItem(L(key), JSON.stringify(s)); } catch {}
}

async function api(url: string, init: RequestInit = {}): Promise<Response | null> {
  try {
    for (let i = 0; i < 2; i++) {
      const res = await fetch(url, {
        ...init,
        headers: { "content-type": "application/json", "x-app-key": localStorage.getItem("appkey") || "" },
      });
      if (res.status !== 401) return res;
      const k = window.prompt("Chave de acesso do app (APP_KEY):");
      if (!k) return res;
      localStorage.setItem("appkey", k);
    }
  } catch {}
  return null; // offline
}

async function push(key: string, s: Stored<unknown>) {
  const res = await api("/api/state", { method: "PUT", body: JSON.stringify({ key, value: s.v, t: s.t }) });
  try {
    if (res?.ok) localStorage.removeItem("dirty:" + key);
    else localStorage.setItem("dirty:" + key, "1");
  } catch {}
}

/** Chama apply() já com o valor local e, se o Neon tiver algo mais novo, de novo com o remoto. */
export async function loadState<T>(key: string, fallback: T, legacyKey: string | undefined, apply: (v: T) => void) {
  let local = readLocal<T>(key);
  if (!local && legacyKey) {
    try {
      const raw = localStorage.getItem(legacyKey);
      if (raw) local = { v: JSON.parse(raw), t: 1 };
    } catch {}
  }
  apply(local ? local.v : fallback);

  const res = await api(`/api/state?key=${key}`);
  if (!res?.ok) return;
  const remote: { value: T; t: number } | null = await res.json();
  if (remote && (!local || remote.t > local.t)) {
    writeLocal(key, { v: remote.value, t: remote.t });
    apply(remote.value);
  } else if (local && (!remote || local.t > remote.t)) {
    push(key, local);
  }
}

const timers: Record<string, ReturnType<typeof setTimeout>> = {};
export function saveState<T>(key: string, v: T) {
  const cur = readLocal<T>(key);
  if (cur && JSON.stringify(cur.v) === JSON.stringify(v)) return; // nada mudou
  const s = { v, t: Date.now() };
  writeLocal(key, s);
  clearTimeout(timers[key]);
  timers[key] = setTimeout(() => push(key, s), 600);
}

/** Reenvia o que ficou pendente quando voltar a conexão. */
export function initSync() {
  const flush = () => KEYS.forEach((k) => {
    if (localStorage.getItem("dirty:" + k)) { const s = readLocal(k); if (s) push(k, s); }
  });
  window.addEventListener("online", flush);
  flush();
}
