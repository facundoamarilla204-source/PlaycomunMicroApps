-- ==============================================================================
-- Cocina Pro - Migración 20261021150000: Subrecetas, elaboraciones compuestas y persistencia atómica
-- ==============================================================================

-- 1. Crear tabla relacional de subrecetas
CREATE TABLE IF NOT EXISTS public.recipe_subrecipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  subrecipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE RESTRICT,
  quantity numeric NOT NULL CHECK (quantity > 0),
  unit text NOT NULL,
  waste_percentage numeric NOT NULL DEFAULT 0 CHECK (waste_percentage >= 0 AND waste_percentage < 100),
  position integer NOT NULL DEFAULT 0,
  notes text,
  reference_yield_quantity numeric,
  reference_yield_unit text,
  reference_unit_cost numeric,
  reference_total_cost numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chk_no_self_subrecipe CHECK (recipe_id <> subrecipe_id),
  CONSTRAINT uq_recipe_subrecipe UNIQUE (recipe_id, subrecipe_id)
);

-- Índices para consultas relacionales y validación rápida de dependencias
CREATE INDEX IF NOT EXISTS idx_recipe_subrecipes_recipe_id ON public.recipe_subrecipes(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_subrecipes_subrecipe_id ON public.recipe_subrecipes(subrecipe_id);

-- 2. Función y trigger para prevención estricta de dependencias circulares en PostgreSQL
CREATE OR REPLACE FUNCTION public.check_recipe_subrecipe_cycle()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- 2.1 Validación directa de auto-referencia
  IF NEW.recipe_id = NEW.subrecipe_id THEN
    RAISE EXCEPTION 'Una receta no puede incluirse a sí misma como subreceta.';
  END IF;

  -- 2.2 Validación recursiva de ciclos indirectos
  -- Comprueba si NEW.recipe_id aparece en cualquier nivel inferior del árbol de NEW.subrecipe_id
  IF EXISTS (
    WITH RECURSIVE subrecipe_tree AS (
      SELECT subrecipe_id
      FROM public.recipe_subrecipes
      WHERE recipe_id = NEW.subrecipe_id
      UNION ALL
      SELECT sr.subrecipe_id
      FROM public.recipe_subrecipes sr
      INNER JOIN subrecipe_tree st ON sr.recipe_id = st.subrecipe_id
    )
    SELECT 1 FROM subrecipe_tree WHERE subrecipe_id = NEW.recipe_id
  ) THEN
    RAISE EXCEPTION 'Dependencia circular detectada: la receta que intentas agregar ya depende directa o indirectamente de esta receta.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_recipe_subrecipe_cycle ON public.recipe_subrecipes;
CREATE TRIGGER trg_check_recipe_subrecipe_cycle
BEFORE INSERT OR UPDATE ON public.recipe_subrecipes
FOR EACH ROW
EXECUTE FUNCTION public.check_recipe_subrecipe_cycle();

-- 3. Habilitar RLS y políticas de aislamiento para subrecetas
ALTER TABLE public.recipe_subrecipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view subrecipes of their own recipes" ON public.recipe_subrecipes;
CREATE POLICY "Users can view subrecipes of their own recipes"
  ON public.recipe_subrecipes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_id AND r.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert subrecipes for their own recipes" ON public.recipe_subrecipes;
CREATE POLICY "Users can insert subrecipes for their own recipes"
  ON public.recipe_subrecipes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_id AND r.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.recipes r2
      WHERE r2.id = subrecipe_id AND r2.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update subrecipes of their own recipes" ON public.recipe_subrecipes;
CREATE POLICY "Users can update subrecipes of their own recipes"
  ON public.recipe_subrecipes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_id AND r.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_id AND r.user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.recipes r2
      WHERE r2.id = subrecipe_id AND r2.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete subrecipes of their own recipes" ON public.recipe_subrecipes;
CREATE POLICY "Users can delete subrecipes of their own recipes"
  ON public.recipe_subrecipes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes r
      WHERE r.id = recipe_id AND r.user_id = auth.uid()
    )
  );

