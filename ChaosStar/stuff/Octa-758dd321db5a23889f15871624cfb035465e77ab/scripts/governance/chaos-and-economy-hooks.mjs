import { execSync } from "node:child_process";

const runChaos = process.env.REQUIRE_CHAOS_DRILL === "true";
const runEconomy = process.env.REQUIRE_ECONOMIC_SIMULATION === "true";

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

if (!runChaos && !runEconomy) {
  console.log("governance hooks skipped: no chaos/economic hook required");
  process.exit(0);
}

if (runChaos) {
  run("npm run chaos:drill");
}

if (runEconomy) {
  run("npm run economy:simulate");
}

console.log("governance hooks passed");
