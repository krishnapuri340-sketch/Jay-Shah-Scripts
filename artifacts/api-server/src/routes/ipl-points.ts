import { Router, type IRouter } from "express";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { sendPushToAll } from "./push";

const TEAM_NAME_TO_CODE: Record<string, string> = {
  "Rajasthan Royals": "RR", "Chennai Super Kings": "CSK", "Mumbai Indians": "MI",
  "Kolkata Knight Riders": "KKR", "Sunrisers Hyderabad": "SRH",
  "Royal Challengers Bengaluru": "RCB", "Royal Challengers Bangalore": "RCB",
  "Delhi Capitals": "DC", "Punjab Kings": "PBKS",
  "Lucknow Super Giants": "LSG", "Gujarat Titans": "GT",
};
const TEAM_LOGO_SERVER: Record<string, string> = {
  CSK:  "https://upload.wikimedia.org/wikipedia/en/thumb/2/2b/Chennai_Super_Kings_Logo.svg/330px-Chennai_Super_Kings_Logo.svg.png",
  MI:   "https://upload.wikimedia.org/wikipedia/en/thumb/c/cd/Mumbai_Indians_Logo.svg/330px-Mumbai_Indians_Logo.svg.png",
  KKR:  "https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/Kolkata_Knight_Riders_Logo.svg/330px-Kolkata_Knight_Riders_Logo.svg.png",
  RCB:  "https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/Royal_Challengers_Bengaluru_Logo.svg/330px-Royal_Challengers_Bengaluru_Logo.svg.png",
  RR:   "https://upload.wikimedia.org/wikipedia/en/thumb/5/5c/This_is_the_logo_for_Rajasthan_Royals%2C_a_cricket_team_playing_in_the_Indian_Premier_League_%28IPL%29.svg/330px-This_is_the_logo_for_Rajasthan_Royals%2C_a_cricket_team_playing_in_the_Indian_Premier_League_%28IPL%29.svg.png",
  SRH:  "https://upload.wikimedia.org/wikipedia/en/thumb/5/51/Sunrisers_Hyderabad_Logo.svg/330px-Sunrisers_Hyderabad_Logo.svg.png",
  DC:   "https://upload.wikimedia.org/wikipedia/en/thumb/2/2f/Delhi_Capitals.svg/330px-Delhi_Capitals.svg.png",
  PBKS: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/Punjab_Kings_Logo.svg/330px-Punjab_Kings_Logo.svg.png",
  GT:   "https://upload.wikimedia.org/wikipedia/en/thumb/0/09/Gujarat_Titans_Logo.svg/330px-Gujarat_Titans_Logo.svg.png",
  LSG:  "https://upload.wikimedia.org/wikipedia/en/thumb/3/34/Lucknow_Super_Giants_Logo.svg/330px-Lucknow_Super_Giants_Logo.svg.png",
};

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
    .replace(/thangarasu/g, "t")
    // Nitish Kumar Reddy — some feeds omit the middle name "Kumar"
    .replace(/nitish kumar reddy/g, "nitish reddy")
    // Vijaykumar Vyshak — some feeds use initial "V Vyshak"
    .replace(/vijaykumar/g, "v");
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
// Updated after April 23 2026 re-auction: new acquisitions appended
const FANTASY_PLAYER_NAMES = [
  // Rajveer Puri (original)
  "Rajat Patidar", "Axar Patel", "Shubman Gill", "Jos Buttler", "Yuzvendra Chahal",
  "Jacob Bethell", "Bhuvneshwar Kumar", "Shreyas Iyer", "Cameron Green", "Nicholas Pooran",
  "Phil Salt", "Krunal Pandya", "Priyansh Arya", "Vaibhav Suryavanshi", "Dhruv Jurel",
  "Mohammed Shami", "Tim David", "Deepak Chahar",
  // Mombasa K (original)
  "Jitesh Sharma", "Varun Chakravarthy", "Marco Jansen", "Arshdeep Singh", "Shivam Dube",
  "Riyan Parag", "Abhishek Sharma", "Prabhsimran Singh", "Nehal Wadhera", "Shimron Hetmyer",
  "Sai Sudharsan", "Will Jacks", "Prasidh Krishna", "Aiden Markram", "Rashid Khan",
  "Ajinkya Rahane", "Trent Boult", "Tilak Varma",
  // Mumbai Ma (original)
  "Rishabh Pant", "Dewald Brevis", "Rohit Sharma", "Sherfane Rutherford", "Rinku Singh",
  "Heinrich Klaasen", "Nitish Rana", "Ruturaj Gaikwad", "Lungi Ngidi", "Mohammed Siraj",
  "Harshal Patel", "Tristan Stubbs", "Sanju Samson", "Prashant Veer", "Ishan Kishan",
  "Hardik Pandya", "Finn Allen", "Venkatesh Iyer",
  // PonyGoat (original)
  "Marcus Stoinis", "Yashasvi Jaiswal", "Tim Seifert", "Virat Kohli", "Shashank Singh",
  "Sunil Narine", "Suryakumar Yadav", "Jasprit Bumrah", "Ravindra Jadeja", "Travis Head",
  "KL Rahul", "Ryan Rickelton", "Mitchell Marsh", "Khaleel Ahmed", "Kuldeep Yadav",
  "Washington Sundar", "T Natarajan",
  // ── Re-auction acquisitions (April 23, 2026 — M34+ only) ──────────────────
  // PonyGoat acquired
  "Ayush Badoni", "Pathum Nissanka", "Cooper Connolly", "Quinton de Kock", "Anshul Kamboj",
  // Rajveer acquired
  "Jofra Archer", "Devdutt Padikkal", "Nitish Kumar Reddy", "Kagiso Rabada",
  // Mumbai acquired
  "Vijaykumar Vyshak", "Sakib Hussain", "Josh Hazlewood", "Ravi Bishnoi", "Sarfaraz Khan",
  // Mombasa acquired
  "Sameer Rizvi", "Jamie Overton", "Naman Dhir",
];

