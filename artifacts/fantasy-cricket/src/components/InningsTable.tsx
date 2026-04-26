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
  wides?: number;
  noBalls?: number;
}

export interface ExtrasDetail {
  byes: number;
  lb: number;
  wides: number;
  nb: number;
  penalty: number;
  total: number;
}

export interface FowEntry {
  player: string;
  runs: number;
  wicket: number;
  overs: string;
}

export interface InningData {
  name: string;
  total: string;
  batting: BattingRow[];
  bowling: BowlingRow[];
  extras?: ExtrasDetail;
  fow?: FowEntry[];
}

interface Props {
  inning: InningData;
  isFantasy?: (name: string) => boolean;
}

const FantasyDot = () => (
  <span className="fantasy-tag">F</span>
);

const tblStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "0.72rem",
  tableLayout: "fixed",
};

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

const numTd: React.CSSProperties = {
  textAlign: "right",
  padding: "10px 6px",
  fontSize: "0.82rem",
  color: "var(--text-3)",
  verticalAlign: "top",
  fontVariantNumeric: "tabular-nums",
};

const SectionLabel = ({ children, withTopBorder = false }: { children: React.ReactNode; withTopBorder?: boolean }) => (
  <div style={{
    padding: "9px 14px 7px",
    borderBottom: "1px solid var(--border)",
    borderTop: withTopBorder ? "1px solid var(--border-2)" : undefined,
    background: withTopBorder ? "var(--surface-2)" : "transparent",
  }}>
    <span style={{
      fontSize: "0.5rem",
      fontWeight: 700,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: "var(--text-3)",
    }}>{children}</span>
  </div>
);

export default function InningsTable({ inning, isFantasy }: Props) {
  const isFt = (n: string) => (isFantasy ? isFantasy(n) : false);
  const batters = inning.batting?.filter(b => !b.dnb) || [];
  const dnbPlayers = inning.batting?.filter(b => b.dnb) || [];
  const bowlers = inning.bowling || [];
  const fow = inning.fow || [];
  const extras = inning.extras;

  const hasExtras = extras && (extras.byes + extras.lb + extras.wides + extras.nb + extras.penalty + extras.total) > 0;

  return (
    <div style={{ borderRadius: 12, overflow: "hidden", background: "var(--surface)" }}>

      {/* BATTING */}
      {batters.length > 0 && (
        <>
          <SectionLabel>Batting</SectionLabel>
          <div style={{ overflowX: "auto" }}>
            <table style={tblStyle}>
              <colgroup>
                <col style={{ width: "auto" }} />
                <col style={{ width: 34 }} />
                <col style={{ width: 28 }} />
                <col style={{ width: 26 }} />
                <col style={{ width: 26 }} />
                <col style={{ width: 46 }} />
              </colgroup>
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
                  const ft = isFt(b.name);
                  const srNum = parseFloat(b.sr) || 0;
                  return (
                    <tr key={bi} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "10px 6px 10px 14px", verticalAlign: "top" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <span style={{
                            fontSize: "0.8rem",
                            color: "var(--text)",
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
                      <td style={{ ...numTd, color: "var(--text)" }}>{b.runs}</td>
                      <td style={numTd}>{b.balls}</td>
                      <td style={numTd}>{b.fours}</td>
                      <td style={numTd}>{b.sixes}</td>
                      <td style={{ ...numTd, paddingRight: 14, fontSize: "0.72rem" }}>
                        {srNum.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}

                {/* Extras row */}
                {hasExtras && (
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "7px 6px 7px 14px", verticalAlign: "top" }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-2)" }}>Extras</span>
                      <div style={{ fontSize: "0.52rem", color: "var(--text-3)", marginTop: 2, lineHeight: 1.4 }}>
                        {[
                          extras!.byes > 0 && `b ${extras!.byes}`,
                          extras!.lb > 0 && `lb ${extras!.lb}`,
                          extras!.wides > 0 && `w ${extras!.wides}`,
                          extras!.nb > 0 && `nb ${extras!.nb}`,
                          extras!.penalty > 0 && `p ${extras!.penalty}`,
                        ].filter(Boolean).join("  ·  ")}
                      </div>
                    </td>
                    <td colSpan={5} style={{ textAlign: "right", padding: "7px 14px 7px 6px", verticalAlign: "top", fontSize: "0.82rem", color: "var(--text-2)", fontVariantNumeric: "tabular-nums" }}>
                      {extras!.total}
                    </td>
                  </tr>
                )}

                {/* Total row */}
                {inning.total && (
                  <tr>
                    <td style={{ padding: "8px 6px 8px 14px", verticalAlign: "top" }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-2)", fontWeight: 600 }}>Total</span>
                    </td>
                    <td colSpan={5} style={{ textAlign: "right", padding: "8px 14px 8px 6px", verticalAlign: "top", fontSize: "0.82rem", fontWeight: 600, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>
                      {inning.total}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Did Not Bat */}
          {dnbPlayers.length > 0 && (
            <div style={{ padding: "7px 14px", borderTop: "1px solid var(--border)" }}>
              <span style={{ fontSize: "0.5rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginRight: 6 }}>
                DNB
              </span>
              <span style={{ fontSize: "0.65rem", color: "var(--text-3)", lineHeight: 1.5 }}>
                {dnbPlayers.map((p, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span style={{ color: "var(--border)", margin: "0 4px" }}>·</span>}
                    <span>{p.name}</span>
                    {isFt(p.name) && <span className="fantasy-tag">F</span>}
                  </React.Fragment>
                ))}
              </span>
            </div>
          )}

          {/* Fall of Wickets */}
          {fow.length > 0 && (
            <div style={{ padding: "7px 14px 9px", borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.5rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 5 }}>
                Fall of Wickets
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px" }}>
                {fow.map((f, i) => (
                  <span key={i} style={{ fontSize: "0.6rem", color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>
                    <span style={{ color: "var(--text-2)" }}>{f.runs}/{f.wicket}</span>
                    {f.player && <span> ({f.player.split(" ").pop()}{f.overs ? `, ${f.overs}ov` : ""})</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* BOWLING */}
      {bowlers.length > 0 && (
        <>
          <SectionLabel withTopBorder={batters.length > 0}>Bowling</SectionLabel>
          <div style={{ overflowX: "auto", background: "var(--surface)" }}>
            <table style={tblStyle}>
              <colgroup>
                <col style={{ width: "auto" }} />
                <col style={{ width: 32 }} />
                <col style={{ width: 24 }} />
                <col style={{ width: 28 }} />
                <col style={{ width: 24 }} />
                <col style={{ width: 46 }} />
              </colgroup>
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
                  const ft = isFt(b.name);
                  const ecoNum = parseFloat(b.eco) || 0;
                  return (
                    <tr key={bi} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "10px 6px 10px 14px", verticalAlign: "top" }}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <span style={{
                            fontSize: "0.8rem",
                            color: "var(--text)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 148,
                          }}>{b.name}</span>
                          {ft && <FantasyDot />}
                        </div>
                      </td>
                      <td style={numTd}>{b.overs}</td>
                      <td style={numTd}>{b.maidens}</td>
                      <td style={numTd}>{b.runs}</td>
                      <td style={numTd}>{b.wickets}</td>
                      <td style={{ ...numTd, paddingRight: 14, fontSize: "0.72rem" }}>
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
