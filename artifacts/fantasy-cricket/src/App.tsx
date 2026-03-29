import React, { useState, useEffect } from "react";

const FANTASY_TEAMS: Record<string, {
  id: string; name: string; owner: string; emoji: string; color: string;
  captain: string; vc: string;
  players: { name: string; role: string; ipl: string }[];
}> = {
  rajveer: {
    id: "rajveer", name: "Jay Shah Supremacy", owner: "Raj", emoji: "🏏", color: "#f97316",
    captain: "Rajat Patidar", vc: "Axar Patel",
    players: [
      { name: "Rajat Patidar", role: "BAT", ipl: "RCB" },
      { name: "Axar Patel", role: "AR", ipl: "DC" },
      { name: "Shubman Gill", role: "BAT", ipl: "GT" },
      { name: "Jos Buttler", role: "WK", ipl: "GT" },
      { name: "Yuzvendra Chahal", role: "BWL", ipl: "PBKS" },
      { name: "Jacob Bethell", role: "AR", ipl: "RCB" },
      { name: "Bhuvneshwar Kumar", role: "BWL", ipl: "RCB" },
      { name: "Shreyas Iyer", role: "BAT", ipl: "PBKS" },
      { name: "Cameron Green", role: "AR", ipl: "KKR" },
      { name: "Nicholas Pooran", role: "WK", ipl: "LSG" },
      { name: "Phil Salt", role: "WK", ipl: "RCB" },
      { name: "Krunal Pandya", role: "AR", ipl: "RCB" },
      { name: "Priyansh Arya", role: "BAT", ipl: "PBKS" },
      { name: "Vaibhav Suryavanshi", role: "BAT", ipl: "RR" },
      { name: "Dhruv Jurel", role: "WK", ipl: "RR" },
      { name: "Mohammed Shami", role: "BWL", ipl: "LSG" },
      { name: "Tim David", role: "BAT", ipl: "RCB" },
      { name: "Deepak Chahar", role: "BWL", ipl: "MI" }
    ]
  },
  mombasa: {
    id: "mombasa", name: "Mombasa Kenyans", owner: "Rahul", emoji: "⚡", color: "#eab308",
    captain: "Abhishek Sharma", vc: "Sai Sudharsan",
    players: [
      { name: "Jitesh Sharma", role: "WK", ipl: "RCB" },
      { name: "Varun Chakravarthy", role: "BWL", ipl: "KKR" },
      { name: "Marco Jansen", role: "AR", ipl: "PBKS" },
      { name: "Arshdeep Singh", role: "BWL", ipl: "PBKS" },
      { name: "Shivam Dube", role: "AR", ipl: "CSK" },
      { name: "Riyan Parag", role: "BAT", ipl: "RR" },
      { name: "Abhishek Sharma", role: "AR", ipl: "SRH" },
      { name: "Prabhsimran Singh", role: "WK", ipl: "PBKS" },
      { name: "Nehal Wadhera", role: "BAT", ipl: "PBKS" },
      { name: "Shimron Hetmyer", role: "BAT", ipl: "RR" },
      { name: "Sai Sudharsan", role: "BAT", ipl: "GT" },
      { name: "Will Jacks", role: "AR", ipl: "MI" },
      { name: "Prasidh Krishna", role: "BWL", ipl: "GT" },
      { name: "Aiden Markram", role: "AR", ipl: "LSG" },
      { name: "Rashid Khan", role: "AR", ipl: "GT" },
      { name: "Ajinkya Rahane", role: "BAT", ipl: "KKR" },
      { name: "Trent Boult", role: "BWL", ipl: "MI" },
      { name: "Tilak Varma", role: "AR", ipl: "MI" }
    ]
  },
  mumbai: {
    id: "mumbai", name: "Mumbai Mavericks", owner: "Smeet", emoji: "🌊", color: "#3b82f6",
    captain: "Hardik Pandya", vc: "Sanju Samson",
    players: [
      { name: "Rishabh Pant", role: "WK", ipl: "LSG" },
      { name: "Dewald Brevis", role: "BAT", ipl: "CSK" },
      { name: "Rohit Sharma", role: "BAT", ipl: "MI" },
      { name: "Sherfane Rutherford", role: "BAT", ipl: "MI" },
      { name: "Rinku Singh", role: "BAT", ipl: "KKR" },
      { name: "Heinrich Klaasen", role: "WK", ipl: "SRH" },
      { name: "Nitish Rana", role: "BAT", ipl: "DC" },
      { name: "Ruturaj Gaikwad", role: "WK", ipl: "CSK" },
      { name: "Lungi Ngidi", role: "BWL", ipl: "DC" },
      { name: "Mohammed Siraj", role: "BWL", ipl: "GT" },
      { name: "Harshal Patel", role: "BWL", ipl: "SRH" },
      { name: "Tristan Stubbs", role: "BAT", ipl: "DC" },
      { name: "Sanju Samson", role: "WK", ipl: "CSK" },
      { name: "Prashant Veer", role: "AR", ipl: "CSK" },
      { name: "Ishan Kishan", role: "WK", ipl: "SRH" },
      { name: "Hardik Pandya", role: "AR", ipl: "MI" },
      { name: "Finn Allen", role: "BAT", ipl: "KKR" },
      { name: "Venkatesh Iyer", role: "AR", ipl: "RCB" }
    ]
  },
  ponygoat: {
    id: "ponygoat", name: "PonyGoat", owner: "Deb", emoji: "🐐", color: "#10b981",
    captain: "Sunil Narine", vc: "Jasprit Bumrah",
    players: [
      { name: "Marcus Stoinis", role: "AR", ipl: "PBKS" },
      { name: "Yashasvi Jaiswal", role: "BAT", ipl: "RR" },
      { name: "Tim Seifert", role: "WK", ipl: "KKR" },
      { name: "Virat Kohli", role: "BAT", ipl: "RCB" },
      { name: "Shashank Singh", role: "AR", ipl: "PBKS" },
      { name: "Sunil Narine", role: "AR", ipl: "KKR" },
      { name: "Suryakumar Yadav", role: "BAT", ipl: "MI" },
      { name: "Jasprit Bumrah", role: "BWL", ipl: "MI" },
      { name: "Ravindra Jadeja", role: "AR", ipl: "RR" },
      { name: "Travis Head", role: "BAT", ipl: "SRH" },
      { name: "KL Rahul", role: "WK", ipl: "DC" },
      { name: "Ryan Rickelton", role: "WK", ipl: "MI" },
      { name: "Mitchell Marsh", role: "AR", ipl: "LSG" },
      { name: "Khaleel Ahmed", role: "BWL", ipl: "CSK" },
      { name: "Kuldeep Yadav", role: "BWL", ipl: "DC" },
      { name: "Washington Sundar", role: "AR", ipl: "GT" },
      { name: "T Natarajan", role: "BWL", ipl: "DC" }
    ]
  }
};

const IPL_COLORS: Record<string, string> = {
  RCB: "#ef4444", MI: "#3b82f6", CSK: "#f59e0b", KKR: "#a855f7",
  PBKS: "#f87171", GT: "#60a5fa", RR: "#f472b6", SRH: "#fb923c",
  LSG: "#34d399", DC: "#38bdf8"
};

const IPL_FULL_NAMES: Record<string, string> = {
  RCB: "Royal Challengers Bengaluru", MI: "Mumbai Indians", CSK: "Chennai Super Kings",
  KKR: "Kolkata Knight Riders", PBKS: "Punjab Kings", GT: "Gujarat Titans",
  RR: "Rajasthan Royals", SRH: "Sunrisers Hyderabad", LSG: "Lucknow Super Giants",
  DC: "Delhi Capitals"
};

const ROLE_ICONS: Record<string, string> = { BAT: "🏏", BWL: "🎯", AR: "⚡", WK: "🧤" };
const ROLE_COLORS: Record<string, string> = { BAT: "#60a5fa", BWL: "#f472b6", AR: "#34d399", WK: "#fbbf24" };

