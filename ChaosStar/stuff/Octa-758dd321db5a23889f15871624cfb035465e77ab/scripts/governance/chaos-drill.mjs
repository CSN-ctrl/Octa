import fs from "node:fs";
import path from "node:path";

const workspaceRoot = process.cwd();
const drillsPath = path.join(workspaceRoot, "cursor-brain/governance/chaos-drills.json");
const reportPath = path.join(workspaceRoot, "cursor-brain/governance/.last-chaos-drill-report.json");

if (!fs.existsSync(drillsPath)) {
  console.error("chaos drill failed: missing cursor-brain/governance/chaos-drills.json");
  process.exit(1);
}

const drillConfig = JSON.parse(fs.readFileSync(drillsPath, "utf8"));
const drills = drillConfig.drills ?? [];
if (drills.length === 0) {
  console.error("chaos drill failed: no drill scenarios configured");
  process.exit(1);
}

const now = Date.now();
const runs = drills.map((drill) => {
  const dueAt = new Date(drill.next_due_utc).getTime();
  const overdue = Number.isFinite(dueAt) ? now > dueAt : true;
  return {
    id: drill.id,
    target: drill.target,
    severity: drill.severity,
    overdue,
    runbook: drill.runbook,
    pass: !overdue,
  };
});

const overdue = runs.filter((run) => run.overdue);
const report = {
  generated_at_utc: new Date().toISOString(),
  drill_count: drills.length,
  overdue_count: overdue.length,
  status: overdue.length === 0 ? "pass" : "fail",
  runs,
};

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));

if (overdue.length > 0) {
  process.exit(1);
}
