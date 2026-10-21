-- =============================================================================
-- MIGRATION: 20261021020000_cocina_pro_schema.sql
-- Cocina Pro - Fase 3: Biblioteca de ingredientes, historial de precios,
-- pasos de elaboración y persistencia segura con RLS
-- PlayComun Online Pro Architecture
-- =============================================================================

-- 1. Registrar Features para Cocina Pro en el catálogo central
INSERT INTO public.features (code, name, description)
VALUES 
  ('cocina_pro_access', 'Acceso a Cocina Pro', 'Acceso a la microapp profesional de gastronomía y pastelería'),
  ('kitchen_ingredients_library', 'Biblioteca de ingredientes', 'Catálogo personal de insumos reutilizables con precios vigentes y densidades'),
  ('recipe_steps', 'Pasos de elaboración profesionales', 'Gestión de instrucciones, tiempos y temperaturas por paso en recetas')
ON CONFLICT (code) DO UPDATE 
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Asociar a tool_slug 'cocina-pro' como características Premium (Pro)
INSERT INTO public.tool_features (tool_slug, feature_id, is_premium)
SELECT 'cocina-pro', f.id, true
FROM public.features f
WHERE f.code IN ('cocina_pro_access', 'kitchen_ingredients_library', 'recipe_steps')
ON CONFLICT (tool_slug, feature_id) DO UPDATE
SET is_premium = true;

-- 2. Tabla: public.kitchen_ingredients (Biblioteca personal de ingredientes)
CREATE TABLE IF NOT EXISTS public.kitchen_ingredients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  category text,
  package_unit text NOT NULL,
  package_quantity numeric NOT NULL,
  current_price numeric NOT NULL,
  price_updated_at timestamptz DEFAULT now() NOT NULL,
  density_g_ml numeric,
  density_source text,
  is_flour boolean DEFAULT false NOT NULL,
  is_water boolean DEFAULT false NOT NULL,
  estimated_water_percentage numeric,
  water_percentage_source text,
  brand text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT chk_kitchen_ingredients_package_quantity CHECK (package_quantity > 0),
  CONSTRAINT chk_kitchen_ingredients_current_price CHECK (current_price >= 0),
  CONSTRAINT chk_kitchen_ingredients_density CHECK (density_g_ml IS NULL OR density_g_ml > 0),
  CONSTRAINT chk_kitchen_ingredients_water_pct CHECK (estimated_water_percentage IS NULL OR (estimated_water_percentage >= 0 AND estimated_water_percentage <= 100))
);

-- 3. Tabla: public.kitchen_ingredient_price_history (Historial de precios de compra)
CREATE TABLE IF NOT EXISTS public.kitchen_ingredient_price_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ingredient_id uuid REFERENCES public.kitchen_ingredients(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  previous_price numeric NOT NULL,
  new_price numeric NOT NULL,
  change_reason text,
  recorded_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT chk_price_history_prev_price CHECK (previous_price >= 0),
  CONSTRAINT chk_price_history_new_price CHECK (new_price >= 0)
);

-- 4. Triggers atómicos para timestamps e historial de precios
CREATE OR REPLACE FUNCTION public.handle_kitchen_ingredient_timestamps()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF OLD.current_price IS DISTINCT FROM NEW.current_price THEN
    NEW.price_updated_at = now();
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kitchen_ingredient_timestamps ON public.kitchen_ingredients;
CREATE TRIGGER trg_kitchen_ingredient_timestamps
BEFORE UPDATE ON public.kitchen_ingredients
FOR EACH ROW
EXECUTE FUNCTION public.handle_kitchen_ingredient_timestamps();

CREATE OR REPLACE FUNCTION public.record_kitchen_ingredient_price_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.current_price >= 0 THEN
      INSERT INTO public.kitchen_ingredient_price_history (
        ingredient_id,
        user_id,
        previous_price,
        new_price,
        change_reason,
        recorded_at
      ) VALUES (
        NEW.id,
        NEW.user_id,
        NEW.current_price,
        NEW.current_price,
        'Alta inicial de ingrediente',
        NEW.price_updated_at
      );
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.current_price IS DISTINCT FROM NEW.current_price THEN
      INSERT INTO public.kitchen_ingredient_price_history (
        ingredient_id,
        user_id,
        previous_price,
        new_price,
        change_reason,
        recorded_at
      ) VALUES (
        NEW.id,
        NEW.user_id,
        OLD.current_price,
        NEW.current_price,
        'Actualización de precio de compra',
        NEW.price_updated_at
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_record_kitchen_ingredient_price_history ON public.kitchen_ingredients;
CREATE TRIGGER trg_record_kitchen_ingredient_price_history
AFTER INSERT OR UPDATE OF current_price ON public.kitchen_ingredients
FOR EACH ROW
EXECUTE FUNCTION public.record_kitchen_ingredient_price_history();

-- 5. Tabla: public.recipe_steps (Pasos de elaboración, tiempos y temperaturas)
CREATE TABLE IF NOT EXISTS public.recipe_steps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  step_number integer NOT NULL,
  instruction text NOT NULL,
  duration_minutes integer,
  temperature_celsius numeric,
  equipment text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT chk_recipe_steps_step_number CHECK (step_number > 0),
  CONSTRAINT chk_recipe_steps_duration CHECK (duration_minutes IS NULL OR duration_minutes >= 0),
  CONSTRAINT uq_recipe_steps_order UNIQUE (recipe_id, step_number)
);

