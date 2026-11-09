import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";
import { WeightTrend } from "@/components/members/weight-trend";
import { formatDay } from "@/lib/members/dates";
import { frame } from "@/stories/decorators";
import { memberWithEverything } from "@/stories/fixtures/members";
import { daysFromToday } from "@/stories/fixtures/time";

const meta = {
  title: "Members/WeightTrend",
  component: WeightTrend,
  tags: ["autodocs"],
  decorators: [frame("lg")],
  args: { checkins: memberWithEverything.checkins },
} satisfies Meta<typeof WeightTrend>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 72.0 → 70.2 → 68.4 kg over two months. */
export const Losing: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(`-3.6 kg since ${formatDay(daysFromToday(-67))}`)).toBeVisible();
    await expect(canvas.getByRole("img", { name: "Line chart of weight over time" })).toBeVisible();
  },
};

export const Gaining: Story = {
  args: {
    checkins: [
      { recordedOn: daysFromToday(-60), weightKg: 54.2 },
      { recordedOn: daysFromToday(-30), weightKg: 55.0 },
      { recordedOn: daysFromToday(-2), weightKg: 56.1 },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/^\+1\.9 kg since/)).toBeVisible();
  },
};

/** A year of fortnightly visits: the date labels thin out so they don't overlap. */
export const ManyPoints: Story = {
  args: {
    checkins: Array.from({ length: 26 }, (_, i) => ({
      recordedOn: daysFromToday(-14 * (25 - i)),
      weightKg: Math.round((84 - i * 0.45 + (i % 3) * 0.3) * 10) / 10,
    })),
  },
};

/** Check-ins without a weight are skipped. */
export const SkipsMissingWeights: Story = {
  args: {
    checkins: [
      { recordedOn: daysFromToday(-40), weightKg: 70 },
      { recordedOn: daysFromToday(-20), weightKg: null },
      { recordedOn: daysFromToday(-5), weightKg: 69.5 },
    ],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/^-0\.5 kg since/)).toBeVisible();
  },
};

export const SinglePoint: Story = {
  args: { checkins: [{ recordedOn: daysFromToday(-3), weightKg: 68.4 }] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Record at least two weights to see the trend.")).toBeVisible();
    await expect(canvas.getByText("Not enough data yet")).toBeVisible();
  },
};

export const Empty: Story = {
  args: { checkins: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Not enough data yet")).toBeVisible();
  },
};
