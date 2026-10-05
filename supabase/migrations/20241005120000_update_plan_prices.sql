-- =============================================================================
-- MIGRATION 007: update plan prices and provider IDs
-- PlayComun Pro Architecture
-- =============================================================================

update public.plans 
set 
  price = 100, 
  currency = 'ARS', 
  provider = 'mercadopago',
  provider_plan_id = 'MP_MONTHLY_PLACEHOLDER'
where code = 'pro_monthly';

update public.plans 
set 
  price = 150, 
  currency = 'ARS', 
  provider = 'mercadopago',
  provider_plan_id = 'MP_YEARLY_PLACEHOLDER'
where code = 'pro_yearly';
