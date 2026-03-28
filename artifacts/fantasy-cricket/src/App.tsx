import { useState, useEffect } from "react";

const API_KEY = "e7ef2ab6-e836-4532-bf1e-9e2e26719376";

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

function calcPoints(p: PlayerStats): number {
  if (!p.played) return 0;
  let pts = 4;
  const r = p.runs || 0, balls = p.balls || 0;
  pts += r + (p.fours || 0) * 4 + (p.sixes || 0) * 8;
  if (p.duck) pts -= 2;
  if (r >= 100) pts += 16; else if (r >= 75) pts += 12; else if (r >= 50) pts += 8; else if (r >= 25) pts += 4;
  if (balls >= 10 || r >= 20) {
    const sr = (r / balls) * 100;
    if (sr > 190) pts += 8; else if (sr > 170) pts += 6; else if (sr > 150) pts += 4; else if (sr > 130) pts += 2;
    else if (sr >= 70 && sr <= 100) pts -= 2; else if (sr >= 60 && sr < 70) pts -= 4; else if (sr >= 50 && sr < 60) pts -= 6;
  }
  const w = p.wickets || 0;
  pts += (p.dots || 0) * 2 + w * 30 + (p.lbwBowled || 0) * 8 + (p.maidens || 0) * 12;
  if (w >= 5) pts += 16; else if (w >= 4) pts += 12; else if (w >= 3) pts += 8;
  const overs = (p.ballsBowled || 0) / 6;
  if (overs >= 2) {
    const eco = (p.runsConceded || 0) / overs;
    if (eco < 5) pts += 8; else if (eco < 6) pts += 6; else if (eco <= 7) pts += 4; else if (eco <= 8) pts += 2;
    else if (eco >= 10 && eco <= 11) pts -= 2; else if (eco > 11 && eco <= 12) pts -= 4; else if (eco > 12) pts -= 6;
  }
  const c = p.catches || 0;
  pts += c * 8 + (c >= 3 ? 4 : 0) + (p.runOuts || 0) * 10 + (p.stumpings || 0) * 12;
  return pts;
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

const defaultStats: PlayerStats = {
  played: true, runs: 0, balls: 0, fours: 0, sixes: 0, duck: false,
  wickets: 0, dots: 0, lbwBowled: 0, maidens: 0, ballsBowled: 0, runsConceded: 0,
  catches: 0, runOuts: 0, stumpings: 0
};

export default function App() {
  const [tab, setTab] = useState("home");
  const [selectedTeam, setSelectedTeam] = useState("rajveer");
  const [playerPoints, setPlayerPoints] = useState<Record<string, number>>({});
  const [playedMatches, setPlayedMatches] = useState<Record<string, boolean>>({});
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [entryPlayer, setEntryPlayer] = useState("");
  const [entryStats, setEntryStats] = useState<PlayerStats>({ ...defaultStats });
  const [entryPreview, setEntryPreview] = useState<number | null>(null);
  const [savedMsg, setSavedMsg] = useState("");

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

  const IPL_SERIES_ID = "87c62aac-bc3c-4738-ab93-19da0690488f";
  const IPL_KEYWORDS = ["IPL", "Indian Premier", "Chennai Super Kings", "Mumbai Indians", "Royal Challengers", "Kolkata Knight Riders", "Punjab Kings", "Gujarat Titans", "Rajasthan Royals", "Sunrisers", "Lucknow Super Giants", "Delhi Capitals"];

  const isIPL = (m: any) =>
    (m.series_id === IPL_SERIES_ID) ||
    IPL_KEYWORDS.some(k => (m.name || "").includes(k) || (m.teams || []).some((t: string) => t.includes(k)));

  const fetchLive = async () => {
    if (liveLoading) return;
    setLiveLoading(true);
    setApiError(null);
    try {
      const [res1, res2] = await Promise.all([
        fetch(`https://api.cricapi.com/v1/currentMatches?apikey=${API_KEY}&offset=0`),
        fetch(`https://api.cricapi.com/v1/matches?apikey=${API_KEY}&offset=0`)
      ]);

      const [data1, data2] = await Promise.all([res1.json(), res2.json()]);

      const currentData = data1?.data || [];
      const matchesData = data2?.data || [];

      const allRaw = [...currentData, ...matchesData];
      const seen = new Set<string>();
      const allMatches = allRaw.filter((m: any) => {
        if (!m?.id || seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });

      const ipl = allMatches.filter(isIPL).sort((a: any, b: any) => {
        if (a.matchStarted && !a.matchEnded && !(b.matchStarted && !b.matchEnded)) return -1;
        if (b.matchStarted && !b.matchEnded && !(a.matchStarted && !a.matchEnded)) return 1;
        return new Date(a.dateTimeGMT).getTime() - new Date(b.dateTimeGMT).getTime();
      });

      if (ipl.length > 0) {
        setLiveMatches(ipl);
      } else if (allMatches.length > 0) {
        setLiveMatches(allMatches.slice(0, 25));
        setApiError("No IPL matches filtered — showing all matches");
      } else {
        setApiError("API returned no data. Check API key limits.");
      }

      setLastUpdated(new Date());

      const pp = { ...playerPoints };
      const pm = { ...playedMatches };
      ipl.forEach((m: any) => {
        if (m.matchEnded && !pm[m.id] && (m.score || []).length > 0) {
          m.score.forEach((s: any) => {
            (s.players || []).forEach((p: any) => {
              if (p.name) pp[p.name] = (pp[p.name] || 0) + calcPoints(p);
            });
          });
          pm[m.id] = true;
        }
      });
      setPlayerPoints(pp);
      setPlayedMatches(pm);
      persist(pp, pm);
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

      {liveMatches.length > 0 && (
        <>
          <div className="divider" />
          <div className="sec-title">Live Now</div>
          {liveMatches.slice(0, 2).map((m: any) => (
            <div key={m.id} className="match-card">
              <div className="match-status" style={{ color: m.matchEnded ? "#475569" : "#34d399" }}>
                {m.matchEnded ? "COMPLETED" : "● LIVE"}
              </div>
              <div className="match-name">{m.name}</div>
              {(m.score || []).map((s: any, i: number) => (
                <div key={i} className="match-score">{s.r}/{s.w} ({s.o} ov)</div>
              ))}
              <div className="match-venue">{m.venue || ""}</div>
            </div>
          ))}
        </>
      )}
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
                      <span style={{ color: "#64748b" }}>{(s.inning || "").replace(" Inning", "")}</span>
                      <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "0.92rem", letterSpacing: "1px", color: "#cbd5e1" }}>{s.r}/{s.w} <span style={{ color: "#475569", fontSize: "0.66rem" }}>({s.o}ov)</span></span>
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
    const allPlayers = Object.values(FANTASY_TEAMS)
      .flatMap(t => t.players)
      .reduce((acc: { name: string; role: string; ipl: string }[], p) => {
        if (!acc.find(x => x.name === p.name)) acc.push(p);
        return acc;
      }, [])
      .sort((a, b) => a.name.localeCompare(b.name));

    const updateStat = (k: keyof PlayerStats, v: number | boolean) => {
      const updated = { ...entryStats, [k]: v };
      setEntryStats(updated);
      if (entryPlayer) setEntryPreview(calcPoints(updated));
    };

    const handlePlayerChange = (name: string) => {
      setEntryPlayer(name);
      setEntryPreview(name ? calcPoints(entryStats) : null);
    };

    const saveEntry = () => {
      if (!entryPlayer) return;
      const pts = calcPoints(entryStats);
      const pp = { ...playerPoints, [entryPlayer]: (playerPoints[entryPlayer] || 0) + pts };
      setPlayerPoints(pp);
      persist(pp, playedMatches);
      setSavedMsg(`+${pts} pts saved for ${entryPlayer}`);
      setTimeout(() => setSavedMsg(""), 3000);
      setEntryPlayer("");
      setEntryStats({ ...defaultStats });
      setEntryPreview(null);
    };

    const overwriteEntry = () => {
      if (!entryPlayer) return;
      const pts = calcPoints(entryStats);
      const pp = { ...playerPoints, [entryPlayer]: pts };
      setPlayerPoints(pp);
      persist(pp, playedMatches);
      setSavedMsg(`Set ${entryPlayer} to ${pts} pts`);
      setTimeout(() => setSavedMsg(""), 3000);
    };

    const removePlayer = (name: string) => {
      const pp = { ...playerPoints };
      delete pp[name];
      setPlayerPoints(pp);
      persist(pp, playedMatches);
    };

    const totalPts = Object.values(playerPoints).reduce((s, v) => s + v, 0);

    const numField = (label: string, key: keyof PlayerStats, hint?: string) => (
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <label style={{ fontSize: "0.62rem", color: "#64748b", letterSpacing: "1px", textTransform: "uppercase" as const }}>
          {label}{hint && <span style={{ color: "#334155", marginLeft: 4 }}>{hint}</span>}
        </label>
        <input type="number" min="0" value={entryStats[key] as number}
          onChange={e => updateStat(key, parseInt(e.target.value) || 0)}
          style={{ background: "#0f1520", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, color: "#f1f5f9", padding: "6px 10px", fontSize: "0.9rem", width: "100%", fontFamily: "'Bebas Neue',sans-serif", letterSpacing: "1px" }} />
      </div>
    );

    return (
      <div>
        <div className="sec-title">Admin</div>

        <div className="stat-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-val" style={{ color: "#60a5fa" }}>{Object.keys(playedMatches).length}</div>
            <div className="stat-lbl">Matches logged</div>
          </div>
          <div className="stat-card">
            <div className="stat-val" style={{ color: "#f97316" }}>{Object.keys(playerPoints).length}</div>
            <div className="stat-lbl">Players with pts</div>
          </div>
          <div className="stat-card" style={{ gridColumn: "span 2" }}>
            <div className="stat-val" style={{ color: "#a855f7" }}>{totalPts}</div>
            <div className="stat-lbl">Total pts in system</div>
          </div>
        </div>

        <div style={{ background: "rgba(15,21,32,0.9)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" as const, color: "#94a3b8", marginBottom: 14 }}>
            ➕ Manual Score Entry
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: "0.62rem", color: "#64748b", letterSpacing: "1px", textTransform: "uppercase" as const, display: "block", marginBottom: 4 }}>Select Player</label>
            <select value={entryPlayer} onChange={e => handlePlayerChange(e.target.value)}
              style={{ width: "100%", background: "#0f1520", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: entryPlayer ? "#f1f5f9" : "#475569", padding: "8px 12px", fontSize: "0.85rem", fontFamily: "'DM Sans',sans-serif" }}>
              <option value="">— choose player —</option>
              {allPlayers.map(p => (
                <option key={p.name} value={p.name}>{p.name} ({p.ipl} · {p.role})</option>
              ))}
            </select>
          </div>

          <div style={{ fontSize: "0.65rem", color: "#3b82f6", letterSpacing: "2px", fontWeight: 700, marginBottom: 8, marginTop: 4 }}>🏏 BATTING</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
            {numField("Runs", "runs")}
            {numField("Balls", "balls")}
            {numField("4s", "fours")}
            {numField("6s", "sixes")}
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <label style={{ fontSize: "0.62rem", color: "#64748b", letterSpacing: "1px", textTransform: "uppercase" as const }}>Duck</label>
              <button onClick={() => updateStat("duck", !entryStats.duck)}
                style={{ background: entryStats.duck ? "rgba(239,68,68,0.2)" : "#0f1520", border: `1px solid ${entryStats.duck ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.08)"}`, borderRadius: 6, color: entryStats.duck ? "#f87171" : "#475569", padding: "6px", cursor: "pointer", fontSize: "0.8rem" }}>
                {entryStats.duck ? "YES" : "NO"}
              </button>
            </div>
          </div>

          <div style={{ fontSize: "0.65rem", color: "#f472b6", letterSpacing: "2px", fontWeight: 700, marginBottom: 8 }}>🎯 BOWLING</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
            {numField("Wickets", "wickets")}
            {numField("Balls Bowled", "ballsBowled")}
            {numField("Runs Conceded", "runsConceded")}
            {numField("Dots", "dots")}
            {numField("Maidens", "maidens")}
            {numField("LBW/Bowled", "lbwBowled")}
          </div>

          <div style={{ fontSize: "0.65rem", color: "#34d399", letterSpacing: "2px", fontWeight: 700, marginBottom: 8 }}>🧤 FIELDING</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
            {numField("Catches", "catches")}
            {numField("Run Outs", "runOuts")}
            {numField("Stumpings", "stumpings")}
          </div>

          {entryPlayer && (
            <div style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>{entryPlayer}</div>
                <div style={{ fontSize: "0.65rem", color: "#64748b" }}>Current total: {playerPoints[entryPlayer] || 0} pts</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Bebas Neue'", fontSize: "2rem", color: "#f97316", letterSpacing: "1px", lineHeight: 1 }}>
                  +{entryPreview ?? calcPoints(entryStats)}
                </div>
                <div style={{ fontSize: "0.6rem", color: "#64748b" }}>pts this match</div>
              </div>
            </div>
          )}

          {savedMsg && (
            <div style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 8, padding: "8px 12px", marginBottom: 10, fontSize: "0.78rem", color: "#34d399" }}>
              ✓ {savedMsg}
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" onClick={saveEntry} disabled={!entryPlayer} style={{ flex: 1, justifyContent: "center" }}>
              ➕ Add Points
            </button>
            <button onClick={overwriteEntry} disabled={!entryPlayer}
              style={{ flex: 1, padding: "10px", borderRadius: 10, border: "1px solid rgba(96,165,250,0.3)", background: "rgba(96,165,250,0.1)", color: "#60a5fa", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: "0.85rem", opacity: entryPlayer ? 1 : 0.4 }}>
              ✏️ Overwrite
            </button>
          </div>
          <div style={{ fontSize: "0.65rem", color: "#334155", marginTop: 8 }}>
            Add Points = adds to existing total · Overwrite = replaces total
          </div>
        </div>

        <div style={{ background: "rgba(15,21,32,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" as const, color: "#94a3b8", marginBottom: 12 }}>
            📊 Current Points
          </div>
          {Object.keys(playerPoints).length === 0 && (
            <div style={{ color: "#334155", fontSize: "0.8rem", padding: "8px 0" }}>No points entered yet.</div>
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

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn-danger" onClick={() => {
            if (confirm("Reset ALL points? Cannot be undone.")) {
              setPlayerPoints({});
              setPlayedMatches({});
              try { localStorage.removeItem("f26pp"); localStorage.removeItem("f26pm"); } catch (e) {}
            }
          }}>🗑️ Reset All Points</button>

          <button className="btn-primary" onClick={fetchLive} disabled={liveLoading} style={{ marginLeft: 0 }}>
            {liveLoading ? <span className="spinner" /> : "🔄"} Refresh
          </button>
        </div>
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
