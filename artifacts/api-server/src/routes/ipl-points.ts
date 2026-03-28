import { Router, type IRouter } from "express";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const router: IRouter = Router();

const CRICAPI_KEY = process.env.CRICAPI_KEY;
const CRICAPI_BASE = "https://api.cricapi.com/v1";
const CACHE_FILE = join(process.cwd(), "ipl-points-cache.json");

interface PlayerStats {
  played: boolean;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  duck: boolean;
  wickets: number;
  dots: number;
  lbwBowled: number;
  maidens: number;
  ballsBowled: number;
  runsConceded: number;
  catches: number;
  runOuts: number;
  stumpings: number;
}

interface PointsCache {
  seriesId: string | null;
  cricapiMatchIds: Record<string, string>; // iplMatchId -> cricapiMatchId
  processedMatches: Record<string, Record<string, number>>; // iplMatchId -> {playerName: points}
  lastUpdated: string;
}

function loadCache(): PointsCache {
  if (existsSync(CACHE_FILE)) {
    try {
      return JSON.parse(readFileSync(CACHE_FILE, "utf8"));
    } catch (_) {}
  }
  return { seriesId: null, cricapiMatchIds: {}, processedMatches: {}, lastUpdated: "" };
}

function saveCache(cache: PointsCache) {
  try {
    writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  } catch (_) {}
}

