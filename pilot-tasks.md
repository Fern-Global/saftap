# SafTap: Pilot Phase Task Board

## Frontend (React Native / Expo)

### `[FRONTEND-01]` Resolve Linting & TypeScript Errors
**Description:** The Expo application currently fails the `pnpm run lint` check due to 20 errors in `frontend/App.tsx`. 
**Tasks:**
- [ ] Remove unused Lucide icons (`Switch`, `CreditCard`, `Eye`, `MoreVertical`, `HandCoins`, etc.).
- [ ] Remove unused state variables (`intlPayments`, `onlinePurchases`).
- [ ] Fix unescaped apostrophes (e.g., replace `'` with `&apos;`).
- [ ] Replace `any` types with proper shared types from `@saftap/shared` (lines 886-930).
**Priority:** High (Blocks CI/CD pipeline)

### `[FRONTEND-02]` Oracle Price Feed Fallback UI
**Description:** If the oracle fails to fetch the live USDC/KES price, the UI needs to handle this gracefully rather than generating a QR code with a $0 or NaN value.
**Tasks:**
- [ ] Implement a 5-second timeout on the price fetch.
- [ ] Display an error state: "Unable to fetch live exchange rate. Please try again."
- [ ] Disable the "Generate QR" button if the price feed is unavailable.
**Priority:** High

### `[FRONTEND-03]` Payment Success Animation & Receipt
**Description:** The merchant needs absolute confidence that the money has arrived.
**Tasks:**
- [ ] Add a visual success state (e.g., Lottie checkmark animation) when the backend WebSocket emits `COMPLETED`.
- [ ] Display the `darajaReceiptId` prominently on the screen so the merchant can cross-reference it with their SMS notification.
**Priority:** Medium

---

## Backend (Node.js / Settlement Engine)

### `[BACKEND-01]` Replay Protection on Blockchain Monitor
**Description:** Ensure a single on-chain transaction cannot trigger multiple M-PESA payouts.
**Tasks:**
- [ ] Review `apps/backend/src/blockchain/monitor.ts`.
- [ ] Add a strict database lock or Redis cache check before calling `darajaService.sendToMpesa()` to ensure `txHash` is only processed once, even if the polling fallback and WebSocket listener trigger simultaneously.
**Priority:** Critical

### `[BACKEND-02]` M-PESA Production Credential Integration
**Description:** Transition from Safaricom Sandbox to Production APIs.
**Tasks:**
- [ ] Update `apps/backend/src/modules/mpesa/daraja.service.ts` to use production URLs (`https://api.safaricom.co.ke/`) instead of sandbox URLs.
- [ ] Implement proper RSA encryption for the `SecurityCredential` as required by Safaricom Production (Sandbox currently uses the raw passkey).
- [ ] Add `ENVIRONMENT=production` toggle in `.env` to switch between Sandbox and Production endpoints dynamically.
**Priority:** Critical

### `[BACKEND-03]` Webhook URL Configuration
**Description:** Daraja requires publicly accessible webhook URLs for callbacks.
**Tasks:**
- [ ] Ensure `WEBHOOK_BASE_URL` is properly configured in the production environment.
- [ ] Verify the `/mpesa/callback` route is secure and ignores unauthorized POST requests.
**Priority:** High

---

## Infrastructure & DevOps

### `[INFRA-01]` Database Provisioning & Migration
**Description:** Deploy a production PostgreSQL database.
**Tasks:**
- [ ] Provision a Postgres database (e.g., Supabase, Railway, or AWS RDS).
- [ ] Run `pnpm backend:prisma:migrate` to apply the `20260528170011_init` schema to production.
- [ ] Set `DATABASE_URL` in the production environment.
**Priority:** High

### `[INFRA-02]` Settlement Wallet Deployment & Gas Funding
**Description:** The backend requires a live wallet to receive USDC.
**Tasks:**
- [ ] Generate a secure, production `SETTLEMENT_WALLET_ADDRESS` private key.
- [ ] Inject the private key into the backend environment securely (do not commit to `.env`).
- [ ] Send $5 worth of native gas (ETH for Base, MATIC for Polygon) to this wallet so it doesn't fail when attempting to process payload data.
**Priority:** Critical

### `[INFRA-03]` Cloud Deployment
**Description:** Deploy the Node.js backend.
**Tasks:**
- [ ] Deploy `apps/backend` using the existing `railway.json` and `Procfile`.
- [ ] Ensure the deployment does not spin down (must run 24/7 to listen to the blockchain).
**Priority:** High