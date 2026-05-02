#!/usr/bin/env node
/**
 * Reads .cursor/skills/figma-<name>/SKILL.md (from figma/mcp-server-guide, Cursor Figma plugin)
 * and writes cursor-brain/governance/_generated-figma-routing.yaml for merge.
 *
 * Refresh vendor copy:
 *   git clone --depth 1 https://github.com/figma/mcp-server-guide.git .tmp-figma
 *   cp -r .tmp-figma/skills/figma-* .cursor/skills/
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

function triggersFor(id, desc) {
  const t = new Set();
  const push = (s) => {
    const x = cleanPhrase(s);
    if (x.length > 2 && x.length < 56) t.add(x);
  };

  push(id.replace(/-/g, " "));
  const useSkill =
    desc.match(/Use this skill ([^.]+\.?)/i) ||
    desc.match(/Use when ([^.]+\.?)/i);
  if (useSkill) push(useSkill[1].trim().slice(0, 52));

  const when =
    desc.match(/When the user wants ([^.]+\.?)/i) ||
    desc.match(/Triggers:\s*([^.]+\.?)/i);
  if (when) push(when[1].trim().slice(0, 52));

  const unescaped = desc.replace(/\\"/g, '"');
  unescaped.replace(/'([^']{4,48})'/g, (_, x) => push(x));

  const arr = [...t];
  while (arr.length < 4) {
    push(id.split("-")[1] || id.split("-")[0]);
    break;
  }
  return [...new Set(arr)].slice(0, 8);
}

const dirs = fs
  .readdirSync(skillsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.startsWith("figma-"))
  .map((d) => d.name)
  .sort();

let out = "";
for (const dir of dirs) {
  const mdPath = path.join(skillsDir, dir, "SKILL.md");
  if (!fs.existsSync(mdPath)) continue;
  const md = fs.readFileSync(mdPath, "utf8");
  const fm = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) continue;
  const desc = extractDescription(fm[1]);
  const dom = "figma_plugin_" + dir.replace(/^figma-/, "").replace(/-/g, "_");
  const tr = triggersFor(dir, desc);
  out += `  ${dom}:\n    required_skills:\n      - ${dir}\n    intent_triggers:\n`;
  for (const x of tr) {
    const safe = x.replace(/"/g, "'").replace(/\\/g, "");
    out += `      - "${safe}"\n`;
  }
  out += `    path_triggers:\n      - ".cursor/skills/${dir}/**"\n`;
}

const outFile = path.join(
  root,
  "cursor-brain/governance/_generated-figma-routing.yaml"
);
fs.writeFileSync(outFile, out);
console.log(`Wrote ${dirs.length} domains to ${path.relative(root, outFile)}`);
