import Link from "next/link";

import { formatDate, formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABELS, type OrderSummary } from "@/lib/orders";

export function OrderHistory({ orders }: { orders: OrderSummary[] }) {
  if (orders.length === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-line px-5 py-6">
        <h2 className="font-display text-xl">Siparişleriniz</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Henüz siparişiniz yok. Verdiğiniz siparişler, durumları ve ödeme
          bilgileriyle birlikte burada listelenir.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-line px-5 py-6">
      <h2 className="font-display text-xl">Siparişleriniz</h2>

      <ul className="mt-4 flex flex-col gap-3">
        {orders.map((order) => (
          <li key={order.code}>
            {/* The whole row is the link: on a phone there is no hover, and a
                small "detay" link is a small target. */}
            <Link
              href={`/orders/${order.code}`}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-2xl border border-line px-4 py-4 transition-colors hover:border-ink"
            >
              <span className="text-sm">
                {order.code}
                <span className="text-muted">
                  {" · "}
                  {formatDate(order.placedAt)}
                  {" · "}
                  {order.itemCount} ürün
                </span>
              </span>

              <span className="flex items-baseline gap-4 text-sm">
                <span
                  className={
                    order.status === "cancelled" ? "text-muted" : "text-brass"
                  }
                >
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
                <span className="tabular-nums">
                  {formatPrice(order.total, "TRY")}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
