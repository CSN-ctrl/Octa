# Migration Summary: Removing Blockchain RPC and Using Supabase Only

## Changes Made

### 1. Removed Blockchain RPC Connections
- **File**: `src/lib/wallet.ts`
  - Removed `getRpcProvider()` function
  - Removed all RPC URL constants (EVM_RPC, STARGATE_RPC, etc.)
  - Removed `checkStargateHealth()` and `isRpcAvailable()` functions
  - Kept wallet connection functionality (for signing only, no RPC needed)
  - Updated `connectWithPrivateKey()` to not use RPC provider
  - Updated `addChaosStarNetwork()` to not require RPC URL

### 2. Replaced Registry API with Supabase
- **File**: `src/lib/api.ts`
  - Removed `getRegistryApiBase()` function
  - Replaced `getRegistryStats()` to use Supabase `getPlots()` and `getTotalSupply()`
  - Replaced `getRegistryPlot()` to use Supabase `getPlotById()`
  - Replaced `getRegistryPlotsByOwner()` to use Supabase `getPlotsByOwner()`
  - Replaced `getRegistryPlots()` to use Supabase `getPlots()`
  - Replaced `getRegistryPlotsWithOwners()` to use Supabase `getPlots()`
  - Replaced `registerPlotToPortfolio()` to use Supabase `updatePlot()`
  - Updated `fetchPlots()` to use Supabase only (removed registry API and contract fallbacks)

### 3. Contract Access Removal (In Progress)
- **File**: `src/lib/contracts.ts`
  - Removed `getRpcProvider` import
  - Need to update all contract getter functions to return null/throw errors
  - Contract addresses still loaded from localStorage (will be migrated to Supabase)

### 4. localStorage Replacement (Pending)
- Need to replace localStorage usage with Supabase:
  - Contract addresses → Supabase `app_settings` table or similar
  - Wallet connection state → Supabase auth sessions (already handled)
  - Selected subnet info → Supabase user preferences
  - Digital ID cache → Supabase `digital_identities` table (already migrated)

### 5. IndexedDB Removal (Pending)
- **File**: `src/lib/local-db.ts`
  - All IndexedDB tables should be replaced with Supabase:
    - `portfolios` → Supabase `portfolios` table (already migrated)
    - `portfolioManagers` → Supabase `portfolio_managers` table (already migrated)
    - `portfolioFollowers` → Supabase `portfolio_followers` table (already migrated)
    - `automationSettings` → Supabase `automation_settings` table (already migrated)
    - `recurringPayments` → Supabase `recurring_payments` table (already migrated)
    - `marketplaceListings` → Supabase `marketplace_listings` table (already migrated)
    - `plotPurchases` → Supabase `transactions` table (already migrated)
    - `plotRegistry` → Supabase `plots` table (already migrated)

## Remaining Tasks

1. **Remove contract access from `contracts.ts`**
   - Make all contract getter functions return null or throw "Contract access disabled - using Supabase"
   - Remove all `getRpcProvider()` calls
   - Remove all `new ethers.Contract()` calls

2. **Replace localStorage with Supabase**
   - Create Supabase table for app settings (contract addresses, etc.)
   - Update all `localStorage.getItem/setItem` calls to use Supabase
   - Keep Supabase auth session storage (already handled by Supabase client)

3. **Remove IndexedDB completely**
   - Remove `src/lib/local-db.ts` file
   - Remove all imports of `local-db.ts`
   - Remove `src/lib/registry-sync.ts` (uses IndexedDB and contracts)

4. **Update all hooks**
   - Remove contract calls from hooks
   - Ensure all hooks use Supabase service functions only

5. **Update components**
   - Remove contract interactions from components
   - Remove registry API calls from components
   - Ensure all data fetching uses Supabase

## Files to Update

### High Priority
- [ ] `src/lib/contracts.ts` - Remove all contract access
- [ ] `src/lib/registry-sync.ts` - Remove (uses contracts and IndexedDB)
- [ ] `src/lib/local-db.ts` - Remove (replaced by Supabase)
- [ ] All hooks that use contracts (useContractEvents, useLandPlots, usePlotTransfer, etc.)

### Medium Priority
- [ ] Replace localStorage with Supabase in:
  - `src/lib/contracts.ts` (contract addresses)
  - `src/contexts/SubnetContext.tsx` (selected subnet)
  - `src/components/Navigation.tsx` (settings)
  - Other components using localStorage

### Low Priority
- [ ] Remove unused contract ABIs
- [ ] Clean up unused imports
- [ ] Update documentation

## Testing Checklist

- [ ] Verify all plots load from Supabase
- [ ] Verify all portfolios load from Supabase
- [ ] Verify all transactions load from Supabase
- [ ] Verify marketplace listings load from Supabase
- [ ] Verify no RPC connection errors in console
- [ ] Verify no registry API connection errors
- [ ] Verify wallet connection still works (for signing)
- [ ] Verify Supabase real-time subscriptions work

