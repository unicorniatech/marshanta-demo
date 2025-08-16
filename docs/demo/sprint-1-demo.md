# Sprint 1 Demo Script

This guide walks through the Sprint 1 flows end-to-end.

## Prereqs
- Node 20+
- Local services running:
  - API: `npm run -w @marshanta/api dev` (http://localhost:4000)
  - Web: `npm run -w @marshanta/web dev` (http://localhost:5173)

## 1) Browse and Order
- Open the PWA at `http://localhost:5173`.
- Click "Load Restaurants".
- Pick a restaurant → View menu.
- Add a couple of items to the cart.
- Click "Place Order". Note the order ID.

## 2) Payment (Mock)
- In Orders, click "Pay" on your order.
- Confirm mock payment. Expect payment status to become `Succeeded`.

## 3) Real-time Tracking
- Click "Track" on the order. Watch:
  - Status text updates.
  - Coordinates change.
  - Map marker moves in Leaflet map.
- Click "Stop Tracking" to end.

## 4) Restaurant Console (Role-guarded)
- Register a new user with role `staff` (or `admin`).
- Go to "Restaurant Console":
  - Select the same restaurant.
  - Click "Load Orders".
  - Use "Advance" buttons to progress order status.
- Try the same steps logged in as a `client`:
  - Attempting to advance status should fail with a 403 message.

## 5) Auth Checks
- After login, the greeting displays your role.
- `/me` endpoint returns `{ id, email, role }` when authorized.

## 6) CI
- GitHub Actions workflow runs API smoke test on PRs and pushes to `main`.

## Notes / Future Work
- Payments are mocked; Stripe planned for a later sprint.
- UI polish and PWA assets (icons/offline) can be enhanced next.
