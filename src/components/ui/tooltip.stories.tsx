import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { InfoIcon } from "lucide-react";
import { expect, screen, waitFor } from "storybook/test";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// preview.tsx wraps every story in <TooltipProvider delayDuration={0}>, so the
// tooltip opens straight away. The content renders in a portal on document.body.
const meta = {
  title: "UI/Tooltip",
  component: Tooltip,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  render: (args) => (
    <Tooltip {...args}>
      <TooltipTrigger asChild>
        <Button variant="outline" size="icon" aria-label="BMI">
          <InfoIcon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Body-mass index, from the latest check-in</TooltipContent>
    </Tooltip>
  ),
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole("button", { name: "BMI" });

    await userEvent.hover(trigger);
    const tip = await screen.findByRole("tooltip");
    await expect(tip).toHaveTextContent("Body-mass index, from the latest check-in");
    await expect(trigger).toHaveAccessibleDescription("Body-mass index, from the latest check-in");

    await userEvent.unhover(trigger);
    await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument());

    // Keyboard users get it on focus, and Escape dismisses it.
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    await expect(await screen.findByRole("tooltip")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("tooltip")).not.toBeInTheDocument());
  },
};

export const Open: Story = {
  args: { defaultOpen: true },
};

export const Sides: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-x-24 gap-y-16 p-16">
      {(["top", "right", "bottom", "left"] as const).map((side) => (
        <Tooltip key={side} defaultOpen>
          <TooltipTrigger asChild>
            <Button variant="outline">{side}</Button>
          </TooltipTrigger>
          <TooltipContent side={side}>On the {side}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  ),
};
