import { neon } from "@neondatabase/serverless";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const KEYS = new Set(["progress", "fill"]);
const db = () => neon(process.env.DATABASE_URL!);

let ready: Promise<unknown> | null = null;
function ensureTable() {
  ready ??= db()`CREATE TABLE IF NOT EXISTS app_state (
    key text PRIMARY KEY, value jsonb NOT NULL, t bigint NOT NULL)`;
  return ready;
}

function authorized(req: NextRequest) {
  const k = process.env.APP_KEY;
  return !!k && req.headers.get("x-app-key") === k; // sem APP_KEY configurada, nega tudo
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const key = req.nextUrl.searchParams.get("key") ?? "";
  if (!KEYS.has(key)) return NextResponse.json({ error: "bad key" }, { status: 400 });
  await ensureTable();
  const rows = await db()`SELECT value, t FROM app_state WHERE key = ${key}`;
  return NextResponse.json(rows[0] ? { value: rows[0].value, t: Number(rows[0].t) } : null);
}

export async function PUT(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { key, value, t } = await req.json();
  if (!KEYS.has(key) || typeof t !== "number") return NextResponse.json({ error: "bad body" }, { status: 400 });
  await ensureTable();
  await db()`INSERT INTO app_state (key, value, t)
    VALUES (${key}, ${JSON.stringify(value)}::jsonb, ${t})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, t = EXCLUDED.t
    WHERE app_state.t < EXCLUDED.t`;
  return NextResponse.json({ ok: true });
}
