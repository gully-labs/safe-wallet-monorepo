# Gully Safe

Gully Safe is Gully Labs' deployment of [Safe{Wallet}](https://github.com/safe-global/safe-wallet-monorepo) for
Gully Chain. It is a fork of the Safe{Wallet} web app and, like it, licensed under the GNU General Public License
v3.0 (see `LICENSE` and `apps/web/LICENSE`, unchanged). Source of the running build:
https://github.com/gully-labs/safe-wallet-monorepo/tree/gully/testnet

- App: https://safe.gullychain.xyz
- Backend (Safe Client Gateway): https://safe.gullychain.xyz/cgw
- Default chain: Gully Chain Testnet, chain id 485590, shortName `gully-test`

## Base version

Branch `gully/testnet` is based on upstream tag **v1.81.0** (web app 1.81.0, 2026-02-11), not on the fork's `dev`.
The Gully backend runs the last MIT-licensed releases before Safe's 2026-02-17 licence change: Client Gateway v1.101.0
(2026-02-12), Config Service v2.91.0 and Transaction Service v5.42.1. v1.81.0 is the last web release published
before that date, so it only calls Client Gateway endpoints v1.101.0 has. Newer web releases (e.g. v1.104.1,
October 2026) expect a newer gateway.

## Build

Static export, from the repo root, in a `node:22` container (needs about 8 GB RAM and a few GB of disk):

```sh
docker run --rm -v "$PWD":/app -w /app node:22 sh apps/web/scripts/gully-build.sh
```

Output: `apps/web/out/` (serve as static files; client-side routes need `try_files $uri $uri.html $uri/ /index.html`).

`apps/web/scripts/gully-build.sh` loads `apps/web/.env.gully` (public build-time values, no secrets), then runs
`corepack enable`, `yarn install --immutable`, `yarn workspace @safe-global/web after-install`,
`yarn workspace @safe-global/web build` and `yarn workspace @safe-global/web integrity`.
Set `NEXT_PUBLIC_COMMIT_HASH` when building from a `git archive` tarball (no `.git`).

## Safe contracts on 485590

The Safe v1.4.1 contracts on Gully Chain Testnet are at non-canonical addresses (Arachnid CREATE2 deployer) and the
chain is not in `@safe-global/safe-deployments`. The addresses live in `apps/web/src/config/gully-contracts.json`.

- `packages/utils/src/services/contracts/customDeployments.ts` registers them at runtime in the safe-deployments
  tables (extra deployment type `custom`, `networkAddresses['485590']`), so every `get*Deployment({ network })`
  lookup in the app and in protocol-kit returns them. It also builds protocol-kit `contractNetworks`.
- `apps/web/src/config/gully-deployments.ts` does the registration; it is the first import of `pages/_app.tsx`.
- `hooks/coreSDK/safeCoreSDK.ts` and `components/new-safe/create/logic` pass `contractNetworks` explicitly.
- `next.config.mjs` aliases `@safe-global/safe-deployments` to one copy so the app, `packages/utils` and
  protocol-kit share the registered tables.

To change an address, edit `gully-contracts.json` and rebuild.

## What is turned off

Env-driven (all empty in `.env.gully`): Google Analytics/GTM, Mixpanel, Sentry, Datadog, Beamer, WalletConnect
project id (WalletConnect wallet option hidden), Infura, Blockaid, Tenderly, Hypernative OAuth client, Firebase push.
The GA script is not loaded at all without a tracking id.
The "Private key" signer wallet (a testing aid; upstream hides it through the chain's `disabledWallets`) is only
included when `NEXT_PUBLIC_GULLY_ENABLE_PK_WALLET=true` (default `false`).

Config-driven (Gully Config Service, chain features of 485590), keep these off: `NATIVE_SWAPS*`, `BRIDGE`, `STAKING*`,
`EARN*`, `RISK_MITIGATION`, `HYPERNATIVE*`, `TX_SIMULATION`, `PUSH_NOTIFICATIONS`, `RECOVERY`, `ZODIAC_ROLES`,
`RELAYING`, `MIXPANEL`, `NATIVE_WALLETCONNECT`, `SAFE_APPS`, `SPACES`, `MULTI_CHAIN_SAFE_*`, `TARGETED_SURVEY`,
`SAP_BANNER`, `EURCV_BOOST`.
`SPENDING_LIMIT` is ON (since 2026-10-30): AllowanceModule 0.1.1 at `0x0Fd09Bd80206854b1dAd588A2eFCd7573De536b9` on 485590
(canonical code, Arachnid-deployed, so not in `@safe-global/safe-modules-deployments`; the address is overlaid from
`apps/web/src/config/gully-contracts.json` `modules.allowanceModule` in `spendingLimitDeployments.ts`).
`DOMAIN_LOOKUP` on enables `.gully` names (registry from the chain's `ensRegistryAddress`).

## Gully changes in this fork

Search for `Gully Safe` in the code. Branding: GullyChain brand kit v3 (logo, favicons, OG image, colours, Exo 2),
dark theme by default, "Powered by Gully Labs" footer badge, Gully terms/privacy, "Gully services" page and
dashboard panel, `.gully` name resolution through the chain's ENS registry.
