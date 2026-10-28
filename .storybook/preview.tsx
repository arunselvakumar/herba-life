import type { Preview } from "@storybook/nextjs-vite";
import "../src/app/globals.css";

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
        linen: { name: "Linen", value: "#f9f8f4" },
        white: { name: "White", value: "#ffffff" },
        ink: { name: "Ink", value: "#111111" },
      },
    },
    a11y: {
      test: "todo",
    },
  },
  initialGlobals: {
    backgrounds: { value: "linen" },
  },
};

export default preview;
