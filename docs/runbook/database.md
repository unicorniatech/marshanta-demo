# Database Runbook

This runbook explains how to use Postgres locally, with Supabase, and in CI.

## Environment Variables
- `DB_DRIVER`: `memory` (default) or `pg` to use Postgres
- `DATABASE_URL`: runtime connection string (use pooled for Supabase)
- `DIRECT_URL`: migrations connection string (use primary for Supabase)

See `.env.example` and copy to `.env` (never commit `.env`).

### Supabase specifics
- Use two URLs:
  - `DATABASE_URL` (pooled): `postgresql://<user>:<password-URL-encoded>@aws-<region>.pooler.supabase.com:6543/<db>?sslmode=require&pgbouncer=true`
  - `DIRECT_URL` (primary): `postgresql://<user>:<password-URL-encoded>@<project>.supabase.co:5432/<db>?sslmode=require`
- URL-encode passwords (e.g., `@` → `%40`).
- Always append `?sslmode=require`.
- Migrations use `DIRECT_URL`; runtime uses `DATABASE_URL`.

## Local: Option A — Existing Postgres
1. Start/ensure Postgres is running.
2. Create DB and user if needed:
   - DB: `marshanta`
   - User: `marshanta` / `marshanta`
3. Set `.env`:
   - `DB_DRIVER=pg`
   - `DATABASE_URL=postgres://marshanta:marshanta@localhost:5432/marshanta`
   - `DIRECT_URL=postgres://marshanta:marshanta@localhost:5432/marshanta`
4. Apply migrations:
```bash
npm run -w @marshanta/api db:migrate
```
5. Run the API and Web:
```bash
npm run -w @marshanta/api dev
npm run -w @marshanta/web dev
```

## Local: Option B — Docker Desktop + Compose
Use the included `docker-compose.yml` at repo root.

1. Start the DB:
```bash
docker compose up -d db
```
2. Set `.env` as above (include `DIRECT_URL`) and run migrations:
```bash
npm run -w @marshanta/api db:migrate
```
3. Start API/Web (same as above).

## Local: Option C — Homebrew Postgres (macOS)
Install and run Postgres natively via Homebrew.

1. Install and start service:
```bash
brew install postgresql@16
brew services start postgresql@16
```
2. Create user and database:
```bash
createuser marshanta --createdb
createdb marshanta
psql -d marshanta -c "alter user marshanta with password 'marshanta';"
```
3. Set `.env` (include `DIRECT_URL`) and run migrations/tests as in Option A.

## Local: Option D — Supabase
1. In Supabase dashboard, create a project (note the pooled and primary hosts).
2. Set `.env`:
   - `DB_DRIVER=pg`
   - `DATABASE_URL=postgresql://postgres:<password-URL-encoded>@aws-<region>.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true`
   - `DIRECT_URL=postgresql://postgres:<password-URL-encoded>@<project>.supabase.co:5432/postgres?sslmode=require`
3. Apply migrations:
```bash
npm run -w @marshanta/api db:migrate
```
4. Run API/Web as usual.

Verification queries (Supabase SQL editor):
```sql
select id,name from restaurants;
select * from menu_items limit 5;
select id,status,payment_status from orders order by id desc limit 5;
select * from payment_receipts order by id desc limit 5;
select * from payment_events order by created_at desc limit 5;
```

## CI
GitHub Actions launches a Postgres 16 service, waits for readiness, runs migrations, runs API tests/smoke, and runs web smoke + Playwright E2E.
See `.github/workflows/ci.yml` for details (
service host is `postgres`).

Optionally, replace the service DB with Supabase by storing `DATABASE_URL`/`DIRECT_URL` in GitHub Secrets and removing the `services.postgres` section.

## Troubleshooting
- Connection refused: ensure DB is running and host/port/user/pass are correct.
- SASL error `client password must be a string`: malformed/missing password in URL, or not URL-encoded, or missing `sslmode=require` with Supabase.
- Migration errors: check `apps/api/migrations/*.sql` order and logs. Ensure `DIRECT_URL` points to the primary host.
- Reset local DB quickly:
```bash
docker compose down -v && docker compose up -d db
npm run -w @marshanta/api db:migrate
```
