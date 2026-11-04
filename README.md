# upforward

Marketing site for Upforward, built with Next.js (App Router), Tailwind CSS v4 and shadcn/ui, plus a
jobs funnel: open roles → application form → private real-time chat with the Upforward team, backed by Supabase.

## Development

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev
```

Open http://localhost:3000.

## Supabase setup

1. Create a project at https://supabase.com and open **Project Settings → API**.
2. Copy the project URL, the anon/publishable key and the service-role/secret key into `.env.local`.
3. Open the **SQL editor**, paste the contents of `supabase/migrations/20261104000000_jobs_and_chat.sql` and run it.
   This creates the `applications`, `conversations` and `messages` tables, a `conversation_overview` view for the
   admin inbox, and locks everything down with Row Level Security (no policies, so the browser key can read nothing).
4. Set `ADMIN_PASSWORD` (used to sign in at `/admin/login`) and `AUTH_SECRET` (`openssl rand -base64 32`).

Realtime needs no extra configuration: the server publishes Broadcast events over HTTP and browsers subscribe to
unguessable channel topics derived from `AUTH_SECRET`.

## How the jobs funnel works

| Route                        | Who       | What                                                                                      |
| ---------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `/#jobs`                     | public    | Landing-page section listing the three roles and shared requirements.                      |
| `/jobs/[slug]`               | public    | Role page with description, compensation, requirements and the application form.           |
| `/chat`                      | applicant | Private chat with the team. Access comes from the httpOnly cookie set when they applied.   |
| `/admin/login`               | admin     | Password sign-in (`ADMIN_PASSWORD`).                                                       |
| `/admin`                     | admin     | Live inbox of applications with unread counts and status.                                 |
| `/admin/conversations/[id]`  | admin     | Applicant details, status control and the real-time chat.                                  |

All reads and writes go through Server Actions using the service-role key. Applicants are identified by a random
token in a cookie (its SHA-256 is stored on the application row). Admins get a stateless HMAC-signed session cookie,
checked in `src/proxy.ts`, the admin layout and every admin action.

## Structure

- `src/app/page.tsx` — composes the landing page sections
- `src/components/landing/` — header, hero, services, process, work, testimonials, jobs, FAQ, CTA, footer
- `src/components/jobs/` — application form
- `src/components/chat/` — real-time chat room shared by applicants and admins
- `src/components/admin/` — inbox, status select, login form
- `src/lib/jobs.ts` — role content shared by the section, job pages and structured data
- `src/lib/chat/` — data access layer, Realtime channel naming and server-side broadcast
- `src/lib/supabase/` — service-role (server) and anonymous (browser) clients, row types
- `src/hooks/use-chat-channel.ts` — Realtime subscription (messages, read receipts, typing, presence)
- `supabase/migrations/` — database schema
- `src/app/globals.css` — black & white theme tokens (`.dark`, applied on `<html>`)
