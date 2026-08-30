import type { Metadata } from "next";
import Link from "next/link";

import { signOut } from "./actions";

export const metadata: Metadata = {
  title: "Çıkış Yap",
  robots: { index: false },
};

// Deliberately a form with a button rather than something that signs you out
// on arrival. A plain GET that ended the session could be fired by any image
// tag on any site — <img src="…/signout"> — and members would be logged out by
// visiting an unrelated page. A POST cannot be forged that way.
//
// It reads no session, so the page stays static. Pressing the button while
// already signed out is harmless, and checking would cost every visitor a
// dynamic render to save a signed-out visitor from a no-op.
export default function SignOutPage() {
  return (
    <section className="mx-auto max-w-md px-5 py-14 md:px-8 md:py-20">
      <h1 className="font-display text-3xl">Çıkış yapılsın mı?</h1>

      <p className="mt-4 text-sm leading-relaxed text-muted">
        Hesabınızdan çıkacaksınız. Sepetinizdekiler bu cihazda kalmaya devam
        eder.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <form action={signOut}>
          <button
            type="submit"
            className="w-full rounded-full bg-ink px-7 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-brass sm:w-auto"
          >
            Çıkış yap
          </button>
        </form>

        <Link
          href="/"
          className="rounded-full border border-line px-7 py-3 text-center text-sm transition-colors hover:border-ink"
        >
          Vazgeç
        </Link>
      </div>
    </section>
  );
}
