import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Every story runs as a test in headless Chromium: it must render, its `play`
// function must pass, and it must have no accessibility violations
// (preview.tsx sets `a11y.test` to "error"). CI runs this on every PR.
export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        plugins: [storybookTest({ configDir: path.join(dirname, ".storybook") })],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              contextOptions: {
                // The studio runs on India time; fixtures are written for it.
                timezoneId: "Asia/Kolkata",
                locale: "en-IN",
                // GSAP and the canvas backgrounds honour this, so renders
                // and assertions don't depend on animation timing.
                reducedMotion: "reduce",
              },
            }),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
