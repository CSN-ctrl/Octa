#!/usr/bin/env node
/**
 * Point SaraktLandV2 metadata at the Vite app (plot-preview.png via /metadata/land/{id}.json).
 * Requires contract with setMetadataURI (redeploy after contract update, or fresh sandbox:deploy).
 */
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const sandboxDir = join(root, "sandbox");
const envPath = join(sandboxDir, ".env");
const deployPath = join(sandboxDir, "deployments", "1337-latest.json");

function loadSandboxEnv() {
  if (!existsSync(envPath)) {
    console.error("Missing sandbox/.env");
    process.exit(1);
  }
  const env = { ...process.env };
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([^#][^=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

const env = loadSandboxEnv();
const rpc = env.SANDBOX_RPC_URL || "http://192.168.88.62:9650/ext/bc/C/rpc";
const chainId = env.SANDBOX_CHAIN_ID || "1337";
const metadataBase =
  env.SANDBOX_METADATA_BASE_URI || "http://localhost:8080/metadata/land/{id}.json";

let land = process.env.LAND_ADDRESS;
if (!land && existsSync(deployPath)) {
  const j = JSON.parse(readFileSync(deployPath, "utf8"));
  land = j.contracts?.SaraktLandV2;
}
if (!land) {
  console.error("Set LAND_ADDRESS or run sandbox:deploy first");
  process.exit(1);
}

const home = env.USERPROFILE || env.HOME || "";
const cast = existsSync(join(home, ".foundry", "bin", "cast.exe"))
  ? join(home, ".foundry", "bin", "cast.exe")
  : "cast";

console.log(`[sandbox] setMetadataURI on ${land}`);
console.log(`  URI: ${metadataBase}`);

const run = spawnSync(
  cast,
  [
    "send",
    land,
    `setMetadataURI(string)`,
    metadataBase,
    "--rpc-url",
    rpc,
    "--chain-id",
    chainId,
    "--private-key",
    env.XBGL_DEPLOYER_PRIVATE_KEY,
  ],
  { cwd: root, env, stdio: "inherit", shell: false }
);

process.exit(run.status ?? 1);
