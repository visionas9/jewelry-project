// Shared by the route's loading.tsx and the Suspense fallback on the products
// page, so the placeholder is the same shape in both.
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <ul
      aria-hidden="true"
      className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3"
    >
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <div className="aspect-[4/5] animate-pulse rounded-sm bg-sand" />
          <div className="mt-4 flex items-start justify-between gap-4">
            <div className="h-5 w-2/3 animate-pulse rounded-sm bg-sand" />
            <div className="h-4 w-16 shrink-0 animate-pulse rounded-sm bg-sand" />
          </div>
        </li>
      ))}
    </ul>
  );
}
