import { useState, useCallback, useRef, useEffect } from "react";
import type { PlayerStats } from "../utils";

const MAX_POINTS_RETRIES = 4;

export type PlayerMatchPointsMap = Record<
  string,
  Array<{ matchNum: number; label: string; pts: number; source: string; stats?: PlayerStats }>
>;

export function useFantasyPoints() {
  const [playerPoints, setPlayerPoints] = useState<Record<string, number>>({});
  const [playerMatchPoints, setPlayerMatchPoints] = useState<PlayerMatchPointsMap>({});
  const [iplIdToMatchNum, setIplIdToMatchNum] = useState<Record<string, number>>({});
  const [pointsLoading, setPointsLoading] = useState(false);
  const [pointsError, setPointsError] = useState<string | null>(null);
  const [pointsLastUpdated, setPointsLastUpdated] = useState<Date | null>(null);
  const [pointsUpdating, setPointsUpdating] = useState(false);
  const [pendingMatches, setPendingMatches] = useState(0);
  const [nextAttempt, setNextAttempt] = useState<string | null>(null);
  const [processedMatches, setProcessedMatches] = useState<string[]>([]);
  const [abandonedMatchIds, setAbandonedMatchIds] = useState<string[]>([]);

  const inFlight = useRef(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);

  const fetchPoints = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setPointsLoading(true);
    setPointsError(null);
    if (retryTimer.current) { clearTimeout(retryTimer.current); retryTimer.current = null; }
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
        if (Object.keys(pp).length === 0 && retryCount.current < MAX_POINTS_RETRIES) {
          retryCount.current += 1;
          retryTimer.current = setTimeout(() => {
            retryTimer.current = null;
            fetchPoints();
          }, 4000);
        } else {
          retryCount.current = 0;
        }
      }
    } catch (e: any) {
      setPointsError("Points fetch failed: " + (e?.message || "Unknown error"));
      if (retryCount.current < MAX_POINTS_RETRIES) {
        retryCount.current += 1;
        retryTimer.current = setTimeout(() => {
          retryTimer.current = null;
          fetchPoints();
        }, 5000);
      }
    } finally {
      inFlight.current = false;
      setPointsLoading(false);
    }
  }, []);

  const resetRetries = useCallback(() => {
    retryCount.current = 0;
  }, []);

  useEffect(() => {
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, []);

  return {
    playerPoints,
    setPlayerPoints,
    playerMatchPoints,
    setPlayerMatchPoints,
    iplIdToMatchNum,
    setIplIdToMatchNum,
    pointsLoading,
    pointsError,
    setPointsError,
    pointsLastUpdated,
    setPointsLastUpdated,
    pointsUpdating,
    setPointsUpdating,
    pendingMatches,
    setPendingMatches,
    nextAttempt,
    setNextAttempt,
    processedMatches,
    setProcessedMatches,
    abandonedMatchIds,
    setAbandonedMatchIds,
    fetchPoints,
    resetRetries,
  };
}
