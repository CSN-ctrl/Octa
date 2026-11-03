import { describe, expect, it } from "vitest";
import {
  scanClientBundleFile,
  stripViteVercelMetadataForScan,
} from "../../../scripts/governance/verify-client-bundle-env-lib.mjs";

describe("verify-client-bundle-env scan", () => {
  it("allows VITE_VERCEL_* metadata without treating it as a full env dump", () => {
    const content = `
      const e = {
        "VITE_VERCEL_GIT_COMMIT_SHA": "abc123",
        "VITE_VERCEL_TARGET_ENV": "production",
        "VITE_VERCEL_ENV": "production",
        "VITE_API_URL": "https://api.example.com",
      };
    `;
    expect(scanClientBundleFile("dist/assets/index.js", content)).toEqual([]);
  });

  it("still fails when server env dump markers appear outside VITE_VERCEL allowance", () => {
    const content = `
      const dump = {
        "VERCEL_GIT_COMMIT_SHA": "x",
        "VERCEL_TARGET_ENV": "production",
        "npm_lifecycle_event": "build",
        "INIT_CWD": "/tmp",
      };
    `;
    const violations = scanClientBundleFile("dist/assets/leak.js", content);
    expect(violations.some((v) => v.includes("full build env dump"))).toBe(true);
  });

  it("still fails on forbidden secret identifiers", () => {
    const content = `const x = "SUPABASE_SERVICE_ROLE";`;
    expect(scanClientBundleFile("dist/assets/index.js", content)).toEqual([
      "dist/assets/index.js: contains forbidden identifier SUPABASE_SERVICE_ROLE",
    ]);
  });

  it("stripViteVercelMetadataForScan removes only VITE_VERCEL keys", () => {
    const raw = `"VITE_VERCEL_ENV":"p","VERCEL_TARGET_ENV":"p","VITE_FOO":"bar"`;
    const stripped = stripViteVercelMetadataForScan(raw);
    expect(stripped).not.toContain("VITE_VERCEL_ENV");
    expect(stripped).toContain("VERCEL_TARGET_ENV");
    expect(stripped).toContain("VITE_FOO");
  });
});
