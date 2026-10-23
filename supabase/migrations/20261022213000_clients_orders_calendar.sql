-- ==============================================================================
-- Cocina Pro - Migración 20261022213000: Clientes, Pedidos y Calendario de Entregas
-- PlayComun Online Pro Architecture - Fase 10
-- Totalmente compatible con PostgreSQL 17 y Supabase RLS
-- ==============================================================================

-- 1. Registro de Nuevas Funcionalidades Pro
INSERT INTO public.features (code, name, description)
VALUES 
  ('orders_management', 'Clientes, pedidos y calendario comercial', 'Gestión integral de clientes, pedidos comerciales, líneas de productos, estados y calendario de entregas.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.tool_features (tool_slug, feature_id, is_premium)
SELECT 'cocina-pro', f.id, true
FROM public.features f
WHERE f.code = 'orders_management'
ON CONFLICT DO NOTHING;

-- 2. Tabla de Clientes de Cocina (Directorio de Clientes)
CREATE TABLE IF NOT EXISTS public.kitchen_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kitchen_clients_user ON public.kitchen_clients(user_id, is_active, name);

ALTER TABLE public.kitchen_clients ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'kitchen_clients' AND policyname = 'Users can view own clients'
  ) THEN
    CREATE POLICY "Users can view own clients" ON public.kitchen_clients
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'kitchen_clients' AND policyname = 'Users can insert own clients'
  ) THEN
    CREATE POLICY "Users can insert own clients" ON public.kitchen_clients
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id AND public.is_pro_user(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'kitchen_clients' AND policyname = 'Users can update own clients'
  ) THEN
    CREATE POLICY "Users can update own clients" ON public.kitchen_clients
      FOR UPDATE TO authenticated
      USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()))
      WITH CHECK (auth.uid() = user_id AND public.is_pro_user(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'kitchen_clients' AND policyname = 'Users can delete own clients'
  ) THEN
    CREATE POLICY "Users can delete own clients" ON public.kitchen_clients
      FOR DELETE TO authenticated
      USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()));
  END IF;
END $$;

-- 3. Tabla de Pedidos Comerciales
CREATE TABLE IF NOT EXISTS public.kitchen_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_code TEXT NOT NULL,
  client_id UUID REFERENCES public.kitchen_clients(id) ON DELETE SET NULL,
  client_name_snapshot TEXT NOT NULL,
  client_contact_snapshot TEXT,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date DATE NOT NULL,
  delivery_time TEXT,
  status TEXT NOT NULL DEFAULT 'recibido' CHECK (status IN ('recibido', 'confirmado', 'en_preparacion', 'listo', 'entregado', 'cancelado')),
  status_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  subtotal NUMERIC NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount_amount NUMERIC NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  delivery_fee NUMERIC NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
  total_amount NUMERIC NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  deposit_amount NUMERIC NOT NULL DEFAULT 0 CHECK (deposit_amount >= 0),
  balance_amount NUMERIC NOT NULL DEFAULT 0 CHECK (balance_amount >= 0),
  status_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_kitchen_orders_user_code UNIQUE (user_id, order_code)
);

CREATE INDEX IF NOT EXISTS idx_kitchen_orders_user_status ON public.kitchen_orders(user_id, status, delivery_date DESC);
CREATE INDEX IF NOT EXISTS idx_kitchen_orders_user_delivery ON public.kitchen_orders(user_id, delivery_date DESC);
CREATE INDEX IF NOT EXISTS idx_kitchen_orders_client ON public.kitchen_orders(user_id, client_id);

ALTER TABLE public.kitchen_orders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'kitchen_orders' AND policyname = 'Users can view own kitchen orders'
  ) THEN
    CREATE POLICY "Users can view own kitchen orders" ON public.kitchen_orders
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'kitchen_orders' AND policyname = 'Users can insert own kitchen orders'
  ) THEN
    CREATE POLICY "Users can insert own kitchen orders" ON public.kitchen_orders
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id AND public.is_pro_user(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'kitchen_orders' AND policyname = 'Users can update own kitchen orders'
  ) THEN
    CREATE POLICY "Users can update own kitchen orders" ON public.kitchen_orders
      FOR UPDATE TO authenticated
      USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()))
      WITH CHECK (auth.uid() = user_id AND public.is_pro_user(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'kitchen_orders' AND policyname = 'Users can delete own kitchen orders'
  ) THEN
    CREATE POLICY "Users can delete own kitchen orders" ON public.kitchen_orders
      FOR DELETE TO authenticated
      USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()));
  END IF;
END $$;

