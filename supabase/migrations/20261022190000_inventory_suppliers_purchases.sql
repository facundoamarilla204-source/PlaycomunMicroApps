-- ==============================================================================
-- Migración: Fase 9 - Inventario, Compras, Proveedores y Control de Existencias
-- Compatible con PostgreSQL y Supabase RLS
-- ==============================================================================

-- 1. Registro de Nuevas Funcionalidades Pro
INSERT INTO public.features (code, name, description)
VALUES 
  ('inventory_management', 'Control de inventario y trazabilidad', 'Gestión de existencias, movimientos auditables, ajustes y vencimientos.'),
  ('supplier_management', 'Gestión de proveedores y compras', 'Administración de proveedores, listas de precios, órdenes de compra y recepción.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.tool_features (tool_slug, feature_id, is_premium)
SELECT 'cocina-pro', f.id, true
FROM public.features f
WHERE f.code IN ('inventory_management', 'supplier_management')
ON CONFLICT DO NOTHING;

-- 2. Tabla de Proveedores
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_user ON public.suppliers(user_id, is_active, name);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'suppliers' AND policyname = 'Users can view own suppliers'
  ) THEN
    CREATE POLICY "Users can view own suppliers" ON public.suppliers
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'suppliers' AND policyname = 'Users can insert own suppliers'
  ) THEN
    CREATE POLICY "Users can insert own suppliers" ON public.suppliers
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id AND public.is_pro_user(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'suppliers' AND policyname = 'Users can update own suppliers'
  ) THEN
    CREATE POLICY "Users can update own suppliers" ON public.suppliers
      FOR UPDATE TO authenticated
      USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()))
      WITH CHECK (auth.uid() = user_id AND public.is_pro_user(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'suppliers' AND policyname = 'Users can delete own suppliers'
  ) THEN
    CREATE POLICY "Users can delete own suppliers" ON public.suppliers
      FOR DELETE TO authenticated
      USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()));
  END IF;
END $$;

-- 3. Tabla de Presentaciones Comerciales de Proveedores por Ingrediente
CREATE TABLE IF NOT EXISTS public.supplier_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.kitchen_ingredients(id) ON DELETE CASCADE,
  package_size NUMERIC NOT NULL CHECK (package_size > 0),
  package_unit TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  supplier_code TEXT,
  notes TEXT,
  is_preferred BOOLEAN NOT NULL DEFAULT false,
  last_purchased_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_supplier_ingredients_ing ON public.supplier_ingredients(user_id, ingredient_id);
CREATE INDEX IF NOT EXISTS idx_supplier_ingredients_sup ON public.supplier_ingredients(user_id, supplier_id);

ALTER TABLE public.supplier_ingredients ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'supplier_ingredients' AND policyname = 'Users can view own supplier ingredients'
  ) THEN
    CREATE POLICY "Users can view own supplier ingredients" ON public.supplier_ingredients
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'supplier_ingredients' AND policyname = 'Users can insert own supplier ingredients'
  ) THEN
    CREATE POLICY "Users can insert own supplier ingredients" ON public.supplier_ingredients
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id AND public.is_pro_user(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'supplier_ingredients' AND policyname = 'Users can update own supplier ingredients'
  ) THEN
    CREATE POLICY "Users can update own supplier ingredients" ON public.supplier_ingredients
      FOR UPDATE TO authenticated
      USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()))
      WITH CHECK (auth.uid() = user_id AND public.is_pro_user(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'supplier_ingredients' AND policyname = 'Users can delete own supplier ingredients'
  ) THEN
    CREATE POLICY "Users can delete own supplier ingredients" ON public.supplier_ingredients
      FOR DELETE TO authenticated
      USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()));
  END IF;
END $$;

