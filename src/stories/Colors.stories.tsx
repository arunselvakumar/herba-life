import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const swatches = [
  { name: "Garden Green", token: "brand-600", hex: "#266431", note: "Primary. PMS 7733C" },
  { name: "Grass", token: "brand-500", hex: "#42A046", note: "Accent, success, focus ring" },
  { name: "Mint", token: "brand-200", hex: "#B5E3BD", note: "Soft fills" },
  { name: "Succulent", token: "brand-100", hex: "#E5FFC5", note: "Highlight / accent background" },
  { name: "Forest", token: "brand-800", hex: "#163E35", note: "Secondary foreground" },
  { name: "Evergreen", token: "brand-900", hex: "#0E2512", note: "Sidebar, hero panels" },
  { name: "Linen", token: "linen", hex: "#F9F8F4", note: "Page background" },
  { name: "Stone", token: "stone", hex: "#E0DFD9", note: "Borders, dividers" },
] as const;

function Palette() {
  return (
    <div className="grid max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {swatches.map((s) => (
        <div key={s.token} className="overflow-hidden rounded-xl bg-card ring-1 ring-stone">
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
