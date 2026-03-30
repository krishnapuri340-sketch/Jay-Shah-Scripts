import { FANTASY_TEAMS } from "./teams";

export function applyMultiplier(raw: number, isCaptain: boolean, isVC: boolean): number {
  if (isCaptain) return raw * 2;
  if (isVC) return Math.floor(raw * 1.5);
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
