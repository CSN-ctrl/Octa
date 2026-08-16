#!/usr/bin/env node
/**
 * Deploy full game contract stack to Avalanche Fuji (43113).
 * Uses DeployFuji.s.sol (chain-id gated) → DeployLocalAvax hardening path.
 *
 * Defaults after hardening:
 *   - SALES_ACTIVE=false (enable later via Safe toggleSales)
 *   - requireDigitalID remains false (enforced in Solidity deploy)
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveChaosstarXbglAddress } from "./fetch-chaosstar-xbgl.mjs";
import { resolvePlotPrices } from "./plot-avax-pricing.mjs";

const FUJI_CHAIN_ID = "43113";
const DEFAULT_FUJI_METADATA = "https://www.sarakt.com/metadata/land/{id}.json";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const sandboxDir = join(root, "sandbox");
const envPath = join(sandboxDir, ".env");

function loadSandboxEnv() {
  if (!existsSync(envPath)) {
    console.error(
      "Missing sandbox/.env — copy sandbox/.env.example and set ALCHEMY_API_KEY + FUJI_PRIVATE_KEY",
    );
    process.exit(1);
  }
  const env = { ...process.env };
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([^#][^=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

function forgeBin(env) {
  const home = env.USERPROFILE || env.HOME || "";
  const win = join(home, ".foundry", "bin", "forge.exe");
  if (existsSync(win)) return win;
  return "forge";
}

function resolveFujiRpc(env) {
  if (env.FUJI_RPC_URL?.trim()) return env.FUJI_RPC_URL.trim();
  const key = env.ALCHEMY_API_KEY?.trim();
  if (!key) {
    console.error("Set ALCHEMY_API_KEY or FUJI_RPC_URL in sandbox/.env");
    process.exit(1);
  }
  return `https://avax-fuji.g.alchemy.com/v2/${key}`;
}

function resolveDeployerKey(env) {
  const pk = env.FUJI_PRIVATE_KEY?.trim() || env.XBGL_DEPLOYER_PRIVATE_KEY?.trim();
  if (!pk) {
    console.error("Set FUJI_PRIVATE_KEY in sandbox/.env (deployer needs Fuji test AVAX for gas)");
    process.exit(1);
  }
  return pk;
}

function parseBool(v, fallback) {
  if (v === undefined || v === null || String(v).trim() === "") return fallback;
  const s = String(v).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(s)) return true;
  if (["0", "false", "no", "off"].includes(s)) return false;
  return fallback;
}

const env = loadSandboxEnv();
const rpc = resolveFujiRpc(env);
const chainId = FUJI_CHAIN_ID;
const forge = forgeBin(env);
const deployerKey = resolveDeployerKey(env);
const salesActive = parseBool(env.SALES_ACTIVE, false);

env.XBGL_DEPLOYER_PRIVATE_KEY = deployerKey;
env.SANDBOX_CHAIN_ID = chainId;
env.SALES_ACTIVE = salesActive ? "true" : "false";
env.SANDBOX_METADATA_BASE_URI =
  env.SANDBOX_METADATA_BASE_URI?.trim() || DEFAULT_FUJI_METADATA;

const chaosRef = await resolveChaosstarXbglAddress(env);
if (chaosRef) {
  env.CHAOSSTAR_XBGL_ADDRESS = chaosRef;
}

console.log(`[fuji] deploy → ${rpc.replace(/\/v2\/[^/]+$/, "/v2/***")} chain ${chainId}`);
console.log(`[fuji] SALES_ACTIVE=${salesActive} (requireDigitalID stays false)`);

const verify = spawnSync("cast", ["chain-id", "--rpc-url", rpc], {
  cwd: root,
  env,
  encoding: "utf8",
  shell: false,
});
if (verify.status !== 0 || verify.stdout?.trim() !== FUJI_CHAIN_ID) {
  console.error("[fuji] RPC chain-id mismatch — expected 43113, got:", verify.stdout?.trim());
  process.exit(1);
}

const prices = await resolvePlotPrices(env);
env.PHASE1_PRICE_XBGL_WEI = prices.xbglWei;
env.PHASE1_PRICE_AVAX_WEI = "0";
console.log(
  `[fuji] plot ${prices.plotEur} EUR → ${prices.xbglHuman} xBGL; metadata ${env.SANDBOX_METADATA_BASE_URI}`,
);

const run = spawnSync(
  forge,
  [
    "script",
    "script/DeployFuji.s.sol:DeployFuji",
    "--rpc-url",
    rpc,
    "--broadcast",
    "--chain-id",
    chainId,
    "-vv",
  ],
  { cwd: root, env, stdio: "inherit", shell: false },
);

if (run.status !== 0) process.exit(run.status ?? 1);

const broadcastCandidates = [
  join(root, "broadcast", "DeployFuji.s.sol", chainId, "run-latest.json"),
  join(root, "broadcast", "DeployLocalAvax.s.sol", chainId, "run-latest.json"),
];
const broadcastPath = broadcastCandidates.find((p) => existsSync(p));
if (!broadcastPath) {
  console.warn("[fuji] deploy ok but no broadcast file to parse");
  process.exit(0);
}

const broadcast = JSON.parse(readFileSync(broadcastPath, "utf8"));
const created = {};
for (const tx of broadcast.transactions || []) {
  if (tx.contractAddress) {
    const name = tx.contractName || tx.contractAddress;
    created[name] = tx.contractAddress;
  }
}

const out = {
  chainId: Number(chainId),
  rpc: rpc.replace(/\/v2\/[^/]+$/, "/v2/<ALCHEMY_API_KEY>"),
  deployedAt: new Date().toISOString().slice(0, 10),
  script: "DeployFuji.s.sol",
  network: "avalanche-fuji",
  hardened: true,
  ownable2Step: true,
  pausable: true,
  requireDigitalID: false,
  deployer: env.SANDBOX_DEPLOYER || null,
  chaosstarXbglReference: chaosRef || null,
  chaosstarChainId: 8888,
  contracts: {
    SaraktLandV2: created.SaraktLandV2,
    XBGLToken: created.XBGLToken,
    ReserveMintController: created.ReserveMintController,
    SaraktTreasury: created.SaraktTreasury,
    LocalDigitalID: created.LocalDigitalID,
  },
  params: {
    phase1PriceXBGL: env.PHASE1_PRICE_XBGL_WEI || prices.xbglWei,
    phase1PriceAVAX: "0",
    depositAvaxPerPlotEur100: prices.avaxWei,
    plotPriceEur: prices.plotEur,
    eurToXbgl: "1.955833",
    avaxUsdUsed: prices.avaxUsd,
    eurToUsdcUsed: prices.eurToUsdc,
    salesActive,
    metadataBaseUri: env.SANDBOX_METADATA_BASE_URI,
  },
};

const deployDir = join(sandboxDir, "deployments");
mkdirSync(deployDir, { recursive: true });
const outPath = join(deployDir, `${chainId}-latest.json`);
writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
console.log(`[fuji] wrote ${outPath}`);

const publicDir = join(root, "public", "sandbox", "deployments");
mkdirSync(publicDir, { recursive: true });
copyFileSync(outPath, join(publicDir, `${chainId}-latest.json`));
console.log(`[fuji] copied → public/sandbox/deployments/${chainId}-latest.json`);

// Keep public/addresses.json in sync (canonical Fuji map)
const addrPath = join(root, "public", "addresses.json");
writeFileSync(
  addrPath,
  JSON.stringify(
    {
      _source: "sandbox/deployments/43113-latest.json",
      chainId: 43113,
      network: "avalanche-fuji",
      land: out.contracts.SaraktLandV2 || "",
      xbglToken: out.contracts.XBGLToken || "",
      treasury: out.contracts.SaraktTreasury || "",
      digitalID: out.contracts.LocalDigitalID || "",
      metadataBaseUri: out.params.metadataBaseUri,
    },
    null,
    2,
  ) + "\n",
);
console.log(`[fuji] synced ${addrPath}`);

if (out.contracts.XBGLToken) {
  console.log("\n[fuji] Next steps:");
  console.log("  1. npm run sandbox:verify:fuji");
  console.log("  2. Create Fuji Safe (2-of-3) → set SAFE_ADDRESS in sandbox/.env");
  console.log("  3. DRY_RUN=1 npm run sandbox:transfer:safe");
  console.log("  4. npm run sandbox:transfer:safe  (then Safe acceptOwnership)");
  console.log("  5. Safe: setXbglPerAvax + toggleSales(true) when ready");
  console.log("  6. Update Vercel/.env.production addresses + indexer start blocks");
  console.log("\n[fuji] Env snippet:");
  console.log("VITE_CHAIN_ID=43113");
  console.log(`VITE_XBGL_TOKEN_ADDRESS=${out.contracts.XBGLToken}`);
  console.log(`VITE_CONTRACT_ADDRESS=${out.contracts.SaraktLandV2}`);
  console.log(`VITE_TREASURY_ADDRESS=${out.contracts.SaraktTreasury}`);
  console.log(`VITE_DIGITAL_ID_ADDRESS=${out.contracts.LocalDigitalID}`);
}
