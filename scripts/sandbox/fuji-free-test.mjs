#!/usr/bin/env node
/**
 * Fuji free-test CLI — owner helpers for QA loops (43113 only).
 *
 * Usage:
 *   node scripts/sandbox/fuji-free-test.mjs status
 *   node scripts/sandbox/fuji-free-test.mjs sales on|off
 *   node scripts/sandbox/fuji-free-test.mjs pause|unpause
 *   node scripts/sandbox/fuji-free-test.mjs grant <plotId> [toAddress]
 *   node scripts/sandbox/fuji-free-test.mjs reset <plotId> <holderAddress>
 *   node scripts/sandbox/fuji-free-test.mjs clear-pending <plotId>
 *   node scripts/sandbox/fuji-free-test.mjs seed-xbgl <toAddress> <amountHuman>
 *   node scripts/sandbox/fuji-free-test.mjs loop <plotId> [toAddress]   # grant → reset → grant
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadDeployment, loadSandboxEnv, resolvePrivateKey, resolveRpc } from "./deployment-utils.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const sandboxDir = join(root, "sandbox");
const envPath = join(sandboxDir, ".env");

function castBin(env) {
  const home = env.USERPROFILE || env.HOME || "";
  const win = join(home, ".foundry", "bin", "cast.exe");
  if (existsSync(win)) return win;
  return "cast";
}

function cast(args, env, { allowFail = false } = {}) {
  const r = spawnSync(castBin(env), args, { cwd: root, env, encoding: "utf8" });
  if (r.status !== 0 && !allowFail) {
    console.error(r.stderr || r.stdout);
    throw new Error(`cast failed: ${args.slice(0, 4).join(" ")}…`);
  }
  return (r.stdout || "").trim();
}

function usage() {
  console.log(`Fuji free-test CLI (owner wallet from FUJI_PRIVATE_KEY)

  status
  sales on|off
  pause | unpause
  grant <plotId> [to]
  reset <plotId> <holder>
  clear-pending <plotId>
  seed-xbgl <to> <amount>     # transfer genesis xBGL from deployer
  loop <plotId> [to]          # grant → pause → reset → unpause → grant
`);
}

const env = loadSandboxEnv(envPath);
env.SANDBOX_CHAIN_ID = env.SANDBOX_CHAIN_ID || "43113";
const pk = resolvePrivateKey(env);
if (!pk) {
  console.error("Set FUJI_PRIVATE_KEY in sandbox/.env");
  process.exit(1);
}

const { data: dep } = loadDeployment(sandboxDir, env);
if (String(dep.chainId) !== "43113") {
  console.error("Refusing: deployment chainId is not 43113");
  process.exit(1);
}

const rpc = resolveRpc(env, dep);
const land = dep.contracts.SaraktLandV2;
const treasury = dep.contracts.SaraktTreasury;
const xbgl = dep.contracts.XBGLToken;
const sendBase = ["--private-key", pk, "--rpc-url", rpc, "--gas-limit", "800000"];
const wallet = cast(["wallet", "address", pk], env);

const [cmd, ...args] = process.argv.slice(2);
if (!cmd || cmd === "help" || cmd === "-h") {
  usage();
  process.exit(0);
}

console.log(`[fuji-free-test] ${cmd}`);
console.log(`  land=${land}`);
console.log(`  operator=${wallet}`);

function status() {
  const sales = cast(["call", land, "salesActive()(bool)", "--rpc-url", rpc], env);
  const paused = cast(["call", land, "paused()(bool)", "--rpc-url", rpc], env);
  const sold = cast(["call", land, "plotsSold()(uint256)", "--rpc-url", rpc], env);
  const owner = cast(["call", land, "owner()(address)", "--rpc-url", rpc], env);
  const rate = cast(["call", treasury, "xbglPerAvaxE18()(uint256)", "--rpc-url", rpc], env);
  const bal = cast(["call", xbgl, "balanceOf(address)(uint256)", wallet, "--rpc-url", rpc], env);
  console.log({ salesActive: sales, paused, plotsSold: sold, owner, xbglPerAvaxE18: rate, operatorXbgl: bal });
}

function ensureOwner() {
  const owner = cast(["call", land, "owner()(address)", "--rpc-url", rpc], env).toLowerCase();
  if (owner !== wallet.toLowerCase()) {
    throw new Error(`Operator ${wallet} is not land owner ${owner}`);
  }
}

switch (cmd) {
  case "status":
    status();
    break;

  case "sales": {
    ensureOwner();
    const on = args[0] === "on" || args[0] === "true" || args[0] === "1";
    const off = args[0] === "off" || args[0] === "false" || args[0] === "0";
    if (!on && !off) {
      console.error("usage: sales on|off");
      process.exit(1);
    }
    cast(["send", land, "toggleSales(bool)", on ? "true" : "false", ...sendBase], env);
    console.log("  salesActive →", on);
    break;
  }

  case "pause":
    ensureOwner();
    cast(["send", land, "pause()", ...sendBase], env);
    console.log("  land paused");
    break;

  case "unpause":
    ensureOwner();
    cast(["send", land, "unpause()", ...sendBase], env);
    console.log("  land unpaused");
    break;

  case "grant": {
    ensureOwner();
    const plotId = args[0];
    const to = args[1] || wallet;
    if (!plotId) {
      console.error("usage: grant <plotId> [to]");
      process.exit(1);
    }
    cast(["send", land, "adminGrantPlot(address,uint256)", to, plotId, ...sendBase], env);
    console.log(`  granted plot ${plotId} → ${to}`);
    break;
  }

  case "reset": {
    ensureOwner();
    const plotId = args[0];
    const holder = args[1];
    if (!plotId || !holder) {
      console.error("usage: reset <plotId> <holder>");
      process.exit(1);
    }
    const paused = cast(["call", land, "paused()(bool)", "--rpc-url", rpc], env) === "true";
    if (!paused) cast(["send", land, "pause()", ...sendBase], env);
    cast(["send", land, "adminResetPlot(uint256,address)", plotId, holder, ...sendBase], env);
    if (!paused) cast(["send", land, "unpause()", ...sendBase], env);
    console.log(`  reset plot ${plotId} (was ${holder})`);
    break;
  }

  case "clear-pending": {
    ensureOwner();
    const plotId = args[0];
    if (!plotId) {
      console.error("usage: clear-pending <plotId>");
      process.exit(1);
    }
    cast(["send", land, "adminClearPendingBuyer(uint256)", plotId, ...sendBase], env);
    console.log(`  cleared pendingBuyer for plot ${plotId}`);
    break;
  }

  case "seed-xbgl": {
    const to = args[0];
    const amount = args[1];
    if (!to || !amount) {
      console.error("usage: seed-xbgl <to> <amountHuman>");
      process.exit(1);
    }
    const { ethers } = await import("ethers");
    const wei = ethers.parseEther(amount).toString();
    cast(["send", xbgl, "transfer(address,uint256)", to, wei, ...sendBase], env);
    console.log(`  seeded ${amount} xBGL → ${to}`);
    break;
  }

  case "loop": {
    ensureOwner();
    const plotId = args[0];
    const to = args[1] || wallet;
    if (!plotId) {
      console.error("usage: loop <plotId> [to]");
      process.exit(1);
    }
    const minted = cast(["call", land, "plotMinted(uint256)(bool)", plotId, "--rpc-url", rpc], env) === "true";
    if (minted) {
      const bal = cast(["call", land, "balanceOf(address,uint256)(uint256)", to, plotId, "--rpc-url", rpc], env);
      const holder = BigInt(bal.split(/\s+/)[0] || "0") > 0n ? to : wallet;
      cast(["send", land, "pause()", ...sendBase], env);
      cast(["send", land, "adminResetPlot(uint256,address)", plotId, holder, ...sendBase], env);
      cast(["send", land, "unpause()", ...sendBase], env);
      console.log(`  reset existing plot ${plotId}`);
    }
    cast(["send", land, "adminGrantPlot(address,uint256)", to, plotId, ...sendBase], env);
    console.log(`  granted plot ${plotId} → ${to}`);
    cast(["send", land, "pause()", ...sendBase], env);
    cast(["send", land, "adminResetPlot(uint256,address)", plotId, to, ...sendBase], env);
    cast(["send", land, "unpause()", ...sendBase], env);
    cast(["send", land, "adminGrantPlot(address,uint256)", to, plotId, ...sendBase], env);
    console.log(`  loop OK — plot ${plotId} held by ${to}`);
    break;
  }

  default:
    usage();
    process.exit(1);
}
