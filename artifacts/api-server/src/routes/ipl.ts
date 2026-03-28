import { Router, type IRouter } from "express";

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

function transformMatch(m: any): any {
  const status = String(m?.MatchStatus || "").toLowerCase();
  const isLive = status === "live" || status === "playing" || status === "in progress" || status === "ongoing";
  const isDone = status === "post" || status === "result" || status === "completed" || status === "match over";

  const matchDate = m?.GMTMatchDate || m?.MatchDate || "";
  const matchTime = m?.GMTMatchTime ? m.GMTMatchTime.replace(" GMT", "") : (m?.MatchTime || "00:00");
  const dateTimeGMT = matchDate ? `${matchDate}T${matchTime}:00Z` : "";

  const homeCode = m?.FirstBattingTeamCode || m?.HomeTeamCode || "";
  const awayCode = m?.SecondBattingTeamCode || m?.AwayTeamCode || "";

  const scoreEntries: any[] = [];
  if (m?.FirstBattingSummary) {
    scoreEntries.push({ inning: `${homeCode || m?.FirstBattingTeamName} Innings`, summary: m.FirstBattingSummary });
  }
  if (m?.SecondBattingSummary) {
    scoreEntries.push({ inning: `${awayCode || m?.SecondBattingTeamName} Innings`, summary: m.SecondBattingSummary });
  }

  return {
    id: String(m?.MatchID || m?.MatchId || Math.random()),
    name: m?.MatchName || `${m?.HomeTeamName} vs ${m?.AwayTeamName}`,
    teamInfo: [
      {
        shortname: homeCode || m?.FirstBattingTeamName,
        name: m?.HomeTeamName || m?.FirstBattingTeamName || "",
        img: m?.HomeTeamLogo || m?.MatchHomeTeamLogo || "",
      },
      {
        shortname: awayCode || m?.SecondBattingTeamName,
        name: m?.AwayTeamName || m?.SecondBattingTeamName || "",
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
const CACHE_TTL = 2 * 60 * 1000;
let standingsCache: { data: any; timestamp: number } | null = null;

router.get("/ipl/matches", async (req, res) => {
  try {
    if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
      res.json(cache.data);
      return;
    }

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
      const aTime = a.dateTimeGMT ? new Date(a.dateTimeGMT).getTime() : 0;
      const bTime = b.dateTimeGMT ? new Date(b.dateTimeGMT).getTime() : 0;
      return aTime - bTime;
    });

    const response = {
      matches: allMatches,
      sources: {
        iplOfficial: scheduleData.matches.length,
        liveCount: liveData.length,
        competitionId: IPL_COMPETITION_ID,
      },
      timestamp: new Date().toISOString(),
    };

    cache = { data: response, timestamp: Date.now() };
    res.json(response);
  } catch (err: any) {
    req.log.error({ err }, "Failed to fetch IPL matches");
    res.status(500).json({ error: "Failed to fetch match data", matches: [] });
  }
});

router.get("/ipl/standings", async (req, res) => {
  try {
    if (standingsCache && Date.now() - standingsCache.timestamp < CACHE_TTL) {
      return res.json(standingsCache.data);
    }
    const url = `${IPL_S3_BASE}/stats/${IPL_COMPETITION_ID}-groupstandings.js`;
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(10000) });
    if (!r.ok) return res.json({ standings: [] });
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
    const response = { standings, timestamp: new Date().toISOString() };
    standingsCache = { data: response, timestamp: Date.now() };
    res.json(response);
  } catch (err: any) {
    req.log.error({ err }, "Failed to fetch standings");
    res.status(500).json({ standings: [] });
  }
});

export default router;
