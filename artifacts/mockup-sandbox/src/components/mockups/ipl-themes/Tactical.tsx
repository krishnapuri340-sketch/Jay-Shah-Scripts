import { useState } from "react";
import { Home, Users, BarChart2, Settings, RefreshCw, Sun, Moon, Zap } from "lucide-react";

const TEAMS = [
  { rank: 1, name: "Raj", team: "Jay Shah Supremacy", pts: 1842, badge: "JSS", color: "#f59e0b", prev: 1 },
  { rank: 2, name: "Smeet", team: "Mumbai Mavericks", pts: 1761, badge: "MM", color: "#3b82f6", prev: 3 },
  { rank: 3, name: "Deb", team: "PonyGoat", pts: 1698, badge: "PG", color: "#10b981", prev: 2 },
  { rank: 4, name: "Rahul", team: "Mombasa Kenyans", pts: 1604, badge: "MK", color: "#a855f7", prev: 4 },
];

const MATCHES = [
  { status: "LIVE", t1: "MI", t2: "KKR", score: "186/4 (18.2)", venue: "Wankhede Stadium", pts: { raj: 0, smeet: 42, deb: 18, rahul: 31 } },
  { status: "TODAY", t1: "RCB", t2: "CSK", time: "7:30 PM IST", venue: "M Chinnaswamy Stadium", pts: null },
];

const MEDAL = ["🥇","🥈","🥉","4"];

