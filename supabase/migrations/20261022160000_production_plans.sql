-- ==============================================================================
-- Cocina Pro - Migración 20261022160000: Planificador de producción y listas consolidadas
-- PlayComun Online Pro Architecture
-- ==============================================================================

-- 1. Registrar Feature para el Planificador de Producción en el catálogo central
INSERT INTO public.features (code, name, description)
VALUES 
  ('production_planner', 'Planificador de producción', 'Planificación integral de recetas y lista consolidada de compras para pastelería y cocina')
ON CONFLICT (code) DO UPDATE 
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Asociar a tool_slug 'cocina-pro' como característica Premium (Pro)
INSERT INTO public.tool_features (tool_slug, feature_id, is_premium)
SELECT 'cocina-pro', f.id, true
FROM public.features f
WHERE f.code = 'production_planner'
ON CONFLICT (tool_slug, feature_id) DO UPDATE
SET is_premium = true;

-- 2. Tabla: public.production_plans (Planes de producción)
CREATE TABLE IF NOT EXISTS public.production_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  production_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'planned', 'in_progress', 'completed', 'cancelled')),
  notes text,
  checked_ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- 3. Tabla: public.production_plan_items (Recetas planificadas dentro de un plan)
CREATE TABLE IF NOT EXISTS public.production_plan_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id uuid REFERENCES public.production_plans(id) ON DELETE CASCADE NOT NULL,
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE RESTRICT NOT NULL,
  target_quantity numeric NOT NULL CHECK (target_quantity > 0),
  target_unit text NOT NULL,
  scaling_factor numeric NOT NULL DEFAULT 1 CHECK (scaling_factor > 0),
  position integer NOT NULL DEFAULT 0,
  notes text,
  -- Snapshot acotado para trazabilidad histórica sin sobrecargar almacenamiento
  snapshot_recipe_name text NOT NULL,
  snapshot_yield_quantity numeric NOT NULL DEFAULT 1 CHECK (snapshot_yield_quantity > 0),
  snapshot_yield_unit text NOT NULL DEFAULT 'unidades',
  snapshot_category text,
  snapshot_cost_per_unit numeric,
  snapshot_total_cost numeric,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT uq_production_plan_recipe UNIQUE (plan_id, recipe_id)
);

-- 4. Índices para consultas eficientes
CREATE INDEX IF NOT EXISTS idx_production_plans_user_id ON public.production_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_production_plans_date ON public.production_plans(user_id, production_date DESC);
CREATE INDEX IF NOT EXISTS idx_production_plan_items_plan_id ON public.production_plan_items(plan_id, position ASC);
CREATE INDEX IF NOT EXISTS idx_production_plan_items_recipe_id ON public.production_plan_items(recipe_id);

-- 5. Trigger para actualizar el timestamp updated_at
CREATE OR REPLACE FUNCTION public.handle_production_plan_timestamps()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_production_plan_timestamps ON public.production_plans;
CREATE TRIGGER trg_production_plan_timestamps
BEFORE UPDATE ON public.production_plans
FOR EACH ROW
EXECUTE FUNCTION public.handle_production_plan_timestamps();

DROP TRIGGER IF EXISTS trg_production_plan_items_timestamps ON public.production_plan_items;
CREATE TRIGGER trg_production_plan_items_timestamps
BEFORE UPDATE ON public.production_plan_items
FOR EACH ROW
EXECUTE FUNCTION public.handle_production_plan_timestamps();

-- 6. Habilitar Row Level Security (RLS)
ALTER TABLE public.production_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_plan_items ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: public.production_plans
DROP POLICY IF EXISTS "Users can view their own production plans" ON public.production_plans;
CREATE POLICY "Users can view their own production plans" ON public.production_plans
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id AND public.is_pro_user(auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own production plans" ON public.production_plans;
CREATE POLICY "Users can insert their own production plans" ON public.production_plans
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id AND public.is_pro_user(auth.uid()));

DROP POLICY IF EXISTS "Users can update their own production plans" ON public.production_plans;
CREATE POLICY "Users can update their own production plans" ON public.production_plans
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id AND public.is_pro_user(auth.uid()))
  WITH CHECK ((select auth.uid()) = user_id AND public.is_pro_user(auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own production plans" ON public.production_plans;
CREATE POLICY "Users can delete their own production plans" ON public.production_plans
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id AND public.is_pro_user(auth.uid()));

-- Políticas RLS: public.production_plan_items
DROP POLICY IF EXISTS "Users can view items of their own production plans" ON public.production_plan_items;
CREATE POLICY "Users can view items of their own production plans" ON public.production_plan_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.production_plans p
    WHERE p.id = production_plan_items.plan_id
      AND p.user_id = auth.uid()
      AND public.is_pro_user(auth.uid())
  ));

DROP POLICY IF EXISTS "Users can insert items into their own production plans" ON public.production_plan_items;
CREATE POLICY "Users can insert items into their own production plans" ON public.production_plan_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.production_plans p
      WHERE p.id = production_plan_items.plan_id
        AND p.user_id = auth.uid()
        AND public.is_pro_user(auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = production_plan_items.recipe_id
        AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update items in their own production plans" ON public.production_plan_items;
CREATE POLICY "Users can update items in their own production plans" ON public.production_plan_items
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.production_plans p
    WHERE p.id = production_plan_items.plan_id
      AND p.user_id = auth.uid()
      AND public.is_pro_user(auth.uid())
  ))
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.production_plans p
      WHERE p.id = production_plan_items.plan_id
        AND p.user_id = auth.uid()
        AND public.is_pro_user(auth.uid())
    )
    AND EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = production_plan_items.recipe_id
        AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete items from their own production plans" ON public.production_plan_items;
