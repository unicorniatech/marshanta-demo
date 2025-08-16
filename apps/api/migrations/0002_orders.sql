-- 0002_orders.sql
-- Add menu_items, orders, and order_items tables

BEGIN;

CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0)
);

CREATE INDEX IF NOT EXISTS menu_items_restaurant_idx ON menu_items (restaurant_id);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('Submitted','Accepted','Preparing','ReadyForPickup')) DEFAULT 'Submitted',
  payment_status TEXT NOT NULL DEFAULT 'Unpaid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_restaurant_idx ON orders (restaurant_id);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id INTEGER,
  name TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  qty INTEGER NOT NULL CHECK (qty > 0)
);

CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id);

COMMIT;
