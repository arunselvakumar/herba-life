import { currency, type Order, type OrderStatus } from "@/lib/dashboard-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const statusStyles: Record<OrderStatus, { label: string; className: string }> = {
  fulfilled: { label: "Fulfilled", className: "bg-brand-100 text-brand-700" },
  processing: { label: "Processing", className: "bg-info/15 text-brand-800" },
  "on-hold": { label: "On hold", className: "bg-warning/20 text-amber-800" },
  cancelled: { label: "Cancelled", className: "bg-destructive/10 text-destructive" },
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const style = statusStyles[status];
  return (
    <Badge className={cn("rounded-full border-transparent font-semibold", style.className)}>
      {style.label}
    </Badge>
  );
}

export function RecentOrders({ orders }: { orders: readonly Order[] }) {
  return (
    <Card className="ring-stone/80">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Recent orders</CardTitle>
        <CardDescription>Latest activity across all regions</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm">
            View all
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-4">Order</TableHead>
              <TableHead>Distributor</TableHead>
              <TableHead className="hidden md:table-cell">Region</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Items</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="pr-4">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="pl-4 font-mono text-xs font-medium">
                  {order.id}
                </TableCell>
                <TableCell className="font-medium">{order.distributor}</TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {order.region}
                </TableCell>
                <TableCell className="hidden text-right tabular-nums sm:table-cell">
                  {order.items}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {currency.format(order.total)}
                </TableCell>
                <TableCell className="pr-4">
                  <OrderStatusBadge status={order.status} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
