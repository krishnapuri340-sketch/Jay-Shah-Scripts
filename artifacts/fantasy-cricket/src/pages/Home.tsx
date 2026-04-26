import React from "react";
import { TEAM_LOGO_CDN, IPL_COLORS, VENUE_AVG } from "../constants";
import { FANTASY_TEAMS } from "../teams";
import {
  getH2H, predictNextMatch, predictFirstInningsTotal,
  getMatchNum, getMatchWinner, getTeamData, rankLabel, applyMultiplier,
} from "../utils";
import { usePoints } from "../context/PointsContext";

interface HomePageProps {
  countdown: { text: string; matchName: string; venue?: string; homeTeam?: string; awayTeam?: string } | null;
  liveMatches: any[];
  intelOpen: boolean;
  setIntelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  scorecards: Record<string, any>;
  setTab: (t: string) => void;
  setMatchFilter: React.Dispatch<React.SetStateAction<"upcoming" | "live" | "completed" | "all">>;
  handleLbRefresh: () => void | Promise<void>;
  lbRefreshing: boolean;
  shareLeaderboard: () => void | Promise<void>;
  setSelectedTeam: (id: string) => void;
  chartXiFilter: "all" | "xi";
  setChartXiFilter: React.Dispatch<React.SetStateAction<"all" | "xi">>;
  chartHover: number | null;
  setChartHover: React.Dispatch<React.SetStateAction<number | null>>;
  selectedAwardIdx: number;
  setSelectedAwardIdx: React.Dispatch<React.SetStateAction<number>>;
  awardXiFilter: "all" | "xi";
  setAwardXiFilter: React.Dispatch<React.SetStateAction<"all" | "xi">>;
}

