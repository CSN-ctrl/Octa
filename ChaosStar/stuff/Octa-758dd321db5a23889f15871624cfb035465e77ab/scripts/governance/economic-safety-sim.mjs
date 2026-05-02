import fs from "node:fs";
import path from "node:path";

const workspaceRoot = process.cwd();
const scenarioPath = path.join(workspaceRoot, "cursor-brain/governance/economic-safety-scenarios.json");
const reportPath = path.join(workspaceRoot, "cursor-brain/governance/.last-economic-sim-report.json");

if (!fs.existsSync(scenarioPath)) {
  console.error("economic simulation failed: missing cursor-brain/governance/economic-safety-scenarios.json");
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(scenarioPath, "utf8"));
const scenarios = config.scenarios ?? [];
if (scenarios.length === 0) {
  console.error("economic simulation failed: no scenarios configured");
  process.exit(1);
}

const results = scenarios.map((scenario) => {
  const reserveRatio = scenario.projected_treasury_balance / Math.max(scenario.projected_liabilities, 1);
  const inflationRate = scenario.projected_minted / Math.max(scenario.projected_burned + scenario.projected_sinks, 1);
  const passReserve = reserveRatio >= config.thresholds.min_reserve_ratio;
  const passInflation = inflationRate <= config.thresholds.max_inflation_ratio;
  return {
    id: scenario.id,
    reserve_ratio: Number(reserveRatio.toFixed(4)),
    inflation_ratio: Number(inflationRate.toFixed(4)),
    pass: passReserve && passInflation,
  };
});

const failed = results.filter((result) => !result.pass);
const report = {
  generated_at_utc: new Date().toISOString(),
  thresholds: config.thresholds,
  results,
  status: failed.length === 0 ? "pass" : "fail",
};

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));

if (failed.length > 0) {
  process.exit(1);
}