// IPL 2026 team assignments — used to skip fantasy players whose team isn't in a given match
const PLAYER_TEAMS: Record<string, string> = {
  // RCB
  "Rajat Patidar": "rcb", "Phil Salt": "rcb", "Tim David": "rcb",
  "Bhuvneshwar Kumar": "rcb", "Krunal Pandya": "rcb", "Jacob Bethell": "rcb",
  "Jitesh Sharma": "rcb", "Venkatesh Iyer": "rcb", "Virat Kohli": "rcb",
  "Devdutt Padikkal": "rcb", "Josh Hazlewood": "rcb",
  // GT
  "Shubman Gill": "gt", "Jos Buttler": "gt", "Sai Sudharsan": "gt",
  "Mohammed Siraj": "gt", "Prasidh Krishna": "gt", "Rashid Khan": "gt",
  "Washington Sundar": "gt", "Kagiso Rabada": "gt",
  // RR
  "Vaibhav Suryavanshi": "rr", "Dhruv Jurel": "rr",
  "Riyan Parag": "rr", "Shimron Hetmyer": "rr", "Yashasvi Jaiswal": "rr",
  "Ravindra Jadeja": "rr", "Jofra Archer": "rr", "Ravi Bishnoi": "rr",
  // PBKS
  "Yuzvendra Chahal": "pbks", "Shreyas Iyer": "pbks", "Arshdeep Singh": "pbks", "Priyansh Arya": "pbks",
  "Marco Jansen": "pbks", "Prabhsimran Singh": "pbks", "Nehal Wadhera": "pbks",
  "Marcus Stoinis": "pbks", "Shashank Singh": "pbks",
  "Cooper Connolly": "pbks", "Vijaykumar Vyshak": "pbks",
  // MI
  "Rohit Sharma": "mi", "Jasprit Bumrah": "mi", "Hardik Pandya": "mi",
  "Sherfane Rutherford": "mi", "Will Jacks": "mi", "Trent Boult": "mi",
  "Tilak Varma": "mi", "Suryakumar Yadav": "mi", "Ryan Rickelton": "mi",
  "Deepak Chahar": "mi", "Quinton de Kock": "mi", "Naman Dhir": "mi",
  // SRH
  "Travis Head": "srh", "Abhishek Sharma": "srh", "Ishan Kishan": "srh",
  "Heinrich Klaasen": "srh", "Harshal Patel": "srh",
  "Nitish Kumar Reddy": "srh", "Sakib Hussain": "srh",
  // CSK
  "Sanju Samson": "csk", "Ruturaj Gaikwad": "csk", "Shivam Dube": "csk",
  "Dewald Brevis": "csk", "Prashant Veer": "csk", "Khaleel Ahmed": "csk",
  "Anshul Kamboj": "csk", "Sarfaraz Khan": "csk", "Jamie Overton": "csk",
  // DC
  "Axar Patel": "dc", "KL Rahul": "dc", "Kuldeep Yadav": "dc",
  "Nitish Rana": "dc", "Lungi Ngidi": "dc", "Tristan Stubbs": "dc", "T Natarajan": "dc",
  "Pathum Nissanka": "dc", "Sameer Rizvi": "dc",
  // KKR
  "Sunil Narine": "kkr", "Rinku Singh": "kkr", "Cameron Green": "kkr",
  "Varun Chakravarthy": "kkr", "Ajinkya Rahane": "kkr", "Finn Allen": "kkr",
  "Tim Seifert": "kkr",
  // LSG
  "Nicholas Pooran": "lsg", "Mohammed Shami": "lsg", "Aiden Markram": "lsg",
  "Rishabh Pant": "lsg", "Mitchell Marsh": "lsg", "Ayush Badoni": "lsg",
};