-- 4. Tabla de Movimientos de Inventario (Trazabilidad Auditable)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.kitchen_ingredients(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('initial', 'in', 'out', 'adjustment', 'compensation')),
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL,
  normalized_quantity NUMERIC NOT NULL CHECK (normalized_quantity > 0),
  balance_after NUMERIC NOT NULL,
  reference_type TEXT CHECK (reference_type IN ('purchase_order', 'production_plan', 'manual', 'inventory_audit', 'correction')),
  reference_id UUID,
  idempotency_key TEXT,
  reason TEXT,
  lot_number TEXT,
  expiration_date DATE,
  unit_cost NUMERIC CHECK (unit_cost IS NULL OR unit_cost >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_user_ing ON public.inventory_movements(user_id, ingredient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_ref ON public.inventory_movements(user_id, reference_type, reference_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_movements_idempotency ON public.inventory_movements(user_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'inventory_movements' AND policyname = 'Users can view own inventory movements'
  ) THEN
    CREATE POLICY "Users can view own inventory movements" ON public.inventory_movements
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'inventory_movements' AND policyname = 'Users can insert own inventory movements'
  ) THEN
    CREATE POLICY "Users can insert own inventory movements" ON public.inventory_movements
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id AND public.is_pro_user(auth.uid()));
  END IF;
END $$;

-- 5. Tabla de Órdenes de Compra
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'received', 'partially_received', 'cancelled')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date DATE,
  received_at TIMESTAMPTZ,
  subtotal NUMERIC NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  shipping_cost NUMERIC NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0),
  taxes_amount NUMERIC NOT NULL DEFAULT 0 CHECK (taxes_amount >= 0),
  discount_amount NUMERIC NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total NUMERIC NOT NULL DEFAULT 0 CHECK (total >= 0),
  notes TEXT,
  origin_plan_id UUID REFERENCES public.production_plans(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_user ON public.purchase_orders(user_id, status, issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_plan ON public.purchase_orders(user_id, origin_plan_id);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'purchase_orders' AND policyname = 'Users can view own purchase orders'
  ) THEN
    CREATE POLICY "Users can view own purchase orders" ON public.purchase_orders
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'purchase_orders' AND policyname = 'Users can insert own purchase orders'
  ) THEN
    CREATE POLICY "Users can insert own purchase orders" ON public.purchase_orders
      FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id AND public.is_pro_user(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'purchase_orders' AND policyname = 'Users can update own purchase orders'
  ) THEN
    CREATE POLICY "Users can update own purchase orders" ON public.purchase_orders
      FOR UPDATE TO authenticated
      USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()))
      WITH CHECK (auth.uid() = user_id AND public.is_pro_user(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'purchase_orders' AND policyname = 'Users can delete own purchase orders'
  ) THEN
    CREATE POLICY "Users can delete own purchase orders" ON public.purchase_orders
      FOR DELETE TO authenticated
      USING (auth.uid() = user_id AND public.is_pro_user(auth.uid()));
  END IF;
END $$;

-- 6. Tabla de Ítems de Órdenes de Compra
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  ingredient_id UUID REFERENCES public.kitchen_ingredients(id) ON DELETE SET NULL,
  ingredient_name TEXT NOT NULL,
  ordered_quantity NUMERIC NOT NULL CHECK (ordered_quantity > 0),
  package_size NUMERIC NOT NULL DEFAULT 1 CHECK (package_size > 0),
  package_unit TEXT NOT NULL,
  unit_price NUMERIC NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  total_price NUMERIC NOT NULL DEFAULT 0 CHECK (total_price >= 0),
  received_quantity NUMERIC NOT NULL DEFAULT 0 CHECK (received_quantity >= 0),
  lot_number TEXT,
  expiration_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_order ON public.purchase_order_items(purchase_order_id);

ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'purchase_order_items' AND policyname = 'Users can view own purchase order items'
  ) THEN
    CREATE POLICY "Users can view own purchase order items" ON public.purchase_order_items
      FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.purchase_orders po
          WHERE po.id = purchase_order_id
            AND po.user_id = auth.uid()
            AND public.is_pro_user(auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'purchase_order_items' AND policyname = 'Users can insert own purchase order items'
  ) THEN
    CREATE POLICY "Users can insert own purchase order items" ON public.purchase_order_items
      FOR INSERT TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.purchase_orders po
          WHERE po.id = purchase_order_id
            AND po.user_id = auth.uid()
            AND public.is_pro_user(auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'purchase_order_items' AND policyname = 'Users can update own purchase order items'
  ) THEN
    CREATE POLICY "Users can update own purchase order items" ON public.purchase_order_items
      FOR UPDATE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.purchase_orders po
          WHERE po.id = purchase_order_id
            AND po.user_id = auth.uid()
            AND public.is_pro_user(auth.uid())
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.purchase_orders po
          WHERE po.id = purchase_order_id
            AND po.user_id = auth.uid()
            AND public.is_pro_user(auth.uid())
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'purchase_order_items' AND policyname = 'Users can delete own purchase order items'
  ) THEN
    CREATE POLICY "Users can delete own purchase order items" ON public.purchase_order_items
      FOR DELETE TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.purchase_orders po
          WHERE po.id = purchase_order_id
            AND po.user_id = auth.uid()
            AND public.is_pro_user(auth.uid())
        )
      );
  END IF;
