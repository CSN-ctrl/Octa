# USDC Deposit System Setup Guide

## Overview

The deposit system allows users to deposit USDC from multiple blockchain networks (Ethereum, Avalanche, Polygon, BSC, Arbitrum, Optimism, Base) and automatically receive xBGL credits in their account.

## Setup Steps

### 1. Database Setup

Run the SQL schema file in your Supabase SQL Editor:

```bash
# Execute: supabase_deposit_schema.sql
```

This creates:
- `exchange_rates` table - Stores USDC → xBGL conversion rates
- `hot_wallets` table - Stores hot wallet addresses per network
- `usdc_deposits` table - Tracks all deposits and their status

### 2. Configure Hot Wallet Addresses

You need to set hot wallet addresses for each network you want to support. You can do this via:

**Option A: Supabase Dashboard**
- Go to `hot_wallets` table
- Insert rows with `network_id` and `address` for each network

**Option B: Admin Dashboard (Future)**
- Add UI in AdminDashboard to configure hot wallets

**Example:**
```sql
INSERT INTO hot_wallets (network_id, address, is_active)
VALUES 
  ('ethereum', '0xYourEthereumHotWalletAddress', true),
  ('avalanche', '0xYourAvalancheHotWalletAddress', true),
  ('polygon', '0xYourPolygonHotWalletAddress', true);
```

### 3. Set Exchange Rate

The default rate is 1 USDC = 1 xBGL. To update:

```sql
UPDATE exchange_rates 
SET rate = 1.0, updated_at = NOW()
WHERE from_token = 'USDC' AND to_token = 'xBGL';
```

Or use the `updateExchangeRate` function in `src/lib/exchange-rates.ts`.

## How It Works

### User Flow

1. **User visits `/deposit` page**
   - Sees current xBGL balance
   - Sees exchange rate (USDC → xBGL)
   - Selects a network (Ethereum, Avalanche, etc.)

2. **User sees payment details**
   - Hot wallet address for selected network
   - QR code for easy scanning
   - Payment instructions

3. **User sends USDC**
   - Sends USDC from their wallet to the hot wallet address
   - Gets transaction hash

4. **User submits transaction hash**
   - Enters USDC amount and transaction hash
   - System verifies payment
   - xBGL is automatically credited

5. **Automatic crediting**
   - When deposit status changes to "confirmed"
   - Database trigger automatically credits xBGL to user balance
   - Transaction record is created

### Payment Verification

Currently, users manually submit transaction hashes. Future enhancements:

- **Automatic detection**: Poll blockchain for USDC transfers to hot wallets
- **Webhook integration**: Listen for payment events from blockchain explorers
- **Indexer integration**: Use The Graph or similar for real-time payment detection

## Files Created

### Core Files
- `src/pages/Deposit.tsx` - Main deposit page
- `src/components/payment/MultiNetworkUSDCPayment.tsx` - Network selector & payment UI
- `src/hooks/useUSDCDeposit.ts` - Deposit logic & state management

### Utility Files
- `src/lib/networks.ts` - Network configurations (Ethereum, Avalanche, etc.)
- `src/lib/exchange-rates.ts` - Exchange rate management
- `src/lib/hot-wallet.ts` - Hot wallet address management

### Database
- `supabase_deposit_schema.sql` - Database schema and triggers

## Features

✅ Multi-network support (8 major networks)
✅ QR code generation for easy payment
✅ Real-time exchange rate display
✅ Automatic xBGL crediting via database trigger
✅ Deposit history tracking
✅ Transaction hash submission
✅ Status tracking (pending, confirmed, failed)

## Security Considerations

1. **Hot Wallet Security**
   - Use a dedicated hot wallet (not your main wallet)
   - Consider multi-sig for large amounts
   - Regular transfers to cold storage

2. **Rate Limiting**
   - Consider adding rate limits for deposit submissions
   - Verify transaction hashes before crediting

3. **Amount Validation**
   - Verify USDC amount matches transaction
   - Check transaction actually sent to hot wallet
   - Validate network matches transaction

## Future Enhancements

1. **Automatic Payment Detection**
   - Integrate with blockchain indexers
   - Real-time payment monitoring
   - Automatic verification

2. **Admin Dashboard**
   - Configure hot wallet addresses
   - Update exchange rates
   - View all deposits
   - Manual deposit verification

3. **Payment Limits**
   - Minimum/maximum deposit amounts
   - Daily deposit limits per user
   - KYC requirements for large deposits

4. **Notifications**
   - Email confirmation on deposit
   - Real-time balance updates
   - Deposit status notifications

## Testing

1. Set up test hot wallet addresses
2. Use testnet networks for testing
3. Submit test transactions
4. Verify xBGL crediting works
5. Check deposit history updates

## Troubleshooting

**Issue: Hot wallet addresses not showing**
- Check `hot_wallets` table has entries
- Verify `is_active = true`
- Check RLS policies allow public read

**Issue: Exchange rate not updating**
- Check `exchange_rates` table has USDC → xBGL entry
- Verify RLS policies allow read

**Issue: Deposits not crediting**
- Check deposit status is "confirmed"
- Verify database trigger is active
- Check `user_balances` table updates
- Review transaction records

**Issue: QR codes not generating**
- Verify `qrcode` package is installed
- Check browser console for errors
- Ensure hot wallet addresses are valid

## Support

For issues or questions, check:
- Database logs in Supabase dashboard
- Browser console for frontend errors
- Transaction records in `usdc_deposits` table
