import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import LoginPage from "@/app/login/page";

// The sign-in page sits outside the console shell: no header, no session.
const meta = {
  title: "Screens/Login",
  component: LoginPage,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: "/login" } } },
  globals: { viewport: { value: "desktop" } },
} satisfies Meta<typeof LoginPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The brand panel with the beams on the left, the form on the right. */
export const Desktop: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { name: "Make wellness a movement." })).toBeVisible();
    await expect(await canvas.findByRole("heading", { name: "Sign in to your account" })).toBeVisible();
    await expect(await canvas.findByLabelText("Email")).toBeVisible();
  },
};

/** The brand panel is dropped; the logo mark sits above the form. */
export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { name: "Sign in to your account" })).toBeVisible();
    await expect(canvas.queryByRole("heading", { name: "Make wellness a movement." })).toBeNull();
  },
};

/** Sent back here after an administrator suspended the account. */
export const Suspended: Story = {
  parameters: { nextjs: { navigation: { pathname: "/login", query: { reason: "suspended" } } } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByTestId("login-error")).toHaveTextContent("Your account has been suspended");
  },
};
