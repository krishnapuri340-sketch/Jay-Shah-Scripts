import React, { useState } from "react";
import { FANTASY_TEAMS } from "./teams";
import { IPL_COLORS, ROLE_ICONS } from "./constants";

function LineupPreviewCard({ data, matchIndex = 0, totalMatches = 1 }: {
  data: {
    match: any;
    playingTeams: string[];
    preview: { team: typeof FANTASY_TEAMS[string]; activePlayers: { name: string; role: string; ipl: string }[] }[];
  };
  matchIndex?: number;
  totalMatches?: number;
}) {
  const [open, setOpen] = useState(false);
  const { match, playingTeams, preview } = data;
  const teamInfo: any[] = match.teamInfo || [];
  const matchLabel = teamInfo.length >= 2
    ? `${teamInfo[0]?.shortname || ""} vs ${teamInfo[1]?.shortname || ""}`
    : match.name;
  const isDoubleHeader = totalMatches > 1;

  return (
    <div className="lineup-preview-card">
      <div className="lineup-preview-header" onClick={() => setOpen(o => !o)}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: "1.2rem" }}>🔮</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ fontFamily: "'Oswald',sans-serif", fontSize: "1rem", letterSpacing: "1.5px", color: "#dfb23e" }}>
                {isDoubleHeader ? `MATCH ${matchIndex + 1} LINEUP` : "NEXT MATCH LINEUP"}
              </div>
              {isDoubleHeader && (
                <span style={{ fontSize: "0.55rem", fontWeight: 700, padding: "1px 6px", borderRadius: 20, background: "rgba(223,178,62,0.15)", border: "1px solid rgba(223,178,62,0.3)", color: "#dfb23e", letterSpacing: "0.5px" }}>
                  DOUBLE HEADER
                </span>
              )}
            </div>
            <div style={{ fontSize: "0.62rem", color: "#64748b", marginTop: 1 }}>{matchLabel}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
          {playingTeams.filter(t => IPL_COLORS[t]).map(t => (
            <span key={t} style={{
              fontSize: "0.6rem", fontWeight: 700, padding: "2px 7px",
              borderRadius: 4, background: (IPL_COLORS[t]) + "22",
              border: `1px solid ${IPL_COLORS[t]}55`,
              color: IPL_COLORS[t], letterSpacing: "0.5px"
            }}>{t}</span>
          ))}
          <span style={{ fontSize: "0.75rem", color: "#475569", marginLeft: 2 }}>{open ? "▲" : "▼"}</span>
        </div>
      </div>
      {open && (
        <div className="lineup-preview-body">
          {preview.length === 0 ? (
            <div style={{ color: "#475569", fontSize: "0.78rem", padding: "8px 0" }}>
              No fantasy players in this match.
            </div>
          ) : preview.map(({ team, activePlayers }) => (
            <div key={team.id} className="lineup-team-row">
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: "1.05rem" }}>{team.emoji}</span>
                <span style={{ fontWeight: 700, fontSize: "0.8rem", color: "#e2e8f0" }}>{team.name}</span>
                <span style={{ fontSize: "0.6rem", color: "#64748b" }}>by {team.owner}</span>
                <span style={{
                  marginLeft: "auto", fontSize: "0.6rem", fontWeight: 700,
                  padding: "1px 8px", borderRadius: 10,
                  background: team.color + "20", border: `1px solid ${team.color}44`,
                  color: team.color, flexShrink: 0
                }}>{activePlayers.length} active</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {activePlayers.map(p => {
                  const isCap = p.name === team.captain;
                  const isVC = p.name === team.vc;
                  return (
                    <div key={p.name} style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "5px 9px", borderRadius: 8,
                      background: (IPL_COLORS[p.ipl] || "#334155") + "15",
                      border: `1px solid ${IPL_COLORS[p.ipl] || "#334155"}30`,
                    }}>
                      <span style={{ fontSize: "0.7rem" }}>{ROLE_ICONS[p.role]}</span>
                      <span style={{ fontSize: "0.74rem", fontWeight: 600, color: "#e2e8f0" }}>{p.name}</span>
                      {isCap && <span style={{ fontSize: "0.56rem", fontWeight: 800, color: "#d4a017", background: "rgba(212,160,23,0.18)", borderRadius: 4, padding: "1px 4px", lineHeight: 1.2 }}>C</span>}
                      {isVC && <span style={{ fontSize: "0.56rem", fontWeight: 800, color: "#94a3b8", background: "rgba(148,163,184,0.12)", borderRadius: 4, padding: "1px 4px", lineHeight: 1.2 }}>VC</span>}
                      <span style={{ fontSize: "0.6rem", color: IPL_COLORS[p.ipl] || "#64748b", fontWeight: 700 }}>{p.ipl}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LineupPreviewCard;
