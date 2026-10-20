-- Migration: signature_sessions for ephemeral QR signing between mobile and desktop
-- No PDF content is ever transmitted or stored in the database.
-- Only short-lived signature image data with strict TTL and single-use upload token.

CREATE TABLE IF NOT EXISTS public.signature_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  upload_token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'connected' | 'completed' | 'expired' | 'cancelled'
  signature_data TEXT, -- Base64 PNG data URL (max 500KB verified in API)
  initials_data TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now() + interval '15 minutes'),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_signature_sessions_session_token ON public.signature_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_signature_sessions_upload_token ON public.signature_sessions(upload_token);
CREATE INDEX IF NOT EXISTS idx_signature_sessions_expires_at ON public.signature_sessions(expires_at);

-- Enable RLS: all reads and writes are restricted exclusively to server-side routes via service_role key
ALTER TABLE public.signature_sessions ENABLE ROW LEVEL SECURITY;
