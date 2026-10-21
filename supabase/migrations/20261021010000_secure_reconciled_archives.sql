-- =============================================================================
-- MIGRATION: 20261021010000_secure_reconciled_archives.sql
-- PlayComun Online: Habilitar RLS y revocar permisos directos a anon y authenticated
-- sobre tablas de archivo de reconciliación histórica.
-- Acceso exclusivo reservado a service_role / Postgres admin para auditoría interna.
-- =============================================================================

-- 1. Habilitar Row Level Security (RLS) en ambas tablas de archivo
ALTER TABLE public.reconciled_subscriptions_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciled_payments_archive ENABLE ROW LEVEL SECURITY;

-- 2. Revocar todos los privilegios sobre estas tablas para anon y authenticated
REVOKE ALL PRIVILEGES ON TABLE public.reconciled_subscriptions_archive FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.reconciled_payments_archive FROM anon, authenticated;
