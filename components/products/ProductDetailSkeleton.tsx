// Shared by the route's loading.tsx and the Suspense fallback in page.tsx,
// so both show the same shape.
export function ProductDetailSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-14"
    >
      <div className="aspect-[4/5] animate-pulse rounded-sm bg-sand" />

      <div className="lg:pt-2">
        <div className="h-4 w-32 animate-pulse rounded-sm bg-sand" />
        <div className="mt-4 h-9 w-4/5 animate-pulse rounded-sm bg-sand md:h-11" />
        <div className="mt-5 h-6 w-28 animate-pulse rounded-sm bg-sand" />
        <div className="mt-4 h-4 w-24 animate-pulse rounded-sm bg-sand" />

        <div className="mt-8 space-y-3">
          <div className="h-4 w-full animate-pulse rounded-sm bg-sand" />
          <div className="h-4 w-full animate-pulse rounded-sm bg-sand" />
          <div className="h-4 w-2/3 animate-pulse rounded-sm bg-sand" />
        </div>

        <div className="mt-10 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-6 border-t border-line pt-4">
              <div className="h-4 w-20 shrink-0 animate-pulse rounded-sm bg-sand" />
              <div className="h-4 w-full animate-pulse rounded-sm bg-sand" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
