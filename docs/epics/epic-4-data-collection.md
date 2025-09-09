# Epic 4: Data Collection for AI (Story 4.3)

Goal: Ensure platform events are captured in a structured, privacy-conscious way for future AI-driven insights without degrading runtime performance.

## Scope
- Client, restaurant, delivery, and payment events.
- Minimal, append-only event store with retention policy.
- Clear consent UX and PII handling.
- Query-friendly schema for analytics and model training.

## Event taxonomy (draft)
- auth:
  - user.registered, user.logged_in, user.logged_out
- client:
  - menu.viewed, order.created, order.paid, order.canceled
- restaurant:
  - rc.opened, rc.orders_loaded, order.status_changed
- delivery:
  - assignment.created, assignment.accepted, location.updated, order.delivered
- payment:
  - intent.created, confirmation.succeeded, webhook.received, webhook.duplicate
- system:
  - error, rate_limited, api.request

Each event has minimally: `event_id`, `occurred_at`, `actor_type`, `actor_id?`, `session_id?`, `order_id?`, `restaurant_id?`, `payload (jsonb)`, `ip?`, `ua?`.

## Database tables (Postgres)

```sql
-- events table (append-only)
CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actor_type TEXT,
  actor_id BIGINT,
  order_id BIGINT,
  restaurant_id BIGINT,
  session_id TEXT,
  ip INET,
  ua TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- helpful indexes
CREATE INDEX IF NOT EXISTS events_type_time ON events (event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS events_order ON events (order_id);
CREATE INDEX IF NOT EXISTS events_restaurant ON events (restaurant_id);
CREATE INDEX IF NOT EXISTS events_actor ON events (actor_type, actor_id);
```

Retention policy (configurable):
- Raw events: 90 days (purge job).
- Aggregations/derived tables: longer (e.g., 1–2 years) with PII removed.

## Privacy & consent
- Add a client-side opt-in consent toggle in the web app.
- Store consent state with user profile and session.
- Never store full PII in `events.payload`. Hash or tokenize user identifiers; keep payload minimal.
- Document data handling in `docs/privacy/data-policy.md` (to be created).

## Instrumentation plan
- Web (`apps/web/main.js`):
  - Emit (best-effort fetch) on key interactions: menu viewed, order created, RC opened, RC load orders, status changes attempted.
  - Attach `session_id`, `actor_type`, and relevant IDs. Respect consent toggle.
- API (`apps/api/src/*`):
  - Emit server-side authoritative events for order created, payment updates (intent/confirm/webhook), status changes.
  - Reuse existing payment webhook idempotency logic to avoid double-logging.

Simple event ingestion endpoint (MVP):
- `POST /events` (requires auth or scoped token; validates against allowlist of event types).
- Server enriches with `ip`, `ua`, `occurred_at`.

## Minimal implementation steps
1) DB: Add `events` table migration.
2) API: Add `/events` route + small utility `logEvent({ type, actorType, actorId, orderId, restaurantId, sessionId, payload })`.
3) Web: Add consent toggle and emit minimal client events (behind consent).
4) Payments & orders: Add server-side authoritative emits in existing routes.
5) Docs: Add `docs/privacy/data-policy.md` summarizing collection and retention.
6) Ops: Add a daily purge script (or SQL job) to enforce retention.

## Non-goals (v1)
- Real-time analytics dashboards.
- Complex PII anonymization pipelines.
- Cross-device identity stitching beyond session/user IDs.

## Success criteria
- Events are captured without user-noticeable latency.
- Opt-in consent respected; no PII stored in `events.payload`.
- Analysts can answer basic questions via SQL (orders per hour, payment funnel, RC usage).
