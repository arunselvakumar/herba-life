"use client";

import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "@/components/ui/native-select";
import type { ProductOption } from "@/lib/stock/queries";

/** A product picker grouped by category, each option showing what is on hand. */
export function ProductSelect({
  id,
  name,
  products,
  defaultValue,
  value,
  onChange,
  locked = false,
  required = true,
  disableOutOfStock = false,
  className,
}: {
  id?: string;
  name: string;
  products: ProductOption[];
  defaultValue?: string;
  value?: string;
  onChange?: (productId: string) => void;
  /** Pre-selected and not changeable (the value still posts). */
  locked?: boolean;
  required?: boolean;
  /** Greys out products with nothing on the shelf (for sales). */
  disableOutOfStock?: boolean;
  className?: string;
}) {
  const groups = new Map<string, ProductOption[]>();
  for (const p of products) {
    const list = groups.get(p.category) ?? [];
    list.push(p);
    groups.set(p.category, list);
  }
  const controlled = value !== undefined;
  return (
    <>
      <NativeSelect
        id={id}
        name={locked ? undefined : name}
        {...(controlled ? { value, onChange: (e) => onChange?.(e.target.value) } : { defaultValue })}
        disabled={locked}
        required={required}
        className={className ?? "w-full"}
      >
        <NativeSelectOption value="">Choose a product…</NativeSelectOption>
        {[...groups].map(([category, list]) => (
          <NativeSelectOptGroup key={category} label={category}>
            {list.map((p) => (
              <NativeSelectOption key={p.id} value={p.id} disabled={disableOutOfStock && p.onHand <= 0}>
                {p.stockNo} · {p.name} · {p.onHand} on hand
              </NativeSelectOption>
            ))}
          </NativeSelectOptGroup>
        ))}
      </NativeSelect>
      {locked ? <input type="hidden" name={name} value={value ?? defaultValue ?? ""} /> : null}
    </>
  );
}
