"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { createBrowserSupabase } from "@/lib/supabase-browser";

// The one part of the header that knows who you are, and deliberately a client
// island — the same arrangement as CartIcon. Reading the session in the root
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

  // An icon in both states, so the box is the same size whichever answer
  // arrives and nothing beside it moves when it does. The label is what
  // carries the difference — to a screen reader, and on hover.
  const label = signedIn ? "Hesabım" : "Giriş Yap";

  if (signedIn === null) return <AuthIconPlaceholder />;

  return (
    <Link
      href={signedIn ? "/account" : "/signin"}
      title={label}
      className="flex size-10 items-center justify-center rounded-full text-muted transition-colors hover:text-ink"
    >
      <AccountIcon />
      <span className="sr-only">{label}</span>
    </Link>
  );
}

// Holds the icon's place while the session is still an open question.
export function AuthIconPlaceholder() {
  return <span aria-hidden className="block size-10" />;
}

function AccountIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}
