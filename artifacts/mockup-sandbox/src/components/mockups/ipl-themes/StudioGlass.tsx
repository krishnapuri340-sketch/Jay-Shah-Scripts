import { useState } from "react";
import { Home, Users, BarChart2, Settings, TrendingUp, Sun, Moon, Star } from "lucide-react";

const TEAMS = [
  { rank: 1, name: "Raj", team: "Jay Shah Supremacy", pts: 1842, emoji: "👑", color: "#d4af37", colorDim: "rgba(212,175,55,0.15)" },
  { rank: 2, name: "Smeet", team: "Mumbai Mavericks", pts: 1761, emoji: "⚡", color: "#818cf8", colorDim: "rgba(129,140,248,0.12)" },
  { rank: 3, name: "Deb", team: "PonyGoat", pts: 1698, emoji: "🐐", color: "#34d399", colorDim: "rgba(52,211,153,0.12)" },
  { rank: 4, name: "Rahul", team: "Mombasa Kenyans", pts: 1604, emoji: "🌍", color: "#f472b6", colorDim: "rgba(244,114,182,0.12)" },
];

export function StudioGlass() {
  const [dark, setDark] = useState(true);
  const [tab, setTab] = useState("home");
  const d = dark;

  const bg = d ? "#07051a" : "#f8f7f3";
  const surf = d ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.8)";
  const surf2 = d ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)";
  const border = d ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
  const text = d ? "#f0eeff" : "#1e1b4b";
  const text2 = d ? "#8b7fb5" : "#6b7280";
  const gold = "#d4af37";
  const purple = d ? "#a78bfa" : "#7c3aed";

  return (
    <div style={{ width: 390, minHeight: 844, fontFamily: "'Plus Jakarta Sans', sans-serif", color: text, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", background: bg }}>

      {/* Background gradient blobs */}
      <div style={{ position: "absolute", width: 300, height: 300, borderRadius: "50%", background: d ? "radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)" : "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)", top: -80, right: -60, pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 200, height: 200, borderRadius: "50%", background: d ? "radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)" : "radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)", bottom: 200, left: -40, pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ padding: "52px 22px 18px", position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <Star size={12} fill={gold} color={gold} />
              <span style={{ fontSize: 10, fontWeight: 700, color: gold, letterSpacing: 2.5, textTransform: "uppercase" }}>Private League</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px", lineHeight: 1.2 }}>IPL Fantasy</div>
            <div style={{ fontSize: 13, color: text2, fontWeight: 500, marginTop: 2 }}>2026 Season</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ background: d ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 20, padding: "5px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: "#10b981", letterSpacing: 1 }}>Live</span>
            </div>
            <button onClick={() => setDark(!dark)} style={{ width: 36, height: 36, borderRadius: 12, border: `1px solid ${border}`, background: surf, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: text2, backdropFilter: "blur(10px)" }}>
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </div>

      {/* Leaderboard hero */}
      <div style={{ padding: "0 22px", position: "relative", zIndex: 2, marginBottom: 20 }}>
        {/* Leader card - special treatment */}
        <div style={{ background: d ? "linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(212,175,55,0.08) 100%)" : "linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(212,175,55,0.04) 100%)", border: `1px solid ${d ? "rgba(212,175,55,0.2)" : "rgba(212,175,55,0.15)"}`, borderRadius: 18, padding: "20px 20px", marginBottom: 10, backdropFilter: "blur(20px)", boxShadow: d ? "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)" : "0 4px 20px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: d ? "radial-gradient(circle, rgba(212,175,55,0.15) 0%, transparent 70%)" : "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)" }} />
          <div style={{ fontSize: 10, fontWeight: 700, color: gold, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>👑 League Leader</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${gold}30, ${gold}10)`, border: `1px solid ${gold}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>👑</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.3px" }}>Raj</div>
              <div style={{ fontSize: 11, color: text2, marginTop: 1, fontWeight: 500 }}>Jay Shah Supremacy</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 34, fontWeight: 800, color: gold, letterSpacing: "-1.5px", lineHeight: 1 }}>1842</div>
              <div style={{ fontSize: 9, color: text2, fontWeight: 700, letterSpacing: 1.5, marginTop: 3, textTransform: "uppercase" }}>Points</div>
            </div>
          </div>
        </div>

        {/* Other teams */}
        {TEAMS.slice(1).map((t, i) => (
          <div key={t.rank} style={{ background: surf, border: `1px solid ${border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 8, backdropFilter: "blur(10px)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: t.colorDim, border: `1px solid ${t.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{t.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{t.name}</div>
              <div style={{ fontSize: 10, color: text2, marginTop: 1 }}>{t.team}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px" }}>{t.pts.toLocaleString()}</div>
              <div style={{ fontSize: 9, color: text2, fontWeight: 600 }}>pts</div>
            </div>
            <div style={{ fontSize: 10, color: text2, background: surf2, borderRadius: 8, padding: "4px 8px", fontWeight: 700 }}>#{t.rank}</div>
          </div>
        ))}
      </div>

      {/* Live match card */}
      <div style={{ padding: "0 22px", position: "relative", zIndex: 2 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: text2, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
          <TrendingUp size={12} />
          Live Action
        </div>
        <div style={{ background: d ? "rgba(239,68,68,0.06)" : "rgba(239,68,68,0.03)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, padding: "16px", backdropFilter: "blur(10px)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444" }} />
                <span style={{ fontSize: 10, fontWeight: 800, color: "#ef4444", letterSpacing: 1.5 }}>LIVE · MI vs KKR</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px" }}>186<span style={{ fontSize: 14, fontWeight: 600, color: text2 }}>/4</span></div>
              <div style={{ fontSize: 11, color: text2, marginTop: 2 }}>18.2 overs · Wankhede</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {[{n:"Raj",c:"#d4af37",p:0},{n:"Smeet",c:"#818cf8",p:42},{n:"Deb",c:"#34d399",p:18},{n:"Rahul",c:"#f472b6",p:31}].map(x => (
              <div key={x.n} style={{ flex: 1, background: x.p > 0 ? x.c+"15" : (d?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.04)"), border: `1px solid ${x.p > 0 ? x.c+"30" : border}`, borderRadius: 10, padding: "10px 6px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: x.p > 0 ? x.c : text2 }}>{x.p}</div>
                <div style={{ fontSize: 9, color: text2, fontWeight: 600, marginTop: 2 }}>{x.n}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 76, background: d ? "rgba(7,5,26,0.92)" : "rgba(248,247,243,0.92)", borderTop: `1px solid ${border}`, backdropFilter: "blur(24px)", display: "flex", justifyContent: "space-around", alignItems: "center", padding: "0 8px 12px", zIndex: 10 }}>
        {[{icon:<Home size={21}/>,label:"Home",id:"home"},{icon:<Users size={21}/>,label:"Teams",id:"teams"},{icon:<BarChart2 size={21}/>,label:"Stats",id:"stats"},{icon:<Settings size={21}/>,label:"Admin",id:"admin"}].map(n => (
          <button key={n.id} onClick={() => setTab(n.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 18px", borderRadius: 14, color: tab===n.id ? purple : text2, transition: "all 0.15s" }}>
            {tab===n.id && <div style={{ position: "absolute", bottom: 64, width: 40, height: 40, background: purple+"15", borderRadius: "50%", filter: "blur(12px)" }} />}
            {n.icon}
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