let pointsUpdateInProgress = false;
let lastUpdateAttempt = 0;
let lastForceSyncAt = 0; // guards the force-sync endpoint (5-min cooldown)
const VALID_OWNER_IDS = new Set(["rajveer", "mombasa", "mumbai", "ponygoat"]);

// Known match IDs from the IPL schedule — populated on first stats refresh.
// When non-empty, scorecard requests for unknown IDs are rejected without hitting S3.
const knownMatchIds = new Set<string>();

// Warm the allowlist shortly after server start by fetching just the IPL
// schedule (no innings data). This ensures the scorecard allowlist is active
// immediately, not only after the first full stats-refresh cycle.
async function warmKnownMatchIds(): Promise<void> {
  try {
    const r = await fetch(
      `${S3_FEEDS_BASE}/${IPL_COMP_ID}-matchschedule.js`,
      { signal: AbortSignal.timeout(12_000) },
    );
    if (!r.ok) return;
    const schedule = JSON.parse(stripJsonp(await r.text()));
    const matches: any[] = schedule?.Matchsummary ?? [];
    let added = 0;
    for (const m of matches) {
      const id = String(m?.MatchID ?? "").trim();
      if (id && !knownMatchIds.has(id)) { knownMatchIds.add(id); added++; }
    }
    console.log(`[scorecard-allowlist] Startup warm: ${added} IDs added (total ${knownMatchIds.size})`);
  } catch (_) {
    console.warn("[scorecard-allowlist] Startup warm failed — allowlist will fill on first stats refresh");
  }
}
// Non-blocking: run after the event loop is ready so startup latency is unaffected.
setImmediate(() => warmKnownMatchIds().catch(() => {}));

