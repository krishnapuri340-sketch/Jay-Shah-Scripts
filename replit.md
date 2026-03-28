# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## IPL Fantasy Cricket 2026 Tracker

Primary application: IPL Fantasy Cricket Tracker for 4 teams (Rajveer Puri, Mombasa K, Mumbai Ma, PonyGoat).

### Architecture
- **Frontend**: `artifacts/fantasy-cricket` — React + Vite SPA, tabs: Home (Leaderboard), Teams, Matches, IPL, Admin
- **Backend**: `artifacts/api-server` — Express API with two main route modules:
  - `routes/ipl.ts` — Fetches live match schedule from IPL official S3 feed (Competition ID 284)
  - `routes/ipl-points.ts` — Auto-calculates fantasy points from CricAPI scorecards; caches to `ipl-points-cache.json`

### Data Sources
- **IPL Schedule**: `https://ipl-stats-sports-mechanic.s3.ap-south-1.amazonaws.com/ipl/feeds/284-matchschedule.js`
  - JSONP callback `MatchSchedule`; data in `Matchsummary[]`; MatchID used everywhere
- **Match Summary** (S3): `https://ipl-stats-sports-mechanic.s3.ap-south-1.amazonaws.com/ipl/feeds/{matchId}-matchsummary.js`
  - JSONP callback `onScoringMatchsummary`; has result, toss, venue, score, umpires, referee
- **Standings** (S3): `https://ipl-stats-sports-mechanic.s3.ap-south-1.amazonaws.com/ipl/feeds/stats/284-groupstandings.js`
  - JSONP callback `ongroupstandings`; fields: TeamCode, Wins, Loss, Points, NetRunRate, Performance (form string)
- **CricAPI** (`https://api.cricapi.com/v1/`) using secret `CRICAPI_KEY`
  - Endpoints: `/series`, `/series_info`, `/match_scorecard`; free tier: 100 req/day; 10-minute cooldown
  - Cached permanently in `ipl-points-cache.json`; cache format: `processedMatches[iplId] = { points, innings: InningData[] }`

### Points Engine (`ipl-points.ts`)
- Finds IPL 2026 series in CricAPI by name search; matches matches by date + team name fuzzy matching
- `processScorecard()` returns: `{ players: Record<string, PlayerStats>, innings: InningData[] }`
- `InningData` contains `{ name, total, batting: BattingRow[], bowling: BowlingRow[] }` — stored in cache
- Calculates points using T20 Fantasy Scoring v1.7 (see `calcPoints`)
- Processes up to 3 unprocessed matches per background job with cooldown to prevent rate-limit loops
- **`GET /api/ipl/scorecard/:matchId`** — returns cached innings + live S3 match overview (result, toss, venue)

### Fantasy Teams
- Each team has 18 players with Captain (×2) and Vice-Captain (×1.5) designations
- Top 11 by adjusted points auto-selected per team
- Session secret stored as `SESSION_SECRET`

### Key Files
- `artifacts/fantasy-cricket/src/App.tsx` — All frontend logic (tabs, state, team definitions)
- `artifacts/api-server/src/routes/ipl.ts` — IPL schedule + match data
- `artifacts/api-server/src/routes/ipl-points.ts` — Auto-points pipeline (calcPoints to be replaced)
- `artifacts/api-server/ipl-points-cache.json` — Persistent scorecard cache (gitignored in prod)

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
