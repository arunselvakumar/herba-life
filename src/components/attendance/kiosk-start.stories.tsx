import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { getRouter } from "@storybook/nextjs-vite/navigation.mock";
import { expect, mocked, waitFor } from "storybook/test";
import { KioskStart } from "@/components/attendance/kiosk-start";
import { startKioskMode } from "@/lib/attendance/actions";
import { hardNavigate, hardReplace } from "@/lib/hard-navigate";
import { withKioskShell } from "@/stories/decorators";
import { frontDeskUser } from "@/stories/fixtures/users";

// The step before the kiosk, inside the real kiosk layout.
const meta = {
  title: "Attendance/KioskStart",
  component: KioskStart,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    nextjs: { navigation: { pathname: "/attendance/kiosk" } },
  },
  globals: { viewport: { value: "tablet" } },
  decorators: [withKioskShell],
  args: { staffName: frontDeskUser.name },
} satisfies Meta<typeof KioskStart>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "Start Attendance Mode" })).toBeVisible();
    await expect(canvas.getByText(frontDeskUser.name)).toBeVisible();
    await expect(canvas.getByText(/Other devices you are signed in on are not affected/)).toBeVisible();
  },
};

/**
 * Locks this device, then reloads the kiosk. The story's document was not
 * loaded at the kiosk URL, so it takes the full page load rather than a refresh.
 */
export const Start: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Start" }));
    await expect(startKioskMode).toHaveBeenCalledOnce();
    await waitFor(() => expect(hardReplace).toHaveBeenCalledWith("/attendance/kiosk"));
    await expect(getRouter().refresh).not.toHaveBeenCalled();
  },
};

/** Holds `startKioskMode` open until the story lets it go. */
let finishStarting: () => void = () => {};

/** While the lock is being written, neither button can be pressed again. */
export const Starting: Story = {
  beforeEach: () => {
    mocked(startKioskMode).mockImplementation(() => new Promise<{ ok: true }>((resolve) => (finishStarting = () => resolve({ ok: true }))));
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Start" }));
    await waitFor(() => expect(canvas.getByRole("button", { name: "Start" })).toBeDisabled());
    await expect(canvas.getByRole("button", { name: "Go back" })).toBeDisabled();
    // Let it finish: React ties later transitions to one still running, which
    // would leave the next story's buttons disabled.
    finishStarting();
    await waitFor(() => expect(hardReplace).toHaveBeenCalledWith("/attendance/kiosk"));
  },
};

export const StartFails: Story = {
  beforeEach: () => {
    mocked(startKioskMode).mockRejectedValue(new Error("Database unavailable"));
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Start" }));
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Attendance Mode could not be started. Try again.");
    await expect(hardReplace).not.toHaveBeenCalled();
    await waitFor(() => expect(canvas.getByRole("button", { name: "Start" })).toBeEnabled());
  },
};

export const GoBack: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Go back" }));
    await expect(hardNavigate).toHaveBeenCalledWith("/");
    await expect(startKioskMode).not.toHaveBeenCalled();
  },
};

export const Phone: Story = { globals: { viewport: { value: "mobile" } } };
