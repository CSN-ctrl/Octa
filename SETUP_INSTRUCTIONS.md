# Ledger Functions Setup Instructions

## ⚠️ IMPORTANT: Database Functions Not Created Yet

The 404 errors you're seeing mean the SQL functions haven't been created in your Supabase database yet.

## Steps to Fix:

### 1. Open Supabase Dashboard
- Go to https://supabase.com/dashboard
- Select your project: `agqkiwarwxrcemhspxxv`

### 2. Open SQL Editor
- Click on "SQL Editor" in the left sidebar
- Click "New Query"

### 3. Copy and Paste the SQL
- Open the file `supabase_ledger_functions.sql` in this project
- Copy ALL the contents
- Paste into the SQL Editor

### 4. Execute the SQL
- Click "Run" or press `Ctrl+Enter` (or `Cmd+Enter` on Mac)
- Wait for all functions to be created

### 5. Verify Functions Were Created
You should see success messages for:
- ✅ `get_ledger_balance` function
- ✅ `reconcile_balance` function
- ✅ All triggers (balance_change_transaction, plot_ownership_transaction, etc.)

### 6. Test
- Refresh your application
- The 404 errors should be gone
- Ledger reconciliation should work

## Quick SQL Check

If you want to verify the functions exist, run this in SQL Editor:

```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_ledger_balance', 'reconcile_balance');
```

You should see both functions listed.

## Troubleshooting

If you get errors when running the SQL:

1. **Function already exists**: The SQL uses `CREATE OR REPLACE`, so it should update existing functions
2. **Permission errors**: Make sure you're logged in as the project owner
3. **Syntax errors**: Check the SQL file for any copy/paste issues

## After Setup

Once the functions are created:
- ✅ Ledger reconciliation will work automatically
- ✅ Balance calculations will use the ledger
- ✅ All transactions will be tracked automatically

