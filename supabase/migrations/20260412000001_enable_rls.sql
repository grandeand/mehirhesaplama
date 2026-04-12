-- Enable RLS on leaderboard table
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read leaderboard
CREATE POLICY "leaderboard_select_all"
  ON public.leaderboard
  FOR SELECT
  USING (true);

-- Allow anon inserts
CREATE POLICY "leaderboard_insert_anon"
  ON public.leaderboard
  FOR INSERT
  WITH CHECK (true);

-- Allow updates only within 30 minutes of creation (for social profile edits)
CREATE POLICY "leaderboard_update_recent"
  ON public.leaderboard
  FOR UPDATE
  USING (created_at > now() - interval '30 minutes');

-- No delete policy = denied by default

-- Drop ALL existing triggers on leaderboard to avoid conflicts
DO $$
DECLARE
  trig RECORD;
BEGIN
  FOR trig IN
    SELECT trigger_name FROM information_schema.triggers
    WHERE event_object_table = 'leaderboard'
      AND event_object_schema = 'public'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.leaderboard', trig.trigger_name);
  END LOOP;
END;
$$;

-- Improved trigger function: prevents core field changes and social field overwrites
CREATE OR REPLACE FUNCTION public.protect_leaderboard_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.name IS DISTINCT FROM NEW.name
     OR OLD.score IS DISTINCT FROM NEW.score
     OR OLD.tier IS DISTINCT FROM NEW.tier
     OR OLD.gender IS DISTINCT FROM NEW.gender THEN
    RAISE EXCEPTION 'Core fields (name, score, tier, gender) cannot be modified';
  END IF;

  IF OLD.instagram IS NOT NULL AND OLD.instagram <> ''
     AND NEW.instagram IS DISTINCT FROM OLD.instagram THEN
    RAISE EXCEPTION 'Instagram cannot be changed once set';
  END IF;

  IF OLD.twitter IS NOT NULL AND OLD.twitter <> ''
     AND NEW.twitter IS DISTINCT FROM OLD.twitter THEN
    RAISE EXCEPTION 'Twitter cannot be changed once set';
  END IF;

  IF OLD.tiktok IS NOT NULL AND OLD.tiktok <> ''
     AND NEW.tiktok IS DISTINCT FROM OLD.tiktok THEN
    RAISE EXCEPTION 'TikTok cannot be changed once set';
  END IF;

  IF OLD.email IS NOT NULL AND OLD.email <> ''
     AND NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'Email cannot be changed once set';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_leaderboard_update
  BEFORE UPDATE ON public.leaderboard
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_leaderboard_fields();
