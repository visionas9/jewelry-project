"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";

import { signIn, type SignInState } from "@/app/signin/actions";
import { takePendingEmail } from "@/lib/pending-email";

const FIELD =
  "w-full appearance-none rounded-2xl border border-line bg-cream px-4 py-3 text-base outline-none transition-colors placeholder:text-muted focus:border-ink";

// `children` is a slot for server-rendered hidden fields — the return path
// today. Rendering it here rather than reading the URL in this component keeps
// the form in the static shell: a client component that reads search params is
// dropped from the prerendered HTML entirely, and the whole form would flash in
// after hydration instead of being there on arrival.
export function SignInForm({ children }: { children?: React.ReactNode }) {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(
    signIn,
    null
  );
  const emailRef = useRef<HTMLInputElement>(null);

  // Filled after mount rather than through defaultValue. sessionStorage does
  // not exist on the server, so reading it while rendering would produce one
  // value in the HTML and another in the browser — the mismatch React throws
  // away the whole tree over.
  useEffect(() => {
    const input = emailRef.current;
    if (!input || input.value) return;

    const remembered = takePendingEmail();
    if (remembered) input.value = remembered;
  }, []);

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-5" noValidate>
      {children}

      <p
        role="alert"
        aria-live="polite"
        className={`text-sm text-brass ${state ? "" : "sr-only"}`}
      >
        {state?.message ?? ""}
      </p>

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm text-muted">
          E-posta
        </label>
        <input
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          defaultValue={state?.email ?? ""}
          aria-invalid={state ? true : undefined}
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
          // "current-password", unlike the sign-up form's "new-password": this
          // asks the password manager to fill a saved login rather than offer
          // to invent one.
          autoComplete="current-password"
          required
          className={FIELD}
        />
        {/* Under the field it belongs to, where someone who has just failed to
            remember it is already looking. Plain text rather than a hint: the
            visitor who needs this is stuck, and a subtle link is one more
            thing to hunt for. */}
        <Link
          href="/forgot-password"
          className="self-start text-sm text-muted underline hover:text-ink"
        >
          Şifrenizi mi unuttunuz?
        </Link>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-ink px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-brass disabled:bg-line disabled:text-muted"
      >
        {pending ? "Giriş yapılıyor…" : "Giriş yap"}
      </button>

      <p className="text-center text-sm text-muted">
        Hesabınız yok mu?{" "}
        <Link href="/signup" className="text-ink underline hover:text-brass">
          Kayıt olun
        </Link>
      </p>
    </form>
  );
}
