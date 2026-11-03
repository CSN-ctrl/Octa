/** Semver-ish client build id: 1–64 chars, alnum + . _ - + (no trim). */
const APP_VERSION_RE = /^[0-9A-Za-z._+-]{1,64}$/;

function hasLeadingTrailingWhitespaceOrControls(value: string): boolean {
  if (value !== value.trim()) return true;
  return /[\u0000-\u001f\u007f]/.test(value);
}

export function normalizeAppVersion(
  raw: unknown,
  options?: { required?: boolean },
): { ok: true; value: string } | { ok: false; error: "app_version_invalid" } {
  if (raw === undefined || raw === null) {
    if (options?.required === false) {
      return { ok: true, value: "" };
    }
    return { ok: false, error: "app_version_invalid" };
  }
  if (typeof raw !== "string") {
    return { ok: false, error: "app_version_invalid" };
  }
  if (hasLeadingTrailingWhitespaceOrControls(raw)) {
    return { ok: false, error: "app_version_invalid" };
  }
  if (!raw || !APP_VERSION_RE.test(raw)) {
    return { ok: false, error: "app_version_invalid" };
  }
  return { ok: true, value: raw };
}

export function appVersionValidationDescription(): string {
  return "Required non-empty string, 1–64 characters, no leading/trailing whitespace or control characters, matching /^[0-9A-Za-z._+-]{1,64}$/. Values are not trimmed.";
}
