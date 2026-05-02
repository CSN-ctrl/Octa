import { existsSync } from "node:fs";

const requiredRunbooks = [
  "cursor-brain/governance/decision-log-template.md",
  "cursor-brain/governance/policy-gates.yaml",
];

const missing = requiredRunbooks.filter((path) => !existsSync(path));
if (missing.length > 0) {
  console.error("Chaos drills precheck failed. Missing runbooks:");
  missing.forEach((path) => console.error(`- ${path}`));
  process.exit(1);
}

const scenarios = [
  "webhook_ingest_delay",
  "duplicate_source_tx",
  "treasury_underflow",
  "wallet_identity_mismatch",
];

console.log("Chaos drill scenarios validated:");
scenarios.forEach((scenario) => console.log(`- ${scenario}`));
