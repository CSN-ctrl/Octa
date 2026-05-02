#!/usr/bin/env node
/**
 * Reads Corey Haines-style skills under .cursor/skills/ and writes
 * cursor-brain/governance/_generated-haines-routing.yaml for manual merge into
 * skill-routing-map.yaml (replace the `haines_*` domain block after
 * pirate_marketing_conversion_module). After upstream skill updates, refresh
 * .cursor/skills from https://github.com/coreyhaines31/marketingskills then run:
 *   node scripts/governance/generate-haines-skill-routing.cjs
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const skillsDir = path.join(root, ".cursor/skills");

const skip = new Set([
  "prompt-execution-governor",
  "auth-wallet-identity-linking-playbook",
  "ci-quality-gates-for-risky-domains",
  "deposit-auto-credit-mvp-hardening",
  "foundry-sandbox-alignment-and-contract-test-porting",
  "frontend-domain-service-modularization",
  "game-economy-data-model-and-simulation-governance",
  "hybrid-onchain-offchain-sync-contract",
  "living-architecture-doc-curation",
  "mcp-ops-safety-and-audit-trail",
  "onchain-ingestion-and-auto-credit",
  "supabase-rls-hardening-and-policy-design",
  "supabase-rpc-ledger-idempotency-patterns",
]);

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

function triggersFor(name, desc) {
  const t = new Set();
  const push = (s) => {
    const x = cleanPhrase(s);
    if (x.length > 2 && x.length < 56) t.add(x);
  };

  push(name.replace(/-/g, " "));
  const when =
    desc.match(/When the user wants ([^.]+\.?)/i) ||
    desc.match(/When the user needs ([^.]+\.?)/i) ||
    desc.match(/Use when the user ([^.]+\.?)/i);
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
    push(name.split("-")[0]);
    break;
  }
  return [...new Set(arr)].slice(0, 8);
}

const dirs = fs
  .readdirSync(skillsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .filter(
    (d) =>
      !skip.has(d) &&
      !d.startsWith("pirate-codex-") &&
      !d.startsWith("acs-") &&
      !d.startsWith("figma-")
  )
  .sort();

let out = "";
for (const dir of dirs) {
  const mdPath = path.join(skillsDir, dir, "SKILL.md");
  if (!fs.existsSync(mdPath)) continue;
  const md = fs.readFileSync(mdPath, "utf8");
  const fm = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fm) continue;
  const desc = extractDescription(fm[1]);
  const dom = "haines_" + dir.replace(/-/g, "_");
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
  "cursor-brain/governance/_generated-haines-routing.yaml"
);
fs.writeFileSync(outFile, out);
console.log(`Wrote ${dirs.length} domains to ${path.relative(root, outFile)}`);
