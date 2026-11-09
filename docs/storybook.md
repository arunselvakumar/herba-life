# Storybook

Every component and screen has stories, and every story is a test. CI runs them on each pull request, and a PR can't merge while any of them fail.

```bash
bun run storybook          # dev server on http://localhost:6006
bun run test:storybook     # every story as a test, headless Chromium
bun run build-storybook    # static build, as CI does
```

Run a subset by path: `bun run test:storybook src/components/stock`.

The first time on a machine, install the browser: `bunx playwright install chromium`.

## What a story test checks

Each story becomes a Vitest browser test (`@storybook/addon-vitest`). It fails when:

1. **The story throws** while rendering, or logs a React error.
2. **Its `play` function fails**, for example an `expect` on a mocked action or on visible text.
3. **axe finds a WCAG 2.2 A or AA violation.** The rules are configured in `.storybook/preview.tsx`. Best-practice rules only show in the Accessibility panel.

## Where things live

| Path | What |
| --- | --- |
| `src/components/**/x.stories.tsx` | Component stories, next to the component |
| `src/stories/screens/*.stories.tsx` | Full pages: the real `page.tsx` inside the real layout |
| `src/stories/foundations/` | Colours, type, radius |
| `src/stories/fixtures/` | Typed sample data, one file per module |
| `src/stories/decorators.tsx` | `withAppShell`, `withKioskShell`, `onSurface`, `onInk`, `frame()` |
| `src/lib/**/__mocks__/` | Mocks swapped in for server modules (see below) |
| `.storybook/stubs/` | No-op stand-ins for `server-only`, `next/server`, `next/cache` |

## Writing a story

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, within } from "storybook/test";
import { VoidSaleDialog } from "@/components/stock/void-sale-dialog";
import { voidSale } from "@/lib/stock/actions"; // the mock, not the server action
import { onSurface } from "@/stories/decorators";

const meta = {
  title: "Stock/VoidSaleDialog",     // sidebar folder = component folder
  component: VoidSaleDialog,
  tags: ["autodocs"],
  decorators: [onSurface],
  args: { saleId: "s-1", serialNo: 42 },
} satisfies Meta<typeof VoidSaleDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {};

export const Confirm: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /void/i }));
    // Dialogs render in a portal: query the whole document.
    const dialog = within(document.body).getByRole("dialog");
    // ...
    await expect(voidSale).toHaveBeenCalled();
  },
};
```

Conventions:

- **Titles** follow the folder: `UI/Button`, `Members/MemberTable`, `Screens/Stock/Sales`. Story names describe the state: `Empty`, `ReadOnly`, `ValidationErrors`.
- **One story per meaningful state:** empty, typical, edge case (long names, zero, overdue), permission-limited, error. Don't make one per prop value.
- **Dates come from fixtures.** The clock starts at `NOW`, 9 Nov 2026 10:30 IST. Pass `TODAY` wherever a component takes `today`.
- **Backgrounds are real elements.** Badges, tables and forms sit on cards in the app, so use the `onSurface` decorator. For white-on-dark, use `onInk`, not the backgrounds toolbar: axe measures contrast against real elements only.
- **Interaction:** use `play` with `canvas` and `userEvent` from the story context. Assert on the mocked action (`expect(createSale).toHaveBeenCalled()`) and on what the person sees afterwards.
- **Portals:** dialogs, dropdowns, popovers and tooltips render outside `canvas`. Query them with `within(document.body)` or `screen` from `storybook/test`.
- **Close menus before `play` ends.** An open Radix `DropdownMenu` hides the rest of the page from screen readers, so the accessibility check that runs after `play` fails with `aria-hidden-focus`. A menu left open can also leak into the next story.
- **Opening animations:** dialog content is still animating for a few milliseconds after `findByRole("dialog")` resolves. Wait with `await waitFor(() => expect(dialog).toBeVisible())` before asserting visibility.
- **Strict TypeScript:** `exactOptionalPropertyTypes` is on. Pass props explicitly rather than spreading partial objects with `undefined`.

## Mocks

`.storybook/preview.tsx` registers `sb.mock()` for every server module that client code imports. Each one is replaced by the file of the same name in the `__mocks__/` folder next to it.

| Module | Default in stories |
| --- | --- |
| `@/lib/*/actions`, `@/lib/attendance/calendar-actions` | Spies. Form actions resolve `{ status: "success" }` and void actions resolve `undefined`. |
| `@/lib/session` | Signed in as `adminUser` (every permission) |
| `@/lib/auth-client` | `signIn.email` succeeds; `signOut` is a spy |
| `@/lib/*/queries`, `@/lib/attendance/calendar`, `@/lib/export/build` | **Throw** "not mocked in this story", so set what the story needs |

Override a mock per story or per meta with `beforeEach`:

```tsx
beforeEach: () => {
  mocked(getCurrentUser).mockResolvedValue(frontDeskUser);
  mocked(listSales).mockResolvedValue(sales);
  mocked(createSale).mockResolvedValue({ status: "error", errors: { quantity: ["Only 3 left"] } });
},
```

Spies reset between stories, so an override never leaks into the next one.

**If you add a server action or query,** add it to the module's `__mocks__` file too. The mock is typed with `typeof Actual.fn`, so `tsc` flags a signature that drifts.

## Screens

Screens render the real route component, server components included (`features.experimentalRSC`):

```tsx
import SalesPage from "@/app/(app)/stock/sales/page";

const meta = {
  title: "Screens/Stock/Sales",
  component: SalesPage,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/stock/sales" } } },
  decorators: [withAppShell],
  args: { params: Promise.resolve({}), searchParams: Promise.resolve({}) },
  beforeEach: () => {
    mocked(listSales).mockResolvedValue(sales);
  },
} satisfies Meta<typeof SalesPage>;

export const Desktop: Story = {};
export const Mobile: Story = { globals: { viewport: { value: "mobile" } } };
export const NoAccess: Story = { beforeEach: () => { mocked(getCurrentUser).mockResolvedValue(noRoleUser); } };
```

Dynamic routes get `params: Promise.resolve({ id: "…" })`, and filters get `searchParams: Promise.resolve({ filter: "due" })`. Screens assert in `play` that the page's key content appeared, using `findBy…` because server components resolve asynchronously.

## Accessibility exceptions

Fix the story first: wrong background, missing label in the story's own markup. If the violation comes from the component itself and fixing it needs a design or behaviour change, the story may opt out:

```tsx
parameters: {
  // Known issue: <what, where, the measured ratio>. <Why it isn't fixed here.>
  a11y: { test: "todo" },
},
```

When a single rule is the problem, prefer switching off just that rule, so every other check still runs:

```tsx
parameters: {
  // Known issue: …
  a11y: { config: { rules: [{ id: "label-content-name-mismatch", enabled: false }] } },
},
```

The violation still shows in the Accessibility panel. Every exception must carry that comment, so the exceptions stay reviewable. `grep -rnE 'test: "todo"|enabled: false' src` lists them.
