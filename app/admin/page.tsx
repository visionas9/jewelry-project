import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { AdminNav } from "@/components/admin/AdminNav";
import { OrderFilters } from "@/components/admin/OrderFilters";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import {
  listAllOrders,
  type AdminOrder,
  type OrderFilter,
} from "@/lib/admin-orders";
import { requireVerifiedAdmin } from "@/lib/admin-guard";
import { formatDate, formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Siparişler",
  // Never indexed, and the panel does not admit it exists. The shell has to be
  // as uninformative as a 404, because that is what everybody else gets.
  robots: { index: false, follow: false },
};

const STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

// A URL is whatever somebody types. Only a real state, or the absence of one.
function readFilter(value: string | undefined): OrderFilter {
  return STATUSES.includes(value as OrderStatus) ? (value as OrderStatus) : "all";
}

export default function AdminOrdersPage(props: PageProps<"/admin">) {
  return (
    <section className="mx-auto max-w-2xl px-5 py-10 md:px-8 md:py-14">
      <Suspense fallback={<Placeholder />}>
        <Orders searchParams={props.searchParams} />
      </Suspense>
    </section>
  );
}

async function Orders({
  searchParams,
}: {
  searchParams: PageProps<"/admin">["searchParams"];
}) {
  // Account, then second factor. A non-administrator was already 404'd; an
  // administrator who has only typed a password is sent to confirm a factor.
  const supabase = await requireVerifiedAdmin();

  const params = await searchParams;
  const filter = readFilter(paramOf(params.filter));
  const search = (paramOf(params.q) ?? "").trim();

  const orders = await listAllOrders(supabase, { filter, search });

  return (
    <>
      <header className="flex items-baseline justify-between gap-4">
        <h1 className="font-display text-3xl md:text-4xl">Siparişler</h1>
      </header>

      <div className="mt-6">
        <AdminNav active="/admin" />
      </div>

      <OrderFilters filter={filter} search={search} />

      <p className="mt-6 text-sm text-muted">
        {orders.length === 0
          ? "Gösterilecek sipariş yok."
          : `${orders.length} sipariş`}
      </p>

      <ul className="mt-4 flex flex-col gap-3">
        {orders.map((order) => (
          <li key={order.code}>
            <OrderCard order={order} />
          </li>
        ))}
      </ul>

      {orders.length === 0 ? <EmptyNote filter={filter} search={search} /> : null}
    </>
  );
}

// One order, legible at a glance: what it is, who it is for, how much, and where
// it is. The whole card is the link into the single-order page, so it is one
// easy tap on a phone.
function OrderCard({ order }: { order: AdminOrder }) {
  return (
    <Link
      href={`/admin/orders/${order.code}`}
      className="block rounded-2xl border border-line bg-cream px-5 py-4 transition-colors hover:border-ink"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-display text-lg tabular-nums">{order.code}</span>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-ink">{order.buyer}</p>
          <p className="mt-0.5 text-xs text-muted">
            {formatDate(order.placedAt)} · {order.itemCount} ürün
          </p>
        </div>
        <span className="shrink-0 tabular-nums">
          {formatPrice(order.total, "TRY")}
        </span>
      </div>
    </Link>
  );
}

function EmptyNote({
  filter,
  search,
}: {
  filter: OrderFilter;
  search: string;
}) {
  const filtered = filter !== "all" || search !== "";

  return (
    <div className="mt-4 rounded-2xl border border-dashed border-line px-5 py-8 text-center text-sm text-muted">
      {filtered ? (
        <>
          Bu aramaya uyan sipariş bulunamadı.{" "}
          <Link href="/admin" className="text-ink underline underline-offset-4">
            Tümünü göster
          </Link>
        </>
      ) : (
        "İlk sipariş geldiğinde burada görünecek."
      )}
    </div>
  );
}

// searchParams gives string | string[] | undefined for each key. A repeated
// key is nobody's real intent here — take the first.
function paramOf(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function Placeholder() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="h-9 w-1/2 rounded-full bg-sand" />
      <div className="mt-6 h-9 w-full rounded-full bg-sand" />
      <div className="mt-6 flex flex-col gap-3">
        <div className="h-24 w-full rounded-2xl bg-sand" />
        <div className="h-24 w-full rounded-2xl bg-sand" />
        <div className="h-24 w-full rounded-2xl bg-sand" />
      </div>
    </div>
  );
}
