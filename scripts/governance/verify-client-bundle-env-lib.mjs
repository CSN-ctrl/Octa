/** Shared scan logic for post-build client bundle env guard (also used in tests). */

/** Substrings that must never appear in shipped client assets (names only — no values). */
export const FORBIDDEN_SUBSTRINGS = [
  "VERCEL_OIDC_TOKEN",
  "VERCEL_ARTIFACTS_TOKEN",
  "VERCEL_DEPLOYMENT_KEY",
  "VERCEL_ENV_ENC_KEY",
  "VERCEL_ENCRYPTED_ENV_CONTENT",
  "VERCEL_HASH_SALT",
  "TURBO_TEAM",
  "TURBO_TOKEN",
  "TURBO_REMOTE_ONLY",
  "GITHUB_TOKEN",
  "SUPABASE_SERVICE_ROLE",
];

/**
 * Markers that suggest a full Node/build env object was inlined (not Vite-prefixed client vars).
 * VITE_VERCEL_* is allowed system metadata — see stripViteVercelMetadataForScan.
 */
export const ENV_DUMP_MARKERS = ["VERCEL_GIT_", "VERCEL_TARGET_ENV", "npm_lifecycle", "INIT_CWD"];

/** Vercel exposes these to the client build; not secrets. */
export const VITE_VERCEL_KEY_PATTERN = /"VITE_VERCEL_[A-Z0-9_]+":/g;

export function stripViteVercelMetadataForScan(content) {
  return content.replace(VITE_VERCEL_KEY_PATTERN, "");
}

export function countAllCapsEnvLikeKeys(content) {
  const matches = content.match(/"[A-Z][A-Z0-9_]{2,}":/g);
  return matches ? matches.length : 0;
}

/**
 * @param {string} relPath path relative to repo root (used for .js heuristic)
 * @param {string} content file contents
 * @returns {string[]} violation messages
 */
export function scanClientBundleFile(relPath, content) {
  const violations = [];
  const scanContent = stripViteVercelMetadataForScan(content);

  for (const needle of FORBIDDEN_SUBSTRINGS) {
    if (content.includes(needle)) {
      violations.push(`${relPath}: contains forbidden identifier ${needle}`);
    }
  }

  const markerHits = ENV_DUMP_MARKERS.filter((m) => scanContent.includes(m));
  if (markerHits.length >= 2) {
    violations.push(`${relPath}: looks like a full build env dump (${markerHits.join(", ")})`);
  }

  if (relPath.endsWith(".js")) {
    const keyCount = countAllCapsEnvLikeKeys(scanContent);
    if (keyCount > 120) {
      violations.push(
        `${relPath}: excessive inlined env-like keys (${keyCount}), possible env object leak`,
      );
    }
  }

  return violations;
}
