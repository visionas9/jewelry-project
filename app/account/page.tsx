import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { signOut } from "@/app/signout/actions";
import { createServerSupabase } from "@/lib/supabase-server";

export const metadata: Metadata = {
  title: "Hesabım",
  // Nothing here is meant for a search result, and there is nothing a signed-out
  // crawler could see anyway.
  robots: { index: false },
};

// The session read sits behind a Suspense boundary rather than at the top of
// the page. Everything outside the boundary still prerenders into the static
// shell; only the part that actually depends on who is asking waits for the
// request. Same shape as /welcome.
export default function AccountPage() {
  return (
    <section className="mx-auto max-w-md px-5 py-14 md:px-8 md:py-20">
      <h1 className="font-display text-3xl md:text-4xl">Hesabım</h1>

      <Suspense fallback={<Placeholder />}>
        <Account />
      </Suspense>
    </section>
  );
}

async function Account() {
  const supabase = await createServerSupabase();

  // getUser, not getSession: this is a real guard, so it has to verify the
  // token with Supabase rather than believe whatever the cookie says. The
  // header can afford getSession because it only picks a link; this cannot.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Straight to sign-in, with no record of where they were headed — this page
  // is the only account route so far, so there is nowhere else to come back to
  // yet. Carrying a return path belongs with the rest of the account routes.
  if (!user) redirect("/signin");

  return (
    <>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Hesabınız{" "}
        <span className="text-ink">{user.email}</span> adresine kayıtlı.
      </p>

      <p className="mt-4 text-sm leading-relaxed text-muted">
        Siparişleriniz ve kayıtlı bilgileriniz burada görünecek. Şimdilik
        hesabınız yalnızca giriş yapmanız için duruyor — sepetiniz hesabınızdan
        bağımsız olarak bu cihazda saklanır.
      </p>

      <form action={signOut} className="mt-8">
        <button
          type="submit"
          className="rounded-full border border-line px-7 py-3 text-sm transition-colors hover:border-ink"
        >
          Çıkış yap
        </button>
      </form>
    </>
  );
}

function Placeholder() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="mt-6 h-4 w-2/3 rounded-full bg-sand" />
      <div className="mt-4 h-4 w-full rounded-full bg-sand" />
      <div className="mt-8 h-12 w-36 rounded-full bg-sand" />
    </div>
  );
}