-- 6. Extensión aditiva y retrocompatible de public.recipes
ALTER TABLE public.recipes 
  ADD COLUMN IF NOT EXISTS prep_time_minutes integer,
  ADD COLUMN IF NOT EXISTS cook_time_minutes integer,
  ADD COLUMN IF NOT EXISTS rest_time_minutes integer,
  ADD COLUMN IF NOT EXISTS baking_temperature_celsius numeric,
  ADD COLUMN IF NOT EXISTS baking_loss_percentage numeric DEFAULT 0;

ALTER TABLE public.recipes
  DROP CONSTRAINT IF EXISTS chk_recipes_baking_loss;
ALTER TABLE public.recipes
  ADD CONSTRAINT chk_recipes_baking_loss 
  CHECK (baking_loss_percentage IS NULL OR (baking_loss_percentage >= 0 AND baking_loss_percentage < 100));

-- 7. Extensión aditiva y retrocompatible de public.recipe_ingredients
ALTER TABLE public.recipe_ingredients 
  ADD COLUMN IF NOT EXISTS ingredient_id uuid REFERENCES public.kitchen_ingredients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS waste_percentage numeric DEFAULT 0;

ALTER TABLE public.recipe_ingredients
  DROP CONSTRAINT IF EXISTS chk_recipe_ingredients_waste;
ALTER TABLE public.recipe_ingredients
  ADD CONSTRAINT chk_recipe_ingredients_waste 
  CHECK (waste_percentage IS NULL OR (waste_percentage >= 0 AND waste_percentage < 100));

-- 8. Trigger de seguridad relacional: Garantizar que el ingrediente de la biblioteca pertenezca al mismo usuario de la receta
CREATE OR REPLACE FUNCTION public.check_recipe_ingredient_ownership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_recipe_user_id uuid;
  v_ingredient_user_id uuid;
BEGIN
  IF NEW.ingredient_id IS NOT NULL THEN
    SELECT user_id INTO v_recipe_user_id FROM public.recipes WHERE id = NEW.recipe_id;
    SELECT user_id INTO v_ingredient_user_id FROM public.kitchen_ingredients WHERE id = NEW.ingredient_id;
    
    IF v_recipe_user_id IS NULL THEN
      RAISE EXCEPTION 'La receta asociada (%) no existe.', NEW.recipe_id;
    END IF;

    IF v_ingredient_user_id IS NULL THEN
      RAISE EXCEPTION 'El ingrediente de la biblioteca (%) no existe.', NEW.ingredient_id;
    END IF;

    IF v_recipe_user_id <> v_ingredient_user_id THEN
      RAISE EXCEPTION 'Violación de seguridad RLS: El ingrediente de la biblioteca (%) no pertenece al propietario de la receta (%).', NEW.ingredient_id, NEW.recipe_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_recipe_ingredient_ownership ON public.recipe_ingredients;
CREATE TRIGGER trg_check_recipe_ingredient_ownership
BEFORE INSERT OR UPDATE OF ingredient_id, recipe_id ON public.recipe_ingredients
FOR EACH ROW
EXECUTE FUNCTION public.check_recipe_ingredient_ownership();

-- 9. Función helper segura: Conteo de ingredientes para usuarios Pro e inactivos
CREATE OR REPLACE FUNCTION public.get_user_kitchen_ingredients_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT count(*)::integer
  FROM public.kitchen_ingredients
  WHERE user_id = auth.uid();
$$;

COMMENT ON FUNCTION public.get_user_kitchen_ingredients_count IS 'Devuelve la cantidad de ingredientes registrados del usuario autenticado sin exponer detalles si su plan Pro no estuviese activo.';

