-- Upforward: multi-device applicant sessions, email sign-in links and
-- unread-message notification tracking. Run AFTER 20261104000000_jobs_and_chat.sql.
-- Safe to run on a fresh project or on one where the first migration already ran.

-- Applicant sessions (one row per device/browser) ------------------------------

create table if not exists public.applicant_sessions (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  -- SHA-256 of the random token stored in the applicant's httpOnly cookie.
  token_hash     text not null unique,
  created_at     timestamptz not null default now(),
  last_seen_at   timestamptz not null default now()
);

create index if not exists applicant_sessions_application_idx
  on public.applicant_sessions (application_id);

-- Move the single session hash from applications into the sessions table.
do $$ begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'applications' and column_name = 'session_token_hash'
  ) then
    insert into public.applicant_sessions (application_id, token_hash, created_at)
    select id, session_token_hash, created_at from public.applications
    on conflict (token_hash) do nothing;

    alter table public.applications drop column session_token_hash;
  end if;
end $$;

-- Email sign-in links -------------------------------------------------------------

create table if not exists public.login_tokens (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications (id) on delete cascade,
  token_hash     text not null unique,
  -- 'login' links are single use; 'notification' links can be reused until they expire.
  purpose        text not null check (purpose in ('login', 'notification')),
  expires_at     timestamptz not null,
  used_at        timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists login_tokens_application_created_idx
  on public.login_tokens (application_id, created_at desc);

-- Notification bookkeeping ---------------------------------------------------------

-- When the applicant / admin was last emailed about unread messages. Reset to NULL
-- when they read the conversation, so each unread streak produces one email.
alter table public.conversations add column if not exists applicant_notified_at timestamptz;
alter table public.conversations add column if not exists admin_notified_at     timestamptz;

-- Lock down ----------------------------------------------------------------------

alter table public.applicant_sessions enable row level security;
alter table public.login_tokens       enable row level security;

revoke all on public.applicant_sessions from anon, authenticated;
revoke all on public.login_tokens       from anon, authenticated;
