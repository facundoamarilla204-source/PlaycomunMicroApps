-- =============================================================================
-- MIGRATION: 20261021030000_secure_ingredient_price_history.sql
-- Cocina Pro - Fase 4: Blindaje de seguridad e inmutabilidad estricta
-- en kitchen_ingredient_price_history e integridad entre cuentas
-- PlayComun Online Pro Architecture
-- =============================================================================

-- 1. Eliminar política de inserción directa para clientes autenticados.
-- El historial de precios NUNCA debe ser insertado directamente por clientes,
-- sino de forma exclusiva y atómica por el trigger del servidor.
DROP POLICY IF EXISTS "Users can insert their own ingredient price history" ON public.kitchen_ingredient_price_history;

-- 2. Revocar privilegios de modificación sobre kitchen_ingredient_price_history a authenticated y anon
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.kitchen_ingredient_price_history FROM authenticated;
REVOKE ALL ON public.kitchen_ingredient_price_history FROM anon;

-- Asegurar que authenticated solo pueda leer (SELECT) sus propios historiales
GRANT SELECT ON public.kitchen_ingredient_price_history TO authenticated;

-- 3. Trigger de integridad e inmutabilidad sobre kitchen_ingredient_price_history
-- Protege contra cualquier intento de manipulación manual, garantizando:
-- - Inmutabilidad absoluta: UPDATE y DELETE están estrictamente prohibidos.
-- - Coherencia relacional estricta: Toda inserción (realizada por el trigger SECURITY DEFINER)
--   debe pertenecer a un ingrediente válido cuyo user_id coincida exactamente con el user_id del historial.
CREATE OR REPLACE FUNCTION public.enforce_price_history_immutability_and_ownership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_ingredient_owner uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT user_id INTO v_ingredient_owner
    FROM public.kitchen_ingredients
    WHERE id = NEW.ingredient_id;

    IF v_ingredient_owner IS NULL THEN
      RAISE EXCEPTION 'No se puede registrar historial para un ingrediente inexistente (%).', NEW.ingredient_id;
    END IF;

    IF v_ingredient_owner <> NEW.user_id THEN
      RAISE EXCEPTION 'Violación de seguridad: El user_id (%) no coincide con el propietario del ingrediente (%).', NEW.user_id, v_ingredient_owner;
    END IF;

    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'Operación denegada: El historial de precios es estrictamente inmutable y de solo lectura.';
  ELSIF TG_OP = 'DELETE' THEN
    -- Permitir el borrado en cascada legítimo ÚNICAMENTE si el ingrediente padre está siendo eliminado
    IF current_setting('kitchen.deleting_ingredient_id', true) = OLD.ingredient_id::text THEN
      RETURN OLD;
    END IF;

    RAISE EXCEPTION 'Operación denegada: El historial de precios es estrictamente inmutable y no puede eliminarse directamente.';
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_price_history_immutability ON public.kitchen_ingredient_price_history;
CREATE TRIGGER trg_enforce_price_history_immutability
BEFORE INSERT OR UPDATE OR DELETE ON public.kitchen_ingredient_price_history
FOR EACH ROW
EXECUTE FUNCTION public.enforce_price_history_immutability_and_ownership();

-- 4. Registrar contexto de borrado legítimo para el borrado en cascada de kitchen_ingredients
CREATE OR REPLACE FUNCTION public.handle_kitchen_ingredient_delete()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  PERFORM set_config('kitchen.deleting_ingredient_id', OLD.id::text, true);
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_kitchen_ingredient_delete ON public.kitchen_ingredients;
CREATE TRIGGER trg_kitchen_ingredient_delete
BEFORE DELETE ON public.kitchen_ingredients
FOR EACH ROW
EXECUTE FUNCTION public.handle_kitchen_ingredient_delete();

-- 5. Blindar kitchen_ingredients para impedir la transferencia ilícita de propiedad (user_id spoofing en UPDATE)
CREATE OR REPLACE FUNCTION public.prevent_kitchen_ingredient_transfer()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF OLD.user_id IS DISTINCT FROM NEW.user_id THEN
    RAISE EXCEPTION 'No está permitido cambiar el propietario de un ingrediente.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_kitchen_ingredient_transfer ON public.kitchen_ingredients;
CREATE TRIGGER trg_prevent_kitchen_ingredient_transfer
BEFORE UPDATE OF user_id ON public.kitchen_ingredients
FOR EACH ROW
EXECUTE FUNCTION public.prevent_kitchen_ingredient_transfer();
