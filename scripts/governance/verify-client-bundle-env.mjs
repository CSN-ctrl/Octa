/**
 * Post-build guard: client bundles must not contain server/build secrets or full env dumps.
 * Wired into `npm run build` — also runs in CI via the Build step.
 */
import fs from "node:fs";
import path from "node:path";

const workspaceRoot = process.cwd();
const distRoot = path.join(workspaceRoot, "dist");

const viteConfigPath = path.join(workspaceRoot, "vite.config.ts");
if (fs.existsSync(viteConfigPath)) {
  const viteConfig = fs.readFileSync(viteConfigPath, "utf8");
  if (/\.\.\.process\.env/.test(viteConfig)) {
    console.error(
      "verify-client-bundle-env: vite.config.ts must not spread process.env into define (client secret leak).",
    );
    process.exit(1);
  }
}

/** Substrings that must never appear in shipped client assets (names only — no values). */
const FORBIDDEN_SUBSTRINGS = [
  "VERCEL_OIDC_TOKEN",
  "VERCEL_ARTIFACTS_TOKEN",
  "VERCEL_DEPLOYMENT_KEY",
  "VERCEL_ENV_ENC_KEY",
  "VERCEL_ENCRYPTED_ENV_CONTENT",
  "VERCEL_HASH_SALT",
  "TURBO_TEAM",
  "TURBO_TOKEN",
  "TURBO_REMOTE_ONLY",
  "GITHUB_TOKEN",
  "SUPABASE_SERVICE_ROLE",
];

/** Heuristic: a inlined full process.env dump often includes these together with many ALL_CAPS keys. */
const ENV_DUMP_MARKERS = ["VERCEL_GIT_", "VERCEL_TARGET_ENV", "npm_lifecycle", "INIT_CWD"];

function walkFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) {
    return acc;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(full, acc);
    } else if (/\.(js|mjs|cjs|html|css)$/i.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

function countAllCapsEnvLikeKeys(content) {
  const matches = content.match(/"[A-Z][A-Z0-9_]{2,}":/g);
  return matches ? matches.length : 0;
}

if (!fs.existsSync(distRoot)) {
  console.error("verify-client-bundle-env: dist/ missing — run vite build first.");
  process.exit(1);
}

const files = walkFiles(distRoot);
const violations = [];

for (const file of files) {
  const rel = path.relative(workspaceRoot, file);
  const content = fs.readFileSync(file, "utf8");

  for (const needle of FORBIDDEN_SUBSTRINGS) {
    if (content.includes(needle)) {
      violations.push(`${rel}: contains forbidden identifier ${needle}`);
    }
  }

  const markerHits = ENV_DUMP_MARKERS.filter((m) => content.includes(m));
  if (markerHits.length >= 2) {
    violations.push(
      `${rel}: looks like a full build env dump (${markerHits.join(", ")})`,
    );
  }

  if (file.endsWith(".js") && countAllCapsEnvLikeKeys(content) > 120) {
    violations.push(
      `${rel}: excessive inlined env-like keys (${countAllCapsEnvLikeKeys(content)}), possible env object leak`,
    );
  }
}

if (violations.length > 0) {
  console.error("verify-client-bundle-env failed:");
  for (const v of violations) {
    console.error(`- ${v}`);
  }
  process.exit(1);
}

console.log(`verify-client-bundle-env: OK (${files.length} files scanned)`);
