# Kiosk lock: build plan

Status: **built** (branch `feat/kiosk-session-lock`). Kept as the record of
the design; `docs/attendance-module.md` section 4 describes the result.

## 1. The problem

Attendance Mode (`/attendance/kiosk`) is only a screen. The tablet keeps the
staff member's full sign-in, so a visitor who types `/members` in the address
bar, presses Back, or opens a new tab gets the admin screens. The exit password
in `verifyExitPassword` (`src/lib/attendance/actions.ts`) only guards the Exit
button; the server never knows the tablet is in Attendance Mode.

## 2. The design in one paragraph

Starting Attendance Mode writes a **lock row for that one sign-in** (one row of
the `session` table = one device). While the row exists, the server treats
that sign-in as having a single permission, `attendance.kiosk`, and redirects
every admin page back to the kiosk. The exit password deletes the row. Other
devices signed in with the same account have their own `session` row and are
never affected.

The whole app already gets its user from `src/lib/session.ts` and checks
`can()` / `requirePermission()`. The lock is applied there, so pages, Server
Actions and the Excel export route are all covered by one change.

## 3. Rules that must hold when you are done

1. With the lock on, no admin page, Server Action or export returns member,
   package, stock or team data to that browser.
2. The lock is per sign-in. A second device (or a second browser) signed in
   with the same account keeps full access.
3. The lock lives in the database. Deleting cookies in the browser must never
   unlock anything (it can only sign the tablet out).
4. The only way to unlock is the signed-in staff member's password, with
   attempts throttled on the server.
5. No admin content from before the lock is reachable with the Back button.

## 4. Before you start

- Read `AGENTS.md`. This Next.js version (16.4) differs from older ones; read
  the relevant page under `node_modules/next/dist/docs/` before using an API
  you are not sure about.
- Branch from `main`: `feat/kiosk-session-lock`.
- Run the dev server with `bun run dev` (it must run under Node, do not use
  `bun --bun`).
- The local Postgres must be running before `bun run db:migrate` or any page
  load. If the database cannot be reached, stop and ask.
- **Never run migrations against production.** Merging to `main` applies them
  through `.github/workflows/deploy.yml`.

## 5. Build steps

### Step 1: the lock table

In `src/db/attendance-schema.ts` add (import `session` from `./auth-schema`,
`integer` from `drizzle-orm/pg-core`):

```ts
/**
 * One row per sign-in that is currently in Attendance Mode. The row existing
 * is the lock; deleting it (or the session) unlocks.
 */
export const kioskLock = pgTable("kiosk_lock", {
  sessionId: text("session_id")
    .primaryKey()
    .references(() => session.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  lockedAt: timestamp("locked_at", { withTimezone: true }).notNull().defaultNow(),
  /** Wrong exit passwords in a row since the lock started. */
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lastFailedAt: timestamp("last_failed_at", { withTimezone: true }),
});
```

Do **not** edit `src/db/auth-schema.ts`. Do **not** use better-auth
`session.additionalFields` for this: session fields are cached in a cookie for
5 minutes (`cookieCache` in `src/lib/auth.ts`), so the lock would lag.

Generate and apply locally:

```bash
bunx drizzle-kit generate --name kiosk_lock
```

```bash
bun run db:migrate
```

Expect a new `drizzle/0007_kiosk_lock.sql` containing only the new table.

### Step 2: constants

Add to `src/lib/attendance/constants.ts` (this file is imported by client
components, keep it free of server code):

```ts
export const KIOSK_PATH = "/attendance/kiosk";
/** Changes on every lock so cached renders from before the lock are never reused. Not used for any security decision. */
export const KIOSK_MARKER_COOKIE = "hl_kiosk";
export const KIOSK_EXIT_MAX_ATTEMPTS = 5;
export const KIOSK_EXIT_LOCKOUT_SECONDS = 60;
```

### Step 3: lock helpers

Create `src/lib/attendance/kiosk-lock.ts`. First line `import "server-only";`.
It imports only `@/db`, `@/db/schema` and drizzle. It must **not** import
`@/lib/session` (session.ts imports this file; that would be a cycle).

