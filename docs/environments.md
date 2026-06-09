# Backend Environments

`APP_ENV` controls both the wallet provider and the blockchain connection. Database
data and Anvil state persist by default. Resets happen only through an explicit
developer command or the secured demo reset endpoint.

## Environment Matrix

| `APP_ENV` | Wallet implementation | Chain |
| --- | --- | --- |
| `local` | Generated EVM private keys encrypted in `Wallet.encryptedKey` | Anvil fork of Base Sepolia |
| `demo` | Generated EVM private keys encrypted in `Wallet.encryptedKey` | Managed Anvil fork of Base Sepolia |
| `production` | Coinbase CDP remote wallets | Base mainnet |

Local and demo always use the official Base Sepolia USDC contract:
`0x036CbD53842c5426634e7929541eC2318f3dCF7e`. Production uses the official
Base USDC contract: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`.

## Local Development

Install Foundry so the `anvil` executable is available, then set:

```env
APP_ENV=local
ANVIL_FORK_URL=https://base-sepolia.g.alchemy.com/v2/...
ANVIL_RPC_URL=http://127.0.0.1:8545
ANVIL_STATE_PATH=.anvil/state.json
TREASURY_WALLET_ADDRESS=0x...
WALLET_ENCRYPTION_KEY=at-least-32-random-characters
```

Start normal development with:

```bash
pnpm --filter @saftap/backend dev
```

This starts Anvil and the backend together. It does not reset PostgreSQL. Anvil
uses `--state`, so fork transactions are loaded on startup and dumped on shutdown.
Stopping the dev command sends a graceful shutdown signal to both processes.

To explicitly wipe PostgreSQL, reset the fork, and recreate the demo users:

```bash
pnpm --filter @saftap/backend dev:clean
```

`dev:clean` starts Anvil first, runs Prisma's destructive reset, executes the seed,
and then starts the backend against that same fork. Running `db:reset` directly
expects Anvil to already be available at `ANVIL_RPC_URL`.

The seed creates exactly these accounts, all with password `password123`:

| User | Email | Initial USDC |
| --- | --- | ---: |
| Alice | `alice.demo@saftap.local` | 500 |
| Bob | `bob.demo@saftap.local` | 250 |
| Charlie | `charlie.demo@saftap.local` | 50 |

The seed resets the fork, impersonates
`0xFaEc9cDC3Ef75713b48f46057B98BA04885e3391`, gives it gas using Anvil,
and transfers forked Base Sepolia USDC to each generated wallet. Override the
address with `ANVIL_USDC_WHALE_ADDRESS` if the upstream holder changes.

The default holder was verified through the
[Base Sepolia Blockscout holder API](https://base-sepolia.blockscout.com/api/v2/tokens/0x036CbD53842c5426634e7929541eC2318f3dCF7e/holders).

## Demo On Railway

The backend Dockerfile includes Anvil. Configure the Railway service with:

```env
APP_ENV=demo
ANVIL_FORK_URL=https://base-sepolia.g.alchemy.com/v2/...
ANVIL_RPC_URL=http://127.0.0.1:8545
ANVIL_STATE_PATH=/data/anvil-state.json
ADMIN_API_KEY=at-least-32-random-characters
```

Attach a Railway volume mounted at `/data` so Anvil state survives container
restarts and deployments. The standard start command runs `prisma migrate deploy`,
starts Anvil without resetting it, and then starts the HTTP server.

Reset demo state with:

```bash
curl -X POST https://YOUR-BACKEND/admin/demo-reset \
  -H "Authorization: Bearer $ADMIN_API_KEY"
```

The endpoint exists only when `APP_ENV=demo`. It resets the fork, wipes application
data, and recreates the three seeded users. Concurrent reset requests return `409`.

For a nightly GitHub Actions schedule, store the URL and API key as repository
secrets:

```yaml
name: Reset demo
on:
  schedule:
    - cron: "0 2 * * *"
jobs:
  reset:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl --fail --request POST "$DEMO_RESET_URL" \
            --header "Authorization: Bearer $ADMIN_API_KEY"
        env:
          DEMO_RESET_URL: ${{ secrets.DEMO_RESET_URL }}
          ADMIN_API_KEY: ${{ secrets.ADMIN_API_KEY }}
```

Choose a low-traffic time. Railway cron can invoke an equivalent command from a
small scheduled service.

## Production

Production requires `APP_ENV=production`, Coinbase CDP credentials, `BASE_RPC_URL`,
and `TREASURY_WALLET_ADDRESS`. The wallet provider creates and signs with remote CDP
accounts; no private user keys are stored in PostgreSQL.

The normal start command is intentionally non-destructive:

```bash
prisma migrate deploy && node dist/index.js
```

It applies pending migrations and starts the server. It never seeds or resets the
database and never launches Anvil in production.

## Key Storage

Local/demo private keys are encrypted with AES-256-GCM. Set
`WALLET_ENCRYPTION_KEY` to a dedicated random value of at least 32 characters.
When omitted, `JWT_SECRET` is used as a compatibility fallback. Rotating either
value requires re-encrypting existing wallet keys or explicitly resetting demo
data.

## References

- [Foundry Anvil reference](https://getfoundry.sh/anvil/reference)
- [Railway Dockerfile configuration](https://docs.railway.com/config-as-code/reference)
- [Coinbase Base Sepolia USDC address](https://docs.cdp.coinbase.com/custom-stablecoins/conversions/stableswapper-contract/key-addresses)
