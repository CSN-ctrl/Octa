#!/usr/bin/env node
/**
 * Read-only Fuji status probe for Phase 1 contracts in 43113-latest.json.
 *
 * Usage:
 *   RPC_URL=https://api.avax-test.network/ext/bc/C/rpc npm run sandbox:verify:fuji
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ethers } from "ethers";
import { loadSandboxEnv, resolveRpc, loadDeployment } from "./deployment-utils.mjs";

const FUJI = 43113;
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const sandboxDir = join(root, "sandbox");
const env = loadSandboxEnv(join(sandboxDir, ".env"));
env.SANDBOX_CHAIN_ID = env.SANDBOX_CHAIN_ID || String(FUJI);

const ABI = [
  "function owner() view returns (address)",
  "function pendingOwner() view returns (address)",
  "function paused() view returns (bool)",
  "function salesActive() view returns (bool)",
  "function requireDigitalID() view returns (bool)",
  "function plotsSold() view returns (uint256)",
  "function phase1PriceUSDC() view returns (uint256)",
  "function usdcToken() view returns (address)",
  "function treasury() view returns (address)",
  "function digitalID() view returns (address)",
  "function landContract() view returns (address)",
  "function xbglToken() view returns (address)",
  "function xbglPerAvaxE18() view returns (uint256)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
];

async function safeCall(fn) {
  try {
    return { ok: true, value: await fn() };
  } catch (e) {
    return { ok: false, error: e?.shortMessage || e?.message || String(e) };
  }
}

const { path: depPath, data: dep } = loadDeployment(sandboxDir, env);
let rpc;
try {
  rpc = env.RPC_URL?.trim() || resolveRpc(env, dep);
} catch {
  rpc = "https://api.avax-test.network/ext/bc/C/rpc";
}

const provider = new ethers.JsonRpcProvider(rpc);
const net = await provider.getNetwork();
if (Number(net.chainId) !== FUJI) {
  console.error(`[verify-fuji] RPC chainId ${net.chainId} !== ${FUJI}`);
  process.exit(1);
}

console.log(`[verify-fuji] manifest: ${depPath}`);
console.log(`[verify-fuji] rpc chain: ${Number(net.chainId)}`);

const c = dep.contracts || {};
let hardFails = 0;
let warnings = 0;
let hardenedLand = false;
let hardenedTreasury = false;

async function codeAt(address) {
  const code = await provider.getCode(address);
  return code && code !== "0x" ? (code.length - 2) / 2 : 0;
}

async function probeLand(address) {
  console.log(`\n[SaraktLandV2] ${address}`);
  const bytes = await codeAt(address);
  console.log(`  bytecode: ${bytes}B`);
  if (!bytes) {
    hardFails++;
    return;
  }
  const land = new ethers.Contract(address, ABI, provider);
  const owner = await safeCall(() => land.owner());
  console.log(owner.ok ? `  owner: ${owner.value}` : `  owner: ERR ${owner.error}`);
  if (!owner.ok) hardFails++;

  const pending = await safeCall(() => land.pendingOwner());
  const paused = await safeCall(() => land.paused());
  if (pending.ok && paused.ok) {
    hardenedLand = true;
    console.log(`  pendingOwner: ${pending.value}`);
    console.log(`  paused: ${paused.value}`);
  } else {
    warnings++;
    console.log("  ⚠ pre-hardening (no pendingOwner/paused) — redeploy with sandbox:deploy:fuji");
  }

  for (const [label, fn] of [
    ["salesActive", () => land.salesActive()],
    ["requireDigitalID", () => land.requireDigitalID()],
    ["plotsSold", () => land.plotsSold()],
    ["phase1PriceUSDC", () => land.phase1PriceUSDC()],
    ["usdcToken", () => land.usdcToken()],
    ["treasury", () => land.treasury()],
    ["digitalID", () => land.digitalID()],
  ]) {
    const r = await safeCall(fn);
    if (!r.ok) {
      console.log(`  ${label}: ERR ${r.error}`);
      hardFails++;
      continue;
    }
    const v = typeof r.value === "bigint" ? r.value.toString() : r.value;
    if (label === "requireDigitalID" && r.value !== false) {
      console.log(`  ${label}: ${v} ✗ must be false`);
      hardFails++;
    } else {
      console.log(`  ${label}: ${v}`);
    }
  }
}

async function probeTreasury(address) {
  console.log(`\n[SaraktTreasury] ${address}`);
  const bytes = await codeAt(address);
  console.log(`  bytecode: ${bytes}B`);
  if (!bytes) {
    hardFails++;
    return;
  }
  const t = new ethers.Contract(address, ABI, provider);
  const owner = await safeCall(() => t.owner());
  console.log(owner.ok ? `  owner: ${owner.value}` : `  owner: ERR ${owner.error}`);
  if (!owner.ok) hardFails++;

  const pending = await safeCall(() => t.pendingOwner());
  const paused = await safeCall(() => t.paused());
  if (pending.ok && paused.ok) {
    hardenedTreasury = true;
    console.log(`  pendingOwner: ${pending.value}`);
    console.log(`  paused: ${paused.value}`);
  } else {
    warnings++;
    console.log("  ⚠ pre-hardening (no pendingOwner/paused) — redeploy with sandbox:deploy:fuji");
  }

  for (const [label, fn] of [
    ["landContract", () => t.landContract()],
    ["xbglToken", () => t.xbglToken()],
    ["xbglPerAvaxE18", () => t.xbglPerAvaxE18()],
  ]) {
    const r = await safeCall(fn);
    if (!r.ok) {
      console.log(`  ${label}: ERR ${r.error}`);
      hardFails++;
    } else {
      console.log(`  ${label}: ${typeof r.value === "bigint" ? r.value.toString() : r.value}`);
    }
  }
}

async function probeToken(address) {
  console.log(`\n[XBGLToken] ${address}`);
  const bytes = await codeAt(address);
  console.log(`  bytecode: ${bytes}B`);
  if (!bytes) {
    hardFails++;
    return;
  }
  const token = new ethers.Contract(address, ABI, provider);
  const name = await safeCall(() => token.name());
  const symbol = await safeCall(() => token.symbol());
  console.log(name.ok ? `  name: ${name.value}` : `  name: ERR`);
  console.log(symbol.ok ? `  symbol: ${symbol.value}` : `  symbol: ERR`);
  if (!name.ok || !symbol.ok) hardFails++;
}

async function probeDid(address) {
  console.log(`\n[LocalDigitalID] ${address}`);
  const bytes = await codeAt(address);
  console.log(`  bytecode: ${bytes}B`);
  if (!bytes) {
    hardFails++;
    return;
  }
  const did = new ethers.Contract(address, ABI, provider);
  const owner = await safeCall(() => did.owner());
  console.log(owner.ok ? `  owner: ${owner.value}` : `  owner: ERR`);
  if (!owner.ok) hardFails++;
}

if (!c.SaraktLandV2 || !c.SaraktTreasury || !c.XBGLToken || !c.LocalDigitalID) {
  console.error("[verify-fuji] manifest missing required contracts");
  process.exit(1);
}

await probeLand(c.SaraktLandV2);
await probeTreasury(c.SaraktTreasury);
await probeToken(c.XBGLToken);
await probeDid(c.LocalDigitalID);
if (c.ReserveMintController) {
  const b = await codeAt(c.ReserveMintController);
  console.log(`\n[ReserveMintController] ${c.ReserveMintController} bytecode=${b}B`);
  if (!b) hardFails++;
}

const land = new ethers.Contract(c.SaraktLandV2, ABI, provider);
const treasury = new ethers.Contract(c.SaraktTreasury, ABI, provider);
try {
  const landTreasury = (await land.treasury()).toLowerCase();
  const treasLand = (await treasury.landContract()).toLowerCase();
  const xbglLand = (await land.usdcToken()).toLowerCase();
  const xbglTreas = (await treasury.xbglToken()).toLowerCase();
  const want = c.XBGLToken.toLowerCase();
  const ok =
    landTreasury === c.SaraktTreasury.toLowerCase() &&
    treasLand === c.SaraktLandV2.toLowerCase() &&
    xbglLand === want &&
    xbglTreas === want;
  console.log(`\n[wiring] land↔treasury↔xBGL: ${ok ? "✓" : "✗"}`);
  if (!ok) hardFails++;
} catch (e) {
  console.log(`[wiring] ERR ${e.message}`);
  hardFails++;
}

const fullyHardened = hardenedLand && hardenedTreasury;
console.log(
  `\n[verify-fuji] ${hardFails === 0 ? "PASS" : "FAIL"} hardFails=${hardFails} warnings=${warnings}`,
);
console.log(
  `[verify-fuji] hardened on-chain: ${fullyHardened ? "yes" : "no — run npm run sandbox:deploy:fuji"}`,
);
if (dep.safeAddress) console.log(`[verify-fuji] manifest safeAddress: ${dep.safeAddress}`);
process.exit(hardFails === 0 ? 0 : 1);
