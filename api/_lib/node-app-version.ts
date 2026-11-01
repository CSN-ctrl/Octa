/** Semver-ish client build id: 1–64 chars, alnum + . _ - + */
const APP_VERSION_RE = /^[0-9A-Za-z._+-]{1,64}$/;

export function normalizeAppVersion(raw: unknown): { ok: true; value: string } | { ok: false; error: "app_version_invalid" } {
  if (raw === undefined || raw === null) {
    return { ok: false, error: "app_version_invalid" };
  }
  if (typeof raw !== "string") {
    return { ok: false, error: "app_version_invalid" };
  }
  const trimmed = raw.trim();
  if (!trimmed || !APP_VERSION_RE.test(trimmed)) {
    return { ok: false, error: "app_version_invalid" };
  }
  return { ok: true, value: trimmed };
}

export function appVersionValidationDescription(): string {
  return "Required non-empty string, 1–64 characters, matching /^[0-9A-Za-z._+-]{1,64}$/ (semver-ish).";
}
