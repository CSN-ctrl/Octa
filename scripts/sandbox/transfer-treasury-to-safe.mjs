#!/usr/bin/env node
/**
 * Transfer Ownable / Ownable2Step ownership of Fuji Phase-1 contracts to a Gnosis Safe.
 *
 * Fuji-only (CHAIN_ID must be 43113). Mainnet (43114) is hard-rejected.
 *
 * Targets (from sandbox/deployments/<chainId>-latest.json):
 *   - SaraktTreasury (required)
 *   - SaraktLandV2 (if present)
 *   - LocalDigitalID (if present)
 *
 * Ownable2Step (Treasury / Land after hardening): this script only calls
 * transferOwnership(safe). The Safe must then call acceptOwnership().
 * LocalDigitalID (plain Ownable): ownership updates immediately.
 *
 * Required env (never commit):
 *   DEPLOYER_PRIVATE_KEY  - current owner EOA
 *   SAFE_ADDRESS          - Gnosis Safe on Fuji
 *   CHAIN_ID              - must be 43113
 *   RPC_URL               - Avalanche Fuji RPC
 *
 * Usage:
 *   DEPLOYER_PRIVATE_KEY=0x... SAFE_ADDRESS=0x... CHAIN_ID=43113 \
 *     RPC_URL=https://api.avax-test.network/ext/bc/C/rpc \
 *     node scripts/sandbox/transfer-treasury-to-safe.mjs
 *
 * Dry-run (no broadcast):
 *   DRY_RUN=1 ... node scripts/sandbox/transfer-treasury-to-safe.mjs
 *
 * See docs/ops/treasury-multisig-mainnet.md
 */

import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ethers } from "ethers";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");
const FUJI_CHAIN_ID = "43113";
const MAINNET_CHAIN_ID = "43114";

const OWNABLE2_ABI = [
  "function owner() view returns (address)",
  "function pendingOwner() view returns (address)",
  "function transferOwnership(address newOwner)",
  "function acceptOwnership()",
];

const OWNABLE_ABI = [
  "function owner() view returns (address)",
  "function transferOwnership(address newOwner)",
];

const REQUIRED_ENV = ["DEPLOYER_PRIVATE_KEY", "SAFE_ADDRESS", "CHAIN_ID", "RPC_URL"];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error("[transfer-to-safe] Missing required env vars:", missing.join(", "));
  console.error("See docs/ops/treasury-multisig-mainnet.md");
  process.exit(1);
}

const { DEPLOYER_PRIVATE_KEY, SAFE_ADDRESS, CHAIN_ID, RPC_URL } = process.env;
const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";

if (CHAIN_ID === MAINNET_CHAIN_ID) {
  console.error("[transfer-to-safe] HARD REJECT: CHAIN_ID 43114 (mainnet) is not allowed.");
  console.error("This script is Fuji-only (43113). Mainnet cutover is deferred.");
  process.exit(1);
}

if (CHAIN_ID !== FUJI_CHAIN_ID) {
  console.error(`[transfer-to-safe] CHAIN_ID must be ${FUJI_CHAIN_ID} (Fuji). Got: ${CHAIN_ID}`);
  process.exit(1);
}

if (!/^0x[0-9a-fA-F]{40}$/.test(SAFE_ADDRESS)) {
  console.error("[transfer-to-safe] SAFE_ADDRESS is not a valid EVM address:", SAFE_ADDRESS);
  process.exit(1);
}

if (SAFE_ADDRESS.toLowerCase() === ethers.ZeroAddress) {
  console.error("[transfer-to-safe] SAFE_ADDRESS cannot be the zero address");
  process.exit(1);
}

