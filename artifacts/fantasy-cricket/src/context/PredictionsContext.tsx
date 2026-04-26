import React, { createContext, useContext, useState, useEffect } from "react";
import {
  usePredictions as useRawPredictions,
  saveLocalPreds,
  loadLocalPreds,
} from "../hooks/usePredictions";
import { authStreamUrl, dispatchSessionExpired } from "../lib/auth";
import { useAuth } from "./AuthContext";

interface PredictionsContextValue {
  predictions: Record<string, Record<string, string | null>>;
  setPredictions: React.Dispatch<React.SetStateAction<Record<string, Record<string, string | null>>>>;
  lastPredSaveRef: React.MutableRefObject<number>;
  fetchPredictions: () => void;
  bumpSseGen: () => void;
}

const PredictionsContext = createContext<PredictionsContextValue | null>(null);

export function PredictionsProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const { predictions, setPredictions, lastPredSaveRef, fetchPredictions } = useRawPredictions();
  const [sseGen, setSseGen] = useState(0);

  // Seed from localStorage and do an immediate fetch whenever currentUser changes
  useEffect(() => {
    const local = loadLocalPreds();
    if (Object.keys(local).length > 0) setPredictions(local);
    if (currentUser) fetchPredictions();
  }, [currentUser]);

  // SSE subscription — reconnects when sseGen bumps (tab visibility change)
  useEffect(() => {
    if (!currentUser) return;
    const es = new EventSource(authStreamUrl("/api/ipl/predictions/stream"));
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as Record<string, Record<string, string | null>>;
        lastPredSaveRef.current = Date.now();
        saveLocalPreds(data);
        setPredictions(data);
      } catch {}
    };
    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) dispatchSessionExpired();
    };
    return () => es.close();
  }, [currentUser, sseGen]);

  // 30-second polling fallback (SSE covers normal operation)
  useEffect(() => {
    if (!currentUser) return;
    fetchPredictions();
    const id = setInterval(fetchPredictions, 30_000);
    return () => clearInterval(id);
  }, [currentUser]);

  return (
    <PredictionsContext.Provider value={{
      predictions,
      setPredictions,
      lastPredSaveRef,
      fetchPredictions,
      bumpSseGen: () => setSseGen(g => g + 1),
    }}>
      {children}
    </PredictionsContext.Provider>
  );
}

export function usePredictions(): PredictionsContextValue {
  const ctx = useContext(PredictionsContext);
  if (!ctx) throw new Error("usePredictions must be used within PredictionsProvider");
  return ctx;
}
