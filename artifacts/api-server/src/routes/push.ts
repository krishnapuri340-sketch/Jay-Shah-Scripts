import { Router } from "express";
import webpush from "web-push";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const router = Router();

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_CONTACT = process.env.VAPID_CONTACT || "mailto:admin@iplfantasy.app";

const SUBS_FILE = join(process.cwd(), "push-subscriptions.json");

function loadSubs(): any[] {
  try {
    if (!existsSync(SUBS_FILE)) return [];
    return JSON.parse(readFileSync(SUBS_FILE, "utf8"));
  } catch { return []; }
}

function saveSubs(subs: any[]) {
  try { writeFileSync(SUBS_FILE, JSON.stringify(subs, null, 2)); } catch (_) {}
}

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_CONTACT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// ── Push API routes ────────────────────────────────────────────────────────────

router.get("/api/push/vapid-public-key", (_req, res) => {
  res.json({ key: VAPID_PUBLIC_KEY });
});

router.post("/api/push/subscribe", (req, res) => {
  const sub = req.body;
  if (!sub?.endpoint) { res.status(400).json({ error: "Invalid subscription" }); return; }
  const subs = loadSubs();
  if (!subs.some((s: any) => s.endpoint === sub.endpoint)) {
    subs.push(sub);
    saveSubs(subs);
  }
  res.json({ ok: true, count: subs.length });
});

router.post("/api/push/unsubscribe", (req, res) => {
  const { endpoint } = req.body || {};
  if (endpoint) saveSubs(loadSubs().filter((s: any) => s.endpoint !== endpoint));
  res.json({ ok: true });
});

router.post("/api/push/broadcast", async (req, res) => {
  const { title, body, tag, url } = req.body || {};
  const sent = await sendPushToAll({ title: title || "IPL Fantasy 2026", body: body || "", tag, url });
  res.json({ ok: true, sent });
});

// Manually trigger a live scorecard push from the admin panel
router.post("/api/push/live-score-update", async (_req, res) => {
  const matches = await fetchLiveMatchesFromS3();
  if (matches.length === 0) {
    res.json({ ok: false, reason: "No live matches right now" });
    return;
  }
  let sent = 0;
  for (const m of matches) {
    const notif = buildScorecardNotification(m);
    if (notif) sent += await sendPushToAll(notif);
  }
  res.json({ ok: true, sent, matches: matches.length });
});

router.get("/api/push/subscriber-count", (_req, res) => {
  res.json({ count: loadSubs().length });
});

// ── Send helper ────────────────────────────────────────────────────────────────

export async function sendPushToAll(payload: {
  title: string; body: string; tag?: string; url?: string; image?: string;
}): Promise<number> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return 0;
  const subs = loadSubs();
  if (subs.length === 0) return 0;
  const dead: string[] = [];
  let sent = 0;
  await Promise.allSettled(
    subs.map(async (sub: any) => {
      try {
        await webpush.sendNotification(sub, JSON.stringify(payload));
        sent++;
      } catch (e: any) {
        if (e.statusCode === 410 || e.statusCode === 404) dead.push(sub.endpoint);
      }
    })
  );
  if (dead.length > 0) saveSubs(subs.filter((s: any) => !dead.includes(s.endpoint)));
  return sent;
}

// ── Live score watcher ─────────────────────────────────────────────────────────

const IPL_S3_BASE = "https://ipl-stats-sports-mechanic.s3.ap-south-1.amazonaws.com/ipl/feeds";
const IPL_COMPETITION_ID = 284;

function parseJsonp(text: string): any {
  const m = text.match(/^[A-Za-z_$][A-Za-z0-9_$.]*\(([\s\S]*)\)\s*;?\s*$/);
  if (m) return JSON.parse(m[1]);
  return JSON.parse(text);
}

