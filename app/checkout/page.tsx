import type { Metadata } from "next";
import { Suspense } from "react";

import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { requireMember } from "@/lib/auth-guard";
import { ORDERS_CLOSED, ordersOpen } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Sipariş",
  // Nothing here is meant for a search result — it only means anything with a
  // cart behind it.
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-14 md:px-8 md:py-20">
      <h1 className="font-display text-3xl md:text-4xl">Siparişi tamamlayın</h1>

      <p className="mt-3 text-sm leading-relaxed text-muted">
        Teslimat bilgilerinizi yazın. Ödeme, sipariş kodunuzla havale/EFT
        yoluyla yapılır.
      </p>

      <CheckoutSteps current={2} />

      {/* The guard is inside its own boundary so the heading above still
          prerenders. Ordering belongs to one member, so this page cannot be
          shown to a stranger — but it can be *started* for one. */}
      <Suspense fallback={<Placeholder />}>
        <Guarded />
      </Suspense>
    </section>
  );
}

async function Guarded() {
  await requireMember("/checkout");

  // The database refuses the order anyway; this spares filling in a form first.
  if (!(await ordersOpen())) {
    return (
      <p className="mt-10 rounded-2xl border border-line bg-sand/50 px-5 py-4 text-sm leading-relaxed">
        {ORDERS_CLOSED}
      </p>
    );
  }

  return <CheckoutForm />;
}

function Placeholder() {
  return (
    <div aria-hidden="true" className="mt-10 animate-pulse space-y-4">
      <div className="h-24 rounded-2xl bg-sand" />
      <div className="h-64 rounded-2xl bg-sand" />
    </div>
  );
}
