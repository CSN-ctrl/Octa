# API & external services reference

Single source of truth for **URLs, env vars, and HTTP/RPC surfaces** this app touches.  
Update this file when you add new integrations.

---

## 1. Environment variables (`VITE_*`)

| Variable | Purpose | Default / fallback in code |
|----------|---------|----------------------------|
| `VITE_SUPABASE_URL` | Supabase project URL | Default project ref: `zfzsiykutsgkurmetprw` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon JWT (`createClient`) | `src/config/connections.ts` default — **override in `.env` for production / key rotation** |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Newer publishable key (`sb_publishable_…`) | Optional; not used by `createClient` today — see Supabase dashboard |
| `VITE_API_URL` | ChaosStar HTTP backend (REST) | `env.ts` + `chaosstar-client.ts` → default `http://localhost:5001` |
| `VITE_CHAOSSTAR_RPC` | Optional subnet RPC | Optional in `.env.example` |
| `VITE_STARGATE_RPC` | Optional Stargate RPC | Optional |
| `VITE_AVALANCHE_RPC` | Legacy / alias for RPC | Aliased to Stargate in `env.ts` |
| `VITE_CHAIN_ID` | Display / config | `8088` |
| `VITE_BLOCKCHAIN_ID` | Network id string | Set in `env.ts` defaults |
| `VITE_NETWORK_NAME` | Display name | `ChaosStar Network` |
| `VITE_NATIVE_TOKEN` | Symbol | `xBGL` |
| `VITE_CONTRACT_ADDRESS` | Land / main contract | `native` |
| `VITE_DIGITAL_ID_ADDRESS` | Digital ID contract | — |
| `VITE_TREASURY_ADDRESS` | Treasury contract | — |
| `VITE_DUMMY_TOKEN_ADDRESS` | Test token | — |
| `VITE_XBGL_TOKEN_ADDRESS` | xBGL token | Has code default |
| `VITE_PLOT_REGISTRY_ADDRESS` | Registry | — |
| `VITE_ACCOUNT_REGISTRY_ADDRESS` | Accounts registry | — |
| `VITE_ALCHEMY_API_KEY` | Alchemy JSON-RPC | `alchemy-service.ts` has hardcoded fallback — **set in `.env` for prod** |
| `VITE_SENTRY_DSN` | Error tracking | Optional |
| `VITE_SENTRY_ENVIRONMENT` | Sentry env | Optional |
| `VITE_GA_MEASUREMENT_ID` | Analytics | Optional |
| `VITE_ENABLE_PERFORMANCE` | Perf tooling | Optional |
| `VITE_ADMIN_ADDRESS` | Admin checks (Navigation) | Optional |
| `VITE_REGISTRY_URL` | Documented in `CONNECTIONS.md` for legacy registry | Optional |

See also: `.env.example`.

---

## 2. Supabase (primary data + auth)

**Base URL:** `{VITE_SUPABASE_URL}`

| Area | Pattern / notes |
|------|------------------|
| **REST (PostgREST)** | `{SUPABASE_URL}/rest/v1/{table}` — used via `@supabase/supabase-js` |
| **Auth** | `{SUPABASE_URL}/auth/v1/*` (sign-in, refresh, OAuth — see `OAUTH_API_DOCUMENTATION.md`) |
| **Realtime** | `wss://{project-ref}.supabase.co/realtime/v1/websocket` (client-managed) |
| **Storage** | `{SUPABASE_URL}/storage/v1/*` (e.g. `plot-certificates`, uploads) |
| **RPC** | `.rpc('function_name')` → `{SUPABASE_URL}/rest/v1/rpc/{name}` |

**Defaults in code (override with `.env`):**

- `src/config/connections.ts` — Supabase URL + anon JWT defaults (project `zfzsiykutsgkurmetprw`)  
- `src/integrations/supabase/client.ts` — `createClient` using `getSupabaseUrl()` / `getSupabaseAnonKey()`  
- `src/lib/oauth-server.ts`, `src/pages/OAuthConsent.tsx` — `getSupabaseUrl()` for OAuth endpoints / authorize redirect

**PostgREST tables / RPCs** (representative — full usage in `src/lib/supabase-service.ts` and grep `.from(`):

`plots`, `user_balances`, `transactions`, `ownership_registry`, `digital_identities`, `plot_purchases`, `portfolios`, `marketplace_listings`, `exchange_rates`, `user_wallets`, `star_systems`, `planets`, `cities`, `factions`, `npcs`, `economy_ticks`, `automation_settings`, `portfolio_managers`, `portfolio_followers`, `recurring_payments`, `black_market_invites`, `affiliates`, `user_affiliate_codes`, `affiliate_referrals`, `ilo_stats`, `ilo_phases`, `ilo_participants`, `genesis_stats`, `genesis_prizes`, `social_media_verifications`, `usdc_deposits`, `hot_wallets`, `plot_documents`, `plot_fractional_shares`, `expert_applications`, `user_stats`, …

Generated types: `src/integrations/supabase/types.ts`.

**New / empty project:** run `supabase/complete_schema.sql` once in the Supabase SQL Editor to create tables, RLS (MVP permissive), triggers, storage bucket `plot-certificates`, and RPCs (`get_ilo_stats`, `purchase_plot`, `mint_tokens`, …). Details: `supabase/README.md`.

---

## 3. ChaosStar HTTP backend (`VITE_API_URL`)

