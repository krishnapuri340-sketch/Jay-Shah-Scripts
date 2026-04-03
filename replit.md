# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## IPL Fantasy Cricket 2026 Tracker

Primary application: IPL Fantasy Cricket Tracker for 4 teams (Rajveer Puri, Mombasa K, Mumbai Ma, PonyGoat).

### Architecture
- **Frontend**: `artifacts/fantasy-cricket` — React + Vite SPA, tabs: Home (Leaderboard), Teams, Matches, IPL, Admin
- **Backend**: `artifacts/api-server` — Express API with two main route modules:
  - `routes/ipl.ts` — Fetches live match schedule from IPL official S3 feed (Competition ID 284)
  - `routes/ipl-points.ts` — Syncs fantasy points from AuctionRoom (Supabase); fetches innings via CricAPI for display; caches to `ipl-points-cache.json`

### Data Sources
- **IPL Schedule**: `https://ipl-stats-sports-mechanic.s3.ap-south-1.amazonaws.com/ipl/feeds/284-matchschedule.js`
  - JSONP callback `MatchSchedule`; data in `Matchsummary[]`; MatchID used everywhere
- **Match Summary** (S3): `https://ipl-stats-sports-mechanic.s3.ap-south-1.amazonaws.com/ipl/feeds/{matchId}-matchsummary.js`
  - JSONP callback `onScoringMatchsummary`; has result, toss, venue, score, umpires, referee
- **Standings** (S3): `https://ipl-stats-sports-mechanic.s3.ap-south-1.amazonaws.com/ipl/feeds/stats/284-groupstandings.js`
  - JSONP callback `ongroupstandings`; fields: TeamCode, Wins, Loss, Points, NetRunRate, Performance (form string)
- **AuctionRoom Supabase** (`https://ldwqrdlipzqsnpljqyhk.supabase.co/rest/v1`) — **PRIMARY scoring source**
  - IPL 2026 tournament ID: `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb`
  - Tables: `player_fixture_scores` (fixture_id, player_id, score), `tournament_fixtures` (match metadata), `tournament_players` (player_id), `players` (id, name)
  - Scores are official auctionroom.in values (includes all fielding bonuses, LBW, stumpings etc.)
  - `syncAuctionRoomScores()` fetches completed fixtures, maps player IDs to names via 250-player cache
- **CricAPI** (`https://api.cricapi.com/v1/`) using secret `CRICAPI_KEY` — **innings display only**
  - Endpoints: `/series`, `/series_info`, `/match_scorecard`; 1900/day limit
  - Used ONLY for batting/bowling innings rows in scorecard display (not for points calculation)

### Points Engine (`ipl-points.ts`)
- **Primary**: `syncAuctionRoomScores()` — fetches from Supabase `player_fixture_scores`, maps player UUIDs to names, matches to FANTASY_PLAYER_NAMES using `namesMatch()`, caches in `supabaseScores[fixtureId]`
- **Secondary**: CricAPI processes innings only (no points from CricAPI anymore) — `processedMatches[iplId] = { points: {}, innings: InningData[] }`
- `InningData` contains `{ name, total, batting: BattingRow[], bowling: BowlingRow[] }` — stored in processedMatches
- Background job: Supabase sync first → CricAPI innings for display → cooldown 16 min
- **`GET /api/ipl/scorecard/:matchId`** — returns cached innings + live S3 match overview (result, toss, venue)

### Fantasy Teams
- Each team has 18 players with Captain (×2) and Vice-Captain (×1.5) designations
- Top 11 by adjusted points auto-selected per team
- Session secret stored as `SESSION_SECRET`

### API Endpoints
- `GET /api/ipl/matches` — Live match schedule (IPL S3, 2-min cache)
- `GET /api/ipl/standings` — IPL points table (IPL S3, 2-min cache)
- `GET /api/ipl/points` — Fantasy points aggregated from CricAPI cache; triggers background update
- `GET /api/ipl/scorecard/:matchId` — Innings batting/bowling from cache + live S3 match overview
- `GET /api/ipl/stats` — Aggregated season batting/bowling stats (Orange Cap, Purple Cap, Sixes, Fours, SR, Economy); each player tagged `isFantasy` if in any of the 4 fantasy teams
### Authentication (PIN Login)
- Client-side only; no backend involvement
- `LoginScreen` component shown when no session is active (`localStorage: ipl-current-user`)
- PINs stored in `localStorage: ipl-pins-2026` (object keyed by team ID)
- Default PINs: `rajveer=1111, mombasa=2222, mumbai=3333, ponygoat=4444`; changeable via Admin tab
- `DEFAULT_PINS`, `loadPins()`, `savePins()` exported from top of App.tsx
- 4-digit numpad UI; auto-submits on 4 digits; shake animation on wrong PIN
- `currentUser` state gates entire app; logout clears localStorage and resets to login screen
- Predictions: only the logged-in user's row shows pick buttons; others are read-only

### Frontend Tabs
- Home: Leaderboard + recent results
- Teams: Per-fantasy-team player list with points
- Matches: IPL fixtures with expandable scorecards
- Stats: Orange Cap / Purple Cap / Sixes / Fours / SR / Economy leaderboards; toggle All vs Fantasy Only
- IPL: Points table + team color grid
- Admin: Manual refresh, debug info, PIN management, points breakdown

### Key Files
- `artifacts/fantasy-cricket/src/App.tsx` — Main frontend logic: state, effects, render functions, handlers (~4297 lines)
- `artifacts/fantasy-cricket/src/constants.ts` — All static IPL data: IPL_COLORS, IPL_FULL_NAMES, ROLE_ICONS, ROLE_COLORS, IPL_TEAM_BADGE, SWIPEABLE_TABS, IPL_HISTORY (2008–2025)
- `artifacts/fantasy-cricket/src/LineupPreviewCard.tsx` — Collapsible next-match lineup preview component
- `artifacts/fantasy-cricket/src/teams.ts` — Fantasy team definitions (players, captains, colors)
- `artifacts/fantasy-cricket/src/utils.ts` — Helper functions: applyMultiplier, getTeamData
- `artifacts/api-server/src/routes/ipl.ts` — IPL schedule + match data + standings + predictions + PIN routes
- `artifacts/api-server/src/routes/ipl-points.ts` — Auto-points pipeline + Supabase sync + stats endpoint
- `artifacts/api-server/ipl-data/ipl-points-cache.json` — Persistent points cache (real data directory)
- `artifacts/api-server/ipl-data/ipl-predictions.json` — Match prediction picks
- `artifacts/api-server/ipl-data/ipl-pins.json` — User PINs (fallback; primary in Replit KV)

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
