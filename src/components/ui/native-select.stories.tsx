import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "@/components/ui/native-select";

const meta = {
  title: "UI/NativeSelect",
  component: NativeSelect,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  args: { "aria-label": "Package", defaultValue: "3m", className: "w-60", onChange: fn() },
  argTypes: {
    size: { control: "radio", options: ["default", "sm"] },
  },
  render: (args) => (
    <NativeSelect {...args}>
      <NativeSelectOption value="1m">1 month</NativeSelectOption>
      <NativeSelectOption value="3m">3 months</NativeSelectOption>
      <NativeSelectOption value="6m">6 months</NativeSelectOption>
      <NativeSelectOption value="12m">12 months</NativeSelectOption>
    </NativeSelect>
  ),
} satisfies Meta<typeof NativeSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const select = canvas.getByRole("combobox", { name: "Package" });
    await expect(select).toHaveValue("3m");
    await userEvent.selectOptions(select, "6 months");
    await expect(select).toHaveValue("6m");
    await expect(args.onChange).toHaveBeenCalledOnce();
  },
};

export const Small: Story = { args: { size: "sm", className: "w-40" } };

export const WithLabel: Story = {
  render: (args) => (
    <div className="grid gap-2">
      <Label htmlFor="plan">Package</Label>
      <NativeSelect {...args} id="plan" aria-label={undefined}>
        <NativeSelectOption value="">Choose a package</NativeSelectOption>
        <NativeSelectOption value="3m">3 months</NativeSelectOption>
        <NativeSelectOption value="6m">6 months</NativeSelectOption>
      </NativeSelect>
    </div>
  ),
};

export const Invalid: Story = {
  args: { "aria-invalid": true, defaultValue: "" },
  render: (args) => (
    <div className="grid gap-2">
      <Label htmlFor="plan-invalid">Package</Label>
      <NativeSelect {...args} id="plan-invalid" aria-label={undefined} aria-describedby="plan-error">
        <NativeSelectOption value="">Choose a package</NativeSelectOption>
        <NativeSelectOption value="3m">3 months</NativeSelectOption>
      </NativeSelect>
      <p id="plan-error" className="text-xs text-destructive">
        Choose a package.
      </p>
    </div>
  ),
};

export const Disabled: Story = { args: { disabled: true } };

export const WithGroups: Story = {
  args: { "aria-label": "Product", defaultValue: "f1-vanilla" },
  render: (args) => (
    <NativeSelect {...args}>
      <NativeSelectOptGroup label="Shakes">
        <NativeSelectOption value="f1-vanilla">Formula 1, Vanilla</NativeSelectOption>
        <NativeSelectOption value="f1-chocolate">Formula 1, Chocolate</NativeSelectOption>
      </NativeSelectOptGroup>
      <NativeSelectOptGroup label="Tea">
        <NativeSelectOption value="tea-lemon">Afresh, Lemon</NativeSelectOption>
      </NativeSelectOptGroup>
    </NativeSelect>
  ),
};
