import type { Decorator } from "@storybook/nextjs-vite";
import AppLayout from "@/app/(app)/layout";
import KioskLayout from "@/app/(kiosk)/layout";

/**
 * Paints the story on ink. Use this rather than the backgrounds toolbar for
 * white-on-dark stories: the accessibility check measures contrast against
 * the real element behind the text, and the toolbar colour isn't one.
 */
export const onInk: Decorator = (Story) => (
  <div className="rounded-3xl bg-primary p-8 text-primary-foreground">
    <Story />
  </div>
);

/** Constrains the story to a fixed width, the way a page column would. */
export function frame(width: "sm" | "md" | "lg" | "xl" = "md"): Decorator {
  const max = { sm: "max-w-sm", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" }[width];
  const Frame: Decorator = (Story) => (
    <div className={`w-full ${max}`}>
      <Story />
    </div>
  );
  return Frame;
}

/** A white card around the story, like the console's `.surface`. */
export const onSurface: Decorator = (Story) => (
  <div className="surface p-6">
    <Story />
  </div>
);

/**
 * The signed-in console around a screen story: the real `(app)/layout.tsx`,
 * with its header, navigation and background. The header reads the session
 * mock, so `mocked(getCurrentUser)` changes the nav and user menu too.
 */
export const withAppShell: Decorator = (Story) => (
  <AppLayout params={Promise.resolve({})}>
    <Story />
  </AppLayout>
);

/** The kiosk tablet chrome: the real `(kiosk)/layout.tsx`. */
export const withKioskShell: Decorator = (Story) => (
  <KioskLayout params={Promise.resolve({})}>
    <Story />
  </KioskLayout>
);
