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

function srColor(sr: number): string {
  if (sr >= 150) return "#6a8f6a";
  if (sr >= 110) return "var(--text-2)";
  return "#8a4a44";
}

function ecoColor(eco: number): string {
  if (eco <= 7)  return "#6a8f6a";
  if (eco <= 10) return "var(--text-2)";
  return "#8a4a44";
}

const FantasyDot = () => (
  <span style={{
    display: "inline-block",
    width: 5, height: 5,
    borderRadius: "50%",
    background: "#a07830",
    opacity: 0.8,
    marginLeft: 5,
    verticalAlign: "middle",
    flexShrink: 0,
  }} />
);

const tblStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.72rem",
  tableLayout: "fixed",
};

const COL_WIDTHS = ["auto", 34, 28, 26, 26, 50] as const;

const ColGroup = () => (
  <colgroup>
    <col style={{ width: COL_WIDTHS[0] }} />
    {COL_WIDTHS.slice(1).map((w, i) => <col key={i} style={{ width: w }} />)}
  </colgroup>
);

const thBase: React.CSSProperties = {
  fontSize: "0.5rem",
  fontWeight: 600,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--text-3)",
  padding: "8px 6px",
  textAlign: "right",
  borderBottom: "1px solid var(--border)",
  background: "transparent",
};

