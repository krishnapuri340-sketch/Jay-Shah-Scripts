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

interface BattingRow {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  sr: string;
  dismissal: string;
  notOut: boolean;
  dnb: boolean;
}

interface BowlingRow {
  name: string;
  overs: string;
  maidens: number;
  runs: number;
  wickets: number;
  eco: string;
  wides: number;
  noBalls: number;
}

interface InningData {
  name: string;
  total: string;
  batting: BattingRow[];
  bowling: BowlingRow[];
}

interface ProcessedMatchData {
  points: Record<string, number>;
  innings: InningData[];
  playerStats?: Record<string, PlayerStats>;
}

const DAILY_CALL_LIMIT = 1900; // hard cap below CricAPI's 2000/day paid tier

// ── AuctionRoom / Supabase integration ─────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL ?? "https://ldwqrdlipzqsnpljqyhk.supabase.co/rest/v1";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const IPL_TOURNAMENT_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

async function supabaseGet(table: string, params: Record<string, string> = {}): Promise<any[]> {
  if (!SUPABASE_ANON_KEY) throw new Error("SUPABASE_ANON_KEY not set");
  const url = new URL(`${SUPABASE_URL}/${table}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Supabase /${table}: HTTP ${res.status}`);
  return (res.json() as Promise<any[]>);
}

interface SupabaseFixtureScore {
  points: Record<string, number>;
  matchLabel: string;
  matchDate: string;
  matchNumber: number;
  linkedIplId?: string; // IPL S3 match ID matched by date+teams
}

interface PointsCache {
  seriesId: string | null;
  cricapiMatchIds: Record<string, string>;
  processedMatches: Record<string, ProcessedMatchData>; // CricAPI: points (live/fallback) + innings
  supabaseScores: Record<string, SupabaseFixtureScore>; // fixtureId → official scores (override)
  playerIdMap: Record<string, string>; // supabase player_id → player name
  matchMetadata: Record<string, { matchDate: string; teamA: string; teamB: string }>; // iplId → meta
  lastUpdated: string;
  dailyHits: { date: string; count: number };
}

function utcDateString(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD" in UTC
}

function loadCache(): PointsCache {
  const empty: PointsCache = {
    seriesId: null, cricapiMatchIds: {}, processedMatches: {},
    supabaseScores: {}, playerIdMap: {}, matchMetadata: {},
    lastUpdated: "", dailyHits: { date: utcDateString(), count: 0 },
  };
  if (existsSync(CACHE_FILE)) {
    try {
      const raw = JSON.parse(readFileSync(CACHE_FILE, "utf8"));
      const processedMatches: Record<string, ProcessedMatchData> = {};
      for (const [k, v] of Object.entries(raw.processedMatches || {})) {
        if (v && typeof v === "object" && "innings" in (v as any)) {
          processedMatches[k] = v as ProcessedMatchData;
        } else {
          processedMatches[k] = { points: {}, innings: [] };
        }
      }
      const dailyHits = raw.dailyHits && raw.dailyHits.date === utcDateString()
        ? raw.dailyHits
        : { date: utcDateString(), count: 0 };
      return { ...empty, ...raw, processedMatches, dailyHits };
    } catch (_) {}
  }
  return empty;
}

function saveCache(cache: PointsCache) {
  try { writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2)); } catch (_) {}
}

// T20 Fantasy Scoring System v1.7
function calcPoints(p: PlayerStats): number {
  if (!p.played) return 0;
  let pts = 0;

  pts += 4; // Playing XI

  const r = p.runs || 0;
  const balls = p.balls || 0;

  pts += r;
  pts += (p.fours || 0) * 4;
  pts += (p.sixes || 0) * 6;
  if (p.duck) pts -= 2;

  if (r >= 100) pts += 16;
  else if (r >= 75) pts += 12;
  else if (r >= 50) pts += 8;
  else if (r >= 25) pts += 4;

  if (balls >= 10 || r >= 20) {
    const sr = balls > 0 ? (r / balls) * 100 : 0;
    if (sr > 190) pts += 8;
    else if (sr > 170) pts += 6;
    else if (sr > 150) pts += 4;
    else if (sr >= 130) pts += 2;
    else if (sr >= 70 && sr <= 100) pts -= 2;
    else if (sr >= 60 && sr < 70) pts -= 4;
    else if (sr >= 50 && sr < 60) pts -= 6;
  }

  const w = p.wickets || 0;
  pts += (p.dots || 0) * 2;
  pts += w * 30;
  pts += (p.lbwBowled || 0) * 8;
  pts += (p.maidens || 0) * 12;

  if (w >= 5) pts += 16;
  else if (w >= 4) pts += 12;
  else if (w >= 3) pts += 8;

  const overs = (p.ballsBowled || 0) / 6;
  if (overs >= 2) {
    const eco = (p.runsConceded || 0) / overs;
    if (eco < 5) pts += 8;
    else if (eco < 6) pts += 6;
    else if (eco <= 7) pts += 4;
    else if (eco <= 8) pts += 2;
    else if (eco >= 10 && eco <= 11) pts -= 2;
    else if (eco > 11 && eco <= 12) pts -= 4;
    else if (eco > 12) pts -= 6;
  }

  const c = p.catches || 0;
  pts += c * 8;
  if (c >= 3) pts += 4;
  pts += (p.runOuts || 0) * 10;
  pts += (p.stumpings || 0) * 12;

  return pts;
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z ]/g, "").replace(/\s+/g, " ").trim();
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
    // Require at least 4 characters of first name to match (prevents "Abhinandan" matching "Arshdeep")
    const minLen = Math.min(firstA.length, firstB.length, 4);
    if (minLen >= 4 && firstA.slice(0, minLen) === firstB.slice(0, minLen)) return true;
    if (firstA.startsWith(firstB) || firstB.startsWith(firstA)) return true;
  }
  return false;
}

function parseOversTooBalls(overs: string | number): number {
  const s = String(overs);
  const parts = s.split(".");
  return (parseInt(parts[0]) || 0) * 6 + (parseInt(parts[1]) || 0);
}

