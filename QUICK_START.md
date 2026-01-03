# Quick Start - Create Test Accounts

## ⚠️ IMPORTANT: You need to SIGN UP first, not LOG IN!

The accounts don't exist yet. You need to create them first.

## Method 1: Sign Up via Login Page (Easiest)

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Go to Sign Up:**
   - Navigate to: `http://localhost:8080/login`
   - Click the **"Sign Up"** tab (NOT "Sign In")

3. **Create Admin Account:**
   - Email: `admin@test.com` (or any valid email format)
   - Password: `admin123456`
   - Click **"Sign Up"**
   - You should be automatically logged in and redirected to `/dashboard`

4. **Create User Account:**
   - Log out (click your account menu → Logout)
   - Go back to `/login`
   - Click **"Sign Up"** tab
   - Email: `user@test.com`
   - Password: `user123456`
   - Click **"Sign Up"**

## Method 2: Using Admin API (Requires Service Role Key)

If you have your Supabase service_role key:

1. **Get your Service Role Key:**
   - Go to: https://supabase.com/dashboard/project/agqkiwarwxrcemhspxxv/settings/api
   - Copy the **service_role** key (secret key)

2. **Run the script:**
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here npx tsx create-accounts-admin.ts
   ```

## Test Account Credentials

After creating accounts, use these to log in:

### Admin Account
- **Email:** `admin@test.com`
- **Password:** `admin123456`
- **Access:** `/admin-dashboard`

### User Account
- **Email:** `user@test.com`
- **Password:** `user123456`
- **Access:** `/dashboard`

## Troubleshooting

### "Invalid login credentials" Error
- **Cause:** Account doesn't exist yet
- **Solution:** Sign up first using the "Sign Up" tab

### "Email address is invalid" Error
- **Cause:** Supabase Auth validates email format
- **Solution:** Use a valid email format like `something@something.com`

### 406 Errors in Console
- **Cause:** Supabase Realtime connection issues
- **Solution:** These can be ignored - they don't affect functionality

