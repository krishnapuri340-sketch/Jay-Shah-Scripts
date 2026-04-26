import React, { useMemo, useState } from "react";
import { RA_TEAMS, RA_TEAM_ORDER, raTeamScore, REAUCTION_DATE, RA_FROM_MATCH, type RaPlayer, type RaTeam, type PlayerMatchPoints } from "../reauction-data";
import { FANTASY_TEAMS } from "../teams";
import { IPL_COLORS, ROLE_COLORS, TEAM_LOGO_CDN } from "../constants";
import { usePoints } from "../context/PointsContext";

const OWNER_ORDER = RA_TEAM_ORDER;

const TEAM_ABBREV: Record<string, string> = {
  "Rajasthan Royals": "RR",
  "Chennai Super Kings": "CSK",
  "Mumbai Indians": "MI",
  "Kolkata Knight Riders": "KKR",
  "Sunrisers Hyderabad": "SRH",
  "Royal Challengers Bengaluru": "RCB",
  "Royal Challengers Bangalore": "RCB",
  "Delhi Capitals": "DC",
  "Punjab Kings": "PBKS",
  "Lucknow Super Giants": "LSG",
  "Gujarat Titans": "GT",
};

function abbrevLabel(label: string | undefined): string {
  if (!label) return "";
  return label.replace(
    /Rajasthan Royals|Chennai Super Kings|Mumbai Indians|Kolkata Knight Riders|Sunrisers Hyderabad|Royal Challengers Bengaluru|Royal Challengers Bangalore|Delhi Capitals|Punjab Kings|Lucknow Super Giants|Gujarat Titans/g,
    m => TEAM_ABBREV[m] ?? m
  );
}

export default function ReAuctionPage() {
  const { playerPoints, playerMatchPoints } = usePoints();
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
          const gap = idx > 0 ? (teamScores[0].total - ts.total).toFixed(1) : 0;
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
                }}>{typeof ts.total === "number" ? ts.total.toFixed(1) : ts.total}</div>
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
          playerMatchPoints={playerMatchPoints}
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
  playerMatchPoints: PlayerMatchPoints;
}

function RosterCard({ top11, players, teamColor, captain, vc, playerMatchPoints }: RosterCardProps) {
  const [showBench, setShowBench] = useState(false);
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [expandedBdMatches, setExpandedBdMatches] = useState<Set<string>>(new Set());

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
            isCap={p.name === captain} isVC={p.name === vc} teamColor={teamColor}
            matchPoints={playerMatchPoints[p.name] || []}
            replacedMatchPoints={p.replacedName ? (playerMatchPoints[p.replacedName] || []).filter(e => e.matchNum < RA_FROM_MATCH) : []}
            isExpanded={expandedPlayer === p.name}
            expandedBdMatches={expandedBdMatches}
            onToggle={() => setExpandedPlayer(expandedPlayer === p.name ? null : p.name)}
            onToggleBd={(k) => setExpandedBdMatches(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; })}
          />
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
              isCap={false} isVC={false} teamColor={teamColor}
              matchPoints={playerMatchPoints[p.name] || []}
              replacedMatchPoints={p.replacedName ? (playerMatchPoints[p.replacedName] || []).filter(e => e.matchNum < RA_FROM_MATCH) : []}
              isExpanded={expandedPlayer === p.name}
              expandedBdMatches={expandedBdMatches}
              onToggle={() => setExpandedPlayer(expandedPlayer === p.name ? null : p.name)}
              onToggleBd={(k) => setExpandedBdMatches(prev => { const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k); return n; })}
            />
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

// ─── Scoring lines helper ─────────────────────────────────────────────────────

