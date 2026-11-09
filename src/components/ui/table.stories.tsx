import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { frame, onSurface } from "@/stories/decorators";

const sales = [
  { no: 1042, member: "Meena Raghavan", items: "Formula 1, Vanilla × 2", amount: 4780, paid: true },
  { no: 1041, member: "Karthik Prabhu", items: "Afresh, Lemon", amount: 1150, paid: true },
  { no: 1040, member: "Lakshmi Venkataraman Subramaniam", items: "Protein Drink Mix", amount: 2390, paid: false },
  { no: 1039, member: "Arjun Das", items: "Formula 1, Chocolate", amount: 2390, paid: true },
] as const;

const rupees = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

const meta = {
  title: "UI/Table",
  component: Table,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  decorators: [frame("lg"), onSurface],
} satisfies Meta<typeof Table>;

export default meta;
type Story = StoryObj<typeof meta>;

function Head() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-16">No.</TableHead>
        <TableHead>Member</TableHead>
        <TableHead>Items</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Amount</TableHead>
      </TableRow>
    </TableHeader>
  );
}

export const Basic: Story = {
  render: (args) => (
    <Table {...args}>
      <Head />
      <TableBody>
        {sales.map((sale) => (
          <TableRow key={sale.no}>
            <TableCell className="text-muted-foreground tabular-nums">#{sale.no}</TableCell>
            <TableCell className="font-medium">{sale.member}</TableCell>
            <TableCell>{sale.items}</TableCell>
            <TableCell>
              <Badge variant={sale.paid ? "secondary" : "destructive"}>{sale.paid ? "Paid" : "Owes"}</Badge>
            </TableCell>
            <TableCell className="text-right tabular-nums">{rupees.format(sale.amount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const WithCaptionAndFooter: Story = {
  render: (args) => (
    <Table {...args}>
      <TableCaption>Sales on 9 Nov 2026</TableCaption>
      <Head />
      <TableBody>
        {sales.map((sale) => (
          <TableRow key={sale.no} data-state={sale.no === 1041 ? "selected" : undefined}>
            <TableCell className="text-muted-foreground tabular-nums">#{sale.no}</TableCell>
            <TableCell className="font-medium">{sale.member}</TableCell>
            <TableCell>{sale.items}</TableCell>
            <TableCell>{sale.paid ? "Paid" : "Owes"}</TableCell>
            <TableCell className="text-right tabular-nums">{rupees.format(sale.amount)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={4}>Total</TableCell>
          <TableCell className="text-right tabular-nums">
            {rupees.format(sales.reduce((sum, sale) => sum + sale.amount, 0))}
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  ),
};

export const Empty: Story = {
  render: (args) => (
    <Table {...args}>
      <Head />
      <TableBody>
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
            No sales yet today.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};
