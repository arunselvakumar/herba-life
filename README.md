# Herbalife Internal

Internal management tool for a Herbalife nutrition centre. Next.js 16 (App
Router, Cache Components), Better Auth, Drizzle ORM on Postgres, shadcn/ui
styled with the Herbalife design system, Storybook, and Playwright.

## Modules

### Member management

The digital version of the branch's paper **Wellness Record** and **Follow Up
Record**:

- **Members** (`/members`) – searchable list with the current package state and
  last follow-up. Filters: on a package, follow-up due, ending soon, no package.
- **Enrolment** (`/members/new`) – personal details, eating habits, health
  conditions, baseline measurements and an optional starting package, all on
  one form like the paper sheet.
- **Profile** (`/members/[id]`) – current readings against the reference
  ranges printed on the record, a follow-up entry form, weight trend, the full
  follow-up grid (weight, fat %, BMI, VF, BMR, body age, MM %, waist), and the
  member's packages.
- **Packages** (`/packages`) – the catalog of programmes the branch sells:
  name, duration in days, price. Administrators create, edit, archive or delete
  them. Enrolment copies the plan's name, duration and price onto the member's
  record, so catalog edits never rewrite history.
- **Enrolment** – a member is enrolled in a catalog package from their join
  date (editable), with optional extra days and an advance paid. The last
  covered day is `start + duration + extra - 1`; days left count down from
  today. Enrolments can be completed, cancelled, reopened or deleted.
- **Dashboard** – member and package counts, follow-ups due (on a package but
  not measured in 30 days), packages ending within 14 days, recent follow-ups.

### Inquiries

Prospects who asked about the programme but have not joined. The full
requirements are in [`docs/inquiry-module.md`](docs/inquiry-module.md).

- **Inquiries** (`/inquiries`) – open inquiries sorted by next follow-up,
  with search and filters (open, follow-up due, new, converted, lost, all).
- **New inquiry** (`/inquiries/new`) – source, referrer (free text or an
  existing member), assigned staff, next follow-up, personal details, goals,
  interested package, free-check readings, eating habits, health condition.
  Only the first name is required.
- **Detail** (`/inquiries/[id]`) – status, follow-up log with an add-entry
  form (call / WhatsApp / visit / note, which also reschedules the next
  follow-up), mark lost with a reason, reopen, delete. Warns when a member
  already has the same mobile number.
- **Convert** (`/inquiries/[id]/convert`) – the normal New member form,
  pre-filled from the inquiry (readings become the baseline follow-up, the
  interested package is pre-selected). Saving creates the member and closes
  the inquiry as converted in one transaction; the two records link to each
  other.
- **Dashboard** – open inquiries count, follow-ups due, recent inquiries.

Code lives in `src/db/inquiries-schema.ts`, `src/lib/inquiries/`,
`src/components/inquiries/` and `src/app/(app)/inquiries/`. The column groups
shared with the member record are in `src/db/record-columns.ts`.

Code lives in `src/db/members-schema.ts` (tables), `src/lib/members/` and
`src/lib/packages/` (validation, queries, server actions, helpers),
`src/components/members/`, `src/components/packages/`, `src/app/(app)/members/`
and `src/app/(app)/packages/`.

### Attendance

Members mark their own visits on a tablet at the entrance:

- **Attendance Mode** (`/attendance/kiosk`) – full-screen, member-facing
  kiosk. Find your name, tap, confirm; a welcome screen shows the time and the
  visit count for the month. A second tap within 45 minutes is treated as the
  same visit. Leaving the kiosk requires the signed-in staff member's password.
- **Attendance** (`/attendance`) – per-day view with check-ins, morning /
  afternoon / evening split, a chart over 2 weeks to 12 months, busy hours,
  weekday pattern, regulars, members on a package who have not been seen for
  7+ days, the day's log, and a "Record a visit" fallback for staff.

See `docs/attendance-module.md` for the full requirements.

## Prerequisites