// Per-IP rate limiter for expensive admin endpoints.
// Tracks request timestamps per IP; prunes stale entries each check.
const ipRateLimits = new Map<string, number[]>();
function checkIpRateLimit(ip: string, windowMs: number, maxCalls: number): boolean {
  const now = Date.now();
  const times = (ipRateLimits.get(ip) || []).filter(t => now - t < windowMs);
  if (times.length >= maxCalls) return false;
  times.push(now);
  ipRateLimits.set(ip, times);
  return true;
}
let isLiveMatchActive = false; // dynamically tracks if any IPL match is currently live
const LIVE_COOLDOWN_MS  = 45 * 1000;       // 45 s during live matches (S3/IPL feed, no API quota)
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
// Negative cache: matchIds that returned no innings data — refreshes after 60 s
const s3MissCache = new Map<string, number>();
const MISS_CACHE_TTL = 60_000;
const MATCHID_RE = /^\d{1,8}$/;

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

  // Reject non-numeric or suspiciously long match IDs immediately
  if (!MATCHID_RE.test(matchId)) {
    res.status(400).json({ error: "invalid matchId" });
    return;
  }

  // Allowlist check: if the schedule has been loaded, reject IDs not in it
  if (knownMatchIds.size > 0 && !knownMatchIds.has(matchId)) {
    res.status(404).json({ error: "unknown match" });
    return;
  }

  // Negative-cache: don't hit upstream again for a recently confirmed miss
  const missAt = s3MissCache.get(matchId);
  if (missAt && Date.now() - missAt < MISS_CACHE_TTL) {
    res.json({ matchId, overview: null, innings: [], hasScorecard: false });
    return;
  }

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

  // Negative-cache: record the miss so rapid re-requests don't hit upstream again
  if (innings.length === 0 && !overview) {
    s3MissCache.set(matchId, Date.now());
  }

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
    // Populate the allowlist with every known IPL match ID (completed + upcoming + live)
    allMatches.map((m: any) => String(m?.MatchID || "")).filter(Boolean)
      .forEach(id => knownMatchIds.add(id));
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
  const dotsStats: Record<string, number> = {};
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
        // Global dots accumulation for leaderboard
        dotsStats[k] = (dotsStats[k] || 0) + (bowl.dots || 0);
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

  const dotsLeader = Object.entries(dotsStats)
    .map(([name, dots]) => ({ name, dots, isFantasy: isFantasy(name), fantasyPts: playerFantasyPts[name] ?? 0 }))
    .filter(e => e.dots > 0)
    .sort((a, b) => b.dots - a.dots);

  return {
    orangeCap: [...batters].sort((a, b) => b.runs - a.runs || b.sr - a.sr),
    purpleCap: [...bowlers].sort((a, b) => b.wickets - a.wickets || a.eco - b.eco),
    sixesLeader: [...batters].sort((a, b) => b.sixes - a.sixes),
    foursLeader: [...batters].sort((a, b) => b.fours - a.fours),
    catchesLeader,
    srLeader: [...batters].filter(b => b.balls >= 10).sort((a, b) => b.sr - a.sr),
    ecoLeader: [...bowlers].filter(b => b.balls >= 12).sort((a, b) => a.eco - b.eco),
    dotsLeader,
    matchesProcessed: s3InningsCache.size,
    timestamp: new Date().toISOString(),
  };
}

router.get("/ipl/stats", (_req, res) => {
  // Always check if we should refresh (respects 5-min TTL, fires in background)
  if (!statsRefreshing) doRefreshAllStats().catch(() => {});
  res.json(buildStatsResponse());
});

router.get("/ipl/stats/miss-of-season", (_req, res) => {
  const stats = buildStatsResponse();
  const fantasy = new Set(FANTASY_PLAYER_NAMES.map(name => normalizeName(name)));
  const rows = [
    ...(stats.orangeCap || []),
    ...(stats.purpleCap || []),
    ...(stats.sixesLeader || []),
    ...(stats.foursLeader || []),
    ...(stats.catchesLeader || []),
    ...(stats.srLeader || []),
    ...(stats.ecoLeader || []),
    ...(stats.dotsLeader || []),
  ] as any[];
  const bestByName = new Map<string, any>();
  for (const row of rows) {
    const name = row?.name ? String(row.name) : "";
    if (!name) continue;
    const key = normalizeName(name);
    if (fantasy.has(key)) continue;
    const pts = Number(row.fantasyPts || 0);
    const existing = bestByName.get(key);
    if (!existing || pts > Number(existing.fantasyPts || 0)) bestByName.set(key, row);
  }
  const top = [...bestByName.values()]
    .sort((a, b) => (b.fantasyPts || 0) - (a.fantasyPts || 0))
    .slice(0, 20);
  res.json({ ok: true, players: top });
});

