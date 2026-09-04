"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";

import {
  requestPasswordReset,
  type ResetRequestState,
} from "@/app/forgot-password/actions";
import { rememberPendingEmail } from "@/lib/pending-email";

import { Spinner } from "@/components/ui/Spinner";

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
        className={`text-sm text-clay ${error ? "" : "sr-only"}`}
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
        className="mt-2 rounded-full bg-ink px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-clay disabled:bg-line disabled:text-muted"
      >
        {pending ? <Busy label="Gönderiliyor…" /> : "Sıfırlama bağlantısı gönder"}
      </button>

      <p className="text-center text-sm text-muted">
        Şifrenizi hatırladınız mı?{" "}
        <Link href="/signin" className="text-ink underline hover:text-clay">
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
  // Left for the sign-in form to pick up. Finishing the reset on a phone
  // cannot sign this browser in — the session is a cookie, and cookies do not
  // travel between devices — so the least this can do is not ask for the
  // address again on the way back.
  useEffect(() => {
    rememberPendingEmail(email);
  }, [email]);

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

      <DoneButton />
    </div>
  );
}

// Nobody has changed their password five seconds after asking for the email —
// they have not even opened it. Holding the button shut for that long is what
// makes it read as the *last* step rather than another way out of this screen,
// and it costs someone who really is finished a pause they will spend reading
// the panel above anyway.
//
// Where it goes: /account, which is where the device that opened the link ends
// up. On this browser it lands on the sign-in form first and comes back
// afterwards, so one button serves both — the person who reset here, and the
// person who reset on their phone and came back to this tab.
const LABEL = "Şifremi değiştirdim, hesabıma git";

const BUTTON =
  "rounded-full px-7 py-3 text-center text-sm tracking-wide transition-colors";

function DoneButton() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  // A real disabled button while it waits, not a styled link with the clicks
  // swallowed: this way the keyboard skips it and a screen reader says it is
  // unavailable, which is the truth.
  if (!ready) {
    return (
      <button type="button" disabled className={`${BUTTON} bg-line text-muted`}>
        {LABEL}
      </button>
    );
  }

  return (
    <Link
      href="/account"
      className={`${BUTTON} bg-ink text-cream hover:bg-clay`}
    >
      {LABEL}
    </Link>
  );
}

// The label already changes; the ring says the wait is the site's, not theirs.
function Busy({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Spinner />
      {label}
    </span>
  );
}
