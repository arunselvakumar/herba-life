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
- **Member calendar** – on each member's profile, attendance is drawn as a
  strip of month calendars, newest on the right, numbered days coloured green
  by how many times the member came in that day. Hovering a day lists each
  check-in with its time of day. The strip scrolls sideways and keeps loading
  older months back to the month the member joined.

See `docs/attendance-module.md` for the full requirements.

### Backup & export

Every module can be taken out of the console as an Excel workbook, for a
backup, for reporting, or to move to another system:

- **Export buttons** on Members, Enquiries, Packages, Attendance, Users and
  Roles download that module's workbook. A member's profile exports just that
  member with their enrolments, follow-ups and attendance.
- **Backup & export** (`/export`, from the account menu) lists every workbook
  with live row counts and offers **Download everything**: one file with a
  sheet per table (Members, Enrolments, Follow-ups, Attendance, Enquiries,
  Enquiry log, Packages, Attendance by member, Users, Roles, Permissions).
- Each workbook opens with an **About** sheet (who exported it, when, and a
  row count per sheet). Dates are real Excel dates in branch-local time,
  money has two decimals, and ID columns let rows be matched across sheets.
  Passwords and session tokens are never exported.
- Exporting is its own permission per module (`members.export`, …), so a role
  can work with records without being able to download them all.

Code lives in `src/lib/export/` (catalog, sheet builders, workbook helpers),
`src/app/api/export/[module]/route.ts` (the download route),
`src/components/app/export-button.tsx` and `src/app/(app)/export/`.

### Users and roles

Who can sign in, and what each of them may do. `Team` in the top navigation
(`/team`) has two tabs:

- **Users** (`/team/users`) – every staff account with its role, status and
  last sign-in. Administrators create users (name, email, password, role),
  edit them, set a new password, suspend or restore them, or delete them.
  Suspending signs the person out everywhere and blocks sign-in while keeping
  everything they recorded; deleting removes the account for good. You cannot
  change your own role, suspend or delete yourself, or remove the last active
  administrator.
- **Roles** (`/team/roles`) – a role is a named set of permissions, for
  example "Front desk manager". The editor lists every module with its actions
  as checkboxes (view, create, update, delete, plus module-specific ones such
  as "Record follow-ups" or "Open Attendance Mode"). Ticking any action in a
  module also grants viewing it. The built-in **Administrator** role always
  holds every permission and cannot be edited or deleted; the **Staff** role
  is an ordinary editable starting point. A role in use cannot be deleted.

The permission registry lives in `src/lib/access/permissions.ts`. Adding a
module or an action there is all it takes for it to show up in the role
editor; administrators get it automatically, every other role gets it when
someone ticks it. Server Actions guard themselves with
`requirePermission()` / `permissionFor()` from `src/lib/access/guards.ts`,
pages render `<NoAccess />` for modules the role does not unlock, and the
navigation only shows the modules the signed-in user can see. The current
user's permissions are resolved from the database on every request
(`src/lib/session.ts`), so a role change or a suspension applies immediately.

Code lives in `src/db/access-schema.ts`, `src/lib/access/`,
`src/components/team/` and `src/app/(app)/team/`.

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

The seed also creates the built-in Administrator role and a Staff role. Add
further accounts from Team → Users inside the app; the password is hashed
through Better Auth's own helpers so it matches what the sign-in endpoint
expects.

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

The console is deliberately quiet: a warm grey canvas, white cards and ink
black as the single strong colour. Tokens live in `src/app/globals.css`:

| Token    | Hex       | Use                                              |
| -------- | --------- | ------------------------------------------------ |
| Ink      | `#111111` | Primary buttons, active nav pill, chart bars     |
| Canvas   | `#EFEEEC` | Page background                                  |
| Paper    | `#FFFFFF` | Cards, inputs, popovers                          |
| Mist     | `#F6F5F3` | Muted fills, secondary buttons, table hover      |
| Hairline | `#E4E2DE` | Borders, dividers (also exposed as `stone`)      |
| Graphite | `#6B6B68` | Muted text                                       |
| Leaf     | `#B5E3BD` | Accent: soft badge fills, text selection         |
| Grass    | `#42A046` | Accent: progress fills, chart series             |

Herbalife's Garden Green (`#266431`) stays in the logo and in the `brand-50…900`
scale, which is used for success states and green status badges.

Shapes are soft: buttons, inputs, selects and badges are pills; cards and
dialogs use a 28px radius. `font-semibold` is the heaviest weight in regular
use. Herbalife's brand face (GT Walsheim) is proprietary, so the app ships
Urbanist via `next/font`.

### Motion

Animations use GSAP through the `@gsap/react` hook. The helpers live in
`src/components/motion/`: `Reveal` fades `[data-reveal]` children in with a
stagger, `CountUp` rolls figures up, `GrowBar` fills progress tracks and
`useHoverLift` lifts linked cards. Everything respects
`prefers-reduced-motion`; an inline script in the root layout marks the
document `js-motion` so reveal targets can start hidden without a flash.

### Shell

There is no sidebar. `AppHeader` renders the brand, the module pills
(`TopNav`, whose ink indicator glides between items), search and the account
menu; module actions such as "New member" live on the pages themselves.

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
  password, sign-up disabled, `roleId` and `isActive` fields on users; a
  database hook refuses new sessions for suspended accounts).
- `src/lib/auth-member.ts` – React member.
- `src/app/api/auth/[...all]/route.ts` – auth API routes.
- `src/proxy.ts` – optimistic cookie check that redirects anonymous visitors
  to `/login`.
- `src/lib/session.ts` – `getCurrentUser()`, the Data Access Layer entry point
  (`use cache: private`), which also resolves the user's role and permissions.
  Always call this in server code; never trust the cookie check alone.
- `src/app/signed-out/route.ts` – clears the session cookies and lands on the
  login page; where suspended users are sent.

## Tooling

| Script                 | What it does                         |
| ---------------------- | ------------------------------------ |
| `bun run dev`          | Next.js dev server                   |
| `bun run build`        | Production build                     |
| `bun run typecheck`    | `tsc --noEmit` (strict + extras)     |
| `bun run lint`         | ESLint                               |
| `bun run storybook`    | Storybook on http://localhost:6006   |
| `bun run test:e2e`     | Playwright (starts the dev server)   |
