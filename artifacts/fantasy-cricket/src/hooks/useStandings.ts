import { useState, useCallback, useRef } from "react";

export function useStandings() {
  const [standings, setStandings] = useState<any[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const inFlight = useRef(false);

  const fetchStandings = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setStandingsLoading(true);
    try {
      const res = await fetch("/api/ipl/standings");
      if (res.ok) {
        const data = await res.json();
        setStandings(data.standings || data || []);
      }
    } catch (_) {
    } finally {
      inFlight.current = false;
      setStandingsLoading(false);
    }
  }, []);

  return { standings, setStandings, standingsLoading, fetchStandings };
}