| Function | Behaviour |
|---|---|
| `findKioskLock(sessionId)` | The row, or `undefined`. |
| `lockKiosk(sessionId, userId)` | Insert; `onConflictDoNothing()` so a second call is harmless. |
| `unlockKiosk(sessionId)` | Delete the row. |
| `registerFailedExit(sessionId)` | One UPDATE: `failedAttempts = failedAttempts + 1` (use `sql`), `lastFailedAt = new Date()`. |
| `exitRetryAfterSeconds(lock, now)` | Pure function. If `lock.failedAttempts >= KIOSK_EXIT_MAX_ATTEMPTS` and `lastFailedAt` is less than `KIOSK_EXIT_LOCKOUT_SECONDS` ago, return the seconds left (rounded up); otherwise `0`. |

### Step 4: `src/lib/session.ts` (the core change)

1. Add `kioskLocked: boolean` to `CurrentUser`.
2. `resolveUser(id)` becomes `resolveUser(userId, sessionId)`. Run the user
   query and `findKioskLock(sessionId)` together with `Promise.all`. Build the
   user as today, then, if a lock row exists, return:

   ```ts
   {
     ...user,
     isAdmin: false, // can() lets isAdmin through unconditionally, so this must be false
     permissions: can(user, "attendance.kiosk") ? ["attendance.kiosk"] : [],
     kioskLocked: true,
   }
   ```

   Otherwise `kioskLocked: false`. The session id is `session.session.id` from
   `auth.api.getSession(...)`.
3. Rename the body of today's `getCurrentUser` to a private function
   `readUser()`, keeping `"use cache: private"`, the `cacheLife` call and the
   two existing redirects exactly as they are.
4. Export two thin wrappers. Neither has a cache directive of its own.

   ```ts
   /** For every admin page: a locked sign-in is sent back to the kiosk. */
   export async function getCurrentUser(): Promise<CurrentUser> {
     const user = await readUser();
     if (user.kioskLocked) redirect(KIOSK_PATH);
     return user;
   }

   /** For the kiosk page only: the one place a locked sign-in may render. */
   export async function getKioskUser(): Promise<CurrentUser> {
     return readUser();
   }
   ```

5. Add `requireSession(): Promise<{ user: CurrentUser; sessionId: string }>`
   holding today's `requireUser` body, and make `requireUser` return
   `(await requireSession()).user`. Do **not** redirect locked users here:
   Server Actions must fail through `requirePermission`, which now throws for
   every permission except `attendance.kiosk`.
6. `findCurrentUser` passes the session id too. No other change: the export
   route already answers 403 when `can()` is false.

Do **not** add the session id to `CurrentUser`; that object is passed to client
components (`UserMenu`).

Do **not** change `src/proxy.ts`. It is a cookie-only check by design and must
not be given a database call or made to trust the marker cookie.

### Step 5: Server Actions in `src/lib/attendance/actions.ts`

New imports this file needs: `cookies` from `next/headers`, `can` from
`@/lib/access/can`, `PermissionDeniedError` from `@/lib/access/guards`,
`requireSession` from `@/lib/session`, the helpers from `./kiosk-lock` and the
new constants.

Add:

```ts
/** Puts this sign-in (this device only) into Attendance Mode. Safe to call twice. */
export async function startKioskMode(): Promise<{ ok: true }> {
  const { user, sessionId } = await requireSession();
  if (!can(user, "attendance.kiosk")) throw new PermissionDeniedError("attendance.kiosk");
  await lockKiosk(sessionId, user.id);
  (await cookies()).set(KIOSK_MARKER_COOKIE, crypto.randomUUID(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return { ok: true };
}
```

Change `verifyExitPassword` (keep the name; it is used by stories and tests).
New return type: `{ ok: boolean; retryAfterSeconds?: number }`. Order of work:

1. `const { user, sessionId } = await requireSession();`
2. `const lock = await findKioskLock(sessionId);`
3. If `lock` and `exitRetryAfterSeconds(lock, new Date()) > 0`, return
   `{ ok: false, retryAfterSeconds }` **without** checking the password.
4. Validate and verify the password exactly as today.
5. Wrong (including the "no credential account" case): if `lock`, call
   `registerFailedExit(sessionId)`; return `{ ok: false }`.
6. Right: `unlockKiosk(sessionId)`, delete the marker cookie, return
   `{ ok: true }`.

Update the doc comment above it: it now ends the lock, it no longer "never
touches the session".

### Step 6: a helper for full page loads

Create `src/lib/hard-navigate.ts`:

