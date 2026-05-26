#!/usr/bin/env node
/**
 * On-chain sandbox smoke test using sandbox/deployments + cast. No frontend.
 */
import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

function cast(args, env) {
  const r = spawnSync(castBin(env), args, { cwd: root, env, encoding: "utf8" });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    throw new Error(`cast failed: ${args.join(" ")}`);
  }
  return (r.stdout || "").trim();
}

const env = loadEnv();
if (!existsSync(depPath)) {
  console.error("Run npm run sandbox:deploy first (missing sandbox/deployments/1337-latest.json)");
  process.exit(1);
}

const dep = JSON.parse(readFileSync(depPath, "utf8"));
const rpc = dep.rpc || env.SANDBOX_RPC_URL;
const land = dep.contracts.SaraktLandV2;
const pk = env.XBGL_DEPLOYER_PRIVATE_KEY;
if (!pk) {
  console.error("Set XBGL_DEPLOYER_PRIVATE_KEY in sandbox/.env");
  process.exit(1);
}

const plotId = env.SANDBOX_SMOKE_PLOT_ID || "99";

console.log("[sandbox] smoke on", land);
console.log("  salesActive:", cast(["call", land, "salesActive()(bool)", "--rpc-url", rpc], env));
console.log("  phase1PriceAVAX:", cast(["call", land, "phase1PriceAVAX()(uint256)", "--rpc-url", rpc], env));

const pending = cast(["call", land, "pendingBuyer(uint256)(address)", plotId, "--rpc-url", rpc], env);
if (pending === "0x0000000000000000000000000000000000000000") {
  console.log(`  buyPlotWithAVAX(${plotId})...`);
  cast(
    [
      "send",
      land,
      "buyPlotWithAVAX(uint256)",
      plotId,
      "--value",
      "0.01ether",
      "--private-key",
      pk,
      "--rpc-url",
      rpc,
    ],
    env
  );
  console.log("  pendingBuyer:", cast(["call", land, "pendingBuyer(uint256)(address)", plotId, "--rpc-url", rpc], env));
} else {
  console.log(`  plot ${plotId} already pending:`, pending);
}

console.log("[sandbox] smoke ok");
