-- 0005_payments.sql
-- Add payment receipts and processed payment events for idempotent webhooks

BEGIN;

CREATE TABLE IF NOT EXISTS payment_receipts (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  raw JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payment_receipts_order_idx ON payment_receipts(order_id);

CREATE TABLE IF NOT EXISTS payment_events (
  id SERIAL PRIMARY KEY,
  event_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;
