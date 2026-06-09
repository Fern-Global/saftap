FROM ghcr.io/foundry-rs/foundry:stable AS foundry

FROM node:22-bookworm-slim AS build

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile

COPY apps/backend apps/backend
COPY packages/shared packages/shared
RUN pnpm --filter @saftap/shared build \
    && pnpm --filter @saftap/backend build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app
RUN corepack enable

COPY --from=foundry /usr/local/bin/anvil /usr/local/bin/anvil
COPY --from=build /app /app

ENV NODE_ENV=production
EXPOSE 4000 8545

CMD ["pnpm", "--filter", "@saftap/backend", "start"]