**Base:** `{VITE_API_URL}` (no trailing slash; client normalizes).

Used by `ChaosStarClient` in `src/lib/chaosstar-client.ts` (`fetch(`${baseUrl}${endpoint}`)`).

| Method | Path |
|--------|------|
| GET | `/api/chain-info` |
| GET | `/api/contract-info` |
| GET | `/api/verify-contract` |
| GET | `/api/plots/available?limit=&offset=` |
| GET | `/api/plots/owned/{address}` |
| GET | `/api/plots/{plotId}` |
| POST | `/api/plots/{plotId}/buy` |
| POST | `/api/plots/{plotId}/upgrade` |
| POST | `/api/plots/{plotId}/transfer` |
| GET | `/api/plots/matrix?x=&y=&radius=` |
| GET | `/api/marketplace` (+ optional query) |
| GET | `/api/npcs` |
| GET | `/api/npcs/{npcId}` |
| POST | `/api/npcs/spawn` |
| POST | `/api/npcs/{npcId}/train` |
| POST | `/api/npcs/{npcId}/assign` |
| POST | `/api/npcs/{npcId}/relocate` |
| POST | `/api/npcs/evolve` |
| GET | `/api/city` |
| GET | `/api/city/{name}` |
| POST | `/api/city/create` |
| POST | `/api/city/{name}/economy` |
| GET | `/api/city/{name}/stats` |
| GET | `/api/economy/stats` |
| GET | `/api/economy/prices` |
| POST | `/api/economy/swap` |
| GET | `/api/treasury` |
| POST | `/api/treasury/deposit` |
| POST | `/api/treasury/withdraw` |
| GET | `/api/balance/{address}` |
| GET | `/api/balance/{address}/{token}` |
| POST | `/api/transfer` |
| GET | `/api/wallet/{address}/balance` |
| GET | `/api/governance/proposals` |
| GET | `/api/governance/proposal/{id}` |
| POST | `/api/governance/proposal/create` |
| POST | `/api/governance/proposal/{id}/vote` |
| GET | `/api/portfolio/{address}` |
| GET | `/api/accounts` |
| GET | `/api/accounts/{address}` |
| GET | `/api/chaosstar/stargate/status` |
| GET | `/api/contracts/status` |
| GET | `/api/contracts/addresses` |

**Also referenced** (same base, from `chaosstar-sdk.ts` — ensure backend implements or stub):

| Method | Path |
|--------|------|
| GET | `/api/transactions/{address}?limit=` |
| GET | `/api/analytics/{address}` |

**Note:** `src/lib/api.ts` is largely **Supabase-backed** now; it does **not** export `getTreasury` / `getApiBase`. Code that still calls `api.getTreasury()` / `api.getApiBase()` (e.g. `chaosstar-sdk.ts`) may need alignment with `ChaosStarClient` or restored helpers.

---

## 4. PDF / certificate HTTP API (same backend base)

**Base:** `getApiUrl()` → `VITE_API_URL` (`src/env.ts`).

Used by `PurchaseConfirmation.tsx`, `PDFCertificateEditor.tsx`:

| Method | Path |
|--------|------|
| GET | `/api/pdf/template/land-ownership-certificate` |
| POST | `/api/pdf/certificate/generate` |
| GET | `/api/pdf/preview/land-ownership-certificate` |

Responses may include `download_url` (relative to same base).

---

## 5. Alchemy (multi-chain history)

**Endpoint pattern:** `https://{network}.g.alchemy.com/v2/{VITE_ALCHEMY_API_KEY}`

**JSON-RPC methods used:** `alchemy_getAssetTransfers` (and related in `alchemy-service.ts`).

**Networks** (from `SUPPORTED_CHAINS`): `eth-mainnet`, `polygon-mainnet`, `arb-mainnet`, `opt-mainnet`, `base-mainnet`, `zksync-mainnet`, etc.

---

## 6. Other public HTTPS APIs

| Service | URL / usage |
|---------|-------------|
| **CoinGecko** | `https://api.coingecko.com/api/v3/simple/price?...` (`currency-converter.ts`) |
| **Google Fonts** | `fonts.googleapis.com` / `fonts.gstatic.com` (see `index.html`) |
| **Static deploy** | `GET /addresses.json`, `GET /deployments/addresses.json` (`contracts.ts`, `AccountManagementContext.tsx`) |
| **Local config** | `GET /chaosstar-connection.json` (`integrations/chaosstar.ts`) |

---

## 7. Wallet / Web3

| Integration | Notes |
|-------------|--------|
| **WalletConnect** | `@walletconnect/ethereum-provider` in `wallet.ts` (project ID from cloud.walletconnect.com when enabled) |
| **Reown / WC v2** | CSP in `index.html` allows `api.reown.com`, WalletConnect relay — match your app config |

---

## 8. EVM JSON-RPC (optional)

Wallets and vault UI use `VITE_AVALANCHE_RPC` / `VITE_CHAOSSTAR_RPC` for `eth_*` calls when configured.

---

## 9. Related docs in repo

- `CONNECTIONS.md` — historical list of backend routes and env overview  
- `OAUTH_API_DOCUMENTATION.md` — Supabase OAuth endpoints  
- `cursor-brain/anti_patterns.md` — avoid hardcoding URLs without env  

---

*Generated for the Octavia / Chaos Star frontend. Regenerate sections when adding new `fetch` or Supabase tables.*
