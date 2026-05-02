#!/usr/bin/env node
/**
 * Sparse-clones sanjeed5/awesome-cursor-rules-mdc into docs/references/awesome-cursor-rules-mdc
 * (rules-mdc + docs only) to avoid Windows MAX_PATH failures from rules-v0-deprecated.
 *
 * Requires git on PATH.
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const dest = path.join(root, "docs/references/awesome-cursor-rules-mdc");

if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true, force: true });
}
fs.mkdirSync(path.dirname(dest), { recursive: true });

execSync(`git clone --depth 1 --filter=blob:none --sparse https://github.com/sanjeed5/awesome-cursor-rules-mdc.git "${dest}"`, {
  stdio: "inherit",
  cwd: root,
});

const sparse = ["rules-mdc", "cursor-rules-docs.md", "cursor-rules-reference.md", "rules.json", "README.md", "LICENSE"].join("\n");
fs.writeFileSync(path.join(dest, ".git/info/sparse-checkout"), sparse + "\n");

execSync("git sparse-checkout reapply", { stdio: "inherit", cwd: dest });

console.log(`OK: ${path.relative(root, dest)}`);
