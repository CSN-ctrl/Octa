import { execSync } from "node:child_process";
import { appendFileSync } from "node:fs";

const raw = process.env.CHANGED_FILES?.trim();
const files = raw
  ? raw.split(/\s+/).filter(Boolean)
  : execSync("git diff --name-only origin/main...HEAD", { encoding: "utf8" })
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

const has = (prefixes) => files.some((file) => prefixes.some((prefix) => file.startsWith(prefix)));

const l3Prefixes = ["supabase/migrations/", "supabase/functions/", "src/hooks/useUSDCDeposit.ts", "src/pages/Login.tsx"];
const l2Prefixes = ["src/lib/", "src/contexts/", ".cursor/skills/", ".cursor/rules/", ".github/workflows/"];
const l1Prefixes = ["src/components/", "src/pages/", "public/"];

let tier = "L0";
if (has(l3Prefixes)) tier = "L3";
else if (has(l2Prefixes)) tier = "L2";
else if (has(l1Prefixes)) tier = "L1";

const output = process.env.GITHUB_OUTPUT;
if (output) {
  const lines = [
    `risk_tier=${tier}`,
    `changed_files_count=${files.length}`,
  ];
  appendFileSync(output, lines.join("\n") + "\n");
} else {
  console.log(JSON.stringify({ risk_tier: tier, changed_files_count: files.length }, null, 2));
}
