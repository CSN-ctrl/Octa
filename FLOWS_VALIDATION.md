# Flows validation: balances, transfers, deposits, documents

Use this to verify core flows and run sanity checks in Supabase (SQL Editor or MCP).

---

## 1. User deposits (USDC → xBGL)

**Flow:**
1. User visits `/deposit`, sees hot wallet address(es) from `hot_wallets` (or fallback).
2. User sends USDC on-chain to that address.
3. Credit happens via **Admin Dashboard**: Treasury tab → **Check All Wallets** or **Process DB Deposits**.
   - `processIncomingDeposits()` (AdminDashboard) fetches incoming txs (Alchemy or Supabase), converts USDC→xBGL via `exchange_rates`, then updates `user_balances` and inserts `transactions` (type `deposit` / `deposit_converted`).
4. Optional: `useUSDCDeposit.submitTransactionHash()` (hook in `hooks/useUSDCDeposit.ts`) can credit by tx hash; it is **not** currently wired in the Deposit page UI.

**SQL checks:**
```sql
-- Hot wallets (deposit addresses)
SELECT * FROM hot_wallets WHERE is_active = true;

-- Exchange rate USDC → xBGL (used for deposit conversion)
SELECT * FROM exchange_rates WHERE from_token = 'EUR' AND to_token = 'USDC';

-- Recent deposit-related transactions
SELECT id, from_address, to_address, amount, token_type, transaction_type, created_at
FROM transactions
WHERE transaction_type IN ('deposit', 'deposit_converted')
ORDER BY created_at DESC
LIMIT 20;

-- User balances (spot-check a user by email or wallet)
SELECT wallet_address, xbgl_balance, last_synced FROM user_balances
WHERE wallet_address = 'user@example.com' OR wallet_address = '0x...';
```

**Manual test:**
1. Ensure `hot_wallets` has at least one row per network.
2. Run **Process DB Deposits** (or **Check All Wallets**) in Admin → Treasury.
3. Confirm `user_balances.xbgl_balance` and `transactions` rows for the credited user.

---

## 2. User transfers (Dashboard → Send xBGL)

**Flow:**
1. User is on `/dashboard` → Transfers section.
2. Enters amount and recipient (wallet or email).
3. `handleTransfer` calls `supabaseService.transferTokens(from, to, amount, 'xBGL', txHash, metadata)`.
4. Backend: RPC `transfer_tokens` updates `user_balances` and inserts into `transactions` atomically.

**SQL checks:**
```sql
-- RPC exists
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'transfer_tokens';

-- Recent user transfers
SELECT id, from_address, to_address, amount, transaction_type, status, created_at
FROM transactions
WHERE transaction_type = 'transfer'
ORDER BY created_at DESC
LIMIT 20;
```

**Manual test:**
1. From Dashboard → Transfers, send a small amount to another user (email or wallet).
2. Check both users’ balances in `user_balances` and new row in `transactions`.

---

## 3. Admin treasury transfer

**Flow:**
1. Admin Dashboard → Treasury tab → **Transfer Funds**.
2. Select user (dropdown by email/wallet), enter amount.
3. Code: ensures treasury row exists and has sufficient balance, then updates `user_balances` (treasury minus, recipient plus) and inserts `transactions` with `transaction_type = 'treasury_transfer'`.
4. Treasury balance is read from `user_balances` where `wallet_address = TREASURY_WALLET` (0x96DDab023A0e95E61A976B1A2fC98d7aB4901C33).

**SQL checks:**
```sql
-- Treasury balance
SELECT wallet_address, xbgl_balance, last_synced
FROM user_balances
WHERE wallet_address = '0x96ddab023a0e95e61a976b1a2fc98d7ab4901c33';

-- Recent treasury transfers
SELECT id, from_address, to_address, amount, transaction_type, metadata->>'recipient_email', created_at
FROM transactions
WHERE transaction_type = 'treasury_transfer'
ORDER BY created_at DESC
LIMIT 20;
```

**Manual test:**
1. In Admin → Treasury, run **Transfer from Treasury** to a test user.
2. Confirm treasury balance decreased and recipient `user_balances.xbgl_balance` increased; new `treasury_transfer` row in `transactions`.

**If treasury balance is negative or stuck:** Run in SQL Editor (or use MCP `execute_sql`):
```sql
-- Force treasury balance to 1 million xBGL
INSERT INTO user_balances (wallet_address, xbgl_balance, avax_balance, chaos_balance, sc_balance)
VALUES ('0x96ddab023a0e95e61a976b1a2fc98d7ab4901c33', 1000000, 0, 0, 0)
ON CONFLICT (wallet_address) DO UPDATE SET xbgl_balance = 1000000;
```

---

## 4. Document generation (plot certificates)

**Flow:**
1. **Auto certificate:** Dashboard plot card → Generate Certificate → `generatePlotCertificate()` + `uploadCertificateToStorage()` in `lib/plot-documents.ts`. PDF is uploaded to storage bucket `plot-certificates` and URL (+ optional `pdfBytes` on fallback) is returned; record in `plot_documents`.
2. **Title certificate:** PlotDocumentUpload dialog uses template PDF, fills data, uploads to same bucket, inserts `plot_documents`.

**Prerequisites:**
- Storage bucket exists. If not, run `supabase_plot_certificates_storage.sql` in SQL Editor.

**SQL checks:**
```sql
-- Storage bucket (run once if missing)
INSERT INTO storage.buckets (id, name, public)
VALUES ('plot-certificates', 'plot-certificates', true)
ON CONFLICT (id) DO NOTHING;

-- Recent plot documents
SELECT id, plot_id, owner_wallet, document_type, document_url, filename, created_at
FROM plot_documents
ORDER BY created_at DESC
LIMIT 20;
```

**Manual test:**
1. From Dashboard, open a plot → Generate Certificate (or Generate Title Certificate via document upload).
2. Confirm file downloads and, if bucket is configured, a new row in `plot_documents` and object in `plot-certificates` bucket.

---

## 5. Quick balance reconciliation

If balances look wrong, run (replace identifier with email or wallet):

```sql
-- Ledger-style sum for one user (if you have a view or function)
-- Otherwise just spot-check:
SELECT wallet_address, xbgl_balance, chaos_balance, avax_balance, sc_balance, last_synced
FROM user_balances
ORDER BY last_synced DESC NULLS LAST
LIMIT 50;
```

Using the app: Admin can use **Reconcile Ledger** in Treasury for a given wallet; it calls `supabaseService.reconcileBalance(identifier)` (RPC `reconcile_balance` if available).

---

## Summary

| Flow                 | Trigger                    | Backend / table usage                    |
|----------------------|----------------------------|------------------------------------------|
| User deposit         | Admin: Check/Process deposits | `user_balances`, `transactions`, `usdc_deposits` (optional) |
| User transfer        | Dashboard Transfers        | RPC `transfer_tokens` → `user_balances`, `transactions` |
| Treasury transfer    | Admin: Transfer Funds      | `user_balances`, `transactions`          |
| Plot certificate     | Dashboard plot actions     | `storage.plot-certificates`, `plot_documents` |

Run the SQL blocks above in Supabase SQL Editor (or via MCP `execute_sql`) to validate data after testing each flow.