```ts
/** A full page load. Unlike router.push, it throws away everything the browser tab has cached. */
export function hardNavigate(path: string) {
  window.location.assign(path);
}

export function hardReplace(path: string) {
  window.location.replace(path);
}
```

Why this exists: with Cache Components, Next keeps previously visited pages
alive but hidden in the same document, and keeps signed-in data in a browser
memory cache for 30 seconds. A client-side navigation into or out of the kiosk
would carry admin pages along. A full page load is the only thing that
reliably drops them. It also needs to be a module so Storybook can mock it:
add `src/lib/__mocks__/hard-navigate.ts` (two `fn()` spies) and register it in
`.storybook/preview.tsx` with `sb.mock(import("../src/lib/hard-navigate.ts"));`
next to the other `sb.mock` lines.

### Step 7: entering Attendance Mode

**`src/components/attendance/attendance-mode-button.tsx`**: the click handler
becomes only `hardNavigate(KIOSK_PATH)`. Remove the full-screen request (a full
page load drops full screen, so it moves to the Start button below) and remove
`useRouter`. Update the doc comment.

There must be no `<Link>` or `router.push` to the kiosk anywhere.

**New `src/components/attendance/kiosk-start.tsx`** (client component), props
`{ staffName: string }`. A centred card in the kiosk layout:

- Title: "Start Attendance Mode"
- Body: "This device will only show the check-in screen until the password
  for **{staffName}** is entered. Other devices you are signed in on are not
  affected."
- Primary button "Start", secondary "Go back" (calls `hardNavigate("/")`).

Start handler:

```ts
function start() {
  // Full screen must be requested synchronously inside the click.
  const root = document.documentElement;
  if (!document.fullscreenElement && root.requestFullscreen) {
    root.requestFullscreen().catch(() => {});
  }
  startTransition(async () => {
    await startKioskMode();
    // Only refresh in place if this document was loaded at the kiosk URL.
    // Otherwise earlier admin pages are still alive in this tab: reload.
    const entry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const loadedHere = entry ? new URL(entry.name).pathname === KIOSK_PATH : false;
    if (loadedHere) router.refresh();
    else hardReplace(KIOSK_PATH);
  });
}
```

Disable both buttons while pending and show an inline error if the action
throws.

**`src/app/(kiosk)/attendance/kiosk/page.tsx`**, in `KioskLoader`:

```ts
const user = await getKioskUser(); // not getCurrentUser: that one redirects locked users here
if (!can(user, "attendance.kiosk")) return <NoAccess ... />; // unchanged
if (!user.kioskLocked) return <KioskStart staffName={user.name} />;
// ...existing member loading and <Kiosk />, unchanged
```

The member list must not be queried or rendered before the lock is on.

### Step 8: leaving Attendance Mode

In `src/components/attendance/kiosk-exit.tsx`:

- On `ok: true`: leave full screen as today, then `hardNavigate("/attendance")`
  instead of `router.push`. Remove `useRouter`.
- On `retryAfterSeconds`: show "Too many wrong passwords. Try again in
  {n} seconds." and clear the field.
- Otherwise keep "That password is not right. Try again."

### Step 9: pages restored by the Back button

Create `src/components/app/reload-on-restore.tsx` (client component, renders
`null`) and mount it once inside `<body>` in `src/app/layout.tsx`:

```ts
useEffect(() => {
  function onShow(event: PageTransitionEvent) {
    if (!event.persisted) return;
    // Restored from the browser's back/forward cache: the markup is from
    // before a possible lock. Hide it and ask the server again.
    document.documentElement.style.visibility = "hidden";
    window.location.reload();
  }
  window.addEventListener("pageshow", onShow);
  return () => window.removeEventListener("pageshow", onShow);
}, []);
```

### Step 10: two routes that bypass `session.ts`

Both read the session with `auth.api.getSession({ headers })` and then call
`findKioskLock(session.session.id)`.

- **`src/app/signed-out/route.ts`**: if the session is locked, redirect to
  `KIOSK_PATH` and do nothing else. (Today anyone who types `/signed-out`
  signs the tablet out.)
- **`src/app/api/auth/[...all]/route.ts`**: wrap `GET` and `POST`. If the
  session is locked, return `new Response("Attendance Mode is on.", { status: 403 })`;
  otherwise call the original handler. The kiosk never calls these endpoints,
  and `/api/auth/get-session` and `/api/auth/list-sessions` would otherwise
  print the staff member's email and session details as JSON.

