import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const workspaceRoot = process.cwd();
const gitRoot = execSync("git rev-parse --show-toplevel", {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
})
  .trim();
const workspaceFromGitRoot = path.relative(gitRoot, workspaceRoot).replace(/\\/g, "/");

function getChangedFiles() {
  const explicitBase = process.env.RISK_BASE_REF;
  const explicitHead = process.env.RISK_HEAD_REF ?? "HEAD";

  let diffRange = "";
  if (explicitBase) {
    diffRange = `${explicitBase}...${explicitHead}`;
  } else if (process.env.GITHUB_BASE_REF) {
    diffRange = `origin/${process.env.GITHUB_BASE_REF}...${explicitHead}`;
  } else {
    diffRange = "HEAD~1...HEAD";
  }

  try {
    const output = execSync(`git diff --name-only ${diffRange}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => normalizePath(line));
  } catch {
    return [];
  }
}

function normalizePath(file) {
  const unixPath = file.replace(/\\/g, "/");
  if (!workspaceFromGitRoot || workspaceFromGitRoot === ".") {
    return unixPath;
  }
  const prefix = `${workspaceFromGitRoot}/`;
  return unixPath.startsWith(prefix) ? unixPath.slice(prefix.length) : unixPath;
}

function includesAny(file, patterns) {
  return patterns.some((pattern) => {
    if (pattern.endsWith("/**")) {
      return file.startsWith(pattern.slice(0, -3));
    }
    if (pattern.endsWith("*")) {
      return file.startsWith(pattern.slice(0, -1));
    }
    return file === pattern || file.startsWith(pattern);
  });
}

const files = getChangedFiles();

const l3Patterns = [
  "supabase/migrations/**",
  "supabase/functions/ingest-treasury-deposits/**",
  "supabase/remote_apply/**",
  "src/hooks/useUSDCDeposit.ts",
  "src/contexts/WalletContext.tsx",
  "src/pages/Login.tsx",
  "src/components/ProtectedRoute.tsx",
  "src/components/Treasury*.tsx",
];
const l2Patterns = [
  ".github/workflows/**",
  ".cursor/rules/**",
  ".cursor/skills/**",
  "cursor-brain/governance/**",
  "scripts/governance/**",
];
const l1Patterns = ["src/**", "index.html", "vite.config.ts", "package.json"];

let riskTier = "L0";
if (files.some((file) => includesAny(file, l3Patterns))) {
  riskTier = "L3";
} else if (files.some((file) => includesAny(file, l2Patterns))) {
  riskTier = "L2";
} else if (files.some((file) => includesAny(file, l1Patterns))) {
  riskTier = "L1";
}

const touchesEconomyOrTreasury = files.some((file) =>
  /(treasury|deposit|ledger|market|econom|token|balance|reward|pricing)/i.test(file),
);
const touchesAuthOrAdmin = files.some((file) =>
  /(auth|wallet|login|protectedroute|admin)/i.test(file),
);
const touchesGovernance = files.some((file) =>
  includesAny(file, [".github/workflows/**", ".cursor/**", "cursor-brain/governance/**", "scripts/governance/**"]),
);
const touchedDomains = {
  migration: files.some((file) => includesAny(file, ["supabase/migrations/**"])),
  deposit_ledger: files.some((file) =>
    includesAny(file, ["supabase/functions/ingest-treasury-deposits/**", "src/hooks/useUSDCDeposit.ts", "src/components/Treasury*.tsx"]),
  ),
  auth_wallet: files.some((file) =>
    includesAny(file, ["src/pages/Login.tsx", "src/contexts/WalletContext.tsx", "src/components/ProtectedRoute.tsx"]),
  ),
  ops_remote_apply: files.some((file) => includesAny(file, ["supabase/remote_apply/**", "scripts/**"])),
  frontend_refactor: files.some((file) => includesAny(file, ["src/lib/supabase-service.ts"])),
  docs_architecture: files.some((file) => includesAny(file, ["docs/**", "cursor-brain/**"])),
};

const result = {
  risk_tier: riskTier,
  changed_files: files,
  touched_domains: touchedDomains,
  touches_governance: touchesGovernance,
  touches_auth_or_admin: touchesAuthOrAdmin,
  touches_ledger_or_deposit: touchesEconomyOrTreasury,
  require_chaos_drill: riskTier === "L3" || touchesEconomyOrTreasury,
  require_economic_simulation: touchesEconomyOrTreasury,
};

const outputFile = path.join(workspaceRoot, "cursor-brain/governance/.last-risk-assessment.json");
fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, `${JSON.stringify(result, null, 2)}\n`, "utf8");

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `risk_tier=${result.risk_tier}\n`, "utf8");
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `require_chaos_drill=${result.require_chaos_drill}\n`,
    "utf8",
  );
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `require_economic_simulation=${result.require_economic_simulation}\n`,
    "utf8",
  );
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `touches_governance=${result.touches_governance}\n`, "utf8");
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `touches_auth_or_admin=${result.touches_auth_or_admin}\n`, "utf8");
  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `touches_ledger_or_deposit=${result.touches_ledger_or_deposit}\n`,
    "utf8",
  );
}

console.log(JSON.stringify(result, null, 2));