export function Tactical() {
  const [dark, setDark] = useState(true);
  const [tab, setTab] = useState("home");

  const d = dark;
  const bg = d ? "#000000" : "#ffffff";
  const surf = d ? "#0d0d0d" : "#f5f5f5";
  const surf2 = d ? "#1a1a1a" : "#ebebeb";
  const border = d ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";
  const text = d ? "#f5f5f5" : "#0f172a";
  const text2 = d ? "#888" : "#64748b";
  const accent = "#f59e0b";
  const cyan = d ? "#00e5ff" : "#0ea5e9";

  return (
    <div style={{ width: 390, minHeight: 844, background: bg, fontFamily: "'Space Grotesk', sans-serif", color: text, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>

      {/* Subtle grid overlay */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${border} 1px, transparent 1px), linear-gradient(90deg, ${border} 1px, transparent 1px)`, backgroundSize: "40px 40px", opacity: d ? 0.4 : 0.2, pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ padding: "52px 20px 16px", borderBottom: `1px solid ${border}`, position: "relative", zIndex: 2 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: `linear-gradient(135deg, ${accent}, #d97706)`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#000" }}>🏏</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: "-0.3px" }}>IPL FANTASY</div>
              <div style={{ fontSize: 10, color: cyan, fontWeight: 700, letterSpacing: 2 }}>2026 SEASON</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 6, padding: "3px 10px", display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", animation: "pulse 1.5s infinite" }} />
              <span style={{ fontSize: 9, fontWeight: 800, color: "#10b981", letterSpacing: 1.5 }}>LIVE</span>
            </div>
            <button onClick={() => setDark(!dark)} style={{ background: surf2, border: `1px solid ${border}`, borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: text2 }}>
              {dark ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 90px", position: "relative", zIndex: 2 }}>

        {/* Section: Standings */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 3, height: 14, background: accent, borderRadius: 2 }} />
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2.5, color: text2, textTransform: "uppercase" }}>Standings</span>
          </div>

          {TEAMS.map((t, i) => (
            <div key={t.rank} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", marginBottom: 4,
              background: i === 0 ? (d ? `rgba(245,158,11,0.06)` : "rgba(245,158,11,0.04)") : surf,
              border: `1px solid ${i === 0 ? "rgba(245,158,11,0.2)" : border}`,
              borderRadius: 10, position: "relative", overflow: "hidden",
            }}>
              {i === 0 && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: accent }} />}
              <div style={{ width: 38, height: 38, borderRadius: 8, background: t.color + (d ? "20" : "15"), border: `1px solid ${t.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: t.color }}>
                {MEDAL[i] === MEDAL[3] ? <span style={{ fontSize: 13, fontWeight: 800, color: text2 }}>4</span> : MEDAL[i]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{t.name}</div>
                <div style={{ fontSize: 10, color: text2, marginTop: 1 }}>{t.team}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-1px", color: i === 0 ? accent : text }}>{t.pts.toLocaleString()}</div>
                <div style={{ fontSize: 9, color: text2, fontWeight: 700, letterSpacing: 1 }}>PTS</div>
              </div>
            </div>
          ))}
        </div>

        {/* Live match */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 3, height: 14, background: "#ef4444", borderRadius: 2 }} />
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2.5, color: text2, textTransform: "uppercase" }}>Live Match</span>
          </div>

          {/* Live card */}
          <div style={{ background: d ? "#0a0a0a" : "#fff", border: `1px solid rgba(239,68,68,0.25)`, borderRadius: 12, overflow: "hidden", boxShadow: d ? "0 0 30px rgba(239,68,68,0.07)" : "0 4px 20px rgba(0,0,0,0.06)" }}>
            <div style={{ background: "rgba(239,68,68,0.08)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid rgba(239,68,68,0.1)` }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444" }} />
              <span style={{ fontSize: 10, fontWeight: 800, color: "#ef4444", letterSpacing: 1.5 }}>LIVE NOW</span>
              <span style={{ marginLeft: "auto", fontSize: 11, color: text2, fontWeight: 600 }}>MI vs KKR</span>
            </div>
            <div style={{ padding: "16px" }}>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4, letterSpacing: "-0.5px" }}>186/4 <span style={{ fontSize: 14, color: text2, fontWeight: 600 }}>(18.2 ov)</span></div>
              <div style={{ fontSize: 11, color: text2, marginBottom: 16 }}>Wankhede Stadium, Mumbai</div>
              <div style={{ display: "flex", gap: 6 }}>
                {[{l:"Raj",c:"#f59e0b",p:0},{l:"Smeet",c:"#3b82f6",p:42},{l:"Deb",c:"#10b981",p:18},{l:"Rahul",c:"#a855f7",p:31}].map(x => (
                  <div key={x.l} style={{ flex: 1, background: x.c + "12", border: `1px solid ${x.c}25`, borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: x.p > 0 ? x.c : text2 }}>{x.p}</div>
                    <div style={{ fontSize: 9, color: text2, fontWeight: 700, marginTop: 2, letterSpacing: 0.5 }}>{x.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 3, height: 14, background: cyan, borderRadius: 2 }} />
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2.5, color: text2, textTransform: "uppercase" }}>Today</span>
          </div>
          <div style={{ background: surf, border: `1px solid ${border}`, borderRadius: 12, padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              {["RCB","CSK"].map(t => <span key={t} style={{ fontSize: 12, fontWeight: 800, color: t==="RCB"?"#ef4444":"#f59e0b", background: (t==="RCB"?"#ef4444":"#f59e0b")+"15", border: `1px solid ${t==="RCB"?"#ef4444":"#f59e0b"}30`, borderRadius: 6, padding: "3px 10px" }}>{t}</span>)}
              <span style={{ color: text2, fontSize: 11, fontWeight: 600, marginLeft: 2 }}>vs</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Royal Challengers vs Super Kings</div>
            <div style={{ fontSize: 11, color: text2, display: "flex", alignItems: "center", gap: 6 }}>
              <Zap size={11} color={cyan} />
              7:30 PM IST · M Chinnaswamy Stadium
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Nav */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 72, background: d ? "rgba(0,0,0,0.95)" : "rgba(255,255,255,0.95)", borderTop: `1px solid ${border}`, backdropFilter: "blur(20px)", display: "flex", justifyContent: "space-around", alignItems: "center", padding: "0 10px 10px", zIndex: 10 }}>
        {[{icon:<Home size={20}/>,label:"Home",id:"home"},{icon:<Users size={20}/>,label:"Teams",id:"teams"},{icon:<BarChart2 size={20}/>,label:"Stats",id:"stats"},{icon:<Settings size={20}/>,label:"Admin",id:"admin"}].map(n => (
          <button key={n.id} onClick={() => setTab(n.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 14px", borderRadius: 10, color: tab===n.id ? accent : text2, transition: "all 0.15s", position: "relative" }}>
            {tab===n.id && <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 2, background: accent, borderRadius: "0 0 4px 4px" }} />}
            {n.icon}
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.8 }}>{n.label.toUpperCase()}</span>
          </button>
        ))}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