### Step 11: Storybook

CI runs every story as a test, so these must be updated in the same change:

- `src/stories/fixtures/users.ts`: add `kioskLocked: false` to each user; add
  a `kioskUser` fixture (`kioskLocked: true`, `isAdmin: false`,
  `permissions: ["attendance.kiosk"]`).
- `src/lib/__mocks__/session.ts`: add `getKioskUser` and `requireSession`.
- `src/lib/attendance/__mocks__/actions.ts`: add `startKioskMode`.
- `attendance-mode-button.stories.tsx` and `kiosk-exit.stories.tsx`: they
  assert `getRouter().push(...)`; assert `hardNavigate(...)` instead.
- `kiosk-exit.stories.tsx`: add a story for the "too many wrong passwords"
  message.
- New `kiosk-start.stories.tsx`, modelled on `kiosk-exit.stories.tsx`.
- `src/stories/screens/attendance.stories.tsx`: the kiosk screen story needs
  `getKioskUser` to resolve to `kioskUser`; add a story for the Start screen
  (unlocked user).

### Step 12: existing end-to-end tests

Every test that does `page.goto("/attendance/kiosk")` now lands on the Start
screen, and cannot open admin pages afterwards without exiting. In
`e2e/attendance.spec.ts` and `e2e/attendance-time-zone.spec.ts`:

- Add helpers `openKiosk(page)` (go to the URL, click "Start", wait for the
  "Welcome! Tap your name to check in." heading) and `exitKiosk(page)` (Exit,
  password, wait for `/attendance`).
- Call `exitKiosk` before any step that goes back to an admin page.
- In "only members with an active package…", the package is cancelled from
  `page.context().newPage()`. That shares the kiosk's cookies, so it is now
  locked. Use `browser.newContext()` with its own `signIn` instead: that is a
  second device.

### Step 13: new end-to-end tests

Create `e2e/kiosk-lock.spec.ts`. Each test signs in fresh.

| # | Test | Expect |
|---|---|---|
| 1 | Start, then `goto` each of `/`, `/dashboard`, `/members`, `/team/users`, `/login` | URL ends at `/attendance/kiosk`; the check-in heading is visible |
| 2 | Start, then `page.request.get` on a valid export URL (see `src/app/api/export/[module]/route.ts`) | 403 |
| 3 | Start, then `page.request.get("/api/auth/get-session")` | 403 |
| 4 | Start, then `goto("/signed-out")` | Lands on the kiosk, still signed in |
| 5 | Start, then a second tab from `page.context().newPage()` goes to `/members` | Lands on the kiosk |
| 6 | Start, then `browser.newContext()` signs in with the same account and opens `/members` | Members list shows; the first page is still locked |
| 7 | Visit `/members`, then `/attendance`, click Attendance Mode, Start, `page.goBack()` | Ends on the kiosk; no members table visible |
| 8 | Start, five wrong exit passwords, then the right one | Sixth attempt shows "Too many wrong passwords"; still locked |
| 9 | Start, exit with the right password, open `/members` | `/attendance` after exit; members list shows |

Run (parallel workers make this dev server flaky, so use one):

```bash
bunx playwright test e2e/kiosk-lock.spec.ts e2e/attendance.spec.ts e2e/attendance-time-zone.spec.ts --workers=1
```

### Step 14: documentation

- `docs/attendance-module.md` section 4: rewrite "Opening it" and "Leaving"
  for the Start screen, the per-device lock, the throttle, and how to recover
  a tablet whose password is forgotten (clear the site's cookies on the
  tablet; that signs it out, and the lock row is removed with the session).
  The section calls the button "Staff"; it is "Exit".
- `src/lib/access/permissions.ts`: hint for `attendance.kiosk` becomes
  "Lock this device to the self check-in screen".
- Delete this plan file, or mark it built, in the same pull request.

## 6. Done means

```bash
bun run typecheck
```

```bash
bun run lint
```

```bash
bun run test:storybook
```

plus the Playwright command in step 13, all passing. Then check by hand in the
browser: start Attendance Mode, type `/members` in the address bar, and confirm
you are back on the check-in screen.

## 7. Out of scope

- Seeing or ending a tablet's Attendance Mode from another device.
- A PIN instead of the staff password.
- Device-level pinning (iPad Guided Access, Android screen pinning). Worth
  turning on at the branch, but it is a setting on the tablet, not code.
