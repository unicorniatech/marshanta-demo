# Project Status and Plan

This document is the single source of truth for what works today, what is mocked, and what we will build next.

## Current State (Working)
- Web PWA (`apps/web/`):
  - Auth (register, login, logout)
  - Client flows: restaurants, menu, cart, orders
  - Tracking: real delivery locations on map (SSE)
  - Admin: metrics, users, restaurants, orders; assign to delivery partners
  - Delivery: assignments, accept/picked up/delivered; SSE notifications; location sharing
- API (`apps/api/`):
  - Express API running at `http://localhost:4000`
  - Postgres adapter with SQL migrations applied
  - Delivery SSE + latest-location tracking
  - Payments are mocked
- Env loading: API loads root `/.env` automatically with override

## Partial / Mock
- Payments: routes exist but use mock intent/confirm
- Tests/CI: no integration/E2E tests or CI Postgres service yet

## Next Actions (Option A: Capacitor)
- Build the web app with Vite (`apps/web/` -> `dist/`)
- Scaffold Capacitor project at `apps/mobile/` pointing `webDir` to `../web/dist`
- Add iOS/Android platforms, configure icons/splash and permissions (location)
- Ship internal builds via TestFlight / Play Console

## Later (Option B: React Native/Expo)
- Scaffold `apps/mobile-native/` (Expo)
- Recreate core flows with RN components; reuse API
- Add RN maps, notifications, and background location

## Test/CI Plan (Upcoming)
- API integration tests (supertest) for auth/restaurants/orders/delivery
- Minimal Playwright E2E flows
- GitHub Actions: Postgres service, migrations, run tests and E2E smoke

## Reference
- PRD: `docs/prd/requirements.md`
- Epics: `docs/epics/`
- Sprints: `docs/sprints/`
- Runbook: `docs/runbook/database.md`
