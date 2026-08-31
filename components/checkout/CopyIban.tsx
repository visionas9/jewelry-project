"use client";

import { useEffect, useRef, useState } from "react";

// An IBAN is 26 characters that have to be transcribed exactly. Selecting it by
// hand on a phone, in a banking app, is where a digit gets lost — so there is a
// button.
export function CopyIban({ iban }: { iban: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleared on the way out, and on every new click below. Without the second
  // one, copying twice inside two seconds lets the first timer fire after the
  // second click and reset the label while it should still read "Kopyalandı".
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div className="mt-5">
      <p className="text-sm text-muted">IBAN</p>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <code className="rounded-2xl border border-line bg-cream px-4 py-3 text-sm tracking-wide">
          {iban}
        </code>

        <button
          type="button"
          onClick={async () => {
            try {
              // Spaces are for reading. What goes in the banking app should be
              // the number itself.
              await navigator.clipboard.writeText(iban.replace(/\s/g, ""));
              setCopied(true);

              if (timer.current) clearTimeout(timer.current);
              timer.current = setTimeout(() => setCopied(false), 2000);
            } catch {
              // Denied clipboard permission, or an insecure context. The IBAN
              // is on screen either way, so there is nothing to recover from.
            }
          }}
          className="rounded-full border border-line px-5 py-2 text-sm transition-colors hover:border-ink"
        >
          {copied ? "Kopyalandı" : "Kopyala"}
        </button>
      </div>
    </div>
  );
}
