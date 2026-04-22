import { useState, useCallback, useRef } from "react";

export type DataSources = { iplOfficial: number; liveCount: number; competitionId?: number } | null;

export function useLiveMatches(onMatches?: (matches: any[]) => void) {
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [dataSources, setDataSources] = useState<DataSources>(null);
  const inFlight = useRef(false);
  const onMatchesRef = useRef(onMatches);
  onMatchesRef.current = onMatches;

  const fetchLive = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
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
        onMatchesRef.current?.(matches);
      } else {
        setApiError("No IPL matches found from official sources.");
      }
      setLastUpdated(new Date());
    } catch (e: any) {
      setApiError("Fetch failed: " + (e?.message || "Unknown error"));
    } finally {
      inFlight.current = false;
      setLiveLoading(false);
    }
  }, []);

  return {
    liveMatches,
    setLiveMatches,
    liveLoading,
    lastUpdated,
    setLastUpdated,
    apiError,
    setApiError,
    dataSources,
    setDataSources,
    fetchLive,
  };
}
