-- =============================================================================
-- MIGRATION: Price Lists Pro Restrictions and Data Preservation
-- PlayComun Online Pro Architecture
-- =============================================================================

-- 1. Add extra columns to price_lists if not present
ALTER TABLE public.price_lists
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'ARS' NOT NULL,
ADD COLUMN IF NOT EXISTS logo_url text;

-- 2. Register features for Generador de Listas de Precios
INSERT INTO public.features (code, name, description)
VALUES 
  ('save_price_lists', 'Guardar listas en la nube', 'Guardar y sincronizar listas de precios en tu cuenta PlayComun Online'),
  ('price_list_library', 'Biblioteca de listas guardadas', 'Acceso a la biblioteca de listas, búsqueda, edición y duplicación')
ON CONFLICT (code) DO UPDATE 
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 3. Map to tool_slug 'generador-listas-precios' as Premium (Pro)
INSERT INTO public.tool_features (tool_slug, feature_id, is_premium)
SELECT 'generador-listas-precios', f.id, true
FROM public.features f
WHERE f.code IN ('save_price_lists', 'price_list_library')
ON CONFLICT (tool_slug, feature_id) DO UPDATE
SET is_premium = true;

-- 4. Security Definer Function: get_user_price_list_count
CREATE OR REPLACE FUNCTION public.get_user_price_list_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT count(*)::integer
  FROM public.price_lists
  WHERE user_id = auth.uid();
$$;

COMMENT ON FUNCTION public.get_user_price_list_count IS 'Devuelve la cantidad de listas de precios del usuario autenticado sin exponer detalles si no tiene Pro activo.';

-- 5. Security Definer Function: user_price_list_exists
CREATE OR REPLACE FUNCTION public.user_price_list_exists(p_list_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT exists (
    SELECT 1
    FROM public.price_lists
    WHERE id = p_list_id AND user_id = auth.uid()
  );
$$;

COMMENT ON FUNCTION public.user_price_list_exists IS 'Verifica si una lista pertenece al usuario autenticado para diferenciar 404 de 403 Pro lock.';

-- 6. RLS on public.price_lists
DROP POLICY IF EXISTS "Users can view their own price lists" ON public.price_lists;
DROP POLICY IF EXISTS "Users can insert their own price lists" ON public.price_lists;
DROP POLICY IF EXISTS "Users can update their own price lists" ON public.price_lists;
DROP POLICY IF EXISTS "Users can delete their own price lists" ON public.price_lists;

CREATE POLICY "Users can view their own price lists" ON public.price_lists
  FOR SELECT USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()));

CREATE POLICY "Users can insert their own price lists" ON public.price_lists
  FOR INSERT WITH CHECK (auth.uid() = user_id AND public.is_pro_user(auth.uid()));

CREATE POLICY "Users can update their own price lists" ON public.price_lists
  FOR UPDATE USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.is_pro_user(auth.uid()));

CREATE POLICY "Users can delete their own price lists" ON public.price_lists
  FOR DELETE USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()));

-- 7. RLS on public.price_list_categories
DROP POLICY IF EXISTS "Users can manage categories of their lists" ON public.price_list_categories;
DROP POLICY IF EXISTS "Users can view categories of their lists" ON public.price_list_categories;
DROP POLICY IF EXISTS "Users can insert categories of their lists" ON public.price_list_categories;
DROP POLICY IF EXISTS "Users can update categories of their lists" ON public.price_list_categories;
DROP POLICY IF EXISTS "Users can delete categories of their lists" ON public.price_list_categories;

CREATE POLICY "Users can view categories of their lists" ON public.price_list_categories
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.price_lists WHERE price_lists.id = price_list_categories.list_id AND price_lists.user_id = auth.uid() AND public.is_pro_user(auth.uid())));

CREATE POLICY "Users can insert categories of their lists" ON public.price_list_categories
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.price_lists WHERE price_lists.id = price_list_categories.list_id AND price_lists.user_id = auth.uid() AND public.is_pro_user(auth.uid())));

CREATE POLICY "Users can update categories of their lists" ON public.price_list_categories
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.price_lists WHERE price_lists.id = price_list_categories.list_id AND price_lists.user_id = auth.uid() AND public.is_pro_user(auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.price_lists WHERE price_lists.id = price_list_categories.list_id AND price_lists.user_id = auth.uid() AND public.is_pro_user(auth.uid())));

CREATE POLICY "Users can delete categories of their lists" ON public.price_list_categories
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.price_lists WHERE price_lists.id = price_list_categories.list_id AND price_lists.user_id = auth.uid() AND public.is_pro_user(auth.uid())));

-- 8. RLS on public.price_list_products
DROP POLICY IF EXISTS "Users can view products of their price lists" ON public.price_list_products;
DROP POLICY IF EXISTS "Users can insert products to their price lists" ON public.price_list_products;
DROP POLICY IF EXISTS "Users can update products of their price lists" ON public.price_list_products;
DROP POLICY IF EXISTS "Users can delete products of their price lists" ON public.price_list_products;

CREATE POLICY "Users can view products of their price lists" ON public.price_list_products
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.price_lists WHERE price_lists.id = price_list_products.list_id AND price_lists.user_id = auth.uid() AND public.is_pro_user(auth.uid())));

CREATE POLICY "Users can insert products to their price lists" ON public.price_list_products
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.price_lists WHERE price_lists.id = list_id AND price_lists.user_id = auth.uid() AND public.is_pro_user(auth.uid())));

CREATE POLICY "Users can update products of their price lists" ON public.price_list_products
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.price_lists WHERE price_lists.id = price_list_products.list_id AND price_lists.user_id = auth.uid() AND public.is_pro_user(auth.uid())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.price_lists WHERE price_lists.id = price_list_products.list_id AND price_lists.user_id = auth.uid() AND public.is_pro_user(auth.uid())));

CREATE POLICY "Users can delete products of their price lists" ON public.price_list_products
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.price_lists WHERE price_lists.id = price_list_products.list_id AND price_lists.user_id = auth.uid() AND public.is_pro_user(auth.uid())));