END $$;

-- 7. Funciones Transaccionales Atómicas (RPC)

-- 7.1. Guardado Atómico de Planes de Producción
CREATE OR REPLACE FUNCTION public.save_production_plan_tx(
  p_plan JSONB,
  p_items JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_plan_id UUID;
  v_item JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  IF NOT public.is_pro_user(v_user_id) THEN
    RAISE EXCEPTION 'Se requiere suscripción Pro activa';
  END IF;

  IF p_plan->>'id' IS NOT NULL AND (p_plan->>'id') <> '' THEN
    v_plan_id := (p_plan->>'id')::UUID;
    UPDATE public.production_plans
    SET
      name = p_plan->>'name',
      production_date = (p_plan->>'production_date')::DATE,
      status = p_plan->>'status',
      notes = p_plan->>'notes',
      checked_ingredients = ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_plan->'checked_ingredients', '[]'::jsonb))),
      updated_at = now()
    WHERE id = v_plan_id AND user_id = v_user_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Plan de producción no encontrado o no autorizado';
    END IF;
  ELSE
    INSERT INTO public.production_plans (
      user_id,
      name,
      production_date,
      status,
      notes,
      checked_ingredients,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      p_plan->>'name',
      (p_plan->>'production_date')::DATE,
      COALESCE(p_plan->>'status', 'draft'),
      p_plan->>'notes',
      ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_plan->'checked_ingredients', '[]'::jsonb))),
      now(),
      now()
    )
    RETURNING id INTO v_plan_id;
  END IF;

  DELETE FROM public.production_plan_items WHERE plan_id = v_plan_id;

  IF jsonb_array_length(p_items) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
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
        snapshot_total_cost,
        created_at,
        updated_at
      ) VALUES (
        v_plan_id,
        (v_item->>'recipe_id')::UUID,
        GREATEST(0.0001, (v_item->>'target_quantity')::NUMERIC),
        v_item->>'target_unit',
        GREATEST(0.0001, COALESCE((v_item->>'scaling_factor')::NUMERIC, 1)),
        COALESCE((v_item->>'position')::INT, 0),
        v_item->>'notes',
        COALESCE(v_item->>'snapshot_recipe_name', 'Receta'),
        GREATEST(0.0001, COALESCE((v_item->>'snapshot_yield_quantity')::NUMERIC, 1)),
        COALESCE(v_item->>'snapshot_yield_unit', 'unidades'),
        v_item->>'snapshot_category',
        (v_item->>'snapshot_cost_per_unit')::NUMERIC,
        (v_item->>'snapshot_total_cost')::NUMERIC,
        now(),
        now()
      );
    END LOOP;
  END IF;

  RETURN v_plan_id;
END;
$$;

