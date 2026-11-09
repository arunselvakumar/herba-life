import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { getRouter } from "@storybook/nextjs-vite/navigation.mock";
import { expect, mocked, waitFor, within } from "storybook/test";
import { KioskExit } from "@/components/attendance/kiosk-exit";
import { verifyExitPassword } from "@/lib/attendance/actions";
import { onInk } from "@/stories/decorators";
import { frontDeskUser } from "@/stories/fixtures/users";

// The trigger is white on the kiosk's dark header.
const meta = {
  title: "Attendance/KioskExit",
  component: KioskExit,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [onInk],
  args: { staffName: frontDeskUser.name },
} satisfies Meta<typeof KioskExit>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Open: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Exit" }));
    const dialog = within(document.body).getByRole("dialog", { name: "Leave Attendance Mode" });
    await waitFor(() => expect(within(dialog).getByText(frontDeskUser.name)).toBeVisible());
    // Nothing typed yet, so there is nothing to submit.
    await expect(within(dialog).getByRole("button", { name: "Exit" })).toBeDisabled();
  },
};

export const CorrectPassword: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Exit" }));
    const dialog = within(document.body).getByRole("dialog", { name: "Leave Attendance Mode" });
    await userEvent.type(within(dialog).getByLabelText("Password"), "counter-2026");
    await userEvent.click(within(dialog).getByRole("button", { name: "Exit" }));
    await expect(verifyExitPassword).toHaveBeenCalledWith("counter-2026");
    await waitFor(() => expect(getRouter().push).toHaveBeenCalledWith("/attendance"));
  },
};

export const WrongPassword: Story = {
  beforeEach: () => {
    mocked(verifyExitPassword).mockResolvedValue({ ok: false });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Exit" }));
    const dialog = within(document.body).getByRole("dialog", { name: "Leave Attendance Mode" });
    const input = within(dialog).getByLabelText("Password");
    await userEvent.type(input, "wrong");
    await userEvent.click(within(dialog).getByRole("button", { name: "Exit" }));
    await expect(await within(dialog).findByRole("alert")).toHaveTextContent("That password is not right. Try again.");
    await expect(input).toHaveValue("");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(getRouter().push).not.toHaveBeenCalled();
  },
};

export const Stay: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Exit" }));
    const dialog = within(document.body).getByRole("dialog", { name: "Leave Attendance Mode" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Stay" }));
    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    await expect(verifyExitPassword).not.toHaveBeenCalled();
  },
};
