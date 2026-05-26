#!/usr/bin/env node
/**
 * Fuji on-chain smoke: set AVAX→xBGL rate, deposit AVAX, buy plot with xBGL.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadDeployment, loadSandboxEnv, resolvePrivateKey, resolveRpc } from "./deployment-utils.mjs";
import { resolvePlotPrices } from "./plot-avax-pricing.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const sandboxDir = join(root, "sandbox");
const envPath = join(sandboxDir, ".env");

function castBin(env) {
  const home = env.USERPROFILE || env.HOME || "";
  const win = join(home, ".foundry", "bin", "cast.exe");
  if (existsSync(win)) return win;
  return "cast";
}

function cast(args, env) {
  const r = spawnSync(castBin(env), args, { cwd: root, env, encoding: "utf8" });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    throw new Error(`cast failed: ${args.join(" ")}`);
  }
  return (r.stdout || "").trim();
}

function parseWei(out) {
  return BigInt((out || "").trim().split(/\s+/)[0]);
}

const env = loadSandboxEnv(envPath);
env.SANDBOX_CHAIN_ID = env.SANDBOX_CHAIN_ID || "43113";
const pk = resolvePrivateKey(env);
if (!pk) {
  console.error("Set FUJI_PRIVATE_KEY in sandbox/.env");
  process.exit(1);
}

const { data: dep } = loadDeployment(sandboxDir, env);
const rpc = resolveRpc(env, dep);
const land = dep.contracts.SaraktLandV2;
const treasury = dep.contracts.SaraktTreasury;
const xbgl = dep.contracts.XBGLToken;
const plotId = env.SANDBOX_SMOKE_PLOT_ID || "42";
const base = ["--private-key", pk, "--rpc-url", rpc];
const prices = await resolvePlotPrices(env);
const plotPriceXbgl = dep.params?.phase1PriceXBGL || prices.xbglWei;
const xbglPerAvax = prices.xbglPerAvax ?? prices.xbglHuman / prices.avaxHuman;
const { ethers } = await import("ethers");
const rateWei = ethers.parseEther(xbglPerAvax.toFixed(18)).toString();
const depositAvax = env.SANDBOX_SMOKE_DEPOSIT_AVAX || "0.15";
const depositWei = ethers.parseEther(depositAvax).toString();

console.log("[fuji-smoke] chain", dep.chainId);
console.log("  land:", land);
console.log("  treasury:", treasury);
console.log("  xBGL:", xbgl);

const currentRate = parseWei(cast(["call", treasury, "xbglPerAvaxE18()(uint256)", "--rpc-url", rpc], env));
if (currentRate === 0n) {
  console.log(`  setXbglPerAvax ${xbglPerAvax.toFixed(6)} xBGL/AVAX`);
  cast(["send", treasury, "setXbglPerAvax(uint256)", rateWei, ...base], env);
} else {
  console.log("  xbglPerAvaxE18 already set:", currentRate.toString());
}

const xbglBefore = parseWei(cast(["call", xbgl, "balanceOf(address)(uint256)", env.SANDBOX_DEPLOYER || cast(["wallet", "address", pk], env), "--rpc-url", rpc], env));
const wallet = cast(["wallet", "address", pk], env);
console.log(`  depositAvaxForXbgl ${depositAvax} AVAX from ${wallet}`);
const quote = parseWei(
  cast(["call", treasury, "quoteXbglForAvax(uint256)(uint256)", depositWei, "--rpc-url", rpc], env),
);
console.log("  quoted xBGL out:", ethers.formatEther(quote));
cast(["send", treasury, "depositAvaxForXbgl(uint256)", "0", ...base, "--value", depositWei], env);

const xbglAfter = parseWei(cast(["call", xbgl, "balanceOf(address)(uint256)", wallet, "--rpc-url", rpc], env));
console.log("  xBGL balance:", ethers.formatEther(xbglAfter));

const minted = cast(["call", land, "plotMinted(uint256)(bool)", plotId, "--rpc-url", rpc], env);
if (minted === "true") {
  console.log(`  plot ${plotId} already minted — smoke deposit ok`);
  process.exit(0);
}

const price = parseWei(plotPriceXbgl);
if (xbglAfter < price) {
  console.error(`  need ${ethers.formatEther(price)} xBGL for plot; have ${ethers.formatEther(xbglAfter)}`);
  process.exit(1);
}

console.log(`  approve + buyPlotWithUSDC(${plotId})`);
cast(["send", xbgl, "approve(address,uint256)", land, plotPriceXbgl, ...base], env);
cast(["send", land, "buyPlotWithUSDC(uint256,uint256)", plotId, plotPriceXbgl, ...base], env);

const owner = cast(["call", land, "balanceOf(address,uint256)(uint256)", wallet, plotId, "--rpc-url", rpc], env);
console.log("  plot balance:", owner);
console.log("  plotMinted:", cast(["call", land, "plotMinted(uint256)(bool)", plotId, "--rpc-url", rpc], env));
console.log("[fuji-smoke] ok");
