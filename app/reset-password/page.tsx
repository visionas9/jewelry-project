import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { NewPasswordForm } from "@/components/auth/NewPasswordForm";
import { createServerSupabase } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Yeni şifre belirleyin",
  // Nobody should reach this from a search result — it only makes sense
  // immediately after clicking a reset link.
  robots: { index: false },
};

// Nothing outside the boundary claims anything about the visitor, and the form
// is not in the static shell either: prerendering a "set your new password"
// form would show it to signed-out strangers for the moment before the session
// check came back. Same shape as /welcome.
export default function ResetPasswordPage() {
  return (
    <section className="mx-auto max-w-md px-5 py-14 md:px-8 md:py-20">
      <Suspense fallback={<Placeholder />}>
        <NewPassword />
      </Suspense>
    </section>
  );
}

async function NewPassword() {
  const supabase = await createServerSupabase();

  // Verifying the link is what signed them in, so a session is the proof that
  // they arrived through their own inbox. requireMember is not what we want
  // here: it would send them to /signin, which is exactly the page they could
  // not get past.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/forgot-password?error=invalid-link");

  return (
    <>
      <h1 className="font-display text-3xl md:text-4xl">Yeni şifreniz</h1>

      <p className="mt-3 text-sm leading-relaxed text-muted">
        <span className="text-ink">{user.email}</span> hesabı için yeni bir
        şifre belirleyin. Kaydettikten sonra giriş yapmış olarak devam
        edersiniz.
      </p>

      <NewPasswordForm />
    </>
  );
}

function Placeholder() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="h-9 w-2/3 rounded-full bg-sand" />
      <div className="mt-5 h-4 w-full rounded-full bg-sand" />
      <div className="mt-10 h-12 w-full rounded-2xl bg-sand" />
      <div className="mt-8 h-12 w-48 rounded-full bg-sand" />
    </div>
  );
}
