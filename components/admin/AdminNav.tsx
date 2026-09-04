import Link from "next/link";

// The panel's three sections.
//
// Orders is the reason it exists; stock is the number that changes every week;
// the blog is the writing. Adding and removing products, and comments on posts,
// were both considered and dropped — rare enough or far enough off that a
// section for them would be a door onto an empty room.
//
// A horizontal, scrollable strip so it stays usable one-handed on a phone
// without wrapping into something that pushes the content off the screen.

const SECTIONS = [
  { label: "Siparişler", href: "/admin" },
  { label: "Stok", href: "/admin/stock" },
  { label: "Blog", href: "/admin/blog" },
] as const;

export function AdminNav({ active }: { active: string }) {
  return (
    <nav aria-label="Yönetim menüsü" className="-mx-5 md:mx-0">
      <ul className="flex gap-2 overflow-x-auto px-5 pb-1 md:px-0">
        {SECTIONS.map((section) => {
          const isActive = section.href === active;

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
