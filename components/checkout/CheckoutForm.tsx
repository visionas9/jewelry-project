"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

import {
  placeOrder,
  reviewCart,
  type CheckoutState,
} from "@/app/checkout/actions";
import { formatPrice } from "@/lib/format";
import type { CartSummary } from "@/lib/orders";
import { useCartHydrated, useCartStore } from "@/lib/stores/cart";

import { Spinner } from "@/components/ui/Spinner";

const FIELD =
  "w-full appearance-none rounded-2xl border border-line bg-cream px-4 py-3 text-base outline-none transition-colors placeholder:text-muted focus:border-ink";

export function CheckoutForm() {
  const hydrated = useCartHydrated();
  const items = useCartStore((state) => state.items);
  const clear = useCartStore((state) => state.clear);
  const router = useRouter();

  const [summary, setSummary] = useState<CartSummary | null>(null);

  // The server cannot see localStorage, so the cart has to be handed over
  // before it can be priced. Asked again whenever the cart changes, which also
  // means the stock warnings are as fresh as this page.
  useEffect(() => {
    if (!hydrated) return;

    let current = true;

    reviewCart(items)
      .then((next) => {
        if (current) setSummary(next);
      })
      .catch(() => {
        // The page is still usable: the fields work, and place_order re-prices
        // and re-checks everything anyway. Leaving the summary empty is worse
        // than leaving it stale, so this keeps the last one it had.
      });

    return () => {
      current = false;
    };
  }, [hydrated, items]);

  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(
    placeOrder.bind(null, items),
    null
  );

  // Emptied only once the order is known to exist. Clearing before the action
  // returns would lose somebody's cart to a network error.
  useEffect(() => {
    if (state && "code" in state) {
      clear();
      router.push(`/orders/${state.code}`);
    }
  }, [state, clear, router]);

  if (!hydrated || !summary) {
    return (
      <div aria-hidden="true" className="mt-10 animate-pulse space-y-4">
        <div className="h-24 rounded-2xl bg-sand" />
        <div className="h-64 rounded-2xl bg-sand" />
      </div>
    );
  }

  if (summary.lines.length === 0 && summary.problems.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-line bg-sand/60 px-6 py-12 text-center">
        <p className="font-display text-xl">Sepetiniz boş</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          Sipariş verebilmek için önce sepetinize bir şeyler ekleyin.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-block rounded-full bg-ink px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-brass"
        >
          Bilekliklere göz at
        </Link>
      </div>
    );
  }

  const error = state && "message" in state ? state.message : null;
  const blocked = summary.problems.length > 0;

  // The action resolves the moment the order exists, but the page it leads to
  // has to load before anything changes on screen. Without this the button
  // springs back to "Siparişi tamamla" and the wait looks like a dead click.
  const placed = state !== null && "code" in state;

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
      <form action={formAction} className="flex flex-col gap-5" noValidate>
        <p
          role="alert"
          aria-live="polite"
          className={`text-sm text-brass ${error ? "" : "sr-only"}`}
        >
          {error ?? ""}
        </p>

        <h2 className="font-display text-xl">Teslimat bilgileri</h2>

        <Field name="fullName" label="Ad soyad" autoComplete="name" />
        <Field
          name="phone"
          label="Telefon"
          type="tel"
          autoComplete="tel"
          placeholder="05XX XXX XX XX"
          hint="Kargo şirketi size bu numaradan ulaşır."
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field name="city" label="İl" autoComplete="address-level1" />
          <Field name="district" label="İlçe" autoComplete="address-level2" />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="address" className="text-sm text-muted">
            Açık adres
          </label>
          <textarea
            id="address"
            name="address"
            rows={3}
            required
            autoComplete="street-address"
            className={FIELD}
          />
        </div>

        <button
          type="submit"
          disabled={pending || placed || blocked}
          className="mt-2 rounded-full bg-ink px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-brass disabled:bg-line disabled:text-muted"
        >
          {placed ? (
            <Busy label="Siparişiniz alındı, yönlendiriliyorsunuz…" />
          ) : pending ? (
            <Busy label="Siparişiniz alınıyor…" />
          ) : (
            "Siparişi tamamla"
          )}
        </button>

        <p className="text-sm leading-relaxed text-muted">
          Siparişiniz havale/EFT ile ödenir. Sipariş kodunuz ve hesap bilgileri
          bir sonraki adımda gösterilir.
        </p>
      </form>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-2xl border border-line bg-sand/60 px-6 py-6">
          <h2 className="font-display text-xl">Siparişiniz</h2>

          {/* Named, not counted. "Bir ürün" is no use to somebody with four
              things in their cart. */}
          {summary.problems.map((problem) => (
            <p
              key={`${problem.kind}-${problem.productId}`}
              role="alert"
              className="mt-4 rounded-2xl border border-line bg-cream px-4 py-3 text-sm leading-relaxed text-brass"
            >
              {problem.kind === "missing"
                ? "Sepetinizdeki bir ürün artık satışta değil. Lütfen sepetinizden çıkarın."
                : `${problem.name} için elimizde ${problem.available} tane kaldı. Sepetinizden adedi düşürün.`}
            </p>
          ))}

          <ul className="mt-5 flex flex-col gap-4">
            {summary.lines.map((line) => (
              <li key={line.productId} className="flex justify-between gap-4 text-sm">
                <span className="leading-relaxed">
                  {line.name}
                  <span className="text-muted"> × {line.quantity}</span>
                </span>
                <span className="tabular-nums">
                  {formatPrice(line.subtotal, "TRY")}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex justify-between border-t border-line pt-4 text-sm">
            <span className="text-muted">Kargo</span>
            <span>Ücretsiz</span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-display text-lg">Toplam</span>
            <span className="text-lg tabular-nums">
              {formatPrice(summary.total, "TRY")}
            </span>
          </div>

          {blocked ? (
            <Link
              href="/cart"
              className="mt-6 block rounded-full border border-line px-7 py-3 text-center text-sm transition-colors hover:border-ink"
            >
              Sepete dön
            </Link>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function Field({
  name,
  label,
  hint,
  ...input
}: {
  name: string;
  label: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-sm text-muted">
        {label}
      </label>
      <input
        id={name}
        name={name}
        required
        aria-describedby={hint ? `${name}-hint` : undefined}
        className={FIELD}
        {...input}
      />
      {hint ? (
        <p id={`${name}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

// The label already changes; the ring says the wait is the site's, not theirs.
function Busy({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Spinner />
      {label}
    </span>
  );
}
