"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { legalHref } from "@/lib/legal";

const STORAGE_KEY = "ishin-denshin-cookie-notice";

let listeners: (() => void)[] = [];

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((existing) => existing !== listener);
  };
}

function isDismissed() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    // Storage can be blocked outright — private windows, locked-down browsers.
    // Showing the notice every visit is the harmless failure.
    return false;
  }
}

function dismiss() {
  try {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  } catch {
    // Nothing to do: it will be back on the next visit.
  }

  for (const listener of listeners) listener();
}

// A notice rather than a gate: the site sets only the cookies it needs to keep
// you signed in and hold your cart, so there is nothing here to switch off and
// nothing waiting on consent before it loads. Whether it has been dismissed
// lives in the same browser that saw it, which is why it is localStorage and
// not a cookie of its own.
//
// The server snapshot says "dismissed", so the server and the hydration render
// both draw nothing. Anything else would flash the bar at every visitor who
// has already closed it.
export function CookieNotice() {
  const dismissed = useSyncExternalStore(
    subscribe,
    isDismissed,
    () => true
  );

  if (dismissed) return null;

  return (
    <div
      role="region"
      aria-label="Çerez bildirimi"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-cream/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-5 text-sm text-muted md:flex-row md:items-center md:justify-between md:px-8">
        <p className="leading-relaxed">
          Bu sitede yalnızca oturumunuzun ve sepetinizin çalışması için gereken
          zorunlu çerezler kullanılmaktadır. Ayrıntılar için{" "}
          <Link
            href={legalHref("cerez-politikasi")}
            className="text-ink underline underline-offset-4 transition-colors hover:text-clay"
          >
            Çerez Politikası
          </Link>{" "}
          sayfamızı inceleyebilirsiniz.
        </p>

        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 self-start rounded-full bg-ink px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-clay md:self-auto"
        >
          Kabul et
        </button>
      </div>
    </div>
  );
}