// Admin: force re-fetch all innings from S3 and rebuild stats cache (commissioner only)
router.post("/ipl/stats/refresh", async (req, res) => {
  if (!requireCommissioner(req, res)) return;
  // IP rate-limit: max 3 forced refreshes per IP per hour
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  if (!checkIpRateLimit(`stats-refresh:${ip}`, 60 * 60 * 1000, 3)) {
    res.status(429).json({ error: "rate limit exceeded — try again later" });
    return;
  }
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

// ── Per-match team points lookup (used by push notifications) ─────────────────
const OWNER_LABELS: Record<string, string> = { rajveer: "Raj", mombasa: "Rahul", mumbai: "Smeet", ponygoat: "Deb" };

export function getMatchTeamPoints(iplId: string): Record<string, number> | null {
  const match = pointsCache.processedMatches[iplId];
  if (!match || Object.keys(match.points || {}).length === 0) return null;
  const totals: Record<string, number> = {};
  for (const [teamId, players] of Object.entries(FANTASY_TEAMS_EXPORT)) {
    totals[teamId] = players.reduce((sum, p) => sum + (match.points[p] || 0), 0);
  }
  return totals;
}

export function getOwnerLabels(): Record<string, string> { return OWNER_LABELS; }

// ── Banter helpers ────────────────────────────────────────────────────────────
function pickOne<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function wicketBanter(lastName: string, runs: number, balls: number, teamCode: string, totalDown: number, dismissal: string): { title: string; body: string } {
  const dis = dismissal.length > 60 ? dismissal.slice(0, 60) + "…" : dismissal;
  if (runs === 0) {
    return {
      title: pickOne([
        `Duck! ${teamCode} ${totalDown} down`,
        `Golden duck — ${teamCode} in trouble`,
        `Out for nothing. ${teamCode} ${totalDown} down`,
      ]),
      body: pickOne([
        `${lastName} walks back without troubling the scorers. Absolutely brutal.`,
        `Zero. Nada. Zilch. ${lastName} gone for a golden duck. Someone hide the bat.`,
        `${lastName} out first ball — did he even see it? ${teamCode} fans in shock.`,
        `The scoreboard did not move for ${lastName}. Painful viewing.`,
        `Nought. ${lastName} out for a duck. ${teamCode} need a miracle.`,
        `${lastName} gone for 0. That's a fantasy points disaster right there.`,
      ]),
    };
  }
  if (runs < 20) {
    return {
      title: pickOne([
        `Gone early — ${teamCode} ${totalDown} down`,
        `${lastName} departs for ${runs} — pressure on`,
        `Early blow for ${teamCode}`,
      ]),
      body: pickOne([
        `${lastName} out for a scratchy ${runs}(${balls}b). Not his day. ${dis}`,
        `${lastName} departs for ${runs} — ${teamCode} desperately need someone to step up.`,
        `${runs}(${balls}b) and walking back to the pavilion. ${dis}`,
        `Couldn't get going. ${lastName} out for ${runs} off ${balls}. ${dis}`,
        `${lastName} barely warmed up before getting out for ${runs}. ${teamCode} wobbling.`,
        `${runs} runs, ${balls} balls, and gone. ${dis} — rough one.`,
      ]),
    };
  }
  if (runs < 50) {
    return {
      title: pickOne([
        `${lastName} out for ${runs} — ${teamCode} ${totalDown} down`,
        `Wicket! ${lastName} gone for ${runs}`,
        `${teamCode} lose another — ${lastName} departs`,
      ]),
      body: pickOne([
        `Had a start but threw it away. ${runs}(${balls}b) · ${dis}`,
        `${lastName} out for ${runs} — classic top-order collapse energy. ${dis}`,
        `${dis} — ${runs}(${balls}b). ${teamCode} fans burying their faces in their hands.`,
        `Looked good for a big one and then… ${runs}(${balls}b). ${dis}`,
        `${lastName} built a platform then handed it back. ${runs} off ${balls}. Infuriating.`,
        `That's a start wasted. ${lastName} gone for ${runs}(${balls}b). ${dis}`,
        `${teamCode} needed more. ${lastName} out for ${runs}. Not ideal.`,
      ]),
    };
  }
  return {
    title: pickOne([
      `Big wicket! ${lastName} gone for ${runs}`,
      `${lastName} out after a belter — ${runs} runs`,
      `${teamCode} lose their key man — ${lastName} gone`,
    ]),
    body: pickOne([
      `After a brilliant ${runs}(${balls}b), ${lastName} has to go. ${dis}`,
      `${lastName} out for ${runs} — what an innings though! ${teamCode} ${totalDown} down.`,
      `${dis} · ${runs}(${balls}b). ${lastName} can hold his head high, the rest of ${teamCode} less so.`,
      `${runs} off ${balls} balls is a proper knock — but ${lastName} is gone. Game on.`,
      `Standing ovation for ${lastName} — ${runs}(${balls}b). But ${teamCode} are now exposed.`,
      `That's the match-defining wicket. ${lastName} departs for ${runs}(${balls}b). ${dis}`,
    ]),
  };
}

function milestoneBanter(lastName: string, runs: number, balls: number, milestone: 50 | 100): { title: string; body: string } {
  if (milestone === 100) {
    return {
      title: pickOne([
        `Century! ${lastName} raises the bat`,
        `Three figures! ${lastName} is unstoppable`,
        `100 up for ${lastName} — what a knock`,
      ]),
      body: pickOne([
        `${runs}(${balls}b)! Pure T20 masterclass — check your fantasy points, this is huge.`,
        `${lastName} goes to three figures off ${balls} balls. Absolutely ridiculous.`,
        `${runs} runs and still going — ${lastName} is on another planet right now.`,
        `A hundred in T20 cricket. ${lastName} making it look easy off ${balls} balls.`,
        `${lastName} brings up the ton! ${runs}(${balls}b) — the crowd is going absolutely mental.`,
        `Fantasy owners rejoice. ${lastName} with a sensational ${runs}(${balls}b). Chef's kiss.`,
      ]),
    };
  }
  return {
    title: pickOne([
      `Fifty! ${lastName} brings up the half-century`,
      `Half ton for ${lastName} — looking dangerous`,
      `50 up for ${lastName}! Eyes on this one`,
    ]),
    body: pickOne([
      `${runs}(${balls}b) and looking very dangerous. Keep an eye on your fantasy team.`,
      `${lastName} reaches 50 off ${balls}. The crowd is loving every bit of this.`,
      `Half-century for ${lastName}! ${runs}(${balls}b) — watch him go.`,
      `${lastName} is in the zone. ${runs} off ${balls} balls and not done yet.`,
      `Fifty up and the bowlers have no answers. ${lastName} on ${runs}(${balls}b).`,
      `${lastName} brings up a brilliant fifty. Fantasy points are cooking. ${runs}(${balls}b).`,
      `That's 50 for ${lastName} and it barely felt like it. ${runs}(${balls}b) — class.`,
    ]),
  };
}

function fivewicketBanter(lastName: string, wickets: number, runs: number, overs: string): { title: string; body: string } {
  return {
    title: pickOne([
      `${wickets}-wicket haul! ${lastName} is on fire`,
      `${lastName} running riot — ${wickets} wickets`,
      `${wickets} down to ${lastName}! Unplayable`,
    ]),
    body: pickOne([
      `${wickets}/${runs} off ${overs} overs. Someone needs to stop this man immediately.`,
      `${lastName} on an absolute rampage — ${wickets}/${runs}. The batting order is in tatters.`,
      `${wickets} wickets for ${lastName}! This is not cricket, this is an execution.`,
      `${overs} overs, ${runs} runs, ${wickets} wickets. ${lastName} putting on a masterclass.`,
      `${lastName} has turned up to work today. ${wickets}/${runs} — brutal, clinical, brilliant.`,
      `The batters have absolutely no idea. ${lastName} with ${wickets}/${runs} off ${overs}.`,
    ]),
  };
}

// ── Live match poller (called by ipl.ts every 30 s when a match is active) ───
let liveRefreshInProgress = false;
// key: `${iplId}-${inningsIndex}` → set of dismissed batsman names already notified
const prevDismissals = new Map<string, Set<string>>();
// key: `${iplId}-${inningsIndex}-${batsmanName}` → highest milestone (50 or 100) already fired
const prevMilestones = new Map<string, number>();
// key: `${iplId}-${inningsIndex}-${bowlerName}` → highest wicket count already notified
const prevBowlerWickets = new Map<string, number>();

// ── Health snapshot: read-only view of internal state for /api/health/detail ──
export function getPointsHealthSnapshot() {
  return {
    s3CacheSize: s3InningsCache.size,
    statsLastRefresh: statsLastRefresh ? new Date(statsLastRefresh).toISOString() : null,
    isLiveMatchActive,
    processedMatchCount: Object.keys(pointsCache.processedMatches || {}).length,
    pointsLastUpdated: pointsCache.lastUpdated || null,
    cooldownMs: getCooldown(),
  };
}

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

          // ── Live innings notifications ──────────────────────────────────────
          const liveInnIdx = matchData.innings.length - 1;
          const liveInn = matchData.innings[liveInnIdx];
          if (liveInn) {
            const teamName = liveInn.name.replace(" Innings", "").trim();
            const teamCode = TEAM_NAME_TO_CODE[teamName] || teamName;
            const logo = TEAM_LOGO_SERVER[teamCode];

            // ── Wicket notifications ──────────────────────────────────────────
            const dismissKey = `${iplId}-${liveInnIdx}`;
            const prevSet = prevDismissals.get(dismissKey) || new Set<string>();
            const nowDismissed = liveInn.batting.filter(
              b => !b.notOut && !b.dnb && b.dismissal && b.dismissal.trim().length > 0
            );
            const newFalls = nowDismissed.filter(b => !prevSet.has(b.name));
            for (const b of newFalls) {
              const totalDown = nowDismissed.length;
              const lastName = b.name.split(" ").slice(-1)[0];
              const { title, body } = wicketBanter(lastName, b.runs, b.balls, teamCode, totalDown, b.dismissal);
              sendPushToAll({ title, body, tag: `wicket-${iplId}-${liveInnIdx}-${totalDown}`, url: "/", image: logo }).catch(() => {});
            }
            prevDismissals.set(dismissKey, new Set(nowDismissed.map(b => b.name)));

            // ── Milestone notifications (50s and 100s) ────────────────────────
            for (const b of liveInn.batting) {
              if (b.dnb || b.runs === undefined) continue;
              const milestoneKey = `${iplId}-${liveInnIdx}-${b.name}`;
              const prevM = prevMilestones.get(milestoneKey) || 0;
              const lastName = b.name.split(" ").slice(-1)[0];
              if (b.runs >= 100 && prevM < 100) {
                prevMilestones.set(milestoneKey, 100);
                const { title, body } = milestoneBanter(lastName, b.runs, b.balls, 100);
                sendPushToAll({ title, body, tag: `century-${iplId}-${b.name}`, url: "/", image: logo }).catch(() => {});
              } else if (b.runs >= 50 && prevM < 50) {
                prevMilestones.set(milestoneKey, 50);
                const { title, body } = milestoneBanter(lastName, b.runs, b.balls, 50);
                sendPushToAll({ title, body, tag: `fifty-${iplId}-${b.name}`, url: "/", image: logo }).catch(() => {});
              }
            }

            // ── 5-wicket haul notifications ───────────────────────────────────
            for (const bwl of (liveInn.bowling || []) as any[]) {
              if ((bwl.wickets || 0) < 5) continue;
              const bowlerKey = `${iplId}-${liveInnIdx}-${bwl.name}`;
              const prevW = prevBowlerWickets.get(bowlerKey) || 0;
              if (bwl.wickets > prevW) {
                prevBowlerWickets.set(bowlerKey, bwl.wickets);
                const lastName = bwl.name.split(" ").slice(-1)[0];
                const { title, body } = fivewicketBanter(lastName, bwl.wickets, bwl.runs, bwl.overs);
                sendPushToAll({ title, body, tag: `fifer-${iplId}-${liveInnIdx}-${bwl.name}`, url: "/", image: logo }).catch(() => {});
              }
            }
          }
        }
      } catch (_) {}
    }
  } finally {
    liveRefreshInProgress = false;
  }
}

