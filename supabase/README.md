# Supabase schema (Octavia Nebula Core)

## One-shot install

1. Open **Supabase Dashboard → SQL Editor** for your project.
2. Paste and run **`complete_schema.sql`** in full (one execution).

This is intended for a **new / empty** `public` schema. If some objects already exist, you may see errors (duplicate policy names, etc.); fix by dropping those objects or run only the missing sections.

## After applying

- Regenerate TypeScript types:  
  `npx supabase gen types typescript --project-id <ref> > src/integrations/supabase/types.ts`  
  (or use the Supabase CLI linked to this project.)
- **`user_stats` triggers** on `auth.users` require a normal Supabase project (not local Postgres without `auth` schema).

## Optional / separate

- Per-feature SQL files in the repo root (`supabase_*.sql`, `fractional_ownership_migration.sql`, …) are **merged into** `complete_schema.sql`; you do not need to run them separately if you used the complete file.
