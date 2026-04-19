import fs from "node:fs";
import path from "node:path";

const workspaceRoot = process.cwd();
const packPath = path.join(workspaceRoot, "cursor-brain/governance/governance-pack.json");

function fail(message) {
  console.error(`governance-pack validation failed: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(packPath)) {
  fail("missing governance-pack.json");
}

const pack = JSON.parse(fs.readFileSync(packPath, "utf8"));
const requiredChannels = ["dev", "staging", "prod"];

if (!Array.isArray(pack.channels) || requiredChannels.some((channel) => !pack.channels.includes(channel))) {
  fail("channels must include dev, staging, and prod");
}

if (!requiredChannels.includes(pack.current_channel)) {
  fail("current_channel must be one of dev|staging|prod");
}

if (!/^\d+\.\d+\.\d+$/.test(pack.version ?? "")) {
  fail("version must be semver-like (x.y.z)");
}

const requiredArtifacts = ["rules", "skills", "policies", "schemas"];
for (const key of requiredArtifacts) {
  if (!Array.isArray(pack.artifacts?.[key]) || pack.artifacts[key].length === 0) {
    fail(`artifacts.${key} must be a non-empty array`);
  }
  for (const relPath of pack.artifacts[key]) {
    const absPath = path.join(workspaceRoot, relPath);
    if (!fs.existsSync(absPath)) {
      fail(`artifact not found: ${relPath}`);
    }
  }
}

const gates = pack.promotion_gates ?? {};
for (const key of ["safety_no_regression", "correctness_min", "run_score_delta_min", "critical_violations_allowed"]) {
  if (!(key in gates)) {
    fail(`promotion_gates.${key} is required`);
  }
}

console.log(`governance-pack valid: v${pack.version} (${pack.current_channel})`);
