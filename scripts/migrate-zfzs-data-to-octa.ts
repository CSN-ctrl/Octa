/**
 * Copy public-table rows from Sarakt-final (zfzs) → octa (agqki).
 *
 * Prerequisites:
 *   1. Schema catch-up applied on octa (migration 20260608120000_zfzs_to_octa_schema_catchup)
 *   2. Auth users migrated: npx tsx scripts/migrate-auth-users.ts
 *
 * Env (.env.local — never commit service_role keys):
 *   MIGRATE_SOURCE_URL              default: https://zfzsiykutsgkurmetprw.supabase.co
 *   MIGRATE_SOURCE_SERVICE_ROLE_KEY required (zfzs service_role)
 *   MIGRATE_TARGET_URL              default: DEFAULT_SUPABASE_URL (agqki…)
 *   MIGRATE_TARGET_SERVICE_ROLE_KEY required (octa service_role)
 *   MIGRATE_DRY_RUN=true            log only, no writes
 *   MIGRATE_TABLES=plots,transactions  optional comma subset
 *
 * Run:
 *   MIGRATE_SOURCE_SERVICE_ROLE_KEY=... MIGRATE_TARGET_SERVICE_ROLE_KEY=... \\
 *     npx tsx scripts/migrate-zfzs-data-to-octa.ts
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { DEFAULT_SUPABASE_URL } from "../src/config/supabase-project-defaults";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

for (const f of [join(root, ".env"), join(root, ".env.local")]) {
  if (!existsSync(f)) continue;
  readFileSync(f, "utf-8").split("\n").forEach((line) => {
    const t = line.trim();
    if (!t || t.startsWith("#")) return;
    const i = t.indexOf("=");
    if (i <= 0) return;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  });
}

const sourceUrl =
  process.env.MIGRATE_SOURCE_URL?.trim() || "https://zfzsiykutsgkurmetprw.supabase.co";
const targetUrl = process.env.MIGRATE_TARGET_URL?.trim() || DEFAULT_SUPABASE_URL;
const sourceKey = process.env.MIGRATE_SOURCE_SERVICE_ROLE_KEY?.trim();
const targetKey = process.env.MIGRATE_TARGET_SERVICE_ROLE_KEY?.trim();
const dryRun = /^true|1|yes$/i.test(process.env.MIGRATE_DRY_RUN?.trim() || "");

/** FK-safe order; tables missing on source are skipped. */
const DEFAULT_TABLE_ORDER = [
  "star_systems",
  "planets",
  "ilo_phases",
  "plots",
  "cities",
  "ownership_registry",
  "user_balances",
  "digital_identities",
  "affiliates",
  "user_affiliate_codes",
  "affiliate_referrals",
  "ilo_stats",
  "ilo_participants",
  "genesis_stats",
  "genesis_prizes",
  "exchange_rates",
  "hot_wallets",
  "usdc_deposits",
  "onchain_deposits",
  "plot_purchases",
  "plot_fractional_shares",
  "plot_documents",
  "transactions",
  "marketplace_listings",
  "portfolios",
  "portfolio_managers",
  "portfolio_followers",
  "recurring_payments",
  "automation_settings",
  "factions",
  "npcs",
  "economy_ticks",
  "black_market_invites",
  "user_stats",
  "social_media_verifications",
  "expert_applications",
  "treasury_ingest_checkpoints",
  "treasury_ingest_failures",
] as const;

const tables = process.env.MIGRATE_TABLES
  ? process.env.MIGRATE_TABLES.split(",").map((t) => t.trim()).filter(Boolean)
  : [...DEFAULT_TABLE_ORDER];

if (!sourceKey || !targetKey) {
  console.error(
    "Set MIGRATE_SOURCE_SERVICE_ROLE_KEY (zfzs) and MIGRATE_TARGET_SERVICE_ROLE_KEY (octa)."
  );
  process.exit(1);
}

