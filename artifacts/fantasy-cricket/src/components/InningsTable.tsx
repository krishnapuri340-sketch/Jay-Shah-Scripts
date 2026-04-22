import React from "react";

export interface BattingRow {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  sr: string;
  dismissal?: string;
  notOut?: boolean;
  dnb?: boolean;
}

export interface BowlingRow {
  name: string;
  overs: string;
  maidens: number;
  runs: number;
  wickets: number;
  eco: string;
}

export interface InningData {
  name: string;
  total: string;
  batting: BattingRow[];
  bowling: BowlingRow[];
}

interface Props {
  inning: InningData;
  isFantasy?: (name: string) => boolean;
}

const COL_WIDTHS = ["auto", 36, 28, 30, 28, 54] as const;
const tblStyle: React.CSSProperties = { width: "100%", borderCollapse: "collapse", fontSize: "0.68rem", tableLayout: "fixed" };
const tdN = (extra?: React.CSSProperties): React.CSSProperties => ({ textAlign: "right", paddingTop: 5, paddingBottom: 5, paddingLeft: 2, paddingRight: 5, ...extra });
const thN = (extra?: React.CSSProperties): React.CSSProperties => ({ textAlign: "right", paddingTop: 4, paddingBottom: 4, paddingLeft: 2, paddingRight: 5, fontWeight: 600, ...extra });

const ColGroup = () => (
  <colgroup>
    <col style={{ width: COL_WIDTHS[0] }} />
    {COL_WIDTHS.slice(1).map((w, ci) => <col key={ci} style={{ width: w }} />)}
  </colgroup>
);

const FantasyTag = () => (
  <span style={{ fontSize: "0.5rem", fontWeight: 800, color: "#22c55e", background: "#22c55e1a", borderRadius: 3, padding: "0 3px", lineHeight: "1.5", flexShrink: 0 }}>F</span>
);

export default function InningsTable({ inning, isFantasy }: Props) {
  const isFt = (n: string) => (isFantasy ? isFantasy(n) : false);
  const batters = inning.batting?.filter(b => !b.dnb) || [];
  const bowlers = inning.bowling || [];

  return (
    <div className="inn-body" style={{ borderRadius: 10, border: "1px solid var(--border)" }}>
      {batters.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table style={tblStyle}>
            <ColGroup />
            <thead><tr style={{ color: "var(--text-3)", borderBottom: "1px solid var(--border)" }}>
              <th style={{ textAlign: "left", padding: "4px 6px", fontWeight: 600 }}>Batter</th>
              <th style={thN()}>R</th><th style={thN()}>B</th><th style={thN()}>4s</th><th style={thN()}>6s</th>
              <th style={thN({ paddingRight: 9 })}>SR</th>
            </tr></thead>
            <tbody>
              {batters.map((b, bi) => {
                const ft = isFt(b.name);
                return (
                  <tr key={bi} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "5px 0 5px 6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: ft ? 600 : 400 }}>{b.name}{b.notOut ? "*" : ""}</span>
                        {ft && <FantasyTag />}
                      </div>
                      <div style={{ color: "var(--text-3)", fontSize: "0.58rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.dismissal}</div>
                    </td>
                    <td style={tdN({ color: "var(--text-2)" })}>{b.runs}</td>
                    <td style={tdN({ color: "var(--text-3)" })}>{b.balls}</td>
                    <td style={tdN({ color: "var(--text-3)" })}>{b.fours}</td>
                    <td style={tdN({ color: "var(--text-3)" })}>{b.sixes}</td>
                    <td style={tdN({ color: "var(--text-3)", fontSize: "0.62rem", paddingRight: 9 })}>{parseFloat(b.sr).toFixed(1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {bowlers.length > 0 && (
        <div style={{ marginTop: 6, overflowX: "auto" }}>
          <table style={tblStyle}>
            <ColGroup />
            <thead><tr style={{ color: "var(--text-3)", borderBottom: "1px solid var(--border)" }}>
              <th style={{ textAlign: "left", padding: "4px 6px", fontWeight: 600 }}>Bowler</th>
              <th style={thN()}>O</th><th style={thN()}>M</th><th style={thN()}>R</th><th style={thN()}>W</th>
              <th style={thN({ paddingRight: 9 })}>ECO</th>
            </tr></thead>
            <tbody>
              {bowlers.map((b, bi) => {
                const ft = isFt(b.name);
                return (
                  <tr key={bi} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "5px 0 5px 6px", overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, overflow: "hidden" }}>
                        <span style={{ color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: ft ? 600 : 400 }}>{b.name}</span>
                        {ft && <FantasyTag />}
                      </div>
                    </td>
                    <td style={tdN({ color: "var(--text-3)" })}>{b.overs}</td>
                    <td style={tdN({ color: "var(--text-3)" })}>{b.maidens}</td>
                    <td style={tdN({ color: "var(--text-3)" })}>{b.runs}</td>
                    <td style={tdN({ color: "var(--text-2)" })}>{b.wickets}</td>
                    <td style={tdN({ color: "var(--text-3)", fontSize: "0.62rem", paddingRight: 9 })}>{parseFloat(b.eco).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
