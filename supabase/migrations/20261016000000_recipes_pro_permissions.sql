-- =============================================================================
-- MIGRATION: Pro Restrictions and Data Preservation for Costo de Receta
-- PlayComun Online Pro Architecture
-- =============================================================================

-- 1. Register Features for Costo de Receta
INSERT INTO public.features (code, name, description)
VALUES 
  ('save_recipes', 'Guardar recetas en la nube', 'Guardar y almacenar recetas con ingredientes y costos en tu cuenta'),
  ('recipe_library', 'Biblioteca de recetas guardadas', 'Acceso a la biblioteca de recetas, consulta, edición y duplicación')
ON CONFLICT (code) DO UPDATE 
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 2. Map Features to tool_slug 'costo-receta' as Premium (Pro)
INSERT INTO public.tool_features (tool_slug, feature_id, is_premium)
SELECT 'costo-receta', f.id, true
FROM public.features f
WHERE f.code IN ('save_recipes', 'recipe_library')
ON CONFLICT (tool_slug, feature_id) DO UPDATE
SET is_premium = true;

-- 3. Security Definer Function: Safely get recipe count for user even when Pro is inactive
CREATE OR REPLACE FUNCTION public.get_user_recipe_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT count(*)::integer
  FROM public.recipes
  WHERE user_id = auth.uid();
$$;

COMMENT ON FUNCTION public.get_user_recipe_count IS 'Devuelve la cantidad de recetas guardadas del usuario autenticado sin exponer detalles si no tiene Pro activo.';

-- 4. Security Definer Function: Check if recipe exists for user (distinguishes 404 from 403 Pro lock)
CREATE OR REPLACE FUNCTION public.user_recipe_exists(p_recipe_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT exists (
    SELECT 1
    FROM public.recipes
    WHERE id = p_recipe_id AND user_id = auth.uid()
  );
$$;

COMMENT ON FUNCTION public.user_recipe_exists IS 'Verifica si una receta pertenece al usuario autenticado, permitiendo distinguir entre receta no encontrada y receta bloqueada por falta de Pro.';

-- 5. Row Level Security (RLS) on public.recipes
ALTER POLICY "Users can view their own recipes" ON public.recipes 
  USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()));

ALTER POLICY "Users can insert their own recipes" ON public.recipes 
  WITH CHECK (auth.uid() = user_id AND public.is_pro_user(auth.uid()));

ALTER POLICY "Users can update their own recipes" ON public.recipes 
  USING (auth.uid() = user_id AND public.is_pro_user(auth.uid())) 
  WITH CHECK (auth.uid() = user_id AND public.is_pro_user(auth.uid()));

ALTER POLICY "Users can delete their own recipes" ON public.recipes 
  USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()));

-- 6. Row Level Security (RLS) on public.recipe_ingredients
ALTER POLICY "Users can view their own recipe ingredients" ON public.recipe_ingredients 
  USING (EXISTS (SELECT 1 FROM public.recipes WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = auth.uid() AND public.is_pro_user(auth.uid())));

ALTER POLICY "Users can insert their own recipe ingredients" ON public.recipe_ingredients 
  WITH CHECK (EXISTS (SELECT 1 FROM public.recipes WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = auth.uid() AND public.is_pro_user(auth.uid())));

ALTER POLICY "Users can update their own recipe ingredients" ON public.recipe_ingredients 
  USING (EXISTS (SELECT 1 FROM public.recipes WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = auth.uid() AND public.is_pro_user(auth.uid()))) 
  WITH CHECK (EXISTS (SELECT 1 FROM public.recipes WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = auth.uid() AND public.is_pro_user(auth.uid())));

ALTER POLICY "Users can delete their own recipe ingredients" ON public.recipe_ingredients 
  USING (EXISTS (SELECT 1 FROM public.recipes WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = auth.uid() AND public.is_pro_user(auth.uid())));

-- 7. Row Level Security (RLS) on public.recipe_additional_costs
ALTER POLICY "Users can view their own recipe additional costs" ON public.recipe_additional_costs 
  USING (EXISTS (SELECT 1 FROM public.recipes WHERE recipes.id = recipe_additional_costs.recipe_id AND recipes.user_id = auth.uid() AND public.is_pro_user(auth.uid())));

ALTER POLICY "Users can insert their own recipe additional costs" ON public.recipe_additional_costs 
  WITH CHECK (EXISTS (SELECT 1 FROM public.recipes WHERE recipes.id = recipe_additional_costs.recipe_id AND recipes.user_id = auth.uid() AND public.is_pro_user(auth.uid())));

ALTER POLICY "Users can update their own recipe additional costs" ON public.recipe_additional_costs 
  USING (EXISTS (SELECT 1 FROM public.recipes WHERE recipes.id = recipe_additional_costs.recipe_id AND recipes.user_id = auth.uid() AND public.is_pro_user(auth.uid()))) 
  WITH CHECK (EXISTS (SELECT 1 FROM public.recipes WHERE recipes.id = recipe_additional_costs.recipe_id AND recipes.user_id = auth.uid() AND public.is_pro_user(auth.uid())));

ALTER POLICY "Users can delete their own recipe additional costs" ON public.recipe_additional_costs 
  USING (EXISTS (SELECT 1 FROM public.recipes WHERE recipes.id = recipe_additional_costs.recipe_id AND recipes.user_id = auth.uid() AND public.is_pro_user(auth.uid())));
