"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchField } from "@/components/search/SearchField";
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
    <div className="mt-8 flex flex-col gap-3 border-b border-line pb-8 md:mt-10">
      <div className="mb-2 max-w-sm">
        <SearchField
          id="product-search"
          label="Bileklik ara"
          value={query}
          onChange={setQuery}
          onClear={() => setQuery("")}
          isPending={isPending}
        />
      </div>

      {/* Names what the pills do. Without it a screen reader announces six bare
          stone names with no clue they're filters. */}
      <p
        id="stone-filter-label"
        className="text-xs tracking-[0.2em] text-muted uppercase"
      >
        Taş
      </p>

      {/* Horizontal scroll rather than wrapping: on a narrow phone six pills
          wrap to three rows and push the grid off the screen. */}
      <div className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div
          role="group"
          aria-labelledby="stone-filter-label"
          className="flex w-max items-center gap-2 md:w-auto md:flex-wrap"
        >
          {STONES.map((stone) => {
            const isActive = stone.value === activeStone;
            return (
              <button
                key={stone.value}
                type="button"
                aria-pressed={isActive}
                onClick={() => setStone(stone.value)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
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
              className="shrink-0 pl-2 text-sm text-muted underline underline-offset-4 transition-colors hover:text-ink"
            >
              Temizle
            </button>
          ) : null}
        </div>
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
