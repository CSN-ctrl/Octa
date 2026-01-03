# How to Get Your Supabase Service Role Key

## ⚠️ Important Security Note
The **service_role** key has **FULL DATABASE ACCESS** and bypasses all Row Level Security (RLS) policies. 
- **NEVER** expose it in client-side code
- **NEVER** commit it to git
- **ONLY** use it in secure server-side environments or scripts

## Steps to Get Your Service Role Key

1. **Go to Supabase Dashboard:**
   - Open: https://supabase.com/dashboard/project/agqkiwarwxrcemhspxxv/settings/api

2. **Find the Service Role Key:**
   - Scroll down to the **"Project API keys"** section
   - Look for the **"service_role"** key (it's marked as "secret")
   - Click the **"Reveal"** or **"Copy"** button next to it

3. **Add to .env file:**
   ```bash
   # Create .env file in project root
   echo "SUPABASE_SERVICE_ROLE_KEY=your_actual_key_here" > .env
   ```

4. **Run the account creation script:**
   ```bash
   npx tsx create-accounts-admin.ts
   ```

## Alternative: Set as Environment Variable

Instead of creating a .env file, you can set it directly:

```bash
export SUPABASE_SERVICE_ROLE_KEY=your_actual_key_here
npx tsx create-accounts-admin.ts
```

## After Getting the Key

Once you have the service_role key, the script will:
- ✅ Create `admin@test.com` with password `admin123456`
- ✅ Create `user@test.com` with password `user123456`
- ✅ Auto-confirm both accounts (no email verification needed)

