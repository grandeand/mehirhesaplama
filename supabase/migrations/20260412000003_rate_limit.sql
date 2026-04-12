-- Prevent rapid-fire inserts with the same name (within 60 seconds)
CREATE OR REPLACE FUNCTION public.rate_limit_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.leaderboard
    WHERE name = NEW.name
      AND created_at > now() - interval '60 seconds'
  ) THEN
    RAISE EXCEPTION 'Çok hızlı gidiyorsun! 1 dakika bekle.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rate_limit_insert
  BEFORE INSERT ON public.leaderboard
  FOR EACH ROW
  EXECUTE FUNCTION public.rate_limit_leaderboard();
