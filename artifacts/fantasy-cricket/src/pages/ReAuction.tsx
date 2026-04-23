import React from "react";

export default function ReAuctionPage() {
  return (
    <div className="tab-view">
      <div className="sec-title">Re-Auction</div>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 24px",
        gap: 12,
        color: "var(--text-3)",
        textAlign: "center",
      }}>
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
        <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-2)" }}>Coming soon</div>
        <div style={{ fontSize: "0.68rem", lineHeight: 1.6, maxWidth: 260 }}>
          Re-Auction tools are being set up.
        </div>
      </div>
    </div>
  );
}
