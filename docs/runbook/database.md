# Database Runbook

This runbook explains how to use Postgres locally and in CI.

## Environment Variables
- `DB_DRIVER`: `memory` (default) or `pg` to use Postgres
- `DATABASE_URL`: e.g. `postgres://marshanta:marshanta@localhost:5432/marshanta`

See `.env.example` and copy to `.env`.

## Local: Option A — Existing Postgres
1. Start/ensure Postgres is running.
2. Create DB and user if needed:
   - DB: `marshanta`
   - User: `marshanta` / `marshanta`
3. Set `.env`:
   - `DB_DRIVER=pg`
   - `DATABASE_URL=postgres://marshanta:marshanta@localhost:5432/marshanta`
4. Apply migrations:
```bash
npm run -w @marshanta/api db:migrate
```
5. Run the API and Web:
```bash
npm run -w @marshanta/api dev
npm run -w @marshanta/web dev
```

## Local: Option B — Docker Compose
Use the included `docker-compose.yml` at repo root.

1. Start the DB:
```bash
docker compose up -d db
```
2. Set `.env` as above and run migrations:
```bash
npm run -w @marshanta/api db:migrate
```
3. Start API/Web (same as above).

## CI
GitHub Actions launches a Postgres 16 service, waits for readiness, runs migrations, then runs API smoke with `DB_DRIVER=pg`.
See `.github/workflows/ci.yml`.

## Troubleshooting
- Connection refused: ensure DB is running and host/port/user/pass are correct.
- Migration errors: check `apps/api/migrations/*.sql` order and logs.
- Reset local DB quickly:
```bash
docker compose down -v && docker compose up -d db
npm run -w @marshanta/api db:migrate
```
