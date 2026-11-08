#!/usr/bin/env node
/**
 * One-time helper: moves api route entry files into api/_lib/handlers and fixes _lib imports.
 * Safe to re-run only on a clean tree (skips if destination exists).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const apiRoot = path.join(repoRoot, "api");
const handlersRoot = path.join(apiRoot, "_lib", "handlers");

function listRouteFiles(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith("_")) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      listRouteFiles(full, acc);
    } else if (name.endsWith(".ts") && !name.endsWith(".test.ts")) {
      acc.push(full);
    }
  }
  return acc;
}

function libPrefix(relativeFromHandlers) {
  const depth = relativeFromHandlers.split("/").length;
  return "../".repeat(depth);
}

function rewriteSource(source, relativeFromHandlers) {
  const prefix = libPrefix(relativeFromHandlers);
  let out = source.replace(
    /from "(\.\.\/)+_lib\/([^"]+)"/g,
    (_m, _dots, tail) => `from "${prefix}${tail}"`,
  );
  out = out.replace(
    /export default async function handler/g,
    "export async function handler",
  );
  return out;
}

const skip = new Set([
  path.join(apiRoot, "[...path].ts"),
]);

const routeFiles = listRouteFiles(apiRoot).filter((f) => !f.includes(`${path.sep}_lib${path.sep}`));
routeFiles.sort();

for (const src of routeFiles) {
  if (skip.has(src)) continue;
  const rel = path.relative(apiRoot, src);
  const dest = path.join(handlersRoot, rel);
  if (fs.existsSync(dest)) {
    console.log("skip exists", rel);
    continue;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const relFromHandlers = path.relative(handlersRoot, dest);
  const rewritten = rewriteSource(fs.readFileSync(src, "utf8"), relFromHandlers);
  fs.writeFileSync(dest, rewritten);
  fs.unlinkSync(src);
  console.log("moved", rel);
}

// Remove empty directories under api (except _lib and catch-all)
function pruneEmpty(dir) {
  if (dir === handlersRoot || dir === path.join(apiRoot, "_lib")) return;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) pruneEmpty(full);
  }
  if (dir === apiRoot) return;
  if (fs.readdirSync(dir).length === 0) {
    fs.rmdirSync(dir);
  }
}
pruneEmpty(apiRoot);

console.log("done", routeFiles.length, "routes");
