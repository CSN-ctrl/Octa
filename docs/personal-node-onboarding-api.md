# Personal Node onboarding API (Octa Investment Group / Sarakt)

Server-side Vercel `/api/nodes/*` routes for wallet-signed Personal Node join, ZeroTier authorization, heartbeats, and Android app release metadata. **Migrations are committed only** — apply `supabase/migrations/20260611170000_personal_node_onboarding.sql` in your environment.

**Depends on:** PR #20 (`cursor/sarakt-canonical-product-rules-67fe`) — Supabase bearer conventions, `is_dashboard_admin()`, plots / permits patterns.

---

## Environment variables (server-only unless noted)

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | Yes | Same project as SPA |
| `SUPABASE_ANON_KEY` | Yes | For optional Supabase user linking |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Node tables (no client `VITE_*`) |
| `ZEROTIER_API_TOKEN` | For approval | ZeroTier Central API token |
| `ZEROTIER_NETWORK_ID` | For approval | Network ID to authorize members |
| `NODE_JOIN_AUTO_APPROVE` | No | `true` to auto-approve (default **off**) |
| `NODE_JOIN_DOMAIN` | Prod recommended | SIWE domain + URI host (e.g. `https://www.sarakt.com`). Defaults from request host in dev. |
| `NODE_JOIN_CHAIN_ID` | Prod recommended | EIP-155 chain ID in SIWE (default `43113` Fuji when unset) |
| `NODE_JOIN_ENVIRONMENT` | No | `production` \| `staging` \| `dev` — bound in SIWE resource `urn:octa:env:*` (falls back to `VERCEL_ENV`) |
| `NODE_JOIN_CLOCK_SKEW_SECS` | No | Default `60` — allow `issuedAt` up to this many seconds in the future; allow `expirationTime` up to this many seconds in the past; reject `notBefore` beyond this skew when present |
| `NODE_MAX_ACTIVE_PER_WALLET` | No | Default `3` live (`pending` + `approved`) nodes per wallet |
| `NODE_HEARTBEAT_INTERVAL_ANDROID` | No | Seconds; default `300` |
| `NODE_HEARTBEAT_INTERVAL_WEB` | No | Default `300` |
| `NODE_HEARTBEAT_INTERVAL_DESKTOP` | No | Default `60` |
| `NODE_HEARTBEAT_ONLINE_MULTIPLIER` | No | Default `2.5` — online if last heartbeat within `interval × multiplier` |
| `NODE_HEARTBEAT_RATE_LIMIT_FRACTION` | No | Default `0.8` — min gap between accepted heartbeats |
| `NODE_APP_RELEASE_VERSION` | For app-release | Semver shown to clients |
| `NODE_APP_RELEASE_URL` | For app-release | APK URL (see GitHub Releases note below) |
| `NODE_APP_RELEASE_SHA256` | Optional | SHA-256 hex of APK |
| `NODE_APP_MIN_SUPPORTED_VERSION` | Optional | Below this, clients should force upgrade |

Never prefix ZeroTier or service role secrets with `VITE_`.

---

## Android APK hosting (out of scope for code)

Publish release APKs via **GitHub Releases** on `CSN-ctrl/Octa`, attach the APK, and record **SHA-256** in `NODE_APP_RELEASE_SHA256`. Point `NODE_APP_RELEASE_URL` at the release asset URL. Web “Run a Personal Node” and the Android app call `GET /api/nodes/app-release`.

---

## Auth model

| Actor | Header | Use |
|-------|--------|-----|
| Optional Supabase user | `Authorization: Bearer <jwt>` | Link `owner_user_id` + `user_wallets` on challenge/join |
| Pending poll / credential exchange | `Authorization: Pending <pending_token>` | Status + one-time credential exchange after approval |
| Running node (Rust core) | `Authorization: Node <node_credential>` | Heartbeat, rotate credential, revoke, `GET /api/nodes/mine` |
| Governance reviewer | Supabase bearer + `is_network_governance_reviewer()` | Review join requests |

**Never trust `wallet_address` without SIWE (EIP-4361) verification or a valid Node credential.**