-- 10. Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_kitchen_ingredients_user_id ON public.kitchen_ingredients(user_id);
CREATE INDEX IF NOT EXISTS idx_kitchen_ingredients_user_name ON public.kitchen_ingredients(user_id, lower(name));
CREATE INDEX IF NOT EXISTS idx_kitchen_ingredients_user_category ON public.kitchen_ingredients(user_id, category);
CREATE INDEX IF NOT EXISTS idx_kitchen_price_history_ingredient_id ON public.kitchen_ingredient_price_history(ingredient_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_kitchen_price_history_user_id ON public.kitchen_ingredient_price_history(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe_id ON public.recipe_steps(recipe_id, step_number);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON public.recipe_ingredients(ingredient_id) WHERE ingredient_id IS NOT NULL;

-- 11. Habilitar Row Level Security (RLS)
ALTER TABLE public.kitchen_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kitchen_ingredient_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_steps ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: public.kitchen_ingredients
DROP POLICY IF EXISTS "Users can view their own kitchen ingredients" ON public.kitchen_ingredients;
CREATE POLICY "Users can view their own kitchen ingredients" ON public.kitchen_ingredients
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id AND public.is_pro_user(auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own kitchen ingredients" ON public.kitchen_ingredients;
CREATE POLICY "Users can insert their own kitchen ingredients" ON public.kitchen_ingredients
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id AND public.is_pro_user(auth.uid()));

DROP POLICY IF EXISTS "Users can update their own kitchen ingredients" ON public.kitchen_ingredients;
CREATE POLICY "Users can update their own kitchen ingredients" ON public.kitchen_ingredients
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id AND public.is_pro_user(auth.uid()))
  WITH CHECK ((select auth.uid()) = user_id AND public.is_pro_user(auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own kitchen ingredients" ON public.kitchen_ingredients;
CREATE POLICY "Users can delete their own kitchen ingredients" ON public.kitchen_ingredients
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id AND public.is_pro_user(auth.uid()));

-- Políticas RLS: public.kitchen_ingredient_price_history
DROP POLICY IF EXISTS "Users can view their own ingredient price history" ON public.kitchen_ingredient_price_history;
CREATE POLICY "Users can view their own ingredient price history" ON public.kitchen_ingredient_price_history
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id AND public.is_pro_user(auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own ingredient price history" ON public.kitchen_ingredient_price_history;
CREATE POLICY "Users can insert their own ingredient price history" ON public.kitchen_ingredient_price_history
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id AND public.is_pro_user(auth.uid()));

-- Políticas RLS: public.recipe_steps
DROP POLICY IF EXISTS "Users can view their own recipe steps" ON public.recipe_steps;
CREATE POLICY "Users can view their own recipe steps" ON public.recipe_steps
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.recipes
    WHERE recipes.id = recipe_steps.recipe_id
      AND recipes.user_id = auth.uid()
      AND public.is_pro_user(auth.uid())
  ));

DROP POLICY IF EXISTS "Users can insert their own recipe steps" ON public.recipe_steps;
CREATE POLICY "Users can insert their own recipe steps" ON public.recipe_steps
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.recipes
    WHERE recipes.id = recipe_steps.recipe_id
      AND recipes.user_id = auth.uid()
      AND public.is_pro_user(auth.uid())
  ));

DROP POLICY IF EXISTS "Users can update their own recipe steps" ON public.recipe_steps;
CREATE POLICY "Users can update their own recipe steps" ON public.recipe_steps
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.recipes
    WHERE recipes.id = recipe_steps.recipe_id
      AND recipes.user_id = auth.uid()
      AND public.is_pro_user(auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.recipes
    WHERE recipes.id = recipe_steps.recipe_id
      AND recipes.user_id = auth.uid()
      AND public.is_pro_user(auth.uid())
  ));

DROP POLICY IF EXISTS "Users can delete their own recipe steps" ON public.recipe_steps;
CREATE POLICY "Users can delete their own recipe steps" ON public.recipe_steps
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.recipes
    WHERE recipes.id = recipe_steps.recipe_id
      AND recipes.user_id = auth.uid()
      AND public.is_pro_user(auth.uid())
  ));

-- 12. Permisos del Data API
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kitchen_ingredients TO authenticated;
GRANT SELECT, INSERT ON public.kitchen_ingredient_price_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recipe_steps TO authenticated;

REVOKE ALL ON public.kitchen_ingredients FROM anon;
REVOKE ALL ON public.kitchen_ingredient_price_history FROM anon;
REVOKE ALL ON public.recipe_steps FROM anon;
