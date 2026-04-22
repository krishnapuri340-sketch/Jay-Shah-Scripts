import { useState, useCallback, useRef } from "react";

const PRED_CACHE_KEY = "ipl-predictions-2026";

export type PredictionsMap = Record<string, Record<string, string | null>>;

export function loadLocalPreds(): PredictionsMap {
  try { return JSON.parse(localStorage.getItem(PRED_CACHE_KEY) || "{}"); } catch { return {}; }
}

export function saveLocalPreds(data: PredictionsMap) {
  try { localStorage.setItem(PRED_CACHE_KEY, JSON.stringify(data)); } catch {}
}

export function usePredictions() {
  const [predictions, setPredictions] = useState<PredictionsMap>({});
  const lastPredSaveRef = useRef<number>(0);

  const fetchPredictions = useCallback(async () => {
    if (Date.now() - lastPredSaveRef.current < 8000) return;
    const fetchStartedAt = Date.now();
    try {
      const res = await fetch("/api/ipl/predictions");
      if (res.ok) {
        const server: PredictionsMap = await res.json();
        if (Date.now() - lastPredSaveRef.current < 8000) return;
        if (fetchStartedAt < lastPredSaveRef.current) return;
        saveLocalPreds(server);
        setPredictions(server);
      }
    } catch (_) {
      const local = loadLocalPreds();
      if (Object.keys(local).length > 0) setPredictions(local);
    }
  }, []);

  return { predictions, setPredictions, lastPredSaveRef, fetchPredictions };
}
