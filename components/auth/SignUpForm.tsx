"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";

import {
  resendConfirmation,
  signUp,
  type ResendState,
  type SignUpState,
} from "@/app/signup/actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-errors";
import { rememberPendingEmail } from "@/lib/pending-email";

// Lives here rather than beside the action: a "use server" module may only
// export async functions, so a plain object exported from actions.ts crashes
// the route at render time.
const INITIAL_STATE: SignUpState = { status: "idle" };

const FIELD =
  "w-full appearance-none rounded-2xl border border-line bg-cream px-4 py-3 text-base outline-none transition-colors placeholder:text-muted focus:border-ink";

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(
    signUp,
    INITIAL_STATE
  );

  if (state.status === "sent") {
    return <CheckYourInbox email={state.email} />;
  }

  const error = state.status === "error" ? state.message : null;

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-5" noValidate>
      {/* One live region for the whole form rather than one per field. A
          screen reader announcing three separate errors in sequence is worse
          than one sentence, and the action only ever returns one at a time. */}
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
          defaultValue={state.status === "error" ? state.email : ""}
          aria-invalid={error ? true : undefined}
          placeholder="ornek@eposta.com"
          className={FIELD}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm text-muted">
          Şifre
        </label>
        <input
          id="password"
          name="password"
          type="password"
          // "new-password" is what tells a password manager to *offer to
          // generate* one. Plain "password" makes it try to autofill an
          // existing login instead, which is the wrong gesture on a sign-up.
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          aria-describedby="password-hint"
          className={FIELD}
        />
        {/* Stated before the visitor can get it wrong, not after. */}
        <p id="password-hint" className="text-sm text-muted">
          En az {MIN_PASSWORD_LENGTH} karakter olmalı.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-ink px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-brass disabled:bg-line disabled:text-muted"
      >
        {pending ? "Gönderiliyor…" : "Hesap oluştur"}
      </button>

      <p className="text-center text-sm text-muted">
        Hesabınız var mı?{" "}
        <Link href="/signin" className="text-ink underline hover:text-brass">
          Giriş yapın
        </Link>
      </p>
    </form>
  );
}

// The account exists but cannot be used until the link is clicked. Saying that
// plainly is the whole point of this screen — an unconfirmed account that just
// silently fails to sign in is the failure mode this replaces.
function CheckYourInbox({ email }: { email: string }) {
  const resendForEmail = resendConfirmation.bind(null, email);
  const [state, formAction, pending] = useActionState<ResendState>(
    resendForEmail,
    null
  );

  // Left for the sign-in form to pick up. Confirming on a phone cannot sign
  // this browser in — the session is a cookie, and cookies do not travel
  // between devices — so the least this can do is not ask for the address
  // again on the way back.
  useEffect(() => {
    rememberPendingEmail(email);
  }, [email]);

  return (
    <div className="mt-8 flex flex-col gap-5">
      <div className="rounded-2xl border border-line bg-sand/60 px-5 py-6">
        <h2 className="font-display text-xl">Son bir adım</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          <span className="text-ink">{email}</span> adresine bir doğrulama
          bağlantısı gönderdik. Bağlantıya tıklayana kadar hesabınız
          etkinleşmez.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          E-posta birkaç dakika içinde gelmezse spam klasörünüze bakın.
        </p>
        {/* The part that is easy to get wrong: the link can be opened on a
            phone, but doing so signs the phone in and not this browser. Saying
            so here is cheaper than leaving someone staring at this screen
            waiting for it to change on its own. */}
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Bağlantıyı başka bir cihazda açabilirsiniz. Bu durumda doğrulama
          tamamlandıktan sonra bu tarayıcıdan giriş yapmanız gerekir.
        </p>
      </div>

      <Link
        href="/signin"
        className="rounded-full bg-ink px-7 py-3 text-center text-sm tracking-wide text-cream transition-colors hover:bg-brass"
      >
        Doğruladım, giriş yap
      </Link>

      <form action={formAction} className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full border border-line px-7 py-3 text-sm transition-colors hover:border-ink disabled:text-muted"
        >
          {pending ? "Gönderiliyor…" : "E-postayı tekrar gönder"}
        </button>

        <p
          role="status"
          aria-live="polite"
          className={`text-center text-sm ${
            state?.ok === false ? "text-brass" : "text-muted"
          } ${state ? "" : "sr-only"}`}
        >
          {state?.message ?? ""}
        </p>
      </form>
    </div>
  );
}
