import React from "react";
import { FANTASY_TEAMS } from "../teams";
import { applyMultiplier, getTeamData, getH2H } from "../utils";
import { IPL_COLORS, ROLE_COLORS, TEAM_LOGO_CDN, VENUE_AVG } from "../constants";

export interface WhatIfPageProps {
  wiSection: "swap" | "permatch" | "intel";
  wiTeamId: string;
  altCap: string;
  altVC: string;
  perMatchCaps: Record<string, Record<number, { cap: string; vc: string }>>;
  expandedWiMatch: number | null;
  playerMatchPoints: Record<string, any[]>;
  liveMatches: any[];
  playerPoints: Record<string, number>;
  teamScores: Array<{ id: string; total: number; [k: string]: any }>;
  setWiSection: (s: "swap" | "permatch" | "intel") => void;
  setWiTeamId: (id: string) => void;
  setAltCap: (s: string) => void;
  setAltVC: (s: string) => void;
  setPerMatchCaps: React.Dispatch<React.SetStateAction<Record<string, Record<number, { cap: string; vc: string }>>>>;
  setExpandedWiMatch: (n: number | null) => void;
}

export default function WhatIfPage(props: WhatIfPageProps) {
  const {
    wiSection, wiTeamId, altCap, altVC, perMatchCaps, expandedWiMatch,
    playerMatchPoints, liveMatches, playerPoints, teamScores,
    setWiSection, setWiTeamId, setAltCap, setAltVC, setPerMatchCaps, setExpandedWiMatch,
  } = props;

  const PRED_OWNERS = ["rajveer", "mombasa", "mumbai", "ponygoat"] as const;
  const wiTeam = FANTASY_TEAMS[wiTeamId];
  const hasMatchData = Object.keys(playerMatchPoints).length > 0;

  const rawPts: Record<string, number> = {};
  for (const p of wiTeam.players) {
    rawPts[p.name] = (playerMatchPoints[p.name] || [])
      .filter((e: any) => e.matchNum < 900)
      .reduce((s: number, e: any) => s + e.pts, 0);
  }

  const simulateSeason = (teamObj: typeof wiTeam, cap: string, vc: string) => {
    const sorted = teamObj.players.map(p => {
      const raw = (playerMatchPoints[p.name] || []).filter((e: any) => e.matchNum < 900).reduce((s: number, e: any) => s + e.pts, 0);
      return { ...p, adj: applyMultiplier(raw, p.name === cap, p.name === vc) };
    }).sort((a, b) => b.adj - a.adj);
    return Math.round(sorted.slice(0, 11).reduce((s, p) => s + p.adj, 0));
  };

  const currentSim = simulateSeason(wiTeam, wiTeam.captain, wiTeam.vc);
  const effectiveCap = altCap || wiTeam.captain;
  const effectiveVC  = altVC  || wiTeam.vc;
  const altSim  = simulateSeason(wiTeam, effectiveCap, effectiveVC);
  const delta   = altSim - currentSim;
  const changed = effectiveCap !== wiTeam.captain || effectiveVC !== wiTeam.vc;

  const upcoming = liveMatches
    .filter((m: any) => !m.matchStarted && m.dateTimeGMT && m.homeTeamCode && m.awayTeamCode)
    .sort((a: any, b: any) => new Date(a.dateTimeGMT).getTime() - new Date(b.dateTimeGMT).getTime())
    .slice(0, 5);

  const ownerExposure = (codes: string[]) =>
    PRED_OWNERS.map(oid => {
      const ft = FANTASY_TEAMS[oid];
      const count = ft.players.filter(p => codes.includes(p.ipl)).length;
      const capIn = codes.includes(ft.players.find(pp => pp.name === ft.captain)?.ipl || "");
      const vcIn  = codes.includes(ft.players.find(pp => pp.name === ft.vc)?.ipl || "");
      return { oid, ft, count, capIn, vcIn };
    }).sort((a, b) => b.count - a.count);

  return (
    <div className="tab-view">
      <div className="sec-title">What If?</div>

      <div className="seg-pill" style={{ marginBottom: 14 }}>
        {([["swap", "Season Swap"], ["permatch", "Per Match"], ["intel", "Match Intel"]] as const).map(([id, label]) => {
          const active = wiSection === id;
          return (
            <button key={id} onClick={() => setWiSection(id as "swap" | "permatch" | "intel")}
              className={`seg-pill-btn${active ? " active" : ""}`}
              style={active ? { color: "var(--gold)", boxShadow: "none" } : undefined}>
              {label}
            </button>
          );
        })}
      </div>

      {wiSection === "swap" && (
        <div>
          <div className="wi-owner-grid">
            {PRED_OWNERS.map(id => {
              const ft = FANTASY_TEAMS[id];
              const sel = wiTeamId === id;
              return (
                <button key={id} onClick={() => { setWiTeamId(id); setAltCap(""); setAltVC(""); }}
                  className="wi-owner-btn"
                  style={sel ? { background: ft.color + "22", borderColor: ft.color + "88" } : undefined}>
                  <div className="wi-owner-avatar" style={sel ? { borderColor: ft.color } : undefined}>
                    <img src={`${import.meta.env.BASE_URL}avatars/${ft.avatar}`} alt={ft.owner}
                      className="wi-owner-img" style={{ objectPosition: ft.avatarPosition || "center center" }} />
                  </div>
                  <div className="wi-owner-name" style={sel ? { color: ft.color } : undefined}>{ft.owner.toUpperCase()}</div>
                </button>
              );
            })}
          </div>

          {hasMatchData ? (
            <div style={{ background: "var(--surface)", border: `1px solid ${changed ? wiTeam.color + "55" : "var(--border)"}`, borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                <div style={{ textAlign: "center" as const, flex: 1 }}>
                  <div style={{ fontSize: "0.48rem", color: "var(--text-3)", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 4 }}>CURRENT</div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "1.6rem", fontWeight: 700, color: wiTeam.color, lineHeight: 1 }}>{currentSim}</div>
                  <div style={{ fontSize: "0.5rem", color: "var(--text-3)", marginTop: 3 }}>C: {wiTeam.captain.split(" ").pop()} · VC: {wiTeam.vc.split(" ").pop()}</div>
                </div>
                <div style={{ textAlign: "center" as const, flexShrink: 0, padding: "0 14px" }}>
                  {changed ? (
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "1.3rem", fontWeight: 800, color: delta > 0 ? "#2ecc8f" : delta < 0 ? "#f05050" : "var(--text-3)" }}>
                      {delta > 0 ? `+${delta}` : delta}
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.62rem", color: "var(--text-3)", maxWidth: 70 }}>tap C / VC below</div>
                  )}
                </div>
                <div style={{ textAlign: "center" as const, flex: 1 }}>
                  <div style={{ fontSize: "0.48rem", color: "var(--text-3)", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 4 }}>SIMULATED</div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "1.6rem", fontWeight: 700, color: changed ? (delta >= 0 ? "#2ecc8f" : "#f05050") : "var(--text-3)", lineHeight: 1 }}>{altSim}</div>
                  <div style={{ fontSize: "0.5rem", color: "var(--text-3)", marginTop: 3 }}>{changed ? `C: ${effectiveCap.split(" ").pop()} · VC: ${effectiveVC.split(" ").pop()}` : "—"}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 16, marginBottom: 14, textAlign: "center" as const }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-3)" }}>Match data loading…</div>
            </div>
          )}

          <div className="players-grid" style={{ borderTop: `2px solid ${wiTeam.color}70`, borderRadius: "var(--radius-md)", boxShadow: `0 -3px 14px ${wiTeam.color}33` }}>
            {[...wiTeam.players].sort((a, b) => (rawPts[b.name] || 0) - (rawPts[a.name] || 0)).map(p => {
              const raw = rawPts[p.name] || 0;
              const isCurCap = p.name === wiTeam.captain;
              const isCurVC  = p.name === wiTeam.vc;
              const isAltCap = p.name === effectiveCap && changed;
              const isAltVC  = p.name === effectiveVC && changed;
              const iplColor = IPL_COLORS[p.ipl] || "rgba(255,255,255,0.15)";
              const roleColor = ROLE_COLORS[p.role] || "var(--text-3)";
              return (
                <div key={p.name} className="player-card"
                  style={{ background: `linear-gradient(90deg, ${iplColor}08 0%, transparent 45%)` }}>
                  <img src={TEAM_LOGO_CDN[p.ipl]} alt={p.ipl}
                    style={{ width: 32, height: 32, objectFit: "contain", flexShrink: 0 }}
                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div className="player-name" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, fontSize: "0.88rem" }}>
                        {p.name}
                      </div>
                      {isCurCap && <span style={{ fontSize: "0.5rem", fontWeight: 800, background: "#d4a84322", color: "#d4a843", borderRadius: 4, padding: "1px 5px", flexShrink: 0 }}>C</span>}
                      {isCurVC  && <span style={{ fontSize: "0.5rem", fontWeight: 800, background: "rgba(255,255,255,0.07)", color: "var(--text-3)", borderRadius: 4, padding: "1px 5px", flexShrink: 0 }}>VC</span>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                      <span style={{
                        fontSize: "0.5rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" as const,
                        padding: "1px 5px", borderRadius: 4,
                        color: roleColor, background: roleColor + "18", border: `1px solid ${roleColor}30`, flexShrink: 0,
                      }}>{p.role}</span>
                      {p.price != null && <span style={{ fontSize: "0.48rem", fontWeight: 600, color: "var(--text-2)" }}>{p.price}cr</span>}
                      <span style={{ fontSize: "0.48rem", color: "var(--text-3)" }}>{raw} pts</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                    <button onClick={e => { e.stopPropagation(); if (altCap === p.name) { setAltCap(""); } else { setAltCap(p.name); if (altVC === p.name) setAltVC(""); } }}
                      style={{
                        background: isAltCap ? "#d4a843" : "var(--surface-2)",
                        color: isAltCap ? "#000" : "var(--text-3)",
                        border: `1px solid ${isAltCap ? "#d4a843" : "var(--border)"}`,
                        borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit",
                        fontSize: "0.62rem", fontWeight: 800, transition: "all 0.15s", lineHeight: 1,
                      }}>C</button>
                    <button onClick={e => { e.stopPropagation(); if (altVC === p.name) { setAltVC(""); } else { setAltVC(p.name); if (altCap === p.name) setAltCap(""); } }}
                      style={{
                        background: isAltVC ? "rgba(255,255,255,0.18)" : "var(--surface-2)",
                        color: isAltVC ? "var(--text)" : "var(--text-3)",
                        border: `1px solid ${isAltVC ? "rgba(255,255,255,0.28)" : "var(--border)"}`,
                        borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit",
                        fontSize: "0.62rem", fontWeight: 800, transition: "all 0.15s", lineHeight: 1,
                      }}>VC</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {wiSection === "permatch" && (() => {
        const teamObj = FANTASY_TEAMS[wiTeamId];
        const td = getTeamData(wiTeamId, playerPoints);
        const top11 = td.top11;
        const teamOverrides = perMatchCaps[wiTeamId] || {};

        const matchMap = new Map<number, string>();
        for (const p of teamObj.players) {
          for (const e of (playerMatchPoints[p.name] || [])) {
            if (e.matchNum < 900 && !matchMap.has(e.matchNum)) {
              matchMap.set(e.matchNum, (e.label as string) || `Match ${e.matchNum}`);
            }
          }
        }
        const matchNums = [...matchMap.keys()].sort((a, b) => a - b);

        let actualTotal = 0;
        let simTotal = 0;
        const breakdown: Array<{ matchNum: number; label: string; actual: number; sim: number; simCap: string; simVC: string; isOverridden: boolean }> = [];

        for (const matchNum of matchNums) {
          const override = teamOverrides[matchNum];
          const simCap = override?.cap || teamObj.captain;
          const simVC = override?.vc || teamObj.vc;
          let actualMatch = 0;
          let simMatch = 0;
          for (const p of teamObj.players) {
            if (!top11.has(p.name)) continue;
            const entry = (playerMatchPoints[p.name] || []).find((e: any) => e.matchNum === matchNum);
            if (!entry) continue;
            actualMatch += applyMultiplier(entry.pts, p.name === teamObj.captain, p.name === teamObj.vc);
            simMatch += applyMultiplier(entry.pts, p.name === simCap, p.name === simVC);
          }
          actualTotal += actualMatch;
          simTotal += simMatch;
          breakdown.push({ matchNum, label: matchMap.get(matchNum) || "", actual: Math.round(actualMatch), sim: Math.round(simMatch), simCap, simVC, isOverridden: !!override });
        }
        actualTotal = Math.round(actualTotal);
        simTotal = Math.round(simTotal);
        const delta = simTotal - actualTotal;

        const actualRank = teamScores.findIndex(s => s.id === wiTeamId) + 1;
        const simScoreList = teamScores.map(s => s.id === wiTeamId ? { ...s, total: simTotal } : s).sort((a, b) => b.total - a.total);
        const simRank = simScoreList.findIndex(s => s.id === wiTeamId) + 1;
        const hasOverrides = Object.keys(teamOverrides).length > 0;

        return (
          <div>
            <div className="wi-owner-grid">
              {PRED_OWNERS.map(id => {
                const ft = FANTASY_TEAMS[id];
                const sel = wiTeamId === id;
                return (
                  <button key={id} onClick={() => { setWiTeamId(id); setExpandedWiMatch(null); }}
                    className="wi-owner-btn"
                    style={sel ? { background: ft.color + "22", borderColor: ft.color + "88" } : undefined}>
                    <div className="wi-owner-avatar" style={sel ? { borderColor: ft.color } : undefined}>
                      <img src={`${import.meta.env.BASE_URL}avatars/${ft.avatar}`} alt={ft.owner}
                        className="wi-owner-img" style={{ objectPosition: ft.avatarPosition || "center center" }} />
                    </div>
                    <div className="wi-owner-name" style={sel ? { color: ft.color } : undefined}>{ft.owner.toUpperCase()}</div>
                  </button>
                );
              })}
            </div>

            {!hasMatchData ? (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 16, marginBottom: 14, textAlign: "center" as const }}>
                <div style={{ fontSize: "0.72rem", color: "var(--text-3)" }}>Match data loading…</div>
              </div>
            ) : (
              <div style={{ background: "var(--surface)", border: `1px solid ${hasOverrides ? teamObj.color + "55" : "var(--border)"}`, borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{ flex: 1, textAlign: "center" as const }}>
                    <div style={{ fontSize: "0.48rem", color: "var(--text-3)", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 4 }}>ACTUAL</div>
                    <div style={{ fontSize: "1.6rem", fontWeight: 700, color: teamObj.color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{actualTotal}</div>
                  </div>
                  <div style={{ textAlign: "center" as const, flexShrink: 0, padding: "0 14px" }}>
                    {hasOverrides ? (
                      <>
                        <div style={{ fontSize: "1.3rem", fontWeight: 800, color: delta > 0 ? "#2ecc8f" : delta < 0 ? "#f05050" : "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>
                          {delta > 0 ? `+${delta}` : delta}
                        </div>
                        <div style={{ fontSize: "0.48rem", marginTop: 3, color: simRank < actualRank ? "#2ecc8f" : simRank > actualRank ? "#f05050" : "var(--text-3)" }}>
                          {simRank === actualRank ? "rank unchanged" : `#${actualRank} → #${simRank}`}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: "0.58rem", color: "var(--text-3)", maxWidth: 62, lineHeight: 1.4 }}>tap a match to override C/VC</div>
                    )}
                  </div>
                  <div style={{ flex: 1, textAlign: "center" as const }}>
                    <div style={{ fontSize: "0.48rem", color: "var(--text-3)", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 4 }}>SIMULATED</div>
                    <div style={{ fontSize: "1.6rem", fontWeight: 700, lineHeight: 1, fontVariantNumeric: "tabular-nums", color: hasOverrides ? (delta >= 0 ? "#2ecc8f" : "#f05050") : "var(--text-3)" }}>{simTotal}</div>
                  </div>
                </div>
              </div>
            )}

            {matchNums.length === 0 ? (
              <div style={{ textAlign: "center" as const, color: "var(--text-3)", padding: "30px 0", fontSize: "0.75rem" }}>No match data yet</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 6 }}>
                {breakdown.map(({ matchNum, label, actual, sim, simCap, simVC, isOverridden }) => {
                  const isExpanded = expandedWiMatch === matchNum;
                  const matchDelta = sim - actual;
                  return (
                    <div key={matchNum} style={{ background: "var(--surface)", border: `1px solid ${isOverridden ? teamObj.color + "55" : "var(--border)"}`, borderRadius: 12, overflow: "hidden" }}>
                      <button onClick={() => setExpandedWiMatch(isExpanded ? null : matchNum)}
                        style={{ width: "100%", padding: "10px 12px", display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", cursor: "pointer", textAlign: "left" as const, fontFamily: "inherit" }}>
                        <div style={{ fontSize: "0.5rem", fontWeight: 800, color: teamObj.color, letterSpacing: "0.06em", flexShrink: 0, minWidth: 22 }}>M{matchNum}</div>
                        <div style={{ flex: 1, fontSize: "0.68rem", color: "var(--text)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{label}</div>
                        {isOverridden && <div style={{ width: 5, height: 5, borderRadius: "50%", background: teamObj.color, flexShrink: 0 }} />}
                        <div style={{ fontSize: "0.6rem", fontVariantNumeric: "tabular-nums", flexShrink: 0, color: isOverridden ? (matchDelta > 0 ? "#2ecc8f" : matchDelta < 0 ? "#f05050" : "var(--text-3)") : "var(--text-2)" }}>
                          {isOverridden ? `${matchDelta > 0 ? "+" : ""}${matchDelta} (${sim})` : actual}
                        </div>
                        <div style={{ color: "var(--text-3)", fontSize: "0.55rem", flexShrink: 0, marginLeft: 2 }}>{isExpanded ? "▲" : "▼"}</div>
                      </button>

                      {isExpanded && (
                        <div style={{ borderTop: "1px solid var(--border)", padding: "10px 12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <div style={{ fontSize: "0.52rem", color: "var(--text-3)", letterSpacing: "0.07em" }}>
                              C: <span style={{ color: teamObj.color }}>{simCap.split(" ").slice(-1)[0]}</span>
                              {" · "}VC: <span style={{ color: "rgba(255,255,255,0.6)" }}>{simVC.split(" ").slice(-1)[0]}</span>
                              {isOverridden && <span style={{ color: teamObj.color, marginLeft: 5 }}>●</span>}
                            </div>
                            {isOverridden && (
                              <button onClick={() => setPerMatchCaps(prev => {
                                const t = { ...(prev[wiTeamId] || {}) };
                                delete t[matchNum];
                                return { ...prev, [wiTeamId]: t };
                              })} style={{ fontSize: "0.5rem", color: "var(--text-3)", background: "transparent", border: "1px solid var(--border)", borderRadius: 6, padding: "2px 8px", cursor: "pointer", fontFamily: "inherit" }}>
                                Reset
                              </button>
                            )}
                          </div>
                          {[...teamObj.players].sort((a, b) => {
                            const aE = (playerMatchPoints[a.name] || []).find((e: any) => e.matchNum === matchNum);
                            const bE = (playerMatchPoints[b.name] || []).find((e: any) => e.matchNum === matchNum);
                            return (bE?.pts || 0) - (aE?.pts || 0);
                          }).map(p => {
                            const entry = (playerMatchPoints[p.name] || []).find((e: any) => e.matchNum === matchNum);
                            const pts = entry?.pts ?? 0;
                            const isCurSimCap = p.name === simCap;
                            const isCurSimVC = p.name === simVC;
                            const isInTop11 = top11.has(p.name);
                            const roleColor = ROLE_COLORS[p.role] || "var(--text-3)";
                            return (
                              <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", opacity: isInTop11 ? 1 : 0.42 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                    <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{p.name}</span>
                                    <span style={{ fontSize: "0.45rem", fontWeight: 700, color: roleColor, background: roleColor + "18", border: `1px solid ${roleColor}30`, borderRadius: 3, padding: "1px 4px", flexShrink: 0 }}>{p.role}</span>
                                  </div>
                                  <div style={{ fontSize: "0.55rem", marginTop: 2, fontVariantNumeric: "tabular-nums", color: pts > 0 ? "var(--text-2)" : "var(--text-3)" }}>
                                    {pts} pts{!isInTop11 && <span style={{ color: "var(--text-3)", marginLeft: 4 }}>bench</span>}
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                                  <button onClick={() => setPerMatchCaps(prev => {
                                    const cur = (prev[wiTeamId] || {})[matchNum];
                                    const curVC = cur?.vc || teamObj.vc;
                                    return {
                                      ...prev,
                                      [wiTeamId]: {
                                        ...(prev[wiTeamId] || {}),
                                        [matchNum]: isCurSimCap
                                          ? { cap: teamObj.captain, vc: curVC }
                                          : { cap: p.name, vc: curVC === p.name ? teamObj.vc : curVC },
                                      },
                                    };
                                  })} style={{
                                    background: isCurSimCap ? "#d4a843" : "var(--surface-2)",
                                    color: isCurSimCap ? "#000" : "var(--text-3)",
                                    border: `1px solid ${isCurSimCap ? "#d4a843" : "var(--border)"}`,
                                    borderRadius: 6, padding: "4px 9px", cursor: "pointer", fontFamily: "inherit",
                                    fontSize: "0.62rem", fontWeight: 800, lineHeight: 1,
                                  }}>C</button>
                                  <button onClick={() => setPerMatchCaps(prev => {
                                    const cur = (prev[wiTeamId] || {})[matchNum];
                                    const curCap = cur?.cap || teamObj.captain;
                                    return {
                                      ...prev,
                                      [wiTeamId]: {
                                        ...(prev[wiTeamId] || {}),
                                        [matchNum]: isCurSimVC
                                          ? { cap: curCap, vc: teamObj.vc }
                                          : { cap: curCap === p.name ? teamObj.captain : curCap, vc: p.name },
                                      },
                                    };
                                  })} style={{
                                    background: isCurSimVC ? "rgba(255,255,255,0.18)" : "var(--surface-2)",
                                    color: isCurSimVC ? "var(--text)" : "var(--text-3)",
                                    border: `1px solid ${isCurSimVC ? "rgba(255,255,255,0.28)" : "var(--border)"}`,
                                    borderRadius: 6, padding: "4px 9px", cursor: "pointer", fontFamily: "inherit",
                                    fontSize: "0.62rem", fontWeight: 800, lineHeight: 1,
                                  }}>VC</button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {hasOverrides && (
              <button onClick={() => { setPerMatchCaps(prev => ({ ...prev, [wiTeamId]: {} })); }}
                style={{ width: "100%", marginTop: 12, padding: "10px 0", background: "transparent", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text-3)", fontSize: "0.65rem", fontFamily: "inherit", cursor: "pointer" }}>
                Reset All Overrides
              </button>
            )}
          </div>
        );
      })()}

      {wiSection === "intel" && (
        <div>
          {upcoming.length === 0 ? (
            <div style={{ textAlign: "center" as const, color: "var(--text-3)", padding: "40px 0", fontSize: "0.8rem" }}>No upcoming matches found</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" as const, gap: 14 }}>
              {upcoming.map((m: any) => {
                const codes = [m.homeTeamCode, m.awayTeamCode].filter(Boolean);
                const venue = VENUE_AVG[m.venue] || null;
                const h2h = (m.homeTeamCode && m.awayTeamCode) ? getH2H(m.homeTeamCode, m.awayTeamCode) : null;
                const exposure = ownerExposure(codes);
                const dateStr = m.dateTimeGMT ? new Date(m.dateTimeGMT).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "";
                return (
                  <div key={m.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
                    <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid var(--border)", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.95rem", fontWeight: 600, color: "var(--text)", letterSpacing: "0.02em" }}>
                          {m.homeTeamCode} <span style={{ color: "var(--text-3)", fontWeight: 400 }}>vs</span> {m.awayTeamCode}
                        </div>
                        <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" as const }}>
                          {h2h && (
                            <span style={{ fontSize: "0.55rem", color: "var(--text-3)", background: "var(--surface-3)", borderRadius: 5, padding: "2px 7px", whiteSpace: "nowrap" as const }}>
                              H2H: {m.homeTeamCode} {h2h.aWins}–{h2h.bWins} {m.awayTeamCode}
                            </span>
                          )}
                          {venue && (
                            <span style={{ fontSize: "0.55rem", color: "var(--text-3)", background: "var(--surface-3)", borderRadius: 5, padding: "2px 7px" }}>
                              avg {venue.avg}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: "0.6rem", color: "var(--text-3)", textAlign: "right" as const, flexShrink: 0, marginLeft: 10 }}>{dateStr}</div>
                    </div>
                    <div style={{ padding: "12px 14px" }}>
                      <div style={{ fontSize: "0.5rem", color: "var(--text-3)", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 8 }}>OWNER EXPOSURE</div>
                      <div style={{ display: "flex", flexDirection: "column" as const, gap: 7 }}>
                        {exposure.map(({ oid, ft, count, capIn, vcIn }) => (
                          <div key={oid} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--text)", minWidth: 44 }}>{ft.owner}</div>
                            <div style={{ flex: 1 }}>
                              <div style={{ height: 4, background: "var(--surface-3)", borderRadius: 2, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${Math.round((count / 18) * 100)}%`, background: ft.color, borderRadius: 2, transition: "width 0.4s ease" }} />
                              </div>
                            </div>
                            <div style={{ fontSize: "0.65rem", color: ft.color, fontWeight: 700, minWidth: 18, textAlign: "center" as const }}>{count}</div>
                            <div style={{ fontSize: "0.5rem", minWidth: 40, textAlign: "right" as const }}>
                              {capIn && <span style={{ color: "#d4a843", fontWeight: 700 }}>C✓ </span>}
                              {vcIn  && <span style={{ color: "var(--text-2)" }}>VC✓</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                      {venue && (
                        <div style={{ marginTop: 10, fontSize: "0.58rem", color: "var(--text-3)", background: "var(--surface-2)", borderRadius: 8, padding: "6px 10px" }}>
                          {venue.note} · Top: {venue.high}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
