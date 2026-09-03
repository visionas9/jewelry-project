import Link from "next/link";

import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/orders";
import type { OrderFilter } from "@/lib/admin-orders";

// Filter by state, and find one order by its code. Both live in the URL, so a
// filtered view can be bookmarked or shared, and the page stays a server
// component with no JavaScript of its own — the chips are links and the search
// is a plain GET form, which is what keeps it working one-handed on a phone.

const FILTERS: { value: OrderFilter; label: string }[] = [
  { value: "all", label: "Tümü" },
  ...(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((status) => ({
    value: status,
    label: ORDER_STATUS_LABELS[status],
  })),
];

// A link back to /admin carrying whatever is not the default. filter=all and an
// empty search are the absence of a parameter, so they are left off — a bare
// /admin is the clean, unfiltered view.
function href(filter: OrderFilter, search: string) {
  const params = new URLSearchParams();

  if (filter !== "all") params.set("filter", filter);
  if (search !== "") params.set("q", search);

  const query = params.toString();

  return query ? `/admin?${query}` : "/admin";
}

export function OrderFilters({
  filter,
  search,
}: {
  filter: OrderFilter;
  search: string;
}) {
  return (
    <div className="mt-6 flex flex-col gap-4">
      {/* method="get" so the form's only effect is a new URL — no action, no
          JavaScript. The current filter rides along as a hidden field so a
          search does not throw away which state she was looking at. */}
      <form method="get" role="search" className="flex gap-2">
        {filter !== "all" ? (
          <input type="hidden" name="filter" value={filter} />
        ) : null}
        <input
          type="search"
          name="q"
          defaultValue={search}
          inputMode="numeric"
          placeholder="Sipariş kodu ara — örn. IS-00001"
          aria-label="Sipariş kodu ara"
          className="w-full rounded-full border border-line bg-cream px-5 py-2.5 text-sm outline-none focus:border-ink"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-ink px-5 py-2.5 text-sm tracking-wide text-cream transition-colors hover:bg-brass"
        >
          Ara
        </button>
      </form>

      <div className="-mx-5 md:mx-0">
        <ul className="flex gap-2 overflow-x-auto px-5 pb-1 md:px-0">
          {FILTERS.map((option) => {
            const isActive = option.value === filter;

            return (
              <li key={option.value} className="shrink-0">
                <Link
                  href={href(option.value, search)}
                  aria-current={isActive ? "true" : undefined}
                  className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm transition-colors ${
                    isActive
                      ? "border-ink bg-ink text-cream"
                      : "border-line text-muted hover:border-ink hover:text-ink"
                  }`}
                >
                  {option.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
