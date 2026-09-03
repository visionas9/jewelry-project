"use client";

import { useEffect, useRef, useState } from "react";

// A value she has to move somewhere else — a phone number into a call, an
// address into a courier form — with a button so it is not transcribed by hand
// off a phone screen. The same shape as CopyIban at checkout.
export function CopyField({
  label,
  value,
  copyText,
}: {
  label: string;
  value: React.ReactNode;
  // What actually lands on the clipboard, when it differs from what is shown
  // (a phone number without its spaces, say).
  copyText: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-0.5 text-sm leading-relaxed break-words">{value}</p>
      </div>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(copyText);
            setCopied(true);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => setCopied(false), 2000);
          } catch {
            // Clipboard denied or an insecure context. The value is on screen
            // anyway, so there is nothing to recover from.
          }
        }}
        className="shrink-0 rounded-full border border-line px-4 py-1.5 text-xs transition-colors hover:border-ink"
      >
        {copied ? "Kopyalandı" : "Kopyala"}
      </button>
    </div>
  );
}
