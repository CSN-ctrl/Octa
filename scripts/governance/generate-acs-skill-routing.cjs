#!/usr/bin/env node
/**
 * Reads .cursor/skills/acs-<name>/SKILL.md (from spencerpauly/awesome-cursor-skills)
 * and writes cursor-brain/governance/_generated-acs-routing.yaml for merge into
 * skill-routing-map.yaml after the Corey Haines haines_* domains.
 *
 * Install/update vendor tree:
 *   git clone https://github.com/spencerpauly/awesome-cursor-skills.git .tmp-awesome-cursor-skills
 *   node scripts/governance/install-awesome-cursor-skills.cjs
 *   node scripts/governance/generate-acs-skill-routing.cjs
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const skillsDir = path.join(root, ".cursor/skills");

function extractDescription(fmBody) {
  const block = fmBody.match(/description:\s*>?\s*\n([\s\S]*?)(?=^[a-z_]+:)/m);
  if (block) return block[1].trim().replace(/\n\s+/g, " ");
  const quoted = fmBody.match(/description:\s*"([\s\S]*?)"\s*(?:\n|$)/m);
  if (quoted) return quoted[1].replace(/\n\s+/g, " ").trim();
  const line = fmBody.match(/description:\s*(.+)/);
  return line ? line[1].trim() : "";
}

function cleanPhrase(s) {
  return String(s || "")
    .replace(/\\"/g, "")
    .replace(/^["']|["']$/g, "")
    .replace(/,$/, "")
    .replace(/[\u2013\u2014\u2015]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function triggersFor(shortId, desc) {
  const t = new Set();
  const push = (s) => {
    const x = cleanPhrase(s);
    if (x.length > 2 && x.length < 56) t.add(x);
  };

  push(shortId.replace(/-/g, " "));
  const useSkill =
    desc.match(/Use this skill when ([^.]+\.?)/i) ||
    desc.match(/Use when ([^.]+\.?)/i);
  if (useSkill) push(useSkill[1].trim().slice(0, 52));

  const when =
    desc.match(/When the user wants ([^.]+\.?)/i) ||
    desc.match(/When the user needs ([^.]+\.?)/i) ||
    desc.match(/When ([^.]+\.?)/i);
  if (when) push(when[1].trim().slice(0, 52));

  const parts = desc.split(/Also use when the user /i).slice(1);
  for (const p of parts.slice(0, 4)) {
    const q =
      p.match(/mentions ["']([^"']+)["']/i) ||
      p.match(/says ["']([^"']+)["']/i);
    if (q) push(q[1]);
  }

  const unescaped = desc.replace(/\\"/g, '"');
  unescaped.replace(/"([^"]{4,48})"/g, (_, x) => push(x));

  const arr = [...t];
  while (arr.length < 4) {
    push(shortId.split("-")[0]);
    break;
  }
  return [...new Set(arr)].slice(0, 8);
}

const dirs = fs
  .readdirSync(skillsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.startsWith("acs-"))
  .map((d) => d.name)
  .sort();

let out = "";
for (const dir of dirs) {
  const shortId = dir.slice(4);
  const mdPath = path.join(skillsDir, dir, "SKILL.md");
  if (!fs.existsSync(mdPath)) continue;
  const md = fs.readFileSync(mdPath, "utf8");
  const fm = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) continue;
  const desc = extractDescription(fm[1]);
  const dom = "awesome_" + shortId.replace(/-/g, "_");
  const tr = triggersFor(shortId, desc);
  out += `  ${dom}:\n    required_skills:\n      - ${dir}\n    intent_triggers:\n`;
  for (const x of tr) {
    const safe = x.replace(/"/g, "'").replace(/\\/g, "");
    out += `      - "${safe}"\n`;
  }
  out += `    path_triggers:\n      - ".cursor/skills/${dir}/**"\n`;
}

const outFile = path.join(
  root,
  "cursor-brain/governance/_generated-acs-routing.yaml"
);
fs.writeFileSync(outFile, out);
console.log(`Wrote ${dirs.length} domains to ${path.relative(root, outFile)}`);
