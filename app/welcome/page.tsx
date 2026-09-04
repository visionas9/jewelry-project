import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { createServerSupabase } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Hoş geldiniz",
  // Nobody should reach this from a search result — it only makes sense
  // immediately after clicking a confirmation link.
  robots: { index: false },
};

// Nothing outside the boundary claims anything about the visitor. The static
// shell is deliberately empty: this page's whole content is "we verified you",
// and prerendering that is exactly how it came to greet signed-out strangers
// with a confirmation they never earned.
export default function WelcomePage() {
  return (
    <div className="mx-auto max-w-md px-5 py-16 md:px-8 md:py-24">
      <Suspense fallback={<Placeholder />}>
        <Confirmed />
      </Suspense>
    </div>
  );
}

async function Confirmed() {
  const supabase = await createServerSupabase();

  // getUser, not getSession: getSession trusts whatever the cookie claims,
  // while getUser asks Supabase to verify it. This page guards nothing
  // valuable, but a page that exists to say "we confirmed you" should not
  // take the visitor's word for it.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/signup");

  return (
    <>
      <h1 className="font-display text-3xl">E-postanız doğrulandı</h1>

      <p className="mt-4 text-sm leading-relaxed text-muted">
        Hesabınız hazır. Sepetinizdekiler olduğu gibi duruyor.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/products"
          className="rounded-full bg-ink px-7 py-3 text-center text-sm tracking-wide text-cream transition-colors hover:bg-clay"
        >
          Bilekliklere göz at
        </Link>
        <Link
          href="/cart"
          className="rounded-full border border-line px-7 py-3 text-center text-sm transition-colors hover:border-ink"
        >
          Sepete git
        </Link>
      </div>
    </>
  );
}

function Placeholder() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="h-9 w-3/4 rounded-full bg-sand" />
      <div className="mt-5 h-4 w-full rounded-full bg-sand" />
      <div className="mt-8 h-12 w-56 rounded-full bg-sand" />
    </div>
  );
}
