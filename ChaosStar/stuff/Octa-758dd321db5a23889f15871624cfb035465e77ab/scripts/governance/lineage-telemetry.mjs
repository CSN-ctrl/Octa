import fs from "node:fs";
import path from "node:path";

const workspaceRoot = process.cwd();
const lineagePath = path.join(workspaceRoot, "cursor-brain/governance/skill-lineage.json");
const runsDir = path.join(workspaceRoot, "cursor-brain/governance/telemetry/runs");

if (!fs.existsSync(lineagePath)) {
  console.error("lineage telemetry failed: missing cursor-brain/governance/skill-lineage.json");
  process.exit(1);
}

const lineage = JSON.parse(fs.readFileSync(lineagePath, "utf8"));
const telemetry = {
  generated_at_utc: new Date().toISOString(),
  risk_tier: process.env.RISK_TIER ?? "unknown",
  commit_sha: process.env.GITHUB_SHA ?? "local",
  ref_name: process.env.GITHUB_REF_NAME ?? "local",
  workflow: process.env.GITHUB_WORKFLOW ?? "local",
  lineage_version: lineage.version ?? "unknown",
  tracked_skills: (lineage.skills ?? []).length,
};

fs.mkdirSync(runsDir, { recursive: true });
const safeTs = telemetry.generated_at_utc.replace(/[:.]/g, "-");
const outPath = path.join(runsDir, `${safeTs}.json`);
fs.writeFileSync(outPath, `${JSON.stringify(telemetry, null, 2)}\n`, "utf8");

console.log(JSON.stringify(telemetry, null, 2));
