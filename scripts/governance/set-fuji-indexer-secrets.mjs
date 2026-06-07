#!/usr/bin/env node
/**
 * Set Fuji indexer edge-function secrets on Supabase project octa.
 * Requires: SUPABASE_ACCESS_TOKEN (or `supabase login`) and linked project.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=... node scripts/governance/set-fuji-indexer-secrets.mjs
 *   ALCHEMY_API_KEY=... SUPABASE_ACCESS_TOKEN=... node scripts/governance/set-fuji-indexer-secrets.mjs
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PROJECT_REF = "agqkiwarwxrcemhspxxv";
const DEPLOY_BLOCK = "55878103";

const secrets = {
  FUJI_START_BLOCK: DEPLOY_BLOCK,
  FUJI_LAND_START_BLOCK: DEPLOY_BLOCK,
  FUJI_DEPOSIT_CONFIRMATIONS: "3",
};

const alchemy = process.env.ALCHEMY_API_KEY?.trim();
if (alchemy) secrets.ALCHEMY_API_KEY = alchemy;

function run(args) {
  return spawnSync("npx", ["supabase", ...args], {
    cwd: root,
    encoding: "utf8",
    env: process.env,
  });
}

const link = run(["link", "--project-ref", PROJECT_REF, "--yes"]);
if (link.status !== 0) {
  console.error("supabase link failed:", (link.stderr || link.stdout || "").trim());
  process.exit(1);
}

for (const [key, value] of Object.entries(secrets)) {
  const r = run(["secrets", "set", `${key}=${value}`, "--project-ref", PROJECT_REF]);
  if (r.status !== 0) {
    console.error(`failed ${key}:`, (r.stderr || r.stdout || "").trim());
    process.exit(1);
  }
  console.log(`ok ${key}`);
}

console.log("\nDone. Redeploy edge functions if needed.");