const source = createClient(sourceUrl, sourceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const target = createClient(targetUrl, targetKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function fetchAll(client: SupabaseClient, table: string): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  const pageSize = 500;
  let from = 0;
  for (;;) {
    const { data, error } = await client
      .from(table)
      .select("*")
      .range(from, from + pageSize - 1);
    if (error) {
      if (/does not exist|schema cache/i.test(error.message)) return [];
      throw new Error(`${table} read: ${error.message}`);
    }
    if (!data?.length) break;
    rows.push(...(data as Record<string, unknown>[]));
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

async function upsertBatch(
  client: SupabaseClient,
  table: string,
  rows: Record<string, unknown>[]
): Promise<{ inserted: number; error?: string }> {
  if (!rows.length) return { inserted: 0 };
  const chunk = 200;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += chunk) {
    const slice = rows.slice(i, i + chunk);
    const { error } = await client.from(table).upsert(slice, { onConflict: "id", ignoreDuplicates: false });
    if (error) {
      const { error: insErr } = await client.from(table).insert(slice);
      if (insErr) return { inserted, error: insErr.message };
    }
    inserted += slice.length;
  }
  return { inserted };
}

async function upsertByNaturalKey(
  client: SupabaseClient,
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string
): Promise<{ inserted: number; error?: string }> {
  if (!rows.length) return { inserted: 0 };
  const chunk = 200;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += chunk) {
    const slice = rows.slice(i, i + chunk);
    const { error } = await client.from(table).upsert(slice, { onConflict, ignoreDuplicates: false });
    if (error) return { inserted, error: error.message };
    inserted += slice.length;
  }
  return { inserted };
}

const NATURAL_KEY: Record<string, string> = {
  star_systems: "id",
  planets: "id",
  ilo_phases: "phase_name",
  plots: "id",
  ownership_registry: "wallet_address",
  user_balances: "wallet_address",
  affiliates: "wallet_address",
  ilo_participants: "wallet_address",
  genesis_stats: "id",
  exchange_rates: "from_token,to_token",
  hot_wallets: "network_id",
  treasury_ingest_checkpoints: "chain_id",
  transactions: "tx_hash",
};

async function migrateTable(table: string): Promise<void> {
  const rows = await fetchAll(source, table);
  if (!rows.length) {
    console.log(`  ${table}: 0 rows (skip)`);
    return;
  }
  console.log(`  ${table}: ${rows.length} rows`);
  if (dryRun) return;

  const conflict = NATURAL_KEY[table] ?? "id";
  const result =
    conflict === "id" && rows[0]?.id !== undefined
      ? await upsertBatch(target, table, rows)
      : await upsertByNaturalKey(target, table, rows, conflict);

  if (result.error) {
    console.error(`    ! failed: ${result.error}`);
  } else {
    console.log(`    ✓ upserted ${result.inserted}`);
  }
}

async function remapUserWallets(): Promise<void> {
  const rows = await fetchAll(source, "user_wallets");
  if (!rows.length) {
    console.log("  user_wallets: 0 rows (skip)");
    return;
  }
  console.log(`  user_wallets: ${rows.length} rows (remap user_id by email)`);

  const [{ data: srcUsers }, { data: tgtUsers }] = await Promise.all([
    source.auth.admin.listUsers({ perPage: 1000 }),
    target.auth.admin.listUsers({ perPage: 1000 }),
  ]);
  const srcById = new Map((srcUsers?.users ?? []).map((u) => [u.id, u.email?.toLowerCase()]));
  const tgtByEmail = new Map(
    (tgtUsers?.users ?? []).filter((u) => u.email).map((u) => [u.email!.toLowerCase(), u.id])
  );

  const remapped = rows
    .map((r) => {
      const oldId = r.user_id as string;
      const email = srcById.get(oldId);
      const newId = email ? tgtByEmail.get(email) : undefined;
      if (!newId) return null;
      return { ...r, user_id: newId };
    })
    .filter(Boolean) as Record<string, unknown>[];

  console.log(`    remapped ${remapped.length}/${rows.length}`);
  if (dryRun || !remapped.length) return;

  const { error } = await target.from("user_wallets").upsert(remapped, {
    onConflict: "user_id,wallet_address",
  });
  if (error) console.error(`    ! user_wallets: ${error.message}`);
  else console.log("    ✓ user_wallets upserted");
}

async function main() {
  console.log("Source:", sourceUrl);
  console.log("Target:", targetUrl);
  console.log("Dry run:", dryRun);
  console.log("");

  for (const table of tables) {
    if (table === "user_wallets") continue;
    await migrateTable(table);
  }
  await remapUserWallets();

  console.log("\nDone. Verify row counts in octa dashboard, then point Vercel at agqki.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
