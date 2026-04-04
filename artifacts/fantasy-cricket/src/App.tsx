import React, { useState, useEffect, useRef, useMemo } from "react";
import { FANTASY_TEAMS } from "./teams";
import { applyMultiplier, getTeamData } from "./utils";
import { IPL_COLORS, IPL_FULL_NAMES, ROLE_ICONS, ROLE_COLORS, IPL_TEAM_BADGE, SWIPEABLE_TABS, IPL_HISTORY } from "./constants";
import LineupPreviewCard from "./LineupPreviewCard";

// Wikipedia SVG-rendered transparent logos (clean crest, no circular badge frame)
const TEAM_LOGO_CDN: Record<string, string> = {
  CSK:  "https://upload.wikimedia.org/wikipedia/en/thumb/2/2b/Chennai_Super_Kings_Logo.svg/330px-Chennai_Super_Kings_Logo.svg.png",
  MI:   "https://upload.wikimedia.org/wikipedia/en/thumb/c/cd/Mumbai_Indians_Logo.svg/330px-Mumbai_Indians_Logo.svg.png",
  KKR:  "https://upload.wikimedia.org/wikipedia/en/thumb/4/4c/Kolkata_Knight_Riders_Logo.svg/330px-Kolkata_Knight_Riders_Logo.svg.png",
  RCB:  "https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/Royal_Challengers_Bengaluru_Logo.svg/330px-Royal_Challengers_Bengaluru_Logo.svg.png",
  RR:   "https://upload.wikimedia.org/wikipedia/en/thumb/5/5c/This_is_the_logo_for_Rajasthan_Royals%2C_a_cricket_team_playing_in_the_Indian_Premier_League_%28IPL%29.svg/330px-This_is_the_logo_for_Rajasthan_Royals%2C_a_cricket_team_playing_in_the_Indian_Premier_League_%28IPL%29.svg.png",
  SRH:  "https://upload.wikimedia.org/wikipedia/en/thumb/5/51/Sunrisers_Hyderabad_Logo.svg/330px-Sunrisers_Hyderabad_Logo.svg.png",
  DC:   "https://upload.wikimedia.org/wikipedia/en/thumb/2/2f/Delhi_Capitals.svg/330px-Delhi_Capitals.svg.png",
  PBKS: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/Punjab_Kings_Logo.svg/330px-Punjab_Kings_Logo.svg.png",
  GT:   "https://upload.wikimedia.org/wikipedia/en/thumb/0/09/Gujarat_Titans_Logo.svg/330px-Gujarat_Titans_Logo.svg.png",
  LSG:  "https://upload.wikimedia.org/wikipedia/en/thumb/3/34/Lucknow_Super_Giants_Logo.svg/330px-Lucknow_Super_Giants_Logo.svg.png",
  // Retired teams
  DCH:  "https://upload.wikimedia.org/wikipedia/en/a/a6/HyderabadDeccanChargers.png",
  DD:   "https://scores.iplt20.com/ipl/teamlogos/DD.png",
  RPS:  "https://upload.wikimedia.org/wikipedia/en/9/9a/Rising_Pune_Supergiant.png",
  GL:   "https://upload.wikimedia.org/wikipedia/en/c/c4/Gujarat_Lions.png",
  PWI:  "https://upload.wikimedia.org/wikipedia/en/thumb/4/4a/Pune_Warriors_India_IPL_Logo.png/330px-Pune_Warriors_India_IPL_Logo.png",
  KTK:  "https://upload.wikimedia.org/wikipedia/en/thumb/9/96/Kochi_Tuskers_Kerala_Logo.svg/330px-Kochi_Tuskers_Kerala_Logo.svg.png",
  KXIP: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/Punjab_Kings_Logo.svg/330px-Punjab_Kings_Logo.svg.png",
};
// Abbreviation → team name (for top-10 rows)
const ABBR_TO_TEAM: Record<string, string> = {
  RR:"Rajasthan Royals", CSK:"Chennai Super Kings", DCH:"Deccan Chargers",
  KKR:"Kolkata Knight Riders", MI:"Mumbai Indians", SRH:"Sunrisers Hyderabad",
  RCB:"Royal Challengers Bengaluru", RPS:"Rising Pune Supergiant", GT:"Gujarat Titans",
  DC:"Delhi Capitals", DD:"Delhi Daredevils", PBKS:"Punjab Kings", KXIP:"Kings XI Punjab",
  LSG:"Lucknow Super Giants", PWI:"Pune Warriors", GL:"Gujarat Lions",
};
const IPL_H2H: Record<string, [number, number]> = {
  "CSK-DC":[16,9],"CSK-GT":[3,4],"CSK-KKR":[18,11],"CSK-LSG":[5,4],"CSK-MI":[14,19],
  "CSK-PBKS":[19,11],"CSK-RCB":[18,13],"CSK-RR":[15,10],"CSK-SRH":[14,10],
  "DC-GT":[3,5],"DC-KKR":[11,14],"DC-LSG":[5,5],"DC-MI":[12,16],
  "DC-PBKS":[15,11],"DC-RCB":[10,15],"DC-RR":[10,14],"DC-SRH":[10,13],
  "GT-KKR":[4,4],"GT-LSG":[5,5],"GT-MI":[5,3],"GT-PBKS":[4,3],
  "GT-RCB":[5,3],"GT-RR":[5,3],"GT-SRH":[5,3],
  "KKR-LSG":[5,3],"KKR-MI":[13,17],"KKR-PBKS":[16,10],"KKR-RCB":[16,14],
  "KKR-RR":[15,11],"KKR-SRH":[14,11],
  "LSG-MI":[5,4],"LSG-PBKS":[4,5],"LSG-RCB":[4,4],"LSG-RR":[4,4],"LSG-SRH":[4,4],
  "MI-PBKS":[17,11],"MI-RCB":[19,14],"MI-RR":[16,10],"MI-SRH":[10,10],
  "PBKS-RCB":[11,17],"PBKS-RR":[14,17],"PBKS-SRH":[10,13],
  "RCB-RR":[15,10],"RCB-SRH":[14,13],"RR-SRH":[11,13],
};
function getH2H(a: string, b: string): { aWins: number; bWins: number } | null {
  const sorted = [a, b].sort();
  const data = IPL_H2H[sorted.join("-")];
  if (!data) return null;
  return sorted[0] === a ? { aWins: data[0], bWins: data[1] } : { aWins: data[1], bWins: data[0] };
}
const VENUE_AVG: Record<string, { avg: number; high: number; note: string }> = {
  "ACA Stadium":                                                     { avg: 168, high: 205, note: "Flat deck, batters love it" },
  "Arun Jaitley Stadium":                                            { avg: 170, high: 220, note: "Good carry, pace-friendly" },
  "Bharat Ratna Shri Atal Bihari Vajpayee Ekana Cricket Stadium":   { avg: 167, high: 200, note: "Grips late, tough to dominate" },
  "Eden Gardens":                                                    { avg: 169, high: 227, note: "Bounce & carry, pacers thrive" },
  "Himachal Pradesh Cricket Association Stadium":                    { avg: 160, high: 198, note: "Altitude swing, low-scoring" },
  "M Chinnaswamy Stadium":                                           { avg: 192, high: 263, note: "Tiny ground, batting paradise" },
  "MA Chidambaram Stadium":                                          { avg: 158, high: 213, note: "Slow turner, spinners dominate" },
  "Narendra Modi Stadium":                                           { avg: 175, high: 228, note: "True surface, big hits carry" },
  "New International Cricket Stadium":                               { avg: 164, high: 190, note: "New venue, balanced" },
  "Rajiv Gandhi International Stadium":                              { avg: 172, high: 210, note: "Good batting surface" },
  "Sawai Mansingh Stadium":                                          { avg: 163, high: 215, note: "Grips, spin effective" },
  "Shaheed Veer Narayan Singh International Cricket Stadium":        { avg: 162, high: 195, note: "Bowler-friendly, grip & turn" },
  "Wankhede Stadium":                                                { avg: 183, high: 240, note: "Compact ground, explosive scoring" },
};

const TEAM_BATTING: Record<string, number> = {
  SRH: 8.8, RCB: 8.5, MI: 8.3, KKR: 8.1, RR: 8.0,
  GT: 7.8, DC: 7.6, CSK: 7.5, PBKS: 7.3, LSG: 7.2
};
const TEAM_BOWLING: Record<string, number> = {
  MI: 8.5, SRH: 8.0, KKR: 7.9, PBKS: 7.8, DC: 7.6,
  CSK: 7.5, GT: 7.5, RR: 7.2, LSG: 7.0, RCB: 6.8
};
const _LEAGUE_BAT = 7.8;
const _LEAGUE_BOWL = 7.6;

function predictFirstInningsTotal(homeCode: string, awayCode: string, venueAvg: number): number {
  const hBat = TEAM_BATTING[homeCode] ?? _LEAGUE_BAT;
  const aBat = TEAM_BATTING[awayCode] ?? _LEAGUE_BAT;
  const hBowl = TEAM_BOWLING[homeCode] ?? _LEAGUE_BOWL;
  const aBowl = TEAM_BOWLING[awayCode] ?? _LEAGUE_BOWL;
  const avgBat = (hBat + aBat) / 2;
  const avgBowl = (hBowl + aBowl) / 2;
  const batFactor = (avgBat - _LEAGUE_BAT) / _LEAGUE_BAT;
  const bowlFactor = (avgBowl - _LEAGUE_BOWL) / _LEAGUE_BOWL;
  const net = batFactor - bowlFactor * 0.65;
  return Math.round(venueAvg * (1 + net));
}

function predictNextMatch(homeCode: string, awayCode: string): { pick: string | null; reason: string; homeW: number; awayW: number } {
  const h2h = getH2H(homeCode, awayCode);
  let homeScore = 1.0, awayScore = 0.0;

  if (h2h) {
    const diff = h2h.aWins - h2h.bWins;
    if (diff > 0) homeScore += Math.min(diff * 0.18, 2.2);
    else awayScore += Math.min(Math.abs(diff) * 0.18, 2.2);
  }

  const homeBat = TEAM_BATTING[homeCode] ?? _LEAGUE_BAT;
  const homeBowl = TEAM_BOWLING[homeCode] ?? _LEAGUE_BOWL;
  const awayBat = TEAM_BATTING[awayCode] ?? _LEAGUE_BAT;
  const awayBowl = TEAM_BOWLING[awayCode] ?? _LEAGUE_BOWL;
  const homeStr = homeBat + homeBowl;
  const awayStr = awayBat + awayBowl;
  const squadDiff = homeStr - awayStr;
  if (squadDiff > 0) homeScore += Math.min(squadDiff * 0.28, 1.6);
  else awayScore += Math.min(Math.abs(squadDiff) * 0.28, 1.6);

  const edge = homeScore - awayScore;
  if (Math.abs(edge) < 0.4) return { pick: null, reason: "Too close to call", homeW: homeScore, awayW: awayScore };

  const pick = edge > 0 ? homeCode : awayCode;
  const isHome = pick === homeCode;
  const h2hLeads = h2h ? (isHome ? h2h.aWins > h2h.bWins : h2h.bWins > h2h.aWins) : false;
  const pickedStr = isHome ? homeStr : awayStr;
  const oppStr = isHome ? awayStr : homeStr;
  const squadEdge = pickedStr - oppStr;

  let reason: string;
  if (squadEdge > 1.8 && h2hLeads) reason = "Stronger squad + H2H dominance";
  else if (squadEdge > 1.8) reason = "Clear squad quality edge";
  else if (squadEdge > 0.8 && h2hLeads) reason = "H2H edge + stronger squad";
  else if (squadEdge > 0.8) reason = "Better batting & bowling lineup";
  else if (h2hLeads && Math.abs(edge) > 1.2) reason = "Strong H2H edge";
  else if (h2hLeads) reason = "H2H + home advantage";
  else if (squadEdge > 0) reason = "Slight squad advantage";
  else reason = "Home advantage";

  return { pick, reason, homeW: homeScore, awayW: awayScore };
}

function getMatchWinner(m: any): string | null {
  if (!m.matchEnded || !m.status) return null;
  const s = m.status.toLowerCase();
  if (s.includes("no result") || s.includes("abandoned")) return null;
  if (s.includes("tied") || s.includes(" tie")) return "tie";
  const wonIdx = s.indexOf(" won ");
  if (wonIdx === -1) return null;
  const before = s.slice(0, wonIdx);
  if (m.teamInfo) {
    for (const ti of m.teamInfo) {
      if (ti.name && before.includes(ti.name.toLowerCase())) return ti.shortname;
    }
  }
  const codeNames: Record<string, string[]> = {
    MI: ["mumbai indians"], KKR: ["kolkata knight riders"],
    RCB: ["royal challengers bengaluru", "royal challengers bangalore"],
    CSK: ["chennai super kings"], SRH: ["sunrisers hyderabad"],
    RR: ["rajasthan royals"], PBKS: ["punjab kings", "kings xi punjab"],
    GT: ["gujarat titans"], LSG: ["lucknow super giants"], DC: ["delhi capitals"],
  };
  for (const [code, names] of Object.entries(codeNames)) {
    if (names.some(n => before.includes(n))) return code;
  }
  return null;
}

function TeamBadge({ name, size = 32 }: { name: string; size?: number }) {
  const b = IPL_TEAM_BADGE[name] || IPL_TEAM_BADGE[ABBR_TO_TEAM[name]] || { abbr: name.slice(0,2).toUpperCase(), bg:"#444", fg:"#fff" };
  const logoUrl = TEAM_LOGO_CDN[b.abbr];
  const fs = b.abbr.length >= 4 ? size * 0.27 : b.abbr.length === 3 ? size * 0.3 : size * 0.35;
  const [imgFailed, setImgFailed] = useState(false);
  const showLogo = logoUrl && !imgFailed;
  return (
    <div style={{ width:size, height:size, borderRadius:"50%",
      background: showLogo ? "transparent" : b.bg,
      display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
      border: showLogo ? "none" : "1.5px solid rgba(255,255,255,0.12)",
      overflow:"hidden", position:"relative" }}>
      {logoUrl && !imgFailed ? (
        <img src={logoUrl} alt={b.abbr}
          style={{ width: size, height: size, objectFit:"contain" }}
          onError={() => setImgFailed(true)} />
      ) : (
        <span style={{ color:b.fg, fontSize:fs, fontWeight:800, letterSpacing:"-0.3px", lineHeight:1 }}>{b.abbr}</span>
      )}
    </div>
  );
}

// ─── PIN login ───────────────────────────────────────────────────────────────
const DEFAULT_PINS: Record<string, string> = { rajveer: "1111", mombasa: "2222", mumbai: "3333", ponygoat: "4444" };
function loadPins(): Record<string, string> {
  try { return { ...DEFAULT_PINS, ...JSON.parse(localStorage.getItem("ipl-pins-2026") || "{}") }; } catch { return { ...DEFAULT_PINS }; }
}
function savePins(p: Record<string, string>) { localStorage.setItem("ipl-pins-2026", JSON.stringify(p)); }

