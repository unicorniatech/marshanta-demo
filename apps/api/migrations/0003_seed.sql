-- 0003_seed.sql
-- Seed initial restaurants and menu items

BEGIN;

INSERT INTO restaurants (name, address, phone)
VALUES
  ('Taquería El Sol', 'Calle 5 #123, Cuernavaca', '+52 777 123 4567'),
  ('Pizzería La Nonna', 'Av. Morelos 456, Jiutepec', '+52 777 987 6543')
ON CONFLICT DO NOTHING;

-- Upsert-like: insert menu items if not present
-- Taquería El Sol is id 1 if clean DB; for safety, fetch by name
WITH r AS (
  SELECT id FROM restaurants WHERE name='Taquería El Sol' LIMIT 1
)
INSERT INTO menu_items (restaurant_id, name, price_cents)
SELECT r.id, x.name, x.price_cents
FROM r, (VALUES
  ('Taco al Pastor', 2000),
  ('Quesadilla de Queso', 1500),
  ('Agua de Horchata', 1200)
) AS x(name, price_cents)
WHERE NOT EXISTS (
  SELECT 1 FROM menu_items m WHERE m.restaurant_id = r.id AND m.name = x.name
);

WITH r AS (
  SELECT id FROM restaurants WHERE name='Pizzería La Nonna' LIMIT 1
)
INSERT INTO menu_items (restaurant_id, name, price_cents)
SELECT r.id, x.name, x.price_cents
FROM r, (VALUES
  ('Pizza Margarita (Individual)', 9500),
  ('Refresco', 1800)
) AS x(name, price_cents)
WHERE NOT EXISTS (
  SELECT 1 FROM menu_items m WHERE m.restaurant_id = r.id AND m.name = x.name
);

COMMIT;
