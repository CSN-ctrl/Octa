# All Frontend Connections & Data Sources

This document lists all connections, APIs, and data sources used by the frontend.

**Last Updated:** After removal of Chaos Vault, Celestial Forge contract interactions, and CLI integration

---

## 1. SUPABASE (Primary Data Layer) ✅ ACTIVE

**Connection:**
- URL: `https://agqkiwarwxrcemhspxxv.supabase.co`
- Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (anon key)
- Storage: Uses `localStorage` for auth persistence
- Location: `src/integrations/supabase/client.ts`

**Tables Used:**
- `plots` - Plot ownership and metadata
- `planets` - Planet data
- `star_systems` - Star system data
- `portfolios` - User portfolios
- `transactions` - Transaction history
- `marketplace_listings` - Marketplace data
- `digital_identities` - Digital ID records
- `user_balances` - Token balances (xBGL, CHAOS, AVAX, SC)
- `portfolio_managers` - Portfolio management
- `portfolio_followers` - Portfolio following
- `recurring_payments` - Recurring payment settings
- `automation_settings` - Automation configurations
- `factions` - Faction data
- `npcs` - NPC data
- `economy_ticks` - Economy tick data
- `black_market_invites` - Black market access
- `app_settings` - Application settings

**RPC Functions:**
- `transfer_tokens` - Simulate token transfers
- `mint_tokens` - Simulate token minting
- `burn_tokens` - Simulate token burning
- `get_token_balance` - Get token balance
- `get_total_supply` - Get total token supply
- `batch_transfer_tokens` - Batch token transfers
- `approve_token_spending` - Token approval

**Real-time Subscriptions:**
- Plots changes
- Transactions
- Portfolios
- Marketplace listings
- User balances

**Service File:** `src/lib/supabase-service.ts`

---

## 2. BACKEND API (Go Backend) ⚠️ PARTIALLY ACTIVE

**Base URL:** `http://localhost:5001` (from `VITE_API_URL` env var)
**Location:** `src/lib/api.ts`, `src/lib/chaosstar-client.ts`

### Active Endpoints Still Used:

#### Contracts API:
- `GET /api/contracts/pending` - Fetch pending purchases
- `POST /api/contracts/activate` - Activate plot

#### Portfolio API:
- `GET /registry/portfolio/:wallet` - Get portfolio by wallet
- `POST /api/portfolio/project` - Project portfolio value
- `GET /api/portfolio/:wallet/loans` - Get loan eligibility

#### Accounts API:
- `GET /api/accounts` - List accounts
- `GET /api/accounts/:account_id` - Get account
- `POST /api/accounts` - Create account
- `PUT /api/accounts/:account_id` - Update account
- `DELETE /api/accounts/:account_id` - Delete account
- `POST /api/accounts/:account_id/members` - Add joint member
- `DELETE /api/accounts/:account_id/members/:member_wallet` - Remove member
- `POST /api/accounts/:account_id/business` - Create business account
- `POST /api/accounts/clusters` - Create cluster
- `GET /api/accounts/clusters` - List clusters
- `DELETE /api/accounts/clusters/:cluster_id` - Delete cluster
- `POST /api/accounts/sub-accounts` - Create sub-account
- `GET /api/accounts/:account_id/sub-accounts` - Get sub-accounts
- `DELETE /api/accounts/sub-accounts/:link_id` - Unlink sub-account

