"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { createBrowserSupabase } from "@/lib/supabase-browser";

// The one part of the header that knows who you are, and deliberately a client
// island — the same arrangement as CartBadge. Reading the session in the root
// layout instead would opt every page on the site out of its static shell: no
// error, no failing test, just a site that quietly got slower.
export function HeaderAuth() {
  // Three states, not two. `null` is "not known yet", and it is not the same as
  // signed out — rendering a sign-in link before the answer arrives is how a
  // signed-in member gets told to sign in for half a second.
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const pathname = usePathname();

  // Signing in and out both happen in Server Actions, which clear or set the
  // cookie server-side. The browser client fires no event for that, so the
  // session is re-read on every navigation — which is exactly when a sign-out
  // redirect lands here.
  useEffect(() => {
    const supabase = createBrowserSupabase();
    let active = true;

    // getSession, not getUser: this picks between two links and guards nothing.
    // getUser would spend a network round trip to Supabase on every navigation
    // to re-answer a question the cookie already answers. /account checks the
    // session on the server, which is where it matters.
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSignedIn(data.session !== null);
    });

    return () => {
      active = false;
    };
  }, [pathname]);

  // Everything the navigation misses: a token refresh, or another tab signing
  // out while this one sits open.
  useEffect(() => {
    const supabase = createBrowserSupabase();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(session !== null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    // Both labels are stacked in one grid cell, so the slot is always as wide
    // as the longer of the two. Without it the nav is right-anchored against a
    // link that isn't there yet, and every item visibly jumps left when the
    // session resolves.
    <span className="grid justify-items-start">
      <span aria-hidden className="invisible col-start-1 row-start-1">
        Giriş Yap
      </span>
      <span aria-hidden className="invisible col-start-1 row-start-1">
        Hesabım
      </span>

      {signedIn === null ? null : (
        <Link
          href={signedIn ? "/account" : "/signin"}
          className="col-start-1 row-start-1 inline-flex items-center text-muted transition-colors hover:text-ink"
        >
          {signedIn ? "Hesabım" : "Giriş Yap"}
        </Link>
      )}
    </span>
  );
}
