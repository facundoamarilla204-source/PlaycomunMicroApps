-- =============================================================================
-- MIGRATION: 20261016050000_enhance_pro_user_and_payment_reconciliation.sql
-- PlayComun Online: Refuerzo de is_pro_user contra fraudes e índices únicos de pagos
-- =============================================================================

-- 1. Actualizar is_pro_user para excluir explícitamente reembolsos o contracargos
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
      AND (s.provider_status IS NULL OR s.provider_status NOT IN ('refunded', 'charged_back'))
      AND (
        -- Caso A: Suscripción activa o en prueba con fecha vigente o sin límite fijado
        (s.status IN ('active', 'trialing') AND (s.current_period_end IS NULL OR s.current_period_end > now()))
        OR
        -- Caso B: Renovación cancelada voluntariamente, pero período pagado aún no finalizó
        (s.status = 'cancelled' AND s.current_period_end IS NOT NULL AND s.current_period_end > now())
      )
  );
$$;

COMMENT ON FUNCTION public.is_pro_user IS 'Devuelve true si el usuario tiene una suscripción Pro activa o en período de gracia, excluyendo revocaciones por reembolso o contracargo.';

-- 2. Índice único para garantizar idempotencia estricta en pagos recibidos del proveedor
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_payment_unique 
  ON public.payments (provider, provider_payment_id) 
  WHERE provider_payment_id IS NOT NULL;

-- 3. Índice único para garantizar idempotencia en suscripciones por ID del proveedor
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_provider_sub_unique 
  ON public.subscriptions (provider, provider_subscription_id) 
  WHERE provider_subscription_id IS NOT NULL;
