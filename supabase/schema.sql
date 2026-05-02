-- Cole no SQL Editor do Supabase (ajuste se já existir).

create table public.links (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null,
  dest text not null,
  "desc" text not null default '',
  created_at timestamptz not null default now(),
  constraint links_slug_key unique (slug)
);

create index links_created_at_idx on public.links (created_at desc);
