-- ═══════════════════════════════════════════════════════
-- SUPABASE RLS & INDEX — Run this in the Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- DB-2: Ensure user_id has a unique index (for fast lookups + upserts)
CREATE UNIQUE INDEX IF NOT EXISTS idx_perfiles_user_id
  ON perfiles (user_id);

-- SEC-2: Enable Row-Level Security on perfiles table
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

-- SEC-2: Policy — users can only SELECT their own row
CREATE POLICY "Users read own profile"
  ON perfiles FOR SELECT
  USING (auth.uid() = user_id);

-- SEC-2: Policy — users can only INSERT their own row
CREATE POLICY "Users insert own profile"
  ON perfiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- SEC-2: Policy — users can only UPDATE their own row
CREATE POLICY "Users update own profile"
  ON perfiles FOR UPDATE
  USING (auth.uid() = user_id);

-- SEC-2: Policy — users can only DELETE their own row (optional)
CREATE POLICY "Users delete own profile"
  ON perfiles FOR DELETE
  USING (auth.uid() = user_id);
