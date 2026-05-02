import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const workspaceRoot = process.cwd();
const routingMapPath = path.join(workspaceRoot, "cursor-brain/governance/skill-routing-map.yaml");
const outDir = path.join(workspaceRoot, "cursor-brain/governance/telemetry");
const outJsonPath = path.join(outDir, "skill-activation-latest.json");
const outMdPath = path.join(outDir, "skill-activation-latest.md");

function loadChangedFiles() {
  const raw = process.env.CHANGED_FILES?.trim();
  if (raw) return raw.split(/\s+/).filter(Boolean);

  const base = process.env.GIT_BASE_REF || "origin/main";
  try {
    return execSync(`git diff --name-only ${base}...HEAD`, { encoding: "utf8" })
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    // Fallback for detached/unrelated histories with no merge-base.
    return execSync("git status --porcelain", { encoding: "utf8" })
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^.. (.+)$/);
        return match ? match[1].trim() : "";
      })
      .filter(Boolean);
  }
}

function globToRegExp(globPattern) {
  const escaped = globPattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const pattern = escaped
    .replace(/\*\*/g, "__DOUBLE_STAR__")
    .replace(/\*/g, "[^/]*")
    .replace(/__DOUBLE_STAR__/g, ".*");
  return new RegExp(`^${pattern}$`);
}

function parseRoutingMap(yamlContent) {
  const lines = yamlContent.split("\n");
  const config = {
    alwaysOnSkills: [],
    catalog: [],
    domains: {},
  };

  let section = "";
  let currentDomain = "";
  let currentDomainField = "";
  let inSkillCatalog = false;
  let inEnforcedSkills = false;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\t/g, "  ");
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    if (/^global:\s*$/.test(trimmed)) {
      section = "global";
      inSkillCatalog = false;
      inEnforcedSkills = false;
      continue;
    }
    if (/^domains:\s*$/.test(trimmed)) {
      section = "domains";
      inSkillCatalog = false;
      inEnforcedSkills = false;
      continue;
    }
    if (/^skill_catalog:\s*$/.test(trimmed)) {
      section = "catalog";
      inSkillCatalog = true;
      inEnforcedSkills = false;
      continue;
    }

    if (section === "global") {
      if (/^always_on_skills:\s*$/.test(trimmed)) continue;
      const item = trimmed.match(/^-\s+([a-z0-9-]+)\s*$/);
      if (item) config.alwaysOnSkills.push(item[1]);
      continue;
    }

    if (section === "catalog" && inSkillCatalog) {
      if (/^enforced_skills:\s*$/.test(trimmed)) {
        inEnforcedSkills = true;
        continue;
      }
      const item = trimmed.match(/^-\s+([a-z0-9-]+)\s*$/);
      if (inEnforcedSkills && item) {
        config.catalog.push(item[1]);
      }
      continue;
    }

    if (section !== "domains") continue;

    const domainHeader = line.match(/^  ([a-z0-9_]+):\s*$/);
    if (domainHeader) {
      currentDomain = domainHeader[1];
      config.domains[currentDomain] = {
        required_skills: [],
        optional_skills: [],
        path_triggers: [],
      };
      currentDomainField = "";
      continue;
    }

    if (!currentDomain) continue;

    const fieldMatch = line.match(/^    (required_skills|optional_skills|path_triggers):\s*$/);
    if (fieldMatch) {
      currentDomainField = fieldMatch[1];
      continue;
    }

    const listItem = line.match(/^      -\s+(.+)\s*$/);
    if (listItem && currentDomainField) {
      const value = listItem[1].replace(/^"|"$/g, "").trim();
      config.domains[currentDomain][currentDomainField].push(value);
    }
  }

  config.alwaysOnSkills = Array.from(new Set(config.alwaysOnSkills)).sort();
  config.catalog = Array.from(new Set(config.catalog)).sort();
  return config;
}

function buildActivationTrace(changedFiles, routingConfig) {
  const activeSkills = new Set(routingConfig.alwaysOnSkills);
  const matchedDomains = [];

  for (const [domainName, domain] of Object.entries(routingConfig.domains)) {
    const triggerMatches = [];
    for (const trigger of domain.path_triggers) {
      const re = globToRegExp(trigger);
      const matchingFiles = changedFiles.filter((file) => re.test(file));
      if (matchingFiles.length) {
        triggerMatches.push({ trigger, files: matchingFiles });
      }
    }

    if (!triggerMatches.length) continue;

    domain.required_skills.forEach((skill) => activeSkills.add(skill));
    domain.optional_skills.forEach((skill) => activeSkills.add(skill));

    matchedDomains.push({
      domain: domainName,
      required_skills: domain.required_skills,
      optional_skills: domain.optional_skills,
      trigger_matches: triggerMatches,
    });
  }

  const activated = Array.from(activeSkills).sort();
  const catalog = routingConfig.catalog.length ? routingConfig.catalog : activated;
  const skipped = catalog
    .filter((skill) => !activeSkills.has(skill))
    .map((skill) => ({ skill, reason: "no matching domain trigger in changed files" }));

  return {
    generated_at: new Date().toISOString(),
    changed_files_count: changedFiles.length,
    changed_files: changedFiles,
    always_on_skills: routingConfig.alwaysOnSkills,
    matched_domains: matchedDomains,
    activated_skills: activated,
    skipped_skills: skipped,
  };
}

function renderMarkdown(trace) {
  const lines = [];
  lines.push("# Skill Activation Trace");
  lines.push("");
  lines.push(`- Generated at: ${trace.generated_at}`);
  lines.push(`- Changed files: ${trace.changed_files_count}`);
  lines.push(`- Activated skills: ${trace.activated_skills.length}`);
  lines.push("");
  lines.push("## Activated Skills");
  lines.push("");
  trace.activated_skills.forEach((skill) => lines.push(`- ${skill}`));
  lines.push("");

  lines.push("## Domain Matches");
  lines.push("");
  if (!trace.matched_domains.length) {
    lines.push("- None (only always-on skills active)");
  } else {
    for (const domain of trace.matched_domains) {
      lines.push(`### ${domain.domain}`);
      lines.push("");
      if (domain.required_skills.length) {
        lines.push(`- Required skills: ${domain.required_skills.join(", ")}`);
      }
      if (domain.optional_skills.length) {
        lines.push(`- Optional skills: ${domain.optional_skills.join(", ")}`);
      }
      domain.trigger_matches.forEach((match) => {
        lines.push(`- Trigger: \`${match.trigger}\``);
        match.files.forEach((file) => lines.push(`  - ${file}`));
      });
      lines.push("");
    }
  }

  lines.push("## Skipped Skills");
  lines.push("");
  if (!trace.skipped_skills.length) {
    lines.push("- None");
  } else {
    trace.skipped_skills.forEach((item) => lines.push(`- ${item.skill}: ${item.reason}`));
  }

  return lines.join("\n") + "\n";
}

if (!fs.existsSync(routingMapPath)) {
  console.error(`Routing map not found: ${routingMapPath}`);
  process.exit(1);
}

const routingMap = fs.readFileSync(routingMapPath, "utf8");
const changedFiles = loadChangedFiles();
const routingConfig = parseRoutingMap(routingMap);
const trace = buildActivationTrace(changedFiles, routingConfig);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outJsonPath, JSON.stringify(trace, null, 2));
fs.writeFileSync(outMdPath, renderMarkdown(trace));

console.log(JSON.stringify(trace, null, 2));
