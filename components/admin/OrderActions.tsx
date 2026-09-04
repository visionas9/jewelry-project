"use client";

import { useActionState, useState } from "react";

import { perform } from "@/app/admin/orders/[code]/actions";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { InvoiceUpload } from "@/components/admin/InvoiceUpload";
import { CARRIERS } from "@/lib/carriers";
import { type OrderStatus } from "@/lib/orders";

// The buttons that move an order along.
//
// One useActionState feeds every form here, so the "what happened" line survives
// the status changing underneath it — the component is not remounted, so the
// message from the move she just made is still on screen when the next state's
// button appears. Each form's own busy state comes from useFormStatus inside
// SubmitButton, so only the button she pressed spins.
//
// Nothing here is trusted to be right: the server re-checks that she is the
// administrator and the database refuses regardless. This decides what to show,
// not what is allowed.

const FIELD =
  "w-full rounded-2xl border border-line bg-cream px-4 py-3 text-base outline-none focus:border-ink";

// The one expected forward move for each live state. Terminal states have none.
const MAIN: Partial<Record<OrderStatus, { intent: string; label: string }>> = {
  pending: { intent: "paid", label: "Ödemeyi aldım" },
  paid: { intent: "shipped", label: "Kargoya verdim" },
  shipped: { intent: "delivered", label: "Teslim edildi" },
};

const MAIN_BUTTON =
  "w-full rounded-full bg-ink px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-clay disabled:bg-line disabled:text-muted";

const QUIET_BUTTON =
  "w-full rounded-full border border-clay/50 px-7 py-3 text-sm tracking-wide text-clay transition-colors hover:bg-clay/10 disabled:border-line disabled:text-muted";

export function OrderActions({
  code,
  status,
}: {
  code: string;
  status: OrderStatus;
}) {
  const [state, formAction] = useActionState(perform.bind(null, code), null);
  // Where the fatura landed, if she picked one. Held here rather than in the
  // upload control so the form can submit it alongside the transition.
  const [invoice, setInvoice] = useState<string | null>(null);

  const main = MAIN[status];
  const canCancel = status === "pending" || status === "paid";

  return (
    <div className="mt-8">
      {/* Both endings land here. Green-ish for done, clay for a refusal — and
          read aloud either way. */}
      <p
        role="status"
        aria-live="polite"
        className={`text-sm ${
          state ? (state.ok ? "text-ink" : "text-clay") : "sr-only"
        }`}
      >
        {state?.message ?? ""}
      </p>

      {main ? (
        <form action={formAction} className="mt-3 flex flex-col gap-3">
          <input type="hidden" name="intent" value={main.intent} />

          {/* The fatura, in the same step as the payment. Optional: she can
              mark an order paid at eleven at night and issue the invoice in the
              morning, and attach it further down this page then. */}
          {status === "pending" ? (
            <div className="flex flex-col gap-2 rounded-2xl border border-line bg-sand/50 p-4">
              <span className="text-sm text-muted">Fatura (isteğe bağlı)</span>
              <InvoiceUpload code={code} path={invoice} onUploaded={setInvoice} />
              <p className="text-xs leading-relaxed text-muted">
                Eklerseniz “Ödemeniz alındı” e-postasına iliştirilir ve müşterinin
                sipariş sayfasında görünür.
              </p>
            </div>
          ) : null}

          {/* Shipping is the one move that carries information — the courier and
              the number the buyer will chase — so it asks for both in the same
              step rather than after the fact. */}
          {status === "paid" ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-line bg-sand/50 p-4">
              <label className="text-sm">
                <span className="text-muted">Kargo firması</span>
                {/* Chosen, not typed. A native select is also the one control
                    a phone renders as a full-screen picker, which is easier
                    one-handed than a keyboard. */}
                <select
                  name="carrier"
                  required
                  defaultValue=""
                  className={`${FIELD} mt-1`}
                >
                  <option value="" disabled>
                    Seçiniz
                  </option>
                  {CARRIERS.map((carrier) => (
                    <option key={carrier} value={carrier}>
                      {carrier}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                <span className="text-muted">Takip numarası</span>
                <input
                  name="tracking_number"
                  required
                  inputMode="numeric"
                  placeholder="örn. 1234567890"
                  className={`${FIELD} mt-1`}
                />
              </label>
            </div>
          ) : null}

          <SubmitButton pendingLabel="İşleniyor…" className={MAIN_BUTTON}>
            {main.label}
          </SubmitButton>
        </form>
      ) : (
        <p className="mt-3 rounded-2xl border border-line bg-sand/50 px-5 py-4 text-sm text-muted">
          {status === "delivered"
            ? "Sipariş teslim edildi. Yapılacak başka işlem yok."
            : "Sipariş iptal edildi. Yapılacak başka işlem yok."}
        </p>
      )}

      {/* The exception, kept away from the main button and folded shut so it is
          never the thing pressed by reflex. Opening it explains what it does —
          the stock goes back — before the button appears. */}
      {canCancel ? (
        <details className="mt-6 border-t border-line pt-5">
          <summary className="cursor-pointer list-none text-sm text-muted hover:text-ink">
            Siparişi iptal et
          </summary>
          <div className="mt-4">
            <p className="text-sm leading-relaxed text-muted">
              İptal edilirse siparişin aldığı stok rafa geri eklenir. Ödeme
              alındı olarak işaretlenmiş bir siparişi de buradan iptal
              edebilirsiniz — yanlış işaretlenmişse düzeltmenin yolu budur.
            </p>
            <form action={formAction} className="mt-4">
              <input type="hidden" name="intent" value="cancel" />
              <SubmitButton
                pendingLabel="İptal ediliyor…"
                className={QUIET_BUTTON}
              >
                İptal et ve stoğu geri koy
              </SubmitButton>
            </form>
          </div>
        </details>
      ) : null}
    </div>
  );
}
