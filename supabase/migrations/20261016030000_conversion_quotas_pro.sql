-- =============================================================================
-- MIGRATION: Conversion Quotas and Reservations for File Converter (Gratis + Pro)
-- PlayComun Online Pro Architecture
-- =============================================================================

-- 1. Register features for convertidor-archivos in catalog
INSERT INTO public.features (code, name, description)
VALUES 
  ('office_to_pdf_unlimited', 'Conversiones de oficina Pro', 'Hasta 100 documentos de Word, Excel y PowerPoint diarios y archivos de hasta 50 MB con procesamiento de alta fidelidad.'),
  ('batch_conversion_extended', 'Conversión extendida por lotes', 'Procesamiento simultáneo ampliado de documentos e imágenes.')
ON CONFLICT (code) DO UPDATE 
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 2. Map features to tool_slug 'convertidor-archivos' as Premium (Pro)
INSERT INTO public.tool_features (tool_slug, feature_id, is_premium)
SELECT 'convertidor-archivos', f.id, true
FROM public.features f
WHERE f.code IN ('office_to_pdf_unlimited', 'batch_conversion_extended')
ON CONFLICT (tool_slug, feature_id) DO UPDATE
SET is_premium = true;

-- 3. Create table for conversion reservations and quota tracking
CREATE TABLE IF NOT EXISTS public.conversion_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL, -- 'usr:<user_id>' OR 'anon:<ip_hmac>'
  is_pro boolean NOT NULL DEFAULT false,
  quota_date date NOT NULL, -- Date in America/Argentina/Buenos_Aires
  operation_id text NOT NULL,
  file_count integer NOT NULL DEFAULT 1,
  status text NOT NULL CHECK (status IN ('reserved', 'confirmed', 'released', 'expired')),
  file_size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  confirmed_at timestamptz
);

COMMENT ON TABLE public.conversion_reservations IS 'Tracks server-side document conversion reservations and quotas (Free 5/day, Pro 100/day) with Argentina midnight reset.';

-- Enable Row Level Security (RLS)
ALTER TABLE public.conversion_reservations ENABLE ROW LEVEL SECURITY;

-- Deny all direct client-side mutations (only SECURITY DEFINER functions can manage quotas)
CREATE POLICY "Public read-only policy for conversion reservations"
  ON public.conversion_reservations FOR SELECT
  USING (false);

-- Indexes for lightning fast lookups and cleanups
CREATE INDEX IF NOT EXISTS idx_conv_res_lookup 
  ON public.conversion_reservations (identifier, quota_date, status);

CREATE INDEX IF NOT EXISTS idx_conv_res_expires 
  ON public.conversion_reservations (expires_at) 
  WHERE status = 'reserved';

