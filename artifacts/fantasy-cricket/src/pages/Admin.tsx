import React from "react";
import { FANTASY_TEAMS } from "../teams";
import { authHeaders } from "../lib/auth";

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
  // Push notifications
  pushSupported: boolean;
  pushSubscribed: boolean;
  pushEnabled: boolean;
  pushSubscriberCount: number;
  notifPermission: NotificationPermission | null;
  pushSubscribing: boolean;
  onSubscribePush: () => void;
  onUnsubscribePush: () => void;
  onTogglePushEnabled: (enabled: boolean) => void;
  onTestPush: () => void;
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
    pushSupported, pushSubscribed, pushEnabled, pushSubscriberCount, notifPermission,
    pushSubscribing, onSubscribePush, onUnsubscribePush, onTogglePushEnabled, onTestPush,
  } = p;

  const abandonedSet = new Set(abandonedMatchIds);
  const completedCount = liveMatches.filter((m: any) => m.matchEnded && !abandonedSet.has(String(m.id))).length;
  const liveCount = liveMatches.filter((m: any) => m.matchStarted && !m.matchEnded).length;
  const totalPts = Object.values(playerPoints).reduce((s, v) => s + v, 0);
  const isCommissioner = currentUser === "rajveer";
  const anySyncing = liveLoading || pointsLoading || supabaseSyncing || s3Prefetching || statsRefreshing;

  return (
    <div>
      <div className="sec-title">Admin</div>

      {/* KPI tiles */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card"><div className="stat-val" style={{ color: "#22c55e" }}>{completedCount}</div><div className="stat-lbl">Completed</div></div>
        <div className="stat-card"><div className="stat-val" style={{ color: "var(--live)" }}>{liveCount}</div><div className="stat-lbl">Live</div></div>
        <div className="stat-card"><div className="stat-val" style={{ color: "#60a5fa" }}>{processedMatches.length}</div><div className="stat-lbl">Scored</div></div>
        <div className="stat-card"><div className="stat-val" style={{ color: "#a855f7" }}>{Object.keys(playerPoints).length}</div><div className="stat-lbl">Players</div></div>
      </div>

      {/* PIN Management */}
      <div className="admin-section">
        <div style={{ marginBottom: 14 }}>
          <div className="admin-section-title">Change Passcode</div>
          <div className="admin-section-sub">
            4-digit PIN used to log in.
            {isCommissioner ? " As commissioner you can manage all members." : ""}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {Object.values(FANTASY_TEAMS)
            .filter(ft => isCommissioner || ft.id === currentUser)
            .map((ft, idx) => {
              const isEditing = pinEditTarget === ft.id;
              return (
                <div key={ft.id}>
                  {idx > 0 && <div className="admin-divider" />}
                  {isEditing ? (
                    <div style={{ padding: "4px 0 8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                        <span style={{ fontSize: "1.1rem" }}>{ft.emoji}</span>
                        <div>
                          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: ft.color }}>{ft.owner}</div>
                          <div style={{ fontSize: "0.6rem", color: "#475569" }}>{ft.name}</div>
                        </div>
                        <div className="admin-pin-indicator" style={{ marginLeft: "auto" }}>
                          {["confirm", "new"].map((s, si) => (
                            <div key={s} className="admin-pin-step-dot" style={{
                              background: (pinStep === "confirm" ? si === 0 : si === 1) ? ft.color : "rgba(255,255,255,0.1)",
                            }} />
                          ))}
                        </div>
                      </div>
                      <div className="admin-pin-step-label">
                        {pinStep === "confirm" ? "CONFIRM CURRENT PIN" : "ENTER NEW PIN"}
                      </div>
                      {pinStep === "confirm" && (() => {
                        const val = pinConfirmVal;
                        return (
                          <div>
                            <div style={{ position: "relative" }}>
                              <div className="admin-pin-dots-row">
                                {[0, 1, 2, 3].map(i => {
                                  const char = val[i] || "";
                                  const isActive = val.length === i;
                                  return (
                                    <div key={i} className="admin-pin-digit" style={{
                                      border: `1.5px solid ${pinConfirmError ? "#f87171" : isActive ? ft.color : char ? `${ft.color}60` : "rgba(255,255,255,0.1)"}`,
                                      background: pinConfirmError ? "rgba(248,113,113,0.08)" : char ? `${ft.color}12` : "rgba(255,255,255,0.03)",
                                      color: pinConfirmError ? "#f87171" : ft.color,
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
                            <div className="admin-pin-actions">
                              <button onClick={() => handleConfirmOldPin(ft.id)} disabled={val.length !== 4}
                                className="admin-pin-confirm-btn"
                                style={{
                                  background: val.length === 4 ? `${ft.color}22` : "rgba(255,255,255,0.04)",
                                  borderColor: val.length === 4 ? `${ft.color}60` : "rgba(255,255,255,0.07)",
                                  color: val.length === 4 ? ft.color : "#3f3f46",
                                  cursor: val.length === 4 ? "pointer" : "default",
                                }}>
                                Confirm →
                              </button>
                              <button onClick={resetPinEdit} className="admin-pin-cancel-btn">Cancel</button>
                            </div>
                          </div>
                        );
                      })()}
                      {pinStep === "new" && (() => {
                        const val = pinEditVal;
                        return (
                          <div>
                            <div style={{ position: "relative" }}>
                              <div className="admin-pin-dots-row">
                                {[0, 1, 2, 3].map(i => {
                                  const char = val[i] || "";
                                  const isActive = val.length === i;
                                  return (
                                    <div key={i} className="admin-pin-digit" style={{
                                      border: `1.5px solid ${isActive ? ft.color : char ? `${ft.color}60` : "rgba(255,255,255,0.1)"}`,
                                      background: char ? `${ft.color}12` : "rgba(255,255,255,0.03)",
                                      color: ft.color,
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
                            <div className="admin-pin-actions">
                              <button onClick={() => handleSavePin(ft.id)} disabled={val.length !== 4}
                                className="admin-pin-confirm-btn" style={{ maxWidth: 120,
                                  background: val.length === 4 ? `${ft.color}22` : "rgba(255,255,255,0.04)",
                                  borderColor: val.length === 4 ? `${ft.color}60` : "rgba(255,255,255,0.07)",
                                  color: val.length === 4 ? ft.color : "#3f3f46",
                                  cursor: val.length === 4 ? "pointer" : "default",
                                }}>
                                Save PIN
                              </button>
                              <button onClick={() => { setPinStep("confirm"); setPinEditVal(""); setPinConfirmError(false); }}
                                className="admin-pin-cancel-btn">← Back</button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="admin-pin-member">
                      <span style={{ fontSize: "1rem" }}>{ft.emoji}</span>
                      <div className="admin-pin-info" style={{ flex: 1 }}>
                        <div className="owner" style={{ color: ft.color }}>{ft.owner}</div>
                        <div className="team-name">{ft.name}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="admin-pin-dots">••••</span>
                        <button className="admin-change-btn"
                          onClick={() => { setPinEditTarget(ft.id); setPinEditVal(""); setPinConfirmVal(""); setPinStep("confirm"); setPinConfirmError(false); }}
                          onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = `${ft.color}50`; (e.target as HTMLButtonElement).style.color = ft.color; }}
                          onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.target as HTMLButtonElement).style.color = "#52525b"; }}>
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

      {/* Notifications */}
      <div className="admin-section">
        <div style={{ marginBottom: 14 }}>
          <div className="admin-section-title">Notifications</div>
          <div className="admin-section-sub">
            Get push alerts when a match goes live, the result, and your team's points.
            {!pushSupported && " Install the app to your home screen to enable notifications."}
          </div>
        </div>

        {/* Device subscription toggle */}
        <div className="admin-status-list">
          <div className="admin-status-row" style={{ alignItems: "center" }}>
            <span className="admin-status-label">This device</span>
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {!pushSupported && (
                <span style={{ fontSize: "0.68rem", color: "#475569" }}>Install app first</span>
              )}
              {pushSupported && notifPermission === "denied" && (
                <span style={{ fontSize: "0.68rem", color: "#f87171" }}>Blocked — enable in Settings</span>
              )}
              {pushSupported && notifPermission !== "denied" && (
                pushSubscribed ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: "0.68rem", color: "#34d399" }}>✓ Active</span>
                    <button
                      onClick={onUnsubscribePush}
                      style={{ fontSize: "0.62rem", padding: "3px 9px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#71717a", cursor: "pointer" }}>
                      Turn off
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={onSubscribePush}
                    disabled={pushSubscribing}
                    style={{
                      fontSize: "0.68rem", padding: "5px 14px", borderRadius: 8,
                      border: "1px solid rgba(212,168,67,0.4)", background: pushSubscribing ? "rgba(212,168,67,0.06)" : "rgba(212,168,67,0.12)",
                      color: pushSubscribing ? "#71717a" : "#d4a843", cursor: pushSubscribing ? "default" : "pointer",
                      fontWeight: 600, display: "flex", alignItems: "center", gap: 6,
                    }}>
                    {pushSubscribing ? <span className="spinner" /> : "🔔"} Enable Notifications
                  </button>
                )
              )}
            </span>
          </div>

          {/* Commissioner: global toggle + stats */}
          {isCommissioner && (
            <>
              <div className="admin-divider" />
              <div className="admin-status-row" style={{ alignItems: "center" }}>
                <span className="admin-status-label">Global toggle</span>
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: "0.68rem", color: pushEnabled ? "#34d399" : "#71717a" }}>
                    {pushEnabled ? "Enabled" : "Paused"}
                  </span>
                  <button
                    onClick={() => onTogglePushEnabled(!pushEnabled)}
                    style={{
                      fontSize: "0.62rem", padding: "3px 9px", borderRadius: 6,
                      border: `1px solid ${pushEnabled ? "rgba(239,68,68,0.3)" : "rgba(52,211,153,0.3)"}`,
                      background: pushEnabled ? "rgba(239,68,68,0.06)" : "rgba(52,211,153,0.06)",
                      color: pushEnabled ? "#f87171" : "#34d399", cursor: "pointer",
                    }}>
                    {pushEnabled ? "Pause all" : "Resume all"}
                  </button>
                </span>
              </div>
              <div className="admin-status-row">
                <span className="admin-status-label">Subscribers</span>
                <span style={{ color: pushSubscriberCount > 0 ? "#34d399" : "#475569", fontSize: "0.68rem" }}>
                  {pushSubscriberCount} device{pushSubscriberCount !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="admin-status-row" style={{ justifyContent: "flex-end", paddingTop: 4 }}>
                <button
                  onClick={onTestPush}
                  disabled={pushSubscriberCount === 0}
                  style={{
                    fontSize: "0.62rem", padding: "4px 12px", borderRadius: 7,
                    border: "1px solid rgba(96,165,250,0.3)", background: "rgba(96,165,250,0.07)",
                    color: pushSubscriberCount === 0 ? "#334155" : "#60a5fa",
                    cursor: pushSubscriberCount === 0 ? "default" : "pointer",
                  }}>
                  Send test push
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Commissioner-only sections */}
      {isCommissioner && (
        <>
          {/* Data Status */}
          <div className="admin-section">
            <div className="admin-section-title" style={{ marginBottom: 12 }}>Data Status</div>
            <div className="admin-status-list">
              <div className="admin-status-row">
                <span className="admin-status-label">IPL schedule</span>
                <span style={{ color: dataSources?.iplOfficial ? "#34d399" : "#475569" }}>
                  {dataSources?.iplOfficial ? `✓ ${dataSources.iplOfficial} matches` : "Loading..."}
                </span>
              </div>
              <div className="admin-status-row">
                <span className="admin-status-label">Scorecards</span>
                <span style={{ color: processedMatches.length > 0 ? "#34d399" : "#475569" }}>
                  {processedMatches.length > 0
                    ? `✓ ${processedMatches.length} fetched${abandonedMatchIds.length > 0 ? `, ${abandonedMatchIds.length} abandoned` : ""}${liveCount > 0 ? ` · ${liveCount} live` : ""}`
                    : completedCount === 0 ? "No matches yet" : "Pending..."}
                </span>
              </div>
              <div className="admin-status-row">
                <span className="admin-status-label">Points engine</span>
                <span style={{ color: pointsUpdating ? "#f59e0b" : pointsError ? "#ef4444" : pendingMatches > 0 ? "#f59e0b" : "#34d399" }}>
                  {pointsUpdating ? "⏳ Processing..." : pointsError ? `⚠ ${pointsError.slice(0, 40)}` : pendingMatches > 0 ? `⏳ ${pendingMatches} pending` : "✓ Active"}
                </span>
              </div>
              {s3PrefetchResult && (
                <div className="admin-status-row">
                  <span className="admin-status-label">S3 scorecards</span>
                  <span style={{ color: "#94a3b8" }}>
                    <span style={{ color: "#4ade80" }}>✓ {s3PrefetchResult.found}</span>
                    {s3PrefetchResult.missing > 0 && <span style={{ color: "#94a3b8" }}> · {s3PrefetchResult.missing} missing</span>}
                  </span>
                </div>
              )}
              {supabaseSyncMsg && (
                <div className="admin-status-row">
                  <span className="admin-status-label">Last sync</span>
                  <span style={{ color: supabaseSyncMsg.startsWith("Sync failed") ? "#f87171" : "#34d399" }}>
                    {supabaseSyncMsg.startsWith("Sync failed") ? "⚠ Failed" : "✓ " + supabaseSyncMsg}
                  </span>
                </div>
              )}
              {nextAttempt && (
                <div className="admin-status-row">
                  <span style={{ color: "#475569" }}>Rate limit — next attempt</span>
                  <span style={{ color: "#f59e0b" }}>{new Date(nextAttempt).toLocaleTimeString()}</span>
                </div>
              )}
            </div>
            {pointsLastUpdated && (
              <div className="admin-status-sub" style={{ marginTop: 8 }}>
                Points last updated: {pointsLastUpdated.toLocaleTimeString()} · Auto-refreshes every 5 min
              </div>
            )}
          </div>

          {/* Player Points Breakdown */}
          <div className="admin-section">
            <div onClick={() => setAdminBreakdownOpen(o => !o)}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: adminBreakdownOpen ? 12 : 0 }}>
              <span className="admin-section-title">Player Breakdown</span>
              <span style={{ fontSize: "0.65rem", color: "#475569" }}>{adminBreakdownOpen ? "▲" : "▼"} {Object.keys(playerPoints).length} players</span>
            </div>
            {adminBreakdownOpen && Object.keys(playerPoints).length === 0 && (
              <div style={{ color: "#334155", fontSize: "0.8rem", padding: "8px 0" }}>
                {pointsLoading ? "⏳ Calculating points from scorecards..." : "Points will appear once matches complete and scorecards are processed."}
              </div>
            )}
            {adminBreakdownOpen && Object.keys(playerPoints).length > 0 && Object.entries(playerPoints).sort((a, b) => b[1] - a[1]).map(([name, pts]) => {
              const team = Object.values(FANTASY_TEAMS).find(t => t.players.some(pp => pp.name === name));
              const isExp = expandedAdminPlayer === name;
              const matches = playerMatchPoints[name] || [];
              const isCap = Object.values(FANTASY_TEAMS).some(t => t.captain === name);
              const isVC  = Object.values(FANTASY_TEAMS).some(t => t.vc === name);
              return (
                <div key={name} className="admin-breakdown-row" onClick={() => setExpandedAdminPlayer(isExp ? null : name)}>
                  <div style={{ flex: 1 }}>
                    <div className="admin-breakdown-name">
                      {name}
                      {isCap && <span className="admin-breakdown-tag" style={{ color: "#d4a843", background: "rgba(212,168,67,0.12)" }}>C</span>}
                      {isVC  && <span className="admin-breakdown-tag" style={{ color: "#a1a1aa", background: "rgba(161,161,170,0.1)" }}>VC</span>}
                    </div>
                    {team && <div className="admin-breakdown-team">{team.name} · {team.owner}</div>}
                    {isExp && matches.length > 0 && (
                      <div className="admin-breakdown-match-panel">
                        {matches.map((m, i) => (
                          <div key={i} className="admin-breakdown-match-row">
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
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "'Bebas Neue'", fontSize: "1.1rem", color: "#f97316", letterSpacing: "1px" }}>{pts}</span>
                    {matches.length > 0 && <span style={{ fontSize: "0.6rem", color: "#475569" }}>{isExp ? "▲" : "▼"}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action buttons — consolidated */}
          <div className="admin-btn-row">
            <button className="btn-primary btn-primary-blue" onClick={() => { fetchLive(); fetchPoints(); syncSupabase(); prefetchS3Scorecards(); refreshStatsCache(); }} disabled={anySyncing}>
              {anySyncing ? <span className="spinner" /> : "🔄"} Sync All
            </button>
            <button className="btn-primary btn-primary-green" onClick={syncSupabase} disabled={supabaseSyncing}>
              {supabaseSyncing ? <span className="spinner" /> : "🗄️"} AuctionRoom
            </button>
            <button className="btn-danger" onClick={async () => {
              if (confirm("Reset all cached points? They will re-sync from AuctionRoom.")) {
                await fetch("/api/ipl/points/reset", { method: "POST", headers: { ...authHeaders() } });
                setPlayerPoints({});
                setProcessedMatches([]);
                setTimeout(fetchPoints, 500);
              }
            }}>Reset Cache</button>
          </div>
        </>
      )}

      {lastUpdated && (
        <div className="admin-footer">
          Schedule last updated: {lastUpdated.toLocaleTimeString()} · Total points tracked: {totalPts}
        </div>
      )}
    </div>
  );
}
