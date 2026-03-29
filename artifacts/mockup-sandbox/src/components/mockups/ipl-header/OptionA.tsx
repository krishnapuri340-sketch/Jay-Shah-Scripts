export function OptionA() {
  return (
    <div style={{ minHeight: "90px", background: "#09090b", display: "flex", alignItems: "center", padding: "0 20px", fontFamily: "'DM Sans', system-ui, sans-serif", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#1a1a1d", border: "1.5px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
            <span style={{ fontSize: 18 }}>🏏</span>
          </div>
          <div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#fafafa", letterSpacing: "-0.02em", lineHeight: 1.2 }}>IPL Fantasy</div>
            <div style={{ fontSize: "0.6rem", color: "#52525b", marginTop: 3, letterSpacing: "0.02em" }}>2026 season</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: "0.63rem", color: "#52525b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "5px 11px", background: "#111113" }}>Admin</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.62rem", fontWeight: 600, color: "#22c55e", letterSpacing: "0.06em" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 0 3px rgba(34,197,94,0.2)" }} />
            LIVE
          </div>
        </div>
      </div>
    </div>
  );
}
