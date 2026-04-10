-- 1. Score sınırı (örn: min 0, max 9.999.999 gram altın)
ALTER TABLE public.leaderboard
ADD CONSTRAINT score_limit CHECK (score >= 0 AND score <= 9999999);

-- 2. İsim karakter sınırı (maximum 30 karakter)
ALTER TABLE public.leaderboard
ADD CONSTRAINT name_limit CHECK (char_length(name) <= 30);

-- 3. Sosyal medya platform isimleri de saçma sapan uzun olmasın (max 50 karakter)
ALTER TABLE public.leaderboard
ADD CONSTRAINT social_length_limit CHECK (
  (instagram IS NULL OR char_length(instagram) <= 50) AND
  (twitter IS NULL OR char_length(twitter) <= 50) AND
  (tiktok IS NULL OR char_length(tiktok) <= 50)
);
