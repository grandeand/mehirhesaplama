-- Temporarily disable trigger to allow score update
ALTER TABLE public.leaderboard DISABLE TRIGGER protect_leaderboard_update;

-- Divide all existing scores by 3 and recalculate tiers
UPDATE public.leaderboard
SET
  score = ROUND(score / 3.0),
  tier = CASE
    WHEN ROUND(score / 3.0) >= 501 THEN 'diamond'
    WHEN ROUND(score / 3.0) >= 251 THEN 'platinum'
    WHEN ROUND(score / 3.0) >= 101 THEN 'gold'
    WHEN ROUND(score / 3.0) >= 51  THEN 'silver'
    ELSE 'bronze'
  END;

-- Re-enable trigger
ALTER TABLE public.leaderboard ENABLE TRIGGER protect_leaderboard_update;
