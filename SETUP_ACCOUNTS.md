# 🚀 Quick Setup: Create Test Accounts

## ⚠️ The service_role key cannot be retrieved via MCP (security feature)

You need to get it manually from the Supabase Dashboard.

## Step 1: Get Your Service Role Key

1. **Open this URL:**
   ```
   https://supabase.com/dashboard/project/agqkiwarwxrcemhspxxv/settings/api
   ```

2. **Find "service_role" key:**
   - Scroll to "Project API keys" section
   - Look for **"service_role"** (marked as "secret")
   - Click **"Reveal"** or **"Copy"**

3. **Copy the entire key** (it's a long JWT token)

## Step 2: Create .env File

Create a `.env` file in the project root:

```bash
# In your terminal, run:
echo 'SUPABASE_SERVICE_ROLE_KEY=paste_your_key_here' > .env
```

Or manually create `.env` with:
```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Step 3: Run the Script

```bash
npx tsx create-accounts-admin.ts
```

## What This Will Create

✅ **Admin Account:**
- Email: `admin@test.com`
- Password: `admin123456`
- Access: `/admin-dashboard`

✅ **User Account:**
- Email: `user@test.com`
- Password: `user123456`
- Access: `/dashboard`

## Alternative: Set Environment Variable Directly

If you don't want to create a .env file:

```bash
export SUPABASE_SERVICE_ROLE_KEY=your_key_here
npx tsx create-accounts-admin.ts
```

## Security Note

⚠️ **NEVER commit the .env file to git!** It contains sensitive credentials.

The `.env` file should already be in `.gitignore`, but double-check to be safe.

