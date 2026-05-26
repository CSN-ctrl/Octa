#!/usr/bin/env node
/**
 * Shared helpers for sandbox deploy/smoke scripts.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export function resolveDeploymentPath(sandboxDir, env = process.env) {
  if (env.SANDBOX_DEPLOYMENT?.trim()) {
    const custom = env.SANDBOX_DEPLOYMENT.trim();
    return custom.includes("/") ? custom : join(sandboxDir, "deployments", custom);
  }
  const chain = env.SANDBOX_CHAIN_ID?.trim() || "1337";
  return join(sandboxDir, "deployments", `${chain}-latest.json`);
}

export function resolveRpc(env, dep) {
  if (env.FUJI_RPC_URL?.trim()) return env.FUJI_RPC_URL.trim();
  if (env.SANDBOX_RPC_URL?.trim()) return env.SANDBOX_RPC_URL.trim();
  const key = env.ALCHEMY_API_KEY?.trim();
  if (key && String(dep.chainId) === "43113") {
    return `https://avax-fuji.g.alchemy.com/v2/${key}`;
  }
  if (dep.rpc && !String(dep.rpc).includes("<ALCHEMY_API_KEY>")) return dep.rpc;
  if (key) return `https://avax-fuji.g.alchemy.com/v2/${key}`;
  throw new Error("No RPC URL — set FUJI_RPC_URL, SANDBOX_RPC_URL, or ALCHEMY_API_KEY");
}

export function resolvePrivateKey(env) {
  return env.FUJI_PRIVATE_KEY?.trim() || env.XBGL_DEPLOYER_PRIVATE_KEY?.trim() || "";
}

export function loadDeployment(sandboxDir, env) {
  const path = resolveDeploymentPath(sandboxDir, env);
  if (!existsSync(path)) {
    throw new Error(`Missing deployment file: ${path}`);
  }
  return { path, data: JSON.parse(readFileSync(path, "utf8")) };
}

export function loadSandboxEnv(envPath) {
  const env = { ...process.env };
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^\s*([^#][^=]+)=(.*)$/);
      if (m) env[m[1].trim()] = m[2].trim();
    }
  }
  return env;
}
