import type { Preview } from "@storybook/nextjs-vite";
import { sb } from "storybook/test";
import { TooltipProvider } from "../src/components/ui/tooltip";
import { shiftClock } from "../src/stories/clock";
import { NOW } from "../src/stories/fixtures/time";
import "../src/app/globals.css";

// ---------------------------------------------------------------------------
// Module mocks. Each one is swapped for the file of the same name in the
// `__mocks__/` folder next to it, so no database, Better Auth or `server-only`
// code reaches the browser. Stories override a mock with `mocked(fn)`.
// ---------------------------------------------------------------------------

// Server actions: spies that resolve to a success state.
sb.mock(import("../src/lib/access/actions.ts"));
sb.mock(import("../src/lib/attendance/actions.ts"));
sb.mock(import("../src/lib/attendance/calendar-actions.ts"));
sb.mock(import("../src/lib/inquiries/actions.ts"));
sb.mock(import("../src/lib/members/actions.ts"));
sb.mock(import("../src/lib/packages/actions.ts"));
sb.mock(import("../src/lib/stock/actions.ts"));

// Auth: signed in as the administrator; sign-in and sign-out are spies.
sb.mock(import("../src/lib/session.ts"));
sb.mock(import("../src/lib/auth-client.ts"));

// Reads used by server components and screens: each story sets its data.
sb.mock(import("../src/lib/access/queries.ts"));
sb.mock(import("../src/lib/attendance/queries.ts"));
sb.mock(import("../src/lib/attendance/calendar.ts"));
sb.mock(import("../src/lib/inquiries/queries.ts"));
sb.mock(import("../src/lib/members/queries.ts"));
sb.mock(import("../src/lib/packages/queries.ts"));
sb.mock(import("../src/lib/stock/queries.ts"));
sb.mock(import("../src/lib/export/build.ts"));

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      options: {
        canvas: { name: "Canvas", value: "#efeeec" },
        linen: { name: "Linen", value: "#f9f8f4" },
        white: { name: "White", value: "#ffffff" },
        ink: { name: "Ink", value: "#111111" },
      },
    },
    viewport: {
      options: {
        mobile: { name: "Mobile", styles: { width: "375px", height: "812px" }, type: "mobile" },
        tablet: { name: "Tablet", styles: { width: "768px", height: "1024px" }, type: "tablet" },
        desktop: { name: "Desktop", styles: { width: "1440px", height: "900px" }, type: "desktop" },
      },
    },
    nextjs: { appDirectory: true },
    // Accessibility violations fail the story's test (and CI). A story that
    // needs an exception sets `parameters.a11y.test = "todo"` and says why.
    a11y: {
      test: "error",
      // WCAG 2.2 A and AA: the compliance bar. axe's "best-practice" rules
      // are advisory and stay visible in the Accessibility panel only.
      options: {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"] },
      },
      config: {
        rules: [
          {
            // Known issue, on every screen: the header's logo link and the
            // account button have aria-labels that don't contain their visible
            // text (WCAG 2.5.3). Excluded by element so the rule still guards
            // everything else; remove the exclusions once those labels change.
            id: "label-content-name-mismatch",
            selector: '*:not([data-testid="user-menu-trigger"]):not([aria-label="Herbalife, go to the overview"])',
          },
        ],
      },
    },
  },
  // Fixtures are written for 9 Nov 2026, 10:30 India time; start the clock there.
  beforeEach: () => shiftClock(NOW),
  initialGlobals: {
    backgrounds: { value: "canvas" },
  },
  decorators: [
    (Story) => (
      <TooltipProvider delayDuration={0}>
        <Story />
      </TooltipProvider>
    ),
  ],
};

export default preview;
