# ⚠️ IMPORTANT: Email Validation Issue

Supabase Auth is **rejecting test email domains** like `test.com`, `test.local`, and `example.com`.

## Solution: Use Admin API with Service Role Key

The **only way** to create accounts with test emails is using the Admin API with your service_role key.

### Step 1: Get Your Service Role Key

1. Go to: https://supabase.com/dashboard/project/agqkiwarwxrcemhspxxv/settings/api
2. Find the **"service_role"** key (secret key)
3. Copy it

### Step 2: Run the Script

```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here npx tsx create-accounts-admin.ts
```

This will create:
- **Admin:** `admin@test.com` / `admin123456`
- **User:** `user@test.com` / `user123456`

## Alternative: Use Real Email Domains

If you want to sign up through the UI, you must use a **real email domain** that Supabase accepts, such as:
- `admin@gmail.com`
- `user@yahoo.com`
- `test@outlook.com`
- Any real email service domain

## About the 406 Errors

The 406 errors for `user_balances` queries are likely due to:
- Missing or incorrect API headers
- Query format issues
- These can be ignored for now - they don't affect account creation

