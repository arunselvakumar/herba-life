import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, screen, waitFor } from "storybook/test";
import { ChangePasswordDialog } from "@/components/app/change-password-dialog";
import { changeOwnPassword } from "@/lib/access/actions";

// The dialog renders in a portal, so every query goes through `screen`.
const meta = {
  title: "App/ChangePasswordDialog",
  component: ChangePasswordDialog,
  parameters: { layout: "centered" },
  args: { open: true, onOpenChange: fn() },
} satisfies Meta<typeof ChangePasswordDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  play: async () => {
    await expect(await screen.findByRole("dialog", { name: "Change password" })).toBeVisible();
    await expect(screen.getByLabelText("New password")).toHaveFocus();
  },
};

/** The two entries don't match: the error sits under the second field. */
export const PasswordsDontMatch: Story = {
  beforeEach: () => {
    mocked(changeOwnPassword).mockResolvedValue({
      status: "error",
      errors: { confirmPassword: ["The two passwords do not match."] },
    });
  },
  play: async ({ userEvent }) => {
    await userEvent.type(await screen.findByLabelText("New password"), "sunrise-2026");
    await userEvent.type(screen.getByLabelText("Re-enter new password"), "sunrise-2025");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await expect(await screen.findByRole("alert")).toHaveTextContent("The two passwords do not match.");
    await expect(screen.getByLabelText("Re-enter new password")).toHaveAttribute("aria-invalid", "true");
  },
};

/** Too short: the hint stays and the error appears under the field. */
export const TooShort: Story = {
  beforeEach: () => {
    mocked(changeOwnPassword).mockResolvedValue({
      status: "error",
      errors: { password: ["Use at least 8 characters."] },
    });
  },
  play: async ({ userEvent }) => {
    await userEvent.type(await screen.findByLabelText("New password"), "short");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await expect(await screen.findByRole("alert")).toHaveTextContent("Use at least 8 characters.");
  },
};

/** A failure that isn't about a field, shown above the form. */
export const ServerError: Story = {
  beforeEach: () => {
    mocked(changeOwnPassword).mockResolvedValue({
      status: "error",
      message: "Could not change the password. Try again.",
      errors: {},
    });
  },
  play: async ({ userEvent }) => {
    await userEvent.type(await screen.findByLabelText("New password"), "sunrise-2026");
    await userEvent.type(screen.getByLabelText("Re-enter new password"), "sunrise-2026");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await expect(await screen.findByText("Could not change the password. Try again.")).toBeVisible();
  },
};

/** Saved: a confirmation, then the dialog closes itself after a moment. */
export const Success: Story = {
  beforeEach: () => {
    mocked(changeOwnPassword).mockResolvedValue({ status: "success", message: "Password changed." });
  },
  play: async ({ args, userEvent }) => {
    await userEvent.type(await screen.findByLabelText("New password"), "sunrise-2026");
    await userEvent.type(screen.getByLabelText("Re-enter new password"), "sunrise-2026");
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await expect(await screen.findByRole("status")).toHaveTextContent("Password changed.");
    await expect(changeOwnPassword).toHaveBeenCalledTimes(1);
    const formData = mocked(changeOwnPassword).mock.calls[0]?.[1];
    await expect(formData?.get("password")).toBe("sunrise-2026");
    await waitFor(() => expect(args.onOpenChange).toHaveBeenCalledWith(false), { timeout: 3000 });
  },
};