// T20 Fantasy Scoring System v1.7
function calcPoints(p: PlayerStats): number {
  if (!p.played) return 0;
  let pts = 0;

  // Playing XI: +4
  pts += 4;

  // --- BATTING ---
  const r = p.runs || 0;
  const balls = p.balls || 0;

  pts += r;                        // Each run: +1
  pts += (p.fours || 0) * 4;      // Four boundary bonus: +4
  pts += (p.sixes || 0) * 8;      // Six bonus: +8
  if (p.duck) pts -= 2;           // Dismissed for 0 (duck): -2

  // Batting milestones — highest only
  if (r >= 100) pts += 16;
  else if (r >= 75) pts += 12;
  else if (r >= 50) pts += 8;
  else if (r >= 25) pts += 4;

  // Strike rate bonus — min 10 balls faced OR 20 runs
  if (balls >= 10 || r >= 20) {
    const sr = balls > 0 ? (r / balls) * 100 : 0;
    if (sr > 190) pts += 8;             // Above 190: +8
    else if (sr > 170) pts += 6;        // 170.01 - 190: +6
    else if (sr > 150) pts += 4;        // 150.01 - 170: +4
    else if (sr >= 130) pts += 2;       // 130 - 150: +2
    else if (sr >= 70 && sr <= 100) pts -= 2;   // 70 - 100: -2
    else if (sr >= 60 && sr < 70) pts -= 4;     // 60 - 70: -4
    else if (sr >= 50 && sr < 60) pts -= 6;     // 50 - 59.99: -6
  }

  // --- BOWLING ---
  const w = p.wickets || 0;

  pts += (p.dots || 0) * 2;       // Dot ball: +2
  pts += w * 30;                   // Wicket (excl. run out): +30
  pts += (p.lbwBowled || 0) * 8;  // LBW / Bowled bonus: +8
  pts += (p.maidens || 0) * 12;   // Maiden over: +12

  // Bowling milestones — highest only
  if (w >= 5) pts += 16;
  else if (w >= 4) pts += 12;
  else if (w >= 3) pts += 8;

  // Economy rate bonus — min 2 overs bowled
  const overs = (p.ballsBowled || 0) / 6;
  if (overs >= 2) {
    const eco = (p.runsConceded || 0) / overs;
    if (eco < 5) pts += 8;               // Below 5.00: +8
    else if (eco < 6) pts += 6;          // 5.00 - 5.99: +6
    else if (eco <= 7) pts += 4;         // 6.00 - 7.00: +4
    else if (eco <= 8) pts += 2;         // 7.01 - 8.00: +2
    // 8.01 - 9.99: 0 (no bonus/penalty)
    else if (eco >= 10 && eco <= 11) pts -= 2;    // 10.00 - 11.00: -2
    else if (eco > 11 && eco <= 12) pts -= 4;     // 11.01 - 12.00: -4
    else if (eco > 12) pts -= 6;                   // Above 12.00: -6
  }

  // --- FIELDING ---
  const c = p.catches || 0;
  pts += c * 8;                    // Catch: +8 each
  if (c >= 3) pts += 4;           // 3+ catches bonus: +4 (once per match)
  pts += (p.runOuts || 0) * 10;   // Run out: +10
  pts += (p.stumpings || 0) * 12; // Stumping: +12

  return pts;
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function namesMatch(a: string, b: string): boolean {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return true;
  const partsA = na.split(" ");
  const partsB = nb.split(" ");
  const lastA = partsA[partsA.length - 1];
  const lastB = partsB[partsB.length - 1];
  if (lastA === lastB && lastA.length > 3) {
    const firstA = partsA[0];
    const firstB = partsB[0];
    if (firstA[0] === firstB[0]) return true;
    if (firstA.startsWith(firstB) || firstB.startsWith(firstA)) return true;
  }
  return false;
}

function parseOversTooBalls(overs: string | number): number {
  const s = String(overs);
  const parts = s.split(".");
  const fullOvers = parseInt(parts[0]) || 0;
  const extraBalls = parseInt(parts[1]) || 0;
  return fullOvers * 6 + extraBalls;
}

function parseDismissal(dismissal: string): { caught?: string; lbwBowled?: string; stumped?: string; runOut?: string } {
  const d = (dismissal || "").toLowerCase().trim();
  if (!d || d === "not out" || d === "dnb") return {};

  const cMatch = d.match(/^c\s+(.+?)\s+b\s/);
  const lbwMatch = d.match(/^lbw\s+b\s/);
  const bMatch = d.match(/^b\s/);
  const stMatch = d.match(/^st\s+(.+?)\s+b\s/);
  const roMatch = d.match(/^run\s+out\s+\(([^/)]+)/);

  const result: any = {};

  if (cMatch) result.caught = cMatch[1].trim();
  if (lbwMatch || bMatch) result.lbwBowled = "yes";
  if (stMatch) result.stumped = stMatch[1].trim();
  if (roMatch) result.runOut = roMatch[1].trim();

  return result;
}

function processScorecard(scorecard: any[]): Record<string, PlayerStats> {
  const players: Record<string, PlayerStats> = {};

  const getPlayer = (name: string): PlayerStats => {
    const key = normalizeName(name);
    if (!players[key]) {
      players[key] = {
        played: true, runs: 0, balls: 0, fours: 0, sixes: 0, duck: false,
        wickets: 0, dots: 0, lbwBowled: 0, maidens: 0, ballsBowled: 0, runsConceded: 0,
        catches: 0, runOuts: 0, stumpings: 0,
      };
    }
    return players[key];
  };

  for (const inning of scorecard) {
    const batting: any[] = inning.batting || [];
    const bowling: any[] = inning.bowling || [];

    for (const bat of batting) {
      const name = bat?.batsman?.name || bat?.batsmanName || "";
      if (!name) continue;
      const p = getPlayer(name);
      p.runs = (p.runs || 0) + (parseInt(bat.r) || 0);
      p.balls = (p.balls || 0) + (parseInt(bat.b) || 0);
      p.fours = (p.fours || 0) + (parseInt(bat["4s"]) || 0);
      p.sixes = (p.sixes || 0) + (parseInt(bat["6s"]) || 0);

      const dismissal = bat["out/not-out"] || bat.dismissal || "";
      const isOut = !dismissal.toLowerCase().includes("not out") && dismissal !== "";
      if (isOut && parseInt(bat.r) === 0) p.duck = true;

      const parsed = parseDismissal(dismissal);
      if (parsed.lbwBowled) p.lbwBowled = 0;
      if (parsed.caught) {
        const catcher = getPlayer(parsed.caught);
        if (!dismissal.toLowerCase().includes("& b")) {
          catcher.catches = (catcher.catches || 0) + 1;
        }
      }
      if (parsed.stumped) {
        const keeper = getPlayer(parsed.stumped);
        keeper.stumpings = (keeper.stumpings || 0) + 1;
      }
      if (parsed.runOut) {
        const fielder = getPlayer(parsed.runOut);
        fielder.runOuts = (fielder.runOuts || 0) + 1;
      }
    }

    for (const bowl of bowling) {
      const name = bowl?.bowler?.name || bowl?.bowlerName || "";
      if (!name) continue;
      const p = getPlayer(name);
      const balls = parseOversTooBalls(bowl.o || 0);
      p.ballsBowled = (p.ballsBowled || 0) + balls;
      p.runsConceded = (p.runsConceded || 0) + (parseInt(bowl.r) || 0);
      p.wickets = (p.wickets || 0) + (parseInt(bowl.w) || 0);
      p.maidens = (p.maidens || 0) + (parseInt(bowl.m) || 0);
    }

    for (const bat of batting) {
      const dismissal = bat["out/not-out"] || bat.dismissal || "";
      const parsed = parseDismissal(dismissal);
      if (parsed.lbwBowled) {
        const bowlerName = (dismissal.match(/\sb\s(.+)$/) || [])[1] || "";
        if (bowlerName) {
          const bowler = getPlayer(bowlerName.trim());
          bowler.lbwBowled = (bowler.lbwBowled || 0) + 1;
        }
      }
    }
  }

  return players;
}

async function cricapiGet(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  if (!CRICAPI_KEY) throw new Error("CRICAPI_KEY not set");
  const url = new URL(`${CRICAPI_BASE}/${endpoint}`);
  url.searchParams.set("apikey", CRICAPI_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`CricAPI ${res.status}`);
  const json = await res.json();
  if (json.status === "failure") throw new Error(`CricAPI error: ${json.reason || json.message}`);
  return json.data;
}

async function findIPLSeriesId(cache: PointsCache): Promise<string | null> {
  if (cache.seriesId) return cache.seriesId;
  const results = await cricapiGet("series", { search: "Indian Premier League", offset: "0" });
  const arr: any[] = Array.isArray(results) ? results : results.data || [];
  for (const s of arr) {
    const name: string = (s.name || "").toLowerCase();
    if (name.includes("premier league") && name.includes("2026")) {
      return s.id;
    }
  }
  for (const s of arr) {
    const name: string = (s.name || "").toLowerCase();
    if (name.includes("indian premier") || name.includes("ipl")) {
      return s.id;
    }
  }
  return null;
}

async function getSeriesMatches(seriesId: string): Promise<any[]> {
  const data = await cricapiGet("series_info", { id: seriesId });
  return data?.matchList || [];
}

function teamNamesMatch(cricapiName: string, iplName: string): boolean {
  const shortCodes: Record<string, string[]> = {
    rcb: ["royal challengers", "rcb", "bengaluru"],
    srh: ["sunrisers", "srh", "hyderabad"],
    mi: ["mumbai indians", "mumbai", " mi"],
    kkr: ["kolkata", "kkr"],
    csk: ["chennai", "csk"],
    rr: ["rajasthan", "rr"],
    dc: ["delhi capitals", "delhi", " dc"],
    pbks: ["punjab", "pbks"],
    gt: ["gujarat titans", "gujarat", " gt"],
    lsg: ["lucknow", "lsg"],
  };
  const ca = cricapiName.toLowerCase();
  const ia = iplName.toLowerCase();
  for (const aliases of Object.values(shortCodes)) {
    const matchCA = aliases.some(a => ca.includes(a));
    const matchIA = aliases.some(a => ia.includes(a));
    if (matchCA && matchIA) return true;
  }
  return false;
}

async function processSingleMatch(
  cricapiMatchId: string,
  iplMatchId: string,
  cache: PointsCache,
  allPlayers: string[]
): Promise<Record<string, number>> {
  const data = await cricapiGet("match_scorecard", { id: cricapiMatchId });
  const scorecard: any[] = data?.scorecard || [];
  if (!scorecard.length) return {};

  const rawStats = processScorecard(scorecard);

  const points: Record<string, number> = {};
  for (const fantasyPlayerName of allPlayers) {
    const normalizedFantasy = normalizeName(fantasyPlayerName);
    let bestMatch: PlayerStats | null = null;

    for (const [statKey, stats] of Object.entries(rawStats)) {
      if (namesMatch(statKey, normalizedFantasy)) {
        bestMatch = stats;
        break;
      }
    }

    if (bestMatch) {
      points[fantasyPlayerName] = calcPoints(bestMatch);
    }
  }

  return points;
}

const FANTASY_PLAYER_NAMES = [
  "Rajat Patidar", "Axar Patel", "Shubman Gill", "Jos Buttler", "Yuzvendra Chahal",
  "Jacob Bethell", "Bhuvneshwar Kumar", "Shreyas Iyer", "Cameron Green", "Nicholas Pooran",
  "Phil Salt", "Krunal Pandya", "Priyansh Arya", "Vaibhav Suryavanshi", "Dhruv Jurel",
  "Mohammed Shami", "Tim David", "Deepak Chahar",
  "Abhishek Sharma", "Sai Sudharsan", "Ishan Kishan", "Tilak Varma", "Rinku Singh",
  "Jasprit Bumrah", "Sunil Narine", "Travis Head", "Riyan Parag", "Liam Livingstone",
  "Kuldeep Yadav", "Arshdeep Singh", "Rahul Tripathi", "Avesh Khan",
  "Hardik Pandya", "Sanju Samson", "Virat Kohli", "KL Rahul", "Rohit Sharma",
  "Pat Cummins", "Mitchell Starc", "Ruturaj Gaikwad", "Devon Conway", "Ravindra Jadeja",
  "MS Dhoni", "Matheesha Pathirana", "Tushar Deshpande", "Nitish Kumar Reddy",
  "Heinrich Klaasen", "T Natarajan", "Jacob Duffy"
];

let pointsUpdateInProgress = false;
let lastUpdateAttempt = 0;
const UPDATE_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes between CricAPI attempts
let pointsCache: PointsCache = loadCache();
let lastPointsCacheReload = 0;

router.get("/ipl/points", async (req, res) => {
  try {
    if (!CRICAPI_KEY) {
      return res.json({ playerPoints: {}, processedMatches: [], error: "CRICAPI_KEY not configured" });
    }

    if (Date.now() - lastPointsCacheReload > 30000) {
      pointsCache = loadCache();
      lastPointsCacheReload = Date.now();
    }

    const aggregated: Record<string, number> = {};
    for (const matchPoints of Object.values(pointsCache.processedMatches)) {
      for (const [player, pts] of Object.entries(matchPoints)) {
        aggregated[player] = (aggregated[player] || 0) + pts;
      }
    }

    if (pointsUpdateInProgress) {
      return res.json({
        playerPoints: aggregated,
        processedMatches: Object.keys(pointsCache.processedMatches),
        updating: true,
        timestamp: new Date().toISOString(),
      });
    }

    const scheduleRes = await fetch(
      "https://ipl-stats-sports-mechanic.s3.ap-south-1.amazonaws.com/ipl/feeds/284-matchschedule.js",
      { signal: AbortSignal.timeout(10000) }
    );
    if (!scheduleRes.ok) throw new Error("Failed to fetch IPL schedule");
    const scheduleText = await scheduleRes.text();
    const scheduleMatch = scheduleText.match(/^MatchSchedule\(([\s\S]*)\)\s*;?\s*$/);
    if (!scheduleMatch) throw new Error("Failed to parse IPL schedule");
    const schedule = JSON.parse(scheduleMatch[1]);
    const completedMatches = (schedule.Matchsummary || []).filter(
      (m: any) => m.MatchStatus === "Post"
    );

    const unprocessed = completedMatches.filter(
      (m: any) => !pointsCache.processedMatches[String(m.MatchID)]
    );

    if (unprocessed.length === 0) {
      return res.json({
        playerPoints: aggregated,
        processedMatches: Object.keys(pointsCache.processedMatches),
        timestamp: new Date().toISOString(),
      });
    }

    const cooldownActive = Date.now() - lastUpdateAttempt < UPDATE_COOLDOWN_MS;
    if (cooldownActive) {
      return res.json({
        playerPoints: aggregated,
        processedMatches: Object.keys(pointsCache.processedMatches),
        updating: false,
        pendingMatches: unprocessed.length,
        nextAttempt: new Date(lastUpdateAttempt + UPDATE_COOLDOWN_MS).toISOString(),
        timestamp: new Date().toISOString(),
      });
    }

    pointsUpdateInProgress = true;
    lastUpdateAttempt = Date.now();
    (async () => {
      try {
        const seriesId = await findIPLSeriesId(pointsCache);
        if (seriesId && seriesId !== pointsCache.seriesId) {
          pointsCache.seriesId = seriesId;
          saveCache(pointsCache);
        }

        if (seriesId) {
          const cricapiMatches = await getSeriesMatches(seriesId);

          for (const iplMatch of unprocessed.slice(0, 3)) {
            const iplId = String(iplMatch.MatchID);
            if (pointsCache.processedMatches[iplId]) continue;

            let cricapiId = pointsCache.cricapiMatchIds[iplId];

            if (!cricapiId) {
              const iplDate = iplMatch.GMTMatchDate || iplMatch.MatchDate || "";
              const homeTeam = iplMatch.HomeTeamName || "";
              const awayTeam = iplMatch.AwayTeamName || "";

              for (const cm of cricapiMatches) {
                const cmDate: string = (cm.date || cm.dateTimeGMT || "").split("T")[0];
                const cmName: string = cm.name || "";
                if (cmDate === iplDate || iplDate === "") {
                  const parts = cmName.split(" vs ");
                  if (parts.length === 2) {
                    const teamA = parts[0].split(",")[0].trim();
                    const teamB = parts[1].split(",")[0].trim();
                    if (
                      (teamNamesMatch(teamA, homeTeam) && teamNamesMatch(teamB, awayTeam)) ||
                      (teamNamesMatch(teamA, awayTeam) && teamNamesMatch(teamB, homeTeam))
                    ) {
                      cricapiId = cm.id;
                      pointsCache.cricapiMatchIds[iplId] = cricapiId;
                      break;
                    }
                  }
                }
              }
            }

            if (!cricapiId) continue;

            try {
              const matchPoints = await processSingleMatch(
                cricapiId, iplId, pointsCache, FANTASY_PLAYER_NAMES
              );
              if (Object.keys(matchPoints).length > 0) {
                pointsCache.processedMatches[iplId] = matchPoints;
                pointsCache.lastUpdated = new Date().toISOString();
                saveCache(pointsCache);
              }
            } catch (e: any) {
              if (e.message?.includes("hits") || e.message?.includes("limit")) break;
            }
          }
        }
      } catch (_) {}
      pointsUpdateInProgress = false;
    })();

    return res.json({
      playerPoints: aggregated,
      processedMatches: Object.keys(pointsCache.processedMatches),
      updating: unprocessed.length > 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    req.log.error({ err }, "Failed to calculate IPL points");
    res.status(500).json({ error: "Failed", playerPoints: {} });
  }
});

router.post("/ipl/points/reset", async (req, res) => {
  pointsCache = { seriesId: null, cricapiMatchIds: {}, processedMatches: {}, lastUpdated: "" };
  saveCache(pointsCache);
  res.json({ ok: true });
});

export default router;
