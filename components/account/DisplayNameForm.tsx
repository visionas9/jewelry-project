"use client";

import { useActionState } from "react";

import {
  updateDisplayName,
  type DisplayNameState,
} from "@/app/account/actions";
import { MAX_DISPLAY_NAME_LENGTH } from "@/lib/display-name";

import { Spinner } from "@/components/ui/Spinner";

const FIELD =
  "w-full appearance-none rounded-2xl border border-line bg-cream px-4 py-3 text-base outline-none transition-colors placeholder:text-muted focus:border-ink";

export function DisplayNameForm({ current }: { current: string | null }) {
  const [state, formAction, pending] = useActionState<
    DisplayNameState,
    FormData
  >(updateDisplayName, null);

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-2">
        <label htmlFor="displayName" className="text-sm text-muted">
          Görünen ad
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          autoComplete="nickname"
          // Uncontrolled, with the saved name as the starting point. After a
          // save the server sends a new `current`, but the field keeps what was
          // typed — which is the same text, so nothing jumps.
          defaultValue={current ?? ""}
          // The server decides; this only stops someone filling the box with a
          // paragraph before finding out.
          maxLength={MAX_DISPLAY_NAME_LENGTH}
          aria-describedby="display-name-hint"
          aria-invalid={state?.ok === false ? true : undefined}
          placeholder="Örneğin: Ayşe Y."
          className={FIELD}
        />
        <p id="display-name-hint" className="text-sm text-muted">
          Yorumlarınızda e-posta adresiniz yerine bu ad görünür. Boş
          bırakırsanız kaldırılır.
        </p>
      </div>

      {/* Stacks on a narrow screen and sits inline once there is room. The
          button is full width at 375px because a half-width tap target next to
          nothing is just a smaller tap target. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-ink px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-clay disabled:bg-line disabled:text-muted"
        >
          {pending ? <Busy label="Kaydediliyor…" /> : "Kaydet"}
        </button>

        {/* One region for both outcomes, announced politely. Kept in the tree
            when empty so a screen reader is not told a new region appeared
            every time somebody saves. */}
        <p
          role="status"
          aria-live="polite"
          className={`text-sm ${state?.ok === false ? "text-clay" : "text-muted"} ${
            state ? "" : "sr-only"
          }`}
        >
          {state?.message ?? ""}
        </p>
      </div>
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
