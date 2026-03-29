export function OptionB() {
  return (
    <div style={{ minHeight: "90px", background: "#09090b", display: "flex", alignItems: "center", padding: "0 20px", fontFamily: "'DM Sans', system-ui, sans-serif", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #d4a843 0%, #a07832 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 20 }}>🏏</span>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
              <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#d4a843", letterSpacing: "-0.03em", lineHeight: 1 }}>IPL</span>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fafafa", letterSpacing: "-0.03em", lineHeight: 1 }}>FANTASY</span>
            </div>
            <div style={{ fontSize: "0.58rem", color: "#52525b", marginTop: 4, letterSpacing: "0.12em", textTransform: "uppercase" }}>2026 Season</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: "0.63rem", color: "#a1a1aa", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "5px 11px", background: "#18181b" }}>Admin</div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.62rem", fontWeight: 600, color: "#22c55e", letterSpacing: "0.06em" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 0 3px rgba(34,197,94,0.2)" }} />
            LIVE
          </div>
        </div>
      </div>
    </div>
  );
}
