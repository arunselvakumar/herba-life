import type { Meta, StoryObj } from "@storybook/nextjs-vite";

// The console's type, as the app actually uses it. One family (Urbanist,
// `font-sans` and `font-heading`) and JetBrains Mono for codes. Headings get
// tight negative tracking from globals.css; everything else stays at 0.

type Step = { name: string; className: string; spec: string; use: string; sample: string };

const scale: Step[] = [
  {
    name: "Kiosk display",
    className: "font-heading text-5xl font-bold tracking-tight md:text-7xl",
    spec: "text-5xl → md:text-7xl · bold",
    use: "Kiosk welcome and result",
    sample: "Welcome, Meena",
  },
  {
    name: "Page title",
    className: "font-heading text-3xl font-semibold tracking-[-0.03em] md:text-[2.5rem] md:leading-[1.1]",
    spec: "text-3xl → md:2.5rem · semibold · -0.03em",
    use: "PageHeader <h1>",
    sample: "Members",
  },
  {
    name: "Stat figure",
    className: "text-[2rem] leading-none font-semibold tracking-[-0.03em] tabular-nums md:text-[2.25rem]",
    spec: "2rem → md:2.25rem · semibold · tabular",
    use: "StatCard value",
    sample: "1,284",
  },
  {
    name: "Section heading",
    className: "font-heading text-lg leading-tight font-semibold tracking-[-0.01em]",
    spec: "text-lg · semibold · -0.01em",
    use: "Dialog titles, section headings",
    sample: "Record attendance",
  },
  {
    name: "Card title",
    className: "font-heading text-base leading-snug font-semibold tracking-[-0.01em]",
    spec: "text-base · semibold",
    use: "CardTitle",
    sample: "Visits this week",
  },
  {
    name: "Body",
    className: "text-sm",
    spec: "text-sm · regular",
    use: "Tables, forms, card content",
    sample: "3-month package, 41 visits so far.",
  },
  {
    name: "Muted body",
    className: "text-sm text-muted-foreground",
    spec: "text-sm · muted-foreground",
    use: "Descriptions, secondary cells",
    sample: "Last visit on 7 Nov 2026",
  },
  {
    name: "Label",
    className: "text-[0.8rem] leading-none font-medium text-foreground/80",
    spec: "0.8rem · medium · 80 % ink",
    use: "Form labels",
    sample: "Phone number",
  },
  {
    name: "Eyebrow",
    className: "text-eyebrow",
    spec: ".text-eyebrow · xs · medium · muted",
    use: "Section labels above content",
    sample: "Today at the studio",
  },
  {
    name: "Caption",
    className: "text-[0.7rem] font-semibold tracking-wide text-muted-foreground uppercase",
    spec: "0.7rem · semibold · uppercase",
    use: "Calendar weekdays, chart axes",
    sample: "Mon Tue Wed",
  },
  {
    name: "Mono",
    className: "font-mono text-xs",
    spec: "font-mono · xs",
    use: "IDs, hex values",
    sample: "#266431 · role-admin",
  },
];

function TypeScale() {
  return (
    <div className="surface grid max-w-4xl divide-y divide-border p-2">
      {scale.map((step) => (
        <div key={step.name} className="grid gap-2 p-4 md:grid-cols-[12rem_1fr] md:items-baseline md:gap-6">
          <div className="space-y-0.5 text-xs">
            <p className="font-semibold">{step.name}</p>
            <p className="font-mono text-muted-foreground">{step.spec}</p>
            <p className="text-muted-foreground">{step.use}</p>
          </div>
          <p className={`min-w-0 truncate ${step.className}`}>{step.sample}</p>
        </div>
      ))}
    </div>
  );
}

const figures = ["1,284", "₹4,780", "72.4 kg", "11,111", "₹23,90,000"] as const;

function Numerals() {
  return (
    <div className="surface grid max-w-xl gap-6 p-6 sm:grid-cols-2">
      {(
        [
          ["Tabular", "tabular-nums", "Columns of figures: tables, stats, weights. Digits share one width, so they line up."],
          ["Proportional", "", "Running text. Narrow digits like 1 take less room."],
        ] as const
      ).map(([name, className, note]) => (
        <div key={name} className="space-y-3">
          <div>
            <p className="font-semibold">{name}</p>
            <p className="text-xs text-muted-foreground">{note}</p>
          </div>
          <ul className={`space-y-1 text-right font-heading text-2xl font-semibold ${className}`}>
            {figures.map((figure) => (
              <li key={figure}>{figure}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function LongText() {
  return (
    <article className="surface max-w-xl space-y-4 p-6">
      <p className="text-eyebrow">Member notes</p>
      <h2 className="font-heading text-lg leading-tight font-semibold tracking-[-0.01em]">
        Lakshmi Venkataraman Subramaniam, 6-month package with weekly body-composition check-ins
      </h2>
      <p className="text-sm text-balance">
        Joined after a free trial week in March. Comes to the morning batch most days and prefers the vanilla
        shake. Weight is down 4.2 kg since the first check-in, body fat down 3 %. Wants to keep going after the
        package ends on 15 Nov 2026 and asked about the 12-month plan.
      </p>
      <p className="text-sm text-muted-foreground">
        Supercalifragilisticexpialidociousnamewithoutspacestoseehowitwraps@verylongemaildomain.example.com
      </p>
      <p className="truncate text-sm">
        A single line that truncates rather than wrapping, the way table cells and the member rail clip long names.
      </p>
    </article>
  );
}

const meta = {
  title: "Foundations/Typography",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const TypeScaleStory: Story = { name: "Type scale", render: () => <TypeScale /> };
export const NumeralsStory: Story = { name: "Numerals (tabular)", render: () => <Numerals /> };
export const LongTextStory: Story = { name: "Long text", render: () => <LongText /> };