Challenge **purpose** (`join` | `lookup`) is carried in SIWE **resources** (`urn:octa:purpose:join|lookup`) so lookup proofs cannot be replayed as join.

---

## SIWE message format (EIP-4361)

Challenges return the exact string from `SiweMessage.prepareMessage()` (UTF-8). Clients sign with EIP-191 `personal_sign` over that string (MetaMask, WalletConnect, in-app Rust secp256k1).

**Server-bound fields**

| Field | Source |
|-------|--------|
| Domain | Host from `NODE_JOIN_DOMAIN` |
| URI | Origin from `NODE_JOIN_DOMAIN` |
| Chain ID | `NODE_JOIN_CHAIN_ID` (default `43113`) |
| Statement | `Octa Personal Node Join Request` or `Octa Personal Node Wallet Lookup` |
| Nonce | 32 hex chars on challenge row |
| Issued At / Expiration Time | Challenge row (lifetime ~5 minutes) |
| Resources | See below |

**Resources (order matters for verification)**

- `urn:zerotier:<10 hex>` — device ZeroTier ID (`0000000000` for lookup challenges)
- `urn:octa:purpose:join` or `urn:octa:purpose:lookup`
- `urn:octa:platform:android|web|desktop`
- `urn:octa:env:production|staging|dev`
- Optional on replace: `urn:octa:replace:<node_uuid>` (must match `replace_node_id` on challenge + join body)

Verification: parse with `siwe`, recover signer via `ethers.verifyMessage(preparedMessage, signature)`, then check domain, chain ID, nonce, statement, resources, and clock skew (below).

### Clock skew (`NODE_JOIN_CLOCK_SKEW_SECS`, default 60)

Challenge **expires_at** stays short (~5 min). SIWE timestamps use an additional skew window:

- **`issuedAt`**: reject if more than skew seconds **in the future** vs server time.
- **`expirationTime`**: accept if expired by at most skew seconds (grace after expiry).
- **`notBefore`**: if present, reject when more than skew seconds **in the future**.

Production join verification uses server wall clock at request time (no fixed test time).

### Rust / QA test vector (Hardhat account #0, **test only**)

In this repo’s `ethers` v6, Hardhat mnemonic account **#0** resolves to **`0x9Ef900738ea2D80BF4d2813F4663391F0382Ab52`** (not the classic `0xf39F…` address from older tooling).

| Field | Value |
|-------|--------|
| Private key | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbe14826f6940f7a06973522` |
| Wallet (in message) | `0x9Ef900738ea2D80BF4d2813F4663391F0382Ab52` |
| `NODE_JOIN_DOMAIN` | `https://www.sarakt.com` |
| Chain ID | `43113` |
| Nonce | `0123456789abcdef0123456789abcdef` |
| Issued At | `2026-06-01T12:00:00.000Z` |
| Expiration Time | `2026-06-01T12:05:00.000Z` |
| ZeroTier (resource) | `a1b2c3d4e5` |
| Platform (resource) | `android` |
| Environment (resource) | `dev` |
| Signature | `0x6e6e58f347b7634393f19ef6a86ed898d4748d0ff8f10ef3b6768f85c9352cc3048a8aba63aadfc424b7591390c35c0851a48d0a1fb12b7f691b2e4fb2bd67411b` |

Full prepared message (copy verbatim):

```
www.sarakt.com wants you to sign in with your Ethereum account:
0x9Ef900738ea2D80BF4d2813F4663391F0382Ab52

Octa Personal Node Join Request

URI: https://www.sarakt.com
Version: 1
Chain ID: 43113
Nonce: 0123456789abcdef0123456789abcdef
Issued At: 2026-06-01T12:00:00.000Z
Expiration Time: 2026-06-01T12:05:00.000Z
Resources:
- urn:zerotier:a1b2c3d4e5
- urn:octa:purpose:join
- urn:octa:platform:android
- urn:octa:env:dev
```

Canonical constants live in `api/_lib/node-siwe.ts` (`DOCUMENTED_SIWE_TEST_VECTOR`, `documentedSiweTestMessage()`).

---

## Multi-device cap and replace

