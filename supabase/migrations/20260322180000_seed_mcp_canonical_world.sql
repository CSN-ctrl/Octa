-- Canonical Sarakt world + ILO genesis phase + starter plots (MCP-linked project zfzsiykutsgkurmetprw).
-- IDs must stay in sync with src/config/world-ids.ts

INSERT INTO star_systems (id, name, owner_wallet, subnet_id, status, planets, chain_id, tribute_percent)
VALUES (
  '00000000-0000-4000-8000-000000000001'::uuid,
  'Sarakt Star System',
  '0x0000000000000000000000000000000000000000',
  'ChaosStarNetwork',
  'active',
  ARRAY['sarakt-prime', 'zythera']::text[],
  8088,
  0
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  owner_wallet = EXCLUDED.owner_wallet,
  subnet_id = EXCLUDED.subnet_id,
  status = EXCLUDED.status,
  planets = EXCLUDED.planets,
  chain_id = EXCLUDED.chain_id,
  tribute_percent = EXCLUDED.tribute_percent,
  updated_at = NOW();

INSERT INTO planets (id, name, owner_wallet, star_system_id, planet_type, node_type, status)
VALUES
  (
    '00000000-0000-4000-8000-000000000011'::uuid,
    'Sarakt Prime',
    '0x0000000000000000000000000000000000000000',
    '00000000-0000-4000-8000-000000000001'::uuid,
    'sarakt-prime',
    'master',
    'active'
  ),
  (
    '00000000-0000-4000-8000-000000000012'::uuid,
    'Zythera',
    '0x0000000000000000000000000000000000000000',
    '00000000-0000-4000-8000-000000000001'::uuid,
    'gas-giant',
    'validator',
    'active'
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  owner_wallet = EXCLUDED.owner_wallet,
  star_system_id = EXCLUDED.star_system_id,
  planet_type = EXCLUDED.planet_type,
  node_type = EXCLUDED.node_type,
  status = EXCLUDED.status,
  updated_at = NOW();

INSERT INTO ilo_phases (
  id,
  phase_name,
  phase_status,
  max_participants,
  current_participants,
  plot_price_eur,
  plot_price_usdc,
  plot_price_xbgl,
  secondary_market_active
)
VALUES (
  '00000000-0000-4000-8000-000000000021'::uuid,
  'genesis',
  'active',
  10000,
  0,
  100,
  110,
  50,
  false
)
ON CONFLICT (phase_name) DO UPDATE SET
  phase_status = EXCLUDED.phase_status,
  max_participants = EXCLUDED.max_participants,
  current_participants = COALESCE(ilo_phases.current_participants, 0),
  plot_price_eur = EXCLUDED.plot_price_eur,
  plot_price_usdc = EXCLUDED.plot_price_usdc,
  plot_price_xbgl = EXCLUDED.plot_price_xbgl,
  updated_at = NOW();

-- Starter grid on Sarakt Prime (only if none exist for that planet)
INSERT INTO plots (coord_x, coord_y, planet_id, zone_type, building_stage, booking_status)
SELECT
  (g.n % 25)::numeric - 12,
  (g.n / 25)::numeric - 10,
  '00000000-0000-4000-8000-000000000011'::uuid,
  CASE
    WHEN g.n <= 100 THEN 'Central District'
    WHEN g.n <= 300 THEN 'Inner Ring - Commercial'
    ELSE 'Residential Zone'
  END,
  0,
  'available'
FROM generate_series(1, 500) AS g(n)
WHERE NOT EXISTS (
  SELECT 1 FROM plots p
  WHERE p.planet_id = '00000000-0000-4000-8000-000000000011'::uuid
  LIMIT 1
);
