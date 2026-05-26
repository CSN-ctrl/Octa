#!/usr/bin/env node
/**
 * Print Vercel env commands for Fuji. Requires VERCEL_TOKEN + linked project.
 * Usage: VERCEL_TOKEN=... VERCEL_PROJECT=octa npm run vercel:env:fuji
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const depPath = join(root, "sandbox", "deployments", "43113-latest.json");
const alchemyKey = process.env.ALCHEMY_API_KEY || process.env.VITE_ALCHEMY_API_KEY || "";

if (!existsSync(depPath)) {
  console.error("Missing sandbox/deployments/43113-latest.json — deploy Fuji first");
  process.exit(1);
}

const dep = JSON.parse(readFileSync(depPath, "utf8"));
const c = dep.contracts;

const vars = {
  VITE_CHAIN_ID: "43113",
  VITE_NETWORK_NAME: "Avalanche Fuji",
  VITE_AVALANCHE_RPC: alchemyKey
    ? `https://avax-fuji.g.alchemy.com/v2/${alchemyKey}`
    : "https://avax-fuji.g.alchemy.com/v2/<ALCHEMY_API_KEY>",
  VITE_ALCHEMY_API_KEY: alchemyKey || "<ALCHEMY_API_KEY>",
  VITE_ONCHAIN_CRYPTO: "true",
  VITE_XBGL_TOKEN_ADDRESS: c.XBGLToken,
  VITE_CONTRACT_ADDRESS: c.SaraktLandV2,
  VITE_TREASURY_ADDRESS: c.SaraktTreasury,
  VITE_DIGITAL_ID_ADDRESS: c.LocalDigitalID,
};

console.log("# Paste into Vercel → Project → Settings → Environment Variables\n");
for (const [k, v] of Object.entries(vars)) {
  console.log(`${k}=${v}`);
}

const token = process.env.VERCEL_TOKEN?.trim();
const project = process.env.VERCEL_PROJECT?.trim();
if (!token || !project) {
  console.log("\n# To push via CLI: VERCEL_TOKEN=... VERCEL_PROJECT=your-project npm run vercel:env:fuji");
  process.exit(0);
}

console.log("\n# Pushing to Vercel (production + preview)...");
for (const [key, value] of Object.entries(vars)) {
  if (!value || value.includes("<")) continue;
  for (const target of ["production", "preview"]) {
    const r = spawnSync(
      "npx",
      ["vercel", "env", "add", key, target, "--force", "--token", token, "--scope", process.env.VERCEL_SCOPE || ""].filter(Boolean),
      { cwd: root, env: { ...process.env, VERCEL_PROJECT: project }, input: value + "\n", encoding: "utf8" },
    );
    if (r.status !== 0) {
      console.warn(`  warn: ${key} (${target}):`, (r.stderr || r.stdout || "").trim().slice(0, 120));
    } else {
      console.log(`  ok ${key} → ${target}`);
    }
  }
}