-- 4. Tabla de Líneas / Productos del Pedido
CREATE TABLE IF NOT EXISTS public.kitchen_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.kitchen_orders(id) ON DELETE CASCADE,
  recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL DEFAULT 'unidades',
  unit_price NUMERIC NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  subtotal NUMERIC NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  reference_cost_per_unit NUMERIC CHECK (reference_cost_per_unit >= 0),
  reference_total_cost NUMERIC CHECK (reference_total_cost >= 0),
  notes TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kitchen_order_items_order ON public.kitchen_order_items(order_id, position ASC);
CREATE INDEX IF NOT EXISTS idx_kitchen_order_items_recipe ON public.kitchen_order_items(recipe_id);

ALTER TABLE public.kitchen_order_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'kitchen_order_items' AND policyname = 'Users can view own kitchen order items'
  ) THEN
    CREATE POLICY "Users can view own kitchen order items" ON public.kitchen_order_items
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.kitchen_orders ko
          WHERE ko.id = kitchen_order_items.order_id
            AND ko.user_id = auth.uid()
            AND public.is_pro_user(auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'kitchen_order_items' AND policyname = 'Users can insert own kitchen order items'
  ) THEN
    CREATE POLICY "Users can insert own kitchen order items" ON public.kitchen_order_items
      FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.kitchen_orders ko
          WHERE ko.id = kitchen_order_items.order_id
            AND ko.user_id = auth.uid()
            AND public.is_pro_user(auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'kitchen_order_items' AND policyname = 'Users can update own kitchen order items'
  ) THEN
    CREATE POLICY "Users can update own kitchen order items" ON public.kitchen_order_items
      FOR UPDATE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.kitchen_orders ko
          WHERE ko.id = kitchen_order_items.order_id
            AND ko.user_id = auth.uid()
            AND public.is_pro_user(auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.kitchen_orders ko
          WHERE ko.id = kitchen_order_items.order_id
            AND ko.user_id = auth.uid()
            AND public.is_pro_user(auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'kitchen_order_items' AND policyname = 'Users can delete own kitchen order items'
  ) THEN
    CREATE POLICY "Users can delete own kitchen order items" ON public.kitchen_order_items
      FOR DELETE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.kitchen_orders ko
          WHERE ko.id = kitchen_order_items.order_id
            AND ko.user_id = auth.uid()
            AND public.is_pro_user(auth.uid())
        )
      );
  END IF;
END $$;

-- 5. Tabla de Vinculación entre Pedidos y Planes de Producción
CREATE TABLE IF NOT EXISTS public.order_production_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.kitchen_orders(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.production_plans(id) ON DELETE CASCADE,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  CONSTRAINT uq_order_production_plans UNIQUE (order_id, plan_id)
);

CREATE INDEX IF NOT EXISTS idx_order_plans_user_order ON public.order_production_plans(user_id, order_id);
CREATE INDEX IF NOT EXISTS idx_order_plans_user_plan ON public.order_production_plans(user_id, plan_id);

ALTER TABLE public.order_production_plans ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'order_production_plans' AND policyname = 'Users can view own order production plans'
  ) THEN
    CREATE POLICY "Users can view own order production plans" ON public.order_production_plans
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'order_production_plans' AND policyname = 'Users can insert own order production plans'
  ) THEN
    CREATE POLICY "Users can insert own order production plans" ON public.order_production_plans
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id AND public.is_pro_user(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'order_production_plans' AND policyname = 'Users can delete own order production plans'
  ) THEN
    CREATE POLICY "Users can delete own order production plans" ON public.order_production_plans
      FOR DELETE TO authenticated
      USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()));
  END IF;
END $$;

-- 6. Trigger para actualización automática de updated_at
CREATE OR REPLACE FUNCTION public.handle_kitchen_orders_timestamps()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kitchen_clients_timestamps ON public.kitchen_clients;
CREATE TRIGGER trg_kitchen_clients_timestamps
BEFORE UPDATE ON public.kitchen_clients
FOR EACH ROW
EXECUTE FUNCTION public.handle_kitchen_orders_timestamps();

DROP TRIGGER IF EXISTS trg_kitchen_orders_timestamps ON public.kitchen_orders;
CREATE TRIGGER trg_kitchen_orders_timestamps
BEFORE UPDATE ON public.kitchen_orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_kitchen_orders_timestamps();

-- 7. Concesión de Permisos a Roles Autenticados
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kitchen_clients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kitchen_orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kitchen_order_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_production_plans TO authenticated;

REVOKE ALL ON public.kitchen_clients FROM anon;
REVOKE ALL ON public.kitchen_orders FROM anon;
REVOKE ALL ON public.kitchen_order_items FROM anon;
REVOKE ALL ON public.order_production_plans FROM anon;

