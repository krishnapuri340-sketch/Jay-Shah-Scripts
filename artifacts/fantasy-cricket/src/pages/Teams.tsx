import React, { useState } from "react";
import { ROLE_COLORS, IPL_COLORS, IPL_TEAM_BADGE, TEAM_LOGO_CDN } from "../constants";
import { FANTASY_TEAMS } from "../teams";
import { getTeamData, applyMultiplier } from "../utils";
import { usePoints } from "../context/PointsContext";
import { RA_TEAMS, raTeamScore, RA_FROM_MATCH } from "../reauction-data";

interface TeamsPageProps {
  selectedTeam: string;
  setSelectedTeam: (id: string) => void;
  upcomingLineupPreviews: any[];
  liveMatchPreviews: any[];
  shareTeams: () => void;
  sparkTip: { label: string; pts: number } | null;
  setSparkTip: React.Dispatch<React.SetStateAction<{ label: string; pts: number } | null>>;
  sparkTipTimer: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
}

function Sparkline({ name, color, setSparkTip, sparkTipTimer }: {
  name: string;
  color: string;
  setSparkTip: React.Dispatch<React.SetStateAction<{ label: string; pts: number } | null>>;
  sparkTipTimer: React.MutableRefObject<ReturnType<typeof setTimeout> | null>;
}) {
  const { playerMatchPoints } = usePoints();
  const matches = (playerMatchPoints[name] || []).filter((e: any) => e.matchNum < 900).slice(-5);
  if (matches.length === 0) return null;
  const maxPts = Math.max(...matches.map((m: any) => m.pts), 1);
  const BAR_W = 4, GAP = 2, H = 12;
  const sparkW = matches.length * (BAR_W + GAP) - GAP;
  return (
    <svg width={sparkW} height={H} style={{ display: "block", flexShrink: 0, cursor: "pointer" }}>
      {matches.map((m: any, i: number) => {
        const barH = Math.max(2, Math.round((Math.max(m.pts, 0) / maxPts) * H));
        return (
          <rect key={i} x={i * (BAR_W + GAP)} y={H - barH} width={BAR_W} height={barH} rx={1}
            fill={m.pts > 0 ? color : "#334155"}
            onClickCapture={(e) => {
              e.stopPropagation();
              if (sparkTipTimer.current) clearTimeout(sparkTipTimer.current);
              setSparkTip({ pts: m.pts, label: m.label });
              sparkTipTimer.current = setTimeout(() => setSparkTip(null), 3000);
            }}
          />
        );
      })}
    </svg>
  );
}

function shortMatchLabel(label: string): string {
  return label.split(" vs ").map(t =>
    IPL_TEAM_BADGE[t]?.abbr || t.split(" ").map((w: string) => w[0]).join("")
  ).join(" vs ");
}

