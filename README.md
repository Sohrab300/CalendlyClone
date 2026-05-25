# DevSchedule

**Scheduling Made Simple — A modern, open booking platform for hosts and teams.**

![React 19](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![Google Calendar](https://img.shields.io/badge/Google_Calendar-4285F4?style=flat-square&logo=google-calendar&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)
![Vite 6](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)
![WIP](https://img.shields.io/badge/Status-WIP-f59e0b?style=flat-square)

---

## 🗓 Overview

DevSchedule is a Calendly-inspired booking platform that lets hosts publish scheduling links so invitees can book meetings based on availability, timezone rules, and event-specific settings.

It removes the back-and-forth of scheduling by handling booking forms, optional email verification, calendar event creation, Google Meet link generation, and host notifications — all automatically.

---

## ✦ Features

*   **🔗 Public Booking Pages**: Host landing pages at `/:userSlug` and event pages at `/:userSlug/:eventSlug` — shareable, no-login booking for invitees.
*   **📅 Availability Management**: Default weekly hours, multiple named schedules, date-specific overrides, and per-event custom schedules.
*   **🎛 Booking Rules**: Buffers before/after, meeting limits, time increments, minimum notice, date range limits, and timezone lock/detect.
*   **📋 Custom Invitee Forms**: Name/email or first/last/email, guests, phone fields, custom questions (text, radio, checkbox, dropdown).
*   **🗂 Meetings & Contacts**: Upcoming/past filters, CSV export, rich-text host notes, searchable contact table with column controls.
*   **🔒 Auth & Security**: Email/password login, Google OAuth, OTP-based signup, optional per-event email verification for invitees.
*   **📨 Google Integration**: Creates Calendar events, generates Meet links, sends Calendar invites to invitees, and emails host on booking.
*   **🎨 Branding & Settings**: Avatar upload, brand logo, welcome message, username/slug, timezone/date/time preferences, notification controls.

---

## ⚙ Tech Stack

### Frontend
- **React 19**, **React Router DOM 7**, **Vite 6**, **TypeScript**
- **Tailwind CSS v4**, **motion/react**, **lucide-react**, **sonner**

### Backend / API
- **Express 4**, **Vercel Serverless (api/)**
- **nodemailer**, **googleapis**, **ical-generator**

### Data & Auth
- **Supabase JS v2**, **Supabase Auth**, **Supabase Storage**
- **date-fns**, **date-fns-tz**

---

## 📁 Project Structure

| Directory | Description |
| :--- | :--- |
| `src/pages/` | Marketing, auth, public booking, landing, and policy pages |
| `src/components/` | Shared UI: calendar, booking form, time slots, header, success page |
| `src/admin/` | Admin dashboard, types, hooks, and all admin UI components |
| `src/services/` | Supabase data services for availability, bookings, and profile |
| `src/context/` | Auth context wrapping Supabase session state |
| `src/lib/` | Supabase client, utilities, OAuth redirect helpers |
| `api/` | Vercel serverless functions: schedule, auth, OTP, profile |
| `server/` | Shared local server helpers: OTP, email, Supabase admin client |
| `server.ts` | Local Express server, API routes, Vite middleware, Google logic |
| `supabase/migrations/` | SQL migration for verification_codes table |

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- npm
- Supabase project
- Google Cloud project
- Gmail account

### Install & Run

```bash
# install dependencies
$ npm install

# local dev server (Express + Vite)
$ npm run dev

# production build
$ npm run build

# preview production build
$ npm run preview

# type-check (tsc --noEmit)
$ npm run lint

# remove dist/
$ npm run clean
```

> [!NOTE]
> No automated test suite is configured. Type-checking via `npm run lint` is the primary verification step.

---

## 🔑 Environment Variables

### Frontend (Vite)

| Variable | Description | Required |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous public key | Yes |
| `VITE_PUBLIC_APP_URL` | Public app origin for OAuth redirect URLs | No |
| `GEMINI_API_KEY` | Google Gemini key (reserved for future use) | No |

### Server / API

| Variable | Description | Required |
| :--- | :--- | :--- |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key for privileged operations | Yes |
| `EMAIL_USER` | Gmail account used for OTP and error notifications | Yes |
| `EMAIL_PASS` | Gmail app password for `EMAIL_USER` | Yes |
| `GOOGLE_CLIENT_ID` | OAuth client ID for Google Calendar / Gmail API | Yes |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret for Google Calendar / Gmail API | Yes |
| `GOOGLE_REDIRECT_URI` | OAuth redirect URI (used by local server.ts) | No |
| `PORT` | Local Express port (defaults to 3000) | No |
| `NODE_ENV` | Enables Vite middleware in dev, serves dist in production | No |

---

## 🛣 API Reference

### Vercel Serverless Routes

*   **POST** `/api/schedule`: Creates Google Calendar event + Meet link, sends host Gmail notification, rolls back Supabase booking on failure.
*   **POST** `/api/auth/ensure-profile`: Validates Bearer token, creates/updates profile, stores Google tokens, seeds default schedule and event type.
*   **POST** `/api/auth/send-signup-otp`: Sends a 6-digit OTP email and stores the code in Supabase for manual signup flow.
*   **POST** `/api/auth/verify-signup-otp`: Verifies the OTP and deletes the used code from the database.

### Local Express-Only Routes

*   **POST** `/api/verification/send`: Sends invitee email verification code before booking (no Vercel parity yet).
*   **POST** `/api/verification/verify`: Verifies the invitee email code and permits booking to proceed.

> [!IMPORTANT]
> **Heads up:** `/api/verification/send` and `/api/verification/verify` exist only in the local Express server and do not yet have matching Vercel serverless files. Email verification for invitees will need Vercel API parity before production deployment.

---

## 🗄 Database Schema

The app expects the following Supabase tables and storage buckets:

### Tables
`profiles`, `event_types`, `schedules`, `weekly_hours`, `date_overrides`, `bookings`, `verification_codes`

### Storage Buckets
`avatars`, `brand-logos`

> [!NOTE]
> Only `verification_codes` has a migration file in `supabase/migrations/`. The remaining tables must be created manually in your Supabase project dashboard.

---

## ⚡ Architecture Notes

*   **🔄 Booking Rollback**: Supabase booking is created first, then Google Calendar is called. If scheduling fails, the booking is deleted and the user is notified generically while diagnostics are emailed to `EMAIL_USER`.
*   **🏗 Profile Bootstrap**: `ensure-profile` is the single entry point for new users: creates their profile, default schedule, weekly hours, and a "30 Minute Meeting" event type.
*   **📤 Invitee Notifications**: Invitees receive Google Calendar invites via `sendUpdates: "all"` — not a custom app email. Hosts get a branded Gmail notification.
*   **🌐 Vercel Routing**: `vercel.json` rewrites all paths to `/index.html` for SPA routing. Serverless API functions under `/api` are still resolved independently.

---

## 📜 License

Source files contain an `Apache-2.0` SPDX identifier (see `src/App.tsx`). No top-level `LICENSE` file is present — adding one is recommended before open-sourcing or distributing this project.

---

**DevSchedule** — Scheduling Made Simple
*Built with React · Supabase · Google Calendar API · Vercel*
