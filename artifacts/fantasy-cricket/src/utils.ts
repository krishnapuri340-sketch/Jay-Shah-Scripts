import { FANTASY_TEAMS } from "./teams";

export function getMatchWinner(m: any): string | null {
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

export function applyMultiplier(raw: number, isCaptain: boolean, isVC: boolean): number {
  if (isCaptain) return raw * 2;
  if (isVC) return raw * 1.5;
  return raw;
}

export function getTeamData(teamId: string, playerPoints: Record<string, number>) {
  const team = FANTASY_TEAMS[teamId];
  const players = team.players.map(p => {
    const raw = playerPoints[p.name] || 0;
    const adj = applyMultiplier(raw, p.name === team.captain, p.name === team.vc);
    return { ...p, raw, adj };
  }).sort((a, b) => b.adj - a.adj);
  const top11 = new Set(players.slice(0, 11).map(p => p.name));
  const total = players.filter(p => top11.has(p.name)).reduce((s, p) => s + p.adj, 0);
  return { total, players, top11 };
}

export const IPL_H2H: Record<string, [number, number]> = {
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

export function getH2H(a: string, b: string): { aWins: number; bWins: number } | null {
  const sorted = [a, b].sort();
  const data = IPL_H2H[sorted.join("-")];
  if (!data) return null;
  return sorted[0] === a ? { aWins: data[0], bWins: data[1] } : { aWins: data[1], bWins: data[0] };
}

export const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }); }
  catch { return d || ""; }
};
export const fmtTime = (dt: string) => {
  try { return new Date(dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " local"; }
  catch { return ""; }
};
export const getMatchNum = (name: string) => {
  const mx = (name || "").match(/(\d+)(?:st|nd|rd|th) Match/i);
  return mx ? "M" + mx[1] : "";
};

const TEAM_BATTING: Record<string, number> = {
  SRH: 8.8, RCB: 8.5, MI: 8.3, KKR: 8.1, RR: 8.0,
  GT: 7.8, DC: 7.6, CSK: 7.5, PBKS: 7.3, LSG: 7.2,
};
const TEAM_BOWLING: Record<string, number> = {
  MI: 8.5, SRH: 8.0, KKR: 7.9, PBKS: 7.8, DC: 7.6,
  CSK: 7.5, GT: 7.5, RR: 7.2, LSG: 7.0, RCB: 6.8,
};
const _LEAGUE_BAT = 7.8;
const _LEAGUE_BOWL = 7.6;

export function predictFirstInningsTotal(homeCode: string, awayCode: string, venueAvg: number): number {
  const hBat = TEAM_BATTING[homeCode] ?? _LEAGUE_BAT;
  const aBat = TEAM_BATTING[awayCode] ?? _LEAGUE_BAT;
  const hBowl = TEAM_BOWLING[homeCode] ?? _LEAGUE_BOWL;
  const aBowl = TEAM_BOWLING[awayCode] ?? _LEAGUE_BOWL;
  const avgBat = (hBat + aBat) / 2;
  const avgBowl = (hBowl + aBowl) / 2;
  const batFactor = (avgBat - _LEAGUE_BAT) / _LEAGUE_BAT;
  const bowlFactor = (avgBowl - _LEAGUE_BOWL) / _LEAGUE_BOWL;
  const net = batFactor - bowlFactor * 0.65;
  return Math.round(venueAvg * (1 + net));
}

export function predictNextMatch(homeCode: string, awayCode: string): { pick: string | null; reason: string; homeW: number; awayW: number } {
  const h2h = getH2H(homeCode, awayCode);
  let homeScore = 1.0, awayScore = 0.0;

  if (h2h) {
    const diff = h2h.aWins - h2h.bWins;
    if (diff > 0) homeScore += Math.min(diff * 0.18, 2.2);
    else awayScore += Math.min(Math.abs(diff) * 0.18, 2.2);
  }

  const homeBat = TEAM_BATTING[homeCode] ?? _LEAGUE_BAT;
  const homeBowl = TEAM_BOWLING[homeCode] ?? _LEAGUE_BOWL;
  const awayBat = TEAM_BATTING[awayCode] ?? _LEAGUE_BAT;
  const awayBowl = TEAM_BOWLING[awayCode] ?? _LEAGUE_BOWL;
  const homeStr = homeBat + homeBowl;
  const awayStr = awayBat + awayBowl;
  const squadDiff = homeStr - awayStr;
  if (squadDiff > 0) homeScore += Math.min(squadDiff * 0.28, 1.6);
  else awayScore += Math.min(Math.abs(squadDiff) * 0.28, 1.6);

  const edge = homeScore - awayScore;
  if (Math.abs(edge) < 0.4) return { pick: null, reason: "Too close to call", homeW: homeScore, awayW: awayScore };

  const pick = edge > 0 ? homeCode : awayCode;
  const isHome = pick === homeCode;
  const h2hLeads = h2h ? (isHome ? h2h.aWins > h2h.bWins : h2h.bWins > h2h.aWins) : false;
  const pickedStr = isHome ? homeStr : awayStr;
  const oppStr = isHome ? awayStr : homeStr;
  const squadEdge = pickedStr - oppStr;

  let reason: string;
  if (squadEdge > 1.8 && h2hLeads) reason = "Stronger squad + H2H dominance";
  else if (squadEdge > 1.8) reason = "Clear squad quality edge";
  else if (squadEdge > 0.8 && h2hLeads) reason = "H2H edge + stronger squad";
  else if (squadEdge > 0.8) reason = "Better batting & bowling lineup";
  else if (h2hLeads && Math.abs(edge) > 1.2) reason = "Strong H2H edge";
  else if (h2hLeads) reason = "H2H + home advantage";
  else if (squadEdge > 0) reason = "Slight squad advantage";
  else reason = "Home advantage";

  return { pick, reason, homeW: homeScore, awayW: awayScore };
}

export const rankLabel = (i: number) => i === 0 ? "first" : i === 1 ? "second" : i === 2 ? "third" : "";
