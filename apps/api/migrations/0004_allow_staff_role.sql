-- 0004_allow_staff_role.sql
-- Align users.role constraint with application roles (include 'staff')

BEGIN;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('client', 'restaurant', 'delivery', 'admin', 'staff'));

COMMIT;
