import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, waitFor } from "storybook/test";
import { RoleForm } from "@/components/team/role-form";
import { ALL_PERMISSIONS, type Permission } from "@/lib/access/permissions";
import type { FormAction } from "@/lib/members/form-state";
import { adminRole, frontDeskRole, teamLeadRole } from "@/stories/fixtures/team";

const save = fn<FormAction>(async () => ({ status: "success", message: "Saved." })).mockName("saveRole");

const meta = {
  title: "Team/RoleForm",
  component: RoleForm,
  parameters: { layout: "padded" },
  globals: { viewport: { value: "desktop" } },
  args: { action: save, defaults: { "permissions[]": ["dashboard.view"] }, submitLabel: "Create role" },
} satisfies Meta<typeof RoleForm>;

export default meta;
type Story = StoryObj<typeof meta>;

const total = ALL_PERMISSIONS.length;

/** A permission tile's checkbox. Labels carry their hint text too, so find it by id. */
function tile(root: HTMLElement, permission: Permission): HTMLElement {
  const el = root.querySelector<HTMLElement>(`#perm-${permission.replace(".", "-")}`);
  if (!el) throw new Error(`No checkbox for ${permission}`);
  return el;
}

/** A new role starts with only the dashboard. */
export const Create: Story = {
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByText(`of ${total} allowed.`, { exact: false })).toHaveTextContent(`1 of ${total} allowed.`);
    await expect(tile(canvasElement, "dashboard.view")).toBeChecked();
  },
};

export const Edit: Story = {
  args: {
    defaults: { name: frontDeskRole.name, description: frontDeskRole.description, "permissions[]": frontDeskRole.permissions },
    submitLabel: "Save changes",
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByLabelText("Name")).toHaveValue("Front desk");
    await expect(tile(canvasElement, "stock.sell")).toBeChecked();
    await expect(tile(canvasElement, "users.create")).not.toBeChecked();
  },
};

/** The built-in Administrator: everything ticked, nothing can change, no Save. */
export const ReadOnlySystemRole: Story = {
  args: {
    defaults: { name: adminRole.name, description: adminRole.description, "permissions[]": adminRole.permissions },
    submitLabel: "Save changes",
    readOnly: true,
  },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByLabelText("Name")).toHaveAttribute("readonly");
    await expect(tile(canvasElement, "roles.delete")).toBeDisabled();
    await expect(canvas.queryByRole("button", { name: "Save changes" })).toBeNull();
    await expect(canvas.getByRole("link", { name: "Back" })).toHaveAttribute("href", "/team/roles");
  },
};

/** Editing your own role: "Update a role" stays on so you can't lock yourself out. */
export const LockedPermission: Story = {
  args: {
    defaults: { name: teamLeadRole.name, description: teamLeadRole.description, "permissions[]": teamLeadRole.permissions },
    submitLabel: "Save changes",
    lockedPermission: "roles.update",
  },
  play: async ({ canvas, canvasElement, userEvent }) => {
    await expect(tile(canvasElement, "roles.update")).toBeDisabled();
    await expect(canvas.getByLabelText("Kept so you keep access to this screen")).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Clear" }));
    await expect(tile(canvasElement, "roles.update")).toBeChecked();
    await expect(tile(canvasElement, "users.view")).not.toBeChecked();
  },
};

/**
 * Ticking an action also ticks (and locks) its module's View; the module
 * circle toggles every action at once.
 */
export const ToggleGroup: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(tile(canvasElement, "stock.receive"));
    await expect(tile(canvasElement, "stock.view")).toBeChecked();
    await expect(tile(canvasElement, "stock.view")).toBeDisabled();

    await userEvent.click(canvas.getByRole("checkbox", { name: "Allow everything in Members" }));
    await expect(tile(canvasElement, "members.delete")).toBeChecked();
    await expect(tile(canvasElement, "members.export")).toBeChecked();

    await userEvent.click(canvas.getByRole("checkbox", { name: "Allow everything in Members" }));
    await expect(tile(canvasElement, "members.view")).not.toBeChecked();

    await userEvent.click(canvas.getByRole("button", { name: "Allow all" }));
    await expect(canvas.getByRole("button", { name: "Allow all" })).toBeDisabled();
  },
};

/** Submits one hidden `permissions[]` field per ticked permission. */
export const Submit: Story = {
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Name"), "Stock keeper");
    await userEvent.click(tile(canvasElement, "stock.sell"));
    await userEvent.click(canvas.getByRole("button", { name: "Create role" }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    const formData = mocked(save).mock.calls[0]?.[1];
    await expect(formData?.get("name")).toBe("Stock keeper");
    await expect(formData?.getAll("permissions[]").sort()).toEqual(["dashboard.view", "stock.sell", "stock.view"]);
  },
};

/** The server rejects it: the first error shows on top and the name is kept. */
export const Errors: Story = {
  beforeEach: () => {
    mocked(save).mockResolvedValue({
      status: "error",
      message: "Please check the form.",
      errors: { name: ["A role with this name already exists."] },
    });
  },
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Name"), "Front desk");
    await userEvent.click(tile(canvasElement, "members.view"));
    await userEvent.click(tile(canvasElement, "stock.sell"));
    await userEvent.click(tile(canvasElement, "dashboard.view"));
    await userEvent.click(canvas.getByRole("button", { name: "Create role" }));
    await expect(await canvas.findByText("A role with this name already exists.")).toBeVisible();
    await expect(canvas.getByLabelText("Name")).toHaveValue("Front desk");

    // React resets the form after the failed submit; the ticks survive it.
    await expect(tile(canvasElement, "members.view")).toBeChecked();
    await expect(tile(canvasElement, "stock.sell")).toBeChecked();
    await expect(tile(canvasElement, "stock.view")).toBeChecked();
    await expect(tile(canvasElement, "dashboard.view")).not.toBeChecked();
    await expect(canvas.getByText(`of ${total} allowed.`, { exact: false })).toHaveTextContent(`3 of ${total} allowed.`);

    // Submitting again posts the same permissions.
    await userEvent.click(canvas.getByRole("button", { name: "Create role" }));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(2));
    const posted = mocked(save).mock.calls.map((call) => call[1].getAll("permissions[]").sort());
    await expect(posted[1]).toEqual(["members.view", "stock.sell", "stock.view"]);
    await expect(posted[1]).toEqual(posted[0]);
  },
};

/** No permissions ticked: the permissions error shows in the banner. */
export const NoPermissionsError: Story = {
  beforeEach: () => {
    mocked(save).mockResolvedValue({
      status: "error",
      errors: { permissions: ["Tick at least one permission."] },
    });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Name"), "Visitor");
    await userEvent.click(canvas.getByRole("button", { name: "Clear" }));
    await userEvent.click(canvas.getByRole("button", { name: "Create role" }));
    await expect(await canvas.findByText("Tick at least one permission.")).toBeVisible();
  },
};
