import type { Preview } from "@storybook/nextjs-vite";
import { JetBrains_Mono, Urbanist } from "next/font/google";
import { sb } from "storybook/test";
import { TooltipProvider } from "../src/components/ui/tooltip";
import { baseA11yRules } from "../src/stories/a11y";
import { shiftClock } from "../src/stories/clock";
import { NOW } from "../src/stories/fixtures/time";
import "../src/app/globals.css";

// The root layout puts the font variables on <html>; stories don't render it,
// so do the same here or every story falls back to system fonts.
const sans = Urbanist({ variable: "--font-sans", subsets: ["latin"], display: "swap" });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"], display: "swap" });
document.documentElement.classList.add(sans.variable, mono.variable);

// In automated runs (the Vitest/Playwright tests set navigator.webdriver),
// turn CSS keyframe animations off. Radix then opens and closes dialogs,
// menus and popovers at once instead of after an enter/exit animation, so
// visibility assertions don't depend on machine load. GSAP motion is already
// off there via prefers-reduced-motion. Storybook in a normal browser keeps
// every animation.
if (navigator.webdriver) {
  const style = document.createElement("style");
  style.dataset.storybookTests = "no-animations";
  style.textContent = "*, *::before, *::after { animation-name: none !important; transition-duration: 0s !important; }";
  document.head.appendChild(style);
}

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

// Full page loads (into and out of Attendance Mode) would unload the story.
sb.mock(import("../src/lib/hard-navigate.ts"));

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
      // Shared overrides; see src/stories/a11y.ts.
      config: { rules: baseA11yRules },
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
