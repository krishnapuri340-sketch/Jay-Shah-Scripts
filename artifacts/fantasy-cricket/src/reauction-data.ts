// ─── Re-Auction Data — April 23, 2026 ───────────────────────────────────────
// Scoring rule:
//   Unchanged slot  → playerPoints[name]
//   Swapped slot    → frozenPts + max(0, playerPoints[name] - preAuctionOffset)
//
// frozenPts      = released player's season points locked at auction date
// preAuctionOffset = new player's cumulative points BEFORE the auction (subtracted)

export const REAUCTION_DATE = "April 23, 2026";

export type RaPlayer = {
  name: string;
  role: "BAT" | "BWL" | "AR" | "WK";
  ipl: string;
  price?: number;
  isNew?: true;           // came in via re-auction
  frozenPts?: number;     // released player's locked points
  preAuctionOffset?: number; // new player's pre-auction total (subtracted from live total)
  replacedName?: string;  // who they replaced
};

export type RaTeam = {
  id: string;
  captain: string;
  vc: string;
  players: RaPlayer[];
};

// ─── PONYGOAT ─────────────────────────────────────────────────────────────────
// Released: Travis Head (364), Tim Seifert (6), Marcus Stoinis (127),
//           Suryakumar Yadav (305), Khaleel Ahmed (170), Ryan Rickelton (297)
// Empty slot filled: Ayush Badoni
const ponygoat: RaTeam = {
  id: "ponygoat",
  captain: "Sunil Narine",
  vc: "Jasprit Bumrah",
  players: [
    // ── Unchanged ────────────────────────────────────────────────────────────
    { name: "Yashasvi Jaiswal",   role: "BAT", ipl: "RR",   price: 19 },
    { name: "Virat Kohli",        role: "BAT", ipl: "RCB",  price: 16 },
    { name: "Shashank Singh",     role: "AR",  ipl: "PBKS", price: 3.5 },
    { name: "Sunil Narine",       role: "AR",  ipl: "KKR",  price: 13.5 },
    { name: "Jasprit Bumrah",     role: "BWL", ipl: "MI",   price: 19.5 },
    { name: "Ravindra Jadeja",    role: "AR",  ipl: "RR",   price: 9.5 },
    { name: "KL Rahul",           role: "WK",  ipl: "DC",   price: 10 },
    { name: "Mitchell Marsh",     role: "AR",  ipl: "LSG",  price: 11.5 },
    { name: "Kuldeep Yadav",      role: "BWL", ipl: "DC",   price: 3 },
    { name: "Washington Sundar",  role: "AR",  ipl: "GT",   price: 1 },
    { name: "T Natarajan",        role: "BWL", ipl: "DC",   price: 1 },
    // ── Acquired ─────────────────────────────────────────────────────────────
    { name: "Cameron Green",      role: "AR",  ipl: "KKR",  price: 12,   isNew: true, frozenPts: 364, preAuctionOffset: 388, replacedName: "Travis Head" },
    { name: "Varun Chakravarthy", role: "BWL", ipl: "KKR",  price: 8,    isNew: true, frozenPts: 6,   preAuctionOffset: 258, replacedName: "Tim Seifert" },
    { name: "Ayush Badoni",       role: "BAT", ipl: "LSG",  price: 3,    isNew: true, frozenPts: 0,   preAuctionOffset: 294, replacedName: undefined },
    { name: "Pathum Nissanka",    role: "BAT", ipl: "DC",   price: 2,    isNew: true, frozenPts: 127, preAuctionOffset: 300, replacedName: "Marcus Stoinis" },
    { name: "Cooper Connolly",    role: "AR",  ipl: "PBKS", price: 2.5,  isNew: true, frozenPts: 305, preAuctionOffset: 465, replacedName: "Suryakumar Yadav" },
    { name: "Quinton de Kock",    role: "WK",  ipl: "LSG",  price: 3.5,  isNew: true, frozenPts: 170, preAuctionOffset: 282, replacedName: "Khaleel Ahmed" },
    { name: "Anshul Kamboj",      role: "BWL", ipl: "CSK",  price: 3.8,  isNew: true, frozenPts: 297, preAuctionOffset: 689, replacedName: "Ryan Rickelton" },
  ],
};

