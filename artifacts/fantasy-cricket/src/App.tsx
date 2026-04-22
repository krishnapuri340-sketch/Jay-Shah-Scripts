import React, { useState, useEffect, useRef, useMemo } from "react";
import InningsTable from "./components/InningsTable";
import TeamBadge from "./components/TeamBadge";
import HistoryPage from "./pages/History";
import AdminPage from "./pages/Admin";
import StatsPage from "./pages/Stats";
import { FANTASY_TEAMS } from "./teams";
import { applyMultiplier, getTeamData, getMatchWinner, getH2H, fmtDate, fmtTime, getMatchNum, predictNextMatch, predictFirstInningsTotal } from "./utils";
import { IPL_COLORS, IPL_FULL_NAMES, ROLE_ICONS, ROLE_COLORS, IPL_TEAM_BADGE, SWIPEABLE_TABS, IPL_HISTORY, ABBR_TO_TEAM, TEAM_LOGO_CDN, VENUE_AVG } from "./constants";
import WhatIfPage from "./pages/WhatIf";
import FixturesPage from "./pages/Fixtures";
import LineupPreviewCard from "./LineupPreviewCard";

// ─── PIN login ───────────────────────────────────────────────────────────────
const DEFAULT_PINS: Record<string, string> = { rajveer: "1111", mombasa: "2222", mumbai: "3333", ponygoat: "4444" };
function loadPins(): Record<string, string> {
  try { return { ...DEFAULT_PINS, ...JSON.parse(localStorage.getItem("ipl-pins-2026") || "{}") }; } catch { return { ...DEFAULT_PINS }; }
}
function savePins(p: Record<string, string>) { localStorage.setItem("ipl-pins-2026", JSON.stringify(p)); }

function LoginScreen({ onValidate }: { onValidate: (userId: string, pin: string) => Promise<boolean> }) {
  const [sel, setSel] = useState<string | null>(null);
  const [entered, setEntered] = useState("");
  const [shake, setShake] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [checking, setChecking] = useState(false);

  const digit = async (d: string) => {
    if (entered.length >= 4 || checking) return;
    const next = entered + d;
    setEntered(next);
    if (next.length === 4) {
      setChecking(true);
      const ok = await onValidate(sel!, next);
      setChecking(false);
      if (!ok) {
        setShake(true); setWrong(true);
        setTimeout(() => { setShake(false); setEntered(""); setWrong(false); }, 700);
      }
    }
  };
  const back = () => { if (!checking) setEntered(e => e.slice(0, -1)); };

  // ── Cinematic background — image flipped so sky sits at bottom ───────────
  const BASE = import.meta.env.BASE_URL;
  const cinematicBg: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 1000, overflow: "hidden",
  };
  // Inlined bg JSX (not a component — avoids remount/flicker on state changes)
  const bgImg: React.CSSProperties = {
    position: "absolute", left: 0, right: 0,
    top: "12%", height: "100%", width: "100%",
    objectFit: "cover", objectPosition: "center top",
    transform: "scaleY(-1)", pointerEvents: "none", userSelect: "none",
    filter: "blur(14px) brightness(0.62) saturate(1.1)",
  };
  const bgOverlay: React.CSSProperties = {
    position: "absolute", inset: 0, pointerEvents: "none",
    background: `linear-gradient(to bottom,
      rgba(4,2,1,0.98) 0%,
      rgba(4,2,1,0.88) 12%,
      rgba(4,2,1,0.62) 28%,
      rgba(4,2,1,0.32) 44%,
      rgba(4,2,1,0.12) 62%,
      rgba(4,2,1,0.06) 78%,
      rgba(4,2,1,0.22) 100%
    )`,
  };

  if (sel) {
    const ft = FANTASY_TEAMS[sel];
    return (
      <div style={{ ...cinematicBg, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center" }}>
        <img src={`${BASE}login-bg.jpeg`} alt="" style={bgImg} />
        <div style={bgOverlay} />
        <style>{`
          @keyframes login-fade-up { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
          @keyframes pin-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
          .pin-dot-fill { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
          .pin-dot-fill.filled { transform: scale(1.15); }
          .num-key { transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1); }
          .num-key:active { transform: scale(0.88) translateY(2px); }
        `}</style>

        <button onClick={() => { setSel(null); setEntered(""); setWrong(false); }}
          style={{ position: "absolute", top: 22, left: 20, zIndex: 2, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 12, padding: "7px 16px", color: "#d0c0b0", fontSize: "0.72rem", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5, backdropFilter: "blur(24px) saturate(1.4)", WebkitBackdropFilter: "blur(24px) saturate(1.4)" }}>
          ← Back
        </button>

        <div style={{ position: "relative", zIndex: 2, animation: "login-fade-up 0.38s ease-out", display: "flex", flexDirection: "column" as const, alignItems: "center" }}>
          {/* Avatar with warm glow ring */}
          <div style={{ position: "relative", marginBottom: 20 }}>
            <div style={{ position: "absolute", inset: -10, borderRadius: "50%", background: `radial-gradient(circle, ${ft.color}40 0%, transparent 70%)`, filter: "blur(14px)" }} />
            <div style={{ width: 90, height: 90, borderRadius: "50%", border: `2px solid rgba(255,255,255,0.22)`, overflow: "hidden", boxShadow: `0 0 0 5px rgba(255,255,255,0.06), 0 10px 40px rgba(0,0,0,0.5)`, position: "relative" as const, backdropFilter: "blur(4px)" }}>
              <img src={`${import.meta.env.BASE_URL}avatars/${ft.avatar}`} alt={ft.owner} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center center", display: "block" }} />
            </div>
          </div>

          <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: 4, textShadow: "0 2px 8px rgba(0,0,0,1), 0 4px 24px rgba(0,0,0,0.95)" }}>{ft.owner}</div>
          <div style={{ fontSize: "0.65rem", color: ft.color, letterSpacing: "0.08em", fontWeight: 700, marginBottom: 2, textShadow: "0 1px 6px rgba(0,0,0,0.95), 0 2px 12px rgba(0,0,0,0.8)" }}>{ft.name}</div>
          <div style={{ fontSize: "0.56rem", color: "rgba(255,255,255,0.8)", letterSpacing: "0.2em", marginBottom: 40, fontWeight: 700, textTransform: "uppercase" as const, textShadow: "0 1px 6px rgba(0,0,0,1)" }}>Enter your PIN</div>

          {/* PIN dots */}
          <div className={shake ? "pin-dot-shake" : ""} style={{ display: "flex", gap: 20, marginBottom: wrong ? 10 : 44, animation: shake ? "pin-shake 0.55s ease" : "none" }}>
            {[0,1,2,3].map(i => (
              <div key={i} className={`pin-dot-fill ${i < entered.length ? "filled" : ""}`} style={{
                width: 16, height: 16, borderRadius: "50%",
                background: i < entered.length ? ft.color : "transparent",
                border: `2px solid ${i < entered.length ? ft.color : "rgba(255,255,255,0.25)"}`,
                boxShadow: i < entered.length ? `0 0 14px ${ft.color}70` : "none",
              }} />
            ))}
          </div>

          {wrong && <div style={{ fontSize: "0.65rem", color: "#ff8888", marginBottom: 18, letterSpacing: "0.04em", fontWeight: 600, textShadow: "0 1px 8px rgba(0,0,0,0.6)" }}>✕ Wrong PIN — try again</div>}
          {checking && <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.4)", marginBottom: 12, letterSpacing: "0.06em" }}>Checking…</div>}

          {/* Numpad — frosted glass keys */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 76px)", gap: 12, width: "fit-content", opacity: checking ? 0.4 : 1, pointerEvents: checking ? "none" : "auto" }}>
            {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k, i) => (
              k === "" ? <div key={i} /> :
              <button key={i} className="num-key" onClick={() => k === "⌫" ? back() : digit(k)} style={{
                background: k === "⌫" ? "rgba(255,80,80,0.15)" : "rgba(255,255,255,0.11)",
                border: `1px solid ${k === "⌫" ? "rgba(255,100,100,0.3)" : "rgba(255,255,255,0.22)"}`,
                borderRadius: 22, width: 76, height: 76,
                fontSize: k === "⌫" ? "1.2rem" : "1.65rem", fontWeight: 300,
                color: k === "⌫" ? "#ff8888" : "#fff",
                cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center",
                backdropFilter: "blur(32px) saturate(1.8)",
                WebkitBackdropFilter: "blur(32px) saturate(1.8)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 20px rgba(0,0,0,0.25)",
              }}>{k}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...cinematicBg, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
      <img src={`${BASE}login-bg.jpeg`} alt="" style={bgImg} />
      <div style={bgOverlay} />
      <style>{`
        @keyframes login-fade-up { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        @keyframes team-card-in { from { opacity:0; transform:scale(0.88) translateY(18px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes welcome-pop { from { opacity:0; transform:scale(0.88) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes login-icon-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .team-card { transition: all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1) !important; position: relative; overflow: hidden; -webkit-backdrop-filter: blur(36px) saturate(1.8); backdrop-filter: blur(36px) saturate(1.8); }
        .team-card::before { content: ""; position: absolute; inset: 0; background: linear-gradient(160deg, rgba(255,255,255,0.07) 0%, transparent 55%); opacity: 0; transition: opacity 0.25s ease; border-radius: inherit; }
        .team-card:hover { transform: translateY(-4px) scale(1.01) !important; }
        .team-card:hover::before { opacity: 1; }
        .team-card:active { transform: scale(0.95) !important; transition: all 0.1s ease !important; }
      `}</style>

      {/* Logo area */}
      {(() => {
        const savedId = localStorage.getItem("ipl-current-user");
        const savedTeam = savedId ? FANTASY_TEAMS[savedId] : null;
        return (
          <div style={{ position: "relative", zIndex: 2, animation: "login-fade-up 0.35s ease-out", display: "flex", flexDirection: "column" as const, alignItems: "center", marginBottom: savedTeam ? 28 : 44 }}>
            {/* spinning ring icon */}
            <div style={{ position: "relative", width: 92, height: 92, marginBottom: 20 }}>
              {/* Outer ambient glow */}
              <div style={{ position: "absolute", inset: -14, borderRadius: 40, background: "radial-gradient(circle, rgba(245,166,35,0.25) 0%, transparent 65%)", filter: "blur(10px)" }} />
              {/* Static full gold ring — always visible, with outer squared glow */}
              <div style={{ position: "absolute", inset: -2, borderRadius: 28, background: "rgba(245,166,35,0.38)", boxShadow: "0 0 0 1px rgba(245,166,35,0.5), 0 0 12px 3px rgba(245,166,35,0.35), 0 0 28px 6px rgba(245,166,35,0.18)" }} />
              {/* Inner clip — rounded square, covers center leaving only the ring visible */}
              <div style={{ position: "absolute", inset: 2.5, borderRadius: 25.5, background: "#100d08", overflow: "hidden" }}>
                <img
                  src={`${import.meta.env.BASE_URL}app-icon.png`}
                  alt="Indian Premier League"
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 10%", display: "block", transform: "scale(1.08)", transformOrigin: "center top" }}
                />
              </div>
            </div>

            <div style={{ fontSize: "1.45rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.01em", lineHeight: 1.15, fontFamily: "'Inter', sans-serif", textTransform: "uppercase", textAlign: "center", textShadow: "0 2px 8px rgba(0,0,0,1), 0 4px 32px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,1)" }}>
              Indian Premier League
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
              <div style={{ width: 36, height: 1, background: "linear-gradient(90deg, transparent, rgba(245,166,35,0.8))" }} />
              <div style={{ fontSize: "0.63rem", color: "#f5a623", letterSpacing: "0.28em", fontWeight: 800, textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}>2026 SEASON</div>
              <div style={{ width: 36, height: 1, background: "linear-gradient(270deg, transparent, rgba(245,166,35,0.8))" }} />
            </div>

            {savedTeam && (
              <div style={{
                marginTop: 20,
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(46,204,143,0.1)", border: "1px solid rgba(46,204,143,0.25)",
                borderRadius: 24, padding: "7px 18px",
                animation: "welcome-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.15s both",
                backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#2ecc8f", boxShadow: "0 0 10px rgba(46,204,143,0.6)", flexShrink: 0 }} />
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#2ecc8f", letterSpacing: "0.01em" }}>
                  Welcome back, {savedTeam.owner}!
                </span>
              </div>
            )}
          </div>
        );
      })()}

      {/* Label */}
      <div style={{ position: "relative", zIndex: 2, fontSize: "0.56rem", letterSpacing: "0.2em", color: "#fff", textTransform: "uppercase" as const, marginBottom: 18, marginTop: -28, fontWeight: 800, animation: "login-fade-up 0.4s ease-out", textShadow: "0 1px 6px rgba(0,0,0,1), 0 2px 16px rgba(0,0,0,0.9)" }}>
        Select your team
      </div>

      {/* Team cards — glass cards with warm border */}
      <div style={{ position: "relative", zIndex: 2, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, width: "100%", maxWidth: 400 }}>
        {Object.values(FANTASY_TEAMS).map((ft, idx) => (
          <button key={ft.id} className="team-card" onClick={() => setSel(ft.id)} style={{
            background: "rgba(8,5,3,0.25)",
            border: "1px solid rgba(255,255,255,0.18)",
            borderRadius: 24, padding: "26px 16px 22px",
            cursor: "pointer", fontFamily: "inherit",
            display: "flex", flexDirection: "column" as const, alignItems: "center",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -1px 0 rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.4)",
            animation: `team-card-in 0.55s cubic-bezier(0.2, 0.8, 0.2, 1) ${idx * 0.09 + 0.1}s both`,
            backdropFilter: "blur(36px) saturate(1.8)",
            WebkitBackdropFilter: "blur(36px) saturate(1.8)",
          }}>
            <div style={{ width: 66, height: 66, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.22)", overflow: "hidden", marginBottom: 14, boxShadow: "0 0 0 4px rgba(255,255,255,0.06), 0 6px 24px rgba(0,0,0,0.45)", flexShrink: 0, position: "relative" as const }}>
              <img src={`${import.meta.env.BASE_URL}avatars/${ft.avatar}`} alt={ft.owner} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center center", display: "block" }} />
            </div>
            <div style={{ fontSize: "1rem", fontWeight: 800, color: "#fff", marginBottom: 5, letterSpacing: "-0.02em", textShadow: "0 1px 12px rgba(0,0,0,0.7)" }}>{ft.owner}</div>
            <div style={{ fontSize: "0.62rem", color: ft.color, fontWeight: 700, lineHeight: 1.4, letterSpacing: "0.04em" }}>{ft.name}</div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 24, zIndex: 2, fontSize: "0.52rem", color: "rgba(255,200,120,0.25)", letterSpacing: "0.1em", fontWeight: 600 }}>
        IPL 2026 · Private League
      </div>
    </div>
  );
}

// ── Module-level constants & pure utilities (never re-created on render) ─────

const PULL_THRESHOLD = 72;

const TABS = [
  { id: "home",     label: "Leaderboard" },
  { id: "teams",    label: "Teams"        },
  { id: "fixtures", label: "Matches"      },
  { id: "stats",    label: "Stats"        },
  { id: "history",  label: "History"      },
  { id: "whatif",   label: "What If"      },
];

const NAV_ICON: Record<string, JSX.Element> = {
  home: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8M12 17v4M17 3h3v5c0 2.5-1.5 4-4 4M7 3H4v5c0 2.5 1.5 4 4 4"/><path d="M7 3h10v8a5 5 0 0 1-10 0V3z"/>
    </svg>
  ),
  teams: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87"/>
    </svg>
  ),
  fixtures: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  ),
  stats: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6"/>
    </svg>
  ),
  history: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
  whatif: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/>
      <circle cx="12" cy="12" r="10"/>
    </svg>
  ),
};

interface PlayerStats {
  played: boolean; runs: number; balls: number; fours: number; sixes: number;
  duck: boolean; wickets: number; dots: number; lbwBowled: number;
  maidens: number; ballsBowled: number; runsConceded: number;
  catches: number; runOuts: number; stumpings: number;
}

const rankLabel = (i: number) => i === 0 ? "first" : i === 1 ? "second" : i === 2 ? "third" : "";

const buildMatchPreviews = (matches: any[]) =>
  matches.map((match: any) => {
    const teamInfo: any[] = match.teamInfo || [];
    const playingTeams = new Set(teamInfo.map((ti: any) => (ti.shortname || "").toUpperCase()));
    const preview = Object.values(FANTASY_TEAMS).map(ft => ({
      team: ft,
      activePlayers: ft.players.filter(p => playingTeams.has(p.ipl.toUpperCase()))
    })).filter(x => x.activePlayers.length > 0);
    return { match, playingTeams: [...playingTeams], preview };
  }).filter(item => item.playingTeams.length > 0);

// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState("home");
  const [wiSection, setWiSection] = useState<"swap" | "permatch" | "intel">("swap");
  const [wiTeamId, setWiTeamId] = useState("rajveer");
  const [altCap, setAltCap] = useState("");
  const [altVC, setAltVC] = useState("");
  const [perMatchCaps, setPerMatchCaps] = useState<Record<string, Record<number, { cap: string; vc: string }>>>({});
  const [expandedWiMatch, setExpandedWiMatch] = useState<number | null>(null);
  const [historyYear, setHistoryYear] = useState<number | null>(null);
  const [histTop10Tab, setHistTop10Tab] = useState<"bat" | "bwl">("bat");
  const [selectedTeam, setSelectedTeam] = useState("rajveer");
  const [fixtureHomeAwayFilter, setFixtureHomeAwayFilter] = useState<"all" | "home" | "away">("all");
  const [playerPoints, setPlayerPoints] = useState<Record<string, number>>({});
  const [playerMatchPoints, setPlayerMatchPoints] = useState<Record<string, Array<{ matchNum: number; label: string; pts: number; source: string; stats?: PlayerStats }>>>({});
  const [iplIdToMatchNum, setIplIdToMatchNum] = useState<Record<string, number>>({});
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [expandedBdMatches, setExpandedBdMatches] = useState<Set<string>>(new Set());
  const [scoringGuideOpen, setScoringGuideOpen] = useState(false);
  const [benchOpen, setBenchOpen] = useState(false);
  const [matchPtsOpen, setMatchPtsOpen] = useState(false);
  const [teamSection, setTeamSection] = useState<"xi"|"bench"|"matchpts">("xi");
  const [expandedMatchNums, setExpandedMatchNums] = useState<Set<number>>(new Set());
  const [expandedAdminPlayer, setExpandedAdminPlayer] = useState<string | null>(null);
  const [adminBreakdownOpen, setAdminBreakdownOpen] = useState(false);
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [supabaseSyncing, setSupabaseSyncing] = useState(false);
  const [statsRefreshing, setStatsRefreshing] = useState(false);
  const [statsTabRefreshing, setStatsTabRefreshing] = useState(false);
  const [supabaseSyncMsg, setSupabaseSyncMsg] = useState<string | null>(null);
  const [s3Prefetching, setS3Prefetching] = useState(false);
  const [s3PrefetchResult, setS3PrefetchResult] = useState<{ found: number; missing: number; foundIds: string[]; missingIds: string[] } | null>(null);
  const [chartHover, setChartHover] = useState<number | null>(null);
  const [selectedAwardIdx, setSelectedAwardIdx] = useState(0);
  const [awardXiFilter, setAwardXiFilter] = useState<"all" | "xi">("all");
  const [chartXiFilter, setChartXiFilter] = useState<"all" | "xi">("all");
  const [collapsedInnings, setCollapsedInnings] = useState<Set<string>>(new Set());
  const [openScoreRows, setOpenScoreRows] = useState<Set<string>>(new Set());
  const [pointsUpdating, setPointsUpdating] = useState(false);
  const [pendingMatches, setPendingMatches] = useState(0);
  const [nextAttempt, setNextAttempt] = useState<string | null>(null);
  const [processedMatches, setProcessedMatches] = useState<string[]>([]);
  const [abandonedMatchIds, setAbandonedMatchIds] = useState<string[]>([]);

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pointsLastUpdated, setPointsLastUpdated] = useState<Date | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [pointsError, setPointsError] = useState<string | null>(null);
  const [dataSources, setDataSources] = useState<{ iplOfficial: number; liveCount: number; competitionId?: number } | null>(null);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [scorecards, setScorecards] = useState<Record<string, any>>({});
  const [scorecardLoading, setScorecardLoading] = useState<string | null>(null);
  const [standings, setStandings] = useState<any[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [iplStats, setIplStats] = useState<any | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsFilter, setStatsFilter] = useState<"all" | "fantasy" | "predictions">("all");
  const [statsCategory, setStatsCategory] = useState<"fantasyPts" | "orangeCap" | "purpleCap" | "sixesLeader" | "foursLeader" | "catchesLeader" | "srLeader" | "ecoLeader">("fantasyPts");
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [predArchiveOpen, setPredArchiveOpen] = useState(false);
  const [fantasyPtsOpen, setFantasyPtsOpen] = useState(false);
  const [predVisibleCount, setPredVisibleCount] = useState(10);
  const [matchFilter, setMatchFilter] = useState<"upcoming" | "live" | "completed" | "all">("upcoming");
  const [teamFilter, setTeamFilter] = useState<Set<string>>(new Set());
  const toggleTeamFilter = (code: string) => setTeamFilter(prev => {
    const next = new Set(prev);
    if (next.has(code)) next.delete(code); else next.add(code);
    return next;
  });
  const [standingsOpen, setStandingsOpen] = useState(false);
  const [intelOpen, setIntelOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [expandedPredMatchId, setExpandedPredMatchId] = useState<string | null>(null);
  const [expandedFantasyMatchId, setExpandedFantasyMatchId] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<Record<string, Record<string, string | null>>>({});
  const lastPredSaveRef = useRef<number>(0);
  const [predFlash, setPredFlash] = useState<string | null>(null);
  const [predSaveState, setPredSaveState] = useState<Record<string, "saving" | "saved" | "error">>({});

  const [sparkTip, setSparkTip] = useState<{ label: string; pts: number } | null>(null);
  const [pullY, setPullY] = useState(0);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [appInstalled, setAppInstalled] = useState(false);
  const [showToast, setShowToast] = useState(false);
  // Swipe refs
  const swipeStartX = useRef(0);
  const swipeStartY = useRef(0);
  const swipeBlocked = useRef(false);
  const pointsRetryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointsRetryCount = useRef(0);
  // PTR refs
  const pullState = useRef({ active: false, startY: 0, startX: 0 });
  const pullYRef = useRef(0);
  const sparkTipTimer = useRef<ReturnType<typeof setTimeout>>();
  // Always-fresh ref to refresh fn (avoids stale closure in PTR listener)
  const refreshFnRef = useRef(() => {});
  const [countdown, setCountdown] = useState<{ text: string; matchName: string; venue?: string; homeTeam?: string; awayTeam?: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(() => localStorage.getItem("ipl-current-user"));
  const [userPins, setUserPins] = useState<Record<string, string>>(loadPins);
  const [pinEditTarget, setPinEditTarget] = useState<string | null>(null);
  const [pinEditVal, setPinEditVal] = useState("");
  const [pinConfirmVal, setPinConfirmVal] = useState("");
  const [pinStep, setPinStep] = useState<"confirm" | "new">("confirm");
  const [pinConfirmError, setPinConfirmError] = useState(false);
  const resetPinEdit = () => { setPinEditTarget(null); setPinEditVal(""); setPinConfirmVal(""); setPinStep("confirm"); setPinConfirmError(false); };
  const handleLogin = (userId: string) => { localStorage.setItem("ipl-current-user", userId); setCurrentUser(userId); setTab("home"); };
  const handleLogout = () => { localStorage.removeItem("ipl-current-user"); setCurrentUser(null); };
  const handleValidate = async (userId: string, pin: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/ipl/pins/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, pin }),
      });
      if (res.ok) { handleLogin(userId); return true; }
      return false;
    } catch {
      // Fallback to locally cached PINs if server is unreachable
      if (pin === userPins[userId]) { handleLogin(userId); return true; }
      return false;
    }
  };
  const handleConfirmOldPin = async (uid: string) => {
    if (pinConfirmVal.length !== 4) return;
    try {
      const res = await fetch("/api/ipl/pins/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid, pin: pinConfirmVal }),
      });
      if (res.ok) { setPinStep("new"); setPinConfirmError(false); }
      else { setPinConfirmError(true); setPinConfirmVal(""); }
    } catch {
      if (pinConfirmVal === userPins[uid]) { setPinStep("new"); setPinConfirmError(false); }
      else { setPinConfirmError(true); setPinConfirmVal(""); }
    }
  };
  const handleSavePin = async (uid: string) => {
    if (!/^\d{4}$/.test(pinEditVal)) return;
    const updated = { ...userPins, [uid]: pinEditVal };
    setUserPins(updated); savePins(updated);
    const savedOld = pinConfirmVal;
    resetPinEdit();
    try {
      await fetch(`/api/ipl/pins/${encodeURIComponent(uid)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Owner-Id": "rajveer" },
        body: JSON.stringify({ pin: pinEditVal, oldPin: savedOld }),
      });
    } catch (_) {}
  };

  const MAX_POINTS_RETRIES = 4;
  const fetchPoints = async () => {
    if (pointsLoading) return;
    setPointsLoading(true);
    setPointsError(null);
    // Clear any pending retry
    if (pointsRetryTimer.current) { clearTimeout(pointsRetryTimer.current); pointsRetryTimer.current = null; }
    try {
      const res = await fetch("/api/ipl/points");
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (data.error && !data.playerPoints) {
        setPointsError(data.error);
      } else {
        const pp = data.playerPoints || {};
        setPlayerPoints(pp);
        setPlayerMatchPoints(data.playerMatchPoints || {});
        setIplIdToMatchNum(data.iplIdToMatchNum || {});
        setProcessedMatches(data.processedMatches || []);
        setAbandonedMatchIds(data.abandonedMatchIds || []);
        setPointsUpdating(data.updating || false);
        setPendingMatches(data.pendingMatches || 0);
        setNextAttempt(data.nextAttempt || null);
        setPointsLastUpdated(new Date());
        // If data came back empty (server still syncing on startup), retry quickly — but cap attempts
        if (Object.keys(pp).length === 0 && pointsRetryCount.current < MAX_POINTS_RETRIES) {
          pointsRetryCount.current += 1;
          pointsRetryTimer.current = setTimeout(() => {
            pointsRetryTimer.current = null;
            fetchPoints();
          }, 4000);
        } else {
          pointsRetryCount.current = 0; // reset on success
        }
      }
    } catch (e: any) {
      setPointsError("Points fetch failed: " + (e.message || "Unknown error"));
      // Retry on network failure — capped at MAX_POINTS_RETRIES
      if (pointsRetryCount.current < MAX_POINTS_RETRIES) {
        pointsRetryCount.current += 1;
        pointsRetryTimer.current = setTimeout(() => {
          pointsRetryTimer.current = null;
          fetchPoints();
        }, 5000);
      }
    }
    setPointsLoading(false);
  };

  const syncSupabase = async () => {
    if (supabaseSyncing) return;
    setSupabaseSyncing(true);
    setSupabaseSyncMsg(null);
    try {
      const res = await fetch("/api/ipl/points/sync-supabase", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
      const msg = data.changed
        ? `Synced ✓ — ${data.fixturesAfter} fixtures loaded`
        : "Already up to date";
      setSupabaseSyncMsg(msg);
      // Refresh points display after sync
      setTimeout(fetchPoints, 300);
    } catch (e: any) {
      setSupabaseSyncMsg("Sync failed: " + (e.message || "unknown error"));
    }
    setSupabaseSyncing(false);
  };

  const prefetchS3Scorecards = async () => {
    if (s3Prefetching) return;
    setS3Prefetching(true);
    setS3PrefetchResult(null);
    try {
      const res = await fetch("/api/ipl/scorecard/prefetch-s3", {
        method: "POST",
        headers: { "X-Owner-Id": "rajveer" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
      setS3PrefetchResult(data);
    } catch (e: any) {
      setS3PrefetchResult({ found: 0, missing: 0, foundIds: [], missingIds: ["Error: " + (e.message || "unknown")] });
    }
    setS3Prefetching(false);
  };

  const refreshStatsCache = async () => {
    if (statsRefreshing) return;
    setStatsRefreshing(true);
    try {
      await fetch("/api/ipl/stats/refresh", { method: "POST", headers: { "X-Owner-Id": "rajveer" } });
      await fetchStats();
    } catch (_) {}
    setStatsRefreshing(false);
  };

  const handleStatsTabRefresh = async () => {
    if (statsTabRefreshing) return;
    setStatsTabRefreshing(true);
    try {
      await Promise.all([
        fetch("/api/ipl/points").then(r => r.ok ? r.json() : null).then(data => {
          if (!data || (data.error && !data.playerPoints)) return;
          setPlayerPoints(data.playerPoints || {});
          setPlayerMatchPoints(data.playerMatchPoints || {});
          setProcessedMatches(data.processedMatches || []);
          setAbandonedMatchIds(data.abandonedMatchIds || []);
          setPointsUpdating(data.updating || false);
          setPointsLastUpdated(new Date());
        }),
        fetch("/api/ipl/stats").then(r => r.ok ? r.json() : null).then(data => {
          if (data) setIplStats(data);
        }),
      ]);
    } catch (_) {}
    setStatsTabRefreshing(false);
  };

  const fetchLive = async () => {
    if (liveLoading) return;
    setLiveLoading(true);
    setApiError(null);
    try {
      const res = await fetch("/api/ipl/matches");
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const matches: any[] = data.matches || [];
      if (matches.length > 0) {
        setLiveMatches(matches);
        setDataSources(data.sources || null);
        const hasLive = matches.some((m: any) => m.matchStarted && !m.matchEnded);
        setMatchFilter(prev => (prev === "completed" || prev === "all") ? prev : (hasLive ? "live" : "upcoming"));
      } else {
        setApiError("No IPL matches found from official sources.");
      }
      setLastUpdated(new Date());
    } catch (e: any) {
      setApiError("Fetch failed: " + (e.message || "Unknown error"));
    }
    setLiveLoading(false);
  };

  const fetchScorecard = async (matchId: string, force = false) => {
    if (!force && (scorecards[matchId] || scorecardLoading === matchId)) return;
    if (scorecardLoading === matchId) return;
    setScorecardLoading(matchId);
    try {
      const res = await fetch(`/api/ipl/scorecard/${matchId}`);
      if (res.ok) {
        const data = await res.json();
        setScorecards(prev => ({ ...prev, [matchId]: data }));
      }
    } catch (_) {}
    setScorecardLoading(null);
  };

  const fetchStandings = async () => {
    if (standingsLoading) return;
    setStandingsLoading(true);
    try {
      const res = await fetch("/api/ipl/standings");
      if (res.ok) {
        const data = await res.json();
        setStandings(data.standings || []);
      }
    } catch (_) {}
    setStandingsLoading(false);
  };

  const fetchStats = async () => {
    if (statsLoading) return;
    setStatsLoading(true);
    try {
      const res = await fetch("/api/ipl/stats");
      if (res.ok) setIplStats(await res.json());
    } catch (_) {}
    setStatsLoading(false);
  };

  const PRED_CACHE_KEY = "ipl-predictions-2026";
  const loadLocalPreds = (): Record<string, Record<string, string | null>> => {
    try { return JSON.parse(localStorage.getItem(PRED_CACHE_KEY) || "{}"); } catch { return {}; }
  };
  const saveLocalPreds = (data: Record<string, Record<string, string | null>>) => {
    try { localStorage.setItem(PRED_CACHE_KEY, JSON.stringify(data)); } catch {}
  };

  const fetchPredictions = async () => {
    // Don't overwrite a just-saved prediction — wait 8 s for the POST to settle
    if (Date.now() - lastPredSaveRef.current < 8000) return;
    const fetchStartedAt = Date.now();
    try {
      const res = await fetch("/api/ipl/predictions");
      if (res.ok) {
        const server: Record<string, Record<string, string | null>> = await res.json();
        // Re-check guard AFTER the async fetch completes (fetch takes 1-3s)
        if (Date.now() - lastPredSaveRef.current < 8000) return;
        // If a save happened while the fetch was in-flight, abort
        if (fetchStartedAt < lastPredSaveRef.current) return;
        // Server is the source of truth — always use it directly.
        // Local cache is only a fallback for offline use.
        saveLocalPreds(server);
        setPredictions(server);
      }
    } catch (_) {
      // On network failure, use local cache
      const local = loadLocalPreds();
      if (Object.keys(local).length > 0) setPredictions(local);
    }
  };

  const fetchPins = async () => {
    try {
      const res = await fetch("/api/ipl/pins", { headers: { "X-Owner-Id": "rajveer" } });
      if (res.ok) {
        const serverPins = await res.json();
        const merged = { ...DEFAULT_PINS, ...serverPins };
        setUserPins(merged);
        savePins(merged);
      }
    } catch (_) {}
  };

  const toggleMatch = (matchId: string, isCompleted: boolean, isLive = false) => {
    if (expandedMatchId === matchId) {
      setExpandedMatchId(null);
    } else {
      setExpandedMatchId(matchId);
      // Collapse all innings by default so the user taps to open each one
      setCollapsedInnings(prev => {
        const n = new Set(prev);
        n.add(`${matchId}-0`);
        n.add(`${matchId}-1`);
        n.add(`${matchId}-2`);
        return n;
      });
      if (isCompleted || isLive) fetchScorecard(matchId);
    }
  };

  // Auto-refresh scorecard every 30 s while a live match is expanded
  useEffect(() => {
    if (!expandedMatchId) return;
    const liveIds = new Set(
      liveMatches
        .filter((m: any) => m.matchStarted && !m.matchEnded)
        .map((m: any) => String(m.id))
    );
    if (!liveIds.has(expandedMatchId)) return;
    const id = setInterval(() => fetchScorecard(expandedMatchId, true), 10_000);
    return () => clearInterval(id);
  }, [expandedMatchId, liveMatches]);

  // Cleanup retry timer on unmount
  useEffect(() => {
    return () => { if (pointsRetryTimer.current) clearTimeout(pointsRetryTimer.current); };
  }, []);

  useEffect(() => {
    if (!settingsOpen) return;
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [settingsOpen]);

  // Initial fetch — runs on mount AND whenever the user logs in
  useEffect(() => {
    if (!currentUser) return;
    fetchLive();
    fetchPoints();
    fetchStandings();
    fetchStats();
    fetchPredictions();
    if (currentUser === "rajveer") fetchPins();
  }, [currentUser]);

  // Register service worker for PWA offline support — auto-reload on SW update
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
    const onMsg = (e: MessageEvent) => { if (e.data?.type === "SW_UPDATED") window.location.reload(); };
    navigator.serviceWorker.addEventListener("message", onMsg);
    return () => navigator.serviceWorker.removeEventListener("message", onMsg);
  }, []);

  // Adaptive polling — split by data freshness needs:
  //   Live status (fetchLive, standings):  5 s  — S3 feed, server cache 5 s
  //   Points / stats:                     30 s  — server recalculates every 30 s (S3 live cooldown)
  //   Idle (no live match):                5 min — nothing is changing
  const isAnyMatchLive = liveMatches.some((m: any) => m.matchStarted && !m.matchEnded);

  // Reset home/away sub-filter whenever the team filter is changed
  useEffect(() => { setFixtureHomeAwayFilter("all"); }, [teamFilter]);

  useEffect(() => {
    if (!currentUser) return;
    const idleDelay  = 5 * 60_000;  // 5 min when nothing is live
    const liveStatus = 5_000;        //  5 s — match status / scorecard
    const livePoints = 30_000;       // 30 s — aligned with server S3 live cooldown
    if (!isAnyMatchLive) {
      const ids = [
        setInterval(fetchLive,        idleDelay),
        setInterval(fetchPoints,      idleDelay),
        setInterval(fetchStandings,   idleDelay),
        setInterval(fetchStats,       idleDelay),
        setInterval(fetchPredictions, idleDelay),
      ];
      return () => ids.forEach(clearInterval);
    }
    // Live match — faster status, slower points (server cooldown aligned)
    const ids = [
      setInterval(fetchLive,        liveStatus),
      setInterval(fetchStandings,   liveStatus),
      setInterval(fetchPoints,      livePoints),
      setInterval(fetchStats,       livePoints),
      setInterval(fetchPredictions, livePoints),
    ];
    return () => ids.forEach(clearInterval);
  }, [isAnyMatchLive, currentUser]);

  // Refetch stats every time the user opens the stats tab (catches server-side refreshes)
  useEffect(() => {
    if (!currentUser || tab !== "stats") return;
    fetchStats();
  }, [tab, currentUser]);

  // SSE: server pushes predictions to all open sessions instantly on any save
  useEffect(() => {
    if (!currentUser) return;
    const es = new EventSource("/api/ipl/predictions/stream");
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as Record<string, Record<string, string | null>>;
        // Update lastPredSaveRef so the 30s poll fallback doesn't overwrite this fresh push
        lastPredSaveRef.current = Date.now();
        saveLocalPreds(data);
        setPredictions(data);
      } catch {}
    };
    es.onerror = () => {
      // Browser auto-reconnects on error — this is just observability
      console.warn("[SSE] prediction stream error — browser will reconnect automatically");
    };
    return () => es.close();
  }, [currentUser]);

  // Poll predictions on all tabs as fallback (SSE covers normal operation)
  useEffect(() => {
    if (!currentUser) return;
    fetchPredictions(); // immediate fetch on login / tab change
    const id = setInterval(fetchPredictions, 30_000);
    return () => clearInterval(id);
  }, [currentUser]);

  // Fast-poll predictions when the Predictions view is open (picks can change up until match starts)
  useEffect(() => {
    if (!currentUser || !(tab === "stats" && statsFilter === "predictions")) return;
    const id = setInterval(fetchPredictions, 15_000);
    return () => clearInterval(id);
  }, [tab, statsFilter, currentUser]);

  // Refresh when the user returns to the tab after being away
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && currentUser) {
        pointsRetryCount.current = 0; // allow fresh retries after coming back
        fetchLive();
        fetchPoints();
        fetchPredictions();
        fetchStandings();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [currentUser]);

  // Keep refreshFnRef up-to-date every render so PTR always calls the latest version
  useEffect(() => { refreshFnRef.current = () => { fetchLive(); fetchPoints(); }; });

  // PWA install prompt
  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    const onInstalled = () => { setAppInstalled(true); setInstallPrompt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Pull-to-refresh via native touch listeners (needs passive:true so it doesn't block scroll)
  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      pullState.current.active = window.scrollY <= 0;
      pullState.current.startY = e.touches[0].clientY;
      pullState.current.startX = e.touches[0].clientX;
    };
    const onMove = (e: TouchEvent) => {
      if (!pullState.current.active) return;
      const dy = e.touches[0].clientY - pullState.current.startY;
      if (dy <= 0) { pullState.current.active = false; pullYRef.current = 0; setPullY(0); return; }
      const dx = Math.abs(e.touches[0].clientX - pullState.current.startX);
      if (dx > 30) { pullState.current.active = false; pullYRef.current = 0; setPullY(0); return; }
      const clamped = Math.min(dy * 0.45, PULL_THRESHOLD);
      pullYRef.current = clamped;
      setPullY(clamped);
    };
    const onEnd = () => {
      if (pullState.current.active && pullYRef.current >= PULL_THRESHOLD - 5) {
        refreshFnRef.current();
      }
      pullState.current.active = false;
      pullYRef.current = 0;
      setPullY(0);
    };
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
  }, []);

  const teamScores = useMemo(() => Object.keys(FANTASY_TEAMS)
    .map(id => ({ id, ...getTeamData(id, playerPoints), team: FANTASY_TEAMS[id] }))
    .sort((a, b) => b.total - a.total), [playerPoints]);


  // Countdown to next match
  useEffect(() => {
    const update = () => {
      const upcoming = liveMatches
        .filter((m: any) => !m.matchStarted && m.dateTimeGMT)
        .sort((a: any, b: any) => new Date(a.dateTimeGMT).getTime() - new Date(b.dateTimeGMT).getTime())[0];
      if (!upcoming) { setCountdown(null); return; }
      const diff = new Date(upcoming.dateTimeGMT).getTime() - Date.now();
      if (diff <= 0) { setCountdown(null); return; }
      const days = Math.floor(diff / 86400000);
      const hrs = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      const text = days > 0
        ? `${days}D ${String(hrs).padStart(2,"0")}H ${String(mins).padStart(2,"0")}M`
        : `${String(hrs).padStart(2,"0")}:${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`;
      const homeTeam = upcoming.homeTeamCode || upcoming.teamInfo?.[0]?.shortname || "";
      const awayTeam = upcoming.awayTeamCode || upcoming.teamInfo?.[1]?.shortname || "";
      setCountdown({ text, matchName: upcoming.name, venue: upcoming.venue || "", homeTeam, awayTeam });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [liveMatches]);


  // Hot players: scored >= 25 pts in most recent match
  const hotPlayers = useMemo(() => new Set<string>(
    Object.entries(playerMatchPoints)
      .filter(([, matches]) => {
        const sorted = [...matches].sort((a, b) => b.matchNum - a.matchNum);
        return sorted.length > 0 && sorted[0].pts >= 25;
      })
      .map(([name]) => name)
  ), [playerMatchPoints]);

  // Per-team match-by-match cumulative points (for chart)
  const matchHistory = useMemo(() => {
    const allNums = new Set<number>();
    const labels: Record<number, string> = {};
    for (const matches of Object.values(playerMatchPoints)) {
      for (const e of matches) { allNums.add(e.matchNum); labels[e.matchNum] = e.label; }
    }
    const sorted = [...allNums].sort((a, b) => a - b);
    return Object.entries(FANTASY_TEAMS).map(([teamId, team]) => {
      let cum = 0;
      const points = sorted.map(matchNum => {
        let pts = 0;
        for (const player of team.players) {
          const entry = (playerMatchPoints[player.name] || []).find(e => e.matchNum === matchNum);
          if (entry) {
            const p = applyMultiplier(entry.pts, player.name === team.captain, player.name === team.vc);
            pts += p;
          }
        }
        cum += pts;
        return { matchNum, label: `M${matchNum}`, cum };
      });
      return { teamId, color: team.color, name: team.name, emoji: team.emoji, points };
    });
  }, [playerMatchPoints]);

  const [lbRefreshing, setLbRefreshing] = React.useState(false);
  const handleLbRefresh = async () => {
    if (lbRefreshing) return;
    setLbRefreshing(true);
    try {
      await fetch("/api/ipl/points/sync-supabase", { method: "POST" });
    } catch (_) {}
    try {
      await Promise.all([
        fetch("/api/ipl/points").then(r => r.ok ? r.json() : null).then(data => {
          if (!data || (data.error && !data.playerPoints)) return;
          setPlayerPoints(data.playerPoints || {});
          setPlayerMatchPoints(data.playerMatchPoints || {});
          setIplIdToMatchNum(data.iplIdToMatchNum || {});
          setProcessedMatches(data.processedMatches || []);
          setAbandonedMatchIds(data.abandonedMatchIds || []);
          setPointsUpdating(data.updating || false);
          setPendingMatches(data.pendingMatches || 0);
          setPointsLastUpdated(new Date());
        }),
        fetch("/api/ipl/standings").then(r => r.ok ? r.json() : null).then(data => {
          if (data) setStandings(data.standings || data);
        }),
        fetch("/api/ipl/predictions").then(r => r.ok ? r.json() : null).then(data => {
          if (data) { setPredictions(data); saveLocalPreds(data); }
        }),
        fetch("/api/ipl/stats").then(r => r.ok ? r.json() : null).then(data => {
          if (data) setIplStats(data);
        }),
      ]);
    } catch (_) {}
    setLbRefreshing(false);
  };

  const shareLeaderboard = async () => {
    const W = 1080, H = 1000, PAD = 64;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // Load logo
    const logoImg = new Image();
    logoImg.crossOrigin = "anonymous";
    logoImg.src = `${import.meta.env.BASE_URL}app-icon.png`;
    await new Promise(res => { logoImg.onload = res; logoImg.onerror = res; });

    // — Background —
    ctx.fillStyle = "#080c14";
    ctx.fillRect(0, 0, W, H);

    // Gold top line (thin, tasteful)
    const goldGrad = ctx.createLinearGradient(0, 0, W, 0);
    goldGrad.addColorStop(0, "#a07832"); goldGrad.addColorStop(0.5, "#d4a843"); goldGrad.addColorStop(1, "#a07832");
    ctx.fillStyle = goldGrad; ctx.fillRect(0, 0, W, 3);

    // — Header —
    // Logo circle (small, top-left)
    const logoR = 26, logoX = PAD + logoR, logoY = 68;
    ctx.save();
    ctx.beginPath(); ctx.arc(logoX, logoY, logoR, 0, Math.PI * 2); ctx.clip();
    if (logoImg.naturalWidth > 0) ctx.drawImage(logoImg, logoX - logoR, logoY - logoR, logoR * 2, logoR * 2);
    ctx.restore();

    // App name + label (right of logo)
    ctx.textAlign = "left";
    ctx.font = "700 36px -apple-system, Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Indian Premier League 2026", PAD + logoR * 2 + 18, 59);
    ctx.font = "400 23px -apple-system, Arial, sans-serif";
    ctx.fillStyle = "#52525b";
    ctx.fillText("Leaderboard", PAD + logoR * 2 + 18, 88);

    // Timestamp (top-right, muted)
    ctx.textAlign = "right";
    ctx.font = "400 21px -apple-system, Arial, sans-serif";
    ctx.fillStyle = "#3f3f46";
    ctx.fillText(lastUpdated?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) ?? "just now", W - PAD, 88);

    // Thin separator line
    ctx.strokeStyle = "#1c1c20"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, 116); ctx.lineTo(W - PAD, 116); ctx.stroke();

    // — Rows —
    const rowH = 200, startY = 132;

    teamScores.forEach((s, i) => {
      const ry = startY + i * rowH;
      const isFirst = i === 0;

      // Faint rank number (Sofascore-style ghost number, left)
      ctx.textAlign = "left";
      ctx.font = `100 108px -apple-system, Arial, sans-serif`;
      ctx.fillStyle = "#18181b";
      ctx.fillText(String(i + 1), PAD, ry + 130);

      // Color dot
      ctx.beginPath();
      ctx.arc(PAD + 110, ry + 62, 8, 0, Math.PI * 2);
      ctx.fillStyle = s.team.color;
      ctx.fill();

      // Owner name (primary)
      ctx.textAlign = "left";
      ctx.font = `600 52px -apple-system, Arial, sans-serif`;
      ctx.fillStyle = isFirst ? "#ffffff" : "#e4e4e7";
      ctx.fillText(s.team.owner, PAD + 130, ry + 78);

      // Team name (secondary — smaller, muted)
      ctx.font = `400 25px -apple-system, Arial, sans-serif`;
      ctx.fillStyle = "#52525b";
      ctx.fillText(s.team.name, PAD + 130, ry + 116);

      // Points (right)
      ctx.textAlign = "right";
      ctx.font = `700 58px -apple-system, Arial, sans-serif`;
      ctx.fillStyle = isFirst ? "#d4a843" : "#e4e4e7";
      ctx.fillText(String(s.total), W - PAD, ry + 84);

      ctx.font = `400 21px -apple-system, Arial, sans-serif`;
      ctx.fillStyle = "#3f3f46";
      ctx.fillText("pts", W - PAD, ry + 118);

      // Row divider
      if (i < teamScores.length - 1) {
        ctx.strokeStyle = "#111114"; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PAD + 110, ry + rowH - 4);
        ctx.lineTo(W - PAD, ry + rowH - 4);
        ctx.stroke();
      }
    });

    // Bottom gold line
    ctx.fillStyle = goldGrad; ctx.fillRect(0, H - 3, W, 3);

    // Share
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, "image/png"));
    if (!blob) return;
    const file = new File([blob], "ipl-fantasy-leaderboard.png", { type: "image/png" });
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Indian Premier League 2026 — Leaderboard" });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "ipl-fantasy-leaderboard.png";
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
        setShowToast(true); setTimeout(() => setShowToast(false), 2500);
      }
    } catch { /* user cancelled */ }
  };

  const shareTeams = async () => {
    // ── Layout: 2×2 grid, Sofascore-clean style ──
    const W = 1080;
    const CELL_W = W / 2;            // 540px per column, full-bleed
    const HEADER_H = 82;
    const COLOR_BAR = 3;
    const CELL_PAD = 28;
    const TEAM_HDR_H = 66;
    const SEP = 1;
    const PLAYER_ROW_H = 30;
    const N_PLAYERS = 11;
    const CELL_H = COLOR_BAR + TEAM_HDR_H + SEP + N_PLAYERS * PLAYER_ROW_H + 20;
    const H = HEADER_H + CELL_H + SEP + CELL_H + 34;

    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    const logoImg = new Image();
    logoImg.crossOrigin = "anonymous";
    logoImg.src = `${import.meta.env.BASE_URL}app-icon.png`;
    await new Promise(res => { logoImg.onload = res; logoImg.onerror = res; });

    // ── Background ──
    ctx.fillStyle = "#0c0c0e";
    ctx.fillRect(0, 0, W, H);

    // Gold top bar
    const goldGrad = ctx.createLinearGradient(0, 0, W, 0);
    goldGrad.addColorStop(0, "#a07832"); goldGrad.addColorStop(0.5, "#d4a843"); goldGrad.addColorStop(1, "#a07832");
    ctx.fillStyle = goldGrad; ctx.fillRect(0, 0, W, 3);

    // ── Header ──
    const logoR = 20, logoX = 36 + logoR, logoY = HEADER_H / 2;
    ctx.save();
    ctx.beginPath(); ctx.arc(logoX, logoY, logoR, 0, Math.PI * 2); ctx.clip();
    if (logoImg.naturalWidth > 0) ctx.drawImage(logoImg, logoX - logoR, logoY - logoR, logoR * 2, logoR * 2);
    ctx.restore();

    ctx.textAlign = "left";
    ctx.font = "600 24px -apple-system, Arial, sans-serif";
    ctx.fillStyle = "#f4f4f5";
    ctx.fillText("Indian Premier League 2026", 36 + logoR * 2 + 12, logoY - 4);
    ctx.font = "400 14px -apple-system, Arial, sans-serif";
    ctx.fillStyle = "#3f3f46";
    ctx.fillText("All Teams · Top 11", 36 + logoR * 2 + 12, logoY + 16);

    const dateStr = pointsLastUpdated
      ? pointsLastUpdated.toLocaleDateString([], { day: "numeric", month: "short" }) + " · " +
        pointsLastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "–";
    ctx.textAlign = "right";
    ctx.font = "400 13px -apple-system, Arial, sans-serif";
    ctx.fillStyle = "#27272a";
    ctx.fillText(dateStr, W - 36, logoY + 6);

    // Thin header separator
    ctx.strokeStyle = "#18181b"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, HEADER_H); ctx.lineTo(W, HEADER_H); ctx.stroke();

    // Grid dividers (cross hair)
    ctx.strokeStyle = "#18181b"; ctx.lineWidth = 1;
    // Vertical centre
    ctx.beginPath(); ctx.moveTo(W / 2, HEADER_H); ctx.lineTo(W / 2, H - 34); ctx.stroke();
    // Horizontal mid (between top and bottom row)
    const midY = HEADER_H + CELL_H + SEP / 2;
    ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(W, midY); ctx.stroke();

    // ── Draw each team ──
    for (let ti = 0; ti < teamScores.length; ti++) {
      const s = teamScores[ti];
      const t = s.team;
      const td = getTeamData(s.id, playerPoints);
      const top11 = td.players.slice(0, N_PLAYERS);

      const col = ti % 2;
      const gridRow = Math.floor(ti / 2);
      const xS = col * CELL_W;
      const xE = xS + CELL_W;
      const xL = xS + CELL_PAD;      // inner left
      const xR = xE - CELL_PAD;      // inner right
      const yS = HEADER_H + gridRow * (CELL_H + SEP);

      // ── Color accent bar ──
      ctx.fillStyle = t.color;
      ctx.fillRect(xS, yS, CELL_W, COLOR_BAR);

      // ── Team header (rank · name · pts) ──
      const thY = yS + COLOR_BAR;

      // Ghost rank
      ctx.textAlign = "left";
      ctx.font = "100 44px -apple-system, Arial, sans-serif";
      ctx.fillStyle = "#1e1e22";
      ctx.fillText(String(ti + 1), xL, thY + 50);

      // Team name + owner
      ctx.font = "600 20px -apple-system, Arial, sans-serif";
      ctx.fillStyle = "#e4e4e7";
      ctx.fillText(t.name, xL + 38, thY + 22);
      ctx.font = "300 12px -apple-system, Arial, sans-serif";
      ctx.fillStyle = "#3f3f46";
      ctx.fillText(t.owner, xL + 38, thY + 40);
      ctx.font = "300 11px -apple-system, Arial, sans-serif";
      ctx.fillStyle = "#27272a";
      ctx.fillText(`C: ${t.captain}`, xL + 38, thY + 56);

      // Total pts (right — the hero number)
      ctx.textAlign = "right";
      ctx.font = "700 40px -apple-system, Arial, sans-serif";
      ctx.fillStyle = t.color;
      ctx.fillText(String(td.total), xR, thY + 40);
      ctx.font = "300 11px -apple-system, Arial, sans-serif";
      ctx.fillStyle = t.color + "66";
      ctx.fillText("PTS", xR, thY + 56);

      // Header → players separator
      const sepY = thY + TEAM_HDR_H;
      ctx.strokeStyle = "#18181b"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(xS, sepY); ctx.lineTo(xE, sepY); ctx.stroke();

      // ── Player rows: just name + pts ──
      const playersY = sepY + SEP;
      for (let pi = 0; pi < top11.length; pi++) {
        const p = top11[pi];
        const isC = p.name === t.captain;
        const isVC = p.name === t.vc;
        const py = playersY + pi * PLAYER_ROW_H;
        const midRow = py + PLAYER_ROW_H * 0.62;

        // Name weight/color by importance
        const nameWeight = isC ? "500" : "400";
        const nameColor = isC ? "#e4e4e7" : isVC ? "#a1a1aa" : pi < 6 ? "#71717a" : "#3f3f46";
        ctx.font = `${nameWeight} 15px -apple-system, Arial, sans-serif`;
        ctx.fillStyle = nameColor;
        ctx.textAlign = "left";

        // Truncate name to fit (max ~330px before pts area)
        let dName = p.name;
        while (ctx.measureText(dName).width > 330 && dName.length > 5) {
          dName = dName.slice(0, -2) + "…";
        }
        ctx.fillText(dName, xL, midRow);

        // Inline C / VC marker right after name
        if (isC || isVC) {
          const nameW = ctx.measureText(dName).width;
          ctx.font = "700 10px -apple-system, Arial, sans-serif";
          ctx.fillStyle = t.color + "cc";
          ctx.fillText(isC ? " C" : " VC", xL + nameW, midRow);
        }

        // Pts (right-aligned)
        ctx.textAlign = "right";
        ctx.font = `${isC || isVC ? "600" : "400"} 15px -apple-system, Arial, sans-serif`;
        ctx.fillStyle = isC ? "#e4e4e7" : isVC ? "#a1a1aa" : "#3f3f46";
        ctx.fillText(String(p.adj), xR, midRow);

        // Subtle row divider (skip last)
        if (pi < top11.length - 1) {
          ctx.strokeStyle = "#18181b"; ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(xL, py + PLAYER_ROW_H);
          ctx.lineTo(xR, py + PLAYER_ROW_H);
          ctx.stroke();
        }
      }
    }

    // Gold bottom accent
    ctx.fillStyle = goldGrad;
    ctx.fillRect(0, H - 3, W, 3);

    // Share / download
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, "image/png"));
    if (!blob) return;
    const file = new File([blob], "ipl-fantasy-teams.png", { type: "image/png" });
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Indian Premier League 2026 — All Teams" });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "ipl-fantasy-teams.png";
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
        setShowToast(true); setTimeout(() => setShowToast(false), 2500);
      }
    } catch { /* user cancelled */ }
  };

  const shareMatchCard = async (m: any) => {
    const W = 1080, PAD = 56;
    const isLive = m.matchStarted && !m.matchEnded;
    const isDone = m.matchEnded;
    const matchTeams = (m.teamInfo || []) as Array<{ shortname: string; img: string }>;
    const scores = (m.score || []) as any[];

    // Fetch scorecard if not already loaded (user may not have expanded the card)
    let sc = scorecards[String(m.id)];
    if (!sc) {
      try {
        const res = await fetch(`/api/ipl/scorecard/${String(m.id)}`);
        if (res.ok) {
          sc = await res.json();
          setScorecards(prev => ({ ...prev, [String(m.id)]: sc }));
        }
      } catch (_) {}
    }
    const innings: any[] = sc?.innings || [];

    // Match number for fantasy points lookup
    const mNumMatch = (m.name || "").match(/(\d+)(?:st|nd|rd|th) Match/i);
    const matchNum = mNumMatch ? parseInt(mNumMatch[1]) : null;

    // Fantasy team totals for this match
    const fantasyRows = Object.values(FANTASY_TEAMS).map(ft => {
      let total = 0;
      const scorers: string[] = [];
      for (const p of ft.players) {
        const entry = matchNum ? (playerMatchPoints[p.name] || []).find((e: any) => e.matchNum === matchNum) : null;
        if (entry && entry.pts !== 0) {
          total += entry.pts;
          scorers.push(`${p.name.split(" ").pop()} ${entry.pts > 0 ? "+" : ""}${entry.pts}`);
        }
      }
      return { ft, total, scorers };
    }).filter(r => r.total !== 0).sort((a, b) => b.total - a.total);
    const hasFantasy = fantasyRows.length > 0;

    // Row / section height constants
    const ROW_BAT = 46;  // batting row (name + dismissal)
    const ROW_BOWL = 34; // bowling row
    const COL_HDR = 30;  // "BATTER" / "BOWLER" column header
    const INN_HDR = 48;  // innings title bar
    const INN_GAP = 28;  // spacer between innings

    // Compute innings section height
    let inningsH = 0;
    for (const inn of innings) {
      const batters = (inn.batting || []).filter((b: any) => !b.dnb);
      const bowlers = inn.bowling || [];
      inningsH += INN_HDR;
      if (batters.length) inningsH += COL_HDR + batters.length * ROW_BAT;
      if (bowlers.length) inningsH += 16 + COL_HDR + bowlers.length * ROW_BOWL;
      inningsH += INN_GAP;
    }

    const HEADER_H = 120;
    const TITLE_H  = 100;
    const META_H   = 52;
    const SCORE_H  = scores.length * 62 + 28;
    const RESULT_H = isDone && m.status ? 52 : 0;
    const FANTASY_H = hasFantasy ? 44 + fantasyRows.length * 52 + 20 : 0;
    const H = HEADER_H + TITLE_H + META_H + SCORE_H + RESULT_H
            + (innings.length > 0 ? inningsH + 20 : 0)
            + FANTASY_H + 56;

    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // Load logo
    const logoImg = new Image(); logoImg.crossOrigin = "anonymous";
    logoImg.src = `${import.meta.env.BASE_URL}app-icon.png`;
    await new Promise(r => { logoImg.onload = r; logoImg.onerror = r; });

    // Load team logos
    const teamLogoImgs = await Promise.all(
      matchTeams.slice(0, 2).map(ti => new Promise<HTMLImageElement | null>(resolve => {
        const url = TEAM_LOGO_CDN[ti.shortname] || ti.img || "";
        if (!url) return resolve(null);
        const img = new Image(); img.crossOrigin = "anonymous";
        img.onload = () => resolve(img); img.onerror = () => resolve(null);
        img.src = url;
      }))
    );

    const goldGrad = ctx.createLinearGradient(0, 0, W, 0);
    goldGrad.addColorStop(0, "#a07832"); goldGrad.addColorStop(0.5, "#d4a843"); goldGrad.addColorStop(1, "#a07832");
    const cx = W / 2;
    const hr = (yy: number) => {
      ctx.strokeStyle = "#1d2235"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PAD, yy); ctx.lineTo(W - PAD, yy); ctx.stroke();
    };

    // Background + top gold strip
    ctx.fillStyle = "#080c14"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = goldGrad; ctx.fillRect(0, 0, W, 3);

    // ── Header ──
    const logoR = 22, logoX = PAD + logoR, logoY = 65;
    ctx.save(); ctx.beginPath(); ctx.arc(logoX, logoY, logoR, 0, Math.PI * 2); ctx.clip();
    if (logoImg.naturalWidth > 0) ctx.drawImage(logoImg, logoX - logoR, logoY - logoR, logoR * 2, logoR * 2);
    ctx.restore();
    ctx.textAlign = "left";
    ctx.font = "700 30px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#ffffff";
    ctx.fillText("Indian Premier League 2026", PAD + logoR * 2 + 16, 56);
    ctx.font = "400 20px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#52525b";
    ctx.fillText("Match Scorecard", PAD + logoR * 2 + 16, 82);
    ctx.textAlign = "right";
    ctx.font = "600 21px -apple-system, Arial, sans-serif";
    ctx.fillStyle = isLive ? "#22c55e" : isDone ? "#52525b" : "#60a5fa";
    ctx.fillText(isLive ? "● LIVE" : isDone ? "COMPLETED" : "UPCOMING", W - PAD, 68);
    hr(HEADER_H);

    let y = HEADER_H + 14;

    // ── Team title ──
    if (matchTeams.length >= 2) {
      const ta = matchTeams[0], tb = matchTeams[1];
      const colA = IPL_COLORS[ta.shortname] || "#e4e4e7";
      const colB = IPL_COLORS[tb.shortname] || "#e4e4e7";
      const lSz = 50;
      if (teamLogoImgs[0]) ctx.drawImage(teamLogoImgs[0], cx - 298, y + 6, lSz, lSz);
      ctx.textAlign = "right"; ctx.font = "800 52px -apple-system, Arial, sans-serif"; ctx.fillStyle = colA;
      ctx.fillText(ta.shortname, cx - 32, y + 52);
      ctx.textAlign = "center"; ctx.font = "300 26px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#3f3f46";
      ctx.fillText("vs", cx, y + 50);
      ctx.textAlign = "left"; ctx.font = "800 52px -apple-system, Arial, sans-serif"; ctx.fillStyle = colB;
      ctx.fillText(tb.shortname, cx + 32, y + 52);
      if (teamLogoImgs[1]) ctx.drawImage(teamLogoImgs[1], cx + 248, y + 6, lSz, lSz);
    } else {
      ctx.textAlign = "center"; ctx.font = "700 42px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#e4e4e7";
      ctx.fillText((m.name || "").replace(/,\s*\d+(?:st|nd|rd|th) Match.*/i, ""), cx, y + 52);
    }
    y += TITLE_H;

    // ── Meta: match number · venue · toss ──
    const mNumStr = mNumMatch ? `M${mNumMatch[1]}` : "";
    const venue = m.venue ? m.venue.split(",")[0] : "";
    const metaLine = [mNumStr, venue].filter(Boolean).join("  ·  ");
    ctx.textAlign = "center"; ctx.font = "400 21px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#52525b";
    if (metaLine) ctx.fillText(metaLine, cx, y + 22);
    if (sc?.overview?.toss) {
      ctx.font = "400 17px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#3f3f46";
      ctx.fillText(sc.overview.toss, cx, y + 44);
    }
    y += META_H;

    // ── Quick score summary ──
    hr(y); y += 18;
    const sColW = scores.length > 1 ? (W - PAD * 2 - 20) / 2 : W - PAD * 2;
    scores.forEach((s: any, i: number) => {
      const sx = PAD + i * (sColW + 20);
      const innLabel = (s.inning || "").replace(/ Innings?$/i, "");
      const scoreStr = s.summary || (s.r != null ? `${s.r}/${s.w}` : "—");
      const oversStr = s.o != null ? `(${s.o} ov)` : "";
      ctx.textAlign = "left";
      ctx.font = "400 18px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#52525b";
      ctx.fillText(innLabel, sx, y + 18);
      ctx.font = "700 42px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#e4e4e7";
      ctx.fillText(scoreStr, sx, y + 54);
      if (oversStr) {
        const sw = ctx.measureText(scoreStr).width;
        ctx.font = "400 19px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#52525b";
        ctx.fillText(oversStr, sx + sw + 8, y + 54);
      }
    });
    y += SCORE_H;

    // ── Result ──
    if (isDone && m.status) {
      hr(y); y += 14;
      ctx.textAlign = "center"; ctx.font = "600 25px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#60a5fa";
      ctx.fillText(m.status, cx, y + 28);
      y += RESULT_H;
    }

    // ── Full scorecard innings ──
    if (innings.length > 0) {
      hr(y); y += 18;

      // Right-edge x positions for batting columns
      const B_SR  = W - PAD;
      const B_6S  = B_SR  - 80;
      const B_4S  = B_6S  - 74;
      const B_B   = B_4S  - 74;
      const B_R   = B_B   - 84;

      // Right-edge x positions for bowling columns
      const BW_ECO = W - PAD;
      const BW_W   = BW_ECO - 74;
      const BW_R   = BW_W   - 74;
      const BW_M   = BW_R   - 74;
      const BW_O   = BW_M   - 74;

      // Fantasy-scoring colour helpers (mirrors the UI logic)
      const findFtC = (name: string) => {
        const norm = (s: string) => s.replace(/\s*\(.*?\)\s*/g, "").trim().toLowerCase();
        const ALIASES: Record<string, string> = { "mohammad shami": "mohammed shami", "md shami": "mohammed shami" };
        const sn = ALIASES[norm(name)] ?? norm(name);
        for (const ft of Object.values(FANTASY_TEAMS)) {
          if (ft.players.some(p => norm(p.name) === sn)) return ft;
        }
        return null;
      };
      const runsColorC = (runs: number, balls: number) => {
        if (runs === 0 && balls > 0) return "#f87171";
        if (runs >= 100) return "#d4a843";
        if (runs >= 50) return "#fb923c";
        if (runs >= 30) return "#f59e0b";
        return "#e4e4e7";
      };
      const srColorC = (sr: number, balls: number) => {
        if (balls < 5) return "#71717a";
        if (sr >= 200) return "#22c55e";
        if (sr >= 150) return "#86efac";
        if (sr < 70) return "#f87171";
        return "#71717a";
      };
      const wkColorC = (w: number) => {
        if (w >= 4) return "#d4a843";
        if (w === 3) return "#22c55e";
        if (w === 2) return "#4ade80";
        if (w === 1) return "#e4e4e7";
        return "#71717a";
      };
      const ecoColorC = (eco: number) => {
        if (eco < 6) return "#22c55e";
        if (eco < 8) return "#86efac";
        if (eco < 10) return "#71717a";
        if (eco < 12) return "#f59e0b";
        return "#f87171";
      };

      for (const inn of innings) {
        const batters = (inn.batting || []).filter((b: any) => !b.dnb);
        const bowlers: any[] = inn.bowling || [];

        // Innings title bar
        ctx.textAlign = "left"; ctx.font = "700 22px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#71717a";
        ctx.fillText((inn.name || "").toUpperCase(), PAD, y + 22);
        ctx.textAlign = "right"; ctx.font = "700 22px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#e4e4e7";
        ctx.fillText(inn.total || "", W - PAD, y + 22);
        y += INN_HDR;

        // ─ Batting table ─
        if (batters.length > 0) {
          ctx.fillStyle = "#3f3f46"; ctx.font = "600 15px -apple-system, Arial, sans-serif";
          ctx.textAlign = "left";  ctx.fillText("BATTER", PAD, y + 19);
          ctx.textAlign = "right";
          ctx.fillText("R",   B_R,   y + 19);
          ctx.fillText("B",   B_B,   y + 19);
          ctx.fillText("4s",  B_4S,  y + 19);
          ctx.fillText("6s",  B_6S,  y + 19);
          ctx.fillText("SR",  B_SR,  y + 19);
          y += COL_HDR;

          for (const b of batters) {
            const bFt = findFtC(b.name || "");
            const rc  = runsColorC(b.runs, b.balls);
            const src = srColorC(parseFloat(b.sr || "0"), b.balls);

            // Name (bold if fantasy player)
            ctx.textAlign = "left";
            ctx.font = `${bFt ? "700" : b.notOut ? "600" : "400"} 21px -apple-system, Arial, sans-serif`;
            ctx.fillStyle = b.notOut ? "#22c55e" : "#e4e4e7";
            ctx.fillText(b.name || "", PAD, y + 22);

            // F badge to the right of name
            if (bFt) {
              const nW = ctx.measureText(b.name || "").width;
              const bx = PAD + nW + 8, by = y + 8;
              ctx.fillStyle = bFt.color + "28";
              ctx.fillRect(bx, by, 22, 16);
              ctx.font = "700 11px -apple-system, Arial, sans-serif";
              ctx.fillStyle = bFt.color;
              ctx.textAlign = "left";
              ctx.fillText("F", bx + 5, by + 12);
            }

            // Dismissal
            if (b.dismissal) {
              ctx.font = "400 13px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#52525b";
              const d = b.dismissal.length > 55 ? b.dismissal.slice(0, 53) + "…" : b.dismissal;
              ctx.textAlign = "left"; ctx.fillText(d, PAD, y + 38);
            }

            // Stats — colour-coded
            ctx.textAlign = "right";
            ctx.font = "700 21px -apple-system, Arial, sans-serif"; ctx.fillStyle = rc;
            ctx.fillText(String(b.runs ?? ""), B_R, y + 22);
            ctx.font = "400 19px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#71717a";
            ctx.fillText(String(b.balls ?? ""), B_B, y + 22);
            ctx.fillStyle = b.fours > 0 ? "#60a5fa" : "#3f3f46";
            ctx.fillText(String(b.fours ?? ""), B_4S, y + 22);
            ctx.fillStyle = b.sixes > 0 ? "#a855f7" : "#3f3f46";
            ctx.fillText(String(b.sixes ?? ""), B_6S, y + 22);
            ctx.fillStyle = src;
            ctx.fillText(b.sr ? parseFloat(b.sr).toFixed(1) : "", B_SR, y + 22);
            y += ROW_BAT;
          }
        }

        // ─ Bowling table ─
        if (bowlers.length > 0) {
          y += 16;
          ctx.fillStyle = "#3f3f46"; ctx.font = "600 15px -apple-system, Arial, sans-serif";
          ctx.textAlign = "left";  ctx.fillText("BOWLER", PAD, y + 19);
          ctx.textAlign = "right";
          ctx.fillText("O",   BW_O,   y + 19);
          ctx.fillText("M",   BW_M,   y + 19);
          ctx.fillText("R",   BW_R,   y + 19);
          ctx.fillText("W",   BW_W,   y + 19);
          ctx.fillText("ECO", BW_ECO, y + 19);
          y += COL_HDR;

          for (const b of bowlers) {
            const bFt = findFtC(b.name || "");
            const wc  = wkColorC(b.wickets);
            const ec  = ecoColorC(parseFloat(b.eco || "0"));

            // Name
            ctx.textAlign = "left";
            ctx.font = `${bFt ? "700" : "400"} 21px -apple-system, Arial, sans-serif`;
            ctx.fillStyle = "#e4e4e7";
            ctx.fillText(b.name || "", PAD, y + 23);

            // F badge
            if (bFt) {
              const nW = ctx.measureText(b.name || "").width;
              const bx = PAD + nW + 8, by = y + 9;
              ctx.fillStyle = bFt.color + "28";
              ctx.fillRect(bx, by, 22, 16);
              ctx.font = "700 11px -apple-system, Arial, sans-serif";
              ctx.fillStyle = bFt.color;
              ctx.textAlign = "left";
              ctx.fillText("F", bx + 5, by + 12);
            }

            // Stats — colour-coded
            ctx.textAlign = "right"; ctx.font = "400 19px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#71717a";
            ctx.fillText(String(b.overs ?? ""),   BW_O,   y + 23);
            ctx.fillStyle = b.maidens > 0 ? "#f59e0b" : "#71717a";
            ctx.fillText(String(b.maidens ?? ""), BW_M,   y + 23);
            ctx.fillStyle = "#71717a";
            ctx.fillText(String(b.runs ?? ""),    BW_R,   y + 23);
            ctx.font = "700 21px -apple-system, Arial, sans-serif"; ctx.fillStyle = wc;
            ctx.fillText(String(b.wickets ?? ""), BW_W,   y + 23);
            ctx.font = "400 19px -apple-system, Arial, sans-serif"; ctx.fillStyle = ec;
            ctx.fillText(b.eco ? parseFloat(b.eco).toFixed(2) : "", BW_ECO, y + 23);
            y += ROW_BOWL;
          }
        }
        y += INN_GAP;
      }
    }

    // ── Fantasy highlights ──
    if (hasFantasy) {
      hr(y); y += 14;
      ctx.textAlign = "left"; ctx.font = "600 17px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#3f3f46";
      ctx.fillText("FANTASY POINTS THIS MATCH", PAD, y + 18);
      y += 36;
      for (const { ft, total, scorers } of fantasyRows) {
        ctx.fillStyle = ft.color; ctx.fillRect(PAD, y + 6, 3, 34);
        ctx.textAlign = "left"; ctx.font = "700 26px -apple-system, Arial, sans-serif"; ctx.fillStyle = ft.color;
        ctx.fillText(ft.owner, PAD + 13, y + 28);
        ctx.font = "400 17px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#52525b";
        ctx.fillText(scorers.slice(0, 4).join("  ·  "), PAD + 13 + ctx.measureText(ft.owner).width + 16, y + 28);
        ctx.textAlign = "right"; ctx.font = "700 32px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#e4e4e7";
        ctx.fillText(String(total), W - PAD, y + 30);
        y += 52;
      }
    }

    // Gold bottom line
    ctx.fillStyle = goldGrad; ctx.fillRect(0, H - 3, W, 3);

    // Share or download
    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, "image/png"));
    if (!blob) return;
    const filename = matchTeams.length >= 2
      ? `ipl-${matchTeams[0].shortname}-vs-${matchTeams[1].shortname}.png`
      : "ipl-match.png";
    const title = matchTeams.length >= 2
      ? `${matchTeams[0].shortname} vs ${matchTeams[1].shortname} — IPL 2026`
      : "IPL 2026 Match";
    const file = new File([blob], filename, { type: "image/png" });
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
      }
    } catch { /* user cancelled */ }
  };

  const maxPts = teamScores[0]?.total || 1;


  // Currently LIVE matches (started, not ended)
  const liveMatchPreviews = buildMatchPreviews(
    liveMatches.filter((m: any) => m.matchStarted && !m.matchEnded)
  );

  // All upcoming matches within the next 24 hours — handles double-headers
  const upcomingLineupPreviews = buildMatchPreviews(
    liveMatches
      .filter((m: any) => !m.matchStarted && m.dateTimeGMT)
      .map((m: any) => ({ m, diff: new Date(m.dateTimeGMT).getTime() - Date.now() }))
      .filter(({ diff }) => diff > 0 && diff <= 24 * 60 * 60 * 1000)
      .sort((a, b) => a.diff - b.diff)
      .map(({ m }) => m)
  );

  const renderHistory = () => (
    <HistoryPage
      historyYear={historyYear}
      setHistoryYear={setHistoryYear}
      histTop10Tab={histTop10Tab}
      setHistTop10Tab={setHistTop10Tab}
    />
  );

  const renderHome = () => {
    return (
      <div>
        {/* Countdown to next match */}
        {countdown && (
          <div className="countdown-card">
            {/* Blurred colosseum background */}
            <div style={{
              position: "absolute", inset: -6, zIndex: 0,
              backgroundImage: `url(${import.meta.env.BASE_URL}countdown-bg.jpeg)`,
              backgroundSize: "cover", backgroundPosition: "center 40%",
              filter: "blur(10px) brightness(0.38) saturate(1.2)",
            }} />
            {/* Warm amber vignette */}
            <div style={{
              position: "absolute", inset: 0, zIndex: 1,
              background: "linear-gradient(160deg, rgba(245,166,35,0.12) 0%, rgba(6,4,2,0.6) 60%, rgba(6,4,2,0.75) 100%)",
            }} />
            <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
              {/* Left: timer */}
              <div>
                <div className="countdown-timer">{countdown.text}</div>
                <div className="countdown-label">next match</div>
              </div>
              {/* Right: team logos + venue */}
              {(countdown.homeTeam && countdown.awayTeam) ? (
                <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <img src={TEAM_LOGO_CDN[countdown.homeTeam]} alt={countdown.homeTeam}
                      style={{ width: 22, height: 22, objectFit: "contain" }}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.88rem", fontWeight: 700, color: "var(--text)", letterSpacing: "0.04em" }}>{countdown.homeTeam}</span>
                    <span style={{ fontSize: "0.6rem", color: "var(--text-3)", fontWeight: 500 }}>vs</span>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.88rem", fontWeight: 700, color: "var(--text)", letterSpacing: "0.04em" }}>{countdown.awayTeam}</span>
                    <img src={TEAM_LOGO_CDN[countdown.awayTeam]} alt={countdown.awayTeam}
                      style={{ width: 22, height: 22, objectFit: "contain" }}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                  {countdown.venue && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: "0.62rem", opacity: 0.7 }}>🏟</span>
                      <span style={{ fontSize: "0.56rem", color: "var(--text-3)" }}>{countdown.venue}</span>
                    </div>
                  )}
                </div>
              ) : countdown.venue ? (
                <div style={{ fontSize: "0.56rem", color: "var(--text-3)", alignSelf: "center" }}>{countdown.venue}</div>
              ) : null}
            </div>
            {(() => {
              const nextM = liveMatches.filter((m: any) => !m.matchStarted && m.dateTimeGMT)
                .sort((a: any, b: any) => new Date(a.dateTimeGMT).getTime() - new Date(b.dateTimeGMT).getTime())[0];
              if (!nextM?.homeTeamCode || !nextM?.awayTeamCode) return null;
              const stakes = Object.values(FANTASY_TEAMS).map(ft => ({
                owner: ft.owner, color: ft.color,
                count: ft.players.filter((p: any) => p.ipl === nextM.homeTeamCode || p.ipl === nextM.awayTeamCode).length
              }));
              const h2h = getH2H(nextM.homeTeamCode, nextM.awayTeamCode);
              const vd = VENUE_AVG[nextM.venue || ""];
              const pred = predictNextMatch(nextM.homeTeamCode, nextM.awayTeamCode);
              const hasIntel = h2h || vd;
              const sortedStakes = [...stakes].filter(s => s.count > 0).sort((a, b) => b.count - a.count);
              return (
                <div style={{ borderTop: "1px solid rgba(255,200,120,0.1)", paddingTop: 9, display: "flex", flexDirection: "column" as const, gap: 0, position: "relative", zIndex: 2 }}>
                  {/* Row 1: picks — consistent size, sorted by count */}
                  {sortedStakes.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 8 }}>
                      <span style={{ fontSize: "0.55rem", color: "var(--text-3)", letterSpacing: "0.05em", flexShrink: 0 }}>PICKS</span>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
                        {sortedStakes.map(s => (
                          <span key={s.owner} style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: s.color }}>{s.owner}</span>
                            <span style={{ fontSize: "0.6rem", fontWeight: 500, color: "var(--text-3)" }}>{s.count}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Collapsible intel section */}
                  {hasIntel && (
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 7 }}>
                      {/* Toggle row */}
                      <div onClick={() => setIntelOpen(o => !o)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" as const }}>
                        <span style={{ fontSize: "0.55rem", color: "var(--text-3)", letterSpacing: "0.05em" }}>MATCH INTEL</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {!intelOpen && pred.pick && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <img src={TEAM_LOGO_CDN[pred.pick]} alt={pred.pick} style={{ width: 13, height: 13, objectFit: "contain" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                              <span style={{ fontSize: "0.63rem", fontWeight: 700, color: "var(--gold)" }}>{pred.pick}</span>
                            </div>
                          )}
                          <span style={{ fontSize: "0.55rem", color: "var(--text-3)", display: "inline-block", transition: "transform 0.2s", transform: intelOpen ? "rotate(180deg)" : "none" }}>▼</span>
                        </div>
                      </div>
                      {/* Expanded rows */}
                      {intelOpen && (
                        <div style={{ display: "flex", flexDirection: "column" as const, gap: 7, marginTop: 9 }}>
                          {h2h && (
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: "0.55rem", color: "var(--text-3)", letterSpacing: "0.05em", flexShrink: 0, minWidth: 90 }}>H2H</span>
                              <span style={{ fontSize: "0.68rem" }}>
                                <span style={{ fontWeight: 700, color: h2h.aWins >= h2h.bWins ? "var(--text)" : "var(--text-3)" }}>{nextM.homeTeamCode} {h2h.aWins}</span>
                                <span style={{ margin: "0 5px", color: "var(--text-3)" }}>–</span>
                                <span style={{ fontWeight: 700, color: h2h.bWins > h2h.aWins ? "var(--text)" : "var(--text-3)" }}>{h2h.bWins} {nextM.awayTeamCode}</span>
                              </span>
                            </div>
                          )}
                          {vd && (
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: "0.55rem", color: "var(--text-3)", letterSpacing: "0.05em", flexShrink: 0, minWidth: 90 }}>PRED TOTAL</span>
                              <span style={{ fontSize: "0.68rem" }}>
                                <span style={{ fontWeight: 700, color: "var(--text)" }}>{predictFirstInningsTotal(nextM.homeTeamCode, nextM.awayTeamCode, vd.avg)}</span>
                                <span style={{ fontSize: "0.6rem", color: "var(--text-3)", marginLeft: 6 }}>{vd.note}</span>
                              </span>
                            </div>
                          )}
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: "0.55rem", color: "var(--text-3)", letterSpacing: "0.05em", flexShrink: 0, minWidth: 90 }}>MATCH PRED</span>
                            {pred.pick ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <img src={TEAM_LOGO_CDN[pred.pick]} alt={pred.pick} style={{ width: 15, height: 15, objectFit: "contain" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--gold)" }}>{pred.pick}</span>
                                <span style={{ fontSize: "0.56rem", color: "var(--text-3)", fontStyle: "italic" }}>· {pred.reason}</span>
                              </div>
                            ) : (
                              <span style={{ fontSize: "0.6rem", color: "var(--text-3)", fontStyle: "italic" }}>{pred.reason}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
        {(() => {
          const liveNow = liveMatches.filter((m: any) => m.matchStarted && !m.matchEnded);
          if (liveNow.length === 0) return null;
          return (
            <div style={{ marginBottom: 16 }}>
              <div className="sec-title" style={{ marginBottom: 8 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--live)", display: "inline-block", boxShadow: "0 0 6px var(--live)", animation: "pulse 1.4s ease-in-out infinite" }} />
                  Live
                </span>
              </div>
              {liveNow.map((m: any) => {
                const matchIdStr = String(m.id);
                const sc = scorecards[matchIdStr];
                const teams = m.teamInfo || [];
                const mNum = getMatchNum(m.name);
                const cardWinner = getMatchWinner(m);
                return (
                  <div key={m.id} className="match-card" style={{ marginBottom: 8, cursor: "pointer" }}
                    onClick={() => { setTab("fixtures"); setMatchFilter("live"); }}>
                    {/* Stadium backdrop */}
                    <div style={{ position: "absolute", inset: -4, zIndex: 0, backgroundImage: `url(${import.meta.env.BASE_URL}match-bg.jpeg)`, backgroundSize: "cover", backgroundPosition: "center 35%", filter: "blur(3px) brightness(0.28) saturate(1.0)" }} />
                    <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "linear-gradient(160deg, rgba(6,4,3,0.64) 0%, rgba(4,3,2,0.72) 100%)" }} />
                    <div style={{ position: "relative", zIndex: 2 }}>
                      {/* Header row */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <div className="match-status" style={{ color: "var(--live)" }}>Live</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {mNum && <div style={{ fontSize: "0.7rem", color: "var(--text-3)", fontWeight: 600 }}>{mNum}</div>}
                          <div style={{ fontSize: "0.58rem", color: "var(--text-3)", display: "flex", alignItems: "center", gap: 3 }}>
                            <span>Full scorecard</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                          </div>
                        </div>
                      </div>
                      {/* Teams row */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        {teams.length > 0 ? teams.map((ti: any, i: number) => {
                          const teamCol = IPL_COLORS[ti.shortname] || "var(--text)";
                          return (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              {i === 1 && <span style={{ color: "var(--text-3)", fontSize: "0.62rem", letterSpacing: "0.1em", margin: "0 1px" }}>VS</span>}
                              <img src={TEAM_LOGO_CDN[ti.shortname] || ti.img} alt={ti.shortname} style={{ width: 32, height: 32, objectFit: "contain", filter: `drop-shadow(0 1px 6px rgba(0,0,0,0.8)) drop-shadow(0 0 8px ${teamCol}55)` }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                              <span style={{ fontSize: "1.08rem", fontWeight: 500, letterSpacing: "0.04em", color: "var(--text)", textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}>{ti.shortname}</span>
                            </div>
                          );
                        }) : (
                          <div style={{ fontSize: "1rem", fontWeight: 500, color: "var(--text)" }}>{(m.name || "").replace(/,\s*\d+(?:st|nd|rd|th) Match.*/i, "")}</div>
                        )}
                      </div>
                      {/* Toss */}
                      {(sc?.overview?.toss || m.toss) && (
                        <div style={{ fontSize: "0.6rem", color: "var(--text-3)", lineHeight: 1.35, marginTop: 7 }}>{sc?.overview?.toss || m.toss}</div>
                      )}
                      {/* Score rows */}
                      {(m.score || []).map((s: any, i: number) => {
                        const inningTeamCode = (s.inning || "").split(" Inning")[0].split(" Innings")[0].trim();
                        const teamColorForScore = IPL_COLORS[inningTeamCode] || "var(--text-2)";
                        return (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", marginTop: i === 0 ? 10 : 5, borderRadius: 8, borderLeft: `3px solid ${teamColorForScore}55`, background: teamColorForScore + "0d" }}>
                            <span style={{ fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.04em", color: teamColorForScore }}>
                              {inningTeamCode || (s.inning || "").replace(" Innings", "").replace(" Inning", "")}
                            </span>
                            <span style={{ fontSize: "0.95rem", fontWeight: 700, letterSpacing: "0.02em", color: teamColorForScore }}>
                              {s.summary || (s.r != null ? `${s.r}/${s.w} (${s.o}ov)` : "")}
                            </span>
                          </div>
                        );
                      })}
                      {/* Venue */}
                      {m.venue && <div style={{ fontSize: "0.58rem", color: "var(--text-3)", marginTop: 7 }}>🏟 {m.venue}{m.homeTeamCode ? ` · ${m.homeTeamCode}` : ""}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, marginTop: countdown ? 16 : 0 }}>
          <div className="sec-title" style={{ marginBottom: 0 }}>Leaderboard</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={handleLbRefresh}
              disabled={lbRefreshing}
              title="Refresh all data"
              style={{ padding: "6px 10px", display: "flex", alignItems: "center", gap: 5, background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, cursor: lbRefreshing ? "default" : "pointer", color: lbRefreshing ? "var(--text-3)" : "var(--text-2)", fontFamily: "inherit", transition: "opacity 0.2s" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"
                style={{ animation: lbRefreshing ? "spin 0.9s linear infinite" : "none" }}>
                <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              <span style={{ fontSize: "0.68rem" }}>{lbRefreshing ? "Syncing…" : "Refresh"}</span>
            </button>
            <button className="btn-primary" style={{ padding: "6px 10px", display: "flex", alignItems: "center", gap: 5 }} onClick={shareLeaderboard} title="Share leaderboard">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              <span style={{ fontSize: "0.68rem" }}>Share</span>
            </button>
          </div>
        </div>
        {(() => {
          const LB_BG: Record<string, string> = {
            rajveer:  `${import.meta.env.BASE_URL}lb-bg-rajveer.jpeg`,
            mombasa:  `${import.meta.env.BASE_URL}lb-bg-mumbai.jpeg`,
            mumbai:   `${import.meta.env.BASE_URL}lb-bg-mombasa.jpeg`,
            ponygoat: `${import.meta.env.BASE_URL}lb-bg-ponygoat.jpeg`,
          };
          const leaderTotal = teamScores[0]?.total ?? 0;
          return (
            <div>
              {teamScores.map((s, i) => {
                const gap = i > 0 && Object.keys(playerPoints).length > 0 ? leaderTotal - s.total : 0;
                return (
                <div key={s.id} className={`lb-card ${i === 0 ? "rank-first" : ""}`} onClick={() => { setSelectedTeam(s.id); setTab("teams"); }}>
                  {/* Blurred team artwork background */}
                  <div style={{
                    position: "absolute", inset: -6, zIndex: 0,
                    backgroundImage: `url(${LB_BG[s.id]})`,
                    backgroundSize: "cover", backgroundPosition: "center 30%",
                    filter: "blur(32px) brightness(0.72) saturate(1.4)",
                    transform: "translateZ(0)",
                    willChange: "filter",
                  }} />
                  {/* Glass scrim */}
                  <div style={{
                    position: "absolute", inset: 0, zIndex: 1,
                    background: `linear-gradient(135deg, ${s.team.color}18 0%, rgba(9,9,11,0.18) 100%)`,
                  }} />
                  <div className="lb-accent" style={{ background: s.team.color, zIndex: 2, position: "relative" }} />
                  <div className="lb-inner" style={{ position: "relative", zIndex: 2 }}>
                    <div className={`lb-rank ${rankLabel(i)}`} style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>{i + 1}</div>
                    <div className="lb-info">
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div className={`lb-name ${i === 0 ? "first" : ""}`}
                          style={{ textShadow: "0 1px 6px rgba(0,0,0,1), 0 0 20px rgba(0,0,0,0.8)" }}>
                          {s.team.name}
                        </div>
                      </div>
                      <div className="lb-meta">
                        {s.team.owner} · <span style={{ color: "#d4a843" }}>C:</span> {s.team.captain} · <span style={{ color: "rgba(255,255,255,0.45)" }}>VC:</span> {s.team.vc}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div className="lb-pts first opacity-[1] bg-[transparent]"
                        style={{ color: Object.keys(playerPoints).length === 0 ? "var(--text-3)" : s.team.color, textShadow: Object.keys(playerPoints).length === 0 ? "none" : `0 0 12px ${s.team.color}66` }}>
                        {Object.keys(playerPoints).length === 0 ? "—" : s.total}
                      </div>
                      <div className="lb-pts-label" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>pts</div>
                      {i > 0 && Object.keys(playerPoints).length > 0 && (
                        <div style={{ fontSize: "0.58rem", color: gap === 0 ? "var(--text-3)" : "#f87171", textShadow: "0 1px 4px rgba(0,0,0,0.9)", fontWeight: 600, marginTop: 1 }}>
                          {`−${gap}`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          );
        })()}

        {/* ─── Season Race ─── */}
        {matchHistory.length > 0 && matchHistory[0].points.length >= 2 && (() => {
          const allMatchNums = matchHistory[0].points.map(p => p.matchNum);
          const n = allMatchNums.length;

          // Per-match raw scores (cum[i] - cum[i-1])
          const rawScores: Record<string, number[]> = {};
          for (const t of matchHistory) {
            rawScores[t.teamId] = t.points.map((p, i) => i === 0 ? p.cum : p.cum - t.points[i - 1].cum);
          }
          const lastMatchScores: Record<string, number> = {};
          for (const [tid, scores] of Object.entries(rawScores)) lastMatchScores[tid] = scores[scores.length - 1] ?? 0;
          const hotTeamId = Object.entries(lastMatchScores).sort((a, b) => b[1] - a[1])[0]?.[0];
          const coldTeamId = Object.entries(lastMatchScores).sort((a, b) => a[1] - b[1])[0]?.[0];

          // Best single match
          const bestMatch: Record<string, number> = {};
          for (const [tid, scores] of Object.entries(rawScores)) bestMatch[tid] = Math.max(...scores, 0);
          const clutchTeamId = Object.entries(bestMatch).sort((a, b) => b[1] - a[1])[0]?.[0];

          const leader = teamScores[0];
          const lastPlace = teamScores[teamScores.length - 1];
          const gap = leader.total - lastPlace.total;
          const secondGap = teamScores.length >= 2 ? leader.total - teamScores[1].total : 999;

          // Banter pool
          const pool: string[] = [];
          if (gap > 200) pool.push(`${leader.team.owner}'s on a different planet 🛸 — ${gap} pts clear`);
          else if (gap > 100) pool.push(`${lastPlace.team.owner}'s ${gap} pts behind. Respectfully, it's not looking good 😬`);
          else if (gap < 40) pool.push(`Only ${gap} pts separate 1st and last. Title race is ALIVE 👀`);
          if (secondGap < 20 && teamScores.length >= 2) pool.push(`${leader.team.owner} and ${teamScores[1].team.owner} are separated by just ${secondGap} pts. 🏏`);
          if (hotTeamId && coldTeamId && hotTeamId !== coldTeamId) {
            const hot = FANTASY_TEAMS[hotTeamId]; const cold = FANTASY_TEAMS[coldTeamId];
            pool.push(`${hot?.owner} lit up last match (+${lastMatchScores[hotTeamId]}) 🔥 while ${cold?.owner} barely showed (+${lastMatchScores[coldTeamId]}) ❄️`);
          }
          if (clutchTeamId) {
            const ct = FANTASY_TEAMS[clutchTeamId];
            pool.push(`${ct?.owner} dropped a ${bestMatch[clutchTeamId]}-pt bomb in a single match — still elite 💥`);
          }
          const banter = pool.length > 0 ? pool[Math.floor(Date.now() / 60000) % pool.length] : "";

          // Chart dimensions
          const W = 320, H = 148, PL = 14, PR = 54, PT = 14, PB = 20;
          const CW = W - PL - PR, CH = H - PT - PB;
          const maxCum = Math.max(...matchHistory.flatMap(t => t.points.map(p => p.cum)), 1);
          const xOf = (i: number) => PL + (n <= 1 ? CW / 2 : (i / (n - 1)) * CW);
          const yOf = (v: number) => PT + CH - (v / maxCum) * CH;
          const bottom = PT + CH;

          // Smooth catmull-rom cubic bezier path
          const smoothPath = (pts: {x: number; y: number}[]) => {
            if (pts.length < 2) return `M ${pts[0]?.x ?? 0} ${pts[0]?.y ?? 0}`;
            let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
            for (let i = 0; i < pts.length - 1; i++) {
              const p0 = pts[Math.max(0, i - 1)];
              const p1 = pts[i];
              const p2 = pts[i + 1];
              const p3 = pts[Math.min(pts.length - 1, i + 2)];
              const cp1x = p1.x + (p2.x - p0.x) / 6;
              const cp1y = p1.y + (p2.y - p0.y) / 6;
              const cp2x = p2.x - (p3.x - p1.x) / 6;
              const cp2y = p2.y - (p3.y - p1.y) / 6;
              d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
            }
            return d;
          };

          const chartMatchHistory = chartXiFilter === "xi"
            ? matchHistory.map(t => {
                const top11Set = getTeamData(t.teamId, playerPoints).top11;
                const team = FANTASY_TEAMS[t.teamId];
                let cum = 0;
                const points = matchHistory[0].points.map(({ matchNum }) => {
                  let pts = 0;
                  for (const player of team.players) {
                    if (!top11Set.has(player.name)) continue;
                    const entry = (playerMatchPoints[player.name] || []).find((e: any) => e.matchNum === matchNum);
                    if (entry) pts += applyMultiplier(entry.pts, player.name === team.captain, player.name === team.vc);
                  }
                  cum += pts;
                  return { matchNum, label: `M${matchNum}`, cum };
                });
                return { ...t, points };
              })
            : matchHistory;

          const sortedByFinal = [...chartMatchHistory].sort((a, b) =>
            (b.points[b.points.length - 1]?.cum ?? 0) - (a.points[a.points.length - 1]?.cum ?? 0)
          );

          // ─ Per-team aggregated batting/bowling/fielding stats ─
          type TeamAggEntry = { runs: number; balls: number; sixes: number; fours: number; wickets: number; catches: number; ducks: number; price: number; captainPts: number; vcPts: number };
          const buildTeamAgg = (xiOnly: boolean): Record<string, TeamAggEntry> => {
            const agg: Record<string, TeamAggEntry> = {};
            for (const [tid, ft] of Object.entries(FANTASY_TEAMS)) {
              const top11Set = xiOnly ? getTeamData(tid, playerPoints).top11 : null;
              let runs = 0, balls = 0, sixes = 0, fours = 0, wickets = 0, catches = 0, ducks = 0, price = 0, captainPts = 0, vcPts = 0;
              for (const player of ft.players) {
                if (top11Set && !top11Set.has(player.name)) continue;
                price += player.price ?? 0;
                const entries = playerMatchPoints[player.name] || [];
                const playerTotalPts = entries.reduce((s: number, e: any) => s + e.pts, 0);
                if (player.name === ft.captain) captainPts = playerTotalPts;
                if (player.name === ft.vc) vcPts = playerTotalPts;
                for (const e of entries) {
                  if (!e.stats) continue;
                  runs += e.stats.runs ?? 0;
                  balls += e.stats.balls ?? 0;
                  sixes += e.stats.sixes ?? 0;
                  fours += e.stats.fours ?? 0;
                  wickets += e.stats.wickets ?? 0;
                  catches += (e.stats.catches ?? 0) + (e.stats.runOuts ?? 0) + (e.stats.stumpings ?? 0);
                  if (e.stats.duck) ducks++;
                }
              }
              agg[tid] = { runs, balls, sixes, fours, wickets, catches, ducks, price, captainPts, vcPts };
            }
            return agg;
          };
          const teamAgg = buildTeamAgg(false);
          const activeAgg = awardXiFilter === "xi" ? buildTeamAgg(true) : teamAgg;
          const topBy = (key: keyof (typeof teamAgg)[string], hi = true) =>
            Object.entries(teamAgg).sort((a, b) => hi ? (b[1][key] as number) - (a[1][key] as number) : (a[1][key] as number) - (b[1][key] as number))[0]?.[0];
          const sixesTeamId    = topBy("sixes");
          const runsTeamId     = topBy("runs");
          const wicketsTeamId  = topBy("wickets");
          const catchesTeamId  = topBy("catches");
          const ducksTeamId    = topBy("ducks");
          const capTeamId      = topBy("captainPts");
          const vcTeamId       = topBy("vcPts");
          const valueTeamId    = Object.entries(teamAgg).sort((a, b) => {
            const aV = a[1].price > 0 ? (teamScores.find(t => t.id === a[0])?.total ?? 0) / a[1].price : 0;
            const bV = b[1].price > 0 ? (teamScores.find(t => t.id === b[0])?.total ?? 0) / b[1].price : 0;
            return bV - aV;
          })[0]?.[0];
          const srTeamId       = Object.entries(teamAgg).sort((a, b) => {
            const aSR = a[1].balls > 0 ? a[1].runs / a[1].balls : 0;
            const bSR = b[1].balls > 0 ? b[1].runs / b[1].balls : 0;
            return bSR - aSR;
          })[0]?.[0];
          const stdDev = (arr: number[]) => { if (arr.length < 2) return 999; const m = arr.reduce((s, v) => s + v, 0) / arr.length; return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length); };
          const consistentTeamId = Object.entries(rawScores).sort((a, b) => stdDev(a[1]) - stdDev(b[1]))[0]?.[0];

          const tids = Object.keys(FANTASY_TEAMS);
          const awardsV2: Array<{ emoji: string; label: string; rows: Array<{ teamId: string; value: number; display: string }> }> = [
            {
              emoji: "💥", label: "Best Single Match",
              rows: tids.map(tid => ({ teamId: tid, value: bestMatch[tid] ?? 0, display: `${bestMatch[tid] ?? 0} pts` })).sort((a, b) => b.value - a.value),
            },
            {
              emoji: "🏏", label: "Run Machine",
              rows: tids.map(tid => ({ teamId: tid, value: activeAgg[tid].runs, display: `${activeAgg[tid].runs} runs` })).sort((a, b) => b.value - a.value),
            },
            {
              emoji: "🎳", label: "Wicket Machine",
              rows: tids.map(tid => ({ teamId: tid, value: activeAgg[tid].wickets, display: `${activeAgg[tid].wickets} wkts` })).sort((a, b) => b.value - a.value),
            },
            {
              emoji: "💣", label: "Six Appeal",
              rows: tids.map(tid => ({ teamId: tid, value: activeAgg[tid].sixes, display: `${activeAgg[tid].sixes} sixes` })).sort((a, b) => b.value - a.value),
            },
            {
              emoji: "🔵", label: "Four Machine",
              rows: tids.map(tid => ({ teamId: tid, value: activeAgg[tid].fours, display: `${activeAgg[tid].fours} fours` })).sort((a, b) => b.value - a.value),
            },
            {
              emoji: "🤲", label: "Safe Hands",
              rows: tids.map(tid => ({ teamId: tid, value: activeAgg[tid].catches, display: `${activeAgg[tid].catches} catches` })).sort((a, b) => b.value - a.value),
            },
            {
              emoji: "👔", label: "Captain Clutch",
              rows: tids.map(tid => ({ teamId: tid, value: activeAgg[tid].captainPts, display: `${FANTASY_TEAMS[tid]?.captain.split(" ").slice(-1)[0]} · ${activeAgg[tid].captainPts} pts` })).sort((a, b) => b.value - a.value),
            },
            {
              emoji: "🥈", label: "VC Value",
              rows: tids.map(tid => ({ teamId: tid, value: activeAgg[tid].vcPts, display: `${FANTASY_TEAMS[tid]?.vc.split(" ").slice(-1)[0]} · ${activeAgg[tid].vcPts} pts` })).sort((a, b) => b.value - a.value),
            },
            {
              emoji: "🦆", label: "Duck Brigade",
              rows: tids.map(tid => ({ teamId: tid, value: activeAgg[tid].ducks, display: `${activeAgg[tid].ducks} ducks` })).sort((a, b) => b.value - a.value),
            },
            {
              emoji: "💎", label: "Best Value",
              rows: tids.map(tid => { const tot = teamScores.find(s => s.id === tid)?.total ?? 0; const v = activeAgg[tid].price > 0 ? tot / activeAgg[tid].price : 0; return { teamId: tid, value: v, display: `${v.toFixed(1)} pts/cr` }; }).sort((a, b) => b.value - a.value),
            },
            {
              emoji: "📊", label: "Most Consistent",
              rows: tids.map(tid => { const sd = stdDev(rawScores[tid] || []); return { teamId: tid, value: sd, display: `σ ${sd.toFixed(0)}` }; }).sort((a, b) => a.value - b.value),
            },
          ];

          return (
            <div style={{ marginTop: 22 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div className="sec-title" style={{ marginBottom: 0 }}>Season Race</div>
                <div style={{ display: "flex", background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, overflow: "hidden" }}>
                  {(["all", "xi"] as const).map(f => (
                    <button key={f} onClick={() => setChartXiFilter(f)}
                      style={{
                        padding: "4px 9px", fontSize: "0.6rem", fontWeight: 700, border: "none", cursor: "pointer",
                        fontFamily: "inherit",
                        background: chartXiFilter === f ? "rgba(255,255,255,0.12)" : "transparent",
                        color: chartXiFilter === f ? "var(--text)" : "var(--text-3)",
                        letterSpacing: "0.04em",
                      }}>
                      {f === "all" ? "All" : "Top XI"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Line chart */}
              <div style={{ background: "var(--surface)", borderRadius: 14, padding: "14px 10px 8px", border: "1px solid rgba(255,255,255,0.07)" }}>
                {(() => {
                  // Anti-collision for end labels
                  const rawLabels = sortedByFinal.map(team => {
                    const lastPt = team.points[team.points.length - 1];
                    return { team, rawY: lastPt ? yOf(lastPt.cum) : 0, cum: lastPt?.cum ?? 0 };
                  }).sort((a, b) => a.rawY - b.rawY);
                  const MIN_GAP = 17;
                  const adjY = rawLabels.map(l => l.rawY);
                  for (let i = 1; i < adjY.length; i++) {
                    if (adjY[i] - adjY[i - 1] < MIN_GAP) adjY[i] = adjY[i - 1] + MIN_GAP;
                  }
                  const labelMap: Record<string, number> = {};
                  rawLabels.forEach((l, i) => { labelMap[l.team.teamId] = adjY[i]; });

                  const getMatchPts = (team: typeof sortedByFinal[0], idx: number) => {
                    const pts = team.points;
                    if (!pts[idx]) return 0;
                    return idx === 0 ? pts[0].cum : pts[idx].cum - pts[idx - 1].cum;
                  };

                  const handleSvgInteract = (e: React.TouchEvent<SVGSVGElement> | React.MouseEvent<SVGSVGElement>) => {
                    const svgEl = e.currentTarget;
                    const rect = svgEl.getBoundingClientRect();
                    const clientX = 'touches' in e
                      ? (e as React.TouchEvent<SVGSVGElement>).touches[0]?.clientX ?? 0
                      : (e as React.MouseEvent<SVGSVGElement>).clientX;
                    const relX = ((clientX - rect.left) / rect.width) * W;
                    const rawIdx = Math.round(((relX - PL) / CW) * (n - 1));
                    setChartHover(Math.max(0, Math.min(n - 1, rawIdx)));
                  };

                  const hovMatchNum = chartHover !== null ? allMatchNums[chartHover] : null;
                  const hoverData = chartHover !== null && hovMatchNum !== null
                    ? sortedByFinal.map(team => ({
                        team,
                        matchPts: getMatchPts(team, chartHover),
                        cum: team.points[chartHover]?.cum ?? 0,
                      })).sort((a, b) => b.matchPts - a.matchPts)
                    : null;

                  const AVT_R = 8;

                  return (
                    <div style={{ position: "relative" }}>
                      {/* Tooltip overlay */}
                      {hoverData && hovMatchNum !== null && (
                        <div style={{
                          position: "absolute", top: 4, left: "50%", transform: "translateX(-50%)",
                          background: "rgba(12,12,16,0.97)", border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 12, padding: "8px 12px", zIndex: 10,
                          display: "flex", alignItems: "center", gap: 10,
                          backdropFilter: "blur(10px)", pointerEvents: "none",
                          boxShadow: "0 6px 24px rgba(0,0,0,0.6)",
                        }}>
                          <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.05em" }}>M{hovMatchNum}</span>
                          <div style={{ display: "flex", gap: 9 }}>
                            {hoverData.map(({ team, matchPts, cum }) => {
                              const ft = FANTASY_TEAMS[team.teamId];
                              return (
                                <div key={team.teamId} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                                  <div style={{ width: 24, height: 24, borderRadius: "50%", overflow: "hidden", border: `2px solid ${team.color}`, flexShrink: 0 }}>
                                    <img src={`${import.meta.env.BASE_URL}avatars/${ft.avatar}`} alt={ft.owner}
                                      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: ft.avatarPosition || "center center" }} />
                                  </div>
                                  <span style={{ fontSize: "0.68rem", fontWeight: 700, color: team.color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>+{matchPts}</span>
                                  <span style={{ fontSize: "0.5rem", color: "var(--text-3)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{cum}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible", touchAction: "none", display: "block" }}
                        onTouchStart={handleSvgInteract}
                        onTouchMove={handleSvgInteract}
                        onTouchEnd={() => setChartHover(null)}
                        onMouseMove={handleSvgInteract}
                        onMouseLeave={() => setChartHover(null)}
                      >
                        <defs>
                          {sortedByFinal.map(team => (
                            <linearGradient key={team.teamId + "-grad"} id={`area-${team.teamId}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={team.color} stopOpacity="0.18" />
                              <stop offset="100%" stopColor={team.color} stopOpacity="0" />
                            </linearGradient>
                          ))}
                          {sortedByFinal.map(team => {
                            const lastI = team.points.length - 1;
                            const cx = xOf(lastI) + 6 + AVT_R;
                            const cy = labelMap[team.teamId] ?? yOf(team.points[lastI]?.cum ?? 0);
                            return (
                              <clipPath key={`clip-${team.teamId}`} id={`clip-avatar-${team.teamId}`} clipPathUnits="userSpaceOnUse">
                                <circle cx={cx} cy={cy} r={AVT_R} />
                              </clipPath>
                            );
                          })}
                          <filter id="leader-glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                          </filter>
                        </defs>

                        {/* Baseline */}
                        <line x1={PL} y1={bottom} x2={W - PR} y2={bottom}
                          stroke="rgba(255,255,255,0.08)" strokeWidth={0.8} />

                        {/* Grid lines + Y labels */}
                        {[0.25, 0.5, 0.75, 1].map(v => {
                          const yv = yOf(maxCum * v);
                          const val = Math.round(maxCum * v);
                          return (
                            <g key={v}>
                              <line x1={PL} y1={yv} x2={W - PR} y2={yv}
                                stroke="rgba(255,255,255,0.04)" strokeWidth={0.7} strokeDasharray="3,5" />
                              <text x={PL - 3} y={yv + 2.5} textAnchor="end"
                                fontSize={5.5} fill="rgba(255,255,255,0.18)" style={{ fontFamily: "Inter, sans-serif" }}>{val}</text>
                            </g>
                          );
                        })}

                        {/* Area fills */}
                        {[...sortedByFinal].reverse().map(team => {
                          const pts = team.points.map((p, i) => ({ x: xOf(i), y: yOf(p.cum) }));
                          if (pts.length < 2) return null;
                          const linePath = smoothPath(pts);
                          const lastPt = pts[pts.length - 1];
                          const firstPt = pts[0];
                          const areaPath = `${linePath} L ${lastPt.x.toFixed(1)},${bottom.toFixed(1)} L ${firstPt.x.toFixed(1)},${bottom.toFixed(1)} Z`;
                          return <path key={team.teamId + "-area"} d={areaPath} fill={`url(#area-${team.teamId})`} />;
                        })}

                        {/* Team lines */}
                        {sortedByFinal.map(team => {
                          const pts = team.points.map((p, i) => ({ x: xOf(i), y: yOf(p.cum) }));
                          if (pts.length < 2) return null;
                          const isLeader = team.teamId === leader.id;
                          const linePath = smoothPath(pts);
                          const lastPt = pts[pts.length - 1];
                          return (
                            <g key={team.teamId} filter={isLeader ? "url(#leader-glow)" : undefined}>
                              <path d={linePath} fill="none" stroke={team.color}
                                strokeWidth={isLeader ? 2.4 : 1.7}
                                strokeLinecap="round" strokeLinejoin="round"
                                opacity={chartHover !== null ? 0.45 : (isLeader ? 1 : 0.85)} />
                              <circle cx={lastPt.x} cy={lastPt.y} r={isLeader ? 3.5 : 2.5}
                                fill="var(--surface)" stroke={team.color} strokeWidth={isLeader ? 2 : 1.5}
                                opacity={chartHover !== null ? 0.3 : 1} />
                            </g>
                          );
                        })}

                        {/* Interactive hairline + hover dots */}
                        {chartHover !== null && (() => {
                          const hx = xOf(chartHover);
                          return (
                            <g>
                              <line x1={hx} y1={PT} x2={hx} y2={bottom}
                                stroke="rgba(255,255,255,0.3)" strokeWidth={1} strokeDasharray="2,3" />
                              {sortedByFinal.map(team => {
                                const pt = team.points[chartHover];
                                if (!pt) return null;
                                const isLeader = team.teamId === leader.id;
                                return (
                                  <g key={team.teamId + "-hdot"}>
                                    <circle cx={hx} cy={yOf(pt.cum)} r={isLeader ? 5.5 : 4.5}
                                      fill={team.color} stroke="var(--surface)" strokeWidth={1.5} />
                                  </g>
                                );
                              })}
                            </g>
                          );
                        })()}

                        {/* End labels — avatar circles */}
                        {sortedByFinal.map(team => {
                          const lastPt = team.points[team.points.length - 1];
                          if (!lastPt) return null;
                          const lastI = team.points.length - 1;
                          const lx = xOf(lastI) + 6;
                          const ly = labelMap[team.teamId] ?? yOf(lastPt.cum);
                          const ft = FANTASY_TEAMS[team.teamId];
                          const isLeader = team.teamId === leader.id;
                          return (
                            <g key={team.teamId + "-lbl"} opacity={chartHover !== null ? 0.25 : 1}>
                              <circle cx={lx + AVT_R} cy={ly} r={AVT_R + 2} fill={team.color} opacity={0.22} />
                              <image href={`${import.meta.env.BASE_URL}avatars/${ft.avatar}`}
                                x={lx} y={ly - AVT_R} width={AVT_R * 2} height={AVT_R * 2}
                                clipPath={`url(#clip-avatar-${team.teamId})`}
                                preserveAspectRatio="xMidYMid slice" />
                              <circle cx={lx + AVT_R} cy={ly} r={AVT_R} fill="none" stroke={team.color}
                                strokeWidth={isLeader ? 2 : 1.5} />
                              <text x={lx + AVT_R * 2 + 3} y={ly + 2.5} fontSize={6} fill={team.color}
                                fontWeight="600" style={{ fontFamily: "Inter, sans-serif" }}>{lastPt.cum}</text>
                            </g>
                          );
                        })}

                        {/* X labels */}
                        {allMatchNums.filter((_, i) =>
                          i === 0 || i === n - 1 || (n > 4 && i % Math.ceil(n / 5) === 0)
                        ).map(mn => {
                          const i = allMatchNums.indexOf(mn);
                          return (
                            <text key={mn} x={xOf(i)} y={H - 4} textAnchor="middle"
                              fontSize={6} fill={chartHover !== null && allMatchNums[chartHover] === mn ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.2)"}
                              fontWeight={chartHover !== null && allMatchNums[chartHover] === mn ? "700" : "400"}
                              style={{ fontFamily: "Inter, sans-serif" }}>M{mn}</text>
                          );
                        })}

                        {/* Full transparent hit area */}
                        <rect x={PL} y={PT} width={CW} height={CH} fill="transparent" />
                      </svg>
                    </div>
                  );
                })()}
              </div>

              {/* Award stepper */}
              {(() => {
                const safeIdx = Math.min(selectedAwardIdx, awardsV2.length - 1);
                const award = awardsV2[safeIdx];
                const winner = award?.rows[0];
                const winnerFt = FANTASY_TEAMS[winner?.teamId];
                const maxVal = Math.max(...(award?.rows.map(r => r.value) ?? [1]), 1);
                return (
                  <div style={{ marginTop: 22 }}>
                    {/* Section title + controls */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div className="sec-title" style={{ marginBottom: 0 }}>Awards</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {/* All / Top XI toggle */}
                        <div style={{ display: "flex", background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, overflow: "hidden" }}>
                          {(["all", "xi"] as const).map(f => (
                            <button key={f} onClick={() => setAwardXiFilter(f)}
                              style={{
                                padding: "4px 9px", fontSize: "0.6rem", fontWeight: 700, border: "none", cursor: "pointer",
                                background: awardXiFilter === f ? "rgba(255,255,255,0.12)" : "transparent",
                                color: awardXiFilter === f ? "var(--text)" : "var(--text-3)",
                                letterSpacing: "0.04em",
                              }}>
                              {f === "all" ? "All" : "Top XI"}
                            </button>
                          ))}
                        </div>
                        {/* Award picker */}
                        <select
                          value={safeIdx}
                          onChange={e => setSelectedAwardIdx(Number(e.target.value))}
                          style={{
                            background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.10)",
                            borderRadius: 8, color: "var(--text-2)", fontSize: "0.65rem", fontWeight: 600,
                            padding: "5px 8px", cursor: "pointer", outline: "none", maxWidth: 140,
                          }}
                        >
                          {awardsV2.map((a, i) => (
                            <option key={a.label} value={i}>{a.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Single award card */}
                    {award && winnerFt && (
                      <div style={{ background: "var(--surface)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
                        <div style={{ padding: "9px 12px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.07em", textTransform: "uppercase" as const }}>{award.label}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <div style={{ width: 16, height: 16, borderRadius: "50%", overflow: "hidden", border: `1.5px solid ${winnerFt.color}`, flexShrink: 0 }}>
                              <img src={`${import.meta.env.BASE_URL}avatars/${winnerFt.avatar}`} alt={winnerFt.owner}
                                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: winnerFt.avatarPosition || "center" }} />
                            </div>
                            <span style={{ fontSize: "0.63rem", fontWeight: 700, color: winnerFt.color }}>{winnerFt.owner}</span>
                          </div>
                        </div>
                        <div style={{ padding: "7px 12px 9px", display: "flex", flexDirection: "column", gap: 6 }}>
                          {award.rows.map((row, ri) => {
                            const ft = FANTASY_TEAMS[row.teamId];
                            if (!ft) return null;
                            const isWinner = ri === 0;
                            const pct = maxVal > 0 ? (row.value / maxVal) * 100 : 0;
                            return (
                              <div key={row.teamId} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: "0.52rem", fontWeight: 700, color: isWinner ? "var(--gold)" : "var(--text-3)", width: 10, textAlign: "center" as const, flexShrink: 0 }}>{ri + 1}</span>
                                <div style={{ width: 20, height: 20, borderRadius: "50%", overflow: "hidden", border: `1.5px solid ${ft.color}${isWinner ? "" : "66"}`, flexShrink: 0 }}>
                                  <img src={`${import.meta.env.BASE_URL}avatars/${ft.avatar}`} alt={ft.owner}
                                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: ft.avatarPosition || "center" }} />
                                </div>
                                <span style={{ fontSize: "0.68rem", fontWeight: isWinner ? 700 : 400, color: isWinner ? ft.color : "var(--text-2)", width: 42, flexShrink: 0 }}>{ft.owner}</span>
                                <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                                  <div style={{ width: `${pct}%`, height: "100%", background: ft.color, borderRadius: 2, opacity: isWinner ? 1 : 0.4 }} />
                                </div>
                                <span style={{ fontSize: "0.63rem", fontWeight: isWinner ? 700 : 400, color: isWinner ? ft.color : "var(--text-3)", minWidth: 58, textAlign: "right" as const, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                                  {row.display}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })()}

      </div>
    );
  };

  const TEAM_ABBREVS: Record<string, string> = {
    "Royal Challengers Bengaluru": "RCB", "Sunrisers Hyderabad": "SRH",
    "Mumbai Indians": "MI", "Chennai Super Kings": "CSK",
    "Kolkata Knight Riders": "KKR", "Rajasthan Royals": "RR",
    "Punjab Kings": "PBKS", "Delhi Capitals": "DC",
    "Gujarat Titans": "GT", "Lucknow Super Giants": "LSG",
  };
  const shortMatchLabel = (label: string) =>
    label.split(" vs ").map(t => TEAM_ABBREVS[t.trim()] || t.trim().split(" ").map((w: string) => w[0]).join("")).join(" vs ");

  const Sparkline = ({ name, color }: { name: string; color: string }) => {
    const ms = (playerMatchPoints[name] || []).slice(-5);
    if (ms.length === 0) return null;
    const maxPts = Math.max(...ms.map(m => m.pts), 1);
    const BAR_W = 4, GAP = 2, H = 10, HIT_W = 10;
    const W = ms.length * (BAR_W + GAP) - GAP;
    const handleBarTap = (e: React.MouseEvent | React.TouchEvent, m: typeof ms[0]) => {
      e.stopPropagation();
      clearTimeout(sparkTipTimer.current);
      setSparkTip({ label: m.label, pts: m.pts });
      sparkTipTimer.current = setTimeout(() => setSparkTip(null), 2500);
    };
    return (
      <svg width={W} height={H} style={{ display: "block", marginTop: 3, flexShrink: 0, opacity: 0.8 }}>
        {ms.map((m, i) => {
          const barH = Math.max(2, Math.round((m.pts / maxPts) * H));
          const x = i * (BAR_W + GAP);
          return (
            <g key={i} onClick={(e) => handleBarTap(e, m)} style={{ cursor: "pointer" }}>
              <rect x={x} y={H - barH} width={BAR_W} height={barH} rx={1} fill={m.pts > 0 ? color : "#334155"} />
              <rect x={Math.max(0, x - 3)} y={0} width={HIT_W} height={H} fill="transparent" />
            </g>
          );
        })}
      </svg>
    );
  };

  const renderTeams = () => {
    const t = FANTASY_TEAMS[selectedTeam];
    const td = getTeamData(selectedTeam, playerPoints);
    const roleCounts = td.players.reduce((acc: Record<string, number>, p) => {
      acc[p.role] = (acc[p.role] || 0) + 1;
      return acc;
    }, {});

    // Helper: extract match label + players for this team from a preview list
    const extractForTeam = (previews: typeof upcomingLineupPreviews) => {
      const playing = new Set<string>();
      const playerMatchLabel = new Map<string, string>();
      const infos: { matchLabel: string; playingTeams: string[] }[] = [];
      previews.forEach(lp => {
        const myPlayers = lp.preview.find(x => x.team.id === selectedTeam);
        if (myPlayers && myPlayers.activePlayers.length > 0) {
          const ti: any[] = lp.match.teamInfo || [];
          const matchLabel = ti.length >= 2
            ? `${ti[0]?.shortname || ""} vs ${ti[1]?.shortname || ""}`
            : lp.match.name;
          myPlayers.activePlayers.forEach(p => {
            playing.add(p.name);
            playerMatchLabel.set(p.name, matchLabel);
          });
          infos.push({ matchLabel, playingTeams: lp.playingTeams });
        }
      });
      return { playing, infos, playerMatchLabel };
    };

    const { playing: liveNowPlaying, infos: liveNowInfo } = extractForTeam(liveMatchPreviews);
    const { playing: nextMatchPlaying, infos: nextMatchInfoForTeam, playerMatchLabel: nextPlayerMatchLabel } = extractForTeam(upcomingLineupPreviews);

    const hasLiveNow = liveNowPlaying.size > 0;
    const hasNextMatch = nextMatchPlaying.size > 0;
    const hasAnyContext = hasLiveNow || hasNextMatch;

    const TEAM_BG: Record<string, string> = {
      rajveer:  `${import.meta.env.BASE_URL}lb-bg-rajveer.jpeg`,
      mombasa:  `${import.meta.env.BASE_URL}lb-bg-mumbai.jpeg`,
      mumbai:   `${import.meta.env.BASE_URL}lb-bg-mombasa.jpeg`,
      ponygoat: `${import.meta.env.BASE_URL}lb-bg-ponygoat.jpeg`,
    };

    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div className="sec-title" style={{ marginBottom: 0 }}>Teams</div>
          <button className="btn-primary" style={{ padding: "6px 10px", display: "flex", alignItems: "center", gap: 5 }} onClick={shareTeams} title="Share all teams">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            <span style={{ fontSize: "0.68rem" }}>Share</span>
          </button>
        </div>
        <div className="team-avatar-row" data-no-swipe="true">
          {teamScores.map((s, i) => {
            const ft = s.team;
            const isActive = selectedTeam === ft.id;
            const rankNum = i + 1;
            const shortName = ft.id === "rajveer" ? "Raj" : ft.id === "mombasa" ? "Rahul" : ft.id === "mumbai" ? "Smeet" : "Deb";
            const hasPoints = Object.keys(playerPoints).length > 0;
            return (
              <button key={ft.id}
                className={`team-avatar-btn${isActive ? " active" : ""}`}
                style={{ "--ta-color": ft.color } as React.CSSProperties}
                onClick={() => setSelectedTeam(ft.id)}>
                <div className="team-avatar-ring">
                  <img
                    src={`${import.meta.env.BASE_URL}avatars/${ft.avatar}`}
                    alt={ft.owner}
                    className="team-avatar-img"
                    style={{ objectPosition: ft.avatarPosition || "center center" }}
                  />
                  {/* rank badge hidden but order preserved */}
                </div>
                <span className="team-avatar-name">{shortName}</span>
              </button>
            );
          })}
        </div>
        <div className="team-header-card" style={{ "--team-color": t.color } as React.CSSProperties}>
          {/* Blurred team artwork background */}
          <div style={{
            position: "absolute", inset: -6, zIndex: 0,
            backgroundImage: `url(${TEAM_BG[selectedTeam]})`,
            backgroundSize: "cover", backgroundPosition: "center 30%",
            filter: "blur(24px) brightness(0.55) saturate(1.4)",
          }} />
          <div style={{
            position: "absolute", inset: 0, zIndex: 1,
            background: `linear-gradient(135deg, ${t.color}14 0%, rgba(9,9,11,0.28) 100%)`,
          }} />
          <div style={{ flex: 1, position: "relative", zIndex: 2 }}>
            <div className="team-hname" style={{ color: t.color, textShadow: "0 1px 6px rgba(0,0,0,1)" }}>{t.name}</div>
            <div
              style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.92)", marginBottom: 4 }}>{t.owner} </div>
            <div className="team-roles">
              {Object.entries(roleCounts).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([role, n]) => (
                <span key={role} className="role-badge"
                  style={{ color: ROLE_COLORS[role], borderColor: ROLE_COLORS[role] + "44", background: ROLE_COLORS[role] + "11" }}>
                  {n} {role}
                </span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: "right", position: "relative", zIndex: 2 }}>
            <div className="team-htotal" style={{ color: Object.keys(playerPoints).length === 0 ? "var(--text-3)" : t.color, textShadow: `0 0 10px ${t.color}55, 0 1px 4px rgba(0,0,0,1)` }}>
              {Object.keys(playerPoints).length === 0 ? "—" : td.total}
            </div>
            <div className="team-hlabel" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>total pts</div>
          </div>
        </div>
        {/* Match status banner — shows LIVE and/or UPCOMING players */}
        {hasAnyContext && (
          <div className={`team-next-match-banner ${hasLiveNow ? "has-live" : ""}`}>

            {/* LIVE section */}
            {hasLiveNow && (
              <div style={{ marginBottom: hasNextMatch ? 12 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <span className="live-pulse-dot" />
                  <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "#f87171", letterSpacing: "0.06em" }}>LIVE</span>
                  {liveNowInfo[0] && <span style={{ fontSize: "0.65rem", color: "var(--text-3)" }}>{liveNowInfo[0].matchLabel}</span>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {td.players.filter(p => liveNowPlaying.has(p.name)).map(p => (
                    <div key={p.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f87171", display: "inline-block", flexShrink: 0 }} />
                        <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "#fca5a5" }}>{p.name}</span>
                        {p.name === t.captain && <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#d4a843" }}>C</span>}
                        {p.name === t.vc && <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-3)" }}>VC</span>}
                      </div>
                      <span style={{ fontSize: "0.62rem", color: IPL_COLORS[p.ipl] || "var(--text-3)", fontWeight: 600 }}>{p.ipl}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Divider when both sections exist */}
            {hasLiveNow && hasNextMatch && (
              <div style={{ borderTop: "1px solid var(--border)", marginBottom: 12 }} />
            )}

            {/* UPCOMING section */}
            {hasNextMatch && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" as const }}>
                  <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.06em" }}>NEXT</span>
                  {nextMatchInfoForTeam.map((info, idx) => (
                    <span key={idx} style={{ fontSize: "0.65rem", color: "var(--text-2)" }}>
                      {idx > 0 && <span style={{ color: "var(--text-3)", marginRight: 4 }}>·</span>}
                      {info.matchLabel}
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {td.players.filter(p => nextMatchPlaying.has(p.name) && !liveNowPlaying.has(p.name)).map(p => (
                    <div key={p.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--text-2)" }}>{p.name}</span>
                        {p.name === t.captain && <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#d4a843" }}>C</span>}
                        {p.name === t.vc && <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-3)" }}>VC</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {nextMatchInfoForTeam.length > 1 && nextPlayerMatchLabel.get(p.name) && (
                          <span style={{ fontSize: "0.55rem", color: "var(--text-3)" }}>{nextPlayerMatchLabel.get(p.name)}</span>
                        )}
                        <span style={{ fontSize: "0.62rem", color: IPL_COLORS[p.ipl] || "var(--text-3)", fontWeight: 600 }}>{p.ipl}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {(() => {
          const renderBreakdown = (p: { name: string; raw: number; adj: number; role: string; ipl: string }) => {
            const playerName = p.name;
            const breakdown = playerMatchPoints[playerName] || [];
            const isCap = playerName === t.captain;
            const isVC = playerName === t.vc;
            const inTop11 = td.top11.has(playerName);
            const raw = p.raw;
            const adj = p.adj;
            const multiplier = isCap ? "× 2 (Captain)" : isVC ? "× 1.5 (VC)" : null;
            return (
              <div style={{
                background: "rgba(8,12,20,0.97)",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12,
                padding: "12px 14px", marginTop: 1, marginBottom: 1,
              }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {isCap && <span style={{ fontSize: "0.5rem", fontWeight: 800, color: "#d4a843", background: "rgba(212,168,67,0.14)", border: "1px solid rgba(212,168,67,0.3)", borderRadius: 5, padding: "1px 5px", letterSpacing: "0.04em" }}>C ×2</span>}
                    {isVC && <span style={{ fontSize: "0.5rem", fontWeight: 800, color: "#9e8e7e", background: "rgba(158,142,126,0.12)", border: "1px solid rgba(158,142,126,0.28)", borderRadius: 5, padding: "1px 5px", letterSpacing: "0.04em" }}>VC ×1.5</span>}
                    {!inTop11 && <span style={{ fontSize: "0.5rem", color: "var(--text-3)", background: "rgba(255,255,255,0.05)", borderRadius: 4, padding: "1px 5px" }}>bench</span>}
                    <span style={{ fontSize: "0.58rem", color: "var(--text-3)" }}>Match breakdown</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setExpandedPlayer(null); }}
                    style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: "0.7rem", padding: "3px 7px", borderRadius: 6, lineHeight: 1 }}>✕</button>
                </div>

                {breakdown.length === 0 ? (
                  <div style={{ color: "var(--text-3)", fontSize: "0.72rem", textAlign: "center" as const, padding: "10px 0" }}>No match data yet</div>
                ) : (
                  <>
                    {breakdown.map((entry, ei) => {
                      const s = entry.stats;
                      const bdKey = `${playerName}-${ei}`;
                      const isEntryOpen = expandedBdMatches.has(bdKey);
                      const toggleEntry = () => setExpandedBdMatches(prev => {
                        const n = new Set(prev); n.has(bdKey) ? n.delete(bdKey) : n.add(bdKey); return n;
                      });
                      const lines: { label: string; pts: number; color: string }[] = [];
                      if (s) {
                        lines.push({ label: "Playing XI", pts: 4, color: "#64748b" });
                        if (s.runs > 0) lines.push({ label: `${s.runs} runs (${s.balls}b)`, pts: s.runs, color: "#f97316" });
                        if (s.fours > 0) lines.push({ label: `${s.fours} fours`, pts: s.fours * 4, color: "#fb923c" });
                        if (s.sixes > 0) lines.push({ label: `${s.sixes} sixes`, pts: s.sixes * 6, color: "#fbbf24" });
                        if (s.duck) lines.push({ label: "Duck", pts: -2, color: "#ef4444" });
                        const r = s.runs; const b = s.balls;
                        if (r >= 100) lines.push({ label: "Century bonus", pts: 16, color: "#34d399" });
                        else if (r >= 75) lines.push({ label: "75+ bonus", pts: 12, color: "#34d399" });
                        else if (r >= 50) lines.push({ label: "50+ bonus", pts: 8, color: "#34d399" });
                        else if (r >= 25) lines.push({ label: "25+ bonus", pts: 4, color: "#34d399" });
                        if (b >= 10 || r >= 20) {
                          const sr = b > 0 ? (r / b) * 100 : 0;
                          if (sr > 190) lines.push({ label: `SR ${sr.toFixed(0)} bonus`, pts: 8, color: "#34d399" });
                          else if (sr > 170) lines.push({ label: `SR ${sr.toFixed(0)} bonus`, pts: 6, color: "#34d399" });
                          else if (sr > 150) lines.push({ label: `SR ${sr.toFixed(0)} bonus`, pts: 4, color: "#34d399" });
                          else if (sr >= 130) lines.push({ label: `SR ${sr.toFixed(0)} bonus`, pts: 2, color: "#34d399" });
                          else if (sr >= 70 && sr <= 100) lines.push({ label: `SR ${sr.toFixed(0)} penalty`, pts: -2, color: "#ef4444" });
                          else if (sr >= 60 && sr < 70) lines.push({ label: `SR ${sr.toFixed(0)} penalty`, pts: -4, color: "#ef4444" });
                          else if (sr >= 50 && sr < 60) lines.push({ label: `SR ${sr.toFixed(0)} penalty`, pts: -6, color: "#ef4444" });
                        }
                        if (s.wickets > 0) lines.push({ label: `${s.wickets} wkt${s.wickets > 1 ? "s" : ""}`, pts: s.wickets * 30, color: "#60a5fa" });
                        if (s.lbwBowled > 0) lines.push({ label: `${s.lbwBowled} LBW/Bowled`, pts: s.lbwBowled * 8, color: "#60a5fa" });
                        if (s.dots > 0) lines.push({ label: `${s.dots} dots`, pts: s.dots * 2, color: "#818cf8" });
                        if (s.maidens > 0) lines.push({ label: `${s.maidens} maiden${s.maidens > 1 ? "s" : ""}`, pts: s.maidens * 12, color: "#818cf8" });
                        const w = s.wickets;
                        if (w >= 5) lines.push({ label: "5-wkt haul", pts: 16, color: "#34d399" });
                        else if (w >= 4) lines.push({ label: "4-wkt haul", pts: 12, color: "#34d399" });
                        else if (w >= 3) lines.push({ label: "3-wkt haul", pts: 8, color: "#34d399" });
                        const overs = s.ballsBowled / 6;
                        if (overs >= 2) {
                          const eco = s.runsConceded / overs;
                          if (eco < 5) lines.push({ label: `Eco ${eco.toFixed(1)}`, pts: 8, color: "#34d399" });
                          else if (eco < 6) lines.push({ label: `Eco ${eco.toFixed(1)}`, pts: 6, color: "#34d399" });
                          else if (eco <= 7) lines.push({ label: `Eco ${eco.toFixed(1)}`, pts: 4, color: "#34d399" });
                          else if (eco <= 8) lines.push({ label: `Eco ${eco.toFixed(1)}`, pts: 2, color: "#34d399" });
                          else if (eco >= 10 && eco <= 11) lines.push({ label: `Eco ${eco.toFixed(1)}`, pts: -2, color: "#ef4444" });
                          else if (eco > 11 && eco <= 12) lines.push({ label: `Eco ${eco.toFixed(1)}`, pts: -4, color: "#ef4444" });
                          else if (eco > 12) lines.push({ label: `Eco ${eco.toFixed(1)}`, pts: -6, color: "#ef4444" });
                        }
                        if (s.catches > 0) lines.push({ label: `${s.catches} catch${s.catches > 1 ? "es" : ""}`, pts: s.catches * 8, color: "#a78bfa" });
                        if (s.catches >= 3) lines.push({ label: "3+ catch bonus", pts: 4, color: "#a78bfa" });
                        if (s.runOuts > 0) lines.push({ label: `${s.runOuts} run out${s.runOuts > 1 ? "s" : ""}`, pts: s.runOuts * 10, color: "#a78bfa" });
                        if ((s as any).sharedRunOuts > 0) lines.push({ label: `${(s as any).sharedRunOuts} shared RO`, pts: (s as any).sharedRunOuts * 5, color: "#a78bfa" });
                        if (s.stumpings > 0) lines.push({ label: `${s.stumpings} stumping${s.stumpings > 1 ? "s" : ""}`, pts: s.stumpings * 12, color: "#a78bfa" });
                      }

                      const computed = lines.reduce((a, l) => a + l.pts, 0);
                      const diff = s ? entry.pts - computed : 0;

                      return (
                        <div key={ei} style={{ marginBottom: ei < breakdown.length - 1 ? 6 : 0, paddingBottom: ei < breakdown.length - 1 ? 6 : 0, borderBottom: ei < breakdown.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                          {/* Match row — tap to expand score lines */}
                          <div onClick={s ? toggleEntry : undefined}
                            style={{ display: "flex", alignItems: "center", gap: 6, cursor: s ? "pointer" : "default", WebkitTapHighlightColor: "transparent", padding: "2px 0" }}>
                            <span style={{ fontSize: "0.5rem", fontWeight: 700, color: "var(--text-3)", background: "rgba(255,255,255,0.06)", borderRadius: 4, padding: "1px 4px", flexShrink: 0 }}>
                              {entry.matchNum < 900 ? `M${entry.matchNum}` : "LIVE"}
                            </span>
                            <span style={{ fontSize: "0.65rem", color: "var(--text-2)", flex: 1 }}>{shortMatchLabel(entry.label)}</span>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: entry.source === "official" ? "#34d399" : "#fbbf24", flexShrink: 0 }} />
                            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.92rem", fontWeight: 700, color: entry.pts > 0 ? "var(--text)" : "var(--text-3)", minWidth: 26, textAlign: "right" as const }}>
                              {entry.pts}
                            </span>
                            {s && (
                              <svg width="8" height="5" viewBox="0 0 10 6" fill="none" style={{ flexShrink: 0, transition: "transform 0.18s", transform: isEntryOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                                <path d="M1 1l4 4 4-4" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </div>

                          {/* Score lines — shown only when expanded */}
                          {isEntryOpen && s && lines.length > 0 && (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 1, columnGap: 10, padding: "6px 8px", background: "rgba(255,255,255,0.02)", borderRadius: 7, marginTop: 4 }}>
                              {lines.map((line, li) => (
                                <React.Fragment key={li}>
                                  <span style={{ fontSize: "0.6rem", color: "var(--text-3)" }}>{line.label}</span>
                                  <span style={{ fontSize: "0.6rem", fontWeight: 600, color: line.pts >= 0 ? line.color : "#ef4444", textAlign: "right" as const }}>
                                    {line.pts > 0 ? "+" : ""}{line.pts}
                                  </span>
                                </React.Fragment>
                              ))}
                              {Math.abs(diff) > 0 && (
                                <React.Fragment>
                                  <span style={{ fontSize: "0.6rem", color: "var(--text-3)", fontStyle: "italic" as const }}>other</span>
                                  <span style={{ fontSize: "0.6rem", fontWeight: 600, color: diff >= 0 ? "#a78bfa" : "#ef4444", textAlign: "right" as const }}>{diff > 0 ? "+" : ""}{diff}</span>
                                </React.Fragment>
                              )}
                            </div>
                          )}
                          {!s && entry.source === "official" && (
                            <div style={{ fontSize: "0.58rem", color: "var(--text-3)", marginTop: 2 }}>Stats syncing...</div>
                          )}
                        </div>
                      );
                    })}

                    {/* Footer */}
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 10, paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.62rem", color: "var(--text-3)" }}>
                        {multiplier ? `${raw} raw · ${multiplier}` : (inTop11 ? "Total" : "Bench — not counted")}
                      </span>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "1rem", fontWeight: 700, color: inTop11 ? t.color : "var(--text-3)" }}>{adj} pts</span>
                    </div>

                    {/* Scoring guide */}
                    <div style={{ marginTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 8 }}>
                      <button onClick={() => setScoringGuideOpen(o => !o)}
                        style={{ display: "flex", alignItems: "center", gap: 5, width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, WebkitTapHighlightColor: "transparent" }}>
                        <span style={{ fontSize: "0.55rem", color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontWeight: 600, flex: 1, textAlign: "left" as const }}>Scoring guide</span>
                        <svg width="8" height="5" viewBox="0 0 10 6" fill="none" style={{ flexShrink: 0, transition: "transform 0.18s", transform: scoringGuideOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                          <path d="M1 1l4 4 4-4" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      {scoringGuideOpen && (
                        <div style={{ marginTop: 7, display: "grid", gridTemplateColumns: "1fr auto", rowGap: 3, columnGap: 14 }}>
                          {([
                            ["— BATTING —", ""],
                            ["Playing XI", "+4"], ["Run scored", "+1"], ["Four", "+4"], ["Six", "+6"],
                            ["25+ runs", "+4"], ["50+ runs", "+8"], ["75+ runs", "+12"], ["100+ runs", "+16"],
                            ["Duck", "−2"],
                            ["SR >190", "+8"], ["SR >170", "+6"], ["SR >150", "+4"], ["SR ≥130", "+2"],
                            ["SR 70–100", "−2"], ["SR 60–70", "−4"], ["SR <60", "−6"],
                            ["— BOWLING —", ""],
                            ["Wicket", "+30"], ["LBW/Bowled", "+8"], ["3W haul", "+8"], ["4W haul", "+12"], ["5W haul", "+16"],
                            ["Dot ball", "+2"], ["Maiden", "+12"],
                            ["Eco <5", "+8"], ["Eco <6", "+6"], ["Eco ≤7", "+4"], ["Eco ≤8", "+2"],
                            ["Eco 10–11", "−2"], ["Eco 11–12", "−4"], ["Eco >12", "−6"],
                            ["— FIELDING —", ""],
                            ["Catch", "+8"], ["3+ catches", "+4"], ["Run out", "+10"], ["Stumping", "+12"],
                          ] as [string, string][]).map(([label, val], i) => {
                            const isHeader = val === "";
                            return (
                              <React.Fragment key={i}>
                                <span style={{
                                  fontSize: isHeader ? "0.47rem" : "0.58rem",
                                  color: isHeader ? "var(--gold)" : label.length && val.startsWith("−") ? "#ef4444" : "var(--text-3)",
                                  fontWeight: isHeader ? 700 : 400,
                                  letterSpacing: isHeader ? "0.1em" : "0.02em",
                                  textTransform: isHeader ? "uppercase" as const : "none" as const,
                                  paddingTop: isHeader ? 5 : 0,
                                  gridColumn: isHeader ? "1 / -1" : undefined,
                                }}>{label}</span>
                                {!isHeader && (
                                  <span style={{ fontSize: "0.58rem", fontWeight: 700, textAlign: "right" as const, color: val.startsWith("−") ? "#ef4444" : "#4ade80" }}>{val}</span>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          };

          // Per-player state helper
          const getPlayerState = (name: string, ipl: string) => {
            const isLiveNow = hasLiveNow && liveNowPlaying.has(name);
            const isUpcoming = hasNextMatch && nextMatchPlaying.has(name) && !isLiveNow;
            const isDimmed = hasAnyContext && !isLiveNow && !isUpcoming;
            const glowColor = isLiveNow ? "#f87171" : isUpcoming ? (IPL_COLORS[ipl] || "#4ade80") : null;
            return { isLiveNow, isUpcoming, isDimmed, glowColor };
          };

          return (() => {
            const xi = td.players.filter(p => td.top11.has(p.name)).sort((a, b) => b.adj - a.adj);
            const bench = td.players.filter(p => !td.top11.has(p.name)).sort((a, b) => b.adj - a.adj);
            const xiTotal = xi.reduce((s, p) => s + p.adj, 0);
            const benchTotal = bench.reduce((s, p) => s + p.adj, 0);

            const CaptainBadge = () => (
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 17, height: 17, borderRadius: "50%",
                background: "rgba(212,168,67,0.22)", border: "1px solid rgba(212,168,67,0.55)",
                color: "#d4a843", fontSize: "0.44rem", fontWeight: 900,
                marginLeft: 5, verticalAlign: "middle", flexShrink: 0, letterSpacing: 0,
              }}>C</span>
            );
            const VCBadge = () => (
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 17, height: 17, borderRadius: "50%",
                background: "rgba(148,148,172,0.18)", border: "1px solid rgba(148,148,172,0.38)",
                color: "#a1a1aa", fontSize: "0.44rem", fontWeight: 900,
                marginLeft: 5, verticalAlign: "middle", flexShrink: 0, letterSpacing: 0,
              }}>VC</span>
            );

            const renderPlayer = (p: typeof xi[0], isBench: boolean) => {
              const isExp = expandedPlayer === p.name;
              const { isLiveNow, isUpcoming, isDimmed } = getPlayerState(p.name, p.ipl);
              const isCap = p.name === t.captain;
              const isVC = p.name === t.vc;
              const roleColor = ROLE_COLORS[p.role] || "var(--text-3)";
              const cardClass = [
                isBench ? "player-card benched" : "player-card",
                isCap ? "is-c" : isVC ? "is-vc" : "",
                isExp ? "player-expanded" : "",
                isLiveNow ? "live-now" : isUpcoming ? "playing-next" : isDimmed ? "not-playing-next" : ""
              ].filter(Boolean).join(" ");

              const iplColor = IPL_COLORS[p.ipl] || "rgba(255,255,255,0.15)";
              return (
                <React.Fragment key={p.name}>
                  <div className={cardClass} onClick={() => setExpandedPlayer(isExp ? null : p.name)}
                    style={{
                      background: isLiveNow
                        ? `linear-gradient(90deg, rgba(248,113,113,0.06) 0%, transparent 50%)`
                        : isExp
                        ? `linear-gradient(90deg, ${iplColor}0a 0%, transparent 55%)`
                        : `linear-gradient(90deg, ${iplColor}${isBench ? "05" : "08"} 0%, transparent 45%)`,
                      boxShadow: isLiveNow ? "inset 0 0 0 1px rgba(248,113,113,0.08)" : "none",
                    }}>

                    {/* IPL team logo */}
                    <img src={TEAM_LOGO_CDN[p.ipl]} alt={p.ipl} style={{ width: 32, height: 32, objectFit: "contain", flexShrink: 0, opacity: isBench ? 0.45 : 1 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />

                    {/* Name + role + sparkline */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "nowrap" as const }}>
                        <div className="player-name" style={{
                          color: isLiveNow ? "#fca5a5" : isBench ? "var(--text-3)" : "var(--text)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
                          fontSize: "0.88rem",
                        }}>{p.name}</div>
                        {isCap && <CaptainBadge />}
                        {isVC && <VCBadge />}
                        {isLiveNow && <span style={{ fontSize: "0.42rem", fontWeight: 800, color: "#f87171", letterSpacing: "0.09em", background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.28)", borderRadius: 3, padding: "1px 4px", flexShrink: 0, lineHeight: 1 }}>LIVE</span>}
                        {isUpcoming && !isLiveNow && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", flexShrink: 0, display: "inline-block", boxShadow: "0 0 5px #4ade8088" }} />}
                      </div>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, marginTop: 2, lineHeight: 1 }}>
                        <span style={{ fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: isBench ? "var(--text-3)" : roleColor, flexShrink: 0, lineHeight: 1, verticalAlign: "middle" }}>{p.role}</span>
                        {p.price != null && <>
                          <span style={{ fontSize: "0.5rem", fontWeight: 400, color: "rgba(255,255,255,0.2)", lineHeight: 1, verticalAlign: "middle" }}>·</span>
                          <span style={{ fontSize: "0.5rem", fontWeight: 500, color: "var(--text-3)", letterSpacing: "0.01em", flexShrink: 0, lineHeight: 1, verticalAlign: "middle" }}>{p.price}cr</span>
                        </>}
                        <span style={{ marginLeft: 4, display: "flex", alignItems: "flex-end" }}><Sparkline name={p.name} color={isBench ? "rgba(255,255,255,0.18)" : t.color} /></span>
                      </div>
                    </div>

                    {/* Points */}
                    <div style={{ textAlign: "right", flexShrink: 0, minWidth: 40 }}>
                      <div style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: isBench ? "1.12rem" : "1.32rem",
                        fontWeight: 700,
                        lineHeight: 1,
                        color: isLiveNow ? "#fca5a5" : isBench ? "var(--text-3)" : p.adj > 0 ? t.color : "rgba(255,255,255,0.2)",
                        textShadow: (!isBench && p.adj > 0) ? `0 0 18px ${t.color}55` : "none",
                      }}>{p.adj}</div>
                      {isCap && <div className="player-pts-raw" style={{ color: "#d4a843" }}>×2</div>}
                      {isVC && <div className="player-pts-raw" style={{ color: "#9e8e7e" }}>×1.5</div>}
                      {isBench && !isCap && !isVC && (
                        <div style={{ fontSize: "0.44rem", color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginTop: 2, opacity: 0.5 }}>bench</div>
                      )}
                      {!isBench && !isCap && !isVC && p.adj > 0 && (
                        <div style={{ fontSize: "0.44rem", color: t.color, opacity: 0.55, fontWeight: 600, letterSpacing: "0.06em", marginTop: 2 }}>pts</div>
                      )}
                    </div>
                  </div>
                  {isExp && renderBreakdown(p)}
                </React.Fragment>
              );
            };

            return (
              <>
                {/* === SEGMENTED PILL CONTROL === */}
                <div style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 22, padding: 3, marginBottom: 14, gap: 2 }}>
                  {([
                    ["xi",       "Playing XI", xiTotal > 0 ? `${xiTotal} pts` : ""],
                    ["bench",    "Bench",       benchTotal > 0 ? `${benchTotal} pts` : ""],
                    ["matchpts", "By Match Total", (xiTotal + benchTotal) > 0 ? `${xiTotal + benchTotal} pts` : ""],
                  ] as const).map(([id, label, badge]) => (
                    <button key={id} onClick={() => setTeamSection(id)}
                      style={{
                        flex: 1, padding: "6px 0 7px", borderRadius: 18, border: "none", cursor: "pointer",
                        fontFamily: "inherit", fontSize: "0.68rem", fontWeight: 600,
                        transition: "all 0.18s ease",
                        background: teamSection === id ? "var(--surface-3)" : "transparent",
                        color: teamSection === id ? (id === "xi" ? "#4ade80" : id === "bench" ? "var(--text)" : "var(--gold)") : "var(--text-3)",
                        boxShadow: teamSection === id ? "0 1px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)" : "none",
                        WebkitTapHighlightColor: "transparent",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
                      }}>
                      <span>{label}</span>
                      {badge ? <span style={{ fontSize: "0.58rem", opacity: 0.7, fontWeight: 500 }}>{badge}</span> : null}
                    </button>
                  ))}
                </div>

                {/* === PLAYING XI === */}
                {teamSection === "xi" && (
                  <div className="players-grid" style={{ borderTop: `2px solid ${t.color}70`, borderRadius: "var(--radius-md)", boxShadow: `0 -3px 14px ${t.color}33` }}>
                    {xi.map(p => renderPlayer(p, false))}
                  </div>
                )}

                {/* === BENCH === */}
                {teamSection === "bench" && (
                  <div className="players-grid" style={{ opacity: 0.82, borderTop: "1.5px solid rgba(255,255,255,0.05)", borderRadius: "var(--radius-md)" }}>
                    {bench.map(p => renderPlayer(p, true))}
                  </div>
                )}

                {/* === POINTS FROM EACH MATCH === */}
                {teamSection === "matchpts" && (() => {
                  const allNums = new Set<number>();
                  const matchLabels: Record<number, string> = {};
                  for (const entries of Object.values(playerMatchPoints)) {
                    for (const e of entries) {
                      if (e.matchNum < 900) {
                        allNums.add(e.matchNum);
                        if (!matchLabels[e.matchNum]) matchLabels[e.matchNum] = e.label;
                      }
                    }
                  }
                  const sortedNums = [...allNums].sort((a, b) => a - b);
                  if (sortedNums.length === 0) return null;

                  const allTeamPlayers = [...xi, ...bench];
                  const getAdj = (name: string, mn: number) => {
                    const isCap = name === t.captain;
                    const isVC = name === t.vc;
                    const e = (playerMatchPoints[name] || []).find((x: any) => x.matchNum === mn);
                    return e ? applyMultiplier(e.pts, isCap, isVC) : 0;
                  };
                  const hasEntry = (name: string, mn: number) =>
                    (playerMatchPoints[name] || []).some((x: any) => x.matchNum === mn);

                  const shortLabel = (label: string) =>
                    label.split(" vs ").map(t => IPL_TEAM_BADGE[t]?.abbr || t.split(" ").map((w: string) => w[0]).join("")).join(" vs ");

                  const matchData = sortedNums.map(mn => {
                    const players = allTeamPlayers
                      .filter(p => hasEntry(p.name, mn))
                      .map(p => ({
                        ...p, isCap: p.name === t.captain, isVC: p.name === t.vc,
                        pts: getAdj(p.name, mn),
                      })).sort((a, b) => b.pts - a.pts);
                    const total = players.reduce((s, p) => s + p.pts, 0);
                    return { mn, label: matchLabels[mn] || `Match ${mn}`, players, total };
                  });

                  const grandTotal = matchData.reduce((s, m) => s + m.total, 0);

                  return (
                    <div>
                      <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                          {matchData.map(({ mn, label, players, total }) => {
                            const short = shortLabel(label);
                            const isExpanded = expandedMatchNums.has(mn);
                            const toggleMn = () => setExpandedMatchNums(prev => {
                              const n = new Set(prev); n.has(mn) ? n.delete(mn) : n.add(mn); return n;
                            });
                            const [teamA, teamB] = short.split(" vs ");
                            const colorA = IPL_COLORS[teamA] || "rgba(255,255,255,0.15)";
                            const colorB = IPL_COLORS[teamB] || "rgba(255,255,255,0.15)";
                            return (
                              <div key={mn} style={{ borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden" as const, background: `linear-gradient(90deg, ${colorA}08 0%, transparent 40%, ${colorB}08 100%)` }}>
                                <button onClick={toggleMn} style={{ display: "flex", alignItems: "center", width: "100%", background: "transparent", border: "none", cursor: "pointer", padding: "10px 12px", gap: 10, WebkitTapHighlightColor: "transparent", minHeight: 52 }}>
                                  {/* Match badge */}
                                  <span style={{ fontSize: "0.5rem", fontWeight: 700, color: "var(--text-3)", background: "rgba(255,255,255,0.06)", borderRadius: 5, padding: "2px 6px", flexShrink: 0, lineHeight: 1.5 }}>M{mn}</span>
                                  {/* Team logos + names */}
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                                      <img src={TEAM_LOGO_CDN[teamA]} alt={teamA} style={{ width: 26, height: 26, objectFit: "contain" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.82rem", fontWeight: 600, letterSpacing: "0.04em", color: "var(--text)", width: 38 }}>{teamA}</span>
                                    </div>
                                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.56rem", color: "var(--text-3)", letterSpacing: "0.1em", flexShrink: 0 }}>VS</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                                      <img src={TEAM_LOGO_CDN[teamB]} alt={teamB} style={{ width: 26, height: 26, objectFit: "contain" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.82rem", fontWeight: 600, letterSpacing: "0.04em", color: "var(--text)", width: 38 }}>{teamB}</span>
                                    </div>
                                  </div>
                                  {/* Total + chevron */}
                                  <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-end", flexShrink: 0 }}>
                                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "1.28rem", fontWeight: 700, lineHeight: 1, color: total >= 120 ? "#d4a843" : "var(--text)", textShadow: total >= 120 ? "0 0 16px #d4a84355" : "none" }}>{total}</span>
                                    <span style={{ fontSize: "0.44rem", color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginTop: 2 }}>pts</span>
                                  </div>
                                  <svg width="7" height="5" viewBox="0 0 10 6" fill="none" style={{ transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0, marginLeft: 2 }}>
                                    <path d="M1 1l4 4 4-4" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </button>
                                {isExpanded && (
                                  <div style={{ borderTop: "1px solid var(--border)", padding: "6px 12px 10px" }}>
                                    {players.map((p, i) => {
                                      const pIplColor = IPL_COLORS[p.ipl] || "rgba(255,255,255,0.15)";
                                      return (
                                        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                                          {/* IPL badge */}
                                          <span style={{ fontSize: "0.44rem", fontWeight: 900, color: pIplColor, background: pIplColor + "18", border: `1px solid ${pIplColor}33`, borderRadius: 4, padding: "1px 4px", flexShrink: 0, letterSpacing: "0.02em" }}>{p.ipl}</span>
                                          <span style={{ fontSize: "0.72rem", flex: 1, color: p.pts === 0 ? "var(--text-3)" : "var(--text)", fontWeight: p.pts !== 0 ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                                            {p.name}
                                          </span>
                                          {p.isCap && <span style={{ fontSize: "0.44rem", fontWeight: 900, color: "#d4a843", background: "rgba(212,168,67,0.18)", border: "1px solid rgba(212,168,67,0.4)", borderRadius: 3, padding: "0 3px", lineHeight: 1.4, flexShrink: 0 }}>C</span>}
                                          {p.isVC && <span style={{ fontSize: "0.44rem", fontWeight: 900, color: "#94a3b8", background: "rgba(148,163,184,0.12)", border: "1px solid rgba(148,163,184,0.3)", borderRadius: 3, padding: "0 3px", lineHeight: 1.4, flexShrink: 0 }}>VC</span>}
                                          {p.isCap && <span style={{ fontSize: "0.44rem", fontWeight: 700, color: "#d4a843", opacity: 0.8, flexShrink: 0 }}>2×</span>}
                                          {p.isVC && <span style={{ fontSize: "0.44rem", fontWeight: 700, color: "#94a3b8", opacity: 0.8, flexShrink: 0 }}>1.5×</span>}
                                          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.9rem", fontWeight: 700, minWidth: 28, textAlign: "right" as const, color: p.pts === 0 ? "var(--text-3)" : p.pts >= 60 ? "#d4a843" : p.pts >= 40 ? "#fb923c" : "#4ade80" }}>
                                            {p.pts === 0 ? "—" : "+" + p.pts}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                    </div>
                  );
                })()}
              </>
            );
          })()
        })()}
      </div>
    );
  };


  const renderFixtures = () => (
    <FixturesPage
      liveMatches={liveMatches}
      standings={standings}
      matchFilter={matchFilter}
      teamFilter={teamFilter}
      fixtureHomeAwayFilter={fixtureHomeAwayFilter}
      scorecards={scorecards}
      scorecardLoading={scorecardLoading}
      openScoreRows={openScoreRows}
      predictions={predictions}
      expandedPredMatchId={expandedPredMatchId}
      predFlash={predFlash}
      predSaveState={predSaveState}
      currentUser={currentUser}
      apiError={apiError}
      lastPredSaveRef={lastPredSaveRef}
      setMatchFilter={setMatchFilter}
      setTeamFilter={setTeamFilter}
      setFixtureHomeAwayFilter={setFixtureHomeAwayFilter}
      setOpenScoreRows={setOpenScoreRows}
      setExpandedPredMatchId={setExpandedPredMatchId}
      setPredictions={setPredictions}
      setPredSaveState={setPredSaveState}
      toggleTeamFilter={toggleTeamFilter}
      shareMatchCard={shareMatchCard}
      fetchScorecard={fetchScorecard}
      saveLocalPreds={saveLocalPreds}
    />
  );

  const renderWhatIf = () => (
    <WhatIfPage
      wiSection={wiSection}
      wiTeamId={wiTeamId}
      altCap={altCap}
      altVC={altVC}
      perMatchCaps={perMatchCaps}
      expandedWiMatch={expandedWiMatch}
      playerMatchPoints={playerMatchPoints}
      liveMatches={liveMatches}
      playerPoints={playerPoints}
      teamScores={teamScores}
      setWiSection={setWiSection}
      setWiTeamId={setWiTeamId}
      setAltCap={setAltCap}
      setAltVC={setAltVC}
      setPerMatchCaps={setPerMatchCaps}
      setExpandedWiMatch={setExpandedWiMatch}
    />
  );

  const renderStats = () => (
    <StatsPage
      statsCategory={statsCategory}
      statsFilter={statsFilter}
      statsExpanded={statsExpanded}
      fantasyPtsOpen={fantasyPtsOpen}
      predVisibleCount={predVisibleCount}
      predArchiveOpen={predArchiveOpen}
      iplStats={iplStats}
      statsLoading={statsLoading}
      liveMatches={liveMatches}
      predictions={predictions}
      playerPoints={playerPoints}
      setStatsCategory={setStatsCategory}
      setStatsFilter={setStatsFilter}
      setStatsExpanded={setStatsExpanded}
      setFantasyPtsOpen={setFantasyPtsOpen}
      setPredVisibleCount={setPredVisibleCount}
      setPredArchiveOpen={setPredArchiveOpen}
    />
  );


  const renderAdmin = () => (
    <AdminPage
      currentUser={currentUser!}
      abandonedMatchIds={abandonedMatchIds}
      liveMatches={liveMatches}
      playerPoints={playerPoints}
      processedMatches={processedMatches}
      playerMatchPoints={playerMatchPoints}
      pinEditTarget={pinEditTarget}
      pinStep={pinStep}
      pinConfirmVal={pinConfirmVal}
      pinConfirmError={pinConfirmError}
      pinEditVal={pinEditVal}
      setPinEditTarget={setPinEditTarget}
      setPinStep={setPinStep}
      setPinConfirmVal={setPinConfirmVal}
      setPinConfirmError={setPinConfirmError}
      setPinEditVal={setPinEditVal}
      handleConfirmOldPin={handleConfirmOldPin}
      handleSavePin={handleSavePin}
      resetPinEdit={resetPinEdit}
      dataSources={dataSources}
      pointsUpdating={pointsUpdating}
      pointsError={pointsError}
      pendingMatches={pendingMatches}
      nextAttempt={nextAttempt}
      pointsLastUpdated={pointsLastUpdated}
      pointsLoading={pointsLoading}
      adminBreakdownOpen={adminBreakdownOpen}
      setAdminBreakdownOpen={setAdminBreakdownOpen}
      expandedAdminPlayer={expandedAdminPlayer}
      setExpandedAdminPlayer={setExpandedAdminPlayer}
      liveLoading={liveLoading}
      supabaseSyncing={supabaseSyncing}
      s3Prefetching={s3Prefetching}
      statsRefreshing={statsRefreshing}
      supabaseSyncMsg={supabaseSyncMsg}
      s3PrefetchResult={s3PrefetchResult}
      lastUpdated={lastUpdated}
      setPlayerPoints={setPlayerPoints}
      setProcessedMatches={setProcessedMatches}
      fetchLive={fetchLive}
      fetchPoints={fetchPoints}
      syncSupabase={syncSupabase}
      prefetchS3Scorecards={prefetchS3Scorecards}
      refreshStatsCache={refreshStatsCache}
    />
  );

  // Swipe gesture handlers (attached to the app wrapper)
  const handleSwipeStart = (e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX;
    swipeStartY.current = e.touches[0].clientY;
    // Block tab-swipe if the touch started inside a no-swipe zone
    // (horizontally-scrollable inner containers)
    const target = e.target as HTMLElement;
    swipeBlocked.current = !!target.closest("[data-no-swipe]");
  };
  const handleSwipeEnd = (e: React.TouchEvent) => {
    if (swipeBlocked.current) { swipeBlocked.current = false; return; }
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    const dy = e.changedTouches[0].clientY - swipeStartY.current;
    // Must be a clearly horizontal swipe: min 70px horizontal, and horizontal
    // must be at least 3× the vertical movement (within ~18° of horizontal axis)
    if (Math.abs(dx) < 70) return;
    if (Math.abs(dy) > Math.abs(dx) * 0.3) return;
    const idx = SWIPEABLE_TABS.indexOf(tab);
    if (idx === -1) return;
    if (dx < 0 && idx < SWIPEABLE_TABS.length - 1) setTab(SWIPEABLE_TABS[idx + 1]);
    if (dx > 0 && idx > 0) setTab(SWIPEABLE_TABS[idx - 1]);
  };

  if (!currentUser) return <LoginScreen onValidate={handleValidate} />;

  return (
    <>
      {showToast && <div className="share-toast">✓ Copied to clipboard!</div>}
      {sparkTip && (
        <div className="spark-tip">
          {sparkTip.pts > 0 ? `+${sparkTip.pts}` : "0"} pts · {sparkTip.label}
        </div>
      )}
      {pullY > 0 && (
        <div className="ptr-indicator" style={{ opacity: Math.min(pullY / PULL_THRESHOLD, 1) }}>
          {pullY >= PULL_THRESHOLD - 5 ? "↑ Release to refresh" : "↓ Pull to refresh"}
        </div>
      )}
      <div className="app"
        onTouchStart={handleSwipeStart}
        onTouchEnd={handleSwipeEnd}
      >
        <div className="bg-field" />
        <div className="content">
          <div className="header">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: 8 }}>
              <div className="header-logo-ring">
                <div className="header-logo-inner">
                  <img
                    src={`${import.meta.env.BASE_URL}app-icon.png`}
                    alt="Logo"
                    className="header-logo"
                  />
                </div>
              </div>
              <div className="header-title-row">
                <span className="header-title">Indian Premier League</span>
                <span className="header-year">2026</span>
              </div>
            </div>
            <div className="header-right">
              {installPrompt && !appInstalled && (
                <button
                  className="btn-install"
                  onClick={async () => {
                    installPrompt.prompt();
                    const { outcome } = await installPrompt.userChoice;
                    if (outcome === "accepted") { setAppInstalled(true); setInstallPrompt(null); }
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Install
                </button>
              )}
              {/* Settings icon button */}
              {currentUser && (
                <button className="btn-icon" onClick={() => setSettingsOpen(p => !p)} aria-label="Settings">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                </button>
              )}
              <div className="settings-wrap" ref={settingsRef}>
                {settingsOpen && (() => {
                  const cu = FANTASY_TEAMS[currentUser!];
                  return (
                    <div className="settings-dropdown">
                      <div className="settings-profile" style={{ borderLeftColor: cu.color }}>
                        <div style={{ width: 38, height: 38, borderRadius: "50%", border: `2px solid ${cu.color}60`, overflow: "hidden", flexShrink: 0, boxShadow: `0 0 0 2px ${cu.color}20` }}>
                          <img src={`${import.meta.env.BASE_URL}avatars/${cu.avatar}`} alt={cu.owner} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                        <div>
                          <div className="settings-profile-name" style={{ color: cu.color }}>{cu.owner}</div>
                          <div className="settings-profile-team">{cu.name}</div>
                        </div>
                      </div>
                      <button className="settings-row" onClick={() => { setTab("admin"); setSettingsOpen(false); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3"/>
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                        League Control Centre
                        <svg className="settings-row-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                      <button className="settings-row settings-row-danger" onClick={() => { handleLogout(); setSettingsOpen(false); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                          <polyline points="16 17 21 12 16 7"/>
                          <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Log out
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          <div key={tab} className="tab-content">
            {tab === "home" && renderHome()}
            {tab === "teams" && renderTeams()}
            {tab === "fixtures" && renderFixtures()}
            {tab === "stats" && renderStats()}
            {tab === "history" && renderHistory()}
            {tab === "whatif" && renderWhatIf()}
            {tab === "admin" && renderAdmin()}
          </div>
        </div>

        <nav className="nav">
          <div className="nav-inner">
            {TABS.map(t => {
              const isActive = tab === t.id;
              return (
                <button key={t.id} className={`nav-btn ${isActive ? "active" : ""}`} onClick={() => setTab(t.id)}>
                  <span className="nav-icon">{NAV_ICON[t.id]}</span>
                  {t.label}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}
