#!/usr/bin/env node
/**
 * Resolve canonical xBGL address from ChaosStar (8888) before deploying on 1337.
 * Order: CHAOSSTAR_XBGL_ADDRESS env → chaosstar/deployments/xbgl-address.json
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

function parseAddress(raw) {
  const v = typeof raw === "string" ? raw.trim() : "";
  if (!/^0x[a-fA-F0-9]{40}$/.test(v)) return null;
  return v;
}

/**
 * @param {Record<string, string>} env
 * @returns {Promise<string | null>}
 */
export async function resolveChaosstarXbglAddress(env = process.env) {
  const fromEnv = parseAddress(env.CHAOSSTAR_XBGL_ADDRESS || env.VITE_CHAOSSTAR_XBGL_ADDRESS);
  if (fromEnv) {
    console.log(`[chaosstar-xbgl] from env: ${fromEnv}`);
    return fromEnv;
  }

  const jsonPaths = [
    join(root, "chaosstar", "deployments", "xbgl-address.json"),
    join(root, "public", "chaosstar", "deployments", "xbgl-address.json"),
  ];

  for (const p of jsonPaths) {
    if (!existsSync(p)) continue;
    try {
      const data = JSON.parse(readFileSync(p, "utf8"));
      const addr = parseAddress(data.address || data.xbglToken || data.XBGLToken);
      if (addr) {
        console.log(`[chaosstar-xbgl] from ${p}: ${addr}`);
        return addr;
      }
    } catch (e) {
      console.warn(`[chaosstar-xbgl] failed to read ${p}:`, e.message);
    }
  }

  console.warn(
    "[chaosstar-xbgl] no reference address — set CHAOSSTAR_XBGL_ADDRESS or chaosstar/deployments/xbgl-address.json"
  );
  return null;
}
