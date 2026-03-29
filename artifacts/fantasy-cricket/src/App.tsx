import { useState, useEffect } from "react";

const FANTASY_TEAMS: Record<string, {
  id: string; name: string; emoji: string; color: string;
  captain: string; vc: string;
  players: { name: string; role: string; ipl: string }[];
}> = {
  rajveer: {
    id: "rajveer", name: "Rajveer Puri", emoji: "🏏", color: "#f97316",
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
    id: "mombasa", name: "Mombasa K", emoji: "⚡", color: "#eab308",
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
    id: "mumbai", name: "Mumbai Ma", emoji: "🌊", color: "#3b82f6",
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
    id: "ponygoat", name: "PonyGoat", emoji: "🐐", color: "#10b981",
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

  useEffect(() => {
    fetchLive();
    fetchPoints();
    fetchStandings();
    fetchStats();
    const id1 = setInterval(fetchLive, 15 * 60 * 1000);
    const id2 = setInterval(fetchPoints, 15 * 60 * 1000);
    const id3 = setInterval(fetchStandings, 15 * 60 * 1000);
    const id4 = setInterval(fetchStats, 15 * 60 * 1000);
    return () => { clearInterval(id1); clearInterval(id2); clearInterval(id3); clearInterval(id4); };
  }, []);

  const teamScores = Object.keys(FANTASY_TEAMS)
    .map(id => ({ id, ...getTeamData(id, playerPoints), team: FANTASY_TEAMS[id] }))
    .sort((a, b) => b.total - a.total);

  const maxPts = teamScores[0]?.total || 1;

  const TABS = [
    { id: "home", label: "Home", icon: "🏆" },
    { id: "teams", label: "Teams", icon: "👤" },
    { id: "fixtures", label: "Matches", icon: "📡" },
    { id: "stats", label: "Stats", icon: "📊" },
    { id: "ipl", label: "IPL", icon: "🌐" },
    { id: "admin", label: "Admin", icon: "⚙️" },
  ];

  const rankLabel = (i: number) => i === 0 ? "first" : i === 1 ? "second" : i === 2 ? "third" : "";

  const computeAwards = () => {
    const hasData = Object.keys(playerPoints).length > 0;
    if (!hasData) return [];

    const awards: { trophy: string; title: string; winner: string; detail: string; color: string }[] = [];

    // All fantasy players with points
    const allFantasyPlayers = Object.values(FANTASY_TEAMS).flatMap(t =>
      t.players.map(p => ({ name: p.name, team: t.name, pts: playerPoints[p.name] || 0, isCap: p.name === t.captain, isVC: p.name === t.vc }))
    );

    // 1. Manager of the Season — leading team
    const leader = teamScores[0];
    if (leader.total > 0) {
      awards.push({ trophy: "🏆", title: "Manager of the Season", winner: leader.team.name, detail: `${leader.total} pts from Top 11`, color: leader.team.color });
    }

    // 2. Captain Marvel — best captain (raw pts, shown as captain-adjusted)
    const captains = Object.values(FANTASY_TEAMS).map(t => ({
      name: t.captain, team: t.name, pts: (playerPoints[t.captain] || 0) * 2
    })).sort((a, b) => b.pts - a.pts);
    if (captains[0].pts > 0) {
      awards.push({ trophy: "🎖️", title: "Captain Marvel", winner: captains[0].name, detail: `${captains[0].pts} adjusted pts · ${captains[0].team}`, color: "#f97316" });
    }

    // 3. Star Player — highest raw points across all fantasy players
    const star = allFantasyPlayers.sort((a, b) => b.pts - a.pts)[0];
    if (star.pts > 0) {
      awards.push({ trophy: "🌟", title: "Star Player", winner: star.name, detail: `${star.pts} pts · ${star.team}`, color: "#fbbf24" });
    }

    // 4. Hidden Gem — highest bench scorer (not in top 11 of their team)
    const benchAll = teamScores.flatMap(s =>
      s.players.filter(p => !s.top11.has(p.name) && p.raw > 0).map(p => ({ name: p.name, team: s.team.name, pts: p.raw }))
    ).sort((a, b) => b.pts - a.pts);
    if (benchAll.length > 0) {
      awards.push({ trophy: "💎", title: "Hidden Gem", winner: benchAll[0].name, detail: `${benchAll[0].pts} pts on the bench · ${benchAll[0].team}`, color: "#34d399" });
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
      name: t.vc, team: t.name, pts: Math.floor((playerPoints[t.vc] || 0) * 1.5)
    })).sort((a, b) => b.pts - a.pts);
    if (vcs[0].pts > 0) {
      awards.push({ trophy: "⭐", title: "Vice Captain Star", winner: vcs[0].name, detail: `${vcs[0].pts} adjusted pts · ${vcs[0].team}`, color: "#94a3b8" });
    }

    // 9. Wooden Spoon — last place team (only if season has data and not all zeros)
    const lastTeam = teamScores[teamScores.length - 1];
    if (teamScores.length === 4 && lastTeam.total < teamScores[0].total) {
      awards.push({ trophy: "🥄", title: "Wooden Spoon", winner: lastTeam.team.name, detail: `${lastTeam.total} pts · Room to improve!`, color: "#334155" });
    }

    return awards;
  };

  const renderHome = () => {
    const awards = computeAwards();
    return (
    <div>
      <div className="sec-title">Leaderboard</div>
      <div className="notice">
        🔄 Points auto-update every 15 min · Only Top 11 players count per team
      </div>
      {teamScores.map((s, i) => (
        <div key={s.id} className="lb-card" onClick={() => { setSelectedTeam(s.id); setTab("teams"); }}>
          <div className="lb-accent" style={{ background: s.team.color }} />
          <div className="lb-inner">
            <div className={`lb-rank ${rankLabel(i)}`}>{i + 1}</div>
            <div className="lb-emoji">{s.team.emoji}</div>
            <div className="lb-info">
              <div className="lb-name">{s.team.name}</div>
              <div className="lb-meta">C: {s.team.captain} · VC: {s.team.vc}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="lb-pts" style={{ color: s.team.color }}>{s.total}</div>
              <div className="lb-pts-label">top 11 pts</div>
            </div>
          </div>
          <div className="lb-bar">
            <div className="lb-bar-fill" style={{ width: `${(s.total / maxPts) * 100}%`, background: s.team.color }} />
          </div>
        </div>
      ))}

      {liveMatches.length > 0 && (() => {
        const recentOrLive = [
          ...liveMatches.filter((m: any) => m.matchStarted && !m.matchEnded),
          ...liveMatches.filter((m: any) => m.matchEnded),
        ].slice(0, 3);
        if (recentOrLive.length === 0) return null;
        return (
          <>
            <div className="divider" />
            <div className="sec-title">{liveMatches.filter((m: any) => m.matchStarted && !m.matchEnded).length > 0 ? "Live Now" : "Recent Results"}</div>
            {recentOrLive.map((m: any) => (
              <div key={m.id} className="match-card">
                <div className="match-status" style={{ color: m.matchEnded ? "#475569" : "#34d399" }}>
                  {m.matchEnded ? "✓ COMPLETED" : "● LIVE"}
                </div>
                <div className="match-name">{m.name}</div>
                {(m.score || []).map((s: any, i: number) => (
                  <div key={i} className="match-score">
                    <span style={{ color: "#64748b", fontSize: "0.68rem" }}>{(s.inning || "").replace(" Innings", "").replace(" Inning", "")} </span>
                    {s.summary || (s.r != null ? `${s.r}/${s.w} (${s.o} ov)` : "")}
                  </div>
                ))}
                {m.matchEnded && m.status && <div style={{ fontSize: "0.68rem", color: "#60a5fa", marginTop: 4 }}>{m.status}</div>}
                <div className="match-venue">{m.venue || ""}</div>
              </div>
            ))}
          </>
        );
      })()}

      {awards.length > 0 && (
        <>
          <div className="divider" />
          <div className="sec-title">🏅 Season Awards</div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 8, marginBottom: 8 }}>
            {awards.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(15,21,32,0.9)", border: `1px solid ${a.color}22`, borderLeft: `3px solid ${a.color}`, borderRadius: 12, padding: "10px 14px" }}>
                <div style={{ fontSize: "1.5rem", flexShrink: 0, lineHeight: 1 }}>{a.trophy}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.6rem", color: "#475569", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" as const, marginBottom: 2 }}>{a.title}</div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: a.color, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{a.winner}</div>
                  <div style={{ fontSize: "0.65rem", color: "#475569", marginTop: 1 }}>{a.detail}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: "0.6rem", color: "#334155", textAlign: "center" as const, paddingBottom: 8 }}>Awards update as the season progresses</div>
        </>
      )}
    </div>
    );
  };

  const renderTeams = () => {
    const t = FANTASY_TEAMS[selectedTeam];
    const td = getTeamData(selectedTeam, playerPoints);
    const roleCounts = td.players.reduce((acc: Record<string, number>, p) => {
      acc[p.role] = (acc[p.role] || 0) + 1;
      return acc;
    }, {});

    return (
      <div>
        <div className="team-tabs">
          {Object.values(FANTASY_TEAMS).map(ft => (
            <button key={ft.id} className={`team-tab ${selectedTeam === ft.id ? "active" : ""}`}
              style={selectedTeam === ft.id ? { color: ft.color, borderColor: ft.color } : {}}
              onClick={() => setSelectedTeam(ft.id)}>
              {ft.emoji} {ft.name}
            </button>
          ))}
        </div>

        <div className="team-header-card">
          <div className="team-big-emoji">{t.emoji}</div>
          <div style={{ flex: 1 }}>
            <div className="team-hname" style={{ color: t.color }}>{t.name}</div>
            <div className="team-roles">
              {Object.entries(roleCounts).map(([role, n]) => (
                <span key={role} className="role-badge"
                  style={{ color: ROLE_COLORS[role], borderColor: ROLE_COLORS[role] + "44", background: ROLE_COLORS[role] + "11" }}>
                  {ROLE_ICONS[role]} {n} {role}
                </span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="team-htotal" style={{ color: t.color }}>{td.total}</div>
            <div className="team-hlabel">total pts</div>
          </div>
        </div>

        <div className="top11-label">Playing XI (Top 11)</div>
        <div className="players-grid">
          {td.players.filter(p => td.top11.has(p.name)).map(p => (
            <div key={p.name} className={`player-card ${p.name === t.captain ? "is-c" : p.name === t.vc ? "is-vc" : ""}`}>
              <div className="playing-badge" />
              <div className="player-ipl-badge" style={{ background: IPL_COLORS[p.ipl] + "33", color: IPL_COLORS[p.ipl] }}>
                {p.ipl}
              </div>
              <div className="player-name">{p.name}</div>
              <div className="player-pts" style={{ color: p.adj > 0 ? t.color : "#475569" }}>{p.adj}</div>
              {p.name === t.captain && <div className="player-pts-raw">raw: {p.raw} × 2</div>}
              {p.name === t.vc && <div className="player-pts-raw">raw: {p.raw} × 1.5</div>}
            </div>
          ))}
        </div>

        <div className="top11-label" style={{ marginTop: 16 }}>Bench</div>
        <div className="players-grid">
          {td.players.filter(p => !td.top11.has(p.name)).map(p => (
            <div key={p.name} className="player-card benched">
              <div className="player-ipl-badge" style={{ background: IPL_COLORS[p.ipl] + "22", color: IPL_COLORS[p.ipl] + "88" }}>
                {p.ipl}
              </div>
              <div className="player-name" style={{ color: "#64748b" }}>{p.name}</div>
              <div className="player-pts" style={{ color: "#475569" }}>{p.adj}</div>
            </div>
          ))}
        </div>
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

    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div className="sec-title" style={{ margin: 0 }}>All IPL 2026</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
            {live.length > 0 && <span style={{ fontSize: "0.6rem", padding: "2px 7px", borderRadius: 20, background: "rgba(34,197,94,0.1)", color: "#34d399", border: "1px solid rgba(34,197,94,0.2)" }}>{live.length} live</span>}
            <span style={{ fontSize: "0.6rem", padding: "2px 7px", borderRadius: 20, background: "rgba(100,116,139,0.1)", color: "#64748b", border: "1px solid rgba(100,116,139,0.2)" }}>{completed.length} done</span>
            <span style={{ fontSize: "0.6rem", padding: "2px 7px", borderRadius: 20, background: "rgba(96,165,250,0.1)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.2)" }}>{upcoming.length} upcoming</span>
          </div>
        </div>
        <div style={{ color: "#475569", fontSize: "0.67rem", marginBottom: 14 }}>{liveMatches.length}/70 matches loaded</div>
        {apiError && <div className="notice" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)", color: "#f87171", marginBottom: 12 }}>{apiError}</div>}
        {liveMatches.length === 0 && !liveLoading && (
          <div className="empty-state"><div className="big">🏟️</div><p>No IPL matches found.<br />Try refreshing.</p></div>
        )}
        {Object.entries(grouped).map(([date, matches]) => (
          <div key={date}>
            <div style={{ fontSize: "0.63rem", letterSpacing: "2px", textTransform: "uppercase", color: "#475569", margin: "14px 0 8px", fontWeight: 600 }}>
              {fmtDate(date)} <span style={{ color: "#334155" }}>· {matches.length} match{matches.length !== 1 ? "es" : ""}</span>
            </div>
            {matches.map((m: any) => {
              const isLive = m.matchStarted && !m.matchEnded;
              const isDone = m.matchEnded;
              const isExpanded = expandedMatchId === String(m.id);
              const statusColor = isDone ? "#475569" : isLive ? "#34d399" : "#60a5fa";
              const statusLabel = isDone ? "COMPLETED" : isLive ? "LIVE" : "STARTS " + fmtTime(m.dateTimeGMT);
              const mNum = getMatchNum(m.name);
              const teams = m.teamInfo || [];
              const matchIdStr = String(m.id);
              const sc = scorecards[matchIdStr];
              const isLoadingSc = scorecardLoading === matchIdStr;

              return (
                <div key={m.id} className="match-card" style={{ cursor: "pointer" }}
                  onClick={() => toggleMatch(String(m.id), isDone || isLive)}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div className="match-status" style={{ color: statusColor, margin: 0, fontSize: "0.6rem" }}>
                      {isDone ? "✓ " : isLive ? "● " : "◷ "}{statusLabel}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {mNum && <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "0.82rem", color: "#334155", letterSpacing: "1px" }}>{mNum}</div>}
                      {(isDone || isLive) && <span style={{ fontSize: "0.6rem", color: "#475569" }}>{isExpanded ? "▲" : "▼"} scorecard</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    {teams.length > 0 ? teams.map((ti: any, i: number) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        {i === 1 && <span style={{ color: "#334155", fontSize: "0.62rem", fontWeight: 700, margin: "0 2px" }}>vs</span>}
                        <img src={ti.img} alt={ti.shortname} style={{ width: 20, height: 20, objectFit: "contain" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#e2e8f0" }}>{ti.shortname}</span>
                      </div>
                    )) : (
                      <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#e2e8f0" }}>{(m.name || "").replace(/,\s*\d+(?:st|nd|rd|th) Match.*/i, "")}</div>
                    )}
                  </div>
                  {(m.score || []).map((s: any, i: number) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#94a3b8", padding: "3px 0", borderTop: i === 0 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                      <span style={{ color: "#64748b" }}>{(s.inning || "").replace(" Innings", "").replace(" Inning", "")}</span>
                      <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "0.92rem", letterSpacing: "1px", color: "#cbd5e1" }}>
                        {s.summary || (s.r != null ? `${s.r}/${s.w} (${s.o}ov)` : "")}
                      </span>
                    </div>
                  ))}
                  {isDone && m.status && <div style={{ fontSize: "0.68rem", color: "#60a5fa", marginTop: 5 }}>{m.status}</div>}
                  {m.venue && <div className="match-venue">{m.venue}</div>}

                  {isExpanded && (
                    <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 12 }}
                      onClick={e => e.stopPropagation()}>
                      {isLoadingSc && <div style={{ color: "#475569", fontSize: "0.72rem", padding: "8px 0" }}>⏳ Loading scorecard...</div>}
                      {sc?.overview && (
                        <div style={{ display: "flex", flexDirection: "column" as const, gap: 3, marginBottom: 12 }}>
                          {sc.overview.toss && <div style={{ fontSize: "0.65rem", color: "#475569" }}>🪙 {sc.overview.toss}</div>}
                          {sc.overview.result && <div style={{ fontSize: "0.65rem", color: "#60a5fa" }}>🏆 {sc.overview.result}</div>}
                          {sc.overview.umpires && <div style={{ fontSize: "0.62rem", color: "#334155" }}>Umpires: {sc.overview.umpires}</div>}
                        </div>
                      )}
                      {sc && !sc.hasScorecard && (
                        <div style={{ color: "#475569", fontSize: "0.72rem", padding: "4px 0" }}>
                          Detailed scorecard will appear once fantasy points are processed via CricAPI.
                        </div>
                      )}
                      {(sc?.innings || []).map((inn: any, idx: number) => (
                        <div key={idx} style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#94a3b8", letterSpacing: "1px", textTransform: "uppercase" as const, marginBottom: 6 }}>
                            {inn.name} · <span style={{ color: "#f97316" }}>{inn.total}</span>
                          </div>
                          {inn.batting?.length > 0 && (
                            <div style={{ overflowX: "auto" }}>
                              <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: "0.68rem" }}>
                                <thead>
                                  <tr style={{ color: "#475569", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                    <th style={{ textAlign: "left" as const, padding: "3px 0", fontWeight: 600 }}>Batter</th>
                                    <th style={{ textAlign: "right" as const, padding: "3px 4px", fontWeight: 600 }}>R</th>
                                    <th style={{ textAlign: "right" as const, padding: "3px 4px", fontWeight: 600 }}>B</th>
                                    <th style={{ textAlign: "right" as const, padding: "3px 4px", fontWeight: 600 }}>4s</th>
                                    <th style={{ textAlign: "right" as const, padding: "3px 4px", fontWeight: 600 }}>6s</th>
                                    <th style={{ textAlign: "right" as const, padding: "3px 4px", fontWeight: 600 }}>SR</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {inn.batting.filter((b: any) => !b.dnb).map((b: any, bi: number) => (
                                    <tr key={bi} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                                      <td style={{ padding: "4px 0" }}>
                                        <div style={{ color: b.notOut ? "#34d399" : "#cbd5e1" }}>{b.name}</div>
                                        <div style={{ color: "#334155", fontSize: "0.6rem" }}>{b.dismissal}</div>
                                      </td>
                                      <td style={{ textAlign: "right" as const, padding: "4px 4px", color: "#f97316", fontFamily: "'Bebas Neue',sans-serif", fontSize: "0.9rem" }}>{b.runs}</td>
                                      <td style={{ textAlign: "right" as const, padding: "4px 4px", color: "#64748b" }}>{b.balls}</td>
                                      <td style={{ textAlign: "right" as const, padding: "4px 4px", color: "#60a5fa" }}>{b.fours}</td>
                                      <td style={{ textAlign: "right" as const, padding: "4px 4px", color: "#a855f7" }}>{b.sixes}</td>
                                      <td style={{ textAlign: "right" as const, padding: "4px 4px", color: "#64748b" }}>{parseFloat(b.sr).toFixed(1)}</td>
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
                                  <tr style={{ color: "#475569", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                                    <th style={{ textAlign: "left" as const, padding: "3px 0", fontWeight: 600 }}>Bowler</th>
                                    <th style={{ textAlign: "right" as const, padding: "3px 4px", fontWeight: 600 }}>O</th>
                                    <th style={{ textAlign: "right" as const, padding: "3px 4px", fontWeight: 600 }}>M</th>
                                    <th style={{ textAlign: "right" as const, padding: "3px 4px", fontWeight: 600 }}>R</th>
                                    <th style={{ textAlign: "right" as const, padding: "3px 4px", fontWeight: 600 }}>W</th>
                                    <th style={{ textAlign: "right" as const, padding: "3px 4px", fontWeight: 600 }}>ECO</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {inn.bowling.map((b: any, bi: number) => (
                                    <tr key={bi} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                                      <td style={{ padding: "4px 0", color: "#cbd5e1" }}>{b.name}</td>
                                      <td style={{ textAlign: "right" as const, padding: "4px 4px", color: "#64748b" }}>{b.overs}</td>
                                      <td style={{ textAlign: "right" as const, padding: "4px 4px", color: "#64748b" }}>{b.maidens}</td>
                                      <td style={{ textAlign: "right" as const, padding: "4px 4px", color: "#64748b" }}>{b.runs}</td>
                                      <td style={{ textAlign: "right" as const, padding: "4px 4px", color: "#34d399", fontFamily: "'Bebas Neue',sans-serif", fontSize: "0.9rem" }}>{b.wickets}</td>
                                      <td style={{ textAlign: "right" as const, padding: "4px 4px", color: "#64748b" }}>{parseFloat(b.eco).toFixed(2)}</td>
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
    { id: "orangeCap", label: "🟠 Orange Cap", sub: "Most Runs" },
    { id: "purpleCap", label: "🟣 Purple Cap", sub: "Most Wickets" },
    { id: "sixesLeader", label: "6️⃣ Sixes", sub: "Most Sixes" },
    { id: "foursLeader", label: "4️⃣ Fours", sub: "Most Fours" },
    { id: "srLeader", label: "⚡ Strike Rate", sub: "Min 10 balls" },
    { id: "ecoLeader", label: "💧 Economy", sub: "Min 2 overs" },
  ] as const;

  const renderStatRow = (entry: any, i: number, cat: string) => {
    const isBat = ["orangeCap", "sixesLeader", "foursLeader", "srLeader"].includes(cat);
    const fantasyColor = entry.isFantasy ? "#34d399" : "#cbd5e1";
    return (
      <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
        <div style={{ width: 22, textAlign: "center" as const, fontFamily: "'Bebas Neue',sans-serif", fontSize: "0.9rem", color: i < 3 ? ["#f97316","#94a3b8","#b45309"][i] : "#334155" }}>{i + 1}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 600, color: fantasyColor, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
            {entry.name}
            {entry.isFantasy && <span style={{ marginLeft: 5, fontSize: "0.55rem", background: "rgba(52,211,153,0.15)", color: "#34d399", borderRadius: 4, padding: "1px 4px", verticalAlign: "middle" }}>F</span>}
          </div>
          {isBat ? (
            <div style={{ fontSize: "0.6rem", color: "#475569" }}>
              {cat === "orangeCap" && `HS: ${entry.hs} · SR: ${entry.sr} · ${entry.innings} inn`}
              {cat === "sixesLeader" && `Runs: ${entry.runs} · SR: ${entry.sr}`}
              {cat === "foursLeader" && `Runs: ${entry.runs} · SR: ${entry.sr}`}
              {cat === "srLeader" && `Runs: ${entry.runs} off ${entry.balls}b · ${entry.innings} inn`}
            </div>
          ) : (
            <div style={{ fontSize: "0.6rem", color: "#475569" }}>
              {cat === "purpleCap" && `Best: ${entry.best} · Eco: ${entry.eco} · ${entry.innings} inn`}
              {cat === "ecoLeader" && `W: ${entry.wickets} · ${entry.overs} ov · Runs: ${entry.runs}`}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.4rem", letterSpacing: "1px", lineHeight: 1, color: i === 0 ? "#f97316" : i === 1 ? "#94a3b8" : i === 2 ? "#b45309" : "#60a5fa" }}>
            {cat === "orangeCap" && entry.runs}
            {cat === "purpleCap" && entry.wickets}
            {cat === "sixesLeader" && entry.sixes}
            {cat === "foursLeader" && entry.fours}
            {cat === "srLeader" && entry.sr}
            {cat === "ecoLeader" && entry.eco}
          </div>
          <div style={{ fontSize: "0.55rem", color: "#334155", textTransform: "uppercase" as const, letterSpacing: "1px" }}>
            {cat === "orangeCap" && "runs"}
            {cat === "purpleCap" && "wkts"}
            {cat === "sixesLeader" && "6s"}
            {cat === "foursLeader" && "4s"}
            {cat === "srLeader" && "SR"}
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
            <button key={f} onClick={() => setStatsFilter(f)}
              style={{ flex: 1, padding: "7px 0", borderRadius: 10, border: "1px solid", fontSize: "0.68rem", fontWeight: 700, cursor: "pointer", letterSpacing: "1px",
                background: statsFilter === f ? (f === "fantasy" ? "rgba(52,211,153,0.15)" : "rgba(248,250,252,0.07)") : "transparent",
                borderColor: statsFilter === f ? (f === "fantasy" ? "#34d399" : "#475569") : "rgba(255,255,255,0.06)",
                color: statsFilter === f ? (f === "fantasy" ? "#34d399" : "#e2e8f0") : "#475569" }}>
              {f === "all" ? "All IPL" : "Fantasy Only"}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 12 }}>
          {STAT_CATS.map(c => (
            <button key={c.id} onClick={() => setStatsCategory(c.id)}
              style={{ flexShrink: 0, padding: "7px 12px", borderRadius: 10, border: "1px solid", fontSize: "0.65rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" as const,
                background: statsCategory === c.id ? "rgba(249,115,22,0.15)" : "transparent",
                borderColor: statsCategory === c.id ? "#f97316" : "rgba(255,255,255,0.06)",
                color: statsCategory === c.id ? "#f97316" : "#475569" }}>
              {c.label}
            </button>
          ))}
        </div>

        {!iplStats && statsLoading && (
          <div style={{ color: "#475569", fontSize: "0.78rem", textAlign: "center" as const, padding: "24px 0" }}>⏳ Loading stats...</div>
        )}
        {iplStats && entries.length === 0 && (
          <div style={{ color: "#334155", fontSize: "0.78rem", textAlign: "center" as const, padding: "24px 0" }}>
            {iplStats.matchesProcessed === 0 ? "Stats will appear once match scorecards are processed via CricAPI." : `No ${statsFilter === "fantasy" ? "fantasy " : ""}players found for this category.`}
          </div>
        )}
        {entries.length > 0 && (
          <div style={{ background: "rgba(15,21,32,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden", marginBottom: 12 }}>
            <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1rem", letterSpacing: "2px", color: "#e2e8f0" }}>
                {STAT_CATS.find(c => c.id === cat)?.sub}
              </div>
              <div style={{ fontSize: "0.6rem", color: "#334155" }}>{iplStats.matchesProcessed} match{iplStats.matchesProcessed !== 1 ? "es" : ""} processed</div>
            </div>
            {entries.slice(0, 20).map((e: any, i: number) => renderStatRow(e, i, cat))}
          </div>
        )}

        {iplStats && (
          <div style={{ fontSize: "0.6rem", color: "#334155", textAlign: "center" as const, padding: "4px 0" }}>
            <span style={{ color: "#34d399" }}>F</span> = in one of the 4 fantasy teams · Data from processed scorecards
          </div>
        )}
      </div>
    );
  };

  const renderIPL = () => (
    <div>
      <div className="sec-title">IPL 2026 Points Table</div>
      {standingsLoading && standings.length === 0 && (
        <div style={{ color: "#475569", fontSize: "0.78rem", padding: "8px 0" }}>⏳ Loading standings...</div>
      )}
      {standings.length > 0 && (
        <div style={{ background: "rgba(15,21,32,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: "0.7rem" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <th style={{ textAlign: "left" as const, padding: "10px 12px", color: "#475569", fontWeight: 600, letterSpacing: "1px" }}>#</th>
                  <th style={{ textAlign: "left" as const, padding: "10px 8px", color: "#475569", fontWeight: 600, letterSpacing: "1px" }}>TEAM</th>
                  <th style={{ textAlign: "center" as const, padding: "10px 6px", color: "#475569", fontWeight: 600 }}>P</th>
                  <th style={{ textAlign: "center" as const, padding: "10px 6px", color: "#475569", fontWeight: 600 }}>W</th>
                  <th style={{ textAlign: "center" as const, padding: "10px 6px", color: "#475569", fontWeight: 600 }}>L</th>
                  <th style={{ textAlign: "center" as const, padding: "10px 6px", color: "#475569", fontWeight: 600 }}>NR</th>
                  <th style={{ textAlign: "center" as const, padding: "10px 6px", color: "#475569", fontWeight: 600 }}>NRR</th>
                  <th style={{ textAlign: "center" as const, padding: "10px 8px", color: "#475569", fontWeight: 600 }}>PTS</th>
                  <th style={{ textAlign: "center" as const, padding: "10px 8px", color: "#475569", fontWeight: 600 }}>FORM</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((t: any, i: number) => {
                  const color = IPL_COLORS[t.teamCode] || "#475569";
                  const isTop4 = i < 4;
                  return (
                    <tr key={t.teamCode} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: isTop4 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                      <td style={{ padding: "10px 12px", color: isTop4 ? "#34d399" : "#475569", fontWeight: 700 }}>{i + 1}</td>
                      <td style={{ padding: "10px 8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <div style={{ width: 3, height: 24, borderRadius: 2, background: color, flexShrink: 0 }} />
                          {t.teamLogo && <img src={t.teamLogo} alt={t.teamCode} style={{ width: 22, height: 22, objectFit: "contain" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                          <div>
                            <div style={{ fontWeight: 700, color: "#e2e8f0", fontSize: "0.72rem" }}>{t.teamCode}</div>
                            <div style={{ color: "#475569", fontSize: "0.58rem" }}>{t.for || ""}  {t.against ? `vs ${t.against}` : ""}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: "center" as const, padding: "10px 6px", color: "#94a3b8" }}>{t.matches}</td>
                      <td style={{ textAlign: "center" as const, padding: "10px 6px", color: "#34d399", fontWeight: 600 }}>{t.won}</td>
                      <td style={{ textAlign: "center" as const, padding: "10px 6px", color: "#f87171" }}>{t.lost}</td>
                      <td style={{ textAlign: "center" as const, padding: "10px 6px", color: "#64748b" }}>{t.noResult}</td>
                      <td style={{ textAlign: "center" as const, padding: "10px 6px", color: t.nrr >= 0 ? "#34d399" : "#f87171", fontSize: "0.68rem" }}>
                        {t.nrr >= 0 ? "+" : ""}{t.nrr.toFixed(3)}
                      </td>
                      <td style={{ textAlign: "center" as const, padding: "10px 8px", fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.1rem", color: color, letterSpacing: "1px" }}>{t.points}</td>
                      <td style={{ textAlign: "center" as const, padding: "10px 8px" }}>
                        {(t.form || "").split("").map((f: string, fi: number) => (
                          <span key={fi} style={{ display: "inline-block", width: 14, height: 14, borderRadius: "50%", background: f === "W" ? "#34d399" : f === "L" ? "#ef4444" : "#475569", margin: "0 1px", fontSize: "0.5rem", lineHeight: "14px", color: "#fff", textAlign: "center" as const }}>{f}</span>
                        ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {standings.length > 0 && (
            <div style={{ padding: "6px 12px", fontSize: "0.6rem", color: "#334155", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              Top 4 qualify for playoffs · Source: IPL official feed
            </div>
          )}
        </div>
      )}

      <div className="sec-title" style={{ marginTop: 8 }}>IPL 2026 Teams</div>
      {Object.entries(IPL_COLORS).map(([code, color]) => {
        const allPlayers = Object.values(FANTASY_TEAMS).flatMap(t => t.players.filter(p => p.ipl === code));
        return (
          <div key={code} className="ipl-row">
            <div className="ipl-team-dot" style={{ background: color }} />
            <span className="ipl-code">{code}</span>
            <span className="ipl-team-name">{IPL_FULL_NAMES[code]}</span>
            <span style={{ fontSize: "0.7rem", color: "#475569" }}>{allPlayers.length} picked</span>
          </div>
        );
      })}
    </div>
  );

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
            <div className="stat-val" style={{ color: "#34d399" }}>{completedCount}</div>
            <div className="stat-lbl">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-val" style={{ color: "#f97316" }}>{liveCount}</div>
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
              <span style={{ color: "#64748b" }}>CricAPI points engine</span>
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
                    <span style={{ color: "#64748b" }}>CricAPI calls today (UTC)</span>
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
                    {team && <span style={{ fontSize: "0.62rem", color: "#475569", marginLeft: 6 }}>{team.name}</span>}
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
            if (confirm("Reset all cached points? Points will re-fetch from CricAPI.")) {
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
      <div className="app">
        <div className="bg-field" />
        <div className="content">
          <div className="header">
            <div>
              <div className="header-title">🏏 IPL Fantasy</div>
              <div className="header-sub">2026 Season</div>
            </div>
            <div className="header-right">
              <div className="live-pill">
                <div className="live-dot" />
                {liveLoading ? "SYNCING" : "LIVE"}
              </div>
              <div className="updated-text">
                {lastUpdated ? lastUpdated.toLocaleTimeString() : "—"}
              </div>
            </div>
          </div>

          {tab === "home" && renderHome()}
          {tab === "teams" && renderTeams()}
          {tab === "fixtures" && renderFixtures()}
          {tab === "stats" && renderStats()}
          {tab === "ipl" && renderIPL()}
          {tab === "admin" && renderAdmin()}
        </div>

        <nav className="nav">
          {TABS.map(t => (
            <button key={t.id} className={`nav-btn ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              <span className="nav-icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
