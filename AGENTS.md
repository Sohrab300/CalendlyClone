# DevSchedule — Agent Instructions

## Project Overview

DevSchedule is a Calendly-style scheduling and booking platform live at devschedule.in.
Hosts configure their weekly availability and event types; invitees book slots via public
URLs. On booking, the app automatically creates a Google Calendar event with a Meet link
and sends email notifications to the host.

All API logic lives in `/api/` as Vercel Serverless Functions. There is no local Express
server. Local development runs via `vercel dev`, which simulates the Vercel runtime locally.
The frontend is a React 19 SPA built with Vite, talking to Supabase for both auth and
database, and to `/api/` for anything that needs Google or email integration.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 6, React Router v7 |
| Styling | Tailwind CSS v4, Motion (Framer), Lucide React, Sonner |
| API | Vercel Serverless Functions (`/api/*.ts`) |
| Database & Auth | Supabase (Postgres + Auth + Storage) |
| Integrations | Google Calendar API, Google Meet, Nodemailer (Gmail SMTP), ical-generator |
| Monitoring | Sentry (`@sentry/react`, `@sentry/node`) |
| Local dev | `vercel dev` (not a custom Express server) |

---

## Rules

- **Read before touching.** Understand a file fully before suggesting or making any change.
- **Report, don't auto-fix.** For each bug found, describe the location, root cause, and proposed fix — then ask before applying.
- **Surgical changes only.** Change only the lines needed. Do not refactor unrelated code while fixing something else.
- **No `.env` changes.** Do not read, modify, or create `.env` files. Do not log or expose environment variable values.
- **No Supabase RLS changes.** Do not touch Row Level Security policies — they are security-sensitive.
- **No `any`.** Do not suppress TypeScript errors with `any` or `as unknown`. Fix them properly.
- **Don't trigger real emails.** `server/emailService.ts` sends live emails via Gmail SMTP. Do not call it during exploration or testing.
- **One task at a time.** Stay focused on the current task. Do not open unrelated files or propose unrelated improvements unless explicitly asked.