// ─── RAJVEER ──────────────────────────────────────────────────────────────────
// Released: Cameron Green (388), Jacob Bethell (0), Nicholas Pooran (167), Deepak Chahar (84)
const rajveer: RaTeam = {
  id: "rajveer",
  captain: "Rajat Patidar",
  vc: "Axar Patel",
  players: [
    // ── Unchanged ────────────────────────────────────────────────────────────
    { name: "Rajat Patidar",      role: "BAT", ipl: "RCB",  price: 7 },
    { name: "Axar Patel",         role: "AR",  ipl: "DC",   price: 7 },
    { name: "Shubman Gill",       role: "BAT", ipl: "GT",   price: 14 },
    { name: "Jos Buttler",        role: "WK",  ipl: "GT",   price: 7 },
    { name: "Yuzvendra Chahal",   role: "BWL", ipl: "PBKS", price: 2 },
    { name: "Bhuvneshwar Kumar",  role: "BWL", ipl: "RCB",  price: 5 },
    { name: "Shreyas Iyer",       role: "BAT", ipl: "PBKS", price: 14 },
    { name: "Phil Salt",          role: "WK",  ipl: "RCB",  price: 14 },
    { name: "Krunal Pandya",      role: "AR",  ipl: "RCB",  price: 6 },
    { name: "Priyansh Arya",      role: "BAT", ipl: "PBKS", price: 6.5 },
    { name: "Vaibhav Suryavanshi",role: "BAT", ipl: "RR",   price: 5 },
    { name: "Dhruv Jurel",        role: "WK",  ipl: "RR",   price: 0.5 },
    { name: "Mohammed Shami",     role: "BWL", ipl: "LSG",  price: 0.5 },
    { name: "Tim David",          role: "BAT", ipl: "RCB",  price: 0.5 },
    // ── Acquired ─────────────────────────────────────────────────────────────
    { name: "Jofra Archer",       role: "BWL", ipl: "MI",   price: 8,    isNew: true, frozenPts: 388, preAuctionOffset: 613, replacedName: "Cameron Green" },
    { name: "Devdutt Padikkal",   role: "BAT", ipl: "KKR",  price: 4,    isNew: true, frozenPts: 0,   preAuctionOffset: 369, replacedName: "Jacob Bethell" },
    { name: "Nitish Kumar Reddy", role: "AR",  ipl: "SRH",  price: 6,    isNew: true, frozenPts: 167, preAuctionOffset: 510, replacedName: "Nicholas Pooran" },
    { name: "Kagiso Rabada",      role: "BWL", ipl: "KKR",  price: 7,    isNew: true, frozenPts: 84,  preAuctionOffset: 553, replacedName: "Deepak Chahar" },
  ],
};

// ─── MUMBAI ───────────────────────────────────────────────────────────────────
// Released: Sherfane Rutherford (247), Finn Allen (187), Venkatesh Iyer (61),
//           Prashant Veer (97), Nitish Rana (209), Harshal Patel (34)
const mumbai: RaTeam = {
  id: "mumbai",
  captain: "Hardik Pandya",
  vc: "Sanju Samson",
  players: [
    // ── Unchanged ────────────────────────────────────────────────────────────
    { name: "Rishabh Pant",       role: "WK",  ipl: "LSG",  price: 10 },
    { name: "Dewald Brevis",      role: "BAT", ipl: "CSK",  price: 3.5 },
    { name: "Rohit Sharma",       role: "BAT", ipl: "MI",   price: 7 },
    { name: "Rinku Singh",        role: "BAT", ipl: "KKR",  price: 1.5 },
    { name: "Heinrich Klaasen",   role: "WK",  ipl: "SRH",  price: 5 },
    { name: "Ruturaj Gaikwad",    role: "WK",  ipl: "CSK",  price: 3.5 },
    { name: "Lungi Ngidi",        role: "BWL", ipl: "DC",   price: 1 },
    { name: "Mohammed Siraj",     role: "BWL", ipl: "GT",   price: 1.5 },
    { name: "Tristan Stubbs",     role: "BAT", ipl: "DC",   price: 3.5 },
    { name: "Sanju Samson",       role: "WK",  ipl: "CSK",  price: 20 },
    { name: "Ishan Kishan",       role: "WK",  ipl: "SRH",  price: 16.5 },
    { name: "Hardik Pandya",      role: "AR",  ipl: "MI",   price: 30 },
    // ── Acquired ─────────────────────────────────────────────────────────────
    { name: "Will Jacks",         role: "AR",  ipl: "MI",   price: 10,   isNew: true, frozenPts: 247, preAuctionOffset: 0,   replacedName: "Sherfane Rutherford" },
    { name: "Vijaykumar Vyshak",  role: "BWL", ipl: "KKR",  price: 4,    isNew: true, frozenPts: 187, preAuctionOffset: 276, replacedName: "Finn Allen" },
    { name: "Sakib Hussain",      role: "AR",  ipl: "DC",   price: 2,    isNew: true, frozenPts: 61,  preAuctionOffset: 290, replacedName: "Venkatesh Iyer" },
    { name: "Josh Hazlewood",     role: "BWL", ipl: "RCB",  price: 4,    isNew: true, frozenPts: 97,  preAuctionOffset: 180, replacedName: "Prashant Veer" },
    { name: "Ravi Bishnoi",       role: "BWL", ipl: "LSG",  price: 7,    isNew: true, frozenPts: 209, preAuctionOffset: 488, replacedName: "Nitish Rana" },
    { name: "Sarfaraz Khan",      role: "BAT", ipl: "DC",   price: 3,    isNew: true, frozenPts: 34,  preAuctionOffset: 390, replacedName: "Harshal Patel" },
  ],
};

