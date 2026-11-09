import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { Delta, MeasurementValue } from "@/components/members/measurement-value";
import { onSurface } from "@/stories/decorators";

const meta = {
  title: "Members/MeasurementValue",
  component: MeasurementValue,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [onSurface],
  args: { value: 22.4, verdict: "ok" },
} satisfies Meta<typeof MeasurementValue>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OK: Story = {};
export const Low: Story = { args: { value: 1320, verdict: "low", digits: 0 } };
export const High: Story = { args: { value: 31.2, verdict: "high" } };
/** No reference range for this measurement: plain text. */
export const NoVerdict: Story = { args: { value: 38, verdict: null, digits: 0 } };
export const WithUnit: Story = {
  args: { value: 68.4, verdict: null, unit: "kg" },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("kg")).toBeVisible();
  },
};
export const Missing: Story = {
  args: { value: null },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("—")).toBeVisible();
  },
};

/** Change against the previous visit. For weight a drop is good (green), a rise is amber. */
export const DeltaDownAndUp: Story = {
  render: () => (
    <div className="flex flex-col gap-2 text-sm">
      <span>
        <MeasurementValue value={68.4} unit="kg" />
        <Delta current={68.4} previous={70.2} />
      </span>
      <span>
        <MeasurementValue value={71.0} unit="kg" />
        <Delta current={71.0} previous={70.2} />
      </span>
      <span>
        <MeasurementValue value={70.2} unit="kg" />
        <Delta current={70.2} previous={70.2} />
      </span>
    </div>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText("-1.8")).toBeVisible();
    await expect(canvas.getByText("+0.8")).toBeVisible();
    await expect(canvas.getByText("±0")).toBeVisible();
  },
};

/** `invert` for muscle mass, where a rise is the good direction. */
export const DeltaInverted: Story = {
  render: () => (
    <span className="text-sm">
      <MeasurementValue value={27.1} unit="%" />
      <Delta current={27.1} previous={26.5} invert />
    </span>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText("+0.6")).toHaveClass("text-brand-700");
  },
};

/** No previous visit: nothing to compare against. */
export const DeltaNoPrevious: Story = {
  render: () => (
    <span className="text-sm" data-testid="value">
      <MeasurementValue value={68.4} unit="kg" />
      <Delta current={68.4} previous={null} />
    </span>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("value")).toHaveTextContent(/^68\.4kg$/);
  },
};
