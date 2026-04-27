# Jay Shah Scripts · IPL Fantasy Cricket 2026

A private fantasy cricket league tracker for IPL 2026. Four team owners compete by predicting match winners, accumulating fantasy points, and tracking standings across the season.

---

## Architecture

This is a **pnpm monorepo** with three packages under `artifacts/`:

| Package | Path | Description |
|---|---|---|
| `@workspace/fantasy-cricket` | `artifacts/fantasy-cricket` | React + Vite SPA — the main user interface |
| `@workspace/api-server` | `artifacts/api-server` | Express 5 API — live IPL data, predictions, push notifications |
| `mockup-sandbox` | `artifacts/mockup-sandbox` | Dev-only UI sandbox — not deployed |

Shared libraries live in `lib/`.

### Data flow

```
IPL public S3 feeds
        ↓
  api-server (Express 5)
  ├── aggregates live match data
  ├── syncs fantasy points from Supabase
  ├── stores predictions + PINs in PostgreSQL
  ├── persists sessions in Replit KV
  └── sends web push notifications (VAPID)
        ↓
  fantasy-cricket (React SPA)
  └── served as static files from api-server
```

---

## Local Development

### Prerequisites

- Node.js 22+
- pnpm 10+

```bash
npm install -g pnpm@10
```

### Setup

```bash
# Install all workspace dependencies
pnpm install

# Copy the env template and fill in your values
cp .env.example .env
```

### Running

```bash
# Start the API server (from repo root)
cd artifacts/api-server
pnpm run dev

# Start the frontend dev server (separate terminal)
cd artifacts/fantasy-cricket
pnpm run dev
```

---

## Environment Variables

All secrets must be set in **Replit Secrets** (or a local `.env` file). Never commit real values to source.

| Variable | Required | Description |
|---|---|---|
| `PORT` | ✅ | Port the API server listens on |
| `DATABASE_URL` | ✅ | PostgreSQL connection string (Supabase) |
| `REPLIT_DB_URL` | ✅ | Replit KV URL — persists sessions across restarts |
| `VAPID_PUBLIC_KEY` | ✅ | VAPID public key for web push |
| `VAPID_PRIVATE_KEY` | ✅ | VAPID private key for web push |

The server will **crash at startup** with a clear error message if any of these are missing or set to placeholder values.

---

## Tech Stack

**Frontend** — `artifacts/fantasy-cricket`
- React 18, Vite, TypeScript
- Tailwind CSS, shadcn/ui, Radix UI
- TanStack Query, Framer Motion, Recharts
- Wouter (routing), Zod (validation)

**Backend** — `artifacts/api-server`
- Express 5, TypeScript, pino (logging)
- Drizzle ORM + PostgreSQL (Supabase)
- bcryptjs (PIN hashing), web-push (VAPID notifications)
- Replit KV (session persistence)

---

## Key API Routes

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/ipl/pins/validate` | Public (rate-limited) | Validate owner PIN and receive session token |
| `GET` | `/api/ipl/predictions` | Session | Get all match predictions |
| `POST` | `/api/ipl/predictions/:matchId` | Session | Submit or update a prediction |
| `GET` | `/api/ipl/matches` | Public | Live and upcoming match data |
| `GET` | `/api/ipl/points` | Public | Fantasy points leaderboard |
| `POST` | `/api/push/subscribe` | Session | Register for web push notifications |
| `GET` | `/api/health` | Public | Server health check |

---

## Security Notes

- PINs are **bcrypt-hashed** before storage — plaintext PINs never persist
- Sessions use **cryptographically random 32-byte tokens** stored in Replit KV
- Commissioner-only routes enforce authorization **server-side**
- `ipl-pins.json` is in `.gitignore` — never commit it with real values
- See [`threat_model.md`](./threat_model.md) for the full security model

---

## League Members

| Owner ID | Display Name |
|---|---|
| `rajveer` | Raj (Commissioner) |
| `mombasa` | Rahul |
| `mumbai` | Smeet |
| `ponygoat` | Deb |
