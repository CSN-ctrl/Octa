-- ============================================================================
-- Phase 1 Funnel Dashboard — Reference Queries
-- Run in Supabase SQL Editor (as admin) or via psql with service_role key.
-- All monetary values in token native units (AVAX wei = 1e-18 AVAX,
-- xBGL = 18 decimals, USDC = 6 decimals).
--
-- Tables referenced:
--   auth.users              - registered users
--   public.user_wallets     - wallet connections
--   public.usdc_deposits    - USDC deposit flow
--   public.onchain_deposits - AVAX→xBGL onchain swaps
--   public.product_analytics_events - client-side event stream
--   public.user_stats       - singleton registration count cache
--
-- Requires: is_dashboard_admin() = true on the calling session.
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- 1. TOP-LINE: Funnel step counts (all time)
-- ────────────────────────────────────────────────────────────────────────────
-- Shows drop-off at each conversion gate.

SELECT
  (SELECT COUNT(*) FROM auth.users)                          AS step1_registrations,

  (SELECT COUNT(DISTINCT user_id)
     FROM public.user_wallets
    WHERE wallet_address IS NOT NULL
      AND wallet_address <> '')                              AS step2_wallet_connected,

  (SELECT COUNT(DISTINCT user_email)
     FROM public.usdc_deposits
    WHERE status IN ('confirmed', 'pending'))                AS step3_usdc_deposit_started,

  (SELECT COUNT(DISTINCT user_email)
     FROM public.usdc_deposits
    WHERE status = 'confirmed')                              AS step4_usdc_deposit_confirmed,

  (SELECT COUNT(DISTINCT lower(user_email))
     FROM public.onchain_deposits)                          AS step5_avax_swapped,

  -- Plot purchases (sourced from product_analytics_events if plot table unavailable)
  (SELECT COUNT(DISTINCT properties ->> 'plot_id')
     FROM public.product_analytics_events
    WHERE event_name = 'plot_purchased'
      AND properties ->> 'plot_id' IS NOT NULL)             AS step6_plots_purchased;


-- ────────────────────────────────────────────────────────────────────────────
-- 2. DAILY REGISTRATIONS (rolling 30 days)
-- ────────────────────────────────────────────────────────────────────────────

SELECT
  date_trunc('day', created_at AT TIME ZONE 'UTC') AS day,
  COUNT(*)                                          AS new_users
FROM auth.users
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1 DESC;


-- ────────────────────────────────────────────────────────────────────────────
-- 3. DAILY USDC DEPOSITS (rolling 30 days)
-- ────────────────────────────────────────────────────────────────────────────

SELECT
  date_trunc('day', created_at AT TIME ZONE 'UTC')  AS day,
  COUNT(*)                                           AS deposit_count,
  SUM(usdc_amount)                                   AS total_usdc,
  SUM(xbgl_amount)                                   AS total_xbgl_credited,
  COUNT(*) FILTER (WHERE status = 'confirmed')       AS confirmed_count,
  COUNT(*) FILTER (WHERE status = 'pending')         AS pending_count,
  COUNT(*) FILTER (WHERE status = 'failed')          AS failed_count
FROM public.usdc_deposits
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1 DESC;


-- ────────────────────────────────────────────────────────────────────────────
-- 4. DAILY AVAX→xBGL ON-CHAIN DEPOSITS (rolling 30 days)
-- ────────────────────────────────────────────────────────────────────────────

SELECT
  date_trunc('day', created_at AT TIME ZONE 'UTC') AS day,
  COUNT(*)                                          AS swap_count,
  COUNT(DISTINCT lower(wallet_address))             AS unique_wallets,
  SUM(avax_amount)                                  AS total_avax_in,
  SUM(xbgl_amount)                                  AS total_xbgl_out
FROM public.onchain_deposits
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY 1 DESC;


-- ────────────────────────────────────────────────────────────────────────────
-- 5. WEEKLY COHORT CONVERSION
-- Users who registered → then confirmed a deposit (within 7 days)
-- ────────────────────────────────────────────────────────────────────────────

