-- Kiln website analytics. Run once in the Supabase SQL editor.
-- Rows are written only by the site's server (service role key), so RLS is on
-- with no policies: the public anon key can neither read nor write.

create table if not exists public.events (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  type        text not null check (type in ('pageview', 'click', 'download', 'engage')),
  path        text not null default '/',
  label       text,               -- click target, download platform, ...
  referrer    text,               -- referring host
  utm_source  text,
  utm_medium  text,
  utm_campaign text,
  country     text,
  city        text,
  device      text,               -- desktop | mobile | tablet
  os          text,
  browser     text,
  visitor     text not null,      -- daily-rotating salted hash, no cookies
  session     text,               -- per-tab random id
  duration_ms integer             -- time on page, for 'engage'
);

create index if not exists events_created_at_idx on public.events (created_at desc);
create index if not exists events_type_created_idx on public.events (type, created_at desc);

alter table public.events enable row level security;
