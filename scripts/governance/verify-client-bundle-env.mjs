/**
 * Post-build guard: client bundles must not contain server/build secrets or full env dumps.
 * Wired into `npm run build` — also runs in CI via the Build step.
 */
import fs from "node:fs";
import path from "node:path";
import { scanClientBundleFile } from "./verify-client-bundle-env-lib.mjs";

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

if (!fs.existsSync(distRoot)) {
  console.error("verify-client-bundle-env: dist/ missing — run vite build first.");
  process.exit(1);
}

const files = walkFiles(distRoot);
const violations = [];

for (const file of files) {
  const rel = path.relative(workspaceRoot, file);
  const content = fs.readFileSync(file, "utf8");
  violations.push(...scanClientBundleFile(rel, content));
}

if (violations.length > 0) {
  console.error("verify-client-bundle-env failed:");
  for (const v of violations) {
    console.error(`- ${v}`);
  }
  process.exit(1);
}

console.log(`verify-client-bundle-env: OK (${files.length} files scanned)`);
