import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect } from "storybook/test";
import { CheckRow, HabitsSection, HealthSection } from "@/components/members/record-sections";
import { idleState, makeValueReader } from "@/lib/members/form-state";
import { memberToDefaults } from "@/lib/members/form-defaults";
import { memberWithHealth } from "@/stories/fixtures/members";

const empty = makeValueReader(idleState, {});
const filled = makeValueReader(idleState, memberToDefaults(memberWithHealth));

const meta = {
  title: "Members/RecordSections",
  component: HabitsSection,
  tags: ["autodocs"],
  args: { read: empty, errors: {} },
} satisfies Meta<typeof HabitsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Habits: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("A typical day, as the person describes it.")).toBeVisible();
    await expect(canvas.getByLabelText("Wake up")).toHaveAttribute("placeholder", "6:30 am");
  },
};

export const HabitsFilled: Story = {
  args: { read: filled, description: "A typical day, as the member describes it." },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Breakfast")).toHaveValue("Idli, sambar");
    await expect(canvas.getByLabelText("Diet")).toHaveValue("veg");
  },
};

export const HabitsErrors: Story = {
  args: { errors: { waterIntake: ["Keep this under 100 characters."] } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Keep this under 100 characters.")).toBeVisible();
  },
};

export const Health: Story = {
  render: (args) => <HealthSection {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.queryByText("Where is the pain?")).toBeNull();
  },
};

/** Conditions, complaints and the pain areas they open. */
export const HealthFilled: Story = {
  args: { read: filled },
  render: (args) => <HealthSection {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("checkbox", { name: "Blood pressure" })).toBeChecked();
    await expect(canvas.getByRole("checkbox", { name: "Cardiac" })).not.toBeChecked();
    await expect(canvas.getByRole("checkbox", { name: "Back" })).toBeChecked();
    await expect(canvas.getByLabelText("Any medicine")).toHaveValue(memberWithHealth.medicines);
  },
};

/** Ticking "Pain" asks where; unticking hides the question again. */
export const PainAreas: Story = {
  render: (args) => <HealthSection {...args} />,
  play: async ({ canvas, userEvent }) => {
    const pain = canvas.getByRole("checkbox", { name: "Pain" });
    await userEvent.click(pain);
    await expect(canvas.getByText("Where is the pain?")).toBeVisible();
    await userEvent.click(canvas.getByRole("checkbox", { name: "Knee" }));
    await expect(canvas.getByRole("checkbox", { name: "Knee" })).toBeChecked();
    await userEvent.click(pain);
    await expect(canvas.queryByText("Where is the pain?")).toBeNull();
  },
};

export const HealthErrors: Story = {
  args: { errors: { medicines: ["Keep this under 500 characters."] } },
  render: (args) => <HealthSection {...args} />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Keep this under 500 characters.")).toBeVisible();
  },
};

function ControlledCheckRow() {
  const [checked, setChecked] = useState(false);
  return <CheckRow name="symptoms[]" value="headache" label="Headache" checked={checked} onCheckedChange={setChecked} />;
}

/** One labelled checkbox: uncontrolled (with a default) or controlled. */
export const CheckRows: Story = {
  render: () => (
    <div className="surface space-y-2 p-6">
      <CheckRow name="hasBloodPressure" label="Blood pressure" defaultChecked />
      <CheckRow name="hasSugar" label="Sugar / diabetes" />
      <ControlledCheckRow />
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole("checkbox", { name: "Blood pressure" })).toBeChecked();
    await userEvent.click(canvas.getByText("Sugar / diabetes"));
    await expect(canvas.getByRole("checkbox", { name: "Sugar / diabetes" })).toBeChecked();
    await userEvent.click(canvas.getByText("Headache"));
    await expect(canvas.getByRole("checkbox", { name: "Headache" })).toBeChecked();
  },
};
