import { useState } from "react";
import { Home, Users, BarChart2, Settings, Flame, Sun, Moon, Zap, Trophy } from "lucide-react";

const TEAMS = [
  { rank: 1, name: "Raj", full: "Jay Shah Supremacy", pts: 1842, color: "#f59e0b", bg: "rgba(245,158,11,0.1)", icon: "🏆" },
  { rank: 2, name: "Smeet", full: "Mumbai Mavericks", pts: 1761, color: "#3b82f6", bg: "rgba(59,130,246,0.1)", icon: "⚡" },
  { rank: 3, name: "Deb", full: "PonyGoat", pts: 1698, color: "#22c55e", bg: "rgba(34,197,94,0.1)", icon: "🐐" },
  { rank: 4, name: "Rahul", full: "Mombasa Kenyans", pts: 1604, color: "#a855f7", bg: "rgba(168,85,247,0.1)", icon: "🌍" },
];

const DIFF = [81, 63, 94];

export function StadiumNeon() {
  const [dark, setDark] = useState(true);
  const [tab, setTab] = useState("home");
  const d = dark;

  const bg = d ? "#000810" : "#f0f4ff";
  const surf = d ? "#050d1e" : "#ffffff";
  const surf2 = d ? "#0a1628" : "#eef2ff";
  const border = d ? "rgba(255,255,255,0.06)" : "rgba(99,102,241,0.1)";
  const text = d ? "#e8f0ff" : "#1e1b4b";
  const text2 = d ? "#4a6282" : "#6b7280";
  const neon = d ? "#f59e0b" : "#d97706";
  const neon2 = d ? "#3b82f6" : "#2563eb";

  return (
    <div style={{ width: 390, minHeight: 844, fontFamily: "'Montserrat', sans-serif", color: text, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", background: bg }}>

      {/* Stadium atmosphere */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 220, background: d ? "linear-gradient(180deg, rgba(245,158,11,0.06) 0%, transparent 100%)" : "linear-gradient(180deg, rgba(245,158,11,0.04) 0%, transparent 100%)", pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ padding: "48px 20px 16px", position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: `linear-gradient(135deg, ${neon}, #d97706)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: d ? `0 0 20px ${neon}50` : "none" }}>
              <Trophy size={20} color="#000" fill="#000" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.5px", textTransform: "uppercase", lineHeight: 1 }}>IPL 2026</div>
              <div style={{ fontSize: 10, color: neon, fontWeight: 800, letterSpacing: 3, marginTop: 2 }}>FANTASY LEAGUE</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "6px 12px", display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 6px #ef4444" }} />
              <span style={{ fontSize: 9, fontWeight: 900, color: "#ef4444", letterSpacing: 2 }}>LIVE</span>
            </div>
            <button onClick={() => setDark(!dark)} style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${border}`, background: surf2, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: text2 }}>
              {dark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
        </div>

        {/* Title bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: text2, letterSpacing: 2.5, textTransform: "uppercase" }}>Leaderboard</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: neon2 }}>Match 14 of 74</div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 90px", position: "relative", zIndex: 2 }}>

        {/* Standings - styled as scoreboard */}
        <div style={{ background: surf, border: `1px solid ${border}`, borderRadius: 16, overflow: "hidden", marginBottom: 20, boxShadow: d ? "0 4px 30px rgba(0,0,0,0.6)" : "0 4px 20px rgba(0,0,0,0.06)" }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", padding: "10px 16px", background: d ? "#0d1b2f" : "#e8edff", borderBottom: `1px solid ${border}` }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: text2, letterSpacing: 2, flex: 1 }}>MANAGER</div>
            <div style={{ fontSize: 9, fontWeight: 800, color: text2, letterSpacing: 2, textAlign: "right" }}>PTS</div>
          </div>

          {TEAMS.map((t, i) => (
            <div key={t.rank} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderBottom: i < 3 ? `1px solid ${border}` : "none", background: i === 0 ? (d ? "linear-gradient(90deg, rgba(245,158,11,0.06) 0%, transparent 100%)" : "rgba(245,158,11,0.04)") : "transparent", position: "relative" }}>
              {i === 0 && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: neon, boxShadow: d ? `0 0 8px ${neon}` : "none" }} />}
              <div style={{ width: 32, height: 32, borderRadius: 8, background: t.bg, border: `1px solid ${t.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                {i === 0 ? <Flame size={16} color={neon} /> : <span>{t.icon}</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.2px" }}>{t.name}</div>
                <div style={{ fontSize: 10, color: text2, marginTop: 1, fontWeight: 600 }}>{t.full}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: i === 0 ? neon : text, letterSpacing: "-0.5px", textShadow: i === 0 && d ? `0 0 20px ${neon}60` : "none" }}>{t.pts.toLocaleString()}</div>
                {i > 0 && <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 700, marginTop: 1 }}>-{DIFF[i-1]}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Live match - stadium scoreboard style */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: text2, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Zap size={11} color={neon} fill={neon} />
            Live Points
          </div>

          <div style={{ background: surf, border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, overflow: "hidden", boxShadow: d ? "0 0 40px rgba(239,68,68,0.05), 0 4px 30px rgba(0,0,0,0.5)" : "0 4px 20px rgba(0,0,0,0.06)" }}>
            <div style={{ background: d ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.04)", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(239,68,68,0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 8px #ef4444" }} />
                <span style={{ fontSize: 10, fontWeight: 900, color: "#ef4444", letterSpacing: 1.5 }}>LIVE · MI vs KKR</span>
              </div>
              <span style={{ fontSize: 11, fontWeight: 800, color: text }}>186/4 <span style={{ fontWeight: 600, color: text2 }}>(18.2)</span></span>
            </div>
            <div style={{ padding: "14px 16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  {n:"Raj",c:"#f59e0b",p:0,note:"No players"},
                  {n:"Smeet",c:"#3b82f6",p:42,note:"MI players"},
                  {n:"Deb",c:"#22c55e",p:18,note:"KKR player"},
                  {n:"Rahul",c:"#a855f7",p:31,note:"Both sides"},
                ].map(x => (
                  <div key={x.n} style={{ background: x.p > 0 ? x.c+"12" : surf2, border: `1px solid ${x.p > 0 ? x.c+"25" : border}`, borderRadius: 10, padding: "12px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: text2, marginBottom: 4 }}>{x.n}</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: x.p > 0 ? x.c : text2, letterSpacing: "-0.5px", textShadow: x.p > 0 && d ? `0 0 20px ${x.c}60` : "none" }}>{x.p}</div>
                    <div style={{ fontSize: 9, color: text2, marginTop: 2, fontWeight: 600 }}>{x.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Next match */}
        <div style={{ background: `linear-gradient(135deg, ${neon}10, ${neon2}08)`, border: `1px solid ${neon}20`, borderRadius: 16, padding: "16px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: neon, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>Tonight · 7:30 PM</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
            {["RCB","vs","CSK"].map((x,i) => x === "vs" ? <span key={i} style={{ color: text2, fontWeight: 700, fontSize: 12 }}>vs</span> : <span key={x} style={{ fontSize: 13, fontWeight: 900, color: x==="RCB"?"#ef4444":"#f59e0b", background: (x==="RCB"?"#ef4444":"#f59e0b")+"15", borderRadius: 8, padding: "4px 12px", border: `1px solid ${x==="RCB"?"#ef4444":"#f59e0b"}30` }}>{x}</span>)}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700 }}>Royal Challengers vs Super Kings</div>
          <div style={{ fontSize: 11, color: text2, marginTop: 4 }}>M Chinnaswamy Stadium, Bengaluru</div>
        </div>

      </div>

      {/* Bottom Nav */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 72, background: d ? "rgba(0,8,16,0.95)" : "rgba(240,244,255,0.95)", borderTop: `1px solid ${border}`, backdropFilter: "blur(20px)", display: "flex", justifyContent: "space-around", alignItems: "center", padding: "0 8px 10px", zIndex: 10 }}>
        {[
          {icon:<Home size={20}/>,label:"Home",id:"home"},
          {icon:<Users size={20}/>,label:"Teams",id:"teams"},
          {icon:<BarChart2 size={20}/>,label:"Stats",id:"stats"},
          {icon:<Settings size={20}/>,label:"Admin",id:"admin"},
        ].map(n => (
          <button key={n.id} onClick={() => setTab(n.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 16px", borderRadius: 10, color: tab===n.id ? neon : text2, transition: "all 0.15s", position: "relative" }}>
            {tab===n.id && <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: 2, background: neon, borderRadius: "0 0 4px 4px", boxShadow: d ? `0 0 8px ${neon}` : "none" }} />}
            {n.icon}
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1 }}>{n.label.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
