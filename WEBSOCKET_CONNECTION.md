# Supabase WebSocket Connection ✅

The Supabase WebSocket/realtime connection has been enabled and configured.

## ✅ Configuration

### 1. **Supabase Client** (`src/integrations/supabase/client.ts`)
- **Realtime enabled**: ✅ Yes
- **Events per second**: 10
- **Heartbeat interval**: 30 seconds (keeps connection alive)
- **Auto-reconnect**: ✅ Enabled (exponential backoff, max 10s)

### 2. **CSP Configuration** (`index.html`)
- **WebSocket allowed**: ✅ `wss://*.supabase.co`
- **HTTPS allowed**: ✅ `https://*.supabase.co`

### 3. **Vite Dev Server** (`vite.config.ts`)
- **Development CSP**: ✅ Allows Supabase WebSocket connections

## 🔌 How WebSocket Works

The WebSocket connection is **automatically established** when you create a realtime subscription. The connection will:

1. **Connect automatically** when the first subscription is created
2. **Stay alive** with heartbeat every 30 seconds
3. **Reconnect automatically** if disconnected (exponential backoff)
4. **Close automatically** when all subscriptions are removed

## 📝 Usage Example

### Subscribe to Table Changes

```typescript
import { supabase } from "@/integrations/supabase/client";

// Subscribe to changes in the 'plots' table
const channel = supabase
  .channel('plots-changes')
  .on(
    'postgres_changes',
    {
      event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
      schema: 'public',
      table: 'plots',
    },
    (payload) => {
      console.log('Plot changed:', payload);
      // Update your UI here
    }
  )
  .subscribe();

// Later, when you're done:
// channel.unsubscribe();
```

### Subscribe to Specific Events

```typescript
// Only listen to INSERT events
const channel = supabase
  .channel('new-plots')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'plots',
    },
    (payload) => {
      console.log('New plot created:', payload.new);
    }
  )
  .subscribe();
```

### Subscribe with Filters

```typescript
// Only listen to changes for a specific user's plots
const channel = supabase
  .channel('my-plots')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'plots',
      filter: `owner_wallet=eq.${walletAddress}`,
    },
    (payload) => {
      console.log('My plot changed:', payload);
    }
  )
  .subscribe();
```

### Subscribe to Multiple Tables

```typescript
const channel = supabase
  .channel('multi-table-changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'plots' },
    (payload) => console.log('Plot change:', payload)
  )
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'transactions' },
    (payload) => console.log('Transaction change:', payload)
  )
  .subscribe();
```

## 🔍 Connection Status

The WebSocket connection status can be checked:

```typescript
// Check if channel is subscribed
const isSubscribed = channel.state === 'joined';

// Get connection state
const state = supabase.realtime.channels[0]?.state;
```

## ⚠️ Important Notes

1. **RLS Policies**: Realtime subscriptions respect Row Level Security (RLS) policies. Users will only receive events for data they have access to.

2. **Connection Limits**: Supabase has connection limits based on your plan. Make sure to unsubscribe from channels when components unmount.

3. **Cleanup**: Always unsubscribe when done to prevent memory leaks:

```typescript
useEffect(() => {
  const channel = supabase
    .channel('my-channel')
    .on('postgres_changes', { ... }, handler)
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}, []);
```

## 🎯 Common Use Cases

### Real-time Balance Updates

```typescript
// In WalletContext or similar
useEffect(() => {
  if (!address) return;

  const channel = supabase
    .channel(`balance-${address}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'user_balances',
        filter: `wallet_address=eq.${address}`,
      },
      (payload) => {
        // Update balance in real-time
        setBalance(payload.new.xbgl_balance);
      }
    )
    .subscribe();

  return () => channel.unsubscribe();
}, [address]);
```

### Real-time Plot Updates

```typescript
// In useLandPlots hook
useEffect(() => {
  if (!address) return;

  const channel = supabase
    .channel(`plots-${address}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'plots',
        filter: `owner_wallet=eq.${address}`,
      },
      () => {
        // Refresh plots when changes occur
        fetchLandData();
      }
    )
    .subscribe();

  return () => channel.unsubscribe();
}, [address]);
```

## ✅ Status

- **WebSocket Connection**: ✅ Enabled
- **CSP Configuration**: ✅ Fixed
- **Auto-reconnect**: ✅ Enabled
- **Build**: ✅ Successful

Your Supabase WebSocket connection is now ready to use! 🎉

