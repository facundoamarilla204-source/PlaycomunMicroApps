-- =============================================================================
-- MIGRATION: 20261019213000_user_color_palettes.sql
-- PlayComun Online: Almacenamiento aislado y seguro en Supabase para favoritos
-- del Generador de Paletas de Colores con Row Level Security (RLS) por usuario.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_color_palettes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  colors text[] NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_user_color_palettes_user_id ON public.user_color_palettes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_color_palettes_created_at ON public.user_color_palettes(user_id, created_at DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.user_color_palettes ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad RLS: Aislamiento total por auth.uid()
-- SELECT: Solo el propietario autenticado puede ver sus paletas
CREATE POLICY "Users can select their own color palettes"
  ON public.user_color_palettes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: Solo el propietario autenticado puede insertar asignando su propio user_id
CREATE POLICY "Users can insert their own color palettes"
  ON public.user_color_palettes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Solo el propietario autenticado puede actualizar sus propias paletas
CREATE POLICY "Users can update their own color palettes"
  ON public.user_color_palettes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Solo el propietario autenticado puede eliminar sus propias paletas
CREATE POLICY "Users can delete their own color palettes"
  ON public.user_color_palettes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
