# Herbalife Internal

Internal management tool for Herbalife. Next.js 16 (App Router, Cache
Components), Better Auth, Drizzle ORM on Postgres, shadcn/ui styled with the
Herbalife design system, Storybook, and Playwright.

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
- `src/lib/auth-client.ts` – React client.
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
