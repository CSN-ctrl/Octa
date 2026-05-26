#!/usr/bin/env node
/**
 * Activate xBGL + treasury plot registry on an existing 1337 deploy (owner key required).
 * For fresh stack use: npm run sandbox:deploy
 */
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolvePlotPrices } from "./plot-avax-pricing.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const sandboxDir = join(root, "sandbox");
const envPath = join(sandboxDir, ".env");
const depPath = join(sandboxDir, "deployments", "1337-latest.json");

function loadEnv() {
  const env = { ...process.env };
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([^#][^=]+)=(.*)$/);
      if (m) env[m[1].trim()] = m[2].trim();
    }
  }
  return env;
}

function castBin(env) {
  const home = env.USERPROFILE || env.HOME || "";
  const win = join(home, ".foundry", "bin", "cast.exe");
  if (existsSync(win)) return win;
  return "cast";
}

function castSend(args, env) {
  const r = spawnSync(castBin(env), ["send", ...args], { cwd: root, env, encoding: "utf8" });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    throw new Error(`cast send failed: ${args.join(" ")}`);
  }
  return (r.stdout || "").trim();
}

function castCall(args, env) {
  const r = spawnSync(castBin(env), ["call", ...args], { cwd: root, env, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`cast call failed`);
  return (r.stdout || "").trim();
}

/** cast prints wei with optional `[1e24]` suffix — take leading integer only */
function parseCastWei(out) {
  const head = (out || "").trim().split(/\s+/)[0];
  return BigInt(head);
}

const env = loadEnv();
const pk = env.XBGL_DEPLOYER_PRIVATE_KEY;
if (!pk) {
  console.error("Set XBGL_DEPLOYER_PRIVATE_KEY in sandbox/.env");
  process.exit(1);
}
if (!existsSync(depPath)) {
  console.error("Missing sandbox/deployments/1337-latest.json — run npm run sandbox:deploy");
  process.exit(1);
}

const dep = JSON.parse(readFileSync(depPath, "utf8"));
const rpc = dep.rpc || env.SANDBOX_RPC_URL;
const land = dep.contracts.SaraktLandV2;
const treasury = dep.contracts.SaraktTreasury;
const xbgl = dep.contracts.XBGLToken;
const prices = await resolvePlotPrices(env);
const depAvax = dep.params?.phase1PriceAVAX;
const plotPriceXbgl = env.PHASE1_PRICE_XBGL_WEI || dep.params?.phase1PriceXBGL || prices.xbglWei;
const plotPriceAvax = "0";
console.log(
  `[activate-game] land ${prices.xbglHuman} xBGL | deposit ~${prices.avaxHuman.toFixed(6)} AVAX per 100 EUR`,
);
const faucet =
  env.SANDBOX_FAUCET_ADDRESS ||
  (spawnSync(castBin(env), ["wallet", "address", pk], { encoding: "utf8" }).stdout || "").trim();

const base = ["--private-key", pk, "--rpc-url", rpc];

console.log("[activate-game] wiring xBGL + treasury on 1337");
console.log("  land:", land);
console.log("  treasury:", treasury);
console.log("  xBGL:", xbgl);

try {
  castSend([treasury, "setXbglToken(address)", xbgl, ...base], env);
  castSend([treasury, "setSupportedToken(address,bool)", xbgl, "true", ...base], env);
  castSend([treasury, "setLandContract(address)", land, ...base], env);
  castSend([land, "setPlotRegistrar(address)", treasury, ...base], env);
  castSend([land, "setUSDC(address)", xbgl, ...base], env);
  castSend([land, "setPhase1Prices(uint256,uint256)", plotPriceAvax, plotPriceXbgl, ...base], env);
  console.log(`[activate-game] prices: ${plotPriceAvax} wei AVAX, ${plotPriceXbgl} wei xBGL`);
  castSend([land, "setTreasuryRouting(address,address)", treasury, treasury, ...base], env);
  castSend([land, "toggleSales(bool)", "true", ...base], env);

  const xbglPerAvax = prices.xbglPerAvax ?? (prices.xbglHuman / prices.avaxHuman);
  const { ethers } = await import("ethers");
  const rateWei = ethers.parseEther(xbglPerAvax.toFixed(18)).toString();
  console.log(`[activate-game] setXbglPerAvax ${xbglPerAvax.toFixed(6)} (${rateWei} wei)`);
  castSend([treasury, "setXbglPerAvax(uint256)", rateWei, ...base], env);

  const treasuryBal = castCall([xbgl, "balanceOf(address)(uint256)", treasury, ...base], env);
  const treasuryBalNum = parseCastWei(treasuryBal);
  const minLiquidity = BigInt(env.SANDBOX_TREASURY_MIN_WEI || "1000000000000000000000"); // 1000 xBGL
  if (treasuryBalNum < minLiquidity) {
    const treasuryLiquidity = env.SANDBOX_TREASURY_XBGL_WEI || "1000000ether";
    console.log(`[activate-game] fund treasury ${treasuryLiquidity} xBGL (balance low)`);
    castSend([xbgl, "transfer(address,uint256)", treasury, treasuryLiquidity, ...base], env);
  } else {
    console.log(`[activate-game] treasury xBGL balance ok: ${treasuryBal.trim()}`);
  }

  const drip = env.SANDBOX_DRIP_XBGL_WEI || "10000ether";
  console.log(`[activate-game] drip ${drip} xBGL to ${faucet}`);
  castSend([xbgl, "transfer(address,uint256)", faucet, drip, ...base], env);

  console.log("[activate-game] done — update .env.local with addresses from 1337-latest.json");
} catch (e) {
  console.error(e.message);
  console.error("If contracts lack new functions, redeploy: npm run sandbox:deploy");
  process.exit(1);
}
