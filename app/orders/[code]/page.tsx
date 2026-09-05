import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CheckoutSteps } from "@/components/checkout/CheckoutSteps";
import { CopyIban } from "@/components/checkout/CopyIban";
import { requireMember } from "@/lib/auth-guard";
import { BANK } from "@/lib/bank";
import { formatDateTime, formatPrice } from "@/lib/format";
import { invoiceDownloadUrl } from "@/lib/invoices";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Siparişiniz",
  robots: { index: false },
};

// The page somebody lands on straight after ordering, and the one they come
// back to when they finally sit down to make the transfer. Same page both
// times: an order is not a receipt that is read once.
export default function OrderPage(props: PageProps<"/orders/[code]">) {
  return (
    <section className="mx-auto max-w-2xl px-5 py-14 md:px-8 md:py-20">
      <Suspense fallback={<Placeholder />}>
        <Order params={props.params} />
      </Suspense>
    </section>
  );
}

async function Order({ params }: { params: PageProps<"/orders/[code]">["params"] }) {
  const { code } = await params;
  const { supabase } = await requireMember(`/orders/${code}`);

  // No buyer check here, and none needed: the policy on orders only ever
  // returns rows belonging to the session making the request. Somebody else's
  // order code produces nothing, which is the same answer as a code that was
  // never issued.
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, code, status, total, full_name, phone, city, district, address, created_at, paid_at, shipped_at, delivered_at, cancelled_at, carrier, tracking_number, invoice_path"
    )
    .eq("code", code)
    .maybeSingle();

  if (!order) notFound();

  const { data: lines } = await supabase
    .from("order_items")
    .select("id, quantity, unit_price, products (name, slug)")
    .eq("order_id", order.id);

  const waiting = order.status === "pending";

  // Minted per request and good for a few minutes. A link stored in the
  // database would outlive the reason it was created; this one cannot.
  const invoiceUrl = await invoiceDownloadUrl(
    supabase,
    order.code,
    order.invoice_path
  );

  // Only what has actually happened, in the order it happened. The buyer sees
  // the same facts the panel does — nothing is hidden from the person whose
  // parcel it is.
  const timeline: { label: string; at: string }[] = [
    { label: "Siparişiniz alındı", at: order.created_at },
    order.paid_at ? { label: "Ödemeniz alındı", at: order.paid_at } : null,
    order.shipped_at ? { label: "Kargoya verildi", at: order.shipped_at } : null,
    order.delivered_at ? { label: "Teslim edildi", at: order.delivered_at } : null,
    order.cancelled_at ? { label: "İptal edildi", at: order.cancelled_at } : null,
  ].filter((event): event is { label: string; at: string } => Boolean(event));

  return (
    <>
      <h1 className="font-display text-3xl md:text-4xl">
        {waiting ? "Siparişinizi aldık" : "Siparişiniz"}
      </h1>

      <p className="mt-3 text-sm leading-relaxed text-muted">
        Sipariş kodunuz <span className="text-ink">{order.code}</span>. Durum:{" "}
        <span className="text-ink">
          {ORDER_STATUS_LABELS[order.status as OrderStatus]}
        </span>
        .
      </p>

      {/* Only while the transfer is outstanding. Once it has arrived the order
          is not a checkout step any more, it is a parcel on its way. */}
      {waiting ? <CheckoutSteps current={3} /> : null}

      {waiting ? (
        <div className="mt-8 rounded-2xl border border-line bg-sand/60 px-5 py-6">
          <h2 className="font-display text-xl">Ödeme</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Siparişiniz, ödemeniz hesabımıza geçene kadar bekletilir. Havale ya
            da EFT açıklamasına <span className="text-ink">{order.code}</span>{" "}
            yazmanız yeterlidir.
          </p>

          <dl className="mt-5 flex flex-col gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Alıcı</dt>
              <dd className="text-right">{BANK.accountHolder}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Banka</dt>
              <dd className="text-right">{BANK.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Tutar</dt>
              <dd className="text-right tabular-nums">
                {formatPrice(Number(order.total), "TRY")}
              </dd>
            </div>
          </dl>

          <CopyIban iban={BANK.iban} />
        </div>
      ) : null}

      {/* The thing they came back to look up. Given its own block, above the
          summary, because once a parcel is moving the tracking number is the
          only part of this page anybody rereads. */}
      {order.shipped_at && order.tracking_number ? (
        <div className="mt-8 rounded-2xl border border-line bg-sand/60 px-5 py-6">
          <h2 className="font-display text-xl">Kargo</h2>
          <dl className="mt-4 flex flex-col gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Kargo firması</dt>
              <dd className="text-right">{order.carrier}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Takip numarası</dt>
              <dd className="text-right tabular-nums">{order.tracking_number}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Takip numarası kargo firmasının sisteminde birkaç saat içinde
            görünür hale gelir.
          </p>
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-line px-5 py-6">
        <h2 className="font-display text-xl">Sipariş özeti</h2>

        <ul className="mt-4 flex flex-col gap-3 text-sm">
          {(lines ?? []).map((line) => (
            <li key={line.id} className="flex justify-between gap-4">
              <span className="leading-relaxed">
                {/* The name as it is today. The price beside it is the one
                    that was charged, which is why it comes from the line and
                    not from the product. PostgREST types an embedded row as an
                    array, so it is unwrapped rather than trusted to be one. */}
                {productName(line.products)}
                <span className="text-muted"> × {line.quantity}</span>
              </span>
              <span className="tabular-nums">
                {formatPrice(Number(line.unit_price) * line.quantity, "TRY")}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex justify-between border-t border-line pt-4 text-sm">
          <span className="text-muted">Kargo</span>
          <span>Ücretsiz</span>
        </div>

        <div className="mt-3 flex items-baseline justify-between">
          <span className="font-display text-lg">Toplam</span>
          <span className="text-lg tabular-nums">
            {formatPrice(Number(order.total), "TRY")}
          </span>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-line px-5 py-6">
        <h2 className="font-display text-xl">Teslimat</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {order.full_name}
          <br />
          {order.phone}
          <br />
          {order.address}
          <br />
          {order.district} / {order.city}
        </p>
      </div>

      {invoiceUrl ? (
        <div className="mt-6 rounded-2xl border border-line px-5 py-6">
          <h2 className="font-display text-xl">Fatura</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Siparişinizin faturasını buradan indirebilirsiniz.
          </p>
          <a
            href={invoiceUrl}
            className="mt-4 inline-flex items-center justify-center rounded-full border border-line px-7 py-3 text-sm transition-colors hover:border-ink"
          >
            Faturayı indir (PDF)
          </a>
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-line px-5 py-6">
        <h2 className="font-display text-xl">Siparişinizin geçmişi</h2>
        <ol className="mt-4 flex flex-col gap-3 text-sm">
          {timeline.map((event) => (
            <li key={event.label} className="flex justify-between gap-4">
              <span>{event.label}</span>
              <span className="shrink-0 text-right text-muted">
                {formatDateTime(event.at)}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/products"
          className="rounded-full bg-ink px-7 py-3 text-center text-sm tracking-wide text-cream transition-colors hover:bg-clay"
        >
          Alışverişe devam et
        </Link>
        <Link
          href="/account"
          className="rounded-full border border-line px-7 py-3 text-center text-sm transition-colors hover:border-ink"
        >
          Hesabıma git
        </Link>
      </div>
    </>
  );
}

function productName(embedded: unknown): string {
  const row = Array.isArray(embedded) ? embedded[0] : embedded;

  return (row as { name?: string } | null)?.name ?? "Ürün";
}

function Placeholder() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="h-9 w-2/3 rounded-full bg-sand" />
      <div className="mt-5 h-4 w-full rounded-full bg-sand" />
      <div className="mt-8 h-56 w-full rounded-2xl bg-sand" />
      <div className="mt-6 h-40 w-full rounded-2xl bg-sand" />
    </div>
  );
}
