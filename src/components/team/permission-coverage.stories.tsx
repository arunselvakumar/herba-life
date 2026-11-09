import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { PermissionCoverage } from "@/components/team/permission-coverage";
import { ALL_PERMISSIONS } from "@/lib/access/permissions";
import { onSurface } from "@/stories/decorators";
import { coachRole, frontDeskRole } from "@/stories/fixtures/team";
import { fullCheck, knownIssues } from "@/stories/a11y";

// Shown in the roles table, on a white card.
const meta = {
  title: "Team/PermissionCoverage",
  component: PermissionCoverage,
  parameters: {
    layout: "padded",
    // Known issue: PermissionCoverage's "none" chips (a module the role has no
    // permission in) draw their label in text-muted-foreground/60 on white:
    // #a6a6a4 on #ffffff, 2.43:1 against the 4.5:1 AA minimum (color-contrast).
    // The faded, struck-through chip is the design's "not allowed" signal, so
    // raising it is a design call; stories without such chips keep the check on.
    a11y: knownIssues("color-contrast"),
  },
  tags: ["autodocs"],
  decorators: [onSurface],
  globals: { viewport: { value: "desktop" } },
  args: { permissions: frontDeskRole.permissions },
} satisfies Meta<typeof PermissionCoverage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every module struck through. */
export const None: Story = {
  args: { permissions: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByTitle("Members: 0 of 7 allowed")).toBeVisible();
  },
};

/** Front desk: part of most modules, all of the dashboard, none of the team. */
export const Partial: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByTitle("Dashboard: 1 of 1 allowed")).toBeVisible();
    await expect(canvas.getByTitle("Members: 2 of 7 allowed")).toHaveTextContent("2/7");
    await expect(canvas.getByTitle("Users: 0 of 5 allowed")).toBeVisible();
  },
};

export const Coach: Story = { args: { permissions: coachRole.permissions } };

/** Every chip in ink: no faded chips, so the accessibility check stays on. */
export const All: Story = {
  args: { permissions: [...ALL_PERMISSIONS] },
  parameters: { a11y: fullCheck },
};
