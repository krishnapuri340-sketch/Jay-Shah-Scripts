import { Router, type IRouter } from "express";
import { randomInt } from "crypto";
import { readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { fetchMatchOverview, refreshLiveMatches, getPointsHealthSnapshot, getMatchTeamPoints } from "./ipl-points";
import { sendPushToAll } from "./push";
import { createSession, getSessionUser, requireSession, requireCommissioner } from "../lib/sessions";
import { db, predictions, userPins } from "@workspace/db";
import bcrypt from "bcryptjs";

const TEAM_LOGO: Record<string, string> = {
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

const RANK_LABEL = ["1st", "2nd", "3rd", "4th"];
const OWNER_LABELS: Record<string, string> = { rajveer: "Raj", mombasa: "Rahul", mumbai: "Smeet", ponygoat: "Deb" };

// ── Notification builders (factual, professional cricket-app style) ──────────
// No banter, no jokes. Just the facts: who, what, score, context.

function tossTitle(home: string, away: string): string {
  return `Toss · ${home} vs ${away}`;
}

function tossBody(rawToss: string): string {
  // Normalise common cricapi phrasings into a compact factual line.
  // Examples in:  "Delhi Capitals won the toss and elected to bat"
  //              "Punjab Kings won the toss and chose to field"
  return rawToss
    .replace(/\s+won the toss and elected to\s+/i, " won the toss, elected to ")
    .replace(/\s+won the toss and chose to\s+/i, " won the toss, chose to ")
    .trim();
}

function liveTitle(home: string, away: string): string {
  return `Live · ${home} vs ${away}`;
}

function liveBody(toss: string | undefined | null): string {
  if (!toss) return "Match underway.";
  return toss
    .replace(/\s+won the toss and elected to\s+/i, " won toss, elected to ")
    .replace(/\s+won the toss and chose to\s+/i, " won toss, chose to ")
    .trim();
}

function inningsBreakTitle(home: string, away: string): string {
  return `Innings break · ${home} vs ${away}`;
}

function inningsBreakBody(inn1Code: string, inn1Summary: string, inn2Code: string, target: number | null): string {
  if (!target) return `${inn1Code} ${inn1Summary} · ${inn2Code} to bat`;
  return `${inn1Code} ${inn1Summary} · ${inn2Code} need ${target} to win`;
}

function resultTitle(home: string, away: string): string {
  return `Result · ${home} vs ${away}`;
}

function resultBody(resultText: string): string {
  return resultText;
}

function pointsTitle(matchLabel: string): string {
  return `Fantasy points · ${matchLabel}`;
}

function pointsBody(sorted: [string, number][]): string {
  return sorted
    .map(([id, pts], i) => `${RANK_LABEL[i] || `${i + 1}`} ${OWNER_LABELS[id] || id} +${pts}`)
    .join(" · ");
}

// ── Shared data stores ────────────────────────────────────────────────────────
// Anchor data directory to the bundle file location (dist/index.mjs).
const _bundleDir2 = fileURLToPath(new URL(".", import.meta.url));
const _dataDir = (() => {
  const dir = join(_bundleDir2, "../ipl-data");
  try { mkdirSync(dir, { recursive: true }); } catch {}
  return dir;
})();

// ── Predictions — PostgreSQL-backed, in-memory broadcast cache ────────────────
type PredStore = Record<string, Record<string, string | null>>;
let predsCache: PredStore = {};

// ── SSE push ───────────────────────────────────────────────────────────────────
const sseClients = new Set<any>();
function broadcastPredictions() {
  const payload = `data: ${JSON.stringify(predsCache)}\n\n`;
  for (const res of sseClients) {
    try { res.write(payload); } catch { sseClients.delete(res); }
  }
}

async function loadPredsFromDB(): Promise<PredStore> {
  try {
    const rows = await db.select().from(predictions);
    const store: PredStore = {};
    for (const row of rows) {
      if (!store[row.matchId]) store[row.matchId] = {};
      store[row.matchId][row.userId] = row.pick ?? null;
    }
    return store;
  } catch (e) {
    console.error("[preds] DB load failed:", e);
    return {};
  }
}

async function savePredToDB(matchId: string, userId: string, pick: string | null): Promise<void> {
  await db.insert(predictions)
    .values({ matchId, userId, pick, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [predictions.matchId, predictions.userId],
      set: { pick, updatedAt: new Date() },
    });
}

// One-time migration: seed DB from legacy flat file if it exists and DB is empty.
async function seedPredsFromLegacyFile(): Promise<void> {
  const PRED_FILE = join(_dataDir, "ipl-predictions.json");
  try {
    if (!existsSync(PRED_FILE)) return;
    const file: PredStore = JSON.parse(readFileSync(PRED_FILE, "utf8"));
    for (const [matchId, picks] of Object.entries(file)) {
      for (const [userId, pick] of Object.entries(picks)) {
        await db.insert(predictions)
          .values({ matchId, userId, pick: pick ?? null, updatedAt: new Date() })
          .onConflictDoUpdate({
            target: [predictions.matchId, predictions.userId],
            set: { pick: pick ?? null, updatedAt: new Date() },
          });
      }
    }
    const total = Object.values(file).reduce((n, p) => n + Object.keys(p).length, 0);
    console.log(`[preds] Seeded ${total} rows from file → DB`);
    // Self-clean: remove file so it doesn't re-run on next restart
    try { require("fs").unlinkSync(PRED_FILE); } catch {}
  } catch (e) {
    console.warn("[preds] Seed from file failed:", e);
  }
}

// Startup: load from DB; also apply seed file if present (upserts missing/override rows).
(async () => {
  try {
    // Run seeder first if file present — allows one-shot retroactive inserts
    await seedPredsFromLegacyFile();
    let dbPreds = await loadPredsFromDB();
    if (Object.keys(dbPreds).length === 0) {
      dbPreds = await loadPredsFromDB();
    }
    predsCache = dbPreds;
    console.log(`[preds] Loaded from DB: ${Object.keys(predsCache).length} matches`);
  } catch (e) {
    console.error("[preds] Startup failed:", e);
  }
})();

// ── PINs — PostgreSQL-backed with bcrypt hashing ──────────────────────────────
const OWNER_IDS = ["rajveer", "mombasa", "mumbai", "ponygoat"];
// In-memory hash cache — avoids a DB round-trip on every login attempt.
let pinHashCache: Record<string, string> = {};

async function savePinHashToDB(userId: string, hash: string): Promise<void> {
  await db.insert(userPins)
    .values({ userId, pinHash: hash, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: userPins.userId,
      set: { pinHash: hash, updatedAt: new Date() },
    });
}

// Legacy KV helpers — used only during one-time PIN migration.
const REPLIT_DB_URL = process.env.REPLIT_DB_URL;
async function legacyKvGet(key: string): Promise<string | null> {
  if (!REPLIT_DB_URL) return null;
  try {
    const r = await fetch(`${REPLIT_DB_URL}/${encodeURIComponent(key)}`, { signal: AbortSignal.timeout(6000) });
    return r.ok ? r.text() : null;
  } catch { return null; }
}
async function legacyKvList(prefix: string): Promise<string[]> {
  if (!REPLIT_DB_URL) return [];
  try {
    const r = await fetch(`${REPLIT_DB_URL}?prefix=${encodeURIComponent(prefix)}`, { signal: AbortSignal.timeout(6000) });
    if (!r.ok) return [];
    return (await r.text()).split("\n").map(k => k.trim()).filter(Boolean);
  } catch { return []; }
}
async function loadLegacyPinsFromKV(): Promise<Record<string, string> | null> {
  try {
    const keys = await legacyKvList("pin_");
    if (!keys.length) return null;
    const store: Record<string, string> = {};
    await Promise.all(keys.map(async key => {
      const userId = key.slice("pin_".length);
      const val = await legacyKvGet(key);
      if (val && /^\d{4,}$/.test(val)) store[userId] = val;
    }));
    return Object.keys(store).length ? store : null;
  } catch { return null; }
}
function loadLegacyPinsFromFile(): Record<string, string> {
  const PINS_FILE = join(_dataDir, "ipl-pins.json");
  try {
    if (existsSync(PINS_FILE)) {
      const stored = JSON.parse(readFileSync(PINS_FILE, "utf8")) as Record<string, string>;
      const out: Record<string, string> = {};
      for (const [uid, pin] of Object.entries(stored)) {
        if (/^\d{4,}$/.test(pin)) out[uid] = pin;
      }
      if (Object.keys(out).length) return out;
    }
  } catch {}
  return {};
}

// Startup: load hashes from DB; if empty, hash + migrate from KV / file / generate fresh.
(async () => {
  try {
    const rows = await db.select().from(userPins);
    if (rows.length > 0) {
      for (const row of rows) pinHashCache[row.userId] = row.pinHash;
      console.log(`[pins] Loaded from DB: ${Object.keys(pinHashCache).join(", ")}`);
      return;
    }
    // DB empty — migrate plaintext from KV or file and hash them.
    const kv   = await loadLegacyPinsFromKV();
    const file = loadLegacyPinsFromFile();
    const merged = { ...file, ...(kv || {}) };
    if (Object.keys(merged).length > 0) {
      console.log("[pins] Migrating legacy PINs → DB with bcrypt hashing...");
      for (const [userId, pin] of Object.entries(merged)) {
        const hash = await bcrypt.hash(pin, 10);
        pinHashCache[userId] = hash;
        await savePinHashToDB(userId, hash);
      }
      console.log("[pins] Migrated:", Object.keys(pinHashCache).join(", "));
    } else {
      // Completely fresh deployment — generate cryptographically random PINs.
      console.log("[pins] ⚠️  First-run: generating random PINs (treat as secrets):");
      for (const uid of OWNER_IDS) {
        const pin = String(randomInt(1000, 10000));
        const hash = await bcrypt.hash(pin, 10);
        pinHashCache[uid] = hash;
        await savePinHashToDB(uid, hash);
        console.log(`[pins]   ${uid}: ${pin.slice(0, 2)}** (full PIN in DB — change via Settings)`);
      }
    }
  } catch (e) {
    console.error("[pins] Startup failed:", e);
  }
})();

// Exported for potential use by other modules (async — bcrypt comparison).
export async function verifyOwnerPin(ownerId: string, pin: string): Promise<boolean> {
  if (!ownerId || !pin) return false;
  const hash = pinHashCache[ownerId];
  if (!hash) return false;
  return bcrypt.compare(pin, hash);
}

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
const CACHE_TTL_IDLE = 30 * 1000;  // 30 s when no live match
const CACHE_TTL_LIVE = 5 * 1000;   //  5 s when a match is active
let matchesRefreshing = false;
let currentLiveIplIds: string[] = []; // updated by each doRefreshMatches run
let completedMatchIds = new Set<string>(); // updated by each doRefreshMatches run

// ── Push notification state tracking ──────────────────────────────────────────
const prevMatchStates = new Map<string, { started: boolean; ended: boolean; scoreCount: number; toss: string | null }>();
const pendingPointsTimers = new Map<string, ReturnType<typeof setTimeout>>();
let pushBootstrapDone = false; // skip first run so we don't push on server restart

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
    // Track live IPL match IDs for S3 live polling
    currentLiveIplIds = allMatches
      .filter((m: any) => m.matchStarted && !m.matchEnded)
      .map((m: any) => m.id);
    // Pre-warm scorecard overview cache for completed matches
    const completedIds = allMatches.filter((m: any) => m.matchEnded).map((m: any) => m.id);
    completedMatchIds = new Set(completedIds); // keep module-level set in sync
    for (const id of completedIds) {
      fetchMatchOverview(id, true).catch(() => {});
    }
    // Pull fresh S3 innings for each live match
    if (currentLiveIplIds.length > 0) {
      refreshLiveMatches(currentLiveIplIds).catch(() => {});
    }

    // ── Push notifications on match state transitions ─────────────────────────
    if (pushBootstrapDone) {
      for (const m of allMatches) {
        const prev = prevMatchStates.get(m.id);
        const nowLive = m.matchStarted && !m.matchEnded;
        const nowEnded = !!m.matchEnded;

        const nowScoreCount = Array.isArray(m.score) ? m.score.length : 0;

        if (prev) {
          const wentLive = !prev.started && nowLive;
          const wentEnded = !prev.ended && nowEnded;
          const inningsBreak = nowLive && (prev as any).scoreCount < 2 && nowScoreCount >= 2;
          const tossCame = !prev.toss && !!m.toss && !m.matchStarted;

          if (tossCame) {
            const home = m.homeTeamCode || "";
            const away = m.awayTeamCode || "";
            sendPushToAll({
              title: tossTitle(home, away),
              body: tossBody(m.toss as string),
              tag: `toss-${m.id}`,
              url: "/fixtures",
              image: TEAM_LOGO[home] || TEAM_LOGO[away],
            }).catch(() => {});
          }

          if (wentLive) {
            const home = m.homeTeamCode || "";
            const away = m.awayTeamCode || "";
            sendPushToAll({
              title: liveTitle(home, away),
              body: liveBody(m.toss),
              tag: `live-${m.id}`,
              url: "/",
              image: TEAM_LOGO[home] || TEAM_LOGO[away],
            }).catch(() => {});
          }

          if (inningsBreak) {
            const home = m.homeTeamCode || "";
            const away = m.awayTeamCode || "";
            const inn1Summary = m.score?.[0]?.summary || "";
            const inn1Code = m.score?.[0]?.inning?.replace(" Innings", "").trim() || home;
            const inn2Code = m.score?.[1]?.inning?.replace(" Innings", "").trim() || away;
            const runsMatch = inn1Summary.match(/^(\d+)/);
            const runs = runsMatch ? parseInt(runsMatch[1]) : null;
            const target = runs !== null ? runs + 1 : null;
            sendPushToAll({
              title: inningsBreakTitle(home, away),
              body: inningsBreakBody(inn1Code, inn1Summary, inn2Code, target),
              tag: `innings-${m.id}`,
              url: "/",
              image: TEAM_LOGO[home] || TEAM_LOGO[away],
            }).catch(() => {});
          }

          if (wentEnded) {
            const home = m.homeTeamCode || "";
            const away = m.awayTeamCode || "";
            const rawResult = typeof m.status === "string" && m.status.length > 2 ? m.status : "Match complete";
            sendPushToAll({
              title: resultTitle(home, away),
              body: resultBody(rawResult),
              tag: `result-${m.id}`,
              url: "/",
              image: TEAM_LOGO[home] || TEAM_LOGO[away],
            }).catch(() => {});

            // Schedule delayed points push (90 s — gives Supabase time to sync)
            if (!pendingPointsTimers.has(m.id)) {
              const matchId = String(m.id);
              const matchLabel = `${home} vs ${away}`;
              const homeLogo = TEAM_LOGO[home] || TEAM_LOGO[away];
              const timer = setTimeout(async () => {
                pendingPointsTimers.delete(matchId);
                try {
                  const teamPts = getMatchTeamPoints(matchId);
                  if (!teamPts) return;
                  const sorted = Object.entries(teamPts).sort((a, b) => b[1] - a[1]) as [string, number][];
                  await sendPushToAll({
                    title: pointsTitle(matchLabel),
                    body: pointsBody(sorted),
                    tag: `pts-${matchId}`,
                    url: "/",
                    image: homeLogo,
                  });
                } catch (_) {}
              }, 90_000);
              pendingPointsTimers.set(m.id, timer);
            }
          }
        }

        prevMatchStates.set(m.id, { started: m.matchStarted, ended: nowEnded, scoreCount: nowScoreCount, toss: m.toss || null });
      }
    } else {
      // Bootstrap: seed state without firing notifications
      for (const m of allMatches) {
        const sc = Array.isArray(m.score) ? m.score.length : 0;
        prevMatchStates.set(m.id, { started: m.matchStarted, ended: !!m.matchEnded, scoreCount: sc, toss: m.toss || null });
      }
      pushBootstrapDone = true;
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
    } else if (Date.now() - cache.timestamp >= (currentLiveIplIds.length > 0 ? CACHE_TTL_LIVE : CACHE_TTL_IDLE)) {
      // Stale — fire background refresh but respond immediately with old data
      doRefreshMatches().catch(() => {});
    }
    if (cache) {
      // ETag = cache timestamp (changes whenever doRefreshMatches replaces the cache)
      const etag = `W/"m-${cache.timestamp}"`;
      res.setHeader("ETag", etag);
      res.setHeader("Cache-Control", "no-cache");
      if (req.headers["if-none-match"] === etag) {
        res.status(304).end();
        return;
      }
      res.json(cache.data);
      return;
    }
    res.status(503).json({ error: "Match data loading, try again shortly", matches: [] });
  } catch (err: any) {
    req.log.error({ err }, "Failed to fetch IPL matches");
    res.status(500).json({ error: "Failed to fetch match data", matches: [] });
  }
});

