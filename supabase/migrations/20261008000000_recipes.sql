-- Tables for Costo de Receta
CREATE TABLE public.recipes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  category text,
  description text,
  yield_quantity numeric NOT NULL DEFAULT 1,
  yield_unit text NOT NULL DEFAULT 'unidades',
  target_margin numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.recipe_ingredients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  quantity numeric NOT NULL,
  unit text NOT NULL,
  reference_quantity numeric NOT NULL,
  reference_unit text NOT NULL,
  reference_price numeric NOT NULL,
  calculated_cost numeric NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE public.recipe_additional_costs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  amount numeric NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- RLS
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_additional_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recipes" ON public.recipes
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own recipes" ON public.recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own recipes" ON public.recipes
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own recipes" ON public.recipes
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own recipe ingredients" ON public.recipe_ingredients
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.recipes WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = auth.uid()));
CREATE POLICY "Users can insert their own recipe ingredients" ON public.recipe_ingredients
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.recipes WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = auth.uid()));
CREATE POLICY "Users can update their own recipe ingredients" ON public.recipe_ingredients
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.recipes WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = auth.uid()));
CREATE POLICY "Users can delete their own recipe ingredients" ON public.recipe_ingredients
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.recipes WHERE recipes.id = recipe_ingredients.recipe_id AND recipes.user_id = auth.uid()));

CREATE POLICY "Users can view their own recipe additional costs" ON public.recipe_additional_costs
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.recipes WHERE recipes.id = recipe_additional_costs.recipe_id AND recipes.user_id = auth.uid()));
CREATE POLICY "Users can insert their own recipe additional costs" ON public.recipe_additional_costs
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.recipes WHERE recipes.id = recipe_additional_costs.recipe_id AND recipes.user_id = auth.uid()));
CREATE POLICY "Users can update their own recipe additional costs" ON public.recipe_additional_costs
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.recipes WHERE recipes.id = recipe_additional_costs.recipe_id AND recipes.user_id = auth.uid()));
CREATE POLICY "Users can delete their own recipe additional costs" ON public.recipe_additional_costs
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.recipes WHERE recipes.id = recipe_additional_costs.recipe_id AND recipes.user_id = auth.uid()));

-- Indexes for performance
CREATE INDEX idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX idx_recipe_ingredients_recipe_id ON public.recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_additional_costs_recipe_id ON public.recipe_additional_costs(recipe_id);
