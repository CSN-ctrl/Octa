# ⚠️ Important: Service Role Key Required

## The Issue

The **publishable key** and **service_role key** are **NOT the same**:
- **Publishable key**: `sb_publishable_...` - Limited permissions, for client-side use
- **Service role key**: `eyJhbGci...` (JWT token) - Full database access, for Admin API

The Admin API (`auth.admin.createUser`) **requires** the service_role key. The publishable key cannot be used for this.

## Solution: Get Your Service Role Key

1. **Go to Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/agqkiwarwxrcemhspxxv/settings/api
   ```

2. **Find "service_role" key:**
   - Scroll to "Project API keys" section
   - Look for **"service_role"** (marked as "secret")
   - It's a JWT token starting with `eyJhbGci...`
   - Click "Reveal" or "Copy"

3. **Add to .env file:**
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...your_full_key_here
   ```

4. **Run the script:**
   ```bash
   npx tsx create-accounts-admin.ts
   ```

## Alternative: Use Real Email Domains

If you want to sign up through the UI without the service_role key, you must use **real email domains** that Supabase accepts:
- `admin@gmail.com`
- `user@yahoo.com`
- `test@outlook.com`

Supabase blocks test domains like `test.com`, `test.local`, `example.com`.

## Why This Happens

Supabase Auth validates email domains to prevent spam and abuse. Test domains are blocked by default. Only the Admin API (with service_role key) can bypass this validation.

