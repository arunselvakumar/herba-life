import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CheckIcon, PlusIcon } from "lucide-react";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { onSurface } from "@/stories/decorators";

// A local, inline portrait so the story never waits on the network.
const portrait = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#b5e3bd"/><circle cx="20" cy="16" r="7" fill="#266431"/><path d="M6 40c2-9 8-13 14-13s12 4 14 13z" fill="#266431"/></svg>',
)}`;

const meta = {
  title: "UI/Avatar",
  component: Avatar,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [onSurface],
  argTypes: {
    size: { control: "radio", options: ["sm", "default", "lg"] },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Image: Story = {
  args: { size: "lg" },
  render: (args) => (
    <Avatar {...args}>
      <AvatarImage src={portrait} alt="Meena Raghavan" />
      <AvatarFallback>MR</AvatarFallback>
    </Avatar>
  ),
};

export const FallbackInitials: Story = {
  args: { size: "lg" },
  render: (args) => (
    <Avatar {...args}>
      <AvatarFallback>AS</AvatarFallback>
    </Avatar>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      {(["sm", "default", "lg"] as const).map((size) => (
        <Avatar key={size} size={size}>
          <AvatarFallback>AS</AvatarFallback>
        </Avatar>
      ))}
    </div>
  ),
};

export const WithBadge: Story = {
  args: { size: "lg" },
  render: (args) => (
    <Avatar {...args}>
      <AvatarFallback>MR</AvatarFallback>
      <AvatarBadge>
        <CheckIcon />
      </AvatarBadge>
    </Avatar>
  ),
};

export const Group: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar>
        <AvatarImage src={portrait} alt="Meena Raghavan" />
        <AvatarFallback>MR</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>AS</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>KP</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>+4</AvatarGroupCount>
    </AvatarGroup>
  ),
};

export const GroupWithAdd: Story = {
  render: () => (
    <AvatarGroup>
      <Avatar size="lg">
        <AvatarFallback>MR</AvatarFallback>
      </Avatar>
      <Avatar size="lg">
        <AvatarFallback>AS</AvatarFallback>
      </Avatar>
      <AvatarGroupCount>
        <PlusIcon aria-hidden />
        <span className="sr-only">Add a member</span>
      </AvatarGroupCount>
    </AvatarGroup>
  ),
};
