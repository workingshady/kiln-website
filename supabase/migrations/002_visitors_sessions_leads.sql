-- 002: accurate visitors, sessions and leads. Run once in the Supabase SQL editor.
-- Safe to run twice: every statement checks before it changes anything.

-- Which kind of visitor id the row carries:
--   'device' = anonymous random id kept in the visitor's browser (same person across days)
--   'daily'  = salted hash of IP + browser, rotates every day (fallback when storage is blocked)
alter table public.events add column if not exists id_kind  text;
alter table public.events add column if not exists is_new   boolean;   -- first ever visit from this browser
alter table public.events add column if not exists session  text;      -- client hint; sessions are rebuilt from timestamps
alter table public.events add column if not exists region   text;      -- state / province code from Vercel
alter table public.events add column if not exists lang     text;      -- browser language, e.g. en-US
alter table public.events add column if not exists screen   integer;   -- viewport width in CSS px
alter table public.events add column if not exists utm_term    text;
alter table public.events add column if not exists utm_content text;

create index if not exists events_visitor_created_idx on public.events (visitor, created_at);

-- People who asked to be emailed when a build is released.
create table if not exists public.leads (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  email       text not null,
  platform    text,               -- windows | mac | linux | any
  path        text,               -- page the form was on
  visitor     text,               -- same id as in events, to join the journey
  country     text,
  utm_source  text,
  utm_campaign text
);
create unique index if not exists leads_email_idx on public.leads (lower(email));
create index if not exists leads_created_idx on public.leads (created_at desc);

-- Server-only, like events: RLS on, no policies.
alter table public.leads enable row level security;

-- Remove the three rows created while testing the setup.
delete from public.events
where created_at between '2026-10-21T11:44:00Z' and '2026-10-21T11:46:00Z'
  and (label = 'setup-test' or utm_source = 'setup-test' or (type = 'download' and label = 'windows'));
delete from public.events where path = '/__qa';  -- one check event from the dashboard rebuild