#### ChaosStar Client Endpoints (in `chaosstar-client.ts`):
- `GET /api/health` - Health check (now uses Supabase)
- `GET /api/chain-info` - Chain information
- `GET /api/contract-info` - Contract information
- `GET /api/verify-contract` - Verify contract
- `GET /api/plots/available` - Get available plots
- `GET /api/plots/owned/:address` - Get owned plots
- `GET /api/plots/:plotId` - Get plot
- `POST /api/plots/:plotId/buy` - Buy plot
- `POST /api/plots/:plotId/upgrade` - Upgrade plot
- `POST /api/plots/:plotId/transfer` - Transfer plot
- `GET /api/plots/matrix` - Get plot matrix
- `GET /api/marketplace` - Get marketplace
- `GET /api/npcs` - List NPCs
- `GET /api/npcs/:npcId` - Get NPC
- `POST /api/npcs/spawn` - Spawn NPCs
- `POST /api/npcs/:npcId/train` - Train NPC
- `POST /api/npcs/:npcId/assign` - Assign NPC
- `POST /api/npcs/:npcId/relocate` - Relocate NPC
- `POST /api/npcs/evolve` - Evolve NPC
- `GET /api/city` - List cities
- `GET /api/city/:name` - Get city
- `POST /api/city/create` - Create city
- `POST /api/city/:name/economy` - Update city economy
- `GET /api/city/:name/stats` - Get city stats
- `GET /api/economy/stats` - Get economy stats
- `GET /api/economy/prices` - Get token prices
- `POST /api/economy/swap` - Swap tokens
- `GET /api/treasury` - Get treasury
- `POST /api/treasury/deposit` - Deposit to treasury
- `POST /api/treasury/withdraw` - Withdraw from treasury
- `GET /api/balance/:address` - Get balance
- `GET /api/balance/:address/:token` - Get token balance
- `POST /api/transfer` - Transfer tokens
- `GET /api/wallet/:address/balance` - Get wallet balance
- `GET /api/governance/proposals` - List proposals
- `GET /api/governance/proposal/:id` - Get proposal
- `POST /api/governance/proposal/create` - Create proposal
- `POST /api/governance/proposal/:id/vote` - Vote on proposal
- `GET /api/portfolio/:address` - Get portfolio
- `GET /api/accounts` - List accounts
- `GET /api/accounts/:address` - Get account
- `GET /api/chaosstar/stargate/status` - Get Stargate status
- `GET /api/contracts/status` - Get contract status
- `GET /api/contracts/addresses` - Get contract addresses

### ❌ REMOVED Endpoints:

#### Celestial Forge Contract Interactions (REMOVED):
- ~~`POST /api/celestial-forge/star-systems/create`~~ - Removed (using Supabase only)
- ~~`POST /api/celestial-forge/planets/create`~~ - Removed (using Supabase only)
- ~~`GET /api/celestial-forge/subnet/:subnet_name/status`~~ - Removed
- ~~`GET /api/celestial-forge/subnets`~~ - Removed
- ~~`GET /api/celestial-forge/nodes`~~ - Removed
- ~~`POST /api/celestial-forge/star-systems/:systemId/assign-subnet`~~ - Removed
- ~~`POST /api/celestial-forge/planets/:planetId/assign-node`~~ - Removed
- ~~`POST /api/celestial-forge/planets/:planetId/assign-subnet`~~ - Removed
- ~~`POST /api/celestial-forge/subnet/:subnet_name/deploy`~~ - Removed
- ~~`POST /api/celestial-forge/subnet/:subnet_name/run`~~ - Removed
- ~~`GET /api/celestial-forge/tools-status`~~ - Removed
- ~~`GET /api/celestial-forge/stats`~~ - Removed

#### CLI Integration (REMOVED):
- ~~`GET /api/avalanche-info/subnets`~~ - Removed
- ~~`GET /api/avalanche-info/subnet/:subnet_name/describe`~~ - Removed
- ~~`GET /api/avalanche-info/network/status`~~ - Removed
- ~~`GET /api/avalanche-info/keys`~~ - Removed
- ~~`GET /api/avalanche-info/subnet/:subnet_name/stats`~~ - Removed
- ~~`GET /api/avalanche-info/keys/:key_name/balance`~~ - Removed
- ~~`GET /api/avalanche-info/keys/:key_name/addresses`~~ - Removed
- ~~`GET /api/avalanche-info/custom-subnet/info`~~ - Removed
- ~~`GET /api/avalanche-info/keys/:key_name/private-key`~~ - Removed
- ~~`GET /api/avalanche-info/wallets/balances`~~ - Removed

**Note:** Many of these endpoints are defined but may not be actively used. Most data fetching has been migrated to Supabase.

---

## 3. REGISTRY API ❌ DISABLED (Migrated to Supabase)

**Base URL:** `http://localhost:8000` (from `VITE_REGISTRY_URL` env var)
**Status:** All registry functions now use Supabase instead

**Previous Endpoints (now using Supabase):**
- `GET /registry/plots` - Now uses `supabaseService.getPlots()`
- `GET /registry/plots/:plotId` - Now uses `supabaseService.getPlotById()`
- `GET /registry/plots/owner/:address` - Now uses `supabaseService.getPlotsByOwner()`
- `GET /registry/stats` - Now uses `supabaseService.getRegistryStats()`

**Location:** `src/lib/api.ts` - All `getRegistry*` functions now call Supabase

---

## 4. RPC CONNECTIONS ❌ DISABLED

**Status:** All RPC provider creation has been removed. Wallet signers are used for signing only.

