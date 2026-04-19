import fs from "node:fs";
import path from "node:path";

const workspaceRoot = process.cwd();
const packPath = path.join(workspaceRoot, "cursor-brain/governance/governance-pack.json");
const target = process.argv[2];
const channels = ["dev", "staging", "prod"];

if (!target || !channels.includes(target)) {
  console.error("usage: npm run governance:promote-pack -- <dev|staging|prod>");
  process.exit(1);
}

const pack = JSON.parse(fs.readFileSync(packPath, "utf8"));
if (!pack.channels || channels.some((channel) => !pack.channels.includes(channel))) {
  console.error("governance pack does not define required channels");
  process.exit(1);
}

const fromIdx = channels.indexOf(pack.current_channel);
const toIdx = channels.indexOf(target);
if (toIdx < fromIdx) {
  console.error(`cannot demote from ${pack.current_channel} to ${target}`);
  process.exit(1);
}
if (toIdx - fromIdx > 1) {
  console.error(`cannot skip promotion stages: ${pack.current_channel} -> ${target}`);
  process.exit(1);
}

const [major, minor, patch] = String(pack.version ?? "0.1.0")
  .split(".")
  .map((value) => Number(value));
pack.version = `${major}.${minor}.${(patch || 0) + 1}`;
pack.current_channel = target;
pack.released_at_utc = new Date().toISOString();

fs.writeFileSync(packPath, `${JSON.stringify(pack, null, 2)}\n`, "utf8");
console.log(`promoted governance pack to ${target} as v${pack.version}`);