let standingsCache: { data: any; timestamp: number } | null = null;
const STANDINGS_TTL = 60 * 1000; // 60 s
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

// GET /api/ipl/predictions → returns all picks (authenticated users only)
router.get("/ipl/predictions", (req, res) => {
  if (!requireSession(req, res)) return;
  res.json(predsCache);
});

// GET /api/ipl/predictions/stream → SSE push channel (authenticated users only)
// Token passed as ?token=<session-token> query param (EventSource cannot set headers)
router.get("/ipl/predictions/stream", (req, res) => {
  const userId = getSessionUser(req);
  if (!userId) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
  // Send current state immediately so client is up-to-date on connect
  res.write(`data: ${JSON.stringify(predsCache)}\n\n`);
  sseClients.add(res);
  // Keepalive ping every 25 s so proxies don't drop the connection
  const hb = setInterval(() => {
    try { res.write(": ping\n\n"); } catch { clearInterval(hb); sseClients.delete(res); }
  }, 25_000);
  req.on("close", () => { clearInterval(hb); sseClients.delete(res); });
});

const VALID_OWNER_IDS = new Set(["rajveer", "mombasa", "mumbai", "ponygoat"]);

// POST /api/ipl/predictions/:matchId → { ownerId, pick }
router.post("/ipl/predictions/:matchId", (req, res) => {
  const sessionUserId = requireSession(req, res);
  if (!sessionUserId) return;
  const { matchId } = req.params;
  const { ownerId, pick } = req.body as { ownerId?: string; pick?: string | null };
  if (!matchId || !ownerId) return res.status(400).json({ error: "matchId and ownerId required" });
  if (!VALID_OWNER_IDS.has(ownerId)) return res.status(400).json({ error: "Invalid ownerId" });
  const isCommissioner = sessionUserId === "rajveer";
  // Non-commissioner users can only edit their own prediction rows
  if (!isCommissioner && ownerId !== sessionUserId) {
    return res.status(403).json({ error: "You can only edit your own predictions" });
  }
  // Block prediction changes for completed matches (commissioner bypass allowed)
  if (!isCommissioner && completedMatchIds.has(matchId)) {
    return res.status(403).json({ error: "Match already completed — predictions are locked" });
  }
  // Block prediction changes once a match has started (commissioner bypass allowed)
  if (!isCommissioner && currentLiveIplIds.includes(matchId)) {
    return res.status(403).json({ error: "Match is live — predictions are locked" });
  }
  // Validate pick against the two teams actually playing in this match
  if (pick != null) {
    const matchData = (cache?.data?.matches || []).find((m: any) => String(m.id) === matchId);
    if (matchData) {
      const validTeams = new Set([matchData.homeTeamCode, matchData.awayTeamCode].filter(Boolean));
      if (!validTeams.has(pick)) {
        return res.status(400).json({ error: `Invalid pick: ${pick} is not playing in this match` });
      }
    }
  }
  if (!predsCache[matchId]) predsCache[matchId] = {};
  predsCache[matchId][ownerId] = pick ?? null;
  broadcastPredictions(); // push to all open SSE sessions instantly
  savePredToDB(matchId, ownerId, pick ?? null).catch(e => console.error("[preds] DB save failed:", e));
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

function ownerOnly(req: any, res: any, targetUserId?: string): boolean {
  const sessionUserId = getSessionUser(req);
  if (!sessionUserId) {
    res.status(401).json({ error: "Authentication required" });
    return false;
  }
  // Commissioner can change anyone's PIN; owners can only change their own
  if (sessionUserId === "rajveer" || sessionUserId === targetUserId) {
    return true;
  }
  res.status(403).json({ error: "Forbidden" });
  return false;
}

// GET /api/ipl/pins → { userId: true/false } — which owners have a PIN set (commissioner-only)
router.get("/ipl/pins", (req, res) => {
  if (!requireCommissioner(req, res)) return;
  const result: Record<string, boolean> = {};
  for (const uid of OWNER_IDS) result[uid] = !!pinHashCache[uid];
  res.json(result);
});

// POST /api/ipl/pins/validate → { userId, pin } — validate PIN with bcrypt (rate-limited)
router.post("/ipl/pins/validate", async (req, res) => {
  const ip = String(req.ip || req.socket.remoteAddress || "unknown");
  if (!checkRateLimit(ip)) return res.status(429).json({ error: "Too many attempts — try again in a minute" });
  const { userId, pin } = req.body as { userId?: string; pin?: string };
  if (!userId || !pin) return res.status(400).json({ error: "userId and pin required" });
  const hash = pinHashCache[userId];
  if (!hash) return res.status(401).json({ error: "Invalid PIN" });
  const correct = await bcrypt.compare(pin, hash);
  if (!correct) return res.status(401).json({ error: "Invalid PIN" });
  const token = createSession(userId);
  return res.json({ ok: true, userId, token });
});

// POST /api/ipl/pins/:userId → { pin, oldPin } — change PIN (owner or commissioner; bcrypt-verified oldPin)
router.post("/ipl/pins/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!ownerOnly(req, res, userId)) return;
  const { pin, oldPin } = req.body as { pin?: string; oldPin?: string };
  if (!userId || !pin || !/^\d{4}$/.test(pin)) return res.status(400).json({ error: "userId and 4-digit pin required" });
  if (!oldPin) return res.status(400).json({ error: "Current PIN (oldPin) required" });
  const currentHash = pinHashCache[userId];
  if (!currentHash) return res.status(401).json({ error: "No PIN set for this user" });
  const matches = await bcrypt.compare(oldPin, currentHash);
  if (!matches) return res.status(401).json({ error: "Current PIN does not match" });
  const newHash = await bcrypt.hash(pin, 10);
  pinHashCache[userId] = newHash;
  await savePinHashToDB(userId, newHash);
  console.log(`[pins] ${userId} PIN updated successfully`);
  return res.json({ ok: true });
});

// ── Health detail endpoint ───────────────────────────────────────────────────
// GET /api/health/detail — full system snapshot for the Admin tab and ops checks
router.get("/health/detail", (_req, res) => {
  const points = getPointsHealthSnapshot();
  const matchesAgeMs = cache ? Date.now() - cache.timestamp : null;
  const standingsAgeMs = standingsCache ? Date.now() - standingsCache.timestamp : null;
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    matches: {
      hasCache: !!cache,
      cacheAgeMs: matchesAgeMs,
      liveMatchIds: currentLiveIplIds,
      completedMatchCount: completedMatchIds.size,
    },
    standings: {
      hasCache: !!standingsCache,
      cacheAgeMs: standingsAgeMs,
    },
    predictions: {
      matchCount: Object.keys(predsCache).length,
      sseClients: sseClients.size,
    },
    pins: {
      userCount: Object.keys(pinHashCache).length,
    },
    points,
  });
});

export default router;
