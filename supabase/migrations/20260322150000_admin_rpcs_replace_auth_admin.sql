-- Replace browser auth.admin.* with SECURITY DEFINER RPCs (dashboard admins only).
-- Matches loose admin heuristic used elsewhere (email pattern + metadata role).

CREATE OR REPLACE FUNCTION public.is_dashboard_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
    AND (
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
      OR (auth.jwt() -> 'user_metadata' ->> 'treasury_role') = 'admin'
      OR (
        (auth.jwt() ->> 'email') IS NOT NULL
        AND (
          lower(auth.jwt() ->> 'email') IN ('admin@test.com', 'admin@example.com', 'test@test.com')
          OR (auth.jwt() ->> 'email') ILIKE '%admin%'
        )
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.get_all_auth_users()
RETURNS TABLE (
  id uuid,
  email text,
  wallet_address text,
  account_name text,
  plots_count bigint,
  portfolios_count bigint,
  xbgl_balance numeric,
  avax_balance numeric,
  chaos_balance numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_dashboard_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text AS email,
    COALESCE(orr.wallet_address::text, u.email::text) AS wallet_address,
    di.name::text AS account_name,
    (
      SELECT COUNT(*)::bigint FROM public.plots p
      WHERE lower(p.owner_wallet) = lower(COALESCE(orr.wallet_address::text, u.email::text))
    ) AS plots_count,
    (
      SELECT COUNT(*)::bigint FROM public.portfolios pf
      WHERE lower(pf.owner_wallet) = lower(COALESCE(orr.wallet_address::text, u.email::text))
    ) AS portfolios_count,
    COALESCE(ub.xbgl_balance, 0)::numeric,
    COALESCE(ub.avax_balance, 0)::numeric,
    COALESCE(ub.chaos_balance, 0)::numeric
  FROM auth.users u
  LEFT JOIN LATERAL (
    SELECT o.wallet_address
    FROM public.ownership_registry o
    WHERE lower(o.email) = lower(u.email::text)
    ORDER BY o.updated_at DESC NULLS LAST
    LIMIT 1
  ) orr ON true
  LEFT JOIN public.digital_identities di
    ON orr.wallet_address IS NOT NULL AND lower(di.wallet_address) = lower(orr.wallet_address)
  LEFT JOIN public.user_balances ub
    ON lower(ub.wallet_address) = lower(COALESCE(orr.wallet_address::text, u.email::text))
  ORDER BY u.created_at DESC NULLS LAST;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_treasury_managers()
RETURNS TABLE (
  id uuid,
  email text,
  user_metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.is_dashboard_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT u.id, u.email::text, u.raw_user_meta_data
  FROM auth.users u
  WHERE (u.raw_user_meta_data->>'treasury_role') IN ('manager', 'admin')
     OR (u.raw_user_meta_data->>'role') = 'admin';
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_treasury_role(p_user_id uuid, p_treasury_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  meta jsonb;
BEGIN
  IF NOT public.is_dashboard_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT raw_user_meta_data INTO meta FROM auth.users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'user not found';
  END IF;

  IF p_treasury_role IS NULL OR btrim(p_treasury_role) = '' THEN
    meta := COALESCE(meta, '{}'::jsonb) - 'treasury_role';
  ELSE
    IF lower(btrim(p_treasury_role)) NOT IN ('manager', 'admin') THEN
      RAISE EXCEPTION 'invalid treasury_role';
    END IF;
    meta := jsonb_set(COALESCE(meta, '{}'::jsonb), '{treasury_role}', to_jsonb(btrim(p_treasury_role)), true);
  END IF;

  UPDATE auth.users SET raw_user_meta_data = meta, updated_at = now() WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_treasury_role_by_email(p_email text, p_treasury_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  uid uuid;
BEGIN
  IF NOT public.is_dashboard_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  SELECT id INTO uid FROM auth.users WHERE lower(email) = lower(trim(p_email));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'user not found';
  END IF;

  PERFORM public.admin_set_treasury_role(uid, p_treasury_role);
END;
$$;

REVOKE ALL ON FUNCTION public.is_dashboard_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_all_auth_users() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_treasury_managers() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_treasury_role(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_treasury_role_by_email(text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_all_auth_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_treasury_managers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_treasury_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_treasury_role_by_email(text, text) TO authenticated;
