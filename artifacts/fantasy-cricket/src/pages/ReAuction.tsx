import React, { useMemo, useState } from "react";
import { RA_TEAMS, RA_TEAM_ORDER, raTeamScore, REAUCTION_DATE, RA_FROM_MATCH, type RaPlayer, type RaTeam, type PlayerMatchPoints } from "../reauction-data";
import { FANTASY_TEAMS } from "../teams";
import { IPL_COLORS, ROLE_COLORS, TEAM_LOGO_CDN } from "../constants";

export interface ReAuctionPageProps {
  playerPoints: Record<string, number>;
  playerMatchPoints: PlayerMatchPoints;
}

const OWNER_ORDER = RA_TEAM_ORDER;

export default function ReAuctionPage({ playerPoints, playerMatchPoints }: ReAuctionPageProps) {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  // Compute each team's re-auction score using scorecard data from M34+
  const teamScores = useMemo(
    () =>
      OWNER_ORDER.map(id => {
        const { total, top11, players } = raTeamScore(id, playerPoints, playerMatchPoints);
        const ft = FANTASY_TEAMS[id];
        return { id, total, top11, players, ft };
      }).sort((a, b) => b.total - a.total),
    [playerPoints, playerMatchPoints]
  );

  const activeTeam = selectedTeam ?? teamScores[0]?.id;
  const activeData = teamScores.find(t => t.id === activeTeam);
  const raTeam = RA_TEAMS[activeTeam ?? "rajveer"];

  return (
    <div className="tab-view">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="sec-title" style={{ marginBottom: 4 }}>Re-Auction</div>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        background: "rgba(255,255,255,0.06)", borderRadius: 8,
        padding: "3px 9px", marginBottom: 16,
      }}>
        <span style={{ fontSize: "0.58rem", color: "var(--text-3)", letterSpacing: "0.06em" }}>LOCKED</span>
        <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--text-3)", display: "inline-block" }} />
        <span style={{ fontSize: "0.58rem", color: "var(--text-2)", fontWeight: 600 }}>{REAUCTION_DATE}</span>
      </div>

      {/* ── Leaderboard ────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-3)", marginBottom: 8 }}>
          RE-AUCTION STANDINGS
        </div>
        {teamScores.map((ts, idx) => {
          const isFirst = idx === 0;
          const gap = idx > 0 ? teamScores[0].total - ts.total : 0;
          const rankColors = ["#d4a843", "#aab4c2", "#cd7f32", "var(--text-3)"];
          return (
            <div key={ts.id}
              onClick={() => setSelectedTeam(ts.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                background: selectedTeam === ts.id || (!selectedTeam && isFirst)
                  ? ts.ft.color + "14"
                  : "var(--surface)",
                border: `1px solid ${selectedTeam === ts.id || (!selectedTeam && isFirst)
                  ? ts.ft.color + "55"
                  : "var(--border)"}`,
                borderRadius: 12,
                padding: "10px 12px",
                marginBottom: 6,
                cursor: "pointer",
                transition: "all 0.15s",
              }}>
              {/* Rank */}
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: rankColors[idx] + "22",
                border: `1.5px solid ${rankColors[idx]}55`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <span style={{ fontSize: "0.62rem", fontWeight: 800, color: rankColors[idx] }}>
                  {idx + 1}
                </span>
              </div>
              {/* Avatar */}
              <div style={{
                width: 32, height: 32, borderRadius: "50%", overflow: "hidden",
                border: `1.5px solid ${ts.ft.color}55`, flexShrink: 0,
              }}>
                <img src={`${import.meta.env.BASE_URL}avatars/${ts.ft.avatar}`}
                  alt={ts.ft.owner}
                  style={{ width: "100%", height: "100%", objectFit: "cover",
                    objectPosition: ts.ft.avatarPosition || "center" }} />
              </div>
              {/* Name + team */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: "0.82rem", fontWeight: 700,
                  color: ts.ft.color,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>{ts.ft.owner.toUpperCase()}</div>
                <div style={{ fontSize: "0.52rem", color: "var(--text-3)", marginTop: 1 }}>
                  {ts.ft.name}
                </div>
              </div>
              {/* Score + gap */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{
                  fontSize: "1.25rem", fontWeight: 800,
                  color: ts.ft.color,
                  fontVariantNumeric: "tabular-nums", lineHeight: 1,
                }}>{ts.total}</div>
                {!isFirst && (
                  <div style={{ fontSize: "0.5rem", color: "var(--text-3)", marginTop: 2 }}>
                    -{gap}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Team Selector ──────────────────────────────────────────────────── */}
      <div style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-3)", marginBottom: 8 }}>
        TEAM ROSTER
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 2 }}>
        {OWNER_ORDER.map(id => {
          const ft = FANTASY_TEAMS[id];
          const sel = activeTeam === id;
          return (
            <button key={id} onClick={() => setSelectedTeam(id)}
              style={{
                flexShrink: 0,
                display: "flex", alignItems: "center", gap: 6,
                padding: "6px 10px",
                borderRadius: 10,
                border: `1px solid ${sel ? ft.color + "77" : "var(--border)"}`,
                background: sel ? ft.color + "18" : "var(--surface)",
                cursor: "pointer", fontFamily: "inherit",
                transition: "all 0.15s",
              }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", overflow: "hidden",
                border: `1.5px solid ${sel ? ft.color : "var(--border)"}`,
              }}>
                <img src={`${import.meta.env.BASE_URL}avatars/${ft.avatar}`}
                  alt={ft.owner}
                  style={{ width: "100%", height: "100%", objectFit: "cover",
                    objectPosition: ft.avatarPosition || "center" }} />
              </div>
              <span style={{
                fontSize: "0.62rem", fontWeight: 700,
                color: sel ? ft.color : "var(--text-2)",
              }}>{ft.owner.toUpperCase()}</span>
            </button>
          );
        })}
      </div>

      {/* ── Active Team Roster ─────────────────────────────────────────────── */}
      {activeData && (
        <RosterCard
          teamId={activeTeam!}
          raTeam={raTeam}
          top11={activeData.top11}
          players={activeData.players}
          teamColor={FANTASY_TEAMS[activeTeam!].color}
          captain={raTeam.captain}
          vc={raTeam.vc}
        />
      )}
    </div>
  );
}

