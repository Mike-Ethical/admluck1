begin;

create table if not exists public.admluck_state (
  id text primary key,
  schema_version integer not null default 1 check (schema_version > 0),
  state jsonb not null check (jsonb_typeof(state) = 'object'),
  updated_at timestamptz not null default now()
);

alter table public.admluck_state enable row level security;

revoke all on table public.admluck_state from anon, authenticated;
grant select, insert, update, delete on table public.admluck_state to service_role;

commit;
