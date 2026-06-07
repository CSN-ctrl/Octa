#!/usr/bin/env node
/**
 * Transfer SaraktTreasury ownership to a Gnosis Safe.
 *
 * TODO: Implement before mainnet launch.
 * See docs/ops/treasury-multisig-mainnet.md for full runbook.
 *
 * Required env vars (never commit these):
 *   DEPLOYER_PRIVATE_KEY  - current treasury owner EOA private key
 *   SAFE_ADDRESS          - target Gnosis Safe address
 *   CHAIN_ID              - 43113 (Fuji) or 43114 (Mainnet)
 *   RPC_URL               - Avalanche RPC endpoint
 *
 * Usage:
 *   DEPLOYER_PRIVATE_KEY=0x... SAFE_ADDRESS=0x... CHAIN_ID=43113 \
 *     RPC_URL=https://api.avax-test.network/ext/bc/C/rpc \
 *     node scripts/sandbox/transfer-treasury-to-safe.mjs
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

// ──────────────────────────────────────────────
// Env guard — fail loudly before touching chain
// ──────────────────────────────────────────────
const REQUIRED_ENV = ['DEPLOYER_PRIVATE_KEY', 'SAFE_ADDRESS', 'CHAIN_ID', 'RPC_URL'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error('[transfer-treasury-to-safe] Missing required env vars:', missing.join(', '));
  console.error('See docs/ops/treasury-multisig-mainnet.md for setup instructions.');
  process.exit(1);
}

const { DEPLOYER_PRIVATE_KEY, SAFE_ADDRESS, CHAIN_ID, RPC_URL } = process.env;

// Basic address format guard
if (!/^0x[0-9a-fA-F]{40}$/.test(SAFE_ADDRESS)) {
  console.error('[transfer-treasury-to-safe] SAFE_ADDRESS is not a valid EVM address:', SAFE_ADDRESS);
  process.exit(1);
}

// ──────────────────────────────────────────────
// Load treasury address from deployment manifest
// ──────────────────────────────────────────────
const manifestPath = join(ROOT, 'sandbox', 'deployments', `${CHAIN_ID}-latest.json`);
if (!existsSync(manifestPath)) {
  console.error(`[transfer-treasury-to-safe] Deployment manifest not found: ${manifestPath}`);
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const treasuryAddress = manifest?.contracts?.SaraktTreasury;

if (!treasuryAddress) {
  console.error(`[transfer-treasury-to-safe] SaraktTreasury not found in ${manifestPath}`);
  process.exit(1);
}

console.log('[transfer-treasury-to-safe] Configuration:');
console.log('  Chain ID       :', CHAIN_ID);
console.log('  RPC URL        :', RPC_URL);
console.log('  Treasury       :', treasuryAddress);
console.log('  New owner (Safe):', SAFE_ADDRESS);
console.log('  Deployer key   : [REDACTED — first 6 chars:', DEPLOYER_PRIVATE_KEY.slice(0, 8), '...]');
console.log('');

// ──────────────────────────────────────────────
// TODO: Implement the actual transfer using ethers or viem.
//
// Suggested implementation (ethers v6):
//
//   import { ethers } from 'ethers';
//   const provider = new ethers.JsonRpcProvider(RPC_URL);
//   const signer   = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
//   const abi      = ['function transferOwnership(address newOwner)'];
//   const treasury = new ethers.Contract(treasuryAddress, abi, signer);
//
//   const tx = await treasury.transferOwnership(SAFE_ADDRESS);
//   console.log('[transfer-treasury-to-safe] Submitted tx:', tx.hash);
//   const receipt = await tx.wait();
//   console.log('[transfer-treasury-to-safe] Confirmed in block:', receipt.blockNumber);
//
//   // Verify
//   const ownerAbi = ['function owner() view returns (address)'];
//   const check    = new ethers.Contract(treasuryAddress, ownerAbi, provider);
//   const newOwner = await check.owner();
//   if (newOwner.toLowerCase() !== SAFE_ADDRESS.toLowerCase()) {
//     console.error('[transfer-treasury-to-safe] VERIFICATION FAILED — owner did not update');
//     process.exit(1);
//   }
//   console.log('[transfer-treasury-to-safe] ✓ Owner verified:', newOwner);
//
// If the contract uses Ownable2Step, the Safe must call acceptOwnership()
// separately via the Safe UI or a separate script step.
// ──────────────────────────────────────────────

console.warn('[transfer-treasury-to-safe] NOT IMPLEMENTED — see TODO comments above.');
console.warn('Complete implementation before any mainnet launch.');
console.warn('Full runbook: docs/ops/treasury-multisig-mainnet.md');
process.exit(1);