function buildScoringLines(s: any): { label: string; pts: number; color: string }[] {
  const lines: { label: string; pts: number; color: string }[] = [];
  if (!s) return lines;
  lines.push({ label: "Playing XI", pts: 4, color: "#64748b" });
  if (s.runs > 0) lines.push({ label: `${s.runs} runs (${s.balls}b)`, pts: s.runs, color: "#f97316" });
  if (s.fours > 0) lines.push({ label: `${s.fours} fours`, pts: s.fours * 4, color: "#fb923c" });
  if (s.sixes > 0) lines.push({ label: `${s.sixes} sixes`, pts: s.sixes * 6, color: "#fbbf24" });
  if (s.duck) lines.push({ label: "Duck", pts: -2, color: "#ef4444" });
  const r = s.runs, b = s.balls;
  if (r >= 100) lines.push({ label: "Century bonus", pts: 16, color: "#34d399" });
  else if (r >= 75) lines.push({ label: "75+ bonus", pts: 12, color: "#34d399" });
  else if (r >= 50) lines.push({ label: "50+ bonus", pts: 8, color: "#34d399" });
  else if (r >= 25) lines.push({ label: "25+ bonus", pts: 4, color: "#34d399" });
  if (b >= 10 || r >= 20) {
    const sr = b > 0 ? (r / b) * 100 : 0;
    if (sr > 190) lines.push({ label: `SR ${sr.toFixed(0)} bonus`, pts: 8, color: "#34d399" });
    else if (sr > 170) lines.push({ label: `SR ${sr.toFixed(0)} bonus`, pts: 6, color: "#34d399" });
    else if (sr > 150) lines.push({ label: `SR ${sr.toFixed(0)} bonus`, pts: 4, color: "#34d399" });
    else if (sr >= 130) lines.push({ label: `SR ${sr.toFixed(0)} bonus`, pts: 2, color: "#34d399" });
    else if (sr >= 70 && sr <= 100) lines.push({ label: `SR ${sr.toFixed(0)} penalty`, pts: -2, color: "#ef4444" });
    else if (sr >= 60 && sr < 70) lines.push({ label: `SR ${sr.toFixed(0)} penalty`, pts: -4, color: "#ef4444" });
    else if (sr >= 50 && sr < 60) lines.push({ label: `SR ${sr.toFixed(0)} penalty`, pts: -6, color: "#ef4444" });
  }
  if (s.wickets > 0) lines.push({ label: `${s.wickets} wkt${s.wickets > 1 ? "s" : ""}`, pts: s.wickets * 30, color: "#60a5fa" });
  if (s.lbwBowled > 0) lines.push({ label: `${s.lbwBowled} LBW/Bowled`, pts: s.lbwBowled * 8, color: "#60a5fa" });
  if (s.dots > 0) lines.push({ label: `${s.dots} dots`, pts: s.dots * 2, color: "#818cf8" });
  if (s.maidens > 0) lines.push({ label: `${s.maidens} maiden${s.maidens > 1 ? "s" : ""}`, pts: s.maidens * 12, color: "#818cf8" });
  const w = s.wickets;
  if (w >= 5) lines.push({ label: "5-wkt haul", pts: 16, color: "#34d399" });
  else if (w >= 4) lines.push({ label: "4-wkt haul", pts: 12, color: "#34d399" });
  else if (w >= 3) lines.push({ label: "3-wkt haul", pts: 8, color: "#34d399" });
  const overs = s.ballsBowled / 6;
  if (overs >= 2) {
    const eco = s.runsConceded / overs;
    if (eco < 5) lines.push({ label: `Eco ${eco.toFixed(1)}`, pts: 8, color: "#34d399" });
    else if (eco < 6) lines.push({ label: `Eco ${eco.toFixed(1)}`, pts: 6, color: "#34d399" });
    else if (eco <= 7) lines.push({ label: `Eco ${eco.toFixed(1)}`, pts: 4, color: "#34d399" });
    else if (eco <= 8) lines.push({ label: `Eco ${eco.toFixed(1)}`, pts: 2, color: "#34d399" });
    else if (eco >= 10 && eco <= 11) lines.push({ label: `Eco ${eco.toFixed(1)}`, pts: -2, color: "#ef4444" });
    else if (eco > 11 && eco <= 12) lines.push({ label: `Eco ${eco.toFixed(1)}`, pts: -4, color: "#ef4444" });
    else if (eco > 12) lines.push({ label: `Eco ${eco.toFixed(1)}`, pts: -6, color: "#ef4444" });
  }
  if (s.catches > 0) lines.push({ label: `${s.catches} catch${s.catches > 1 ? "es" : ""}`, pts: s.catches * 8, color: "#a78bfa" });
  if (s.catches >= 3) lines.push({ label: "3+ catch bonus", pts: 4, color: "#a78bfa" });
  if (s.runOuts > 0) lines.push({ label: `${s.runOuts} run out${s.runOuts > 1 ? "s" : ""}`, pts: s.runOuts * 10, color: "#a78bfa" });
  if ((s as any).sharedRunOuts > 0) lines.push({ label: `${(s as any).sharedRunOuts} shared RO`, pts: (s as any).sharedRunOuts * 5, color: "#a78bfa" });
  if (s.stumpings > 0) lines.push({ label: `${s.stumpings} stumping${s.stumpings > 1 ? "s" : ""}`, pts: s.stumpings * 12, color: "#a78bfa" });
  return lines;
}

