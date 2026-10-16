-- =============================================================================
-- MIGRATION: Control de Gastos Pro Restrictions, Income/Expense Types and Data Preservation
-- PlayComun Online Pro Architecture
-- =============================================================================

-- 1. Add 'type' column to public.expenses (defaults to 'expense' for backward compatibility)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'expenses' 
      AND column_name = 'type'
  ) THEN
    ALTER TABLE public.expenses 
    ADD COLUMN type text NOT NULL DEFAULT 'expense';

    ALTER TABLE public.expenses 
    ADD CONSTRAINT expenses_type_check CHECK (type IN ('income', 'expense'));
  END IF;
END $$;

-- 2. Create index on type column for faster filtering
CREATE INDEX IF NOT EXISTS idx_expenses_type ON public.expenses(type);

-- 3. Register features for Control de Gastos in the features catalog
INSERT INTO public.features (code, name, description)
VALUES 
  ('sync_cloud', 'Sincronización en la nube', 'Guardar y sincronizar ingresos y gastos en tu cuenta PlayComun Online'),
  ('export_excel', 'Exportar a Excel', 'Descargar los movimientos financieros en formato de hoja de cálculo Excel')
ON CONFLICT (code) DO UPDATE 
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- 4. Map features to tool_slug 'control-gastos' as Premium (Pro)
INSERT INTO public.tool_features (tool_slug, feature_id, is_premium)
SELECT 'control-gastos', f.id, true
FROM public.features f
WHERE f.code IN ('sync_cloud', 'export_excel')
ON CONFLICT (tool_slug, feature_id) DO UPDATE
SET is_premium = true;

-- 5. Security Definer Function: get_user_expense_count
-- Allows users who lost Pro to know their exact preserved record count without exposing movement details
CREATE OR REPLACE FUNCTION public.get_user_expense_count()
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT count(*)::integer
  FROM public.expenses
  WHERE user_id = auth.uid();
$$;

COMMENT ON FUNCTION public.get_user_expense_count IS 'Devuelve la cantidad de movimientos (ingresos y gastos) guardados del usuario autenticado sin exponer detalles si no tiene Pro activo.';

-- 6. Table for custom user categories (Pro cloud sync)
CREATE TABLE IF NOT EXISTS public.expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  color text,
  icon text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, name, type)
);

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_expense_categories_user_id ON public.expense_categories(user_id);

-- 7. Update RLS on public.expenses to enforce Pro subscription
-- Important: Data is NOT deleted when Pro expires; RLS merely blocks remote mutations and reads,
-- while get_user_expense_count() confirms data preservation.
DROP POLICY IF EXISTS "Users can view their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can insert their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON public.expenses;

CREATE POLICY "Users can view their own expenses" ON public.expenses
  FOR SELECT USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()));

CREATE POLICY "Users can insert their own expenses" ON public.expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id AND public.is_pro_user(auth.uid()));

CREATE POLICY "Users can update their own expenses" ON public.expenses
  FOR UPDATE USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.is_pro_user(auth.uid()));

CREATE POLICY "Users can delete their own expenses" ON public.expenses
  FOR DELETE USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()));

-- 8. RLS on public.expense_categories
DROP POLICY IF EXISTS "Users can view their own expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can insert their own expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can update their own expense categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Users can delete their own expense categories" ON public.expense_categories;

CREATE POLICY "Users can view their own expense categories" ON public.expense_categories
  FOR SELECT USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()));

CREATE POLICY "Users can insert their own expense categories" ON public.expense_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id AND public.is_pro_user(auth.uid()));

CREATE POLICY "Users can update their own expense categories" ON public.expense_categories
  FOR UPDATE USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.is_pro_user(auth.uid()));

CREATE POLICY "Users can delete their own expense categories" ON public.expense_categories
  FOR DELETE USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()));
