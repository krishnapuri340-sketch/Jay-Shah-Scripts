import React from "react";
import { FANTASY_TEAMS } from "../teams";

export interface AdminPageProps {
  currentUser: string;
  abandonedMatchIds: string[];
  liveMatches: any[];
  playerPoints: Record<string, number>;
  processedMatches: string[];
  playerMatchPoints: Record<string, Array<{ matchNum: number; label: string; pts: number; source: string; stats?: any }>>;
  pinEditTarget: string | null;
  pinStep: "confirm" | "new";
  pinConfirmVal: string;
  pinConfirmError: boolean;
  pinEditVal: string;
  setPinEditTarget: (v: string | null) => void;
  setPinStep: (s: "confirm" | "new") => void;
  setPinConfirmVal: (v: string) => void;
  setPinConfirmError: (v: boolean) => void;
  setPinEditVal: (v: string) => void;
  handleConfirmOldPin: (id: string) => void;
  handleSavePin: (id: string) => void;
  resetPinEdit: () => void;
  dataSources: { iplOfficial: number; liveCount: number; competitionId?: number } | null;
  pointsUpdating: boolean;
  pointsError: string | null;
  pendingMatches: number;
  nextAttempt: string | null;
  pointsLastUpdated: Date | null;
  pointsLoading: boolean;
  adminBreakdownOpen: boolean;
  setAdminBreakdownOpen: (fn: (o: boolean) => boolean) => void;
  expandedAdminPlayer: string | null;
  setExpandedAdminPlayer: (v: string | null) => void;
  liveLoading: boolean;
  supabaseSyncing: boolean;
  s3Prefetching: boolean;
  statsRefreshing: boolean;
  supabaseSyncMsg: string | null;
  s3PrefetchResult: { found: number; missing: number; foundIds: string[]; missingIds: string[] } | null;
  lastUpdated: Date | null;
  setPlayerPoints: (v: Record<string, number>) => void;
  setProcessedMatches: (v: string[]) => void;
  fetchLive: () => void;
  fetchPoints: () => void;
  syncSupabase: () => void;
  prefetchS3Scorecards: () => void;
  refreshStatsCache: () => void;
}