// ─── Player Row ───────────────────────────────────────────────────────────────

type MatchEntry = { matchNum: number; pts: number; label?: string; source?: string; stats?: any };

function PlayerRow({
  p, isCap, isVC, teamColor, matchPoints, replacedMatchPoints, isExpanded, expandedBdMatches, onToggle, onToggleBd,
}: {
  p: RaPlayer & { slotPts: number; adjPts: number; liveGain: number };
  isCap: boolean;
  isVC: boolean;
  teamColor: string;
  matchPoints: MatchEntry[];
  replacedMatchPoints: MatchEntry[];
  isExpanded: boolean;
  expandedBdMatches: Set<string>;
  onToggle: () => void;
  onToggleBd: (key: string) => void;
}) {
  const iplColor = IPL_COLORS[p.ipl] || "rgba(255,255,255,0.15)";
  const roleColor = ROLE_COLORS[p.role] || "var(--text-3)";
  const frozenPts = p.frozenPts ?? 0;
  const liveGain = p.liveGain ?? 0;

  // Sparkline — last 5 matches
  const last5 = matchPoints.slice(-5);
  const maxPts = Math.max(...last5.map(m => m.pts), 1);
  const BAR_W = 4, GAP = 2, H = 10;
  const sparkW = last5.length * (BAR_W + GAP) - GAP;

  return (
    <React.Fragment>
      <div className={`player-card${isExpanded ? " player-expanded" : ""}`}
        onClick={onToggle}
        style={{
          background: isExpanded
            ? `linear-gradient(90deg, ${iplColor}0a 0%, transparent 55%)`
            : `linear-gradient(90deg, ${iplColor}08 0%, transparent 45%)`,
          position: "relative",
          cursor: "pointer",
          WebkitTapHighlightColor: "transparent",
        }}>
        {/* New player accent line */}
        {p.isNew && (
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
            background: teamColor, borderRadius: "3px 0 0 3px",
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
            {isCap && <span style={{ fontSize: "0.46rem", fontWeight: 800, background: "#d4a84322", color: "#d4a843", borderRadius: 4, padding: "1px 5px", flexShrink: 0 }}>C</span>}
            {isVC && <span style={{ fontSize: "0.46rem", fontWeight: 800, background: "rgba(255,255,255,0.07)", color: "var(--text-3)", borderRadius: 4, padding: "1px 5px", flexShrink: 0 }}>VC</span>}
            {p.isNew && (
              <span style={{ fontSize: "0.44rem", fontWeight: 800, background: teamColor + "22", color: teamColor, borderRadius: 4, padding: "1px 5px", flexShrink: 0, letterSpacing: "0.05em" }}>NEW</span>
            )}
          </div>

          {/* Meta row */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 5, marginTop: 3, flexWrap: "wrap" as const }}>
            <span style={{
              fontSize: "0.48rem", fontWeight: 800, letterSpacing: "0.06em",
              textTransform: "uppercase" as const, padding: "1px 5px", borderRadius: 4,
              color: roleColor, background: roleColor + "18", border: `1px solid ${roleColor}30`, flexShrink: 0,
            }}>{p.role}</span>

            {p.isNew ? (
              <span style={{ fontSize: "0.46rem", color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>
                {p.replacedName && (
                  <span style={{ color: "rgba(255,100,100,0.65)", fontStyle: "italic", marginRight: 4 }}>
                    ↩ {p.replacedName.split(" ").pop()} ·
                  </span>
                )}
                <span style={{ color: "rgba(255,255,255,0.45)" }}>{frozenPts}</span>
                <span style={{ color: "var(--text-3)" }}>pts frozen</span>
                {liveGain > 0
                  ? <span> + <span style={{ color: "rgba(255,255,255,0.45)" }}>{liveGain}</span>pts M{RA_FROM_MATCH}+</span>
                  : <span style={{ color: "var(--text-3)" }}> + 0pts M{RA_FROM_MATCH}+</span>
                }
              </span>
            ) : (
              <span style={{ fontSize: "0.48rem", color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>
                {p.slotPts} pts
              </span>
            )}

            {/* Sparkline */}
            {last5.length > 0 && (
              <svg width={sparkW} height={H} style={{ display: "block", marginLeft: 4, flexShrink: 0, opacity: 0.8 }}>
                {last5.map((m, i) => {
                  const barH = Math.max(2, Math.round((m.pts / maxPts) * H));
                  return (
                    <rect key={i} x={i * (BAR_W + GAP)} y={H - barH} width={BAR_W} height={barH} rx={1}
                      fill={m.pts > 0 ? (p.isNew ? teamColor : "rgba(255,255,255,0.45)") : "#334155"} />
                  );
                })}
              </svg>
            )}
          </div>
        </div>

        {/* Points column */}
        <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: p.isNew ? teamColor : "var(--text)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
            {p.adjPts % 1 === 0 ? Math.round(p.adjPts) : p.adjPts.toFixed(1)}
          </div>
          {(isCap || isVC) && (
            <div style={{ fontSize: "0.42rem", color: "var(--text-3)", marginTop: 1 }}>
              {isCap ? "×2" : "×1.5"}
            </div>
          )}
        </div>
      </div>

      {/* ── Expanded Breakdown ──────────────────────────────────────────────── */}
      {isExpanded && (
        <div style={{
          background: "rgba(8,12,20,0.97)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12, padding: "12px 14px", marginTop: 1, marginBottom: 1,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {isCap && <span style={{ fontSize: "0.5rem", fontWeight: 800, color: "#d4a843", background: "rgba(212,168,67,0.14)", border: "1px solid rgba(212,168,67,0.3)", borderRadius: 5, padding: "1px 5px" }}>C ×2</span>}
              {isVC && <span style={{ fontSize: "0.5rem", fontWeight: 800, color: "#9e8e7e", background: "rgba(158,142,126,0.12)", border: "1px solid rgba(158,142,126,0.28)", borderRadius: 5, padding: "1px 5px" }}>VC ×1.5</span>}
              <span style={{ fontSize: "0.58rem", color: "var(--text-3)" }}>Match breakdown</span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onToggle(); }}
              style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: "0.7rem", padding: "3px 7px", borderRadius: 6, lineHeight: 1 }}>✕</button>
          </div>

          {matchPoints.length === 0 && replacedMatchPoints.length === 0 && !(p.isNew && p.replacedName) ? (
            <div style={{ color: "var(--text-3)", fontSize: "0.72rem", textAlign: "center" as const, padding: "10px 0" }}>No match data yet</div>
          ) : (
            <>
              {/* ── Old player: no data placeholder ─────────────────────── */}
              {p.isNew && p.replacedName && replacedMatchPoints.length === 0 && (
                <div style={{ opacity: 0.75, marginBottom: matchPoints.length > 0 ? 0 : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0" }}>
                    <span style={{ fontSize: "0.5rem", fontWeight: 700, color: "var(--text-3)", background: "rgba(255,255,255,0.06)", borderRadius: 4, padding: "1px 4px", flexShrink: 0 }}>
                      M1–M33
                    </span>
                    <span style={{ fontSize: "0.44rem", fontWeight: 700, color: "rgba(255,100,100,0.7)", background: "rgba(255,100,100,0.08)", borderRadius: 3, padding: "1px 4px", flexShrink: 0 }}>
                      {p.replacedName.split(" ").slice(-1)[0]}
                    </span>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-3)", flex: 1, fontStyle: "italic" as const }}>Did not play</span>
                    <span style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-3)", minWidth: 26, textAlign: "right" as const }}>0</span>
                  </div>
                </div>
              )}

              {/* ── Old player rows (pre-auction) ────────────────────────── */}
              {replacedMatchPoints.map((entry, ei) => {
                const s = entry.stats;
                const bdKey = `OLD-${p.name}-${ei}`;
                const isEntryOpen = expandedBdMatches.has(bdKey);
                const lines = buildScoringLines(s);
                const computed = lines.reduce((a, l) => a + l.pts, 0);
                const diff = s ? entry.pts - computed : 0;
                const isLast = ei === replacedMatchPoints.length - 1;
                return (
                  <div key={bdKey} style={{ opacity: 0.75, marginBottom: isLast ? 0 : 6, paddingBottom: isLast ? 0 : 6, borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.05)" }}>
                    <div onClick={(e) => { e.stopPropagation(); if (s) onToggleBd(bdKey); }}
                      style={{ display: "flex", alignItems: "center", gap: 6, cursor: s ? "pointer" : "default", WebkitTapHighlightColor: "transparent", padding: "2px 0" }}>
                      <span style={{ fontSize: "0.5rem", fontWeight: 700, color: "#34d399", background: "rgba(52,211,153,0.12)", borderRadius: 4, padding: "1px 4px", flexShrink: 0 }}>
                        M{entry.matchNum}
                      </span>
                      <span style={{ fontSize: "0.44rem", fontWeight: 700, color: "rgba(255,100,100,0.7)", background: "rgba(255,100,100,0.08)", borderRadius: 3, padding: "1px 4px", flexShrink: 0 }}>
                        {p.replacedName?.split(" ").slice(-1)[0]}
                      </span>
                      <span style={{ fontSize: "0.65rem", color: "var(--text-3)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{abbrevLabel(entry.label)}</span>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: entry.source === "official" ? "#34d399" : "#fbbf24", flexShrink: 0 }} />
                      <span style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-3)", minWidth: 26, textAlign: "right" as const }}>{entry.pts}</span>
                      {s && (
                        <svg width="8" height="5" viewBox="0 0 10 6" fill="none" style={{ flexShrink: 0, transition: "transform 0.18s", transform: isEntryOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                          <path d="M1 1l4 4 4-4" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    {isEntryOpen && s && lines.length > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 1, columnGap: 10, padding: "6px 8px", background: "rgba(255,255,255,0.02)", borderRadius: 7, marginTop: 4 }}>
                        {lines.map((line, li) => (
                          <React.Fragment key={li}>
                            <span style={{ fontSize: "0.6rem", color: "var(--text-3)" }}>{line.label}</span>
                            <span style={{ fontSize: "0.6rem", fontWeight: 600, color: line.pts >= 0 ? line.color : "#ef4444", textAlign: "right" as const }}>{line.pts > 0 ? "+" : ""}{line.pts}</span>
                          </React.Fragment>
                        ))}
                        {Math.abs(diff) > 0 && (
                          <React.Fragment>
                            <span style={{ fontSize: "0.6rem", color: "var(--text-3)", fontStyle: "italic" as const }}>other</span>
                            <span style={{ fontSize: "0.6rem", fontWeight: 600, color: diff >= 0 ? "#a78bfa" : "#ef4444", textAlign: "right" as const }}>{diff > 0 ? "+" : ""}{diff}</span>
                          </React.Fragment>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* ── Re-Auction divider ───────────────────────────────────── */}
              {p.isNew && (replacedMatchPoints.length > 0 || !!p.replacedName) && matchPoints.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "8px 0", opacity: 0.7 }}>
                  <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${teamColor}60)` }} />
                  <span style={{ fontSize: "0.44rem", fontWeight: 800, letterSpacing: "0.07em", color: teamColor, textTransform: "uppercase" as const }}>↩ Re-Auction · M{RA_FROM_MATCH}+</span>
                  <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${teamColor}60)` }} />
                </div>
              )}

              {/* ── New / current player rows ────────────────────────────── */}
              {matchPoints.map((entry, ei) => {
                const s = entry.stats;
                const bdKey = `${p.name}-${ei}`;
                const isEntryOpen = expandedBdMatches.has(bdKey);
                const isPostAuction = entry.matchNum >= RA_FROM_MATCH;
                const lines = buildScoringLines(s);
                const computed = lines.reduce((a, l) => a + l.pts, 0);
                const diff = s ? entry.pts - computed : 0;
                return (
                  <div key={ei} style={{ marginBottom: ei < matchPoints.length - 1 ? 6 : 0, paddingBottom: ei < matchPoints.length - 1 ? 6 : 0, borderBottom: ei < matchPoints.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                    <div onClick={(e) => { e.stopPropagation(); if (s) onToggleBd(bdKey); }}
                      style={{ display: "flex", alignItems: "center", gap: 6, cursor: s ? "pointer" : "default", WebkitTapHighlightColor: "transparent", padding: "2px 0" }}>
                      <span style={{ fontSize: "0.5rem", fontWeight: 700, color: isPostAuction ? "#34d399" : "var(--text-3)", background: isPostAuction ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.06)", borderRadius: 4, padding: "1px 4px", flexShrink: 0 }}>
                        M{entry.matchNum}
                      </span>
                      <span style={{ fontSize: "0.65rem", color: "var(--text-2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{abbrevLabel(entry.label)}</span>
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: entry.source === "official" ? "#34d399" : "#fbbf24", flexShrink: 0 }} />
                      <span style={{ fontSize: "0.92rem", fontWeight: 700, color: entry.pts > 0 ? "var(--text)" : "var(--text-3)", minWidth: 26, textAlign: "right" as const }}>
                        {entry.pts}
                      </span>
                      {s && (
                        <svg width="8" height="5" viewBox="0 0 10 6" fill="none" style={{ flexShrink: 0, transition: "transform 0.18s", transform: isEntryOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                          <path d="M1 1l4 4 4-4" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    {isEntryOpen && s && lines.length > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 1, columnGap: 10, padding: "6px 8px", background: "rgba(255,255,255,0.02)", borderRadius: 7, marginTop: 4 }}>
                        {lines.map((line, li) => (
                          <React.Fragment key={li}>
                            <span style={{ fontSize: "0.6rem", color: "var(--text-3)" }}>{line.label}</span>
                            <span style={{ fontSize: "0.6rem", fontWeight: 600, color: line.pts >= 0 ? line.color : "#ef4444", textAlign: "right" as const }}>{line.pts > 0 ? "+" : ""}{line.pts}</span>
                          </React.Fragment>
                        ))}
                        {Math.abs(diff) > 0 && (
                          <React.Fragment>
                            <span style={{ fontSize: "0.6rem", color: "var(--text-3)", fontStyle: "italic" as const }}>other</span>
                            <span style={{ fontSize: "0.6rem", fontWeight: 600, color: diff >= 0 ? "#a78bfa" : "#ef4444", textAlign: "right" as const }}>{diff > 0 ? "+" : ""}{diff}</span>
                          </React.Fragment>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 10, paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.62rem", color: "var(--text-3)" }}>
              {isCap ? `${p.slotPts} raw · × 2 (Captain)` : isVC ? `${p.slotPts} raw · × 1.5 (VC)` : "Total"}
            </span>
            <span style={{ fontSize: "1rem", fontWeight: 700, color: p.isNew ? teamColor : "var(--text)" }}>{p.adjPts % 1 === 0 ? Math.round(p.adjPts) : p.adjPts.toFixed(1)} pts</span>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}
