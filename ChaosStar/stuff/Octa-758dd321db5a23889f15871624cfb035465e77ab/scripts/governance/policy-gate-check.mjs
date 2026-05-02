import fs from "node:fs";
import path from "node:path";

const workspaceRoot = process.cwd();
const riskTier = process.env.RISK_TIER ?? "L1";

function requireFile(relativePath) {
  const fullPath = path.join(workspaceRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`missing required file: ${relativePath}`);
  }
}

function main() {
  requireFile("cursor-brain/governance/policy-gates.yaml");
  requireFile("cursor-brain/governance/skill-routing-map.yaml");
  requireFile("cursor-brain/governance/run-score.schema.json");
  requireFile("cursor-brain/governance/governance-pack.json");

  if (riskTier === "L2" || riskTier === "L3") {
    requireFile("cursor-brain/governance/decision-log-template.md");
    requireFile("cursor-brain/governance/skill-lineage.json");
    requireFile("cursor-brain/governance/regression-baseline.json");
  }

  console.log(`policy gates validated for ${riskTier}`);
}

try {
  main();
} catch (error) {
  console.error(`policy gate check failed: ${error.message}`);
  process.exit(1);
}
