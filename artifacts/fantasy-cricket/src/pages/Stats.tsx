import React from "react";
import { FANTASY_TEAMS } from "../teams";
import { getMatchWinner } from "../utils";

export const STAT_CATS = [
  { id: "fantasyPts", label: "Fantasy Pts", sub: "Most Fantasy Points" },
  { id: "orangeCap", label: "Orange Cap", sub: "Most Runs" },
  { id: "purpleCap", label: "Purple Cap", sub: "Most Wickets" },
  { id: "sixesLeader", label: "Sixes", sub: "Most Sixes" },
  { id: "foursLeader", label: "Fours", sub: "Most Fours" },
  { id: "dotsLeader", label: "Dot Balls", sub: "Most Dots Bowled" },
  { id: "catchesLeader", label: "Catches", sub: "Most Catches" },
  { id: "ecoLeader", label: "Economy", sub: "Min 2 overs" },
] as const;

function renderStatRow(entry: any, i: number, cat: string) {
  const isBat = ["orangeCap", "sixesLeader", "foursLeader"].includes(cat);
  const accentColors = ["#d4a843", "#94a3b8", "#71717a"];
  const accentColor = i < 3 ? accentColors[i] : "var(--border)";
  const statColor = i === 0 ? "#d4a843" : i < 3 ? "var(--text)" : "var(--blue)";
  const rankStyle = i < 3 ? { color: accentColors[i] } : undefined;
  return (
    <div key={entry.name} className="stat-row" style={{ borderLeft: `4px solid ${accentColor}` }}>
      <div className="stat-row-rank" style={rankStyle}>{i + 1}</div>
      <div className="stat-row-body">
        <div className="stat-row-name" style={{ color: entry.isFantasy ? "var(--text)" : "var(--text-2)" }}>
          {entry.name}
          {entry.isFantasy && <span className="fantasy-tag">F</span>}
        </div>
        {cat === "catchesLeader" || cat === "dotsLeader" ? (
          <div className="stat-row-sub">Fantasy Pts: {entry.fantasyPts ?? 0}</div>
        ) : isBat ? (
          <div className="stat-row-sub">
            {cat === "orangeCap" && `HS: ${entry.hs} · SR: ${entry.sr} · ${entry.innings} inn`}
            {cat === "sixesLeader" && `Runs: ${entry.runs} · SR: ${entry.sr}`}
            {cat === "foursLeader" && `Runs: ${entry.runs} · SR: ${entry.sr}`}
            {cat === "srLeader" && `${entry.runs} off ${entry.balls}b · ${entry.innings} inn`}
          </div>
        ) : (
          <div className="stat-row-sub">
            {cat === "purpleCap" && `Best: ${entry.best} · Eco: ${entry.eco} · ${entry.innings} inn`}
            {cat === "ecoLeader" && `${entry.wickets}W · ${entry.overs} ov`}
          </div>
        )}
      </div>
      <div className="stat-row-val-wrap">
        <div className="stat-row-val" style={{ color: statColor }}>
          {cat === "orangeCap" && entry.runs}
          {cat === "purpleCap" && entry.wickets}
          {cat === "sixesLeader" && entry.sixes}
          {cat === "foursLeader" && entry.fours}
          {cat === "catchesLeader" && entry.catches}
          {cat === "srLeader" && entry.sr}
          {cat === "ecoLeader" && entry.eco}
          {cat === "dotsLeader" && entry.dots}
        </div>
        <div className="stat-row-unit">
          {cat === "orangeCap" && "runs"}
          {cat === "purpleCap" && "wkts"}
          {cat === "sixesLeader" && "sixes"}
          {cat === "foursLeader" && "fours"}
          {cat === "catchesLeader" && "catches"}
          {cat === "srLeader" && "sr"}
          {cat === "ecoLeader" && "eco"}
          {cat === "dotsLeader" && "dots"}
        </div>
      </div>
    </div>
  );
}

