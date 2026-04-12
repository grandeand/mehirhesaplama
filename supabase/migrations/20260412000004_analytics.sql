-- Analytics events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event TEXT NOT NULL,
  props JSONB DEFAULT '{}',
  ts TIMESTAMPTZ DEFAULT now(),
  session_id TEXT,
  referrer TEXT,
  ua TEXT
);

-- Indexes for fast querying
CREATE INDEX idx_analytics_event ON public.analytics_events (event);
CREATE INDEX idx_analytics_ts ON public.analytics_events (ts DESC);
CREATE INDEX idx_analytics_session ON public.analytics_events (session_id);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert events (write-only from client)
CREATE POLICY "analytics_insert_only"
  ON public.analytics_events
  FOR INSERT
  WITH CHECK (true);

-- No select/update/delete for anon (read only via service_role or dashboard)
REVOKE SELECT ON public.analytics_events FROM anon;
REVOKE SELECT ON public.analytics_events FROM authenticated;
REVOKE UPDATE ON public.analytics_events FROM anon;
REVOKE UPDATE ON public.analytics_events FROM authenticated;
REVOKE DELETE ON public.analytics_events FROM anon;
REVOKE DELETE ON public.analytics_events FROM authenticated;

-- Auto-cleanup: keep only last 90 days (optional cron via pg_cron if available)
-- For now, manual cleanup query:
-- DELETE FROM public.analytics_events WHERE ts < now() - interval '90 days';
