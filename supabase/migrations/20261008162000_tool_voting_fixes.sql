-- Replace existing insert trigger if it was only incrementing
drop trigger if exists on_tool_vote on tool_votes;
drop function if exists increment_tool_votes;

create or replace function handle_tool_vote()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update tool_candidates set votos = votos + 1 where id = NEW.candidate_id;
    return NEW;
  elsif (TG_OP = 'DELETE') then
    update tool_candidates set votos = votos - 1 where id = OLD.candidate_id;
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger on_tool_vote
after insert or delete on tool_votes
for each row execute function handle_tool_vote();

-- Rate limiting table
create table if not exists rate_limits (
  id uuid primary key default gen_random_uuid(),
  identifier text not null,
  action text not null,
  created_at timestamptz not null default now()
);

-- Ensure service role can access it
alter table rate_limits enable row level security;
create policy "Service role can do all on rate_limits" on rate_limits for all using (true) with check (true);

-- Index to clean up old records easily
create index if not exists idx_rate_limits_created_at on rate_limits(created_at);
create index if not exists idx_rate_limits_identifier_action on rate_limits(identifier, action);
