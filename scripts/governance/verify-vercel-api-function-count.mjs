#!/usr/bin/env node
/**
 * Ensures the Vercel Hobby plan limit (12 serverless functions) is not exceeded.
 * Counts deployable entrypoints under api/ (TypeScript/JavaScript), excluding
 * underscore-prefixed path segments (e.g. api/_lib).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const apiRoot = path.join(repoRoot, "api");
const MAX_FUNCTIONS = 12;

const ENTRY_SUFFIXES = [".ts", ".js", ".mts", ".mjs"];

function isUnderscoreSegment(segment) {
  return segment.startsWith("_");
}

function countFunctionEntries(dir) {
  let count = 0;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const relFromApi = path.relative(apiRoot, full);
    const segments = relFromApi.split(path.sep);
    if (segments.some(isUnderscoreSegment)) {
      continue;
    }
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      count += countFunctionEntries(full);
      continue;
    }
    if (ENTRY_SUFFIXES.some((suffix) => name.endsWith(suffix))) {
      count += 1;
    }
  }
  return count;
}

const total = countFunctionEntries(apiRoot);

if (total > MAX_FUNCTIONS) {
  console.error(
    `Vercel API function count ${total} exceeds Hobby limit ${MAX_FUNCTIONS}. ` +
      "Consolidate routes under api/[...path].ts or move helpers under api/_lib/.",
  );
  process.exit(1);
}

console.log(`Vercel API function count OK: ${total} (limit ${MAX_FUNCTIONS})`);
