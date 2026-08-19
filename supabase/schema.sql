-- Oryon Links SaaS — cole no SQL Editor do Supabase.
-- Idempotente: pode rodar de novo em um projeto já existente.

-- ---------------------------------------------------------------------------
-- Tenants (um por usuário autenticado)
-- ---------------------------------------------------------------------------
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null unique,
  name text,
  role text not null default 'subscriber' check (role in ('admin', 'subscriber')),
  plan_status text not null default 'inactive'
    check (plan_status in ('active', 'inactive', 'trialing', 'canceled', 'past_due')),
  access_type text not null default 'none'
    check (access_type in ('none', 'subscription', 'courtesy', 'tester', 'manual')),
  stripe_customer_id text unique,
  stripe_subscription_id text,
  current_period_end timestamptz,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tenants_email_idx on public.tenants (email);
create index if not exists tenants_status_idx on public.tenants (plan_status);
create index if not exists tenants_stripe_customer_idx on public.tenants (stripe_customer_id);

-- ---------------------------------------------------------------------------
-- Links (slug único em TODA a plataforma)
-- ---------------------------------------------------------------------------
create table if not exists public.links (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null,
  dest text not null,
  "desc" text not null default '',
  created_at timestamptz not null default now(),
  constraint links_slug_key unique (slug)
);

alter table public.links add column if not exists tenant_id uuid;
alter table public.links add column if not exists updated_at timestamptz not null default now();

create index if not exists links_created_at_idx on public.links (created_at desc);
create index if not exists links_tenant_id_idx on public.links (tenant_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'links_tenant_id_fkey'
  ) then
    alter table public.links
      add constraint links_tenant_id_fkey
      foreign key (tenant_id) references public.tenants(id) on delete cascade;
  end if;
end $$;

-- Após criar o usuário admin, associe links antigos (se houver) ao tenant dele:
-- update public.links
-- set tenant_id = (select id from public.tenants where role = 'admin' limit 1)
-- where tenant_id is null;

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tenants_set_updated_at on public.tenants;
create trigger tenants_set_updated_at
  before update on public.tenants
  for each row execute procedure public.set_updated_at();

drop trigger if exists links_set_updated_at on public.links;
create trigger links_set_updated_at
  before update on public.links
  for each row execute procedure public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Cria tenant automaticamente no cadastro
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.tenants (user_id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Usado pelo painel admin (service_role) para cortesias / usuários já existentes
create or replace function public.get_user_id_by_email(p_email text)
returns uuid
language sql
security definer
set search_path = public
as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;

revoke all on function public.get_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.get_user_id_by_email(text) to service_role;

-- ---------------------------------------------------------------------------
-- RLS — isolamento por tenant
-- ---------------------------------------------------------------------------
alter table public.tenants enable row level security;
alter table public.links enable row level security;

create or replace function public.is_saas_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenants
    where user_id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_saas_admin() from public, anon;
grant execute on function public.is_saas_admin() to authenticated, service_role;

drop policy if exists tenants_select_own on public.tenants;
create policy tenants_select_own on public.tenants
  for select
  using (user_id = auth.uid() or public.is_saas_admin());

drop policy if exists tenants_update_own on public.tenants;
create policy tenants_update_own on public.tenants
  for update
  using (user_id = auth.uid() or public.is_saas_admin())
  with check (user_id = auth.uid() or public.is_saas_admin());

drop policy if exists tenants_admin_insert on public.tenants;
create policy tenants_admin_insert on public.tenants
  for insert
  with check (public.is_saas_admin() or user_id = auth.uid());

drop policy if exists tenants_admin_delete on public.tenants;
create policy tenants_admin_delete on public.tenants
  for delete
  using (public.is_saas_admin());

drop policy if exists links_select_own on public.links;
create policy links_select_own on public.links
  for select
  using (
    public.is_saas_admin()
    or tenant_id in (select id from public.tenants where user_id = auth.uid())
  );

drop policy if exists links_insert_own on public.links;
create policy links_insert_own on public.links
  for insert
  with check (
    public.is_saas_admin()
    or tenant_id in (select id from public.tenants where user_id = auth.uid())
  );

drop policy if exists links_update_own on public.links;
create policy links_update_own on public.links
  for update
  using (
    public.is_saas_admin()
    or tenant_id in (select id from public.tenants where user_id = auth.uid())
  )
  with check (
    public.is_saas_admin()
    or tenant_id in (select id from public.tenants where user_id = auth.uid())
  );

drop policy if exists links_delete_own on public.links;
create policy links_delete_own on public.links
  for delete
  using (
    public.is_saas_admin()
    or tenant_id in (select id from public.tenants where user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Promova o dono do SaaS (troque o e-mail):
-- update public.tenants
-- set role = 'admin', plan_status = 'active', access_type = 'manual'
-- where lower(email) = lower('seu-email@dominio.com');
-- ---------------------------------------------------------------------------
