"use client";

import { useActionState } from "react";

import {
  setNewPassword,
  type NewPasswordState,
} from "@/app/reset-password/actions";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth-errors";

import { Spinner } from "@/components/ui/Spinner";

const FIELD =
  "w-full appearance-none rounded-2xl border border-line bg-cream px-4 py-3 text-base outline-none transition-colors placeholder:text-muted focus:border-ink";

// One field, not two. A confirm field guards against a typo, and a typo here
// costs nothing: the visitor asks for another link and tries again. What it
// does cost is an extra field on a form someone is filling in while already
// annoyed at being locked out.
export function NewPasswordForm() {
  const [state, formAction, pending] = useActionState<NewPasswordState, FormData>(
    setNewPassword,
    null
  );

  return (
    <form action={formAction} className="mt-8 flex flex-col gap-5" noValidate>
      <p
        role="alert"
        aria-live="polite"
        className={`text-sm text-clay ${state ? "" : "sr-only"}`}
      >
        {state?.message ?? ""}
      </p>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm text-muted">
          Yeni şifre
        </label>
        <input
          id="password"
          name="password"
          type="password"
          // "new-password" is what asks a password manager to offer to
          // generate one, and to save the replacement rather than trying to
          // fill the old one in.
          autoComplete="new-password"
          required
          autoFocus
          minLength={MIN_PASSWORD_LENGTH}
          aria-invalid={state ? true : undefined}
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
        className="mt-2 rounded-full bg-ink px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-clay disabled:bg-line disabled:text-muted"
      >
        {pending ? <Busy label="Kaydediliyor…" /> : "Şifremi güncelle"}
      </button>
    </form>
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