export default function TeamsPage(props: TeamsPageProps) {
  const {
    selectedTeam, setSelectedTeam,
    upcomingLineupPreviews, liveMatchPreviews,
    shareTeams, setSparkTip, sparkTipTimer,
  } = props;
  const { playerPoints, teamScores, playerMatchPoints } = usePoints();
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [expandedBdMatches, setExpandedBdMatches] = useState<Set<string>>(new Set());
  const [scoringGuideOpen, setScoringGuideOpen] = useState(false);
  const [expandedMatchNums, setExpandedMatchNums] = useState<Set<number>>(new Set());
  const [teamSection, setTeamSection] = useState<"xi" | "bench" | "matchpts">("xi");
  const [drillPlayer, setDrillPlayer] = useState<string | null>(null);
  const [teamsView, setTeamsView] = useState<"original" | "reauction">("reauction");

    const t = FANTASY_TEAMS[selectedTeam];
    const td = getTeamData(selectedTeam, playerPoints);
    const roleCounts = td.players.reduce((acc: Record<string, number>, p) => {
      acc[p.role] = (acc[p.role] || 0) + 1;
      return acc;
    }, {});

    const raScore = raTeamScore(selectedTeam, playerPoints, playerMatchPoints);
    const raRoleCounts = RA_TEAMS[selectedTeam].players.reduce((acc: Record<string, number>, p) => {
      acc[p.role] = (acc[p.role] || 0) + 1;
      return acc;
    }, {});
    const raExtras = new Map(raScore.players.map(p => [p.name, {
      isNew: p.isNew, frozenPts: p.frozenPts ?? 0, liveGain: p.liveGain, replacedName: p.replacedName,
    }]));
    const isRA = teamsView === "reauction";
    const activeCap = isRA ? RA_TEAMS[selectedTeam].captain : t.captain;
    const activeVC  = isRA ? RA_TEAMS[selectedTeam].vc       : t.vc;
    const displayRoleCounts = isRA ? raRoleCounts : roleCounts;
    const displayTotal = isRA ? raScore.total : (Object.keys(playerPoints).length === 0 ? null : td.total);

    // Helper: extract match label + players for this team from a preview list
    const extractForTeam = (previews: any[]) => {
      const playing = new Set<string>();
      const playerMatchLabel = new Map<string, string>();
      const infos: { matchLabel: string; playingTeams: string[] }[] = [];
      previews.forEach((lp: any) => {
        const myPlayers = lp.preview.find((x: any) => x.team.id === selectedTeam);
        if (myPlayers && myPlayers.activePlayers.length > 0) {
          const ti: any[] = lp.match.teamInfo || [];
          const matchLabel = ti.length >= 2
            ? `${ti[0]?.shortname || ""} vs ${ti[1]?.shortname || ""}`
            : lp.match.name;
          myPlayers.activePlayers.forEach((p: any) => {
            playing.add(p.name);
            playerMatchLabel.set(p.name, matchLabel);
          });
          infos.push({ matchLabel, playingTeams: lp.playingTeams });
        }
      });
      return { playing, infos, playerMatchLabel };
    };

    const { playing: liveNowPlaying, infos: liveNowInfo } = extractForTeam(liveMatchPreviews);
    const { playing: nextMatchPlaying, infos: nextMatchInfoForTeam, playerMatchLabel: nextPlayerMatchLabel } = extractForTeam(upcomingLineupPreviews);
    const bannerPlayers = isRA ? RA_TEAMS[selectedTeam].players : td.players;

    // In RA mode: add new RA players if their own IPL team is in the upcoming/live match
    const liveIplTeams = new Set<string>(liveNowInfo.flatMap(i => i.playingTeams));
    const nextIplTeams = new Set<string>(nextMatchInfoForTeam.flatMap(i => i.playingTeams));
    const expandPlaying = (playing: Set<string>, matchIplTeams: Set<string>) => {
      if (!isRA || matchIplTeams.size === 0) return playing;
      const expanded = new Set(playing);
      for (const p of RA_TEAMS[selectedTeam].players) {
        if (p.isNew && matchIplTeams.has(p.ipl.toUpperCase())) expanded.add(p.name);
      }
      return expanded;
    };
    const effectiveLivePlaying = expandPlaying(liveNowPlaying, liveIplTeams);
    const effectiveNextPlaying = expandPlaying(nextMatchPlaying, nextIplTeams);

    const hasLiveNow = liveNowPlaying.size > 0;
    const hasNextMatch = nextMatchPlaying.size > 0;
    const hasAnyContext = hasLiveNow || hasNextMatch;

    const TEAM_BG: Record<string, string> = {
      rajveer:  `${import.meta.env.BASE_URL}lb-bg-rajveer.jpeg`,
      mombasa:  `${import.meta.env.BASE_URL}lb-bg-mumbai.jpeg`,
      mumbai:   `${import.meta.env.BASE_URL}lb-bg-mombasa.jpeg`,
      ponygoat: `${import.meta.env.BASE_URL}lb-bg-ponygoat.jpeg`,
    };

    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
          <div className="sec-title" style={{ marginBottom: 0, flexShrink: 0 }}>Teams</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* Original / Re-Auction toggle */}
            <div style={{ display: "flex", background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, overflow: "hidden" }}>
              {(["original", "reauction"] as const).map(v => (
                <button key={v} onClick={() => setTeamsView(v)}
                  style={{
                    padding: "4px 9px", fontSize: "0.6rem", fontWeight: 700, border: "none", cursor: "pointer",
                    fontFamily: "inherit",
                    background: teamsView === v ? "rgba(255,255,255,0.12)" : "transparent",
                    color: teamsView === v ? "var(--text)" : "var(--text-3)",
                    letterSpacing: "0.04em",
                    WebkitTapHighlightColor: "transparent",
                  }}>
                  {v === "original" ? "Original" : "Re-Auction"}
                </button>
              ))}
            </div>
            <button className="btn-primary" style={{ padding: "6px 10px", display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }} onClick={shareTeams} title="Share all teams">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              <span style={{ fontSize: "0.68rem" }}>Share</span>
            </button>
          </div>
        </div>
        <div className="team-avatar-row" data-no-swipe="true">
          {teamScores.map((s, i) => {
            const ft = s.team;
            const isActive = selectedTeam === ft.id;
            const rankNum = i + 1;
            const shortName = ft.id === "rajveer" ? "Raj" : ft.id === "mombasa" ? "Rahul" : ft.id === "mumbai" ? "Smeet" : "Deb";
            const hasPoints = Object.keys(playerPoints).length > 0;
            return (
              <button key={ft.id}
                className={`team-avatar-btn${isActive ? " active" : ""}`}
                style={{ "--ta-color": ft.color } as React.CSSProperties}
                onClick={() => setSelectedTeam(ft.id)}>
                <div className="team-avatar-ring">
                  <img
                    src={`${import.meta.env.BASE_URL}avatars/${ft.avatar}`}
                    alt={ft.owner}
                    className="team-avatar-img"
                    style={{ objectPosition: ft.avatarPosition || "center center" }}
                  />
                  {/* rank badge hidden but order preserved */}
                </div>
                <span className="team-avatar-name">{shortName}</span>
              </button>
            );
          })}
        </div>
        <div className="team-header-card" style={{ "--team-color": t.color } as React.CSSProperties}>
          {/* Blurred team artwork background */}
          <div style={{
            position: "absolute", inset: -6, zIndex: 0,
            backgroundImage: `url(${TEAM_BG[selectedTeam]})`,
            backgroundSize: "cover", backgroundPosition: "center 30%",
            filter: "blur(24px) brightness(0.55) saturate(1.4)",
          }} />
          <div style={{
            position: "absolute", inset: 0, zIndex: 1,
            background: `linear-gradient(135deg, ${t.color}14 0%, rgba(9,9,11,0.28) 100%)`,
          }} />
          <div style={{ flex: 1, position: "relative", zIndex: 2 }}>
            <div className="team-hname" style={{ color: t.color, textShadow: "0 1px 6px rgba(0,0,0,1)" }}>{t.name}</div>
            <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.92)", marginBottom: 4 }}>{t.owner}</div>
            <div className="team-roles">
              {Object.entries(displayRoleCounts).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([role, n]) => (
                <span key={role} className="role-badge"
                  style={{ color: ROLE_COLORS[role], borderColor: ROLE_COLORS[role] + "44", background: ROLE_COLORS[role] + "11" }}>
                  {n} {role}
                </span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: "right", position: "relative", zIndex: 2 }}>
            <div className="team-htotal" style={{ color: displayTotal === null ? "var(--text-3)" : t.color, textShadow: `0 0 10px ${t.color}55, 0 1px 4px rgba(0,0,0,1)` }}>
              {displayTotal === null ? "—" : displayTotal}
            </div>
            <div className="team-hlabel" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>{isRA ? "re-auction pts" : "total pts"}</div>
          </div>
        </div>
        {/* Match status banner — shows LIVE and/or UPCOMING players */}
        {hasAnyContext && (
          <div className={`team-next-match-banner ${hasLiveNow ? "has-live" : ""}`}>

            {/* LIVE section */}
            {hasLiveNow && (
              <div style={{ marginBottom: hasNextMatch ? 12 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <span className="live-pulse-dot" />
                  <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "#f87171", letterSpacing: "0.06em" }}>LIVE</span>
                  {liveNowInfo[0] && <span style={{ fontSize: "0.65rem", color: "var(--text-3)" }}>{liveNowInfo[0].matchLabel}</span>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {bannerPlayers.filter(p => effectiveLivePlaying.has(p.name)).map(p => (
                    <div key={p.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f87171", display: "inline-block", flexShrink: 0 }} />
                        <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "#fca5a5" }}>{p.name}</span>
                        {p.name === activeCap && <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#d4a843" }}>C</span>}
                        {p.name === activeVC && <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-3)" }}>VC</span>}
                      </div>
                      <span style={{ fontSize: "0.62rem", color: IPL_COLORS[p.ipl] || "var(--text-3)", fontWeight: 600 }}>{p.ipl}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Divider when both sections exist */}
            {hasLiveNow && hasNextMatch && (
              <div style={{ borderTop: "1px solid var(--border)", marginBottom: 12 }} />
            )}

            {/* UPCOMING section */}
            {hasNextMatch && (
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" as const }}>
                  <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.06em" }}>NEXT</span>
                  {nextMatchInfoForTeam.map((info, idx) => (
                    <span key={idx} style={{ fontSize: "0.65rem", color: "var(--text-2)" }}>
                      {idx > 0 && <span style={{ color: "var(--text-3)", marginRight: 4 }}>·</span>}
                      {info.matchLabel}
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {bannerPlayers.filter(p => effectiveNextPlaying.has(p.name) && !effectiveLivePlaying.has(p.name)).map(p => (
                    <div key={p.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--text-2)" }}>{p.name}</span>
                        {p.name === activeCap && <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#d4a843" }}>C</span>}
                        {p.name === activeVC && <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-3)" }}>VC</span>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {nextMatchInfoForTeam.length > 1 && nextPlayerMatchLabel.get(p.name) && (
                          <span style={{ fontSize: "0.55rem", color: "var(--text-3)" }}>{nextPlayerMatchLabel.get(p.name)}</span>
                        )}
                        <span style={{ fontSize: "0.62rem", color: IPL_COLORS[p.ipl] || "var(--text-3)", fontWeight: 600 }}>{p.ipl}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {(() => {
          const renderBreakdown = (p: { name: string; raw: number; adj: number; role: string; ipl: string }, onClose?: () => void) => {
            const playerName = p.name;
            const breakdown = playerMatchPoints[playerName] || [];
            const isCap = playerName === activeCap;
            const isVC = playerName === activeVC;
            const inTop11 = isRA ? raScore.top11.has(playerName) : td.top11.has(playerName);
            const raw = p.raw;
            const adj = p.adj;
            const multiplier = isCap ? "× 2 (Captain)" : isVC ? "× 1.5 (VC)" : null;

            // ── Scoring lines builder (shared for RA old+new player rows) ──
            const buildLines = (s: any) => {
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
            };
            const renderBdExpandLines = (lines: ReturnType<typeof buildLines>, diff: number) => (
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
            );

            // ── RA new-player breakdown (early return) ──────────────────────
            const raEx2 = isRA ? raExtras.get(playerName) : undefined;
            if (isRA && raEx2?.isNew) {
              const frozenPts = raEx2.frozenPts ?? 0;
              const liveGain = raEx2.liveGain ?? 0;
              const replacedName = raEx2.replacedName;
              const replacedLastName = replacedName ? replacedName.split(" ").slice(-1)[0] : null;
              const replacedRows = replacedName
                ? (playerMatchPoints[replacedName] || []).filter((e: any) => e.matchNum < RA_FROM_MATCH)
                : [];
              const newPlayerRows = breakdown;
              const hasAnyData = replacedRows.length > 0 || newPlayerRows.length > 0;
              return (
                <div style={{ background: "rgba(8,12,20,0.97)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 14px", marginTop: 1, marginBottom: 1 }}>
                  {/* Header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {isCap && <span style={{ fontSize: "0.5rem", fontWeight: 800, color: "#d4a843", background: "rgba(212,168,67,0.14)", border: "1px solid rgba(212,168,67,0.3)", borderRadius: 5, padding: "1px 5px" }}>C ×2</span>}
                      {isVC && <span style={{ fontSize: "0.5rem", fontWeight: 800, color: "#9e8e7e", background: "rgba(158,142,126,0.12)", border: "1px solid rgba(158,142,126,0.28)", borderRadius: 5, padding: "1px 5px" }}>VC ×1.5</span>}
                      {!inTop11 && <span style={{ fontSize: "0.5rem", color: "var(--text-3)", background: "rgba(255,255,255,0.05)", borderRadius: 4, padding: "1px 5px" }}>bench</span>}
                      <span style={{ fontSize: "0.58rem", color: "var(--text-3)" }}>Re-Auction breakdown</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onClose ? onClose() : setExpandedPlayer(null); }}
                      style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: "0.7rem", padding: "3px 7px", borderRadius: 6, lineHeight: 1 }}>✕</button>
                  </div>

                  {!hasAnyData ? (
                    <div style={{ color: "var(--text-3)", fontSize: "0.72rem", textAlign: "center" as const, padding: "10px 0" }}>No match data yet</div>
                  ) : (
                    <>
                      {/* ── Replaced player rows (M1–M33) ── */}
                      {replacedRows.length === 0 && replacedLastName && (
                        <div style={{ opacity: 0.7, marginBottom: 4 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0" }}>
                            <span style={{ fontSize: "0.5rem", fontWeight: 700, color: "var(--text-3)", background: "rgba(255,255,255,0.06)", borderRadius: 4, padding: "1px 4px", flexShrink: 0 }}>M1–M33</span>
                            <span style={{ fontSize: "0.44rem", fontWeight: 700, color: "rgba(255,100,100,0.7)", background: "rgba(255,100,100,0.08)", borderRadius: 3, padding: "1px 4px", flexShrink: 0 }}>{replacedLastName}</span>
                            <span style={{ fontSize: "0.65rem", color: "var(--text-3)", flex: 1, fontStyle: "italic" as const }}>Did not play</span>
                            <span style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-3)", minWidth: 26, textAlign: "right" as const }}>0</span>
                          </div>
                        </div>
                      )}
                      {replacedRows.map((entry: any, ei: number) => {
                        const s = entry.stats;
                        const bdKey = `OLD-${playerName}-${ei}`;
                        const isEntryOpen = expandedBdMatches.has(bdKey);
                        const toggleEntry = () => setExpandedBdMatches(prev => { const n = new Set(prev); n.has(bdKey) ? n.delete(bdKey) : n.add(bdKey); return n; });
                        const lines = buildLines(s);
                        const computed = lines.reduce((a, l) => a + l.pts, 0);
                        const diff = s ? entry.pts - computed : 0;
                        const isLast = ei === replacedRows.length - 1;
                        return (
                          <div key={bdKey} style={{ opacity: 0.72, marginBottom: isLast ? 0 : 6, paddingBottom: isLast ? 0 : 6, borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.05)" }}>
                            <div onClick={toggleEntry} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", WebkitTapHighlightColor: "transparent", padding: "2px 0" }}>
                              <span style={{ fontSize: "0.5rem", fontWeight: 700, color: "var(--text-3)", background: "rgba(255,255,255,0.06)", borderRadius: 4, padding: "1px 4px", flexShrink: 0 }}>M{entry.matchNum}</span>
                              {replacedLastName && <span style={{ fontSize: "0.44rem", fontWeight: 700, color: "rgba(255,100,100,0.7)", background: "rgba(255,100,100,0.08)", borderRadius: 3, padding: "1px 4px", flexShrink: 0 }}>{replacedLastName}</span>}
                              <span style={{ fontSize: "0.65rem", color: "var(--text-3)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{shortMatchLabel(entry.label)}</span>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: entry.source === "official" ? "#34d399" : "#fbbf24", flexShrink: 0 }} />
                              <span style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-3)", minWidth: 26, textAlign: "right" as const }}>{entry.pts}</span>
                              <svg width="8" height="5" viewBox="0 0 10 6" fill="none" style={{ flexShrink: 0, transition: "transform 0.18s", transform: isEntryOpen ? "rotate(180deg)" : "rotate(0deg)" }}><path d="M1 1l4 4 4-4" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                            {isEntryOpen && (s && lines.length > 0 ? renderBdExpandLines(lines, diff) : (
                              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 1, columnGap: 10, padding: "6px 8px", background: "rgba(255,255,255,0.02)", borderRadius: 7, marginTop: 4 }}>
                                <span style={{ fontSize: "0.6rem", color: "var(--text-3)", gridColumn: "1 / -1" }}>{entry.source === "official" ? "AuctionRoom score · no stat breakdown available" : "No breakdown available"}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })}

                      {/* ── Re-Auction divider ── */}
                      {(replacedRows.length > 0 || !!replacedName) && newPlayerRows.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "8px 0", opacity: 0.8 }}>
                          <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${t.color}60)` }} />
                          <span style={{ fontSize: "0.44rem", fontWeight: 800, letterSpacing: "0.07em", color: t.color, textTransform: "uppercase" as const }}>↩ Re-Auction · M{RA_FROM_MATCH}+</span>
                          <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${t.color}60)` }} />
                        </div>
                      )}

                      {/* ── New player rows ── */}
                      {newPlayerRows.map((entry: any, ei: number) => {
                        const s = entry.stats;
                        const bdKey = `${playerName}-${ei}`;
                        const isEntryOpen = expandedBdMatches.has(bdKey);
                        const toggleEntry = () => setExpandedBdMatches(prev => { const n = new Set(prev); n.has(bdKey) ? n.delete(bdKey) : n.add(bdKey); return n; });
                        const isPost = entry.matchNum >= RA_FROM_MATCH;
                        const lines = buildLines(s);
                        const computed = lines.reduce((a, l) => a + l.pts, 0);
                        const diff = s ? entry.pts - computed : 0;
                        return (
                          <div key={ei} style={{ marginBottom: ei < newPlayerRows.length - 1 ? 6 : 0, paddingBottom: ei < newPlayerRows.length - 1 ? 6 : 0, borderBottom: ei < newPlayerRows.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                            <div onClick={toggleEntry} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", WebkitTapHighlightColor: "transparent", padding: "2px 0" }}>
                              <span style={{ fontSize: "0.5rem", fontWeight: 700, color: isPost ? "#34d399" : "var(--text-3)", background: isPost ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.06)", borderRadius: 4, padding: "1px 4px", flexShrink: 0 }}>
                                {entry.matchNum < 900 ? `M${entry.matchNum}` : "LIVE"}
                              </span>
                              <span style={{ fontSize: "0.65rem", color: "var(--text-2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{shortMatchLabel(entry.label)}</span>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: entry.source === "official" ? "#34d399" : "#fbbf24", flexShrink: 0 }} />
                              <span style={{ fontSize: "0.92rem", fontWeight: 700, color: entry.pts > 4 ? "var(--text)" : "var(--text-3)", minWidth: 26, textAlign: "right" as const }}>{entry.pts}</span>
                              <svg width="8" height="5" viewBox="0 0 10 6" fill="none" style={{ flexShrink: 0, transition: "transform 0.18s", transform: isEntryOpen ? "rotate(180deg)" : "rotate(0deg)" }}><path d="M1 1l4 4 4-4" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </div>
                            {isEntryOpen && (s && lines.length > 0 ? renderBdExpandLines(lines, diff) : (
                              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 1, columnGap: 10, padding: "6px 8px", background: "rgba(255,255,255,0.02)", borderRadius: 7, marginTop: 4 }}>
                                <span style={{ fontSize: "0.6rem", color: "var(--text-3)", gridColumn: "1 / -1" }}>{entry.source === "official" ? "AuctionRoom score · no stat breakdown available" : "No breakdown available"}</span>
                              </div>
                            ))}
                          </div>
                        );
                      })}

                      {/* ── Footer ── */}
                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 10, paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.62rem", color: "var(--text-3)" }}>
                          {frozenPts} frozen{liveGain > 0 ? ` + ${liveGain} live` : ""}
                          {multiplier ? ` · ${multiplier}` : ""}
                        </span>
                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "1rem", fontWeight: 700, color: inTop11 ? t.color : "var(--text-3)" }}>{adj} pts</span>
                      </div>
                    </>
                  )}
                </div>
              );
            }

            return (
              <div style={{
                background: "rgba(8,12,20,0.97)",
                border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12,
                padding: "12px 14px", marginTop: 1, marginBottom: 1,
              }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {isCap && <span style={{ fontSize: "0.5rem", fontWeight: 800, color: "#d4a843", background: "rgba(212,168,67,0.14)", border: "1px solid rgba(212,168,67,0.3)", borderRadius: 5, padding: "1px 5px", letterSpacing: "0.04em" }}>C ×2</span>}
                    {isVC && <span style={{ fontSize: "0.5rem", fontWeight: 800, color: "#9e8e7e", background: "rgba(158,142,126,0.12)", border: "1px solid rgba(158,142,126,0.28)", borderRadius: 5, padding: "1px 5px", letterSpacing: "0.04em" }}>VC ×1.5</span>}
                    {!inTop11 && <span style={{ fontSize: "0.5rem", color: "var(--text-3)", background: "rgba(255,255,255,0.05)", borderRadius: 4, padding: "1px 5px" }}>bench</span>}
                    <span style={{ fontSize: "0.58rem", color: "var(--text-3)" }}>Match breakdown</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onClose ? onClose() : setExpandedPlayer(null); }}
                    style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: "0.7rem", padding: "3px 7px", borderRadius: 6, lineHeight: 1 }}>✕</button>
                </div>

                {breakdown.length === 0 ? (
                  <div style={{ color: "var(--text-3)", fontSize: "0.72rem", textAlign: "center" as const, padding: "10px 0" }}>No match data yet</div>
                ) : (
                  <>
                    {breakdown.map((entry, ei) => {
                      const s = entry.stats;
                      const bdKey = `${playerName}-${ei}`;
                      const isEntryOpen = expandedBdMatches.has(bdKey);
                      const toggleEntry = () => setExpandedBdMatches(prev => {
                        const n = new Set(prev); n.has(bdKey) ? n.delete(bdKey) : n.add(bdKey); return n;
                      });
                      const lines: { label: string; pts: number; color: string }[] = [];
                      if (s) {
                        lines.push({ label: "Playing XI", pts: 4, color: "#64748b" });
                        if (s.runs > 0) lines.push({ label: `${s.runs} runs (${s.balls}b)`, pts: s.runs, color: "#f97316" });
                        if (s.fours > 0) lines.push({ label: `${s.fours} fours`, pts: s.fours * 4, color: "#fb923c" });
                        if (s.sixes > 0) lines.push({ label: `${s.sixes} sixes`, pts: s.sixes * 6, color: "#fbbf24" });
                        if (s.duck) lines.push({ label: "Duck", pts: -2, color: "#ef4444" });
                        const r = s.runs; const b = s.balls;
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
                      }

                      const computed = lines.reduce((a, l) => a + l.pts, 0);
                      const diff = s ? entry.pts - computed : 0;

                      const hasLines = s && lines.length > 0;
                      return (
                        <div key={ei} style={{ marginBottom: ei < breakdown.length - 1 ? 6 : 0, paddingBottom: ei < breakdown.length - 1 ? 6 : 0, borderBottom: ei < breakdown.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                          {/* Match row — always tappable */}
                          <div onClick={toggleEntry}
                            style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", WebkitTapHighlightColor: "transparent", padding: "2px 0" }}>
                            <span style={{ fontSize: "0.5rem", fontWeight: 700, color: "var(--text-3)", background: "rgba(255,255,255,0.06)", borderRadius: 4, padding: "1px 4px", flexShrink: 0 }}>
                              {entry.matchNum < 900 ? `M${entry.matchNum}` : "LIVE"}
                            </span>
                            <span style={{ fontSize: "0.65rem", color: "var(--text-2)", flex: 1 }}>{shortMatchLabel(entry.label)}</span>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: entry.source === "official" ? "#34d399" : "#fbbf24", flexShrink: 0 }} />
                            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.92rem", fontWeight: 700, color: entry.pts > 0 ? "var(--text)" : "var(--text-3)", minWidth: 26, textAlign: "right" as const }}>
                              {entry.pts}
                            </span>
                            <svg width="8" height="5" viewBox="0 0 10 6" fill="none" style={{ flexShrink: 0, transition: "transform 0.18s", transform: isEntryOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                              <path d="M1 1l4 4 4-4" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>

                          {/* Score lines — shown only when expanded */}
                          {isEntryOpen && (
                            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 1, columnGap: 10, padding: "6px 8px", background: "rgba(255,255,255,0.02)", borderRadius: 7, marginTop: 4 }}>
                              {hasLines ? (
                                <>
                                  {lines.map((line, li) => (
                                    <React.Fragment key={li}>
                                      <span style={{ fontSize: "0.6rem", color: "var(--text-3)" }}>{line.label}</span>
                                      <span style={{ fontSize: "0.6rem", fontWeight: 600, color: line.pts >= 0 ? line.color : "#ef4444", textAlign: "right" as const }}>
                                        {line.pts > 0 ? "+" : ""}{line.pts}
                                      </span>
                                    </React.Fragment>
                                  ))}
                                  {Math.abs(diff) > 0 && (
                                    <React.Fragment>
                                      <span style={{ fontSize: "0.6rem", color: "var(--text-3)", fontStyle: "italic" as const }}>other</span>
                                      <span style={{ fontSize: "0.6rem", fontWeight: 600, color: diff >= 0 ? "#a78bfa" : "#ef4444", textAlign: "right" as const }}>{diff > 0 ? "+" : ""}{diff}</span>
                                    </React.Fragment>
                                  )}
                                </>
                              ) : (
                                <>
                                  <span style={{ fontSize: "0.6rem", color: "var(--text-3)", gridColumn: "1 / -1" }}>
                                    {entry.source === "official" ? "AuctionRoom score · no stat breakdown available" : "No breakdown available"}
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Footer */}
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 10, paddingTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.62rem", color: "var(--text-3)" }}>
                        {multiplier ? `${raw} raw · ${multiplier}` : (inTop11 ? "Total" : "Bench — not counted")}
                      </span>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "1rem", fontWeight: 700, color: inTop11 ? t.color : "var(--text-3)" }}>{adj} pts</span>
                    </div>

                    {/* Scoring guide */}
                    <div style={{ marginTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 8 }}>
                      <button onClick={() => setScoringGuideOpen(o => !o)}
                        style={{ display: "flex", alignItems: "center", gap: 5, width: "100%", background: "none", border: "none", cursor: "pointer", padding: 0, WebkitTapHighlightColor: "transparent" }}>
                        <span style={{ fontSize: "0.55rem", color: "var(--text-3)", letterSpacing: "0.06em", textTransform: "uppercase" as const, fontWeight: 600, flex: 1, textAlign: "left" as const }}>Scoring guide</span>
                        <svg width="8" height="5" viewBox="0 0 10 6" fill="none" style={{ flexShrink: 0, transition: "transform 0.18s", transform: scoringGuideOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                          <path d="M1 1l4 4 4-4" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      {scoringGuideOpen && (
                        <div style={{ marginTop: 7, display: "grid", gridTemplateColumns: "1fr auto", rowGap: 3, columnGap: 14 }}>
                          {([
                            ["— BATTING —", ""],
                            ["Playing XI", "+4"], ["Run scored", "+1"], ["Four", "+4"], ["Six", "+6"],
                            ["25+ runs", "+4"], ["50+ runs", "+8"], ["75+ runs", "+12"], ["100+ runs", "+16"],
                            ["Duck", "−2"],
                            ["SR >190", "+8"], ["SR >170", "+6"], ["SR >150", "+4"], ["SR ≥130", "+2"],
                            ["SR 70–100", "−2"], ["SR 60–70", "−4"], ["SR <60", "−6"],
                            ["— BOWLING —", ""],
                            ["Wicket", "+30"], ["LBW/Bowled", "+8"], ["3W haul", "+8"], ["4W haul", "+12"], ["5W haul", "+16"],
                            ["Dot ball", "+2"], ["Maiden", "+12"],
                            ["Eco <5", "+8"], ["Eco <6", "+6"], ["Eco ≤7", "+4"], ["Eco ≤8", "+2"],
                            ["Eco 10–11", "−2"], ["Eco 11–12", "−4"], ["Eco >12", "−6"],
                            ["— FIELDING —", ""],
                            ["Catch", "+8"], ["3+ catches", "+4"], ["Run out", "+10"], ["Stumping", "+12"],
                          ] as [string, string][]).map(([label, val], i) => {
                            const isHeader = val === "";
                            return (
                              <React.Fragment key={i}>
                                <span style={{
                                  fontSize: isHeader ? "0.47rem" : "0.58rem",
                                  color: isHeader ? "var(--gold)" : label.length && val.startsWith("−") ? "#ef4444" : "var(--text-3)",
                                  fontWeight: isHeader ? 700 : 400,
                                  letterSpacing: isHeader ? "0.1em" : "0.02em",
                                  textTransform: isHeader ? "uppercase" as const : "none" as const,
                                  paddingTop: isHeader ? 5 : 0,
                                  gridColumn: isHeader ? "1 / -1" : undefined,
                                }}>{label}</span>
                                {!isHeader && (
                                  <span style={{ fontSize: "0.58rem", fontWeight: 700, textAlign: "right" as const, color: val.startsWith("−") ? "#ef4444" : "#4ade80" }}>{val}</span>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          };

          // Per-player state helper
          const getPlayerState = (name: string, ipl: string) => {
            const isLiveNow = hasLiveNow && effectiveLivePlaying.has(name);
            const isUpcoming = hasNextMatch && effectiveNextPlaying.has(name) && !isLiveNow;
            const isDimmed = hasAnyContext && !isLiveNow && !isUpcoming;
            const glowColor = isLiveNow ? "#f87171" : isUpcoming ? (IPL_COLORS[ipl] || "#4ade80") : null;
            return { isLiveNow, isUpcoming, isDimmed, glowColor };
          };

          const drillData = drillPlayer
            ? (isRA
                ? (() => {
                    const rap = raScore.players.find(p => p.name === drillPlayer);
                    return rap ? { name: rap.name, raw: rap.slotPts, adj: rap.adjPts, role: rap.role, ipl: rap.ipl, price: rap.price } : null;
                  })()
                : td.players.find(p => p.name === drillPlayer) ?? null)
            : null;
          const innerContent = (() => {
            const xi = isRA
              ? raScore.players.filter(p => raScore.top11.has(p.name))
                  .map(p => ({ name: p.name, raw: p.slotPts, adj: p.adjPts, role: p.role, ipl: p.ipl, price: p.price }))
              : td.players.filter(p => td.top11.has(p.name)).sort((a, b) => b.adj - a.adj);
            const bench = isRA
              ? raScore.players.filter(p => !raScore.top11.has(p.name))
                  .map(p => ({ name: p.name, raw: p.slotPts, adj: p.adjPts, role: p.role, ipl: p.ipl, price: p.price }))
              : td.players.filter(p => !td.top11.has(p.name)).sort((a, b) => b.adj - a.adj);
            const xiTotal = xi.reduce((s, p) => s + p.adj, 0);
            const benchTotal = bench.reduce((s, p) => s + p.adj, 0);

            const CaptainBadge = () => (
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 17, height: 17, borderRadius: "50%",
                background: "rgba(212,168,67,0.22)", border: "1px solid rgba(212,168,67,0.55)",
                color: "#d4a843", fontSize: "0.44rem", fontWeight: 900,
                marginLeft: 5, verticalAlign: "middle", flexShrink: 0, letterSpacing: 0,
              }}>C</span>
            );
            const VCBadge = () => (
              <span style={{
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 17, height: 17, borderRadius: "50%",
                background: "rgba(148,148,172,0.18)", border: "1px solid rgba(148,148,172,0.38)",
                color: "#a1a1aa", fontSize: "0.44rem", fontWeight: 900,
                marginLeft: 5, verticalAlign: "middle", flexShrink: 0, letterSpacing: 0,
              }}>VC</span>
            );

            // The "bubble" player — lowest scorer who made it into the XI.
            // Bench players are compared against this threshold.
            const xi11thPts = xi.length >= 11 ? xi[10].adj : xi.length > 0 ? xi[xi.length - 1].adj : null;

            const renderPlayer = (p: typeof xi[0], isBench: boolean) => {
              const isExp = expandedPlayer === p.name;
              const { isLiveNow, isUpcoming, isDimmed } = getPlayerState(p.name, p.ipl);
              const isCap = p.name === activeCap;
              const isVC = p.name === activeVC;
              const raEx = isRA ? raExtras.get(p.name) : undefined;
              const roleColor = ROLE_COLORS[p.role] || "var(--text-3)";
              const cardClass = [
                isBench ? "player-card benched" : "player-card",
                isCap ? "is-c" : isVC ? "is-vc" : "",
                isExp ? "player-expanded" : "",
                isLiveNow ? "live-now" : isUpcoming ? "playing-next" : isDimmed ? "not-playing-next" : ""
              ].filter(Boolean).join(" ");

              const iplColor = IPL_COLORS[p.ipl] || "rgba(255,255,255,0.15)";
              return (
                <React.Fragment key={p.name}>
                  <div className={cardClass} onClick={() => setExpandedPlayer(isExp ? null : p.name)}
                    style={{
                      background: isLiveNow
                        ? `linear-gradient(90deg, rgba(248,113,113,0.06) 0%, transparent 50%)`
                        : isExp
                        ? `linear-gradient(90deg, ${iplColor}0a 0%, transparent 55%)`
                        : `linear-gradient(90deg, ${iplColor}${isBench ? "05" : "08"} 0%, transparent 45%)`,
                      boxShadow: isLiveNow ? "inset 0 0 0 1px rgba(248,113,113,0.08)" : "none",
                      position: "relative",
                    }}>

                    {/* New-player accent bar (RA mode) */}
                    {raEx?.isNew && (
                      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: t.color, borderRadius: "3px 0 0 3px" }} />
                    )}

                    {/* IPL team logo */}
                    <img src={TEAM_LOGO_CDN[p.ipl]} alt={p.ipl} style={{ width: 32, height: 32, objectFit: "contain", flexShrink: 0, opacity: isBench ? 0.45 : 1 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />

                    {/* Name + role + sparkline */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "nowrap" as const }}>
                        <div className="player-name"
                        onClick={(e) => { e.stopPropagation(); setDrillPlayer(p.name); }}
                        style={{
                          color: isLiveNow ? "#fca5a5" : isBench ? "var(--text-3)" : "var(--text)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
                          fontSize: "0.88rem", cursor: "pointer", WebkitTapHighlightColor: "transparent",
                        }}>{p.name}</div>
                        {isCap && <CaptainBadge />}
                        {isVC && <VCBadge />}
                        {raEx?.isNew && (
                          <span style={{ fontSize: "0.42rem", fontWeight: 800, color: "#d4a843", letterSpacing: "0.07em", background: "rgba(212,168,67,0.14)", border: "1px solid rgba(212,168,67,0.35)", borderRadius: 3, padding: "1px 4px", flexShrink: 0, lineHeight: 1 }}>NEW</span>
                        )}
                        {isLiveNow && <span style={{ fontSize: "0.42rem", fontWeight: 800, color: "#f87171", letterSpacing: "0.09em", background: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.28)", borderRadius: 3, padding: "1px 4px", flexShrink: 0, lineHeight: 1 }}>LIVE</span>}
                        {isUpcoming && !isLiveNow && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", flexShrink: 0, display: "inline-block", boxShadow: "0 0 5px #4ade8088" }} />}
                      </div>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, marginTop: 2, lineHeight: 1, flexWrap: "nowrap" as const }}>
                        <span style={{ fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, color: isBench ? "var(--text-3)" : roleColor, flexShrink: 0, lineHeight: 1, verticalAlign: "middle" }}>{p.role}</span>
                        {raEx?.isNew ? (
                          <span style={{ fontSize: "0.46rem", color: "var(--text-3)", fontVariantNumeric: "tabular-nums", flexShrink: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                            {raEx.replacedName && <span style={{ color: "rgba(255,100,100,0.65)", fontStyle: "italic" as const, marginRight: 3 }}>↩ {raEx.replacedName.split(" ").pop()} ·</span>}
                            <span style={{ color: "rgba(255,255,255,0.45)" }}>{raEx.frozenPts}</span>
                            <span style={{ color: "var(--text-3)" }}> frozen</span>
                            {raEx.liveGain > 0
                              ? <span> + <span style={{ color: "rgba(255,255,255,0.45)" }}>{raEx.liveGain}</span> M{RA_FROM_MATCH}+</span>
                              : <span style={{ color: "var(--text-3)" }}> + 0 M{RA_FROM_MATCH}+</span>
                            }
                          </span>
                        ) : (
                          <>
                            {p.price != null && <>
                              <span style={{ fontSize: "0.5rem", fontWeight: 400, color: "rgba(255,255,255,0.2)", lineHeight: 1, verticalAlign: "middle" }}>·</span>
                              <span style={{ fontSize: "0.5rem", fontWeight: 500, color: "var(--text-3)", letterSpacing: "0.01em", flexShrink: 0, lineHeight: 1, verticalAlign: "middle" }}>{p.price}cr</span>
                            </>}
                            <span style={{ marginLeft: 4, display: "flex", alignItems: "flex-end" }}><Sparkline name={p.name} color={isBench ? "rgba(255,255,255,0.18)" : t.color} setSparkTip={setSparkTip} sparkTipTimer={sparkTipTimer} /></span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Points */}
                    <div style={{ textAlign: "right", flexShrink: 0, minWidth: 40 }}>
                      <div style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: isBench ? "1.12rem" : "1.32rem",
                        fontWeight: 700,
                        lineHeight: 1,
                        color: isLiveNow ? "#fca5a5" : isBench ? "var(--text-3)" : p.adj > 0 ? t.color : "rgba(255,255,255,0.2)",
                        textShadow: (!isBench && p.adj > 0) ? `0 0 18px ${t.color}55` : "none",
                      }}>{p.adj}</div>
                      {isCap && <div className="player-pts-raw" style={{ color: "#d4a843" }}>×2</div>}
                      {isVC && <div className="player-pts-raw" style={{ color: "#9e8e7e" }}>×1.5</div>}
                      {raEx?.isNew && !isCap && !isVC && (
                        <div style={{ fontSize: "0.42rem", color: "var(--text-3)", fontWeight: 600, marginTop: 2, lineHeight: 1.3, textAlign: "right" as const, whiteSpace: "nowrap" as const }}>
                          <span style={{ color: "#d4a843" }}>{raEx.frozenPts}</span>
                          {raEx.liveGain > 0 && <span style={{ color: "#4ade80" }}>{`+${raEx.liveGain}`}</span>}
                        </div>
                      )}
                      {isBench && (() => {
                        if (xi11thPts === null) return <div style={{ fontSize: "0.44rem", color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginTop: 2, opacity: 0.5 }}>bench</div>;
                        const gap = Math.round((xi11thPts - p.adj) * 10) / 10;
                        const gapStr = Number.isInteger(gap) ? String(gap) : gap.toFixed(1);
                        const gapColor = "#f87171";
                        return (
                          <div style={{ fontSize: "0.43rem", color: gapColor, fontWeight: 700, letterSpacing: "0.03em", marginTop: 3, lineHeight: 1, whiteSpace: "nowrap" as const }}>
                            {gap > 0 ? `↑${gapStr} to XI` : "≈ #11"}
                          </div>
                        );
                      })()}
                      {!isBench && !isCap && !isVC && p.adj > 0 && (
                        <div style={{ fontSize: "0.44rem", color: t.color, opacity: 0.55, fontWeight: 600, letterSpacing: "0.06em", marginTop: 2 }}>pts</div>
                      )}
                    </div>
                  </div>
                  {isExp && renderBreakdown(p)}
                </React.Fragment>
              );
            };

            return (
              <>
                {/* === SEGMENTED PILL CONTROL === */}
                <div style={{ display: "flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 22, padding: 3, marginBottom: 14, gap: 2 }}>
                  {([
                    ["xi",       "Playing XI", xiTotal > 0 ? `${xiTotal} pts` : ""],
                    ["bench",    "Bench",       benchTotal > 0 ? `${benchTotal} pts` : ""],
                    ["matchpts", "By Match Total", (xiTotal + benchTotal) > 0 ? `${xiTotal + benchTotal} pts` : ""],
                  ] as const).map(([id, label, badge]) => (
                    <button key={id} onClick={() => setTeamSection(id)}
                      style={{
                        flex: 1, padding: "6px 0 7px", borderRadius: 18, border: "none", cursor: "pointer",
                        fontFamily: "inherit", fontSize: "0.68rem", fontWeight: 600,
                        transition: "all 0.18s ease",
                        background: teamSection === id ? "var(--surface-3)" : "transparent",
                        color: teamSection === id ? (id === "xi" ? "#4ade80" : id === "bench" ? "var(--text)" : "var(--gold)") : "var(--text-3)",
                        boxShadow: teamSection === id ? "0 1px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)" : "none",
                        WebkitTapHighlightColor: "transparent",
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
                      }}>
                      <span>{label}</span>
                      {badge ? <span style={{ fontSize: "0.58rem", opacity: 0.7, fontWeight: 500 }}>{badge}</span> : null}
                    </button>
                  ))}
                </div>

                {/* === PLAYING XI === */}
                {teamSection === "xi" && (
                  <div className="players-grid" style={{ borderTop: `2px solid ${t.color}70`, borderRadius: "var(--radius-md)", boxShadow: `0 -3px 14px ${t.color}33` }}>
                    {xi.map(p => renderPlayer(p, false))}
                  </div>
                )}

                {/* === BENCH === */}
                {teamSection === "bench" && (
                  <div className="players-grid" style={{ opacity: 0.82, borderTop: "1.5px solid rgba(255,255,255,0.05)", borderRadius: "var(--radius-md)" }}>
                    {bench.map(p => renderPlayer(p, true))}
                  </div>
                )}

                {/* === POINTS FROM EACH MATCH === */}
                {teamSection === "matchpts" && (() => {
                  const allNums = new Set<number>();
                  const matchLabels: Record<number, string> = {};
                  for (const entries of Object.values(playerMatchPoints)) {
                    for (const e of entries) {
                      if (e.matchNum < 900) {
                        allNums.add(e.matchNum);
                        if (!matchLabels[e.matchNum]) matchLabels[e.matchNum] = e.label;
                      }
                    }
                  }
                  const sortedNums = [...allNums].sort((a, b) => a - b);
                  if (sortedNums.length === 0) return null;

                  const allTeamPlayers = [...xi, ...bench];
                  const getAdj = (name: string, mn: number) => {
                    const isCap = name === activeCap;
                    const isVC = name === activeVC;
                    const e = (playerMatchPoints[name] || []).find((x: any) => x.matchNum === mn);
                    return e ? applyMultiplier(e.pts, isCap, isVC) : 0;
                  };
                  const hasEntry = (name: string, mn: number) =>
                    (playerMatchPoints[name] || []).some((x: any) => x.matchNum === mn);

                  const shortLabel = (label: string) =>
                    label.split(" vs ").map(t => IPL_TEAM_BADGE[t]?.abbr || t.split(" ").map((w: string) => w[0]).join("")).join(" vs ");

                  const matchData = sortedNums.map(mn => {
                    const players = allTeamPlayers
                      .filter(p => hasEntry(p.name, mn))
                      .map(p => ({
                        ...p, isCap: p.name === activeCap, isVC: p.name === activeVC,
                        pts: getAdj(p.name, mn),
                      })).sort((a, b) => b.pts - a.pts);
                    const total = players.reduce((s, p) => s + p.pts, 0);
                    return { mn, label: matchLabels[mn] || `Match ${mn}`, players, total };
                  });

                  const grandTotal = matchData.reduce((s, m) => s + m.total, 0);

                  return (
                    <div>
                      <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                          {matchData.map(({ mn, label, players, total }) => {
                            const short = shortLabel(label);
                            const isExpanded = expandedMatchNums.has(mn);
                            const toggleMn = () => setExpandedMatchNums(prev => {
                              const n = new Set(prev); n.has(mn) ? n.delete(mn) : n.add(mn); return n;
                            });
                            const [teamA, teamB] = short.split(" vs ");
                            const colorA = IPL_COLORS[teamA] || "rgba(255,255,255,0.15)";
                            const colorB = IPL_COLORS[teamB] || "rgba(255,255,255,0.15)";
                            return (
                              <div key={mn} style={{ borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden" as const, background: `linear-gradient(90deg, ${colorA}08 0%, transparent 40%, ${colorB}08 100%)` }}>
                                <button onClick={toggleMn} style={{ display: "flex", alignItems: "center", width: "100%", background: "transparent", border: "none", cursor: "pointer", padding: "10px 12px", gap: 10, WebkitTapHighlightColor: "transparent", minHeight: 52 }}>
                                  {/* Match badge */}
                                  <span style={{ fontSize: "0.5rem", fontWeight: 700, color: "var(--text-3)", background: "rgba(255,255,255,0.06)", borderRadius: 5, padding: "2px 6px", flexShrink: 0, lineHeight: 1.5 }}>M{mn}</span>
                                  {/* Team logos + names */}
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                                      <img src={TEAM_LOGO_CDN[teamA]} alt={teamA} style={{ width: 26, height: 26, objectFit: "contain" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.82rem", fontWeight: 600, letterSpacing: "0.04em", color: "var(--text)", width: 38 }}>{teamA}</span>
                                    </div>
                                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.56rem", color: "var(--text-3)", letterSpacing: "0.1em", flexShrink: 0 }}>VS</span>
                                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                                      <img src={TEAM_LOGO_CDN[teamB]} alt={teamB} style={{ width: 26, height: 26, objectFit: "contain" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.82rem", fontWeight: 600, letterSpacing: "0.04em", color: "var(--text)", width: 38 }}>{teamB}</span>
                                    </div>
                                  </div>
                                  {/* Total + chevron */}
                                  <div style={{ display: "flex", flexDirection: "column" as const, alignItems: "flex-end", flexShrink: 0 }}>
                                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "1.28rem", fontWeight: 700, lineHeight: 1, color: total >= 120 ? "#d4a843" : "var(--text)", textShadow: total >= 120 ? "0 0 16px #d4a84355" : "none" }}>{total}</span>
                                    <span style={{ fontSize: "0.44rem", color: "var(--text-3)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, marginTop: 2 }}>pts</span>
                                  </div>
                                  <svg width="7" height="5" viewBox="0 0 10 6" fill="none" style={{ transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0, marginLeft: 2 }}>
                                    <path d="M1 1l4 4 4-4" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </button>
                                {isExpanded && (
                                  <div style={{ borderTop: "1px solid var(--border)", padding: "6px 12px 10px" }}>
                                    {players.map((p, i) => {
                                      const pIplColor = IPL_COLORS[p.ipl] || "rgba(255,255,255,0.15)";
                                      return (
                                        <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 0", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                                          {/* IPL badge */}
                                          <span style={{ fontSize: "0.44rem", fontWeight: 900, color: pIplColor, background: pIplColor + "18", border: `1px solid ${pIplColor}33`, borderRadius: 4, padding: "1px 4px", flexShrink: 0, letterSpacing: "0.02em" }}>{p.ipl}</span>
                                          <span style={{ fontSize: "0.72rem", flex: 1, color: p.pts === 0 ? "var(--text-3)" : "var(--text)", fontWeight: p.pts !== 0 ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                                            {p.name}
                                          </span>
                                          {p.isCap && <span style={{ fontSize: "0.44rem", fontWeight: 900, color: "#d4a843", background: "rgba(212,168,67,0.18)", border: "1px solid rgba(212,168,67,0.4)", borderRadius: 3, padding: "0 3px", lineHeight: 1.4, flexShrink: 0 }}>C</span>}
                                          {p.isVC && <span style={{ fontSize: "0.44rem", fontWeight: 900, color: "#94a3b8", background: "rgba(148,163,184,0.12)", border: "1px solid rgba(148,163,184,0.3)", borderRadius: 3, padding: "0 3px", lineHeight: 1.4, flexShrink: 0 }}>VC</span>}
                                          {p.isCap && <span style={{ fontSize: "0.44rem", fontWeight: 700, color: "#d4a843", opacity: 0.8, flexShrink: 0 }}>2×</span>}
                                          {p.isVC && <span style={{ fontSize: "0.44rem", fontWeight: 700, color: "#94a3b8", opacity: 0.8, flexShrink: 0 }}>1.5×</span>}
                                          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.9rem", fontWeight: 700, minWidth: 28, textAlign: "right" as const, color: p.pts === 0 ? "var(--text-3)" : p.pts >= 60 ? "#d4a843" : p.pts >= 40 ? "#fb923c" : "#4ade80" }}>
                                            {p.pts === 0 ? "—" : "+" + p.pts}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                    </div>
                  );
                })()}
              </>
            );
          })();
          return (
            <>
              {drillData && (
                <div
                  onClick={() => setDrillPlayer(null)}
                  style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.62)", display: "flex", alignItems: "flex-end", WebkitTapHighlightColor: "transparent" }}
                >
                  <div
                    onClick={e => e.stopPropagation()}
                    style={{ width: "100%", maxHeight: "85vh", overflowY: "auto" as const, background: "var(--surface)", borderRadius: "20px 20px 0 0", paddingBottom: "env(safe-area-inset-bottom, 16px)" }}
                  >
                    {/* Drag handle */}
                    <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
                      <div style={{ width: 38, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.12)" }} />
                    </div>
                    {/* Player header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 16px 10px" }}>
                      <img src={TEAM_LOGO_CDN[drillData.ipl]} alt={drillData.ipl}
                        style={{ width: 36, height: 36, objectFit: "contain", flexShrink: 0 }}
                        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      <div>
                        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.01em" }}>{drillData.name}</div>
                        <div style={{ display: "flex", gap: 5, alignItems: "center", marginTop: 3 }}>
                          <span style={{ fontSize: "0.52rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.07em", color: ROLE_COLORS[drillData.role] || "var(--text-3)" }}>{drillData.role}</span>
                          <span style={{ fontSize: "0.52rem", color: "rgba(255,255,255,0.18)" }}>·</span>
                          <span style={{ fontSize: "0.52rem", fontWeight: 600, color: IPL_COLORS[drillData.ipl] || "var(--text-3)" }}>{drillData.ipl}</span>
                          {drillData.price != null && <>
                            <span style={{ fontSize: "0.52rem", color: "rgba(255,255,255,0.18)" }}>·</span>
                            <span style={{ fontSize: "0.52rem", color: "var(--text-3)", fontWeight: 500 }}>{drillData.price}cr</span>
                          </>}
                        </div>
                      </div>
                    </div>
                    {/* Breakdown */}
                    <div style={{ padding: "0 12px 16px" }}>
                      {renderBreakdown(drillData, () => setDrillPlayer(null))}
                    </div>
                  </div>
                </div>
              )}
              {innerContent}
            </>
          );
        })()}
      </div>
    );
}
