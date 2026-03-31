import { Router, type IRouter } from "express";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { fetchMatchOverview, refreshLiveMatches } from "./ipl-points";

// ── Shared data stores ────────────────────────────────────────────────────────
// Stored under .local/ipl-data/ — gitignored so changes survive git checkpoints/restores
const _cwd2 = process.cwd();
const _dataDir = (() => {
  const preferred = join(_cwd2, ".local/ipl-data");
  try { mkdirSync(preferred, { recursive: true }); } catch {}
  return preferred;
})();

const PRED_FILE = join(_dataDir, "ipl-predictions.json");
type PredStore = Record<string, Record<string, string | null>>;
function loadPreds(): PredStore {
  try { if (existsSync(PRED_FILE)) return JSON.parse(readFileSync(PRED_FILE, "utf8")); } catch {}
  return {};
}
function savePreds(data: PredStore) {
  try { writeFileSync(PRED_FILE, JSON.stringify(data)); } catch {}
}
let predsCache: PredStore = loadPreds();

const PINS_FILE = join(_dataDir, "ipl-pins.json");
const DEFAULT_PINS: Record<string, string> = { rajveer: "1111", mombasa: "2222", mumbai: "3333", ponygoat: "4444" };
type PinStore = Record<string, string>;
function loadServerPins(): PinStore {
  try { if (existsSync(PINS_FILE)) return { ...DEFAULT_PINS, ...JSON.parse(readFileSync(PINS_FILE, "utf8")) }; } catch {}
  return { ...DEFAULT_PINS };
}
function saveServerPins(data: PinStore) {
  try { writeFileSync(PINS_FILE, JSON.stringify(data)); } catch {}
}
let pinsCache: PinStore = loadServerPins();

const router: IRouter = Router();

const IPL_COMPETITION_ID = 284;
const IPL_S3_BASE = "https://ipl-stats-sports-mechanic.s3.ap-south-1.amazonaws.com/ipl/feeds";

function parseJsonp(text: string, expectedCallback?: string): any {
  const match = text.match(/^([A-Za-z_$][A-Za-z0-9_$]*)\(([\s\S]*)\)\s*;?\s*$/);
  if (match) {
    return JSON.parse(match[2]);
  }
  return JSON.parse(text);
}

async function fetchIPLSchedule(): Promise<{ matches: any[] }> {
  try {
    const url = `${IPL_S3_BASE}/${IPL_COMPETITION_ID}-matchschedule.js`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; IPLFetcher/1.0)",
        "Accept": "*/*",
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return { matches: [] };
    const text = await res.text();
    if (!text || text.trim().length < 10) return { matches: [] };
    const data = parseJsonp(text);
    const raw = data?.Matchsummary || data?.AppMatchSchedule?.Match || data?.MatchSchedule?.Match || [];
    return { matches: Array.isArray(raw) ? raw : [] };
  } catch (_) {
    return { matches: [] };
  }
}

async function fetchIPLLive(): Promise<any[]> {
  try {
    const url = `${IPL_S3_BASE}/${IPL_COMPETITION_ID}-live.js`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; IPLFetcher/1.0)",
        "Accept": "*/*",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const text = await res.text();
    if (!text || text.trim().length < 10) return [];
    const data = parseJsonp(text);
    const live = data?.Matchsummary || data?.AppLiveMatch?.Match || data?.LiveMatch || data?.Match || [];
    return Array.isArray(live) ? live : [live];
  } catch (_) {
    return [];
  }
}

// IPL official team name → short code (S3 feed only provides codes for batting teams)
const TEAM_NAME_TO_CODE: Record<string, string> = {
  "Rajasthan Royals": "RR",
  "Chennai Super Kings": "CSK",
  "Mumbai Indians": "MI",
  "Kolkata Knight Riders": "KKR",
  "Royal Challengers Bengaluru": "RCB",
  "Royal Challengers Bangalore": "RCB",
  "Gujarat Titans": "GT",
  "Punjab Kings": "PBKS",
  "Lucknow Super Giants": "LSG",
  "Delhi Capitals": "DC",
  "Sunrisers Hyderabad": "SRH",
};

