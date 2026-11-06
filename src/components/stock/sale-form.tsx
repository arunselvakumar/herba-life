"use client";

import Link from "next/link";
import { useActionState, useId, useMemo, useState } from "react";
import { AlertCircleIcon, LoaderCircleIcon, PlusIcon, ReceiptIndianRupeeIcon, ShoppingBagIcon, UserRoundIcon, XIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Field, FormSection } from "@/components/members/field";
import type { PriceLevel } from "@/db/schema";
import { idleState, withValues, type FormAction } from "@/lib/members/form-state";
import { formatMoney, fullName } from "@/lib/members/format";
import { PAYMENT_MODES, PRICE_LEVELS, priceFor, roundMoney } from "@/lib/stock/format";
import type { MemberPickerOption, ProductOption } from "@/lib/stock/queries";
import { cn } from "@/lib/utils";
import { ProductSelect } from "./product-select";

type Line = { key: number; productId: string; quantity: string; unitPrice: string };

let nextKey = 1;
const newLine = (productId = "", unitPrice = ""): Line => ({ key: nextKey++, productId, quantity: productId ? "1" : "", unitPrice });

/**
 * One visit to the counter. Lines are kept in client state so a product can
 * be swapped and the price refilled from the chosen level; they post as
 * parallel `productId[]` / `quantity[]` / `unitPrice[]` lists.
 */
