-- Add pricing_mode and target_markup to recipes table
ALTER TABLE public.recipes 
ADD COLUMN pricing_mode text NOT NULL DEFAULT 'margin',
ADD COLUMN target_markup numeric NOT NULL DEFAULT 0;
