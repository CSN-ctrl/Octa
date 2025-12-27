# Error Handling Guide

## Understanding the Errors

### 1. `ERR_CONNECTION_REFUSED` for `127.0.0.1:24362`
**What it means:**
- The app is trying to connect to a local Avalanche node running on port 24362
- This is the ChaosStar Network EVM RPC endpoint
- **This is EXPECTED** when the local node isn't running

**Why it happens:**
- The app uses ethers.js providers that automatically poll the blockchain
- When the local node is down, these polling requests fail
- This is normal behavior - the app will work with Supabase even if the local node is down

**Solution:**
- These errors are now suppressed and won't break the app
- The app will use Supabase for all data operations
- Local blockchain node is optional for development

### 2. `ERR_NAME_NOT_RESOLVED` for Supabase
**What it means:**
- The Supabase URL `bhefhppvexefznjmyjok.supabase.co` cannot be resolved
- This is a DNS/network issue

**Possible causes:**
1. **Internet connection issue** - Check your internet connection
2. **DNS resolution problem** - Try using a different DNS (8.8.8.8, 1.1.1.1)
3. **Supabase project paused** - Free tier projects pause after inactivity
4. **Firewall/proxy blocking** - Corporate firewall might be blocking Supabase

**Solutions:**
1. **Check internet connection** - Make sure you're online
2. **Check Supabase project status** - Go to https://supabase.com/dashboard
3. **Restart Supabase project** - If paused, restart it in the dashboard
4. **Check DNS** - Try accessing https://bhefhppvexefznjmyjok.supabase.co directly in browser
5. **Use VPN** - If behind a firewall, try a VPN

**Current handling:**
- The app now gracefully handles Supabase connection errors
- Functions return empty arrays/null instead of crashing
- Errors are logged as debug messages (not console errors)

## How Errors Are Handled

### Supabase Errors
- Network errors (DNS, connection refused) → Return empty data, log debug message
- Other errors → Throw normally (data validation, permissions, etc.)

### RPC Errors
- Connection refused → Suppressed (expected when local node is down)
- Other RPC errors → Logged as debug messages

## Testing Without Local Node

The app is designed to work **entirely with Supabase**:
- ✅ All data operations use Supabase
- ✅ Blockchain simulation uses Supabase functions
- ✅ Real-time updates via Supabase subscriptions
- ⚠️ Local blockchain node is optional (only needed for actual contract interactions)

## Next Steps

1. **Fix Supabase connection:**
   - Check if project is paused: https://supabase.com/dashboard
   - Verify internet connection
   - Check DNS resolution

2. **Suppress RPC errors (already done):**
   - RPC connection errors are now handled gracefully
   - App continues to work even if local node is down

3. **Verify Supabase is working:**
   - Check browser console for "✓ Supabase connected" message
   - Try using the blockchain simulator at `/blockchain-test`
   - Check if data loads in the app