-- 7.2. Recepción Transaccional de Órdenes de Compra
CREATE OR REPLACE FUNCTION public.receive_purchase_order_tx(
  p_order_id UUID,
  p_items JSONB,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_order RECORD;
  v_item JSONB;
  v_po_item RECORD;
  v_ing RECORD;
  v_received_packages NUMERIC;
  v_unit_price NUMERIC;
  v_normalized_qty NUMERIC;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
  v_all_received BOOLEAN := true;
  v_some_received BOOLEAN := false;
  v_movements_count INT := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.inventory_movements 
      WHERE user_id = v_user_id AND idempotency_key = p_idempotency_key
    ) THEN
      RETURN jsonb_build_object('success', true, 'already_processed', true);
    END IF;
  END IF;

  SELECT * INTO v_order
  FROM public.purchase_orders
  WHERE id = p_order_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden de compra no encontrada o no autorizada';
  END IF;

  IF v_order.status = 'received' THEN
    RETURN jsonb_build_object('success', true, 'already_received', true);
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT * INTO v_po_item
    FROM public.purchase_order_items
    WHERE id = (v_item->>'item_id')::UUID AND purchase_order_id = p_order_id;

    IF FOUND THEN
      v_received_packages := GREATEST(0, (v_item->>'received_quantity')::NUMERIC);
      v_unit_price := COALESCE((v_item->>'unit_price')::NUMERIC, v_po_item.unit_price);

      IF v_received_packages > 0 AND v_po_item.ingredient_id IS NOT NULL THEN
        SELECT * INTO v_ing
        FROM public.kitchen_ingredients
        WHERE id = v_po_item.ingredient_id AND user_id = v_user_id;

        IF FOUND THEN
          v_normalized_qty := v_received_packages * v_po_item.package_size;

          SELECT COALESCE(balance_after, 0) INTO v_current_balance
          FROM public.inventory_movements
          WHERE user_id = v_user_id AND ingredient_id = v_po_item.ingredient_id
          ORDER BY created_at DESC, id DESC
          LIMIT 1;

          v_current_balance := COALESCE(v_current_balance, 0);
          v_new_balance := v_current_balance + v_normalized_qty;

          INSERT INTO public.inventory_movements (
            user_id,
            ingredient_id,
            movement_type,
            direction,
            quantity,
            unit,
            normalized_quantity,
            balance_after,
            reference_type,
            reference_id,
            idempotency_key,
            reason,
            lot_number,
            expiration_date,
            unit_cost,
            created_at
          ) VALUES (
            v_user_id,
            v_po_item.ingredient_id,
            'in',
            'in',
            v_received_packages,
            v_po_item.package_unit,
            v_normalized_qty,
            v_new_balance,
            'purchase_order',
            p_order_id,
            CASE WHEN p_idempotency_key IS NOT NULL THEN p_idempotency_key || '_' || v_po_item.id::TEXT ELSE NULL END,
            'Recepción de Orden ' || v_order.order_number,
            v_item->>'lot_number',
            (v_item->>'expiration_date')::DATE,
            v_unit_price,
            now()
          );

          v_movements_count := v_movements_count + 1;

          IF v_unit_price > 0 AND v_unit_price <> v_ing.current_price THEN
            INSERT INTO public.kitchen_ingredient_price_history (
              ingredient_id,
              user_id,
              previous_price,
              new_price,
              change_reason,
              recorded_at
            ) VALUES (
              v_ing.id,
              v_user_id,
              v_ing.current_price,
              v_unit_price,
              'Actualizado por recepción de Orden ' || v_order.order_number,
              now()
            );

            UPDATE public.kitchen_ingredients
            SET current_price = v_unit_price, price_updated_at = now()
            WHERE id = v_ing.id;
          END IF;
        END IF;
      END IF;

      UPDATE public.purchase_order_items
      SET
        received_quantity = v_po_item.received_quantity + v_received_packages,
        lot_number = COALESCE(v_item->>'lot_number', lot_number),
        expiration_date = COALESCE((v_item->>'expiration_date')::DATE, expiration_date),
        updated_at = now()
      WHERE id = v_po_item.id;

      IF (v_po_item.received_quantity + v_received_packages) < v_po_item.ordered_quantity THEN
        v_all_received := false;
      END IF;

      IF (v_po_item.received_quantity + v_received_packages) > 0 THEN
        v_some_received := true;
      END IF;
    END IF;
  END LOOP;

  UPDATE public.purchase_orders
  SET
    status = CASE 
      WHEN v_all_received THEN 'received'
      WHEN v_some_received THEN 'partially_received'
      ELSE status
    END,
    received_at = now(),
    updated_at = now()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'movements_recorded', v_movements_count,
    'status', CASE WHEN v_all_received THEN 'received' ELSE 'partially_received' END
  );
END;
$$;

