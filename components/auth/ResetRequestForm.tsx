"use client";

import Link from "next/link";
import { useActionState } from "react";

import {
  requestPasswordReset,
  type ResetRequestState,
} from "@/app/forgot-password/actions";

// Lives here rather than beside the action: a "use server" module may only
// export async functions, so a plain object exported from actions.ts crashes
// the route at render time.
const INITIAL_STATE: ResetRequestState = { status: "idle" };

const FIELD =
  "w-full appearance-none rounded-2xl border border-line bg-cream px-4 py-3 text-base outline-none transition-colors placeholder:text-muted focus:border-ink";

export function ResetRequestForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    INITIAL_STATE
  );

  if (state.status === "sent") {
    return <CheckYourInbox email={state.email} />;
  }

  const error = state.status === "error" ? state.message : null;

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-5" noValidate>
      <p
        role="alert"
        aria-live="polite"
        className={`text-sm text-brass ${error ? "" : "sr-only"}`}
      >
        {error ?? ""}
      </p>

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm text-muted">
          E-posta
        </label>
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          autoFocus
          defaultValue={state.status === "error" ? state.email : ""}
          aria-invalid={error ? true : undefined}
          placeholder="ornek@eposta.com"
          className={FIELD}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-ink px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-brass disabled:bg-line disabled:text-muted"
      >
        {pending ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
      </button>

      <p className="text-center text-sm text-muted">
        Şifrenizi hatırladınız mı?{" "}
        <Link href="/signin" className="text-ink underline hover:text-brass">
          Giriş yapın
        </Link>
      </p>
    </form>
  );
}

// Careful wording: "if there is an account". The screen must read the same for
// an address that is registered and one that is not, because the whole point
// of answering identically is undone by a screen that says "sent!" only when
// the address is real.
function CheckYourInbox({ email }: { email: string }) {
  return (
    <div className="mt-8 flex flex-col gap-5">
      <div className="rounded-2xl border border-line bg-sand/60 px-5 py-6">
        <h2 className="font-display text-xl">Gelen kutunuzu kontrol edin</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          <span className="text-ink">{email}</span> adresine kayıtlı bir hesap
          varsa, şifre sıfırlama bağlantısını içeren bir e-posta gönderdik.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Bağlantı bir saat boyunca geçerlidir ve yalnızca bir kez
          kullanılabilir.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          E-posta birkaç dakika içinde gelmezse spam klasörünüze bakın.
        </p>
      </div>

      <Link
        href="/signin"
        className="rounded-full border border-line px-7 py-3 text-center text-sm transition-colors hover:border-ink"
      >
        Giriş sayfasına dön
      </Link>
    </div>
  );
}
