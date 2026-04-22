import { useState, useCallback, useRef } from "react";

export function useScorecard() {
  const [scorecards, setScorecards] = useState<Record<string, any>>({});
  const [scorecardLoading, setScorecardLoading] = useState<string | null>(null);
  const cacheRef = useRef<Record<string, any>>({});
  const inFlightRef = useRef<Set<string>>(new Set());

  const fetchScorecard = useCallback(async (matchId: string, force = false) => {
    if (!force && cacheRef.current[matchId]) return;
    if (inFlightRef.current.has(matchId)) return;
    inFlightRef.current.add(matchId);
    setScorecardLoading(matchId);
    try {
      const res = await fetch(`/api/ipl/scorecard/${matchId}`);
      if (res.ok) {
        const data = await res.json();
        cacheRef.current[matchId] = data;
        setScorecards(prev => ({ ...prev, [matchId]: data }));
      }
    } catch (_) {
    } finally {
      inFlightRef.current.delete(matchId);
      setScorecardLoading(null);
    }
  }, []);

  const setScorecardsWithRef = useCallback((updater: React.SetStateAction<Record<string, any>>) => {
    setScorecards(prev => {
      const next = typeof updater === "function" ? (updater as (p: Record<string, any>) => Record<string, any>)(prev) : updater;
      cacheRef.current = next;
      return next;
    });
  }, []);

  return {
    scorecards,
    setScorecards: setScorecardsWithRef,
    scorecardLoading,
    fetchScorecard,
  };
}
