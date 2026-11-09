import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CircleAlertIcon, InfoIcon } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { frame } from "@/stories/decorators";

const meta = {
  title: "UI/Alert",
  component: Alert,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [frame("md")],
  argTypes: {
    variant: { control: "radio", options: ["default", "destructive"] },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Stock count is due</AlertTitle>
      <AlertDescription>Count the shelf before Friday so the monthly report balances.</AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  args: { variant: "destructive" },
  render: (args) => (
    <Alert {...args}>
      <CircleAlertIcon />
      <AlertTitle>Couldn&apos;t save the sale</AlertTitle>
      <AlertDescription>Only 3 tubs of Formula 1 are left. Lower the quantity and try again.</AlertDescription>
    </Alert>
  ),
};

export const WithIconAndAction: Story = {
  render: (args) => (
    <Alert {...args}>
      <InfoIcon />
      <AlertTitle>4 packages end this week</AlertTitle>
      <AlertDescription>Renew them before the members&apos; next visit.</AlertDescription>
      <AlertAction>
        <Button size="xs" variant="outline">
          Review
        </Button>
      </AlertAction>
    </Alert>
  ),
};

export const LongDescription: Story = {
  render: (args) => (
    <Alert {...args}>
      <InfoIcon />
      <AlertTitle>Attendance is recorded in India time</AlertTitle>
      <AlertDescription>
        <p>Visits are grouped into morning, afternoon and evening by the studio&apos;s clock, not the device&apos;s.</p>
        <p>
          A tablet set to another time zone still files a 7 am visit under morning. <a href="#settings">Change the studio</a>
        </p>
      </AlertDescription>
    </Alert>
  ),
};
