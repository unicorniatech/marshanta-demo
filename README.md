# Marshanta Monorepo

[![CI](https://github.com/unicorniatech/marshanta-demo/actions/workflows/ci.yml/badge.svg)](https://github.com/unicorniatech/marshanta-demo/actions/workflows/ci.yml)

Greenfield project using BMAD method. See sprint plans and stories for scope and acceptance criteria.

## Structure

- `apps/web/` — PWA frontend (Vite dev/build)
- `apps/api/` — Express API (Postgres adapter)
- `packages/shared/` — Shared types/utilities
- `docs/` — PRD, architecture, specs, stories, sprints

## Workspaces

Configured in root `package.json`:

```json
{
  "workspaces": ["apps/*", "packages/*"]
}
```

## Setup (Local)

1. Ensure Node.js LTS installed.
2. Copy environment template and adjust values:
   - `cp .env.example .env`
3. Install dependencies (will link workspaces):
   - `npm install`
4. Verify structure per `docs/stories/1.1.project-scaffolding.md` Testing steps.

## Dev Quickstart (Web + API)

Run API and Web in separate terminals:

```bash
# API (loads root .env automatically)
npm run -w @marshanta/api dev

# Web (Vite dev server)
npm run -w @marshanta/web dev
```

Configure the PWA client:
- Open the web app (default http://localhost:5173).
- API base is set automatically to `http://localhost:4000` on localhost.

Core flows (Sprint 1):
- Browse restaurants and menus.
- Add items to cart and place an order.
- Mock payment: intent + confirm (status updates to Succeeded).
- Real-time tracking via SSE with a live map (Leaflet + OSM).
- Restaurant Console: filter by restaurant and advance order status (staff/admin only).

## Endpoints (API)

- `GET /healthz` — health check
- `POST /auth/register` — `{ email, password, role?('client'|'staff'|'admin') }`
- `POST /auth/login` — `{ email, password }` → `{ token }`
- `POST /auth/logout` — header `Authorization: Bearer <token>`
- `GET /me` — requires auth; returns `{ id, email, role }`
- `GET /restaurants` — list seeded restaurants
- `GET /restaurants/:id/menu` — list menu items
- `POST /orders` — `{ restaurantId, items: [{ itemId, name, priceCents, qty }] }`
- `GET /orders` — optional `?restaurantId=` filter
- `GET /orders/:id`
- `POST /orders/:id/status` — requires `staff|admin`
- `POST /tracking/:orderId/stream` — SSE stream (no auth; mock)
- `POST /payments/intent` — mock intent for an order
- `POST /payments/confirm` — mock confirmation; updates `paymentStatus`
- `POST /payments/webhook` — mock webhook with `x-mock-signature`

## Build (Web)

```bash
# Build web app to apps/web/dist
npm run -w @marshanta/web build

# Preview locally on port 5173
npm run -w @marshanta/web preview
```

## Mobile (Option A: Capacitor wrapper)

We ship iOS/Android by wrapping the built web app with Capacitor.

Steps (overview):
1. Build web: `npm run -w @marshanta/web build` (outputs to `apps/web/dist`).
2. Scaffold `apps/mobile/` Capacitor project (to be added): set `webDir` to `../web/dist`.
3. Add platforms: `npx cap add ios`, `npx cap add android`.
4. Copy web to native: `npx cap copy`.
5. Open native IDEs: `npx cap open ios`, `npx cap open android`.
6. Configure icons/splash and permissions (location for delivery partner sharing).
7. Build and distribute via TestFlight / Play Console Internal.

Note: A detailed mobile setup guide will live in `apps/mobile/README.md` once scaffolded.

### Device testing: API Base switcher

When running the iOS/Android app on a physical device, `localhost` refers to the device itself, not your development machine. To connect the device app to your API running on the Mac/PC, set the API base to your machine's LAN IP.

In the PWA UI (`apps/web/index.html`):

- `API Base` shows the current base.
- Use the input and `Set API Base` to save (e.g., `http://192.168.1.70:4000`). This persists in `localStorage`.
- `Clear` removes the override and reloads.

The web app resolves `apiBase` as follows (see `apps/web/main.js`):

- If `localStorage.apiBase` is set, use it.
- Else if running on `localhost`/`127.0.0.1`, use `http://localhost:4000`.
- Else (e.g., device build), require a configured base.

## CI

GitHub Actions workflow `ci.yml` runs on PRs and main. Key details:
- Runs the job in a `node:20` container for consistent tooling/networking.
- Uses a Postgres service; connect via host `postgres` (not `localhost`). Example `DATABASE_URL`:
  `postgresql://marshanta:marshanta@postgres:5432/marshanta`.
- Uses npm workspaces and enables npm cache to speed up installs.
- Applies API SQL migrations, runs API integration tests and API smoke.
- Runs Web smoke `apps/web/scripts/smoke.js` which serves static files locally and verifies `/`.
 - Runs Playwright E2E flows under `apps/web/tests/e2e` via `npm -w apps/web run e2e:flows`.

DB roles: The `users.role` check constraint allows `client`, `staff`, and `admin`. A migration updates
the schema to include `staff`.

## Demo Walkthrough

See `docs/demo/sprint-1-demo.md` for a step-by-step demo script covering all Sprint 1 features.

## Sprint Plans

- Sprint 1 Plan: `docs/sprints/sprint-1-plan.md`

## Release Notes

- v0.1.0 (Sprint 1): `docs/releases/v0.1.0-sprint1.md`

## Database migrations (Story 1.3)

The API includes a neutral adapter and an initial SQL migration `apps/api/migrations/0001_init.sql`.
To apply migrations to a local PostgreSQL instance:

1. Set `DATABASE_URL` in `.env` (see `.env.example`).
2. Install dependencies:
   - `npm install`
3. Run migrations:
   - `npm run -w @marshanta/api db:migrate`

Notes:
- Runtime driver is selected by env (`DB_DRIVER=pg` recommended). The API loads `/.env` automatically on startup.
- For Supabase: set pooled `DATABASE_URL` and primary `DIRECT_URL`. Passwords must be URL-encoded; include `sslmode=require`.

See the detailed runbook: `docs/runbook/database.md`.

### Postgres/Supabase runbook (local + CI)

- Pooled vs Direct URLs:
  - `DATABASE_URL` is the pooled connection string used at runtime by `apps/api/src/db/pg.js`.
  - `DIRECT_URL` is the direct (primary) connection string used by migrations `apps/api/scripts/migrate.js`.
- SSL and URL-encoding:
  - Append `?sslmode=require` to both URLs when using Supabase.
  - If your password contains special characters (e.g., `@`), URL-encode it.
- Local dev:
  - Set `DB_DRIVER=pg`, `DATABASE_URL`, and `DIRECT_URL` in `.env`.
  - Run `npm -w @marshanta/api run db:migrate`.
  - Start API on port 4000: `npm run -w @marshanta/api dev`.
  - Web uses `http://localhost:4000` automatically for `apiBase` in `apps/web/main.js` when on localhost.
- CI:
  - GitHub Actions spins up a `postgres` service and runs migrations with both `DATABASE_URL` and `DIRECT_URL` set.
  - Integration tests run with `DB_DRIVER=pg`.

### Delivery partners (dev behavior)

For development and demos, delivery users are mirrored as delivery partners so Admin can immediately assign orders:

- In-memory driver (`apps/api/src/db/memory.js`):
  - When a user registers with role `delivery`, a delivery partner is auto-created with the same `id`.
  - Listing partners also backfills any missing entries from delivery users.
- Postgres driver (`apps/api/src/db/pg.js`):
  - `createUser()` upserts into `delivery_partners` when `role = 'delivery'`.
  - `listDeliveryPartners()` returns users with `role = 'delivery'`, joining optional details from `delivery_partners`.

This keeps `partnerId` equal to the delivery user `id`, aligning Admin assignment with the authenticated delivery account.

## BMAD

- PO Master Checklist: `.bmad-core/checklists/po-master-checklist.md`
- Story DoD: `.bmad-core/checklists/story-dod-checklist.md`

## Notes

- Keep technology choices consistent with `docs/architecture/`.
- No secrets committed; use `.env`.

## Status & Plan (Single Source of Truth)

See `docs/STATUS.md` for:
- Current state (what works vs mock)
- Next actions (Option A mobile, tests/CI)
- Longer-term plan (Option B React Native)
