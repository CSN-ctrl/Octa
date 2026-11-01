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
| `NODE_MAX_ACTIVE_PER_WALLET` | No | Default `3` (pending + approved count) |
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

**Never trust `wallet_address` without EIP-191 verification or a valid Node credential.**

Challenge **purpose** (`join` | `lookup`) is in the signed message so lookup proofs cannot be replayed as join.

---

## EIP-191 message format (exact)

Lines joined with `\n` (UTF-8). Title depends on purpose.

**Join (`Purpose: join`):**

```
Octa Personal Node Join Request

Organization: Octa Investment Group
Product: Sarakt Personal Node
Purpose: join
Wallet: <lowercase 0x address>
ZeroTier Node ID: <10 hex chars>
Platform: android|web|desktop
App Version: <string>
Nonce: <32 hex chars>
Issued At: <ISO8601 UTC>
Expires At: <ISO8601 UTC>
```

**Lookup (`Purpose: lookup`):** same block with title `Octa Personal Node Wallet Lookup`, `Purpose: lookup`, and ZeroTier Node ID `0000000000` on the challenge row.

Verification: `ethers.verifyMessage(message, signature)` / EIP-191 personal_sign (MetaMask, in-app Rust secp256k1, WalletConnect later).

### Rust / MetaMask test vector

| Field | Value |
|-------|--------|
| Private key (Hardhat #0, **test only**) | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbe14826f6940f7a06973522` |
| Wallet in message | `0xf39fd6e51aad88f6f4ce6ab68212777de7f926b` |
| ZeroTier Node ID | `a1b2c3d4e5` |
| Platform | `android` |
| App Version | `1.0.0-test` |
| Nonce | `0123456789abcdef0123456789abcdef` |
| Issued At | `2026-06-01T12:00:00.000Z` |
| Expires At | `2026-06-01T12:10:00.000Z` |
| Expected signature | `0x58ba850eb857275c54c34d9ef4cc0eff9fc24469876c1a9d5b4f83add0c26f38385012a47577653c2d947dec04732c3cb79c71ea4eee0e4e4748a3a6a10a948c1b` |

Full message body (copy verbatim):

```
Octa Personal Node Join Request

Organization: Octa Investment Group
Product: Sarakt Personal Node
Purpose: join
Wallet: 0xf39fd6e51aad88f6f4ce6ab68212777de7f926b
ZeroTier Node ID: a1b2c3d4e5
Platform: android
App Version: 1.0.0-test
Nonce: 0123456789abcdef0123456789abcdef
Issued At: 2026-06-01T12:00:00.000Z
Expires At: 2026-06-01T12:10:00.000Z
```

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
  "purpose": "join"
}
```

Lookup: `"purpose": "lookup"` (omit or placeholder ZT id; server stores `0000000000`).

Response `201`:

```json
{
  "success": true,
  "challenge_id": "uuid",
  "nonce": "…",
  "message": "Octa Personal Node…",
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

Auth: `Node <credential>`. Node must be `approved`.

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
- **Default max 3 live nodes per wallet** (`NODE_MAX_ACTIVE_PER_WALLET`).
- **Governance approval** required unless `NODE_JOIN_AUTO_APPROVE=true`.
- Reviewers: dashboard admin or `user_metadata.role = network_governance`.

---

## Schema notes

Tables: `node_join_challenges`, `nodes`, `node_join_requests`, `node_heartbeats`.  
Future validator fields on `nodes` (nullable, default `node_class = light`): `avalanche_node_id`, `bls_public_key`, `bls_pop`.
