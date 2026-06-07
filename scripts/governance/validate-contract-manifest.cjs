#!/usr/bin/env node
/**
 * Validates that contract addresses in sandbox/deployments/43113-latest.json
 * are consistent with:
 *   1. .env.production VITE_* contract variables
 *   2. public/sandbox/deployments/43113-latest.json (the static asset copy)
 *
 * Exits 1 with a clear diff on any mismatch.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

// ──────────────────────────────────────────────
// Mapping: JSON contract key → VITE_ env var name
// ──────────────────────────────────────────────
const CONTRACT_TO_ENV = {
  SaraktLandV2: 'VITE_CONTRACT_ADDRESS',
  XBGLToken: 'VITE_XBGL_TOKEN_ADDRESS',
  SaraktTreasury: 'VITE_TREASURY_ADDRESS',
};

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function normaliseAddress(addr) {
  return typeof addr === 'string' ? addr.toLowerCase() : '';
}

function loadJson(filePath) {
  const full = path.resolve(ROOT, filePath);
  if (!fs.existsSync(full)) {
    console.error(`[validate-contract-manifest] MISSING FILE: ${filePath}`);
    process.exit(1);
  }
  try {
    return JSON.parse(fs.readFileSync(full, 'utf8'));
  } catch (err) {
    console.error(`[validate-contract-manifest] JSON parse error in ${filePath}: ${err.message}`);
    process.exit(1);
  }
}

/** Parse a .env file into a plain object (no variable expansion). */
function parseEnvFile(filePath) {
  const full = path.resolve(ROOT, filePath);
  if (!fs.existsSync(full)) return {};
  const lines = fs.readFileSync(full, 'utf8').split('\n');
  const result = {};
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eqIdx = line.indexOf('=');
    if (eqIdx === -1) continue;
    const key = line.slice(0, eqIdx).trim();
    const value = line.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    result[key] = value;
  }
  return result;
}

// ──────────────────────────────────────────────
// Load sources
// ──────────────────────────────────────────────
const manifestPath = 'sandbox/deployments/43113-latest.json';
const publicManifestPath = 'public/sandbox/deployments/43113-latest.json';
const envProductionPath = '.env.production';

const manifest = loadJson(manifestPath);
const publicManifest = loadJson(publicManifestPath);
const envVars = parseEnvFile(envProductionPath);

const manifestContracts = manifest.contracts || {};
const publicContracts = publicManifest.contracts || {};

let failures = [];

// ──────────────────────────────────────────────
// Check 1: manifest vs .env.production
// ──────────────────────────────────────────────
for (const [contractName, envKey] of Object.entries(CONTRACT_TO_ENV)) {
  const manifestAddr = normaliseAddress(manifestContracts[contractName]);
  const envAddr = normaliseAddress(envVars[envKey]);

  if (!manifestAddr) {
    failures.push(
      `[manifest→env] ${contractName} not found in ${manifestPath}`
    );
    continue;
  }
  if (!envAddr) {
    failures.push(
      `[manifest→env] ${envKey} not set in ${envProductionPath}`
    );
    continue;
  }
  if (manifestAddr !== envAddr) {
    failures.push(
      `[manifest→env] ${contractName} mismatch:\n` +
      `  ${manifestPath}         : ${manifestAddr}\n` +
      `  ${envProductionPath} (${envKey}): ${envAddr}`
    );
  }
}

// ──────────────────────────────────────────────
// Check 2: manifest vs public/sandbox/deployments (static asset parity)
// ──────────────────────────────────────────────
for (const contractName of Object.keys(CONTRACT_TO_ENV)) {
  const manifestAddr = normaliseAddress(manifestContracts[contractName]);
  const publicAddr = normaliseAddress(publicContracts[contractName]);

  if (!manifestAddr) continue; // already flagged above
  if (!publicAddr) {
    failures.push(
      `[manifest→public] ${contractName} not found in ${publicManifestPath}`
    );
    continue;
  }
  if (manifestAddr !== publicAddr) {
    failures.push(
      `[manifest→public] ${contractName} mismatch:\n` +
      `  ${manifestPath}       : ${manifestAddr}\n` +
      `  ${publicManifestPath}: ${publicAddr}`
    );
  }
}

// ──────────────────────────────────────────────
// Report
// ──────────────────────────────────────────────
if (failures.length === 0) {
  console.log('[validate-contract-manifest] ✓ All contract addresses are consistent.');
  process.exit(0);
} else {
  console.error('\n[validate-contract-manifest] CONTRACT ADDRESS MISMATCH DETECTED\n');
  for (const msg of failures) {
    console.error('  ✗ ' + msg + '\n');
  }
  console.error(
    `${failures.length} failure(s) found.\n` +
    `Update ${envProductionPath} and ${publicManifestPath} to match ${manifestPath}.\n`
  );
  process.exit(1);
}
