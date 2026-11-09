import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ContactRoundIcon, PencilIcon } from "lucide-react";
import { expect } from "storybook/test";
import { Field, FormSection, PageHeader, PageHeaderSkeleton } from "@/components/members/field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { BackgroundConstellationGrid } from "@/components/ui/background-constellation-grid";
import { Input } from "@/components/ui/input";
import type { Decorator } from "@storybook/nextjs-vite";
import { frame, onSurface } from "@/stories/decorators";

const meta = {
  title: "Members/Field",
  component: Field,
  tags: ["autodocs"],
  args: {
    label: "Mobile",
    htmlFor: "mobile",
    children: <Input id="mobile" name="mobile" type="tel" defaultValue="98400 12345" />,
  },
  decorators: [onSurface, frame("sm")],
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("Mobile")).toHaveValue("98400 12345");
  },
};

export const WithHint: Story = {
  args: { label: "Height", htmlFor: "height", hint: "cm", children: <Input id="height" type="number" defaultValue={162} /> },
};

/** Only the first message shows, announced as an alert. */
export const WithError: Story = {
  args: { error: ["Enter a 10-digit mobile number.", "A second message that stays hidden."] },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("alert")).toHaveTextContent("Enter a 10-digit mobile number.");
    await expect(canvas.queryByText("A second message that stays hidden.")).toBeNull();
  },
};

export const Section: Story = {
  decorators: [frame("lg")],
  render: (args) => (
    <FormSection title="Personal details" description="Who the member is and how to reach them." icon={ContactRoundIcon}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field {...args} />
        <Field label="Email" htmlFor="email">
          <Input id="email" type="email" />
        </Field>
      </div>
    </FormSection>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Personal details")).toBeVisible();
  },
};

/** A header action, like the intake form's "Start a package now". */
export const SectionWithAction: Story = {
  decorators: [frame("lg")],
  render: () => (
    <FormSection
      title="Package"
      description="Enrol the member in a package from the catalog."
      action={
        <label className="flex items-center gap-2 text-sm font-medium">
          <Checkbox name="package.enabled" />
          Start a package now
        </label>
      }
    >
      <p className="text-sm text-muted-foreground">You can also add a package later from the member&rsquo;s profile.</p>
    </FormSection>
  ),
};

/**
 * Page headers sit on the app's page background (the constellation canvas),
 * not on a card. The watermark is decorative and aria-hidden; on the real
 * background axe can't measure it, exactly as on every screen.
 */
const onPageBackground: Decorator = (Story) => (
  <div className="relative isolate overflow-hidden px-4 py-8 md:px-8">
    <BackgroundConstellationGrid className="absolute -z-10" />
    <Story />
  </div>
);

export const Header: Story = {
  parameters: { layout: "fullscreen" },
  decorators: [onPageBackground],
  render: () => (
    <PageHeader
      title="Members"
      description="Everyone enrolled at this branch, with their current package and last follow-up."
      actions={<Button size="lg">New member</Button>}
    />
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { level: 1, name: "Members" })).toBeVisible();
  },
};

/** A custom eyebrow and a long title, as on the member profile. */
export const HeaderLongTitle: Story = {
  parameters: { layout: "fullscreen" },
  decorators: [onPageBackground],
  render: () => (
    <PageHeader
      eyebrow="Member #104"
      title="Kumar Subramaniam Venkataraghavan"
      description="Male · 52 years · Joined 2 Jul 2026"
      actions={
        <Button variant="outline" size="lg">
          <PencilIcon data-icon="inline-start" />
          Edit details
        </Button>
      }
    />
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Member #104")).toBeVisible();
  },
};

export const HeaderSkeleton: Story = {
  parameters: { layout: "fullscreen" },
  decorators: [onPageBackground],
  render: () => <PageHeaderSkeleton descriptionLines={2} />,
};
