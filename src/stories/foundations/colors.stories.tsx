import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const swatches = [
  { name: "Ink", token: "primary", hex: "#111111", note: "Primary buttons, active nav, chart bars" },
  { name: "Canvas", token: "background", hex: "#EFEEEC", note: "Page background" },
  { name: "Paper", token: "card", hex: "#FFFFFF", note: "Cards, inputs, popovers" },
  { name: "Mist", token: "muted", hex: "#F6F5F3", note: "Muted fills, secondary buttons" },
  { name: "Hairline", token: "border", hex: "#E4E2DE", note: "Borders, dividers" },
  { name: "Graphite", token: "muted-foreground", hex: "#6B6B68", note: "Muted text" },
  { name: "Leaf", token: "accent-soft", hex: "#B5E3BD", note: "Accent: soft badge fills, selection" },
  { name: "Grass", token: "accent-strong", hex: "#42A046", note: "Accent: progress fills, chart series" },
  { name: "Garden Green", token: "brand-600", hex: "#266431", note: "Logo, success badges only" },
] as const;

function Palette() {
  return (
    <div className="grid max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {swatches.map((s) => (
        <div key={s.token} className="overflow-hidden rounded-3xl bg-card shadow-card ring-1 ring-border">
          <div className={`h-20 bg-${s.token}`} style={{ backgroundColor: s.hex }} />
          <div className="space-y-0.5 p-3 text-sm">
            <p className="font-semibold">{s.name}</p>
            <p className="font-mono text-xs text-muted-foreground">
              {s.hex} · {s.token}
            </p>
            <p className="text-xs text-muted-foreground">{s.note}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

const meta = {
  title: "Brand/Colors",
  component: Palette,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Palette>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
