import React from "react";
import TeamBadge from "../components/TeamBadge";
import { IPL_HISTORY, IPL_TEAM_BADGE } from "../constants";

interface Props {
  historyYear: number | null;
  setHistoryYear: (y: number | null) => void;
  histTop10Tab: "bat" | "bwl";
  setHistTop10Tab: (t: "bat" | "bwl") => void;
}

export default function HistoryPage({ historyYear, setHistoryYear, histTop10Tab, setHistTop10Tab }: Props) {
  const s = historyYear ? IPL_HISTORY.find(h => h.year === historyYear) : null;

  // Trophy cabinet — titles per team, sorted desc
  const titleMap: Record<string, number> = {};
  IPL_HISTORY.forEach(h => { titleMap[h.champion] = (titleMap[h.champion] || 0) + 1; });
  const titleBoard = Object.entries(titleMap).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <div className="sec-title">IPL History</div>

      {/* TROPHY CABINET — always visible above filters */}
      {!s && (
        <div className="hist-cabinet">
          <div className="hist-cabinet-title">🏆 Trophy Cabinet</div>
          <div className="hist-cabinet-rows">
            {titleBoard.map(([team, count]) => {
              const b = IPL_TEAM_BADGE[team] || { abbr: "?", bg: "#444", fg: "#fff" };
              const barW = Math.round((count / titleBoard[0][1]) * 100);
              const teamColor = b.bg === "#F5C518" ? "#a37e00" : b.bg;
              return (
                <div key={team} className="hist-cabinet-row">
                  <TeamBadge name={team} size={40} />
                  <div className="hist-cabinet-info">
                    <div className="hist-cabinet-name">{team}</div>
                    <div className="hist-cabinet-bar-wrap">
                      <div className="hist-cabinet-bar" style={{ width: `${barW}%`, background: teamColor, boxShadow: `0 0 6px ${teamColor}55` }} />
                    </div>
                  </div>
                  <div className="hist-cabinet-count" style={{ color: teamColor, textShadow: `0 0 10px ${teamColor}44` }}>
                    {count}x
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Year filter grid */}
      {!s && (
        <div className="hist-yr-grid" data-no-swipe="true">
          <button
            className={`hist-yr-btn all-btn${historyYear === null ? " active" : ""}`}
            onClick={() => setHistoryYear(null)}
          >All Seasons</button>
          {IPL_HISTORY.map(h => (
            <button
              key={h.year}
              className={`hist-yr-btn${historyYear === h.year ? " active" : ""}`}
              style={historyYear === h.year ? { background: h.color + "22", borderColor: h.color, color: h.color } : {}}
              onClick={() => setHistoryYear(h.year)}
            >{h.year}</button>
          ))}
        </div>
      )}

      {/* DETAIL VIEW – single season */}
      {s && (
        <div>
          {/* Back nav */}
          <button className="hist-back-btn" onClick={() => setHistoryYear(null)}>
            ← All Seasons
          </button>
          {/* Season hero — split champion/runner-up + awards grid */}
          <div className="hist-hero" style={{ borderColor: s.color }}>
            <div className="hist-hero-year" style={{ color: s.color }}>Season {s.season} · IPL {s.year}</div>
            <div className="hist-hero-row">
              <div className="hist-hero-card champion">
                <div className="hist-hero-card-label">🏆 Champions</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <TeamBadge name={s.champion} size={36} />
                  <div className="hist-hero-card-val" style={{ color: s.color }}>{s.champion}</div>
                </div>
              </div>
              <div className="hist-hero-card">
                <div className="hist-hero-card-label">🥈 Runner-up</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <TeamBadge name={s.runnerUp} size={36} />
                  <div className="hist-hero-card-val">{s.runnerUp}</div>
                </div>
              </div>
            </div>
            <div className="hist-awards-grid">
              <div className="hist-award-cell">
                <div className="hist-award-icon" style={{ filter: "hue-rotate(175deg) saturate(3) brightness(1.1)" }}>🧢</div>
                <div className="hist-award-lbl" style={{ color: "#f97316" }}>Orange Cap</div>
                <div className="hist-award-name">{s.orangeCap}</div>
                <div style={{ fontSize: "0.62rem", color: "#f97316", marginTop: 2, fontWeight: 700 }}>{s.orangeRuns} runs</div>
              </div>
              <div className="hist-award-cell">
                <div className="hist-award-icon" style={{ filter: "hue-rotate(25deg) saturate(4) brightness(0.5)" }}>🧢</div>
                <div className="hist-award-lbl" style={{ color: "#7c3aed" }}>Purple Cap</div>
                <div className="hist-award-name">{s.purpleCap}</div>
                <div style={{ fontSize: "0.62rem", color: "#7c3aed", marginTop: 2, fontWeight: 700 }}>{s.purpleWkts} wkts</div>
              </div>
              <div className="hist-award-cell">
                <div className="hist-award-icon">⭐</div>
                <div className="hist-award-lbl" style={{ color: "#d4a843" }}>MVP</div>
                <div className="hist-award-name">{s.mvp}</div>
                <div style={{ fontSize: "0.62rem", color: "#d4a843", marginTop: 2, fontWeight: 700 }}>Tournament</div>
              </div>
            </div>
          </div>
          {/* Top 10 — segmented toggle */}
          <div style={{ marginTop: 16 }}>
            {/* Segmented pill */}
            <div style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 22, padding: 3, marginBottom: 12, gap: 2 }}>
              {([["bat", "Orange Cap", "hue-rotate(175deg) saturate(3) brightness(1.1)", "#f97316"] as const, ["bwl", "Purple Cap", "hue-rotate(25deg) saturate(4) brightness(0.5)", "#7c3aed"] as const]).map(([id, label, capFilter, activeColor]) => (
                <button key={id} onClick={() => setHistTop10Tab(id)}
                  style={{
                    flex: 1, padding: "7px 0", borderRadius: 18, border: "none", cursor: "pointer",
                    fontFamily: "inherit", fontSize: "0.72rem", fontWeight: 600, transition: "all 0.18s ease",
                    background: histTop10Tab === id ? "var(--surface-3)" : "transparent",
                    color: histTop10Tab === id ? activeColor : "var(--text-3)",
                    boxShadow: histTop10Tab === id ? "0 1px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)" : "none",
                  }}>
                  <span style={{ filter: histTop10Tab === id ? capFilter : "grayscale(1) opacity(0.4)" }}>🧢</span> {label}
                </button>
              ))}
            </div>
            {/* Full-width list */}
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", overflow: "hidden" }}>
              {(histTop10Tab === "bat" ? s.topBat : s.topBwl).map((p, i) => {
                const accentColors = ["#d4a843", "#94a3b8", "#71717a"];
                const accentColor = i < 3 ? accentColors[i] : "var(--border)";
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: i < (histTop10Tab === "bat" ? s.topBat : s.topBwl).length - 1 ? "1px solid var(--border)" : "none", borderLeft: `4px solid ${accentColor}` }}>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.9rem", fontWeight: 700, color: i < 3 ? accentColors[i] : "var(--text-3)", width: 18, textAlign: "center" as const, flexShrink: 0 }}>{i + 1}</span>
                    <TeamBadge name={p.team} size={22} />
                    <span style={{ flex: 1, fontSize: "0.82rem", fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{p.name}</span>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "1.05rem", fontWeight: 700, color: histTop10Tab === "bat" ? "#f97316" : "#7c3aed", flexShrink: 0 }}>{p.val}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ALL SEASONS compact list */}
      {!s && IPL_HISTORY.map(h => {
        const champAbbr = IPL_TEAM_BADGE[h.champion]?.abbr || h.champion;
        const ruAbbr    = IPL_TEAM_BADGE[h.runnerUp]?.abbr  || h.runnerUp;
        return (
          <div key={h.year} className="hist-card" onClick={() => setHistoryYear(h.year)}
            style={{ borderLeftColor: h.color }}>
            {/* Year column */}
            <div className="hist-card-left">
              <div className="hist-card-year" style={{ color: h.color }}>{h.year}</div>
              <div className="hist-card-sn">S{h.season}</div>
            </div>
            {/* Main content */}
            <div className="hist-card-main">
              {/* Champion row */}
              <div className="hist-card-row">
                <TeamBadge name={h.champion} size={24} />
                <span className="hist-card-champ" style={{ color: h.color }}>{champAbbr}</span>
                <span className="hist-card-tag-winner">Champions</span>
              </div>
              {/* Runner-up row */}
              <div className="hist-card-row" style={{ marginTop: 5 }}>
                <TeamBadge name={h.runnerUp} size={24} />
                <span className="hist-card-ru">{ruAbbr}</span>
                <span className="hist-card-tag-ru">Runner-up</span>
              </div>
              {/* Cap line */}
              <div className="hist-card-caps">
                <span className="hist-cap-orange"><span style={{ filter: "hue-rotate(175deg) saturate(3) brightness(1.1)" }}>🧢</span> {h.orangeCap.split(" ").slice(-1)[0]} {h.orangeRuns} runs</span>
                <span className="hist-cap-purple"><span style={{ filter: "hue-rotate(25deg) saturate(4) brightness(0.5)" }}>🧢</span> {h.purpleCap.split(" ").slice(-1)[0]} {h.purpleWkts} wks</span>
              </div>
            </div>
            <div className="hist-card-arrow">›</div>
          </div>
        );
      })}
    </div>
  );
}