- Up to **`NODE_MAX_ACTIVE_PER_WALLET`** (default 3) live nodes per wallet (`pending` or `approved`).
- At cap without replace → **`409`** `{ "success": false, "error": "device_limit_reached", "active_nodes": [ … ] }`.
- **Replace:** pass `replace_node_id` on **`POST /api/nodes/challenge`**; the SIWE message must include `urn:octa:replace:<same uuid>`. Join must use the same challenge (replace id stored on challenge row).
- **Atomic join:** `POST /api/nodes/join` deauthorizes ZeroTier for the replaced member when configured, then calls RPC **`complete_personal_node_join`**, which takes a **per-wallet `pg_advisory_xact_lock`** so concurrent joins cannot race past the device cap.
- **Events (same transaction as new node insert):** on the old node — `replaced` (payload includes `replaced_by_node_id`), `revoked`, then `zt_deauthorized` or `zt_deauth_failed` depending on API ZT deauth outcome; new node row + join request created in the same transaction.

Migrations: `20260611180000_node_events_and_challenge_binding.sql`, `20260611190000_node_join_atomic_replace.sql`.

### Replaced device — no push

The old device is **not** push-notified. On the next **`POST /api/nodes/:id/heartbeat`** or **`GET /api/nodes/:id/status`** with a still-valid Node credential, the server returns **`401`**:

```json
{
  "success": false,
  "error": "node_revoked",
  "message": "Node access revoked",
  "reason": "replaced_by_new_device",
  "replaced_by_node_id": "<new-node-uuid>"
}
```

Worst-case latency is about **one heartbeat interval** (platform-specific from env). Revoked rows keep `credential_hash` so the device can authenticate and receive this explicit error (not a generic 403).

---

## Pending token → node credential

1. `POST /api/nodes/join` returns `pending_token` when governance approval is required (default).
2. Poll `GET /api/nodes/:id/status` with `Authorization: Pending <pending_token>` (`Cache-Control: no-store`, rate-limited).
3. When `node.status` is `approved`, call `POST /api/nodes/:id/exchange-credential` once with the same Pending header → `{ success, node_credential, next_heartbeat_secs }`.
4. Pending tokens expire in **7 days**; after exchange, pending token is consumed.

Auto-approve (`NODE_JOIN_AUTO_APPROVE=true`) skips steps 2–3 for credential delivery and returns `node_credential` on join.

**Credential scheme:** `octa_node_<64 hex random>`; only **SHA-256** stored in `nodes.credential_hash`. Rotate via `POST /api/nodes/:id/rotate-credential`.

---

## Heartbeat (headless Rust core)

`POST /api/nodes/:id/heartbeat`  
Auth: `Authorization: Node <credential>`

Body (JSON):

```json
{
  "uptime_secs": 12345,
  "version": "1.2.0",
  "zt_online": true,
  "platform": "android",
  "peers": 4,
  "block_height": null
}
```

Response includes `next_heartbeat_secs` (platform-specific from env). Rate limit: minimum gap ≈ `interval × NODE_HEARTBEAT_RATE_LIMIT_FRACTION`. **Online** status uses `last_heartbeat_at` within `interval × NODE_HEARTBEAT_ONLINE_MULTIPLIER`.

---

## Legacy `sarakt-node` / `claim_node`

A repo-wide search on this branch found **no** Supabase RPC named `claim_node` or `sarakt-node` heartbeat implementation (may live in another repo, branch, or deployed DB only). **This PR does not modify legacy RPCs.**

**Suggested migration (Node Infra to detail):** map existing rotated tokens to `nodes.credential_hash`, register rows in `nodes` with `node_class = 'light'`, point the Rust core at `POST /api/nodes/:id/heartbeat` + Node credential, and retire `claim_node` after dual-write validation.

---

## Routes

All success responses wrap `{ "success": true, ... }`. Errors: `{ "success": false, "error": "...", "message": "..." }`.

### `POST /api/nodes/challenge`

No auth required. Optional Supabase bearer links user.

Request:

```json
{
  "wallet_address": "0x…",
  "zerotier_node_id": "a1b2c3d4e5",
  "platform": "android",
  "app_version": "1.0.0",
  "purpose": "join",
  "replace_node_id": "uuid-optional"
}
```