function LineupPreviewCard({ data, matchIndex = 0, totalMatches = 1 }: {
  data: {
    match: any;
    playingTeams: string[];
    preview: { team: typeof FANTASY_TEAMS[string]; activePlayers: { name: string; role: string; ipl: string }[] }[];
  };
  matchIndex?: number;
  totalMatches?: number;
}) {
  const [open, setOpen] = useState(false);
  const { match, playingTeams, preview } = data;
  const teamInfo: any[] = match.teamInfo || [];
  const matchLabel = teamInfo.length >= 2
    ? `${teamInfo[0]?.shortname || ""} vs ${teamInfo[1]?.shortname || ""}`
    : match.name;
  const isDoubleHeader = totalMatches > 1;

  return (
    <div className="lineup-preview-card">
      <div className="lineup-preview-header" onClick={() => setOpen(o => !o)}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: "1.2rem" }}>🔮</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1rem", letterSpacing: "1.5px", color: "#e8821a" }}>
                {isDoubleHeader ? `MATCH ${matchIndex + 1} LINEUP` : "NEXT MATCH LINEUP"}
              </div>
              {isDoubleHeader && (
                <span style={{ fontSize: "0.55rem", fontWeight: 700, padding: "1px 6px", borderRadius: 20, background: "rgba(232,130,26,0.15)", border: "1px solid rgba(232,130,26,0.3)", color: "#e8821a", letterSpacing: "0.5px" }}>
                  DOUBLE HEADER
                </span>
              )}
            </div>
            <div style={{ fontSize: "0.62rem", color: "#64748b", marginTop: 1 }}>{matchLabel}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
          {playingTeams.filter(t => IPL_COLORS[t]).map(t => (
            <span key={t} style={{
              fontSize: "0.6rem", fontWeight: 700, padding: "2px 7px",
              borderRadius: 4, background: (IPL_COLORS[t]) + "22",
              border: `1px solid ${IPL_COLORS[t]}55`,
              color: IPL_COLORS[t], letterSpacing: "0.5px"
            }}>{t}</span>
          ))}
          <span style={{ fontSize: "0.75rem", color: "#475569", marginLeft: 2 }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>
      {open && (
        <div className="lineup-preview-body">
          {preview.length === 0 ? (
            <div style={{ color: "#475569", fontSize: "0.78rem", padding: "8px 0" }}>
              No fantasy players in this match.
            </div>
          ) : preview.map(({ team, activePlayers }) => (
            <div key={team.id} className="lineup-team-row">
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: "1.05rem" }}>{team.emoji}</span>
                <span style={{ fontWeight: 700, fontSize: "0.8rem", color: "#e2e8f0" }}>{team.name}</span>
                <span style={{ fontSize: "0.6rem", color: "#64748b" }}>by {team.owner}</span>
                <span style={{
                  marginLeft: "auto", fontSize: "0.6rem", fontWeight: 700,
                  padding: "1px 8px", borderRadius: 10,
                  background: team.color + "20", border: `1px solid ${team.color}44`,
                  color: team.color, flexShrink: 0
                }}>{activePlayers.length} active</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {activePlayers.map(p => {
                  const isCap = p.name === team.captain;
                  const isVC = p.name === team.vc;
                  return (
                    <div key={p.name} style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "5px 9px", borderRadius: 8,
                      background: (IPL_COLORS[p.ipl] || "#334155") + "15",
                      border: `1px solid ${IPL_COLORS[p.ipl] || "#334155"}30`,
                    }}>
                      <span style={{ fontSize: "0.7rem" }}>{ROLE_ICONS[p.role]}</span>
                      <span style={{ fontSize: "0.74rem", fontWeight: 600, color: "#e2e8f0" }}>{p.name}</span>
                      {isCap && <span style={{ fontSize: "0.56rem", fontWeight: 800, color: "#d4a017", background: "rgba(212,160,23,0.18)", borderRadius: 4, padding: "1px 4px", lineHeight: 1.2 }}>C</span>}
                      {isVC && <span style={{ fontSize: "0.56rem", fontWeight: 800, color: "#94a3b8", background: "rgba(148,163,184,0.12)", borderRadius: 4, padding: "1px 4px", lineHeight: 1.2 }}>VC</span>}
                      <span style={{ fontSize: "0.6rem", color: IPL_COLORS[p.ipl] || "#64748b", fontWeight: 700 }}>{p.ipl}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getTeamData(teamId: string, playerPoints: Record<string, number>) {
  const team = FANTASY_TEAMS[teamId];
  const players = team.players.map(p => {
    const raw = playerPoints[p.name] || 0;
    const adj = p.name === team.captain ? raw * 2 : p.name === team.vc ? Math.floor(raw * 1.5) : raw;
    return { ...p, raw, adj };
  }).sort((a, b) => b.adj - a.adj);
  const top11 = new Set(players.slice(0, 11).map(p => p.name));
  const total = players.filter(p => top11.has(p.name)).reduce((s, p) => s + p.adj, 0);
  return { total, players, top11 };
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [selectedTeam, setSelectedTeam] = useState("rajveer");
  const [playerPoints, setPlayerPoints] = useState<Record<string, number>>({});
  interface PlayerStats { played: boolean; runs: number; balls: number; fours: number; sixes: number; duck: boolean; wickets: number; dots: number; lbwBowled: number; maidens: number; ballsBowled: number; runsConceded: number; catches: number; runOuts: number; stumpings: number; }
  const [playerMatchPoints, setPlayerMatchPoints] = useState<Record<string, Array<{ matchNum: number; label: string; pts: number; source: string; stats?: PlayerStats }>>>({});
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [pointsUpdating, setPointsUpdating] = useState(false);
  const [pendingMatches, setPendingMatches] = useState(0);
  const [nextAttempt, setNextAttempt] = useState<string | null>(null);
  const [processedMatches, setProcessedMatches] = useState<string[]>([]);
  const [dailyHits, setDailyHits] = useState<{ count: number; limit: number; date: string } | null>(null);
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
  const [statsFilter, setStatsFilter] = useState<"all" | "fantasy">("all");
  const [statsCategory, setStatsCategory] = useState<"orangeCap" | "purpleCap" | "sixesLeader" | "foursLeader" | "srLeader" | "ecoLeader">("orangeCap");
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [matchFilter, setMatchFilter] = useState<"upcoming" | "live" | "completed" | "all">("upcoming");
  const [teamFilter, setTeamFilter] = useState<string | null>(null);
  const [standingsOpen, setStandingsOpen] = useState(false);
  const [rankChanges, setRankChanges] = useState<Record<string, number>>({});
  const [isDark, setIsDark] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [countdown, setCountdown] = useState<{ text: string; matchName: string } | null>(null);
  const fetchPoints = async () => {
    if (pointsLoading) return;
    setPointsLoading(true);
    setPointsError(null);
    try {
      const res = await fetch("/api/ipl/points");
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (data.error && !data.playerPoints) {
        setPointsError(data.error);
      } else {
        setPlayerPoints(data.playerPoints || {});
        setPlayerMatchPoints(data.playerMatchPoints || {});
        setProcessedMatches(data.processedMatches || []);
        setPointsUpdating(data.updating || false);
        setPendingMatches(data.pendingMatches || 0);
        setNextAttempt(data.nextAttempt || null);
        if (data.dailyHits) setDailyHits(data.dailyHits);
        setPointsLastUpdated(new Date());
      }
    } catch (e: any) {
      setPointsError("Points fetch failed: " + (e.message || "Unknown error"));
    }
    setPointsLoading(false);
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
        setMatchFilter(hasLive ? "live" : "upcoming");
      } else {
        setApiError("No IPL matches found from official sources.");
      }
      setLastUpdated(new Date());
    } catch (e: any) {
      setApiError("Fetch failed: " + (e.message || "Unknown error"));
    }
    setLiveLoading(false);
  };

  const fetchScorecard = async (matchId: string) => {
    if (scorecards[matchId] || scorecardLoading === matchId) return;
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

  const toggleMatch = (matchId: string, isCompleted: boolean) => {
    if (expandedMatchId === matchId) {
      setExpandedMatchId(null);
    } else {
      setExpandedMatchId(matchId);
      if (isCompleted) fetchScorecard(matchId);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchLive();
    fetchPoints();
    fetchStandings();
    fetchStats();
  }, []);

  // Adaptive polling: 1 min during a live match, 15 min when idle
  const isAnyMatchLive = liveMatches.some((m: any) => m.matchStarted && !m.matchEnded);
  useEffect(() => {
    const delay = isAnyMatchLive ? 60_000 : 15 * 60_000;
    const ids = [
      setInterval(fetchLive, delay),
      setInterval(fetchPoints, delay),
      setInterval(fetchStandings, delay),
      setInterval(fetchStats, delay),
    ];
    return () => ids.forEach(clearInterval);
  }, [isAnyMatchLive]);

  const teamScores = Object.keys(FANTASY_TEAMS)
    .map(id => ({ id, ...getTeamData(id, playerPoints), team: FANTASY_TEAMS[id] }))
    .sort((a, b) => b.total - a.total);

  // Rank change tracking — compare current standings to hourly snapshot in localStorage
  useEffect(() => {
    if (!Object.keys(playerPoints).length) return;
    const STORAGE_KEY = "ipl_fantasy_rank_snapshot";
    const COOLDOWN_MS = 60 * 60 * 1000; // refresh snapshot at most once per hour
    const currentRanks: Record<string, number> = {};
    teamScores.forEach((s, i) => { currentRanks[s.id] = i + 1; });
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const { ranks: prevR, timestamp } = JSON.parse(stored) as { ranks: Record<string, number>; timestamp: number };
        const changes: Record<string, number> = {};
        for (const id of Object.keys(currentRanks)) {
          if (prevR[id] !== undefined) changes[id] = prevR[id] - currentRanks[id];
        }
        setRankChanges(changes);
        if (Date.now() - timestamp > COOLDOWN_MS) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ranks: currentRanks, timestamp: Date.now() }));
        }
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ranks: currentRanks, timestamp: Date.now() }));
      }
    } catch { /* ignore storage errors */ }
  }, [playerPoints]);

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
      setCountdown({ text, matchName: upcoming.name });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [liveMatches]);

  // Hot players: scored >= 25 pts in most recent match
  const hotPlayers = new Set<string>(
    Object.entries(playerMatchPoints)
      .filter(([, matches]) => {
        const sorted = [...matches].sort((a, b) => b.matchNum - a.matchNum);
        return sorted.length > 0 && sorted[0].pts >= 25;
      })
      .map(([name]) => name)
  );

  // Per-team match-by-match cumulative points (for chart)
  const matchHistory = (() => {
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
            let p = entry.pts;
            if (player.name === team.captain) p *= 2;
            else if (player.name === team.vc) p = Math.floor(p * 1.5);
            pts += p;
          }
        }
        cum += pts;
        return { matchNum, label: `M${matchNum}`, cum };
      });
      return { teamId, color: team.color, name: team.name, emoji: team.emoji, points };
    });
  })();

  const shareLeaderboard = async () => {
    const lines = [
      "🏆 IPL Fantasy 2026 — Leaderboard",
      "",
      ...teamScores.map((s, i) => {
        const medal = ["🥇", "🥈", "🥉", "4️⃣"][i] ?? `${i + 1}.`;
        return `${medal} ${s.team.name} (${s.team.owner}) — ${s.total} pts`;
      }),
      "",
      `Updated: ${lastUpdated ? lastUpdated.toLocaleTimeString() : "just now"}`,
    ].join("\n");
    try {
      if (navigator.share) {
        await navigator.share({ title: "IPL Fantasy 2026", text: lines });
      } else {
        await navigator.clipboard.writeText(lines);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2500);
      }
    } catch { /* user cancelled */ }
  };

  const maxPts = teamScores[0]?.total || 1;

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
  };
  const TABS = [
    { id: "home", label: "Leaderboard" },
    { id: "teams", label: "Teams" },
    { id: "fixtures", label: "Matches" },
    { id: "stats", label: "Stats" },
  ];

  const rankLabel = (i: number) => i === 0 ? "first" : i === 1 ? "second" : i === 2 ? "third" : "";

  const computeAwards = () => {
    const hasData = Object.keys(playerPoints).length > 0;
    if (!hasData) return [];

    const awards: { trophy: string; title: string; winner: string; detail: string; color: string }[] = [];

    // All fantasy players with points
    const allFantasyPlayers = Object.values(FANTASY_TEAMS).flatMap(t =>
      t.players.map(p => ({ name: p.name, team: t.name, owner: t.owner, pts: playerPoints[p.name] || 0, isCap: p.name === t.captain, isVC: p.name === t.vc }))
    );

    // 1. Manager of the Season — leading team
    const leader = teamScores[0];
    if (leader.total > 0) {
      awards.push({ trophy: "🏆", title: "Manager of the Season", winner: `${leader.team.name}`, detail: `by ${leader.team.owner} · ${leader.total} pts from Top 11`, color: leader.team.color });
    }

    // 2. Captain Marvel — best captain (raw pts, shown as captain-adjusted)
    const captains = Object.values(FANTASY_TEAMS).map(t => ({
      name: t.captain, team: t.name, owner: t.owner, pts: (playerPoints[t.captain] || 0) * 2
    })).sort((a, b) => b.pts - a.pts);
    if (captains[0].pts > 0) {
      awards.push({ trophy: "🎖️", title: "Captain Marvel", winner: captains[0].name, detail: `${captains[0].pts} adjusted pts · ${captains[0].team} (${captains[0].owner})`, color: "#f97316" });
    }

    // 3. Star Player — highest raw points across all fantasy players
    const star = allFantasyPlayers.sort((a, b) => b.pts - a.pts)[0];
    if (star.pts > 0) {
      awards.push({ trophy: "🌟", title: "Star Player", winner: star.name, detail: `${star.pts} pts · ${star.team} (${star.owner})`, color: "#fbbf24" });
    }

    // 4. Hidden Gem — highest bench scorer (not in top 11 of their team)
    const benchAll = teamScores.flatMap(s =>
      s.players.filter(p => !s.top11.has(p.name) && p.raw > 0).map(p => ({ name: p.name, team: s.team.name, owner: s.team.owner, pts: p.raw }))
    ).sort((a, b) => b.pts - a.pts);
    if (benchAll.length > 0) {
      awards.push({ trophy: "💎", title: "Hidden Gem", winner: benchAll[0].name, detail: `${benchAll[0].pts} pts on bench · ${benchAll[0].team} (${benchAll[0].owner})`, color: "#34d399" });
    }

    // 5. Six Machine — most sixes (fantasy players, from iplStats)
    if (iplStats?.sixesLeader) {
      const sixers = (iplStats.sixesLeader as any[]).filter(p => p.isFantasy && p.sixes > 0);
      if (sixers.length > 0) {
        awards.push({ trophy: "💥", title: "Six Machine", winner: sixers[0].name, detail: `${sixers[0].sixes} sixes · ${sixers[0].runs} runs`, color: "#a855f7" });
      }
    }

    // 6. Wicket Wizard — most wickets (fantasy players, from iplStats)
    if (iplStats?.purpleCap) {
      const bowlers = (iplStats.purpleCap as any[]).filter(p => p.isFantasy && p.wickets > 0);
      if (bowlers.length > 0) {
        awards.push({ trophy: "🎳", title: "Wicket Wizard", winner: bowlers[0].name, detail: `${bowlers[0].wickets} wkts · Best: ${bowlers[0].best}`, color: "#f472b6" });
      }
    }

    // 7. Run Machine — most runs (fantasy players, from iplStats)
    if (iplStats?.orangeCap) {
      const batters = (iplStats.orangeCap as any[]).filter(p => p.isFantasy && p.runs > 0);
      if (batters.length > 0) {
        awards.push({ trophy: "🏏", title: "Run Machine", winner: batters[0].name, detail: `${batters[0].runs} runs · HS: ${batters[0].hs}`, color: "#60a5fa" });
      }
    }

    // 8. Vice Captain Star — best VC adjusted
    const vcs = Object.values(FANTASY_TEAMS).map(t => ({
      name: t.vc, team: t.name, owner: t.owner, pts: Math.floor((playerPoints[t.vc] || 0) * 1.5)
    })).sort((a, b) => b.pts - a.pts);
    if (vcs[0].pts > 0) {
      awards.push({ trophy: "⭐", title: "Vice Captain Star", winner: vcs[0].name, detail: `${vcs[0].pts} adjusted pts · ${vcs[0].team} (${vcs[0].owner})`, color: "#94a3b8" });
    }

    // 9. Wooden Spoon — last place team (only if season has data and not all zeros)
    const lastTeam = teamScores[teamScores.length - 1];
    if (teamScores.length === 4 && lastTeam.total < teamScores[0].total) {
      awards.push({ trophy: "🥄", title: "Wooden Spoon", winner: lastTeam.team.name, detail: `by ${lastTeam.team.owner} · ${lastTeam.total} pts · Room to improve!`, color: "#334155" });
    }

    return awards;
  };

  // Helper: build preview data from a list of matches
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

  const renderHome = () => {
    const awards = computeAwards();
    return (
    <div>
      {/* Countdown to next match */}
      {countdown && (
        <div className="countdown-card">
          <div>
            <div className="countdown-timer">{countdown.text}</div>
            <div className="countdown-label">Next Match</div>
          </div>
          <div className="countdown-match">{countdown.matchName}</div>
        </div>
      )}

      <div className="sec-title">Leaderboard</div>
      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginBottom: 12 }}>
        <button className="btn-primary" style={{ padding: "5px 11px", fontSize: "0.7rem" }} onClick={shareLeaderboard}>
          Share
        </button>
        <button className="btn-primary" style={{ padding: "5px 11px", fontSize: "0.7rem" }}
          onClick={() => { fetchLive(); fetchPoints(); }} disabled={liveLoading || pointsLoading}>
          {(liveLoading || pointsLoading) ? <span className="spinner" /> : null} Refresh
        </button>
      </div>
      {teamScores.map((s, i) => (
        <div key={s.id} className={`lb-card ${i === 0 ? "rank-first" : ""}`} onClick={() => { setSelectedTeam(s.id); setTab("teams"); }}>
          <div className="lb-accent" style={{ background: s.team.color }} />
          <div className="lb-inner">
            <div className={`lb-rank ${rankLabel(i)}`}>{i + 1}</div>
            <div className="lb-info">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div className={`lb-name ${i === 0 ? "first" : ""}`}>{s.team.name}</div>
                {rankChanges[s.id] !== undefined && rankChanges[s.id] !== 0 && (
                  <span className={`rank-change ${rankChanges[s.id] > 0 ? "up" : "down"}`}>
                    {rankChanges[s.id] > 0 ? `▲${rankChanges[s.id]}` : `▼${Math.abs(rankChanges[s.id])}`}
                  </span>
                )}
              </div>
              <div className="lb-meta">{s.team.owner} · <span style={{ color: "#d4a843" }}>C:</span> {s.team.captain} · <span style={{ color: "var(--text-2)" }}>VC:</span> {s.team.vc}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className={`lb-pts ${i === 0 ? "first" : ""}`} style={{ color: i === 0 ? "#d4a843" : s.team.color }}>{s.total}</div>
              <div className="lb-pts-label">pts</div>
            </div>
          </div>
        </div>
      ))}

      {(() => {
        const liveNow = liveMatches.filter((m: any) => m.matchStarted && !m.matchEnded);
        if (liveNow.length === 0) return null;
        return (
          <>
            <div className="divider" />
            <div className="sec-title">Live Now</div>
            {liveNow.map((m: any) => (
              <div key={m.id} className="match-card" onClick={() => { setTab("fixtures"); setMatchFilter("live"); }}
                style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div className="match-status" style={{ color: "var(--live)" }}>Live</div>
                  <div style={{ fontSize: "0.6rem", color: "var(--text-3)" }}>View in Matches →</div>
                </div>
                <div className="match-name">{m.name}</div>
                {(m.score || []).map((s: any, i: number) => (
                  <div key={i} className="match-score" style={{ marginTop: 3 }}>
                    <span style={{ color: "var(--text-3)", fontSize: "0.67rem" }}>{(s.inning || "").replace(" Innings", "").replace(" Inning", "")} </span>
                    {s.summary || (s.r != null ? `${s.r}/${s.w} (${s.o} ov)` : "")}
                  </div>
                ))}
                <div className="match-venue">{m.venue || ""}</div>
              </div>
            ))}
          </>
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
      const infos: { matchLabel: string; playingTeams: string[] }[] = [];
      previews.forEach(lp => {
        const myPlayers = lp.preview.find(x => x.team.id === selectedTeam);
        if (myPlayers && myPlayers.activePlayers.length > 0) {
          myPlayers.activePlayers.forEach(p => playing.add(p.name));
          const ti: any[] = lp.match.teamInfo || [];
          const matchLabel = ti.length >= 2
            ? `${ti[0]?.shortname || ""} vs ${ti[1]?.shortname || ""}`
            : lp.match.name;
          infos.push({ matchLabel, playingTeams: lp.playingTeams });
        }
      });
      return { playing, infos };
    };

    const { playing: liveNowPlaying, infos: liveNowInfo } = extractForTeam(liveMatchPreviews);
    const { playing: nextMatchPlaying, infos: nextMatchInfoForTeam } = extractForTeam(upcomingLineupPreviews);

    const hasLiveNow = liveNowPlaying.size > 0;
    const hasNextMatch = nextMatchPlaying.size > 0;
    const hasAnyContext = hasLiveNow || hasNextMatch;

    return (
      <div>
        <div className="team-tabs">
          {teamScores.map(s => {
            const ft = s.team;
            return (
              <button key={ft.id} className={`team-tab ${selectedTeam === ft.id ? "active" : ""}`}
                style={selectedTeam === ft.id ? { color: ft.color, borderColor: ft.color } : {}}
                onClick={() => setSelectedTeam(ft.id)}>
                <div>{ft.emoji} {ft.name}</div>
                <div style={{ fontSize: "0.6rem", opacity: 0.65, marginTop: 1 }}>{ft.owner}</div>
              </button>
            );
          })}
        </div>

        <div className="team-header-card" style={{ "--team-color": t.color } as React.CSSProperties}>
          <div style={{ flex: 1 }}>
            <div className="team-hname" style={{ color: t.color }}>{t.name}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-3)", marginBottom: 4 }}>{t.owner}</div>
            <div className="team-roles">
              {Object.entries(roleCounts).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([role, n]) => (
                <span key={role} className="role-badge"
                  style={{ color: ROLE_COLORS[role], borderColor: ROLE_COLORS[role] + "44", background: ROLE_COLORS[role] + "11" }}>
                  {n} {role}
                </span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="team-htotal" style={{ color: t.color }}>{td.total}</div>
            <div className="team-hlabel">total pts</div>
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
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f87171", display: "inline-block", flexShrink: 0, boxShadow: "0 0 4px #f87171" }} />
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
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.06em" }}>NEXT</span>
                  {nextMatchInfoForTeam[0] && <span style={{ fontSize: "0.65rem", color: "var(--text-2)" }}>{nextMatchInfoForTeam[0].matchLabel}</span>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {td.players.filter(p => nextMatchPlaying.has(p.name) && !liveNowPlaying.has(p.name)).map(p => (
                    <div key={p.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--text-2)" }}>{p.name}</span>
                        {p.name === t.captain && <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#d4a843" }}>C</span>}
                        {p.name === t.vc && <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-3)" }}>VC</span>}
                      </div>
                      <span style={{ fontSize: "0.62rem", color: IPL_COLORS[p.ipl] || "var(--text-3)", fontWeight: 600 }}>{p.ipl}</span>
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
                gridColumn: "1 / -1", background: "rgba(10,16,28,0.98)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
                padding: "12px 14px", marginTop: 2, marginBottom: 2,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#f1f5f9" }}>{playerName}</div>
                    <div style={{ display: "flex", gap: 5, marginTop: 4, flexWrap: "wrap" as const }}>
                      <span style={{ fontSize: "0.6rem", padding: "1px 6px", borderRadius: 10, background: IPL_COLORS[p.ipl] + "22", color: IPL_COLORS[p.ipl] }}>{p.ipl}</span>
                      {isCap && <span style={{ fontSize: "0.6rem", padding: "1px 6px", borderRadius: 10, background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>© Captain ×2</span>}
                      {isVC && <span style={{ fontSize: "0.6rem", padding: "1px 6px", borderRadius: 10, background: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" }}>VC ×1.5</span>}
                      {!inTop11 && <span style={{ fontSize: "0.6rem", padding: "1px 6px", borderRadius: 10, background: "rgba(100,116,139,0.15)", color: "#64748b" }}>Bench</span>}
                      <span style={{ fontSize: "0.6rem", padding: "1px 6px", borderRadius: 10, background: "rgba(100,116,139,0.1)", color: "#64748b" }}>{p.role}</span>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setExpandedPlayer(null); }}
                    style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "1rem", padding: "2px 6px" }}>✕</button>
                </div>

                {breakdown.length === 0 ? (
                  <div style={{ color: "#475569", fontSize: "0.75rem", textAlign: "center" as const, padding: "10px 0" }}>No match data yet — points sync after each game.</div>
                ) : (
                  <>
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8 }}>
                      {breakdown.map((entry, ei) => {
                        const s = entry.stats;
                        const lines: { label: string; pts: number; color: string }[] = [];
                        if (s) {
                          lines.push({ label: "Playing XI", pts: 4, color: "#94a3b8" });
                          if (s.runs > 0) lines.push({ label: `${s.runs} runs (${s.balls}b)`, pts: s.runs, color: "#f97316" });
                          if (s.fours > 0) lines.push({ label: `${s.fours} fours`, pts: s.fours * 4, color: "#fb923c" });
                          if (s.sixes > 0) lines.push({ label: `${s.sixes} sixes`, pts: s.sixes * 6, color: "#fbbf24" });
                          if (s.duck) lines.push({ label: "Duck", pts: -2, color: "#ef4444" });
                          const r = s.runs; const b = s.balls;
                          if (r >= 100) lines.push({ label: "Century bonus", pts: 16, color: "#34d399" });
                          else if (r >= 75) lines.push({ label: "75+ bonus", pts: 12, color: "#34d399" });
                          else if (r >= 50) lines.push({ label: "Half-century bonus", pts: 8, color: "#34d399" });
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
                          if (s.wickets > 0) lines.push({ label: `${s.wickets} wicket${s.wickets > 1 ? "s" : ""}`, pts: s.wickets * 30, color: "#60a5fa" });
                          if (s.lbwBowled > 0) lines.push({ label: `${s.lbwBowled} LBW/Bowled`, pts: s.lbwBowled * 8, color: "#60a5fa" });
                          if (s.dots > 0) lines.push({ label: `${s.dots} dot balls`, pts: s.dots * 2, color: "#818cf8" });
                          if (s.maidens > 0) lines.push({ label: `${s.maidens} maiden${s.maidens > 1 ? "s" : ""}`, pts: s.maidens * 12, color: "#818cf8" });
                          const w = s.wickets;
                          if (w >= 5) lines.push({ label: "5-wicket haul", pts: 16, color: "#34d399" });
                          else if (w >= 4) lines.push({ label: "4-wicket haul", pts: 12, color: "#34d399" });
                          else if (w >= 3) lines.push({ label: "3-wicket haul", pts: 8, color: "#34d399" });
                          const overs = s.ballsBowled / 6;
                          if (overs >= 2) {
                            const eco = s.runsConceded / overs;
                            if (eco < 5) lines.push({ label: `Eco ${eco.toFixed(1)} bonus`, pts: 8, color: "#34d399" });
                            else if (eco < 6) lines.push({ label: `Eco ${eco.toFixed(1)} bonus`, pts: 6, color: "#34d399" });
                            else if (eco <= 7) lines.push({ label: `Eco ${eco.toFixed(1)} bonus`, pts: 4, color: "#34d399" });
                            else if (eco <= 8) lines.push({ label: `Eco ${eco.toFixed(1)} bonus`, pts: 2, color: "#34d399" });
                            else if (eco >= 10 && eco <= 11) lines.push({ label: `Eco ${eco.toFixed(1)} penalty`, pts: -2, color: "#ef4444" });
                            else if (eco > 11 && eco <= 12) lines.push({ label: `Eco ${eco.toFixed(1)} penalty`, pts: -4, color: "#ef4444" });
                            else if (eco > 12) lines.push({ label: `Eco ${eco.toFixed(1)} penalty`, pts: -6, color: "#ef4444" });
                          }
                          if (s.catches > 0) lines.push({ label: `${s.catches} catch${s.catches > 1 ? "es" : ""}`, pts: s.catches * 8, color: "#a78bfa" });
                          if (s.catches >= 3) lines.push({ label: "3+ catch bonus", pts: 4, color: "#a78bfa" });
                          if (s.runOuts > 0) lines.push({ label: `${s.runOuts} run out${s.runOuts > 1 ? "s" : ""}`, pts: s.runOuts * 10, color: "#a78bfa" });
                          if (s.stumpings > 0) lines.push({ label: `${s.stumpings} stumping${s.stumpings > 1 ? "s" : ""}`, pts: s.stumpings * 12, color: "#a78bfa" });
                        }
                        return (
                          <div key={ei} style={{ marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: s ? 6 : 0 }}>
                              <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>
                                <span style={{ color: "#64748b", marginRight: 5 }}>M{entry.matchNum < 900 ? entry.matchNum : "live"}</span>
                                {shortMatchLabel(entry.label)}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <span style={{ fontSize: "0.57rem", padding: "1px 5px", borderRadius: 8,
                                  background: entry.source === "official" ? "rgba(52,211,153,0.1)" : "rgba(251,191,36,0.1)",
                                  color: entry.source === "official" ? "#34d399" : "#fbbf24",
                                  border: `1px solid ${entry.source === "official" ? "rgba(52,211,153,0.2)" : "rgba(251,191,36,0.2)"}` }}>
                                  {entry.source === "official" ? "✓ official" : "★ live"}
                                </span>
                                <span style={{ fontWeight: 700, fontSize: "0.88rem", color: entry.pts > 0 ? "#f1f5f9" : "#475569", minWidth: 28, textAlign: "right" as const }}>
                                  {entry.pts}
                                </span>
                              </div>
                            </div>
                            {s && lines.length > 0 && (
                              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "2px 10px", padding: "5px 8px", background: "rgba(255,255,255,0.02)", borderRadius: 7 }}>
                                {lines.map((line, li) => (
                                  <>
                                    <span key={`l${li}`} style={{ fontSize: "0.62rem", color: "#64748b" }}>{line.label}</span>
                                    <span key={`p${li}`} style={{ fontSize: "0.62rem", fontWeight: 600, color: line.pts >= 0 ? line.color : "#ef4444", textAlign: "right" as const }}>
                                      {line.pts > 0 ? "+" : ""}{line.pts}
                                    </span>
                                  </>
                                ))}
                              </div>
                            )}
                            {s && (() => {
                              const computed = lines.reduce((a, l) => a + l.pts, 0);
                              const diff = entry.pts - computed;
                              if (Math.abs(diff) > 0) {
                                const didBowl = s.ballsBowled > 0;
                                const residualLabel = didBowl ? "Dots & fielding / other" : "Fielding / other";
                                const residualHint = didBowl
                                  ? "Dot balls (2pts each) + any fielding not in API"
                                  : "Catches (8pts), runouts (10pts), stumpings (12pts), 3-catch bonus (4pts) — fielding not in API data";
                                return (
                                  <div style={{ padding: "4px 8px 0", marginTop: 2 }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "2px 10px" }}>
                                      <span style={{ fontSize: "0.62rem", color: "#475569" }}>{residualLabel}</span>
                                      <span style={{ fontSize: "0.62rem", fontWeight: 600, color: diff >= 0 ? "#a78bfa" : "#ef4444", textAlign: "right" as const }}>{diff > 0 ? "+" : ""}{diff}</span>
                                    </div>
                                    <div style={{ fontSize: "0.56rem", color: "#334155", marginTop: 1, lineHeight: 1.3 }}>{residualHint}</div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                            {!s && entry.source === "official" && (
                              <div style={{ fontSize: "0.6rem", color: "#475569", paddingLeft: 4, marginTop: 2 }}>Official score — stats syncing...</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: 2, paddingTop: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#64748b" }}>
                        <span>Raw total</span>
                        <span style={{ color: "#94a3b8" }}>{raw} pts</span>
                      </div>
                      {multiplier && (
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#64748b", marginTop: 3 }}>
                          <span>Multiplier</span>
                          <span style={{ color: isCap ? "#fbbf24" : "#a78bfa" }}>{multiplier}</span>
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 700, marginTop: 6, color: inTop11 ? t.color : "#475569" }}>
                        <span>{inTop11 ? "Counts toward team" : "Bench (not counted)"}</span>
                        <span>{adj} pts</span>
                      </div>
                    </div>
                    <details style={{ marginTop: 10 }}>
                      <summary style={{ fontSize: "0.6rem", color: "#64748b", cursor: "pointer", userSelect: "none" as const, listStyle: "none" }}>
                        ℹ️ Scoring guide (tap to expand)
                      </summary>
                      <div style={{ marginTop: 6, padding: "8px 10px", background: "rgba(255,255,255,0.02)", borderRadius: 7, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 12px" }}>
                        {[
                          ["Playing XI", "+4"],
                          ["Run scored", "+1 each"],
                          ["Four", "+4"],
                          ["Six", "+6"],
                          ["25+ runs", "+4 bonus"],
                          ["50+ runs", "+8 bonus"],
                          ["75+ runs", "+12 bonus"],
                          ["100+ runs", "+16 bonus"],
                          ["Duck (bat)", "−2"],
                          ["SR >190", "+8"], ["SR >170", "+6"], ["SR >150", "+4"], ["SR ≥130", "+2"],
                          ["SR 70–100", "−2"], ["SR 60–70", "−4"], ["SR <60", "−6"],
                          ["Wicket", "+30"],
                          ["LBW / Bowled", "+8 bonus"],
                          ["3-wkt haul", "+8"], ["4-wkt haul", "+12"], ["5-wkt haul", "+16"],
                          ["Dot ball", "+2"],
                          ["Maiden over", "+12"],
                          ["Eco <5", "+8"], ["Eco <6", "+6"], ["Eco ≤7", "+4"], ["Eco ≤8", "+2"],
                          ["Eco 10–11", "−2"], ["Eco 11–12", "−4"], ["Eco >12", "−6"],
                          ["Catch", "+8"],
                          ["Run out", "+10"],
                          ["Stumping", "+12"],
                          ["3+ catches", "+4 bonus"],
                        ].map(([label, val], i) => (
                          <React.Fragment key={i}>
                            <span style={{ fontSize: "0.57rem", color: "#475569" }}>{label}</span>
                            <span style={{ fontSize: "0.57rem", color: val.startsWith("−") ? "#ef4444" : "#94a3b8", fontWeight: 600 }}>{val}</span>
                          </React.Fragment>
                        ))}
                      </div>
                    </details>
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

          return (
            <>
              <div className="top11-label">Playing XI (Top 11)</div>
              <div className="players-grid">
                {td.players.filter(p => td.top11.has(p.name)).sort((a, b) => b.adj - a.adj).map(p => {
                  const isExp = expandedPlayer === p.name;
                  const { isLiveNow, isUpcoming, isDimmed, glowColor } = getPlayerState(p.name, p.ipl);
                  const cardClass = [
                    "player-card",
                    p.name === t.captain ? "is-c" : p.name === t.vc ? "is-vc" : "",
                    isExp ? "player-expanded" : "",
                    isLiveNow ? "live-now" : isUpcoming ? "playing-next" : isDimmed ? "not-playing-next" : ""
                  ].filter(Boolean).join(" ");
                  return (
                    <React.Fragment key={p.name}>
                      <div className={cardClass}
                        onClick={() => setExpandedPlayer(isExp ? null : p.name)}>
                        {isLiveNow ? <div className="playing-badge live-badge" /> : <div className="playing-badge" style={{ background: isUpcoming ? "#4ade80" : hasAnyContext ? "transparent" : "#4ade80" }} />}
                        <div className="player-ipl-badge" style={{ background: IPL_COLORS[p.ipl] + "33", color: IPL_COLORS[p.ipl] }}>
                          {p.ipl}
                        </div>
                        <div className="player-name" style={isLiveNow ? { color: "#fca5a5" } : {}}>{p.name}{p.name === t.captain ? <span style={{ marginLeft: 5, fontSize: "0.56rem", color: "#d4a843", fontWeight: 700 }}>C</span> : p.name === t.vc ? <span style={{ marginLeft: 5, fontSize: "0.56rem", color: "#a1a1aa", fontWeight: 700 }}>VC</span> : null}</div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div className="player-pts" style={{ color: isLiveNow ? "#fca5a5" : p.adj > 0 ? t.color : "var(--text-3)" }}>{p.adj}</div>
                          {p.name === t.captain && <div className="player-pts-raw">×2</div>}
                          {p.name === t.vc && <div className="player-pts-raw">×1.5</div>}
                        </div>
                      </div>
                      {isExp && renderBreakdown(p)}
                    </React.Fragment>
                  );
                })}
              </div>

              <div className="top11-label" style={{ marginTop: 16 }}>Bench</div>
              <div className="players-grid">
                {td.players.filter(p => !td.top11.has(p.name)).sort((a, b) => b.adj - a.adj).map(p => {
                  const isExp = expandedPlayer === p.name;
                  const { isLiveNow, isUpcoming, isDimmed, glowColor } = getPlayerState(p.name, p.ipl);
                  const cardClass = [
                    "player-card benched",
                    p.name === t.captain ? "is-c" : p.name === t.vc ? "is-vc" : "",
                    isExp ? "player-expanded" : "",
                    isLiveNow ? "live-now" : isUpcoming ? "playing-next" : isDimmed ? "not-playing-next" : ""
                  ].filter(Boolean).join(" ");
                  return (
                    <React.Fragment key={p.name}>
                      <div className={cardClass}
                        onClick={() => setExpandedPlayer(isExp ? null : p.name)}>
                        {isLiveNow ? <div className="playing-badge live-badge" /> : <div className="playing-badge" style={{ background: isUpcoming ? "#4ade80" : "transparent" }} />}
                        <div className="player-ipl-badge" style={{ background: IPL_COLORS[p.ipl] + "22", color: IPL_COLORS[p.ipl] + "99" }}>
                          {p.ipl}
                        </div>
                        <div className="player-name" style={isLiveNow ? { color: "#fca5a5" } : {}}>{p.name}{p.name === t.captain ? <span style={{ marginLeft: 5, fontSize: "0.56rem", color: "#d4a843", fontWeight: 700 }}>C</span> : p.name === t.vc ? <span style={{ marginLeft: 5, fontSize: "0.56rem", color: "#a1a1aa", fontWeight: 700 }}>VC</span> : null}</div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div className="player-pts" style={{ color: isLiveNow ? "#fca5a5" : "var(--text-3)" }}>{p.adj}</div>
                          {p.name === t.captain && <div className="player-pts-raw">×2</div>}
                          {p.name === t.vc && <div className="player-pts-raw">×1.5</div>}
                        </div>
                      </div>
                      {isExp && renderBreakdown(p)}
                    </React.Fragment>
                  );
                })}
              </div>
            </>
          );
        })()}
      </div>
    );
  };

  const renderFixtures = () => {
    const grouped = liveMatches.reduce((acc: Record<string, any[]>, m: any) => {
      const d = m.date || (m.dateTimeGMT || "").split("T")[0] || "Unknown";
      if (!acc[d]) acc[d] = [];
      acc[d].push(m);
      return acc;
    }, {});
    const live = liveMatches.filter((m: any) => m.matchStarted && !m.matchEnded);
    const completed = liveMatches.filter((m: any) => m.matchEnded);
    const upcoming = liveMatches.filter((m: any) => !m.matchStarted && !m.matchEnded);

    const fmtDate = (d: string) => {
      try { return new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }); }
      catch (e) { return d || ""; }
    };
    const fmtTime = (dt: string) => {
      try { return new Date(dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " local"; }
      catch (e) { return ""; }
    };
    const getMatchNum = (name: string) => {
      const mx = (name || "").match(/(\d+)(?:st|nd|rd|th) Match/i);
      return mx ? "M" + mx[1] : "";
    };

    const activeFilter = matchFilter;
    const filteredMatches = liveMatches.filter((m: any) => {
      const isLiveM = m.matchStarted && !m.matchEnded;
      const isDoneM = m.matchEnded;
      if (activeFilter === "live" && !isLiveM) return false;
      if (activeFilter === "upcoming" && (m.matchStarted || m.matchEnded)) return false;
      if (activeFilter === "completed" && !isDoneM) return false;
      if (teamFilter) {
        const inTeamInfo = (m.teamInfo || []).some((ti: any) => ti.shortname === teamFilter);
        const inName = (m.name || "").toLowerCase().includes(teamFilter.toLowerCase());
        return inTeamInfo || inName;
      }
      return true;
    });
    const filteredGrouped = filteredMatches.reduce((acc: Record<string, any[]>, m: any) => {
      const d = m.date || (m.dateTimeGMT || "").split("T")[0] || "Unknown";
      if (!acc[d]) acc[d] = [];
      acc[d].push(m);
      return acc;
    }, {});

    return (
      <div>
        {/* Points Table */}
        {standings.length > 0 && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text)" }}>Points Table</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: "0.7rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <th style={{ textAlign: "left" as const, padding: "8px 12px", color: "var(--text-3)", fontWeight: 600 }}>#</th>
                    <th style={{ textAlign: "left" as const, padding: "8px 8px", color: "var(--text-3)", fontWeight: 600 }}>TEAM</th>
                    <th style={{ textAlign: "center" as const, padding: "8px 6px", color: "var(--text-3)", fontWeight: 600 }}>P</th>
                    <th style={{ textAlign: "center" as const, padding: "8px 6px", color: "var(--text-3)", fontWeight: 600 }}>W</th>
                    <th style={{ textAlign: "center" as const, padding: "8px 6px", color: "var(--text-3)", fontWeight: 600 }}>L</th>
                    <th style={{ textAlign: "center" as const, padding: "8px 6px", color: "var(--text-3)", fontWeight: 600 }}>NRR</th>
                    <th style={{ textAlign: "center" as const, padding: "8px 8px", color: "var(--text-3)", fontWeight: 600 }}>PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((t: any, i: number) => {
                    const color = IPL_COLORS[t.teamCode] || "var(--text-3)";
                    const isTop4 = i < 4;
                    const isSelected = teamFilter === t.teamCode;
                    return (
                      <tr key={t.teamCode}
                        onClick={() => setTeamFilter(isSelected ? null : t.teamCode)}
                        style={{ borderBottom: "1px solid var(--border)", cursor: "pointer", background: isSelected ? color + "14" : "transparent", transition: "background 0.15s" }}>
                        <td style={{ padding: "8px 12px", color: isTop4 ? "#22c55e" : "var(--text-3)", fontWeight: 700 }}>{i + 1}</td>
                        <td style={{ padding: "8px 8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 2, height: 18, borderRadius: 2, background: color, flexShrink: 0 }} />
                            {t.teamLogo && <img src={t.teamLogo} alt={t.teamCode} style={{ width: 18, height: 18, objectFit: "contain" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                            <span style={{ fontWeight: 600, color: "var(--text)", fontSize: "0.7rem" }}>{t.teamCode}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: "center" as const, padding: "8px 6px", color: "var(--text-2)" }}>{t.matches}</td>
                        <td style={{ textAlign: "center" as const, padding: "8px 6px", color: "#22c55e", fontWeight: 600 }}>{t.won}</td>
                        <td style={{ textAlign: "center" as const, padding: "8px 6px", color: "var(--red)" }}>{t.lost}</td>
                        <td style={{ textAlign: "center" as const, padding: "8px 6px", color: t.nrr >= 0 ? "#22c55e" : "var(--red)", fontSize: "0.65rem" }}>
                          {t.nrr >= 0 ? "+" : ""}{t.nrr.toFixed(3)}
                        </td>
                        <td style={{ textAlign: "center" as const, padding: "8px 8px", fontSize: "0.95rem", fontWeight: 700, color: color }}>{t.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "6px 12px", fontSize: "0.6rem", color: "var(--text-3)", borderTop: "1px solid var(--border)" }}>Top 4 qualify for playoffs</div>
          </div>
        )}

        {/* Team filter chip */}
        {teamFilter && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 20, background: (IPL_COLORS[teamFilter] || "#888") + "18", border: `1px solid ${IPL_COLORS[teamFilter] || "#888"}44`, fontSize: "0.68rem", fontWeight: 600, color: IPL_COLORS[teamFilter] || "var(--text)" }}>
              {teamFilter} matches
              <button onClick={() => setTeamFilter(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginLeft: 2, lineHeight: 1, color: "inherit", opacity: 0.6, fontSize: "0.75rem" }}>✕</button>
            </div>
          </div>
        )}

        {/* Filter bar */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {(["live", "upcoming", "completed", "all"] as const).map(f => {
            const count = f === "live" ? live.length : f === "upcoming" ? upcoming.length : f === "completed" ? completed.length : liveMatches.length;
            const isActive = activeFilter === f;
            return (
              <button key={f} onClick={() => setMatchFilter(f)}
                style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: "1px solid", fontSize: "0.65rem", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" as const,
                  background: isActive ? "var(--surface-2)" : "transparent",
                  borderColor: isActive ? "var(--border-2)" : "var(--border)",
                  color: isActive ? (f === "live" ? "#22c55e" : f === "upcoming" ? "var(--blue)" : "var(--text)") : "var(--text-3)" }}>
                {f}<br />
                <span style={{ fontSize: "0.6rem", opacity: 0.7 }}>{count}</span>
              </button>
            );
          })}
        </div>

        {apiError && <div className="notice" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)", color: "#f87171", marginBottom: 12 }}>{apiError}</div>}
        {filteredMatches.length === 0 && (
          <div style={{ textAlign: "center" as const, color: "var(--text-3)", fontSize: "0.78rem", padding: "32px 0" }}>
            {teamFilter ? `No ${activeFilter === "all" ? "" : activeFilter + " "}matches for ${teamFilter}` : activeFilter === "live" ? "No live matches right now" : activeFilter === "upcoming" ? "No upcoming matches" : "No matches"}
          </div>
        )}
        {Object.entries(filteredGrouped).map(([date, matches]: [string, any[]]) => (
          <div key={date}>
            <div style={{ fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", margin: "16px 0 8px", fontWeight: 600 }}>
              {fmtDate(date)}
            </div>
            {matches.map((m: any) => {
              const isLive = m.matchStarted && !m.matchEnded;
              const isDone = m.matchEnded;
              const isExpanded = expandedMatchId === String(m.id);
              const statusColor = isDone ? "var(--text-3)" : isLive ? "var(--live)" : "var(--blue)";
              const statusLabel = isDone ? "Completed" : isLive ? "Live" : fmtTime(m.dateTimeGMT);
              const mNum = getMatchNum(m.name);
              const teams = m.teamInfo || [];
              const matchIdStr = String(m.id);
              const sc = scorecards[matchIdStr];
              const isLoadingSc = scorecardLoading === matchIdStr;

              return (
                <div key={m.id} className="match-card" style={{ cursor: "pointer" }}
                  onClick={() => toggleMatch(String(m.id), isDone || isLive)}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div className="match-status" style={{ color: statusColor }}>
                      {statusLabel}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {mNum && <div style={{ fontSize: "0.7rem", color: "var(--text-3)", fontWeight: 600 }}>{mNum}</div>}
                      {(isDone || isLive) && <span style={{ fontSize: "0.6rem", color: "var(--text-3)" }}>{isExpanded ? "▲" : "▼"}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    {teams.length > 0 ? teams.map((ti: any, i: number) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        {i === 1 && <span style={{ color: "var(--text-3)", fontSize: "0.6rem", margin: "0 2px" }}>vs</span>}
                        <img src={ti.img} alt={ti.shortname} style={{ width: 18, height: 18, objectFit: "contain" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text)" }}>{ti.shortname}</span>
                      </div>
                    )) : (
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text)" }}>{(m.name || "").replace(/,\s*\d+(?:st|nd|rd|th) Match.*/i, "")}</div>
                    )}
                  </div>
                  {(m.score || []).map((s: any, i: number) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-2)", padding: "3px 0", borderTop: i === 0 ? "1px solid var(--border)" : "none" }}>
                      <span style={{ color: "var(--text-3)" }}>{(s.inning || "").replace(" Innings", "").replace(" Inning", "")}</span>
                      <span style={{ fontWeight: 600, color: "var(--text-2)" }}>
                        {s.summary || (s.r != null ? `${s.r}/${s.w} (${s.o}ov)` : "")}
                      </span>
                    </div>
                  ))}
                  {isDone && m.status && <div style={{ fontSize: "0.68rem", color: "var(--blue)", marginTop: 5 }}>{m.status}</div>}
                  {m.venue && <div className="match-venue">{m.venue}</div>}

                  {isExpanded && (
                    <div style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 12 }}
                      onClick={e => e.stopPropagation()}>
                      {isLoadingSc && <div style={{ color: "var(--text-3)", fontSize: "0.72rem", padding: "8px 0" }}>Loading scorecard...</div>}
                      {sc?.overview && (
                        <div style={{ display: "flex", flexDirection: "column" as const, gap: 4, marginBottom: 12 }}>
                          {sc.overview.toss && <div style={{ fontSize: "0.65rem", color: "var(--text-3)" }}>{sc.overview.toss}</div>}
                          {sc.overview.result && <div style={{ fontSize: "0.68rem", color: "var(--text-2)", fontWeight: 500 }}>{sc.overview.result}</div>}
                        </div>
                      )}
                      {sc && !sc.hasScorecard && (
                        <div style={{ color: "var(--text-3)", fontSize: "0.72rem", padding: "4px 0" }}>
                          Scorecard will appear once innings data is synced.
                        </div>
                      )}
                      {(sc?.innings || []).map((inn: any, idx: number) => (
                        <div key={idx} style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--text-2)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 8 }}>
                            {inn.name} · <span style={{ color: "var(--text)" }}>{inn.total}</span>
                          </div>
                          {inn.batting?.length > 0 && (
                            <div style={{ overflowX: "auto" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: "0.68rem" }}>
                                <thead>
                                  <tr style={{ color: "var(--text-3)", borderBottom: "1px solid var(--border)" }}>
                                    <th style={{ textAlign: "left" as const, padding: "4px 0", fontWeight: 600 }}>Batter</th>
                                    <th style={{ textAlign: "right" as const, padding: "4px 4px", fontWeight: 600 }}>R</th>
                                    <th style={{ textAlign: "right" as const, padding: "4px 4px", fontWeight: 600 }}>B</th>
                                    <th style={{ textAlign: "right" as const, padding: "4px 4px", fontWeight: 600 }}>4s</th>
                                    <th style={{ textAlign: "right" as const, padding: "4px 4px", fontWeight: 600 }}>6s</th>
                                    <th style={{ textAlign: "right" as const, padding: "4px 4px", fontWeight: 600 }}>SR</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {inn.batting.filter((b: any) => !b.dnb).map((b: any, bi: number) => (
                                    <tr key={bi} style={{ borderBottom: "1px solid var(--border)" }}>
                                      <td style={{ padding: "5px 0" }}>
                                        <div style={{ color: b.notOut ? "#22c55e" : "var(--text)" }}>{b.name}</div>
                                        <div style={{ color: "var(--text-3)", fontSize: "0.58rem" }}>{b.dismissal}</div>
                                      </td>
                                      <td style={{ textAlign: "right" as const, padding: "5px 4px", color: "var(--text)", fontWeight: 700 }}>{b.runs}</td>
                                      <td style={{ textAlign: "right" as const, padding: "5px 4px", color: "var(--text-3)" }}>{b.balls}</td>
                                      <td style={{ textAlign: "right" as const, padding: "5px 4px", color: "var(--blue)" }}>{b.fours}</td>
                                      <td style={{ textAlign: "right" as const, padding: "5px 4px", color: "#a855f7" }}>{b.sixes}</td>
                                      <td style={{ textAlign: "right" as const, padding: "5px 4px", color: "var(--text-3)" }}>{parseFloat(b.sr).toFixed(1)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                          {inn.bowling?.length > 0 && (
                            <div style={{ marginTop: 10, overflowX: "auto" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: "0.68rem" }}>
                                <thead>
                                  <tr style={{ color: "var(--text-3)", borderBottom: "1px solid var(--border)" }}>
                                    <th style={{ textAlign: "left" as const, padding: "4px 0", fontWeight: 600 }}>Bowler</th>
                                    <th style={{ textAlign: "right" as const, padding: "4px 4px", fontWeight: 600 }}>O</th>
                                    <th style={{ textAlign: "right" as const, padding: "4px 4px", fontWeight: 600 }}>M</th>
                                    <th style={{ textAlign: "right" as const, padding: "4px 4px", fontWeight: 600 }}>R</th>
                                    <th style={{ textAlign: "right" as const, padding: "4px 4px", fontWeight: 600 }}>W</th>
                                    <th style={{ textAlign: "right" as const, padding: "4px 4px", fontWeight: 600 }}>ECO</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {inn.bowling.map((b: any, bi: number) => (
                                    <tr key={bi} style={{ borderBottom: "1px solid var(--border)" }}>
                                      <td style={{ padding: "5px 0", color: "var(--text)" }}>{b.name}</td>
                                      <td style={{ textAlign: "right" as const, padding: "5px 4px", color: "var(--text-3)" }}>{b.overs}</td>
                                      <td style={{ textAlign: "right" as const, padding: "5px 4px", color: "var(--text-3)" }}>{b.maidens}</td>
                                      <td style={{ textAlign: "right" as const, padding: "5px 4px", color: "var(--text-3)" }}>{b.runs}</td>
                                      <td style={{ textAlign: "right" as const, padding: "5px 4px", color: "#22c55e", fontWeight: 700 }}>{b.wickets}</td>
                                      <td style={{ textAlign: "right" as const, padding: "5px 4px", color: "var(--text-3)" }}>{parseFloat(b.eco).toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const STAT_CATS = [
    { id: "orangeCap", label: "Orange Cap", sub: "Most Runs" },
    { id: "purpleCap", label: "Purple Cap", sub: "Most Wickets" },
    { id: "sixesLeader", label: "Sixes", sub: "Most Sixes" },
    { id: "foursLeader", label: "Fours", sub: "Most Fours" },
    { id: "srLeader", label: "Strike Rate", sub: "Min 10 balls" },
    { id: "ecoLeader", label: "Economy", sub: "Min 2 overs" },
  ] as const;

  const renderStatRow = (entry: any, i: number, cat: string) => {
    const isBat = ["orangeCap", "sixesLeader", "foursLeader", "srLeader"].includes(cat);
    const rankColors = ["#d4a843", "var(--text-2)", "var(--text-2)"];
    const statColor = i === 0 ? "#d4a843" : i < 3 ? "var(--text)" : "var(--blue)";
    return (
      <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ width: 18, textAlign: "center" as const, fontSize: "0.68rem", fontWeight: 700, color: i < 3 ? rankColors[i] : "var(--text-3)", flexShrink: 0 }}>{i + 1}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.82rem", fontWeight: 500, color: entry.isFantasy ? "var(--text)" : "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
            {entry.name}
            {entry.isFantasy && <span style={{ marginLeft: 6, fontSize: "0.55rem", background: "rgba(34,197,94,0.12)", color: "#22c55e", borderRadius: 4, padding: "1px 5px", verticalAlign: "middle" }}>F</span>}
          </div>
          {isBat ? (
            <div style={{ fontSize: "0.62rem", color: "var(--text-3)", marginTop: 1 }}>
              {cat === "orangeCap" && `HS: ${entry.hs} · SR: ${entry.sr} · ${entry.innings} inn`}
              {cat === "sixesLeader" && `Runs: ${entry.runs} · SR: ${entry.sr}`}
              {cat === "foursLeader" && `Runs: ${entry.runs} · SR: ${entry.sr}`}
              {cat === "srLeader" && `${entry.runs} off ${entry.balls}b · ${entry.innings} inn`}
            </div>
          ) : (
            <div style={{ fontSize: "0.62rem", color: "var(--text-3)", marginTop: 1 }}>
              {cat === "purpleCap" && `Best: ${entry.best} · Eco: ${entry.eco} · ${entry.innings} inn`}
              {cat === "ecoLeader" && `${entry.wickets}W · ${entry.overs} ov`}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
          <div style={{ fontSize: "1.3rem", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1, color: statColor }}>
            {cat === "orangeCap" && entry.runs}
            {cat === "purpleCap" && entry.wickets}
            {cat === "sixesLeader" && entry.sixes}
            {cat === "foursLeader" && entry.fours}
            {cat === "srLeader" && entry.sr}
            {cat === "ecoLeader" && entry.eco}
          </div>
          <div style={{ fontSize: "0.55rem", color: "var(--text-3)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginTop: 2 }}>
            {cat === "orangeCap" && "runs"}
            {cat === "purpleCap" && "wkts"}
            {cat === "sixesLeader" && "sixes"}
            {cat === "foursLeader" && "fours"}
            {cat === "srLeader" && "sr"}
            {cat === "ecoLeader" && "eco"}
          </div>
        </div>
      </div>
    );
  };

  const renderStats = () => {
    const cat = statsCategory;
    const raw: any[] = iplStats?.[cat] || [];
    const entries = statsFilter === "fantasy" ? raw.filter((e: any) => e.isFantasy) : raw;

    return (
      <div>
        <div className="sec-title">IPL 2026 Stats</div>

        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {(["all", "fantasy"] as const).map(f => (
            <button key={f} onClick={() => { setStatsFilter(f); setStatsExpanded(false); }}
              style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: "1px solid", fontSize: "0.68rem", fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                background: statsFilter === f ? "var(--surface-2)" : "transparent",
                borderColor: statsFilter === f ? "var(--border-2)" : "var(--border)",
                color: statsFilter === f ? (f === "fantasy" ? "#22c55e" : "var(--text)") : "var(--text-3)" }}>
              {f === "all" ? "All IPL" : "Fantasy Only"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 12, marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16 }}>
          {STAT_CATS.map(c => (
            <button key={c.id} onClick={() => { setStatsCategory(c.id); setStatsExpanded(false); }} className={`stats-cat-btn ${statsCategory === c.id ? "active" : ""}`}>
              {c.label}
            </button>
          ))}
        </div>

        {!iplStats && statsLoading && (
          <div style={{ color: "var(--text-3)", fontSize: "0.78rem", textAlign: "center" as const, padding: "24px 0" }}>Loading stats...</div>
        )}
        {iplStats && entries.length === 0 && (
          <div style={{ color: "var(--text-3)", fontSize: "0.78rem", textAlign: "center" as const, padding: "24px 0" }}>
            {iplStats.matchesProcessed === 0 ? "Stats will appear once match innings data is synced." : `No ${statsFilter === "fantasy" ? "fantasy " : ""}players found.`}
          </div>
        )}
        {entries.length > 0 && (() => {
          const visible = statsExpanded ? entries : entries.slice(0, 10);
          const hasMore = entries.length > 10;
          return (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", marginBottom: 12 }}>
              <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text)" }}>
                  {STAT_CATS.find(c => c.id === cat)?.sub}
                </div>
                <div style={{ fontSize: "0.6rem", color: "var(--text-3)" }}>{iplStats.matchesProcessed} matches</div>
              </div>
              {visible.map((e: any, i: number) => renderStatRow(e, i, cat))}
              {hasMore && (
                <button onClick={() => setStatsExpanded(x => !x)}
                  style={{ width: "100%", padding: "11px 0", background: "transparent", border: "none", borderTop: "1px solid var(--border)", cursor: "pointer", fontSize: "0.68rem", color: "var(--text-3)", fontFamily: "inherit" }}>
                  {statsExpanded ? `Show less` : `Show all ${entries.length}`}
                </button>
              )}
            </div>
          );
        })()}

        {iplStats && (
          <div style={{ fontSize: "0.6rem", color: "var(--text-3)", textAlign: "center" as const, padding: "4px 0" }}>
            <span style={{ color: "#22c55e" }}>F</span> = in one of the 4 fantasy teams
          </div>
        )}
      </div>
    );
  };


  const renderAdmin = () => {
    const completedCount = liveMatches.filter((m: any) => m.matchEnded).length;
    const liveCount = liveMatches.filter((m: any) => m.matchStarted && !m.matchEnded).length;
    const scoredPlayerCount = Object.keys(playerPoints).length;
    const totalPts = Object.values(playerPoints).reduce((s, v) => s + v, 0);

    return (
      <div>
        <div className="sec-title">Admin</div>

        <div className="stat-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-val" style={{ color: "#22c55e" }}>{completedCount}</div>
            <div className="stat-lbl">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-val" style={{ color: "var(--live)" }}>{liveCount}</div>
            <div className="stat-lbl">Live now</div>
          </div>
          <div className="stat-card">
            <div className="stat-val" style={{ color: "#60a5fa" }}>{processedMatches.length}</div>
            <div className="stat-lbl">Scored</div>
          </div>
          <div className="stat-card">
            <div className="stat-val" style={{ color: "#a855f7" }}>{scoredPlayerCount}</div>
            <div className="stat-lbl">Players</div>
          </div>
        </div>

        <div style={{ background: "rgba(15,21,32,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" as const, color: "#94a3b8", marginBottom: 12 }}>
            🤖 Auto-Points Engine
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
              <span style={{ color: "#64748b" }}>IPL schedule</span>
              <span style={{ color: dataSources?.iplOfficial ? "#34d399" : "#475569" }}>
                {dataSources?.iplOfficial ? `✓ ${dataSources.iplOfficial} matches` : "Loading..."}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
              <span style={{ color: "#64748b" }}>Scorecards fetched</span>
              <span style={{ color: processedMatches.length > 0 ? "#34d399" : "#475569" }}>
                {processedMatches.length > 0 ? `✓ ${processedMatches.length} of ${completedCount}` : completedCount === 0 ? "No matches yet" : "Pending..."}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
              <span style={{ color: "#64748b" }}>AuctionRoom points engine</span>
              <span style={{ color: pointsUpdating ? "#f59e0b" : pointsError ? "#ef4444" : pendingMatches > 0 ? "#f59e0b" : "#34d399" }}>
                {pointsUpdating ? "⏳ Processing..." : pointsError ? `⚠ ${pointsError.slice(0, 40)}` : pendingMatches > 0 ? `⏳ ${pendingMatches} pending` : "✓ Active"}
              </span>
            </div>
            {dailyHits && (() => {
              const pct = dailyHits.count / dailyHits.limit;
              const barColor = pct >= 0.9 ? "#ef4444" : pct >= 0.7 ? "#f59e0b" : "#34d399";
              return (
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                    <span style={{ color: "#64748b" }}>CricAPI innings syncs today (UTC)</span>
                    <span style={{ color: barColor, fontWeight: 700 }}>{dailyHits.count} / {dailyHits.limit}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(pct * 100, 100)}%`, background: barColor, borderRadius: 2, transition: "width 0.4s" }} />
                  </div>
                  <div style={{ fontSize: "0.6rem", color: "#334155" }}>Hard cap at {dailyHits.limit} · Resets midnight UTC (5:30 AM IST)</div>
                </div>
              );
            })()}
            {nextAttempt && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                <span style={{ color: "#475569" }}>Rate limit — next attempt</span>
                <span style={{ color: "#f59e0b" }}>{new Date(nextAttempt).toLocaleTimeString()}</span>
              </div>
            )}
            {pointsLastUpdated && (
              <div style={{ fontSize: "0.65rem", color: "#334155" }}>
                Points last updated: {pointsLastUpdated.toLocaleTimeString()} · Auto-refreshes every 15 min
              </div>
            )}
          </div>
        </div>

        <div style={{ background: "rgba(15,21,32,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" as const, color: "#94a3b8", marginBottom: 12 }}>
            📊 Player Points Breakdown
          </div>
          {Object.keys(playerPoints).length === 0 ? (
            <div style={{ color: "#334155", fontSize: "0.8rem", padding: "8px 0" }}>
              {pointsLoading ? "⏳ Calculating points from scorecards..." : "Points will appear once matches complete and scorecards are processed."}
            </div>
          ) : (
            Object.entries(playerPoints).sort((a, b) => b[1] - a[1]).map(([name, pts]) => {
              const team = Object.values(FANTASY_TEAMS).find(t => t.players.some(p => p.name === name));
              return (
                <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: "0.78rem", color: "#cbd5e1" }}>{name}</span>
                    {team && <span style={{ fontSize: "0.62rem", color: "#475569", marginLeft: 6 }}>{team.name} · {team.owner}</span>}
                  </div>
                  <span style={{ fontFamily: "'Bebas Neue'", fontSize: "1.1rem", color: "#f97316", letterSpacing: "1px" }}>{pts}</span>
                </div>
              );
            })
          )}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
          <button className="btn-primary" onClick={() => { fetchLive(); fetchPoints(); }} disabled={liveLoading || pointsLoading}>
            {(liveLoading || pointsLoading) ? <span className="spinner" /> : "🔄"} Refresh All
          </button>
          <button className="btn-primary" style={{ background: "rgba(96,165,250,0.1)", borderColor: "rgba(96,165,250,0.3)", color: "#60a5fa" }}
            onClick={fetchPoints} disabled={pointsLoading}>
            {pointsLoading ? <span className="spinner" /> : "⚡"} Fetch Points
          </button>
          <button className="btn-danger" onClick={async () => {
            if (confirm("Reset all cached points? Points will re-sync from AuctionRoom.")) {
              await fetch("/api/ipl/points/reset", { method: "POST" });
              setPlayerPoints({});
              setProcessedMatches([]);
              setTimeout(fetchPoints, 500);
            }
          }}>🗑️ Reset Cache</button>
        </div>
        {lastUpdated && (
          <div style={{ fontSize: "0.65rem", color: "#334155", marginTop: 10 }}>
            Schedule last updated: {lastUpdated.toLocaleTimeString()} · Total points tracked: {totalPts}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {showToast && <div className="share-toast">✓ Copied to clipboard!</div>}
      <div className={`app${isDark ? "" : " light-mode"}`}>
        <div className="bg-field" />
        <div className="content">
          <div className="header">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="header-logo-ring">
                <div className="header-logo-inner">
                  <img
                    src={`${import.meta.env.BASE_URL}logo.jpeg`}
                    alt="Logo"
                    className="header-logo"
                  />
                </div>
              </div>
              <div className="header-title-row">
                <span className="header-title">IPL Fantasy</span>
                <span className="header-year">2026</span>
              </div>
            </div>
            <div className="header-right">
              <button
                className={`btn-dashboard ${tab === "admin" ? "active" : ""}`}
                onClick={() => setTab("admin")}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                Admin
              </button>
              <div className="live-pill">
                <div className="live-dot" />
                {liveLoading ? "Syncing" : "Live"}
              </div>
            </div>
          </div>

          {tab === "home" && renderHome()}
          {tab === "teams" && renderTeams()}
          {tab === "fixtures" && renderFixtures()}
          {tab === "stats" && renderStats()}
          {tab === "admin" && renderAdmin()}
        </div>

        <nav className="nav">
          {TABS.map(t => {
            const isActive = tab === t.id;
            return (
              <button key={t.id} className={`nav-btn ${isActive ? "active" : ""}`} onClick={() => setTab(t.id)}>
                <span className="nav-icon">{NAV_ICON[t.id]}</span>
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
