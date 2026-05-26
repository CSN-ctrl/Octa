#!/usr/bin/env node
/**
 * Deploy all game contracts to Avalanche 1337.
 * Reads canonical xBGL address from ChaosStar (env/json) for lineage only.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveChaosstarXbglAddress } from "./fetch-chaosstar-xbgl.mjs";
import { resolvePlotPrices } from "./plot-avax-pricing.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const sandboxDir = join(root, "sandbox");
const envPath = join(sandboxDir, ".env");

function loadSandboxEnv() {
  if (!existsSync(envPath)) {
    console.error("Missing sandbox/.env — copy sandbox/.env.example and set XBGL_DEPLOYER_PRIVATE_KEY");
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

const env = loadSandboxEnv();
const rpc = env.SANDBOX_RPC_URL || "http://192.168.88.62:9650/ext/bc/C/rpc";
const chainId = env.SANDBOX_CHAIN_ID || "1337";
const forge = forgeBin(env);

const chaosRef = await resolveChaosstarXbglAddress(env);
if (chaosRef) {
  env.CHAOSSTAR_XBGL_ADDRESS = chaosRef;
}

console.log(`[sandbox] deploy → ${rpc} chain ${chainId}`);
if (chaosRef) {
  console.log(`[sandbox] ChaosStar xBGL reference (8888): ${chaosRef}`);
}

const prices = await resolvePlotPrices(env);
env.PHASE1_PRICE_XBGL_WEI = prices.xbglWei;
env.PHASE1_PRICE_AVAX_WEI = "0";
console.log(
  `[sandbox] plot ${prices.plotEur} EUR → ${prices.xbglHuman} xBGL (land). Deposit: ~${prices.avaxHuman.toFixed(6)} AVAX per plot via AVAX→xBGL (AVAX/USD=${prices.avaxUsd})`,
);

const run = spawnSync(
  forge,
  [
    "script",
    "script/DeployLocalAvax.s.sol",
    "--rpc-url",
    rpc,
    "--broadcast",
    "--chain-id",
    chainId,
    "-vv",
  ],
  { cwd: root, env, stdio: "inherit", shell: false }
);

if (run.status !== 0) process.exit(run.status ?? 1);

const broadcastPath = join(root, "broadcast", "DeployLocalAvax.s.sol", chainId, "run-latest.json");
if (!existsSync(broadcastPath)) {
  console.warn("[sandbox] deploy ok but no broadcast file to parse");
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
  rpc,
  deployedAt: new Date().toISOString().slice(0, 10),
  script: "DeployLocalAvax.s.sol",
  deployer: env.SANDBOX_DEPLOYER || created.DeployLocalAvax || null,
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
    salesActive: true,
  },
};

const deployDir = join(sandboxDir, "deployments");
mkdirSync(deployDir, { recursive: true });
const outPath = join(deployDir, `${chainId}-latest.json`);
writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n");
console.log(`[sandbox] wrote ${outPath}`);

const publicDir = join(root, "public", "sandbox", "deployments");
mkdirSync(publicDir, { recursive: true });
const publicPath = join(publicDir, `${chainId}-latest.json`);
copyFileSync(outPath, publicPath);
console.log(`[sandbox] copied → ${publicPath}`);

if (out.contracts.XBGLToken) {
  console.log("\n[sandbox] Add to .env.local:");
  console.log(`VITE_XBGL_TOKEN_ADDRESS=${out.contracts.XBGLToken}`);
  console.log(`VITE_CONTRACT_ADDRESS=${out.contracts.SaraktLandV2}`);
  console.log(`VITE_TREASURY_ADDRESS=${out.contracts.SaraktTreasury}`);
  console.log(`VITE_DIGITAL_ID_ADDRESS=${out.contracts.LocalDigitalID}`);
}
