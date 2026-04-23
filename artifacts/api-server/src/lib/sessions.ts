import { randomBytes } from "crypto";

interface Session {
  userId: string;
  createdAt: number;
}

const sessions = new Map<string, Session>();
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const REPLIT_DB_URL = process.env.REPLIT_DB_URL;
const SESSION_KV_PREFIX = "session_";

async function kvGet(key: string): Promise<string | null> {
  if (!REPLIT_DB_URL) return null;
  try {
    const res = await fetch(`${REPLIT_DB_URL}/${encodeURIComponent(key)}`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    return await res.text();
  } catch { return null; }
}

async function kvSet(key: string, value: string): Promise<void> {
  if (!REPLIT_DB_URL) return;
  try {
    await fetch(REPLIT_DB_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
      signal: AbortSignal.timeout(6000),
    });
  } catch {}
}

async function kvDelete(key: string): Promise<void> {
  if (!REPLIT_DB_URL) return;
  try {
    await fetch(`${REPLIT_DB_URL}/${encodeURIComponent(key)}`, {
      method: "DELETE",
      signal: AbortSignal.timeout(6000),
    });
  } catch {}
}

async function kvList(prefix: string): Promise<string[]> {
  if (!REPLIT_DB_URL) return [];
  try {
    const res = await fetch(`${REPLIT_DB_URL}?prefix=${encodeURIComponent(prefix)}`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return [];
    const text = await res.text();
    return text.split("\n").map(k => k.trim()).filter(Boolean);
  } catch { return []; }
}

// Load all sessions from KV into memory on startup
(async () => {
  try {
    const keys = await kvList(SESSION_KV_PREFIX);
    let loaded = 0;
    await Promise.all(keys.map(async (key) => {
      const raw = await kvGet(key);
      if (!raw) return;
      try {
        const session: Session = JSON.parse(raw);
        if (!session.userId || !session.createdAt) return;
        if (Date.now() - session.createdAt > SESSION_TTL_MS) {
          kvDelete(key).catch(() => {}); // prune expired
          return;
        }
        const token = key.slice(SESSION_KV_PREFIX.length);
        sessions.set(token, session);
        loaded++;
      } catch {}
    }));
    if (loaded > 0) console.log(`[sessions] Restored ${loaded} session(s) from KV`);
  } catch {}
})();

export function createSession(userId: string): string {
  const token = randomBytes(32).toString("hex");
  const session: Session = { userId, createdAt: Date.now() };
  sessions.set(token, session);
  // Persist to KV non-blocking — in-memory is the source of truth for this process
  kvSet(`${SESSION_KV_PREFIX}${token}`, JSON.stringify(session)).catch(() => {});
  return token;
}

export function getSession(token: string): Session | null {
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    sessions.delete(token);
    kvDelete(`${SESSION_KV_PREFIX}${token}`).catch(() => {});
    return null;
  }
  return session;
}

export function deleteSession(token: string): void {
  sessions.delete(token);
  kvDelete(`${SESSION_KV_PREFIX}${token}`).catch(() => {});
}

export function getSessionUser(req: any): string | null {
  const auth = req.headers["authorization"] as string | undefined;
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    return getSession(token)?.userId ?? null;
  }
  const qToken = req.query?.token as string | undefined;
  if (qToken) {
    return getSession(qToken)?.userId ?? null;
  }
  return null;
}

export function requireSession(req: any, res: any): string | null {
  const userId = getSessionUser(req);
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  return userId;
}

// The commissioner is the single admin account for this league.
const COMMISSIONER_ID = "rajveer";

export function isCommissioner(userId: string | null): boolean {
  return userId === COMMISSIONER_ID;
}

export function requireCommissioner(req: any, res: any): boolean {
  const userId = getSessionUser(req);
  if (!isCommissioner(userId)) {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

// Hourly cleanup: expire old sessions from memory and KV
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      sessions.delete(token);
      kvDelete(`${SESSION_KV_PREFIX}${token}`).catch(() => {});
    }
  }
}, 60 * 60 * 1000);
