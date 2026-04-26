import React, { useState } from "react";
import TeamBadge from "../components/TeamBadge";
import { IPL_HISTORY, IPL_TEAM_BADGE } from "../constants";

export default function HistoryPage() {
  const [historyYear, setHistoryYear] = useState<number | null>(null);
  const [histTop10Tab, setHistTop10Tab] = useState<"bat" | "bwl">("bat");
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

      {/* Year filter */}
      {!s && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Season</span>
          <select
            value={historyYear ?? ""}
            onChange={e => setHistoryYear(e.target.value ? Number(e.target.value) : null)}
            style={{
              background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 8, color: "var(--text-2)", fontSize: "0.72rem", fontWeight: 600,
              padding: "6px 10px", cursor: "pointer", outline: "none",
            }}
          >
            <option value="">All Seasons</option>
            {IPL_HISTORY.map(h => (
              <option key={h.year} value={h.year}>{h.year}</option>
            ))}
          </select>
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
                <div className="hist-hero-card-team">
                  <TeamBadge name={s.champion} size={36} />
                  <div className="hist-hero-card-val" style={{ color: s.color }}>{s.champion}</div>
                </div>
              </div>
              <div className="hist-hero-card">
                <div className="hist-hero-card-label">🥈 Runner-up</div>
                <div className="hist-hero-card-team">
                  <TeamBadge name={s.runnerUp} size={36} />
                  <div className="hist-hero-card-val">{s.runnerUp}</div>
                </div>
              </div>
            </div>
            <div className="hist-awards-grid">
              <div className="hist-award-cell">
                <div className="hist-award-icon cap-orange-emoji">🧢</div>
                <div className="hist-award-lbl" style={{ color: "#f97316" }}>Orange Cap</div>
                <div className="hist-award-name">{s.orangeCap}</div>
                <div className="hist-award-detail" style={{ color: "#f97316" }}>{s.orangeRuns} runs</div>
              </div>
              <div className="hist-award-cell">
                <div className="hist-award-icon cap-purple-emoji">🧢</div>
                <div className="hist-award-lbl" style={{ color: "#7c3aed" }}>Purple Cap</div>
                <div className="hist-award-name">{s.purpleCap}</div>
                <div className="hist-award-detail" style={{ color: "#7c3aed" }}>{s.purpleWkts} wkts</div>
              </div>
              <div className="hist-award-cell">
                <div className="hist-award-icon">⭐</div>
                <div className="hist-award-lbl" style={{ color: "#d4a843" }}>MVP</div>
                <div className="hist-award-name">{s.mvp}</div>
                <div className="hist-award-detail" style={{ color: "#d4a843" }}>Tournament</div>
              </div>
            </div>
          </div>
          {/* Top 10 — segmented toggle */}
          <div className="hist-top10-wrap">
            {/* Segmented pill */}
            <div className="hist-top10-pill">
              {([["bat", "Orange Cap", "cap-orange-emoji", "#f97316"] as const, ["bwl", "Purple Cap", "cap-purple-emoji", "#7c3aed"] as const]).map(([id, label, capCls, activeColor]) => {
                const active = histTop10Tab === id;
                return (
                  <button
                    key={id}
                    onClick={() => setHistTop10Tab(id)}
                    className={`hist-top10-pill-btn${active ? " active" : ""}`}
                    style={active ? { color: activeColor } : undefined}
                  >
                    <span className={active ? capCls : "cap-grayed"}>🧢</span> {label}
                  </button>
                );
              })}
            </div>
            {/* Full-width list */}
            <div className="hist-top10-list">
              {(histTop10Tab === "bat" ? s.topBat : s.topBwl).map((p, i) => {
                const accentColors = ["#d4a843", "#94a3b8", "#71717a"];
                const accentColor = i < 3 ? accentColors[i] : "var(--border)";
                return (
                  <div key={i} className="hist-top10-row" style={{ borderLeft: `4px solid ${accentColor}` }}>
                    <span className="hist-top10-rank" style={i < 3 ? { color: accentColors[i] } : undefined}>{i + 1}</span>
                    <TeamBadge name={p.team} size={22} />
                    <span className="hist-top10-name">{p.name}</span>
                    <span className="hist-top10-val" style={{ color: histTop10Tab === "bat" ? "#f97316" : "#7c3aed" }}>{p.val}</span>
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
                <span className="hist-cap-orange"><span className="cap-orange-emoji">🧢</span> {h.orangeCap.split(" ").slice(-1)[0]} {h.orangeRuns} runs</span>
                <span className="hist-cap-purple"><span className="cap-purple-emoji">🧢</span> {h.purpleCap.split(" ").slice(-1)[0]} {h.purpleWkts} wks</span>
              </div>
            </div>
            <div className="hist-card-arrow">›</div>
          </div>
        );
      })}
    </div>
  );
}
