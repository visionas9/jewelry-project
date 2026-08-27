"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { STONES } from "@/lib/stones";

const DEBOUNCE_MS = 300;

// The URL is the source of truth for the filters — share the link and the same
// results come back, and back/forward work. This component only writes to it.
export function ProductFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlQuery = searchParams.get("query") ?? "";
  const activeStone = searchParams.get("stone");

  // Local state so typing stays instant. The URL catches up after the debounce.
  const [query, setQuery] = useState(urlQuery);
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);
  const [isPending, startTransition] = useTransition();

  // Keeps the input honest when the URL changes from outside this component —
  // the back button, or the "clear filters" link in the empty state. Adjusting
  // state during render rather than in an effect: React restarts the render
  // immediately instead of painting the stale value first.
  if (urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery);
    setQuery(urlQuery);
  }

  // Waits for a pause in typing before touching the URL. Without this, every
  // keystroke would be a history entry and a database query.
  useEffect(() => {
    if (query === urlQuery) return;

    const timer = setTimeout(() => {
      startTransition(() => {
        router.replace(buildHref({ searchParams, key: "query", value: query }), {
          scroll: false,
        });
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, urlQuery, router, searchParams]);

  function setStone(value: string) {
    // Clicking the active stone clears it — the pills act like a toggle.
    const next = value === activeStone ? "" : value;
    startTransition(() => {
      router.replace(buildHref({ searchParams, key: "stone", value: next }), {
        scroll: false,
      });
    });
  }

  const hasFilters = urlQuery !== "" || activeStone !== null;

  return (
    <div className="mt-8 flex flex-col gap-5">
      <div className="relative max-w-sm">
        <label htmlFor="product-search" className="sr-only">
          Bileklik ara
        </label>
        <input
          id="product-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Bileklik ara…"
          className="w-full rounded-full border border-line bg-cream px-5 py-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-ink"
        />
        {isPending ? (
          <span className="absolute top-1/2 right-5 -translate-y-1/2 text-xs text-muted">
            …
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STONES.map((stone) => {
          const isActive = stone.value === activeStone;
          return (
            <button
              key={stone.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => setStone(stone.value)}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                isActive
                  ? "border-ink bg-ink text-cream"
                  : "border-line text-muted hover:border-ink hover:text-ink"
              }`}
            >
              {stone.label}
            </button>
          );
        })}

        {hasFilters ? (
          <button
            type="button"
            onClick={() =>
              startTransition(() => {
                router.replace(pathname, { scroll: false });
              })
            }
            className="ml-1 text-sm text-muted underline underline-offset-4 transition-colors hover:text-ink"
          >
            Temizle
          </button>
        ) : null}
      </div>
    </div>
  );
}

// Copy the current params, set or drop one key, and return the new URL.
function buildHref({
  searchParams,
  key,
  value,
}: {
  searchParams: URLSearchParams;
  key: string;
  value: string;
}) {
  const params = new URLSearchParams(searchParams);

  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "?";
}