export function SaleForm({
  action,
  products,
  members,
  today,
  memberId: initialMemberId = "",
  productId: initialProductId = "",
}: {
  action: FormAction;
  products: ProductOption[];
  members: MemberPickerOption[];
  today: string;
  /** Pre-selects the buyer (from a member's profile). */
  memberId?: string | undefined;
  /** Starts with this product on the first line (from a product page). */
  productId?: string | undefined;
}) {
  const wrapped = useMemo(() => withValues(action), [action]);
  const [state, formAction, pending] = useActionState(wrapped, idleState);
  const errors = state.status === "error" ? state.errors : {};
  const id = useId();

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const [memberId, setMemberId] = useState(members.some((m) => m.id === initialMemberId) ? initialMemberId : "");
  const [level, setLevel] = useState<PriceLevel>("mrp");
  const [lines, setLines] = useState<Line[]>(() => {
    const first = byId.get(initialProductId);
    return [first ? newLine(first.id, String(priceFor(first, "mrp"))) : newLine()];
  });
  const [amountPaid, setAmountPaid] = useState("");

  const total = roundMoney(lines.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0));
  const paid = amountPaid.trim() === "" ? total : Number(amountPaid) || 0;
  const balance = roundMoney(total - paid);

  function update(key: number, patch: Partial<Line>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }
  function pickProduct(key: number, productId: string) {
    const p = byId.get(productId);
    update(key, { productId, unitPrice: p ? String(priceFor(p, level)) : "", quantity: p ? "1" : "" });
  }
  function changeLevel(next: PriceLevel) {
    setLevel(next);
    setLines((prev) =>
      prev.map((l) => {
        const p = byId.get(l.productId);
        return p ? { ...l, unitPrice: String(priceFor(p, next)) } : l;
      }),
    );
  }

  return (
    <form action={formAction} className="space-y-6" noValidate>
      {state.status === "error" ? (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertDescription>{errors._form?.[0] ?? errors.items?.[0] ?? state.message ?? "Please check the sale."}</AlertDescription>
        </Alert>
      ) : null}

      <FormSection title="Buyer" description="A member from the list, or a walk-in's name." icon={UserRoundIcon}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Member" htmlFor={`${id}-member`} error={errors.memberId} className="lg:col-span-2">
            <NativeSelect id={`${id}-member`} name="memberId" value={memberId} onChange={(e) => setMemberId(e.target.value)} className="w-full">
              <NativeSelectOption value="">Not a member (walk-in)</NativeSelectOption>
              {members.map((m) => (
                <NativeSelectOption key={m.id} value={m.id}>
                  #{m.serialNo} · {fullName(m)}
                  {m.mobile ? ` · ${m.mobile}` : ""}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          {memberId === "" ? (
            <Field label="Buyer's name" htmlFor={`${id}-buyer`} error={errors.buyerName} className="lg:col-span-2">
              <Input id={`${id}-buyer`} name="buyerName" autoComplete="off" placeholder="Who is buying" required />
            </Field>
          ) : null}
          <Field label="Sold on" htmlFor={`${id}-day`} error={errors.soldOn}>
            <Input id={`${id}-day`} name="soldOn" type="date" defaultValue={today} max={today} required />
          </Field>
          <Field label="Price level" htmlFor={`${id}-level`} error={errors.priceLevel} hint="refills every line">
            <NativeSelect id={`${id}-level`} name="priceLevel" value={level} onChange={(e) => changeLevel(e.target.value as PriceLevel)} className="w-full">
              {PRICE_LEVELS.map((l) => (
                <NativeSelectOption key={l.value} value={l.value}>
                  {l.label} · {l.hint}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
        </div>
      </FormSection>

      <FormSection
        title="Products"
        description="What is leaving the shelf. Prices come from the chosen level and can be changed per line."
        icon={ShoppingBagIcon}
        action={
          <Button type="button" variant="outline" size="sm" onClick={() => setLines((prev) => [...prev, newLine()])}>
            <PlusIcon data-icon="inline-start" />
            Add line
          </Button>
        }
      >
        <div className="space-y-3">
          {lines.map((line, i) => {
            const p = byId.get(line.productId);
            const qty = Number(line.quantity) || 0;
            const short = p ? qty > p.onHand : false;
            const lineTotal = roundMoney(qty * (Number(line.unitPrice) || 0));
            return (
              <div key={line.key} className="grid gap-3 rounded-2xl border bg-muted/60 p-3 sm:grid-cols-[minmax(0,1fr)_6rem_8rem_7rem_auto] sm:items-end">
                <Field label={i === 0 ? "Product" : <span className="sr-only">Product</span>} htmlFor={`${id}-p${line.key}`} error={errors[`items.${i}.productId`]}>
                  <ProductSelect id={`${id}-p${line.key}`} name="productId[]" products={products} value={line.productId} onChange={(v) => pickProduct(line.key, v)} disableOutOfStock required={false} />
                </Field>
                <Field
                  label={i === 0 ? "Qty" : <span className="sr-only">Quantity</span>}
                  htmlFor={`${id}-q${line.key}`}
                  error={errors[`items.${i}.quantity`] ?? (short && p ? [`Only ${p.onHand} on hand`] : undefined)}
                >
                  <Input id={`${id}-q${line.key}`} name="quantity[]" type="number" min={1} inputMode="numeric" value={line.quantity} onChange={(e) => update(line.key, { quantity: e.target.value })} aria-invalid={short || undefined} />
                </Field>
                <Field label={i === 0 ? "Unit price" : <span className="sr-only">Unit price</span>} htmlFor={`${id}-u${line.key}`} error={errors[`items.${i}.unitPrice`]}>
                  <Input id={`${id}-u${line.key}`} name="unitPrice[]" type="number" min={0} step="0.01" inputMode="decimal" value={line.unitPrice} onChange={(e) => update(line.key, { unitPrice: e.target.value })} />
                </Field>
                <div className="text-right sm:pb-2.5">
                  <div className="text-[0.7rem] text-muted-foreground sm:hidden">Line total</div>
                  <div className="font-semibold tabular-nums">{formatMoney(lineTotal)}</div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove line"
                  disabled={lines.length === 1}
                  onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
                  className="justify-self-end text-muted-foreground sm:mb-1"
                >
                  <XIcon />
                </Button>
              </div>
            );
          })}
          {errors.items?.[0] ? <p className="text-xs font-medium text-destructive">{errors.items[0]}</p> : null}
        </div>
      </FormSection>

      <FormSection title="Payment" icon={ReceiptIndianRupeeIcon}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-foreground px-4 py-3 text-background sm:col-span-2 lg:col-span-1">
            <div className="text-[0.7rem] tracking-[0.12em] uppercase opacity-70">Total</div>
            <div className="font-heading text-2xl font-semibold tracking-tight tabular-nums">{formatMoney(total)}</div>
          </div>
          <Field label="Amount paid" htmlFor={`${id}-paid`} error={errors.amountPaid} hint="blank = paid in full">
            <Input id={`${id}-paid`} name="amountPaid" type="number" min={0} step="0.01" inputMode="decimal" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder={String(total)} />
            <p className={cn("text-xs", balance > 0 ? "font-medium text-amber-800" : "text-muted-foreground")}>
              {balance > 0 ? `Balance due ${formatMoney(balance)}` : balance < 0 ? "More than the total" : "Paid in full"}
            </p>
          </Field>
          <Field label="Payment mode" htmlFor={`${id}-mode`} error={errors.paymentMode}>
            <NativeSelect id={`${id}-mode`} name="paymentMode" defaultValue="cash" className="w-full">
              {PAYMENT_MODES.map((m) => (
                <NativeSelectOption key={m.value} value={m.value}>
                  {m.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Notes" htmlFor={`${id}-notes`} error={errors.notes} hint="optional">
            <Textarea id={`${id}-notes`} name="notes" rows={1} placeholder="Anything worth remembering" />
          </Field>
        </div>
      </FormSection>

      <div className="sticky bottom-0 -mx-4 flex items-center justify-end gap-2 border-t bg-background/90 px-4 py-3 backdrop-blur md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        <span className="mr-auto text-sm text-muted-foreground">
          {lines.filter((l) => l.productId).length} line{lines.filter((l) => l.productId).length === 1 ? "" : "s"} · {formatMoney(total)}
        </span>
        <Button asChild type="button" variant="ghost">
          <Link href={memberId ? `/members/${memberId}` : "/stock"}>Cancel</Link>
        </Button>
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <LoaderCircleIcon className="animate-spin" /> : null}
          Save sale
        </Button>
      </div>
    </form>
  );
}