-- 7.3. Registro Transaccional de Consumo por Producción
CREATE OR REPLACE FUNCTION public.record_production_consumption_tx(
  p_plan_id UUID,
  p_items JSONB,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_plan RECORD;
  v_item JSONB;
  v_ing RECORD;
  v_consumed_qty NUMERIC;
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
  v_movements_count INT := 0;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.inventory_movements 
      WHERE user_id = v_user_id AND idempotency_key = p_idempotency_key
    ) THEN
      RETURN jsonb_build_object('success', true, 'already_processed', true);
    END IF;
  END IF;

  SELECT * INTO v_plan
  FROM public.production_plans
  WHERE id = p_plan_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plan de producción no encontrado o no autorizado';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    IF (v_item->>'ingredient_id') IS NOT NULL AND (v_item->>'ingredient_id') <> '' THEN
      SELECT * INTO v_ing
      FROM public.kitchen_ingredients
      WHERE id = (v_item->>'ingredient_id')::UUID AND user_id = v_user_id;

      IF FOUND THEN
        v_consumed_qty := GREATEST(0.0001, (v_item->>'quantity')::NUMERIC);

        SELECT COALESCE(balance_after, 0) INTO v_current_balance
        FROM public.inventory_movements
        WHERE user_id = v_user_id AND ingredient_id = v_ing.id
        ORDER BY created_at DESC, id DESC
        LIMIT 1;

        v_current_balance := COALESCE(v_current_balance, 0);
        v_new_balance := v_current_balance - v_consumed_qty;

        INSERT INTO public.inventory_movements (
          user_id,
          ingredient_id,
          movement_type,
          direction,
          quantity,
          unit,
          normalized_quantity,
          balance_after,
          reference_type,
          reference_id,
          idempotency_key,
          reason,
          created_at
        ) VALUES (
          v_user_id,
          v_ing.id,
          'out',
          'out',
          v_consumed_qty,
          v_item->>'unit',
          v_consumed_qty,
          v_new_balance,
          'production_plan',
          p_plan_id,
          CASE WHEN p_idempotency_key IS NOT NULL THEN p_idempotency_key || '_' || v_ing.id::TEXT ELSE NULL END,
          'Consumo en producción: ' || v_plan.name,
          now()
        );

        v_movements_count := v_movements_count + 1;
      END IF;
    END IF;
  END LOOP;

  UPDATE public.production_plans
  SET status = 'completed', updated_at = now()
  WHERE id = p_plan_id;

  RETURN jsonb_build_object(
    'success', true,
    'movements_recorded', v_movements_count
  );
END;
$$;

-- 7.4. Ajuste Manual de Inventario con Trazabilidad
CREATE OR REPLACE FUNCTION public.adjust_ingredient_stock_tx(
  p_ingredient_id UUID,
  p_new_quantity NUMERIC,
  p_unit TEXT,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_ing RECORD;
  v_current_balance NUMERIC;
  v_diff NUMERIC;
  v_direction TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  SELECT * INTO v_ing
  FROM public.kitchen_ingredients
  WHERE id = p_ingredient_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ingrediente no encontrado';
  END IF;

  SELECT COALESCE(balance_after, 0) INTO v_current_balance
  FROM public.inventory_movements
  WHERE user_id = v_user_id AND ingredient_id = p_ingredient_id
  ORDER BY created_at DESC, id DESC
  LIMIT 1;

  v_current_balance := COALESCE(v_current_balance, 0);
  v_diff := p_new_quantity - v_current_balance;

  IF v_diff = 0 THEN
    RETURN jsonb_build_object('success', true, 'no_change', true, 'balance', v_current_balance);
  END IF;

  v_direction := CASE WHEN v_diff > 0 THEN 'in' ELSE 'out' END;

  INSERT INTO public.inventory_movements (
    user_id,
    ingredient_id,
    movement_type,
    direction,
    quantity,
    unit,
    normalized_quantity,
    balance_after,
    reference_type,
    reason,
    created_at
  ) VALUES (
    v_user_id,
    p_ingredient_id,
    'adjustment',
    v_direction,
    ABS(v_diff),
    p_unit,
    ABS(v_diff),
    p_new_quantity,
    'inventory_audit',
    COALESCE(p_reason, 'Ajuste manual de existencias'),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'previous_balance', v_current_balance,
    'new_balance', p_new_quantity,
    'difference', v_diff
  );
END;
$$;