function teamCode(name: string, batCode1: string, batName1: string, batCode2: string, batName2: string): string {
  // Prefer matching the team name against the batting team names (which carry the short code)
  if (name && batName1 && name === batName1) return batCode1;
  if (name && batName2 && name === batName2) return batCode2;
  // Fallback to the static map
  return TEAM_NAME_TO_CODE[name] || "";
}

function transformMatch(m: any): any {
  const status = String(m?.MatchStatus || "").toLowerCase();
  const isLive = status === "live" || status === "playing" || status === "in progress" || status === "ongoing";
  const isDone = status === "post" || status === "result" || status === "completed" || status === "match over";

  const matchDate = m?.GMTMatchDate || m?.MatchDate || "";
  const matchTime = m?.GMTMatchTime ? m.GMTMatchTime.replace(" GMT", "") : (m?.MatchTime || "00:00");
  const dateTimeGMT = matchDate ? `${matchDate}T${matchTime}:00Z` : "";

  // Home/away identity — from official HomeTeamName/AwayTeamName
  // Codes are derived by matching against batting team codes (the only codes in the S3 feed)
  const homeName = m?.HomeTeamName || "";
  const awayName = m?.AwayTeamName || "";
  const bat1Code = m?.FirstBattingTeamCode || "";
  const bat1Name = m?.FirstBattingTeamName || "";
  const bat2Code = m?.SecondBattingTeamCode || "";
  const bat2Name = m?.SecondBattingTeamName || "";
  const homeCode = teamCode(homeName, bat1Code, bat1Name, bat2Code, bat2Name);
  const awayCode = teamCode(awayName, bat1Code, bat1Name, bat2Code, bat2Name);

  // Batting order (may differ from home/away when away team wins toss and bats)
  const firstBatCode  = m?.FirstBattingTeamCode  || homeCode;
  const secondBatCode = m?.SecondBattingTeamCode || awayCode;
  const firstBatName  = m?.FirstBattingTeamName  || homeName;
  const secondBatName = m?.SecondBattingTeamName || awayName;

  const scoreEntries: any[] = [];
  if (m?.FirstBattingSummary) {
    scoreEntries.push({ inning: `${firstBatCode || firstBatName} Innings`, summary: m.FirstBattingSummary });
  }
  if (m?.SecondBattingSummary) {
    scoreEntries.push({ inning: `${secondBatCode || secondBatName} Innings`, summary: m.SecondBattingSummary });
  }

  return {
    id: String(m?.MatchID || m?.MatchId || Math.random()),
    name: m?.MatchName || `${homeName} vs ${awayName}`,
    homeTeamCode: homeCode,
    awayTeamCode: awayCode,
    teamInfo: [
      {
        shortname: homeCode,
        name: homeName,
        img: m?.HomeTeamLogo || m?.MatchHomeTeamLogo || "",
      },
      {
        shortname: awayCode,
        name: awayName,
        img: m?.AwayTeamLogo || m?.MatchAwayTeamLogo || "",
      },
    ],
    dateTimeGMT,
    date: matchDate,
    venue: m?.GroundName || m?.Venue || "",
    city: m?.city || "",
    matchStarted: isLive || isDone,
    matchEnded: isDone,
    status: m?.Commentss || m?.StatusNote || m?.Result || m?.MatchStatus || "",
    score: scoreEntries,
    toss: m?.TossDetails || "",
    momName: m?.MOM || "",
    source: "ipl-official",
  };
}

let cache: { data: any; timestamp: number } | null = null;
const CACHE_TTL_IDLE = 90 * 1000;  // 90 s when no live match
const CACHE_TTL_LIVE = 20 * 1000;  // 20 s when a match is active
let matchesRefreshing = false;
let currentLiveIplIds: string[] = []; // updated by each doRefreshMatches run

