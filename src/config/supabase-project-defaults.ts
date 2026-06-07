/**
 * Default Supabase project (shared by Vite app and root-level Node/tsx scripts).
 * Override with VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY) in `.env`.
 * Do not put service_role or other secrets here.
 *
 * Last aligned with Cursor MCP Supabase: `get_project_url` + `get_publishable_keys` (2026-06-07).
 * Dashboard: https://supabase.com/dashboard/project/agqkiwarwxrcemhspxxv/
 */

export const SUPABASE_PROJECT_REF = "agqkiwarwxrcemhspxxv";

export const DEFAULT_SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;

/** Legacy anon JWT for this project (public). Prefer env override if rotated. */
export const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFncWtpd2Fyd3hyY2VtaHNweHh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MTE5NDEsImV4cCI6MjA4MjM4Nzk0MX0.kaiilK_5cdDPYgFxZRKXAsmepjTpSdAw3ZdY3IW6HxM";

/** Default publishable key from the same MCP-linked project (optional; use via env or future defaults). */
export const DEFAULT_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_XtYLI0IVSph1zrRyH0pjcg_jHjVGbHB";
