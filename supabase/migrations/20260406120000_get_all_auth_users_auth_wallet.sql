-- Expose auth.users user_metadata wallet on admin user list (raw_user_meta_data.wallet_address).

DROP FUNCTION IF EXISTS public.get_all_auth_users();

CREATE OR REPLACE FUNCTION public.get_all_auth_users()
RETURNS TABLE (
  id uuid,
  email text,
  wallet_address text,
  auth_wallet_address text,
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
    NULLIF(btrim(u.raw_user_meta_data->>'wallet_address'), '')::text AS auth_wallet_address,
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

REVOKE ALL ON FUNCTION public.get_all_auth_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_all_auth_users() TO authenticated;
