"use client";

import { useState } from "react";

// An IBAN is 26 characters that have to be transcribed exactly. Selecting it by
// hand on a phone, in a banking app, is where a digit gets lost — so there is a
// button.
export function CopyIban({ iban }: { iban: string }) {
  const [copied, setCopied] = useState(false);

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
              setTimeout(() => setCopied(false), 2000);
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
