-- ============================================
-- MEHIR HESAPLAMA - DATABASE SECURITY
-- Applied via migrations. This file is reference only.
-- ============================================

-- RLS is enabled on public.leaderboard (migration 20260412000001)
-- Policies:
--   SELECT: Everyone can read (leaderboard_select_all)
--   INSERT: Everyone can insert (leaderboard_insert_anon)
--   UPDATE: Only within 30 minutes of creation (leaderboard_update_recent)
--   DELETE: Denied (no policy + REVOKE DELETE from anon/authenticated)

-- Trigger: protect_leaderboard_update
--   Prevents modification of core fields (name, score, tier, gender)
--   Prevents overwriting social fields once set (instagram, twitter, tiktok, email)

-- Trigger: rate_limit_insert (migration 20260412000003)
--   Prevents same name from inserting within 60 seconds

-- CHECK constraints:
--   score_limit: 0 <= score <= 9,999,999
--   name_limit: char_length(name) <= 30
--   social_length_limit: each social field <= 50 chars
