import React from "react";
import InningsTable from "../components/InningsTable";
import { FANTASY_TEAMS } from "../teams";
import { getMatchWinner, getH2H, fmtDate, fmtTime, getMatchNum, predictNextMatch, predictFirstInningsTotal } from "../utils";
import { IPL_COLORS, TEAM_LOGO_CDN, VENUE_AVG } from "../constants";

interface FixturesPageProps {
  liveMatches: any[];
  standings: any[];
  matchFilter: "live" | "upcoming" | "completed" | "all";
  teamFilter: Set<string>;
  fixtureHomeAwayFilter: "all" | "home" | "away";
  scorecards: Record<string, any>;
  scorecardLoading: string | null;
  openScoreRows: Set<string>;
  predictions: Record<string, Record<string, string | null>>;
  expandedPredMatchId: string | null;
  predFlash: string | null;
  predSaveState: Record<string, "saving" | "saved" | "error">;
  currentUser: string | null;
  apiError: string | null;
  lastPredSaveRef: React.MutableRefObject<number>;
  setMatchFilter: (f: "live" | "upcoming" | "completed" | "all") => void;
  setTeamFilter: React.Dispatch<React.SetStateAction<Set<string>>>;
  setFixtureHomeAwayFilter: (f: "all" | "home" | "away") => void;
  setOpenScoreRows: React.Dispatch<React.SetStateAction<Set<string>>>;
  setExpandedPredMatchId: (id: string | null) => void;
  setPredictions: React.Dispatch<React.SetStateAction<Record<string, Record<string, string | null>>>>;
  setPredSaveState: React.Dispatch<React.SetStateAction<Record<string, "saving" | "saved" | "error">>>;
  toggleTeamFilter: (code: string) => void;
  shareMatchCard: (m: any) => void;
  fetchScorecard: (matchId: string, force?: boolean) => Promise<void> | void;
  saveLocalPreds: (data: Record<string, Record<string, string | null>>) => void;
}

