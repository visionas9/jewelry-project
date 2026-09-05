"use client";

import { useActionState, useState } from "react";

import { attachInvoice, type ActionResult } from "@/app/admin/orders/[code]/actions";
import { InvoiceUpload } from "@/components/admin/InvoiceUpload";
import { SubmitButton } from "@/components/ui/SubmitButton";

// Attaching a fatura after the payment mail has already gone.
//
// Its own section rather than part of the move-it-along form, because it is not
// a transition: the order does not change state, a document arrives. Sending it
// mails the invoice on its own — telling somebody a second time that their
// money arrived would read as a second charge.
export function AttachInvoice({
  code,
  hasInvoice,
}: {
  code: string;
  hasInvoice: boolean;
}) {
  const [path, setPath] = useState<string | null>(null);
  const [state, formAction] = useActionState<ActionResult, FormData>(
    attachInvoice.bind(null, code),
    null
  );

  return (
    <div className="mt-6 rounded-2xl border border-line px-5 py-6">
      <h2 className="font-display text-xl">Fatura</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {hasInvoice
          ? "Bu siparişin faturası yüklü. Yeni bir dosya yüklerseniz eskisinin yerine geçer ve müşteriye tekrar gönderilir."
          : "Faturayı yükleyip müşteriye gönderebilirsiniz. Ödeme e-postası çoktan gittiyse fatura ayrı bir e-postayla iletilir."}
      </p>

      <form action={formAction} className="mt-4 flex flex-col gap-4">
        <InvoiceUpload code={code} path={path} onUploaded={setPath} />

        <p
          role="status"
          aria-live="polite"
          className={`text-sm ${
            state ? (state.ok ? "text-ink" : "text-clay") : "sr-only"
          }`}
        >
          {state?.message ?? ""}
        </p>

        <SubmitButton
          pendingLabel="Gönderiliyor…"
          className="self-start rounded-full border border-line px-7 py-3 text-sm transition-colors hover:border-ink disabled:text-muted"
        >
          Faturayı kaydet ve gönder
        </SubmitButton>
      </form>
    </div>
  );
}
