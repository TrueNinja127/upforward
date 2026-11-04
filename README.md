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
3. Open the **SQL editor** and run the files in `supabase/migrations/` in order:
   - `20261104000000_jobs_and_chat.sql` creates `applications`, `conversations`, `messages` and the
     `conversation_overview` view for the admin inbox.
   - `20261105000000_sessions_tokens_notifications.sql` adds `applicant_sessions` (one per device), `login_tokens`
     (email sign-in links) and the unread-notification markers.
   Everything is locked down with Row Level Security and no policies, so the browser key can read nothing.
4. Set `ADMIN_PASSWORD` (used to sign in at `/admin/login`) and `AUTH_SECRET` (`openssl rand -base64 32`).

Realtime needs no extra configuration: the server publishes Broadcast events over HTTP and browsers subscribe to
unguessable channel topics derived from `AUTH_SECRET`.

## Email setup (Resend)

Email powers two things: applicants signing back in to their chat with a one-time link, and notifications about
unread messages. Without `RESEND_API_KEY` both are disabled and the rest of the site keeps working.

1. Create an account at https://resend.com, add and verify your sending domain, then create an API key.
2. Set `RESEND_API_KEY` and `EMAIL_FROM` (an address on the verified domain) in `.env.local`.
3. Optionally set `ADMIN_NOTIFICATION_EMAIL` to receive an email for every new application and for applicant
   messages that stay unread.

How unread notifications work: after a message is stored, the server waits `UNREAD_NOTIFY_DELAY_SECONDS`
(default 20) and checks again. If the message is still unread and the recipient has not been emailed since they last
read the conversation, one email goes out with a link straight into the chat. Reading the conversation resets the
marker, so each unread streak produces exactly one email. The check runs with Next.js `after()`, so on serverless
hosts keep the delay below the function's maximum duration.

## How the jobs funnel works

| Route                        | Who       | What                                                                                      |
| ---------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| `/#jobs`                     | public    | Landing-page section listing the three roles and shared requirements.                      |
| `/jobs/[slug]`               | public    | Role page with description, compensation, requirements and the application form.           |
| `/chat`                      | applicant | Private chat with the team. Signed out visitors get an email form that sends a sign-in link. |
| `/chat/verify?token=…`       | applicant | Landing page for the emailed link; one click signs them in on that device.                 |
| `/admin/login`               | admin     | Password sign-in (`ADMIN_PASSWORD`).                                                       |
| `/admin`                     | admin     | Live inbox of applications with unread counts and status.                                 |
| `/admin/conversations/[id]`  | admin     | Applicant details, status control and the real-time chat.                                  |

All reads and writes go through Server Actions using the service-role key. Applicants are identified by a random
token in a cookie (its SHA-256 is stored in `applicant_sessions`, one row per device). Sign-in links are random
tokens whose hashes live in `login_tokens`; the link page only consumes the token when the visitor presses the button,
so email scanners that pre-fetch URLs cannot burn it. Admins get a stateless HMAC-signed session cookie, checked in
`src/proxy.ts`, the admin layout and every admin action.

## Structure

- `src/app/page.tsx` — composes the landing page sections
- `src/components/landing/` — header, hero, services, process, work, testimonials, jobs, FAQ, CTA, footer
- `src/components/jobs/` — application form
- `src/components/chat/` — real-time chat room shared by applicants and admins
- `src/components/admin/` — inbox, status select, login form
- `src/lib/jobs.ts` — role content shared by the section, job pages and structured data
- `src/lib/chat/` — data access layer, sessions and sign-in tokens, Realtime channels, unread-email notifications
- `src/lib/email.ts` — Resend wrapper and email templates
- `src/lib/supabase/` — service-role (server) and anonymous (browser) clients, row types
- `src/hooks/use-chat-channel.ts` — Realtime subscription (messages, read receipts, typing, presence)
- `supabase/migrations/` — database schema
- `src/app/globals.css` — black & white theme tokens (`.dark`, applied on `<html>`)