**Previous RPC URLs (no longer used):**
- `http://127.0.0.1:24362/ext/bc/.../rpc` - ChaosStar Network RPC
- `http://localhost:8545` - Stargate RPC
- `http://127.0.0.1:41773/ext/bc/.../rpc` - VM API

**Environment Variables (still defined but not used):**
- `VITE_CHAOSSTAR_RPC`
- `VITE_STARGATE_RPC`
- `VITE_AVALANCHE_RPC`

**Location:** `src/lib/wallet.ts` - RPC provider functions removed

---

## 5. EXTERNAL SERVICES

### Avalanche SDK / ChainKit
**Status:** ⚠️ PARTIALLY ACTIVE (for balance fetching fallback)

**Services:**
- `@avalanche-sdk/client` - Avalanche client (uses RPC, but RPC disabled)
- `@avalanche-sdk/chainkit` - ChainKit for indexed data (Glacier API)

**Functions:**
- `getEnhancedBalances()` - Now uses Supabase for native balance
- `getTransactionHistory()` - Uses ChainKit (if available)
- `getTokenMetadata()` - Contract calls disabled, returns null
- `getAddressAnalytics()` - Uses ChainKit
- `getNetworkMetrics()` - Uses ChainKit

**Location:** `src/lib/avalanche-sdk.ts`

**Note:** Most functions are disabled or use Supabase fallback.

### WalletConnect
**Status:** ❌ DISABLED

**Reason:** Invalid project ID
**Location:** `src/lib/wallet.ts`

---

## 6. WALLET CONNECTIONS ✅ ACTIVE

**Supported Wallets:**
- MetaMask (browser extension)
- Core Wallet (browser extension)
- Other EIP-1193 compatible wallets

**Connection Method:**
- Direct browser wallet connection (no WalletConnect)
- Uses `ethers.BrowserProvider` for signing
- No RPC provider needed (signing only)

**Network Configuration:**
- Chain ID: 8088 (0x1F98)
- Network Name: "ChaosStar Network"
- Symbol: xBGL
- Decimals: 18

**Location:** `src/lib/wallet.ts`, `src/contexts/WalletContext.tsx`

---

## 7. LOCAL STORAGE ✅ ACTIVE

**Usage:**
- Supabase auth session persistence
- Transfer history (temporary)
- Settings (migrating to Supabase)

**Location:** Various components use `localStorage.setItem()` / `localStorage.getItem()`

**Files Using localStorage:**
- `src/pages/PersonalVault.tsx` - Transfer history
- `src/integrations/supabase/client.ts` - Auth storage
- `src/components/SettingsButton.tsx` - Settings
- `src/components/Navigation.tsx` - Navigation state

**Note:** `src/pages/ChaosVault.tsx` was removed - no longer exists

---

## 8. INDEXEDDB ❌ DISABLED

**Status:** All IndexedDB usage has been removed and migrated to Supabase

**Previous Database:** `src/lib/local-db.ts` (deprecated, not used)

---

## 9. ENVIRONMENT VARIABLES

**Active Variables:**
- `VITE_API_URL` - Backend API URL (default: `http://localhost:5001`)
- `VITE_SUPABASE_URL` - Supabase URL (hardcoded in client.ts)
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key (hardcoded in client.ts)

**Unused Variables (still in code but not active):**
- `VITE_CHAOSSTAR_RPC` - RPC URL (disabled)
- `VITE_STARGATE_RPC` - Stargate RPC (disabled)
- `VITE_AVALANCHE_RPC` - Avalanche RPC (disabled)
- `VITE_CHAIN_ID` - Chain ID (hardcoded)
- `VITE_BLOCKCHAIN_ID` - Blockchain ID (hardcoded)
- `VITE_NETWORK_NAME` - Network name (hardcoded)
- `VITE_NATIVE_TOKEN` - Native token (hardcoded)
- `VITE_GLACIER_API_KEY` - Glacier API key (optional, not set)
- `VITE_REGISTRY_URL` - Registry API URL (disabled, using Supabase)

**Location:** `src/env.ts`

---

## 10. MOCK DATA / FALLBACKS

**Files with Mock Data:**
- `src/pages/NanofiberResearch.tsx` - Mock nanofiber data (no Supabase table yet)
- `src/hooks/useMockCelestialForge.ts` - Mock celestial forge data

---

## 11. REMOVED FEATURES

