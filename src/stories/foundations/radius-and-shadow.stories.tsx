import type { Meta, StoryObj } from "@storybook/nextjs-vite";

// From the @theme block in src/app/globals.css.
const radii = [
  { token: "rounded-sm", value: "0.5rem", use: "Tiny chips" },
  { token: "rounded-md", value: "0.75rem", use: "—" },
  { token: "rounded-lg", value: "1rem", use: "—" },
  { token: "rounded-xl", value: "1.25rem", use: "Menu items, skeletons" },
  { token: "rounded-2xl", value: "1.5rem", use: "Popovers, menus, alerts, textareas, small cards" },
  { token: "rounded-3xl", value: "1.75rem", use: "Cards, dialogs, .surface" },
  { token: "rounded-4xl", value: "2rem", use: "Hero panels" },
  { token: "rounded-full", value: "9999px", use: "Buttons, inputs, badges, avatars" },
] as const;

const shadows = [
  {
    token: "shadow-card",
    value: "0 1px 2px rgb(17 17 17 / 0.04), 0 8px 24px -16px rgb(17 17 17 / 0.12)",
    use: "Cards and .surface, with a hairline ring-1 ring-border",
    className: "rounded-3xl bg-card shadow-card ring-1 ring-border",
  },
  {
    token: "shadow-float",
    value: "0 12px 40px -12px rgb(17 17 17 / 0.25)",
    use: "Things that float above the page: dialogs, popovers, menus",
    className: "rounded-2xl bg-popover shadow-float ring-1 ring-border",
  },
] as const;

function Radii() {
  return (
    <div className="grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {radii.map((radius) => (
        <div key={radius.token} className="space-y-3">
          <div className={`h-24 bg-card ring-1 ring-border ${radius.token}`} />
          <div className="text-sm">
            <p className="font-mono text-xs font-semibold">{radius.token}</p>
            <p className="text-xs text-muted-foreground">
              {radius.value} · {radius.use}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function Shadows() {
  return (
    <div className="grid max-w-3xl gap-10 p-4 sm:grid-cols-2">
      {shadows.map((shadow) => (
        <div key={shadow.token} className={`space-y-1 p-6 text-sm ${shadow.className}`}>
          <p className="font-mono text-xs font-semibold">{shadow.token}</p>
          <p>{shadow.use}</p>
          <p className="font-mono text-xs text-muted-foreground">{shadow.value}</p>
        </div>
      ))}
    </div>
  );
}

const meta = {
  title: "Foundations/Radius & shadow",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const RadiiStory: Story = { name: "Radii", render: () => <Radii /> };
export const CardShadow: Story = { name: "Card shadow", render: () => <Shadows /> };