// ─── Roster Card ─────────────────────────────────────────────────────────────

interface RosterCardProps {
  teamId: string;
  raTeam: RaTeam;
  top11: Set<string>;
  players: Array<RaPlayer & { slotPts: number; adjPts: number; liveGain: number }>;
  teamColor: string;
  captain: string;
  vc: string;
}

function RosterCard({ top11, players, teamColor, captain, vc }: RosterCardProps) {
  const [showBench, setShowBench] = useState(false);

  const xi = players.filter(p => top11.has(p.name));
  const bench = players.filter(p => !top11.has(p.name));
  const newInXi = xi.filter(p => p.isNew).length;
  const newInAll = players.filter(p => p.isNew).length;

  return (
    <div>
      {/* Stats bar */}
      <div style={{
        display: "flex", gap: 8, marginBottom: 12,
        padding: "8px 12px",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 10,
      }}>
        <StatChip label="NEW IN XI" value={newInXi} color={teamColor} />
        <div style={{ width: 1, background: "var(--border)", flexShrink: 0 }} />
        <StatChip label="TOTAL ACQUIRED" value={newInAll} color="rgba(255,255,255,0.4)" />
      </div>

      {/* XI */}
      <div style={{ fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-3)", marginBottom: 6 }}>
        PLAYING XI
      </div>
      <div className="players-grid" style={{
        borderTop: `2px solid ${teamColor}70`,
        borderRadius: "var(--radius-md)",
        boxShadow: `0 -3px 14px ${teamColor}22`,
        marginBottom: 10,
      }}>
        {xi.map(p => (
          <PlayerRow key={p.name} p={p}
            isCap={p.name === captain} isVC={p.name === vc} teamColor={teamColor} />
        ))}
      </div>

      {/* Bench toggle */}
      <button onClick={() => setShowBench(v => !v)}
        style={{
          width: "100%", padding: "8px 12px",
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 10, cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: showBench ? 6 : 0,
        }}>
        <span style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.08em" }}>
          BENCH ({bench.length})
        </span>
        <span style={{ fontSize: "0.5rem", color: "var(--text-3)" }}>
          {showBench ? "▲" : "▼"}
        </span>
      </button>
      {showBench && (
        <div className="players-grid" style={{ opacity: 0.65 }}>
          {bench.map(p => (
            <PlayerRow key={p.name} p={p}
              isCap={false} isVC={false} teamColor={teamColor} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ flex: 1, textAlign: "center" as const }}>
      <div style={{ fontSize: "0.45rem", color: "var(--text-3)", letterSpacing: "0.08em", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: "1rem", fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

// ─── Player Row ───────────────────────────────────────────────────────────────

function PlayerRow({
  p, isCap, isVC, teamColor,
}: {
  p: RaPlayer & { slotPts: number; adjPts: number; liveGain: number };
  isCap: boolean;
  isVC: boolean;
  teamColor: string;
}) {
  const iplColor = IPL_COLORS[p.ipl] || "rgba(255,255,255,0.15)";
  const roleColor = ROLE_COLORS[p.role] || "var(--text-3)";

  // For new players: frozenPts + liveGain (actual M34+ scorecard pts)
  const frozenPts = p.frozenPts ?? 0;
  const liveGain = p.liveGain ?? 0;

  return (
    <div className="player-card"
      style={{
        background: `linear-gradient(90deg, ${iplColor}08 0%, transparent 45%)`,
        position: "relative",
      }}>
      {/* New player accent line */}
      {p.isNew && (
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
          background: teamColor,
          borderRadius: "3px 0 0 3px",
        }} />
      )}

      <img src={TEAM_LOGO_CDN[p.ipl]} alt={p.ipl}
        style={{ width: 32, height: 32, objectFit: "contain", flexShrink: 0 }}
        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Name row */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" as const }}>
          <span style={{
            fontSize: "0.88rem", fontWeight: 600, color: "var(--text)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
          }}>{p.name}</span>
          {isCap && (
            <span style={{ fontSize: "0.46rem", fontWeight: 800, background: "#d4a84322", color: "#d4a843", borderRadius: 4, padding: "1px 5px", flexShrink: 0 }}>C</span>
          )}
          {isVC && (
            <span style={{ fontSize: "0.46rem", fontWeight: 800, background: "rgba(255,255,255,0.07)", color: "var(--text-3)", borderRadius: 4, padding: "1px 5px", flexShrink: 0 }}>VC</span>
          )}
          {p.isNew && (
            <span style={{
              fontSize: "0.44rem", fontWeight: 800,
              background: teamColor + "22", color: teamColor,
              borderRadius: 4, padding: "1px 5px", flexShrink: 0,
              letterSpacing: "0.05em",
            }}>NEW</span>
          )}
        </div>

        {/* Meta row */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3, flexWrap: "wrap" as const }}>
          <span style={{
            fontSize: "0.48rem", fontWeight: 800, letterSpacing: "0.06em",
            textTransform: "uppercase" as const,
            padding: "1px 5px", borderRadius: 4,
            color: roleColor, background: roleColor + "18", border: `1px solid ${roleColor}30`,
            flexShrink: 0,
          }}>{p.role}</span>

          {p.isNew ? (
            // Slot breakdown: frozen pts from released player + M34+ scorecard pts
            <span style={{ fontSize: "0.46rem", color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>
              <span style={{ color: "rgba(255,255,255,0.45)" }}>{frozenPts}</span>
              <span style={{ color: "var(--text-3)" }}> frozen</span>
              {liveGain > 0
                ? <span> + <span style={{ color: "#2ecc8f" }}>{liveGain}</span> M{RA_FROM_MATCH}+</span>
                : <span style={{ color: "var(--text-3)" }}> + 0 M{RA_FROM_MATCH}+</span>
              }
            </span>
          ) : (
            <span style={{ fontSize: "0.48rem", color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>
              {p.slotPts} pts
            </span>
          )}

          {p.replacedName && (
            <span style={{ fontSize: "0.44rem", color: "rgba(255,100,100,0.65)", fontStyle: "italic" }}>
              ↩ {p.replacedName.split(" ").pop()}
            </span>
          )}
        </div>
      </div>

      {/* Points column */}
      <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
        <div style={{
          fontSize: "1rem", fontWeight: 800,
          color: p.isNew ? teamColor : "var(--text)",
          fontVariantNumeric: "tabular-nums", lineHeight: 1,
        }}>
          {Math.round(p.adjPts)}
        </div>
        {(isCap || isVC) && (
          <div style={{ fontSize: "0.42rem", color: "var(--text-3)", marginTop: 1 }}>
            {isCap ? "×2" : "×1.5"}
          </div>
        )}
      </div>
    </div>
  );
}
