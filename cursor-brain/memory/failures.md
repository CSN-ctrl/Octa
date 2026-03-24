# Failures — do not repeat

**ANALYZE** / **IMPROVE:** append when something went wrong.

## Entry template

```
### YYYY-MM-DD — title
- **What happened:**
- **Root cause:**
- **Fix:**
- **Prevention:**
```

## Log

### 2025-03-07 — Supabase Auth Admin from browser
- **What happened:** `AdminDashboard` called `supabase.auth.admin.*` using the **anon** client.
- **Root cause:** Admin API requires **service_role**; it must not ship in the frontend.
- **Fix (2025-03-22):** Replaced with `get_treasury_managers`, `admin_set_treasury_role*`, `get_all_auth_users` (SECURITY DEFINER + `is_dashboard_admin()`), applied via migration `admin_rpcs_part*`.
- **Prevention:** Never use `auth.admin` in Vite bundles; use RPCs or server-side admin client only.

---