// POST /api/ipl/scorecard/prefetch-s3 — prefetch IPL S3 innings for all known match IDs (admin only)
router.post("/ipl/scorecard/prefetch-s3", async (req, res) => {
  if (!requireCommissioner(req, res)) return;

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
  if (!requireCommissioner(req, res)) return;
  pointsCache = {
    seriesId: null, processedMatches: {},
    supabaseScores: {}, playerIdMap: {}, matchMetadata: {},
    lastUpdated: "",
  };
  lastUpdateAttempt = 0;
  saveCache(pointsCache);
  res.json({ ok: true });
});

// POST /api/ipl/points/sync-supabase — force an immediate Supabase AuctionRoom sync
// Requires an authenticated league member session. 5-min global cooldown + per-IP rate limit.
router.post("/ipl/points/sync-supabase", async (req, res) => {
  if (!requireSession(req, res)) return;
  // IP rate-limit: max 5 syncs per IP per hour
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  if (!checkIpRateLimit(`sync-supabase:${ip}`, 60 * 60 * 1000, 5)) {
    res.status(429).json({ error: "rate limit exceeded — try again later" });
    return;
  }
  const now = Date.now();
  const SYNC_COOLDOWN = 5 * 60 * 1000; // 5 minutes global cooldown
  if (now - lastForceSyncAt < SYNC_COOLDOWN) {
    const retryIn = Math.ceil((lastForceSyncAt + SYNC_COOLDOWN - now) / 1000);
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
