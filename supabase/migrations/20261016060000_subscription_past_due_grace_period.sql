-- =============================================================================
-- MIGRATION: 20261016060000_subscription_past_due_grace_period.sql
-- PlayComun Online: Período de gracia configurable para pagos fallidos (past_due)
-- y tratamiento canónico de estados (paused, cancelled, expired, refunded)
-- =============================================================================

-- Actualizar función is_pro_user para incorporar el período de gracia (3 días) en caso de past_due
CREATE OR REPLACE FUNCTION public.is_pro_user(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    JOIN public.plans p ON p.id = s.plan_id
    WHERE s.user_id = check_user_id
      AND p.code IN ('pro_monthly', 'pro_yearly')
      -- 1. Excluir de forma inmediata e incondicional cualquier suscripción con contracargo o reembolso
      AND (s.provider_status IS NULL OR s.provider_status NOT IN ('refunded', 'charged_back'))
      AND (
        -- Caso A: Suscripción activa o en prueba con fecha vigente o sin límite fijado
        (s.status IN ('active', 'trialing') AND (s.current_period_end IS NULL OR s.current_period_end > now()))
        OR
        -- Caso B: Renovación cancelada voluntariamente, pero período pagado aún no finalizó
        (s.status = 'cancelled' AND s.current_period_end IS NOT NULL AND s.current_period_end > now())
        OR
        -- Caso C: Período de gracia por pago fallido (past_due)
        -- Si un cobro recurrente falla, se concede un período de gracia de 3 días para reintento y regularización
        (s.status = 'past_due' AND (COALESCE(s.current_period_end, s.updated_at, s.created_at) + interval '3 days') > now())
      )
  );
$$;

COMMENT ON FUNCTION public.is_pro_user IS 'Devuelve true si el usuario tiene una suscripción Pro activa, en prueba, con cancelación diferida vigente o dentro del período de gracia por pago fallido (past_due 3 días). Excluye suscripciones pausadas y revocaciones por reembolso o contracargo.';
