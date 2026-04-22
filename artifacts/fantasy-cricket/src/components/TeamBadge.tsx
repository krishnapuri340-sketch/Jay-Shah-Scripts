import React, { useState } from "react";
import { IPL_TEAM_BADGE, ABBR_TO_TEAM, TEAM_LOGO_CDN } from "../constants";

export default function TeamBadge({ name, size = 32 }: { name: string; size?: number }) {
  const b = IPL_TEAM_BADGE[name] || IPL_TEAM_BADGE[ABBR_TO_TEAM[name]] || { abbr: name.slice(0, 2).toUpperCase(), bg: "#444", fg: "#fff" };
  const logoUrl = TEAM_LOGO_CDN[b.abbr];
  const fs = b.abbr.length >= 4 ? size * 0.27 : b.abbr.length === 3 ? size * 0.3 : size * 0.35;
  const [imgFailed, setImgFailed] = useState(false);
  const showLogo = logoUrl && !imgFailed;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: showLogo ? "transparent" : b.bg,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      border: showLogo ? "none" : "1.5px solid rgba(255,255,255,0.12)",
      overflow: "hidden", position: "relative",
    }}>
      {logoUrl && !imgFailed ? (
        <img src={logoUrl} alt={b.abbr}
          style={{ width: size, height: size, objectFit: "contain" }}
          onError={() => setImgFailed(true)} />
      ) : (
        <span style={{ color: b.fg, fontSize: fs, fontWeight: 800, letterSpacing: "-0.3px", lineHeight: 1 }}>{b.abbr}</span>
      )}
    </div>
  );
}
