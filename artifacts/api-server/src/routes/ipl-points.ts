import { Router, type IRouter } from "express";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const router: IRouter = Router();

// Anchor data directory to the bundle file location (dist/index.mjs).
// import.meta.url is preserved by esbuild and resolves to the actual output file,
// so this works correctly regardless of the process working directory (dev or prod).
const _bundleDir = fileURLToPath(new URL(".", import.meta.url));
const CACHE_FILE = (() => {
  const dir = join(_bundleDir, "../ipl-data");
  try { mkdirSync(dir, { recursive: true }); } catch {}
  return join(dir, "ipl-points-cache.json");
})();

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
  sharedRunOuts: number;
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
  dots?: number;
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

// ── IPL S3 feed base URL (single source of truth) ───────────────────────────
const S3_FEEDS_BASE = "https://ipl-stats-sports-mechanic.s3.ap-south-1.amazonaws.com/ipl/feeds";
const IPL_COMP_ID = 284;

// ── Abandoned / No-Result matches ───────────────────────────────────────────
const ABANDONED_MATCH_IPL_IDS = new Set<string>(["2428"]); // M12 (KKR vs PBKS, abandoned)

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
  processedMatches: Record<string, ProcessedMatchData>; // S3: points (live/fallback) + innings
  supabaseScores: Record<string, SupabaseFixtureScore>; // fixtureId → official scores (override)
  playerIdMap: Record<string, string>; // supabase player_id → player name
  matchMetadata: Record<string, { matchDate: string; teamA: string; teamB: string; matchNumber?: number }>; // iplId → meta
  lastUpdated: string;
}

function utcDateString(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD" in UTC
}

/** Strip JSONP wrapper — e.g. `MatchSchedule({...});` → `{...}` */
function stripJsonp(text: string): string {
  return text.replace(/^[A-Za-z_$][A-Za-z0-9_$]*\(/, "").replace(/\)\s*;?\s*$/, "");
}

function loadCache(): PointsCache {
  const empty: PointsCache = {
    seriesId: null, processedMatches: {},
    supabaseScores: {}, playerIdMap: {}, matchMetadata: {},
    lastUpdated: "",
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
      return { ...empty, ...raw, processedMatches };
    } catch (_) {}
  }
  return empty;
}

const PROCESSED_MATCHES_MAX = 74;
function pruneProcessedMatches(cache: PointsCache): void {
  const keys = Object.keys(cache.processedMatches || {});
  if (keys.length <= PROCESSED_MATCHES_MAX) return;
  const toRemove = keys.slice(0, keys.length - PROCESSED_MATCHES_MAX);
  for (const k of toRemove) delete cache.processedMatches[k];
}

function saveCache(cache: PointsCache) {
  pruneProcessedMatches(cache);
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
  pts += (p.sharedRunOuts || 0) * 5;
  pts += (p.stumpings || 0) * 12;

  return pts;
}

