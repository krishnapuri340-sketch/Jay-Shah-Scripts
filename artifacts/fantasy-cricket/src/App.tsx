import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from "react";

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
  RCB: "#ef4444", MI: "#3b82f6", CSK: "#f59e0b", KKR: "#7c3aed",
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

// IPL team badge config — abbreviation + primary/secondary color
const IPL_TEAM_BADGE: Record<string, { abbr: string; bg: string; fg: string }> = {
  "Rajasthan Royals":              { abbr: "RR",   bg: "#FF2FA9", fg: "#fff" },
  "Chennai Super Kings":           { abbr: "CSK",  bg: "#F5C518", fg: "#000" },
  "Deccan Chargers":               { abbr: "DCH",  bg: "#1B75BB", fg: "#fff" },
  "Kolkata Knight Riders":         { abbr: "KKR",  bg: "#3A225D", fg: "#FFD700" },
  "Mumbai Indians":                { abbr: "MI",   bg: "#004BA0", fg: "#fff" },
  "Sunrisers Hyderabad":           { abbr: "SRH",  bg: "#E97D1B", fg: "#fff" },
  "Royal Challengers Bangalore":   { abbr: "RCB",  bg: "#EC1C24", fg: "#fff" },
  "Royal Challengers Bengaluru":   { abbr: "RCB",  bg: "#EC1C24", fg: "#fff" },
  "Rising Pune Supergiant":        { abbr: "RPS",  bg: "#1BAAE1", fg: "#fff" },
  "Gujarat Titans":                { abbr: "GT",   bg: "#1B2133", fg: "#A4955A" },
  "Delhi Capitals":                { abbr: "DC",   bg: "#0078BC", fg: "#fff" },
  "Delhi Daredevils":              { abbr: "DD",   bg: "#D71920", fg: "#fff" },
  "Punjab Kings":                  { abbr: "PBKS", bg: "#AA0000", fg: "#fff" },
  "Kings XI Punjab":               { abbr: "KXIP", bg: "#AA0000", fg: "#fff" },
  "Lucknow Super Giants":          { abbr: "LSG",  bg: "#00B4D8", fg: "#fff" },
  "Gujarat Lions":                 { abbr: "GL",   bg: "#F26522", fg: "#fff" },
  "Kochi Tuskers Kerala":          { abbr: "KTK",  bg: "#7B2D8B", fg: "#fff" },
  "Pune Warriors":                 { abbr: "PWI",  bg: "#004B87", fg: "#fff" },
};
// Wikipedia SVG-rendered transparent logos (clean crest, no circular badge frame)
const TEAM_LOGO_CDN: Record<string, string> = {
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
  // Retired teams
  DCH:  "https://upload.wikimedia.org/wikipedia/en/a/a6/HyderabadDeccanChargers.png",
  DD:   "https://scores.iplt20.com/ipl/teamlogos/DD.png",
  RPS:  "https://upload.wikimedia.org/wikipedia/en/9/9a/Rising_Pune_Supergiant.png",
  GL:   "https://upload.wikimedia.org/wikipedia/en/c/c4/Gujarat_Lions.png",
  PWI:  "https://upload.wikimedia.org/wikipedia/en/thumb/4/4a/Pune_Warriors_India_IPL_Logo.png/330px-Pune_Warriors_India_IPL_Logo.png",
  KTK:  "https://upload.wikimedia.org/wikipedia/en/thumb/9/96/Kochi_Tuskers_Kerala_Logo.svg/330px-Kochi_Tuskers_Kerala_Logo.svg.png",
  KXIP: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/Punjab_Kings_Logo.svg/330px-Punjab_Kings_Logo.svg.png",
};
// Abbreviation → team name (for top-10 rows)
const ABBR_TO_TEAM: Record<string, string> = {
  RR:"Rajasthan Royals", CSK:"Chennai Super Kings", DCH:"Deccan Chargers",
  KKR:"Kolkata Knight Riders", MI:"Mumbai Indians", SRH:"Sunrisers Hyderabad",
  RCB:"Royal Challengers Bengaluru", RPS:"Rising Pune Supergiant", GT:"Gujarat Titans",
  DC:"Delhi Capitals", DD:"Delhi Daredevils", PBKS:"Punjab Kings", KXIP:"Kings XI Punjab",
  LSG:"Lucknow Super Giants", PWI:"Pune Warriors", GL:"Gujarat Lions",
};
const IPL_H2H: Record<string, [number, number]> = {
  "CSK-DC":[16,9],"CSK-GT":[3,4],"CSK-KKR":[18,11],"CSK-LSG":[5,4],"CSK-MI":[14,19],
  "CSK-PBKS":[19,11],"CSK-RCB":[18,13],"CSK-RR":[15,10],"CSK-SRH":[14,10],
  "DC-GT":[3,5],"DC-KKR":[11,14],"DC-LSG":[5,5],"DC-MI":[12,16],
  "DC-PBKS":[15,11],"DC-RCB":[10,15],"DC-RR":[10,14],"DC-SRH":[10,13],
  "GT-KKR":[4,4],"GT-LSG":[5,5],"GT-MI":[5,3],"GT-PBKS":[4,3],
  "GT-RCB":[5,3],"GT-RR":[5,3],"GT-SRH":[5,3],
  "KKR-LSG":[5,3],"KKR-MI":[13,17],"KKR-PBKS":[16,10],"KKR-RCB":[16,14],
  "KKR-RR":[15,11],"KKR-SRH":[14,11],
  "LSG-MI":[5,4],"LSG-PBKS":[4,5],"LSG-RCB":[4,4],"LSG-RR":[4,4],"LSG-SRH":[4,4],
  "MI-PBKS":[17,11],"MI-RCB":[19,14],"MI-RR":[16,10],"MI-SRH":[10,10],
  "PBKS-RCB":[11,17],"PBKS-RR":[14,17],"PBKS-SRH":[10,13],
  "RCB-RR":[15,10],"RCB-SRH":[14,13],"RR-SRH":[11,13],
};
function getH2H(a: string, b: string): { aWins: number; bWins: number } | null {
  const sorted = [a, b].sort();
  const data = IPL_H2H[sorted.join("-")];
  if (!data) return null;
  return sorted[0] === a ? { aWins: data[0], bWins: data[1] } : { aWins: data[1], bWins: data[0] };
}
const VENUE_AVG: Record<string, { avg: number; high: number; note: string }> = {
  "ACA Stadium":                                                     { avg: 160, high: 195, note: "Balanced" },
  "Arun Jaitley Stadium":                                            { avg: 162, high: 213, note: "Balanced" },
  "Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium":   { avg: 163, high: 196, note: "Balanced" },
  "Eden Gardens":                                                    { avg: 162, high: 222, note: "Seam-friendly" },
  "Himachal Pradesh Cricket Association Stadium":                    { avg: 152, high: 192, note: "Batting tough" },
  "M Chinnaswamy Stadium":                                           { avg: 170, high: 263, note: "Batters' paradise" },
  "MA Chidambaram Stadium":                                          { avg: 155, high: 208, note: "Spin-friendly" },
  "Narendra Modi Stadium":                                           { avg: 168, high: 224, note: "Flat wicket" },
  "New International Cricket Stadium":                               { avg: 161, high: 186, note: "New venue" },
  "Rajiv Gandhi International Stadium":                              { avg: 162, high: 204, note: "Balanced" },
  "Sawai Mansingh Stadium":                                          { avg: 158, high: 211, note: "Slow & low" },
  "Shaheed Veer Narayan Singh International Cricket Stadium":        { avg: 156, high: 190, note: "Bowler-friendly" },
  "Wankhede Stadium":                                                { avg: 172, high: 235, note: "Small ground, pacers aid" },
};
function predictNextMatch(homeCode: string, awayCode: string): { pick: string | null; reason: string; homeW: number; awayW: number } {
  const h2h = getH2H(homeCode, awayCode);
  let homeScore = 1.0, awayScore = 0.0;
  if (h2h) {
    const diff = h2h.aWins - h2h.bWins;
    if (diff > 0) homeScore += Math.min(diff * 0.18, 2.2);
    else awayScore += Math.min(Math.abs(diff) * 0.18, 2.2);
  }
  const edge = homeScore - awayScore;
  if (Math.abs(edge) < 0.4) return { pick: null, reason: "Too close to call", homeW: homeScore, awayW: awayScore };
  const pick = edge > 0 ? homeCode : awayCode;
  const isHome = pick === homeCode;
  const h2hLeads = h2h ? (isHome ? h2h.aWins > h2h.bWins : h2h.bWins > h2h.aWins) : false;
  const reason = h2hLeads && Math.abs(edge) > 1.2
    ? "Strong H2H edge"
    : h2hLeads
    ? "H2H + home advantage"
    : "Home advantage";
  return { pick, reason, homeW: homeScore, awayW: awayScore };
}

function getMatchWinner(m: any): string | null {
  if (!m.matchEnded || !m.status) return null;
  const s = m.status.toLowerCase();
  if (s.includes("no result") || s.includes("abandoned")) return null;
  if (s.includes("tied") || s.includes(" tie")) return "tie";
  const wonIdx = s.indexOf(" won ");
  if (wonIdx === -1) return null;
  const before = s.slice(0, wonIdx);
  if (m.teamInfo) {
    for (const ti of m.teamInfo) {
      if (ti.name && before.includes(ti.name.toLowerCase())) return ti.shortname;
    }
  }
  const codeNames: Record<string, string[]> = {
    MI: ["mumbai indians"], KKR: ["kolkata knight riders"],
    RCB: ["royal challengers bengaluru", "royal challengers bangalore"],
    CSK: ["chennai super kings"], SRH: ["sunrisers hyderabad"],
    RR: ["rajasthan royals"], PBKS: ["punjab kings", "kings xi punjab"],
    GT: ["gujarat titans"], LSG: ["lucknow super giants"], DC: ["delhi capitals"],
  };
  for (const [code, names] of Object.entries(codeNames)) {
    if (names.some(n => before.includes(n))) return code;
  }
  return null;
}

function TeamBadge({ name, size = 32 }: { name: string; size?: number }) {
  const b = IPL_TEAM_BADGE[name] || IPL_TEAM_BADGE[ABBR_TO_TEAM[name]] || { abbr: name.slice(0,2).toUpperCase(), bg:"#444", fg:"#fff" };
  const logoUrl = TEAM_LOGO_CDN[b.abbr];
  const fs = b.abbr.length >= 4 ? size * 0.27 : b.abbr.length === 3 ? size * 0.3 : size * 0.35;
  const [imgFailed, setImgFailed] = useState(false);
  const showLogo = logoUrl && !imgFailed;
  return (
    <div style={{ width:size, height:size, borderRadius:"50%",
      background: showLogo ? "transparent" : b.bg,
      display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
      border: showLogo ? "none" : "1.5px solid rgba(255,255,255,0.12)",
      overflow:"hidden", position:"relative" }}>
      {logoUrl && !imgFailed ? (
        <img src={logoUrl} alt={b.abbr}
          style={{ width: size, height: size, objectFit:"contain" }}
          onError={() => setImgFailed(true)} />
      ) : (
        <span style={{ color:b.fg, fontSize:fs, fontWeight:800, letterSpacing:"-0.3px", lineHeight:1 }}>{b.abbr}</span>
      )}
    </div>
  );
}

// ─── PIN login ───────────────────────────────────────────────────────────────
const DEFAULT_PINS: Record<string, string> = { rajveer: "1111", mombasa: "2222", mumbai: "3333", ponygoat: "4444" };
function loadPins(): Record<string, string> {
  try { return { ...DEFAULT_PINS, ...JSON.parse(localStorage.getItem("ipl-pins-2026") || "{}") }; } catch { return { ...DEFAULT_PINS }; }
}
function savePins(p: Record<string, string>) { localStorage.setItem("ipl-pins-2026", JSON.stringify(p)); }