async function doRefreshMatches(): Promise<void> {
  if (matchesRefreshing) return;
  matchesRefreshing = true;
  try {
    const [scheduleResult, liveResult] = await Promise.allSettled([
      fetchIPLSchedule(),
      fetchIPLLive(),
    ]);
    const scheduleData = scheduleResult.status === "fulfilled" ? scheduleResult.value : { matches: [] };
    const liveData = liveResult.status === "fulfilled" ? liveResult.value : [];
    const liveIds = new Set(liveData.map((l: any) => String(l?.MatchID || l?.MatchId || "")));
    const allMatches = scheduleData.matches.map((m: any) => {
      const transformed = transformMatch(m);
      if (liveIds.has(transformed.id)) {
        return { ...transformed, matchStarted: true, matchEnded: false };
      }
      return transformed;
    });
    allMatches.sort((a: any, b: any) => {
      const aLive = a.matchStarted && !a.matchEnded;
      const bLive = b.matchStarted && !b.matchEnded;
      if (aLive && !bLive) return -1;
      if (bLive && !aLive) return 1;
      const aT = a.dateTimeGMT ? new Date(a.dateTimeGMT).getTime() : 0;
      const bT = b.dateTimeGMT ? new Date(b.dateTimeGMT).getTime() : 0;
      return aT - bT;
    });
    cache = {
      data: {
        matches: allMatches,
        sources: { iplOfficial: scheduleData.matches.length, liveCount: liveData.length, competitionId: IPL_COMPETITION_ID },
        timestamp: new Date().toISOString(),
      },
      timestamp: Date.now(),
    };
    // Track live IPL match IDs for CricAPI polling
    currentLiveIplIds = allMatches
      .filter((m: any) => m.matchStarted && !m.matchEnded)
      .map((m: any) => m.id);
    // Pre-warm scorecard overview cache for completed matches
    const completedIds = allMatches.filter((m: any) => m.matchEnded).map((m: any) => m.id);
    for (const id of completedIds) {
      fetchMatchOverview(id, true).catch(() => {});
    }
    // Pull fresh CricAPI scorecard for each live match
    if (currentLiveIplIds.length > 0) {
      refreshLiveMatches(currentLiveIplIds).catch(() => {});
    }
  } catch (_) {
    // silently retain old cache on error
  } finally {
    matchesRefreshing = false;
  }
}

// Adaptive scheduler: 30 s during a live match, 90 s when idle
function scheduleNextMatchRefresh(): void {
  const delay = currentLiveIplIds.length > 0 ? CACHE_TTL_LIVE : CACHE_TTL_IDLE;
  setTimeout(async () => {
    await doRefreshMatches();
    scheduleNextMatchRefresh();
  }, delay);
}

// Warm cache on startup then begin adaptive cycle
doRefreshMatches().then(scheduleNextMatchRefresh);

router.get("/ipl/matches", async (req, res) => {
  try {
    if (!cache) {
      // Very first boot — wait for the initial fill
      await doRefreshMatches();
    } else if (Date.now() - cache.timestamp >= CACHE_TTL_IDLE) {
      // Stale — fire background refresh but respond immediately with old data
      doRefreshMatches().catch(() => {});
    }
    if (cache) return res.json(cache.data);
    res.status(503).json({ error: "Match data loading, try again shortly", matches: [] });
  } catch (err: any) {
    req.log.error({ err }, "Failed to fetch IPL matches");
    res.status(500).json({ error: "Failed to fetch match data", matches: [] });
  }
});

let standingsCache: { data: any; timestamp: number } | null = null;
const STANDINGS_TTL = 3 * 60 * 1000; // 3 min
let standingsRefreshing = false;

async function doRefreshStandings(): Promise<void> {
  if (standingsRefreshing) return;
  standingsRefreshing = true;
  try {
    const url = `${IPL_S3_BASE}/stats/${IPL_COMPETITION_ID}-groupstandings.js`;
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(10000) });
    if (!r.ok) return;
    const text = await r.text();
    const parsed = parseJsonp(text);
    const raw: any[] = parsed?.points || [];
    const standings = raw.map((t: any) => ({
      rank: parseInt(t.OrderNo) || 0,
      teamCode: t.TeamCode || "",
      teamName: t.TeamName || "",
      teamLogo: t.TeamLogo || "",
      matches: parseInt(t.Matches) || 0,
      won: parseInt(t.Wins) || 0,
      lost: parseInt(t.Loss) || 0,
      tied: parseInt(t.Tied) || 0,
      noResult: parseInt(t.NoResult) || 0,
      points: parseInt(t.Points) || 0,
      nrr: parseFloat(t.NetRunRate) || 0,
      for: t.ForTeams || "",
      against: t.AgainstTeam || "",
      form: t.Performance || "",
    })).sort((a: any, b: any) => (b.points - a.points) || (b.nrr - a.nrr));
    standingsCache = { data: { standings, timestamp: new Date().toISOString() }, timestamp: Date.now() };
  } catch (_) {
    // retain old cache
  } finally {
    standingsRefreshing = false;
  }
}

