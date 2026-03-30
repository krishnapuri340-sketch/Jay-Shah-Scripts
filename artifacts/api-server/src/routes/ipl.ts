import { Router, type IRouter } from "express";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { fetchMatchOverview } from "./ipl-points";

// ── Shared predictions store ──────────────────────────────────────────────────
const PRED_FILE = join(process.cwd(), "ipl-predictions.json");
type PredStore = Record<string, Record<string, string | null>>;

function loadPreds(): PredStore {
  try { if (existsSync(PRED_FILE)) return JSON.parse(readFileSync(PRED_FILE, "utf8")); } catch {}
  return {};
}
function savePreds(data: PredStore) {
  try { writeFileSync(PRED_FILE, JSON.stringify(data)); } catch {}
}
let predsCache: PredStore = loadPreds();

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
const CACHE_TTL = 90 * 1000; // 90 s — cache considered stale after this
let matchesRefreshing = false;

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
    // Pre-warm scorecard overview cache for completed matches
    const completedIds = allMatches.filter((m: any) => m.matchEnded).map((m: any) => m.id);
    for (const id of completedIds) {
      fetchMatchOverview(id, true).catch(() => {});
    }
  } catch (_) {
    // silently retain old cache on error
  } finally {
    matchesRefreshing = false;
  }
}

// Warm cache on startup and keep it fresh every 90 s
doRefreshMatches();
setInterval(doRefreshMatches, CACHE_TTL);

router.get("/ipl/matches", async (req, res) => {
  try {
    if (!cache) {
      // Very first boot — wait for the initial fill
      await doRefreshMatches();
    } else if (Date.now() - cache.timestamp >= CACHE_TTL) {
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

export default router;