export interface StatsPageProps {
  statsCategory: "fantasyPts" | "orangeCap" | "purpleCap" | "sixesLeader" | "foursLeader" | "catchesLeader" | "srLeader" | "ecoLeader" | "dotsLeader";
  statsFilter: "all" | "fantasy" | "predictions";
  statsExpanded: boolean;
  fantasyPtsOpen: boolean;
  predVisibleCount: number;
  predArchiveOpen: boolean;
  iplStats: any;
  statsLoading: boolean;
  liveMatches: any[];
  predictions: Record<string, Record<string, string | null>>;
  playerPoints: Record<string, number>;
  setStatsCategory: React.Dispatch<React.SetStateAction<"fantasyPts" | "orangeCap" | "purpleCap" | "sixesLeader" | "foursLeader" | "catchesLeader" | "srLeader" | "ecoLeader">>;
  setStatsFilter: (v: "all" | "fantasy" | "predictions") => void;
  setStatsExpanded: (v: boolean | ((x: boolean) => boolean)) => void;
  setFantasyPtsOpen: (fn: (x: boolean) => boolean) => void;
  setPredVisibleCount: (fn: ((c: number) => number)) => void;
  setPredArchiveOpen: (fn: (o: boolean) => boolean) => void;
}

export default function StatsPage(p: StatsPageProps) {
  const {
    statsCategory, statsFilter, statsExpanded, fantasyPtsOpen, predVisibleCount, predArchiveOpen,
    iplStats, statsLoading, liveMatches, predictions, playerPoints,
    setStatsCategory, setStatsFilter, setStatsExpanded, setFantasyPtsOpen, setPredVisibleCount, setPredArchiveOpen,
  } = p;

  const cat = statsCategory;
  const raw: any[] = iplStats?.[cat] || [];
  const entries = statsFilter === "fantasy" ? raw.filter((e: any) => e.isFantasy) : raw;

  return (
    <div>
      <div className="sec-title">IPL 2026 Stats</div>

      <div className="seg-pill">
        {([["all", "All IPL"], ["fantasy", "Fantasy"], ["predictions", "Predictions"]] as [string, string][]).map(([f, label]) => {
          const active = statsFilter === f;
          const activeColor = f === "fantasy" ? "#22c55e" : f === "predictions" ? "#a78bfa" : "var(--text)";
          return (
            <button key={f} onClick={() => { setStatsFilter(f as any); setStatsExpanded(false); if (f !== "fantasy" && statsCategory === "fantasyPts") setStatsCategory("orangeCap"); }}
              className={`seg-pill-btn${active ? " active" : ""}`}
              style={active ? { color: activeColor } : undefined}>
              {label}
            </button>
          );
        })}
      </div>

      {statsFilter !== "predictions" && (
        <div data-no-swipe="true" className="stats-cat-scroller">
          {STAT_CATS.map(c => (
            <button key={c.id} onClick={() => { setStatsCategory(c.id); setStatsExpanded(false); }} className={`stats-cat-btn ${statsCategory === c.id ? "active" : ""}`}>
              {c.label}
            </button>
          ))}
        </div>
      )}

      {statsFilter === "predictions" ? (() => {
        const PRED_OWNERS = ["rajveer","mombasa","mumbai","ponygoat"] as const;
        const sortedMatches = [...liveMatches]
          .filter((m: any) => m.homeTeamCode && m.awayTeamCode)
          .sort((a: any, b: any) => {
            if (a.dateTimeGMT && b.dateTimeGMT) return new Date(a.dateTimeGMT).getTime() - new Date(b.dateTimeGMT).getTime();
            return (a.id || 0) - (b.id || 0);
          })
          .map((m: any, idx: number) => ({ ...m, matchNum: idx + 1 }));

        const ownerScores: Record<string, number> = Object.fromEntries(PRED_OWNERS.map(id => [id, 0]));
        sortedMatches.forEach((m: any) => {
          if (m.matchNum <= 3 || !m.matchEnded) return;
          const winner = getMatchWinner(m);
          if (!winner || winner === "tie") return;
          const preds = predictions[String(m.id)] || {};
          PRED_OWNERS.forEach(id => { if (preds[id] === winner) ownerScores[id]++; });
        });


        return (
          <>
            {(() => {
              const PRED_BG: Record<string, string> = {
                rajveer:  `${import.meta.env.BASE_URL}lb-bg-rajveer.jpeg`,
                mombasa:  `${import.meta.env.BASE_URL}lb-bg-mumbai.jpeg`,
                mumbai:   `${import.meta.env.BASE_URL}lb-bg-mombasa.jpeg`,
                ponygoat: `${import.meta.env.BASE_URL}lb-bg-ponygoat.jpeg`,
              };
              return (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 12 }}>
                  {PRED_OWNERS.map(id => {
                    const ft = FANTASY_TEAMS[id];
                    return (
                      <div key={id} style={{ position: "relative", border: `1px solid ${ft.color}33`, borderRadius: 10, padding: "10px 4px", textAlign: "center" as const, overflow: "hidden" }}>
                        <div style={{
                          position: "absolute", inset: -6, zIndex: 0,
                          backgroundImage: `url(${PRED_BG[id]})`,
                          backgroundSize: "cover", backgroundPosition: "center 30%",
                          filter: "blur(14px) brightness(0.52) saturate(1.5)",
                        }} />
                        <div style={{
                          position: "absolute", inset: 0, zIndex: 1,
                          background: `linear-gradient(135deg, ${ft.color}28 0%, rgba(6,4,2,0.38) 100%)`,
                        }} />
                        <div style={{ position: "relative", zIndex: 2 }}>
                          <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
                            <div style={{ position: "relative", width: 36, height: 36, borderRadius: "50%", border: `2px solid ${ft.color}80`, overflow: "hidden", flexShrink: 0 }}>
                              <img src={`${import.meta.env.BASE_URL}avatars/${ft.avatar}`} alt={ft.owner} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: ft.avatarPosition || "center center", display: "block" }} />
                              <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle, transparent 40%, rgba(8,12,20,0.7) 80%, rgba(8,12,20,0.9) 100%)" }} />
                            </div>
                          </div>
                          <div style={{ fontSize: "1.3rem", fontWeight: 800, color: ft.color, lineHeight: 1, textShadow: "0 0 12px rgba(0,0,0,1), 0 2px 4px rgba(0,0,0,0.9)" }}>{ownerScores[id]}</div>
                          <div style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.7)", marginTop: 2, textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>{ft.owner}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {(() => {
              const archiveMatches = sortedMatches.filter((m: any) => m.matchEnded);
              const currentMatches = sortedMatches.filter((m: any) => !m.matchEnded);
              const visibleCurrent = currentMatches.slice(0, predVisibleCount);
              const hasMoreCurrent = currentMatches.length > predVisibleCount;

              const tableHeader = (
                <div style={{ display: "grid", gridTemplateColumns: "34px 1fr repeat(4, 36px)", padding: "8px 12px", borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.02)", alignItems: "center" }}>
                  <div style={{ fontSize: "0.56rem", color: "var(--text-3)", fontWeight: 700, letterSpacing: "0.08em" }}>#</div>
                  <div style={{ fontSize: "0.56rem", color: "var(--text-3)", fontWeight: 700, letterSpacing: "0.08em" }}>MATCH</div>
                  {PRED_OWNERS.map(id => (
                    <div key={id} style={{ fontSize: "0.56rem", color: FANTASY_TEAMS[id].color, fontWeight: 700, textAlign: "center" as const }}>
                      {FANTASY_TEAMS[id].owner.slice(0,3).toUpperCase()}
                    </div>
                  ))}
                </div>
              );

              const renderRow = (m: any, isLast: boolean) => {
                const isNil = m.matchNum <= 3;
                const isDone = m.matchEnded;
                const isLive = m.matchStarted && !m.matchEnded;
                const isUpcoming = !m.matchStarted;
                const winner = isDone ? getMatchWinner(m) : null;
                const preds = predictions[String(m.id)] || {};
                const picksIn = !isNil ? PRED_OWNERS.filter(id => preds[id]).length : 0;
                return (
                  <div key={m.id} style={{ display: "grid", gridTemplateColumns: "34px 1fr repeat(4, 36px)", padding: "8px 12px", borderBottom: isLast ? "none" : "1px solid var(--border)", alignItems: "center" }}>
                    <div style={{ fontSize: "0.65rem", fontWeight: 700, color: isLive ? "var(--live)" : "var(--text-3)" }}>
                      {m.matchNum === 999 ? "?" : `M${m.matchNum}`}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "0.68rem", fontWeight: 600, whiteSpace: "nowrap" as const }}>
                        <span style={{ color: winner === m.homeTeamCode ? "#22c55e" : "var(--text-2)" }}>{m.homeTeamCode}</span>
                        <span style={{ color: "var(--text-3)", padding: "0 3px", fontSize: "0.55rem" }}>vs</span>
                        <span style={{ color: winner === m.awayTeamCode ? "#22c55e" : "var(--text-2)" }}>{m.awayTeamCode}</span>
                      </div>
                      {isNil && <div style={{ fontSize: "0.5rem", color: "var(--text-3)", fontStyle: "italic" }}>no predictions</div>}
                      {isLive && <div style={{ fontSize: "0.5rem", color: "var(--live)" }}>● Live</div>}
                      {isUpcoming && !isNil && picksIn > 0 && <div style={{ fontSize: "0.5rem", color: "var(--text-3)" }}>{picksIn}/4 picked</div>}
                      {isUpcoming && !isNil && picksIn === 0 && <div style={{ fontSize: "0.5rem", color: "var(--text-3)" }}>open</div>}
                    </div>
                    {PRED_OWNERS.map(id => {
                      if (isNil) return <div key={id} style={{ textAlign: "center" as const, fontSize: "0.6rem", color: "var(--text-3)" }}>—</div>;
                      const pick = preds[id] || null;
                      if (!pick) return (
                        <div key={id} style={{ textAlign: "center" as const, fontSize: "0.65rem", color: "var(--text-3)" }}>
                          {isUpcoming ? <span style={{ opacity: 0.4 }}>?</span> : "—"}
                        </div>
                      );
                      const isCorrect = !!winner && winner !== "tie" && pick === winner;
                      const isWrong = !!winner && winner !== "tie" && pick !== winner;
                      const isPending = !isDone && !isLive;
                      return (
                        <div key={id} style={{ textAlign: "center" as const }}>
                          <div style={{ fontSize: "0.58rem", fontWeight: 700, lineHeight: 1.2, color: isCorrect ? "#22c55e" : isWrong ? "#f87171" : isPending ? "var(--text-3)" : "var(--text-2)" }}>{pick}</div>
                          {isCorrect && <div style={{ fontSize: "0.6rem", color: "#22c55e", lineHeight: 1 }}>✓</div>}
                          {isWrong && <div style={{ fontSize: "0.6rem", color: "#f87171", lineHeight: 1 }}>✗</div>}
                          {isLive && pick && <div style={{ fontSize: "0.48rem", color: "var(--text-3)", lineHeight: 1 }}>locked</div>}
                        </div>
                      );
                    })}
                  </div>
                );
              };

              return (
                <>
                  {archiveMatches.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <button
                        onClick={() => setPredArchiveOpen(o => !o)}
                        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "transparent", border: "1px solid var(--border)", borderRadius: predArchiveOpen ? "10px 10px 0 0" : 10, padding: "7px 12px", cursor: "pointer", color: "var(--text-3)", fontSize: "0.65rem", fontFamily: "inherit", marginBottom: 0 }}>
                        <span style={{ fontSize: "0.7rem" }}>{predArchiveOpen ? "▲" : "▼"}</span>
                        {predArchiveOpen ? "Hide" : "Show"} {archiveMatches.length} completed match{archiveMatches.length !== 1 ? "es" : ""}
                      </button>
                      {predArchiveOpen && (
                        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderTop: "none", borderRadius: "0 0 10px 10px", overflow: "hidden", opacity: 0.55, marginBottom: 10 }}>
                          {tableHeader}
                          {archiveMatches.map((m: any, idx: number) => renderRow(m, idx === archiveMatches.length - 1))}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", marginBottom: 4 }}>
                    {tableHeader}
                    {currentMatches.length === 0 && sortedMatches.length === 0 && (
                      <div style={{ padding: "20px 12px", fontSize: "0.75rem", color: "var(--text-3)", textAlign: "center" as const }}>Matches loading...</div>
                    )}
                    {currentMatches.length === 0 && sortedMatches.length > 0 && (
                      <div style={{ padding: "16px 12px", fontSize: "0.72rem", color: "var(--text-3)", textAlign: "center" as const }}>All matches completed — see archive above</div>
                    )}
                    {visibleCurrent.map((m: any, idx: number) => renderRow(m, idx === visibleCurrent.length - 1))}
                  </div>
                  {(hasMoreCurrent || predVisibleCount > 10) && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 2px 2px" }}>
                      {predVisibleCount > 10 ? (
                        <button onClick={() => setPredVisibleCount(c => Math.max(10, c - 10))}
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 20, padding: "5px 12px", cursor: "pointer", fontSize: "0.63rem", color: "var(--text-3)", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
                          <span>↑</span><span>Less</span>
                        </button>
                      ) : <div />}
                      <span style={{ fontSize: "0.58rem", color: "var(--text-3)" }}>
                        {Math.min(predVisibleCount, currentMatches.length) + archiveMatches.length} of {sortedMatches.length}
                      </span>
                      {hasMoreCurrent ? (
                        <button onClick={() => setPredVisibleCount(c => c + 10)}
                          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 20, padding: "5px 12px", cursor: "pointer", fontSize: "0.63rem", color: "var(--text-3)", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
                          <span>More</span><span>↓</span>
                        </button>
                      ) : <div />}
                    </div>
                  )}

                  <div style={{ fontSize: "0.58rem", color: "var(--text-3)", textAlign: "center" as const, padding: "2px 0 8px" }}>
                    Matches 1–3 had no predictions · +1 for each correct pick · picks refresh every 30s
                  </div>
                </>
              );
            })()}
          </>
        );
      })() : (
        <>
          {cat === "fantasyPts" && (() => {
            const fantasyPlayerMap = new Map<string, { color: string; owner: string }>();
            Object.values(FANTASY_TEAMS).forEach(ft =>
              ft.players.forEach((p) => fantasyPlayerMap.set(p.name, { color: ft.color, owner: ft.owner }))
            );
            const ranked = statsFilter === "fantasy"
              ? Array.from(fantasyPlayerMap.entries())
                  .map(([name, info]) => ({ name, pts: playerPoints[name] ?? 0, isFantasy: true, ...info }))
                  .sort((a, b) => b.pts - a.pts)
              : (() => {
                  const seen = new Set<string>();
                  const all: { name: string; pts: number; isFantasy: boolean; color: string; owner: string }[] = [];
                  for (const entry of [...(iplStats?.orangeCap || []), ...(iplStats?.purpleCap || [])]) {
                    if (seen.has(entry.name)) continue;
                    seen.add(entry.name);
                    const fi = fantasyPlayerMap.get(entry.name);
                    all.push({ name: entry.name, pts: entry.fantasyPts ?? playerPoints[entry.name] ?? 0, isFantasy: !!fi, color: fi?.color ?? "var(--text-3)", owner: fi?.owner ?? "" });
                  }
                  return all.sort((a, b) => b.pts - a.pts);
                })();
            const visible = fantasyPtsOpen ? ranked : ranked.slice(0, 10);
            const rankColors = ["#d4a843", "#94a3b8", "#cd7c3a"];
            return (
              <div className="stats-list-card">
                <div className="stats-list-card-header">
                  <div className="stats-list-card-title">Most Fantasy Points</div>
                  <div className="stats-list-card-meta">{ranked.length} players</div>
                </div>
                {visible.map((pp, i) => (
                  <div key={pp.name} className="fpts-row" style={i === visible.length - 1 ? { borderBottom: "none" } : undefined}>
                    <div className="fpts-rank" style={i < 3 ? { color: rankColors[i] } : undefined}>{i + 1}</div>
                    <div className="fpts-body">
                      <div className="fpts-name">{pp.name}</div>
                      {statsFilter === "fantasy" && pp.isFantasy && <div className="fpts-owner" style={{ color: pp.color }}>{pp.owner}</div>}
                    </div>
                    <div className="fpts-val" style={{ color: i === 0 ? "#d4a843" : i < 3 ? "var(--text)" : "var(--text-2)" }}>{pp.pts}</div>
                    <div className="fpts-unit">pts</div>
                  </div>
                ))}
                {ranked.length > 10 && (
                  <button onClick={() => setFantasyPtsOpen(x => !x)} className="stats-list-card-show-more">
                    {fantasyPtsOpen ? "Show less" : `Show all ${ranked.length}`}
                  </button>
                )}
              </div>
            );
          })()}
          {cat !== "fantasyPts" && !iplStats && statsLoading && (
            <div className="stat-empty">Loading stats...</div>
          )}
          {cat !== "fantasyPts" && iplStats && entries.length === 0 && (
            <div className="stat-empty">
              {iplStats.matchesProcessed === 0 ? "Stats will appear once match innings data is synced." : `No ${statsFilter === "fantasy" ? "fantasy " : ""}players found.`}
            </div>
          )}
          {cat !== "fantasyPts" && entries.length > 0 && (() => {
            const visible = statsExpanded ? entries : entries.slice(0, 10);
            const hasMore = entries.length > 10;
            return (
              <div className="stats-list-card">
                <div className="stats-list-card-header">
                  <div className="stats-list-card-title">{STAT_CATS.find(c => c.id === cat)?.sub}</div>
                  <div className="stats-list-card-meta">{iplStats.matchesProcessed} matches</div>
                </div>
                {visible.map((e: any, i: number) => renderStatRow(e, i, cat))}
                {hasMore && (
                  <button onClick={() => setStatsExpanded((x: boolean) => !x)} className="stats-list-card-show-more">
                    {statsExpanded ? `Show less` : `Show all ${entries.length}`}
                  </button>
                )}
              </div>
            );
          })()}
          {cat !== "fantasyPts" && iplStats && (
            <div className="stat-footnote">
              <span style={{ color: "#22c55e" }}>F</span> = in one of the 4 fantasy teams
            </div>
          )}
        </>
      )}
    </div>
  );
}