export default function HomePage(props: HomePageProps) {
  const {
    countdown, liveMatches, intelOpen, setIntelOpen, scorecards,
    setTab, setMatchFilter, handleLbRefresh, lbRefreshing, shareLeaderboard,
    setSelectedTeam,
    chartXiFilter, setChartXiFilter, chartHover, setChartHover,
    selectedAwardIdx, setSelectedAwardIdx, awardXiFilter, setAwardXiFilter,
  } = props;
  const { playerPoints, teamScores, matchHistory, playerMatchPoints } = usePoints();

    return (
      <div>
        {/* Countdown to next match */}
        {countdown && (
          <div className="countdown-card">
            {/* Blurred colosseum background */}
            <div style={{
              position: "absolute", inset: -6, zIndex: 0,
              backgroundImage: `url(${import.meta.env.BASE_URL}countdown-bg.jpeg)`,
              backgroundSize: "cover", backgroundPosition: "center 40%",
              filter: "blur(10px) brightness(0.38) saturate(1.2)",
            }} />
            {/* Warm amber vignette */}
            <div style={{
              position: "absolute", inset: 0, zIndex: 1,
              background: "linear-gradient(160deg, rgba(245,166,35,0.12) 0%, rgba(6,4,2,0.6) 60%, rgba(6,4,2,0.75) 100%)",
            }} />
            <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
              {/* Left: timer */}
              <div>
                <div className="countdown-timer">{countdown.text}</div>
                <div className="countdown-label">next match</div>
              </div>
              {/* Right: team logos + venue */}
              {(countdown.homeTeam && countdown.awayTeam) ? (
                <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <img src={TEAM_LOGO_CDN[countdown.homeTeam]} alt={countdown.homeTeam}
                      style={{ width: 22, height: 22, objectFit: "contain" }}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.88rem", fontWeight: 700, color: "var(--text)", letterSpacing: "0.04em" }}>{countdown.homeTeam}</span>
                    <span style={{ fontSize: "0.6rem", color: "var(--text-3)", fontWeight: 500 }}>vs</span>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.88rem", fontWeight: 700, color: "var(--text)", letterSpacing: "0.04em" }}>{countdown.awayTeam}</span>
                    <img src={TEAM_LOGO_CDN[countdown.awayTeam]} alt={countdown.awayTeam}
                      style={{ width: 22, height: 22, objectFit: "contain" }}
                      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                  {countdown.venue && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: "0.62rem", opacity: 0.7 }}>🏟</span>
                      <span style={{ fontSize: "0.56rem", color: "var(--text-3)" }}>{countdown.venue}</span>
                    </div>
                  )}
                </div>
              ) : countdown.venue ? (
                <div style={{ fontSize: "0.56rem", color: "var(--text-3)", alignSelf: "center" }}>{countdown.venue}</div>
              ) : null}
            </div>
            {(() => {
              const nextM = liveMatches.filter((m: any) => !m.matchStarted && m.dateTimeGMT)
                .sort((a: any, b: any) => new Date(a.dateTimeGMT).getTime() - new Date(b.dateTimeGMT).getTime())[0];
              if (!nextM?.homeTeamCode || !nextM?.awayTeamCode) return null;
              const stakes = Object.values(FANTASY_TEAMS).map(ft => ({
                owner: ft.owner, color: ft.color,
                count: ft.players.filter((p: any) => p.ipl === nextM.homeTeamCode || p.ipl === nextM.awayTeamCode).length
              }));
              const h2h = getH2H(nextM.homeTeamCode, nextM.awayTeamCode);
              const vd = VENUE_AVG[nextM.venue || ""];
              const pred = predictNextMatch(nextM.homeTeamCode, nextM.awayTeamCode);
              const hasIntel = h2h || vd;
              const sortedStakes = [...stakes].filter(s => s.count > 0).sort((a, b) => b.count - a.count);
              return (
                <div style={{ borderTop: "1px solid rgba(255,200,120,0.1)", paddingTop: 9, display: "flex", flexDirection: "column" as const, gap: 0, position: "relative", zIndex: 2 }}>
                  {/* Row 1: picks — consistent size, sorted by count */}
                  {sortedStakes.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 8 }}>
                      <span style={{ fontSize: "0.55rem", color: "var(--text-3)", letterSpacing: "0.05em", flexShrink: 0 }}>PICKS</span>
                      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
                        {sortedStakes.map(s => (
                          <span key={s.owner} style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: s.color }}>{s.owner}</span>
                            <span style={{ fontSize: "0.6rem", fontWeight: 500, color: "var(--text-3)" }}>{s.count}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Collapsible intel section */}
                  {hasIntel && (
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 7 }}>
                      {/* Toggle row */}
                      <div onClick={() => setIntelOpen(o => !o)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" as const }}>
                        <span style={{ fontSize: "0.55rem", color: "var(--text-3)", letterSpacing: "0.05em" }}>MATCH INTEL</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {!intelOpen && pred.pick && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <img src={TEAM_LOGO_CDN[pred.pick]} alt={pred.pick} style={{ width: 13, height: 13, objectFit: "contain" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                              <span style={{ fontSize: "0.63rem", fontWeight: 700, color: "var(--gold)" }}>{pred.pick}</span>
                            </div>
                          )}
                          <span style={{ fontSize: "0.55rem", color: "var(--text-3)", display: "inline-block", transition: "transform 0.2s", transform: intelOpen ? "rotate(180deg)" : "none" }}>▼</span>
                        </div>
                      </div>
                      {/* Expanded rows */}
                      {intelOpen && (
                        <div style={{ display: "flex", flexDirection: "column" as const, gap: 7, marginTop: 9 }}>
                          {h2h && (
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: "0.55rem", color: "var(--text-3)", letterSpacing: "0.05em", flexShrink: 0, minWidth: 90 }}>H2H</span>
                              <span style={{ fontSize: "0.68rem" }}>
                                <span style={{ fontWeight: 700, color: h2h.aWins >= h2h.bWins ? "var(--text)" : "var(--text-3)" }}>{nextM.homeTeamCode} {h2h.aWins}</span>
                                <span style={{ margin: "0 5px", color: "var(--text-3)" }}>–</span>
                                <span style={{ fontWeight: 700, color: h2h.bWins > h2h.aWins ? "var(--text)" : "var(--text-3)" }}>{h2h.bWins} {nextM.awayTeamCode}</span>
                              </span>
                            </div>
                          )}
                          {vd && (
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ fontSize: "0.55rem", color: "var(--text-3)", letterSpacing: "0.05em", flexShrink: 0, minWidth: 90 }}>PRED TOTAL</span>
                              <span style={{ fontSize: "0.68rem" }}>
                                <span style={{ fontWeight: 700, color: "var(--text)" }}>{predictFirstInningsTotal(nextM.homeTeamCode, nextM.awayTeamCode, vd.avg)}</span>
                                <span style={{ fontSize: "0.6rem", color: "var(--text-3)", marginLeft: 6 }}>{vd.note}</span>
                              </span>
                            </div>
                          )}
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: "0.55rem", color: "var(--text-3)", letterSpacing: "0.05em", flexShrink: 0, minWidth: 90 }}>MATCH PRED</span>
                            {pred.pick ? (
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <img src={TEAM_LOGO_CDN[pred.pick]} alt={pred.pick} style={{ width: 15, height: 15, objectFit: "contain" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--gold)" }}>{pred.pick}</span>
                                <span style={{ fontSize: "0.56rem", color: "var(--text-3)", fontStyle: "italic" }}>· {pred.reason}</span>
                              </div>
                            ) : (
                              <span style={{ fontSize: "0.6rem", color: "var(--text-3)", fontStyle: "italic" }}>{pred.reason}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
        {(() => {
          const liveNow = liveMatches.filter((m: any) => m.matchStarted && !m.matchEnded);
          if (liveNow.length === 0) return null;
          return (
            <div style={{ marginBottom: 16 }}>
              <div className="sec-title" style={{ marginBottom: 8 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--live)", display: "inline-block", boxShadow: "0 0 6px var(--live)", animation: "pulse 1.4s ease-in-out infinite" }} />
                  Live
                </span>
              </div>
              {liveNow.map((m: any) => {
                const matchIdStr = String(m.id);
                const sc = scorecards[matchIdStr];
                const teams = m.teamInfo || [];
                const mNum = getMatchNum(m.name);
                const cardWinner = getMatchWinner(m);
                return (
                  <div key={m.id} className="match-card" style={{ marginBottom: 8, cursor: "pointer" }}
                    onClick={() => { setTab("fixtures"); setMatchFilter("live"); }}>
                    {/* Stadium backdrop */}
                    <div style={{ position: "absolute", inset: -4, zIndex: 0, backgroundImage: `url(${import.meta.env.BASE_URL}match-bg.jpeg)`, backgroundSize: "cover", backgroundPosition: "center 35%", filter: "blur(3px) brightness(0.28) saturate(1.0)" }} />
                    <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "linear-gradient(160deg, rgba(6,4,3,0.64) 0%, rgba(4,3,2,0.72) 100%)" }} />
                    <div style={{ position: "relative", zIndex: 2 }}>
                      {/* Header row */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <div className="match-status" style={{ color: "var(--live)" }}>Live</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {mNum && <div style={{ fontSize: "0.7rem", color: "var(--text-3)", fontWeight: 600 }}>{mNum}</div>}
                          <div style={{ fontSize: "0.58rem", color: "var(--text-3)", display: "flex", alignItems: "center", gap: 3 }}>
                            <span>Full scorecard</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                          </div>
                        </div>
                      </div>
                      {/* Teams row */}
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                        {teams.length > 0 ? teams.map((ti: any, i: number) => {
                          const teamCol = IPL_COLORS[ti.shortname] || "var(--text)";
                          return (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              {i === 1 && <span style={{ color: "var(--text-3)", fontSize: "0.62rem", letterSpacing: "0.1em", margin: "0 1px" }}>VS</span>}
                              <img src={TEAM_LOGO_CDN[ti.shortname] || ti.img} alt={ti.shortname} style={{ width: 32, height: 32, objectFit: "contain", filter: `drop-shadow(0 1px 6px rgba(0,0,0,0.8)) drop-shadow(0 0 8px ${teamCol}55)` }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                              <span style={{ fontSize: "1.08rem", fontWeight: 500, letterSpacing: "0.04em", color: "var(--text)", textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}>{ti.shortname}</span>
                            </div>
                          );
                        }) : (
                          <div style={{ fontSize: "1rem", fontWeight: 500, color: "var(--text)" }}>{(m.name || "").replace(/,\s*\d+(?:st|nd|rd|th) Match.*/i, "")}</div>
                        )}
                      </div>
                      {/* Toss */}
                      {(sc?.overview?.toss || m.toss) && (
                        <div style={{ fontSize: "0.6rem", color: "var(--text-3)", lineHeight: 1.35, marginTop: 7 }}>{sc?.overview?.toss || m.toss}</div>
                      )}
                      {/* Score rows */}
                      {(m.score || []).map((s: any, i: number) => {
                        const inningTeamCode = (s.inning || "").split(" Inning")[0].split(" Innings")[0].trim();
                        const teamColorForScore = IPL_COLORS[inningTeamCode] || "var(--text-2)";
                        return (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", marginTop: i === 0 ? 10 : 5, borderRadius: 8, borderLeft: `3px solid ${teamColorForScore}55`, background: teamColorForScore + "0d" }}>
                            <span style={{ fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.04em", color: teamColorForScore }}>
                              {inningTeamCode || (s.inning || "").replace(" Innings", "").replace(" Inning", "")}
                            </span>
                            <span style={{ fontSize: "0.95rem", fontWeight: 700, letterSpacing: "0.02em", color: teamColorForScore }}>
                              {s.summary || (s.r != null ? `${s.r}/${s.w} (${s.o}ov)` : "")}
                            </span>
                          </div>
                        );
                      })}
                      {/* Venue */}
                      {m.venue && <div style={{ fontSize: "0.58rem", color: "var(--text-3)", marginTop: 7 }}>🏟 {m.venue}{m.homeTeamCode ? ` · ${m.homeTeamCode}` : ""}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, marginTop: countdown ? 16 : 0 }}>
          <div className="sec-title" style={{ marginBottom: 0 }}>Leaderboard</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={handleLbRefresh}
              disabled={lbRefreshing}
              title="Refresh all data"
              style={{ padding: "6px 10px", display: "flex", alignItems: "center", gap: 5, background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, cursor: lbRefreshing ? "default" : "pointer", color: lbRefreshing ? "var(--text-3)" : "var(--text-2)", fontFamily: "inherit", transition: "opacity 0.2s" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"
                style={{ animation: lbRefreshing ? "spin 0.9s linear infinite" : "none" }}>
                <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              <span style={{ fontSize: "0.68rem" }}>{lbRefreshing ? "Syncing…" : "Refresh"}</span>
            </button>
            <button className="btn-primary" style={{ padding: "6px 10px", display: "flex", alignItems: "center", gap: 5 }} onClick={shareLeaderboard} title="Share leaderboard">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              <span style={{ fontSize: "0.68rem" }}>Share</span>
            </button>
          </div>
        </div>
        {(() => {
          const LB_BG: Record<string, string> = {
            rajveer:  `${import.meta.env.BASE_URL}lb-bg-rajveer.jpeg`,
            mombasa:  `${import.meta.env.BASE_URL}lb-bg-mumbai.jpeg`,
            mumbai:   `${import.meta.env.BASE_URL}lb-bg-mombasa.jpeg`,
            ponygoat: `${import.meta.env.BASE_URL}lb-bg-ponygoat.jpeg`,
          };
          if (teamScores.length === 0) return (
            <div>
              {[0,1,2,3].map(i => (
                <div key={i} className="skel-lb-card">
                  <div className="skel" style={{ width: 30, height: 30, borderRadius: "50%", flexShrink: 0 }} />
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div className="skel" style={{ height: 13, width: "52%" }} />
                    <div className="skel" style={{ height: 9, width: "78%" }} />
                  </div>
                  <div className="skel" style={{ width: 38, height: 22, flexShrink: 0 }} />
                </div>
              ))}
            </div>
          );
          const leaderTotal = teamScores[0]?.total ?? 0;
          return (
            <div>
              {teamScores.map((s, i) => {
                const gap = i > 0 && Object.keys(playerPoints).length > 0 ? leaderTotal - s.total : 0;
                return (
                <div key={s.id} className={`lb-card ${i === 0 ? "rank-first" : ""}`} onClick={() => { setSelectedTeam(s.id); setTab("teams"); }}>
                  {/* Blurred team artwork background */}
                  <div style={{
                    position: "absolute", inset: -6, zIndex: 0,
                    backgroundImage: `url(${LB_BG[s.id]})`,
                    backgroundSize: "cover", backgroundPosition: "center 30%",
                    filter: "blur(32px) brightness(0.72) saturate(1.4)",
                    transform: "translateZ(0)",
                    willChange: "filter",
                  }} />
                  {/* Glass scrim */}
                  <div style={{
                    position: "absolute", inset: 0, zIndex: 1,
                    background: `linear-gradient(135deg, ${s.team.color}18 0%, rgba(9,9,11,0.18) 100%)`,
                  }} />
                  <div className="lb-accent" style={{ background: s.team.color, zIndex: 2, position: "relative" }} />
                  <div className="lb-inner" style={{ position: "relative", zIndex: 2 }}>
                    <div className={`lb-rank ${rankLabel(i)}`} style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>{i + 1}</div>
                    <div className="lb-info">
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div className={`lb-name ${i === 0 ? "first" : ""}`}
                          style={{ textShadow: "0 1px 6px rgba(0,0,0,1), 0 0 20px rgba(0,0,0,0.8)" }}>
                          {s.team.name}
                        </div>
                      </div>
                      <div className="lb-meta">
                        {s.team.owner} · <span style={{ color: "#d4a843" }}>C:</span> {s.team.captain} · <span style={{ color: "rgba(255,255,255,0.45)" }}>VC:</span> {s.team.vc}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div className="lb-pts first opacity-[1] bg-[transparent]"
                        style={{ color: Object.keys(playerPoints).length === 0 ? "var(--text-3)" : s.team.color, textShadow: Object.keys(playerPoints).length === 0 ? "none" : `0 0 12px ${s.team.color}66` }}>
                        {Object.keys(playerPoints).length === 0 ? "—" : s.total}
                      </div>
                      <div className="lb-pts-label" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>pts</div>
                      {i > 0 && Object.keys(playerPoints).length > 0 && (
                        <div style={{ fontSize: "0.58rem", color: gap === 0 ? "var(--text-3)" : "#f87171", textShadow: "0 1px 4px rgba(0,0,0,0.9)", fontWeight: 600, marginTop: 1 }}>
                          {`−${gap}`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          );
        })()}

        {/* ─── Season Race ─── */}
        {matchHistory.length > 0 && matchHistory[0].points.length >= 2 && (() => {
          const allMatchNums = matchHistory[0].points.map((p: any) => p.matchNum);
          const n = allMatchNums.length;

          // Per-match raw scores (cum[i] - cum[i-1])
          const rawScores: Record<string, number[]> = {};
          for (const t of matchHistory) {
            rawScores[t.teamId] = t.points.map((p: any, i: number) => i === 0 ? p.cum : p.cum - t.points[i - 1].cum);
          }
          const lastMatchScores: Record<string, number> = {};
          for (const [tid, scores] of Object.entries(rawScores)) lastMatchScores[tid] = scores[scores.length - 1] ?? 0;
          const hotTeamId = Object.entries(lastMatchScores).sort((a, b) => b[1] - a[1])[0]?.[0];
          const coldTeamId = Object.entries(lastMatchScores).sort((a, b) => a[1] - b[1])[0]?.[0];

          // Best single match
          const bestMatch: Record<string, number> = {};
          for (const [tid, scores] of Object.entries(rawScores)) bestMatch[tid] = Math.max(...scores, 0);
          const clutchTeamId = Object.entries(bestMatch).sort((a, b) => b[1] - a[1])[0]?.[0];

          const leader = teamScores[0];
          const lastPlace = teamScores[teamScores.length - 1];
          const gap = leader.total - lastPlace.total;
          const secondGap = teamScores.length >= 2 ? leader.total - teamScores[1].total : 999;

          // Banter pool
          const pool: string[] = [];
          if (gap > 200) pool.push(`${leader.team.owner}'s on a different planet 🛸 — ${gap} pts clear`);
          else if (gap > 100) pool.push(`${lastPlace.team.owner}'s ${gap} pts behind. Respectfully, it's not looking good 😬`);
          else if (gap < 40) pool.push(`Only ${gap} pts separate 1st and last. Title race is ALIVE 👀`);
          if (secondGap < 20 && teamScores.length >= 2) pool.push(`${leader.team.owner} and ${teamScores[1].team.owner} are separated by just ${secondGap} pts. 🏏`);
          if (hotTeamId && coldTeamId && hotTeamId !== coldTeamId) {
            const hot = FANTASY_TEAMS[hotTeamId]; const cold = FANTASY_TEAMS[coldTeamId];
            pool.push(`${hot?.owner} lit up last match (+${lastMatchScores[hotTeamId]}) 🔥 while ${cold?.owner} barely showed (+${lastMatchScores[coldTeamId]}) ❄️`);
          }
          if (clutchTeamId) {
            const ct = FANTASY_TEAMS[clutchTeamId];
            pool.push(`${ct?.owner} dropped a ${bestMatch[clutchTeamId]}-pt bomb in a single match — still elite 💥`);
          }
          const banter = pool.length > 0 ? pool[Math.floor(Date.now() / 60000) % pool.length] : "";

          // Chart dimensions
          const W = 320, H = 148, PL = 14, PR = 54, PT = 14, PB = 20;
          const CW = W - PL - PR, CH = H - PT - PB;
          const maxCum = Math.max(...matchHistory.flatMap(t => t.points.map((p: any) => p.cum)), 1);
          const xOf = (i: number) => PL + (n <= 1 ? CW / 2 : (i / (n - 1)) * CW);
          const yOf = (v: number) => PT + CH - (v / maxCum) * CH;
          const bottom = PT + CH;

          // Smooth catmull-rom cubic bezier path
          const smoothPath = (pts: {x: number; y: number}[]) => {
            if (pts.length < 2) return `M ${pts[0]?.x ?? 0} ${pts[0]?.y ?? 0}`;
            let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
            for (let i = 0; i < pts.length - 1; i++) {
              const p0 = pts[Math.max(0, i - 1)];
              const p1 = pts[i];
              const p2 = pts[i + 1];
              const p3 = pts[Math.min(pts.length - 1, i + 2)];
              const cp1x = p1.x + (p2.x - p0.x) / 6;
              const cp1y = p1.y + (p2.y - p0.y) / 6;
              const cp2x = p2.x - (p3.x - p1.x) / 6;
              const cp2y = p2.y - (p3.y - p1.y) / 6;
              d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
            }
            return d;
          };

          const chartMatchHistory = chartXiFilter === "xi"
            ? matchHistory.map(t => {
                const top11Set = getTeamData(t.teamId, playerPoints).top11;
                const team = FANTASY_TEAMS[t.teamId];
                let cum = 0;
                const points = matchHistory[0].points.map(({ matchNum }: any) => {
                  let pts = 0;
                  for (const player of team.players) {
                    if (!top11Set.has(player.name)) continue;
                    const entry = (playerMatchPoints[player.name] || []).find((e: any) => e.matchNum === matchNum);
                    if (entry) pts += applyMultiplier(entry.pts, player.name === team.captain, player.name === team.vc);
                  }
                  cum += pts;
                  return { matchNum, label: `M${matchNum}`, cum };
                });
                return { ...t, points };
              })
            : matchHistory;

          const sortedByFinal = [...chartMatchHistory].sort((a, b) =>
            (b.points[b.points.length - 1]?.cum ?? 0) - (a.points[a.points.length - 1]?.cum ?? 0)
          );

          // ─ Per-team aggregated batting/bowling/fielding stats ─
          type TeamAggEntry = { runs: number; balls: number; sixes: number; fours: number; wickets: number; catches: number; ducks: number; dots: number; price: number; captainPts: number; vcPts: number };
          const buildTeamAgg = (xiOnly: boolean): Record<string, TeamAggEntry> => {
            const agg: Record<string, TeamAggEntry> = {};
            for (const [tid, ft] of Object.entries(FANTASY_TEAMS)) {
              const top11Set = xiOnly ? getTeamData(tid, playerPoints).top11 : null;
              let runs = 0, balls = 0, sixes = 0, fours = 0, wickets = 0, catches = 0, ducks = 0, dots = 0, price = 0, captainPts = 0, vcPts = 0;
              for (const player of ft.players) {
                if (top11Set && !top11Set.has(player.name)) continue;
                price += player.price ?? 0;
                const entries = playerMatchPoints[player.name] || [];
                const playerTotalPts = entries.reduce((s: number, e: any) => s + e.pts, 0);
                if (player.name === ft.captain) captainPts = playerTotalPts;
                if (player.name === ft.vc) vcPts = playerTotalPts;
                for (const e of entries) {
                  if (!e.stats) continue;
                  runs += e.stats.runs ?? 0;
                  balls += e.stats.balls ?? 0;
                  sixes += e.stats.sixes ?? 0;
                  fours += e.stats.fours ?? 0;
                  wickets += e.stats.wickets ?? 0;
                  catches += (e.stats.catches ?? 0) + (e.stats.runOuts ?? 0) + (e.stats.stumpings ?? 0);
                  dots += e.stats.dots ?? 0;
                  if (e.stats.duck) ducks++;
                }
              }
              agg[tid] = { runs, balls, sixes, fours, wickets, catches, ducks, dots, price, captainPts, vcPts };
            }
            return agg;
          };
          const teamAgg = buildTeamAgg(false);
          const activeAgg = awardXiFilter === "xi" ? buildTeamAgg(true) : teamAgg;
          const topBy = (key: keyof (typeof teamAgg)[string], hi = true) =>
            Object.entries(teamAgg).sort((a, b) => hi ? (b[1][key] as number) - (a[1][key] as number) : (a[1][key] as number) - (b[1][key] as number))[0]?.[0];
          const sixesTeamId    = topBy("sixes");
          const runsTeamId     = topBy("runs");
          const wicketsTeamId  = topBy("wickets");
          const catchesTeamId  = topBy("catches");
          const ducksTeamId    = topBy("ducks");
          const capTeamId      = topBy("captainPts");
          const vcTeamId       = topBy("vcPts");
          const valueTeamId    = Object.entries(teamAgg).sort((a, b) => {
            const aV = a[1].price > 0 ? (teamScores.find(t => t.id === a[0])?.total ?? 0) / a[1].price : 0;
            const bV = b[1].price > 0 ? (teamScores.find(t => t.id === b[0])?.total ?? 0) / b[1].price : 0;
            return bV - aV;
          })[0]?.[0];
          const srTeamId       = Object.entries(teamAgg).sort((a, b) => {
            const aSR = a[1].balls > 0 ? a[1].runs / a[1].balls : 0;
            const bSR = b[1].balls > 0 ? b[1].runs / b[1].balls : 0;
            return bSR - aSR;
          })[0]?.[0];
          const stdDev = (arr: number[]) => { if (arr.length < 2) return 999; const m = arr.reduce((s, v) => s + v, 0) / arr.length; return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length); };
          const consistentTeamId = Object.entries(rawScores).sort((a, b) => stdDev(a[1]) - stdDev(b[1]))[0]?.[0];

          const tids = Object.keys(FANTASY_TEAMS);
          const awardsV2: Array<{ emoji: string; label: string; rows: Array<{ teamId: string; value: number; display: string }> }> = [
            {
              emoji: "💥", label: "Best Single Match",
              rows: tids.map(tid => ({ teamId: tid, value: bestMatch[tid] ?? 0, display: `${bestMatch[tid] ?? 0} pts` })).sort((a, b) => b.value - a.value),
            },
            {
              emoji: "🏏", label: "Run Machine",
              rows: tids.map(tid => ({ teamId: tid, value: activeAgg[tid].runs, display: `${activeAgg[tid].runs} runs` })).sort((a, b) => b.value - a.value),
            },
            {
              emoji: "🎳", label: "Wicket Machine",
              rows: tids.map(tid => ({ teamId: tid, value: activeAgg[tid].wickets, display: `${activeAgg[tid].wickets} wkts` })).sort((a, b) => b.value - a.value),
            },
            {
              emoji: "💣", label: "Six Appeal",
              rows: tids.map(tid => ({ teamId: tid, value: activeAgg[tid].sixes, display: `${activeAgg[tid].sixes} sixes` })).sort((a, b) => b.value - a.value),
            },
            {
              emoji: "🔵", label: "Four Machine",
              rows: tids.map(tid => ({ teamId: tid, value: activeAgg[tid].fours, display: `${activeAgg[tid].fours} fours` })).sort((a, b) => b.value - a.value),
            },
            {
              emoji: "🤲", label: "Safe Hands",
              rows: tids.map(tid => ({ teamId: tid, value: activeAgg[tid].catches, display: `${activeAgg[tid].catches} catches` })).sort((a, b) => b.value - a.value),
            },
            {
              emoji: "👔", label: "Captain Clutch",
              rows: tids.map(tid => ({ teamId: tid, value: activeAgg[tid].captainPts, display: `${FANTASY_TEAMS[tid]?.captain.split(" ").slice(-1)[0]} · ${activeAgg[tid].captainPts} pts` })).sort((a, b) => b.value - a.value),
            },
            {
              emoji: "🥈", label: "VC Value",
              rows: tids.map(tid => ({ teamId: tid, value: activeAgg[tid].vcPts, display: `${FANTASY_TEAMS[tid]?.vc.split(" ").slice(-1)[0]} · ${activeAgg[tid].vcPts} pts` })).sort((a, b) => b.value - a.value),
            },
            {
              emoji: "🦆", label: "Duck Brigade",
              rows: tids.map(tid => ({ teamId: tid, value: activeAgg[tid].ducks, display: `${activeAgg[tid].ducks} ducks` })).sort((a, b) => b.value - a.value),
            },
            {
              emoji: "💎", label: "Best Value",
              rows: tids.map(tid => { const tot = teamScores.find(s => s.id === tid)?.total ?? 0; const v = activeAgg[tid].price > 0 ? tot / activeAgg[tid].price : 0; return { teamId: tid, value: v, display: `${v.toFixed(1)} pts/cr` }; }).sort((a, b) => b.value - a.value),
            },
            {
              emoji: "🟣", label: "Dot Ball Kings",
              rows: tids.map(tid => ({ teamId: tid, value: activeAgg[tid].dots, display: `${activeAgg[tid].dots} dots` })).sort((a, b) => b.value - a.value),
            },
            {
              emoji: "📊", label: "Most Consistent",
              rows: tids.map(tid => { const sd = stdDev(rawScores[tid] || []); return { teamId: tid, value: sd, display: `σ ${sd.toFixed(0)}` }; }).sort((a, b) => a.value - b.value),
            },
          ];

          return (
            <div style={{ marginTop: 22 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div className="sec-title" style={{ marginBottom: 0 }}>Season Race</div>
                <div style={{ display: "flex", background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, overflow: "hidden" }}>
                  {(["all", "xi"] as const).map(f => (
                    <button key={f} onClick={() => setChartXiFilter(f)}
                      style={{
                        padding: "4px 9px", fontSize: "0.6rem", fontWeight: 700, border: "none", cursor: "pointer",
                        fontFamily: "inherit",
                        background: chartXiFilter === f ? "rgba(255,255,255,0.12)" : "transparent",
                        color: chartXiFilter === f ? "var(--text)" : "var(--text-3)",
                        letterSpacing: "0.04em",
                      }}>
                      {f === "all" ? "All" : "Top XI"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Line chart */}
              <div style={{ background: "var(--surface)", borderRadius: 14, padding: "14px 10px 8px", border: "1px solid rgba(255,255,255,0.07)" }}>
                {(() => {
                  // Anti-collision for end labels
                  const rawLabels = sortedByFinal.map(team => {
                    const lastPt = team.points[team.points.length - 1];
                    return { team, rawY: lastPt ? yOf(lastPt.cum) : 0, cum: lastPt?.cum ?? 0 };
                  }).sort((a, b) => a.rawY - b.rawY);
                  const MIN_GAP = 17;
                  const adjY = rawLabels.map(l => l.rawY);
                  for (let i = 1; i < adjY.length; i++) {
                    if (adjY[i] - adjY[i - 1] < MIN_GAP) adjY[i] = adjY[i - 1] + MIN_GAP;
                  }
                  const labelMap: Record<string, number> = {};
                  rawLabels.forEach((l, i) => { labelMap[l.team.teamId] = adjY[i]; });

                  const getMatchPts = (team: typeof sortedByFinal[0], idx: number) => {
                    const pts = team.points;
                    if (!pts[idx]) return 0;
                    return idx === 0 ? pts[0].cum : pts[idx].cum - pts[idx - 1].cum;
                  };

                  const handleSvgInteract = (e: React.TouchEvent<SVGSVGElement> | React.MouseEvent<SVGSVGElement>) => {
                    const svgEl = e.currentTarget;
                    const rect = svgEl.getBoundingClientRect();
                    const clientX = 'touches' in e
                      ? (e as React.TouchEvent<SVGSVGElement>).touches[0]?.clientX ?? 0
                      : (e as React.MouseEvent<SVGSVGElement>).clientX;
                    const relX = ((clientX - rect.left) / rect.width) * W;
                    const rawIdx = Math.round(((relX - PL) / CW) * (n - 1));
                    setChartHover(Math.max(0, Math.min(n - 1, rawIdx)));
                  };

                  const hovMatchNum = chartHover !== null ? allMatchNums[chartHover] : null;
                  const hoverData = chartHover !== null && hovMatchNum !== null
                    ? sortedByFinal.map(team => ({
                        team,
                        matchPts: getMatchPts(team, chartHover),
                        cum: team.points[chartHover]?.cum ?? 0,
                      })).sort((a, b) => b.matchPts - a.matchPts)
                    : null;

                  const AVT_R = 8;

                  return (
                    <div style={{ position: "relative" }}>
                      {/* Tooltip overlay */}
                      {hoverData && hovMatchNum !== null && (
                        <div style={{
                          position: "absolute", top: 4, left: "50%", transform: "translateX(-50%)",
                          background: "rgba(12,12,16,0.97)", border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 12, padding: "8px 12px", zIndex: 10,
                          display: "flex", alignItems: "center", gap: 10,
                          backdropFilter: "blur(10px)", pointerEvents: "none",
                          boxShadow: "0 6px 24px rgba(0,0,0,0.6)",
                        }}>
                          <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.05em" }}>M{hovMatchNum}</span>
                          <div style={{ display: "flex", gap: 9 }}>
                            {hoverData.map(({ team, matchPts, cum }) => {
                              const ft = FANTASY_TEAMS[team.teamId];
                              return (
                                <div key={team.teamId} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                                  <div style={{ width: 24, height: 24, borderRadius: "50%", overflow: "hidden", border: `2px solid ${team.color}`, flexShrink: 0 }}>
                                    <img src={`${import.meta.env.BASE_URL}avatars/${ft.avatar}`} alt={ft.owner}
                                      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: ft.avatarPosition || "center center" }} />
                                  </div>
                                  <span style={{ fontSize: "0.68rem", fontWeight: 700, color: team.color, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>+{matchPts}</span>
                                  <span style={{ fontSize: "0.5rem", color: "var(--text-3)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{cum}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible", touchAction: "none", display: "block" }}
                        onTouchStart={handleSvgInteract}
                        onTouchMove={handleSvgInteract}
                        onTouchEnd={() => setChartHover(null)}
                        onMouseMove={handleSvgInteract}
                        onMouseLeave={() => setChartHover(null)}
                      >
                        <defs>
                          {sortedByFinal.map(team => (
                            <linearGradient key={team.teamId + "-grad"} id={`area-${team.teamId}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={team.color} stopOpacity="0.18" />
                              <stop offset="100%" stopColor={team.color} stopOpacity="0" />
                            </linearGradient>
                          ))}
                          {sortedByFinal.map(team => {
                            const lastI = team.points.length - 1;
                            const cx = xOf(lastI) + 6 + AVT_R;
                            const cy = labelMap[team.teamId] ?? yOf(team.points[lastI]?.cum ?? 0);
                            return (
                              <clipPath key={`clip-${team.teamId}`} id={`clip-avatar-${team.teamId}`} clipPathUnits="userSpaceOnUse">
                                <circle cx={cx} cy={cy} r={AVT_R} />
                              </clipPath>
                            );
                          })}
                          <filter id="leader-glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                          </filter>
                        </defs>

                        {/* Baseline */}
                        <line x1={PL} y1={bottom} x2={W - PR} y2={bottom}
                          stroke="rgba(255,255,255,0.08)" strokeWidth={0.8} />

                        {/* Grid lines + Y labels */}
                        {[0.25, 0.5, 0.75, 1].map(v => {
                          const yv = yOf(maxCum * v);
                          const val = Math.round(maxCum * v);
                          return (
                            <g key={v}>
                              <line x1={PL} y1={yv} x2={W - PR} y2={yv}
                                stroke="rgba(255,255,255,0.04)" strokeWidth={0.7} strokeDasharray="3,5" />
                              <text x={PL - 3} y={yv + 2.5} textAnchor="end"
                                fontSize={5.5} fill="rgba(255,255,255,0.18)" style={{ fontFamily: "Inter, sans-serif" }}>{val}</text>
                            </g>
                          );
                        })}

                        {/* Area fills */}
                        {[...sortedByFinal].reverse().map(team => {
                          const pts = team.points.map((p: any, i: number) => ({ x: xOf(i), y: yOf(p.cum) }));
                          if (pts.length < 2) return null;
                          const linePath = smoothPath(pts);
                          const lastPt = pts[pts.length - 1];
                          const firstPt = pts[0];
                          const areaPath = `${linePath} L ${lastPt.x.toFixed(1)},${bottom.toFixed(1)} L ${firstPt.x.toFixed(1)},${bottom.toFixed(1)} Z`;
                          return <path key={team.teamId + "-area"} d={areaPath} fill={`url(#area-${team.teamId})`} />;
                        })}

                        {/* Team lines */}
                        {sortedByFinal.map(team => {
                          const pts = team.points.map((p: any, i: number) => ({ x: xOf(i), y: yOf(p.cum) }));
                          if (pts.length < 2) return null;
                          const isLeader = team.teamId === leader.id;
                          const linePath = smoothPath(pts);
                          const lastPt = pts[pts.length - 1];
                          return (
                            <g key={team.teamId} filter={isLeader ? "url(#leader-glow)" : undefined}>
                              <path d={linePath} fill="none" stroke={team.color}
                                strokeWidth={isLeader ? 2.4 : 1.7}
                                strokeLinecap="round" strokeLinejoin="round"
                                opacity={chartHover !== null ? 0.45 : (isLeader ? 1 : 0.85)} />
                              <circle cx={lastPt.x} cy={lastPt.y} r={isLeader ? 3.5 : 2.5}
                                fill="var(--surface)" stroke={team.color} strokeWidth={isLeader ? 2 : 1.5}
                                opacity={chartHover !== null ? 0.3 : 1} />
                            </g>
                          );
                        })}

                        {/* Interactive hairline + hover dots */}
                        {chartHover !== null && (() => {
                          const hx = xOf(chartHover);
                          return (
                            <g>
                              <line x1={hx} y1={PT} x2={hx} y2={bottom}
                                stroke="rgba(255,255,255,0.3)" strokeWidth={1} strokeDasharray="2,3" />
                              {sortedByFinal.map(team => {
                                const pt = team.points[chartHover];
                                if (!pt) return null;
                                const isLeader = team.teamId === leader.id;
                                return (
                                  <g key={team.teamId + "-hdot"}>
                                    <circle cx={hx} cy={yOf(pt.cum)} r={isLeader ? 5.5 : 4.5}
                                      fill={team.color} stroke="var(--surface)" strokeWidth={1.5} />
                                  </g>
                                );
                              })}
                            </g>
                          );
                        })()}

                        {/* End labels — avatar circles */}
                        {sortedByFinal.map(team => {
                          const lastPt = team.points[team.points.length - 1];
                          if (!lastPt) return null;
                          const lastI = team.points.length - 1;
                          const lx = xOf(lastI) + 6;
                          const ly = labelMap[team.teamId] ?? yOf(lastPt.cum);
                          const ft = FANTASY_TEAMS[team.teamId];
                          const isLeader = team.teamId === leader.id;
                          return (
                            <g key={team.teamId + "-lbl"} opacity={chartHover !== null ? 0.25 : 1}>
                              <circle cx={lx + AVT_R} cy={ly} r={AVT_R + 2} fill={team.color} opacity={0.22} />
                              <image href={`${import.meta.env.BASE_URL}avatars/${ft.avatar}`}
                                x={lx} y={ly - AVT_R} width={AVT_R * 2} height={AVT_R * 2}
                                clipPath={`url(#clip-avatar-${team.teamId})`}
                                preserveAspectRatio="xMidYMid slice" />
                              <circle cx={lx + AVT_R} cy={ly} r={AVT_R} fill="none" stroke={team.color}
                                strokeWidth={isLeader ? 2 : 1.5} />
                              <text x={lx + AVT_R * 2 + 3} y={ly + 2.5} fontSize={6} fill={team.color}
                                fontWeight="600" style={{ fontFamily: "Inter, sans-serif" }}>{lastPt.cum}</text>
                            </g>
                          );
                        })}

                        {/* X labels */}
                        {allMatchNums.filter((_: any, i: number) =>
                          i === 0 || i === n - 1 || (n > 4 && i % Math.ceil(n / 5) === 0)
                        ).map((mn: any) => {
                          const i = allMatchNums.indexOf(mn);
                          return (
                            <text key={mn} x={xOf(i)} y={H - 4} textAnchor="middle"
                              fontSize={6} fill={chartHover !== null && allMatchNums[chartHover] === mn ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.2)"}
                              fontWeight={chartHover !== null && allMatchNums[chartHover] === mn ? "700" : "400"}
                              style={{ fontFamily: "Inter, sans-serif" }}>M{mn}</text>
                          );
                        })}

                        {/* Full transparent hit area */}
                        <rect x={PL} y={PT} width={CW} height={CH} fill="transparent" />
                      </svg>
                    </div>
                  );
                })()}
              </div>

              {/* Award stepper */}
              {(() => {
                const safeIdx = Math.min(selectedAwardIdx, awardsV2.length - 1);
                const award = awardsV2[safeIdx];
                const winner = award?.rows[0];
                const winnerFt = FANTASY_TEAMS[winner?.teamId];
                const maxVal = Math.max(...(award?.rows.map(r => r.value) ?? [1]), 1);
                return (
                  <div style={{ marginTop: 22 }}>
                    {/* Section title + controls */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div className="sec-title" style={{ marginBottom: 0 }}>Awards</div>
                      {/* All / Top XI toggle */}
                      <div style={{ display: "flex", background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, overflow: "hidden" }}>
                        {(["all", "xi"] as const).map(f => (
                          <button key={f} onClick={() => setAwardXiFilter(f)}
                            style={{
                              padding: "4px 9px", fontSize: "0.6rem", fontWeight: 700, border: "none", cursor: "pointer",
                              background: awardXiFilter === f ? "rgba(255,255,255,0.12)" : "transparent",
                              color: awardXiFilter === f ? "var(--text)" : "var(--text-3)",
                              letterSpacing: "0.04em",
                            }}>
                            {f === "all" ? "All" : "Top XI"}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Award picker — horizontal scroll pill bar */}
                    <div style={{
                      display: "flex", gap: 6, overflowX: "auto", WebkitOverflowScrolling: "touch" as any,
                      scrollbarWidth: "none" as any, flexWrap: "nowrap",
                      marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16,
                      paddingBottom: 2, marginBottom: 10,
                    }}>
                      {awardsV2.map((a, i) => {
                        const active = i === safeIdx;
                        return (
                          <button key={a.label} onClick={() => setSelectedAwardIdx(i)}
                            style={{
                              flexShrink: 0, padding: "6px 13px", borderRadius: 20,
                              border: `1px solid ${active ? "rgba(232,184,75,0.35)" : "var(--border)"}`,
                              background: active ? "var(--gold-deep)" : "var(--surface-2)",
                              color: active ? "var(--gold)" : "var(--text-3)",
                              fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
                              fontFamily: "inherit", whiteSpace: "nowrap" as const,
                              transform: active ? "scale(1.02)" : "scale(1)",
                              transition: "all 0.15s",
                              WebkitTapHighlightColor: "transparent",
                            }}>{a.label}</button>
                        );
                      })}
                    </div>

                    {/* Single award card */}
                    {award && winnerFt && (
                      <div style={{ background: "var(--surface)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" }}>
                        <div style={{ padding: "9px 12px 8px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "0.58rem", fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.07em", textTransform: "uppercase" as const }}>{award.label}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <div style={{ width: 16, height: 16, borderRadius: "50%", overflow: "hidden", border: `1.5px solid ${winnerFt.color}`, flexShrink: 0 }}>
                              <img src={`${import.meta.env.BASE_URL}avatars/${winnerFt.avatar}`} alt={winnerFt.owner}
                                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: winnerFt.avatarPosition || "center" }} />
                            </div>
                            <span style={{ fontSize: "0.63rem", fontWeight: 700, color: winnerFt.color }}>{winnerFt.owner}</span>
                          </div>
                        </div>
                        <div style={{ padding: "7px 12px 9px", display: "flex", flexDirection: "column", gap: 6 }}>
                          {award.rows.map((row, ri) => {
                            const ft = FANTASY_TEAMS[row.teamId];
                            if (!ft) return null;
                            const isWinner = ri === 0;
                            const pct = maxVal > 0 ? (row.value / maxVal) * 100 : 0;
                            return (
                              <div key={row.teamId} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: "0.52rem", fontWeight: 700, color: isWinner ? "var(--gold)" : "var(--text-3)", width: 10, textAlign: "center" as const, flexShrink: 0 }}>{ri + 1}</span>
                                <div style={{ width: 20, height: 20, borderRadius: "50%", overflow: "hidden", border: `1.5px solid ${ft.color}${isWinner ? "" : "66"}`, flexShrink: 0 }}>
                                  <img src={`${import.meta.env.BASE_URL}avatars/${ft.avatar}`} alt={ft.owner}
                                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: ft.avatarPosition || "center" }} />
                                </div>
                                <span style={{ fontSize: "0.68rem", fontWeight: isWinner ? 700 : 400, color: isWinner ? ft.color : "var(--text-2)", width: 42, flexShrink: 0 }}>{ft.owner}</span>
                                <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
                                  <div style={{ width: `${pct}%`, height: "100%", background: ft.color, borderRadius: 2, opacity: isWinner ? 1 : 0.4 }} />
                                </div>
                                <span style={{ fontSize: "0.63rem", fontWeight: isWinner ? 700 : 400, color: isWinner ? ft.color : "var(--text-3)", minWidth: 58, textAlign: "right" as const, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
                                  {row.display}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })()}

      </div>
    );
}