function LoginScreen({ onLogin, pins }: { onLogin: (id: string) => void; pins: Record<string, string> }) {
  const [sel, setSel] = useState<string | null>(null);
  const [entered, setEntered] = useState("");
  const [shake, setShake] = useState(false);
  const [wrong, setWrong] = useState(false);

  const digit = (d: string) => {
    if (entered.length >= 4) return;
    const next = entered + d;
    setEntered(next);
    if (next.length === 4) {
      if (next === pins[sel!]) { onLogin(sel!); }
      else {
        setShake(true); setWrong(true);
        setTimeout(() => { setShake(false); setEntered(""); setWrong(false); }, 700);
      }
    }
  };
  const back = () => setEntered(e => e.slice(0, -1));

  if (sel) {
    const ft = FANTASY_TEAMS[sel];
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "#09090b",
        display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}>
        <style>{`
          @keyframes login-fade-up { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
          @keyframes glow-pulse { 0%,100% { opacity:0.55; } 50% { opacity:0.85; } }
          @keyframes pin-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
          .pin-dot-fill { transition: background 0.15s, border-color 0.15s, transform 0.15s; }
          .pin-dot-fill.filled { transform: scale(1.15); }
          .num-key { transition: background 0.12s, transform 0.08s; }
          .num-key:active { transform: scale(0.92); }
        `}</style>

        {/* Ambient glow */}
        <div style={{ position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 340, height: 340, borderRadius: "50%", background: `radial-gradient(circle, ${ft.color}22 0%, transparent 70%)`, animation: "glow-pulse 3s ease-in-out infinite", pointerEvents: "none" }} />

        <button onClick={() => { setSel(null); setEntered(""); setWrong(false); }}
          style={{ position: "absolute", top: 22, left: 20, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "6px 14px", color: "#71717a", fontSize: "0.72rem", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}>
          ← Back
        </button>

        <div style={{ animation: "login-fade-up 0.35s ease-out", display: "flex", flexDirection: "column" as const, alignItems: "center" }}>
          {/* Avatar */}
          <div style={{ position: "relative", marginBottom: 18 }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: `${ft.color}15`, border: `2px solid ${ft.color}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.2rem", boxShadow: `0 0 32px ${ft.color}30` }}>
              {ft.emoji}
            </div>
          </div>

          <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.02em", marginBottom: 4 }}>{ft.owner}</div>
          <div style={{ fontSize: "0.65rem", color: ft.color, letterSpacing: "0.06em", fontWeight: 600, marginBottom: 2, opacity: 0.85 }}>{ft.name}</div>
          <div style={{ fontSize: "0.58rem", color: "#52525b", letterSpacing: "0.1em", marginBottom: 36 }}>ENTER YOUR PIN</div>

          {/* PIN dots */}
          <div className={shake ? "pin-dot-shake" : ""} style={{ display: "flex", gap: 18, marginBottom: wrong ? 10 : 40, animation: shake ? "pin-shake 0.55s ease" : "none" }}>
            {[0,1,2,3].map(i => (
              <div key={i} className={`pin-dot-fill ${i < entered.length ? "filled" : ""}`} style={{
                width: 16, height: 16, borderRadius: "50%",
                background: i < entered.length ? ft.color : "transparent",
                border: `2.5px solid ${i < entered.length ? ft.color : "#3f3f46"}`,
                boxShadow: i < entered.length ? `0 0 10px ${ft.color}60` : "none",
              }} />
            ))}
          </div>

          {wrong && <div style={{ fontSize: "0.65rem", color: "#f87171", marginBottom: 18, letterSpacing: "0.04em" }}>✕ Wrong PIN — try again</div>}

          {/* Numpad */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, width: "100%", maxWidth: 260 }}>
            {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k, i) => (
              k === "" ? <div key={i} /> :
              <button key={i} className="num-key" onClick={() => k === "⌫" ? back() : digit(k)} style={{
                background: k === "⌫" ? "rgba(248,113,113,0.07)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${k === "⌫" ? "rgba(248,113,113,0.25)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 14, padding: "17px 8px", fontSize: k === "⌫" ? "1rem" : "1.2rem", fontWeight: 600,
                color: k === "⌫" ? "#f87171" : "#e4e4e7", cursor: "pointer", fontFamily: "inherit",
              }}>{k}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "#09090b",
      display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center",
      overflow: "hidden", padding: "0 24px",
    }}>
      <style>{`
        @keyframes login-fade-up { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes logo-glow { 0%,100% { box-shadow: 0 0 24px rgba(212,168,67,0.25); } 50% { box-shadow: 0 0 42px rgba(212,168,67,0.45); } }
        @keyframes team-card-in { from { opacity:0; transform:scale(0.94) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
        .team-card { transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease !important; }
        .team-card:active { transform: scale(0.97) !important; }
      `}</style>

      {/* Background radial */}
      <div style={{ position: "absolute", top: -120, left: "50%", transform: "translateX(-50%)", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(212,168,67,0.07) 0%, transparent 65%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -80, left: "50%", transform: "translateX(-50%)", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 65%)", pointerEvents: "none" }} />

      {/* Logo */}
      <div style={{ animation: "login-fade-up 0.3s ease-out", display: "flex", flexDirection: "column" as const, alignItems: "center", marginBottom: 40 }}>
        <div style={{ width: 56, height: 56, borderRadius: 18, background: "rgba(212,168,67,0.1)", border: "1.5px solid rgba(212,168,67,0.45)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem", marginBottom: 14, animation: "logo-glow 3s ease-in-out infinite" }}>🏏</div>
        <div style={{ fontSize: "1.55rem", fontWeight: 900, color: "#fafafa", letterSpacing: "-0.035em", lineHeight: 1.1 }}>IPL Fantasy</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
          <div style={{ width: 24, height: 1, background: "rgba(212,168,67,0.3)" }} />
          <div style={{ fontSize: "0.58rem", color: "#d4a843", letterSpacing: "0.18em", fontWeight: 600, opacity: 0.7 }}>2026 SEASON</div>
          <div style={{ width: 24, height: 1, background: "rgba(212,168,67,0.3)" }} />
        </div>
      </div>

      {/* Label */}
      <div style={{ fontSize: "0.58rem", letterSpacing: "0.14em", color: "#52525b", textTransform: "uppercase" as const, marginBottom: 16, animation: "login-fade-up 0.35s ease-out" }}>
        Select your team
      </div>

      {/* Team cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", maxWidth: 360 }}>
        {Object.values(FANTASY_TEAMS).map((ft, idx) => (
          <button key={ft.id} className="team-card" onClick={() => setSel(ft.id)} style={{
            background: `linear-gradient(145deg, ${ft.color}10 0%, ${ft.color}06 100%)`,
            border: `1.5px solid ${ft.color}30`,
            borderRadius: 20, padding: "22px 14px 20px",
            cursor: "pointer", fontFamily: "inherit", textAlign: "center" as const,
            boxShadow: `0 4px 20px ${ft.color}12`,
            animation: `team-card-in 0.4s ease-out ${idx * 0.06 + 0.1}s both`,
          }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: `${ft.color}14`, border: `1.5px solid ${ft.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.7rem", margin: "0 auto 12px", boxShadow: `0 0 18px ${ft.color}20` }}>
              {ft.emoji}
            </div>
            <div style={{ fontSize: "0.88rem", fontWeight: 800, color: ft.color, marginBottom: 4, letterSpacing: "-0.01em" }}>{ft.owner}</div>
            <div style={{ fontSize: "0.58rem", color: "#71717a", lineHeight: 1.4, letterSpacing: "0.01em" }}>{ft.name}</div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 24, fontSize: "0.55rem", color: "#3f3f46", letterSpacing: "0.06em" }}>
        IPL 2026 · Private League
      </div>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [historyYear, setHistoryYear] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState("rajveer");
  const [fixtureHomeAwayFilter, setFixtureHomeAwayFilter] = useState<"all" | "home" | "away">("all");
  const [playerPoints, setPlayerPoints] = useState<Record<string, number>>({});
  interface PlayerStats { played: boolean; runs: number; balls: number; fours: number; sixes: number; duck: boolean; wickets: number; dots: number; lbwBowled: number; maidens: number; ballsBowled: number; runsConceded: number; catches: number; runOuts: number; stumpings: number; }
  const [playerMatchPoints, setPlayerMatchPoints] = useState<Record<string, Array<{ matchNum: number; label: string; pts: number; source: string; stats?: PlayerStats }>>>({});
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [expandedAdminPlayer, setExpandedAdminPlayer] = useState<string | null>(null);
  const [adminBreakdownOpen, setAdminBreakdownOpen] = useState(false);
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [notifStatus, setNotifStatus] = useState<'unsupported' | 'default' | 'granted' | 'denied'>('unsupported');
  const swRegRef = useRef<ServiceWorkerRegistration | null>(null);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [liveAlertsEnabled, setLiveAlertsEnabled] = useState(false);
  const [liveAlertsLoading, setLiveAlertsLoading] = useState(false);
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
  const [statsFilter, setStatsFilter] = useState<"all" | "fantasy" | "predictions">("all");
  const [statsCategory, setStatsCategory] = useState<"orangeCap" | "purpleCap" | "sixesLeader" | "foursLeader" | "srLeader" | "ecoLeader">("orangeCap");
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [predArchiveOpen, setPredArchiveOpen] = useState(false);
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
  const [expandedPredMatchId, setExpandedPredMatchId] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<Record<string, Record<string, string | null>>>({});

  const [rankChanges, setRankChanges] = useState<Record<string, number>>({});
  const [isDark, setIsDark] = useState(true);
  const [sparkTip, setSparkTip] = useState<{ label: string; pts: number } | null>(null);
  const [pullY, setPullY] = useState(0);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [appInstalled, setAppInstalled] = useState(false);
  const lbContainerRef = useRef<HTMLDivElement>(null);
  const prevCardTops = useRef<Record<string, number>>({});
  const [showToast, setShowToast] = useState(false);
  // Swipe refs
  const swipeStartX = useRef(0);
  const swipeStartY = useRef(0);
  const swipeBlocked = useRef(false);
  const pointsRetryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const SWIPEABLE_TABS = ["home", "teams", "fixtures", "stats", "history"];
  // PTR refs
  const pullState = useRef({ active: false, startY: 0, startX: 0 });
  const pullYRef = useRef(0);
  const PULL_THRESHOLD = 72;
  const sparkTipTimer = useRef<ReturnType<typeof setTimeout>>();
  // Always-fresh ref to refresh fn (avoids stale closure in PTR listener)
  const refreshFnRef = useRef(() => {});
  const [countdown, setCountdown] = useState<{ text: string; matchName: string; venue?: string; homeTeam?: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(() => localStorage.getItem("ipl-current-user"));
  const [userPins, setUserPins] = useState<Record<string, string>>(loadPins);
  const [pinEditTarget, setPinEditTarget] = useState<string | null>(null);
  const [pinEditVal, setPinEditVal] = useState("");
  const handleLogin = (userId: string) => { localStorage.setItem("ipl-current-user", userId); setCurrentUser(userId); setTab("home"); };
  const handleLogout = () => { localStorage.removeItem("ipl-current-user"); setCurrentUser(null); };
  const handleSavePin = async (uid: string) => {
    if (!/^\d{4}$/.test(pinEditVal)) return;
    const updated = { ...userPins, [uid]: pinEditVal };
    setUserPins(updated); savePins(updated);
    setPinEditTarget(null); setPinEditVal("");
    try {
      await fetch(`/api/ipl/pins/${encodeURIComponent(uid)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinEditVal }),
      });
    } catch (_) {}
  };

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
        setProcessedMatches(data.processedMatches || []);
        setPointsUpdating(data.updating || false);
        setPendingMatches(data.pendingMatches || 0);
        setNextAttempt(data.nextAttempt || null);
        if (data.dailyHits) setDailyHits(data.dailyHits);
        setPointsLastUpdated(new Date());
        // If data came back empty (server still syncing on startup), retry quickly
        if (Object.keys(pp).length === 0) {
          pointsRetryTimer.current = setTimeout(() => {
            pointsRetryTimer.current = null;
            fetchPoints();
          }, 4000);
        }
      }
    } catch (e: any) {
      setPointsError("Points fetch failed: " + (e.message || "Unknown error"));
      // Retry on network failure too
      pointsRetryTimer.current = setTimeout(() => {
        pointsRetryTimer.current = null;
        fetchPoints();
      }, 5000);
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

  const PRED_CACHE_KEY = "ipl-predictions-2026";
  const loadLocalPreds = (): Record<string, Record<string, string | null>> => {
    try { return JSON.parse(localStorage.getItem(PRED_CACHE_KEY) || "{}"); } catch { return {}; }
  };
  const saveLocalPreds = (data: Record<string, Record<string, string | null>>) => {
    try { localStorage.setItem(PRED_CACHE_KEY, JSON.stringify(data)); } catch {}
  };

  const fetchPredictions = async () => {
    try {
      const res = await fetch("/api/ipl/predictions");
      if (res.ok) {
        const server: Record<string, Record<string, string | null>> = await res.json();
        // Merge: local cache fills in any gaps if server lost data
        const local = loadLocalPreds();
        const merged: Record<string, Record<string, string | null>> = { ...local };
        Object.entries(server).forEach(([matchId, picks]) => {
          merged[matchId] = { ...(merged[matchId] || {}), ...picks };
        });
        // If server was missing data we have locally, push it back
        const serverIsEmpty = Object.keys(server).length === 0 && Object.keys(local).length > 0;
        if (serverIsEmpty) {
          Object.entries(local).forEach(([matchId, picks]) => {
            Object.entries(picks).forEach(([ownerId, pick]) => {
              if (pick) {
                fetch(`/api/ipl/predictions/${encodeURIComponent(matchId)}`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ownerId, pick }),
                }).catch(() => {});
              }
            });
          });
        }
        saveLocalPreds(merged);
        setPredictions(merged);
      }
    } catch (_) {
      // On network failure, use local cache
      const local = loadLocalPreds();
      if (Object.keys(local).length > 0) setPredictions(local);
    }
  };

  const fetchPins = async () => {
    try {
      const res = await fetch("/api/ipl/pins");
      if (res.ok) {
        const serverPins = await res.json();
        const merged = { ...DEFAULT_PINS, ...serverPins };
        setUserPins(merged);
        savePins(merged);
      }
    } catch (_) {}
  };

  const toggleMatch = (matchId: string, isCompleted: boolean) => {
    if (expandedMatchId === matchId) {
      setExpandedMatchId(null);
    } else {
      setExpandedMatchId(matchId);
      if (isCompleted) fetchScorecard(matchId);
    }
  };

  // Cleanup retry timer on unmount
  useEffect(() => {
    return () => { if (pointsRetryTimer.current) clearTimeout(pointsRetryTimer.current); };
  }, []);

  // Fetch PINs from server once on mount (before login, so login screen uses correct PINs)
  useEffect(() => { fetchPins(); }, []);

  // Initial fetch — runs on mount AND whenever the user logs in
  useEffect(() => {
    if (!currentUser) return;
    fetchLive();
    fetchPoints();
    fetchStandings();
    fetchStats();
    fetchPredictions();
  }, [currentUser]);

  // Register service worker for push notifications
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
        .then(reg => {
          swRegRef.current = reg;
          setNotifStatus(Notification.permission as 'default' | 'granted' | 'denied');
        })
        .catch(() => setNotifStatus('unsupported'));
    }
  }, []);

  const urlBase64ToUint8Array = (b64: string): Uint8Array => {
    const padding = '='.repeat((4 - b64.length % 4) % 4);
    const base64 = (b64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
  };

  const enableNotifications = async () => {
    if (!swRegRef.current) return;
    try {
      const perm = await Notification.requestPermission();
      setNotifStatus(perm as 'default' | 'granted' | 'denied');
      if (perm !== 'granted') return;
      const res = await fetch('/api/push/vapid-public-key');
      const { key } = await res.json();
      const existing = await swRegRef.current.pushManager.getSubscription();
      const sub = existing || (await swRegRef.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      }));
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      });
    } catch (e) {
      console.warn('Push subscription failed:', e);
    }
  };

  const disableNotifications = async () => {
    const reg = swRegRef.current;
    if (!reg) return;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    }
    setNotifStatus('default');
  };

  // Adaptive polling: 1 min during a live match, 5 min when idle
  const isAnyMatchLive = liveMatches.some((m: any) => m.matchStarted && !m.matchEnded);

  // Reset home/away sub-filter whenever the team filter is changed
  useEffect(() => { setFixtureHomeAwayFilter("all"); }, [teamFilter]);

  useEffect(() => {
    const delay = isAnyMatchLive ? 30_000 : 60 * 60_000;
    const ids = [
      setInterval(fetchLive, delay),
      setInterval(fetchPoints, delay),
      setInterval(fetchStandings, delay),
      setInterval(fetchStats, delay),
      setInterval(fetchPredictions, delay),
    ];
    return () => ids.forEach(clearInterval);
  }, [isAnyMatchLive]);

  // Fast-poll predictions when the Predictions view is open (picks can change up until match starts)
  useEffect(() => {
    if (!(tab === "stats" && statsFilter === "predictions")) return;
    const id = setInterval(fetchPredictions, 30_000);
    return () => clearInterval(id);
  }, [tab, statsFilter]);

  // Refresh when the user returns to the tab after being away
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        fetchLive();
        fetchPoints();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

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

  // FLIP animation — only fires when the rank order actually changes
  // lbReady suppresses the animation during the initial load to prevent the "reshuffle on open" effect
  const prevOrderRef = useRef<string[]>([]);
  const lbReady = useRef(false);

  // Mark the leaderboard as ready one animation frame after the first complete data load
  useEffect(() => {
    if (!pointsLoading && !liveLoading && !lbReady.current) {
      const id = requestAnimationFrame(() => { lbReady.current = true; });
      return () => cancelAnimationFrame(id);
    }
  }, [pointsLoading, liveLoading]);

  useLayoutEffect(() => {
    if (!lbContainerRef.current) return;
    const currentOrder = teamScores.map(s => s.id);
    const prevOrder = prevOrderRef.current;
    const orderChanged = lbReady.current &&
      prevOrder.length === currentOrder.length &&
      currentOrder.some((id, i) => id !== prevOrder[i]);
    if (!orderChanged) {
      prevOrderRef.current = currentOrder;
      // Still record positions for next comparison
      const cards = Array.from(lbContainerRef.current.querySelectorAll('[data-team-id]')) as HTMLElement[];
      cards.forEach(card => { prevCardTops.current[card.dataset.teamId!] = card.getBoundingClientRect().top; });
      return;
    }
    // Capture new positions and animate from old ones
    const cards = Array.from(lbContainerRef.current.querySelectorAll('[data-team-id]')) as HTMLElement[];
    cards.forEach(card => {
      const id = card.dataset.teamId!;
      const newTop = card.getBoundingClientRect().top;
      const prevTop = prevCardTops.current[id];
      if (prevTop !== undefined && Math.abs(prevTop - newTop) > 2) {
        const delta = prevTop - newTop;
        card.style.transition = 'none';
        card.style.transform = `translateY(${delta}px)`;
        card.getBoundingClientRect();
        card.style.transition = 'transform 0.4s ease-out';
        card.style.transform = '';
        card.addEventListener('transitionend', () => { card.style.transition = ''; card.style.transform = ''; }, { once: true });
      }
      prevCardTops.current[id] = newTop;
    });
    prevOrderRef.current = currentOrder;
  }, [teamScores]);

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
      setCountdown({ text, matchName: upcoming.name, venue: upcoming.venue || "", homeTeam });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [liveMatches]);

  useEffect(() => {
    if (tab !== "admin") return;
    fetch("/api/push/live-alerts")
      .then(r => r.json())
      .then(d => setLiveAlertsEnabled(d.enabled))
      .catch(() => {});
  }, [tab]);

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
    ctx.fillStyle = "#09090b";
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
    ctx.fillText("IPL Fantasy 2026", PAD + logoR * 2 + 18, 59);
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
        await navigator.share({ files: [file], title: "IPL Fantasy 2026 — Leaderboard" });
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
    ctx.fillText("IPL Fantasy 2026", 36 + logoR * 2 + 12, logoY - 4);
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
        await navigator.share({ files: [file], title: "IPL Fantasy 2026 — All Teams" });
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

  const maxPts = teamScores[0]?.total || 1;

  // IPL Season History 2008–2025
  const IPL_HISTORY = [
    {
      year: 2025, season: 18, champion: "Royal Challengers Bengaluru", runnerUp: "Punjab Kings",
      color: "#EC1C24", orangeCap: "Sai Sudharsan", orangeRuns: 759, purpleCap: "Prasidh Krishna", purpleWkts: 25, mvp: "Sai Sudharsan",
      topBat: [
        { name: "Sai Sudharsan", team: "GT", val: 759 }, { name: "Suryakumar Yadav", team: "MI", val: 717 },
        { name: "Virat Kohli", team: "RCB", val: 657 }, { name: "Shubman Gill", team: "GT", val: 650 },
        { name: "Mitchell Marsh", team: "LSG", val: 627 }, { name: "Shreyas Iyer", team: "PBKS", val: 604 },
        { name: "Yashasvi Jaiswal", team: "RR", val: 559 }, { name: "Prabhsimran Singh", team: "PBKS", val: 549 },
        { name: "KL Rahul", team: "DC", val: 539 }, { name: "Jos Buttler", team: "GT", val: 538 },
      ],
      topBwl: [
        { name: "Prasidh Krishna", team: "GT", val: 25 }, { name: "Noor Ahmad", team: "CSK", val: 24 },
        { name: "Josh Hazlewood", team: "RCB", val: 22 }, { name: "Trent Boult", team: "MI", val: 22 },
        { name: "Arshdeep Singh", team: "PBKS", val: 21 }, { name: "Sai Kishore", team: "GT", val: 19 },
        { name: "Jasprit Bumrah", team: "MI", val: 18 }, { name: "Varun Chakravarthy", team: "KKR", val: 17 },
        { name: "Krunal Pandya", team: "RCB", val: 17 }, { name: "Bhuvneshwar Kumar", team: "RCB", val: 17 },
      ],
    },
    {
      year: 2024, season: 17, champion: "Kolkata Knight Riders", runnerUp: "Sunrisers Hyderabad",
      color: "#552A8A", orangeCap: "Virat Kohli", orangeRuns: 741, purpleCap: "Harshal Patel", purpleWkts: 24, mvp: "Sunil Narine",
      topBat: [
        { name: "Virat Kohli", team: "RCB", val: 741 }, { name: "Ruturaj Gaikwad", team: "CSK", val: 583 },
        { name: "Travis Head", team: "SRH", val: 567 }, { name: "Heinrich Klaasen", team: "SRH", val: 479 },
        { name: "Abhishek Sharma", team: "SRH", val: 484 }, { name: "Sunil Narine", team: "KKR", val: 488 },
        { name: "Jos Buttler", team: "RR", val: 462 }, { name: "Rishabh Pant", team: "DC", val: 446 },
        { name: "David Warner", team: "DC", val: 418 }, { name: "Phil Salt", team: "KKR", val: 435 },
      ],
      topBwl: [
        { name: "Harshal Patel", team: "PBKS", val: 24 }, { name: "Varun Chakravarthy", team: "KKR", val: 21 },
        { name: "Kagiso Rabada", team: "PBKS", val: 19 }, { name: "Kuldeep Yadav", team: "DC", val: 19 },
        { name: "T Natarajan", team: "SRH", val: 18 }, { name: "Mitchell Starc", team: "KKR", val: 17 },
        { name: "Rashid Khan", team: "GT", val: 17 }, { name: "Jasprit Bumrah", team: "MI", val: 15 },
        { name: "Ravi Bishnoi", team: "LSG", val: 15 }, { name: "Yuzvendra Chahal", team: "RR", val: 13 },
      ],
    },
    {
      year: 2023, season: 16, champion: "Chennai Super Kings", runnerUp: "Gujarat Titans",
      color: "#F5C518", orangeCap: "Shubman Gill", orangeRuns: 890, purpleCap: "Mohammed Shami", purpleWkts: 28, mvp: "Shubman Gill",
      topBat: [
        { name: "Shubman Gill", team: "GT", val: 890 }, { name: "Faf du Plessis", team: "RCB", val: 730 },
        { name: "Virat Kohli", team: "RCB", val: 639 }, { name: "Devon Conway", team: "CSK", val: 672 },
        { name: "Yashasvi Jaiswal", team: "RR", val: 625 }, { name: "Ruturaj Gaikwad", team: "CSK", val: 590 },
        { name: "KL Rahul", team: "LSG", val: 520 }, { name: "David Warner", team: "DC", val: 516 },
        { name: "Sai Sudarshan", team: "GT", val: 476 }, { name: "Rohit Sharma", team: "MI", val: 442 },
      ],
      topBwl: [
        { name: "Mohammed Shami", team: "GT", val: 28 }, { name: "Rashid Khan", team: "GT", val: 27 },
        { name: "Piyush Chawla", team: "MI", val: 22 }, { name: "Mohit Sharma", team: "GT", val: 18 },
        { name: "Yuzvendra Chahal", team: "RR", val: 21 }, { name: "Mohammed Siraj", team: "RCB", val: 19 },
        { name: "Arshdeep Singh", team: "PBKS", val: 19 }, { name: "Maheesh Theekshana", team: "CSK", val: 17 },
        { name: "Akash Deep", team: "RCB", val: 17 }, { name: "Alzarri Joseph", team: "MI", val: 14 },
      ],
    },
    {
      year: 2022, season: 15, champion: "Gujarat Titans", runnerUp: "Rajasthan Royals",
      color: "#A4955A", orangeCap: "Jos Buttler", orangeRuns: 863, purpleCap: "Yuzvendra Chahal", purpleWkts: 27, mvp: "Hardik Pandya",
      topBat: [
        { name: "Jos Buttler", team: "RR", val: 863 }, { name: "KL Rahul", team: "LSG", val: 616 },
        { name: "Quinton de Kock", team: "LSG", val: 508 }, { name: "Hardik Pandya", team: "GT", val: 487 },
        { name: "Shubman Gill", team: "GT", val: 483 }, { name: "Faf du Plessis", team: "RCB", val: 468 },
        { name: "Sanju Samson", team: "RR", val: 458 }, { name: "Deepak Hooda", team: "LSG", val: 451 },
        { name: "Liam Livingstone", team: "PBKS", val: 437 }, { name: "David Warner", team: "DC", val: 432 },
      ],
      topBwl: [
        { name: "Yuzvendra Chahal", team: "RR", val: 27 }, { name: "Wanindu Hasaranga", team: "RCB", val: 26 },
        { name: "Mohammed Shami", team: "GT", val: 20 }, { name: "T Natarajan", team: "SRH", val: 20 },
        { name: "Kuldeep Yadav", team: "DC", val: 21 }, { name: "Rashid Khan", team: "GT", val: 19 },
        { name: "Harshal Patel", team: "RCB", val: 19 }, { name: "Dushmantha Chameera", team: "LSG", val: 19 },
        { name: "Umesh Yadav", team: "KKR", val: 16 }, { name: "Trent Boult", team: "RR", val: 13 },
      ],
    },
    {
      year: 2021, season: 14, champion: "Chennai Super Kings", runnerUp: "Kolkata Knight Riders",
      color: "#F5C518", orangeCap: "Ruturaj Gaikwad", orangeRuns: 635, purpleCap: "Harshal Patel", purpleWkts: 32, mvp: "Harshal Patel",
      topBat: [
        { name: "Ruturaj Gaikwad", team: "CSK", val: 635 }, { name: "Faf du Plessis", team: "CSK", val: 633 },
        { name: "KL Rahul", team: "PBKS", val: 626 }, { name: "Shikhar Dhawan", team: "DC", val: 587 },
        { name: "Ishan Kishan", team: "MI", val: 516 }, { name: "Sanju Samson", team: "RR", val: 484 },
        { name: "Prithvi Shaw", team: "DC", val: 480 }, { name: "Quinton de Kock", team: "MI", val: 465 },
        { name: "Devdutt Padikkal", team: "RCB", val: 415 }, { name: "Rohit Sharma", team: "MI", val: 381 },
      ],
      topBwl: [
        { name: "Harshal Patel", team: "RCB", val: 32 }, { name: "Avesh Khan", team: "DC", val: 24 },
        { name: "Jasprit Bumrah", team: "MI", val: 21 }, { name: "Mohammed Shami", team: "PBKS", val: 19 },
        { name: "Varun Chakravarthy", team: "KKR", val: 18 }, { name: "Rashid Khan", team: "SRH", val: 18 },
        { name: "Ravi Bishnoi", team: "PBKS", val: 18 }, { name: "Rahul Chahar", team: "MI", val: 17 },
        { name: "Deepak Chahar", team: "CSK", val: 14 }, { name: "Axar Patel", team: "DC", val: 15 },
      ],
    },
    {
      year: 2020, season: 13, champion: "Mumbai Indians", runnerUp: "Delhi Capitals",
      color: "#004BA0", orangeCap: "KL Rahul", orangeRuns: 670, purpleCap: "Kagiso Rabada", purpleWkts: 30, mvp: "Jofra Archer",
      topBat: [
        { name: "KL Rahul", team: "PBKS", val: 670 }, { name: "Shikhar Dhawan", team: "DC", val: 618 },
        { name: "Mayank Agarwal", team: "PBKS", val: 424 }, { name: "Shreyas Iyer", team: "DC", val: 519 },
        { name: "David Warner", team: "SRH", val: 548 }, { name: "Devdutt Padikkal", team: "RCB", val: 473 },
        { name: "Quinton de Kock", team: "MI", val: 503 }, { name: "AB de Villiers", team: "RCB", val: 454 },
        { name: "Faf du Plessis", team: "CSK", val: 449 }, { name: "Rohit Sharma", team: "MI", val: 415 },
      ],
      topBwl: [
        { name: "Kagiso Rabada", team: "DC", val: 30 }, { name: "Jasprit Bumrah", team: "MI", val: 27 },
        { name: "Trent Boult", team: "MI", val: 25 }, { name: "Anrich Nortje", team: "DC", val: 22 },
        { name: "Jofra Archer", team: "RR", val: 20 }, { name: "Mohammed Shami", team: "PBKS", val: 20 },
        { name: "Rashid Khan", team: "SRH", val: 20 }, { name: "Yuzvendra Chahal", team: "RCB", val: 21 },
        { name: "Chris Morris", team: "RCB", val: 11 }, { name: "Harshal Patel", team: "RCB", val: 17 },
      ],
    },
    {
      year: 2019, season: 12, champion: "Mumbai Indians", runnerUp: "Chennai Super Kings",
      color: "#004BA0", orangeCap: "David Warner", orangeRuns: 692, purpleCap: "Imran Tahir", purpleWkts: 26, mvp: "Andre Russell",
      topBat: [
        { name: "David Warner", team: "SRH", val: 692 }, { name: "KL Rahul", team: "PBKS", val: 593 },
        { name: "Andre Russell", team: "KKR", val: 510 }, { name: "Quinton de Kock", team: "MI", val: 529 },
        { name: "Shikhar Dhawan", team: "DC", val: 521 }, { name: "Shreyas Iyer", team: "DC", val: 463 },
        { name: "Jonny Bairstow", team: "SRH", val: 445 }, { name: "AB de Villiers", team: "RCB", val: 442 },
        { name: "MS Dhoni", team: "CSK", val: 416 }, { name: "Rohit Sharma", team: "MI", val: 405 },
      ],
      topBwl: [
        { name: "Imran Tahir", team: "CSK", val: 26 }, { name: "Kagiso Rabada", team: "DC", val: 25 },
        { name: "Dwayne Bravo", team: "CSK", val: 22 }, { name: "Shreyas Gopal", team: "RR", val: 20 },
        { name: "Jasprit Bumrah", team: "MI", val: 19 }, { name: "Yuzvendra Chahal", team: "RCB", val: 18 },
        { name: "Jaydev Unadkat", team: "RR", val: 17 }, { name: "Harbhajan Singh", team: "MI", val: 16 },
        { name: "Hardik Pandya", team: "MI", val: 14 }, { name: "Sam Curran", team: "PBKS", val: 13 },
      ],
    },
    {
      year: 2018, season: 11, champion: "Chennai Super Kings", runnerUp: "Sunrisers Hyderabad",
      color: "#F5C518", orangeCap: "Kane Williamson", orangeRuns: 735, purpleCap: "Andrew Tye", purpleWkts: 24, mvp: "Shane Watson",
      topBat: [
        { name: "Kane Williamson", team: "SRH", val: 735 }, { name: "Rishabh Pant", team: "DC", val: 684 },
        { name: "Ambati Rayudu", team: "CSK", val: 602 }, { name: "Suresh Raina", team: "CSK", val: 497 },
        { name: "Shikhar Dhawan", team: "SRH", val: 497 }, { name: "MS Dhoni", team: "CSK", val: 455 },
        { name: "Robin Uthappa", team: "KKR", val: 452 }, { name: "AB de Villiers", team: "RCB", val: 448 },
        { name: "Manish Pandey", team: "SRH", val: 441 }, { name: "Jos Buttler", team: "RR", val: 549 },
      ],
      topBwl: [
        { name: "Andrew Tye", team: "PBKS", val: 24 }, { name: "Rashid Khan", team: "SRH", val: 21 },
        { name: "Siddharth Kaul", team: "SRH", val: 21 }, { name: "Dwayne Bravo", team: "CSK", val: 18 },
        { name: "Umesh Yadav", team: "DD", val: 18 }, { name: "Bhuvneshwar Kumar", team: "SRH", val: 17 },
        { name: "Jasprit Bumrah", team: "MI", val: 17 }, { name: "Yuzvendra Chahal", team: "RCB", val: 17 },
        { name: "Imran Tahir", team: "CSK", val: 15 }, { name: "Mohit Sharma", team: "CSK", val: 15 },
      ],
    },
    {
      year: 2017, season: 10, champion: "Mumbai Indians", runnerUp: "Rising Pune Supergiant",
      color: "#004BA0", orangeCap: "David Warner", orangeRuns: 641, purpleCap: "Bhuvneshwar Kumar", purpleWkts: 26, mvp: "Rohit Sharma",
      topBat: [
        { name: "David Warner", team: "SRH", val: 641 }, { name: "Shikhar Dhawan", team: "SRH", val: 479 },
        { name: "Suresh Raina", team: "GL", val: 413 }, { name: "Ajinkya Rahane", team: "RPS", val: 374 },
        { name: "Sanju Samson", team: "RR", val: 368 }, { name: "Rishabh Pant", team: "DD", val: 366 },
        { name: "Rohit Sharma", team: "MI", val: 333 }, { name: "KL Rahul", team: "PBKS", val: 310 },
        { name: "MS Dhoni", team: "RPS", val: 290 }, { name: "Chris Gayle", team: "PBKS", val: 298 },
      ],
      topBwl: [
        { name: "Bhuvneshwar Kumar", team: "SRH", val: 26 }, { name: "Jaydev Unadkat", team: "RPS", val: 24 },
        { name: "Jasprit Bumrah", team: "MI", val: 20 }, { name: "Kagiso Rabada", team: "DD", val: 20 },
        { name: "Imran Tahir", team: "GL", val: 18 }, { name: "Dwayne Bravo", team: "GL", val: 17 },
        { name: "Rashid Khan", team: "SRH", val: 17 }, { name: "Harbhajan Singh", team: "MI", val: 15 },
        { name: "Praveen Kumar", team: "GL", val: 14 }, { name: "Mitchell Johnson", team: "MI", val: 13 },
      ],
    },
    {
      year: 2016, season: 9, champion: "Sunrisers Hyderabad", runnerUp: "Royal Challengers Bangalore",
      color: "#E97D1B", orangeCap: "Virat Kohli", orangeRuns: 973, purpleCap: "Bhuvneshwar Kumar", purpleWkts: 23, mvp: "Virat Kohli",
      topBat: [
        { name: "Virat Kohli", team: "RCB", val: 973 }, { name: "David Warner", team: "SRH", val: 848 },
        { name: "AB de Villiers", team: "RCB", val: 687 }, { name: "Shikhar Dhawan", team: "SRH", val: 501 },
        { name: "Rohit Sharma", team: "MI", val: 489 }, { name: "Suresh Raina", team: "GL", val: 374 },
        { name: "KL Rahul", team: "RCB", val: 397 }, { name: "Ajinkya Rahane", team: "RPS", val: 391 },
        { name: "Sanju Samson", team: "DD", val: 345 }, { name: "Chris Gayle", team: "PBKS", val: 326 },
      ],
      topBwl: [
        { name: "Bhuvneshwar Kumar", team: "SRH", val: 23 }, { name: "Yuzvendra Chahal", team: "RCB", val: 23 },
        { name: "Amit Mishra", team: "SRH", val: 18 }, { name: "Mustafizur Rahman", team: "SRH", val: 17 },
        { name: "Barinder Sran", team: "SRH", val: 17 }, { name: "Jasprit Bumrah", team: "MI", val: 15 },
        { name: "Murugan Ashwin", team: "PBKS", val: 15 }, { name: "Harbhajan Singh", team: "MI", val: 14 },
        { name: "Dwayne Bravo", team: "GL", val: 13 }, { name: "Praveen Kumar", team: "GL", val: 13 },
      ],
    },
    {
      year: 2015, season: 8, champion: "Mumbai Indians", runnerUp: "Chennai Super Kings",
      color: "#004BA0", orangeCap: "David Warner", orangeRuns: 562, purpleCap: "Dwayne Bravo", purpleWkts: 26, mvp: "Rohit Sharma",
      topBat: [
        { name: "David Warner", team: "SRH", val: 562 }, { name: "Robin Uthappa", team: "KKR", val: 549 },
        { name: "AB de Villiers", team: "RCB", val: 513 }, { name: "Virat Kohli", team: "RCB", val: 505 },
        { name: "Rohit Sharma", team: "MI", val: 482 }, { name: "Suresh Raina", team: "CSK", val: 491 },
        { name: "Ajinkya Rahane", team: "RR", val: 432 }, { name: "MS Dhoni", team: "CSK", val: 372 },
        { name: "Brendon McCullum", team: "KKR", val: 328 }, { name: "Chris Gayle", team: "RCB", val: 333 },
      ],
      topBwl: [
        { name: "Dwayne Bravo", team: "CSK", val: 26 }, { name: "Mohit Sharma", team: "CSK", val: 21 },
        { name: "Harbhajan Singh", team: "MI", val: 18 }, { name: "Amit Mishra", team: "SRH", val: 18 },
        { name: "Lasith Malinga", team: "MI", val: 18 }, { name: "Akshar Patel", team: "PBKS", val: 17 },
        { name: "Mitchell Johnson", team: "PBKS", val: 15 }, { name: "Bhuvneshwar Kumar", team: "SRH", val: 15 },
        { name: "Zaheer Khan", team: "DD", val: 13 }, { name: "Andre Russell", team: "KKR", val: 14 },
      ],
    },
    {
      year: 2014, season: 7, champion: "Kolkata Knight Riders", runnerUp: "Kings XI Punjab",
      color: "#552A8A", orangeCap: "Robin Uthappa", orangeRuns: 660, purpleCap: "Mohit Sharma", purpleWkts: 23, mvp: "Manish Pandey",
      topBat: [
        { name: "Robin Uthappa", team: "KKR", val: 660 }, { name: "Glenn Maxwell", team: "PBKS", val: 552 },
        { name: "Ajinkya Rahane", team: "RR", val: 487 }, { name: "Shikhar Dhawan", team: "SRH", val: 405 },
        { name: "George Bailey", team: "PBKS", val: 420 }, { name: "Manish Pandey", team: "KKR", val: 394 },
        { name: "Gautam Gambhir", team: "KKR", val: 393 }, { name: "Rohit Sharma", team: "MI", val: 392 },
        { name: "MS Dhoni", team: "CSK", val: 371 }, { name: "Virat Kohli", team: "RCB", val: 359 },
      ],
      topBwl: [
        { name: "Mohit Sharma", team: "CSK", val: 23 }, { name: "Piyush Chawla", team: "PBKS", val: 21 },
        { name: "Sandeep Sharma", team: "PBKS", val: 19 }, { name: "Pragyan Ojha", team: "MI", val: 18 },
        { name: "Bhuvneshwar Kumar", team: "SRH", val: 17 }, { name: "Umesh Yadav", team: "KKR", val: 17 },
        { name: "Morne Morkel", team: "DD", val: 15 }, { name: "Dhawal Kulkarni", team: "RR", val: 16 },
        { name: "Harbhajan Singh", team: "MI", val: 12 }, { name: "Imran Tahir", team: "CSK", val: 11 },
      ],
    },
    {
      year: 2013, season: 6, champion: "Mumbai Indians", runnerUp: "Chennai Super Kings",
      color: "#004BA0", orangeCap: "Michael Hussey", orangeRuns: 733, purpleCap: "Dwayne Bravo", purpleWkts: 32, mvp: "Shane Watson",
      topBat: [
        { name: "Michael Hussey", team: "CSK", val: 733 }, { name: "Chris Gayle", team: "RCB", val: 708 },
        { name: "Rohit Sharma", team: "MI", val: 538 }, { name: "AB de Villiers", team: "RCB", val: 479 },
        { name: "Suresh Raina", team: "CSK", val: 514 }, { name: "MS Dhoni", team: "CSK", val: 461 },
        { name: "Shane Watson", team: "RR", val: 328 }, { name: "Dinesh Karthik", team: "MI", val: 327 },
        { name: "Virat Kohli", team: "RCB", val: 306 }, { name: "Gautam Gambhir", team: "KKR", val: 311 },
      ],
      topBwl: [
        { name: "Dwayne Bravo", team: "CSK", val: 32 }, { name: "Sunil Narine", team: "KKR", val: 24 },
        { name: "Amit Mishra", team: "SRH", val: 20 }, { name: "Morne Morkel", team: "DD", val: 21 },
        { name: "Dale Steyn", team: "SRH", val: 18 }, { name: "R Vinay Kumar", team: "KKR", val: 18 },
        { name: "RP Singh", team: "DD", val: 15 }, { name: "Harbhajan Singh", team: "MI", val: 14 },
        { name: "Brad Hogg", team: "RR", val: 12 }, { name: "Piyush Chawla", team: "PBKS", val: 13 },
      ],
    },
    {
      year: 2012, season: 5, champion: "Kolkata Knight Riders", runnerUp: "Chennai Super Kings",
      color: "#552A8A", orangeCap: "Chris Gayle", orangeRuns: 733, purpleCap: "Morne Morkel", purpleWkts: 25, mvp: "Sunil Narine",
      topBat: [
        { name: "Chris Gayle", team: "RCB", val: 733 }, { name: "Gautam Gambhir", team: "KKR", val: 590 },
        { name: "Michael Hussey", team: "CSK", val: 517 }, { name: "Ajinkya Rahane", team: "RR", val: 560 },
        { name: "Suresh Raina", team: "CSK", val: 474 }, { name: "Jacques Kallis", team: "KKR", val: 415 },
        { name: "Kevin Pietersen", team: "DD", val: 388 }, { name: "Rohit Sharma", team: "MI", val: 434 },
        { name: "MS Dhoni", team: "CSK", val: 358 }, { name: "Virat Kohli", team: "RCB", val: 364 },
      ],
      topBwl: [
        { name: "Morne Morkel", team: "DD", val: 25 }, { name: "Sunil Narine", team: "KKR", val: 24 },
        { name: "Lasith Malinga", team: "MI", val: 22 }, { name: "Harbhajan Singh", team: "MI", val: 21 },
        { name: "Piyush Chawla", team: "CSK", val: 19 }, { name: "Pragyan Ojha", team: "MI", val: 19 },
        { name: "Dwayne Bravo", team: "CSK", val: 18 }, { name: "Amit Mishra", team: "DCH", val: 18 },
        { name: "Bhuvneshwar Kumar", team: "PWI", val: 15 }, { name: "RP Singh", team: "DCH", val: 17 },
      ],
    },
    {
      year: 2011, season: 4, champion: "Chennai Super Kings", runnerUp: "Royal Challengers Bangalore",
      color: "#F5C518", orangeCap: "Chris Gayle", orangeRuns: 608, purpleCap: "Lasith Malinga", purpleWkts: 28, mvp: "Chris Gayle",
      topBat: [
        { name: "Chris Gayle", team: "RCB", val: 608 }, { name: "Sachin Tendulkar", team: "MI", val: 553 },
        { name: "Virender Sehwag", team: "DD", val: 453 }, { name: "Suresh Raina", team: "CSK", val: 432 },
        { name: "S Badrinath", team: "CSK", val: 379 }, { name: "AB de Villiers", team: "DD", val: 371 },
        { name: "Rohit Sharma", team: "MI", val: 372 }, { name: "MS Dhoni", team: "CSK", val: 365 },
        { name: "Brendon McCullum", team: "KKR", val: 393 }, { name: "Adam Gilchrist", team: "PBKS", val: 312 },
      ],
      topBwl: [
        { name: "Lasith Malinga", team: "MI", val: 28 }, { name: "Piyush Chawla", team: "KKR", val: 21 },
        { name: "Albie Morkel", team: "CSK", val: 19 }, { name: "Doug Bollinger", team: "CSK", val: 18 },
        { name: "Harbhajan Singh", team: "MI", val: 17 }, { name: "Amit Mishra", team: "DCH", val: 16 },
        { name: "RP Singh", team: "DCH", val: 15 }, { name: "Dwayne Bravo", team: "CSK", val: 14 },
        { name: "Sreesanth", team: "PBKS", val: 13 }, { name: "Shane Bond", team: "MI", val: 13 },
      ],
    },
    {
      year: 2010, season: 3, champion: "Chennai Super Kings", runnerUp: "Mumbai Indians",
      color: "#F5C518", orangeCap: "Sachin Tendulkar", orangeRuns: 618, purpleCap: "Pragyan Ojha", purpleWkts: 21, mvp: "Sachin Tendulkar",
      topBat: [
        { name: "Sachin Tendulkar", team: "MI", val: 618 }, { name: "Gautam Gambhir", team: "KKR", val: 553 },
        { name: "Suresh Raina", team: "CSK", val: 520 }, { name: "Kumar Sangakkara", team: "DCH", val: 512 },
        { name: "Rohit Sharma", team: "DCH", val: 404 }, { name: "Michael Hussey", team: "CSK", val: 388 },
        { name: "Murali Vijay", team: "CSK", val: 366 }, { name: "Jacques Kallis", team: "KKR", val: 307 },
        { name: "MS Dhoni", team: "CSK", val: 287 }, { name: "Abhishek Nayar", team: "MI", val: 292 },
      ],
      topBwl: [
        { name: "Pragyan Ojha", team: "DCH", val: 21 }, { name: "Dale Steyn", team: "DCH", val: 17 },
        { name: "RP Singh", team: "DCH", val: 17 }, { name: "Munaf Patel", team: "MI", val: 18 },
        { name: "Zaheer Khan", team: "MI", val: 16 }, { name: "Ashish Nehra", team: "CSK", val: 15 },
        { name: "Piyush Chawla", team: "KKR", val: 15 }, { name: "Vinay Kumar", team: "RCB", val: 13 },
        { name: "Shaun Pollock", team: "MI", val: 14 }, { name: "Albie Morkel", team: "CSK", val: 13 },
      ],
    },
    {
      year: 2009, season: 2, champion: "Deccan Chargers", runnerUp: "Royal Challengers Bangalore",
      color: "#1B75BB", orangeCap: "Matthew Hayden", orangeRuns: 572, purpleCap: "RP Singh", purpleWkts: 23, mvp: "Adam Gilchrist",
      topBat: [
        { name: "Matthew Hayden", team: "CSK", val: 572 }, { name: "Adam Gilchrist", team: "DCH", val: 495 },
        { name: "Sachin Tendulkar", team: "MI", val: 418 }, { name: "Herschelle Gibbs", team: "DCH", val: 441 },
        { name: "AB de Villiers", team: "DD", val: 424 }, { name: "Michael Hussey", team: "CSK", val: 388 },
        { name: "Jacques Kallis", team: "KKR", val: 372 }, { name: "Ross Taylor", team: "RR", val: 366 },
        { name: "Rohit Sharma", team: "DCH", val: 362 }, { name: "Justin Kemp", team: "RR", val: 323 },
      ],
      topBwl: [
        { name: "RP Singh", team: "DCH", val: 23 }, { name: "Muttiah Muralitharan", team: "CSK", val: 21 },
        { name: "Pragyan Ojha", team: "DCH", val: 18 }, { name: "Vinay Kumar", team: "RCB", val: 18 },
        { name: "Dale Steyn", team: "DCH", val: 17 }, { name: "Amit Mishra", team: "DCH", val: 16 },
        { name: "Harbhajan Singh", team: "MI", val: 16 }, { name: "Pradeep Sangwan", team: "DD", val: 15 },
        { name: "Chaminda Vaas", team: "CSK", val: 14 }, { name: "Ishant Sharma", team: "KKR", val: 12 },
      ],
    },
    {
      year: 2008, season: 1, champion: "Rajasthan Royals", runnerUp: "Chennai Super Kings",
      color: "#FF2FA9", orangeCap: "Shaun Marsh", orangeRuns: 616, purpleCap: "Sohail Tanvir", purpleWkts: 22, mvp: "Shane Watson",
      topBat: [
        { name: "Shaun Marsh", team: "RR", val: 616 }, { name: "Matthew Hayden", team: "CSK", val: 572 },
        { name: "Brendon McCullum", team: "KKR", val: 519 }, { name: "Sachin Tendulkar", team: "MI", val: 510 },
        { name: "Yusuf Pathan", team: "RR", val: 435 }, { name: "Virender Sehwag", team: "DD", val: 390 },
        { name: "Adam Gilchrist", team: "PBKS", val: 383 }, { name: "Sourav Ganguly", team: "KKR", val: 368 },
        { name: "Gautam Gambhir", team: "DD", val: 362 }, { name: "Michael Hussey", team: "CSK", val: 349 },
      ],
      topBwl: [
        { name: "Sohail Tanvir", team: "RR", val: 22 }, { name: "RP Singh", team: "DCH", val: 19 },
        { name: "Ishant Sharma", team: "KKR", val: 17 }, { name: "Munaf Patel", team: "RR", val: 16 },
        { name: "Zaheer Khan", team: "DD", val: 16 }, { name: "Pragyan Ojha", team: "DCH", val: 15 },
        { name: "Amit Mishra", team: "DD", val: 15 }, { name: "Shane Bond", team: "KKR", val: 14 },
        { name: "Irfan Pathan", team: "PBKS", val: 14 }, { name: "Chaminda Vaas", team: "CSK", val: 13 },
      ],
    },
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
  };
  const TABS = [
    { id: "home", label: "Leaderboard" },
    { id: "teams", label: "Teams" },
    { id: "fixtures", label: "Matches" },
    { id: "stats", label: "Stats" },
    { id: "history", label: "History" },
  ];

  const rankLabel = (i: number) => i === 0 ? "first" : i === 1 ? "second" : i === 2 ? "third" : "";


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

  const renderHistory = () => {
    const s = historyYear ? IPL_HISTORY.find(h => h.year === historyYear) : null;

    // Trophy cabinet — titles per team, sorted desc
    const titleMap: Record<string, number> = {};
    IPL_HISTORY.forEach(h => { titleMap[h.champion] = (titleMap[h.champion] || 0) + 1; });
    const titleBoard = Object.entries(titleMap).sort((a, b) => b[1] - a[1]);

    return (
      <div>
        <div className="sec-title">IPL History</div>

        {/* TROPHY CABINET — always visible above filters */}
        {!s && (
          <div className="hist-cabinet">
            <div className="hist-cabinet-title">🏆 Trophy Cabinet</div>
            <div className="hist-cabinet-rows">
              {titleBoard.map(([team, count]) => {
                const b = IPL_TEAM_BADGE[team] || { abbr: "?", bg: "#444", fg: "#fff" };
                const barW = Math.round((count / titleBoard[0][1]) * 100);
                return (
                  <div key={team} className="hist-cabinet-row">
                    <TeamBadge name={team} size={28} />
                    <div className="hist-cabinet-info">
                      <div className="hist-cabinet-name">{team}</div>
                      <div className="hist-cabinet-bar-wrap">
                        <div className="hist-cabinet-bar" style={{ width: `${barW}%`, background: b.bg }} />
                      </div>
                    </div>
                    <div className="hist-cabinet-count" style={{ color: b.bg === "#F5C518" ? "#a37e00" : b.bg }}>
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Year filter grid */}
        {!s && (
          <div className="hist-yr-grid" data-no-swipe="true">
            <button
              className={`hist-yr-btn all-btn${historyYear === null ? " active" : ""}`}
              onClick={() => setHistoryYear(null)}
            >All Seasons</button>
            {IPL_HISTORY.map(h => (
              <button
                key={h.year}
                className={`hist-yr-btn${historyYear === h.year ? " active" : ""}`}
                style={historyYear === h.year ? { background: h.color + "22", borderColor: h.color, color: h.color } : {}}
                onClick={() => setHistoryYear(h.year)}
              >{h.year}</button>
            ))}
          </div>
        )}

        {/* DETAIL VIEW – single season */}
        {s && (
          <div>
            {/* Back nav */}
            <button className="hist-back-btn" onClick={() => setHistoryYear(null)}>
              ← All Seasons
            </button>
            {/* Champion hero card */}
            <div className="hist-hero" style={{ borderColor: s.color }}>
              <div className="hist-hero-year" style={{ color: s.color }}>Season {s.season} · IPL {s.year}</div>
              <div className="hist-hero-champion">
                <TeamBadge name={s.champion} size={44} />
                <div>
                  <div style={{ color: s.color, fontSize: "1.05rem", fontWeight: 800, lineHeight: 1.2 }}>{s.champion}</div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-3)", marginTop: 3, fontWeight: 500 }}>Champions</div>
                </div>
              </div>
              <div className="hist-hero-runner">
                <TeamBadge name={s.runnerUp} size={44} />
                <div>
                  <div style={{ color: "var(--text-2)", fontSize: "1.05rem", fontWeight: 800, lineHeight: 1.2 }}>{s.runnerUp}</div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-3)", marginTop: 3, fontWeight: 500 }}>Runner-up</div>
                </div>
              </div>
              <div className="hist-hero-awards">
                <div className="hist-hero-award">
                  <span style={{ fontSize: "0.65rem", color: "#f97316" }}><span style={{filter:"hue-rotate(175deg) saturate(3) brightness(1.1)"}}>🧢</span> Orange Cap</span>
                  <span className="hist-hero-aname">{s.orangeCap}</span>
                  <span className="hist-hero-aval">{s.orangeRuns} runs</span>
                </div>
                <div className="hist-hero-award">
                  <span style={{ fontSize: "0.65rem", color: "#7c3aed" }}><span style={{filter:"hue-rotate(25deg) saturate(4) brightness(0.5)"}}>🧢</span> Purple Cap</span>
                  <span className="hist-hero-aname">{s.purpleCap}</span>
                  <span className="hist-hero-aval">{s.purpleWkts} wkts</span>
                </div>
                <div className="hist-hero-award">
                  <span style={{ fontSize: "0.65rem", color: "#d4a843" }}><span style={{filter:"sepia(1) saturate(4) hue-rotate(5deg) brightness(1.1)"}}>🧢</span> MVP</span>
                  <span className="hist-hero-aname">{s.mvp}</span>
                  <span className="hist-hero-aval" style={{ color: "#d4a843" }}>Player of Tournament</span>
                </div>
              </div>
            </div>
            {/* Top 10 lists */}
            <div className="hist-top10-grid">
              <div className="hist-top10-col">
                <div className="hist-top10-hdr" style={{ color: "#f97316" }}><span style={{filter:"hue-rotate(175deg) saturate(3) brightness(1.1)"}}>🧢</span> Top Run-scorers</div>
                {s.topBat.map((p, i) => (
                  <div key={i} className="hist-top10-row">
                    <span className="hist-rk">{i + 1}</span>
                    <TeamBadge name={p.team} size={20} />
                    <span className="hist-pname">{p.name}</span>
                    <span className="hist-pval">{p.val}</span>
                  </div>
                ))}
              </div>
              <div className="hist-top10-col">
                <div className="hist-top10-hdr" style={{ color: "#7c3aed" }}><span style={{filter:"hue-rotate(25deg) saturate(4) brightness(0.5)"}}>🧢</span> Top Wicket-takers</div>
                {s.topBwl.map((p, i) => (
                  <div key={i} className="hist-top10-row">
                    <span className="hist-rk">{i + 1}</span>
                    <TeamBadge name={p.team} size={20} />
                    <span className="hist-pname">{p.name}</span>
                    <span className="hist-pval">{p.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ALL SEASONS compact list */}
        {!s && IPL_HISTORY.map(h => {
          const champAbbr = IPL_TEAM_BADGE[h.champion]?.abbr || h.champion;
          const ruAbbr    = IPL_TEAM_BADGE[h.runnerUp]?.abbr  || h.runnerUp;
          return (
            <div key={h.year} className="hist-card" onClick={() => setHistoryYear(h.year)}
              style={{ borderLeftColor: h.color }}>
              {/* Year column */}
              <div className="hist-card-left">
                <div className="hist-card-year" style={{ color: h.color }}>{h.year}</div>
                <div className="hist-card-sn">S{h.season}</div>
              </div>
              {/* Main content */}
              <div className="hist-card-main">
                {/* Champion row */}
                <div className="hist-card-row">
                  <TeamBadge name={h.champion} size={24} />
                  <span className="hist-card-champ" style={{ color: h.color }}>{champAbbr}</span>
                  <span className="hist-card-tag-winner">Champions</span>
                </div>
                {/* Runner-up row */}
                <div className="hist-card-row" style={{ marginTop: 5 }}>
                  <TeamBadge name={h.runnerUp} size={24} />
                  <span className="hist-card-ru">{ruAbbr}</span>
                  <span className="hist-card-tag-ru">Runner-up</span>
                </div>
                {/* Cap line */}
                <div className="hist-card-caps">
                  <span className="hist-cap-orange"><span style={{filter:"hue-rotate(175deg) saturate(3) brightness(1.1)"}}>🧢</span> {h.orangeCap.split(" ").slice(-1)[0]} {h.orangeRuns} runs</span>
                  <span className="hist-cap-purple"><span style={{filter:"hue-rotate(25deg) saturate(4) brightness(0.5)"}}>🧢</span> {h.purpleCap.split(" ").slice(-1)[0]} {h.purpleWkts} wks</span>
                </div>
              </div>
              <div className="hist-card-arrow">›</div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderHome = () => {
    return (
    <div>
      {/* Countdown to next match */}
      {countdown && (
        <div className="countdown-card" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div className="countdown-timer">{countdown.text}</div>
              <div className="countdown-label">Next Match</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="countdown-match">{countdown.matchName}</div>
              {countdown.venue && (
                <div style={{ fontSize: "0.6rem", color: "var(--text-3)", marginTop: 3 }}>
                  🏟 {countdown.venue}{countdown.homeTeam ? ` (${countdown.homeTeam})` : ""}
                </div>
              )}
            </div>
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
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 9, display: "flex", flexDirection: "column" as const, gap: 0 }}>
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
                            <span style={{ fontSize: "0.55rem", color: "var(--text-3)", letterSpacing: "0.05em", flexShrink: 0, minWidth: 90 }}>GROUND AVG</span>
                            <span style={{ fontSize: "0.68rem" }}>
                              <span style={{ fontWeight: 700, color: "var(--text)" }}>{vd.avg}</span>
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

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, marginTop: countdown ? 16 : 0 }}>
        <div className="sec-title" style={{ marginBottom: 0 }}>Leaderboard</div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {notifStatus === 'default' && (
            <button className="btn-primary" style={{ padding: "5px 9px", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: 4 }}
              onClick={enableNotifications} title="Enable match notifications">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span>Notify</span>
            </button>
          )}
          {notifStatus === 'granted' && (
            <button className="btn-primary" style={{ padding: "5px 9px", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: 4, borderColor: "rgba(34,197,94,0.4)", color: "var(--live)" }}
              onClick={disableNotifications} title="Notifications on — tap to turn off">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span>On</span>
            </button>
          )}
          <button className="btn-primary" style={{ padding: "6px 10px", display: "flex", alignItems: "center", gap: 5 }} onClick={shareLeaderboard} title="Share leaderboard">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            <span style={{ fontSize: "0.68rem" }}>Share</span>
          </button>
          <button className="btn-primary" style={{ padding: "5px 11px", fontSize: "0.7rem" }}
            onClick={() => { fetchLive(); fetchPoints(); }} disabled={liveLoading || pointsLoading}>
            {(liveLoading || pointsLoading) ? <span className="spinner" /> : null} Refresh
          </button>
        </div>
      </div>
      <div ref={lbContainerRef}>
      {teamScores.map((s, i) => (
        <div key={s.id} data-team-id={s.id} className={`lb-card ${i === 0 ? "rank-first" : ""}`} onClick={() => { setSelectedTeam(s.id); setTab("teams"); }}>
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
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div className={`lb-pts ${i === 0 ? "first" : ""}`} style={{ color: Object.keys(playerPoints).length === 0 ? "var(--text-3)" : s.team.color }}>
                {Object.keys(playerPoints).length === 0 ? "—" : s.total}
              </div>
              <div className="lb-pts-label">pts</div>
            </div>
          </div>
        </div>
      ))}
      </div>

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
                {m.toss && <div style={{ fontSize: "0.65rem", color: "var(--text-2)", marginTop: 5 }}>{m.toss}</div>}
                {m.venue && (
                  <div className="match-venue">
                    🏟 {m.venue}{m.homeTeamCode ? ` (${m.homeTeamCode})` : ""}
                  </div>
                )}
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div className="sec-title" style={{ marginBottom: 0 }}>Teams</div>
          <button className="btn-primary" style={{ padding: "6px 10px", display: "flex", alignItems: "center", gap: 5 }} onClick={shareTeams} title="Share all teams">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            <span style={{ fontSize: "0.68rem" }}>Share</span>
          </button>
        </div>
        <div className="team-tabs" data-no-swipe="true">
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
            <div className="team-htotal" style={{ color: Object.keys(playerPoints).length === 0 ? "var(--text-3)" : t.color }}>
              {Object.keys(playerPoints).length === 0 ? "—" : td.total}
            </div>
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
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="player-name" style={isLiveNow ? { color: "#fca5a5" } : {}}>{p.name}{p.name === t.captain ? <span style={{ marginLeft: 5, fontSize: "0.56rem", color: "#d4a843", fontWeight: 700 }}>C</span> : p.name === t.vc ? <span style={{ marginLeft: 5, fontSize: "0.56rem", color: "#a1a1aa", fontWeight: 700 }}>VC</span> : null}</div>
                          <Sparkline name={p.name} color={t.color} />
                        </div>
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
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="player-name" style={isLiveNow ? { color: "#fca5a5" } : {}}>{p.name}{p.name === t.captain ? <span style={{ marginLeft: 5, fontSize: "0.56rem", color: "#d4a843", fontWeight: 700 }}>C</span> : p.name === t.vc ? <span style={{ marginLeft: 5, fontSize: "0.56rem", color: "#a1a1aa", fontWeight: 700 }}>VC</span> : null}</div>
                          <Sparkline name={p.name} color={t.color + "88"} />
                        </div>
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
      if (teamFilter.size > 0) {
        const inMatch = (m.teamInfo || []).some((ti: any) => teamFilter.has(ti.shortname))
          || teamFilter.has(m.homeTeamCode) || teamFilter.has(m.awayTeamCode);
        if (!inMatch) return false;
        if (fixtureHomeAwayFilter === "home") return teamFilter.has(m.homeTeamCode);
        if (fixtureHomeAwayFilter === "away") return !teamFilter.has(m.homeTeamCode);
        return true;
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
              <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: "0.68rem", tableLayout: "fixed" as const }}>
                <colgroup>
                  <col style={{ width: 28 }} />
                  <col />
                  <col style={{ width: 30 }} />
                  <col style={{ width: 30 }} />
                  <col style={{ width: 30 }} />
                  <col style={{ width: 56 }} />
                  <col style={{ width: 34 }} />
                </colgroup>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["#","TEAM","M","W","L","NRR","PTS"].map((h, hi) => (
                      <th key={h} style={{
                        padding: "7px 0", fontWeight: 600, fontSize: "0.58rem", letterSpacing: "0.06em",
                        color: "var(--text-3)",
                        textAlign: (hi === 0 || hi === 1 ? "left" : "center") as "left"|"center",
                        paddingLeft: hi === 0 ? 12 : hi === 1 ? 4 : 0,
                        paddingRight: hi === 6 ? 12 : 0,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {standings.map((t: any, i: number) => {
                    const color = IPL_COLORS[t.teamCode] || "var(--text-3)";
                    const isTop4 = i < 4;
                    const isSelected = teamFilter.has(t.teamCode);
                    const logoUrl = TEAM_LOGO_CDN[t.teamCode] || t.teamLogo;
                    return (
                      <tr key={t.teamCode}
                        onClick={() => toggleTeamFilter(t.teamCode)}
                        style={{ borderBottom: "1px solid var(--border)", cursor: "pointer", background: isSelected ? color + "14" : "transparent", transition: "background 0.15s" }}>
                        <td style={{ padding: "8px 0 8px 12px", color: isTop4 ? "#22c55e" : "var(--text-3)", fontWeight: 700, fontSize: "0.68rem" }}>{i + 1}</td>
                        <td style={{ padding: "8px 4px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 2, height: 18, borderRadius: 2, background: color, flexShrink: 0 }} />
                            {logoUrl
                              ? <img src={logoUrl} alt={t.teamCode} style={{ width: 20, height: 20, objectFit: "contain", flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                              : <div style={{ width: 20, height: 20, borderRadius: "50%", background: color + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.5rem", fontWeight: 700, color, flexShrink: 0 }}>{t.teamCode.slice(0,2)}</div>
                            }
                            <span style={{ fontWeight: 700, color, fontSize: "0.68rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{t.teamCode}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: "center" as const, padding: "8px 0", color: "var(--text-2)", fontWeight: 500 }}>{t.matches}</td>
                        <td style={{ textAlign: "center" as const, padding: "8px 0", color: "#22c55e", fontWeight: 700 }}>{t.won}</td>
                        <td style={{ textAlign: "center" as const, padding: "8px 0", color: "#f87171", fontWeight: 500 }}>{t.lost}</td>
                        <td style={{ textAlign: "center" as const, padding: "8px 0", color: t.nrr >= 0 ? "#22c55e" : "#f87171", fontSize: "0.6rem", fontWeight: 500 }}>
                          {t.nrr >= 0 ? "+" : ""}{t.nrr.toFixed(3)}
                        </td>
                        <td style={{ textAlign: "center" as const, padding: "8px 12px 8px 0", fontSize: "0.82rem", fontWeight: 800, color }}>
                          {t.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "5px 12px", fontSize: "0.58rem", color: "var(--text-3)", borderTop: "1px solid var(--border)", letterSpacing: "0.04em" }}>
              Top 4 qualify for playoffs
            </div>
          </div>
        )}
        {/* Multi-team filter chips + Home/Away sub-pills */}
        {teamFilter.size > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, marginBottom: 8, alignItems: "center" }}>
              {Array.from(teamFilter).map(code => {
                const tc = IPL_COLORS[code] || "#888";
                return (
                  <div key={code} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: tc + "18", border: `1px solid ${tc}44`, fontSize: "0.68rem", fontWeight: 600, color: tc }}>
                    {code}
                    <button onClick={() => toggleTeamFilter(code)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1, color: "inherit", opacity: 0.6, fontSize: "0.72rem" }}>✕</button>
                  </div>
                );
              })}
              {teamFilter.size > 1 && (
                <button onClick={() => setTeamFilter(new Set())}
                  style={{ padding: "4px 10px", borderRadius: 20, fontSize: "0.62rem", fontWeight: 500, border: "1px solid var(--border)", background: "transparent", color: "var(--text-3)", cursor: "pointer", fontFamily: "inherit" }}>
                  Clear all
                </button>
              )}
            </div>
            <div data-no-swipe="true" style={{ display: "flex", gap: 6 }}>
              {([["all","All"], ["home","🏠 Home"], ["away","✈️ Away"]] as const).map(([f, label]) => {
                const anyColor = IPL_COLORS[Array.from(teamFilter)[0]] || "#888";
                return (
                  <button key={f} onClick={() => setFixtureHomeAwayFilter(f)}
                    style={{
                      padding: "4px 14px", borderRadius: 20, fontSize: "0.63rem", fontWeight: 600,
                      border: `1px solid ${fixtureHomeAwayFilter === f ? anyColor : "var(--border)"}`,
                      background: fixtureHomeAwayFilter === f ? anyColor + "22" : "transparent",
                      color: fixtureHomeAwayFilter === f ? anyColor : "var(--text-3)",
                      cursor: "pointer", fontFamily: "inherit",
                    }}>
                    {label}
                  </button>
                );
              })}
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
            {teamFilter.size > 0 ? `No ${activeFilter === "all" ? "" : activeFilter + " "}${fixtureHomeAwayFilter !== "all" ? fixtureHomeAwayFilter + " " : ""}matches for ${Array.from(teamFilter).join(" / ")}` : activeFilter === "live" ? "No live matches right now" : activeFilter === "upcoming" ? "No upcoming matches" : "No matches"}
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

              const isHome = teamFilter.size > 0 ? teamFilter.has(m.homeTeamCode) : null;
              return (
                <div key={m.id} className="match-card">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div className="match-status" style={{ color: statusColor }}>
                      {statusLabel}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {mNum && <div style={{ fontSize: "0.7rem", color: "var(--text-3)", fontWeight: 600 }}>{mNum}</div>}
                      {isHome !== null && (
                        <div style={{
                          fontSize: "0.55rem", fontWeight: 700, padding: "1px 6px", borderRadius: 8, letterSpacing: "0.06em",
                          background: isHome ? "rgba(52,211,153,0.12)" : "rgba(148,163,184,0.1)",
                          color: isHome ? "#34d399" : "#94a3b8",
                          border: `1px solid ${isHome ? "rgba(52,211,153,0.25)" : "rgba(148,163,184,0.2)"}`,
                        }}>
                          {isHome ? "HOME" : "AWAY"}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    {teams.length > 0 ? teams.map((ti: any, i: number) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        {i === 1 && <span style={{ color: "var(--text-3)", fontSize: "0.6rem", margin: "0 2px" }}>vs</span>}
                        <img src={TEAM_LOGO_CDN[ti.shortname] || ti.img} alt={ti.shortname} style={{ width: 18, height: 18, objectFit: "contain" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
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
                  {isLive && m.toss && <div style={{ fontSize: "0.65rem", color: "var(--text-2)", marginTop: 5 }}>{m.toss}</div>}
                  {m.venue && (
                    <div className="match-venue">
                      🏟 {m.venue}{m.homeTeamCode ? ` (${m.homeTeamCode})` : ""}
                    </div>
                  )}
                  {/* Prediction section — collapsible */}
                  {m.homeTeamCode && m.awayTeamCode && (() => {
                    const PRED_OWNERS = ["rajveer","mombasa","mumbai","ponygoat"] as const;
                    const preds = predictions[matchIdStr] || {};
                    const winner = isDone ? getMatchWinner(m) : null;
                    const isLocked = m.matchStarted;
                    const correctCount = winner && winner !== "tie"
                      ? PRED_OWNERS.filter(id => preds[id] === winner).length : 0;
                    const anyPick = PRED_OWNERS.some(id => preds[id]);
                    const pickCount = PRED_OWNERS.filter(id => preds[id]).length;
                    if (isDone && !anyPick) return null;
                    const isOpen = expandedPredMatchId === matchIdStr;
                    const togglePred = (e: React.MouseEvent) => {
                      e.stopPropagation();
                      setExpandedPredMatchId(isOpen ? null : matchIdStr);
                    };
                    // Collapsed summary line
                    const collapsedSummary = isDone && winner && winner !== "tie" && anyPick
                      ? `${winner} won · ${correctCount}/4 ✓`
                      : isDone && winner === "tie"
                      ? "Tied"
                      : isLocked
                      ? pickCount > 0 ? `${pickCount}/4 picked 🔒` : "🔒 Locked — no picks"
                      : pickCount > 0 ? `${pickCount}/4 picked` : "Tap to predict";
                    return (
                      <div onClick={e => e.stopPropagation()} style={{ marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 7 }}>
                        {/* Tappable header row */}
                        <div onClick={togglePred} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", userSelect: "none" as const }}>
                          <span style={{ fontSize: "0.57rem", color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.06em" }}>
                            {isDone ? "PREDICTIONS" : isLocked ? "🔒 PREDICTIONS" : "📊 PREDICT"}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: "0.57rem", color: "var(--text-3)" }}>{collapsedSummary}</span>
                            <span style={{ fontSize: "0.55rem", color: "var(--text-3)", transition: "transform 0.2s", display: "inline-block", transform: isOpen ? "rotate(180deg)" : "none" }}>▼</span>
                          </div>
                        </div>
                        {/* Expandable grid */}
                        {isOpen && (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 8 }}>
                            {PRED_OWNERS.map(ownerId => {
                              const ft = FANTASY_TEAMS[ownerId];
                              const pick = preds[ownerId] || null;
                              const isCorrect = !!winner && winner !== "tie" && pick === winner;
                              const isWrong = !!winner && winner !== "tie" && pick !== null && pick !== winner;
                              return (
                                <div key={ownerId} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 7px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)" }}>
                                  <span style={{ fontSize: "0.6rem", color: ft.color, fontWeight: 700, minWidth: 30, flexShrink: 0 }}>{ft.owner}</span>
                                  {(isLocked || ownerId !== currentUser) ? (
                                    <div style={{ display: "flex", alignItems: "center", gap: 3, flex: 1 }}>
                                      {pick ? (
                                        <>
                                          <img src={TEAM_LOGO_CDN[pick]} alt={pick} style={{ width: 14, height: 14, objectFit: "contain" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                          <span style={{ fontSize: "0.62rem", fontWeight: 600, color: isCorrect ? "#22c55e" : isWrong ? "#f87171" : "var(--text-2)" }}>{pick}</span>
                                          {isCorrect && <span style={{ fontSize: "0.65rem", color: "#22c55e" }}>✓</span>}
                                          {isWrong && <span style={{ fontSize: "0.65rem", color: "#f87171" }}>✗</span>}
                                        </>
                                      ) : (
                                        <span style={{ fontSize: "0.6rem", color: "var(--text-3)", fontStyle: "italic" }}>—</span>
                                      )}
                                    </div>
                                  ) : (
                                    <div style={{ display: "flex", gap: 3, flex: 1 }}>
                                      {[m.homeTeamCode, m.awayTeamCode].map((code: string) => (
                                        <button key={code} onClick={e => {
                                          e.stopPropagation();
                                          const newPick = pick === code ? null : code;
                                          setPredictions(prev => {
                                            const updated = { ...prev, [matchIdStr]: { ...(prev[matchIdStr] || {}), [ownerId]: newPick } };
                                            saveLocalPreds(updated);
                                            return updated;
                                          });
                                          fetch(`/api/ipl/predictions/${encodeURIComponent(matchIdStr)}`, {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ ownerId, pick: newPick }),
                                          }).then(r => r.json()).then(d => { if (d.predictions) { saveLocalPreds(d.predictions); setPredictions(d.predictions); } }).catch(() => {});
                                        }} style={{
                                          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 2,
                                          padding: "3px 2px", borderRadius: 6, cursor: "pointer", border: "1px solid",
                                          fontFamily: "inherit", fontSize: "0.58rem", fontWeight: 600,
                                          background: pick === code ? `${ft.color}22` : "transparent",
                                          borderColor: pick === code ? ft.color : "var(--border)",
                                          color: pick === code ? "var(--text)" : "var(--text-3)",
                                          transition: "all 0.15s",
                                        }}>
                                          <img src={TEAM_LOGO_CDN[code]} alt={code} style={{ width: 11, height: 11, objectFit: "contain" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                          <span>{code}</span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  {/* Scorecard collapsible — live and completed matches only */}
                  {(isDone || isLive) && (
                    <div style={{ marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 7 }}
                      onClick={e => e.stopPropagation()}>
                      {/* Toggle header */}
                      <div onClick={() => toggleMatch(matchIdStr, true)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" as const }}>
                        <span style={{ fontSize: "0.55rem", color: "var(--text-3)", letterSpacing: "0.05em" }}>SCORECARD</span>
                        <span style={{ fontSize: "0.55rem", color: "var(--text-3)", display: "inline-block", transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "none" }}>▼</span>
                      </div>
                      {isExpanded && (
                        <div style={{ marginTop: 10 }}>
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
          {([["all", "All IPL"], ["fantasy", "Fantasy Only"], ["predictions", "Predictions"]] as [string, string][]).map(([f, label]) => (
            <button key={f} onClick={() => { setStatsFilter(f as any); setStatsExpanded(false); }}
              style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: "1px solid", fontSize: "0.68rem", fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                background: statsFilter === f ? "var(--surface-2)" : "transparent",
                borderColor: statsFilter === f ? "var(--border-2)" : "var(--border)",
                color: statsFilter === f ? (f === "fantasy" ? "#22c55e" : f === "predictions" ? "#a78bfa" : "var(--text)") : "var(--text-3)" }}>
              {label}
            </button>
          ))}
        </div>

        {statsFilter !== "predictions" && (
          <div data-no-swipe="true" style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 12, marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16 }}>
            {STAT_CATS.map(c => (
              <button key={c.id} onClick={() => { setStatsCategory(c.id); setStatsExpanded(false); }} className={`stats-cat-btn ${statsCategory === c.id ? "active" : ""}`}>
                {c.label}
              </button>
            ))}
          </div>
        )}

        {statsFilter === "predictions" ? (() => {
          const PRED_OWNERS = ["rajveer","mombasa","mumbai","ponygoat"] as const;
          const sortedMatches = [...liveMatches]
            .filter((m: any) => m.homeTeamCode && m.awayTeamCode)
            .sort((a: any, b: any) => {
              if (a.dateTimeGMT && b.dateTimeGMT) return new Date(a.dateTimeGMT).getTime() - new Date(b.dateTimeGMT).getTime();
              return (a.id || 0) - (b.id || 0);
            })
            .map((m: any, idx: number) => ({ ...m, matchNum: idx + 1 }));

          const ownerScores: Record<string, number> = Object.fromEntries(PRED_OWNERS.map(id => [id, 0]));
          sortedMatches.forEach((m: any) => {
            if (m.matchNum <= 3 || !m.matchEnded) return;
            const winner = getMatchWinner(m);
            if (!winner || winner === "tie") return;
            const preds = predictions[String(m.id)] || {};
            PRED_OWNERS.forEach(id => { if (preds[id] === winner) ownerScores[id]++; });
          });

          const totalScorable = sortedMatches.filter((m: any) => m.matchNum > 3 && m.matchEnded).length;

          return (
            <>
              {/* Score cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 12 }}>
                {PRED_OWNERS.map(id => {
                  const ft = FANTASY_TEAMS[id];
                  return (
                    <div key={id} style={{ background: "var(--surface)", border: `1px solid ${ft.color}33`, borderRadius: 10, padding: "10px 4px", textAlign: "center" as const }}>
                      <div style={{ fontSize: "0.6rem", marginBottom: 4 }}>{ft.emoji}</div>
                      <div style={{ fontSize: "1.3rem", fontWeight: 800, color: ft.color, lineHeight: 1 }}>{ownerScores[id]}</div>
                      <div style={{ fontSize: "0.55rem", color: "var(--text-3)", marginTop: 2 }}>{ft.owner}</div>
                      {totalScorable > 0 && <div style={{ fontSize: "0.5rem", color: "var(--text-3)" }}>/{totalScorable}</div>}
                    </div>
                  );
                })}
              </div>

              {/* Match table */}
              {(() => {
                const archiveMatches = sortedMatches.filter((m: any) => m.matchEnded);
                const currentMatches = sortedMatches.filter((m: any) => !m.matchEnded);
                const visibleCurrent = currentMatches.slice(0, predVisibleCount);
                const hasMoreCurrent = currentMatches.length > predVisibleCount;

                const tableHeader = (
                  <div style={{ display: "grid", gridTemplateColumns: "34px 1fr repeat(4, 36px)", padding: "8px 12px", borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", alignItems: "center" }}>
                    <div style={{ fontSize: "0.56rem", color: "var(--text-3)", fontWeight: 700, letterSpacing: "0.08em" }}>#</div>
                    <div style={{ fontSize: "0.56rem", color: "var(--text-3)", fontWeight: 700, letterSpacing: "0.08em" }}>MATCH</div>
                    {PRED_OWNERS.map(id => (
                      <div key={id} style={{ fontSize: "0.56rem", color: FANTASY_TEAMS[id].color, fontWeight: 700, textAlign: "center" as const }}>
                        {FANTASY_TEAMS[id].owner.slice(0,3).toUpperCase()}
                      </div>
                    ))}
                  </div>
                );

                const renderRow = (m: any, isLast: boolean) => {
                  const isNil = m.matchNum <= 3;
                  const isDone = m.matchEnded;
                  const isLive = m.matchStarted && !m.matchEnded;
                  const isUpcoming = !m.matchStarted;
                  const winner = isDone ? getMatchWinner(m) : null;
                  const preds = predictions[String(m.id)] || {};
                  const picksIn = !isNil ? PRED_OWNERS.filter(id => preds[id]).length : 0;
                  return (
                    <div key={m.id} style={{ display: "grid", gridTemplateColumns: "34px 1fr repeat(4, 36px)", padding: "8px 12px", borderBottom: isLast ? "none" : "1px solid var(--border)", alignItems: "center" }}>
                      <div style={{ fontSize: "0.65rem", fontWeight: 700, color: isLive ? "var(--live)" : "var(--text-3)" }}>
                        {m.matchNum === 999 ? "?" : `M${m.matchNum}`}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: "0.68rem", fontWeight: 600, whiteSpace: "nowrap" as const }}>
                          <span style={{ color: winner === m.homeTeamCode ? "#22c55e" : "var(--text-2)" }}>{m.homeTeamCode}</span>
                          <span style={{ color: "var(--text-3)", padding: "0 3px", fontSize: "0.55rem" }}>vs</span>
                          <span style={{ color: winner === m.awayTeamCode ? "#22c55e" : "var(--text-2)" }}>{m.awayTeamCode}</span>
                        </div>
                        {isNil && <div style={{ fontSize: "0.5rem", color: "var(--text-3)", fontStyle: "italic" }}>no predictions</div>}
                        {isLive && <div style={{ fontSize: "0.5rem", color: "var(--live)" }}>● Live</div>}
                        {isUpcoming && !isNil && picksIn > 0 && <div style={{ fontSize: "0.5rem", color: "var(--text-3)" }}>{picksIn}/4 picked</div>}
                        {isUpcoming && !isNil && picksIn === 0 && <div style={{ fontSize: "0.5rem", color: "var(--text-3)" }}>open</div>}
                      </div>
                      {PRED_OWNERS.map(id => {
                        if (isNil) return <div key={id} style={{ textAlign: "center" as const, fontSize: "0.6rem", color: "var(--text-3)" }}>—</div>;
                        const pick = preds[id] || null;
                        if (!pick) return (
                          <div key={id} style={{ textAlign: "center" as const, fontSize: "0.65rem", color: "var(--text-3)" }}>
                            {isUpcoming ? <span style={{ opacity: 0.4 }}>?</span> : "—"}
                          </div>
                        );
                        const isCorrect = !!winner && winner !== "tie" && pick === winner;
                        const isWrong = !!winner && winner !== "tie" && pick !== winner;
                        const isPending = !isDone && !isLive;
                        return (
                          <div key={id} style={{ textAlign: "center" as const }}>
                            <div style={{ fontSize: "0.58rem", fontWeight: 700, lineHeight: 1.2, color: isCorrect ? "#22c55e" : isWrong ? "#f87171" : isPending ? "var(--text-3)" : "var(--text-2)" }}>{pick}</div>
                            {isCorrect && <div style={{ fontSize: "0.6rem", color: "#22c55e", lineHeight: 1 }}>✓</div>}
                            {isWrong && <div style={{ fontSize: "0.6rem", color: "#f87171", lineHeight: 1 }}>✗</div>}
                            {isLive && pick && <div style={{ fontSize: "0.48rem", color: "var(--text-3)", lineHeight: 1 }}>locked</div>}
                          </div>
                        );
                      })}
                    </div>
                  );
                };

                return (
                  <>
                    {/* Archive section — all completed matches */}
                    {archiveMatches.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <button
                          onClick={() => setPredArchiveOpen(o => !o)}
                          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "transparent", border: "1px solid var(--border)", borderRadius: predArchiveOpen ? "10px 10px 0 0" : 10, padding: "7px 12px", cursor: "pointer", color: "var(--text-3)", fontSize: "0.65rem", fontFamily: "inherit", marginBottom: 0 }}>
                          <span style={{ fontSize: "0.7rem" }}>{predArchiveOpen ? "▲" : "▼"}</span>
                          {predArchiveOpen ? "Hide" : "Show"} {archiveMatches.length} completed match{archiveMatches.length !== 1 ? "es" : ""}
                        </button>
                        {predArchiveOpen && (
                          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden", opacity: 0.55, marginBottom: 10 }}>
                            {tableHeader}
                            {archiveMatches.map((m: any, idx: number) => renderRow(m, idx === archiveMatches.length - 1))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Current / upcoming matches */}
                    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", marginBottom: 4 }}>
                      {tableHeader}
                      {currentMatches.length === 0 && sortedMatches.length === 0 && (
                        <div style={{ padding: "20px 12px", fontSize: "0.75rem", color: "var(--text-3)", textAlign: "center" as const }}>Matches loading...</div>
                      )}
                      {currentMatches.length === 0 && sortedMatches.length > 0 && (
                        <div style={{ padding: "16px 12px", fontSize: "0.72rem", color: "var(--text-3)", textAlign: "center" as const }}>All matches completed — see archive above</div>
                      )}
                      {visibleCurrent.map((m: any, idx: number) => renderRow(m, idx === visibleCurrent.length - 1))}
                    </div>
                    {(hasMoreCurrent || predVisibleCount > 10) && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 2px 2px" }}>
                        {predVisibleCount > 10 ? (
                          <button onClick={() => setPredVisibleCount(c => Math.max(10, c - 10))}
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 20, padding: "5px 12px", cursor: "pointer", fontSize: "0.63rem", color: "var(--text-3)", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
                            <span>↑</span><span>Less</span>
                          </button>
                        ) : <div />}
                        <span style={{ fontSize: "0.58rem", color: "var(--text-3)" }}>
                          {Math.min(predVisibleCount, currentMatches.length) + archiveMatches.length} of {sortedMatches.length}
                        </span>
                        {hasMoreCurrent ? (
                          <button onClick={() => setPredVisibleCount(c => c + 10)}
                            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 20, padding: "5px 12px", cursor: "pointer", fontSize: "0.63rem", color: "var(--text-3)", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
                            <span>More</span><span>↓</span>
                          </button>
                        ) : <div />}
                      </div>
                    )}

                    <div style={{ fontSize: "0.58rem", color: "var(--text-3)", textAlign: "center" as const, padding: "2px 0 8px" }}>
                      Matches 1–3 had no predictions · +1 for each correct pick · picks refresh every 30s
                    </div>
                  </>
                );
              })()}
            </>
          );
        })() : (
          <>
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
          </>
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
        {/* PIN Management */}
        <div style={{ background: "rgba(15,21,32,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" as const, color: "#94a3b8", marginBottom: 14 }}>
            🔐 User PINs
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
            {Object.values(FANTASY_TEAMS).map(ft => (
              <div key={ft.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "1rem" }}>{ft.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.7rem", fontWeight: 600, color: ft.color }}>{ft.owner}</div>
                  <div style={{ fontSize: "0.58rem", color: "#52525b" }}>{ft.name}</div>
                </div>
                {pinEditTarget === ft.id ? (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="\d{4}"
                      maxLength={4}
                      value={pinEditVal}
                      onChange={e => setPinEditVal(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="0000"
                      style={{ width: 52, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, padding: "4px 8px", color: "#e4e4e7", fontSize: "0.8rem", fontFamily: "inherit", textAlign: "center" as const, letterSpacing: "3px" }}
                      autoFocus
                    />
                    <button onClick={() => handleSavePin(ft.id)} style={{ background: `${ft.color}22`, border: `1px solid ${ft.color}50`, borderRadius: 8, padding: "4px 10px", cursor: "pointer", color: ft.color, fontSize: "0.65rem", fontFamily: "inherit", fontWeight: 600 }}>Save</button>
                    <button onClick={() => { setPinEditTarget(null); setPinEditVal(""); }} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "4px 8px", cursor: "pointer", color: "#52525b", fontSize: "0.65rem", fontFamily: "inherit" }}>✕</button>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: "0.75rem", letterSpacing: "3px", color: "#3f3f46", fontFamily: "monospace" }}>••••</span>
                    {(currentUser === "rajveer" || ft.id === currentUser) && (
                      <button onClick={() => { setPinEditTarget(ft.id); setPinEditVal(userPins[ft.id] || ""); }} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "4px 10px", cursor: "pointer", color: "#71717a", fontSize: "0.65rem", fontFamily: "inherit" }}>Change</button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        {currentUser === "rajveer" && <div style={{ background: "rgba(15,21,32,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
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
                Points last updated: {pointsLastUpdated.toLocaleTimeString()} · Auto-refreshes every 5 min
              </div>
            )}
          </div>
        </div>}
        <div style={{ background: "rgba(15,21,32,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <div
            onClick={() => setAdminBreakdownOpen(o => !o)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: adminBreakdownOpen ? 12 : 0 }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" as const, color: "#94a3b8" }}>
              📊 Player Points Breakdown
            </span>
            <span style={{ fontSize: "0.65rem", color: "#475569" }}>{adminBreakdownOpen ? "▲" : "▼"} {Object.keys(playerPoints).length} players</span>
          </div>
          {adminBreakdownOpen && Object.keys(playerPoints).length === 0 && (
            <div style={{ color: "#334155", fontSize: "0.8rem", padding: "8px 0" }}>
              {pointsLoading ? "⏳ Calculating points from scorecards..." : "Points will appear once matches complete and scorecards are processed."}
            </div>
          )}
          {adminBreakdownOpen && Object.keys(playerPoints).length > 0 && Object.entries(playerPoints).sort((a, b) => b[1] - a[1]).map(([name, pts]) => {
            const team = Object.values(FANTASY_TEAMS).find(t => t.players.some(p => p.name === name));
            const isExp = expandedAdminPlayer === name;
            const matches = playerMatchPoints[name] || [];
            const isCap = Object.values(FANTASY_TEAMS).some(t => t.captain === name);
            const isVC = Object.values(FANTASY_TEAMS).some(t => t.vc === name);
            return (
              <div key={name} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div
                  onClick={() => setExpandedAdminPlayer(isExp ? null : name)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", cursor: "pointer" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: "0.78rem", color: "#cbd5e1" }}>{name}</span>
                      {isCap && <span style={{ fontSize: "0.52rem", fontWeight: 700, color: "#d4a843", background: "rgba(212,168,67,0.12)", borderRadius: 3, padding: "1px 4px" }}>C</span>}
                      {isVC && <span style={{ fontSize: "0.52rem", fontWeight: 700, color: "#a1a1aa", background: "rgba(161,161,170,0.1)", borderRadius: 3, padding: "1px 4px" }}>VC</span>}
                    </div>
                    {team && <div style={{ fontSize: "0.6rem", color: "#475569", marginTop: 1 }}>{team.name} · {team.owner}</div>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "'Bebas Neue'", fontSize: "1.1rem", color: "#f97316", letterSpacing: "1px" }}>{pts}</span>
                    {matches.length > 0 && <span style={{ fontSize: "0.6rem", color: "#475569" }}>{isExp ? "▲" : "▼"}</span>}
                  </div>
                </div>
                {isExp && matches.length > 0 && (
                  <div style={{ marginBottom: 8, padding: "8px 10px", background: "rgba(255,255,255,0.02)", borderRadius: 8, display: "flex", flexDirection: "column" as const, gap: 5 }}>
                    {matches.map((m, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem" }}>
                        <div>
                          <span style={{ color: "var(--text-2)" }}>{m.label}</span>
                          {m.source === "official" && <span style={{ marginLeft: 5, fontSize: "0.55rem", color: "#34d399", background: "rgba(52,211,153,0.1)", borderRadius: 3, padding: "1px 4px" }}>official</span>}
                          {(m.source || "").includes("live") && <span style={{ marginLeft: 5, fontSize: "0.55rem", color: "#fbbf24", background: "rgba(251,191,36,0.1)", borderRadius: 3, padding: "1px 4px" }}>live</span>}
                        </div>
                        <span style={{ fontWeight: 700, color: m.pts > 0 ? "#f97316" : "var(--text-3)" }}>{m.pts > 0 ? "+" : ""}{m.pts}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 2, paddingTop: 5, display: "flex", justifyContent: "space-between", fontSize: "0.72rem", fontWeight: 700 }}>
                      <span style={{ color: "var(--text-3)" }}>Total (raw)</span>
                      <span style={{ color: "#f97316" }}>{matches.reduce((s, m) => s + m.pts, 0)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
          <button className="btn-primary" onClick={() => { fetchLive(); fetchPoints(); }} disabled={liveLoading || pointsLoading}>
            {(liveLoading || pointsLoading) ? <span className="spinner" /> : "🔄"} Refresh All
          </button>
          {currentUser === "rajveer" && <>
            <button className="btn-primary" style={{ background: "rgba(96,165,250,0.1)", borderColor: "rgba(96,165,250,0.3)", color: "#60a5fa" }}
              onClick={fetchPoints} disabled={pointsLoading}>
              {pointsLoading ? <span className="spinner" /> : "⚡"} Fetch Points
            </button>
            <button
              className="btn-primary"
              style={{
                background: liveAlertsEnabled ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.04)",
                borderColor: liveAlertsEnabled ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.1)",
                color: liveAlertsEnabled ? "var(--live)" : "var(--text-2)",
                minWidth: 160,
              }}
              disabled={liveAlertsLoading}
              onClick={async () => {
                setLiveAlertsLoading(true);
                try {
                  const res = await fetch("/api/push/live-alerts/toggle", { method: "POST" });
                  const d = await res.json();
                  setLiveAlertsEnabled(d.enabled);
                } finally {
                  setLiveAlertsLoading(false);
                }
              }}>
              {liveAlertsLoading ? <span className="spinner" /> : (liveAlertsEnabled ? "🔔 Live Alerts: ON" : "🔔 Live Alerts: OFF")}
            </button>
            <button className="btn-danger" onClick={async () => {
              if (confirm("Reset all cached points? Points will re-sync from AuctionRoom.")) {
                await fetch("/api/ipl/points/reset", { method: "POST" });
                setPlayerPoints({});
                setProcessedMatches([]);
                setTimeout(fetchPoints, 500);
              }
            }}>🗑️ Reset Cache</button>
          </>}
        </div>
        {lastUpdated && (
          <div style={{ fontSize: "0.65rem", color: "#334155", marginTop: 10 }}>
            Schedule last updated: {lastUpdated.toLocaleTimeString()} · Total points tracked: {totalPts}
          </div>
        )}
      </div>
    );
  };

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

  if (!currentUser) return <LoginScreen onLogin={handleLogin} pins={userPins} />;

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
      <div className={`app${isDark ? "" : " light-mode"}`}
        onTouchStart={handleSwipeStart}
        onTouchEnd={handleSwipeEnd}
      >
        <div className="bg-field" />
        <div className="content">
          <div className="header">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
                <span className="header-title">IPL Fantasy</span>
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
              {(() => {
                const cu = FANTASY_TEAMS[currentUser!];
                return (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, background: `${cu.color}15`, border: `1px solid ${cu.color}40`, borderRadius: 20, padding: "3px 8px 3px 5px" }}>
                      <span style={{ fontSize: "0.9rem" }}>{cu.emoji}</span>
                      <span style={{ fontSize: "0.68rem", fontWeight: 600, color: cu.color }}>{cu.owner}</span>
                    </div>
                    <button onClick={handleLogout} title="Log out" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "4px 7px", cursor: "pointer", color: "#52525b", fontSize: "0.65rem", fontFamily: "inherit" }}>Logout</button>
                  </div>
                );
              })()}
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
          {tab === "history" && renderHistory()}
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
