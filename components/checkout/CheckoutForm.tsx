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
import { PROVINCES_SORTED } from "@/lib/provinces";
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
    if (state?.status === "placed") {
      clear();
      router.push(`/orders/${state.code}`);
    }
  }, [state, clear, router]);

  // Straight to the first thing that needs fixing. On a form this long the
  // problem is usually above or below the fold, not where they are looking.
  useEffect(() => {
    if (state?.status !== "error") return;

    const first = document.querySelector<HTMLElement>('[aria-invalid="true"]');
    first?.focus();
    first?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [state]);

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
          className="mt-6 inline-block rounded-full bg-ink px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-clay"
        >
          Bilekliklere göz at
        </Link>
      </div>
    );
  }

  const failed = state?.status === "error" ? state : null;
  const blocked = summary.problems.length > 0;

  // The action resolves the moment the order exists, but the page it leads to
  // has to load before anything changes on screen. Without this the button
  // springs back to "Siparişi tamamla" and the wait looks like a dead click.
  const placed = state?.status === "placed";

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
      <form action={formAction} className="flex flex-col gap-5" noValidate>
        <div>
          <h2 className="font-display text-xl">Teslimat bilgileri</h2>
          <p className="mt-1 text-sm text-muted">
            Yalnızca Türkiye içine gönderim yapılmaktadır.
          </p>
        </div>

        <Field
          name="fullName"
          label="Ad soyad"
          autoComplete="name"
          defaultValue={failed?.values.fullName}
          error={failed?.fieldErrors.fullName}
        />
        <Field
          name="phone"
          label="Telefon"
          type="tel"
          autoComplete="tel"
          placeholder="05XX XXX XX XX"
          hint="Kargo şirketi size bu numaradan ulaşır."
          defaultValue={failed?.values.phone}
          error={failed?.fieldErrors.phone}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            name="city"
            label="İl"
            options={PROVINCES_SORTED}
            autoComplete="address-level1"
            defaultValue={failed?.values.city}
            error={failed?.fieldErrors.city}
          />
          <Field
            name="district"
            label="İlçe"
            autoComplete="address-level2"
            defaultValue={failed?.values.district}
            error={failed?.fieldErrors.district}
          />
        </div>

        <Field
          name="address"
          label="Açık adres"
          multiline
          autoComplete="street-address"
          defaultValue={failed?.values.address}
          error={failed?.fieldErrors.address}
        />

        {/* Anything not about one field sits where the button is, because that
            is where somebody is looking when they press it. */}
        {failed?.message ? (
          <p
            role="alert"
            className="rounded-2xl border border-clay/40 bg-clay/10 px-4 py-3 text-sm leading-relaxed text-clay"
          >
            {failed.message}
            {/* A way there, not just the news. Somebody told they have an
                unpaid order should not have to go and find it. */}
            {failed.unpaidCode ? (
              <>
                {" "}
                <Link
                  href={`/orders/${failed.unpaidCode}`}
                  className="text-ink underline underline-offset-4"
                >
                  Siparişi görüntüle
                </Link>
              </>
            ) : null}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending || placed || blocked}
          className="mt-2 rounded-full bg-ink px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-clay disabled:bg-line disabled:text-muted"
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
              className="mt-4 rounded-2xl border border-line bg-cream px-4 py-3 text-sm leading-relaxed text-clay"
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
  error,
  multiline,
  options,
  ...input
}: {
  name: string;
  label: string;
  hint?: string;
  error?: string;
  multiline?: boolean;
  // A fixed list turns the field into a dropdown, so nothing else can be typed.
  options?: readonly string[];
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const hintId = hint ? `${name}-hint` : null;
  const errorId = error ? `${name}-error` : null;
  const described = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  const shared = {
    id: name,
    name,
    required: true,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": described,
    className: `${FIELD} ${error ? "border-clay" : ""}`,
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-sm text-muted">
        {label}
      </label>

      {options ? (
        // FIELD strips the native arrow, so the dropdown draws its own.
        <div className="relative">
          <select
            defaultValue={input.defaultValue ?? ""}
            autoComplete={input.autoComplete}
            {...shared}
            className={`${shared.className} pr-10`}
          >
            <option value="" disabled>
              Seçin
            </option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          >
            <path
              d="M5 7.5 10 12.5 15 7.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : multiline ? (
        <textarea rows={3} defaultValue={input.defaultValue} {...shared} />
      ) : (
        <input {...shared} {...input} />
      )}

      {/* Under the field, not at the top of the form: the message has to be
          where the thing it is about is. */}
      {error ? (
        <p id={errorId!} role="alert" className="text-sm text-clay">
          {error}
        </p>
      ) : null}

      {hint ? (
        <p id={hintId!} className="text-sm text-muted">
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
