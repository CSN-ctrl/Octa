#!/usr/bin/env node
/**
 * Publishes this repo's `.cursor/skills` and `.cursor/rules` into the **user-global**
 * Cursor directory so Agent skills + rules apply in **all** workspaces:
 *
 *   ~/.cursor/skills/<skill-id>/
 *   ~/.cursor/rules/<name>.mdc
 *
 * Windows: %USERPROFILE%\.cursor\...
 *
 * Override destination root: CURSOR_GLOBAL_ROOT=/path/to/.cursor
 *
 * Usage:
 *   node scripts/governance/publish-cursor-global.cjs
 *   node scripts/governance/publish-cursor-global.cjs --dry-run
 */
const fs = require("fs");
const path = require("path");
const os = require("os");

const dryRun = process.argv.includes("--dry-run");
const root = path.resolve(__dirname, "../..");
const globalRoot =
  process.env.CURSOR_GLOBAL_ROOT || path.join(os.homedir(), ".cursor");

function mergeCopyDir(srcDir, destDir, label) {
  if (!fs.existsSync(srcDir)) {
    console.warn(`[skip] missing ${label}: ${srcDir}`);
    return;
  }
  if (dryRun) {
    console.log(`[dry-run] would merge ${srcDir} -> ${destDir}`);
    return;
  }
  fs.mkdirSync(destDir, { recursive: true });
  let count = 0;
  for (const ent of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const from = path.join(srcDir, ent.name);
    const to = path.join(destDir, ent.name);
    fs.rmSync(to, { recursive: true, force: true });
    fs.cpSync(from, to, { recursive: true });
    count++;
  }
  console.log(`[ok] ${label}: merged ${count} entries into ${destDir}`);
}

mergeCopyDir(
  path.join(root, ".cursor", "skills"),
  path.join(globalRoot, "skills"),
  "skills"
);
mergeCopyDir(
  path.join(root, ".cursor", "rules"),
  path.join(globalRoot, "rules"),
  "rules"
);

if (!dryRun) {
  console.log(
    `\nGlobal Cursor path: ${globalRoot}\nRestart Cursor or open a new chat if rules/skills do not refresh immediately.\n`
  );
}
