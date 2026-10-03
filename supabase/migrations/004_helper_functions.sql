-- =============================================================================
-- MIGRATION 004: helper functions for Pro access
-- PlayComun Pro Architecture — Phase 10 (DB-level helpers)
-- =============================================================================

-- Function: check if a user has an active Pro subscription
create or replace function public.is_pro_user(check_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.subscriptions s
    join public.plans p on p.id = s.plan_id
    where s.user_id = check_user_id
      and p.code in ('pro_monthly', 'pro_yearly')
      and s.status in ('active', 'trialing')
      and (
        s.current_period_end is null
        or s.current_period_end > now()
      )
  );
$$;

comment on function public.is_pro_user is 'Returns true if the user has a valid Pro subscription (active or trialing).';

-- Function: check if a specific feature is premium for a given tool
create or replace function public.is_feature_premium(p_tool_slug text, p_feature_code text)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select coalesce(
    (
      select tf.is_premium
      from public.tool_features tf
      join public.features f on f.id = tf.feature_id
      where tf.tool_slug = p_tool_slug
        and f.code = p_feature_code
    ),
    false -- If feature is not registered for this tool, it's free by default
  );
$$;

comment on function public.is_feature_premium is 'Returns true if a feature requires Pro for a specific tool.';

-- Function: check if a user can access a feature for a tool
create or replace function public.can_access_feature(
  check_user_id uuid,
  p_tool_slug text,
  p_feature_code text
)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select
    case
      -- If the feature is not premium, anyone can access it
      when not public.is_feature_premium(p_tool_slug, p_feature_code) then true
      -- If the feature is premium, check Pro status
      else public.is_pro_user(check_user_id)
    end;
$$;

comment on function public.can_access_feature is 'Returns true if a user can access a specific feature of a tool (free features always accessible, premium features require Pro).';

-- Function: get all features for a tool with access info
create or replace function public.get_tool_features_with_access(
  check_user_id uuid,
  p_tool_slug text
)
returns table (
  feature_code text,
  feature_name text,
  is_premium boolean,
  has_access boolean
)
language sql
security definer
stable
set search_path = ''
as $$
  select
    f.code as feature_code,
    f.name as feature_name,
    tf.is_premium,
    case
      when not tf.is_premium then true
      else public.is_pro_user(check_user_id)
    end as has_access
  from public.tool_features tf
  join public.features f on f.id = tf.feature_id
  where tf.tool_slug = p_tool_slug
  order by tf.is_premium, f.name;
$$;

comment on function public.get_tool_features_with_access is 'Returns all features for a tool with whether the user can access each one.';