function parseDismissal(dismissal: string): { caught?: string; lbwBowled?: boolean; stumped?: string; runOut?: string } {
  const d = (dismissal || "").toLowerCase().trim();
  if (!d || d === "not out" || d === "dnb") return {};
  const result: any = {};
  const cMatch = d.match(/^c\s+(.+?)\s+b\s/);
  if (cMatch) result.caught = cMatch[1].trim();
  if (/^lbw\s+b\s/.test(d) || /^b\s/.test(d)) result.lbwBowled = true;
  const stMatch = d.match(/^st\s+(.+?)\s+b\s/);
  if (stMatch) result.stumped = stMatch[1].trim();
  const roMatch = d.match(/^run\s+out\s+\(([^/)]+)/);
  if (roMatch) result.runOut = roMatch[1].trim();
  return result;
}

function processScorecard(scorecard: any[]): { players: Record<string, PlayerStats>; innings: InningData[] } {
  const players: Record<string, PlayerStats> = {};
  const innings: InningData[] = [];

  const getPlayer = (name: string): PlayerStats => {
    const key = normalizeName(name);
    if (!players[key]) {
      players[key] = { played: true, runs: 0, balls: 0, fours: 0, sixes: 0, duck: false, wickets: 0, dots: 0, lbwBowled: 0, maidens: 0, ballsBowled: 0, runsConceded: 0, catches: 0, runOuts: 0, stumpings: 0 };
    }
    return players[key];
  };

  for (const inning of scorecard) {
    const batting: any[] = inning.batting || [];
    const bowling: any[] = inning.bowling || [];
    const inningName: string = inning.inning || "";

    const battingRows: BattingRow[] = [];
    const bowlingRows: BowlingRow[] = [];

    // Calculate inning total for display
    let inningRuns = 0;
    let inningWickets = 0;
    let inningOvers = "";

    for (const bat of batting) {
      const name = bat?.batsman?.name || bat?.batsmanName || "";
      if (!name) continue;
      const dismissal = bat["out/not-out"] || bat.dismissal || "";
      const isDnb = dismissal.toLowerCase() === "dnb" || dismissal.toLowerCase() === "did not bat";
      const notOut = !isDnb && (dismissal.toLowerCase().includes("not out") || dismissal === "");

      const runs = parseInt(bat.r) || 0;
      const balls = parseInt(bat.b) || 0;
      const fours = parseInt(bat["4s"]) || 0;
      const sixes = parseInt(bat["6s"]) || 0;
      const srVal = bat.sr || (balls > 0 ? ((runs / balls) * 100).toFixed(2) : "0.00");

      battingRows.push({ name, runs, balls, fours, sixes, sr: String(srVal), dismissal: isDnb ? "DNB" : (notOut ? "not out" : dismissal), notOut, dnb: isDnb });

      if (!isDnb) {
        const p = getPlayer(name);
        p.runs = (p.runs || 0) + runs;
        p.balls = (p.balls || 0) + balls;
        p.fours = (p.fours || 0) + fours;
        p.sixes = (p.sixes || 0) + sixes;
        const isOut = !notOut;
        if (isOut && runs === 0) p.duck = true;

        if (isOut) inningWickets++;
        inningRuns += runs;

        const parsed = parseDismissal(dismissal);
        if (parsed.caught) {
          const catcher = getPlayer(parsed.caught);
          if (!dismissal.toLowerCase().includes("& b")) catcher.catches = (catcher.catches || 0) + 1;
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
    }

    for (const bowl of bowling) {
      const name = bowl?.bowler?.name || bowl?.bowlerName || "";
      if (!name) continue;
      const balls = parseOversTooBalls(bowl.o || 0);
      const runsC = parseInt(bowl.r) || 0;
      const wickets = parseInt(bowl.w) || 0;
      const maidens = parseInt(bowl.m) || 0;
      const wides = parseInt(bowl.wd) || 0;
      const noBalls = parseInt(bowl.nb) || 0;
      const dots = parseInt(bowl.dots || bowl.d || bowl.D || "0") || 0;
      const eco = bowl.eco || (balls > 0 ? ((runsC / (balls / 6))).toFixed(2) : "0.00");

      bowlingRows.push({ name, overs: String(bowl.o || "0"), maidens, runs: runsC, wickets, eco: String(eco), wides, noBalls });

      const p = getPlayer(name);
      p.ballsBowled = (p.ballsBowled || 0) + balls;
      p.runsConceded = (p.runsConceded || 0) + runsC;
      p.wickets = (p.wickets || 0) + wickets;
      p.maidens = (p.maidens || 0) + maidens;
      p.dots = (p.dots || 0) + dots;
      if (!inningOvers && bowl.o) inningOvers = String(bowl.o);
    }

    // LBW/bowled bonus: parse bowler name from dismissal text
    for (const bat of batting) {
      const dismissal = bat["out/not-out"] || bat.dismissal || "";
      const parsed = parseDismissal(dismissal);
      if (parsed.lbwBowled) {
        const bowlerMatch = dismissal.match(/\sb\s(.+)$/);
        if (bowlerMatch) {
          const bowlerName = bowlerMatch[1].trim();
          const p = getPlayer(bowlerName);
          p.lbwBowled = (p.lbwBowled || 0) + 1;
        }
      }
    }

    // Sum extras if available
    const extras = inning.extras?.total || inning.extra?.total || 0;
    inningRuns += parseInt(String(extras)) || 0;
    const totalOvers = bowlingRows.reduce((acc, b) => {
      const parts = b.overs.split(".");
      return acc + (parseInt(parts[0]) || 0) + (parseInt(parts[1]) || 0) / 10;
    }, 0);
    const overStr = totalOvers > 0 ? totalOvers.toFixed(1) : inningOvers;
    innings.push({ name: inningName, total: `${inningRuns}/${inningWickets}${overStr ? ` (${overStr} ov)` : ""}`, batting: battingRows, bowling: bowlingRows });
  }

  return { players, innings };
}

async function cricapiGet(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  if (!CRICAPI_KEY) throw new Error("CRICAPI_KEY not set");

  // Reload cache to pick up persisted counter in case of a restart mid-day
  const today = utcDateString();
  if (pointsCache.dailyHits.date !== today) {
    pointsCache.dailyHits = { date: today, count: 0 };
  }
  if (pointsCache.dailyHits.count >= DAILY_CALL_LIMIT) {
    throw new Error(`CricAPI daily limit reached (${pointsCache.dailyHits.count}/${DAILY_CALL_LIMIT} calls used). Resets at midnight UTC.`);
  }

  const url = new URL(`${CRICAPI_BASE}/${endpoint}`);
  url.searchParams.set("apikey", CRICAPI_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`CricAPI ${res.status}`);
  const json = await res.json() as any;
  if (json.status === "failure") throw new Error(`CricAPI error: ${json.reason || json.message}`);

  // Increment and persist counter after every successful call
  pointsCache.dailyHits = { date: today, count: pointsCache.dailyHits.count + 1 };
  saveCache(pointsCache);

  return json.data;
}

async function findIPLSeriesId(cache: PointsCache): Promise<string | null> {
  if (cache.seriesId) return cache.seriesId;
  const results = await cricapiGet("series", { search: "Indian Premier League", offset: "0" });
  const arr: any[] = Array.isArray(results) ? results : [];
  for (const s of arr) {
    const name = (s.name || "").toLowerCase();
    if (name.includes("premier league") && name.includes("2026")) return s.id;
  }
  for (const s of arr) {
    const name = (s.name || "").toLowerCase();
    if (name.includes("indian premier") || name.includes("ipl")) return s.id;
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
  const ia = iplName.toLowerCase().trim();
  for (const aliases of Object.values(shortCodes)) {
    const sideA = aliases.some(a => ca.includes(a.trim()));
    const sideB = aliases.some(a => ia.includes(a.trim())) || aliases.some(a => a.trim() === ia);
    if (sideA && sideB) return true;
  }
  return false;
}

async function processSingleMatch(
  cricapiMatchId: string,
  allPlayers: string[],
  homeTeam: string,
  awayTeam: string
): Promise<ProcessedMatchData> {
  const data = await cricapiGet("match_scorecard", { id: cricapiMatchId });
  const scorecard: any[] = data?.scorecard || [];
  if (!scorecard.length) return { points: {}, innings: [] };

  const { players: rawStats, innings } = processScorecard(scorecard);
  const points: Record<string, number> = {};
  const playerStats: Record<string, PlayerStats> = {};

  for (const fantasyPlayerName of allPlayers) {
    // Team guard: skip players whose IPL team isn't playing in this match
    const teamCode = PLAYER_TEAMS[fantasyPlayerName];
    if (teamCode) {
      const inMatch = teamNamesMatch(homeTeam, teamCode) || teamNamesMatch(awayTeam, teamCode);
      if (!inMatch) continue;
    }

    const normalizedFantasy = normalizeName(fantasyPlayerName);
    for (const [statKey, stats] of Object.entries(rawStats)) {
      if (namesMatch(statKey, normalizedFantasy)) {
        points[fantasyPlayerName] = calcPoints(stats);
        playerStats[fantasyPlayerName] = stats;
        break;
      }
    }
  }

  return { points, innings, playerStats };
}

// Derived from App.tsx FANTASY_TEAMS — all 4 fantasy team rosters combined
const FANTASY_PLAYER_NAMES = [
  // Rajveer Puri
  "Rajat Patidar", "Axar Patel", "Shubman Gill", "Jos Buttler", "Yuzvendra Chahal",
  "Jacob Bethell", "Bhuvneshwar Kumar", "Shreyas Iyer", "Cameron Green", "Nicholas Pooran",
  "Phil Salt", "Krunal Pandya", "Priyansh Arya", "Vaibhav Suryavanshi", "Dhruv Jurel",
  "Mohammed Shami", "Tim David", "Deepak Chahar",
  // Mombasa K
  "Jitesh Sharma", "Varun Chakravarthy", "Marco Jansen", "Arshdeep Singh", "Shivam Dube",
  "Riyan Parag", "Abhishek Sharma", "Prabhsimran Singh", "Nehal Wadhera", "Shimron Hetmyer",
  "Sai Sudharsan", "Will Jacks", "Prasidh Krishna", "Aiden Markram", "Rashid Khan",
  "Ajinkya Rahane", "Trent Boult", "Tilak Varma",
  // Mumbai Ma
  "Rishabh Pant", "Dewald Brevis", "Rohit Sharma", "Sherfane Rutherford", "Rinku Singh",
  "Heinrich Klaasen", "Nitish Rana", "Ruturaj Gaikwad", "Lungi Ngidi", "Mohammed Siraj",
  "Harshal Patel", "Tristan Stubbs", "Sanju Samson", "Prashant Veer", "Ishan Kishan",
  "Hardik Pandya", "Finn Allen", "Venkatesh Iyer",
  // PonyGoat
  "Marcus Stoinis", "Yashasvi Jaiswal", "Tim Seifert", "Virat Kohli", "Shashank Singh",
  "Sunil Narine", "Suryakumar Yadav", "Jasprit Bumrah", "Ravindra Jadeja", "Travis Head",
  "KL Rahul", "Ryan Rickelton", "Mitchell Marsh", "Khaleel Ahmed", "Kuldeep Yadav",
  "Washington Sundar", "T Natarajan",
];

// IPL 2026 team assignments — used to skip fantasy players whose team isn't in a given match
const PLAYER_TEAMS: Record<string, string> = {
  // RCB
  "Rajat Patidar": "rcb", "Phil Salt": "rcb", "Tim David": "rcb",
  "Bhuvneshwar Kumar": "rcb", "Krunal Pandya": "rcb", "Jacob Bethell": "rcb",
  "Jitesh Sharma": "rcb", "Venkatesh Iyer": "rcb", "Virat Kohli": "rcb",
  // GT
  "Shubman Gill": "gt", "Jos Buttler": "gt", "Sai Sudharsan": "gt",
  "Mohammed Siraj": "gt", "Prasidh Krishna": "gt", "Rashid Khan": "gt",
  "Washington Sundar": "gt",
  // RR
  "Yuzvendra Chahal": "rr", "Vaibhav Suryavanshi": "rr", "Dhruv Jurel": "rr",
  "Riyan Parag": "rr", "Shimron Hetmyer": "rr", "Yashasvi Jaiswal": "rr",
  "Ravindra Jadeja": "rr",
  // PBKS
  "Shreyas Iyer": "pbks", "Arshdeep Singh": "pbks", "Priyansh Arya": "pbks",
  "Marco Jansen": "pbks", "Prabhsimran Singh": "pbks", "Nehal Wadhera": "pbks",
  "Marcus Stoinis": "pbks", "Shashank Singh": "pbks",
  // MI
  "Rohit Sharma": "mi", "Jasprit Bumrah": "mi", "Hardik Pandya": "mi",
  "Sherfane Rutherford": "mi", "Will Jacks": "mi", "Trent Boult": "mi",
  "Tilak Varma": "mi", "Suryakumar Yadav": "mi", "Ryan Rickelton": "mi",
  "Deepak Chahar": "mi",
  // SRH
  "Travis Head": "srh", "Abhishek Sharma": "srh", "Ishan Kishan": "srh",
  "Heinrich Klaasen": "srh", "Harshal Patel": "srh", "T Natarajan": "srh",
  // CSK
  "Sanju Samson": "csk", "Ruturaj Gaikwad": "csk", "Shivam Dube": "csk",
  "Dewald Brevis": "csk", "Prashant Veer": "csk", "Khaleel Ahmed": "csk",
  // DC
  "Axar Patel": "dc", "KL Rahul": "dc", "Kuldeep Yadav": "dc",
  "Nitish Rana": "dc", "Lungi Ngidi": "dc", "Tristan Stubbs": "dc",
  // KKR
  "Sunil Narine": "kkr", "Rinku Singh": "kkr", "Cameron Green": "kkr",
  "Varun Chakravarthy": "kkr", "Ajinkya Rahane": "kkr", "Finn Allen": "kkr",
  "Tim Seifert": "kkr",
  // LSG
  "Nicholas Pooran": "lsg", "Mohammed Shami": "lsg", "Aiden Markram": "lsg",
  "Rishabh Pant": "lsg", "Mitchell Marsh": "lsg",
};

let pointsUpdateInProgress = false;
let lastUpdateAttempt = 0;
const UPDATE_COOLDOWN_MS = 16 * 60 * 1000; // 16 min — respects CricAPI 15-min block window
let pointsCache: PointsCache = loadCache();
let lastPointsCacheReload = 0;

// ── Supabase fetch helpers ───────────────────────────────────────────────────

async function ensurePlayerIdMap(cache: PointsCache): Promise<void> {
  if (Object.keys(cache.playerIdMap).length > 0) return;
  console.log("[supabase] Building IPL 2026 player ID → name map …");
  const tpRows = await supabaseGet("tournament_players", {
    tournament_id: `eq.${IPL_TOURNAMENT_ID}`,
    select: "player_id",
    limit: "500",
  });
  if (!tpRows.length) return;
  const ids: string[] = tpRows.map((r: any) => r.player_id);
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const players = await supabaseGet("players", {
      id: `in.(${chunk.join(",")})`,
      select: "id,name",
    });
    for (const p of players) cache.playerIdMap[p.id] = p.name;
  }
  console.log(`[supabase] Player map ready: ${Object.keys(cache.playerIdMap).length} players`);
}

async function syncAuctionRoomScores(cache: PointsCache): Promise<boolean> {
  let changed = false;
  await ensurePlayerIdMap(cache);
  if (!Object.keys(cache.playerIdMap).length) return false;

  // Get all fixture IDs that have scores in Supabase
  const allScoreRows = await supabaseGet("player_fixture_scores", {
    tournament_id: `eq.${IPL_TOURNAMENT_ID}`,
    select: "fixture_id",
    limit: "1000",
  });
  const fixtureIds = [...new Set<string>(allScoreRows.map((r: any) => r.fixture_id))];
  if (!fixtureIds.length) return false;

  // Fetch fixture metadata for any new fixture IDs
  const newFixtureIds = fixtureIds.filter(id => !cache.supabaseScores[id]);
  if (!newFixtureIds.length) return false;

  const fixtureRows = await supabaseGet("tournament_fixtures", {
    id: `in.(${newFixtureIds.join(",")})`,
    select: "id,team_a,team_b,match_date,match_number",
    limit: "100",
  });
  const fixtureMap: Record<string, any> = {};
  for (const f of fixtureRows) fixtureMap[f.id] = f;

  for (const fixtureId of newFixtureIds) {
    const meta = fixtureMap[fixtureId];
    const scoreRows = await supabaseGet("player_fixture_scores", {
      tournament_id: `eq.${IPL_TOURNAMENT_ID}`,
      fixture_id: `eq.${fixtureId}`,
      select: "player_id,score",
      limit: "500",
    });
    const points: Record<string, number> = {};
    for (const { player_id, score } of scoreRows) {
      const playerName = cache.playerIdMap[player_id];
      if (!playerName) continue;
      const normName = normalizeName(playerName);
      for (const fp of FANTASY_PLAYER_NAMES) {
        if (namesMatch(normName, normalizeName(fp))) {
          points[fp] = score;
          break;
        }
      }
    }
    const matchLabel = meta
      ? `${meta.team_a} vs ${meta.team_b}`
      : `Match ${fixtureId.slice(0, 8)}`;
    cache.supabaseScores[fixtureId] = {
      points,
      matchLabel,
      matchDate: meta?.match_date ?? "",
      matchNumber: meta?.match_number ?? 0,
    };
    console.log(`[supabase] Fixture ${matchLabel}: mapped ${Object.keys(points).length} fantasy players`);
    changed = true;
  }
  return changed;
}

router.get("/ipl/points", async (req, res) => {
  try {
    if (Date.now() - lastPointsCacheReload > 30000) {
      pointsCache = loadCache();
      lastPointsCacheReload = Date.now();
    }

    // ── Hybrid aggregation: Supabase (official) + CricAPI (live/fallback) ──
    const supabaseLinkedIds = new Set(
      Object.values(pointsCache.supabaseScores || {}).map(f => f.linkedIplId).filter(Boolean) as string[]
    );
    const aggregated: Record<string, number> = {};
    // playerMatchPoints: player → [ { matchNum, label, pts, source, stats? } ]
    const playerMatchPoints: Record<string, Array<{ matchNum: number; label: string; pts: number; source: "official" | "live"; stats?: PlayerStats }>> = {};

    const addMatchPoint = (player: string, matchNum: number, label: string, pts: number, source: "official" | "live", stats?: PlayerStats) => {
      aggregated[player] = (aggregated[player] || 0) + pts;
      if (!playerMatchPoints[player]) playerMatchPoints[player] = [];
      playerMatchPoints[player].push({ matchNum, label, pts, source, stats });
    };

    // 1. Official Supabase scores for completed matches
    for (const fixtureData of Object.values(pointsCache.supabaseScores || {})
        .sort((a, b) => a.matchNumber - b.matchNumber)) {
      // Look up playerStats from the linked CricAPI match if available
      const linkedIplId = fixtureData.linkedIplId;
      const linkedMatchData = linkedIplId ? (pointsCache.processedMatches || {})[linkedIplId] : null;
      for (const [player, pts] of Object.entries(fixtureData.points || {})) {
        const stats = linkedMatchData?.playerStats?.[player];
        addMatchPoint(player, fixtureData.matchNumber, fixtureData.matchLabel, pts, "official", stats);
      }
    }

    // 2. CricAPI points for live/recent matches NOT yet covered by Supabase
    const cricapiLiveLabels: string[] = [];
    let liveMatchNum = 900; // high number so live matches sort after official ones
    for (const [iplId, matchData] of Object.entries(pointsCache.processedMatches || {})) {
      if (supabaseLinkedIds.has(iplId)) continue;
      const meta = (pointsCache.matchMetadata || {})[iplId];
      const label = meta ? `${meta.teamA} vs ${meta.teamB}` : `Match ${iplId}`;
      for (const [player, pts] of Object.entries(matchData.points || {})) {
        const stats = (matchData.playerStats || {})[player];
        addMatchPoint(player, liveMatchNum, label, pts, "live", stats);
      }
      if (Object.keys(matchData.points || {}).length > 0) {
        cricapiLiveLabels.push(`${label} ★live`);
        liveMatchNum++;
      }
    }

    // Sort each player's match breakdown chronologically
    for (const entries of Object.values(playerMatchPoints)) {
      entries.sort((a, b) => a.matchNum - b.matchNum);
    }

    const supabaseMatchLabels = [
      ...Object.values(pointsCache.supabaseScores || {})
        .sort((a, b) => a.matchNumber - b.matchNumber)
        .map(f => f.matchLabel),
      ...cricapiLiveLabels,
    ];

    const dailyHitsInfo = { count: pointsCache.dailyHits.count, limit: DAILY_CALL_LIMIT, date: pointsCache.dailyHits.date };

    if (pointsUpdateInProgress) {
      return res.json({
        playerPoints: aggregated, playerMatchPoints, processedMatches: supabaseMatchLabels,
        updating: true, timestamp: new Date().toISOString(), dailyHits: dailyHitsInfo,
      });
    }

    // Run Supabase sync + CricAPI innings fetch in background
    if (Date.now() - lastUpdateAttempt >= UPDATE_COOLDOWN_MS) {
      pointsUpdateInProgress = true;
      lastUpdateAttempt = Date.now();
      (async () => {
        try {
          // Step 1: Sync AuctionRoom scores from Supabase
          const changed = await syncAuctionRoomScores(pointsCache);
          if (changed) { pointsCache.lastUpdated = new Date().toISOString(); saveCache(pointsCache); }

          // Step 2: Fetch schedule → populate metadata, link Supabase, run CricAPI for live/fallback
          const scheduleRes = await fetch(
            "https://ipl-stats-sports-mechanic.s3.ap-south-1.amazonaws.com/ipl/feeds/284-matchschedule.js",
            { signal: AbortSignal.timeout(10000) }
          );
          if (scheduleRes.ok) {
            const scheduleText = await scheduleRes.text();
            const scheduleMatch = scheduleText.match(/^[A-Za-z_$][A-Za-z0-9_$]*\(([\s\S]*)\)\s*;?\s*$/);
            if (scheduleMatch) {
              const schedule = JSON.parse(scheduleMatch[1]);
              const allMatches: any[] = schedule.Matchsummary || [];

              // 2a. Populate matchMetadata for all matches (needed for linking + live labels)
              if (!pointsCache.matchMetadata) pointsCache.matchMetadata = {};
              for (const m of allMatches) {
                const iplId = String(m.MatchID);
                if (!pointsCache.matchMetadata[iplId]) {
                  pointsCache.matchMetadata[iplId] = {
                    matchDate: m.GMTMatchDate || m.MatchDate || "",
                    teamA: m.HomeTeamName || "",
                    teamB: m.AwayTeamName || "",
                  };
                }
              }

              // 2b. Link Supabase fixtures → iplIds (by date + team name matching)
              for (const [fid, fixture] of Object.entries(pointsCache.supabaseScores)) {
                if (fixture.linkedIplId) continue;
                const parts = fixture.matchLabel.split(" vs ");
                const sTeamA = parts[0]?.trim() || "";
                const sTeamB = parts[1]?.trim() || "";
                for (const [iplId, meta] of Object.entries(pointsCache.matchMetadata)) {
                  if (meta.matchDate !== fixture.matchDate) continue;
                  const okAA = teamNamesMatch(sTeamA, meta.teamA);
                  const okAB = teamNamesMatch(sTeamA, meta.teamB);
                  const okBA = teamNamesMatch(sTeamB, meta.teamA);
                  const okBB = teamNamesMatch(sTeamB, meta.teamB);
                  if ((okAA || okAB) && (okBA || okBB)) {
                    fixture.linkedIplId = iplId;
                    console.log(`[supabase] Linked "${fixture.matchLabel}" → iplId ${iplId}`);
                    break;
                  }
                }
              }

              // 2c. Determine which matches need CricAPI (live + recently completed without Supabase)
              if (CRICAPI_KEY && pointsCache.dailyHits.count < DAILY_CALL_LIMIT) {
                const supabaseLinkedNow = new Set(
                  Object.values(pointsCache.supabaseScores).map(f => f.linkedIplId).filter(Boolean) as string[]
                );
                const liveMatches = allMatches.filter((m: any) => m.MatchStatus === "Live");
                const fallbackMatches = allMatches.filter((m: any) => {
                  if (m.MatchStatus !== "Post") return false;
                  const iplId = String(m.MatchID);
                  const cached = pointsCache.processedMatches[iplId];
                  // Always fetch innings for stats/scorecard display, even if Supabase has points
                  return !cached || !cached.innings?.length;
                });
                const needsCricapi = [...liveMatches, ...fallbackMatches].slice(0, 3);

                if (needsCricapi.length > 0) {
                  const seriesId = await findIPLSeriesId(pointsCache);
                  if (seriesId) {
                    if (seriesId !== pointsCache.seriesId) { pointsCache.seriesId = seriesId; }
                    const cricapiMatches = await getSeriesMatches(seriesId);
                    for (const iplMatch of needsCricapi) {
                      const iplId = String(iplMatch.MatchID);
                      let cricapiId = pointsCache.cricapiMatchIds[iplId];
                      if (!cricapiId) {
                        const iplDate = iplMatch.GMTMatchDate || iplMatch.MatchDate || "";
                        const homeTeam = iplMatch.HomeTeamName || "";
                        const awayTeam = iplMatch.AwayTeamName || "";
                        for (const cm of cricapiMatches) {
                          const cmDate: string = (cm.date || cm.dateTimeGMT || "").split("T")[0];
                          const cmName: string = cm.name || "";
                          const parts = cmName.split(" vs ");
                          if (parts.length === 2 && (cmDate === iplDate || !iplDate)) {
                            const teamA = parts[0].split(",")[0].trim();
                            const teamB = parts[1].split(",")[0].trim();
                            if ((teamNamesMatch(teamA, homeTeam) && teamNamesMatch(teamB, awayTeam)) ||
                              (teamNamesMatch(teamA, awayTeam) && teamNamesMatch(teamB, homeTeam))) {
                              cricapiId = cm.id;
                              pointsCache.cricapiMatchIds[iplId] = cricapiId;
                              break;
                            }
                          }
                        }
                      }
                      if (!cricapiId) continue;
                      try {
                        const isLive = iplMatch.MatchStatus === "Live";
                        const matchData = await processSingleMatch(
                          cricapiId, FANTASY_PLAYER_NAMES,
                          iplMatch.HomeTeamName || "", iplMatch.AwayTeamName || ""
                        );
                        if (matchData.innings.length > 0 || Object.keys(matchData.points).length > 0) {
                          const isSupabaseCovered = supabaseLinkedNow.has(iplId);
                          // For Supabase-covered matches: store innings for stats/scorecard only (points come from Supabase)
                          // For live/fallback matches: store full data including CricAPI points
                          pointsCache.processedMatches[iplId] = isSupabaseCovered
                            ? { points: {}, innings: matchData.innings, playerStats: matchData.playerStats }
                            : matchData;
                          const tag = isLive ? "Live" : isSupabaseCovered ? "Innings-only" : "Fallback";
                          console.log(`[cricapi] ${tag} match ${iplId}: ${matchData.innings.length} innings, ${Object.keys(matchData.points).length} pts`);
                          saveCache(pointsCache);
                        }
                      } catch (e: any) {
                        console.error(`Failed CricAPI fetch for match ${iplId}:`, e?.message);
                      }
                    }
                  }
                }
              }

              // Save after metadata + linking updates
              saveCache(pointsCache);
            }
          }
        } catch (e: any) {
          console.error("[ipl-points] Background job error:", e?.message || e);
        }
        pointsUpdateInProgress = false;
      })();
    }

    return res.json({
      playerPoints: aggregated, playerMatchPoints, processedMatches: supabaseMatchLabels,
      updating: pointsUpdateInProgress, timestamp: new Date().toISOString(), dailyHits: dailyHitsInfo,
    });
  } catch (err: any) {
    req.log.error({ err }, "Failed to calculate IPL points");
    return res.status(500).json({ error: "Failed", playerPoints: {} });
  }
});

// ── Playing XI cache (stable after toss, keyed by cricapi match ID) ──────────
const playing11Cache: Record<string, { names: string[]; fetched: number }> = {};
const PLAYING11_CACHE_TTL = 30 * 60 * 1000; // 30 min

router.get("/ipl/playing11", async (req, res) => {
  try {
    if (Date.now() - lastPointsCacheReload > 30000) {
      pointsCache = loadCache();
      lastPointsCacheReload = Date.now();
    }

    const today = utcDateString();
    let liveMatchesFound = false;
    const todayCricapiIds: string[] = [];
    const todayIplIds: string[] = []; // track IPL match IDs for scorecard fallback

    // Step 1: Fetch today's live matches directly from IPL schedule (self-sufficient)
    try {
      const schedRes = await fetch(
        "https://ipl-stats-sports-mechanic.s3.ap-south-1.amazonaws.com/ipl/feeds/284-matchschedule.js",
        { signal: AbortSignal.timeout(8000) }
      );
      if (schedRes.ok) {
        const text = await schedRes.text();
        const m = text.match(/^[A-Za-z_$][A-Za-z0-9_$]*\(([\s\S]*)\)\s*;?\s*$/);
        if (m) {
          const data = JSON.parse(m[1]);
          const allMatches: any[] = data.Matchsummary || [];
          const todayLive = allMatches.filter((match: any) =>
            (match.GMTMatchDate || match.MatchDate || "") === today &&
            String(match.MatchStatus || "").toLowerCase() === "live"
          );

          if (todayLive.length > 0) liveMatchesFound = true;

          if (!pointsCache.matchMetadata) pointsCache.matchMetadata = {};

          for (const iplMatch of todayLive) {
            const iplId = String(iplMatch.MatchID);
            todayIplIds.push(iplId);

            // Populate matchMetadata so other endpoints can use it
            if (!pointsCache.matchMetadata[iplId]) {
              pointsCache.matchMetadata[iplId] = {
                matchDate: today,
                teamA: iplMatch.HomeTeamName || "",
                teamB: iplMatch.AwayTeamName || "",
              };
            }

            // Use cached cricapi ID if available
            if (pointsCache.cricapiMatchIds[iplId]) {
              todayCricapiIds.push(pointsCache.cricapiMatchIds[iplId]);
              continue;
            }

            // Otherwise look it up via CricAPI series endpoint
            if (!CRICAPI_KEY || pointsCache.dailyHits.count >= DAILY_CALL_LIMIT) continue;
            const seriesId = await findIPLSeriesId(pointsCache);
            if (!seriesId) continue;
            if (seriesId !== pointsCache.seriesId) pointsCache.seriesId = seriesId;

            const cricapiMatches = await getSeriesMatches(seriesId);
            const iplDate = iplMatch.GMTMatchDate || iplMatch.MatchDate || "";
            const homeTeam = iplMatch.HomeTeamName || "";
            const awayTeam = iplMatch.AwayTeamName || "";

            for (const cm of cricapiMatches) {
              const cmDate = (cm.date || cm.dateTimeGMT || "").split("T")[0];
              const parts = (cm.name || "").split(" vs ");
              if (parts.length === 2 && cmDate === iplDate) {
                const teamA = parts[0].split(",")[0].trim();
                const teamB = parts[1].split(",")[0].trim();
                if ((teamNamesMatch(teamA, homeTeam) && teamNamesMatch(teamB, awayTeam)) ||
                  (teamNamesMatch(teamA, awayTeam) && teamNamesMatch(teamB, homeTeam))) {
                  pointsCache.cricapiMatchIds[iplId] = cm.id;
                  saveCache(pointsCache);
                  todayCricapiIds.push(cm.id);
                  break;
                }
              }
            }
          }
        }
      }
    } catch { /* schedule fetch failed — return what we have */ }

    const confirmedFantasyNames: string[] = [];

    // Helper: match raw names list against fantasy player roster
    const matchNames = (rawNames: string[]) => {
      for (const fp of FANTASY_PLAYER_NAMES) {
        if (confirmedFantasyNames.includes(fp)) continue;
        if (rawNames.some(n => namesMatch(fp, n))) confirmedFantasyNames.push(fp);
      }
    };

    // Strip captain/wk markers from IPL feed player names e.g. "Virat Kohli (c)" -> "Virat Kohli"
    const stripRoleMarkers = (name: string) =>
      name.replace(/\s*\([cwk]+\)/gi, "").trim();

    // Source 1 (primary, free, no API credits): IPL official Innings feeds
    // BattingCard lists ALL 11 from the batting team in order — even players yet to bat.
    // BowlingCard lists fielding-team bowlers who've bowled so far.
    // Combining innings 1+2 gives up to the full 22-player playing XI.
    const IPL_FEED_BASE = "https://ipl-stats-sports-mechanic.s3.ap-south-1.amazonaws.com/ipl/feeds";
    const iplInnNames: string[] = [];

    for (const iplId of todayIplIds) {
      for (const n of [1, 2]) {
        try {
          const r = await fetch(`${IPL_FEED_BASE}/${iplId}-Innings${n}.js`);
          if (!r.ok) break;
          const text = await r.text();
          const raw = text.replace(/^[A-Za-z_$][A-Za-z0-9_$]*\(/, "").replace(/\)\s*;?\s*$/, "");
          const data = JSON.parse(raw);
          const inn = data[`Innings${n}`] || {};
          for (const bat of inn.BattingCard || []) {
            const name = stripRoleMarkers(bat.PlayerName || "");
            if (name) iplInnNames.push(name);
          }
          for (const bowl of inn.BowlingCard || []) {
            const name = stripRoleMarkers(bowl.PlayerName || "");
            if (name) iplInnNames.push(name);
          }
        } catch { break; }
      }
    }

    if (iplInnNames.length) {
      matchNames(iplInnNames);
    } else {
      // Source 2 (backup, uses API credits): CricAPI match_info then match_scorecard
      for (const cricapiId of todayCricapiIds) {
        const cached = playing11Cache[cricapiId];
        if (cached && Date.now() - cached.fetched < PLAYING11_CACHE_TTL) {
          matchNames(cached.names);
          continue;
        }
        if (!CRICAPI_KEY || pointsCache.dailyHits.count >= DAILY_CALL_LIMIT) continue;
        let names: string[] = [];

        // 2a: match_info
        try {
          const data = await cricapiGet("match_info", { id: cricapiId });
          const raw: string[] = [];
          if (data?.players && typeof data.players === "object" && !Array.isArray(data.players)) {
            for (const team of Object.values(data.players) as any[]) {
              if (Array.isArray(team)) {
                for (const p of team) {
                  const n = typeof p === "string" ? p : (p?.name || "");
                  if (n) raw.push(n);
                }
              }
            }
          }
          if (!raw.length) {
            for (const field of ["squads", "playing11"] as const) {
              if (Array.isArray((data as any)?.[field])) {
                for (const p of (data as any)[field]) {
                  const n = typeof p === "string" ? p : (p?.name || "");
                  if (n) raw.push(n);
                }
                if (raw.length) break;
              }
            }
          }
          names = raw;
        } catch { /* fall through */ }

        // 2b: match_scorecard batting array
        if (!names.length && pointsCache.dailyHits.count < DAILY_CALL_LIMIT) {
          try {
            const data = await cricapiGet("match_scorecard", { id: cricapiId });
            const scorecard: any[] = data?.scorecard || [];
            const raw: string[] = [];
            for (const inning of scorecard) {
              for (const bat of inning.batting || []) {
                const n = bat?.batsman?.name || bat?.batsmanName || "";
                if (n) raw.push(n);
              }
              for (const bowl of inning.bowling || []) {
                const n = bowl?.bowler?.name || bowl?.bowlerName || "";
                if (n) raw.push(n);
              }
            }
            names = raw;
          } catch { /* skip */ }
        }

        if (names.length) {
          playing11Cache[cricapiId] = { names, fetched: Date.now() };
          matchNames(names);
        }
      }

      // Source 3: Scorecard cache (last resort — players who've appeared in processed innings)
      for (const iplId of todayIplIds) {
        const matchData = pointsCache.processedMatches[iplId];
        if (!matchData?.innings?.length) continue;
        const scorecardNames: string[] = [];
        for (const inning of matchData.innings) {
          for (const bat of inning.batting || []) {
            if (bat.name && !bat.dnb) scorecardNames.push(bat.name);
          }
          for (const bowl of inning.bowling || []) {
            if (bowl.name) scorecardNames.push(bowl.name);
          }
        }
        if (scorecardNames.length) matchNames(scorecardNames);
      }
    }

    res.json({ inXI: confirmedFantasyNames, liveMatchesFound, matchCount: todayCricapiIds.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message, inXI: [], liveMatchesFound: false });
  }
});

router.get("/ipl/scorecard/:matchId", async (req, res) => {
  const { matchId } = req.params;
  const cached = pointsCache.processedMatches[matchId];
  const innings = cached?.innings || [];

  // Fetch match overview from IPL S3 matchsummary
  let overview: any = null;
  try {
    const sumRes = await fetch(
      `https://ipl-stats-sports-mechanic.s3.ap-south-1.amazonaws.com/ipl/feeds/${matchId}-matchsummary.js`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (sumRes.ok) {
      const text = await sumRes.text();
      const m = text.match(/^[A-Za-z_$][A-Za-z0-9_$]*\(([\s\S]*)\)\s*;?\s*$/);
      if (m) {
        const data = JSON.parse(m[1]);
        const ms = (data.MatchSummary || [])[0] || {};
        overview = {
          result: ms.Comments || "",
          toss: ms.TossDetails || "",
          venue: ms.GroundName || "",
          team1: ms.Team1 || ms.FirstBattingTeam || "",
          team2: ms.Team2 || ms.SecondBattingTeam || "",
          score1: ms["1Summary"] || "",
          score2: ms["2Summary"] || "",
          umpires: [ms.Umpire1Name, ms.Umpire2Name].filter(Boolean).join(", "),
          referee: ms.Referee || "",
        };
      }
    }
  } catch (_) {}

  res.json({ matchId, overview, innings, hasScorecard: innings.length > 0 });
});

router.get("/ipl/stats", (req, res) => {
  if (Date.now() - lastPointsCacheReload > 30000) {
    pointsCache = loadCache();
    lastPointsCacheReload = Date.now();
  }

  const ALL_FANTASY_NAMES = Object.values(FANTASY_TEAMS_EXPORT).flatMap(t => t);
  const battingStats: Record<string, { runs: number; fours: number; sixes: number; balls: number; innings: number; notOuts: number; hs: number }> = {};
  const bowlingStats: Record<string, { wickets: number; balls: number; runs: number; innings: number; bestW: number; bestR: number }> = {};

  for (const matchData of Object.values(pointsCache.processedMatches)) {
    for (const inning of matchData.innings || []) {
      for (const bat of inning.batting || []) {
        if (bat.dnb || !bat.name) continue;
        const k = bat.name;
        if (!battingStats[k]) battingStats[k] = { runs: 0, fours: 0, sixes: 0, balls: 0, innings: 0, notOuts: 0, hs: 0 };
        battingStats[k].runs += bat.runs || 0;
        battingStats[k].fours += bat.fours || 0;
        battingStats[k].sixes += bat.sixes || 0;
        battingStats[k].balls += bat.balls || 0;
        battingStats[k].innings += 1;
        if (bat.notOut) battingStats[k].notOuts += 1;
        if ((bat.runs || 0) > battingStats[k].hs) battingStats[k].hs = bat.runs;
      }
      for (const bowl of inning.bowling || []) {
        if (!bowl.name) continue;
        const k = bowl.name;
        if (!bowlingStats[k]) bowlingStats[k] = { wickets: 0, balls: 0, runs: 0, innings: 0, bestW: 0, bestR: 999 };
        bowlingStats[k].wickets += bowl.wickets || 0;
        bowlingStats[k].balls += parseOversTooBalls(bowl.overs || "0");
        bowlingStats[k].runs += bowl.runs || 0;
        bowlingStats[k].innings += 1;
        if ((bowl.wickets || 0) > bowlingStats[k].bestW || ((bowl.wickets || 0) === bowlingStats[k].bestW && (bowl.runs || 0) < bowlingStats[k].bestR)) {
          bowlingStats[k].bestW = bowl.wickets || 0;
          bowlingStats[k].bestR = bowl.runs || 0;
        }
      }
    }
  }

  const isFantasy = (name: string) => ALL_FANTASY_NAMES.some(n => namesMatch(n, name));

  const batters = Object.entries(battingStats).map(([name, s]) => ({
    name, runs: s.runs, fours: s.fours, sixes: s.sixes, balls: s.balls, innings: s.innings, notOuts: s.notOuts, hs: s.hs,
    avg: s.innings > s.notOuts ? +(s.runs / (s.innings - s.notOuts)).toFixed(1) : s.runs,
    sr: s.balls > 0 ? +((s.runs / s.balls) * 100).toFixed(1) : 0,
    isFantasy: isFantasy(name),
  }));

  const bowlers = Object.entries(bowlingStats).map(([name, s]) => ({
    name, wickets: s.wickets, balls: s.balls, runs: s.runs, innings: s.innings,
    overs: +(s.balls / 6).toFixed(1),
    eco: s.balls > 0 ? +((s.runs / (s.balls / 6))).toFixed(2) : 0,
    avg: s.wickets > 0 ? +(s.runs / s.wickets).toFixed(1) : 999,
    best: `${s.bestW}/${s.bestR === 999 ? 0 : s.bestR}`,
    isFantasy: isFantasy(name),
  }));

  res.json({
    orangeCap: [...batters].sort((a, b) => b.runs - a.runs || b.sr - a.sr),
    purpleCap: [...bowlers].sort((a, b) => b.wickets - a.wickets || a.eco - b.eco),
    sixesLeader: [...batters].sort((a, b) => b.sixes - a.sixes),
    foursLeader: [...batters].sort((a, b) => b.fours - a.fours),
    srLeader: [...batters].filter(b => b.balls >= 10).sort((a, b) => b.sr - a.sr),
    ecoLeader: [...bowlers].filter(b => b.balls >= 12).sort((a, b) => a.eco - b.eco),
    matchesProcessed: Object.keys(pointsCache.processedMatches).length,
    timestamp: new Date().toISOString(),
  });
});

const FANTASY_TEAMS_EXPORT: Record<string, string[]> = {
  rajveer: ["Rajat Patidar","Axar Patel","Shubman Gill","Jos Buttler","Yuzvendra Chahal","Jacob Bethell","Bhuvneshwar Kumar","Shreyas Iyer","Cameron Green","Nicholas Pooran","Phil Salt","Krunal Pandya","Priyansh Arya","Vaibhav Suryavanshi","Dhruv Jurel","Mohammed Shami","Tim David","Deepak Chahar"],
  mombasa: ["Jitesh Sharma","Varun Chakravarthy","Marco Jansen","Arshdeep Singh","Shivam Dube","Riyan Parag","Abhishek Sharma","Prabhsimran Singh","Nehal Wadhera","Shimron Hetmyer","Sai Sudharsan","Will Jacks","Prasidh Krishna","Aiden Markram","Rashid Khan","Ajinkya Rahane","Trent Boult","Tilak Varma"],
  mumbai: ["Rishabh Pant","Dewald Brevis","Rohit Sharma","Sherfane Rutherford","Rinku Singh","Heinrich Klaasen","Nitish Rana","Ruturaj Gaikwad","Lungi Ngidi","Mohammed Siraj","Harshal Patel","Tristan Stubbs","Sanju Samson","Prashant Veer","Ishan Kishan","Hardik Pandya","Finn Allen","Venkatesh Iyer"],
  ponygoat: ["Marcus Stoinis","Yashasvi Jaiswal","Tim Seifert","Virat Kohli","Shashank Singh","Sunil Narine","Suryakumar Yadav","Jasprit Bumrah","Ravindra Jadeja","Travis Head","KL Rahul","Ryan Rickelton","Mitchell Marsh","Khaleel Ahmed","Kuldeep Yadav","Washington Sundar","T Natarajan"],
};

router.post("/ipl/points/reset", async (_req, res) => {
  pointsCache = {
    seriesId: null, cricapiMatchIds: {}, processedMatches: {},
    supabaseScores: {}, playerIdMap: {}, matchMetadata: {},
    lastUpdated: "", dailyHits: { date: utcDateString(), count: 0 },
  };
  lastUpdateAttempt = 0;
  saveCache(pointsCache);
  res.json({ ok: true });
});

export default router;