doRefreshStandings();
setInterval(doRefreshStandings, STANDINGS_TTL);

router.get("/ipl/standings", async (req, res) => {
  try {
    if (!standingsCache) {
      await doRefreshStandings();
    } else if (Date.now() - standingsCache.timestamp >= STANDINGS_TTL) {
      doRefreshStandings().catch(() => {});
    }
    if (standingsCache) return res.json(standingsCache.data);
    return res.json({ standings: [] });
  } catch (err: any) {
    req.log.error({ err }, "Failed to fetch standings");
    return res.status(500).json({ standings: [] });
  }
});

// GET /api/ipl/predictions → returns all picks
router.get("/ipl/predictions", (_req, res) => {
  res.json(predsCache);
});

// POST /api/ipl/predictions/:matchId → { ownerId, pick }
router.post("/ipl/predictions/:matchId", (req, res) => {
  const { matchId } = req.params;
  const { ownerId, pick } = req.body as { ownerId?: string; pick?: string | null };
  if (!matchId || !ownerId) return res.status(400).json({ error: "matchId and ownerId required" });
  if (!predsCache[matchId]) predsCache[matchId] = {};
  predsCache[matchId][ownerId] = pick ?? null;
  savePreds(predsCache);
  return res.json({ ok: true, predictions: predsCache });
});

// ── PIN rate limiter ───────────────────────────────────────────────────────────
const pinAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 60_000; // 60 s

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const rec = pinAttempts.get(ip);
  if (!rec || now > rec.resetAt) {
    pinAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (rec.count >= RATE_LIMIT_MAX) return false;
  rec.count++;
  return true;
}
// Prune stale entries every 5 min
setInterval(() => {
  const now = Date.now();
  for (const [ip, rec] of pinAttempts.entries()) {
    if (now > rec.resetAt) pinAttempts.delete(ip);
  }
}, 5 * 60_000);

function ownerOnly(req: any, res: any): boolean {
  if (req.headers["x-owner-id"] !== "rajveer") {
    res.status(403).json({ error: "Forbidden" });
    return false;
  }
  return true;
}

// GET /api/ipl/pins → returns all PINs (admin only)
router.get("/ipl/pins", (req, res) => {
  if (!ownerOnly(req, res)) return;
  res.json(pinsCache);
});

// POST /api/ipl/pins/validate → { userId, pin } — validate PIN (rate-limited)
router.post("/ipl/pins/validate", (req, res) => {
  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown");
  if (!checkRateLimit(ip)) return res.status(429).json({ error: "Too many attempts — try again in a minute" });
  const { userId, pin } = req.body as { userId?: string; pin?: string };
  if (!userId || !pin) return res.status(400).json({ error: "userId and pin required" });
  const correct = pinsCache[userId];
  if (!correct || pin !== correct) return res.status(401).json({ error: "Invalid PIN" });
  return res.json({ ok: true, userId });
});

// POST /api/ipl/pins/:userId → { pin } — update one user's PIN (admin only)
router.post("/ipl/pins/:userId", (req, res) => {
  if (!ownerOnly(req, res)) return;
  const { userId } = req.params;
  const { pin } = req.body as { pin?: string };
  if (!userId || !pin || !/^\d{4}$/.test(pin)) return res.status(400).json({ error: "userId and 4-digit pin required" });
  pinsCache[userId] = pin;
  saveServerPins(pinsCache);
  return res.json({ ok: true });
});

export default router;
