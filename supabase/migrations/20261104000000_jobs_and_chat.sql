-- Upforward: job applications + real-time applicant/admin chat.
-- Run this in the Supabase SQL editor (or `supabase db push`).
--
-- Security model: Row Level Security is ON for every table and no policies
-- are defined, so the anon/publishable key can read or write nothing. All
-- database access goes through the Next.js server using the service-role key.
-- Real-time delivery uses Realtime Broadcast on unguessable channel topics,
-- so the browser never needs direct table access.

create extension if not exists pgcrypto;

-- Enums -----------------------------------------------------------------------

do $$ begin
  create type public.job_role as enum ('virtual-assistant', 'us-partnership', 'remote-connector');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.application_status as enum ('new', 'in_review', 'interview', 'hired', 'declined');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.message_sender as enum ('applicant', 'admin');
exception when duplicate_object then null; end $$;

-- Tables ----------------------------------------------------------------------

create table if not exists public.applications (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  role               public.job_role not null,
  name               text not null check (char_length(name) between 2 and 120),
  email              text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone              text not null check (char_length(phone) between 7 and 32),
  location           text not null check (char_length(location) between 2 and 160),
  status             public.application_status not null default 'new',
  -- SHA-256 of the random token stored in the applicant's httpOnly cookie.
  session_token_hash text not null unique
);

create index if not exists applications_email_idx on public.applications (lower(email));
create index if not exists applications_created_at_idx on public.applications (created_at desc);

create table if not exists public.conversations (
  id                   uuid primary key default gen_random_uuid(),
  application_id       uuid not null unique references public.applications (id) on delete cascade,
  created_at           timestamptz not null default now(),
  last_message_at      timestamptz,
  last_message_preview text,
  last_message_sender  public.message_sender
);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender          public.message_sender not null,
  body            text not null check (char_length(body) between 1 and 4000),
  created_at      timestamptz not null default now(),
  read_at         timestamptz
);

create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at);
create index if not exists messages_unread_idx
  on public.messages (conversation_id, sender) where read_at is null;

-- Keep the conversation summary in sync -----------------------------------------

create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
     set last_message_at      = new.created_at,
         last_message_preview = left(new.body, 140),
         last_message_sender  = new.sender
   where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation_on_message();

-- Admin inbox view ------------------------------------------------------------

create or replace view public.conversation_overview
with (security_invoker = true) as
select
  c.id,
  c.application_id,
  c.created_at,
  c.last_message_at,
  c.last_message_preview,
  c.last_message_sender,
  a.name,
  a.email,
  a.phone,
  a.location,
  a.role,
  a.status,
  coalesce((
    select count(*) from public.messages m
     where m.conversation_id = c.id and m.sender = 'applicant' and m.read_at is null
  ), 0)::int as unread_from_applicant
from public.conversations c
join public.applications a on a.id = c.application_id;

-- Lock everything down --------------------------------------------------------

alter table public.applications  enable row level security;
alter table public.conversations enable row level security;
alter table public.messages      enable row level security;

revoke all on public.applications          from anon, authenticated;
revoke all on public.conversations         from anon, authenticated;
revoke all on public.messages              from anon, authenticated;
revoke all on public.conversation_overview from anon, authenticated;
