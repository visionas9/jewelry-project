"use client";

import { useState } from "react";

import { INVOICE_BUCKET, invoicePath } from "@/lib/invoices-paths";
import { createBrowserSupabase } from "@/lib/supabase-browser";

// Picking the fatura PDF.
//
// The file goes straight from her browser into the private bucket — it never
// passes through our server, because the bucket's policy already asks whether
// this session is the administrator. What the form submits is the path it
// landed at, not the file.
//
// Used in two places: beside "Ödemeyi aldım", and on its own further down the
// page for an invoice issued the next morning.
export function InvoiceUpload({
  code,
  onUploaded,
  path,
}: {
  code: string;
  onUploaded: (path: string | null) => void;
  /** Where the current pick landed, so the caller owns the value. */
  path: string | null;
}) {
  const [supabase] = useState(() => createBrowserSupabase());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);

    if (file.type !== "application/pdf") {
      setBusy(false);
      setError("Fatura PDF olmalı.");
      return;
    }

    const target = invoicePath(code);
    const { error: failed } = await supabase.storage
      .from(INVOICE_BUCKET)
      .upload(target, file, { upsert: false, contentType: "application/pdf" });

    setBusy(false);

    if (failed) {
      setError("Fatura yüklenemedi. Lütfen tekrar deneyin.");
      return;
    }

    onUploaded(target);
  }

  return (
    <div className="text-sm">
      <input type="hidden" name="invoice_path" value={path ?? ""} />

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept="application/pdf"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) upload(file);
          }}
          aria-label="Fatura PDF dosyası"
          className="text-sm text-muted file:mr-3 file:rounded-full file:border file:border-line file:bg-cream file:px-4 file:py-2 file:text-sm file:text-ink"
        />
        {path ? (
          <button
            type="button"
            onClick={() => onUploaded(null)}
            className="rounded-full border border-line px-4 py-1.5 text-xs transition-colors hover:border-ink"
          >
            Kaldır
          </button>
        ) : null}
      </div>

      <p role="status" aria-live="polite" className="mt-2 text-sm text-muted">
        {busy ? "Yükleniyor…" : path ? "Fatura hazır, kaydedilecek." : ""}
      </p>
      <p role="alert" className={`text-sm text-clay ${error ? "" : "sr-only"}`}>
        {error ?? ""}
      </p>
    </div>
  );
}
