"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";

type NavLink = { href: string; label: string };

// The links arrive as a prop rather than from lib/site: that module reads
// process.env for the site URL, and pulling it into a client bundle is the
// mistake its own comment warns about.
export function NavMenu({ links }: { links: readonly NavLink[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  // Escape closes it. Only listens while open, so a shut menu adds nothing to
  // the page's keyboard handling.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
        className="flex size-10 items-center justify-center rounded-full text-ink transition-colors hover:text-clay"
      >
        {open ? <CloseIcon /> : <BurgerIcon />}
      </button>

      {/* Below the header rather than inside it: the header is sticky and the
          panel should hang off it, not push the page down as it opens. */}
      <div
        id={panelId}
        hidden={!open}
        className="absolute inset-x-0 top-full border-b border-line bg-cream/95 backdrop-blur-sm"
      >
        <nav aria-label="Ana menü" className="mx-auto max-w-6xl px-5 md:px-8">
          <ul className="flex flex-col py-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  // Closing on the link itself, not on a pathname effect: this
                  // is the only way the menu is ever navigated away from.
                  onClick={() => setOpen(false)}
                  className="flex items-center border-b border-line/60 py-4 text-base text-muted transition-colors last:border-0 hover:text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
}

function BurgerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
