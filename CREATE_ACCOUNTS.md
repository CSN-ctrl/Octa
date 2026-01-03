# Create Test Accounts

## Option 1: Using Admin API Script (Recommended)

1. **Get your Service Role Key:**
   - Go to: https://supabase.com/dashboard/project/agqkiwarwxrcemhspxxv/settings/api
   - Copy the **service_role** key (secret key)

2. **Run the script:**
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here npx tsx create-accounts-admin.ts
   ```

   Or create a `.env` file:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```
   Then run:
   ```bash
   npx tsx create-accounts-admin.ts
   ```

## Option 2: Manual Creation via Login Page

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Create Admin Account:**
   - Go to: http://localhost:8080/login
   - Click "Sign Up" tab
   - Email: `admin@test.com` (or any format you want)
   - Password: `admin123456`
   - Click "Sign Up"
   - Note: You may need to disable email confirmation in Supabase Dashboard first

3. **Create User Account:**
   - Log out (if logged in)
   - Go to: http://localhost:8080/login
   - Click "Sign Up" tab
   - Email: `user@test.com` (or any format you want)
   - Password: `user123456`
   - Click "Sign Up"

## Option 3: Via Admin Dashboard (After creating admin account)

1. Create admin account first (using Option 1 or 2)
2. Log in as admin
3. Go to `/admin-dashboard`
4. Click "Quick Create Test User" button
5. Or use "Create Custom Account" dialog

## Test Account Credentials

### Admin Account
- **Email:** `admin@test.com`
- **Password:** `admin123456`
- **Access:** Admin Dashboard (`/admin-dashboard`)

### User Account
- **Email:** `user@test.com`
- **Password:** `user123456`
- **Access:** User Dashboard (`/dashboard`)

## Important Notes

⚠️ **Email Validation:** Supabase Auth still validates email format on the backend. If you get "invalid email" errors:
- Use a valid email format (e.g., `something@something.com`)
- Or disable email confirmation in Supabase Dashboard > Authentication > Providers > Email

