import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/nextjs-vite";
import tailwindcss from "@tailwindcss/vite";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const stub = (file: string) => path.join(dirname, "stubs", file);

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs", "@storybook/addon-vitest"],
  framework: "@storybook/nextjs-vite",
  staticDirs: ["../public"],
  features: {
    // Renders async server components (pages, HeaderUser, MemberAttendance,
    // MemberPurchases) in the browser. Their data comes from the mocked
    // `queries` and `session` modules registered in preview.tsx.
    experimentalRSC: true,
  },
  async viteFinal(config) {
    const { mergeConfig } = await import("vite");
    return mergeConfig(config, {
      // globals.css is Tailwind v4; the app compiles it with
      // @tailwindcss/turbopack, Storybook needs the Vite plugin.
      plugins: [tailwindcss()],
      resolve: {
        alias: [
          // Server-only guards would throw in the browser. Every module that
          // imports them is mocked, so the guard itself can be a no-op.
          { find: /^server-only$/, replacement: stub("empty.ts") },
          { find: /^next\/server$/, replacement: stub("next-server.ts") },
          { find: /^next\/cache$/, replacement: stub("next-cache.ts") },
        ],
      },
    });
  },
};

export default config;
