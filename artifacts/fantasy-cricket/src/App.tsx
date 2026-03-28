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
  const [playedMatches, setPlayedMatches] = useState<Record<string, boolean>>({});
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const pp = localStorage.getItem("f26pp");
      const pm = localStorage.getItem("f26pm");
      if (pp) setPlayerPoints(JSON.parse(pp));
      if (pm) setPlayedMatches(JSON.parse(pm));
    } catch (e) {}
  }, []);

  const persist = (pp: Record<string, number>, pm: Record<string, boolean>) => {
    try {
      localStorage.setItem("f26pp", JSON.stringify(pp));
      localStorage.setItem("f26pm", JSON.stringify(pm));
    } catch (e) {}
  };

  const [dataSources, setDataSources] = useState<{ iplOfficial: number; liveCount: number; competitionId?: number } | null>(null);

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
        setApiError("No IPL matches found from official sources. Season may not have started yet.");
      }
      setLastUpdated(new Date());
    } catch (e: any) {
      setApiError("Fetch failed: " + (e.message || "Unknown error"));
    }
    setLiveLoading(false);
  };

  useEffect(() => {
    fetchLive();
    const id = setInterval(fetchLive, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const teamScores = Object.keys(FANTASY_TEAMS)
    .map(id => ({ id, ...getTeamData(id, playerPoints), team: FANTASY_TEAMS[id] }))
    .sort((a, b) => b.total - a.total);

  const maxPts = teamScores[0]?.total || 1;

  const TABS = [
    { id: "home", label: "Home", icon: "🏆" },
    { id: "teams", label: "Teams", icon: "👤" },
    { id: "fixtures", label: "Matches", icon: "📡" },
    { id: "ipl", label: "IPL", icon: "🌐" },
    { id: "admin", label: "Admin", icon: "⚙️" },
  ];

  const rankLabel = (i: number) => i === 0 ? "first" : i === 1 ? "second" : i === 2 ? "third" : "";

  const renderHome = () => (
    <div>
      <div className="sec-title">Leaderboard</div>
      <div className="notice">
        🔄 Points auto-update every 5 min from live API. Season tracking is live!
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
              <div className="lb-pts-label">pts</div>
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
    </div>
  );

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
              const statusColor = isDone ? "#475569" : isLive ? "#34d399" : "#60a5fa";
              const statusLabel = isDone ? "COMPLETED" : isLive ? "LIVE" : "STARTS " + fmtTime(m.dateTimeGMT);
              const mNum = getMatchNum(m.name);
              const teams = m.teamInfo || [];
              return (
                <div key={m.id} className="match-card">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div className="match-status" style={{ color: statusColor, margin: 0, fontSize: "0.6rem" }}>
                      {isDone ? "✓ " : isLive ? "● " : "◷ "}{statusLabel}
                    </div>
                    {mNum && <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "0.82rem", color: "#334155", letterSpacing: "1px" }}>{mNum}</div>}
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
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderIPL = () => (
    <div>
      <div className="sec-title">IPL 2026 Teams</div>
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
    const totalPts = Object.values(playerPoints).reduce((s, v) => s + v, 0);

    const removePlayer = (name: string) => {
      const pp = { ...playerPoints };
      delete pp[name];
      setPlayerPoints(pp);
      persist(pp, playedMatches);
    };

    return (
      <div>
        <div className="sec-title">Admin</div>

        <div className="stat-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-val" style={{ color: "#60a5fa" }}>{liveMatches.length}</div>
            <div className="stat-lbl">Matches loaded</div>
          </div>
          <div className="stat-card">
            <div className="stat-val" style={{ color: "#f97316" }}>{liveMatches.filter((m: any) => m.matchStarted && !m.matchEnded).length}</div>
            <div className="stat-lbl">Live now</div>
          </div>
          <div className="stat-card">
            <div className="stat-val" style={{ color: "#34d399" }}>{liveMatches.filter((m: any) => m.matchEnded).length}</div>
            <div className="stat-lbl">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-val" style={{ color: "#a855f7" }}>{totalPts}</div>
            <div className="stat-lbl">Total pts</div>
          </div>
        </div>

        {dataSources && (
          <div style={{ background: "rgba(15,21,32,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" as const, color: "#94a3b8", marginBottom: 12 }}>
              📡 Data Sources
            </div>
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                <span style={{ color: "#64748b" }}>IPL Official Feed</span>
                <span style={{ color: dataSources.iplOfficial > 0 ? "#34d399" : "#475569" }}>
                  {dataSources.iplOfficial > 0 ? `✓ ${dataSources.iplOfficial} matches` : "No data"}
                  {dataSources.competitionId ? <span style={{ color: "#334155", marginLeft: 6, fontSize: "0.7rem" }}>CompID #{dataSources.competitionId}</span> : null}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                <span style={{ color: "#64748b" }}>Live match feed</span>
                <span style={{ color: dataSources.liveCount > 0 ? "#34d399" : "#475569" }}>
                  {dataSources.liveCount > 0 ? `✓ ${dataSources.liveCount} live` : "None active"}
                </span>
              </div>
            </div>
          </div>
        )}

        <div style={{ background: "rgba(15,21,32,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" as const, color: "#94a3b8", marginBottom: 12 }}>
            📊 Current Points
          </div>
          {Object.keys(playerPoints).length === 0 && (
            <div style={{ color: "#334155", fontSize: "0.8rem", padding: "8px 0" }}>No points yet. Points populate automatically as matches complete.</div>
          )}
          {Object.entries(playerPoints).sort((a, b) => b[1] - a[1]).map(([name, pts]) => (
            <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: "0.8rem", color: "#cbd5e1", flex: 1 }}>{name}</span>
              <span style={{ fontFamily: "'Bebas Neue'", fontSize: "1.1rem", color: "#f97316", letterSpacing: "1px", marginRight: 12 }}>{pts}</span>
              <button onClick={() => removePlayer(name)}
                style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "0.8rem", padding: "2px 6px", opacity: 0.5 }}>✕</button>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
          <button className="btn-primary" onClick={fetchLive} disabled={liveLoading}>
            {liveLoading ? <span className="spinner" /> : "🔄"} Refresh Data
          </button>
          <button className="btn-danger" onClick={() => {
            if (confirm("Reset ALL points? Cannot be undone.")) {
              setPlayerPoints({});
              setPlayedMatches({});
              try { localStorage.removeItem("f26pp"); localStorage.removeItem("f26pm"); } catch (e) {}
            }
          }}>🗑️ Reset Points</button>
        </div>
        {lastUpdated && (
          <div style={{ fontSize: "0.65rem", color: "#334155", marginTop: 10 }}>
            Last updated: {lastUpdated.toLocaleTimeString()} · Auto-refreshes every 5 min
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
