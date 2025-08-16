# Sprint 2 Plan — Foundations: DB + Real Payments + Tests

Owner: Team Marshanta
Duration: 1 sprint (1–2 weeks)
Tag on completion: v0.2.0-sprint2

## Goals (What we will ship)
- Production-ready persistence: move from in-memory to Postgres adapter.
- Real payments (Stripe Test Mode): intents + confirmations + webhook.
- Broader automated tests: API integration + minimal web E2E smoke.
- Light UI polish for core flows (accessibility + responsiveness basics).

## Scope
1) Database (Postgres)
- Add Postgres driver implementing the existing adapter interface in `apps/api/src/db/adapter.js`.
- Migrate current in-memory collections (users, restaurants, menus, orders, payments) to SQL tables.
- Provide seed script to load initial restaurants and menus.
- ENV-driven selection: `DB_DRIVER=pg` with `DATABASE_URL`.

2) Stripe (Test Mode)
- ENV: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- Endpoints:
  - `POST /payments/intent` -> Stripe PaymentIntent (amount from order total, currency=usd)
  - `POST /payments/confirm` -> confirm PaymentIntent client_secret
  - `POST /payments/webhook` -> verify signature; update order `paymentStatus`
- Store payment records (orderId, amount, intentId, status, events JSON).

3) Testing
- API integration tests (Jest or Node + supertest) for auth, restaurants, orders, payments, webhook happy path.
- Web E2E smoke (Playwright or Puppeteer): open `/`, place an order, mock-pay (test key), assert status.
- CI updates: run DB container (Postgres) service, apply migrations, run tests.

4) UI Polish (lightweight)
- Improve form errors and role visibility.
- Basic responsive layout tweaks for mobile.

## Acceptance Criteria
- With `DB_DRIVER=pg` and a reachable `DATABASE_URL`:
  - Auth, restaurants, menus, orders persist to Postgres.
  - Creating an order calculates total and stores order items.
- Stripe test key present:
  - Intent creation returns client_secret; confirming sets `paymentStatus=Succeeded` (happy path).
  - Webhook call updates order status idempotently; signature is verified.
- CI pipeline spins up Postgres, runs migrations, passes API integration tests and web E2E smoke.
- Documentation updated (README envs + runbook for DB + Stripe test mode).

## Out of Scope
- Production-grade fraud checks, refunds, subscription billing.
- Complex UI redesign.

## Deliverables
- `apps/api/src/db/pg.js` (or `pg/` dir): Postgres adapter.
- SQL migrations under `apps/api/migrations/` for new tables.
- Payment service `apps/api/src/lib/payments/stripe.js`.
- Tests: `apps/api/tests/**`, `apps/web/tests/e2e/**`.
- Updated CI workflow with Postgres service and test jobs.
- Docs: `docs/runbook/database.md`, `docs/runbook/stripe-test-mode.md`.

## Risks & Mitigations
- Stripe webhook signature verification issues → add detailed logging + replay instructions.
- Flaky E2E tests → keep scope minimal; retry once in CI.
- DB migrations drift → versioned SQL, run in CI from scratch.

## Milestones & Estimates
- M1: Postgres adapter + migrations + seed (2–3d)
- M2: Stripe test mode + webhook + records (2d)
- M3: API integration tests + CI Postgres service (1–2d)
- M4: Web E2E smoke + UI polish (1–2d)

## Environment Variables
- DB: `DB_DRIVER=pg`, `DATABASE_URL=postgres://user:pass@host:5432/db`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

## CI Plan
- Add Postgres service to GitHub Actions (postgres:16, healthcheck).
- `npm ci` → run migrations → run API tests → run web E2E smoke.

## Next Actions
- Scaffold Postgres adapter file and wire `DB_DRIVER` flag.
- Author initial SQL migration for core tables and a seed script.
- Add CI service for Postgres and a test job skeleton.
