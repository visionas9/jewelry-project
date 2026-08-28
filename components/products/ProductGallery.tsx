"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// "use client" lives here and nowhere else on the product pages.
// Only reason: the arrows and dots need a DOM ref to scroll and measure the strip.
// Swiping itself is CSS scroll-snap and works with JS disabled.
export function ProductGallery({
  images,
  name,
  href,
  showDots = false,
  preload = false,
}: {
  images: string[];
  name: string;
  /** Wraps each slide in a link. Omit on the detail page — we're already there. */
  href?: string;
  showDots?: boolean;
  /** Only the first slide gets it, and only where the gallery is the LCP. */
  preload?: boolean;
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const hasMany = images.length > 1;
  const atStart = index === 0;
  const atEnd = index === images.length - 1;

  function goTo(next: number) {
    const strip = stripRef.current;
    if (!strip) return;
    strip.scrollTo({ left: next * strip.clientWidth, behavior: "smooth" });
  }

  function handleScroll() {
    const strip = stripRef.current;
    if (!strip) return;
    setIndex(Math.round(strip.scrollLeft / strip.clientWidth));
  }

  const arrowBase = [
    "absolute top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full",
    "border border-line/70 bg-cream/70 text-ink/70 shadow-sm backdrop-blur-sm",
    "transition duration-200 hover:bg-cream hover:text-ink",
    "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
    "disabled:pointer-events-none disabled:opacity-0",
  ].join(" ");

  return (
    <div>
      <div className="relative">
        <div
          ref={stripRef}
          onScroll={hasMany ? handleScroll : undefined}
          className={[
            "flex snap-x snap-mandatory rounded-lg bg-sand",
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
            hasMany ? "overflow-x-auto" : "overflow-x-hidden",
          ].join(" ")}
        >
          {images.map((src, i) => {
            const slide = (
              <Image
                src={src}
                alt={i === 0 ? name : ""}
                fill
                preload={preload && i === 0}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            );
            const slideClass =
              "relative aspect-[4/5] w-full shrink-0 snap-center";

            return href ? (
              <Link
                key={src}
                href={href}
                aria-label={name}
                tabIndex={i === 0 ? 0 : -1}
                className={slideClass}
              >
                {slide}
              </Link>
            ) : (
              <div key={src} className={slideClass}>
                {slide}
              </div>
            );
          })}
        </div>

        {hasMany && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              disabled={atStart}
              aria-label="Önceki fotoğraf"
              className={`${arrowBase} left-3`}
            >
              <Chevron className="-ml-0.5 rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              disabled={atEnd}
              aria-label="Sonraki fotoğraf"
              className={`${arrowBase} right-3`}
            >
              <Chevron className="-mr-0.5" />
            </button>
          </>
        )}
      </div>

      {hasMany && showDots && (
        <div className="mt-4 flex justify-center gap-2">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`${i + 1}. fotoğrafa git`}
              aria-current={i === index}
              className={[
                "h-1.5 rounded-full transition-all duration-300",
                i === index ? "w-6 bg-brass" : "w-1.5 bg-line hover:bg-muted",
              ].join(" ")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Chevron({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-4 w-4 ${className ?? ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}
