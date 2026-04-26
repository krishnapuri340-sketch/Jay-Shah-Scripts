import React, { useState, useEffect, useRef } from "react";
import HistoryPage from "./pages/History";
import AdminPage from "./pages/Admin";
import StatsPage from "./pages/Stats";
import { FANTASY_TEAMS } from "./teams";
import { getTeamData } from "./utils";
import { IPL_COLORS, SWIPEABLE_TABS, TEAM_LOGO_CDN } from "./constants";

import FixturesPage from "./pages/Fixtures";
import TeamsPage from "./pages/Teams";
import HomePage from "./pages/Home";
import { useIplStats } from "./hooks/useIplStats";
import { useScorecard } from "./hooks/useScorecard";
import { useLiveMatches } from "./hooks/useLiveMatches";
import { authHeaders, fetchAuthed } from "./lib/auth";
import { useAuth } from "./context/AuthContext";
import { usePredictions } from "./context/PredictionsContext";
import { usePoints } from "./context/PointsContext";

// ─────────────────────────────────────────────────────────────────────────────

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

  const BASE = import.meta.env.BASE_URL;
  const cinematicBg: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 1000, overflow: "hidden",
  };
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
          <div style={{ position: "relative", marginBottom: 20 }}>
            <div style={{ position: "absolute", inset: -10, borderRadius: "50%", background: `radial-gradient(circle, ${ft.color}40 0%, transparent 70%)`, filter: "blur(14px)" }} />
            <div style={{ width: 90, height: 90, borderRadius: "50%", border: `2px solid rgba(255,255,255,0.22)`, overflow: "hidden", boxShadow: `0 0 0 5px rgba(255,255,255,0.06), 0 10px 40px rgba(0,0,0,0.5)`, position: "relative" as const, backdropFilter: "blur(4px)" }}>
              <img src={`${import.meta.env.BASE_URL}avatars/${ft.avatar}`} alt={ft.owner} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center center", display: "block" }} />
            </div>
          </div>

          <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: 4, textShadow: "0 2px 8px rgba(0,0,0,1), 0 4px 24px rgba(0,0,0,0.95)" }}>{ft.owner}</div>
          <div style={{ fontSize: "0.65rem", color: ft.color, letterSpacing: "0.08em", fontWeight: 700, marginBottom: 2, textShadow: "0 1px 6px rgba(0,0,0,0.95), 0 2px 12px rgba(0,0,0,0.8)" }}>{ft.name}</div>
          <div style={{ fontSize: "0.56rem", color: "rgba(255,255,255,0.8)", letterSpacing: "0.2em", marginBottom: 40, fontWeight: 700, textTransform: "uppercase" as const, textShadow: "0 1px 6px rgba(0,0,0,1)" }}>Enter your PIN</div>

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

      {(() => {
        const savedId = localStorage.getItem("ipl-current-user");
        const savedTeam = savedId ? FANTASY_TEAMS[savedId] : null;
        return (
          <div style={{ position: "relative", zIndex: 2, animation: "login-fade-up 0.35s ease-out", display: "flex", flexDirection: "column" as const, alignItems: "center", marginBottom: savedTeam ? 28 : 44 }}>
            <div style={{ position: "relative", width: 92, height: 92, marginBottom: 20 }}>
              <div style={{ position: "absolute", inset: -14, borderRadius: 40, background: "radial-gradient(circle, rgba(245,166,35,0.25) 0%, transparent 65%)", filter: "blur(10px)" }} />
              <div style={{ position: "absolute", inset: -2, borderRadius: 28, background: "rgba(245,166,35,0.38)", boxShadow: "0 0 0 1px rgba(245,166,35,0.5), 0 0 12px 3px rgba(245,166,35,0.35), 0 0 28px 6px rgba(245,166,35,0.18)" }} />
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

      <div style={{ position: "relative", zIndex: 2, fontSize: "0.56rem", letterSpacing: "0.2em", color: "#fff", textTransform: "uppercase" as const, marginBottom: 18, marginTop: -28, fontWeight: 800, animation: "login-fade-up 0.4s ease-out", textShadow: "0 1px 6px rgba(0,0,0,1), 0 2px 16px rgba(0,0,0,0.9)" }}>
        Select your team
      </div>

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
];

const NAV_ICON: Record<string, React.ReactElement> = {
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

};

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
  // ── Contexts ──────────────────────────────────────────────────────────────
  const { currentUser, handleLogout, handleValidate } = useAuth();
  const { fetchPredictions, bumpSseGen } = usePredictions();
  const {
    playerPoints,
    setPlayerPoints,
    playerMatchPoints,
    setPlayerMatchPoints,
    setIplIdToMatchNum,
    setPointsLastUpdated,
    setPointsUpdating,
    setPendingMatches,
    setProcessedMatches,
    setAbandonedMatchIds,
    fetchPoints,
    resetRetries: resetPointsRetries,
    standings,
    setStandings,
    fetchStandings,
    teamScores,
    pointsLastUpdated,
  } = usePoints();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [tab, setTab] = useState("home");
  const [selectedTeam, setSelectedTeam] = useState("rajveer");
  const [fixtureHomeAwayFilter, setFixtureHomeAwayFilter] = useState<"all" | "home" | "away">("all");
  const [chartHover, setChartHover] = useState<number | null>(null);
  const [selectedAwardIdx, setSelectedAwardIdx] = useState(0);
  const [awardXiFilter, setAwardXiFilter] = useState<"all" | "xi">("all");
  const [chartXiFilter, setChartXiFilter] = useState<"all" | "xi">("all");
  const [openScoreRows, setOpenScoreRows] = useState<Set<string>>(new Set());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [intelOpen, setIntelOpen] = useState(false);
  const [matchFilter, setMatchFilter] = useState<"upcoming" | "live" | "completed" | "all">("upcoming");
  const [teamFilter, setTeamFilter] = useState<Set<string>>(new Set());
  const toggleTeamFilter = (code: string) => setTeamFilter(prev => {
    const next = new Set(prev);
    if (next.has(code)) next.delete(code); else next.add(code);
    return next;
  });
  const [statsFilter, setStatsFilter] = useState<"all" | "fantasy" | "predictions">("all");
  const [statsCategory, setStatsCategory] = useState<"fantasyPts" | "orangeCap" | "purpleCap" | "sixesLeader" | "foursLeader" | "catchesLeader" | "srLeader" | "ecoLeader" | "dotsLeader">("fantasyPts");
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [fantasyPtsOpen, setFantasyPtsOpen] = useState(false);

  // ── Data hooks (non-context) ──────────────────────────────────────────────
  const { scorecards, setScorecards, scorecardLoading, fetchScorecard } = useScorecard();
  const { iplStats, setIplStats, statsLoading, fetchStats } = useIplStats();
  const {
    liveMatches,
    liveLoading,
    lastUpdated,
    apiError,
    dataSources,
    fetchLive,
  } = useLiveMatches((matches) => {
    const hasLive = matches.some((m: any) => m.matchStarted && !m.matchEnded);
    setMatchFilter(prev => (prev === "completed" || prev === "all") ? prev : (hasLive ? "live" : "upcoming"));
  });

  // ── Admin action state ────────────────────────────────────────────────────
  const [supabaseSyncing, setSupabaseSyncing] = useState(false);
  const [statsRefreshing, setStatsRefreshing] = useState(false);
  const [statsTabRefreshing, setStatsTabRefreshing] = useState(false);
  const [supabaseSyncMsg, setSupabaseSyncMsg] = useState<string | null>(null);
  const [s3Prefetching, setS3Prefetching] = useState(false);
  const [s3PrefetchResult, setS3PrefetchResult] = useState<{ found: number; missing: number; foundIds: string[]; missingIds: string[] } | null>(null);
  const [s3LiveSyncing, setS3LiveSyncing] = useState(false);
  const [s3LiveSyncMsg, setS3LiveSyncMsg] = useState<string | null>(null);

  // ── Push notifications ────────────────────────────────────────────────────
  const [pushSupported, setPushSupported] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [pushSubscriberCount, setPushSubscriberCount] = useState(0);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | null>(null);
  const [pushSubscribing, setPushSubscribing] = useState(false);
  const pushSubRef = useRef<PushSubscription | null>(null);

  function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    const buf = new ArrayBuffer(raw.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i);
    return view;
  }

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setPushSupported(supported);
    if (supported) setNotifPermission(Notification.permission);
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    fetch("/api/ipl/push/status").then(r => r.json()).then(d => {
      setPushEnabled(d.enabled ?? true);
      setPushSubscriberCount(d.subscriberCount ?? 0);
    }).catch(() => {});
  }, [currentUser]);

  useEffect(() => {
    if (!pushSupported || !currentUser) return;
    navigator.serviceWorker.ready.then(reg => {
      reg.pushManager.getSubscription().then(sub => {
        pushSubRef.current = sub;
        setPushSubscribed(!!sub);
      });
    }).catch(() => {});
  }, [pushSupported, currentUser]);

  const subscribePush = async () => {
    if (!pushSupported || pushSubscribing) return;
    setPushSubscribing(true);
    try {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm !== "granted") { setPushSubscribing(false); return; }
      const vapidRes = await fetch("/api/ipl/push/vapid-public");
      const { publicKey } = await vapidRes.json();
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      pushSubRef.current = sub;
      const saveRes = await fetch("/api/ipl/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(sub.toJSON()),
      });
      const data = await saveRes.json();
      setPushSubscribed(true);
      setPushSubscriberCount(data.count ?? 0);
    } catch (e) {
      console.warn("[push] Subscribe failed:", e);
    }
    setPushSubscribing(false);
  };

  const unsubscribePush = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await fetch("/api/ipl/push/unsubscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json", ...authHeaders() },
          body: JSON.stringify({ endpoint }),
        });
      }
      pushSubRef.current = null;
      setPushSubscribed(false);
      setPushSubscriberCount(c => Math.max(0, c - 1));
    } catch (e) { console.warn("[push] Unsubscribe failed:", e); }
  };

  const togglePushEnabled = async (enabled: boolean) => {
    try {
      const res = await fetch("/api/ipl/push/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ enabled }),
      });
      const data = await res.json();
      setPushEnabled(data.enabled);
    } catch (_) {}
  };

  const testPush = async () => {
    try {
      await fetch("/api/ipl/push/test", {
        method: "POST",
        headers: { ...authHeaders() },
      });
    } catch (_) {}
  };

  // ── Admin action handlers ─────────────────────────────────────────────────
  const syncSupabase = async () => {
    if (supabaseSyncing) return;
    setSupabaseSyncing(true);
    setSupabaseSyncMsg(null);
    try {
      const res = await fetch("/api/ipl/points/sync-supabase", {
        method: "POST",
        headers: { ...authHeaders() },
      });
      const data = await res.json();
      if (res.status === 429) {
        setSupabaseSyncMsg("Rate limited — too many syncs this hour");
        return;
      }
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
      const msg = data.skipped
        ? `Rate limited — next sync available soon`
        : data.changed
          ? `Synced ✓ — ${data.fixturesAfter} fixtures loaded`
          : "Already up to date";
      setSupabaseSyncMsg(msg);
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
        headers: { ...authHeaders() },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
      setS3PrefetchResult(data);
    } catch (e: any) {
      setS3PrefetchResult({ found: 0, missing: 0, foundIds: [], missingIds: ["Error: " + (e.message || "unknown")] });
    }
    setS3Prefetching(false);
  };

  const refreshS3Live = async () => {
    if (s3LiveSyncing) return;
    setS3LiveSyncing(true);
    setS3LiveSyncMsg(null);
    try {
      const res = await fetch("/api/ipl/points/refresh-s3-live", {
        method: "POST",
        headers: { ...authHeaders() },
      });
      const data = await res.json();
      if (res.status === 429) {
        setS3LiveSyncMsg("Rate limited — too many S3 refreshes this hour");
        return;
      }
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
      const parts: string[] = [];
      if (data.liveRefreshed > 0) parts.push(`${data.liveRefreshed} live`);
      if (data.completedRefreshed > 0) parts.push(`${data.completedRefreshed} completed`);
      setS3LiveSyncMsg(parts.length > 0 ? `Updated ${parts.join(", ")}` : "No live matches");
      setTimeout(fetchPoints, 500);
    } catch (e: any) {
      setS3LiveSyncMsg("Failed: " + (e.message || "unknown error"));
    }
    setS3LiveSyncing(false);
  };

  const refreshStatsCache = async () => {
    if (statsRefreshing) return;
    setStatsRefreshing(true);
    try {
      await fetch("/api/ipl/stats/refresh", { method: "POST", headers: { ...authHeaders() } });
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

  // ── PTR / swipe refs ──────────────────────────────────────────────────────
  const [sparkTip, setSparkTip] = useState<{ label: string; pts: number } | null>(null);
  const [pullY, setPullY] = useState(0);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [appInstalled, setAppInstalled] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const swipeStartX = useRef(0);
  const swipeStartY = useRef(0);
  const swipeBlocked = useRef(false);
  const pullState = useRef({ active: false, startY: 0, startX: 0 });
  const pullYRef = useRef(0);
  const sparkTipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshFnRef = useRef(() => {});
  const [countdown, setCountdown] = useState<{ text: string; matchName: string; venue?: string; homeTeam?: string; awayTeam?: string } | null>(null);

  // ── Click-outside to close settings ──────────────────────────────────────
  useEffect(() => {
    if (!settingsOpen) return;
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [settingsOpen]);

  // ── Initial fetch on login ────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    fetchLive();
    fetchPoints();
    fetchStandings();
    fetchStats();
    fetchPredictions();
  }, [currentUser]);

  // ── Service worker (PWA offline + auto-reload on update) ─────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
    const onMsg = (e: MessageEvent) => { if (e.data?.type === "SW_UPDATED") window.location.reload(); };
    navigator.serviceWorker.addEventListener("message", onMsg);
    return () => navigator.serviceWorker.removeEventListener("message", onMsg);
  }, []);

  // Reset home/away sub-filter whenever the team filter changes
  useEffect(() => { setFixtureHomeAwayFilter("all"); }, [teamFilter]);

  // ── Adaptive polling ──────────────────────────────────────────────────────
  const isAnyMatchLive = liveMatches.some((m: any) => m.matchStarted && !m.matchEnded);

  useEffect(() => {
    if (!currentUser) return;
    const idleDelay  = 5 * 60_000;
    const liveStatus = 5_000;
    const livePoints = 30_000;
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
    const ids = [
      setInterval(fetchLive,        liveStatus),
      setInterval(fetchStandings,   liveStatus),
      setInterval(fetchPoints,      livePoints),
      setInterval(fetchStats,       livePoints),
      setInterval(fetchPredictions, livePoints),
    ];
    return () => ids.forEach(clearInterval);
  }, [isAnyMatchLive, currentUser]);

  // Fast-poll predictions when the Predictions view is open
  useEffect(() => {
    if (!currentUser || !(tab === "stats" && statsFilter === "predictions")) return;
    const id = setInterval(fetchPredictions, 15_000);
    return () => clearInterval(id);
  }, [tab, statsFilter, currentUser]);

  // Refetch stats every time the user opens the stats tab
  useEffect(() => {
    if (!currentUser || tab !== "stats") return;
    fetchStats();
  }, [tab, currentUser]);

  // Refresh all data + reconnect SSE when the user returns to the tab
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && currentUser) {
        resetPointsRetries();
        fetchLive();
        fetchPoints();
        fetchPredictions();
        fetchStandings();
        bumpSseGen();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [currentUser]);

  // Keep refreshFnRef up-to-date every render so PTR always calls the latest version
  useEffect(() => { refreshFnRef.current = () => { fetchLive(); fetchPoints(); }; });

  // ── PWA install prompt ────────────────────────────────────────────────────
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

  // ── Pull-to-refresh ───────────────────────────────────────────────────────
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

  // ── Countdown to next match ───────────────────────────────────────────────
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

  // ── Auto-prefetch live scorecards ─────────────────────────────────────────
  const liveIdsRef = useRef<string[]>([]);
  liveIdsRef.current = liveMatches
    .filter((m: any) => m.matchStarted && !m.matchEnded)
    .map((m: any) => String(m.id));
  const hasLiveMatch = liveIdsRef.current.length > 0;
  useEffect(() => {
    if (!hasLiveMatch) return;
    const refresh = () => { liveIdsRef.current.forEach(id => fetchScorecard(id, true)); };
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, [hasLiveMatch, fetchScorecard]);

  // ── Leaderboard refresh (manual, from home page) ──────────────────────────
  const [lbRefreshing, setLbRefreshing] = React.useState(false);
  const handleLbRefresh = async () => {
    if (lbRefreshing) return;
    setLbRefreshing(true);
    try {
      await fetch("/api/ipl/points/sync-supabase", {
        method: "POST",
        headers: { ...authHeaders() },
      });
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
        fetch("/api/ipl/stats").then(r => r.ok ? r.json() : null).then(data => {
          if (data) setIplStats(data);
        }),
      ]);
      fetchPredictions();
    } catch (_) {}
    setLbRefreshing(false);
  };

  // ── Share — Leaderboard image ─────────────────────────────────────────────
  const shareLeaderboard = async () => {
    const W = 1080, H = 1000, PAD = 64;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    const logoImg = new Image();
    logoImg.crossOrigin = "anonymous";
    logoImg.src = `${import.meta.env.BASE_URL}app-icon.png`;
    await new Promise(res => { logoImg.onload = res; logoImg.onerror = res; });

    ctx.fillStyle = "#080c14";
    ctx.fillRect(0, 0, W, H);

    const goldGrad = ctx.createLinearGradient(0, 0, W, 0);
    goldGrad.addColorStop(0, "#a07832"); goldGrad.addColorStop(0.5, "#d4a843"); goldGrad.addColorStop(1, "#a07832");
    ctx.fillStyle = goldGrad; ctx.fillRect(0, 0, W, 3);

    const logoR = 26, logoX = PAD + logoR, logoY = 68;
    ctx.save();
    ctx.beginPath(); ctx.arc(logoX, logoY, logoR, 0, Math.PI * 2); ctx.clip();
    if (logoImg.naturalWidth > 0) ctx.drawImage(logoImg, logoX - logoR, logoY - logoR, logoR * 2, logoR * 2);
    ctx.restore();

    ctx.textAlign = "left";
    ctx.font = "700 36px -apple-system, Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Indian Premier League 2026", PAD + logoR * 2 + 18, 59);
    ctx.font = "400 23px -apple-system, Arial, sans-serif";
    ctx.fillStyle = "#52525b";
    ctx.fillText("Leaderboard", PAD + logoR * 2 + 18, 88);

    ctx.textAlign = "right";
    ctx.font = "400 21px -apple-system, Arial, sans-serif";
    ctx.fillStyle = "#3f3f46";
    ctx.fillText(lastUpdated?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) ?? "just now", W - PAD, 88);

    ctx.strokeStyle = "#1c1c20"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, 116); ctx.lineTo(W - PAD, 116); ctx.stroke();

    const rowH = 200, startY = 132;
    teamScores.forEach((s, i) => {
      const ry = startY + i * rowH;
      const isFirst = i === 0;
      ctx.textAlign = "left";
      ctx.font = `100 108px -apple-system, Arial, sans-serif`;
      ctx.fillStyle = "#18181b";
      ctx.fillText(String(i + 1), PAD, ry + 130);
      ctx.beginPath();
      ctx.arc(PAD + 110, ry + 62, 8, 0, Math.PI * 2);
      ctx.fillStyle = s.team.color;
      ctx.fill();
      ctx.textAlign = "left";
      ctx.font = `600 52px -apple-system, Arial, sans-serif`;
      ctx.fillStyle = isFirst ? "#ffffff" : "#e4e4e7";
      ctx.fillText(s.team.owner, PAD + 130, ry + 78);
      ctx.font = `400 25px -apple-system, Arial, sans-serif`;
      ctx.fillStyle = "#52525b";
      ctx.fillText(s.team.name, PAD + 130, ry + 116);
      ctx.textAlign = "right";
      ctx.font = `700 58px -apple-system, Arial, sans-serif`;
      ctx.fillStyle = isFirst ? "#d4a843" : "#e4e4e7";
      ctx.fillText(String(s.total), W - PAD, ry + 84);
      ctx.font = `400 21px -apple-system, Arial, sans-serif`;
      ctx.fillStyle = "#3f3f46";
      ctx.fillText("pts", W - PAD, ry + 118);
      if (i < teamScores.length - 1) {
        ctx.strokeStyle = "#111114"; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PAD + 110, ry + rowH - 4);
        ctx.lineTo(W - PAD, ry + rowH - 4);
        ctx.stroke();
      }
    });

    ctx.fillStyle = goldGrad; ctx.fillRect(0, H - 3, W, 3);

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

  // ── Share — All Teams image ───────────────────────────────────────────────
  const shareTeams = async () => {
    const W = 1080;
    const CELL_W = W / 2;
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

    ctx.fillStyle = "#0c0c0e";
    ctx.fillRect(0, 0, W, H);

    const goldGrad = ctx.createLinearGradient(0, 0, W, 0);
    goldGrad.addColorStop(0, "#a07832"); goldGrad.addColorStop(0.5, "#d4a843"); goldGrad.addColorStop(1, "#a07832");
    ctx.fillStyle = goldGrad; ctx.fillRect(0, 0, W, 3);

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

    ctx.strokeStyle = "#18181b"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, HEADER_H); ctx.lineTo(W, HEADER_H); ctx.stroke();

    ctx.strokeStyle = "#18181b"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W / 2, HEADER_H); ctx.lineTo(W / 2, H - 34); ctx.stroke();
    const midY = HEADER_H + CELL_H + SEP / 2;
    ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(W, midY); ctx.stroke();

    for (let ti = 0; ti < teamScores.length; ti++) {
      const s = teamScores[ti];
      const t = s.team;
      const td = getTeamData(s.id, playerPoints);
      const top11 = td.players.slice(0, N_PLAYERS);

      const col = ti % 2;
      const gridRow = Math.floor(ti / 2);
      const xS = col * CELL_W;
      const xE = xS + CELL_W;
      const xL = xS + CELL_PAD;
      const xR = xE - CELL_PAD;
      const yS = HEADER_H + gridRow * (CELL_H + SEP);

      ctx.fillStyle = t.color;
      ctx.fillRect(xS, yS, CELL_W, COLOR_BAR);

      const thY = yS + COLOR_BAR;
      ctx.textAlign = "left";
      ctx.font = "100 44px -apple-system, Arial, sans-serif";
      ctx.fillStyle = "#1e1e22";
      ctx.fillText(String(ti + 1), xL, thY + 50);

      ctx.font = "600 20px -apple-system, Arial, sans-serif";
      ctx.fillStyle = "#e4e4e7";
      ctx.fillText(t.name, xL + 38, thY + 22);
      ctx.font = "300 12px -apple-system, Arial, sans-serif";
      ctx.fillStyle = "#3f3f46";
      ctx.fillText(t.owner, xL + 38, thY + 40);
      ctx.font = "300 11px -apple-system, Arial, sans-serif";
      ctx.fillStyle = "#27272a";
      ctx.fillText(`C: ${t.captain}`, xL + 38, thY + 56);

      ctx.textAlign = "right";
      ctx.font = "700 40px -apple-system, Arial, sans-serif";
      ctx.fillStyle = t.color;
      ctx.fillText(String(td.total), xR, thY + 40);
      ctx.font = "300 11px -apple-system, Arial, sans-serif";
      ctx.fillStyle = t.color + "66";
      ctx.fillText("PTS", xR, thY + 56);

      const sepY = thY + TEAM_HDR_H;
      ctx.strokeStyle = "#18181b"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(xS, sepY); ctx.lineTo(xE, sepY); ctx.stroke();

      const playersY = sepY + SEP;
      for (let pi = 0; pi < top11.length; pi++) {
        const p = top11[pi];
        const isC = p.name === t.captain;
        const isVC = p.name === t.vc;
        const py = playersY + pi * PLAYER_ROW_H;
        const midRow = py + PLAYER_ROW_H * 0.62;

        const nameWeight = isC ? "500" : "400";
        const nameColor = isC ? "#e4e4e7" : isVC ? "#a1a1aa" : pi < 6 ? "#71717a" : "#3f3f46";
        ctx.font = `${nameWeight} 15px -apple-system, Arial, sans-serif`;
        ctx.fillStyle = nameColor;
        ctx.textAlign = "left";

        let dName = p.name;
        while (ctx.measureText(dName).width > 330 && dName.length > 5) {
          dName = dName.slice(0, -2) + "…";
        }
        ctx.fillText(dName, xL, midRow);

        if (isC || isVC) {
          const nameW = ctx.measureText(dName).width;
          ctx.font = "700 10px -apple-system, Arial, sans-serif";
          ctx.fillStyle = t.color + "cc";
          ctx.fillText(isC ? " C" : " VC", xL + nameW, midRow);
        }

        ctx.textAlign = "right";
        ctx.font = `${isC || isVC ? "600" : "400"} 15px -apple-system, Arial, sans-serif`;
        ctx.fillStyle = isC ? "#e4e4e7" : isVC ? "#a1a1aa" : "#3f3f46";
        ctx.fillText(String(p.adj), xR, midRow);

        if (pi < top11.length - 1) {
          ctx.strokeStyle = "#18181b"; ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(xL, py + PLAYER_ROW_H);
          ctx.lineTo(xR, py + PLAYER_ROW_H);
          ctx.stroke();
        }
      }
    }

    ctx.fillStyle = goldGrad;
    ctx.fillRect(0, H - 3, W, 3);

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

  // ── Share — Match scorecard image ─────────────────────────────────────────
  const shareMatchCard = async (m: any) => {
    const W = 1080, PAD = 56;
    const isLive = m.matchStarted && !m.matchEnded;
    const isDone = m.matchEnded;
    const matchTeams = (m.teamInfo || []) as Array<{ shortname: string; img: string }>;
    const scores = (m.score || []) as any[];

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

    const mNumMatch = (m.name || "").match(/(\d+)(?:st|nd|rd|th) Match/i);
    const matchNum = mNumMatch ? parseInt(mNumMatch[1]) : null;

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

    const ROW_BAT = 46;
    const ROW_BOWL = 34;
    const COL_HDR = 30;
    const INN_HDR = 48;
    const INN_GAP = 28;

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

    const logoImg = new Image(); logoImg.crossOrigin = "anonymous";
    logoImg.src = `${import.meta.env.BASE_URL}app-icon.png`;
    await new Promise(r => { logoImg.onload = r; logoImg.onerror = r; });

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

    ctx.fillStyle = "#080c14"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = goldGrad; ctx.fillRect(0, 0, W, 3);

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

    if (isDone && m.status) {
      hr(y); y += 14;
      ctx.textAlign = "center"; ctx.font = "600 25px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#60a5fa";
      ctx.fillText(m.status, cx, y + 28);
      y += RESULT_H;
    }

    if (innings.length > 0) {
      hr(y); y += 18;

      const B_SR  = W - PAD;
      const B_4S  = B_SR  - 62;
      const B_6S  = B_4S  - 52;
      const B_R   = B_6S  - 56;

      for (const inn of innings) {
        const batters = (inn.batting || []).filter((b: any) => !b.dnb);
        const bowlers = inn.bowling || [];
        const innTeam = (inn.inning || "").replace(/ Innings?$/i, "");

        ctx.fillStyle = "#0e1420";
        ctx.fillRect(PAD - 16, y, W - PAD * 2 + 32, INN_HDR);
        ctx.textAlign = "left";
        ctx.font = "600 22px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#e4e4e7";
        ctx.fillText(innTeam, PAD, y + 28);
        if (inn.runs != null) {
          ctx.textAlign = "right"; ctx.font = "700 22px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#e4e4e7";
          ctx.fillText(`${inn.runs}${inn.wickets != null ? "/" + inn.wickets : ""}`, W - PAD, y + 28);
          if (inn.overs) {
            ctx.font = "400 16px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#52525b";
            ctx.fillText(`(${inn.overs} ov)`, W - PAD, y + 46);
          }
        }
        y += INN_HDR;

        if (batters.length) {
          ctx.textAlign = "left"; ctx.font = "500 14px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#3f3f46";
          ctx.fillText("BATTER", PAD, y + 20);
          ctx.textAlign = "right";
          ["SR","4s","6s","R"].forEach((lbl, i) => {
            const xs = [B_SR, B_4S, B_6S, B_R][i];
            ctx.fillText(lbl, xs, y + 20);
          });
          y += COL_HDR;

          for (const b of batters) {
            const notOut = !b.dismissal || b.dismissal === "not out" || b.dismissal === "batting";
            ctx.textAlign = "left";
            ctx.font = `${notOut ? "600" : "400"} 18px -apple-system, Arial, sans-serif`;
            ctx.fillStyle = notOut ? "#e4e4e7" : "#71717a";
            let dName = b.name || "";
            while (ctx.measureText(dName).width > 420 && dName.length > 5) dName = dName.slice(0, -2) + "…";
            ctx.fillText(dName, PAD, y + 28);
            if (b.dismissal && b.dismissal !== "not out" && b.dismissal !== "batting") {
              ctx.font = "300 12px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#3f3f46";
              let dis = b.dismissal;
              while (ctx.measureText(dis).width > 440 && dis.length > 5) dis = dis.slice(0, -2) + "…";
              ctx.fillText(dis, PAD, y + 42);
            }
            ctx.textAlign = "right";
            ctx.font = `${notOut ? "700" : "400"} 20px -apple-system, Arial, sans-serif`;
            ctx.fillStyle = notOut ? "#ffffff" : "#a1a1aa";
            ctx.fillText(b.r != null ? String(b.r) : "—", B_R, y + 32);
            ctx.font = "400 15px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#52525b";
            if (b["6s"] != null) ctx.fillText(String(b["6s"]), B_6S, y + 32);
            if (b["4s"] != null) ctx.fillText(String(b["4s"]), B_4S, y + 32);
            const sr = b.b > 0 ? ((b.r / b.b) * 100).toFixed(1) : "–";
            ctx.fillText(sr, B_SR, y + 32);
            y += ROW_BAT;
          }
        }

        if (bowlers.length) {
          y += 16;
          const BW_ECO = W - PAD;
          const BW_W   = BW_ECO - 64;
          const BW_R   = BW_W   - 52;
          const BW_O   = BW_R   - 52;

          ctx.textAlign = "left"; ctx.font = "500 14px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#3f3f46";
          ctx.fillText("BOWLER", PAD, y + 20);
          ctx.textAlign = "right";
          ["ECO","W","R","O"].forEach((lbl, i) => {
            const xs = [BW_ECO, BW_W, BW_R, BW_O][i];
            ctx.fillText(lbl, xs, y + 20);
          });
          y += COL_HDR;

          for (const bw of bowlers) {
            ctx.textAlign = "left"; ctx.font = "400 17px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#a1a1aa";
            let dName = bw.name || "";
            while (ctx.measureText(dName).width > 440 && dName.length > 5) dName = dName.slice(0, -2) + "…";
            ctx.fillText(dName, PAD, y + 22);
            ctx.textAlign = "right"; ctx.font = "400 15px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#52525b";
            if (bw.o != null) ctx.fillText(String(bw.o), BW_O, y + 22);
            if (bw.r != null) ctx.fillText(String(bw.r), BW_R, y + 22);
            ctx.font = `${(bw.w || 0) >= 3 ? "700" : "400"} 15px -apple-system, Arial, sans-serif`;
            ctx.fillStyle = (bw.w || 0) >= 3 ? "#22c55e" : "#52525b";
            if (bw.w != null) ctx.fillText(String(bw.w), BW_W, y + 22);
            const eco = bw.o && parseFloat(bw.o) > 0 ? (bw.r / parseFloat(bw.o)).toFixed(2) : "–";
            ctx.font = "400 15px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#52525b";
            ctx.fillText(eco, BW_ECO, y + 22);
            y += ROW_BOWL;
          }
        }

        y += INN_GAP;
      }
    }

    if (hasFantasy) {
      hr(y); y += 14;
      ctx.textAlign = "left"; ctx.font = "500 18px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#3f3f46";
      ctx.fillText("FANTASY POINTS", PAD, y + 20);
      y += 30;
      for (const row of fantasyRows) {
        ctx.beginPath(); ctx.arc(PAD + 8, y + 26, 6, 0, Math.PI * 2);
        ctx.fillStyle = row.ft.color; ctx.fill();
        ctx.textAlign = "left"; ctx.font = "600 20px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#e4e4e7";
        ctx.fillText(row.ft.owner, PAD + 22, y + 30);
        ctx.font = "400 14px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#52525b";
        const scorersText = row.scorers.slice(0, 5).join("  ·  ");
        ctx.fillText(scorersText, PAD + 22, y + 46);
        ctx.textAlign = "right"; ctx.font = `700 24px -apple-system, Arial, sans-serif`;
        ctx.fillStyle = row.total > 0 ? "#22c55e" : "#ef4444";
        ctx.fillText(`${row.total > 0 ? "+" : ""}${row.total}`, W - PAD, y + 34);
        y += 52;
      }
    }

    ctx.fillStyle = goldGrad;
    ctx.fillRect(0, H - 3, W, 3);

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

  // ── Match preview lists ───────────────────────────────────────────────────
  const liveMatchPreviews = buildMatchPreviews(
    liveMatches.filter((m: any) => m.matchStarted && !m.matchEnded)
  );
  const upcomingLineupPreviews = buildMatchPreviews(
    liveMatches
      .filter((m: any) => !m.matchStarted && m.dateTimeGMT)
      .map((m: any) => ({ m, diff: new Date(m.dateTimeGMT).getTime() - Date.now() }))
      .filter(({ diff }) => diff > 0 && diff <= 24 * 60 * 60 * 1000)
      .sort((a, b) => a.diff - b.diff)
      .map(({ m }) => m)
  );

  // ── Render helpers ────────────────────────────────────────────────────────
  const renderHome = () => (
    <HomePage
      countdown={countdown}
      liveMatches={liveMatches}
      intelOpen={intelOpen}
      setIntelOpen={setIntelOpen}
      scorecards={scorecards}
      setTab={setTab}
      setMatchFilter={setMatchFilter}
      handleLbRefresh={handleLbRefresh}
      lbRefreshing={lbRefreshing}
      shareLeaderboard={shareLeaderboard}
      setSelectedTeam={setSelectedTeam}
      chartXiFilter={chartXiFilter}
      setChartXiFilter={setChartXiFilter}
      chartHover={chartHover}
      setChartHover={setChartHover}
      selectedAwardIdx={selectedAwardIdx}
      setSelectedAwardIdx={setSelectedAwardIdx}
      awardXiFilter={awardXiFilter}
      setAwardXiFilter={setAwardXiFilter}
    />
  );

  const renderHistory = () => <HistoryPage />;

  const renderTeams = () => (
    <TeamsPage
      selectedTeam={selectedTeam}
      setSelectedTeam={setSelectedTeam}
      upcomingLineupPreviews={upcomingLineupPreviews}
      liveMatchPreviews={liveMatchPreviews}
      shareTeams={shareTeams}
      sparkTip={sparkTip}
      setSparkTip={setSparkTip}
      sparkTipTimer={sparkTipTimer}
    />
  );

  const renderFixtures = () => (
    <FixturesPage
      liveMatches={liveMatches}
      liveLoading={liveLoading}
      standings={standings}
      matchFilter={matchFilter}
      teamFilter={teamFilter}
      fixtureHomeAwayFilter={fixtureHomeAwayFilter}
      scorecards={scorecards}
      scorecardLoading={scorecardLoading}
      openScoreRows={openScoreRows}
      apiError={apiError}
      setMatchFilter={setMatchFilter}
      setTeamFilter={setTeamFilter}
      setFixtureHomeAwayFilter={setFixtureHomeAwayFilter}
      setOpenScoreRows={setOpenScoreRows}
      toggleTeamFilter={toggleTeamFilter}
      shareMatchCard={shareMatchCard}
      fetchScorecard={fetchScorecard}
    />
  );


  const renderStats = () => (
    <StatsPage
      statsCategory={statsCategory}
      statsFilter={statsFilter}
      statsExpanded={statsExpanded}
      fantasyPtsOpen={fantasyPtsOpen}
      iplStats={iplStats}
      statsLoading={statsLoading}
      liveMatches={liveMatches}
      setStatsCategory={setStatsCategory}
      setStatsFilter={setStatsFilter}
      setStatsExpanded={setStatsExpanded}
      setFantasyPtsOpen={setFantasyPtsOpen}
    />
  );

  const renderAdmin = () => (
    <AdminPage
      dataSources={dataSources}
      liveMatches={liveMatches}
      liveLoading={liveLoading}
      supabaseSyncing={supabaseSyncing}
      s3Prefetching={s3Prefetching}
      statsRefreshing={statsRefreshing}
      s3LiveSyncing={s3LiveSyncing}
      s3LiveSyncMsg={s3LiveSyncMsg}
      supabaseSyncMsg={supabaseSyncMsg}
      s3PrefetchResult={s3PrefetchResult}
      lastUpdated={lastUpdated}
      fetchLive={fetchLive}
      fetchPoints={fetchPoints}
      syncSupabase={syncSupabase}
      prefetchS3Scorecards={prefetchS3Scorecards}
      refreshStatsCache={refreshStatsCache}
      refreshS3Live={refreshS3Live}
      pushSupported={pushSupported}
      pushSubscribed={pushSubscribed}
      pushEnabled={pushEnabled}
      pushSubscriberCount={pushSubscriberCount}
      notifPermission={notifPermission}
      pushSubscribing={pushSubscribing}
      onSubscribePush={subscribePush}
      onUnsubscribePush={unsubscribePush}
      onTogglePushEnabled={togglePushEnabled}
      onTestPush={testPush}
    />
  );

  // ── Swipe gesture handlers ────────────────────────────────────────────────
  const handleSwipeStart = (e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX;
    swipeStartY.current = e.touches[0].clientY;
    const target = e.target as HTMLElement;
    swipeBlocked.current = !!target.closest("[data-no-swipe]");
  };
  const handleSwipeEnd = (e: React.TouchEvent) => {
    if (swipeBlocked.current) { swipeBlocked.current = false; return; }
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    const dy = e.changedTouches[0].clientY - swipeStartY.current;
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
              <button className="btn-icon" onClick={handleLbRefresh} disabled={lbRefreshing} aria-label="Refresh" title="Refresh scores"
                style={{ opacity: lbRefreshing ? 0.5 : 1, cursor: lbRefreshing ? "default" : "pointer" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"
                  style={{ animation: lbRefreshing ? "spin 0.9s linear infinite" : "none" }}>
                  <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
              </button>
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
            {tab === "home"     && renderHome()}
            {tab === "teams"    && renderTeams()}
            {tab === "fixtures" && renderFixtures()}
            {tab === "stats"    && renderStats()}
            {tab === "history"  && renderHistory()}

            {tab === "admin"    && renderAdmin()}
          </div>
        </div>

        <nav className="nav">
          <div className="nav-inner" style={{ "--nav-idx": Math.max(0, TABS.findIndex(t => t.id === tab)) } as React.CSSProperties}>
            <div className="nav-indicator" />
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
