#!/usr/bin/env node
/**
 * Copies skills from a clone of spencerpauly/awesome-cursor-skills into
 * `.cursor/skills/acs-<id>/` and rewrites SKILL.md `name:` to match (avoids
 * collisions with other vendored skills).
 *
 * Usage:
 *   node scripts/governance/install-awesome-cursor-skills.cjs [path-to-clone]
 * Default clone path: ../../.tmp-awesome-cursor-skills (repo root)
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const defaultClone = path.join(root, ".tmp-awesome-cursor-skills");
const cloneRoot = path.resolve(process.argv[2] || defaultClone);
const resourcesDir = path.join(cloneRoot, "resources");
const skillsDest = path.join(root, ".cursor", "skills");

if (!fs.existsSync(resourcesDir)) {
  console.error("Missing resources dir:", resourcesDir);
  process.exit(1);
}

let installed = 0;
let skipped = 0;

for (const entry of fs.readdirSync(resourcesDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const id = entry.name;
  const src = path.join(resourcesDir, id);
  const destId = `acs-${id}`;
  const dest = path.join(skillsDest, destId);
  const skillFile = path.join(src, "SKILL.md");
  if (!fs.existsSync(skillFile)) {
    console.warn("Skip (no SKILL.md):", id);
    skipped++;
    continue;
  }
  fs.cpSync(src, dest, { recursive: true, force: true });
  const mdPath = path.join(dest, "SKILL.md");
  let md = fs.readFileSync(mdPath, "utf8");
  md = md.replace(/^name:\s*.+$/m, `name: ${destId}`);
  fs.writeFileSync(mdPath, md);
  installed++;
}

console.log(`Installed ${installed} awesome-cursor-skills as acs-* (${skipped} skipped).`);
