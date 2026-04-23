# Threat Model

## Project Overview

This project is an IPL Fantasy Cricket 2026 tracker built as a pnpm monorepo. The production application consists of a React/Vite SPA in `artifacts/fantasy-cricket` and an Express 5 API in `artifacts/api-server`. The API aggregates live IPL data from public S3 feeds, synchronizes fantasy points from Supabase, stores league state such as predictions and PINs in Replit KV plus local JSON files, and sends web push notifications.

The application is intended for a small private league with four team owners. In production, traffic is protected by platform-managed TLS. `NODE_ENV` can be assumed to be `production`. The `artifacts/mockup-sandbox` app is a development-only sandbox and should be ignored unless production reachability is demonstrated.

## Assets

- **League member identities and access secrets** — the four team-owner identities and their PINs control access to private league views and commissioner actions.
- **Private league state** — per-owner match predictions, team standings, historical points, and internal commissioner controls. This data is not internet-public by intent even if the underlying IPL source data is public.
- **Administrative controls** — commissioner-only operations such as updating any member PIN, forcing cache refreshes, testing/toggling notifications, and resetting or prewarming server caches.
- **Push infrastructure secrets and subscriptions** — VAPID private keys and stored browser push subscriptions can be abused to impersonate app notifications or turn the server into an outbound request proxy.
- **Application secrets and third-party credentials** — Replit KV URL, Supabase key, and any deployment secrets available through environment variables.
- **Service availability and outbound quota** — the API performs repeated S3, Supabase, KV, and web-push network requests; abuse of expensive endpoints can consume quota or degrade service.

## Trust Boundaries

- **Browser to API** — the SPA is untrusted. Every state-changing or private-data API must authenticate the caller server-side instead of trusting frontend state, headers, or request body fields.
- **Unauthenticated internet to private-league data** — the application UX suggests a private league behind a PIN gate, so the API must enforce that distinction rather than relying on the login screen alone.
- **Regular member to commissioner** — commissioner actions must be enforced with server-side authorization; client-side checks and caller-supplied headers are not sufficient.
- **API to Replit KV / local state files** — PINs, predictions, subscriptions, and VAPID keys cross from process memory to persistent storage. Sensitive values must not be exposed or seeded from guessable defaults.
- **API to external services** — the server fetches from IPL S3, Supabase, and web-push endpoints. Timeouts, bounded refresh behavior, destination validation, and integrity of secrets matter here.

## Scan Anchors

- **Production entry points**: `artifacts/api-server/src/index.ts`, `artifacts/api-server/src/app.ts`, `artifacts/fantasy-cricket/src/main.tsx`, `artifacts/fantasy-cricket/src/App.tsx`
- **Highest-risk server files**: `artifacts/api-server/src/routes/ipl.ts`, `artifacts/api-server/src/routes/ipl-points.ts`, `artifacts/api-server/src/routes/push.ts`
- **Highest-risk client files**: `artifacts/fantasy-cricket/src/App.tsx`, `artifacts/fantasy-cricket/src/pages/Admin.tsx`, `artifacts/fantasy-cricket/src/pages/Fixtures.tsx`, `artifacts/fantasy-cricket/src/hooks/usePredictions.ts`
- **Public vs authenticated vs admin surfaces**: public data endpoints under `/api/ipl/*`; intended member-only league UX gated in the SPA by `ipl-current-user`; intended commissioner-only actions depend on `rajveer` ownership checks
- **Usually dev-only**: `artifacts/mockup-sandbox/**`, generated `dist/**`, attached assets, and other workspace scaffolding unless they become production reachable

## Threat Categories

### Spoofing

The project uses a custom PIN-based identity model rather than a standard session mechanism. The API must not trust caller-controlled fields such as `X-Owner-Id`, `ownerId`, or client-side `localStorage` state as proof of identity. Commissioner actions must require a server-verified identity bound to the current request.

### Tampering

Users can submit predictions and invoke administrative refresh operations. The server must ensure callers can only modify their own prediction rows, cannot bypass match locks by claiming commissioner status, and cannot alter league state or operational settings through forged headers or body parameters.

### Information Disclosure

Although IPL match data is public, league predictions, PINs, subscription data, and internal operational state are private. The API must not expose private league state or secrets to unauthenticated callers, and sensitive values such as PINs or VAPID private keys must not be hardcoded or committed in source-controlled runtime files.

### Denial of Service

The server performs expensive refreshes against external S3 and Supabase sources, keeps long-lived SSE connections, and can be induced to make outbound web-push requests. Administrative or expensive refresh endpoints must be authenticated and rate-limited so internet callers cannot force repeated upstream fetches, consume outbound quota, or degrade service availability. Public endpoints that accept identifiers or subscription objects must also validate inputs and cache misses so attackers cannot create fetch amplification or long-lived outbound work on demand.

### Elevation of Privilege

The main privilege boundary is member versus commissioner. All commissioner-only routes must enforce authorization server-side, and all private-league write operations must derive the acting user from trusted server-side authentication rather than request parameters supplied by the caller.