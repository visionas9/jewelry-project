"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { deleteProduct, type CatalogResult } from "@/app/admin/products/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";

// Folded shut and away from save, like every other irreversible thing in the
// panel. A bracelet that appears in somebody's order cannot be deleted at all —
// the database refuses it, and the message says to zero the stock instead.
export function DeleteProduct({ id }: { id: number }) {
  const router = useRouter();
  const [state, formAction] = useActionState<CatalogResult, FormData>(
    deleteProduct.bind(null, id),
    null
  );

  useEffect(() => {
    if (state?.ok) router.push("/admin/products");
  }, [state, router]);

  return (
    <details className="mt-10 border-t border-line pt-5">
      <summary className="cursor-pointer list-none text-sm text-muted hover:text-ink">
        Ürünü sil
      </summary>
      <div className="mt-4">
        <p className="text-sm leading-relaxed text-muted">
          Silinen ürün geri getirilemez. Geçmiş siparişlerde yer alan bir ürün
          silinemez — onu satıştan kaldırmak için stoğunu 0 yapın.
        </p>
        <p
          role="alert"
          className={`mt-2 text-sm text-brass ${state && !state.ok ? "" : "sr-only"}`}
        >
          {state?.ok === false ? state.message : ""}
        </p>
        <form action={formAction} className="mt-4">
          <SubmitButton
            pendingLabel="Siliniyor…"
            className="w-full rounded-full border border-brass/50 px-7 py-3 text-sm tracking-wide text-brass transition-colors hover:bg-brass/10 disabled:border-line disabled:text-muted"
          >
            Kalıcı olarak sil
          </SubmitButton>
        </form>
      </div>
    </details>
  );
}