-- 8. RPC Atómica: save_kitchen_order_transaction
CREATE OR REPLACE FUNCTION public.save_kitchen_order_transaction(
  p_order_id UUID DEFAULT NULL,
  p_order_code TEXT DEFAULT '',
  p_client_id UUID DEFAULT NULL,
  p_client_name_snapshot TEXT DEFAULT '',
  p_client_contact_snapshot TEXT DEFAULT '',
  p_order_date DATE DEFAULT CURRENT_DATE,
  p_delivery_date DATE DEFAULT CURRENT_DATE,
  p_delivery_time TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'recibido',
  p_notes TEXT DEFAULT '',
  p_discount_amount NUMERIC DEFAULT 0,
  p_delivery_fee NUMERIC DEFAULT 0,
  p_deposit_amount NUMERIC DEFAULT 0,
  p_items JSONB DEFAULT '[]'::jsonb,
  p_status_history JSONB DEFAULT '[]'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
  v_saved_id UUID;
  v_final_code TEXT;
  v_calculated_subtotal NUMERIC := 0;
  v_calculated_total NUMERIC := 0;
  v_calculated_balance NUMERIC := 0;
  v_item JSONB;
  v_line_qty NUMERIC;
  v_line_price NUMERIC;
  v_line_subtotal NUMERIC;
  v_seq INTEGER;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para registrar pedidos.';
  END IF;

  IF NOT public.is_pro_user(v_user_id) THEN
    RAISE EXCEPTION 'Esta acción requiere una suscripción Pro activa.';
  END IF;

  -- Validar o generar código de pedido único por usuario
  v_final_code := trim(COALESCE(p_order_code, ''));
  IF v_final_code = '' THEN
    SELECT COALESCE(COUNT(*), 0) + 1 INTO v_seq
    FROM public.kitchen_orders
    WHERE user_id = v_user_id;

    v_final_code := 'PED-' || TO_CHAR(COALESCE(p_delivery_date, CURRENT_DATE), 'YYYY') || '-' || LPAD(v_seq::text, 4, '0');
  END IF;

  -- Validar cliente si fue especificado
  IF p_client_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.kitchen_clients
      WHERE id = p_client_id AND user_id = v_user_id
    ) THEN
      RAISE EXCEPTION 'El cliente especificado no existe o no pertenece a tu cuenta.';
    END IF;
  END IF;

  -- Calcular subtotales a partir de las líneas
  IF p_items IS NOT NULL AND jsonb_typeof(p_items) = 'array' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      v_line_qty := GREATEST(COALESCE((v_item->>'quantity')::numeric, 0), 0.0001);
      v_line_price := GREATEST(COALESCE((v_item->>'unit_price')::numeric, 0), 0);
      v_line_subtotal := ROUND(v_line_qty * v_line_price, 2);
      v_calculated_subtotal := v_calculated_subtotal + v_line_subtotal;

      -- Validar receta si se enlazó
      IF (v_item->>'recipe_id') IS NOT NULL AND (v_item->>'recipe_id') <> '' THEN
        IF NOT EXISTS (
          SELECT 1 FROM public.recipes
          WHERE id = (v_item->>'recipe_id')::uuid AND user_id = v_user_id
        ) THEN
          RAISE EXCEPTION 'La receta % no existe o no pertenece a tu cuenta.', v_item->>'recipe_id';
        END IF;
      END IF;
    END LOOP;
  END IF;

  v_calculated_subtotal := ROUND(v_calculated_subtotal, 2);
  v_calculated_total := GREATEST(0, v_calculated_subtotal - GREATEST(0, COALESCE(p_discount_amount, 0)) + GREATEST(0, COALESCE(p_delivery_fee, 0)));
  v_calculated_balance := GREATEST(0, v_calculated_total - GREATEST(0, COALESCE(p_deposit_amount, 0)));

  -- Insertar o actualizar pedido cabecera
  IF p_order_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.kitchen_orders WHERE id = p_order_id AND user_id = v_user_id) THEN
      RAISE EXCEPTION 'El pedido no existe o no pertenece a tu cuenta.';
    END IF;

    UPDATE public.kitchen_orders SET
      order_code = v_final_code,
      client_id = p_client_id,
      client_name_snapshot = COALESCE(NULLIF(trim(p_client_name_snapshot), ''), 'Cliente Ocasional'),
      client_contact_snapshot = NULLIF(trim(p_client_contact_snapshot), ''),
      order_date = COALESCE(p_order_date, CURRENT_DATE),
      delivery_date = COALESCE(p_delivery_date, CURRENT_DATE),
      delivery_time = NULLIF(trim(p_delivery_time), ''),
      status = COALESCE(p_status, 'recibido'),
      status_updated_at = now(),
      notes = NULLIF(trim(p_notes), ''),
      subtotal = v_calculated_subtotal,
      discount_amount = GREATEST(0, COALESCE(p_discount_amount, 0)),
      delivery_fee = GREATEST(0, COALESCE(p_delivery_fee, 0)),
      total_amount = v_calculated_total,
      deposit_amount = GREATEST(0, COALESCE(p_deposit_amount, 0)),
      balance_amount = v_calculated_balance,
      status_history = COALESCE(p_status_history, status_history),
      updated_at = now()
    WHERE id = p_order_id AND user_id = v_user_id
    RETURNING id INTO v_saved_id;
  ELSE
    INSERT INTO public.kitchen_orders (
      user_id,
      order_code,
      client_id,
      client_name_snapshot,
      client_contact_snapshot,
      order_date,
      delivery_date,
      delivery_time,
      status,
      status_updated_at,
      notes,
      subtotal,
      discount_amount,
      delivery_fee,
      total_amount,
      deposit_amount,
      balance_amount,
      status_history
    ) VALUES (
      v_user_id,
      v_final_code,
      p_client_id,
      COALESCE(NULLIF(trim(p_client_name_snapshot), ''), 'Cliente Ocasional'),
      NULLIF(trim(p_client_contact_snapshot), ''),
      COALESCE(p_order_date, CURRENT_DATE),
      COALESCE(p_delivery_date, CURRENT_DATE),
      NULLIF(trim(p_delivery_time), ''),
      COALESCE(p_status, 'recibido'),
      now(),
      NULLIF(trim(p_notes), ''),
      v_calculated_subtotal,
      GREATEST(0, COALESCE(p_discount_amount, 0)),
      GREATEST(0, COALESCE(p_delivery_fee, 0)),
      v_calculated_total,
      GREATEST(0, COALESCE(p_deposit_amount, 0)),
      v_calculated_balance,
      COALESCE(p_status_history, jsonb_build_array(
        jsonb_build_object(
          'status', COALESCE(p_status, 'recibido'),
          'timestamp', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
          'note', 'Pedido registrado'
        )
      ))
    )
    RETURNING id INTO v_saved_id;
  END IF;

  -- Reemplazo atómico de líneas de pedido
  DELETE FROM public.kitchen_order_items WHERE order_id = v_saved_id;

  IF p_items IS NOT NULL AND jsonb_typeof(p_items) = 'array' AND jsonb_array_length(p_items) > 0 THEN
    INSERT INTO public.kitchen_order_items (
      order_id,
      recipe_id,
      product_name,
      quantity,
      unit,
      unit_price,
      subtotal,
      reference_cost_per_unit,
      reference_total_cost,
      notes,
      position
    )
    SELECT
      v_saved_id,
      CASE 
        WHEN (elem->>'recipe_id') IS NOT NULL AND (elem->>'recipe_id') <> '' THEN (elem->>'recipe_id')::uuid 
        ELSE NULL 
      END,
      COALESCE(NULLIF(trim(elem->>'product_name'), ''), 'Producto'),
      GREATEST(COALESCE((elem->>'quantity')::numeric, 1), 0.0001),
      COALESCE(NULLIF(trim(elem->>'unit'), ''), 'unidades'),
      GREATEST(COALESCE((elem->>'unit_price')::numeric, 0), 0),
      ROUND(GREATEST(COALESCE((elem->>'quantity')::numeric, 1), 0.0001) * GREATEST(COALESCE((elem->>'unit_price')::numeric, 0), 0), 2),
      NULLIF(elem->>'reference_cost_per_unit', '')::numeric,
      NULLIF(elem->>'reference_total_cost', '')::numeric,
      NULLIF(trim(elem->>'notes'), ''),
      COALESCE((elem->>'position')::integer, 0)
    FROM jsonb_array_elements(p_items) AS elem;
  END IF;

  RETURN v_saved_id;
