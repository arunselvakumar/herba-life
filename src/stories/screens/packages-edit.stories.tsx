import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, waitFor } from "storybook/test";
import EditPackagePage from "@/app/(app)/packages/[id]/edit/page";
import { updatePlan } from "@/lib/packages/actions";
import { getPlan } from "@/lib/packages/queries";
import { getCurrentUser } from "@/lib/session";
import { withAppShell } from "@/stories/decorators";
import { plans } from "@/stories/fixtures/members";
import { frontDeskUser } from "@/stories/fixtures/users";

const plan = plans[1]!;

const meta = {
  title: "Screens/Packages/Edit",
  component: EditPackagePage,
  parameters: { layout: "fullscreen", nextjs: { navigation: { pathname: `/packages/${plan.id}/edit` } } },
  decorators: [withAppShell],
  args: { params: Promise.resolve({ id: plan.id }), searchParams: Promise.resolve({}) },
  beforeEach: () => {
    mocked(getPlan).mockResolvedValue(plan);
  },
} satisfies Meta<typeof EditPackagePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { level: 1, name: `Edit ${plan.name}` })).toBeVisible();
    await expect(canvas.getByLabelText("Name")).toHaveValue(plan.name);
    await expect(canvas.getByLabelText("Price")).toHaveValue(plan.price);
    await expect(getPlan).toHaveBeenCalledWith(plan.id);
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile" } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { level: 1, name: `Edit ${plan.name}` })).toBeVisible();
  },
};

/** A plan without a price or description: the fields start empty. */
export const NoPrice: Story = {
  beforeEach: () => {
    mocked(getPlan).mockResolvedValue({ ...plans[3]!, price: null });
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("heading", { level: 1, name: "Edit Trial week" })).toBeVisible();
    await expect(canvas.getByLabelText("Price")).toHaveValue(null);
    await expect(canvas.getByLabelText("Description")).toHaveValue("");
  },
};

export const Save: Story = {
  play: async ({ canvas, userEvent }) => {
    const price = await canvas.findByLabelText("Price");
    await userEvent.clear(price);
    await userEvent.type(price, "9500");
    await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(updatePlan).toHaveBeenCalledOnce());
    const [id, , data] = mocked(updatePlan).mock.calls[0]!;
    await expect(id).toBe(plan.id);
    await expect(data instanceof FormData && data.get("price")).toBe("9500");
  },
};

export const NoAccess: Story = {
  beforeEach: () => {
    mocked(getCurrentUser).mockResolvedValue(frontDeskUser);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("You do not have access to this")).toBeVisible();
  },
};
