import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { expect, waitFor, within } from "storybook/test";
import { Calendar } from "@/components/ui/calendar";
import { TODAY, daysFromToday } from "@/stories/fixtures/time";
import { knownIssues } from "@/stories/a11y";
import { onSurface } from "@/stories/decorators";

/** A fixture day as a local-midnight Date, the way the app's pickers build them. */
const day = (iso: string) => new Date(`${iso}T00:00:00`);
const today = day(TODAY);

const meta = {
  title: "UI/Calendar",
  component: Calendar,
  tags: ["autodocs"],
  decorators: [onSurface],
  args: { defaultMonth: today },
  parameters: {
    layout: "centered",
    // Known issue: every day button fails label-content-name-mismatch (WCAG
    // 2.5.3). The visible text is "9" but react-day-picker's default label is
    // "Today, Monday, November 9th, 2026, selected", and axe doesn't find the
    // bare "9" in "9th". Fixing it means passing `labels.labelDayButton` (e.g.
    // "EEEE d MMMM yyyy") in calendar.tsx, an app change outside these stories.
    // Only that rule is switched off; every other check still runs.
    a11y: knownIssues("label-content-name-mismatch"),
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

function SingleCalendar() {
  const [selected, setSelected] = useState<Date | undefined>(today);
  return <Calendar mode="single" selected={selected} onSelect={setSelected} defaultMonth={today} />;
}

export const SingleDate: Story = {
  render: () => <SingleCalendar />,
  play: async ({ canvas, userEvent }) => {
    // Re-query the grid each time: selecting a day re-renders the month.
    const grid = () => within(canvas.getByRole("grid", { name: "November 2026" }));
    await expect(grid().getByRole("button", { name: /November 9th, 2026, selected/ })).toBeInTheDocument();

    await userEvent.click(grid().getByRole("button", { name: /November 12th, 2026/ }));
    await waitFor(() => expect(grid().getByRole("button", { name: /November 12th, 2026, selected/ })).toHaveFocus());
    await expect(grid().getByRole("button", { name: /November 9th, 2026$/ })).toBeInTheDocument();
  },
};

function RangeCalendar() {
  const [range, setRange] = useState<DateRange | undefined>({
    from: day(daysFromToday(-6)),
    to: day(TODAY),
  });
  return <Calendar mode="range" selected={range} onSelect={setRange} defaultMonth={today} numberOfMonths={1} />;
}

export const Range: Story = {
  render: () => <RangeCalendar />,
};

export const DisabledDates: Story = {
  // The attendance day picker: nothing after today can be chosen.
  args: { mode: "single", selected: today, disabled: { after: today } },
};

export const MonthDropdown: Story = {
  args: {
    mode: "single",
    selected: today,
    captionLayout: "dropdown",
    startMonth: new Date(2024, 0),
    endMonth: today,
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole("grid", { name: "November 2026" })).toBeInTheDocument();

    await userEvent.selectOptions(canvas.getByRole("combobox", { name: "Choose the Month" }), "Mar");
    await expect(await canvas.findByRole("grid", { name: "March 2026" })).toBeInTheDocument();

    await userEvent.selectOptions(canvas.getByRole("combobox", { name: "Choose the Year" }), "2025");
    await expect(await canvas.findByRole("grid", { name: "March 2025" })).toBeInTheDocument();
  },
};
