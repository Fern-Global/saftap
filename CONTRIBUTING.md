# Contributing to Saftap

This guide sets up the local development environment for Saftap, including backend dependencies, database setup, Prisma migrations, and running the app.

## 1. Prerequisites

- Node.js 20 or later
- pnpm (repo uses `pnpm@9.x`)
- PostgreSQL locally or via Docker
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

## 4. Generate Prisma client

From the repo root:

```bash
pnpm --filter @saftap/backend prisma:generate
```

Or from `apps/backend`:

```bash
pnpm prisma generate
```

## 5. Run migrations

From `apps/backend`:

```bash
pnpm prisma migrate dev --name init
```

Or from the repo root:

```bash
pnpm --filter @saftap/backend prisma:migrate
```

## 6. Seed the database

From `apps/backend`:

```bash
pnpm prisma db seed
```

Or from the repo root:

```bash
pnpm --filter @saftap/backend prisma:seed
```

## 7. Start local development

Run the full monorepo development stack from the repo root:

```bash
pnpm dev
```

To start only the backend:

```bash
pnpm --filter @saftap/backend dev
```

## 8. Verify the backend

Run backend tests:

```bash
pnpm --filter @saftap/backend test
```

Run backend type checking:

```bash
pnpm --filter @saftap/backend typecheck
```

## 9. Production / deployment notes

The backend includes `apps/backend/railway.json` and `apps/backend/Procfile` for deployment on Railway or other container-based hosts.

Make sure the production environment defines all required backend variables, including `DATABASE_URL`, `JWT_SECRET`, `DARAJA_CONSUMER_KEY`, `DARAJA_CONSUMER_SECRET`, `DARAJA_SHORTCODE`, and `DARAJA_PASSKEY`.

If deploying manually, build and start the backend with:

```bash
pnpm --filter @saftap/backend build
pnpm --filter @saftap/backend start
```

## Troubleshooting

- If Prisma reports `Environment variable not found: DATABASE_URL`, confirm `apps/backend/.env` exists and is loaded.
- If PostgreSQL connection fails, verify that the database is running and the connection string is correct.
- Use `pnpm --filter @saftap/backend prisma:generate` after updating Prisma schema or dependencies.