### ❌ Chaos Vault (REMOVED)
- **File:** `src/pages/ChaosVault.tsx` - Deleted
- **Route:** `/chaos-vault` - Removed from `App.tsx`
- **Navigation:** Removed from `SidebarNavigation.tsx`
- **Reason:** Not needed at the moment

### ❌ Celestial Forge Contract Interactions (REMOVED)
- **Functions Removed from `src/lib/api.ts`:**
  - `spawnStarSystem()` - Backend API call removed (using Supabase only)
  - `spawnPlanet()` - Backend API call removed (using Supabase only)
  - `getSubnetStatus()` - Removed
  - `listCelestialForgeSubnets()` - Removed
  - `listCelestialForgeNodes()` - Removed
  - `assignSubnetToStarSystem()` - Removed
  - `assignNodeToPlanet()` - Removed
  - `assignSubnetAndNodeToPlanet()` - Removed
  - `deploySubnet()` - Removed
  - `runSubnet()` - Removed
  - `getForgeToolsStatus()` - Removed
  - `getCelestialForgeStats()` - Removed

- **Note:** `useCelestialForge` hook still has `spawnStarSystem` and `spawnPlanet` functions, but they now use Supabase directly instead of backend API

### ❌ CLI Integration (REMOVED)
- **Functions Removed from `src/lib/api.ts`:**
  - `listChaosStarSubnets()` - Removed
  - `describeChaosStarSubnet()` - Removed
  - `getChaosStarNetworkStatus()` - Removed
  - `listChaosStarKeys()` - Removed
  - `getSubnetStats()` - Removed
  - `getKeyBalance()` - Removed
  - `getKeyAddresses()` - Removed
  - `getCustomSubnetInfo()` - Removed
  - `getKeyPrivateKey()` - Removed
  - `getAllWalletBalances()` - Removed

- **Files Updated:**
  - `src/contexts/AccountManagementContext.tsx` - Removed CLI key loading
  - `src/pages/PlotPurchase.tsx` - Removed "key" wallet type option
  - `src/pages/FinancialHub.tsx` - Removed CLI key references
  - `src/components/KeysManager.tsx` - Disabled (returns empty data)

---

## SUMMARY

### ✅ ACTIVE CONNECTIONS:
1. **Supabase** - Primary data layer (all CRUD operations)
2. **Backend API** - Some endpoints still used (contracts, accounts, portfolio)
3. **Wallet Connections** - Browser wallet extensions (MetaMask, Core, etc.)
4. **Local Storage** - Auth persistence, temporary data

### ❌ DISABLED/REMOVED CONNECTIONS:
1. **RPC Providers** - All blockchain RPC connections removed
2. **Registry API** - Migrated to Supabase
3. **IndexedDB** - Migrated to Supabase
4. **WalletConnect** - Disabled (invalid project ID)
5. **Chaos Vault** - Page and route removed
6. **Celestial Forge Contract Interactions** - Backend API calls removed (using Supabase only)
7. **CLI Integration** - All CLI key and subnet management removed

### ⚠️ PARTIALLY ACTIVE:
1. **Backend API** - Many endpoints defined but not actively used
2. **Avalanche SDK** - Some functions disabled, others use Supabase fallback

---

## RECOMMENDATIONS

1. **Migrate remaining backend API calls to Supabase:**
   - Contracts API (`/api/contracts/*`)
   - Portfolio API (`/api/portfolio/*`)
   - Accounts API (`/api/accounts/*`)

2. **Remove unused backend API client code:**
   - `src/lib/chaosstar-client.ts` - Many unused endpoints
   - `src/lib/api.ts` - Clean up unused functions

3. **Create Supabase tables for:**
   - Nanofiber research data
   - Document generation
   - Other features currently using mocks

4. **Environment Variables:**
   - Remove unused RPC-related env vars
   - Move Supabase credentials to env vars (currently hardcoded)

---

## BACKEND API ENDPOINTS SUMMARY

### Still Active:
- **Contracts:** `/api/contracts/pending`, `/api/contracts/activate`
- **Portfolio:** `/api/portfolio/project`, `/api/portfolio/:wallet/loans`, `/registry/portfolio/:wallet`
- **Accounts:** `/api/accounts/*` (full CRUD + clusters + sub-accounts)
- **ChaosStar Client:** Various endpoints in `chaosstar-client.ts` (many may be unused)

### Removed:
- **Celestial Forge:** All `/api/celestial-forge/*` contract interaction endpoints
- **CLI Integration:** All `/api/avalanche-info/*` endpoints
