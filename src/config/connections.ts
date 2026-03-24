/**
 * Canonical connection targets for the Octavia frontend.
 *
 * - **Supabase** project ref matches the Cursor MCP `user-supabase` linked project.
 * - Override with `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` or `VITE_SUPABASE_ANON_KEY` (`.env.local`).
 * - Never add `service_role` or other secrets here — browser bundle only.
 */

import {
  SUPABASE_PROJECT_REF,
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_ANON_KEY,
  DEFAULT_SUPABASE_PUBLISHABLE_KEY,
} from "./supabase-project-defaults";

export {
  SUPABASE_PROJECT_REF,
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_ANON_KEY,
  DEFAULT_SUPABASE_PUBLISHABLE_KEY,
};

function trimEnv(v: string | undefined): string | undefined {
  if (v === undefined) return undefined;
  const t = String(v).trim();
  return t === "" ? undefined : t;
}

/** True if either publishable or anon key was set in env (non-empty). */
function isSupabaseKeyExplicitInEnv(): boolean {
  const pub = trimEnv(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined);
  const anon = trimEnv(import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);
  return Boolean(pub || anon);
}

/** Effective API key: env publishable, then env anon JWT, then bundled default JWT (for ref validation). */
function resolveSupabaseApiKey(): string {
  return (
    trimEnv(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
    trimEnv(import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
    DEFAULT_SUPABASE_ANON_KEY
  );
}

export const SUPABASE_DASHBOARD_API_URL = `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/settings/api`;

export function getSupabaseUrl(): string {
  const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const url = (envUrl && envUrl.trim()) || DEFAULT_SUPABASE_URL;

  const keyExplicit = isSupabaseKeyExplicitInEnv();
  const effectiveKey = resolveSupabaseApiKey();

  const urlRef = getSupabaseRefFromUrl(url);
  const keyRef = getSupabaseRefFromAnonKey(effectiveKey);

  // URL-only override with default anon key → 401 "Invalid API key". Prefer default URL + warn.
  if (
    urlRef &&
    keyRef &&
    urlRef !== keyRef &&
    !keyExplicit &&
    effectiveKey === DEFAULT_SUPABASE_ANON_KEY
  ) {
    console.warn(
      `[Supabase] Ignoring VITE_SUPABASE_URL (project ${urlRef}): no VITE_SUPABASE_ANON_KEY or ` +
        `VITE_SUPABASE_PUBLISHABLE_KEY in env, so the bundled default key for ${keyRef} is used. ` +
        `Using ${DEFAULT_SUPABASE_URL} instead. To use project ${urlRef}, set matching keys from ` +
        `https://supabase.com/dashboard/project/${urlRef}/settings/api`
    );
    return DEFAULT_SUPABASE_URL;
  }

  return url;
}

/**
 * Key passed to `createClient` (publishable or legacy anon JWT from dashboard / MCP).
 */
export function getSupabaseAnonKey(): string {
  return resolveSupabaseApiKey();
}

/**
 * Decode legacy anon JWT `ref` claim (no verification — key is public).
 * Returns null for non-JWT keys (e.g. sb_publishable_...).
 */
export function getSupabaseRefFromAnonKey(anonKey: string): string | null {
  if (anonKey.startsWith("sb_publishable_") || anonKey.startsWith("sb_secret_")) {
    return null;
  }
  const parts = anonKey.split(".");
  if (parts.length !== 3) return null;
  try {
    const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(padded);
    const payload = JSON.parse(json) as { ref?: string };
    return typeof payload.ref === "string" ? payload.ref : null;
  } catch {
    return null;
  }
}

export function getSupabaseRefFromUrl(url: string): string | null {
  try {
    const host = new URL(url).hostname;
    if (!host.endsWith(".supabase.co")) return null;
    return host.replace(/\.supabase\.co$/, "") || null;
  } catch {
    return null;
  }
}

/**
 * Mismatched URL + anon JWT causes 401 "Invalid API key" from Supabase — fail fast with a clear message.
 */
export function assertSupabaseUrlAndKeyAgree(url: string, anonKey: string): void {
  const urlRef = getSupabaseRefFromUrl(url);
  const keyRef = getSupabaseRefFromAnonKey(anonKey);
  if (urlRef && keyRef && urlRef !== keyRef) {
    const dashboard = `https://supabase.com/dashboard/project/${urlRef}/settings/api`;
    throw new Error(
      `Supabase config mismatch: VITE_SUPABASE_URL points to project "${urlRef}" but ` +
        `the anon JWT (VITE_SUPABASE_ANON_KEY or bundled default) is for "${keyRef}". ` +
        `Use VITE_SUPABASE_PUBLISHABLE_KEY for the modern key, or set matching URL + anon JWT from: ${dashboard}`
    );
  }
}
