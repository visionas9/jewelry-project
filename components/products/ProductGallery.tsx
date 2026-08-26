"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// "use client" lives here and nowhere else on the products page.
// Only reason: the arrows need a DOM ref to scroll the strip.
// The card's name/price stay server-rendered.
export function ProductGallery({
  images,
  name,
  href,
}: {
  images: string[];
  name: string;
  href: string;
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const hasMany = images.length > 1;

  function scrollByOne(direction: -1 | 1) {
    const strip = stripRef.current;
    if (!strip) return;
    strip.scrollBy({ left: direction * strip.clientWidth, behavior: "smooth" });
  }

  function handleScroll() {
    const strip = stripRef.current;
    if (!strip) return;
    const max = strip.scrollWidth - strip.clientWidth;
    setAtStart(strip.scrollLeft <= 1);
    setAtEnd(strip.scrollLeft >= max - 1);
  }

  const arrowBase = [
    "absolute top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full",
    "border border-line/70 bg-cream/70 text-ink/70 shadow-sm backdrop-blur-sm",
    "transition duration-200 hover:bg-cream hover:text-ink",
    "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
    "disabled:pointer-events-none disabled:opacity-0",
  ].join(" ");

  return (
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
        {images.map((src, i) => (
          <Link
            key={src}
            href={href}
            aria-label={name}
            tabIndex={i === 0 ? 0 : -1}
            className="relative aspect-[4/5] w-full shrink-0 snap-center"
          >
            <Image
              src={src}
              alt={i === 0 ? name : ""}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </Link>
        ))}
      </div>

      {hasMany && (
        <>
          <button
            type="button"
            onClick={() => scrollByOne(-1)}
            disabled={atStart}
            aria-label="Önceki fotoğraf"
            className={`${arrowBase} left-3`}
          >
            <Chevron className="-ml-0.5 rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => scrollByOne(1)}
            disabled={atEnd}
            aria-label="Sonraki fotoğraf"
            className={`${arrowBase} right-3`}
          >
            <Chevron className="-mr-0.5" />
          </button>
        </>
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