function LoginScreen({ onValidate }: { onValidate: (userId: string, pin: string) => Promise<boolean> }) {
  const [sel, setSel] = useState<string | null>(null);
  const [entered, setEntered] = useState("");
  const [shake, setShake] = useState(false);
  const [wrong, setWrong] = useState(false);
  const [checking, setChecking] = useState(false);

  const digit = async (d: string) => {
    if (entered.length >= 4 || checking) return;
    const next = entered + d;
    setEntered(next);
    if (next.length === 4) {
      setChecking(true);
      const ok = await onValidate(sel!, next);
      setChecking(false);
      if (!ok) {
        setShake(true); setWrong(true);
        setTimeout(() => { setShake(false); setEntered(""); setWrong(false); }, 700);
      }
    }
  };
  const back = () => { if (!checking) setEntered(e => e.slice(0, -1)); };

  // ── Cinematic background — image flipped so sky sits at bottom ───────────
  const BASE = import.meta.env.BASE_URL;
  const cinematicBg: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 1000, overflow: "hidden",
  };
  // Inlined bg JSX (not a component — avoids remount/flicker on state changes)
  const bgImg: React.CSSProperties = {
    position: "absolute", left: 0, right: 0,
    top: "12%", height: "100%", width: "100%",
    objectFit: "cover", objectPosition: "center top",
    transform: "scaleY(-1)", pointerEvents: "none", userSelect: "none",
    filter: "blur(14px) brightness(0.62) saturate(1.1)",
  };
  const bgOverlay: React.CSSProperties = {
    position: "absolute", inset: 0, pointerEvents: "none",
    background: `
      radial-gradient(ellipse 80% 40% at 50% 0%, rgba(245,155,25,0.08) 0%, transparent 55%),
      linear-gradient(to bottom,
        rgba(4,2,1,0.97) 0%,
        rgba(4,2,1,0.82) 15%,
        rgba(4,2,1,0.55) 30%,
        rgba(4,2,1,0.28) 48%,
        rgba(4,2,1,0.10) 65%,
        rgba(4,2,1,0.08) 80%,
        rgba(4,2,1,0.32) 100%
      )
    `,
  };

  if (sel) {
    const ft = FANTASY_TEAMS[sel];
    return (
      <div style={{ ...cinematicBg, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center" }}>
        <img src={`${BASE}login-bg.jpeg`} alt="" style={bgImg} />
        <div style={bgOverlay} />
        <style>{`
          @keyframes login-fade-up { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
          @keyframes pin-shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }
          .pin-dot-fill { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
          .pin-dot-fill.filled { transform: scale(1.15); }
          .num-key { transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1); }
          .num-key:active { transform: scale(0.88) translateY(2px); }
        `}</style>

        <button onClick={() => { setSel(null); setEntered(""); setWrong(false); }}
          style={{ position: "absolute", top: 22, left: 20, zIndex: 2, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 12, padding: "7px 16px", color: "#d0c0b0", fontSize: "0.72rem", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5, backdropFilter: "blur(24px) saturate(1.4)", WebkitBackdropFilter: "blur(24px) saturate(1.4)" }}>
          ← Back
        </button>

        <div style={{ position: "relative", zIndex: 2, animation: "login-fade-up 0.38s ease-out", display: "flex", flexDirection: "column" as const, alignItems: "center" }}>
          {/* Avatar with warm glow ring */}
          <div style={{ position: "relative", marginBottom: 20 }}>
            <div style={{ position: "absolute", inset: -10, borderRadius: "50%", background: `radial-gradient(circle, ${ft.color}40 0%, transparent 70%)`, filter: "blur(14px)" }} />
            <div style={{ width: 90, height: 90, borderRadius: "50%", border: `2px solid rgba(255,255,255,0.22)`, overflow: "hidden", boxShadow: `0 0 0 5px rgba(255,255,255,0.06), 0 10px 40px rgba(0,0,0,0.5)`, position: "relative" as const, backdropFilter: "blur(4px)" }}>
              <img src={`${import.meta.env.BASE_URL}avatars/${ft.avatar}`} alt={ft.owner} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center center", display: "block" }} />
            </div>
          </div>

          <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: 4, textShadow: "0 2px 8px rgba(0,0,0,1), 0 4px 24px rgba(0,0,0,0.95)" }}>{ft.owner}</div>
          <div style={{ fontSize: "0.65rem", color: ft.color, letterSpacing: "0.08em", fontWeight: 700, marginBottom: 2, textShadow: "0 1px 6px rgba(0,0,0,0.95), 0 2px 12px rgba(0,0,0,0.8)" }}>{ft.name}</div>
          <div style={{ fontSize: "0.56rem", color: "rgba(255,255,255,0.8)", letterSpacing: "0.2em", marginBottom: 40, fontWeight: 700, textTransform: "uppercase" as const, textShadow: "0 1px 6px rgba(0,0,0,1)" }}>Enter your PIN</div>

          {/* PIN dots */}
          <div className={shake ? "pin-dot-shake" : ""} style={{ display: "flex", gap: 20, marginBottom: wrong ? 10 : 44, animation: shake ? "pin-shake 0.55s ease" : "none" }}>
            {[0,1,2,3].map(i => (
              <div key={i} className={`pin-dot-fill ${i < entered.length ? "filled" : ""}`} style={{
                width: 16, height: 16, borderRadius: "50%",
                background: i < entered.length ? ft.color : "transparent",
                border: `2px solid ${i < entered.length ? ft.color : "rgba(255,255,255,0.25)"}`,
                boxShadow: i < entered.length ? `0 0 14px ${ft.color}70` : "none",
              }} />
            ))}
          </div>

          {wrong && <div style={{ fontSize: "0.65rem", color: "#ff8888", marginBottom: 18, letterSpacing: "0.04em", fontWeight: 600, textShadow: "0 1px 8px rgba(0,0,0,0.6)" }}>✕ Wrong PIN — try again</div>}
          {checking && <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.4)", marginBottom: 12, letterSpacing: "0.06em" }}>Checking…</div>}

          {/* Numpad — frosted glass keys */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 76px)", gap: 11, width: "fit-content", opacity: checking ? 0.4 : 1, pointerEvents: checking ? "none" : "auto" }}>
            {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k, i) => (
              k === "" ? <div key={i} /> :
              <button key={i} className="num-key" onClick={() => k === "⌫" ? back() : digit(k)} style={{
                background: k === "⌫"
                  ? "rgba(255,80,80,0.13)"
                  : `linear-gradient(170deg, ${ft.color}09 0%, rgba(255,255,255,0.08) 100%)`,
                border: `1px solid ${k === "⌫" ? "rgba(255,100,100,0.28)" : `${ft.color}28`}`,
                borderRadius: 22, width: 76, height: 76,
                fontSize: k === "⌫" ? "1.25rem" : "1.7rem", fontWeight: 300,
                color: k === "⌫" ? "#ff8888" : "#fff",
                cursor: "pointer", fontFamily: "'Oswald', sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center",
                backdropFilter: "blur(32px) saturate(1.9)",
                WebkitBackdropFilter: "blur(32px) saturate(1.9)",
                boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.16), 0 5px 22px rgba(0,0,0,0.32)`,
                letterSpacing: "-0.02em",
              }}>{k}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...cinematicBg, display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
      <img src={`${BASE}login-bg.jpeg`} alt="" style={bgImg} />
      <div style={bgOverlay} />
      <style>{`
        @keyframes login-fade-up { from { opacity:0; transform:translateY(28px); } to { opacity:1; transform:translateY(0); } }
        @keyframes team-card-in { from { opacity:0; transform:scale(0.88) translateY(18px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes welcome-pop { from { opacity:0; transform:scale(0.88) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes login-icon-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes card-shimmer { 0%{transform:translateX(-110%) skewX(-18deg)} 100%{transform:translateX(240%) skewX(-18deg)} }
        .team-card { transition: all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) !important; position: relative; overflow: hidden; -webkit-backdrop-filter: blur(40px) saturate(2); backdrop-filter: blur(40px) saturate(2); }
        .team-card::before { content: ""; position: absolute; inset: 0; background: linear-gradient(160deg, rgba(255,255,255,0.09) 0%, transparent 55%); opacity: 0; transition: opacity 0.25s ease; border-radius: inherit; pointer-events: none; }
        .team-card::after { content: ""; position: absolute; top: 0; left: 0; width: 50%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent); opacity: 0; border-radius: inherit; pointer-events: none; transition: opacity 0.2s; }
        .team-card:hover { transform: translateY(-5px) scale(1.025) !important; }
        .team-card:hover::before { opacity: 1; }
        .team-card:active { transform: scale(0.94) !important; transition: all 0.1s ease !important; }
      `}</style>

      {/* Logo area */}
      {(() => {
        const savedId = localStorage.getItem("ipl-current-user");
        const savedTeam = savedId ? FANTASY_TEAMS[savedId] : null;
        return (
          <div style={{ position: "relative", zIndex: 2, animation: "login-fade-up 0.35s ease-out", display: "flex", flexDirection: "column" as const, alignItems: "center", marginBottom: savedTeam ? 28 : 44 }}>
            {/* spinning ring icon */}
            <div style={{ position: "relative", width: 92, height: 92, marginBottom: 20 }}>
              {/* Outer ambient glow */}
              <div style={{ position: "absolute", inset: -14, borderRadius: 40, background: "radial-gradient(circle, rgba(245,166,35,0.25) 0%, transparent 65%)", filter: "blur(10px)" }} />
              {/* Static full gold ring — always visible, with outer squared glow */}
              <div style={{ position: "absolute", inset: -2, borderRadius: 28, background: "rgba(245,166,35,0.38)", boxShadow: "0 0 0 1px rgba(245,166,35,0.5), 0 0 12px 3px rgba(245,166,35,0.35), 0 0 28px 6px rgba(245,166,35,0.18)" }} />
              {/* Inner clip — rounded square, covers center leaving only the ring visible */}
              <div style={{ position: "absolute", inset: 2.5, borderRadius: 25.5, background: "#100d08", overflow: "hidden" }}>
                <img
                  src={`${import.meta.env.BASE_URL}app-icon.png`}
                  alt="Indian Premier League"
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 10%", display: "block", transform: "scale(1.08)", transformOrigin: "center top" }}
                />
              </div>
            </div>

            <div style={{ fontSize: "1.45rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.01em", lineHeight: 1.15, fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", textAlign: "center", textShadow: "0 2px 8px rgba(0,0,0,1), 0 4px 32px rgba(0,0,0,0.95), 0 0 2px rgba(0,0,0,1)" }}>
              Indian Premier League
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10 }}>
              <div style={{ width: 36, height: 1, background: "linear-gradient(90deg, transparent, rgba(245,166,35,0.8))" }} />
              <div style={{ fontSize: "0.63rem", color: "#f5a623", letterSpacing: "0.28em", fontWeight: 800, textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}>2026 SEASON</div>
              <div style={{ width: 36, height: 1, background: "linear-gradient(270deg, transparent, rgba(245,166,35,0.8))" }} />
            </div>

            {savedTeam && (
              <div style={{
                marginTop: 20,
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(46,204,143,0.1)", border: "1px solid rgba(46,204,143,0.25)",
                borderRadius: 24, padding: "7px 18px",
                animation: "welcome-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.15s both",
                backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
              }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#2ecc8f", boxShadow: "0 0 10px rgba(46,204,143,0.6)", flexShrink: 0 }} />
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#2ecc8f", letterSpacing: "0.01em" }}>
                  Welcome back, {savedTeam.owner}!
                </span>
              </div>
            )}
          </div>
        );
      })()}

      {/* Label */}
      <div style={{ position: "relative", zIndex: 2, fontSize: "0.56rem", letterSpacing: "0.2em", color: "#fff", textTransform: "uppercase" as const, marginBottom: 18, marginTop: -28, fontWeight: 800, animation: "login-fade-up 0.4s ease-out", textShadow: "0 1px 6px rgba(0,0,0,1), 0 2px 16px rgba(0,0,0,0.9)" }}>
        Select your team
      </div>

      {/* Team cards — glass cards with warm border */}
      <div style={{ position: "relative", zIndex: 2, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, width: "100%", maxWidth: 400 }}>
        {Object.values(FANTASY_TEAMS).map((ft, idx) => (
          <button key={ft.id} className="team-card" onClick={() => setSel(ft.id)} style={{
            background: `linear-gradient(170deg, ${ft.color}0d 0%, rgba(10,7,4,0.38) 38%, rgba(6,4,2,0.25) 100%)`,
            border: `1px solid ${ft.color}38`,
            borderRadius: 24, padding: "26px 16px 22px",
            cursor: "pointer", fontFamily: "inherit",
            display: "flex", flexDirection: "column" as const, alignItems: "center",
            boxShadow: `inset 0 2px 0 ${ft.color}22, 0 14px 48px rgba(0,0,0,0.6), 0 0 0 1px ${ft.color}12, 0 0 40px ${ft.color}14`,
            animation: `team-card-in 0.55s cubic-bezier(0.2, 0.8, 0.2, 1) ${idx * 0.09 + 0.1}s both`,
          }}>
            {/* Team color top accent */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2.5px", borderRadius: "24px 24px 0 0", background: `linear-gradient(90deg, transparent, ${ft.color}, transparent)`, opacity: 0.85 }} />
            <div style={{ width: 68, height: 68, borderRadius: "50%", border: `2.5px solid ${ft.color}70`, overflow: "hidden", marginBottom: 14, boxShadow: `0 0 0 3px ${ft.color}1c, 0 0 20px ${ft.color}38, 0 6px 24px rgba(0,0,0,0.55)`, flexShrink: 0, position: "relative" as const }}>
              <img src={`${import.meta.env.BASE_URL}avatars/${ft.avatar}`} alt={ft.owner} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center center", display: "block" }} />
            </div>
            <div style={{ fontSize: "1rem", fontWeight: 800, color: "#fff", marginBottom: 5, letterSpacing: "-0.02em", textShadow: `0 1px 12px rgba(0,0,0,0.9), 0 0 28px ${ft.color}18` }}>{ft.owner}</div>
            <div style={{ fontSize: "0.62rem", color: ft.color, fontWeight: 700, lineHeight: 1.4, letterSpacing: "0.04em", textShadow: `0 0 12px ${ft.color}66` }}>{ft.name}</div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div style={{ position: "absolute", bottom: 24, zIndex: 2, fontSize: "0.52rem", color: "rgba(255,200,120,0.25)", letterSpacing: "0.1em", fontWeight: 600 }}>
        IPL 2026 · Private League
      </div>
    </div>
  );
}

// ── Module-level constants & pure utilities (never re-created on render) ─────

const PULL_THRESHOLD = 72;

const TABS = [
  { id: "home",     label: "Leaderboard" },
  { id: "teams",    label: "Teams"        },
  { id: "fixtures", label: "Matches"      },
  { id: "stats",    label: "Stats"        },
  { id: "history",  label: "History"      },
];

const NAV_ICON: Record<string, React.ReactNode> = {
  home: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8M12 17v4M17 3h3v5c0 2.5-1.5 4-4 4M7 3H4v5c0 2.5 1.5 4 4 4"/><path d="M7 3h10v8a5 5 0 0 1-10 0V3z"/>
    </svg>
  ),
  teams: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75M21 21v-2a4 4 0 0 0-3-3.87"/>
    </svg>
  ),
  fixtures: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  ),
  stats: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6"/>
    </svg>
  ),
  history: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
};

interface PlayerStats {
  played: boolean; runs: number; balls: number; fours: number; sixes: number;
  duck: boolean; wickets: number; dots: number; lbwBowled: number;
  maidens: number; ballsBowled: number; runsConceded: number;
  catches: number; runOuts: number; stumpings: number;
}

const rankLabel = (i: number) => i === 0 ? "first" : i === 1 ? "second" : i === 2 ? "third" : "";

const fmtDate = (d: string) => {
  try { return new Date(d).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }); }
  catch { return d || ""; }
};
const fmtTime = (dt: string) => {
  try { return new Date(dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " local"; }
  catch { return ""; }
};
const getMatchNum = (name: string) => {
  const mx = (name || "").match(/(\d+)(?:st|nd|rd|th) Match/i);
  return mx ? "M" + mx[1] : "";
};

const buildMatchPreviews = (matches: any[]) =>
  matches.map((match: any) => {
    const teamInfo: any[] = match.teamInfo || [];
    const playingTeams = new Set(teamInfo.map((ti: any) => (ti.shortname || "").toUpperCase()));
    const preview = Object.values(FANTASY_TEAMS).map(ft => ({
      team: ft,
      activePlayers: ft.players.filter(p => playingTeams.has(p.ipl.toUpperCase()))
    })).filter(x => x.activePlayers.length > 0);
    return { match, playingTeams: [...playingTeams], preview };
  }).filter(item => item.playingTeams.length > 0);

// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState("home");
  const [historyYear, setHistoryYear] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState("rajveer");
  const [fixtureHomeAwayFilter, setFixtureHomeAwayFilter] = useState<"all" | "home" | "away">("all");
  const [playerPoints, setPlayerPoints] = useState<Record<string, number>>({});
  const [playerMatchPoints, setPlayerMatchPoints] = useState<Record<string, Array<{ matchNum: number; label: string; pts: number; source: string; stats?: PlayerStats }>>>({});
  const [iplIdToMatchNum, setIplIdToMatchNum] = useState<Record<string, number>>({});
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [benchOpen, setBenchOpen] = useState(false);
  const [matchPtsOpen, setMatchPtsOpen] = useState(false);
  const [expandedMatchNums, setExpandedMatchNums] = useState<Set<number>>(new Set());
  const [expandedAdminPlayer, setExpandedAdminPlayer] = useState<string | null>(null);
  const [adminBreakdownOpen, setAdminBreakdownOpen] = useState(false);
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [supabaseSyncing, setSupabaseSyncing] = useState(false);
  const [statsRefreshing, setStatsRefreshing] = useState(false);
  const [supabaseSyncMsg, setSupabaseSyncMsg] = useState<string | null>(null);
  const [s3Prefetching, setS3Prefetching] = useState(false);
  const [s3PrefetchResult, setS3PrefetchResult] = useState<{ found: number; missing: number; foundIds: string[]; missingIds: string[] } | null>(null);
  const [collapsedInnings, setCollapsedInnings] = useState<Set<string>>(new Set());
  const [pointsUpdating, setPointsUpdating] = useState(false);
  const [pendingMatches, setPendingMatches] = useState(0);
  const [nextAttempt, setNextAttempt] = useState<string | null>(null);
  const [processedMatches, setProcessedMatches] = useState<string[]>([]);
  const [dailyHits, setDailyHits] = useState<{ count: number; limit: number; date: string } | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [pointsLastUpdated, setPointsLastUpdated] = useState<Date | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [pointsError, setPointsError] = useState<string | null>(null);
  const [dataSources, setDataSources] = useState<{ iplOfficial: number; liveCount: number; competitionId?: number } | null>(null);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [scorecards, setScorecards] = useState<Record<string, any>>({});
  const [scorecardLoading, setScorecardLoading] = useState<string | null>(null);
  const [standings, setStandings] = useState<any[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [iplStats, setIplStats] = useState<any | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsFilter, setStatsFilter] = useState<"all" | "fantasy" | "predictions">("all");
  const [statsCategory, setStatsCategory] = useState<"fantasyPts" | "orangeCap" | "purpleCap" | "sixesLeader" | "foursLeader" | "srLeader" | "ecoLeader">("fantasyPts");
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [predArchiveOpen, setPredArchiveOpen] = useState(false);
  const [fantasyPtsOpen, setFantasyPtsOpen] = useState(false);
  const [predVisibleCount, setPredVisibleCount] = useState(10);
  const [matchFilter, setMatchFilter] = useState<"upcoming" | "live" | "completed" | "all">("upcoming");
  const [teamFilter, setTeamFilter] = useState<Set<string>>(new Set());
  const toggleTeamFilter = (code: string) => setTeamFilter(prev => {
    const next = new Set(prev);
    if (next.has(code)) next.delete(code); else next.add(code);
    return next;
  });
  const [standingsOpen, setStandingsOpen] = useState(false);
  const [intelOpen, setIntelOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [expandedPredMatchId, setExpandedPredMatchId] = useState<string | null>(null);
  const [expandedFantasyMatchId, setExpandedFantasyMatchId] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<Record<string, Record<string, string | null>>>({});
  const lastPredSaveRef = useRef<number>(0);
  const [predFlash, setPredFlash] = useState<string | null>(null);

  const [sparkTip, setSparkTip] = useState<{ label: string; pts: number } | null>(null);
  const [pullY, setPullY] = useState(0);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [appInstalled, setAppInstalled] = useState(false);
  const [showToast, setShowToast] = useState(false);
  // Swipe refs
  const swipeStartX = useRef(0);
  const swipeStartY = useRef(0);
  const swipeBlocked = useRef(false);
  const pointsRetryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointsRetryCount = useRef(0);
  // PTR refs
  const pullState = useRef({ active: false, startY: 0, startX: 0 });
  const pullYRef = useRef(0);
  const sparkTipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Always-fresh ref to refresh fn (avoids stale closure in PTR listener)
  const refreshFnRef = useRef(() => {});
  const [countdown, setCountdown] = useState<{ text: string; matchName: string; venue?: string; homeTeam?: string; awayTeam?: string } | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(() => localStorage.getItem("ipl-current-user"));
  const [userPins, setUserPins] = useState<Record<string, string>>(loadPins());
  const [pinEditTarget, setPinEditTarget] = useState<string | null>(null);
  const [pinEditVal, setPinEditVal] = useState("");
  const [pinConfirmVal, setPinConfirmVal] = useState("");
  const [pinStep, setPinStep] = useState<"confirm" | "new">("confirm");
  const [pinConfirmError, setPinConfirmError] = useState(false);
  const resetPinEdit = () => { setPinEditTarget(null); setPinEditVal(""); setPinConfirmVal(""); setPinStep("confirm"); setPinConfirmError(false); };
  const handleLogin = (userId: string) => { localStorage.setItem("ipl-current-user", userId); setCurrentUser(userId); setTab("home"); };
  const handleLogout = () => { localStorage.removeItem("ipl-current-user"); setCurrentUser(null); };
  const handleValidate = async (userId: string, pin: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/ipl/pins/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, pin }),
      });
      if (res.ok) { handleLogin(userId); return true; }
      return false;
    } catch {
      // Fallback to locally cached PINs if server is unreachable
      if (pin === userPins[userId]) { handleLogin(userId); return true; }
      return false;
    }
  };
  const handleConfirmOldPin = async (uid: string) => {
    if (pinConfirmVal.length !== 4) return;
    try {
      const res = await fetch("/api/ipl/pins/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: uid, pin: pinConfirmVal }),
      });
      if (res.ok) { setPinStep("new"); setPinConfirmError(false); }
      else { setPinConfirmError(true); setPinConfirmVal(""); }
    } catch {
      if (pinConfirmVal === userPins[uid]) { setPinStep("new"); setPinConfirmError(false); }
      else { setPinConfirmError(true); setPinConfirmVal(""); }
    }
  };
  const handleSavePin = async (uid: string) => {
    if (!/^\d{4}$/.test(pinEditVal)) return;
    const updated = { ...userPins, [uid]: pinEditVal };
    setUserPins(updated); savePins(updated);
    const savedOld = pinConfirmVal;
    resetPinEdit();
    try {
      await fetch(`/api/ipl/pins/${encodeURIComponent(uid)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Owner-Id": "rajveer" },
        body: JSON.stringify({ pin: pinEditVal, oldPin: savedOld }),
      });
    } catch (_) {}
  };

  const MAX_POINTS_RETRIES = 4;
  const fetchPoints = async () => {
    if (pointsLoading) return;
    setPointsLoading(true);
    setPointsError(null);
    // Clear any pending retry
    if (pointsRetryTimer.current) { clearTimeout(pointsRetryTimer.current); pointsRetryTimer.current = null; }
    try {
      const res = await fetch("/api/ipl/points");
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (data.error && !data.playerPoints) {
        setPointsError(data.error);
      } else {
        const pp = data.playerPoints || {};
        setPlayerPoints(pp);
        setPlayerMatchPoints(data.playerMatchPoints || {});
        setIplIdToMatchNum(data.iplIdToMatchNum || {});
        setProcessedMatches(data.processedMatches || []);
        setPointsUpdating(data.updating || false);
        setPendingMatches(data.pendingMatches || 0);
        setNextAttempt(data.nextAttempt || null);
        if (data.dailyHits) setDailyHits(data.dailyHits);
        setPointsLastUpdated(new Date());
        // If data came back empty (server still syncing on startup), retry quickly — but cap attempts
        if (Object.keys(pp).length === 0 && pointsRetryCount.current < MAX_POINTS_RETRIES) {
          pointsRetryCount.current += 1;
          pointsRetryTimer.current = setTimeout(() => {
            pointsRetryTimer.current = null;
            fetchPoints();
          }, 4000);
        } else {
          pointsRetryCount.current = 0; // reset on success
        }
      }
    } catch (e: any) {
      setPointsError("Points fetch failed: " + (e.message || "Unknown error"));
      // Retry on network failure — capped at MAX_POINTS_RETRIES
      if (pointsRetryCount.current < MAX_POINTS_RETRIES) {
        pointsRetryCount.current += 1;
        pointsRetryTimer.current = setTimeout(() => {
          pointsRetryTimer.current = null;
          fetchPoints();
        }, 5000);
      }
    }
    setPointsLoading(false);
  };

  const syncSupabase = async () => {
    if (supabaseSyncing) return;
    setSupabaseSyncing(true);
    setSupabaseSyncMsg(null);
    try {
      const res = await fetch("/api/ipl/points/sync-supabase", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
      const msg = data.changed
        ? `Synced ✓ — ${data.fixturesAfter} fixtures loaded`
        : "Already up to date";
      setSupabaseSyncMsg(msg);
      // Refresh points display after sync
      setTimeout(fetchPoints, 300);
    } catch (e: any) {
      setSupabaseSyncMsg("Sync failed: " + (e.message || "unknown error"));
    }
    setSupabaseSyncing(false);
  };

  const prefetchS3Scorecards = async () => {
    if (s3Prefetching) return;
    setS3Prefetching(true);
    setS3PrefetchResult(null);
    try {
      const res = await fetch("/api/ipl/scorecard/prefetch-s3", {
        method: "POST",
        headers: { "X-Owner-Id": "rajveer" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
      setS3PrefetchResult(data);
    } catch (e: any) {
      setS3PrefetchResult({ found: 0, missing: 0, foundIds: [], missingIds: ["Error: " + (e.message || "unknown")] });
    }
    setS3Prefetching(false);
  };

  const refreshStatsCache = async () => {
    if (statsRefreshing) return;
    setStatsRefreshing(true);
    try {
      await fetch("/api/ipl/stats/refresh", { method: "POST", headers: { "X-Owner-Id": "rajveer" } });
      await fetchStats();
    } catch (_) {}
    setStatsRefreshing(false);
  };

  const fetchLive = async () => {
    if (liveLoading) return;
    setLiveLoading(true);
    setApiError(null);
    try {
      const res = await fetch("/api/ipl/matches");
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const matches: any[] = data.matches || [];
      if (matches.length > 0) {
        setLiveMatches(matches);
        setDataSources(data.sources || null);
        const hasLive = matches.some((m: any) => m.matchStarted && !m.matchEnded);
        setMatchFilter(hasLive ? "live" : "upcoming");
      } else {
        setApiError("No IPL matches found from official sources.");
      }
      setLastUpdated(new Date());
    } catch (e: any) {
      setApiError("Fetch failed: " + (e.message || "Unknown error"));
    }
    setLiveLoading(false);
  };

  const fetchScorecard = async (matchId: string, force = false) => {
    if (!force && (scorecards[matchId] || scorecardLoading === matchId)) return;
    if (scorecardLoading === matchId) return;
    setScorecardLoading(matchId);
    try {
      const res = await fetch(`/api/ipl/scorecard/${matchId}`);
      if (res.ok) {
        const data = await res.json();
        setScorecards(prev => ({ ...prev, [matchId]: data }));
      }
    } catch (_) {}
    setScorecardLoading(null);
  };

  const fetchStandings = async () => {
    if (standingsLoading) return;
    setStandingsLoading(true);
    try {
      const res = await fetch("/api/ipl/standings");
      if (res.ok) {
        const data = await res.json();
        setStandings(data.standings || []);
      }
    } catch (_) {}
    setStandingsLoading(false);
  };

  const fetchStats = async () => {
    if (statsLoading) return;
    setStatsLoading(true);
    try {
      const res = await fetch("/api/ipl/stats");
      if (res.ok) setIplStats(await res.json());
    } catch (_) {}
    setStatsLoading(false);
  };

  const PRED_CACHE_KEY = "ipl-predictions-2026";
  const loadLocalPreds = (): Record<string, Record<string, string | null>> => {
    try { return JSON.parse(localStorage.getItem(PRED_CACHE_KEY) || "{}"); } catch { return {}; }
  };
  const saveLocalPreds = (data: Record<string, Record<string, string | null>>) => {
    try { localStorage.setItem(PRED_CACHE_KEY, JSON.stringify(data)); } catch {}
  };

  const fetchPredictions = async () => {
    // Don't overwrite a just-saved prediction — wait 4 s for the POST to settle
    if (Date.now() - lastPredSaveRef.current < 4000) return;
    try {
      const res = await fetch("/api/ipl/predictions");
      if (res.ok) {
        const server: Record<string, Record<string, string | null>> = await res.json();
        // Guard again: the GET was in-flight; another save may have happened
        if (Date.now() - lastPredSaveRef.current < 4000) return;
        // Server is the source of truth — always use it directly.
        // Local cache is only a fallback for offline use.
        saveLocalPreds(server);
        setPredictions(server);
      }
    } catch (_) {
      // On network failure, use local cache
      const local = loadLocalPreds();
      if (Object.keys(local).length > 0) setPredictions(local);
    }
  };

  const fetchPins = async () => {
    try {
      const res = await fetch("/api/ipl/pins", { headers: { "X-Owner-Id": "rajveer" } });
      if (res.ok) {
        const serverPins = await res.json();
        const merged = { ...DEFAULT_PINS, ...serverPins };
        setUserPins(merged);
        savePins(merged);
      }
    } catch (_) {}
  };

  const toggleMatch = (matchId: string, isCompleted: boolean, isLive = false) => {
    if (expandedMatchId === matchId) {
      setExpandedMatchId(null);
    } else {
      setExpandedMatchId(matchId);
      if (isCompleted || isLive) fetchScorecard(matchId);
    }
  };

  // Auto-refresh scorecard every 30 s while a live match is expanded
  useEffect(() => {
    if (!expandedMatchId) return;
    const liveIds = new Set(
      liveMatches
        .filter((m: any) => m.matchStarted && !m.matchEnded)
        .map((m: any) => String(m.id))
    );
    if (!liveIds.has(expandedMatchId)) return;
    const id = setInterval(() => fetchScorecard(expandedMatchId, true), 30_000);
    return () => clearInterval(id);
  }, [expandedMatchId, liveMatches]);

  // Cleanup retry timer on unmount
  useEffect(() => {
    return () => { if (pointsRetryTimer.current) clearTimeout(pointsRetryTimer.current); };
  }, []);

  useEffect(() => {
    if (!settingsOpen) return;
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setSettingsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [settingsOpen]);

  // Initial fetch — runs on mount AND whenever the user logs in
  useEffect(() => {
    if (!currentUser) return;
    fetchLive();
    fetchPoints();
    fetchStandings();
    fetchStats();
    fetchPredictions();
    if (currentUser === "rajveer") fetchPins();
  }, [currentUser]);

  // Register service worker for PWA offline support — auto-reload on SW update
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
    const onMsg = (e: MessageEvent) => { if (e.data?.type === "SW_UPDATED") window.location.reload(); };
    navigator.serviceWorker.addEventListener("message", onMsg);
    return () => navigator.serviceWorker.removeEventListener("message", onMsg);
  }, []);

  // Adaptive polling — split by data freshness needs:
  //   Live status (fetchLive, standings): 20 s  — free IPL API, needs to be fast
  //   Points / stats:                     60 s  — server only recalculates every 60 s (CricAPI cooldown)
  //   Idle (no live match):               60 min — nothing is changing
  const isAnyMatchLive = useMemo(() =>
    liveMatches.some((m: any) => m.matchStarted && !m.matchEnded),
  [liveMatches]);

  // Reset home/away sub-filter whenever the team filter is changed
  useEffect(() => { setFixtureHomeAwayFilter("all"); }, [teamFilter]);

  useEffect(() => {
    if (!currentUser) return;
    const idleDelay  = 60 * 60_000; // 60 min when nothing is live
    const liveStatus = 20_000;       // 20 s — match status / scorecard
    const livePoints = 45_000;       // 45 s — aligned with server CricAPI cooldown
    if (!isAnyMatchLive) {
      const ids = [
        setInterval(fetchLive,        idleDelay),
        setInterval(fetchPoints,      idleDelay),
        setInterval(fetchStandings,   idleDelay),
        setInterval(fetchStats,       idleDelay),
        setInterval(fetchPredictions, idleDelay),
      ];
      return () => ids.forEach(clearInterval);
    }
    // Live match — faster status, slower points (server cooldown aligned)
    const ids = [
      setInterval(fetchLive,        liveStatus),
      setInterval(fetchStandings,   liveStatus),
      setInterval(fetchPoints,      livePoints),
      setInterval(fetchStats,       livePoints),
      setInterval(fetchPredictions, livePoints),
    ];
    return () => ids.forEach(clearInterval);
  }, [isAnyMatchLive, currentUser]);

  // Refetch stats every time the user opens the stats tab (catches server-side refreshes)
  useEffect(() => {
    if (!currentUser || tab !== "stats") return;
    fetchStats();
  }, [tab, currentUser]);

  // Fast-poll predictions when the Predictions view is open (picks can change up until match starts)
  useEffect(() => {
    if (!currentUser || !(tab === "stats" && statsFilter === "predictions")) return;
    const id = setInterval(fetchPredictions, 30_000);
    return () => clearInterval(id);
  }, [tab, statsFilter, currentUser]);

  // Refresh when the user returns to the tab after being away
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && currentUser) {
        pointsRetryCount.current = 0; // allow fresh retries after coming back
        fetchLive();
        fetchPoints();
        fetchPredictions();
        fetchStandings();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [currentUser]);

  // Keep refreshFnRef up-to-date every render so PTR always calls the latest version
  useEffect(() => { refreshFnRef.current = () => { fetchLive(); fetchPoints(); }; });

  // PWA install prompt
  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    const onInstalled = () => { setAppInstalled(true); setInstallPrompt(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Pull-to-refresh via native touch listeners (needs passive:true so it doesn't block scroll)
  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      pullState.current.active = window.scrollY <= 0;
      pullState.current.startY = e.touches[0].clientY;
      pullState.current.startX = e.touches[0].clientX;
    };
    const onMove = (e: TouchEvent) => {
      if (!pullState.current.active) return;
      const dy = e.touches[0].clientY - pullState.current.startY;
      if (dy <= 0) { pullState.current.active = false; pullYRef.current = 0; setPullY(0); return; }
      const dx = Math.abs(e.touches[0].clientX - pullState.current.startX);
      if (dx > 30) { pullState.current.active = false; pullYRef.current = 0; setPullY(0); return; }
      const clamped = Math.min(dy * 0.45, PULL_THRESHOLD);
      pullYRef.current = clamped;
      setPullY(clamped);
    };
    const onEnd = () => {
      if (pullState.current.active && pullYRef.current >= PULL_THRESHOLD - 5) {
        refreshFnRef.current();
      }
      pullState.current.active = false;
      pullYRef.current = 0;
      setPullY(0);
    };
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
    };
  }, []);

  const teamScores = useMemo(() =>
    Object.keys(FANTASY_TEAMS)
      .map(id => ({ id, ...getTeamData(id, playerPoints), team: FANTASY_TEAMS[id] }))
      .sort((a, b) => b.total - a.total),
  [playerPoints]);

  // Countdown to next match — only triggers a re-render when the displayed text
  // actually changes, preventing the 1-second ticker from re-running all memoized
  // computations on every tick.
  const countdownPrevRef = useRef<string | null>(null);
  useEffect(() => {
    const update = () => {
      const upcoming = liveMatches
        .filter((m: any) => !m.matchStarted && m.dateTimeGMT)
        .sort((a: any, b: any) => new Date(a.dateTimeGMT).getTime() - new Date(b.dateTimeGMT).getTime())[0];
      if (!upcoming) {
        if (countdownPrevRef.current !== null) { countdownPrevRef.current = null; setCountdown(null); }
        return;
      }
      const diff = new Date(upcoming.dateTimeGMT).getTime() - Date.now();
      if (diff <= 0) {
        if (countdownPrevRef.current !== null) { countdownPrevRef.current = null; setCountdown(null); }
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hrs = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      const text = days > 0
        ? `${days}D ${String(hrs).padStart(2,"0")}H ${String(mins).padStart(2,"0")}M`
        : `${String(hrs).padStart(2,"0")}:${String(mins).padStart(2,"0")}:${String(secs).padStart(2,"0")}`;
      if (countdownPrevRef.current === text) return; // no state update if text unchanged
      countdownPrevRef.current = text;
      const homeTeam = upcoming.homeTeamCode || upcoming.teamInfo?.[0]?.shortname || "";
      const awayTeam = upcoming.awayTeamCode || upcoming.teamInfo?.[1]?.shortname || "";
      setCountdown({ text, matchName: upcoming.name, venue: upcoming.venue || "", homeTeam, awayTeam });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [liveMatches]);

  // Hot players: scored >= 25 pts in most recent match
  const hotPlayers = useMemo(() => new Set<string>(
    Object.entries(playerMatchPoints)
      .filter(([, matches]) => {
        const sorted = [...matches].sort((a, b) => b.matchNum - a.matchNum);
        return sorted.length > 0 && sorted[0].pts >= 25;
      })
      .map(([name]) => name)
  ), [playerMatchPoints]);

  // Per-team match-by-match cumulative points (for chart)
  const matchHistory = useMemo(() => {
    const allNums = new Set<number>();
    for (const matches of Object.values(playerMatchPoints)) {
      for (const e of matches) { allNums.add(e.matchNum); }
    }
    const sorted = [...allNums].sort((a, b) => a - b);
    return Object.entries(FANTASY_TEAMS).map(([teamId, team]) => {
      let cum = 0;
      const points = sorted.map(matchNum => {
        let pts = 0;
        for (const player of team.players) {
          const entry = (playerMatchPoints[player.name] || []).find(e => e.matchNum === matchNum);
          if (entry) {
            const p = applyMultiplier(entry.pts, player.name === team.captain, player.name === team.vc);
            pts += p;
          }
        }
        cum += pts;
        return { matchNum, label: `M${matchNum}`, cum };
      });
      return { teamId, color: team.color, name: team.name, emoji: team.emoji, points };
    });
  }, [playerMatchPoints]);

  const shareLeaderboard = async () => {
    const W = 1080, H = 1000, PAD = 64;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // Load logo
    const logoImg = new Image();
    logoImg.crossOrigin = "anonymous";
    logoImg.src = `${import.meta.env.BASE_URL}app-icon.png`;
    await new Promise(res => { logoImg.onload = res; logoImg.onerror = res; });

    // — Background —
    ctx.fillStyle = "#080c14";
    ctx.fillRect(0, 0, W, H);

    // Gold top line (thin, tasteful)
    const goldGrad = ctx.createLinearGradient(0, 0, W, 0);
    goldGrad.addColorStop(0, "#a07832"); goldGrad.addColorStop(0.5, "#d4a843"); goldGrad.addColorStop(1, "#a07832");
    ctx.fillStyle = goldGrad; ctx.fillRect(0, 0, W, 3);

    // — Header —
    // Logo circle (small, top-left)
    const logoR = 26, logoX = PAD + logoR, logoY = 68;
    ctx.save();
    ctx.beginPath(); ctx.arc(logoX, logoY, logoR, 0, Math.PI * 2); ctx.clip();
    if (logoImg.naturalWidth > 0) ctx.drawImage(logoImg, logoX - logoR, logoY - logoR, logoR * 2, logoR * 2);
    ctx.restore();

    // App name + label (right of logo)
    ctx.textAlign = "left";
    ctx.font = "700 36px -apple-system, Arial, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Indian Premier League 2026", PAD + logoR * 2 + 18, 59);
    ctx.font = "400 23px -apple-system, Arial, sans-serif";
    ctx.fillStyle = "#52525b";
    ctx.fillText("Leaderboard", PAD + logoR * 2 + 18, 88);

    // Timestamp (top-right, muted)
    ctx.textAlign = "right";
    ctx.font = "400 21px -apple-system, Arial, sans-serif";
    ctx.fillStyle = "#3f3f46";
    ctx.fillText(lastUpdated?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) ?? "just now", W - PAD, 88);

    // Thin separator line
    ctx.strokeStyle = "#1c1c20"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD, 116); ctx.lineTo(W - PAD, 116); ctx.stroke();

    // — Rows —
    const rowH = 200, startY = 132;

    teamScores.forEach((s, i) => {
      const ry = startY + i * rowH;
      const isFirst = i === 0;

      // Faint rank number (Sofascore-style ghost number, left)
      ctx.textAlign = "left";
      ctx.font = `100 108px -apple-system, Arial, sans-serif`;
      ctx.fillStyle = "#18181b";
      ctx.fillText(String(i + 1), PAD, ry + 130);

      // Color dot
      ctx.beginPath();
      ctx.arc(PAD + 110, ry + 62, 8, 0, Math.PI * 2);
      ctx.fillStyle = s.team.color;
      ctx.fill();

      // Owner name (primary)
      ctx.textAlign = "left";
      ctx.font = `600 52px -apple-system, Arial, sans-serif`;
      ctx.fillStyle = isFirst ? "#ffffff" : "#e4e4e7";
      ctx.fillText(s.team.owner, PAD + 130, ry + 78);

      // Team name (secondary — smaller, muted)
      ctx.font = `400 25px -apple-system, Arial, sans-serif`;
      ctx.fillStyle = "#52525b";
      ctx.fillText(s.team.name, PAD + 130, ry + 116);

      // Points (right)
      ctx.textAlign = "right";
      ctx.font = `700 58px -apple-system, Arial, sans-serif`;
      ctx.fillStyle = isFirst ? "#d4a843" : "#e4e4e7";
      ctx.fillText(String(s.total), W - PAD, ry + 84);

      ctx.font = `400 21px -apple-system, Arial, sans-serif`;
      ctx.fillStyle = "#3f3f46";
      ctx.fillText("pts", W - PAD, ry + 118);

      // Row divider
      if (i < teamScores.length - 1) {
        ctx.strokeStyle = "#111114"; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(PAD + 110, ry + rowH - 4);
        ctx.lineTo(W - PAD, ry + rowH - 4);
        ctx.stroke();
      }
    });

    // Bottom gold line
    ctx.fillStyle = goldGrad; ctx.fillRect(0, H - 3, W, 3);

    // Share
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, "image/png"));
    if (!blob) return;
    const file = new File([blob], "ipl-fantasy-leaderboard.png", { type: "image/png" });
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Indian Premier League 2026 — Leaderboard" });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "ipl-fantasy-leaderboard.png";
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
        setShowToast(true); setTimeout(() => setShowToast(false), 2500);
      }
    } catch { /* user cancelled */ }
  };

  const shareTeams = async () => {
    // ── Layout: 2×2 grid, Sofascore-clean style ──
    const W = 1080;
    const CELL_W = W / 2;            // 540px per column, full-bleed
    const HEADER_H = 82;
    const COLOR_BAR = 3;
    const CELL_PAD = 28;
    const TEAM_HDR_H = 66;
    const SEP = 1;
    const PLAYER_ROW_H = 30;
    const N_PLAYERS = 11;
    const CELL_H = COLOR_BAR + TEAM_HDR_H + SEP + N_PLAYERS * PLAYER_ROW_H + 20;
    const H = HEADER_H + CELL_H + SEP + CELL_H + 34;

    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    const logoImg = new Image();
    logoImg.crossOrigin = "anonymous";
    logoImg.src = `${import.meta.env.BASE_URL}app-icon.png`;
    await new Promise(res => { logoImg.onload = res; logoImg.onerror = res; });

    // ── Background ──
    ctx.fillStyle = "#0c0c0e";
    ctx.fillRect(0, 0, W, H);

    // Gold top bar
    const goldGrad = ctx.createLinearGradient(0, 0, W, 0);
    goldGrad.addColorStop(0, "#a07832"); goldGrad.addColorStop(0.5, "#d4a843"); goldGrad.addColorStop(1, "#a07832");
    ctx.fillStyle = goldGrad; ctx.fillRect(0, 0, W, 3);

    // ── Header ──
    const logoR = 20, logoX = 36 + logoR, logoY = HEADER_H / 2;
    ctx.save();
    ctx.beginPath(); ctx.arc(logoX, logoY, logoR, 0, Math.PI * 2); ctx.clip();
    if (logoImg.naturalWidth > 0) ctx.drawImage(logoImg, logoX - logoR, logoY - logoR, logoR * 2, logoR * 2);
    ctx.restore();

    ctx.textAlign = "left";
    ctx.font = "600 24px -apple-system, Arial, sans-serif";
    ctx.fillStyle = "#f4f4f5";
    ctx.fillText("Indian Premier League 2026", 36 + logoR * 2 + 12, logoY - 4);
    ctx.font = "400 14px -apple-system, Arial, sans-serif";
    ctx.fillStyle = "#3f3f46";
    ctx.fillText("All Teams · Top 11", 36 + logoR * 2 + 12, logoY + 16);

    const dateStr = pointsLastUpdated
      ? pointsLastUpdated.toLocaleDateString([], { day: "numeric", month: "short" }) + " · " +
        pointsLastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "–";
    ctx.textAlign = "right";
    ctx.font = "400 13px -apple-system, Arial, sans-serif";
    ctx.fillStyle = "#27272a";
    ctx.fillText(dateStr, W - 36, logoY + 6);

    // Thin header separator
    ctx.strokeStyle = "#18181b"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, HEADER_H); ctx.lineTo(W, HEADER_H); ctx.stroke();

    // Grid dividers (cross hair)
    ctx.strokeStyle = "#18181b"; ctx.lineWidth = 1;
    // Vertical centre
    ctx.beginPath(); ctx.moveTo(W / 2, HEADER_H); ctx.lineTo(W / 2, H - 34); ctx.stroke();
    // Horizontal mid (between top and bottom row)
    const midY = HEADER_H + CELL_H + SEP / 2;
    ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(W, midY); ctx.stroke();

    // ── Draw each team ──
    for (let ti = 0; ti < teamScores.length; ti++) {
      const s = teamScores[ti];
      const t = s.team;
      const td = getTeamData(s.id, playerPoints);
      const top11 = td.players.slice(0, N_PLAYERS);

      const col = ti % 2;
      const gridRow = Math.floor(ti / 2);
      const xS = col * CELL_W;
      const xE = xS + CELL_W;
      const xL = xS + CELL_PAD;      // inner left
      const xR = xE - CELL_PAD;      // inner right
      const yS = HEADER_H + gridRow * (CELL_H + SEP);

      // ── Color accent bar ──
      ctx.fillStyle = t.color;
      ctx.fillRect(xS, yS, CELL_W, COLOR_BAR);

      // ── Team header (rank · name · pts) ──
      const thY = yS + COLOR_BAR;

      // Ghost rank
      ctx.textAlign = "left";
      ctx.font = "100 44px -apple-system, Arial, sans-serif";
      ctx.fillStyle = "#1e1e22";
      ctx.fillText(String(ti + 1), xL, thY + 50);

      // Team name + owner
      ctx.font = "600 20px -apple-system, Arial, sans-serif";
      ctx.fillStyle = "#e4e4e7";
      ctx.fillText(t.name, xL + 38, thY + 22);
      ctx.font = "300 12px -apple-system, Arial, sans-serif";
      ctx.fillStyle = "#3f3f46";
      ctx.fillText(t.owner, xL + 38, thY + 40);
      ctx.font = "300 11px -apple-system, Arial, sans-serif";
      ctx.fillStyle = "#27272a";
      ctx.fillText(`C: ${t.captain}`, xL + 38, thY + 56);

      // Total pts (right — the hero number)
      ctx.textAlign = "right";
      ctx.font = "700 40px -apple-system, Arial, sans-serif";
      ctx.fillStyle = t.color;
      ctx.fillText(String(td.total), xR, thY + 40);
      ctx.font = "300 11px -apple-system, Arial, sans-serif";
      ctx.fillStyle = t.color + "66";
      ctx.fillText("PTS", xR, thY + 56);

      // Header → players separator
      const sepY = thY + TEAM_HDR_H;
      ctx.strokeStyle = "#18181b"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(xS, sepY); ctx.lineTo(xE, sepY); ctx.stroke();

      // ── Player rows: just name + pts ──
      const playersY = sepY + SEP;
      for (let pi = 0; pi < top11.length; pi++) {
        const p = top11[pi];
        const isC = p.name === t.captain;
        const isVC = p.name === t.vc;
        const py = playersY + pi * PLAYER_ROW_H;
        const midRow = py + PLAYER_ROW_H * 0.62;

        // Name weight/color by importance
        const nameWeight = isC ? "500" : "400";
        const nameColor = isC ? "#e4e4e7" : isVC ? "#a1a1aa" : pi < 6 ? "#71717a" : "#3f3f46";
        ctx.font = `${nameWeight} 15px -apple-system, Arial, sans-serif`;
        ctx.fillStyle = nameColor;
        ctx.textAlign = "left";

        // Truncate name to fit (max ~330px before pts area)
        let dName = p.name;
        while (ctx.measureText(dName).width > 330 && dName.length > 5) {
          dName = dName.slice(0, -2) + "…";
        }
        ctx.fillText(dName, xL, midRow);

        // Inline C / VC marker right after name
        if (isC || isVC) {
          const nameW = ctx.measureText(dName).width;
          ctx.font = "700 10px -apple-system, Arial, sans-serif";
          ctx.fillStyle = t.color + "cc";
          ctx.fillText(isC ? " C" : " VC", xL + nameW, midRow);
        }

        // Pts (right-aligned)
        ctx.textAlign = "right";
        ctx.font = `${isC || isVC ? "600" : "400"} 15px -apple-system, Arial, sans-serif`;
        ctx.fillStyle = isC ? "#e4e4e7" : isVC ? "#a1a1aa" : "#3f3f46";
        ctx.fillText(String(p.adj), xR, midRow);

        // Subtle row divider (skip last)
        if (pi < top11.length - 1) {
          ctx.strokeStyle = "#18181b"; ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(xL, py + PLAYER_ROW_H);
          ctx.lineTo(xR, py + PLAYER_ROW_H);
          ctx.stroke();
        }
      }
    }

    // Gold bottom accent
    ctx.fillStyle = goldGrad;
    ctx.fillRect(0, H - 3, W, 3);

    // Share / download
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, "image/png"));
    if (!blob) return;
    const file = new File([blob], "ipl-fantasy-teams.png", { type: "image/png" });
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "Indian Premier League 2026 — All Teams" });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "ipl-fantasy-teams.png";
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
        setShowToast(true); setTimeout(() => setShowToast(false), 2500);
      }
    } catch { /* user cancelled */ }
  };

  const shareMatchCard = async (m: any) => {
    const W = 1080, PAD = 56;
    const isLive = m.matchStarted && !m.matchEnded;
    const isDone = m.matchEnded;
    const matchTeams = (m.teamInfo || []) as Array<{ shortname: string; img: string }>;
    const scores = (m.score || []) as any[];

    // Fetch scorecard if not already loaded (user may not have expanded the card)
    let sc = scorecards[String(m.id)];
    if (!sc) {
      try {
        const res = await fetch(`/api/ipl/scorecard/${String(m.id)}`);
        if (res.ok) {
          sc = await res.json();
          setScorecards(prev => ({ ...prev, [String(m.id)]: sc }));
        }
      } catch (_) {}
    }
    const innings: any[] = sc?.innings || [];

    // Match number for fantasy points lookup
    const mNumMatch = (m.name || "").match(/(\d+)(?:st|nd|rd|th) Match/i);
    const matchNum = mNumMatch ? parseInt(mNumMatch[1]) : null;

    // Fantasy team totals for this match
    const fantasyRows = Object.values(FANTASY_TEAMS).map(ft => {
      let total = 0;
      const scorers: string[] = [];
      for (const p of ft.players) {
        const entry = matchNum ? (playerMatchPoints[p.name] || []).find((e: any) => e.matchNum === matchNum) : null;
        if (entry && entry.pts !== 0) {
          total += entry.pts;
          scorers.push(`${p.name.split(" ").pop()} ${entry.pts > 0 ? "+" : ""}${entry.pts}`);
        }
      }
      return { ft, total, scorers };
    }).filter(r => r.total !== 0).sort((a, b) => b.total - a.total);
    const hasFantasy = fantasyRows.length > 0;

    // Row / section height constants
    const ROW_BAT = 46;  // batting row (name + dismissal)
    const ROW_BOWL = 34; // bowling row
    const COL_HDR = 30;  // "BATTER" / "BOWLER" column header
    const INN_HDR = 48;  // innings title bar
    const INN_GAP = 28;  // spacer between innings

    // Compute innings section height
    let inningsH = 0;
    for (const inn of innings) {
      const batters = (inn.batting || []).filter((b: any) => !b.dnb);
      const bowlers = inn.bowling || [];
      inningsH += INN_HDR;
      if (batters.length) inningsH += COL_HDR + batters.length * ROW_BAT;
      if (bowlers.length) inningsH += 16 + COL_HDR + bowlers.length * ROW_BOWL;
      inningsH += INN_GAP;
    }

    const HEADER_H = 120;
    const TITLE_H  = 100;
    const META_H   = 52;
    const SCORE_H  = scores.length * 62 + 28;
    const RESULT_H = isDone && m.status ? 52 : 0;
    const FANTASY_H = hasFantasy ? 44 + fantasyRows.length * 52 + 20 : 0;
    const H = HEADER_H + TITLE_H + META_H + SCORE_H + RESULT_H
            + (innings.length > 0 ? inningsH + 20 : 0)
            + FANTASY_H + 56;

    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // Load logo
    const logoImg = new Image(); logoImg.crossOrigin = "anonymous";
    logoImg.src = `${import.meta.env.BASE_URL}app-icon.png`;
    await new Promise(r => { logoImg.onload = r; logoImg.onerror = r; });

    // Load team logos
    const teamLogoImgs = await Promise.all(
      matchTeams.slice(0, 2).map(ti => new Promise<HTMLImageElement | null>(resolve => {
        const url = TEAM_LOGO_CDN[ti.shortname] || ti.img || "";
        if (!url) return resolve(null);
        const img = new Image(); img.crossOrigin = "anonymous";
        img.onload = () => resolve(img); img.onerror = () => resolve(null);
        img.src = url;
      }))
    );

    const goldGrad = ctx.createLinearGradient(0, 0, W, 0);
    goldGrad.addColorStop(0, "#a07832"); goldGrad.addColorStop(0.5, "#d4a843"); goldGrad.addColorStop(1, "#a07832");
    const cx = W / 2;
    const hr = (yy: number) => {
      ctx.strokeStyle = "#1d2235"; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PAD, yy); ctx.lineTo(W - PAD, yy); ctx.stroke();
    };

    // Background + top gold strip
    ctx.fillStyle = "#080c14"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = goldGrad; ctx.fillRect(0, 0, W, 3);

    // ── Header ──
    const logoR = 22, logoX = PAD + logoR, logoY = 65;
    ctx.save(); ctx.beginPath(); ctx.arc(logoX, logoY, logoR, 0, Math.PI * 2); ctx.clip();
    if (logoImg.naturalWidth > 0) ctx.drawImage(logoImg, logoX - logoR, logoY - logoR, logoR * 2, logoR * 2);
    ctx.restore();
    ctx.textAlign = "left";
    ctx.font = "700 30px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#ffffff";
    ctx.fillText("Indian Premier League 2026", PAD + logoR * 2 + 16, 56);
    ctx.font = "400 20px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#52525b";
    ctx.fillText("Match Scorecard", PAD + logoR * 2 + 16, 82);
    ctx.textAlign = "right";
    ctx.font = "600 21px -apple-system, Arial, sans-serif";
    ctx.fillStyle = isLive ? "#22c55e" : isDone ? "#52525b" : "#60a5fa";
    ctx.fillText(isLive ? "● LIVE" : isDone ? "COMPLETED" : "UPCOMING", W - PAD, 68);
    hr(HEADER_H);

    let y = HEADER_H + 14;

    // ── Team title ──
    if (matchTeams.length >= 2) {
      const ta = matchTeams[0], tb = matchTeams[1];
      const colA = IPL_COLORS[ta.shortname] || "#e4e4e7";
      const colB = IPL_COLORS[tb.shortname] || "#e4e4e7";
      const lSz = 50;
      if (teamLogoImgs[0]) ctx.drawImage(teamLogoImgs[0], cx - 298, y + 6, lSz, lSz);
      ctx.textAlign = "right"; ctx.font = "800 52px -apple-system, Arial, sans-serif"; ctx.fillStyle = colA;
      ctx.fillText(ta.shortname, cx - 32, y + 52);
      ctx.textAlign = "center"; ctx.font = "300 26px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#3f3f46";
      ctx.fillText("vs", cx, y + 50);
      ctx.textAlign = "left"; ctx.font = "800 52px -apple-system, Arial, sans-serif"; ctx.fillStyle = colB;
      ctx.fillText(tb.shortname, cx + 32, y + 52);
      if (teamLogoImgs[1]) ctx.drawImage(teamLogoImgs[1], cx + 248, y + 6, lSz, lSz);
    } else {
      ctx.textAlign = "center"; ctx.font = "700 42px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#e4e4e7";
      ctx.fillText((m.name || "").replace(/,\s*\d+(?:st|nd|rd|th) Match.*/i, ""), cx, y + 52);
    }
    y += TITLE_H;

    // ── Meta: match number · venue · toss ──
    const mNumStr = mNumMatch ? `M${mNumMatch[1]}` : "";
    const venue = m.venue ? m.venue.split(",")[0] : "";
    const metaLine = [mNumStr, venue].filter(Boolean).join("  ·  ");
    ctx.textAlign = "center"; ctx.font = "400 21px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#52525b";
    if (metaLine) ctx.fillText(metaLine, cx, y + 22);
    if (sc?.overview?.toss) {
      ctx.font = "400 17px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#3f3f46";
      ctx.fillText(sc.overview.toss, cx, y + 44);
    }
    y += META_H;

    // ── Quick score summary ──
    hr(y); y += 18;
    const sColW = scores.length > 1 ? (W - PAD * 2 - 20) / 2 : W - PAD * 2;
    scores.forEach((s: any, i: number) => {
      const sx = PAD + i * (sColW + 20);
      const innLabel = (s.inning || "").replace(/ Innings?$/i, "");
      const scoreStr = s.summary || (s.r != null ? `${s.r}/${s.w}` : "—");
      const oversStr = s.o != null ? `(${s.o} ov)` : "";
      ctx.textAlign = "left";
      ctx.font = "400 18px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#52525b";
      ctx.fillText(innLabel, sx, y + 18);
      ctx.font = "700 42px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#e4e4e7";
      ctx.fillText(scoreStr, sx, y + 54);
      if (oversStr) {
        const sw = ctx.measureText(scoreStr).width;
        ctx.font = "400 19px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#52525b";
        ctx.fillText(oversStr, sx + sw + 8, y + 54);
      }
    });
    y += SCORE_H;

    // ── Result ──
    if (isDone && m.status) {
      hr(y); y += 14;
      ctx.textAlign = "center"; ctx.font = "600 25px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#60a5fa";
      ctx.fillText(m.status, cx, y + 28);
      y += RESULT_H;
    }

    // ── Full scorecard innings ──
    if (innings.length > 0) {
      hr(y); y += 18;

      // Right-edge x positions for batting columns
      const B_SR  = W - PAD;
      const B_6S  = B_SR  - 80;
      const B_4S  = B_6S  - 74;
      const B_B   = B_4S  - 74;
      const B_R   = B_B   - 84;

      // Right-edge x positions for bowling columns
      const BW_ECO = W - PAD;
      const BW_W   = BW_ECO - 74;
      const BW_R   = BW_W   - 74;
      const BW_M   = BW_R   - 74;
      const BW_O   = BW_M   - 74;

      // Fantasy-scoring colour helpers (mirrors the UI logic)
      const findFtC = (name: string) => {
        const norm = (s: string) => s.replace(/\s*\(.*?\)\s*/g, "").trim().toLowerCase();
        const ALIASES: Record<string, string> = { "mohammad shami": "mohammed shami", "md shami": "mohammed shami" };
        const sn = ALIASES[norm(name)] ?? norm(name);
        for (const ft of Object.values(FANTASY_TEAMS)) {
          if (ft.players.some(p => norm(p.name) === sn)) return ft;
        }
        return null;
      };
      const runsColorC = (runs: number, balls: number) => {
        if (runs === 0 && balls > 0) return "#f87171";
        if (runs >= 100) return "#d4a843";
        if (runs >= 50) return "#fb923c";
        if (runs >= 30) return "#f59e0b";
        return "#e4e4e7";
      };
      const srColorC = (sr: number, balls: number) => {
        if (balls < 5) return "#71717a";
        if (sr >= 200) return "#22c55e";
        if (sr >= 150) return "#86efac";
        if (sr < 70) return "#f87171";
        return "#71717a";
      };
      const wkColorC = (w: number) => {
        if (w >= 4) return "#d4a843";
        if (w === 3) return "#22c55e";
        if (w === 2) return "#4ade80";
        if (w === 1) return "#e4e4e7";
        return "#71717a";
      };
      const ecoColorC = (eco: number) => {
        if (eco < 6) return "#22c55e";
        if (eco < 8) return "#86efac";
        if (eco < 10) return "#71717a";
        if (eco < 12) return "#f59e0b";
        return "#f87171";
      };

      for (const inn of innings) {
        const batters = (inn.batting || []).filter((b: any) => !b.dnb);
        const bowlers: any[] = inn.bowling || [];

        // Innings title bar
        ctx.textAlign = "left"; ctx.font = "700 22px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#71717a";
        ctx.fillText((inn.name || "").toUpperCase(), PAD, y + 22);
        ctx.textAlign = "right"; ctx.font = "700 22px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#e4e4e7";
        ctx.fillText(inn.total || "", W - PAD, y + 22);
        y += INN_HDR;

        // ─ Batting table ─
        if (batters.length > 0) {
          ctx.fillStyle = "#3f3f46"; ctx.font = "600 15px -apple-system, Arial, sans-serif";
          ctx.textAlign = "left";  ctx.fillText("BATTER", PAD, y + 19);
          ctx.textAlign = "right";
          ctx.fillText("R",   B_R,   y + 19);
          ctx.fillText("B",   B_B,   y + 19);
          ctx.fillText("4s",  B_4S,  y + 19);
          ctx.fillText("6s",  B_6S,  y + 19);
          ctx.fillText("SR",  B_SR,  y + 19);
          y += COL_HDR;

          for (const b of batters) {
            const bFt = findFtC(b.name || "");
            const rc  = runsColorC(b.runs, b.balls);
            const src = srColorC(parseFloat(b.sr || "0"), b.balls);

            // Name (bold if fantasy player)
            ctx.textAlign = "left";
            ctx.font = `${bFt ? "700" : b.notOut ? "600" : "400"} 21px -apple-system, Arial, sans-serif`;
            ctx.fillStyle = b.notOut ? "#22c55e" : "#e4e4e7";
            ctx.fillText(b.name || "", PAD, y + 22);

            // F badge to the right of name
            if (bFt) {
              const nW = ctx.measureText(b.name || "").width;
              const bx = PAD + nW + 8, by = y + 8;
              ctx.fillStyle = bFt.color + "28";
              ctx.fillRect(bx, by, 22, 16);
              ctx.font = "700 11px -apple-system, Arial, sans-serif";
              ctx.fillStyle = bFt.color;
              ctx.textAlign = "left";
              ctx.fillText("F", bx + 5, by + 12);
            }

            // Dismissal
            if (b.dismissal) {
              ctx.font = "400 13px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#52525b";
              const d = b.dismissal.length > 55 ? b.dismissal.slice(0, 53) + "…" : b.dismissal;
              ctx.textAlign = "left"; ctx.fillText(d, PAD, y + 38);
            }

            // Stats — colour-coded
            ctx.textAlign = "right";
            ctx.font = "700 21px -apple-system, Arial, sans-serif"; ctx.fillStyle = rc;
            ctx.fillText(String(b.runs ?? ""), B_R, y + 22);
            ctx.font = "400 19px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#71717a";
            ctx.fillText(String(b.balls ?? ""), B_B, y + 22);
            ctx.fillStyle = b.fours > 0 ? "#60a5fa" : "#3f3f46";
            ctx.fillText(String(b.fours ?? ""), B_4S, y + 22);
            ctx.fillStyle = b.sixes > 0 ? "#a855f7" : "#3f3f46";
            ctx.fillText(String(b.sixes ?? ""), B_6S, y + 22);
            ctx.fillStyle = src;
            ctx.fillText(b.sr ? parseFloat(b.sr).toFixed(1) : "", B_SR, y + 22);
            y += ROW_BAT;
          }
        }

        // ─ Bowling table ─
        if (bowlers.length > 0) {
          y += 16;
          ctx.fillStyle = "#3f3f46"; ctx.font = "600 15px -apple-system, Arial, sans-serif";
          ctx.textAlign = "left";  ctx.fillText("BOWLER", PAD, y + 19);
          ctx.textAlign = "right";
          ctx.fillText("O",   BW_O,   y + 19);
          ctx.fillText("M",   BW_M,   y + 19);
          ctx.fillText("R",   BW_R,   y + 19);
          ctx.fillText("W",   BW_W,   y + 19);
          ctx.fillText("ECO", BW_ECO, y + 19);
          y += COL_HDR;

          for (const b of bowlers) {
            const bFt = findFtC(b.name || "");
            const wc  = wkColorC(b.wickets);
            const ec  = ecoColorC(parseFloat(b.eco || "0"));

            // Name
            ctx.textAlign = "left";
            ctx.font = `${bFt ? "700" : "400"} 21px -apple-system, Arial, sans-serif`;
            ctx.fillStyle = "#e4e4e7";
            ctx.fillText(b.name || "", PAD, y + 23);

            // F badge
            if (bFt) {
              const nW = ctx.measureText(b.name || "").width;
              const bx = PAD + nW + 8, by = y + 9;
              ctx.fillStyle = bFt.color + "28";
              ctx.fillRect(bx, by, 22, 16);
              ctx.font = "700 11px -apple-system, Arial, sans-serif";
              ctx.fillStyle = bFt.color;
              ctx.textAlign = "left";
              ctx.fillText("F", bx + 5, by + 12);
            }

            // Stats — colour-coded
            ctx.textAlign = "right"; ctx.font = "400 19px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#71717a";
            ctx.fillText(String(b.overs ?? ""),   BW_O,   y + 23);
            ctx.fillStyle = b.maidens > 0 ? "#f59e0b" : "#71717a";
            ctx.fillText(String(b.maidens ?? ""), BW_M,   y + 23);
            ctx.fillStyle = "#71717a";
            ctx.fillText(String(b.runs ?? ""),    BW_R,   y + 23);
            ctx.font = "700 21px -apple-system, Arial, sans-serif"; ctx.fillStyle = wc;
            ctx.fillText(String(b.wickets ?? ""), BW_W,   y + 23);
            ctx.font = "400 19px -apple-system, Arial, sans-serif"; ctx.fillStyle = ec;
            ctx.fillText(b.eco ? parseFloat(b.eco).toFixed(2) : "", BW_ECO, y + 23);
            y += ROW_BOWL;
          }
        }
        y += INN_GAP;
      }
    }

    // ── Fantasy highlights ──
    if (hasFantasy) {
      hr(y); y += 14;
      ctx.textAlign = "left"; ctx.font = "600 17px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#3f3f46";
      ctx.fillText("FANTASY POINTS THIS MATCH", PAD, y + 18);
      y += 36;
      for (const { ft, total, scorers } of fantasyRows) {
        ctx.fillStyle = ft.color; ctx.fillRect(PAD, y + 6, 3, 34);
        ctx.textAlign = "left"; ctx.font = "700 26px -apple-system, Arial, sans-serif"; ctx.fillStyle = ft.color;
        ctx.fillText(ft.owner, PAD + 13, y + 28);
        ctx.font = "400 17px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#52525b";
        ctx.fillText(scorers.slice(0, 4).join("  ·  "), PAD + 13 + ctx.measureText(ft.owner).width + 16, y + 28);
        ctx.textAlign = "right"; ctx.font = "700 32px -apple-system, Arial, sans-serif"; ctx.fillStyle = "#e4e4e7";
        ctx.fillText(String(total), W - PAD, y + 30);
        y += 52;
      }
    }

    // Gold bottom line
    ctx.fillStyle = goldGrad; ctx.fillRect(0, H - 3, W, 3);

    // Share or download
    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, "image/png"));
    if (!blob) return;
    const filename = matchTeams.length >= 2
      ? `ipl-${matchTeams[0].shortname}-vs-${matchTeams[1].shortname}.png`
      : "ipl-match.png";
    const title = matchTeams.length >= 2
      ? `${matchTeams[0].shortname} vs ${matchTeams[1].shortname} — IPL 2026`
      : "IPL 2026 Match";
    const file = new File([blob], filename, { type: "image/png" });
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = filename;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
      }
    } catch { /* user cancelled */ }
  };

  const maxPts = teamScores[0]?.total || 1;


  // Currently LIVE matches (started, not ended)
  const liveMatchPreviews = useMemo(() =>
    buildMatchPreviews(liveMatches.filter((m: any) => m.matchStarted && !m.matchEnded)),
  [liveMatches]);

  // All upcoming matches within the next 24 hours — handles double-headers
  const upcomingLineupPreviews = useMemo(() =>
    buildMatchPreviews(
      liveMatches
        .filter((m: any) => !m.matchStarted && m.dateTimeGMT)
        .map((m: any) => ({ m, diff: new Date(m.dateTimeGMT).getTime() - Date.now() }))
        .filter(({ diff }) => diff > 0 && diff <= 24 * 60 * 60 * 1000)
        .sort((a, b) => a.diff - b.diff)
        .map(({ m }) => m)
    ),
  [liveMatches]);

  const renderHistory = () => {
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
                return (
                  <div key={team} className="hist-cabinet-row">
                    <TeamBadge name={team} size={28} />
                    <div className="hist-cabinet-info">
                      <div className="hist-cabinet-name">{team}</div>
                      <div className="hist-cabinet-bar-wrap">
                        <div className="hist-cabinet-bar" style={{ width: `${barW}%`, background: b.bg }} />
                      </div>
                    </div>
                    <div className="hist-cabinet-count" style={{ color: b.bg === "#F5C518" ? "#a37e00" : b.bg }}>
                      {count}
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
            {/* Champion hero card */}
            <div className="hist-hero" style={{ borderColor: s.color }}>
              <div className="hist-hero-year" style={{ color: s.color }}>Season {s.season} · IPL {s.year}</div>
              <div className="hist-hero-champion">
                <TeamBadge name={s.champion} size={44} />
                <div>
                  <div style={{ color: s.color, fontSize: "1.05rem", fontWeight: 800, lineHeight: 1.2 }}>{s.champion}</div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-3)", marginTop: 3, fontWeight: 500 }}>Champions</div>
                </div>
              </div>
              <div className="hist-hero-runner">
                <TeamBadge name={s.runnerUp} size={44} />
                <div>
                  <div style={{ color: "var(--text-2)", fontSize: "1.05rem", fontWeight: 800, lineHeight: 1.2 }}>{s.runnerUp}</div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-3)", marginTop: 3, fontWeight: 500 }}>Runner-up</div>
                </div>
              </div>
              <div className="hist-hero-awards">
                <div className="hist-hero-award">
                  <span style={{ fontSize: "0.65rem", color: "#f97316" }}><span style={{filter:"hue-rotate(175deg) saturate(3) brightness(1.1)"}}>🧢</span> Orange Cap</span>
                  <span className="hist-hero-aname">{s.orangeCap}</span>
                  <span className="hist-hero-aval">{s.orangeRuns} runs</span>
                </div>
                <div className="hist-hero-award">
                  <span style={{ fontSize: "0.65rem", color: "#7c3aed" }}><span style={{filter:"hue-rotate(25deg) saturate(4) brightness(0.5)"}}>🧢</span> Purple Cap</span>
                  <span className="hist-hero-aname">{s.purpleCap}</span>
                  <span className="hist-hero-aval">{s.purpleWkts} wkts</span>
                </div>
                <div className="hist-hero-award">
                  <span style={{ fontSize: "0.65rem", color: "#d4a843" }}><span style={{filter:"sepia(1) saturate(4) hue-rotate(5deg) brightness(1.1)"}}>🧢</span> MVP</span>
                  <span className="hist-hero-aname">{s.mvp}</span>
                  <span className="hist-hero-aval" style={{ color: "#d4a843" }}>Player of Tournament</span>
                </div>
              </div>
            </div>
            {/* Top 10 lists */}
            <div className="hist-top10-grid">
              <div className="hist-top10-col">
                <div className="hist-top10-hdr" style={{ color: "#f97316" }}><span style={{filter:"hue-rotate(175deg) saturate(3) brightness(1.1)"}}>🧢</span> Top Run-scorers</div>
                {s.topBat.map((p, i) => (
                  <div key={i} className="hist-top10-row">
                    <span className={`hist-rk${i < 3 ? " top3" : ""}`}>{i + 1}</span>
                    <TeamBadge name={p.team} size={20} />
                    <span className="hist-pname">{p.name}</span>
                    <span className="hist-pval">{p.val}</span>
                  </div>
                ))}
              </div>
              <div className="hist-top10-col">
                <div className="hist-top10-hdr" style={{ color: "#7c3aed" }}><span style={{filter:"hue-rotate(25deg) saturate(4) brightness(0.5)"}}>🧢</span> Top Wicket-takers</div>
                {s.topBwl.map((p, i) => (
                  <div key={i} className="hist-top10-row">
                    <span className={`hist-rk${i < 3 ? " top3" : ""}`}>{i + 1}</span>
                    <TeamBadge name={p.team} size={20} />
                    <span className="hist-pname">{p.name}</span>
                    <span className="hist-pval">{p.val}</span>
                  </div>
                ))}
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
                  <span className="hist-cap-orange"><span style={{filter:"hue-rotate(175deg) saturate(3) brightness(1.1)"}}>🧢</span> {h.orangeCap.split(" ").slice(-1)[0]} {h.orangeRuns} runs</span>
                  <span className="hist-cap-purple"><span style={{filter:"hue-rotate(25deg) saturate(4) brightness(0.5)"}}>🧢</span> {h.purpleCap.split(" ").slice(-1)[0]} {h.purpleWkts} wks</span>
                </div>
              </div>
              <div className="hist-card-arrow">›</div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderHome = () => {
    return (
      <div>
        {/* Countdown to next match */}
        {countdown && (
          <div className="countdown-card" style={{ flexDirection: "column", alignItems: "stretch", gap: 10 }}>
            {/* Blurred colosseum background */}
            <div style={{
              position: "absolute", inset: -6, zIndex: 0,
              backgroundImage: `url(${import.meta.env.BASE_URL}countdown-bg.jpeg)`,
              backgroundSize: "cover", backgroundPosition: "center 40%",
              filter: "blur(4px) brightness(0.26) saturate(1.2)",
            }} />
            {/* Warm amber vignette — bleeds into the amber timer colour */}
            <div style={{
              position: "absolute", inset: 0, zIndex: 1,
              background: "linear-gradient(160deg, rgba(245,166,35,0.12) 0%, rgba(6,4,2,0.6) 60%, rgba(6,4,2,0.75) 100%)",
            }} />
            <div style={{ position: "relative", zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div className="countdown-timer" style={{ textShadow: "0 0 20px rgba(245,166,35,0.5), 0 2px 8px rgba(0,0,0,1)" }}>{countdown.text}</div>
                <div className="countdown-label" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>Next Match</div>
              </div>
              <div style={{ textAlign: "right" }}>
                {(countdown.homeTeam && countdown.awayTeam) ? (
                  <div className="countdown-match" style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end", textShadow: "0 1px 6px rgba(0,0,0,1)" }}>
                    <img src={TEAM_LOGO_CDN[countdown.homeTeam]} alt={countdown.homeTeam} style={{ width: 22, height: 22, objectFit: "contain", filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.8))" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    <span>{countdown.homeTeam}</span>
                    <span style={{ fontSize: "0.6rem", color: "rgba(245,166,35,0.55)", fontWeight: 400 }}>vs</span>
                    <span>{countdown.awayTeam}</span>
                    <img src={TEAM_LOGO_CDN[countdown.awayTeam]} alt={countdown.awayTeam} style={{ width: 22, height: 22, objectFit: "contain", filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.8))" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                ) : (
                  <div className="countdown-match" style={{ textShadow: "0 1px 6px rgba(0,0,0,1)" }}>{shortMatchLabel(countdown.matchName)}</div>
                )}
                {countdown.venue && (
                  <div style={{ fontSize: "0.6rem", color: "var(--text-3)", marginTop: 3, textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>
                    🏟 {countdown.venue}{countdown.homeTeam ? ` (${countdown.homeTeam})` : ""}
                  </div>
                )}
              </div>
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, marginTop: countdown ? 16 : 0 }}>
          <div className="sec-title" style={{ marginBottom: 0 }}>Leaderboard</div>
          <button className="btn-primary" style={{ padding: "6px 10px", display: "flex", alignItems: "center", gap: 5 }} onClick={shareLeaderboard} title="Share leaderboard">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            <span style={{ fontSize: "0.68rem" }}>Share</span>
          </button>
        </div>
        {(() => {
          const LB_BG: Record<string, string> = {
            rajveer:  `${import.meta.env.BASE_URL}lb-bg-rajveer.jpeg`,
            mombasa:  `${import.meta.env.BASE_URL}lb-bg-mombasa.jpeg`,
            mumbai:   `${import.meta.env.BASE_URL}lb-bg-mumbai.jpeg`,
            ponygoat: `${import.meta.env.BASE_URL}lb-bg-ponygoat.jpeg`,
          };
          return (
            <div>
              {teamScores.map((s, i) => {
                const leader = teamScores[0];
                const gap = i > 0 && Object.keys(playerPoints).length > 0 ? leader.total - s.total : 0;
                return (
                <div key={s.id} className={`lb-card ${i === 0 ? "rank-first" : ""}`} onClick={() => { setSelectedTeam(s.id); setTab("teams"); }}>
                  {/* Blurred team artwork background */}
                  <div style={{
                    position: "absolute", inset: -6, zIndex: 0,
                    backgroundImage: `url(${LB_BG[s.id]})`,
                    backgroundSize: "cover", backgroundPosition: "center 30%",
                    filter: `blur(9px) brightness(${i === 0 ? 0.38 : 0.28}) saturate(1.4)`,
                    transform: "translateZ(0)",
                  }} />
                  {/* Team color atmospheric overlay */}
                  <div style={{
                    position: "absolute", inset: 0, zIndex: 1,
                    background: `linear-gradient(130deg, ${s.team.color}1e 0%, rgba(6,4,2,0.6) 70%)`,
                  }} />
                  <div className="lb-accent" style={{ background: `linear-gradient(180deg, ${s.team.color}cc, ${s.team.color})`, zIndex: 2, position: "relative" }} />
                  <div className="lb-inner" style={{ position: "relative", zIndex: 2 }}>
                    <div className={`lb-rank ${rankLabel(i)}`} style={{ textShadow: "0 1px 10px rgba(0,0,0,0.95)" }}>{i + 1}</div>
                    <div className="lb-info">
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div className={`lb-name ${i === 0 ? "first" : ""}`}
                          style={{ textShadow: "0 1px 8px rgba(0,0,0,1), 0 0 22px rgba(0,0,0,0.9)" }}>
                          {s.team.name}
                        </div>
                        {i === 0 && <span style={{ fontSize: "0.82rem", lineHeight: 1 }}>👑</span>}
                      </div>
                      <div className="lb-meta" style={{ textShadow: "0 1px 5px rgba(0,0,0,0.95)" }}>
                        {s.team.owner} · <span style={{ color: "#d4a843" }}>C:</span> {s.team.captain} · <span style={{ color: "var(--text-2)" }}>VC:</span> {s.team.vc}
                      </div>
                      {gap > 0 && (
                        <div style={{ marginTop: 5 }}>
                          <span className="lb-gap-badge">–{gap} pts</span>
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div className={`lb-pts ${i === 0 ? "first" : ""}`}
                        style={{ color: Object.keys(playerPoints).length === 0 ? "var(--text-3)" : s.team.color, textShadow: `0 0 14px ${s.team.color}66, 0 1px 6px rgba(0,0,0,1)` }}>
                        {Object.keys(playerPoints).length === 0 ? "—" : s.total}
                      </div>
                      <div className="lb-pts-label" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>pts</div>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="lb-bar">
                    <div className="lb-bar-fill" style={{ width: `${maxPts ? (s.total / maxPts) * 100 : 0}%`, background: `linear-gradient(90deg, ${s.team.color}aa, ${s.team.color})` }} />
                  </div>
                </div>
                );
              })}
            </div>
          );
        })()}
        {(() => {
          const liveNow = liveMatches.filter((m: any) => m.matchStarted && !m.matchEnded);
          if (liveNow.length === 0) return null;
          return (
            <>
              <div className="divider" />
              <div className="sec-title">Live Now</div>
              {liveNow.map((m: any) => (
                <div key={m.id} className="match-card" onClick={() => { setTab("fixtures"); setMatchFilter("live"); }}
                  style={{ cursor: "pointer" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div className="match-status" style={{ color: "var(--live)" }}>Live</div>
                    <div style={{ fontSize: "0.6rem", color: "var(--text-3)" }}>View in Matches →</div>
                  </div>
                  <div className="match-name">{m.name}</div>
                  {(m.score || []).map((s: any, i: number) => (
                    <div key={i} className="match-score" style={{ marginTop: 3 }}>
                      <span style={{ color: "var(--text-3)", fontSize: "0.67rem" }}>{(s.inning || "").replace(" Innings", "").replace(" Inning", "")} </span>
                      {s.summary || (s.r != null ? `${s.r}/${s.w} (${s.o} ov)` : "")}
                    </div>
                  ))}
                  {m.toss && <div style={{ fontSize: "0.65rem", color: "var(--text-2)", marginTop: 5 }}>{m.toss}</div>}
                  {m.venue && (
                    <div className="match-venue">
                      🏟 {m.venue}{m.homeTeamCode ? ` (${m.homeTeamCode})` : ""}
                    </div>
                  )}
                </div>
              ))}
            </>
          );
        })()}
      </div>
    );
  };

  const TEAM_ABBREVS: Record<string, string> = {
    "Royal Challengers Bengaluru": "RCB", "Sunrisers Hyderabad": "SRH",
    "Mumbai Indians": "MI", "Chennai Super Kings": "CSK",
    "Kolkata Knight Riders": "KKR", "Rajasthan Royals": "RR",
    "Punjab Kings": "PBKS", "Delhi Capitals": "DC",
    "Gujarat Titans": "GT", "Lucknow Super Giants": "LSG",
  };
  const shortMatchLabel = (label: string) =>
    label.split(" vs ").map(t => TEAM_ABBREVS[t.trim()] || t.trim().split(" ").map((w: string) => w[0]).join("")).join(" vs ");

  const Sparkline = ({ name, color }: { name: string; color: string }) => {
    const ms = (playerMatchPoints[name] || []).slice(-5);
    if (ms.length === 0) return null;
    const maxPts = Math.max(...ms.map(m => m.pts), 1);
    const BAR_W = 4, GAP = 2, H = 10, HIT_W = 10;
    const W = ms.length * (BAR_W + GAP) - GAP;
    const handleBarTap = (e: React.MouseEvent | React.TouchEvent, m: typeof ms[0]) => {
      e.stopPropagation();
      if (sparkTipTimer.current) clearTimeout(sparkTipTimer.current);
      setSparkTip({ label: m.label, pts: m.pts });
      sparkTipTimer.current = setTimeout(() => setSparkTip(null), 2500);
    };
    return (
      <svg width={W} height={H} style={{ display: "block", marginTop: 3, flexShrink: 0, opacity: 0.8 }}>
        {ms.map((m, i) => {
          const barH = Math.max(2, Math.round((m.pts / maxPts) * H));
          const x = i * (BAR_W + GAP);
          return (
            <g key={i} onClick={(e) => handleBarTap(e, m)} style={{ cursor: "pointer" }}>
              <rect x={x} y={H - barH} width={BAR_W} height={barH} rx={1} fill={m.pts > 0 ? color : "#334155"} />
              <rect x={Math.max(0, x - 3)} y={0} width={HIT_W} height={H} fill="transparent" />
            </g>
          );
        })}
      </svg>
    );
  };

  const renderTeams = () => {
    const t = FANTASY_TEAMS[selectedTeam];
    const td = getTeamData(selectedTeam, playerPoints);
    const roleCounts = td.players.reduce((acc: Record<string, number>, p) => {
      acc[p.role] = (acc[p.role] || 0) + 1;
      return acc;
    }, {});

    // Helper: extract match label + players for this team from a preview list
    const extractForTeam = (previews: typeof upcomingLineupPreviews) => {
      const playing = new Set<string>();
      const infos: { matchLabel: string; playingTeams: string[] }[] = [];
      previews.forEach(lp => {
        const myPlayers = lp.preview.find(x => x.team.id === selectedTeam);
        if (myPlayers && myPlayers.activePlayers.length > 0) {
          myPlayers.activePlayers.forEach(p => playing.add(p.name));
          const ti: any[] = lp.match.teamInfo || [];
          const matchLabel = ti.length >= 2
            ? `${ti[0]?.shortname || ""} vs ${ti[1]?.shortname || ""}`
            : lp.match.name;
          infos.push({ matchLabel, playingTeams: lp.playingTeams });
        }
      });
      return { playing, infos };
    };

    const { playing: liveNowPlaying, infos: liveNowInfo } = extractForTeam(liveMatchPreviews);
    const { playing: nextMatchPlaying, infos: nextMatchInfoForTeam } = extractForTeam(upcomingLineupPreviews);

    const hasLiveNow = liveNowPlaying.size > 0;
    const hasNextMatch = nextMatchPlaying.size > 0;
    const hasAnyContext = hasLiveNow || hasNextMatch;

    const TEAM_BG: Record<string, string> = {
      rajveer:  `${import.meta.env.BASE_URL}lb-bg-rajveer.jpeg`,
      mombasa:  `${import.meta.env.BASE_URL}lb-bg-mombasa.jpeg`,
      mumbai:   `${import.meta.env.BASE_URL}lb-bg-mumbai.jpeg`,
      ponygoat: `${import.meta.env.BASE_URL}lb-bg-ponygoat.jpeg`,
    };

    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div className="sec-title" style={{ marginBottom: 0 }}>Teams</div>
          <button className="btn-primary" style={{ padding: "6px 10px", display: "flex", alignItems: "center", gap: 5 }} onClick={shareTeams} title="Share all teams">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
            <span style={{ fontSize: "0.68rem" }}>Share</span>
          </button>
        </div>
        <div className="team-tabs" data-no-swipe="true">
          {teamScores.map(s => {
            const ft = s.team;
            return (
              <button key={ft.id} className={`team-tab ${selectedTeam === ft.id ? "active" : ""}`}
                style={selectedTeam === ft.id ? { color: ft.color, borderColor: ft.color } : {}}
                onClick={() => setSelectedTeam(ft.id)}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ position: "relative", width: 20, height: 20, borderRadius: "50%", border: `1.5px solid ${ft.color}60`, overflow: "hidden", flexShrink: 0 }}>
                    <img src={`${import.meta.env.BASE_URL}avatars/${ft.avatar}`} alt={ft.owner} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center center", display: "block" }} />
                    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "radial-gradient(circle, transparent 40%, rgba(8,12,20,0.8) 80%, rgba(8,12,20,0.95) 100%)" }} />
                  </div>
                  {ft.name}
                </div>
                <div style={{ fontSize: "0.6rem", opacity: 0.65, marginTop: 1 }}>{ft.owner}</div>
              </button>
            );
          })}
        </div>

        <div className="team-header-card" style={{ "--team-color": t.color, "--team-color-alpha": `${t.color}28` } as React.CSSProperties}>
          {/* Blurred team artwork background */}
          <div style={{
            position: "absolute", inset: -6, zIndex: 0,
            backgroundImage: `url(${TEAM_BG[selectedTeam]})`,
            backgroundSize: "cover", backgroundPosition: "center 30%",
            filter: "blur(8px) brightness(0.33) saturate(1.3)",
          }} />
          <div style={{
            position: "absolute", inset: 0, zIndex: 1,
            background: `linear-gradient(135deg, ${t.color}18 0%, rgba(6,4,2,0.55) 100%)`,
          }} />
          <div style={{ flex: 1, position: "relative", zIndex: 2 }}>
            <div className="team-hname" style={{ color: t.color, textShadow: "0 1px 6px rgba(0,0,0,1)" }}>{t.name}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-3)", marginBottom: 4, textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>{t.owner}</div>
            <div className="team-roles">
              {Object.entries(roleCounts).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([role, n]) => (
                <span key={role} className="role-badge"
                  style={{ color: ROLE_COLORS[role], borderColor: ROLE_COLORS[role] + "44", background: ROLE_COLORS[role] + "11" }}>
                  {n} {role}
                </span>
              ))}
            </div>
          </div>
          <div style={{ textAlign: "right", position: "relative", zIndex: 2 }}>
            <div className="team-htotal" style={{ color: Object.keys(playerPoints).length === 0 ? "var(--text-3)" : t.color, textShadow: `0 0 10px ${t.color}55, 0 1px 4px rgba(0,0,0,1)` }}>
              {Object.keys(playerPoints).length === 0 ? "—" : td.total}
            </div>
            <div className="team-hlabel" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.9)" }}>total pts</div>
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
                  {td.players.filter(p => liveNowPlaying.has(p.name)).map(p => (
                    <div key={p.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f87171", display: "inline-block", flexShrink: 0 }} />
                        <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "#fca5a5" }}>{p.name}</span>
                        {p.name === t.captain && <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#d4a843" }}>C</span>}
                        {p.name === t.vc && <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-3)" }}>VC</span>}
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
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontSize: "0.65rem", fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.06em" }}>NEXT</span>
                  {nextMatchInfoForTeam[0] && <span style={{ fontSize: "0.65rem", color: "var(--text-2)" }}>{nextMatchInfoForTeam[0].matchLabel}</span>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {td.players.filter(p => nextMatchPlaying.has(p.name) && !liveNowPlaying.has(p.name)).map(p => (
                    <div key={p.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--text-2)" }}>{p.name}</span>
                        {p.name === t.captain && <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "#d4a843" }}>C</span>}
                        {p.name === t.vc && <span style={{ fontSize: "0.55rem", fontWeight: 700, color: "var(--text-3)" }}>VC</span>}
                      </div>
                      <span style={{ fontSize: "0.62rem", color: IPL_COLORS[p.ipl] || "var(--text-3)", fontWeight: 600 }}>{p.ipl}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {(() => {
          const renderBreakdown = (p: { name: string; raw: number; adj: number; role: string; ipl: string }) => {
            const playerName = p.name;
            const breakdown = playerMatchPoints[playerName] || [];
            const isCap = playerName === t.captain;
            const isVC = playerName === t.vc;
            const inTop11 = td.top11.has(playerName);
            const raw = p.raw;
            const adj = p.adj;
            const multiplier = isCap ? "× 2 (Captain)" : isVC ? "× 1.5 (VC)" : null;
            return (
              <div style={{
                gridColumn: "1 / -1", background: "rgba(10,16,28,0.98)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
                padding: "12px 14px", marginTop: 2, marginBottom: 2,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#f1f5f9" }}>{playerName}</div>
                    <div style={{ display: "flex", gap: 5, marginTop: 4, flexWrap: "wrap" as const }}>
                      <span style={{ fontSize: "0.6rem", padding: "1px 6px", borderRadius: 10, background: IPL_COLORS[p.ipl] + "22", color: IPL_COLORS[p.ipl] }}>{p.ipl}</span>
                      {isCap && <span style={{ fontSize: "0.6rem", padding: "1px 6px", borderRadius: 10, background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>© Captain ×2</span>}
                      {isVC && <span style={{ fontSize: "0.6rem", padding: "1px 6px", borderRadius: 10, background: "rgba(167,139,250,0.15)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.3)" }}>VC ×1.5</span>}
                      {!inTop11 && <span style={{ fontSize: "0.6rem", padding: "1px 6px", borderRadius: 10, background: "rgba(100,116,139,0.15)", color: "#64748b" }}>Bench</span>}
                      <span style={{ fontSize: "0.6rem", padding: "1px 6px", borderRadius: 10, background: "rgba(100,116,139,0.1)", color: "#64748b" }}>{p.role}</span>
                    </div>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setExpandedPlayer(null); }}
                    style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "1rem", padding: "2px 6px" }}>✕</button>
                </div>

                {breakdown.length === 0 ? (
                  <div style={{ color: "#475569", fontSize: "0.75rem", textAlign: "center" as const, padding: "10px 0" }}>No match data yet — points sync after each game.</div>
                ) : (
                  <>
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 8 }}>
                      {breakdown.map((entry, ei) => {
                        const s = entry.stats;
                        const lines: { label: string; pts: number; color: string }[] = [];
                        if (s) {
                          lines.push({ label: "Playing XI", pts: 4, color: "#94a3b8" });
                          if (s.runs > 0) lines.push({ label: `${s.runs} runs (${s.balls}b)`, pts: s.runs, color: "#f97316" });
                          if (s.fours > 0) lines.push({ label: `${s.fours} fours`, pts: s.fours * 4, color: "#fb923c" });
                          if (s.sixes > 0) lines.push({ label: `${s.sixes} sixes`, pts: s.sixes * 6, color: "#fbbf24" });
                          if (s.duck) lines.push({ label: "Duck", pts: -2, color: "#ef4444" });
                          const r = s.runs; const b = s.balls;
                          if (r >= 100) lines.push({ label: "Century bonus", pts: 16, color: "#34d399" });
                          else if (r >= 75) lines.push({ label: "75+ bonus", pts: 12, color: "#34d399" });
                          else if (r >= 50) lines.push({ label: "Half-century bonus", pts: 8, color: "#34d399" });
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
                          if (s.wickets > 0) lines.push({ label: `${s.wickets} wicket${s.wickets > 1 ? "s" : ""}`, pts: s.wickets * 30, color: "#60a5fa" });
                          if (s.lbwBowled > 0) lines.push({ label: `${s.lbwBowled} LBW/Bowled`, pts: s.lbwBowled * 8, color: "#60a5fa" });
                          if (s.dots > 0) lines.push({ label: `${s.dots} dot balls`, pts: s.dots * 2, color: "#818cf8" });
                          if (s.maidens > 0) lines.push({ label: `${s.maidens} maiden${s.maidens > 1 ? "s" : ""}`, pts: s.maidens * 12, color: "#818cf8" });
                          const w = s.wickets;
                          if (w >= 5) lines.push({ label: "5-wicket haul", pts: 16, color: "#34d399" });
                          else if (w >= 4) lines.push({ label: "4-wicket haul", pts: 12, color: "#34d399" });
                          else if (w >= 3) lines.push({ label: "3-wicket haul", pts: 8, color: "#34d399" });
                          const overs = s.ballsBowled / 6;
                          if (overs >= 2) {
                            const eco = s.runsConceded / overs;
                            if (eco < 5) lines.push({ label: `Eco ${eco.toFixed(1)} bonus`, pts: 8, color: "#34d399" });
                            else if (eco < 6) lines.push({ label: `Eco ${eco.toFixed(1)} bonus`, pts: 6, color: "#34d399" });
                            else if (eco <= 7) lines.push({ label: `Eco ${eco.toFixed(1)} bonus`, pts: 4, color: "#34d399" });
                            else if (eco <= 8) lines.push({ label: `Eco ${eco.toFixed(1)} bonus`, pts: 2, color: "#34d399" });
                            else if (eco >= 10 && eco <= 11) lines.push({ label: `Eco ${eco.toFixed(1)} penalty`, pts: -2, color: "#ef4444" });
                            else if (eco > 11 && eco <= 12) lines.push({ label: `Eco ${eco.toFixed(1)} penalty`, pts: -4, color: "#ef4444" });
                            else if (eco > 12) lines.push({ label: `Eco ${eco.toFixed(1)} penalty`, pts: -6, color: "#ef4444" });
                          }
                          if (s.catches > 0) lines.push({ label: `${s.catches} catch${s.catches > 1 ? "es" : ""}`, pts: s.catches * 8, color: "#a78bfa" });
                          if (s.catches >= 3) lines.push({ label: "3+ catch bonus", pts: 4, color: "#a78bfa" });
                          if (s.runOuts > 0) lines.push({ label: `${s.runOuts} run out${s.runOuts > 1 ? "s" : ""}`, pts: s.runOuts * 10, color: "#a78bfa" });
                          if (s.stumpings > 0) lines.push({ label: `${s.stumpings} stumping${s.stumpings > 1 ? "s" : ""}`, pts: s.stumpings * 12, color: "#a78bfa" });
                        }
                        return (
                          <div key={ei} style={{ marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: s ? 6 : 0 }}>
                              <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>
                                <span style={{ color: "#64748b", marginRight: 5 }}>M{entry.matchNum < 900 ? entry.matchNum : "live"}</span>
                                {shortMatchLabel(entry.label)}
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <span style={{ fontSize: "0.57rem", padding: "1px 5px", borderRadius: 8,
                                  background: entry.source === "official" ? "rgba(52,211,153,0.1)" : "rgba(251,191,36,0.1)",
                                  color: entry.source === "official" ? "#34d399" : "#fbbf24",
                                  border: `1px solid ${entry.source === "official" ? "rgba(52,211,153,0.2)" : "rgba(251,191,36,0.2)"}` }}>
                                  {entry.source === "official" ? "✓ official" : "★ live"}
                                </span>
                                <span style={{ fontWeight: 700, fontSize: "0.88rem", color: entry.pts > 0 ? "#f1f5f9" : "#475569", minWidth: 28, textAlign: "right" as const }}>
                                  {entry.pts}
                                </span>
                              </div>
                            </div>
                            {s && lines.length > 0 && (
                              <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "2px 10px", padding: "5px 8px", background: "rgba(255,255,255,0.02)", borderRadius: 7 }}>
                                {lines.map((line, li) => (
                                  <>
                                    <span key={`l${li}`} style={{ fontSize: "0.62rem", color: "#64748b" }}>{line.label}</span>
                                    <span key={`p${li}`} style={{ fontSize: "0.62rem", fontWeight: 600, color: line.pts >= 0 ? line.color : "#ef4444", textAlign: "right" as const }}>
                                      {line.pts > 0 ? "+" : ""}{line.pts}
                                    </span>
                                  </>
                                ))}
                              </div>
                            )}
                            {s && (() => {
                              const computed = lines.reduce((a, l) => a + l.pts, 0);
                              const diff = entry.pts - computed;
                              if (Math.abs(diff) > 0) {
                                const didBowl = s.ballsBowled > 0;
                                const residualLabel = didBowl ? "Dots & fielding / other" : "Fielding / other";
                                const residualHint = didBowl
                                  ? "Dot balls (2pts each) + any fielding not in API"
                                  : "Catches (8pts), runouts (10pts), stumpings (12pts), 3-catch bonus (4pts) — fielding not in API data";
                                return (
                                  <div style={{ padding: "4px 8px 0", marginTop: 2 }}>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "2px 10px" }}>
                                      <span style={{ fontSize: "0.62rem", color: "#475569" }}>{residualLabel}</span>
                                      <span style={{ fontSize: "0.62rem", fontWeight: 600, color: diff >= 0 ? "#a78bfa" : "#ef4444", textAlign: "right" as const }}>{diff > 0 ? "+" : ""}{diff}</span>
                                    </div>
                                    <div style={{ fontSize: "0.56rem", color: "#334155", marginTop: 1, lineHeight: 1.3 }}>{residualHint}</div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                            {!s && entry.source === "official" && (
                              <div style={{ fontSize: "0.6rem", color: "#475569", paddingLeft: 4, marginTop: 2 }}>Official score — stats syncing...</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginTop: 2, paddingTop: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#64748b" }}>
                        <span>Raw total</span>
                        <span style={{ color: "#94a3b8" }}>{raw} pts</span>
                      </div>
                      {multiplier && (
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#64748b", marginTop: 3 }}>
                          <span>Multiplier</span>
                          <span style={{ color: isCap ? "#fbbf24" : "#a78bfa" }}>{multiplier}</span>
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 700, marginTop: 6, color: inTop11 ? t.color : "#475569" }}>
                        <span>{inTop11 ? "Counts toward team" : "Bench (not counted)"}</span>
                        <span>{adj} pts</span>
                      </div>
                    </div>
                    <details style={{ marginTop: 10 }}>
                      <summary style={{ fontSize: "0.6rem", color: "#64748b", cursor: "pointer", userSelect: "none" as const, listStyle: "none" }}>
                        ℹ️ Scoring guide (tap to expand)
                      </summary>
                      <div style={{ marginTop: 6, padding: "8px 10px", background: "rgba(255,255,255,0.02)", borderRadius: 7, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3px 12px" }}>
                        {[
                          ["Playing XI", "+4"],
                          ["Run scored", "+1 each"],
                          ["Four", "+4"],
                          ["Six", "+6"],
                          ["25+ runs", "+4 bonus"],
                          ["50+ runs", "+8 bonus"],
                          ["75+ runs", "+12 bonus"],
                          ["100+ runs", "+16 bonus"],
                          ["Duck (bat)", "−2"],
                          ["SR >190", "+8"], ["SR >170", "+6"], ["SR >150", "+4"], ["SR ≥130", "+2"],
                          ["SR 70–100", "−2"], ["SR 60–70", "−4"], ["SR <60", "−6"],
                          ["Wicket", "+30"],
                          ["LBW / Bowled", "+8 bonus"],
                          ["3-wkt haul", "+8"], ["4-wkt haul", "+12"], ["5-wkt haul", "+16"],
                          ["Dot ball", "+2"],
                          ["Maiden over", "+12"],
                          ["Eco <5", "+8"], ["Eco <6", "+6"], ["Eco ≤7", "+4"], ["Eco ≤8", "+2"],
                          ["Eco 10–11", "−2"], ["Eco 11–12", "−4"], ["Eco >12", "−6"],
                          ["Catch", "+8"],
                          ["Run out", "+10"],
                          ["Stumping", "+12"],
                          ["3+ catches", "+4 bonus"],
                        ].map(([label, val], i) => (
                          <React.Fragment key={i}>
                            <span style={{ fontSize: "0.57rem", color: "#475569" }}>{label}</span>
                            <span style={{ fontSize: "0.57rem", color: val.startsWith("−") ? "#ef4444" : "#94a3b8", fontWeight: 600 }}>{val}</span>
                          </React.Fragment>
                        ))}
                      </div>
                    </details>
                  </>
                )}
              </div>
            );
          };

          // Per-player state helper
          const getPlayerState = (name: string, ipl: string) => {
            const isLiveNow = hasLiveNow && liveNowPlaying.has(name);
            const isUpcoming = hasNextMatch && nextMatchPlaying.has(name) && !isLiveNow;
            const isDimmed = hasAnyContext && !isLiveNow && !isUpcoming;
            const glowColor = isLiveNow ? "#f87171" : isUpcoming ? (IPL_COLORS[ipl] || "#4ade80") : null;
            return { isLiveNow, isUpcoming, isDimmed, glowColor };
          };

          return (() => {
            const xi = td.players.filter(p => td.top11.has(p.name)).sort((a, b) => b.adj - a.adj);
            const bench = td.players.filter(p => !td.top11.has(p.name)).sort((a, b) => b.adj - a.adj);
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

            const renderPlayer = (p: typeof xi[0], isBench: boolean) => {
              const isExp = expandedPlayer === p.name;
              const { isLiveNow, isUpcoming, isDimmed } = getPlayerState(p.name, p.ipl);
              const isCap = p.name === t.captain;
              const isVC = p.name === t.vc;
              const roleColor = ROLE_COLORS[p.role] || "var(--text-3)";
              const cardClass = [
                isBench ? "player-card benched" : "player-card",
                isCap ? "is-c" : isVC ? "is-vc" : "",
                isExp ? "player-expanded" : "",
                isLiveNow ? "live-now" : isUpcoming ? "playing-next" : isDimmed ? "not-playing-next" : ""
              ].filter(Boolean).join(" ");

              return (
                <React.Fragment key={p.name}>
                  <div className={cardClass} onClick={() => setExpandedPlayer(isExp ? null : p.name)}
                    style={isLiveNow ? { boxShadow: "inset 3px 0 0 #f87171, inset 0 0 0 1px rgba(248,113,113,0.12)" } : {}}>

                    {/* Status dot */}
                    {isLiveNow
                      ? <div className="playing-badge live-badge" />
                      : <div className="playing-badge" style={{ background: isUpcoming ? "#4ade80" : hasAnyContext ? "transparent" : isBench ? "transparent" : "#4ade80" }} />
                    }

                    {/* IPL team badge */}
                    <div className="player-ipl-badge" style={{
                      background: isBench ? IPL_COLORS[p.ipl] + "1a" : IPL_COLORS[p.ipl] + "30",
                      color: isBench ? IPL_COLORS[p.ipl] + "88" : IPL_COLORS[p.ipl],
                    }}>{p.ipl}</div>

                    {/* Name + role + sparkline */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "nowrap" as const }}>
                        <div className="player-name" style={{
                          color: isLiveNow ? "#fca5a5" : isBench ? "var(--text-2)" : "var(--text)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, maxWidth: "100%",
                        }}>{p.name}</div>
                        {isCap && <CaptainBadge />}
                        {isVC && <VCBadge />}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                        <span style={{
                          fontSize: "0.52rem", fontWeight: 800, letterSpacing: "0.04em",
                          padding: "1px 5px", borderRadius: 5,
                          color: isBench ? roleColor + "77" : roleColor,
                          background: roleColor + (isBench ? "10" : "18"),
                          border: `1px solid ${roleColor}${isBench ? "20" : "30"}`,
                          flexShrink: 0,
                        }}>{p.role}</span>
                        <Sparkline name={p.name} color={isBench ? t.color + "66" : t.color} />
                      </div>
                    </div>

                    {/* Points */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div className="player-pts" style={{
                        color: isLiveNow ? "#fca5a5"
                          : isBench ? "var(--text-3)"
                          : p.adj > 0 ? t.color : "var(--text-3)",
                        fontSize: isBench ? "1.05rem" : "1.18rem",
                      }}>{p.adj}</div>
                      {isCap && <div className="player-pts-raw">×2</div>}
                      {isVC && <div className="player-pts-raw">×1.5</div>}
                      {isBench && !isCap && !isVC && (
                        <div style={{ fontSize: "0.48rem", color: "var(--text-3)", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginTop: 1, opacity: 0.7 }}>bench</div>
                      )}
                    </div>
                  </div>
                  {isExp && renderBreakdown(p)}
                </React.Fragment>
              );
            };

            return (
              <>
                {/* === PLAYING XI HEADER === */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 10, padding: "9px 14px",
                  background: `linear-gradient(135deg, ${t.color}10 0%, rgba(255,255,255,0.03) 100%)`,
                  border: `1px solid ${t.color}28`,
                  borderRadius: 12,
                  boxShadow: `inset 0 1px 0 ${t.color}18, 0 2px 12px rgba(0,0,0,0.35)`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 3, height: 18, borderRadius: 2, background: `linear-gradient(180deg, ${t.color}, ${t.color}55)`, boxShadow: `0 0 8px ${t.color}60`, flexShrink: 0 }} />
                    <span style={{ fontSize: "0.62rem", fontWeight: 900, color: "var(--text)", letterSpacing: "0.12em", textTransform: "uppercase" as const }}>Playing XI</span>
                    <span style={{ fontSize: "0.55rem", fontWeight: 800, color: t.color, background: `${t.color}18`, border: `1px solid ${t.color}30`, padding: "1px 7px", borderRadius: 20, letterSpacing: "0.04em" }}>11</span>
                  </div>
                  {Object.keys(playerPoints).length > 0 && (
                    <span style={{ fontSize: "0.7rem", fontWeight: 900, color: t.color, fontFamily: "'Oswald', sans-serif", letterSpacing: "0.02em" }}>{xiTotal} <span style={{ fontSize: "0.5rem", fontWeight: 700, opacity: 0.7, letterSpacing: "0.1em" }}>PTS</span></span>
                  )}
                </div>
                <div className="players-grid" style={{ borderTop: `2px solid ${t.color}38`, borderRadius: "var(--radius-md)", marginBottom: 4 }}>
                  {xi.map(p => renderPlayer(p, false))}
                </div>

                {/* === BENCH TOGGLE === */}
                <button
                  onClick={() => setBenchOpen(o => !o)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", marginTop: 10, marginBottom: benchOpen ? 10 : 0,
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 12, cursor: "pointer", padding: "9px 14px",
                    WebkitTapHighlightColor: "transparent",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                  }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 3, height: 18, borderRadius: 2, background: "rgba(255,255,255,0.15)", flexShrink: 0 }} />
                    <span style={{ fontSize: "0.62rem", fontWeight: 900, color: "var(--text-2)", letterSpacing: "0.12em", textTransform: "uppercase" as const }}>Bench</span>
                    <span style={{ fontSize: "0.55rem", fontWeight: 800, color: "var(--text-3)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", padding: "1px 7px", borderRadius: 20, letterSpacing: "0.04em" }}>{bench.length}</span>
                    {Object.keys(playerPoints).length > 0 && benchTotal > 0 && (
                      <span style={{ fontSize: "0.55rem", color: "var(--text-3)", opacity: 0.6, fontStyle: "italic" as const }}>{benchTotal} pts idle</span>
                    )}
                  </div>
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none" style={{ transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)", transform: benchOpen ? "rotate(180deg)" : "none", flexShrink: 0 }}>
                    <path d="M1 1l5 5 5-5" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {/* === BENCH GRID === */}
                {benchOpen && (
                  <div className="players-grid" style={{ opacity: 0.78, borderTop: "1.5px solid rgba(255,255,255,0.05)", borderRadius: "var(--radius-md)" }}>
                    {bench.map(p => renderPlayer(p, true))}
                  </div>
                )}

                {/* === POINTS FROM EACH MATCH === */}
                {(() => {
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
                    const isCap = name === t.captain;
                    const isVC = name === t.vc;
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
                        ...p, isCap: p.name === t.captain, isVC: p.name === t.vc,
                        pts: getAdj(p.name, mn),
                      })).sort((a, b) => b.pts - a.pts);
                    const total = players.reduce((s, p) => s + p.pts, 0);
                    return { mn, label: matchLabels[mn] || `Match ${mn}`, players, total };
                  });

                  const grandTotal = matchData.reduce((s, m) => s + m.total, 0);

                  return (
                    <div style={{ marginTop: 10 }}>
                      <button
                        onClick={() => setMatchPtsOpen(o => !o)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          width: "100%", marginBottom: matchPtsOpen ? 12 : 0,
                          background: "linear-gradient(135deg, rgba(245,166,35,0.07) 0%, rgba(255,255,255,0.02) 100%)",
                          border: "1px solid rgba(245,166,35,0.2)", borderRadius: 12, cursor: "pointer",
                          padding: "9px 14px", WebkitTapHighlightColor: "transparent",
                          boxShadow: "inset 0 1px 0 rgba(245,166,35,0.12)",
                        }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 3, height: 18, borderRadius: 2, background: "linear-gradient(180deg, var(--gold), rgba(245,166,35,0.4))", boxShadow: "0 0 8px rgba(245,166,35,0.5)", flexShrink: 0 }} />
                          <span style={{ fontSize: "0.62rem", fontWeight: 900, color: "var(--text)", letterSpacing: "0.12em", textTransform: "uppercase" as const }}>Match Points</span>
                          {grandTotal > 0 && <span style={{ fontSize: "0.7rem", color: "var(--gold)", fontWeight: 900, fontFamily: "'Oswald', sans-serif", letterSpacing: "0.02em" }}>{grandTotal} <span style={{ fontSize: "0.5rem", opacity: 0.7, letterSpacing: "0.1em", fontWeight: 700 }}>PTS</span></span>}
                        </div>
                        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" style={{ transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)", transform: matchPtsOpen ? "rotate(180deg)" : "none", flexShrink: 0 }}>
                          <path d="M1 1l5 5 5-5" stroke="rgba(245,166,35,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>

                      {matchPtsOpen && (
                        <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                          {matchData.map(({ mn, label, players, total }) => {
                            const short = shortLabel(label);
                            const isExpanded = expandedMatchNums.has(mn);
                            const toggleMn = () => setExpandedMatchNums(prev => {
                              const n = new Set(prev); n.has(mn) ? n.delete(mn) : n.add(mn); return n;
                            });
                            const scoreColor = total >= 150 ? "#d4a843" : total >= 100 ? "#fb923c" : "var(--text)";
                            return (
                              <div key={mn} style={{ borderRadius: 12, border: `1px solid ${isExpanded ? "rgba(245,166,35,0.2)" : "var(--border)"}`, overflow: "hidden" as const, background: isExpanded ? "rgba(245,166,35,0.04)" : "rgba(255,255,255,0.02)", transition: "all 0.18s ease" }}>
                                <button onClick={toggleMn} style={{ display: "flex", alignItems: "center", width: "100%", background: "transparent", border: "none", cursor: "pointer", padding: "10px 12px", gap: 9, WebkitTapHighlightColor: "transparent" }}>
                                  <span style={{ fontSize: "0.5rem", fontWeight: 900, color: "var(--text-3)", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "2px 6px", flexShrink: 0, letterSpacing: "0.06em" }}>M{mn}</span>
                                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-2)", flex: 1, textAlign: "left" as const, letterSpacing: "-0.01em" }}>{short}</span>
                                  <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: "1rem", fontWeight: 700, color: scoreColor, flexShrink: 0 }}>{total}</span>
                                  <span style={{ fontSize: "0.48rem", color: "var(--text-3)", flexShrink: 0, letterSpacing: "0.08em", fontWeight: 700 }}>PTS</span>
                                  <svg width="8" height="6" viewBox="0 0 10 6" fill="none" style={{ transition: "transform 0.22s cubic-bezier(0.4,0,0.2,1)", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>
                                    <path d="M1 1l4 4 4-4" stroke="rgba(255,255,255,0.25)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                </button>
                                {isExpanded && (
                                  <div style={{ borderTop: "1px solid rgba(245,166,35,0.12)", padding: "6px 12px 10px" }}>
                                    {players.map((p, i) => (
                                      <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0", borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                                        <span style={{ fontSize: "0.67rem", flex: 1, color: p.pts === 0 ? "var(--text-3)" : "var(--text-2)", fontWeight: p.pts !== 0 ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                                          {p.name}
                                        </span>
                                        {p.isCap && <span style={{ fontSize: "0.44rem", fontWeight: 900, color: "#d4a843", background: "rgba(212,168,67,0.2)", border: "1px solid rgba(212,168,67,0.45)", borderRadius: 4, padding: "1px 4px", lineHeight: 1.4, flexShrink: 0 }}>C × 2</span>}
                                        {p.isVC && <span style={{ fontSize: "0.44rem", fontWeight: 900, color: "#94a3b8", background: "rgba(148,163,184,0.14)", border: "1px solid rgba(148,163,184,0.3)", borderRadius: 4, padding: "1px 4px", lineHeight: 1.4, flexShrink: 0 }}>VC × 1.5</span>}
                                        <span style={{ fontSize: "0.72rem", fontWeight: 700, minWidth: 28, textAlign: "right" as const, fontFamily: "'Oswald', sans-serif", color: p.pts === 0 ? "var(--text-3)" : p.pts >= 60 ? "#d4a843" : p.pts >= 40 ? "#fb923c" : "#4ade80" }}>
                                          {p.pts === 0 ? "—" : "+" + p.pts}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            );
          })()
        })()}
      </div>
    );
  };

  const renderFixtures = () => {
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
            <div className="sec-title">Points Table</div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" as const, fontSize: "0.68rem", tableLayout: "fixed" as const }}>
                <colgroup>
                  <col style={{ width: 28 }} />
                  <col />
                  <col style={{ width: 30 }} />
                  <col style={{ width: 30 }} />
                  <col style={{ width: 30 }} />
                  <col style={{ width: 56 }} />
                  <col style={{ width: 34 }} />
                </colgroup>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["#","TEAM","M","W","L","NRR","PTS"].map((h, hi) => (
                      <th key={h} style={{
                        padding: "7px 0", fontWeight: 600, fontSize: "0.58rem", letterSpacing: "0.06em",
                        color: "var(--text-3)",
                        textAlign: (hi === 0 || hi === 1 ? "left" : "center") as "left"|"center",
                        paddingLeft: hi === 0 ? 12 : hi === 1 ? 4 : 0,
                        paddingRight: hi === 6 ? 12 : 0,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {standings.map((t: any, i: number) => {
                    const color = IPL_COLORS[t.teamCode] || "var(--text-3)";
                    const isTop4 = i < 4;
                    const isSelected = teamFilter.has(t.teamCode);
                    const logoUrl = TEAM_LOGO_CDN[t.teamCode] || t.teamLogo;
                    return (
                      <tr key={t.teamCode}
                        onClick={() => toggleTeamFilter(t.teamCode)}
                        style={{ borderBottom: "1px solid var(--border)", cursor: "pointer", background: isSelected ? color + "14" : "transparent", transition: "background 0.15s" }}>
                        <td style={{ padding: "8px 0 8px 12px", color: isTop4 ? "#22c55e" : "var(--text-3)", fontWeight: 700, fontSize: "0.68rem" }}>{i + 1}</td>
                        <td style={{ padding: "8px 4px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 2, height: 18, borderRadius: 2, background: color, flexShrink: 0 }} />
                            {logoUrl
                              ? <img src={logoUrl} alt={t.teamCode} style={{ width: 20, height: 20, objectFit: "contain", flexShrink: 0 }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                              : <div style={{ width: 20, height: 20, borderRadius: "50%", background: color + "33", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.5rem", fontWeight: 700, color, flexShrink: 0 }}>{t.teamCode.slice(0,2)}</div>
                            }
                            <span style={{ fontWeight: 700, color, fontSize: "0.68rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{t.teamCode}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: "center" as const, padding: "8px 0", color: "var(--text-2)", fontWeight: 500 }}>{t.matches}</td>
                        <td style={{ textAlign: "center" as const, padding: "8px 0", color: "#22c55e", fontWeight: 700 }}>{t.won}</td>
                        <td style={{ textAlign: "center" as const, padding: "8px 0", color: "#f87171", fontWeight: 500 }}>{t.lost}</td>
                        <td style={{ textAlign: "center" as const, padding: "8px 0", color: t.nrr >= 0 ? "#22c55e" : "#f87171", fontSize: "0.6rem", fontWeight: 500 }}>
                          {t.nrr >= 0 ? "+" : ""}{t.nrr.toFixed(3)}
                        </td>
                        <td style={{ textAlign: "center" as const, padding: "8px 12px 8px 0", fontSize: "0.82rem", fontWeight: 800, color }}>
                          {t.points}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "5px 12px", fontSize: "0.58rem", color: "var(--text-3)", borderTop: "1px solid var(--border)", letterSpacing: "0.04em" }}>
              Top 4 qualify for playoffs
            </div>
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
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {(["live", "upcoming", "completed", "all"] as const).map(f => {
            const count = f === "live" ? live.length : f === "upcoming" ? upcoming.length : f === "completed" ? completed.length : liveMatches.length;
            const isActive = activeFilter === f;
            return (
              <button key={f} onClick={() => setMatchFilter(f)}
                style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: "1px solid", fontSize: "0.65rem", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" as const,
                  background: isActive ? "var(--surface-2)" : "transparent",
                  borderColor: isActive ? "var(--border-2)" : "var(--border)",
                  color: isActive ? (f === "live" ? "#22c55e" : f === "upcoming" ? "var(--blue)" : "var(--text)") : "var(--text-3)" }}>
                {f}<br />
                <span style={{ fontSize: "0.6rem", opacity: 0.7 }}>{count}</span>
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
              const isExpanded = expandedMatchId === String(m.id);
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
                    filter: "blur(3px) brightness(0.32) saturate(1.1)",
                  }} />
                  <div style={{
                    position: "absolute", inset: 0, zIndex: 1,
                    background: "linear-gradient(160deg, rgba(10,7,5,0.52) 0%, rgba(6,4,3,0.62) 100%)",
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
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    {teams.length > 0 ? teams.map((ti: any, i: number) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {i === 1 && <span style={{ fontFamily: "'Oswald', sans-serif", color: "var(--text-3)", fontSize: "0.65rem", letterSpacing: "0.1em", margin: "0 1px" }}>VS</span>}
                        <img src={TEAM_LOGO_CDN[ti.shortname] || ti.img} alt={ti.shortname} style={{ width: 20, height: 20, objectFit: "contain", filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.7))" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                        <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: "1.05rem", fontWeight: 500, letterSpacing: "0.05em", color: "var(--text)", textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}>{ti.shortname}</span>
                      </div>
                    )) : (
                      <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: "1rem", fontWeight: 500, letterSpacing: "0.04em", color: "var(--text)", textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}>{(m.name || "").replace(/,\s*\d+(?:st|nd|rd|th) Match.*/i, "")}</div>
                    )}
                  </div>
                  {(m.score || []).map((s: any, i: number) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-2)", padding: "3px 0", borderTop: i === 0 ? "1px solid var(--border)" : "none" }}>
                      <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: "0.68rem", letterSpacing: "0.04em", color: "var(--text-3)" }}>{(s.inning || "").replace(" Innings", "").replace(" Inning", "")}</span>
                      <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: "0.78rem", fontWeight: 500, letterSpacing: "0.03em", color: "var(--text-2)" }}>
                        {s.summary || (s.r != null ? `${s.r}/${s.w} (${s.o}ov)` : "")}
                      </span>
                    </div>
                  ))}
                  {isDone && m.status && <div style={{ fontSize: "0.68rem", color: "var(--blue)", marginTop: 5 }}>{m.status}</div>}
                  {isLive && m.toss && <div style={{ fontSize: "0.65rem", color: "var(--text-2)", marginTop: 5 }}>{m.toss}</div>}
                  {m.venue && (
                    <div className="match-venue">
                      🏟 {m.venue}{m.homeTeamCode ? ` (${m.homeTeamCode})` : ""}
                    </div>
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
                            <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: "0.62rem", letterSpacing: "0.14em", fontWeight: isLocked || isDone ? 400 : 500, color: isDone || isLocked ? "var(--text-3)" : "var(--gold)" }}>
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
                              const canEdit = !isLocked && (ownerId === currentUser || currentUser === "rajveer");
                              return canEdit ? (
                                /* Big team pick cards */
                                <div key={ownerId} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
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
                                            if (newPick) {
                                              setPredFlash(flashKey);
                                              setTimeout(() => setPredFlash(k => k === flashKey ? null : k), 700);
                                            }
                                            lastPredSaveRef.current = Date.now();
                                            setPredictions(prev => {
                                              const updated = { ...prev, [matchIdStr]: { ...(prev[matchIdStr] || {}), [ownerId]: newPick } };
                                              saveLocalPreds(updated);
                                              return updated;
                                            });
                                            fetch(`/api/ipl/predictions/${encodeURIComponent(matchIdStr)}`, {
                                              method: "POST",
                                              headers: { "Content-Type": "application/json" },
                                              body: JSON.stringify({ ownerId, pick: newPick }),
                                            }).then(r => r.json()).then(d => {
                                              if (d.predictions) {
                                                lastPredSaveRef.current = Date.now();
                                                saveLocalPreds(d.predictions);
                                                setPredictions(d.predictions);
                                              } else {
                                                lastPredSaveRef.current = 0;
                                                setPredictions(prev => {
                                                  const reverted = { ...prev, [matchIdStr]: { ...(prev[matchIdStr] || {}), [ownerId]: pick } };
                                                  saveLocalPreds(reverted);
                                                  return reverted;
                                                });
                                              }
                                            }).catch(() => {
                                              lastPredSaveRef.current = 0;
                                              setPredictions(prev => {
                                                const reverted = { ...prev, [matchIdStr]: { ...(prev[matchIdStr] || {}), [ownerId]: pick } };
                                                saveLocalPreds(reverted);
                                                return reverted;
                                              });
                                            });
                                          }}>
                                          <img src={TEAM_LOGO_CDN[code]} alt={code} style={{ width: 24, height: 24, objectFit: "contain", filter: isSelected ? "none" : "grayscale(0.3) opacity(0.7)", transition: "filter 0.2s" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                                          <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: "0.68rem", fontWeight: 500, letterSpacing: "0.06em", color: isSelected ? "var(--text)" : "var(--text-3)", transition: "color 0.2s" }}>{code}</span>
                                          {isSelected && (
                                            <div style={{ position: "absolute", top: 4, right: 4, width: 12, height: 12, borderRadius: "50%", background: teamColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                              <svg width="7" height="7" viewBox="0 0 10 10" fill="none"><path d="M1.5 5l2.8 2.8L8.5 2.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                            </div>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : (
                                /* Compact read-only row */
                                <div key={ownerId} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
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
                                </div>
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
                                <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: "0.62rem", color: "var(--text-3)", letterSpacing: "0.14em", fontWeight: 400 }}>MATCH INTEL</div>
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
                  {/* Scorecard collapsible — live and completed matches only */}
                  {(isDone || isLive) && (
                    <div style={{ marginTop: 10, borderTop: "1px solid var(--border)", paddingTop: 7 }}
                      onClick={e => e.stopPropagation()}>
                      {/* Toggle header */}
                      <div onClick={() => toggleMatch(matchIdStr, isDone, isLive)}
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", userSelect: "none" as const }}>
                        <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: "0.62rem", color: "var(--text-3)", fontWeight: 400, letterSpacing: "0.14em" }}>SCORECARD</span>
                        <span style={{ fontSize: "0.55rem", color: "var(--text-3)", display: "inline-block", transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "none" }}>▼</span>
                      </div>
                      {isExpanded && (
                        <div style={{ marginTop: 10 }}>
                          {isLoadingSc && <div style={{ color: "var(--text-3)", fontSize: "0.72rem", padding: "8px 0" }}>Loading scorecard...</div>}
                          {sc?.overview && (
                            <div style={{ display: "flex", flexDirection: "column" as const, gap: 4, marginBottom: 12 }}>
                              {sc.overview.toss && <div style={{ fontSize: "0.65rem", color: "var(--text-3)" }}>{sc.overview.toss}</div>}
                              {sc.overview.result && <div style={{ fontSize: "0.68rem", color: "var(--text-2)", fontWeight: 500 }}>{sc.overview.result}</div>}
                            </div>
                          )}
                          {sc && !sc.hasScorecard && (
                            <div style={{ color: "var(--text-3)", fontSize: "0.72rem", padding: "4px 0" }}>
                              Scorecard will appear once innings data is synced.
                            </div>
                          )}
                      {(sc?.innings || []).map((inn: any, idx: number) => {
                        const innKey = `${matchIdStr}-${idx}`;
                        const isCollapsed = collapsedInnings.has(innKey);
                        const toggleInn = (e: React.MouseEvent) => {
                          e.stopPropagation();
                          setCollapsedInnings(prev => { const n = new Set(prev); n.has(innKey) ? n.delete(innKey) : n.add(innKey); return n; });
                        };

                        // Fantasy-scoring colour helpers
                        const runsColor = (runs: number, balls: number) => {
                          if (runs === 0 && balls > 0) return "#f87171";
                          if (runs >= 100) return "#d4a843";
                          if (runs >= 50) return "#fb923c";
                          if (runs >= 30) return "#f59e0b";
                          return "var(--text)";
                        };
                        const srColor = (sr: number, balls: number) => {
                          if (balls < 5) return "var(--text-3)";
                          if (sr >= 200) return "#22c55e";
                          if (sr >= 150) return "#86efac";
                          if (sr < 70) return "#f87171";
                          return "var(--text-3)";
                        };
                        const wicketsColor = (w: number) => {
                          if (w >= 4) return "#d4a843";
                          if (w === 3) return "#22c55e";
                          if (w === 2) return "#4ade80";
                          if (w === 1) return "var(--text)";
                          return "var(--text-3)";
                        };
                        const ecoColor = (eco: number) => {
                          if (eco < 6) return "#22c55e";
                          if (eco < 8) return "#86efac";
                          if (eco < 10) return "var(--text-3)";
                          if (eco < 12) return "#f59e0b";
                          return "#f87171";
                        };
                        // Find which fantasy team owns this player
                        const findFt = (name: string) => {
                          const norm = (s: string) => s
                            .replace(/\s*\(.*?\)\s*/g, "") // strip suffixes like (RP), (c)
                            .trim().toLowerCase();
                          // Known spelling variants: scorecard form → teams.ts form
                          const ALIASES: Record<string, string> = {
                            "mohammad shami": "mohammed shami",
                            "md shami": "mohammed shami",
                          };
                          const sn = ALIASES[norm(name)] ?? norm(name);
                          for (const ft of Object.values(FANTASY_TEAMS)) {
                            if (ft.players.some(p => norm(p.name) === sn)) return ft;
                          }
                          return null;
                        };

                        // Shared table config
                        const COL_W = ["auto", 36, 28, 30, 28, 54] as const;
                        const colGroup = (
                          <colgroup>
                            <col style={{ width: COL_W[0] }} />
                            {COL_W.slice(1).map((w, i) => <col key={i} style={{ width: w }} />)}
                          </colgroup>
                        );
                        const tdNum = (extra?: React.CSSProperties): React.CSSProperties => ({ textAlign: "right", paddingTop: 5, paddingBottom: 5, paddingLeft: 2, paddingRight: 5, ...extra });
                        const thNum = (extra?: React.CSSProperties): React.CSSProperties => ({ textAlign: "right", paddingTop: 4, paddingBottom: 4, paddingLeft: 2, paddingRight: 5, fontWeight: 600, ...extra });
                        const tblStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: "0.68rem", tableLayout: "fixed" };

                        return (
                          <div key={idx} style={{ marginBottom: idx < (sc?.innings?.length ?? 1) - 1 ? 10 : 0 }}>
                            {/* Collapsible innings header */}
                            <div onClick={toggleInn} className="inn-hdr" style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              cursor: "pointer", userSelect: "none",
                              padding: "6px 10px",
                              borderRadius: isCollapsed ? 7 : "7px 7px 0 0",
                              borderBottom: isCollapsed ? undefined : "none",
                            }}>
                              <div style={{ fontSize: "0.63rem", fontWeight: 700, color: "var(--text)", letterSpacing: "0.06em", textTransform: "uppercase" as const }}>
                                {inn.name} · <span style={{ color: "#f5a623" }}>{inn.total}</span>
                              </div>
                              <span style={{ fontSize: "0.5rem", color: "var(--text-3)", display: "inline-block", transition: "transform 0.2s", transform: isCollapsed ? "none" : "rotate(180deg)" }}>▼</span>
                            </div>

                            {!isCollapsed && (
                              <div className="inn-body">
                                {inn.batting?.length > 0 && (
                                  <div style={{ overflowX: "auto" }}>
                                    <table style={tblStyle}>
                                      {colGroup}
                                      <thead>
                                        <tr style={{ color: "var(--text-3)", borderBottom: "1px solid var(--border)" }}>
                                          <th style={{ textAlign: "left", padding: "4px 6px", fontWeight: 600 }}>Batter</th>
                                          <th style={thNum()}>R</th>
                                          <th style={thNum()}>B</th>
                                          <th style={thNum()}>4s</th>
                                          <th style={thNum()}>6s</th>
                                          <th style={thNum({ paddingRight: 9 })}>SR</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {inn.batting.filter((b: any) => !b.dnb).map((b: any, bi: number) => {
                                          const ft = findFt(b.name);
                                          const rc = runsColor(b.runs, b.balls);
                                          const src = srColor(parseFloat(b.sr), b.balls);
                                          return (
                                            <tr key={bi} style={{ borderBottom: "1px solid var(--border)", background: ft ? `${ft.color}09` : "transparent" }}>
                                              <td style={{ padding: "5px 0 5px 6px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                  <span style={{ color: b.notOut ? "#22c55e" : "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: ft ? 600 : 400 }}>{b.name}</span>
                                                  {ft && <span style={{ fontSize: "0.5rem", fontWeight: 800, color: ft.color, background: `${ft.color}1a`, borderRadius: 3, padding: "0 3px", lineHeight: "1.5", flexShrink: 0 }}>F</span>}
                                                </div>
                                                <div style={{ color: "var(--text-3)", fontSize: "0.58rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.dismissal}</div>
                                              </td>
                                              <td style={tdNum({ color: rc, fontWeight: b.runs >= 30 ? 700 : 400 })}>{b.runs}</td>
                                              <td style={tdNum({ color: "var(--text-3)" })}>{b.balls}</td>
                                              <td style={tdNum({ color: b.fours > 0 ? "var(--blue)" : "var(--text-3)" })}>{b.fours}</td>
                                              <td style={tdNum({ color: b.sixes > 0 ? "#a855f7" : "var(--text-3)" })}>{b.sixes}</td>
                                              <td style={tdNum({ color: src, fontSize: "0.62rem", paddingRight: 9 })}>{parseFloat(b.sr).toFixed(1)}</td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                                {inn.bowling?.length > 0 && (
                                  <div style={{ marginTop: 6, overflowX: "auto" }}>
                                    <table style={tblStyle}>
                                      {colGroup}
                                      <thead>
                                        <tr style={{ color: "var(--text-3)", borderBottom: "1px solid var(--border)" }}>
                                          <th style={{ textAlign: "left", padding: "4px 6px", fontWeight: 600 }}>Bowler</th>
                                          <th style={thNum()}>O</th>
                                          <th style={thNum()}>M</th>
                                          <th style={thNum()}>R</th>
                                          <th style={thNum()}>W</th>
                                          <th style={thNum({ paddingRight: 9 })}>ECO</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {inn.bowling.map((b: any, bi: number) => {
                                          const ft = findFt(b.name);
                                          const wc = wicketsColor(b.wickets);
                                          const ec = ecoColor(parseFloat(b.eco));
                                          return (
                                            <tr key={bi} style={{ borderBottom: "1px solid var(--border)", background: ft ? `${ft.color}09` : "transparent" }}>
                                              <td style={{ padding: "5px 0 5px 6px", overflow: "hidden" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 4, overflow: "hidden" }}>
                                                  <span style={{ color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: ft ? 600 : 400 }}>{b.name}</span>
                                                  {ft && <span style={{ fontSize: "0.5rem", fontWeight: 800, color: ft.color, background: `${ft.color}1a`, borderRadius: 3, padding: "0 3px", lineHeight: "1.5", flexShrink: 0 }}>F</span>}
                                                </div>
                                              </td>
                                              <td style={tdNum({ color: "var(--text-3)" })}>{b.overs}</td>
                                              <td style={tdNum({ color: b.maidens > 0 ? "#f59e0b" : "var(--text-3)" })}>{b.maidens}</td>
                                              <td style={tdNum({ color: "var(--text-3)" })}>{b.runs}</td>
                                              <td style={tdNum({ color: wc, fontWeight: b.wickets > 0 ? 700 : 400 })}>{b.wickets}</td>
                                              <td style={tdNum({ color: ec, fontSize: "0.62rem", paddingRight: 9 })}>{parseFloat(b.eco).toFixed(2)}</td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                        </div>
                      )}
                    </div>
                  )}
                  </div>{/* /zIndex-2 wrapper */}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const STAT_CATS = [
    { id: "fantasyPts", label: "Fantasy Pts", sub: "Most Fantasy Points" },
    { id: "orangeCap", label: "Orange Cap", sub: "Most Runs" },
    { id: "purpleCap", label: "Purple Cap", sub: "Most Wickets" },
    { id: "sixesLeader", label: "Sixes", sub: "Most Sixes" },
    { id: "foursLeader", label: "Fours", sub: "Most Fours" },
    { id: "srLeader", label: "Strike Rate", sub: "Min 10 balls" },
    { id: "ecoLeader", label: "Economy", sub: "Min 2 overs" },
  ] as const;

  const renderStatRow = (entry: any, i: number, cat: string) => {
    const isBat = ["orangeCap", "sixesLeader", "foursLeader", "srLeader"].includes(cat);
    const rankColors = ["#d4a843", "var(--text-2)", "var(--text-2)"];
    const statColor = i === 0 ? "#d4a843" : i < 3 ? "var(--text)" : "var(--blue)";
    return (
      <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ width: 18, textAlign: "center" as const, fontSize: "0.68rem", fontWeight: 700, color: i < 3 ? rankColors[i] : "var(--text-3)", flexShrink: 0 }}>{i + 1}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "0.82rem", fontWeight: 500, color: entry.isFantasy ? "var(--text)" : "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
            {entry.name}
            {entry.isFantasy && <span style={{ marginLeft: 6, fontSize: "0.55rem", background: "rgba(34,197,94,0.12)", color: "#22c55e", borderRadius: 4, padding: "1px 5px", verticalAlign: "middle" }}>F</span>}
          </div>
          {isBat ? (
            <div style={{ fontSize: "0.62rem", color: "var(--text-3)", marginTop: 1 }}>
              {cat === "orangeCap" && `HS: ${entry.hs} · SR: ${entry.sr} · ${entry.innings} inn`}
              {cat === "sixesLeader" && `Runs: ${entry.runs} · SR: ${entry.sr}`}
              {cat === "foursLeader" && `Runs: ${entry.runs} · SR: ${entry.sr}`}
              {cat === "srLeader" && `${entry.runs} off ${entry.balls}b · ${entry.innings} inn`}
            </div>
          ) : (
            <div style={{ fontSize: "0.62rem", color: "var(--text-3)", marginTop: 1 }}>
              {cat === "purpleCap" && `Best: ${entry.best} · Eco: ${entry.eco} · ${entry.innings} inn`}
              {cat === "ecoLeader" && `${entry.wickets}W · ${entry.overs} ov`}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" as const, flexShrink: 0 }}>
          <div style={{ fontSize: "1.3rem", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1, color: statColor }}>
            {cat === "orangeCap" && entry.runs}
            {cat === "purpleCap" && entry.wickets}
            {cat === "sixesLeader" && entry.sixes}
            {cat === "foursLeader" && entry.fours}
            {cat === "srLeader" && entry.sr}
            {cat === "ecoLeader" && entry.eco}
          </div>
          <div style={{ fontSize: "0.55rem", color: "var(--text-3)", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginTop: 2 }}>
            {cat === "orangeCap" && "runs"}
            {cat === "purpleCap" && "wkts"}
            {cat === "sixesLeader" && "sixes"}
            {cat === "foursLeader" && "fours"}
            {cat === "srLeader" && "sr"}
            {cat === "ecoLeader" && "eco"}
          </div>
        </div>
      </div>
    );
  };

  const renderStats = () => {
    const cat = statsCategory;
    const raw: any[] = iplStats?.[cat] || [];
    const entries = statsFilter === "fantasy" ? raw.filter((e: any) => e.isFantasy) : raw;

    return (
      <div>
        <div className="sec-title">IPL 2026 Stats</div>

        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {([["all", "All IPL"], ["fantasy", "Fantasy Only"], ["predictions", "Predictions"]] as [string, string][]).map(([f, label]) => (
            <button key={f} onClick={() => { setStatsFilter(f as any); setStatsExpanded(false); }}
              style={{ flex: 1, padding: "8px 0", borderRadius: 10, border: "1px solid", fontSize: "0.68rem", fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
                background: statsFilter === f ? "var(--surface-2)" : "transparent",
                borderColor: statsFilter === f ? "var(--border-2)" : "var(--border)",
                color: statsFilter === f ? (f === "fantasy" ? "#22c55e" : f === "predictions" ? "#a78bfa" : "var(--text)") : "var(--text-3)" }}>
              {label}
            </button>
          ))}
        </div>

        {statsFilter !== "predictions" && (
          <div data-no-swipe="true" style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, marginBottom: 12, marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16 }}>
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

          const totalScorable = sortedMatches.filter((m: any) => m.matchNum > 3 && m.matchEnded).length;

          return (
            <>
              {/* Score cards */}
              {(() => {
                const PRED_BG: Record<string, string> = {
                  rajveer:  `${import.meta.env.BASE_URL}lb-bg-rajveer.jpeg`,
                  mombasa:  `${import.meta.env.BASE_URL}lb-bg-mombasa.jpeg`,
                  mumbai:   `${import.meta.env.BASE_URL}lb-bg-mumbai.jpeg`,
                  ponygoat: `${import.meta.env.BASE_URL}lb-bg-ponygoat.jpeg`,
                };
                return (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 12 }}>
                    {PRED_OWNERS.map(id => {
                      const ft = FANTASY_TEAMS[id];
                      return (
                        <div key={id} style={{ position: "relative", border: `1px solid ${ft.color}33`, borderRadius: 10, padding: "10px 4px", textAlign: "center" as const, overflow: "hidden" }}>
                          {/* Blurred team artwork background */}
                          <div style={{
                            position: "absolute", inset: -6, zIndex: 0,
                            backgroundImage: `url(${PRED_BG[id]})`,
                            backgroundSize: "cover", backgroundPosition: "center 30%",
                            filter: "blur(8px) brightness(0.45) saturate(1.5)",
                          }} />
                          {/* Gradient overlay */}
                          <div style={{
                            position: "absolute", inset: 0, zIndex: 1,
                            background: `linear-gradient(135deg, ${ft.color}28 0%, rgba(6,4,2,0.38) 100%)`,
                          }} />
                          {/* Content */}
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

              {/* Match table */}
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
                    {/* Archive section — all completed matches */}
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

                    {/* Current / upcoming matches */}
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
                      const officialPts = fi ? (playerPoints[entry.name] ?? playerPoints[entry.name.toLowerCase()]) : undefined;
                      all.push({ name: entry.name, pts: officialPts != null ? officialPts : (entry.fantasyPts ?? 0), isFantasy: !!fi, color: fi?.color ?? "var(--text-3)", owner: fi?.owner ?? "" });
                    }
                    return all.sort((a, b) => b.pts - a.pts);
                  })();
              const visible = fantasyPtsOpen ? ranked : ranked.slice(0, 10);
              const rankColors = ["#d4a843", "#94a3b8", "#cd7c3a"];
              return (
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", marginBottom: 12 }}>
                  <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text)" }}>Most Fantasy Points</div>
                    <div style={{ fontSize: "0.6rem", color: "var(--text-3)" }}>{ranked.length} players</div>
                  </div>
                  {visible.map((p, i) => (
                    <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: i < visible.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <div style={{ width: 18, textAlign: "center" as const, fontSize: "0.68rem", fontWeight: 700, color: i < 3 ? rankColors[i] : "var(--text-3)", flexShrink: 0 }}>{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                          {p.name}
                        </div>
                        {statsFilter === "fantasy" && p.isFantasy && <div style={{ fontSize: "0.58rem", color: p.color, marginTop: 1 }}>{p.owner}</div>}
                      </div>
                      <div style={{ fontSize: "1rem", fontWeight: 700, color: i === 0 ? "#d4a843" : i < 3 ? "var(--text)" : "var(--text-2)", flexShrink: 0 }}>{p.pts}</div>
                      <div style={{ fontSize: "0.55rem", color: "var(--text-3)", flexShrink: 0, marginLeft: -4 }}>pts</div>
                    </div>
                  ))}
                  {ranked.length > 10 && (
                    <button onClick={() => setFantasyPtsOpen(x => !x)}
                      style={{ width: "100%", padding: "11px 0", background: "transparent", border: "none", borderTop: "1px solid var(--border)", cursor: "pointer", fontSize: "0.68rem", color: "var(--text-3)", fontFamily: "inherit" }}>
                      {fantasyPtsOpen ? "Show less" : `Show all ${ranked.length}`}
                    </button>
                  )}
                </div>
              );
            })()}
            {cat !== "fantasyPts" && !iplStats && statsLoading && (
              <div style={{ color: "var(--text-3)", fontSize: "0.78rem", textAlign: "center" as const, padding: "24px 0" }}>Loading stats...</div>
            )}
            {cat !== "fantasyPts" && iplStats && entries.length === 0 && (
              <div style={{ color: "var(--text-3)", fontSize: "0.78rem", textAlign: "center" as const, padding: "24px 0" }}>
                {iplStats.matchesProcessed === 0 ? "Stats will appear once match innings data is synced." : `No ${statsFilter === "fantasy" ? "fantasy " : ""}players found.`}
              </div>
            )}
            {cat !== "fantasyPts" && entries.length > 0 && (() => {
              const visible = statsExpanded ? entries : entries.slice(0, 10);
              const hasMore = entries.length > 10;
              return (
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", marginBottom: 12 }}>
                  <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text)" }}>
                      {STAT_CATS.find(c => c.id === cat)?.sub}
                    </div>
                    <div style={{ fontSize: "0.6rem", color: "var(--text-3)" }}>{iplStats.matchesProcessed} matches</div>
                  </div>
                  {visible.map((e: any, i: number) => renderStatRow(e, i, cat))}
                  {hasMore && (
                    <button onClick={() => setStatsExpanded(x => !x)}
                      style={{ width: "100%", padding: "11px 0", background: "transparent", border: "none", borderTop: "1px solid var(--border)", cursor: "pointer", fontSize: "0.68rem", color: "var(--text-3)", fontFamily: "inherit" }}>
                      {statsExpanded ? `Show less` : `Show all ${entries.length}`}
                    </button>
                  )}
                </div>
              );
            })()}
            {cat !== "fantasyPts" && iplStats && (
              <div style={{ fontSize: "0.6rem", color: "var(--text-3)", textAlign: "center" as const, padding: "4px 0" }}>
                <span style={{ color: "#22c55e" }}>F</span> = in one of the 4 fantasy teams
              </div>
            )}
          </>
        )}
      </div>
    );
  };


  const renderAdmin = () => {
    const completedCount = liveMatches.filter((m: any) => m.matchEnded).length;
    const liveCount = liveMatches.filter((m: any) => m.matchStarted && !m.matchEnded).length;
    const scorecardTotal = completedCount + liveCount;
    const scoredPlayerCount = Object.keys(playerPoints).length;
    const totalPts = Object.values(playerPoints).reduce((s, v) => s + v, 0);

    return (
      <div>
        <div className="sec-title">Admin</div>
        <div className="stat-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-val" style={{ color: "#22c55e" }}>{completedCount}</div>
            <div className="stat-lbl">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-val" style={{ color: "var(--live)" }}>{liveCount}</div>
            <div className="stat-lbl">Live now</div>
          </div>
          <div className="stat-card">
            <div className="stat-val" style={{ color: "#60a5fa" }}>{processedMatches.length}</div>
            <div className="stat-lbl">Scored</div>
          </div>
          <div className="stat-card">
            <div className="stat-val" style={{ color: "#a855f7" }}>{scoredPlayerCount}</div>
            <div className="stat-lbl">Players</div>
          </div>
        </div>
        {/* PIN Management */}
        <div style={{ background: "rgba(15,21,32,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" as const, color: "#94a3b8" }}>
              Change Passcode
            </div>
            <div style={{ fontSize: "0.65rem", color: "#475569", marginTop: 5 }}>
              Your passcode must be exactly 4 digits and is used to log in to your account.{currentUser === "rajveer" ? " As commissioner, you can manage all members." : ""}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 2 }}>
            {Object.values(FANTASY_TEAMS)
              .filter(ft => currentUser === "rajveer" || ft.id === currentUser)
              .map((ft, idx) => {
                const isEditing = pinEditTarget === ft.id;
                return (
                  <div key={ft.id}>
                    {/* divider between entries */}
                    {idx > 0 && <div style={{ height: 1, background: "rgba(255,255,255,0.04)", margin: "10px 0" }} />}
                    {isEditing ? (
                      /* ── Edit mode: two-step expanded card ── */
                      (<div style={{ padding: "4px 0 8px" }}>
                        {/* User identity */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                          <span style={{ fontSize: "1.1rem" }}>{ft.emoji}</span>
                          <div>
                            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: ft.color }}>{ft.owner}</div>
                            <div style={{ fontSize: "0.6rem", color: "#475569" }}>{ft.name}</div>
                          </div>
                          {/* Step indicator */}
                          <div style={{ marginLeft: "auto", display: "flex", gap: 5 }}>
                            {["confirm","new"].map((s, si) => (
                              <div key={s} style={{
                                width: 18, height: 4, borderRadius: 2,
                                background: (pinStep === "confirm" ? si === 0 : si === 1) ? ft.color : "rgba(255,255,255,0.1)",
                                transition: "background 0.3s ease",
                              }} />
                            ))}
                          </div>
                        </div>
                        {/* Step label */}
                        <div style={{ fontSize: "0.62rem", color: "#52525b", textAlign: "center", marginBottom: 14, letterSpacing: "0.5px" }}>
                          {pinStep === "confirm" ? "CONFIRM CURRENT PIN" : "ENTER NEW PIN"}
                        </div>
                        {/* Step 1 — confirm current PIN */}
                        {pinStep === "confirm" && (() => {
                          const val = pinConfirmVal;
                          return (
                            <div>
                              <div style={{ position: "relative" }}>
                                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                                  {[0, 1, 2, 3].map(i => {
                                    const char = val[i] || "";
                                    const isActive = val.length === i;
                                    return (
                                      <div key={i} style={{
                                        width: 48, height: 56,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        border: `1.5px solid ${pinConfirmError ? "#f87171" : isActive ? ft.color : char ? `${ft.color}60` : "rgba(255,255,255,0.1)"}`,
                                        borderRadius: 12,
                                        background: pinConfirmError ? "rgba(248,113,113,0.08)" : char ? `${ft.color}12` : "rgba(255,255,255,0.03)",
                                        fontSize: "1.6rem", color: pinConfirmError ? "#f87171" : ft.color,
                                        transition: "all 0.15s ease",
                                        boxShadow: isActive ? `0 0 0 3px ${ft.color}25` : "none",
                                      }}>
                                        {char ? "•" : ""}
                                      </div>
                                    );
                                  })}
                                </div>
                                <input
                                  type="text" inputMode="numeric" pattern="\d{4}" maxLength={4}
                                  value={val}
                                  onChange={e => { setPinConfirmVal(e.target.value.replace(/\D/g, "").slice(0, 4)); setPinConfirmError(false); }}
                                  autoFocus
                                  style={{ position: "absolute", inset: 0, opacity: 0, cursor: "text", width: "100%", height: "100%" }}
                                />
                              </div>
                              {pinConfirmError && (
                                <div style={{ textAlign: "center", color: "#f87171", fontSize: "0.62rem", marginTop: 10, letterSpacing: "0.3px" }}>
                                  Incorrect PIN — try again
                                </div>
                              )}
                              <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "center" }}>
                                <button
                                  onClick={() => handleConfirmOldPin(ft.id)}
                                  disabled={val.length !== 4}
                                  style={{
                                    flex: 1, maxWidth: 130,
                                    background: val.length === 4 ? `${ft.color}22` : "rgba(255,255,255,0.04)",
                                    border: `1px solid ${val.length === 4 ? `${ft.color}60` : "rgba(255,255,255,0.07)"}`,
                                    borderRadius: 10, padding: "9px 0", cursor: val.length === 4 ? "pointer" : "default",
                                    color: val.length === 4 ? ft.color : "#3f3f46",
                                    fontSize: "0.72rem", fontFamily: "inherit", fontWeight: 700, letterSpacing: "0.5px", transition: "all 0.15s ease",
                                  }}>
                                  Confirm →
                                </button>
                                <button
                                  onClick={resetPinEdit}
                                  style={{
                                    flex: 1, maxWidth: 100, background: "transparent",
                                    border: "1px solid rgba(255,255,255,0.07)",
                                    borderRadius: 10, padding: "9px 0", cursor: "pointer",
                                    color: "#52525b", fontSize: "0.72rem", fontFamily: "inherit", transition: "all 0.15s ease",
                                  }}>
                                  Cancel
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                        {/* Step 2 — enter new PIN */}
                        {pinStep === "new" && (() => {
                          const val = pinEditVal;
                          return (
                            <div>
                              <div style={{ position: "relative" }}>
                                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                                  {[0, 1, 2, 3].map(i => {
                                    const char = val[i] || "";
                                    const isActive = val.length === i;
                                    return (
                                      <div key={i} style={{
                                        width: 48, height: 56,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        border: `1.5px solid ${isActive ? ft.color : char ? `${ft.color}60` : "rgba(255,255,255,0.1)"}`,
                                        borderRadius: 12,
                                        background: char ? `${ft.color}12` : "rgba(255,255,255,0.03)",
                                        fontSize: "1.6rem", color: ft.color,
                                        transition: "all 0.15s ease",
                                        boxShadow: isActive ? `0 0 0 3px ${ft.color}25` : "none",
                                      }}>
                                        {char ? "•" : ""}
                                      </div>
                                    );
                                  })}
                                </div>
                                <input
                                  type="text" inputMode="numeric" pattern="\d{4}" maxLength={4}
                                  value={val}
                                  onChange={e => setPinEditVal(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                  autoFocus
                                  style={{ position: "absolute", inset: 0, opacity: 0, cursor: "text", width: "100%", height: "100%" }}
                                />
                              </div>
                              <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "center" }}>
                                <button
                                  onClick={() => handleSavePin(ft.id)}
                                  disabled={val.length !== 4}
                                  style={{
                                    flex: 1, maxWidth: 120,
                                    background: val.length === 4 ? `${ft.color}22` : "rgba(255,255,255,0.04)",
                                    border: `1px solid ${val.length === 4 ? `${ft.color}60` : "rgba(255,255,255,0.07)"}`,
                                    borderRadius: 10, padding: "9px 0", cursor: val.length === 4 ? "pointer" : "default",
                                    color: val.length === 4 ? ft.color : "#3f3f46",
                                    fontSize: "0.72rem", fontFamily: "inherit", fontWeight: 700, letterSpacing: "0.5px", transition: "all 0.15s ease",
                                  }}>
                                  Save PIN
                                </button>
                                <button
                                  onClick={() => { setPinStep("confirm"); setPinEditVal(""); setPinConfirmError(false); }}
                                  style={{
                                    flex: 1, maxWidth: 100, background: "transparent",
                                    border: "1px solid rgba(255,255,255,0.07)",
                                    borderRadius: 10, padding: "9px 0", cursor: "pointer",
                                    color: "#52525b", fontSize: "0.72rem", fontFamily: "inherit", transition: "all 0.15s ease",
                                  }}>
                                  ← Back
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>)
                    ) : (
                      /* ── Idle row ── */
                      (<div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: "1rem" }}>{ft.emoji}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "0.7rem", fontWeight: 600, color: ft.color }}>{ft.owner}</div>
                          <div style={{ fontSize: "0.58rem", color: "#3f3f46" }}>{ft.name}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: "0.8rem", letterSpacing: "4px", color: "#27272a", fontFamily: "monospace", lineHeight: 1 }}>••••</span>
                          <button
                            onClick={() => { setPinEditTarget(ft.id); setPinEditVal(""); setPinConfirmVal(""); setPinStep("confirm"); setPinConfirmError(false); }}
                            style={{
                              background: "transparent",
                              border: `1px solid rgba(255,255,255,0.08)`,
                              borderRadius: 8, padding: "5px 12px", cursor: "pointer",
                              color: "#52525b", fontSize: "0.65rem", fontFamily: "inherit",
                              fontWeight: 600, letterSpacing: "0.3px",
                              transition: "border-color 0.15s, color 0.15s",
                            }}
                            onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = `${ft.color}50`; (e.target as HTMLButtonElement).style.color = ft.color; }}
                            onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.target as HTMLButtonElement).style.color = "#52525b"; }}
                          >
                            Change
                          </button>
                        </div>
                      </div>)
                    )}
                  </div>
                );
              })}
          </div>
        </div>
        {currentUser === "rajveer" && <div style={{ background: "rgba(15,21,32,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" as const, color: "#94a3b8", marginBottom: 12 }}>
            🤖 Auto-Points Engine
          </div>
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
              <span style={{ color: "#64748b" }}>IPL schedule</span>
              <span style={{ color: dataSources?.iplOfficial ? "#34d399" : "#475569" }}>
                {dataSources?.iplOfficial ? `✓ ${dataSources.iplOfficial} matches` : "Loading..."}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
              <span style={{ color: "#64748b" }}>Scorecards fetched</span>
              <span style={{ color: processedMatches.length > 0 ? "#34d399" : "#475569" }}>
                {processedMatches.length > 0
                  ? `✓ ${processedMatches.length} of ${scorecardTotal}${liveCount > 0 ? ` (${liveCount} live)` : ""}`
                  : scorecardTotal === 0 ? "No matches yet" : "Pending..."}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
              <span style={{ color: "#64748b" }}>AuctionRoom points engine</span>
              <span style={{ color: pointsUpdating ? "#f59e0b" : pointsError ? "#ef4444" : pendingMatches > 0 ? "#f59e0b" : "#34d399" }}>
                {pointsUpdating ? "⏳ Processing..." : pointsError ? `⚠ ${pointsError.slice(0, 40)}` : pendingMatches > 0 ? `⏳ ${pendingMatches} pending` : "✓ Active"}
              </span>
            </div>
            {dailyHits && (() => {
              const pct = dailyHits.count / dailyHits.limit;
              const barColor = pct >= 0.9 ? "#ef4444" : pct >= 0.7 ? "#f59e0b" : "#34d399";
              return (
                <div style={{ display: "flex", flexDirection: "column" as const, gap: 5 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                    <span style={{ color: "#64748b" }}>CricAPI innings syncs today (UTC)</span>
                    <span style={{ color: barColor, fontWeight: 700 }}>{dailyHits.count} / {dailyHits.limit}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(pct * 100, 100)}%`, background: barColor, borderRadius: 2, transition: "width 0.4s" }} />
                  </div>
                  <div style={{ fontSize: "0.6rem", color: "#334155" }}>Hard cap at {dailyHits.limit} · Resets midnight UTC (5:30 AM IST)</div>
                </div>
              );
            })()}
            {nextAttempt && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                <span style={{ color: "#475569" }}>Rate limit — next attempt</span>
                <span style={{ color: "#f59e0b" }}>{new Date(nextAttempt).toLocaleTimeString()}</span>
              </div>
            )}
            {pointsLastUpdated && (
              <div style={{ fontSize: "0.65rem", color: "#334155" }}>
                Points last updated: {pointsLastUpdated.toLocaleTimeString()} · Auto-refreshes every 5 min
              </div>
            )}
          </div>
        </div>}
        <div style={{ background: "rgba(15,21,32,0.9)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: 16, marginBottom: 16 }}>
          <div
            onClick={() => setAdminBreakdownOpen(o => !o)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", marginBottom: adminBreakdownOpen ? 12 : 0 }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" as const, color: "#94a3b8" }}>
              📊 Player Points Breakdown
            </span>
            <span style={{ fontSize: "0.65rem", color: "#475569" }}>{adminBreakdownOpen ? "▲" : "▼"} {Object.keys(playerPoints).length} players</span>
          </div>
          {adminBreakdownOpen && Object.keys(playerPoints).length === 0 && (
            <div style={{ color: "#334155", fontSize: "0.8rem", padding: "8px 0" }}>
              {pointsLoading ? "⏳ Calculating points from scorecards..." : "Points will appear once matches complete and scorecards are processed."}
            </div>
          )}
          {adminBreakdownOpen && Object.keys(playerPoints).length > 0 && Object.entries(playerPoints).sort((a, b) => b[1] - a[1]).map(([name, pts]) => {
            const team = Object.values(FANTASY_TEAMS).find(t => t.players.some(p => p.name === name));
            const isExp = expandedAdminPlayer === name;
            const matches = playerMatchPoints[name] || [];
            const isCap = Object.values(FANTASY_TEAMS).some(t => t.captain === name);
            const isVC = Object.values(FANTASY_TEAMS).some(t => t.vc === name);
            return (
              <div key={name} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <div
                  onClick={() => setExpandedAdminPlayer(isExp ? null : name)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", cursor: "pointer" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: "0.78rem", color: "#cbd5e1" }}>{name}</span>
                      {isCap && <span style={{ fontSize: "0.52rem", fontWeight: 700, color: "#d4a843", background: "rgba(212,168,67,0.12)", borderRadius: 3, padding: "1px 4px" }}>C</span>}
                      {isVC && <span style={{ fontSize: "0.52rem", fontWeight: 700, color: "#a1a1aa", background: "rgba(161,161,170,0.1)", borderRadius: 3, padding: "1px 4px" }}>VC</span>}
                    </div>
                    {team && <div style={{ fontSize: "0.6rem", color: "#475569", marginTop: 1 }}>{team.name} · {team.owner}</div>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: "'Bebas Neue'", fontSize: "1.1rem", color: "#f97316", letterSpacing: "1px" }}>{pts}</span>
                    {matches.length > 0 && <span style={{ fontSize: "0.6rem", color: "#475569" }}>{isExp ? "▲" : "▼"}</span>}
                  </div>
                </div>
                {isExp && matches.length > 0 && (
                  <div style={{ marginBottom: 8, padding: "8px 10px", background: "rgba(255,255,255,0.02)", borderRadius: 8, display: "flex", flexDirection: "column" as const, gap: 5 }}>
                    {matches.map((m, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.72rem" }}>
                        <div>
                          <span style={{ color: "var(--text-2)" }}>{m.label}</span>
                          {m.source === "official" && <span style={{ marginLeft: 5, fontSize: "0.55rem", color: "#34d399", background: "rgba(52,211,153,0.1)", borderRadius: 3, padding: "1px 4px" }}>official</span>}
                          {(m.source || "").includes("live") && <span style={{ marginLeft: 5, fontSize: "0.55rem", color: "#fbbf24", background: "rgba(251,191,36,0.1)", borderRadius: 3, padding: "1px 4px" }}>live</span>}
                        </div>
                        <span style={{ fontWeight: 700, color: m.pts > 0 ? "#f97316" : "var(--text-3)" }}>{m.pts > 0 ? "+" : ""}{m.pts}</span>
                      </div>
                    ))}
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 2, paddingTop: 5, display: "flex", justifyContent: "space-between", fontSize: "0.72rem", fontWeight: 700 }}>
                      <span style={{ color: "var(--text-3)" }}>Total (raw)</span>
                      <span style={{ color: "#f97316" }}>{matches.reduce((s, m) => s + m.pts, 0)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
          <button className="btn-primary" onClick={() => { fetchLive(); fetchPoints(); }} disabled={liveLoading || pointsLoading}>
            {(liveLoading || pointsLoading) ? <span className="spinner" /> : "🔄"} Refresh All
          </button>
          {currentUser === "rajveer" && <>
            <button className="btn-primary" style={{ background: "rgba(96,165,250,0.1)", borderColor: "rgba(96,165,250,0.3)", color: "#60a5fa" }}
              onClick={fetchPoints} disabled={pointsLoading}>
              {pointsLoading ? <span className="spinner" /> : "⚡"} Fetch Points
            </button>
            <button className="btn-primary" style={{ background: "rgba(34,197,94,0.1)", borderColor: "rgba(34,197,94,0.3)", color: "#22c55e" }}
              onClick={syncSupabase} disabled={supabaseSyncing}>
              {supabaseSyncing ? <span className="spinner" /> : "🗄️"} Sync AuctionRoom
            </button>
            <button className="btn-primary" style={{ background: "rgba(168,85,247,0.1)", borderColor: "rgba(168,85,247,0.3)", color: "#a855f7" }}
              onClick={prefetchS3Scorecards} disabled={s3Prefetching}>
              {s3Prefetching ? <span className="spinner" /> : "📡"} Pre-fetch S3 Scorecards
            </button>
            <button className="btn-primary" style={{ background: "rgba(245,166,35,0.1)", borderColor: "rgba(245,166,35,0.3)", color: "var(--gold)" }}
              onClick={refreshStatsCache} disabled={statsRefreshing}>
              {statsRefreshing ? <span className="spinner" /> : "📊"} Refresh Stats (S3)
            </button>
            <button className="btn-danger" onClick={async () => {
              if (confirm("Reset all cached points? Points will re-sync from AuctionRoom.")) {
                await fetch("/api/ipl/points/reset", { method: "POST", headers: { "X-Owner-Id": "rajveer" } });
                setPlayerPoints({});
                setProcessedMatches([]);
                setTimeout(fetchPoints, 500);
              }
            }}>🗑️ Reset Cache</button>
          </>}
        </div>
        {supabaseSyncMsg && (
          <div style={{ fontSize: "0.7rem", marginTop: 8, padding: "6px 10px", borderRadius: 8,
            background: supabaseSyncMsg.startsWith("Sync failed") ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
            color: supabaseSyncMsg.startsWith("Sync failed") ? "#f87171" : "#4ade80",
            border: `1px solid ${supabaseSyncMsg.startsWith("Sync failed") ? "rgba(239,68,68,0.2)" : "rgba(34,197,94,0.2)"}`,
          }}>
            {supabaseSyncMsg}
          </div>
        )}
        {s3PrefetchResult && (
          <div style={{ marginTop: 8, padding: "10px 12px", borderRadius: 10,
            background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: s3PrefetchResult.foundIds.length > 0 ? 8 : 0 }}>
              <span style={{ fontSize: "0.72rem", color: "#a855f7", fontWeight: 700 }}>
                📡 S3 Scorecard Prefetch
              </span>
              <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                <span style={{ color: "#4ade80" }}>✓ {s3PrefetchResult.found} found</span>
                {" · "}
                <span style={{ color: s3PrefetchResult.missing > 0 ? "#94a3b8" : "#4ade80" }}>{s3PrefetchResult.missing} not yet available</span>
              </span>
            </div>
            {s3PrefetchResult.foundIds.length > 0 && (
              <div style={{ fontSize: "0.6rem", color: "#64748b", lineHeight: 1.6 }}>
                <span style={{ color: "#4ade80" }}>Found IDs: </span>
                {s3PrefetchResult.foundIds.join(", ")}
              </div>
            )}
            {s3PrefetchResult.missingIds.length > 0 && (
              <div style={{ fontSize: "0.6rem", color: "#64748b", marginTop: 4, lineHeight: 1.6 }}>
                <span style={{ color: "#94a3b8" }}>Not yet on S3: </span>
                {s3PrefetchResult.missingIds.join(", ")}
              </div>
            )}
          </div>
        )}
        {lastUpdated && (
          <div style={{ fontSize: "0.65rem", color: "#334155", marginTop: 10 }}>
            Schedule last updated: {lastUpdated.toLocaleTimeString()} · Total points tracked: {totalPts}
          </div>
        )}
      </div>
    );
  };

  // Swipe gesture handlers (attached to the app wrapper)
  const handleSwipeStart = (e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX;
    swipeStartY.current = e.touches[0].clientY;
    // Block tab-swipe if the touch started inside a no-swipe zone
    // (horizontally-scrollable inner containers)
    const target = e.target as HTMLElement;
    swipeBlocked.current = !!target.closest("[data-no-swipe]");
  };
  const handleSwipeEnd = (e: React.TouchEvent) => {
    if (swipeBlocked.current) { swipeBlocked.current = false; return; }
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    const dy = e.changedTouches[0].clientY - swipeStartY.current;
    // Must be a clearly horizontal swipe: min 70px horizontal, and horizontal
    // must be at least 3× the vertical movement (within ~18° of horizontal axis)
    if (Math.abs(dx) < 70) return;
    if (Math.abs(dy) > Math.abs(dx) * 0.3) return;
    const idx = SWIPEABLE_TABS.indexOf(tab);
    if (idx === -1) return;
    if (dx < 0 && idx < SWIPEABLE_TABS.length - 1) setTab(SWIPEABLE_TABS[idx + 1]);
    if (dx > 0 && idx > 0) setTab(SWIPEABLE_TABS[idx - 1]);
  };

  if (!currentUser) return <LoginScreen onValidate={handleValidate} />;

  return (
    <>
      {showToast && <div className="share-toast">✓ Copied to clipboard!</div>}
      {sparkTip && (
        <div className="spark-tip">
          {sparkTip.pts > 0 ? `+${sparkTip.pts}` : "0"} pts · {sparkTip.label}
        </div>
      )}
      {pullY > 0 && (
        <div className="ptr-indicator" style={{ opacity: Math.min(pullY / PULL_THRESHOLD, 1) }}>
          {pullY >= PULL_THRESHOLD - 5 ? "↑ Release to refresh" : "↓ Pull to refresh"}
        </div>
      )}
      <div className="app"
        onTouchStart={handleSwipeStart}
        onTouchEnd={handleSwipeEnd}
      >
        <div className="bg-field" />
        <div className="content">
          <div className="header">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="header-logo-ring">
                <div className="header-logo-inner">
                  <img
                    src={`${import.meta.env.BASE_URL}app-icon.png`}
                    alt="Logo"
                    className="header-logo"
                  />
                </div>
              </div>
              <div className="header-title-row">
                <span className="header-title">Indian Premier League</span>
                <span className="header-year">2026</span>
              </div>
            </div>
            <div className="header-right">
              {installPrompt && !appInstalled && (
                <button
                  className="btn-install"
                  onClick={async () => {
                    installPrompt.prompt();
                    const { outcome } = await installPrompt.userChoice;
                    if (outcome === "accepted") { setAppInstalled(true); setInstallPrompt(null); }
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Install
                </button>
              )}
              <div className="settings-wrap" ref={settingsRef}>
                <button
                  className={`btn-icon${settingsOpen ? " active" : ""}`}
                  onClick={() => setSettingsOpen(p => !p)}
                  title="Settings"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                </button>
                {settingsOpen && (() => {
                  const cu = FANTASY_TEAMS[currentUser!];
                  return (
                    <div className="settings-dropdown">
                      <div className="settings-profile" style={{ borderLeftColor: cu.color }}>
                        <div style={{ width: 38, height: 38, borderRadius: "50%", border: `2px solid ${cu.color}60`, overflow: "hidden", flexShrink: 0, boxShadow: `0 0 0 2px ${cu.color}20` }}>
                          <img src={`${import.meta.env.BASE_URL}avatars/${cu.avatar}`} alt={cu.owner} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                        <div>
                          <div className="settings-profile-name" style={{ color: cu.color }}>{cu.owner}</div>
                          <div className="settings-profile-team">{cu.name}</div>
                        </div>
                      </div>
                      <button className="settings-row" onClick={() => { setTab("admin"); setSettingsOpen(false); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="3"/>
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                        League Control Centre
                        <svg className="settings-row-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                      </button>
                      <button className="settings-row settings-row-danger" onClick={() => { handleLogout(); setSettingsOpen(false); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                          <polyline points="16 17 21 12 16 7"/>
                          <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Log out
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {tab === "home" && renderHome()}
          {tab === "teams" && renderTeams()}
          {tab === "fixtures" && renderFixtures()}
          {tab === "stats" && renderStats()}
          {tab === "history" && renderHistory()}
          {tab === "admin" && renderAdmin()}
        </div>

        <nav className="nav">
          {TABS.map(t => {
            const isActive = tab === t.id;
            return (
              <button key={t.id} className={`nav-btn ${isActive ? "active" : ""}`} onClick={() => setTab(t.id)}>
                <span className="nav-icon">{NAV_ICON[t.id]}</span>
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