export default function InningsTable({ inning, isFantasy }: Props) {
  const isFt = (n: string) => (isFantasy ? isFantasy(n) : false);
  const batters = inning.batting?.filter(b => !b.dnb) || [];
  const bowlers = inning.bowling || [];

  const topRunIdx = batters.reduce((best, b, i) => b.runs > (batters[best]?.runs ?? -1) ? i : best, 0);
  const topWktIdx = bowlers.reduce((best, b, i) => b.wickets > (bowlers[best]?.wickets ?? -1) ? i : best, 0);

  return (
    <div style={{
      borderRadius: 12,
      overflow: "hidden",
      background: "var(--surface)",
    }}>

      {/* BATTING */}
      {batters.length > 0 && (
        <>
          <div style={{
            padding: "9px 14px 7px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span style={{
              fontSize: "0.5rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--text-3)",
            }}>Batting</span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={tblStyle}>
              <ColGroup />
              <thead>
                <tr>
                  <th style={{ ...thBase, textAlign: "left", paddingLeft: 14 }}>Batter</th>
                  <th style={thBase}>R</th>
                  <th style={thBase}>B</th>
                  <th style={thBase}>4s</th>
                  <th style={thBase}>6s</th>
                  <th style={{ ...thBase, paddingRight: 14 }}>SR</th>
                </tr>
              </thead>
              <tbody>
                {batters.map((b, bi) => {
                  const ft    = isFt(b.name);
                  const isTop = bi === topRunIdx && b.runs > 0;
                  const srNum = parseFloat(b.sr) || 0;
                  const rowBg = isTop ? "rgba(160,120,48,0.07)" : "transparent";
                  return (
                    <tr key={bi} style={{
                      borderBottom: "1px solid var(--border)",
                      background: rowBg,
                      transition: "background 0.12s",
                    }}>
                      <td style={{ padding: "10px 6px 10px 14px", verticalAlign: "top" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <span style={{
                            fontSize: "0.8rem",
                            fontWeight: isTop ? 600 : 400,
                            color: isTop ? "#b8924a" : "var(--text)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 148,
                          }}>
                            {b.name}{b.notOut ? "*" : ""}
                          </span>
                          {ft && <FantasyDot />}
                        </div>
                        {b.dismissal && (
                          <div style={{
                            fontSize: "0.56rem",
                            color: "var(--text-3)",
                            marginTop: 3,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 148,
                            lineHeight: 1.3,
                          }}>{b.dismissal}</div>
                        )}
                      </td>
                      <td style={{ textAlign: "right", padding: "10px 6px", verticalAlign: "top" }}>
                        <span style={{
                          fontSize: isTop ? "0.92rem" : "0.82rem",
                          fontWeight: isTop ? 600 : 500,
                          color: isTop ? "#b8924a" : "var(--text)",
                          fontVariantNumeric: "tabular-nums",
                        }}>{b.runs}</span>
                      </td>
                      <td style={{ textAlign: "right", padding: "10px 6px", color: "var(--text-3)", verticalAlign: "top", fontVariantNumeric: "tabular-nums" }}>
                        {b.balls}
                      </td>
                      <td style={{ textAlign: "right", padding: "10px 6px", color: "var(--text-3)", verticalAlign: "top", fontVariantNumeric: "tabular-nums" }}>
                        {b.fours}
                      </td>
                      <td style={{ textAlign: "right", padding: "10px 6px", color: "var(--text-3)", verticalAlign: "top", fontVariantNumeric: "tabular-nums" }}>
                        {b.sixes}
                      </td>
                      <td style={{ textAlign: "right", padding: "10px 14px 10px 6px", fontSize: "0.66rem", color: srColor(srNum), verticalAlign: "top", fontVariantNumeric: "tabular-nums" }}>
                        {srNum.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* BOWLING */}
      {bowlers.length > 0 && (
        <>
          <div style={{
            padding: "9px 14px 7px",
            borderTop: batters.length > 0 ? "1px solid var(--border-2)" : undefined,
            borderBottom: "1px solid var(--border)",
            background: "var(--surface-2)",
          }}>
            <span style={{
              fontSize: "0.5rem",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "var(--text-3)",
            }}>Bowling</span>
          </div>

          <div style={{ overflowX: "auto", background: "var(--surface)" }}>
            <table style={tblStyle}>
              <ColGroup />
              <thead>
                <tr>
                  <th style={{ ...thBase, textAlign: "left", paddingLeft: 14 }}>Bowler</th>
                  <th style={thBase}>O</th>
                  <th style={thBase}>M</th>
                  <th style={thBase}>R</th>
                  <th style={thBase}>W</th>
                  <th style={{ ...thBase, paddingRight: 14 }}>Eco</th>
                </tr>
              </thead>
              <tbody>
                {bowlers.map((b, bi) => {
                  const ft     = isFt(b.name);
                  const isTop  = bi === topWktIdx && b.wickets > 0;
                  const ecoNum = parseFloat(b.eco) || 0;
                  const rowBg  = isTop ? "rgba(120,100,160,0.07)" : "transparent";
                  return (
                    <tr key={bi} style={{
                      borderBottom: "1px solid var(--border)",
                      background: rowBg,
                      transition: "background 0.12s",
                    }}>
                      <td style={{ padding: "10px 6px 10px 14px", verticalAlign: "top" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <span style={{
                            fontSize: "0.8rem",
                            fontWeight: isTop ? 600 : 400,
                            color: isTop ? "#9a88c0" : "var(--text)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 148,
                          }}>{b.name}</span>
                          {ft && <FantasyDot />}
                        </div>
                      </td>
                      <td style={{ textAlign: "right", padding: "10px 6px", color: "var(--text-3)", verticalAlign: "top", fontVariantNumeric: "tabular-nums" }}>
                        {b.overs}
                      </td>
                      <td style={{ textAlign: "right", padding: "10px 6px", color: "var(--text-3)", verticalAlign: "top", fontVariantNumeric: "tabular-nums" }}>
                        {b.maidens}
                      </td>
                      <td style={{ textAlign: "right", padding: "10px 6px", color: "var(--text-2)", verticalAlign: "top", fontVariantNumeric: "tabular-nums" }}>
                        {b.runs}
                      </td>
                      <td style={{ textAlign: "right", padding: "10px 6px", verticalAlign: "top" }}>
                        <span style={{
                          fontSize: isTop ? "0.92rem" : "0.82rem",
                          fontWeight: isTop ? 700 : 500,
                          color: isTop ? "#9a88c0" : "var(--text-2)",
                          fontVariantNumeric: "tabular-nums",
                        }}>{b.wickets}</span>
                      </td>
                      <td style={{ textAlign: "right", padding: "10px 14px 10px 6px", fontSize: "0.66rem", color: ecoColor(ecoNum), verticalAlign: "top", fontVariantNumeric: "tabular-nums" }}>
                        {ecoNum.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
