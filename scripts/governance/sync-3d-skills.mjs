#!/usr/bin/env node
/**
 * Re-copy external 3D skills from .agents/skills (npx skills add target) into
 * canonical .cursor/skills for Cursor routing and governance checks.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceDir = path.join(root, ".agents/skills");
const targetDir = path.join(root, ".cursor/skills");

const SKILLS = [
  "3d-web-experience",
  "r3f-best-practices",
  "three-best-practices",
  "r3f-fundamentals",
  "r3f-geometry",
  "r3f-interaction",
  "r3f-lighting",
  "r3f-loaders",
  "r3f-materials",
  "r3f-postprocessing",
];

if (!fs.existsSync(sourceDir)) {
  console.error(
    "Missing .agents/skills. Install first:\n" +
      "  npx skills add emalorenzo/three-agent-skills --skill r3f-best-practices --skill three-best-practices --agent cursor -y --copy\n" +
      "  npx skills add EnzeD/r3f-skills --skill r3f-fundamentals r3f-geometry r3f-loaders r3f-materials r3f-lighting r3f-postprocessing r3f-interaction --agent cursor -y --copy\n" +
      "  npx skills add sickn33/antigravity-awesome-skills --skill 3d-web-experience --agent cursor -y --copy",
  );
  process.exit(1);
}

for (const name of SKILLS) {
  const src = path.join(sourceDir, name);
  const dest = path.join(targetDir, name);
  if (!fs.existsSync(path.join(src, "SKILL.md"))) {
    console.error(`Skip missing: ${name}`);
    continue;
  }
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
  console.log(`Synced ${name}`);
}

console.log("Done. Run: npm run governance:check-skill-routing");
