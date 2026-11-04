# upforward

Marketing site for Upforward, built with Next.js (App Router), Tailwind CSS v4 and shadcn/ui, plus the public side of
the jobs funnel: open roles → application form → private real-time chat with the Upforward team.

Everything behind the funnel is managed in the **admin panel** (`admin.upforward.org`, the `tnboard` project): roles are
created there, applications are reviewed there and the team answers chats there. Both apps share **one Supabase
database** and **one Resend account**; the panel owns the schema (its Prisma migrations create the tables this site uses).

## Development

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev
```

Open http://localhost:3000.

## Supabase (shared with the admin panel)

1. Use the admin panel's Supabase project (`tnboard/.env` → `SUPABASE_URL` / keys). Do not create a second project.
2. Copy the project URL, the anon/publishable key and the service-role/secret key into `.env.local`.
3. Make sure the panel's migrations have been applied (`pnpm db:deploy` in `tnboard`, or a Vercel deploy of the panel).
   They create `jobs`, `job_applications`, `applicant_sessions`, `applicant_login_tokens`, `applicant_conversations` and
   `applicant_messages`, seed the first three roles, and turn on Row Level Security so the browser key can read nothing.

Realtime needs no extra configuration: the server publishes Broadcast events over HTTP and browsers subscribe to
unguessable channel topics. Each conversation's topic contains a random key stored on its row, and the panel-wide
"something changed" channel is keyed by a value on the panel's `Settings` row, so the two apps need no shared secret.

## Email (Resend, shared with the admin panel)

This site emails applicants their one-time chat sign-in links and, optionally, alerts the team. The panel emails
applicants about replies that stay unread. Set `RESEND_API_KEY` (same key as the panel) and `EMAIL_FROM` (an address on
the verified domain, e.g. `Upforward <hello@email.upforward.org>`). `ADMIN_NOTIFICATION_EMAIL` is optional: the panel's
notification bell always shows new applications and messages; the email is a fallback for when nobody has the panel open.

How the unread alert works: after an applicant message is stored, the server waits `UNREAD_NOTIFY_DELAY_SECONDS`
(default 20) and checks again. If the message is still unread in the panel and the team has not been emailed since they
last read the conversation, one email goes out. Reading the conversation in the panel resets the marker, so each unread
streak produces exactly one email. The check runs with Next.js `after()`, so on serverless hosts keep the delay below the
function's maximum duration.

## How the jobs funnel works

| Route                  | Who       | What                                                                                            |
| ---------------------- | --------- | ----------------------------------------------------------------------------------------------- |
| `/#jobs`               | public    | Landing-page section listing the open roles from the database and the shared requirements.      |
| `/jobs/[slug]`         | public    | Role page with description, compensation, requirements and the application form.                 |
| `/chat`                | applicant | Private chat with the team. Signed out visitors get an email form that sends a sign-in link.      |
| `/chat/verify?token=…` | applicant | Landing page for the emailed link; one click signs them in on that device.                       |
| admin panel → Jobs     | admin     | Create, edit, open/close roles (`admin.upforward.org/jobs`).                                     |
| admin panel → Applicants | admin   | Applicants by role and status, each with a live chat (`admin.upforward.org/applicants`).         |

Pages that show roles export `revalidate = 60`, so changes made in the panel appear within a minute without a redeploy.

All reads and writes go through Server Actions using the service-role key. Applicants are identified by a random token
in a cookie (its SHA-256 is stored in `applicant_sessions`, one row per device). Sign-in links are random tokens whose
hashes live in `applicant_login_tokens`; the link page only consumes the token when the visitor presses the button, so
email scanners that pre-fetch URLs cannot burn it. When the team replies from the panel, the message reaches the open
chat instantly over Supabase Realtime, and the panel writes a notification, an activity entry and a live ping for itself
through the same database.

## Structure

- `src/app/page.tsx`: composes the landing page sections
- `src/components/landing/`: header, hero, services, process, work, testimonials, jobs, FAQ, CTA, footer
- `src/components/jobs/`: application form
- `src/components/chat/`: real-time chat room for applicants
- `src/lib/jobs.ts`: client-safe job helpers (requirements, status labels); `src/lib/jobs-db.ts`: role queries
- `src/lib/chat/`: data access layer, sessions and sign-in tokens, Realtime channels, admin-panel hooks, alert emails
- `src/lib/email.ts`: Resend wrapper and email templates
- `src/lib/supabase/`: service-role (server) and anonymous (browser) clients, row types
- `src/hooks/use-chat-channel.ts`: Realtime subscription (messages, read receipts, typing, presence)
- `src/app/globals.css`: black & white theme tokens (`.dark`, applied on `<html>`)

The database schema lives in `tnboard/prisma/schema.prisma` and `tnboard/prisma/migrations/`.
