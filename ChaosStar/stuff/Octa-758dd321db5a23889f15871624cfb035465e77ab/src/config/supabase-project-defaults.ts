/**
 * Default Supabase project (shared by Vite app and root-level Node/tsx scripts).
 * Override with VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY) in `.env`.
 * Do not put service_role or other secrets here.
 *
 * Last aligned with Cursor MCP `user-supabase`: `get_project_url` + `get_publishable_keys` (2025-03-22).
 */

export const SUPABASE_PROJECT_REF = "zfzsiykutsgkurmetprw";

export const DEFAULT_SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;

/** Legacy anon JWT for this project (public). Prefer env override if rotated. */
export const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmenNpeWt1dHNna3VybWV0cHJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNzUzMDAsImV4cCI6MjA4OTc1MTMwMH0.Jc6md2XRZZvYGcvuXvg45YmTqot4dUGaopvKfZFV1mY";

/** Default publishable key from the same MCP-linked project (optional; use via env or future defaults). */
export const DEFAULT_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_5cTaFbCxBYCYWUa6Zw99sA_4FgQVU1t";
