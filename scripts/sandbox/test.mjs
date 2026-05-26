#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const home = process.env.USERPROFILE || process.env.HOME || "";
const forge = existsSync(join(home, ".foundry", "bin", "forge.exe"))
  ? join(home, ".foundry", "bin", "forge.exe")
  : "forge";

console.log("[sandbox] forge test (unit + sandbox/)");
const r = spawnSync(forge, ["test", "-vv"], {
  cwd: root,
  stdio: "inherit",
});

process.exit(r.status ?? 1);
