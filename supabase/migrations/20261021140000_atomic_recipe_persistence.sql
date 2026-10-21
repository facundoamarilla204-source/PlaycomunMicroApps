-- ==============================================================================
-- Cocina Pro - Migración 20261021140000: Persistencia atómica transaccional de recetas
-- ==============================================================================

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
  p_steps jsonb DEFAULT '[]'::jsonb
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
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para guardar recetas.';
  END IF;

  IF NOT public.is_pro_user(v_user_id) THEN
    RAISE EXCEPTION 'Esta acción requiere una suscripción Pro activa.';
  END IF;

  -- 1. Validar propiedad de la receta si es edición
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

  -- 2. Validar que los ingredientes vinculados pertenezcan al usuario
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

  -- 3. Reemplazo atómico de ingredientes
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

  -- 4. Reemplazo atómico de costos adicionales
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

  -- 5. Reemplazo atómico de pasos de elaboración
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

  RETURN v_saved_id;
END;
$$;