END;
$$;

-- 9. RPC Atómica: link_order_production_plan_transaction
CREATE OR REPLACE FUNCTION public.link_order_production_plan_transaction(
  p_order_id UUID,
  p_plan_id UUID,
  p_notes TEXT DEFAULT ''
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para vincular planes.';
  END IF;

  IF NOT public.is_pro_user(v_user_id) THEN
    RAISE EXCEPTION 'Esta acción requiere una suscripción Pro activa.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.kitchen_orders WHERE id = p_order_id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'El pedido no existe o no pertenece a tu cuenta.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.production_plans WHERE id = p_plan_id AND user_id = v_user_id) THEN
    RAISE EXCEPTION 'El plan de producción no existe o no pertenece a tu cuenta.';
  END IF;

  INSERT INTO public.order_production_plans (
    user_id, order_id, plan_id, notes
  ) VALUES (
    v_user_id, p_order_id, p_plan_id, NULLIF(trim(p_notes), '')
  )
  ON CONFLICT (order_id, plan_id) DO UPDATE SET
    notes = EXCLUDED.notes,
    linked_at = now();

  RETURN true;
END;
$$;

-- 10. RPC Atómica: create_production_plan_from_order_transaction
CREATE OR REPLACE FUNCTION public.create_production_plan_from_order_transaction(
  p_order_id UUID,
  p_plan_name TEXT DEFAULT '',
  p_production_date DATE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
  v_order RECORD;
  v_new_plan_id UUID;
  v_final_name TEXT;
  v_final_date DATE;
  v_item RECORD;
  v_recipe RECORD;
  v_scaling NUMERIC;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Debes iniciar sesión para crear planes de producción.';
  END IF;

  IF NOT public.is_pro_user(v_user_id) THEN
    RAISE EXCEPTION 'Esta acción requiere una suscripción Pro activa.';
  END IF;

  SELECT * INTO v_order
  FROM public.kitchen_orders
  WHERE id = p_order_id AND user_id = v_user_id;

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'El pedido no existe o no pertenece a tu cuenta.';
  END IF;

  v_final_date := COALESCE(p_production_date, v_order.delivery_date, CURRENT_DATE);
  v_final_name := trim(COALESCE(p_plan_name, ''));
  IF v_final_name = '' THEN
    v_final_name := 'Producción ' || v_order.order_code || ' (' || v_order.client_name_snapshot || ')';
  END IF;

  -- 1. Crear el plan de producción
  INSERT INTO public.production_plans (
    user_id, name, production_date, status, notes
  ) VALUES (
    v_user_id,
    v_final_name,
    v_final_date,
    'planned',
    'Plan originado desde pedido comercial ' || v_order.order_code
  )
  RETURNING id INTO v_new_plan_id;

  -- 2. Poblar los items a partir de las líneas con receta vinculada
  FOR v_item IN 
    SELECT * FROM public.kitchen_order_items
    WHERE order_id = p_order_id AND recipe_id IS NOT NULL
    ORDER BY position ASC
  LOOP
    SELECT * INTO v_recipe FROM public.recipes WHERE id = v_item.recipe_id;
    IF v_recipe.id IS NOT NULL THEN
      IF COALESCE(v_recipe.yield_quantity, 1) > 0 THEN
        v_scaling := GREATEST(0.0001, ROUND(v_item.quantity / v_recipe.yield_quantity, 4));
      ELSE
        v_scaling := 1;
      END IF;

      INSERT INTO public.production_plan_items (
        plan_id,
        recipe_id,
        target_quantity,
        target_unit,
        scaling_factor,
        position,
        notes,
        snapshot_recipe_name,
        snapshot_yield_quantity,
        snapshot_yield_unit,
        snapshot_category,
        snapshot_cost_per_unit,
        snapshot_total_cost
      ) VALUES (
        v_new_plan_id,
        v_item.recipe_id,
        v_item.quantity,
        v_item.unit,
        v_scaling,
        v_item.position,
        v_item.notes,
        COALESCE(v_item.product_name, v_recipe.name),
        COALESCE(v_recipe.yield_quantity, 1),
        COALESCE(v_recipe.yield_unit, 'unidades'),
        v_recipe.category,
        v_item.reference_cost_per_unit,
        v_item.reference_total_cost
      )
      ON CONFLICT (plan_id, recipe_id) DO UPDATE SET
        target_quantity = public.production_plan_items.target_quantity + EXCLUDED.target_quantity,
        scaling_factor = GREATEST(0.0001, ROUND((public.production_plan_items.target_quantity + EXCLUDED.target_quantity) / COALESCE(v_recipe.yield_quantity, 1), 4));
    END IF;
  END LOOP;

  -- 3. Vincular el pedido al plan
  INSERT INTO public.order_production_plans (
    user_id, order_id, plan_id, notes
  ) VALUES (
    v_user_id, p_order_id, v_new_plan_id, 'Plan creado automáticamente desde pedido'
  )
  ON CONFLICT (order_id, plan_id) DO NOTHING;

  RETURN v_new_plan_id;
END;
$$;
