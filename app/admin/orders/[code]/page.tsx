import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CopyField } from "@/components/admin/CopyField";
import { OrderActions } from "@/components/admin/OrderActions";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { requireVerifiedAdmin } from "@/lib/admin-guard";
import { formatDateTime, formatPrice } from "@/lib/format";
import { type OrderStatus } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Sipariş",
  // Never indexed, like the rest of the panel. The shell says nothing anyone
  // who is not the administrator could not already see on a 404.
  robots: { index: false, follow: false },
};

export default function AdminOrderPage(props: PageProps<"/admin/orders/[code]">) {
  return (
    <section className="mx-auto max-w-2xl px-5 py-10 md:px-8 md:py-14">
      <Suspense fallback={<Placeholder />}>
        <Order params={props.params} />
      </Suspense>
    </section>
  );
}

async function Order({
  params,
}: {
  params: PageProps<"/admin/orders/[code]">["params"];
}) {
  const { code } = await params;
  const supabase = await requireVerifiedAdmin();

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, code, status, total, full_name, phone, city, district, address, created_at, paid_at, shipped_at, delivered_at, cancelled_at, carrier, tracking_number"
    )
    .eq("code", code)
    .maybeSingle();

  // A code that names nothing is a 404 here too — the same answer a made-up path
  // gives, which is the whole panel's manner.
  if (!order) notFound();

  const status = order.status as OrderStatus;

  const [{ data: lines }, { data: email }] = await Promise.all([
    supabase
      .from("order_items")
      .select("id, quantity, unit_price, products (name)")
      .eq("order_id", order.id),
    supabase.rpc("order_buyer_email", { order_code: code }),
  ]);

  // Only the timestamps that have actually happened, in the order they happen.
  const timeline: { label: string; at: string; note?: string }[] = [
    { label: "Sipariş verildi", at: order.created_at },
    order.paid_at ? { label: "Ödeme alındı", at: order.paid_at } : null,
    order.shipped_at
      ? {
          label: "Kargoya verildi",
          at: order.shipped_at,
          note: [order.carrier, order.tracking_number].filter(Boolean).join(" · "),
        }
      : null,
    order.delivered_at ? { label: "Teslim edildi", at: order.delivered_at } : null,
    order.cancelled_at ? { label: "İptal edildi", at: order.cancelled_at } : null,
  ].filter((event): event is { label: string; at: string; note?: string } =>
    Boolean(event)
  );

  return (
    <>
      <Link
        href="/admin"
        className="text-sm text-muted transition-colors hover:text-ink"
      >
        ← Siparişler
      </Link>

      <header className="mt-4 flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl tabular-nums md:text-4xl">
          {order.code}
        </h1>
        <OrderStatusBadge status={status} />
      </header>

      {/* The point of the page: move it along. Kept at the top because it is the
          thing she came to do. */}
      <OrderActions code={order.code} status={status} />

      <div className="mt-8 rounded-2xl border border-line px-5 py-6">
        <h2 className="font-display text-xl">Sipariş özeti</h2>
        <ul className="mt-4 flex flex-col gap-3 text-sm">
          {(lines ?? []).map((line) => (
            <li key={line.id} className="flex justify-between gap-4">
              <span className="leading-relaxed">
                {productName(line.products)}
                <span className="text-muted"> × {line.quantity}</span>
              </span>
              <span className="tabular-nums">
                {formatPrice(Number(line.unit_price) * line.quantity, "TRY")}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
          <span className="font-display text-lg">Toplam</span>
          <span className="text-lg tabular-nums">
            {formatPrice(Number(order.total), "TRY")}
          </span>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-line px-5 py-6">
        <h2 className="font-display text-xl">Teslimat ve iletişim</h2>
        <div className="mt-4 flex flex-col gap-4">
          <CopyField label="Alıcı" value={order.full_name} copyText={order.full_name} />
          <CopyField
            label="Telefon"
            value={order.phone}
            // The number a dialler wants — no spaces to trip on.
            copyText={order.phone.replace(/\s/g, "")}
          />
          {email ? (
            <CopyField label="E-posta" value={email} copyText={email} />
          ) : null}
          <CopyField
            label="Adres"
            value={
              <>
                {order.address}
                <br />
                {order.district} / {order.city}
              </>
            }
            copyText={`${order.address}, ${order.district}/${order.city}`}
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-line px-5 py-6">
        <h2 className="font-display text-xl">Geçmiş</h2>
        <ol className="mt-4 flex flex-col gap-3 text-sm">
          {timeline.map((event) => (
            <li key={event.label} className="flex justify-between gap-4">
              <span>
                {event.label}
                {event.note ? (
                  <span className="block text-xs text-muted">{event.note}</span>
                ) : null}
              </span>
              <span className="shrink-0 text-right text-muted">
                {formatDateTime(event.at)}
              </span>
            </li>
          ))}
        </ol>
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
      <div className="h-9 w-1/3 rounded-full bg-sand" />
      <div className="mt-6 h-12 w-full rounded-full bg-sand" />
      <div className="mt-8 h-40 w-full rounded-2xl bg-sand" />
      <div className="mt-6 h-40 w-full rounded-2xl bg-sand" />
    </div>
  );
}