// ─── MOMBASA ──────────────────────────────────────────────────────────────────
// Released: Will Jacks (0), Shivam Dube (302), Nehal Wadhera (94),
//           Varun Chakravarthy (258), Trent Boult (69), Shimron Hetmyer (160), Jitesh Sharma (160)
const mombasa: RaTeam = {
  id: "mombasa",
  captain: "Abhishek Sharma",
  vc: "Sai Sudharsan",
  players: [
    // ── Unchanged ────────────────────────────────────────────────────────────
    { name: "Marco Jansen",       role: "AR",  ipl: "PBKS", price: 4.5 },
    { name: "Arshdeep Singh",     role: "BWL", ipl: "PBKS", price: 15 },
    { name: "Riyan Parag",        role: "BAT", ipl: "RR",   price: 6 },
    { name: "Abhishek Sharma",    role: "AR",  ipl: "SRH",  price: 15.5 },
    { name: "Prabhsimran Singh",  role: "WK",  ipl: "PBKS", price: 6 },
    { name: "Sai Sudharsan",      role: "BAT", ipl: "GT",   price: 8 },
    { name: "Prasidh Krishna",    role: "BWL", ipl: "GT",   price: 4.5 },
    { name: "Aiden Markram",      role: "AR",  ipl: "LSG",  price: 9 },
    { name: "Rashid Khan",        role: "AR",  ipl: "GT",   price: 8.5 },
    { name: "Ajinkya Rahane",     role: "BAT", ipl: "KKR",  price: 3 },
    { name: "Tilak Varma",        role: "AR",  ipl: "MI",   price: 26.5 },
    // ── Acquired ─────────────────────────────────────────────────────────────
    { name: "Shimron Hetmyer",    role: "BAT", ipl: "RR",   price: 3.5,  isNew: true, frozenPts: 0,   preAuctionOffset: 160, replacedName: "Will Jacks" },
    { name: "Travis Head",        role: "BAT", ipl: "SRH",  price: 11.5, isNew: true, frozenPts: 302, preAuctionOffset: 364, replacedName: "Shivam Dube" },
    { name: "Sameer Rizvi",       role: "BAT", ipl: "CSK",  price: 4,    isNew: true, frozenPts: 94,  preAuctionOffset: 411, replacedName: "Nehal Wadhera" },
    { name: "Suryakumar Yadav",   role: "BAT", ipl: "MI",   price: 20.5, isNew: true, frozenPts: 258, preAuctionOffset: 305, replacedName: "Varun Chakravarthy" },
    { name: "Shivam Dube",        role: "AR",  ipl: "CSK",  price: 10,   isNew: true, frozenPts: 69,  preAuctionOffset: 302, replacedName: "Trent Boult" },
    { name: "Jamie Overton",      role: "AR",  ipl: "CSK",  price: 5,    isNew: true, frozenPts: 160, preAuctionOffset: 616, replacedName: "Shimron Hetmyer" },
    { name: "Naman Dhir",         role: "BAT", ipl: "MI",   price: 2,    isNew: true, frozenPts: 160, preAuctionOffset: 356, replacedName: "Jitesh Sharma" },
  ],
};

export const RA_TEAMS: Record<string, RaTeam> = { rajveer, mombasa, mumbai, ponygoat };
export const RA_TEAM_ORDER = ["rajveer", "mombasa", "mumbai", "ponygoat"] as const;

// ── Score helpers ─────────────────────────────────────────────────────────────

/** Effective points for a single re-auction player slot */
export function raSlotPts(p: RaPlayer, livePoints: Record<string, number> | null | undefined): number {
  const pts = livePoints ?? {};
  const live = pts[p.name] || 0;
  if (!p.isNew) return live;
  const frozen = p.frozenPts ?? 0;
  const offset = p.preAuctionOffset ?? 0;
  return frozen + Math.max(0, live - offset);
}

/** Apply captain/VC multiplier (same as main scoring) */
export function raAdjPts(raw: number, isCap: boolean, isVC: boolean): number {
  if (isCap) return raw * 2;
  if (isVC) return raw * 1.5;
  return raw;
}

/** Compute a team's re-auction score (top-11 after adjustments) */
export function raTeamScore(teamId: string, livePoints: Record<string, number> | null | undefined): {
  total: number;
  top11: Set<string>;
  players: Array<RaPlayer & { slotPts: number; adjPts: number }>;
} {
  const team = RA_TEAMS[teamId];
  const scored = team.players.map(p => {
    const slotPts = raSlotPts(p, livePoints);
    const adj = raAdjPts(slotPts, p.name === team.captain, p.name === team.vc);
    return { ...p, slotPts, adjPts: adj };
  }).sort((a, b) => b.adjPts - a.adjPts);

  const top11Set = new Set(scored.slice(0, 11).map(p => p.name));
  const total = Math.round(
    scored.filter(p => top11Set.has(p.name)).reduce((s, p) => s + p.adjPts, 0)
  );
  return { total, top11: top11Set, players: scored };
}
