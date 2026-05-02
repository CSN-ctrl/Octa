import fs from "node:fs";
import path from "node:path";

const workspaceRoot = process.cwd();
const baselinePath = path.join(workspaceRoot, "cursor-brain/governance/regression-baseline.json");

function walkFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

function toRegex(pattern) {
  return new RegExp(pattern, "m");
}

if (!fs.existsSync(baselinePath)) {
  console.error("regression guard failed: missing cursor-brain/governance/regression-baseline.json");
  process.exit(1);
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
const rules = baseline.prevented_regressions ?? [];
const repoFiles = walkFiles(path.join(workspaceRoot, "src"));
const violations = [];

for (const rule of rules) {
  const regex = toRegex(rule.detect_pattern);
  const scopedFiles = repoFiles.filter((file) => file.includes(`/${rule.scope_prefix}/`) || file.endsWith(`/${rule.scope_prefix}`));
  for (const file of scopedFiles) {
    const content = fs.readFileSync(file, "utf8");
    if (regex.test(content)) {
      violations.push({
        rule_id: rule.id,
        file: path.relative(workspaceRoot, file),
        message: rule.description,
      });
    }
  }
}

if (violations.length > 0) {
  console.error("temporal regression guard found violations:");
  for (const violation of violations) {
    console.error(`- [${violation.rule_id}] ${violation.file}: ${violation.message}`);
  }
  process.exit(1);
}

console.log(`temporal regression guard passed (${rules.length} regression patterns checked)`);