-- 4. Función auxiliar para consultar recetas que dependen de una subreceta (prevenir eliminación con feedback claro)
CREATE OR REPLACE FUNCTION public.get_subrecipe_parents(p_subrecipe_id uuid)
RETURNS TABLE (
  parent_recipe_id uuid,
  parent_recipe_name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT r.id AS parent_recipe_id, r.name AS parent_recipe_name
  FROM public.recipe_subrecipes rs
  JOIN public.recipes r ON r.id = rs.recipe_id
  WHERE rs.subrecipe_id = p_subrecipe_id
    AND r.user_id = auth.uid()
  ORDER BY r.name ASC;
$$;

-- 5. Función RPC atómica y transaccional save_recipe_transaction ampliada para incluir subrecetas
CREATE OR REPLACE FUNCTION public.save_recipe_transaction(
  p_recipe_id uuid DEFAULT NULL,
  p_name text DEFAULT '',
  p_category text DEFAULT '',
  p_description text DEFAULT '',
  p_yield_quantity numeric DEFAULT 1,
  p_yield_unit text DEFAULT 'unidades',
  p_target_margin numeric DEFAULT 0,
  p_target_markup numeric DEFAULT 0,
  p_pricing_mode text DEFAULT 'margin',
  p_prep_time_minutes integer DEFAULT NULL,
  p_cook_time_minutes integer DEFAULT NULL,
  p_rest_time_minutes integer DEFAULT NULL,
  p_baking_temperature_celsius numeric DEFAULT NULL,
  p_baking_loss_percentage numeric DEFAULT 0,
  p_ingredients jsonb DEFAULT '[]'::jsonb,
  p_additional_costs jsonb DEFAULT '[]'::jsonb,
  p_steps jsonb DEFAULT '[]'::jsonb,
  p_subrecipes jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_saved_id uuid;
  v_ing jsonb;
  v_step jsonb;
  v_sub jsonb;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para guardar recetas.';
  END IF;

  IF NOT public.is_pro_user(v_user_id) THEN
    RAISE EXCEPTION 'Esta acción requiere una suscripción Pro activa.';
  END IF;

  -- 5.1 Validar propiedad de la receta principal si es edición
  IF p_recipe_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.recipes WHERE id = p_recipe_id AND user_id = v_user_id) THEN
      RAISE EXCEPTION 'La receta no existe o no pertenece a tu cuenta.';
    END IF;

    UPDATE public.recipes SET
      name = trim(p_name),
      category = trim(COALESCE(p_category, '')),
      description = trim(COALESCE(p_description, '')),
      yield_quantity = GREATEST(COALESCE(p_yield_quantity, 1), 0.001),
      yield_unit = COALESCE(p_yield_unit, 'unidades'),
      target_margin = COALESCE(p_target_margin, 0),
      target_markup = COALESCE(p_target_markup, 0),
      pricing_mode = COALESCE(p_pricing_mode, 'margin'),
      prep_time_minutes = p_prep_time_minutes,
      cook_time_minutes = p_cook_time_minutes,
      rest_time_minutes = p_rest_time_minutes,
      baking_temperature_celsius = p_baking_temperature_celsius,
      baking_loss_percentage = COALESCE(p_baking_loss_percentage, 0),
      updated_at = now()
    WHERE id = p_recipe_id AND user_id = v_user_id
    RETURNING id INTO v_saved_id;
  ELSE
    INSERT INTO public.recipes (
      user_id, name, category, description, yield_quantity, yield_unit,
      target_margin, target_markup, pricing_mode, prep_time_minutes,
      cook_time_minutes, rest_time_minutes, baking_temperature_celsius,
      baking_loss_percentage
    ) VALUES (
      v_user_id, trim(p_name), trim(COALESCE(p_category, '')), trim(COALESCE(p_description, '')),
      GREATEST(COALESCE(p_yield_quantity, 1), 0.001), COALESCE(p_yield_unit, 'unidades'),
      COALESCE(p_target_margin, 0), COALESCE(p_target_markup, 0), COALESCE(p_pricing_mode, 'margin'),
      p_prep_time_minutes, p_cook_time_minutes, p_rest_time_minutes,
      p_baking_temperature_celsius, COALESCE(p_baking_loss_percentage, 0)
    )
    RETURNING id INTO v_saved_id;
  END IF;

  -- 5.2 Validar que los ingredientes vinculados pertenezcan al usuario
  IF p_ingredients IS NOT NULL AND jsonb_typeof(p_ingredients) = 'array' THEN
    FOR v_ing IN SELECT * FROM jsonb_array_elements(p_ingredients)
    LOOP
      IF (v_ing->>'ingredient_id') IS NOT NULL AND (v_ing->>'ingredient_id') <> '' THEN
        IF NOT EXISTS (
          SELECT 1 FROM public.kitchen_ingredients
          WHERE id = (v_ing->>'ingredient_id')::uuid AND user_id = v_user_id
        ) THEN
          RAISE EXCEPTION 'El insumo con ID % no pertenece a tu biblioteca personal.', v_ing->>'ingredient_id';
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- 5.3 Validar que todas las subrecetas pertenezcan al usuario
  IF p_subrecipes IS NOT NULL AND jsonb_typeof(p_subrecipes) = 'array' THEN
    FOR v_sub IN SELECT * FROM jsonb_array_elements(p_subrecipes)
    LOOP
      IF (v_sub->>'subrecipe_id') IS NOT NULL AND (v_sub->>'subrecipe_id') <> '' THEN
        IF NOT EXISTS (
          SELECT 1 FROM public.recipes
          WHERE id = (v_sub->>'subrecipe_id')::uuid AND user_id = v_user_id
        ) THEN
          RAISE EXCEPTION 'La subreceta con ID % no existe o no pertenece a tu cuenta.', v_sub->>'subrecipe_id';
        END IF;

        IF (v_sub->>'subrecipe_id')::uuid = v_saved_id THEN
          RAISE EXCEPTION 'Una receta no puede incluirse a sí misma como subreceta.';
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- 5.4 Reemplazo atómico de ingredientes directos
  DELETE FROM public.recipe_ingredients WHERE recipe_id = v_saved_id;
  IF p_ingredients IS NOT NULL AND jsonb_typeof(p_ingredients) = 'array' AND jsonb_array_length(p_ingredients) > 0 THEN
    INSERT INTO public.recipe_ingredients (
      recipe_id, name, quantity, unit, reference_quantity, reference_unit,
      reference_price, calculated_cost, ingredient_id, waste_percentage
    )
    SELECT
      v_saved_id,
      trim(elem->>'name'),
      (elem->>'quantity')::numeric,
      elem->>'unit',
      COALESCE((elem->>'reference_quantity')::numeric, 1),
      elem->>'reference_unit',
      COALESCE((elem->>'reference_price')::numeric, 0),
      COALESCE((elem->>'calculated_cost')::numeric, 0),
      NULLIF(elem->>'ingredient_id', '')::uuid,
      COALESCE((elem->>'waste_percentage')::numeric, 0)
    FROM jsonb_array_elements(p_ingredients) AS elem
    WHERE trim(COALESCE(elem->>'name', '')) <> '';
  END IF;

  -- 5.5 Reemplazo atómico de costos adicionales
  DELETE FROM public.recipe_additional_costs WHERE recipe_id = v_saved_id;
  IF p_additional_costs IS NOT NULL AND jsonb_typeof(p_additional_costs) = 'array' AND jsonb_array_length(p_additional_costs) > 0 THEN
    INSERT INTO public.recipe_additional_costs (
      recipe_id, name, amount
    )
    SELECT
      v_saved_id,
      trim(elem->>'name'),
      COALESCE((elem->>'amount')::numeric, 0)
    FROM jsonb_array_elements(p_additional_costs) AS elem
    WHERE trim(COALESCE(elem->>'name', '')) <> '';
  END IF;

  -- 5.6 Reemplazo atómico de pasos de elaboración
  DELETE FROM public.recipe_steps WHERE recipe_id = v_saved_id;
  IF p_steps IS NOT NULL AND jsonb_typeof(p_steps) = 'array' AND jsonb_array_length(p_steps) > 0 THEN
    FOR v_step IN SELECT * FROM jsonb_array_elements(p_steps)
    LOOP
      IF (v_step->>'duration_minutes') IS NOT NULL AND (v_step->>'duration_minutes')::numeric < 0 THEN
        RAISE EXCEPTION 'La duración del paso no puede ser negativa.';
      END IF;
    END LOOP;

    INSERT INTO public.recipe_steps (
      recipe_id, step_number, instruction, duration_minutes,
      temperature_celsius, equipment, notes, updated_at
    )
    SELECT
      v_saved_id,
      (row_number() OVER ())::integer,
      trim(elem->>'instruction'),
      NULLIF(elem->>'duration_minutes', '')::integer,
      NULLIF(elem->>'temperature_celsius', '')::numeric,
      NULLIF(trim(elem->>'equipment'), ''),
      NULLIF(trim(elem->>'notes'), ''),
      now()
    FROM jsonb_array_elements(p_steps) AS elem
    WHERE trim(COALESCE(elem->>'instruction', '')) <> '';
  END IF;

  -- 5.7 Reemplazo atómico de subrecetas vinculadas
  DELETE FROM public.recipe_subrecipes WHERE recipe_id = v_saved_id;
  IF p_subrecipes IS NOT NULL AND jsonb_typeof(p_subrecipes) = 'array' AND jsonb_array_length(p_subrecipes) > 0 THEN
    INSERT INTO public.recipe_subrecipes (
      recipe_id, subrecipe_id, quantity, unit, waste_percentage,
      position, notes, reference_yield_quantity, reference_yield_unit,
      reference_unit_cost, reference_total_cost, updated_at
    )
    SELECT
      v_saved_id,
      (elem->>'subrecipe_id')::uuid,
      GREATEST(COALESCE((elem->>'quantity')::numeric, 1), 0.0001),
      COALESCE(elem->>'unit', 'unidades'),
      COALESCE((elem->>'waste_percentage')::numeric, 0),
      COALESCE((elem->>'position')::integer, 0),
      NULLIF(trim(elem->>'notes'), ''),
      NULLIF(elem->>'reference_yield_quantity', '')::numeric,
      NULLIF(trim(elem->>'reference_yield_unit'), ''),
      NULLIF(elem->>'reference_unit_cost', '')::numeric,
      NULLIF(elem->>'reference_total_cost', '')::numeric,
      now()
    FROM jsonb_array_elements(p_subrecipes) AS elem
    WHERE (elem->>'subrecipe_id') IS NOT NULL AND (elem->>'subrecipe_id') <> '';
  END IF;

  RETURN v_saved_id;
END;
$$;
