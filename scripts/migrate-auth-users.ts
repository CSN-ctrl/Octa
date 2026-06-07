/**
 * Copy Auth users from a legacy Supabase project to the MCP / canonical project.
 *
 * Passwords cannot be read from the source project. Each migrated user gets a random
 * password; they should use "Forgot password" on the new app URL to set a new one.
 *
 * Env (after loading .env / .env.local):
 *   MIGRATE_SOURCE_URL              default: https://zfzsiykutsgkurmetprw.supabase.co (legacy)
 *   MIGRATE_SOURCE_SERVICE_ROLE_KEY default: SUPABASE_SERVICE_ROLE_KEY
 *   MIGRATE_TARGET_URL              default: DEFAULT_SUPABASE_URL from src/config (agqki… octa)
 *   MIGRATE_TARGET_SERVICE_ROLE_KEY **required** unless same as source (unlikely across projects)
 *
 * Run:
 *   MIGRATE_TARGET_SERVICE_ROLE_KEY=<agqki service_role> npx tsx scripts/migrate-auth-users.ts
 */
import { createClient, type User } from "@supabase/supabase-js";
import { randomBytes } from "crypto";
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
const sourceKey =
  process.env.MIGRATE_SOURCE_SERVICE_ROLE_KEY?.trim() ||
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const targetUrl = process.env.MIGRATE_TARGET_URL?.trim() || DEFAULT_SUPABASE_URL;
const targetKeyExplicit = process.env.MIGRATE_TARGET_SERVICE_ROLE_KEY?.trim();
const targetKey =
  targetKeyExplicit ||
  (sourceUrl === targetUrl ? process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() : undefined);

if (!sourceKey) {
  console.error("Set MIGRATE_SOURCE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY (source project).");
  process.exit(1);
}
if (!targetKey) {
  console.error(
    "Cross-project migration: set MIGRATE_TARGET_SERVICE_ROLE_KEY for the target project:\n" +
      `  ${targetUrl}\n` +
      "Dashboard → Settings → API → service_role (secret)."
  );
  process.exit(1);
}
if (sourceUrl === targetUrl) {
  console.error("Source and target URL are identical; nothing to migrate.");
  process.exit(1);
}

const sourceAdmin = createClient(sourceUrl, sourceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const targetAdmin = createClient(targetUrl, targetKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function listAllUsers(): Promise<User[]> {
  const all: User[] = [];
  let page = 1;
  for (;;) {
    const { data, error } = await sourceAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    all.push(...data.users);
    if (data.users.length < 200) break;
    page += 1;
  }
  return all;
}

function randomPassword(): string {
  return randomBytes(24).toString("base64url") + "Aa1!";
}

async function main() {
  console.log("Source:", sourceUrl);
  console.log("Target:", targetUrl);
  console.log("");

  const users = await listAllUsers();
  const withEmail = users.filter((u) => u.email);
  console.log(`Fetched ${users.length} users (${withEmail.length} with email).\n`);

  const migrated: string[] = [];
  const skipped: string[] = [];
  const failed: { email: string; message: string }[] = [];

  for (const u of withEmail) {
    const email = u.email as string;
    const password = randomPassword();
    const { data, error } = await targetAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: u.user_metadata ?? {},
      app_metadata: u.app_metadata ?? {},
    });

    if (error) {
      const msg = error.message || String(error);
      if (/already been registered|already exists|duplicate/i.test(msg)) {
        skipped.push(email);
      } else {
        failed.push({ email, message: msg });
      }
      continue;
    }
    if (data.user) migrated.push(email);
  }

  console.log("--- Result ---");
  console.log(`Migrated: ${migrated.length}`);
  migrated.forEach((e) => console.log(`  + ${e}`));
  console.log(`Skipped (already in target): ${skipped.length}`);
  skipped.forEach((e) => console.log(`  = ${e}`));
  console.log(`Failed: ${failed.length}`);
  failed.forEach((f) => console.log(`  ! ${f.email}: ${f.message}`));
  console.log(
    "\nUsers must reset password on the new project (passwords were not copied from the old database)."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
