-- 0006_delivery.sql
-- Delivery assignments and locations

BEGIN;

CREATE TABLE IF NOT EXISTS delivery_assignments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  partner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('Assigned','Accepted','PickedUp','Delivered')) DEFAULT 'Assigned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS delivery_assignments_partner_idx ON delivery_assignments (partner_id);
CREATE INDEX IF NOT EXISTS delivery_assignments_order_idx ON delivery_assignments (order_id);

CREATE TABLE IF NOT EXISTS delivery_locations (
  id BIGSERIAL PRIMARY KEY,
  partner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  ts TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS delivery_locations_partner_time ON delivery_locations (partner_id, ts DESC);
CREATE INDEX IF NOT EXISTS delivery_locations_order_time ON delivery_locations (order_id, ts DESC);

COMMIT;
