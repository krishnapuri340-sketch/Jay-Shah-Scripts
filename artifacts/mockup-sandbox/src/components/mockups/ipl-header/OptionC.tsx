export function OptionC() {
  return (
    <div style={{ minHeight: "90px", background: "#09090b", display: "flex", alignItems: "center", padding: "0 20px", fontFamily: "'DM Sans', system-ui, sans-serif", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "relative" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(212,168,67,0.4), transparent)" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#111113", border: "1px solid rgba(212,168,67,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 0 12px rgba(212,168,67,0.08)" }}>
            <span style={{ fontSize: 18 }}>🏏</span>
          </div>
          <div>
            <div style={{ fontSize: "0.98rem", fontWeight: 700, color: "#fafafa", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              IPL <span style={{ color: "#d4a843" }}>Fantasy</span>
            </div>
            <div style={{ fontSize: "0.58rem", color: "#52525b", marginTop: 3, letterSpacing: "0.04em" }}>2026 Season</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: "0.63rem", color: "#a1a1aa", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "5px 11px", background: "#111113", display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Admin
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.62rem", fontWeight: 600, color: "#22c55e", letterSpacing: "0.06em" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 0 3px rgba(34,197,94,0.2)" }} />
            LIVE
          </div>
        </div>
      </div>
    </div>
  );
}
