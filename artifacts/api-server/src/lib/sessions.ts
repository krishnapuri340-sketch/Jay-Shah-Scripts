import { randomBytes } from "crypto";

interface Session {
  userId: string;
  createdAt: number;
}

const sessions = new Map<string, Session>();
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function createSession(userId: string): string {
  const token = randomBytes(32).toString("hex");
  sessions.set(token, { userId, createdAt: Date.now() });
  return token;
}

export function getSession(token: string): Session | null {
  const session = sessions.get(token);
  if (!session) return null;
  if (Date.now() - session.createdAt > SESSION_TTL_MS) {
    sessions.delete(token);
    return null;
  }
  return session;
}

export function deleteSession(token: string): void {
  sessions.delete(token);
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

export function requireCommissioner(req: any, res: any): boolean {
  const userId = getSessionUser(req);
  if (userId !== "rajveer") {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (now - session.createdAt > SESSION_TTL_MS) sessions.delete(token);
  }
}, 60 * 60 * 1000);
