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

const SectionLabel = ({ children, withTopBorder = false }: { children: React.ReactNode; withTopBorder?: boolean }) => (
  <div style={{
    padding: "9px 14px 7px",
    borderBottom: "1px solid var(--border)",
    borderTop: withTopBorder ? "1px solid var(--border-2)" : undefined,
    background: withTopBorder ? "var(--surface-2)" : "transparent",
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

  const topRunIdx = batters.reduce((best, b, i) => b.runs > (batters[best]?.runs ?? -1) ? i : best, 0);
  const topWktIdx = bowlers.reduce((best, b, i) => b.wickets > (bowlers[best]?.wickets ?? -1) ? i : best, 0);

  const hasExtras = extras && (extras.byes + extras.lb + extras.wides + extras.nb + extras.penalty + extras.total) > 0;
  const hasWidesOrNb = bowlers.some(b => (b.wides ?? 0) > 0 || (b.noBalls ?? 0) > 0);

  return (
    <div style={{
      borderRadius: 12,
      overflow: "hidden",
      background: "var(--surface)",
    }}>

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
                <col style={{ width: 50 }} />
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
                      <td style={{ textAlign: "right", padding: "10px 6px", verticalAlign: "top", fontVariantNumeric: "tabular-nums", fontSize: "0.82rem", fontWeight: isTop ? 600 : 500, color: isTop ? "#b8924a" : "var(--text)" }}>
                        {b.runs}
                      </td>
                      <td style={{ textAlign: "right", padding: "10px 6px", verticalAlign: "top", fontVariantNumeric: "tabular-nums", fontSize: "0.82rem", color: "var(--text-3)" }}>
                        {b.balls}
                      </td>
                      <td style={{ textAlign: "right", padding: "10px 6px", verticalAlign: "top", fontVariantNumeric: "tabular-nums", fontSize: "0.82rem", color: "var(--text-3)" }}>
                        {b.fours}
                      </td>
                      <td style={{ textAlign: "right", padding: "10px 6px", verticalAlign: "top", fontVariantNumeric: "tabular-nums", fontSize: "0.82rem", color: "var(--text-3)" }}>
                        {b.sixes}
                      </td>
                      <td style={{ textAlign: "right", padding: "10px 14px 10px 6px", fontSize: "0.72rem", color: srColor(srNum), verticalAlign: "top", fontVariantNumeric: "tabular-nums" }}>
                        {srNum.toFixed(1)}
                      </td>
                    </tr>
                  );
                })}

                {/* Extras row */}
                {hasExtras && (
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "7px 6px 7px 14px", verticalAlign: "top" }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-2)", fontWeight: 500 }}>Extras</span>
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
                    <td colSpan={5} style={{ textAlign: "right", padding: "7px 14px 7px 6px", verticalAlign: "top" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--text-2)", fontVariantNumeric: "tabular-nums" }}>
                        {extras!.total}
                      </span>
                    </td>
                  </tr>
                )}

                {/* Innings total row */}
                {inning.total && (
                  <tr>
                    <td style={{ padding: "8px 6px 8px 14px", verticalAlign: "top" }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-2)", fontWeight: 600 }}>Total</span>
                    </td>
                    <td colSpan={5} style={{ textAlign: "right", padding: "8px 14px 8px 6px", verticalAlign: "top" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text)", fontVariantNumeric: "tabular-nums" }}>
                        {inning.total}
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Did Not Bat */}
          {dnbPlayers.length > 0 && (
            <div style={{
              padding: "7px 14px",
              borderTop: "1px solid var(--border)",
              background: "transparent",
            }}>
              <span style={{ fontSize: "0.5rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginRight: 6 }}>
                DNB
              </span>
              <span style={{ fontSize: "0.65rem", color: "var(--text-3)", lineHeight: 1.5 }}>
                {dnbPlayers.map((p, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span style={{ color: "var(--border)", margin: "0 4px" }}>·</span>}
                    <span style={{ color: "var(--text-3)" }}>{p.name}</span>
                    {isFt(p.name) && <span className="fantasy-tag">F</span>}
                  </React.Fragment>
                ))}
              </span>
            </div>
          )}

          {/* Fall of Wickets */}
          {fow.length > 0 && (
            <div style={{
              padding: "7px 14px 9px",
              borderTop: "1px solid var(--border)",
              background: "transparent",
            }}>
              <div style={{ fontSize: "0.5rem", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", marginBottom: 5 }}>
                Fall of Wickets
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 10px" }}>
                {fow.map((f, i) => (
                  <span key={i} style={{ fontSize: "0.6rem", color: "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>
                    <span style={{ color: "var(--text-2)", fontWeight: 500 }}>{f.runs}</span>
                    {f.wicket > 0 && <span style={{ color: "var(--text-3)" }}>-{f.wicket}</span>}
                    {f.player && <span style={{ color: "var(--text-3)" }}> ({f.player.split(" ").pop()}{f.overs ? `, ${f.overs}` : ""})</span>}
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
                {hasWidesOrNb && <col style={{ width: 24 }} />}
                {hasWidesOrNb && <col style={{ width: 24 }} />}
                <col style={{ width: 46 }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ ...thBase, textAlign: "left", paddingLeft: 14 }}>Bowler</th>
                  <th style={thBase}>O</th>
                  <th style={thBase}>M</th>
                  <th style={thBase}>R</th>
                  <th style={thBase}>W</th>
                  {hasWidesOrNb && <th style={thBase}>Wd</th>}
                  {hasWidesOrNb && <th style={thBase}>NB</th>}
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
                      <td style={{ textAlign: "right", padding: "10px 6px", fontSize: "0.82rem", color: "var(--text-3)", verticalAlign: "top", fontVariantNumeric: "tabular-nums" }}>
                        {b.overs}
                      </td>
                      <td style={{ textAlign: "right", padding: "10px 6px", fontSize: "0.82rem", color: "var(--text-3)", verticalAlign: "top", fontVariantNumeric: "tabular-nums" }}>
                        {b.maidens}
                      </td>
                      <td style={{ textAlign: "right", padding: "10px 6px", fontSize: "0.82rem", color: "var(--text-2)", verticalAlign: "top", fontVariantNumeric: "tabular-nums" }}>
                        {b.runs}
                      </td>
                      <td style={{ textAlign: "right", padding: "10px 6px", fontSize: "0.82rem", color: "var(--text-3)", verticalAlign: "top", fontVariantNumeric: "tabular-nums" }}>
                        {b.wickets}
                      </td>
                      {hasWidesOrNb && (
                        <td style={{ textAlign: "right", padding: "10px 6px", color: "var(--text-3)", verticalAlign: "top", fontVariantNumeric: "tabular-nums", fontSize: "0.82rem" }}>
                          {(b.wides ?? 0) > 0 ? b.wides : <span style={{ opacity: 0.3 }}>—</span>}
                        </td>
                      )}
                      {hasWidesOrNb && (
                        <td style={{ textAlign: "right", padding: "10px 6px", color: "var(--text-3)", verticalAlign: "top", fontVariantNumeric: "tabular-nums", fontSize: "0.82rem" }}>
                          {(b.noBalls ?? 0) > 0 ? b.noBalls : <span style={{ opacity: 0.3 }}>—</span>}
                        </td>
                      )}
                      <td style={{ textAlign: "right", padding: "10px 14px 10px 6px", fontSize: "0.72rem", color: ecoColor(ecoNum), verticalAlign: "top", fontVariantNumeric: "tabular-nums" }}>
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
