/**
 * Set the same new password for every user in the target Supabase Auth project.
 * Use only for dev / migration follow-up; prefer per-user reset in production.
 *
 * Requires:
 *   BULK_RESET_PASSWORD   — new password (min 10 chars recommended)
 *   ZFZS_SERVICE_ROLE_KEY (recommended) — service_role for zfzs if .env still has the legacy key
 *   SUPABASE_SERVICE_ROLE_KEY — fallback service_role (must match SUPABASE_URL project)
 *   SUPABASE_URL (optional) — default: DEFAULT_SUPABASE_URL (zfzs MCP project)
 *
 * Run:
 *   ZFZS_SERVICE_ROLE_KEY='eyJ...' BULK_RESET_PASSWORD='YourStrongPass!9' npx tsx scripts/bulk-reset-auth-passwords.ts
 */
import { createClient } from "@supabase/supabase-js";
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

const password = process.env.BULK_RESET_PASSWORD?.trim();
const url =
  process.env.SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL;
const key =
  process.env.ZFZS_SERVICE_ROLE_KEY?.trim() ||
  process.env.MIGRATE_TARGET_SERVICE_ROLE_KEY?.trim() ||
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!password || password.length < 8) {
  console.error("Set BULK_RESET_PASSWORD (at least 8 characters).");
  process.exit(1);
}
if (!key) {
  console.error(
    "Set ZFZS_SERVICE_ROLE_KEY (or MIGRATE_TARGET_SERVICE_ROLE_KEY) for project zfzs,\n" +
      "or SUPABASE_SERVICE_ROLE_KEY if it matches SUPABASE_URL."
  );
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const users: { id: string; email?: string }[] = [];
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    for (const u of data.users) {
      if (u.email) users.push({ id: u.id, email: u.email });
    }
    if (data.users.length < 200) break;
    page += 1;
  }

  console.log(`Target: ${url}`);
  console.log(`Users with email: ${users.length}\n`);

  let ok = 0;
  const failed: { email: string; message: string }[] = [];

  for (const u of users) {
    const { error } = await admin.auth.admin.updateUserById(u.id, { password });
    if (error) failed.push({ email: u.email!, message: error.message });
    else ok += 1;
  }

  console.log(`Updated: ${ok}`);
  failed.forEach((f) => console.error(`Failed ${f.email}: ${f.message}`));
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
