-- =============================================================================
-- MIGRATION: 20261019190000_subscription_audit_reconciliation_and_started_at.sql
-- PlayComun Online: Reconciliación controlada y auditable de suscripciones y pagos,
-- columna started_at, aislamiento de productos foráneos e idempotencia.
-- =============================================================================

-- 1. Añadir columnas de auditoría y fecha de inicio real
ALTER TABLE public.subscriptions 
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archive_reason text;

ALTER TABLE public.payments 
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archive_reason text;

-- 2. Crear tablas de archivo y auditoría para preservación 100% de evidencia
CREATE TABLE IF NOT EXISTS public.reconciled_subscriptions_archive (
  archive_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id uuid NOT NULL,
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  provider text,
  provider_subscription_id text,
  provider_plan_id text,
  provider_status text,
  status text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  reconciliation_reason text NOT NULL,
  reconciled_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reconciled_payments_archive (
  archive_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id uuid NOT NULL,
  user_id uuid NOT NULL,
  subscription_id uuid,
  provider text,
  provider_payment_id text,
  amount numeric(10, 2) NOT NULL,
  currency text NOT NULL,
  status text,
  payment_method text,
  paid_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  reconciliation_reason text NOT NULL,
  reconciled_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Copiar evidencia a tablas de archivo antes de marcar estado archivado
-- A: Suscripciones de FitAdmi contaminadas por búsqueda global de MP sin filtro de external_reference
INSERT INTO public.reconciled_subscriptions_archive (
  original_id, user_id, plan_id, provider, provider_subscription_id,
  provider_plan_id, provider_status, status, current_period_start,
  current_period_end, cancelled_at, created_at, updated_at, reconciliation_reason
)
SELECT 
  id, user_id, plan_id, provider, provider_subscription_id,
  provider_plan_id, provider_status, status::text, current_period_start,
  current_period_end, cancelled_at, created_at, updated_at,
  'foreign_product_cross_contamination_fitadmi'
FROM public.subscriptions
WHERE provider_subscription_id IN (
  'd4595a5870a147858cf6057b6eae2987',
  'c9bfe38dbb254e28bbbd91ea615bf2b1',
  '5f5c902f98ea4edba26552a82755145e',
  '0552d4f4994b4c488e83562f85175eec',
  'bca5634dcc5e4c2ca5aaeb54afad0c1b'
)
ON CONFLICT DO NOTHING;

-- B: Pagos de FitAdmi ($89) y duplicados sintéticos generados
INSERT INTO public.reconciled_payments_archive (
  original_id, user_id, subscription_id, provider, provider_payment_id,
  amount, currency, status, payment_method, paid_at, created_at, updated_at,
  reconciliation_reason
)
SELECT 
  id, user_id, subscription_id, provider, provider_payment_id,
  amount, currency, status::text, payment_method, paid_at, created_at, updated_at,
  CASE 
    WHEN provider_payment_id LIKE 'sub_f859db0141be48b692f2e4fbee89d9d3%' THEN 'synthetic_duplicate_of_real_payment_182725067980'
    ELSE 'foreign_product_cross_contamination_fitadmi'
  END
FROM public.payments
WHERE provider_payment_id IN (
  'sub_0552d4f4994b4c488e83562f85175eec_1',
  'sub_5f5c902f98ea4edba26552a82755145e_1',
  'sub_c9bfe38dbb254e28bbbd91ea615bf2b1_1',
  'sub_d4595a5870a147858cf6057b6eae2987_2',
  'sub_f859db0141be48b692f2e4fbee89d9d3_1'
)
ON CONFLICT DO NOTHING;

-- 4. Actualizar registros en tablas activas marcándolos como archivados (reversible en cualquier momento)
UPDATE public.subscriptions
SET 
  is_archived = true,
  archive_reason = 'Contaminación cruzada por preapproval de FitAdmi en cuenta MP'
WHERE provider_subscription_id IN (
  'd4595a5870a147858cf6057b6eae2987',
  'c9bfe38dbb254e28bbbd91ea615bf2b1',
  '5f5c902f98ea4edba26552a82755145e',
  '0552d4f4994b4c488e83562f85175eec',
  'bca5634dcc5e4c2ca5aaeb54afad0c1b'
);

UPDATE public.payments
SET 
  is_archived = true,
  archive_reason = CASE 
    WHEN provider_payment_id LIKE 'sub_f859db0141be48b692f2e4fbee89d9d3%' THEN 'Duplicado sintético del pago real 182725067980'
    ELSE 'Pago correspondiente a FitAdmi, no a PlayComun'
  END
WHERE provider_payment_id IN (
  'sub_0552d4f4994b4c488e83562f85175eec_1',
  'sub_5f5c902f98ea4edba26552a82755145e_1',
  'sub_c9bfe38dbb254e28bbbd91ea615bf2b1_1',
  'sub_d4595a5870a147858cf6057b6eae2987_2',
  'sub_f859db0141be48b692f2e4fbee89d9d3_1'
);

-- 5. Normalizar checkouts pendientes abandonados que nunca se autorizaron
-- Para que no queden en 'trialing' otorgando acceso falso o induciendo a error
UPDATE public.subscriptions
SET 
  status = 'expired',
  provider_status = 'pending'
WHERE provider_subscription_id IN (
  '31504624f42c4beb80d8cca66080358f',
  'eae82e6776ae4620adb7c0d4743f55f1',
  '57855f163f8342e2876178ebbdc6c0ee',
  '206b3aaba83c460dbc63ab2486c6dc89',
  '2b33c94a6cc547d5aace09af51bdff5c'
) AND status = 'trialing';

-- 6. Establecer fechas auténticas en la suscripción activa oficial de PlayComun Pro
UPDATE public.subscriptions
SET 
  started_at = '2026-10-06 18:10:46+00',
  current_period_start = '2026-10-06 18:10:50+00',
  current_period_end = '2026-11-06 18:10:50+00',
  status = 'active',
  provider_status = 'authorized',
  is_archived = false
WHERE provider_subscription_id = 'f859db0141be48b692f2e4fbee89d9d3';

-- Completar started_at en registros existentes que no lo tengan
UPDATE public.subscriptions
SET started_at = COALESCE(current_period_start, created_at)
WHERE started_at IS NULL;

-- 7. Actualizar método de pago para identificar marca Mastercard
UPDATE public.payment_methods
SET brand = 'master'
WHERE provider_card_id = 'a87d34d066026e60439a35eba8b64eff' AND brand IS NULL;

-- 8. Actualizar función is_pro_user para considerar is_archived y períodos reales
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
      AND COALESCE(s.is_archived, false) = false
      AND p.code IN ('pro_monthly', 'pro_yearly')
      -- 1. Excluir de forma inmediata revocaciones por contracargo o reembolso
      AND (s.provider_status IS NULL OR s.provider_status NOT IN ('refunded', 'charged_back'))
      AND (
        -- Caso A: Suscripción activa con período vigente o sin vencimiento prefijado
        (s.status = 'active' AND (s.current_period_end IS NULL OR s.current_period_end > now()))
        OR
        -- Caso B: Período de prueba vigente
        (s.status = 'trialing' AND COALESCE(s.trial_end_at, s.current_period_end) > now())
        OR
        -- Caso C: Renovación cancelada voluntariamente, pero período pagado aún en curso
        (s.status = 'cancelled' AND s.current_period_end IS NOT NULL AND s.current_period_end > now())
        OR
        -- Caso D: Período de gracia por pago fallido (past_due 3 días)
        (s.status = 'past_due' AND (COALESCE(s.current_period_end, s.updated_at, s.created_at) + interval '3 days') > now())
      )
  );
$$;

COMMENT ON FUNCTION public.is_pro_user IS 'Evalúa si el usuario dispone de derechos Pro activos, excluyendo registros archivados, suscripciones finalizadas y revocaciones por reembolso.';
