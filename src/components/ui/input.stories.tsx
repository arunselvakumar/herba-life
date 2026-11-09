import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const meta = {
  title: "UI/Input",
  component: Input,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { placeholder: "you@herbalife.com", className: "w-72 bg-card" },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithLabel: Story = {
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" {...args} />
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const field = canvas.getByRole("textbox", { name: "Email" });
    await userEvent.type(field, "meena@herbalife.test");
    await expect(field).toHaveValue("meena@herbalife.test");
  },
};

export const Invalid: Story = {
  args: { "aria-invalid": true, "aria-describedby": "email-error", defaultValue: "not-an-email" },
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="email-invalid">Email</Label>
      <Input id="email-invalid" type="email" {...args} />
      <p id="email-error" className="text-xs text-destructive">
        Enter an email like name@example.com.
      </p>
    </div>
  ),
};

export const Disabled: Story = { args: { disabled: true, defaultValue: "Disabled" } };

export const NumberInput: Story = {
  name: "Number",
  args: { type: "number", placeholder: "72.4", inputMode: "decimal", step: 0.1, "aria-label": "Weight in kg" },
};

export const FileInput: Story = {
  name: "File",
  args: { placeholder: undefined },
  render: (args) => (
    <div className="space-y-2">
      <Label htmlFor="photo">Member photo</Label>
      <Input id="photo" type="file" accept="image/*" {...args} />
    </div>
  ),
};
