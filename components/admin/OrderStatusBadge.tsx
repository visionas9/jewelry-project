import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/orders";

// The state, as a word and a colour. pending is the one that wants doing, so it
// is the one that carries the brass; the finished states are quiet.
const TONE: Record<OrderStatus, string> = {
  pending: "border-brass/40 bg-brass/10 text-brass",
  paid: "border-ink/20 bg-sand text-ink",
  shipped: "border-ink/20 bg-sand text-ink",
  delivered: "border-line bg-sand text-muted",
  cancelled: "border-line bg-transparent text-muted line-through",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs tracking-wide ${TONE[status]}`}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
