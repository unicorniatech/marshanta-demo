# Sprint 1 Acceptance Checklist

Use this checklist to verify core Sprint 1 stories are working end-to-end.

## Environment
- [ ] Node 20+ installed
- [ ] `.env` created from `.env.example`
- [ ] API running: `npm run -w @marshanta/api dev` (http://localhost:4000)
- [ ] Web running: `npm run -w @marshanta/web dev` (http://localhost:5173)

## Story 2.x – Ordering Basics
- [ ] Load restaurants list (`Load Restaurants` button shows several restaurants)
- [ ] Select a restaurant and view menu
- [ ] Add multiple items to cart
- [ ] Place order succeeds, order appears in Orders list

## Story 2.4 – Mock Payments
- [ ] Click `Pay` on an order
- [ ] Payment intent + confirmation succeeds
- [ ] Order shows `Payment: Succeeded`

## Story 3.1 – Tracking (SSE)
- [ ] Click `Track` on an order
- [ ] Status text updates and coordinates stream
- [ ] Leaflet map displays marker that moves
- [ ] `Stop Tracking` ends the stream

## Story 3.2 – Restaurant Console + RBAC
- [ ] Register a user with role `staff`
- [ ] `Restaurant Console` loads orders for a selected restaurant
- [ ] `Advance` buttons progress the order status (Submitted → Accepted → Preparing → ReadyForPickup)
- [ ] As a `client`, attempting to advance status returns a 403 error in UI

## PWA Basics
- [ ] `Install` button appears (A2HS prompt) when criteria met
- [ ] Service worker registers (Debug log shows `SW registered`)
- [ ] Simulate offline → `/offline.html` is shown for navigation

## API Endpoints (Spot-check)
- [ ] `GET /healthz` returns `{ ok: true }`
- [ ] `POST /auth/register` and `POST /auth/login` work
- [ ] `GET /me` returns `{ id, email, role }` when authorized
- [ ] `GET /restaurants` and `GET /restaurants/:id/menu` return data

## CI
- [ ] GitHub Actions workflow passes: Lint, API smoke, Web smoke

## Notes
- Real Stripe integration deferred to a future sprint; payments are mocked.
- Styling is minimal by design for Sprint 1; polish later.
