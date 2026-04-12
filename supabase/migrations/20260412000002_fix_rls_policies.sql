-- Remove overly permissive legacy policies
DROP POLICY IF EXISTS "Herkes okuyabilir" ON public.leaderboard;
DROP POLICY IF EXISTS "Herkes ekleyebilir" ON public.leaderboard;
DROP POLICY IF EXISTS "Sadece profil güncelleme" ON public.leaderboard;

-- Revoke DELETE from anon and authenticated roles
REVOKE DELETE ON public.leaderboard FROM anon;
REVOKE DELETE ON public.leaderboard FROM authenticated;
REVOKE TRUNCATE ON public.leaderboard FROM anon;
REVOKE TRUNCATE ON public.leaderboard FROM authenticated;

-- Temporarily disable trigger to fix test data
ALTER TABLE public.leaderboard DISABLE TRIGGER protect_leaderboard_update;

-- Clean up the test-hacked record
UPDATE public.leaderboard
SET instagram = NULL, twitter = NULL, tiktok = NULL
WHERE id = '4df530ac-705d-4bfe-9f7c-b31989ab8b1c';

-- Delete test records created during RLS testing
DELETE FROM public.leaderboard WHERE name = 'RLS_TEST';

-- Re-enable trigger
ALTER TABLE public.leaderboard ENABLE TRIGGER protect_leaderboard_update;