Lookup: `"purpose": "lookup"` (omit or placeholder ZT id; server stores `0000000000`).

Response `201`:

```json
{
  "success": true,
  "challenge_id": "uuid",
  "nonce": "…",
  "message": "www.sarakt.com wants you to sign in…",
  "expires_at": "ISO8601"
}
```

### `POST /api/nodes/join`

Optional Supabase bearer.

Request:

```json
{
  "challenge_id": "uuid",
  "wallet_address": "0x…",
  "signature": "0x…"
}
```

Response `201`:

```json
{
  "success": true,
  "node": {
    "id": "uuid",
    "status": "pending",
    "reason": null,
    "zerotier_node_id": "a1b2c3d4e5",
    "zt_authorized": false,
    "last_seen_at": "ISO8601",
    "online": false,
    "app_version": "1.0.0"
  },
  "pending_token": "octa_pending_…",
  "next_heartbeat_secs": 300
}
```

When auto-approved, includes `node_credential` instead of `pending_token`, `status`: `approved`.

### `POST /api/nodes/by-wallet`

Wallet-only listing.

Request:

```json
{
  "challenge_id": "uuid",
  "wallet_address": "0x…",
  "signature": "0x…"
}
```

Response: `{ "success": true, "nodes": [ … ] }` (same node shape as below).

### `GET /api/nodes/mine`

Auth: `Node <credential>` **or** Supabase bearer (linked `owner_user_id` only).

Response: `{ "success": true, "nodes": [ … ] }`

### `GET /api/nodes/:id/status`

Auth: `Pending`, `Node`, or Supabase (owner / governance).  
Headers: `Cache-Control: no-store`. Rate limit ~1 req / 5s per credential.

Response:

```json
{
  "success": true,
  "node": {
    "id": "uuid",
    "status": "pending",
    "reason": null,
    "zerotier_node_id": "…",
    "zt_authorized": false,
    "last_seen_at": "ISO8601",
    "online": false,
    "app_version": "1.0.0"
  },
  "next_heartbeat_secs": 300
}
```

### `POST /api/nodes/:id/exchange-credential`

Auth: `Pending <token>`. Node must be `approved`.

Response: `{ "success": true, "node_credential": "octa_node_…", "next_heartbeat_secs": 300 }`

### `POST /api/nodes/:id/heartbeat`

Auth: `Node <credential>`. Node must be `approved`. Revoked nodes (including **replaced**) return **`401`** `node_revoked` as above.

### `POST /api/nodes/:id/rotate-credential`

Auth: `Node` or Supabase owner / governance.

### `POST /api/nodes/:id/revoke`

Auth: `Node` or Supabase owner / governance. Body optional `{ "reason": "…" }`. Sets `node.reason`.

### `POST /api/nodes/join-requests/:id/review`

Auth: Supabase + governance reviewer.

Request: `{ "action": "approve" | "reject", "reason": "…" }`  
If ZeroTier env missing: `{ "pending_authorization": true, "error": "zerotier_not_configured" }` without corrupting approval state.

### `GET /api/nodes/app-release`

Public. Response:

```json
{
  "success": true,
  "version": "1.0.0",
  "url": "https://…",
  "sha256": "…",
  "min_supported_version": "0.9.0"
}
```

---

## Limits & policy

- **One live row per ZeroTier ID** (`pending` or `approved`).
- **Default max 3 live nodes per wallet** (`NODE_MAX_ACTIVE_PER_WALLET`); use **replace** to swap a device at cap.
- **Governance approval** required unless `NODE_JOIN_AUTO_APPROVE=true`.
- Reviewers: dashboard admin or `user_metadata.role = network_governance`.
- **`node_events`**: append-only audit log (`replaced`, `revoked`, `zt_deauthorized`, `zt_deauth_failed`, etc.).

---

## Schema notes

Tables: `node_join_challenges`, `nodes`, `node_join_requests`, `node_heartbeats`, `node_events`.  
Future validator fields on `nodes` (nullable, default `node_class = light`): `avalanche_node_id`, `bls_public_key`, `bls_pop`.