async function fetchLiveMatchesFromS3(): Promise<any[]> {
  try {
    const res = await fetch(`${IPL_S3_BASE}/${IPL_COMPETITION_ID}-matchschedule.js`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; IPLFetcher/1.0)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const data = parseJsonp(await res.text());
    const all = data?.Matchsummary || data?.AppMatchSchedule?.Match || data?.MatchSchedule?.Match || [];
    return (Array.isArray(all) ? all : []).filter((m: any) => {
      const s = String(m?.MatchStatus || "").toLowerCase();
      return s === "live" || s === "playing" || s === "in progress" || s === "ongoing";
    });
  } catch { return []; }
}

// Snapshot of a match's score used to detect changes
interface ScoreSnap {
  inn1Summary: string;
  inn2Summary: string;
  inn1Wickets: number;
  inn2Wickets: number;
}

function getScoreSnap(m: any): ScoreSnap {
  const wickets = (s: string) => {
    const hit = s?.match(/\d+\/(\d+)/);
    return hit ? parseInt(hit[1]) : 0;
  };
  return {
    inn1Summary: m?.FirstBattingSummary || "",
    inn2Summary: m?.SecondBattingSummary || "",
    inn1Wickets: wickets(m?.FirstBattingSummary || ""),
    inn2Wickets: wickets(m?.SecondBattingSummary || ""),
  };
}

function isSignificantChange(prev: ScoreSnap, curr: ScoreSnap): boolean {
  // Wicket fell in either innings
  if (curr.inn1Wickets > prev.inn1Wickets) return true;
  if (curr.inn2Wickets > prev.inn2Wickets) return true;
  // Second innings just started
  if (!prev.inn2Summary && curr.inn2Summary) return true;
  return false;
}

function buildScorecardNotification(m: any): {
  title: string; body: string; tag: string; url: string; image?: string;
} | null {
  const t1 = m?.FirstBattingTeamCode || m?.HomeTeamCode || m?.HomeTeamName || "";
  const t2 = m?.SecondBattingTeamCode || m?.AwayTeamCode || m?.AwayTeamName || "";

  const lines: string[] = [];

  if (m?.FirstBattingSummary)  lines.push(`${t1}  ${m.FirstBattingSummary}`);
  if (m?.SecondBattingSummary) lines.push(`${t2}  ${m.SecondBattingSummary}`);

  // Chase / result line
  const status = m?.Commentss || m?.StatusNote || m?.Result || "";
  if (status) lines.push(status);

  if (lines.length === 0) return null;

  const toss = m?.TossDetails ? `\n${m.TossDetails}` : "";
  const tag = `match-${m?.MatchID || m?.MatchId || "live"}`;

  return {
    title: `🏏 ${t1} vs ${t2}`,
    body: lines.join("\n") + toss,
    tag,
    url: "/",
  };
}

const lastSnaps = new Map<string, ScoreSnap>();
let watcherTimer: ReturnType<typeof setInterval> | null = null;

async function checkAndNotify() {
  if (loadSubs().length === 0) return;
  const matches = await fetchLiveMatchesFromS3();
  for (const m of matches) {
    const id = String(m?.MatchID || m?.MatchId || "");
    if (!id) continue;
    const curr = getScoreSnap(m);
    const prev = lastSnaps.get(id);
    if (prev && isSignificantChange(prev, curr)) {
      const notif = buildScorecardNotification(m);
      if (notif) await sendPushToAll(notif);
    }
    lastSnaps.set(id, curr);
  }
  // Clear snaps for matches no longer live
  const liveIds = new Set(matches.map((m: any) => String(m?.MatchID || m?.MatchId || "")));
  for (const id of lastSnaps.keys()) {
    if (!liveIds.has(id)) lastSnaps.delete(id);
  }
}

export function startLiveScoreWatcher() {
  if (watcherTimer) return;
  // First check after 45 s so the server is fully up
  setTimeout(checkAndNotify, 45_000);
  // Then every 60 s
  watcherTimer = setInterval(checkAndNotify, 60_000);
}

export default router;