const manifestPath = join(ROOT, "sandbox", "deployments", `${CHAIN_ID}-latest.json`);
if (!existsSync(manifestPath)) {
  console.error(`[transfer-to-safe] Deployment manifest not found: ${manifestPath}`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const contracts = manifest.contracts || {};

const targets = [];
if (contracts.SaraktTreasury) {
  targets.push({ name: "SaraktTreasury", address: contracts.SaraktTreasury });
} else {
  console.error(`[transfer-to-safe] SaraktTreasury missing in ${manifestPath}`);
  process.exit(1);
}
if (contracts.SaraktLandV2) {
  targets.push({ name: "SaraktLandV2", address: contracts.SaraktLandV2 });
}
if (contracts.LocalDigitalID) {
  targets.push({ name: "LocalDigitalID", address: contracts.LocalDigitalID });
}

console.log("[transfer-to-safe] Configuration:");
console.log("  Chain ID        :", CHAIN_ID, "(Fuji)");
console.log("  RPC URL         :", RPC_URL);
console.log("  Safe            :", SAFE_ADDRESS);
console.log("  Dry run         :", DRY_RUN);
console.log(
  "  Deployer key    : [REDACTED — prefix",
  DEPLOYER_PRIVATE_KEY.slice(0, 8) + "...]",
);
console.log("  Targets:");
for (const t of targets) {
  console.log(`    - ${t.name}: ${t.address}`);
}
console.log("");

async function supportsPendingOwner(provider, address) {
  const c = new ethers.Contract(address, OWNABLE2_ABI, provider);
  try {
    await c.pendingOwner();
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== Number(FUJI_CHAIN_ID)) {
    console.error(
      `[transfer-to-safe] RPC chainId ${network.chainId} !== Fuji ${FUJI_CHAIN_ID}. Aborting.`,
    );
    process.exit(1);
  }

  const signer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
  console.log("[transfer-to-safe] Signer:", signer.address);

  const results = [];

  for (const t of targets) {
    const twoStep = await supportsPendingOwner(provider, t.address);
    const abi = twoStep ? OWNABLE2_ABI : OWNABLE_ABI;
    const contract = new ethers.Contract(t.address, abi, signer);
    const currentOwner = await contract.owner();
    console.log(
      `\n[${t.name}] current owner: ${currentOwner} (${twoStep ? "Ownable2Step" : "Ownable"})`,
    );

    if (currentOwner.toLowerCase() === SAFE_ADDRESS.toLowerCase()) {
      console.log(`[${t.name}] already owned by Safe — skip`);
      results.push({ ...t, status: "already_safe", twoStep });
      continue;
    }

    if (currentOwner.toLowerCase() !== signer.address.toLowerCase()) {
      console.error(
        `[${t.name}] signer ${signer.address} is not owner ${currentOwner}. Aborting.`,
      );
      process.exit(1);
    }

    if (twoStep) {
      const pending = await contract.pendingOwner();
      if (pending && pending.toLowerCase() === SAFE_ADDRESS.toLowerCase()) {
        console.log(`[${t.name}] pendingOwner already Safe — await acceptOwnership() on Safe`);
        results.push({ ...t, status: "pending_accept", twoStep: true });
        continue;
      }
    }

    if (DRY_RUN) {
      console.log(`[${t.name}] DRY_RUN — would call transferOwnership(${SAFE_ADDRESS})`);
      results.push({ ...t, status: "dry_run", twoStep });
      continue;
    }

    const tx = await contract.transferOwnership(SAFE_ADDRESS);
    console.log(`[${t.name}] transferOwnership tx: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`[${t.name}] confirmed block: ${receipt.blockNumber}`);

    if (twoStep) {
      const pending = await contract.pendingOwner();
      const ownerStill = await contract.owner();
      if (pending.toLowerCase() !== SAFE_ADDRESS.toLowerCase()) {
        console.error(`[${t.name}] pendingOwner mismatch: ${pending}`);
        process.exit(1);
      }
      if (ownerStill.toLowerCase() !== currentOwner.toLowerCase()) {
        console.error(`[${t.name}] unexpected owner change before accept: ${ownerStill}`);
        process.exit(1);
      }
      console.log(`[${t.name}] ✓ pendingOwner=${pending} (owner still ${ownerStill})`);
      console.log(`[${t.name}] → Safe must call acceptOwnership()`);
      results.push({ ...t, status: "pending_accept", tx: tx.hash, twoStep: true });
    } else {
      const newOwner = await contract.owner();
      if (newOwner.toLowerCase() !== SAFE_ADDRESS.toLowerCase()) {
        console.error(`[${t.name}] owner did not update: ${newOwner}`);
        process.exit(1);
      }
      console.log(`[${t.name}] ✓ owner=${newOwner}`);
      results.push({ ...t, status: "transferred", tx: tx.hash, twoStep: false });
    }
  }

  const acceptNeeded = results.filter((r) => r.status === "pending_accept");
  if (acceptNeeded.length > 0) {
    console.log("\n=== Safe acceptOwnership checklist ===");
    console.log("1. Open https://app.safe.global/ (Avalanche Fuji)");
    console.log("2. New Transaction → Contract interaction for each:");
    for (const r of acceptNeeded) {
      console.log(`   - ${r.name}: ${r.address} → acceptOwnership()`);
    }
    console.log("3. Collect threshold signatures and execute.");
    console.log("4. Verify: cast call <addr> \"owner()(address)\" --rpc-url $RPC_URL");
  }

  if (!DRY_RUN) {
    const pendingAccept = results.some((r) => r.status === "pending_accept");
    const allOwned =
      results.length > 0 &&
      results.every((r) => r.status === "transferred" || r.status === "already_safe");

    manifest.ownershipTransfer = {
      transferredAt: new Date().toISOString(),
      chainId: Number(CHAIN_ID),
      safeAddress: SAFE_ADDRESS,
      status: allOwned ? "complete" : pendingAccept ? "pending_accept" : "partial",
      results,
    };
    // Only stamp top-level safeAddress when ownership is fully accepted / 1-step done.
    if (allOwned) {
      manifest.safeAddress = SAFE_ADDRESS;
    }
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    console.log(
      `\n[transfer-to-safe] Updated ${manifestPath} (status=${manifest.ownershipTransfer.status})`,
    );
  }

  console.log("\n[transfer-to-safe] Done.");
}

main().catch((err) => {
  console.error("[transfer-to-safe] Failed:", err?.message || err);
  process.exit(1);
});