export default function AdminPage(p: AdminPageProps) {
  const {
    currentUser, abandonedMatchIds, liveMatches, playerPoints, processedMatches, playerMatchPoints,
    pinEditTarget, pinStep, pinConfirmVal, pinConfirmError, pinEditVal,
    setPinEditTarget, setPinStep, setPinConfirmVal, setPinConfirmError, setPinEditVal,
    handleConfirmOldPin, handleSavePin, resetPinEdit,
    dataSources, pointsUpdating, pointsError, pendingMatches, nextAttempt, pointsLastUpdated, pointsLoading,
    adminBreakdownOpen, setAdminBreakdownOpen, expandedAdminPlayer, setExpandedAdminPlayer,
    liveLoading, supabaseSyncing, s3Prefetching, statsRefreshing,
    supabaseSyncMsg, s3PrefetchResult, lastUpdated,
    setPlayerPoints, setProcessedMatches, fetchLive, fetchPoints, syncSupabase, prefetchS3Scorecards, refreshStatsCache,
  } = p;

  const abandonedSet = new Set(abandonedMatchIds);
  const completedCount = liveMatches.filter((m: any) => m.matchEnded && !abandonedSet.has(String(m.id))).length;
  const liveCount = liveMatches.filter((m: any) => m.matchStarted && !m.matchEnded).length;
  const scorecardTotal = completedCount + liveCount;
  const scoredPlayerCount = Object.keys(playerPoints).length;
  const totalPts = Object.values(playerPoints).reduce((s, v) => s + v, 0);

  return (
    <div>
      <div className="sec-title">Admin</div>
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-val" style={{ color: "#22c55e" }}>{completedCount}</div>
          <div className="stat-lbl">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color: "var(--live)" }}>{liveCount}</div>
          <div className="stat-lbl">Live now</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color: "#60a5fa" }}>{processedMatches.length}</div>
          <div className="stat-lbl">Scored</div>
        </div>
        <div className="stat-card">
          <div className="stat-val" style={{ color: "#a855f7" }}>{scoredPlayerCount}</div>
          <div className="stat-lbl">Players</div>
        </div>
      </div>
      {/* PIN Management */}
      <div style={{ background: "rgba(15,21,32,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" as const, color: "#94a3b8" }}>
            Change Passcode
          </div>
          <div style={{ fontSize: "0.65rem", color: "#475569", marginTop: 5 }}>
            Your passcode must be exactly 4 digits and is used to log in to your account.{currentUser === "rajveer" ? " As commissioner, you can manage all members." : ""}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 2 }}>
          {Object.values(FANTASY_TEAMS)
            .filter(ft => currentUser === "rajveer" || ft.id === currentUser)
            .map((ft, idx) => {
              const isEditing = pinEditTarget === ft.id;
              return (
                <div key={ft.id}>
                  {idx > 0 && <div style={{ height: 1, background: "rgba(255,255,255,0.04)", margin: "10px 0" }} />}
                  {isEditing ? (
                    <div style={{ padding: "4px 0 8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                        <span style={{ fontSize: "1.1rem" }}>{ft.emoji}</span>
                        <div>
                          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: ft.color }}>{ft.owner}</div>
                          <div style={{ fontSize: "0.6rem", color: "#475569" }}>{ft.name}</div>
                        </div>
                        <div style={{ marginLeft: "auto", display: "flex", gap: 5 }}>
                          {["confirm","new"].map((s, si) => (
                            <div key={s} style={{
                              width: 18, height: 4, borderRadius: 2,
                              background: (pinStep === "confirm" ? si === 0 : si === 1) ? ft.color : "rgba(255,255,255,0.1)",
                              transition: "background 0.3s ease",
                            }} />
                          ))}
                        </div>
                      </div>
                      <div style={{ fontSize: "0.62rem", color: "#52525b", textAlign: "center", marginBottom: 14, letterSpacing: "0.5px" }}>
                        {pinStep === "confirm" ? "CONFIRM CURRENT PIN" : "ENTER NEW PIN"}
                      </div>
                      {pinStep === "confirm" && (() => {
                        const val = pinConfirmVal;
                        return (
                          <div>
                            <div style={{ position: "relative" }}>
                              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                                {[0, 1, 2, 3].map(i => {
                                  const char = val[i] || "";
                                  const isActive = val.length === i;
                                  return (
                                    <div key={i} style={{
                                      width: 48, height: 56,
                                      display: "flex", alignItems: "center", justifyContent: "center",
                                      border: `1.5px solid ${pinConfirmError ? "#f87171" : isActive ? ft.color : char ? `${ft.color}60` : "rgba(255,255,255,0.1)"}`,
                                      borderRadius: 12,
                                      background: pinConfirmError ? "rgba(248,113,113,0.08)" : char ? `${ft.color}12` : "rgba(255,255,255,0.03)",
                                      fontSize: "1.6rem", color: pinConfirmError ? "#f87171" : ft.color,
                                      transition: "all 0.15s ease",
                                      boxShadow: isActive ? `0 0 0 3px ${ft.color}25` : "none",
                                    }}>
                                      {char ? "•" : ""}
                                    </div>
                                  );
                                })}
                              </div>
                              <input
                                type="text" inputMode="numeric" pattern="\d{4}" maxLength={4}
                                value={val}
                                onChange={e => { setPinConfirmVal(e.target.value.replace(/\D/g, "").slice(0, 4)); setPinConfirmError(false); }}
                                autoFocus
                                style={{ position: "absolute", inset: 0, opacity: 0, cursor: "text", width: "100%", height: "100%" }}
                              />
                            </div>
                            {pinConfirmError && (
                              <div style={{ textAlign: "center", color: "#f87171", fontSize: "0.62rem", marginTop: 10, letterSpacing: "0.3px" }}>
                                Incorrect PIN — try again
                              </div>
                            )}
                            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "center" }}>
                              <button
                                onClick={() => handleConfirmOldPin(ft.id)}
                                disabled={val.length !== 4}
                                style={{
                                  flex: 1, maxWidth: 130,
                                  background: val.length === 4 ? `${ft.color}22` : "rgba(255,255,255,0.04)",
                                  border: `1px solid ${val.length === 4 ? `${ft.color}60` : "rgba(255,255,255,0.07)"}`,
                                  borderRadius: 10, padding: "9px 0", cursor: val.length === 4 ? "pointer" : "default",
                                  color: val.length === 4 ? ft.color : "#3f3f46",
                                  fontSize: "0.72rem", fontFamily: "inherit", fontWeight: 700, letterSpacing: "0.5px", transition: "all 0.15s ease",
                                }}>
                                Confirm →
                              </button>
                              <button
                                onClick={resetPinEdit}
                                style={{
                                  flex: 1, maxWidth: 100, background: "transparent",
                                  border: "1px solid rgba(255,255,255,0.07)",
                                  borderRadius: 10, padding: "9px 0", cursor: "pointer",
                                  color: "#52525b", fontSize: "0.72rem", fontFamily: "inherit", transition: "all 0.15s ease",
                                }}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                      {pinStep === "new" && (() => {
                        const val = pinEditVal;
                        return (
                          <div>
                            <div style={{ position: "relative" }}>
                              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                                {[0, 1, 2, 3].map(i => {
                                  const char = val[i] || "";
                                  const isActive = val.length === i;
                                  return (
                                    <div key={i} style={{
                                      width: 48, height: 56,
                                      display: "flex", alignItems: "center", justifyContent: "center",
                                      border: `1.5px solid ${isActive ? ft.color : char ? `${ft.color}60` : "rgba(255,255,255,0.1)"}`,
                                      borderRadius: 12,
                                      background: char ? `${ft.color}12` : "rgba(255,255,255,0.03)",
                                      fontSize: "1.6rem", color: ft.color,
                                      transition: "all 0.15s ease",
                                      boxShadow: isActive ? `0 0 0 3px ${ft.color}25` : "none",
                                    }}>
                                      {char ? "•" : ""}
                                    </div>
                                  );
                                })}
                              </div>
                              <input
                                type="text" inputMode="numeric" pattern="\d{4}" maxLength={4}
                                value={val}
                                onChange={e => setPinEditVal(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                autoFocus
                                style={{ position: "absolute", inset: 0, opacity: 0, cursor: "text", width: "100%", height: "100%" }}
                              />
                            </div>
                            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "center" }}>
                              <button
                                onClick={() => handleSavePin(ft.id)}
                                disabled={val.length !== 4}
                                style={{
                                  flex: 1, maxWidth: 120,
                                  background: val.length === 4 ? `${ft.color}22` : "rgba(255,255,255,0.04)",
                                  border: `1px solid ${val.length === 4 ? `${ft.color}60` : "rgba(255,255,255,0.07)"}`,
                                  borderRadius: 10, padding: "9px 0", cursor: val.length === 4 ? "pointer" : "default",
                                  color: val.length === 4 ? ft.color : "#3f3f46",
                                  fontSize: "0.72rem", fontFamily: "inherit", fontWeight: 700, letterSpacing: "0.5px", transition: "all 0.15s ease",
                                }}>
                                Save PIN
                              </button>
                              <button
                                onClick={() => { setPinStep("confirm"); setPinEditVal(""); setPinConfirmError(false); }}
                                style={{
                                  flex: 1, maxWidth: 100, background: "transparent",
                                  border: "1px solid rgba(255,255,255,0.07)",
                                  borderRadius: 10, padding: "9px 0", cursor: "pointer",
                                  color: "#52525b", fontSize: "0.72rem", fontFamily: "inherit", transition: "all 0.15s ease",
                                }}>
                                ← Back
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: "1rem" }}>{ft.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.7rem", fontWeight: 600, color: ft.color }}>{ft.owner}</div>
                        <div style={{ fontSize: "0.58rem", color: "#3f3f46" }}>{ft.name}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: "0.8rem", letterSpacing: "4px", color: "#27272a", fontFamily: "'Inter', sans-serif", lineHeight: 1 }}>••••</span>
                        <button
                          onClick={() => { setPinEditTarget(ft.id); setPinEditVal(""); setPinConfirmVal(""); setPinStep("confirm"); setPinConfirmError(false); }}
                          style={{
                            background: "transparent",
                            border: `1px solid rgba(255,255,255,0.08)`,
                            borderRadius: 8, padding: "5px 12px", cursor: "pointer",
                            color: "#52525b", fontSize: "0.65rem", fontFamily: "inherit",
                            fontWeight: 600, letterSpacing: "0.3px",
                            transition: "border-color 0.15s, color 0.15s",
                          }}
                          onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = `${ft.color}50`; (e.target as HTMLButtonElement).style.color = ft.color; }}
                          onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.target as HTMLButtonElement).style.color = "#52525b"; }}
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
      {currentUser === "rajveer" && <div style={{ background: "rgba(15,21,32,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" as const, color: "#94a3b8", marginBottom: 12 }}>
          🤖 Auto-Points Engine
        </div>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
            <span style={{ color: "#64748b" }}>IPL schedule</span>
            <span style={{ color: dataSources?.iplOfficial ? "#34d399" : "#475569" }}>
              {dataSources?.iplOfficial ? `✓ ${dataSources.iplOfficial} matches` : "Loading..."}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
            <span style={{ color: "#64748b" }}>Scorecards fetched</span>
            <span style={{ color: processedMatches.length > 0 ? "#34d399" : "#475569" }}>
              {processedMatches.length > 0
                ? `✓ ${processedMatches.length} fetched${abandonedMatchIds.length > 0 ? `, ${abandonedMatchIds.length} abandoned` : ""}${liveCount > 0 ? ` (${liveCount} live)` : ""}`
                : scorecardTotal === 0 ? "No matches yet" : "Pending..."}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
            <span style={{ color: "#64748b" }}>AuctionRoom points engine</span>
            <span style={{ color: pointsUpdating ? "#f59e0b" : pointsError ? "#ef4444" : pendingMatches > 0 ? "#f59e0b" : "#34d399" }}>
              {pointsUpdating ? "⏳ Processing..." : pointsError ? `⚠ ${pointsError.slice(0, 40)}` : pendingMatches > 0 ? `⏳ ${pendingMatches} pending` : "✓ Active"}
            </span>
          </div>
          {nextAttempt && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
              <span style={{ color: "#475569" }}>Rate limit — next attempt</span>
              <span style={{ color: "#f59e0b" }}>{new Date(nextAttempt).toLocaleTimeString()}</span>
            </div>
          )}
          {pointsLastUpdated && (
            <div style={{ fontSize: "0.65rem", color: "#334155" }}>
              Points last updated: {pointsLastUpdated.toLocaleTimeString()} · Auto-refreshes every 5 min
            </div>
          )}
        </div>
      </div>}
      <div style={{ background: "rgba(15,21,32,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <div
          onClick={() => setAdminBreakdownOpen(o => !o)}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: adminBreakdownOpen ? 12 : 0 }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" as const, color: "#94a3b8" }}>
            📊 Player Points Breakdown
          </span>
          <span style={{ fontSize: "0.65rem", color: "#475569" }}>{adminBreakdownOpen ? "▲" : "▼"} {Object.keys(playerPoints).length} players</span>
        </div>
        {adminBreakdownOpen && Object.keys(playerPoints).length === 0 && (
          <div style={{ color: "#334155", fontSize: "0.8rem", padding: "8px 0" }}>
            {pointsLoading ? "⏳ Calculating points from scorecards..." : "Points will appear once matches complete and scorecards are processed."}
          </div>
        )}
        {adminBreakdownOpen && Object.keys(playerPoints).length > 0 && Object.entries(playerPoints).sort((a, b) => b[1] - a[1]).map(([name, pts]) => {
          const team = Object.values(FANTASY_TEAMS).find(t => t.players.some(p => p.name === name));
          const isExp = expandedAdminPlayer === name;
          const matches = playerMatchPoints[name] || [];
          const isCap = Object.values(FANTASY_TEAMS).some(t => t.captain === name);
          const isVC = Object.values(FANTASY_TEAMS).some(t => t.vc === name);
          return (
            <div key={name} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div
                onClick={() => setExpandedAdminPlayer(isExp ? null : name)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", cursor: "pointer" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: "0.78rem", color: "#cbd5e1" }}>{name}</span>
                    {isCap && <span style={{ fontSize: "0.52rem", fontWeight: 700, color: "#d4a843", background: "rgba(212,168,67,0.12)", borderRadius: 3, padding: "1px 4px" }}>C</span>}
                    {isVC && <span style={{ fontSize: "0.52rem", fontWeight: 700, color: "#a1a1aa", background: "rgba(161,161,170,0.1)", borderRadius: 3, padding: "1px 4px" }}>VC</span>}
                  </div>
                  {team && <div style={{ fontSize: "0.6rem", color: "#475569", marginTop: 1 }}>{team.name} · {team.owner}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "'Bebas Neue'", fontSize: "1.1rem", color: "#f97316", letterSpacing: "1px" }}>{pts}</span>
                  {matches.length > 0 && <span style={{ fontSize: "0.6rem", color: "#475569" }}>{isExp ? "▲" : "▼"}</span>}
                </div>
              </div>
              {isExp && matches.length > 0 && (
                <div style={{ marginBottom: 8, padding: "8px 10px", background: "rgba(255,255,255,0.02)", borderRadius: 8, display: "flex", flexDirection: "column" as const, gap: 5 }}>
                  {matches.map((m, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem" }}>
                      <div>
                        <span style={{ color: "var(--text-2)" }}>{m.label}</span>
                        {m.source === "official" && <span style={{ marginLeft: 5, fontSize: "0.55rem", color: "#34d399", background: "rgba(52,211,153,0.1)", borderRadius: 3, padding: "1px 4px" }}>official</span>}
                        {(m.source || "").includes("live") && <span style={{ marginLeft: 5, fontSize: "0.55rem", color: "#fbbf24", background: "rgba(251,191,36,0.1)", borderRadius: 3, padding: "1px 4px" }}>live</span>}
                      </div>
                      <span style={{ fontWeight: 700, color: m.pts > 0 ? "#f97316" : "var(--text-3)" }}>{m.pts > 0 ? "+" : ""}{m.pts}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 2, paddingTop: 5, display: "flex", justifyContent: "space-between", fontSize: "0.72rem", fontWeight: 700 }}>
                    <span style={{ color: "var(--text-3)" }}>Total (raw)</span>
                    <span style={{ color: "#f97316" }}>{matches.reduce((s, m) => s + m.pts, 0)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
        <button className="btn-primary" onClick={() => { fetchLive(); fetchPoints(); }} disabled={liveLoading || pointsLoading}>
          {(liveLoading || pointsLoading) ? <span className="spinner" /> : "🔄"} Refresh All
        </button>
        {currentUser === "rajveer" && <>
          <button className="btn-primary" style={{ background: "rgba(96,165,250,0.1)", borderColor: "rgba(96,165,250,0.3)", color: "#60a5fa" }}
            onClick={fetchPoints} disabled={pointsLoading}>
            {pointsLoading ? <span className="spinner" /> : "⚡"} Fetch Points
          </button>
          <button className="btn-primary" style={{ background: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.3)", color: "#22c55e" }}
            onClick={syncSupabase} disabled={supabaseSyncing}>
            {supabaseSyncing ? <span className="spinner" /> : "🗄️"} Sync AuctionRoom
          </button>
          <button className="btn-primary" style={{ background: "rgba(168,85,247,0.1)", borderColor: "rgba(168,85,247,0.3)", color: "#a855f7" }}
            onClick={prefetchS3Scorecards} disabled={s3Prefetching}>
            {s3Prefetching ? <span className="spinner" /> : "📡"} Pre-fetch S3 Scorecards
          </button>
          <button className="btn-primary" style={{ background: "rgba(245,166,35,0.1)", borderColor: "rgba(245,166,35,0.3)", color: "var(--gold)" }}
            onClick={refreshStatsCache} disabled={statsRefreshing}>
            {statsRefreshing ? <span className="spinner" /> : "📊"} Refresh Stats (S3)
          </button>
          <button className="btn-danger" onClick={async () => {
            if (confirm("Reset all cached points? Points will re-sync from AuctionRoom.")) {
              await fetch("/api/ipl/points/reset", { method: "POST", headers: { "X-Owner-Id": "rajveer" } });
              setPlayerPoints({});
              setProcessedMatches([]);
              setTimeout(fetchPoints, 500);
            }
          }}>🗑️ Reset Cache</button>
        </>}
      </div>
      {supabaseSyncMsg && (
        <div style={{ fontSize: "0.7rem", marginTop: 8, padding: "6px 10px", borderRadius: 8,
          background: supabaseSyncMsg.startsWith("Sync failed") ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
          color: supabaseSyncMsg.startsWith("Sync failed") ? "#f87171" : "#4ade80",
          border: `1px solid ${supabaseSyncMsg.startsWith("Sync failed") ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`,
        }}>
          {supabaseSyncMsg}
        </div>
      )}
      {s3PrefetchResult && (
        <div style={{ marginTop: 8, padding: "10px 12px", borderRadius: 10,
          background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: s3PrefetchResult.foundIds.length > 0 ? 8 : 0 }}>
            <span style={{ fontSize: "0.72rem", color: "#a855f7", fontWeight: 700 }}>
              📡 S3 Scorecard Prefetch
            </span>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
              <span style={{ color: "#4ade80" }}>✓ {s3PrefetchResult.found} found</span>
              {" · "}
              <span style={{ color: s3PrefetchResult.missing > 0 ? "#94a3b8" : "#4ade80" }}>{s3PrefetchResult.missing} not yet available</span>
            </span>
          </div>
          {s3PrefetchResult.foundIds.length > 0 && (
            <div style={{ fontSize: "0.6rem", color: "#64748b", lineHeight: 1.6 }}>
              <span style={{ color: "#4ade80" }}>Found IDs: </span>
              {s3PrefetchResult.foundIds.join(", ")}
            </div>
          )}
          {s3PrefetchResult.missingIds.length > 0 && (
            <div style={{ fontSize: "0.6rem", color: "#64748b", marginTop: 4, lineHeight: 1.6 }}>
              <span style={{ color: "#94a3b8" }}>Not yet on S3: </span>
              {s3PrefetchResult.missingIds.join(", ")}
            </div>
          )}
        </div>
      )}
      {lastUpdated && (
        <div style={{ fontSize: "0.65rem", color: "#334155", marginTop: 10 }}>
          Schedule last updated: {lastUpdated.toLocaleTimeString()} · Total points tracked: {totalPts}
        </div>
      )}
    </div>
  );
}