function normalizeName(name: string): string {
  return name
    .replace(/\s*\(.*?\)\s*/g, " ")  // strip (c), (wk), (rp) etc before lowercasing
    .toLowerCase()
    .replace(/[^a-z ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    // Collapse common Indian name romanization variants so e.g.
    // "Sooryavanshi" == "Suryavanshi", "Prithvee" == "Prithvi"
    .replace(/oo/g, "u")
    .replace(/ee/g, "i")
    .replace(/aa/g, "a")
    // Player-specific alternate spellings seen across CricAPI / S3 feeds:
    // Varun Chakravarthy — scorecard writes "Chakaravarthy" (drops the first 'r')
    .replace(/chakravarthy/g, "chakaravarthy")
    // Yuzvendra Chahal — some feeds omit the 'z': "Yuvendra"
    .replace(/yuzvendra/g, "yuvendra")
    // T Natarajan — some feeds use full first name "Thangarasu"
    .replace(/thangarasu/g, "t");
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
    // If either side is just a surname (e.g. "Stubbs" extracted from dismissal text "c Stubbs b ..."),
    // a matching last name is sufficient — no first-name comparison needed.
    if (partsA.length === 1 || partsB.length === 1) return true;
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

function parseDismissal(dismissal: string): { caught?: string; lbwBowled?: boolean; stumped?: string; runOut?: string; sharedRunOut?: string[] } {
  const d = (dismissal || "").toLowerCase().trim();
  if (!d || d === "not out" || d === "dnb") return {};
  const result: any = {};
  // Handles short form "c Stubbs b Chahal" AND long form "caught Stubbs bowled Chahal" (S3 feed)
  const cMatch = d.match(/^c\s+(.+?)\s+b\s/) || d.match(/^caught\s+(.+?)\s+bowled\s/);
  if (cMatch) result.caught = cMatch[1].trim();
  if (/^lbw\s+b\s/.test(d) || /^b\s/.test(d) || /^lbw\s+bowled\s/.test(d) || /^bowled\s/.test(d)) result.lbwBowled = true;
  const stMatch = d.match(/^st\s+(.+?)\s+b\s/) || d.match(/^stumped\s+(.+?)\s+bowled\s/);
  if (stMatch) result.stumped = stMatch[1].trim();
  // Shared run-out: "run out (PlayerA/PlayerB)" → 5 pts each
  // Solo run-out:   "run out (PlayerA)"          → 10 pts
  const roFull = d.match(/^run\s+out\s+\(([^)]+)\)/);
  if (roFull) {
    const parts = roFull[1].split("/").map((s: string) => s.trim()).filter(Boolean);
    if (parts.length >= 2) result.sharedRunOut = parts;
    else if (parts.length === 1) result.runOut = parts[0];
  }
  return result;
}


// Match a Supabase team label (e.g. "Mumbai Indians") to an S3 team name (e.g. "Mumbai Indians (MI)").
// Also handles short codes like "MI" and partial matches.
function teamNamesMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const na = norm(a);
  const nb = norm(b);
  if (na === nb) return true;
  // Check if one contains the other (handles "Mumbai Indians" ↔ "Mumbai Indians (MI)")
  if (na.includes(nb) || nb.includes(na)) return true;
  // Extract short code from parentheses e.g. "(MI)"
  const codeMatch = (s: string) => { const m = s.match(/\(([A-Z]{2,4})\)/); return m ? m[1].toLowerCase() : ""; };
  const ca = codeMatch(a);
  const cb = codeMatch(b);
  if (ca && (ca === nb || ca === cb)) return true;
  if (cb && (cb === na || cb === ca)) return true;
  return false;
}

// Derive fantasy points from pre-parsed InningData[] (already-normalised S3 display format).
function processInningsForPoints(
  innings: InningData[],
  allPlayers: string[],
  homeTeam: string,
  awayTeam: string,
): ProcessedMatchData {
  const rawStats: Record<string, PlayerStats> = {};
  const getP = (name: string): PlayerStats => {
    const key = normalizeName(name);
    if (!rawStats[key]) {
      rawStats[key] = { played: true, runs: 0, balls: 0, fours: 0, sixes: 0, duck: false,
        wickets: 0, dots: 0, lbwBowled: 0, maidens: 0, ballsBowled: 0, runsConceded: 0,
        catches: 0, runOuts: 0, sharedRunOuts: 0, stumpings: 0 };
    }
    return rawStats[key];
  };

  for (const inn of innings) {
    for (const b of inn.batting) {
      if (b.dnb) continue;
      const p = getP(b.name);
      p.runs += b.runs;
      p.balls += b.balls;
      p.fours += b.fours;
      p.sixes += b.sixes;
      if (!b.notOut && b.runs === 0) p.duck = true;

      const parsed = parseDismissal(b.dismissal);
      if (parsed.caught) {
        const catcher = getP(parsed.caught);
        if (!b.dismissal.toLowerCase().includes("& b")) catcher.catches++;
      }
      if (parsed.stumped) getP(parsed.stumped).stumpings++;
      if (parsed.runOut) getP(parsed.runOut).runOuts++;
      if (parsed.sharedRunOut) parsed.sharedRunOut.forEach((fn: string) => { getP(fn).sharedRunOuts++; });
      if (parsed.lbwBowled) {
        const bMatch = b.dismissal.match(/\sb\s(.+)$/);
        if (bMatch) getP(bMatch[1].trim()).lbwBowled++;
      }
    }

    for (const b of inn.bowling) {
      const p = getP(b.name);
      p.ballsBowled += parseOversTooBalls(b.overs);
      p.runsConceded += b.runs;
      p.wickets += b.wickets;
      p.maidens += b.maidens;
      p.dots += b.dots ?? 0;
    }
  }

  const points: Record<string, number> = {};
  const playerStats: Record<string, PlayerStats> = {};
  for (const fantasyName of allPlayers) {
    const tc = PLAYER_TEAMS[fantasyName];
    if (tc) {
      if (!teamNamesMatch(homeTeam, tc) && !teamNamesMatch(awayTeam, tc)) continue;
    }
    const norm = normalizeName(fantasyName);
    for (const [key, stats] of Object.entries(rawStats)) {
      if (namesMatch(key, norm)) {
        points[fantasyName] = calcPoints(stats);
        playerStats[fantasyName] = stats;
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
  "Vaibhav Suryavanshi": "rr", "Dhruv Jurel": "rr",
  "Riyan Parag": "rr", "Shimron Hetmyer": "rr", "Yashasvi Jaiswal": "rr",
  "Ravindra Jadeja": "rr",
  // PBKS
  "Yuzvendra Chahal": "pbks", "Shreyas Iyer": "pbks", "Arshdeep Singh": "pbks", "Priyansh Arya": "pbks",
  "Marco Jansen": "pbks", "Prabhsimran Singh": "pbks", "Nehal Wadhera": "pbks",
  "Marcus Stoinis": "pbks", "Shashank Singh": "pbks",
  // MI
  "Rohit Sharma": "mi", "Jasprit Bumrah": "mi", "Hardik Pandya": "mi",
  "Sherfane Rutherford": "mi", "Will Jacks": "mi", "Trent Boult": "mi",
  "Tilak Varma": "mi", "Suryakumar Yadav": "mi", "Ryan Rickelton": "mi",
  "Deepak Chahar": "mi",
  // SRH
  "Travis Head": "srh", "Abhishek Sharma": "srh", "Ishan Kishan": "srh",
  "Heinrich Klaasen": "srh", "Harshal Patel": "srh",
  // CSK
  "Sanju Samson": "csk", "Ruturaj Gaikwad": "csk", "Shivam Dube": "csk",
  "Dewald Brevis": "csk", "Prashant Veer": "csk", "Khaleel Ahmed": "csk",
  // DC
  "Axar Patel": "dc", "KL Rahul": "dc", "Kuldeep Yadav": "dc",
  "Nitish Rana": "dc", "Lungi Ngidi": "dc", "Tristan Stubbs": "dc", "T Natarajan": "dc",
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
let lastForceSyncAt = 0; // guards the open force-sync endpoint (30 s cooldown)
let isLiveMatchActive = false; // dynamically tracks if any IPL match is currently live
const LIVE_COOLDOWN_MS  = 45 * 1000;       // 45 s during live matches (safe for 2000/day limit)
const IDLE_COOLDOWN_MS  = 16 * 60 * 1000; // 16 min when idle
const getCooldown = () => isLiveMatchActive ? LIVE_COOLDOWN_MS : IDLE_COOLDOWN_MS;
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

// Link every Supabase fixture to its IPL match ID, clear stale live-fetch points.
// Called during force-sync so the overwrite is immediate (not deferred to the next poll).
async function linkSupabaseFixtures(cache: PointsCache): Promise<void> {
  try {
    const scheduleRes = await fetch(
      `${S3_FEEDS_BASE}/${IPL_COMP_ID}-matchschedule.js`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!scheduleRes.ok) return;
    const schedule = JSON.parse(stripJsonp(await scheduleRes.text()));
    const allMatches: any[] = schedule.Matchsummary || [];
    const sortedMatches = [...allMatches].sort((a: any, b: any) => a.MatchID - b.MatchID);
    if (!cache.matchMetadata) cache.matchMetadata = {};
    for (let i = 0; i < sortedMatches.length; i++) {
      const sm = sortedMatches[i];
      const iplId = String(sm.MatchID);
      const matchNumber = i + 1;
      if (!cache.matchMetadata[iplId]) {
        cache.matchMetadata[iplId] = { matchDate: sm.GMTMatchDate || sm.MatchDate || "", teamA: sm.HomeTeamName || "", teamB: sm.AwayTeamName || "", matchNumber };
      } else {
        cache.matchMetadata[iplId].matchNumber = matchNumber;
      }
    }
  } catch (_) {}

  for (const fixture of Object.values(cache.supabaseScores || {})) {
    if (fixture.linkedIplId) {
      // Still clear stale live-fetch points even for already-linked fixtures
      const pm = (cache.processedMatches || {})[fixture.linkedIplId];
      if (pm && Object.keys(pm.points || {}).length > 0) {
        cache.processedMatches[fixture.linkedIplId] = { ...pm, points: {} };
        console.log(`[sync] Cleared stale live-fetch points for already-linked match ${fixture.linkedIplId}`);
      }
      continue;
    }
    const parts = fixture.matchLabel.split(" vs ");
    const sTeamA = parts[0]?.trim() || "";
    const sTeamB = parts[1]?.trim() || "";
    for (const [iplId, meta] of Object.entries(cache.matchMetadata || {})) {
      if (meta.matchDate !== fixture.matchDate) continue;
      const okAA = teamNamesMatch(sTeamA, meta.teamA);
      const okAB = teamNamesMatch(sTeamA, meta.teamB);
      const okBA = teamNamesMatch(sTeamB, meta.teamA);
      const okBB = teamNamesMatch(sTeamB, meta.teamB);
      if ((okAA || okAB) && (okBA || okBB)) {
        fixture.linkedIplId = iplId;
        console.log(`[sync] Linked "${fixture.matchLabel}" → iplId ${iplId}`);
        const pm = (cache.processedMatches || {})[iplId];
        if (pm && Object.keys(pm.points || {}).length > 0) {
          cache.processedMatches[iplId] = { ...pm, points: {} };
          console.log(`[sync] Cleared stale live-fetch points for ${iplId}`);
        }
        break;
      }
    }
  }
}

async function syncAuctionRoomScores(cache: PointsCache, force = false): Promise<boolean> {
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

  // In normal mode only fetch fixture IDs we haven't seen yet.
  // In force mode re-fetch ALL fixtures so any re-scored players are picked up.
  const targetIds = force ? fixtureIds : fixtureIds.filter(id => !cache.supabaseScores[id]);
  if (!targetIds.length) return false;

  const fixtureRows = await supabaseGet("tournament_fixtures", {
    id: `in.(${targetIds.join(",")})`,
    select: "id,team_a,team_b,match_date,match_number",
    limit: "100",
  });
  const fixtureMap: Record<string, any> = {};
  for (const f of fixtureRows) fixtureMap[f.id] = f;

  for (const fixtureId of targetIds) {
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
    console.log(`[supabase${force ? " force" : ""}] Fixture ${matchLabel}: mapped ${Object.keys(points).length} fantasy players`);
    changed = true;
  }
  return changed;
}

router.get("/ipl/points", async (req, res) => {
  try {
    // Don't reload from disk while the background job is running — it would replace the
    // module-level pointsCache reference mid-job, causing saveCache() to persist a
    // freshly-loaded empty object instead of the one being populated by syncAuctionRoomScores.
    if (Date.now() - lastPointsCacheReload > 30000 && !pointsUpdateInProgress) {
      pointsCache = loadCache();
      lastPointsCacheReload = Date.now();
    }

    // ── Hybrid aggregation: Supabase (official) + S3 (live/fallback) ────────
    // Build the set of iplIds covered by Supabase using TWO methods to prevent
    // a race condition where the background job has synced Supabase scores but
    // hasn't yet written linkedIplId (causing both sources to be counted):
    //   1. Already-linked via linkedIplId (set by background job)
    //   2. On-the-fly date+team matching against matchMetadata (covers the race window)
    const supabaseLinkedIds = new Set<string>();
    for (const fixtureData of Object.values(pointsCache.supabaseScores || {})) {
      if (fixtureData.linkedIplId) {
        supabaseLinkedIds.add(fixtureData.linkedIplId);
        continue;
      }
      // Fallback: match by date + teams so we deduplicate even before linking is persisted
      const parts = fixtureData.matchLabel.split(" vs ");
      const sTeamA = parts[0]?.trim() || "";
      const sTeamB = parts[1]?.trim() || "";
      for (const [iplId, meta] of Object.entries(pointsCache.matchMetadata || {})) {
        if (meta.matchDate !== fixtureData.matchDate) continue;
        const okAA = teamNamesMatch(sTeamA, meta.teamA);
        const okAB = teamNamesMatch(sTeamA, meta.teamB);
        const okBA = teamNamesMatch(sTeamB, meta.teamA);
        const okBB = teamNamesMatch(sTeamB, meta.teamB);
        if ((okAA || okAB) && (okBA || okBB)) {
          supabaseLinkedIds.add(iplId);
          break;
        }
      }
    }
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
      // Look up playerStats from the linked S3 processed match if available
      const linkedIplId = fixtureData.linkedIplId;
      const linkedMatchData = linkedIplId ? (pointsCache.processedMatches || {})[linkedIplId] : null;
      for (const [player, pts] of Object.entries(fixtureData.points || {})) {
        const stats = linkedMatchData?.playerStats?.[player];
        addMatchPoint(player, fixtureData.matchNumber, fixtureData.matchLabel, pts, "official", stats);
      }
    }

    // 2. S3 points for matches NOT yet covered by Supabase
    // Uses the real match number from the schedule when available so points sort correctly.
    const liveLabels: string[] = [];
    let liveMatchNumFallback = 900; // placeholder only if schedule match number unknown
    for (const [iplId, matchData] of Object.entries(pointsCache.processedMatches || {})) {
      if (supabaseLinkedIds.has(iplId)) continue;
      // Skip abandoned / no-result matches — no points awarded
      if (ABANDONED_MATCH_IPL_IDS.has(iplId)) continue;
      const meta = (pointsCache.matchMetadata || {})[iplId];
      const label = meta ? `${meta.teamA} vs ${meta.teamB}` : `Match ${iplId}`;
      // Use real match number from schedule; fall back to high placeholder if not yet available
      const matchNum = meta?.matchNumber ?? liveMatchNumFallback;
      for (const [player, pts] of Object.entries(matchData.points || {})) {
        const stats = (matchData.playerStats || {})[player];
        addMatchPoint(player, matchNum, label, pts, "live", stats);
      }
      if (Object.keys(matchData.points || {}).length > 0) {
        liveLabels.push(`${label} ★live`);
        if (!meta?.matchNumber) liveMatchNumFallback++;
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
      ...liveLabels,
    ];

    // Build iplId → matchNumber map. Supabase-linked matches first (authoritative),
    // then S3-fallback matches using schedule match numbers stored in matchMetadata.
    const iplIdToMatchNum: Record<string, number> = {};
    for (const fixture of Object.values(pointsCache.supabaseScores || {})) {
      if (fixture.linkedIplId && fixture.matchNumber) {
        iplIdToMatchNum[fixture.linkedIplId] = fixture.matchNumber;
      }
    }
    // Add S3-fallback matches (not yet in Supabase) using their real match number
    for (const [iplId, meta] of Object.entries(pointsCache.matchMetadata || {})) {
      if (iplIdToMatchNum[iplId]) continue; // already covered by Supabase
      if (meta.matchNumber && (pointsCache.processedMatches || {})[iplId]) {
        iplIdToMatchNum[iplId] = meta.matchNumber;
      }
    }

    if (pointsUpdateInProgress) {
      return res.json({
        playerPoints: aggregated, playerMatchPoints, processedMatches: supabaseMatchLabels,
        iplIdToMatchNum, updating: true, timestamp: new Date().toISOString(),
        abandonedMatchIds: [...ABANDONED_MATCH_IPL_IDS],
      });
    }

    // Run Supabase sync + S3 innings refresh in background
    if (Date.now() - lastUpdateAttempt >= getCooldown()) {
      pointsUpdateInProgress = true;
      lastUpdateAttempt = Date.now();
      (async () => {
        // Capture local reference so mid-job reassignments of the module-level
        // pointsCache variable (e.g. from a concurrent loadCache() call) don't
        // cause us to save the wrong object.
        const cache = pointsCache;
        try {
          // Step 1: Sync AuctionRoom scores from Supabase
          const changed = await syncAuctionRoomScores(cache);
          if (changed) { cache.lastUpdated = new Date().toISOString(); pointsCache = cache; saveCache(cache); }

          // Step 2: Fetch schedule → populate metadata, link Supabase, fetch S3 innings for display
          const scheduleRes = await fetch(
            `${S3_FEEDS_BASE}/${IPL_COMP_ID}-matchschedule.js`,
            { signal: AbortSignal.timeout(10000) }
          );
          if (scheduleRes.ok) {
            const scheduleText = await scheduleRes.text();
            try {
              const schedule = JSON.parse(stripJsonp(scheduleText));
              const allMatches: any[] = schedule.Matchsummary || [];

              // 2a. Populate matchMetadata for all matches (needed for linking + live labels)
              // Sort by MatchID so array-index → match number is always correct
              const sortedMatches = [...allMatches].sort((a: any, b: any) => a.MatchID - b.MatchID);
              if (!cache.matchMetadata) cache.matchMetadata = {};
              for (let i = 0; i < sortedMatches.length; i++) {
                const m = sortedMatches[i];
                const iplId = String(m.MatchID);
                const matchNumber = i + 1; // position in schedule = match number
                if (!cache.matchMetadata[iplId]) {
                  cache.matchMetadata[iplId] = {
                    matchDate: m.GMTMatchDate || m.MatchDate || "",
                    teamA: m.HomeTeamName || "",
                    teamB: m.AwayTeamName || "",
                    matchNumber,
                  };
                } else {
                  // Always keep matchNumber up to date
                  cache.matchMetadata[iplId].matchNumber = matchNumber;
                }
              }

              // 2b. Link Supabase fixtures → iplIds (by date + team name matching)
              for (const [fid, fixture] of Object.entries(cache.supabaseScores)) {
                if (fixture.linkedIplId) continue;
                const parts = fixture.matchLabel.split(" vs ");
                const sTeamA = parts[0]?.trim() || "";
                const sTeamB = parts[1]?.trim() || "";
                for (const [iplId, meta] of Object.entries(cache.matchMetadata)) {
                  if (meta.matchDate !== fixture.matchDate) continue;
                  const okAA = teamNamesMatch(sTeamA, meta.teamA);
                  const okAB = teamNamesMatch(sTeamA, meta.teamB);
                  const okBA = teamNamesMatch(sTeamB, meta.teamA);
                  const okBB = teamNamesMatch(sTeamB, meta.teamB);
                  if ((okAA || okAB) && (okBA || okBB)) {
                    fixture.linkedIplId = iplId;
                    console.log(`[supabase] Linked "${fixture.matchLabel}" → iplId ${iplId}`);
                    // Clear any stale live-fetch points for this match — Supabase is authoritative
                    const pm = cache.processedMatches[iplId];
                    if (pm && Object.keys(pm.points || {}).length > 0) {
                      cache.processedMatches[iplId] = { ...pm, points: {} };
                      console.log(`[supabase] Cleared stale live-fetch points for linked match ${iplId}`);
                    }
                    break;
                  }
                }
              }

              // 2c. Update isLiveMatchActive from schedule (controls cooldown: 45s live vs 16min idle)
              const liveMatches = allMatches.filter((m: any) => {
                const s = String(m.MatchStatus || "").toLowerCase();
                return s === "live" || s === "innings break" || s === "in progress";
              });
              isLiveMatchActive = liveMatches.length > 0;
              if (isLiveMatchActive) {
                console.log(`[bg] ${liveMatches.length} live match(es) detected — using short cooldown`);
              }

              // 2d. Fill completed matches via S3 innings (free, official, no API credits)
              const supabaseLinkedNow = new Set(
                Object.values(cache.supabaseScores).map(f => f.linkedIplId).filter(Boolean) as string[]
              );
              const s3NeedMatches = allMatches.filter((m: any) => {
                if (m.MatchStatus !== "Post") return false;
                const iplId = String(m.MatchID);
                const cached = cache.processedMatches[iplId];
                return !cached || !cached.innings?.length || cached.innings.length < 2;
              });
              for (const iplMatch of s3NeedMatches) {
                const iplId = String(iplMatch.MatchID);
                try {
                  const s3Innings = await fetchIplS3Innings(iplId, true);
                  if (s3Innings.length >= 2) {
                    const homeTeam = iplMatch.HomeTeamName || "";
                    const awayTeam = iplMatch.AwayTeamName || "";
                    const matchData = processInningsForPoints(s3Innings, FANTASY_PLAYER_NAMES, homeTeam, awayTeam);
                    const isSupabaseCovered = supabaseLinkedNow.has(iplId);
                    cache.processedMatches[iplId] = isSupabaseCovered
                      ? { points: {}, innings: matchData.innings, playerStats: matchData.playerStats }
                      : matchData;
                    const tag = isSupabaseCovered ? "S3-innings-only" : "S3-points";
                    console.log(`[s3] ${tag} match ${iplId}: ${s3Innings.length} innings, ${Object.keys(matchData.points).length} pts`);
                  }
                } catch (_) {}
              }

              // Single save after all matches processed (batch: one disk write per cycle)
              pointsCache = cache; saveCache(cache);
            } catch (_) {}
          }
        } catch (e: any) {
          console.error("[ipl-points] Background job error:", e?.message || e);
        }
        pointsUpdateInProgress = false;
      })();
    }

    return res.json({
      playerPoints: aggregated, playerMatchPoints, processedMatches: supabaseMatchLabels,
      iplIdToMatchNum, updating: pointsUpdateInProgress, timestamp: new Date().toISOString(),
      abandonedMatchIds: [...ABANDONED_MATCH_IPL_IDS],
    });
  } catch (err: any) {
    req.log.error({ err }, "Failed to calculate IPL points");
    return res.status(500).json({ error: "Failed", playerPoints: {} });
  }
});


router.get("/ipl/playing11", async (req, res) => {
  try {
    if (Date.now() - lastPointsCacheReload > 30000) {
      pointsCache = loadCache();
      lastPointsCacheReload = Date.now();
    }

    const today = utcDateString();
    let liveMatchesFound = false;
    const todayIplIds: string[] = []; // track IPL match IDs for scorecard fallback

    // Step 1: Fetch today's live matches directly from IPL schedule (self-sufficient)
    try {
      const schedRes = await fetch(
        `${S3_FEEDS_BASE}/${IPL_COMP_ID}-matchschedule.js`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (schedRes.ok) {
        try {
          const data = JSON.parse(stripJsonp(await schedRes.text()));
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
            if (!pointsCache.matchMetadata[iplId]) {
              pointsCache.matchMetadata[iplId] = {
                matchDate: today,
                teamA: iplMatch.HomeTeamName || "",
                teamB: iplMatch.AwayTeamName || "",
              };
            }
          }
        } catch (_) {}
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
    const iplInnNames: string[] = [];

    for (const iplId of todayIplIds) {
      for (const n of [1, 2]) {
        try {
          const r = await fetch(`${S3_FEEDS_BASE}/${iplId}-Innings${n}.js`);
          if (!r.ok) break;
          const data = JSON.parse(stripJsonp(await r.text()));
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
      // Source 2: Scorecard cache (last resort — players who've appeared in processed innings)
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

    res.json({ inXI: confirmedFantasyNames, liveMatchesFound, matchCount: todayIplIds.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message, inXI: [], liveMatchesFound: false });
  }
});

// Cache for match overview fetches from S3
// Completed matches: cached indefinitely (result never changes)
// Live matches: cached 30 s (score updates frequently)
const summaryCache = new Map<string, { data: any; timestamp: number; isCompleted: boolean }>();

const s3InningsCache = new Map<string, { data: InningData[]; timestamp: number; isCompleted: boolean }>();

async function fetchIplS3Innings(matchId: string, isCompleted: boolean): Promise<InningData[]> {
  const entry = s3InningsCache.get(matchId);
  const ttl = isCompleted ? Infinity : 30_000;
  if (entry && (isCompleted || Date.now() - entry.timestamp < ttl)) return entry.data;

  const parseInning = (raw: any, n: number): InningData | null => {
    const inn = raw[`Innings${n}`];
    if (!inn) return null;
    const extras = (inn.Extras || [])[0] || {};
    const totalStr = (extras.Total as string || "").replace(/\s*Overs\s*/i, " ov");
    const teamName = extras.BattingTeamName || `Innings ${n}`;
    const batting: BattingRow[] = (inn.BattingCard || []).map((b: any) => {
      const name = (b.PlayerName || "").replace(/\s*\([^)]*\)\s*$/, "").trim();
      const notOut = typeof b.OutDesc === "string" && b.OutDesc.toLowerCase().includes("not out");
      const dnb = !notOut && (!b.OutDesc || b.OutDesc === "") && b.Balls === 0 && b.Runs === 0;
      return { name, runs: b.Runs ?? 0, balls: b.Balls ?? 0, fours: b.Fours ?? 0, sixes: b.Sixes ?? 0,
        sr: String(b.StrikeRate ?? "0"), dismissal: b.OutDesc || (notOut ? "not out" : ""), notOut, dnb };
    }).filter((b: BattingRow) => b.name);
    const bowling: BowlingRow[] = (inn.BowlingCard || []).map((b: any) => ({
      name: (b.PlayerName || "").replace(/\s*\([^)]*\)\s*$/, "").trim(), overs: String(b.Overs ?? ""), maidens: b.Maidens ?? 0,
      runs: b.Runs ?? 0, wickets: b.Wickets ?? 0, eco: String(b.Economy ?? ""),
      wides: b.Wides ?? 0, noBalls: b.NoBalls ?? 0,
      dots: b.Dots ?? b.DotBalls ?? 0,
    })).filter((b: BowlingRow) => b.name);
    return { name: `${teamName} Inning ${n}`, total: totalStr, batting, bowling };
  };

  const results: InningData[] = [];
  for (const n of [1, 2]) {
    try {
      const r = await fetch(`${S3_FEEDS_BASE}/${matchId}-Innings${n}.js`, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; IPLFetcher/1.0)" },
        signal: AbortSignal.timeout(5000),
      });
      if (!r.ok) break;
      const parsed = JSON.parse(stripJsonp(await r.text()));
      const inning = parseInning(parsed, n);
      if (inning && (inning.batting.length > 0 || inning.bowling.length > 0)) results.push(inning);
    } catch { break; }
  }

  if (results.length > 0) {
    s3InningsCache.set(matchId, { data: results, timestamp: Date.now(), isCompleted });
  }
  return results;
}

export async function fetchMatchOverview(matchId: string, isCompleted: boolean): Promise<any> {
  const entry = summaryCache.get(matchId);
  const ttl = isCompleted ? Infinity : 30_000;
  if (entry && (isCompleted || Date.now() - entry.timestamp < ttl)) {
    return entry.data;
  }

  try {
    const sumRes = await fetch(
      `${S3_FEEDS_BASE}/${matchId}-matchsummary.js`,
      {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; IPLFetcher/1.0)" },
        signal: AbortSignal.timeout(4000),
      }
    );
    if (!sumRes.ok) return entry?.data ?? null;
    const raw = JSON.parse(stripJsonp(await sumRes.text()));
    const ms = (raw.MatchSummary || [])[0] || {};
    const overview = {
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
    summaryCache.set(matchId, { data: overview, timestamp: Date.now(), isCompleted });
    return overview;
  } catch (_) {
    return entry?.data ?? null;
  }
}

router.get("/ipl/scorecard/:matchId", async (req, res) => {
  const { matchId } = req.params;
  const cached = pointsCache.processedMatches[matchId];
  const isCompleted = !!cached;

  // Fetch IPL S3 innings (official, has full catches) + overview in parallel
  const [s3Innings, overview] = await Promise.all([
    fetchIplS3Innings(matchId, isCompleted).catch(() => [] as InningData[]),
    fetchMatchOverview(matchId, isCompleted).catch(() => null),
  ]);

  // Write fresh S3 innings back to the persistent cache so the stats endpoint
  // always reflects the final scorecard (fixes mid-innings snapshot freezes).
  if (isCompleted && s3Innings.length > 0) {
    pointsCache.processedMatches[matchId] = { ...cached, innings: s3Innings };
    saveCache(pointsCache);
  }

  // Use live S3 innings if available; fall back to processed match cache
  const innings = s3Innings.length > 0 ? s3Innings : (cached?.innings || []);
  res.json({ matchId, overview, innings, hasScorecard: innings.length > 0 });
});

// ── All-IPL stats engine — covers EVERY completed match from S3 ──────────────
// Uses the shared s3InningsCache (same as scorecard endpoint) — no duplicate fetches.
let statsRefreshing = false;
let statsLastRefresh = 0;

async function doRefreshAllStats(force = false): Promise<{ matchesFetched: number; errors: number }> {
  if (statsRefreshing) return { matchesFetched: 0, errors: 0 };
  if (!force && Date.now() - statsLastRefresh < 5 * 60 * 1000) return { matchesFetched: s3InningsCache.size, errors: 0 };
  statsRefreshing = true;
  let fetched = 0;
  let errors = 0;
  try {
    const schedRes = await fetch(`${S3_FEEDS_BASE}/${IPL_COMP_ID}-matchschedule.js`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; IPLFetcher/1.0)" },
      signal: AbortSignal.timeout(12000),
    });
    if (!schedRes.ok) return { matchesFetched: 0, errors: 1 };
    const schedData = JSON.parse(stripJsonp(await schedRes.text()));
    const allMatches: any[] = schedData?.Matchsummary || [];
    const completedIds: string[] = allMatches
      .filter((m: any) => {
        const s = String(m?.MatchStatus || "").toLowerCase();
        return s === "post" || s === "result" || s === "completed" || s === "match over";
      })
      .map((m: any) => String(m?.MatchID || ""))
      .filter(Boolean);
    console.log(`[stats-refresh] Found ${completedIds.length} completed matches to fetch from S3`);
    if (force) s3InningsCache.clear();
    const batchSize = 4;
    for (let i = 0; i < completedIds.length; i += batchSize) {
      const batch = completedIds.slice(i, i + batchSize);
      await Promise.all(batch.map(async (matchId) => {
        if (!force && s3InningsCache.has(matchId)) return;
        try {
          const innings = await fetchIplS3Innings(matchId, true); // completed = Infinity TTL
          if (innings.length > 0) fetched++;
        } catch { errors++; }
      }));
    }
    statsLastRefresh = Date.now();
    console.log(`[stats-refresh] Done: ${s3InningsCache.size} matches in cache, ${errors} errors`);
  } catch (e) {
    console.error("[stats-refresh] Schedule fetch failed:", e);
    errors++;
  } finally {
    statsRefreshing = false;
  }
  return { matchesFetched: fetched, errors };
}

// Warm the stats cache on startup
doRefreshAllStats().catch(() => {});

function buildStatsResponse() {
  const ALL_FANTASY_NAMES = Object.values(FANTASY_TEAMS_EXPORT).flatMap(t => t);
  const battingStats: Record<string, { runs: number; fours: number; sixes: number; balls: number; innings: number; notOuts: number; hs: number; team: string }> = {};
  const bowlingStats: Record<string, { wickets: number; balls: number; runs: number; innings: number; bestW: number; bestR: number }> = {};
  const catchesStats: Record<string, number> = {};
  // Per-player accumulated fantasy points computed from per-match batting+bowling
  const playerFantasyPts: Record<string, number> = {};

  const allMatchIds = new Set([
    ...s3InningsCache.keys(),
    ...Object.keys(pointsCache.processedMatches),
  ]);

  for (const matchId of allMatchIds) {
    const s3Entry = s3InningsCache.get(matchId);
    const processed = pointsCache.processedMatches[matchId];
    const inningsToUse: InningData[] = s3Entry?.data ?? processed?.innings ?? [];

    // Build per-player stats for this match to compute fantasy pts accurately
    const matchStats: Record<string, PlayerStats> = {};
    const getMs = (k: string) => {
      if (!matchStats[k]) matchStats[k] = { played: true, runs: 0, balls: 0, fours: 0, sixes: 0, duck: false, wickets: 0, dots: 0, lbwBowled: 0, maidens: 0, ballsBowled: 0, runsConceded: 0, catches: 0, runOuts: 0, sharedRunOuts: 0, stumpings: 0 };
      return matchStats[k];
    };

    for (const inning of inningsToUse) {
      const inningTeam = (inning.name || "").replace(/ Inning \d+$/, "").trim();
      for (const bat of inning.batting || []) {
        if (bat.dnb || !bat.name) continue;
        const k = bat.name.replace(/\s*\(.*?\)\s*/g, " ").trim();
        if (!k) continue;
        if (!battingStats[k]) battingStats[k] = { runs: 0, fours: 0, sixes: 0, balls: 0, innings: 0, notOuts: 0, hs: 0, team: inningTeam };
        battingStats[k].runs += bat.runs || 0;
        battingStats[k].fours += bat.fours || 0;
        battingStats[k].sixes += bat.sixes || 0;
        battingStats[k].balls += bat.balls || 0;
        battingStats[k].innings += 1;
        if (bat.notOut) battingStats[k].notOuts += 1;
        if ((bat.runs || 0) > battingStats[k].hs) battingStats[k].hs = bat.runs || 0;
        // Per-match fantasy pts accumulation
        const ms = getMs(k);
        ms.runs += bat.runs || 0;
        ms.balls += bat.balls || 0;
        ms.fours += bat.fours || 0;
        ms.sixes += bat.sixes || 0;
        if (!bat.notOut && (bat.runs || 0) === 0 && (bat.balls || 0) > 0) ms.duck = true;
      }
      for (const bowl of inning.bowling || []) {
        if (!bowl.name) continue;
        const k = bowl.name.replace(/\s*\(.*?\)\s*/g, " ").trim();
        if (!k) continue;
        if (!bowlingStats[k]) bowlingStats[k] = { wickets: 0, balls: 0, runs: 0, innings: 0, bestW: 0, bestR: 999 };
        const bowlBalls = parseOversTooBalls(bowl.overs || "0");
        bowlingStats[k].wickets += bowl.wickets || 0;
        bowlingStats[k].balls += bowlBalls;
        bowlingStats[k].runs += bowl.runs || 0;
        bowlingStats[k].innings += 1;
        if ((bowl.wickets || 0) > bowlingStats[k].bestW ||
            ((bowl.wickets || 0) === bowlingStats[k].bestW && (bowl.runs || 0) < bowlingStats[k].bestR)) {
          bowlingStats[k].bestW = bowl.wickets || 0;
          bowlingStats[k].bestR = bowl.runs || 0;
        }
        // Per-match fantasy pts accumulation
        const ms = getMs(k);
        ms.wickets += bowl.wickets || 0;
        ms.dots += bowl.dots || 0;
        ms.maidens += bowl.maidens || 0;
        ms.ballsBowled += bowlBalls;
        ms.runsConceded += bowl.runs || 0;
      }
    }

    // Compute and accumulate fantasy pts for each player in this match
    for (const [name, stats] of Object.entries(matchStats)) {
      playerFantasyPts[name] = (playerFantasyPts[name] || 0) + calcPoints(stats);
    }

    // Accumulate catches from dismissal strings in innings data (covers all IPL players)
    for (const inning of inningsToUse) {
      for (const bat of inning.batting || []) {
        const d: string = bat.dismissal || "";
        // "c & b Jacob Duffy" — caught-and-bowled, credit to bowler
        if (d.startsWith("c & b ")) {
          const bowler = d.slice(6).trim();
          if (bowler) catchesStats[bowler] = (catchesStats[bowler] || 0) + 1;
        // "c Phil Salt b Jacob Duffy" — regular catch, fielder is between "c " and " b "
        } else if (d.startsWith("c ") && d.includes(" b ")) {
          const fielder = d.slice(2, d.indexOf(" b ")).trim();
          if (fielder) catchesStats[fielder] = (catchesStats[fielder] || 0) + 1;
        }
      }
    }
  }

  const isFantasy = (name: string) => ALL_FANTASY_NAMES.some(n => namesMatch(n, name));

  const batters = Object.entries(battingStats).map(([name, s]) => ({
    name, runs: s.runs, fours: s.fours, sixes: s.sixes, balls: s.balls,
    innings: s.innings, notOuts: s.notOuts, hs: s.hs, team: s.team,
    avg: s.innings > s.notOuts ? +(s.runs / (s.innings - s.notOuts)).toFixed(1) : s.runs,
    sr: s.balls > 0 ? +((s.runs / s.balls) * 100).toFixed(1) : 0,
    isFantasy: isFantasy(name),
    fantasyPts: playerFantasyPts[name] ?? 0,
  }));

  const ballsToOversDisplay = (balls: number) => `${Math.floor(balls / 6)}.${balls % 6}`;
  const bowlers = Object.entries(bowlingStats).map(([name, s]) => ({
    name, wickets: s.wickets, balls: s.balls, runs: s.runs, innings: s.innings,
    overs: ballsToOversDisplay(s.balls),
    eco: s.balls > 0 ? +((s.runs * 6 / s.balls)).toFixed(2) : 0,
    avg: s.wickets > 0 ? +(s.runs / s.wickets).toFixed(1) : 999,
    best: `${s.bestW}/${s.bestR === 999 ? 0 : s.bestR}`,
    isFantasy: isFantasy(name),
    fantasyPts: playerFantasyPts[name] ?? 0,
  }));

  const catchesLeader = Object.entries(catchesStats)
    .map(([name, catches]) => ({ name, catches, isFantasy: isFantasy(name), fantasyPts: playerFantasyPts[name] ?? 0 }))
    .sort((a, b) => b.catches - a.catches)
    .filter(e => e.catches > 0);

  return {
    orangeCap: [...batters].sort((a, b) => b.runs - a.runs || b.sr - a.sr),
    purpleCap: [...bowlers].sort((a, b) => b.wickets - a.wickets || a.eco - b.eco),
    sixesLeader: [...batters].sort((a, b) => b.sixes - a.sixes),
    foursLeader: [...batters].sort((a, b) => b.fours - a.fours),
    catchesLeader,
    srLeader: [...batters].filter(b => b.balls >= 10).sort((a, b) => b.sr - a.sr),
    ecoLeader: [...bowlers].filter(b => b.balls >= 12).sort((a, b) => a.eco - b.eco),
    matchesProcessed: s3InningsCache.size,
    timestamp: new Date().toISOString(),
  };
}

router.get("/ipl/stats", (_req, res) => {
  // Always check if we should refresh (respects 5-min TTL, fires in background)
  if (!statsRefreshing) doRefreshAllStats().catch(() => {});
  res.json(buildStatsResponse());
});

// Admin: force re-fetch all innings from S3 and rebuild stats cache
router.post("/ipl/stats/refresh", async (req, res) => {
  try {
    const result = await doRefreshAllStats(true);
    res.json({ ok: true, ...result, matchesInCache: s3InningsCache.size });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || "Unknown error" });
  }
});

const FANTASY_TEAMS_EXPORT: Record<string, string[]> = {
  rajveer: ["Rajat Patidar","Axar Patel","Shubman Gill","Jos Buttler","Yuzvendra Chahal","Jacob Bethell","Bhuvneshwar Kumar","Shreyas Iyer","Cameron Green","Nicholas Pooran","Phil Salt","Krunal Pandya","Priyansh Arya","Vaibhav Suryavanshi","Dhruv Jurel","Mohammed Shami","Tim David","Deepak Chahar"],
  mombasa: ["Jitesh Sharma","Varun Chakravarthy","Marco Jansen","Arshdeep Singh","Shivam Dube","Riyan Parag","Abhishek Sharma","Prabhsimran Singh","Nehal Wadhera","Shimron Hetmyer","Sai Sudharsan","Will Jacks","Prasidh Krishna","Aiden Markram","Rashid Khan","Ajinkya Rahane","Trent Boult","Tilak Varma"],
  mumbai: ["Rishabh Pant","Dewald Brevis","Rohit Sharma","Sherfane Rutherford","Rinku Singh","Heinrich Klaasen","Nitish Rana","Ruturaj Gaikwad","Lungi Ngidi","Mohammed Siraj","Harshal Patel","Tristan Stubbs","Sanju Samson","Prashant Veer","Ishan Kishan","Hardik Pandya","Finn Allen","Venkatesh Iyer"],
  ponygoat: ["Marcus Stoinis","Yashasvi Jaiswal","Tim Seifert","Virat Kohli","Shashank Singh","Sunil Narine","Suryakumar Yadav","Jasprit Bumrah","Ravindra Jadeja","Travis Head","KL Rahul","Ryan Rickelton","Mitchell Marsh","Khaleel Ahmed","Kuldeep Yadav","Washington Sundar","T Natarajan"],
};

// ── Live match poller (called by ipl.ts every 30 s when a match is active) ───
let liveRefreshInProgress = false;

export async function refreshLiveMatches(liveIplIds: string[]): Promise<void> {
  if (liveIplIds.length === 0 || liveRefreshInProgress) return;
  liveRefreshInProgress = true;
  try {
    if (Date.now() - lastPointsCacheReload > 5000) {
      pointsCache = loadCache();
      lastPointsCacheReload = Date.now();
    }
    const supabaseLinkedNow = new Set(
      Object.values(pointsCache.supabaseScores || {}).map(f => f.linkedIplId).filter(Boolean) as string[]
    );
    for (const iplId of liveIplIds) {
      const meta = (pointsCache.matchMetadata || {})[iplId];
      const isSupabaseCovered = supabaseLinkedNow.has(iplId);
      try {
        const s3Innings = await fetchIplS3Innings(iplId, false); // 30-second TTL for live
        if (s3Innings.length > 0) {
          const matchData = processInningsForPoints(
            s3Innings, FANTASY_PLAYER_NAMES,
            meta?.teamA || "", meta?.teamB || ""
          );
          pointsCache.processedMatches[iplId] = isSupabaseCovered
            ? { points: {}, innings: matchData.innings, playerStats: matchData.playerStats }
            : matchData;
          console.log(`[live-poll] Match ${iplId} S3 updated: ${s3Innings.length} innings, ${Object.keys(matchData.points).length} pts`);
          saveCache(pointsCache);
        }
      } catch (_) {}
    }
  } finally {
    liveRefreshInProgress = false;
  }
}

// POST /api/ipl/scorecard/prefetch-s3 — prefetch IPL S3 innings for all known match IDs (admin only)
router.post("/ipl/scorecard/prefetch-s3", async (req, res) => {
  if (req.headers["x-owner-id"] !== "rajveer") return res.status(403).json({ error: "Forbidden" });

  const allIds = Object.keys(pointsCache.matchMetadata || {});
  if (allIds.length === 0) return res.json({ ok: true, found: 0, missing: 0, foundIds: [], missingIds: [] });

  const foundIds: string[] = [];
  const missingIds: string[] = [];

  // Fetch each match sequentially to avoid hammering S3
  for (const matchId of allIds) {
    const isCompleted = !!pointsCache.processedMatches[matchId];
    // Check cache first; only refetch if not already cached
    const cached = s3InningsCache.get(matchId);
    if (cached && cached.data.length > 0) {
      foundIds.push(matchId);
      continue;
    }
    try {
      // fetchIplS3Innings checks its own in-memory cache, fetches from S3 if needed, and stores result
      const innings = await fetchIplS3Innings(matchId, isCompleted);
      if (innings.length > 0) foundIds.push(matchId);
      else missingIds.push(matchId);
    } catch {
      missingIds.push(matchId);
    }
    // Small delay to be polite to S3
    await new Promise(r => setTimeout(r, 80));
  }

  console.log(`[prefetch-s3] Done: ${foundIds.length} found, ${missingIds.length} missing`);
  res.json({ ok: true, found: foundIds.length, missing: missingIds.length, foundIds, missingIds });
});

router.post("/ipl/points/reset", async (req, res) => {
  if (req.headers["x-owner-id"] !== "rajveer") return res.status(403).json({ error: "Forbidden" });
  pointsCache = {
    seriesId: null, processedMatches: {},
    supabaseScores: {}, playerIdMap: {}, matchMetadata: {},
    lastUpdated: "",
  };
  lastUpdateAttempt = 0;
  saveCache(pointsCache);
  res.json({ ok: true });
});

// POST /api/ipl/points/sync-supabase — force an immediate Supabase AuctionRoom sync (anyone, 30 s cooldown)
router.post("/ipl/points/sync-supabase", async (req, res) => {
  const now = Date.now();
  if (now - lastForceSyncAt < 30_000) {
    const retryIn = Math.ceil((lastForceSyncAt + 30_000 - now) / 1000);
    return res.json({ ok: true, skipped: true, retryIn, changed: false, fixturesBefore: 0, fixturesAfter: 0 });
  }
  lastForceSyncAt = now;
  // Guard: mark update in progress so the GET /ipl/points handler won't call
  // loadCache() and replace the module-level pointsCache while we're mid-await.
  pointsUpdateInProgress = true;
  try {
    console.log("[sync] Force Supabase sync triggered");
    // Capture a local reference NOW — before the long awaits — so we always operate
    // on the same object even if the module-level pointsCache is somehow reassigned.
    const cache = pointsCache;
    const before = Object.keys(cache.supabaseScores || {}).length;
    const changed = await syncAuctionRoomScores(cache, true); // force=true: re-fetch ALL fixtures
    const after = Object.keys(cache.supabaseScores || {}).length;
    // Immediately link fixtures → IPL IDs and clear stale live-fetch points so the
    // overwrite is visible on the very next /api/ipl/points call, not just the next poll.
    await linkSupabaseFixtures(cache);
    cache.lastUpdated = new Date().toISOString();
    pointsCache = cache; // ensure module-level var is in sync
    saveCache(cache);
    // Reset cooldown so next regular poll runs fresh
    lastUpdateAttempt = 0;
    res.json({ ok: true, changed, fixturesBefore: before, fixturesAfter: after });
  } catch (err: any) {
    console.error("[admin] Force Supabase sync error:", err);
    res.status(500).json({ error: err.message || "Sync failed" });
  } finally {
    pointsUpdateInProgress = false;
  }
});

export default router;
