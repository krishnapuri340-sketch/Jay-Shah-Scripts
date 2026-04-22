import { useState, useCallback, useRef } from "react";

export function useIplStats() {
  const [iplStats, setIplStats] = useState<any | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const inFlight = useRef(false);

  const fetchStats = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setStatsLoading(true);
    try {
      const res = await fetch("/api/ipl/stats");
      if (res.ok) setIplStats(await res.json());
    } catch (_) {
    } finally {
      inFlight.current = false;
      setStatsLoading(false);
    }
  }, []);

  return { iplStats, setIplStats, statsLoading, fetchStats };
}
