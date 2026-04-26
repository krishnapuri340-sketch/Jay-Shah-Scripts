import React, { createContext, useContext, useMemo } from "react";
import { useFantasyPoints, type PlayerMatchPointsMap } from "../hooks/useFantasyPoints";
import { useStandings } from "../hooks/useStandings";
import { FANTASY_TEAMS } from "../teams";
import { getTeamData, applyMultiplier } from "../utils";

interface PointsContextValue {
  playerPoints: Record<string, number>;
  setPlayerPoints: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  playerMatchPoints: PlayerMatchPointsMap;
  setPlayerMatchPoints: React.Dispatch<React.SetStateAction<PlayerMatchPointsMap>>;
  iplIdToMatchNum: Record<string, number>;
  setIplIdToMatchNum: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  pointsLoading: boolean;
  pointsError: string | null;
  setPointsError: React.Dispatch<React.SetStateAction<string | null>>;
  pointsLastUpdated: Date | null;
  setPointsLastUpdated: React.Dispatch<React.SetStateAction<Date | null>>;
  pointsUpdating: boolean;
  setPointsUpdating: React.Dispatch<React.SetStateAction<boolean>>;
  pendingMatches: number;
  setPendingMatches: React.Dispatch<React.SetStateAction<number>>;
  nextAttempt: string | null;
  setNextAttempt: React.Dispatch<React.SetStateAction<string | null>>;
  processedMatches: string[];
  setProcessedMatches: React.Dispatch<React.SetStateAction<string[]>>;
  abandonedMatchIds: string[];
  setAbandonedMatchIds: React.Dispatch<React.SetStateAction<string[]>>;
  fetchPoints: () => void;
  resetRetries: () => void;
  standings: any[];
  setStandings: React.Dispatch<React.SetStateAction<any[]>>;
  standingsLoading: boolean;
  fetchStandings: () => void;
  teamScores: Array<{ id: string; total: number; team: (typeof FANTASY_TEAMS)[string]; [k: string]: any }>;
  matchHistory: Array<{
    teamId: string;
    color: string;
    name: string;
    emoji: string;
    points: Array<{ matchNum: number; label: string; cum: number }>;
  }>;
  hotPlayers: Set<string>;
}

const PointsContext = createContext<PointsContextValue | null>(null);

export function PointsProvider({ children }: { children: React.ReactNode }) {
  const {
    playerPoints, setPlayerPoints,
    playerMatchPoints, setPlayerMatchPoints,
    iplIdToMatchNum, setIplIdToMatchNum,
    pointsLoading,
    pointsError, setPointsError,
    pointsLastUpdated, setPointsLastUpdated,
    pointsUpdating, setPointsUpdating,
    pendingMatches, setPendingMatches,
    nextAttempt, setNextAttempt,
    processedMatches, setProcessedMatches,
    abandonedMatchIds, setAbandonedMatchIds,
    fetchPoints,
    resetRetries,
  } = useFantasyPoints();

  const { standings, setStandings, standingsLoading, fetchStandings } = useStandings();

  const teamScores = useMemo(
    () =>
      Object.keys(FANTASY_TEAMS)
        .map(id => ({ id, ...getTeamData(id, playerPoints), team: FANTASY_TEAMS[id] }))
        .sort((a, b) => b.total - a.total),
    [playerPoints]
  );

  const matchHistory = useMemo(() => {
    const allNums = new Set<number>();
    for (const matches of Object.values(playerMatchPoints)) {
      for (const e of matches) allNums.add(e.matchNum);
    }
    const sorted = [...allNums].sort((a, b) => a - b);
    return Object.entries(FANTASY_TEAMS).map(([teamId, team]) => {
      let cum = 0;
      const points = sorted.map(matchNum => {
        let pts = 0;
        for (const player of team.players) {
          const entry = (playerMatchPoints[player.name] || []).find(e => e.matchNum === matchNum);
          if (entry) {
            pts += applyMultiplier(entry.pts, player.name === team.captain, player.name === team.vc);
          }
        }
        cum += pts;
        return { matchNum, label: `M${matchNum}`, cum };
      });
      return { teamId, color: team.color, name: team.name, emoji: team.emoji, points };
    });
  }, [playerMatchPoints]);

  const hotPlayers = useMemo(
    () =>
      new Set<string>(
        Object.entries(playerMatchPoints)
          .filter(([, matches]) => {
            const sorted = [...matches].sort((a, b) => b.matchNum - a.matchNum);
            return sorted.length > 0 && sorted[0].pts >= 25;
          })
          .map(([name]) => name)
      ),
    [playerMatchPoints]
  );

  return (
    <PointsContext.Provider value={{
      playerPoints, setPlayerPoints,
      playerMatchPoints, setPlayerMatchPoints,
      iplIdToMatchNum, setIplIdToMatchNum,
      pointsLoading,
      pointsError, setPointsError,
      pointsLastUpdated, setPointsLastUpdated,
      pointsUpdating, setPointsUpdating,
      pendingMatches, setPendingMatches,
      nextAttempt, setNextAttempt,
      processedMatches, setProcessedMatches,
      abandonedMatchIds, setAbandonedMatchIds,
      fetchPoints,
      resetRetries,
      standings, setStandings, standingsLoading, fetchStandings,
      teamScores, matchHistory, hotPlayers,
    }}>
      {children}
    </PointsContext.Provider>
  );
}

export function usePoints(): PointsContextValue {
  const ctx = useContext(PointsContext);
  if (!ctx) throw new Error("usePoints must be used within PointsProvider");
  return ctx;
}
