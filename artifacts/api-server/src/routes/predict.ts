import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

const IPL_S3_BASE = "https://ipl-stats-sports-mechanic.s3.ap-south-1.amazonaws.com/ipl/feeds";

function parseJsonp(text: string): any {
  const m = text.match(/^[A-Za-z_$][A-Za-z0-9_$]*\(([\s\S]*)\)\s*;?\s*$/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

interface PredictionCache {
  [matchId: string]: { prediction: string; timestamp: number };
}
const predCache: PredictionCache = {};
const PRED_TTL = 60 * 60 * 1000; // 1 hour

router.post("/ipl/predict", async (req, res) => {
  const { matchId } = req.body;
  if (!matchId) return res.status(400).json({ error: "matchId required" });

  const cached = predCache[matchId];
  if (cached && Date.now() - cached.timestamp < PRED_TTL) {
    return res.json({ prediction: cached.prediction, cached: true });
  }

  try {
    // Fetch match details from S3 schedule
    const schedRes = await fetch(`${IPL_S3_BASE}/284-matchschedule.js`, { signal: AbortSignal.timeout(8000) });
    const schedText = await schedRes.text();
    const sched = parseJsonp(schedText);
    const allMatches: any[] = sched?.Matchsummary || [];
    const match = allMatches.find((m: any) => String(m.MatchID) === String(matchId));
    if (!match) return res.status(404).json({ error: "Match not found" });

    // Fetch current standings for team form
    const standRes = await fetch(`${IPL_S3_BASE}/stats/284-groupstandings.js`, { signal: AbortSignal.timeout(8000) });
    const standText = await standRes.text();
    const standData = parseJsonp(standText);
    const standings: any[] = standData?.points || [];

    const homeTeam = match.HomeTeamName || match.Team1 || "";
    const awayTeam = match.AwayTeamName || match.Team2 || "";
    const venue = match.GroundName || match.Venue || "";
    const matchDate = match.MatchDate || match.GMTMatchDate || "";

    const getTeamStanding = (teamName: string) =>
      standings.find((s: any) => s.TeamName?.toLowerCase().includes(teamName.toLowerCase().split(" ")[0]) ||
        teamName.toLowerCase().includes(s.TeamName?.toLowerCase().split(" ")[0]));

    const homeSt = getTeamStanding(homeTeam);
    const awaySt = getTeamStanding(awayTeam);

    const teamContext = (name: string, st: any) => {
      if (!st) return `${name}: no matches played yet`;
      const form = st.Performance || "";
      const formStr = form.split("").map((c: string) => c === "W" ? "✓Win" : c === "L" ? "✗Loss" : "NR").join(" → ");
      return `${name}: P${st.Matches || 0} W${st.Wins || 0} L${st.Loss || 0} | NRR: ${parseFloat(st.NetRunRate || 0).toFixed(3)} | Form: ${formStr || "No matches played"}`;
    };

    // Fetch recent completed match summaries for quick context
    const completedMatches = allMatches.filter((m: any) => m.MatchStatus === "Post");
    const recentResults = completedMatches.slice(-5).map((m: any) =>
      `Match ${m.MatchNo || ""}: ${m.HomeTeamName} vs ${m.AwayTeamName} → ${m.Commentss || m.MatchResult || "Result pending"}`
    ).join("\n");

    const prompt = `You are an expert IPL 2026 cricket analyst. Predict the upcoming match using current season data.

MATCH: ${homeTeam} vs ${awayTeam}
VENUE: ${venue || "TBD"}
DATE: ${matchDate || "Upcoming"}

CURRENT STANDINGS & FORM:
${teamContext(homeTeam, homeSt)}
${teamContext(awayTeam, awaySt)}

RECENT IPL 2026 RESULTS:
${recentResults || "Tournament just started"}

VENUE NOTES: ${venue ? `${venue} — consider pitch conditions, dimensions, and any home advantage.` : "Venue TBD."}

Provide a concise match prediction in exactly this format:

**Winner Prediction:** [Team Name] (confidence: High/Medium/Low)
**Margin:** [Expected winning margin, e.g. "by 6 wickets" or "by 15 runs"]
**Key Factors:**
• [Factor 1 — team/player form]
• [Factor 2 — venue/pitch]  
• [Factor 3 — head-to-head or squad strength]
**Players to Watch:** [2-3 player names with brief reason]
**Fantasy Tip:** [1 sentence fantasy advice for captaincy/vice-captaincy picks]

Keep it sharp and data-driven. Max 150 words total.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });

    const prediction = response.choices[0]?.message?.content || "Unable to generate prediction.";
    predCache[matchId] = { prediction, timestamp: Date.now() };

    res.json({
      prediction,
      matchInfo: { homeTeam, awayTeam, venue, matchDate },
      cached: false,
    });
  } catch (err: any) {
    req.log.error({ err }, "Failed to generate prediction");
    res.status(500).json({ error: "Prediction failed", detail: err.message });
  }
});

export default router;
