import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { MoreHorizontalIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { frame } from "@/stories/decorators";

const meta = {
  title: "UI/Card",
  component: Card,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [frame("sm")],
  argTypes: {
    size: { control: "radio", options: ["default", "sm"] },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Meena Raghavan</CardTitle>
        <CardDescription>Member since March 2025</CardDescription>
      </CardHeader>
      <CardContent>
        <p>3-month package, 41 visits so far. Next check-in is due on Friday.</p>
      </CardContent>
    </Card>
  ),
};

export const WithHeaderActions: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Formula 1 Shake, Vanilla</CardTitle>
        <CardDescription>500 g tub</CardDescription>
        <CardAction className="flex items-center gap-2">
          <Badge variant="secondary">12 in stock</Badge>
          <Button variant="ghost" size="icon-sm" aria-label="More actions">
            <MoreHorizontalIcon />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Last received 2 Nov 2026.</p>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader className="border-b">
        <CardTitle>Renew package</CardTitle>
        <CardDescription>The current package ends on 15 Nov 2026.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Starting the new package the day after keeps the visit streak unbroken.</p>
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline">Later</Button>
        <Button>Renew</Button>
      </CardFooter>
    </Card>
  ),
};

export const Small: Story = {
  args: { size: "sm" },
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Visits today</CardTitle>
        <CardDescription>Up 4 on last Monday</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-3xl font-semibold tabular-nums">38</p>
      </CardContent>
    </Card>
  ),
};
