import fs from "node:fs";
import path from "node:path";

const workspaceRoot = process.cwd();
const skillsDir = path.join(workspaceRoot, ".cursor/skills");
const routingMapPath = path.join(workspaceRoot, "cursor-brain/governance/skill-routing-map.yaml");

function listSkillNames(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .filter((entry) => fs.existsSync(path.join(dirPath, entry.name, "SKILL.md")))
    .map((entry) => entry.name)
    .sort();
}

function parseEnforcedSkills(yamlContent) {
  const lines = yamlContent.split("\n");
  const results = [];
  let inCatalog = false;
  let inList = false;

  for (const line of lines) {
    if (!inCatalog && /^\s*skill_catalog:\s*$/.test(line)) {
      inCatalog = true;
      continue;
    }
    if (inCatalog && !inList && /^\s*enforced_skills:\s*$/.test(line)) {
      inList = true;
      continue;
    }
    if (inCatalog && inList) {
      const itemMatch = line.match(/^\s*-\s+([a-z0-9-]+)\s*$/);
      if (itemMatch) {
        results.push(itemMatch[1]);
        continue;
      }
      if (/^\S/.test(line) || (/^\s*[a-zA-Z_][^:]*:\s*$/.test(line) && !/^\s{2,}/.test(line))) {
        break;
      }
    }
  }

  return Array.from(new Set(results)).sort();
}

if (!fs.existsSync(routingMapPath)) {
  console.error("Skill routing map not found:", routingMapPath);
  process.exit(1);
}

const skillDirs = listSkillNames(skillsDir);
const routingMap = fs.readFileSync(routingMapPath, "utf8");
const enforced = parseEnforcedSkills(routingMap);

const missingInRouting = skillDirs.filter((skill) => !enforced.includes(skill));
const unknownInRouting = enforced.filter((skill) => !skillDirs.includes(skill));

if (missingInRouting.length || unknownInRouting.length) {
  console.error("Skill routing coverage check failed.");
  if (missingInRouting.length) {
    console.error("Missing in skill_catalog.enforced_skills:");
    missingInRouting.forEach((name) => console.error(`- ${name}`));
  }
  if (unknownInRouting.length) {
    console.error("Listed in enforced_skills but missing skill directory:");
    unknownInRouting.forEach((name) => console.error(`- ${name}`));
  }
  process.exit(1);
}

console.log(`Skill routing coverage check passed (${skillDirs.length} skills mapped).`);
