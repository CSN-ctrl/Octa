#!/usr/bin/env node
/**
 * Bundle consolidated `/api/*.ts` entrypoints for Vercel serverless.
 * Vercel's file tracer does not reliably follow the full TypeScript graph;
 * esbuild produces a single CJS artifact per domain under api/_lib/bundles/.
 */
import esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const bundlesDir = path.join(repoRoot, "api/_lib/bundles");

const ENTRIES = [
  { source: "nodes-source.ts", out: "nodes.cjs" },
  { source: "permits-source.ts", out: "permits.cjs" },
  { source: "misc-source.ts", out: "misc.cjs" },
];

fs.mkdirSync(bundlesDir, { recursive: true });

for (const { source, out } of ENTRIES) {
  const entry = path.join(bundlesDir, source);
  await esbuild.build({
    entryPoints: [entry],
    outfile: path.join(bundlesDir, out),
    bundle: true,
    platform: "node",
    format: "cjs",
    target: "node20",
    sourcemap: false,
    logLevel: "warning",
    external: [],
  });
  console.log(`Bundled Vercel API entry -> api/_lib/bundles/${out}`);
}
