#!/usr/bin/env node
/**
 * Push Fuji contract env vars to Vercel project octa-x4en.
 * https://vercel.com/chaos-projects-54e36297/octa-x4en/settings/environment-variables
 *
 * Auto-push: VERCEL_TOKEN=... npm run vercel:env:fuji
 * Print only: npm run vercel:env:fuji
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const sandboxDir = join(root, "sandbox");
const depPath = join(sandboxDir, "deployments", "43113-latest.json");
const sandboxEnvPath = join(sandboxDir, ".env");

const VERCEL_SCOPE = process.env.VERCEL_SCOPE?.trim() || "chaos-projects-54e36297";
const VERCEL_PROJECT = process.env.VERCEL_PROJECT?.trim() || "octa-x4en";
const SETTINGS_URL = `https://vercel.com/${VERCEL_SCOPE}/${VERCEL_PROJECT}/settings/environment-variables`;

function loadSandboxEnv() {
  const env = { ...process.env };
  if (!existsSync(sandboxEnvPath)) return env;
  for (const line of readFileSync(sandboxEnvPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([^#][^=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

function runVercel(args, env, input) {
  const base = ["vercel", ...args, "--scope", VERCEL_SCOPE, "--non-interactive"];
  const token = env.VERCEL_TOKEN?.trim();
  if (token) base.push("--token", token);
  return spawnSync("npx", base, {
    cwd: root,
    env: { ...env, VERCEL_PROJECT },
    input,
    encoding: "utf8",
  });
}

if (!existsSync(depPath)) {
  console.error("Missing sandbox/deployments/43113-latest.json — run npm run sandbox:deploy:fuji first");
  process.exit(1);
}

const sandboxEnv = loadSandboxEnv();
const dep = JSON.parse(readFileSync(depPath, "utf8"));
const c = dep.contracts;
const alchemyKey =
  sandboxEnv.ALCHEMY_API_KEY ||
  process.env.ALCHEMY_API_KEY ||
  process.env.VITE_ALCHEMY_API_KEY ||
  "";

const vars = {
  VITE_CHAIN_ID: "43113",
  VITE_NETWORK_NAME: "Avalanche Fuji C-Chain",
  VITE_AVALANCHE_RPC: alchemyKey
    ? `https://avax-fuji.g.alchemy.com/v2/${alchemyKey}`
    : "https://api.avax-test.network/ext/bc/C/rpc",
  VITE_ALCHEMY_API_KEY: alchemyKey || "<ALCHEMY_API_KEY>",
  VITE_ONCHAIN_CRYPTO: "true",
  VITE_XBGL_TOKEN_ADDRESS: c.XBGLToken,
  VITE_CONTRACT_ADDRESS: c.SaraktLandV2,
  VITE_TREASURY_ADDRESS: c.SaraktTreasury,
  VITE_DIGITAL_ID_ADDRESS: c.LocalDigitalID,
  VITE_AVAX_USD_PRICE: "9.4",
  VITE_NATIVE_TOKEN: "AVAX",
};

console.log(`# Vercel project: ${VERCEL_SCOPE}/${VERCEL_PROJECT}`);
console.log(`# Settings: ${SETTINGS_URL}\n`);
console.log("# Environment variables (Production + Preview):\n");
for (const [k, v] of Object.entries(vars)) {
  console.log(`${k}=${v}`);
}

const token = process.env.VERCEL_TOKEN?.trim();
if (!token) {
  console.log("\n# CLI push unavailable (no VERCEL_TOKEN). Add vars at the settings URL above, then redeploy.");
  console.log("# Or: VERCEL_TOKEN=... npm run vercel:env:fuji");
  process.exit(0);
}

console.log("\n# Linking project and pushing env vars...");
const link = runVercel(
  ["link", "--yes", "--project", VERCEL_PROJECT],
  { ...process.env, ...sandboxEnv },
);
if (link.status !== 0) {
  console.warn("link warn:", (link.stderr || link.stdout || "").trim().slice(0, 200));
}

let ok = 0;
let fail = 0;
for (const [key, value] of Object.entries(vars)) {
  if (!value || value.includes("<")) {
    console.warn(`  skip ${key} (missing value)`);
    fail++;
    continue;
  }
  for (const target of ["production", "preview"]) {
    const r = runVercel(
      ["env", "add", key, target, "--force", "--yes", "--value", value],
      { ...process.env, ...sandboxEnv },
    );
    if (r.status !== 0) {
      console.warn(`  warn ${key} (${target}):`, (r.stderr || r.stdout || "").trim().slice(0, 160));
      fail++;
    } else {
      console.log(`  ok ${key} → ${target}`);
      ok++;
    }
  }
}

console.log(`\n# Done (${ok} ok, ${fail} issues). Redeploy: npx vercel deploy --prod --scope ${VERCEL_SCOPE}`);
