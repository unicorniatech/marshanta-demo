# Marshanta Monorepo

Greenfield project using BMAD method. See sprint plans and stories for scope and acceptance criteria.

## Structure

- `apps/web/` — PWA frontend (placeholder)
- `apps/api/` — Serverless/API (placeholder)
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

## Sprint 1 Quickstart

Run API and Web in separate terminals:

```bash
# API
npm run -w @marshanta/api dev

# Web (static dev server)
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

## CI

GitHub Actions workflow `ci.yml` runs on PRs and main:
- Installs deps via npm workspaces.
- Runs API smoke test `apps/api/scripts/smoke.js` (health, restaurants/menu, create order).
- Runs web workspace no-op build/test scripts.

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
- Current runtime uses an in-memory driver by default (`DB_DRIVER=memory`).
- Switch drivers later by updating the adapter config when a DB is provisioned.

## BMAD

- PO Master Checklist: `.bmad-core/checklists/po-master-checklist.md`
- Story DoD: `.bmad-core/checklists/story-dod-checklist.md`

## Notes

- Keep technology choices consistent with `docs/architecture/`.
- No secrets committed; use `.env`.