export default function FixturesPage({
  liveMatches,
  standings,
  matchFilter,
  teamFilter,
  fixtureHomeAwayFilter,
  scorecards,
  scorecardLoading,
  openScoreRows,
  predictions,
  expandedPredMatchId,
  predFlash,
  predSaveState,
  currentUser,
  apiError,
  lastPredSaveRef,
  setMatchFilter,
  setTeamFilter,
  setFixtureHomeAwayFilter,
  setOpenScoreRows,
  setExpandedPredMatchId,
  setPredictions,
  setPredSaveState,
  toggleTeamFilter,
  shareMatchCard,
  fetchScorecard,
  saveLocalPreds,
}: FixturesPageProps) {
    const grouped = liveMatches.reduce((acc: Record<string, any[]>, m: any) => {
      const d = m.date || (m.dateTimeGMT || "").split("T")[0] || "Unknown";
      if (!acc[d]) acc[d] = [];
      acc[d].push(m);
      return acc;
    }, {});
    const live = liveMatches.filter((m: any) => m.matchStarted && !m.matchEnded);
    const completed = liveMatches.filter((m: any) => m.matchEnded);
    const upcoming = liveMatches.filter((m: any) => !m.matchStarted && !m.matchEnded);

    const activeFilter = matchFilter;
    const filteredMatches = liveMatches.filter((m: any) => {
      const isLiveM = m.matchStarted && !m.matchEnded;
      const isDoneM = m.matchEnded;
      if (activeFilter === "live" && !isLiveM) return false;
      if (activeFilter === "upcoming" && (m.matchStarted || m.matchEnded)) return false;
      if (activeFilter === "completed" && !isDoneM) return false;
      if (teamFilter.size > 0) {
        const inMatch = (m.teamInfo || []).some((ti: any) => teamFilter.has(ti.shortname))
          || teamFilter.has(m.homeTeamCode) || teamFilter.has(m.awayTeamCode);
        if (!inMatch) return false;
        if (fixtureHomeAwayFilter === "home") return teamFilter.has(m.homeTeamCode);
        if (fixtureHomeAwayFilter === "away") return !teamFilter.has(m.homeTeamCode);
        return true;
      }
      return true;
    });
    const filteredGrouped = filteredMatches.reduce((acc: Record<string, any[]>, m: any) => {
      const d = m.date || (m.dateTimeGMT || "").split("T")[0] || "Unknown";
      if (!acc[d]) acc[d] = [];
      acc[d].push(m);
      return acc;
    }, {});

    return (
      <div>
        {/* Points Table */}
        {standings.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ marginBottom: 10 }}>
              <div className="sec-title" style={{ margin: 0 }}>Points Table</div>
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 28px 28px 28px 52px 36px", alignItems: "center", padding: "6px 10px 6px 12px", borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)" }}>
                {["#","TEAM","M","W","L","NRR","PTS"].map((h, hi) => (
                  <div key={h} style={{ fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-3)", textAlign: (hi > 1 ? "center" : "left") as "left"|"center" }}>{h}</div>
                ))}
              </div>
              {standings.map((t: any, i: number) => {
                const color = IPL_COLORS[t.teamCode] || "rgba(255,255,255,0.3)";
                const isTop4 = i < 4;
                const isSelected = teamFilter.has(t.teamCode);
                const logoUrl = TEAM_LOGO_CDN[t.teamCode] || t.teamLogo;
                const isBoundary = i === 3;
                return (
                  <React.Fragment key={t.teamCode}>
                    <div
                      onClick={() => toggleTeamFilter(t.teamCode)}
                      style={{
                        display: "grid", gridTemplateColumns: "28px 1fr 28px 28px 28px 52px 36px",
                        alignItems: "center", padding: "9px 10px 9px 12px",
                        cursor: "pointer",
                        borderBottom: isBoundary ? "none" : "1px solid rgba(255,255,255,0.04)",
                        background: isSelected ? color + "18" : isTop4 ? color + "06" : "transparent",
                        transition: "background 0.15s",
                        borderLeft: isTop4 ? `2px solid ${color}55` : "2px solid transparent",
                        position: "relative" as const,
                      }}>
                      {/* Rank */}
                      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.78rem", fontWeight: 700, color: isTop4 ? "#22c55e" : "var(--text-3)", lineHeight: 1 }}>{i + 1}</div>
                      {/* Team */}
                      <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                        {logoUrl
                          ? <img src={logoUrl} alt={t.teamCode} style={{ width: 26, height: 26, objectFit: "contain", flexShrink: 0, filter: isTop4 ? "none" : "grayscale(0.3) opacity(0.7)" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          : <div style={{ width: 26, height: 26, borderRadius: "50%", background: color + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.5rem", fontWeight: 700, color, flexShrink: 0 }}>{t.teamCode.slice(0,2)}</div>
                        }
                        <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: "0.78rem", letterSpacing: "0.03em", color: isTop4 ? color : "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{t.teamCode}</span>
                      </div>
                      {/* M */}
                      <div style={{ textAlign: "center" as const, fontFamily: "'Inter', sans-serif", fontSize: "0.78rem", color: "var(--text-3)", fontWeight: 400 }}>{t.matches}</div>
                      {/* W */}
                      <div style={{ textAlign: "center" as const, fontFamily: "'Inter', sans-serif", fontSize: "0.78rem", color: t.won > 0 ? "#4ade80" : "var(--text-3)", fontWeight: 700 }}>{t.won}</div>
                      {/* L */}
                      <div style={{ textAlign: "center" as const, fontFamily: "'Inter', sans-serif", fontSize: "0.78rem", color: t.lost > 0 ? "#f87171" : "var(--text-3)", fontWeight: 400 }}>{t.lost}</div>
                      {/* NRR */}
                      <div style={{ textAlign: "center" as const, fontFamily: "'Inter', sans-serif", fontSize: "0.66rem", fontWeight: 500, color: t.nrr > 0 ? "#4ade80" : t.nrr < 0 ? "#f87171" : "var(--text-3)" }}>
                        {t.nrr >= 0 ? "+" : ""}{t.nrr.toFixed(3)}
                      </div>
                      {/* PTS */}
                      <div style={{ textAlign: "center" as const, fontFamily: "'Inter', sans-serif", fontSize: "1rem", fontWeight: 800, lineHeight: 1, color: isTop4 ? color : "var(--text-3)", textShadow: isTop4 ? `0 0 12px ${color}44` : "none" }}>{t.points}</div>
                    </div>
                    {isBoundary && (
                      <div style={{ position: "relative" as const, height: 14, margin: "0", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ position: "absolute" as const, inset: "50% 0 auto", height: 1, background: "linear-gradient(90deg, transparent 0%, rgba(34,197,94,0.35) 30%, rgba(34,197,94,0.35) 70%, transparent 100%)" }} />
                        <span style={{ position: "relative", fontSize: "0.42rem", fontWeight: 700, letterSpacing: "0.12em", color: "#22c55e", background: "var(--surface)", padding: "0 8px", lineHeight: 1 }}>TOP 4 QUALIFY</span>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
        {/* Multi-team filter chips + Home/Away sub-pills */}
        {teamFilter.size > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, marginBottom: 8, alignItems: "center" }}>
              {Array.from(teamFilter).map(code => {
                const tc = IPL_COLORS[code] || "#888";
                return (
                  <div key={code} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: tc + "18", border: `1px solid ${tc}44`, fontSize: "0.68rem", fontWeight: 600, color: tc }}>
                    {code}
                    <button onClick={() => toggleTeamFilter(code)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1, color: "inherit", opacity: 0.6, fontSize: "0.72rem" }}>✕</button>
                  </div>
                );
              })}
              {teamFilter.size > 1 && (
                <button onClick={() => setTeamFilter(new Set())}
                  style={{ padding: "4px 10px", borderRadius: 20, fontSize: "0.62rem", fontWeight: 500, border: "1px solid var(--border)", background: "transparent", color: "var(--text-3)", cursor: "pointer", fontFamily: "inherit" }}>
                  Clear all
                </button>
              )}
            </div>
            <div data-no-swipe="true" style={{ display: "flex", gap: 6 }}>
              {([["all","All"], ["home","🏠 Home"], ["away","✈️ Away"]] as const).map(([f, label]) => {
                const anyColor = IPL_COLORS[Array.from(teamFilter)[0]] || "#888";
                return (
                  <button key={f} onClick={() => setFixtureHomeAwayFilter(f)}
                    style={{
                      padding: "4px 14px", borderRadius: 20, fontSize: "0.63rem", fontWeight: 600,
                      border: `1px solid ${fixtureHomeAwayFilter === f ? anyColor : "var(--border)"}`,
                      background: fixtureHomeAwayFilter === f ? anyColor + "22" : "transparent",
                      color: fixtureHomeAwayFilter === f ? anyColor : "var(--text-3)",
                      cursor: "pointer", fontFamily: "inherit",
                    }}>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {/* Filter bar */}
        <div style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 22, padding: 3, marginBottom: 16, gap: 2 }}>
          {(["live", "upcoming", "completed", "all"] as const).map(f => {
            const count = f === "live" ? live.length : f === "upcoming" ? upcoming.length : f === "completed" ? completed.length : liveMatches.length;
            const isActive = activeFilter === f;
            const activeColor = f === "live" ? "#f87171" : f === "upcoming" ? "var(--blue)" : f === "completed" ? "var(--text)" : "var(--gold)";
            const label = f === "live" ? "Live" : f === "upcoming" ? "Upcoming" : f === "completed" ? "Completed" : "All";
            return (
              <button key={f} onClick={() => setMatchFilter(f)}
                style={{
                  flex: 1, padding: "6px 0 7px", borderRadius: 18, border: "none", cursor: "pointer",
                  fontFamily: "inherit", fontSize: "0.65rem", fontWeight: 600,
                  transition: "all 0.18s ease",
                  background: isActive ? "var(--surface-3)" : "transparent",
                  color: isActive ? activeColor : "var(--text-3)",
                  boxShadow: isActive ? "0 1px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)" : "none",
                  WebkitTapHighlightColor: "transparent",
                  display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 1,
                }}>
                <span>{label}</span>
                <span style={{ fontSize: "0.56rem", opacity: 0.65, fontWeight: 500 }}>{count}</span>
              </button>
            );
          })}
        </div>
        {apiError && <div className="notice" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)", color: "#f87171", marginBottom: 12 }}>{apiError}</div>}
        {filteredMatches.length === 0 && (
          <div style={{ textAlign: "center" as const, color: "var(--text-3)", fontSize: "0.78rem", padding: "32px 0" }}>
            {teamFilter.size > 0 ? `No ${activeFilter === "all" ? "" : activeFilter + " "}${fixtureHomeAwayFilter !== "all" ? fixtureHomeAwayFilter + " " : ""}matches for ${Array.from(teamFilter).join(" / ")}` : activeFilter === "live" ? "No live matches right now" : activeFilter === "upcoming" ? "No upcoming matches" : "No matches"}
          </div>
        )}
        {Object.entries(filteredGrouped).map(([date, matches]: [string, any[]]) => (
          <div key={date}>
            <div style={{ fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)", margin: "16px 0 8px", fontWeight: 600 }}>
              {fmtDate(date)}
            </div>
            {matches.map((m: any) => {
              const isLive = m.matchStarted && !m.matchEnded;
              const isDone = m.matchEnded;
              const statusColor = isDone ? "var(--text-3)" : isLive ? "var(--live)" : "var(--blue)";
              const statusLabel = isDone ? "Completed" : isLive ? "Live" : fmtTime(m.dateTimeGMT);
              const mNum = getMatchNum(m.name);
              const teams = m.teamInfo || [];
              const matchIdStr = String(m.id);
              const sc = scorecards[matchIdStr];
              const isLoadingSc = scorecardLoading === matchIdStr;

              const isHome = teamFilter.size > 0 ? teamFilter.has(m.homeTeamCode) : null;
              return (
                <div key={m.id} className="match-card">
                  {/* Stadium backdrop */}
                  <div style={{
                    position: "absolute", inset: -4, zIndex: 0,
                    backgroundImage: `url(${import.meta.env.BASE_URL}match-bg.jpeg)`,
                    backgroundSize: "cover", backgroundPosition: "center 35%",
                    filter: `blur(3px) brightness(${isLive ? 0.28 : 0.24}) saturate(${isLive ? 1.0 : 0.7})`,
                  }} />
                  <div style={{
                    position: "absolute", inset: 0, zIndex: 1,
                    background: isLive
                      ? "linear-gradient(160deg, rgba(6,4,3,0.64) 0%, rgba(4,3,2,0.72) 100%)"
                      : "linear-gradient(160deg, rgba(6,4,3,0.68) 0%, rgba(4,3,2,0.76) 100%)",
                  }} />
                  <div style={{ position: "relative", zIndex: 2 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div className="match-status" style={{ color: statusColor }}>
                      {statusLabel}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {mNum && <div style={{ fontSize: "0.7rem", color: "var(--text-3)", fontWeight: 600 }}>{mNum}</div>}
                      {isHome !== null && (
                        <div style={{
                          fontSize: "0.55rem", fontWeight: 700, padding: "1px 6px", borderRadius: 8, letterSpacing: "0.06em",
                          background: isHome ? "rgba(52,211,153,0.12)" : "rgba(148,163,184,0.1)",
                          color: isHome ? "#34d399" : "#94a3b8",
                          border: `1px solid ${isHome ? "rgba(52,211,153,0.25)" : "rgba(148,163,184,0.2)"}`,
                        }}>
                          {isHome ? "HOME" : "AWAY"}
                        </div>
                      )}
                      {(isLive || isDone) && (
                        <button onClick={e => { e.stopPropagation(); shareMatchCard(m); }}
                          title="Share scorecard"
                          style={{ background: "none", border: "none", padding: "2px 4px", cursor: "pointer", color: "var(--text-3)", display: "flex", alignItems: "center" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  {(() => {
                    const cardWinner = isDone ? getMatchWinner(m) : null;
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          {teams.length > 0 ? teams.map((ti: any, i: number) => {
                            const isWinner = cardWinner && cardWinner !== "tie" && ti.shortname === cardWinner;
                            const teamCol = IPL_COLORS[ti.shortname] || "var(--text)";
                            return (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                                {i === 1 && <span style={{ fontFamily: "'Inter', sans-serif", color: "var(--text-3)", fontSize: "0.62rem", letterSpacing: "0.1em", margin: "0 1px" }}>VS</span>}
                                <img src={TEAM_LOGO_CDN[ti.shortname] || ti.img} alt={ti.shortname} style={{ width: 32, height: 32, objectFit: "contain", filter: `drop-shadow(0 1px 6px rgba(0,0,0,0.8))${isWinner ? ` drop-shadow(0 0 8px ${teamCol}99)` : ""}${isDone && cardWinner && cardWinner !== "tie" && !isWinner ? " grayscale(0.65) opacity(0.4)" : ""}`, transition: "filter 0.2s" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "1.08rem", fontWeight: isWinner ? 700 : 400, letterSpacing: "0.04em", color: isWinner ? "#fff" : isDone ? "var(--text-3)" : "var(--text)", textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}>{ti.shortname}</span>
                              </div>
                            );
                          }) : (
                            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "1rem", fontWeight: 500, letterSpacing: "0.04em", color: "var(--text)", textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}>{(m.name || "").replace(/,\s*\d+(?:st|nd|rd|th) Match.*/i, "")}</div>
                          )}
                      </div>
                    );
                  })()}
                  {(sc?.overview?.toss || m.toss) && (
                    <div style={{ fontSize: "0.6rem", color: "var(--text-3)", lineHeight: 1.35, marginTop: 7 }}>{sc?.overview?.toss || m.toss}</div>
                  )}
                  {(isDone && m.status) && (
                    <div style={{ fontSize: "0.62rem", color: "var(--blue)", fontWeight: 500, marginTop: 4 }}>{m.status}</div>
                  )}
                  {sc?.overview?.result && !m.status && (
                    <div style={{ fontSize: "0.62rem", color: "var(--text-2)", fontWeight: 500, marginTop: 4 }}>{sc.overview.result}</div>
                  )}
                  {(m.score || []).map((s: any, i: number) => {
                    const inningTeamCode = (s.inning || "").split(" Inning")[0].split(" Innings")[0].trim();
                    const teamColorForScore = IPL_COLORS[inningTeamCode] || "var(--text-2)";
                    const rowKey = `${matchIdStr}-score-${i}`;
                    const isRowOpen = openScoreRows.has(rowKey);
                    const inn = sc?.innings?.[i];
                    const canExpand = isDone || isLive;
                    const toggleRow = (e: React.MouseEvent) => {
                      e.stopPropagation();
                      if (!sc && canExpand) fetchScorecard(matchIdStr);
                      setOpenScoreRows(prev => { const n = new Set(prev); n.has(rowKey) ? n.delete(rowKey) : n.add(rowKey); return n; });
                    };
                    // Fantasy player check used by the InningsTable to bold + tag fantasy players
                    const isFantasyPlayer = (name: string) => {
                      const norm = (v: string) => v.replace(/\s*\(.*?\)\s*/g, "").trim().toLowerCase();
                      const ALIASES: Record<string,string> = { "mohammad shami":"mohammed shami","md shami":"mohammed shami" };
                      const sn = ALIASES[norm(name)] ?? norm(name);
                      for (const ft of Object.values(FANTASY_TEAMS)) { if (ft.players.some(p => norm(p.name) === sn)) return true; }
                      return false;
                    };
                    return (
                      <div key={i}>
                        {/* Score row */}
                        <div onClick={canExpand ? toggleRow : undefined} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "8px 10px",
                          marginTop: i === 0 ? 10 : 5,
                          borderRadius: 8,
                          borderLeft: `3px solid ${teamColorForScore}55`,
                          background: teamColorForScore + "0d",
                          cursor: canExpand ? "pointer" : "default", userSelect: "none" as const,
                        }}>
                          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.04em", color: teamColorForScore }}>
                            {inningTeamCode || (s.inning || "").replace(" Innings", "").replace(" Inning", "")}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.95rem", fontWeight: 700, letterSpacing: "0.02em", color: teamColorForScore }}>
                              {s.summary || (s.r != null ? `${s.r}/${s.w} (${s.o}ov)` : "")}
                            </span>
                            {canExpand && (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={teamColorForScore} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                                style={{ transition: "transform 0.22s ease", transform: isRowOpen ? "rotate(180deg)" : "none", flexShrink: 0, opacity: 0.7 }}>
                                <polyline points="6 9 12 15 18 9"/>
                              </svg>
                            )}
                          </div>
                        </div>
                        {/* Inline innings expansion */}
                        {isRowOpen && (
                          <div style={{ marginBottom: 10 }}>
                            {isLoadingSc && !inn && <div style={{ color: "var(--text-3)", fontSize: "0.72rem", padding: "6px 0" }}>Loading…</div>}
                            {inn && <InningsTable inning={inn} isFantasy={isFantasyPlayer} />}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {m.venue && (
                    <div style={{ fontSize: "0.58rem", color: "var(--text-3)", marginTop: 7, letterSpacing: "0.01em" }}>🏟 {m.venue}{m.homeTeamCode ? ` · ${m.homeTeamCode}` : ""}</div>
                  )}
                  {/* Prediction section — collapsible */}
                  {m.homeTeamCode && m.awayTeamCode && (() => {
                    const PRED_OWNERS = ["rajveer","mombasa","mumbai","ponygoat"] as const;
                    const rawPreds = predictions[matchIdStr] || {};
                    // Filter out stale picks for teams not playing in this match
                    const validTeams = new Set([m.homeTeamCode, m.awayTeamCode].filter(Boolean));
                    const preds = Object.fromEntries(
                      Object.entries(rawPreds).map(([uid, pick]) => [uid, validTeams.has(pick as string) ? pick : null])
                    );
                    const winner = isDone ? getMatchWinner(m) : null;
                    const isLocked = m.matchEnded || (m.matchStarted && currentUser !== "rajveer");
                    const correctCount = winner && winner !== "tie"
                      ? PRED_OWNERS.filter(id => preds[id] === winner).length : 0;
                    const anyPick = PRED_OWNERS.some(id => preds[id]);
                    const pickCount = PRED_OWNERS.filter(id => preds[id]).length;
                    if (isDone && !anyPick) return null;
                    const isOpen = expandedPredMatchId === matchIdStr;
                    const togglePred = (e: React.MouseEvent) => {
                      e.stopPropagation();
                      setExpandedPredMatchId(isOpen ? null : matchIdStr);
                    };
                    // Collapsed summary line
                    const collapsedSummary = isDone && winner && winner !== "tie" && anyPick
                      ? `${winner} won · ${correctCount}/4 ✓`
                      : isDone && winner === "tie"
                      ? "Tied"
                      : isLocked
                      ? pickCount > 0 ? `${pickCount}/4 picked` : "Locked"
                      : pickCount > 0 ? `${pickCount}/4 picked` : "Tap to predict";
                    return (
                      <div onClick={e => e.stopPropagation()} style={{ marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 7 }}>
                        {/* Tappable header row */}
                        <div onClick={togglePred} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", userSelect: "none" as const, WebkitTapHighlightColor: "transparent" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            {isDone ? (
                              <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M2 11l4-4 3 3 5-6" stroke={correctCount > 0 ? "#d4a843" : "var(--text-3)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            ) : isLocked ? (
                              <svg width="10" height="11" viewBox="0 0 14 16" fill="none"><rect x="2" y="7" width="10" height="8" rx="1.5" stroke="var(--text-3)" strokeWidth="1.6"/><path d="M4.5 7V5.5a2.5 2.5 0 0 1 5 0V7" stroke="var(--text-3)" strokeWidth="1.6" strokeLinecap="round"/></svg>
                            ) : (
                              <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="9.5" width="3" height="5" rx="0.8" fill="var(--gold)"/><rect x="6.5" y="6.5" width="3" height="8" rx="0.8" fill="var(--gold)" opacity="0.65"/><rect x="11.5" y="3.5" width="3" height="11" rx="0.8" fill="var(--gold)" opacity="0.35"/></svg>
                            )}
                            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.62rem", letterSpacing: "0.14em", fontWeight: isLocked || isDone ? 400 : 500, color: isDone || isLocked ? "var(--text-3)" : "var(--gold)" }}>
                              {isDone || isLocked ? "PREDICTIONS" : "PREDICT"}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: "0.56rem", color: isDone && correctCount > 0 ? "#22c55e" : "var(--text-3)", background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 10, padding: "1px 7px", lineHeight: 1.6 }}>{collapsedSummary}</span>
                            <svg width="8" height="5" viewBox="0 0 10 6" fill="none" style={{ transition: "transform 0.22s ease", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}><path d="M1 1l4 4 4-4" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </div>
                        </div>
                        {/* Expandable grid + intel */}
                        {isOpen && (
                          <>
                          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 8 }}>
                            {PRED_OWNERS.map(ownerId => {
                              const ft = FANTASY_TEAMS[ownerId];
                              const pick = preds[ownerId] || null;
                              const isCorrect = !!winner && winner !== "tie" && pick === winner;
                              const isWrong = !!winner && winner !== "tie" && pick !== null && pick !== winner;
                              const canEdit = currentUser === "rajveer" || (!isLocked && ownerId === currentUser);
                              return canEdit ? (
                                /* Big team pick cards */
                                (<div key={ownerId} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                  <span style={{ fontSize: "0.58rem", color: ft.color, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{ft.owner}</span>
                                  <div style={{ display: "flex", gap: 8 }}>
                                    {[m.homeTeamCode, m.awayTeamCode].map((code: string) => {
                                      const teamColor = IPL_COLORS[code] || "#f5a623";
                                      const isSelected = pick === code;
                                      const flashKey = `${matchIdStr}-${ownerId}-${code}`;
                                      const isFlashing = predFlash === flashKey;
                                      return (
                                        <button key={code}
                                          className={`pred-pick-card${isSelected ? " selected" : ""}${isFlashing ? " confirmed" : ""}`}
                                          style={{ "--pick-color": teamColor, "--pick-color-alpha": teamColor + "1e" } as React.CSSProperties}
                                          onClick={e => {
                                            e.stopPropagation();
                                            const newPick = pick === code ? null : code;
                                            const saveKey = `${matchIdStr}-${ownerId}`;
                                            lastPredSaveRef.current = Date.now();
                                            setPredictions(prev => {
                                              const updated = { ...prev, [matchIdStr]: { ...(prev[matchIdStr] || {}), [ownerId]: newPick } };
                                              saveLocalPreds(updated);
                                              return updated;
                                            });
                                            setPredSaveState(s => ({ ...s, [saveKey]: "saving" }));
                                            fetch(`/api/ipl/predictions/${encodeURIComponent(matchIdStr)}`, {
                                              method: "POST",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify({ ownerId, pick: newPick, requesterId: currentUser }),
                                            }).then(r => r.json()).then(d => {
                                              if (d.predictions) {
                                                lastPredSaveRef.current = Date.now();
                                                saveLocalPreds(d.predictions);
                                                setPredictions(d.predictions);
                                                setPredSaveState(s => ({ ...s, [saveKey]: "saved" }));
                                                setTimeout(() => setPredSaveState(s => { const n = { ...s }; delete n[saveKey]; return n; }), 2000);
                                              } else {
                                                lastPredSaveRef.current = Date.now();
                                                setPredictions(prev => {
                                                  const reverted = { ...prev, [matchIdStr]: { ...(prev[matchIdStr] || {}), [ownerId]: pick } };
                                                  saveLocalPreds(reverted);
                                                  return reverted;
                                                });
                                                setPredSaveState(s => ({ ...s, [saveKey]: "error" }));
                                                setTimeout(() => setPredSaveState(s => { const n = { ...s }; delete n[saveKey]; return n; }), 2500);
                                              }
                                            }).catch(() => {
                                              lastPredSaveRef.current = Date.now();
                                              setPredictions(prev => {
                                                const reverted = { ...prev, [matchIdStr]: { ...(prev[matchIdStr] || {}), [ownerId]: pick } };
                                                saveLocalPreds(reverted);
                                                return reverted;
                                              });
                                              setPredSaveState(s => ({ ...s, [saveKey]: "error" }));
                                              setTimeout(() => setPredSaveState(s => { const n = { ...s }; delete n[saveKey]; return n; }), 2500);
                                            });
                                          }}>
                                          <img src={TEAM_LOGO_CDN[code]} alt={code} style={{ width: 24, height: 24, objectFit: "contain", filter: isSelected ? "none" : "grayscale(0.3) opacity(0.7)", transition: "filter 0.2s" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.06em", color: isSelected ? "var(--text)" : "var(--text-3)", transition: "color 0.2s" }}>{code}</span>
                                          {isSelected && (
                                            <div style={{ position: "absolute", top: 4, right: 4, width: 12, height: 12, borderRadius: "50%", background: teamColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                              <svg width="7" height="7" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.8 2.8L8.5 2.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                            </div>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  {/* Save status indicator */}
                                  {(() => {
                                    const saveKey = `${matchIdStr}-${ownerId}`;
                                    const ss = predSaveState[saveKey];
                                    if (!ss) return null;
                                    return (
                                      <div style={{ display: "flex", alignItems: "center", gap: 5, height: 16 }}>
                                        {ss === "saving" && (
                                          <>
                                            <svg style={{ animation: "spin 0.8s linear infinite" }} width="10" height="10" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="var(--text-3)" strokeWidth="2.5" strokeDasharray="40 20"/></svg>
                                            <span style={{ fontSize: "0.55rem", color: "var(--text-3)", letterSpacing: "0.04em" }}>Saving…</span>
                                          </>
                                        )}
                                        {ss === "saved" && (
                                          <>
                                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.5 2.5L8.5 2" stroke="#22c55e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                            <span style={{ fontSize: "0.55rem", color: "#22c55e", letterSpacing: "0.04em" }}>Saved</span>
                                          </>
                                        )}
                                        {ss === "error" && (
                                          <>
                                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2l-6 6" stroke="#ef4444" strokeWidth="1.6" strokeLinecap="round"/></svg>
                                            <span style={{ fontSize: "0.55rem", color: "#ef4444", letterSpacing: "0.04em" }}>Failed — reverted</span>
                                          </>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>)
                              ) : (
                                /* Compact read-only row */
                                (<div key={ownerId} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                                  <span style={{ fontSize: "0.6rem", color: ft.color, fontWeight: 700, minWidth: 32, flexShrink: 0 }}>{ft.owner}</span>
                                  {pick ? (
                                    <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
                                      <img src={TEAM_LOGO_CDN[pick]} alt={pick} style={{ width: 15, height: 15, objectFit: "contain" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                      <span style={{ fontSize: "0.63rem", fontWeight: 600, color: isCorrect ? "#22c55e" : isWrong ? "#f87171" : "var(--text-2)" }}>{pick}</span>
                                      {isCorrect && <span style={{ fontSize: "0.68rem", color: "#22c55e" }}>✓</span>}
                                      {isWrong && <span style={{ fontSize: "0.68rem", color: "#f87171" }}>✗</span>}
                                    </div>
                                  ) : (
                                    <span style={{ fontSize: "0.6rem", color: "var(--text-3)", fontStyle: "italic" }}>—</span>
                                  )}
                                </div>)
                              );
                            })}
                          </div>
                          {/* Match Intel — H2H, ground avg, algorithmic pick */}
                          {(() => {
                            const h2h = getH2H(m.homeTeamCode, m.awayTeamCode);
                            const vd = VENUE_AVG[m.venue || ""];
                            const pred = predictNextMatch(m.homeTeamCode, m.awayTeamCode);
                            if (!h2h && !vd && !pred.pick) return null;
                            return (
                              <div style={{ marginTop: 8, borderTop: "1px solid var(--border)", paddingTop: 7, display: "flex", flexDirection: "column" as const, gap: 5 }}>
                                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.62rem", color: "var(--text-3)", letterSpacing: "0.14em", fontWeight: 400 }}>MATCH INTEL</div>
                                {h2h && (
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: "0.52rem", color: "var(--text-3)", letterSpacing: "0.04em", minWidth: 70, flexShrink: 0 }}>H2H</span>
                                    <span style={{ fontSize: "0.65rem" }}>
                                      <span style={{ fontWeight: 700, color: h2h.aWins >= h2h.bWins ? "var(--text)" : "var(--text-3)" }}>{m.homeTeamCode} {h2h.aWins}</span>
                                      <span style={{ margin: "0 4px", color: "var(--text-3)" }}>–</span>
                                      <span style={{ fontWeight: 700, color: h2h.bWins > h2h.aWins ? "var(--text)" : "var(--text-3)" }}>{h2h.bWins} {m.awayTeamCode}</span>
                                    </span>
                                  </div>
                                )}
                                {vd && (
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: "0.52rem", color: "var(--text-3)", letterSpacing: "0.04em", minWidth: 70, flexShrink: 0 }}>PRED TOTAL</span>
                                    <span style={{ fontSize: "0.65rem" }}>
                                      <span style={{ fontWeight: 700, color: "var(--text)" }}>{predictFirstInningsTotal(m.homeTeamCode, m.awayTeamCode, vd.avg)}</span>
                                      {vd.note && <span style={{ fontSize: "0.58rem", color: "var(--text-3)", marginLeft: 5 }}>{vd.note}</span>}
                                    </span>
                                  </div>
                                )}
                                {(pred.pick || pred.reason) && (
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: "0.52rem", color: "var(--text-3)", letterSpacing: "0.04em", minWidth: 70, flexShrink: 0 }}>ALGO PICK</span>
                                    {pred.pick ? (
                                      <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" as const }}>
                                        <img src={TEAM_LOGO_CDN[pred.pick]} alt={pred.pick} style={{ width: 13, height: 13, objectFit: "contain" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--gold)" }}>{pred.pick}</span>
                                        {isDone && (() => {
                                          const w = getMatchWinner(m);
                                          if (!w || w === "tie") return null;
                                          return pred.pick === w
                                            ? <span style={{ fontSize: "0.65rem", color: "#22c55e" }}>✓</span>
                                            : <span style={{ fontSize: "0.65rem", color: "#f87171" }}>✗</span>;
                                        })()}
                                        <span style={{ fontSize: "0.54rem", color: "var(--text-3)", fontStyle: "italic" }}>· {pred.reason}</span>
                                      </div>
                                    ) : (
                                      <span style={{ fontSize: "0.6rem", color: "var(--text-3)", fontStyle: "italic" }}>{pred.reason}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                          </>
                        )}
                      </div>
                    );
                  })()}
                  </div>{/* /zIndex-2 wrapper */}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
}