CREATE POLICY "Users can delete items from their own production plans" ON public.production_plan_items
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.production_plans p
    WHERE p.id = production_plan_items.plan_id
      AND p.user_id = auth.uid()
      AND public.is_pro_user(auth.uid())
  ));

-- 7. Permisos del Data API
GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_plan_items TO authenticated;

REVOKE ALL ON public.production_plans FROM anon;
REVOKE ALL ON public.production_plan_items FROM anon;

-- 8. Función RPC atómica y transaccional: save_production_plan_transaction
CREATE OR REPLACE FUNCTION public.save_production_plan_transaction(
  p_plan_id uuid DEFAULT NULL,
  p_name text DEFAULT '',
  p_production_date date DEFAULT CURRENT_DATE,
  p_status text DEFAULT 'draft',
  p_notes text DEFAULT '',
  p_checked_ingredients jsonb DEFAULT '[]'::jsonb,
  p_items jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_saved_id uuid;
  v_item jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para guardar planes de producción.';
  END IF;

  IF NOT public.is_pro_user(v_user_id) THEN
    RAISE EXCEPTION 'Esta acción requiere una suscripción Pro activa.';
  END IF;

  IF trim(COALESCE(p_name, '')) = '' THEN
    RAISE EXCEPTION 'El nombre del plan de producción no puede estar vacío.';
  END IF;

  -- 8.1 Crear o actualizar el plan principal
  IF p_plan_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.production_plans WHERE id = p_plan_id AND user_id = v_user_id) THEN
      RAISE EXCEPTION 'El plan de producción no existe o no pertenece a tu cuenta.';
    END IF;

    UPDATE public.production_plans SET
      name = trim(p_name),
      production_date = COALESCE(p_production_date, CURRENT_DATE),
      status = COALESCE(p_status, 'draft'),
      notes = NULLIF(trim(p_notes), ''),
      checked_ingredients = COALESCE(p_checked_ingredients, '[]'::jsonb),
      updated_at = now()
    WHERE id = p_plan_id AND user_id = v_user_id
    RETURNING id INTO v_saved_id;
  ELSE
    INSERT INTO public.production_plans (
      user_id, name, production_date, status, notes, checked_ingredients
    ) VALUES (
      v_user_id,
      trim(p_name),
      COALESCE(p_production_date, CURRENT_DATE),
      COALESCE(p_status, 'draft'),
      NULLIF(trim(p_notes), ''),
      COALESCE(p_checked_ingredients, '[]'::jsonb)
    )
    RETURNING id INTO v_saved_id;
  END IF;

  -- 8.2 Validar que todas las recetas pertenezcan al usuario
  IF p_items IS NOT NULL AND jsonb_typeof(p_items) = 'array' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      IF (v_item->>'recipe_id') IS NOT NULL AND (v_item->>'recipe_id') <> '' THEN
        IF NOT EXISTS (
          SELECT 1 FROM public.recipes
          WHERE id = (v_item->>'recipe_id')::uuid AND user_id = v_user_id
        ) THEN
          RAISE EXCEPTION 'La receta con ID % no existe o no pertenece a tu cuenta.', v_item->>'recipe_id';
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- 8.3 Reemplazo atómico de items planificados
  DELETE FROM public.production_plan_items WHERE plan_id = v_saved_id;
  IF p_items IS NOT NULL AND jsonb_typeof(p_items) = 'array' AND jsonb_array_length(p_items) > 0 THEN
    INSERT INTO public.production_plan_items (
      plan_id,
      recipe_id,
      target_quantity,
      target_unit,
      scaling_factor,
      position,
      notes,
      snapshot_recipe_name,
      snapshot_yield_quantity,
      snapshot_yield_unit,
      snapshot_category,
      snapshot_cost_per_unit,
      snapshot_total_cost,
      updated_at
    )
    SELECT
      v_saved_id,
      (elem->>'recipe_id')::uuid,
      GREATEST(COALESCE((elem->>'target_quantity')::numeric, 1), 0.0001),
      COALESCE(elem->>'target_unit', 'unidades'),
      GREATEST(COALESCE((elem->>'scaling_factor')::numeric, 1), 0.0001),
      COALESCE((elem->>'position')::integer, 0),
      NULLIF(trim(elem->>'notes'), ''),
      COALESCE(trim(elem->>'snapshot_recipe_name'), 'Receta'),
      GREATEST(COALESCE((elem->>'snapshot_yield_quantity')::numeric, 1), 0.0001),
      COALESCE(elem->>'snapshot_yield_unit', 'unidades'),
      NULLIF(trim(elem->>'snapshot_category'), ''),
      NULLIF(elem->>'snapshot_cost_per_unit', '')::numeric,
      NULLIF(elem->>'snapshot_total_cost', '')::numeric,
      now()
    FROM jsonb_array_elements(p_items) AS elem
    WHERE (elem->>'recipe_id') IS NOT NULL AND (elem->>'recipe_id') <> '';
  END IF;

  RETURN v_saved_id;
END;
$$;
