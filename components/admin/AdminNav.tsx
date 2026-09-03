import Link from "next/link";

// The shape of the panel to come. Only Siparişler works today; the rest are
// shown so it is clear what this grows into, but they are plain text, not links
// — there is no half-built page behind them to fall into.
//
// Rendered as a horizontal, scrollable strip so it stays usable one-handed on a
// phone without wrapping into something that pushes the orders off the screen.

const SECTIONS = [
  { label: "Siparişler", href: "/admin" as const, ready: true },
  { label: "Stok", ready: false },
  { label: "Ürünler", ready: false },
  { label: "Blog", ready: false },
  { label: "Yorumlar", ready: false },
] as const;

export function AdminNav({ active }: { active: string }) {
  return (
    <nav aria-label="Yönetim menüsü" className="-mx-5 md:mx-0">
      <ul className="flex gap-2 overflow-x-auto px-5 pb-1 md:px-0">
        {SECTIONS.map((section) => {
          const isActive = section.ready && section.href === active;

          if (!section.ready) {
            return (
              <li key={section.label} className="shrink-0">
                <span
                  aria-disabled="true"
                  className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-muted/70"
                >
                  {section.label}
                  <span className="rounded-full bg-sand px-2 py-0.5 text-[0.65rem] tracking-wide text-muted">
                    yakında
                  </span>
                </span>
              </li>
            );
          }

          return (
            <li key={section.label} className="shrink-0">
              <Link
                href={section.href}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex items-center rounded-full border px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? "border-ink bg-ink text-cream"
                    : "border-line text-muted hover:border-ink hover:text-ink"
                }`}
              >
                {section.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
