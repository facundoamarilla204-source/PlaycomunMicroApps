-- =============================================================================
-- MIGRATION: 20261016040000_subscription_grace_period_and_features.sql
-- PlayComun Online: Período de gracia en cancelaciones, seguridad QR y features
-- =============================================================================

-- 1. Actualizar función central is_pro_user para soportar cancelaciones con período vigente
-- Si el usuario cancela la renovación automática pero pagó su período, mantiene Pro
-- hasta current_period_end. Al llegar esa fecha, pasa automáticamente a inactivo.
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
      AND (
        -- Caso A: Suscripción activa o en prueba con fecha vigente o sin límite fijado
        (s.status IN ('active', 'trialing') AND (s.current_period_end IS NULL OR s.current_period_end > now()))
        OR
        -- Caso B: Renovación cancelada voluntariamente, pero período pagado aún no finalizó
        (s.status = 'cancelled' AND s.current_period_end IS NOT NULL AND s.current_period_end > now())
      )
  );
$$;

COMMENT ON FUNCTION public.is_pro_user IS 'Devuelve true si el usuario tiene una suscripción Pro activa, en prueba o con cancelación de renovación pero con período pagado vigente.';

-- 2. Registrar Features faltantes en el catálogo central
INSERT INTO public.features (code, name, description)
VALUES 
  ('client_database', 'Agenda de clientes', 'Guardar y reutilizar clientes frecuentes en documentos comerciales'),
  ('product_catalog', 'Catálogo de productos y servicios', 'Guardar catálogo de ítems, precios y descuentos predefinidos'),
  ('qr_static', 'Generador QR estático', 'Generación y descarga ilimitada de códigos QR directos de por vida'),
  ('qr_dynamic', 'Códigos QR dinámicos', 'Códigos con redirección en la nube gestionables desde panel'),
  ('qr_batches', 'Tandas de impresión en lote', 'Generación de tandas y planchas A4 numeradas para imprenta'),
  ('qr_edit_destination', 'Actualización de destino en tiempo real', 'Modificar el enlace de destino de códigos ya impresos')
ON CONFLICT (code) DO UPDATE 
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 3. Mapear Features a Generador de Documentos Comerciales
INSERT INTO public.tool_features (tool_slug, feature_id, is_premium)
SELECT 'generador-documentos-comerciales', f.id,
  CASE 
    WHEN f.code IN ('create_pdf', 'print_document') THEN false
    ELSE true
  END
FROM public.features f
WHERE f.code IN (
  'create_pdf',
  'print_document',
  'custom_logo',
  'custom_colors',
  'saved_business_data',
  'document_history',
  'remove_watermark',
  'client_database',
  'product_catalog'
)
ON CONFLICT (tool_slug, feature_id) DO UPDATE
SET is_premium = EXCLUDED.is_premium;

-- 4. Asegurar Mapeo de Features a Generador de Presupuestos
INSERT INTO public.tool_features (tool_slug, feature_id, is_premium)
SELECT 'generador-presupuestos', f.id,
  CASE 
    WHEN f.code IN ('create_pdf', 'print_document') THEN false
    ELSE true
  END
FROM public.features f
WHERE f.code IN (
  'create_pdf',
  'print_document',
  'custom_logo',
  'custom_colors',
  'saved_business_data',
  'document_history',
  'remove_watermark',
  'client_database',
  'product_catalog'
)
ON CONFLICT (tool_slug, feature_id) DO UPDATE
SET is_premium = EXCLUDED.is_premium;

-- 5. Mapear Features a Generador QR
INSERT INTO public.tool_features (tool_slug, feature_id, is_premium)
SELECT 'generador-qr', f.id,
  CASE 
    WHEN f.code = 'qr_static' THEN false
    ELSE true
  END
FROM public.features f
WHERE f.code IN ('qr_static', 'qr_dynamic', 'qr_batches', 'qr_edit_destination')
ON CONFLICT (tool_slug, feature_id) DO UPDATE
SET is_premium = EXCLUDED.is_premium;

-- 6. Funciones Security Definer para recuento seguro de QR cuando Pro expira (Preservación de datos)
CREATE OR REPLACE FUNCTION public.get_user_qr_group_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT count(*)::integer
  FROM public.qr_groups
  WHERE user_id = auth.uid();
$$;

COMMENT ON FUNCTION public.get_user_qr_group_count IS 'Devuelve la cantidad de grupos QR del usuario autenticado sin exponer detalles si no tiene Pro activo.';

CREATE OR REPLACE FUNCTION public.get_user_qr_code_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT count(*)::integer
  FROM public.qr_codes
  WHERE user_id = auth.uid();
$$;

COMMENT ON FUNCTION public.get_user_qr_code_count IS 'Devuelve la cantidad de códigos QR del usuario autenticado sin exponer detalles si no tiene Pro activo.';

-- 7. Actualizar políticas RLS de qr_groups para blindar creación y gestión con is_pro_user
DROP POLICY IF EXISTS "Users can view their own qr groups" ON public.qr_groups;
DROP POLICY IF EXISTS "Users can insert their own qr groups" ON public.qr_groups;
DROP POLICY IF EXISTS "Users can update their own qr groups" ON public.qr_groups;
DROP POLICY IF EXISTS "Users can delete their own qr groups" ON public.qr_groups;

CREATE POLICY "Users can view their own qr groups"
  ON public.qr_groups FOR SELECT
  USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()));

CREATE POLICY "Users can insert their own qr groups"
  ON public.qr_groups FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_pro_user(auth.uid()));

CREATE POLICY "Users can update their own qr groups"
  ON public.qr_groups FOR UPDATE
  USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.is_pro_user(auth.uid()));

CREATE POLICY "Users can delete their own qr groups"
  ON public.qr_groups FOR DELETE
  USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()));

-- 8. Actualizar políticas RLS de qr_codes para blindar creación y gestión con is_pro_user
DROP POLICY IF EXISTS "Users can view their own qr codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Users can insert their own qr codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Users can update their own qr codes" ON public.qr_codes;

CREATE POLICY "Users can view their own qr codes"
  ON public.qr_codes FOR SELECT
  USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()));

CREATE POLICY "Users can insert their own qr codes"
  ON public.qr_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.is_pro_user(auth.uid()));

CREATE POLICY "Users can update their own qr codes"
  ON public.qr_codes FOR UPDATE
  USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.is_pro_user(auth.uid()));