WITH cohort AS (
  SELECT
    u.id                                           AS user_id,
    u.email,
    u.created_at                                   AS registered_at,
    date_trunc('week', u.created_at)               AS cohort_week
  FROM auth.users u
  WHERE u.created_at >= NOW() - INTERVAL '12 weeks'
),
converted AS (
  SELECT DISTINCT lower(d.user_email) AS email
  FROM public.usdc_deposits d
  WHERE d.status = 'confirmed'
)
SELECT
  c.cohort_week,
  COUNT(*)                                               AS registrations,
  COUNT(cv.email)                                        AS depositors,
  ROUND(
    100.0 * COUNT(cv.email) / NULLIF(COUNT(*), 0), 1
  )                                                      AS conversion_pct
FROM cohort c
LEFT JOIN converted cv ON lower(c.email) = cv.email
GROUP BY 1
ORDER BY 1 DESC;


-- ────────────────────────────────────────────────────────────────────────────
-- 6. DEPOSIT PIPELINE HEALTH (current status distribution)
-- ────────────────────────────────────────────────────────────────────────────

SELECT
  status,
  COUNT(*)                            AS count,
  SUM(usdc_amount)                    AS total_usdc,
  MIN(created_at)                     AS oldest,
  MAX(created_at)                     AS newest,
  -- Stuck pending > 24h is a warning signal
  COUNT(*) FILTER (
    WHERE status = 'pending'
      AND created_at < NOW() - INTERVAL '24 hours'
  )                                   AS stuck_over_24h
FROM public.usdc_deposits
GROUP BY status
ORDER BY status;


-- ────────────────────────────────────────────────────────────────────────────
-- 7. TOP DEPOSITORS (by total USDC confirmed, last 90 days)
-- ────────────────────────────────────────────────────────────────────────────

SELECT
  user_email,
  COUNT(*)                            AS deposit_count,
  SUM(usdc_amount)                    AS total_usdc,
  SUM(xbgl_amount)                    AS total_xbgl,
  MIN(created_at)                     AS first_deposit,
  MAX(created_at)                     AS last_deposit
FROM public.usdc_deposits
WHERE status = 'confirmed'
  AND created_at >= NOW() - INTERVAL '90 days'
GROUP BY user_email
ORDER BY total_usdc DESC
LIMIT 20;


-- ────────────────────────────────────────────────────────────────────────────
-- 8. PRODUCT ANALYTICS EVENT SUMMARY (last 7 days)
-- Key client-side funnel events fired from the app
-- ────────────────────────────────────────────────────────────────────────────

SELECT
  event_name,
  COUNT(*)                            AS fires,
  COUNT(DISTINCT user_id)             AS unique_users,
  MIN(created_at)                     AS first_seen,
  MAX(created_at)                     AS last_seen
FROM public.product_analytics_events
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY event_name
ORDER BY fires DESC;


-- ────────────────────────────────────────────────────────────────────────────
-- 9. DAILY ACTIVE USERS (event-based, last 30 days)
-- ────────────────────────────────────────────────────────────────────────────

SELECT
  date_trunc('day', created_at AT TIME ZONE 'UTC') AS day,
  COUNT(DISTINCT user_id)                           AS dau
FROM public.product_analytics_events
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND user_id IS NOT NULL
GROUP BY 1
ORDER BY 1 DESC;


-- ────────────────────────────────────────────────────────────────────────────
-- 10. ONCHAIN DEPOSIT FAILURES / MISSING INGEST (last 48h)
-- Transactions recorded in usdc_deposits but NOT yet in onchain_deposits
-- (AVAX→xBGL path): helps detect ingest lag.
-- ────────────────────────────────────────────────────────────────────────────

SELECT
  d.id,
  d.user_email,
  d.usdc_amount,
  d.status,
  d.created_at,
  d.tx_hash,
  d.metadata
FROM public.usdc_deposits d
WHERE d.status = 'confirmed'
  AND d.created_at >= NOW() - INTERVAL '48 hours'
  AND d.tx_hash IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.onchain_deposits od
    WHERE od.tx_hash = d.tx_hash
  )
ORDER BY d.created_at DESC;