-- 4. Helper Function: Get Argentina Date
CREATE OR REPLACE FUNCTION public.get_argentina_date()
RETURNS date
LANGUAGE sql
STABLE
AS $$
  SELECT (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date;
$$;

-- 5. Helper Function: Get next Argentina midnight in UTC timestamptz
CREATE OR REPLACE FUNCTION public.get_next_argentina_midnight()
RETURNS timestamptz
LANGUAGE sql
STABLE
AS $$
  SELECT ((public.get_argentina_date() + 1)::text || ' 00:00:00 America/Argentina/Buenos_Aires')::timestamptz;
$$;

-- 6. RPC Function: Get Conversion Quota Status
CREATE OR REPLACE FUNCTION public.get_conversion_quota_status(
  p_identifier text,
  p_is_pro boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
DECLARE
  v_quota_date date;
  v_limit integer;
  v_used integer;
  v_remaining integer;
  v_resets_at timestamptz;
BEGIN
  v_quota_date := public.get_argentina_date();
  v_resets_at := public.get_next_argentina_midnight();
  v_limit := CASE WHEN p_is_pro THEN 100 ELSE 5 END;

  SELECT COALESCE(SUM(file_count), 0)::integer
  INTO v_used
  FROM public.conversion_reservations
  WHERE identifier = p_identifier
    AND quota_date = v_quota_date
    AND (
      status = 'confirmed' 
      OR (status = 'reserved' AND expires_at > now())
    );

  v_remaining := GREATEST(0, v_limit - v_used);

  RETURN jsonb_build_object(
    'is_pro', p_is_pro,
    'limit', v_limit,
    'used', v_used,
    'remaining', v_remaining,
    'quota_date', v_quota_date,
    'resets_at', v_resets_at
  );
END;
$$;

-- 7. RPC Function: Atomic Quota Reservation
CREATE OR REPLACE FUNCTION public.reserve_conversion_quota(
  p_identifier text,
  p_is_pro boolean,
  p_operation_id text,
  p_file_count integer,
  p_file_size_bytes bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_quota_date date;
  v_limit integer;
  v_used integer;
  v_remaining integer;
  v_res_id uuid;
  v_resets_at timestamptz;
BEGIN
  v_quota_date := public.get_argentina_date();
  v_resets_at := public.get_next_argentina_midnight();
  v_limit := CASE WHEN p_is_pro THEN 100 ELSE 5 END;

  -- Lock by identifier for atomic concurrency
  PERFORM pg_advisory_xact_lock(hashtext(p_identifier || ':' || v_quota_date::text));

  -- Calculate current active quota consumption (confirmed + unexpired reserved)
  SELECT COALESCE(SUM(file_count), 0)::integer
  INTO v_used
  FROM public.conversion_reservations
  WHERE identifier = p_identifier
    AND quota_date = v_quota_date
    AND (
      status = 'confirmed' 
      OR (status = 'reserved' AND expires_at > now())
    );

  IF (v_used + p_file_count) > v_limit THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'QUOTA_EXCEEDED',
      'limit', v_limit,
      'used', v_used,
      'remaining', GREATEST(0, v_limit - v_used),
      'quota_date', v_quota_date,
      'resets_at', v_resets_at
    );
  END IF;

  -- Insert reservation
  INSERT INTO public.conversion_reservations (
    identifier,
    is_pro,
    quota_date,
    operation_id,
    file_count,
    status,
    file_size_bytes,
    created_at,
    expires_at
  ) VALUES (
    p_identifier,
    p_is_pro,
    v_quota_date,
    p_operation_id,
    p_file_count,
    'reserved',
    p_file_size_bytes,
    now(),
    now() + interval '5 minutes'
  ) RETURNING id INTO v_res_id;

  v_used := v_used + p_file_count;
  v_remaining := GREATEST(0, v_limit - v_used);

  RETURN jsonb_build_object(
    'success', true,
    'reservation_id', v_res_id,
    'limit', v_limit,
    'used', v_used,
    'remaining', v_remaining,
    'quota_date', v_quota_date,
    'resets_at', v_resets_at
  );
END;
$$;

-- 8. RPC Function: Confirm Conversion Quota (Idempotent)
CREATE OR REPLACE FUNCTION public.confirm_conversion_quota(
  p_reservation_id uuid,
  p_actual_size bigint DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rec public.conversion_reservations%ROWTYPE;
  v_status jsonb;
BEGIN
  SELECT * INTO v_rec
  FROM public.conversion_reservations
  WHERE id = p_reservation_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'RESERVATION_NOT_FOUND'
    );
  END IF;

  IF v_rec.status = 'confirmed' THEN
    -- Already confirmed, return current quota status
    v_status := public.get_conversion_quota_status(v_rec.identifier, v_rec.is_pro);
    RETURN jsonb_build_object(
      'success', true,
      'already_confirmed', true,
      'quota', v_status
    );
  END IF;

  UPDATE public.conversion_reservations
  SET 
    status = 'confirmed',
    confirmed_at = now(),
    file_size_bytes = COALESCE(p_actual_size, file_size_bytes)
  WHERE id = p_reservation_id;

  v_status := public.get_conversion_quota_status(v_rec.identifier, v_rec.is_pro);

  RETURN jsonb_build_object(
    'success', true,
    'already_confirmed', false,
    'quota', v_status
  );
END;
$$;

-- 9. RPC Function: Release Conversion Quota
CREATE OR REPLACE FUNCTION public.release_conversion_quota(
  p_reservation_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rec public.conversion_reservations%ROWTYPE;
  v_status jsonb;
BEGIN
  SELECT * INTO v_rec
  FROM public.conversion_reservations
  WHERE id = p_reservation_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'RESERVATION_NOT_FOUND');
  END IF;

  -- Only release if still in 'reserved' state (never release confirmed units)
  IF v_rec.status = 'reserved' THEN
    UPDATE public.conversion_reservations
    SET status = 'released'
    WHERE id = p_reservation_id;
  END IF;

  v_status := public.get_conversion_quota_status(v_rec.identifier, v_rec.is_pro);

  RETURN jsonb_build_object(
    'success', true,
    'released', v_rec.status = 'reserved',
    'quota', v_status
  );
END;
$$;

-- 10. RPC Function: Periodic cleanup of expired reservations
CREATE OR REPLACE FUNCTION public.cleanup_expired_conversion_reservations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.conversion_reservations
  SET status = 'expired'
  WHERE status = 'reserved' AND expires_at <= now();
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
