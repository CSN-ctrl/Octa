/**
 * List auth users for a Supabase project (Admin API).
 * Usage: npx tsx scripts/list-auth-users.ts [project_url]
 * Default URL: previous project ref (agqkiwarwxrcemhspxxv).
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env (must be for that same project).
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

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

const url =
  process.argv[2]?.trim() ||
  process.env.SUPABASE_LIST_USERS_URL?.trim() ||
  "https://agqkiwarwxrcemhspxxv.supabase.co";

const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!key) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let page = 1;
const all: { id: string; email?: string; created_at: string; last_sign_in_at?: string | null }[] = [];
for (;;) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  for (const u of data.users) {
    all.push({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
    });
  }
  if (data.users.length < 200) break;
  page += 1;
}

console.log(`Project: ${url}`);
console.log(`Count: ${all.length}\n`);
console.log(JSON.stringify(all, null, 2));
