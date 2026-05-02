import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const requiredFiles = [
  ".cursor/rules/prompt-execution-governor.mdc",
  ".cursor/skills/prompt-execution-governor/SKILL.md",
  "cursor-brain/governance/policy-gates.yaml",
  "cursor-brain/governance/skill-routing-map.yaml",
  "cursor-brain/governance/run-score.schema.json",
  "cursor-brain/governance/governance-pack.json",
  "cursor-brain/governance/skill-lineage.json",
];

const missing = requiredFiles.filter((file) => !existsSync(resolve(file)));
if (missing.length > 0) {
  console.error("Missing governance artifacts:");
  missing.forEach((file) => console.error(`- ${file}`));
  process.exit(1);
}

const pack = JSON.parse(readFileSync(resolve("cursor-brain/governance/governance-pack.json"), "utf8"));
if (!pack.version || !pack.current_channel || !Array.isArray(pack.channels)) {
  console.error("Invalid governance pack manifest: missing version/channel metadata.");
  process.exit(1);
}

const lineage = JSON.parse(readFileSync(resolve("cursor-brain/governance/skill-lineage.json"), "utf8"));
if (!Array.isArray(lineage.skills)) {
  console.error("Invalid skill lineage format: 'skills' must be an array.");
  process.exit(1);
}

console.log("Governance pack validation passed.");
