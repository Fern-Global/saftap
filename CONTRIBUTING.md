# Contributing to Saftap

This guide sets up the local development environment for Saftap, including backend dependencies, database setup, Prisma migrations, and running the app.

## 1. Prerequisites

- Node.js 20 or later
- pnpm (repo uses `pnpm@11.x`)
- PostgreSQL locally or via Docker
- An ngrok account for receiving Daraja sandbox callbacks locally
- Optional: Docker for quick local database setup

## 2. Fresh‑clone setup

From the repository root:

```bash
pnpm install
```

Copy the backend environment example:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Update `apps/backend/.env` with your local values. At minimum, set:

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/saftap?schema=public
```

Do not commit `.env`.

## 3. Start PostgreSQL

If you already have PostgreSQL running, create a `saftap` database and use its connection string.

For a quick Docker-based setup:

```bash
docker run --name saftap-postgres \
  -e POSTGRES_USER=saftap \
  -e POSTGRES_PASSWORD=saftap \
  -e POSTGRES_DB=saftap \
  -p 5432:5432 \
  -d postgres:16
```

Then use:

```env
DATABASE_URL=postgresql://saftap:saftap@localhost:5432/saftap?schema=public
```

If the container already exists but is stopped:

```bash
docker start saftap-postgres
```

## 4. Generate Prisma client and run database setup

From the repo root, run:

```bash
pnpm --filter @saftap/backend prisma:generate
pnpm --filter @saftap/backend prisma:migrate
pnpm --filter @saftap/backend prisma:seed
```

If you prefer the backend package directory:

```bash
cd apps/backend
pnpm prisma generate
pnpm prisma migrate dev --name init
pnpm prisma db seed
```

## 5. Configure frontend environment

Create frontend env files:

```bash
cp frontend/.env.example frontend/.env
```

Then update `frontend/.env` and `apps/backend/.env` with the correct values.

## 6. Start local development

From the repo root, run:

```bash
pnpm dev
```

To start only the frontend app in native mode:

```bash
pnpm --filter @saftap/mobile dev
```

To start the frontend in web mode:

```bash
pnpm --filter @saftap/mobile web
```

To start only the backend:

```bash
pnpm --filter @saftap/backend dev
```

## 7. Verify the backend

Run backend tests:

```bash
pnpm --filter @saftap/backend test
```

Run backend type checking:

```bash
pnpm --filter @saftap/backend typecheck
```

## 8. Receive Daraja callbacks with ngrok

The Daraja sandbox sends payment results to a public HTTPS callback URL. The project uses
the official ngrok Node SDK, so no global ngrok installation is required.

Get your authtoken from the [ngrok dashboard](https://dashboard.ngrok.com/get-started/your-authtoken)
and add it to `apps/backend/.env`:

```env
NGROK_AUTHTOKEN=your_ngrok_authtoken
DARAJA_BASE_URL=https://sandbox.safaricom.co.ke
```

Start the tunnel from the repository root:

```bash
pnpm backend:tunnel
```

The command exposes backend port `4000`, prints the public HTTPS URL, and updates
`WEBHOOK_BASE_URL` in `apps/backend/.env`. Keep the tunnel process running.

In a second terminal, start or restart the backend so it loads the new callback URL:

```bash
pnpm --filter @saftap/backend dev
```

Daraja will receive these callback URLs in B2C and B2B requests:

```text
https://YOUR-NGROK-DOMAIN/api/mpesa/callback
```

Verify the public tunnel using the URL printed by the tunnel command:

```bash
curl https://YOUR-NGROK-DOMAIN/health
```

Free ngrok URLs may change whenever the tunnel restarts. Run `pnpm backend:tunnel` again,
then restart the backend whenever that happens. Never commit `NGROK_AUTHTOKEN` or the local
`apps/backend/.env` file.

## 9. Production / deployment notes

The backend includes `apps/backend/railway.json` and `apps/backend/Procfile` for deployment on Railway or other container-based hosts.

See [`docs/environments.md`](docs/environments.md) for local Anvil, Railway demo,
production CDP, persistence, and explicit reset configuration.

If deploying manually, build and start the backend with:

```bash
pnpm --filter @saftap/backend build
pnpm --filter @saftap/backend start
```

## Troubleshooting

- If Prisma reports `Environment variable not found: DATABASE_URL`, confirm `apps/backend/.env` exists and is loaded.
- If PostgreSQL connection fails, verify that the database is running and the connection string is correct.
- Use `pnpm --filter @saftap/backend prisma:generate` after updating Prisma schema or dependencies.
