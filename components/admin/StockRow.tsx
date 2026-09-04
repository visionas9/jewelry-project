"use client";

import { useActionState } from "react";

import { setStock, type StockResult } from "@/app/admin/stock/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type { AdminProduct } from "@/lib/catalog";

// One product, one number. The whole screen is this row repeated, because
// counting a shelf is the one job where a form per product would be slower than
// the counting.
export function StockRow({ product }: { product: AdminProduct }) {
  const [state, formAction] = useActionState<StockResult, FormData>(
    setStock.bind(null, product.id),
    null
  );

  const out = product.stock === 0;

  return (
    <form
      action={formAction}
      className="flex items-center gap-3 rounded-2xl border border-line bg-cream px-4 py-3"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{product.name}</p>
        <p className="mt-0.5 text-xs">
          <span className={out ? "text-brass" : "text-muted"}>
            {out ? "Tükendi" : `Rafta ${product.stock}`}
          </span>
          {/* Said where it happened rather than at the top of the page: with
              twenty rows, a message anywhere else belongs to no row. */}
          {state ? (
            <span className={state.ok ? " text-ink" : " text-brass"}>
              {" · "}
              {state.message}
            </span>
          ) : null}
        </p>
      </div>

      <input
        name="stock"
        type="number"
        min="0"
        step="1"
        required
        defaultValue={product.stock}
        aria-label={`${product.name} stok adedi`}
        className="w-20 shrink-0 rounded-2xl border border-line bg-cream px-3 py-2 text-center text-base tabular-nums outline-none focus:border-ink"
      />

      <SubmitButton
        pendingLabel="…"
        className="shrink-0 rounded-full border border-line px-4 py-2 text-sm transition-colors hover:border-ink disabled:text-muted"
      >
        Kaydet
      </SubmitButton>
    </form>
  );
}
