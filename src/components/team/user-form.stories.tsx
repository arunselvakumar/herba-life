import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, waitFor } from "storybook/test";
import { UserForm } from "@/components/team/user-form";
import type { FormAction } from "@/lib/members/form-state";
import { frame } from "@/stories/decorators";
import { ADMIN_ROLE_ID, COACH_ROLE_ID, FRONT_DESK_ROLE_ID, roleOptions } from "@/stories/fixtures/team";
import { frontDeskUser } from "@/stories/fixtures/users";

const save = fn<FormAction>(async () => ({ status: "success", message: "Saved." })).mockName("saveUser");

const meta = {
  title: "Team/UserForm",
  component: UserForm,
  parameters: { layout: "padded" },
  decorators: [frame("xl")],
  args: {
    action: save,
    defaults: { roleId: FRONT_DESK_ROLE_ID },
    roles: roleOptions,
    mode: "create",
    submitLabel: "Create user",
  },
} satisfies Meta<typeof UserForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The role defaults to the first staff role, and its description shows under the pick-list. */
export const Create: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Role")).toHaveValue(FRONT_DESK_ROLE_ID);
    await expect(canvas.getByText("Greets members, records visits and sells products.")).toBeVisible();
  },
};

/** "Generate" fills a readable password and shows it so it can be shared. */
export const GeneratePassword: Story = {
  play: async ({ canvas, userEvent }) => {
    const password = canvas.getByLabelText("Password");
    await userEvent.click(canvas.getByRole("button", { name: "Generate" }));
    await expect(password).toHaveAttribute("type", "text");
    await expect((password as HTMLInputElement).value).toMatch(/^[A-HJ-NP-Za-km-z2-9]{14}$/);
  },
};

export const Edit: Story = {
  args: {
    mode: "edit",
    defaults: { name: frontDeskUser.name, email: frontDeskUser.email, roleId: FRONT_DESK_ROLE_ID },
    submitLabel: "Save changes",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("New password")).toHaveAttribute("placeholder", "Leave blank to keep the current one");
  },
};

/** Your own account: the role is shown, but only another administrator can change it. */
export const EditingSelf: Story = {
  args: {
    mode: "edit",
    isSelf: true,
    defaults: { name: "Arun Selva Kumar", email: "arun@herbalife.test", roleId: ADMIN_ROLE_ID },
    submitLabel: "Save changes",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Role")).toBeDisabled();
    await expect(canvas.getByText("ask another administrator to change yours")).toBeVisible();
  },
};

/** The server rejects the form: the message shows on top and what was typed stays. */
export const Errors: Story = {
  beforeEach: () => {
    mocked(save).mockResolvedValue({
      status: "error",
      message: "Please check the highlighted fields.",
      errors: { email: ["Someone already signs in with this email."], password: ["Use at least 8 characters."] },
    });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Name"), "Divya Krishnan");
    await userEvent.type(canvas.getByLabelText("Email"), "divya@herbalife.test");
    await userEvent.selectOptions(canvas.getByLabelText("Role"), COACH_ROLE_ID);
    await userEvent.type(canvas.getByLabelText("Password"), "short");
    await userEvent.click(canvas.getByRole("button", { name: "Create user" }));
    await expect(await canvas.findByText("Please check the highlighted fields.")).toBeVisible();
    await expect(canvas.getByText("Someone already signs in with this email.")).toBeVisible();
    await expect(canvas.getByText("Use at least 8 characters.")).toBeVisible();
    await expect(canvas.getByLabelText("Name")).toHaveValue("Divya Krishnan");
    const formData = mocked(save).mock.calls[0]?.[1];
    await expect(formData?.get("roleId")).toBe(COACH_ROLE_ID);
  },
};

export const Submit: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Name"), "Divya Krishnan");
    await userEvent.type(canvas.getByLabelText("Email"), "divya@herbalife.test");
    await userEvent.type(canvas.getByLabelText("Password"), "sunrise-2026");
    await userEvent.click(canvas.getByRole("button", { name: "Create user" }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    const formData = mocked(save).mock.calls[0]?.[1];
    await expect(formData?.get("email")).toBe("divya@herbalife.test");
    await expect(formData?.get("roleId")).toBe(FRONT_DESK_ROLE_ID);
  },
};
