-- Migration for Price List Generator v2
-- This adds the "rubro" column to price_lists and creates the price_list_categories table.

-- Add rubro to price_lists (defaulting to general)
ALTER TABLE price_lists 
ADD COLUMN IF NOT EXISTS rubro text DEFAULT 'general' NOT NULL;

-- Create price_list_categories table
CREATE TABLE IF NOT EXISTS price_list_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add category reference and new fields to price_list_products
ALTER TABLE price_list_products 
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES price_list_categories(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS duration text,
ADD COLUMN IF NOT EXISTS variant text,
ADD COLUMN IF NOT EXISTS unit text;

-- RLS Policies for Categories
ALTER TABLE price_list_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage categories of their lists" ON price_list_categories
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM price_lists 
      WHERE price_lists.id = price_list_categories.list_id 
      AND price_lists.user_id = auth.uid()
    )
  );