- [Bun](https://bun.sh) 1.3+
- Node 20+ (the dev server runs under Node; Bun is the package manager)
- Docker with a Postgres container running

## Getting started

```bash
bun install
cp .env.example .env         # then set BETTER_AUTH_SECRET (openssl rand -base64 32)
bun run db:migrate           # creates the auth tables
bun run db:seed              # creates the local admin account
bun run db:seed:demo         # optional: four packages, six sample members with follow-ups, four inquiries
bun run dev                  # http://localhost:3000
```

### Local admin account

Public sign-up is disabled. The seed script provisions one account for local
development:

| Field    | Value                   |
| -------- | ----------------------- |
| Email    | `admin@herbalife.local` |
| Password | `Herbalife2026!`        |

Edit `scripts/seed.ts` to add more accounts. The password is hashed through
Better Auth's own helpers so it matches what the sign-in endpoint expects.

### Database

`DATABASE_URL` points at the `herbalife` database inside the existing
`white-board-v3-postgres-1` container (host port 5433). Create it once with:

```bash
docker exec white-board-v3-postgres-1 psql -U whiteboard -d postgres -c "CREATE DATABASE herbalife"
```

| Script            | What it does                                   |
| ----------------- | ---------------------------------------------- |
| `bun run db:generate` | Generate a migration from `src/db/schema.ts` |
| `bun run db:migrate`  | Apply pending migrations                      |
| `bun run db:push`     | Push schema directly (prototyping only)       |
| `bun run db:studio`   | Open Drizzle Studio                           |
| `bun run db:seed`     | Seed local accounts                           |
| `bun run db:seed:demo` | Insert sample members (local development only) |

When Better Auth options change (plugins, additional fields), regenerate the
auth tables with:

```bash
bunx @better-auth/cli@latest generate --config src/lib/auth.ts --output src/db/auth-schema.ts -y
bun run db:generate && bun run db:migrate
```

## Design system

Brand tokens live in `src/app/globals.css`:

| Token          | Hex       | Use                               |
| -------------- | --------- | --------------------------------- |
| Garden Green   | `#266431` | Primary (PMS 7733C)               |
| Grass          | `#42A046` | Accent, success, focus ring       |
| Mint           | `#B5E3BD` | Soft fills                        |
| Succulent      | `#E5FFC5` | Highlight / accent background     |
| Forest         | `#163E35` | Secondary foreground              |
| Evergreen      | `#0E2512` | Sidebar, hero panels              |
| Linen          | `#F9F8F4` | Page background                   |
| Stone          | `#E0DFD9` | Borders, dividers                 |

They are exposed to Tailwind as `brand-50…900`, `linen`, and `stone`, and
mapped onto the shadcn semantic tokens (`primary`, `sidebar`, `accent`, …).
Herbalife's brand face (GT Walsheim) is proprietary, so the app ships
Plus Jakarta Sans via `next/font`.

### Brand assets

The logo artwork in `public/brand/` is the official Herbalife logo as served
on herbalife.com (`/dmassets/hn-one/en/hybrid/h1-logo.png`). The leaf mark is
cropped from the same file. Both are Garden Green on transparent; the
`Logo`/`LogoMark` components in `src/components/brand/logo.tsx` recolour them
white for dark surfaces with `tone="white"`. Taglines on the login screen
("Make wellness a movement", "Live your best life") and the copyright notice
are taken from herbalife.com.

## Authentication

- `src/lib/auth.ts` – Better Auth server instance (Drizzle adapter, email +
  password, sign-up disabled, `role` field on users).
- `src/lib/auth-member.ts` – React member.
- `src/app/api/auth/[...all]/route.ts` – auth API routes.
- `src/proxy.ts` – optimistic cookie check that redirects anonymous visitors
  to `/login`.
- `src/lib/session.ts` – `getCurrentUser()`, the Data Access Layer entry point
  (`use cache: private`). Always call this in server code; never trust the
  cookie check alone.

## Tooling

| Script                 | What it does                         |
| ---------------------- | ------------------------------------ |
| `bun run dev`          | Next.js dev server                   |
| `bun run build`        | Production build                     |
| `bun run typecheck`    | `tsc --noEmit` (strict + extras)     |
| `bun run lint`         | ESLint                               |
| `bun run storybook`    | Storybook on http://localhost:6006   |
| `bun run test:e2e`     | Playwright (starts the dev server)   |
